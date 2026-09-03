import fs from "fs";
import path from "path";
import type { Page } from "@playwright/test";

export const DESKTOP_VIEWPORT = { width: 1440, height: 900 } as const;
export const MOBILE_VIEWPORT = { width: 390, height: 844 } as const;

const SCREENSHOTS_ROOT = path.resolve(
  __dirname,
  "../../../workspace/screenshots/demo-acceptance",
);

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

/** New timestamped run directory under workspace/screenshots/demo-acceptance/runs/. */
export function createDemoRunDirectory(): string {
  const now = new Date();
  const timestamp = [
    now.getFullYear(),
    pad2(now.getMonth() + 1),
    pad2(now.getDate()),
    "-",
    pad2(now.getHours()),
    pad2(now.getMinutes()),
    pad2(now.getSeconds()),
  ].join("");

  const runDir = path.join(SCREENSHOTS_ROOT, "runs", timestamp);
  fs.mkdirSync(runDir, { recursive: true });
  return runDir;
}

async function settlePage(page: Page): Promise<void> {
  await page.waitForLoadState("domcontentloaded");
  await page.waitForLoadState("networkidle").catch(() => undefined);
  await page.waitForTimeout(500);
}

/** Deterministically named, full-page checkpoint screenshot. */
export async function captureCheckpoint(
  page: Page,
  runDir: string,
  step: number,
  name: string,
  viewport: "desktop" | "mobile" = "desktop",
): Promise<string> {
  await settlePage(page);
  const filename = `${String(step).padStart(2, "0")}-${name}-${viewport}.png`;
  const absolutePath = path.join(runDir, filename);
  await page.screenshot({ path: absolutePath, fullPage: true });
  return filename;
}

export interface DemoRunManifest {
  timestamp: string;
  baseURL: string;
  apiBase: string;
  captures: { step: number; name: string; viewport: string; file: string }[];
}

export function writeManifest(runDir: string, manifest: DemoRunManifest): void {
  fs.writeFileSync(
    path.join(runDir, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8",
  );
}

/** Points workspace/screenshots/demo-acceptance/latest at this run (best-effort). */
export function pointLatestAtRun(runDir: string): void {
  const latestPath = path.join(SCREENSHOTS_ROOT, "latest");
  try {
    fs.rmSync(latestPath, { recursive: true, force: true });
  } catch {
    // ignore
  }
  try {
    fs.symlinkSync(runDir, latestPath, "junction");
  } catch {
    // symlink privileges may be unavailable (e.g. restricted CI) — non-fatal
  }
}
