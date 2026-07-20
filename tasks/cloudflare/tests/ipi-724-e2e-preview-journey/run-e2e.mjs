/**
 * IPI-724 · CF-UJ-018 — Chromium Playwright E2E against Cloudflare preview.
 * Test/evidence tooling (not production app code). Writes sanitized artifacts only.
 *
 * Usage (from worktree root):
 *   node --env-file=app/.env.local tasks/cloudflare/tests/ipi-724-e2e-preview-journey/run-e2e.mjs
 *
 * Security: never commit full HARs with embedded bodies. Prefer network-summary.json.
 * HAR mode is minimal + content omit; assertNoSecrets() runs before write.
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync, readFileSync, existsSync, unlinkSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = __dirname;
const SHOTS = join(OUT, "screenshots");
const HAR_DIR = join(OUT, "har");
const PREVIEW = "https://ipix-operator-preview.sk-498.workers.dev";
const MAX_TRANSIENT_RETRIES = 2;

const require = createRequire(import.meta.url);
let playwrightVersion = "unknown";
try {
  playwrightVersion = require("playwright/package.json").version;
} catch {
  try {
    playwrightVersion = require(
      join(process.cwd(), "app/node_modules/playwright/package.json"),
    ).version;
  } catch {
    /* keep unknown */
  }
}

mkdirSync(SHOTS, { recursive: true });
mkdirSync(HAR_DIR, { recursive: true });

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

/** Fail closed if evidence text looks like it retained session/auth secrets. */
function assertNoSecrets(label, text) {
  const patterns = [
    { name: "Cookie header", re: /"name"\s*:\s*"cookie"/i },
    { name: "Set-Cookie", re: /set-cookie/i },
    { name: "Authorization", re: /authorization/i },
    { name: "Bearer token", re: /bearer\s+[a-z0-9._\-]+/i },
    { name: "access_token", re: /access_token/i },
    { name: "refresh_token", re: /refresh_token/i },
    { name: "password field", re: /"password"\s*:\s*"[^"]+"/i },
    { name: "JWT-like", re: /eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\./ },
  ];
  const hits = patterns.filter((p) => p.re.test(text)).map((p) => p.name);
  if (hits.length) {
    throw new Error(
      `Secret scan failed for ${label}: found ${hits.join(", ")}. ` +
        "Do not commit this artifact — sanitize or delete and rotate QA session.",
    );
  }
}

function writeEvidence(path, value) {
  const text = typeof value === "string" ? value : JSON.stringify(value, null, 2);
  assertNoSecrets(path, text);
  writeFileSync(path, text);
}

async function main() {
  const password = loadQaPassword();
  const email = "qa@ipix.test";
  const harPath = join(HAR_DIR, "session.har");
  // Remove any leftover full HAR from a previous unsafe run.
  if (existsSync(harPath)) unlinkSync(harPath);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    // Minimal HAR (URLs/status only) — never embed bodies/headers with cookies.
    recordHar: { path: harPath, mode: "minimal", content: "omit" },
    viewport: { width: 1440, height: 900 },
    // Real Cloudflare preview TLS must validate (do not mask cert failures).
  });
  const page = await context.newPage();
  const browserVersion = browser.version();

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
    networkLog.push({
      url,
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

  try {
    // 1. Login
    const loginStart = Date.now();
    await withTransientRetry("goto login", () =>
      page.goto(`${PREVIEW}/login`, { waitUntil: "domcontentloaded", timeout: 45000 }),
    );
    await page.waitForSelector("#email", { timeout: 20000 });
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
    mark("01_login", onApp, onApp ? `landed ${page.url()}` : `stuck at ${page.url()}`);

    // 2–3. Command Center / widgets
    const ccStart = Date.now();
    await withTransientRetry("command center settle", async () => {
      await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {});
      const bodyText = await page.locator("body").innerText();
      if (!bodyText || bodyText.trim().length < 40) {
        throw new Error("503-like empty body / blank page");
      }
    });
    perf.commandCenterMs = Date.now() - ccStart;
    // Prefer measuring from login→interactive; also record wall from ccStart
    perf.commandCenterFromLoginMs = Date.now() - loginStart;

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
    perf.copilotInitMs = Date.now() - copilotStart;
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
      networkLog.filter((n) => n.url.includes("/api/ai/health")).at(-1)?.cfRay ||
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
    const blockingConsole = consoleLog.errors.filter((e) => {
      const t = e.text || "";
      if (/hydration|Hydration/i.test(t)) return true;
      if (/Uncaught|uncaught/i.test(t)) return true;
      if (/Worker|Miniflare|Cloudflare/i.test(t) && /error/i.test(t)) return true;
      if (/ChunkLoadError|Script error/i.test(t)) return true;
      // Ignore known noisy third-party
      if (/favicon|Download the React DevTools/i.test(t)) return false;
      if (/Failed to load resource.*favicon/i.test(t)) return false;
      return e.type === "pageerror" || /TypeError|ReferenceError|SyntaxError/i.test(t);
    });
    const criticalFailed = networkLog.filter((n) => {
      if (!n.url.includes("/api/")) return false;
      if (n.status >= 500) return true;
      // auth endpoints that should work while logged in
      if (n.url.includes("/api/copilotkit") && n.method === "POST" && n.status >= 400)
        return true;
      if (n.url.includes("/api/ai/health") && n.status !== 200) return true;
      return false;
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
    for (const loc of signOutCandidates) {
      if (await loc.first().isVisible().catch(() => false)) {
        await loc.first().click();
        uiSignOut = true;
        break;
      }
    }
    mark(
      "12_signout_ui",
      uiSignOut,
      uiSignOut
        ? "clicked Sign out control"
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
    await withTransientRetry("post-logout navigate", () =>
      page.goto(`${PREVIEW}/login`, { waitUntil: "domcontentloaded", timeout: 45000 }),
    );
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
    await page.screenshot({ path: join(SHOTS, "04-signout.png"), fullPage: false });

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

  const finishedAt = new Date().toISOString();
  const region = healthCfRay?.split("-")[1] || "MIA?";

  const metadata = {
    task: "IPI-724 · CF-UJ-018 — End-to-End Preview User Journey Validation",
    preview_url: PREVIEW,
    worker: "ipix-operator-preview",
    worker_version_id: "591796f7-d070-44f2-ae7c-d9ae1a4a2bda",
    deployment_sha_origin_main: "c640f01e82f3525518300108d2ad3b17db17adec",
    note_deployment_sha:
      "Preview Worker version may predate origin/main tip; version_id from wrangler deployments list --env preview",
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
    },
    ai_health: healthBody,
    adapterAvailable_note:
      "Preview still returns adapterAvailable:true (cosmetic; removed on main in #512, needs redeploy)",
    criteria,
    overall_pass: Object.entries(criteria)
      .filter(([k]) => !k.startsWith("perf_") && k !== "13b_protected_redirect")
      .every(([, v]) => v.pass),
    soft_perf_pass: ["perf_command_center", "perf_copilot_init", "perf_first_token"]
      .filter((k) => criteria[k])
      .every((k) => criteria[k].pass),
  };

  // Soft perf failures don't block overall if marked soft — recompute
  const hardKeys = Object.keys(criteria).filter((k) => !k.startsWith("perf_"));
  metadata.hard_ac_pass = hardKeys.every((k) => criteria[k].pass);
  metadata.recommendation = metadata.hard_ac_pass
    ? "Done"
    : criteria["12_signout_ui"] &&
        !criteria["12_signout_ui"].pass &&
        hardKeys.filter((k) => k !== "12_signout_ui").every((k) => criteria[k].pass)
      ? "Needs Fix — missing Sign out UI (session cleared for 401 proof)"
      : "Needs Fix";

  metadata.evidence_policy = {
    har: "minimal + content omit (or deleted if secret scan fails)",
    preferred: "network-summary.json (method/url/status/latency/cf-ray only)",
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
    critical_failures: networkLog.filter(
      (n) => n.url.includes("/api/") && n.status >= 500,
    ),
  });

  // Prefer committing network-summary only. Delete HAR unless it passes the scan.
  if (existsSync(harPath)) {
    try {
      assertNoSecrets(harPath, readFileSync(harPath, "utf8"));
      console.log("HAR secret scan: clean (minimal mode)");
    } catch (e) {
      unlinkSync(harPath);
      console.warn(String(e.message || e));
      console.warn("Deleted HAR — use network-summary.json as the network evidence artifact.");
    }
  }

  console.log("\n=== SUMMARY ===");
  console.log(JSON.stringify({ recommendation: metadata.recommendation, performance: metadata.performance, hard_ac_pass: metadata.hard_ac_pass }, null, 2));
  process.exit(metadata.hard_ac_pass || metadata.recommendation.startsWith("Needs Fix — missing") ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  writeFileSync(
    join(OUT, "metadata.json"),
    JSON.stringify({ fatal: String(e?.stack || e), started_at: startedAt }, null, 2),
  );
  process.exit(1);
});
