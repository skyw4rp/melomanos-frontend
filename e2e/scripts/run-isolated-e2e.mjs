#!/usr/bin/env node
/**
 * Reproducible isolated E2E launcher.
 *
 * One command: `npm run test:e2e:isolated`.
 *
 * Never touches the real dev database. The isolated DATABASE_URL is always
 * rebuilt with a hardcoded database name (E2E_DB_NAME below) — the real
 * DATABASE_URL from backend/.env.local is read only to recover the
 * host/user/password, its own database name is discarded and never used.
 * Every mutating step (schema reset, seed, backend/test DB target) runs
 * against that rebuilt URL only, and its identity is proven with a live
 * `SELECT current_database()` query before anything mutates.
 */
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const FRONTEND_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const BACKEND_ROOT =
  process.env.MELOMANOS_BACKEND_ROOT ?? path.resolve(FRONTEND_ROOT, "..", "backend");
const PYTHON_BIN =
  process.platform === "win32"
    ? path.join(BACKEND_ROOT, "venv", "Scripts", "python.exe")
    : path.join(BACKEND_ROOT, "venv", "bin", "python");

const E2E_DB_NAME = "melomanos_e2e_disposable";
const API_PORT = process.env.E2E_API_PORT ?? "8010";
const WEB_PORT = process.env.E2E_WEB_PORT ?? "3010";
const API_URL = `http://127.0.0.1:${API_PORT}`;
const WEB_URL = `http://localhost:${WEB_PORT}`;
const ADMIN_KEY = "test-admin-key";
// Local-only placeholder, never a real credential — WebPay placeholder mode
// never calls the real Transbank API.
const WEBPAY_CALLBACK_SECRET = "e2e-local-placeholder-secret";

function fail(message) {
  console.error(`\n[run-isolated-e2e] REFUSING TO PROCEED: ${message}\n`);
  process.exit(1);
}

function run(cmd, args, opts = {}) {
  const result = spawnSync(cmd, args, { stdio: "inherit", ...opts });
  if (result.status !== 0) {
    fail(`command failed (${result.status}): ${cmd} ${args.join(" ")}`);
  }
}

function runCapture(cmd, args, opts = {}) {
  return spawnSync(cmd, args, { encoding: "utf8", ...opts });
}

/** Read DATABASE_URL from backend/.env.local for connection metadata only. */
function readDevDatabaseUrl() {
  const envPath = path.join(BACKEND_ROOT, ".env.local");
  if (!fs.existsSync(envPath)) {
    fail(`${envPath} not found — cannot derive local Postgres connection info.`);
  }
  const content = fs.readFileSync(envPath, "utf8");
  const match = content.match(/^DATABASE_URL=(.+)$/m);
  if (!match) fail(`DATABASE_URL not set in ${envPath}`);
  return match[1].trim();
}

/**
 * Always returns a URL whose database name is exactly E2E_DB_NAME, on
 * localhost/127.0.0.1. The source database name is discarded, never reused.
 */
function buildIsolatedDatabaseUrl() {
  const source = readDevDatabaseUrl();
  const hostMatch = source.match(/@([^:/]+)/);
  const host = hostMatch ? hostMatch[1] : null;
  if (!host || !["localhost", "127.0.0.1"].includes(host)) {
    fail(
      `backend/.env.local DATABASE_URL host is "${host}", not localhost/127.0.0.1. ` +
        `Isolated E2E only runs against a local Postgres instance.`,
    );
  }
  const isolated = source.replace(/\/[^/?]+(\?.*)?$/, (_m, query) => `/${E2E_DB_NAME}${query ?? ""}`);
  const pathname = isolated.split("?")[0].split("/").pop();
  if (pathname !== E2E_DB_NAME) {
    fail(`Failed to construct isolated DATABASE_URL (got database name "${pathname}").`);
  }
  return isolated;
}

/** Live proof, not just string-matching: actually query current_database(). */
function assertLiveDatabaseIdentity(databaseUrl, expectedName) {
  const code =
    "import os,sys\n" +
    "from sqlalchemy import create_engine, text\n" +
    "engine = create_engine(os.environ['E2E_PROBE_DB_URL'])\n" +
    "with engine.connect() as conn:\n" +
    "    name = conn.execute(text('SELECT current_database()')).scalar()\n" +
    "print(name)\n";
  const result = runCapture(PYTHON_BIN, ["-c", code], {
    cwd: BACKEND_ROOT,
    env: { ...process.env, E2E_PROBE_DB_URL: databaseUrl },
  });
  const observed = (result.stdout || "").trim();
  if (result.status !== 0 || observed !== expectedName) {
    fail(
      `Live current_database() check failed. Expected "${expectedName}", got ` +
        `"${observed || "(no output)"}" (stderr: ${(result.stderr || "").trim() || "none"}). ` +
        `Does the "${expectedName}" database exist? It is not created automatically by this script.`,
    );
  }
  console.log(`[run-isolated-e2e] Live DB identity confirmed: current_database() = ${observed}`);
}

function countRealDevE2eRows(realDatabaseUrl) {
  const code =
    "import os\n" +
    "from sqlalchemy import create_engine, text\n" +
    "engine = create_engine(os.environ['E2E_PROBE_DB_URL'])\n" +
    "with engine.connect() as conn:\n" +
    "    n = conn.execute(text(\"SELECT count(*) FROM vinyl_listings WHERE title LIKE 'E2E %'\")).scalar()\n" +
    "print(n)\n";
  const result = runCapture(PYTHON_BIN, ["-c", code], {
    cwd: BACKEND_ROOT,
    env: { ...process.env, E2E_PROBE_DB_URL: realDatabaseUrl },
  });
  if (result.status !== 0) {
    fail(`Could not verify real dev database was untouched: ${(result.stderr || "").trim()}`);
  }
  return Number((result.stdout || "").trim());
}

function waitForHttp(url, label, timeoutMs = 45_000) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const attempt = async () => {
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(3_000) });
        if (res.ok || res.status < 500) return resolve();
      } catch {
        /* retry */
      }
      if (Date.now() > deadline) return reject(new Error(`${label} did not become ready at ${url}`));
      setTimeout(attempt, 1_000);
    };
    attempt();
  });
}

function killTree(child) {
  if (!child || child.killed || child.exitCode !== null) return;
  if (process.platform === "win32") {
    spawnSync("taskkill", ["/pid", String(child.pid), "/T", "/F"]);
  } else {
    child.kill("SIGTERM");
  }
}

async function main() {
  console.log("[run-isolated-e2e] Deriving isolated DATABASE_URL (real dev DB name discarded)...");
  const isolatedDbUrl = buildIsolatedDatabaseUrl();
  const realDbUrl = readDevDatabaseUrl();

  assertLiveDatabaseIdentity(isolatedDbUrl, E2E_DB_NAME);

  const realE2eRowsBefore = countRealDevE2eRows(realDbUrl);
  console.log(`[run-isolated-e2e] Real dev DB baseline: ${realE2eRowsBefore} pre-existing E2E-titled rows (untouched by this script).`);

  const commonPyEnv = {
    ...process.env,
    DATABASE_URL: isolatedDbUrl,
    MELOMANOS_DEMO_MODE: "1",
    // Demo seeding bakes this into cover_image_url as an absolute URL. Left
    // at its http://127.0.0.1:8000 default, seeded listings point at a port
    // nothing is listening on in this isolated run, and the browser's image
    // requests hang (TCP SYN never answered) instead of failing fast — which
    // stalls whichever page happens to render them next. Must match API_URL.
    DEMO_API_BASE_URL: API_URL,
  };

  console.log("[run-isolated-e2e] Resetting isolated schema (drop+recreate public schema, then alembic upgrade head)...");
  // Reset by dropping the schema rather than `alembic downgrade base`: seed
  // data can contain values (e.g. order statuses added by later migrations)
  // that violate constraints from earlier migrations, making downgrade
  // chains unreliable on a seeded disposable DB. A throwaway database is
  // safe to reset this way; this only ever runs against isolatedDbUrl,
  // whose identity was just proven live above.
  const dropSchemaCode =
    "import os\n" +
    "from sqlalchemy import create_engine, text\n" +
    "engine = create_engine(os.environ['DATABASE_URL'])\n" +
    "with engine.connect() as conn:\n" +
    "    conn.execute(text('DROP SCHEMA public CASCADE'))\n" +
    "    conn.execute(text('CREATE SCHEMA public'))\n" +
    "    conn.commit()\n";
  run(PYTHON_BIN, ["-c", dropSchemaCode], { cwd: BACKEND_ROOT, env: commonPyEnv });
  run(PYTHON_BIN, ["-m", "alembic", "upgrade", "head"], { cwd: BACKEND_ROOT, env: commonPyEnv });

  console.log("[run-isolated-e2e] Seeding isolated dataset (--size medium; includes Daniela persona)...");
  run(PYTHON_BIN, ["scripts/demo_data.py", "seed", "--size", "medium"], {
    cwd: BACKEND_ROOT,
    env: commonPyEnv,
  });

  assertLiveDatabaseIdentity(isolatedDbUrl, E2E_DB_NAME);

  console.log(`[run-isolated-e2e] Starting isolated backend on ${API_URL}...`);
  const backendEnv = {
    ...process.env,
    PYTHONUNBUFFERED: "1",
    APP_HOST: "127.0.0.1",
    APP_PORT: API_PORT,
    APP_RELOAD: "false",
    DATABASE_URL: isolatedDbUrl,
    ADMIN_KEY,
    PAYMENT_PROVIDER_MODE: process.env.E2E_PAYMENT_MODE ?? "webpay_placeholder",
    WEBPAY_CALLBACK_SECRET,
    WEBPAY_RETURN_URL_BASE: `${WEB_URL}/orders`,
    MELOMANOS_DEMO_MODE: "1",
    CORS_ORIGINS: `${WEB_URL},http://127.0.0.1:${WEB_PORT}`,
  };
  const backend = spawn(PYTHON_BIN, ["run.py"], { cwd: BACKEND_ROOT, env: backendEnv, stdio: ["ignore", "pipe", "pipe"] });
  let sawIsolatedDbInLog = false;
  let launcherInitiatedBackendKill = false;
  let backendExitInfo = null;
  const BACKEND_LOG_TAIL_SIZE = 40;
  const backendLogTail = [];
  function recordBackendLogLine(stream, text) {
    for (const line of text.split(/\r?\n/)) {
      if (!line) continue;
      backendLogTail.push(`[${stream}] ${line}`);
      if (backendLogTail.length > BACKEND_LOG_TAIL_SIZE) backendLogTail.shift();
    }
  }
  backend.stdout.on("data", (buf) => {
    const text = buf.toString();
    if (text.includes(`database=${E2E_DB_NAME}`)) sawIsolatedDbInLog = true;
    recordBackendLogLine("stdout", text);
    process.stdout.write(`[backend] ${text}`);
  });
  backend.stderr.on("data", (buf) => {
    const text = buf.toString();
    recordBackendLogLine("stderr", text);
    process.stderr.write(`[backend] ${text}`);
  });
  backend.on("exit", (code, signal) => {
    backendExitInfo = { code, signal, launcherInitiated: launcherInitiatedBackendKill };
    console.log(
      `[run-isolated-e2e] Backend process exited: code=${code} signal=${signal} launcherInitiated=${launcherInitiatedBackendKill}`,
    );
  });

  console.log(`[run-isolated-e2e] Starting isolated frontend on ${WEB_URL}...`);
  const frontendEnv = {
    ...process.env,
    NEXT_PUBLIC_API_URL: API_URL,
    PORT: WEB_PORT,
  };
  const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
  const frontend = spawn(npmCmd, ["run", "dev", "--", "-p", WEB_PORT], {
    cwd: FRONTEND_ROOT,
    env: frontendEnv,
    stdio: ["ignore", "pipe", "pipe"],
    shell: process.platform === "win32",
  });
  frontend.stdout.on("data", (buf) => process.stdout.write(`[frontend] ${buf}`));
  frontend.stderr.on("data", (buf) => process.stderr.write(`[frontend] ${buf}`));

  let playwrightExitCode = 1;
  try {
    await waitForHttp(`${API_URL}/health`, "Isolated backend");
    await waitForHttp(WEB_URL, "Isolated frontend");
    if (!sawIsolatedDbInLog) {
      console.warn(
        "[run-isolated-e2e] WARNING: backend startup log did not confirm database=" +
          E2E_DB_NAME +
          " (continuing — the live current_database() check already proved this; log line is a secondary signal).",
      );
    }

    console.log("[run-isolated-e2e] Running full Playwright suite against isolated environment...");
    const npxCmd = process.platform === "win32" ? "npx.cmd" : "npx";
    const playwrightEnv = {
      ...process.env,
      E2E_API_URL: API_URL,
      E2E_BASE_URL: WEB_URL,
      DATABASE_URL: isolatedDbUrl,
      MELOMANOS_BACKEND_ROOT: BACKEND_ROOT,
      MELOMANOS_DEMO_MODE: "1",
    };
    const extraArgs = process.argv.slice(2);
    const result = spawnSync(npxCmd, ["playwright", "test", ...extraArgs], {
      cwd: FRONTEND_ROOT,
      env: playwrightEnv,
      stdio: "inherit",
      shell: process.platform === "win32",
    });
    playwrightExitCode = result.status ?? 1;
  } finally {
    console.log("[run-isolated-e2e] Stopping isolated backend/frontend...");
    if (!backendExitInfo) launcherInitiatedBackendKill = true;
    killTree(backend);
    killTree(frontend);
    if (backendExitInfo && !backendExitInfo.launcherInitiated) {
      console.error(
        `\n[run-isolated-e2e] BACKEND EXITED UNEXPECTEDLY before shutdown: ` +
          `code=${backendExitInfo.code} signal=${backendExitInfo.signal}\n` +
          `[run-isolated-e2e] Last ${backendLogTail.length} backend log lines:\n` +
          backendLogTail.map((l) => `  ${l}`).join("\n") +
          "\n",
      );
    }
  }

  const realE2eRowsAfter = countRealDevE2eRows(realDbUrl);
  if (realE2eRowsAfter !== realE2eRowsBefore) {
    fail(
      `Real dev database row count changed (${realE2eRowsBefore} -> ${realE2eRowsAfter})! ` +
        `This must never happen — investigate before running again.`,
    );
  }
  console.log(
    `[run-isolated-e2e] Confirmed real dev DB unchanged: ${realE2eRowsAfter} E2E-titled rows (same as baseline).`,
  );

  process.exit(playwrightExitCode);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
