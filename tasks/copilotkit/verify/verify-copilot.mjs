#!/usr/bin/env node
/**
 * IPI-734 · COPILOT-VERIFY-001 — thin verify:copilot wrapper.
 *
 * Owns CLI flags + readonly guard + /info preflight + evidence summary.
 * Browser journey stays in IPI-724 run-e2e.mjs (no second Playwright suite).
 *
 * Usage (repo root):
 *   npm run verify:copilot -- --help
 *   npm run verify:copilot -- --base-url=https://ipix.co            # must fail (no --readonly)
 *   npm run verify:copilot -- --base-url="$PREVIEW" --readonly --out=tasks/copilotkit/verify/evidence
 *
 * SSOT (exists on main): tasks/copilotkit/j20-copilotkit-audit.md
 *
 * Readonly means: no write/mutate Mastra tools, no destructive prompts, no booking/CRM
 * mutations. IPI-724 chat send is read-oriented smoke only. Tool-path asserts stay preview-only.
 *
 * Version assert: Worker may expose identity via version_metadata / X-iPix-Worker-Version
 * (wire in bootstrap / IPI-707). This runner fails when --expect-version is set and the
 * header is missing or mismatched.
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync, readFileSync, existsSync, copyFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "../../..");
const RUNNER = join(
  REPO_ROOT,
  "tasks/cloudflare/tests/ipi-724-e2e-preview-journey/run-e2e.mjs",
);
const DEFAULT_OUT = join(__dirname, "evidence");
/** Evidence schema for summary.json (bump when additive fields change meaning). */
export const SUMMARY_SCHEMA_VERSION = 1;
export const INFO_TIMEOUT_MS = 15_000;

const PROD_HOST_RE = /^(?:www\.)?ipix\.co$/i;
/** Local smoke may use plain HTTP; everything else must be HTTPS before network. */
const LOCAL_HTTP_HOST_RE = /^(?:localhost|127\.0\.0\.1|\[::1\])$/i;
/** RFC 7230 token for header field-name (no CR/LF/colon). */
const HEADER_NAME_RE = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/;
/** Refuse secret-bearing names — HAR / Playwright must not ingest these via --header. */
export const SECRET_HEADER_NAME_RE =
  /^(?:authorization|proxy-authorization|cookie|set-cookie|x-api-key|x-auth-token)$/i;
const MAX_HEADER_NAME_LEN = 256;
const MAX_HEADER_VALUE_LEN = 8_192;
const MAX_SPAWN_LOG_CHARS = 32_000;

function requireArgValue(argv, i, flag) {
  if (i + 1 >= argv.length || String(argv[i + 1]).startsWith("--")) {
    throw new Error(`Missing value for ${flag}`);
  }
  return argv[i + 1];
}

export function parseArgs(argv) {
  const opts = {
    help: false,
    baseUrl: null,
    readonly: false,
    browser: "chromium",
    out: DEFAULT_OUT,
    headers: [],
    expectVersion: null,
    expectVersionSet: false,
    skipBrowser: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help" || a === "-h") opts.help = true;
    else if (a === "--readonly") opts.readonly = true;
    else if (a === "--skip-browser") opts.skipBrowser = true;
    else if (a.startsWith("--base-url=")) opts.baseUrl = a.slice("--base-url=".length);
    else if (a === "--base-url") {
      opts.baseUrl = requireArgValue(argv, i, "--base-url");
      i++;
    } else if (a.startsWith("--browser=")) opts.browser = a.slice("--browser=".length);
    else if (a === "--browser") {
      opts.browser = requireArgValue(argv, i, "--browser");
      i++;
    } else if (a.startsWith("--out=")) opts.out = a.slice("--out=".length);
    else if (a === "--out") {
      opts.out = requireArgValue(argv, i, "--out");
      i++;
    } else if (a.startsWith("--header=")) opts.headers.push(a.slice("--header=".length));
    else if (a === "--header") {
      opts.headers.push(requireArgValue(argv, i, "--header"));
      i++;
    } else if (a.startsWith("--expect-version=")) {
      opts.expectVersion = a.slice("--expect-version=".length);
      opts.expectVersionSet = true;
    } else if (a === "--expect-version") {
      opts.expectVersion = requireArgValue(argv, i, "--expect-version");
      opts.expectVersionSet = true;
      i++;
    } else throw new Error(`Unknown argument: ${a}`);
  }
  if (opts.expectVersionSet && !String(opts.expectVersion ?? "").trim()) {
    throw new Error("--expect-version requires a non-empty value");
  }
  return opts;
}

/** Lowercase hostname with trailing DNS root dot stripped (WHATWG keeps the dot). */
export function normalizeHostname(hostname) {
  return String(hostname || "")
    .toLowerCase()
    .replace(/\.$/, "");
}

export function hostnameOf(baseUrl) {
  try {
    return normalizeHostname(new URL(baseUrl).hostname);
  } catch {
    return "";
  }
}

/**
 * URL + prod guard before any network / Playwright.
 * - HTTPS required except localhost / 127.0.0.1 / ::1
 * - Prod hosts (ipix.co / www) require --readonly
 */
export function assertReadonlyGuard({ baseUrl, readonly }) {
  let parsed;
  try {
    parsed = new URL(baseUrl);
  } catch {
    return {
      ok: false,
      message: `FAIL (url): invalid --base-url (not a URL): ${baseUrl}`,
    };
  }

  const host = normalizeHostname(parsed.hostname);
  const isLocalHttpOk = LOCAL_HTTP_HOST_RE.test(host);
  if (parsed.protocol !== "https:" && !(parsed.protocol === "http:" && isLocalHttpOk)) {
    return {
      ok: false,
      message:
        `FAIL (url): --base-url must use HTTPS before network access ` +
        `(got ${parsed.protocol}//${host}; http only allowed for localhost). ` +
        `Aborting before Playwright.`,
    };
  }

  if (PROD_HOST_RE.test(host) && !readonly) {
    return {
      ok: false,
      message:
        `FAIL (readonly): ${host} looks like production — pass --readonly ` +
        `(read-only smoke: no mutate tools / destructive prompts) or use a preview URL. ` +
        `Aborting before Playwright.`,
    };
  }
  return { ok: true };
}

/**
 * Parse repeated `--header='Name: value'` into one object used by preflight + Playwright.
 * Malformed / unsafe entries throw before any network access.
 * Error messages never echo raw values (may contain secrets).
 */
export function headersToObject(headerArgs) {
  const out = {};
  for (const raw of headerArgs) {
    if (raw == null || typeof raw !== "string" || !raw.trim()) {
      throw new Error('Invalid --header (empty); need "Name: value"');
    }
    const idx = raw.indexOf(":");
    if (idx < 0) {
      throw new Error('Invalid --header (need "Name: value"; raw argument omitted from logs)');
    }
    const name = raw.slice(0, idx).trim();
    const value = raw.slice(idx + 1).trim();
    if (!name) throw new Error("Invalid --header name (empty)");
    if (!value) throw new Error(`Invalid --header value (empty) for ${name}`);
    if (name.length > MAX_HEADER_NAME_LEN) {
      throw new Error(`Invalid --header name (too long, max ${MAX_HEADER_NAME_LEN})`);
    }
    if (value.length > MAX_HEADER_VALUE_LEN) {
      throw new Error(`Invalid --header value (too long, max ${MAX_HEADER_VALUE_LEN}) for ${name}`);
    }
    if (!HEADER_NAME_RE.test(name)) {
      throw new Error("Invalid --header name (illegal characters)");
    }
    if (SECRET_HEADER_NAME_RE.test(name)) {
      throw new Error(
        `Invalid --header: refusing secret-bearing name "${name}" ` +
          "(use non-secret version-override / CF access headers only)",
      );
    }
    // Reject CR/LF / NUL and other controls — header injection / log corruption.
    if (/[\u0000-\u001f\u007f]/.test(value)) {
      throw new Error(`Invalid --header value (control characters not allowed): ${name}`);
    }
    out[name] = value;
  }
  return out;
}

/** Fail when expected is set and actual is missing or mismatched. */
export function versionMatches(actual, expected) {
  if (!expected) return true;
  if (actual == null || actual === "") return false;
  return String(actual) === String(expected);
}

/** Redact secrets from objects before writing evidence. */
export function redactForEvidence(value, depth = 0) {
  if (depth > 8) return "[truncated]";
  if (value == null) return value;
  if (typeof value === "string") {
    if (/^(Bearer\s+|sbp_|eyJ)/i.test(value)) return "[redacted]";
    if (value.length > 500 && /cookie|authorization|token/i.test(value)) return "[redacted]";
    return value;
  }
  if (Array.isArray(value)) return value.map((v) => redactForEvidence(v, depth + 1));
  if (typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (/authorization|cookie|password|token|secret|api[_-]?key/i.test(k)) {
        out[k] = "[redacted]";
      } else {
        out[k] = redactForEvidence(v, depth + 1);
      }
    }
    return out;
  }
  return value;
}

/**
 * Redact credential-like substrings from child-process console output before logging.
 * Kept separate from redactForEvidence so multi-line runner logs stay readable.
 */
export function redactConsoleOutput(text) {
  if (text == null || text === "") return "";
  let s = String(text);
  s = s.replace(/Bearer\s+[A-Za-z0-9._\-+\/=]+/gi, "Bearer [redacted]");
  s = s.replace(/\bsbp_[A-Za-z0-9]+/g, "sbp_[redacted]");
  s = s.replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, "[redacted-jwt]");
  s = s.replace(
    /(authorization|cookie|password|api[_-]?key|token)\s*[:=]\s*[^\s,;]+/gi,
    "$1=[redacted]",
  );
  if (s.length > MAX_SPAWN_LOG_CHARS) {
    s = `${s.slice(0, MAX_SPAWN_LOG_CHARS)}\n…[truncated ${s.length - MAX_SPAWN_LOG_CHARS} chars]`;
  }
  return s;
}

export async function preflightInfo(baseUrl, headers = {}, { timeoutMs = INFO_TIMEOUT_MS, fetchImpl = fetch } = {}) {
  const url = `${baseUrl.replace(/\/$/, "")}/api/copilotkit/info`;
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const res = await fetchImpl(url, {
      headers: { Accept: "application/json", ...headers },
      redirect: "manual",
      signal: ac.signal,
    });
    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {
      /* non-JSON */
    }
    const agents = json?.agents ? Object.keys(json.agents) : [];
    const versionHeader =
      res.headers.get("x-ipix-worker-version") ||
      res.headers.get("cf-worker-version") ||
      null;
    return {
      url,
      status: res.status,
      agents,
      agentCount: agents.length,
      versionHeader,
      bodySnippet: text.slice(0, 300),
    };
  } finally {
    clearTimeout(timer);
  }
}

function printHelp() {
  console.log(`verify:copilot — IPI-734 thin wrapper around IPI-724 run-e2e.mjs

Usage:
  npm run verify:copilot -- --base-url=<URL> [--readonly] [options]

Options:
  --base-url=<URL>           Target host (required unless --help)
  --readonly                 Required for production hosts (ipix.co / www.ipix.co)
                             Read-only = no mutate tools / destructive prompts
                             Remote URLs must be HTTPS (http only for localhost)
  --header='Name: value'     Repeatable; same object for /info preflight + Playwright
                             Names/values validated (no CR/LF, size caps) before network
  --expect-version=<id>      Fail if X-iPix-Worker-Version missing or mismatched
  --browser=chromium         Hard: chromium only (FF/WebKit soft / scheduled elsewhere)
  --out=<dir>                Evidence dir (default: tasks/copilotkit/verify/evidence)
  --skip-browser             Preflight + guards only (unit / dry)
  --help                     Show this help

Auth contract (iPix):
  Anonymous GET /api/copilotkit/info → 401 (healthy). Authenticated → 200 + agents
  (auth path exercised inside IPI-724 after QA login).

Delegates browser matrix to:
  tasks/cloudflare/tests/ipi-724-e2e-preview-journey/run-e2e.mjs
SSOT: tasks/copilotkit/j20-copilotkit-audit.md
Mastra tool signal: deferred to IPI-850 soft gap / follow-up (not required for 734 Done)
`);
}

function writeSummary(outDir, summary) {
  mkdirSync(outDir, { recursive: true });
  const path = join(outDir, "summary.json");
  const payload = redactForEvidence({
    schemaVersion: SUMMARY_SCHEMA_VERSION,
    ...summary,
  });
  writeFileSync(path, JSON.stringify(payload, null, 2));
  return path;
}

export async function main(argv = process.argv.slice(2), deps = {}) {
  const fetchImpl = deps.fetchImpl || fetch;
  const spawn = deps.spawnSync || spawnSync;

  const opts = parseArgs(argv);
  if (opts.help) {
    printHelp();
    return 0;
  }
  if (!opts.baseUrl) {
    console.error("FAIL: --base-url is required (see --help)");
    return 1;
  }
  if (opts.browser !== "chromium") {
    console.error(
      `FAIL: only --browser=chromium is supported hard-path (got ${opts.browser})`,
    );
    return 1;
  }

  const baseUrl = opts.baseUrl.replace(/\/$/, "");
  const outDir = resolve(REPO_ROOT, opts.out);
  const guard = assertReadonlyGuard({ baseUrl, readonly: opts.readonly });
  if (!guard.ok) {
    console.error(guard.message);
    writeSummary(outDir, {
      pass: false,
      stage: "readonly_guard",
      message: guard.message,
      baseUrl,
    });
    return 1;
  }

  let headerObj;
  try {
    headerObj = headersToObject(opts.headers);
  } catch (e) {
    console.error(`FAIL: ${e.message}`);
    writeSummary(outDir, {
      pass: false,
      stage: "header_parse",
      message: String(e.message),
      baseUrl,
    });
    return 1;
  }

  console.log(`preflight GET ${baseUrl}/api/copilotkit/info …`);
  let info;
  try {
    info = await preflightInfo(baseUrl, headerObj, { fetchImpl });
  } catch (e) {
    const msg = e?.name === "AbortError" ? `timeout after ${INFO_TIMEOUT_MS}ms` : String(e?.message || e);
    console.error(`FAIL (preflight): ${msg}`);
    writeSummary(outDir, {
      pass: false,
      stage: "preflight",
      message: msg,
      baseUrl,
    });
    return 1;
  }
  console.log(
    `preflight anon: status=${info.status} agents=${info.agentCount}` +
      (info.versionHeader ? ` version=${info.versionHeader}` : ""),
  );

  // Healthy anon contract: 401. 302 = Vercel SSO — never a preflight_only pass.
  if (info.status === 401) {
    /* ok */
  } else if (info.status === 302 && !opts.skipBrowser) {
    console.warn(
      "WARN (preflight): anon /info 302 (SSO/Vercel) — continuing to browser; not a Worker-preview 401",
    );
  } else {
    console.error(
      `FAIL (preflight): unexpected anon /info status ${info.status}` +
        (opts.skipBrowser
          ? " (preflight-only requires 401; 302 is inconclusive)"
          : " (expect 401; 302 = SSO/Vercel only with browser)"),
    );
    writeSummary(outDir, {
      pass: false,
      stage: "preflight",
      info,
      baseUrl,
    });
    return 1;
  }

  if (opts.expectVersionSet) {
    if (!versionMatches(info.versionHeader, opts.expectVersion)) {
      console.error(
        `FAIL (expect-version): wanted ${opts.expectVersion}, got ${info.versionHeader ?? "(missing)"}`,
      );
      writeSummary(outDir, {
        pass: false,
        stage: "expect_version",
        expected: opts.expectVersion,
        actual: info.versionHeader,
        info,
        baseUrl,
      });
      return 1;
    }
  }

  mkdirSync(outDir, { recursive: true });

  if (opts.skipBrowser) {
    const summaryPath = writeSummary(outDir, {
      pass: true,
      stage: "preflight_only",
      readonly: opts.readonly,
      baseUrl,
      info,
      runner: RUNNER,
      note: "--skip-browser: did not spawn IPI-724",
    });
    console.log(`PASS (preflight only) → ${summaryPath}`);
    return 0;
  }

  if (!existsSync(RUNNER)) {
    console.error(`FAIL: IPI-724 runner missing at ${RUNNER}`);
    return 1;
  }

  const env = {
    ...process.env,
    BASE_URL: baseUrl,
    VERIFY_READONLY: opts.readonly ? "1" : "0",
    VERIFY_OUT: outDir,
  };
  if (Object.keys(headerObj).length > 0) {
    env.VERIFY_EXTRA_HEADERS = JSON.stringify(headerObj);
  }

  console.log(`delegate → IPI-724 run-e2e.mjs (BASE_URL=${baseUrl})`);
  // Capture child I/O so credentials in runner output are redacted before logging.
  const result = spawn(process.execPath, [RUNNER], {
    cwd: REPO_ROOT,
    env,
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
    stdio: ["inherit", "pipe", "pipe"],
  });

  const childOut = redactConsoleOutput(
    `${result.stdout || ""}${result.stderr ? `\n${result.stderr}` : ""}`,
  );
  if (childOut.trim()) {
    process.stdout.write(childOut.endsWith("\n") ? childOut : `${childOut}\n`);
  }

  if (result.error) {
    const msg = redactConsoleOutput(String(result.error.message));
    console.error(`FAIL (spawn): ${msg}`);
    writeSummary(outDir, {
      pass: false,
      stage: "browser_delegate",
      message: msg,
      baseUrl,
      info,
    });
    return 1;
  }
  if (result.signal) {
    console.error(`FAIL (spawn): killed by signal ${result.signal}`);
    writeSummary(outDir, {
      pass: false,
      stage: "browser_delegate",
      signal: result.signal,
      baseUrl,
      info,
    });
    return 1;
  }

  const exitCode = typeof result.status === "number" ? result.status : 1;

  // Prefer VERIFY_OUT metadata; fall back to legacy runner-dir path.
  const runnerMetaCandidates = [
    join(outDir, "metadata.json"),
    join(
      REPO_ROOT,
      "tasks/cloudflare/tests/ipi-724-e2e-preview-journey/metadata.json",
    ),
  ];
  let hardAcPass = null;
  for (const runnerMeta of runnerMetaCandidates) {
    if (!existsSync(runnerMeta)) continue;
    try {
      const meta = JSON.parse(readFileSync(runnerMeta, "utf8"));
      hardAcPass = meta.hard_ac_pass ?? null;
      if (runnerMeta !== join(outDir, "ipi-724-metadata.json")) {
        copyFileSync(runnerMeta, join(outDir, "ipi-724-metadata.json"));
      }
      break;
    } catch {
      /* try next */
    }
  }

  const pass = exitCode === 0;
  const summaryPath = writeSummary(outDir, {
    pass,
    stage: "browser_delegate",
    readonly: opts.readonly,
    baseUrl,
    info,
    runner: RUNNER,
    runnerExitCode: exitCode,
    hard_ac_pass: hardAcPass,
    ssot: "tasks/copilotkit/j20-copilotkit-audit.md",
  });
  console.log(`${pass ? "PASS" : "FAIL"} verify:copilot → ${summaryPath}`);
  return pass ? 0 : exitCode || 1;
}

const isMain =
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  main()
    .then((code) => process.exit(code))
    .catch((err) => {
      console.error(`FAIL: ${err?.message || err}`);
      process.exit(1);
    });
}
