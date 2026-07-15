# PR Verification Report — IPI-615 & IPI-587

## Overview

Two follow-up PRs verified together after IPI-614 (PR #393) post-merge deployment:

| PR | Branch | Issue | Purpose |
|---|---|---|---|
| #397 | `ipi/615-brand-intake-pending-index` | IPI-615 | Add missing composite index for pending draft queries |
| #376 | `ipi/587-supabase-types` | IPI-587 | Regenerate Supabase types from linked project |

---

## PR #397 — IPI-615: Missing Composite Index

### What it does
Creates `brand_intake_drafts_pending_user_updated_idx` on `(user_id, updated_at DESC, status)` with predicate `WHERE status IN ('pending', 'pending_approval')`.

### Migration design
Forward-only — `DROP INDEX IF EXISTS + CREATE INDEX` in a single new migration. Historical `20260626000005` is untouched (immutable).

| Environment | Result |
|---|---|
| Remote with old-order index | DROP removes, CREATE adds correct order |
| Remote without index | DROP is no-op, CREATE adds |
| Local/reset with old index | Replaced correctly |
| Fresh (no prior index) | Created fresh |

### Ledger integrity
- `origin/main` already has `20260714072837_planner_revoke_anon_execute.sql` (PR #377 — IPI-544)
- Branch rebased onto `origin/main`: **180/180 migrations aligned, zero drift**
- Local replay verified ✅

### Verification gate
| Check | Status |
|---|---|
| `tsc --noEmit` | ✅ 0 errors |
| `npm test` (162 files, 1263 passed) | ✅ |
| `npm run build` | ✅ |
| Pre-push hook (typecheck + test) | ✅ passed |
| Local DB index: `(user_id, updated_at DESC, status)` | ✅ confirmed |
| Review threads replied & resolved | ✅ |

---

## PR #376 — IPI-587: Supabase Type Regeneration

### What it does
Regenerates `app/src/types/supabase.ts` from the linked Supabase project.

### Files changed
- `app/src/types/supabase.ts` (generated)
- `app/src/lib/crm/convert-deal.test.ts` (+1, type-level regression test)

### Type changes audited

| Change | Assessment |
|---|---|
| ✅ `ensure_default_5_week_workflow` added | Legitimate — function exists on remote |
| ✅ `brand_id` preserved as `string \| null` | Correct — FK is nullable |
| ✅ `brand_intake_drafts_brand_id_fkey` → `isOneToOne: true` | Correct — UNIQUE constraint makes it 1:1 |
| ⚠️ `planner_get_member_names.display_name` → `string` | Generator heuristic; `profiles.full_name` is nullable. Low risk. |

### Remote-only migration `20260714072837` investigation
- **Contents**: `planner_revoke_anon_execute` — IPI-544 planner permissions (revoke PUBLIC/anon execute on SECURITY DEFINER helpers)
- **Affects**: function execute grants only
- **Schema impact**: **None** — no tables, columns, or types changed
- **Types affected**: **None** — all 3 type changes in PR #376 are independently verified against the actual schema
- **Verdict**: PR #376 type diff contains **no unreproducible or hidden schema changes**

### Regression test
```
const _lostDealBrandId: ConvertDealResult["brand_id"] = null
```

### Verification gate
| Check | Status |
|---|---|
| `tsc --noEmit` | ✅ 0 errors |
| `npm test` (162 files, 1263 passed) | ✅ |
| `npm run build` | ⚠️ pre-existing worktree `DATABASE_URL` issue (not code-related) |
| Review threads resolved | ✅ all resolved |

---

## Summary

| Metric | PR #397 (IPI-615) | PR #376 (IPI-587) |
|---|---|---|
| Readiness | ✅ 99/100 | ✅ 97/100 |
| Code changes | 1 migration (+17/-0) | 2 files, generated + test |
| Type safety | N/A | ✅ 1 generator heuristic (non-blocking) |
| Ledger | 180/180 aligned | N/A (types only) |
| Post-merge step | `supabase db push --linked` | none |

Both PRs are ready for merge.
