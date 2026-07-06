# Design-to-Production Report

> Copy into `docs/qa/` or PR body. No placeholders in final report.

## Source HTML

- File: `Universal design prompt/<name>.v2.image-first.dc.html`
- DC URL: `http://localhost:8765/...`
- Screen checklist: [`screen-checklists.md`](../../.claude/skills/design-to-production/references/screen-checklists.md)

## Target React Route

- Route: `/app/...`
- Page: `app/src/app/(operator)/app/.../page.tsx`
- Workspace: `app/src/components/...`
- Architecture: RSC page · client workspace · `loading.tsx` (Y/N)

## Phase 0 — production state

| Area | On disk today | This PR changes |
|------|---------------|-----------------|
| Route | | |
| Shell (OperatorPanel) | | |
| API / view | | |
| Workspace CSS module | | |

## Data sources

| UI block | Query / view | Empty | Error |
|----------|--------------|-------|-------|
| | | | |

## Files changed

| File | Change |
|------|--------|
| | |

## DC measurements vs React

| Measurement | DC | React | Match |
|-------------|----|----|-------|
| Workspace max-width | | | 🟢/🟡/🔴 |
| Grid columns / gap | | | |
| Card aspect | | | |
| Header padding | | | |

## States (each distinct)

| State | DC | React | Screenshot |
|-------|----|----|------------|
| Loading | | | |
| Empty portfolio | | | |
| No matches | | | |
| Error + retry | | | |
| Populated grid | | | |

## React / Next gates

```text
[ ] No #FBF8F5 / #E87C4D / min-h-screen in diff
[ ] tokens.css / CSS modules only
[ ] RSC fetch + minimal client boundary
[ ] No fake fallbacks (rg DEFAULT_|dna: 87)
[ ] Hydration clean
```

## Tests

```text
cd app && npm run lint          →
cd app && npm test              →
cd app && npx tsc --noEmit      →
cd app && CI=true npm run build →
npx playwright test <spec>      →
```

## Screenshots

| Label | Path |
|-------|------|
| DC desktop 1280 | |
| React desktop 1280 | |
| React mobile 390 | |
| DC vs React (per state) | |

## Parity score (Shoots List: 14 dimensions)

| # | Dimension | Score | Notes |
|---|-----------|-------|-------|
| | **Overall** | **__%** | |
| 1 | Workspace 920px | | |
| … | (see screen-checklists.md) | | |

## Remaining gaps

| Gap | Severity | Follow-up |
|-----|----------|-----------|
| | 🟡/🔴 | IPI-XXX |

## Production readiness

- [ ] 🟢 Ship-ready
- [ ] 🟡 Needs improvement
- [ ] 🔴 Not ready

**Verdict:**
