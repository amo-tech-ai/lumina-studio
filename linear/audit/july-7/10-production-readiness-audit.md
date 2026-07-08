# 10 — Production readiness audit

**Scope:** Error boundaries, CI, E2E, browser smoke, Vercel/env, route safety.

## Verdict: 🔴 45/100 — Missing error boundaries block production readiness

## Key findings

| Area | Grade | Evidence |
|------|-------|----------|
| error.tsx in operator routes | 🔴 | **0 files found** — 17 routes have no error boundary |
| loading.tsx | ⚪ | 5/17 routes have loading.tsx |
| CI app-build | 🟢 | CI workflow includes lint → build → tsc → test |
| CI supabase-web015 | 🟢 | Docker-based RLS test suite |
| CI booking-gate | 🟢 | Booking FSM verification |
| E2E Playwright | 🔴 | IPI-238 in Backlog — no E2E in CI |
| Vercel deployment | 🟡 | ipix-operator deploys; PR #164 has Vercel failure |
| Client env guard | 🟢 | check-client-env.mjs in CI |
| Supabase verify-rls | 🟢 | 19 probes pass |
| Browser smoke (operator) | 🟡 | Ad-hoc only — no automated smoke |
| IPI-127 CopilotKit license | 🟡 | In Progress — prod 401 fixed, threads still gated |

## error.tsx gap

Zero error.tsx files in the entire `(operator)` route group. If ANY page component throws during rendering, the user sees Next.js's default error screen. This is a P0 production blocker.

Affected routes: /app, /app/brand, /app/brand/[id], /app/shoots, /app/shoots/new, /app/shoots/[shootId], /app/campaigns, /app/assets, /app/matching, /app/preview, /app/onboarding, /app/crm/* (5 routes)

## Recommended action

1. Create `(operator)/error.tsx` — catch-all for the route group
2. Add loading.tsx for remaining 12 routes
3. Start IPI-238 (Playwright E2E in CI)
4. Ship IPI-127 (CopilotKit license for prod)
5. Fix PR #164 Vercel failure before merging
