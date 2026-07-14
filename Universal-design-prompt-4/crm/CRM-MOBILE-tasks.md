# CRM Mobile — Task List

> **Scope:** phone layouts (390 px baseline) for the 6 CRM/Relationships screens, reusing the existing mobile system in `MOBILE-PLAN.md` (§1 shell · §2 breakpoints · §3 composer · §18 tablet). **Design-lane, no schema needed** — all fixtures, same "sample data · not yet wired" honesty as desktop.
> **Breakpoint of record:** mobile = **`< 1024px`** (rail hidden, panel→sheet). Tablet 768–1024 per §18.
> **Reuse, don't reinvent:** every pattern below already exists in `Pages/SCR-MOBILE-Gallery.dc.html` **except** the kanban→accordion (SCR-30) — that's the one genuinely new mobile piece.
> Legend: 🟢 done · 🟡 in progress · 🔴 blocked · ⚪ not started.
> **🟢 BUILT (2026-07-05):** all 6 frames live in **`Pages/SCR-MOBILE-CRM-Gallery.dc.html`** — DOM-verified: 0 holes, 97 icons render, accordion toggles (chevron flip + deals reveal), Insights sheet opens/closes per frame. See §6 for the tightening spec (audit-driven) that Claude Code implements in React.

---

## 0. Progress tracker

| # | Task | Status | Note |
|---|---|:--:|---|
| **Shared chrome** ||||
| C1 | Bottom tab bar — Relationships context (Orgs · People · Pipeline · Inbox · More) | 🟢 | built; 5 slots, active per screen |
| C2 | Top app bar — title + Insights + hamburger | 🟢 | built; `+ New` CTA map in §6.2 |
| C3 | Persistent `crm-assistant` composer above tab bar | 🟢 | built; chips + "not yet wired" |
| C4 | Insights BottomSheet (per screen) | 🟢 | built; toggles per frame, summary + rows |
| **Screens** ||||
| S26 | SCR-26 Organizations — card list | 🟢 | kind filter chips + search + rows |
| S27 | SCR-27 Organization 360° — header + tab strip + AI summary | 🟢 | kind chip in header; fields |
| S28 | SCR-28 People — card list | 🟢 | role filter chips + search + rows |
| S29 | SCR-29 Person 360° — stacked contact arrays | 🟢 | role chip; email/phone fields |
| S30 | **SCR-30 Pipeline → stage accordion** | 🟢 | **built + interactive** — 6 collapsible stages, HITL banner |
| S31 | SCR-31 Deal Detail — health + fields + HITL + actions | 🟢 | approval note; action buttons |
| **Cross-cutting** ||||
| X1 | States per screen — skeleton · empty · error | 🟡 | populated built; loading/empty/error = §6.3 (Claude Code) |
| X2 | A11y — ≥44px targets, focus-trap sheets, `aria-live`, kanban keyboard-move | 🟡 | targets met; drag-alt + focus-trap = Claude Code |
| X3 | Build deliverable — `Pages/SCR-MOBILE-CRM-Gallery.dc.html` | 🟢 | **built** (option b — self-contained CRM gallery) |

---

## 1. Shared mobile chrome (build once, all 6 reuse)

**C1 · Bottom tab bar** — fixed, 56px + `safe-area-inset-bottom`, 5 slots max. Relationships context:
`Organizations · People · Pipeline · Inbox · More`. Active = filled icon + label; ≥44px hit area. (§1.1)

**C2 · Top app bar** — 52px + `safe-area-inset-top`: hamburger (→ workspace switcher sheet) · centered screen title · top-right context action (`+ New org/person/deal`). (§1.2)

**C3 · Persistent composer** — docked above the tab bar (48px collapsed), agent label **"Relationships Assistant · not yet wired"**, Insights pill + 2–3 proactive chips, ⊕ + input + black send (no mic). Swipe-up → 94vh chat sheet, tab bar hides. (§3). Chips per screen:
- Organizations: "Quiet orgs" · "At-risk deals" · "Draft follow-up"
- People: "Models by brand" · "Never-pitched" · "Log activity"
- Pipeline: "At-risk deals" · "Best next move" · "Move stage"
- Deal Detail: "Draft follow-up" · "Why at risk?"

**C4 · Insights sheet** — header **Insights** button → BottomSheet (half detent) with the same IntelligencePanel content as desktop (quick facts + EvidenceBlock + action rows). Separate surface from chat.

---

## 2. Per-screen mobile treatment

### S26 · Organizations `/app/crm/companies`
- **List of org cards** (logo · name · kind chip · industry · last-activity · deal count). Tap → SCR-27.
- **Filter chips** (snap-scroll): All · Brand · Agency · Vendor · Sponsor + search field.
- Insights sheet: "2 orgs quiet 14+ days" + needs-attention rows.
- States: skeleton rows · empty ("no organizations — add one") · error+retry.

### S27 · Organization 360° `/app/crm/companies/:id`
- **Header:** logo · name · **kind chip** · status badge · domain/industry/owner meta.
- **Tab strip** (horizontal-scroll, ≥44px): Overview · Contacts · Deals · Activity.
- Unified **activity timeline** in Activity tab; Overview = fields + AI summary card.
- Insights sheet + composer scoped to this org.

### S28 · People `/app/crm/contacts`
- **List of person cards** (avatar · name · **role chip** · org · primary email · last-activity). Tap → SCR-29.
- **Filter chips:** All · Contact · Model · Photographer · Crew + search. (Photographer/Crew rows carry the honest "Phase 2 — no table yet" note where relevant.)
- States as S26.

### S29 · Person 360° `/app/crm/contacts/:id`
- **Header:** avatar · name · **role chip** · role/org line.
- **Multi email/phone arrays** stacked vertically (each labeled + primary star) — the desktop 2-col becomes 1-col.
- Linked deals + activity tabs; Insights sheet.

### S30 · Pipeline `/app/crm/pipeline` — **stage accordion (the hard one)**
- Desktop kanban's horizontal columns don't fit a phone. **Reflow to a vertical accordion:** 6 collapsible stage sections (Lead · Qualified · Proposal · Negotiation · Won · Lost), each header showing **count + total value**; expand to reveal that stage's deal cards (company · value · days-in-stage · risk dot).
- **HITL banner** retained: "Won / Lost require approval".
- Move-stage on mobile = tap deal → action sheet with stage options (no drag). **Keyboard/button move is the a11y requirement** (X2).
- Board-health summary lives in the Insights sheet.
- States: skeleton stage headers · empty stage ("no deals here") · error+retry.

### S31 · Deal Detail `/app/crm/pipeline/:id`
- Header (deal name · company · value · stage chip). Scrollable body: stage control, deal fields, activity, EvidenceBlock (deal health).
- **Sticky action bar** above safe-area: stage-advance + **won/lost & convert gated behind ApprovalCard** (HITL — never auto).
- States as others.

---

## 3. Cross-cutting

**X1 · States** — every screen ships skeleton → content, empty, and error+retry (reuse the gallery archetypes; no dead spinners).

**X2 · Accessibility** — ≥44px targets throughout; sheets trap focus + restore on close; toast `aria-live`; **kanban needs a keyboard/button move alternative to drag** (spec here, build is Claude Code). Colour never sole carrier — pair stage/risk hue with a text label.

**X3 · Build deliverable (decision needed)** — two options:
- **(a)** Add 6 CRM frames to the existing `Pages/SCR-MOBILE-Gallery.dc.html` (one gallery, all platform screens together).
- **(b)** New `Pages/SCR-MOBILE-CRM-Gallery.dc.html` (keeps CRM self-contained, mirrors the `crm/` folder treatment). **← recommended** for organisation parity with the desktop CRM set.

---

## 4. What this is / isn't

- **Is:** phone layouts on fixtures, reusing the mobile system; one new pattern (kanban accordion).
- **Isn't:** new features, new data, responsive React (that's Claude Code — container queries, real routes, the drag a11y implementation). Composer summaries stay **fixtures until Phase 2** (`crm-assistant` unwired), same honesty rule as desktop.

---

## 6. Tightening spec (audit-driven — Claude Code implements in React)

> Added from the 91/100 mobile-plan audit. The DC gallery **demonstrates** the layout; these rules pin down behavior the static gallery can't show. All still design-lane specs (no schema).

### 6.1 Mobile route map (every tap resolves — no dead ends)
| From | Tap | To |
|---|---|---|
| Organizations (S26) | org row | Organization 360° (S27) |
| People (S28) | person row | Person 360° (S29) |
| Pipeline (S30) | deal card | Deal Detail (S31) |
| Organization 360° (S27) | "Linked brand ↗" | existing Brand Detail |
| Person 360° (S29) | "Organization ↗" | Organization 360° (S27) |
| Deal Detail (S31) | company name | Organization 360° (S27); linked shoot → existing Shoot Detail |
| Any bottom tab | Orgs / People / Pipeline / Inbox / More | that screen; **Inbox = existing Notification Center (SCR-15)**, not a new feed |

### 6.2 Per-screen `+ New` CTA + chip map
| Screen | `+ New` creates | Composer chips open |
|---|---|---|
| S26 Organizations | New organization (kind picker) | Quiet orgs · At-risk deals · Draft follow-up |
| S28 People | New person (role picker) | Models by brand · Never-pitched · Log activity |
| S27 Org 360° | New activity / deal on this org | Summarize account · Draft check-in · Open deals |
| S29 Person 360° | New activity on this person | Draft follow-up · Recent activity |
| S30 Pipeline | New deal | At-risk deals · Best next move · Move stage |
| S31 Deal Detail | Log activity | Draft follow-up · Why at risk? |

### 6.3 State matrix (per screen — populated built; rest = Claude Code)
| Screen | populated | loading | empty | error |
|---|:--:|---|---|---|
| S26 / S28 lists | 🟢 | skeleton rows | "No {orgs/people} — add one" | banner + Retry (filters preserved) |
| S27 / S29 360° | 🟢 | header skeleton + shimmer fields | tab with no data → "Nothing here yet" | inline retry |
| S30 Pipeline | 🟢 | skeleton stage headers | empty stage → "No deals in this stage" (already shown) | board banner + Retry |
| S31 Deal | 🟢 | field shimmer | — | inline retry |
| Insights sheet | 🟢 | "Analyzing…" line | "No insights yet" | "Couldn't load — Retry" |

### 6.4 Keyboard & safe-area rules (stacking order, top→bottom)
- **Fixed order every screen:** status bar → top app bar → scrollable content → **composer** → bottom tab bar. Content region reserves bottom padding = `composer height + tab bar height + safe-area` so nothing hides behind the dock.
- **Keyboard open:** use `visualViewport` — the composer sticks to the keyboard top; the tab bar hides; content shrinks (never covered). On blur, both restore.
- **Composer:** compact single line by default; chips are a snap-scroll row (collapsible); swipe-up → 94vh chat sheet (tab bar hides, composer pinned to sheet bottom).
- `env(safe-area-inset-bottom)` on tab bar + composer; `env(safe-area-inset-top)` on app bar.

### 6.5 Terminal-stage approval = focused sheet (not just a sticky button)
On S31, **won / lost / convert** open a **confirmation BottomSheet** (not a one-tap sticky button) — title, before→after state ("Proposal → **Won**"), the ApprovalCard rationale/EvidenceBlock, and explicit **Confirm / Cancel**. Prevents an accidental critical action. Stage *advance* (non-terminal) can stay a direct button.

### 6.6 Screen-specific polish (P2, from audit)
- **S26:** row overflow actions (Open · Log activity · New deal) via long-press → action sheet.
- **S27:** sticky mini-summary (name + kind + status) under the header when scrolled.
- **S29:** email/phone rows are tap targets (copy / mail / call placeholders).
- **S30:** an "expand/collapse all stages" control; keep all 6 stage headers always visible (counts + value) so stages stay comparable even when collapsed — **already the case** (headers persist; only deals collapse).
- **S31:** the terminal-approval sheet above.

### 6.7 Verification plan
- ✅ **390 baseline** — DOM-verified (0 holes, icons, accordion, Insights sheet).
- ⚪ **430 · 768 · 1024** — Claude Code, after the responsive React build (container queries). Tablet 768–1024 per `MOBILE-PLAN.md §18`.

---

## 5. Suggested build order
1. C1–C4 shared chrome (unblocks all screens).
2. S26 + S28 (lists — cheapest, most reuse).
3. S27 + S29 (360° — shared header/tab pattern).
4. **S30 accordion** (the one non-trivial reflow).
5. S31 (deal detail + sticky ApprovalCard).
6. X1 states + X2 a11y pass, then X3 assemble the gallery.
