# Website Pages Inventory — Vite → Next.js migration

**Source verified from `src/App.tsx` + `src/pages/` (2026-06-22), not from docs.**
**Count correction:** it's **10 marketing pages** (home + 9 service pages), not 5 — plus 2 utility routes (Login, 404). The `/dashboard/*` routes are the **legacy operator app**, being replaced by the Next `app/` (do *not* migrate as marketing).

---

## Marketing pages (10) — migrate to Next

| # | Page | Route | Vite component (`src/pages/`) | Type | Next target (`app/`) |
|---|------|-------|-------------------------------|------|----------------------|
| 1 | Home / Landing | `/` | `Index.tsx` | Marketing | `(marketing)/page.tsx` |
| 2 | Fashion Photography | `/services/fashion-photography` | `FashionPhotography.tsx` | Service | `(marketing)/services/fashion-photography/page.tsx` |
| 3 | E-commerce Photography | `/services/ecommerce-photography` | `EcommercePhotography.tsx` | Service | `(marketing)/services/ecommerce-photography/page.tsx` |
| 4 | Clothing Photography | `/services/clothing` | `ClothingPhotography.tsx` | Service | `(marketing)/services/clothing/page.tsx` |
| 5 | Amazon Photography | `/services/amazon` | `AmazonPhotography.tsx` | Service | `(marketing)/services/amazon/page.tsx` |
| 6 | Location Photography | `/services/location` | `LocationPhotography.tsx` | Service | `(marketing)/services/location/page.tsx` |
| 7 | Jewellery Photography | `/services/jewellery` | `JewelleryPhotography.tsx` | Service | `(marketing)/services/jewellery/page.tsx` |
| 8 | Instagram Campaigns | `/services/instagram` | `InstagramCampaigns.tsx` | Service | `(marketing)/services/instagram/page.tsx` |
| 9 | Video Production | `/services/video` | `VideoProduction.tsx` | Service | `(marketing)/services/video/page.tsx` |
| 10 | Shopify Photography | `/services/shopify` | `ShopifyPhotography.tsx` | Service | `(marketing)/services/shopify/page.tsx` |

## Utility routes (2)

| # | Page | Route | Vite component | Type | Next target |
|---|------|-------|----------------|------|-------------|
| 11 | Login | `/login` | `Login.tsx` | Auth | `login/page.tsx` (or `(auth)/login`) |
| 12 | Not Found | `*` | `NotFound.tsx` | Utility | `not-found.tsx` (App Router convention) |

## Out of scope — legacy operator app (NOT marketing; replaced by Next `app/`)

| Route | Vite component | Status |
|-------|----------------|--------|
| `/dashboard` | `CommandCenterPage` | → replaced by Next `app/` Command Center (shipped) |
| `/dashboard/brand` | `BrandHubPage` | → Next operator (IPI2-83 etc.) |
| `/dashboard/brand/intake` | `BrandIntakePage` | → IPI2-83 |
| `/dashboard/assets` | `AssetsPage` | → Next operator |
| `/dashboard/products` | `ProductsPage` | → Next operator |
| `/dashboard/analytics` | `AnalyticsPage` | → Next operator |
| `/dashboard/settings` | `SettingsPage` | → Next operator |

---

## Notes for migration (per page)
- All 10 marketing pages share the same template (Header → Hero → Feature grid → FAQ → Portfolio → CTA → Footer) — port the shared layout once, then each page is mostly content.
- Swap on port: `react-router <Link>` → `next/link`; `react-helmet`/meta → Next `metadata`; `<img>` → `next/image`.
- Bring the iPix design system into Next first (Cormorant Garamond + Outfit fonts, brand color tokens, shadcn components) — the Next `app/` currently uses Geist + the CopilotKit theme.
- Cutover `www.ipix.co` only after visual + SEO parity + redirects (don't break the live marketing site).
