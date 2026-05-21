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

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
