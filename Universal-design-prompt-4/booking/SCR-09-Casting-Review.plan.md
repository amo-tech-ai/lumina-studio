# SCR-09 · Casting Review Mode — Design Plan

> **Extends** the existing Matching → **Talent Matches** tab (`Pages/SCR-09-Matching-Talent.dc.html`). **Not** a new screen, route, workflow, or backend. Route stays `/app/matching` → Talent tab.
> **Purpose:** fast, professional model review for casting — one focused model at a time, decide in seconds, build a shortlist.
> **Tone rule (hard):** professional casting language only. **Never** Like · Match · Superlike · hearts · confetti · dating-app copy. Actions are **Skip · Shortlist · View Profile**.

---

## 1. Modes (segmented control on the Talent tab)

| Mode | What it is | Default |
|---|---|---|
| **Casting Review** | One focused model card + always-visible action bar; review the stack one at a time | ✅ Desktop **and** Mobile default |
| **Grid** | The existing 3-up card grid (today's Talent tab) | — |
| **List** | Dense one-row-per-model list (photo · name · fit · location · rate · availability) | — |

The mode switch is a segmented control in the Talent filter bar. Mode is UI state only — same `search_talent` result set feeds all three; switching never refetches.

**Reuse (no new logic):** existing Talent tab · shortlist drawer · EvidenceBlock (`Why this fit?`) · IntelligencePanel · `model-match` agent · `search_talent` RPC · `toggle_shortlist_item` RPC.

---

## 2. Casting card (one focused model)

```
┌──────────────────────────────┐
│  [ 3:4 model photo ]     94   │  ← fit score, top-right
│                          fit  │
│                               │
│  ● Available                  │  ← availability, on photo
│  Kara Mensah                  │  ← name (not @handle in casting)
│  Aperture Agency · London     │  ← agency / independent · location
│  ────────────────────────     │
│  Rate tier: ££ (mid)          │  ← rate tier (not exact £)
│  Running · Editorial · Athlete│  ← ≤3 tags
│  "Strong athlete-lifestyle    │  ← one-line AI rationale
│   fit for Nike's SS26 tone."  │
│  Why this fit? ›              │  ← opens EvidenceBlock
├──────────────────────────────┤
│  [ Skip ]  [ Shortlist ]  [ View Profile ]   │  ← always-visible action bar
└──────────────────────────────┘
```

Fields (all from `search_talent` / `model-match`): 3:4 photo · fit score · **name** · agency or "Independent" · location · availability · **rate tier** (££ band, not exact rate) · **≤3 tags** · **one-line AI rationale** · **Why this fit?** → EvidenceBlock (fit pillars + confidence, reuses IntelligencePanel breakdown).

---

## 3. Actions & interaction rules

| Action | Button (always visible) | Gesture (enhancement) | Keyboard |
|---|---|---|---|
| **Skip** | ✅ left button | swipe **left** | **←** |
| **Shortlist** | ✅ middle (primary) | swipe **right** | **→** |
| **View Profile** | ✅ right button | swipe **up** | **↑** |

- **Buttons are the source of truth** — gestures and keys are enhancements. **No gesture-only action** (accessibility requirement).
- Each action fires an **`aria-live="polite"` toast**: "Skipped Kara Mensah" · "Shortlisted Kara Mensah" · "Opening profile…".
- **Shortlist** calls `toggle_shortlist_item`; card shows a brief pending state, then advances to the next model.
- **Skip** advances without writing; skipped models are recoverable via an "Undo" affordance in the toast (5s).
- **View Profile** opens the model profile (SCR-20) — does not consume the stack position.
- Advancing is animated (card out, next in); reduced-motion → instant.

---

## 4. States

| State | Trigger | Casting Review render |
|---|---|---|
| **loading** | initial fetch | card-shaped skeleton (photo block + text lines shimmer) |
| **populated** | ≥1 model in stack | focused card + action bar + "N of M" counter |
| **empty filters** | filters exclude all | "No models match these filters — loosen them" + Reset filters |
| **empty reviewed stack** | every model reviewed | "You've reviewed all M models — view your shortlist" + View shortlist CTA |
| **pending shortlist** | `toggle_shortlist_item` in flight | shortlist button spinner; card holds until resolve |
| **error** | RPC error | inline "Couldn't load matches" + Retry |
| **no organization** | user has no org context | "Join or create an organization to review talent" + no card |

Empty/loading/error reuse the gallery **state archetypes** (`MOBILE-IMPROVE §7`).

---

## 5. Desktop wireframe (3-panel shell — unchanged chrome)

```
┌────┬──────────────────────────────────────────┬─────────────────────┐
│ 56 │  Matching › Nike            [Shortlist 3] │  Talent fit          │
│ px │  ┌ Creator  Asset  Product  ▸Talent ┐     │  ┌────┐ Kara Mensah  │
│nav │  Fit≥80  Tier  Platform  Avail   [◧ Casting│Grid│List]  Aperture│
│    │                                           │  94  DNA fit         │
│    │            ┌───────────────────┐          │  Brand tone   95 ▓▓▓ │
│    │            │  [3:4 photo]   94 │          │  Visual style 92 ▓▓  │
│    │            │  ● Available      │          │  Audience fit 88 ▓▓  │
│    │            │  Kara Mensah      │          │  Content      86 ▓   │
│    │            │  Aperture·London  │          │  [Explain fit score] │
│    │            │  ££  Running·Edit │          │  [View full profile] │
│    │            │  "Strong fit…"    │          │  [Add to shortlist]  │
│    │            │  Why this fit? ›  │          │                      │
│    │            ├───────────────────┤          │                      │
│    │            │ Skip │Shortlist│Profile        │                      │
│    │            └───────────────────┘  2 of 8   │                      │
│    │  ── OperatorChatDock: "8 bookable ≥80% fit…" [chips] [ask] ──     │
└────┴──────────────────────────────────────────┴─────────────────────┘
```

- **IntelligencePanel** (right) shows the focused model's fit breakdown automatically (no click needed — the focused card IS the selection). "Why this fit?" scrolls/expands the EvidenceBlock there.
- **OperatorChatDock** persists (model-match context) — unchanged.

---

## 6. Mobile wireframe (full-screen casting deck)

```
┌─────────────────────────┐
│ 9:41            ▐ ▐ ▮    │  status bar
│ ‹ Casting review    ✦   │  header · Insights ✦ (bottom sheet)
├─────────────────────────┤
│                         │
│     [ 3:4 photo ]   94  │  full-bleed focused card
│                         │
│   ● Available           │
│   Kara Mensah           │
│   Aperture · London     │
│   ££ · Running·Editorial│
│   "Strong athlete fit…" │
│   Why this fit? ›       │
│                    2/8  │
├─────────────────────────┤
│  ◀ Skip  ★ Shortlist  ⤴ Profile │ ← fixed action bar, above safe area
├─────────────────────────┤
│ ✦ Insights ·chips·      │  persistent AI composer stays
│ [ Ask the Matching…  ▲ ]│
└─────────────────────────┘
```

- **Full-screen deck**, one card. **Fixed action bar above the safe area** (never under the composer).
- **Insights** opens as a **bottom sheet** (fit pillars + EvidenceBlock).
- **Persistent AI composer** remains available below the action bar.
- **No horizontal overflow**; swipe left/right/up are enhancements over the three buttons.

---

## 7. Shortlist drawer — open state (reused, unchanged)

```
                         ┌─────────────────────┐
                         │ Shortlist  3     ✕  │
                         ├─────────────────────┤
                         │ [img] Kara Mensah 94│
                         │ [img] Lena Moves  90│
                         │ [img] Studio Mira 86│
                         ├─────────────────────┤
                         │  [ Send to shoot ]  │
                         └─────────────────────┘
```
Right-side slide-over (existing `slideIn`), Send to shoot → Booking flow. Empty state: "Save models to build a shortlist, then send it to a shoot."

---

## 8. Implementation checklist (Claude Code)

- [ ] Add `mode` UI state (`casting` default | `grid` | `list`) to the Talent tab; segmented control in filter bar.
- [ ] Casting card component: 3:4 photo, fit, name, agency/independent, location, availability, rate tier, ≤3 tags, one-line rationale, Why-this-fit → EvidenceBlock.
- [ ] Stack cursor (`index`) over the `search_talent` result set; "N of M" counter.
- [ ] Skip (advance, no write, 5s Undo) · Shortlist (`toggle_shortlist_item`, pending → advance) · View Profile (→ SCR-20, no consume).
- [ ] Always-visible action bar; swipe L/R/Up + keyboard ←/→/↑ as enhancements.
- [ ] `aria-live="polite"` toast region; label every icon-only button.
- [ ] All 7 states (loading/populated/empty-filters/empty-stack/pending/error/no-org).
- [ ] Mobile: full-screen deck, fixed action bar above safe area, Insights bottom sheet, composer persists, no horizontal overflow.
- [ ] Grid & List modes render the same result set (Grid = today's cards).
- [ ] Reduced-motion: no card-fly animation; instant advance.

## 9. Verification checklist

- [ ] Casting Review is the default on desktop **and** mobile.
- [ ] No dating language anywhere (no Like/Match/Superlike/hearts/confetti).
- [ ] Every action reachable by **button** (not gesture/keyboard only).
- [ ] Keyboard ←/→/↑ operate Skip/Shortlist/Profile; focus visible.
- [ ] aria-live toast announces each action.
- [ ] Why-this-fit opens EvidenceBlock (fit pillars + confidence).
- [ ] Shortlist writes via `toggle_shortlist_item`; drawer count updates.
- [ ] All 7 states render; empty-stack routes to shortlist.
- [ ] Mobile: action bar above safe area, no horizontal scroll, composer + Insights both reachable.
- [ ] Grid/List modes switch with no refetch.
- [ ] 0 console errors; 0 unresolved template holes.
