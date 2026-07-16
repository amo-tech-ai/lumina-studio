#!/usr/bin/env node
/**
 * IPI-490 · CF-MIG-210 — local/CI gzip size gate for OpenNext Worker dry-run.
 *
 * Prerequisites: `npx opennextjs-cloudflare build` already run in app/.
 *
 * Size (authoritative for this task — wrangler dry-run gzip):
 *   warn  ≥ 8.5 MiB · fail ≥ 9.0 MiB
 *   (Cloudflare Paid Worker compressed limit = 10 MB)
 *
 * Startup: `wrangler check startup` is local diagnostic profiling only.
 * It does NOT produce authoritative remote `startup_time_ms` (IPI-472 · INFRA-001
 * after `wrangler versions upload`). CPU-profile wall-clock is never used as a
 * pass/fail signal. High local readings print WARN; missing parse prints WARN.
 * This script never fails solely because startup was unparsed or slow.
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(__dirname, "..");
const localWrangler = path.join(appDir, "node_modules", ".bin", "wrangler");

const WARN_MIB = 8.5;
const FAIL_MIB = 9.0;
/** Local diagnostic bands only — not hard fails for IPI-490. */
const WARN_STARTUP_MS = 500;
const FAIL_STARTUP_MS = 750;

function parseGzipKiB(text) {
  const m = text.match(/Total Upload:\s*([\d.]+)\s*KiB\s*\/\s*gzip:\s*([\d.]+)\s*KiB/i);
  if (!m) return null;
  return { uploadKiB: Number(m[1]), gzipKiB: Number(m[2]) };
}

function parseStartupMs(text) {
  const m =
    text.match(/startup_time_ms[=:\s]+([\d.]+)/i) ||
    text.match(/Startup time[:\s]+([\d.]+)\s*ms/i);
  return m ? Number(m[1]) : null;
}

function runWrangler(args) {
  // Prefer installed binary — avoid npx network install / version drift.
  const r = spawnSync(localWrangler, args, {
    cwd: appDir,
    encoding: "utf8",
    env: process.env,
    maxBuffer: 64 * 1024 * 1024,
  });
  const out = `${r.stdout ?? ""}\n${r.stderr ?? ""}`;
  return { code: r.status ?? 1, out, error: r.error };
}

function reportLocalStartup(dryOut) {
  const startup = runWrangler(["check", "startup"]);
  const startupMs = parseStartupMs(startup.out) ?? parseStartupMs(dryOut);

  if (startup.error) {
    console.warn(
      `WARN (local profiling only): could not run wrangler check startup: ${startup.error.message}`,
    );
    return;
  }
  if (startup.code !== 0) {
    console.warn(
      `WARN (local profiling only): wrangler check startup exited ${startup.code} — not a size-gate failure; inspect output if investigating cold starts`,
    );
  }

  if (startupMs == null) {
    console.warn(
      "WARN (local profiling only): startup ms not parsed from wrangler text — CPU-profile wall-clock is intentionally unused (not Cloudflare startup_time_ms)",
    );
    return;
  }

  console.log(
    `Startup (local diagnostic text parse): ${startupMs.toFixed(1)} ms — not authoritative remote startup_time_ms (IPI-472)`,
  );
  if (startupMs >= FAIL_STARTUP_MS) {
    console.warn(
      `WARN (local profiling only): ${startupMs.toFixed(1)} ms ≥ ${FAIL_STARTUP_MS} ms band`,
    );
  } else if (startupMs >= WARN_STARTUP_MS) {
    console.warn(
      `WARN (local profiling only): ${startupMs.toFixed(1)} ms ≥ ${WARN_STARTUP_MS} ms band`,
    );
  } else {
    console.log(`OK (local profiling): below ${WARN_STARTUP_MS} ms band`);
  }
}

function main() {
  const dry = runWrangler(["deploy", "--dry-run"]);
  if (dry.error) {
    console.error("check-worker-bundle-size: could not run local wrangler:", dry.error.message);
    console.error(`Expected binary at ${localWrangler}`);
    process.exit(2);
  }

  const sizes = parseGzipKiB(dry.out);
  if (!sizes) {
    console.error("check-worker-bundle-size: could not parse wrangler dry-run Total Upload line");
    console.error(dry.out.slice(-2000));
    process.exit(2);
  }

  const gzipMiB = sizes.gzipKiB / 1024;

  console.log(
    `Worker dry-run: ${sizes.uploadKiB.toFixed(2)} KiB / gzip ${sizes.gzipKiB.toFixed(2)} KiB (${gzipMiB.toFixed(3)} MiB)`,
  );

  let exit = 0;
  if (gzipMiB >= FAIL_MIB) {
    console.error(`FAIL: gzip ${gzipMiB.toFixed(3)} MiB ≥ ${FAIL_MIB} MiB iPix fail gate`);
    exit = 1;
  } else if (gzipMiB >= WARN_MIB) {
    console.warn(`WARN: gzip ${gzipMiB.toFixed(3)} MiB ≥ ${WARN_MIB} MiB iPix warn gate`);
  } else {
    console.log(`OK: gzip below ${WARN_MIB} MiB warn gate`);
  }

  if (dry.code !== 0) {
    console.error("wrangler deploy --dry-run exited non-zero");
    exit = 1;
  }

  // Local startup profiling (diagnostic only; never hard-fails IPI-490).
  reportLocalStartup(dry.out);

  process.exit(exit);
}

main();
