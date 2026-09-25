import { httpClient } from '@wix/essentials';

export async function parseAdminResponse(res: Response) {
  let data: any = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  if (!res.ok) {
    const message =
      (data && (data.error || data.message)) || `Request failed (${res.status})`;
    throw new Error(String(message));
  }
  return data ?? {};
}

export async function adminGet(view: string, extra = '') {
  const url = new URL('/api/admin?view=' + encodeURIComponent(view) + extra, import.meta.url).href;
  const res = await httpClient.fetchWithAuth(url);
  return parseAdminResponse(res);
}

export async function adminPost(body: Record<string, unknown>) {
  const url = new URL('/api/admin', import.meta.url).href;
  const res = await httpClient.fetchWithAuth(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return parseAdminResponse(res);
}

export interface ModuleMetaItem {
  key: string;
  group: 'CUSTOMERS' | 'SELLER' | 'URGENCY' | string;
  title: string;
  description: string;
  channel: string;
  delivery: string;
  iconName: string;
  templateKey?: string;
  customizationTarget?: 'email' | 'storefront' | 'whatsapp';
  tag?: 'ASSET' | 'SLOW';
}

export const MODULE_META: ModuleMetaItem[] = [
  {
    key: 'backInStock',
    group: 'CUSTOMERS',
    title: 'Back In Stock Alerts',
    description: 'Notify subscribed shoppers when out-of-stock items are replenished.',
    channel: 'Email',
    delivery: 'Instant',
    iconName: 'Package',
    templateKey: 'back_in_stock',
    customizationTarget: 'email',
    tag: 'ASSET',
  },
  {
    key: 'priceDrop',
    group: 'CUSTOMERS',
    title: 'Price Drop Watch',
    description: 'Alert shoppers when a tracked product drops in price.',
    channel: 'Email',
    delivery: 'Instant',
    iconName: 'Tag',
    templateKey: 'price_drop',
    customizationTarget: 'email',
    tag: 'ASSET',
  },
  {
    key: 'manualWhatsapp',
    group: 'CUSTOMERS',
    title: 'WhatsApp Direct Chat',
    description: 'Prepare ready-to-send wa.me customer chat links.',
    channel: 'WhatsApp',
    delivery: 'Queue',
    iconName: 'Chat',
    customizationTarget: 'whatsapp',
    tag: 'ASSET',
  },
  {
    key: 'sellerOutOfStock',
    group: 'SELLER',
    title: 'Out of Stock Alert',
    description: 'Email the store manager immediately when an item hits 0 stock.',
    channel: 'Email',
    delivery: 'Instant',
    iconName: 'StatusAlert',
    templateKey: 'seller_oos',
    customizationTarget: 'email',
    tag: 'ASSET',
  },
  {
    key: 'sellerLowStock',
    group: 'SELLER',
    title: 'Low Stock Threshold Alert',
    description: 'Email when inventory drops below your defined threshold.',
    channel: 'Email',
    delivery: 'Threshold',
    iconName: 'StatusAlert',
    templateKey: 'seller_low_stock',
    customizationTarget: 'email',
    tag: 'ASSET',
  },
  {
    key: 'sellerNewOrder',
    group: 'SELLER',
    title: 'New Order Notification',
    description: 'Send quick order alerts for faster fulfillment handling.',
    channel: 'Email',
    delivery: 'Instant',
    iconName: 'AddReceipt',
    templateKey: 'seller_new_order',
    customizationTarget: 'email',
    tag: 'ASSET',
  },
  {
    key: 'digest',
    group: 'SELLER',
    title: 'Periodic Digest Summary',
    description: 'Consolidated summary of stock movement, alerts, and demand.',
    channel: 'Email',
    delivery: 'Scheduled',
    iconName: 'DateAndTime',
    templateKey: 'digest',
    customizationTarget: 'email',
    tag: 'SLOW',
  },
  {
    key: 'stockCounter',
    group: 'URGENCY',
    title: 'Low Stock Counter ("Only X Left")',
    description: 'Show live urgency badges on product pages to drive conversions.',
    channel: 'Storefront',
    delivery: 'On-site',
    iconName: 'Sparkles',
    customizationTarget: 'storefront',
    tag: 'ASSET',
  },
  {
    key: 'restockCountdown',
    group: 'URGENCY',
    title: 'Restock Countdown Timer',
    description: 'Display an expected restock countdown timer on sold-out products.',
    channel: 'Storefront',
    delivery: 'On-site',
    iconName: 'Timer',
    customizationTarget: 'storefront',
    tag: 'SLOW',
  },
];

export const TEMPLATE_VARIABLES = [
  '{store_name}',
  '{customer_name}',
  '{product_name}',
  '{product_url}',
];

export type PrimaryTab = 'dashboard' | 'automation' | 'email' | 'storefront' | 'settings';
export type AutomationSub = 'rules' | 'lists' | 'inventory' | 'whatsapp' | 'history';
export type CustomizationSub = 'email' | 'storefront';
export type SettingsSub = 'general' | 'notifications' | 'triggers' | 'whatsapp' | 'sync';
