# SCR-22 Booking Detail — Plan

> **Design plan for the Booking Detail prototype** (`11c`). Aligned with **Engineering Reference v1.0** (`../02-engineering-reference.md`); on conflict that file wins.
>
> ✅ **BUILT (2026-07-03) as a `flow` of the existing Shoot Detail — not a separate detail framework.** Booking Detail is `Pages/Shoot Detail.v2.image-first.dc.html` with `?flow=booking&talent=<id>&status=<status>` (or the `flow` tweak). It reuses the **3-panel shell, NavSidebar, Workspace, IntelligencePanel, OperatorChatDock, tab chrome, hero, timeline, and Call Sheet modal** unchanged; only booking tab *content* was added.

## Route & agent
- **Route:** `/app/bookings/[id]` (prototype: `?flow=booking`).
- **Agent:** `booking` (🔴 designed) — drafts/explains only. **Confirm is operator-only, never AI.**
- **Entry:** Wizard Send → `?flow=booking&talent=&status=requested`; dashboards; notifications.

## Reused patterns (no duplication)
3-panel shell · NavSidebar · Workspace · IntelligencePanel · OperatorChatDock · tab row · hero + status chip + avatar stack · Activity timeline · Call Sheet modal. Shoot-only chrome (Edit shoot, shot progress) is hidden in booking via display flags; shoot tab panels are gated `isShoot` so they never render in booking.

## Booking tabs (variant set — driven by shared `FLOWCFG`)
**Overview · Talent · Availability · Approvals · Activity** — configured in one `FLOWCFG` object per flow (extensible to casting/campaign/vendor/event), not scattered `isBooking` branches. `tabDef`, page title/subtitle, and chat context all read from `FLOWCFG[flow]`; shoot falls back to defaults. Tabs map onto existing patterns: Schedule→**Availability**, Budget→**Rate & quote** (in Overview), Approvals→**booking approval** (ApprovalCard pattern), Activity→**booking timeline**.

### Overview
- **Status stepper:** `requested → quoted → approved → confirmed` (current highlighted; declined/cancelled terminal).
- **Rate & quote** summary (day rate · days · total · usage · deliverables).
- **EvidenceBlock** — "Why this rate" (74% confidence + rationale; AI drafted, cannot confirm).
- **Operator actions** (FSM-aware): `requested`→ Approve as-is / Decline · `quoted`→ Approve quote / Decline · `approved`→ **Confirm booking** (operator-only) / Cancel · `confirmed`→ "Added to shoot crew" note.
- **Request expiry** banner (72h) on `requested`.
- **Availability** note (available/blocked/booked read-only).

### Talent
Talent summary card (portrait, handle, tier/meta) + "View full profile" → SCR-20.

### Activity
Approval timeline: request sent · talent response · operator approval · confirmed→crew (operator only · never AI).

## Guardrails (engineering reference)
- **AI never confirms** — confirm is an explicit operator action after `approved`; copy states "operator-only".
- **Confirmed → `shoot.shoot_crew`** upsert (crew row appears only after confirmed).
- FSM status writes are RPC-only in production (`transition_booking`; `confirm_booking` service-role).
- No contracts / payment UI (D8).

## Acceptance criteria (met)
- Reuses Shoot Detail shell/hero/tabs/chat/panel; shoot flow unchanged (9 tabs, "Street Series").
- Booking flow: 3 tabs, talent hero, status chip, stepper, rate, EvidenceBlock, operator-only actions, expiry, availability, timeline.
- FSM advances requested→approved→confirmed via operator actions; verified.
- Console clean; no `{{ }}` holes; data-driven image uses `.photo` background (no `<img src="{{}}">`).
