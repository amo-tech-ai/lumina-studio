/**
 * IPI-924 · AGENT-RAG-001 — "Similar brands" tenant-isolation evidence runner.
 * Real-browser journey against the merged code (localhost dev or preview worker)
 * using the real QA login + remote Supabase. Writes sanitized artifacts only.
 *
 * Usage (from repo root):
 *   node --env-file=app/.env.local e2e/brand-similar-evidence.mjs
 *
 * Env:
 *   BASE_URL       target (default http://localhost:3002)
 *   EVIDENCE_OUT   output dir (default tasks/platform/verify/ipi-924)
 *   VERIFIED_SHA   git revision that the target is expected to serve (required —
 *                  prevents falsely attributing an unknown bundle to a merge)
 *   FOREIGN_FIXTURE  JSON {id, org_id, name} — admin-verified proof that the
 *                  foreign brand exists and is owned by another org (required;
 *                  a bare 404 cannot distinguish "denied" from "does not exist")
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(process.env.EVIDENCE_OUT || join(__dirname, "..", "tasks", "platform", "verify", "ipi-924"));
const BASE = process.env.BASE_URL || "http://localhost:3002";
const VERIFIED_SHA = process.env.VERIFIED_SHA;
const FOREIGN_FIXTURE = process.env.FOREIGN_FIXTURE ? JSON.parse(process.env.FOREIGN_FIXTURE) : null;

const SAME_ORG_BRAND_ID = "f3d6681c-2847-43fd-bfa4-8fe659a62bd7";
const FOREIGN_ORG_BRAND_ID = FOREIGN_FIXTURE?.id || "eec20e68-2adb-472d-8226-3da5d9f34fbe";

const network = [];
const consoleMessages = [];
const results = {};
let error = null;
const started_at = new Date().toISOString();

const recordProbe = (probe, res, body) => {
  network.push({
    probe,
    url: res.url(),
    status: res.status(),
    resourceType: "xhr",
    dataPresent: Array.isArray(body?.data),
    reason: body?.reason ?? null,
  });
};

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

page.on("console", (msg) => {
  if (msg.type() === "error" || msg.type() === "warning") {
    consoleMessages.push({ type: msg.type(), text: msg.text() });
  }
});
page.on("response", (res) => {
  if (res.url().includes("/api/brands/")) {
    network.push({ url: res.url(), status: res.status(), resourceType: res.resourceType() });
  }
});

try {
  if (!VERIFIED_SHA) throw new Error("VERIFIED_SHA not set (revision the target is expected to serve)");
  if (!FOREIGN_FIXTURE?.org_id) throw new Error("FOREIGN_FIXTURE not set ({id, org_id, name} admin-verified)");

  // Login (real QA creds from app/.env.local).
  const password = process.env.QA_PASSWORD;
  if (!password) throw new Error("QA_PASSWORD not set (run with --env-file=app/.env.local)");
  await page.goto(`${BASE}/login`);
  await page.getByRole("heading", { name: "Welcome" }).waitFor({ timeout: 20_000 });
  await page.fill('input[name="email"]', "qa@ipix.test");
  await page.fill('input[name="password"]', password);
  await page.locator('form button[type="submit"]').click();
  await page.waitForURL(/\/app/, { timeout: 15_000 });
  results.login = { ok: true };

  // 1. Same-org brand → expect 200 + data array. "no_embedding" is an observed
  //    (optional) reason, not part of the pass contract: once the brand is
  //    embedded the route returns { data: [...] } without a reason.
  const sameRes = await page.request.get(`${BASE}/api/brands/${SAME_ORG_BRAND_ID}/similar`);
  const sameBody = await sameRes.json().catch(() => null);
  results.same_org_api = {
    status: sameRes.status(),
    hasData: Array.isArray(sameBody?.data),
    reason: sameBody?.reason ?? null,
    pass: sameRes.status() === 200 && Array.isArray(sameBody?.data),
  };
  recordProbe("same_org_api", sameRes, sameBody);

  // 2. Same-org detail page renders (workspace + no secret in payload).
  const pageRes = await page.goto(`${BASE}/app/brand/${SAME_ORG_BRAND_ID}`, { waitUntil: "domcontentloaded" });
  await page.getByTestId("brand-detail-workspace").waitFor({ timeout: 20_000 });
  results.same_org_page = { status: pageRes?.status(), workspace: true };

  // 3. Foreign-org brand → expect 404 (RLS denies, RPC never invoked).
  const foreignRes = await page.request.get(`${BASE}/api/brands/${FOREIGN_ORG_BRAND_ID}/similar`);
  const foreignBody = await foreignRes.json().catch(() => null);
  results.foreign_org_api = {
    status: foreignRes.status(),
    pass: foreignRes.status() === 404,
  };
  recordProbe("foreign_org_api", foreignRes, foreignBody);

  // 4. Foreign-org detail page must never render the workspace. Wait for a
  //    positive settled signal — the server-rendered not-found boundary (a 404
  //    shell may stream as 200 while the RLS lookup resolves, so waiting on the
  //    HTTP status alone is not enough) — before asserting the workspace is
  //    absent. A regression that renders the workspace later (post-hydration)
  //    cannot pass by checking too early.
  await page.goto(`${BASE}/app/brand/${FOREIGN_ORG_BRAND_ID}`, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "Page Not Found" }).waitFor({ timeout: 45_000 });
  const workspaceRendered = await page.getByTestId("brand-detail-workspace").isVisible().catch(() => false);
  results.foreign_org_page = { workspaceRendered };
} catch (err) {
  error = err?.message || String(err);
} finally {
  await browser.close();
}

const completed_at = new Date().toISOString();
const metadata = {
  task: "IPI-924 · AGENT-RAG-001 — Similar brands tenant isolation (post-merge verify)",
  base_url: BASE,
  verified_sha: VERIFIED_SHA,
  sha_note: "Operator-provided revision the target is expected to serve; recorded at capture time.",
  foreign_fixture: FOREIGN_FIXTURE,
  fixture_note: "Admin-verified at capture time: brand exists and is owned by the stated org_id (≠ QA orgs).",
  same_org_brand: SAME_ORG_BRAND_ID,
  foreign_org_brand: FOREIGN_ORG_BRAND_ID,
  playwright_version: (await import("playwright/package.json", { with: { type: "json" } })).default.version,
  started_at,
  completed_at,
  error,
  results,
};

mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, "metadata.json"), JSON.stringify(metadata, null, 2));
writeFileSync(join(OUT, "network-summary.json"), JSON.stringify({ count: network.length, entries: network }, null, 2));
writeFileSync(join(OUT, "console.json"), JSON.stringify(consoleMessages, null, 2));

const pass =
  !error &&
  results.login?.ok &&
  results.same_org_api?.pass &&
  results.same_org_page?.workspace &&
  results.foreign_org_api?.pass &&
  !results.foreign_org_page?.workspaceRendered;

console.log(JSON.stringify(metadata, null, 2));
console.log(`\nEvidence written to ${OUT}`);
console.log(pass ? "PASS: tenant isolation proven in real browser" : "FAIL: see metadata.json");
process.exit(pass ? 0 : 1);
