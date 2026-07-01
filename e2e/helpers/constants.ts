export const API_BASE = process.env.E2E_API_URL ?? "http://127.0.0.1:8000";
export const WEB_BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

export const BUYER_EMAIL =
  process.env.E2E_BUYER_EMAIL ?? "buyer@example.com";
export const SELLER_EMAIL =
  process.env.E2E_SELLER_EMAIL ?? "seller@example.com";
export const E2E_PASSWORD = process.env.E2E_PASSWORD ?? "devpassword12";

/** Demo reviewer persona (seed: py -m app.demo seed --size medium). */
export const DANIELA_DEMO_EMAIL =
  process.env.E2E_DANIELA_EMAIL ?? "daniela.review@demo.melomanos.local";
export const DANIELA_DEMO_PASSWORD =
  process.env.E2E_DANIELA_PASSWORD ?? "devpassword12";
