# Marketing Site — Vite to Next.js Migration Plan

**IPI2-135 · PLT-015 · MKT**

Goal: Port the 10 marketing pages + login + 404 from Vite (`src/`) into the Next.js app (`app/`), matching the live design at `https://www.ipix.co/`. Keep the operator app (CopilotKit/Mastra/Command Center) untouched under its existing routes.

---

## 1. Current Vite Route Inventory

Source: `src/App.tsx` + `src/pages/`

| # | Route | Component | Lines | Sub-components | framer-motion | FAQ |
|---|---|---|---|---|---|---|
| 1 | `/` | `Index.tsx` | 27 | Header, HeroSection, ServicesSection, PortfolioSection, ProcessSection, ClientsSection, CTASection, Footer | CSS animations | No |
| 2 | `/services/fashion-photography` | `FashionPhotography.tsx` | 356 | Header, Footer, FashionPackages, Accordion | Yes (in FashionPackages) | Yes |
| 3 | `/services/ecommerce-photography` | `EcommercePhotography.tsx` | 358 | Header, Footer, EcommerceExtension, Accordion | Yes (in EcommerceExtension) | Yes |
| 4 | `/services/clothing` | `ClothingPhotography.tsx` | 364 | Header, Footer, ClothingSlider, Accordion | Yes (in ClothingSlider) | Yes |
| 5 | `/services/amazon` | `AmazonPhotography.tsx` | 354 | Header, Footer, Accordion | No | Yes |
| 6 | `/services/location` | `LocationPhotography.tsx` | 447 | Header, Footer, Accordion, framer-motion AnimatedSection | Yes | Yes |
| 7 | `/services/jewellery` | `JewelleryPhotography.tsx` | 432 | Header, Footer, Accordion, framer-motion AnimatedSection | Yes | Yes |
| 8 | `/services/instagram` | `InstagramCampaigns.tsx` | 312 | Header, Footer, framer-motion | Yes | No |
| 9 | `/services/video` | `VideoProduction.tsx` | 294 | Header, Footer, framer-motion | Yes | No |
| 10 | `/services/shopify` | `ShopifyPhotography.tsx` | 384 | Header, Footer, Accordion, framer-motion | Yes | Yes |
| 11 | `/login` | `Login.tsx` | 200 | shadcn Card/Tabs/Input, useAuth, supabase | No | — |
| 12 | `*` (404) | `NotFound.tsx` | 24 | None | No | — |

### Shared Vite Components (all in `src/components/`)

| Component | Lines | Used by | Notes |
|---|---|---|---|
| `Header.tsx` | 92 | All 10 marketing pages | Fixed nav, scroll-aware, mobile hamburger, 5 links (Services/Portfolio/Process/About/Contact), "Get a Quote" button. Links to `/#id` anchors. |
| `Footer.tsx` | 144 | All 10 marketing pages | Dark 5-column: Logo+Social / 9 service links / Platform / Channels / Contact. |
| `HeroSection.tsx` | 52 | Index only | Split layout: copy left, image right. CSS `animate-fade-up`. |
| `ServicesSection.tsx` | 52 | Index only | 8-card grid with lucide icons. |
| `PortfolioSection.tsx` | 54 | Index only | 6-image grid with span variants, hover overlay. |
| `ProcessSection.tsx` | 58 | Index only | 4-step process grid. |
| `ClientsSection.tsx` | 46 | Index only | 10 brand names. |
| `CTASection.tsx` | 51 | Index only | Contact form (Name/Email/Company/Message). No backend handler — static form. |
| `FashionPackages.tsx` | 257 | FashionPhotography | Pricing toggle (Ghost/Model/Creative), 3 tiers, add-ons, framer-motion. |
| `EcommerceExtension.tsx` | 392 | EcommercePhotography | 7 sub-sections: AI mockup, Amazon slider, image types, slider, workflow, metrics, CTA. Framer-motion + shadcn Slider. |
| `ClothingSlider.tsx` | 231 | ClothingPhotography | Dark full-width slider gallery, 5 slides, arrows, dots. Framer-motion. |

### Vite Image Assets (`src/assets/`)

**Shared (used across pages):**
- `hero-product.jpg` — Homepage hero
- `portfolio-fashion.jpg`, `portfolio-watch.jpg`, `portfolio-jewellery.jpg`, `portfolio-product.jpg`, `portfolio-ecommerce.jpg`, `portfolio-stilllife.jpg`

**Service-specific:**
- Fashion: `fashion-hero.jpg`, `fashion-studio.jpg`, `fashion-casestudy.jpg`
- eCommerce: `ecommerce-hero.jpg`, `ecommerce-studio.jpg`, `ecommerce-casestudy.jpg`
- Clothing: `clothing-hero.jpg`, `clothing-studio.jpg`, `clothing-casestudy.jpg`, `slider-clothing-1.jpg`, `slider-clothing-2.webp`, `slider-clothing-3.jpg`
- Amazon: `amazon-hero.jpg`, `amazon-studio.jpg`, `amazon-casestudy.jpg`
- Location: `location-hero.png`, `location-coastal.png`, `location-urban.png`, `location-streets.jpg`, `location-interior.jpg`, `location-nature.jpg`, `location-travel.jpg`
- Jewellery: `jewellery-hero.jpg`, `jewellery-macro.jpg`, `jewellery-lifestyle.jpg`, `jewellery-packaging.jpg`, `jewellery-ecommerce.jpg`
- Instagram: `instagram-hero.jpg`, `instagram-editorial.jpg`, `instagram-detail.jpg`, `instagram-motion.jpg`, `instagram-shop.jpg`
- Video: `video-hero.jpg`, `video-brand.jpg`, `video-product.jpg`, `video-social.jpg`, `video-motion.jpg`
- Shopify: `shopify-hero.jpg`, `shopify-studio.jpg`, `shopify-editorial.jpg`, `shopify-detail.jpg`, `shopify-mockup.jpg`

---

## 2. Next.js Route Map

All marketing pages live under a `(web)` route group to keep them isolated from the operator routes.

| # | Route | Next.js File Path | Status |
|---|---|---|---|
| 1 | `/` | `app/src/app/(marketing)/page.tsx` | **New** |
| 2 | `/services/fashion-photography` | `app/src/app/(marketing)/services/fashion-photography/page.tsx` | **New** |
| 3 | `/services/ecommerce-photography` | `app/src/app/(marketing)/services/ecommerce-photography/page.tsx` | **New** |
| 4 | `/services/clothing` | `app/src/app/(marketing)/services/clothing/page.tsx` | **New** |
| 5 | `/services/amazon` | `app/src/app/(marketing)/services/amazon/page.tsx` | **New** |
| 6 | `/services/location` | `app/src/app/(marketing)/services/location/page.tsx` | **New** |
| 7 | `/services/jewellery` | `app/src/app/(marketing)/services/jewellery/page.tsx` | **New** |
| 8 | `/services/instagram` | `app/src/app/(marketing)/services/instagram/page.tsx` | **New** |
| 9 | `/services/video` | `app/src/app/(marketing)/services/video/page.tsx` | **New** |
| 10 | `/services/shopify` | `app/src/app/(marketing)/services/shopify/page.tsx` | **New** |
| 11 | `/login` | `app/src/app/(marketing)/login/page.tsx` | **New** |
| 12 | `*` (404) | `app/src/app/not-found.tsx` | **New** |

### Root Layout Strategy

The existing root `layout.tsx` wraps ALL routes with `<CopilotKit>` + `<OperatorPanel>`. For marketing pages, this is wrong — they must NOT get the CopilotKit sidebar or threads drawer.

**Solution:** A `(web)` route group with its own layout:

```
app/src/app/
  layout.tsx                      ← existing: CopilotKit + OperatorPanel (operator routes)
  (marketing)/
    layout.tsx                    ← NEW: marketing layout (Header/Footer, no CopilotKit)
    page.tsx                      ← Home page
    services/fashion-photography/page.tsx
    services/ecommerce-photography/page.tsx
    services/clothing/page.tsx
    services/amazon/page.tsx
    services/location/page.tsx
    services/jewellery/page.tsx
    services/instagram/page.tsx
    services/video/page.tsx
    services/shopify/page.tsx
    login/page.tsx
  not-found.tsx                   ← shared 404
  brand/page.tsx                  ← existing operator (unchanged)
  shoots/page.tsx                 ← existing operator (unchanged)
  assets/page.tsx                 ← existing operator (unchanged)
  campaigns/page.tsx              ← existing operator (unchanged)
  matching/page.tsx               ← existing operator (unchanged)
```

The marketing layout is a simple server component that provides `<MarketingHeader>` and `<MarketingFooter>` around `{children}`, with NO `<CopilotKit>` provider. The existing root layout wraps only the operator routes.

---

## 3. Shared Marketing Layout Plan

### `(marketing)/layout.tsx` (Server Component)

```tsx
import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter } from "@/components/marketing/footer";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader />
      <main>{children}</main>
      <MarketingFooter />
    </div>
  );
}
```

### Why a route group instead of a separate app

- Shares the same Next.js instance, Tailwind config, and build pipeline
- Marketing pages can reference the same CSS variables
- No separate deployment or server
- Future: operator auth middleware can skip marketing routes

---

## 4. Shared Components Needed

All new components live in `app/src/components/marketing/` to avoid naming collisions with Vite imports.

### Layout (server components)
| Component | File | Description |
|---|---|---|
| `MarketingHeader` | `components/marketing/header.tsx` | Port of Vite `Header.tsx`. Replace `<a>` with `<Link>`, remove React Router deps. Scroll-aware via CSS or minimal `use client`. |
| `MarketingFooter` | `components/marketing/footer.tsx` | Port of Vite `Footer.tsx`. All hrefs mapped to Next.js routes. |

### Homepage sections (server components — no client JS)
| Component | File | Description |
|---|---|---|
| `HeroSection` | `components/marketing/hero-section.tsx` | Port of Vite component. Replace `<img>` with `next/image`. |
| `ServicesSection` | `components/marketing/services-section.tsx` | Port of Vite component. 8-card grid. |
| `PortfolioSection` | `components/marketing/portfolio-section.tsx` | Port of Vite component. 6-image grid. |
| `ProcessSection` | `components/marketing/process-section.tsx` | Port of Vite component. 4-step grid. |
| `ClientsSection` | `components/marketing/clients-section.tsx` | Port of Vite component. Text brand names. |
| `CTASection` | `components/marketing/cta-section.tsx` | Port of Vite component. Static contact form. |

### Service page sub-components (client components — interactive)
| Component | File | Description | Interactive |
|---|---|---|---|
| `FashionPackages` | `components/marketing/fashion-packages.tsx` | Pricing toggle + cards | Yes — useState, useInView |
| `ClothingSlider` | `components/marketing/clothing-slider.tsx` | Horizontal scroll slider | Yes — useState, scroll |
| `EcommerceExtension` | `components/marketing/ecommerce-extension.tsx` | 7-section addon panel | Yes — useState, slider |
| `FAQ` | `components/marketing/faq.tsx` | Reusable accordion FAQ | Yes — shadcn Accordion |
| `AnimatedSection` | `components/marketing/animated-section.tsx` | Scroll-triggered fade wrapper | Yes — IntersectionObserver |

### Animation approach

**Prefer CSS animations** (like Vite's `animate-fade-up`/`animate-fade-in`) for server components.

Use a lightweight `AnimatedSection` client component (IntersectionObserver, ~30 lines) only where scroll-triggered reveals are needed — not a full framer-motion dependency.

---

## 5. Design Tokens / Fonts / Colors

### Font strategy

The Next.js app currently loads **Geist Sans + Geist Mono** for the operator UI. The marketing pages need **Cormorant Garamond** (serif headings) + **Outfit** (sans body).

**Approach:** Load both font families via `next/font/google` in the marketing layout only. The operator root layout keeps Geist.

```tsx
// app/src/app/(marketing)/layout.tsx
import { Cormorant_Garamond, Outfit } from "next/font/google";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-serif",
});

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
});
```

### CSS variables strategy

Current `globals.css` has CopilotKit-aligned tokens. The marketing layout adds an overlay CSS file (`marketing.css`) with iPix brand tokens:

```css
/* app/src/app/(marketing)/marketing.css */
.marketing {
  --background: hsl(30 14% 96%);
  --foreground: hsl(0 0% 0%);
  --surface-warm: hsl(30 14% 96%);
  --surface-light: hsl(0 0% 96%);
  --surface-white: hsl(0 0% 100%);
  --text-primary: hsl(0 0% 0%);
  --text-deep: hsl(0 0% 5%);
  --text-dark: hsl(220 10% 16%);
  --text-muted-dark: hsl(218 8% 27%);
  --text-mid: hsl(224 5% 44%);
  --text-secondary: hsl(215 5% 49%);
  --text-caption: hsl(0 0% 55%);
  --divider: hsl(0 0% 84%);
  --border-light: hsl(0 0% 89%);
  --border-soft: hsl(0 0% 89%);
  --font-serif: "Cormorant Garamond", Georgia, serif;
  --font-sans: "Outfit", system-ui, sans-serif;
}
```

All marketing components are scoped under `.marketing` so these tokens never leak into the operator UI.

### Brand colors (DNA compliance badges)
| Token | Value | Usage |
|---|---|---|
| Primary orange | `#E87C4D` | Not currently in marketing — add as accent for future CTAs |
| Secondary blue | `#1E293B` | Not currently in marketing — keep for operator |
| Approved | `#059669` | Asset DNA badge |
| Review | `#D97706` | Asset DNA badge |
| Blocked | `#DC2626` | Asset DNA badge |

### Tailwind v4 tokens

Add to `globals.css` `@theme` block (not in marketing.css — Tailwind reads from `@theme`):

```css
@theme inline {
  --font-serif: var(--font-cormorant);
  --font-sans: var(--font-outfit);
}
```

Tailwind v4 uses `--font-*` vars. Components use `font-serif` / `font-sans` classes, which Vite already does.

---

## 6. SEO Metadata Plan

Each page exports a `metadata` object (Next.js `generateMetadata` or static export).

### Pattern

```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fashion Photography | iPix — AI-Planned Content Studio",
  description: "AI-planned fashion photography for luxury, streetwear, and eCommerce brands. Data-backed shot lists, platform-optimized deliverables.",
  openGraph: {
    title: "Fashion Photography | iPix",
    description: "AI-planned fashion photography built to perform.",
    images: [{ url: "/og/fashion-photography.jpg", width: 1200, height: 630 }],
  },
};
```

### Metadata per page

| Route | Title | Description |
|---|---|---|
| `/` | "iPix — AI-Powered Content Studio for Fashion Brands" | "AI-powered platform that plans photoshoots, generates shot lists, and creates on-brand content. Fewer revisions. Faster execution. Premium results." |
| `/services/fashion-photography` | "Fashion Photography | iPix" | "AI-planned fashion photography for luxury, streetwear, and eCommerce. Data-backed shot lists, platform-optimized deliverables." |
| `/services/ecommerce-photography` | "eCommerce Photography | iPix" | "AI-planned eCommerce photography that drives sales. Marketplace-ready assets for Amazon, Shopify, and beyond." |
| `/services/clothing` | "Clothing Photography | iPix" | "AI-planned clothing photography. Ghost mannequin, on-model, and creative shoots optimized for every platform." |
| `/services/amazon` | "Amazon Photography | iPix" | "Amazon photography and listing optimization. AI-planned product images that convert browsers into buyers." |
| `/services/location` | "Location Photography | iPix" | "On-location fashion photography. Urban, coastal, and lifestyle shoots planned with AI precision." |
| `/services/jewellery` | "Jewellery Photography | iPix" | "Precision jewellery photography. AI-planned macro, lifestyle, and ecommerce shots." |
| `/services/instagram` | "Instagram Campaigns | iPix" | "Scroll-stopping Instagram content. AI-planned campaigns optimized for Reels, Stories, and feed." |
| `/services/video` | "Video Production | iPix" | "Cinematic fashion video production. AI-planned brand films, product videos, and social content." |
| `/services/shopify` | "Shopify Photography | iPix" | "Shopify-optimized product photography. AI-planned imagery that converts on your store." |
| `/login` | "Sign In | Lumina Studio — iPix" | "Sign in to Lumina Studio for AI-powered brand intelligence and shoot management." |

### Open Graph images

The live site has no per-page OG images. Consider:
- `/public/og/home.jpg` — Default home OG
- `/public/og/fashion-photography.jpg` — Per-service OG images (initial batch from shared hero images)
- Fallback to `og/home.jpg` via `metadataBase` in root marketing layout

---

## 7. Asset / Image Migration Plan

### Approach

Assets stay in Vite `src/assets/` for now (Vite is not removed). The Next.js app copies or symlinks images to `app/public/images/`.

```
app/public/images/
  hero-product.jpg
  fashion-hero.jpg
  fashion-studio.jpg
  fashion-casestudy.jpg
  ecommerce-hero.jpg
  ecommerce-studio.jpg
  ecommerce-casestudy.jpg
  clothing-hero.jpg
  clothing-studio.jpg
  clothing-casestudy.jpg
  slider-clothing-1.jpg
  slider-clothing-2.webp
  slider-clothing-3.jpg
  amazon-hero.jpg
  amazon-studio.jpg
  amazon-casestudy.jpg
  location-hero.png
  location-coastal.png
  location-urban.png
  location-streets.jpg
  location-interior.jpg
  location-nature.jpg
  location-travel.jpg
  jewellery-hero.jpg
  jewellery-macro.jpg
  jewellery-lifestyle.jpg
  jewellery-packaging.jpg
  jewellery-ecommerce.jpg
  instagram-hero.jpg
  instagram-editorial.jpg
  instagram-detail.jpg
  instagram-motion.jpg
  instagram-shop.jpg
  video-hero.jpg
  video-brand.jpg
  video-product.jpg
  video-social.jpg
  video-motion.jpg
  shopify-hero.jpg
  shopify-studio.jpg
  shopify-editorial.jpg
  shopify-detail.jpg
  shopify-mockup.jpg
  portfolio/
    fashion.jpg
    watch.jpg
    jewellery.jpg
    product.jpg
    ecommerce.jpg
    stilllife.jpg
```

**Total: 48 image files.** ~15MB combined (mostly JPGs).

### Usage in components

Replace Vite `import img from "@/assets/..."` with Next.js `<Image>`:

```tsx
// Vite: import hero from "@/assets/fashion-hero.jpg"; <img src={hero} />
// Next.js: <Image src="/images/fashion-hero.jpg" alt="..." width={1200} height={800} />
```

For decorative/background images, `next/image` with `fill` or plain `<img>` with `loading="lazy"`.

### Optimization

- Use `next/image` with explicit `width`/`height` for above-fold images
- Use `<img>` with Tailwind classes for gallery/portfolio grids (many images, above the fold)
- Consider a Cloudinary/CDN migration later (see `cloudinary` skill)

---

## 8. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| **CopilotKit/operator UX conflict** | Marketing layout must NOT get the CopilotSidebar. If route group layout is wrong, marketing pages render with the operator sidebar. | Test `(web)` isolation before building any content. The route group bypasses the root layout naturally — verify with a simple `<h1>test</h1>` first. |
| **Tailwind v3 → v4 syntax differences** | Vite uses Tailwind v3 (`tailwind.config.ts` with `@tailwind base`). Next.js uses Tailwind v4 (`@import "tailwindcss"` with `@theme` inline). CSS custom properties port directly, but some v3 utilities may not exist in v4. | Test each component after porting. Tailwind v4 is mostly backward-compatible for utility classes. |
| **Font conflict with operator UI** | Geist (operator) vs Cormorant/Outfit (marketing) must not overlap. | Scope fonts to `.marketing` class. Operator root layout keeps Geist. |
| **framer-motion dependency** | Vite uses framer-motion for 5 service pages + 3 sub-components. Next.js app does not have it. | Replace with lightweight IntersectionObserver-based `AnimatedSection` client component. Avoid adding framer-motion. |
| **Form submission / contact form** | Vite `CTASection` has a static form with no backend handler. Port as-is but ensure no broken Supabase dependency. | Keep form static (no `action`). Add `NEXT_PUBLIC_` env gate if connecting later. |
| **Login page Supabase dependency** | Vite `Login.tsx` imports `useAuth` context and `supabase` client. Next.js auth model is not designed yet. | Port the UI only (card layout, tabs, form fields). Stub the auth functions. Do not import Vite auth context. Add a `TODO` comment. |
| **SEO parity** | Live Vite site has minimal meta tags. Need to improve for Next.js. | Add `metadata` exports per page. Use `generateMetadata` for dynamic content. |
| **Image path breakage** | Vite `import` resolves images at build time. Next.js needs static files in `public/`. | Copy all assets first. Verify every image loads on every page. |

---

## 9. Acceptance Criteria

1. `(web)` route group confirmed isolated — no CopilotKit/OperatorPanel on marketing pages
2. Existing operator routes (brand, shoots, assets, campaigns, matching) unchanged
3. All 12 routes render correctly in Next.js dev server (`:3002`)
2. Visual appearance matches Vite dev server (`:8080`) pixel comparison on:
   - Hero sections (headings, images, CTA buttons)
   - Color, typography, spacing
   - Responsive layout (mobile, tablet, desktop)
   - Hover states and transitions
3. CopilotKit/OperatorPanel does NOT render on marketing pages
4. `npm run test` passes
7. `npm run lint` passes
8. `npm run build` succeeds (no type errors)
9. `npx tsc --noEmit` passes
10. All `<a>` replaced with `<Link>` for internal navigation
11. All `<img>` replaced with `next/image` (or `<img>` with justification)
12. All `VITE_*` env vars replaced with `NEXT_PUBLIC_*`
13. No Vite imports or React Router APIs in `app/src/`
14. No new Supabase, operator, or auth dependencies imported by marketing pages
15. Vite dev server still works unchanged

---

## 10. Recommended PR Order

| Order | PR | Scope | Files |
|---|---|---|---|
| 1 | **WEB-001** | Marketing Foundation: route group, layout, design system, shared components (Header, Footer) | ~8 files |
| 2 | **WEB-002** | Home page: port Index + all 6 section components | ~7 files |
| 3 | **WEB-003** | Fashion Photography page | ~2 files |
| 4 | **WEB-004** | eCommerce Photography page | ~2 files |
| 5 | **WEB-005** | Clothing Photography page | ~2 files |
| 6 | **WEB-006** | Amazon Photography page | ~1 file |
| 7 | **WEB-007** | Location Photography page | ~1 file |
| 8 | **WEB-008** | Jewellery Photography page | ~1 file |
| 9 | **WEB-009** | Instagram Campaigns page | ~1 file |
| 10 | **WEB-010** | Video Production page | ~1 file |
| 11 | **WEB-011** | Shopify Photography page | ~1 file |
| 12 | **WEB-012** | Login page | ~1 file |
| 13 | **WEB-013** | Not Found page | ~1 file |
| 14 | **WEB-014** | SEO, Responsive, Visual Parity, and Cutover Checklist | ~0 files |

PR 1 must merge before PRs 2–13. PRs 2–13 can be done in parallel (they only depend on shared components from PR 1). PR 14 is the final verification gate.

---

## 11. Effort Estimate

| Phase | Files | Est. time |
|---|---|---|
| Foundation (layout, design tokens, Header, Footer, shared components) | 8 | 1.5 days |
| Home page (Index + 6 sections) | 7 | 0.5 days |
| 9 service pages (3 with sub-components, 6 without) | ~12 | 3 days |
| Login + 404 | 2 | 0.5 days |
| SEO metadata pass | 12 | 0.5 days |
| Visual parity QA, responsive testing, validation | — | 1 day |
| **Total** | **~30 new files** | **~7 days** |

---

## 12. Long-term: Vite Retirement Path

This migration does NOT remove Vite. The Vite app stays live at `www.ipix.co` until:

1. Marketing pages in Next.js pass visual parity
2. DNS is switched from Vite deployment to Next.js deployment
3. Auth/deployment plan is finalized
4. All Vite dashboard routes are confirmed dead or ported

After cutover:
- Remove `src/pages/` (marketing pages)
- Remove `src/components/` (marketing components — Header, Footer, section components, service-page sub-components)
- Clean up Vite config / dependencies
- Keep `src/` for any remaining legacy operator code until migration is complete
