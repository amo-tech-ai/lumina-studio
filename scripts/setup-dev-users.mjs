#!/usr/bin/env node
/**
 * Set up dev environment: auth users + profiles + seed data.
 *
 * Uses service_role key via Supabase Auth Admin API — never run in production.
 * Idempotent: safe to run multiple times.
 *
 * Usage: node scripts/setup-dev-users.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const envPath = resolve(root, ".env.local");

if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[trimmed.slice(0, eq)]) {
      process.env[trimmed.slice(0, eq)] = val;
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  ?? process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const AUTH_HEADERS = {
  "Content-Type": "application/json",
  apikey: serviceRoleKey,
  Authorization: `Bearer ${serviceRoleKey}`,
};

const DEV_USERS = [
  { email: "alice@acme.com", password: "password123", full_name: "Alice Admin", role: "studio_admin" },
  { email: "bob@acme.com", password: "password123", full_name: "Bob Builder", role: "designer" },
  { email: "carol@acme.com", password: "password123", full_name: "Carol Viewer", role: "photographer" },
];

// ── Step 1: Create or fetch auth users ──────────────────────────────────────

console.log("=== Step 1: Auth users ===\n");

let createdCount = 0;
let foundCount = 0;

for (const user of DEV_USERS) {
  const res = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
    method: "POST",
    headers: AUTH_HEADERS,
    body: JSON.stringify({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: { full_name: user.full_name },
    }),
  });

  if (res.ok) {
    const body = await res.json();
    user.id = body.id;
    console.log(`  ✓ Created ${user.email} → ${user.id}`);
    createdCount++;
    continue;
  }

  const errBody = await res.json().catch(() => ({}));
  if (res.status === 409 || errBody?.msg?.includes("already exists")) {
    const listRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      headers: AUTH_HEADERS,
    });
    if (listRes.ok) {
      const list = await listRes.json();
      const match = list.users?.find((u) => u.email === user.email);
      if (match) {
        user.id = match.id;
        console.log(`  ✓ Found ${user.email} → ${user.id}`);
        foundCount++;
        continue;
      }
    }
  }

  console.error(`  ✗ Failed to create/find ${user.email}: ${res.status}`);
  process.exitCode = 1;
}

console.log(`\nUsers: ${createdCount} created, ${foundCount} found\n`);

// ── Step 2: Upsert profiles ─────────────────────────────────────────────────

console.log("=== Step 2: Profiles ===\n");

const { createClient } = await import("@supabase/supabase-js");
const sb = createClient(supabaseUrl, serviceRoleKey);

for (const user of DEV_USERS) {
  if (!user.id) {
    console.error(`  ✗ No ID for ${user.email} — skipping profile`);
    continue;
  }
  const { error } = await sb.from("profiles").upsert(
    { id: user.id, email: user.email, full_name: user.full_name, role: user.role },
    { onConflict: "id" },
  );
  if (error) {
    console.error(`  ✗ Profile ${user.email}: ${error.message}`);
    process.exitCode = 1;
  } else {
    console.log(`  ✓ Profile ${user.email} (id: ${user.id})`);
  }
}

// ── Step 3: Seed data ───────────────────────────────────────────────────────

console.log("\n=== Step 3: Seed data ===\n");

const A = DEV_USERS.find((u) => u.email === "alice@acme.com").id;
const B = DEV_USERS.find((u) => u.email === "bob@acme.com").id;
const C = DEV_USERS.find((u) => u.email === "carol@acme.com").id;

const ORG_1 = "00000000-0000-0000-0000-000000000001";
const ORG_2 = "00000000-0000-0000-0000-000000000002";
const BRAND_1 = "00000000-0000-0000-0000-000000000201";
const BRAND_2 = "00000000-0000-0000-0000-000000000202";

const SEED_DATA = [
  // Organizations
  { table: "organizations", rows: [
    { id: ORG_1, name: "Acme Corp", slug: "acme", type: "agency", owner_id: A },
    { id: ORG_2, name: "Globex Inc", slug: "globex", type: "brand", owner_id: A },
  ]},
  // Org members (RLS membership)
  { table: "org_members", rows: [
    { id: "00000000-0000-0000-0000-000000000801", org_id: ORG_1, user_id: A, role: "admin" },
    { id: "00000000-0000-0000-0000-000000000802", org_id: ORG_1, user_id: B, role: "member" },
    { id: "00000000-0000-0000-0000-000000000803", org_id: ORG_1, user_id: C, role: "member" },
  ]},
  // Brands
  { table: "brands", rows: [
    { id: BRAND_1, org_id: ORG_1, user_id: A, name: "Nike" },
    { id: BRAND_2, org_id: ORG_1, user_id: A, name: "Adidas" },
  ]},
  // CRM Companies
  { table: "crm_companies", rows: [
    { id: "00000000-0000-0000-0000-000000000301", org_id: ORG_1, brand_id: BRAND_1, name: "Zara", domain: "zara.com", industry: "retail", status: "active", owner: A },
    { id: "00000000-0000-0000-0000-000000000302", org_id: ORG_1, brand_id: BRAND_1, name: "H&M", domain: "hm.com", industry: "retail", status: "prospect", owner: B },
    { id: "00000000-0000-0000-0000-000000000303", org_id: ORG_1, brand_id: BRAND_2, name: "Gucci", domain: "gucci.com", industry: "luxury", status: "active", owner: A },
    { id: "00000000-0000-0000-0000-000000000304", org_id: ORG_1, brand_id: BRAND_2, name: "Balenciaga", domain: "balenciaga.com", industry: "luxury", status: "inactive", owner: B },
    { id: "00000000-0000-0000-0000-000000000305", org_id: ORG_1, brand_id: null, name: "Uniqlo", domain: "uniqlo.com", industry: "retail", status: "lost", owner: A },
  ]},
  // CRM Contacts
  { table: "crm_contacts", rows: [
    { id: "00000000-0000-0000-0000-000000000302", org_id: ORG_1, company_id: "00000000-0000-0000-0000-000000000301", name: "Maria Lopez", email: ["maria.lopez@zara.com"], phone: ["+34-91-123-4567"], role_title: "Procurement Manager" },
    { id: "00000000-0000-0000-0000-000000000303", org_id: ORG_1, company_id: "00000000-0000-0000-0000-000000000301", name: "James Chen", email: ["james.chen@zara.com"], phone: ["+34-91-123-4568"], role_title: "Creative Director" },
    { id: "00000000-0000-0000-0000-000000000304", org_id: ORG_1, company_id: "00000000-0000-0000-0000-000000000302", name: "Elena Ruiz", email: ["elena.ruiz@hm.com"], phone: ["+46-8-555-0100"], role_title: "Brand Manager" },
    { id: "00000000-0000-0000-0000-000000000305", org_id: ORG_1, company_id: "00000000-0000-0000-0000-000000000302", name: "David Kim", email: ["david.kim@hm.se"], phone: ["+46-8-555-0101"], role_title: "Production Lead" },
    { id: "00000000-0000-0000-0000-000000000306", org_id: ORG_1, company_id: "00000000-0000-0000-0000-000000000303", name: "Sophie Dubois", email: ["sophie.dubois@gucci.com", "sophie.dubois@personal.it"], phone: ["+39-055-123-4567", "+39-335-987-6543"], role_title: "Senior Buyer" },
    { id: "00000000-0000-0000-0000-000000000307", org_id: ORG_1, company_id: "00000000-0000-0000-0000-000000000303", name: "Marco Rossi", email: ["marco.rossi@gucci.com"], phone: [], role_title: "Photographer" },
    { id: "00000000-0000-0000-0000-000000000308", org_id: ORG_1, company_id: "00000000-0000-0000-0000-000000000304", name: "Yuki Tanaka", email: ["yuki.tanaka@balenciaga.com"], phone: ["+33-1-234-5678"], role_title: "Marketing Director" },
    { id: "00000000-0000-0000-0000-000000000309", org_id: ORG_1, company_id: "00000000-0000-0000-0000-000000000305", name: "Anna Svensson", email: ["anna.s@uniqlo.com"], phone: ["+81-3-5555-0100"], role_title: "Merchandiser" },
  ]},
  // Campaigns
  { table: "campaigns", rows: [
    { id: "00000000-0000-0000-0000-000000000401", org_id: ORG_1, brand_id: BRAND_1, name: "SS26 Collection", status: "active", objective: "product_launch", start_date: "2026-01-01", end_date: "2026-06-30" },
    { id: "00000000-0000-0000-0000-000000000402", org_id: ORG_1, brand_id: BRAND_1, name: "AW26 Campaign", status: "planning", objective: "brand_awareness", start_date: "2026-07-01", end_date: "2026-12-31" },
    { id: "00000000-0000-0000-0000-000000000403", org_id: ORG_1, brand_id: BRAND_2, name: "Gucci Resort 27", status: "complete", objective: "ecommerce_direct", start_date: "2026-03-01", end_date: "2026-05-31" },
  ]},
  // Campaign deliverables
  { table: "campaign_deliverables", rows: [
    { id: "00000000-0000-0000-0000-000000000411", campaign_id: "00000000-0000-0000-0000-000000000401", phase: 1, label: "Creative Brief", status: "approved", due_date: "2026-01-15", assigned_to: A },
    { id: "00000000-0000-0000-0000-000000000412", campaign_id: "00000000-0000-0000-0000-000000000401", phase: 2, label: "Moodboard", status: "approved", due_date: "2026-02-01", assigned_to: B },
    { id: "00000000-0000-0000-0000-000000000413", campaign_id: "00000000-0000-0000-0000-000000000401", phase: 3, label: "Shot List", status: "in_progress", due_date: "2026-02-15", assigned_to: A },
    { id: "00000000-0000-0000-0000-000000000414", campaign_id: "00000000-0000-0000-0000-000000000401", phase: 4, label: "Production", status: "pending", due_date: "2026-03-01", assigned_to: null },
    { id: "00000000-0000-0000-0000-000000000415", campaign_id: "00000000-0000-0000-0000-000000000402", phase: 1, label: "Creative Brief", status: "pending", due_date: "2026-07-15", assigned_to: A },
    { id: "00000000-0000-0000-0000-000000000416", campaign_id: "00000000-0000-0000-0000-000000000403", phase: 5, label: "Editing", status: "approved", due_date: "2026-05-15", assigned_to: B },
  ]},
  // CRM Deals
  { table: "crm_deals", rows: [
    { id: "00000000-0000-0000-0000-000000000601", org_id: ORG_1, company_id: "00000000-0000-0000-0000-000000000301", stage: "qualified", value: 50000, campaign_id: "00000000-0000-0000-0000-000000000401", owner: A, expected_close_date: "2026-08-15" },
    { id: "00000000-0000-0000-0000-000000000602", org_id: ORG_1, company_id: "00000000-0000-0000-0000-000000000302", stage: "lead", value: 15000, owner: B, expected_close_date: "2026-09-01" },
    { id: "00000000-0000-0000-0000-000000000603", org_id: ORG_1, company_id: "00000000-0000-0000-0000-000000000303", stage: "proposal", value: 120000, campaign_id: "00000000-0000-0000-0000-000000000403", owner: A, expected_close_date: "2026-07-30" },
    { id: "00000000-0000-0000-0000-000000000604", org_id: ORG_1, company_id: "00000000-0000-0000-0000-000000000302", stage: "negotiation", value: 28000, campaign_id: "00000000-0000-0000-0000-000000000401", owner: A, expected_close_date: "2026-07-15" },
  ]},
  // CRM Activities
  { table: "crm_activities", rows: [
    { id: "00000000-0000-0000-0000-000000000501", org_id: ORG_1, company_id: "00000000-0000-0000-0000-000000000301", contact_id: "00000000-0000-0000-0000-000000000302", type: "meeting", body: "Initial pitch — presented Spring collection moodboards.", completed_at: "2026-06-15T10:00:00Z", created_by: A },
    { id: "00000000-0000-0000-0000-000000000502", org_id: ORG_1, company_id: "00000000-0000-0000-0000-000000000301", type: "note", body: "Zara requested updated pricing for SS26.", created_by: B },
    { id: "00000000-0000-0000-0000-000000000503", org_id: ORG_1, company_id: "00000000-0000-0000-0000-000000000302", contact_id: "00000000-0000-0000-0000-000000000304", type: "email", body: "Follow-up on H&M brief — sent lookbook references.", due_at: "2026-07-10T14:00:00Z", created_by: A },
    { id: "00000000-0000-0000-0000-000000000504", org_id: ORG_1, company_id: null, contact_id: null, deal_id: "00000000-0000-0000-0000-000000000601", type: "task", body: "Draft contract terms for Spring deal.", due_at: "2026-07-15T17:00:00Z", created_by: A },
    { id: "00000000-0000-0000-0000-000000000505", org_id: ORG_1, company_id: "00000000-0000-0000-0000-000000000303", contact_id: "00000000-0000-0000-0000-000000000306", deal_id: "00000000-0000-0000-0000-000000000603", type: "call", body: "Discussed shoot dates for AW26. Sophie prefers late August.", due_at: "2026-07-08T11:00:00Z", created_by: B },
    { id: "00000000-0000-0000-0000-000000000506", org_id: ORG_1, company_id: "00000000-0000-0000-0000-000000000304", contact_id: "00000000-0000-0000-0000-000000000308", type: "note", body: "Balenciaga scouting — discussed potential AW26 collab.", completed_at: "2026-06-20T14:30:00Z", created_by: A },
    { id: "00000000-0000-0000-0000-000000000507", org_id: ORG_1, company_id: "00000000-0000-0000-0000-000000000305", type: "email", body: "Re-engagement outreach to Uniqlo. No response yet.", due_at: "2026-07-20T09:00:00Z", created_by: B },
    { id: "00000000-0000-0000-0000-000000000508", org_id: ORG_1, company_id: null, contact_id: null, deal_id: "00000000-0000-0000-0000-000000000601", type: "ai_summary", body: "Deal qualified — budget confirmed at $50k. Next: proposal.", created_by: A },
    { id: "00000000-0000-0000-0000-000000000509", org_id: ORG_1, company_id: "00000000-0000-0000-0000-000000000301", contact_id: "00000000-0000-0000-0000-000000000303", type: "meeting", body: "James Chen reviewed moodboards. Requested 3 alternates for hero shot.", due_at: "2026-06-25T15:00:00Z", created_by: B },
    { id: "00000000-0000-0000-0000-000000000510", org_id: ORG_1, company_id: null, contact_id: null, deal_id: "00000000-0000-0000-0000-000000000604", type: "task", body: "Finalize negotiation terms — $28k SS26 production.", due_at: "2026-07-05T12:00:00Z", created_by: A },
  ]},
  // Notifications
  { table: "notifications", rows: [
    { id: "00000000-0000-0000-0000-000000000701", kind: "approval_request", channel: "in-app", read: false, payload: { message: "New brand intake pending review", brand_id: BRAND_1 }, brand_org_id: ORG_1 },
    { id: "00000000-0000-0000-0000-000000000702", kind: "deal_update", channel: "in-app", read: false, payload: { message: "Zara deal moved to qualified — $50k", deal_id: "00000000-0000-0000-0000-000000000601" }, brand_org_id: ORG_1, crm_deal_id: "00000000-0000-0000-0000-000000000601" },
    { id: "00000000-0000-0000-0000-000000000703", kind: "campaign_milestone", channel: "in-app", read: true, payload: { message: "SS26 campaign is now active", campaign_id: "00000000-0000-0000-0000-000000000401" }, brand_org_id: ORG_1 },
    { id: "00000000-0000-0000-0000-000000000704", kind: "approval_request", channel: "in-app", read: false, payload: { message: "Shot list ready for review — SS26 Collection", campaign_id: "00000000-0000-0000-0000-000000000401" }, brand_org_id: ORG_1 },
    { id: "00000000-0000-0000-0000-000000000705", kind: "deal_update", channel: "in-app", read: true, payload: { message: "H&M deal in negotiation — $28k", deal_id: "00000000-0000-0000-0000-000000000604" }, brand_org_id: ORG_1, crm_deal_id: "00000000-0000-0000-0000-000000000604" },
  ]},
];

let inserted = 0;
let skipped = 0;

for (const { table, rows } of SEED_DATA) {
  for (const row of rows) {
    const { error } = await sb.from(table).upsert(row, { onConflict: "id", ignoreDuplicates: true });
    if (error) {
      console.error(`  ✗ ${table}/${row.id?.slice(0, 8)}: ${error.message}`);
      process.exitCode = 1;
    } else {
      inserted++;
    }
  }
}

console.log(`\nSeed data: ${inserted} rows inserted\n`);

// ── Verify counts ───────────────────────────────────────────────────────────

console.log("=== Row counts ===\n");

const TABLES = ["profiles", "organizations", "brands", "crm_companies", "crm_contacts",
  "campaigns", "campaign_deliverables", "crm_deals", "crm_activities", "notifications"];

for (const t of TABLES) {
  const { count, error } = await sb.from(t).select("*", { count: "exact", head: true });
  if (error) {
    console.error(`  ✗ ${t}: ${error.message}`);
  } else {
    console.log(`  ${t}: ${count}`);
  }
}

console.log("\nDone. Environment ready for development.");
