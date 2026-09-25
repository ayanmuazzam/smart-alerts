import type { APIRoute } from 'astro';
import { runCronJobs } from '../../lib/smart-alerts/engine';
import { getSecret } from '../../lib/smart-alerts/secrets';

async function authorized(request: Request): Promise<boolean> {
  const header = request.headers.get('x-cron-secret') || '';
  let expected = process.env.CRON_SECRET || '';
  if (!expected) {
    expected = (await getSecret('CRON_SECRET')) || '';
  }
  if (!expected || !header) return false;
  try {
    const a = Buffer.from(header);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    const { timingSafeEqual } = await import('node:crypto');
    return timingSafeEqual(a, b);
  } catch {
    return header === expected;
  }
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
