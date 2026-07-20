#!/usr/bin/env node
/**
 * PLT-002 RLS smoke test against linked remote Supabase.
 * Creates ephemeral test users, validates row isolation, cleans up when possible.
 *
 * Run: npm run supabase:verify-rls
 */
import { readFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const requireFromApp = createRequire(resolve(import.meta.dirname, "../app/package.json"));

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
const requireServiceRole =
  process.env.REQUIRE_SERVICE_ROLE === "1" ||
  process.env.REQUIRE_SERVICE_ROLE === "true";

if (!url || !anonKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY (or VITE_* aliases)");
  process.exit(1);
}

// IPI-668 — trusted CI must never soft-skip service-role probes.
if (requireServiceRole && !serviceKey) {
  console.error(
    "REQUIRE_SERVICE_ROLE=1 but SUPABASE_SERVICE_ROLE_KEY is missing — refuse to run",
  );
  process.exit(1);
}

const stamp = Date.now();
const password = "RlsTestPass123!";
const emailA = `plt002-rls-a-${stamp}@example.com`;
const emailB = `plt002-rls-b-${stamp}@example.com`;

let failures = 0;
let cleanupFailures = 0;

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

/** Count cleanup errors so CI cannot stay green with leftover fixtures. */
function trackCleanupError(message) {
  cleanupFailures += 1;
  console.warn(`warn: cleanup ${message}`);
}

/** Await a Supabase delete/update and count any error (never ignore cleanup failures). */
async function checkedCleanup(label, query) {
  const { error } = await query;
  if (error) trackCleanupError(`${label}: ${error.message}`);
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

/**
 * IPI-647 — catalog assert: SELECT policies must require is_at_least (assignment).
 * Uses direct Postgres when SUPABASE_DB_URL / DATABASE_URL is set (never service_role JWT).
 */
async function assertPlannerAssignmentSelectCatalog() {
  const dbUrl = process.env.SUPABASE_DB_URL ?? process.env.DATABASE_URL;
  if (!dbUrl) {
    // CI verify-rls often has service_role JWT but no direct Postgres URL.
    // Behavioral JWT matrix below remains mandatory; catalog is best-effort.
    console.warn(
      "warn: IPI-647 catalog assert skipped — SUPABASE_DB_URL/DATABASE_URL unset (JWT matrix still required)",
    );
    return;
  }

  let Client;
  try {
    ({ Client } = requireFromApp("pg"));
  } catch (err) {
    fail(`IPI-647 catalog assert: cannot load pg (${err instanceof Error ? err.message : err})`);
    return;
  }

  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    const { rows } = await client.query(`
      select tablename, policyname, permissive, coalesce(roles::text, '') as roles, qual
      from pg_policies
      where schemaname = 'planner'
        and tablename in ('instances', 'tasks', 'dependencies')
        and cmd = 'SELECT'
      order by tablename, policyname
    `);

    const expected = {
      instances: "instances_select_org",
      tasks: "tasks_select_org",
      dependencies: "dependencies_select_org",
    };

    for (const [table, policy] of Object.entries(expected)) {
      const matches = rows.filter((r) => r.tablename === table);
      assert(
        matches.length === 1 && matches[0].policyname === policy,
        `IPI-647 catalog: exactly one SELECT policy ${policy} on planner.${table}`,
      );
      const row = matches[0];
      if (!row) continue;
      assert(row.permissive === "PERMISSIVE", `IPI-647 catalog: ${policy} is PERMISSIVE`);
      assert(
        String(row.qual ?? "").includes("is_at_least"),
        `IPI-647 catalog: ${policy} qual requires is_at_least (assignment)`,
      );
      assert(
        String(row.qual ?? "").includes("is_org_member"),
        `IPI-647 catalog: ${policy} qual requires is_org_member`,
      );
      // Org-only path would be qual that has is_org_member but not is_at_least — already covered.
    }

    assert(
      !rows.some(
        (r) =>
          String(r.qual ?? "").includes("is_org_member") &&
          !String(r.qual ?? "").includes("is_at_least"),
      ),
      "IPI-647 catalog: no permissive org-only SELECT path remains on instances/tasks/dependencies",
    );

    const { rows: volRows } = await client.query(`
      select p.provolatile
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'planner'
        and p.proname = 'is_at_least'
        and pg_get_function_identity_arguments(p.oid) = 'p_instance_id uuid, p_min_role text'
    `);
    assert(
      volRows[0]?.provolatile === "v",
      "IPI-647 catalog: planner.is_at_least is VOLATILE (INSERT...RETURNING + bootstrap assignment)",
    );

    const { rows: trigRows } = await client.query(`
      select t.tgtype & 2 = 2 as is_before
      from pg_trigger t
      join pg_class c on c.oid = t.tgrelid
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'planner'
        and c.relname = 'instances'
        and t.tgname = 'instances_bootstrap_owner'
        and not t.tgisinternal
    `);
    assert(
      trigRows[0]?.is_before === true,
      "IPI-647 catalog: instances_bootstrap_owner is BEFORE INSERT",
    );

    const { rows: fkRows } = await client.query(`
      select condeferrable, condeferred
      from pg_constraint
      where conname = 'assignments_instance_id_fkey'
        and conrelid = 'planner.assignments'::regclass
    `);
    assert(
      fkRows[0]?.condeferrable === true && fkRows[0]?.condeferred === true,
      "IPI-647 catalog: assignments_instance_id_fkey is DEFERRABLE INITIALLY DEFERRED",
    );
  } catch (err) {
    fail(`IPI-647 catalog assert query failed: ${err instanceof Error ? err.message : err}`);
  } finally {
    await client.end().catch(() => {});
  }
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
  if (!admin) {
    if (requireServiceRole) {
      trackCleanupError("skipped — no service-role admin client");
    }
    return;
  }

  for (const id of [notificationId, crmNotificationId].filter(Boolean)) {
    await checkedCleanup(
      `notification ${id}`,
      admin.from("notifications").delete().eq("id", id),
    );
  }

  if (assetId) {
    await checkedCleanup(`asset ${assetId}`, admin.from("assets").delete().eq("id", assetId));
  }

  // Order matters: crm_companies.brand_id → brands has no ON DELETE action,
  // and brands.org_id → organizations is ON DELETE RESTRICT. Every
  // crm_companies row referencing a probe-created brand (crm_convert_deal's
  // included) must be deleted BEFORE that brand, and every such brand must
  // be deleted BEFORE the org — reversed, both deletes fail and leave
  // dangling test rows on every run.
  if (orgId) {
    for (const table of ["crm_activities", "crm_deals", "crm_contacts", "crm_companies"]) {
      await checkedCleanup(
        `${table} for org ${orgId}`,
        admin.from(table).delete().eq("org_id", orgId),
      );
    }
  }

  for (const id of [brandId, ...(brandIds ?? [])].filter(Boolean)) {
    await checkedCleanup(`brand ${id}`, admin.from("brands").delete().eq("id", id));
  }

  if (orgId) {
    await checkedCleanup(
      `org_members for org ${orgId}`,
      admin.from("org_members").delete().eq("org_id", orgId),
    );
    await checkedCleanup(
      `org ${orgId}`,
      admin.from("organizations").delete().eq("id", orgId),
    );
  }

  for (const [label, userId] of [
    ["user A", userAId],
    ["user B", userBId],
  ]) {
    if (!userId) continue;
    const { error } = await deleteAuthUser(userId);
    if (error) {
      trackCleanupError(`${label} (${userId}): ${error.message}`);
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

  // IPI-729: crm_convert_deal inserts crm_activities.created_by → profiles(id).
  // User B later converts as org editor; without a profiles row the RPC fails with FK
  // 23503 on empty/fresh DBs (looks like authz, is actually a missing fixture).
  const { error: profileBInsertErr } = await userB.client.from("profiles").insert({
    id: userB.user.id,
    email: emailB,
  });
  assert(!profileBInsertErr || profileBInsertErr.code === "23505", "user B can insert own profile");

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
    if (editorConvertErr) {
      console.error(`  detail: crm_convert_deal(won): ${editorConvertErr.message}`);
    }
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

    if (danglingLostDeal?.id) {
      await checkedCleanup(
        `dangling lost deal ${danglingLostDeal.id}`,
        admin.from("crm_deals").delete().eq("id", danglingLostDeal.id),
      );
    }

    // Throwaway org cleanup — not part of orgAId's cascade, so not covered
    // by the standard cleanupRlsTestData() call at the end of the script.
    if (danglingDeal?.id) {
      await checkedCleanup(
        `dangling deal ${danglingDeal.id}`,
        admin.from("crm_deals").delete().eq("id", danglingDeal.id),
      );
    }
    if (foreignCompany?.id) {
      await checkedCleanup(
        `foreign company ${foreignCompany.id}`,
        admin.from("crm_companies").delete().eq("id", foreignCompany.id),
      );
    }
    if (foreignOrg?.id) {
      await checkedCleanup(
        `org_members for foreign org ${foreignOrg.id}`,
        admin.from("org_members").delete().eq("org_id", foreignOrg.id),
      );
      await checkedCleanup(
        `foreign org ${foreignOrg.id}`,
        admin.from("organizations").delete().eq("id", foreignOrg.id),
      );
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
    if (requireServiceRole) {
      fail("IPI-499 assets RLS probes require SUPABASE_SERVICE_ROLE_KEY");
    } else {
      console.warn("warn: skip IPI-499 assets RLS probes (no SUPABASE_SERVICE_ROLE_KEY)");
    }
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
    if (requireServiceRole) {
      fail("IPI-26 table RLS probes require SUPABASE_SERVICE_ROLE_KEY");
    } else {
      console.warn("warn: skip IPI-26 table RLS probes (no SUPABASE_SERVICE_ROLE_KEY)");
    }
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
    if (requireServiceRole) {
      fail("brand_intake_drafts RLS probes require SUPABASE_SERVICE_ROLE_KEY");
    } else {
      console.warn("warn: skip brand_intake_drafts RLS probes (no SUPABASE_SERVICE_ROLE_KEY)");
    }
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
  } else if (requireServiceRole) {
    fail("brand_crawls RLS insert probes require SUPABASE_SERVICE_ROLE_KEY");
  } else {
    console.log("skip: brand_crawls RLS insert probes (no service role)");
  }

  // IPI-335 · MODEL-FIX — notifications RLS: mark-own-read only, no column
  // reassignment. Must run before user B joins orgA below (org_members insert) —
  // otherwise "cross-user" checks are testing a legitimate member, not an outsider.
  // Uses brand_org_id ownership only (talent/agency-owner paths live in the
  // `talent` schema, not exposed via PostgREST — see IPI-307 notes).
  if (!admin) {
    if (requireServiceRole) {
      fail("notifications RLS probes require SUPABASE_SERVICE_ROLE_KEY");
    } else {
      console.warn("warn: skip notifications RLS probes (no SUPABASE_SERVICE_ROLE_KEY)");
    }
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

  // ── IPI-647 · PLN-SEC-002 — assignment-aware SELECT (direct Data API) ──
  // These probes bypass app helpers and hit PostgREST on planner.* tables.
  // Negative cases must use authenticated JWTs — never service_role.
  await assertPlannerAssignmentSelectCatalog();

  const { data: depProbeTask, error: depProbeTaskErr } = await plannerA
    .from("tasks")
    .insert({
      instance_id: instA.id,
      title: `RLS Dep Probe ${stamp}`,
      status: "todo",
      priority: "medium",
      sort_order: 99,
    })
    .select("id")
    .single();
  assert(!depProbeTaskErr && depProbeTask?.id, "owner creates second task for dependency SELECT probe");

  // assert() does not throw — guard before .id so a failed fixture create
  // fails closed with FAIL counts instead of an unhandled TypeError.
  const { data: depProbe, error: depProbeErr } = depProbeTask?.id
    ? await plannerA
        .from("dependencies")
        .insert({
          instance_id: instA.id,
          from_task_id: taskA.id,
          to_task_id: depProbeTask.id,
          dep_type: "finish_to_start",
          lag_days: 0,
        })
        .select("id")
        .single()
    : { data: null, error: { message: "depProbeTask missing after create assert" } };
  assert(!depProbeErr && depProbe?.id, "owner creates dependency for SELECT probe");

  const { data: assignedInstA, error: assignedInstAErr } = await plannerA
    .from("instances")
    .select("id")
    .eq("id", instA.id);
  assert(
    !assignedInstAErr && (assignedInstA ?? []).length === 1,
    "IPI-647 assigned owner can SELECT planner.instances",
  );

  const { data: assignedInstB, error: assignedInstBErr } = await plannerB
    .from("instances")
    .select("id")
    .eq("id", instA.id);
  assert(
    !assignedInstBErr && (assignedInstB ?? []).length === 1,
    "IPI-647 assigned viewer can SELECT planner.instances",
  );

  const { data: assignedTaskB, error: assignedTaskBErr } = await plannerB
    .from("tasks")
    .select("id")
    .eq("id", taskA.id);
  assert(
    !assignedTaskBErr && (assignedTaskB ?? []).length === 1,
    "IPI-647 assigned viewer can SELECT planner.tasks",
  );

  const { data: assignedDepB, error: assignedDepBErr } = depProbe?.id
    ? await plannerB.from("dependencies").select("id").eq("id", depProbe.id)
    : { data: [], error: { message: "depProbe missing" } };
  assert(
    !assignedDepBErr && (assignedDepB ?? []).length === 1,
    "IPI-647 assigned viewer can SELECT planner.dependencies",
  );

  // Same-org unassigned member — org membership alone must not grant SELECT.
  const emailUnassigned = `plt002-rls-unassigned-${stamp}@example.com`;
  let userUnassigned;
  try {
    userUnassigned = await createTestUser(emailUnassigned);
    const { error: seedUnassignedErr } = await admin.from("org_members").insert({
      org_id: orgAId,
      user_id: userUnassigned.user.id,
      role: "editor",
    });
    assert(!seedUnassignedErr, "seed same-org unassigned user for IPI-647");

    const plannerUnassigned = userUnassigned.client.schema("planner");
    const { data: unInst, error: unInstErr } = await plannerUnassigned
      .from("instances")
      .select("id")
      .eq("id", instA.id);
    assertSelectDenied(
      unInstErr,
      unInst,
      "IPI-647 same-org unassigned cannot SELECT planner.instances",
    );

    const { data: unTasks, error: unTasksErr } = await plannerUnassigned
      .from("tasks")
      .select("id")
      .eq("id", taskA.id);
    assertSelectDenied(
      unTasksErr,
      unTasks,
      "IPI-647 same-org unassigned cannot SELECT planner.tasks",
    );

    const { data: unDeps, error: unDepsErr } = depProbe?.id
      ? await plannerUnassigned.from("dependencies").select("id").eq("id", depProbe.id)
      : { data: [{ id: "fixture-missing" }], error: null };
    assertSelectDenied(
      unDepsErr,
      unDeps,
      "IPI-647 same-org unassigned cannot SELECT planner.dependencies",
    );
  } finally {
    if (userUnassigned?.user?.id) {
      await checkedCleanup(
        "org_members unassigned IPI-647",
        admin.from("org_members").delete().eq("org_id", orgAId).eq("user_id", userUnassigned.user.id),
      );
      const { error } = await deleteAuthUser(userUnassigned.user.id);
      if (error) trackCleanupError(`user unassigned IPI-647: ${error.message}`);
      else pass("cleaned up unassigned IPI-647 user");
    }
  }

  // Org admin / owner without planner assignment — no bypass.
  const emailOrgAdmin = `plt002-rls-orgadmin-${stamp}@example.com`;
  let userOrgAdmin;
  try {
    userOrgAdmin = await createTestUser(emailOrgAdmin);
    const { error: seedOrgAdminErr } = await admin.from("org_members").insert({
      org_id: orgAId,
      user_id: userOrgAdmin.user.id,
      role: "owner",
    });
    assert(!seedOrgAdminErr, "seed org owner without planner assignment for IPI-647");

    const plannerOrgAdmin = userOrgAdmin.client.schema("planner");
    const { data: adminInst, error: adminInstErr } = await plannerOrgAdmin
      .from("instances")
      .select("id")
      .eq("id", instA.id);
    assertSelectDenied(
      adminInstErr,
      adminInst,
      "IPI-647 org owner without assignment cannot SELECT planner.instances",
    );

    const { data: adminTasks, error: adminTasksErr } = await plannerOrgAdmin
      .from("tasks")
      .select("id")
      .eq("id", taskA.id);
    assertSelectDenied(
      adminTasksErr,
      adminTasks,
      "IPI-647 org owner without assignment cannot SELECT planner.tasks",
    );

    const { data: adminDeps, error: adminDepsErr } = depProbe?.id
      ? await plannerOrgAdmin.from("dependencies").select("id").eq("id", depProbe.id)
      : { data: [{ id: "fixture-missing" }], error: null };
    assertSelectDenied(
      adminDepsErr,
      adminDeps,
      "IPI-647 org owner without assignment cannot SELECT planner.dependencies",
    );
  } finally {
    if (userOrgAdmin?.user?.id) {
      await checkedCleanup(
        "org_members orgadmin IPI-647",
        admin.from("org_members").delete().eq("org_id", orgAId).eq("user_id", userOrgAdmin.user.id),
      );
      const { error } = await deleteAuthUser(userOrgAdmin.user.id);
      if (error) trackCleanupError(`user orgadmin IPI-647: ${error.message}`);
      else pass("cleaned up orgadmin IPI-647 user");
    }
  }

  // Revoked = DELETE assignment row (no revoked_at). Temporarily revoke B, then restore.
  const { error: revokeBErr } = await plannerA
    .from("assignments")
    .delete()
    .eq("instance_id", instA.id)
    .eq("user_id", userB.user.id);
  assert(!revokeBErr, "IPI-647 owner can DELETE assignment (revoke)");

  const { data: revokedInst, error: revokedInstErr } = await plannerB
    .from("instances")
    .select("id")
    .eq("id", instA.id);
  assertSelectDenied(
    revokedInstErr,
    revokedInst,
    "IPI-647 revoked (deleted) assignment cannot SELECT planner.instances",
  );

  const { data: revokedTasks, error: revokedTasksErr } = await plannerB
    .from("tasks")
    .select("id")
    .eq("id", taskA.id);
  assertSelectDenied(
    revokedTasksErr,
    revokedTasks,
    "IPI-647 revoked (deleted) assignment cannot SELECT planner.tasks",
  );

  const { data: revokedDeps, error: revokedDepsErr } = depProbe?.id
    ? await plannerB.from("dependencies").select("id").eq("id", depProbe.id)
    : { data: [{ id: "fixture-missing" }], error: null };
  assertSelectDenied(
    revokedDepsErr,
    revokedDeps,
    "IPI-647 revoked (deleted) assignment cannot SELECT planner.dependencies",
  );

  const { error: restoreViewerErr } = await plannerA.from("assignments").insert({
    instance_id: instA.id,
    user_id: userB.user.id,
    role: "viewer",
  });
  assert(!restoreViewerErr, "IPI-647 restore viewer assignment after revoke probe");

  // Cross-org: org A member must not see org B instance/tasks/deps.
  const entityB647 = crypto.randomUUID();
  const { data: instB647, error: instB647Err } = await plannerB
    .from("instances")
    .insert({
      org_id: orgBId,
      workflow_id: wfB.id,
      entity_type: "shoot",
      entity_id: entityB647,
      name: `RLS Plan B647 ${stamp}`,
      status: "draft",
    })
    .select("id")
    .single();
  assert(!instB647Err && instB647?.id, "org B owner inserts planner.instances for IPI-647 cross-org probe");

  // No separate userB647 — reuses userB / orgB; rows cascade when org B is deleted below.
  const { data: taskB647, error: taskB647Err } = instB647?.id
    ? await plannerB
        .from("tasks")
        .insert({
          instance_id: instB647.id,
          title: `RLS Task B647 ${stamp}`,
          status: "todo",
          priority: "medium",
          sort_order: 0,
        })
        .select("id")
        .single()
    : { data: null, error: { message: "instB647 missing after create assert" } };
  assert(!taskB647Err && taskB647?.id, "org B owner inserts task for IPI-647 cross-org probe");

  const { data: crossInst647, error: crossInst647Err } = instB647?.id
    ? await plannerA.from("instances").select("id").eq("id", instB647.id)
    : { data: [{ id: "fixture-missing" }], error: null };
  assertSelectDenied(
    crossInst647Err,
    crossInst647,
    "IPI-647 cross-org cannot SELECT planner.instances",
  );

  const { data: crossTasks647, error: crossTasks647Err } = taskB647?.id
    ? await plannerA.from("tasks").select("id").eq("id", taskB647.id)
    : { data: [{ id: "fixture-missing" }], error: null };
  assertSelectDenied(
    crossTasks647Err,
    crossTasks647,
    "IPI-647 cross-org cannot SELECT planner.tasks",
  );

  // service_role trusted backend — bypasses RLS; must still read for ops paths.
  const { data: svcInst, error: svcInstErr } = await plannerAdmin
    .from("instances")
    .select("id")
    .eq("id", instA.id);
  assert(
    !svcInstErr && (svcInst ?? []).length === 1,
    "IPI-647 service_role can SELECT planner.instances (trusted backend unchanged)",
  );

  // Mutation regression: assigned owner UPDATE still works after SELECT tighten.
  const { error: mutInstErr } = await plannerA
    .from("instances")
    .update({ name: `RLS Plan Mut ${stamp}` })
    .eq("id", instA.id);
  assert(!mutInstErr, "IPI-647 assigned owner can still UPDATE planner.instances");

  const { error: mutTaskErr } = await plannerA
    .from("tasks")
    .update({ title: `RLS Task Mut ${stamp}` })
    .eq("id", taskA.id);
  assert(!mutTaskErr, "IPI-647 assigned owner can still UPDATE planner.tasks");

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
      if (error) trackCleanupError(`user G: ${error.message}`);
      else pass("cleaned up user G (service role)");
    }
  }

  // ── IPI-649 · PLN-DATA-001B-M — planner_shift_task/planner_update_task RPC
  // probes. Fresh dedicated tasks (not taskA, whose assignee/role state has
  // been mutated by the probes above) so each scenario starts from a known
  // baseline. Also proves the Bugbot/Codex security-fix pass (PR #418,
  // commit 0011fd57): per-task authorization, NULL-assignee/NULL-timestamp
  // bypass fixes, org-membership check, idempotency race fix.
  const { data: taskX, error: taskXErr } = await plannerA
    .from("tasks")
    .insert({
      instance_id: instA.id,
      title: `RLS Shift Task X ${stamp}`,
      status: "todo",
      priority: "medium",
      sort_order: 1,
      start_date: "2026-08-01",
      end_date: "2026-08-03",
    })
    .select("id, updated_at")
    .single();
  assert(!taskXErr && taskX?.id, "owner creates task X for shift-RPC probes");

  const { data: taskY, error: taskYErr } = await plannerA
    .from("tasks")
    .insert({
      instance_id: instA.id,
      title: `RLS Shift Task Y ${stamp}`,
      status: "todo",
      priority: "medium",
      sort_order: 2,
      start_date: "2026-08-04",
      end_date: "2026-08-06",
    })
    .select("id, updated_at")
    .single();
  assert(!taskYErr && taskY?.id, "owner creates task Y (unassigned) for shift-RPC probes");

  const { error: depXYErr } = await plannerA.from("dependencies").insert({
    instance_id: instA.id,
    from_task_id: taskX.id,
    to_task_id: taskY.id,
    dep_type: "finish_to_start",
    lag_days: 0,
  });
  assert(!depXYErr, "owner creates X→Y dependency for shift-RPC probes");

  const { error: resetRoleErr } = await plannerA
    .from("assignments")
    .update({ role: "contributor" })
    .eq("instance_id", instA.id)
    .eq("user_id", userB.user.id);
  assert(!resetRoleErr, "reset user B to contributor for shift-RPC probes");

  const { error: assignXErr } = await plannerA
    .from("tasks")
    .update({ assignee_user_id: userB.user.id })
    .eq("id", taskX.id);
  assert(!assignXErr, "assign task X to user B");

  // planner.tasks has a BEFORE UPDATE trigger (tasks_updated_at) that
  // auto-bumps updated_at on every write — the assignee-update above just
  // did that, so the updated_at captured at insert time is now stale.
  // Re-fetch fresh right before building the RPC payload (matches
  // mutations.ts's shiftTask(), which does the same fresh re-fetch for
  // exactly this reason).
  const { data: taskXBaseline } = await plannerA.from("tasks").select("id, updated_at").eq("id", taskX.id).single();

  // 1 — assigned positive path.
  const shift1Key = crypto.randomUUID();
  const shift1Payload = {
    p_instance_id: instA.id,
    p_root_task_id: taskX.id,
    p_delta_days: 1,
    p_idempotency_key: shift1Key,
    p_changed_tasks: [
      { taskId: taskX.id, expectedUpdatedAt: taskXBaseline.updated_at, newStartDate: "2026-08-02", newEndDate: "2026-08-04" },
    ],
    p_expected_dependency_edges: [{ fromTaskId: taskX.id, toTaskId: taskY.id, lagDays: 0 }],
  };
  const { data: shift1, error: shift1Err } = await userB.client.rpc("planner_shift_task", shift1Payload);
  assert(!shift1Err && shift1?.ok === true, "contributor/assignee can shift their own task (positive path)");
  assert((shift1?.changedTasks ?? []).length === 1, "shift positive path reports exactly 1 changed task");

  // 2 — idempotent retry: same key + same payload → replayed:true.
  const { data: shift1Retry, error: shift1RetryErr } = await userB.client.rpc("planner_shift_task", shift1Payload);
  assert(
    !shift1RetryErr && shift1Retry?.ok === true && shift1Retry?.replayed === true,
    "identical retry (same key+payload) replays the original result",
  );

  // Exactly one audit event for this idempotency key, not two.
  const { data: eventsForShift1 } = await admin
    .schema("planner")
    .from("events")
    .select("id")
    .eq("instance_id", instA.id)
    .eq("event_type", "task_shifted")
    .eq("idempotency_key", shift1Key);
  assert(
    (eventsForShift1 ?? []).length === 1,
    "exactly one planner.events row for the shift1 idempotency key (retry did not create a second)",
  );

  // 3 — same key, different payload → IDEMPOTENCY_CONFLICT, not a silent overwrite.
  const { data: shift1Conflict, error: shift1ConflictErr } = await userB.client.rpc("planner_shift_task", {
    ...shift1Payload,
    p_delta_days: 2,
    p_changed_tasks: [
      { taskId: taskX.id, expectedUpdatedAt: taskX.updated_at, newStartDate: "2026-08-03", newEndDate: "2026-08-05" },
    ],
  });
  assert(
    !shift1ConflictErr && shift1Conflict?.ok === false && shift1Conflict?.code === "IDEMPOTENCY_CONFLICT",
    "same idempotency key with a different payload returns IDEMPOTENCY_CONFLICT, not a silent overwrite or raw DB error",
  );

  // 4 — stale timestamp conflict.
  const { data: staleResult, error: staleErr } = await userB.client.rpc("planner_shift_task", {
    p_instance_id: instA.id,
    p_root_task_id: taskX.id,
    p_delta_days: 1,
    p_idempotency_key: crypto.randomUUID(),
    p_changed_tasks: [
      { taskId: taskX.id, expectedUpdatedAt: "2020-01-01T00:00:00.000Z", newStartDate: "2026-08-05", newEndDate: "2026-08-07" },
    ],
    p_expected_dependency_edges: [{ fromTaskId: taskX.id, toTaskId: taskY.id, lagDays: 0 }],
  });
  assert(
    !staleErr && staleResult?.ok === false && staleResult?.code === "STALE_VERSION",
    "a stale expectedUpdatedAt is rejected with STALE_VERSION, not silently overwritten",
  );

  // 5 — dependency conflict: correct updated_at, wrong expected edges.
  const { data: taskXFresh } = await plannerA.from("tasks").select("id, updated_at").eq("id", taskX.id).single();
  const { data: depConflictResult, error: depConflictErr } = await userB.client.rpc("planner_shift_task", {
    p_instance_id: instA.id,
    p_root_task_id: taskX.id,
    p_delta_days: 1,
    p_idempotency_key: crypto.randomUUID(),
    p_changed_tasks: [
      { taskId: taskX.id, expectedUpdatedAt: taskXFresh.updated_at, newStartDate: "2026-08-06", newEndDate: "2026-08-08" },
    ],
    p_expected_dependency_edges: [], // real edge X→Y exists — this is stale/wrong on purpose
  });
  assert(
    !depConflictErr && depConflictResult?.ok === false && depConflictResult?.code === "DEPENDENCY_CHANGED",
    "mismatched dependency-edge snapshot is rejected with DEPENDENCY_CHANGED",
  );

  // 6 — per-task authorization fix: a caller authorized only on the root
  // task (as its specific assignee, not instance-wide contributor+) must
  // not be able to smuggle changes into a task they don't own via
  // changed_tasks. Demote user B to viewer but keep them assigned to task X.
  const { error: demoteErr } = await plannerA
    .from("assignments")
    .update({ role: "viewer" })
    .eq("instance_id", instA.id)
    .eq("user_id", userB.user.id);
  assert(!demoteErr, "demote user B to viewer, still assigned to task X, for per-task auth probe");

  const { data: taskXForAuth } = await plannerA.from("tasks").select("id, updated_at").eq("id", taskX.id).single();
  const { data: taskYForAuth } = await plannerA.from("tasks").select("id, updated_at").eq("id", taskY.id).single();

  const { data: perTaskResult, error: perTaskErr } = await userB.client.rpc("planner_shift_task", {
    p_instance_id: instA.id,
    p_root_task_id: taskX.id, // userB IS the assignee here — root check alone would pass
    p_delta_days: 1,
    p_idempotency_key: crypto.randomUUID(),
    p_changed_tasks: [
      { taskId: taskX.id, expectedUpdatedAt: taskXForAuth.updated_at, newStartDate: "2026-08-07", newEndDate: "2026-08-09" },
      { taskId: taskY.id, expectedUpdatedAt: taskYForAuth.updated_at, newStartDate: "2026-08-10", newEndDate: "2026-08-12" }, // NOT userB's task
    ],
    p_expected_dependency_edges: [{ fromTaskId: taskX.id, toTaskId: taskY.id, lagDays: 0 }],
  });
  assert(
    !perTaskErr && perTaskResult?.ok === false,
    "root-task-only authorization no longer lets a caller smuggle changes into an unauthorized task via changed_tasks",
  );

  const { data: taskYAfter } = await plannerA.from("tasks").select("start_date").eq("id", taskY.id).single();
  assert(
    taskYAfter?.start_date === "2026-08-04",
    "rejected per-task-auth call left task Y's dates untouched (no partial write)",
  );

  // 7 — NULL-assignee authorization-bypass fix: a viewer (not contributor+)
  // must not be able to update an unassigned task via planner_update_task.
  const { data: taskYFresh2 } = await plannerA.from("tasks").select("id, updated_at").eq("id", taskY.id).single();
  const { data: nullAssigneeResult, error: nullAssigneeErr } = await userB.client.rpc("planner_update_task", {
    p_task_id: taskY.id,
    p_instance_id: instA.id,
    p_expected_updated_at: taskYFresh2.updated_at,
    p_idempotency_key: crypto.randomUUID(),
    p_patch: { title: "hijacked by viewer" },
  });
  assert(
    !nullAssigneeErr && nullAssigneeResult?.ok === false && nullAssigneeResult?.code === "FORBIDDEN",
    "a viewer cannot update an unassigned task via planner_update_task (NULL-assignee auth-bypass fix)",
  );

  // 8 — no raw Postgres errors exposed: malformed JSON input.
  const { data: malformedResult, error: malformedErr } = await userA.client.rpc("planner_shift_task", {
    p_instance_id: instA.id,
    p_root_task_id: taskX.id,
    p_delta_days: 1,
    p_idempotency_key: crypto.randomUUID(),
    p_changed_tasks: { not: "an array" },
    p_expected_dependency_edges: [],
  });
  assert(
    !malformedErr && malformedResult?.ok === false && malformedResult?.code === "INVALID_INPUT",
    "a non-array p_changed_tasks returns typed INVALID_INPUT, not a raw jsonb_array_length error",
  );

  // 9 — cross-org denial + org-membership fix: org A's owner has zero
  // assignment/membership in org B and must be rejected even before the
  // per-task assignee/contributor check runs.
  const { data: instB, error: instBErr } = await plannerB
    .from("instances")
    .insert({
      org_id: orgBId,
      workflow_id: wfB.id,
      entity_type: "shoot",
      entity_id: crypto.randomUUID(),
      name: `RLS Org B Instance ${stamp}`,
      status: "draft",
    })
    .select("id")
    .single();
  assert(!instBErr && instB?.id, "user B creates an instance in org B for the cross-org probe");

  const { data: taskB, error: taskBErr } = await plannerB
    .from("tasks")
    .insert({
      instance_id: instB.id,
      title: `RLS Org B Task ${stamp}`,
      status: "todo",
      priority: "medium",
      sort_order: 0,
      start_date: "2026-08-01",
      end_date: "2026-08-02",
    })
    .select("id, updated_at")
    .single();
  assert(!taskBErr && taskB?.id, "user B creates a task in the org B instance");

  const { data: crossOrgResult, error: crossOrgErr } = await userA.client.rpc("planner_shift_task", {
    p_instance_id: instB.id,
    p_root_task_id: taskB.id,
    p_delta_days: 1,
    p_idempotency_key: crypto.randomUUID(),
    p_changed_tasks: [
      { taskId: taskB.id, expectedUpdatedAt: taskB.updated_at, newStartDate: "2026-08-02", newEndDate: "2026-08-03" },
    ],
    p_expected_dependency_edges: [],
  });
  assert(
    !crossOrgErr && crossOrgResult?.ok === false && crossOrgResult?.code === "FORBIDDEN",
    "org A owner cannot shift a task in an org B instance (cross-org denial, org-membership fix)",
  );

  // 10 — terminal instance guard (archived/cancelled/completed), even for the owner.
  const { data: instTerm, error: instTermErr } = await plannerA
    .from("instances")
    .insert({
      org_id: orgAId,
      workflow_id: wfA.id,
      entity_type: "shoot",
      entity_id: crypto.randomUUID(),
      name: `RLS Terminal Instance ${stamp}`,
      status: "draft",
    })
    .select("id")
    .single();
  assert(!instTermErr && instTerm?.id, "owner creates a second instance for the terminal-guard probe");

  const { data: taskTerm, error: taskTermErr } = await plannerA
    .from("tasks")
    .insert({
      instance_id: instTerm.id,
      title: `RLS Terminal Task ${stamp}`,
      status: "todo",
      priority: "medium",
      sort_order: 0,
      start_date: "2026-08-01",
      end_date: "2026-08-02",
    })
    .select("id, updated_at")
    .single();
  assert(!taskTermErr && taskTerm?.id, "owner creates a task on the terminal-guard instance");

  // Service role sets the instance terminal directly — this probe only
  // exercises the two RPCs' own INSTANCE_TERMINAL guard, not the (not yet
  // built) archive/cancel transition RPC from IPI-651.
  const { error: cancelErr } = await admin.schema("planner").from("instances").update({ status: "cancelled" }).eq("id", instTerm.id);
  assert(!cancelErr, "service role cancels the terminal-guard instance");

  const { data: terminalShiftResult, error: terminalShiftErr } = await userA.client.rpc("planner_shift_task", {
    p_instance_id: instTerm.id,
    p_root_task_id: taskTerm.id,
    p_delta_days: 1,
    p_idempotency_key: crypto.randomUUID(),
    p_changed_tasks: [
      { taskId: taskTerm.id, expectedUpdatedAt: taskTerm.updated_at, newStartDate: "2026-08-02", newEndDate: "2026-08-03" },
    ],
    p_expected_dependency_edges: [],
  });
  assert(
    !terminalShiftErr && terminalShiftResult?.ok === false && terminalShiftResult?.code === "INSTANCE_TERMINAL",
    "shiftTask on a cancelled instance is rejected with INSTANCE_TERMINAL, even for the owner",
  );

  const { data: terminalUpdateResult, error: terminalUpdateErr } = await userA.client.rpc("planner_update_task", {
    p_task_id: taskTerm.id,
    p_instance_id: instTerm.id,
    p_expected_updated_at: taskTerm.updated_at,
    p_idempotency_key: crypto.randomUUID(),
    p_patch: { title: "should not apply" },
  });
  assert(
    !terminalUpdateErr && terminalUpdateResult?.ok === false && terminalUpdateResult?.code === "INSTANCE_TERMINAL",
    "updateTask on a cancelled instance is rejected with INSTANCE_TERMINAL, even for the owner",
  );

  // ── Round-10 fix: planner_update_task rejects assigning a task to a user
  // outside the instance's org. The pre-existing tasks.assignee_user_id ->
  // auth.users FK only proves the id is a real user somewhere — not that
  // they're in this org. A syntactically-valid-but-outside-org id is
  // sufficient to prove the fix (no need for a real second user here).
  const { data: taskAssign, error: taskAssignErr } = await plannerA
    .from("tasks")
    .insert({
      instance_id: instA.id,
      title: `RLS Assignee Task ${stamp}`,
      status: "todo",
      priority: "medium",
      sort_order: 3,
      start_date: "2026-08-10",
      end_date: "2026-08-11",
    })
    .select("id, updated_at")
    .single();
  assert(!taskAssignErr && taskAssign?.id, "owner creates a task for the round-10 assignee-org-membership probe");

  const { data: outsiderAssignResult, error: outsiderAssignErr } = await userA.client.rpc("planner_update_task", {
    p_task_id: taskAssign.id,
    p_instance_id: instA.id,
    p_expected_updated_at: taskAssign.updated_at,
    p_idempotency_key: crypto.randomUUID(),
    p_patch: { assignee_user_id: crypto.randomUUID() },
  });
  assert(
    !outsiderAssignErr && outsiderAssignResult?.ok === false && outsiderAssignResult?.code === "INVALID_INPUT",
    "planner_update_task rejects assigning a task to a user outside the instance's org (round-10 fix)",
  );

  const { data: memberAssignResult, error: memberAssignErr } = await userA.client.rpc("planner_update_task", {
    p_task_id: taskAssign.id,
    p_instance_id: instA.id,
    p_expected_updated_at: taskAssign.updated_at,
    p_idempotency_key: crypto.randomUUID(),
    p_patch: { assignee_user_id: userB.user.id },
  });
  assert(
    !memberAssignErr && memberAssignResult?.ok === true,
    "planner_update_task still allows assigning a task to a real org member",
  );

  // Restore user B to 'manager' on instA — this block demoted them to
  // 'viewer' for the per-task-authorization probe (scenario 6 above), but
  // every probe from here on (starting with the IPI-575 section directly
  // below) explicitly assumes "userB = manager on instA".
  const { error: restoreMgrErr } = await plannerA
    .from("assignments")
    .update({ role: "manager" })
    .eq("instance_id", instA.id)
    .eq("user_id", userB.user.id);
  assert(!restoreMgrErr, "restore user B to manager after the IPI-649 RPC probe block");

  // ── IPI-653 · PLN-DATA-003 + IPI-670 · PLN-DATA-003B — planner_create_instance
  // RPC probes. p_tasks is a caller-precomputed task list
  // (PlannerEngine.buildSchedule()); the RPC validates each task's phaseId
  // against p_workflow_id, then (IPI-670) requires a complete distinct cover
  // of that workflow's phases before any write. Uses fresh, dedicated org A
  // members (not the ambient userB) so this block is self-contained.
  const { data: ciPhase1, error: ciPhase1Err } = await plannerA
    .from("phases")
    .insert({ workflow_id: wfA.id, slug: `ci-brief-${stamp}`, name: "Brief", order_index: 0, default_duration_days: 2 })
    .select("id")
    .single();
  assert(!ciPhase1Err && ciPhase1?.id, "org owner inserts planner.phases for planner_create_instance probes");

  const { data: ciPhase2, error: ciPhase2Err } = await plannerA
    .from("phases")
    .insert({ workflow_id: wfA.id, slug: `ci-shoot-${stamp}`, name: "Shoot", order_index: 1, default_duration_days: 3 })
    .select("id")
    .single();
  assert(!ciPhase2Err && ciPhase2?.id, "org owner inserts a second planner.phases row");

  // A second crm_deal so the explicit-owner probe (#10 below) doesn't
  // collide with the (org, entity, workflow) tuple the positive-path probe
  // (#5) already creates against crmDeal.id + wfA. A third for the
  // revoked-role replay probe (#20), so it doesn't collide with either.
  const { data: ciDeal2, error: ciDeal2Err } = await userA.client
    .from("crm_deals")
    .insert({ org_id: orgAId, company_id: crmCompany.id, stage: "lead" })
    .select("id")
    .single();
  assert(!ciDeal2Err && ciDeal2?.id, "user A inserts a second crm_deal for the explicit-owner probe");

  const { data: ciDeal3, error: ciDeal3Err } = await userA.client
    .from("crm_deals")
    .insert({ org_id: orgAId, company_id: crmCompany.id, stage: "lead" })
    .select("id")
    .single();
  assert(!ciDeal3Err && ciDeal3?.id, "user A inserts a third crm_deal for the revoked-role replay probe");

  // Fresh deals for IPI-670 completeness rejects (must not collide with the
  // positive-path instance on crmDeal / explicit-owner on ciDeal2).
  const { data: ciDealEmpty, error: ciDealEmptyErr } = await userA.client
    .from("crm_deals")
    .insert({ org_id: orgAId, company_id: crmCompany.id, stage: "lead" })
    .select("id")
    .single();
  assert(!ciDealEmptyErr && ciDealEmpty?.id, "user A inserts a crm_deal for the empty-p_tasks completeness probe");

  const { data: ciDealOmit, error: ciDealOmitErr } = await userA.client
    .from("crm_deals")
    .insert({ org_id: orgAId, company_id: crmCompany.id, stage: "lead" })
    .select("id")
    .single();
  assert(!ciDealOmitErr && ciDealOmit?.id, "user A inserts a crm_deal for the omitted-phase completeness probe");

  const { data: ciDealDup, error: ciDealDupErr } = await userA.client
    .from("crm_deals")
    .insert({ org_id: orgAId, company_id: crmCompany.id, stage: "lead" })
    .select("id")
    .single();
  assert(!ciDealDupErr && ciDealDup?.id, "user A inserts a crm_deal for the duplicate-phase completeness probe");

  const { data: ciDealZeroPhase, error: ciDealZeroPhaseErr } = await userA.client
    .from("crm_deals")
    .insert({ org_id: orgAId, company_id: crmCompany.id, stage: "lead" })
    .select("id")
    .single();
  assert(!ciDealZeroPhaseErr && ciDealZeroPhase?.id, "user A inserts a crm_deal for the zero-phase workflow probe");

  // Workflow with zero phases — completeness must reject even with [].
  const { data: wfZeroPhases, error: wfZeroPhasesErr } = await plannerA
    .from("workflows")
    .insert({
      org_id: orgAId,
      name: `RLS CI Zero-Phase WF ${stamp}`,
      category: "production",
      version: 1,
      is_default: false,
    })
    .select("id")
    .single();
  assert(!wfZeroPhasesErr && wfZeroPhases?.id, "org owner inserts a zero-phase workflow for IPI-670");

  const emailCiViewer = `plt002-rls-ci-viewer-${stamp}@example.com`;
  const emailCiEditor = `plt002-rls-ci-editor-${stamp}@example.com`;
  let userCiViewer;
  let userCiEditor;
  try {
    assert(!!admin, "service_role admin client required to seed org members for planner_create_instance probes");
    userCiViewer = await createTestUser(emailCiViewer);
    userCiEditor = await createTestUser(emailCiEditor);
    const { error: ciViewerSeedErr } = await admin
      .from("org_members")
      .insert({ org_id: orgAId, user_id: userCiViewer.user.id, role: "viewer" });
    assert(!ciViewerSeedErr, "seed org A viewer for planner_create_instance probes");
    const { error: ciEditorSeedErr } = await admin
      .from("org_members")
      .insert({ org_id: orgAId, user_id: userCiEditor.user.id, role: "editor" });
    assert(!ciEditorSeedErr, "seed org A editor for planner_create_instance probes");

    const ciValidTasks = [
      { phaseId: ciPhase1.id, title: "Brief", startDate: "2026-08-03", endDate: "2026-08-04", durationDays: 2, sortOrder: 0 },
      { phaseId: ciPhase2.id, title: "Shoot", startDate: "2026-08-05", endDate: "2026-08-07", durationDays: 3, sortOrder: 1 },
    ];

    // 1 — a viewer is denied before anything is written.
    const { data: ciViewerCreate, error: ciViewerCreateErr } = await userCiViewer.client.rpc("planner_create_instance", {
      p_org_id: orgAId,
      p_entity_type: "crm_deal",
      p_entity_id: crmDeal.id,
      p_workflow_id: wfA.id,
      p_name: `RLS CI Viewer Denied ${stamp}`,
      p_planned_start: "2026-08-03",
      p_idempotency_key: crypto.randomUUID(),
      p_tasks: ciValidTasks,
    });
    assert(
      !ciViewerCreateErr && ciViewerCreate?.ok === false && ciViewerCreate?.code === "FORBIDDEN",
      "org viewer cannot call planner_create_instance (FORBIDDEN)",
    );

    // 2 — cross-org: userCiEditor is an org A member only, not org B. The
    // org-role check runs before workflow/entity validation, so it fails
    // FORBIDDEN regardless of whether wfB/crmDeal actually line up.
    const { data: ciCrossOrgCreate, error: ciCrossOrgCreateErr } = await userCiEditor.client.rpc("planner_create_instance", {
      p_org_id: orgBId,
      p_entity_type: "crm_deal",
      p_entity_id: crmDeal.id,
      p_workflow_id: wfB.id,
      p_name: `RLS CI Cross-Org ${stamp}`,
      p_planned_start: "2026-08-03",
      p_idempotency_key: crypto.randomUUID(),
      p_tasks: [],
    });
    assert(
      !ciCrossOrgCreateErr && ciCrossOrgCreate?.ok === false && ciCrossOrgCreate?.code === "FORBIDDEN",
      "org A editor cannot call planner_create_instance against org B (no membership there)",
    );

    // 3 — a task whose phaseId doesn't belong to p_workflow_id is rejected
    // before anything is written.
    const { data: ciBadPhaseCreate, error: ciBadPhaseCreateErr } = await userCiEditor.client.rpc("planner_create_instance", {
      p_org_id: orgAId,
      p_entity_type: "crm_deal",
      p_entity_id: crmDeal.id,
      p_workflow_id: wfA.id,
      p_name: `RLS CI Bad Phase ${stamp}`,
      p_planned_start: "2026-08-03",
      p_idempotency_key: crypto.randomUUID(),
      p_tasks: [
        { phaseId: crypto.randomUUID(), title: "Ghost", startDate: "2026-08-03", endDate: "2026-08-04", durationDays: 2, sortOrder: 0 },
      ],
    });
    assert(
      !ciBadPhaseCreateErr && ciBadPhaseCreate?.ok === false && ciBadPhaseCreate?.code === "INVALID_INPUT",
      "planner_create_instance rejects a task whose phaseId doesn't belong to p_workflow_id",
    );

    // 4 — an entity_id with no matching crm_deal row is NOT_FOUND.
    const { data: ciNoEntityCreate, error: ciNoEntityCreateErr } = await userCiEditor.client.rpc("planner_create_instance", {
      p_org_id: orgAId,
      p_entity_type: "crm_deal",
      p_entity_id: crypto.randomUUID(),
      p_workflow_id: wfA.id,
      p_name: `RLS CI No Entity ${stamp}`,
      p_planned_start: "2026-08-03",
      p_idempotency_key: crypto.randomUUID(),
      p_tasks: [],
    });
    assert(
      !ciNoEntityCreateErr && ciNoEntityCreate?.ok === false && ciNoEntityCreate?.code === "NOT_FOUND",
      "planner_create_instance rejects an entity_id with no matching crm_deal row",
    );

    // 5 — positive path: org A editor creates an instance. owner_user_id
    // defaults to the caller, tasks persist with the caller-supplied
    // (business-day-precomputed) dates and phase order_index as sort_order,
    // and zero planner.dependencies rows are written (v1 policy).
    const ciIdemKey = crypto.randomUUID();
    const { data: ciCreateResult, error: ciCreateErr } = await userCiEditor.client.rpc("planner_create_instance", {
      p_org_id: orgAId,
      p_entity_type: "crm_deal",
      p_entity_id: crmDeal.id,
      p_workflow_id: wfA.id,
      p_name: `RLS CI Positive ${stamp}`,
      p_planned_start: "2026-08-03",
      p_idempotency_key: ciIdemKey,
      p_tasks: ciValidTasks,
    });
    assert(
      !ciCreateErr && ciCreateResult?.ok === true && !!ciCreateResult?.instanceId,
      "org A editor creates a planner instance via planner_create_instance",
    );
    const ciInstanceId = ciCreateResult?.instanceId;

    // IPI-647: JWT negative cases use authenticated clients above. Fixture
    // inspection for create_instance results uses service_role because the
    // org-owner session (plannerA) is intentionally unassigned to those rows.
    const { data: ciInstanceRow, error: ciInstanceRowErr } = await plannerAdmin
      .from("instances")
      .select("owner_user_id")
      .eq("id", ciInstanceId)
      .single();
    assert(
      !ciInstanceRowErr && ciInstanceRow?.owner_user_id === userCiEditor.user.id,
      "planner_create_instance defaults owner_user_id to the calling actor when p_owner_user_id is omitted",
    );

    const { data: ciTasks, error: ciTasksErr } = await plannerAdmin
      .from("tasks")
      .select("phase_id, start_date, end_date, sort_order")
      .eq("instance_id", ciInstanceId)
      .order("sort_order", { ascending: true });
    assert(
      !ciTasksErr &&
        (ciTasks ?? []).length === 2 &&
        ciTasks[0].phase_id === ciPhase1.id &&
        ciTasks[0].start_date === "2026-08-03" &&
        ciTasks[0].end_date === "2026-08-04" &&
        ciTasks[0].sort_order === 0 &&
        ciTasks[1].phase_id === ciPhase2.id &&
        ciTasks[1].sort_order === 1,
      "planner_create_instance persists exactly the caller-supplied tasks with correct sort_order",
    );

    const { data: ciDeps, error: ciDepsErr } = await plannerAdmin
      .from("dependencies")
      .select("id")
      .eq("instance_id", ciInstanceId);
    assert(
      !ciDepsErr && (ciDeps ?? []).length === 0,
      "planner_create_instance writes zero planner.dependencies rows (v1 policy: no auto-dependencies)",
    );

    // 6 — an identical retry (same payload + same idempotency key) replays
    // the original result rather than creating a second instance.
    const { data: ciReplayResult, error: ciReplayErr } = await userCiEditor.client.rpc("planner_create_instance", {
      p_org_id: orgAId,
      p_entity_type: "crm_deal",
      p_entity_id: crmDeal.id,
      p_workflow_id: wfA.id,
      p_name: `RLS CI Positive ${stamp}`,
      p_planned_start: "2026-08-03",
      p_idempotency_key: ciIdemKey,
      p_tasks: ciValidTasks,
    });
    assert(
      !ciReplayErr && ciReplayResult?.ok === true && ciReplayResult?.replayed === true && ciReplayResult?.instanceId === ciInstanceId,
      "identical retry with the same idempotency key replays the original result",
    );

    // 7 — same key, different request body: IDEMPOTENCY_CONFLICT, not a
    // silent reuse of the original result.
    const { data: ciConflictResult, error: ciConflictErr } = await userCiEditor.client.rpc("planner_create_instance", {
      p_org_id: orgAId,
      p_entity_type: "crm_deal",
      p_entity_id: crmDeal.id,
      p_workflow_id: wfA.id,
      p_name: `RLS CI Positive Changed Name ${stamp}`,
      p_planned_start: "2026-08-03",
      p_idempotency_key: ciIdemKey,
      p_tasks: ciValidTasks,
    });
    assert(
      !ciConflictErr && ciConflictResult?.ok === false && ciConflictResult?.code === "IDEMPOTENCY_CONFLICT",
      "same idempotency key with a different request body returns IDEMPOTENCY_CONFLICT",
    );

    // 8 — the same (org, entity, workflow) tuple with a fresh idempotency
    // key is INSTANCE_ALREADY_EXISTS, not a second instance.
    const { data: ciDupeResult, error: ciDupeErr } = await userCiEditor.client.rpc("planner_create_instance", {
      p_org_id: orgAId,
      p_entity_type: "crm_deal",
      p_entity_id: crmDeal.id,
      p_workflow_id: wfA.id,
      p_name: `RLS CI Dupe Attempt ${stamp}`,
      p_planned_start: "2026-08-03",
      p_idempotency_key: crypto.randomUUID(),
      p_tasks: ciValidTasks,
    });
    assert(
      !ciDupeErr && ciDupeResult?.ok === false && ciDupeResult?.code === "INSTANCE_ALREADY_EXISTS" && ciDupeResult?.instanceId === ciInstanceId,
      "duplicate (org, entity, workflow) tuple with a new idempotency key returns INSTANCE_ALREADY_EXISTS",
    );

    // 9 — an explicit p_owner_user_id must itself be an org member.
    const { data: ciBadOwnerResult, error: ciBadOwnerErr } = await userCiEditor.client.rpc("planner_create_instance", {
      p_org_id: orgAId,
      p_entity_type: "crm_deal",
      p_entity_id: crypto.randomUUID(),
      p_workflow_id: wfA.id,
      p_name: `RLS CI Bad Owner ${stamp}`,
      p_planned_start: "2026-08-03",
      p_idempotency_key: crypto.randomUUID(),
      p_tasks: [],
      p_owner_user_id: crypto.randomUUID(),
    });
    assert(
      !ciBadOwnerErr && ciBadOwnerResult?.ok === false && ciBadOwnerResult?.code === "INVALID_INPUT",
      "planner_create_instance rejects a p_owner_user_id that isn't an org member",
    );

    // 10 — a real org member as explicit p_owner_user_id is honored, even
    // when it isn't the caller (owner-editor@caller vs. owner@viewer).
    const ciExplicitOwnerIdemKey = crypto.randomUUID();
    const { data: ciExplicitOwnerResult, error: ciExplicitOwnerErr } = await userCiEditor.client.rpc("planner_create_instance", {
      p_org_id: orgAId,
      p_entity_type: "crm_deal",
      p_entity_id: ciDeal2.id,
      p_workflow_id: wfA.id,
      p_name: `RLS CI Explicit Owner ${stamp}`,
      p_planned_start: "2026-08-03",
      p_idempotency_key: ciExplicitOwnerIdemKey,
      p_tasks: ciValidTasks,
      p_owner_user_id: userCiViewer.user.id,
    });
    assert(
      !ciExplicitOwnerErr && ciExplicitOwnerResult?.ok === true,
      "planner_create_instance accepts an explicit p_owner_user_id that is a real org member",
    );
    const { data: ciExplicitOwnerRow, error: ciExplicitOwnerRowErr } = await plannerAdmin
      .from("instances")
      .select("owner_user_id")
      .eq("id", ciExplicitOwnerResult?.instanceId)
      .single();
    assert(
      !ciExplicitOwnerRowErr && ciExplicitOwnerRow?.owner_user_id === userCiViewer.user.id,
      "planner_create_instance honors an explicit p_owner_user_id different from the caller",
    );

    // 10b — round-7 fix: the explicit owner actually gets a planner.assignments
    // row (bootstrap_owner_assignment only ever assigns the caller). Read via
    // plannerAdmin, not plannerA: assignments_select_org is manager+ *on that
    // specific instance*, and userA (org owner but never assigned here) has
    // no visibility into it — plannerA would read back zero rows regardless
    // of whether the insert worked, a false negative unrelated to the fix.
    const { data: ciExplicitOwnerAssignment, error: ciExplicitOwnerAssignmentErr } = await plannerAdmin
      .from("assignments")
      .select("role")
      .eq("instance_id", ciExplicitOwnerResult?.instanceId)
      .eq("user_id", userCiViewer.user.id)
      .maybeSingle();
    assert(
      !ciExplicitOwnerAssignmentErr && ciExplicitOwnerAssignment?.role === "owner",
      "explicit p_owner_user_id different from the caller receives their own planner.assignments row with role owner",
    );

    // 10c — the explicit owner can immediately read the instance through
    // their own session, not just via the admin/owner client — proves real
    // access, not just a cosmetic owner_user_id column value.
    const { data: ciExplicitOwnerRead, error: ciExplicitOwnerReadErr } = await userCiViewer.client
      .schema("planner")
      .from("instances")
      .select("id")
      .eq("id", ciExplicitOwnerResult?.instanceId);
    assert(
      !ciExplicitOwnerReadErr && (ciExplicitOwnerRead ?? []).length === 1,
      "the explicit owner can immediately read the instance through their own session",
    );

    // 10d — replaying the explicit-owner create (same key, same payload) does
    // not create a second planner.assignments row for the explicit owner.
    const { data: ciExplicitOwnerReplay, error: ciExplicitOwnerReplayErr } = await userCiEditor.client.rpc("planner_create_instance", {
      p_org_id: orgAId,
      p_entity_type: "crm_deal",
      p_entity_id: ciDeal2.id,
      p_workflow_id: wfA.id,
      p_name: `RLS CI Explicit Owner ${stamp}`,
      p_planned_start: "2026-08-03",
      p_idempotency_key: ciExplicitOwnerIdemKey,
      p_tasks: ciValidTasks,
      p_owner_user_id: userCiViewer.user.id,
    });
    assert(
      !ciExplicitOwnerReplayErr && ciExplicitOwnerReplay?.ok === true && ciExplicitOwnerReplay?.replayed === true,
      "replaying the explicit-owner create returns replayed:true",
    );
    const { data: ciExplicitOwnerAssignmentsAfterReplay, error: ciExplicitOwnerAssignmentsAfterReplayErr } = await plannerAdmin
      .from("assignments")
      .select("id")
      .eq("instance_id", ciExplicitOwnerResult?.instanceId)
      .eq("user_id", userCiViewer.user.id);
    assert(
      !ciExplicitOwnerAssignmentsAfterReplayErr && (ciExplicitOwnerAssignmentsAfterReplay ?? []).length === 1,
      "replaying the explicit-owner create does not create a duplicate planner.assignments row (on conflict do nothing)",
    );

    // 11 — no EXECUTE grant for anon.
    const { error: ciAnonCreateErr } = await anon.rpc("planner_create_instance", {
      p_org_id: orgAId,
      p_entity_type: "crm_deal",
      p_entity_id: crmDeal.id,
      p_workflow_id: wfA.id,
      p_name: `RLS CI Anon ${stamp}`,
      p_planned_start: "2026-08-03",
      p_idempotency_key: crypto.randomUUID(),
      p_tasks: [],
    });
    assert(!!ciAnonCreateErr, "anon cannot call planner_create_instance (no EXECUTE grant)");

    // 12-15 — round-7 fix: malformed task fields return typed INVALID_INPUT,
    // not a raw Postgres cast/data_exception error.
    const { data: ciMalformedPhaseCreate, error: ciMalformedPhaseCreateErr } = await userCiEditor.client.rpc("planner_create_instance", {
      p_org_id: orgAId,
      p_entity_type: "crm_deal",
      p_entity_id: crmDeal.id,
      p_workflow_id: wfA.id,
      p_name: `RLS CI Malformed Phase ${stamp}`,
      p_planned_start: "2026-08-03",
      p_idempotency_key: crypto.randomUUID(),
      p_tasks: [{ phaseId: "not-a-uuid", title: "Bad Phase", startDate: "2026-08-03", endDate: "2026-08-04", durationDays: 2, sortOrder: 0 }],
    });
    assert(
      !ciMalformedPhaseCreateErr && ciMalformedPhaseCreate?.ok === false && ciMalformedPhaseCreate?.code === "INVALID_INPUT",
      "planner_create_instance rejects a malformed (non-UUID) phaseId as typed INVALID_INPUT, not a raw Postgres cast error",
    );

    const { data: ciMalformedDateCreate, error: ciMalformedDateCreateErr } = await userCiEditor.client.rpc("planner_create_instance", {
      p_org_id: orgAId,
      p_entity_type: "crm_deal",
      p_entity_id: crmDeal.id,
      p_workflow_id: wfA.id,
      p_name: `RLS CI Malformed Date ${stamp}`,
      p_planned_start: "2026-08-03",
      p_idempotency_key: crypto.randomUUID(),
      p_tasks: [{ phaseId: ciPhase1.id, title: "Bad Date", startDate: "not-a-date", endDate: "2026-08-04", durationDays: 2, sortOrder: 0 }],
    });
    assert(
      !ciMalformedDateCreateErr && ciMalformedDateCreate?.ok === false && ciMalformedDateCreate?.code === "INVALID_INPUT",
      "planner_create_instance rejects a malformed startDate as typed INVALID_INPUT",
    );

    const { data: ciMalformedSortCreate, error: ciMalformedSortCreateErr } = await userCiEditor.client.rpc("planner_create_instance", {
      p_org_id: orgAId,
      p_entity_type: "crm_deal",
      p_entity_id: crmDeal.id,
      p_workflow_id: wfA.id,
      p_name: `RLS CI Malformed Sort ${stamp}`,
      p_planned_start: "2026-08-03",
      p_idempotency_key: crypto.randomUUID(),
      p_tasks: [{ phaseId: ciPhase1.id, title: "Bad Sort", startDate: "2026-08-03", endDate: "2026-08-04", durationDays: 2, sortOrder: "not-a-number" }],
    });
    assert(
      !ciMalformedSortCreateErr && ciMalformedSortCreate?.ok === false && ciMalformedSortCreate?.code === "INVALID_INPUT",
      "planner_create_instance rejects a malformed (non-integer) sortOrder as typed INVALID_INPUT",
    );

    const { data: ciMalformedObjectCreate, error: ciMalformedObjectCreateErr } = await userCiEditor.client.rpc("planner_create_instance", {
      p_org_id: orgAId,
      p_entity_type: "crm_deal",
      p_entity_id: crmDeal.id,
      p_workflow_id: wfA.id,
      p_name: `RLS CI Malformed Object ${stamp}`,
      p_planned_start: "2026-08-03",
      p_idempotency_key: crypto.randomUUID(),
      p_tasks: ["just a string, not a task object"],
    });
    assert(
      !ciMalformedObjectCreateErr && ciMalformedObjectCreate?.ok === false && ciMalformedObjectCreate?.code === "INVALID_INPUT",
      "planner_create_instance rejects a non-object task element as typed INVALID_INPUT",
    );

    // 16 — all four malformed-task attempts above targeted the same (org,
    // entity, workflow) tuple the positive-path probe (#5) already created a
    // real instance for. Validating every task field before any write
    // (round-7) means none of them could have left a phantom row — the
    // count must still be exactly the one real instance from #5.
    const { data: ciNoResidualInstance, error: ciNoResidualInstanceErr } = await plannerAdmin
      .from("instances")
      .select("id")
      .eq("org_id", orgAId)
      .eq("entity_type", "crm_deal")
      .eq("entity_id", crmDeal.id)
      .eq("workflow_id", wfA.id);
    assert(
      !ciNoResidualInstanceErr && (ciNoResidualInstance ?? []).length === 1,
      "malformed-task attempts leave zero phantom planner.instances rows — only the one real instance from the positive-path probe exists",
    );

    // 17 — a task assigned to a real-shaped but non-org-member UUID is
    // rejected as INVALID_INPUT (the assigneeUserId org-membership guard).
    const { data: ciNonMemberAssigneeCreate, error: ciNonMemberAssigneeCreateErr } = await userCiEditor.client.rpc("planner_create_instance", {
      p_org_id: orgAId,
      p_entity_type: "crm_deal",
      p_entity_id: crmDeal.id,
      p_workflow_id: wfA.id,
      p_name: `RLS CI Non-Member Assignee ${stamp}`,
      p_planned_start: "2026-08-03",
      p_idempotency_key: crypto.randomUUID(),
      p_tasks: [
        { phaseId: ciPhase1.id, title: "Assigned", startDate: "2026-08-03", endDate: "2026-08-04", durationDays: 2, sortOrder: 0, assigneeUserId: crypto.randomUUID() },
      ],
    });
    assert(
      !ciNonMemberAssigneeCreateErr && ciNonMemberAssigneeCreate?.ok === false && ciNonMemberAssigneeCreate?.code === "INVALID_INPUT",
      "planner_create_instance rejects a task assignee who isn't an org member",
    );

    // 18 — semantic task validation (final migration): non-positive duration,
    // negative sort order, endDate before startDate, and an unsupported
    // priority value are all rejected as INVALID_INPUT before any write —
    // priority in particular would otherwise reach planner.tasks' own CHECK
    // constraint unvalidated and leak as a raw check_violation.
    const ciSemanticCases = [
      { label: "non-positive durationDays", task: { phaseId: ciPhase1.id, title: "Bad Duration", startDate: "2026-08-03", endDate: "2026-08-04", durationDays: 0, sortOrder: 0 } },
      { label: "negative sortOrder", task: { phaseId: ciPhase1.id, title: "Bad Sort", startDate: "2026-08-03", endDate: "2026-08-04", durationDays: 2, sortOrder: -1 } },
      { label: "endDate before startDate", task: { phaseId: ciPhase1.id, title: "Bad Range", startDate: "2026-08-05", endDate: "2026-08-03", durationDays: 2, sortOrder: 0 } },
      { label: "unsupported priority", task: { phaseId: ciPhase1.id, title: "Bad Priority", startDate: "2026-08-03", endDate: "2026-08-04", durationDays: 2, sortOrder: 0, priority: "urgent-ish" } },
    ];
    for (const { label, task } of ciSemanticCases) {
      const { data: ciSemanticResult, error: ciSemanticErr } = await userCiEditor.client.rpc("planner_create_instance", {
        p_org_id: orgAId,
        p_entity_type: "crm_deal",
        p_entity_id: crmDeal.id,
        p_workflow_id: wfA.id,
        p_name: `RLS CI Semantic ${label} ${stamp}`,
        p_planned_start: "2026-08-03",
        p_idempotency_key: crypto.randomUUID(),
        p_tasks: [task],
      });
      assert(
        !ciSemanticErr && ciSemanticResult?.ok === false && ciSemanticResult?.code === "INVALID_INPUT",
        `planner_create_instance rejects a task with ${label} as typed INVALID_INPUT, not a raw check_violation or silent persist`,
      );
    }

    // ── IPI-670 · PLN-DATA-003B — complete phase coverage (before any write)
    const countResidualsForDeal = async (dealId, workflowId) => {
      const { data: instRows, error: instErr } = await plannerAdmin
        .from("instances")
        .select("id")
        .eq("org_id", orgAId)
        .eq("entity_type", "crm_deal")
        .eq("entity_id", dealId)
        .eq("workflow_id", workflowId);
      assert(!instErr, "service_role can count residual planner.instances for completeness probes");
      const ids = (instRows ?? []).map((r) => r.id);
      if (ids.length === 0) {
        return { instances: 0, tasks: 0, assignments: 0, events: 0 };
      }
      const [{ data: taskRows, error: taskErr }, { data: assignRows, error: assignErr }, { data: eventRows, error: eventErr }] =
        await Promise.all([
          plannerAdmin.from("tasks").select("id").in("instance_id", ids),
          plannerAdmin.from("assignments").select("id").in("instance_id", ids),
          plannerAdmin.from("events").select("id").in("instance_id", ids),
        ]);
      assert(!taskErr && !assignErr && !eventErr, "service_role can count residual tasks/assignments/events");
      return {
        instances: ids.length,
        tasks: (taskRows ?? []).length,
        assignments: (assignRows ?? []).length,
        events: (eventRows ?? []).length,
      };
    };

    const assertZeroResiduals = (before, after, label) => {
      assert(
        after.instances === before.instances &&
          after.tasks === before.tasks &&
          after.assignments === before.assignments &&
          after.events === before.events &&
          after.instances === 0,
        `${label} leaves zero residual planner.instances/tasks/assignments/events`,
      );
    };

    // 19a — empty p_tasks against a normal (2-phase) workflow → INVALID_INPUT, no write.
    const beforeEmpty = await countResidualsForDeal(ciDealEmpty.id, wfA.id);
    const { data: ciEmptyTasksResult, error: ciEmptyTasksErr } = await userCiEditor.client.rpc("planner_create_instance", {
      p_org_id: orgAId,
      p_entity_type: "crm_deal",
      p_entity_id: ciDealEmpty.id,
      p_workflow_id: wfA.id,
      p_name: `RLS CI Empty Tasks ${stamp}`,
      p_planned_start: "2026-08-03",
      p_idempotency_key: crypto.randomUUID(),
      p_tasks: [],
    });
    assert(
      !ciEmptyTasksErr && ciEmptyTasksResult?.ok === false && ciEmptyTasksResult?.code === "INVALID_INPUT",
      "IPI-670: planner_create_instance rejects empty p_tasks when the workflow has phases",
    );
    assertZeroResiduals(beforeEmpty, await countResidualsForDeal(ciDealEmpty.id, wfA.id), "empty p_tasks reject");

    // 19b — workflow with zero phases → INVALID_INPUT even with empty p_tasks.
    const beforeZero = await countResidualsForDeal(ciDealZeroPhase.id, wfZeroPhases.id);
    const { data: ciZeroPhaseResult, error: ciZeroPhaseErr } = await userCiEditor.client.rpc("planner_create_instance", {
      p_org_id: orgAId,
      p_entity_type: "crm_deal",
      p_entity_id: ciDealZeroPhase.id,
      p_workflow_id: wfZeroPhases.id,
      p_name: `RLS CI Zero Phase WF ${stamp}`,
      p_planned_start: "2026-08-03",
      p_idempotency_key: crypto.randomUUID(),
      p_tasks: [],
    });
    assert(
      !ciZeroPhaseErr && ciZeroPhaseResult?.ok === false && ciZeroPhaseResult?.code === "INVALID_INPUT",
      "IPI-670: planner_create_instance rejects a workflow that has zero phases",
    );
    assertZeroResiduals(beforeZero, await countResidualsForDeal(ciDealZeroPhase.id, wfZeroPhases.id), "zero-phase workflow reject");

    // 19c — one phase omitted (submitted_count < expected) → INVALID_INPUT, no write.
    const beforeOmit = await countResidualsForDeal(ciDealOmit.id, wfA.id);
    const { data: ciOmitResult, error: ciOmitErr } = await userCiEditor.client.rpc("planner_create_instance", {
      p_org_id: orgAId,
      p_entity_type: "crm_deal",
      p_entity_id: ciDealOmit.id,
      p_workflow_id: wfA.id,
      p_name: `RLS CI Omit Phase ${stamp}`,
      p_planned_start: "2026-08-03",
      p_idempotency_key: crypto.randomUUID(),
      p_tasks: [ciValidTasks[0]],
    });
    assert(
      !ciOmitErr && ciOmitResult?.ok === false && ciOmitResult?.code === "INVALID_INPUT",
      "IPI-670: planner_create_instance rejects p_tasks that omit a workflow phase",
    );
    assertZeroResiduals(beforeOmit, await countResidualsForDeal(ciDealOmit.id, wfA.id), "omitted-phase reject");

    // 19d — duplicate phaseId replacing a missing one. Second copy uses an
    // alternate accepted UUID text form (uppercase) so the gate must count
    // distinct casted uuids, not raw JSON strings.
    const beforeDup = await countResidualsForDeal(ciDealDup.id, wfA.id);
    const { data: ciDupResult, error: ciDupErr } = await userCiEditor.client.rpc("planner_create_instance", {
      p_org_id: orgAId,
      p_entity_type: "crm_deal",
      p_entity_id: ciDealDup.id,
      p_workflow_id: wfA.id,
      p_name: `RLS CI Dup Phase ${stamp}`,
      p_planned_start: "2026-08-03",
      p_idempotency_key: crypto.randomUUID(),
      p_tasks: [
        ciValidTasks[0],
        {
          ...ciValidTasks[0],
          phaseId: String(ciValidTasks[0].phaseId).toUpperCase(),
          title: "Brief Dup",
          sortOrder: 1,
        },
      ],
    });
    assert(
      !ciDupErr && ciDupResult?.ok === false && ciDupResult?.code === "INVALID_INPUT",
      "IPI-670: planner_create_instance rejects duplicate phaseId (incl. alternate UUID text) covering that hides a missing phase",
    );
    assertZeroResiduals(beforeDup, await countResidualsForDeal(ciDealDup.id, wfA.id), "duplicate-phase reject");

    // 19e — positive path already proved complete set (#5); assert task count
    // equals workflow phase count (regression guard for IPI-670).
    const { data: ciPhaseCountRows, error: ciPhaseCountErr } = await plannerA
      .from("phases")
      .select("id")
      .eq("workflow_id", wfA.id);
    assert(
      !ciPhaseCountErr && (ciPhaseCountRows ?? []).length === (ciTasks ?? []).length,
      "IPI-670: successful create persists exactly one task per workflow phase",
    );

    // 20 — round-7 fix: idempotency replay is denied once the actor's org
    // role no longer permits creation. Authz now runs before the idempotency
    // lookup, so a revoked-role actor cannot replay a cached ok:true result.
    // Runs last (before cleanup) since it changes userCiEditor's role.
    const ciRevokeReplayKey = crypto.randomUUID();
    const { data: ciRevokeReplayCreate, error: ciRevokeReplayCreateErr } = await userCiEditor.client.rpc("planner_create_instance", {
      p_org_id: orgAId,
      p_entity_type: "crm_deal",
      p_entity_id: ciDeal3.id,
      p_workflow_id: wfA.id,
      p_name: `RLS CI Revoke Replay ${stamp}`,
      p_planned_start: "2026-08-03",
      p_idempotency_key: ciRevokeReplayKey,
      p_tasks: ciValidTasks,
    });
    assert(
      !ciRevokeReplayCreateErr && ciRevokeReplayCreate?.ok === true,
      "org A editor creates an instance for the revoked-role replay probe (positive path, while still authorized)",
    );

    const { error: ciDemoteEditorErr } = await admin
      .from("org_members")
      .update({ role: "viewer" })
      .eq("org_id", orgAId)
      .eq("user_id", userCiEditor.user.id);
    assert(!ciDemoteEditorErr, "admin demotes the CI editor to viewer for the revoked-role replay probe");

    const { data: ciRevokeReplayRetry, error: ciRevokeReplayRetryErr } = await userCiEditor.client.rpc("planner_create_instance", {
      p_org_id: orgAId,
      p_entity_type: "crm_deal",
      p_entity_id: ciDeal3.id,
      p_workflow_id: wfA.id,
      p_name: `RLS CI Revoke Replay ${stamp}`,
      p_planned_start: "2026-08-03",
      p_idempotency_key: ciRevokeReplayKey,
      p_tasks: ciValidTasks,
    });
    assert(
      !ciRevokeReplayRetryErr && ciRevokeReplayRetry?.ok === false && ciRevokeReplayRetry?.code === "FORBIDDEN",
      "identical retry with the same idempotency key is denied FORBIDDEN once the actor's org role no longer permits creation (round-7: authz before idempotency)",
    );
  } finally {
    if (userCiViewer?.user?.id) {
      const { error } = await deleteAuthUser(userCiViewer.user.id);
      if (error) trackCleanupError(`user CI viewer: ${error.message}`);
      else pass("cleaned up planner_create_instance viewer test user (service role)");
    }
    if (userCiEditor?.user?.id) {
      const { error } = await deleteAuthUser(userCiEditor.user.id);
      if (error) trackCleanupError(`user CI editor: ${error.message}`);
      else pass("cleaned up planner_create_instance editor test user (service role)");
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
      if (error) trackCleanupError(`user F: ${error.message}`);
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
        await checkedCleanup(
          `org_members user E`,
          admin.from("org_members").delete().eq("org_id", orgAId).eq("user_id", userE.user.id),
        );
        const { error } = await deleteAuthUser(userE.user.id);
        if (error) trackCleanupError(`user E: ${error.message}`);
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
      await checkedCleanup(
        `org_members user D`,
        admin.from("org_members").delete().eq("org_id", orgAId).eq("user_id", userD.user.id),
      );
      const { error } = await deleteAuthUser(userD.user.id);
      if (error) trackCleanupError(`user D: ${error.message}`);
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
      if (error) trackCleanupError(`user C: ${error.message}`);
      else pass("cleaned up user C (service role)");
    }
  }

  // Cleanup planner org B (cascade via organizations delete)
  if (orgBId && admin) {
    await checkedCleanup(
      `org_members for org B ${orgBId}`,
      admin.from("org_members").delete().eq("org_id", orgBId),
    );
    await checkedCleanup(
      `org B ${orgBId}`,
      admin.from("organizations").delete().eq("id", orgBId),
    );
  }

  // ── IPI-721 SHOOT-REG-001 — shoot org-membership visibility ──
  // Regression coverage for: public.shoot_portfolio_view and public.get_shoot_detail(uuid) —
  // both previously gated on brands.user_id = auth.uid() (personal ownership), now
  // public.is_org_member(org_id). Fully self-contained fixtures (own org/brand/users)
  // so this block doesn't depend on shared state ordering elsewhere in this script.
  //
  // The six shoot.* SELECT policies (shoots, shoot_assets, shot_list, shoot_deliverables,
  // shoot_crew, shot_deliverable_links) received the identical predicate change in the
  // same migration but are NOT independently probed here: `shoot` is not in
  // supabase/config.toml's exposed `schemas` list (only public/graphql_public/planner
  // are), so no supabase-js client — anon, authenticated, or service-role — can reach
  // `shoot.*` tables directly via PostgREST (confirmed: even the admin/service-role
  // client gets "The schema must be one of the following: public, graphql_public,
  // planner" on `.schema("shoot")`). This matches production exactly: the app itself
  // never queries shoot.* directly either, only through this view and this RPC. Those
  // six policies were verified with `SET ROLE authenticated` + `set_config('request.jwt.claims', ...)`
  // impersonation directly in SQL during implementation (session record, 2026-07-20) —
  // not reproducible from this Node/PostgREST-only script.
  //
  // Mirrors the real production bug: the shoot's creator (userShootEditor) is a
  // different person than the brand's user_id (userShootOwner) — both in the same
  // org. Before the fix, userShootEditor could not see the shoot they just created.
  //
  // Seeding uses public.commit_shoot_draft (service-role only — matches the real
  // /api/shoots/commit write path, which also runs server-side under the service
  // role). Cleanup deletes only the brand: shoot.shoots.brand_id is
  // ON DELETE CASCADE (confirmed via pg_constraint), so the shoot and its shot_list
  // row are removed automatically — no direct shoot-schema access needed for
  // cleanup either.
  if (admin) {
    const emailShootOwner = `plt002-rls-shoot-owner-${stamp}@example.com`;
    const emailShootEditor = `plt002-rls-shoot-editor-${stamp}@example.com`;
    const emailShootViewer = `plt002-rls-shoot-viewer-${stamp}@example.com`;
    const emailShootOutsider = `plt002-rls-shoot-outsider-${stamp}@example.com`;
    let userShootOwner, userShootEditor, userShootViewer, userShootOutsider;
    let shootOrgId, shootBrandId, shootId;
    try {
      userShootOwner = await createTestUser(emailShootOwner);

      const { data: shootOrg, error: shootOrgErr } = await userShootOwner.client
        .from("organizations")
        .insert({
          name: `RLS Shoot Org ${stamp}`,
          slug: `rls-shoot-org-${stamp}`,
          owner_id: userShootOwner.user.id,
          type: "brand",
        })
        .select("id")
        .single();
      assert(!shootOrgErr && shootOrg?.id, "IPI-721: create dedicated org for shoot fixture");
      shootOrgId = shootOrg?.id;

      const { data: shootBrand, error: shootBrandErr } = await userShootOwner.client
        .from("brands")
        .insert({ name: `RLS Shoot Brand ${stamp}`, user_id: userShootOwner.user.id, org_id: shootOrgId })
        .select("id")
        .single();
      assert(!shootBrandErr && shootBrand?.id, "IPI-721: brand owner creates brand in own org");
      shootBrandId = shootBrand?.id;

      userShootEditor = await createTestUser(emailShootEditor);
      userShootViewer = await createTestUser(emailShootViewer);
      userShootOutsider = await createTestUser(emailShootOutsider);

      const { error: editorMemberErr } = await admin
        .from("org_members")
        .insert({ org_id: shootOrgId, user_id: userShootEditor.user.id, role: "editor" });
      assert(!editorMemberErr, "IPI-721: seed shoot editor as org member (service role)");

      const { error: viewerMemberErr } = await admin
        .from("org_members")
        .insert({ org_id: shootOrgId, user_id: userShootViewer.user.id, role: "viewer" });
      assert(!viewerMemberErr, "IPI-721: seed shoot viewer as org member (service role)");
      // userShootOutsider deliberately gets no org_members row — cross-org negative fixture.

      // Shoot created by the editor for the owner's brand, via the real production
      // write path (service-role only — matches /api/shoots/commit).
      const { data: draftResult, error: draftErr } = await admin.rpc("commit_shoot_draft", {
        p_brand_id: shootBrandId,
        p_name: `RLS Shoot ${stamp}`,
        p_created_by: userShootEditor.user.id,
        p_shots: [{ description: "RLS shot list probe", order: 0 }],
      });
      assert(!draftErr && draftResult?.shoot_id, "IPI-721: seed shoot via commit_shoot_draft (created_by=editor)");
      shootId = draftResult?.shoot_id;

      // 1. Legacy case: brand owner (not the shoot's creator) can still read.
      const { data: ownerViewRows, error: ownerViewErr } = await userShootOwner.client
        .from("shoot_portfolio_view")
        .select("id")
        .eq("id", shootId);
      assert(
        !ownerViewErr && (ownerViewRows ?? []).length === 1,
        "IPI-721: brand owner reads shoot via shoot_portfolio_view",
      );

      // 2. The actual bug: same-org editor who created the shoot but doesn't own
      // the brands row must now see it (was 0 rows before this migration).
      const { data: editorViewRows, error: editorViewErr } = await userShootEditor.client
        .from("shoot_portfolio_view")
        .select("id, shot_count")
        .eq("id", shootId);
      assert(
        !editorViewErr && editorViewRows?.[0]?.id === shootId && editorViewRows?.[0]?.shot_count === 1,
        "IPI-721: same-org non-owner editor reads their own shoot via shoot_portfolio_view",
      );

      const { data: editorDetail, error: editorDetailErr } = await userShootEditor.client.rpc(
        "get_shoot_detail",
        { p_shoot_id: shootId },
      );
      assert(
        !editorDetailErr && editorDetail?.shoot?.id === shootId,
        "IPI-721: same-org non-owner editor reads get_shoot_detail for their own shoot",
      );

      // 3. Same-org viewer (read-only role) can also read — this is a read
      // path, not a write, so viewer-admitting org_member semantics are correct here.
      const { data: viewerViewRows, error: viewerViewErr } = await userShootViewer.client
        .from("shoot_portfolio_view")
        .select("id")
        .eq("id", shootId);
      assert(
        !viewerViewErr && (viewerViewRows ?? []).length === 1,
        "IPI-721: same-org viewer reads shoot via shoot_portfolio_view",
      );
      const { data: viewerDetail, error: viewerDetailErr } = await userShootViewer.client.rpc(
        "get_shoot_detail",
        { p_shoot_id: shootId },
      );
      assert(
        !viewerDetailErr && viewerDetail?.shoot?.id === shootId,
        "IPI-721: same-org viewer reads get_shoot_detail",
      );

      // 4. Cross-org outsider — zero rows / not_found, enumeration-safe (no error
      // leaking existence, just an empty result / not_found exception).
      const { data: outsiderViewRows, error: outsiderViewErr } = await userShootOutsider.client
        .from("shoot_portfolio_view")
        .select("id")
        .eq("id", shootId);
      assert(
        !outsiderViewErr && (outsiderViewRows ?? []).length === 0,
        "IPI-721: cross-org outsider sees zero rows for the shoot via the view",
      );

      const { error: outsiderDetailErr } = await userShootOutsider.client.rpc("get_shoot_detail", {
        p_shoot_id: shootId,
      });
      assert(
        !!outsiderDetailErr && outsiderDetailErr.message.includes("not_found"),
        "IPI-721: cross-org outsider gets not_found from get_shoot_detail",
      );

      // 5. Unauthenticated caller — no grants at all on the view (revoked from
      // anon in this migration) or the RPC.
      const { error: anonViewErr } = await anon.from("shoot_portfolio_view").select("id").eq("id", shootId);
      assert(!!anonViewErr, "IPI-721: anon cannot select shoot_portfolio_view (grants revoked)");

      const { error: anonDetailErr } = await anon.rpc("get_shoot_detail", { p_shoot_id: shootId });
      assert(!!anonDetailErr, "IPI-721: anon cannot execute get_shoot_detail (grants revoked)");
    } finally {
      if (shootBrandId) {
        // Cascades: shoot.shoots.brand_id -> brands(id) ON DELETE CASCADE, and every
        // shoot.* child table -> shoot.shoots(id) ON DELETE CASCADE — removes the
        // seeded shoot + shot_list row without any direct shoot-schema access.
        await checkedCleanup(
          "IPI-721 shoot brand (cascades to shoot + shot_list)",
          admin.from("brands").delete().eq("id", shootBrandId),
        );
      }
      if (shootOrgId) {
        await checkedCleanup(
          "IPI-721 shoot org_members",
          admin.from("org_members").delete().eq("org_id", shootOrgId),
        );
        await checkedCleanup(
          "IPI-721 shoot org",
          admin.from("organizations").delete().eq("id", shootOrgId),
        );
      }
      for (const u of [userShootOwner, userShootEditor, userShootViewer, userShootOutsider]) {
        if (u?.user?.id) {
          const { error } = await deleteAuthUser(u.user.id);
          if (error) trackCleanupError(`IPI-721 shoot test user ${u.user.id}: ${error.message}`);
        }
      }
      pass("IPI-721: cleaned up shoot org-visibility test fixtures (service role)");
    }
  } else {
    pass("IPI-721: shoot org-visibility block skipped (no service role key — cannot seed shoot rows)");
  }

  // ── IPI-727 SHOOT-SEC-001 — commit_shoot_draft defense-in-depth org check ──
  // public.commit_shoot_draft is SECURITY DEFINER and, before this migration, trusted
  // p_brand_id/p_created_by with zero internal authorization check. Its only real
  // caller (POST /api/shoots/commit) already enforces org membership via RLS on
  // brands before invoking the RPC, so this is defense-in-depth, not a live-bug
  // regression test — but it proves the RPC itself now fails closed if some future
  // caller forgets that check.
  //
  // Called directly via `admin` (service role), same as the real app does — there is
  // no user-JWT context here (auth.uid() is NULL on this call path), which is exactly
  // why the fix validates the explicit p_created_by parameter instead of auth.uid().
  if (admin) {
    const emailCommitOwner = `plt002-rls-commit-owner-${stamp}@example.com`;
    const emailCommitEditor = `plt002-rls-commit-editor-${stamp}@example.com`;
    const emailCommitOutsider = `plt002-rls-commit-outsider-${stamp}@example.com`;
    let userCommitOwner, userCommitEditor, userCommitOutsider;
    let commitOrgId, commitBrandId;
    const seededShootIds = [];
    try {
      userCommitOwner = await createTestUser(emailCommitOwner);

      const { data: commitOrg, error: commitOrgErr } = await userCommitOwner.client
        .from("organizations")
        .insert({
          name: `RLS Commit Org ${stamp}`,
          slug: `rls-commit-org-${stamp}`,
          owner_id: userCommitOwner.user.id,
          type: "brand",
        })
        .select("id")
        .single();
      assert(!commitOrgErr && commitOrg?.id, "IPI-727: create dedicated org for commit_shoot_draft fixture");
      commitOrgId = commitOrg?.id;

      const { data: commitBrand, error: commitBrandErr } = await userCommitOwner.client
        .from("brands")
        .insert({ name: `RLS Commit Brand ${stamp}`, user_id: userCommitOwner.user.id, org_id: commitOrgId })
        .select("id")
        .single();
      assert(!commitBrandErr && commitBrand?.id, "IPI-727: brand owner creates brand in own org");
      commitBrandId = commitBrand?.id;

      userCommitEditor = await createTestUser(emailCommitEditor);
      userCommitOutsider = await createTestUser(emailCommitOutsider);

      const { error: commitEditorMemberErr } = await admin
        .from("org_members")
        .insert({ org_id: commitOrgId, user_id: userCommitEditor.user.id, role: "editor" });
      assert(!commitEditorMemberErr, "IPI-727: seed commit editor as org member (service role)");
      // userCommitOutsider deliberately gets no org_members row.

      // 1. Same-org member as p_created_by — allowed (matches real production usage).
      const { data: positiveResult, error: positiveErr } = await admin.rpc("commit_shoot_draft", {
        p_brand_id: commitBrandId,
        p_name: `RLS commit authz positive ${stamp}`,
        p_created_by: userCommitEditor.user.id,
      });
      assert(
        !positiveErr && positiveResult?.shoot_id,
        "IPI-727: commit_shoot_draft succeeds when p_created_by is a member of p_brand_id's org",
      );
      if (positiveResult?.shoot_id) seededShootIds.push(positiveResult.shoot_id);

      // 2. Outsider spoofing p_created_by — rejected (the actual gap this closes).
      const { error: negativeErr } = await admin.rpc("commit_shoot_draft", {
        p_brand_id: commitBrandId,
        p_name: `RLS commit authz negative ${stamp}`,
        p_created_by: userCommitOutsider.user.id,
      });
      assert(
        !!negativeErr && negativeErr.message.includes("unauthorized"),
        "IPI-727: commit_shoot_draft rejects p_created_by with no relationship to p_brand_id's org",
      );

      // 3. p_created_by omitted (NULL) — IPI-727 originally preserved this as a
      // local-dev auth-disabled fallback. IPI-732 explicitly revisited and
      // REJECTED that decision: a shared database cannot distinguish "a
      // trusted local dev call" from any other privileged caller that simply
      // omitted the actor, so this now fails closed. See the IPI-732 block
      // below for the full rationale.
      const { error: nullActorErr } = await admin.rpc("commit_shoot_draft", {
        p_brand_id: commitBrandId,
        p_name: `RLS commit authz null-actor ${stamp}`,
      });
      assert(
        !!nullActorErr && nullActorErr.message.includes("unauthorized"),
        "IPI-727/IPI-732: commit_shoot_draft rejects p_created_by omitted (NULL actor no longer bypasses authz)",
      );
    } finally {
      if (commitBrandId) {
        // Cascades: shoot.shoots.brand_id -> brands(id) ON DELETE CASCADE.
        await checkedCleanup(
          "IPI-727 commit_shoot_draft brand (cascades to shoots)",
          admin.from("brands").delete().eq("id", commitBrandId),
        );
      }
      if (commitOrgId) {
        await checkedCleanup(
          "IPI-727 commit_shoot_draft org_members",
          admin.from("org_members").delete().eq("org_id", commitOrgId),
        );
        await checkedCleanup(
          "IPI-727 commit_shoot_draft org",
          admin.from("organizations").delete().eq("id", commitOrgId),
        );
      }
      for (const u of [userCommitOwner, userCommitEditor, userCommitOutsider]) {
        if (u?.user?.id) {
          const { error } = await deleteAuthUser(u.user.id);
          if (error) trackCleanupError(`IPI-727 commit test user ${u.user.id}: ${error.message}`);
        }
      }
      pass("IPI-727: cleaned up commit_shoot_draft authz test fixtures (service role)");
    }
  } else {
    pass("IPI-727: commit_shoot_draft authz block skipped (no service role key)");
  }

  // ── IPI-732 SHOOT-SEC-002 — restrict shoot creation to org owners/editors ──
  // IPI-727 proved organization MEMBERSHIP but not ROLE — a viewer satisfied
  // the same EXISTS check as an owner/editor. This block proves the tightened
  // role IN ('owner', 'editor') check directly against the RPC (service role,
  // same call shape as the real /api/shoots/commit -> commitShootDraft() path),
  // plus the NULL-actor decision reversal documented above.
  if (admin) {
    const emailRoleOwner = `plt002-rls-role-owner-${stamp}@example.com`;
    const emailRoleEditor = `plt002-rls-role-editor-${stamp}@example.com`;
    const emailRoleViewer = `plt002-rls-role-viewer-${stamp}@example.com`;
    const emailRoleOutsider = `plt002-rls-role-outsider-${stamp}@example.com`;
    let userRoleOwner, userRoleEditor, userRoleViewer, userRoleOutsider;
    let roleOrgId, roleBrandId;
    const seededRoleShootIds = [];
    try {
      // auto_add_org_owner (IPI-16) seeds the creator as role='owner' automatically.
      userRoleOwner = await createTestUser(emailRoleOwner);

      const { data: roleOrg, error: roleOrgErr } = await userRoleOwner.client
        .from("organizations")
        .insert({
          name: `RLS Role Org ${stamp}`,
          slug: `rls-role-org-${stamp}`,
          owner_id: userRoleOwner.user.id,
          type: "brand",
        })
        .select("id")
        .single();
      assert(!roleOrgErr && roleOrg?.id, "IPI-732: create dedicated org for role-authz fixture");
      roleOrgId = roleOrg?.id;

      const { data: roleBrand, error: roleBrandErr } = await userRoleOwner.client
        .from("brands")
        .insert({ name: `RLS Role Brand ${stamp}`, user_id: userRoleOwner.user.id, org_id: roleOrgId })
        .select("id")
        .single();
      assert(!roleBrandErr && roleBrand?.id, "IPI-732: owner creates brand in own org");
      roleBrandId = roleBrand?.id;

      userRoleEditor = await createTestUser(emailRoleEditor);
      userRoleViewer = await createTestUser(emailRoleViewer);
      userRoleOutsider = await createTestUser(emailRoleOutsider);

      const { error: roleEditorMemberErr } = await admin
        .from("org_members")
        .insert({ org_id: roleOrgId, user_id: userRoleEditor.user.id, role: "editor" });
      assert(!roleEditorMemberErr, "IPI-732: seed editor as org member (service role)");

      const { error: roleViewerMemberErr } = await admin
        .from("org_members")
        .insert({ org_id: roleOrgId, user_id: userRoleViewer.user.id, role: "viewer" });
      assert(!roleViewerMemberErr, "IPI-732: seed viewer as org member (service role)");
      // userRoleOutsider deliberately gets no org_members row.

      // 1. Owner — allowed.
      const { data: ownerResult, error: ownerErr } = await admin.rpc("commit_shoot_draft", {
        p_brand_id: roleBrandId,
        p_name: `RLS role authz owner ${stamp}`,
        p_created_by: userRoleOwner.user.id,
      });
      assert(!ownerErr && ownerResult?.shoot_id, "IPI-732: commit_shoot_draft succeeds for org owner");
      if (ownerResult?.shoot_id) seededRoleShootIds.push(ownerResult.shoot_id);

      // 2. Editor — allowed.
      const { data: editorResult, error: editorErr } = await admin.rpc("commit_shoot_draft", {
        p_brand_id: roleBrandId,
        p_name: `RLS role authz editor ${stamp}`,
        p_created_by: userRoleEditor.user.id,
      });
      assert(!editorErr && editorResult?.shoot_id, "IPI-732: commit_shoot_draft succeeds for org editor");
      if (editorResult?.shoot_id) seededRoleShootIds.push(editorResult.shoot_id);

      // 3. Viewer — the actual gap this closes. Was allowed before this migration.
      const { error: viewerErr } = await admin.rpc("commit_shoot_draft", {
        p_brand_id: roleBrandId,
        p_name: `RLS role authz viewer ${stamp}`,
        p_created_by: userRoleViewer.user.id,
      });
      assert(
        !!viewerErr && viewerErr.message.includes("unauthorized"),
        "IPI-732: commit_shoot_draft rejects org viewer (read-only role, was previously allowed)",
      );

      // 4. Cross-org outsider — still rejected (IPI-727 coverage, re-proven here
      // against the tightened function body).
      const { error: outsiderErr } = await admin.rpc("commit_shoot_draft", {
        p_brand_id: roleBrandId,
        p_name: `RLS role authz outsider ${stamp}`,
        p_created_by: userRoleOutsider.user.id,
      });
      assert(
        !!outsiderErr && outsiderErr.message.includes("unauthorized"),
        "IPI-732: commit_shoot_draft rejects cross-org outsider",
      );

      // 5. Route/service-level authorization — is_org_editor_or_above() itself,
      // called the same way commitShootDraft() calls it (user-scoped client,
      // no p_created_by involved — this is the pre-RPC gate).
      const { data: ownerCanCreate, error: ownerRoleErr } = await userRoleOwner.client.rpc(
        "is_org_editor_or_above",
        { p_org_id: roleOrgId },
      );
      assert(
        !ownerRoleErr && ownerCanCreate === true,
        "IPI-732: is_org_editor_or_above() is true for the org owner (route-level gate)",
      );

      const { data: viewerCanCreate, error: viewerRoleErr } = await userRoleViewer.client.rpc(
        "is_org_editor_or_above",
        { p_org_id: roleOrgId },
      );
      assert(
        !viewerRoleErr && viewerCanCreate === false,
        "IPI-732: is_org_editor_or_above() is false for the org viewer (route-level gate)",
      );
    } finally {
      if (roleBrandId) {
        await checkedCleanup(
          "IPI-732 role-authz brand (cascades to shoots)",
          admin.from("brands").delete().eq("id", roleBrandId),
        );
      }
      if (roleOrgId) {
        await checkedCleanup(
          "IPI-732 role-authz org_members",
          admin.from("org_members").delete().eq("org_id", roleOrgId),
        );
        await checkedCleanup("IPI-732 role-authz org", admin.from("organizations").delete().eq("id", roleOrgId));
      }
      for (const u of [userRoleOwner, userRoleEditor, userRoleViewer, userRoleOutsider]) {
        if (u?.user?.id) {
          const { error } = await deleteAuthUser(u.user.id);
          if (error) trackCleanupError(`IPI-732 role-authz test user ${u.user.id}: ${error.message}`);
        }
      }
      pass("IPI-732: cleaned up shoot-creation role-authz test fixtures (service role)");
    }
  } else {
    pass("IPI-732: shoot-creation role-authz block skipped (no service role key)");
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
    if (requireServiceRole) {
      trackCleanupError("no SUPABASE_SERVICE_ROLE_KEY — cannot delete test users");
    } else {
      console.warn(
        "warn: set SUPABASE_SERVICE_ROLE_KEY in .env.local to auto-delete test users",
      );
    }
  }
}

if (cleanupFailures > 0) {
  console.error(
    `FAIL: cleanup left ${cleanupFailures} error(s) — fixtures may remain`,
  );
  failures += cleanupFailures;
}

const ok = failures === 0;

// IPI-729 · SB-TEST-003 — domain result banners (separate from overall exit).
console.log("\nDomain summaries");
console.log(
  "  CRM: convert-deal + crm_* probes in this script (editor convert needs profiles row)",
);
console.log("  Planner: planner.* probes in this script (fail-closed, no soft skip)");
console.log("  booking: notifications / talent booking probes in this script");
console.log(
  "  chatbot: grant asserts run in CI workflow (chatbot-grants.sql), not this Node process",
);
console.log(
  `\n${ok ? "RLS verification passed" : `RLS verification failed (${failures})`}` +
    (cleanupFailures ? ` · cleanupFailures=${cleanupFailures}` : ""),
);
process.exit(ok ? 0 : 1);
