#!/usr/bin/env node
/**
 * Smoke test brand-intelligence edge function (remote).
 * Run: npm run supabase:verify-brand-intelligence
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const root = resolve(import.meta.dirname, "..");
const envPath = resolve(root, ".env.local");

if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    const val = trimmed.slice(eq + 1);
    if (!process.env[key]) process.env[key] = val;
  }
}

const url =
  process.env.VITE_SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  process.env.NEXT_SUPABASE_URL;
const anonKey =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.NEXT_SUPABASE_PUBLISHABLE_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const testBrandUrl =
  process.env.BRAND_INTEL_TEST_URL ?? "https://www.glossier.com";

if (!url || !anonKey || !serviceKey) {
  console.error("Missing Supabase env vars");
  process.exit(1);
}

const functionsBase = `${url}/functions/v1`;
let failures = 0;

function fail(msg) {
  console.error(`FAIL: ${msg}`);
  failures += 1;
}

function pass(msg) {
  console.log(`ok: ${msg}`);
}

async function fetchJson(path, init = {}) {
  const res = await fetch(`${functionsBase}${path}`, init);
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { res, json, text };
}

function verifyBrandIntelligenceArtifacts() {
  const indexPath = join(root, "supabase/functions/brand-intelligence/index.ts");
  const handlerPath = join(root, "supabase/functions/brand-intelligence/handler.ts");
  if (!existsSync(indexPath)) {
    fail("missing supabase/functions/brand-intelligence/index.ts");
    return;
  }
  if (!existsSync(handlerPath)) {
    fail("missing supabase/functions/brand-intelligence/handler.ts");
    return;
  }

  const indexSrc = readFileSync(indexPath, "utf8");
  if (indexSrc.includes("handleBrandIntelligenceRequest")) {
    pass("brand-intelligence index delegates to handler");
  } else {
    fail("brand-intelligence index missing handleBrandIntelligenceRequest delegate");
  }

  const src = readFileSync(handlerPath, "utf8");
  const guardsPath = join(root, "supabase/functions/_shared/bi-groq-guards.ts");
  if (!existsSync(guardsPath)) {
    fail("missing _shared/bi-groq-guards.ts");
  } else {
    pass("_shared/bi-groq-guards.ts present");
  }

  if (src.includes("crawlResultId") && src.includes("raw_data")) {
    pass("brand-intelligence loads crawl context");
  } else {
    fail("brand-intelligence missing crawlResultId/raw_data handling");
  }

  if (
    src.includes("generateLlmStructuredContent") &&
    src.includes('scope: "bi"')
  ) {
    pass("brand-intelligence Groq path calls shared LLM with scope bi");
  } else {
    fail("brand-intelligence missing Groq shared LLM scope:bi wiring");
  }

  if (
    src.includes("missingBiProviderConfigError") &&
    src.includes("groqEmptyCrawlError")
  ) {
    pass("brand-intelligence uses shared BI/Groq guard helpers");
  } else {
    fail("brand-intelligence missing bi-groq-guards integration");
  }

  if (src.includes("resolveBiProvider")) {
    pass("brand-intelligence has BI_USE_GEMINI fallback path");
  } else {
    fail("brand-intelligence missing BI_USE_GEMINI fallback (resolveBiProvider)");
  }

  const handlerTest = join(root, "supabase/functions/brand-intelligence/handler.test.ts");
  if (existsSync(handlerTest)) {
    pass("brand-intelligence handler tests present");
  } else {
    fail("missing brand-intelligence/handler.test.ts");
  }

  const dnaHandlerTest = join(root, "supabase/functions/audit-asset-dna/handler.test.ts");
  if (existsSync(dnaHandlerTest)) {
    pass("audit-asset-dna handler tests present");
  } else {
    fail("missing audit-asset-dna/handler.test.ts");
  }

  if (!src.includes("groqChatCompletion")) {
    pass("brand-intelligence does not use removed groqChatCompletion URL fallback");
  } else {
    fail("brand-intelligence still references unused groqChatCompletion");
  }
}

function verifyFirecrawlArtifacts() {
  const geminiShared = join(root, "supabase/functions/_shared/gemini.ts");
  if (existsSync(geminiShared)) {
    pass("_shared/gemini.ts present");
  } else {
    fail("missing _shared/gemini.ts");
  }

  verifyBrandIntelligenceArtifacts();

  const firecrawlShared = join(root, "supabase/functions/_shared/firecrawl.ts");
  if (existsSync(firecrawlShared)) {
    pass("_shared/firecrawl.ts present");
  } else {
    console.log("skip: _shared/firecrawl.ts (IPI-24 not implemented yet)");
  }

  for (const fn of ["start-brand-crawl", "firecrawl-webhook"]) {
    const dir = join(root, "supabase/functions", fn, "index.ts");
    if (existsSync(dir)) {
      pass(`edge function ${fn} present`);
    } else {
      console.log(`skip: ${fn} (IPI-24 not deployed yet)`);
    }
  }

  const migration = join(
    root,
    "supabase/migrations/20260627000000_brand_crawls_job_pages.sql",
  );
  if (existsSync(migration)) {
    pass("brand_crawls migration file on disk");
  } else {
    fail("missing migration 20260627000000_brand_crawls_job_pages.sql");
  }
}

async function verifyBrandCrawlsSchema(admin) {
  const { error } = await admin.from("brand_crawls").select("id").limit(0);
  if (error?.code === "42P01" || error?.message?.includes("does not exist")) {
    console.log("skip: brand_crawls table (migration not pushed yet)");
    return;
  }
  if (error) {
    fail(`brand_crawls probe: ${error.message}`);
    return;
  }
  pass("brand_crawls table exists on remote");

  const { error: pageErr } = await admin
    .from("brand_crawl_results")
    .select("crawl_id, page_url, raw_json, firecrawl_scrape_id")
    .limit(0);
  if (pageErr) {
    fail(`brand_crawl_results page columns: ${pageErr.message}`);
  } else {
    pass("brand_crawl_results page columns queryable");
  }
}

async function main() {
  console.log("brand-intelligence verification\n");

  verifyFirecrawlArtifacts();

  const stamp = Date.now();
  const email = `brand-intel-${stamp}@example.com`;
  const password = "BrandIntelTest123!";

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const userClient = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createError) throw new Error(createError.message);

  const { data: signIn, error: signInError } =
    await userClient.auth.signInWithPassword({ email, password });
  if (signInError || !signIn.session?.access_token) {
    throw new Error(signInError?.message ?? "no session");
  }

  const token = signIn.session.access_token;
  const userId = signIn.user.id;

  const anon = await fetchJson("/brand-intelligence", {
    method: "POST",
    headers: { apikey: anonKey, "Content-Type": "application/json" },
    body: JSON.stringify({ url: testBrandUrl }),
  });
  if (anon.res.status === 401) {
    pass("brand-intelligence rejects anonymous call");
  } else {
    fail(`expected 401 without JWT, got ${anon.res.status}`);
  }

  // IPI-46: edge fn expects an org-scoped brand shell (insert-without-brandId fails RLS)
  const { data: org, error: orgErr } = await userClient
    .from("organizations")
    .insert({
      name: `Brand Intel Org ${stamp}`,
      slug: `brand-intel-org-${stamp}`,
      owner_id: userId,
      type: "brand",
    })
    .select("id")
    .single();
  if (orgErr || !org?.id) {
    throw new Error(orgErr?.message ?? "failed to create test org");
  }

  const shellProfile = {
    industry: "fashion",
    goal: "ecommerce",
    _lifecycle: "brand_created",
  };
  const { data: shellBrand, error: shellErr } = await userClient
    .from("brands")
    .insert({
      name: "Brand Intel Shell",
      brand_url: testBrandUrl,
      user_id: userId,
      org_id: org.id,
      ai_profile: shellProfile,
    })
    .select("id")
    .single();
  if (shellErr || !shellBrand?.id) {
    throw new Error(shellErr?.message ?? "failed to create test brand shell");
  }

  const expectGroq =
    (process.env.AI_PROVIDER ?? "").trim().toLowerCase() === "groq" &&
    !["1", "true", "yes"].includes(
      (process.env.BI_USE_GEMINI ?? "").trim().toLowerCase(),
    );

  // Groq BI requires non-empty crawl text; seed a minimal row for live verify.
  const { error: crawlSeedErr } = await admin.from("brand_crawls").insert({
    brand_id: shellBrand.id,
    job_status: "completed",
    pages_crawled: 2,
    raw_data: {
      pages: [
        {
          markdown: "A".repeat(120),
          metadata: { url: testBrandUrl },
        },
        {
          markdown: "B".repeat(120),
          metadata: { url: `${new URL(testBrandUrl).origin}/about` },
        },
      ],
    },
  });
  if (crawlSeedErr?.code === "42P01") {
    console.log("skip: brand_crawls crawl seed (table not pushed yet)");
  } else if (crawlSeedErr) {
    fail(`brand_crawls seed: ${crawlSeedErr.message}`);
  } else {
    pass("seeded brand_crawls fixture for BI verify");
  }

  const authed = await fetchJson("/brand-intelligence", {
    method: "POST",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url: testBrandUrl,
      brandId: shellBrand.id,
      brand_name: "Brand Intel Shell",
    }),
  });

  if (
    authed.res.status !== 200 ||
    authed.json?.ok !== true ||
    !authed.json?.data?.brandId
  ) {
    fail(
      `brand-intelligence authed → ${authed.res.status} ${authed.text?.slice(0, 300)}`,
    );
  } else {
    const { brandId, logId, scores, provider } = authed.json.data;
    pass(`brand-intelligence brandId=${brandId} logId=${logId} scores=${scores?.length ?? 0}`);

    if (expectGroq) {
      if (provider !== "groq") {
        fail(`expected provider groq post-deploy, got ${provider ?? "undefined"}`);
      } else {
        pass(`brand-intelligence provider=${provider}`);
      }
    } else if (provider) {
      pass(`brand-intelligence provider=${provider}`);
    }
  }

  const brandId = authed.json?.data?.brandId;
  if (brandId) {
    const { data: brand, error: brandErr } = await admin
      .from("brands")
      .select("id, user_id, ai_profile")
      .eq("id", brandId)
      .single();
    if (brandErr || !brand?.ai_profile?.name) {
      fail("brands.ai_profile not populated");
    } else {
      pass(`brands.ai_profile.name=${brand.ai_profile.name}`);
    }

    if (brand?.ai_profile?.industry !== "fashion") {
      fail("brands.ai_profile merge lost shell industry");
    } else {
      pass("brands.ai_profile merge preserved shell industry");
    }

    if (brand?.ai_profile?._lifecycle !== "scores_complete") {
      fail(`expected _lifecycle scores_complete, got ${brand?.ai_profile?._lifecycle}`);
    } else {
      pass("brands.ai_profile._lifecycle=scores_complete");
    }

    const { data: intakeRow } = await admin
      .from("brands")
      .select("intake_status")
      .eq("id", brandId)
      .single();
    if (intakeRow?.intake_status !== "scores_complete") {
      fail(`expected intake_status scores_complete, got ${intakeRow?.intake_status}`);
    } else {
      pass("brands.intake_status=scores_complete");
    }

    const { count, error: scoreErr } = await admin
      .from("brand_scores")
      .select("*", { count: "exact", head: true })
      .eq("brand_id", brandId);
    if (scoreErr || (count ?? 0) < 3) {
      fail(`brand_scores count expected >=3, got ${count}`);
    } else {
      pass(`brand_scores count=${count}`);
    }

    const { data: logRow, error: logErr } = await admin
      .from("ai_agent_logs")
      .select("id, duration_ms, agent_name")
      .eq("id", authed.json.data.logId)
      .single();
    if (logErr || logRow?.agent_name !== "brand-intelligence" || logRow.duration_ms == null) {
      fail("ai_agent_logs row missing duration_ms");
    } else {
      pass(`ai_agent_logs duration_ms=${logRow.duration_ms}`);
    }
  }

  await verifyBrandCrawlsSchema(admin);

  await admin.auth.admin.deleteUser(userId);
  pass("cleaned up test user");

  console.log(failures ? "\nBrand intelligence verification FAILED" : "\nBrand intelligence verification passed");
  process.exit(failures ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
