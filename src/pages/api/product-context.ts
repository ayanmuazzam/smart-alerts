import type { APIRoute } from 'astro';
import { getOrCreateConfig, isModuleEnabled } from '../../lib/smart-alerts/config';
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

    // Config and catalog snapshot are independent — fetch in parallel.
    const [config, snapshot] = await Promise.all([
      getOrCreateConfig(),
      getProductSnapshot(productId, variantId),
    ]);

    // Override needs the resolved variant id from the snapshot when available.
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
