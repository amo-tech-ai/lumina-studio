# MOB-02 — BottomNavigation + TopAppBar + More sheet

| Field | Value |
|---|---|
| **ID** | MOB-02 |
| **Priority** | P3 |
| **Complexity** | M |
| **Status** | ⚪ Not Started |
| **Linear** | [IPI-416](https://linear.app/amo100/issue/IPI-416) · blocked IPI-417 |
| **Dependencies** | MOB-01 (More sheet uses BottomSheet) |
| **Unblocks** | MOB-04 |
| **Branch** | `ipi/mob-02-bottom-nav` |
| **Sources** | [`MOBILE-PLAN.md`](../../docs/Mobile/MOBILE-PLAN.md) §1.1 · §1.2 · §14 |

## Objective

Ship mobile primary navigation: fixed bottom tab bar (5 + More), top app bar (hamburger/brand switcher, title, context action), and More sheet for secondary routes.

## Tab destinations (MVP)

| Tab | Route | Notes |
|---|---|---|
| Home | `/app` | Command Center |
| Shoots | `/app/shoots` | |
| Assets | `/app/assets` | |
| Match | `/app/matching` | Phase 2 screen — tab can stub until SCR-09 ships |
| More | sheet | Brands, Campaigns, Preview, Onboarding, Settings |

## Design source

- `components/BottomNavigation.dc.html`
- `screens/SCR-MOBILE-Booking-Shell.dc.html` (tab bar + safe-area proof)
- Lucide icons only (no emoji — aligns with IPI-302 / RF-A3)

## Spec

- Tab bar: `56px + safe-area-inset-bottom`, fixed bottom
- Active: filled icon + 11px label; inactive: stroke only
- Top bar: `52px + safe-area-inset-top` — hamburger → brand switcher sheet, centered title, `+ New` where applicable
- Touch targets **≥44×44px** on all tab items

## Files likely to create/modify

- `app/src/components/operator-panel/bottom-navigation.tsx` (new)
- `app/src/components/operator-panel/top-app-bar.tsx` (new)
- `app/src/components/operator-panel/more-sheet.tsx` (new)
- `app/src/components/operator-panel/nav-sidebar.tsx` (hide `<1024`)

## Definition of Done

- [ ] Bottom nav visible at `<1024px`; sidebar hidden
- [ ] Five tabs route correctly; active state matches pathname
- [ ] More sheet lists secondary routes with working links
- [ ] Brand switcher opens from hamburger (reuse existing brand context)
- [ ] Safe-area padding on top/bottom bars
- [ ] No horizontal scroll at 375px / 390px
- [ ] Playwright smoke: tap each tab on `/app` shell

## Verification

```bash
cd app && npm run lint && npm run build && npm test
# manual: 390px — nav visible, routes work, no x-scroll
```

## Risk

Low–medium — isolated chrome; wire in MOB-04

## Notes

Maps to implement.md **M1**. Replaces canceled **IPI-251** nav portion.
