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
  resetPriceDropWatch,
} from './subscriptions';
import { getOverride, getProductSnapshot, getFirstProductSnapshot, loadOutOfStockProducts, upsertProductOverride } from './products';
import { getDefaultEmailTemplate } from './constants';
import { mapPool } from './map-pool';

/** Cap fan-out per webhook event to keep handlers under time limits. */
const NOTIFY_MAX_PER_EVENT = 200;
const NOTIFY_CONCURRENCY = 5;

async function storeIdentity(): Promise<{ storeName: string; replyTo: string }> {
  const cfg = await getOrCreateConfig();
  return {
    storeName: 'Store',
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

function resolveProductChangedFields(event: Record<string, any>): string[] {
  const raw =
    event.changedFields ||
    event.modifiedFields ||
    event.data?.changedFields ||
    event.data?.modifiedFields ||
    [];
  return Array.isArray(raw) ? raw.map(String) : [];
}

async function deliverFromTemplate(opts: {
  triggerType: string;
  to: string;
  alertType: string;
  productId?: string;
  tokens: Record<string, string | number | undefined>;
  buttonUrl?: string;
  productImage?: string;
  skipCustomerLimit?: boolean;
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
    skipCustomerLimit: opts.skipCustomerLimit,
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
  skipCustomerLimit?: boolean;
}) {
  return deliverFromTemplate(opts);
}

export async function handleStockStatusUpdated(event: {
  metadata?: { id?: string; entityId?: string };
  entity?: { productId?: string; inStock?: boolean; availabilityStatus?: string };
  data?: {
    productId?: string;
    inStock?: boolean;
    availabilityStatus?: string;
    currentEntity?: { productId?: string; inStock?: boolean; availabilityStatus?: string };
  };
  // SDK / webhook envelope variants
  entityId?: string;
  updatedEvent?: { currentEntityAsJson?: { productId?: string; inStock?: boolean; availabilityStatus?: string } };
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

  await stampSyncEvent('inventory_stock_status_updated');
  await processInventoryRestock(productId, {
    eventInStock: resolveInStockFlag(entity.inStock ?? event.data?.inStock, entity.availabilityStatus ?? event.data?.availabilityStatus),
  });
}

/** V3 inventory quantity/status edits (merchant dashboard quantity changes). */
export async function handleInventoryItemUpdated(event: {
  metadata?: { id?: string; entityId?: string };
  entity?: { productId?: string; inStock?: boolean; availabilityStatus?: string };
  data?: { currentEntity?: { productId?: string; inStock?: boolean; availabilityStatus?: string } };
  entityId?: string;
  updatedEvent?: { currentEntityAsJson?: { productId?: string; inStock?: boolean; availabilityStatus?: string } };
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

  await stampSyncEvent('inventory_item_updated');
  await processInventoryRestock(productId, {
    eventInStock: resolveInStockFlag(entity.inStock, entity.availabilityStatus),
  });
}

/** V1 inventory variant quantity changes. */
export async function handleInventoryVariantsChanged(event: {
  metadata?: { id?: string };
  data?: {
    inventoryItem?: { productId?: string; externalId?: string };
    productId?: string;
  };
  entity?: { productId?: string; externalId?: string };
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

  await stampSyncEvent('inventory_variants_changed');
  await processInventoryRestock(productId);
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
 * Shared restock path: load live catalog snapshot, notify waiting back-in-stock subscribers
 * when the product is in stock (and meets min qty).
 */
async function processInventoryRestock(
  productId: string,
  opts?: { eventInStock?: boolean },
) {
  const config = await getOrCreateConfig();
  const snapshot = await getProductSnapshot(productId);
  const inStock = opts?.eventInStock ?? snapshot?.inStock ?? false;

  // Capture baseline before overwriting — inventory events may arrive after a price edit
  // when Catalog product-updated webhooks are delayed or missing in local/dev.
  const existingOverride = await getOverride(productId);
  const previousPrice = Number(existingOverride?.lastKnownPrice || 0);
  const previousStatus = String(existingOverride?.lastStockStatus || '').toUpperCase();
  const wasOut =
    previousStatus === 'OUT_OF_STOCK' ||
    previousStatus === 'OOS' ||
    previousStatus.includes('OUT');

  if (snapshot) {
    await notifyPriceDropSubscribers(productId, snapshot, config, {
      lastKnownPrice: previousPrice,
    });
  }

  // Seller OOS: edge-trigger only (in-stock → out-of-stock). Stay-at-0 must not re-email.
  // Going back in stock updates lastStockStatus so the next OOS can fire once again.
  if (
    inStock === false &&
    !wasOut &&
    isModuleEnabled(config, 'sellerOutOfStock')
  ) {
    const to = config.sellerEmail;
    if (to) {
      await sendFromTemplate({
        triggerType: 'seller_oos',
        to,
        alertType: 'seller_oos',
        productId,
        tokens: { product_name: snapshot?.name || productId, product_url: snapshot?.url },
        buttonUrl: snapshot?.url,
        skipCustomerLimit: true,
      });
      console.info(`[smart-alerts] seller OOS alert sent for ${productId}`);
    }
  } else if (inStock === false && wasOut) {
    console.info(`[smart-alerts] skip seller OOS for ${productId}: already out of stock`);
  }

  await upsertProductOverride({
    productId,
    productName: snapshot?.name,
    lastKnownPrice: snapshot?.price,
    lastStockStatus: inStock ? 'IN_STOCK' : 'OUT_OF_STOCK',
  });

  if (inStock && isModuleEnabled(config, 'backInStock')) {
    await notifyBackInStockSubscribers(productId, snapshot);
  }

  if (isModuleEnabled(config, 'sellerLowStock') && snapshot) {
    const override = await getOverride(productId);
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
        await sendFromTemplate({
          triggerType: 'seller_low_stock',
          to: config.sellerEmail,
          alertType: 'seller_low_stock',
          productId,
          tokens: { product_name: snapshot.name, product_url: snapshot.url },
          buttonUrl: snapshot.url,
          skipCustomerLimit: true,
        });
        await upsertProductOverride({
          productId,
          productName: snapshot.name,
          lastKnownPrice: snapshot.price,
          lastStockStatus: snapshot.stockStatus,
          lastLowStockAlertAt: new Date(),
        });
      }
    } else if (qty != null && qty > threshold) {
      await upsertProductOverride({
        productId,
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
  snapshot: Awaited<ReturnType<typeof getProductSnapshot>>,
) {
  const watches = await findWaitingByProduct(productId, 'back_in_stock');
  const batch = watches.slice(0, NOTIFY_MAX_PER_EVENT);
  if (watches.length > batch.length) {
    console.warn(
      `[smart-alerts] back-in-stock notify ${productId}: capping ${batch.length}/${watches.length}`,
    );
  }
  const results = await mapPool(batch, NOTIFY_CONCURRENCY, async (watch) => {
    const ok = await sendFromTemplate({
      triggerType: 'back_in_stock',
      to: String(watch.email),
      alertType: 'back_in_stock',
      productId,
      tokens: {
        customer_name: String(watch.email).split('@')[0],
        product_name: snapshot?.name || String(watch.productName || productId),
        product_url: snapshot?.url || String(watch.productUrl || ''),
      },
      buttonUrl: snapshot?.url || String(watch.productUrl || ''),
      productImage: snapshot?.image || String(watch.productImage || ''),
    });
    await markNotified(String(watch._id));
    return ok;
  });
  const sent = results.filter(Boolean).length;
  console.info(`[smart-alerts] back-in-stock notify ${productId}: ${sent}/${batch.length} sent`);
  return sent;
}

/**
 * Notify waiting price-drop watchers when current price is below their baseline.
 * Baseline prefers each subscription's watchedPrice, then lastKnownPrice fallback.
 */
async function notifyPriceDropSubscribers(
  productId: string,
  snapshot: Awaited<ReturnType<typeof getProductSnapshot>>,
  config: SiteConfig,
  opts?: { lastKnownPrice?: number },
) {
  if (!snapshot || !isModuleEnabled(config, 'priceDrop')) return 0;
  const newPrice = Number(snapshot.price || 0);
  if (!(newPrice > 0)) return 0;

  const watches = await findWaitingByProduct(productId, 'price_drop');
  if (watches.length === 0) return 0;

  const lastKnown = Number(opts?.lastKnownPrice || 0);
  const eligible = watches.filter((watch) => {
    const watched = Number((watch as { watchedPrice?: number }).watchedPrice || 0);
    const baseline = watched > 0 ? watched : lastKnown;
    return meetsPriceDropRules(config, baseline, newPrice);
  });
  const batch = eligible.slice(0, NOTIFY_MAX_PER_EVENT);
  if (eligible.length > batch.length) {
    console.warn(
      `[smart-alerts] price-drop notify ${productId}: capping ${batch.length}/${eligible.length}`,
    );
  }

  const results = await mapPool(batch, NOTIFY_CONCURRENCY, async (watch) => {
    const ok = await sendFromTemplate({
      triggerType: 'price_drop',
      to: String(watch.email),
      alertType: 'price_drop',
      productId,
      tokens: {
        customer_name: String(watch.email).split('@')[0],
        product_name: snapshot.name,
        product_url: snapshot.url,
        product_price: String(newPrice),
      },
      buttonUrl: snapshot.url,
      productImage: snapshot.image,
    });
    if (ok) {
      await resetPriceDropWatch(String(watch._id), newPrice);
    }
    return ok;
  });
  const sent = results.filter(Boolean).length;

  console.info(
    `[smart-alerts] price-drop notify ${productId}: ${sent}/${batch.length} sent ` +
      `(waiters=${watches.length}, price=${newPrice}, lastKnown=${lastKnown})`,
  );
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

  const changed = resolveProductChangedFields(event);
  const config = await getOrCreateConfig();
  const snapshot = await getProductSnapshot(productId);
  if (!snapshot) return;

  const override = await getOverride(productId);
  const previousPrice = Number(override?.lastKnownPrice || 0);
  const previousStatus = String(override?.lastStockStatus || '').toUpperCase();
  const wasOut =
    previousStatus === 'OUT_OF_STOCK' ||
    previousStatus === 'OOS' ||
    previousStatus.includes('OUT');

  // Restock via product update (some editors only emit product events, not inventory status).
  if (snapshot.inStock && wasOut && isModuleEnabled(config, 'backInStock')) {
    await notifyBackInStockSubscribers(productId, snapshot);
  } else if (snapshot.inStock && isModuleEnabled(config, 'backInStock')) {
    const watches = await findWaitingByProduct(productId, 'back_in_stock');
    if (watches.length > 0) {
      await notifyBackInStockSubscribers(productId, snapshot);
    }
  }

  const looksLikePriceChange =
    changed.length === 0 ||
    changed.some((f) => /price/i.test(f)) ||
    (previousPrice > 0 && snapshot.price > 0 && snapshot.price !== previousPrice);

  if (looksLikePriceChange) {
    await notifyPriceDropSubscribers(productId, snapshot, config, {
      lastKnownPrice: previousPrice,
    });
  }

  await upsertProductOverride({
    productId,
    productName: snapshot.name,
    lastKnownPrice: snapshot.price,
    lastStockStatus: snapshot.stockStatus,
  });
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
    skipCustomerLimit: true,
  });
}

export async function manualTriggerAlert(opts: {
  productId: string;
  subscriptionType: 'back_in_stock' | 'price_drop';
}) {
  const snapshot = await getProductSnapshot(opts.productId);
  const watches = await findWaitingByProduct(opts.productId, opts.subscriptionType);
  let sent = 0;
  for (const watch of watches) {
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
