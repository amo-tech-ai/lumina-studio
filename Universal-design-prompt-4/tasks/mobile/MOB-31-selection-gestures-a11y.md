# MOB-31 — Selection gestures + mobile a11y

| Field | Value |
|---|---|
| **ID** | MOB-31 |
| **Priority** | P3 |
| **Complexity** | M |
| **Status** | ⚪ Not Started |
| **Linear** | [IPI-421](https://linear.app/amo100/issue/IPI-421) · replaces IPI-298/299/300 |
| **Dependencies** | MOB-01 · MOB-04 |
| **Unblocks** | MOB-90 |
| **Branch** | `ipi/mob-31-gestures-a11y` |
| **Sources** | [`MOBILE-PLAN.md`](../../docs/Mobile/MOBILE-PLAN.md) §7 · §10 · §16.2–16.5 · §17 |

## Objective

Ship mobile selection + accessibility gaps identified in §16 audit — replaces canceled **IPI-298 · IPI-299 · IPI-300** as one cohesive PR track.

## Scope

### Touch targets (MOBILE-002)
- All selection checkboxes / icon buttons **≥44×44px** hit area on `<768px`
- Tailwind `min-h-11 min-w-11` padding wrapper; visual size unchanged on desktop
- Surfaces: Matching, Campaigns, Assets (when built)

### Long-press + action sheet (MOBILE-003)
- Long-press ~500ms on selectable cards → enter selection mode (same as Select toggle)
- Bulk actions as **bottom action sheet** on mobile; sticky top bar unchanged on desktop
- Document: drag-to-target **desktop-only** in code comment + `PATTERNS.md#selection`

### A11y remainder (MOBILE-004)
- Focus trap on EvidenceBlock modal + brand-switcher sheet (BottomSheet from MOB-01 covers intel)
- Esc closes topmost overlay
- Streaming AI text in `aria-live="polite"` region (composer streaming strip)
- Do not break existing toast `aria-live` on 7 surfaces

## Out of scope

- Full WCAG audit (IPI-253 / axe CI gate — separate)
- Touch drag-and-drop

## Definition of Done

- [ ] Checkbox/icon targets verified at 390px computed box ≥44px
- [ ] Long-press enters select on Matching/Campaigns/Assets cards
- [ ] Bulk bar → bottom sheet on `<768px`
- [ ] Focus trap + Esc on modals not using MOB-01
- [ ] Streaming strip announces in screen reader test (manual or axe)
- [ ] Desktop Select toggle + drag dock unchanged

## Verification

```bash
cd app && npm run lint && npm test
# axe or manual VoiceOver/NVDA on one modal + composer stream
```

## Risk

Low–medium — pointer handlers need passive listener discipline

## Notes

Can split into 2 PRs: touch/long-press vs a11y if review prefers.
