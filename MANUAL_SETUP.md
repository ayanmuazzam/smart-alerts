# Smart Alerts — Manual Setup

App ID: `8a35a26c-308b-4874-9748-db811867b828`  
Namespace: `@ayanmuazzam/us-smart-alerts`  
Released: **2.3.0** (storefront subscribe CORS: Authorization-only fetch, no `x-wix-linguist`)

To load this version on a site that still shows 1.x / 2.0.x UI, open the release **Site** installer link (or reinstall from App Market) so the site picks up **2.2.0**. After that, a hard refresh on a product page should show the notify form (not “Alerts temporarily unavailable”).

**Important:** `wix release` uploads whatever is in `dist/`. Always run `npm run build` before releasing site-plugin changes, or an old `smart-alerts-pdp-*.js` ships.

## 1. Dev Center permissions

Enable in [Permissions](https://manage.wix.com/apps/8a35a26c-308b-4874-9748-db811867b828/dev-center-permissions):

- `SCOPE.STORES.CATALOG_READ_LIMITED`
- `SCOPE.DC-STORES.READ-PRODUCTS` (V1)
- `SCOPE.STORES.PRODUCT_READ` / `SCOPE.STORES.PRODUCT_READ_ADMIN` (V3)
- `SCOPE.STORES.INVENTORY_ITEM_READ`
- `SCOPE.DC-STORES.READ-ORDERS`
- Site properties / business info read (store name & contact email)
- Wix Data (collections created by this app)
- Secrets read (if using Wix Secrets for Resend / cron)

## 2. Data collections

On install / release, the Data Collections extension provisions:

`config`, `subscriptions`, `productOverrides`, `templates`, `alerts`, `whatsappQueue`, `processedEvents`

All under `@ayanmuazzam/us-smart-alerts/*`. Writes stay `PRIVILEGED` (backend elevates). **`config` and `productOverrides` allow `itemRead: ANYONE`** so the product-page plugin can read modules/appearance without calling elevated `/api/*` routes (anonymous OAuth visitor tokens currently 500 in local `wix dev`).

## 3. Secrets / environment

Set either via Wix Secrets or local `.env`:

| Key | Purpose |
|---|---|
| `RESEND_API_KEY` | Transactional email via Resend |
| `CRON_SECRET` | Shared secret for `POST /api/cron` (`x-cron-secret` header) |

Resend from-address defaults to `onboarding@resend.dev` until you verify a domain in Resend.

### Storefront → `/api/*` CORS

Site plugins must **not** call `httpClient.fetchWithAuth` against the app host from the storefront. That client adds `x-wix-linguist`, which is missing from app-host `Access-Control-Allow-Headers`, so preflight fails (`Failed to fetch`). Use `fetch` with **Authorization only** (see `src/extensions/site/lib/fetch-app-api.ts`). Dashboard `fetchWithAuth` is fine.

## 4. External cron

Schedule a job (e.g. hourly) to:

```http
POST https://<your-app-backend>/api/cron
Header: x-cron-secret: <CRON_SECRET>
```

This re-arms price-drop watches after cooldown and sends the seller digest when due (`daily` / `weekly`).

## 5. Local / preview

```bash
npm install
wix dev-site select <site-id>   # must match the site you open in the browser
wix / npm run dev
```

**Critical:** opening the bare storefront URL (`https://dev-sitex-….wix-development-sites.org/…`) serves the **last released** app bundle — not your local HMR. To test local PDP changes:

1. Keep `npm run dev` running
2. Open the **Site** preview link from the CLI (or `.wix/topology.json` → `development.site.main`)
3. Confirm the URL has `?apps-override=<versionOverrideId>`
4. Then go to a product page

Without `apps-override`, you will still see “Alerts temporarily unavailable” if the released widget calls `/api/product-context` (anonymous OAuth 500 under local/dev). The current PDP loads product/config via the visitor Stores/Data SDK and only uses `/api/subscribe` on submit.

Install Wix Stores on the dev site. Place the Smart Alerts PDP plugin on a product page if auto-add does not apply.

## 6. E2E checklist (smoke)

- [ ] Start tab shows KPIs (zeros OK)
- [ ] Modules toggle persists; PDP hides forms when off
- [ ] Account: seller email, digest frequency, low-stock threshold
- [ ] Subscribe on OOS PDP → Lists row; simple confirmation (no manage code)
- [ ] WhatsApp phone (module on) → WhatsApp queue
- [ ] Appearance save updates PDP theme (no corner widget)
- [ ] Cron with secret → 200; without → 401

## 7. App Market readiness checklist

- [ ] Dual catalog event handlers (V1 + V3) present
- [ ] Dual PDP placements (old + new product page widgets)
- [ ] Permissions declared
- [ ] E2E: OOS → restock email; price drop; quota block; module toggles
