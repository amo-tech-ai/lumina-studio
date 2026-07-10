# IPI-476 · Planner access fix report

**Date:** 2026-07-10  
**Worktree:** `/home/sk/wt-ipi-476-planner-grants-api` · branch `ipi/476-planner-grants-api`  
**Project:** `nvdlhrodvevgwdsneplk`

## Summary

Unblocked client/PostgREST access to `planner.*` without weakening RLS. Grants + seed backfill + Realtime auth helper applied remotely; types regenerated; live RLS and integration/Realtime probes pass.

| Task | Status | Evidence | Remaining risk |
| ---- | :----: | -------- | -------------- |
| IPI-476 · PLAN-GRANT-001 — Grant Planner Schema and Table Privileges | ✅ | Migration `20260710080000`; `has_schema_privilege` / `has_table_privilege` all `true` for authenticated + service_role | None for access; keep default privileges when adding tables |
| IPI-476 · PLAN-API-001 — Expose Planner Through Remote PostgREST | ✅ | Management API PATCH → `db_schema=public,graphql_public,planner`; `config.toml` already aligned; REST `Accept-Profile: planner` → **HTTP 200** | Dashboard drift if someone removes schema later |
| IPI-476 · PLAN-TYPES-001 — Regenerate Planner Supabase Types | ✅ | `npm run supabase:types` → `Database["planner"]` + 10 tables + `can_subscribe_instance`; typecheck/lint/build green | Types-only commit must stay separate from app logic |
| IPI-476 · PLAN-RLS-001 — Add Live Cross-Organization RLS Verification | ✅ | `npm run supabase:verify-rls` — soft-skip removed; org A/B isolation, viewer/contributor/manager/owner, non-member deny, service_role select — **passed** | Role matrix still has product nuances (e.g. assignments SELECT is manager+) |
| IPI-476 · PLAN-SEED-001 — Backfill Missing Planner Templates | ✅ | Same migration; orgs=workflows for `5-Week Product Shoot`; missing=0; dupes=0 | New orgs still need bootstrap (documented: re-run seed / IPI-477 org-create hook) — no auto-trigger in v1 |
| IPI-476 · PLAN-RT-001 — Verify Secure Planner Realtime | ✅ | Migration `20260710081000` SECURITY DEFINER helper (avoids realtime#1111 JOIN failure); scenario: auth **SUBSCRIBED** + broadcast received; other org **CHANNEL_ERROR** / no payload | Confirm Dashboard “Allow public access” stays off for private channels |
| IPI-476 · PLAN-INT-001 — Add Database-Backed Planner Scenario Tests | ✅ | `node --experimental-strip-types scripts/verify-planner-scenario.mjs` — create instance, owner bootstrap, engine schedule, +3d shift, persist, dependents moved, cleanup | Not wired into CI yet — run manually / add npm script |

## Migrations applied

1. `20260710080000_planner_grants_and_seed_backfill.sql` — grants (talent pattern, no anon) + idempotent seed backfill  
2. `20260710081000_planner_realtime_auth_helper.sql` — `planner.can_subscribe_instance` + SELECT/INSERT policies on `realtime.messages`

## Verification commands (green)

```text
# Privileges
auth_usage=true service_usage=true auth_select=true svc_*=true

# Seed
orgs == defaults; missing=0; dupes=0

# REST
curl … Accept-Profile: planner → HTTP 200 + workflow rows

# RLS
npm run supabase:verify-rls → passed

# Scenario + Realtime
node --experimental-strip-types scripts/verify-planner-scenario.mjs → passed

# App
cd app && npm run typecheck && npm run lint
npm test -- --run src/lib/planner/engine.test.ts → 27 passed
npm run build → success
```

## Explicit non-goals (unchanged)

- No PlannerEngine behavior changes  
- No historical migration edits  
- No `anon` grants on planner  
- No UI work (Claude Design owns screens)

## Follow-ups (optional)

- Wire `verify-planner-scenario.mjs` into `package.json` / CI  
- Org-create hook to seed default workflow (IPI-477)  
- Optimistic locking before multi-editor UI  

---

```text
Final verdict: 🟢 Planner UI ready — 92/100
```

(Deductions: org bootstrap still manual/documented; scenario not in CI yet; assignments SELECT remains manager-scoped by design.)
