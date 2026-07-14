Now implementing. Writing the corrected webhook logic with the insert/update FK-safety split, campaign resolution, and effective-brand-id propagation.

Now the core `upsertAssetRecord` rewrite — the insert/update FK-safety split:

Now updating `handleUpload` to use the new resolver and propagate `effectiveBrandId`:

The implementation looks correct. Now updating the test file with the mock additions and new test cases.

Now updating `beforeEach` defaults and the existing tests whose mocked data shape changed (select now returns `brand_id` too), then adding the new test cases.

Now adding the new test cases at the end of the describe block:

Fresh worktree needs `node_modules`. Installing first.

All 22 tests pass (16 original + 6 new). Now typecheck and lint on the changed files.

Clean typecheck. Now lint on the two changed files.

Lint clean too. Checking nothing else references the removed `brandIdFromFolder` function before running the full suite.

All 150 test files pass (1131 tests, 8 skipped, 0 failed). Now lint on the whole repo and a production build check, then commit and push.

Clean. Committing and pushing.

Pre-push gate passed clean (typecheck + full suite, no bypass needed). Opening the PR.

PR is up: **[#329](https://github.com/amo-tech-ai/lumina-studio/pull/329)**. Linking it on the Linear issue and moving to In Review.

## Summary

**IPI-513 implemented and shipped as [PR #329](https://github.com/amo-tech-ai/lumina-studio/pull/329)**, Linear moved to In Review.

Changes to `app/src/app/api/assets/cloudinary/webhook/route.ts`:
- Added campaign-folder resolution (`ipix/campaigns/{uuid}` → `campaigns.brand_id`)
- Closed the silent-drop bug: insert retries once with `brand_id: null` on FK violation; update instead **skips the write and preserves the existing brand** — the asymmetry the 4th-pass review caught, since a naive symmetric retry would have let a bad later event erase a good earlier resolution
- `upsertAssetRecord` now returns the effective `brand_id` it actually persisted, so `assets` and `cloudinary_assets` never diverge after a fallback
- Shoot folders stay explicitly logged as unresolved, pointing at IPI-524

**Verification:** 22 tests in the webhook suite (16 regression + 6 new), full suite 150 files / 1131 passed / 0 failed, clean typecheck, clean lint, pre-push gate passed with no bypass needed.

Not yet done: this PR hasn't been merged — that's your call. IPI-514 stays blocked on it as designed.

Filed as **IPI-524 · SHOOT-ARCH-001**. Now verifying this 4th audit's suggestions before applying any of them.

Verification confirms two of the four audit's IPI-513 claims caught a **real bug in my own proposed design** (not the original code) — the rest are legitimate, cheap hardening. Applying corrections now.

Now IPI-514 — fixing the stale diagram branch, the overclaimed "visible tag" line, and the rollback/apply-safety criteria:

Finally IPI-512 — applying the image-first phasing and the two resilience additions, both verified as cheap and correct:

## Verdict on the 4th audit: mostly correct, and it caught something real

**2 of its 4 major claims were genuine bugs — but in *my* proposed design, not the original code.** That's the most important finding here: extending my FK-retry-with-null pattern to the UPDATE path (which I added in the 3rd pass) would have let a stale/invalid brand UUID on a later webhook event **erase a previously-valid `brand_id`** on an existing asset — the original code never had this bug, since it only ever wrote `brand_id` on update when truthy. Fixed by splitting behavior: insert retries-with-null (nothing to lose), update skips-and-preserves (something to protect).

| Claim | Verdict |
|---|---|
| Scope FK retry to `assets_brand_id_fkey` specifically, not any `23503` | ✅ Correct in principle; confirmed via schema the current code only ever writes `brand_id` as an FK column, so it's low-real-risk today but cheap to harden — applied |
| Insert-vs-update need different FK-failure handling | ✅ **Confirmed real bug in my 3rd-pass design** — fixed |
| IPI-514 diagram still implied shoot_id could resolve | ✅ Correct, stale vs. IPI-513's own finding — fixed |
| "Visible unknown tag" oversells scope | ✅ Correct, no UI change exists in scope — fixed |
| Guard IPI-514's apply step against report/apply drift | ✅ Correct, cheap (`WHERE brand_id IS NULL`) — applied, simplified vs. the audit's own multi-column snapshot proposal |
| Don't prove rollback via live double-mutation on real rows | ✅ Correct, real production-data risk — applied |
| IPI-512: image-first, video optional | ✅ Correct scope trim | 
| IPI-512: cleanup race, local JSON registry, server-side-only polling | ✅ All cheap and correct — applied as a comment rather than expanding the spec |

Filed **[IPI-524 · SHOOT-ARCH-001](https://linear.app/amo100/issue/IPI-524)** with the precise fork (`public.shoots` has no `brand_id`; `shoot.shoots` has one but isn't what `assets.shoot_id` references; the webhook only writes to `public.assets`, never `shoot.shoot_assets`) and linked it from both IPI-513 and IPI-514.

All four issues are now internally consistent: [IPI-513](https://linear.app/amo100/issue/IPI-513) · [IPI-514](https://linear.app/amo100/issue/IPI-514) · [IPI-512](https://linear.app/amo100/issue/IPI-512) · [IPI-524](https://linear.app/amo100/issue/IPI-524).

Filed as **IPI-524 · SHOOT-ARCH-001**. Now verifying this 4th audit's suggestions before applying any of them.

Verification confirms two of the four audit's IPI-513 claims caught a **real bug in my own proposed design** (not the original code) — the rest are legitimate, cheap hardening. Applying corrections now.

Now IPI-514 — fixing the stale diagram branch, the overclaimed "visible tag" line, and the rollback/apply-safety criteria:

Finally IPI-512 — applying the image-first phasing and the two resilience additions, both verified as cheap and correct:

## Verdict on the 4th audit: mostly correct, and it caught something real

**2 of its 4 major claims were genuine bugs — but in *my* proposed design, not the original code.** That's the most important finding here: extending my FK-retry-with-null pattern to the UPDATE path (which I added in the 3rd pass) would have let a stale/invalid brand UUID on a later webhook event **erase a previously-valid `brand_id`** on an existing asset — the original code never had this bug, since it only ever wrote `brand_id` on update when truthy. Fixed by splitting behavior: insert retries-with-null (nothing to lose), update skips-and-preserves (something to protect).

| Claim | Verdict |
|---|---|
| Scope FK retry to `assets_brand_id_fkey` specifically, not any `23503` | ✅ Correct in principle; confirmed via schema the current code only ever writes `brand_id` as an FK column, so it's low-real-risk today but cheap to harden — applied |
| Insert-vs-update need different FK-failure handling | ✅ **Confirmed real bug in my 3rd-pass design** — fixed |
| IPI-514 diagram still implied shoot_id could resolve | ✅ Correct, stale vs. IPI-513's own finding — fixed |
| "Visible unknown tag" oversells scope | ✅ Correct, no UI change exists in scope — fixed |
| Guard IPI-514's apply step against report/apply drift | ✅ Correct, cheap (`WHERE brand_id IS NULL`) — applied, simplified vs. the audit's own multi-column snapshot proposal |
| Don't prove rollback via live double-mutation on real rows | ✅ Correct, real production-data risk — applied |
| IPI-512: image-first, video optional | ✅ Correct scope trim | 
| IPI-512: cleanup race, local JSON registry, server-side-only polling | ✅ All cheap and correct — applied as a comment rather than expanding the spec |

Filed **[IPI-524 · SHOOT-ARCH-001](https://linear.app/amo100/issue/IPI-524)** with the precise fork (`public.shoots` has no `brand_id`; `shoot.shoots` has one but isn't what `assets.shoot_id` references; the webhook only writes to `public.assets`, never `shoot.shoot_assets`) and linked it from both IPI-513 and IPI-514.

All four issues are now internally consistent: [IPI-513](https://linear.app/amo100/issue/IPI-513) · [IPI-514](https://linear.app/amo100/issue/IPI-514) · [IPI-512](https://linear.app/amo100/issue/IPI-512) · [IPI-524](https://linear.app/amo100/issue/IPI-524).