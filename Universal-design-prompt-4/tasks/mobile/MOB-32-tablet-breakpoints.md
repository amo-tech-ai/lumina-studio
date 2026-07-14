# MOB-32 — Tablet breakpoints (768–1024)

| Field | Value |
|---|---|
| **ID** | MOB-32 |
| **Priority** | P4 |
| **Complexity** | S–M |
| **Status** | ⚪ Not Started |
| **Linear** | [IPI-423](https://linear.app/amo100/issue/IPI-423) · replaces IPI-301 |
| **Dependencies** | MOB-04 |
| **Unblocks** | MOB-90 |
| **Branch** | `ipi/mob-32-tablet` |
| **Sources** | [`MOBILE-PLAN.md`](../../docs/Mobile/MOBILE-PLAN.md) §18 · §19.8 · §20.3 · MOBILE-005 |

## Objective

**Verify + decide** tablet layout at 768px and 1024px — not blind build. Replaces canceled **IPI-301**.

## Decision tree

1. Run every shipped operator screen at **768px** and **1024px**
2. Document: is "rail hidden until 1024" acceptable on iPad landscape?
3. **If yes:** close with rationale — no code (or minor padding tweaks only)
4. **If no:** file design request for 2-pane spec (§18: nav rail + workspace, intel still sheet) — **then** implement in follow-up MOB-32b

## §18 target (if greenlit)

| Band | Layout |
|---|---|
| 768–1023 portrait | Mobile-plus: 2-up cards, intel sheet |
| 768–1023 landscape | Collapsed rail + workspace + ~300px inline intel optional |
| Wizard | Full-screen both bands |

Container queries: use **app width** not device width (iPad split-view).

## Definition of Done

- [ ] Verification matrix filled for core routes @768 + @1024
- [ ] Written decision in evidence doc (accept current OR link to new design spec)
- [ ] If implementing 2-pane: container-query driver + no regression @390
- [ ] Playwright viewport tests added for 768 if behavior codified

## Verification

```bash
# manual DevTools + optional Playwright project tablet
cd app && npm run test:e2e  # if specs added
```

## Risk

Low if verify-only; Medium if 2-pane build without design sign-off — **do not build ahead of spec**

## Notes

Booking set tablet rules in §19.8 / §20.3 covered under [MOB-40](./MOB-40-booking-set-mobile.md) when those routes exist.
