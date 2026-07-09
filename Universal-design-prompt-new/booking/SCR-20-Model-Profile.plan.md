# Model Profile (AI-Native) — Plan

> Plan to build an **AI-native Model Profile** by **extending the existing Talent Profile (SCR-20)** on the shared 3-panel shell — no new layout, no new components. Aligned with **Engineering Reference v1.0** (`../02-engineering-reference.md`): IntelligencePanel = persistent AI awareness (never chat), OperatorChatDock = the only conversational surface (D9), all AI actions HITL.
>
> Basis: `screens/SCR-20-Talent-Profile.dc.html` (built — hero, portfolio, details, availability, reviews, fit IntelligencePanel, chat dock). This plan adds a **Model Profile view** (talent-owned self-profile) as a `mode` of SCR-20, reusing every pattern.

## 1. What & why

- **Route:** `/app/matching/talent/[id]` (operator view) · `/app/talent/profile` (model self-view). Same screen, `mode = operator | model`.
- **Agents:** `model-match` (fit/scoring, operator) · `booking` (self-view, talent-scoped). Both 🔴 designed.
- **Goal:** one profile screen that is complete (portfolio, measurements, availability, bookings, reviews, documents, activity) and AI-native (right-panel awareness + proactive dock), for both the operator evaluating and the model maintaining their profile.

## 2. Reuse (no duplication)

Navigation (NavRail) · **IntelligencePanel** · **OperatorChatDock** · Hero · **StatusChip** · **EvidenceBlock** · Timeline · Card system · Gallery (portfolio grid) · **BottomSheet** (mobile). New content only — no new components.

## 3. Sections (center workspace tabs)

| Tab | Content | Reuses |
|---|---|---|
| **Overview / Hero** | portrait, handle, tier, availability chip, rating, fit badge, CTAs | Hero + StatusChip |
| **Portfolio** | editorial 3:4 gallery (masonry) | Gallery |
| **Measurements** | height, sizes, hair/eyes, shoe — key/value grid | Card system |
| **Availability** | month calendar, 4 states (available/tentative/booked/blocked) | existing availability calendar (read-only for operator; editable for model) |
| **Booking history** | past bookings across the full lifecycle | Timeline / cards + StatusChip |
| **Reviews** | brand reviews + rating | existing reviews cards |
| **Documents** | model release, ID/agency docs — **operator: read-only · model: view + edit metadata (no upload in MVP)** | Card list |
| **Activity** | profile + booking events timeline | Timeline |

## 4. Right IntelligencePanel (persistent AI)

| Block | Operator view | Model self-view |
|---|---|---|
| **AI summary** | "94% fit for Nike; available Mar 12–14" | "Profile 92% complete; 2 offers waiting" |
| **Booking health** | 4 completed · 1 active · 4.9★ | earnings + upcoming |
| **Availability risk** | "Held Apr 3 — may conflict" | "Blocked dates reduce your matches" |
| **Fit score** | 94 + pillar breakdown → **EvidenceBlock** | how brands see you |
| **Recommended brands** | brands this model fits | brands to pitch |
| **Agent status** | idle/thinking | idle/thinking |
| **Activity** | recent evidence-linked events | recent events |

**EvidenceBlock appears on:** fit score, rate suggestion, availability-risk, and any AI recommendation — not "all scores".

## 5. Bottom OperatorChatDock (proactive, HITL)

- **Contextual greeting** (operator): "@runwithkara — 94% fit for Nike, available Mar 12–14."
- **Quick action cards (HITL-safe):** `[Add to shortlist] [Request booking] [Compare with shortlist] [Explain fit]` — *Request booking* opens the Wizard `flow=booking`; the actual send/accept stays a human action.
- **Model self-view cards:** `[Review offers] [Edit availability] [Improve profile] [Preview as brand]`.
- **Conversation memory:** current model + selected booking/offer (UI state until Phase 2).

## 6. Workflows

```mermaid
flowchart TD
  MA["Matching Talent tab"] --> MP["Model Profile (operator)"]
  MP -->|Request booking (HITL)| BW["Booking Wizard flow=booking"]
  MP -->|Add to shortlist| SL["Shortlist drawer"]
  SP["Signup / settings"] --> MPS["Model Profile (self-view)"]
  MPS -->|Edit availability| AV["Availability calendar"]
  MPS -->|Review offers (HITL)| RD["Role Dashboard offers"]
  MP -.panel/dock.-> AI["model-match / booking agent (draft+explain only)"]
```

## 7. User journeys

- **Operator evaluates talent:** Matching → open Model Profile → reads AI summary + fit (EvidenceBlock) without typing → Request booking (HITL) → Wizard.
- **Model maintains profile:** self-view → dock says "Profile 92% complete; add 2 portfolio shots" → edits portfolio/availability → reviews incoming offers (Accept/Decline HITL).
- **Agency reviews a model:** roster → Model Profile → booking health + availability risk in panel → prepares an offer (HITL).

## 8. Wireframes

### Desktop (3-panel)
```
┌────┬────────────────────────────────────────┬───────────────────────┐
│Nav │ Matching › Talent › @runwithkara [Book]│ ✦ model-match         │
│ ▓  │ [portrait] @runwithkara  Fit 94 ▓▓▓░    │ AI summary            │
│    │ Micro · 42K · ◍ Available · ★4.9        │ Booking health        │
│    │ Portfolio|Measure|Availab|Bookings|     │ Availability risk     │
│    │  Reviews|Documents|Activity             │ Fit 94 → EvidenceBlock│
│    │ ▐##  ▐##  ▐##   ← gallery / tab content  │ Recommended brands    │
│    │ ──────────────────────────────────────  │ Agent · Activity      │
│    │ [ dock: "94% fit for Nike…" +cards ]    │                       │
└────┴────────────────────────────────────────┴───────────────────────┘
```

### Tablet (768–1024)
```
Right IntelligencePanel → collapsible (toggle); workspace widens.
Dock stays pinned bottom. Tabs scroll horizontally.
```

### Mobile (<768)
```
Single column. IntelligencePanel → BottomSheet (sheet button in header).
Dock → collapsed launcher (tap to expand). Hero + tabs stack;
portfolio 2-up. Availability = compact month.
```

## 9. UI / UX layout rules

- 3-panel grid `56px · minmax(0,1fr) · 340px`; `main` = `height:100vh; min-height:0; overflow:hidden` with a `flex:1; min-height:0` scroll body + pinned dock (same fix as SCR-25).
- Detail always in center workspace, **never** the right panel.
- Data-driven images via **div-background** (no `<img src="{{}}">`).
- StatusChip for availability + booking status; EvidenceBlock only on the surfaces in §4.
- Touch targets ≥44px; sheets respect safe-area.

## 10. Steps to complete

1. Add `mode` (operator | model) to SCR-20 config (like SCR-25 `ROLES`).
2. Add the 4 new tabs (Measurements, Booking history, Documents, Activity) reusing card/timeline patterns.
3. Make the right panel **AI-native** per §4 (summary · health · availability risk · fit EvidenceBlock · recommended brands · agent status · activity).
4. Make the dock **proactive** per §5 (greeting + HITL action cards + memory).
5. Model self-view: availability editable, offers Accept/Decline (HITL), profile-completeness nudge.
6. Responsive: tablet collapsible panel; mobile BottomSheet + collapsed dock.
7. Verify: console clean, dock pinned, no holes, HITL preserved.

## 11. Backend (Phase 2 — 🔴 per engineering)

`get_talent_profile` (profile + measurements + docs) · `list_bookings(talent)` · availability read/write · `model-match`/`booking` agents · Realtime. Phase 1 = fixtures.

## 12. Registry / nav / plan updates (on build)

- **SCREEN-REGISTRY:** SCR-20 note → "+ Model Profile self-view (`mode=model`, `/app/talent/profile`), AI-native 3-panel".
- **07-navigation-map:** add `/app/talent/profile` → booking agent (self-view).
- **00-model-booking-plan tracker:** add Model Profile row under design prototypes.

## 13. Acceptance criteria
- Extends SCR-20 on the shared shell; no new layout/components.
- 8 sections present; right panel AI-native; dock proactive + HITL cards.
- EvidenceBlock only on fit/rate/availability-risk/recommendation.
- Desktop/tablet/mobile variants specified; dock pinned; panel→BottomSheet on mobile.
- AI drafts/explains only; Accept/Decline/Request-booking are human actions.

---

# Claude Code Handoff (documentation-only)

## 14. Clarifications (audit fixes)

### 14.1 Booking history lifecycle
Shows **every lifecycle state** via **StatusChip**: `requested · approved · confirmed · completed · cancelled` (also `declined`/`expired`). Matches engineering ref §5.1. Each row deep-links to Booking Detail.

### 14.2 Documents permissions
**Operator = read-only.** **Model = view + edit metadata** (rename/label); **no upload in MVP**. No document contents rendered inline beyond a titled list.

### 14.3 Profile completeness source
`92% complete` is a **Phase-1 fixture**. Phase 2 = backend-calculated from filled fields (portfolio count, availability set, measurements, reviews). Must be visibly non-live until wired — do not invent a live number.

### 14.4 Reviews source
Composed of **average rating + review count + latest N reviews** (fixtures Phase 1; `get_talent_profile`/reviews query Phase 2). No invented aggregate.

## 15. Optional cards (reuse existing patterns; operator-only where noted)
- **Availability summary** — `12 open · 3 booked · 2 tentative` (StatusChip colours).
- **AI Profile Health** — per-area bars: Portfolio 90 · Availability 100 · Measurements 100 · Reviews 86 · Overall 92 (feeds §14.3).
- **Similar models** (operator) — reuse Matching talent cards (92/87/84% fit).
- **Portfolio analytics** (operator) — Editorial 12 · Commercial 8 · Runway 5.
- **Activity** — categorised: Profile · Bookings · Availability · Reviews (not a flat list).

## 16. Implementation dependencies (build order)

```
Shared 3-panel shell → SCR-20 (built) → mode config (operator|model) → IntelligencePanel → OperatorChatDock   (Phase 1: UI + fixtures)
                                                                                    ↓
     Phase 2 backend: get_talent_profile · list_bookings(talent) · availability RW · model-match/booking agents · Realtime
```

## 17. Data ownership by layer

| Layer | Owner | Reads | Writes | Approval boundary |
|---|---|---|---|---|
| UI | Design→Code | profile/bookings fixtures or RPC | local UI state | shows HITL controls; no direct DB write |
| CopilotKit | Code | UI context (model, tab, selection) | draft messages | never commits |
| Mastra | Code | Supabase (user JWT) | **draft** bookings/recs | draft-only |
| Supabase | Code | — | availability (model own), `transition_booking` | RLS: model writes own availability/docs metadata; operator read-only on model-owned |
| Realtime | Code | `bookings`,`notifications` | — | read-only stream |

## 18. Session context (dock remembers)
current model · selected booking · selected availability range · selected tab · active filters. **Phase 1 = UI state only** (not persisted agent memory).

## 19. Route → assistant

| Route | View | Assistant | Greeting |
|---|---|---|---|
| `/app/matching/talent/[id]` | operator | **model-match** | "@runwithkara — 94% fit for Nike, available Mar 12–14." |
| `/app/talent/profile` | model self | **Booking Assistant** | "Profile 92% complete; 2 offers waiting." |

## 20. AI loading states (no spinners)
idle · loading ("Loading portfolio…") · streaming ("Analyzing fit…" / "Checking availability…" / "Preparing recommendations…") · completed · error. Skeletons for the panel, not spinners.

## 21. Empty & error states (reuse EmptyState)
**Empty:** no portfolio (faded sample + "Add your first shots") · no reviews · no documents · no bookings · no activity. **Error:** profile unavailable · offline (banner + Retry) · permission denied · profile deleted · booking history unavailable. Never present stale AI output as live.

## 22. Engineering validation required

| ID | Item | Action |
|---|---|---|
| **EV-1** | `get_talent_profile` shape (profile + measurements + docs) | verify contract; do not assume fields |
| **EV-2** | Profile-completeness calculation | define server-side; Phase 1 fixture only |
| **EV-3** | Documents permissions + storage | confirm operator read-only / model metadata-edit; no upload MVP |
| **EV-4** | `list_bookings(talent)` + review aggregate | verify; no invented aggregates |
| **EV-5** | Supabase tables · RPCs · RLS · TS types | verify vs live repo (`supabase:types` stale, ref §2.11) |
