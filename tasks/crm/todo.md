---
title: CRM MVP — Task Tracker
version: "2.0"
lastUpdated: "2026-07-07"
linearProject: https://linear.app/amo100/project/crm-relationship-layer-6eaf40894535
designV2Project: https://linear.app/amo100/project/design-v2-operator-react-parity-e276f28e26a0
platformRollup: ../plan/todo.md
prdSsot: ./05-crm-prd.md
briefSsot: ./02-crm-architecture-brief.md
designSsot: ./design/README.md
issueCount: 16
---

| Link | Use for |
| ------ | --------- |
| [Linear project — CRM Relationship Layer](https://linear.app/amo100/project/crm-relationship-layer-6eaf40894535) | Original 9 issues (schema, AI agent, verification) |
| [Linear project — DESIGN V2 Operator React Parity](https://linear.app/amo100/project/design-v2-operator-react-parity-e276f28e26a0) | 7 screen-parity issues (IPI-385–403) that now own the actual screen builds |
| [`05-crm-prd.md`](./05-crm-prd.md) | What we're building and why |
| [`02-crm-architecture-brief.md`](./02-crm-architecture-brief.md) | Architecture decisions |
| [`design/README.md`](./design/README.md) | Screen-by-screen design prompts |
| [`plans/README.md`](./plans/README.md) | Per-stack (Supabase/Mastra/CopilotKit) build trackers |

**Legend:** 🟢 done · 🟡 in progress · ⚪ todo, blocked · 🔵 todo, ready to start · ⚫ duplicate/superseded

**Branch naming:** Linear auto-suggests `ai/ipi-NNN-...` for every CRM issue — **ignore this**. Per `CLAUDE.md`'s worktree rule, checkout as `ipi/NNN-short-name` (e.g. `ipi/362-crm-schema-rls`), never the Linear-generated `ai/` prefix.

**2026-07-07 re-verification (historical — superseded by "Wave 1 shipped" below):** Re-checked every issue live against Linear + `origin/main` code (not the 2026-07-04 audit's cache). Key changes since that audit:

- **IPI-365/366 (Pipeline board / Deal detail, old numbering) are now `Duplicate`** — canceled today, superseded by **IPI-395/396** in the DESIGN V2 project. Their design/data specs still apply; use the new issue numbers.
- **IPI-362 (schema), IPI-368 (AI wave 1), IPI-385/386/387 (StatusChip/EmptyState-ErrorState/EntityList), IPI-244 (ApprovalCard/ApprovalQueue), IPI-388 (Companies+Contacts lists) are all `Done`.** Confirmed on disk: `app/src/lib/crm/queries.ts`, `app/src/components/ui/{status-chip,entity-list,empty-state,error-state}.tsx`, `app/src/components/crm/{companies,contacts}-workspace.tsx` (with tests) are real, not stubs.
- **IPI-389/390 (SCR-26/28 list-parity issues) are effectively a verification pass, not a fresh build** — the lists they cover already shipped under IPI-388. Don't re-implement; confirm DC visual parity and close.
- **Data helpers were missing at this point in time:** `getCompany(id)`, `getContact(id)`, `getDeal(id)`, `listDeals()`, and no `ActivityTimeline` component existed yet. Since fixed — see "Wave 1 shipped" below.
- **Known Linear data-hygiene bug (fixed later the same day — see round 2 note below):** IPI-395 and IPI-396 both carried a stray `blockedBy: IPI-392` relation that contradicted their own description text.

**2026-07-07 re-verification, round 2 (historical — see "Wave 1 shipped" below for current state):** A second pass surfaced a sibling, more detailed issue track for the same 4 screens in the *original* CRM-Relationship-Layer project (IPI-363/364/366) — same physical screens as IPI-391/392/396, tracked twice across two Linear projects. Re-checked every claim live before trusting it (this board was being edited in near-real-time):

- **Already fixed, no action needed:** IPI-244, IPI-349, IPI-427 are all `Done` (not "still In Progress" as an earlier pass claimed). IPI-393 (dup of Company Detail) and IPI-394 (dup of Contact Detail) are already marked `Duplicate`, correctly parented to IPI-391/IPI-392. IPI-395/396's `parentId` is correct (IPI-365/IPI-366) — don't confuse `parentId` with the stray `blockedBy: IPI-392` noted above (fixed immediately below).
- **Fixed live in Linear (2026-07-07T19:12):** removed the stray `blockedBy: IPI-392` from IPI-395 and IPI-396, and repointed IPI-367's `blockedBy` from the dead IPI-366 to IPI-396. Verified via a fresh `includeRelations` read after the edit — IPI-395 blockedBy is now just IPI-362; IPI-396 blockedBy is IPI-362+IPI-395; IPI-367 blockedBy is now IPI-396.
- **Correction to this doc's own earlier guidance:** IPI-366's original spec explicitly names *Deal Detail* as `ActivityTimeline`'s designated owner ("Company Detail and Contact Detail import it, they don't rebuild it") — not Company Detail. But IPI-396 (366's successor) is scheduled after Pipeline (395), while Company Detail (391) needs the timeline sooner. Decoupled below: build `ActivityTimeline` as its own early task (needs only the schema, already done), not gated on either issue's full completion.

**2026-07-07 — Wave 1 shipped (current state — shared foundation only, no pages):**

- `app/src/lib/crm/queries.ts`: added `getCompany({id, orgId})`, `getContact({id, orgId})`, `getDeal({id, orgId})`, `listDeals({orgId, stage?, companyId?})`, `listActivities({companyId?, contactId?, dealId?})` — all scoped/typed like the existing `listCompanies`/`listContacts`, `getDeal` returns the deal row only (no contact join — `crm_deals` has no `contact_id` column, confirmed against the migration; don't fabricate one). 27 new tests in `queries.test.ts`.
- `app/src/components/crm/activity-timeline.tsx` (+ `.module.css`, 5 tests): **presentational**, not self-fetching — takes an `activities: ActivityRow[]` prop, so page-building issues call `listActivities` server-side and pass the array in. Per-type icon (note/call/email/meeting/task/ai_summary) via a guarded lookup (mirrors `status-tokens.ts`'s fallback pattern — an unrecognized type never crashes). Task-type rows show `deriveTaskState` (reused from `activity-state.ts`, not reimplemented). Empty state reuses the existing `EmptyState` component. Tokens only (`--color-*`, `--font-size-*`, `--radius-pill`), no hex.
- Verified: `npm run typecheck` ✅ · `npm run lint` ✅ · `npm test` ✅ (876 passed, 8 skipped, 0 regressions) · `CI=true npm run build` ✅.
- Still explicitly out of scope (per this task's brief): Company/Contact Detail pages, Pipeline UI, Deal Detail UI, Won/Lost gate, Profile360. IPI-391/392/395/396 still need their own page-building work — this only unblocks them.

**2026-07-07 — IPI-391 Company Detail built on top of Wave 1** (PR pending, stacked on #268): header + 4 tabs (Overview/Contacts/Deals/Activity), `get-company-detail.ts` orchestrator, `loading.tsx`. `npm run typecheck`/`lint`/`test` (887 passed)/`CI=true npm run build` all green; 18 new tests. Browser click-through hit a pre-existing environment gap, not a regression — **`qa@ipix.test` has no `org_members` row**, so every `/app/crm/*` page (including the already-shipped list screens) shows "Your account isn't linked to an organization yet." for that account. Confirmed via a scoped read-only query (single row, no other users' data touched). Real seed data exists under org `00000000-0000-0000-0000-000000000001` (Zara/H&M/Gucci/Balenciaga/Uniqlo) — verification for this task relied on the automated test suite instead; fixing the QA account's org membership is a separate, out-of-scope task.

---

## Dashboard

| | |
| -- | -- |
| **Verified** | 2026-07-07, live against Linear + `origin/main` |
| **Status** | 🟡 Schema, AI wave 1, shared atoms (StatusChip/EntityList/EmptyState/ErrorState/ApprovalCard), CRM lists, and CRM Wave 1 foundation (ActivityTimeline + getCompany/getContact/getDeal/listDeals/listActivities) are done. Company/Contact detail, Pipeline, Deal detail pages are in progress (still `<CrmScreenGate>` stubs — foundation is unblocked, pages aren't built yet). Won/Lost gate, AI wave 2, final verification not started. |
| **Ship-ready?** | 🔴 No — 4 of 6 MVP screens are still `<CrmScreenGate>` stubs |
| **Overall** | ~40% (schema + lists + shared atoms + AI wave 1 + Wave 1 foundation done; 4 screen pages + gate + wave 2 + verification remain) |

---

## Part A — Original build (CRM Relationship Layer project, IPI-362–370)

| # | Linear | What it does | Status | Depends on | Implementation plan |
| --- | -------- | --------------- | -------- | ------------ | --------------------- |
| 1 | [IPI-362](https://linear.app/amo100/issue/IPI-362) | 4 database tables (companies, contacts, deals, activity log) + RLS + won/lost DB trigger | 🟢 Done — [PR #212](https://github.com/amo-tech-ai/lumina-studio/pull/212) | — | [`2026-07-04-crm-schema-rls.md`](../../docs/plan/tasks/2026-07-04-crm-schema-rls.md) |
| 2 | [IPI-363](https://linear.app/amo100/issue/IPI-363) | Companies list + detail (original numbering) | 🟡 In Progress — data layer done ([PR #215](https://github.com/amo-tech-ai/lumina-studio/pull/215)/[#216](https://github.com/amo-tech-ai/lumina-studio/pull/216)); list UI shipped via IPI-388 instead; detail page still a stub → **tracked as IPI-391 now** | #1 | — |
| 3 | [IPI-364](https://linear.app/amo100/issue/IPI-364) | Contacts list + detail (original numbering) | 🟡 In Progress — data layer done ([PR #218](https://github.com/amo-tech-ai/lumina-studio/pull/218)); list UI shipped via IPI-388 instead; detail page still a stub → **tracked as IPI-392 now** | #1 | — |
| 4 | [IPI-365](https://linear.app/amo100/issue/IPI-365) | Pipeline board (original numbering) | ⚫ Duplicate — canceled 2026-07-07 → **superseded by IPI-395** | — | — |
| 5 | [IPI-366](https://linear.app/amo100/issue/IPI-366) | Deal Detail (original numbering) | ⚫ Duplicate — canceled 2026-07-07 → **superseded by IPI-396**. Was briefly marked Done with zero code shipped, then corrected same day — verify against disk, not Linear status, if picking up old references to this issue. | — | — |
| 6 | [IPI-367](https://linear.app/amo100/issue/IPI-367) | The **one and only** way a deal can be marked Won/Lost — human-approved, DB-trigger-backed, auto-creates/links a `brands` row | ⚪ Todo, not started | IPI-396 (Deal detail must exist first — relation corrected 2026-07-07, was pointing at the dead IPI-366) | `docs/plan/tasks/2026-07-04-crm-won-lost-gate.md` |
| 7 | [IPI-368](https://linear.app/amo100/issue/IPI-368) | crm-assistant agent wave 1 (search/log/move tools) + minimal CopilotKit wiring | 🟢 Done — [PR #221](https://github.com/amo-tech-ai/lumina-studio/pull/221)/[#220](https://github.com/amo-tech-ai/lumina-studio/pull/220) | #1 | — |
| 8 | [IPI-369](https://linear.app/amo100/issue/IPI-369) | crm-assistant wave 2 (health scoring, summarization, drafting) + IntelligencePanel sections | ⚪ Todo, blocked | #7 (done) · IPI-395 Pipeline (in progress, for at-risk filter) | — |
| 9 | [IPI-370](https://linear.app/amo100/issue/IPI-370) | Final safety verification — no silent won/lost, cross-org isolation, brand conversion, agent can't send messages | ⚪ Todo, blocked | IPI-367, #8 | — |

## Part B — Screen-parity build (DESIGN V2 Operator React Parity project, IPI-385–403)

This project owns the actual screen builds now — 11 issues total, all started 2026-07-07: 4 shared-atom issues (385–388, done), 2 list-parity verification-only issues (389/390, no fresh build needed), 4 real page-build issues (391/392/395/396, in progress), and 1 deferred (403, P3).

| # | Linear | Screen | DC file | Status | Depends on |
| --- | -------- | -------- | -------- | -------- | ------------ |
| 385 | [IPI-385](https://linear.app/amo100/issue/IPI-385) | RF-01 StatusChip + CRM status tokens | — | 🟢 Done | — |
| 386 | [IPI-386](https://linear.app/amo100/issue/IPI-386) | RF-A7b EmptyState/ErrorState | — | 🟢 Done | — |
| 387 | [IPI-387](https://linear.app/amo100/issue/IPI-387) | RF-02 EntityList | — | 🟢 Done | — |
| 388 | [IPI-388](https://linear.app/amo100/issue/IPI-388) | RF-03 Companies + Contacts lists | SCR-26, SCR-28 | 🟢 Done — [PR #253](https://github.com/amo-tech-ai/lumina-studio/pull/253) | 385, 386, 387 |
| 389 | [IPI-389](https://linear.app/amo100/issue/IPI-389) | SCR-26 Companies List parity | SCR-26 | 🟡 In Progress — code already real via 388; this is verification, not a build | 388 (done) |
| 390 | [IPI-390](https://linear.app/amo100/issue/IPI-390) | SCR-28 Contacts List parity | SCR-28 | 🟡 In Progress — code already real via 388; this is verification, not a build | 388 (done) |
| 391 | [IPI-391](https://linear.app/amo100/issue/IPI-391) | RF-04a Company Detail page | SCR-27 | 🟢 Built (PR pending merge — depends on Wave 1 PR #268) — header, 4 tabs, `get-company-detail.ts`, `loading.tsx`. Kind chip, deal name, and AI summary card dropped (not backed by real columns/RPC) | 388 (done), 385 (done) · dup IPI-393 resolved (Duplicate, parented here) |
| 392 | [IPI-392](https://linear.app/amo100/issue/IPI-392) | RF-04b Contact Detail + Profile360 extract | SCR-29 | 🟡 In Progress — real build needed: `getContact(id)`, then extract `<Profile360>` from both detail pages | 391 (must land first) · dup IPI-394 resolved (Duplicate, parented here) |
| 395 | [IPI-395](https://linear.app/amo100/issue/IPI-395) | SCR-30 Pipeline | SCR-30 | 🟡 In Progress — real build needed: `listDeals`, `PATCH /api/crm/deals/[id]`, Realtime, kanban board, at-risk filter, Won/Lost columns locked | 388 (done) — blockedBy relation cleaned up 2026-07-07 |
| 396 | [IPI-396](https://linear.app/amo100/issue/IPI-396) | SCR-31 Deal Detail | SCR-31 | 🟡 In Progress — real build needed: `getDeal(id)`, `deal-stage-control.tsx` (shares write path with 395), Won/Lost ApprovalCard UI **shell only** (inert — real write path is IPI-367). **Consumes** shared `ActivityTimeline`, does not build it | 395 — blockedBy relation cleaned up 2026-07-07 |
| 403 | [IPI-403](https://linear.app/amo100/issue/IPI-403) | BE-CRM-OPT convenience RPCs | — | 🟡 In Progress, P3 — **defer**, not needed for MVP | — |

---

## Corrected build order (2026-07-07, round 2)

```text
Done:        Schema (362) → StatusChip/EntityList/EmptyState/ErrorState (385-387) →
              Companies+Contacts lists (388) → AI wave 1 (368) → ApprovalCard/ApprovalQueue (244)

Wave 1       DONE (2026-07-07). ActivityTimeline (presentational, app/src/components/crm/
(shipped):   activity-timeline.tsx) + 5 data helpers in app/src/lib/crm/queries.ts:
             getCompany, getContact, getDeal, listDeals, listActivities. Not gated on
             391/395/396 — both detail pages and Deal Detail can now import/call these
             directly (no longer blocked). The pages themselves are still in progress,
             per the status table above — Wave 1 only unblocks them, it doesn't wire them.

In progress: IPI-389/390  — verify DC parity on the already-shipped lists, close out
             IPI-391      — Company Detail: page + 4 tabs — still needs getCompany/listActivities wired in, ActivityTimeline rendered
             IPI-392      — Contact Detail: page — still needs getContact wired in, then extract <Profile360> from 391+392
             IPI-395      — Pipeline: still needs PATCH route + Realtime + kanban board (listDeals already built, not yet consumed)
             IPI-396      — Deal Detail: page — still needs deal-stage-control (shares write path with 395)
                            + ActivityTimeline wired in (reuse from Wave 1) + Won/Lost ApprovalCard UI shell, inert

Not started: IPI-367      — Won/Lost gate: POST /api/crm/deals/[id]/convert, reuses intel-approval-card.tsx (IPI-244, done)
                            — blockedBy now correctly points at IPI-396 (fixed 2026-07-07)
             IPI-369      — AI wave 2 (health scoring, summaries, drafts) — needs 395 for at-risk filter
             IPI-370      — Final safety verification (won/lost, cross-org, brand conversion, agent boundaries)

Deferred:    IPI-403      — convenience RPCs, P3, only if Quick-Add UX needs atomic multi-table insert
```

**Why this order, not a strict Wave0–4 scheme:** IPI-391 and IPI-392 are sequential by design (Profile360 is extracted from *both* real pages, not built ahead of them) but IPI-395 (Pipeline) has no real dependency on either — it only needs the schema and the shared atoms, both already done. Building 391/392 and 395 in parallel is safe and saves calendar time; only 396 (Deal Detail) genuinely needs 395 to land first (shared stage-write path).

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
| --- | --- | --- |
| CRM-M1 · Schema & Core Screens | Database + the 4 main screens | #1–#5 |
| CRM-M2 · HITL Gate & Brand Conversion | The Won/Lost safety gate | #6 |
| CRM-M3 · crm-assistant Agent | The AI assistant, both waves | #7–#8 |
| CRM-M4 · Verification | Final proof before Done | #9 |
