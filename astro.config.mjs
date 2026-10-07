// @ts-check
import { defineConfig } from 'astro/config';
import wix from '@wix/astro';
import react from "@astrojs/react";
import wixHostingAdapter from "@wix/astro-wix-hosting-adapter";

export default defineConfig({
  output: "server",
  adapter: wixHostingAdapter(),
  integrations: [wix(), react()],
  image: { domains: ["static.wixstatic.com"] },
  security: { checkOrigin: false },
  devToolbar: { enabled: false },
  // Vite 6 defaults CORS to localhost-only; storefront preview is on
  // *.wix-development-sites.org and must be allowed during `wix dev`.
  vite: {
    server: {
      cors: {
        origin: true,
        allowedHeaders: ['Authorization', 'Content-Type'],
      },
    },
  },
});
