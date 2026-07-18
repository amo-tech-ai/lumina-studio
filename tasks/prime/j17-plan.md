# PR #427 / IPI-653 — Remediation Plan (2026-07-18)

Verified against live Supabase project `nvdlhrodvevgwdsneplk`, PR #427 HEAD `90f235d9`, PR #428 (IPI-664), and `npm run supabase:verify-rls` (full suite green).

## Merge order (blocking)

1. **Merge PR #428 first** ([IPI-664](https://linear.app/amo100/issue/IPI-664)) — recovers/applies migration ledger filenames for `20260718003034` … `20260718031801`.
2. **Rebase PR #427 onto `main`** after #428 — PR #427 intentionally dropped `20260717014500` to avoid duplicate drift; app/types/probes only at HEAD.
3. **Merge PR #427** — closes IPI-653 PR 2/2.

Verify after both land:

```bash
cd /home/sk/ipix
infisical run --env=dev -- npx supabase migration list --linked   # zero drift
infisical run --env=dev -- npx supabase db push --linked --dry-run # Remote database is up to date
infisical run -- npm run supabase:verify-rls
cd app && npx tsc --noEmit && npx vitest run
```

## Linear tasks

| Priority | Issue | Action | Blocked by |
|---|---|---|---|
| P0 | [IPI-664](https://linear.app/amo100/issue/IPI-664) / PR #428 | Merge migration ledger alignment | — |
| P0 | [IPI-653](https://linear.app/amo100/issue/IPI-653) / PR #427 | Rebase + merge app adapter after #428 | IPI-664 |
| P1 | [IPI-662](https://linear.app/amo100/issue/IPI-662) | Post-merge drift verification (`migration repair --status applied` / rename per `supabase/README.md`) | IPI-653 + IPI-664 |
| P2 | [IPI-663](https://linear.app/amo100/issue/IPI-663) | CI guard: `docs(...)` PRs must be `.md`-only | — |
| P3 | New follow-up (optional) | RPC enforce one-task-per-phase + phase-set completeness | IPI-653 Done |
| P3 | New follow-up (optional) | Advisory lock for concurrent same-key idempotency | IPI-653 Done |

## PR #427 description updates before merge

- Probe count: **25** live scenarios (not 11).
- Migrations: **not in this PR** — live RPC shipped via PR #428 ledger recovery.
- Requires **#428 merged first** (see PR comment on `90f235d9`).

## Do not do

- `migration repair --status reverted` on the 18 remote versions (wrong remedy; risks re-applying DDL).
- Squash the 16 planner migration files (violates forward-only policy in `ipix-supabase` skill).
- Trust `gh pr view --json files` for merged sibling PRs — use `git show --stat <merge-sha>`.

# PR #427 Final Production Audit

**Scope:** [PR #427](https://github.com/amo-tech-ai/lumina-studio/pull/427) HEAD `90f235d9` on `ipi/653-instance-creation-service-app`, live Supabase `nvdlhrodvevgwdsneplk`, sibling [PR #428](https://github.com/amo-tech-ai/lumina-studio/pull/428) (IPI-664).  
**Method:** Re-derived from source — `pg_get_functiondef`, PR metadata, branch diff, `verify-rls.mjs` live run (passed), unit tests (129/129 planner suites passed), prior audit docs cross-checked and corrected where wrong.

---

## Executive Summary

**Ready to merge?** **No** — not as a standalone merge today.

PR #427 at HEAD is **app-only** (7 files, zero migrations). The RPC hardening lives on live DB and in **PR #428**. Merging #427 before #428 leaves `main` with app code calling a 9-arg `planner_create_instance` that `main`'s migration files do not define.

**After PR #428 merges and #427 rebases:** yes, production-ready for IPI-653 scope.

---

## Overall Score

**81 / 100**

| Area | Score | Notes |
|---|---|---|
| RPC implementation (live) | 92 | Authz-before-idempotency, structured hash, semantic validation, owner assignment fix — all verified live |
| App adapter architecture | 90 | Engine-computes / RPC-persists pattern matches IPI-649 |
| Test coverage | 85 | 25 live probes + 63 mutation unit tests; gaps on phase completeness & concurrent idempotency |
| Merge / ledger hygiene | 55 | Split across #427 + #428; description stale |
| CI / automation | 88 | All required checks green; Bugbot skipped (usage limit) |

---

## Traffic Light

**🟡 Minor fixes** — merge sequencing + doc sync, not a redesign.

---

## GitHub Verification

| Check | Result | Evidence |
|---|---|---|
| HEAD | `90f235d9` | `gh pr view 427` |
| State | OPEN, MERGEABLE, `mergeStateStatus: CLEAN` | GitHub API |
| CI | All green | `supabase-web015`, `app-build`, `booking-gate`, CodeRabbit, Vercel |
| Human approval | **None** | `reviewDecision: ""` |
| Bugbot | Skipped | Usage limit (3 comments) |
| Vercel preview | Ready | `ipix-operator-git-ipi-653-...` deployed |
| Changed files (HEAD) | 7 app/probe files only | No `supabase/migrations/` in diff vs `main` |
| PR description accuracy | **Partially stale** | Claims "11 probes" and in-PR migrations; HEAD has **25 probes**, migrations moved to #428 |

**Critical coordination:** Commit `90f235d9` dropped `20260717014500_planner_create_instance_final.sql` because live already has `20260718031801` via PR #428.

---

## Findings Table

| Severity | Finding | Evidence | Recommendation |
|---|---|---|---|
| **Blocker** | PR #427 alone does not land RPC migrations | HEAD diff: 7 files, no migrations; live RPC from `20260718031801` (PR #428) | Merge **#428 first**, rebase #427, then merge |
| **High** | PR description understates probe count & misstates migration location | Body says 11 probes; `verify-rls.mjs` has **25** IPI-653 scenarios | Update PR body before merge |
| **High** | "One task per workflow phase" not RPC-enforced | Live function validates `phaseId ∈ workflow` only; no `(instance_id, phase_id)` unique index; duplicate/missing phases allowed | Accept for MVP (app always sends 1:1 via `buildSchedule`); follow-up RPC check optional |
| **Medium** | TOCTOU on workflow phase set | Documented deferral in migration header; app reads phases then RPC validates snapshot | Follow-up: workflow revision / optimistic concurrency |
| **Medium** | Concurrent same-key idempotency race | Migration header: loser may get `INSTANCE_ALREADY_EXISTS` not `replayed:true` | Documented deferral; advisory-lock follow-up |
| **Medium** | No live probe for Friday→Monday business-day parity | Live probes use hardcoded calendar dates in `ciValidTasks`; business-day proof is unit-test only (`mutations.test.ts:879-896`, `engine.test.ts:101-130`) | Add optional live probe with engine-computed Friday start |
| **Medium** | No shoot-entity live probe in IPI-653 block | Probes use `crm_deal`; shoot tenancy validated in PR #422 migration, not re-probed here | Add one shoot-path probe or cite #422 coverage |
| **Low** | No forced-failure rollback probe | PL/pgSQL atomicity structural only | pgTAP or fault-injection follow-up (deferred per skill) |
| **Low** | `bootstrap_owner_assignment` uses `auth.uid()` not `owner_user_id` | Live trigger body confirmed | Round-7 explicit-owner assignment insert compensates — verified in probes |
| **Info** | Bugbot never ran | Usage limit | Re-run after quota reset for automated review |
| **Info** | Linear IPI-653 body stale ("PR 2 not started") | Ticket text vs linked PR #427 | Update ticket body on merge |

---

## Red Flags (Blockers)

1. **Merge #427 without #428** → `main` app calls 9-arg RPC; `main` migrations stop at 7-arg calendar-day version from PR #422.
2. **Migration ledger drift on `main` today** → persists until PR #428 merges (`LegacyDbPushMissingLocalError` class of issue from prior audit — still true for `main`, not introduced by #427 HEAD).

---

## Missing Items

| Missing test / artifact | Status |
|---|---|
| Weekend / Fri→Mon live business-day probe | Unit tests only |
| Duplicate phaseIds in `p_tasks` | Not tested |
| Missing phases (partial task list) | Not tested |
| Stale workflow TOCTOU | Deferred, documented |
| Concurrent same-key idempotency replay race | Deferred, documented |
| Forced mid-transaction failure / rollback | Not tested |
| Shoot entity type in IPI-653 probe block | Not covered |
| Human code review approval | Not obtained |
| Bugbot automated review | Skipped |

---

## False Positives

| Finding | Verdict | Why |
|---|---|---|
| PR-Agent: missing auth guard in Server Action | ❌ False positive | Matches deliberate thin-wrapper pattern (`shiftTaskAction`, `updateTaskAction`) — RPC owns authz |
| PR-Agent: missing phase validation in app | ❌ False positive | Duplicating RPC validation violates established architecture |
| Sentry: calendar-day cursor in `engine.ts` | ❌ False positive (for this PR) | Pre-existing `engine.ts` behavior; `engine.test.ts` asserts it; line 66–67 uses calendar +1 between phases after business-day end calc — known, out of PR #427 scope |
| Sentry: weekend `plannedStart` | ⚠️ Pre-existing | Real engine limitation; not introduced by #427 |
| Codex P1: split migration/app | ⚠️ Process note | Repo prefers 2-PR pattern; PR 2 intentionally bundles adapter + already-live RPC verification — acknowledged in thread |
| CodeRabbit: runtime Server Action schema validation | ⚠️ Optional hardening | Malformed input reaches RPC `INVALID_INPUT`; not required for merge |
| CodeRabbit: full `supabase:types` regen | ⚠️ Partially addressed | Hand-patched per known MCP bug (skill v1.4.0); `planner.events` columns added in `abc5655f` |
| CodeRabbit: concurrent idempotency serialization | 📌 Deferred | Documented in migration; no corruption |
| "PR #422 re-shipped Cloudinary files" (prior audit) | ❌ False | `git show --stat 2b7c3ed5` = 4 migration files only |

---

## Previous Findings Re-evaluation

| Source | Finding | Classification | Evidence |
|---|---|---|---|
| CodeRabbit | Consolidate 3 migrations | 🔄 Already fixed | Final SQL in `20260718031801` (PR #428); dropped duplicate from #427 |
| CodeRabbit | Structured request hash | 🔄 Already fixed | Live: `jsonb_build_object(...)` → `digest` |
| CodeRabbit | Semantic task validation | 🔄 Already fixed | Live: `durationDays > 0`, `sortOrder >= 0`, date order, priority domain |
| CodeRabbit | Non-member assignee probe | 🔄 Already fixed | `8bfe219f`, live verify-rls green |
| CodeRabbit | `planner.events` type columns | 🔄 Already fixed | `abc5655f` hand-patch |
| Codex | Assignee org validation | 🔄 Already fixed | Round 7, live function |
| Codex | Explicit owner assignment row | 🔄 Already fixed | Round 7 + live probes |
| Codex | Malformed task typed errors | 🔄 Already fixed | `exception when data_exception` block |
| Codex | Authz before idempotency | 🔄 Already fixed | Live: `org_members` check **before** `planner.events` lookup |
| Codex | TOCTOU phase snapshot | 📌 Still unresolved (deferred) | Migration header |
| Codex | Split migration/app | ⚠️ Partially correct | Process deviation; mitigated by #428 split |
| Prior audit | Migration drift | ✅ Correct | Ledger fix = PR #428, not #427 |
| Prior audit | Business-day gap | 🔄 Already fixed | Engine-computes via `p_tasks`; unit + integration path |
| Prior audit | IPI-653 Done prematurely | 🔄 Already fixed | Reopened In Progress 2026-07-18 |

---

## Acceptance Criteria Verification

| Claim | Verified? | Evidence |
|---|---|---|
| Business-day scheduling | ✅ App path | `createInstance` → `PlannerEngine.buildSchedule()`; unit tests assert Fri/weekend skip |
| Engine-computes / RPC-persists | ✅ | `mutations.ts:444-482`; live RPC accepts `p_tasks jsonb` only |
| One task per workflow phase | ⚠️ App only | `buildSchedule` creates 1:1; RPC does not reject duplicates/omissions |
| Owner assignment | ✅ | `owner_user_id` persisted; explicit owner gets `planner.assignments` row; trigger still assigns caller |
| Planner assignments | ✅ | Live probes: explicit owner read + no duplicate on replay |
| Idempotency replay | ✅ | Live probe + structured hash |
| Retry behavior | ✅ | Same key+payload → `replayed:true` |
| Auth before replay | ✅ | Revoked-role probe returns `FORBIDDEN` (round-7) |
| Phase validation | ✅ | Invalid `phaseId` → `INVALID_INPUT` |
| sort_order correctness | ✅ | Positive-path probe checks persisted `sort_order` |
| No auto-dependencies | ✅ | Probe: zero `planner.dependencies` rows |
| Workflow consistency | ⚠️ | TOCTOU gap documented |

---

## Architecture Verification

**Single source of truth:** ✅ for scheduling dates — `PlannerEngine.buildSchedule()` only.

```
App: listWorkflowPhases → buildSchedule → p_tasks JSON
RPC: authz → validate tasks → insert instance/tasks/event (atomic PL/pgSQL)
```

**Consistency with `planner_shift_task` / `planner_update_task`:**

| Pattern | shift/update (IPI-649) | create_instance (live) |
|---|---|---|
| `SECURITY DEFINER` + `search_path = ''` | ✅ | ✅ |
| JSON `{ok, code}` responses | ✅ | ✅ |
| Authz before idempotency replay | ✅ (round-8) | ✅ (round-7) |
| Structured request hash | ✅ | ✅ |
| Assignee org membership check | ✅ | ✅ |
| Typed `INVALID_INPUT` not raw PG errors | ✅ | ✅ |

**Duplicated logic:** None in RPC date math (removed in round-5). App does not duplicate authz.

---

## Production Risks

| Category | Risk | Level |
|---|---|---|
| **Security** | Direct RPC call with crafted `p_tasks` bypassing app | Low — authz + validation; incomplete phase set allowed |
| **Data integrity** | Concurrent idempotency race → `INSTANCE_ALREADY_EXISTS` not replay | Low — no corruption |
| **Concurrency** | TOCTOU phase changes between read and write | Medium — documented |
| **Maintainability** | Split #427/#428 increases merge error risk | Medium — mitigated by documented order |
| **Migration** | Drift until #428 lands | High on `main` today |

---

## Best Practice Improvements (doc-backed)

Per [Supabase database functions guidance](https://supabase.com/docs/guides/database/functions) and project skill `supabase-database-functions.md`:

1. **Merge #428 before #427** — keeps ledger and function body aligned (Postgres: function definitions must match migration history for reproducible deploys).
2. **Optional follow-up:** enforce `jsonb_array_length(p_tasks) = (select count(*) from planner.phases where workflow_id = p_workflow_id)` — closes phase-completeness gap without moving scheduling logic into RPC.
3. **Optional follow-up:** `pg_advisory_xact_lock(hashtext(v_actor::text \|\| p_idempotency_key))` before idempotency lookup — PostgreSQL advisory locks doc pattern for same-transaction serialization.
4. **IPI-663:** CI `docs()` scope check — would have caught PR #423 false description.

---

## Testing Verdict

**Do current tests prove correctness for the shipped contract?** **Mostly yes.**

- Live: `node scripts/verify-rls.mjs` — **RLS verification passed** (all 25 IPI-653 probes green, run 2026-07-18).
- Unit: 129/129 planner tests passed on branch HEAD.
- CI: all required gates green on #427 and #428.

**Not proven:** phase-set completeness, duplicate phases, live business-day Fri→Mon, concurrent idempotency race, forced rollback.

---

## Final Merge Decision

### 🟡 Merge after minor fixes

**Required before merge:**

1. Merge **[PR #428](https://github.com/amo-tech-ai/lumina-studio/pull/428)** (IPI-664 migration ledger).
2. Rebase **PR #427** onto updated `main`.
3. Update PR #427 description (probe count, migration location, merge dependency).
4. Re-run `verify-rls` + CI on rebased HEAD.

**Do not merge #427 alone.**

---

## Remediation Plan

Written to [`/home/sk/ipix/tasks/design2/j17-plan.md`](/home/sk/ipix/tasks/design2/j17-plan.md) with Linear task ordering (IPI-664 → IPI-653 → IPI-662 → IPI-663).

**Supabase live state confirmed:** 9-arg `planner_create_instance` with authz-before-idempotency, structured hash, semantic validation, and explicit-owner assignment — matches intended PR 2 contract. Production DB is ahead of `main`; PR #428 + #427 close that gap.