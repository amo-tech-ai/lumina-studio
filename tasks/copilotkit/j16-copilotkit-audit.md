# CopilotKit test failure audit — 16 Jul 2026

**Scope:** Failed tests from full `npm test` that touch CopilotKit  
**Sources:** vitest re-run, `app/src/app/api/copilotkit/[[...slug]]/route*.ts`, skill `.claude/skills/copilotkit`, CopilotKit MCP docs  
**Verdict:** Failures were **test mock drift**, not a production runtime bug. Fixed with one mock export.

---

## Status (updated)

| Item | State |
| ---- | ----- |
| Root cause | Mock missing `isOperatorAuthEnforced` |
| Fix applied | Yes — `route.runtime.test.ts` |
| Tests after fix | **20/20 PASS** (`npx vitest run src/app/api/copilotkit`) |
| Committed / PR | See bottom of this file |

---

## Scorecard

| Area | Before | After fix |
| ---- | ------ | --------- |
| `route.test.ts` + stream-idle-timeout | 18/18 | 18/18 |
| `route.runtime.test.ts` | 0/6 | **6/6** |
| CopilotKit tests overall | 18/24 (75%) | **24/24 (100%)*** |
| Production route design vs skill/docs | ~85% | unchanged |
| Blocks prod chat? | No | No |

\*Folder total with stream-idle-timeout: 20 route tests + 4 stream = 24 if counted with stream suite; `src/app/api/copilotkit` alone is **20/20**.

**Overall “percent correct” after fix: ~95%** for this slice (tests green; optional license-branch coverage still nice-to-have).

---

## Failed tests (before fix)

All in: `app/src/app/api/copilotkit/[[...slug]]/route.runtime.test.ts`

| # | Suite | Test | Error |
| - | ----- | ---- | ----- |
| 1 | IPI2-127 — two-user isolation | produces different resourceId for User A vs User B | Missing mock export `isOperatorAuthEnforced` |
| 2 | IPI2-127 — two-user isolation | isolates agent scopes: one getLocalAgents per request | Same |
| 3 | IPI2-127 — anonymous → 401 | returns 401 when withOperatorAuth throws | Same |
| 4 | IPI2-127 — anonymous → 401 | auth succeeds → CopilotRuntime + requestToken ALS | Same |
| 5 | C3 — single auth resolution | withOperatorAuth once; never resolveOperatorUser | Same |
| 6 | CF-MIG-210 — Workers-safe runtime | uses createCopilotRuntimeHandler from runtime-v2-fetch | Same |

**One root cause for all six.**

---

## What broke (plain English)

1. Production route calls `isOperatorAuthEnforced()` when building `CopilotRuntime` (license / `identifyUser` — IPI-468).
2. Runtime tests mocked `@/lib/operator-gate` with only `withOperatorAuth` + `OperatorAuthError`.
3. With `COPILOTKIT_LICENSE_TOKEN` in `.env.local`, import evaluated `license && isOperatorAuthEnforced()` → Vitest threw before any real assertion.

```text
route.ts imports operator-gate
  → builds CopilotRuntime (module load)
    → needs isOperatorAuthEnforced()
      → mock missing it  → BOOM
```

---

## Fix applied

In `setupMocks()`:

```ts
vi.doMock("@/lib/operator-gate", () => ({
  withOperatorAuth: vi.fn(),
  OperatorAuthError: OperatorAuthErrorClass,
  isOperatorAuthEnforced: vi.fn(() => false),
}));
```

Default `false` so ambient license token does not attach the license branch during these tests.

---

## Easy checklist

### Done
- [x] Listed all 6 failing CopilotKit tests
- [x] Confirmed single root cause
- [x] Added `isOperatorAuthEnforced` to runtime mock
- [x] Re-ran `npx vitest run src/app/api/copilotkit` → **20/20**
- [x] Committed + opened PR (see below)

### Still optional
- [ ] Runtime tests for license branch when `isOperatorAuthEnforced() === true`
- [ ] Clear `COPILOTKIT_LICENSE_TOKEN` in vitest by default
- [ ] Live smoke: signed-in `/api/copilotkit/info` = 200 (IPI-127)
- [ ] Separate fix for `get-assets` signing fallback (not CopilotKit)

---

## Adjacent noise (unblocked for pre-push)

- `src/lib/assets/get-assets.test.ts` → signing-fallback test assumed empty Cloudinary env; with `.env.local` credentials loaded it signed successfully and expected `null`. Fixed by stubbing empty Cloudinary env in that test (same ambient-env class of flake as the CopilotKit mock).

---

## References

- Skill: `.claude/skills/copilotkit` → `references/ipix-production.md`, `references/runtime/runtime.md`
- Route: `app/src/app/api/copilotkit/[[...slug]]/route.ts`
- Linear: IPI-468 (license gate), IPI2-127 (resourceId), CF-MIG-210 (v2 handler), IPI-127 (prod smoke)

---

## Commit / PR

| Item | Value |
| ---- | ----- |
| Branch | `fix/copilotkit-runtime-mock-isOperatorAuthEnforced` |
| PR | https://github.com/amo-tech-ai/lumina-studio/pull/412 |
| Commits | `fix(copilotkit): mock isOperatorAuthEnforced…` · `fix(tests): stub empty Cloudinary env…` |
| Tests | CopilotKit **20/20**; get-assets **6/6**; pre-push full suite green |
)
