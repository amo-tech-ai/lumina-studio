#!/usr/bin/env node
/**
 * verify-assets-rls.mjs — IPI-956 / CLD-RLS-001 focused verifier
 * 12 real-JWT probes + policy inventory assertions for assets RLS.
 * Reuses verify-rls.mjs patterns: createTestUser, org trigger, admin seeding, cleanup.
 * Run: node scripts/verify-assets-rls.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import pg from "pg";
import ws from "ws";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, "..");

function loadEnvFile(path) {
  try {
    const content = readFileSync(path, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
      if (!(key in process.env)) process.env[key] = val;
    }
  } catch {
    // ignore missing
  }
}

loadEnvFile(resolve(ROOT, ".env.local"));
loadEnvFile(resolve(ROOT, "app/.env.local"));

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DB_URL = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
const REQUIRE_SERVICE_ROLE = process.env.REQUIRE_SERVICE_ROLE === "1";

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("❌ Missing SUPABASE_URL or ANON_KEY");
  process.exit(1);
}
if (REQUIRE_SERVICE_ROLE && !SERVICE_ROLE_KEY) {
  console.error("❌ REQUIRE_SERVICE_ROLE=1 but SUPABASE_SERVICE_ROLE_KEY missing");
  process.exit(1);
}

const admin = SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false }, realtime: { transport: ws } })
  : null;

const anon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { autoRefreshToken: false, persistSession: false }, realtime: { transport: ws } });

let passCount = 0, failCount = 0;
function pass(msg) { console.log(`✅ ${msg}`); passCount++; }
function fail(msg) { console.error(`❌ ${msg}`); failCount++; }
function assert(cond, msg) { cond ? pass(msg) : fail(msg); }
function assertSelectDenied(err, data, msg) {
  const denied = err && (err.code === "PGRST301" || err.message?.includes("row-level security"));
  const empty = !err && (!data || (Array.isArray(data) && data.length === 0) || (data && typeof data === "object" && Object.keys(data).length === 0));
  (denied || empty) ? pass(msg) : fail(`${msg} — got data: ${JSON.stringify(data)} err: ${err?.message}`);
}

async function createTestUser(email, password) {
  if (!admin) throw new Error("Service role required for createTestUser");
  const { error: createError } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (createError) throw new Error(`createUser ${email}: ${createError.message}`);
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { autoRefreshToken: false, persistSession: false }, realtime: { transport: ws } });
  const { error: signUpError } = await client.auth.signUp({ email, password });
  if (signUpError) throw new Error(`signUp ${email}: ${signUpError.message}`);
  const { data, error: signInError } = await client.auth.signInWithPassword({ email, password });
  if (signInError || !data.session?.user) throw new Error(`signIn ${email}: ${signInError?.message ?? "no session"}`);
  return { client, user: data.session.user, session: data.session };
}

async function deleteAuthUser(userId) {
  if (!admin) return { error: null };
  const { error } = await admin.auth.admin.deleteUser(userId);
  return { error };
}

const stamp = Date.now().toString(36);
const TEST_EMAIL = (suffix) => `rls-assets-${suffix}-${stamp}@test.local`;
const PASSWORD = "TestPass123!";

let userA, userB, userC, userD;
let orgAId, orgCId, brandAId, brandCId, legacyShootId;
let assetOwner, assetOwnerWithLegacyShoot, assetLegacyDesignerForeignBrand, assetNullBrand;

async function cleanup() {
  if (!admin) return;
  for (const id of [assetOwner, assetOwnerWithLegacyShoot, assetLegacyDesignerForeignBrand, assetNullBrand].filter(Boolean)) {
    await admin.from("assets").delete().eq("id", id);
  }
  if (legacyShootId) await admin.from("shoots").delete().eq("id", legacyShootId);
  if (brandAId) await admin.from("brands").delete().eq("id", brandAId);
  if (brandCId) await admin.from("brands").delete().eq("id", brandCId);
  if (orgAId) {
    await admin.from("org_members").delete().eq("org_id", orgAId);
    await admin.from("organizations").delete().eq("id", orgAId);
  }
  if (orgCId) {
    await admin.from("org_members").delete().eq("org_id", orgCId);
    await admin.from("organizations").delete().eq("id", orgCId);
  }
  for (const u of [userA, userB, userC, userD].filter(Boolean)) {
    if (u?.user?.id) await deleteAuthUser(u.user.id);
  }
}

async function run() {
  try {
    console.log("🔧 Setting up test users and data...\n");

    userA = await createTestUser(TEST_EMAIL("owner"), PASSWORD);
    userB = await createTestUser(TEST_EMAIL("orgmember"), PASSWORD);
    userC = await createTestUser(TEST_EMAIL("outsider"), PASSWORD);
    userD = await createTestUser(TEST_EMAIL("legacydesigner"), PASSWORD);
    pass("Created 4 test users (owner, org-member, outsider, legacy-designer)");

    // Org via userA (trigger auto-adds owner to org_members)
    const { data: orgA, error: orgErr } = await userA.client
      .from("organizations")
      .insert({ name: `RLS Assets Org ${stamp}`, slug: `rls-assets-org-${stamp}`, owner_id: userA.user.id, type: "brand" })
      .select("id")
      .single();
    assert(!orgErr && orgA?.id, "user A creates org (trigger adds owner to org_members)");
    orgAId = orgA.id;

    // Add userB as org member (userC stays outsider)
    const { error: omErrB } = await admin.from("org_members").insert({ org_id: orgAId, user_id: userB.user.id, role: "viewer" });
    assert(!omErrB, "admin adds user B to org_members");

    // userC creates their own org and brand (for test 10 - foreign brand)
    const { data: orgC, error: orgCErr } = await userC.client
      .from("organizations")
      .insert({ name: `RLS Org C ${stamp}`, slug: `rls-org-c-${stamp}`, owner_id: userC.user.id, type: "brand" })
      .select("id")
      .single();
    assert(!orgCErr && orgC?.id, "user C creates own org");
    orgCId = orgC.id;

    const { data: brandC, error: brandCErr } = await userC.client
      .from("brands")
      .insert({ name: `RLS Brand C ${stamp}`, user_id: userC.user.id, org_id: orgCId })
      .select("id")
      .single();
    assert(!brandCErr && brandC?.id, "user C inserts brand in own org");
    brandCId = brandC.id;

    // Brand under org, owned by userA
    const { data: brandA, error: brandErr } = await userA.client
      .from("brands")
      .insert({ name: `RLS Brand A ${stamp}`, user_id: userA.user.id, org_id: orgAId })
      .select("id")
      .single();
    assert(!brandErr && brandA?.id, "user A inserts brand in own org");
    brandAId = brandA.id;

    // Legacy shoot with designer_id = userD
    const { data: legacyShoot, error: shootErr } = await admin
      .from("shoots")
      .insert({
        designer_id: userD.user.id,
        shoot_type: "photography",
        fashion_category: "womenswear",
        style_type: "lifestyle",
        looks_count: 5,
        estimated_quote: 10000,
      })
      .select("id")
      .single();
    assert(!shootErr && legacyShoot?.id, "admin creates legacy shoot with designer_id = user D");
    legacyShootId = legacyShoot.id;

    // Seed assets via admin (bypass RLS)
    const baseAsset = { url: `https://example.com/asset-${stamp}.jpg`, asset_type: "image", status: "draft", dna_pillars: {} };

    const { data: a1 } = await admin.from("assets").insert({ ...baseAsset, brand_id: brandAId }).select("id").single();
    assetOwner = a1?.id;
    assert(assetOwner, "admin seeds asset1 (owner brand, no shoot)");

    const { data: a2 } = await admin.from("assets").insert({ ...baseAsset, brand_id: brandAId, shoot_id: legacyShootId }).select("id").single();
    assetOwnerWithLegacyShoot = a2?.id;
    assert(assetOwnerWithLegacyShoot, "admin seeds asset2 (owner brand + legacy shoot)");

    const { data: a3 } = await admin.from("assets").insert({ ...baseAsset, brand_id: brandAId, shoot_id: legacyShootId }).select("id").single();
    assetLegacyDesignerForeignBrand = a3?.id;
    assert(assetLegacyDesignerForeignBrand, "admin seeds asset3 (foreign brand + legacy shoot, designer = user D)");

    const { data: a4 } = await admin.from("assets").insert({ ...baseAsset, brand_id: null, shoot_id: legacyShootId }).select("id").single();
    assetNullBrand = a4?.id;
    assert(assetNullBrand, "admin seeds asset4 (NULL brand + legacy shoot)");

    console.log("\n📋 Running 12 real-JWT probes...\n");

    // 1. Owner reads own asset (brand path)
    {
      const { data, error } = await userA.client.from("assets").select("id").eq("id", assetOwner);
      assert(!error && data?.length === 1, "1. Owner reads own asset via brand path");
    }

    // 2. Org member reads owner's asset (org path)
    {
      const { data, error } = await userB.client.from("assets").select("id").eq("id", assetOwner);
      assert(!error && data?.length === 1, "2. Org member reads owner's asset via org path");
    }

    // 3. Outsider reads owner's asset → 0 rows
    {
      const { data, error } = await userC.client.from("assets").select("id").eq("id", assetOwner);
      assertSelectDenied(error, data, "3. Outsider cannot read owner's asset (0 rows)");
    }

    // 4. Legacy designer reads asset on foreign brand + legacy shoot → 0 rows (backdoor closed)
    {
      const { data, error } = await userD.client.from("assets").select("id").eq("id", assetLegacyDesignerForeignBrand);
      assertSelectDenied(error, data, "4. Legacy designer cannot read foreign brand asset via shoot backdoor (0 rows)");
    }

    // 5. Owner inserts into own brand → OK
    {
      const { data, error } = await userA.client
        .from("assets")
        .insert({ ...baseAsset, brand_id: brandAId })
        .select("id")
        .single();
      assert(!error && data?.id, "5. Owner inserts into own brand (OK)");
      if (data?.id) await admin.from("assets").delete().eq("id", data.id);
    }

    // 6. Outsider inserts into owner's brand → denied
    {
      const { data, error } = await userC.client
        .from("assets")
        .insert({ ...baseAsset, brand_id: brandAId })
        .select("id")
        .single();
      assert(!!error, "6. Outsider cannot insert into owner's brand (denied)");
    }

    // 7. Insert with brand_id NULL → denied (FK allows NULL but RLS blocks)
    {
      const { data, error } = await userA.client
        .from("assets")
        .insert({ ...baseAsset, brand_id: null })
        .select("id")
        .single();
      assert(!!error, "7. Insert with brand_id NULL denied by RLS");
    }

    // 8. Legacy designer + own shoot + foreign brand insert → denied
    {
      const { data, error } = await userD.client
        .from("assets")
        .insert({ ...baseAsset, brand_id: brandAId, shoot_id: legacyShootId })
        .select("id")
        .single();
      assert(!!error, "8. Legacy designer cannot insert into foreign brand via own shoot (denied)");
    }

    // 9. Owner updates own asset → OK
    {
      const { data, error } = await userA.client
        .from("assets")
        .update({ status: "approved" })
        .eq("id", assetOwner)
        .select("id")
        .single();
      assert(!error && data?.id, "9. Owner updates own asset (OK)");
      await userA.client.from("assets").update({ status: "draft" }).eq("id", assetOwner);
    }

    // 10. Owner retargets asset to foreign brand → denied (WITH CHECK)
    {
      const { data, error } = await userA.client
        .from("assets")
        .update({ brand_id: brandCId })
        .eq("id", assetOwner)
        .select("id")
        .single();
      assert(!!error, "10. Owner cannot retarget asset to foreign brand (WITH CHECK denies)");
    }

    // 11. Authenticated DELETE → denied (no DELETE policy)
    {
      const { error } = await userA.client.from("assets").delete().eq("id", assetOwner);
      // Verify asset still exists (DELETE should affect 0 rows due to RLS)
      const { data: stillExists } = await userA.client.from("assets").select("id").eq("id", assetOwner);
      assert(!error && stillExists?.length === 1, "11. Authenticated DELETE denied (asset still exists, 0 rows affected)");
    }

    // 12. Anon access → denied
    {
      const { data, error } = await anon.from("assets").select("id").eq("id", assetOwner);
      assertSelectDenied(error, data, "12. Anon cannot read assets (denied)");
    }

    console.log("\n📋 Policy inventory assertions...\n");

    // Policy inventory via pg Client (requires DB_URL)
    if (DB_URL) {
      const pgClient = new pg.Client({ connectionString: DB_URL });
      await pgClient.connect();
      try {
        const { rows } = await pgClient.query(`
          SELECT policyname, cmd, roles, qual, with_check
          FROM pg_policies
          WHERE schemaname = 'public' AND tablename = 'assets'
          ORDER BY policyname
        `);
        console.log("Current assets policies:", rows.map(r => r.policyname).join(", "));

        const selectPolicies = rows.filter(r => (r.cmd === "SELECT" || r.cmd === "ALL") && r.roles && r.roles.includes("authenticated"));
        const insertPolicies = rows.filter(r => (r.cmd === "INSERT" || r.cmd === "ALL") && r.roles && r.roles.includes("authenticated"));
        const updatePolicies = rows.filter(r => (r.cmd === "UPDATE" || r.cmd === "ALL") && r.roles && r.roles.includes("authenticated"));
        const deletePolicies = rows.filter(r => (r.cmd === "DELETE" || r.cmd === "ALL") && r.roles && r.roles.includes("authenticated"));

        assert(selectPolicies.length === 1, `Policy inventory: exactly 1 authenticated SELECT policy (found ${selectPolicies.length})`);
        assert(insertPolicies.length === 1, `Policy inventory: exactly 1 authenticated INSERT policy (found ${insertPolicies.length})`);
        assert(updatePolicies.length === 1, `Policy inventory: exactly 1 authenticated UPDATE policy (found ${updatePolicies.length})`);
        assert(deletePolicies.length === 0, `Policy inventory: zero authenticated DELETE policies (found ${deletePolicies.length})`);

        const allText = rows.map(r => (r.qual || "") + (r.with_check || "")).join(" ");
        assert(!allText.includes("shoots"), "Policy inventory: no policy references 'shoots'");
        assert(!allText.includes("designer_id"), "Policy inventory: no policy references 'designer_id'");
        assert(!allText.includes("shoot_id"), "Policy inventory: no policy references 'shoot_id'");
      } finally {
        await pgClient.end();
      }
    } else {
      console.log("⚠️  DB_URL not set — skipping pg policy inventory (run with SUPABASE_DB_URL or DATABASE_URL for full check)");
    }

    console.log(`\n📊 Results: ${passCount} passed, ${failCount} failed`);
    if (failCount > 0) process.exitCode = 1;
  } catch (e) {
    console.error("💥 Verifier crashed:", e);
    process.exitCode = 1;
  } finally {
    await cleanup();
  }
}

run();
