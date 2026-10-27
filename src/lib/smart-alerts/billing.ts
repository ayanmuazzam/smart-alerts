import { appInstances } from '@wix/app-management';
import { auth } from '@wix/essentials';
import {
  buildAppUpgradeUrl,
  DEFAULT_QUOTA,
  PLAN_OVERRIDE,
  PLAN_PRODUCT_IDS,
} from './constants';
import { getOrCreateConfig, updateConfig, type SiteConfig } from './config';

export type PlanEntitlements = {
  isPro: boolean;
  isFree: boolean;
  productId: string;
  packageName: string;
  instanceId: string;
  /** Official Wix pricing page for this install. */
  upgradeUrl: string;
  canEditAccountSettings: boolean;
  /** True when PLAN_OVERRIDE is set (local testing only). */
  overridden: boolean;
};

type InstanceSlice = {
  instanceId?: string;
  isFree?: boolean;
  billing?: { packageName?: string | null };
};

function normalizePlanId(value: unknown): string {
  return String(value || '')
    .trim()
    .toLowerCase();
}

/** Resolve Basic vs Pro from Get App Instance (`isFree` + `billing.packageName`). */
export function resolvePlanEntitlements(instance?: InstanceSlice | null): PlanEntitlements {
  const instanceId = String(instance?.instanceId || '').trim();
  const packageName = String(instance?.billing?.packageName || '').trim();

  // Local test flip — PLAN_OVERRIDE null = production (real Wix billing).
  if (PLAN_OVERRIDE === PLAN_PRODUCT_IDS.PRO || PLAN_OVERRIDE === PLAN_PRODUCT_IDS.BASIC) {
    const isPro = PLAN_OVERRIDE === PLAN_PRODUCT_IDS.PRO;
    if (typeof console !== 'undefined') {
      console.warn(
        `[smart-alerts] PLAN_OVERRIDE=${PLAN_OVERRIDE} (local test). Set to null before production.`,
      );
    }
    return {
      isPro,
      isFree: !isPro,
      productId: isPro ? PLAN_PRODUCT_IDS.PRO : PLAN_PRODUCT_IDS.BASIC,
      packageName: PLAN_OVERRIDE,
      instanceId,
      upgradeUrl: buildAppUpgradeUrl(instanceId),
      canEditAccountSettings: isPro,
      overridden: true,
    };
  }

  const isFree = instance?.isFree !== false;
  const productId = normalizePlanId(packageName);

  let isPro = false;
  if (!isFree) {
    if (!productId || productId === PLAN_PRODUCT_IDS.PRO) {
      isPro = true;
    } else if (productId === PLAN_PRODUCT_IDS.BASIC) {
      isPro = false;
    } else {
      // Only paid SKU is Pro — treat unknown paid packages as Pro.
      isPro = true;
    }
  }

  return {
    isPro,
    isFree: !isPro,
    productId: isPro ? PLAN_PRODUCT_IDS.PRO : PLAN_PRODUCT_IDS.BASIC,
    packageName,
    instanceId,
    upgradeUrl: buildAppUpgradeUrl(instanceId),
    canEditAccountSettings: isPro,
    overridden: false,
  };
}

export async function getPlanEntitlements(): Promise<PlanEntitlements> {
  try {
    const get = auth.elevate(appInstances.getAppInstance);
    const res = await get();
    const instance = (res as { instance?: InstanceSlice })?.instance;
    return resolvePlanEntitlements(instance);
  } catch (err) {
    console.warn('[smart-alerts] getPlanEntitlements failed; defaulting to Basic', err);
    return resolvePlanEntitlements({ isFree: true });
  }
}

/** Quota used for send checks and UI meters. */
export function effectiveMonthlyQuota(
  entitlements: PlanEntitlements,
  configQuota: number | undefined,
): number {
  if (!entitlements.isPro) return DEFAULT_QUOTA;
  return Math.max(1, Number(configQuota) || DEFAULT_QUOTA);
}

/**
 * On Basic/cancel: force stored quota back to DEFAULT_QUOTA so a prior Pro
 * custom limit cannot bypass the free cap.
 */
export async function syncQuotaForPlan(
  entitlements?: PlanEntitlements,
): Promise<{ entitlements: PlanEntitlements; config: SiteConfig }> {
  const plan = entitlements || (await getPlanEntitlements());
  const config = await getOrCreateConfig();
  if (!plan.isPro && config.monthlyAlertQuota !== DEFAULT_QUOTA) {
    const next = await updateConfig({ monthlyAlertQuota: DEFAULT_QUOTA });
    return { entitlements: plan, config: next };
  }
  return { entitlements: plan, config };
}

/** Strip account fields Free users must not change. */
export function gateAccountSettingsPatch(
  patch: Record<string, unknown>,
  entitlements: PlanEntitlements,
): Record<string, unknown> {
  if (entitlements.isPro) return patch;
  const next = { ...patch };
  delete next.sellerEmail;
  delete next.monthlyAlertQuota;
  return next;
}
