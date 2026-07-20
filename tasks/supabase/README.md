# supabase/ — Database & Edge planning

**Open first:** [`PLAN.md`](./PLAN.md) → [`todo`](./todo) (execution queue) → [`STATUS.md`](./STATUS.md) (Linear summary)  
Remote-only policy — never `supabase start` for schema truth.

## Document responsibilities

| Document | Responsibility |
|---|---|
| [`PLAN.md`](./PLAN.md) | Architecture, goals, decisions, roadmap |
| [`todo`](./todo) | **Single ordered execution queue** (Prime master) |
| [`STATUS.md`](./STATUS.md) | Small Linear-sourced progress summary |
| [`j20-supabase-audit.md`](./j20-supabase-audit.md) | J20 audit (2026-07-20, rev 2) — evidence + scores |
| [`supabase-plan.md`](./supabase-plan.md) | Long-form legacy (has dated correction header) |
| [Linear Supabase view](https://linear.app/amo100/view/supabase-2d1d1d63cb9c) | **Final authority** for status and dependencies |

## Linear (active)

| Surface | Link |
|---------|------|
| **Project** | [AI Platform — AI Infrastructure](https://linear.app/amo100/project/ai-platform-ai-infrastructure-7d08f8bb3ff2) |
| **Overview** | [Supabase — Overview](https://linear.app/amo100/document/supabase-overview-ffc91c6eb2d0) |
| **Product Plan and Roadmap** | [Supabase — Product Plan and Roadmap](https://linear.app/amo100/document/supabase-product-plan-and-roadmap-d0513138ffae) |
| **Progress Tracker** | [Supabase — Progress Tracker](https://linear.app/amo100/document/supabase-progress-tracker-7be6e298d8ff) |

### Related active issues

- [IPI-692 · SB-EDGE-008 — Make Firecrawl webhook workflow resume idempotent](https://linear.app/amo100/issue/IPI-692)
- [IPI-680 · SB-SEC-002 — Disable or scope pg_graphql](https://linear.app/amo100/issue/IPI-680)
- [IPI-684 · SB-SEC-001b — Revoke default EXECUTE](https://linear.app/amo100/issue/IPI-684)
- [IPI-693 · SB-EDGE-009 — Per-brand crawl quotas](https://linear.app/amo100/issue/IPI-693)

## Navigation

| Doc | Role |
|-----|------|
| [`PLAN.md`](./PLAN.md) | **Active** domain PRD + roadmap |
| [`todo.md`](./todo.md) | **Active** evidence-based progress tracker |
| [`../prime/supabase-plan.md`](../prime/supabase-plan.md) | Supporting / temporary (migrate inbound links here) |
| [`../prime/j18-linear-tasks.md`](../prime/j18-linear-tasks.md) | Supporting session orchestration notes |
| `supabase/docs/` (when restored) | Supporting operational plans under app tree |

Code / schema: `supabase/migrations/` · `supabase/functions/` · Skill: `.claude/skills/ipix-supabase/`
