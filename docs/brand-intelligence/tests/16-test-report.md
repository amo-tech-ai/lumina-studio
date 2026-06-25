# IPI-46 · IPI-BI-P0 — Onboarding Orchestration & Profile Persistence

**Date:** 2026-06-25  
**Branch:** `ipi/ipi-46-onboarding-orchestration`  
**Auditor:** Cursor Agent (QA per `15-test-prompt.md`)  
**Linear:** IPI-46 · Fix Brand Onboarding Orchestration and Profile Persistence

---

## VERDICT: **PASS**

Onboarding creates one org-linked brand shell, invokes `brand-intelligence` with `brandId`, merges `ai_profile`, upserts four base scores on the same brand, and Brand Hub derives DNA readiness from the base-four average. Remote Supabase deployed and verified.

---

## 1. Acceptance criteria

| Criterion | Result | Evidence |
|-----------|--------|----------|
| Single brand row after onboarding | ✅ PASS | `createOrgAndBrand` then edge UPDATE (no second insert when `brandId` set) |
| Brand has `org_id` | ✅ PASS | `onboarding.ts` inserts brand with `org_id: org.id` |
| No orphan brand from edge fn | ✅ PASS | Insert path without `brandId` fails RLS; verify uses shell + `brandId`; remote `org_id IS NULL` = 0 |
| `ai_profile` flat fields (tagline, category, brandVoice, contentPillars) | ✅ PASS | Edge builds flat `aiProfile` object; merge preserves shell `industry`/`goal` |
| Four score rows on same `brand_id` | ✅ PASS | Remote verify: `scores=4`; types visual, audience, consistency, commerce_readiness |
| DNA badge = avg of base four (not `dna_readiness` row) | ✅ PASS | `computeDnaScore()` + unit tests ignore legacy `dna_readiness` |
| Analysis failure → error, no redirect | ✅ PASS | `runAnalysis` catch sets `error`, no `router.push` in catch |
| `cd app && npm test` | ✅ PASS | 283/283 |
| `cd app && npm run build` | ✅ PASS | Clean build |

---

## 2. Files inspected

| File | Finding |
|------|---------|
| `app/src/app/(operator)/app/onboarding/page.tsx` | `createOrgAndBrand` → `invokeBrandIntelligence(brandId)` → redirect; errors surfaced |
| `app/src/lib/onboarding.ts` | Shell-only insert; no `dna_readiness`; `invokeBrandIntelligence` sends `brandId` |
| `app/src/app/(operator)/app/brand/[id]/page.tsx` | `computeDnaScore(scores)`; grid when `scores.length >= 1` |
| `app/src/lib/brand-scores.ts` | `BASE_SCORE_TYPES` + average helper |
| `supabase/functions/brand-intelligence/index.ts` | UPDATE merge + `_lifecycle`; upsert `onConflict: brand_id,score_type` |
| `supabase/migrations/20260625000000_brand_scores_unique_update_rls.sql` | UNIQUE index + UPDATE RLS |
| `supabase/migrations/20260624180628_brand_scores_rls_org_member.sql` | Org-scoped SELECT (history sync) |
| `app/src/test/onboarding-orchestration.test.ts` | Orchestration order + merge contract |
| `app/src/test/brand-scores.test.ts` | DNA average + ignores `dna_readiness` |
| `app/src/test/onboarding.test.ts` | Updated for shell flow |
| `app/src/test/brand-hub.test.ts` | Hub uses `computeDnaScore` |
| `scripts/verify-brand-intelligence.mjs` | Shell + `brandId` smoke path |

---

## 3. Commands run

```bash
cd app && npm test          # 283 passed
cd app && npm run build     # pass
rg "dna_readiness" app/src/lib/onboarding.ts   # no matches
rg "brandId" app/src/app/(operator)/app/onboarding/page.tsx   # invoke path
rg "onConflict|brand_scores_update" supabase/functions supabase/migrations
npm run supabase:verify
npm run supabase:verify-rls
npm run supabase:verify-edge
npm run supabase:verify-brand-intelligence
supabase functions deploy brand-intelligence --project-ref nvdlhrodvevgwdsneplk
supabase db push --linked   # Remote up to date
```

---

## 4. Test results

| Suite | Result |
|-------|--------|
| App unit/integration (Vitest) | **283/283 pass** |
| App production build | **Pass** |
| `supabase:verify` | **Pass** |
| `supabase:verify-rls` | **Pass** (incl. brand_scores UPDATE upsert) |
| `supabase:verify-edge` | **Pass** |
| `supabase:verify-brand-intelligence` | **Pass** (merge industry, `_lifecycle=scores_complete`, 4 scores) |

---

## 5. Red flags

| Item | Severity | Notes |
|------|----------|-------|
| Shell left on edge failure | ⚠️ Low | User sees error and stays on wizard; org+brand shell remains (documented in lifecycle SSOT). No orphan `org_id IS NULL`. |
| Edge insert-without-`brandId` | ⚠️ Info | Still in edge fn for legacy callers; fails RLS under org layer — not used by onboarding. |
| Gemini latency | ⚠️ Info | Remote verify ~21–31s for analysis (expected). |

---

## 6. Missing tests

| Gap | Priority |
|-----|----------|
| E2E browser onboarding happy path | Medium (deferred) |
| Playwright: edge failure after shell (assert no redirect) | Medium |
| Edge fn unit test for `mergedProfile` merge | Low |

---

## 7. Remaining risks

- **Partial shell on failed analysis:** User may retry and create duplicate orgs if they resubmit (future: idempotency key or resume flow).
- **Legacy brands** without `brand_url` / pre-IPI-46 profiles unaffected; new onboarding path is correct.

---

## 8. Deployment evidence

- Migration `20260625000000` applied on remote `nvdlhrodvevgwdsneplk`
- `brand-intelligence` edge function deployed
- Indexes: `brand_scores_brand_id_score_type_uidx` present
- RLS: `brand_scores_update_via_brand` present

---

**Final verdict: PASS** — Ready for PR merge pending code review.
