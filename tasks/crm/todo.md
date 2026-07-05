---
title: CRM MVP — Task Tracker
version: "1.0"
lastUpdated: "2026-07-04"
linearProject: https://linear.app/amo100/project/crm-relationship-layer-6eaf40894535
platformRollup: ../plan/todo.md
prdSsot: ./05-crm-prd.md
briefSsot: ./02-crm-architecture-brief.md
designSsot: ./design/README.md
issueCount: 9
---

# CRM MVP — Task Tracker

| Link | Use for |
|------|---------|
| [Linear project](https://linear.app/amo100/project/crm-relationship-layer-6eaf40894535) | 9 issues · source of truth |
| [`05-crm-prd.md`](./05-crm-prd.md) | What we're building and why |
| [`02-crm-architecture-brief.md`](./02-crm-architecture-brief.md) | Architecture decisions |
| [`design/README.md`](./design/README.md) | Screen-by-screen design prompts |
| [`plans/README.md`](./plans/README.md) | Per-stack (Supabase/Mastra/CopilotKit) build trackers |

**Legend:** 🟢 done · 🟡 in progress · ⚪ todo, blocked · 🔵 todo, ready to start

**Branch naming:** Linear auto-suggests `ai/ipi-NNN-...` for every CRM issue — **ignore this**. Per `CLAUDE.md`'s worktree rule, checkout as `ipi/NNN-short-name` (e.g. `ipi/362-crm-schema-rls`), never the Linear-generated `ai/` prefix.

**Forensic audit applied (2026-07-04):** [`audit/01-audit.md`](./audit/01-audit.md) found and this session fixed 2 critical doc contradictions (jsonb schema drift, stale "component reused" claims), added DB-level `won`/`lost` enforcement, resolved Q-1, loosened 2 over-conservative Linear dependencies, and created the missing `docs/linear/issues/IPI-362..370` spec files + this rollup's row in `tasks/plan/todo.md`. See audit for full detail.

---

## Dashboard

| | |
|--|--|
| **Verified** | 2026-07-04 — nothing built yet, this is a fresh project |
| **Status** | 🔵 **1 issue ready to start** (schema) · 8 blocked behind it |
| **Ship-ready?** | 🔴 No — nothing merged yet |
| **Overall** | 0% (0/9 done) |

---

## All tasks

Plain-English description of each piece of work, in build order. Every task is 1–3 days of work.

| # | Linear | What it does | Status | Depends on | Implementation plan |
|---|--------|---------------|--------|------------|---------------------|
| 1 | [IPI-362](https://linear.app/amo100/issue/IPI-362) | Build the 4 database tables (companies, contacts, deals, activity log) with security rules so one company's data can never leak to another | 🟡 In Review — [PR #212](https://github.com/amo-tech-ai/lumina-studio/pull/212), migration applied to remote + verified, pending `rls-policy-auditor` review | — | [`2026-07-04-crm-schema-rls.md`](../../docs/plan/tasks/2026-07-04-crm-schema-rls.md) |
| 2 | [IPI-363](https://linear.app/amo100/issue/IPI-363) | Companies **data layer** done ([PR #216](https://github.com/amo-tech-ai/lumina-studio/pull/216) `deriveTaskState` + [PR #215](https://github.com/amo-tech-ai/lumina-studio/pull/215) `listCompanies`/`getCurrentOrgId`, stacked #212 → #216 → #215). Screens still need a Claude Design pass on `tasks/crm/design/02a`/`02b` before UI is built | 🟡 In Review (data layer only) | #1 | [`2026-07-04-crm-companies-screens.md`](../../docs/plan/tasks/2026-07-04-crm-companies-screens.md) |
| 3 | [IPI-364](https://linear.app/amo100/issue/IPI-364) | Contacts **data layer** done ([PR #218](https://github.com/amo-tech-ai/lumina-studio/pull/218) `listContacts`/`getPrimaryEntry`, stacked on #212). Screens still need a Claude Design pass on `tasks/crm/design/02c`/`02d` before UI is built | 🟡 In Review (data layer only) | #1 | [`2026-07-04-crm-contacts-screens.md`](../../docs/plan/tasks/2026-07-04-crm-contacts-screens.md) |
| 4 | [IPI-365](https://linear.app/amo100/issue/IPI-365) | Build the Pipeline board — a drag-and-drop kanban view of every deal, updating live | ⚪ Blocked | #1 | [`2026-07-04-crm-pipeline-board.md`](../../docs/plan/tasks/2026-07-04-crm-pipeline-board.md) |
| 5 | [IPI-366](https://linear.app/amo100/issue/IPI-366) | Build the Deal Detail page — one deal's full record and its activity history (the "Won"/"Lost" buttons exist but don't do anything yet — that's #6) | ⚪ Blocked | #1 (hard) · #4 soft — can build in parallel | [`2026-07-04-crm-deal-detail.md`](../../docs/plan/tasks/2026-07-04-crm-deal-detail.md) |
| 6 | [IPI-367](https://linear.app/amo100/issue/IPI-367) | Wire up the **one and only** way a deal can be marked Won or Lost — requires a human to click Approve, and turns a won deal into a real Brand automatically. Enforced at both the API route *and* a database trigger, not UI-only | ⚪ Blocked | #5 | [`2026-07-04-crm-won-lost-gate.md`](../../docs/plan/tasks/2026-07-04-crm-won-lost-gate.md) |
| 7 | [IPI-368](https://linear.app/amo100/issue/IPI-368) | Turn on the AI assistant (wave 1) — Mastra agent + minimal CopilotKit (`route-agent-map`, `useAgentContext`, `navigateTo`); search, log notes, ungated stage moves only | ⚪ Blocked | #1–#3 (hard) · #4, #5 soft — can start once schema + Companies/Contacts exist | [`2026-07-04-crm-assistant-wave1.md`](../../docs/plan/tasks/2026-07-04-crm-assistant-wave1.md) · [`plans/mastra-plan.md`](./plans/mastra-plan.md) · [`plans/copilotkit-plan.md`](./plans/copilotkit-plan.md) |
| 8 | [IPI-369](https://linear.app/amo100/issue/IPI-369) | Level up the AI assistant (wave 2) — health scoring, relationship summary, draft follow-up + IntelligencePanel sections; requires Pipeline (IPI-365) for at-risk filter | ⚪ Blocked | #7 · **#4 (IPI-365)** | [`2026-07-04-crm-assistant-wave2.md`](../../docs/plan/tasks/2026-07-04-crm-assistant-wave2.md) |
| 9 | [IPI-370](https://linear.app/amo100/issue/IPI-370) | Final safety check before calling this done — prove no deal can be won silently, no company can see another company's data, and the AI never sends a message on its own | ⚪ Blocked | #6, #8 | [`2026-07-04-crm-verification.md`](../../docs/plan/tasks/2026-07-04-crm-verification.md) |

---

## Now / Next / Later

| Now | Next | Later |
|-----|------|-------|
| **#1** Schema + RLS (IPI-362) — nothing else can start until this merges | **#2–#5** Companies, Contacts, Pipeline, Deal Detail (IPI-363–366) — can be built in parallel once #1 lands | **#6–#9** Won/Lost gate, AI assistant (both waves), final verification |

---

## What's deliberately not on this list

These were asked for in earlier review rounds but are intentionally deferred — see
[`02-crm-architecture-brief.md`](./02-crm-architecture-brief.md)'s Later/Not-Now list for the full reasoning:

Meetings/Calendar, Email/WhatsApp send integration, Documents, a dedicated Analytics dashboard, advanced
relationship scoring, contact merge/dedup, universal cross-entity search, and a full HubSpot-style CRM
Dashboard. None of these are missing by accident.

---

## Milestones (Linear)

| Milestone | Covers | Tasks |
|---|---|---|
| CRM-M1 · Schema & Core Screens | Database + the 4 main screens | #1–#5 |
| CRM-M2 · HITL Gate & Brand Conversion | The Won/Lost safety gate | #6 |
| CRM-M3 · crm-assistant Agent | The AI assistant, both waves | #7–#8 |
| CRM-M4 · Verification | Final proof before Done | #9 |
