# 01 — Overview

> Orientation for the FashionOS / iPix implementation. See [02-screen-map](02-screen-map.md) for screens, [03-component-map](03-component-map.md) for components.

## Project purpose
**FashionOS (iPix)** is an **AI-native operator workspace for fashion brands**. A small operator team manages brands, plans and runs photo shoots, curates assets, matches creators, builds campaigns, and previews/publishes content across channels — with an AI co-pilot present on every screen that knows the active object and proposes the next best action.

## Design philosophy
- **AI-first, not form-first.** The AI drafts; the human reviews and approves (HITL). Wizards are "AI planners," not blank forms — fields arrive pre-filled.
- **Image-first.** Editorial fashion photography (female models in apparel) leads every content object. Galleries are masonry/justified grids, never icon tables.
- **Calm, editorial, premium.** Borders over shadows, generous whitespace, monospaced numerals, no decorative gradients.

## Zeely Editorial v3 (visual system — see `DESIGN.md` + `tokens.css`)
- **Colour:** pure white `#FFFFFF` page, light-grey `#FAFAFA` surfaces, `#E5E7EB` hairlines, `#111` primary text / `#6B7280` secondary. **Black** primary actions (`--color-action:#111`). No beige, no orange chrome (orange retired). Amber reserved for HITL/attention only.
- **Type:** **Inter** for all UI; mono numerals (`font-feature-settings:'tnum'`) for scores/IDs/dates.
- **Radii:** ~20px cards & images (`--card-radius`), ~10px controls (`--radius-md`).
- **Elevation:** 1px hairlines separate surfaces; shadows only for transient overlays (modal, sheet, popover, toast).
- **Status dots:** 🟢 ready/complete · 🟡 needs attention · ⚪ stale/not-started · 🔴 blocked/critical.

## Desktop layout — 3-panel OperatorShell
```
┌────────────┬───────────────────────────┬──────────────────┐
│ NavSidebar │ Workspace (scrolls)       │ IntelligencePanel│
│ rail↔expand│  ─ page content           │  context · scores│
│ brands     │  ─ cards / tabs / grids   │  approvals · tabs│
│ nav links  │  ─ PersistentChatDock ▼   │  (white always)  │
└────────────┴───────────────────────────┴──────────────────┘
```
- **NavSidebar** collapses to a 3.5rem icon rail, expands to 14rem (`--nav-width-collapsed/expanded`).
- **Workspace** is the only place detail content lives. The **PersistentChatDock** is pinned at its base.
- **IntelligencePanel** (right) is always white; holds context → scores → approvals → tabs. In the prototypes it is labelled "Target — not production-wired"; production builds it for real.

## Mobile layout (`max-width:1024px` — see `MOBILE-PLAN.md`)
- NavSidebar hidden → **BottomNavigation** tab bar (Home · Shoots · Assets · Brands · More) + **More sheet** (Campaigns · Matching · Channel Preview · Onboarding · Settings · Account).
- IntelligencePanel becomes a **bottom sheet** (trigger pill, e.g. "Portfolio"/"Insights").
- PersistentChatDock pinned above the tab bar.
- Wizard/Onboarding are full-screen single-focus flows.

## AI-first workflow (see [06-ai-workflows](06-ai-workflows.md))
Every operator screen carries a context-aware dock: a greeting that **names the active object + next action** (never "How can I help?"), 3–5 quick-action chips, and live streaming status (green check = done, pulsing dot = active, faint dot = pending — never a spinner). Five Mastra agents back the screens; `production-planner` + `creative-director` are durable, `brand-intelligence` is **not** (use error+retry, not resumable streams).

## Image-first workflow (see [05-feature-map](05-feature-map.md))
Content objects (brands, shoots, campaigns, assets, creators) lead with photography at the correct ratio (16:9 brand/campaign/shoot covers, 4:5 assets, portraits for creators). Prototype images come from `images/<key>-fashionos.jpeg`; production uses Cloudinary with DNA/spec checks post-upload.
