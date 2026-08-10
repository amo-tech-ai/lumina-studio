# Post-merge audit — PR #877

**Audit date:** 2026-08-10
**Merge commit:** `1d05b1bd0b3f70fe34315093b7c3fdc69524e9b1` (merged to `main`, 2026-08-09)
**Concern:** Exact-version smoke gate — focused tests + CI wiring

| PR | Title | IPI task | Concern |
|----|-------|----------|---------|
| [#877](https://github.com/amo-tech-ai/lumina-studio/pull/877) | **IPI-707 · CF-SMOKE-001 — exact-version smoke gate: focused tests + CI wiring** | [IPI-707 · CF-SMOKE-001](https://linear.app/amo100/issue/IPI-707) | Closes the automated preview-smoke gap left after the version-header building blocks landed in PR #870 (squash `18bf1bb6`) |

---

## Purpose

Adds the verification layer for the Worker version-header feature: two focused Vitest cases proving the middleware sets `X-iPix-Worker-Version` on operator routes (`/app`) and leaves public routes (`/`) untagged, plus an exact-version gate in the existing `verify-copilot-preview` CI job. The gate captures the live Worker's version ID from `/api/copilotkit/info` before the browser journey runs, fails the job if the header is absent, and passes `--expect-version=$VERSION` into `verify:copilot` so the full login → `/app` → CopilotKit info → AI turn → logout journey must be served by that exact Worker version — preventing a false pass against a stale but still-healthy version.

---

## Files / systems changed

| Item | Result |
|------|--------|
| `.github/workflows/ci.yml` | +26/-1 — new "Capture Worker version ID (IPI-707)" preflight step in `verify-copilot-preview`; `EXPECT_VERSION` env wired into the `verify:copilot` invocation via `--expect-version` |
| `app/src/middleware-version-header.test.ts` | +44/-0 (new file) — 2 Vitest cases, mocks `@opennextjs/cloudflare` |
| Production code | **None** (no changes to `app/src/middleware.ts` itself; this PR is test + CI wiring only) |
| New suite/framework | **None** — reuses the existing `verify-copilot-preview` job and `verify:copilot` script |

---

## Tests / CI results (as reported on the PR)

| Check | Result |
|-------|--------|
| Middleware tests (`app/src/middleware-version-header.test.ts` incl. 2 new) | 35/35 pass |
| Verifier tests | 24/24 pass |
| Info-503 selfcheck | 30/30 pass |
| Typecheck | 0 errors |
| Lint | clean |
| `next build` | pass |
| OpenNext CF build | pass |
| Worker-bundle gates | pass |

---

## Production impact

**CI-only change; no deployed Worker/runtime behavior is altered.** The new preflight step and `--expect-version` flag affect only the `verify-copilot-preview` GitHub Actions job — they add a stricter pass/fail condition to that job (it now fails if `/api/copilotkit/info` omits `X-iPix-Worker-Version`, or if the browser journey is served by a different version than the one captured). No application, middleware, or Worker code shipped in this PR; the header-emitting middleware itself was already merged in PR #870.

---

## Known limitations

| ID | Finding |
|----|---------|
| L1 | This PR reports test/CI results narratively in the PR description; no CI run artifact or log link is captured in this record |
| L2 | A real-Worker exact-version proof artifact is explicitly deferred to a separate follow-up PR (not included here) |
| L3 | `tasks/cloudflare/todo.md` IPI-707 row is known-stale and is **not** updated by this PR — reconciliation deferred to a separate docs-only PR, per the PR description |
| L4 | The CI gate depends on the live preview Worker already exposing `X-iPix-Worker-Version`; if that header regresses upstream (middleware change), this gate becomes the failure signal, not a fix |

---

## Rollback / cleanup notes

- No infrastructure, secrets, or deployed Worker config changed — rollback (if ever needed) is a revert of the two-file diff (`.github/workflows/ci.yml`, `app/src/middleware-version-header.test.ts`) with no downstream effects.
- No temporary branches, feature flags, or scripts were introduced.
- No database, Supabase, or Cloudflare resource changes are part of this PR.

---

## Follow-up tasks

| Priority | Task |
|----------|------|
| Next | Real-Worker exact-version proof artifact (separate PR) |
| Next | `tasks/cloudflare/todo.md` stale IPI-707 status reconciliation (docs-only, separate PR) |
| Soon | [IPI-839](https://linear.app/amo100/issue/IPI-839) |
| Soon | [IPI-708](https://linear.app/amo100/issue/IPI-708) |
| Later | [IPI-631](https://linear.app/amo100/issue/IPI-631) — DNS cutover (blocked on IPI-707 family completion per `tasks/cloudflare/todo.md`) |
| Later | [IPI-609](https://linear.app/amo100/issue/IPI-609) |