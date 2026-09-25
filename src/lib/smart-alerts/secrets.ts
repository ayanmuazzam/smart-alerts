import { auth } from '@wix/essentials';

/** Read a secret from Wix Secrets Manager, falling back to process.env for local dev. */
export async function getSecret(name: string): Promise<string | undefined> {
  try {
    const { secrets } = await import('@wix/secrets');
    const elevated = auth.elevate(secrets.getSecretValue);
    const result = await elevated(name);
    return (result as { value?: string })?.value || (result as unknown as string);
  } catch {
    return process.env[name] as string | undefined;
  }
}
