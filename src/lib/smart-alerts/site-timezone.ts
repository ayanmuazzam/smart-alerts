import { auth, httpClient } from '@wix/essentials';

let cached: { tz: string; at: number } | null = null;
const TTL_MS = 5 * 60 * 1000;

/** Site Language & Region time zone (IANA), e.g. Asia/Karachi. */
export async function getSiteTimeZone(): Promise<string> {
  if (cached && Date.now() - cached.at < TTL_MS) return cached.tz;

  try {
    const elevatedFetch = auth.elevate(httpClient.fetchWithAuth);
    const res = await elevatedFetch('https://www.wixapis.com/site-properties/v4/properties');
    if (!res.ok) throw new Error(`site-properties ${res.status}`);
    const json = (await res.json()) as { properties?: { timeZone?: string } };
    const tz = String(json.properties?.timeZone || '').trim() || 'UTC';
    cached = { tz, at: Date.now() };
    return tz;
  } catch {
    return cached?.tz || 'UTC';
  }
}
