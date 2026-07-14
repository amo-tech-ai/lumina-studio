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
  brandIds,
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

  // Order matters: crm_companies.brand_id → brands has no ON DELETE action,
  // and brands.org_id → organizations is ON DELETE RESTRICT. Every
  // crm_companies row referencing a probe-created brand (crm_convert_deal's
  // included) must be deleted BEFORE that brand, and every such brand must
  // be deleted BEFORE the org — reversed, both deletes fail and leave
  // dangling test rows on every run.
  if (orgId) {
    for (const table of ["crm_activities", "crm_deals", "crm_contacts", "crm_companies"]) {
      const { error } = await admin.from(table).delete().eq("org_id", orgId);
      if (error) {
        console.warn(`warn: cleanup ${table} for org ${orgId}: ${error.message}`);
      }
    }
  }

  for (const id of [brandId, ...(brandIds ?? [])].filter(Boolean)) {
    const { error: brandDelErr } = await admin.from("brands").delete().eq("id", id);
    if (brandDelErr) {
      console.warn(`warn: cleanup brand ${id}: ${brandDelErr.message}`);
    }
  }

  if (orgId) {
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
let crmConvertBrandIds = [];

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

  // IPI-367 — crm_convert_deal RPC (Won/Lost HITL gate + brand conversion),
  // added 2026-07-12 (Universal-design-prompt-4/tasks/AUDIT/crm-supa-audit.md
  // — this coverage did not exist when the RPC was first shipped). The probe
  // above only proves the trigger via the verify-only helper; this exercises
  // the *production* RPC directly: editor-tier authorization (tightened from
  // is_org_member, which admits role='viewer'), brand create-vs-reuse,
  // domain→brand_url mapping, idempotency, the audit-log write, and the
  // raw-SQL trigger guard independent of RLS.
  if (admin) {
    const { data: convertCompany, error: convertCompanyErr } = await userA.client
      .from("crm_companies")
      .insert({
        org_id: orgAId,
        name: `RLS Convert Co ${stamp}`,
        domain: `convert-${stamp}.example.com`,
      })
      .select("id")
      .single();
    assert(!convertCompanyErr && convertCompany?.id, "user A inserts crm_company for convert probes");

    const { data: convertDeal, error: convertDealErr } = await userA.client
      .from("crm_deals")
      .insert({ org_id: orgAId, company_id: convertCompany.id, stage: "lead" })
      .select("id")
      .single();
    assert(!convertDealErr && convertDeal?.id, "user A inserts crm_deal for convert probes");

    // Direct-SQL trigger guard, independent of RLS — admin (service role)
    // bypasses RLS entirely, so this proves the trigger itself holds, not
    // just the app-level PostgREST policy (IPI-367 Task 4).
    const { error: rawTriggerErr } = await admin
      .from("crm_deals")
      .update({ stage: "won" })
      .eq("id", convertDeal.id);
    assert(!!rawTriggerErr, "raw admin UPDATE to won is blocked by the trigger, not just RLS");

    // Cross-org: user B has no org_members row in org A at all yet.
    const { error: crossConvertErr } = await userB.client.rpc("crm_convert_deal", {
      p_deal_id: convertDeal.id,
      p_decision: "won",
    });
    assert(!!crossConvertErr, "user B (no org membership) cannot call crm_convert_deal on org A's deal");

    // Viewer tier: tightened 2026-07-12 — requires is_org_editor_or_above,
    // not is_org_member (which admits role='viewer').
    const { error: viewerAddErr } = await admin
      .from("org_members")
      .insert({ org_id: orgAId, user_id: userB.user.id, role: "viewer" });
    assert(!viewerAddErr, "admin seeds user B as org A viewer");

    const { error: viewerConvertErr } = await userB.client.rpc("crm_convert_deal", {
      p_deal_id: convertDeal.id,
      p_decision: "won",
    });
    assert(!!viewerConvertErr, "org A viewer cannot call crm_convert_deal (editor-or-above required)");

    const { error: promoteErr } = await admin
      .from("org_members")
      .update({ role: "editor" })
      .eq("org_id", orgAId)
      .eq("user_id", userB.user.id);
    assert(!promoteErr, "admin promotes user B to org A editor");

    const { data: editorConvert, error: editorConvertErr } = await userB.client
      .rpc("crm_convert_deal", { p_deal_id: convertDeal.id, p_decision: "won" })
      .single();
    assert(
      !editorConvertErr && editorConvert?.brand_id,
      "org A editor converts a deal to won, creates a brand",
    );
    if (editorConvert?.brand_id) crmConvertBrandIds.push(editorConvert.brand_id);

    const { data: convertedCompany, error: convertedCompanyErr } = await admin
      .from("crm_companies")
      .select("brand_id")
      .eq("id", convertCompany.id)
      .single();
    assert(
      !convertedCompanyErr && convertedCompany?.brand_id === editorConvert?.brand_id,
      "crm_companies.brand_id linked to the newly created brand",
    );

    const { data: newBrand, error: newBrandErr } = await admin
      .from("brands")
      .select("brand_url")
      .eq("id", editorConvert?.brand_id)
      .single();
    assert(
      !newBrandErr && newBrand?.brand_url === `convert-${stamp}.example.com`,
      "new brand's brand_url copied from crm_companies.domain",
    );

    const { data: convertActivity, error: convertActivityErr } = await admin
      .from("crm_activities")
      .select("id")
      .eq("deal_id", convertDeal.id)
      .eq("type", "note")
      .limit(1);
    assert(
      !convertActivityErr && (convertActivity ?? []).length > 0,
      "crm_convert_deal writes a crm_activities audit row",
    );

    const { error: idempotentErr } = await userB.client.rpc("crm_convert_deal", {
      p_deal_id: convertDeal.id,
      p_decision: "won",
    });
    assert(!!idempotentErr, "converting an already-terminal deal again is rejected");

    // Second deal, same company — proves brand reuse, not a duplicate.
    const { data: convertDeal2, error: convertDeal2Err } = await userA.client
      .from("crm_deals")
      .insert({ org_id: orgAId, company_id: convertCompany.id, stage: "lead" })
      .select("id")
      .single();
    assert(
      !convertDeal2Err && convertDeal2?.id,
      "user A inserts a second crm_deal on the same company",
    );

    const { data: reuseConvert, error: reuseConvertErr } = await userA.client
      .rpc("crm_convert_deal", { p_deal_id: convertDeal2?.id, p_decision: "won" })
      .single();
    assert(
      !reuseConvertErr && reuseConvert?.brand_id === editorConvert?.brand_id,
      "converting a second deal on the same company reuses the existing brand, no duplicate",
    );

    // lost — never touches brands.
    const { data: lostDeal, error: lostDealErr } = await userA.client
      .from("crm_deals")
      .insert({ org_id: orgAId, company_id: convertCompany.id, stage: "lead" })
      .select("id")
      .single();
    assert(!lostDealErr && lostDeal?.id, "user A inserts a crm_deal for the lost-path probe");

    const { data: lostConvert, error: lostConvertErr } = await userA.client
      .rpc("crm_convert_deal", { p_deal_id: lostDeal?.id, p_decision: "lost" })
      .single();
    assert(
      !lostConvertErr && lostConvert?.brand_id === null,
      "converting a deal to lost returns a null brand_id",
    );

    // Cross-org company_id — crm_deals.company_id is a plain FK to
    // crm_companies(id), never constrained to the deal's own org_id, so a
    // deal can legitimately reference a company row that exists but belongs
    // to a different org. Admin crafts this exact anomaly (a real company,
    // wrong org) rather than a merely-nonexistent id, since that's the
    // precise case the RPC's FOUND check has to reject.
    const { data: foreignOrg, error: foreignOrgErr } = await admin
      .from("organizations")
      .insert({ name: `RLS Foreign Org ${stamp}`, slug: `rls-foreign-org-${stamp}`, owner_id: userB.user.id, type: "brand" })
      .select("id")
      .single();
    assert(!foreignOrgErr && foreignOrg?.id, "admin seeds a throwaway foreign org");

    const { data: foreignCompany, error: foreignCompanyErr } = await admin
      .from("crm_companies")
      .insert({ org_id: foreignOrg?.id, name: `RLS Foreign Co ${stamp}` })
      .select("id")
      .single();
    assert(!foreignCompanyErr && foreignCompany?.id, "admin seeds a company in the foreign org");

    const { data: danglingDeal, error: danglingDealErr } = await admin
      .from("crm_deals")
      .insert({ org_id: orgAId, company_id: foreignCompany?.id, stage: "lead" })
      .select("id")
      .single();
    assert(!danglingDealErr && danglingDeal?.id, "admin seeds an org A deal pointing at the foreign company");

    const { error: danglingConvertErr } = await userA.client.rpc("crm_convert_deal", {
      p_deal_id: danglingDeal?.id,
      p_decision: "won",
    });
    assert(
      !!danglingConvertErr,
      "converting a deal whose company_id belongs to a different org is rejected, not silently orphaned",
    );

    // Atomicity — the whole conversion is one transaction, so a rejected
    // convert must leave no trace: no audit row, no brand.
    const { data: danglingActivity } = await admin
      .from("crm_activities")
      .select("id")
      .eq("deal_id", danglingDeal?.id);
    assert(
      (danglingActivity ?? []).length === 0,
      "rejected cross-org won convert writes no crm_activities row",
    );

    const { data: danglingCompanyAfterWon } = await admin
      .from("crm_companies")
      .select("brand_id")
      .eq("id", foreignCompany?.id)
      .single();
    assert(!danglingCompanyAfterWon?.brand_id, "rejected cross-org won convert creates no brand");

    // Same cross-org-company check, 'lost' path — the first fix only ran the
    // FOUND check inside the 'won' branch, so a 'lost' conversion on a
    // dangling company_id still slipped through and wrote a data-isolation-
    // violating crm_activities row (org_id from org A, company_id from the
    // foreign org). Caught by automated PR review; regression-tested here.
    const { data: danglingLostDeal, error: danglingLostDealErr } = await admin
      .from("crm_deals")
      .insert({ org_id: orgAId, company_id: foreignCompany?.id, stage: "lead" })
      .select("id")
      .single();
    assert(
      !danglingLostDealErr && danglingLostDeal?.id,
      "admin seeds a second org A deal pointing at the foreign company (lost-path probe)",
    );

    const { error: danglingLostConvertErr } = await userA.client.rpc("crm_convert_deal", {
      p_deal_id: danglingLostDeal?.id,
      p_decision: "lost",
    });
    assert(
      !!danglingLostConvertErr,
      "marking a deal lost is also rejected when its company_id belongs to a different org",
    );

    const { data: danglingLostActivity } = await admin
      .from("crm_activities")
      .select("id")
      .eq("deal_id", danglingLostDeal?.id);
    assert(
      (danglingLostActivity ?? []).length === 0,
      "rejected cross-org lost convert writes no crm_activities row",
    );

    await admin.from("crm_deals").delete().eq("id", danglingLostDeal?.id);

    // Throwaway org cleanup — not part of orgAId's cascade, so not covered
    // by the standard cleanupRlsTestData() call at the end of the script.
    await admin.from("crm_deals").delete().eq("id", danglingDeal?.id);
    await admin.from("crm_companies").delete().eq("id", foreignCompany?.id);
    if (foreignOrg?.id) {
      await admin.from("org_members").delete().eq("org_id", foreignOrg.id);
      const { error: foreignOrgDelErr } = await admin.from("organizations").delete().eq("id", foreignOrg.id);
      if (foreignOrgDelErr) console.warn(`warn: cleanup foreign org ${foreignOrg.id}: ${foreignOrgDelErr.message}`);
    }

    // Every test below this block assumes user B has zero relationship to
    // org A — undo the viewer→editor membership these probes needed, or
    // every subsequent cross-org assertion in this script (and the script's
    // own later "add user B as org viewer" step) breaks.
    const { error: demoteErr } = await admin
      .from("org_members")
      .delete()
      .eq("org_id", orgAId)
      .eq("user_id", userB.user.id);
    assert(!demoteErr, "cleanup: user B removed from org A after convert probes");
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

    if (assetId) {
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

  // IPI-536 · PR #347 review fix — planner_get_my_assignment RPC probes.
  // assignments_select_org (this file, above) gates SELECT on planner.assignments
  // behind manager+ — a viewer/contributor querying the table directly for their
  // OWN row gets 0 rows back under RLS, not an error (the bug). The RPC exists
  // specifically to answer "what's my own role" without needing manager+.
  const { data: viewerDirectAssign, error: viewerDirectAssignErr } = await plannerB
    .from("assignments")
    .select("id, role")
    .eq("instance_id", instA.id)
    .eq("user_id", userB.user.id);
  assert(
    !viewerDirectAssignErr && (viewerDirectAssign ?? []).length === 0,
    "viewer cannot SELECT their own planner.assignments row directly (assignments_select_org is manager+ only — this is the bug the RPC below fixes)",
  );

  const { data: viewerRpcAssign, error: viewerRpcAssignErr } = await userB.client.rpc(
    "planner_get_my_assignment",
    { p_instance_id: instA.id },
  );
  assert(
    !viewerRpcAssignErr &&
      (viewerRpcAssign ?? []).length === 1 &&
      viewerRpcAssign[0].role === "viewer" &&
      viewerRpcAssign[0].user_id === userB.user.id,
    "viewer CAN read their own row via planner_get_my_assignment RPC (the fix)",
  );

  const { data: viewerRpcNoInstance, error: viewerRpcNoInstanceErr } = await userB.client.rpc(
    "planner_get_my_assignment",
    { p_instance_id: crypto.randomUUID() },
  );
  assert(
    !viewerRpcNoInstanceErr && (viewerRpcNoInstance ?? []).length === 0,
    "planner_get_my_assignment returns empty for an instance the caller has no assignment on (no enumeration leak)",
  );

  // IPI-577 · PLN-S6 — planner_get_member_names RPC probes. listMembers()
  // returns no display name (profiles' SELECT policy is self-row-only), so
  // this RPC resolves names for co-members of a shared instance — but only
  // for a caller who is themselves assigned to it (viewer+).
  const { data: viewerNames, error: viewerNamesErr } = await userB.client.rpc(
    "planner_get_member_names",
    { p_instance_id: instA.id },
  );
  assert(
    !viewerNamesErr &&
      (viewerNames ?? []).length === 2 &&
      new Set((viewerNames ?? []).map((r) => r.user_id)).has(userA.user.id) &&
      new Set((viewerNames ?? []).map((r) => r.user_id)).has(userB.user.id),
    "viewer CAN resolve display names for all co-members via planner_get_member_names (owner + viewer, both rows)",
  );

  const { data: namesNoInstance, error: namesNoInstanceErr } = await userB.client.rpc(
    "planner_get_member_names",
    { p_instance_id: crypto.randomUUID() },
  );
  assert(
    !namesNoInstanceErr && (namesNoInstance ?? []).length === 0,
    "planner_get_member_names returns empty for an instance the caller has no assignment on (no enumeration leak)",
  );

  const { error: anonNamesErr } = await anon.rpc("planner_get_member_names", { p_instance_id: instA.id });
  assert(!!anonNamesErr, "anon cannot call planner_get_member_names (no EXECUTE grant)");

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

  // IPI-575 · PR #387 review (chatgpt-codex-connector) — "Tighten the
  // assignments insert RLS path too": planner_invite_member's SEC-003 gate
  // (manager cannot invite as manager) only guarded the RPC — a manager
  // could bypass it entirely with a direct INSERT into planner.assignments
  // via their own RLS-scoped session, since assignments_insert_manager's
  // with_check had no owner condition on role='manager'. Migration
  // 20260714220000 closes this; probe it directly, not just through the RPC.
  const emailG = `plt002-rls-g-${stamp}@example.com`;
  let userG;
  try {
    assert(!!admin, "service_role admin client required to seed org_members for user G");
    userG = await createTestUser(emailG);
    const { error: orgMemberGErr } = await admin
      .from("org_members")
      .insert({ org_id: orgAId, user_id: userG.user.id, role: "editor" });
    assert(!orgMemberGErr, "seed user G as org A member (service role)");

    const { error: directInsertMgrErr } = await plannerB.from("assignments").insert({
      instance_id: instA.id,
      user_id: userG.user.id,
      role: "manager",
    });
    assert(
      !!directInsertMgrErr,
      "manager cannot bypass SEC-003 via direct INSERT into planner.assignments with role='manager'",
    );

    const { error: directInsertViewerErr } = await plannerB.from("assignments").insert({
      instance_id: instA.id,
      user_id: userG.user.id,
      role: "viewer",
    });
    assert(
      !directInsertViewerErr,
      "manager can still directly INSERT role='viewer' into planner.assignments (unchanged)",
    );
  } finally {
    if (userG?.user?.id) {
      const { error } = await deleteAuthUser(userG.user.id);
      if (error) console.warn(`warn: cleanup user G: ${error.message}`);
      else pass("cleaned up user G (service role)");
    }
  }

  // ── IPI-575 · PLN-DATA-001C — planner member mutation RPC probes ──
  // planner_invite_member / planner_update_role / planner_remove_assignment.
  // At this point: userA = owner on instA, userB = manager on instA (promoted
  // above). Note userB is NOT a valid "not in org" fixture — the earlier CRM/
  // brand-score section of this script already adds userB to org_members(orgA)
  // as an editor (see "user A promotes user B to org editor" above) — a real
  // "not in org" probe needs a dedicated user with zero org_members(orgA) rows.

  const { error: anonInviteErr } = await anon.rpc("planner_invite_member", {
    p_instance_id: instA.id,
    p_email: "nobody@example.com",
    p_role: "viewer",
  });
  assert(!!anonInviteErr, "anon cannot execute planner_invite_member (no EXECUTE grant)");

  const { error: crossOrgInviteErr } = await userB.client.rpc("planner_invite_member", {
    p_instance_id: crypto.randomUUID(),
    p_email: emailB,
    p_role: "viewer",
  });
  assert(
    !!crossOrgInviteErr && crossOrgInviteErr.message.includes("instance_not_found"),
    "invite on a nonexistent/foreign instance fails closed (instance_not_found)",
  );

  const emailF = `plt002-rls-f-${stamp}@example.com`;
  let userF;
  try {
    userF = await createTestUser(emailF); // real account, deliberately NOT added to org_members(orgA)
    const { error: notInOrgErr } = await userA.client.rpc("planner_invite_member", {
      p_instance_id: instA.id,
      p_email: emailF,
      p_role: "viewer",
    });
    assert(
      !!notInOrgErr && notInOrgErr.message.includes("user_not_available"),
      "invite rejects a real email outside the instance's org (user_not_available)",
    );
  } finally {
    if (userF?.user?.id) {
      const { error } = await deleteAuthUser(userF.user.id);
      if (error) console.warn(`warn: cleanup user F: ${error.message}`);
      else pass("cleaned up user F (service role)");
    }
  }

  const { error: ownerRoleErr } = await userA.client.rpc("planner_invite_member", {
    p_instance_id: instA.id,
    p_email: emailB,
    p_role: "owner",
  });
  assert(
    !!ownerRoleErr && ownerRoleErr.message.includes("invalid_role"),
    "invite rejects p_role='owner' (invalid_role)",
  );

  // User D — a genuine org A member (org_members seeded via service role) with
  // no planner assignment yet — drives the successful-invite → duplicate →
  // concurrent-race → role-hierarchy → last-owner flow below.
  const emailD = `plt002-rls-d-${stamp}@example.com`;
  let userD;
  try {
    userD = await createTestUser(emailD);
    assert(!!admin, "service_role admin client required to seed org_members for user D");
    const { error: orgMemberDErr } = await admin
      .from("org_members")
      .insert({ org_id: orgAId, user_id: userD.user.id, role: "editor" });
    assert(!orgMemberDErr, "seed user D as org A member (service role)");

    const { data: invitedD, error: inviteDErr } = await userA.client.rpc("planner_invite_member", {
      p_instance_id: instA.id,
      p_email: emailD,
      p_role: "contributor",
    });
    assert(
      !inviteDErr && (invitedD ?? []).length === 1 && invitedD[0].role === "contributor",
      "owner successfully invites an org-A member by email",
    );

    const { error: dupeErr } = await userA.client.rpc("planner_invite_member", {
      p_instance_id: instA.id,
      p_email: emailD.toUpperCase(), // also exercises email normalization (trim+lower)
      p_role: "viewer",
    });
    assert(
      !!dupeErr && dupeErr.message.includes("already_member"),
      "duplicate invite with a case-varied email is rejected as already_member",
    );

    // Concurrency: two identical invite requests for a fresh user, fired at once —
    // the unique (instance_id, user_id) constraint must let exactly one through.
    const emailE = `plt002-rls-e-${stamp}@example.com`;
    let userE;
    try {
      userE = await createTestUser(emailE);
      const { error: orgMemberEErr } = await admin
        .from("org_members")
        .insert({ org_id: orgAId, user_id: userE.user.id, role: "editor" });
      assert(!orgMemberEErr, "seed user E as org A member (service role)");

      const raceResults = await Promise.all([
        userA.client.rpc("planner_invite_member", {
          p_instance_id: instA.id, p_email: emailE, p_role: "viewer",
        }),
        userA.client.rpc("planner_invite_member", {
          p_instance_id: instA.id, p_email: emailE, p_role: "viewer",
        }),
      ]);
      const raceSuccesses = raceResults.filter((r) => !r.error).length;
      const raceAlreadyMember = raceResults.filter((r) =>
        r.error?.message.includes("already_member"),
      ).length;
      assert(
        raceSuccesses === 1 && raceAlreadyMember === 1,
        "concurrent duplicate invite: exactly one succeeds, the other gets already_member",
      );
    } finally {
      if (userE?.user?.id) {
        await admin.from("org_members").delete().eq("org_id", orgAId).eq("user_id", userE.user.id);
        const { error } = await deleteAuthUser(userE.user.id);
        if (error) console.warn(`warn: cleanup user E: ${error.message}`);
      }
    }

    const { error: mgrOnContribErr } = await userB.client.rpc("planner_update_role", {
      p_instance_id: instA.id, p_target_user_id: userD.user.id, p_new_role: "viewer",
    });
    assert(!mgrOnContribErr, "manager can update a contributor/viewer target's role");

    const { error: mgrOnOwnerErr } = await userB.client.rpc("planner_update_role", {
      p_instance_id: instA.id, p_target_user_id: userA.user.id, p_new_role: "contributor",
    });
    assert(
      !!mgrOnOwnerErr && mgrOnOwnerErr.message.includes("insufficient_role_for_target"),
      "manager cannot touch the owner's assignment (insufficient_role_for_target)",
    );

    const { error: lastOwnerErr } = await userA.client.rpc("planner_remove_assignment", {
      p_instance_id: instA.id, p_target_user_id: userA.user.id,
    });
    assert(
      !!lastOwnerErr && lastOwnerErr.message.includes("last_owner_protected"),
      "removing the last owner is rejected (last_owner_protected)",
    );

    // userD is 'viewer' after the manager-driven update above.
    const { error: viewerInviteErr } = await userD.client.rpc("planner_invite_member", {
      p_instance_id: instA.id, p_email: emailB, p_role: "viewer",
    });
    assert(
      !!viewerInviteErr && viewerInviteErr.message.includes("insufficient_role"),
      "viewer cannot invite members (insufficient_role)",
    );

    const { error: removeDErr } = await userA.client.rpc("planner_remove_assignment", {
      p_instance_id: instA.id, p_target_user_id: userD.user.id,
    });
    assert(!removeDErr, "owner can remove a viewer/contributor-tier member");
  } finally {
    if (userD?.user?.id) {
      await admin.from("org_members").delete().eq("org_id", orgAId).eq("user_id", userD.user.id);
      const { error } = await deleteAuthUser(userD.user.id);
      if (error) console.warn(`warn: cleanup user D: ${error.message}`);
      else pass("cleaned up user D (service role)");
    }
  }

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
    brandIds: crmConvertBrandIds,
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
