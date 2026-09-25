import type { APIRoute } from 'astro';
import { getOrCreateConfig } from '../../lib/smart-alerts/config';
import { canSendAlert } from '../../lib/smart-alerts/email';

export const GET: APIRoute = async () => {
  try {
    const config = await getOrCreateConfig();
    const quota = await canSendAlert(config);
    return Response.json({
      modules: config.modules,
      appearance: config.appearance,
      brand: {
        primaryColor: config.brand.primaryColor,
        logoUrl: config.brand.logoUrl,
      },
      quota,
    });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Public config failed' },
      { status: 500 },
    );
  }
};
