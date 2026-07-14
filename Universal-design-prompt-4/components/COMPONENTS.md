# Component Library — iPix / FashionOS

> **Single source of truth** for every operator screen, ahead of production implementation.
> Visual language: **v3 "Zeely Editorial"** — pure white / grey / charcoal / black, Inter, black primary actions, image-first, persistent AI chat dock. See `DESIGN.md`.
>
> Each component is an importable Design Component in `components/`. Embed with `<dc-import name="components/<Name>" …props… hint-size="W,H"></dc-import>`. All props are Tweaks-editable. Live gallery: `Component Library.dc.html`.

## Index

| Component | File | Category | Used on |
|---|---|---|---|
| OperatorShell | `OperatorShell.dc.html` | Shell | all 8 panel screens |
| NavSidebar | `NavSidebar.dc.html` | Shell | all 8 panel screens |
| IntelligencePanel | `IntelligencePanel.dc.html` | Shell | all 8 panel screens |
| PersistentChatDock | `PersistentChatDock.dc.html` | Shell | all 10 (wizards inline) |
| PageHeader | `PageHeader.dc.html` | Shell | list/detail screens |
| BrandCard | `BrandCard.dc.html` | Card | Brand List, Command Center |
| ShootCard | `ShootCard.dc.html` | Card | Shoots List |
| CampaignCard | `CampaignCard.dc.html` | Card | Campaigns |
| AssetCard | `AssetCard.dc.html` | Card | Assets, Brand Detail |
| ApprovalCard | `ApprovalCard.dc.html` | AI/HITL | all screens with AI writes |
| AgentStatusIndicator | `AgentStatusIndicator.dc.html` | AI/HITL | chat dock, intel panel |
| SearchBar | `SearchBar.dc.html` | Input | list screens |
| FilterBar | `FilterBar.dc.html` | Input | Shoots, Assets, Brand List |
| WizardStep | `WizardStep.dc.html` | Input | Shoot Wizard, Onboarding |
| StatusChip | `StatusChip.dc.html` | Feedback | every card |
| SkeletonLoader | `SkeletonLoader.dc.html` | Feedback | every loading state |
| EmptyState | `EmptyState.dc.html` | Feedback | every empty state |
| BottomNavigation | `BottomNavigation.dc.html` | Mobile | all 8 panel screens ≤1024px |
| BottomSheet | `BottomSheet.dc.html` | Mobile | intel panel / More / filters ≤1024px |
| EvidenceBlock | `EvidenceBlock.dc.html` | AI/HITL | Brand Detail, Assets, Matching, Campaigns, Channel Preview, Analytics, Campaign Perf |

## Component lifecycle (D-DS16)
> Every component carries a lifecycle label. **Stable** = frozen contract, reuse freely, extend-don't-fork. **Experimental** = usable but props may change. **Deprecated** = do not use in new work; migrate off. **Internal** = only rendered by another component, never imported directly by a screen.

| Component | Lifecycle | Contract note |
|---|:--:|---|
| OperatorShell, NavSidebar, IntelligencePanel | 🟢 Stable | shell contract frozen; changes stay inside the shell |
| **EvidenceBlock** | 🟢 Stable (**frozen**) | canonical AI-explainability surface (7 screens) — extend props, never fork |
| StatusChip, SkeletonLoader, EmptyState | 🟢 Stable | Tier-0 atoms; high blast radius (`03-component-map.md`) — change only with full re-verify |
| BrandCard, ShootCard, CampaignCard, AssetCard | 🟢 Stable | selection via `onSelect/selected/border` (D-DS5) — host owns the overlay |
| ApprovalCard, PageHeader, SearchBar, FilterBar, WizardStep | 🟢 Stable | — |
| BottomNavigation, BottomSheet | 🟢 Stable | BottomSheet is the canonical sheet primitive (D-DS4); React consolidates all sheets onto it |
| PersistentChatDock | 🟡 Experimental | maps to CopilotKit runtime in React; dock props may firm up during wiring |
| AgentStatusIndicator | 🟡 Experimental | state set (idle·thinking·streaming·awaiting-approval) being formalised (N5) |

**Rules:** promote 🟡→🟢 only after the props survive one real integration unchanged. No component starts Deprecated; when one is retired, mark it ⚠️ Deprecated with the replacement + a removal date, keep one cycle, log in `changelog.md`. **Internal-only** parts (checkbox overlay, bulk bar, drop dock) are host patterns, not components — see `PATTERNS.md#selection`.

## Shared design tokens

Every component carries a minimal `:root` mirror of `tokens.css` (v3) in its `<helmet>`. Canonical names:
`--color-bg-page #fff` · `--color-bg-card #fff` · `--color-bg-subtle #fafafa` · `--color-bg-muted #f4f4f5` · `--color-border #e5e7eb` · `--color-border-strong #d1d5db` · `--color-text-primary #111` · `--color-text-secondary #4b5563` · `--color-text-muted #9ca3af` · `--color-action #111` (black primary) · `--color-approved #059669` · `--color-warning #d97706` · `--approval-border #f3b93c` · `--card-radius 1.25rem` · `--image-radius 1.25rem` · `--radius-md .625rem`. Font: **Inter** UI, monospaced `tnum` for numbers.

---

# Shell & Layout

## OperatorShell
- **Purpose** — the 3-panel grid every operator screen is built on. Composes the shell parts so a screen only supplies workspace content.
- **Anatomy** — CSS grid `auto · minmax(0,1fr) · auto`: `NavSidebar` | `<main data-screen-label="Workspace">` (PageHeader + content + PersistentChatDock) | `IntelligencePanel`.
- **Desktop** — three columns full height. **Mobile (≤1024px)** — NavSidebar → `BottomNavigation`; IntelligencePanel → `BottomSheet`; chat dock pins above the tab bar (workspace reserves tab-bar height).
- **Variants** — with/without right panel (full-width wizards omit it).
- **States** — inherits child states; the shell itself has no state.
- **Tokens** — `--color-bg-page`, `--color-border`, layout widths `--nav-width-collapsed/expanded`, `--intel` width 332px.
- **AI behavior** — hosts PersistentChatDock (center) + IntelligencePanel (right); they are complementary, never duplicated.
- **Accessibility** — landmark roles: `<nav>`, `<main>`, `<aside>`; single H1 in PageHeader; focus order L→R.
- **Usage** — wrap every operator screen. Props: `title`, `subtitle`, `agent`, `brand`.
- **Do** — keep detail content in the center workspace. **Don't** — add a 4th column; put detail in the right panel; make the right panel dark.
- **Note** — nested `dc-import` resolves relative to the root document; preview `OperatorShell.dc.html` directly rather than double-nesting it inside another DC.

## NavSidebar
- **Purpose** — primary navigation rail + brand switcher + account.
- **Anatomy** — hamburger/expand · BRANDS list (image avatar + status dot) · divider · nav items (icon + label) · account avatar pinned bottom.
- **Desktop** — collapsed rail `3.5rem` (icons only) ↔ expanded `14rem` (labels). **Mobile** — replaced by `BottomNavigation`.
- **Variants** — collapsed / expanded (click hamburger).
- **States** — active item = calm thin-grey fill + charcoal label/icon; hover grey; rest transparent.
- **Tokens** — `--nav-item-active`, `--nav-item-hover`, `--color-border`, `--color-action` (account avatar).
- **AI behavior** — approval badge count can sit on the active brand.
- **Accessibility** — `<nav>`; every icon-only button has `aria-label`; 40px targets.
- **Usage** — left column of OperatorShell.
- **Do** — image avatars for brands. **Don't** — colored/orange active states; emoji icons (use Lucide-style line icons).

## IntelligencePanel
- **Purpose** — the always-white executive briefing: context → DNA → approvals → tabs. Not a chatbox.
- **Anatomy** — brand header + status chip · DNA score (mono) + overall bar + Brand/Visual/Voice pillars · approval stack · Overview/Approvals/Activity tabs.
- **Desktop** — fixed 332px right column. **Mobile** — content reflows into a `BottomSheet`.
- **Variants** — summary (no selection) vs detail (item selected) per screen.
- **States** — populated · loading (skeleton rows) · error (inline) · approval-pending (amber cards in stack).
- **Tokens** — `--color-bg-card` (always white), `--approval-border`, `--color-approved`, DNA bar colors (green ≥80 / amber 60–79 / red <60).
- **AI behavior** — surfaces confidence % + evidence on every value; approvals are ApprovalCards.
- **Accessibility** — `<aside>`; tabs keyboard-navigable; numbers in `tnum`.
- **Usage** — right column of OperatorShell. Props: `brand`, `score`.
- **Do** — keep it white in dark OS. **Don't** — make it a transcript; put workspace detail here.

## PersistentChatDock
- **Purpose** — always-present, context-aware agent at the base of the workspace.
- **Anatomy** — agent label + live dot · context greeting · quick-action chips · composer (mic + input + black send).
- **Desktop** — in-flow workspace footer. **Mobile** — pinned above the bottom tab bar (workspace reserves its height); compact padding + height cap.
- **Variants** — idle (greeting) / streaming (live steps via AgentStatusIndicator).
- **States** — greeting · thinking · streaming.
- **Tokens** — `--color-border` top hairline, `--color-action` send, `--color-bg-muted` agent glyph.
- **AI behavior** — greeting **names the active object + next action**; streaming shows step checklist, never a spinner.
- **Accessibility** — labeled mic/send buttons; input ≥44px; live region for streaming text.
- **Usage** — base of every operator workspace (wizards embed it inline). Props: `agent`, `greeting`, `chips`, `placeholder`.
- **Do** — name the context. **Don't** — open with "How can I help?"; overlap the IntelligencePanel.

## PageHeader
- **Purpose** — workspace title block with optional breadcrumb + one primary action.
- **Anatomy** — optional breadcrumb · H1 title · subtitle · right-aligned primary (black) button.
- **Desktop & mobile** — same; on mobile the action may collapse to an icon.
- **Variants** — with/without breadcrumb, subtitle, action.
- **States** — static.
- **Tokens** — `--font-size-2xl` title, `--color-text-secondary` subtitle, `--color-action` button.
- **Accessibility** — exactly one H1 per screen; action is a real `<button>`.
- **Usage** — top of the workspace. Props: `title`, `subtitle`, `crumb`, `actionLabel`.
- **Do** — one primary action. **Don't** — multiple competing buttons.

---

# Image-first Cards

> All four share: image full-bleed to rounded corners at the content ratio, `StatusChip` on an image corner, quiet metadata below on white, 1px hairline that darkens on hover (no shadow jump, no scale). Tokens: `--card-radius`, `--image-scrim`, `--shadow-card`, `--color-border(-strong)`.

## EvidenceBlock
- **Purpose** — the reusable AI-explainability surface: why a score, evidence, AI reasoning, confidence, suggested improvements, before/after, potential score, and Approve/Improve/Regenerate. **Flagship of the DNA experience.**
- **Anatomy** — header (score → potential + confidence + progress) · Why this score · AI reasoning · Evidence (images + bullets) · Suggested improvements (+gain) · Before/After · actions.
- **Props** — `title`, `score`, `potential`, `confidence`, `why`, `reasoning`, `evidence[]`, `evidenceImgs[]`, `suggestions[{text,gain}]`, `beforeImg`, `afterImg`, `onApprove`, `onImprove`, `onRegenerate`. Sections auto-hide when their data is empty.
- **Used on** — Brand Detail (DNA pillars → modal). **Reusable on** — Assets (DNA match), Matching (creator fit), Campaigns, Channel Preview, any AI reasoning panel.
- **Do** — pass real evidence + before/after. **Don't** — show a score without why; duplicate ApprovalCard (this is the explainability variant).

## Charts & KPI (patterns — `docs/design/PATTERNS.md#charts` / `#kpi`)
- **Status** — **LOCKED 2026-07-01 (D-DS6/D-DS9/D-DS11).** These are **token-based pattern instances, not yet shared components.** Compose inline per the spec; a `KpiCard` and/or `Chart` primitive may be **extracted during the SCR-16 Analytics build** if genuinely reusable — until then do not create a component and do not fork per-screen.
- **Chart types (locked set)** — trend (line/area), comparison (bar), score (ring/donut + reuse DNA pillar linear bars), sparkline. Monochrome + one accent; hairline axes; mono numerals.
- **KPI card** — label → big mono value → signed delta (▲/▼ +arrow, never colour-only; invert where down-is-good) → optional sparkline → status dot + **Explain**. Hairline, no shadow.
- **States (mandatory)** — loading (SkeletonLoader in final shape, `aria-busy`), empty ("No data yet" + producer), error (inline Retry), partial/estimated (dashed).
- **Tooltips** — hover **and** focus; tap-to-pin on mobile; object + value, mono.
- **Explainability** — every metric's "why" opens **EvidenceBlock** (never a bespoke popover; never a second explainability surface).
- **A11y/motion** — text alt for every chart; never colour-only series; entrance motion disabled under `prefers-reduced-motion`.
- **Used on** — (none yet) **Reusable on** — Analytics (SCR-16/17), Brand Detail DNA, Shoot Wizard readiness, any inline metric.

## BrandCard
- **Purpose** — a brand in the portfolio. **Ratio** 16:9 cover.
- **Anatomy** — cover + status chip · name + site · mono DNA score + weakest-pillar note · View / Analyse.
- **Variants** — has-data / no-data (crawl CTA) / analysing (progress).
- **States** — default · hover · loading (SkeletonLoader card) · selected.
- **AI behavior** — Analyse triggers a crawl → re-score; weakest pillar flagged.
- **Props** — `name`, `site`, `coverKey`, `status`, `score`, `pillar`, `onAnalyse` (run/re-run DNA crawl), **`onOpen`** (open the brand — wired on Brand List to navigate to `Brand Detail…?id=<id>`; fired by both the cover image and the **View** button so every card, incl. no-data Draft, opens). **Used on** Brand List, Command Center.

## ShootCard
- **Purpose** — a shoot. **Ratio** 4:3 cover.
- **Anatomy** — cover · status chip (top-left) + DNA badge (bottom-right) · name · brand · date.
- **Variants** — status: draft / confirmed / in-production / complete.
- **States** — default · hover · loading · selected.
- **Props** — `name`, `brand`, `date`, `coverKey`, `status`, `score`. **Used on** Shoots List.

## CampaignCard
- **Purpose** — a campaign. **Ratio** 16:9 cover.
- **Anatomy** — cover + status chip · name · date range + deliverables count · progress bar.
- **Variants** — status: planning / active / complete / archived.
- **States** — default · hover · loading · selected.
- **Props** — `name`, `dateRange`, `deliverables`, `coverKey`, `status`, `progress`. **Used on** Campaigns.

## AssetCard
- **Purpose** — a produced asset with DNA-match score. **Ratio** 1:1 (or native in masonry).
- **Anatomy** — image · DNA-match % badge (turns amber when <70 = flagged) · filename · shoot.
- **Variants** — high-match (dark badge) / low-match (amber badge) / selected (multi-select overlay).
- **States** — default · hover · loading · selected.
- **AI behavior** — low match surfaces a replace/improve suggestion in the panel.
- **Props** — `filename`, `shoot`, `coverKey`, `ratio`, `match`, plus selection: `selected`, `border`, `onSelect`. **Used on** Assets, Brand Detail.
- **Selectable/draggable (D-DS5)** — drive multi-select through `onSelect` (toggle in select mode) + `selected`/`border` for the ring; the host adds the checkbox overlay + `draggable` wrapper + drop dock (see `PATTERNS.md#selection`, reference build: Assets). The card itself is **not** forked.

---

# AI & HITL

## ApprovalCard
- **Purpose** — the only gate for an AI write action.
- **Anatomy** — amber status dot + title · before/after diff (two columns) · confidence % (colored number) · evidence source · Approve (black) / Edit (outline) / Discard (ghost).
- **Desktop & mobile** — same; stacks in the IntelligencePanel or appears inline in the workspace.
- **Variants** — with/without diff; pending / approved.
- **States** — pending (amber hairline) → approved (green border + check, then fade).
- **Tokens** — `--approval-border` (amber), `--approval-border-done` (green), `--color-action` (Approve), confidence `--ai-confidence-high/mid/low`.
- **AI behavior** — never auto-approve; always show confidence + evidence + diff.
- **Accessibility** — buttons are real `<button>`s; amber is paired with text + dot, never color alone.
- **Props** — `title`, `state`, `beforeText`, `afterText`, `confidence`, `evidence`. **Used on** every screen with AI writes.
- **Do** — white card + amber hairline. **Don't** — orange background fill; approve without evidence.

## AgentStatusIndicator
- **Purpose** — communicate agent presence + activity.
- **Anatomy** — agent glyph + name + state (dot/label or animated dots).
- **Variants/States** — idle (green Ready) · thinking (3 pulsing dots) · streaming (working) · awaiting-approval (amber).
- **Tokens** — `--color-approved`, `--color-warning`, `--color-text-secondary`; `@keyframes` pulse gated by reduced-motion.
- **Accessibility** — state paired with a label; animation respects `prefers-reduced-motion`.
- **Props** — `agent`, `status`, `label`. **Used on** chat dock, IntelligencePanel.
- **Do** — text label with every state. **Don't** — spinner for AI progress.

---

# Inputs & Filters

## SearchBar
- **Purpose** — filter a list by query. **Anatomy** — magnifier + input in a subtle-grey field; brightens to white + focus border on focus.
- **States** — rest · focus. **Tokens** — `--color-bg-subtle`, `--color-border-focus`.
- **Accessibility** — `<input>` with placeholder; ≥40px. **Props** — `placeholder`. **Used on** list screens.

## FilterBar
- **Purpose** — single-select status/category chips. **Anatomy** — pill row; active chip fills black.
- **States** — per-chip selected/unselected (interactive). **Tokens** — `--color-action` (active), `--color-border`.
- **Accessibility** — real `<button>`s; ≥32px (pair with adequate spacing). **Props** — `options` (comma string). **Used on** Shoots, Assets, Brand List.
- **Do** — short label set. **Don't** — more than ~6 chips (use a Select).

## WizardStep
- **Purpose** — stepped progress for multi-step flows. **Anatomy** — title + "Step N / total" (mono) + segmented progress bar.
- **States** — done (filled) / current / upcoming (muted). **Tokens** — `--color-text-primary` (filled), `--color-bg-muted` (track).
- **Accessibility** — numeric position announced; not color-only (filled vs empty segments). **Props** — `title`, `current`, `total`. **Used on** Shoot Wizard, Onboarding.

---

# Feedback & States

## StatusChip
- **Purpose** — compact status label. **Anatomy** — dot + label pill.
- **Variants** — planning / active / in-production / complete / draft / archived / pending; `onImage` (translucent dark pill for image corners).
- **Tokens** — `--color-border` + per-status dot color; on-image uses `rgba(17,17,17,.5)` + blur.
- **Accessibility** — always carries a text label (never dot-only). **Props** — `status`, `label`, `onImage`. **Used on** every card.
- **Do** — border + dot + label. **Don't** — heavy color fill.

## SkeletonLoader
- **Purpose** — loading placeholder matching the populated layout. **Anatomy** — shimmer blocks.
- **Variants** — card (image + lines + button) · image · line · avatar.
- **States** — animated shimmer; static under `prefers-reduced-motion`.
- **Tokens** — `--color-bg-subtle/-muted` gradient, `--image-radius`.
- **Accessibility** — decorative; reduced-motion safe. **Props** — `variant`, `ratio`, `width`, `height`. **Used on** every loading state.
- **Do** — mirror the final layout. **Don't** — spinner for content.

## EmptyState
- **Purpose** — educate + guide when there's no data. **Anatomy** — faded editorial preview (3 tilted covers) OR icon · heading · body · black CTA · muted AI suggestion.
- **Variants** — preview (default) / icon (when no representative imagery, e.g. connection error).
- **Tokens** — `--image-radius`, `--shadow-card`, `--color-action` (CTA).
- **AI behavior** — the muted line offers the agent's next-best step.
- **Accessibility** — CTA is a real button; preview images decorative. **Props** — `variant`, `heading`, `body`, `ctaLabel`, `aiSuggestion`. **Used on** every empty state.
- **Do** — show what the space will hold + one action. **Don't** — dead end; bare generic icon when imagery fits.

---

# Mobile

## BottomNavigation
- **Purpose** — primary nav on ≤1024px. **Anatomy** — fixed 5-slot tab bar (Home · Shoots · Assets · Brands · More), 56px + safe-area.
- **States** — active (filled icon + 600 weight) / inactive (stroke + 500); More opens the More sheet.
- **Tokens** — `--nav-bg`, `--nav-border`; fill/weight only — no color accent.
- **Accessibility** — `<nav>`; each tab labeled; ≥44px; safe-area inset.
- **Props** — (active index internal). **Used on** all 8 panel screens (mobile).
- **Do** — 5 slots max, rest under More. **Don't** — exceed 5; color the active state.

## BottomSheet
- **Purpose** — mobile container for the IntelligencePanel, More menu, or filters. **Anatomy** — trigger · backdrop · sheet with drag handle + title + close + content.
- **Variants/States** — detents 38% / 62% / 90%; closed/open (snap; transition only in pure-CSS contexts to avoid re-render restart).
- **Adoption (D-DS4, decided 2026-07-01)** — this is the **canonical sheet primitive**. DC prototypes currently ship an equivalent pure-CSS (checkbox-toggle) sheet per screen (functionally identical); **React consolidates every sheet onto this component and adds the focus-trap** (MOBILE-004). Do not fork new sheet variants — extend this one.
- **Tokens** — `--shadow-modal`, `--color-border`, radius 18px top.
- **Accessibility** — dialog semantics; backdrop + handle + close all dismiss; focus trap when open.
- **Props** — `screenLabel`, `triggerLabel`, `title`, `body`, `height`. **Used on** intel panel / More / filters (mobile).
- **Do** — drag handle + backdrop dismiss. **Don't** — full-screen hard modal (reserve for camera/onboarding).

---

## Refactor status

`OperatorShell.dc.html` is **fully composed from these components** (NavSidebar + PageHeader + PersistentChatDock + IntelligencePanel) — it's the reference for how a screen should be assembled, and the template for the next new screen.

The 10 existing screens were built **before** this library and remain the verified source of their own behavior. A blind `dc-import` swap would regress them, because their cards carry screen-specific behavior the generic components intentionally omit:
- **Assets** — masonry variable row heights + click-to-select.
- **Brand List** — View/Analyse actions + has-data / analysing / no-data states.
- **Campaigns / Matching / Shoots** — card selection drives the IntelligencePanel.

**Migrated (rendering via `dc-import`, parity verified):** Shoots List (ShootCard) · Campaigns (CampaignCard) · Brand List (BrandCard, all 3 states) · Assets (AssetCard masonry) · Matching (StatusChip, table status) · Brand Detail (AssetCard `tile` moodboard) · Command Center (ApprovalCard `compact` stack). **All 7 panel screens addressed.**

**Documented bespoke (intentionally not migrated — would regress verified behavior):** Matching swipe deck + data table (bespoke interactions); Brand Detail image-diff HITL card + dotless tinted chips; Command Center workspace image-preview HITL + dotless "active" chip; OperatorShell/PersistentChatDock not retrofitted onto reference screens with wired shell/streaming logic (use them for **new** screens).

**Staged migration plan (per screen, with re-verification):**
1. Add optional, non-breaking props to the relevant card (`selected`, `onSelect`, `height`) so it can carry the screen's interaction without changing its default look.
2. Replace that screen's inline `<sc-for>` card markup with `<dc-import name="components/<Card>" …="{{ item.x }}" select="{{ item.select }}">`.
3. Re-run verification; confirm pixel + behavior parity against the pre-refactor screen.
4. Repeat one screen at a time — never all at once.

Until a screen is migrated and re-verified, its inline markup stays. New screens should be built from the library directly (start from `OperatorShell`).

## Authoring rules (when extending the library)

1. Inline styles only; mirror the needed `tokens.css` names in each component's `<helmet>` `:root` (never invent values).
2. Props are Tweaks-editable — declare editor/default/tsType; read with `this.props.x ?? default` (defaults seed the editor, not runtime).
3. Pure white / grey / black; black primary; no beige, no orange chrome, no gradients.
4. Image-first cards lead with editorial fashion photography (female models in apparel) from `images/`.
5. Reduced-motion safe; ≥44px targets; status never color-only.
6. Compute anything conditional in `renderVals()` — template holes are dotted-path only.
