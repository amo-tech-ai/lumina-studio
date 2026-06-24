# Plan: Port Vite Design to Next.js Operator App

**Goal:** Rebrand the Next.js operator app with the iPix visual design from Vite, and build out the 5 scaffolded operator routes. Vite becomes legacy/reference.

---

## 1. Audit Summary

### Vite Marketing Site (`src/`)
| Route | Component | Lines | Sub-components | framer-motion | FAQ |
|---|---|---|---|---|---|
| `/` | `Index.tsx` | 27 | 7 section components | CSS animations | No |
| `/services/fashion-photography` | `FashionPhotography.tsx` | 356 | `FashionPackages`, `Accordion` | No | Yes |
| `/services/ecommerce-photography` | `EcommercePhotography.tsx` | 358 | `EcommerceExtension`, `Accordion` | No | Yes |
| `/services/clothing` | `ClothingPhotography.tsx` | 364 | `ClothingSlider`, `Accordion` | No | Yes |
| `/services/amazon` | `AmazonPhotography.tsx` | 354 | `Accordion` | No | Yes |
| `/services/location` | `LocationPhotography.tsx` | 447 | `Accordion` | Yes | Yes |
| `/services/jewellery` | `JewelleryPhotography.tsx` | 432 | `Accordion` | Yes | Yes |
| `/services/instagram` | `InstagramCampaigns.tsx` | 312 | None | Yes | No |
| `/services/video` | `VideoProduction.tsx` | 294 | None | Yes | No |
| `/services/shopify` | `ShopifyPhotography.tsx` | 384 | `Accordion` | Yes | Yes |
| `/login` | `Login.tsx` | 200 | shadcn `Card`, `Tabs`, `Input` | No | No |
| `*` | `NotFound.tsx` | 24 | None | No | No |

### Vite Dashboard Pages (shells only — `PlaceholderScreen`)
| Route | Component | Status in Vite |
|---|---|---|
| `/dashboard` | `CommandCenterPage` | Skeleton cards |
| `/dashboard/brand` | `BrandHubPage` | Placeholder (IPI-23) |
| `/dashboard/assets` | `AssetsPage` | Placeholder (IPI-24) |
| `/dashboard/products` | `ProductsPage` | Placeholder (IPI-25) |
| `/dashboard/analytics` | `AnalyticsPage` | Placeholder (IPI-97) |
| `/dashboard/settings` | `SettingsPage` | Placeholder |

### Vite Design System
- **Typography:** Cormorant Garamond (serif headings), Outfit (sans body)
- **Colors:** Warm off-white bg `hsl(30 14% 96%)`, black text, neutral gray scales, custom surface/text tokens
- **Radius:** `0.25rem` (small, subtle)
- **Animations:** `fade-up` (0.8s), `fade-in` (0.6s), framer-motion on ~5 pages
- **Approach:** Tailwind v3 + shadcn/ui + CSS custom properties (HSL)

### Next.js Operator App (`app/src/`)
| Route | Component | Lines | Status |
|---|---|---|---|
| `/` | `CommandCenter` (in `components/command-center/`) | 98 | **Live** — card grid, good structure |
| `/brand` | `SectionPlaceholder` | 11 | Scaffold |
| `/shoots` | `SectionPlaceholder` | 11 | Scaffold |
| `/assets` | `SectionPlaceholder` | 11 | Scaffold |
| `/campaigns` | `SectionPlaceholder` | 11 | Scaffold |
| `/matching` | `SectionPlaceholder` | 11 | Scaffold |

### Next.js Current Design System
- **Typography:** Geist Sans + Geist Mono (via `next/font/google`)
- **Colors:** OKLCH neutral palette, CopilotKit light theme
- **Radius:** `0.625rem` (larger, CopilotKit-standard)
- **Approach:** Tailwind v4 (`@import "tailwindcss"`), CSS Modules for threads drawer, no shadcn/ui installer (hand-written CVA components)
- **Layout:** `OperatorPanel` wrapper (ThreadsDrawer | main | CopilotSidebar)

---

## 2. Route Mapping (Vite → Next.js)

| Vite Route | Vite Component | Next.js Route | Next.js Page | Effort |
|---|---|---|---|---|
| `/dashboard` (shell) + Vite Index design language | `CommandCenterPage` | `/` | `page.tsx` → `CommandCenter` | **Refresh** — restyle existing component |
| `/dashboard/brand` (shell) | `BrandHubPage` | `/brand` | `brand/page.tsx` | **Build** — new workspace page |
| no Vite equivalent (shoot planner is new) | — | `/shoots` | `shoots/page.tsx` | **Build** — new workspace page |
| `/dashboard/assets` (shell) | `AssetsPage` | `/assets` | `assets/page.tsx` | **Build** — new workspace page |
| no Vite equivalent (campaigns is new) | — | `/campaigns` | `campaigns/page.tsx` | **Build** — new workspace page |
| no Vite equivalent (matching is new) | — | `/matching` | `matching/page.tsx` | **Build** — new workspace page |

**Key insight:** The Vite dashboard pages are empty shells. The "visual design close to Vite" means **porting the iPix brand identity** (fonts, colors, spacing, premium aesthetic), not copying page content. Each operator page is a greenfield build.

---

## 3. Design System Migration

### What to Port FROM Vite
| Token | Vite Value | Next.js Current | Action |
|---|---|---|---|
| Heading font | Cormorant Garamond (serif) | Geist Sans | **Replace** with Cormorant Garamond via `next/font/google` |
| Body font | Outfit (sans) | Geist Sans | **Replace** with Outfit via `next/font/google` |
| Background | `hsl(30 14% 96%)` warm off-white | `#ffffff` | **Replace** in `:root` |
| Primary orange | `#E87C4D` | not present (black) | **Add** as new token |
| Mustard accent | `#F3B93C` | not present | **Add** as new token |
| Secondary blue | `#1E293B` | not present | **Add** as new token |
| Surface tokens | 3 warm/light/white | none | **Add** |
| Text color scale | 7-step (primary → caption) | 2-step (fg/muted-fg) | **Add** |
| Border radius | `0.25rem` | `0.625rem` | **Keep Next.js value** — CopilotKit sidebar uses 0.625rem; the operator shell must match |
| Card radius | `calc(0.25rem - 2px)` = `0.125rem` | `0.3125rem` (--radius-sm) | **Keep Next.js value** — consistency with CopilotKit |

### What to Keep FROM Next.js
- Tailwind v4 setup (it's the latest; no reason to downgrade)
- CopilotKit theme tokens (sidebar uses `--primary` as charcoal black — those must stay to match the CopilotSidebar)
- The `--radius` scale (matches CopilotKit sidebar radius)
- CSS Modules for threads drawer (it works, no need to rewrite)
- All CopilotKit, Mastra, and AG-UI integrations

### The Approach: Layer iPix brand ON TOP of CopilotKit theme

The CopilotSidebar and ThreadsDrawer use their own palette (charcoal primary, neutral grays). The **center content area** (`{children}` in OperatorPanel) gets the iPix brand. This means:

```
globals.css
  ├── :root — CopilotKit theme tokens (keep, for sidebar/drawer)
  ├── .operatorContent or data-attribute — iPix design tokens scoped to the main panel
  └── Typography — Cormorant Garamond + Outfit loaded via next/font/google
```

No global font replacement — the CopilotSidebar and ThreadsDrawer keep Geist via CopilotKit's own styles. Only the center panel gets iPix fonts.

---

## 4. Page-by-Page Rebuild Plan

### `/` — Command Center (Refresh)
**Current:** 98-line component, clean card grid, works well. Geist font, neutral colors.

**Action:**
- Apply iPix typography to heading/text (Cormorant Garamond for h1, Outfit for body)
- Update card styling to use warm surface + orange accent
- Enrich the card content: add icons, stats, or status indicators per workspace
- Keep layout structure and routing

### `/brand` — Brands Workspace (Build)
**Scope:** Brand hub with list/detail pattern. Shows analyzed brands, DNA scores, intake status.

**Inspiration from Vite:** Cards with hover effects, serif headings, warm surface backgrounds, orange CTAs.

**Build:**
- Title + description header with iPix typography
- Brand list/grid with status cards (compliance score, readiness %)
- Each card: brand name, industry, score badge, last analyzed date
- Empty state: "No brands yet — start brand intake"
- Link to intake flow (when built)

### `/shoots` — Shoots Workspace (Build)
**Scope:** Shoot planner dashboard. Upcoming shoots, recent shoots, quick-create.

**Build:**
- Calendar/agenda section (upcoming shoots list)
- Recent shoots grid with thumbnails
- Quick-create card: "Plan a new shoot"
- Status badges (Draft, Scheduled, In Progress, Complete)
- Empty state: "No shoots planned yet"

### `/assets` — Assets Workspace (Build)
**Scope:** Asset library with DNA compliance. Grid of uploaded media with scores.

**Build:**
- Asset grid (even empty, show the layout pattern)
- Filter/tag bar (All, Review, Approved, Blocked)
- Each asset card: thumbnail, name, DNA score badge, date
- Empty state: "No assets uploaded yet"
- DNA compliance badges (green `Approved`, amber `Review`, red `Blocked`)

### `/campaigns` — Campaigns Workspace (Build)
**Scope:** Campaign hub for creative briefs and content planning.

**Build:**
- Campaign cards with moodboard previews
- Status: Draft, Active, Completed
- "New Campaign" card
- Empty state: "No campaigns yet"
- Brief summary section

### `/matching` — Matching Workspace (Build)
**Scope:** Match brands with sponsors, designers, models, venues.

**Build:**
- Match cards or list showing pairings
- Confidence score badges
- Filter by match type (Brand-Sponsor, Designer-Model, etc.)
- Empty state: "No matches yet"
- "Find Matches" action button

---

## 5. Component Inventory

### Components to CREATE (shared)
| Component | File | Description |
|---|---|---|
| `PageHeader` | `components/page-header.tsx` | Reusable workspace header: title, description, optional actions. Uses Cormorant Garamond h1 + Outfit body. |
| `StatusBadge` | `components/status-badge.tsx` | Color-coded status pill (Draft, Active, Complete, Approved, Review, Blocked). Maps to DNA compliance colors. |
| `EmptyState` | `components/empty-state.tsx` | Centered illustration + message + CTA for empty workspaces. |
| `StatCard` | `components/stat-card.tsx` | Metric card with label, value, optional trend. |
| `ActionCard` | `components/action-card.tsx` | Clickable card with icon, title, description. |

### Components to REUSE (existing Next.js)
| Component | File | Action |
|---|---|---|
| `CommandCenter` | `components/command-center/command-center.tsx` | Restyle internally (fonts, colors). Keep structure. |
| `Card` / `CardContent` etc. | `components/ui/card.tsx` | Keep — style adapts via CSS vars |
| `Button` | `components/ui/button.tsx` | Keep — add `brand` variant (orange) |
| `OperatorPanel` | `components/operator-panel/operator-panel.tsx` | No changes |
| `ThreadsDrawer` | `components/threads-drawer/` | No changes |
| `SectionPlaceholder` | `components/section-placeholder.tsx` | Keep as reference, but replace in each route |

### Components to NOT PORT from Vite
| Vite Component | Reason |
|---|---|
| `Header.tsx` | Marketing site top nav — not relevant to operator app |
| `Footer.tsx` | Marketing site footer — not relevant to operator app |
| `HeroSection` / `ServicesSection` / etc. | Homepage sections — not relevant to operator app |
| `FashionPackages` / `ClothingSlider` / `EcommerceExtension` | Service page specific — not relevant |
| `PlaceholderScreen` | Replaced by actual content in Next.js |
| `OperatorLayout` / `OperatorNav` | Replaced by `OperatorPanel` in Next.js |
| `ProtectedRoute` | Auth model differs in Next.js (not yet designed) |
| `NavLink` | React Router specific |
| shadcn Accordion/Slider | Only used by service page FAQ/temperature sliders — not needed in operator app |

---

## 6. Implementation Checklist

### Phase 1: Design System Foundation (1 session)
- [ ] Add Cormorant Garamond + Outfit fonts via `next/font/google` in `layout.tsx`
- [ ] Add iPix brand CSS variables to `globals.css` scoped under `.operatorContent`
- [ ] Add orange brand button variant to `button.tsx`
- [ ] Create shared components: `PageHeader`, `StatusBadge`, `EmptyState`, `StatCard`, `ActionCard`
- [ ] Add font-family override to the center panel in `OperatorPanel`
- [ ] Update `Card` to support warm surface variant

### Phase 2: Command Center Refresh (1 session)
- [ ] Apply iPix fonts to `CommandCenter` headings/text
- [ ] Update card styling with surface-warm background + orange icon accent
- [ ] Add subtle hover/transition effects

### Phase 3: Brand Page (1 session)
- [ ] Create `/brand` page with `PageHeader` + workspace layout
- [ ] Build brand list/grid with status cards
- [ ] Add empty state
- [ ] Wire up `navigateTo` frontend tool context

### Phase 4: Shoots Page (1 session)
- [ ] Create `/shoots` page with `PageHeader` + workspace layout
- [ ] Build upcoming/recent shoots sections
- [ ] Add status badges
- [ ] Add empty state + quick-create card

### Phase 5: Assets Page (1 session)
- [ ] Create `/assets` page with `PageHeader` + filter bar
- [ ] Build asset grid with thumbnail placeholder + DNA badges
- [ ] Add empty state
- [ ] Add filter/tag chip UI

### Phase 6: Campaigns Page (1 session)
- [ ] Create `/campaigns` page with `PageHeader`
- [ ] Build campaign cards with moodboard placeholder + status
- [ ] Add empty state + "New Campaign" action

### Phase 7: Matching Page (1 session)
- [ ] Create `/matching` page with `PageHeader`
- [ ] Build match cards with confidence scores
- [ ] Add filter bar (match type)
- [ ] Add empty state + "Find Matches" button

### Phase 8: Polish & Validation (1 session)
- [ ] Consistency pass across all 6 pages
- [ ] Run `npm run test`
- [ ] Run `npm run lint`
- [ ] Run `npm run build`
- [ ] Run `npx tsc --noEmit`
- [ ] Verify CopilotKit sidebar renders on every route
- [ ] Verify `navigateTo` frontend tool works
- [ ] Verify Command Center cards link correctly

---

## 7. Effort Estimate

| Phase | Sessions | Files Changed | Complexity |
|---|---|---|---|
| 1 — Design System Foundation | 1 | 5-7 | Medium (font setup, CSS vars, shared components) |
| 2 — Command Center Refresh | 1 | 1 | Low (styling only) |
| 3 — Brand Page | 1 | 2-3 | Medium (new page with list/grid) |
| 4 — Shoots Page | 1 | 2-3 | Medium |
| 5 — Assets Page | 1 | 2-3 | Medium |
| 6 — Campaigns Page | 1 | 2-3 | Medium |
| 7 — Matching Page | 1 | 2-3 | Medium |
| 8 — Polish & Validation | 1 | 2-5 | Low (testing, consistency) |
| **Total** | **8** | **~20-30** | |

**Realistic timeline:** 4-5 days (2 sessions/day) for one developer.

---

## 8. What to Watch For

1. **Font override collision:** CopilotKit sidebar uses Geist. The center panel must get iPix fonts via a scoped class/selector, not a global `body` font-family change.
2. **Tailwind v3 → v4 migration gap:** Vite uses Tailwind v3 (`@tailwind base`), Next.js uses Tailwind v4 (`@import "tailwindcss"`). CSS custom properties port directly, but the Tailwind config approach differs (v4 uses `@theme` inline directives instead of `tailwind.config.ts`). iPix CSS vars must be declared as `@theme` tokens for Tailwind v4 utility classes to work.
3. **No auth layer yet:** The operator pages render without auth checks. The user explicitly says "No new public deployment until auth/deployment plan is clear." Pages should work server-side without Supabase session dependency.
4. **CopilotKit CSS scope:** The CopilotKit V2 styles (`@copilotkit/react-core/v2/styles.css`) set their own colors. iPix design tokens should layer on top in the content area only.
5. **Next.js 16 + React 19:** The app runs on the latest versions. Avoid deprecated React patterns (`defaultProps`, string refs, legacy context).

---

## 9. Recommendation: Should We Retire Vite?

**After completion — YES, with phased approach:**

### Phase A (after this project): Keep Vite for marketing site
The 10 marketing pages in Vite are the live `www.ipix.co`. Do NOT touch them until:
- A separate marketing-site port is planned (see `docs/website/02/pages-inventory.md` which maps all 10)
- DNS / deployment plan is clear
- SEO parity is verified

### Phase B (next project): Port marketing pages to Next.js separately
The 10 marketing pages can live under a `(marketing)` route group in the Next.js app, sharing the same design system as the operator app. This unifies the codebase.

### Phase C: Decommission Vite
Once both operator AND marketing pages run on Next.js:
- Remove Vite dependencies from root `package.json`
- Delete `src/pages/`, `src/components/` (marketing parts)
- Archive `vite.config.ts`
- Point `www.ipix.co` DNS to the Next.js deployment

### Current state: Vite stays alive for `www.ipix.co`
The marketing site is **not** being replaced yet. This project only affects the operator app (`app/`). The Vite `src/` remains untouched.

---

## 10. Validation Commands

```bash
cd app
npm run test        # Vitest
npm run lint        # ESLint
npm run build       # Production build (typechecks via next build)
npx tsc --noEmit    # Additional type check
```

All must pass before any commit.
