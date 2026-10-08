## CLI Commands

All CLI instructions can be found at:
node_modules/@wix/cli/agents/instructions.md

## Skills

This project comes with a set of skills that can be used when the user asks for help with specific tasks.
If you're using the instructions provided by a skill and fail, or if you do not find a relevant skill for the task,
you can try updating the skills by running the following command:

`wix skills update`

This will update the skills to the latest version.

## App architecture (Smart Alerts)

This is a **Wix CLI / Astro** app — not classic Velo. There is no `$w` / `.jsw`.

- **Privileged backend:** `src/lib/smart-alerts/*` and `src/pages/api/*` (use `auth.elevate`, not `suppressAuth`).
- **Admin API:** `/api/admin` requires a dashboard session (`requireDashboardAuth` — USER/APP JWT).
- **Storefront:** site plugin + `/api/subscribe`, `/api/public-config`, `/api/product-context`.
- **Secrets:** use `getSecret()` from `src/lib/smart-alerts/secrets.ts` (Wix Secrets Manager; env fallback in DEV only).