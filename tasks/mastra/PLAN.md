# Mastra — Domain plan (PRD + roadmap)

**Updated:** 2026-07-18  
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
- [IPI-628 · MASTRA-SUPABASE-002 — Version-Pinned Schema Migration](https://linear.app/amo100/issue/IPI-628)
- [IPI-629 · MASTRA-SUPABASE-003 — Runtime Grants and RLS](https://linear.app/amo100/issue/IPI-629)
- [IPI-714 · MASTRA-INFRA-001 — Storage Connection-Pool Exhaustion](https://linear.app/amo100/issue/IPI-714)


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
1. IPI-628 → IPI-629 → IPI-630 — schema/grants/init
2. IPI-245 — auth probes
3. IPI-714 — pool diagnosis (as needed)
4. IPI-616 ADR → Hyperdrive chain (cloudflare/)
5. IPI-586 → IPI-594 — native routing
```
