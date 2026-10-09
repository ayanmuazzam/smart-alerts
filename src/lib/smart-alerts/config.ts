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
  DEFAULT_SYNC_SETTINGS,
  DEFAULT_TRIGGER_RULES,
  DEFAULT_WHATSAPP_SETUP,
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
  monthlyAlertQuota: number;
  sellerEmail: string;
  globalLowStockThreshold: number;
  /** Optional public app origin (legacy; no longer used for customer unsubscribe links). */
  publicAppBaseUrl?: string;
  notificationLimits: typeof DEFAULT_NOTIFICATION_LIMITS;
  triggerRules: typeof DEFAULT_TRIGGER_RULES;
  whatsappSetup: typeof DEFAULT_WHATSAPP_SETUP;
  syncSettings: typeof DEFAULT_SYNC_SETTINGS;
};

/** Partial update payload — nested objects may be shallow-partial (merged on write). */
export type SiteConfigPatch = {
  [K in keyof SiteConfig]?: SiteConfig[K] extends Record<string, unknown>
    ? Partial<SiteConfig[K]>
    : SiteConfig[K];
};

const elevate = {
  query: () => auth.elevate(items.query),
  get: () => auth.elevate(items.get),
  insert: () => auth.elevate(items.insert),
  update: () => auth.elevate(items.update),
  patch: () => auth.elevate(items.patch),
  save: () => auth.elevate(items.save),
  remove: () => auth.elevate(items.remove),
};

/** Prefer strong consistency when reading the singleton before / after writes. */
const CONSISTENT_READ = { consistentRead: true } as const;

/** Serialize config writes in this isolate so stamp/sync cannot clobber settings saves. */
let configWriteChain: Promise<unknown> = Promise.resolve();

function isMissingItemError(err: unknown): boolean {
  const anyErr = err as {
    message?: string;
    code?: string;
    details?: { applicationError?: { code?: string } };
    applicationError?: { code?: string };
  };
  const msg = String(anyErr?.message || err || '');
  const code = String(
    anyErr?.details?.applicationError?.code ||
      anyErr?.applicationError?.code ||
      anyErr?.code ||
      '',
  );
  return (
    /not found|does not exist|no such item/i.test(msg) ||
    /WDE0073|WDE0026|NOT_FOUND|ITEM_NOT_FOUND/i.test(code)
  );
}

const MODULE_KEYS = Object.keys(DEFAULT_MODULES) as ModuleKey[];

function sanitizePatch(patch: SiteConfigPatch): SiteConfigPatch {
  const out: SiteConfigPatch = { ...patch };

  if (patch.sellerEmail != null) {
    const email = String(patch.sellerEmail).trim();
    if (email && !isValidEmail(email)) {
      throw new Error('Invalid sellerEmail');
    }
    out.sellerEmail = email;
  }

  if (patch.monthlyAlertQuota != null) {
    out.monthlyAlertQuota = clampPositiveInt(patch.monthlyAlertQuota, DEFAULT_QUOTA, 1_000_000);
  }
  if (patch.globalLowStockThreshold != null) {
    out.globalLowStockThreshold = clampPositiveInt(patch.globalLowStockThreshold, 5, 100000);
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
    };
  }

  if (patch.notificationLimits) {
    // batchMode hourly has no scheduler after cron removal — force immediate.
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
      batchMode: 'immediate',
      batchHourUtc: DEFAULT_NOTIFICATION_LIMITS.batchHourUtc,
    };
  }

  if (patch.triggerRules) {
    out.triggerRules = {
      ...DEFAULT_TRIGGER_RULES,
      ...patch.triggerRules,
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
    out.whatsappSetup = {
      ...DEFAULT_WHATSAPP_SETUP,
      mode: 'manual',
      provider: 'none',
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
  const modulesRaw = { ...DEFAULT_MODULES, ...(raw.modules || {}) } as Record<string, boolean>;
  delete modulesRaw.digest;
  return {
    _id: raw._id || CONFIG_SINGLETON_ID,
    title: raw.title || 'Smart Alerts Config',
    modules: modulesRaw as Record<ModuleKey, boolean>,
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
    monthlyAlertQuota: clampPositiveInt(raw.monthlyAlertQuota, DEFAULT_QUOTA),
    sellerEmail: raw.sellerEmail || '',
    globalLowStockThreshold: triggerRules.globalLowStockThreshold,
    publicAppBaseUrl: raw.publicAppBaseUrl || '',
    notificationLimits: {
      ...DEFAULT_NOTIFICATION_LIMITS,
      ...(raw.notificationLimits || {}),
      batchMode: 'immediate',
    },
    triggerRules,
    whatsappSetup: {
      ...DEFAULT_WHATSAPP_SETUP,
      ...(raw.whatsappSetup || {}),
      mode: 'manual',
      provider: 'none',
    },
    syncSettings: { ...DEFAULT_SYNC_SETTINGS, ...(raw.syncSettings || {}) },
  };
}

async function readConfigDocument(): Promise<SiteConfig | null> {
  const get = elevate.get();
  try {
    const existing = (await get(
      COLLECTIONS.config,
      CONFIG_SINGLETON_ID,
      CONSISTENT_READ,
    )) as SiteConfig | null;
    return existing ? normalizeConfig(existing) : null;
  } catch (err) {
    if (isMissingItemError(err)) return null;
    throw err;
  }
}

export async function getOrCreateConfig(): Promise<SiteConfig> {
  try {
    const existing = await readConfigDocument();
    if (existing) return existing;
  } catch (err) {
    // Transient read failure: never persist defaults (that used to wipe sellerEmail).
    console.error('Smart Alerts: config read failed; using ephemeral defaults', err);
    return normalizeConfig({
      _id: CONFIG_SINGLETON_ID,
      title: 'Smart Alerts Config',
    });
  }

  const defaults = normalizeConfig({
    _id: CONFIG_SINGLETON_ID,
    title: 'Smart Alerts Config',
  });

  try {
    // insert (not save) so a race cannot overwrite an existing singleton.
    const insert = elevate.insert();
    await insert(COLLECTIONS.config, defaults);
  } catch (err) {
    try {
      const again = await readConfigDocument();
      if (again) return again;
    } catch (readErr) {
      console.error('Smart Alerts: failed to persist default config', err, readErr);
    }
  }
  return defaults;
}

function mergeConfigPatch(current: SiteConfig, safePatch: SiteConfigPatch): SiteConfig {
  const merged: Partial<SiteConfig> = {
    ...current,
    ...(safePatch as Partial<SiteConfig>),
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
  return normalizeConfig(merged);
}

/**
 * Persist only fields present in `patch`. Uses Data `patch` so concurrent writers
 * (e.g. inventory sync stamping syncSettings) cannot wipe sellerEmail / quota.
 */
async function updateConfigUnlocked(patch: SiteConfigPatch): Promise<SiteConfig> {
  const safePatch = sanitizePatch(patch);
  let current: SiteConfig;
  try {
    const existing = await readConfigDocument();
    current = existing || (await getOrCreateConfig());
  } catch (err) {
    throw new Error(
      `Cannot update config: read failed (${err instanceof Error ? err.message : String(err)})`,
    );
  }

  const next = mergeConfigPatch(current, safePatch);

  const mods = items.FieldModificationsBuilder();
  let touched = 0;
  const setIf = (requested: boolean, field: keyof SiteConfig, value: unknown) => {
    if (!requested) return;
    mods.setField(field, value);
    touched += 1;
  };

  setIf(patch.title != null, 'title', next.title);
  setIf(Boolean(patch.modules), 'modules', next.modules);
  setIf(Boolean(patch.appearance), 'appearance', next.appearance);
  setIf(Boolean(patch.brand), 'brand', next.brand);
  setIf(patch.monthlyAlertQuota != null, 'monthlyAlertQuota', next.monthlyAlertQuota);
  setIf(patch.sellerEmail != null, 'sellerEmail', next.sellerEmail);
  setIf(
    patch.globalLowStockThreshold != null || patch.triggerRules?.globalLowStockThreshold != null,
    'globalLowStockThreshold',
    next.globalLowStockThreshold,
  );
  setIf(patch.publicAppBaseUrl != null, 'publicAppBaseUrl', next.publicAppBaseUrl || '');
  setIf(Boolean(patch.notificationLimits), 'notificationLimits', next.notificationLimits);
  setIf(Boolean(patch.triggerRules), 'triggerRules', next.triggerRules);
  setIf(Boolean(patch.whatsappSetup), 'whatsappSetup', next.whatsappSetup);
  setIf(Boolean(patch.syncSettings), 'syncSettings', next.syncSettings);

  if (touched === 0) return current;

  try {
    const patched = (await elevate.patch()(
      COLLECTIONS.config,
      CONFIG_SINGLETON_ID,
      mods.build(),
    )) as SiteConfig;
    return normalizeConfig(patched);
  } catch (err) {
    // App collections that reject patch still need a write path.
    console.warn('Smart Alerts: config patch failed, falling back to full update', err);
    const update = elevate.update();
    await update(COLLECTIONS.config, next);
    return next;
  }
}

export async function updateConfig(patch: SiteConfigPatch): Promise<SiteConfig> {
  const run = configWriteChain.then(() => updateConfigUnlocked(patch));
  // Keep the chain alive even when a write fails so later saves still serialize.
  configWriteChain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
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
  // Missing ids still process (some local/dev deliveries omit metadata.id).
  // Without an id we cannot de-dupe — prefer sending over silently dropping restocks.
  if (!eventId) {
    console.warn(`Smart Alerts: missing event id for ${eventType}; processing without de-dupe`);
    return false;
  }
  const query = elevate.query();
  const found = await query(COLLECTIONS.processedEvents).eq('eventId', eventId).limit(1).find();
  if (found.items.length > 0) return true;

  try {
    const insert = elevate.insert();
    await insert(COLLECTIONS.processedEvents, {
      title: eventId,
      eventId,
      eventType,
      processedAt: new Date(),
    });
    return false;
  } catch (err) {
    // Concurrent webhook deliveries: unique index on eventId — treat as already claimed.
    const msg = err instanceof Error ? err.message : String(err);
    if (/unique|duplicate|already exists|WDE0074|E11000/i.test(msg)) {
      return true;
    }
    throw err;
  }
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
      // Partial patch only — must not rewrite unrelated fields like sellerEmail.
      await updateConfig({
        syncSettings: {
          lastEventAt: new Date().toISOString(),
          lastEventType: type,
        },
      });
    } catch {
      /* ignore stamp failures */
    }
  }, 2000);
}
