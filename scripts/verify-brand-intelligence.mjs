#!/usr/bin/env node
/**
 * Smoke test brand-intelligence edge function (remote).
 * HITL: analyze creates draft only; commit approve writes brands + scores.
 * Run: npm run supabase:verify-brand-intelligence
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

async function main() {
  console.log("brand-intelligence verification (HITL analyze + commit)\n");

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
    body: JSON.stringify({ action: "analyze", url: testBrandUrl }),
  });
  if (anon.res.status === 401) {
    pass("brand-intelligence rejects anonymous call");
  } else {
    fail(`expected 401 without JWT, got ${anon.res.status}`);
  }

  const authed = await fetchJson("/brand-intelligence", {
    method: "POST",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ action: "analyze", url: testBrandUrl }),
  });

  if (
    authed.res.status !== 200 ||
    authed.json?.ok !== true ||
    !authed.json?.data?.draftId
  ) {
    fail(
      `analyze → ${authed.res.status} ${authed.text?.slice(0, 300)}`,
    );
  } else {
    const { draftId, logId, scores, status } = authed.json.data;
    pass(`analyze draftId=${draftId} status=${status} scores=${scores?.length ?? 0} logId=${logId}`);
  }

  const draftId = authed.json?.data?.draftId;

  if (draftId) {
    const { data: draft, error: draftErr } = await admin
      .from("brand_intake_drafts")
      .select("id, status, draft_profile")
      .eq("id", draftId)
      .single();
    if (draftErr || draft?.status !== "pending" || !draft?.draft_profile?.name) {
      fail("brand_intake_drafts row missing or not pending");
    } else {
      pass(`brand_intake_drafts pending name=${draft.draft_profile.name}`);
    }

    const { count: brandCount } = await admin
      .from("brands")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);
    if ((brandCount ?? 0) > 0) {
      fail(`expected no brands after analyze-only, got ${brandCount}`);
    } else {
      pass("no brands row after analyze-only");
    }

    const { data: userBrands } = await admin
      .from("brands")
      .select("id")
      .eq("user_id", userId);
    const userBrandIds = userBrands?.map((b) => b.id) ?? [];

    let userScoreCount = 0;
    if (userBrandIds.length > 0) {
      const { count } = await admin
        .from("brand_scores")
        .select("*", { count: "exact", head: true })
        .in("brand_id", userBrandIds);
      userScoreCount = count ?? 0;
    }

    if (userScoreCount > 0) {
      fail(`expected no brand_scores for user after analyze-only, got ${userScoreCount}`);
    } else {
      pass("no brand_scores for user after analyze-only");
    }

    const commit = await fetchJson("/brand-intelligence", {
      method: "POST",
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "commit",
        draftId,
        decision: "approve",
      }),
    });

    if (
      commit.res.status !== 200 ||
      commit.json?.ok !== true ||
      !commit.json?.data?.brandId
    ) {
      fail(`commit approve → ${commit.res.status} ${commit.text?.slice(0, 300)}`);
    } else {
      pass(`commit approve brandId=${commit.json.data.brandId}`);
    }

    const brandId = commit.json?.data?.brandId;
    if (brandId) {
      const { data: brand, error: brandErr } = await admin
        .from("brands")
        .select("id, user_id, ai_profile, intake_status")
        .eq("id", brandId)
        .single();
      if (brandErr || !brand?.ai_profile?.name || brand.intake_status !== "approved") {
        fail("brands row not populated after approve");
      } else {
        pass(`brands.ai_profile.name=${brand.ai_profile.name} intake_status=approved`);
      }

      const { count, error: scoreErr } = await admin
        .from("brand_scores")
        .select("*", { count: "exact", head: true })
        .eq("brand_id", brandId);
      if (scoreErr || (count ?? 0) < 3) {
        fail(`brand_scores count expected >=3 after approve, got ${count}`);
      } else {
        pass(`brand_scores count=${count} after approve`);
      }
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

  await admin.auth.admin.deleteUser(userId);
  pass("cleaned up test user");

  console.log(
    failures
      ? "\nBrand intelligence verification FAILED"
      : "\nBrand intelligence verification passed",
  );
  process.exit(failures ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
