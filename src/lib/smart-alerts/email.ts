import { items } from '@wix/data';
import { auth } from '@wix/essentials';
import {
  COLLECTIONS,
  getDefaultEmailTemplate,
  type AlertType,
} from './constants';
import { getOrCreateConfig, type SiteConfig } from './config';

type TokenMap = Record<string, string | number | undefined | null>;

export function renderTokens(template: string, tokens: TokenMap): string {
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, key: string) => {
    const value = tokens[key];
    return value == null ? '' : String(value);
  });
}

export function buildEmailHtml(opts: {
  layout?: string;
  headline?: string;
  body?: string;
  buttonLabel?: string;
  buttonUrl?: string;
  productName?: string;
  productPrice?: string;
  productImage?: string;
  showProductImage?: boolean;
  reviewQuote?: string;
  headerStyle?: string;
  headerText?: string;
  showBadge?: boolean;
  badgeText?: string;
  showFeatures?: boolean;
  featuresTitle?: string;
  featuresText?: string;
  closingText?: string;
  signoffText?: string;
  brandColor?: string;
  logoUrl?: string;
  footerText?: string;
  preheader?: string;
}): string {
  const brandColor = opts.brandColor || '#2563eb';
  const preheaderHtml = opts.preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all;">${opts.preheader}</div>`
    : '';

  // Header styling
  const headerStyle = opts.headerStyle || 'dark';
  let headerBg = '#111827';
  let headerColor = '#ffffff';
  let headerBorder = 'none';
  if (headerStyle === 'brand') {
    headerBg = brandColor;
    headerColor = '#ffffff';
  } else if (headerStyle === 'white') {
    headerBg = '#ffffff';
    headerColor = '#111827';
    headerBorder = '1px solid #e5e7eb';
  }

  const headerTitle = opts.headerText || 'YOUR STORE';
  const headerContent = opts.logoUrl
    ? `<img src="${opts.logoUrl}" alt="${headerTitle}" style="max-height:44px;max-width:200px;object-fit:contain;vertical-align:middle;" />`
    : `<h1 style="margin:0;font-size:20px;letter-spacing:2px;text-transform:uppercase;color:${headerColor};font-weight:700;">${headerTitle}</h1>`;

  // Badge
  const badgeHtml =
    opts.showBadge !== false && opts.badgeText
      ? `<span style="display:inline-block;background-color:#fef3c7;color:#d97706;font-weight:600;font-size:12px;padding:4px 12px;border-radius:9999px;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;">${opts.badgeText}</span>`
      : '';

  // Headline & Body
  const headline = opts.headline || "It's finally here!";
  const bodyText = (opts.body || '').replace(/\n/g, '<br/>');

  // Product Card
  let productCardHtml = '';
  if (opts.showProductImage && opts.layout !== 'Minimal') {
    const prodImg = opts.productImage
      ? `<img src="${opts.productImage}" alt="${opts.productName || 'Product'}" style="width:100%;max-width:300px;height:auto;border-radius:6px;margin-bottom:14px;object-fit:cover;" />`
      : `<div style="width:100%;max-width:300px;height:140px;background:#e5e7eb;border-radius:6px;margin:0 auto 14px;display:flex;align-items:center;justify-content:center;color:#6b7280;font-weight:600;font-size:13px;">Product Photo</div>`;
    const prodTitle = opts.productName || 'Featured Restock Item';
    const prodPrice = opts.productPrice || '$140.00';
    const quoteHtml = opts.reviewQuote
      ? `<p style="font-style:italic;font-size:13px;color:#6b7280;margin:6px 0 0 0;">${opts.reviewQuote}</p>`
      : '';

    productCardHtml = `
      <div style="border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin:0 0 24px 0;background-color:#fafafa;text-align:center;">
        ${prodImg}
        <h3 style="font-size:18px;font-weight:700;margin:0 0 6px 0;color:#111827;">${prodTitle}</h3>
        <p style="font-size:16px;color:#059669;font-weight:600;margin:0 0 8px 0;">${prodPrice}</p>
        ${quoteHtml}
      </div>`;
  }

  // CTA Button
  const buttonUrl = opts.buttonUrl || '#';
  const buttonLabel = opts.buttonLabel || 'Shop Now Before It Sells Out';
  const buttonHtml = `
    <div style="margin-bottom:24px;">
      <a href="${buttonUrl}" style="display:inline-block;background-color:${brandColor};color:#ffffff !important;font-weight:600;font-size:15px;text-decoration:none;padding:14px 28px;border-radius:6px;box-shadow:0 2px 6px rgba(0,0,0,0.08);">${buttonLabel}</a>
    </div>`;

  // Features List
  let featuresHtml = '';
  if (opts.showFeatures && opts.featuresText && opts.layout !== 'Minimal') {
    const listItems = opts.featuresText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => `<li style="margin-bottom:6px;">${line}</li>`)
      .join('');
    featuresHtml = `
      <div style="text-align:left;background-color:#f9fafb;border:1px solid #f1f5f9;padding:16px 20px;border-radius:6px;margin-bottom:24px;">
        <strong style="color:#111827;font-size:14px;">${opts.featuresTitle || "Why you'll love it:"}</strong>
        <ul style="margin:8px 0 0 0;padding-left:20px;color:#4b5563;font-size:14px;">
          ${listItems}
        </ul>
      </div>`;
  }

  // Closing & Signoff
  let closingHtml = '';
  if (opts.closingText || opts.signoffText) {
    closingHtml = `
      <p style="font-size:14.5px;line-height:1.6;color:#4b5563;margin:0 0 24px 0;">
        ${opts.closingText ? `${opts.closingText}<br/>` : ''}
        ${opts.signoffText ? `<strong style="color:#111827;">${opts.signoffText}</strong>` : ''}
      </p>`;
  }

  // Footer
  const footerDisclaimer =
    opts.footerText || 'You received this email because you signed up for alerts.';

  const isCentered = opts.layout !== 'Classic';
  const contentAlign = isCentered ? 'center' : 'left';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${headline}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#333333;">
  ${preheaderHtml}
  <div style="max-width:600px;margin:20px auto;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 4px 10px rgba(0,0,0,0.05);">
    <!-- Header -->
    <div style="padding:24px;text-align:center;background-color:${headerBg};border-bottom:${headerBorder};">
      ${headerContent}
    </div>

    <!-- Main Content -->
    <div style="padding:32px 24px;text-align:${contentAlign};">
      ${badgeHtml}
      <h2 style="font-size:24px;font-weight:800;margin:0 0 12px 0;color:#111827;line-height:1.3;">${headline}</h2>
      <p style="font-size:15px;line-height:1.6;color:#4b5563;margin:0 0 24px 0;">
        ${bodyText}
      </p>

      ${productCardHtml}
      ${buttonHtml}
      ${featuresHtml}
      ${closingHtml}
    </div>

    <!-- Footer -->
    <div style="background-color:#f9fafb;padding:20px;text-align:center;font-size:12px;color:#9ca3af;border-top:1px solid #e5e7eb;">
      <p style="margin:0 0 8px 0;">${footerDisclaimer}</p>
      <p style="margin:0;">
        <a href="#" style="color:#6b7280;text-decoration:underline;">Unsubscribe</a> &bull;
        <a href="#" style="color:#6b7280;text-decoration:underline;">Manage Preferences</a> &bull;
        <a href="#" style="color:#6b7280;text-decoration:underline;">View in Browser</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

async function getResendApiKey(): Promise<string | undefined> {
  try {
    const { secrets } = await import('@wix/secrets');
    const elevated = auth.elevate(secrets.getSecretValue);
    const result = await elevated('RESEND_API_KEY');
    return (result as { value?: string })?.value || (result as unknown as string);
  } catch {
    return process.env.RESEND_API_KEY as string | undefined;
  }
}

export async function countAlertsUsed(days = 30): Promise<number> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const query = auth.elevate(items.query);
  const result = await query(COLLECTIONS.alerts)
    .eq('status', 'sent')
    .ge('sentAt', since)
    .limit(1000)
    .find();
  return result.items.length;
}

export async function canSendAlert(config?: SiteConfig): Promise<{ ok: boolean; used: number; remaining: number; quota: number }> {
  const cfg = config || (await getOrCreateConfig());
  const used = await countAlertsUsed(30);
  const quota = cfg.monthlyAlertQuota || 5000;
  return { ok: used < quota, used, remaining: Math.max(0, quota - used), quota };
}

export async function countCustomerAlerts(
  to: string,
  channel: string,
  days: number,
): Promise<number> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const query = auth.elevate(items.query);
  const result = await query(COLLECTIONS.alerts)
    .eq('to', to)
    .eq('channel', channel)
    .eq('status', 'sent')
    .ge('sentAt', since)
    .limit(500)
    .find();
  return result.items.length;
}

/** Per-customer throttle based on notificationLimits. */
export async function canNotifyCustomer(
  to: string,
  channel: 'email' | 'whatsapp',
  config?: SiteConfig,
): Promise<{ ok: boolean; reason?: string }> {
  const cfg = config || (await getOrCreateConfig());
  const limits = cfg.notificationLimits;
  if (channel === 'email') {
    const day = await countCustomerAlerts(to, 'email', 1);
    if (day >= (limits.maxEmailPerCustomerPerDay ?? 3)) {
      return { ok: false, reason: 'Daily email limit reached for this customer' };
    }
    const week = await countCustomerAlerts(to, 'email', 7);
    if (week >= (limits.maxEmailPerCustomerPerWeek ?? 10)) {
      return { ok: false, reason: 'Weekly email limit reached for this customer' };
    }
  } else {
    const day = await countCustomerAlerts(to, 'whatsapp', 1);
    if (day >= (limits.maxWhatsappPerCustomerPerDay ?? 2)) {
      return { ok: false, reason: 'Daily WhatsApp limit reached for this customer' };
    }
  }
  return { ok: true };
}

export async function logAlert(entry: {
  alertType: AlertType | string;
  channel: string;
  to: string;
  status: 'sent' | 'skipped' | 'failed';
  productId?: string;
  errorMessage?: string;
}) {
  const insert = auth.elevate(items.insert);
  await insert(COLLECTIONS.alerts, {
    title: `${entry.alertType} → ${entry.to}`,
    alertType: entry.alertType,
    channel: entry.channel,
    to: entry.to,
    status: entry.status,
    productId: entry.productId || '',
    errorMessage: entry.errorMessage || '',
    sentAt: new Date(),
  });
}

export async function sendTransactionalEmail(opts: {
  to: string;
  subject: string;
  html: string;
  fromName?: string;
  replyTo?: string;
  alertType: AlertType | string;
  productId?: string;
  skipCustomerLimit?: boolean;
}): Promise<boolean> {
  const config = await getOrCreateConfig();
  const quota = await canSendAlert(config);
  if (!quota.ok) {
    await logAlert({
      alertType: opts.alertType,
      channel: 'email',
      to: opts.to,
      status: 'skipped',
      productId: opts.productId,
      errorMessage: 'Quota exceeded',
    });
    return false;
  }

  if (!opts.skipCustomerLimit) {
    const customer = await canNotifyCustomer(opts.to, 'email', config);
    if (!customer.ok) {
      await logAlert({
        alertType: opts.alertType,
        channel: 'email',
        to: opts.to,
        status: 'skipped',
        productId: opts.productId,
        errorMessage: customer.reason,
      });
      return false;
    }
  }

  const apiKey = await getResendApiKey();
  if (!apiKey) {
    await logAlert({
      alertType: opts.alertType,
      channel: 'email',
      to: opts.to,
      status: 'failed',
      productId: opts.productId,
      errorMessage: 'RESEND_API_KEY not configured',
    });
    return false;
  }

  try {
    const { Resend } = await import('resend');
    const resend = new Resend(apiKey);
    const fromName = opts.fromName || 'Smart Alerts';
    await resend.emails.send({
      from: `${fromName} <onboarding@resend.dev>`,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      replyTo: opts.replyTo || undefined,
    });
    await logAlert({
      alertType: opts.alertType,
      channel: 'email',
      to: opts.to,
      status: 'sent',
      productId: opts.productId,
    });
    return true;
  } catch (err) {
    await logAlert({
      alertType: opts.alertType,
      channel: 'email',
      to: opts.to,
      status: 'failed',
      productId: opts.productId,
      errorMessage: err instanceof Error ? err.message : String(err),
    });
    return false;
  }
}

export async function getTemplate(triggerType: string) {
  const query = auth.elevate(items.query);
  const result = await query(COLLECTIONS.templates)
    .eq('triggerType', triggerType)
    .eq('channel', 'email')
    .limit(1)
    .find();
  if (result.items[0]) return result.items[0];

  const d = getDefaultEmailTemplate(triggerType);
  return { triggerType, channel: 'email', title: triggerType, ...d } as Record<string, unknown>;
}
