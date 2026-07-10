# iPix / FashionOS — Architecture Diagram Catalog

**Date:** 2026-07-09 (consolidated from an earlier 52-diagram pass down to 16 high-value diagrams — the old set is archived at `archive/` for reference, not deleted)
**Source of truth:** `prd.md` and `roadmap.md` at the repo root. Every diagram was independently re-verified against those two documents plus real code during consolidation — not just carried forward from the old set.

Status convention: 🟢 Built (fully real, verified) · 🟡 Partial (some real, some target) · ⚪ Planned (target-state only, nothing built) · 🔴 Incorrect/defect (a real, live problem — either a doc was wrong and got corrected, or the thing itself is a confirmed gap).

Full detail on what changed during consolidation, and the scored audit, is in `VERIFIED-STATE.md` and `AUDIT-REPORT.md`.

---

## Recommended viewing order

1. **`01-system-overview.md`** — the whole platform in one picture.
2. **`02-application-architecture.md`** — frontend → API → AI → database, one layered view.
3. **`03-cloudflare-architecture.md`** — what's actually live on Cloudflare (2 things) vs. deferred (4 things).
4. **`04-ai-architecture.md`** — CopilotKit, Mastra, providers.
5. **`05-agent-tool-registry.md`** — all agents, all tools, what's real vs. not-built.
6. **`12-ai-request-flow.md`** — the single most important diagram in the set: current path (bypasses the gateway) vs. target path.
7. **`06-database-erd.md`** — core schema.
8. **`07-auth-flow.md`** — login + RLS, including the live `.workers.dev` trust gap.
9. **`08-brand-shoot-workflow.md`** and **`09-crm-booking-campaign.md`** — the two end-to-end business flows.
10. **`10-planner-architecture.md`** — templates, timeline, dependencies, approvals in one diagram.
11. **`11-media-pipeline.md`** — upload → Cloudinary → delivery.
12. **`13-deployment-pipeline.md`** and **`14-production-runtime.md`** — how it ships and runs today.
13. **`15-feature-dependencies.md`** and **`16-roadmap-timeline.md`** — build order.

---

## Catalog

| # | Diagram | Status | One-line summary |
|---|---|:---:|---|
| 01 | System Overview | 🟡 | Current (Vercel) + target (Cloudflare Workers via OpenNext), both shown |
| 02 | Application Architecture | 🟢 | New synthesis diagram — frontend/API/AI/DB in one view, verified against `getMastra()` and the CopilotKit route |
| 03 | Cloudflare Architecture | 🟡 | Only Workers + the AI Gateway Worker + Workers AI are live; KV/Queues/DO/Vectorize/R2 are deferred or unprovisioned |
| 04 | AI Architecture | 🟡 | CopilotKit + Mastra real; still on `hono/vercel`, not `hono/cloudflare-workers` |
| 05 | Agent & Tool Registry | 🟡 | 4 of 7 described agent roles are real; a 9th real agent exists outside the registry; Prompt/Provider Registry not built |
| 06 | Database ER Diagram | 🟢 | Verified against real migrations; one correction made (`campaigns.status` is a real enum, not text) |
| 07 | Auth Flow | 🔴 | Real, but has a live defect: OAuth callback doesn't yet trust the eventual `.workers.dev` production host |
| 08 | Brand → AI Brief → Shoot Workflow | 🟢 | Real, one combined approval gate (not two — corrected) |
| 09 | CRM → Booking → Campaign Workflow | 🟡 | CRM/Booking real; Campaign is schema-only (🔴 within this diagram) |
| 10 | Planner Architecture | 🟡 | Schema + engine in 2 open PRs; UI is 100% unbuilt (design-only) |
| 11 | Media Pipeline | 🟢 | Real, upload→Cloudinary→delivery confirmed |
| 12 | AI Request Flow | 🔴 | Current path bypasses the AI Gateway entirely — the platform's single biggest infra gap |
| 13 | Deployment Pipeline | 🟡 | Vercel is still the real production path; Cloudflare path is local-preview only |
| 14 | Production Runtime | 🟡 | Real request trace; Stripe explicitly verified absent and omitted (it doesn't exist in this codebase) |
| 15 | Feature Dependencies | 🟢 | Exact match to `prd.md` §14, zero drift |
| 16 | Roadmap Timeline | 🟢 | Exact match to `roadmap.md` §6, zero drift |

---

## What changed from the old 52-diagram set

- **6→1 compression:** the old Planner category (6 files) is now one diagram (`10`).
- **6→1 compression:** the old Cloudflare-services category (6 files) is now one diagram (`03`).
- **3→1 compression:** AI Platform + Mastra + CopilotKit (3 files) → one diagram (`04`); Runtime Flow + Gateway Routing + HITL (3 files) → one diagram (`12`).
- **No diagrams created** for the "optional, only if implemented" list (Durable Objects, Queues, Workers-AI-as-default, Prompt Registry, Provider Registry, Notification Architecture) — none of these are actually implemented, so per the user's own rule they're folded as brief status callouts into `03` and `05` instead of getting their own files.
- **Old 52-file set + its final report** are preserved at `archive/` for anyone who wants the more granular breakdown, but are no longer the maintained set.

Full verification detail: `VERIFIED-STATE.md`. Scored audit: `AUDIT-REPORT.md`.
