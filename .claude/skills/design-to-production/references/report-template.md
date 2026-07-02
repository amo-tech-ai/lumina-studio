# Design-to-Production Report

> Copy this template into `docs/qa/` or PR body. Fill every section — no placeholders in final report.

## Source HTML

- File: `Universal design prompt/<name>.v2.image-first.dc.html`
- DC reference URL (if served): `http://localhost:8765/...`

## Target React Route

- Route: `/app/...`
- Page: `app/src/app/(operator)/app/.../page.tsx`
- Workspace components: `app/src/components/...`

## Files Changed

| File | Change |
|------|--------|
| | |

## What Matches

| Area | Status | Notes |
|------|--------|-------|
| Layout / grid | 🟢/🟡/🔴 | |
| Typography | | |
| Cards / images | | |
| Right panel (Intel) | | shell — not rebuilt |
| Chat dock | | shell — not rebuilt |
| States (loading/empty/error) | | |
| Mobile breakpoint | | |

## Remaining Gaps

| Gap | Severity | Follow-up |
|-----|----------|-----------|
| | 🟡/🔴 | IPI-XXX or defer |

## Tests Run

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
| DC desktop | `docs/qa/screenshots/...` |
| React desktop | |
| React mobile (390) | |

## Visual Parity Score

| Dimension | Score | Notes |
|-----------|-------|-------|
| **Overall** | **__%** | |
| Layout | | |
| Spacing | | |
| Cards / images | | |
| Typography | | |
| Intelligence panel | | existing shell |
| Responsive | | |

## Production Readiness

- [ ] 🟢 Ship-ready — parity acceptable, tests green, no console errors
- [ ] 🟡 Needs improvement — list blockers before merge
- [ ] 🔴 Not ready — do not merge

**Verdict one-liner:**
