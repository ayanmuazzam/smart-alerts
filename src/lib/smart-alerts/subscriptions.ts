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

export async function markNotified(id: string, cooldownUntil?: Date) {
  const get = auth.elevate(items.get);
  const item = await get(COLLECTIONS.subscriptions, id);
  if (!item) return;
  const update = auth.elevate(items.update);
  await update(COLLECTIONS.subscriptions, {
    ...item,
    state: 'notified',
    lastNotifiedAt: new Date(),
    cooldownUntil: cooldownUntil || null,
  });
}

export async function rearmPriceDropWatches() {
  const now = new Date();
  const query = auth.elevate(items.query);
  const update = auth.elevate(items.update);
  const due = await queryAllPages(
    (limit, skip) =>
      query(COLLECTIONS.subscriptions)
        .eq('subscriptionType', 'price_drop')
        .eq('state', 'notified')
        .le('cooldownUntil', now)
        .fields('_id', 'state', 'cooldownUntil', 'subscriptionType')
        .skip(skip)
        .limit(limit)
        .find(),
    100,
  );
  let count = 0;
  for (const item of due) {
    await update(COLLECTIONS.subscriptions, { ...item, state: 'waiting', cooldownUntil: null });
    count += 1;
  }
  return count;
}

export async function addWhatsappQueue(entry: {
  phone: string;
  productId: string;
  productName?: string;
  email?: string;
  message?: string;
}) {
  const phone = entry.phone.replace(/[^\d+]/g, '');
  const text = encodeURIComponent(
    entry.message || `Hi! I'm interested in ${entry.productName || 'your product'}.`,
  );
  const waMeUrl = `https://wa.me/${phone.replace('+', '')}?text=${text}`;
  const insert = auth.elevate(items.insert);
  return insert(COLLECTIONS.whatsappQueue, {
    title: `${phone} · ${entry.productName || entry.productId}`,
    phone,
    productId: entry.productId,
    productName: entry.productName || '',
    email: entry.email || '',
    message: entry.message || '',
    waMeUrl,
    status: 'pending',
  });
}
