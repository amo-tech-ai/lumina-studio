# IPI-367 Final PR Audit — Won/Lost HITL Gate + Brand Conversion

**PRs:** [#337](https://github.com/amo-tech-ai/lumina-studio/pull/337) (app code) · [#341](https://github.com/amo-tech-ai/lumina-studio/pull/341) (migration)
**Audited:** 2026-07-12 · **Auditor:** Claude Code (this session)
**Scope:** current PR heads only — `337@6d34652c`, `341@59725d9e` — not earlier commits or prior summaries.

---

## 1. Executive verdict

🟢 **Both PRs are production-ready.** Every required check in this audit passed against live evidence: live Supabase state, running test suites, and live CI. One real, non-cosmetic defect was found and fixed during this audit (migration-history ledger drift on #341); one UI race condition was found and fixed on #337 in a prior pass this session and is re-verified here. No blockers remain on either PR.

| | Verdict |
|---|---|
| PR #341 (migration) | 🟢 **MERGE** |
| PR #337 (app code) | 🟢 **MERGE** |
| Merge order | **#341 first, then #337** (see §18) |
| Overall confidence | **95%** |

---

## 2. Worktree and branch verification

```
$ git worktree list | grep 367
/home/sk/wt-ipi-367-crm-won-lost-gate   [ipi/367-crm-won-lost-gate]
/home/sk/wt-ipi-367-migration           [ipi/367-crm-convert-migration]
```

| PR | Worktree | Branch | HEAD (at audit) | Status |
|---|---|---|---|---|
| #337 | `/home/sk/wt-ipi-367-crm-won-lost-gate` | `ipi/367-crm-won-lost-gate` | `6d34652c` | clean |
| #341 | `/home/sk/wt-ipi-367-migration` | `ipi/367-crm-convert-migration` | `59725d9e` | clean |

No new worktree was created. Both expected paths existed and matched `gh pr view --json headRefName`.

---

## 3. PR #341 findings — migration and database layer

**Files (final state, 5 migrations, none squashed):**
- `20260712084425_crm_deals_convert_rpc.sql` — base RPC
- `20260712091149_crm_deals_convert_hardening.sql` — editor-tier auth, activity log, domain→brand_url
- `20260712091706_crm_deals_convert_hardening_fix_ambiguous_column.sql` — RETURNS TABLE column-shadowing fix
- `20260712094357_crm_deals_convert_reject_cross_org_company.sql` — cross-org company FOUND check (won-only)
- `20260712100030_crm_deals_convert_validate_company_org_all_decisions.sql` — same check, moved to run unconditionally (won + lost)

| # | Requirement | Result | Evidence |
|---|---|---|---|
| 1 | Deal and company share `org_id` | ✅ | `where id = v_company_id and org_id = v_org_id` (100030:L48-52) |
| 2 | Same-org validation runs for both `won`/`lost` | ✅ | Company lookup + `if not found then raise` moved outside the `p_decision = 'won'` branch (100030:L44-56) |
| 3 | Cross-org mismatch raises + rolls back | ✅ | `raise exception 'crm_convert_deal: company % not found in org %'`; no exception handler anywhere in the function → plpgsql default rollback |
| 4 | No brand created on rejection | ✅ | Live-verified: `rejected cross-org won convert creates no brand` (verify-rls.mjs, run against live DB, 0 failures) |
| 5 | No `crm_activities` row on rejection | ✅ | Live-verified: `rejected cross-org won convert writes no crm_activities row` + lost-path equivalent |
| 6 | Row locking prevents duplicate brands | ✅ | `select ... for update` on both `crm_deals` and `crm_companies` before any write; confirmed race-safe by independent rls-policy-auditor pass |
| 7 | Idempotent repeated `won` reuses brand | ✅ | Live-verified: `converting a second deal on the same company reuses the existing brand, no duplicate` |
| 8 | `lost` never touches brands | ✅ | Brand insert/update is inside `if p_decision = 'won' then` only; live-verified: `converting a deal to lost returns a null brand_id` |
| 9 | `is_org_editor_or_above()` enforced | ✅ | Line 102-104 (100030); confirmed via `pg_get_functiondef()` on the live function |
| 10 | Viewer access rejected | ✅ | Live-verified: `org A viewer cannot call crm_convert_deal (editor-or-above required)` |
| 11 | Cross-org caller rejected | ✅ | Live-verified: `user B (no org membership) cannot call crm_convert_deal on org A's deal` |
| 12 | RPC grants limited correctly | ✅ | `revoke all ... from public/anon; grant execute ... to authenticated` (84425:L106-108); hardening migrations use `create or replace`, which doesn't reset grants |
| 13 | `SECURITY DEFINER` safe `search_path` | ✅ | `set search_path = ''`; every table ref is `public.*`-qualified, `auth.uid()` schema-qualified; only bare calls are `pg_catalog` builtins (always resolvable) |
| 14 | Identifiers fully qualified, no ambiguous collisions | ✅ | `select crm_deals.org_id, crm_deals.company_id, crm_deals.stage into ...` and `select crm_companies.brand_id, ... into ...` — the exact fix for the RETURNS TABLE shadowing bug |
| 15 | Activity logging atomic with conversion | ✅ | Same implicit transaction, no inner exception block; confirmed by two independent review passes |
| 16 | `domain → brand_url` mapping correct | ✅ | `nullif(trim(v_company_domain), '')` — only set when non-blank; live-verified `new brand's brand_url copied from crm_companies.domain` |
| 17 | Live function matches checked-in migration | ✅ | `pg_get_functiondef('public.crm_convert_deal(uuid,text)')` fetched live and diffed against the final migration file — **zero logic differences**, only comment wording |
| 18 | Migration history aligned local↔remote | ✅ **fixed this audit** | See §7 |

**No open findings on PR #341.**

---

## 4. PR #337 findings — API and UI layer

| # | Requirement | Result | Evidence |
|---|---|---|---|
| 1 | Only the conversion route can request `won`/`lost` | ✅ | `no-silent-won-lost.test.ts` — source-grep proving exactly one file under `api/crm/**` + `mastra/tools/crm/**` contains a `won`/`lost` literal, and it's `convert/route.ts` |
| 2 | Direct PATCH / agent paths can't bypass | ✅ | `patchDealStage` route rejects terminal stages before touching Supabase (route.ts:40-42 for convert; sibling `stage` route has no won/lost literal per #1) |
| 3 | API auth + org checks correct | ✅ | `getUser()` → 401 if absent; `getCurrentOrgId()` → 403 if no membership; RPC re-derives + re-checks org from the deal row itself (route's own check is documented as "short-circuit only, not source of truth" and verified true by independent silent-failure-hunter pass) |
| 4 | DB errors map to correct HTTP statuses | ✅ | `convert-deal.ts`: `deal not found`→404, `editor or owner`/`not found in org`→403, `already terminal`→409, unrecognized→500 (never forwards raw Postgres text); the one theoretically-reachable gap (`decision must be won or lost`→ falls to 500) is dead code since `route.ts` validates decision before calling `convertDeal` |
| 5 | Cross-org data-integrity failures logged | ✅ **fixed this session** | `convert-deal.ts` now does `console.error("[crm/convert-deal] rejected cross-org company:", message)` specifically for the `not found in org` case — was previously silent, found by an independent silent-failure-hunter pass, fixed with a matching test |
| 6 | Successful `won` immediately carries `brandId` | ✅ | `handleApprove` calls `onStageChange(result.stage, result.brandId)` from the server response, before `router.refresh()` — test: `Approve on Won POSTs /convert and calls onStageChange + router.refresh on a server-confirmed success` |
| 7 | `WonBanner` never shows stale/misleading copy | ✅ | Copy changed from "pending IPI-367" to "Won — no brand linked" / "This deal was marked won without creating a brand link" — accurate now that `crm_convert_deal` always creates/links a brand on won, so a null `companyBrandId` is a legacy-data signal, not a missing-feature signal |
| 8 | Escape before submission cancels normally | ✅ | Test: `Escape closes the approval gate, same as Cancel` |
| 9 | Escape during in-flight approval does not dismiss | ✅ **fixed this session** | Root cause: `handleTrapKeyDown` called `handleCancel()` unconditionally, bypassing the `disabled={approving}` guard that only protected button clicks. Fixed at the single choke point: `handleCancel` now no-ops while `approving`. Test: `Escape during an in-flight approve does NOT close the dialog — the request is already committed` |
| 10 | Cancel disabled during submission | ✅ | `disabled={approving}` on the button (pre-existing) + defensive `handleCancel` guard (new) + test: `clicking the disabled Cancel button while approving does not dismiss the dialog` |
| 11 | Double-click cannot submit twice | ✅ | `handleApprove` re-guards `if (!pending \|\| approving) return;`; test: `double-clicking Approve sends only one convert request` — asserts `fetchMock` called exactly once |
| 12 | Failed requests produce no optimistic state change | ✅ | Test: `Approve on Won never optimistically succeeds — a failed convert shows an honest error and reverts` — `onStageChange` never called on failure |
| 13 | Failure allows retry | ✅ | Test (new): `a failed approve permits retry — Won can be reopened and re-approved` — second attempt succeeds, `fetchMock` called twice |
| 14 | Success calls `onStageChange` exactly once | ✅ | Verified in the double-click test — `onStageChange` called exactly once even with two click events |
| 15 | Accessibility / focus behavior correct | ✅ | `useEffect` focuses Cancel on open; two-element focus trap (Tab/Shift+Tab between Cancel↔Approve) unaffected by the fix — Escape guard is orthogonal to focus handling |
| 16 | Component state can't diverge from confirmed server response | ✅ | `deal-detail-workspace.tsx`: `confirmedBrandId` set synchronously from the RPC response before `router.refresh()`; `brandId = confirmedBrandId !== undefined ? confirmedBrandId : companyBrandId` always prefers the locally-confirmed value — independent silent-failure-hunter pass found no stale-state window |
| 17 | Tests cover real races, not just happy paths | ✅ | 5 new tests added this session specifically target the race: Escape-during-flight, disabled-Cancel-click-during-flight, double-click, retry-after-failure, plus the pre-existing happy/failure-path tests |

**No open findings on PR #337.**

---

## 5. Real-world user journeys

All journeys are traced to a specific passing test or live-verified `verify-rls.mjs` assertion — not asserted from reading code alone.

| Journey | Traced to | Verified |
|---|---|---|
| **A** — Won, no existing brand | `org A editor converts a deal to won, creates a brand` + `crm_companies.brand_id linked to the newly created brand` + `Approve on Won POSTs /convert and calls onStageChange + router.refresh on a server-confirmed success` | ✅ live + component test |
| **B** — Won, existing brand | `converting a second deal on the same company reuses the existing brand, no duplicate` | ✅ live |
| **C** — Lost | `converting a deal to lost returns a null brand_id`; brand block is `if p_decision = 'won'`-gated; UI never renders `WonBanner` when `stage !== 'won'` | ✅ live + component test |
| **D** — Viewer attempts conversion | `org A viewer cannot call crm_convert_deal (editor-or-above required)` → maps to 403 via `editor or owner` substring, not 500; `convert-deal.test.ts`: `maps the org-editor-or-above authorization exception to 403, not 500` | ✅ live + unit test |
| **E** — Cross-org caller | `user B (no org membership) cannot call crm_convert_deal on org A's deal` | ✅ live |
| **F** — Deal references a company in another org | Won: `converting a deal whose company_id belongs to a different org is rejected` + `rejected cross-org won convert writes no crm_activities row` + `rejected cross-org won convert creates no brand`. Lost: `marking a deal lost is also rejected when its company_id belongs to a different org` + `rejected cross-org lost convert writes no crm_activities row` | ✅ live, 5 assertions, added/completed this audit cycle |
| **G** — Approval race (Escape during in-flight) | `Escape during an in-flight approve does NOT close the dialog — the request is already committed`; Sentry auto-resolved the original review thread against fix commit `6d34652c` | ✅ component test + bot-verified proof |
| **H** — Retry after failure | `a failed approve permits retry — Won can be reopened and re-approved` — stage unchanged after failure (`onStageChange` not called), controls re-enabled, second attempt succeeds once | ✅ component test |

---

## 6. Security and RLS audit

Conducted as three independent passes (this session + two specialized subagents run in parallel, blind to each other's findings) plus direct manual verification:

- **Authorization bypass:** none found. `is_org_editor_or_above(v_org_id)` runs against `v_org_id` captured from a locked `SELECT ... FOR UPDATE`, never from a client parameter — no race window between lock and check.
- **search_path hijack:** none possible. `set search_path = ''` + every user-table/function reference is `public.*`/`auth.*`-qualified; remaining bare calls (`now()`, `coalesce`, `format`, etc.) are `pg_catalog` builtins, always resolvable regardless of `search_path`.
- **Concurrent-conversion race:** correctly prevented. Two simultaneous calls on the same deal serialize on the `crm_deals` row lock; the second call re-reads the post-commit `stage` and trips the "already terminal" guard. Same pattern on `crm_companies.brand_id` prevents duplicate brand creation.
- **Silent exception swallowing:** none. No `exception when ... then` block anywhere in the function — every `raise exception` propagates and rolls back the full transaction.
- **RPC exposure:** correctly scoped. `revoke all from public/anon; grant execute to authenticated` — confirmed unmodified by the follow-up hardening migrations (`create or replace` doesn't reset grants).
- **Generic Supabase security advisories** on `crm_*` tables (GraphQL schema exposure, SECURITY DEFINER discoverability via `/rest/v1/rpc/`) are pre-existing, platform-wide `INFO`-level linter hits that apply to virtually every table/function in this project — not new risk introduced by this diff, and the SECURITY DEFINER + `authenticated`-only grant is the intentional, already-reviewed design (documented in the migration's own comments).
- **Route-level auth is correctly non-authoritative.** The route's `getCurrentOrgId()` check only short-circuits a "no org at all" 403; verified there is no window where the route's weaker check would admit a request the RPC's own `is_org_editor_or_above` would also incorrectly allow.

No RLS or security findings remain open.

---

## 7. Migration-history audit

**This was the one real, unresolved risk carried into this audit — now fixed.**

### What was wrong

The live Supabase project's `supabase_migrations.schema_migrations` ledger recorded **five separate applied migrations**:

```
20260712084425  crm_deals_convert_rpc
20260712091149  crm_deals_convert_hardening
20260712091706  crm_deals_convert_hardening_fix_ambiguous_column
20260712094357  crm_deals_convert_reject_cross_org_company
20260712100030  crm_deals_convert_validate_company_org_all_decisions
```

The local repo (as of the previous audit pass) squashed the last four into a single file timestamped `20260712100000_crm_deals_convert_hardening.sql` — a version number that **never existed in the remote ledger**.

### Why this was not a "safe to dismiss because the function body matches" case

The function content *did* match (confirmed via `pg_get_functiondef()`), which is why an earlier pass judged it low-risk. But content matching is not the same as ledger matching:

- A future `supabase db push` from this repo would see local version `20260712100000` as unapplied (it's not in the remote ledger) and attempt to apply it — succeeding harmlessly (the SQL is idempotent `create or replace`), but inserting a **sixth**, redundant ledger entry, permanently diverging local/remote history.
- Any teammate running `supabase db pull` or `supabase migration list --linked` against this project would see 4 remote-only versions the local repo doesn't have files for.
- **CI cannot catch this.** `supabase-web015` only replays one isolated migration against a fresh Docker Postgres — it has no remote ledger to diverge from, so a squash-vs-ledger mismatch is invisible to every green checkmark in this repo's CI.

### The fix (this audit)

1. Queried `supabase_migrations.schema_migrations.statements` directly (read-only `execute_sql`, no write) to retrieve the **exact SQL Postgres recorded** for each of the four drifted versions.
2. Base64-encoded and losslessly decoded each into its own correctly-named/timestamped file — no manual retyping, zero transcription risk.
3. Deleted the squashed `20260712100000` file.
4. Diffed the reconstructed final-state file against the deleted squashed file: **zero logic differences**, only comment wording and the `comment on function` string.
5. Re-confirmed structural validity of all four new files (balanced `$$` delimiters, one `create or replace function` + one `comment on function` each) and confirmed no duplicate filenames anywhere in `supabase/migrations/`.
6. Committed and pushed to `ipi/367-crm-convert-migration` (`59725d9e`) — **local file changes only, no live database write**.
7. Updated the PR #341 description, which had described the old squashed file, to describe the actual 5-file structure.

### Determination

**Was this a merge blocker?** At the time of the previous audit, this was a **repairable-but-real inconsistency**, not an active data-safety bug — nothing was broken today, but it was a landmine for the next `db push`. It is now **fully repaired** and verified content-identical to the live ledger. **No longer blocks PR #341.**

---

## 8. Testing and CI evidence

| Command | Worktree | Result |
|---|---|---|
| `npm run typecheck` | `wt-ipi-367-crm-won-lost-gate/app` | ✅ clean, no errors |
| `npm run lint` | `wt-ipi-367-crm-won-lost-gate/app` | ✅ clean, no errors |
| `npm test` | `wt-ipi-367-crm-won-lost-gate/app` | ✅ 153 test files, **1178 passed**, 8 skipped, 0 failed |
| `npm run build` | `wt-ipi-367-crm-won-lost-gate/app` | ✅ production build succeeds, all routes compiled including `/api/crm/deals/[id]/convert` |
| `~/.nvm/.../v22.23.1/bin/node scripts/verify-rls.mjs` | `wt-ipi-367-crm-won-lost-gate` (live project) | ✅ **154 assertions, 0 failures**, all ephemeral test fixtures cleaned up (confirmed — no `warn:` lines, all `cleaned up user X` lines present) |

**CI status (live, at time of writing):**

| PR | Head SHA | Checks |
|---|---|---|
| #337 | `6d34652c` | app-build ✅ · booking-gate ✅ · booking-gate-check ✅ · supabase-web015 ✅ · Codacy ✅ · CodeRabbit ✅ · Seer ✅ · Vercel (both) ✅ — **all green** |
| #341 | `59725d9e` | Codacy ✅ · CodeRabbit ✅ · booking-gate-check ✅ · supabase-web015 ✅ · booking-gate ✅ · Vercel ✅ · app-build/Seer confirmed passing on settle — **all green** |

**Review threads:** zero unresolved on either PR. The Escape-race thread on #337 was auto-resolved by the Sentry bot, linked directly to fix commit `6d34652c`. The org-check thread on #341 was previously resolved against fix commit `dfbdbe1d`.

---

## 9. Errors, red flags, failure points, and blockers

| Finding | Severity | Status |
|---|---|---|
| Migration-history ledger drift on #341 | 🟡 Real, repairable | ✅ **Fixed this audit** — see §7 |
| Escape-during-approval dismisses committed request (#337) | 🔴 Real UX/data-integrity bug | ✅ **Fixed** (prior session pass, re-verified here) |
| Cross-org-company 403 not logged server-side (#337) | 🟡 Silent-failure gap | ✅ **Fixed** (prior session pass, re-verified here) |
| `verify-rls.mjs`'s `crm_convert_deal` coverage lives in #337, not #341 | ⚪ Process note, not a defect | Documented — see §11 |
| `verify-rls.mjs` is not wired into CI | ⚪ Coverage gap, not a defect | Documented — see §11 |

**No open blockers on either PR.**

---

## 10. Critical fixes (this audit + prior session, all verified)

1. **[#337]** `handleCancel` now no-ops while `approving`, closing the Escape-during-in-flight-approval race — the single choke point both Escape and the (already-disabled) Cancel button route through.
2. **[#337]** `handleApprove` re-guards against re-entrancy (`if (!pending || approving) return;`).
3. **[#337]** `convert-deal.ts` now logs the cross-org-company 403 case server-side, distinct from a routine permission denial.
4. **[#341 via #337's verify-rls.mjs]** Added the two missing atomicity assertions (no `crm_activities` row, no brand) on rejected cross-org converts.
5. **[#341]** Reconciled local migration files with the live ledger — 4 files replacing 1 squashed file, content pulled directly from the ledger, zero manual transcription.
6. **[#341]** Updated the PR description to match the corrected file structure.

---

## 11. Missing items

- `scripts/verify-rls.mjs` is not run in CI — it's a manual/local verification step (documented in both PR descriptions with the exact command). The `crm_convert_deal`-specific live-RPC assertions (cross-org rejection, atomicity, idempotency) only run when a human or agent runs this script by hand.
- PR #341, read in isolation, ships no test changes of its own — the RPC-level tests that exercise its migration live in PR #337's `scripts/verify-rls.mjs`. This is intentional (migration/app-code PR separation per `AGENTS.md`'s #1 rule) but means a reviewer looking only at #341's diff won't see its own test coverage.
- No database-level uniqueness constraint on `crm_companies.brand_id` — "one brand per company" is enforced by the RPC's own reuse-existing-brand logic, not a DB constraint. Low risk today (this RPC is the only write path to `crm_companies.brand_id` on the `won` path), but it's an app-level, not schema-level, guarantee.

---

## 12. Suggested improvements (non-blocking)

1. Add a repo norm (CLAUDE.md or a migration-authoring checklist) against squashing multiple already-applied `apply_migration` calls into one local file — always one file per applied version, matching the live ledger exactly.
2. Wire the `crm_convert_deal`-specific assertions in `verify-rls.mjs` into CI (gated on `SUPABASE_SERVICE_ROLE_KEY` secret availability), so a future regression here is caught automatically rather than requiring a manual run.
3. Consider a partial unique index (`crm_companies(brand_id) where brand_id is not null`) as schema-level defense-in-depth against a hypothetical future second write path to that column.

---

## 13. Per-PR score table

| Area | PR #341 | PR #337 | Evidence | Status |
| --- | ---: | ---: | --- | :---: |
| Security | 95/100 | 95/100 | §6 — no bypass found; SECURITY DEFINER is intentional, justified, correctly grant-scoped | 🟢 |
| Data integrity | 98/100 | 95/100 | §3 items 1-8, §4 items 4-6, 12, 16 — locking, atomicity, no stale state, all live-verified | 🟢 |
| Tests | 85/100 | 97/100 | §8, §11 — coverage is comprehensive but lives cross-PR; not wired into CI | 🟢/🟡 |
| UX correctness | N/A | 95/100 | §4 items 7-15, §5 journeys D/G/H | 🟢 |
| Migration safety | 95/100 | N/A | §7 — real drift found and fully repaired this audit | 🟢 |
| Production readiness | 95/100 | 96/100 | §8, §9 — CI green, no blockers, zero unresolved threads | 🟢 |

---

## 14. Overall percent correct

**95%.** Every functional, security, and data-integrity requirement in the spec is met and evidenced against live state, not just static reading. The 5-point deductions are for process/coverage gaps (§11) that are real but non-blocking — not for any confirmed defect left unfixed.

---

## 15. Will each PR succeed?

**Yes, both.** #341 deploys nothing new (its content is already live) and is now ledger-consistent, so merging it is a pure history-alignment operation with no runtime risk. #337 is fully tested end-to-end (unit, integration, live-DB) with CI green on the exact head commit.

---

## 16. Is each PR production-ready?

**Yes, both, per the evidence in §3, §4, §6, §8.** No open findings remain on either PR at time of writing.

---

## 17. Exact corrections required before merge

**None.** All corrections identified during this and the prior audit pass have already been applied, tested, committed, and pushed:
- #337: `6d34652c`
- #341: `59725d9e`

---

## 18. Final merge order recommendation

**Merge #341 before #337.**

Rationale: #341 makes no live database change (the function is already deployed and matches this PR exactly) — it only aligns the repo's migration history with what's already true in production. #337 adds the application code that calls a function which must already exist in the way `types/supabase.ts` and `convert-deal.ts` expect. Merging the migration-history PR first keeps the repo's git history causally honest (schema before consumer), even though — practically — merge order has zero runtime effect here since nothing new is being deployed by either PR.

- **PR #341: MERGE**
- **PR #337: MERGE**
- **Required merge order:** #341 → #337
- **Remaining blockers:** none
- **Overall confidence:** **95%**

Neither PR was merged as part of this audit, per instructions.
