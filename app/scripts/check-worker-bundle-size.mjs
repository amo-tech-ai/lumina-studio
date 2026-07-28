#!/usr/bin/env node
/**
 * IPI-490 · CF-MIG-210 / IPI-706 · CF-BUNDLE-220 — OpenNext Worker gzip gate.
 *
 * Prerequisites: `opennextjs-cloudflare build` already run in app/.
 *
 * Absolute size (authoritative — wrangler dry-run gzip):
 *   warn  ≥ 8.5 MiB · fail ≥ 9.0 MiB
 *   (Cloudflare Paid Worker compressed limit = 10 MB)
 *
 * Phase 1A (IPI-706): also emit `.open-next/worker-bundle-report.json` and,
 * when a base report is supplied, print a per-PR gzip **delta WARNING**.
 * Delta never hard-fails until variance is measured (do not promote yet).
 *
 * Base report (optional):
 *   --base-report=<path>  or  WORKER_BUNDLE_BASE_REPORT=<path>
 *
 * Startup: `wrangler check startup` is local diagnostic only — never a hard fail.
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(__dirname, "..");
const localWrangler = path.join(appDir, "node_modules", ".bin", "wrangler");
const defaultReportPath = path.join(appDir, ".open-next", "worker-bundle-report.json");
const metafilePath = path.join(
  appDir,
  ".open-next",
  "server-functions",
  "default",
  "handler.mjs.meta.json",
);

export const WARN_MIB = 8.5;
export const FAIL_MIB = 9.0;
/** Provisional growth warn (KiB). Not a hard fail — Phase 1A. */
export const DELTA_WARN_KIB = 25;
/** Local diagnostic bands only — not hard fails. */
const WARN_STARTUP_MS = 500;
const FAIL_STARTUP_MS = 750;

export function parseGzipKiB(text) {
  const m = text.match(/Total Upload:\s*([\d.]+)\s*KiB\s*\/\s*gzip:\s*([\d.]+)\s*KiB/i);
  if (!m) return null;
  return { uploadKiB: Number(m[1]), gzipKiB: Number(m[2]) };
}

export function parseStartupMs(text) {
  const m =
    text.match(/startup_time_ms[=:\s]+([\d.]+)/i) ||
    text.match(/Startup time[:\s]+([\d.]+)\s*ms/i);
  return m ? Number(m[1]) : null;
}

export function hashFileSha256(filePath) {
  if (!existsSync(filePath)) return null;
  return createHash("sha256").update(readFileSync(filePath)).digest("hex");
}

/** Installed version from node_modules/<name>/package.json, or null. */
export function readInstalledVersion(name, appRoot = appDir) {
  const pkgPath = path.join(appRoot, "node_modules", ...name.split("/"), "package.json");
  if (!existsSync(pkgPath)) return null;
  try {
    const version = JSON.parse(readFileSync(pkgPath, "utf8")).version;
    return typeof version === "string" ? version : null;
  } catch {
    return null;
  }
}

/**
 * Prefer installed versions (lockfile reality). Fall back to package.json
 * dependency / devDependency ranges only when node_modules is missing.
 *
 * @param {string} [appRoot]
 */
export function readPackageVersions(appRoot = appDir) {
  const fromManifest = (name) => {
    const pkgJsonPath = path.join(appRoot, "package.json");
    if (!existsSync(pkgJsonPath)) return null;
    const pkg = JSON.parse(readFileSync(pkgJsonPath, "utf8"));
    return pkg.dependencies?.[name] ?? pkg.devDependencies?.[name] ?? null;
  };
  const pick = (name) => readInstalledVersion(name, appRoot) ?? fromManifest(name);
  return {
    opennext: pick("@opennextjs/cloudflare"),
    wrangler: pick("wrangler"),
    next: pick("next"),
  };
}

/**
 * @param {{ gzipKiB: number, baseGzipKiB: number, warnKiB?: number }} args
 * @returns {{ deltaKiB: number, warn: boolean }}
 */
export function evaluateGzipDelta({ gzipKiB, baseGzipKiB, warnKiB = DELTA_WARN_KIB }) {
  const deltaKiB = gzipKiB - baseGzipKiB;
  return { deltaKiB, warn: deltaKiB > warnKiB };
}

export function buildWorkerBundleReport({
  sizes,
  metafileHash,
  versions,
  gitSha = process.env.GITHUB_SHA ?? null,
  createdAt = new Date().toISOString(),
}) {
  const gzipMiB = sizes.gzipKiB / 1024;
  return {
    schemaVersion: 1,
    createdAt,
    gitSha,
    uploadKiB: sizes.uploadKiB,
    gzipKiB: sizes.gzipKiB,
    gzipMiB: Number(gzipMiB.toFixed(6)),
    gates: { warnMiB: WARN_MIB, failMiB: FAIL_MIB, deltaWarnKiB: DELTA_WARN_KIB },
    metafileSha256: metafileHash,
    versions,
  };
}

function parseArgs(argv) {
  let baseReport = process.env.WORKER_BUNDLE_BASE_REPORT || null;
  let reportPath = process.env.WORKER_BUNDLE_REPORT_PATH || defaultReportPath;
  for (const arg of argv) {
    if (arg.startsWith("--base-report=")) baseReport = arg.slice("--base-report=".length);
    else if (arg.startsWith("--report-path=")) reportPath = arg.slice("--report-path=".length);
  }
  return { baseReport, reportPath };
}

function runWrangler(args) {
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

/**
 * Load base gzip from a prior report. Must run before writing the current report
 * when base and output paths can resolve to the same file.
 *
 * @param {string | null | undefined} baseReportPath
 * @returns {{ gzipKiB: number, gitSha: string | null, path: string } | null}
 */
export function loadBaseGzipKiB(baseReportPath) {
  if (!baseReportPath) return null;
  if (!existsSync(baseReportPath)) {
    console.warn(`WARN (delta): base report not found at ${baseReportPath} — skipping delta`);
    return null;
  }
  try {
    const base = JSON.parse(readFileSync(baseReportPath, "utf8"));
    if (typeof base.gzipKiB !== "number" || !Number.isFinite(base.gzipKiB)) {
      console.warn(`WARN (delta): base report missing numeric gzipKiB — skipping delta`);
      return null;
    }
    return { gzipKiB: base.gzipKiB, gitSha: base.gitSha ?? null, path: baseReportPath };
  } catch (err) {
    console.warn(
      `WARN (delta): could not parse base report (${err instanceof Error ? err.message : err}) — skipping delta`,
    );
    return null;
  }
}

export function main(argv = process.argv.slice(2)) {
  const { baseReport, reportPath } = parseArgs(argv);

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
  const metafileHash = hashFileSha256(metafilePath);

  // Load base BEFORE writing the current report — same-path reuse would otherwise
  // overwrite the base JSON and silently report +0.00 KiB.
  let base = null;
  if (baseReport) {
    const resolvedBase = path.resolve(baseReport);
    const resolvedOut = path.resolve(reportPath);
    if (resolvedBase === resolvedOut) {
      console.warn(
        `WARN (delta): --base-report resolves to the same path as the output report (${resolvedOut}) — loading base before write`,
      );
    }
    base = loadBaseGzipKiB(baseReport);
  }

  let versions = { opennext: null, wrangler: null, next: null };
  try {
    versions = readPackageVersions();
  } catch (err) {
    console.warn(
      `WARN: could not read package.json versions: ${err instanceof Error ? err.message : err}`,
    );
  }
  const report = buildWorkerBundleReport({ sizes, metafileHash, versions });

  try {
    writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    console.log(`Wrote worker bundle report: ${reportPath}`);
  } catch (err) {
    console.warn(
      `WARN: could not write report to ${reportPath}: ${err instanceof Error ? err.message : err}`,
    );
  }

  console.log(
    `Worker dry-run: ${sizes.uploadKiB.toFixed(2)} KiB / gzip ${sizes.gzipKiB.toFixed(2)} KiB (${gzipMiB.toFixed(3)} MiB)`,
  );
  if (metafileHash) {
    console.log(`Metafile sha256: ${metafileHash.slice(0, 12)}… (${metafilePath})`);
  } else {
    console.warn(`WARN: metafile missing at ${metafilePath}`);
  }

  if (base) {
    const { deltaKiB, warn } = evaluateGzipDelta({
      gzipKiB: sizes.gzipKiB,
      baseGzipKiB: base.gzipKiB,
    });
    const sign = deltaKiB >= 0 ? "+" : "";
    console.log(
      `Delta vs base (${base.path}${base.gitSha ? `, sha ${String(base.gitSha).slice(0, 7)}` : ""}): ${sign}${deltaKiB.toFixed(2)} KiB gzip (base ${base.gzipKiB.toFixed(2)} → ${sizes.gzipKiB.toFixed(2)})`,
    );
    if (warn) {
      console.warn(
        `WARN (delta): gzip grew ${deltaKiB.toFixed(2)} KiB > ${DELTA_WARN_KIB} KiB provisional threshold — not a hard fail (IPI-706 Phase 1A)`,
      );
    } else {
      console.log(
        `OK (delta): growth within provisional ${DELTA_WARN_KIB} KiB warn threshold (not a hard fail)`,
      );
    }
  } else if (!baseReport) {
    console.log(
      "Delta: skipped (no --base-report / WORKER_BUNDLE_BASE_REPORT) — absolute gates only",
    );
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

  if (dry.code !== 0) {
    console.error("wrangler deploy --dry-run exited non-zero");
    exit = 1;
  }

  reportLocalStartup(dry.out);
  process.exit(exit);
}

const isDirectRun =
  process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isDirectRun) {
  main();
}
