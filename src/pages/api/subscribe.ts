import type { APIRoute } from 'astro';
import { createSubscription, addWhatsappQueue } from '../../lib/smart-alerts/subscriptions';
import { getOrCreateConfig, isModuleEnabled } from '../../lib/smart-alerts/config';
import type { SubscriptionType } from '../../lib/smart-alerts/constants';
import { getProductSnapshot, upsertProductOverride } from '../../lib/smart-alerts/products';
import { isValidEmail, isValidE164Phone } from '../../lib/smart-alerts/sanitize';

/** Simple per-isolate sliding window (not durable across workers). */
const rateBuckets = new Map<string, number[]>();
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 20;

function rateLimitKey(request: Request, email: string): string {
  const ip =
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown';
  return `${ip}:${email.toLowerCase()}`;
}

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const prev = (rateBuckets.get(key) || []).filter((t) => now - t < RATE_WINDOW_MS);
  if (prev.length >= RATE_MAX) {
    rateBuckets.set(key, prev);
    return false;
  }
  prev.push(now);
  rateBuckets.set(key, prev);
  return true;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const subscriptionType = body.subscriptionType as SubscriptionType;
    if (!['back_in_stock', 'price_drop'].includes(subscriptionType)) {
      return Response.json({ error: 'Invalid subscriptionType' }, { status: 400 });
    }

    const email = String(body.email || '').trim();
    const productId = String(body.productId || '').trim();
    if (!isValidEmail(email)) {
      return Response.json({ error: 'Invalid email address' }, { status: 400 });
    }
    if (!productId || productId.length > 128) {
      return Response.json({ error: 'Invalid productId' }, { status: 400 });
    }
    if (body.phone && !isValidE164Phone(body.phone)) {
      return Response.json(
        { error: 'Phone must be E.164 format (e.g. +15551234567)' },
        { status: 400 },
      );
    }
    if (body.watchedPrice != null) {
      const price = Number(body.watchedPrice);
      if (!Number.isFinite(price) || price < 0) {
        return Response.json({ error: 'Invalid watchedPrice' }, { status: 400 });
      }
    }

    if (!checkRateLimit(rateLimitKey(request, email))) {
      return Response.json({ error: 'Too many requests' }, { status: 429 });
    }

    const config = await getOrCreateConfig();
    if (subscriptionType === 'back_in_stock' && !isModuleEnabled(config, 'backInStock')) {
      return Response.json({ error: 'Back in stock is disabled' }, { status: 403 });
    }
    if (subscriptionType === 'price_drop' && !isModuleEnabled(config, 'priceDrop')) {
      return Response.json({ error: 'Price drop is disabled' }, { status: 403 });
    }

    // Prefer explicit client variantId (including when snapshot falls back).
    const requestedVariantId = String(body.variantId ?? '').trim();
    const snapshot = await getProductSnapshot(
      productId,
      requestedVariantId || undefined,
    );
    if (!snapshot) {
      return Response.json({ error: 'Product not found' }, { status: 404 });
    }

    const variantId = requestedVariantId || String(snapshot.variantId || '').trim();
    // Always baseline from live catalog for this SKU — never a stale modal price.
    const watchedPrice =
      subscriptionType === 'price_drop'
        ? Number(snapshot.price || 0)
        : body.watchedPrice != null
          ? Number(body.watchedPrice)
          : Number(snapshot.price || 0);

    if (subscriptionType === 'price_drop' && !(watchedPrice > 0)) {
      return Response.json(
        { error: 'Could not read a valid price for this variant' },
        { status: 400 },
      );
    }

    const sub = await createSubscription({
      productId,
      variantId,
      productName: snapshot.name,
      productUrl: snapshot.url,
      productImage: snapshot.image,
      subscriptionType,
      email,
      phone: body.phone,
      consent: Boolean(body.consent),
      watchedPrice: subscriptionType === 'price_drop' ? watchedPrice : body.watchedPrice,
    });

    // Seed per-variant baseline for admin “current price” + engine edge state.
    if (subscriptionType === 'price_drop' && watchedPrice > 0) {
      await upsertProductOverride({
        productId,
        variantId,
        productName: snapshot.name,
        lastKnownPrice: watchedPrice,
        lastStockStatus: snapshot.stockStatus,
      });
    }

    if (body.phone && isModuleEnabled(config, 'manualWhatsapp')) {
      await addWhatsappQueue({
        phone: body.phone,
        productId,
        productName: snapshot.name,
        email,
        subscriptionType,
      });
    }

    return Response.json({
      ok: true,
      id: sub._id,
    });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Failed to subscribe' },
      { status: 400 },
    );
  }
};
