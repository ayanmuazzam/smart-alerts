import {
  catalogVersioning,
  products,
  productsV3,
  inventoryItemsV3,
} from '@wix/stores';
import { auth } from '@wix/essentials';
import { items } from '@wix/data';
import { COLLECTIONS } from './constants';
import {
  type CatalogProductRaw,
  enrichProductName,
  extractProductImage,
  extractProductUrl,
  isAbsoluteHttpUrl,
  mapV1SearchRow,
  mapV3SearchRow,
  pickVariant,
  relativeProductPath,
  variantKey,
  variantSellPrice,
} from './catalog-shapes';

export type CatalogVersion = 'V1_CATALOG' | 'V3_CATALOG' | 'STORES_NOT_INSTALLED';

let cachedVersion: CatalogVersion | undefined;

export async function getCatalogVersion(): Promise<CatalogVersion> {
  if (cachedVersion) return cachedVersion;
  try {
    const elevated = auth.elevate(catalogVersioning.getCatalogVersion);
    const { catalogVersion } = await elevated();
    cachedVersion = (catalogVersion as CatalogVersion) || 'STORES_NOT_INSTALLED';
  } catch {
    cachedVersion = 'STORES_NOT_INSTALLED';
  }
  return cachedVersion;
}

export type ProductSnapshot = {
  productId: string;
  variantId: string;
  name: string;
  url: string;
  image: string;
  price: number;
  inStock: boolean;
  quantity: number | null;
  stockStatus: string;
};

function unwrapProduct(result: unknown): CatalogProductRaw | null {
  if (!result || typeof result !== 'object') return null;
  const r = result as { product?: CatalogProductRaw };
  return r.product || (result as CatalogProductRaw);
}

async function resolveAbsoluteProductUrl(
  productId: string,
  product: CatalogProductRaw,
): Promise<string> {
  const direct = extractProductUrl(product);
  if (direct) return direct;

  try {
    const getV1 = auth.elevate(products.getProduct);
    const v1Product = unwrapProduct(await getV1(productId));
    const fromV1 = extractProductUrl(v1Product);
    if (fromV1) return fromV1;
  } catch {
    /* V1 unavailable on some catalogs */
  }

  const relative = relativeProductPath(product);
  if (!relative || isAbsoluteHttpUrl(relative)) return relative;

  try {
    const query = auth.elevate(products.queryProducts);
    const result = await query().limit(1).find();
    const first = (result?.items?.[0] || null) as CatalogProductRaw | null;
    const base = String(first?.productPageUrl?.base || '').replace(/\/?$/, '/');
    if (isAbsoluteHttpUrl(base)) {
      const path = relative.replace(/^\//, '');
      const slugPath = path.includes('/') ? path : `product-page/${path}`;
      return `${base}${slugPath}`;
    }
  } catch {
    /* ignore */
  }
  return '';
}

export async function getProductSnapshot(
  productId: string,
  variantId?: string,
): Promise<ProductSnapshot | null> {
  const version = await getCatalogVersion();
  if (version === 'STORES_NOT_INSTALLED') return null;

  if (version === 'V3_CATALOG') {
    const getProduct = auth.elevate(productsV3.getProduct);
    const product = unwrapProduct(
      await getProduct(productId, {
        fields: [
          'CURRENCY',
          'URL',
          'MEDIA_ITEMS_INFO',
          'VARIANT_OPTION_CHOICE_NAMES',
          'DISCOUNT_INFO',
        ] as never,
      }),
    );
    if (!product) return null;
    const variants = product.variantsInfo?.variants || [];
    const requested = String(variantId || '').trim();
    const multiSku = variants.length > 1;
    const variant = pickVariant(variants, requested || undefined);
    if (requested && !variant) {
      console.warn(
        `[smart-alerts] variant ${requested} not found on product ${productId}`,
      );
    }
    // Keep product-level rows as variantId '' (merchant tracker); SKU rows use real ids.
    const resolvedVariantId = requested || (multiSku ? '' : variantKey(variant));
    const amount = variantSellPrice(variant);

    let inStock: boolean;
    let quantity: number | null;
    let stockStatus: string;

    if (requested) {
      // Specific SKU — inventory item for that variantId.
      const inv = await getInventoryItem(productId, requested);
      if (inv) {
        quantity = inv.quantity ?? null;
        if (typeof inv.inStock === 'boolean') {
          inStock = inv.inStock;
        } else {
          const status = String(inv.availabilityStatus || '').toUpperCase();
          inStock = status !== 'OUT_OF_STOCK' && status !== '';
          if (!status && quantity != null) inStock = quantity > 0;
        }
        stockStatus = String(
          inv.availabilityStatus || (inStock ? 'IN_STOCK' : 'OUT_OF_STOCK'),
        );
      } else if (
        variant?.inventoryStatus &&
        typeof variant.inventoryStatus.inStock === 'boolean'
      ) {
        inStock = Boolean(variant.inventoryStatus.inStock);
        quantity = null;
        stockStatus = inStock ? 'IN_STOCK' : 'OUT_OF_STOCK';
      } else {
        stockStatus = 'OUT_OF_STOCK';
        inStock = false;
        quantity = null;
      }
    } else {
      // Product-level / simple product: use catalog rollup (PARTIALLY = still sellable).
      const availability = product.inventory?.availabilityStatus || 'IN_STOCK';
      stockStatus = String(availability);
      inStock =
        availability === 'IN_STOCK' || availability === 'PARTIALLY_OUT_OF_STOCK';
      if (!multiSku) {
        const inv = await getInventoryItem(productId, variantKey(variant) || undefined);
        quantity = inv?.quantity ?? null;
        if (inv && typeof inv.inStock === 'boolean') inStock = inv.inStock;
      } else {
        quantity = null;
      }
    }

    return {
      productId,
      variantId: resolvedVariantId,
      name: enrichProductName(product.name || '', requested ? variant : undefined),
      url: await resolveAbsoluteProductUrl(productId, product),
      image: extractProductImage(product),
      price: amount,
      inStock,
      quantity,
      stockStatus,
    };
  }

  // V1 catalogs: options/variants are not reliably exposed — stay product-level.
  const getProduct = auth.elevate(products.getProduct);
  const product = unwrapProduct(await getProduct(productId));
  if (!product) return null;
  const price = Number(product.priceData?.discountedPrice ?? product.priceData?.price ?? 0);
  const status = product.stock?.inventoryStatus || 'IN_STOCK';
  return {
    productId,
    variantId: variantId || '',
    name: product.name || '',
    url: await resolveAbsoluteProductUrl(productId, product),
    image: extractProductImage(product),
    price,
    inStock: status !== 'OUT_OF_STOCK',
    quantity: product.stock?.quantity ?? null,
    stockStatus: String(status),
  };
}

export async function searchProducts(term: string, limit = 20) {
  const version = await getCatalogVersion();
  if (version === 'STORES_NOT_INSTALLED') return [];

  if (version === 'V3_CATALOG') {
    const search = auth.elevate(productsV3.searchProducts);
    const result = (await search(
      {
        ...(term
          ? {
              search: {
                expression: term,
                fields: ['name'],
                fuzzy: true,
              },
            }
          : {}),
        cursorPaging: { limit },
      } as never,
      { fields: ['CURRENCY', 'URL'] as never },
    )) as { products?: CatalogProductRaw[] };
    return (result.products || [])
      .map(mapV3SearchRow)
      .filter((row) => Boolean(row.id));
  }

  const query = auth.elevate(products.queryProducts);
  let builder = query();
  if (term) builder = builder.startsWith('name', term);
  const result = await builder.limit(limit).find();
  return ((result.items || []) as CatalogProductRaw[])
    .map(mapV1SearchRow)
    .filter((row) => Boolean(row.id));
}

/** First catalog product — used for Send Test Alert preview content. */
export async function getFirstProductSnapshot(): Promise<ProductSnapshot | null> {
  try {
    const [first] = await searchProducts('', 1);
    if (!first?.id) return null;
    return getProductSnapshot(first.id);
  } catch {
    return null;
  }
}

export async function loadOutOfStockProducts(limit = 50): Promise<CatalogProductRaw[]> {
  const version = await getCatalogVersion();
  if (version === 'STORES_NOT_INSTALLED') return [];

  if (version === 'V3_CATALOG') {
    const search = auth.elevate(productsV3.searchProducts);
    const result = (await search(
      {
        filter: {
          'inventory.availabilityStatus': { $eq: 'OUT_OF_STOCK' },
        },
        cursorPaging: { limit },
      } as never,
      { fields: ['CURRENCY'] as never },
    )) as { products?: CatalogProductRaw[] };
    return result.products || [];
  }

  const query = auth.elevate(products.queryProducts);
  // Nested stock filter is valid at runtime; SDK typings omit it.
  const result = await (query() as { eq: (f: string, v: string) => { limit: (n: number) => { find: () => Promise<{ items?: CatalogProductRaw[] }> } } })
    .eq('stock.inventoryStatus', 'OUT_OF_STOCK')
    .limit(limit)
    .find();
  return result.items || [];
}

export type TrackedSource = 'manual' | 'scan' | 'system';

/**
 * Upsert override for (productId, variantId).
 * Merchant restock dates / tracker rows use variantId ''.
 * Customer price-drop baselines may use a real variantId.
 */
export async function upsertProductOverride(data: {
  productId: string;
  variantId?: string;
  productName?: string;
  lowStockThreshold?: number;
  useGlobalThreshold?: boolean;
  restockAt?: Date | string | null;
  lastKnownPrice?: number;
  lastStockStatus?: string;
  lastLowStockAlertAt?: Date | string | null;
  tracked?: boolean;
  trackedSource?: TrackedSource;
}) {
  const query = auth.elevate(items.query);
  const existing = await query(COLLECTIONS.productOverrides)
    .eq('productId', data.productId)
    .eq('variantId', data.variantId || '')
    .limit(1)
    .find();

  const prev = existing.items[0] as
    | { tracked?: boolean; trackedSource?: string; [key: string]: unknown }
    | undefined;

  const payload: Record<string, unknown> = {
    title: data.productName || data.productId,
    productId: data.productId,
    variantId: data.variantId || '',
    productName: data.productName || '',
    sku: '',
    lowStockThreshold: data.lowStockThreshold ?? prev?.lowStockThreshold ?? 5,
    useGlobalThreshold: data.useGlobalThreshold ?? prev?.useGlobalThreshold ?? true,
    restockAt:
      data.restockAt !== undefined
        ? data.restockAt
          ? new Date(data.restockAt)
          : null
        : (prev?.restockAt ?? null),
    lastKnownPrice: data.lastKnownPrice ?? prev?.lastKnownPrice ?? 0,
    lastStockStatus: data.lastStockStatus || prev?.lastStockStatus || '',
    tracked: data.tracked !== undefined ? data.tracked : (prev?.tracked ?? false),
    trackedSource:
      data.trackedSource !== undefined
        ? data.trackedSource
        : (prev?.trackedSource ?? 'system'),
  };
  if (data.lastLowStockAlertAt !== undefined) {
    payload.lastLowStockAlertAt = data.lastLowStockAlertAt
      ? new Date(data.lastLowStockAlertAt)
      : null;
  }

  if (existing.items[0]) {
    const update = auth.elevate(items.update);
    return update(COLLECTIONS.productOverrides, { ...existing.items[0], ...payload });
  }
  const insert = auth.elevate(items.insert);
  return insert(COLLECTIONS.productOverrides, payload);
}

export async function getOverride(productId: string, variantId?: string) {
  const query = auth.elevate(items.query);
  const result = await query(COLLECTIONS.productOverrides)
    .eq('productId', productId)
    .eq('variantId', variantId || '')
    .limit(1)
    .find();
  return result.items[0] || null;
}

/**
 * Storefront urgency settings: prefer the selected-variant override, then
 * fall back to the merchant product-level row (`variantId: ''`) for restock
 * dates / thresholds. Customer price/stock alert rows stay variant-scoped.
 */
export async function getStorefrontOverride(productId: string, variantId?: string) {
  const wanted = String(variantId || '');
  const variantRow = wanted ? await getOverride(productId, wanted) : null;
  const productRow = await getOverride(productId, '');
  if (!variantRow && !productRow) return null;
  return {
    lowStockThreshold:
      variantRow?.lowStockThreshold ?? productRow?.lowStockThreshold,
    useGlobalThreshold:
      variantRow?.useGlobalThreshold ?? productRow?.useGlobalThreshold,
    restockAt: variantRow?.restockAt ?? productRow?.restockAt,
  };
}

type InventoryItemRow = {
  quantity?: number | null;
  inStock?: boolean;
  availabilityStatus?: string;
  variantId?: string;
  productId?: string;
};

export async function getInventoryItem(
  productId: string,
  variantId?: string,
): Promise<InventoryItemRow | null> {
  try {
    const version = await getCatalogVersion();
    if (version !== 'V3_CATALOG') return null;
    const query = auth.elevate(inventoryItemsV3.queryInventoryItems);
    let builder = query().eq('productId', productId);
    const vid = String(variantId || '').trim();
    if (vid) builder = builder.eq('variantId', vid);
    const result = await builder.limit(1).find();
    return (result.items?.[0] as InventoryItemRow | undefined) || null;
  } catch {
    return null;
  }
}

export async function getInventoryQuantity(
  productId: string,
  variantId?: string,
): Promise<number | null> {
  const item = await getInventoryItem(productId, variantId);
  return item?.quantity ?? null;
}
