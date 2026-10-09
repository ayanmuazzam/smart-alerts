import { appInstances } from '@wix/app-management';
import { auth, httpClient } from '@wix/essentials';
import { markEventProcessed } from './config';
import { escapeHtml } from './sanitize';
import { getSecret } from './secrets';
import { sendWixTransactionalEmail } from './wix-email';

/** Default inbox for new-install alerts (override with secret INSTALL_NOTIFY_EMAIL). */
export const DEFAULT_INSTALL_NOTIFY_EMAIL = 'ayan.muazzam@unitedsol.net';

type SitePropertiesJson = {
  properties?: {
    timeZone?: string;
    businessName?: string;
    siteDisplayName?: string;
    email?: string;
    phone?: string;
    paymentCurrency?: string;
    language?: string;
  };
};

export type InstallSiteSnapshot = {
  instanceId: string;
  appVersion: string;
  isFree: boolean | null;
  siteId: string;
  siteName: string;
  siteUrl: string;
  locale: string;
  currency: string;
  timeZone: string;
  /**
   * Site owner's Wix login email (`site.ownerInfo.email`).
   * Requires app permission "Read Site Owner Email".
   */
  ownerEmail: string;
  ownerEmailStatus: string;
  /** Business contact email from Site Properties (often empty if never set). */
  businessEmail: string;
  phone: string;
  installedWixApps: string[];
  originInstanceId: string;
  /** Granted instance permission ids (for diagnosing missing owner-email scope). */
  grantedPermissions: string[];
  hasOwnerEmailPermission: boolean;
};

async function loadSitePropertiesExtras(): Promise<{
  businessName: string;
  siteDisplayName: string;
  businessEmail: string;
  phone: string;
  timeZone: string;
  currency: string;
}> {
  try {
    const elevatedFetch = auth.elevate(httpClient.fetchWithAuth);
    const res = await elevatedFetch('https://www.wixapis.com/site-properties/v4/properties');
    if (!res.ok) throw new Error(`site-properties ${res.status}`);
    const json = (await res.json()) as SitePropertiesJson;
    const props = json.properties || {};
    return {
      businessName: String(props.businessName || '').trim(),
      siteDisplayName: String(props.siteDisplayName || '').trim(),
      businessEmail: String(props.email || '').trim(),
      phone: String(props.phone || '').trim(),
      timeZone: String(props.timeZone || '').trim(),
      currency: String(props.paymentCurrency || '').trim(),
    };
  } catch {
    return {
      businessName: '',
      siteDisplayName: '',
      businessEmail: '',
      phone: '',
      timeZone: '',
      currency: '',
    };
  }
}

function permissionLooksLikeOwnerEmail(p: string): boolean {
  return /SITE.?OWNER.?EMAIL|OWNER.?EMAIL|READ.?SITE.?OWNER/i.test(p);
}

/** Gather site / instance details available right after install. */
export async function collectInstallSiteSnapshot(): Promise<InstallSiteSnapshot> {
  const get = auth.elevate(appInstances.getAppInstance);
  const [appRes, props] = await Promise.all([get(), loadSitePropertiesExtras()]);

  const instance = (appRes as { instance?: Record<string, unknown> })?.instance || {};
  const site = (appRes as { site?: Record<string, unknown> })?.site || {};
  const ownerInfo =
    (site.ownerInfo as { email?: string; emailStatus?: string } | undefined) || {};
  const grantedPermissions = Array.isArray(instance.permissions)
    ? (instance.permissions as string[])
    : [];
  const hasOwnerEmailPermission = grantedPermissions.some(permissionLooksLikeOwnerEmail);
  const ownerEmail = String(ownerInfo.email || '').trim();

  if (!ownerEmail) {
    console.warn(
      '[smart-alerts] install notify: site.ownerInfo.email empty. ' +
        'Add "Read Site Owner Email" in App Dashboard → Permissions, then reinstall/update so the site grants it. ' +
        `hasOwnerEmailPermissionHint=${hasOwnerEmailPermission} permissionCount=${grantedPermissions.length}`,
    );
  }

  const siteName =
    props.businessName ||
    props.siteDisplayName ||
    String(site.siteDisplayName || '').trim() ||
    'Unknown site';

  return {
    instanceId: String(instance.instanceId || '').trim(),
    appVersion: String(instance.appVersion || '').trim(),
    isFree: typeof instance.isFree === 'boolean' ? instance.isFree : null,
    siteId: String(site.siteId || '').trim(),
    siteName,
    siteUrl: String(site.url || '').trim(),
    locale: String(site.locale || '').trim(),
    currency: props.currency || String(site.paymentCurrency || '').trim(),
    timeZone: props.timeZone,
    ownerEmail,
    ownerEmailStatus: String(ownerInfo.emailStatus || '').trim(),
    businessEmail: props.businessEmail,
    phone: props.phone,
    installedWixApps: Array.isArray(site.installedWixApps)
      ? (site.installedWixApps as string[])
      : [],
    originInstanceId: String(instance.originInstanceId || '').trim(),
    grantedPermissions,
    hasOwnerEmailPermission,
  };
}

function row(label: string, value: string): string {
  const v = value.trim() || '—';
  return `<tr>
    <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:13px;width:160px;">${escapeHtml(label)}</td>
    <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#111827;font-size:13px;word-break:break-all;">${escapeHtml(v)}</td>
  </tr>`;
}

function ownerEmailDisplay(snap: InstallSiteSnapshot): string {
  if (snap.ownerEmail) return snap.ownerEmail;
  if (!snap.hasOwnerEmailPermission) {
    return '— missing permission: add "Read Site Owner Email" in App Dashboard, then update/reinstall';
  }
  return '— ownerInfo.email not returned (permission may need site re-approval)';
}

function buildInstallNotifyHtml(snap: InstallSiteSnapshot): string {
  // Prefer site owner (Wix login / admin) over business contact — business email is often unset.
  const primaryContact = snap.ownerEmail || snap.businessEmail || ownerEmailDisplay(snap);

  return `<!DOCTYPE html><html><body style="margin:0;padding:24px;font-family:Arial,Helvetica,sans-serif;background:#f8fafc;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
    <div style="padding:20px 24px;background:#111827;color:#ffffff;">
      <h1 style="margin:0;font-size:18px;">Smart Alerts — New Install</h1>
      <p style="margin:8px 0 0;font-size:13px;opacity:0.85;">A site just installed the app.</p>
    </div>
    <div style="padding:8px 0 16px;">
      <table style="width:100%;border-collapse:collapse;">
        ${row('Site name', snap.siteName)}
        ${row('Site URL', snap.siteUrl || '(unpublished)')}
        ${row('Primary contact', primaryContact)}
        ${row('Site owner email', ownerEmailDisplay(snap))}
        ${row('Owner email status', snap.ownerEmailStatus)}
        ${row('Business email', snap.businessEmail || '— (empty if merchant never set Business Info email)')}
        ${row('Phone', snap.phone)}
        ${row('Site ID', snap.siteId)}
        ${row('Instance ID', snap.instanceId)}
        ${row('App version', snap.appVersion)}
        ${row('Plan', snap.isFree == null ? '' : snap.isFree ? 'Free' : 'Paid')}
        ${row('Locale', snap.locale)}
        ${row('Currency', snap.currency)}
        ${row('Time zone', snap.timeZone)}
        ${row('Wix apps', snap.installedWixApps.join(', '))}
        ${row('Origin instance', snap.originInstanceId)}
        ${row('Installed at (UTC)', new Date().toISOString())}
      </table>
    </div>
  </div>
</body></html>`;
}

/**
 * Email the developer inbox with site details after install.
 * Failures are logged only — never block catalog seed / install flow.
 * De-duped per instanceId so webhook retries / double deliveries send once.
 */
export async function notifyDeveloperOfInstall(): Promise<void> {
  const to =
    (await getSecret('INSTALL_NOTIFY_EMAIL'))?.trim() || DEFAULT_INSTALL_NOTIFY_EMAIL;

  let snap: InstallSiteSnapshot;
  try {
    snap = await collectInstallSiteSnapshot();
  } catch (err) {
    console.error('[smart-alerts] install notify: failed to collect site info', err);
    return;
  }

  const dedupeKey =
    snap.instanceId || snap.siteId
      ? `install-notify:${snap.instanceId || snap.siteId}`
      : '';
  if (dedupeKey && (await markEventProcessed(dedupeKey, 'app_instance_installed_notify'))) {
    console.log(`[smart-alerts] install notify skipped (already sent) ${dedupeKey}`);
    return;
  }

  const subject = `Smart Alerts installed — ${snap.siteName || snap.siteId || 'new site'}`;
  try {
    await sendWixTransactionalEmail({
      to,
      subject,
      html: buildInstallNotifyHtml(snap),
      fromName: 'Smart Alerts Installs',
    });
    console.log(
      `[smart-alerts] install notify sent to ${to} siteId=${snap.siteId} instanceId=${snap.instanceId} ` +
        `ownerEmail=${snap.ownerEmail || '(empty)'} businessEmail=${snap.businessEmail || '(empty)'}`,
    );
  } catch (err) {
    console.error('[smart-alerts] install notify email failed', err);
  }
}
