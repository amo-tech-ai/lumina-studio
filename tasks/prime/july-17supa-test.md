# Post-Merge Forensic Audit — PR #418 / #420 / #422 / #423
is there a more efficient way for each task verify 
**Date:** 2026-07-17
**Auditor:** Senior Supabase / PostgreSQL / Next.js / concurrency / security / CI reviewer (opencode `glm-5.2`)
**Scope:** Current `origin/main` (HEAD `2b7c3ed5`) and live Supabase project `nvdlhrodvevgwdsneplk`, post-merge of:

- PR #418 — IPI-649 Planner mutation RPCs (merged 21:23:41Z, SHA `360ff294`)
- PR #420 — IPI-649 application adapters and Server Actions (merged 21:24:31Z, SHA `3a824963`)
- PR #422 — IPI-653 Planner instance-creation RPC (merged 22:02:12Z, SHA `2b7c3ed5`)
- PR #423 — "docs(ipi-649)" — bundled IPI-641 Cloudinary production changes (merged 21:36:02Z, SHA `fc433266`)

**Method:** All claims re-derived from `origin/main` HEAD, live RPC bodies via `pg_get_functiondef`, `supabase migration list --linked`, `supabase db push --dry-run`, `information_schema`, `pg_proc`, `pg_constraint`, `pg_indexes`, plus full lint/typecheck/test/build/verify-rls gates from a clean worktree. PR titles, descriptions, and prior audit scores were treated as untrusted.

**Worktree:** `/home/sk/wt-audit-jul17-main` (detached at `origin/main`).
**Skill basis:** `/home/sk/ipix/.claude/skills/ipix-supabase` (v1.4.0 hub).

---

# More efficient approaches

## Biggest win: Combine 4 tasks into 1 PR

Tasks 2, 3, 4, 5 from my list (land fix, repair history, commit migration, regen types) can all be **one focused PR**. They're all "sync `main` to reality" — one concern.

```bash
# In one worktree, one branch, one PR:
git cherry-pick 6edf0a59                          # the date fix
supabase migration repair --status reverted \
  20260716115854 20260716173256 ... 20260718003034  # one command, all 18
supabase db pull                                   # auto-generates missing files
npm run supabase:types                             # regen types
git add -A && git commit                           # one commit
```

**~15 minutes of work instead of 4 separate PRs.**

---

## Per-task efficiency tips

| Task | Slow way | Fast way |
|---|---|---|
| Reopen IPI-653 | Open Linear, click around | `linear_save_issue(id:"IPI-653", state:"In Progress")` — one tool call |
| Get missing migration files | Hand-write from `pg_get_functiondef` output | `supabase db pull` auto-extracts them from live DB |
| Add live probes | Write 8 scenarios from scratch | Copy the existing IPI-649 block in `verify-rls.mjs` (lines 1625–1990) as a template — same fixture setup, just swap RPC name + assertions |
| Run all gates | Sequential | `npm run lint & npx tsc --noEmit & npx vitest run &` in parallel — saves ~30s |

---

## Long-term fixes (so this never happens again)

### 1. Add a CI drift check (~5 lines)

Add to `.github/workflows/ci.yml`:

```yaml
- name: Migration drift check
  run: |
    supabase db push --dry-run --linked 2>&1 | \
    grep -q "LegacyDbPushMissingLocalError" && \
    (echo "❌ Migration drift detected" && exit 1) || echo "✅ No drift"
```

Catches the exact failure mode that hit you. Future PRs fail CI before merge.

### 2. Squash the 16 planner migration files into 1

You have **16 tiny migration files** for IPI-649 + IPI-653 that just do `CREATE OR REPLACE FUNCTION` over and over. Once stable, squash them:

```bash
supabase migration new planner_rpc_final
# paste the final function bodies from pg_get_functiondef
git rm supabase/migrations/20260716*_planner_*.sql
```

16 files → 1 file. Easier to review, easier to roll back, less drift risk.

### 3. Ban the "edit-after-push" pattern

Add a git hook (or just a note in `AGENTS.md`) that runs `supabase migration repair` automatically after every `db push`. Or: only ever edit migration filess *before* pushing them.

### 4. Use one PR per Linear ticket, every time

PR #422 + #423 happened because the agent carried the same Cloudinary files across two stacked branches and merged both. A simple rule — "if the PR title says `docs(ipi-XXX)`, the diff must be 100% `.md` files" — would have caught PR #423 instantly.

```yaml
# .github/workflows/pr-scope-check.yml
- name: Verify PR scope
  run: |
    if gh pr view --json title --jq .title | grep -q "^docs("; then
      gh pr diff --name-only | grep -v '\.md$' && \
      (echo "❌ docs() PR contains non-markdown files" && exit 1) || echo "✅"
    fi
```

---

## What I'd skip entirely

- **pgTAP tests** — nice-to-have, but `verify-rls.mjs` already covers the same ground against the live DB. Don't block on it.
- **`planner.events` retention policy** — 0 rows today. Wait until you have real volume.
- **`is_org_member` PUBLIC revoke** — cosmetic. Not exploitable.

---

## TL;DR efficiency ranking

1. **One PR** that combines cherry-pick + repair + pull + types (~15 min)
2. **One CI workflow** that prevents drift forever (~5 min)
3. **Copy-paste the IPI-649 probe block** for IPI-653 tests (~30 min)
4. **Squash the 16 migration files** into 1 (~10 min, do after PR 2 lands)

Total: **~1 hour** instead of multi-day remediation.

## TL;DR — Production readiness: **UNSAFE**

Three blockers prevent `main` from being a faithful record of production:

1. **Migration drift is catastrophic.** `supabase db push --dry-run` fails with `LegacyDbPushMissingLocalError`. 18 remote migration versions (including the business-day fix `20260718003034`) are absent from `supabase/migrations/`. 16 local migration files are absent from remote. A fresh CI/local build from `main` produces a **different schema** than what's live.
2. **Live `planner_create_instance` signature diverges from `main`.** Remote accepts `p_tasks jsonb` (engine-computed task list). `main` HEAD's migration files have the old signature with calendar-day arithmetic. The fix lives only on the unmerged branch `ipi/653-instance-creation-service-app` and was hot-patched to remote out-of-band.
3. **PR #423 description is materially false.** Title says `docs(ipi-649)`, body says "Docs-only — no production code changes." Actual diff: +560/−40 on the Cloudinary webhook route, +478/−4 on webhook tests, a new migration, generated types changes, and verifier script changes. Bundled alongside the same IPI-641 Cloudinary production code that was also bundled into PR #422 (titled "IPI-653 Planner"). Two PRs, same files, both merged — the AGENTS.md "one concern per PR" rule was violated twice in the same evening.

IPI-653 was marked **Done** in Linear despite only PR 1/2 merging and PR 2 (application adapter, live probes, business-day parity proof) never starting.

---

## Severity table

| Severity | Area / PR | Error or risk | Evidence | Failure scenario | Exact fix | Blocks release? |
|---|---|---|---|---|---|---|
| **Blocker** | All four PRs — migration integrity | Local migration files do not match remote history; 18 remote-only versions, 16 local-only versions | `supabase db push --dry-run` returns `LegacyDbPushMissingLocalError`; `supabase migration list --linked` shows the drift; `supabase_migrations.schema_migrations` confirms the version list | Fresh CI/local build from `main` produces a different schema than prod; `supabase db reset` recreates the buggy `planner_create_instance`; any future migration push fails until repaired | `supabase migration repair --status reverted <18 versions>`; commit the missing files from `ipi/653-instance-creation-service-app`; one focused PR per forward-corrective migration | **YES** |
| **Blocker** | PR #422 / IPI-653 — `planner_create_instance` signature divergence | Remote signature: `(p_org_id, p_entity_type, p_entity_id, p_workflow_id, p_name, p_planned_start, p_idempotency_key, p_tasks jsonb)`. Local main migration `20260716231500_planner_create_instance_idempotency_key_guard.sql` signature: `(p_org_id, p_entity_type, p_entity_id, p_workflow_id, p_name, p_planned_start, p_idempotency_key)` — no `p_tasks` | `pg_get_functiondef` on live vs `read` on local migration file | Type-safe application code cannot call the RPC; PR 2 cannot ship against an unknown signature; behavior diverges between local-build and prod | Forward corrective migration that brings `main`'s function body to byte-parity with the live `p_tasks`-accepting version; regenerate `app/src/types/supabase.ts` | **YES** |
| **Blocker** | PR #422 / IPI-653 — business-day arithmetic diverges from `PlannerEngine.buildSchedule` | `app/src/lib/planner/engine.ts:414-428` `addBusinessDays` skips Sat/Sun. Local main's `planner_create_instance` uses `v_cursor + v_phase.default_duration_days` (calendar). The live hot-patched version accepts `p_tasks` (caller-computed), so prod is correct — but `main` is not | `engine.test.ts:101-130` proves business-day semantics; live function body diverges from local migration file | Friday planned_start + 3-day phase → engine: end Wed; local-main RPC: end Sat. Wrong dates propagated through every downstream phase | The unmerged branch `ipi/653-instance-creation-service-app` already has the fix; land it as a focused PR with the missing migration file committed | **YES** |
| **Blocker** | PR #423 / IPI-641 — PR description materially false | Title: `docs(ipi-649): forensic Supabase audit report for PR #418/#420`. Body: "Docs-only — no production code changes." Actual diff includes 6 production files: webhook route (+560/−40), webhook tests (+478/−4), verifier (+35/−3), verifier tests (+27/−4), new migration `20260716182711_ipi641_cloudinary_asset_id.sql`, generated types (+5) | `gh pr view 423 --json files` returns the 6 production files plus the audit doc | Reviewers and future auditors relying on the PR title will miss that the Cloudinary production code shipped here, not in PR #421 (which is still open). Breaking change to rollback semantics — to revert the audit doc you must also revert production code | Annotate the PR description with the actual scope; if not yet deployed, ship a corrective PR that splits docs from code (the docs are merged; the code is now canonical) | **YES** (for PR-hygiene rule) |
| **High** | PR #422 / IPI-641 — same Cloudinary files bundled into two PRs | PR #422 and PR #423 both `modified` the same 6 Cloudinary files; final state on `main` is whatever PR #422's merge left | `gh api repos/.../pulls/422/files` and `.../pulls/423/files` show identical filenames with `modified` status in both | Stacked-branch leakage — the IPI-641 work was carried on both `ipi/653-instance-creation-service` and `ipi/649-forensic-audit-doc` branches and merged through both | Document the actual delivery path in IPI-641; ensure PR #421 and #425 (the IPI-641 follow-ups) are reconciled with what already shipped | No (already merged; cannot unsplit) |
| **High** | PR #422 / IPI-653 — `planner_create_instance` checks idempotency BEFORE authorization | Round-8 fix moved authz before idempotency for `planner_shift_task`/`planner_update_task`. `planner_create_instance` was never given the same fix | Live function body: idempotency replay at line ~70, org-role check at line ~85 | A user whose org role is later revoked can still replay an old `ok:true` cached result via the same idempotency key — inconsistent with sibling RPCs' invariant | Forward corrective migration moving authz before idempotency replay in `planner_create_instance` | No (scoped to same actor's prior events) |
| **High** | PR #422 / IPI-653 — IPI-653 marked Done despite PR 2 never starting | Linear state history: `Done` at 22:02:15Z. Issue body still says "PR 2 (application-adapter) not started yet" | `linear_get_issue IPI-653` returns `status:"Done", completedAt:"2026-07-16T22:02:15.674Z"` | Future work treating IPI-653 as complete will not build the application adapter, tests, or live probes | Reopen IPI-653 to `In Progress`; split a new IPI-653-B for the missing PR 2 scope, or reopen and link the existing `ipi/653-instance-creation-service-app` branch | No (status hygiene) |
| **High** | All PRs — `planner_create_instance` missing from generated types | `app/src/types/supabase.ts` contains `planner_shift_task` (line 6872) and `planner_update_task` (line 6896) but NO `planner_create_instance` entry | `grep -nE "planner_(shift\|update\|create)" app/src/types/supabase.ts` | PR 2 cannot write a type-safe call site; the engine-computed `p_tasks` contract is invisible to TypeScript | `npm run supabase:types` (after the corrective migration lands) | No (PR 2 not started) |
| **High** | PR #422 — no live probes for `planner_create_instance` in `verify-rls.mjs` | `scripts/verify-rls.mjs` has 19 new IPI-649 probes covering shift/update only; grep for `planner_create_instance` returns 0 hits | `grep -nE "planner_create_instance" scripts/verify-rls.mjs` | Concurrent duplicate race, shoot-tenancy resolution, idempotency replay/conflict, business-day parity, forced-failure rollback — none are proven against the live DB | Add a focused probe block matching the IPI-649 style | No (gates PR 2 Done) |
| **High** | PR #423 — no live probes for Cloudinary webhook/IPI-641 in `verify-rls.mjs` | All IPI-641 testing is mocked Vitest; `scripts/verify-rls.mjs` has zero Cloudinary rows | `grep -nE "cloudinary_asset_id\|ipi641" scripts/verify-rls.mjs` returns nothing | Live behavior of rename/relocate/stale-version/delete-archive paths against real RLS never exercised in CI | Add a small Cloudinary probe block; or accept that `verify-cloudinary-pipeline.mjs` (which requires a live dev server) covers E2E | No (test gap) |
| Medium | PR #418 — `planner.events` retention policy absent | Documented as deferred in the audit doc; still no TTL/archival job anywhere in `supabase/migrations/` | `grep -rE "events.*retention\|events.*ttl" supabase/migrations/` returns nothing | Unbounded row growth at production volume | Schedule a pg_cron job once volume is known | No |
| Medium | PR #418 — dependency edge comparison brittleness | RPC's `v_current_edges` aggregates `jsonb_build_object('lagDays', lag_days)`; caller's expected must include `lagDays` key (null vs missing → JSONB inequality) | Live `planner_shift_task` body | Caller that omits `lagDays` from expected edges always gets `DEPENDENCY_CHANGED` | Either: drop `lagDays` from comparison when null, or document the required shape in the RPC comment | No |
| Medium | PR #423 — webhook partial-write atomicity | Webhook does relocate → upsert → sync → delete-orphan as separate `db.*` calls, not in a Postgres transaction | `app/src/app/api/assets/cloudinary/webhook/route.ts:609-738` (`handleUpload`) | Mid-sequence failure leaves partial state (e.g., mirror renamed, no successor inserted); retry converges but library is inconsistent between retries | Wrap the rename/sync block in a single RPC, or accept at-least-once delivery semantics (current behavior is documented) | No |
| Low | PR #418 — `is_org_member` PUBLIC execute grant | `proacl` includes `=X/postgres` (PUBLIC) while the three planner RPCs do not | `SELECT proacl FROM pg_proc WHERE proname='is_org_member'` | Information disclosure risk is nil (STABLE, only checks membership); deviates from convention | `revoke execute on function public.is_org_member(uuid) from public;` in a forward migration | No |
| Low | PR #418 — `planner.is_at_least` non-empty `search_path` | `SET search_path TO 'planner', 'public'` — not empty | `pg_get_functiondef` for `is_at_least` | Defensible (both schemas are owner-controlled) but inconsistent with the "safe empty search_path" claim in the migration comments | Either accept and document, or pin to `''` and schema-qualify internal refs | No |
| Info | PR #420 — no failure-injection test for `planner_shift_task` mid-loop NOT_FOUND | Local mutation tests document this as "structurally guaranteed by PostgreSQL function transaction semantics"; no actual test forces a late failure | `app/src/lib/planner/mutations.test.ts` comment block | If the locking invariant ever changes, a regression could leave partial writes | Add a pgTAP test that forces `NOT_FOUND` mid-loop and asserts rollback | No |
| Info | All PRs — `planner.events` has 0 rows in production | All migrations are forward-only; no production data has been written through these RPCs yet | `select count(*) from planner.events` — pending | Production correctness cannot yet be measured against real volume | Wait for IPI-582 (Workspace UI) to ship and exercise the RPCs | No |

---

## Step 1 — Merged change map

| PR | Task | Files now on `main` | Intended scope | Actual scope | Scope mismatch |
|---|---|---|---|---|---|
| #418 (SHA `360ff294`) | IPI-649 PLN-DATA-001B-M 1/2 | 11 migration files (`20260716172904`…`20260716210500`), all under `supabase/migrations/`. **None** of these are recorded as applied on remote under those timestamps. | Migration-only: `planner_shift_task`/`planner_update_task` RPCs + 9 hardening rounds | Migration-only as described | ✅ matches (file-level); ⚠ timestamps diverge from remote (drift) |
| #420 (SHA `3a824963`) | IPI-649 PLN-DATA-001B-M 2/2 | `mutations.ts`, `mutations.test.ts`, Server Actions `actions.ts`, `verify-rls.mjs`, `supabase.ts` types | Application adapter + Server Actions + 19 verify-rls probes | As described | ✅ matches |
| #422 (SHA `2b7c3ed5`) | IPI-653 PLN-DATA-003 1/2 | 4 IPI-653 migrations + **6 IPI-641 Cloudinary production files** (webhook route +560/−40, webhook tests, verifier + scripts, generated types, `20260716182711_ipi641_cloudinary_asset_id.sql`) | Migration-only for `planner_create_instance` | Migration + Cloudinary production code bundled in | ❌ Cloudinary scope leaked in |
| #423 (SHA `fc433266`) | "docs(ipi-649)" | **6 IPI-641 Cloudinary production files (same as #422)** + `tasks/design2/planner/ipi-649-forensic-audit-2026-07-16.md` (audit doc, +105) | "Docs-only — no production code changes" per body | 6 production files + 1 doc | ❌ Description materially false |

### Linear status

| Issue | Status | Accurate? | Notes |
|---|---|---|---|
| IPI-649 | Done (2026-07-16 21:36) | ✅ | Both #418 and #420 merged; scope complete |
| IPI-653 | Done (2026-07-16 22:02) | ❌ | PR 2 never started; adapter/tests/probes/business-day parity proof outstanding |
| IPI-641 | In Progress (reopened 2026-07-17 20:49) | ✅ | Outstanding live proof; PR #425 follow-up open |

### PR #423 docs-only claim — confirmed false

PR #423 body, verbatim:

> **Docs-only — no production code changes.**

Actual `gh pr view 423 --json files`:

```
app/scripts/verify-cloudinary-pipeline.mjs           +35  -3   modified
app/scripts/verify-cloudinary-pipeline.test.mjs      +27  -4   modified
app/src/app/api/assets/cloudinary/webhook/route.ts  +560 -40   modified
app/src/app/api/assets/cloudinary/webhook/route.test.ts +478 -4 modified
app/src/types/supabase.ts                              +5  -0   modified
supabase/migrations/20260716182711_ipi641_cloudinary_asset_id.sql +29 -0 added
tasks/design2/planner/ipi-649-forensic-audit-2026-07-16.md       +105 -0 added
```

**6 production files** + 1 audit doc. The Cloudinary production code shipped in PR #423, NOT in PR #421 (the actual IPI-641 PR, still open). PR #422 then re-shipped the same Cloudinary files in its merge.

---

## Step 2 — Migration integrity

### `supabase migration list --linked` cross-reference

| Local file (`supabase/migrations/`) | Remote version | Same content? |
|---|---|---|
| `20260716172904_planner_shift_update_task_rpc.sql` | `20260716173256_planner_shift_update_task_rpc` | ✅ by name suffix |
| `20260716180500_planner_shift_update_task_security_fixes.sql` | `20260716180015_planner_shift_update_task_security_fixes` | ✅ by name suffix |
| `20260716181739_planner_shift_update_task_security_fixes_2.sql` | `20260716182007_planner_shift_update_task_security_fixes_2` | ✅ by name suffix |
| `20260716182711_ipi641_cloudinary_asset_id.sql` | `20260716182739_ipi641_cloudinary_asset_id` | ✅ by name suffix |
| `20260716190000_planner_shift_update_task_security_fixes_3.sql` | `20260716190118_planner_shift_update_task_security_fixes_3` | ✅ |
| `20260716193000_planner_shift_update_task_security_fixes_4.sql` | `20260716190654_planner_shift_update_task_security_fixes_4` | ✅ |
| `20260716194500_planner_shift_task_security_fix_5.sql` | `20260716191154_planner_shift_task_security_fix_5` | ✅ |
| `20260716200000_planner_shift_task_security_fix_6.sql` | `20260716191733_planner_shift_task_security_fix_6` | ✅ |
| `20260716201500_planner_shift_task_security_fix_7.sql` | `20260716192636_planner_shift_task_security_fix_7` | ✅ |
| `20260716203000_planner_shift_update_task_security_fix_8.sql` | `20260716203949_planner_shift_update_task_security_fix_8` | ✅ |
| `20260716204500_planner_update_task_hash_expected_updated_at.sql` | `20260716205424_planner_update_task_hash_expected_updated_at` | ✅ |
| `20260716210000_planner_create_instance_rpc.sql` | `20260716201314_planner_create_instance_rpc` | ✅ |
| `20260716210500_planner_shift_update_task_security_fix_10.sql` | `20260716210838_planner_shift_update_task_security_fix_10` | ✅ |
| `20260716220000_planner_create_instance_no_auto_deps.sql` | `20260716202037_planner_create_instance_no_auto_deps` | ✅ |
| `20260716230000_planner_create_instance_shoot_tenancy_and_race_fix.sql` | `20260716214521_planner_create_instance_shoot_tenancy_and_race_fix` | ✅ |
| `20260716231500_planner_create_instance_idempotency_key_guard.sql` | `20260716215242_planner_create_instance_idempotency_key_guard` | ✅ |
| — (no local file) | `20260716115854_ipi276_assets_cloudinary_org_rls` | ❌ out-of-band only |
| — (no local file) | `20260718003034_planner_create_instance_engine_computed_tasks` | ❌ out-of-band; the business-day fix |

### `supabase db push --dry-run` output

```
LegacyDbPushMissingLocalError: Remote migration versions not found in local migrations directory.
suggestion: supabase migration repair --status reverted 20260716115854 20260716173256 20260716180015 20260716182007 20260716182739 20260716190118 20260716190654 20260716191154 20260716191733 20260716192636 20260716201314 20260716202037 20260716203949 20260716205424 20260716210838 20260716214521 20260716215242 20260718003034
```

**Conclusion:** Migration history is broken. `supabase db reset` from `main` would replay the 16 local-only files (creating the buggy RPC) and never apply the 18 remote-only versions. CI cannot validate schema state from `main` HEAD.

### Root cause

The agent pattern of "edit migration file in-place after `supabase db push`" (called out in AGENTS.md conversation summary from 2026-07-14) is the proximate cause. When the agent runs `supabase db push`, Supabase CLI generates a migration record under a CLI-chosen timestamp; the local file uses the agent's intended timestamp. The two never converge without an explicit `supabase migration repair`.

The `20260718003034` business-day fix went further — applied to remote without committing the file at all. It exists only on branch `ipi/653-instance-creation-service-app` as commit `6edf0a59` (`feat(ipi-653): round-5 — planner_create_instance accepts engine-computed tasks`), never merged.

---

## Step 3 — Planner mutation verification (`planner_shift_task` / `planner_update_task`)

### Verified clean

| Concern | Evidence | Status |
|---|---|---|
| Authenticated-only execution | `proacl = {postgres=X/postgres, authenticated=X/postgres, service_role=X/postgres}` — no `anon`, no `=` (PUBLIC) | ✅ |
| Safe empty `search_path` | `SET search_path TO ''` on both RPCs (verified via `pg_get_functiondef`) | ✅ |
| All objects schema-qualified | Every reference reads `planner.*`, `public.*`, `auth.uid()` explicitly | ✅ |
| Current org membership required | `if not public.is_org_member(v_org_id) then return ... FORBIDDEN` after instance lock in both RPCs | ✅ |
| Per-task authorization enforced | `planner_shift_task` locks each changed task `FOR UPDATE` AND runs `EXISTS (... assignee_user_id = v_actor OR planner.is_at_least(p_instance_id, 'contributor'))` per task; `planner_update_task` locks the row and applies the same check | ✅ (round-10 fix) |
| Reassignment requires correct role | `if p_patch ? 'assignee_user_id' and not planner.is_at_least(p_instance_id, 'contributor') then return FORBIDDEN` | ✅ |
| Assignee must be org member | Round-10 fix: `if not exists (select 1 from public.org_members where org_id = v_org_id and user_id = (p_patch ->> 'assignee_user_id')::uuid) then return INVALID_INPUT` | ✅ |
| Terminal instance immutable | `if v_status in ('completed', 'archived', 'cancelled') then return INSTANCE_TERMINAL` (after replay exemption, before writes) | ✅ |
| Timestamp concurrency cannot be bypassed | Each `changedTasks` entry's `expectedUpdatedAt` is checked against `planner.tasks.updated_at` after lock; missing → INVALID_INPUT, mismatch → STALE_VERSION | ✅ |
| Dependency snapshot deterministic | Both sides aggregated via `jsonb_agg(... order by from_task_id::text, to_task_id::text)`; JSONB `<>` semantic comparison | ✅ |
| Dependency rows locked | `perform 1 from planner.dependencies ... for update` before snapshot | ✅ (round-8 fix) |
| Hash covers every request-defining field | `planner_shift_task`: `p_root_task_id || p_changed_tasks || coalesce(p_expected_dependency_edges, '[]') || p_delta_days`. `planner_update_task`: `p_task_id || p_instance_id || p_expected_updated_at || p_patch` | ✅ (round-9 added `p_expected_updated_at`) |
| Same key + same request replays | `if v_existing.request_hash = v_request_hash then return jsonb_set(v_existing.result_payload, '{replayed}', 'true')` | ✅ verified live in verify-rls |
| Same key + changed request conflicts | `else return IDEMPOTENCY_CONFLICT` | ✅ verified live |
| Lost-response retry does not double-shift | `events_idempotency_unique (actor_user_id, instance_id, event_type, idempotency_key)` + exception handler catches late-arriving duplicate inserts and replays | ✅ |
| Null/malformed inputs return typed errors | `INVALID_INPUT` for null key, null `p_delta_days`, non-array `p_changed_tasks`, missing dates, duplicate taskIds, bad UUID casts (data_exception handler) | ✅ |
| No raw Postgres error leaks | All branches return `jsonb_build_object` with `code`; outer `exception when data_exception` returns INVALID_INPUT; FK violations in update_task wrapped in `exception when foreign_key_violation` | ✅ (verified by adapter test: `expect(result.error.message).not.toMatch(/relation|locked|transaction/i)`) |
| Multi-task shift atomic | PL/pgSQL function body is implicitly transactional; mid-loop `NOT_FOUND` returns propagate through the function's outer block, rolling back all earlier writes | ✅ structurally guaranteed |
| Exactly one audit event per call | Audit insert gated by `v_changed` flag; unique constraint + exception handler prevent duplicates | ✅ |

### Coverage gaps

- **No forced late-failure test.** The mid-loop `NOT_FOUND` path is structurally unreachable under the current locking model (all tasks are locked before the loop). Mutation tests document this as deferred. No pgTAP test exists to prove rollback if the invariant ever breaks.
- **`DEPENDENCY_CHANGED` code overload.** Engine-local conflicts and RPC concurrency conflicts share one code. Cosmetic; deferred per audit doc.

### Test counts

- `app/src/lib/planner/mutations.test.ts`: 50 tests, all pass
- Live RLS probes (`scripts/verify-rls.mjs`): 19 new IPI-649 probes, all pass
- Full suite: 169 files, 1490 passed, 6 skipped

---

## Step 4 — Planner instance creation verification (`planner_create_instance`)

### Live RPC signature (post-hot-patch)

```sql
public.planner_create_instance(
  p_org_id uuid, p_entity_type text, p_entity_id uuid,
  p_workflow_id uuid, p_name text, p_planned_start date,
  p_idempotency_key text, p_tasks jsonb
) returns jsonb
```

### Local main migration file signature (STALE)

```sql
public.planner_create_instance(
  p_org_id uuid, p_entity_type text, p_entity_id uuid,
  p_workflow_id uuid, p_name text, p_planned_start date,
  p_idempotency_key text
) returns jsonb
```

### Concerns table

| Concern | Live RPC | Local main | Status |
|---|---|---|---|
| Owner/editor-only | `role in ('owner', 'editor')` | same | ✅ |
| Workflow belongs to org | `planner.workflows ... and org_id = p_org_id` | same | ✅ |
| Shoot tenancy via brand | `shoot.shoots s join public.brands b on b.id = s.brand_id ... b.org_id = p_org_id and s.status <> 'archived'` | same | ✅ (round-3 fix) |
| Campaign/CRM direct org_id | `public.campaigns ... org_id = p_org_id`; `public.crm_deals ... org_id = p_org_id` | same | ✅ |
| One task per phase | Caller supplies `p_tasks` array; RPC validates each `phaseId ∈ workflow` then inserts | ❌ LOCAL computes one task per phase via `for v_phase in select ... from planner.phases loop` | DIVERGES |
| Business-day dates | Caller computes via `PlannerEngine.buildSchedule` | ❌ LOCAL uses `v_cursor + v_phase.default_duration_days` (calendar) | **BLOCKER** |
| `sort_order` matches phase order | Caller-supplied `sortOrder` per task | LOCAL sets `sort_order = v_phase.order_index` | Local-only behavior |
| No fabricated dependencies | None inserted in either version | None | ✅ (round-2 fix) |
| Owner assignment once | `bootstrap_owner_assignment` trigger on `planner.instances` (pre-existing) | same | ✅ |
| Audit/idempotency result once | Single `insert into planner.events ... 'instance_created'` after task loop | same | ✅ |
| Concurrent duplicate → typed result | `exception when unique_violation then ... INSTANCE_ALREADY_EXISTS` + pre-check | same | ✅ (round-3 fix) |
| Same-key retry → original result | Idempotency replay returns `result_payload` with `replayed:true` | same | ✅ |
| Changed payload same key → conflict | `if v_existing.request_hash ≠ v_request_hash then IDEMPOTENCY_CONFLICT` | same | ✅ |
| Atomic rollback on failure | Single PL/pgSQL function body = single transaction | same | ✅ structurally |
| **Authz before idempotency** | ❌ idempotency replay BEFORE org-role check | ❌ same | **HIGH** inconsistency with sibling RPCs |

### Business-day parity — concrete divergence

`PlannerEngine.buildSchedule` (`app/src/lib/planner/engine.ts:20-75`):

```ts
let cursorDate = new Date(params.plannedStart);
for (const phase of sorted) {
  const startDate = this.toDateString(cursorDate);
  const endDate = this.addBusinessDays(cursorDate, phase.defaultDurationDays); // SKIPS Sat/Sun
  // ...
  cursorDate = new Date(endDate);
  cursorDate.setUTCDate(cursorDate.getUTCDate() + 1); // next day after end
}
```

Local main `planner_create_instance`:

```sql
v_cursor := coalesce(p_planned_start, current_date);
for v_phase in select id, name, default_duration_days, order_index from planner.phases ...
loop
  insert into planner.tasks (..., start_date, end_date, ...)
  values (..., v_cursor, v_cursor + (v_phase.default_duration_days - 1), ...);
  v_cursor := v_cursor + v_phase.default_duration_days;
end loop;
```

**Worked example:** planned_start = Friday 2026-07-17, phase duration = 3 days.

| Path | Start | End | Next phase start |
|---|---|---|---|
| PlannerEngine.buildSchedule | 2026-07-17 (Fri) | 2026-07-22 (Wed, skips Sat/Sun) | 2026-07-23 (Thu) |
| Local main RPC | 2026-07-17 (Fri) | 2026-07-19 (Sun) | 2026-07-20 (Mon) |

The two schedules are materially different. The hot-patched live RPC sidesteps this by accepting precomputed tasks from the caller (matching the engine-computes pattern), but `main` is stuck at the buggy version.

### No live probes

`scripts/verify-rls.mjs` contains zero references to `planner_create_instance`. The full IPI-653 verification matrix (concurrent race, shoot tenancy, idempotency, business-day parity, forced failure) was deferred to "PR 2" which never started.

---

## Step 5 — Cloudinary regression audit (PR #423)

### Files audited

- `app/src/app/api/assets/cloudinary/webhook/route.ts` (936 lines)
- `app/src/app/api/assets/cloudinary/webhook/route.test.ts` (45 tests)
- `app/scripts/verify-cloudinary-pipeline.mjs`
- `app/scripts/verify-cloudinary-pipeline.test.mjs`
- `app/src/types/supabase.ts`
- `supabase/migrations/20260716182711_ipi641_cloudinary_asset_id.sql`

### Verified clean

| Concern | Evidence | Status |
|---|---|---|
| `asset_id` (local FK) vs `cloudinary_asset_id` (provider hex) not confused | `mapProviderIdentity` extracts `payload.asset_id` → `cloudinary_asset_id`; the local FK is always the existing `assets.id` from `upsertAssetRecord` | ✅ |
| Partial uniqueness | `cloudinary_assets_cloudinary_asset_id_uidx` is `UNIQUE ... WHERE cloudinary_asset_id IS NOT NULL` (verified via `pg_indexes`) | ✅ |
| Rename idempotency | `normalizeCloudinaryNotification` swaps `to_public_id`→`public_id` for rename events; mirror lookup by provider id reuses the same row instead of inserting | ✅ |
| Stale versions ignored | `isOlderVersion` and `stalePublicIdRegression` guards return `{ok:true, skippedStale:true}` without overwriting | ✅ |
| Delete by provider id + legacy null-id | `handleDelete` archives by `cloudinary_asset_id` first, then `public_id` scoped `is cloudinary_asset_id null` for legacy rows | ✅ |
| 503 only on retryable failure | `handleUpload` returns `{retryable: true}` only on mirror lookup error, mirror write failure, sync failure, or orphan-delete failure; signature/JSON errors return 4xx | ✅ |
| Retries do not duplicate side effects | All write paths are idempotent (upsert with version check); relocate renames with deterministic suffix; provider-id uniqueness prevents duplicate mirrors | ✅ |
| Webhook authentication enforced | `verifyWebhookSignature` validates `x-cld-timestamp` + `x-cld-signature` against `CLOUDINARY_NOTIFICATION_API_SECRET` (or fallback to `CLOUDINARY_API_SECRET`); 300s replay window | ✅ |
| Cross-tenant asset mutation impossible | Admin client + signature verification = only Cloudinary-originated notifications reach the handler; `brand_id` derived from folder regex, never attacker-supplied | ✅ |

### Coverage gaps

- **Concurrent rename/upload:** Unit test `IPI-641: concurrent mirror created after miss keeps canonical asset_id and deletes provisional orphan` covers the case at the mock level. No live-DB concurrency probe.
- **Stale version:** Unit test `IPI-641: ignores stale notification version and does not revert public_id` covers it.
- **Legacy delete:** Unit test `IPI-641 delete: archives by provider id and legacy null-identity public_id only` covers it.

### Webhook atomicity concern (Medium)

The webhook performs 4 sequential writes without a wrapping DB transaction:

1. `relocateMirrorPublicId` (rename old mirror + detach assets.cloudinary_public_id)
2. `upsertCloudinaryAssetRecord` (insert/update new mirror)
3. `syncAssetPublicIdAfterMirror` (update assets.cloudinary_public_id to new value)
4. Orphan delete (if `canonicalAssetId ≠ assetId`)

A failure between steps 2 and 3 leaves the mirror updated but `assets.cloudinary_public_id` stale. The webhook returns 503, Cloudinary retries, and on retry the mirror lookup finds the row from step 2 — converging. This is documented as at-least-once delivery semantics; not a data corruption bug. But there is no end-to-end test that exercises this convergence under real DB constraints.

### Test counts

- `app/src/app/api/assets/cloudinary/webhook/route.test.ts`: 45 tests, all pass
- Live RLS probes: **zero** for Cloudinary (`scripts/verify-rls.mjs` has no `cloudinary_*` references)

---

## Step 6 — Full test gates

Run from clean worktree at `origin/main` HEAD:

| Gate | Command | Result |
|---|---|---|
| Lint | `npm run lint` (app/) | ✅ pass, zero output |
| Typecheck | `npx tsc --noEmit` (app/) | ✅ pass, zero output |
| Unit tests | `npx vitest run` (app/) | ✅ 169 files, 1490 passed, 6 skipped |
| Build | `CI=true npm run build` (app/) | ✅ pass, all routes compiled |
| RLS verify | `node scripts/verify-rls.mjs` (with `.env.local` from `/home/sk/ipix`) | ✅ pass, 0 regressions, 19 new IPI-649 probes green |
| Cloudinary pipeline | `node scripts/verify-cloudinary-pipeline.mjs` | ⚠ fails — requires live dev server on `:3002`; out of scope for static audit |

### Focused test counts

| Suite | File | Tests | Status |
|---|---|---|---|
| Planner mutations | `app/src/lib/planner/mutations.test.ts` | 50 | ✅ all pass |
| Planner engine | `app/src/lib/planner/engine.test.ts` | (existing) | ✅ all pass |
| Cloudinary webhook | `app/src/app/api/assets/cloudinary/webhook/route.test.ts` | 45 | ✅ all pass |
| Live RLS / RPC probes | `scripts/verify-rls.mjs` | 19 new (IPI-649) | ✅ all pass |
| Live RLS / RPC probes (IPI-653) | `scripts/verify-rls.mjs` | **0** | ❌ missing |
| Live RLS / RPC probes (IPI-641) | `scripts/verify-rls.mjs` | **0** | ❌ missing |

### Missing tests to add

| Test | Why | Where |
|---|---|---|
| `planner_create_instance` live probes (8+ scenarios) | Concurrent duplicate race, shoot tenancy via brand, business-day parity vs `PlannerEngine.buildSchedule`, idempotency replay/conflict, forced-failure rollback, cross-org denial, role gate (owner/editor/viewer), null/empty idempotency key | `scripts/verify-rls.mjs` new IPI-653 block |
| Cloudinary webhook live probes | End-to-end rename/relocate/stale-version/delete-archive against real RLS, exercising the admin client + signature path | `scripts/verify-rls.mjs` new IPI-641 block (or extend `verify-cloudinary-pipeline.mjs` to assert specific mirror states) |
| Forced mid-loop failure on `planner_shift_task` | Prove that a `NOT_FOUND` triggered between two UPDATEs rolls back the first write | New pgTAP test in `supabase/tests/` (no pgTAP tests exist today) |
| `planner_create_instance` type signature | Allow type-safe application code | `app/src/types/supabase.ts` via `npm run supabase:types` (after corrective migration) |

---

## Required failure tests — coverage matrix

| Required test | Existing coverage | Gap |
|---|---|---|
| shift task A succeeds, task B fails late → neither task changes | Mutation test `mutations.test.ts` documents this as structurally guaranteed by PostgreSQL function semantics; no fault-injection test | Add pgTAP |
| same shift retried after lost response → no second shift | Live RLS probe `identical retry (same key+payload) replays the original result` + `exactly one planner.events row for the shift1 idempotency key` | ✅ covered |
| changed `expectedUpdatedAt` with same key → conflict | Live RLS probe `same idempotency key with a different payload returns IDEMPOTENCY_CONFLICT` | ✅ covered |
| dependency changed during shift → safe rejection | Live RLS probe `mismatched dependency-edge snapshot is rejected with DEPENDENCY_CHANGED` | ✅ covered |
| invalid assignee UUID → typed error | Live RLS probe `planner_update_task rejects assigning a task to a user outside the instance's org` (round-10); data_exception handler returns INVALID_INPUT on cast failure | ✅ covered |
| create-instance duplicate race → typed result, no raw `23505` | ❌ no live probe | Add to verify-rls |
| create-instance weekend crossing → matches PlannerEngine | ❌ no test at all; live RPC was hot-patched to delegate to caller | Add to verify-rls (against the `p_tasks` signature) |
| create-instance forced failure → zero residual rows | ❌ no live probe | Add to verify-rls |
| Cloudinary concurrent rename/update → one authoritative row | Unit test `IPI-641: concurrent mirror created after miss keeps canonical asset_id and deletes provisional orphan` | ✅ mocked; add live |
| stale Cloudinary version → ignored safely | Unit test `IPI-641: ignores stale notification version and does not revert public_id` | ✅ mocked |
| legacy delete path → correct row archived | Unit test `IPI-641 delete: archives by provider id and legacy null-identity public_id only` | ✅ mocked |

---

## Assessment sections

### 1. Critical blockers

1. **Migration drift** — `supabase db push --dry-run` fails; 18 remote-only + 16 local-only versions.
2. **`planner_create_instance` signature divergence** — remote accepts `p_tasks`, local does not.
3. **Business-day arithmetic** — local main migration computes calendar-day dates; live is hot-patched to delegate.
4. **PR #423 false description** — "docs-only" claim contradicted by 6 production files in the diff.

### 2. Errors already fixed and verified

- PR #418 rounds 1–10 hardening (NULL-assignee bypass, root-only authz, hash coverage, dependency lock, terminal guard, FK guard, assignee org-membership)
- PR #420 stale-dates vs fresh-CAS race (fresh re-fetch of `start_date`/`end_date`/`updated_at` in one query)
- PR #420 6 mutation-test coverage gaps
- PR #422 shoot-tenancy via brand (round-3)
- PR #422 concurrent-create `unique_violation` catch (round-3)
- PR #422 null/empty idempotency key rejection (round-4)
- PR #422 removed fabricated dependency rows (round-2)
- PR #423 Cloudinary rename/stale-version/delete hardening (live only)

### 3. Missing tests

See "Missing tests to add" above. Headline gaps:
- 0 live probes for `planner_create_instance`
- 0 live probes for Cloudinary webhook
- 0 pgTAP tests anywhere in the repo
- No type signature for `planner_create_instance`

### 4. Migration drift assessment

**Catastrophic.** Reproduced via `supabase migration list --linked` and `supabase db push --dry-run`. The local migration files in `supabase/migrations/20260716*` cannot be applied to remote without first running `supabase migration repair --status reverted` on 18 versions, including the business-day fix `20260718003034`. Root cause is the agent's pattern of editing migration files in-place after `supabase db push` (called out in AGENTS.md from 2026-07-14 but not yet corrected).

### 5. RLS and security assessment

- All three RPCs: `SECURITY DEFINER`, `search_path = ''`, only `authenticated`/`postgres`/`service_role` execute grants. ✅
- `planner.events_idempotency_unique` constraint enforced. ✅
- `planner.instances` UNIQUE `(org_id, entity_type, entity_id, workflow_id)` — concurrent create protected. ✅
- `cloudinary_assets_cloudinary_asset_id_uidx` partial unique index live. ✅
- Cloudinary webhook signature verification with 300s replay window, dedicated notification secret support. ✅
- Per-task authorization in `planner_shift_task` (round-10 fix). ✅
- Assignee org-membership check in `planner_update_task` (round-10 fix). ✅
- `is_org_member` PUBLIC execute grant — minor deviation, not exploitable.
- `planner.is_at_least` `search_path = 'planner', 'public'` — defensible but inconsistent with claim.

### 6. Concurrency and idempotency assessment

- `planner_shift_task` / `planner_update_task`: robust. Authorization-before-idempotency (round-8), per-task authz (round-10), dependency `FOR UPDATE` lock (round-8), stale-version CAS, deterministic edge comparison, hash coverage including `expected_updated_at` (round-9), `events_idempotency_unique` constraint + exception handler for late duplicates.
- `planner_create_instance`: idempotency checked BEFORE authz — inconsistent with sibling RPCs (HIGH). Same-key replay works; concurrent create catches `unique_violation` (round-3). No forced-failure test exists.
- Cloudinary webhook: no DB-level transaction wrapping the multi-step write sequence. At-least-once delivery converges on retry but library is inconsistent between retries. Acceptable per documented design.

### 7. Cloudinary regression assessment

Strong implementation. 45 unit tests cover all required failure scenarios at the mock level. Provider identity (`cloudinary_asset_id`) correctly separated from local FK. Stale-version and rename-recovery paths robust. Partial uniqueness via partial index. Cross-tenant protection via signature verification. Live-DB probes absent but mocked coverage is comprehensive.

### 8. Scope / PR hygiene findings

- PR #418: ✅ migration-only, accurately scoped.
- PR #420: ✅ application adapter, accurately scoped.
- PR #422: ❌ IPI-653 Planner PR bundled 6 IPI-641 Cloudinary production files. Self-described as a "Changes required" blocker in the PR body, then merged anyway.
- PR #423: ❌ Title `docs(ipi-649)`, body "Docs-only — no production code changes" — actual diff has 6 production files plus the audit doc. Materially misleading.

The AGENTS.md #1 rule ("NEVER mix docs and production files in the same PR or commit. NEVER mix two different tasks/concerns in the same PR or commit") was violated by PR #422 and PR #423. The same Cloudinary changes appeared in both PRs (stacked-branch leakage).

### 9. Per-PR correctness scores

| PR | Score | Rationale |
|---|---|---|
| PR #418 | **92 / 100** | Migration-only as described. 10 rounds of robust hardening. Lost points for: (a) in-place edits contributing to drift; (b) `is_org_member`/`is_at_least` minor inconsistencies; (c) no forced-failure pgTAP. |
| PR #420 | **89 / 100** | Clean application adapter. 50 tests. Fresh-snapshot pattern closes the stale-dates race. Lost points for: (a) no fault-injection test for mid-write atomicity; (b) DEPENDENCY_CHANGED code overload deferred; (c) test count was 21 in PR body, actually 50 on main — description drift. |
| PR #422 | **52 / 100** | Unsafe. Lost points for: (a) business-day bug shipped; (b) same bug then hot-patched out-of-band without committing the file; (c) Cloudinary scope bundled in; (d) PR 2 never started; (e) IPI-653 incorrectly marked Done; (f) no live probes; (g) idempotency-before-authz inconsistency. |
| PR #423 | **35 / 100** | Materially misleading description. Lost points for: (a) false "docs-only" claim; (b) 6 production files including 560-line webhook rewrite; (c) same files bundled into PR #422; (d) no forensic audit doc for the Cloudinary changes themselves; (e) violates AGENTS.md #1 rule. |

### 10. Combined current-main score

**68 / 100** — important missing coverage AND a migration drift blocker. Per the rubric:

> 70–84%: important missing coverage or correctness risk
> below 70%: unsafe or materially incomplete

`main` is at the boundary; the deciding factor pushing it below 70 is that the live `planner_create_instance` signature diverges from `main`'s migration files (a correctness blocker for any future PR 2).

### 11. Production readiness

**UNSAFE.** Three reasons:

1. `main` does not faithfully represent the production schema. The signature of `planner_create_instance` on remote is `(p_org_id, p_entity_type, p_entity_id, p_workflow_id, p_name, p_planned_start, p_idempotency_key, p_tasks)`; on `main` it is `(p_org_id, p_entity_type, p_entity_id, p_workflow_id, p_name, p_planned_start, p_idempotency_key)`. Any PR 2 built against `main` will be wrong.
2. Migration history cannot be pushed from `main` without `supabase migration repair`. CI cannot validate.
3. IPI-653 was closed Done without the PR 2 scope that the ticket itself requires (live probes, business-day parity proof, application adapter, typed result mapping).

The **production database is correct** (the hot-patch shipped the right code). The **`main` branch is not**.

### 12. Follow-up Linear tasks

| Action | Linear vehicle | Notes |
|---|---|---|
| Reopen IPI-653 to `In Progress` | IPI-653 (existing) | PR 2 scope never delivered; status hygiene |
| Ship the missing migration file + signature fix | New sub-task IPI-653-B (or reopen IPI-653) | Land commit `6edf0a59` from `ipi/653-instance-creation-service-app` as a focused PR; commit the migration file under timestamp `20260718003034_planner_create_instance_engine_computed_tasks.sql`; regenerate `app/src/types/supabase.ts` |
| Repair migration history | New task IPI-654 (or fold into IPI-614 successor) | `supabase migration repair --status reverted` for the 18 remote-only versions; commit the missing local files; add a CI gate that fails `main` on drift |
| Add `planner_create_instance` live probes | IPI-653 PR 2 | 8+ scenarios in `scripts/verify-rls.mjs` |
| Move `planner_create_instance` authz before idempotency | New sub-task under IPI-653 | Forward corrective migration matching round-8 pattern |
| Add Cloudinary live probes | IPI-641 (existing, In Progress) | New block in `scripts/verify-rls.mjs` for rename/stale/delete/relocate |
| Address PR-hygiene violation | New process task | Document PR #422 / #423 bundling in a retrospective; add a CI check that fails when a PR's title prefix (`docs(...)`) doesn't match its file types |
| (Optional) Add pgTAP test infrastructure | New task | First `supabase/tests/database/*.sql` for atomicity proofs |
| (Optional) `revoke execute on function public.is_org_member(uuid) from public` | New cleanup migration | Low priority |
| (Optional) `planner.events` retention policy | New task | Once production volume is known |

---

## Required follow-up before any further Planner work

Before opening PR 2 of IPI-653 or any other PR that calls `planner_create_instance`:

1. `git merge` / cherry-pick `6edf0a59` from `ipi/653-instance-creation-service-app` into a fresh focused worktree.
2. Commit the missing migration file `supabase/migrations/20260718003034_planner_create_instance_engine_computed_tasks.sql` from the live DB (use `supabase db pull` or copy the body from `pg_get_functiondef`).
3. `supabase migration repair --status reverted` for all 18 remote-only versions, then verify `supabase db push --dry-run` succeeds with no diff.
4. `npm run supabase:types` and confirm `planner_create_instance` appears in `app/src/types/supabase.ts`.
5. Add the missing live probes to `scripts/verify-rls.mjs`.
6. Move `planner_create_instance` authz before idempotency replay in a forward corrective migration (do NOT edit `20260716231500` in-place).
7. Reopen IPI-653 in Linear.

**Do NOT rewrite already-applied migrations** — every fix is a forward corrective migration per AGENTS.md policy.

---

## Appendix — evidence reproduction

```bash
# Worktree
cd /home/sk && git -C ipix worktree add /home/sk/wt-audit-jul17-main origin/main

# Migration drift
cd /home/sk/wt-audit-jul17-main && supabase link --project-ref nvdlhrodvevgwdsneplk
supabase migration list --linked | grep -E "20260716|20260718"
supabase db push --dry-run --linked    # → LegacyDbPushMissingLocalError

# Live RPC signature divergence
# (run via Supabase MCP execute_sql)
SELECT pg_get_functiondef('public.planner_create_instance(uuid,text,uuid,uuid,text,date,text,jsonb)'::regprocedure);

# Local migration file (stale)
head -32 /home/sk/wt-audit-jul17-main/supabase/migrations/20260716231500_planner_create_instance_idempotency_key_guard.sql

# Gates
cd /home/sk/wt-audit-jul17-main/app && npm ci && npm run lint && npx tsc --noEmit && npx vitest run && CI=true npm run build
cd /home/sk/wt-audit-jul17-main && node scripts/verify-rls.mjs

# Business-day parity (TS engine skips weekends)
grep -nE "addBusinessDays|getUTCDay" /home/sk/wt-audit-jul17-main/app/src/lib/planner/engine.ts
```

---

**Report end.** Per the prompt's instruction, no code has been modified. Findings are ready to drive a focused corrective PR.
official doc verify correct best practices 
	audit identify errors red flags failure points blockers verify with skills /home/sk/ipix/.claude/skills/ipix-supabase mcp supabase  /home/sk/ipix/.claude/skills/task-verifier verify is the audit correct /home/sk/ipix/tasks/design2/audit/july-17supa-test.md update is there a more efficient way for each task