# IPI-336 · DESIGN-053 — Onboarding React Parity

**Linear:** https://linear.app/amo100/issue/IPI-336  
**Parent:** [IPI-254](https://linear.app/amo100/issue/IPI-254) · DESIGN V2  
**Depends on:** [IPI-46](https://linear.app/amo100/issue/IPI-46) ✅ (orchestration + profile persistence)  
**Status:** Todo · Synced from Linear 2026-07-02

---

## Purpose

Sign-up funnel that collects brand basics, runs AI analysis, shows Brand DNA payoff, then opens the operator app. **Standalone layout** — no OperatorShell (handoff §11).

## Design source

`Universal design prompt/Onboarding.v2.zeely.dc.html`

## Route

`/app/onboarding`

## Current production (audit 2026-07-02)

| Check | State |
|-------|--------|
| Route exists | ✅ `app/(operator)/app/onboarding/page.tsx` (~264 lines) |
| Screen count | 🔴 **3-step** (`DOTS = [1, 2, 3]`) — target is **13-screen** DC funnel |
| IPI-46 orchestration | ✅ `createOrgAndBrand` + `invokeBrandIntelligence` wired |
| Per-screen components | 🔴 Inline in single page — needs extract + 10 new screens |

## User story

> As a **new brand operator**, I complete a guided 13-screen funnel, see my Brand DNA results, and land on Command Center ready to plan content — without re-entering data the app already captured.

## Frontend scope

- 13-screen Zeely funnel with progress segments
- Per-screen validation (inline errors before Next)
- Screen 12 analysis progress → Screen 13 DNA payoff
- Social-proof tiles + review dock per DC
- **No OperatorShell** — full-width standalone chrome
- Mobile: stacked steps, sticky progress, 44px targets
- States: per-step valid/invalid · analysing (12) · ready (13) · error + Retry

## Backend / data wiring

- Reuse IPI-46: `createOrgAndBrandShell` → `brand-intelligence({ brandId })` → scores
- Supabase: `brands`, `brand_scores`, `organizations` (existing RLS)
- Exit: **Open FashionOS** → `/app`

## CopilotKit

- **Agent:** `brand-intelligence` (route map)
- Inline review dock on analysis screens — contextual chips
- No right Intelligence Panel (standalone funnel)

## Wireframe

```mermaid
flowchart LR
  S1[Welcome] --> S2[Brand basics]
  S2 --> S12[Analysis progress]
  S12 --> S13[DNA payoff]
  S13 --> CC[/app Command Center]
```

## Implementation steps

| Step | Work | Proof |
|------|------|-------|
| A | Audit prod 3-step vs DC 13-screen — gap table | audit md |
| B | Screen components + progress rail | visual vs HTML |
| C | Wire IPI-46 orchestration on final submit | 1 brand row test |
| D | Analysis + DNA payoff screens | states 12–13 |
| E | Mobile + a11y pass | 390px screenshots |

## Skills to run

`ipix-task-lifecycle` · `design-md` · **`design-to-production`** · `frontend-design` · `ipix-wireframe` · `copilotkit` (v2) · `mermaid-diagrams` · **`task-verifier`**

## Testing

```bash
cd app && npm run lint && npm test && npx tsc --noEmit && CI=true npm run build
```

Browser: DC HTML vs `/app/onboarding` · 1280/768/390 · `docs/qa/screenshots/YYYY-MM-DD/onboarding/`

## Acceptance criteria

- [ ] All 13 DC screens in React flow
- [ ] Per-screen validation · DNA payoff · Open FashionOS → `/app`
- [ ] IPI-46 orchestration preserved · Zeely tokens only
- [ ] lint · test · typecheck · build · browser evidence

## Out of scope

OperatorShell · Brand Detail IPI-271 · Firecrawl IPI-24
