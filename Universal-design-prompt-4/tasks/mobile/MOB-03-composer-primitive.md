# MOB-03 — Composer primitive (persistent dock)

| Field | Value |
|---|---|
| **ID** | MOB-03 |
| **Priority** | P3 |
| **Complexity** | L |
| **Status** | ⚪ Not Started |
| **Linear** | [IPI-418](https://linear.app/amo100/issue/IPI-418) · blocked IPI-417 |
| **Dependencies** | MOB-01 (expanded chat uses sheet) |
| **Unblocks** | MOB-04 · MOB-10 · MOB-40 |
| **Branch** | `ipi/mob-03-composer` |
| **Sources** | [`COMPOSER-PRIMITIVE.spec.md`](../../docs/models/COMPOSER-PRIMITIVE.spec.md) · [`MOBILE-PLAN.md`](../../docs/Mobile/MOBILE-PLAN.md) §3 · §21 |

## Objective

Build the **persistent context-aware composer** pinned above the bottom tab bar — collapsed strip, streaming checklist, expanded 94vh chat sheet. Insights stays a separate header button (not merged).

## Design source

- `docs/models/COMPOSER-PRIMITIVE.spec.md` (API + state machine)
- `docs/handoff/composer-registry.ts` (route → assistant, placeholder, chips)
- `screens/SCR-MOBILE-Booking-Shell.dc.html` (collapsed composer @390)

## Key behavior

- **Collapsed:** 48px composer at `bottom: tabBar + safe-area`; agent label strip 28px when message pending
- **Expanded:** swipe up / tap label → 94vh sheet; tab bar hidden; composer above keyboard (`keyboard-inset`)
- **variant=`inline`:** wizard mode — no tab offset, no 94vh expand (SCR-06)
- Chips row: HITL-safe verbs only — never Accept/Confirm/Send
- Present on every screen **except** Onboarding step 0
- Workspace `padding-bottom` = dock + tabs + safe area (no overlap)

## Files likely to create

- `app/src/components/operator-panel/composer/composer-primitive.tsx`
- `app/src/components/operator-panel/composer/use-composer-context.ts`
- Wire to existing CopilotKit runtime (route-scoped agent from registry)

## Definition of Done

- [ ] `ComposerPrimitiveProps` matches spec §2
- [ ] Route registry resolves label, placeholder, chips from `context.route` + `role`
- [ ] Collapsed → expanded sheet; tab bar hides when expanded
- [ ] Streaming strip shows ≤3 lines + pulse (fixture OK until Phase 2 agents)
- [ ] `variant='inline'` works for wizard footer stack
- [ ] Composer never overlaps tab bar at 390px
- [ ] `aria-live="polite"` on streaming strip; input labelled
- [ ] Tests for registry resolution + collapsed/expanded state

## Verification

```bash
cd app && npm run lint && npm test -- composer
# manual: /app + /app/shoots — placeholder changes per route
```

## Risk

High — touches CopilotKit + layout; ship MOB-01 first; use fixtures until agent streaming wired

## Notes

Build **before** per-screen mobile passes (MOB-10). Agent streaming to real Mastra = Phase 2; UI can ship with fixtures per §21.8 data-liveness.
