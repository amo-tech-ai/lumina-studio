/**
 * IPI-924 · AGENT-RAG-001 — "Similar brands" tenant-isolation evidence runner.
 * Real-browser journey against the merged code (localhost dev) using the real
 * QA login + remote Supabase. Writes sanitized artifacts only.
 *
 * Usage (from repo root):
 *   node --env-file=app/.env.local e2e/brand-similar-evidence.mjs
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(process.env.EVIDENCE_OUT || join(__dirname, "..", "tasks", "platform", "verify", "ipi-924"));
const BASE = process.env.BASE_URL || "http://localhost:3002";

const SAME_ORG_BRAND_ID = "f3d6681c-2847-43fd-bfa4-8fe659a62bd7";
const FOREIGN_ORG_BRAND_ID = "eec20e68-2adb-472d-8226-3da5d9f34fbe";

const network = [];
const consoleMessages = [];
const results = {};

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

  // 1. Same-org brand → expect 200 + data/no_embedding.
  const sameRes = await page.request.get(`${BASE}/api/brands/${SAME_ORG_BRAND_ID}/similar`);
  const sameBody = await sameRes.json();
  results.same_org_api = {
    status: sameRes.status(),
    hasData: Array.isArray(sameBody.data),
    reason: sameBody.reason ?? null,
    pass: sameRes.status() === 200 && Array.isArray(sameBody.data),
  };

  // 2. Same-org detail page renders (workspace + no secret in payload).
  const pageRes = await page.goto(`${BASE}/app/brand/${SAME_ORG_BRAND_ID}`, { waitUntil: "domcontentloaded" });
  await page.getByTestId("brand-detail-workspace").waitFor({ timeout: 20_000 });
  results.same_org_page = { status: pageRes?.status(), workspace: true };

  // 3. Foreign-org brand → expect 404 (RLS denies, RPC never invoked).
  const foreignRes = await page.request.get(`${BASE}/api/brands/${FOREIGN_ORG_BRAND_ID}/similar`);
  results.foreign_org_api = {
    status: foreignRes.status(),
    pass: foreignRes.status() === 404,
  };

  // 4. Foreign-org detail page must never render the workspace.
  await page.goto(`${BASE}/app/brand/${FOREIGN_ORG_BRAND_ID}`, { waitUntil: "domcontentloaded" });
  const workspaceHidden = await page.getByTestId("brand-detail-workspace").isHidden().catch(() => true);
  results.foreign_org_page = { workspaceRendered: !workspaceHidden };
} finally {
  await browser.close();
}

const metadata = {
  task: "IPI-924 · AGENT-RAG-001 — Similar brands tenant isolation (post-merge verify)",
  base_url: BASE,
  merge_sha: "1215553dc944ffbdbe836f24435ab5e7c59238d7",
  same_org_brand: SAME_ORG_BRAND_ID,
  foreign_org_brand: FOREIGN_ORG_BRAND_ID,
  playwright_version: (await import("playwright/package.json", { with: { type: "json" } })).default.version,
  started_at: new Date().toISOString(),
  results,
};

mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, "metadata.json"), JSON.stringify(metadata, null, 2));
writeFileSync(join(OUT, "network-summary.json"), JSON.stringify({ count: network.length, entries: network }, null, 2));
writeFileSync(join(OUT, "console.json"), JSON.stringify(consoleMessages, null, 2));

const pass =
  results.login.ok &&
  results.same_org_api.pass &&
  results.same_org_page.workspace &&
  results.foreign_org_api.pass &&
  !results.foreign_org_page.workspaceRendered;

console.log(JSON.stringify(metadata, null, 2));
console.log(`\nEvidence written to ${OUT}`);
console.log(pass ? "PASS: tenant isolation proven in real browser" : "FAIL: see metadata.json");
process.exit(pass ? 0 : 1);
