# SCR-21 Booking Wizard — Plan

> **Design plan for the Booking Wizard prototype** (`11c`). Aligned with **Engineering Reference v1.0** (`../02-engineering-reference.md`); on any conflict that file wins. This wizard is a **DC prototype** — do not start React implementation until PR-5 merges (eng sign-off).
>
> ✅ **BUILT (2026-07-03) as a `flow` of the existing Shoot Wizard — not a separate file.** The Booking Wizard is `Pages/Shoot Wizard.v2.image-first.dc.html` with `flow="booking"` (or `?flow=booking&talent=…`). It **reuses the shell, `WizardStep` rail, header, footer, navigation, shared state, validation, mobile behavior, and loading/error/success** unchanged; only the 5 booking step *contents* + a flow-aware `names`/final-action were added. One reusable wizard, two workflows. Verified: shoot flow unchanged (10 steps); booking flow (5 steps) shows FieldReview HITL on Dates/Rate, EvidenceBlock, send-gate, `requested` status, 72h expiry.

## 1. What it is

- **Route:** `/app/matching/talent/[id]/book`
- **Agent:** `booking` (🔴 designed, not built) — **drafts only, never confirms**.
- **Purpose:** an operator sends a **booking request** to a talent/agency. The wizard's job ends at status **`requested`** — quoting, approval, and confirmation happen later in **SCR-22 Booking Detail**, not here.
- **Chat surface:** `OperatorChatDock` (center bottom), *not* IntelligencePanel (D9).
- **Entry:** SCR-20 Talent Profile "Request booking" · SCR-09 Shortlist "Send to shoot".
- **Exit:** Send → SCR-22 Booking Detail (`/app/bookings/[id]`), booking in `requested`.

## 1.5 Reuse the existing Shoot Wizard (required)

**Extend the shipped Shoot Wizard implementation — do not build a new wizard.**

> Do not create a new wizard framework, provider, layout, navigation, or shared state. Extend the existing Shoot Wizard (`Pages/Shoot Wizard.v2.image-first.dc.html`).

**Reuse without modification:** wizard shell/layout · `WizardStep` component · shared wizard state/provider · step navigation · sticky header/footer · progress rail · validation framework · loading / error / success patterns · unsaved-exit guard.

**Build only the new booking step *content*:** Step 1 Talent & Shoot · Step 2 Dates & Availability · Step 3 Rate & Terms · Step 4 Message · Step 5 Review & Send.

## 2. Position in the real FSM

```
(wizard scope) ─────────────►
[*] → requested → quoted → approved → confirmed
                                   ▲ operator-only, service_role
```

The wizard **only creates `requested`** via `create_booking_request`. It never shows Confirm. `requested` bookings **expire in 72h** (design shows "Expires {date}", not a button).

## 3. Steps

Reuses the **`WizardStep`** shell + shared state (like Shoot Wizard) and the **`FieldReview`** per-field HITL (built in SCR-24). AI-drafted fields carry the amber "AI · review" chip and the request **cannot be sent until every AI field is Approved or Edited**.

| # | Step | Fields | AI / HITL |
|---|---|---|---|
| 1 | **Talent & shoot** | talent (pre-filled from profile/shortlist, read-only card) · link to a shoot (optional `shoot_id`) or standalone | — |
| 2 | **Dates** | shoot dates (date range) · location | AI-suggested dates from the shoot → **FieldReview**; availability shown read-only: `tentative`/`booked` blocked, conflict → inline warning (not an error) |
| 3 | **Rate & terms** | day rate · number of days · usage/licensing · deliverables count | `booking` agent **drafts a rate range** → **FieldReview** per field. **Source of the suggestion (EvidenceBlock must name it):** agency default rate · the talent's previous bookings · the linked shoot's budget · tier pricing rules. **If no source exists, AI must not invent a value** — leave the field blank for manual entry. |
| 4 | **Message** | note to talent/agency | AI-draftable counter/intro text → editable |
| 5 | **Review & send** | full summary · 72h-expiry note · [Send booking request] | send-gate: locked until all FieldReview fields resolved |

## 4. HITL & guardrails (from engineering reference)

- **AI never confirms** — no "AI confirmed" copy anywhere; the wizard has no Confirm button at all.
- **FieldReview gate** — Send disabled (lock icon) until 0 AI fields remain unreviewed; sticky footer counts `n of m reviewed` (mono).
- **EvidenceBlock** — the rate suggestion's "why" opens EvidenceBlock (confidence + comps), never a bespoke popover.
- **Availability** — `tentative`/`booked` calendar cells are read-only; manual states are `available`/`blocked`.
- **Optimistic lock** — on a stale write show *"This booking was updated elsewhere — refresh"* (`stale_booking` 409). N/A on first create, but wire the pattern.
- **Unsaved-exit guard** — leaving with unsaved edits prompts **Stay** / **Discard** only. *(No Save Draft — booking draft persistence does not exist in the backend; see §10. If added later, it's future work.)*
- **Availability conflict priority** — `booked` → **hard block** · `blocked` → **hard block** · `tentative` → **warning** (allowed) · `available` → OK. **Send is prevented while any hard conflict exists** on the selected dates.

## 5. States to ship

populated (per step) · loading · **AI drafting** (streaming rate/dates, no spinner) · error · **send-gate locked** (fields unreviewed) · success (→ Booking Detail) · availability-conflict warning.

## 6. Error copy (map to codes — ref §9)

| Code | When | UI |
|---|---|---|
| `invalid date range` (400) | step 2 dates | field validation |
| availability conflict (`tentative`/`booked`) | step 2 | inline *"Talent is held/booked on these dates"* warning |
| `not a member of this organization` (403) | send | inline banner |
| `stale_booking` (409) | concurrent | refresh prompt |
| duplicate send | double-click | **disable Send after submit** (idempotency not yet in RPC) |

## 7. Component reuse (do NOT rebuild)

`WizardStep` shell + shared state · `FieldReview` (SCR-24) · `EvidenceBlock` · `StatusChip` · `OperatorChatDock` · availability calendar (read-only variant of SCR-20/23) · talent card (from SCR-09/20). **No contracts/payment UI** (D8). **No Confirm** (operator does it in Detail).

## 8. Acceptance criteria

- 5 steps; talent pre-filled; standalone or shoot-linked.
- Every AI-drafted field (dates, rate) carries a FieldReview chip; **Send locked until all resolved**.
- Rate "why" opens EvidenceBlock.
- No Confirm button; copy never implies AI booked/confirmed.
- Availability tentative/booked shown read-only; conflict warns inline.
- 72h expiry shown as info on Review.
- Send → success → routes to Booking Detail with booking in `requested`.
- Console clean; data-driven images use div-backgrounds (no `<img src="{{}}">`).

## 9. Build order

1. Shell + step rail + shared state (reuse Shoot Wizard pattern).
2. Step 1 talent/shoot (pre-fill).
3. Step 2 dates + read-only availability + conflict warn.
4. Step 3 rate/terms + `FieldReview` + EvidenceBlock (the HITL core).
5. Step 4 message.
6. Step 5 review + send-gate + 72h note + success→Detail.

---

## 10. Save Draft — removed (backend has no draft persistence)

There is **no `Save Draft`** button. The unsaved-exit guard offers **Stay / Discard** only. Draft persistence is **future work** — add a Save Draft path only when a booking-draft table/RPC exists; until then, do not imply drafts are saved.

## 11. Success flow (prevent duplicate submits)

```
[Send booking request]
   ↓  (button disables immediately on click — no double-submit)
Submitting…            ← inline spinner on the button only
   ↓  create_booking_request → status: requested
Success                ← brief confirmation
   ↓
Redirect
   ↓
SCR-22 Booking Detail  (status: requested · Expires {date})
```

The Send button **disables on first click** and stays disabled through Submitting/Success (RPC has no idempotency key yet, so the UI prevents duplicates).

## 12. Review summary (step 5, before Send)

Show a read-only **Booking Summary** card:

| Field | Example |
|---|---|
| Talent | @runwithkara (Micro · 42K) |
| Shoot | Nike SS26 — Studio 9 *(or "Standalone")* |
| Dates | Mar 12–14, 2026 |
| Rate | £1,200/day × 3 = £3,600 |
| Deliverables | 12 assets |
| Status on send | `requested` |
| Request expiry | 72h — expires Mar 5, 2026 |

## 13. Validation

- **Inline field errors** under each field (e.g. "Select shoot dates", "Rate required").
- **Top validation summary** appears only when **multiple** errors exist on a step — a compact list linking to each bad field.
- Send is blocked while any inline error **or** unresolved FieldReview **or** hard availability conflict remains.

## 14. Mobile (≤1024px)

- **Stepper** collapses to a compact "Step X of 5" pill + horizontal scroll rail (reuse Shoot Wizard mobile stepper).
- **Sticky footer** (Back / Continue / Send) respects `env(safe-area-inset-bottom)`.
- **Keyboard** — inputs scroll into the visible area above the on-screen keyboard; footer lifts with the keyboard.
- **Scrolling** — step body scrolls independently of the sticky header/footer.
- **Availability** renders a **compact month view** (single month, tap-to-inspect) instead of the desktop calendar.

## 15. Wizard progress indicator

Reuse the Shoot Wizard progress rail, plus a text readout in the header:

```
Step 3 of 5   ·   60% complete
```

Percent = (current step − 1) / 5 rounded; drives the existing progress rail fill.
