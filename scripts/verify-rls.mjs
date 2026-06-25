#!/usr/bin/env node
/**
 * PLT-002 RLS smoke test against linked remote Supabase.
 * Creates ephemeral test users, validates row isolation, cleans up when possible.
 *
 * Run: npm run supabase:verify-rls
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
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

if (!url || !anonKey) {
  console.error("Missing VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY");
  process.exit(1);
}

const stamp = Date.now();
const password = "RlsTestPass123!";
const emailA = `plt002-rls-a-${stamp}@example.com`;
const emailB = `plt002-rls-b-${stamp}@example.com`;

let failures = 0;

function fail(message) {
  console.error(`FAIL: ${message}`);
  failures += 1;
}

function pass(message) {
  console.log(`ok: ${message}`);
}

function assert(condition, message) {
  if (condition) pass(message);
  else fail(message);
}

/** Cross-user SELECT deny: fail on query error, then assert zero rows. */
function assertSelectDenied(error, data, message) {
  if (error) {
    fail(`${message} (query error: ${error.message})`);
    return;
  }
  if ((data ?? []).length !== 0) {
    fail(message);
    return;
  }
  pass(message);
}

const anon = createClient(url, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const admin = serviceKey
  ? createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;

async function createTestUser(email) {
  const client = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  if (admin) {
    const { error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (createError) throw new Error(`createUser ${email}: ${createError.message}`);
  } else {
    const { error: signUpError } = await client.auth.signUp({ email, password });
    if (signUpError) throw new Error(`signUp ${email}: ${signUpError.message}`);
  }

  const { data, error: signInError } = await client.auth.signInWithPassword({
    email,
    password,
  });
  if (signInError || !data.session?.user) {
    throw new Error(`signIn ${email}: ${signInError?.message ?? "no session"}`);
  }

  return { client, user: data.session.user, session: data.session };
}

async function deleteAuthUser(userId) {
  if (!admin) return;
  await admin.auth.admin.deleteUser(userId);
}

console.log("PLT-002 RLS verification\n");

// Anonymous: no authenticated policies — expect empty reads, blocked writes
const { data: anonProfiles, error: anonProfilesErr } = await anon
  .from("profiles")
  .select("id")
  .limit(1);
assert(!anonProfilesErr, "anon profiles select does not error");
assert((anonProfiles ?? []).length === 0, "anon cannot read profiles rows");

const { data: anonBrands } = await anon.from("brands").select("id").limit(1);
assert((anonBrands ?? []).length === 0, "anon cannot read brands rows");

const { error: anonBrandInsertErr } = await anon.from("brands").insert({
  name: "anon brand",
  user_id: "00000000-0000-0000-0000-000000000001",
});
assert(!!anonBrandInsertErr, "anon cannot insert brands");

let userA;
let userB;
let brandAId;

try {
  userA = await createTestUser(emailA);
  userB = await createTestUser(emailB);

  // profiles — own read/write
  const { error: profileInsertErr } = await userA.client.from("profiles").insert({
    id: userA.user.id,
    email: emailA,
  });
  assert(!profileInsertErr || profileInsertErr.code === "23505", "user A can insert own profile");

  const { data: ownProfile, error: ownProfileErr } = await userA.client
    .from("profiles")
    .select("id, email")
    .eq("id", userA.user.id)
    .single();
  assert(!ownProfileErr && ownProfile?.email === emailA, "user A reads own profile");

  const { data: otherProfile, error: otherProfileErr } = await userA.client
    .from("profiles")
    .select("id")
    .eq("id", userB.user.id);
  assertSelectDenied(otherProfileErr, otherProfile, "user A cannot read user B profile");

  // org layer — create org for user A (trigger auto-adds owner to org_members)
  const { data: orgA, error: orgInsertErr } = await userA.client
    .from("organizations")
    .insert({ name: `RLS Org A ${stamp}`, slug: `rls-org-a-${stamp}`, owner_id: userA.user.id, type: "brand" })
    .select("id")
    .single();
  assert(!orgInsertErr && orgA?.id, "user A creates own org");
  const orgAId = orgA?.id;

  // brands — org-scoped CRUD, cross-org blocked
  const { data: brandA, error: brandInsertErr } = await userA.client
    .from("brands")
    .insert({ name: `RLS Brand A ${stamp}`, user_id: userA.user.id, org_id: orgAId })
    .select("id")
    .single();
  assert(!brandInsertErr && brandA?.id, "user A inserts own brand");
  brandAId = brandA.id;

  const { data: crossBrandRead, error: crossBrandReadErr } = await userB.client
    .from("brands")
    .select("id")
    .eq("id", brandAId);
  assertSelectDenied(crossBrandReadErr, crossBrandRead, "user B cannot read user A brand");

  const { data: updatedCrossBrand, error: crossBrandUpdateErr } = await userB.client
    .from("brands")
    .update({ name: "hijacked" })
    .eq("id", brandAId)
    .select("id");
  assert(
    !crossBrandUpdateErr && (updatedCrossBrand ?? []).length === 0,
    "user B cannot update user A brand",
  );

  // brand_scores — scoped via brand ownership
  const { error: scoreInsertErr } = await userA.client.from("brand_scores").insert({
    brand_id: brandAId,
    score_type: "dna_readiness",
    score: 42,
  });
  assert(!scoreInsertErr, "user A inserts brand_score for own brand");

  const { data: scoreUpdateData, error: scoreUpdateErr } = await userA.client
    .from("brand_scores")
    .update({ score: 55 })
    .eq("brand_id", brandAId)
    .eq("score_type", "dna_readiness")
    .select("id, score");
  assert(
    !scoreUpdateErr &&
      (scoreUpdateData ?? []).length === 1 &&
      scoreUpdateData[0].score === 55,
    "user A updates own brand_score (upsert path)",
  );

  const { data: crossScores, error: crossScoresErr } = await userB.client
    .from("brand_scores")
    .select("id")
    .eq("brand_id", brandAId);
  assertSelectDenied(crossScoresErr, crossScores, "user B cannot read user A brand_scores");

  const { error: crossScoreInsertErr } = await userB.client.from("brand_scores").insert({
    brand_id: brandAId,
    score_type: "dna_readiness",
    score: 99,
  });
  assert(!!crossScoreInsertErr, "user B cannot insert brand_score on user A brand");

  // IPI-26 — service-role writes; org-member SELECT only
  if (!admin) {
    console.warn("warn: skip IPI-26 table RLS probes (no SUPABASE_SERVICE_ROLE_KEY)");
  } else {
    const { data: socialRow, error: socialAdminErr } = await admin
      .from("brand_social_channels")
      .insert({
        brand_id: brandAId,
        platform: "instagram",
        handle: `@rls-${stamp}`,
      })
      .select("id")
      .single();
    assert(!socialAdminErr && socialRow?.id, "service role inserts brand_social_channels");

    const { data: socialReadA } = await userA.client
      .from("brand_social_channels")
      .select("id")
      .eq("id", socialRow.id);
    assert((socialReadA ?? []).length === 1, "user A reads own org brand_social_channels");

    const { data: socialReadB, error: socialReadBErr } = await userB.client
      .from("brand_social_channels")
      .select("id")
      .eq("id", socialRow.id);
    assertSelectDenied(
      socialReadBErr,
      socialReadB,
      "user B cannot read user A brand_social_channels",
    );

    const { error: socialInsertBErr } = await userB.client
      .from("brand_social_channels")
      .insert({ brand_id: brandAId, platform: "tiktok" });
    assert(!!socialInsertBErr, "user B cannot insert brand_social_channels");

    const { data: compRow, error: compAdminErr } = await admin
      .from("brand_competitors")
      .insert({ brand_id: brandAId, name: `Competitor ${stamp}` })
      .select("id")
      .single();
    assert(!compAdminErr && compRow?.id, "service role inserts brand_competitors");

    const { data: compReadA } = await userA.client
      .from("brand_competitors")
      .select("id")
      .eq("id", compRow.id);
    assert((compReadA ?? []).length === 1, "user A reads own org brand_competitors");

    const { data: compReadB, error: compReadBErr } = await userB.client
      .from("brand_competitors")
      .select("id")
      .eq("id", compRow.id);
    assertSelectDenied(
      compReadBErr,
      compReadB,
      "user B cannot read user A brand_competitors",
    );

    const { data: crawlRow, error: crawlAdminErr } = await admin
      .from("brand_crawl_results")
      .insert({
        brand_id: brandAId,
        firecrawl_job_id: `fc-${stamp}`,
        status: "running",
      })
      .select("id")
      .single();
    assert(!crawlAdminErr && crawlRow?.id, "service role inserts brand_crawl_results");

    const { data: crawlReadA } = await userA.client
      .from("brand_crawl_results")
      .select("id")
      .eq("id", crawlRow.id);
    assert((crawlReadA ?? []).length === 1, "user A reads own org brand_crawl_results");

    const { data: crawlReadB, error: crawlReadBErr } = await userB.client
      .from("brand_crawl_results")
      .select("id")
      .eq("id", crawlRow.id);
    assertSelectDenied(
      crawlReadBErr,
      crawlReadB,
      "user B cannot read user A brand_crawl_results",
    );

    const { data: agentRow, error: agentAdminErr } = await admin
      .from("brand_agent_results")
      .insert({
        brand_id: brandAId,
        agent_name: "rls-test-agent",
        status: "complete",
      })
      .select("id")
      .single();
    assert(!agentAdminErr && agentRow?.id, "service role inserts brand_agent_results");

    const { data: agentReadA } = await userA.client
      .from("brand_agent_results")
      .select("id")
      .eq("id", agentRow.id);
    assert((agentReadA ?? []).length === 1, "user A reads own org brand_agent_results");

    const { data: agentReadB, error: agentReadBErr } = await userB.client
      .from("brand_agent_results")
      .select("id")
      .eq("id", agentRow.id);
    assertSelectDenied(
      agentReadBErr,
      agentReadB,
      "user B cannot read user A brand_agent_results",
    );
  }

  // brand_intake_drafts — owner or org member SELECT (seed via service role)
  if (!admin) {
    console.warn("warn: skip brand_intake_drafts RLS probes (no SUPABASE_SERVICE_ROLE_KEY)");
  } else {
    const { data: draftRow, error: draftAdminErr } = await admin
      .from("brand_intake_drafts")
      .insert({
        user_id: userA.user.id,
        brand_id: brandAId,
        source_url: `https://example.com/${stamp}`,
        status: "pending",
      })
      .select("id")
      .single();
    assert(!draftAdminErr && draftRow?.id, "service role inserts brand_intake_draft for RLS probe");

    const { data: draftReadA, error: draftReadAErr } = await userA.client
      .from("brand_intake_drafts")
      .select("id")
      .eq("id", draftRow.id);
    assert(!draftReadAErr, `user A draft select failed: ${draftReadAErr?.message}`);
    assert((draftReadA ?? []).length === 1, "user A reads own brand_intake_draft");

    const { data: draftReadB, error: draftReadBErr } = await userB.client
      .from("brand_intake_drafts")
      .select("id")
      .eq("id", draftRow.id);
    assertSelectDenied(
      draftReadBErr,
      draftReadB,
      "user B cannot read user A brand_intake_draft",
    );
  }

  // commerce_product_links
  const { data: linkA, error: linkInsertErr } = await userA.client
    .from("commerce_product_links")
    .insert({
      brand_id: brandAId,
      medusa_product_id: `medusa-${stamp}`,
    })
    .select("id")
    .single();
  assert(!linkInsertErr && linkA?.id, "user A inserts commerce_product_link");

  const { data: crossLinks, error: crossLinksErr } = await userB.client
    .from("commerce_product_links")
    .select("id")
    .eq("brand_id", brandAId);
  assertSelectDenied(crossLinksErr, crossLinks, "user B cannot read user A commerce links");

  // ai_agent_logs
  const { data: logA, error: logInsertErr } = await userA.client
    .from("ai_agent_logs")
    .insert({
      user_id: userA.user.id,
      brand_id: brandAId,
      agent_name: "rls-test",
      input: { test: true },
      output: { ok: true },
    })
    .select("id")
    .single();
  assert(!logInsertErr && logA?.id, "user A inserts ai_agent_log");

  const { data: crossLogs, error: crossLogsErr } = await userB.client
    .from("ai_agent_logs")
    .select("id")
    .eq("id", logA.id);
  assertSelectDenied(crossLogsErr, crossLogs, "user B cannot read user A ai_agent_logs");

  // brand_crawls + page-level brand_crawl_results (IPI-24) — skip until migration pushed
  const { error: crawlTableErr } = await userA.client
    .from("brand_crawls")
    .select("id")
    .limit(0);
  if (
    crawlTableErr?.code === "42P01" ||
    crawlTableErr?.message?.includes("does not exist")
  ) {
    console.log("skip: brand_crawls RLS probes (table not on remote yet)");
  } else if (crawlTableErr) {
    fail(`brand_crawls probe: ${crawlTableErr.message}`);
  } else if (admin) {
    const { data: crawlJob, error: crawlInsertErr } = await admin
      .from("brand_crawls")
      .insert({
        brand_id: brandAId,
        source_url: "https://example.com",
        job_status: "queued",
        started_by: userA.user.id,
        request_id: `rls-${stamp}`,
      })
      .select("id")
      .single();
    assert(!crawlInsertErr && crawlJob?.id, "service role seeds brand_crawls job");

    if (crawlJob?.id) {
      const { data: ownCrawls, error: ownCrawlReadErr } = await userA.client
        .from("brand_crawls")
        .select("id, pages_crawled")
        .eq("id", crawlJob.id);
      assert(
        !ownCrawlReadErr && (ownCrawls ?? []).length === 1,
        "user A reads own org brand_crawls job",
      );

      const { data: crossCrawls, error: crossCrawlErr } = await userB.client
        .from("brand_crawls")
        .select("id")
        .eq("id", crawlJob.id);
      assertSelectDenied(
        crossCrawlErr,
        crossCrawls,
        "user B cannot read user A brand_crawls",
      );

      const { error: pageInsertErr } = await admin.from("brand_crawl_results").insert({
        crawl_id: crawlJob.id,
        brand_id: brandAId,
        page_url: "https://example.com/",
        title: "RLS test",
        status_code: 200,
        word_count: 3,
        page_depth: 0,
        markdown: "# test",
        raw_json: { metadata: { scrapeId: `scrape-${stamp}` } },
        firecrawl_scrape_id: `scrape-${stamp}`,
      });
      assert(!pageInsertErr, "service role seeds brand_crawl_results page row");

      const { data: ownPages, error: ownPageErr } = await userA.client
        .from("brand_crawl_results")
        .select("id, page_url")
        .eq("crawl_id", crawlJob.id);
      assert(
        !ownPageErr && (ownPages ?? []).length >= 1,
        "user A reads page rows for own crawl",
      );

      const { data: crossPages, error: crossPageErr } = await userB.client
        .from("brand_crawl_results")
        .select("id")
        .eq("crawl_id", crawlJob.id);
      assertSelectDenied(
        crossPageErr,
        crossPages,
        "user B cannot read user A crawl pages",
      );
    }
  } else {
    console.log("skip: brand_crawls RLS insert probes (no service role)");
  }

  // brand_scores INSERT: editor+ or brand creator; viewers denied
  const { error: viewerMemberErr } = await userA.client.from("org_members").insert({
    org_id: orgAId,
    user_id: userB.user.id,
    role: "viewer",
  });
  assert(!viewerMemberErr, "user A adds user B as org viewer");

  const { error: viewerScoreInsertErr } = await userB.client.from("brand_scores").insert({
    brand_id: brandAId,
    score_type: "visual",
    score: 70,
  });
  assert(!!viewerScoreInsertErr, "org viewer cannot insert brand_score on org brand");

  const { error: viewerUpsertErr } = await userB.client
    .from("brand_scores")
    .upsert(
      { brand_id: brandAId, score_type: "messaging", score: 65 },
      { onConflict: "brand_id,score_type" },
    );
  assert(!!viewerUpsertErr, "org viewer cannot upsert brand_score on org brand");

  const { error: promoteEditorErr } = await userA.client
    .from("org_members")
    .update({ role: "editor" })
    .eq("org_id", orgAId)
    .eq("user_id", userB.user.id);
  assert(!promoteEditorErr, "user A promotes user B to org editor");

  const { error: editorScoreInsertErr } = await userB.client.from("brand_scores").insert({
    brand_id: brandAId,
    score_type: "visual",
    score: 70,
  });
  assert(!editorScoreInsertErr, "org editor inserts brand_score on org brand");

  const { data: editorUpsert, error: editorUpsertErr } = await userB.client
    .from("brand_scores")
    .upsert(
      { brand_id: brandAId, score_type: "visual", score: 72 },
      { onConflict: "brand_id,score_type" },
    )
    .select("id, score");
  assert(
    !editorUpsertErr &&
      (editorUpsert ?? []).length === 1 &&
      editorUpsert[0].score === 72,
    "org editor upserts brand_score on org brand",
  );
} catch (err) {
  fail(err instanceof Error ? err.message : String(err));
} finally {
  if (serviceKey && userA?.user?.id) {
    await deleteAuthUser(userA.user.id);
    pass("cleaned up user A (service role)");
  }
  if (serviceKey && userB?.user?.id) {
    await deleteAuthUser(userB.user.id);
    pass("cleaned up user B (service role)");
  } else if (!serviceKey) {
    console.warn(
      "warn: set SUPABASE_SERVICE_ROLE_KEY in .env.local to auto-delete test users",
    );
  }
}

console.log(`\n${failures === 0 ? "RLS verification passed" : `RLS verification failed (${failures})`}`);
process.exit(failures === 0 ? 0 : 1);
