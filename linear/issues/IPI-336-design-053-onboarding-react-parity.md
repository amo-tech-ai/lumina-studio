# IPI-336 · DESIGN-053 — Onboarding React Parity

**Linear:** https://linear.app/amo100/issue/IPI-336  
**Parent:** IPI-254  
**Depends on:** IPI-46 ✅  
**Status:** Todo · Synced 2026-07-02

## Route

`/app/onboarding`

## Design source

`Universal design prompt/Onboarding.v2.zeely.dc.html`

## Purpose

13-screen Zeely sign-up funnel → Brand DNA payoff → Open FashionOS → `/app`. Standalone layout (no OperatorShell).

## Acceptance criteria

- [ ] All 13 DC screens in React flow
- [ ] Per-screen validation · analysis progress · DNA payoff
- [ ] IPI-46 orchestration preserved
- [ ] lint · test · typecheck · build · browser evidence

## Verification

```bash
cd app && npm run lint && npm test && npx tsc --noEmit && CI=true npm run build
```
