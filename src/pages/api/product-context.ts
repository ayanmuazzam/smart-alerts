import type { APIRoute } from 'astro';
import { getOrCreateConfig, isModuleEnabled } from '../../lib/smart-alerts/config';
import { items } from '@wix/data';
import { auth } from '@wix/essentials';
import { COLLECTIONS } from '../../lib/smart-alerts/constants';
import {
  getProductSnapshot,
  getStorefrontOverride,
  normalizeVariantId,
} from '../../lib/smart-alerts/products';

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const productId = url.searchParams.get('productId') || '';
    // Wix may pass selected-variant-id="undefined" before a real SKU is chosen.
    const variantId = normalizeVariantId(url.searchParams.get('variantId')) || undefined;
    if (!productId) {
      return Response.json({ error: 'productId required' }, { status: 400 });
    }

    const config = await getOrCreateConfig();
    const snapshot = await getProductSnapshot(productId, variantId);
    // Simple: snapshot resolves the sole catalog variant id (Tracker is variant-scoped).
    // Multi-SKU: use the selected variant id; empty until options are chosen.
    const overrideVariantId = normalizeVariantId(snapshot?.variantId) || variantId;
    const override = await getStorefrontOverride(productId, overrideVariantId);

    const restockAt = override?.restockAt
      ? override.restockAt instanceof Date
        ? override.restockAt.toISOString()
        : String(override.restockAt)
      : null;

    const modules = {
      backInStock: isModuleEnabled(config, 'backInStock'),
      priceDrop: isModuleEnabled(config, 'priceDrop'),
      stockCounter: isModuleEnabled(config, 'stockCounter'),
      // Treat scheduled Inventory Tracker dates as activation even when the
      // module was saved false under the old default.
      restockCountdown:
        isModuleEnabled(config, 'restockCountdown') || Boolean(restockAt),
      manualWhatsapp: isModuleEnabled(config, 'manualWhatsapp'),
    };

    // Debug: list every override row so missing timers are diagnosable in the terminal.
    let overrideRows: Array<{ variantId: string; restockAt: string | null; tracked?: boolean }> =
      [];
    try {
      const query = auth.elevate(items.query);
      const listed = await query(COLLECTIONS.productOverrides)
        .eq('productId', productId)
        .limit(20)
        .find();
      overrideRows = (listed.items || []).map((row: Record<string, unknown>) => {
        const at = row.restockAt;
        let restockIso: string | null = null;
        if (at) {
          const d = new Date(at as string | Date);
          restockIso = Number.isFinite(d.getTime()) ? d.toISOString() : String(at);
        }
        return {
          variantId: String(row.variantId || ''),
          restockAt: restockIso,
          tracked: Boolean(row.tracked),
        };
      });
    } catch (err) {
      console.warn('[smart-alerts] override list failed', err);
    }

    console.log('[smart-alerts] product-context', {
      productId,
      name: snapshot?.name,
      reqVariantId: variantId || '',
      snapVariantId: snapshot?.variantId || '',
      inStock: snapshot?.inStock,
      selectionRequired: snapshot?.selectionRequired,
      restockCountdown: modules.restockCountdown,
      restockAt,
      overrideRows,
      showTimer:
        Boolean(snapshot && !snapshot.inStock && !snapshot.selectionRequired) &&
        modules.restockCountdown &&
        Boolean(restockAt),
    });

    return Response.json({
      product: snapshot,
      override: override
        ? {
            lowStockThreshold: override.lowStockThreshold,
            useGlobalThreshold: override.useGlobalThreshold,
            restockAt,
            restockAction: override.restockAction || 'none',
          }
        : null,
      modules,
      appearance: config.appearance,
      globalLowStockThreshold: config.globalLowStockThreshold,
    });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Product context failed' },
      { status: 500 },
    );
  }
};
