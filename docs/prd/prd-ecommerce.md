---
id: PRD-ECOMMERCE-001
title: "iPix Commerce — Product Requirements Document"
version: "1.0"
status: Draft — curated from mdeai, re-framed for iPix
priority: P1 (commerce vertical)
date: "2026-06-21"
owner: Product + Engineering (iPix Commerce)
source_of_truth:
  - my-marketplace/CLAUDE.md            # Mercur (Medusa v2) foundation
  - docs/ipix-commerce-prd.md           # Mercur ownership boundary (existing)
  - docs/ecommerce/tasks/INDEX.md       # ECOM-C / ECOM-M task index (curated from mdeai)
  - docs/ecommerce/tasks/roadmap.md     # implementation roadmap
  - docs/ecommerce/adr/001-standalone-mercur.md
verified_against:
  - CLAUDE.md (Commerce on Mercur :5433, not Supabase; commerce_product_links in Supabase)
  - supabase/migrations/20260614000000_ipix_platform_mvp.sql (commerce_product_links table)
provenance: "Curated from the mdeai commerce workstream; EventOS verticals dropped. See README.md."
task_id_convention: "IPI-XXX · TASK-ID — Full Task Name (never bare IDs)"
---

# iPix Commerce — PRD

## 0. North star & boundary

> **North star:** *AI search → ProductCard → cart → Stripe checkout → Mercur order* — fashion
> brands turn DNA-scored shoot assets into a shoppable, AI-assisted catalog.

**Architecture boundary (non-negotiable, from `CLAUDE.md` + `adr/001-standalone-mercur.md`):**
- **Mercur (Medusa v2)** in [`my-marketplace/`](../../my-marketplace/) is the **only** source of
  truth for products, variants, inventory, carts, orders, sellers, commissions, and payouts.
- **Supabase** holds **only** the links + intelligence: `commerce_product_links`
  (`brand_id` · `medusa_product_id` · `asset_id` · `shoot_id`), pgvector embeddings, AI logs.
  **No mutable product/cart/order truth in Supabase.**
- **Stripe** (+ Connect for multi-vendor) is the shared till.
- The **iPix app owns the single buyer/operator UI** (CopilotKit) — no second storefront.

This PRD covers the iPix-native commerce product. Task specs live in
[`tasks/INDEX.md`](./tasks/INDEX.md) (`ECOM-C-*` core, `ECOM-M-*` marketplace).

---

## 1. Problem & opportunity

Fashion brands shoot beautiful assets, then lose the thread between *content* and *commerce*:
the product that was photographed lives in Shopify/Amazon/Mercur, disconnected from the asset,
the brand DNA, and the channel plan. Buyers, meanwhile, want to *ask* ("show me the linen sets
under $120") not browse SKUs.

**Opportunity:** make commerce an **AI-native, asset-linked vertical** inside iPix — every
DNA-passed asset can become a linked, searchable, shoppable product, surfaced by an AI concierge
and sold through a Mercur marketplace. This closes the loop:
`Asset → DNA → Product Link → AI Search → Checkout → Performance`.

---

## 2. Goals & non-goals

### Goals
- Stand up Mercur as a standalone commerce backend; prove a **single-vendor paid order** end-to-end.
- Link iPix **assets/shoots → Mercur products** (`commerce_product_links`).
- Expose commerce to the AI layer via **Mastra tools** + **CopilotKit ProductCards**.
- Grow into a **multi-vendor marketplace** (vendor onboarding, Stripe Connect, payouts).

### Non-goals
- A second buyer storefront (the iPix app owns the UI).
- Mutable catalog/cart/order state in Supabase (Mercur owns it).
- EventOS verticals (event/trip/venue/WhatsApp links) — left in mdeai, not iPix scope.
- Reinventing payouts/commissions — use Mercur + Stripe Connect.

---

## 3. Features (CORE vs ADVANCED)

| Feature | Tier | Backed by task |
|---|---|---|
| Standalone Mercur backend (Medusa v2) | **CORE** | `ECOM-C-001 — Commerce ADR` · `ECOM-C-002 — Mercur backend spike` |
| Env/secrets + Store API field-mask | **CORE** | `ECOM-C-003 — Env & secrets` · `commerce-store-api-fields.md` |
| Demo seller + product catalog seed | **CORE** | `ECOM-C-005 — Demo seller` · `ECOM-C-006 — Product catalog seed` |
| Stripe test checkout → **paid order proof** | **CORE** | `ECOM-C-004 — Stripe test checkout` · `ECOM-C-016 — Paid order proof` |
| Medusa JS SDK wrapper + API proxy | **CORE** | `ECOM-C-007 — Medusa client wrapper` · `ECOM-C-008 — Commerce API proxy` |
| Asset/shoot → product links (Supabase) + embedding sync | **CORE** | `ECOM-C-009 — Product embedding sync` |
| AI product search / detail (Mastra tools) | **CORE** | `ECOM-C-010 — Mastra product_search` · `ECOM-C-011 — product_detail` |
| Cart tools + checkout link (Mastra) | **CORE** | `ECOM-C-012 — Mastra cart tools` · `ECOM-C-013 — checkout_link` |
| CopilotKit **ProductCard** + cart state UI | **CORE** | `ECOM-C-014 — CopilotKit ProductCard` · `ECOM-C-015 — Cart state UI` |
| AI E2E checkout proof + production readiness | **CORE** | `ECOM-C-019 — AI checkout proof` · `ECOM-C-020 — Production readiness` |
| Ops & refund playbook | **CORE** | `ECOM-C-017 — Manual ops & refund playbook` |
| Vendor application + admin invite + dashboard | ADVANCED | `ECOM-M-002/003/004` |
| Stripe Connect + multi-vendor order split + payouts | ADVANCED | `ECOM-M-005/006/007` |
| Basic commerce analytics · featured listings | ADVANCED | `ECOM-M-012/013` |
| Seller reviews (field-mask policy) | ADVANCED | `ECOM-C-022 — Seller reviews field-mask` |

**Hard gates** (from `INDEX.md`): no Stripe Connect before a single-vendor **paid order**
(`ECOM-C-016`); no AI/embeddings before the **core commerce exit gate** (`ECOM-C-018`).

---

## 4. Use cases & real-world examples

1. **Asset → shoppable product.** *Maison Elara* finishes a linen capsule shoot. Each DNA-passed
   hero asset is linked to its Mercur product (`commerce_product_links`), so the image *is* the
   buy button. → `ECOM-C-009`.
2. **AI concierge shopping.** A buyer types "show me the linen sets under $120." Mastra
   `product_search` queries Mercur (price/stock live), CopilotKit renders **ProductCards**, the
   buyer adds to cart and checks out via a Stripe link — all in chat. → `ECOM-C-010/012/013/014`.
3. **Single-vendor sale (the proof).** A brand sells direct: seed catalog → Stripe test checkout →
   **paid order** recorded in Mercur. This is the exit gate before any marketplace work. →
   `ECOM-C-016/018`.
4. **Multi-vendor marketplace.** A second designer applies as a vendor, gets an admin invite, a
   dashboard, and Stripe Connect payouts; a buyer's cart spanning two sellers splits into per-seller
   orders. → `ECOM-M-002/003/004/005/006`.
5. **Performance loop.** Basic commerce analytics tie product → channel → revenue, feeding the
   campaign/learning loop. → `ECOM-M-012`.

---

## 5. User journeys

### 5.1 Operator — link assets to products
```
Shoot assets (DNA-passed)  →  Operator opens product-link panel
  → pick Mercur product (or create)  →  commerce_product_links row written (Supabase)
  → embedding synced for AI search   →  asset now shoppable
```
HITL: operator confirms each link; Mercur stays source of truth, Supabase stores only the link.

### 5.2 Buyer — AI-assisted purchase
```
Chat: "linen sets under $120"
  → Mastra product_search → Mercur Store API (live price/stock)
  → CopilotKit ProductCards → add to cart (Mastra cart tools)
  → checkout_link → Stripe Checkout → Mercur order
  → confirmation in chat
```
No catalog truth cached in Supabase; cards hydrate price/stock from Mercur at render time.

### 5.3 Seller — vendor onboarding (marketplace)
```
Vendor application → admin invite → vendor dashboard (my-marketplace/apps/vendor)
  → Stripe Connect Express onboarding → list products
  → buyer orders → multi-vendor split → payout visibility
```

---

## 6. AI architecture (consistent with iPix stack)

| Layer | Role |
|---|---|
| **Gemini** | Interprets buyer intent, ranks/explains products, drafts merchandising copy |
| **Mastra** | Commerce tools: `product_search`, `product_detail`, cart, `checkout_link` (call Mercur via the API proxy/SDK — never duplicate state in Supabase) |
| **CopilotKit v2** | ProductCards, cart UI, HITL on operator writes (links) |
| **Supabase + pgvector** | Product links + embeddings for search; AI logs (system of record for *links*, not catalog) |
| **Mercur (Medusa v2)** | Catalog/cart/order/seller/payout truth |
| **Stripe (+ Connect)** | Payments + marketplace payouts |

**Rule:** Gemini/Mastra *reason and orchestrate*; Mercur *owns commerce truth*; Supabase *links
and remembers*. Same separation as the rest of iPix.

---

## 7. Roadmap

Phases mirror [`tasks/INDEX.md`](./tasks/INDEX.md) (curated from mdeai). Re-map `SAN-*` Linear IDs
to the iPix **COM-*** track when scheduling.

| Phase | Scope | Key tasks | Gate |
|---|---|---|---|
| **1 — Commerce standalone proof** | Mercur up, seed, Stripe checkout, **paid order** | `ECOM-C-001…006`, `C-016` | `ECOM-C-018 — Core commerce exit gate` |
| **2 — App bridge** | SDK wrapper, API proxy, B2C reference UX, field-mask | `ECOM-C-007/008/021/022` | proxy ships before chat ProductCards |
| **3 — AI commerce** | Embedding sync + Mastra tools + ProductCard + cart UI + E2E | `ECOM-C-009…015`, `C-019` | `ECOM-C-020 — Production readiness` |
| **4 — Marketplace MVP** | Vendor onboarding, Connect, split, payouts, analytics | `ECOM-M-001…007`, `M-012/013` | multi-vendor paid order |
| **5 — (deferred)** | iPix-native asset/shoot → product link automation, channel-aware merchandising | new `COM-*` tasks | — |

Note: the mdeai **Phase 5 EventOS** scope (WhatsApp/event/trip/venue links) is **not** part of iPix.

---

## 8. Dependencies, risks, open questions

**Dependencies:** Mercur backend (`ipi/com-010b-mercur-backend`), Supabase `commerce_product_links`
(shipped in MVP schema), Stripe account, Cloudinary (asset media), DNA pipeline (gates which
assets are linkable).

**Risks:**
- R-1: Dual-DB ops (Mercur Postgres :5433 + Supabase) — keep the boundary strict; links only.
- R-2: Stripe Connect compliance/webhooks — defer until single-vendor paid order proven.
- R-3: Price/stock staleness — always hydrate from Mercur at render; never cache catalog in Supabase.
- R-4: Migrated task specs carry mdeai (`SAN-*`) Linear IDs and `mdeapp` phrasing — re-map to iPix.

**Open questions:**
- Q-1: iPix Linear mapping — create a `COM-*` epic mirroring `ECOM-C/M`?
- Q-2: Is the marketplace (multi-vendor) in MVP scope, or single-vendor brand commerce first?
- Q-3: How do asset→product links interact with the shoot system (`shoot-prd.md`) deliverables?

## 9. Definition of Done (PRD acceptance)
- [ ] Mercur is the sole catalog/cart/order/seller source of truth; Supabase holds only links + intel.
- [ ] Single-vendor **paid order** proven before any marketplace/Connect work.
- [ ] AI commerce surfaced via Mastra tools + CopilotKit ProductCards; no catalog cached in Supabase.
- [ ] `SAN-*` Linear IDs re-mapped to iPix `COM-*` before scheduling.
- [ ] Consistent with `docs/ipix-commerce-prd.md`, `my-marketplace/CLAUDE.md`, and `adr/001-standalone-mercur.md`.
- [ ] No production code, migrations, or schema changed by this PRD pass.
