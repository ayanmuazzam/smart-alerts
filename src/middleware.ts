/**
 * Allow storefront origins (Wix sites / local preview) to call `/api/*`.
 * Without this, browser preflight to localhost during `wix dev` fails CORS.
 */
import { defineMiddleware } from 'astro:middleware';
import { corsHeaders, corsPreflight } from './lib/smart-alerts/cors';

export const onRequest = defineMiddleware(async (context, next) => {
  const { request } = context;
  const path = new URL(request.url).pathname;
  if (!path.startsWith('/api/')) {
    return next();
  }

  if (request.method === 'OPTIONS') {
    return corsPreflight(request);
  }

  const response = await next();
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(corsHeaders(request))) {
    headers.set(key, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
});
