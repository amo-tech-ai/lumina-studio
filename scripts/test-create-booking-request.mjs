#!/usr/bin/env node
/**
 * IPI-340 · MG-3 — integration test for create_booking_request RPC.
 *
 * Usage:
 *   infisical run -- node scripts/test-create-booking-request.mjs
 *
 * Requires SUPABASE_DB_URL or DATABASE_URL (direct Postgres) + service role for seed.
 */
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
const password = "BookingTestPass123!";
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

async function main() {
  let userId;
  let orgId;
  let brandId;
  let talentId;
  let bookingId;

  try {
    const { data: authData, error: authErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (authErr) throw new Error(`createUser: ${authErr.message}`);
    userId = authData.user.id;

    const client = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error: signInErr } = await client.auth.signInWithPassword({ email, password });
    if (signInErr) throw new Error(`signIn: ${signInErr.message}`);

    orgId = sqlQuery(`
      insert into public.organizations (name, slug, owner_id, type)
      values ('IPI340 Org ${stamp}', 'ipi340-org-${stamp}', '${userId}', 'brand')
      returning id
    `);

    brandId = sqlQuery(`
      insert into public.brands (name, user_id, org_id)
      values ('IPI340 Brand ${stamp}', '${userId}', '${orgId}')
      returning id
    `);

    talentId = sqlQuery(`
      insert into talent.talent_profiles (agency_org_id, display_name)
      values ('${orgId}', 'Test Talent ${stamp}')
      returning id
    `);

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
    bookingId = created?.booking_id;

    const rowParts = sqlQuery(`
      select status || '|' || requested_by || '|' || version || '|' || coalesce(message, '')
      from talent.bookings
      where id = '${bookingId}'
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
          and payload->>'booking_id' = '${bookingId}'
      `),
    );
    assert(notifCount >= 1, "insert trigger fires booking_requested notification");

    const { error: denyErr } = await client.rpc("create_booking_request", {
      p_brand_org_id: "00000000-0000-0000-0000-000000000099",
      p_talent_profile_id: talentId,
      p_date_start: "2026-08-01",
      p_date_end: "2026-08-02",
    });
    assert(!!denyErr && /not a member/i.test(denyErr.message), "rejects non-member org");

    const { error: badDateErr } = await client.rpc("create_booking_request", {
      p_brand_org_id: orgId,
      p_talent_profile_id: talentId,
      p_date_start: "2026-08-05",
      p_date_end: "2026-08-01",
    });
    assert(!!badDateErr && /invalid date range/i.test(badDateErr.message), "rejects inverted dates");

    const { error: missingTalentErr } = await client.rpc("create_booking_request", {
      p_brand_org_id: orgId,
      p_talent_profile_id: "00000000-0000-0000-0000-000000000099",
      p_date_start: "2026-08-01",
      p_date_end: "2026-08-02",
    });
    assert(
      !!missingTalentErr && /talent profile not found/i.test(missingTalentErr.message),
      "rejects missing talent",
    );
  } finally {
    if (bookingId) {
      try {
        sqlExec(`delete from talent.bookings where id = '${bookingId}'`);
      } catch {
        /* ignore */
      }
    }
    if (talentId) {
      try {
        sqlExec(`delete from talent.talent_profiles where id = '${talentId}'`);
      } catch {
        /* ignore */
      }
    }
    if (brandId) {
      try {
        sqlExec(`delete from public.brands where id = '${brandId}'`);
      } catch {
        /* ignore */
      }
    }
    if (orgId) {
      try {
        sqlExec(`delete from public.org_members where org_id = '${orgId}'`);
        sqlExec(`delete from public.organizations where id = '${orgId}'`);
      } catch {
        /* ignore */
      }
    }
    if (userId) {
      await admin.auth.admin.deleteUser(userId).catch(() => {});
    }
  }

  console.log(failures === 0 ? "\n✓ create_booking_request tests passed" : `\n✗ ${failures} failure(s)`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
