/**
 * Site-safe defaults shared conceptually with lib/smart-alerts/constants.ts.
 * Keep values in sync — site plugins must not import backend lib modules.
 */
export const SITE_DEFAULT_MODULES: Record<string, boolean> = {
  backInStock: true,
  priceDrop: true,
  manualWhatsapp: true,
  sellerOutOfStock: true,
  sellerLowStock: true,
  sellerNewOrder: true,
  digest: false,
  stockCounter: true,
  restockCountdown: false,
};
