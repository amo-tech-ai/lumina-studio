#!/usr/bin/env node
/**
 * Seed a demo brand with profile + scores for local Brand Hub testing.
 *
 * Usage:
 *   node scripts/seed-sample-brand.mjs
 *   node scripts/seed-sample-brand.mjs --email you@example.com
 *   SEED_BRAND_USER_EMAIL=you@example.com node scripts/seed-sample-brand.mjs
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY + NEXT_PUBLIC_SUPABASE_URL (or VITE_* equivalents).
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
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "Missing Supabase URL (VITE_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_URL, or NEXT_SUPABASE_URL) and/or SUPABASE_SERVICE_ROLE_KEY",
  );
  process.exit(1);
}

const emailIdx = process.argv.indexOf("--email");
const emailFromFlag =
  emailIdx !== -1 && process.argv[emailIdx + 1] && !process.argv[emailIdx + 1].startsWith("-")
    ? process.argv[emailIdx + 1]
    : undefined;
const targetEmail =
  process.env.SEED_BRAND_USER_EMAIL ??
  process.argv.find((a) => a.startsWith("--email="))?.slice("--email=".length) ??
  emailFromFlag;

const analyzedAt = new Date().toISOString();

const SAMPLE_PROFILE = {
  name: "Maison Lumière",
  tagline: "Sustainable basics for modern life",
  category: "Apparel",
  industry: "Fashion",
  goal: "Product Photography",
  mission: "Make exceptional essentials accessible without compromise.",
  vision: "A wardrobe built to last, designed for everyday elegance.",
  values: ["Sustainability", "Transparency", "Quality"],
  uvp: "Radical transparency meets timeless design at honest prices.",
  positioning: "Premium essentials for conscious consumers",
  brandPersonality: "Warm, honest, minimalist",
  targetAudience: "Urban professionals 25–40 seeking sustainable wardrobe staples",
  brandVoice: "Clear, approachable, confident without hype",
  instagram_handle: "maisonlumiere",
  sourceUrl: "https://www.everlane.com",
  productionReadiness: 78,
  confidenceScore: 82,
  visualIdentity: {
    colors: ["#F5F0EB", "#1E293B", "#E87C4D"],
    mood: "Minimal, warm, editorial",
    typography: "Serif headlines, clean sans body",
  },
  contentPillars: ["Sustainability", "Craft", "Everyday Style"],
  recommendedServices: ["Product Photography", "Lookbook", "E-commerce PDP"],
  evidenceSources: ["everlane.com", "press coverage", "Instagram grid"],
  competitorSignals: ["Everlane", "Cuyana", "Arket"],
  analyzedAt,
  _lifecycle: "scores_complete",
};

const SAMPLE_SCORES = [
  {
    score_type: "visual",
    score: 72,
    details: {
      confidence: 0.85,
      evidence: ["Consistent product-on-neutral-background shots", "Cohesive earth-tone palette"],
    },
  },
  {
    score_type: "audience",
    score: 81,
    details: {
      confidence: 0.88,
      evidence: ["Clear millennial professional positioning", "Strong DTC messaging"],
    },
  },
  {
    score_type: "consistency",
    score: 68,
    details: {
      confidence: 0.79,
      evidence: ["Typography mostly consistent", "Some campaign vs PDP tone drift"],
    },
  },
  {
    score_type: "commerce_readiness",
    score: 74,
    details: {
      confidence: 0.83,
      evidence: ["Shop-ready PDP imagery", "Size and material info present"],
    },
  },
];

async function resolveUserId(admin) {
  if (targetEmail) {
    const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
    if (error) throw new Error(error.message);
    const user = data.users.find(
      (u) => u.email?.toLowerCase() === targetEmail.toLowerCase(),
    );
    if (!user) throw new Error(`No auth user for email: ${targetEmail}`);
    return { userId: user.id, email: user.email };
  }

  const { data, error } = await admin.auth.admin.listUsers({ perPage: 20 });
  if (error) throw new Error(error.message);
  const users = data.users.filter((u) => u.email);
  if (users.length === 0) {
    throw new Error("No users in project — sign up at /login first, then re-run with --email");
  }
  if (users.length > 1) {
    console.log("Multiple users found — pass --email <your-login-email>");
    for (const u of users.slice(0, 5)) {
      console.log(`  • ${u.email}`);
    }
  }
  const pick = users[0];
  return { userId: pick.id, email: pick.email };
}

async function main() {
  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { userId, email } = await resolveUserId(admin);
  const stamp = Date.now();
  const slug = `maison-lumiere-${stamp}`;

  const { data: org, error: orgErr } = await admin
    .from("organizations")
    .insert({
      name: "Maison Lumière",
      slug,
      owner_id: userId,
      type: "brand",
      plan: "free",
    })
    .select("id")
    .single();

  if (orgErr || !org?.id) {
    throw new Error(orgErr?.message ?? "Failed to create organization");
  }

  await admin.from("org_members").upsert({
    org_id: org.id,
    user_id: userId,
    role: "owner",
  });

  const { data: brand, error: brandErr } = await admin
    .from("brands")
    .insert({
      name: "Maison Lumière",
      brand_url: "https://www.everlane.com",
      user_id: userId,
      org_id: org.id,
      intake_status: "ready",
      ai_profile: SAMPLE_PROFILE,
    })
    .select("id")
    .single();

  if (brandErr || !brand?.id) {
    throw new Error(brandErr?.message ?? "Failed to create brand");
  }

  const scoreRows = SAMPLE_SCORES.map((s) => ({
    brand_id: brand.id,
    score_type: s.score_type,
    score: s.score,
    details: s.details,
    score_version: 1,
    source: "manual",
  }));

  const { error: scoresErr } = await admin.from("brand_scores").insert(scoreRows);
  if (scoresErr) {
    throw new Error(`brand_scores insert failed: ${scoresErr.message}`);
  }

  const hubUrl = `http://localhost:3002/app/brand/${brand.id}`;
  const listUrl = "http://localhost:3002/app/brand";

  console.log("\n✅ Sample brand created\n");
  console.log(`  Brand:     Maison Lumière`);
  console.log(`  ID:        ${brand.id}`);
  console.log(`  Owner:     ${email}`);
  console.log(`  DNA avg:   74 (base 4)`);
  console.log(`  Status:    ready`);
  console.log(`\n  Hub:       ${hubUrl}`);
  console.log(`  List:      ${listUrl}`);
  console.log(`\n  Sign in as ${email} if not already logged in.\n`);
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
