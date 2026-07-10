# IPI-476 · Planner access fix report

**Date:** 2026-07-10 (updated after [#305](https://github.com/amo-tech-ai/lumina-studio/pull/305))  
**Branch:** historical `ipi/476-planner-grants-api` · PRs [#295](https://github.com/amo-tech-ai/lumina-studio/pull/295)–[#297](https://github.com/amo-tech-ai/lumina-studio/pull/297), types [#301](https://github.com/amo-tech-ai/lumina-studio/pull/301), org bootstrap [#305](https://github.com/amo-tech-ai/lumina-studio/pull/305)  
**Project:** `nvdlhrodvevgwdsneplk`

## Summary

Unblocked client/PostgREST access to `planner.*` without weakening RLS. Grants + seed backfill + Realtime auth helper applied remotely; types regenerated; org default-template bootstrap is automatic; live RLS and integration/Realtime probes pass.

| Task | Status | Evidence | Remaining risk |
| ---- | :----: | -------- | -------------- |
| IPI-476 · PLAN-GRANT-001 — Grant Planner Schema and Table Privileges | ✅ | Migration `20260710080000`; `has_schema_privilege` / `has_table_privilege` all `true` for authenticated + service_role | None for access; keep default privileges when adding tables |
| IPI-476 · PLAN-API-001 — Expose Planner Through Remote PostgREST | ✅ | Management API PATCH → `db_schema=public,graphql_public,planner`; `config.toml` already aligned; REST `Accept-Profile: planner` → **HTTP 200** | Dashboard drift if someone removes schema later |
| IPI-476 · PLAN-TYPES-001 / PLAN-TYPES-002 — Planner Supabase Types | ✅ | `#301` pin `--schema public,planner,graphql_public`; `Database["planner"]` + `can_broadcast_instance` | Keep pin in `package.json` |
| IPI-476 · PLAN-RLS-001 — Add Live Cross-Organization RLS Verification | ✅ | `npm run supabase:verify-rls` — org A/B isolation, role matrix, non-member deny — **passed** | Role matrix still has product nuances (e.g. assignments SELECT is manager+) |
| IPI-476 · PLAN-SEED-001 — Backfill Missing Planner Templates | ✅ | One-shot backfill; then drift until org hook | Superseded by PLAN-SEED-002 |
| **IPI-477 · PLAN-SEED-002 — Org bootstrap** | ✅ | [#305](https://github.com/amo-tech-ai/lumina-studio/pull/305) `ensure_default_5_week_workflow` + AFTER INSERT trigger; live **734/734 missing=0** (2026-07-10) | EXECUTE is `service_role` / trigger only |
| IPI-476 · PLAN-RT-001 — Verify Secure Planner Realtime | ✅ | `can_subscribe_instance` / `can_broadcast_instance`; auth SUBSCRIBED; other org denied | Confirm Dashboard “Allow public access” stays off for private channels |
| IPI-476 · PLAN-INT-001 — Database-Backed Planner Scenario Tests | ✅ | `npm run supabase:verify-planner` (#296) | Wire into CI → **PLAN-CI-001** (separate PR) |

## Migrations applied (planner track)

1. `20260710080000_planner_grants_and_seed_backfill.sql` — grants + one-shot seed backfill  
2. `20260710081000`–`83000` — Realtime helpers / policy / UUID guard  
3. `20260710123617_planner_org_default_workflow_bootstrap.sql` — idempotent ensure + org INSERT trigger + backfill (#305)

## Verification commands (green)

```text
# Seed (post-#305)
orgs == defaults; missing=0; dupes=0

# REST
curl … Accept-Profile: planner → HTTP 200 + workflow rows

# RLS
npm run supabase:verify-rls → passed

# Scenario + Realtime
npm run supabase:verify-planner → passed

# App
cd app && npx vitest run src/lib/planner/engine.test.ts → 27 passed
```

## Explicit non-goals (unchanged)

- No PlannerEngine behavior changes in grant/seed PRs  
- No historical migration edits  
- No `anon` grants on planner  
- No UI work (Claude Design owns screens)  
- No synthetic Booking QA seed on shared remote (Option C)

## Follow-ups (separate PRs)

- **PLAN-CI-001** — wire `supabase:verify-planner` into `booking-gate` (Node 22)  
- **PLAN-VERIFY-002** — standardize CI `app-build` on Node 22  
- Optimistic locking before multi-editor UI  

---

```text
Final verdict: 🟢 Planner backend ready for UI — ~94/100
```

(Deductions: scenario not yet gated in CI; Node 20 still used by `app-build` until PLAN-VERIFY-002.)
