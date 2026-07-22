# Mastra — Domain plan (PRD + roadmap)

**Updated:** 2026-07-22  
**Epic:** [IPI-486 · MASTRA-EPIC — Mastra × Cloudflare Operating System](https://linear.app/amo100/issue/IPI-486) (In Progress)

## Linear (active)

| Surface | Link |
|---------|------|
| **Project** | [AI Platform — Agents](https://linear.app/amo100/project/ai-platform-agents-8a30bc8146cd) |
| **Overview** | [Mastra — Overview](https://linear.app/amo100/document/mastra-overview-c23d1128285f) |
| **Product Plan and Roadmap** | [Mastra — Product Plan and Roadmap](https://linear.app/amo100/document/mastra-product-plan-and-roadmap-775d4c9de8ec) |
| **Progress Tracker** | [Mastra — Progress Tracker](https://linear.app/amo100/document/mastra-progress-tracker-2bd48981723d) |

### Related active issues

- [IPI-486 · MASTRA-EPIC — Mastra × Cloudflare Operating System](https://linear.app/amo100/issue/IPI-486)
- [IPI-616 · CF-DB-001 — Mastra Storage and Schema ADR](https://linear.app/amo100/issue/IPI-616)
- [IPI-628 · MASTRA-SUPABASE-002 — Version-Pinned Schema Migration](https://linear.app/amo100/issue/IPI-628)
- [IPI-629 · MASTRA-SUPABASE-003 — Runtime Grants and RLS](https://linear.app/amo100/issue/IPI-629)
- [IPI-630 · MASTRA-SUPABASE-004 — PostgresStore Initialization Control](https://linear.app/amo100/issue/IPI-630)
- [IPI-245 · IPI-227B — Mastra Database Authorization Probes](https://linear.app/amo100/issue/IPI-245)
- [IPI-619 · CF-DB-005 — Add Initial Supabase Hyperdrive Binding](https://linear.app/amo100/issue/IPI-619)
- [IPI-620 · CF-DB-006 — Hyperdrive Query Helper and PostgresStore Compatibility Spike](https://linear.app/amo100/issue/IPI-620)
- [IPI-621 · CF-DB-007 — Tenant Authorization and RLS Tests](https://linear.app/amo100/issue/IPI-621)
- [IPI-622 · CF-DB-008 — Benchmark Hyperdrive, Placement, and Supabase Data API](https://linear.app/amo100/issue/IPI-622)
- [IPI-624 · CF-DB-010 — Configure Hyperdrive Monitoring and Connection Alerts](https://linear.app/amo100/issue/IPI-624)
- [IPI-623 · CF-DB-009 — Migrate One Mastra Workload to Hyperdrive](https://linear.app/amo100/issue/IPI-623)
- [IPI-714 · MASTRA-INFRA-001 — Storage Connection-Pool Exhaustion](https://linear.app/amo100/issue/IPI-714)

---

## Storage → Hyperdrive chain audit (2026-07-22)

An external audit of the IPI-616→623 chain was cross-checked live: every issue re-read via Linear MCP (`includeRelations`), the actual Supabase database inspected via Supabase MCP (project `nvdlhrodvevgwdsneplk`), and `@mastra/pg@1.12.0` inspected as installed in `app/node_modules`. **Verdict: 88/100 — the external audit's corrected order is right, and 5 of its dependency-graph gaps were real and have been fixed live in Linear.** Two of its findings turned out to already be non-issues in the current graph; three things it didn't know about were found by reading the database directly.

### Corrected dependency graph (now live in Linear, not just this doc)

```text
IPI-616 · CF-DB-001 — Mastra Storage and Schema ADR  (In Progress)
│
├── IPI-619 · CF-DB-005 — Add Initial Supabase Hyperdrive Binding   (parallel — soft-blocked only by 616)
│
└── IPI-628 · MASTRA-SUPABASE-002 — Version-Pinned Schema Migration
      ↓
    IPI-629 · MASTRA-SUPABASE-003 — Runtime Grants and RLS
      │
      ├── IPI-630 · MASTRA-SUPABASE-004 — PostgresStore Initialization Control
      └── IPI-245 · IPI-227B — Mastra Database Authorization Probes
                                          (blockedBy: IPI-629 — added)
Wait for IPI-619 + IPI-630
      ↓
IPI-620 · CF-DB-006 — Hyperdrive Query Helper + PostgresStore Compatibility Spike
      │                                 (blockedBy: IPI-630 — added)
      ├── IPI-621 · CF-DB-007 — Tenant Authorization and RLS Tests
      │                                 (blockedBy: IPI-629 — added)
      ├── IPI-622 · CF-DB-008 — Benchmark Hyperdrive, Placement, Data API
      └── IPI-624 · CF-DB-010 — Monitoring Baseline and Runbook
Wait for IPI-621 + IPI-624 + IPI-630 + IPI-620 = PROCEED
      ↓
IPI-623 · CF-DB-009 — Migrate One Mastra Workload to Hyperdrive
      ↓
IPI-631 · CF-MIG-810 — Production DNS Cutover  (blockedBy IPI-623 REMOVED — see below)
```

### Relation corrections applied live in Linear (this session, evidence-based)

| Issue | Change | Why (live-verified) |
| -- | -- | -- |
| **IPI-621** | `blockedBy` += IPI-629 | Description said "+ IPI-629 grants deployed" but the actual relation was never set — `get_issue` showed `blockedBy: [IPI-620]` only |
| **IPI-245** | `blockedBy` += IPI-629 | Description said "Blocked by: IPI-629" but the relation was empty — `blockedBy: []` |
| **IPI-620** | `blockedBy` += IPI-630 | Part B of its own scope (PostgresStore compatibility spike) needs schema + grants + `disableInit` live to run a real create/read proof. IPI-630 already chains through 629→628, so this one edge covers all three |
| **IPI-623** | `blockedBy` += IPI-630 | Same logic — the workload migration needs the full init-control chain, not just 619/620/621/624 |
| **IPI-631** | `blockedBy` **removed**: IPI-623 | DNS cutover doesn't need Mastra on Hyperdrive — `MASTRA_STORAGE_MODE=noop` is already the shipped, proven Worker storage path ([PR #407](https://github.com/amo-tech-ai/lumina-studio/pull/407)/[#408](https://github.com/amo-tech-ai/lumina-studio/pull/408), IPI-633). Hyperdrive is explicitly a post-launch maturity track per the 2026-07-22 Linear priority note on the Cloudflare queue, not a first-cutover gate |

**Two audit claims that were already fine live** (no edit needed): (1) "IPI-619 should run parallel with 628, not serially after" — it already does; `blockedBy: [IPI-616]` only, described as a "soft" blocker. (2) "IPI-622 missing from the chain" — it already has `blockedBy: [IPI-619]` live; it was only missing from the *diagram* in IPI-616's description, not from the real graph.

### New findings — from reading the live database, not from the audit doc

Verified via Supabase MCP against `nvdlhrodvevgwdsneplk`:

1. **33 `mastra_*` tables confirmed live**, all in `public`, all owned by `postgres`. No `mastra` schema exists yet (`select nspname from pg_namespace where nspname='mastra'` → empty). This is the exact state IPI-616's ADR needs to resolve and IPI-628 needs to migrate away from.
2. **🔴 `hyperdrive_mastra_runtime` already has partial grants** — SELECT/INSERT/UPDATE/DELETE on exactly 3 tables (`mastra_threads`, `mastra_messages`, `mastra_workflow_snapshot`) — even though **IPI-629 (the grants ticket) still shows status Todo**. This isn't documented anywhere in the chain. IPI-629's migration needs to either be written idempotently against these 3 pre-existing grants, or revoke-and-recreate them cleanly — otherwise the migration will silently no-op on the 3 tables the app actually uses today.
3. **🔴 Zero RLS policies exist on any `mastra_*` table** (`pg_policies` returns empty for `tablename like 'mastra_%'`), despite `rls_enabled=true` on all 33. This is *stricter* than the audit assumed: the audit's framing was "`USING (true)` gives a false sense of tenant isolation" — but there is no `USING (true)` policy at all right now. Postgres RLS default-denies with RLS enabled and no policy, so `hyperdrive_mastra_runtime` gets **zero rows from any `mastra_*` table today**, regardless of its grants. This is a likely contributor to the `mastra dev` `42501` error IPI-628/630 already track.
4. `max_connections = 60` confirmed live (matches the audit's citation exactly).
5. Role facts confirmed correct as claimed: `rolbypassrls=false`, not superuser, not table owner.
6. `@mastra/pg@1.12.0`'s `exportSchemas` export exists and is callable — confirmed the audit's instruction ("generate the table list from the installed package, not memory") is achievable exactly as written.

### Still-valid architecture recommendations from the audit (not Linear-relation fixes — apply when implementing)

- **IPI-620** combines two concerns (query helper vs. PostgresStore compatibility spike) — split into two PRs/commits per the one-concern-per-PR rule, or at minimum separate acceptance sections, since Part A has no dependency on 628/629/630 but Part B does.
- **IPI-624**: don't assume custom slow-query alert delivery is available out of the box — Cloudflare exposes Hyperdrive metrics via Dashboard + GraphQL Analytics; check those before writing a custom alerting path.
- **Connection limit**: don't drop from 20 → 5 blindly. Measure real concurrent usage under operator traffic first (baseline is 20, ceiling is `max_connections=60`).
- **Caching**: keep Hyperdrive caching disabled for all Mastra persistence — no read-after-write invalidation guarantee, and Mastra memory/threads/workflow snapshots need read-your-own-write correctness.


## Purpose

Run iPix operator agents (Production Planner, Creative Director, CRM assistant, Booking, Brand Intelligence, etc.) via Mastra + CopilotKit, with durable storage and Cloudflare-safe routing — without inventing a second agent platform.

## Goals

1. Stable agent registry IDs synced to CopilotKit `useAgent`.
2. PostgresStore / schema migrations + RLS-safe grants (MASTRA-SUPABASE chain).
3. Optional Hyperdrive path after Cloudflare preview smoke.
4. Native AI routing behind flags (shared with cloudflare/).

## Current state

- Agents registered in `app/src/mastra/` (operator set + `public-marketing`).
- Local/preview often use `MASTRA_STORAGE_MODE=noop` for Workers safety.
- Storage pool / schema work still open (IPI-628/629/630, IPI-714).
- Native routing (IPI-594) not started.

## Target architecture

```text
CopilotKit route → getMastra() (handler only)
  → Agent (Gemini today; Gateway/Workers AI later)
  → Tools (HITL drafts)
  → PostgresStore (Hyperdrive optional) under RLS
```

## Feature tables

### Core

| Feature | Who / why | Example | Related tasks |
|---------|-----------|---------|---------------|
| Agent registry | Operator chat works | Planner shot list | Runtime in app; epic IPI-486 |
| Schema migration pin | Reproducible Mastra tables | Version-pinned migrate | [IPI-628 · MASTRA-SUPABASE-002](https://linear.app/amo100/issue/IPI-628) |
| Runtime grants + RLS | Tenant isolation | Brand-scoped memory | [IPI-629 · MASTRA-SUPABASE-003](https://linear.app/amo100/issue/IPI-629) |
| PostgresStore init control | No build-time DATABASE_URL crash | CI stub | [IPI-630 · MASTRA-SUPABASE-004](https://linear.app/amo100/issue/IPI-630) |
| Auth probes | Prove RLS | IPI-227B probes | [IPI-245 · IPI-227B](https://linear.app/amo100/issue/IPI-245) |

### Advanced

| Feature | Example | Related |
|---------|---------|---------|
| Hyperdrive canary | One workload via HD | [IPI-623 · CF-DB-009](https://linear.app/amo100/issue/IPI-623) |
| Native AI routing | Agents via Gateway | [IPI-594 · CF-MIG-230](https://linear.app/amo100/issue/IPI-594) |
| Pool exhaustion fix | EMAXCONNSESSION | [IPI-714 · MASTRA-INFRA-001](https://linear.app/amo100/issue/IPI-714) |
| Planner HITL tools | Shot refs | [IPI-482](https://linear.app/amo100/issue/IPI-482) |

## Dependencies

- Cloudflare IPI-632 before Hyperdrive hard push.
- Supabase remote for schema.
- Do not call `getMastra()` at module top-level in routes.

## Risks

| Risk | Mitigation |
|------|------------|
| Storage at build | CI stub / noop |
| Duplicate epics | IPI-486 owns Mastra; IPI-487 owns hosting |

## Success criteria

- [ ] MASTRA-SUPABASE chain Done with probes
- [ ] One Hyperdrive canary if ADR selects
- [ ] Native routing flag path proven (IPI-586→594)

## Roadmap

```text
1. IPI-616 ADR (In Progress) — schema placement, table classification
2. IPI-619 bind (parallel with 3) — Hyperdrive binding only, no storage flip
3. IPI-628 → IPI-629 → IPI-630 — schema/grants/init (IPI-245 parallel after 629)
4. IPI-620 spike (helper + PostgresStore compat) — gates 621/622/624
5. IPI-621 tenant/RLS tests, IPI-622 benchmark, IPI-624 monitoring
6. IPI-623 — migrate one Mastra workload to Hyperdrive (does NOT gate DNS cutover)
7. IPI-714 — pool diagnosis (as needed, independent of the chain above)
8. IPI-586 → IPI-594 — native routing
```

Full corrected dependency graph + live-verification evidence: see "Storage → Hyperdrive chain audit" above.
