import { auth } from '@wix/essentials';

/**
 * Read a secret from Wix Secrets Manager.
 * Falls back to process.env only in local/dev — never log returned values.
 */
export async function getSecret(name: string): Promise<string | undefined> {
  try {
    const { secrets } = await import('@wix/secrets');
    const elevated = auth.elevate(secrets.getSecretValue);
    const result = await elevated(name);
    const value = (result as { value?: string })?.value;
    if (value) return value;
  } catch {
    /* Secrets Manager unavailable or name missing */
  }

  const isDev =
    typeof import.meta !== 'undefined' &&
    Boolean((import.meta as ImportMeta & { env?: { DEV?: boolean } }).env?.DEV);
  if (isDev) {
    return process.env[name];
  }
  return undefined;
}
