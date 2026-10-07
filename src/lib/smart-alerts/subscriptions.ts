import { items } from '@wix/data';
import { auth } from '@wix/essentials';
import { COLLECTIONS, type SubscriptionState, type SubscriptionType } from './constants';
import { isValidE164Phone, isValidEmail } from './sanitize';
import { queryAllPages } from './query-helpers';

export type SubscribeInput = {
  productId: string;
  variantId?: string;
  productName?: string;
  productUrl?: string;
  productImage?: string;
  subscriptionType: SubscriptionType;
  email: string;
  phone?: string;
  consent: boolean;
  watchedPrice?: number;
};

export async function createSubscription(input: SubscribeInput) {
  if (!input.consent) {
    throw new Error('Consent is required');
  }
  const email = String(input.email || '').trim().toLowerCase();
  const productId = String(input.productId || '').trim();
  if (!email || !productId) {
    throw new Error('Email and productId are required');
  }
  if (!isValidEmail(email)) {
    throw new Error('Invalid email address');
  }
  if (input.phone && !isValidE164Phone(input.phone)) {
    throw new Error('Phone must be E.164 format (e.g. +15551234567)');
  }
  if (input.watchedPrice != null) {
    const price = Number(input.watchedPrice);
    if (!Number.isFinite(price) || price < 0) {
      throw new Error('watchedPrice must be a non-negative number');
    }
  }

  const query = auth.elevate(items.query);
  const existing = await query(COLLECTIONS.subscriptions)
    .eq('email', email)
    .eq('productId', productId)
    .eq('subscriptionType', input.subscriptionType)
    .eq('state', 'waiting')
    .limit(1)
    .find();

  if (existing.items[0]) {
    // Keep waiting row, but refresh watchedPrice when shopper re-subscribes
    // so the baseline matches the price they saw on the PDP.
    if (
      input.watchedPrice != null &&
      Number(existing.items[0].watchedPrice || 0) !== Number(input.watchedPrice)
    ) {
      const update = auth.elevate(items.update);
      return update(COLLECTIONS.subscriptions, {
        ...existing.items[0],
        watchedPrice: Number(input.watchedPrice),
        productName: input.productName || existing.items[0].productName,
        productUrl: input.productUrl || existing.items[0].productUrl,
        productImage: input.productImage || existing.items[0].productImage,
      });
    }
    return existing.items[0];
  }

  const insert = auth.elevate(items.insert);
  return insert(COLLECTIONS.subscriptions, {
    title: `${input.subscriptionType}:${email}`,
    productId,
    variantId: input.variantId || '',
    productName: input.productName || '',
    productUrl: input.productUrl || '',
    productImage: input.productImage || '',
    subscriptionType: input.subscriptionType,
    email,
    phone: input.phone || '',
    state: 'waiting' as SubscriptionState,
    consent: true,
    watchedPrice: input.watchedPrice ?? 0,
    lastNotifiedAt: null,
    cooldownUntil: null,
  });
}

export async function findWaitingByProduct(productId: string, subscriptionType: SubscriptionType) {
  const query = auth.elevate(items.query);
  return queryAllPages(
    (limit, skip) =>
      query(COLLECTIONS.subscriptions)
        .eq('productId', productId)
        .eq('subscriptionType', subscriptionType)
        .eq('state', 'waiting')
        .fields(
          '_id',
          'email',
          'phone',
          'productId',
          'productName',
          'productUrl',
          'productImage',
          'subscriptionType',
          'watchedPrice',
          'state',
        )
        .skip(skip)
        .limit(limit)
        .find(),
    100,
  );
}

export async function cancelWaitingByProduct(productId: string) {
  const query = auth.elevate(items.query);
  const update = auth.elevate(items.update);
  const subs = await queryAllPages(
    (limit, skip) =>
      query(COLLECTIONS.subscriptions)
        .eq('productId', productId)
        .eq('state', 'waiting')
        .fields('_id', 'state', 'productId')
        .skip(skip)
        .limit(limit)
        .find(),
    100,
  );
  for (const s of subs) {
    await update(COLLECTIONS.subscriptions, { ...s, state: 'cancelled' });
  }
  return subs.length;
}

export async function markNotified(id: string) {
  const get = auth.elevate(items.get);
  const item = await get(COLLECTIONS.subscriptions, id);
  if (!item) return;
  const update = auth.elevate(items.update);
  await update(COLLECTIONS.subscriptions, {
    ...item,
    state: 'notified',
    lastNotifiedAt: new Date(),
    cooldownUntil: null,
  });
}

/** After a price-drop alert, keep watching from the new price (no cron cooldown). */
export async function resetPriceDropWatch(id: string, newWatchedPrice: number) {
  const get = auth.elevate(items.get);
  const item = await get(COLLECTIONS.subscriptions, id);
  if (!item) return;
  const update = auth.elevate(items.update);
  await update(COLLECTIONS.subscriptions, {
    ...item,
    state: 'waiting',
    watchedPrice: newWatchedPrice,
    lastNotifiedAt: new Date(),
    cooldownUntil: null,
  });
}

/** Pre-filled wa.me text from store → subscribed shopper (never customer→store voice). */
export function buildStoreWhatsappMessage(opts: {
  productName?: string;
  subscriptionType?: string;
}): string {
  const product = String(opts.productName || 'this product').trim() || 'this product';
  if (opts.subscriptionType === 'price_drop') {
    return (
      `Hi! This is a quick update from our store about ${product}. ` +
      `You asked us to watch the price — we're reaching out with news. ` +
      `Reply anytime if you have questions.`
    );
  }
  return (
    `Hi! Great news — ${product} is back in stock. ` +
    `You asked us to notify you when it returned. ` +
    `Reply if you'd like help placing an order.`
  );
}

export async function addWhatsappQueue(entry: {
  phone: string;
  productId: string;
  productName?: string;
  email?: string;
  message?: string;
  subscriptionType?: string;
}) {
  const phone = entry.phone.replace(/[^\d+]/g, '');
  const message =
    entry.message ||
    buildStoreWhatsappMessage({
      productName: entry.productName,
      subscriptionType: entry.subscriptionType,
    });
  const text = encodeURIComponent(message);
  const waMeUrl = `https://wa.me/${phone.replace('+', '')}?text=${text}`;
  const insert = auth.elevate(items.insert);
  return insert(COLLECTIONS.whatsappQueue, {
    title: `${phone} · ${entry.productName || entry.productId}`,
    phone,
    productId: entry.productId,
    productName: entry.productName || '',
    email: entry.email || '',
    message,
    waMeUrl,
    status: 'pending',
  });
}
