# Planner — Canonical Task Progress Tracker & Linear Corrections

**Date:** 2026-07-16
**Method:** Live verification — Linear MCP (`get_issue`/`list_issues`/`list_comments`/`save_comment`), GitHub (`gh`), Supabase MCP (`execute_sql` against `nvdlhrodvevgwdsneplk`), `git`/browser rendering against `origin/main`. Cross-checked against two independent prior audits found on disk (`tasks/design2/planner/planner-audit-july15.md`, `tasks/design2/planner/july-15-linear-audit.md`) and two pasted meta-audits (88/100, then 94/100) grading successive versions of this document.
**Update (this pass):** the read-only constraint from the original audit round was lifted — the user explicitly asked for the IPI-526 screenshot fix to be applied. One PR opened ([#401](https://github.com/amo-tech-ai/lumina-studio/pull/401), docs-only, via proper worktree branch), one Linear comment posted (IPI-526). No ticket statuses changed, nothing merged, nothing deleted.

This supersedes the two earlier audit rounds in this thread (my own IPI-484 report, and the 88/100 meta-audit of it). Where they disagree, the verdict below says which one was right, with the live evidence.

---

> **⚠️ Newest pass first.** The section immediately below (**Progress Tracker — latest verified pass**) is the current, live-verified state as of **2026-07-16, this session**. Everything from **§0 onward** is the prior pass's forensic audit trail — kept for history, but three of its own facts have since changed underneath it (flagged inline in the box below and again where they occur). Read the tracker first; treat §0–§9 as background detail, not current status.

---

## 📊 Progress Tracker — latest verified pass (2026-07-16)

**Method — Examine → Verify → Validate → Measure → Identify**, applied to every screen and every tracked ticket in this pass:

1. **Examine** — read the design spec (`Universal-design-prompt-4/uploads/SCR-3*.md`) and the actual React/data code side by side.
2. **Verify** — for every claim (in Linear, in a prior audit, or in the externally-pasted review this pass reconciles), re-check it against live Linear (`get_issue`/`list_issues`) and the real files on disk — not memory.
3. **Validate** — every ✅/finding below has a file:line or a Linear field as its proof; nothing is asserted without a receipt (see the Evidence columns).
4. **Measure** — % complete is *DC-mockup feature parity*, not "ticket closed." A ticket can be Done in Linear while its screen is still 10% built, if the ticket's own scope was intentionally narrower than the full mockup (this happened twice this pass — see the red flags below).
5. **Identify** — gaps that have no owner get named explicitly as new task candidates, after a fresh Linear search confirms nothing already covers them.

**Legend:** 🟢 complete & verified · 🟡 in progress / partially built · 🔴 broken, blocked, or a status that contradicts the real code · ⚪ not started

### Screen-level summary

| Screen | DC feature parity | Status | Primary ticket (Linear) | One-line proof |
|---|---:|:---:|---|---|
| **SCR-35 · Planner Hub** | **~90–95%** | 🟢 | IPI-526 — **Done** | Real server route: search, entity/status filters, cursor pagination, page-scoped attention band, empty/no-match/error states — 834 lines across 6 files, all tested. Only gap: no "New Plan" CTA (deliberately deferred, see §Gaps below). |
| **SCR-33 · Planner Dashboard** | **~65%** | 🟡 | IPI-576 — In Progress, **PR [#414](https://github.com/amo-tech-ai/lumina-studio/pull/414) open** | 5 honest KPI cards + up to 3 recent plans + empty state + responsive layout, real server reads, no fabricated data. This session: fixed 2 Bugbot/Codex findings (mobile stacking, cancelled-plan KPI mismatch) — 0 unresolved review threads, CI green, merge-ready pending review. Missing: approval banner (needs IPI-483), "Upcoming this week" (no ticket owns it), personalized greeting, Intelligence-panel content (deliberately excluded — no real data source yet). |
| **SCR-34 · Planner Settings** | **~45–55%** (25% by raw tab count — Members is 1 of 4 tabs, but the largest by code volume) | 🟡 | IPI-577 — **Done** (Members-only scope, by design) | Members tab: real table, invite dialog, role change, removal, RPC-backed atomic mutations, fully tested. Notifications/Workflow/Danger-zone tabs: disabled `<button>`s only — **zero backend too** (no query/mutation functions exist for any of the three, confirmed by export grep). |
| **SCR-32 · Planner Workspace** | **~10–15%** | 🔴 | IPI-578 — Done (shell only); **IPI-574 marked Done but see red flag below** | 4-tab shell works and is tested, but every tab body renders the literal string `"{view} view — content ships in a later Planner ticket."` Zero Timeline/Kanban/Calendar/List/task-detail/approval-gate/Now-Next code exists anywhere in the repo. **Worse than any prior estimate suggested:** the data-layer mutation ticket (IPI-574) shows Done in Linear, but `mutations.ts` has zero task-level functions — no `shiftTask`, `updateTask`, or `setViewConfig` exist in code at all. |

### 🚩 New finding this pass — not caught by the externally-pasted review

**IPI-574 (PLN-DATA-001B — Workspace Reads & Mutations) is marked Done in Linear, but only 1 of its 3 required PRs shipped.**

- The ticket's own "Delivery boundary" section requires 3 separate PRs: (1) reads-only, (2) migration-only RPCs (`planner_shift_task`, `planner_update_task`), (3) application adapter (`mutations.ts` wrapper + Server Actions).
- Only PR #405 ("read contracts") and #411 (a follow-up on the same reads) are linked. **No RPC migration and no `mutations.ts` task-mutation functions exist on disk.**
- Verified directly: `app/src/lib/planner/mutations.ts` exports exactly 3 functions — `inviteMember`, `updateRole`, `removeAssignment` — all Settings/member-related. Nothing task-level.
- The ticket's own "Completion steps A–K" checklist (in its Linear description) is **still all unchecked** — `- [ ] A`, `- [ ] B`, etc. — yet the ticket status is Done.
- **Impact:** IPI-582 (Task Detail and Safe Mutations) and IPI-483 (Approvals) both assume this data-layer foundation exists. It doesn't yet — the actual gap for Workspace mutations is one layer deeper than "just build the UI."
- **Also:** a real new security ticket, **IPI-647 (PLN-SEC-002 — Enforce Planner Instance Assignment in Database Read Policies, Backlog, High priority)**, was opened today directly from IPI-574's own PR review — a live-verified RLS gap on `planner.*` read policies. The externally-pasted review doesn't mention it because it postdates that review's context.
- **Recommendation:** re-open IPI-574 to In Progress, or split a new `IPI-574b` ticket for the still-missing migration + mutations-adapter PRs — don't let downstream tickets (579–583, 588) start assuming task mutations exist.

### ✅ Verifying the externally-pasted review (this pass's Verify step)

| Review claim | Verdict | Note |
|---|:---:|---|
| SCR-35 Hub ~90–95%, "nearly complete" | ✅ Correct | Independently re-confirmed via direct code read, not just Linear status. |
| SCR-33 Dashboard ~65%, PR #414 open, lists exact excluded features | ✅ Correct | PR #414 also just had 2 review findings fixed in this same session (see table above) — doesn't change the %, just moves it closer to merge-ready. |
| SCR-34 Settings ~45–55%, Members done / 3 tabs placeholder | ✅ Correct | Confirmed the 3 placeholder tabs have **no backend at all**, not just disconnected UI — slightly worse than "UI not wired," more like "nothing built yet." |
| SCR-32 Workspace ~15–20%, "largest remaining gap" | ✅ Directionally right, revise down to ~10–15% | The review's own Linear table for Workspace lists 11 tickets (579–588, 551, 483, 480, 481, 647-not-yet-known) but **never mentions IPI-574** — the direct blocker for 5 of the 11 tickets it does list, and the one with the Done/code mismatch above. |
| IPI-483 in Backlog; all cited Linear IDs/statuses | ✅ Correct | Cross-checked all ~25 cited tickets directly — every status matches. |
| No dedicated tickets exist for: Dashboard "Upcoming this week," Dashboard Intelligence insights, Settings Notifications/Workflow/Danger tabs, Hub "New Plan" flow | ✅ Confirmed | Fresh Linear searches this pass ("Settings," "Danger Zone," "Upcoming this week," "New Plan create instance") found nothing — the review's "create new tickets" recommendation is correct and non-duplicative. |
| Recommended implementation order (Phase 1–4) | ✅ Reasonable, one addition | Insert "re-verify/finish IPI-574's mutation-adapter PRs" at the very front of Phase 1 — everything else in that phase assumes it's already done, and it isn't. |

**Overall verdict: the externally-pasted review is accurate.** Every Linear status and code claim it makes checks out against live sources. Its one blind spot — IPI-574's Done-status/code mismatch — wasn't something a Linear-only or DC-spec-only read would have caught; it required opening `mutations.ts` directly, which this pass did.

### Task-level tracker (all tracked Planner tickets, live status)

| Ticket | Scope | Status | Dot | Evidence |
|---|---|---|:---:|---|
| IPI-476 | Schema & engine core | Done | 🟢 | 10 tables, RLS, PlannerEngine merged |
| IPI-477 | Shoot timeline template | Done | 🟢 | 5-week template seed, 769/769 defaults |
| IPI-536 | Foundation — routes, permissions | Done | 🟢 | PR #347/#348/#389 merged |
| IPI-538 | Data Slice A — Dashboard/Hub reads | Done | 🟢 | PR #370 merged, `queries.ts` |
| IPI-544 | Security hardening (anon EXECUTE) | Done | 🟢 | PR #377 merged, 9 functions revoked |
| IPI-574 | Data Slice B — Workspace reads+mutations | **Done in Linear** | 🔴 | Reads real (PR #405/#411); mutations (`shiftTask`/`updateTask`/`setViewConfig`) absent from code — see red flag above |
| IPI-575 | Data Slice C — Settings mutations | Done | 🟢 | `inviteMember`/`updateRole`/`removeAssignment`, RPC-backed, tested |
| IPI-577 | SCR-34 Settings/Members screen | Done | 🟢 | Members tab real+tested; other 3 tabs correctly out of scope |
| IPI-578 | SCR-32 Workspace shell + tabs | Done | 🟡 | Shell/tabs work; minimal (no PageHeader/FilterBar/Now-Next) |
| IPI-526 | SCR-35 Hub | Done | 🟢 | PR #406 — full filters/search/pagination/states, tested |
| IPI-576 | SCR-33 Dashboard | In Progress | 🟡 | PR #414 open, 0 unresolved threads, CI green |
| IPI-647 | PLN-SEC-002 — RLS read-policy gap | Backlog | ⚪ | New, found via IPI-574's own PR review |
| IPI-579 | Timeline read-only view | Backlog | ⚪ | 0 files exist |
| IPI-580 | Kanban + List views | Backlog | ⚪ | 0 files exist |
| IPI-581 | Calendar view | Backlog | ⚪ | 0 files exist |
| IPI-582 | Task detail + safe mutations | Backlog | ⚪ | Blocked by 579/580/581/483 + IPI-574's still-missing mutation layer |
| IPI-583 | Workspace responsive/a11y QA | Backlog | ⚪ | Blocked by entire S1B–E stack |
| IPI-588 | Now & Next priority bar | Backlog | ⚪ | 0 references anywhere in repo |
| IPI-551 | Adaptive context panel (Intelligence⇄Detail) | Todo | ⚪ | Not started |
| IPI-483 | Workflow engine v2 (approvals) | Backlog | ⚪ | Blocks Dashboard's approval metric + Workspace gate controls. Now explicitly `blockedBy: IPI-649` too. |
| IPI-649 | **NEW** — PLN-DATA-001B-M, Workspace mutation adapters | Backlog | ⚪ | Created this pass — carries the `shiftTask`/`updateTask`/`setViewConfig` scope IPI-574 never shipped. `blockedBy: IPI-536`. Unblocks IPI-582/483. |
| IPI-480 | Realtime sync | Backlog | ⚪ | Not started |
| IPI-481 | In-app notifications | Backlog | ⚪ | Not started |
| IPI-557 | Tablet/mobile layouts | Backlog | ⚪ | Not started |
| IPI-542 | Release gate (staging/rollback) | Backlog | ⚪ | Not started, no staging project confirmed |
| IPI-650 | **NEW** — PLN-HUB-002, Create Planner Instance flow | Backlog | ⚪ | Created this pass. Medium priority, not on critical path. |
| IPI-651 | **NEW** — PLN-S6D, Instance Danger Zone | Backlog | ⚪ | Created this pass. Scoped to archive+cancel only (existing status enum); hard delete/restore deferred. |

### Gaps — 3 tickets created this pass, 4 left as documented recommendations (no authoritative contract yet)

| Gap | Screen | Ticket | Action taken |
|---|---|---|---|
| Workspace mutation adapters (`shiftTask`/`updateTask`/`setViewConfig`) | Workspace | **IPI-649** | ✅ Created — highest priority, unblocks IPI-582/483 |
| "New Plan" creation flow | Hub | **IPI-650** | ✅ Created — no existing owner found, safe to start |
| Danger zone (archive/cancel) | Settings | **IPI-651** | ✅ Created — scoped down to archive+cancel v1, hard delete deferred |
| "Upcoming this week" feed | Dashboard | `PLN-DASH-002` | ⏸ Documented only — needs a real "upcoming tasks" data contract decision first |
| Intelligence-panel insights | Dashboard | `PLN-INT-002` | ⏸ Documented only — needs authoritative events/evidence source first |
| Notification settings tab | Settings | `PLN-S6B` | ⏸ Documented only — should depend on IPI-481 (Notifications), not started |
| Workflow settings tab | Settings | `PLN-S6C` | ⏸ Documented only — should depend on IPI-483 (Approvals), not started |

Also updated: **IPI-574**'s description now carries an explicit scope-correction note pointing to IPI-649 (kept Done, not reopened — its reads delivery is real). **IPI-582** and **IPI-483** now both list `IPI-649` in `blockedBy`.

Do not create tickets for anything already in the task-level tracker above (579–583, 588, 551, 483, 480, 481, 542, 647, 649, 650, 651, 652, 653) — those are real, correctly scoped, and just not started yet.

---

## ⚙️ Efficiency restructuring pass (2026-07-16, second pass)

A follow-up review proposed a contract-first, dependency-driven task restructuring to reduce duplicated code and rework. Verified against live Linear relations (not just prose) before acting — one recommendation was wrong and was **not** executed.

### ❌ Rejected: "merge IPI-557 and IPI-583"

Real Linear relations show these are **not duplicates** — they're already correctly sequenced: **IPI-557 is already `blockedBy: IPI-583`** (plus IPI-526/576/577). IPI-557 is the broader pass — responsive breakpoints across all 4 top-level screens (Dashboard/Hub/Settings/Workspace) using `BottomSheet`/`BottomNavigation`. IPI-583 is Workspace-only and owns real, distinct scope IPI-557 never mentions: mobile deep-link routing (a documented conflict with the generic "mobile lands on Dashboard" rule), long-content/slow-response failure tests, reduced-motion, focus-trap/Esc-priority. Merging them would silently drop that scope. **No Linear change made** — left as-is, correctly sequential.

### ✅ Executed: real gap found and wired

**IPI-579, IPI-580, IPI-581 now list IPI-551 (Adaptive Context Panel) in `blockedBy`.** Each of their own acceptance criteria assumes "selecting a task opens the adaptive right panel's Detail mode" — but none previously listed IPI-551 as a blocker, even though IPI-551 is genuinely unbuilt (`adaptive-panel.tsx` doesn't exist on `origin/main`). IPI-551's own description explicitly flagged this exact sequencing gap as unaddressed. Now closed.

### ⚠️ Partially correct: IPI-647 (RLS) sequencing

The proposal put IPI-647 (database read-policy security gap) in "Phase 1 — foundations," ahead of the read-only view tickets. IPI-647 is real and High priority — but its own scope explicitly excludes "Planner UI changes," and the intended read path (`getInstanceDetail` etc.) already has an app-layer permission gate in front of it (PR #405). The actual risk IPI-647 closes is *other/future* code paths that query the tables directly, bypassing that gate. **No `blockedBy` edge added** to IPI-579/580/581/649 — that would misrepresent them as unsafe to start, which they aren't as long as they keep following their own "no direct `supabase.from()`" rule. IPI-647 correctly already blocks only IPI-542 (release gate), which is the right place for it.

### ✅ Executed: contract-first splits

| New ticket | Split from | Why |
|---|---|---|
| **IPI-652 · PLN-DATA-002** — Planner Upcoming Work Summary | (Dashboard "Upcoming this week," previously just a documented recommendation) | Data contract before UI, so the eventual Dashboard strip is a small honest wiring PR, not a UI built against invented data |
| **IPI-653 · PLN-DATA-003** — Planner Instance Creation Service | **IPI-650** (PLN-HUB-002) | IPI-650 previously bundled backend RPC + UI dialog in one ticket. Split so the creation service is built and tested independently — IPI-650 is now `blockedBy: IPI-653` and scoped to UI-only (CTA, template picker, redirect, error rendering) |

### Confirmed correct, no action needed

IPI-580 (Kanban+List) stays bundled — already one ticket. IPI-579/581 (Timeline/Calendar) stay separate — already separate tickets, correctly, since they share data but not UI logic (week-grid date math vs. month-grid date math are genuinely different). Settings Notifications/Workflow — correctly still undocumented-only, should depend on IPI-481/IPI-483 respectively when created. IPI-651 (Danger Zone) — already scoped to archive+cancel v1 with delete/restore explicitly deferred, matches the "freeze the scope decision" ask.

---

## 0. Audit-of-audits verdict

Three audit documents now exist for this epic: mine (in-chat), the pasted meta-audit (88/100 grade of mine), and two on-disk reports from a separate "opencode agent" pass dated 2026-07-15. Reconciling all four against live sources:

| Claim | Source | Verdict |
|---|---|---|
| IPI-526 blocked by IPI-574 | Meta-audit says my report claimed this | **False — I never claimed this.** My report always listed IPI-526's blocker as the missing SCR-35 artifact, with no IPI-574 dependency. Live Linear confirms real `blockedBy` = IPI-536 + IPI-538 (both Done). The meta-audit's "critical error #2" misreads my report. |
| Recommends expanding IPI-574 to instance/task CRUD | Meta-audit says my report recommended this | **False — not in my report.** This recommendation exists in `planner-audit-july15.md` (the other on-disk audit, §"Next Critical-Path Tasks": *"Add RPCs for instance CRUD, task CRUD, view_configs read/write"*), not in mine. The meta-audit is likely critiquing that document, misattributed to mine. **The correction itself is right** — live IPI-574 text explicitly scopes only `getInstanceDetail`, `listDependencies`, `getViewConfig`, `updateTask`, `shiftTask`, `setViewConfig`; instance/task CRUD is out of scope and would be scope drift. |
| "All primary screens are stubs" is too broad | Meta-audit | **Fair, partially.** My executive summary's headline sentence overstated relative to my own detail table two sections below it, which correctly listed IPI-577 (Settings/Members) and IPI-578 (Workspace shell) as Done and real. The imprecise phrasing is a legitimate critique of my report's wording, not its underlying facts. |
| IPI-544 epic text stale ("open, not merged") | Both audits agree | **Confirmed.** Merged 2026-07-15, live grants verified. |
| IPI-578 epic text stale ("PR #380 open") | Both audits agree | **Confirmed.** Merged 2026-07-14T09:35. |
| Duplicate/canceled ticket list (IPI-552/553/555/556/537/539/540/543/554/559/560/561 + IPI-569/570) | Meta-audit | **Confirmed, all 14 verified live** — 12 Canceled, 2 Duplicate (IPI-552, 555, 556 are `Duplicate` status specifically, not `Canceled`; the rest are `Canceled`). See §4. |
| IPI-481 should not depend on IPI-480 (notifications shouldn't need Realtime) | Meta-audit, new architectural point | **Legitimate design critique, not a factual correction** — live IPI-481 does list IPI-480 as a real `blockedBy` today, so the meta-audit isn't wrong about current Linear state, it's proposing a change. Worth doing (see §5). |
| Production-readiness score: 28 (mine) vs 35 (meta-audit) vs 53 (opencode, 2026-07-15) | — | All three are internally consistent; they diverge on **weighting**, not facts. Opencode's 53 weights backend completeness (DB/RLS/security, each 85–100) equally with user-facing surface (Dashboard 10, Hub 5, views 15). Mine weighted end-user-usable surface much more heavily, since "production ready" for a product a user opens should reflect what a user can do, not what's invisibly correct. Reconciled score below: **32/100**, closer to mine — see §8. |

**New findings this pass surfaced, not in any prior audit — see §1–4 below.**

---

## 0.5. Second-pass verdict (94/100 grade of this doc) — reconciled

A follow-up review graded this document 94/100 and made several further suggestions. Verified against live sources:

| Claim | Verdict |
|---|---|
| IPI-526 screenshot fix should be applied, not just recommended | **Done this pass** — see §1a. |
| Workflow/phase row growth needs immediate investigation, with concrete diagnostic SQL | **Correct, and now diagnosed to a precise root cause** — see §7's revised red-flag entry. The suggested queries (group by hour, group by workflow_id phase-count, group by name/entity_type duplicates) were run; the actual cause is more specific than any of the hypothesized options. |
| "No Planner instances exist anywhere" is too absolute — should scope to the queried project/checkout | **Fair, corrected.** Reworded throughout to "zero rows in the production project queried (`nvdlhrodvevgwdsneplk`) via Supabase MCP; no creation path found on `origin/main`" — this doc never had access to other environments and shouldn't imply it checked them. |
| "4 of 4 primary user-facing screens" mixes screen and view-mode counting | **Correct, was a real wording bug** — Dashboard/Hub are 2 routes, the 4 Workspace view bodies are sub-views of one route (IPI-578's shell), not 4 more screens. Fixed in §7. |
| Screenshot shouldn't become a hard engineering blocker; the `.dc.html` is the higher-authority artifact | **Agreed** — reflected in the IPI-526 Linear comment posted this pass (§1a): the ticket's own `blockedBy` (536✅, 538✅) is what actually gates it, not the screenshot. |
| IPI-481 dependency chain should be `483 → durable event → consumer → public.notifications`, not `480 → 481` | **Reasonable refinement, incorporated** — see revised §5.4. |
| IPI-483 shouldn't own Dashboard UI consumption of the approval metric — split into "IPI-483 exposes a typed query result" vs. "IPI-576/Dashboard consumes it" | **Reasonable refinement, incorporated** — see revised §5.7. |
| Missing checks: instance-lifecycle proof, idempotency constraints, audit scripts for remote-DB safety, DB tests, a real release fixture | **Partially checked this pass** — `planner.instances` has a real unique constraint `(org_id, entity_type, entity_id, workflow_id)`; `planner.workflows` has none beyond its primary key. Script-safety audit found the actual leak source (§7) — it isn't `verify-planner-scenario.mjs`, whose `finally` block does clean up its own orgs/users. The rest (DB tests, release fixture) remain open recommendations, unchanged. |

---

## 0.6. Third-pass correction — IPI-526 was auto-closed by mistake, now reverted

After PR #401 and #402 were merged, a third review caught something this doc missed: **IPI-526 had flipped to `Done`** (`completedAt: 2026-07-16T08:14:36`, two seconds after PR #401 merged at `08:14:34`). Verified live — this is real, not a misread. It was not caused by anything in this doc or by any explicit status change made this session (the IPI-526 Linear comment posted earlier explicitly said *"Leaving status as Backlog... since #401 hasn't merged yet"*) — the GitHub↔Linear integration auto-transitions a linked issue to Done when its attached PR merges, and PR #401 was attached to IPI-526. `app/src/app/(operator)/app/planner/page.tsx` on `origin/main` is still confirmed to be the 10-line route stub — none of IPI-526's actual acceptance criteria (A–J: paginated read, filters, cursor, cards, states, verification) were touched by either merged PR.

**Corrected this pass:** reverted IPI-526 to `Backlog` and rewrote its description's Start-condition callout to document both the resolution (screenshot done) and the auto-close mistake, with an explicit note for future PRs: *"a design-evidence-only PR does not satisfy this ticket — do not let it auto-close again."*

**Lesson for this doc's own method:** verifying a Linear ticket's status once (as this doc did right after taking an action) isn't sufficient when a PR-linked automation can silently change it again *after* that check — status should be re-confirmed immediately before finishing a session, not just after each individual action.

---

## 1. NEW — IPI-526's blocker is overstated: the design file exists, only the audit screenshot is missing

The ticket's "Start condition" note (added 2026-07-14) says: *"no raw SCR-35 visual artifact or audit screenshot exists in the current checkout... the actual `.dc.html` file and/or a fresh audit screenshot do not [exist]."*

**Verified live:**
- `Universal-design-prompt-4/Pages/SCR-35-Planner-Hub.dc.html` **exists on `origin/main` right now** — 379 lines, real content (icons, CSS tokens, full markup), confirmed via `git ls-tree origin/main` and `git show origin/main:<path>`.
- It has been on `origin/main` since **2026-07-14T01:30:44Z**, via PR #368 ("docs(design): archive Universal-design-prompt-4 design export") — merged **before** the Start-condition note was even added to the ticket that same day.
- A comment added to IPI-526 on **2026-07-15T22:55:53Z** (over a day after PR #368 merged) still says *"implementation is still blocked by the documented SCR-35 visual-artifact start condition"* — written without checking `origin/main`.
- What genuinely **is** still missing: an audit screenshot. `Universal-design-prompt-4/planner/audit-shots/` on `origin/main` has `32-workspace.png`, `33-dashboard.png`, `34-settings.png`, `mobile-gallery.png` — **no `35-hub.png`**. This is the one real gap.

**Correction:** IPI-526's blocker is not "locate/restore a missing design file" (the bigger, scarier framing) — it's "render a screenshot of a file that already exists" (a 5-minute task: open `SCR-35-Planner-Hub.dc.html` in a browser, screenshot it, drop it in `audit-shots/`). This meaningfully de-risks the single most-cited blocker in the whole epic and should let IPI-526 start almost immediately.

### 1a. Actioned this pass

- Rendered `SCR-35-Planner-Hub.dc.html` in a real browser (Playwright, 1440×960) — confirmed it's a complete, working screen (plan grid, filters, at-risk band, intelligence panel), not a stub.
- Captured `35-hub.png` and opened **[PR #401](https://github.com/amo-tech-ai/lumina-studio/pull/401)** (docs-only, `Universal-design-prompt-4/planner/audit-shots/35-hub.png`) via a proper worktree branch — full pre-push gate (typecheck + 1261 tests) passed.
- Posted a correction comment on IPI-526 in Linear explaining the file always existed, only the screenshot was missing, and that once #401 merges the ticket's real blockers (IPI-536 ✅, IPI-538 ✅) are fully satisfied. Left status as Backlog rather than flipping it — that's a call for whoever picks up the ticket once the PR merges.

---

## 2. NEW — IPI-526 ticket number was reused for unrelated Bedrock work (already partially corrected)

Confirmed live: a comment on IPI-526 dated 2026-07-15 documents that 21 `main` commits tagged `feat(IPI-526)` actually implemented AWS Bedrock provider fallback — completely unrelated to the Planner Hub. The real Bedrock ticket is **IPI-564 · CF-AI-012a — AWS Bedrock Provider Fallback** (confirmed live, In Progress, project "AI Platform — LLM Providers"). The comment explicitly states git history was *not* rewritten and IPI-526 remains correctly scoped as Planner Hub. This explains the false-positive PR #338 match any GitHub-title search for "IPI-526" surfaces — it's a genuine identifier collision, not a coincidental string match. **No further action needed** — this was already found and annotated by a prior pass; flagging here only so it isn't rediscovered as "new" again.

---

## 3. NEW — 7 Planner shared-component tickets are parented under an unrelated, canceled Cloudflare ticket

**IPI-545 (PlannerCard), IPI-546 (PlannerHeader/Toolbar), IPI-547 (PlannerFilters), IPI-548 (PlannerStatusChip), IPI-549 (PlannerProgress), IPI-550 (Empty/Loading/Error states), IPI-551 (Adaptive context panel)** — all confirmed **Canceled**, and all `parentId = IPI-530`. IPI-530 is **CF-AI-015 — Verify Live Multi-Turn Tool Calling and Security**, a Canceled Cloudflare AI-gateway ticket in the "AI Platform — LLM Providers" project, itself `parentId = IPI-484` (the Planner epic!). So there's a second, previously-unflagged misparenting chain: `IPI-484 → IPI-530 (Cloudflare, canceled) → 7 canceled Planner shared-component tickets`. This compounds the already-known IPI-482 (parented under IPI-486) and the IPI-529/530/531/532/533 Cloudflare-tickets-under-the-Planner-epic issue found in the first audit round.

**Correction:** These are all Canceled already, so there's no executable-work risk — but the parenting noise makes IPI-484's Linear tree misleading to anyone browsing it. Re-parent or unlink for hygiene (low priority, cosmetic).

---

## 4. Canonical duplicate/canceled ticket list — fully verified

All 14 tickets the meta-audit named as "correctly canceled/superseded" are confirmed live:

| Ticket | Real status | Real parent |
|---|---|---|
| IPI-569 · Planner State Machine & Lifecycle Management | Canceled — folded into IPI-536 | IPI-484 |
| IPI-570 · Planner Dependency & Critical Path Engine | Canceled — merged into IPI-483 | IPI-484 |
| IPI-552 · PLN-S1 — TimelineGrid view | **Duplicate** of IPI-579 | IPI-478 |
| IPI-553 · SCR-32 Workspace — Kanban+Calendar+List | Canceled — split into IPI-580/581 | IPI-478 |
| IPI-555 · PLN-S5 — SCR-33 Dashboard React impl | **Duplicate** of IPI-576 | IPI-479 |
| IPI-556 · PLN-S6 — SCR-34 Members + Invite flow | **Duplicate** of IPI-577 | IPI-479 |
| IPI-537, 539, 540, 543, 554, 559, 560, 561 | All Canceled — consolidated into current canonical tickets | IPI-478 |

None of these should be reopened or treated as executable work. (Note: IPI-552/555/556 are `Duplicate` status specifically, not `Canceled` — a distinction worth preserving if Linear filters are ever built off status type.)

---

## 5. Corrections needed in Linear (recommendations only — not applied)

Ranked by how much they'd actually change someone's decisions if left uncorrected:

1. **IPI-526** — Update the Start-condition note: the `.dc.html` file exists on `origin/main` (has since 2026-07-14); only the audit screenshot (`35-hub.png`) is missing. This is the highest-value single correction — it likely unblocks the epic's most-cited blocker today.
2. **IPI-484 epic description** — fix: IPI-578 status (merged 2026-07-14, not "open"), IPI-544 status (Done/merged 2026-07-15, not "open, migration-only"), IPI-476's cited score (ticket itself says 84/100, epic text says 94), IPI-574's real status (In Progress since 2026-07-15, not "Backlog — startable now" — it started the day after the epic's last "verified" snapshot).
3. **IPI-588** — remove the stale "PR #380 open, not yet merged" line; IPI-578 (which #380 belongs to) is Done.
4. **IPI-481** — reconsider its `blockedBy: IPI-480`. Notifications should plausibly be sourced from durable `planner.events`/mutation-contract writes, not from a client Realtime sync mechanism; a Realtime *outage* shouldn't block notification delivery. Proposed dependency chain: `IPI-483 / mutation event contract → durable planner.events row → notification consumer → public.notifications`, with `IPI-480` only responsible for pushing the live UI refresh, not for owning notification creation. Live Linear does show the `480 → 481` dependency exists today, so this is a proposed architecture change, not a data-accuracy fix — flag for a design decision, don't silently remove it.
5. **IPI-545–551 (7 Canceled tickets)** — re-parent away from IPI-530 (an unrelated, Canceled Cloudflare ticket) for tree hygiene. Cosmetic, zero execution risk since all are Canceled.
6. **IPI-529–533 (5 Cloudflare/AI tickets, all Canceled)** — same cosmetic re-parenting need, already flagged in the prior audit round; still unresolved.
7. **No ticket owns wiring `checkGate()`'s output into the Dashboard's approval query** (`queries.ts` currently hardcodes `{ available: false }`). IPI-483 owns gate logic itself but its AC don't explicitly name this connection point. Split ownership precisely rather than dumping it all on IPI-483: **IPI-483** should expose a typed, stable "available approvals" query result; **IPI-576** (or a small Slice-A follow-up) should be the one that consumes it in Dashboard metrics. Don't make IPI-483 touch Dashboard UI it doesn't otherwise own.
8. **No ticket verifies or builds the Planner-instance creation path.** Confirmed live: `planner.instances` has 0 rows; `planner.workflows` (2,144 rows) and `planner.phases` (23,573 rows) are seeded and growing, but nothing has ever turned a workflow template into an instance. Whether shoot/campaign/deal creation is *supposed* to auto-trigger `ensure_default_5_week_workflow`/`bootstrap_owner_assignment` and simply never has, or whether that wiring doesn't exist at all, was not resolved by any audit round so far — this is the single largest remaining unknown blocking any real end-to-end proof.

### 5.9. Drafted follow-up tickets (not created — proposals only, per instruction)

**IPI-XXX · PLN-DATA-002 — Make default Planner workflow bootstrap intentional, not unconditional**
- *Purpose:* Stop every `organizations` insert anywhere in the platform from silently creating a Planner workflow + 11 phases.
- *Evidence:* `organizations_ensure_planner_default` trigger is unconditional (source confirmed via `pg_get_functiondef`); 2,140/2,144 live `planner.workflows` rows belong to unrelated test orgs from 5 non-Planner SQL scripts with no cleanup, plus at least one `verify-rls.mjs` cleanup miss.
- *Scope:* Either (a) gate the trigger behind an explicit `organizations.planner_enabled` flag / entity-type check, or (b) move the bootstrap out of the org-creation trigger entirely and into the actual shoot/campaign/deal → `planner.instances` creation path (this option would also directly close ticket #2 below). Do not add a DB uniqueness constraint to solve this — the function is already idempotent per-org; the defect is *scope* (fires for orgs that will never touch Planner), not duplication.
- *Out of scope:* Retroactive cleanup of the 2,140 existing leaked rows — separate decision, needs org-by-org review since some may not be test data.

**IPI-XXX · PLN-DATA-003 — Prove Planner instance bootstrap from a real source entity**
- *Purpose:* Establish and prove the one missing link in the whole epic: entity creation → real `planner.instances` row → Hub/Dashboard/Workspace all show it.
- *Evidence:* `planner.instances` = 0 rows in the only project checked; no code path confirmed anywhere on `origin/main` that inserts into it.
- *Scope:* `create shoot/campaign/deal → exactly one planner.instances row → correct workflow selected → phases/tasks instantiated → owner assignment created (bootstrap_owner_assignment) → visible in Hub → counted in Dashboard → opens in Workspace`. Needs a companion idempotency test (retry doesn't double-create) and a cleanup path for the test fixture.
- *Blocks:* Every downstream screen ticket's "real browser, real data" acceptance bar.

**Separately (test hygiene, not Planner-scoped, flagging only):** the 5 SQL scripts with zero org cleanup are a pre-existing pattern outside this epic — worth its own ticket in whichever area owns Booking/Notifications/Talent-availability test infra, not proposed here since it's not a Planner task.

---

## 6. Progress tracker — full canonical inventory

> **[SUPERSEDED]** The tables immediately below (§6) were accurate when written but are now stale on 3 rows: **IPI-574** and **IPI-576** have since moved out of "In Progress" (574 → Done-in-Linear-with-a-code-gap; 576 → PR #414 open), and **IPI-526** has since moved out of "Blocked" to genuinely **Done** with real, verified code. See the **Progress Tracker at the top of this document** for current state — left here unmodified as the historical record of what this pass's audit found at the time.

### Done (verified merged on `origin/main`)

| Ticket | Scope | PR(s) | Merge commit |
|---|---|---|---|
| IPI-536 · Planner Foundation — routes, state-mgmt, core infra | Routes, permissions, status-transitions | #347, #348, #389 | `298b1f5`, `8284e86`, `4b27d1d7` |
| IPI-538 · PLN-DATA-001A — Dashboard & Hub Reads | Read-only query layer | #370 | `c94d2ef2` |
| IPI-575 · PLN-DATA-001C — Settings & Member Mutations | Invite/role/remove RPCs | #384, #387, #390 | `3ce31aa1`, `e9cc846e`, `cd519fc4` |
| IPI-544 · Planner Security Hardening | Revoked anon EXECUTE on 9 functions | #377 | `485291c3` |
| IPI-476 · Planner schema & reusable engine core | 10 tables, RLS, PlannerEngine | #283, #284 (+9 more) | — |
| IPI-477 · Shoot production timeline template | 5-week template seed | #305 | `b57129b` |
| IPI-578 · PLN-S1A — Workspace Shell and View Switching | 4-tab shell (all view bodies still stubs) | #380 | `0ed212a5` |
| IPI-577 · PLN-S6 — Settings and Member Access | Members tab, invite dialog, role table | #385, #388, #389 | `71f3b991`, `d3379d6a`, `4b27d1d7` |
| IPI-587 · FIX-SB-TYPES-002 | Reconciled generated Supabase types | #376 | `c8f1bd08` |

### In Progress (verified via live Linear `status`/`startedAt`)

| Ticket | Started | Real blockedBy | Real blocks |
|---|---|---|---|
| IPI-574 · PLN-DATA-001B — Workspace Reads & Mutations | 2026-07-15T19:24 | IPI-536 ✅ | IPI-588, 579, 580, 581, 582, 483, 480, 482 — **critical path** |
| IPI-576 · PLN-S5 — Dashboard React implementation | (In Progress, no PR found yet) | — | IPI-557 (partially) |

### Blocked (Backlog, real unmet blockers confirmed live)

| Ticket | Real blockedBy | Blocker status |
|---|---|---|
| IPI-526 · Planner Hub (SCR-35) | IPI-536 ✅, IPI-538 ✅ | Screenshot gap closed — [PR #401](https://github.com/amo-tech-ai/lumina-studio/pull/401) merged. No remaining Linear blocker; genuinely startable now. (Auto-closed to Done on merge by GitHub↔Linear integration, then manually reverted to Backlog — see §0.6.) |
| IPI-579 · PLN-S1B — Timeline | IPI-574 (In Progress), IPI-578 ✅ | Waiting on 574 |
| IPI-580 · PLN-S1C — Kanban+List | IPI-574 (In Progress), IPI-578 ✅ | Waiting on 574 |
| IPI-581 · PLN-S1D — Calendar | IPI-578 ✅, IPI-574 (In Progress) | Waiting on 574 |
| IPI-588 · PLN-S1G — Now & Next bar | IPI-578 ✅, IPI-574 (In Progress) | Waiting on 574 |
| IPI-582 · PLN-S1E — Task Detail & Safe Mutations | 581, 580, 579, 483, 574 (all open) | Furthest from ready |
| IPI-583 · PLN-S1F — Responsive/A11y QA | Entire S1B–E stack | Furthest from ready |
| IPI-483 · Workflow engine v2 (approvals) | IPI-574, 477 ✅, 476 ✅ | Waiting on 574 |
| IPI-480 · PLN-RT-001 — Realtime | 574, 582, 483, 476 ✅ | Waiting on 574/582/483 |
| IPI-481 · PLN-NOTIF-001 — Notifications | 483, 476 ✅, 480 | Waiting on 483/480 (see §5.4) |
| IPI-557 · PLN-S7 — Tablet/mobile layouts | IPI-577 ✅, IPI-526, IPI-576, IPI-583 | Waiting on 526/576/583 |
| IPI-542 · PLN-REL-001 — Release gate | IPI-544 ✅, IPI-557 | Waiting on 557 |
| IPI-482 · Mastra AI tools + HITL | Real parent is **IPI-486**, not this epic | Tracked elsewhere — see §5 |

### Correctly Canceled/Duplicate (do not reopen)

See §4 above (14 tickets) plus IPI-545–551 (§3, 7 tickets).

---

## 7. Errors, red flags, failure points, blockers — consolidated

**Red flags (data integrity / process):**
- Epic tracker doc (IPI-484 description) contains 4 confirmed-stale status claims (IPI-578, IPI-544, IPI-476's score, IPI-574's status) — it is not being kept in sync with the tickets it summarizes.
- Two ticket-ID collisions found: IPI-526 (Planner Hub vs. Bedrock commits) and a 7-ticket misparenting under IPI-530 (Cloudflare). Both are now understood/annotated but signal the same root cause — issue IDs and parent links drifting from intent under fast ticket creation.
- `planner.workflows`/`planner.phases` growth — **root cause confirmed to source-code certainty this pass.** `organizations` has a trigger, `organizations_ensure_planner_default` (`AFTER INSERT ON public.organizations FOR EACH ROW`), whose function body (`trg_organizations_ensure_planner_default` → `planner.ensure_default_5_week_workflow`) is **100% unconditional** — no `WHEN` clause, no entity_type/feature-flag gate, calls the bootstrap for every org insert anywhere in the codebase. Read via `pg_get_functiondef`, not inferred. The bootstrap function itself **is** properly idempotent per-org (an advisory xact lock + an existence check before inserting the workflow, plus `ON CONFLICT (workflow_id, slug) DO NOTHING` on phases) — so it does *not* create duplicate workflows for a given org, correcting an earlier hypothesis. The growth is purely "one real workflow + 11 real phases per never-cleaned-up test org," not a race condition.
  - **Leak sources, enumerated by file:** 5 standalone SQL scripts — `scripts/test-booking-exclude-constraint.sql`, `test-booking-notifications-trigger.sql`, `test-notification-reads-rls.sql`, `test-get-list-bookings.sql`, `test-check-talent-availability.sql` (all Booking/Notification/Talent-availability feature tests, unrelated to Planner) — insert a fresh `organizations` row every run with **zero cleanup/delete statement anywhere in the file** — guaranteed permanent leaks, one org per run, forever. `scripts/verify-rls.mjs` (the Planner RLS probe used throughout this session) creates `"RLS Org A {stamp}"` but **does** attempt cleanup via a `finally` block calling `cleanupRlsTestData({orgId: orgAId, ...})` — yet at least one surviving `"RLS Org A"` row was found live, meaning that cleanup isn't 100% reliable (most likely a crashed/killed run skipping the `finally`, or a bug in `cleanupRlsTestData` — not further diagnosed this pass).
  - `planner.instances` stays at 0 because none of these unrelated test orgs ever create an actual shoot/campaign/deal, so the workflow template never gets attached to a real instance.
  - **Security:** not a privilege-escalation issue — the trigger function is `SECURITY DEFINER` with an explicit pinned `search_path` (`'public','planner'`, matching this repo's established pattern), and it only ever fires as a side effect of an `organizations` insert, never directly callable by `anon`/`authenticated` the way the `planner_*` RPCs IPI-544 hardened are.
  - **Do not delete anything without a dedicated cleanup ticket** — this affects org data outside Planner's scope and wasn't in scope to fix here. See §5.9 for the proposed follow-up tickets.

**Failure points (product):**
- **Zero rows in `planner.instances`** in the production Supabase project queried (`nvdlhrodvevgwdsneplk`, via MCP), and no audit round has confirmed a code path anywhere on `origin/main` that creates one. Scoped precisely: this doc did not check any other environment (local, staging, or a different Supabase project) — only that this is unproven in the one project and codebase state this audit had access to. It's still the largest single risk to the epic succeeding — every downstream screen ticket's "prove it in a real browser with real data" acceptance bar is unmeetable until this is resolved.
- Approval-gate engine logic (`checkGate()`) is built and tested but has no consumer — `queries.ts` hardcodes the dashboard's approval metric as unavailable. IPI-483's own AC don't explicitly close this gap (see §5.7).
- Of the 6 Planner UI surfaces (Dashboard route, Hub route, and the 4 Workspace view bodies inside IPI-578's shell), only **Settings/Members** is a real, working, tested screen today. Dashboard and Hub are both bare route stubs; all 4 Workspace view bodies (Timeline/Kanban/Calendar/List) render an explicit `"content ships in a later ticket"` placeholder inside an otherwise-working tab shell. **[SUPERSEDED]** — Hub and Dashboard are no longer stubs; see the Progress Tracker at the top. The 4 Workspace view-body placeholders are still accurate and unchanged.

**Blockers (sequencing):**
- **IPI-574** is the single highest-leverage item in the whole tree — it directly or transitively blocks 8 other tickets (588, 579, 580, 581, 582, 483, 480, 482).
- **IPI-526's screenshot gap** (§1) is a fast, non-code unblock that's been mischaracterized as a bigger blocker than it is.
- **IPI-542 (release gate)** is many tickets deep (behind 557 → 526/576/583) and no distinct staging Supabase project was found via MCP — release readiness has not meaningfully started.

---

## 8. Reconciled production-readiness score: 32/100

| Layer | Score | Basis |
|---|---|---|
| Schema/RLS/security | 90/100 | Mature, hardened, live-verified (35 policies, anon EXECUTE revoked, migration drift = none) |
| Data/business logic | 55/100 | Real and tested for members + scheduling math; task-mutations layer (IPI-574) still in progress, approval-gate output unwired |
| User-facing screens | 12/100 | Only Settings→Members is real and usable; Dashboard/Hub/4 Workspace views are stubs |
| Realtime/Notifications/AI | 0/100 | Entirely unbuilt |
| Instance data / end-to-end journey | 0/100 | Zero instances exist; no confirmed creation path |
| Release readiness | 5/100 | No staging environment confirmed; release gate ticket not started |

**Why 32, not 28 (mine) or 53 (opencode):** Raised slightly from my original 28 in recognition that IPI-574 has since moved from Backlog to actively In Progress, and that IPI-526's blocker is now known to be much smaller than previously framed (§1) — both are real, dated improvements since the last pass. Kept well below opencode's 53 because that score weights invisible backend correctness as equally important as whether a user can open the app and do anything real — for a "production-ready" verdict on a product surface, the honest answer is still driven by the fact that no one has ever created a Planner instance and three of four primary screens render nothing.

> **[SUPERSEDED — recalculated 2026-07-16, latest pass]** "User-facing screens: 12/100" is stale — Hub (~90%) and Dashboard (~65%) both shipped real code since this row was written; only Workspace (~12%) is still accurate. Rough updated layer score: **~54/100** for user-facing screens (Hub 90, Dashboard 65, Settings ~50, Workspace ~12, averaged). This barely moves the **overall composite** (~32 → ~34/100), because screens are only 1 of 6 weighted layers and Realtime/Notifications/AI (0) and Instance-data/end-to-end (0, not re-verified this pass) still drag it down. The headline verdict is unchanged: **real screens exist now, but the product still can't be used end-to-end** — no confirmed Planner-instance creation path, no realtime, no notifications, no approvals.

---

## 9. Recommended next tasks, in order

1. ~~**IPI-526** — render and commit the missing `35-hub.png` audit screenshot~~ **Done** — [PR #401](https://github.com/amo-tech-ai/lumina-studio/pull/401) merged. Ticket auto-closed to Done on merge (a GitHub↔Linear side effect), caught and reverted to Backlog (§0.6) — it has zero remaining Linear blocker and is genuinely ready to implement.
2. ~~Fix `app-build`'s lint failure on `main`~~ **Done** — [PR #402](https://github.com/amo-tech-ai/lumina-studio/pull/402) merged; root cause was an orphaned `eslint-disable` directive, unrelated to Planner.
3. **IPI-526** — build the actual Hub screen (A–J in its AC) — no longer blocked by anything, highest-value startable item alongside IPI-574.
4. **IPI-574** — finish (already in progress); highest-leverage code item, unblocks 8 downstream tickets.
5. Investigate the `organizations_ensure_planner_default` trigger / test-org cleanup gap (§7) enough to confirm it's inert risk, not active corruption — no deletion without a dedicated ticket.
6. Verify/build the Planner-instance creation path (§5.8/§5.9) — not currently owned by any ticket; needed before any screen ticket can be proven end-to-end.
7. **IPI-576** — finish (already in progress).
8. Once IPI-574 lands, run **IPI-579, IPI-580, IPI-581, IPI-588** in parallel.
9. **IPI-483** — including the split-ownership `checkGate()` wiring (§5.7): IPI-483 exposes the query, IPI-576/Dashboard consumes it.
10. **IPI-582 → IPI-480 → IPI-481 → IPI-557 → IPI-583 → IPI-542**, in that dependency order.

**Linear hygiene, can happen anytime, zero execution risk:** re-parent IPI-545–551 and IPI-529–533 away from Cloudflare tickets (§3, §5.5–5.6); fix the 4 stale claims in IPI-484's description (§5.2); update IPI-588's stale PR reference (§5.3).
