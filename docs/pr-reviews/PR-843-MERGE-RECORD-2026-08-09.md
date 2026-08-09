# PR #843 — Merge Record

**Task:** IPI-836 · ONB2-VERIFY-001 — Prove QA Onboarding Reaches Brand Hub Safely
**PR:** `IPI-836 · ONB2-VERIFY-001 — Prove QA Onboarding Reaches Brand Hub Safely` (#843)
**Merge SHA:** `df5c9f4ac47e7b8f16a8c8e087c01974494a7af7` (`main`)
**Author:** amo-tech-ai · **Merged:** 2026-08-09 19:22:51 -0400

---

## Purpose

Add a QA-only Playwright verification harness proving a real operator can sign in, resume a saved onboarding session, load Brand DNA, approve it exactly once, reach a durable `ready` state, and land on Brand Hub — without duplicate brands, stale state, tenant leakage, or accidental writes to production. The harness is intentionally separated from the production onboarding fixes tracked in PR #811.

## Files / systems changed

- `e2e/14-onboarding-launch.spec.ts` (+365) — onboarding-launch Playwright suite: preflight, resume-path DNA render/ID continuity, approval idempotency + durable ready + Brand Hub nav, tenant isolation, mobile 390px smoke, reduced-motion path, and a fresh-user questionnaire → crawl → approve journey.
- `e2e/helpers/onboarding-flow.ts` (+299) — browser flow helpers: QA login, fresh/resume onboarding, questionnaire walk, idempotency key / auth user id extraction.
- `e2e/helpers/onboarding-sql.ts` (+527) — QA-only Postgres helpers: uniqueness queries, draft-answer polling, draft-ready session lookup, progress snapshot/formatting, RLS tenant-isolation assertion, fixture reset, fresh-crawl cleanup.
- `e2e/helpers/qa-target.mjs` (+196) / `e2e/helpers/qa-target.ts` (+14) — fail-closed QA project validation (DB URL, Supabase URL, JWT project refs), QA web-server env builder.
- `e2e/helpers/qa-credentials.ts` (+7/-5) — `getQaCredentials` now requires both email and password; removed the hard-coded default email fallback.
- `playwright.onboarding-launch.config.ts` (+57) — dedicated Playwright config; always starts a fresh QA-pinned web server (no `reuseExistingServer`), Chromium desktop + 390px mobile projects.
- `scripts/run-onboarding-launch-e2e.mjs` (+98) — repeatable runner; validates QA credentials/JWT refs before spawning Playwright.
- `scripts/assert-qa-target.selfcheck.mjs` (+144) — self-check for the QA-target helpers (prod/decoy JWT rejection, QA/pooler URL acceptance, env pinning).
- `.gitignore` (+2) — excludes local QA JWT pack `.env.qa-keys.local` from version control.
- `app/src/middleware.ts` (+1/-1) — incidental typing fix: explicit cast of `cfContext.env` before reading `WORKER_VERSION_METADATA.id`; no runtime behavior change.

No production onboarding application logic, migrations, or Copilot preview behavior was touched — scope is QA test infrastructure only.

## Tests / CI results

- Verification commands per PR description:
  - `node scripts/assert-qa-target.selfcheck.mjs`
  - `node scripts/run-onboarding-launch-e2e.mjs --grep 'preflight|resume from DNA'`
  - `npx playwright test --config=playwright.onboarding-launch.config.ts`
- Reported status at merge time: resume path green, mobile green, reduced motion green, required CI green on head.
- `verify-copilot-preview` reported green after separate IPI-964 work (tracked outside this PR).
- Fresh-crawl path was previously blocked by external AI egress in the test environment — noted as an environment constraint, not a harness correctness regression.

## Production impact

None expected. This PR adds QA-only test harness code (Playwright specs, helpers, scripts, dedicated config) and one incidental type-safety fix in `app/src/middleware.ts` for reading Cloudflare Worker version metadata. All database/Supabase/Mastra targets used by the harness are validated fail-closed against a hard-coded QA project ref (`wtuhdynujhszsbwxlbdi`) and explicitly refuse the production project ref (`nvdlhrodvevgwdsneplk`). No migrations, schema, or Wrangler/production environment variables are changed.

## Known limitations

- Fresh-crawl (full questionnaire → new-brand-crawl) coverage depends on external AI/crawl egress being reachable from the test environment; it was environment-blocked at merge time rather than independently re-verified.
- The harness depends on a reusable `draft_ready` QA fixture being present (`findDraftReadyOnboardingSession`); if that fixture is absent or corrupted, resume-path tests skip (or fail, under `REQUIRE_ONBOARDING_LAUNCH_E2E=true`) rather than creating one.
- QA credentials/keys are supplied via local, gitignored env files (`app/.env.local`, `.env.local`, `.env.qa-keys.local`); this record does not assert those files were present or valid at merge time, only that the helpers fail closed when they are missing or point at production.

## Rollback / cleanup notes

- Additive change confined to `e2e/`, `scripts/`, one new Playwright config, and `.gitignore`; revertable with `git revert df5c9f4` if the harness needs to be pulled.
- The one non-test file touched, `app/src/middleware.ts`, is a 1-line type-cast change and can be reverted independently if it is implicated in any regression.
- No database rows, migrations, secrets, or infrastructure were created by the merge itself; the harness's own fixture-reset/cleanup logic (`resetBrandToDraftReady`, `cleanupFreshCrawlRows`) runs only when the suite is executed against QA, not as part of merging this PR.

## Follow-up tasks

- Land the corresponding production onboarding fixes in PR #811 (explicitly out of scope here).
- Re-run the fresh-user full-crawl path once external AI/crawl egress is confirmed available in the test environment, and record the result against this harness.
- Track Copilot preview gate work under IPI-964 / PR #844 separately, per the PR's stated scope boundary.