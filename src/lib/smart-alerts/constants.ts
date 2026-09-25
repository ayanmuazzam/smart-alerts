/** App namespace from wix.config.json — must match Dev Center namespace. */
export const APP_NAMESPACE = '@ayanmuazzam/us-smart-alerts';

export const COLLECTIONS = {
  config: `${APP_NAMESPACE}/config`,
  subscriptions: `${APP_NAMESPACE}/subscriptions`,
  productOverrides: `${APP_NAMESPACE}/productOverrides`,
  templates: `${APP_NAMESPACE}/templates`,
  alerts: `${APP_NAMESPACE}/alerts`,
  whatsappQueue: `${APP_NAMESPACE}/whatsappQueue`,
  processedEvents: `${APP_NAMESPACE}/processedEvents`,
  pendingSends: `${APP_NAMESPACE}/pendingSends`,
} as const;

export const CONFIG_SINGLETON_ID = 'site-config';

export const DEFAULT_QUOTA = 5000;
export const PRICE_DROP_COOLDOWN_HOURS = 24;

export const DEFAULT_NOTIFICATION_LIMITS = {
  maxEmailPerCustomerPerDay: 3,
  maxEmailPerCustomerPerWeek: 10,
  maxWhatsappPerCustomerPerDay: 2,
  batchMode: 'immediate' as 'immediate' | 'hourly',
  batchHourUtc: 9,
};

export const DEFAULT_TRIGGER_RULES = {
  backInStockMinQty: 1,
  priceDropMinPercent: 0,
  priceDropMinAmount: 0,
  globalLowStockThreshold: 5,
  categoryLowStockDefaults: {} as Record<string, number>,
};

export const DEFAULT_WHATSAPP_SETUP = {
  mode: 'manual' as 'manual' | 'api',
  senderPhone: '',
  provider: 'none' as 'none' | 'twilio',
  connectionStatus: 'disconnected' as 'disconnected' | 'connected' | 'error',
  lastError: '',
};

export const DEFAULT_SYNC_SETTINGS = {
  cacheRefresh: 'realtime' as 'realtime' | 'hourly' | 'daily',
  lastEventAt: '' as string,
  lastCacheRefreshAt: '' as string,
  lastEventType: '' as string,
};

export type ModuleKey =
  | 'backInStock'
  | 'priceDrop'
  | 'manualWhatsapp'
  | 'sellerOutOfStock'
  | 'sellerLowStock'
  | 'sellerNewOrder'
  | 'digest'
  | 'stockCounter'
  | 'restockCountdown';

export type AlertType =
  | 'back_in_stock'
  | 'price_drop'
  | 'seller_oos'
  | 'seller_low_stock'
  | 'seller_new_order'
  | 'digest'
  | 'whatsapp';

export type SubscriptionType = 'back_in_stock' | 'price_drop';
export type SubscriptionState = 'waiting' | 'notified' | 'cancelled';

export const DEFAULT_MODULES: Record<ModuleKey, boolean> = {
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

export const DEFAULT_STOREFRONT_BUTTON = {
  label: 'Notify Me',
  backgroundColor: '#000000',
  textColor: '#FFFFFF',
  borderColor: '#FFFFFF',
  borderWidth: 0,
  borderRadius: 0,
  /** auto | full | custom CSS width e.g. 200px / 80% */
  widthMode: 'full' as 'auto' | 'full' | 'custom',
  customWidth: '200px',
  fontSize: 14,
  fontWeight: 600,
  paddingX: 48,
  paddingY: 15,
};

export const DEFAULT_APPEARANCE = {
  preset: 'teal',
  timerStyle: 'pill' as 'pill' | 'blocks' | 'banner',
  colors: {
    primary: '#0F766E',
    secondary: '#134E4A',
    accent: '#14B8A6',
    text: '#0F172A',
    background: '#FFFFFF',
    buttonText: '#FFFFFF',
    badge: '#F59E0B',
    muted: '#64748B',
    inputBackground: '#FFFFFF',
    inputText: '#0F172A',
    inputBorder: '#E2E8F0',
    label: '#64748B',
  },
  buttons: {
    notifyMe: {
      ...DEFAULT_STOREFRONT_BUTTON,
      label: 'Notify Me',
      backgroundColor: '#000000',
      textColor: '#FFFFFF',
      borderColor: '#FFFFFF',
      borderWidth: 0,
      borderRadius: 0,
      widthMode: 'full' as const,
      paddingX: 48,
      paddingY: 15,
      fontSize: 14,
    },
    priceDrop: {
      ...DEFAULT_STOREFRONT_BUTTON,
      label: 'Watch for price drop',
      backgroundColor: '#000000',
      textColor: '#FFFFFF',
      borderColor: '#FFFFFF',
      borderWidth: 0,
      borderRadius: 0,
      widthMode: 'full' as const,
      paddingX: 48,
      paddingY: 15,
      fontSize: 14,
    },
    modalSubmit: {
      ...DEFAULT_STOREFRONT_BUTTON,
      label: 'Subscribe',
      widthMode: 'full' as const,
      backgroundColor: '#000000',
      textColor: '#FFFFFF',
      borderColor: '#FFFFFF',
      borderWidth: 0,
      borderRadius: 0,
      paddingX: 48,
      paddingY: 15,
    },
  },
  modal: {
    borderRadius: 0,
    borderWidth: 0,
    padding: 48,
    maxWidth: 575,
    titleFontSize: 22,
    descriptionFontSize: 15,
    labelFontSize: 14,
    inputBorderRadius: 0,
    inputBorderWidth: 0,
    inputPadding: 15,
    notifyTitle: 'Notify me when back in stock',
    notifyDescription: "We'll email you when this product is available again.",
    priceTitle: 'Watch for price drop',
    priceDescription: 'Get an email when the price of this product drops.',
    emailLabel: 'Email',
    emailPlaceholder: 'you@example.com',
    phoneLabel: 'WhatsApp (optional)',
    phonePlaceholder: '+1…',
    notifyConsentLabel: 'I agree to receive stock alerts for this product.',
    priceConsentLabel: 'Send me a price-drop alert.',
  },
  cornerPosition: 'bottom-left' as
    | 'bottom-left'
    | 'bottom-right'
    | 'top-left'
    | 'top-right',
  stockThreshold: 10,
  customerLanguage: 'en',
};

export const DEFAULT_BRAND = {
  logoUrl: '',
  primaryColor: '#0F766E',
  secondaryColor: '#134E4A',
  footerText: 'Thanks for shopping with {store_name}.',
};

export const DEFAULT_SUPPORT = {
  supportEmail: '',
  supportWhatsapp: '',
};

export type EmailTemplateDefaults = {
  layout: 'Classic' | 'Centered' | 'Minimal';
  subject: string;
  preheader: string;
  headerStyle?: 'dark' | 'brand' | 'white';
  headerText?: string;
  showBadge?: boolean;
  badgeText?: string;
  headline: string;
  body: string;
  buttonLabel: string;
  showProductImage: boolean;
  reviewQuote?: string;
  showFeatures?: boolean;
  featuresTitle?: string;
  featuresText?: string;
  closingText?: string;
  signoffText?: string;
  footerDisclaimer?: string;
};

/** Attractive starter copy for each trigger — used by the engine and Customization UI. */
export const DEFAULT_EMAIL_TEMPLATES: Record<string, EmailTemplateDefaults> = {
  back_in_stock: {
    layout: 'Centered',
    subject: '{product_name} is back in stock 🎉',
    preheader: 'The wait is over — grab yours before it sells out again',
    headerStyle: 'dark',
    headerText: '{store_name}',
    showBadge: true,
    badgeText: 'Back in Stock 🎉',
    headline: "It's finally here!",
    body:
      'Hi {customer_name},\n\n' +
      'Great news—the item you were waiting for is officially restocked. Quantities are limited, so grab yours before it sells out again!',
    showProductImage: true,
    reviewQuote: '"Literally fits my entire life and goes with every outfit." — Sarah M.',
    buttonLabel: 'Shop Now Before It Sells Out',
    showFeatures: true,
    featuresTitle: "Why you'll love it:",
    featuresText:
      '100% Full-Grain Leather: Built to last a lifetime.\nPadded Sleeve: Fits laptops up to 15".\nFast Delivery: Free express shipping on this order.',
    closingText: 'Thanks for waiting patiently—happy shopping!',
    signoffText: 'The {store_name} Team',
    footerDisclaimer: 'You received this email because you signed up for back-in-stock alerts.',
  },
  price_drop: {
    layout: 'Centered',
    subject: 'Price drop alert: {product_name} 💸',
    preheader: 'The price you were watching just got better',
    headerStyle: 'dark',
    headerText: '{store_name}',
    showBadge: true,
    badgeText: 'Price Drop 📉',
    headline: 'Good news: Price just dropped!',
    body:
      'Hi {customer_name},\n\n' +
      'Great timing—the item you were watching just got a price reduction at {store_name}. Grab it at this discounted rate while supplies last.',
    showProductImage: true,
    reviewQuote: '"So glad I waited! Incredible quality for this price." — Jordan K.',
    buttonLabel: 'Claim Deal Before It Ends',
    showFeatures: true,
    featuresTitle: 'Special offer highlights:',
    featuresText:
      'Instant Savings: Special price reduction applied.\nIn Stock & Ready: Fast dispatch within 24 hours.\nGuaranteed Quality: 30-day money-back satisfaction guarantee.',
    closingText: 'Act fast before inventory sells out or prices change!',
    signoffText: 'The {store_name} Team',
    footerDisclaimer: 'You received this email because you subscribed to price-drop alerts.',
  },
  seller_oos: {
    layout: 'Centered',
    subject: 'Out of stock alert: {product_name} 🚫',
    preheader: 'A product just reached zero inventory',
    headerStyle: 'dark',
    headerText: '{store_name} Inventory',
    showBadge: true,
    badgeText: 'Out of Stock 🚫',
    headline: '{product_name} is out of stock',
    body:
      'Heads up—{product_name} just reached 0 stock in {store_name}.\n\n' +
      'Consider restocking or updating your catalog so shoppers aren’t disappointed.',
    showProductImage: false,
    reviewQuote: '',
    buttonLabel: 'Open Catalog',
    showFeatures: false,
    featuresTitle: '',
    featuresText: '',
    closingText: 'Keep your inventory stocked to maximize sales.',
    signoffText: 'Smart Alerts System',
    footerDisclaimer: 'Internal seller notification sent to store administrators.',
  },
  seller_low_stock: {
    layout: 'Centered',
    subject: 'Low stock warning: {product_name} ⚠️',
    preheader: 'Inventory fell below your threshold',
    headerStyle: 'dark',
    headerText: '{store_name} Inventory',
    showBadge: true,
    badgeText: 'Low Stock Warning ⚠️',
    headline: '{product_name} is running low',
    body:
      '{product_name} dropped below your low-stock threshold at {store_name}.\n\n' +
      'Restock soon to keep sales moving and avoid going out of stock.',
    showProductImage: false,
    reviewQuote: '',
    buttonLabel: 'Review Inventory',
    showFeatures: false,
    featuresTitle: '',
    featuresText: '',
    closingText: 'High demand detected—restock early.',
    signoffText: 'Smart Alerts System',
    footerDisclaimer: 'Internal seller notification sent to store administrators.',
  },
  seller_new_order: {
    layout: 'Centered',
    subject: 'New order at {store_name} 🛍️',
    preheader: 'A customer just placed an order',
    headerStyle: 'dark',
    headerText: '{store_name}',
    showBadge: true,
    badgeText: 'New Order Received 🛍️',
    headline: 'You have a new order!',
    body:
      'Nice work—a new order just came in at {store_name}.\n\n' +
      'Open your orders dashboard to fulfill it and keep the customer happy.',
    showProductImage: false,
    reviewQuote: '',
    buttonLabel: 'View Orders',
    showFeatures: false,
    featuresTitle: '',
    featuresText: '',
    closingText: 'Prompt fulfillment leads to 5-star customer reviews!',
    signoffText: 'Smart Alerts System',
    footerDisclaimer: 'Internal seller notification sent to store administrators.',
  },
  digest: {
    layout: 'Centered',
    subject: 'Your Smart Alerts digest from {store_name} 📊',
    preheader: 'A quick look at waitlists, alerts, and stock activity',
    headerStyle: 'dark',
    headerText: '{store_name}',
    showBadge: true,
    badgeText: 'Weekly Digest 📊',
    headline: 'Your Smart Alerts summary',
    body:
      'Hi there,\n\n' +
      'Here’s your Smart Alerts digest for {store_name}: active waitlists, recent notifications, and stock activity worth a glance.\n\n' +
      'Open the dashboard anytime to fine-tune modules and templates.',
    showProductImage: false,
    reviewQuote: '',
    buttonLabel: 'Open Dashboard',
    showFeatures: false,
    featuresTitle: '',
    featuresText: '',
    closingText: 'Review your alert automation performance anytime in the dashboard.',
    signoffText: 'Smart Alerts System',
    footerDisclaimer: 'Consolidated performance summary sent to store managers.',
  },
};

export function getDefaultEmailTemplate(triggerType: string): EmailTemplateDefaults {
  return DEFAULT_EMAIL_TEMPLATES[triggerType] || DEFAULT_EMAIL_TEMPLATES.back_in_stock;
}

/** Sample values so the live preview looks like a real email, not raw tokens. */
export const PREVIEW_TOKEN_SAMPLES: Record<string, string> = {
  store_name: 'Your Store',
  customer_name: 'Alex',
  product_name: 'Classic Linen Shirt',
  product_url: 'https://www.example.com/product',
};

export function renderPreviewTokens(template: string): string {
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, key: string) => {
    return PREVIEW_TOKEN_SAMPLES[key] ?? `{${key}}`;
  });
}
