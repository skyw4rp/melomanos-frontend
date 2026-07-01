This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment variables

Copy [`frontend/.env.example`](.env.example) to `.env.local` for local overrides (recommended):

```powershell
cd frontend
Copy-Item .env.example .env.local
# or let workspace/run_melomanos.py create .env.local on first start
```

| Variable | Local default | Production (Vercel) |
|----------|---------------|---------------------|
| `NEXT_PUBLIC_API_URL` | `http://127.0.0.1:8000` when unset/blank | `https://api.melomanos.cl` |
| `NEXT_PUBLIC_PAYMENT_PROVIDER_MODE` | unset | Match backend (`simulate` or `webpay_placeholder`) |

**Important:** A blank `NEXT_PUBLIC_API_URL` in your shell breaks login (`Failed to fetch`). Use `.env.local` or start via `py run_melomanos.py` which injects the correct value.

**Vercel setup:** Project → Settings → Environment Variables → add `NEXT_PUBLIC_API_URL` for the **Production** environment. Redeploy after changing `NEXT_PUBLIC_*` vars.

Backend CORS must allow the frontend origin — default includes `http://localhost:3000`, `http://127.0.0.1:3000`, and fallback port **3001**. See [`workspace/PRODUCTION_ENV_MATRIX.md`](../workspace/PRODUCTION_ENV_MATRIX.md).

## Local demo stack (Daniela UX review)

```powershell
cd C:\melomanos\backend
$env:MELOMANOS_DEMO_MODE="1"
py -m app.demo reset --factory --force
py -m app.demo seed --size medium

cd C:\melomanos\workspace
py run_melomanos.py --auto-migrate --kill-stale --no-wait
```

Open http://localhost:3000/login — credentials: `daniela.review@demo.melomanos.local` / `devpassword12`

Readiness check (health + listings + demo login smoke):

```powershell
py run_melomanos.py --check
```

## Continuous integration

GitHub Actions runs on push/PR to `main` or `master` (see [`.github/workflows/ci.yml`](.github/workflows/ci.yml)):

| Step | Command |
|------|---------|
| Install | `npm ci` |
| Lint | `npm run lint` |
| Build | `npm run build` |

Local check (same as CI, without E2E):

```bash
npm run lint
npm run build
```

Lint uses ESLint + `eslint-config-next` on `src/` (Playwright `e2e/` is excluded). Some React hook rules report **warnings** on legacy fetch-on-mount patterns; CI fails only on errors.

E2E tests are **not** in CI — run locally with `npm run test:e2e` when changing user flows.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## E2E tests (Playwright)

Automated browser tests against the local stack.

### Prerequisites

1. **Backend** at [http://127.0.0.1:8000](http://127.0.0.1:8000) (e.g. `cd C:\melomanos_market` → `py run.py`).
2. **Test users** — E2E setup auto-registers `buyer@example.com` and `seller@example.com` (password `devpassword12`) if missing.
3. **Frontend** at [http://localhost:3000](http://localhost:3000) (`npm run dev`).

Optional env overrides:

| Variable | Default |
|----------|---------|
| `E2E_BASE_URL` | `http://localhost:3000` |
| `E2E_API_URL` | `http://127.0.0.1:8000` |
| `E2E_BUYER_EMAIL` | `buyer@example.com` |
| `E2E_SELLER_EMAIL` | `seller@example.com` |
| `E2E_PASSWORD` | `devpassword12` |

### WebPay placeholder E2E

Full placeholder lifecycle tests require the backend in `webpay_placeholder` mode:

```powershell
cd C:\melomanos\workspace
py run_melomanos.py --kill-stale --e2e-webpay --no-wait
```

Or set `PAYMENT_PROVIDER_MODE=webpay_placeholder` and `WEBPAY_CALLBACK_SECRET` per `workspace/e2e-webpay.env`.

Frontend WebPay UI uses `NEXT_PUBLIC_PAYMENT_PROVIDER_MODE=webpay_placeholder` or `localStorage.melomanos_payment_mode` (E2E helper).

### Run

```bash
# Install browsers (first time only)
npx playwright install chromium

# Headless
npm run test:e2e

# Interactive UI mode
npm run test:e2e:ui
```

Reports: `playwright-report/` after a run (`npx playwright show-report`).

### Notifications UI

- Navbar **Alertas** bell (`data-testid="notifications-bell"`) polls `GET /users/me/notifications/unread-count`.
- Dropdown shows recent items; full list at `/notifications`.
- Deep links: messages → `/messages`, orders → `/orders/{id}`; disputes are text-only (no order id on entity).

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
