import { items } from '@wix/data';
import { auth } from '@wix/essentials';
import {
  COLLECTIONS,
  CONFIG_SINGLETON_ID,
  DEFAULT_APPEARANCE,
  DEFAULT_BRAND,
  DEFAULT_MODULES,
  DEFAULT_NOTIFICATION_LIMITS,
  DEFAULT_QUOTA,
  DEFAULT_SUPPORT,
  DEFAULT_SYNC_SETTINGS,
  DEFAULT_TRIGGER_RULES,
  DEFAULT_WHATSAPP_SETUP,
  PRICE_DROP_COOLDOWN_HOURS,
  type ModuleKey,
} from './constants';

export type SiteConfig = {
  _id: string;
  title: string;
  modules: Record<ModuleKey, boolean>;
  appearance: typeof DEFAULT_APPEARANCE;
  brand: typeof DEFAULT_BRAND;
  support: typeof DEFAULT_SUPPORT;
  monthlyAlertQuota: number;
  priceDropCooldownHours: number;
  digestFrequency: 'daily' | 'weekly' | 'off';
  sellerEmail: string;
  globalLowStockThreshold: number;
  lastDigestAt?: Date | string | null;
  /** Optional public app origin (legacy; no longer used for customer unsubscribe links). */
  publicAppBaseUrl?: string;
  notificationLimits: typeof DEFAULT_NOTIFICATION_LIMITS;
  triggerRules: typeof DEFAULT_TRIGGER_RULES;
  whatsappSetup: typeof DEFAULT_WHATSAPP_SETUP;
  syncSettings: typeof DEFAULT_SYNC_SETTINGS;
};

const elevate = {
  query: () => auth.elevate(items.query),
  get: () => auth.elevate(items.get),
  insert: () => auth.elevate(items.insert),
  update: () => auth.elevate(items.update),
  save: () => auth.elevate(items.save),
  remove: () => auth.elevate(items.remove),
};

export function elevatedData() {
  return elevate;
}

function normalizeConfig(raw: Partial<SiteConfig> & { _id?: string }): SiteConfig {
  const appearance = {
    ...DEFAULT_APPEARANCE,
    ...(raw.appearance || {}),
    colors: { ...DEFAULT_APPEARANCE.colors, ...(raw.appearance?.colors || {}) },
    buttons: {
      notifyMe: {
        ...DEFAULT_APPEARANCE.buttons.notifyMe,
        ...(raw.appearance as any)?.buttons?.notifyMe,
      },
      priceDrop: {
        ...DEFAULT_APPEARANCE.buttons.priceDrop,
        ...(raw.appearance as any)?.buttons?.priceDrop,
      },
      modalSubmit: {
        ...DEFAULT_APPEARANCE.buttons.modalSubmit,
        ...(raw.appearance as any)?.buttons?.modalSubmit,
      },
    },
    modal: {
      ...DEFAULT_APPEARANCE.modal,
      ...(raw.appearance as any)?.modal,
    },
  };
  const triggerRules = {
    ...DEFAULT_TRIGGER_RULES,
    ...(raw.triggerRules || {}),
    categoryLowStockDefaults: {
      ...DEFAULT_TRIGGER_RULES.categoryLowStockDefaults,
      ...(raw.triggerRules?.categoryLowStockDefaults || {}),
    },
    globalLowStockThreshold:
      raw.triggerRules?.globalLowStockThreshold ??
      raw.globalLowStockThreshold ??
      DEFAULT_TRIGGER_RULES.globalLowStockThreshold,
  };
  return {
    _id: raw._id || CONFIG_SINGLETON_ID,
    title: raw.title || 'Smart Alerts Config',
    modules: { ...DEFAULT_MODULES, ...(raw.modules || {}) },
    appearance,
    brand: { ...DEFAULT_BRAND, ...(raw.brand || {}) },
    support: { ...DEFAULT_SUPPORT, ...(raw.support || {}) },
    monthlyAlertQuota: raw.monthlyAlertQuota ?? DEFAULT_QUOTA,
    priceDropCooldownHours: raw.priceDropCooldownHours ?? PRICE_DROP_COOLDOWN_HOURS,
    digestFrequency: raw.digestFrequency || 'weekly',
    sellerEmail: raw.sellerEmail || '',
    globalLowStockThreshold: triggerRules.globalLowStockThreshold,
    lastDigestAt: raw.lastDigestAt ?? null,
    publicAppBaseUrl: raw.publicAppBaseUrl || '',
    notificationLimits: { ...DEFAULT_NOTIFICATION_LIMITS, ...(raw.notificationLimits || {}) },
    triggerRules,
    whatsappSetup: { ...DEFAULT_WHATSAPP_SETUP, ...(raw.whatsappSetup || {}) },
    syncSettings: { ...DEFAULT_SYNC_SETTINGS, ...(raw.syncSettings || {}) },
  };
}

export async function getOrCreateConfig(): Promise<SiteConfig> {
  const get = elevate.get();
  try {
    const existing = (await get(COLLECTIONS.config, CONFIG_SINGLETON_ID)) as SiteConfig | null;
    if (existing) {
      return normalizeConfig(existing);
    }
  } catch {
    // singleton missing
  }

  const defaults = normalizeConfig({
    _id: CONFIG_SINGLETON_ID,
    title: 'Smart Alerts Config',
  });

  try {
    const save = elevate.save();
    await save(COLLECTIONS.config, defaults);
  } catch (err) {
    // Collections may not be provisioned yet on a fresh install — still return defaults
    // so admin/start can render instead of hard-failing the whole worker request.
    console.error('Smart Alerts: failed to persist default config', err);
  }
  return defaults;
}

export async function updateConfig(patch: Partial<SiteConfig>): Promise<SiteConfig> {
  const current = await getOrCreateConfig();
  const merged: Partial<SiteConfig> = {
    ...current,
    ...patch,
    _id: CONFIG_SINGLETON_ID,
  };
  if (patch.modules) merged.modules = { ...current.modules, ...patch.modules };
  if (patch.appearance) {
    merged.appearance = {
      ...current.appearance,
      ...patch.appearance,
      colors: { ...current.appearance.colors, ...(patch.appearance.colors || {}) },
      buttons: {
        notifyMe: {
          ...current.appearance.buttons.notifyMe,
          ...(patch.appearance as any).buttons?.notifyMe,
        },
        priceDrop: {
          ...current.appearance.buttons.priceDrop,
          ...(patch.appearance as any).buttons?.priceDrop,
        },
        modalSubmit: {
          ...current.appearance.buttons.modalSubmit,
          ...(patch.appearance as any).buttons?.modalSubmit,
        },
      },
      modal: {
        ...current.appearance.modal,
        ...(patch.appearance as any).modal,
      },
    };
  }
  if (patch.brand) merged.brand = { ...current.brand, ...patch.brand };
  if (patch.support) merged.support = { ...current.support, ...patch.support };
  if (patch.notificationLimits) {
    merged.notificationLimits = { ...current.notificationLimits, ...patch.notificationLimits };
  }
  if (patch.triggerRules) {
    merged.triggerRules = {
      ...current.triggerRules,
      ...patch.triggerRules,
      categoryLowStockDefaults: {
        ...current.triggerRules.categoryLowStockDefaults,
        ...(patch.triggerRules.categoryLowStockDefaults || {}),
      },
    };
    if (patch.triggerRules.globalLowStockThreshold != null) {
      merged.globalLowStockThreshold = patch.triggerRules.globalLowStockThreshold;
    }
  }
  if (patch.globalLowStockThreshold != null) {
    merged.globalLowStockThreshold = patch.globalLowStockThreshold;
    merged.triggerRules = {
      ...(merged.triggerRules || current.triggerRules),
      globalLowStockThreshold: patch.globalLowStockThreshold,
    };
  }
  if (patch.whatsappSetup) {
    merged.whatsappSetup = { ...current.whatsappSetup, ...patch.whatsappSetup };
  }
  if (patch.syncSettings) {
    merged.syncSettings = { ...current.syncSettings, ...patch.syncSettings };
  }

  const next = normalizeConfig(merged);
  const update = elevate.update();
  await update(COLLECTIONS.config, next);
  return next;
}

export function isModuleEnabled(config: SiteConfig, key: ModuleKey): boolean {
  return Boolean(config.modules?.[key]);
}

export function getLowStockThreshold(
  config: SiteConfig,
  override?: { useGlobalThreshold?: boolean; lowStockThreshold?: number; categoryId?: string } | null,
): number {
  if (override?.useGlobalThreshold === false && override.lowStockThreshold != null) {
    return Number(override.lowStockThreshold);
  }
  const categoryId = override?.categoryId;
  if (categoryId && config.triggerRules.categoryLowStockDefaults[categoryId] != null) {
    return Number(config.triggerRules.categoryLowStockDefaults[categoryId]);
  }
  return Number(
    config.triggerRules.globalLowStockThreshold ?? config.globalLowStockThreshold ?? 5,
  );
}

export async function markEventProcessed(eventId: string, eventType: string): Promise<boolean> {
  if (!eventId) return false;
  const query = elevate.query();
  const found = await query(COLLECTIONS.processedEvents).eq('eventId', eventId).limit(1).find();
  if (found.items.length > 0) return true;

  const insert = elevate.insert();
  await insert(COLLECTIONS.processedEvents, {
    title: eventId,
    eventId,
    eventType,
    processedAt: new Date(),
  });
  return false;
}

export async function stampSyncEvent(eventType: string) {
  // Avoid full config rewrite races on hot event paths — best-effort stamp only.
  try {
    const current = await getOrCreateConfig();
    await updateConfig({
      syncSettings: {
        ...current.syncSettings,
        lastEventAt: new Date().toISOString(),
        lastEventType: eventType,
      },
    });
  } catch {
    /* ignore stamp failures */
  }
}

