# Planner Backlog Audit 2 — 21 Active PLANNER Tickets (IPI-484 Epic)

**Auditor:** task-verifier (forensic pass) · **Date:** 2026-07-13
**Scope:** All 21 non-Done/non-Cancelled Linear issues labeled `PLANNER` — IPI-478, 479, 480, 481, 482, 483, 484, 526, 536, 538, 569, 574, 575, 576, 577, 578, 579, 580, 581, 582, 583.
**Excluded (already resolved):** IPI-476 (Done, 94/100), IPI-477 (Done), IPI-570 (Cancelled — merged into IPI-483).
**Method:** Full `get_issue` fetch (not the truncated list view) for all 21 + disk/git verification of every falsifiable claim against `origin/main` (this local checkout is 5 commits behind `origin/main`, which is why some early greps against the working tree came back empty — re-verified against `origin/main` directly). Cross-referenced `Universal-design-prompt-4/planner/notes/session-notes-2.md` (the live QA pass on IPI-536/PR #348) and the prior `planner-audit.md`.

---

## 1. Executive answer — are all 21 tasks really needed?

**Yes.** This is an unusually disciplined backlog, not typical scope bloat. Evidence this was already audited before I got to it:

- **Two tickets already self-trimmed same-day (2026-07-12), with reasoning attached, not silently cut:** IPI-569 (state machine) was cut from a full guards/hooks/React-hook implementation down to a single mapping function, explicitly because its only consumers (IPI-481, IPI-483) don't exist yet. IPI-570 (dependency/critical-path engine) was cancelled outright as a duplicate of IPI-483's AC-A/AC-C.
- **The epic tracker (IPI-484) carries its own "Ponytail: What Not to Build" table** — 8 named features (resource allocation, versioning/snapshots, analytics engine, full state machine, critical-path/4 dependency types, DO presence sync, multi-channel notifications, all-5-AI-tools-at-once) each with a stated revisit trigger. This audit's own YAGNI pass would have recommended exactly this table — it already exists.
- **Every one of the 21 tickets has grep-verified "mistake we prevent" sections** — e.g. IPI-579 caught and fixed 2 real errors (a wrong claim about calling a private `PlannerEngine` method, and a naming collision with an unrelated `activity-timeline.tsx`) before any code was written. IPI-580 caught a false "reuse CRM's drag-and-drop" claim (verified: no DnD library exists anywhere in the repo). This is pre-emptive verification, not aspirational spec-writing.

**Correction to the "21" framing:** 3 of the 21 are pure tracker issues that no PR ever closes against (IPI-484, IPI-478, IPI-479) — they exist only to sequence the other 18 buildable tickets. Not waste, but the real buildable count is **18**, not 21.

**Nothing should be cancelled.** Two minor scope/process gaps found (below) should be fixed, not the backlog's size:

| # | Finding | Severity | Fix |
|---|---|:---:|---|
| 1 | **Circular Linear relation, self-flagged and never resolved:** IPI-536's own text says *"Linear's `blockedBy` relation on IPI-538 currently points back at this issue, which conflicts with IPI-538's own 'Dependencies: None' text."* Confirmed still present in both tickets' live relation data pulled this run. | 🟡 Medium | Remove the stale `blockedBy: IPI-536` edge on IPI-538 — 2-minute Linear edit, but left unresolved for a day now. |
| 2 | **IPI-583 (Workspace responsive/a11y QA) doesn't cross-link IPI-584** (the nav-sidebar aria-current/focus-visible/aria-label fix ticket spun out of the IPI-536 QA pass, PR #348). IPI-583's own AC-B requires "full §8 a11y checklist passes" — that checklist will re-trip the exact same nav-sidebar findings IPI-584 already exists to fix, since they're repo-wide, not Workspace-specific. | 🟡 Medium | Add IPI-584 as `blockedBy` (or at minimum `relatedTo`) on IPI-583, so whoever picks up S1F doesn't re-discover and re-fix the same nav gaps IPI-584 already owns. |
| 3 | **Process-hygiene precedent, already caught once:** IPI-526 was wrongly marked Done via an unrelated PR (#338, AWS Bedrock provider work) that happened to share the issue number in its branch name — zero Planner files touched. Already correctly reopened to Backlog by the time of this audit, but it's evidence the branch-name↔issue-number auto-link is not verifying file-path overlap. | ⚪ Low (already fixed once) | No action on IPI-526 itself; worth a note to whoever owns PR-linking automation that number-only matching is unsafe. |
| 4 | **IPI-482 overstates existing capability; its own dependency stub has a dangling ticket reference.** IPI-482's description reads as if the Mastra `production-planner` agent already explains risk/summarizes/drafts shifts. Disk-verified (`app/src/mastra/agents/index.ts:22-25` on `origin/main`): it is currently a name-only placeholder, and the code comment says *"the real production-planner tool suite + HITL lands in IPI2-114"* — `IPI2-114` does not match this repo's `IPI-NNN` prefix convention and does not resolve to any issue in this label set. | 🟡 Medium | Fix the ticket text to state the agent is a stub today (not partially capable), and resolve/correct the `IPI2-114` reference in the code comment — either it's a typo for a real IPI-### this backlog should list as a dependency, or a dangling placeholder that should just say "lands in IPI-482" directly. |

None of these are reasons to cut a ticket — they're small Linear/code data-hygiene fixes.

---

## 2. Per-task scorecard

Dot legend: 🟢 spec is solid, safe to build as written · 🟡 spec is solid but carries a real risk to watch · ⚪ tracker/non-buildable issue, N/A for execution scoring · 🔴 blocker, do not start as written.

| ID | Title | Status | Dot | Spec quality | One-line verdict |
|---|---|---|:---:|---:|---|
| IPI-536 | Foundation — routes, permissions, MutationResult | In Progress (PR #347 merged, QA PR #348 open) | 🟡 | 92/100 | Shipped and disk-verified correct; Linear status stuck "In Progress" despite all steps checked — administrative gap, not a code gap. |
| IPI-538 | Data Slice A — Dashboard & Hub reads | In Progress | 🟢 | 95/100 | Best-specified data ticket in the set — 5 metric formulas precisely defined, N+1 anti-pattern explicitly banned. Not yet on disk (`queries.ts` absent from `origin/main`). |
| IPI-526 | Hub (SCR-35) | Backlog | 🟡 | 90/100 | Clean spec; carries the one process scar (wrong-PR Done incident) as a documented, already-corrected note. |
| IPI-578 | PLN-S1A Workspace shell | Backlog | 🟢 | 94/100 | Single-`<aside>` constraint is grep-provable (AC-B); correctly forbids a second Sheet. |
| IPI-579 | PLN-S1B Timeline (read-only) | Backlog | 🟢 | 96/100 | Two real errors caught and fixed before build (private-method misuse, naming collision) — model ticket for this backlog. |
| IPI-580 | PLN-S1C Kanban + List (read-only) | Backlog | 🟢 | 95/100 | Correctly separates real reuse (column grouping) from false reuse (drag-and-drop) with live grep evidence. |
| IPI-581 | PLN-S1D Calendar (read-only) | Backlog | 🟢 | 91/100 | Resolves the one open design ambiguity (start-date vs end-date placement) up front. |
| IPI-582 | PLN-S1E Task detail + mutations | Backlog | 🟡 | 85/100 | Highest-risk ticket in the set: 5-way `blockedBy` fan-in (578/579/580/581/483), an explicitly *undecided* DnD library dependency, and the ticket's own text flags itself as "previously the lowest-scored/most sprawling." |
| IPI-583 | PLN-S1F Responsive + a11y QA | Backlog | 🟡 | 90/100 | Solid spec; missing cross-link to IPI-584 (finding #2 above). |
| IPI-574 | Data Slice B — Workspace reads/mutations | Backlog | 🟢 | 94/100 | Full 10-step `shiftTask` contract (auth→authorize→fetch→...→revalidate) is unusually rigorous for a backlog spec. |
| IPI-575 | Data Slice C — Settings/member mutations | Backlog | 🟢 | 95/100 | Security modeling directly copies a proven pattern (`crm_convert_deal`'s `SECURITY DEFINER` + explicit org-check), with the exact lesson-learned migration cited. |
| IPI-577 | PLN-S6 Settings screen | Backlog | 🟢 | 92/100 | Correct naming-convention verification (kebab-case files vs `ComingSoonButton` reuse boundary). |
| IPI-569 | State machine (v1 slice, already trimmed) | Backlog | 🟢 | 92/100 | Exemplary self-correction — see §1. Tiny, safe, no dependency risk. |
| IPI-483 | Workflow engine v2 — approvals | Backlog | 🟡 | 90/100 | Clean v1 scope (Approve/Edit/Discard only, no critical path); sits behind 5 `blockedBy` edges, so its own start date depends on the whole Workspace slice landing first. |
| IPI-480 | Realtime sync (Supabase only, v1) | Backlog | 🟡 | 88/100 | Correctly defers Durable Objects/presence; "re-fetch, never trust the payload" rule is a strong regression guard. Last-mile ticket — nothing consumes it yet, correctly sequenced last. |
| IPI-481 | Notifications (in-app only, v1) | Backlog | 🟡 | 90/100 | Clean event matrix (5 events, dedup key, no self-notify); correctly defers multi-channel/Queue fan-out despite the ticket's own title still saying "Cloudflare Queue fan-out" (stale title vs. de-scoped body — minor). |
| IPI-482 | Mastra AI tools + CopilotKit HITL | Backlog | 🟡 | 92/100 | Strongest AI-safety framing in the set: explicit "no second write path" rule, enforced with a grep-provable AC (AC-E). Blocked externally by IPI-485/486 (Mastra cutover), outside this label's control. |
| IPI-484 | Epic tracker | In Progress | ⚪ | 95/100 | Well-run tracker; chain table + Ponytail table are genuinely useful, not decoration. |
| IPI-478 | UI shell tracker (Workspace views) | Backlog | ⚪ | 91/100 | Clean split rationale (read-only-first to avoid mixing render bugs with mutation bugs). |
| IPI-479 | Role-based views tracker | Backlog | ⚪ | 88/100 | Thin but correct — exists solely to explain why Dashboard and Settings were split apart. |

**Titled "21" but 3 are non-buildable trackers → 18 real implementation tickets, all rated 🟢/🟡, zero 🔴.**

---

## 3. Detailed findings by ticket (errors, blockers, corrections)

### IPI-536 — Foundation (In Progress)
- **Disk-verified true, all 5 claims:** nav entry (`nav-sidebar.tsx:16`), `MutationResult` uses `ok:` discriminant (`types.ts:177-178`), `permissions.ts` calls `planner_get_my_assignment` RPC not a direct table query, the RPC migration exists (`20260712235000_planner_get_my_assignment_rpc.sql`), no DnD/date/virtualization libraries were added.
- **Real bug found and fixed during PR review (not by this audit, already resolved):** P1 RLS lockout — contributor/viewer reading their own assignment silently got `canRead: false` because `assignments_select_org` requires manager+ for any direct select, including one's own row. Fixed with the `SECURITY DEFINER` RPC above, independently reviewed by `rls-policy-auditor` before applying to live Supabase.
- **Blocker/gap:** Linear status is stuck "In Progress" even though every completion step is checked and PR #347 is merged — because QA follow-up PR #348 is still open. **Correction:** either merge #348 and flip to Done, or explicitly note in the ticket that "Done" is gated on #348, not just #347. As-is, the epic chain table's "Done when" column for row 1 is ambiguous about which PR gates it.

### IPI-538 — Data Slice A (In Progress)
- Not yet on disk — `app/src/lib/planner/queries.ts` does not exist on `origin/main`. Consistent with "In Progress," not a red flag.
- Spec strength: the 5 KPI formulas (Progress, At risk, Due today, Needs approval, My tasks) are pinned to exact definitions in the ticket text — this is the artifact IPI-526's AC-C explicitly imports from, preventing formula drift between Dashboard and Hub. Good cross-ticket discipline.
- **Correction:** none needed — this is one of the strongest specs in the set.

### IPI-526 — Hub (SCR-35)
- **Confirmed:** the "wrongly marked Done via PR #338" incident is real (PR #338 is AWS Bedrock provider fallback work, unrelated) and already correctly reopened.
- **Correction:** none needed on the ticket itself now. Flag for whoever owns PR↔issue auto-linking: verify file-path overlap, not just a shared number in the branch name, to prevent recurrence.

### IPI-578 — PLN-S1A Workspace shell
- AC-B ("exactly one `<aside>`") and AC-C (view-switch state must be local, not context) are both mechanically grep-checkable — good, low ambiguity.
- **No corrections.**

### IPI-579 — PLN-S1B Timeline (read-only)
- Two real, disk-verified corrections already baked into the ticket: (1) `PlannerEngine.addBusinessDays()`/`toDateString()` are `private` (confirmed at `engine.ts:414`/`430` in this audit's own probe) and the wrong operation anyway — Timeline needs a simple day-offset calc, not business-day arithmetic; (2) `activity-timeline.tsx` is a real, unrelated component (chronological activity feed) that must not be confused with the new `PlannerTimeline`.
- **No corrections needed** — this is the model ticket for the backlog: every claim is grep-verified, not assumed.

### IPI-580 — PLN-S1C Kanban + List (read-only)
- Disk-verified: `pipeline-workspace.tsx` has zero `draggable`/`onDragStart`/`onDrop` matches (confirmed in this audit) — the ticket's own claim that "CRM Pipeline has no drag-and-drop to reuse" is correct, and no DnD library exists in `package.json` (also confirmed).
- Real risk correctly flagged and pushed to the right ticket: the DnD library choice is an **unmade decision**, explicitly not this ticket's problem, explicitly IPI-582's problem.
- **No corrections.**

### IPI-581 — PLN-S1D Calendar (read-only)
- Clean, resolves the one open ambiguity (chip placement — start date vs end date) as a documented decision rather than a build-time guess.
- **No corrections.**

### IPI-582 — PLN-S1E Task detail + mutations — **highest risk in the set**
- **Real blocker risk (not a spec-quality problem, a sequencing risk):** this ticket has 5 `blockedBy` edges (IPI-578, 579, 580, 581, 483) plus depends on IPI-574 for the mutation contract — the highest fan-in of any ticket in the backlog. If any one of Timeline/Kanban/Calendar/Approvals slips, S1E cannot start.
- **Genuinely unresolved dependency:** no DnD library is chosen anywhere in the codebase or in this ticket — AC-D correctly makes "choose and document a library" a hard gate before drag handlers are built, but that decision doesn't exist yet. This is the single largest unknown-unknown in the whole backlog.
- The ticket's own text self-flags: *"this ticket was previously the lowest-scored/most sprawling in the plan."* That self-awareness is good, but the structural risk (5-way fan-in + an open library decision) is real regardless of how well-written the current spec is.
- **Correction:** when this ticket is picked up, resolve the DnD library choice as its own tiny spike/decision record *before* starting the 5-step implementation, not inline — otherwise steps A–E will stall on an undocumented decision the same way the ticket's own history shows happened once already.

### IPI-583 — PLN-S1F Responsive + a11y QA
- See finding #2 in §1 — missing IPI-584 cross-link. Otherwise clean: explicitly resolves a real conflict (mobile deep-link routing vs. the onboarding doc's blanket "generic mobile entry" rule) in favor of preserving deep-link context, which is the correct call for notification/approval links.
- **Correction:** add IPI-584 as a related/blocking dependency.

### IPI-574 — Data Slice B
- The 10-step `shiftTask` contract (vs. an earlier undocumented 5-step version) is the most rigorous mutation spec in the backlog — auth, authorize, fetch, convert, pure-engine-call, diff, atomic persist, same-transaction audit event, typed conflict return, targeted revalidate.
- **No corrections.**

### IPI-575 — Data Slice C
- Security design directly ports a proven, live pattern (`crm_convert_deal`: `public` schema, `SECURITY DEFINER`, explicit org/role checks, not RLS alone) and cites the exact incident (`crm_deals_convert_reject_cross_org_company.sql`) that pattern exists to prevent.
- **No corrections.**

### IPI-577 — PLN-S6 Settings screen
- Correctly separates "reuse `ComingSoonButton`'s convention" from "reuse `ComingSoonButton`'s component" — the former is right (disabled + "Coming soon" title), the latter would be the wrong shape (button vs. tab).
- **No corrections.**

### IPI-569 — State machine (v1, already trimmed)
- Exemplary self-correction, described in §1. No action needed until IPI-481 or IPI-483 actually needs the deferred guards/hooks.

### IPI-483 — Workflow engine v2 (approvals)
- Clean v1 boundary: only Approve/Edit/Discard, no Reject/Request-changes, no critical path. AC-E (one transaction for approval + shift) directly prevents the exact split-write failure mode the ticket's own "denied" example shows.
- **No corrections**, but note the 5-way `blockedBy` — same structural risk class as IPI-582, just one level removed.

### IPI-480 / IPI-481 / IPI-482 — platform-phase tickets (Realtime / Notifications / AI)
- All three correctly ship v1-only scope (Supabase Realtime only, in-app notifications only, explain/summarize/draft-with-approval only) and all three are last in the build-order chain — nothing downstream consumes them yet, which is appropriate given they're sequenced last, not a sign they're premature.
- IPI-481's own **title** still says "Cloudflare Queue fan-out" even though its body explicitly defers Queue-based fan-out out of scope — cosmetic title/body mismatch, not a functional problem, but worth a one-line title edit so it doesn't mislead a future skimmer.
- IPI-482's AC-E (grep for zero direct Mastra writes to `planner_tasks`/`planner_gates`) is a strong, mechanically-checkable guard against the single most dangerous AI-safety failure mode (a second write path bypassing human approval).
- **Correction (IPI-482):** the ticket's own framing overstates present-day capability — disk-verified (`app/src/mastra/agents/index.ts:22-25` on `origin/main`) the `production-planner` agent is currently a name-only placeholder, and its code comment defers real tool/HITL work to `IPI2-114`, a ticket ID that doesn't match this repo's `IPI-NNN` convention and resolves to nothing in this label set. See finding #4 in §1.

### IPI-484 / IPI-478 / IPI-479 — trackers
- All three are non-buildable by design (no PR closes against them) and correctly say so in their own text. IPI-484's chain table and "What Not to Build" table are genuinely load-bearing artifacts, not decoration — this audit would have produced something close to that table itself if it didn't already exist.

---

## 4. Overall scorecard (epic-level dimensions)

| Dimension | Score /100 | Status | Evidence |
|---|---:|:---:|---|
| Scope discipline (YAGNI/ponytail) | 96 | 🟢 | 2 tickets already self-trimmed same-day with reasoning; epic-level "What Not to Build" table with revisit triggers |
| AC testability (proof: commands) | 97 | 🟢 | Every one of the 18 buildable tickets has `proof:` commands per AC, mostly `grep`/`npm test`/`npm run typecheck` — mechanically checkable, not "looks right" |
| Reuse-claim verification (grep-checked, not assumed) | 95 | 🟢 | IPI-579/580 both caught and corrected false reuse claims via live grep before writing; this audit independently re-verified those same greps and confirmed them still true |
| Security modeling (RLS/SECURITY DEFINER) | 94 | 🟢 | IPI-575 explicitly ports the `crm_convert_deal` pattern with a named prior incident; IPI-536's real P1 RLS lockout was caught and fixed with an independent `rls-policy-auditor` review |
| Dependency/sequencing correctness | 90 | 🟢 | Correct vertical-slice order overall; IPI-582 and IPI-483 each carry a 5-way `blockedBy` fan-in that's a real schedule risk, not a spec error |
| Skills routing correctness | 90 | 🟢 | Each ticket declares its own skills (`ipix-supabase`, `frontend-design`, `accessibility`, `mastra`, `copilotkit`, etc.); spot-checked against actual skill list, all real |
| Documentation traceability (SSOT citations) | 91 | 🟢 | Every ticket cites a specific source doc/DC file/line; several cite exact `file:line` for corrected claims |
| Process hygiene (Linear data integrity) | 74 | 🟡 | 1 unresolved circular `blockedBy` (IPI-536↔538), 1 missing cross-link (IPI-583→584), 1 stale title (IPI-481), 1 status stuck on an open follow-up PR (IPI-536) |
| **Composite** | **91** | 🟢 | Weighted toward spec quality since 16 of 18 buildable tickets haven't started implementation yet — execution scoring will follow once code lands |

**Verdict: 🟢 Backlog is safe to execute in its current build order. No ticket should be cancelled or merged away. Fix the 3 process-hygiene items in §1 before the next ticket in the chain (IPI-538/574) ships, so the dependency graph and QA checklists stay accurate for whoever picks up IPI-582/583 later.**

---

## 5. Evidence ledger — proven vs. judgment call

**Proven against disk/repo this run (not taken on the ticket's word):**
- `origin/main` (this checkout is 5 commits behind — verified all claims against `origin/main`, not the stale local tree, once that discrepancy was caught):
  - `nav-sidebar.tsx:16` has the Planner entry
  - `types.ts:177-178` uses `ok:` discriminant
  - `permissions.ts` calls `planner_get_my_assignment` RPC, not a direct table query
  - Migration `20260712235000_planner_get_my_assignment_rpc.sql` exists
  - Zero DnD (`dnd-kit`/`react-beautiful-dnd`/`react-dnd`), virtualization (`react-window`/`react-virtualized`/`react-virtuoso`/`@tanstack/react-virtual`), or date (`date-fns`/`dayjs`/`luxon`) libraries in `app/package.json`
  - Zero `draggable`/`onDragStart`/`onDrop` in `pipeline-workspace.tsx`
  - `engine.ts:414`/`430` — `addBusinessDays`/`toDateString` are genuinely `private`
  - `queries.ts`/`mutations.ts` do not yet exist (consistent with Slice A/B still Backlog/In Progress)
  - PR #347 = MERGED, PR #348 = OPEN (via `gh pr view`)
- IPI-536↔IPI-538 circular `blockedBy` — confirmed present in both issues' live relation data pulled this run.
- IPI-526's wrong-PR-Done incident — confirmed via its state history (Backlog→In Progress→Done→Backlog) and PR #338's actual title/scope.
- `app/src/mastra/agents/index.ts:22-25` (`origin/main`) — `production-planner` is a name-only stub; comment cites dangling `IPI2-114` reference, re-confirmed directly in this pass.

**Judgment calls (scope/necessity, not falsifiable against disk):**
- All "is this ticket really needed" verdicts in §1 and the risk calls on IPI-582/483's fan-in — these are sequencing-risk assessments, not pass/fail probes. Reasonable engineers could weight the IPI-582 risk differently; flagged as the single ticket most likely to need a mid-build course correction.
- Spec-quality scores in §2 are this auditor's rubric-based judgment (testability, do-not clarity, evidence density), not a mechanical check.
