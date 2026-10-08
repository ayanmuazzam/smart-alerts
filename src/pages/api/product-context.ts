import type { APIRoute } from 'astro';
import { getOrCreateConfig, isModuleEnabled } from '../../lib/smart-alerts/config';
import { getProductSnapshot, getStorefrontOverride } from '../../lib/smart-alerts/products';

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const productId = url.searchParams.get('productId') || '';
    const variantId = url.searchParams.get('variantId') || undefined;
    if (!productId) {
      return Response.json({ error: 'productId required' }, { status: 400 });
    }

    const config = await getOrCreateConfig();
    const snapshot = await getProductSnapshot(productId, variantId);
    // Variant override first, then merchant product-level restock/threshold row.
    const override = await getStorefrontOverride(productId, variantId);

    return Response.json({
      product: snapshot,
      override: override
        ? {
            lowStockThreshold: override.lowStockThreshold,
            useGlobalThreshold: override.useGlobalThreshold,
            restockAt: override.restockAt,
          }
        : null,
      modules: {
        backInStock: isModuleEnabled(config, 'backInStock'),
        priceDrop: isModuleEnabled(config, 'priceDrop'),
        stockCounter: isModuleEnabled(config, 'stockCounter'),
        restockCountdown: isModuleEnabled(config, 'restockCountdown'),
        manualWhatsapp: isModuleEnabled(config, 'manualWhatsapp'),
      },
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
