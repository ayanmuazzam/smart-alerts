import { items } from '@wix/data';
import { auth } from '@wix/essentials';
import { COLLECTIONS, type SubscriptionState, type SubscriptionType } from './constants';

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
  if (!input.email || !input.productId) {
    throw new Error('Email and productId are required');
  }

  const query = auth.elevate(items.query);
  const existing = await query(COLLECTIONS.subscriptions)
    .eq('email', input.email.toLowerCase())
    .eq('productId', input.productId)
    .eq('subscriptionType', input.subscriptionType)
    .eq('state', 'waiting')
    .limit(1)
    .find();

  if (existing.items[0]) {
    return existing.items[0];
  }

  const insert = auth.elevate(items.insert);
  return insert(COLLECTIONS.subscriptions, {
    title: `${input.subscriptionType}:${input.email}`,
    productId: input.productId,
    variantId: input.variantId || '',
    productName: input.productName || '',
    productUrl: input.productUrl || '',
    productImage: input.productImage || '',
    subscriptionType: input.subscriptionType,
    email: input.email.toLowerCase(),
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
  const result = await query(COLLECTIONS.subscriptions)
    .eq('productId', productId)
    .eq('subscriptionType', subscriptionType)
    .eq('state', 'waiting')
    .limit(200)
    .find();
  return result.items;
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
  const result = await query(COLLECTIONS.subscriptions)
    .eq('subscriptionType', 'price_drop')
    .eq('state', 'notified')
    .limit(200)
    .find();
  const update = auth.elevate(items.update);
  let count = 0;
  for (const item of result.items) {
    const until = item.cooldownUntil ? new Date(item.cooldownUntil) : null;
    if (until && until <= now) {
      await update(COLLECTIONS.subscriptions, { ...item, state: 'waiting', cooldownUntil: null });
      count += 1;
    }
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
