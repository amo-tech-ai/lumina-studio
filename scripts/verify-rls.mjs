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

const url = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
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

  const { data: otherProfile } = await userA.client
    .from("profiles")
    .select("id")
    .eq("id", userB.user.id);
  assert((otherProfile ?? []).length === 0, "user A cannot read user B profile");

  // brands — own CRUD, cross-user blocked
  const { data: brandA, error: brandInsertErr } = await userA.client
    .from("brands")
    .insert({ name: `RLS Brand A ${stamp}`, user_id: userA.user.id })
    .select("id")
    .single();
  assert(!brandInsertErr && brandA?.id, "user A inserts own brand");
  brandAId = brandA.id;

  const { data: crossBrandRead } = await userB.client
    .from("brands")
    .select("id")
    .eq("id", brandAId);
  assert((crossBrandRead ?? []).length === 0, "user B cannot read user A brand");

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

  const { data: crossScores } = await userB.client
    .from("brand_scores")
    .select("id")
    .eq("brand_id", brandAId);
  assert((crossScores ?? []).length === 0, "user B cannot read user A brand_scores");

  const { error: crossScoreInsertErr } = await userB.client.from("brand_scores").insert({
    brand_id: brandAId,
    score_type: "dna_readiness",
    score: 99,
  });
  assert(!!crossScoreInsertErr, "user B cannot insert brand_score on user A brand");

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

  const { data: crossLinks } = await userB.client
    .from("commerce_product_links")
    .select("id")
    .eq("brand_id", brandAId);
  assert((crossLinks ?? []).length === 0, "user B cannot read user A commerce links");

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

  const { data: crossLogs } = await userB.client
    .from("ai_agent_logs")
    .select("id")
    .eq("id", logA.id);
  assert((crossLogs ?? []).length === 0, "user B cannot read user A ai_agent_logs");
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
