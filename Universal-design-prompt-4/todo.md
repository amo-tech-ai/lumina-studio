# iPix / FashionOS — Build Priority Order

**Updated:** 2026-07-12 (evening pass) · Source of truth: [`progress-tracker.md`](progress-tracker.md) (forensic, verified against `app/` code) + live Linear state (fetched this pass, not assumed from ticket titles or a prior snapshot of this file).

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

Backend is done ([IPI-476](https://linear.app/amo100/issue/IPI-476), [IPI-477](https://linear.app/amo100/issue/IPI-477)) — 440-line tested `PlannerEngine`, zero UI imports it.

**Ticket count, verified live against Linear (2026-07-12):** the original roadmap draft (`planner/implementation-roadmap.md`) planned ~54 tickets across separate Foundation/Screens/Security/Analytics/Testing/Documentation/Reliability epics. What actually exists: **33 issues were created, then ladder-reviewed to 10 active implementation tickets + 23 cancelled** (5 oversized parent trackers + 18 absorbed leaves — all still viewable in Linear as Canceled, not deleted, for traceability). `IPI-543` (Documentation & Data Contract) is one of the 23 cancelled — its one useful piece (fixture→schema field mapping) is now a checklist line inside IPI-536, not a standalone ticket. **No further Planner tickets should be created for v1 unless a real blocker appears** — AI/CopilotKit tools, Cloudflare presence/notifications, Analytics, and Reliability stay correctly unticketed.

Finalized execution order (security moved up ahead of screens; Hub moved up ahead of Dashboard/Timeline/Kanban):

| # | Task | Ticket | Status |
|--:|---|---|:--:|
| 1 | Foundation — routes, state-mgmt decision, core infra | [IPI-536](https://linear.app/amo100/issue/IPI-536) | 🔴 Not started |
| 2 | Data & Repository layer | [IPI-538](https://linear.app/amo100/issue/IPI-538) | 🔴 Not started |
| 3 | Shared components & hooks | [IPI-542](https://linear.app/amo100/issue/IPI-542) | 🔴 Not started |
| 4 | Security hardening (anon-access gap + permission tests) | [IPI-544](https://linear.app/amo100/issue/IPI-544) | 🔴 Not started |
| 5 | Hub | [IPI-526](https://linear.app/amo100/issue/IPI-526) | 🔴 Not started |
| 6 | Dashboard | [IPI-555](https://linear.app/amo100/issue/IPI-555) | 🔴 Not started |
| 7 | Workspace — Timeline view | [IPI-552](https://linear.app/amo100/issue/IPI-552) | 🔴 Not started |
| 8 | Workspace — Kanban + Calendar/List | [IPI-553](https://linear.app/amo100/issue/IPI-553) | 🔴 Not started |
| 9 | Settings + Invite | [IPI-556](https://linear.app/amo100/issue/IPI-556) | 🔴 Not started |
| 10 | Mobile/tablet layouts | [IPI-557](https://linear.app/amo100/issue/IPI-557) | ⚪ Not started |

**Deferred, correctly not ticketed yet:** AI/CopilotKit tools, Cloudflare presence/notifications — gated on the unrelated Mastra/Cloudflare provider cutover epic (IPI-485), not a Planner-specific delay.

---

## Lane C — Cross-app mobile (future initiative, not yet ticketed)

Zero deliberate mobile-responsive strategy exists anywhere in the operator app today (confirmed: no `useMediaQuery`/`matchMedia`/`BottomSheet` in `app/src`). Command Center, Brand, Shoots, and CRM are all untracked for mobile. Scope this as its own initiative once Lane A + B ship — don't assume it "comes along" with each screen ticket.
