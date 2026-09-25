import type { APIRoute } from 'astro';
import { getOrCreateConfig } from '../../lib/smart-alerts/config';

export const GET: APIRoute = async () => {
  try {
    const config = await getOrCreateConfig();
    return Response.json({
      modules: config.modules,
      appearance: config.appearance,
      brand: {
        primaryColor: config.brand.primaryColor,
        logoUrl: config.brand.logoUrl,
      },
    });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Public config failed' },
      { status: 500 },
    );
  }
};
