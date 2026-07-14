# MOB-10 — MVP operator screens (Phase 1)

| Field | Value |
|---|---|
| **ID** | MOB-10 |
| **Priority** | P3 |
| **Complexity** | L |
| **Status** | ⚪ Not Started |
| **Linear** | [IPI-419](https://linear.app/amo100/issue/IPI-419) · blocked IPI-415 |
| **Dependencies** | MOB-04 · desktop SCR parity for each screen |
| **Unblocks** | MOB-20 · MOB-90 |
| **Branch** | `ipi/mob-10-mvp-screens` (or split one PR per screen if >500 LOC) |
| **Sources** | [`MOBILE-PLAN.md`](../../docs/Mobile/MOBILE-PLAN.md) §12.1–12.8 · §15 MVP · §6 |

## Objective

Responsive reflow for **Phase 1 MVP screens** after shell integration — navigable core on phone without new backend.

## Screens in scope

| SCR | Route | Mobile spec section | Desktop task |
|---|---|---|---|
| 01 | `/app` | §12.1 Command Center | [SCR-01](../screens/SCR-01-command-center.md) |
| 02 | `/app/brand` | §12.2 Brand List | [SCR-02](../screens/SCR-02-brand-list.md) |
| 03 | `/app/brand/[id]` | §12.3 Brand Detail | [SCR-03](../screens/SCR-03-brand-detail.md) |
| 04 | `/app/shoots` | §12.4 Shoots List | [SCR-04](../screens/SCR-04-shoots-list.md) |
| 08 | `/app/assets` | §12.7 Assets | [SCR-08](../screens/SCR-08-assets.md) |
| 11 | `/app/onboarding` | §12.8 Onboarding | [SCR-11](../screens/SCR-11-onboarding.md) |

## Per-screen acceptance (summary)

### Command Center
- KPI row 2×2 then snap-scroll; approval cards full-width; pull-to-refresh
- Insights trigger → intel sheet

### Brand List / Detail
- Stacked cards (avatar-left); segmented tabs snap-scroll on detail; 2-up asset grid
- Long-press context menu fallback for secondary actions

### Shoots List
- Table → stacked cards with thumb, status chip, DNA badge; filter chips snap-scroll

### Assets
- 2-up masonry grid; select mode via toggle (long-press in MOB-31); fullscreen viewer pinch/swipe

### Onboarding
- Full-screen steps; no tab bar on step 0; keyboard-aware footer; composer from step 1

## Shared patterns (§6)

- Desktop table → mobile stacked card (thumb-left, meta-right, status bottom)
- Skeleton / empty / error states match final layout at mobile widths
- Pull-to-refresh on list screens (optional MVP — document if deferred)

## Definition of Done

- [ ] Each of 6 routes verified at **390px** and **430px** — no horizontal overflow
- [ ] Cards/grids match §6 adaptation table
- [ ] Intel sheet opens with screen-appropriate label
- [ ] Composer placeholder matches route (registry)
- [ ] Loading/empty/error honest at mobile widths
- [ ] Evidence: screenshot set per screen in `docs/ecommerce/evidence/`

## Verification

```bash
cd app && npm run lint && npm run build && npm test
# extend Playwright design-v2 matrix for these 6 routes @390
```

## Split guidance

If diff >500 lines, split PRs: `mob-10a-cc-brands` · `mob-10b-shoots-assets` · `mob-10c-onboarding`

## Risk

Medium — mostly CSS/layout; Assets blocked until SCR-08 ships desktop UI

## Notes

Maps to implement.md **M3** (partial). Channel Preview + Matching deferred to MOB-20/30.
