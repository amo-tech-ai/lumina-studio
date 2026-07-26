# Merge Record — IPI-146 · MASTRA-GOV-002

**Task:** IPI-146 · MASTRA-GOV-002 — Enforce Organization-Scoped Mastra Memory and Thread Authorization
**PR:** #635
**Merge SHA:** `cd3c809baa326a1617248d33b08f3056cb827572` (squash merge to `main`, 3 commits)
**Merged:** 2026-07-26T16:27:40-04:00
**Record date:** 2026-07-26

## Purpose

Mastra's `resourceId` (the tenant-partition key for CopilotKit thread memory used by Production Planner shot lists, CRM assistant chat, and brand-intelligence chats) was a bare `user.id`, isolating conversations between users but not between organizations. An operator belonging to more than one org, or a leaked `threadId`, had no server-side check preventing cross-org read of Mastra thread history. This PR makes the memory key org-scoped (`org:{orgId}::user:{userId}`) and rejects any client-supplied `threadId` that doesn't belong to the caller's org.

## Systems / files changed

- `app/src/mastra/memory.ts` — added `makeMemoryResourceId(orgId, userId)`, fail-closed via existing `requireResourceId` (IPI-621).
- `app/src/app/api/copilotkit/[[...slug]]/route.ts` — resolves operator's org via the existing `getCurrentOrgId` / `org_members` lookup before every request; uses org-scoped `resourceId` (via request-scoped `AsyncLocalStorage`) instead of `user.id`; adds `assertThreadOwnership` for both JSON-body and URL-path `threadId`s; explicit `401` for missing access token, `403 org_required` for missing org membership, `403 thread_forbidden` for cross-org/forged threads; reads POST body once and forwards a reconstructed `Request` (no `request.clone()`) to preserve `AbortSignal`.
- Test coverage added/updated: `app/src/mastra/memory.test.ts`, `app/src/lib/operator-isolation.test.ts`, `app/src/app/api/copilotkit/[[...slug]]/route.test.ts`, `route.runtime.test.ts`, `route.info.test.ts`, and a new Postgres integration suite `app/src/lib/db/mastra-org-scope.integration.test.ts`.

Out of scope (separate, already-tracked follow-ups): RLS `WITH CHECK` migration (IPI-775 · CF-DB-008), `@mastra/memory` package upgrade (IPI-779 · MASTRA-PG-011b), documentation changes.

## Tests and CI results

- Unit: `memory.test.ts` (resourceId format, determinism, percent-encoding, fail-closed on blank/non-string org or user id) — pass.
- Unit: `operator-isolation.test.ts` (org-scoped isolation, same-user/different-org case) — pass.
- Mocked runtime: `route.runtime.test.ts`, `route.test.ts`, `route.info.test.ts` (missing-org 403, new-thread pass-through, same-org reuse, legacy pre-IPI-146 thread compat, cross-org 403, forged-thread 403, URL-based GET/DELETE ownership) — pass.
- Postgres integration: `mastra-org-scope.integration.test.ts` (same-org success, cross-org deny, missing-org fail-closed, forged-threadId deny) against the linked Supabase DB, with cleanup — pass when DB creds present; skips gracefully otherwise.
- `npm run typecheck` — clean.
- `npm run lint` — clean.
- `npm test` (full suite) — 231 files / 2310 tests passed, 4 skipped (integration file, correctly skipped without DB creds).
- Pre-push hook (typecheck + full test suite) — passed.
- 3 CodeRabbit review rounds addressed pre-merge: missing-token 401 vs org_required 403 distinction, `request.clone()` replaced with single-read + reconstructed `Request`, URL-based thread ownership checks added, integration-test cleanup failures now logged, `AbortSignal` preserved on body forward, `/threads/subscribe` and `/threads/clear` confirmed excluded from ownership checks.

## Production impact

- Every CopilotKit request (Production Planner, CRM assistant, brand-intelligence chats) now performs an org lookup and, when a `threadId` is present, an ownership check before the agent turn runs.
- Operators with no organization membership now get `403 org_required` instead of silently running under a bare-user-id memory scope.
- Requests with a `threadId` outside the caller's org (or a forged same-org `threadId`) now get `403 thread_forbidden` instead of being served.
- Live probe of the linked Supabase project (pre-merge) found ~1 total thread, 0 org-scoped — negligible existing thread volume at deploy time.

## Known limitations

- Migration strategy A (compat read): pre-existing threads with `resourceId === bare user.id` remain readable only by that same user; they are not backfilled to the org-scoped format. This is a narrowing, not a weakening, of the prior guarantee.
- Does not address RLS `WITH CHECK` enforcement at the database layer (tracked separately as IPI-775 · CF-DB-008) — authorization here is enforced at the application layer in the CopilotKit route.
- Does not upgrade the alpha `@mastra/memory` package, which has no built-in tenant enforcement of its own (tracked separately as IPI-779 · MASTRA-PG-011b).

## Rollback / cleanup notes

- No data migration was performed and none is required to roll back — legacy bare-`user.id` threads were left untouched throughout.
- Reverting this PR restores bare-`user.id` `resourceId`s; no cleanup of created rows is needed since org-scoped threads created after this merge remain valid Mastra thread rows (only the `resourceId` format differs).
- Integration test rows (`ipi-146-test-*` thread IDs) are deleted in the test's own `afterAll` hook; no manual database cleanup required.

## Follow-up tasks

- IPI-775 · CF-DB-008 — RLS `WITH CHECK` migration for Mastra tables (separate, already tracked).
- IPI-779 · MASTRA-PG-011b — `@mastra/memory` package upgrade (separate, already tracked).