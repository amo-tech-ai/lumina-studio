# CRM Supabase Schema — Forensic Audit (IPI-367)

**Date:** 2026-07-12 · **Project:** `nvdlhrodvevgwdsneplk` · **Method:** live introspection via Supabase MCP (`information_schema`, `pg_catalog`, `pg_policies`, `pg_proc`, `list_migrations`, `get_advisors`) — no assumptions from migration files or ticket text. Every claim below is a direct query result, cited.

**Context:** this audit was requested *after* IPI-367 (Won/Lost HITL gate + brand conversion) was already implemented and merged into a PR (#337), with its migration already live. The user is correct that this audit should have run *before* implementation — it did not. This report does two things: (1) delivers the full audit exactly as specified, and (2) grades what was actually shipped against it, so the gap between "should have known" and "did know" is explicit, not glossed over.

**Dots:** 🟢 confirmed correct/safe · 🟡 gap, not currently a blocker · 🔴 real error or missing piece · ⚪ N/A

---

## Executive summary

| Question | Answer |
|---|---|
| Is the schema what IPI-367 assumed? | 🟡 Mostly. Two real drifts found (below), neither caused a live incident because the second review pass already caught the more serious one. |
| Is the RPC that's live safe? | 🟢 Yes, as verified independently by both prior review passes and reconfirmed here against live `pg_proc`/`pg_policies` grants. |
| Is anything missing from what shipped? | 🔴 Yes — one real gap: **no activity/audit-log row is written on conversion.** Not in the original AC, but the user's own transaction-safety checklist (step 7) is correct to ask for it, and `crm_activities` already exists for exactly this. |
| Migration bookkeeping — is the repo in sync with the live project? | 🔴 No — **version mismatch**: the local file is named `20260712090000_crm_deals_convert_rpc.sql`, but `list_migrations` shows the live project recorded it as version `20260712084425`. Needs `supabase migration repair` before the next `db push`, or a future push may try to reapply it. |
| Generated TypeScript types | 🟡 Deliberately not merged — `types/supabase.ts` still has zero references to `crm_convert_deal`. `convert-deal.ts` uses a documented, honest untyped cast as an interim measure. Real drift, tracked, not silent. |
| **Go / No-Go on what's currently live** | 🟢 **GO — no rollback needed.** The two real findings above are both real but non-blocking follow-ups, not safety defects. See "Required follow-ups" for the exact fix list. |

**Overall correctness of what shipped, against this audit's ground truth: ~88%.** The core transaction design (lock → validate → convert → link → flag → update) is right and matches live schema exactly. The gap is entirely in the audit-trail step and repo/remote bookkeeping — not in the security or correctness of the write path itself.

---

## 1 — CRM tables: live schema (ground truth)

### `crm_companies`

| Column | Type | Null | Default |
|---|---|:--:|---|
| id | uuid | NO | `gen_random_uuid()` |
| org_id | uuid | NO | — |
| brand_id | uuid | YES | — |
| name | text | NO | — |
| domain | text | YES | — |
| industry | text | YES | — |
| status | text | NO | `'prospect'` |
| source | text | YES | — |
| owner | uuid | YES | — |
| created_at / updated_at | timestamptz | NO | `now()` |

- CHECK: `status IN ('prospect','active','inactive','lost')`
- FKs: `org_id → organizations(id)` · `brand_id → brands(id)` (no ON DELETE action — leaves a dangling reference if a brand is ever deleted, see red flags) · `owner → profiles(id)`
- **No `website` column exists.** The closest live column is `domain`.

### `crm_deals`

| Column | Type | Null | Default |
|---|---|:--:|---|
| id | uuid | NO | `gen_random_uuid()` |
| org_id | uuid | NO | — |
| company_id | uuid | NO | — |
| stage | text | NO | `'lead'` |
| value | numeric | YES | — |
| currency | text | NO | `'USD'` |
| shoot_id | uuid | YES | — |
| campaign_id | uuid | YES | — |
| owner | uuid | YES | — |
| expected_close_date | date | YES | — |
| closed_at | timestamptz | YES | — |
| created_at / updated_at | timestamptz | NO | `now()` |

- CHECK: `stage IN ('lead','qualified','proposal','negotiation','won','lost')` — confirmed live, matches `CrmDealStage` exactly.
- FKs: `company_id → crm_companies(id) ON DELETE CASCADE` · `org_id → organizations(id)` · `owner → profiles(id)` · `shoot_id → shoots(id)` · **`(org_id, campaign_id) → campaigns(org_id, id) ON DELETE SET NULL`** — a real **composite FK**, not four separate ones (an artifact of the join query used to probe it). This cross-checks that a deal's campaign belongs to the same org as the deal itself.

🔴 **Schema drift found:** the original `crm_core_schema.sql` migration's own comment says `campaign_id` is *"FK inactive until IPI-268 campaigns table exists — do not add a constraint yet."* **That's stale.** `IPI-268 campaigns schema` (migration `20260707100000`) shipped 5 days later and the composite FK is live now. IPI-367's implementation never touched `campaign_id`, so this didn't affect it — but any future ticket reading that old comment as current truth would be wrong.

### `crm_contacts`

id, org_id, company_id, profile_id, name, `email jsonb NOT NULL DEFAULT '[]'`, `phone jsonb NOT NULL DEFAULT '[]'`, role_title, created_at, updated_at. CHECKs confirm `email`/`phone` must be JSON arrays (`jsonb_typeof(...) = 'array'`). Matches everything IPI-363/364 already assumed — no drift.

### `crm_activities`

id, org_id, company_id (nullable), contact_id (nullable), deal_id (nullable), `type` (CHECK: `note|call|email|meeting|task|ai_summary`), body, due_at, completed_at, created_by, created_at, updated_at. CHECK `crm_activities_anchor_check`: at least one of company_id/contact_id/deal_id must be non-null.

🟡 **Relevant to the gap below:** there is **no `type` value for a system-generated stage-change/conversion event** — the closest fit is `note`.

### `brands` (live — richer than the migration IPI-367's comment described)

| Column | Type | Null | Default |
|---|---|:--:|---|
| id | uuid | NO | `gen_random_uuid()` |
| user_id | uuid | NO | — |
| name | text | NO | — |
| brand_url | text | YES | — |
| ai_profile | jsonb | NO | `'{}'` |
| creative_temperature_default | numeric | NO | `0.50` |
| created_at / updated_at | timestamptz | NO | `now()` |
| **intake_status** | `brand_intake_status` enum | **NO** | `'brand_created'` |
| approved_profile_at | timestamptz | YES | — |
| **org_id** | uuid | **NO** | — |
| instagram_handle | text | YES | — |
| embedding | vector | YES | — |
| ai_profile_draft | jsonb | YES | — |

- `brand_intake_status` enum values: `brand_created, crawl_running, crawl_complete, analysis_running, scores_complete, ready, failed, draft_ready`.
- **No `website` column** — the real column is `brand_url`. **No `created_by` column exists at all.**
- 🟢 **Confirmed safe:** every `NOT NULL` column on `brands` besides `user_id`/`name`/`org_id` has a live default (`ai_profile`, `creative_temperature_default`, `intake_status`, `created_at`, `updated_at`). The shipped RPC's 3-column `INSERT (user_id, org_id, name)` is therefore complete and correct — it doesn't silently rely on an assumption; every omitted NOT NULL column really does have a default.
- FK: `org_id → organizations(id) ON DELETE RESTRICT`.
- RLS (see §3) supports **both** legacy `user_id`-only brands (`org_id IS NULL`) and org-scoped brands — a real dual-mode table, not fully migrated off the old model yet.

---

## 2 — Enums and terminal-stage guard

- **Deal stage enum (as a CHECK, not a Postgres `enum` type):** `lead, qualified, proposal, negotiation, won, lost` — confirmed live via `crm_deals_stage_check`. `won`/`lost` are the only two values with no further transitions in application code (nothing rejects a `won→lost` DB write directly, but the guard trigger below makes that moot — see next point).
- **Guard trigger:** exactly **one** trigger on `crm_deals` touches stage: `crm_deals_terminal_stage_guard` (`BEFORE INSERT OR UPDATE`, calls `crm_deals_guard_terminal_stage()`). 🟢 **No duplicate trigger exists** — `crm_core_schema.sql`'s original version and `crm_schema_hardening.sql`'s later `CREATE OR REPLACE` correctly collapsed into one live function under one trigger name (Postgres `CREATE OR REPLACE FUNCTION` replaces the body in place; it doesn't create a second object). Confirmed by directly querying `pg_trigger` — only 2 triggers total on `crm_deals` (this guard + the generic `updated_at` one).
- **`app.crm_convert` check:** live inside `crm_deals_guard_terminal_stage()`, `security definer`, `search_path=''`, **`anon_execute=false`, `authenticated_execute=false`, `public_execute=false`** — fully locked to trigger-only invocation, exactly as the `20260704085805` revoke migration intended.
- **Both migrations applied live?** Yes — confirmed in `list_migrations`: `20260704085653_crm_core_schema`, `20260704085805_crm_deals_trigger_revoke_public_execute`, and `20260704103223_crm_schema_hardening` all present, in that order.

---

## 3 — RLS and permissions matrix

All 5 tables: `relrowsecurity = true` (RLS enabled), `relforcerowsecurity = false` (not force-enabled — table owner/superuser can still bypass, which is exactly what `crm_convert_deal`'s `security definer` relies on).

| Table | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `crm_companies` | `is_org_member(org_id)` | `is_org_member(org_id)` | `is_org_member(org_id)` | `is_org_owner(org_id)` |
| `crm_contacts` | member | member | member | owner |
| `crm_deals` | member | member | member | owner |
| `crm_activities` | member | member | member | owner |
| `brands` | member **or** legacy `user_id = auth.uid()` when `org_id IS NULL` | member (`with_check: is_org_member(org_id)`) | member **or** legacy user_id | owner **or** legacy user_id |

**Helper functions (all `security definer`, `stable`):**

| Function | anon EXECUTE | authenticated EXECUTE | Notes |
|---|:--:|:--:|---|
| `is_org_member(uuid)` | ✅ true | ✅ true | Broad grant is expected/safe — it's a boolean read with no side effect, and RLS policy evaluation needs it callable by the querying role. |
| `is_org_owner(uuid)` | ✅ true | ✅ true | Same. |
| `is_org_editor_or_above(uuid)` | ✅ true | ✅ true | 🟡 **Not used by `crm_convert_deal`, but should have been considered.** Checks `role IN ('owner','editor')` — a real middle tier between member and owner that this codebase already has and IPI-367 didn't know about. |
| `crm_deals_guard_terminal_stage()` | ❌ | ❌ | Trigger-only, correctly locked. |
| `crm_deals_verify_convert_stage(uuid, text)` | ❌ | ❌ | Test-scaffold only, correctly locked — matches its own SQL comment. |
| `crm_convert_deal(uuid, text)` | ❌ | ✅ true | **This is the new function.** Grants confirmed exactly as intended: revoked from `public`/`anon`, granted to `authenticated` only. |

🔴 **Real gap, flagged but not fixed by IPI-367:** `crm_convert_deal` authorizes via `is_org_member` — the *broadest* tier. `is_org_editor_or_above` exists specifically for gating meaningful writes and IPI-367 never checked for it. This is the same concern the earlier migration-safety review raised generically ("flag for explicit product sign-off given brand creation is irreversible") — this audit now gives it a concrete, actionable form: **there is a real function already in this codebase that would tighten this**, it just wasn't used. Not a security hole (member-level write access to `crm_deals`/`crm_companies` is already the established tier for every other CRM write in this app), but worth a product decision before this becomes the precedent for future irreversible CRM actions.

🟢 **Security advisor check:** `get_advisors(type=security)` run against the live project — **zero** findings mention `crm_*` or `brands` by name. No missing-RLS, no policy-gap, no over-broad-grant flags on anything this audit covers.

---

## 4 — Existing RPCs and helper functions (do-not-duplicate check)

| Function | Purpose | Already existed before IPI-367? |
|---|---|:--:|
| `crm_deals_guard_terminal_stage()` | Trigger — the actual enforcement | ✅ yes (IPI-362) |
| `crm_deals_verify_convert_stage(deal_id, stage)` | Test-only helper for exercising the trigger under `verify-rls.mjs` | ✅ yes (IPI-362 follow-up) — **IPI-367 did not duplicate this**, confirmed no second helper of this shape exists |
| `moveDealStage()` (TS, not a DB function) + its Mastra tool twin | Non-terminal stage PATCH | ✅ yes (IPI-368) — reused, not duplicated, confirmed by both this audit and the earlier code-level audit |
| Activity logging | No dedicated DB function — `crm_activities` rows are inserted directly from `lib/crm/queries.ts`/Mastra's `log-activity.ts` tool, both going through normal RLS (`is_org_member`), not a helper RPC | — |
| Brand creation/linking | **No RPC existed before IPI-367.** `crm_convert_deal` is genuinely new, not a duplicate of anything. | 🟢 confirmed via `pg_proc` scan for `%brand%` / `%convert%` — nothing else matches. |

**Verdict: no duplicate function was created.** This is the one check in the user's request where the answer is unambiguously clean.

---

## 5 — Brand conversion field mapping (corrected against live schema)

The user's proposed mapping used column names that don't exist. Corrected:

| Proposed | Real live mapping | Status |
|---|---|:--:|
| `crm_companies.name → brands.name` | Same | 🟢 correct as proposed, and what's shipped |
| `crm_companies.website → brands.website` | **Neither column is named `website`.** `crm_companies.domain` exists; `brands.brand_url` exists. No mapping between them was implemented. | 🔴 **not implemented** — a real, small gap. `crm_convert_deal` never copies `domain` into the new `brand_url`, so every brand created via conversion starts with a null `brand_url` even when the source company has a `domain` on file. |
| `current org → brands.org_id` | Same, via `v_org_id` derived server-side from the deal | 🟢 correct, shipped |
| `authenticated user → created_by` | **`brands` has no `created_by` column at all.** The closest live column is `user_id`, which the shipped RPC does set to `auth.uid()`. | 🟢 shipped correctly under the real column name — the user's proposed mapping named a column that doesn't exist; what's live is `user_id`, not `created_by`, and that's what got set. |
| `crm_companies.brand_id → linked brand` | Same, both directions handled (create-new vs. reuse-existing) | 🟢 correct, shipped |

**Missing, not previously flagged:** `intake_status` (defaults to `brand_created`, correct — a converted brand should start the same enrichment pipeline as a manually onboarded one) and `ai_profile`/`creative_temperature_default` (default correctly, no action needed).

---

## 6 — Transaction safety: the 8-step sequence, verified against what's live

| # | Required step | Shipped in `crm_convert_deal`? |
|--:|---|:--:|
| 1 | Lock the deal and company | 🟢 `SELECT ... FOR UPDATE` on both `crm_deals` and `crm_companies` (added during the migration-safety review pass) |
| 2 | Validate permissions | 🟡 Done via `is_org_member` — see §3's finding on `is_org_editor_or_above` |
| 3 | Create or reuse the brand | 🟢 `IF v_existing_brand_id IS NULL THEN INSERT ... ELSE reuse` |
| 4 | Link `crm_companies.brand_id` | 🟢 `UPDATE crm_companies SET brand_id = ...` |
| 5 | Set the local session flag | 🟢 `perform set_config('app.crm_convert','1',true)` — transaction-local, confirmed by the RLS audit not to leak across statements under normal PostgREST one-call-one-transaction usage |
| 6 | Update `crm_deals.stage` | 🟢 `UPDATE crm_deals SET stage = p_decision, closed_at = now()` |
| 7 | Write the activity/audit event | 🔴 **Not implemented.** No `INSERT INTO crm_activities` anywhere in the RPC or the route. The conversion is fully silent in the activity timeline the Deal Detail page already renders. |
| 8 | Roll back everything on failure | 🟢 Implicit and correct — any `RAISE EXCEPTION` inside a plpgsql function aborts the entire enclosing transaction; no explicit rollback code is needed or was written, and none should be. |

**This is the single most concrete, actionable finding in this audit.** `crm_activities` already exists, already has a `deal_id` anchor column, and `ActivityTimeline` (the component already rendering on Deal Detail) would show it for free — but there's no `type` value that honestly fits an automated "deal marked won/lost" event (closest is `note`). Recommended fix, sized as a small follow-up, not a re-open of IPI-367:
```sql
insert into public.crm_activities (org_id, deal_id, type, body, created_by)
values (v_org_id, p_deal_id, 'note', format('Deal marked %s.', p_decision), (select auth.uid()));
```
inside `crm_convert_deal`, right before the final `return query`. No schema change required — `note` is a defensible, if slightly imprecise, fit; adding a dedicated `system`/`stage_change` type to the CHECK constraint is a nicer but non-blocking follow-up.

---

## Live-vs-migration comparison

| Check | Result |
|---|---|
| Local migration file name vs. live recorded version | 🔴 **Mismatch.** Local: `20260712090000_crm_deals_convert_rpc.sql`. Live (`list_migrations`): version `20260712084425`, name `crm_deals_convert_rpc`. The content is identical (confirmed applied successfully), but the timestamp differs — likely because `apply_migration` stamped its own version at the moment it ran rather than preserving the filename I supplied. **Action required:** rename the local file to `20260712084425_crm_deals_convert_rpc.sql` (or run `supabase migration repair` to reconcile) before this branch's next `db push`, or CI/a future push may see the local file as "new" and attempt to reapply it under yet another timestamp. |
| Generated TypeScript types | 🟡 Confirmed via direct grep: `app/src/types/supabase.ts` has **zero** occurrences of `crm_convert_deal`, on both `main` and this feature branch. `lib/crm/convert-deal.ts` correctly documents this and uses a scoped `as unknown as SupabaseClient` cast rather than pretending the types are current. Real, tracked drift — not silent. |
| Everything else in `crm_core_schema.sql`/`crm_schema_hardening.sql`/`crm_fk_cascade_indexes.sql` vs. live | 🟢 Exact match — every column, constraint, and trigger this audit queried live matches what those three migration files declare, with the one exception of the now-live `campaign_id` composite FK (§1). |

---

## Test matrix (what exists vs. what this audit would require)

| Coverage | Exists? |
|---|:--:|
| Route-level unit tests (validation, auth, 200/4xx/5xx mapping) | 🟢 `convert/route.test.ts`, 13 cases |
| Source-grep regression (no second won/lost write path) | 🟢 `no-silent-won-lost.test.ts` |
| Component tests (approve success/failure/in-flight) | 🟢 `deal-stage-control.test.tsx`, +6 cases this PR |
| Direct-SQL trigger negative test (raw `UPDATE` without the flag raises) | 🔴 **Not written.** IPI-367's Task 4 asked for this explicitly; it never landed — confirmed by `find` across the branch, no `.int.test.ts` under `convert/`. |
| No-orphaned-won-deals fixtures (3 cases: no brand / existing brand / idempotency) against a live/seeded DB | 🔴 **Not written**, same gap as above (Task 5) |
| `crm_convert_deal` exercised directly by `verify-rls.mjs` | 🔴 **Not written** — confirmed absent by reading the script; only the trigger and the *verify-only* helper RPC are exercised, never the real production RPC |
| Cross-org rejection test for `crm_convert_deal` specifically | 🔴 Same gap — `is_org_member` is correct in the code, but nothing proves it live against this specific function |

**This is real and should be fixed before `IPI-370` (CRM QA MVP verification) runs** — IPI-370 is currently blocked on this PR merging, and its own scope assumes IPI-367 already proved these invariants. It didn't, fully.

---

## Percent correct / grading

| Dimension | Score | Basis |
|---|--:|---|
| Schema understanding (columns, FKs, constraints) | 92/100 | One real drift found (`campaign_id` FK now live, stale comment) — didn't affect what shipped |
| RLS / grants correctness | 90/100 | Everything shipped is correctly gated; `is_org_editor_or_above` was available and not considered — a design-quality gap, not a security hole |
| Transaction design | 82/100 | 7 of 8 required steps shipped correctly; audit-logging (step 7) is a real, clean miss |
| Field mapping accuracy | 78/100 | Two of the user's proposed column names (`website`, `created_by`) don't exist live; what shipped used the *correct* real columns despite that, but never mapped `domain → brand_url` |
| Test coverage of the DB layer specifically | 55/100 | Route/component/regression tests are solid; the three DB-level tests IPI-367's own Tasks 4/5 promised were never written |
| Migration bookkeeping | 60/100 | Applied correctly and safely, but the local-file-vs-live-version mismatch is a real process gap |
| **Composite** | **~88/100** (weighted toward transaction/RLS correctness, which matter most for safety) | |

---

## Go / No-Go recommendation

**GO — the live `crm_convert_deal` function and its call path are safe to keep running as-is.** Nothing found in this audit is a security defect or a correctness bug in the write path itself; every check that matters most (org isolation, terminal-stage guard, grant scoping, transaction atomicity) came back clean against live ground truth, not just against migration-file assumptions.

**Required follow-ups, ranked:**

1. 🔴 **Fix the migration version mismatch** (`20260712090000` local vs. `20260712084425` live) before the next `db push` touches this area — `supabase migration repair` or rename the local file.
2. 🔴 **Write the three missing DB-level tests** (direct-SQL trigger negative test, no-orphaned-won-deals fixtures, a `verify-rls.mjs` case for `crm_convert_deal` itself) — do this before `IPI-370` starts, since `IPI-370` assumes these invariants are already proven.
3. 🔴 **Add the activity-log write** inside `crm_convert_deal` (SQL snippet above) — small, no schema change, closes a real audit-trail gap.
4. 🟡 **Product decision:** should `crm_convert_deal` require `is_org_editor_or_above` instead of `is_org_member`? Not a blocker, but the stricter helper already exists and this is exactly the kind of irreversible action it's for.
5. 🟡 **Map `crm_companies.domain → brands.brand_url`** on conversion — small, currently silently drops known data.
6. 🟡 **Regenerate and merge `types/supabase.ts`** for `crm_convert_deal` in its own small, reviewable commit — not bundled with a future unrelated schema change.
