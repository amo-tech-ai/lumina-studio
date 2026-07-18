# Planner Backend Delivery — Efficiency Plan

**Date:** 2026-07-17
**Scope:** How we build Planner backend RPCs/mutations going forward (IPI-649, IPI-653, and future `PLN-DATA-*` tickets)
**Status:** Proposed — no process change is binding until the team agrees to it

## Why this doc exists

A process-improvement analysis was submitted for review, arguing that Planner backend work is losing time to "late discovery" — contract, schedule, and authorization decisions surfacing after code is already written. This doc checks that claim against what actually happened on IPI-649 and IPI-653, keeps the parts that hold up, and cuts the parts that would add process for its own sake (see [CLAUDE.md](../../../CLAUDE.md)'s YAGNI/ponytail principle — the shortest working fix beats a speculative abstraction).

## Verdict: directionally correct, two items overreach

The core diagnosis is right and it's backed by this session's own history, not a hypothetical. The details need calibrating:

| Claim in the submitted analysis | Verdict | Evidence from this session |
|---|---|---|
| "Contracts get discovered mid-implementation, not frozen upfront" | **Correct** | The IPI-653 schedule-computation question (should the RPC or `PlannerEngine` compute dates?) only got resolved *after* [PR #422](https://github.com/amo-tech-ai/lumina-studio/pull/422) had already merged — it should have been settled before PR 1 was written. |
| "Migrations get repeatedly patched during review" | **Correct, but overstated at '6–8 rounds'** | PR #422 took **4 fix rounds** post-open, not 6–8: (1) `shoot.shoots.org_id` — column doesn't exist, needed a join through `public.brands`; (2) a concurrent-create race with no `unique_violation` handling; (3) missing `sort_order`; (4) missing idempotency-key null/empty guard that every sibling RPC already had. Real rework, but the number should be accurate. |
| "A shared SQL test harness would catch this before bots do" | **Correct** | Every one of those 4 bugs is exactly the kind of thing a fixed checklist run against the *first* draft would have caught — none were novel edge cases. |
| "Standardize the `SECURITY DEFINER` RPC template" | **Correct** | The missing idempotency guard in round 4 wasn't a new decision — it was a known, already-solved pattern (present in `planner_shift_task`, `planner_update_task`) that just didn't get copied forward. A template fixes that class of bug outright. |
| "Use `PlannerEngine` as the sole scheduler, RPC only persists" | **Correct, and already adopted** | This is precisely the decision just made for IPI-653 PR 2: `PlannerEngine.buildSchedule()` computes business-day dates, the RPC validates and persists them, and — per explicit instruction — the dependency rows `buildSchedule()` also produces are discarded rather than persisted, since sequential dates aren't proof of a real dependency. |
| "Add a pgTAP harness for atomicity/idempotency" | **Overreach for now** | This repo doesn't have pgTAP wired into CI today, and `scripts/verify-rls.mjs` (a live, real-client probe suite) already caught real issues this session when extended per-RPC. Introducing a second SQL test framework is a bigger lift than the four bugs above justify. **Recommendation: extend `verify-rls.mjs`'s existing convention first; revisit pgTAP only if that stops being enough.** |
| "Split `planner.events` into a separate audit table and idempotency-results table" | **Overreach for now** | No bug in this session was actually caused by combining audit and idempotency-result storage in `planner.events` — it worked as designed for both IPI-649 and IPI-653. This is a real architectural idea worth a future ADR, not something the current pain justifies today. Splitting it now is exactly the "designing for a hypothetical" CLAUDE.md tells us to avoid. |
| "~30–45% delivery time reduction, 50–75% fewer correction migrations" | **Unverifiable, drop the numbers** | Nothing in this session was instrumented to produce these figures. Keep the plan, drop the stats — they read as invented precision. |

## What we're adopting

Ranked by payoff-per-effort, not by how impressive it sounds — per [CLAUDE.md](../../../CLAUDE.md)'s "continuous improvement" rule.

### 1. A contract freeze, before writing SQL (highest payoff, lowest cost)

For every new RPC, write down — in the Linear ticket or a short scratch note, not a formal doc — before opening the worktree:

- Exact function signature (params in, shape out)
- Who owns each computed value: engine (TypeScript) or RPC (SQL)? Never both.
- Permission matrix (which org roles can call this, and how is that enforced — RLS, or an explicit role check inside the RPC?)
- Idempotency behavior (key source, replay behavior, conflict behavior)
- What happens on partial failure (should be "nothing" — SECURITY DEFINER functions here already wrap writes in an implicit transaction; say so explicitly)

This is what the IPI-653 PR 2 kickoff conversation already did in practice — the "engine computes dates and sort_order, RPC validates and persists, no auto-dependency rows" decision was made *before* any migration file existed. Do that first, every time, instead of discovering it mid-review.

### 2. A standard checklist for every new write RPC

Not a new test framework — a checklist run by hand (or by a reviewing agent) against the first draft, before it's pushed. Copied straight from the actual bug list above, plus the standing patterns this repo already has:

- [ ] Does every FK/join column referenced actually exist on that table? (`org_id` on `shoot.shoots` did not — verify with `information_schema.columns`, don't assume from a sibling table's shape.)
- [ ] Is the idempotency-key null/empty guard present, matching sibling RPCs?
- [ ] Is a concurrent duplicate-create handled (`unique_violation` caught, not left to surface as a raw constraint error)?
- [ ] Does `SECURITY DEFINER` have `search_path = ''` and correct `REVOKE`/`GRANT` (revoked from `public`/`anon`, granted only to `authenticated`)?
- [ ] Are all computed sort/order values sourced from the authoritative place (e.g. `phase.order_index`), not re-derived?
- [ ] Zero business-logic dates/schedule math written in SQL if `PlannerEngine` already owns that computation.

This is cheaper than pgTAP and would have caught all 4 of PR #422's real rounds on the first pass.

### 3. Extend `scripts/verify-rls.mjs` per new RPC — already our convention, keep doing it deliberately

This already happened for every round this session; make it explicit as a required step, not something that happens reactively when a bug is found. Every new RPC contract gets probes for: authorized success, unauthorized denial, cross-org denial, invalid/malformed input, idempotency replay, and concurrent duplicate-create.

### 4. Don't start PR 2 while PR 1's contract is still moving

IPI-649's PR #420 had to be retargeted (`gh pr edit --base main`) after PR #418 merged, because its branch was stacked on a not-yet-deleted intermediate branch. That's a minor mechanical cost. The bigger cost is IPI-653: if PR 2 had been started before PR #422's 4 fix rounds landed, all of that app-layer code would have needed a rewrite for the schedule-computation change. **Rule: don't open the app-layer worktree until the migration PR is merged to `main` and CI is green there** — which is in fact exactly the order this session followed for IPI-653, and should stay the default.

### 5. Reuse existing sibling RPCs as the starting template, not a blank file

The missing idempotency guard in round 4 happened because the new RPC wasn't diffed against its siblings before being called "done." When writing a new `SECURITY DEFINER` RPC, start by listing the 3 most similar existing RPCs and diffing structure against them before considering the draft complete.

## What we're explicitly not doing right now

- **No pgTAP adoption.** Revisit only if `verify-rls.mjs` + the checklist above stop catching real bugs before PR review.
- **No `planner.events` table split.** Revisit as an ADR if a real bug or real audit-log confusion traces back to the combined design — not preemptively.
- **No new shared-helper SQL library yet.** The checklist in #2 covers the same ground more cheaply for now; if the same helper logic gets hand-copied across a 4th or 5th RPC, that's the signal to extract it for real.

## Applying this to the next task (IPI-653 PR 2)

PR 2 (the app-layer adapter for `planner_create_instance`) is the first real test of this plan. Its contract is already frozen (item 1, done): `PlannerEngine.buildSchedule()` computes phase-anchor task dates and `order_index`-based `sort_order`; the round-5 migration accepts that precomputed task list and only validates + persists; no `planner.dependencies` rows get written. Before that migration is called done, it goes through the checklist in item 2, then gets `verify-rls.mjs` probes per item 3 — both before opening the PR, not after a bot flags something.

## Summary

| Priority | Change | Cost | Grounded in |
|---|---|---|---|
| 🔴 High | Freeze RPC contract before coding | ~10 min per task | IPI-653 schedule-source decision, made too late for PR 1 |
| 🔴 High | Standard pre-push checklist for write RPCs | One-time to write, ~5 min per RPC after | All 4 real bugs in PR #422 |
| 🟡 Medium | Treat `verify-rls.mjs` extension as required, not reactive | No new cost — already happening | Every round this session already did this |
| 🟡 Medium | Don't start stacked PR 2 until PR 1 is merged + green | Zero cost, just sequencing discipline | IPI-649 PR #420 retarget; would-be IPI-653 rewrite risk |
| 🟢 Low | Diff new RPC against 3 closest siblings before calling it done | ~5 min per RPC | Missing idempotency guard in round 4 |
| ⬜ Deferred | pgTAP harness | New framework + CI wiring | No bug this session required it |
| ⬜ Deferred | Split `planner.events` into audit + idempotency tables | Schema migration + touches IPI-649 and IPI-653 code | No bug this session traced to the combined design |
