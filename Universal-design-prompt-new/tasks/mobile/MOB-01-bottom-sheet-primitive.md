# MOB-01 — BottomSheet primitive

| Field | Value |
|---|---|
| **ID** | MOB-01 |
| **Priority** | P3 |
| **Complexity** | M |
| **Status** | ⚪ Not Started |
| **Linear** | [IPI-417](https://linear.app/amo100/issue/IPI-417) |
| **Dependencies** | Desktop OperatorShell ✅ · blocked IPI-387 |
| **Unblocks** | MOB-02 · MOB-03 · MOB-04 · MOB-31 |
| **Branch** | `ipi/mob-01-bottom-sheet` |
| **Sources** | [`MOBILE-PLAN.md`](../../docs/Mobile/MOBILE-PLAN.md) §1.3 · §5 · §20.1 · [`COMPOSER-PRIMITIVE.spec.md`](../../docs/models/COMPOSER-PRIMITIVE.spec.md) |

## Objective

Extract one reusable **BottomSheet** for Intelligence/Insights, brand switcher, filters, chat expansion, and mobile bulk actions — replacing per-screen ad-hoc overlays.

## Design source

- `Universal-design-prompt-new/components/BottomSheet.dc.html`
- `Universal-design-prompt-new/screens/SCR-MOBILE-BottomSheet.dc.html` (peek/half/full reference)

## Spec (from MOBILE-PLAN)

- **Detents:** `peek (38vh)` · `half (62vh)` · `full (94vh)`
- Drag handle 36×4px · backdrop `rgba(17,17,17,.4)` · dismiss tap-out or swipe-down
- **Focus trap** + Esc-to-close + return focus to trigger
- Safe-area aware (`env(safe-area-inset-bottom)`)
- `prefers-reduced-motion` → fade, no spring

## Files likely to create

- `app/src/components/ui/bottom-sheet.tsx`
- `app/src/components/ui/bottom-sheet.test.tsx`

## Definition of Done

- [ ] Controlled API: `open`, `onOpenChange`, `detent`, `onDetentChange`, `title`, `children`
- [ ] Three detents with drag between them; snap on release
- [ ] Focus trapped while open; Esc closes; focus restored to trigger
- [ ] Backdrop click dismisses topmost sheet only
- [ ] No horizontal overflow at 390px
- [ ] Unit test for open/close + detent state
- [ ] Story or manual evidence at 390px in evidence folder

## Verification

```bash
cd app && npm run typecheck && npm run lint && npm test -- bottom-sheet
```

## Risk

Medium — shared primitive; get API right before MOB-04 wires IntelligencePanel

## Notes

Maps to implement.md **M2**. Replaces canceled IPI-251 sheet portion and IPI-300 focus-trap scope (sheet half only).
