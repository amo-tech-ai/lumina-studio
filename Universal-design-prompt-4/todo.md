# iPix / FashionOS — Build Priority Order

**Updated:** 2026-07-18 · Lane B re-verified against live Linear + production (`ipix.co/app`, real operator login); Lane A last re-verified 2026-07-12 (spot-checked 2026-07-18: IPI-562/IPI-369 still accurate) · Source of truth: [`progress-tracker.md`](progress-tracker.md) (forensic, verified against `app/` code) + live Linear state, not assumed from ticket titles or a prior snapshot of this file.

**Legend:** 🟢 done · 🟡 in progress/partial · 🔴 not started (Todo) · ⚫ not started (Backlog, lower priority tier than Todo) · ⚪ not ticketed yet

> Old content below this point (10-screen prototype tracker) is 97% shipped and no longer "near-term" — see `git log` for it if needed. This file now tracks the two active build lanes: CRM completion and Planner foundation.

---

## Resolved — the July-12 morning session plan (was "read first," now historical)

The original correction below named IPI-367 as the actual Deal Detail blocker, not IPI-396 (already Done). **IPI-367 is now Done too** — merged same day, PRs [#337](https://github.com/amo-tech-ai/lumina-studio/pull/337) (app code) + [#341](https://github.com/amo-tech-ai/lumina-studio/pull/341) (migration), plus three small follow-on PRs from a merge-readiness audit: [#345](https://github.com/amo-tech-ai/lumina-studio/pull/345) (doc-link fixes), [#346](https://github.com/amo-tech-ai/lumina-studio/pull/346) (Playwright regression test), and [#344](https://github.com/amo-tech-ai/lumina-studio/pull/344) (a small Deal Detail centering CSS fix found during real-browser verification, no ticket needed). Deal Detail now has a real, RLS-hardened, live-verified `won`/`lost` write path with brand-conversion handoff. See the full audit trail: [`tasks/AUDIT/crm-337=341-audt.md`](tasks/AUDIT/crm-337=341-audt.md), [`tasks/AUDIT/ipi-367-real-world-browser-workflow-audit.md`](tasks/AUDIT/ipi-367-real-world-browser-workflow-audit.md), [`tasks/AUDIT/pr-343-344-audit.md`](tasks/AUDIT/pr-343-344-audit.md).

Original reasoning (kept for traceability): the proposed order named **IPI-396 "CRM Deal Detail React Implementation"** as the biggest remaining piece. Checked Linear directly: **IPI-396 is already Done** (merged PR #311, 2026-07-10) — and it deliberately shipped a *narrow* slice (real reads, working non-terminal stage moves, Won/Lost dialog UI that always errors honestly). Won/Lost was **out of scope by design**, deferred to a separate ticket — IPI-367, now also Done.

Also confirmed correct, unchanged: your CRM percentages (Companies 80 / Company Detail 85 / Contacts 80 / Contact Detail 85 / Pipeline 85 / Hub 100-of-tiny-scope) — **Deal Detail moves from 15% to substantially complete** with IPI-367 shipped — and CRM-before-Planner (Planner has zero UI despite a done, tested 440-line backend engine — pure build-order fact, not a design gap).

---

## Lane A — CRM completion (do this first)

| # | Task | Ticket | Status | Why here |
|--:|---|---|:--:|---|
| 1 | Matching→Booking "Request booking" button re-enable | [IPI-528](https://linear.app/amo100/issue/IPI-528) | 🟡 **In Progress** | Unrelated to CRM but a one-toggle fix blocking a working flow. Already started (2026-07-12) — finish this first, it's nearly free. |
| 2 | ~~Won/Lost HITL gate + brand conversion route~~ | [IPI-367](https://linear.app/amo100/issue/IPI-367) | 🟢 **Done** (2026-07-12) | Shipped. PRs #337 + #341, all 12 acceptance criteria checked, live-verified via `verify-rls.mjs` + real browser journeys (won/lost, cross-org rejection, race conditions, retry). This was the real Deal Detail blocker — now cleared. |
| 3 | Companies + Contacts: enable New/Filter actions | [IPI-562](https://linear.app/amo100/issue/IPI-562) | ⚫ Backlog | Downgraded from Todo to Backlog in Linear since the last pass. IPI-363/364 are marked Done, but `progress-tracker.md` shows New/Filter still disabled on both lists. One ticket, not two — same shape, same fix, same PR-sized unit. |
| 4 | Pipeline UX polish — owner filter, keyboard/button move (a11y, flagged P1 in `crm/crm-audit.md`), mobile stage-accordion | [IPI-563](https://linear.app/amo100/issue/IPI-563) | ⚫ Backlog | Also downgraded to Backlog. `risk_score`/`stage_entered_at` columns don't exist — don't re-promise "real risk logic" here, that's IPI-369's `scoreDealHealth`. This ticket is UI polish only. |
| 5 | crm-assistant wave 2 — health scoring, relationship summaries, follow-up drafts, IntelligencePanel sections | [IPI-369](https://linear.app/amo100/issue/IPI-369) | 🔴 Todo | **Now the actual next CRM ticket** — #2 (its hard blocker) is done. Restores the AI panels dropped from Deal/Company/Contact/Pipeline ("not yet wired" labels). Its at-risk filter and health score are what #4's Pipeline polish should surface once revisited. |
| 6 | CRM route welcome + suggestion chips | [IPI-374](https://linear.app/amo100/issue/IPI-374) | 🔴 Todo | Small, can run in parallel with #5 |
| 7 | Notification Center UI (bell/panel) | [IPI-527](https://linear.app/amo100/issue/IPI-527) | ⚫ Backlog | Downgraded from Todo to Backlog. Backend + API fully built and tested, zero UI consumers — still a small lift, high visibility whenever picked up. |
| 8 | CRM MVP acceptance verification | [IPI-370](https://linear.app/amo100/issue/IPI-370) | 🔴 Todo, blocked by #5 only now | **Unblocked from #2** — IPI-367 shipped, so this is now gated solely on IPI-369 (#5). Owns the cross-org RLS pen test + final 6-screen browser sign-off (no-silent-won-lost / no-orphaned-won-deals tests already live in IPI-367's `verify-rls.mjs`). |
| 9 | CRM Hub scope decision | — no ticket needed | 🟢 done | Keep the redirect (`/app/crm` → `/app/crm/companies`). No product ask for KPIs/recent-activity/AI-recommendations surface exists — building one now would be exactly the scope creep `crm-plan.md` §20 already ruled against. Revisit only if Product asks. |
| 10 | Regenerate `types/supabase.ts` for `crm_convert_deal` | [IPI-566](https://linear.app/amo100/issue/IPI-566) | ⚫ Backlog, Low priority | New from the IPI-367 audit trail. `convert-deal.ts` works around the missing types with a documented cast — not urgent, cheap whenever someone's already touching a full type regen for another reason. |

**Not on the critical path, no action needed:** IPI-373 (design sign-off for 02f) is paperwork tracking a screen that already shipped — don't let it block anything, same lesson as the cancelled Planner docs ticket. CRM-POST-*/CRM-ADV-* backlog items (journey replay, digital twin, relationship graph, market intelligence, etc.) are correctly sitting in Backlog, not Todo — leave them there; `crm-plan.md` §20 already triaged them as Future.

**Shipped this session, not separately ticketed (process/tooling, not product):** the `design-to-production` skill's Phase 0 now leads with a live-Supabase audit before trusting any local schema/migration file (PR #343) — direct outcome of catching the IPI-367 migration-ledger drift. `lessons.md` gained entry #9 documenting that drift as a reusable guard. See the [Linear lessons doc](https://linear.app/amo100/document/lessons-design-v2-scr-builds-2026-07-12-15594af0ea05) in DESIGN V2 for the summary.

---

## Lane B — Planner foundation (in parallel with Lane A)

Backend is done ([IPI-476](https://linear.app/amo100/issue/IPI-476), [IPI-477](https://linear.app/amo100/issue/IPI-477)) — 440-line tested `PlannerEngine`.

**Superseded 2026-07-18 — the table below replaces the 2026-07-12 version, which had drifted hard.** Re-checked live against Linear *and* against production (`ipix.co/app`, real operator login, not local dev): rows 1-2, 5, 7-9 of the old table were marked "Not started" but were actually Done days ago; rows 6 (IPI-555), 3-4 partially (old IPI-542/546/548/550) were citing ticket IDs that got Canceled/Duplicate/repurposed after a 2026-07-12→07-16 restructure into narrower `PLN-S1x` slices. Kept below for traceability; do not cite the old IDs going forward.

**Ticket count (2026-07-12 note, now historical):** the original roadmap draft planned ~54 tickets; 33 were created, ladder-reviewed to ~10 active + 23 cancelled. That "~10 active" set has itself since been split further into `PLN-S1A–G` slices (see table). AI/CopilotKit tools, Cloudflare presence/notifications, Analytics, and Reliability correctly remain unticketed for v1.

| # | Task | Ticket | Status | Evidence |
|--:|---|---|:--:|---|
| 1 | Foundation — routes, state-mgmt decision, core infra | [IPI-536](https://linear.app/amo100/issue/IPI-536) | 🟢 Done (2026-07-14) | Linear |
| 2 | Data — Dashboard & Hub reads | [IPI-538](https://linear.app/amo100/issue/IPI-538) | 🟢 Done (2026-07-14) | Linear |
| 3 | Data — Settings & member mutations | [IPI-575](https://linear.app/amo100/issue/IPI-575) | 🟢 Done (2026-07-14) | Linear |
| 4 | Security hardening (anon-EXECUTE cleanup on 9 Planner functions) | [IPI-544](https://linear.app/amo100/issue/IPI-544) | 🟢 Done (2026-07-15) | Linear |
| 5 | Hub | [IPI-526](https://linear.app/amo100/issue/IPI-526) | 🟢 Done (2026-07-16) | Linear + live: `/app/planner` shows 2 real plans, needs-attention banner, type/status filters |
| 6 | Dashboard | [IPI-576](https://linear.app/amo100/issue/IPI-576) | 🟢 Done (2026-07-16) | Linear + live: `/app/planner/dashboard` shows real KPI tiles (9% progress, 1 at risk), recent-plans cards |
| 7 | Workspace shell + view switching | [IPI-578](https://linear.app/amo100/issue/IPI-578) | 🟢 Done (2026-07-14) | Linear + live: `/app/planner/[id]` renders Timeline/Kanban/Calendar/List tab shell |
| 7b | Workspace data — reads (`getInstanceDetail`, `listDependencies`, `getViewConfig`) | [IPI-574](https://linear.app/amo100/issue/IPI-574) | 🟢 Done (2026-07-16), reads only | Linear. **Scope-corrected 2026-07-16 by its own description**: the mutation adapters it originally scoped (`updateTask`/`shiftTask`/`setViewConfig`) were never built — confirmed live against `app/src/lib/planner/mutations.ts`, zero task-level functions. Don't assume Done here means mutations exist; that work moved to row 9b. |
| 8 | Workspace — Timeline (read-only) | [IPI-579](https://linear.app/amo100/issue/IPI-579) | ⚪ Backlog | Live: tab shows literal "Timeline view — content ships in a later Planner ticket." |
| 9 | Workspace — Kanban + List | [IPI-580](https://linear.app/amo100/issue/IPI-580) | ⚪ Backlog | Live: same placeholder pattern confirmed on Kanban tab |
| 9b | Workspace mutation adapters (`updateTask`/`shiftTask`/`setViewConfig` RPCs + Server Actions) | [IPI-649](https://linear.app/amo100/issue/IPI-649) | 🟢 Done (2026-07-16) | Linear — **corrected 2026-07-18 pass 3**, wrongly marked Backlog in the prior pass (missed a direct lookup). PRs #418 (migration-only RPCs), #420 (application adapters + Server Actions), #423 (forensic audit evidence). Row 10b's blocker on this is now cleared. |
| 10 | Workspace — Calendar | [IPI-581](https://linear.app/amo100/issue/IPI-581) | ⚪ Backlog | Linear only, not re-clicked live this pass |
| 10b | Workspace — Task Detail + Safe Mutations (wires `ApprovalCard` to IPI-483's contract; 3 mutation classes, only `shiftTask` drag-based) | [IPI-582](https://linear.app/amo100/issue/IPI-582) | ⚪ Backlog, blocked by `IPI-579`/`IPI-580`/`IPI-581`/`IPI-483` only | Linear — added 2026-07-18 pass 2. **Corrected pass 3:** its mutation-foundation blocker (`IPI-649`, row 9b) is Done, not Backlog — the issue's own Linear description is stale on this point (still says "IPI-649 (Backlog...)"), worth a quick fix there too. This is the ticket that actually makes Timeline/Kanban/Calendar's cards editable once their read-only views (8/9/10) land. |
| 11 | Settings + Invite | [IPI-577](https://linear.app/amo100/issue/IPI-577) | 🟢 Done (2026-07-14) | Linear + live: `/app/planner/[id]/settings` — Members tab live with real member row; Notifications/Workflow/Danger-zone tabs visibly disabled |
| 12 | Mobile/tablet layouts | [IPI-557](https://linear.app/amo100/issue/IPI-557) | ⚪ Backlog | Linear |
| 13 | Staging deploy / rollback / production verification (release gate) | [IPI-542](https://linear.app/amo100/issue/IPI-542) | ⚫ Backlog | Linear — blocked by #4 (now done), not yet run |

Note: old row 3 ("Shared components & hooks," previously cited as IPI-542) tracked a dead mapping — the actual component tickets (IPI-546 PlannerHeader/Toolbar, IPI-548 StatusChip, IPI-550 Empty/Loading/Error states, IPI-540 state-mgmt ADR) were Canceled 2026-07-12 and folded into Foundation (#1) instead of shipping standalone. IPI-542 was later repurposed to the release-gate ticket now in row 13.

**Correct build order for Workspace (corrected 2026-07-18 pass 3):**

```
✅ IPI-574 · PLN-DATA-001B — Planner Data Workspace Reads (Done)
✅ IPI-649 · PLN-DATA-001B-M — Complete Planner Workspace Mutation Adapters (Done)
Next, can run as separate concerns in parallel:
  IPI-579 · PLN-S1B — Planner Timeline Read-Only View (Backlog)
  IPI-580 · PLN-S1C — Planner Kanban and List Views (Backlog)
  IPI-581 · PLN-S1D — Planner Calendar View (Backlog)
  IPI-483 · Workflow Engine v2 — Dependencies and Approvals (status not re-checked this pass)
Then, once the above contracts exist:
  IPI-582 · PLN-S1E — Planner Task Detail and Safe Mutations (Backlog)
  → IPI-583 · Responsive/A11y QA (unblocked by 582, not yet added as its own row)
```

The mutation *foundation* (`IPI-649`) is already done — it's the read-only views (579/580/581) and the approvals engine (483) that gate `IPI-582`, not a missing data layer. Do not revive `IPI-552`/`IPI-553` — both dead (Duplicate/Canceled).

**Deferred, correctly not ticketed yet:** AI/CopilotKit tools, Cloudflare presence/notifications — gated on the unrelated Mastra/Cloudflare provider cutover epic (IPI-485), not a Planner-specific delay.

---

## Lane C — Cross-app mobile (future initiative, not yet ticketed)

Zero deliberate mobile-responsive strategy exists anywhere in the operator app today (confirmed: no `useMediaQuery`/`matchMedia`/`BottomSheet` in `app/src`). Command Center, Brand, Shoots, and CRM are all untracked for mobile. Scope this as its own initiative once Lane A + B ship — don't assume it "comes along" with each screen ticket.
