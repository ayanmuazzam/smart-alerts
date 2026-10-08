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

/** Human-readable option choices, e.g. `Blue / M`. */
export function formatVariantChoices(variant: CatalogVariantRaw | null | undefined): string {
  if (!variant?.choices?.length) return '';
  return variant.choices
    .map((c) => String(c.optionChoiceNames?.choiceName || '').trim())
    .filter(Boolean)
    .join(' / ');
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

export function mapV3SearchRow(p: CatalogProductRaw): SearchProductRow {
  const id = String(p._id || '');
  return {
    id,
    name: p.name || '',
    stockStatus: p.inventory?.availabilityStatus || '',
    price: Number(p.variantsInfo?.variants?.[0]?.price?.actualPrice?.amount || 0),
  };
}

export function mapV1SearchRow(p: CatalogProductRaw): SearchProductRow {
  return {
    id: String(p._id || ''),
    name: p.name || '',
    stockStatus: p.stock?.inventoryStatus || '',
    price: Number(p.priceData?.price || 0),
  };
}
