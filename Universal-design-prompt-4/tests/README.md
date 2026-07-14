# Planner (IPI-536) test archive

These are **reference copies** for the QA audit, not the executable copies. The project's actual test runners only pick up:

- `app/e2e/**` (Playwright — `playwright.config.ts` has `testDir: "./e2e"`)
- `app/src/**/*.test.ts(x)` (Vitest)

Canonical, executable locations for these two files:

| File here | Canonical location |
|---|---|
| `planner-routes.spec.ts` | `app/e2e/07-planner-routes.spec.ts` |
| `planner-error-boundary.render.test.tsx` | `app/src/components/planner/planner-error-boundary.render.test.tsx` |

Run them for real with:

```bash
# Playwright (needs dev server on :3002, QA_PASSWORD set for authenticated scenarios)
npx playwright test e2e/07-planner-routes.spec.ts --project=chromium-desktop
npx playwright test e2e/07-planner-routes.spec.ts --project=mobile-390 -g "10\."

# Vitest component test
cd app && npx vitest run src/components/planner/planner-error-boundary.render.test.tsx
```

Both suites pass as of 2026-07-13 against merged `main` (commit `298b1f51`). See the full QA report for results, skipped-scenario reasoning, and findings.
