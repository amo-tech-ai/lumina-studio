# supabase/ — Progress tracker

**Updated:** 2026-07-18 · **Linear authoritative** · Roadmap [`PLAN.md`](./PLAN.md)

| Status | Linear task | Progress | Evidence | Missing or failing | Next action |
|:------:|-------------|---------|:---------|--------------------|-------------|
| 🟢 | [IPI-685 · SB-EDGE-002 — Harden capture-lead](https://linear.app/amo100/issue/IPI-685) | 100% | PRs #450/#452 merged | Confirm remote deploy if unsure | Ops verify-edge if needed |
| 🟢 | [IPI-688 · SB-EDGE-005 — Restrict or retire edge-test](https://linear.app/amo100/issue/IPI-688) | 100% | PR #449 merged | — | Complete |
| 🟢 | [IPI-690 · SB-EDGE-007 — Assess GEMINI_API_KEY exposure](https://linear.app/amo100/issue/IPI-690) | 100%* | Linear Done **no-rotate** | Formal exception checklist fields | Fill owner/review date; status stays Done |
| 🟡 | [IPI-692 · SB-EDGE-008 — Firecrawl webhook idempotent](https://linear.app/amo100/issue/IPI-692) | ~80% | PR #470 In Review | linked-gates must pass; deploy after merge | Fix CI → merge → deploy |
| ⚪ | [IPI-693 · SB-EDGE-009 — Per-brand crawl quotas](https://linear.app/amo100/issue/IPI-693) | 0% | — | After 692 deploy | Design atomic RPC |
| ⚪ | [IPI-680 · SB-SEC-002 — Disable or scope pg_graphql](https://linear.app/amo100/issue/IPI-680) | 0% | High security | Usage verify first | Audit app GraphQL usage |
| ⚪ | [IPI-684 · SB-SEC-001b — Revoke default EXECUTE](https://linear.app/amo100/issue/IPI-684) | 0% | High security | NEW-fn GRANT regression | Implement + probe |

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

| ⚪ | [IPI-694 · CF-EDGE-AI — Route Edge LLM via Gateway](https://linear.app/amo100/issue/IPI-694) | 0% | Shared with cloudflare/ | REST client | Coordinate IPI-697 |
| ⚪ | [IPI-697 · CF-EDGE-003 — Gateway REST + Brand Intelligence](https://linear.app/amo100/issue/IPI-697) | 0% | Linear Todo | — | Official REST only |
| ⚪ | [IPI-699 · CF-EDGE-005 — Edge canary + rollback](https://linear.app/amo100/issue/IPI-699) | 0% | Linear Todo | Measurable gates | After 697 |
| ⚪ | [IPI-70 · PLT-008 — Backup / restore](https://linear.app/amo100/issue/IPI-70) | 0% | Checklist attached in notes | Drill not run | Document restore drill |
| ⏸ | [IPI-704 · SB-TEST-002 — pgTAP](https://linear.app/amo100/issue/IPI-704) | 0% | Parked | Needs clean/disposable DB | Do not start on shared remote |
| ⏸ | [IPI-698 · CF-EDGE-004 — DNA vision after BI canary](https://linear.app/amo100/issue/IPI-698) | 0% | Parked | After canary | Stay parked |

\* Done ≠ “rotated keys” — accepted risk with checklist.
