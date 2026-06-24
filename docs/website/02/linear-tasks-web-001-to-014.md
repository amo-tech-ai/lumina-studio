# Linear Tasks — Marketing Site Migration

**Epic:** IPI2-135 · PLT-015 · MKT — Consolidate marketing site into Next.js

---

## WEB-001 — Marketing Foundation and Shared Layout

**Route:** N/A (infrastructure)
**Source Vite component:** `src/App.tsx` (marketing routes), `src/components/Header.tsx`, `src/components/Footer.tsx`
**Target Next.js file paths:**
- `app/src/app/(marketing)/layout.tsx`
- `app/src/app/(marketing)/marketing.css`
- `app/src/components/marketing/header.tsx`
- `app/src/components/marketing/footer.tsx`
- `app/src/components/marketing/animated-section.tsx`
- `app/src/components/marketing/faq.tsx`

**Scope:**

**🔴 A1 — Route group safety (the critical blocker — do this FIRST):** route groups inherit the root `layout.tsx`, so a `(marketing)` group alone is not enough. Restructure:
1. **Root layout cleanup** — `app/src/app/layout.tsx` = `<html>/<body>` + fonts + metadata **only**. Remove `<CopilotKit>` + `<OperatorPanel>` from it.
2. **Marketing group** — `app/src/app/(marketing)/layout.tsx` = Header + Footer only. **No CopilotKit, no OperatorPanel.**
3. **Operator group** — `app/src/app/(operator)/layout.tsx` = `<CopilotKit>` + `<OperatorPanel>` only (the shell moved out of root). Move the existing operator routes (`/brand`, `/shoots`, `/assets`, `/campaigns`, `/matching`, Command Center) under it; update `navigateTo` + ThreadsDrawer/Command-Center hrefs.
4. **Route decision** — move operator routes to `/app/*` now (recommended) or keep current paths if safe; decide `/app/*` vs `app.ipix.co` per IPI2-135.

Without step 1, every marketing page still renders the operator sidebar and the acceptance criteria below cannot pass.

- Add Cormorant Garamond + Outfit fonts via `next/font/google`
- Create `marketing.css` with all iPix design tokens scoped under `.marketing`
- Port `Header.tsx` → `MarketingHeader` (replace `<a>` scroll links with `<Link>`, scroll-aware)
- Port `Footer.tsx` → `MarketingFooter` (all service links, social icons)
- Create reusable `AnimatedSection` client component (IntersectionObserver-based, replaces framer-motion)
- Create reusable `FAQ` component (wraps shadcn Accordion — or a minimal custom accordion)
- Copy images used by the 12 marketing pages from `src/assets/` to `app/public/images/` (keep unused assets out of app/public/images)
- Verify route group isolation (marketing pages render without operator sidebar)

**Components needed:**
- `MarketingHeader` — scroll-aware nav, mobile hamburger, 5 links, "Get a Quote" button
- `MarketingFooter` — dark 5-column footer, 9 service links, social icons, contact info
- `AnimatedSection` — "use client", IntersectionObserver, fade-up on scroll (replaces framer-motion)
- `FAQ` — accordion component for service page FAQ sections

**SEO metadata required:**
- Root marketing layout: `metadataBase`, default OG image, fallback title/description
- No per-page metadata in this task

**Visual parity checklist:**
- Header matches Vite: fixed position, scroll-aware backdrop blur, exact nav links, "ipix." logo font
- Footer matches Vite: dark bg, 5-column grid, same links, social icons, contact info
- CSS variables produce identical background/warm/off-white color to Vite
- Cormorant Garamond + Outfit render identically to Google Fonts import in Vite

**Acceptance criteria:**
- `/` under `(marketing)` renders Header + Footer + empty main (no CopilotSidebar)
- `/brand` (outside `(marketing)`) still renders CopilotKit sidebar unchanged
- Fonts load correctly on marketing pages
- All image assets accessible at `/images/*` in Next.js
- `npm run build` succeeds

---

## WEB-002 — Home Page

**Route:** `/`
**Source Vite component:** `src/pages/Index.tsx`, `src/components/HeroSection.tsx`, `src/components/ServicesSection.tsx`, `src/components/PortfolioSection.tsx`, `src/components/ProcessSection.tsx`, `src/components/ClientsSection.tsx`, `src/components/CTASection.tsx`
**Target Next.js file path:** `app/src/app/(marketing)/page.tsx`
**Also creates:** `app/src/components/marketing/hero-section.tsx`, `app/src/components/marketing/services-section.tsx`, `app/src/components/marketing/portfolio-section.tsx`, `app/src/components/marketing/process-section.tsx`, `app/src/components/marketing/clients-section.tsx`, `app/src/components/marketing/cta-section.tsx`

**Scope:**
- Port Home page layout (`Index.tsx` — wrapper + section composition)
- Port all 6 section components as server components (no client JS):
  - `HeroSection`: split layout, heading "Exceptional Imagery. Every Time.", CTA buttons, hero image
  - `ServicesSection`: 8-card grid with lucide icons
  - `PortfolioSection`: 6-image grid with hover overlay
  - `ProcessSection`: 4-step process
  - `ClientsSection`: 10 brand names
  - `CTASection`: contact form (static, no backend)
- Replace `react-router <a>` with `next/link <Link>`
- Replace `import img from "@/assets/..."` with `<Image>` or `<img>` pointing to `/images/`
- Use Tailwind animations (`animate-fade-up`, `animate-fade-in`) for server components

**Components needed:**
- `HeroSection` — server component, CSS animations
- `ServicesSection` — server component
- `PortfolioSection` — server component, `next/image` for gallery
- `ProcessSection` — server component
- `ClientsSection` — server component
- `CTASection` — server component, static form

**SEO metadata required:**
- `title: "iPix — AI-Powered Content Studio for Fashion Brands"`
- `description: "AI-powered platform that plans photoshoots, generates shot lists, and creates on-brand content."`
- `openGraph` with home OG image

**Visual parity checklist:**
- Hero: "Exceptional Imagery. Every Time." heading, same font weights, CTA buttons match
- Hero image: same aspect ratio, positioning, animation timing
- Services: 8 cards in 4-column grid, same icons, hover effects
- Portfolio: 6 images in span grid, hover overlay animation
- Process: 4-step layout, step numbers, same divider styling
- Clients: "Trusted By Leading Brands", same 10 names, same font styling
- CTA: form fields match (Name, Email, Company, Message), same border style
- All spacing (py-24, px-6, gap-*) matches Vite

**Acceptance criteria:**
- Home page renders identically to Vite at desktop and mobile widths
- All section anchors (`#services`, `#portfolio`, `#process`, `#about`, `#contact`) scroll correctly
- Internal links use `<Link>` (no full page reload)
- All images load with correct aspect ratios
- `npm run build` succeeds

---

## WEB-003 — Fashion Photography Page

**Route:** `/services/fashion-photography`
**Source Vite component:** `src/pages/FashionPhotography.tsx`, `src/components/FashionPackages.tsx`
**Target Next.js file path:** `app/src/app/(marketing)/services/fashion-photography/page.tsx`
**Also creates:** `app/src/components/marketing/fashion-packages.tsx`

**Scope:**
- Port Fashion Photography service page (356 lines in Vite)
- Port `FashionPackages` sub-component (257 lines, interactive pricing toggle)
- 11 sections: Hero, AI Strategy, Portfolio, Creative Temperature, Deliverables by Platform, Workflow, Benefits, Case Study, Studio+AI, Packages, FAQ, Final CTA
- Create `FashionPackages` as client component (toggle state, animated switching)
- Replace framer-motion `motion.div` with `AnimatedSection` (from WEB-001)

**Components needed:**
- `FashionPackages` — "use client", shoot type toggle (Ghost/Model/Creative), 3 pricing tiers, add-ons
- `FAQ` — from WEB-001

**SEO metadata required:**
- `title: "Fashion Photography | iPix — AI-Planned Content Studio"`
- `description: "AI-planned fashion photography. Data-backed shot lists, platform-optimized deliverables."`
- Per-service OG image

**Visual parity checklist:**
- Hero: heading "AI-Planned Fashion Photography. Built to Perform." same image
- AI Strategy: 4 cards with same icons, flow diagram steps
- Portfolio: filter buttons, 6-image grid
- Creative Temperature: same slider visual
- Case Study: 3 metrics (+32%, +40%, -30%)
- Packages: toggle works, pricing changes, "Most Popular" badge on middle card
- FAQ: 5 questions, accordion works

**Acceptance criteria:**
- All 11 sections render with correct content
- Package toggle switches pricing between Ghost/Model/Creative
- FAQ accordion opens/closes
- Images load correctly (fashion-hero, fashion-studio, fashion-casestudy, portfolio images)
- `npm run build` succeeds

---

## WEB-004 — E-commerce Photography Page

**Route:** `/services/ecommerce-photography`
**Source Vite component:** `src/pages/EcommercePhotography.tsx`, `src/components/EcommerceExtension.tsx`
**Target Next.js file path:** `app/src/app/(marketing)/services/ecommerce-photography/page.tsx`
**Also creates:** `app/src/components/marketing/ecommerce-extension.tsx`

**Scope:**
- Port eCommerce Photography page (358 lines in Vite)
- Port `EcommerceExtension` sub-component (392 lines, 7 sub-sections)
- 12 sections: Hero, AI Strategy, Portfolio, Platform Deliverables, Creative Temperature, High-Volume Production, Workflow, Benefits, EcommerceExtension, Case Study, FAQ, Final CTA
- `EcommerceExtension` includes: AI Planning mockup, Amazon image slider, Image Types grid, Creative Temperature slider (shadcn Slider), Workflow, Performance Metrics, Final CTA
- Replace framer-motion with `AnimatedSection`

**Components needed:**
- `EcommerceExtension` — "use client", interactive slider, image carousel
- `FAQ` — from WEB-001

**SEO metadata required:**
- `title: "eCommerce Photography | iPix — AI-Planned Product Imagery"`
- `description: "AI-planned eCommerce photography that drives sales. Marketplace-ready assets."`

**Visual parity checklist:**
- Hero: "Drive Sales with AI-Planned eCommerce Photography." same layout
- EcommerceExtension: image slider works, Creative Temperature slider functions
- FAQ: accordion works
- All 7 images load correctly

**Acceptance criteria:**
- All 12 sections render correctly
- Image slider in EcommerceExtension works
- Creative Temperature slider is interactive
- FAQ accordion works
- `npm run build` succeeds

---

## WEB-005 — Clothing Photography Page

**Route:** `/services/clothing`
**Source Vite component:** `src/pages/ClothingPhotography.tsx`, `src/components/ClothingSlider.tsx`
**Target Next.js file path:** `app/src/app/(marketing)/services/clothing/page.tsx`
**Also creates:** `app/src/components/marketing/clothing-slider.tsx`

**Scope:**
- Port Clothing Photography page (364 lines in Vite)
- Port `ClothingSlider` sub-component (231 lines, dark slider gallery)
- Sections: Hero, Problem/Solution, ClothingSlider, Content Types, AI Workflow, Platform Table, Creative Temperature, Why iPix, Case Example, FAQ, Final CTA

**Components needed:**
- `ClothingSlider` — "use client", horizontal scroll, arrows, dots, 5 slides

**SEO metadata required:**
- `title: "Clothing Photography | iPix — AI-Planned Apparel Content"`
- `description: "AI-planned clothing photography. Ghost mannequin, on-model, and creative shoots."`

**Visual parity checklist:**
- ClothingSlider: dark theme, horizontal scroll, navigation arrows, dot indicators, 5 images
- Platform table renders with correct columns
- FAQ accordion works

**Acceptance criteria:**
- ClothingSlider scrolls and navigates correctly
- All 5 slider images load
- FAQ accordion works
- `npm run build` succeeds

---

## WEB-006 — Amazon Photography Page

**Route:** `/services/amazon`
**Source Vite component:** `src/pages/AmazonPhotography.tsx`
**Target Next.js file path:** `app/src/app/(marketing)/services/amazon/page.tsx`

**Scope:**
- Port Amazon Photography page (354 lines)
- 8 sections: Hero, Why Amazon Content, AI Advantage, Deliverables, Workflow, Benefits, Case Study, FAQ, Final CTA
- No framer-motion (Vite Amazon page does not use it)
- No sub-components (unlike Fashion/Ecommerce/Clothing)

**Components needed:**
- `FAQ` — from WEB-001

**SEO metadata required:**
- `title: "Amazon Photography | iPix — AI-Planned Listing Images"`
- `description: "Amazon photography and listing optimization. AI-planned product images."`

**Visual parity checklist:**
- Hero: full-screen with `#F4F3F1` background (unique to Amazon page)
- Same icon set, layout, spacing as Vite
- FAQ accordion works

**Acceptance criteria:**
- All 8 sections render correctly
- Unique hero background color matches Vite
- FAQ accordion works
- `npm run build` succeeds

---

## WEB-007 — Location Photography Page

**Route:** `/services/location`
**Source Vite component:** `src/pages/LocationPhotography.tsx`
**Target Next.js file path:** `app/src/app/(marketing)/services/location/page.tsx`

**Scope:**
- Port Location Photography page (447 lines — longest service page)
- 12 sections: Hero (full-screen image overlay with dark gradient), Locations Grid, AI Strategy, Portfolio, Deliverables, Workflow, Benefits, Case Study, Studio+AI, FAQ, Final CTA
- Replace framer-motion `AnimatedSection` pattern with shared `AnimatedSection` from WEB-001
- 8 location images

**Components needed:**
- `AnimatedSection` — from WEB-001
- `FAQ` — from WEB-001

**SEO metadata required:**
- `title: "Location Photography | iPix — On-Location Fashion Shoots"`
- `description: "On-location fashion photography. Urban, coastal, and lifestyle shoots."`

**Visual parity checklist:**
- Hero: full-screen image overlay with dark gradient heading
- 8 location images in responsive grid
- All scroll-triggered animations work via AnimatedSection
- FAQ accordion works

**Acceptance criteria:**
- Full-screen hero renders with gradient overlay
- All location images load
- Scroll animations trigger correctly
- FAQ accordion works
- `npm run build` succeeds

---

## WEB-008 — Jewellery Photography Page

**Route:** `/services/jewellery`
**Source Vite component:** `src/pages/JewelleryPhotography.tsx`
**Target Next.js file path:** `app/src/app/(marketing)/services/jewellery/page.tsx`

**Scope:**
- Port Jewellery Photography page (432 lines)
- 10 sections: Hero, AI Strategy, Portfolio, Macro Detail, Platform Deliverables, Workflow, Benefits, Case Study, FAQ, Final CTA
- Replace framer-motion with `AnimatedSection`
- 7 jewellery images

**Components needed:**
- `AnimatedSection` — from WEB-001
- `FAQ` — from WEB-001

**SEO metadata required:**
- `title: "Jewellery Photography | iPix — Precision Macro & Lifestyle"`
- `description: "Precision jewellery photography. AI-planned macro, lifestyle, and ecommerce shots."`

**Visual parity checklist:**
- Hero: image + copy layout
- Dark-themed "iPix Advantage" section
- FAQ accordion works

**Acceptance criteria:**
- All 10 sections render correctly
- All jewellery images load
- FAQ accordion works
- `npm run build` succeeds

---

## WEB-009 — Instagram Campaigns Page

**Route:** `/services/instagram`
**Source Vite component:** `src/pages/InstagramCampaigns.tsx`
**Target Next.js file path:** `app/src/app/(marketing)/services/instagram/page.tsx`

**Scope:**
- Port Instagram Campaigns page (312 lines)
- 9 sections: Hero, Deliverables, Process Steps, Portfolio, Packages, Taglines, Why iPix, Final CTA
- No FAQ section (Vite Instagram page does not have one)
- Replace framer-motion with `AnimatedSection`
- 5 instagram images

**Components needed:**
- `AnimatedSection` — from WEB-001

**SEO metadata required:**
- `title: "Instagram Campaigns | iPix — Scroll-Stopping Content"`
- `description: "Scroll-stopping Instagram content. AI-planned campaigns for Reels, Stories, and feed."`

**Visual parity checklist:**
- Hero: Instagram-specific visual (phone mockup if present)
- Taglines section: quoted italic text
- Process: 6-step layout with data arrays

**Acceptance criteria:**
- All 9 sections render correctly
- Taglines render with correct styling
- `npm run build` succeeds

---

## WEB-010 — Video Production Page

**Route:** `/services/video`
**Source Vite component:** `src/pages/VideoProduction.tsx`
**Target Next.js file path:** `app/src/app/(marketing)/services/video/page.tsx`

**Scope:**
- Port Video Production page (294 lines — shortest service page)
- 9 sections: Hero, Brand Content, Product Video, Social Video, Motion Graphics, Process, Packages, Taglines, Final CTA
- No FAQ section
- Replace framer-motion with `AnimatedSection`
- 5 video images

**Components needed:**
- `AnimatedSection` — from WEB-001

**SEO metadata required:**
- `title: "Video Production | iPix — Cinematic Fashion Video"`
- `description: "Cinematic fashion video production. AI-planned brand films and social content."`

**Visual parity checklist:**
- Hero: video-specific visual
- 4 content category sections (Brand, Product, Social, Motion)
- Process: 6-step layout

**Acceptance criteria:**
- All 9 sections render correctly
- All video images load
- `npm run build` succeeds

---

## WEB-011 — Shopify Photography Page

**Route:** `/services/shopify`
**Source Vite component:** `src/pages/ShopifyPhotography.tsx`
**Target Next.js file path:** `app/src/app/(marketing)/services/shopify/page.tsx`

**Scope:**
- Port Shopify Photography page (384 lines)
- 10 sections: Hero, AI Strategy, Portfolio, Platform-Specific, Packages, Workflow, Benefits, FAQ, Final CTA
- Has packages table with "featured" card style
- Has FAQ section
- Replace framer-motion with `AnimatedSection`
- 5 shopify images

**Components needed:**
- `AnimatedSection` — from WEB-001
- `FAQ` — from WEB-001

**SEO metadata required:**
- `title: "Shopify Photography | iPix — Conversion-Optimized Product Images"`
- `description: "Shopify-optimized product photography. AI-planned imagery that converts."`

**Visual parity checklist:**
- Hero: Shopify-specific heading
- Packages: featured card with "Most Popular" badge, price cards
- Dark CTA section
- FAQ accordion works

**Acceptance criteria:**
- All 10 sections render correctly
- Package cards display correctly with featured styling
- Dark CTA section matches Vite
- FAQ accordion works
- `npm run build` succeeds

---

## WEB-012 — Login Page

**Route:** `/login`
**Source Vite component:** `src/pages/Login.tsx`
**Target Next.js file path:** `app/src/app/(marketing)/login/page.tsx`

**Scope:**
- Port Login page (200 lines) — UI only
- Card layout centered on warm background
- Tabs: Sign in / Sign up
- Form fields: Email, Password
- **Stub auth functions** — do NOT import Vite's `useAuth` context or `supabase` client
- Replace `react-router` `Link`/`Navigate`/`useNavigate`/`useSearchParams` with Next.js equivalents
- Add TODO comments for Supabase integration

**Components needed:**
- shadcn `Card`, `Input`, `Label`, `Tabs`, `Button` (port existing `app/src/components/ui/` or create if missing)

**SEO metadata required:**
- `title: "Sign In | Lumina Studio — iPix"`
- `description: "Sign in to Lumina Studio for AI-powered brand intelligence."`
- `noindex: true` (login page should not be indexed)

**Visual parity checklist:**
- Centered card matches Vite: same spacing, "Lumina Studio" branding, tab layout
- Form fields match (Email, Password)
- Button styling matches

**Acceptance criteria:**
- Login page renders with correct UI
- Tabs switch between Sign in / Sign up
- Form validation works (required fields)
- Auth functions are stubbed with TODO — no Supabase dependency imported
- Page is `noindex`
- `npm run build` succeeds

---

## WEB-013 — Not Found Page

**Route:** `*` (catch-all 404)
**Source Vite component:** `src/pages/NotFound.tsx`
**Target Next.js file path:** `app/src/app/not-found.tsx`

**Scope:**
- Port 404 page (24 lines)
- Centered "404" heading, "Oops! Page not found" message, link back to Home
- Replace `<a href="/">` with `<Link href="/">`
- Place in root `app/` (not inside `(marketing)`) so it catches all routes including operator

**Components needed:**
- None (self-contained)

**SEO metadata required:**
- `title: "404 — Page Not Found | iPix"`
- `noindex: true`

**Visual parity checklist:**
- Heading "404" same size and weight
- "Oops! Page not found" text matches
- Return to Home link works

**Acceptance criteria:**
- Navigating to `/nonexistent-route` shows 404 page
- "/" link navigates to home
- `npm run build` succeeds

---

## WEB-014 — SEO, Responsive, Visual Parity, and Cutover Checklist

**Route:** N/A (verification)
**Source Vite component:** All pages
**Target Next.js file path:** N/A (no code changes)

**Scope:**
- Verify all metadata exports produce correct `<title>` and `<meta>` tags
- Run Lighthouse audit on all 12 pages (mobile + desktop)
- Responsive testing: 375px, 768px, 1024px, 1440px
- Visual parity: side-by-side comparison of Vite dev server vs Next.js dev server for all pages
- Verify no CopilotKit/operator UI leaks into marketing pages
- Verify internal navigation works with `<Link>` (no full reloads)
- Verify all images load with correct dimensions
- Run full validation suite:
  ```bash
  cd app
  npm run test
  npm run lint
  npm run build
  npx tsc --noEmit
  ```
- Document any visual discrepancies found
- Update the plan docs with any changes: `docs/copilotkit/03-marketing-to-next.md` + `docs/website/02/plan-vite-to-next.md`

**Acceptance criteria:**
- All 10 marketing pages pass visual parity (document any deviations)
- Lighthouse scores: Performance ≥ 80, Accessibility ≥ 90, SEO ≥ 90
- All routes pass responsive testing at 3 breakpoints
- No CopilotKit/operator code renders on marketing pages
- Validation suite passes with zero errors
- Cutover documented: steps to switch DNS from Vite to Next.js
