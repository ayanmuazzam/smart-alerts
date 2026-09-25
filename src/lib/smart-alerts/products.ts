import {
  catalogVersioning,
  products,
  productsV3,
  inventoryItemsV3,
} from '@wix/stores';
import { auth } from '@wix/essentials';
import { items } from '@wix/data';
import { COLLECTIONS } from './constants';

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

export async function getProductSnapshot(
  productId: string,
  variantId?: string,
): Promise<ProductSnapshot | null> {
  const version = await getCatalogVersion();
  if (version === 'STORES_NOT_INSTALLED') return null;

  if (version === 'V3_CATALOG') {
    const getProduct = auth.elevate(productsV3.getProduct);
    const result = (await getProduct(productId, {
      fields: ['CURRENCY', 'URL', 'MEDIA_ITEMS_INFO'] as never,
    })) as any;
    const product = result?.product || result;
    if (!product) return null;
    const variants = product.variantsInfo?.variants || [];
    const variant =
      (variantId && variants.find((v: { id?: string }) => v.id === variantId)) || variants[0];
    const amount = Number(variant?.price?.actualPrice?.amount || 0);
    const availability = product.inventory?.availabilityStatus || 'IN_STOCK';
    const quantity = await getInventoryQuantity(productId);
    return {
      productId,
      variantId: variant?.id || '',
      name: product.name || '',
      url: product.url?.url || '',
      image: product.media?.main?.image || '',
      price: amount,
      inStock: availability === 'IN_STOCK' || availability === 'PARTIALLY_OUT_OF_STOCK',
      quantity,
      stockStatus: String(availability),
    };
  }

  const getProduct = auth.elevate(products.getProduct);
  const result = (await getProduct(productId)) as any;
  const product = result?.product || result;
  if (!product) return null;
  const price = Number(product.priceData?.discountedPrice ?? product.priceData?.price ?? 0);
  const status = product.stock?.inventoryStatus || 'IN_STOCK';
  return {
    productId,
    variantId: variantId || '',
    name: product.name || '',
    url: product.productPageUrl?.base || '',
    image: product.media?.mainMedia?.image?.url || '',
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
    // Name lookup requires Search Products — Query Products does not support it.
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
    )) as { products?: any[] };
    return (result.products || []).map((p) => ({
      id: p._id!,
      name: p.name || '',
      stockStatus: p.inventory?.availabilityStatus || '',
      price: Number(p.variantsInfo?.variants?.[0]?.price?.actualPrice?.amount || 0),
    }));
  }

  const query = auth.elevate(products.queryProducts);
  let builder: any = query();
  if (term) builder = builder.startsWith('name', term);
  const result = await builder.limit(limit).find();
  return ((result.items || []) as any[]).map((p) => ({
    id: p._id!,
    name: p.name || '',
    stockStatus: p.stock?.inventoryStatus || '',
    price: Number(p.priceData?.price || 0),
  }));
}

export async function loadOutOfStockProducts(limit = 50) {
  const version = await getCatalogVersion();
  if (version === 'STORES_NOT_INSTALLED') return [] as any[];

  if (version === 'V3_CATALOG') {
    // inventory.availabilityStatus is filterable on Search Products only,
    // not Query Products (unsupported filter → INVALID_ARGUMENT).
    const search = auth.elevate(productsV3.searchProducts);
    const result = (await search(
      {
        filter: {
          'inventory.availabilityStatus': { $eq: 'OUT_OF_STOCK' },
        },
        cursorPaging: { limit },
      } as never,
      { fields: ['CURRENCY'] as never },
    )) as { products?: any[] };
    return result.products || [];
  }

  const query = auth.elevate(products.queryProducts);
  const builder: any = query();
  const result = await builder.eq('stock.inventoryStatus', 'OUT_OF_STOCK').limit(limit).find();
  return result.items || [];
}

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
}) {
  const query = auth.elevate(items.query);
  const existing = await query(COLLECTIONS.productOverrides)
    .eq('productId', data.productId)
    .eq('variantId', data.variantId || '')
    .limit(1)
    .find();

  const payload: Record<string, unknown> = {
    title: data.productName || data.productId,
    productId: data.productId,
    variantId: data.variantId || '',
    productName: data.productName || '',
    sku: '',
    lowStockThreshold: data.lowStockThreshold ?? existing.items[0]?.lowStockThreshold ?? 5,
    useGlobalThreshold: data.useGlobalThreshold ?? existing.items[0]?.useGlobalThreshold ?? true,
    restockAt:
      data.restockAt !== undefined
        ? data.restockAt
          ? new Date(data.restockAt)
          : null
        : existing.items[0]?.restockAt ?? null,
    lastKnownPrice: data.lastKnownPrice ?? existing.items[0]?.lastKnownPrice ?? 0,
    lastStockStatus: data.lastStockStatus || existing.items[0]?.lastStockStatus || '',
    tracked: data.tracked ?? true,
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

export async function getInventoryQuantity(productId: string): Promise<number | null> {
  try {
    const version = await getCatalogVersion();
    if (version !== 'V3_CATALOG') return null;
    const query = auth.elevate(inventoryItemsV3.queryInventoryItems);
    const result = await query().eq('productId', productId).limit(1).find();
    const item = result.items?.[0] as { quantity?: number } | undefined;
    return item?.quantity ?? null;
  } catch {
    return null;
  }
}
