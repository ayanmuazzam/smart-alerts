/**
 * Call our app `/api/*` from the storefront without `httpClient.fetchWithAuth`.
 *
 * `fetchWithAuth` merges host `passThroughHeaders` including `x-wix-linguist`.
 * Wix app-host CORS allowlists Authorization/Content-Type but not `x-wix-linguist`,
 * so preflight from the storefront origin fails with "Failed to fetch".
 */
export async function fetchAppApi(url: string, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  try {
    const { auth } = await import('@wix/essentials');
    const authHeaders = await (auth.getContextualAuth() as any).getAuthHeaders?.();
    const authorization = (authHeaders as any)?.headers?.Authorization;
    if (authorization) {
      headers.set('Authorization', authorization);
    }
  } catch (err) {
    console.warn('[smart-alerts] Authorization unavailable', err);
  }

  return fetch(url, { ...init, headers });
}
