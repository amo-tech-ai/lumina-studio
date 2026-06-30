---
title: Supabase Live Audit
version: "1.0"
lastUpdated: "2026-06-29"
method: Supabase MCP (project-0-ipix-supabase)
score: 81
---

# Supabase Live Audit

**Project:** remote-only (`nvdlhrodvevgwdsneplk`) · **Policy:** no local `supabase start`  
**Tooling:** `list_tables`, `list_edge_functions`, `list_migrations`, `list_storage_buckets`, `get_advisors`, `execute_sql`

---

## Connection

| Check | Result |
|-------|--------|
| MCP project connection | 🟢 |
| Migrations applied | 🟢 **119** migrations through `20260628173206_mastra_rls_hardening` |
| Typegen in app | 🟢 `app/src/types/supabase.ts` |

---

## Core iPix tables (live row counts)

| Table | RLS | Rows | Role |
|-------|:---:|:----:|------|
| `profiles` | 🟢 | 66 | Auth-linked users |
| `organizations` | 🟢 | 74 | Multi-tenant orgs |
| `org_members` | 🟢 | 67 | Membership |
| `brands` | 🟢 | 67 | Brand intelligence core |
| `brand_scores` | 🟢 | 204 | DNA scoring dimensions |
| `brand_intake_drafts` | 🟢 | 18 | HITL staging |
| `brand_crawl_results` | 🟢 | 180 | Firecrawl pages |
| `brand_crawls` | 🟢 | 15 | Crawl jobs |
| `brand_agent_results` | 🟢 | 18 | Agent output |
| `brand_social_channels` | 🟢 | 18 | Social discovery |
| `brand_competitors` | 🟢 | 18 | Competitor intel |
| `shoots` | 🟢 | 2 | Shoot bookings |
| `assets` | 🟢 | 2 | Media metadata |
| `cloudinary_assets` | 🟢 | **0** | Cloudinary linkage |
| `commerce_product_links` | 🟢 | 29 | Mercur product links |
| `ai_agent_logs` | 🟢 | 133 | Edge/agent audit |
| `platforms` / `image_specs` | 🟢 | 7 / 9 | Media intelligence |
| `mastra_workflow_snapshot` | 🟢 | 2082 | HITL suspend/resume |
| `mastra_messages` / `mastra_threads` | 🟢 | 27 / 11 | Mastra persistence |

---

## Missing tables (product gaps)

| Expected feature | Table | Status | Blocker |
|------------------|-------|:------:|---------|
| Campaigns workspace | `campaigns` | 🔴 **missing** | P8 / DESIGN-058 needs migration |
| Matching engine | `matches` / partners | 🔴 **missing** | P9 / DESIGN-059 |
| Operator Stripe | `checkout_sessions`, etc. | 🔴 **missing** | STR-001–003 |
| Campaign detail route | — | 🔴 | DESIGN-L1 gated |

**Verified:** `SELECT … tablename LIKE '%campaign%'` → **empty**.

---

## RLS posture

| Finding | Level | Action |
|---------|-------|--------|
| All public tables have RLS enabled | 🟢 | — |
| `chatbot_*` tables RLS enabled, no policies | INFO | **Intentional** — service-role writes only |
| Legacy event/fashion-show tables (0 rows) | 🟡 | Out of MVP scope; RLS present |
| Mastra tables RLS hardened | 🟢 | Migration `mastra_rls_hardening` |
| Brand scores org-scoped policies | 🟢 | Multiple repair migrations |

**Risk:** Run `npm run supabase:verify-rls` before any new migration merge.

---

## Edge functions (deployed)

| Function | JWT verify | iPix MVP |
|----------|:----------:|----------|
| `brand-intelligence` | ✅ | 🟢 Core BI |
| `start-brand-crawl` | ✅ | 🟢 Firecrawl |
| `firecrawl-webhook` | ❌ | 🟢 Webhook (expected) |
| `audit-asset-dna` | ✅ | 🟡 DNA scoring |
| `capture-lead` | ❌ | 🟢 Marketing |
| `health` / `edge-test` | mixed | 🟢 Ops |
| Legacy: `generate-event-draft`, `generate-media`, … | mixed | ⚪ FashionOS event era — not operator MVP |

**Gap:** No dedicated Cloudinary upload edge fn in repo MVP set — upload today is app-side fetch (visual-identity) or pending DESIGN-074a.

---

## Storage vs Cloudinary boundary

| Store | Status | Use |
|-------|:------:|-----|
| Supabase Storage buckets | 🔴 **0 buckets** | Not used for operator media |
| Cloudinary | 🟡 schema only | `cloudinary_assets` + `assets.cloudinary_public_id` |
| Mercur media | ⚪ separate | Commerce catalog |

**Rule:** Operator shoot assets → **Cloudinary** metadata in Supabase; not Storage buckets (unless future thumbnail cache).

---

## Auth & secrets

| Config | App expectation |
|--------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Client + SSR |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser (RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server API routes only — **never client** |
| `DATABASE_URL` | Mastra `@mastra/pg` pooler `:6543` |
| Edge secrets | Supabase Dashboard — `GEMINI_API_KEY`, `FIRECRAWL_*`, etc. |

---

## Required migrations (planned)

| Migration need | Task | Priority |
|----------------|------|----------|
| Shoot detail RPCs / views | IPI-209 | P0 |
| Campaigns schema | IPI-156 / DESIGN-058 | P2 |
| Stripe checkout tables | STR-001 | P0 |
| Cloudinary upload metadata triggers | DESIGN-074b | P1 |
| Matching schema | IPI-160 | P2 |

---

## Blockers

1. **Shoot Detail** — page missing in app; DB has `shoots` (2 rows) but no detail UI
2. **Cloudinary** — zero `cloudinary_assets` rows; pipeline not wired
3. **Campaigns** — no table; routes are placeholders
4. **Storage buckets empty** — confirm Cloudinary-only strategy in MEDIA-MAP (DESIGN-018)

---

## Verification commands

```bash
infisical run -- npm run supabase:verify
infisical run -- npm run supabase:verify-rls
npm run supabase:verify-edge          # if edge fn changed
```

MCP: `get_advisors` (security) · `list_tables` · `execute_sql` for spot checks.
