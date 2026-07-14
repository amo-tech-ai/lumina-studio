# MOB-40 — Booking set mobile (7 screens)

| Field | Value |
|---|---|
| **ID** | MOB-40 |
| **Priority** | P3 |
| **Complexity** | L |
| **Status** | ⚪ Not Started |
| **Linear** | [IPI-425](https://linear.app/amo100/issue/IPI-425) · blocked IPI-415/418 |
| **Dependencies** | MOB-04 · MOB-03 · SCR-09/20/21/22/23/24/25/15 desktop routes |
| **Unblocks** | MOB-90 |
| **Branch** | `ipi/mob-40-booking-mobile` |
| **Sources** | [`MOBILE-PLAN.md`](../../docs/Mobile/MOBILE-PLAN.md) §19 · §20.2 · §21 |

## Objective

Responsive mobile shell for the **booking/talent screen set** per §19 — tab bar + Insights sheet + persistent composer (not launcher pill).

## Screens (§19.2–19.7)

| SCR | Route | Mobile highlights |
|---|---|---|
| 09 | `/app/matching` (talent tab) | Shortlist bottom sheet; filter chips snap; 2-up cards |
| 20 | `/app/matching/talent/[id]` | 8 tabs snap-scroll; sticky Request booking; portfolio 2-up |
| 21 | `/app/matching/talent/[id]/book` | Full-screen wizard, no tab bar; composer inline |
| 22 | `/app/bookings/[id]` | Booking tabs snap; status stepper scroll; stacked actions |
| 25 | `/app/model` · `/app/roster` | Offers pinned above roster; KPI 2-up snap |
| 15 | `/app/inbox` | Full-page list; swipe dismiss; Mark all read footer |
| 23 | `/app/talent/profile` (availability) | Compact month grid; 4-state cells ≥44px |

## Reference implementation

- `screens/SCR-MOBILE-Booking-Shell.dc.html` (D-FIX-010 ✅)
- `screens/SCR-MOBILE-Gallery.dc.html` (28 frames @390)

## Shared rules (§19.1)

- NavRail → bottom tabs; IntelligencePanel → **Insights** header button + sheet
- Composer pinned above tabs; never overlaps tab bar
- HITL: AI never confirms/accepts — human taps only
- Label fixture data until Phase 2 RPCs live (§20.5)

## Definition of Done

- [ ] Each route in table renders at 390px with §19 layout intent
- [ ] Composer placeholder + chips match §21.2 map per route/role
- [ ] Insights sheet separate from chat (§21.4)
- [ ] Wizard (SCR-21) full-screen, no tab bar
- [ ] Offers pinned first on role dashboards (§19.6)
- [ ] Empty/loading/error carried from desktop tasks
- [ ] Evidence @390 · 430 for booking journey (talent → wizard → detail)

## Verification

```bash
cd app && npm run lint && npm run build && npm test
```

## Split guidance

One PR per journey milestone if >800 LOC: talent discovery → wizard → detail → inbox

## Risk

High route count; many SCR routes **not built yet** — execute after SCR-20–25 + SCR-15 land

## Notes

Tablet portrait/landscape for booking: §20.3 — include in MOB-32 decision or MOB-40 follow-up.
