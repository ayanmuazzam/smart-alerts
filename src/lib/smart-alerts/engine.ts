import { items } from '@wix/data';
import { auth } from '@wix/essentials';
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
  findWaitingByProduct,
  markNotified,
  rearmPriceDropWatches,
} from './subscriptions';
import { getOverride, getProductSnapshot, loadOutOfStockProducts, upsertProductOverride } from './products';
import { COLLECTIONS } from './constants';
import { sendWhatsappViaTwilio } from './whatsapp';

async function storeIdentity(): Promise<{ storeName: string; replyTo: string }> {
  const cfg = await getOrCreateConfig();
  return {
    storeName: 'Store',
    replyTo: cfg.sellerEmail || cfg.support?.supportEmail || '',
  };
}

function meetsPriceDropRules(
  config: SiteConfig,
  previousPrice: number,
  newPrice: number,
): boolean {
  if (!(previousPrice > 0 && newPrice < previousPrice)) return false;
  const dropAmount = previousPrice - newPrice;
  const dropPercent = (dropAmount / previousPrice) * 100;
  const minAmount = Number(config.triggerRules?.priceDropMinAmount ?? 0);
  const minPercent = Number(config.triggerRules?.priceDropMinPercent ?? 0);
  if (minAmount > 0 && dropAmount < minAmount) return false;
  if (minPercent > 0 && dropPercent < minPercent) return false;
  return true;
}

async function enqueuePendingSend(entry: {
  to: string;
  channel: string;
  alertType: string;
  productId?: string;
  payload: Record<string, unknown>;
}) {
  const insert = auth.elevate(items.insert);
  const hour = new Date();
  hour.setUTCMinutes(0, 0, 0);
  hour.setUTCHours(hour.getUTCHours() + 1);
  await insert(COLLECTIONS.pendingSends, {
    title: `${entry.alertType} → ${entry.to}`,
    to: entry.to,
    channel: entry.channel,
    alertType: entry.alertType,
    productId: entry.productId || '',
    payload: entry.payload,
    scheduledFor: hour,
    status: 'pending',
  });
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
  const template = (await getTemplate(opts.triggerType)) as Record<string, unknown>;
  const identity = await storeIdentity();
  const tokens = {
    store_name: identity.storeName,
    customer_name: 'there',
    ...opts.tokens,
  };
  const subject = renderTokens(String(template.subject || ''), tokens);
  const headline = renderTokens(String(template.headline || ''), tokens);
  const body = renderTokens(String(template.body || ''), tokens);
  const preheader = renderTokens(String(template.preheader || ''), tokens);
  const footer = renderTokens(config.brand.footerText || '', tokens);
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
    showProductImage: Boolean(template.showProductImage),
    reviewQuote: renderTokens(String(template.reviewQuote || ''), tokens),
    showFeatures: Boolean(template.showFeatures),
    featuresTitle: renderTokens(String(template.featuresTitle || "Why you'll love it:"), tokens),
    featuresText: renderTokens(String(template.featuresText || ''), tokens),
    closingText: renderTokens(String(template.closingText || ''), tokens),
    signoffText: renderTokens(String(template.signoffText || 'The {store_name} Team'), tokens),
    brandColor: config.brand.primaryColor,
    logoUrl: config.brand.logoUrl,
    footerText: footer || renderTokens(String(template.footerDisclaimer || ''), tokens),
    preheader,
  });
  return sendTransactionalEmail({
    to: opts.to,
    subject,
    html,
    fromName: identity.storeName,
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
  const config = await getOrCreateConfig();
  if (config.notificationLimits?.batchMode === 'hourly') {
    await enqueuePendingSend({
      to: opts.to,
      channel: 'email',
      alertType: opts.alertType,
      productId: opts.productId,
      payload: opts as unknown as Record<string, unknown>,
    });
    return true;
  }
  return deliverFromTemplate(opts);
}

export async function flushPendingSends(limit = 50) {
  const query = auth.elevate(items.query);
  const update = auth.elevate(items.update);
  const now = new Date();
  const result = await query(COLLECTIONS.pendingSends)
    .eq('status', 'pending')
    .le('scheduledFor', now)
    .limit(limit)
    .find();
  let sent = 0;
  for (const row of result.items) {
    const payload = (row.payload || {}) as Record<string, unknown>;
    try {
      if (row.channel === 'email') {
        await deliverFromTemplate({
          triggerType: String(payload.triggerType || row.alertType),
          to: String(row.to),
          alertType: String(row.alertType),
          productId: String(row.productId || payload.productId || ''),
          tokens: (payload.tokens as Record<string, string | number | undefined>) || {},
          buttonUrl: payload.buttonUrl as string | undefined,
          productImage: payload.productImage as string | undefined,
        });
      }
      await update(COLLECTIONS.pendingSends, { ...row, status: 'sent' });
      sent += 1;
    } catch {
      await update(COLLECTIONS.pendingSends, { ...row, status: 'failed' });
    }
  }
  return sent;
}

export async function handleStockStatusUpdated(event: {
  metadata?: { id?: string };
  entity?: { productId?: string; inStock?: boolean };
  data?: { productId?: string; inStock?: boolean };
}) {
  const eventId = event.metadata?.id || '';
  if (await markEventProcessed(eventId, 'inventory_stock_status_updated')) return;

  const productId = event.entity?.productId || event.data?.productId;
  const inStock = event.entity?.inStock ?? event.data?.inStock;
  if (!productId) return;

  await stampSyncEvent('inventory_stock_status_updated');

  const config = await getOrCreateConfig();
  const snapshot = await getProductSnapshot(productId);
  await upsertProductOverride({
    productId,
    productName: snapshot?.name,
    lastKnownPrice: snapshot?.price,
    lastStockStatus: inStock ? 'IN_STOCK' : 'OUT_OF_STOCK',
  });

  if (inStock === false && isModuleEnabled(config, 'sellerOutOfStock')) {
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
    }
  }

  if (inStock && isModuleEnabled(config, 'backInStock')) {
    const minQty = Number(config.triggerRules?.backInStockMinQty ?? 1);
    const qty = snapshot?.quantity;
    if (qty != null && qty < minQty) {
      // Wait until inventory reaches merchant threshold
    } else {
      const watches = await findWaitingByProduct(productId, 'back_in_stock');
      for (const watch of watches) {
        await sendFromTemplate({
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
      }
    }
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

export async function handleProductUpdated(event: {
  metadata?: { id?: string };
  entity?: { _id?: string };
  data?: { product?: { _id?: string }; changedFields?: string[]; modifiedFields?: string[] };
}) {
  const eventId = event.metadata?.id || '';
  if (await markEventProcessed(eventId, 'product_updated')) return;

  const productId =
    event.entity?._id || event.data?.product?._id || (event as { entityId?: string }).entityId;
  if (!productId) return;

  await stampSyncEvent('product_updated');

  const changed =
    event.data?.changedFields ||
    event.data?.modifiedFields ||
    (event as { modifiedFields?: string[] }).modifiedFields ||
    [];

  const config = await getOrCreateConfig();
  const snapshot = await getProductSnapshot(productId);
  if (!snapshot) return;

  const override = await getOverride(productId);
  const previousPrice = Number(override?.lastKnownPrice || 0);
  await upsertProductOverride({
    productId,
    productName: snapshot.name,
    lastKnownPrice: snapshot.price,
    lastStockStatus: snapshot.stockStatus,
  });

  const priceChanged =
    changed.length === 0 ||
    changed.some((f) => /price/i.test(f)) ||
    (previousPrice > 0 && snapshot.price > 0 && snapshot.price < previousPrice);

  if (
    priceChanged &&
    meetsPriceDropRules(config, previousPrice, snapshot.price) &&
    isModuleEnabled(config, 'priceDrop')
  ) {
    const watches = await findWaitingByProduct(productId, 'price_drop');
    const cooldownMs = (config.priceDropCooldownHours || 24) * 60 * 60 * 1000;
    for (const watch of watches) {
      await sendFromTemplate({
        triggerType: 'price_drop',
        to: String(watch.email),
        alertType: 'price_drop',
        productId,
        tokens: {
          customer_name: String(watch.email).split('@')[0],
          product_name: snapshot.name,
          product_url: snapshot.url,
        },
        buttonUrl: snapshot.url,
        productImage: snapshot.image,
      });
      await markNotified(String(watch._id), new Date(Date.now() + cooldownMs));
    }
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

  const query = auth.elevate(items.query);
  const update = auth.elevate(items.update);
  const subs = await query(COLLECTIONS.subscriptions).eq('productId', productId).eq('state', 'waiting').limit(200).find();
  for (const s of subs.items) {
    await update(COLLECTIONS.subscriptions, { ...s, state: 'cancelled' });
  }
}

export async function handleOrderCreated(event: { metadata?: { id?: string } }) {
  const eventId = event.metadata?.id || '';
  if (await markEventProcessed(eventId, 'order_created')) return;

  await stampSyncEvent('order_created');

  const config = await getOrCreateConfig();
  if (!isModuleEnabled(config, 'sellerNewOrder') || !config.sellerEmail) return;

  await sendFromTemplate({
    triggerType: 'seller_new_order',
    to: config.sellerEmail,
    alertType: 'seller_new_order',
    tokens: {},
    skipCustomerLimit: true,
  });
}

function digestIsDue(
  frequency: 'daily' | 'weekly' | 'off',
  lastDigestAt?: Date | string | null,
): boolean {
  if (frequency === 'off') return false;
  if (!lastDigestAt) return true;
  const last = new Date(lastDigestAt).getTime();
  if (Number.isNaN(last)) return true;
  const elapsed = Date.now() - last;
  if (frequency === 'daily') return elapsed >= 24 * 60 * 60 * 1000;
  return elapsed >= 7 * 24 * 60 * 60 * 1000;
}

function cacheRefreshDue(config: SiteConfig): boolean {
  const mode = config.syncSettings?.cacheRefresh || 'realtime';
  if (mode === 'realtime') return false;
  const last = config.syncSettings?.lastCacheRefreshAt
    ? new Date(config.syncSettings.lastCacheRefreshAt).getTime()
    : 0;
  const elapsed = Date.now() - last;
  if (mode === 'hourly') return elapsed >= 60 * 60 * 1000;
  return elapsed >= 24 * 60 * 60 * 1000;
}

export async function resyncCatalogCache(limit = 50) {
  const products = await loadOutOfStockProducts(limit);
  for (const p of products) {
    await upsertProductOverride({
      productId: String((p as { _id?: string })._id),
      productName: (p as { name?: string }).name,
      lastStockStatus: 'OUT_OF_STOCK',
    });
  }
  const current = await getOrCreateConfig();
  await updateConfig({
    syncSettings: {
      ...current.syncSettings,
      lastCacheRefreshAt: new Date().toISOString(),
      lastEventType: 'manual_resync',
    },
  });
  return products.length;
}

export async function runCronJobs() {
  const config = await getOrCreateConfig();
  const rearmed = await rearmPriceDropWatches();
  const pendingFlushed = await flushPendingSends();

  let cacheRefreshed = 0;
  if (cacheRefreshDue(config)) {
    cacheRefreshed = await resyncCatalogCache(50);
  }

  let digestSent = false;
  if (
    isModuleEnabled(config, 'digest') &&
    config.sellerEmail &&
    config.digestFrequency !== 'off' &&
    digestIsDue(config.digestFrequency, config.lastDigestAt)
  ) {
    const query = auth.elevate(items.query);
    const waiting = await query(COLLECTIONS.subscriptions).eq('state', 'waiting').limit(1).find({ returnTotalCount: true });
    await sendFromTemplate({
      triggerType: 'digest',
      to: config.sellerEmail,
      alertType: 'digest',
      tokens: {
        product_name: `${waiting.totalCount ?? waiting.items.length} active watches`,
      },
      skipCustomerLimit: true,
    });
    await updateConfig({ lastDigestAt: new Date() });
    digestSent = true;
  }

  return { rearmed, digestSent, pendingFlushed, cacheRefreshed };
}

export async function sendTestAlert(to: string) {
  if (!to) throw new Error('Email required for test alert');
  return deliverFromTemplate({
    triggerType: 'back_in_stock',
    to,
    alertType: 'back_in_stock',
    tokens: {
      customer_name: to.split('@')[0],
      product_name: 'Sample Product',
      product_url: '#',
    },
    buttonUrl: '#',
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
