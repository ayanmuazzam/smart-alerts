import { auth } from '@wix/essentials';
import { AppStrategy } from '@wix/sdk';

type TokenInfo = {
  active?: boolean;
  subjectType?: string;
  exp?: number;
};

const DASHBOARD_SUBJECTS = new Set(['USER', 'APP']);

function env(name: string): string | undefined {
  const meta = import.meta as ImportMeta & { env?: Record<string, string | undefined> };
  return meta.env?.[name] ?? process.env[name];
}

function normalizeJwt(authorization: string | null): { header: string; jwt: string } | null {
  const header = authorization?.trim() || '';
  if (!header) return null;
  const jwt = header.replace(/^Bearer\s+/i, '').trim();
  if (!jwt) return null;
  return { header, jwt };
}

function isExpired(exp?: number): boolean {
  return typeof exp === 'number' && exp * 1000 < Date.now();
}

function isAllowedSubject(info: TokenInfo): boolean {
  if (info.active === false) return false;
  if (isExpired(info.exp)) return false;
  const subject = info.subjectType || 'UNKNOWN';
  return DASHBOARD_SUBJECTS.has(subject);
}

async function introspectToken(token: string): Promise<TokenInfo | null> {
  try {
    const res = await fetch('https://www.wixapis.com/oauth2/token-info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    if (!res.ok) return null;
    return (await res.json()) as TokenInfo;
  } catch {
    return null;
  }
}

/** Dashboard fetchWithAuth often sends a signed instance JWT — verify with app public key. */
async function verifySignedInstanceJwt(jwt: string, authorizationHeader: string): Promise<boolean> {
  const appId = env('WIX_CLIENT_ID');
  const publicKey = env('WIX_CLIENT_PUBLIC_KEY');
  if (!appId || !publicKey) return false;
  try {
    const strategy = AppStrategy({
      appId,
      publicKey,
      accessToken: authorizationHeader,
    });
    if (typeof strategy.decodeJWT !== 'function') return false;
    try {
      const strict = await strategy.decodeJWT(jwt, true);
      if (strict.valid) return true;
    } catch {
      /* try signature-only */
    }
    const relaxed = await strategy.decodeJWT(jwt, false);
    return Boolean(relaxed.valid);
  } catch {
    return false;
  }
}

/**
 * Require a valid dashboard session before any auth.elevate.
 * Accepts Wix user tokens (USER) and app instance tokens (APP) from fetchWithAuth.
 */
export async function requireDashboardAuth(request: Request): Promise<Response | null> {
  const parsed = normalizeJwt(request.headers.get('Authorization'));
  if (!parsed) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { header, jwt } = parsed;

  const fromJwt = await introspectToken(jwt);
  if (fromJwt && isAllowedSubject(fromJwt)) {
    return null;
  }

  if (header !== jwt) {
    const fromHeader = await introspectToken(header);
    if (fromHeader && isAllowedSubject(fromHeader)) {
      return null;
    }
  }

  if (await verifySignedInstanceJwt(jwt, header)) {
    return null;
  }

  try {
    const contextual = await auth.getTokenInfo();
    if (isAllowedSubject(contextual as TokenInfo)) {
      return null;
    }
  } catch {
    /* no async auth context */
  }

  return Response.json({ error: 'Unauthorized' }, { status: 401 });
}
