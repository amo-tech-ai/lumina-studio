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
 * Startup: `wrangler check startup` is local profiling only. It does NOT
 * produce authoritative remote `startup_time_ms` (that is IPI-472 · INFRA-001
 * after `wrangler versions upload`). High local readings print WARN but do
 * not fail this script — remote 500/750 ms gates belong to IPI-472.
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(__dirname, "..");

const WARN_MIB = 8.5;
const FAIL_MIB = 9.0;
/** Local profiling only — not a hard fail for IPI-490. */
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

function run(cmd, args) {
  const r = spawnSync(cmd, args, {
    cwd: appDir,
    encoding: "utf8",
    env: process.env,
    maxBuffer: 64 * 1024 * 1024,
  });
  const out = `${r.stdout ?? ""}\n${r.stderr ?? ""}`;
  return { code: r.status ?? 1, out };
}

const dry = run("npx", ["wrangler", "deploy", "--dry-run"]);
const sizes = parseGzipKiB(dry.out);
if (!sizes) {
  console.error("check-worker-bundle-size: could not parse wrangler dry-run Total Upload line");
  console.error(dry.out.slice(-2000));
  process.exit(2);
}

const gzipMiB = sizes.gzipKiB / 1024;
const uploadMiB = sizes.uploadKiB / 1024;

let startupMs = parseStartupMs(dry.out);
const startup = run("npx", ["wrangler", "check", "startup"]);
if (startupMs == null) {
  startupMs = parseStartupMs(startup.out);
}
// Local cpuprofile wall-clock fallback (alpha command may omit ms in text)
if (startupMs == null) {
  try {
    const profilePath = path.join(appDir, "worker-startup.cpuprofile");
    const { readFileSync } = await import("node:fs");
    const profile = JSON.parse(readFileSync(profilePath, "utf8"));
    if (profile.startTime != null && profile.endTime != null) {
      startupMs = (profile.endTime - profile.startTime) / 1000;
    }
  } catch {
    /* optional */
  }
}

console.log(`Worker dry-run: ${sizes.uploadKiB.toFixed(2)} KiB / gzip ${sizes.gzipKiB.toFixed(2)} KiB (${gzipMiB.toFixed(3)} MiB)`);
if (startupMs != null) {
  console.log(`Startup (local check): ${startupMs.toFixed(1)} ms`);
} else {
  console.log("Startup (local check): NOT PARSED — inspect wrangler check startup output");
}

let exit = 0;
if (gzipMiB >= FAIL_MIB) {
  console.error(`FAIL: gzip ${gzipMiB.toFixed(3)} MiB ≥ ${FAIL_MIB} MiB iPix fail gate`);
  exit = 1;
} else if (gzipMiB >= WARN_MIB) {
  console.warn(`WARN: gzip ${gzipMiB.toFixed(3)} MiB ≥ ${WARN_MIB} MiB iPix warn gate`);
} else {
  console.log(`OK: gzip below ${WARN_MIB} MiB warn gate`);
}

if (startupMs != null) {
  if (startupMs >= FAIL_STARTUP_MS) {
    console.warn(
      `WARN (local profiling only): startup ${startupMs.toFixed(1)} ms ≥ ${FAIL_STARTUP_MS} ms — not a dry-run fail; authoritative remote timing is IPI-472`,
    );
  } else if (startupMs >= WARN_STARTUP_MS) {
    console.warn(
      `WARN (local profiling only): startup ${startupMs.toFixed(1)} ms ≥ ${WARN_STARTUP_MS} ms`,
    );
  } else {
    console.log(`OK (local profiling): startup below ${WARN_STARTUP_MS} ms`);
  }
} else {
  console.warn("WARN: local startup profiling not parsed — run `npx wrangler check startup` manually");
}

if (dry.code !== 0) {
  console.error("wrangler deploy --dry-run exited non-zero");
  exit = 1;
}

process.exit(exit);
