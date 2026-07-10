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
  if (!admin) return { error: null };
  const { error } = await admin.auth.admin.deleteUser(userId);
  return { error };
}

async function cleanupRlsTestData({
  orgId,
  brandId,
  notificationId,
  crmNotificationId,
  assetId,
  userAId,
  userBId,
}) {
  if (!admin) return;

  for (const id of [notificationId, crmNotificationId].filter(Boolean)) {
    const { error: notifDelErr } = await admin.from("notifications").delete().eq("id", id);
    if (notifDelErr) {
      console.warn(`warn: cleanup notification ${id}: ${notifDelErr.message}`);
    }
  }

  if (assetId) {
    const { error: assetDelErr } = await admin.from("assets").delete().eq("id", assetId);
    if (assetDelErr) {
      console.warn(`warn: cleanup asset ${assetId}: ${assetDelErr.message}`);
    }
  }

  if (brandId) {
    const { error: brandDelErr } = await admin.from("brands").delete().eq("id", brandId);
    if (brandDelErr) {
      console.warn(`warn: cleanup brand ${brandId}: ${brandDelErr.message}`);
    }
  }

  if (orgId) {
    for (const table of ["crm_activities", "crm_deals", "crm_contacts", "crm_companies"]) {
      const { error } = await admin.from(table).delete().eq("org_id", orgId);
      if (error) {
        console.warn(`warn: cleanup ${table} for org ${orgId}: ${error.message}`);
      }
    }
    await admin.from("org_members").delete().eq("org_id", orgId);
    const { error: orgDelErr } = await admin.from("organizations").delete().eq("id", orgId);
    if (orgDelErr) {
      console.warn(`warn: cleanup org ${orgId}: ${orgDelErr.message}`);
    }
  }

  for (const [label, userId] of [
    ["user A", userAId],
    ["user B", userBId],
  ]) {
    if (!userId) continue;
    const { error } = await deleteAuthUser(userId);
    if (error) {
      console.warn(`warn: cleanup ${label} (${userId}): ${error.message}`);
    } else {
      pass(`cleaned up ${label} (service role)`);
    }
  }
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

// Global reference tables (MI-01): authenticated read-only, no anon policy.
const refTables = ["platforms", "image_type_defs", "image_specs", "recommendation_rules"];
for (const t of refTables) {
  const { data } = await anon.from(t).select("id").limit(1);
  assert((data ?? []).length === 0, `anon cannot read ${t} rows`);
}

let userA;
let userB;
let brandAId;
let orgAId;
let notificationId;
let crmNotificationId;
let assetId;

try {
  userA = await createTestUser(emailA);
  userB = await createTestUser(emailB);

  // Global reference tables (MI-01): authenticated reads seeded rows, writes denied.
  for (const t of refTables) {
    const { data, error } = await userA.client.from(t).select("id").limit(1);
    assert(!error && (data ?? []).length >= 1, `authenticated reads ${t} seed rows`);
  }
  const { error: refInsertErr } = await userA.client
    .from("platforms")
    .insert({ slug: "rls-probe", name: "RLS Probe", category: "social" });
  assert(!!refInsertErr, "authenticated cannot insert platforms (no write policy)");

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
  orgAId = orgA?.id;

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

  // crm_* — org-scoped CRUD, cross-org blocked, terminal stage guard (IPI-362)
  const { data: crmCompany, error: crmCompanyErr } = await userA.client
    .from("crm_companies")
    .insert({ org_id: orgAId, name: `RLS CRM Co ${stamp}` })
    .select("id")
    .single();
  assert(!crmCompanyErr && crmCompany?.id, "user A inserts crm_company in own org");

  const { data: crossCrmCompany, error: crossCrmCompanyErr } = await userB.client
    .from("crm_companies")
    .select("id")
    .eq("id", crmCompany.id);
  assertSelectDenied(
    crossCrmCompanyErr,
    crossCrmCompany,
    "user B cannot read user A crm_company",
  );

  const { data: crmContact, error: crmContactErr } = await userA.client
    .from("crm_contacts")
    .insert({
      org_id: orgAId,
      company_id: crmCompany.id,
      name: `RLS Contact ${stamp}`,
    })
    .select("id")
    .single();
  assert(!crmContactErr && crmContact?.id, "user A inserts crm_contact in own org");

  const { data: crmDeal, error: crmDealErr } = await userA.client
    .from("crm_deals")
    .insert({
      org_id: orgAId,
      company_id: crmCompany.id,
      stage: "lead",
    })
    .select("id")
    .single();
  assert(!crmDealErr && crmDeal?.id, "user A inserts crm_deal (lead stage)");

  const { error: crmDealWonInsertErr } = await userA.client.from("crm_deals").insert({
    org_id: orgAId,
    company_id: crmCompany.id,
    stage: "won",
  });
  assert(!!crmDealWonInsertErr, "user A cannot insert crm_deal with stage=won without convert flag");

  const { error: crmDealWonUpdateErr } = await userA.client
    .from("crm_deals")
    .update({ stage: "won" })
    .eq("id", crmDeal.id)
    .select("id");
  assert(!!crmDealWonUpdateErr, "user A cannot update crm_deal to won without convert flag");

  if (admin && crmDeal?.id) {
    const { error: convertProbeErr } = await admin.rpc("crm_deals_verify_convert_stage", {
      p_deal_id: crmDeal.id,
      p_stage: "won",
    });
    assert(!convertProbeErr, "crm_deal stage=won succeeds with app.crm_convert flag");

    const { data: wonDeal, error: wonDealErr } = await userA.client
      .from("crm_deals")
      .select("stage")
      .eq("id", crmDeal.id)
      .single();
    assert(!wonDealErr && wonDeal?.stage === "won", "user A reads crm_deal after convert probe");
  }

  const { data: crmActivity, error: crmActivityErr } = await userA.client
    .from("crm_activities")
    .insert({
      org_id: orgAId,
      deal_id: crmDeal.id,
      type: "note",
      body: "RLS probe",
    })
    .select("id")
    .single();
  assert(!crmActivityErr && crmActivity?.id, "user A inserts crm_activity anchored to deal");

  const { data: crossCrmDeal, error: crossCrmDealErr } = await userB.client
    .from("crm_deals")
    .select("id")
    .eq("id", crmDeal.id);
  assertSelectDenied(crossCrmDealErr, crossCrmDeal, "user B cannot read user A crm_deal");

  const { data: crossCrmDealUpdate, error: crossCrmDealUpdateErr } = await userB.client
    .from("crm_deals")
    .update({ stage: "qualified" })
    .eq("id", crmDeal.id)
    .select("id");
  assert(
    !crossCrmDealUpdateErr && (crossCrmDealUpdate ?? []).length === 0,
    "user B cannot update user A crm_deal",
  );

  const { data: crossCrmActivity, error: crossCrmActivityErr } = await userB.client
    .from("crm_activities")
    .select("id")
    .eq("deal_id", crmDeal.id)
    .limit(1);
  assertSelectDenied(
    crossCrmActivityErr,
    crossCrmActivity,
    "user B cannot read user A crm_activity",
  );

  const { error: crossCrmCompanyInsertErr } = await userB.client.from("crm_companies").insert({
    org_id: orgAId,
    name: `RLS hijack co ${stamp}`,
  });
  assert(!!crossCrmCompanyInsertErr, "user B cannot insert crm_company into user A org");

  const { error: crossCrmContactInsertErr } = await userB.client.from("crm_contacts").insert({
    org_id: orgAId,
    company_id: crmCompany.id,
    name: `RLS hijack contact ${stamp}`,
  });
  assert(!!crossCrmContactInsertErr, "user B cannot insert crm_contact into user A org");

  const { error: crossCrmDealInsertErr } = await userB.client.from("crm_deals").insert({
    org_id: orgAId,
    company_id: crmCompany.id,
    stage: "lead",
  });
  assert(!!crossCrmDealInsertErr, "user B cannot insert crm_deal into user A org");

  const { error: crossCrmActivityInsertErr } = await userB.client.from("crm_activities").insert({
    org_id: orgAId,
    deal_id: crmDeal.id,
    type: "note",
    body: "hijack",
  });
  assert(!!crossCrmActivityInsertErr, "user B cannot insert crm_activity into user A org");

  const { data: crossCrmActivityDelete, error: crossCrmActivityDeleteErr } = await userB.client
    .from("crm_activities")
    .delete()
    .eq("id", crmActivity.id)
    .select("id");
  assert(
    !crossCrmActivityDeleteErr && (crossCrmActivityDelete ?? []).length === 0,
    "user B cannot delete user A crm_activity",
  );

  const { data: crossCrmDealDelete, error: crossCrmDealDeleteErr } = await userB.client
    .from("crm_deals")
    .delete()
    .eq("id", crmDeal.id)
    .select("id");
  assert(
    !crossCrmDealDeleteErr && (crossCrmDealDelete ?? []).length === 0,
    "user B cannot delete user A crm_deal",
  );

  const { data: crossCrmContactDelete, error: crossCrmContactDeleteErr } = await userB.client
    .from("crm_contacts")
    .delete()
    .eq("id", crmContact.id)
    .select("id");
  assert(
    !crossCrmContactDeleteErr && (crossCrmContactDelete ?? []).length === 0,
    "user B cannot delete user A crm_contact",
  );

  const { data: crossCrmCompanyDelete, error: crossCrmCompanyDeleteErr } = await userB.client
    .from("crm_companies")
    .delete()
    .eq("id", crmCompany.id)
    .select("id");
  assert(
    !crossCrmCompanyDeleteErr && (crossCrmCompanyDelete ?? []).length === 0,
    "user B cannot delete user A crm_company",
  );

  // IPI-362 Task 4 — deal-only notification recipient (crm_deal_id RLS)
  if (admin && crmDeal?.id) {
    const { data: crmNotif, error: crmNotifInsertErr } = await admin
      .from("notifications")
      .insert({
        kind: "deal_stage_changed",
        crm_deal_id: crmDeal.id,
        payload: { deal_id: crmDeal.id, test: true },
      })
      .select("id")
      .single();
    assert(!crmNotifInsertErr && crmNotif?.id, "service role inserts crm_deal notification");
    crmNotificationId = crmNotif.id;

    const { data: ownCrmNotif, error: ownCrmNotifErr } = await userA.client
      .from("notifications")
      .select("id, kind")
      .eq("id", crmNotif.id)
      .single();
    assert(
      !ownCrmNotifErr && ownCrmNotif?.kind === "deal_stage_changed",
      "org member reads notification anchored on own crm_deal",
    );

    const { data: crossCrmNotif, error: crossCrmNotifErr } = await userB.client
      .from("notifications")
      .select("id")
      .eq("id", crmNotif.id);
    assertSelectDenied(
      crossCrmNotifErr,
      crossCrmNotif,
      "user B cannot read user A crm_deal notification",
    );

    const { data: crmDealHijack, error: crmDealHijackErr } = await userA.client
      .from("notifications")
      .update({ crm_deal_id: "00000000-0000-0000-0000-000000000099" })
      .eq("id", crmNotif.id)
      .select("id");
    assert(
      !!crmDealHijackErr || (crmDealHijack ?? []).length === 0,
      "org member cannot reassign notification crm_deal_id",
    );
  }

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

  // IPI-499 — assets_select_via_brand org-awareness. Seed via service role
  // (insert policy stays owner-only by design); B isn't an org member yet at
  // this point in the script — that happens below, near the viewer/editor probes.
  if (!admin) {
    console.warn("warn: skip IPI-499 assets RLS probes (no SUPABASE_SERVICE_ROLE_KEY)");
  } else {
    const { data: assetRow, error: assetAdminErr } = await admin
      .from("assets")
      .insert({
        brand_id: brandAId,
        url: `https://example.com/rls-probe-${stamp}.jpg`,
        asset_type: "image",
        status: "draft",
        dna_pillars: {},
      })
      .select("id")
      .single();
    assert(!assetAdminErr && assetRow?.id, "service role inserts asset for RLS probe");
    assetId = assetRow?.id;

    const { data: assetReadOwner, error: assetReadOwnerErr } = await userA.client
      .from("assets")
      .select("id")
      .eq("id", assetId);
    assert(
      !assetReadOwnerErr && (assetReadOwner ?? []).length === 1,
      "brand owner reads own asset",
    );

    const { data: assetReadNonMember, error: assetReadNonMemberErr } = await userB.client
      .from("assets")
      .select("id")
      .eq("id", assetId);
    assertSelectDenied(
      assetReadNonMemberErr,
      assetReadNonMember,
      "non-org-member cannot read brand asset (pre-membership)",
    );
  }

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

  // IPI-335 · MODEL-FIX — notifications RLS: mark-own-read only, no column
  // reassignment. Must run before user B joins orgA below (org_members insert) —
  // otherwise "cross-user" checks are testing a legitimate member, not an outsider.
  // Uses brand_org_id ownership only (talent/agency-owner paths live in the
  // `talent` schema, not exposed via PostgREST — see IPI-307 notes).
  if (!admin) {
    console.warn("warn: skip notifications RLS probes (no SUPABASE_SERVICE_ROLE_KEY)");
  } else {
    const { data: notifRow, error: notifInsertErr } = await admin
      .from("notifications")
      .insert({ kind: "booking_requested", brand_org_id: orgAId, payload: { test: true } })
      .select("id")
      .single();
    assert(!notifInsertErr && notifRow?.id, "service role inserts notifications row");
    notificationId = notifRow?.id;

    const { data: markRead, error: markReadErr } = await userA.client.rpc(
      "mark_notifications_read",
      { p_notification_ids: [notificationId], p_mark_all: false },
    );
    assert(
      !markReadErr && markRead?.updated_count === 1,
      "org member marks own notification read via RPC",
    );

    const { data: readUpdate, error: readUpdateErr } = await userA.client
      .from("notifications")
      .update({ read: true })
      .eq("id", notificationId)
      .select("id, read");
    assert(
      !!readUpdateErr || (readUpdate ?? []).length === 0,
      "direct notifications.read UPDATE is blocked",
    );

    const { data: hijackAttempt, error: hijackErr } = await userA.client
      .from("notifications")
      .update({ brand_org_id: "00000000-0000-0000-0000-000000000099" })
      .eq("id", notificationId)
      .select("id");
    assert(
      !!hijackErr || (hijackAttempt ?? []).length === 0,
      "org member cannot reassign notification brand_org_id",
    );

    const { data: kindTamper, error: kindTamperErr } = await userA.client
      .from("notifications")
      .update({ kind: "tampered" })
      .eq("id", notificationId)
      .select("id");
    assert(
      !!kindTamperErr || (kindTamper ?? []).length === 0,
      "org member cannot rewrite notification kind",
    );

    const { error: crossMarkErr } = await userB.client.rpc("mark_notifications_read", {
      p_notification_ids: [notificationId],
      p_mark_all: false,
    });
    assert(
      !!crossMarkErr,
      "user B (not yet an org member) cannot mark user A's notification read via RPC",
    );
  }

  // brand_scores INSERT: editor+ or brand creator; viewers denied
  const { error: viewerMemberErr } = await userA.client.from("org_members").insert({
    org_id: orgAId,
    user_id: userB.user.id,
    role: "viewer",
  });
  assert(!viewerMemberErr, "user A adds user B as org viewer");

  // IPI-499 — now that B is an org member (even just viewer), assets_select_via_brand's
  // is_org_member OR-branch should make the same asset from the pre-membership probe
  // above visible. This is the exact bug the migration fixes.
  if (admin && assetId) {
    const { data: assetReadMember, error: assetReadMemberErr } = await userB.client
      .from("assets")
      .select("id")
      .eq("id", assetId);
    assert(
      !assetReadMemberErr && (assetReadMember ?? []).length === 1,
      "org member (viewer role) reads brand asset after joining — IPI-499",
    );
  }

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

  const { data: dnaBeforeViewerUpdate } = await userA.client
    .from("brand_scores")
    .select("score")
    .eq("brand_id", brandAId)
    .eq("score_type", "dna_readiness")
    .maybeSingle();
  assert(dnaBeforeViewerUpdate?.score === 55, "dna_readiness score baseline for viewer update probe");

  await userB.client
    .from("brand_scores")
    .update({ score: 1 })
    .eq("brand_id", brandAId)
    .eq("score_type", "dna_readiness");

  const { data: dnaAfterViewerUpdate } = await userA.client
    .from("brand_scores")
    .select("score")
    .eq("brand_id", brandAId)
    .eq("score_type", "dna_readiness")
    .maybeSingle();
  assert(
    dnaAfterViewerUpdate?.score === 55,
    "org viewer cannot update brand_score on org brand",
  );

  const { data: dnaBeforeViewerDelete } = await userA.client
    .from("brand_scores")
    .select("id")
    .eq("brand_id", brandAId)
    .eq("score_type", "dna_readiness")
    .maybeSingle();
  assert(dnaBeforeViewerDelete?.id, "dna_readiness score exists for viewer delete probe");

  await userB.client
    .from("brand_scores")
    .delete()
    .eq("brand_id", brandAId)
    .eq("score_type", "dna_readiness");

  const { data: dnaAfterViewerDelete } = await userA.client
    .from("brand_scores")
    .select("id")
    .eq("brand_id", brandAId)
    .eq("score_type", "dna_readiness")
    .maybeSingle();
  assert(dnaAfterViewerDelete?.id, "org viewer cannot delete brand_score on org brand");

  const { error: promoteEditorErr } = await userA.client
    .from("org_members")
    .update({ role: "editor" })
    .eq("org_id", orgAId)
    .eq("user_id", userB.user.id);
  assert(!promoteEditorErr, "user A promotes user B to org editor");

  const { data: editorUpdate, error: editorUpdateErr } = await userB.client
    .from("brand_scores")
    .update({ score: 60 })
    .eq("brand_id", brandAId)
    .eq("score_type", "dna_readiness")
    .select("score")
    .maybeSingle();
  assert(
    !editorUpdateErr && editorUpdate?.score === 60,
    "org editor updates brand_score on org brand",
  );

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

  const { error: editorDeleteErr } = await userB.client
    .from("brand_scores")
    .delete()
    .eq("brand_id", brandAId)
    .eq("score_type", "visual");
  assert(!editorDeleteErr, "org editor deletes brand_score on org brand");

  const { data: visualAfterEditorDelete } = await userA.client
    .from("brand_scores")
    .select("id")
    .eq("brand_id", brandAId)
    .eq("score_type", "visual")
    .maybeSingle();
  assert(!visualAfterEditorDelete?.id, "org editor delete removed visual score row");

  // ── IPI-476 planner schema RLS probes (fail-closed — no soft skip) ──
  assert(!!admin, "service_role admin client required for planner probes");

  const plannerA = userA.client.schema("planner");
  const plannerB = userB.client.schema("planner");
  const plannerAdmin = admin.schema("planner");

  // service_role can operate on planner tables
  const { data: svcWf, error: svcWfErr } = await plannerAdmin
    .from("workflows")
    .select("id")
    .limit(1);
  assert(!svcWfErr && (svcWf ?? []).length >= 0, "service_role can select planner.workflows");

  // Org A owner creates a workflow (new orgs are not auto-seeded)
  const { data: wfA, error: wfAErr } = await plannerA
    .from("workflows")
    .insert({
      org_id: orgAId,
      name: `RLS Planner WF ${stamp}`,
      category: "production",
      version: 1,
      is_default: false,
    })
    .select("id")
    .single();
  assert(!wfAErr && wfA?.id, "org owner can insert planner.workflows");

  const { data: ownWf, error: ownWfErr } = await plannerA
    .from("workflows")
    .select("id")
    .eq("org_id", orgAId)
    .eq("id", wfA.id);
  assert(!ownWfErr && (ownWf ?? []).length === 1, "org member can select own planner.workflows");

  // Org B owned by user B — cross-org isolation
  const { data: orgB, error: orgBErr } = await userB.client
    .from("organizations")
    .insert({
      name: `RLS Org B Planner ${stamp}`,
      slug: `rls-org-b-planner-${stamp}`,
      owner_id: userB.user.id,
      type: "brand",
    })
    .select("id")
    .single();
  assert(!orgBErr && orgB?.id, "user B creates org B for planner isolation");
  const orgBId = orgB?.id;

  const { data: wfB, error: wfBErr } = await plannerB
    .from("workflows")
    .insert({
      org_id: orgBId,
      name: `RLS Planner WF B ${stamp}`,
      category: "production",
      version: 1,
      is_default: false,
    })
    .select("id")
    .single();
  assert(!wfBErr && wfB?.id, "org B owner can insert planner.workflows");

  const { data: crossWf, error: crossWfErr } = await plannerA
    .from("workflows")
    .select("id")
    .eq("id", wfB.id);
  assertSelectDenied(crossWfErr, crossWf, "org A cannot read org B planner.workflows");

  // Instance + bootstrap owner assignment
  const entityId = crypto.randomUUID();
  const { data: instA, error: instAErr } = await plannerA
    .from("instances")
    .insert({
      org_id: orgAId,
      workflow_id: wfA.id,
      entity_type: "shoot",
      entity_id: entityId,
      name: `RLS Plan ${stamp}`,
      status: "draft",
    })
    .select("id")
    .single();
  assert(!instAErr && instA?.id, "org member can insert planner.instances");

  const { data: ownerAssign, error: ownerAssignErr } = await plannerA
    .from("assignments")
    .select("id, role")
    .eq("instance_id", instA.id)
    .eq("user_id", userA.user.id)
    .maybeSingle();
  // assignments_select is manager+ — owner can read
  assert(
    !ownerAssignErr && ownerAssign?.role === "owner",
    "bootstrap owner assignment created and readable by owner",
  );

  const { data: taskA, error: taskAErr } = await plannerA
    .from("tasks")
    .insert({
      instance_id: instA.id,
      title: `RLS Task ${stamp}`,
      status: "todo",
      priority: "medium",
      sort_order: 0,
    })
    .select("id")
    .single();
  assert(!taskAErr && taskA?.id, "owner/contributor can insert planner.tasks");

  // Owner can update task
  const { error: ownerTaskUpdErr } = await plannerA
    .from("tasks")
    .update({ title: `RLS Task Owner ${stamp}` })
    .eq("id", taskA.id);
  assert(!ownerTaskUpdErr, "owner can update planner.tasks");

  // Assign user B as viewer on the instance (owner may insert manager/contributor/viewer)
  const { error: viewerAssignErr } = await plannerA.from("assignments").insert({
    instance_id: instA.id,
    user_id: userB.user.id,
    role: "viewer",
  });
  assert(!viewerAssignErr, "owner can assign viewer on planner instance");

  const { data: viewerTaskRead, error: viewerTaskReadErr } = await plannerB
    .from("tasks")
    .select("id")
    .eq("id", taskA.id);
  assert(!viewerTaskReadErr && (viewerTaskRead ?? []).length === 1, "viewer can read planner.tasks");

  const { data: viewerBefore, error: viewerBeforeErr } = await plannerA
    .from("tasks")
    .select("title")
    .eq("id", taskA.id)
    .single();
  assert(!viewerBeforeErr && viewerBefore?.title, "owner can read task title before viewer update probe");

  // Prefer counting updated rows: RLS should yield 0 ids, not a silent no-op that
  // looks green when SELECTs fail and both titles are undefined.
  const { data: viewerUpdateRows, error: viewerUpdateErr } = await plannerB
    .from("tasks")
    .update({ title: "viewer-hijack" })
    .eq("id", taskA.id)
    .select("id");
  assert(
    !viewerUpdateErr && (viewerUpdateRows ?? []).length === 0,
    "viewer UPDATE on planner.tasks returns 0 rows under RLS",
  );

  const { data: viewerAfter, error: viewerAfterErr } = await plannerA
    .from("tasks")
    .select("title")
    .eq("id", taskA.id)
    .single();
  assert(!viewerAfterErr && viewerAfter?.title, "owner can read task title after viewer update probe");
  assert(
    viewerAfter.title === viewerBefore.title,
    "viewer cannot mutate planner.tasks (title unchanged)",
  );

  // Promote B to contributor + assign the task
  const { error: contribRoleErr } = await plannerA
    .from("assignments")
    .update({ role: "contributor" })
    .eq("instance_id", instA.id)
    .eq("user_id", userB.user.id);
  assert(!contribRoleErr, "owner can promote assignment to contributor");

  const { error: assignTaskErr } = await plannerA
    .from("tasks")
    .update({ assignee_user_id: userB.user.id })
    .eq("id", taskA.id);
  assert(!assignTaskErr, "owner can set task assignee");

  const { error: contribUpdErr } = await plannerB
    .from("tasks")
    .update({ status: "in_progress" })
    .eq("id", taskA.id);
  assert(!contribUpdErr, "contributor can update assigned planner.tasks");

  // Promote B to manager — can update without being assignee
  const { error: mgrRoleErr } = await plannerA
    .from("assignments")
    .update({ role: "manager" })
    .eq("instance_id", instA.id)
    .eq("user_id", userB.user.id);
  assert(!mgrRoleErr, "owner can promote assignment to manager");

  const { error: clearAssigneeErr } = await plannerA
    .from("tasks")
    .update({ assignee_user_id: null })
    .eq("id", taskA.id);
  assert(!clearAssigneeErr, "owner clears assignee for manager probe");

  const { error: mgrUpdErr } = await plannerB
    .from("tasks")
    .update({ status: "blocked" })
    .eq("id", taskA.id);
  assert(!mgrUpdErr, "manager can update planner.tasks without assignee");

  // User C — no org membership — cannot read planner rows
  const emailC = `plt002-rls-c-${stamp}@example.com`;
  let userC;
  try {
    userC = await createTestUser(emailC);
    const plannerC = userC.client.schema("planner");
    const { data: outsiderWf, error: outsiderWfErr } = await plannerC
      .from("workflows")
      .select("id")
      .eq("id", wfA.id);
    assertSelectDenied(
      outsiderWfErr,
      outsiderWf,
      "non-member cannot read planner.workflows",
    );

    // IPI-499 — a user who is a member of no org at all must never see the asset,
    // even after the org-aware policy shipped (org A membership check must fail closed).
    if (assetId) {
      const { data: outsiderAsset, error: outsiderAssetErr } = await userC.client
        .from("assets")
        .select("id")
        .eq("id", assetId);
      assertSelectDenied(
        outsiderAssetErr,
        outsiderAsset,
        "non-org-member cannot read brand asset — IPI-499",
      );
    }
  } finally {
    if (userC?.user?.id) {
      const { error } = await deleteAuthUser(userC.user.id);
      if (error) console.warn(`warn: cleanup user C: ${error.message}`);
      else pass("cleaned up user C (service role)");
    }
  }

  // Cleanup planner org B (cascade via organizations delete)
  if (orgBId && admin) {
    await admin.from("org_members").delete().eq("org_id", orgBId);
    const { error: orgBDelErr } = await admin.from("organizations").delete().eq("id", orgBId);
    if (orgBDelErr) console.warn(`warn: cleanup org B: ${orgBDelErr.message}`);
  }
} catch (err) {
  fail(err instanceof Error ? err.message : String(err));
} finally {
  await cleanupRlsTestData({
    orgId: orgAId,
    brandId: brandAId,
    notificationId,
    crmNotificationId,
    assetId,
    userAId: userA?.user?.id,
    userBId: userB?.user?.id,
  });
  if (!serviceKey) {
    console.warn(
      "warn: set SUPABASE_SERVICE_ROLE_KEY in .env.local to auto-delete test users",
    );
  }
}

console.log(`\n${failures === 0 ? "RLS verification passed" : `RLS verification failed (${failures})`}`);
process.exit(failures === 0 ? 0 : 1);
