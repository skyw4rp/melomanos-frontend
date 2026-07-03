import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import type { Page } from "@playwright/test";
import { API_BASE } from "./constants";
import { authHeaders, loginForApi } from "./auth-api";

export const DESKTOP_VIEWPORT = { width: 1440, height: 900 } as const;
export const MOBILE_VIEWPORT = { width: 390, height: 844 } as const;

export type ViewportName = "desktop" | "mobile";
export type AuthState = "logged-out" | "logged-in";

export interface ManifestCapture {
  route: string;
  surface: string;
  auth: AuthState;
  viewport: ViewportName;
  file: string;
  status: "captured";
}

export interface ManifestSkip {
  route: string;
  surface: string;
  reason: string;
}

export interface ManifestError {
  route: string;
  surface: string;
  message: string;
}

export interface VisualPolishManifest {
  timestamp: string;
  baseURL: string;
  apiBase: string;
  gitBranch?: string;
  gitSha?: string;
  viewports: {
    desktop: typeof DESKTOP_VIEWPORT;
    mobile: typeof MOBILE_VIEWPORT;
  };
  dynamicIds: {
    listingId?: number;
    orderId?: number;
  };
  captures: ManifestCapture[];
  skipped: ManifestSkip[];
  errors: ManifestError[];
}

const WORKSPACE_SCREENSHOTS_ROOT = path.resolve(
  __dirname,
  "../../../workspace/screenshots/visual-polish",
);

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

export function createRunDirectory(): string {
  const now = new Date();
  const timestamp = [
    now.getFullYear(),
    pad2(now.getMonth() + 1),
    pad2(now.getDate()),
    "-",
    pad2(now.getHours()),
    pad2(now.getMinutes()),
  ].join("");

  const runDir = path.join(WORKSPACE_SCREENSHOTS_ROOT, "runs", timestamp);
  fs.mkdirSync(runDir, { recursive: true });
  return runDir;
}

export function gitInfo(): { gitBranch?: string; gitSha?: string } {
  const frontendRoot = path.resolve(__dirname, "../..");
  try {
    const gitBranch = execSync("git rev-parse --abbrev-ref HEAD", {
      cwd: frontendRoot,
      encoding: "utf8",
    }).trim();
    const gitSha = execSync("git rev-parse --short HEAD", {
      cwd: frontendRoot,
      encoding: "utf8",
    }).trim();
    return { gitBranch, gitSha };
  } catch {
    return {};
  }
}

export function relativeScreenshotPath(runDir: string, absolutePath: string): string {
  return path
    .relative(WORKSPACE_SCREENSHOTS_ROOT, absolutePath)
    .replace(/\\/g, "/");
}

export async function settlePage(page: Page): Promise<void> {
  await page.waitForLoadState("domcontentloaded");
  await page.waitForLoadState("networkidle").catch(() => undefined);
  await page.waitForTimeout(600);
}

export async function captureFullPage(
  page: Page,
  runDir: string,
  subfolder: string,
  filename: string,
): Promise<string> {
  const dir = path.join(runDir, subfolder);
  fs.mkdirSync(dir, { recursive: true });
  const absolutePath = path.join(dir, filename);
  await settlePage(page);
  await page.screenshot({ path: absolutePath, fullPage: true });
  return relativeScreenshotPath(runDir, absolutePath);
}

export async function captureSurfaceBothViewports(options: {
  page: Page;
  runDir: string;
  manifest: VisualPolishManifest;
  subfolder: string;
  surface: string;
  route: string;
  auth: AuthState;
  filenameStem: string;
  prepare?: () => Promise<void>;
}): Promise<void> {
  const {
    page,
    runDir,
    manifest,
    subfolder,
    surface,
    route,
    auth,
    filenameStem,
    prepare,
  } = options;

  for (const [viewportName, viewport] of [
    ["desktop", DESKTOP_VIEWPORT],
    ["mobile", MOBILE_VIEWPORT],
  ] as const) {
    await page.setViewportSize(viewport);
    if (prepare) {
      await prepare();
    } else {
      await page.goto(route);
    }
    const file = await captureFullPage(
      page,
      runDir,
      subfolder,
      `${filenameStem}-${viewportName}-${viewport.width}.png`,
    );
    manifest.captures.push({
      route,
      surface,
      auth,
      viewport: viewportName,
      file,
      status: "captured",
    });
  }
}

export function writeManifest(runDir: string, manifest: VisualPolishManifest): void {
  const manifestPath = path.join(runDir, "manifest.json");
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}

interface ListingRow {
  id: number;
  cover_image_url?: string | null;
  video_url?: string | null;
  status?: string;
}

export async function discoverListingId(): Promise<number | null> {
  const res = await fetch(`${API_BASE}/listings?limit=40`, {
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) return null;

  const data = (await res.json()) as { items?: ListingRow[] };
  const items = data.items ?? [];
  if (items.length === 0) return null;

  const withCover = items.find((item) => item.cover_image_url);
  const withVideo = items.find((item) => item.video_url);
  return withCover?.id ?? withVideo?.id ?? items[0]?.id ?? null;
}

export async function discoverOrderIdForEmail(email: string): Promise<number | null> {
  try {
    const token = await loginForApi(email);
    for (const endpoint of ["/orders/me/buying", "/orders/me/selling"]) {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        headers: authHeaders(token),
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) continue;

      const data = (await res.json()) as { items?: { id: number }[] };
      const orderId = data.items?.[0]?.id;
      if (orderId != null) return orderId;
    }
  } catch {
    return null;
  }
  return null;
}
