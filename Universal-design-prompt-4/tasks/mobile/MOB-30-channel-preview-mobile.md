# MOB-30 — Channel Preview mobile

| Field | Value |
|---|---|
| **ID** | MOB-30 |
| **Priority** | P4 |
| **Complexity** | M |
| **Status** | ⚪ Not Started |
| **Linear** | [IPI-422](https://linear.app/amo100/issue/IPI-422) · blocked IPI-415 |
| **Dependencies** | MOB-04 · SCR-10 shipped |
| **Unblocks** | MOB-90 |
| **Branch** | `ipi/mob-30-channel-preview` |
| **Sources** | [`MOBILE-PLAN.md`](../../docs/Mobile/MOBILE-PLAN.md) §12.10 · §15 Phase 3 · §6 |

## Objective

Mobile Channel Preview: horizontal snap-scroll phone carousel (~88vw per frame), dots indicator, Checks trigger → intel sheet.

## Design source

- `Channel Preview.v2.image-first.dc.html`
- [SCR-10](../screens/SCR-10-channel-preview.md) (desktop parity Done ~90%)

## Spec

- Desktop 4-frame wall → **one phone ~88vw**, snap-scroll, dots below
- Safe-zone toggle remains accessible (≥44px)
- Pinch / double-tap zoom on active frame
- Publish flow (IPI-338) out of scope — preview only

## Definition of Done

- [ ] Carousel works at 390px; one frame focused, swipe between channels
- [ ] No horizontal **page** overflow; carousel may scroll horizontally
- [ ] Checks/Insights opens intel sheet with readiness content
- [ ] Composer dock + tab bar do not cover phone frame
- [ ] Evidence screenshot @390

## Verification

```bash
cd app && npm run lint && npm run build
# manual: /app/preview @390
```

## Risk

Low — isolated screen; desktop already shipped

## Notes

Optional MI-03a platform-first tabs (IPI-191) is separate polish on top of this layout.
