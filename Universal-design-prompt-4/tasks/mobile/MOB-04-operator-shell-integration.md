# MOB-04 — OperatorShell responsive integration

| Field | Value |
|---|---|
| **ID** | MOB-04 |
| **Priority** | P3 |
| **Complexity** | M |
| **Status** | ⚪ Not Started |
| **Linear** | [IPI-415](https://linear.app/amo100/issue/IPI-415) · blocked IPI-417/416/418 |
| **Dependencies** | MOB-01 · MOB-02 · MOB-03 |
| **Unblocks** | MOB-10 · MOB-20 · MOB-90 |
| **Branch** | `ipi/mob-04-shell-integration` |
| **Sources** | [`MOBILE-PLAN.md`](../../docs/Mobile/MOBILE-PLAN.md) §2 · §5 · §20.1 |

## Objective

Wire MOB-01–03 into `OperatorPanel` / `OperatorShell` at `<1024px`: hide desktop sidebar + inline IntelligencePanel; show bottom nav, top bar, composer dock, Intelligence as BottomSheet.

## Breakpoint layout

| Width | Layout |
|---|---|
| `<1024px` | Single column + bottom tabs + composer + intel sheet |
| `≥1024px` | Existing 3-column desktop (no regression) |

Use `@media (max-width: 1023px)` for shell; container queries inside shared components where reused.

## Files likely to modify

- `app/src/components/operator-panel/operator-panel.tsx` (or equivalent shell)
- `app/src/components/operator-panel/intelligence-panel.tsx` — render in BottomSheet on mobile
- Layout padding tokens for dock + tab bar reserve

## Definition of Done

- [ ] At 1280px: unchanged desktop 3-column layout
- [ ] At 390px: bottom nav + composer + no sidebar; intel opens as sheet
- [ ] Intelligence trigger label per screen (Insights / Checks / DNA per §5)
- [ ] Badge on intel trigger when actionable items pending
- [ ] Main scroll area reserves bottom inset (no content hidden under dock/tabs)
- [ ] No CopilotKit or marketing chrome leak on mobile marketing routes (out of scope — operator only)
- [ ] Screenshots 390 + 1280 in evidence doc

## Verification

```bash
cd app && npm run lint && npm run build && npm test
# Playwright: operator shell mobile viewport project
```

## Risk

Medium — touches every operator route; gate with MOB-90 smoke on CC + Shoots + Brand

## Notes

Maps to implement.md **F2 + M1**. This is the integration PR — keep MOB-01–03 additive until this step.
