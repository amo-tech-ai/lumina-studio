# Suspense console audit — PR note

## Summary

React Suspense console warning was verified as **React DevTools extension noise**, not an app bug.

## Evidence

| Environment | Result |
|---|---|
| Chrome + React DevTools extension | Warning with stack `chrome-extension://…/installHook.js` |
| Clean Playwright Chromium (no extensions) | **0** Suspense-boundary errors |

Routes verified (initial load + reload):

- `/app`
- `/app/brand`
- `/app/brand/99f47f5c-d935-4623-931c-a773c3802ad4`

Regression test: `e2e/suspense-console-forensics.spec.ts`

```bash
npx playwright test e2e/suspense-console-forensics.spec.ts --project=chromium-desktop
```

Requires QA credentials in `.env.local` (skips gracefully if absent).

## Verdict

**No production blocker.** No production app code change required for this warning.

Clean Playwright Chromium is the source of truth for console forensics.

## Optional future hardening (separate PR)

`useIntelligencePanel` calls `useSearchParams()`. Only `OperatorDevSkipSync` is wrapped in Suspense today. If Next.js ever surfaces a real boundary warning in clean Chromium, wrap `IntelligencePanel` inner content in `<Suspense fallback={null}>` the same way.
