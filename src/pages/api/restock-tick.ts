import type { APIRoute } from 'astro';
import { applyDueRestockForProduct } from '../../lib/smart-alerts/restock-apply';

/** Simple per-isolate rate limit (storefront timer ticks). */
const rateBuckets = new Map<string, number[]>();
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 12;

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

/**
 * Storefront restock tick — applies merchant restock action when the countdown
 * is within earlyMs of ending (default: already due).
 * Pass waitForStock:false for the early (~5s) tick so the timer can keep running.
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json().catch(() => ({}));
    const productId = String(body.productId || '').trim();
    const variantId = String(body.variantId || '').trim();
    if (!productId) {
      return Response.json({ error: 'productId required' }, { status: 400 });
    }

    const ip =
      request.headers.get('cf-connecting-ip') ||
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      'unknown';
    if (!checkRateLimit(`${ip}:${productId}`)) {
      return Response.json({ error: 'Too many requests' }, { status: 429 });
    }

    const earlyMs = Math.min(
      Math.max(Number(body.earlyMs) || 0, 0),
      60_000,
    );
    const waitForStock = body.waitForStock !== false;

    const result = await applyDueRestockForProduct(productId, variantId || undefined, {
      earlyMs,
      waitForStock,
    });
    const ok = result.applied.filter((r) => r.ok);
    const failed = result.applied.filter((r) => !r.ok);

    return Response.json({
      ok: true,
      refreshed: result.refreshed,
      stockReady: result.stockReady,
      quantity: result.quantity,
      applied: ok.length,
      failed: failed.map((f) => ({ productId: f.productId, error: f.error })),
    });
  } catch (err) {
    console.error('[smart-alerts] restock-tick failed', err);
    return Response.json(
      { error: err instanceof Error ? err.message : 'Restock tick failed' },
      { status: 500 },
    );
  }
};
