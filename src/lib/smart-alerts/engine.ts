import {
  getOrCreateConfig,
  getLowStockThreshold,
  isModuleEnabled,
  markEventProcessed,
  stampSyncEvent,
  updateConfig,
  type SiteConfig,
} from './config';
import {
  buildEmailHtml,
  getTemplate,
  renderTokens,
  sendTransactionalEmail,
} from './email';
import {
  cancelWaitingByProduct,
  findWaitingByProduct,
  markNotified,
} from './subscriptions';
import { getOverride, getProductSnapshot, getFirstProductSnapshot, loadOutOfStockProducts, upsertProductOverride } from './products';
import { getDefaultEmailTemplate } from './constants';
import { mapPool } from './map-pool';
import { getSiteStoreName } from './site-timezone';

/** Cap fan-out per webhook event to keep handlers under time limits. */
const NOTIFY_CHUNK_SIZE = 200;
const NOTIFY_MAX_CHUNKS = 5; // up to 1000 waiters per event
const NOTIFY_CONCURRENCY = 5;

async function storeIdentity(): Promise<{ storeName: string; replyTo: string }> {
  const cfg = await getOrCreateConfig();
  const storeName = await getSiteStoreName();
  return {
    storeName,
    replyTo: cfg.sellerEmail || cfg.support?.supportEmail || '',
  };
}

function meetsPriceDropRules(
  config: SiteConfig,
  baselinePrice: number,
  newPrice: number,
): boolean {
  if (!(baselinePrice > 0 && newPrice > 0 && newPrice < baselinePrice)) return false;
  const dropAmount = baselinePrice - newPrice;
  const dropPercent = (dropAmount / baselinePrice) * 100;
  const minAmount = Number(config.triggerRules?.priceDropMinAmount ?? 0);
  const minPercent = Number(config.triggerRules?.priceDropMinPercent ?? 0);
  if (minAmount > 0 && dropAmount < minAmount) return false;
  if (minPercent > 0 && dropPercent < minPercent) return false;
  return true;
}

/**
 * Resolve product id from Catalog V1 / V3 product webhook shapes.
 * V1 changed: { productId, changedFields } (sometimes under data).
 * V3 updated: entityId / entity._id / updatedEvent.currentEntityAsJson.id
 */
function resolveProductUpdateId(event: Record<string, any>): string {
  return String(
    event.entity?._id ||
      event.entity?.id ||
      event.entityId ||
      event.metadata?.entityId ||
      event.productId ||
      event.data?.productId ||
      event.data?.product?._id ||
      event.data?.product?.id ||
      event.updatedEvent?.currentEntityAsJson?.id ||
      event.data?.updatedEvent?.currentEntityAsJson?.id ||
      '',
  ).trim();
}

async function deliverFromTemplate(opts: {
  triggerType: string;
  to: string;
  alertType: string;
  productId?: string;
  tokens: Record<string, string | number | undefined>;
  buttonUrl?: string;
  productImage?: string;
}) {
  const config = await getOrCreateConfig();
  const stored = (await getTemplate(opts.triggerType)) as Record<string, unknown>;
  const defaults = getDefaultEmailTemplate(opts.triggerType);
  // CMS templates may have blank subject/body — fill from defaults so Wix never gets empty subject.
  const template = {
    ...defaults,
    ...Object.fromEntries(
      Object.entries(stored).filter(([, v]) => v !== '' && v != null),
    ),
  };
  // Store-manager alerts never include shopper marketing blocks.
  const isSellerAlert =
    opts.triggerType === 'seller_low_stock' || opts.triggerType === 'seller_oos';
  if (isSellerAlert) {
    template.reviewQuote = '';
    template.showFeatures = false;
    template.featuresTitle = '';
    template.featuresText = '';
  }
  const identity = await storeIdentity();
  const tokens = {
    store_name: identity.storeName,
    customer_name: 'there',
    ...opts.tokens,
  };
  const subject =
    renderTokens(String(template.subject || defaults.subject), tokens).trim() ||
    renderTokens(defaults.subject, tokens);
  const headline = renderTokens(String(template.headline || defaults.headline || ''), tokens);
  const body = renderTokens(String(template.body || defaults.body || ''), tokens);
  const preheader = renderTokens(String(template.preheader || defaults.preheader || ''), tokens);
  const footer = renderTokens(String(template.footerDisclaimer || ''), tokens);
  const html = buildEmailHtml({
    layout: String(template.layout || 'Centered'),
    headerStyle: String(template.headerStyle || 'dark'),
    headerText: renderTokens(String(template.headerText || '{store_name}'), tokens),
    showBadge: template.showBadge !== false,
    badgeText: renderTokens(String(template.badgeText || 'Back in Stock 🎉'), tokens),
    headline,
    body,
    buttonLabel: renderTokens(String(template.buttonLabel || 'Shop Now Before It Sells Out'), tokens),
    buttonUrl: opts.buttonUrl,
    productName: renderTokens(String(opts.tokens.product_name || 'Featured Item'), tokens),
    productPrice: renderTokens(String(opts.tokens.product_price || '$140.00'), tokens),
    productImage: opts.productImage,
    showProductImage: Boolean(template.showProductImage) || Boolean(opts.productImage),
    reviewQuote: renderTokens(String(template.reviewQuote || ''), tokens),
    showFeatures: Boolean(template.showFeatures),
    featuresTitle: renderTokens(String(template.featuresTitle || "Why you'll love it:"), tokens),
    featuresText: renderTokens(String(template.featuresText || ''), tokens),
    closingText: renderTokens(String(template.closingText || ''), tokens),
    signoffText: renderTokens(String(template.signoffText || 'The {store_name} Team'), tokens),
    brandColor: config.brand.primaryColor,
    secondaryColor: config.brand.secondaryColor,
    logoUrl: config.brand.logoUrl,
    footerText: footer,
    supportWhatsapp: config.support?.supportWhatsapp,
    preheader,
  });
  return sendTransactionalEmail({
    to: opts.to,
    subject,
    html,
    fromName: identity.storeName || 'Smart Alerts',
    replyTo: identity.replyTo || config.sellerEmail,
    alertType: opts.alertType,
    productId: opts.productId,
  });
}

async function sendFromTemplate(opts: {
  triggerType: string;
  to: string;
  alertType: string;
  productId?: string;
  tokens: Record<string, string | number | undefined>;
  buttonUrl?: string;
  productImage?: string;
}) {
  return deliverFromTemplate(opts);
}

type InventoryEntity = {
  productId?: string;
  variantId?: string;
  inStock?: boolean;
  availabilityStatus?: string;
  variant?: { id?: string; _id?: string };
};

function resolveEventVariantId(
  entity: InventoryEntity,
  event?: {
    data?: {
      variantId?: string;
      inventoryItem?: { variantId?: string };
    };
  },
): string {
  return String(
    entity.variantId ||
      entity.variant?.id ||
      entity.variant?._id ||
      event?.data?.variantId ||
      event?.data?.inventoryItem?.variantId ||
      '',
  ).trim();
}

export async function handleStockStatusUpdated(event: {
  metadata?: { id?: string; entityId?: string };
  entity?: InventoryEntity;
  data?: {
    productId?: string;
    variantId?: string;
    inStock?: boolean;
    availabilityStatus?: string;
    inventoryItem?: { variantId?: string };
    currentEntity?: InventoryEntity;
  };
  entityId?: string;
  updatedEvent?: { currentEntityAsJson?: InventoryEntity };
}) {
  const eventId = event.metadata?.id || '';
  if (await markEventProcessed(eventId, 'inventory_stock_status_updated')) return;

  const entity =
    event.entity ||
    event.data?.currentEntity ||
    event.updatedEvent?.currentEntityAsJson ||
    {};
  const productId =
    entity.productId ||
    event.data?.productId ||
    event.metadata?.entityId ||
    event.entityId;
  if (!productId) {
    console.warn('[smart-alerts] stock-status event missing productId', JSON.stringify(event)?.slice(0, 400));
    return;
  }

  const variantId = resolveEventVariantId(entity, event);
  await stampSyncEvent('inventory_stock_status_updated');
  await processInventoryRestock(productId, {
    variantId,
    eventInStock: resolveInStockFlag(
      entity.inStock ?? event.data?.inStock,
      entity.availabilityStatus ?? event.data?.availabilityStatus,
    ),
    // Without a variant id, fan out to each waiting SKU from live catalog.
    scoped: Boolean(variantId),
  });
}

/** V3 inventory quantity/status edits (merchant dashboard quantity changes). */
export async function handleInventoryItemUpdated(event: {
  metadata?: { id?: string; entityId?: string };
  entity?: InventoryEntity;
  data?: {
    variantId?: string;
    inventoryItem?: { variantId?: string };
    currentEntity?: InventoryEntity;
  };
  entityId?: string;
  updatedEvent?: { currentEntityAsJson?: InventoryEntity };
}) {
  const eventId = event.metadata?.id || '';
  if (await markEventProcessed(eventId, 'inventory_item_updated')) return;

  const entity =
    event.entity ||
    event.data?.currentEntity ||
    event.updatedEvent?.currentEntityAsJson ||
    {};
  const productId = entity.productId || event.metadata?.entityId || event.entityId;
  if (!productId) {
    console.warn('[smart-alerts] inventory-updated event missing productId');
    return;
  }

  const variantId = resolveEventVariantId(entity, event);
  await stampSyncEvent('inventory_item_updated');
  await processInventoryRestock(productId, {
    variantId,
    eventInStock: resolveInStockFlag(entity.inStock, entity.availabilityStatus),
    scoped: Boolean(variantId),
  });
}

/** V1 inventory variant quantity changes. */
export async function handleInventoryVariantsChanged(event: {
  metadata?: { id?: string };
  data?: {
    inventoryItem?: { productId?: string; externalId?: string; variantId?: string };
    productId?: string;
    variantId?: string;
  };
  entity?: { productId?: string; externalId?: string; variantId?: string };
}) {
  const eventId = event.metadata?.id || '';
  if (await markEventProcessed(eventId, 'inventory_variants_changed')) return;

  const productId =
    event.data?.inventoryItem?.productId ||
    event.data?.inventoryItem?.externalId ||
    event.data?.productId ||
    event.entity?.productId ||
    event.entity?.externalId;
  if (!productId) {
    console.warn('[smart-alerts] inventory-variants-changed missing productId');
    return;
  }

  const variantId = String(
    event.data?.inventoryItem?.variantId ||
      event.data?.variantId ||
      event.entity?.variantId ||
      '',
  ).trim();

  await stampSyncEvent('inventory_variants_changed');
  // When V1 does not name a variant, evaluate each waiting SKU from live catalog.
  await processInventoryRestock(productId, {
    variantId,
    scoped: Boolean(variantId),
  });
}

function resolveInStockFlag(
  inStock: boolean | undefined,
  availabilityStatus?: string,
): boolean | undefined {
  if (typeof inStock === 'boolean') return inStock;
  const status = String(availabilityStatus || '').toUpperCase();
  if (!status) return undefined;
  if (status === 'OUT_OF_STOCK') return false;
  if (status === 'IN_STOCK' || status === 'PARTIALLY_OUT_OF_STOCK') return true;
  return undefined;
}

/**
 * Shared restock path. When `scoped` + variantId, only that SKU is evaluated.
 * Otherwise every distinct waiting variant (plus product-level `''`) is checked
 * against its own live snapshot — never notify all waiters from variants[0].
 */
async function processInventoryRestock(
  productId: string,
  opts?: { variantId?: string; eventInStock?: boolean; scoped?: boolean },
) {
  const config = await getOrCreateConfig();
  const scopedVariant = String(opts?.variantId || '');

  if (opts?.scoped) {
    await processOneSkuInventory(productId, scopedVariant, config, {
      eventInStock: opts.eventInStock,
    });
    return;
  }

  const variantIds = new Set<string>(['']);
  if (isModuleEnabled(config, 'backInStock')) {
    for (const w of await findWaitingByProduct(productId, 'back_in_stock')) {
      variantIds.add(String(w.variantId || ''));
    }
  }
  if (isModuleEnabled(config, 'priceDrop')) {
    for (const w of await findWaitingByProduct(productId, 'price_drop')) {
      variantIds.add(String(w.variantId || ''));
    }
  }
  // Always refresh the merchant product-level row for tracker / restock dates.
  variantIds.add('');

  for (const vid of variantIds) {
    await processOneSkuInventory(productId, vid, config, {});
  }
}

async function processOneSkuInventory(
  productId: string,
  variantId: string,
  config: SiteConfig,
  opts: { eventInStock?: boolean },
) {
  const snapshot = await getProductSnapshot(productId, variantId || undefined);
  const inStock = opts.eventInStock ?? snapshot?.inStock ?? false;

  const existingOverride = await getOverride(productId, variantId);
  const previousStatus = String(existingOverride?.lastStockStatus || '').toUpperCase();
  const wasOut =
    previousStatus === 'OUT_OF_STOCK' ||
    previousStatus === 'OOS' ||
    previousStatus.includes('OUT');

  if (snapshot) {
    await notifyPriceDropSubscribers(productId, config, variantId);
  }

  // Seller OOS: edge-trigger per SKU (in → out). Stay-at-0 must not re-email.
  if (
    inStock === false &&
    !wasOut &&
    isModuleEnabled(config, 'sellerOutOfStock')
  ) {
    const to = config.sellerEmail;
    if (to) {
      const priceLabel =
        snapshot?.price != null && snapshot.price > 0
          ? `$${Number(snapshot.price).toFixed(2)}`
          : undefined;
      await sendFromTemplate({
        triggerType: 'seller_oos',
        to,
        alertType: 'seller_oos',
        productId,
        tokens: {
          product_name: snapshot?.name || productId,
          product_url: snapshot?.url,
          product_price: priceLabel,
        },
        buttonUrl: snapshot?.url,
        productImage: snapshot?.image || undefined,
      });
      console.info(
        `[smart-alerts] seller OOS alert sent for ${productId} variant=${variantId || '(product)'}`,
      );
    }
  } else if (inStock === false && wasOut) {
    console.info(
      `[smart-alerts] skip seller OOS for ${productId} variant=${variantId || '(product)'}: already out`,
    );
  }

  await upsertProductOverride({
    productId,
    variantId,
    productName: snapshot?.name,
    lastKnownPrice: snapshot?.price,
    lastStockStatus: inStock ? 'IN_STOCK' : 'OUT_OF_STOCK',
  });

  if (inStock && isModuleEnabled(config, 'backInStock') && snapshot) {
    await notifyBackInStockSubscribers(productId, snapshot, variantId);
  }

  if (isModuleEnabled(config, 'sellerLowStock') && snapshot) {
    const override = await getOverride(productId, variantId);
    const threshold = getLowStockThreshold(config, override as {
      useGlobalThreshold?: boolean;
      lowStockThreshold?: number;
    } | null);
    const qty = snapshot.quantity;
    if (qty != null && qty > 0 && qty <= threshold && config.sellerEmail) {
      const lastAlert = override?.lastLowStockAlertAt
        ? new Date(String(override.lastLowStockAlertAt))
        : null;
      if (!lastAlert || Number.isNaN(lastAlert.getTime())) {
        const priceLabel =
          snapshot.price != null && snapshot.price > 0
            ? `$${Number(snapshot.price).toFixed(2)}`
            : undefined;
        await sendFromTemplate({
          triggerType: 'seller_low_stock',
          to: config.sellerEmail,
          alertType: 'seller_low_stock',
          productId,
          tokens: {
            product_name: snapshot.name,
            product_url: snapshot.url,
            product_price: priceLabel,
          },
          buttonUrl: snapshot.url,
          productImage: snapshot.image || undefined,
        });
        await upsertProductOverride({
          productId,
          variantId,
          productName: snapshot.name,
          lastKnownPrice: snapshot.price,
          lastStockStatus: snapshot.stockStatus,
          lastLowStockAlertAt: new Date(),
        });
      }
    } else if (qty != null && qty > threshold) {
      await upsertProductOverride({
        productId,
        variantId,
        productName: snapshot.name,
        lastKnownPrice: snapshot.price,
        lastStockStatus: snapshot.stockStatus,
        lastLowStockAlertAt: null,
      });
    }
  }
}

async function notifyBackInStockSubscribers(
  productId: string,
  snapshot: NonNullable<Awaited<ReturnType<typeof getProductSnapshot>>>,
  variantId: string,
) {
  const watches = await findWaitingByProduct(productId, 'back_in_stock', variantId);
  const max = NOTIFY_CHUNK_SIZE * NOTIFY_MAX_CHUNKS;
  const queue = watches.slice(0, max);
  if (watches.length > queue.length) {
    console.warn(
      `[smart-alerts] back-in-stock notify ${productId} variant=${variantId || '(product)'}: ` +
        `deferring ${watches.length - queue.length}`,
    );
  }

  let sent = 0;
  for (let i = 0; i < queue.length; i += NOTIFY_CHUNK_SIZE) {
    const batch = queue.slice(i, i + NOTIFY_CHUNK_SIZE);
    const results = await mapPool(batch, NOTIFY_CONCURRENCY, async (watch) => {
      const ok = await sendFromTemplate({
        triggerType: 'back_in_stock',
        to: String(watch.email),
        alertType: 'back_in_stock',
        productId,
        tokens: {
          customer_name: String(watch.email).split('@')[0],
          product_name: snapshot.name || String(watch.productName || productId),
          product_url: snapshot.url || String(watch.productUrl || ''),
        },
        buttonUrl: snapshot.url || String(watch.productUrl || ''),
        productImage: snapshot.image || String(watch.productImage || ''),
      });
      if (ok) await markNotified(String(watch._id));
      return ok;
    });
    sent += results.filter(Boolean).length;
  }
  console.info(
    `[smart-alerts] back-in-stock notify ${productId} variant=${variantId || '(product)'}: ` +
      `${sent}/${queue.length} sent`,
  );
  return sent;
}

/**
 * Notify price-drop waiters for one SKU (or all SKUs when variantId omitted via fan-out).
 * Live price is always loaded per waiter variant — never variants[0] for another SKU.
 */
async function notifyPriceDropSubscribers(
  productId: string,
  config: SiteConfig,
  variantId?: string,
) {
  if (!isModuleEnabled(config, 'priceDrop')) return 0;

  const watches =
    variantId !== undefined
      ? await findWaitingByProduct(productId, 'price_drop', variantId)
      : await findWaitingByProduct(productId, 'price_drop');
  if (watches.length === 0) return 0;

  const byVariant = new Map<string, typeof watches>();
  for (const watch of watches) {
    const key = String(watch.variantId || '');
    const list = byVariant.get(key) || [];
    list.push(watch);
    byVariant.set(key, list);
  }

  let sent = 0;
  for (const [vid, group] of byVariant) {
    const snapshot = await getProductSnapshot(productId, vid || undefined);
    if (!snapshot) continue;
    const newPrice = Number(snapshot.price || 0);
    if (!(newPrice > 0)) continue;

    // Keep admin “current price” aligned with this SKU’s live catalog price.
    await upsertProductOverride({
      productId,
      variantId: vid,
      productName: snapshot.name,
      lastKnownPrice: newPrice,
      lastStockStatus: snapshot.stockStatus,
    });

    const eligible = group.filter((watch) => {
      const watched = Number(watch.watchedPrice || 0);
      if (!(watched > 0)) return false;
      return meetsPriceDropRules(config, watched, newPrice);
    });
    const max = NOTIFY_CHUNK_SIZE * NOTIFY_MAX_CHUNKS;
    const queue = eligible.slice(0, max);

    for (let i = 0; i < queue.length; i += NOTIFY_CHUNK_SIZE) {
      const batch = queue.slice(i, i + NOTIFY_CHUNK_SIZE);
      const results = await mapPool(batch, NOTIFY_CONCURRENCY, async (watch) => {
        const ok = await sendFromTemplate({
          triggerType: 'price_drop',
          to: String(watch.email),
          alertType: 'price_drop',
          productId,
          tokens: {
            customer_name: String(watch.email).split('@')[0],
            product_name: snapshot.name || String(watch.productName || productId),
            product_url: snapshot.url,
            product_price: String(newPrice),
          },
          buttonUrl: snapshot.url,
          productImage: snapshot.image,
        });
        if (ok) await markNotified(String(watch._id));
        return ok;
      });
      sent += results.filter(Boolean).length;
    }

    const sampleWatched = group
      .slice(0, 3)
      .map((w) => Number(w.watchedPrice || 0))
      .join(',');
    console.info(
      `[smart-alerts] price-drop notify ${productId} variant=${vid || '(product)'}: ` +
        `${eligible.length}/${group.length} eligible, livePrice=${newPrice}, watchedSample=[${sampleWatched}]`,
    );
  }
  return sent;
}

export async function handleProductUpdated(event: Record<string, any>) {
  const eventId = String(event.metadata?.id || event.id || '');
  if (await markEventProcessed(eventId, 'product_updated')) return;

  const productId = resolveProductUpdateId(event);
  if (!productId) {
    console.warn(
      '[smart-alerts] product-updated missing productId',
      JSON.stringify(event)?.slice(0, 500),
    );
    return;
  }

  await stampSyncEvent('product_updated');
  console.info(`[smart-alerts] product-updated ${productId}`);

  const config = await getOrCreateConfig();

  // Customer alerts only here (seller OOS/low-stock stay on inventory events).
  // Evaluate each waiting SKU against its own live price/stock — never variants[0].
  if (isModuleEnabled(config, 'priceDrop')) {
    await notifyPriceDropSubscribers(productId, config);
  }

  if (isModuleEnabled(config, 'backInStock')) {
    const watches = await findWaitingByProduct(productId, 'back_in_stock');
    const byVariant = new Map<string, typeof watches>();
    for (const w of watches) {
      const key = String(w.variantId || '');
      const list = byVariant.get(key) || [];
      list.push(w);
      byVariant.set(key, list);
    }
    for (const vid of byVariant.keys()) {
      const snapshot = await getProductSnapshot(productId, vid || undefined);
      if (snapshot?.inStock) {
        await notifyBackInStockSubscribers(productId, snapshot, vid);
      }
    }
  }

  // Merchant product-level override (restock tracker) — not per customer variant.
  const productSnap = await getProductSnapshot(productId);
  if (productSnap) {
    await upsertProductOverride({
      productId,
      variantId: '',
      productName: productSnap.name,
      lastKnownPrice: productSnap.price,
      lastStockStatus: productSnap.stockStatus,
    });
  }
}

export async function handleProductDeleted(event: {
  metadata?: { id?: string; entityId?: string };
  entity?: { _id?: string };
}) {
  const eventId = event.metadata?.id || '';
  if (await markEventProcessed(eventId, 'product_deleted')) return;
  const productId = event.entity?._id || event.metadata?.entityId;
  if (!productId) return;

  await stampSyncEvent('product_deleted');

  await cancelWaitingByProduct(productId);
}


export async function resyncCatalogCache(
  limit = 50,
  eventType: 'manual_resync' | 'install_seed' | 'first_open_seed' = 'manual_resync',
) {
  const products = await loadOutOfStockProducts(limit);
  const isManualScan = eventType === 'manual_resync';
  for (const p of products) {
    await upsertProductOverride({
      productId: String((p as { _id?: string })._id),
      productName: (p as { name?: string }).name,
      lastStockStatus: 'OUT_OF_STOCK',
      // Seed/cache only — do not auto-add to Tracked Products. Scan OOS can.
      tracked: isManualScan ? true : false,
      trackedSource: isManualScan ? 'scan' : 'system',
    });
  }
  const now = new Date().toISOString();
  const current = await getOrCreateConfig();
  await updateConfig({
    syncSettings: {
      ...current.syncSettings,
      cacheRefresh: 'realtime',
      lastCacheRefreshAt: now,
      lastEventAt: now,
      lastEventType: eventType,
    },
  });
  return products.length;
}

/** One-time catalog seed on install or first dashboard open; no-ops if already scanned. */
export async function ensureCatalogSeeded(
  reason: 'install' | 'first_open' = 'first_open',
): Promise<{ seeded: boolean; count: number }> {
  const current = await getOrCreateConfig();
  if (current.syncSettings?.lastCacheRefreshAt) {
    return { seeded: false, count: 0 };
  }
  const eventType = reason === 'install' ? 'install_seed' : 'first_open_seed';
  const count = await resyncCatalogCache(50, eventType);
  return { seeded: true, count };
}

export async function sendTestAlert(to: string) {
  if (!to) throw new Error('Email required for test alert');
  const product = await getFirstProductSnapshot();
  const productName = product?.name || 'Sample Product';
  const productUrl = product?.url && product.url.startsWith('http') ? product.url : '';
  const productPrice = product?.price != null ? `$${product.price.toFixed(2)}` : '$140.00';
  return deliverFromTemplate({
    triggerType: 'back_in_stock',
    to,
    alertType: 'back_in_stock',
    productId: product?.productId,
    tokens: {
      customer_name: to.split('@')[0],
      product_name: productName,
      product_url: productUrl || productName,
      product_price: productPrice,
    },
    buttonUrl: productUrl || undefined,
    productImage: product?.image || undefined,
  });
}

export async function manualTriggerAlert(opts: {
  productId: string;
  subscriptionType: 'back_in_stock' | 'price_drop';
}) {
  const watches = await findWaitingByProduct(opts.productId, opts.subscriptionType);
  let sent = 0;
  for (const watch of watches) {
    const vid = String(watch.variantId || '');
    const snapshot = await getProductSnapshot(opts.productId, vid || undefined);
    const ok = await deliverFromTemplate({
      triggerType: opts.subscriptionType,
      to: String(watch.email),
      alertType: opts.subscriptionType,
      productId: opts.productId,
      tokens: {
        customer_name: String(watch.email).split('@')[0],
        product_name: snapshot?.name || String(watch.productName || opts.productId),
        product_url: snapshot?.url || String(watch.productUrl || ''),
      },
      buttonUrl: snapshot?.url || String(watch.productUrl || ''),
      productImage: snapshot?.image || String(watch.productImage || ''),
    });
    if (ok) {
      await markNotified(String(watch._id));
      sent += 1;
    }
  }
  return sent;
}
