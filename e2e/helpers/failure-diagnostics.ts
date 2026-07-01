import type { ConsoleMessage, Page, Request } from "@playwright/test";

export type BrowserDiagnostics = {
  consoleErrors: string[];
  failedRequests: string[];
  dispose: () => void;
};

export function attachBrowserDiagnostics(page: Page): BrowserDiagnostics {
  const consoleErrors: string[] = [];
  const failedRequests: string[] = [];

  const onConsole = (msg: ConsoleMessage) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
    }
  };

  const onRequestFailed = (req: Request) => {
    failedRequests.push(
      `${req.method()} ${req.url()} :: ${req.failure()?.errorText ?? "failed"}`,
    );
  };

  page.on("console", onConsole);
  page.on("requestfailed", onRequestFailed);

  return {
    consoleErrors,
    failedRequests,
    dispose: () => {
      page.off("console", onConsole);
      page.off("requestfailed", onRequestFailed);
    },
  };
}

export function formatBrowserDiagnostics(
  consoleErrors: string[],
  failedRequests: string[],
): string {
  const lines = ["Browser diagnostics:"];

  lines.push("Console errors:");
  if (consoleErrors.length === 0) {
    lines.push("  (none)");
  } else {
    for (const entry of consoleErrors) {
      lines.push(`  - ${entry}`);
    }
  }

  lines.push("Failed network requests:");
  if (failedRequests.length === 0) {
    lines.push("  (none)");
  } else {
    for (const entry of failedRequests) {
      lines.push(`  - ${entry}`);
    }
  }

  return lines.join("\n");
}
