# PR #824 — Merge Record

**Task:** IPI-951 · CLD-SIGN-001 — Consolidate Cloudinary Signing Endpoints into Unified Service
**PR:** `Consolidate Cloudinary signing endpoints into unified service` (#824)
**Merge SHA:** `b475e32d5d41da960ce4e23cdbdcd96add76e056` (`main`)
**Author:** amo-tech-ai · **Merged:** 2026-08-05 20:21:22 -0400

---

## Purpose

Consolidates duplicate Cloudinary signing logic from the `cloudinary-sign` (widget-provided params) and `upload-sign` (server-generated params) routes into one shared service, `signCloudinaryUpload`. Both routes now delegate validation, brand/org resolution, ownership checks, and signature construction to the unified service instead of maintaining parallel implementations. Two security gaps were closed in the same pass: a missing `dev-unauthenticated` production guard on server-mode signing, and missing `workId` UUID validation on server-mode signing (previously only enforced in widget mode), which could otherwise allow injection of `|`, `=`, or `../` into folder paths and signed context.

## Files / systems changed

| Path | Change |
| --- | --- |
| `app/src/app/api/_lib/cloudinary-unified-sign-service.ts` | **New.** Unified `signCloudinaryUpload` service (+361 lines) covering widget and server signing modes, timestamp validation, brand/org resolution, and shoot/campaign ownership checks. Placed under `api/_lib/` (scanner treats `api/` as server-only), so no `"use server"` directive is needed. Superseded `app/src/lib/cloudinary/unified-sign-service.ts` from an earlier iteration of this PR. |
| `app/src/app/api/assets/cloudinary-sign/route.ts` | Delegates widget signing to `signCloudinaryUpload`; removed local secret checks, param validation, brand access, work-type/work-ID validation, ownership queries, and signature construction (+18/-139). |
| `app/src/app/api/assets/upload-sign/route.ts` | Delegates server-mode signing to `signCloudinaryUpload`; removed local env checks, resource-type/filename/work-type validation, context normalization, ownership queries, and signature generation. Retains boundary-level JSON/brandId/resourceType/filename/workId/context checks (+25/-167). |
| `app/src/app/api/assets/cloudinary-sign/route.test.ts` | Adds coverage for missing-key 500, expired/future timestamp rejection (asymmetric window), `dev-unauthenticated` production 401, and a no-secret-leak assertion; timestamps switched to current time (+118/-21). |
| `app/src/app/api/assets/upload-sign/route.test.ts` | Adds coverage for `dev-unauthenticated` production 401 / development success, non-string and null `workId` rejection, and `context.shootId` / `context.campaignId` validation (non-string, non-UUID, valid, omitted). |

**TTL/validation behavior introduced by the unified service:**
- `WIDGET_MAX_AGE_SECONDS = 3600` (past-age limit), `WIDGET_FUTURE_SKEW_SECONDS = 300` (future clock-skew tolerance) — asymmetric widget timestamp check: reject when `timestamp < now - 3600 || timestamp > now + 300`, closing a prior gap where future-dated signatures stayed usable for up to ~2 hours.
- `SERVER_SIGNATURE_TTL_SECONDS = 300` — internal server-mode expiry, unchanged from prior behavior.
- Context UUID validation on server-mode now returns `400` (was `500`).
- Widget-mode API key resolution falls back to `NEXT_PUBLIC_CLOUDINARY_API_KEY` when `CLOUDINARY_API_KEY` is unset; server mode requires `CLOUDINARY_API_KEY`.

## Tests / CI results (per PR description)

- Cloudinary tests: 18/18 passed
- Upload-sign tests: 48/48 passed (incl. 4 new security tests — 2 dev-unauthenticated + 2 workId validation)
- Full suite: 3,188 passed
- Scanner: pass (no forbidden client-env patterns)
- Typecheck: pass
- Lint: pass
- Build: pass

This record reflects the results as reported in the merged PR description; independent re-run was not performed as part of generating this record.

## Production impact

Both `/api/assets/cloudinary-sign` and `/api/assets/upload-sign` now share one signing implementation. Behavioral changes live-affecting callers:
- Widget-mode signature requests with a timestamp more than 1 hour old or more than 5 minutes in the future are now rejected with `400 Invalid timestamp` (previously only a lower-bound/finite check applied).
- Server-mode signing (`upload-sign`) now rejects `dev-unauthenticated` operator identity outside `NODE_ENV=development` with `401`, and now validates `workId` as a UUID (previously unvalidated on this path), returning `400` on malformed input — closing a folder-path/context injection vector.
- Server-mode context UUID failures now return `400` instead of `500`.
- Shoot/campaign ownership mismatches on both routes return `403` (previously some paths returned `400`).

No database migrations, environment variables, or infrastructure changes were introduced.

## Known limitations

- `CLOUDINARY_CLOUD_NAME` is intentionally not validated ahead of `signCloudinaryUpload` for widget mode; the existing conditional inside the service remains the only guard when the variable is missing (clarified by the PR author in review, not changed by this PR).
- `AGENTS.md` was originally scoped into this PR and was removed/deferred to a separate PR (#829); not part of this merge.
- This record does not independently re-run the test suite; pass/fail counts above are taken from the PR description at merge time.

## Rollback / cleanup notes

- Revertable as a normal `git revert b475e32` — the change is additive-service + two call-site rewrites, with no schema, migration, or infra component.
- If reverted, `app/src/app/api/_lib/cloudinary-unified-sign-service.ts` should be removed along with the revert to avoid an orphaned, unused module.

## Follow-up tasks

- Track `AGENTS.md` re-addition in PR #829 (noted by the PR author as moved out of scope for #824).
- No other follow-up tickets were called out in the PR description.