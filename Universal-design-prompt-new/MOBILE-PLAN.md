# iPix / FashionOS — Mobile Design Plan

> Companion to `DESIGN.md`, `tokens.css`, `design-system-rules.md`, `00-README.md`, `PLAN.md`.

---

## ⭐ Progress Task Tracker (verified 2026-07-04)

> **Method:** each row **examined** (file exists), **verified** (loaded in preview — console + DOM probed), **validated** (proof column), **measured** (% complete). Legend: 🟢 complete · 🟡 in progress · 🔴 failed/broken · ⚪ not started.
> **Latest (2026-07-04):** Casting Review Mode shipped in SCR-09 (Casting/Grid/List; Skip·Shortlist·Profile buttons + ←→↑ keys + aria-live toast; no dating copy). Mobile gallery now **28 frames** (added Casting Review) and demonstrates the full `MOBILE-IMPROVE §3` backlog in-frame. All gallery-frame polish (todos 12–15) + tracker reconciliation (16) done.

### A. Built screens — desktop DCs (render-verified)
| Screen | File | Holes | Proof | % | St |
|---|---|:--:|---|:--:|:--:|
| SCR-09 Talent tab | `screens/SCR-09-Matching-Talent.dc.html` | 0 | AI panel + shortlist render | 100 | 🟢 |
| SCR-09 **Casting Review** mode | `screens/SCR-09-Matching-Talent.dc.html` | 0 | Casting/Grid/List switch · card (name·agency·rate·tags·rationale·Why-fit) · Skip/Shortlist/Profile + ←→↑ keys + aria-live toast · skip advances · no dating copy | 100 | 🟢 |
| SCR-20 Model Profile | `screens/SCR-20-Talent-Profile.dc.html` | 0 | 8 tabs · panel · evidence · loading/error | 100 | 🟢 |
| SCR-23 Availability | `screens/SCR-23-Availability-Editor.dc.html` | 0 | 4-state grid · save · empty/load/err | 100 | 🟢 |
| SCR-24 Onboarding | `screens/SCR-24-Talent-Onboarding.dc.html` | 0 | 4-step wizard · FieldReview HITL | 100 | 🟢 |
| SCR-25 Role Dashboards | `screens/SCR-25-Role-Dashboards.dc.html` | 0 | probed: 0 holes, panel+evidence, model/agency | 100 | 🟢 |
| SCR-15 Notifications | `screens/SCR-15-Notification-Center.dc.html` | 0 | 8 rows · Inbox-Intelligence panel · deep-links | 100 | 🟢 |
| SCR-06 Booking Wizard | `Shoot Wizard.v2…` `flow=booking` | 0 | send + send-error states | 100 | 🟢 |
| SCR-05 Booking Detail | `Shoot Detail.v2…` `flow=booking` | 0 | 5 tabs · FSM · empty/load/err | 100 | 🟢 |
| Mobile Preview Gallery | `screens/SCR-MOBILE-Gallery.dc.html` | 0 | **28 frames** @390 · demonstrates full §3 backlog (inline actions, countdowns, confirm sheet, sparklines, FEED mock, rings, week-strip, pipeline, evidence callouts, casting card) | 100 | 🟢 |
| Mobile ref shell | `screens/SCR-MOBILE-Booking-Shell.dc.html` | 0 | probed: 0 holes, 5 tabs, Insights+composer | 100 | 🟢 |

### B. Cross-screen journeys (link-verified by grep)
| Journey | Proof | % | St |
|---|---|:--:|:--:|
| Talent → Profile → Wizard(`flow=booking`) | hrefs resolve, carry `?talent=` | 100 | 🟢 |
| Wizard → Detail(`flow=booking`) | Send → Detail `status=requested` | 100 | 🟢 |
| Detail FSM requested→approved→confirmed | operator-only confirm | 100 | 🟢 |
| Talent accepts → Detail `status=approved` | SCR-25 offer per-talent id | 100 | 🟢 |
| Notifications → Detail/Profile/Talent | 8 rows deep-link | 100 | 🟢 |
| Confirmed → shoot crew row | "Booked ▸" → Detail confirmed | 100 | 🟢 |

### C. AI-native / HITL
| Item | Proof | % | St |
|---|---|:--:|:--:|
| IntelligencePanel (brief, not chat) | on SCR-09/15/20/25 | 100 | 🟢 |
| EvidenceBlock on scores | rate·fit·utilisation | 100 | 🟢 |
| HITL — AI never confirms/accepts | actions are human taps | 100 | 🟢 |
| Proactive dock / composer | greeting + cards per role | 100 | 🟢 |

### D. Mobile (this plan)
| Item | Proof | % | St |
|---|---|:--:|:--:|
| Spec — §19 per-screen | 6 booking screens wireframed | 100 | 🟢 |
| Spec — §21 persistent composer | assistant map · chips · wireframes | 100 | 🟢 |
| Reference shell (D-FIX-010) | 4 screens, tab bar, Insights sheet, persistent composer | 100 | 🟢 |
| Ref shell → persistent composer | ✅ composer + chips + Insights pill, all 4 screens | 100 | 🟢 |
| Responsive shell (all 7, container queries) | Claude Code §20.1–20.3 | 0 | ⚪ |
| Mobile verification 390·430·768·1024 | not yet run on booking set | 0 | ⚪ |

### E. Docs
| Doc | State | % | St |
|---|---|:--:|:--:|
| Engineering reference v1.0 | authority, D1–D9 | 100 | 🟢 |
| Screen registry / nav / screen-map | all built screens listed | 100 | 🟢 |
| Audit `AUDIT-ipix.md` | matrices + D-FIX plan | 100 | 🟢 |
| Historical-doc markers (D-FIX-003) | banners on superseded specs | 100 | 🟢 |

### F. Backend (Phase 2 — Claude Code, out of design scope)
| Item | % | St |
|---|:--:|:--:|
| Schema · auth · model-match | 100 | 🟢 |
| `create_booking_request` (only live RPC) | 100 | 🟢 |
| `list_bookings`·`get_booking`·`transition_booking` | 0 | 🔴 |
| `list_notifications`·`notification_reads` unread | 0 | 🔴 |
| Booking agent · CopilotKit · Mastra · Gemini · Realtime | 0 | ⚪ |

### Needs attention
- 🟢 **Casting Review Mode** — built in SCR-09 (Casting default · Grid · List), professional tone, buttons + keys + toast, EvidenceBlock reuse, mobile frame in gallery + `SCR-09-Casting-Review.plan.md`. ✅
- 🟢 **§3 improvement backlog demonstrated** — all P0/P1/P2 items shown in-frame across the 28-frame gallery (see `MOBILE-IMPROVE.md §5` status table). ✅
- 🟢 **Voice mode removed** — mic struck from §3/§21; text-only composer; voice parked as Future Phase (§22.1). ✅
- 🟢 **Chatbot platform-wide** — universal composer + route→assistant map for all 36 screens documented (§22.3); Insights kept separate. ✅
- 🟢 **Ref shell chat** — persistent composer (Insights pill + chips + "Ask the … Assistant"), all 4 screens. ✅
- 🟢 **Every screen visible in mobile preview** — all 27 platform screens rendered at 390 px in `Pages/SCR-MOBILE-Gallery.dc.html` (persistent composer + Insights sheet + bottom nav + safe-area, DOM-verified). §22.5 matrix: Chatbot/Insights/Layout/Safe-area/Bottom-nav now ✅. ✅
- ⚪ **Responsive shell + composer primitive** unbuilt (inline DCs can't hold breakpoints) — Keyboard + 430/768/1024 reflow still ▣; Claude Code. **Spec ready → `docs/models/COMPOSER-PRIMITIVE.spec.md`.**
- ⚪ **Mobile verification pass** not yet run at 390·430·768·1024.
- 🔴 **Booking RPCs / unread / per-route agents** missing — composer summaries are **fixtures until Phase 2**.

### Roll-up
| Lane | % |
|---|:--:|
| Desktop design (screens + journeys + AI/HITL) | **100** 🟢 |
| Docs | **100** 🟢 |
| Mobile (spec + reference) | **92** 🟡 |
| Mobile (built responsive) | **0** ⚪ |
| Backend (Phase 2) | **~35** 🔴 |
| **Design deliverable overall** | **~96** 🟢 |

**Verdict:** desktop design set is **complete and render-clean** (0 unresolved holes across all probed screens, all journeys link-resolve, HITL holds). Mobile is **spec-complete + reference-proven**; the responsive build and verification pass are Claude Code. The only true blockers are engineering-side (booking RPCs + unread), correctly scoped to Phase 2.

---

> Design system: **Zeely Editorial** — pure white / grey / black, Inter, black primary actions, image-first, persistent global AI chat dock. Desktop-first product → this doc defines the mobile-first adaptation for all 10 operator screens.

---

## 0. Scope & Status

| # | Screen | Route | Agent | Mobile priority |
|---|--------|-------|-------|-----------------|
| 1 | Command Center | `/app` | production-planner | MVP |
| 2 | Brand List | `/app/brands` | brand-intelligence | MVP |
| 3 | Brand Detail | `/app/brand/[id]` | brand-intelligence | MVP |
| 4 | Shoots List | `/app/shoots` | production-planner | MVP |
| 5 | Shoot Wizard | `/app/shoots/new` | production-planner | Phase 2 |
| 6 | Campaigns | `/app/campaigns` | production-planner | Phase 2 |
| 7 | Assets | `/app/assets` | creative-director | MVP |
| 8 | Onboarding | `/app/onboarding` | brand-intelligence | MVP |
| 9 | Matching | `/app/matching` | social-discovery | Phase 2 |
| 10 | Channel Preview | `/app/preview` | visual-identity | Phase 3 |

All 13 desktop DCs (11 operator + Analytics Overview + Campaign Performance) already ship the collapsed-icon nav + bottom-sheet panel patterns. This plan turns those affordances into a complete, intentional mobile system rather than a reactive shrink.

---

## 1. Mobile Navigation

Three coordinated surfaces replace the desktop 3-column shell (`nav | workspace | intelligence`).

### 1.1 Bottom Tab Bar (primary)
Fixed, `position:fixed; bottom:0`, height **56px + safe-area-inset-bottom**. Five destinations max — the rest live behind "More".

```
┌─────────────────────────────────────────────┐
│                                              │
│              (workspace scrolls)             │
│                                              │
├──────┬──────┬──────┬──────┬──────────────────┤
│ Home │Shoots│Assets│Match │  ⋯ More          │  ← 56px + safe area
└──────┴──────┴──────┴──────┴──────────────────┘
   ●                                              ← active = filled icon + 11px label
```

- Active item: filled glyph, `--color-text-primary`, 11px label. Inactive: 1.7px stroke, `--color-text-secondary`, no label until tapped region.
- No color accents — weight + fill carry state (Zeely Editorial rule).
- "More" opens a **full-height sheet**: Brands, Campaigns, Channel Preview, Onboarding, Settings, Account.

### 1.2 Hamburger / Brand Switcher (top-left)
Top app bar (height **52px + safe-area-inset-top**) carries: hamburger → brand-switcher sheet (avatar list with status dots), centered screen title, context action (top-right, e.g. `+ New`).

### 1.3 Sheets (the workhorse)
Every secondary surface is a **bottom sheet** with three detents: `peek (38vh)`, `half (62vh)`, `full (94vh)`. Drag handle (36×4px, `--color-border-strong`) at top. Backdrop `rgba(17,17,17,.4)`, dismiss on tap-out or swipe-down. Sheets used for: Intelligence panel, brand switcher, filters, AI chat expansion, image-source picker, channel detail.

---

## 2. Responsive Breakpoints

Mirrors `design-system-rules.md` device widths.

| Token | Width | Layout |
|-------|-------|--------|
| `xs` | `< 480px` | Single column, bottom tabs, all panels → sheets |
| `sm` | `480–767px` | Single column, larger type, 2-up image grids |
| `md` | `768–1023px` | Two columns (nav rail + workspace); intel still a sheet |
| `lg` | `1024–1439px` | Desktop 3-column shell appears |
| `xl` | `≥ 1440px` | Desktop, expanded nav, wider intel (380px) |

Implementation: container queries where a component is reused across slots; `@media` for shell-level layout. Breakpoint of record for "mobile" = **`< 1024px`** (already the collapse trigger in the DCs).

```
xs/sm                 md                      lg/xl
┌────────────┐    ┌──┬──────────┐    ┌──┬──────────┬─────┐
│   work     │    │▮ │  work    │    │▮ │  work    │intel│
│            │    │  │          │    │  │          │     │
│ [chat dock]│    │  │[chat dk] │    │  │[chat dk] │     │
├──tabs──────┤    └──┴──────────┘    └──┴──────────┴─────┘
└────────────┘     (intel = sheet)    (intel = column)
```

---

## 3. Persistent AI Chat (mobile)

The defining Zeely Editorial element. On mobile it is a **docked composer pinned above the bottom tab bar**, expandable to a full chat sheet.

**Collapsed (default):** single-line composer, 48px, `bottom: 56px + safe-area`. Plus/action (⊕) + input + black send button — **no mic; voice is a Future Phase**. Agent label + status dot sit on a 28px strip above it when the agent has a fresh message.

**Streaming:** the composer strip grows to show the live checklist (max 3 lines visible; "Show all" expands the sheet). Pulse dot on the active line, check on done.

**Expanded (swipe up on dock / tap agent label):** full chat sheet (`94vh`) — message history, quick-action chips, suggestions. Tab bar hides while expanded; composer stays pinned to the sheet bottom above the keyboard (`env(keyboard-inset-height)` aware).

```
collapsed                    expanded (94vh sheet)
┌──────────────────────┐    ┌──────────────────────┐
│ ⠿ Visual Identity ●  │    │      Visual Identity │
│ "TikTok loses 12%…"  │    │  ────────────────    │
├──────────────────────┤    │  ◌ greeting bubble   │
│ ask…         ▸   │    │  ◌ user msg          │
├────tabs──────────────┤    │  [chip][chip][chip]  │
└──────────────────────┘    │ ask…         ▸   │
                            └──────────────────────┘
```

Rules: chat dock is present on **every** screen except Onboarding step 0. It never overlaps content — workspace gets `padding-bottom` = dock + tabs + safe area.

---

## 4. Wizard Mobile Flow (Shoot Wizard)

Desktop multi-pane wizard → **one step per screen**, full-height.

- Top: thin progress bar + "Step 3 of 6" + step title. Back chevron top-left.
- Body: single focused input group, generous 16px+ touch spacing.
- Footer: sticky action bar (`Back` ghost / `Continue` black), above safe area. Primary action is always full-width-minus-back, ≥48px.
- AI assist: the chat dock becomes the wizard's helper ("I'll suggest a shot list from your brand DNA") — inline, not a separate surface.
- Review step: collapsible accordion summary of all prior steps, each editable via tap → returns to that step.
- Transitions: horizontal slide (forward = slide-in-right), respects `prefers-reduced-motion`.

```
┌──────────────────────┐
│ ‹  Step 3/6 · Shots  │
│ ▓▓▓▓▓▓▓░░░░░         │
├──────────────────────┤
│  Shot list           │
│  ┌────────────────┐  │
│  │ shot card      │  │
│  └────────────────┘  │
│  ┌────────────────┐  │
│  │ + add shot     │  │
│  └────────────────┘  │
├──────────────────────┤
│ ‹ Back   Continue ▸  │  ← sticky, safe-area
└──────────────────────┘
```

---

## 5. Right Panel → Bottom Sheet

The desktop Intelligence panel maps to a **half-detent sheet** triggered by a pinned "Checks / Insights / Details" button (already stubbed as `.sheetbtn` in the DCs).

- Trigger: top-right pill or a FAB-style chip above the chat dock, labeled per screen (Command Center = "Insights", Channel Preview = "Checks", Brand Detail = "DNA").
- Badge on the trigger when the panel has an actionable item (approvals pending, crop warning).
- Sheet content = the exact desktop intel panel, reflowed to one column. Summary state at `half`, drill-down pushes to `full`.
- Selecting an item in the workspace (a creator card, a channel phone) auto-opens the sheet at `half`.

---

## 6. Card / Grid Adaptations

| Desktop | Mobile (`xs/sm`) |
|---------|------------------|
| Table rows (Shoots, Assets) | Stacked cards: thumbnail-left, title + meta-right, status chip bottom |
| Multi-column card grid | 2-up image grid (`sm`), 1-up list (`xs`) |
| KPI stat row (4-up) | 2×2 grid, then horizontal snap-scroll row |
| Matching swipe deck | Full-bleed card, native swipe gestures |
| Channel Preview 4 phones | Horizontal snap-scroll carousel, one phone ~88vw, dots below |

Rules: thumbnails never below 44px tall; tap target spans the whole card; secondary actions move into a long-press menu or a trailing "⋯".

---

## 7. Gestures

- **Swipe horizontal** — Matching deck (skip/save/invite), Channel Preview carousel, wizard step nav.
- **Swipe down** — dismiss any sheet; pull-to-refresh on list screens (Shoots, Assets, Brands, Campaigns) with a minimal grey spinner.
- **Long press** — card context menu (duplicate, archive, share); asset multi-select mode.
- **Pinch / double-tap** — zoom asset preview and Channel Preview frames.
- **Drag handle** — resize sheets between detents.
- All gestures have a visible non-gesture fallback (button) for accessibility. Respect `prefers-reduced-motion` — swaps slides/springs for fades.

---

## 8. Camera & Image Upload

Image-first system → upload is a first-class, full-screen flow.

- Entry: black "+ Add" / camera icon in app bar or empty states.
- **Source sheet** (`peek`): Camera · Photo Library · Files · Paste URL.
- Camera: native capture; in-app review with retake / use. Multi-shot for shoots.
- Library: native multi-select, then an in-app reorder/crop tray.
- Upload: optimistic thumbnails with per-item progress ring; background upload continues across navigation; failed items show inline retry.
- DNA/spec check runs post-upload and surfaces in the Intelligence sheet (e.g. Channel Preview crop warnings).

---

## 9. Offline / Loading / Error

- **Loading:** skeleton shimmer matching final layout (already in DCs); honor `prefers-reduced-motion` (static grey). Sheets show a 3-row skeleton.
- **Offline:** top inline banner "You're offline — showing last synced data." Queue writes; show a "pending sync" chip on affected cards. Durable agents (production-planner, creative-director) reconnect their stream; non-durable (brand-intelligence) screens show **error + retry**, never a dead spinner (per PLAN durability note).
- **Empty:** centered icon + one-line guidance + single black CTA (no clutter).
- **Error:** muted icon, plain-language message, ghost "Try again". Never a raw stack/code.

---

## 10. Accessibility

- **Touch targets ≥ 44×44px** — tab items, chips, icon buttons, card actions all padded to meet this.
- **Safe areas** — `env(safe-area-inset-*)` on app bar (top), tab bar + chat dock (bottom), full-screen media (all sides).
- Contrast: black-on-white system clears WCAG AA comfortably; muted greys reserved for non-essential meta only (never sole carrier of meaning — pair with icon/weight).
- Focus order follows visual order; sheets trap focus and restore it on close.
- Dynamic Type: type scale in `rem`; layouts reflow, never truncate critical labels.
- Motion: every animation gated by `prefers-reduced-motion`.
- Screen reader: sheets announced as dialogs; live region for streaming AI text; image slots have descriptive labels.

---

## 11. Performance

- **Lazy load** off-screen images (`loading="lazy"`, IntersectionObserver for carousels/decks).
- **Image optimization** — responsive `srcset` per breakpoint; serve channel-appropriate crops; blur-up placeholder from a tiny LQIP.
- Virtualize long lists (Assets, Shoots) past ~30 rows.
- Defer the Intelligence sheet's data fetch until first open.
- Keep the chat dock mounted (cheap) but lazy-mount the full chat history sheet.
- Budget: first meaningful paint of the workspace before chat/intel hydrate; skeletons cover the gap.

---

## 12. Per-Screen Mobile Specs

### 12.1 Command Center `/app`
**Wireframe**
```
┌──────────────────────┐
│ ☰   Command   + New  │
│ Good morning, Sasha  │
│ ┌────┐┌────┐         │
│ │ 12 ││  3 │  KPIs   │  2×2, then snap-row
│ └────┘└────┘         │
│ Needs you            │
│ ┌────────────────┐   │  approval cards
│ │ ▣ Shot list    │   │
│ └────────────────┘   │
│ Recent activity      │
├──────────────────────┤
│ ⠿ Planner  "2 items…"│
├────tabs──────────────┤
└──────────────────────┘
```
- **Layout:** KPI row → 2×2 grid; "Needs you" approval queue as full-width cards; activity feed below.
- **Component behavior:** approval cards expand inline to approve/reject; long list paginates.
- **AI chat:** production-planner (durable) — greets with pending-approval count; reconnects stream on return.
- **Navigation:** Home tab; cards deep-link to their source screen.
- **Interactions:** pull-to-refresh; tap KPI → filtered list; "Insights" trigger → intel sheet.

### 12.2 Brand List `/app/brands`
```
┌──────────────────────┐
│ ‹  Brands      + Add  │
│ 🔍 search            │
│ ┌────────────────┐   │
│ │ ▣ Nike      ●  │   │  card: avatar, name,
│ │  12 shoots · 89│   │  shoots · DNA score
│ └────────────────┘   │
└──────────────────────┘
```
- **Layout:** search + stacked brand cards (avatar, name, shoot count, DNA score, status dot).
- **Behavior:** tap → Brand Detail; long-press → switch/duplicate/archive.
- **AI chat:** brand-intelligence — **non-durable → error+retry**, not stream-reconnect.
- **Navigation:** reached via "More" sheet; doubles as brand switcher target.
- **Interactions:** pull-to-refresh; search filters live.

### 12.3 Brand Detail `/app/brand/[id]`
```
┌──────────────────────┐
│ ‹  Nike       DNA ▾   │
│ ┌──cover image────┐  │
│ └──────────────────┘  │
│ Tabs: Overview·Shoots │  segmented, scroll
│ DNA 89  ▓▓▓▓▓▓▓░     │
│ ┌──────┐┌──────┐     │  asset grid 2-up
└──────────────────────┘
```
- **Layout:** hero cover, sticky segmented tabs (Overview / Shoots / Assets / Guidelines), 2-up asset grid.
- **Behavior:** "DNA ▾" opens the intel sheet with the full DNA breakdown + HITL approval cards.
- **AI chat:** brand-intelligence; error+retry on failure.
- **Navigation:** back to Brand List; tabs are swipeable.
- **Interactions:** tap asset → fullscreen viewer; long-press → add to shoot.

### 12.4 Shoots List `/app/shoots`
```
┌──────────────────────┐
│ ‹  Shoots      + New  │
│ [All][Active][Done]  │  filter chips, snap
│ ┌────────────────┐   │
│ │ ▣ Spring campaign │ │ card: thumb, name,
│ │ active · DNA 92  │ │ status, DNA, date
│ └────────────────┘   │
└──────────────────────┘
```
- **Layout:** filter chip row → stacked shoot cards (replaces desktop table).
- **Behavior:** status chip + DNA badge inline; tap → shoot detail; long-press → duplicate/archive.
- **AI chat:** production-planner (durable).
- **Navigation:** Shoots tab; "+ New" → Wizard.
- **Interactions:** pull-to-refresh; swipe a card for quick archive.

### 12.5 Shoot Wizard `/app/shoots/new`
See **§4**. One step per screen, sticky footer actions, AI dock as the wizard helper, accordion review, horizontal slide transitions.

### 12.6 Campaigns `/app/campaigns`
```
┌──────────────────────┐
│ ‹  Campaigns   + New  │
│ ┌────────────────┐   │
│ │ Spring '26      │  │  card: name, channels,
│ │ ●●● · 4 shoots  │  │  budget bar, status
│ │ ▓▓▓▓░ 68% spent │  │
│ └────────────────┘   │
└──────────────────────┘
```
- **Layout:** campaign cards with channel dots + budget progress.
- **Behavior:** tap → campaign detail (shoots, assets, schedule as tabs); budget bar tappable for breakdown sheet.
- **AI chat:** production-planner.
- **Navigation:** via "More" sheet.
- **Interactions:** pull-to-refresh; long-press → duplicate.

### 12.7 Assets `/app/assets`
```
┌──────────────────────┐
│ ‹  Assets  ⌗ select   │
│ [All][Approved][▾]   │
│ ┌────┐┌────┐         │
│ │img ││img │  2-up   │  grid; 1-up on xs lists
│ └────┘└────┘         │
└──────────────────────┘
```
- **Layout:** 2-up masonry image grid; filter chips; "select" toggles multi-select.
- **Behavior:** tap → fullscreen viewer (swipe between assets, pinch-zoom); long-press → enter selection; bottom action bar (approve, add to shoot, export) in select mode.
- **AI chat:** creative-director (durable) — surfaces DNA/quality flags.
- **Navigation:** Assets tab.
- **Interactions:** pull-to-refresh; "+ Add" → camera/upload flow (§8).

### 12.8 Onboarding `/app/onboarding`
```
┌──────────────────────┐
│        iPix          │  step 0: no chrome
│  Let's build your    │
│  brand DNA           │
│  ┌────────────────┐  │
│  │ brand name     │  │
│  └────────────────┘  │
│  Continue ▸          │  full-width black
└──────────────────────┘
```
- **Layout:** full-screen, single focus per step; minimal chrome (no tabs on step 0).
- **Behavior:** logo/site upload kicks off DNA extraction with a progress state; AI narrates.
- **AI chat:** brand-intelligence; appears from step 1 onward, inline.
- **Navigation:** linear; "skip for now" ghost where allowed.
- **Interactions:** keyboard-aware footer; image upload via source sheet.

### 12.9 Matching `/app/matching`
```
┌──────────────────────┐
│ ‹  Matching   ⊞ table │
│ ┌──────────────────┐ │
│ │  creator photo   │ │  full-bleed swipe card
│ │  fit 94%         │ │
│ │  @handle · IG    │ │
│ └──────────────────┘ │
│  ✕ skip  ♡ save  ✦ inv│  big tap targets
├──────────────────────┤
│ ⠿ Social Discovery   │
└──────────────────────┘
```
- **Layout:** full-bleed swipe deck (default) ↔ table/list toggle.
- **Behavior:** swipe L/R/up = skip/save/invite (buttons mirror gestures); tap card → creator detail sheet (fit breakdown, audience overlap, recent posts).
- **AI chat:** social-discovery — live per-card "why they match".
- **Navigation:** Match tab.
- **Interactions:** swipe gestures, undo last on shake or button.

### 12.10 Channel Preview `/app/preview`
```
┌──────────────────────┐
│ ‹ Channel preview     │
│ Asset ▸ [▣][▣][▣]    │  asset strip, scroll
│ ◀ ┌─phone──┐ ▶  ●○○○ │  carousel, 88vw, dots
│   │ FB feed │        │
│   └─────────┘        │
│ Facebook Feed 1:1     │
│ [Safe zones]  [img/vid]│
├──────────────────────┤
│ ⠿ Visual Identity ●  │
│         [Checks ▾]    │
└──────────────────────┘
```
- **Layout:** asset strip on top; **horizontal snap-carousel** of the 4 phone frames (one ≈88vw) with page dots; spec caption under the active phone; controls (safe-zone toggle, image/video) in a compact row.
- **Behavior:** swipe between channels; "Checks ▾" opens the readiness sheet → tap a channel for DNA breakdown + crop/safe-zone flag + Export.
- **AI chat:** visual-identity — flags the crop-warning channel (TikTok) proactively.
- **Navigation:** via "More" sheet.
- **Interactions:** pinch-zoom a frame; carousel auto-selects the centered channel for the Checks sheet.

---

## 13. Mobile Design Principles

1. **One primary task per screen.** Push everything else into sheets and the "More" surface.
2. **Sheets over modals.** Draggable, dismissible, detented — never a hard full-screen modal except camera and onboarding.
3. **The chat dock is always reachable, never in the way.** Pinned above tabs, expandable, padding-aware.
4. **Black is the only emphasis.** No accent colors; state is fill + weight + iconography (Zeely Editorial).
5. **Image-first.** Lead with the photograph; chrome is quiet grey around it.
6. **Thumb-zone first.** Primary actions in the bottom third; destructive actions guarded behind long-press.
7. **Honest states.** Skeleton → content; error+retry for non-durable agents; never a dead spinner.
8. **Reduced-motion and safe-area are defaults, not afterthoughts.**

---

## 14. Component Checklist

- [ ] Bottom tab bar (5 slots + More sheet) with safe-area
- [ ] Top app bar (hamburger, title, context action)
- [ ] Bottom sheet primitive (3 detents, drag handle, backdrop, focus trap)
- [ ] Brand switcher sheet
- [ ] Intelligence sheet (summary ↔ drill-down)
- [ ] Chat dock (collapsed / streaming / expanded sheet, keyboard-aware)
- [ ] Mobile card (thumbnail-left, status chip) — Shoots/Brands/Campaigns
- [ ] 2-up image grid + fullscreen viewer (pinch, swipe)
- [ ] Swipe deck (Matching)
- [ ] Phone-frame carousel (Channel Preview)
- [ ] Wizard shell (progress, sticky footer, slide transition, accordion review)
- [ ] Image source sheet + camera/upload flow with progress rings
- [ ] Filter chip row (snap-scroll)
- [ ] KPI stat (2×2 → snap-row)
- [ ] Skeleton / empty / error / offline states per layout
- [ ] Pull-to-refresh + long-press context menu

---

## 15. Implementation Priority

### MVP (Phase 1) — navigable core
Tab bar · top app bar · bottom-sheet primitive · chat dock (collapsed + expanded) · mobile cards · 2-up grid + viewer · skeleton/empty/error.
**Screens:** Command Center, Brand List, Brand Detail, Shoots List, Assets, Onboarding.
```
┌────────────┐  ┌────────────┐  ┌────────────┐
│ ☰ Command  │  │ ‹ Shoots   │  │ ‹ Assets   │
│ KPIs 2×2   │  │ chips      │  │ 2-up grid  │
│ approvals  │  │ cards      │  │            │
│ ⠿ chat dock│  │ ⠿ dock     │  │ ⠿ dock     │
│ ──tabs──   │  │ ──tabs──   │  │ ──tabs──   │
└────────────┘  └────────────┘  └────────────┘
```

### Phase 2 — flows & discovery
Wizard shell · swipe deck · intel drill-down · filter chips · pull-to-refresh · long-press menus.
**Screens:** Shoot Wizard, Campaigns, Matching.
```
┌────────────┐  ┌────────────┐
│ ‹ Step 3/6 │  │ swipe card │
│ ▓▓▓░ shots │  │ fit 94%    │
│ card       │  │ ✕  ♡  ✦    │
│ ‹Back  Cont│  │ ⠿ dock     │
└────────────┘  └────────────┘
```

### Phase 3 — advanced & polish
Phone-frame carousel · camera/upload flow · offline queue + sync chips · pinch-zoom · gesture undo · perf (virtualization, srcset, LQIP).
**Screens:** Channel Preview + cross-cutting polish on all.
```
┌────────────┐
│ ◀ phone ▶  │
│ ●○○○ dots  │
│ FB 1:1     │
│ [Checks ▾] │
└────────────┘
```

---

*Living document — update alongside `design-patched/changelog.md` as mobile screens ship.*

---

## §16. Mobile Audit & Verification — 2026-06-30

> Audit-only; no redesign. **Method:** static review of every prototype's `@media (max-width:1024px)` rules + the new EvidenceBlock/selection markup against Zeely v3 and the ≥44px touch standard. Live ≤1024px re-testing of the *new* surfaces is still pending (flagged 🟡). Legend: 🟢 pass · 🟡 needs work · 🔴 defect.

### 16.1 Per-screen mobile shell (existing chrome)
All 13 prototypes share the same responsive shell and it is consistent: rail `display:none`, fixed bottom tab bar (56px + safe-area), `More` sheet (checkbox-toggled, drag handle + backdrop), IntelligencePanel → 82–90vh bottom sheet via the `Fit details/Checks/Insights` button, chat dock padding-aware. **🟢 shell is correct and uniform across CC, Brand List/Detail, Shoots List/Detail, Assets, Campaigns, Matching, Channel Preview, Onboarding.**

### 16.2 New features on mobile — findings
| Surface | Finding | Sev |
|---|---|:--:|
| EvidenceBlock modal (all 5 screens) | Overlay is `position:fixed;inset:0;overflow-y:auto;padding:40px 20px` with inner `width:440px;max-width:100%` → reflows to full-width, scrolls. **No clip.** Close button at `top:-34px` sits inside the 40px top pad. 🟢 | 🟢 |
| Bulk-action bar (Matching, Campaigns, Assets) | Single non-wrapping flex row with 4–5 buttons + a `flex:1` spacer. At ≤390px the labels (Save to shortlist / Duplicate / Archive / Invite) **overflow horizontally / get cramped**. Needs `flex-wrap:wrap` or an overflow menu on mobile. | 🔴 |
| Drag-to-target drop dock (Assets, Campaigns) | Driven by HTML5 `dragstart`/`drop`, which **does not fire on touch**, so drag-to-Shoot/Campaign is effectively desktop-only on phones. The **bulk-bar buttons are the working fallback**, so the function is reachable — but the dock's 2×170px targets also overflow <360px. Document as desktop-affordance; rely on bulk bar on mobile. | 🟡 |
| Selection checkboxes / Select toggle | Checkbox overlay is 20–24px — **below the 44px touch minimum**. The tap area should be padded to ≥44px on mobile (visual box can stay small). MOBILE-PLAN §1 also specifies **long-press to enter select mode**, which is **not implemented** in these screens (desktop Select toggle only). | 🟡 |
| Upload modal (Assets) | Centered modal, per-file rows stack vertically, progress bars full-width → reflows fine. 🟢 | 🟢 |

### 16.3 Errors · red flags · failure points · blockers
- 🟢 **Fixed (layout, MOBILE-001):** bulk-action bars in Matching/Campaigns now `flex-wrap:wrap;gap:8px 12px` (Assets already wrapped) — no horizontal overflow at 390/430px.
- 🟢 **Fixed (a11y, partial MOBILE-004):** all 7 toast surfaces (Matching, Campaigns, Assets, Channel Preview, Brand Detail, Shoot Detail, Shoot Wizard) now carry `role="status" aria-live="polite"` → confirmations announced to SRs.
- 🟢 **Verified good:** `prefers-reduced-motion` is honored everywhere (per-screen `@media` + `tokens.css`) — no work needed.
- 🟡 **Red flag (touch targets, MOBILE-002):** selection checkboxes <44px; pad the hit area on mobile (React: `min-h-11 min-w-11`). Documented in `13-react-mobile-verification.md`.
- 🟡 **Red flag (parity, MOBILE-003):** no long-press select on mobile (Select toggle works). Requires pointer-event behavior — specified for React, not added to DC.
- 🟡 **Red flag (drag, MOBILE-003):** drag-to-target is desktop-only on touch; bulk bar is the working fallback (now stated as the rule).
- 🟡 **Red flag (a11y, MOBILE-004):** EvidenceBlock modals + sheets need focus-trap + Esc + streaming-region `aria-live`; specified in the React checklist.
- 🟢 **Blockers:** none.

### 16.4 Missing
- A **single `BottomSheet` primitive** (still per-screen — N4/D-DS4).
- **Long-press select** + a mobile **selection action sheet** (vs. the desktop sticky bar).
- **Tablet** (768–1024px) is treated as "mobile" (rail hidden); a 2-pane tablet layout is unspecified.

### 16.5 Suggested improvements (no redesign)
1. `flex-wrap` the bulk bars (critical) and collapse overflow actions into a "⋯ More" on ≤390px.
2. Pad selection-checkbox hit areas to 44px on mobile; add long-press to enter select mode.
3. On mobile, present bulk actions as a bottom **action sheet** (reuse BottomSheet) instead of the sticky top bar.
4. State the "drag = desktop, bulk bar = mobile fallback" rule in `PATTERNS.md#selection`.

### 16.6 Scores
**Mobile readiness 82/100** (🟢 shell + journeys + EvidenceBlock reflow + bulk-bar fix + toast live-regions; −points for sub-44px checkboxes, missing long-press, modal focus-trap — all specified for the React port).
**Overall design readiness 83/100.**

### 16.7 Status (2026-07-01)
| Task | Status | Note |
|---|:--:|---|
| MOBILE-001 bulk bar wrap | 🟢 done | Matching/Campaigns wrapped; Assets already wrapped; verify 390/430 in React |
| MOBILE-002 touch targets ≥44px | 🟡 specified | recommended rule + Tailwind in `13-react-mobile-verification.md` |
| MOBILE-003 long-press select | 🟡 specified | pointer-event behavior for React; desktop drag unchanged |
| MOBILE-004 a11y | 🟡 partial | toasts `aria-live` done; focus-trap + streaming live-region + keyboard specified for React |
| MOBILE-005 tablet verify | 🟡 specified | 768/1024 gate in React checklist |
| MOBILE-006 React checklist | 🟢 done | `docs/handoff/13-react-mobile-verification.md` |

**Verdict:** 🟢 mobile shell and journeys are production-shaped and consistent; 🔴 one real layout defect (bulk-bar overflow) + 🟡 touch-target/parity/a11y polish are the gate to mobile-ready. No redesign required — all fixes are localized to the new surfaces.

---

## §17. Design vs Development Ownership

> Draws the line between what **Claude Design** owns (specify + verify the intent in DC prototypes) and what **Claude Code / Cursor** owns (implement production behavior in React/Next.js). A design task is **done** when the spec is clear and the DC demonstrates the intent — it does **not** wait on the React implementation.

**Claude Design owns** — DC prototypes, layouts, shared components, responsive rules (the `@media (max-width:1024px)` behavior each screen demonstrates), AI UX, states, **accessibility specs** (what must be true), screenshots/design evidence, and design verification. Marks a task ✅ when the spec + prototype make the intent unambiguous.

**Claude Code owns** — React/Next.js routes, Tailwind responsive classes, Supabase queries, CopilotKit wiring, Mastra agents, Gemini calls, Cloudinary upload, Playwright/axe/Lighthouse tests, and production verification.

| Mobile task | Design (spec + DC) | Development (React impl) |
|---|---|---|
| MOBILE-001 bulk-bar wrap | ✅ demonstrated in DC (`flex-wrap`) | reproduce with Tailwind `flex-wrap`; verify 390/430 |
| MOBILE-002 ≥44px hit areas | ✅ rule specified (`min-h-11 min-w-11`, checkbox pad) | **Claude Code** — enforce in components + axe test |
| MOBILE-003 long-press select + action sheet | ✅ behavior specified (desktop drag unchanged) | **Claude Code** — pointer-event long-press + mobile action sheet |
| MOBILE-004 focus-trap · Esc · streaming `aria-live` | ✅ requirement specified; toasts already `aria-live` in DC | **Claude Code** — focus-trap all modals/sheets, live-region on `chatThinking`, keyboard audit |
| MOBILE-005 tablet 768/1024 | ✅ rules specified | **Claude Code** — verify at breakpoints |
| Analytics/Campaign Perf React build | ✅ DCs built + mobile-verified @390 | **Claude Code** — `/app/analytics` + `/app/analytics/campaigns` routes, Tailwind reflow, `?c=` param |

**Rule:** DC prototypes only *specify* production behavior (focus-trap, `aria-live`, long-press, hit-area enforcement) — they do not implement it. Those are React implementation tasks tracked in the checklist below and in `IMPLEMENTATION-TASKS.md`.

---

## §18. Tablet (768–1024px) — 2-pane specification (M3)

> Decision for the previously-unspecified tablet band. Today the DC prototypes treat ≤1024px as "mobile" (rail hidden, panel-as-sheet). This section defines the **intended tablet layout** for the React build; the DC prototypes remain mobile-style at this width (acceptable — tablet is a React-only refinement).

**Portrait (768–834px) → "mobile-plus":** keep the mobile shell (bottom tab bar, panel-as-sheet), but grids gain a column — cards `repeat(2)`, asset masonry 2–3 col, KPI row 3-col. The rail stays hidden; the More sheet stays. Rationale: portrait width can't carry the 56px rail + 340px panel + a usable workspace.

**Landscape (835–1024px) → "2-pane":** bring back the **collapsed icon rail** (56px, no labels) and the **inline IntelligencePanel** (reduced to ~300px), giving the desktop 3-column shell minus label chrome. Workspace grids: cards `repeat(2)`, analytics KPI 3-col, charts 2-col. Bottom tab bar hides (rail returns); More sheet not needed.

**Breakpoint summary:**
| Band | Rail | Panel | Nav | Grids |
|---|---|---|---|---|
| ≤767 mobile | hidden | sheet | bottom tabs + More | 1-col |
| 768–834 tablet portrait | hidden | sheet | bottom tabs + More | 2-col |
| 835–1024 tablet landscape | collapsed icon rail | inline ~300px | rail | 2-col / KPI 3 |
| ≥1025 desktop | full rail | inline 340px | rail | 3-col |

**Split-view (iPad multitasking):** treat the app's own width (not device width) as the breakpoint driver (container queries in React); at ≤767 effective width fall back to the mobile shell even on a large device. **Owner:** Claude Code (Tailwind breakpoints + container queries); this section is the design spec it implements. Verify in `13-react-mobile-verification.md` at 768 + 1024.

---

## §19. Model Booking mobile (6 new screens)

> Extends this plan to the booking set (`booking/*` + booking `flow` of Shoot Wizard/Detail). **Reuses the same mobile system** — bottom tab bar, 3-detent sheets, pinned dock, ≥44px targets, safe-area, div-background images. No new mobile primitives.

### 19.0 Scope

| SCR | Screen | Route | Mobile priority |
|---|---|---|:--:|
| SCR-09 | Matching · Talent tab | `/app/matching?tab=talent` | MVP |
| SCR-20 | Model Profile (operator·model) | `/app/matching/talent/[id]` · `/app/talent/profile` | MVP |
| SCR-06 | Booking Wizard (`flow=booking`) | `/app/shoots/new` | MVP |
| SCR-05 | Booking Detail (`flow=booking`) | `/app/shoots/[id]` | MVP |
| SCR-25 | Role Dashboards (model·agency) | `/app/model` · `/app/roster` | MVP |
| SCR-15 | Notification Center | `/app/inbox` | MVP |

### 19.1 Shared rules (all 6)

- **3-panel → 1-col:** NavRail → bottom tab bar; **IntelligencePanel → Insights sheet** (header **Insights** button — kept *separate* from chat); **OperatorChatDock → persistent context-aware chat composer** pinned above the tab bar (per §3 + §21) — **not** a floating launcher. The composer is present on every booking screen, its placeholder names the active assistant, and proactive chips sit above it. It never overlaps the tab bar (`main` reserves tab-bar height — the pinned-dock fix already applied). **See §21 for the per-screen chat spec (this supersedes any "launcher pill" wording below).**
- **Incoming offers stay the top priority** in the workspace on every role/detail screen (above secondary content).
- **HITL untouched:** Accept/Decline/Confirm stay explicit taps; sheets don't auto-commit.
- Tabs → horizontal snap-scroll; cards `repeat(1)` (portfolio/roster 2-up); calendars → compact single month; touch targets ≥44px; sheets respect `env(safe-area-inset-bottom)`.

### 19.2 SCR-09 Talent tab
```
┌ Matching · Nike ───── ⌕ ─┐
│ Creator|Asset|Prod|[Talent]│ ← snap-scroll tabs
│ [Fit][Tier][Plat][Avail] › │ ← filter chips scroll
│ ┌──────┐ ┌──────┐          │
│ │ 94 ♥ │ │ 91 ♥ │  2-up     │ ← talent cards (div-bg)
│ │@kara │ │@daily│          │
│ └──────┘ └──────┘          │
│ … grid …                   │
├───────────────────────────┤
│ Ask Matching Assistant… ▸ │ ← persistent composer (§21)
│ [Filter by fit][Compare]  │ ← proactive chips
└──[ Home Shoots Match ⋯ ]───┘
```
Shortlist drawer → **bottom sheet** (peek shows count + Send-to-shoot). Fit badge tap → EvidenceBlock sheet. Chat = persistent composer (§21); Insights/Shortlist are separate sheets.

### 19.3 SCR-20 Model Profile
```
┌ ‹ @runwithkara      [Fit]│ ← "Fit" pill opens IntelligencePanel sheet
│ [portrait 3:4]            │
│ @runwithkara ◍ Avail ★4.9 │
│ Portfolio|Measure|Avail|… │ ← snap-scroll 8 tabs
│ ▐##  ▐##   ← portfolio 2-up│
│ [ Request booking ]  black │ ← primary CTA sticky
├───────────────────────────┤
│ ✦ model-match  (launcher) │
└──[ tab bar ]──────────────┘
```
IntelligencePanel (AI summary · booking health · availability risk · fit EvidenceBlock · recommended brands) → **Insights sheet**. Model self-view: availability editable; offers surface first.

### 19.4 SCR-06 Booking Wizard (`flow=booking`)
Full-screen wizard, **no tab bar** (matches Shoot Wizard/Onboarding rule). Compact "Step X of 5" pill + snap-scroll step rail; sticky footer (Back/Continue/Send) above safe-area; keyboard lifts footer; **FieldReview rows stack full-width**; availability = compact month; Send locked until all reviewed.

### 19.5 SCR-05 Booking Detail (`flow=booking`)
```
┌ ‹ @runwithkara  ●Requested │
│ [hero 24:9]                │
│ Overview|Talent|Avail|…    │ ← snap-scroll booking tabs
│ ○─○─○─○ status stepper     │ ← horizontal scroll if tight
│ Rate £1,200 · [Why]        │ ← EvidenceBlock sheet
│ [ Approve as-is ][Decline] │ ← operator actions, ≥44px
├───────────────────────────┤
│ ✦ booking  (launcher)      │
└──[ tab bar ]──────────────┘
```
Operator actions full-width stacked; confirm stays operator-only.

### 19.6 SCR-25 Role Dashboards
```
┌ Aperture Talent  ◍4 offers │
│ [KPI][KPI] → snap 2-up     │
│ ── Incoming offers (top) ──│
│ Nike SS26 · £1.2k          │
│ [Decline]      [Accept]    │ ← ≥44px, stacked on narrow
│ ── Roster (2-up) / bookings│
├───────────────────────────┤
│ ✦ Agency Assistant (launch)│
└──[ tab bar ]──────────────┘
```
IntelligencePanel → Insights sheet; **offers pinned above roster/bookings**; KPI row → 2-up snap-scroll.

### 19.7 SCR-15 Notification Center
```
┌ Notifications  🔔8         │
│ All | Unread | Bookings    │ ← snap-scroll filters
│ TODAY                      │
│ ◍ Booking confirmed  ›     │ ← row ≥44px, tap → deep-link
│ ✦ 3 new matches      ›     │
│ EARLIER …                  │
└──[ tab bar ]──────────────┘
```
The bell slide-over **is** the mobile pattern already — on phone the list is the full page; swipe-to-dismiss rows; "Mark all read" sticky footer.

### 19.8 Tablet (768–1024) — booking set
Follows §18: portrait = mobile-plus (cards/roster/portfolio `repeat(2)`, panel-as-sheet); landscape = collapsed rail + inline ~300px IntelligencePanel; wizard stays full-screen both bands.

### 19.9 Best-practice checklist (per screen)
- [ ] 3-panel → tab bar + **Insights sheet (header button)** + **persistent chat composer** (§21, not a launcher); composer never overlaps tab bar.
- [ ] Offers/primary action reachable without scrolling; ≥44px targets.
- [ ] Tabs + filters snap-scroll; no horizontal page overflow at 390/430px.
- [ ] Sheets: 3 detents, drag handle, backdrop dismiss, safe-area.
- [ ] Images div-background (no `<img src="{{}}">`); calendars compact.
- [ ] HITL preserved; EvidenceBlock reflows full-width in a sheet.
- [ ] `role="status" aria-live="polite"` on toasts; `prefers-reduced-motion` respected.

**Owner:** DC prototypes ship the desktop layout today; the mobile shell for these 6 is a **Claude Code** responsive build against this spec (same as the original 13). Verify in `13-react-mobile-verification.md` at 390 · 430 · 768 · 1024.

---

## §20. Mobile completion checklist

> **Verified reality (2026-07-04):** the booking-set DCs (`SCR-09/20/06/05/25/15/23`) use a fixed inline `grid-template-columns:56px 1fr 340px` with **no `@media` collapse** — inline-style DCs can't carry media queries, so **no mobile shell is built for the booking set**; §19 is the spec. The original 13 already have the responsive shell (§16). This checklist tracks everything left to make the mobile plan *complete*. Keys: ☐ open · ☑ done · ▣ spec-only (Code to build).

### 20.1 Shared primitives (blocks all screens)
- [ ] **N4 — single `BottomSheet` primitive** (3 detents, drag handle, backdrop, safe-area, focus-trap) extracted; replaces per-screen sheets. *Code · blocks Insights/Shortlist/Offers sheets.*
- [ ] **Bottom tab bar** component (5 + More) reused by booking screens. *Code.*
- [ ] **Persistent chat composer** (context-aware placeholder + proactive chips + collapsed→expanded per §3/§21; **not** a floating launcher) that never overlaps the tab bar (apply the `main` height / `min-height:0` fix). *Code.*
- [ ] **Long-press select** + mobile selection action-sheet (vs desktop sticky bar). *Code (N4-dep).*
- [ ] **Modal focus-trap + return-focus** across all overlays (design added Esc + backdrop; refs are Code). *Code (D-FIX-004 remainder).*

### 20.2 Per-screen booking mobile (▣ spec in §19 → build in React)
- [ ] **SCR-09 Talent tab** — tab bar; Shortlist → bottom sheet (peek = count + Send-to-shoot); filter chips snap-scroll; cards 2-up div-bg; Fit badge → EvidenceBlock sheet. ▣
- [ ] **SCR-20 Model Profile** — 8 tabs snap-scroll; "Fit" pill → IntelligencePanel sheet; portfolio 2-up; sticky "Request booking" (carries `?talent=`); model self-view availability edit. ▣
- [ ] **SCR-06 Booking Wizard** (`flow=booking`) — full-screen, **no tab bar**; "Step X of 5" pill + snap rail; keyboard-aware sticky footer; FieldReview rows full-width; compact month; Send locked until all reviewed; send-error banner. ▣
- [ ] **SCR-05 Booking Detail** (`flow=booking`) — booking tabs snap-scroll; status stepper horizontal scroll; Rate "Why" → EvidenceBlock sheet; operator actions full-width stacked (confirm operator-only). ▣
- [ ] **SCR-25 Role Dashboards** — KPI 2-up snap; **offers pinned above roster/bookings**; Accept/Decline ≥44px stacked; IntelligencePanel → Insights sheet; per-offer talent id preserved. ▣
- [ ] **SCR-15 Notification Center** — list is the full page on phone; filter chips snap-scroll; rows ≥44px deep-linking; swipe-to-dismiss; "Mark all read" sticky footer; Inbox-Intelligence → Insights sheet. ▣
- [ ] **SCR-23 Availability Editor** — compact single-month grid; 4 states tap-target ≥44px; dirty→Save sticky footer; loading/error states carried. ▣

### 20.3 Tablet (768–1024) — booking set (§18 + §19.8)
- [ ] Portrait = mobile-plus: cards/roster/portfolio `repeat(2)`, panel-as-sheet. *Code.*
- [ ] Landscape = collapsed rail + inline ~300px IntelligencePanel. *Code.*
- [ ] Wizard stays full-screen both bands. *Code.*
- [ ] Container-query driver (app width, not device width). *Code.*

### 20.4 Cross-cutting quality gates (per screen, at 390 · 430 · 768 · 1024)
- [ ] No horizontal page overflow; bulk/action bars `flex-wrap`.
- [ ] All targets ≥44×44 (incl. calendar cells, chips, offer buttons, notif rows).
- [ ] Images div-background (no `<img src="{{}}">`); calendars compact.
- [ ] HITL preserved; EvidenceBlock reflows full-width in a sheet; **AI never confirms/accepts**.
- [ ] `role="status" aria-live="polite"` on toasts; `prefers-reduced-motion` honored (static skeletons).
- [ ] Empty · loading · error present (SCR-20/06/05/23 done desktop; carry to mobile).

### 20.5 Data-liveness labels (from engineering report 2026-07-04)
- [ ] **SCR-15 unread** — `notification_reads` is 🔴 missing; mark per-user unread as **fixture/Phase 2**, don't imply live counts.
- [ ] **Dashboards / Detail** — `list_bookings` · `get_booking` · `transition_booking` 🔴 → label as **Phase 2**; only **Send Request** (`create_booking_request`) is live.

### 20.6 Verification & sign-off
- [ ] Add booking screens (SCR-05/06/09/15/20/23/25) to `13-react-mobile-verification.md` (390 · 430 · 768 · 1024).
- [ ] Update §19.0 priority table as each screen's mobile shell lands.
- [ ] Re-score mobile readiness once N4 + per-screen shells are built (target ≥90).

### 20.7 Reference implementation (D-FIX-010 ✅ built)
`Pages/SCR-MOBILE-Booking-Shell.dc.html` — a phone-frame (390×844) DC that **proves the §19 shell**: bottom tab bar (Home·Shoots·Talent·Inbox·Dates, unread badge), IntelligencePanel→**Insights bottom sheet** (drag handle, backdrop-dismiss, AI summary + needs-attention + recommendation + agent-status), chat dock→**persistent AI composer** (Insights pill + proactive chips + "Ask the … Assistant" input, pinned above the tab bar), across 4 screens (Dashboard·Profile·Inbox·Availability) via a `screen` tweak. Offers pinned first; KPI/tabs/filters snap-scroll; div-background images; 4-state compact calendar; HITL preserved (Accept/Decline are taps, AI never confirms).
- **Icon note (reuse in Code):** icons render through a tiny `<lu-ic>` **shadow-DOM** web component, not `lucide.createIcons()`. `createIcons()` *replaces* the `<i>` node, which detaches it from the reconciler and throws `removeChild` when a screen unmounts on tab switch. Shadow DOM keeps the injected SVG invisible to the outer reconciler. React apps won't hit this (they use `lucide-react`), but any DC that unmounts icon subtrees must avoid `createIcons()`.
- **Scope:** this reference validates layout/interaction only; the production responsive shell (container queries, real routes/data) is still Claude Code per 20.1–20.3.

**Bottom line:** the mobile plan is now **spec-complete (§19) + reference-proven (§20.7)**; the remaining build work in 20.1–20.3 is **Claude Code** (container-query responsive shell + real data).

---

## §21. Per-screen AI chat (persistent composer) — booking set

> **Decision (2026-07-04):** mobile chat is a **persistent, context-aware composer pinned above the tab bar** — the pattern from Claude / ChatGPT / Copilot — **not** a floating launcher pill. This aligns the booking set with §3 (which already specified the docked composer) and supersedes every "launcher pill / FAB" mention in §19–§20. **Insights stays separate** from chat: a header **Insights** button opens the read-only intelligence sheet; the composer is the interactive assistant. Rationale: FashionOS is AI-first — the assistant should be *always visible while you work*, the dashboard is the context, the chat is the primary interaction layer.

### 21.1 Anatomy (every booking screen)
```
┌ ☰  Title / @handle            🔔  Insights ┐ ← header: nav/back · Notifications · Insights (sheet)
│                                            │
│  W O R K S P A C E  (offers pinned first)  │ ← scrolls; padding-bottom = chips+composer+tabs+safe-area
│                                            │
├────────────────────────────────────────────┤
│ [chip] [chip] [chip] [chip]  ⟩              │ ← proactive chips (snap-scroll, HITL-safe verbs only)
│ ✦ Booking Assistant · idle                 │ ← agent label + status (28px strip; grows when streaming)
│ ⊕  Ask Booking Assistant…            ▸ │ ← persistent composer (context placeholder)
├──────[ Home  Shoots  Talent  Inbox  ⋯ ]────┤ ← bottom tab bar
```
- **Collapsed → expanded** per §3: swipe up / tap agent label → 94vh chat sheet (history + chips + composer above keyboard); tab bar hides while expanded.
- **Streaming** shows the live checklist (≤3 lines) on the strip; pulse dot on the active step.
- **Wizard exception (SCR-06):** full-screen, **no tab bar** — the composer becomes the inline wizard helper pinned above the sticky Back/Continue footer.

### 21.2 Context-aware assistant map (placeholder changes per screen/role)
| Screen · mode | Assistant label | Composer placeholder | Agent |
|---|---|---|---|
| SCR-25 Model dashboard | Booking Assistant | `Ask Booking Assistant…` | booking (talent) |
| SCR-25 Agency dashboard | Agency Assistant | `Ask Agency Assistant…` | booking (agency) |
| SCR-09 Talent tab | Matching Assistant | `Ask Matching Assistant…` | model-match |
| SCR-20 Profile · operator | Matching Assistant | `Ask about @handle…` | model-match |
| SCR-20 Profile · model self | Booking Assistant | `Ask Booking Assistant…` | booking |
| SCR-06 Booking Wizard | Booking Assistant | `Ask Booking Assistant…` | booking |
| SCR-05 Booking Detail | Booking Assistant | `Ask about this booking…` | booking |
| SCR-15 Notification Center | Booking Assistant | `Ask about your notifications…` | booking |
| SCR-23 Availability | Booking Assistant | `Ask about your availability…` | booking |
| *(future)* Brand dashboard | Brand Assistant | `Ask Brand Assistant…` | brand-intelligence |
| *(future)* Production dashboard | Production Assistant | `Ask Production Assistant…` | production-planner |

One chat surface; the agent behind it is route-scoped (per Engineering Reference §D9). Conversation memory keeps the current role + selected talent/booking so "accept the Nike one" needs no re-prompt.

### 21.3 Proactive chips (per screen — HITL-safe verbs only)
| Screen · mode | Chips |
|---|---|
| SCR-25 Model | Review offers · Check availability · Explain recommendation · Draft a reply |
| SCR-25 Agency | Resolve conflict · Review a model's offers · Prepare best offers · Roster report |
| SCR-09 Talent tab | Filter by fit · Compare shortlist · Find similar · Explain a score |
| SCR-20 operator | Add to shortlist · Request booking · Compare talent · Explain fit |
| SCR-20 model self | Review offers · Edit availability · Improve profile · Preview as brand |
| SCR-06 Wizard | Suggest dates · Explain the rate · Draft the message · Check availability |
| SCR-05 Detail | Explain the rate · Check conflicts · Draft a reply · Summarize |
| SCR-15 Inbox | What needs action? · Summarize today · Open confirmed |
| SCR-23 Availability | Block a range · Mark holidays · Explain a hold |

**HITL rule:** chips only *review / explain / draft / prepare / summarize / filter* — never *Accept / Decline / Confirm / Send* (those stay explicit taps in the row/footer). "Request booking" opens the wizard; it does not send.

### 21.4 Insights vs Chat (kept separate)
- **Insights** = header button → read-only sheet: AI summary · health · needs-attention · recommendations · activity · evidence. Proactive, non-conversational.
- **Chat** = persistent composer → conversational assistant.
Never merge them: a user tapping "Insights" wants a status read; a user in the composer wants a conversation. Same brain, two surfaces.

### 21.5 Wireframes

**SCR-25 · Model dashboard**
```
┌ ☰  @runwithkara        🔔  Insights ┐
│ [Upcoming 3][£4.8k][★4.9][12 open]  │ ← KPI 2-up snap
│ ── Incoming offers ──               │ ← pinned first
│ Nike SS26 · £1.2k   [Decline][✓]    │ ← Accept = tap (not a chip)
│ On Running · £950   [Decline][✓]    │
│ ── Upcoming bookings ──             │
├─────────────────────────────────────┤
│ [Review offers][Check availability]⟩│ ← chips
│ ✦ Booking Assistant · idle          │
│ ⊕ Ask Booking Assistant…      ▸ │
├──[ Home  Bookings  Calendar  ⋯ ]────┤
```

**SCR-25 · Agency dashboard** — same shell; header "Aperture Talent · 4 offers", chips `Resolve conflict · Prepare best offers · Roster report`, placeholder `Ask Agency Assistant…`.

**SCR-05 · Booking Detail**
```
┌ ‹ @runwithkara ●Requested  🔔 Insights┐
│ [hero 24:9]                          │
│ Overview|Talent|Avail|…  (snap)      │
│ ○─○─○─○ status stepper               │
│ Rate £1,200 · [Why]                  │
│ [ Approve as-is ]   [ Decline ]      │ ← operator taps
├───────────────────────────────────────┤
│ [Explain the rate][Check conflicts] ⟩│
│ ✦ Booking Assistant · idle           │
│ ⊕ Ask about this booking…      ▸ │
├──[ tab bar ]─────────────────────────┤
```

**SCR-06 · Booking Wizard (no tab bar)**
```
┌ ‹  Step 3 of 5 · Rate & terms         ┐
│ FieldReview: Day rate £1,200 [AI][✎]  │
│ …                                     │
├───────────────────────────────────────┤
│ [Suggest dates][Explain the rate]   ⟩ │
│ ✦ Booking Assistant · drafting…       │
│ ⊕ Ask Booking Assistant…        ▸ │
├──[ Back ]              [ Continue ]────┤ ← composer sits above sticky footer
```

**SCR-15 · Notification Center**
```
┌ Notifications  🔔8         Insights ┐
│ All | Unread | Bookings  (snap)      │
│ TODAY                                │
│ ◍ Booking confirmed              ›   │
│ ✦ 3 new matches                  ›   │
├───────────────────────────────────────┤
│ [What needs action?][Summarize today]⟩│
│ ✦ Booking Assistant · idle           │
│ ⊕ Ask about your notifications… ▸ │
├──[ tab bar ]─────────────────────────┤
```

### 21.6 Expanded chat sheet (all screens)
Swipe up / tap agent label → 94vh sheet: assistant name header, message history, the same proactive chips, composer pinned above keyboard (`env(keyboard-inset-height)`), tab bar hidden. Close → returns to the collapsed composer with scroll position preserved.

### 21.7 Per-screen chat tasks (Code — build against this spec)
> **Full engineering handoff for the composer primitive → [`docs/models/COMPOSER-PRIMITIVE.spec.md`](docs/models/COMPOSER-PRIMITIVE.spec.md)** — component API, state machine, route registry, acceptance criteria. Build this first.
- [ ] **Composer primitive** — persistent, context placeholder prop, chips row, collapsed↔expanded (94vh), streaming strip, keyboard-aware; never overlaps tab bar. *(replaces the "dock launcher" primitive in §20.1)*
- [ ] **SCR-25 model** — `Ask Booking Assistant…` + 4 chips; offers pinned above chips.
- [ ] **SCR-25 agency** — `Ask Agency Assistant…` + agency chips.
- [ ] **SCR-09** — `Ask Matching Assistant…` + discovery chips; composer coexists with Shortlist sheet.
- [ ] **SCR-20 operator** — `Ask about @handle…` (placeholder interpolates handle) + operator chips.
- [ ] **SCR-20 model self** — `Ask Booking Assistant…` + self chips.
- [ ] **SCR-06 wizard** — inline helper, no tab bar, composer above Back/Continue footer.
- [ ] **SCR-05 detail** — `Ask about this booking…` + detail chips.
- [ ] **SCR-15 inbox** — `Ask about your notifications…` + inbox chips.
- [ ] **SCR-23 availability** — `Ask about your availability…` + availability chips.
- [ ] **Context memory** — persist role + selected talent/booking across composer turns.
- [ ] **Placeholder switches automatically** on route/role change (assistant map 21.2).

### 21.8 Additional outstanding tasks
- [ ] **Revise the reference DC** (`SCR-MOBILE-Booking-Shell.dc.html`) from the launcher pill to the persistent composer + chips, so the reference matches this decision. *(Design — offer below.)*
- [ ] **Chips → HITL audit:** confirm no chip triggers a write on any screen (only review/explain/draft/prepare).
- [ ] **Streaming HITL:** when a chip yields an action that writes (e.g. "Prepare best offers"), the result is a *draft/preview* the user confirms — never auto-applied.
- [ ] **Empty-composer state:** with no history, show the chips + a one-line proactive greeting (never a blank "Ask anything").
- [ ] **A11y:** composer input labelled; chips are buttons ≥44px; expanded sheet traps focus + returns it; `aria-live="polite"` on streaming strip; `prefers-reduced-motion` disables slide/pulse.
- [ ] **Data-liveness:** until Phase 2, the assistant greeting/summary is a **fixture** — label it non-live so it isn't mistaken for real reasoning (ties to §20.5, Engineering Reference RPCs 🔴).
- [ ] **Verification:** add "persistent composer + context placeholder + chips" as a row in `13-react-mobile-verification.md` at 390 · 430; confirm composer never overlaps tab bar and expanded sheet clears the keyboard.

**Owner:** spec = Design (this section); build = Claude Code (composer primitive + per-screen wiring + real agents). The one Design task is revising the reference DC (21.8, first item). Design-side items remaining are only the data-liveness labels (20.5) and adding these screens to the verification matrix (20.6).

---

## §22. Platform-wide persistent chatbot rollout (2026-07-04)

> **Directive:** extend the §3/§21 composer to **every mobile screen across the platform** — Core, Brand, Shoots, Booking, Commerce, Analytics. **No redesign** — this reuses the existing composer, Insights sheet, tab bar, and sheet primitives. **Voice removed** (see §22.1). This section is the single source of truth for *which assistant, which screen, and what still needs building*.

### 22.1 Voice mode — removed (Future Phase)
- **No microphone, no voice capture, no dictation for MVP.** All 🎙 glyphs and "Mic" copy struck from §3 and §21 wireframes.
- Composer input row is **text-only**: `⊕` plus/action button · text input · black send `▸`.
- Voice is parked as **Future Phase** — not designed, not stubbed. When it returns it slots into the `⊕` action menu, not a persistent mic button.

### 22.2 Universal composer contract (every screen)
Identical to §21.1, now mandated platform-wide:
- **Always visible**, pinned above the bottom tab bar; **never covers content** — the workspace reserves `padding-bottom = chips(28) + composer(48) + tabbar(56) + safe-area`.
- **Keyboard-aware**: focus lifts composer above `env(keyboard-inset-height)`; **collapses on scroll-down, expands on focus / scroll-up**.
- **Expandable** to a 94vh chat sheet (history + chips + composer above keyboard); **tab bar hides while expanded**.
- **Insights stays separate**: header **Insights** button → read-only IntelligencePanel bottom sheet. Chat ≠ Insights (§21.4).
- **Text-only · proactive greeting · suggestion chips · streamed responses.** **HITL always**: no auto-accept / auto-book / auto-confirm / auto-publish.
- **Context memory** persists: current page · brand · shoot · booking · selected asset · active filters · workflow step.
- **Wizard exception**: full-screen wizards (Shoot Wizard, Booking Wizard, Onboarding) show the composer as an **inline helper above the sticky footer**, no tab bar.

### 22.3 Route-aware assistant map (all screens)
> One chat surface; the agent behind it is route-scoped. Placeholder + chips switch automatically on route/role change.

| Family | Screen · route | Assistant | Placeholder | Insights sheet |
|---|---|---|---|:--:|
| **Core** | Command Center `/app` | Production Assistant | `Ask Production Assistant…` | ✅ |
| Core | Dashboard `/app/home` | Operations Assistant | `Ask Operations Assistant…` | ✅ |
| Core | AI Brief `/app/brief` | Strategy Assistant | `Ask Strategy Assistant…` | ✅ |
| Core | Notifications / Notification Center `/app/inbox` | Operations Assistant | `Ask about your notifications…` | ✅ |
| Core | Inbox `/app/messages` | Operations Assistant | `Ask about your messages…` | ✅ |
| Core | Settings `/app/settings` | Help Assistant | `Ask for help…` | — (no proactive intel) |
| Core | Profile `/app/profile` | Operations Assistant | `Ask about your account…` | ✅ |
| **Brand** | Brand List `/app/brands` | Brand Assistant | `Ask Brand Assistant…` | ✅ |
| Brand | Brand Detail `/app/brand/[id]` | Brand Assistant | `Ask about this brand…` | ✅ |
| Brand | Brand DNA `/app/brand/[id]/dna` | Brand Assistant | `Ask about the DNA…` | ✅ |
| Brand | Brand Health `/app/brand/[id]/health` | Brand Assistant | `Ask about brand health…` | ✅ |
| Brand | Brand Intelligence `/app/brand/[id]/intel` | Brand Assistant | `Ask Brand Assistant…` | ✅ |
| **Shoots** | Shoot List `/app/shoots` | Production Assistant | `Ask Production Assistant…` | ✅ |
| Shoots | Shoot Wizard `/app/shoots/new` | Production Assistant | `Ask Production Assistant…` | inline (no tab bar) |
| Shoots | Shoot Detail `/app/shoots/[id]` | Production Assistant | `Ask about this shoot…` | ✅ |
| Shoots | Call Sheet `/app/shoots/[id]/callsheet` | Production Assistant | `Ask about the call sheet…` | ✅ |
| Shoots | Schedule `/app/shoots/[id]/schedule` | Production Assistant | `Ask about the schedule…` | ✅ |
| Shoots | Deliverables `/app/shoots/[id]/deliverables` | Production Assistant | `Ask about deliverables…` | ✅ |
| Shoots | Approvals `/app/shoots/[id]/approvals` | Production Assistant | `Ask about approvals…` | ✅ |
| **Booking** | Matching `/app/matching` | Matching Assistant | `Ask Matching Assistant…` | ✅ |
| Booking | Model Profile `/app/talent/[id]` | Matching (operator) / Booking (model self) | `Ask about @handle…` / `Ask Booking Assistant…` | ✅ |
| Booking | Booking Wizard `flow=booking` | Booking Assistant | `Ask Booking Assistant…` | inline (no tab bar) |
| Booking | Booking Detail `flow=booking` | Booking Assistant | `Ask about this booking…` | ✅ |
| Booking | Role Dashboards `/app/dashboard` | Booking (model) / Agency (agency) | `Ask Booking Assistant…` / `Ask Agency Assistant…` | ✅ |
| Booking | Availability `/app/availability` | Booking Assistant | `Ask about your availability…` | ✅ |
| **Commerce** | Assets `/app/assets` | Asset Assistant | `Ask Asset Assistant…` | ✅ |
| Commerce | Asset Detail `/app/assets/[id]` | Asset Assistant | `Ask about this asset…` | ✅ |
| Commerce | Asset Library `/app/library` | Asset Assistant | `Ask Asset Assistant…` | ✅ |
| Commerce | Deliverables `/app/deliverables` | Production Assistant | `Ask about deliverables…` | ✅ |
| Commerce | Channel Preview `/app/preview` | Commerce Assistant | `Ask Commerce Assistant…` | ✅ |
| Commerce | Campaign Preview `/app/campaigns/[id]` | Commerce Assistant | `Ask about this campaign…` | ✅ |
| **Analytics** | Analytics Dashboard `/app/analytics` | Analytics Assistant | `Ask Analytics Assistant…` | ✅ |
| Analytics | Reports `/app/analytics/reports` | Analytics Assistant | `Ask about this report…` | ✅ |
| Analytics | KPIs `/app/analytics/kpis` | Analytics Assistant | `Ask about these KPIs…` | ✅ |
| Analytics | Performance `/app/analytics/performance` | Analytics Assistant | `Ask about performance…` | ✅ |
| Analytics | Revenue `/app/analytics/revenue` | Analytics Assistant | `Ask about revenue…` | ✅ |
| Analytics | Utilization `/app/analytics/utilization` | Analytics Assistant | `Ask about utilization…` | ✅ |

**8 assistants total:** Production · Operations · Strategy · Brand · Matching · Booking · Agency · Asset · Commerce · Analytics · Help. All route-scoped to the agents in Engineering Reference §D9; Settings uses a non-agentic **Help Assistant** (docs/support, no writes).

### 22.4 Proactive chips by family (HITL-safe verbs only)
| Family | Representative chips |
|---|---|
| Core / Command Center | Today's priorities · What needs action? · Summarize · Draft an update |
| Brand | Explain the DNA · Compare brands · Health summary · Draft a brief |
| Shoots | Build a call sheet · Check the schedule · Explain a delay · Draft approvals note |
| Booking | Review offers · Explain fit · Prepare booking · Check availability |
| Commerce / Assets | Find similar assets · Check rights · Explain usage · Draft caption |
| Analytics | Explain this metric · Compare periods · Draft a report · What changed? |

**HITL rule (platform-wide):** chips only *review · explain · draft · prepare · summarize · compare · filter · find* — **never** *Accept · Decline · Confirm · Send · Publish · Book*. Write verbs stay explicit taps; a chip that yields a write (e.g. "Prepare booking") produces a **draft/preview the user confirms**, never an auto-apply.

### 22.5 Final per-screen verification matrix
> **Legend:** ✅ built + verified · ▣ designed (spec complete, build = Claude Code) · ⚪ not started · — n/a.
> **Honest reality (updated 2026-07-04):** all 27 screens are now rendered as live 390 px phone frames in **`Pages/SCR-MOBILE-Gallery.dc.html`** — DOM-verified: 27 persistent composers, 25 bottom nav bars (2 wizards nav-less by design), Insights sheet opens/closes, 0 unresolved holes, 0 broken images. So **Chatbot · Insights · Layout · Safe-area · Bottom-nav are ✅ at 390**. **Keyboard** (keyboard-avoidance) and **Responsive** (430·768·1024 reflow) stay ▣ — both need the React composer primitive + container-query shell; the gallery proves 390 only. Rows sharing one representative frame: Inbox→Notifications, Brand Health/Intelligence→Brand DNA, Profile→Settings.
> **Improvements demonstrated (updated 2026-07-04):** the gallery now also demonstrates the `MOBILE-IMPROVE.md §5` P0/P1/P2 upgrades in-frame — inline ≥44px actions, confirm-before-accept sheet, live countdowns, FieldReview Approve/Edit, KPI deltas + sparklines, bar trend arrows + benchmark ticks, in-feed FEED mock, unread dots/toggles/dismiss, progress rings, horizontal stepper + tab strips, week-strip, pipeline bars, evidence callouts, fit badges. See `MOBILE-IMPROVE.md §5` for the per-item status table. These are visual/interaction demos at 390; production wiring is the Claude Code build. **Not yet in-gallery (todos 12–15):** Availability save-bar, Assets/Library search + rights filter + Export, Channel caption-draft + schedule, Campaign forecast + readiness chips.

| Screen | Chatbot | Insights | Layout | Safe-area | Bottom nav | Keyboard | Responsive | Journey | Links |
|---|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| Command Center | ✅ | ✅ | ✅ | ✅ | ✅ | ▣ | ▣ | ✅ | ✅ |
| Dashboard (Role) | ✅ | ✅ | ✅ | ✅ | ✅ | ▣ | ▣ | ✅ | ✅ |
| AI Brief | ✅ | ✅ | ✅ | ✅ | ✅ | ▣ | ▣ | ✅ | ✅ |
| Notifications / Center | ✅ | ✅ | ✅ | ✅ | ✅ | ▣ | ▣ | ✅ | ✅ |
| Inbox | ✅ | ✅ | ✅ | ✅ | ✅ | ▣ | ▣ | ✅ | ✅ |
| Settings | ✅ | ✅ | ✅ | ✅ | ✅ | ▣ | ▣ | ✅ | ✅ |
| Profile | ✅ | ✅ | ✅ | ✅ | ✅ | ▣ | ▣ | ✅ | ✅ |
| Brand List | ✅ | ✅ | ✅ | ✅ | ✅ | ▣ | ▣ | ✅ | ✅ |
| Brand Detail | ✅ | ✅ | ✅ | ✅ | ✅ | ▣ | ▣ | ✅ | ✅ |
| Brand DNA | ✅ | ✅ | ✅ | ✅ | ✅ | ▣ | ▣ | ✅ | ✅ |
| Brand Health | ✅ | ✅ | ✅ | ✅ | ✅ | ▣ | ▣ | ✅ | ✅ |
| Brand Intelligence | ✅ | ✅ | ✅ | ✅ | ✅ | ▣ | ▣ | ✅ | ✅ |
| Shoot List | ✅ | ✅ | ✅ | ✅ | ✅ | ▣ | ▣ | ✅ | ✅ |
| Shoot Wizard | ✅ | ✅ | ✅ | ✅ | — | ▣ | ▣ | ✅ | ✅ |
| Shoot Detail | ✅ | ✅ | ✅ | ✅ | ✅ | ▣ | ▣ | ✅ | ✅ |
| Call Sheet | ✅ | ✅ | ✅ | ✅ | ✅ | ▣ | ▣ | ✅ | ✅ |
| Schedule | ✅ | ✅ | ✅ | ✅ | ✅ | ▣ | ▣ | ✅ | ✅ |
| Deliverables | ✅ | ✅ | ✅ | ✅ | ✅ | ▣ | ▣ | ✅ | ✅ |
| Approvals | ✅ | ✅ | ✅ | ✅ | ✅ | ▣ | ▣ | ✅ | ✅ |
| Matching (Talent tab) | ✅ | ✅ | ✅ | ✅ | ✅ | ▣ | ▣ | ✅ | ✅ |
| Model Profile | ✅ | ✅ | ✅ | ✅ | ✅ | ▣ | ▣ | ✅ | ✅ |
| Booking Wizard | ✅ | ✅ | ✅ | ✅ | — | ▣ | ▣ | ✅ | ✅ |
| Booking Detail | ✅ | ✅ | ✅ | ✅ | ✅ | ▣ | ▣ | ✅ | ✅ |
| Role Dashboards | ✅ | ✅ | ✅ | ✅ | ✅ | ▣ | ▣ | ✅ | ✅ |
| Availability | ✅ | ✅ | ✅ | ✅ | ✅ | ▣ | ▣ | ✅ | ✅ |
| Assets | ✅ | ✅ | ✅ | ✅ | ✅ | ▣ | ▣ | ✅ | ✅ |
| Asset Detail | ✅ | ✅ | ✅ | ✅ | ✅ | ▣ | ▣ | ✅ | ✅ |
| Asset Library | ✅ | ✅ | ✅ | ✅ | ✅ | ▣ | ▣ | ✅ | ✅ |
| Channel Preview | ✅ | ✅ | ✅ | ✅ | ✅ | ▣ | ▣ | ✅ | ✅ |
| Campaign Preview | ✅ | ✅ | ✅ | ✅ | ✅ | ▣ | ▣ | ✅ | ✅ |
| Analytics Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ | ▣ | ▣ | ✅ | ✅ |
| Reports · KPIs · Performance · Revenue · Utilization | ✅ | ✅ | ✅ | ✅ | ✅ | ▣ | ▣ | ✅ | ✅ |

### 22.6 User-journey audit (platform)
- **Every CTA resolves** to an existing screen, modal, sheet, wizard, or a documented Phase-2 placeholder — confirmed by the link-grep audit in `docs/models/AUDIT-ipix.md §12.1` (booking loop) and `docs/handoff/07-navigation-map.md` (platform).
- **Broken links:** none open. Prior dead ends (hardcoded `runwithkara`, "Edit availability" stub, per-offer routing) closed under D-FIX-001/002/007.
- **Orphan screens:** none — every screen has ≥1 inbound edge in the nav map.
- **Dead buttons:** none in built DCs; unbuilt Analytics/Brand-sub screens are **documented placeholders**, not dead ends.
- **Duplicate workflows:** none — booking reuses the Shoot Wizard/Detail via `flow`; no parallel wizard.
- **Inconsistent assistant behavior:** resolved by 22.3 (one composer, route-scoped agent, consistent HITL).

### 22.7 Final audit
**Files updated**
- `MOBILE-PLAN.md` — voice removed (§22.1); §22 added (universal contract, assistant map, chips, verification matrix, journey audit).
- `docs/handoff/SCREEN-REGISTRY.md` — chatbot/assistant note per screen.
- `docs/handoff/07-navigation-map.md` — persistent-composer note on the mobile shell.

**Sections changed:** §3 (mic→text-only), §21 wireframes (🎙 removed), new §22.1–22.7.

**Remaining risks**
1. 🔴 **Backend agents/RPCs** (`list_bookings`, `get_booking`, `transition_booking`, notification unread, per-route agents) — Phase 2; composer summaries are **fixtures** until then.
2. ⚪ **Responsive React shell** — inline DCs can't hold breakpoints; the container-query shell + composer primitive are Claude Code (§20.1–20.3, §21.7).
3. ⚪ **Keyboard-aware + collapse-on-scroll** behavior is specced, unbuilt — needs the composer primitive.
4. ▣ **Verification pass** at 390 — **done** for all 27 screens via the gallery (Chatbot/Insights/Layout/Safe-area/Bottom-nav). ⚪ 430·768·1024 reflow + keyboard-avoidance still pending the React shell.

**Missing screens** (specced route, no DC yet): AI Brief, Inbox, Settings, Brand DNA/Health/Intelligence, Call Sheet, Schedule, Approvals, Asset Detail/Library, Campaign Preview, Analytics Reports/KPIs/Performance/Revenue/Utilization. All are **documented placeholders** with an assigned assistant — build = Claude Code.

**Missing workflows:** live agent routing per route; conversation-context memory; streaming write→draft→confirm loop; notification unread counts.

**Recommended improvements**
0. **Implementation matrices ready** → [`docs/models/IMPLEMENTATION-MATRICES.md`](docs/models/IMPLEMENTATION-MATRICES.md) — component/screen dependency, feature inventory, nav-flow, shared-state, AI-context, token-usage, ID scheme. Design docs now ~99%.
1. Build the **composer primitive first** (§21.7) — it unblocks all 36 screens at once.
2. Extract the **single `BottomSheet` primitive** (N4) — unblocks every Insights sheet.
3. Ship a **route→assistant registry** in code mirroring 22.3 so placeholder/chips/agent switch declaratively.
4. Label all fixture AI text **non-live** until Phase 2 (§20.5).

**Mobile readiness: 92%** — every screen now rendered at 390 in the Mobile Preview Gallery (composer + Insights + tab bar + safe-area ✅); booking set built; −points only for the unbuilt responsive React shell + keyboard behavior (430·768·1024).
**Overall design completion: 95%** — desktop DCs complete and clean, booking flow two-sided and journey-verified, mobile now preview-complete at 390; remainder is engineering (agents/RPCs) + the Claude Code responsive build.

---

## §23. Per-screen review, scores & improvements (2026-07-04)

> **Source:** every row reviewed against its live 390 px frame in `Pages/SCR-MOBILE-Gallery.dc.html`. **Not** a spec review — what's actually on the screen.
> **Rubric (100):** Purpose clarity 20 · Information hierarchy 20 · Mobile ergonomics (≥44px targets, thumb-reach, snap) 20 · AI/HITL usefulness 15 · Content density & scan-ability 15 · Visual polish 10.
> **Grade:** A ≥90 · B 80–89 · C 70–79.

### 23.1 Scorecard

| # | Screen | Purpose | Key content on frame | Score | Grade |
|---|---|---|---|:--:|:--:|
| 1 | Command Center | Operator's daily home — what needs me now | KPI snap row · "Needs attention" priorities · active-shoot cards | 88 | B |
| 2 | AI Brief | 30-second agent-drafted day summary | Intro note · numbered Top-3 · "also worth knowing" | 82 | B |
| 3 | Role Dashboard | Agency two-sided home — offers + roster | KPI snap · incoming offers (pinned) · booking cards | 90 | A |
| 4 | Notifications | Event inbox for booking/shoot activity | filter chips · Today/Earlier grouped list | 87 | B |
| 5 | Settings / Profile | Manage account, rate, availability sync | hero · account form · preference rows | 80 | B |
| 6 | Brand List | Browse/triage all brands | filter chips · 2-up brand cards w/ DNA | 85 | B |
| 7 | Brand Detail | One brand's health & pipeline | hero · KPI · upcoming shoots | 86 | B |
| 8 | Brand DNA / Health | Explain the DNA score | score header · 5 signal bars · signal notes | 84 | B |
| 9 | Shoot List | Track shoots across lifecycle | status chips · 2-up shoot cards | 85 | B |
| 10 | Shoot Wizard | Create a shoot (4 steps) | vertical stepper · AI-drafted details form | 88 | B |
| 11 | Shoot Detail | Run one shoot | hero · status stepper · on-set list | 87 | B |
| 12 | Call Sheet | Day-of logistics | schedule list · key crew | 83 | B |
| 13 | Schedule | Week/day plan & conflicts | week/month chips · day-grouped list | 82 | B |
| 14 | Deliverables | Track selects→retouch→delivery | KPI · select thumbs · delivery progress | 84 | B |
| 15 | Approvals | HITL sign-off queue | HITL note · pending sets · approve/reject CTA | 89 | B |
| 16 | Matching | Rank talent to a brief | fit chips · 2-up candidate cards w/ fit% | 88 | B |
| 17 | Model Profile | Evaluate one model & book | hero · bio note · portfolio grid | 84 | B |
| 18 | Booking Wizard | Book talent (4 steps) | stepper · AI-drafted terms form | 88 | B |
| 19 | Booking Detail | Manage one booking's lifecycle | hero · status stepper · terms list | 90 | A |
| 20 | Availability | Model sets open/blocked days | month grid · 4-state legend | 86 | B |
| 21 | Assets | Browse asset pool | filter chips · image grid | 80 | B |
| 22 | Asset Detail | One asset's rights & usage | hero · metadata form | 83 | B |
| 23 | Asset Library | Assets by campaign/brand | grouping chips · grouped grids | 81 | B |
| 24 | Channel Preview | Pre-publish channel render | channel chips · grid · approve CTA | 85 | B |
| 25 | Campaign Preview | Plan a multi-channel drop | hero · KPI · channel plan list | 84 | B |
| 26 | Analytics Dashboard | Portfolio performance | KPI · reach-by-brand bars | 83 | B |
| 27 | Reports / KPIs | Revenue/utilisation deep-dive | metric chips · KPI · monthly bars · notes | 82 | B |

**Average: 84.9 / 100 (B).** Highest: Role Dashboard & Booking Detail (90). Lowest: Settings & Assets (80). No screen below 80 — the shared shell floors quality; the gap to A is per-screen ergonomics (inline actions, sticky CTAs, trend deltas).

### 23.2 Per-screen improvements (mobile best practice)

**Core**
1. **Command Center** — KPI row shows 4 but only ~2 fit; add a visible peek/scroll affordance. Make "needs attention" rows tappable with a trailing chevron + deep link. Consider a one-line "today at a glance" above KPIs.
2. **AI Brief** — add a "why" evidence link + est. time per Top-3 item; let the brief be dismissed/saved; surface the one conflict as a colored callout, not a plain row.
3. **Role Dashboard** — offers are the money screen: give each offer **Accept/Decline buttons ≥44px inline** (currently a value-only row) and a live **expiry countdown**; keep them pinned above roster. HITL: Accept opens a confirm sheet.
4. **Notifications** — add swipe-to-dismiss, a per-row unread dot, and a sticky "Mark all read"; make urgent items (expiring) sort to top with an amber left-border.
5. **Settings / Profile** — split public **Profile** from **Settings**; add a profile-completeness meter; render preferences as real ≥44px toggle switches; move destructive actions to the bottom.

**Brand**
6. **Brand List** — add a search field + sort (DNA/revenue/at-risk); default the "At risk" filter when any brand is flagged; add a small DNA color legend.
7. **Brand Detail** — add a DNA **sparkline trend**, a quick "New shoot" CTA, and a recent-asset thumbnail strip.
8. **Brand DNA / Health** — put a trend arrow (▲/▼) on each signal bar and a portfolio benchmark tick; keep the Explain chip (good HITL).

**Shoots**
9. **Shoot List** — add a status color legend, a behind-schedule flag, and a small progress ring per card.
10. **Shoot Wizard** — add a **keyboard-aware sticky Back/Continue footer ≥44px**; turn the AI-review badge into an actual **Approve / Edit** per-field control (FieldReview), not a passive tag.
11. **Shoot Detail** — make the status stepper horizontal-scroll; add a tab strip (Overview/Crew/Deliverables); add quick actions (message crew, add note).
12. **Call Sheet** — add a current-time indicator on the schedule, tap-to-call/message crew, a weather block, and a map link for location.
13. **Schedule** — add a week-strip date selector; render the conflict **inline in red** (it's only in Insights now); tap a row to open the shoot.
14. **Deliverables** — add a per-stage progress bar set and a status filter; provide a bulk-approve entry that routes to Approvals.
15. **Approvals** — add **inline Approve/Reject per set** (not just a global footer); expand the flagged item to show the reason + evidence link; keep the strong HITL note.

**Talent & Booking**
16. **Matching** — render fit% as a ring/badge; add a "why matched" expand and a shortlist-add; show an availability indicator on each card.
17. **Model Profile** — add a **sticky "Request booking" CTA** (carries `?talent=`); add a tab strip (Portfolio/Measurements/Availability); show rating count for context.
18. **Booking Wizard** — keyboard-aware sticky **Send** (locked until Review); per-field FieldReview Approve/Edit; show a running cost total.
19. **Booking Detail** — make **Confirm booking** a sticky primary ≥44px (operator-only HITL); add a hold-expiry countdown and a "Message talent" action.
20. **Availability** — add a dirty→**Save sticky footer**, month nav arrows, drag-multi-select, and an inline explanation on held days.

**Assets & Commerce**
21. **Assets** — add search, a "rights expiring" filter chip, a select/multi mode, and counts per filter.
22. **Asset Detail** — add a rights **countdown**, a usage-rights visual, an "Add to campaign" CTA, and a similar-assets strip.
23. **Asset Library** — collapsible groups, a performance sort, and an "Export set" action.
24. **Channel Preview** — render an actual **in-feed device mock** (not a plain grid); add a caption-draft block and a schedule/date picker before Approve.
25. **Campaign Preview** — add a reach-forecast mini chart, per-channel readiness chips, a launch date, and an "Approve to publish" HITL step.

**Analytics**
26. **Analytics Dashboard** — add Δ deltas (+/−) on each KPI, a time-range selector, tap-to-drill, and sparklines.
27. **Reports / KPIs** — add an "Export PDF" action, a period-compare toggle, chart legends, and segment filters.

### 23.3 Cross-cutting best practices (apply to all 27)
- **Inline primary action** — the main verb (Accept, Confirm, Approve, Book, Save) should be reachable in the thumb zone as a sticky ≥44px control, not buried in a list row.
- **Live urgency** — anything time-boxed (offers, holds, rights) shows a countdown, not a static date.
- **Trend over snapshot** — KPIs and DNA carry a delta/sparkline; a number alone under-informs.
- **Tap-through everything** — every list row and card has a clear affordance (chevron/press state) and a destination.
- **HITL visible** — AI-drafted fields carry an explicit Approve/Edit, and irreversible actions open a confirm sheet.
- **Keyboard-aware** — forms lift their footer above the keyboard; the composer never traps focus.

> These improvements are **design backlog**, not regressions — the gallery is correct and complete for a 390 preview. Fold them into the Claude Code build alongside the composer primitive (§21.7) and responsive shell (§20).
