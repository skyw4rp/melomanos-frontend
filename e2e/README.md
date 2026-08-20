# E2E tests

## Running against your own dev servers

`npm run test:e2e` runs the suite against whatever is already listening on
`http://localhost:3000` / `http://127.0.0.1:8000` (override with `E2E_BASE_URL`
/ `E2E_API_URL`). This is the fast loop for iterating on a single spec, but it
reuses your normal dev database — do not run destructive specs this way
against data you care about.

## Running fully isolated (recommended for the full suite)

```
npm run test:e2e:isolated
```

One command, no manual env vars. It:

1. derives an isolated `DATABASE_URL` pointed at a fixed local database named
   `melomanos_e2e_disposable` (the real dev database name from
   `backend/.env.local` is never reused — only host/user/password are
   borrowed from it);
2. proves that database identity live with `SELECT current_database()`
   before touching anything, and refuses to proceed if the host isn't
   `localhost`/`127.0.0.1` or the identity check fails;
3. resets the isolated schema (`alembic downgrade base` + `upgrade head`)
   and reseeds it (`--size medium`, includes the Daniela demo persona);
4. starts an isolated backend on `:8010` (`ADMIN_KEY=test-admin-key`,
   `PAYMENT_PROVIDER_MODE=webpay_placeholder`, a local-only placeholder
   `WEBPAY_CALLBACK_SECRET`, `WEBPAY_RETURN_URL_BASE` pointed at its own
   frontend) and an isolated frontend on `:3010`
   (`NEXT_PUBLIC_API_URL` pointed at the isolated backend);
5. runs the full Playwright suite against that pair — `e2e/global-setup.ts`'s
   `assertBrowserTargetsE2eBackend()` independently proves, via a real
   browser request, that the frontend is actually talking to the isolated
   backend (not just that the env var was set) before any test data is
   created;
6. stops both isolated processes and re-verifies the real dev database's
   row count is unchanged before exiting.

The isolated database (`melomanos_e2e_disposable`) must already exist — this
script resets/reseeds it but does not create it. Ports are overridable via
`E2E_API_PORT` / `E2E_WEB_PORT` if `8010`/`3010` are in use.
