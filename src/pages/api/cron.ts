import type { APIRoute } from 'astro';
import { runCronJobs } from '../../lib/smart-alerts/engine';

async function authorized(request: Request): Promise<boolean> {
  const header = request.headers.get('x-cron-secret') || '';
  let expected = process.env.CRON_SECRET || '';
  if (!expected) {
    try {
      const { secrets } = await import('@wix/secrets');
      const { auth } = await import('@wix/essentials');
      const elevated = auth.elevate(secrets.getSecretValue);
      const result = await elevated('CRON_SECRET');
      expected = (result as { value?: string })?.value || String(result || '');
    } catch {
      expected = '';
    }
  }
  if (!expected) return false;
  return header === expected;
}

export const POST: APIRoute = async ({ request }) => {
  if (!(await authorized(request))) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const result = await runCronJobs();
    return Response.json({ ok: true, ...result });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Cron failed' },
      { status: 500 },
    );
  }
};
