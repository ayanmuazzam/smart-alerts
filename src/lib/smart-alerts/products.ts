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
  formatVariantChoices,
  isAbsoluteHttpUrl,
  mapV1SearchRow,
  mapV3SearchRows,
  pickVariant,
  relativeProductPath,
  splitEnrichedProductName,
  type SearchProductRow,
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
  /**
   * True when the product has multiple SKUs and the caller did not pass a
   * variantId — storefront should wait for selected-variant-id before BIS/price CTAs.
   */
  selectionRequired?: boolean;
};

function unwrapProduct(result: unknown): CatalogProductRaw | null {
  if (!result || typeof result !== 'object') return null;
  const r = result as { product?: CatalogProductRaw };
  return r.product || (result as CatalogProductRaw);
}

/** Full V3 product with variant choice names — search often omits variantsInfo. */
export async function fetchProductWithVariants(
  productId: string,
): Promise<CatalogProductRaw | null> {
  const version = await getCatalogVersion();
  if (version !== 'V3_CATALOG') return null;
  try {
    const getProduct = auth.elevate(productsV3.getProduct);
    return unwrapProduct(
      await getProduct(productId, {
        fields: ['CURRENCY', 'VARIANT_OPTION_CHOICE_NAMES'] as never,
      }),
    );
  } catch {
    return null;
  }
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
      selectionRequired: multiSku && !requested,
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
    selectionRequired: false,
  };
}

export async function searchProducts(term: string, limit = 20): Promise<SearchProductRow[]> {
  const version = await getCatalogVersion();
  if (version === 'STORES_NOT_INSTALLED') return [];

  if (version === 'V3_CATALOG') {
    // Fetch fewer parent products — multi-SKU expands to one row per variant.
    const productLimit = Math.min(Math.max(limit, 5), 20);
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
        cursorPaging: { limit: productLimit },
      } as never,
      {
        fields: ['CURRENCY', 'URL', 'VARIANT_OPTION_CHOICE_NAMES'] as never,
      },
    )) as { products?: CatalogProductRaw[] };
    const rows: SearchProductRow[] = [];
    const maxRows = Math.max(limit * 3, 40);
    for (const p of result.products || []) {
      const productId = String(p._id || '').trim();
      // Search payloads often omit variantsInfo — hydrate so multi-SKU expands.
      let source = p;
      if (productId && !(p.variantsInfo?.variants?.length)) {
        const full = await fetchProductWithVariants(productId);
        if (full) source = { ...full, name: full.name || p.name };
      }
      for (const row of mapV3SearchRows(source)) {
        if (!row.id) continue;
        rows.push(row);
        if (rows.length >= maxRows) return rows;
      }
    }
    return rows;
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
          'inventory.availabilityStatus': {
            $in: ['OUT_OF_STOCK', 'PARTIALLY_OUT_OF_STOCK'],
          },
        },
        cursorPaging: { limit },
      } as never,
      { fields: ['CURRENCY', 'VARIANT_OPTION_CHOICE_NAMES'] as never },
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

export type OutOfStockTrackRow = {
  productId: string;
  variantId: string;
  productName: string;
  lastStockStatus: string;
  sku?: string;
};

/**
 * Expand OOS / partially-OOS products into per-variant tracker rows.
 * Fully OOS multi-SKU → every variant; partial → only OOS variants.
 * Always hydrates via getProduct — search often returns products without variantsInfo.
 */
export async function loadOutOfStockTrackRows(limit = 50): Promise<OutOfStockTrackRow[]> {
  const products = await loadOutOfStockProducts(limit);
  const rows: OutOfStockTrackRow[] = [];

  for (const p of products) {
    const productId = String(p._id || '').trim();
    if (!productId) continue;

    const full = (await fetchProductWithVariants(productId)) || p;
    const productName = String(full.name || p.name || '').trim() || 'Unknown Product';
    const productStatus = String(
      full.inventory?.availabilityStatus ||
        p.inventory?.availabilityStatus ||
        p.stock?.inventoryStatus ||
        '',
    );
    const variants = full.variantsInfo?.variants || p.variantsInfo?.variants || [];

    if (variants.length <= 1) {
      const v = variants[0];
      const label = formatVariantChoices(v);
      rows.push({
        productId,
        variantId: variantKey(v) || '',
        productName: label ? enrichProductName(productName, v) : productName,
        lastStockStatus: 'OUT_OF_STOCK',
        sku: v?.sku ? String(v.sku) : undefined,
      });
      continue;
    }

    const fullyOos = productStatus === 'OUT_OF_STOCK';
    for (const v of variants) {
      const vid = variantKey(v);
      if (!vid) continue;
      const flagged = v.inventoryStatus?.inStock;
      let isOos = false;
      if (typeof flagged === 'boolean') {
        isOos = !flagged;
      } else if (fullyOos) {
        isOos = true;
      } else {
        const inv = await getInventoryItem(productId, vid);
        const status = String(inv?.availabilityStatus || '').toUpperCase();
        const qty = inv?.quantity;
        isOos = !(
          inv?.inStock === true ||
          status === 'IN_STOCK' ||
          status === 'PREORDER' ||
          (qty != null && qty > 0)
        );
      }
      if (!isOos) continue;
      rows.push({
        productId,
        variantId: vid,
        productName: enrichProductName(productName, v),
        lastStockStatus: 'OUT_OF_STOCK',
        sku: v?.sku ? String(v.sku) : undefined,
      });
    }
  }

  return rows;
}

export type TrackedDisplayRow = {
  _id?: string;
  productId: string;
  variantId?: string;
  productName?: string;
  variantLabel?: string;
  sku?: string;
  lastStockStatus?: string;
  [key: string]: unknown;
};

/**
 * Attach human-readable variant labels for the Inventory Tracker UI.
 * Also backfills productName with "Product — Color: Blue" when missing.
 */
export async function enrichTrackedRowsForDisplay(
  rows: TrackedDisplayRow[],
): Promise<TrackedDisplayRow[]> {
  if (!rows.length) return rows;
  const byProduct = new Map<string, CatalogProductRaw | null>();

  const ensureProduct = async (productId: string) => {
    if (byProduct.has(productId)) return byProduct.get(productId) || null;
    const full = await fetchProductWithVariants(productId);
    byProduct.set(productId, full);
    return full;
  };

  const out: TrackedDisplayRow[] = [];
  for (const row of rows) {
    const productId = String(row.productId || '').trim();
    const variantId = String(row.variantId || '').trim();
    const split = splitEnrichedProductName(row.productName);
    let variantLabel = split.variantLabel;
    let productName = String(row.productName || '').trim();
    let sku = row.sku ? String(row.sku) : '';

    if (productId && (variantId || !variantLabel)) {
      const product = await ensureProduct(productId);
      const variants = product?.variantsInfo?.variants || [];
      const variant = variantId
        ? variants.find((v) => variantKey(v) === variantId)
        : variants.length === 1
          ? variants[0]
          : undefined;
      if (variant) {
        const label = formatVariantChoices(variant);
        if (label) {
          variantLabel = label;
          const base = split.baseName || String(product?.name || productName).trim();
          productName = enrichProductName(base, variant);
        }
        if (!sku && variant.sku) sku = String(variant.sku);
      } else if (!variantId && variants.length > 1) {
        // Legacy product-level row on a multi-SKU product — surface that clearly.
        variantLabel = variantLabel || `${variants.length} variants (product-level)`;
      }
    }

    out.push({
      ...row,
      productName,
      variantLabel: variantLabel || undefined,
      sku: sku || row.sku,
    });
  }
  return out;
}

export type TrackedSource = 'manual' | 'scan' | 'system';

/** What Inventory Tracker does when restockAt elapses. */
export type RestockAction = 'none' | 'in_stock' | 'in_stock_qty';

export function normalizeRestockAction(raw: unknown): RestockAction {
  const v = String(raw || 'none').trim().toLowerCase();
  if (v === 'in_stock' || v === 'in_stock_qty') return v;
  return 'none';
}

/**
 * Upsert override for (productId, variantId).
 * Inventory Tracker / restock rows use a real variantId when multi-SKU;
 * product-level merchant rows and simple products may use ''.
 * Customer price-drop baselines use a real variantId when available.
 */
export async function upsertProductOverride(data: {
  productId: string;
  variantId?: string;
  productName?: string;
  sku?: string;
  lowStockThreshold?: number;
  useGlobalThreshold?: boolean;
  restockAt?: Date | string | null;
  restockAction?: RestockAction | string | null;
  restockQuantity?: number | null;
  restockAppliedAt?: Date | string | null;
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

  let nextRestockAt: Date | null;
  if (data.restockAt !== undefined) {
    nextRestockAt = data.restockAt ? new Date(data.restockAt) : null;
  } else if (prev?.restockAt) {
    const d = new Date(prev.restockAt as string | Date);
    nextRestockAt = Number.isFinite(d.getTime()) ? d : null;
  } else {
    nextRestockAt = null;
  }

  // Scheduling a new (or changed) timer resets applied marker so it can fire again.
  const prevRestockIso = (() => {
    if (!prev?.restockAt) return '';
    const d = new Date(prev.restockAt as string | Date);
    return Number.isFinite(d.getTime()) ? d.toISOString() : '';
  })();
  const nextRestockIso = nextRestockAt ? nextRestockAt.toISOString() : '';
  const restockAtChanged = data.restockAt !== undefined && prevRestockIso !== nextRestockIso;

  const payload: Record<string, unknown> = {
    title: data.productName || data.productId,
    productId: data.productId,
    variantId: data.variantId || '',
    productName: data.productName || '',
    sku:
      data.sku !== undefined
        ? String(data.sku || '')
        : String(prev?.sku || ''),
    lowStockThreshold: data.lowStockThreshold ?? prev?.lowStockThreshold ?? 5,
    useGlobalThreshold: data.useGlobalThreshold ?? prev?.useGlobalThreshold ?? true,
    restockAt: nextRestockAt,
    restockAction:
      data.restockAction !== undefined
        ? normalizeRestockAction(data.restockAction)
        : normalizeRestockAction(prev?.restockAction),
    restockQuantity:
      data.restockQuantity !== undefined
        ? data.restockQuantity == null
          ? null
          : Math.max(0, Math.floor(Number(data.restockQuantity) || 0))
        : (prev?.restockQuantity ?? null),
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
  if (data.restockAppliedAt !== undefined) {
    payload.restockAppliedAt = data.restockAppliedAt
      ? new Date(data.restockAppliedAt)
      : null;
  } else if (restockAtChanged) {
    payload.restockAppliedAt = null;
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

export type InventoryItemRow = {
  _id?: string;
  id?: string;
  revision?: string | number;
  quantity?: number | null;
  inStock?: boolean;
  availabilityStatus?: string;
  variantId?: string;
  productId?: string;
};

export async function listInventoryItemsForProduct(
  productId: string,
  limit = 100,
): Promise<InventoryItemRow[]> {
  try {
    const version = await getCatalogVersion();
    if (version !== 'V3_CATALOG') return [];
    const query = auth.elevate(inventoryItemsV3.queryInventoryItems);
    const result = await query().eq('productId', productId).limit(limit).find();
    return ((result.items || []) as InventoryItemRow[]).map((raw) => ({
      ...raw,
      _id: raw._id || raw.id,
    }));
  } catch {
    return [];
  }
}

export async function getInventoryItem(
  productId: string,
  variantId?: string,
): Promise<InventoryItemRow | null> {
  try {
    const version = await getCatalogVersion();
    if (version !== 'V3_CATALOG') return null;
    const query = auth.elevate(inventoryItemsV3.queryInventoryItems);
    const vid = String(variantId || '').trim();
    if (vid) {
      const result = await query().eq('productId', productId).eq('variantId', vid).limit(1).find();
      const raw = (result.items?.[0] as InventoryItemRow | undefined) || null;
      if (!raw) return null;
      return { ...raw, _id: raw._id || raw.id };
    }
    // No variantId: prefer a single inventory row; otherwise caller should list all.
    const all = await listInventoryItemsForProduct(productId, 2);
    if (all.length === 1) return all[0];
    if (all.length === 0) return null;
    return all[0];
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
