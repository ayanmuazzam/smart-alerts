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
import {
  clampNonNegative,
  clampPositiveInt,
  isValidEmail,
  sanitizeColorMap,
  safeUrl,
} from './sanitize';

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

const MODULE_KEYS = Object.keys(DEFAULT_MODULES) as ModuleKey[];

function sanitizePatch(patch: Partial<SiteConfig>): Partial<SiteConfig> {
  const out: Partial<SiteConfig> = { ...patch };

  if (patch.sellerEmail != null) {
    const email = String(patch.sellerEmail).trim();
    if (email && !isValidEmail(email)) {
      throw new Error('Invalid sellerEmail');
    }
    out.sellerEmail = email;
  }

  if (patch.support) {
    const supportEmail = String(patch.support.supportEmail || '').trim();
    if (supportEmail && !isValidEmail(supportEmail)) {
      throw new Error('Invalid supportEmail');
    }
    out.support = {
      ...DEFAULT_SUPPORT,
      ...patch.support,
      supportEmail,
      supportWhatsapp: String(patch.support.supportWhatsapp || '').trim(),
    };
  }

  if (patch.monthlyAlertQuota != null) {
    out.monthlyAlertQuota = clampPositiveInt(patch.monthlyAlertQuota, DEFAULT_QUOTA, 1_000_000);
  }
  if (patch.priceDropCooldownHours != null) {
    out.priceDropCooldownHours = clampPositiveInt(
      patch.priceDropCooldownHours,
      PRICE_DROP_COOLDOWN_HOURS,
      8760,
    );
  }
  if (patch.globalLowStockThreshold != null) {
    out.globalLowStockThreshold = clampPositiveInt(patch.globalLowStockThreshold, 5, 100000);
  }
  if (patch.digestFrequency != null) {
    const f = String(patch.digestFrequency);
    if (!['daily', 'weekly', 'off'].includes(f)) {
      throw new Error('Invalid digestFrequency');
    }
    out.digestFrequency = f as SiteConfig['digestFrequency'];
  }

  if (patch.modules) {
    const modules = { ...DEFAULT_MODULES };
    for (const key of MODULE_KEYS) {
      if (key in patch.modules) modules[key] = Boolean(patch.modules[key]);
    }
    out.modules = modules;
  }

  if (patch.appearance) {
    const colors = sanitizeColorMap(
      patch.appearance.colors as Record<string, unknown> | undefined,
      DEFAULT_APPEARANCE.colors,
    );
    out.appearance = {
      ...DEFAULT_APPEARANCE,
      ...patch.appearance,
      colors: colors as typeof DEFAULT_APPEARANCE.colors,
      stockThreshold: clampPositiveInt(
        (patch.appearance as any).stockThreshold ?? DEFAULT_APPEARANCE.stockThreshold,
        DEFAULT_APPEARANCE.stockThreshold,
        100000,
      ),
    };
  }

  if (patch.brand) {
    out.brand = {
      ...DEFAULT_BRAND,
      ...patch.brand,
      primaryColor: sanitizeColorMap(
        { primaryColor: patch.brand.primaryColor },
        { primaryColor: DEFAULT_BRAND.primaryColor },
      ).primaryColor,
      secondaryColor: sanitizeColorMap(
        { secondaryColor: patch.brand.secondaryColor },
        { secondaryColor: DEFAULT_BRAND.secondaryColor },
      ).secondaryColor,
      logoUrl: safeUrl(patch.brand.logoUrl, ''),
      footerText: String(patch.brand.footerText || ''),
    };
  }

  if (patch.notificationLimits) {
    out.notificationLimits = {
      maxEmailPerCustomerPerDay: clampPositiveInt(
        patch.notificationLimits.maxEmailPerCustomerPerDay,
        DEFAULT_NOTIFICATION_LIMITS.maxEmailPerCustomerPerDay,
        100,
      ),
      maxEmailPerCustomerPerWeek: clampPositiveInt(
        patch.notificationLimits.maxEmailPerCustomerPerWeek,
        DEFAULT_NOTIFICATION_LIMITS.maxEmailPerCustomerPerWeek,
        500,
      ),
      maxWhatsappPerCustomerPerDay: clampPositiveInt(
        patch.notificationLimits.maxWhatsappPerCustomerPerDay,
        DEFAULT_NOTIFICATION_LIMITS.maxWhatsappPerCustomerPerDay,
        50,
      ),
      batchMode: patch.notificationLimits.batchMode === 'hourly' ? 'hourly' : 'immediate',
      batchHourUtc: Math.min(
        23,
        Math.max(0, Math.floor(Number(patch.notificationLimits.batchHourUtc ?? 9)) || 0),
      ),
    };
  }

  if (patch.triggerRules) {
    out.triggerRules = {
      ...DEFAULT_TRIGGER_RULES,
      ...patch.triggerRules,
      backInStockMinQty: clampPositiveInt(
        patch.triggerRules.backInStockMinQty,
        DEFAULT_TRIGGER_RULES.backInStockMinQty,
      ),
      priceDropMinPercent: clampNonNegative(
        patch.triggerRules.priceDropMinPercent,
        DEFAULT_TRIGGER_RULES.priceDropMinPercent,
        100,
      ),
      priceDropMinAmount: clampNonNegative(
        patch.triggerRules.priceDropMinAmount,
        DEFAULT_TRIGGER_RULES.priceDropMinAmount,
      ),
      globalLowStockThreshold: clampPositiveInt(
        patch.triggerRules.globalLowStockThreshold,
        DEFAULT_TRIGGER_RULES.globalLowStockThreshold,
      ),
      categoryLowStockDefaults: patch.triggerRules.categoryLowStockDefaults || {},
    };
  }

  if (patch.whatsappSetup) {
    const mode = patch.whatsappSetup.mode === 'api' ? 'api' : 'manual';
    const provider = patch.whatsappSetup.provider === 'twilio' ? 'twilio' : 'none';
    out.whatsappSetup = {
      ...DEFAULT_WHATSAPP_SETUP,
      ...patch.whatsappSetup,
      mode,
      provider,
      senderPhone: String(patch.whatsappSetup.senderPhone || '').trim(),
    };
  }

  return out;
}

function normalizeConfig(raw: Partial<SiteConfig> & { _id?: string }): SiteConfig {
  const appearance = {
    ...DEFAULT_APPEARANCE,
    ...(raw.appearance || {}),
    colors: sanitizeColorMap(
      { ...DEFAULT_APPEARANCE.colors, ...(raw.appearance?.colors || {}) } as Record<string, unknown>,
      DEFAULT_APPEARANCE.colors,
    ) as typeof DEFAULT_APPEARANCE.colors,
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
  const digest =
    raw.digestFrequency === 'daily' ||
    raw.digestFrequency === 'weekly' ||
    raw.digestFrequency === 'off'
      ? raw.digestFrequency
      : 'weekly';
  return {
    _id: raw._id || CONFIG_SINGLETON_ID,
    title: raw.title || 'Smart Alerts Config',
    modules: { ...DEFAULT_MODULES, ...(raw.modules || {}) },
    appearance,
    brand: {
      ...DEFAULT_BRAND,
      ...(raw.brand || {}),
      primaryColor: sanitizeColorMap(
        { c: raw.brand?.primaryColor },
        { c: DEFAULT_BRAND.primaryColor },
      ).c,
      secondaryColor: sanitizeColorMap(
        { c: raw.brand?.secondaryColor },
        { c: DEFAULT_BRAND.secondaryColor },
      ).c,
      logoUrl: safeUrl(raw.brand?.logoUrl, DEFAULT_BRAND.logoUrl || ''),
    },
    support: { ...DEFAULT_SUPPORT, ...(raw.support || {}) },
    monthlyAlertQuota: clampPositiveInt(raw.monthlyAlertQuota, DEFAULT_QUOTA),
    priceDropCooldownHours: clampPositiveInt(raw.priceDropCooldownHours, PRICE_DROP_COOLDOWN_HOURS),
    digestFrequency: digest,
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
    console.error('Smart Alerts: failed to persist default config', err);
  }
  return defaults;
}

export async function updateConfig(patch: Partial<SiteConfig>): Promise<SiteConfig> {
  const safePatch = sanitizePatch(patch);
  const current = await getOrCreateConfig();
  const merged: Partial<SiteConfig> = {
    ...current,
    ...safePatch,
    _id: CONFIG_SINGLETON_ID,
  };
  if (safePatch.modules) merged.modules = { ...current.modules, ...safePatch.modules };
  if (safePatch.appearance) {
    merged.appearance = {
      ...current.appearance,
      ...safePatch.appearance,
      colors: { ...current.appearance.colors, ...(safePatch.appearance.colors || {}) },
      buttons: {
        notifyMe: {
          ...current.appearance.buttons.notifyMe,
          ...(safePatch.appearance as any).buttons?.notifyMe,
        },
        priceDrop: {
          ...current.appearance.buttons.priceDrop,
          ...(safePatch.appearance as any).buttons?.priceDrop,
        },
        modalSubmit: {
          ...current.appearance.buttons.modalSubmit,
          ...(safePatch.appearance as any).buttons?.modalSubmit,
        },
      },
      modal: {
        ...current.appearance.modal,
        ...(safePatch.appearance as any).modal,
      },
    };
  }
  if (safePatch.brand) merged.brand = { ...current.brand, ...safePatch.brand };
  if (safePatch.support) merged.support = { ...current.support, ...safePatch.support };
  if (safePatch.notificationLimits) {
    merged.notificationLimits = { ...current.notificationLimits, ...safePatch.notificationLimits };
  }
  if (safePatch.triggerRules) {
    merged.triggerRules = {
      ...current.triggerRules,
      ...safePatch.triggerRules,
      categoryLowStockDefaults: {
        ...current.triggerRules.categoryLowStockDefaults,
        ...(safePatch.triggerRules.categoryLowStockDefaults || {}),
      },
    };
    if (safePatch.triggerRules.globalLowStockThreshold != null) {
      merged.globalLowStockThreshold = safePatch.triggerRules.globalLowStockThreshold;
    }
  }
  if (safePatch.globalLowStockThreshold != null) {
    merged.globalLowStockThreshold = safePatch.globalLowStockThreshold;
    merged.triggerRules = {
      ...(merged.triggerRules || current.triggerRules),
      globalLowStockThreshold: safePatch.globalLowStockThreshold,
    };
  }
  if (safePatch.whatsappSetup) {
    merged.whatsappSetup = { ...current.whatsappSetup, ...safePatch.whatsappSetup };
  }
  if (safePatch.syncSettings) {
    merged.syncSettings = { ...current.syncSettings, ...safePatch.syncSettings };
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
  override?: {
    useGlobalThreshold?: boolean;
    lowStockThreshold?: number;
    categoryId?: string;
  } | null,
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
  if (!eventId) {
    console.warn('Smart Alerts: missing event id; refusing to process');
    return true;
  }
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

let stampTimer: ReturnType<typeof setTimeout> | null = null;
let pendingStampType = '';

export async function stampSyncEvent(eventType: string) {
  pendingStampType = eventType;
  if (stampTimer) return;
  stampTimer = setTimeout(async () => {
    stampTimer = null;
    const type = pendingStampType;
    try {
      const current = await getOrCreateConfig();
      await updateConfig({
        syncSettings: {
          ...current.syncSettings,
          lastEventAt: new Date().toISOString(),
          lastEventType: type,
        },
      });
    } catch {
      /* ignore stamp failures */
    }
  }, 2000);
}
