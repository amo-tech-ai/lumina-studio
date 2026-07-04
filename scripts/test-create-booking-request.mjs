#!/usr/bin/env node
/**
 * IPI-340 · MG-3 — integration test for create_booking_request RPC.
 *
 * Usage:
 *   infisical run -- node scripts/test-create-booking-request.mjs
 *
 * Requires SUPABASE_DB_URL or DATABASE_URL (direct Postgres) + service role for seed.
 */
import { randomBytes } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";
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

const dbUrl = process.env.SUPABASE_DB_URL ?? process.env.DATABASE_URL;
const url =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  process.env.NEXT_SUPABASE_URL ??
  process.env.VITE_SUPABASE_URL;
const anonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.NEXT_SUPABASE_PUBLISHABLE_KEY ??
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!dbUrl || !url || !anonKey || !serviceKey) {
  console.error("Missing SUPABASE_DB_URL, Supabase URL, anon key, and/or service role key");
  process.exit(1);
}

const stamp = Date.now();
const password =
  process.env.QA_PASSWORD ??
  process.env.TEST_USER_PASSWORD ??
  `Ipi340-${randomBytes(16).toString("hex")}!`;
const email = `ipi340-booking-${stamp}@example.com`;

let failures = 0;

function fail(msg) {
  console.error(`FAIL: ${msg}`);
  failures += 1;
}

function pass(msg) {
  console.log(`ok: ${msg}`);
}

function assert(cond, msg) {
  if (cond) pass(msg);
  else fail(msg);
}

function sqlLiteral(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function sqlQuery(text) {
  const out = execFileSync(
    "psql",
    [dbUrl, "-v", "ON_ERROR_STOP=1", "-t", "-A", "-c", text],
    { encoding: "utf8" },
  );
  return out.trim().split("\n")[0].trim();
}

function sqlExec(text) {
  execFileSync("psql", [dbUrl, "-v", "ON_ERROR_STOP=1", "-c", text], { stdio: "pipe" });
}

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function makeAnonClient() {
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function createTestUser() {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw new Error(`createUser: ${error.message}`);
  return data.user.id;
}

async function signInClient() {
  const client = makeAnonClient();
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`signIn: ${error.message}`);
  return client;
}

function seedOrgBrandTalent(userId) {
  const orgId = sqlQuery(`
    insert into public.organizations (name, slug, owner_id, type)
    values (${sqlLiteral(`IPI340 Org ${stamp}`)}, ${sqlLiteral(`ipi340-org-${stamp}`)}, ${sqlLiteral(userId)}, 'brand')
    returning id
  `);

  const brandId = sqlQuery(`
    insert into public.brands (name, user_id, org_id)
    values (${sqlLiteral(`IPI340 Brand ${stamp}`)}, ${sqlLiteral(userId)}, ${sqlLiteral(orgId)})
    returning id
  `);

  const talentId = sqlQuery(`
    insert into talent.talent_profiles (agency_org_id, display_name)
    values (${sqlLiteral(orgId)}, ${sqlLiteral(`Test Talent ${stamp}`)})
    returning id
  `);

  return { orgId, brandId, talentId };
}

function seedForeignShoot(userId) {
  const foreignOrgId = sqlQuery(`
    insert into public.organizations (name, slug, owner_id, type)
    values (${sqlLiteral(`IPI340 Foreign Org ${stamp}`)}, ${sqlLiteral(`ipi340-foreign-${stamp}`)}, ${sqlLiteral(userId)}, 'brand')
    returning id
  `);

  const foreignBrandId = sqlQuery(`
    insert into public.brands (name, user_id, org_id)
    values (${sqlLiteral(`IPI340 Foreign Brand ${stamp}`)}, ${sqlLiteral(userId)}, ${sqlLiteral(foreignOrgId)})
    returning id
  `);

  const foreignShootId = sqlQuery(`
    insert into shoot.shoots (brand_id, name, type, created_by)
    values (${sqlLiteral(foreignBrandId)}, ${sqlLiteral(`Foreign Shoot ${stamp}`)}, 'studio_ecommerce', ${sqlLiteral(userId)})
    returning id
  `);

  return { foreignOrgId, foreignBrandId, foreignShootId };
}

async function runSuccessTests(client, ctx) {
  const { orgId, talentId, userId } = ctx;
  const { data: created, error: createErr } = await client.rpc("create_booking_request", {
    p_brand_org_id: orgId,
    p_talent_profile_id: talentId,
    p_date_start: "2026-08-01",
    p_date_end: "2026-08-02",
    p_message: "MG-3 integration test",
  });

  assert(!createErr, `create_booking_request succeeds (${createErr?.message ?? "ok"})`);
  assert(created?.status === "requested", "returns status requested");
  assert(created?.version === 1, "returns version 1");
  assert(!!created?.booking_id, "returns booking_id");
  assert(!!created?.expires_at, "returns expires_at");
  ctx.bookingId = created?.booking_id;

  const rowParts = sqlQuery(`
    select status || '|' || requested_by || '|' || version || '|' || coalesce(message, '')
    from talent.bookings
    where id = ${sqlLiteral(ctx.bookingId)}
  `).split("|");
  assert(rowParts[0] === "requested", "booking row status is requested");
  assert(rowParts[1] === userId, "requested_by is auth.uid()");
  assert(rowParts[2] === "1", "booking row version is 1");
  assert(rowParts[3] === "MG-3 integration test", "message persisted");

  const notifCount = Number(
    sqlQuery(`
      select count(*)::text
      from public.notifications
      where kind = 'booking_requested'
        and payload->>'booking_id' = ${sqlLiteral(ctx.bookingId)}
    `),
  );
  assert(notifCount >= 1, "insert trigger fires booking_requested notification");
}

async function rejectAnonymousCaller(orgId, talentId) {
  const { error } = await makeAnonClient().rpc("create_booking_request", {
    p_brand_org_id: orgId,
    p_talent_profile_id: talentId,
    p_date_start: "2026-08-01",
    p_date_end: "2026-08-02",
  });
  assert(
    !!error &&
      (/authentication required/i.test(error.message) ||
        /permission denied for function create_booking_request/i.test(error.message)),
    "rejects anonymous callers",
  );
}

async function rejectNullOrg(client, talentId) {
  const { error } = await client.rpc("create_booking_request", {
    p_brand_org_id: null,
    p_talent_profile_id: talentId,
    p_date_start: "2026-08-01",
    p_date_end: "2026-08-02",
  });
  assert(
    !!error && /not a member of this organization/i.test(error.message),
    "rejects null brand org id",
  );
}

async function rejectNonMemberOrg(client, talentId) {
  const { error } = await client.rpc("create_booking_request", {
    p_brand_org_id: "00000000-0000-0000-0000-000000000099",
    p_talent_profile_id: talentId,
    p_date_start: "2026-08-01",
    p_date_end: "2026-08-02",
  });
  assert(!!error && /not a member/i.test(error.message), "rejects non-member org");
}

async function rejectInvertedDateRange(client, orgId, talentId) {
  const { error } = await client.rpc("create_booking_request", {
    p_brand_org_id: orgId,
    p_talent_profile_id: talentId,
    p_date_start: "2026-08-05",
    p_date_end: "2026-08-01",
  });
  assert(!!error && /invalid date range/i.test(error.message), "rejects inverted dates");
}

async function rejectPastStartDate(client, orgId, talentId) {
  const { error } = await client.rpc("create_booking_request", {
    p_brand_org_id: orgId,
    p_talent_profile_id: talentId,
    p_date_start: "2020-01-01",
    p_date_end: "2020-01-02",
  });
  assert(!!error && /start date cannot be in the past/i.test(error.message), "rejects past start date");
}

async function rejectNegativeRate(client, orgId, talentId) {
  const { error } = await client.rpc("create_booking_request", {
    p_brand_org_id: orgId,
    p_talent_profile_id: talentId,
    p_date_start: "2026-08-01",
    p_date_end: "2026-08-02",
    p_rate_quoted: -1,
  });
  assert(!!error && /rate_quoted must be non-negative/i.test(error.message), "rejects negative rate");
}

async function rejectMissingTalent(client, orgId) {
  const { error } = await client.rpc("create_booking_request", {
    p_brand_org_id: orgId,
    p_talent_profile_id: "00000000-0000-0000-0000-000000000099",
    p_date_start: "2026-08-01",
    p_date_end: "2026-08-02",
  });
  assert(
    !!error && /talent profile not found/i.test(error.message),
    "rejects missing talent",
  );
}

async function rejectForeignShoot(client, orgId, talentId, foreignShootId) {
  const { error } = await client.rpc("create_booking_request", {
    p_brand_org_id: orgId,
    p_talent_profile_id: talentId,
    p_date_start: "2026-08-01",
    p_date_end: "2026-08-02",
    p_shoot_id: foreignShootId,
  });
  assert(
    !!error && /shoot not found/i.test(error.message),
    "rejects shoot from another organization",
  );
}

async function runRejectionTests(client, ctx) {
  const { orgId, talentId, foreignShootId } = ctx;

  await rejectAnonymousCaller(orgId, talentId);
  await rejectNullOrg(client, talentId);
  await rejectNonMemberOrg(client, talentId);
  await rejectInvertedDateRange(client, orgId, talentId);
  await rejectPastStartDate(client, orgId, talentId);
  await rejectNegativeRate(client, orgId, talentId);
  await rejectMissingTalent(client, orgId);
  await rejectForeignShoot(client, orgId, talentId, foreignShootId);
}

function safeDelete(sql) {
  try {
    sqlExec(sql);
  } catch {
    /* ignore */
  }
}

async function cleanupResources(ctx) {
  const { bookingId, talentId, brandId, orgId, foreignShootId, foreignBrandId, foreignOrgId, userId } =
    ctx;

  if (bookingId) safeDelete(`delete from talent.bookings where id = ${sqlLiteral(bookingId)}`);
  if (talentId) safeDelete(`delete from talent.talent_profiles where id = ${sqlLiteral(talentId)}`);
  if (foreignShootId) safeDelete(`delete from shoot.shoots where id = ${sqlLiteral(foreignShootId)}`);
  if (brandId) safeDelete(`delete from public.brands where id = ${sqlLiteral(brandId)}`);
  if (foreignBrandId) safeDelete(`delete from public.brands where id = ${sqlLiteral(foreignBrandId)}`);
  if (orgId) {
    safeDelete(`delete from public.org_members where org_id = ${sqlLiteral(orgId)}`);
    safeDelete(`delete from public.organizations where id = ${sqlLiteral(orgId)}`);
  }
  if (foreignOrgId) {
    safeDelete(`delete from public.org_members where org_id = ${sqlLiteral(foreignOrgId)}`);
    safeDelete(`delete from public.organizations where id = ${sqlLiteral(foreignOrgId)}`);
  }
  if (userId) {
    await admin.auth.admin.deleteUser(userId).catch(() => {});
  }
}

async function main() {
  const ctx = {};

  try {
    ctx.userId = await createTestUser();
    const client = await signInClient();
    Object.assign(ctx, seedOrgBrandTalent(ctx.userId));
    Object.assign(ctx, seedForeignShoot(ctx.userId));

    await runSuccessTests(client, ctx);
    await runRejectionTests(client, ctx);
  } finally {
    await cleanupResources(ctx);
  }

  console.log(failures === 0 ? "\n✓ create_booking_request tests passed" : `\n✗ ${failures} failure(s)`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
