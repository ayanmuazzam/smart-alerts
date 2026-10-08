/** Loose catalog product shapes (V1 / V3) — prefer optional chaining over `as any`. */

export type MediaNode = {
  _id?: string;
  id?: string;
  url?: string;
  image?: string | { url?: string };
  thumbnail?: { url?: string };
};

export type CatalogVariantRaw = {
  /** V3 variants use `_id`; some envelopes also expose `id`. */
  _id?: string | null;
  id?: string;
  sku?: string | null;
  price?: {
    actualPrice?: { amount?: number | string };
    priceAfterDiscount?: { amount?: number | string };
    compareAtPrice?: { amount?: number | string };
  };
  choices?: Array<{
    optionChoiceNames?: { optionName?: string; choiceName?: string };
  }>;
  inventoryStatus?: { inStock?: boolean; preorderEnabled?: boolean };
};

export type CatalogProductRaw = {
  _id?: string;
  name?: string;
  slug?: string;
  url?: string | { url?: string };
  productPageUrl?: { base?: string; path?: string };
  media?: {
    main?: MediaNode;
    mainMedia?: MediaNode;
    items?: MediaNode[];
    itemsInfo?: { items?: MediaNode[] };
  };
  priceData?: { price?: number; discountedPrice?: number };
  stock?: { inventoryStatus?: string; quantity?: number | null };
  inventory?: { availabilityStatus?: string };
  variantsInfo?: {
    variants?: CatalogVariantRaw[];
  };
};

export type SearchProductRow = {
  id: string;
  name: string;
  stockStatus: string;
  price: number;
  /** Empty for product-level / V1; real id for multi-SKU V3 rows. */
  variantId?: string;
  /** Option choices only, e.g. `Blue / M`. */
  variantLabel?: string;
  sku?: string;
};

function isAbsoluteHttpUrl(value: unknown): boolean {
  const s = String(value || '').trim();
  return s.startsWith('http://') || s.startsWith('https://');
}

/** Pull a usable https image URL from V1 or V3 product media shapes. */
export function extractProductImage(product: CatalogProductRaw | null | undefined): string {
  if (!product) return '';
  const main = product.media?.main;
  const firstInfo = product.media?.itemsInfo?.items?.[0];
  const firstItem = product.media?.items?.[0];
  const candidates = [
    main?.url,
    main?.thumbnail?.url,
    typeof main?.image === 'string' ? main.image : main?.image?.url,
    firstInfo?.url,
    typeof firstInfo?.image === 'string' ? firstInfo.image : firstInfo?.image?.url,
    firstInfo?.thumbnail?.url,
    product.media?.mainMedia?.image &&
    typeof product.media.mainMedia.image !== 'string'
      ? product.media.mainMedia.image.url
      : typeof product.media?.mainMedia?.image === 'string'
        ? product.media.mainMedia.image
        : undefined,
    typeof firstItem?.image === 'string' ? firstItem.image : firstItem?.image?.url,
    firstItem?.url,
  ];
  for (const c of candidates) {
    const s = String(c || '').trim();
    if (s.startsWith('http://') || s.startsWith('https://')) return s;
  }
  const mediaId = main?._id || firstInfo?._id || firstInfo?.id || '';
  if (mediaId && !String(mediaId).includes('://')) {
    return `https://static.wixstatic.com/media/${mediaId}`;
  }
  return '';
}

/** Absolute product page URL from V1/V3 shapes. */
export function extractProductUrl(product: CatalogProductRaw | null | undefined): string {
  if (!product) return '';
  const joinedV1 =
    product.productPageUrl?.base && product.productPageUrl?.path
      ? `${product.productPageUrl.base}${product.productPageUrl.path}`
      : '';
  const candidates = [
    typeof product.url === 'string' ? product.url : product.url?.url,
    joinedV1,
    product.productPageUrl?.base,
  ];
  for (const c of candidates) {
    if (isAbsoluteHttpUrl(c)) return String(c).trim();
  }
  return '';
}

export function relativeProductPath(product: CatalogProductRaw | null | undefined): string {
  if (!product) return '';
  return String(
    (typeof product.url === 'string' ? '' : product.url?.url) ||
      product.productPageUrl?.path ||
      product.slug ||
      '',
  ).trim();
}

export { isAbsoluteHttpUrl };

export function variantKey(v: CatalogVariantRaw | null | undefined): string {
  return String(v?._id || v?.id || '').trim();
}

/** Human-readable option choices, e.g. `Color: Blue · Size: M`. */
export function formatVariantChoices(variant: CatalogVariantRaw | null | undefined): string {
  if (!variant?.choices?.length) return '';
  return variant.choices
    .map((c) => {
      const choice = String(c.optionChoiceNames?.choiceName || '').trim();
      const option = String(c.optionChoiceNames?.optionName || '').trim();
      if (option && choice) return `${option}: ${choice}`;
      return choice;
    })
    .filter(Boolean)
    .join(' · ');
}

/** Split `Product — Color: Blue` into base name + variant label. */
export function splitEnrichedProductName(name: string | undefined | null): {
  baseName: string;
  variantLabel: string;
} {
  const raw = String(name || '').trim();
  const sep = ' — ';
  const idx = raw.indexOf(sep);
  if (idx <= 0) return { baseName: raw, variantLabel: '' };
  return {
    baseName: raw.slice(0, idx).trim(),
    variantLabel: raw.slice(idx + sep.length).trim(),
  };
}

export function enrichProductName(
  productName: string,
  variant: CatalogVariantRaw | null | undefined,
): string {
  const base = String(productName || '').trim();
  const choices = formatVariantChoices(variant);
  if (!choices) return base;
  return base ? `${base} — ${choices}` : choices;
}

export function pickVariant(
  variants: CatalogVariantRaw[],
  variantId?: string,
): CatalogVariantRaw | undefined {
  const wanted = String(variantId || '').trim();
  if (wanted) {
    // Exact match only — never fall back to variants[0] for a different SKU.
    return variants.find((v) => variantKey(v) === wanted);
  }
  // No selection: sole/default variant, else first (product-level price hint).
  return variants[0];
}

/** Selling price for alerts: discounted when present, else actual. */
export function variantSellPrice(variant: CatalogVariantRaw | null | undefined): number {
  if (!variant?.price) return 0;
  const discounted = Number(variant.price.priceAfterDiscount?.amount || 0);
  if (discounted > 0) return discounted;
  return Number(variant.price.actualPrice?.amount || 0);
}

function variantStockStatus(
  variant: CatalogVariantRaw | undefined,
  productStatus: string,
): string {
  if (variant?.inventoryStatus && typeof variant.inventoryStatus.inStock === 'boolean') {
    return variant.inventoryStatus.inStock ? 'IN_STOCK' : 'OUT_OF_STOCK';
  }
  return productStatus || 'IN_STOCK';
}

/** One search row per product (legacy helpers / first-product hints). */
export function mapV3SearchRow(p: CatalogProductRaw): SearchProductRow {
  const rows = mapV3SearchRows(p);
  return rows[0] || { id: '', name: '', stockStatus: '', price: 0 };
}

/**
 * Expand a V3 product into tracker search rows.
 * Multi-SKU → one row per variant; simple products → one product/SKU row.
 */
export function mapV3SearchRows(p: CatalogProductRaw): SearchProductRow[] {
  const id = String(p._id || '');
  if (!id) return [];
  const productStatus = String(p.inventory?.availabilityStatus || '');
  const variants = p.variantsInfo?.variants || [];

  if (variants.length <= 1) {
    const v = variants[0];
    const vid = variantKey(v);
    const variantLabel = formatVariantChoices(v) || undefined;
    return [
      {
        id,
        name: variantLabel ? enrichProductName(p.name || '', v) : p.name || '',
        stockStatus: variantStockStatus(v, productStatus),
        price: variantSellPrice(v) || Number(v?.price?.actualPrice?.amount || 0),
        variantId: vid || '',
        variantLabel,
        sku: v?.sku ? String(v.sku) : undefined,
      },
    ];
  }

  return variants.map((v) => {
    const vid = variantKey(v);
    return {
      id,
      name: enrichProductName(p.name || '', v),
      stockStatus: variantStockStatus(v, productStatus),
      price: variantSellPrice(v),
      variantId: vid,
      variantLabel: formatVariantChoices(v) || undefined,
      sku: v?.sku ? String(v.sku) : undefined,
    };
  });
}

export function mapV1SearchRow(p: CatalogProductRaw): SearchProductRow {
  return {
    id: String(p._id || ''),
    name: p.name || '',
    stockStatus: p.stock?.inventoryStatus || '',
    price: Number(p.priceData?.price || 0),
    variantId: '',
  };
}
