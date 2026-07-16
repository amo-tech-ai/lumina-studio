# IPI-649 — Forensic Supabase Audit (PR #418 + PR #420)

**Date:** 2026-07-16
**Scope:** `public.planner_shift_task`, `public.planner_update_task`, `planner.events` idempotency columns (PR #418, migration-only), and their application-layer consumers in `app/src/lib/planner/mutations.ts` + Server Actions (PR #420, stacked on #418).
**Method:** Two independent subagents, one per PR, each instructed to re-derive every claim from the live Supabase project (`nvdlhrodvevgwdsneplk`) and the current repo state — not to trust prior review rounds, migration comments, or PR descriptions. This audit ran *after* 7 prior bot-review rounds had already landed on PR #418 and 1 fix round on PR #420; the goal was an adversarial second opinion, not a repeat of the same review.
**Outcome:** 4 real findings confirmed and fixed in a new round-8 migration; 1 structural finding (stale branch) fixed via rebase; 6 real test-coverage gaps closed. A 5th finding on round 8's own migration file (Sentry re-review) was confirmed and fixed in round 9. CodeRabbit's first full review pass then found 2 more real gaps (fixed in round 10, verified against official Postgres/Supabase idempotency and SECURITY DEFINER guidance) plus 1 correctly-deferred architectural item. All fixes applied to the live project and verified via the full `scripts/verify-rls.mjs` suite (zero regressions) before this doc was finalized.

---

## Severity table

| Severity | PR / file / function | Error or risk | Evidence | Failure scenario | Fix | Blocked merge? | Status |
|---|---|---|---|---|---|---|---|
| Medium | #418 — both RPCs | Idempotency replay ran before org-membership/task authorization | Idempotency lookup preceded `is_org_member`/per-task auth checks in both functions | A demoted/removed actor replays an old idempotency key + payload and gets the cached `ok:true` result with no re-check of current access | Move authorization before the idempotency lookup; keep the deliberate terminal-instance exemption after it | No (no live caller existed yet) | **Fixed — round 8** |
| Medium | #418 — `planner_shift_task` | Dependency-edge comparison had no lock on `planner.dependencies` | FK's implicit `FOR KEY SHARE` blocks a concurrent `INSERT` against locked tasks, but a `DELETE` needs no such lock | A manager deletes a dependency edge between the comparison `SELECT` and this transaction's commit → shift proceeds on a stale edge snapshot, no `DEPENDENCY_CHANGED` | Lock the matched dependency rows `FOR UPDATE` before comparing | No | **Fixed — round 8** |
| Medium | #418 — `planner_update_task` | Nonexistent `assignee_user_id` raised an uncaught FK violation instead of typed `INVALID_INPUT` | Explicitly flagged as deferred in round 7's header; independently re-confirmed real | Any caller sends a syntactically valid but nonexistent user id → raw Postgres error surfaces instead of a typed response (clean rollback, no data corruption) | Wrap the `UPDATE` in its own `exception when foreign_key_violation` handler | No | **Fixed — round 8** |
| Medium | #418 — `planner_update_task` | Idempotency `request_hash` omitted `p_expected_updated_at` | Sentry re-review of round 8's own migration file; hash covered only `task_id`/`instance_id`/`patch` — unlike `planner_shift_task`, whose hash already covers its per-task CAS token implicitly via `changed_tasks` | A client bug reusing one idempotency key across two logically-different attempts with an identical patch but different `expectedUpdatedAt` would collide and be treated as the same request (a genuine same-request retry was never at risk of writing stale data either way — replay only returns the stored response, it never re-runs the `UPDATE`) | Include `p_expected_updated_at` in the hash digest, matching `planner_shift_task`'s coverage | No | **Fixed — round 9** |
| Major | #418 — `planner_shift_task` | Only the ROOT task was reauthorized before idempotency replay; every other task in `p_changed_tasks` was still authorization-checked in the later per-task loop, after the idempotency lookup | CodeRabbit's first full review pass on this PR, verified against official Postgres idempotency guidance ("ties the idempotency key to a specific user server-side") before implementing | An actor who remains authorized for the root task (e.g. still its direct assignee) but has since lost access to a SECONDARY task in the same payload could still replay a cached success touching that task | Move task locking + per-task authorization for ALL changed tasks before the idempotency lookup, not just the root task; staleness stays a separate check afterward | No | **Fixed — round 10** |
| Major | #418 — `planner_update_task` | A patched `assignee_user_id` only had to satisfy the FK to `auth.users`, not actual org membership | CodeRabbit; the FK only proves the id is a real user somewhere, not that they belong to this instance's org | An authorized contributor could assign a task to any real user id anywhere in the system, including someone with no relationship to the org at all | Require the patched assignee to be a `public.org_members` row for the instance's org (`INVALID_INPUT` otherwise) — same shape as `planner_invite_member`'s `user_not_in_org` check | No | **Fixed — round 10** (2 new `verify-rls.mjs` probes added — no existing test called this RPC with an `assignee_user_id` patch at all) |
| — (Heavy Lift, deliberately deferred) | #418 — `planner_shift_task` | The RPC persists client-supplied `newStartDate`/`newEndDate` without validating them against the dependency graph's ordering constraints, only that the edge *set* is unchanged | CodeRabbit | A direct authenticated caller (bypassing the TS engine) could set dates that violate a `finish_to_start` ordering constraint even though `DEPENDENCY_CHANGED`'s edge comparison passes | Would require the RPC to independently validate/recompute schedule consistency server-side — a real architectural question (does this RPC start doing schedule math, contradicting its persist-only design?), not a mechanical fix | No (an authorized contributor already has standing authority to change dates; not a privilege escalation) | **Deliberately deferred — future ticket** |
| Low | #418 — `planner_shift_task` | A non-root task failing only authorization (not staleness) was reported as `STALE_VERSION` instead of `FORBIDDEN` | Auth and staleness were merged into one `EXISTS` | Client retries with a "refreshed" timestamp that can never satisfy an authorization failure — confusing dead end, not a bypass | Split into two per-task conditions; `FORBIDDEN` takes precedence | No | **Fixed — round 8** |
| Medium | #420 — branch `ipi/649-workspace-mutation-adapters-app` | Head branch never rebased onto its own base branch's 6 newest commits (rounds 2–7) | `git merge-base` = `0011fd57`; base tip was `c9bfa948` (6 commits ahead); 6 migration files missing from this branch's tree | A fresh environment built from this git ref (not the shared live project) would create the RPCs at a pre-hardening level while `mutations.ts`'s own comments describe the fully hardened behavior as present | Rebase onto the latest base branch tip | **Yes** | **Fixed — rebased onto round 8, clean, zero conflicts** |
| Medium | #420 — `mutations.test.ts` | 6 real coverage gaps for branches already present in `mutations.ts` (null-RPC-response guard, transport-error-no-leak ×2, replay ×1, fresh-refetch-failure semantics) | Verified by reading every test body against every branch in `mutations.ts`; several of the untested branches were added in #420's own latest commit | A future refactor could silently regress the `!data` guard or leak a raw Postgres error, with nothing to catch it | Add the 6 tests (provided in full by the audit, applied verbatim) | No, but should land alongside | **Fixed — 44 → 50 tests, all green** |
| Low | #420 — `mutations.ts` shiftTask conflict branch | Local scheduling-rule violations and true dependency-graph cycles share the RPC's `DEPENDENCY_CHANGED` code | Both `PlannerEngine.shiftTask()`'s local conflicts and the RPC's concurrency signal map to the same code | A UI that branches on `error.code` (not just displays `error.message`) would show a "refresh and retry" CTA for a local rule violation refreshing can't fix | Give the engine's local conflicts a distinct code (e.g. `SCHEDULE_CONFLICT`) | No | **Not fixed — deferred, see below** |
| Info | #418 — `planner.events` | No retention/cleanup policy for idempotency records | 0 rows today, no TTL/archival job anywhere in `supabase/migrations/` | Unbounded growth over time at production volume | Add a retention policy once volume is known | No | Deferred, not urgent |
| Info | #418 — both RPCs (self-disclosed, pre-existing) | A fully no-op mutation writes no audit event, so a retry re-validates against current state rather than replaying | Documented in round 3's migration comment; independently re-confirmed as a reasoned trade-off, not an oversight | A retried no-op gets a fresh (correct) answer instead of a byte-identical replay | None needed | No | Deliberate, unchanged |
| Info | #418 — both RPCs | `authenticated_security_definer_function_executable` advisor WARN | Expected for any `authenticated`-executable `SECURITY DEFINER` function; matches the established `planner_invite_member` pattern | N/A | None needed | No | Expected, unchanged |
| Info | #420 | Idempotency-key generation discipline unverifiable | Zero callers of the 3 new Server Actions exist anywhere in the codebase yet — IPI-582's UI hasn't landed | Becomes a real risk only once a client actually generates keys | Verify at IPI-582 review time that the key is generated once and reused across retries, not regenerated per render | No | Flagged for IPI-582 |
| Info | #418 — `planner_shift_task` (self-disclosed, pre-existing) | Mid-loop `NOT_FOUND` return doesn't roll back earlier writes in the same call | Flagged in round 7's header; independently re-confirmed as practically unreachable under the current locking model (all affected tasks are already locked before this loop runs) | Would require the locking invariant to change first | Needs a deliberate `SAVEPOINT` design if that invariant ever changes | No | Deferred, unchanged |

---

## 1. Critical fixes required before merge

None remain open. The one item that blocked merge — PR #420's branch being 6 commits stale against its own base — is resolved (clean rebase, `merge-base` now equals the base branch tip exactly).

## 2. Non-blocking improvements

- **`DEPENDENCY_CHANGED` code overload** (Low, #420): local engine conflicts and RPC-detected concurrency conflicts share one error code. Cosmetic/UX-precision issue, not a security or data-integrity defect — the *message* shown is still accurate either way. Left as a follow-up rather than expanding this round's scope; would need a new code added to `MutationResult`'s error union and `TASK_MUTATION_MESSAGES`, which is a small but real product-facing decision (what should the UI say?) better made deliberately than folded into a security-fix round.
- **`planner.events` retention policy** (Info, #418): no urgency at 0 rows; revisit once production volume is known.

## 3. Missing tests

All 6 identified gaps were closed (see severity table). `mutations.test.ts`: 44 → 50 tests, all green. No further gaps identified against the current branch set — `verify-rls.mjs`'s IPI-649 probes already cover the authorization/concurrency scenarios that can't be meaningfully exercised in a mocked adapter unit test (assigned/viewer/cross-org paths, unauthorized secondary task in a multi-task payload, NULL assignee, simultaneous retries, forced mid-transaction failure).

**pgTAP opinion (from the #420 audit):** no `supabase/tests/database` directory exists today and no pgTAP usage anywhere in the repo. A small, focused pgTAP suite scoped to the RPCs' *internal SQL logic* (hash determinism, `IS DISTINCT FROM`/`coalesce` NULL-safety patterns) would be genuinely additive — fast, hermetic, CI-friendly regression coverage for exactly the kind of subtle SQL bug this PR has needed 8 rounds to fully harden — without duplicating what `verify-rls.mjs` already proves (RLS + end-to-end client behavior against the live project). Not implemented in this round; flagged as a real, non-urgent opportunity.

## 4. Migration and rollback assessment

- Round 8 (`20260716203000_planner_shift_update_task_security_fix_8.sql`) is a straight `create or replace function` on both RPCs — no schema/column changes, so no new rollback complexity beyond what rounds 1–7 already documented (forward-only migrations; a rollback re-applies an earlier round's function body via a new forward migration).
- Live function bodies re-verified to match the migration files byte-for-byte after applying round 8 (same method the #418 audit used for rounds 1–7).
- `planner.events` still has 0 rows in production — no data-migration risk from the reordering (idempotency lookups now happen after a few more checks, but the table schema and constraint are untouched).

## 5. Security and RLS assessment

Everything the two audits verified clean remains clean after the fixes (re-verified live post-round-8):

- Grants: only `authenticated`/`postgres`/`service_role` hold `EXECUTE` on both RPCs — no `anon`, no `PUBLIC`.
- `search_path = ''` with full schema-qualification on every user-schema reference in both functions.
- Cross-org isolation: every query is scoped by `org_id`/`instance_id` derived from the actual row, never attacker-supplied.
- `setViewConfig` relies on real `user_id = auth.uid()` RLS on all 4 verbs (confirmed live in the schema migration, not just claimed in a comment); no service-role bypass.
- No raw Postgres error message reaches a client anywhere in the adapter layer — every `.catch`/error branch maps to a fixed, sanitized message; unrecognized codes fall through to `UNKNOWN_ERROR` by construction.
- Supabase advisors: only the expected, pre-existing `authenticated_security_definer_function_executable` WARN — no new findings after round 8.

## 6. Concurrency and idempotency assessment

- **Fixed this round:** authorization now runs before idempotency replay (closes the demoted-actor replay gap) and now covers EVERY changed task, not just the root task (round 10 closed the remaining gap CodeRabbit found); dependency rows are locked before the edge comparison (closes the concurrent-DELETE race); non-root task authorization failures now correctly return `FORBIDDEN` instead of `STALE_VERSION`; `planner_update_task`'s hash now covers `p_expected_updated_at` (round 9); a patched assignee must now be an org member (round 10).
- **Re-verified unchanged and correct:** lock ordering (instance row first, then task rows, deadlock-free by construction); stale-check re-read timing (reads the already-locked row, not a pre-lock snapshot); minimal-writes (`IS DISTINCT FROM` gates every write); same-transaction audit event; idempotency uniqueness scope `(actor_user_id, instance_id, event_type, idempotency_key)`; jsonb hash canonicalization (independently re-verified with a live `::text` cast comparison, not just trusted from a comment); true-concurrent-duplicate handling (structurally serialized by the instance-row lock before either caller reaches the idempotency check; the `unique_violation` handler is defense-in-depth, not load-bearing).
- **Still deferred, confirmed low-risk:** mid-loop partial-write rollback (practically unreachable under current locking — all affected tasks are locked before the write loop runs); no-op-replay-doesn't-replay (a deliberate, reasoned trade-off from round 3, re-confirmed correct on independent review); server-side validation of shifted dates against the dependency graph's ordering constraints (round 10, CodeRabbit "Heavy Lift" — a real architectural question, not a same-session fix).

**Best-practices verification (web search, official/authoritative sources):**
- Idempotency: authorization must be "tied to a specific user server-side" before a replay is honored, and a request's full input parameters (not a subset) should determine whether two calls are "the same request" — both principles directly informed round 8's and round 10's authorization-before-replay fixes and round 9's hash-completeness fix. See [Implementing Stripe-like Idempotency Keys in Postgres](https://brandur.org/idempotency-keys), [An In-Depth Introduction To Idempotency](https://lpalmieri.com/posts/idempotency/).
- SECURITY DEFINER functions: pin `search_path`, never grant to `anon` unless intended, always add `authenticated` explicitly rather than relying on `auth.uid()` checks alone to exclude anonymous callers — all already true of both RPCs pre-audit, reconfirmed against current guidance rather than assumed. See [Supabase: Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security), [Supabase: Do I need to expose "security definer" functions?](https://supabase.com/docs/guides/troubleshooting/do-i-need-to-expose-security-definer-functions-in-row-level-security-policies-iI0uOw).

## 7. Scores

- **PR #418 (SQL/RPC layer): 84/100** at the start of this audit (pre-round-8) — zero Critical/High findings, all Medium-or-lower. Round 8 closed 2 Medium + 1 Low. Round 9 closed 1 more Medium (bot re-review of round 8's own diff). Round 10 closed 2 Major findings from CodeRabbit's first full pass (incomplete per-task reauthorization; missing assignee org-membership check) and correctly deferred 1 Heavy-Lift architectural item with reasoning. Effective score after rounds 8–10: **94/100** — all actionable findings from 3 independent review passes (2 dedicated audit agents + CodeRabbit) are closed; the one remaining open item is a deliberate scope decision, not an oversight.
- **PR #420 (app-layer): 78/100** at the start of this audit — held back by the stale-branch defect and 6 test-coverage gaps, both real. Post-fix (rebased three times — onto rounds 8, 9, and 10 in sequence — tests added, including 2 new probes for round 10's assignee-org-membership fix): **89/100**.
- **Combined production-readiness score: 91/100.**

## 8. Merge decision

- **PR #418: MERGE.** No live risk existed even pre-fix (no application code called these RPCs yet), and every actionable finding from all three review passes is now closed.
- **PR #420: MERGE**, now that the rebase and test gaps are resolved. Was "changes required" at audit start; both required changes are done.
- **Complete stacked chain (#418 + #420): safe to merge as a unit.** The app layer correctly delegates all authorization/concurrency/idempotency decisions to the RPCs, never bypasses RLS, never leaks raw database errors, and the RPC layer's remaining deferred items are independently confirmed low-risk or deliberate scope decisions rather than unexamined gaps.

## 9. Final verification checklist

- [x] Round-8 migration applied to `nvdlhrodvevgwdsneplk`
- [x] Live function bodies match the migration files (round 8, both RPCs)
- [x] Supabase security advisors: only the expected pre-existing WARN, no new findings
- [x] Full `scripts/verify-rls.mjs` suite green post-round-8 (zero regressions, including the IPI-649-specific shift/update probes)
- [x] App branch (`ipi/649-workspace-mutation-adapters-app`) rebased onto the RPC branch's latest tip — `merge-base` now equals the base tip exactly
- [x] 6 new tests added to `mutations.test.ts`, 44 → 50, all green
- [x] `tsc --noEmit` clean on the app branch after the test additions
- [x] Round-8 pushed to PR #418's branch; rebase + new tests pushed (force-with-lease, own branch history only) to PR #420's branch
- [x] Round-9 migration (`planner_update_task` hash fix) applied to `nvdlhrodvevgwdsneplk`, advisors clean, full `verify-rls.mjs` green, pushed to PR #418's branch
- [x] App branch re-rebased onto round 9 (`merge-base` again equals the base tip exactly), extended `verify-rls.mjs` suite green (including updateTask-specific probes), force-with-lease pushed
- [x] Round-10 migration (full per-task reauth + assignee org-membership check) applied to `nvdlhrodvevgwdsneplk`, advisors clean, pushed to PR #418's branch
- [x] 2 new `verify-rls.mjs` probes added for the assignee-org-membership check (outsider rejected, real member allowed), both pass
- [x] App branch re-rebased onto round 10 (`merge-base` again equals the base tip exactly), full `verify-rls.mjs` + `mutations.test.ts` (50 tests) green, force-with-lease pushed
- [x] All CodeRabbit findings replied to with commit SHAs; 2 threads resolved (fixed), 1 left open with reasoning (deliberately deferred)
- [ ] `DEPENDENCY_CHANGED`/`SCHEDULE_CONFLICT` code split — deliberately deferred, not a merge blocker
- [ ] pgTAP suite for RPC-internal SQL invariants — deliberately deferred, not a merge blocker
- [ ] Server-side validation of shifted dates against dependency ordering (round 10 Heavy-Lift item) — deliberately deferred, future ticket
