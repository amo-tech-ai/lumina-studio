# Changelog — iPix / FashionOS Design

All notable changes to the design prototypes & system. Newest first.
Format loosely follows [Keep a Changelog](https://keepachangelog.com/).
Lives in `design-patched/` until copied into `app/design/`.

---

## [Unreleased]

### Added — Mobile More sheet + persistent chat dock (2026-06-29)
- **Mobile More sheet** — the bottom-tab "More" slot now opens a bottom sheet (Campaigns · Matching · Channel Preview · Onboarding · Settings · Account); rows link to the real sibling prototypes and the current page is highlighted. Built two ways: pure-CSS checkbox toggle on the 7 static-markup screens, JS state on Command Center (dynamic `sc-for` tab bar). Resolves the "More shows active but goes nowhere" gap on Campaigns/Matching/Channel Preview.
- **Persistent mobile chat dock** — the workspace chat dock now stays pinned above the bottom tab bar on every panel screen (the `<main>` column reserves the tab-bar height so the dock lifts above it; dock compacted to 16px padding + height-cap on mobile). **Fixed** a Command Center bug where `main > div` padding (instead of `main`) let the dock hide behind the tabs.

### Added — Mobile pass (MOBILE-PLAN §15 Phase 1)
- **`MOBILE-PLAN.md`** — full mobile-first strategy for all 10 screens (bottom-tab nav, sheet primitive, chat dock, per-screen wireframes, gestures, a11y, perf, MVP→Advanced priority).
- **Command Center mobile shell** (reference implementation, `≤1024px`): left rail → **fixed bottom tab bar** (Home · Shoots · Assets · Brands · More, 56px + safe-area, fill/weight active state); IntelligencePanel → **bottom sheet** (90vh, drag handle + close, backdrop dismiss) opened by an **Insights FAB** (badge `3`); workspace gains bottom padding so content clears the tab bar; state-switcher repositioned above tabs. *(Fixes: aside inline `height/overflow` needed `!important` on mobile overrides; and the `transition:transform` on the sheet had to be removed — the runtime restarts it from the hidden state on the toggle re-render, so it never reached `translateY(0)`. Sheet now snaps open instantly.)*
- **Bottom tab bar propagated** to all panel screens — Brand List, Shoots List, Assets, Campaigns, Matching, Channel Preview: rail hidden on mobile, bottom tabs added (active item per route), existing mobile sheets retained (`.sheetbtn` trigger repositioned above the tab bar).
- **Brand Detail mobile** — had no mobile sheet at all; added a **pure-CSS (checkbox-toggle) Insights sheet** (FAB → 90vh sheet, drag-handle + backdrop dismiss, no logic rewrite) plus the bottom tab bar (Brands active). **Onboarding** is a centered single-card wizard with no 3-panel shell — already mobile-friendly, no change. **M6 mobile pass complete across all 10 screens.**

### Added
- **`Channel Preview.v2.image-first.dc.html`** (`/app/preview`, `visual-identity`) — multi-device **Channel Preview Studio**: one shared asset rendered across **Facebook Feed (1:1), Instagram Feed (4:5), Instagram Story (9:16), TikTok (9:16)** in faithful per-platform phone chrome. Controls: asset strip, caption, Image/Video toggle, **safe-zone overlay** toggle. Each frame carries a spec caption (ratio · dimensions · formats). IntelligencePanel = Channel-readiness summary (3 ready / 1 crop-warning, per-channel DNA + status) → tap a channel for **DNA-match breakdown + crop/safe-zone flag + spec + Export**. Visual Identity chat dock. 4 states (Populated, Loading, Empty, Error). **Completes the 10-screen set.**
- **`Matching.v2.image-first.dc.html`** (`/app/matching`, `social-discovery`) — creator matching with the spec's **swipe-card + table variants**. Swipe deck: stacked match cards (creator portrait, platform, follower/engagement/age stats, **fit %**, why-it-matches) with Skip / Save / Invite that advance the deck and update state + the live AI greeting. Table variant: sortable-style creator rows (avatar, platform, followers, engagement, fit bar, status). IntelligencePanel = Discovery summary (90%+ count, avg fit, by-platform) in table/no-selection, else **per-dimension fit breakdown + audience overlap + recent posts** (live with the current card in swipe mode). Social Discovery chat dock. 5 states (Swipe, Table, Loading, Empty, Error). **Closes M5.**
- **`Campaigns.v2.image-first.dc.html`** (`/app/campaigns`, `creative-director`) — image-first CampaignCard grid (16:9 cover, status chip, date range, deliverables count + progress bar). 3-panel shell; IntelligencePanel = Creative summary (live count, open tasks, next deadlines) when none selected, else **deliverable checklist + production timeline** for the selected campaign. Creative Director chat dock. 5 states (Populated, Selected, Loading, Empty, Error).
- **`Assets.v2.image-first.dc.html`** (`/app/assets`, `visual-identity`) — **masonry AssetGrid** + **DataTable** view toggle, FilterBar (type + DNA-match + search), AssetCard with DNA-match % badge (low matches flagged). IntelligencePanel = Library stats (1,240 assets, avg match, by-type) when none selected, else **per-pillar DNA-match breakdown + used-in** for the selected asset. Visual Identity chat dock. Empty = "No assets yet" + Upload / Let AI find them. 5 states. **Closes M4.**
- **`Shoot Wizard.v2.image-first.dc.html`** (`/app/shoots/new`) — AI-first **Production Planner**, not a form wizard. One stepped DC (shared state = AI "remembers" across steps): top bar (brand · step N/10 · Back/Continue→Create shoot), horizontal step rail with done-checkmarks, and a **persistent bottom AI chat dock** whose greeting + input hint + are context-aware per step. 10 steps — Welcome (editorial hero + 3 action cards), Basics (form + AI suggested-plan), Creative Brief (fields + before→after luxury diff), Moodboard (8 refs w/ lock/regenerate + why-it-matches), Shot List (editable rows + chips), Production (resource cards, 1 missing flagged), Budget (breakdown bars + savings), Timeline (dependency phases), Call Sheet (team/arrival/shot-order/exports), Review (Production 94 / Brand DNA 92 / 96% confidence + summary + Create shoot). Image-first throughout. Closes M3.
- **`Brand List.v2.image-first.dc.html`** (`/app/brand`, `brand-intelligence`) — image-first brand-card grid (16:9 cover, status chip on image, big mono DNA score, pillar row with weakest-pillar `*` flag, View/Analyse). 3-panel shell with portfolio-health IntelligencePanel (avg DNA, brand rows, needs-attention, approvals, tabs) + Brand Intelligence chat dock. All 5 states incl. **in-place Analyse** (card crawl progress → re-scores). Closes M2.
- **`Onboarding.v2.zeely.dc.html`** — built the 13-screen Zeely-style onboarding prototype (green accent confirmed): black backdrop + striped-globe motif, white floating cards, black pill CTAs w/ green arrow, 3-segment progress. Interleaved ask→reassure→educate flow: social-proof welcome · build-type radio · before/after DNA · brand inputs (debounced URL preview) · brand-listed checkboxes (brand glyphs) · testimonial · growth radio + affirmation · 4 value-prop screens (ads phone mock, monthly-goals, social funnel, content grid) · full-black AI analysis (auto-advancing checklist + progress) · animated DNA-ready payoff. Real fashion photos from `images/`. Keyboard nav + review dock. *(known runtime quirk handled: `componentDidUpdate` doesn't fire — analysis is driven from nav handlers; entrance opacity animations removed to avoid the keyframe-restart blank-card bug.)*
- **Onboarding plan + wireframes** (`prompts/08-onboarding-plan.md`) \u2014 Zeely-style 13-screen acquisition flow with interleaved ask/reassure/educate rhythm, full visual system (black + striped-globe motif + green local accent + white cards), component patterns, per-screen wireframes, and build notes. Open decision: green accent vs pure B/W.

### Planned
- Restyle existing prototypes to v3 (verify pure white/grey/black, Inter, image-first, chat dock).
- Add the global AI chat dock to every operator screen as they're built.
- Decide final HITL amber treatment (keep vs neutral vs benchmark green).
- Extract image-first components (`ImageThumb`, `MediaCard`, `AIPreviewCard`, `Moodboard`, `PaletteStrip`) + `AIChatDock`.

---

## 2026-06-28 — v3 "Zeely Editorial" design-system decision

### Changed
- **Adopted v3 "Zeely Editorial" as the required direction for all new screens** (supersedes v2 "Atelier"). Pure white / light-grey / charcoal / black; **Inter** primary UI font (Geist Mono numbers only); **black** primary actions; **orange retired** as chrome (opt-in only for a named AI action); 20px card + image radii.
- **`tokens.css` → v3**: warm "stone" primitives replaced by a **pure neutral grey scale** (`#FAFAFA → #111111`); page bg pure white (no beige); focus ring + streaming cursor charcoal; `--color-accent` resolves to black. Added `--font-sans` (Inter) / `--font-mono`, `--chatdock-*`, quiet-grey `--ai-badge-*`, and the missing `--color-blocked-light`.
- **`DESIGN.md`, `redesign-spec.md`, `image-strategy.md`, `00-README.md`, `prompts/00-universal.md` → v3**: pure palette + Inter + black actions throughout; rewrote redesign-spec as an Atelier→Zeely migration with a 6-phase checklist.

### Added
- **Global AI chat dock rule** — every operator screen carries a persistent, context-aware chat dock at the base of the center workspace (greeting names the active object; never "How can I help?"; quick chips + streaming status + black send). Added to DESIGN.md §5I, README, universal prompt, all page prompts, and the `AIChatDock` component + `--chatdock-*` tokens.
- **Image subject/sourcing rules** — editorial fashion photography of **female models in apparel**; prefer uploaded `app/design/images`; never random stock / illustration / office / glamour. Added across DESIGN.md §5H, image-strategy.md, README, and every page prompt.
- **All page prompts updated to v3** (`03-shoots`, `04-brand-list`, `05-shoot-wizard`, `06-campaigns`, `07-assets`, `09-matching`, `10-channel-preview`, `08/09-onboarding`): black buttons, white secondaries, thin grey borders, Inter, image-first layouts, bottom chat dock, 3-panel shell retained (onboarding standalone), all 5 states kept.

---

## 2026-06-28 — Shoots List + Zeely-pure across v2

### Added
- **`Shoots List.v2.image-first.dc.html`** (`/app/shoots`) — 3-panel shell, cover-first `ShootCard` grid (4:3 covers, status chip + DNA badge on image), search + brand/date filter, **filter chips** (All · Draft · Confirmed · In Production · Complete, functional), floating `+ New shoot`, **selected-shoot preview + shot-list** in the IntelligencePanel, **mobile bottom-sheet** for the panel. States: populated · selected · loading · empty (illustrated) · error. Real `images/` photos, Zeely-pure monochrome.

### Changed
- **Command Center v2** restyled to Zeely-pure to match Brand Detail (pure white, Inter, black buttons, grey AI badges, 20px images).

---

## 2026-06-28 — Zeely-pure restyle + real photography

### Changed
- **Brand Detail v2 → Zeely-minimal**: pure-white bg `#FFFFFF`, light-grey `#FAFAFA` surfaces, `#E5E7EB` borders, `#111`/`#6B7280` text, **Inter** font, black primary buttons, **subtle grey AI badge** (amber removed), softer shadows, 20px image radii. No beige, no orange/yellow accents.
- **Real images wired in**: both v2 prototypes now reference the user's uploaded fashion photos from `images/5-fashionos.jpeg`…`16-fashionos.jpeg` (deterministic key→file map) instead of random stock — hero, asset moodboard, before/after strips, nav thumbnails.

### Notes
- Random stock services (picsum/loremflickr) can't guarantee on-brand/clothed content; replaced with curated project images. In production these become `<image-slot>` drop targets.

---

## 2026-06-28 — v2 "Atelier" + image-first

### Changed
- **Accent retired from orange → charcoal.** `--color-accent` and `--color-border-focus` now resolve to `--primitive-ink-900`; AI Approve button, accent dots, brand active-dot, and streaming cursor read black — closer to the benchmark's monochrome restraint. Amber retained for HITL pending only; green/red for status. Applied to both v2 prototypes.
- **New visual language v2 "Atelier"** (visual-only; AI/HITL/3-panel unchanged): white-forward surfaces (`#FBF8F5`→`#FCFBF9`), warm-neutral charcoal text (`#1E293B`→`#1A1A18`), **charcoal primary buttons** (orange no longer a primary), **hairline borders instead of shadows** (`--shadow-card` near-invisible), card radius 10px→16px, calm grey nav active state, white ApprovalCards with an amber hairline + dot (no `#FFFBF0` fill).
- `DESIGN.md` rewritten (Design Principles, Colour System, Cards, Typography, Buttons, Navigation, Tables, Empty States, AI Components, Approval Cards). `redesign-spec.md` carries the full token delta + migration checklist. Old `design-plan.md` archived.

### Added
- **Image-first layer** (DESIGN.md §5H + `image-strategy.md`): photography is the hero, neutral chrome supplies restraint, one consistent 16px image frame, per-content-type aspect ratios, large AI previews before approval, editorial galleries/moodboards. Per-screen audit for all 10 screens. New image tokens: `--image-radius`, `--image-radius-sm`, `--image-border`, `--image-placeholder-bg`, `--image-scrim`.
- **`Command Center.v2.image-first.dc.html`** — brand-hero greeting MediaCard, Recent-work moodboard row, image-thumb approval cards, and a **large AI-preview** approval state (4:5 generated creative + brand-match chip + visual lineage). Charcoal primary, calm nav, image brand avatars.
- **`Brand Detail.v2.image-first.dc.html`** — brand-hero header band (NIKE lockup + DNA 87), before/after as **image strips**, Visual-identity **palette + sample-frame strip**, image **asset moodboard**, **live crawl thumbnails** in the analysing state, image-first No-DNA CTA.
- **`Brand Detail.dc.html`** (base) — `/app/brand/[id]`, all 5 states, inline HITL DNA draft, target-marked IntelligencePanel.

### Notes
- Photography is represented by editorial **duotone gradient placeholders** so the files are self-contained; in production these become real `<image-slot>` photos.
- Token gap flagged: Discard-hover uses a literal `#fdecec` — add `--color-blocked-light` to `tokens.css`.

---

## 2026-06-28 — Plan/Todo audit (rev 2)

### Changed
- Audited `plan.md` + `todo.md` against the live codebase (`route-agent-map.ts`, `mastra/index.ts`, `durable.ts`, `operator-panel.tsx`, `nav-sidebar.tsx`). Scores 90 / 92. Fixed agent map, corrected IntelligencePanel status (🟡 — production is a bare CopilotSidebar), removed stale `.dc.html`/"DC" wording, added Cross-cutting states + Production-parity tasks, milestone prototype-vs-production clarifier.
- Archived `design-plan.md` → `archive/2026-06-design-setup-plan.md` (stale pre-implementation setup doc).

---

## 2026-06-28 — Command Center (base)

### Added
- **`Command Center.dc.html`** (`/app`) — first operator screen: 3-panel shell (collapsible NavSidebar · Workspace · always-white IntelligencePanel), DNA score + pillars, 3 HITL ApprovalCards, all 5 states via a state switcher, 1024px breakpoint. Token-driven, Geist Sans/Mono.

### Fixed
- Added `--nav-width-collapsed` / `--nav-width-expanded` to the prototype `:root` (already present in `tokens.css`).

### Changed
- DNA bars render statically (the runtime restarts keyframe entrance animations); animation disabled under `prefers-reduced-motion` regardless.
