import { auth, httpClient } from '@wix/essentials';

type SitePropsSnapshot = {
  tz: string;
  storeName: string;
  at: number;
};

let cached: SitePropsSnapshot | null = null;
const TTL_MS = 5 * 60 * 1000;

type SitePropertiesJson = {
  properties?: {
    timeZone?: string;
    businessName?: string;
    siteDisplayName?: string;
  };
};

async function loadSiteProperties(): Promise<{ tz: string; storeName: string }> {
  if (cached && Date.now() - cached.at < TTL_MS) {
    return { tz: cached.tz, storeName: cached.storeName };
  }

  try {
    const elevatedFetch = auth.elevate(httpClient.fetchWithAuth);
    const res = await elevatedFetch('https://www.wixapis.com/site-properties/v4/properties');
    if (!res.ok) throw new Error(`site-properties ${res.status}`);
    const json = (await res.json()) as SitePropertiesJson;
    const props = json.properties || {};
    const tz = String(props.timeZone || '').trim() || 'UTC';
    // Prefer business name (Settings → Business info), then site display name.
    const storeName =
      String(props.businessName || props.siteDisplayName || '').trim() || 'Store';
    cached = { tz, storeName, at: Date.now() };
    return { tz, storeName };
  } catch {
    return {
      tz: cached?.tz || 'UTC',
      storeName: cached?.storeName || 'Store',
    };
  }
}

/** Site Language & Region time zone (IANA), e.g. Asia/Karachi. */
export async function getSiteTimeZone(): Promise<string> {
  const { tz } = await loadSiteProperties();
  return tz;
}

/** Business / site display name for emails (`{store_name}`). */
export async function getSiteStoreName(): Promise<string> {
  const { storeName } = await loadSiteProperties();
  return storeName;
}
