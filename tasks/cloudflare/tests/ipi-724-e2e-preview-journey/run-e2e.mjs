/**
 * IPI-724 · CF-UJ-018 — Chromium Playwright E2E against Cloudflare preview.
 * Test/evidence tooling (not production app code). Writes sanitized artifacts only.
 *
 * Usage (from worktree root):
 *   node --env-file=app/.env.local tasks/cloudflare/tests/ipi-724-e2e-preview-journey/run-e2e.mjs
 *
 * Security: network-summary.json is the durable network artifact (HAR capture disabled).
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { execFileSync, execSync } from "node:child_process";
import { assertNoSecrets } from "./assert-no-secrets.mjs";
import { isPreviewSignoutSuccessRedirect } from "./signout-redirect.mjs";
import {
  classifyConsoleError,
  classifyNetworkResponse,
  countInfo503Responses,
  info503ExceedsThreshold,
} from "../../../copilotkit/classifiers/info-503-threshold.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
/** IPI-734: verify:copilot sets VERIFY_OUT so artifacts never overwrite the tracked runner dir. */
const OUT = resolve(process.env.VERIFY_OUT || __dirname);
const SHOTS = join(OUT, "screenshots");
const DEFAULT_PREVIEW = "https://ipix-operator-preview.sk-498.workers.dev";
// IPI-734: verify:copilot sets BASE_URL; default stays the CF preview Worker.
const PREVIEW = (process.env.BASE_URL || DEFAULT_PREVIEW).replace(/\/$/, "");
const READONLY = process.env.VERIFY_READONLY === "1";
const MAX_TRANSIENT_RETRIES = 2; // Page navigation retries (login, /app, settle, logout)
// IPI-967: MAX_INFO_503_RETRIES is now defined in info-503-threshold.mjs as the single source of truth
const REPO_ROOT = process.cwd();
const SECRET_HEADER_NAME_RE =
  /^(?:authorization|proxy-authorization|cookie|set-cookie|x-api-key|x-auth-token)$/i;
const HEADER_NAME_RE = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/;
const MAX_HEADER_VALUE_LEN = 8_192;

/** Only these hosts may receive QA credentials (login form phishing guard). */
export function assertTrustedCredentialTarget(baseUrl) {
  let u;
  try {
    u = new URL(baseUrl);
  } catch {
    throw new Error(`Refusing QA credentials: invalid BASE_URL`);
  }
  const host = u.hostname.toLowerCase().replace(/\.$/, "");
  const trusted =
    /^(?:www\.)?ipix\.co$/.test(host) ||
    /^ipix-operator-preview(?:\.[a-z0-9-]+)*\.workers\.dev$/.test(host) ||
    host === "localhost" ||
    host === "127.0.0.1";
  if (!trusted) {
    throw new Error(
      `Refusing QA credentials for untrusted host "${host}" ` +
        "(allowlist: ipix.co, ipix-operator-preview*.workers.dev, localhost)",
    );
  }
  const localHttp = host === "localhost" || host === "127.0.0.1";
  if (u.protocol !== "https:" && !(u.protocol === "http:" && localHttp)) {
    throw new Error(`Refusing QA credentials over ${u.protocol} (HTTPS required)`);
  }
}

/** Optional request headers from verify:copilot (`VERIFY_EXTRA_HEADERS` JSON). */
function loadExtraHeaders() {
  const raw = process.env.VERIFY_EXTRA_HEADERS;
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      console.warn("WARN: VERIFY_EXTRA_HEADERS must be a JSON object — ignoring");
      return undefined;
    }
    const out = {};
    for (const [name, value] of Object.entries(parsed)) {
      if (!HEADER_NAME_RE.test(name) || SECRET_HEADER_NAME_RE.test(name)) {
        throw new Error(
          `VERIFY_EXTRA_HEADERS refuses unsafe header name (secret or illegal)`,
        );
      }
      if (value == null || typeof value === "object") {
        throw new Error(`VERIFY_EXTRA_HEADERS values must be strings (${name})`);
      }
      const s = String(value).trim();
      if (!s || s.length > MAX_HEADER_VALUE_LEN || /[\u0000-\u001f\u007f]/.test(s)) {
        throw new Error(`VERIFY_EXTRA_HEADERS unsafe value for ${name}`);
      }
      out[name] = s;
    }
    return Object.keys(out).length ? out : undefined;
  } catch (e) {
    if (/VERIFY_EXTRA_HEADERS/.test(String(e?.message || e))) throw e;
    console.warn("WARN: VERIFY_EXTRA_HEADERS is not valid JSON — ignoring");
    return undefined;
  }
}

/** Attach verify headers only to the target origin (not Supabase / third parties). */
async function applyOriginScopedHeaders(context, targetUrl, headers) {
  if (!headers || !Object.keys(headers).length) return;
  const origin = new URL(targetUrl).origin;
  await context.route("**/*", async (route) => {
    const req = route.request();
    let reqOrigin;
    try {
      reqOrigin = new URL(req.url()).origin;
    } catch {
      await route.continue();
      return;
    }
    if (reqOrigin === origin) {
      await route.continue({ headers: { ...req.headers(), ...headers } });
    } else {
      await route.continue();
    }
  });
}

const require = createRequire(import.meta.url);
let playwrightVersion = "unknown";
try {
  playwrightVersion = require("playwright/package.json").version;
} catch {
  try {
    playwrightVersion = require(
      join(REPO_ROOT, "app/node_modules/playwright/package.json"),
    ).version;
  } catch {
    /* keep unknown */
  }
}

/** Live Worker identity from wrangler — never hardcode version/SHA for provenance. */
function resolvePreviewDeploymentIdentity(targetUrl = PREVIEW) {
  const identity = {
    worker_version_id: null,
    deployment_id: null,
    worker_version_created_on: null,
    identity_source: null,
    identity_error: null,
    evidence_runner_git_sha: null,
    deployment_git_sha: null,
    deployment_git_sha_note:
      "Cloudflare Workers versions API does not expose git SHA; do not invent origin/main tip.",
  };
  try {
    identity.evidence_runner_git_sha = execSync("git rev-parse HEAD", {
      cwd: REPO_ROOT,
      encoding: "utf8",
    }).trim();
  } catch {
    identity.evidence_runner_git_sha = null;
  }
  const targetHost = new URL(targetUrl).hostname.toLowerCase().replace(/\.$/, "");
  const defaultHost = new URL(DEFAULT_PREVIEW).hostname.toLowerCase();
  if (targetHost !== defaultHost) {
    identity.identity_source = "skipped_non_default_preview_host";
    identity.identity_error =
      `wrangler preview identity skipped for host ${targetHost} (not ${defaultHost})`;
    return identity;
  }
  try {
    const appDir = existsSync(join(REPO_ROOT, "app/wrangler.jsonc"))
      ? join(REPO_ROOT, "app")
      : REPO_ROOT;
    const raw = execFileSync(
      "npx",
      ["wrangler", "deployments", "list", "--env", "preview", "--json"],
      { cwd: appDir, encoding: "utf8", timeout: 60_000, stdio: ['ignore', 'pipe', 'pipe'] },
    );
    const deployments = JSON.parse(raw);
    if (!Array.isArray(deployments) || deployments.length === 0) {
      identity.identity_error = "wrangler deployments list returned empty";
      return identity;
    }
    const sorted = [...deployments].sort((a, b) =>
      String(b.created_on || "").localeCompare(String(a.created_on || "")),
    );
    const latest = sorted[0];
    const version =
      latest?.versions?.find((v) => v.percentage === 100) || latest?.versions?.[0];
    identity.worker_version_id = version?.version_id || null;
    identity.deployment_id = latest?.id || null;
    identity.worker_version_created_on = latest?.created_on || null;
    identity.identity_source =
      "wrangler deployments list --env preview --json (latest by created_on)";
  } catch (e) {
    const error = String(e?.message || e);
    identity.identity_error = error.slice(0, 300);
    // IPI-964: If Wrangler auth is missing, treat as non-blocking metadata failure
    // The verification can still complete without Worker version identity
    // Require credential-specific wording, not just token name appearing in error text
    if (/CLOUDFLARE_API_TOKEN.*(?:missing|required|not set|invalid)|not authenticated|authentication (?:error|required)/i.test(error)) {
      identity.identity_source = "wrangler_auth_unavailable";
      identity.identity_error = `Wrangler auth not configured — identity metadata unavailable (non-blocking): ${error.slice(0, 200)}`;
    }
  }
  return identity;
}

function sanitizeNetworkUrl(url) {
  try {
    let u = new URL(url);
    // blob:https://host/uuid → host "" and pathname is the inner absolute URL.
    if (u.protocol === "blob:" && /^https?:\/\//i.test(u.pathname)) {
      u = new URL(u.pathname);
    }
    return {
      host: u.host || null,
      path: u.pathname,
      // Never retain query — login/auth leaks have appeared in automation URLs.
    };
  } catch {
    return { host: null, path: String(url).split("?")[0] };
  }
}

function loadQaPassword() {
  if (process.env.QA_PASSWORD) return process.env.QA_PASSWORD;
  for (const p of [
    join(process.cwd(), "app/.env.local"),
    join(process.cwd(), ".env.local"),
  ]) {
    if (!existsSync(p)) continue;
    const m = readFileSync(p, "utf8").match(/^QA_PASSWORD=(.+)$/m);
    if (m) return m[1].trim().replace(/^["']|["']$/g, "");
  }
  throw new Error("QA_PASSWORD not found");
}

function isTransient(err) {
  const s = String(err?.message || err);
  return (
    /timeout/i.test(s) ||
    /\b502\b/.test(s) ||
    /\b503\b/.test(s) ||
    /Navigation timeout/i.test(s)
  );
}

async function withTransientRetry(label, fn) {
  let last;
  for (let attempt = 0; attempt <= MAX_TRANSIENT_RETRIES; attempt++) {
    try {
      return { result: await fn(), retries: attempt };
    } catch (e) {
      last = e;
      if (!isTransient(e) || attempt === MAX_TRANSIENT_RETRIES) throw e;
      console.warn(`[retry ${attempt + 1}/${MAX_TRANSIENT_RETRIES}] ${label}: ${e.message}`);
    }
  }
  throw last;
}

const networkLog = [];
const consoleLog = { errors: [], warnings: [], info: [] };
const criteria = {};
const perf = {};
const startedAt = new Date().toISOString();

function mark(id, pass, note, evidence = {}) {
  criteria[id] = { pass, note, ...evidence };
  console.log(`${pass ? "PASS" : "FAIL"}  ${id}: ${note}`);
}

function writeEvidence(path, value) {
  const text = typeof value === "string" ? value : JSON.stringify(value, null, 2);
  assertNoSecrets(path, text);
  writeFileSync(path, text);
}

async function main() {
  assertTrustedCredentialTarget(PREVIEW);
  const password = loadQaPassword();
  const email = "qa@ipix.test";
  mkdirSync(SHOTS, { recursive: true });

  const deploymentIdentity = resolvePreviewDeploymentIdentity(PREVIEW);

  const browser = await chromium.launch({ headless: true });
  const extraHTTPHeaders = loadExtraHeaders();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    // Real Cloudflare preview TLS must validate (do not mask cert failures).
    // Headers applied via route (origin-scoped) — not context-wide extraHTTPHeaders.
  });
  await applyOriginScopedHeaders(context, PREVIEW, extraHTTPHeaders);
  const page = await context.newPage();
  const browserVersion = browser.version();
  if (READONLY) {
    console.log("VERIFY_READONLY=1 — read-oriented journey; mutate API POSTs fail the run");
  }

  page.on("console", (msg) => {
    const entry = { type: msg.type(), text: msg.text(), ts: new Date().toISOString() };
    if (msg.type() === "error") consoleLog.errors.push(entry);
    else if (msg.type() === "warning") consoleLog.warnings.push(entry);
    else consoleLog.info.push(entry);
  });
  page.on("pageerror", (err) => {
    consoleLog.errors.push({
      type: "pageerror",
      text: String(err?.message || err),
      ts: new Date().toISOString(),
    });
  });

  context.on("response", async (res) => {
    const url = res.url();
    if (!url.includes(new URL(PREVIEW).host) && !url.includes("/api/")) return;
    const req = res.request();
    const timing = res.request().timing?.() || {};
    const { host, path } = sanitizeNetworkUrl(url);
    networkLog.push({
      host,
      path,
      method: req.method(),
      status: res.status(),
      resourceType: req.resourceType(),
      latencyMs:
        typeof timing.responseEnd === "number" && timing.responseEnd >= 0
          ? Math.round(timing.responseEnd)
          : null,
      cfRay: res.headers()["cf-ray"] || null,
      retries: 0,
    });
  });

  let healthCfRay = null;
  let healthBody = null;

  // IPI-968: Granular timing measurements
  const timing = {
    loginStart: 0,
    appResponseMs: 0,
    firstContentMs: 0,
    userReadyMs: 0,
    copilotInitMs: 0,
  };

  try {
    // 1. Login
    timing.loginStart = Date.now();
    await withTransientRetry("goto login", () =>
      page.goto(`${PREVIEW}/login`, { waitUntil: "domcontentloaded", timeout: 45000 }),
    );
    await page.waitForSelector("#email", { timeout: 20000 });
    // IPI-915: let the JS bundle settle before interacting — a click before
    // React hydrates performs a native GET form submit (credentials land in
    // the URL query and the Supabase sign-in never runs); seen on slow networks.
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    await page.fill("#email", email);
    await page.fill("#password", password);
    await Promise.all([
      page.waitForURL(/\/app/, { timeout: 45000 }).catch(() => null),
      // Mode tab + submit both say "Sign in" — click the form submit only.
      page.locator('form button[type="submit"]').click(),
    ]);
    // Allow client navigation
    await page.waitForTimeout(1500);
    if (!page.url().includes("/app")) {
      await withTransientRetry("goto /app after login", () =>
        page.goto(`${PREVIEW}/app`, { waitUntil: "domcontentloaded", timeout: 45000 }),
      );
    }
    await page.screenshot({ path: join(SHOTS, "01-login.png"), fullPage: false });
    const onApp = page.url().includes("/app");
    timing.appResponseMs = Date.now() - timing.loginStart;
    mark("01_login", onApp, onApp ? `landed ${page.url()}` : `stuck at ${page.url()}`);

    // 2–3. Command Center / widgets
    const ccStart = Date.now();
    await withTransientRetry("command center settle", async () => {
      // IPI-968: Replace networkidle with real user-ready signal
      // Wait for main content, nav, and chat dock to be visible
      await Promise.all([
        page.locator("main, [role='main']").first().waitFor({ state: "visible", timeout: 15000 }),
        page.locator("nav a, [class*='nav'] a, aside a").first().waitFor({ state: "visible", timeout: 15000 }),
        page.getByTestId("operator-chat-dock").waitFor({ state: "visible", timeout: 15000 }),
      ]);
      const bodyText = await page.locator("body").innerText();
      if (!bodyText || bodyText.trim().length < 40) {
        throw new Error("503-like empty body / blank page");
      }
    });
    timing.userReadyMs = Date.now() - ccStart;
    perf.commandCenterMs = timing.userReadyMs;
    // Prefer measuring from login→interactive; also record wall from ccStart
    perf.commandCenterFromLoginMs = Date.now() - timing.loginStart;

    await page.screenshot({ path: join(SHOTS, "02-dashboard.png"), fullPage: false });

    const blank = (await page.locator("body").innerText()).trim().length < 40;
    const loop =
      (await page.url()).includes("/login") ||
      (await page.locator('text=/redirect/i').count()) > 0;
    mark(
      "02_app_loads",
      !blank && !loop && page.url().includes("/app"),
      blank ? "blank page" : loop ? "redirect loop / login bounce" : `url=${page.url()}`,
    );

    // Widgets: nav + main content or chat dock
    const navCount = await page.locator("nav a, [class*='nav'] a, aside a").count();
    const dock = page.getByTestId("operator-chat-dock");
    const dockVisible = await dock.isVisible().catch(() => false);
    const mainText = await page.locator("main, [role='main'], body").first().innerText();
    const widgetsOk =
      (navCount >= 3 || dockVisible) && mainText.length > 80 && !blank;
    mark(
      "03_widgets",
      widgetsOk,
      `navLinks=${navCount} chatDock=${dockVisible} mainChars=${mainText.length}`,
    );
    mark(
      "perf_command_center",
      perf.commandCenterFromLoginMs < 5000,
      `${perf.commandCenterFromLoginMs}ms (budget 5000ms soft)`,
      { ms: perf.commandCenterFromLoginMs, budgetMs: 5000, soft: true },
    );

    // 4. CopilotKit init
    const copilotStart = Date.now();
    await withTransientRetry("copilot init", async () => {
      await page.waitForSelector('[data-testid="operator-chat-dock"]', {
        timeout: 15000,
      });
    });
    // Wait for composer textbox inside dock
    const composer = page
      .getByTestId("operator-chat-dock")
      .getByRole("textbox")
      .first();
    await composer.waitFor({ state: "visible", timeout: 20000 }).catch(() => null);
    timing.copilotInitMs = Date.now() - copilotStart;
    perf.copilotInitMs = timing.copilotInitMs;
    const composerVisible = await composer.isVisible().catch(() => false);
    mark(
      "04_copilot_init",
      dockVisible && composerVisible,
      `dock=${dockVisible} composer=${composerVisible} ${perf.copilotInitMs}ms`,
    );
    mark(
      "perf_copilot_init",
      perf.copilotInitMs < 3000,
      `${perf.copilotInitMs}ms (budget 3000ms soft)`,
      { ms: perf.copilotInitMs, budgetMs: 3000, soft: true },
    );

    // 5. Authenticated /api/copilotkit/info
    const infoRes = await page.evaluate(async (base) => {
      const r = await fetch(`${base}/api/copilotkit/info`, {
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      const text = await r.text();
      let json = null;
      try {
        json = JSON.parse(text);
      } catch {
        /* */
      }
      return { status: r.status, json, text: text.slice(0, 500) };
    }, PREVIEW);
    const agents = infoRes.json?.agents
      ? Object.keys(infoRes.json.agents)
      : infoRes.json?.agentIds || [];
    mark(
      "05_copilotkit_info",
      infoRes.status === 200,
      `status=${infoRes.status} mode=${infoRes.json?.mode || "?"} agents=${Array.isArray(agents) ? agents.length : "n/a"}`,
      { status: infoRes.status, body: infoRes.json },
    );

    // 6. /api/ai/health
    const healthRes = await page.evaluate(async (base) => {
      const r = await fetch(`${base}/api/ai/health`, {
        credentials: "include",
        headers: { "Cache-Control": "no-cache" },
      });
      const json = await r.json();
      return {
        status: r.status,
        json,
        cfRay: r.headers.get("cf-ray"),
      };
    }, PREVIEW);
    // cf-ray may not be exposed to JS for CORS — also pull from network log
    healthBody = healthRes.json;
    healthCfRay =
      healthRes.cfRay ||
      networkLog.filter((n) => n.path?.includes("/api/ai/health")).at(-1)?.cfRay ||
      null;
    mark(
      "06_ai_health",
      healthRes.status === 200 && healthRes.json?.probeVia === "service_binding",
      `status=${healthRes.status} probeVia=${healthRes.json?.probeVia} hasApiKey=${healthRes.json?.hasApiKey}`,
      { status: healthRes.status, body: healthRes.json, cfRay: healthCfRay },
    );

    // 7–8. One streamed AI chat
    const prompt = "Reply with exactly: preview journey ok";
    let streamStartMs = null;
    let streamComplete = false;
    let streamInterrupted = false;
    let assistantText = "";

    const chatStart = Date.now();
    // Listen for SSE / streaming responses
    const streamWaiter = page.waitForResponse(
      (r) =>
        r.url().includes("/api/copilotkit") &&
        r.request().method() === "POST" &&
        r.status() < 500,
      { timeout: 90000 },
    );

    if (!composerVisible) {
      mark("07_chat_send", false, "composer not visible — cannot send");
      mark("08_stream", false, "skipped — no composer");
    } else {
      await composer.click();
      await composer.fill(prompt);
      // Prefer Enter; also try send button
      await page.keyboard.press("Enter");
      const sendBtn = page
        .getByTestId("operator-chat-dock")
        .getByRole("button", { name: /send|submit/i });
      if (await sendBtn.isVisible().catch(() => false)) {
        await sendBtn.click().catch(() => {});
      }

      let postRes;
      try {
        postRes = await streamWaiter;
        streamStartMs = Date.now() - chatStart;
        perf.firstStreamTokenMs = streamStartMs;
      } catch (e) {
        mark("07_chat_send", false, `no copilotkit POST: ${e.message}`);
        mark("08_stream", false, "stream never started");
        postRes = null;
      }

      if (postRes) {
        const ct = postRes.headers()["content-type"] || "";
        const streaming =
          ct.includes("text/event-stream") ||
          ct.includes("text/plain") ||
          ct.includes("application/octet-stream") ||
          postRes.status() === 200;

        // Wait for assistant content to grow
        const before = await page.getByTestId("operator-chat-dock").innerText();
        try {
          await page.waitForFunction(
            (prev) => {
              const el = document.querySelector('[data-testid="operator-chat-dock"]');
              const t = el?.innerText || "";
              return t.length > prev.length + 10 && /preview journey|ok|hello|assist|help/i.test(t);
            },
            before.length,
            { timeout: 90000 },
          );
          streamComplete = true;
        } catch {
          // Still check if any new text appeared
          const after = await page.getByTestId("operator-chat-dock").innerText();
          if (after.length > before.length + 5) {
            streamComplete = true;
            assistantText = after.slice(before.length);
          } else {
            streamInterrupted = true;
          }
        }

        assistantText = (await page.getByTestId("operator-chat-dock").innerText()).slice(
          0,
          800,
        );

        mark(
          "07_chat_send",
          streaming && postRes.status() < 400,
          `POST status=${postRes.status()} ct=${ct} firstByte~${streamStartMs}ms`,
        );
        mark(
          "08_stream",
          streaming && streamComplete && !streamInterrupted,
          streamComplete
            ? "stream started and completed with new assistant content"
            : "stream interrupted or no assistant content",
          { streaming, streamComplete, streamInterrupted, sample: assistantText.slice(0, 200) },
        );
        mark(
          "perf_first_token",
          typeof streamStartMs === "number" && streamStartMs < 5000,
          `${streamStartMs}ms (budget 5000ms soft)`,
          { ms: streamStartMs, budgetMs: 5000, soft: true },
        );
      }
    }

    await page.screenshot({ path: join(SHOTS, "03-chat.png"), fullPage: false });

    // 9. Console / network critical failures
    // IPI-967: Use classifier for console error classification
    const blockingConsole = consoleLog.errors.filter((e) => classifyConsoleError(e));
    
    // IPI-967: Use classifier for network response classification
    const info503Count = countInfo503Responses(networkLog);
    
    const criticalFailed = networkLog.filter((n) => {
      const classification = classifyNetworkResponse(n, info503Count, "auth");
      return classification === "critical";
    });
    mark(
      "09_console_network",
      blockingConsole.length === 0 && criticalFailed.length === 0,
      `blockingConsole=${blockingConsole.length} criticalFailedApis=${criticalFailed.length} warnings=${consoleLog.warnings.length}`,
      {
        blockingConsole: blockingConsole.slice(0, 20),
        criticalFailed: criticalFailed.slice(0, 20),
      },
    );

    // 12. Sign out through UI — probe for control
    const signOutCandidates = [
      page.getByRole("button", { name: /sign out|log out|logout/i }),
      page.getByRole("link", { name: /sign out|log out|logout/i }),
      page.getByText(/sign out|log out/i),
    ];
    let uiSignOut = false;
    let signoutStatus = null;
    let signoutLocation = null;
    let signoutSetCookie = false;
    let signoutRequestObserved = false;
    let signoutCandidatesProbed = 0;
    let sbCookiesBefore = 0;
    let sbCookiesAfter = 0;
    let sbCookieNamesAfter = [];
    for (const loc of signOutCandidates) {
      if (await loc.first().isVisible().catch(() => false)) {
        // IPI-915: register the response listener BEFORE the click so the logout
        // POST cannot be missed, then wait for the response BEFORE any page
        // navigation — a goto issued right after the click aborts the in-flight
        // fetch, the Set-Cookie session deletions never reach the browser, and
        // the anonymous /info check below then sees 200 instead of 401 (CI flake).
        sbCookiesBefore = (await context.cookies()).filter((c) => c.name.startsWith("sb-")).length;
        const signoutResponsePromise = page
          .waitForResponse(
            (res) => res.request().method() === "POST" && res.url().includes("/auth/signout"),
            { timeout: 15000 },
          )
          .catch(() => null);
        await loc.first().click();
        const signoutResponse = await signoutResponsePromise;
        signoutCandidatesProbed++;
        if (!signoutResponse) {
          // CodeRabbit: a visible control may not fire a logout request (e.g.
          // decorative "sign out" text or an inert element). Do not declare a
          // successful click — try the next candidate instead.
          continue;
        }
        // Only mark UI sign-out success after POST /auth/signout is observed.
        uiSignOut = true;
        signoutRequestObserved = true;
        signoutStatus = signoutResponse.status();
        signoutLocation = signoutResponse.headers()["location"] ?? null;
        // CodeRabbit: Response.headers() intentionally omits Set-Cookie —
        // read it via headerValues() to actually detect the deletion header.
        signoutSetCookie = (await signoutResponse.headerValues("set-cookie")).length > 0;
        // Cookie poll runs once after /login navigation (authoritative).
        break;
      }
    }
    // Codex P2: uiSignOut is only set after a /auth/signout response, so the
    // "clicked but no request" branch was unreachable. Use probe count instead.
    mark(
      "12_signout_ui",
      uiSignOut && signoutRequestObserved,
      uiSignOut && signoutRequestObserved
        ? "clicked Sign out control; /auth/signout request observed"
        : signoutCandidatesProbed > 0
          ? `visible Sign out / Log out control clicked but NO /auth/signout request fired (probed ${signoutCandidatesProbed} candidate(s)) — session left intact; anonymous checks below will fail`
          : "NO Sign out / Log out control in operator UI — product gap; using cookie clear for anonymous check",
    );

    // 13. Anonymous /info 401 (session clear if no UI)
    if (!uiSignOut) {
      await context.clearCookies();
      await page.evaluate(() => {
        try {
          localStorage.clear();
          sessionStorage.clear();
        } catch {
          /* */
        }
      });
    }
    // The app navigates to /login itself once the logout POST completes
    // (window.location.assign on the 303) — wait for that navigation instead of
    // racing it: a competing goto aborts the app's own navigation (ERR_ABORTED)
    // and, pre-fix, aborted the in-flight logout POST entirely.
    await page.waitForURL(/\/login/, { timeout: 20000 }).catch(() => null);
    if (!page.url().includes("/login")) {
      await withTransientRetry("post-logout navigate", () =>
        page.goto(`${PREVIEW}/login`, { waitUntil: "domcontentloaded", timeout: 45000 }),
      );
    }
    // CodeRabbit P1: authoritative cookie check. The app only navigated to
    // /login after the logout POST completed, so the Set-Cookie deletion
    // headers have been processed by now — no race with the early poll above.
    const finalDeadline = Date.now() + 2000;
    do {
      sbCookieNamesAfter = (await context.cookies())
        .filter((c) => c.name.startsWith("sb-"))
        .map((c) => c.name);
      if (sbCookieNamesAfter.length === 0) break;
      await new Promise((r) => setTimeout(r, 100));
    } while (Date.now() < finalDeadline);
    sbCookiesAfter = sbCookieNamesAfter.length;
    const anonInfo = await page.evaluate(async (base) => {
      const r = await fetch(`${base}/api/copilotkit/info`, {
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      return { status: r.status, text: (await r.text()).slice(0, 200) };
    }, PREVIEW);
    mark(
      "13_anon_info_401",
      anonInfo.status === 401,
      `status=${anonInfo.status}`,
      { status: anonInfo.status },
    );
    if (uiSignOut) {
      // Documented success only: exactly 303 → PREVIEW-origin /login without signoutError.
      // Failed remote revoke is 303 → /app?signoutError=1; other 3xx / off-origin must fail.
      const signoutRedirectToLogin = isPreviewSignoutSuccessRedirect(
        signoutStatus,
        signoutLocation,
        PREVIEW,
      );
      mark(
        "13c_signout_request",
        signoutStatus !== null && signoutRedirectToLogin,
        signoutStatus === null
          ? "NO POST /auth/signout response within 15s — logout request never completed"
          : `POST /auth/signout -> ${signoutStatus}${signoutLocation ? ` location=${signoutLocation}` : " (no Location)"} — requires 303 redirect to PREVIEW /login without signoutError`,
        {
          status: signoutStatus,
          location: signoutLocation,
          redirect_to_login: signoutRedirectToLogin,
          cookie_deletion_headers_present: signoutSetCookie,
          sb_cookies_before: sbCookiesBefore,
          sb_cookies_after: sbCookiesAfter,
          sb_cookie_names_after: sbCookieNamesAfter,
        },
      );
      mark(
        "13d_sb_cookies_cleared",
        sbCookiesAfter === 0,
        sbCookiesAfter === 0
          ? "no sb-* session cookies remain after sign-out"
          : `sb-* cookies remain: ${sbCookieNamesAfter.join(", ")}`,
        { sb_cookies_before: sbCookiesBefore, sb_cookies_after: sbCookiesAfter },
      );
    }
    await page.screenshot({ path: join(SHOTS, "04-signout.png"), fullPage: false });

    if (uiSignOut) {
      // 13e. Refresh stays logged out — a reload must not resurrect the session
      // (no middleware re-auth, no client-side re-hydration from storage).
      try {
        await page.reload({ waitUntil: "domcontentloaded", timeout: 45000 });
        const anonInfoAfterReload = await page.evaluate(async (base) => {
          const r = await fetch(`${base}/api/copilotkit/info`, {
            credentials: "include",
            headers: { Accept: "application/json" },
          });
          return { status: r.status };
        }, PREVIEW);
        mark(
          "13e_refresh_logged_out",
          anonInfoAfterReload.status === 401,
          `status after reload=${anonInfoAfterReload.status}`,
          { status_after_reload: anonInfoAfterReload.status },
        );
      } catch (e) {
        mark("13e_refresh_logged_out", false, `reload error: ${String(e?.message || e)}`);
      }

      // 13f. Logout is idempotent — a second POST /auth/signout while already
      // logged out must still 303 to PREVIEW /login (not the signoutError → /app → /login
      // chain that redirect:"follow" would disguise as a clean /login landing).
      // Use Playwright's request API with maxRedirects:0 — browser fetch({redirect:"manual"})
      // always yields opaqueredirect (status 0, no Location) and falsely fails this hard AC.
      // Pass origin-scoped headers explicitly: page.request bypasses context.route().
      try {
        const idempotentRes = await page.request.fetch(`${PREVIEW}/auth/signout`, {
          method: "POST",
          maxRedirects: 0,
          ...(extraHTTPHeaders ? { headers: extraHTTPHeaders } : {}),
        });
        const idempotent = {
          status: idempotentRes.status(),
          location: idempotentRes.headers()["location"] ?? null,
        };
        let locationPath = null;
        if (idempotent.location) {
          try {
            locationPath = new URL(idempotent.location, PREVIEW).pathname;
          } catch {
            locationPath = null;
          }
        }
        const redirectToLogin = isPreviewSignoutSuccessRedirect(
          idempotent.status,
          idempotent.location,
          PREVIEW,
        );
        mark(
          "13f_signout_idempotent",
          redirectToLogin,
          `status=${idempotent.status} location=${idempotent.location ?? "none"} path=${locationPath ?? "n/a"}`,
          {
            status: idempotent.status,
            location: idempotent.location,
            location_path: locationPath,
            redirect_to_login: redirectToLogin,
          },
        );
      } catch (e) {
        mark(
          "13f_signout_idempotent",
          false,
          `second signout error: ${String(e?.message || e)}`,
        );
      }

      // Browser storage state after sign-out — evidence only; the anonymous 401
      // contract depends on cookies, so Supabase localStorage session keys are
      // reported here rather than gated as a hard AC.
      const storageAfter = await page.evaluate(() => {
        const keys = Object.keys(localStorage);
        return { keys, supabase_session_keys: keys.filter((k) => k.startsWith("sb-")) };
      });
      criteria["13_anon_info_401"].storage_after_signout = storageAfter;
    }

    // Protected route redirect check (bonus evidence)
    const appRes = await page.goto(`${PREVIEW}/app`, {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });
    const redirectedToLogin =
      page.url().includes("/login") || (appRes && appRes.status() >= 300);
    mark(
      "13b_protected_redirect",
      redirectedToLogin || page.url().includes("/login"),
      `url=${page.url()} status=${appRes?.status()}`,
    );
  } finally {
    await context.close();
    await browser.close();
  }

  if (READONLY) {
    const mutateHits = networkLog.filter((n) => {
      const path = n.path || "";
      const method = (n.method || "").toUpperCase();
      return (
        ["POST", "PUT", "PATCH", "DELETE"].includes(method) &&
        /\/api\/(?:bookings|crm|deals|shoots)/i.test(path)
      );
    });
    if (mutateHits.length > 0) {
      throw new Error(
        `VERIFY_READONLY=1 blocked: saw ${mutateHits.length} mutate API call(s) ` +
          `(e.g. ${mutateHits[0].method} ${mutateHits[0].path})`,
      );
    }
  }

  const finishedAt = new Date().toISOString();
  const region = healthCfRay?.split("-")[1] || "MIA?";
  const targetHost = new URL(PREVIEW).hostname.toLowerCase().replace(/\.$/, "");
  const defaultPreviewHost = new URL(DEFAULT_PREVIEW).hostname.toLowerCase();

  const metadata = {
    task: "IPI-724 · CF-UJ-018 — End-to-End Preview User Journey Validation",
    preview_url: PREVIEW,
    worker:
      targetHost === defaultPreviewHost ? "ipix-operator-preview" : `host:${targetHost}`,
    verify_readonly: READONLY,
    // Repo-relative so artifacts do not embed machine/user absolute paths.
    evidence_out: relative(REPO_ROOT, OUT) || ".",
    ...deploymentIdentity,
    cf_ray_health: healthCfRay,
    region_guess: region,
    browser: { name: "chromium", version: browserVersion },
    playwright_version: playwrightVersion,
    started_at: startedAt,
    finished_at: finishedAt,
    performance: {
      command_center_ms: perf.commandCenterFromLoginMs ?? null,
      command_center_budget_ms: 5000,
      copilot_init_ms: perf.copilotInitMs ?? null,
      copilot_init_budget_ms: 3000,
      first_stream_token_ms: perf.firstStreamTokenMs ?? null,
      first_stream_token_budget_ms: 5000,
      // IPI-968: Granular timing breakdown
      app_response_ms: timing.appResponseMs ?? null,
      user_ready_ms: timing.userReadyMs ?? null,
    },
    ai_health: healthBody,
    adapterAvailable_note:
      "If preview still returns adapterAvailable, Worker predates PR #512 · IPI-510 · CF-UJ-011 — Probe preview AI health via AI_GATEWAY service binding — redeploy HEAD before claiming current.",
    criteria,
    overall_pass: Object.entries(criteria)
      .filter(([k]) => !k.startsWith("perf_") && k !== "13b_protected_redirect")
      .every(([, v]) => v.pass),
    soft_perf_pass: ["perf_command_center", "perf_copilot_init", "perf_first_token"]
      .filter((k) => criteria[k])
      .every((k) => criteria[k].pass),
  };

  // Soft perf failures don't block hard AC — recompute
  const hardKeys = Object.keys(criteria).filter((k) => !k.startsWith("perf_"));
  metadata.hard_ac_pass = hardKeys.every((k) => criteria[k].pass);
  // Sign-out UI is a hard AC — do not special-case it as success.
  metadata.recommendation = metadata.hard_ac_pass
    ? "Done"
    : !criteria["12_signout_ui"]?.pass
      ? "Needs Fix — missing Sign out UI (hard AC; blocked on IPI-725 / PR #519)"
      : "Needs Fix";

  metadata.evidence_policy = {
    har: "disabled (IPI-964) — network-summary.json provides sufficient evidence",
    preferred: "network-summary.json (host/path/method/status/latency/cf-ray only)",
    ignoreHTTPSErrors: false,
  };

  writeEvidence(join(OUT, "metadata.json"), metadata);
  writeEvidence(join(OUT, "console.json"), {
    errors: consoleLog.errors,
    warnings: consoleLog.warnings,
    info_count: consoleLog.info.length,
    blocking_vs_warning_note:
      "Warnings retained; only uncaught/hydration/Worker/pageerror treated as blocking in criteria.09",
  });
  writeEvidence(join(OUT, "network-summary.json"), {
    count: networkLog.length,
    entries: networkLog,
    // IPI-966: Use classifier for network-summary.json critical failures
    // This ensures consistency with the gate semantics in 09_console_network
    info503Count: countInfo503Responses(networkLog),
    critical_failures: networkLog.filter((n) => {
      const classification = classifyNetworkResponse(n, countInfo503Responses(networkLog), "auth");
      return classification === "critical";
    }),
  });

  console.log("\n=== SUMMARY ===");
  console.log(
    JSON.stringify(
      {
        recommendation: metadata.recommendation,
        performance: metadata.performance,
        hard_ac_pass: metadata.hard_ac_pass,
        worker_version_id: metadata.worker_version_id,
      },
      null,
      2,
    ),
  );
  // Exit non-zero whenever any hard acceptance criterion fails (including Sign out UI).
  process.exit(metadata.hard_ac_pass ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  writeFileSync(
    join(OUT, "metadata.json"),
    JSON.stringify({ fatal: String(e?.stack || e), started_at: startedAt }, null, 2),
  );
  process.exit(1);
});
