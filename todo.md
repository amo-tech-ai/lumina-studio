# iPix — Master TODO

**Updated:** 2026-06-14 (verified)  
**Core MVP (frozen):** [mvp.md](./mvp.md) · **PRD:** [docs/ipix-commerce-prd.md](./docs/ipix-commerce-prd.md) · **Plan:** [docs/ipix-commerce-implementation-plan.md](./docs/ipix-commerce-implementation-plan.md)  
**Commerce detail:** [docs/ecommerce/tasks/INDEX.md](./docs/ecommerce/tasks/INDEX.md) · **Setup:** [docs/ecommerce/plan/01-setup.md](./docs/ecommerce/plan/01-setup.md)  
**Linear:** [All issues](https://linear.app/ipix/view/all-issues-a48540fcf640) · [IPI board](https://linear.app/ipix/team/IPI/active) · [IPIX-COMMERCE](https://linear.app/ipix/project/ipix-commerce-22fad1e0f37c)

**Legend:** 🟢 complete · 🟡 in progress · 🔴 failed / blocked · ⚪ not started

---

## Progress Task Tracker

*Examined repo + ran verification 2026-06-14. Proof = command output, file path, or Linear ID.*

### Executive summary

| Track | Done | In progress | Not started | Track % |
|-------|-----:|------------:|------------:|--------:|
| MVP 8 proofs | 6 | 1 | 1 | **75%** |
| IPIX-COM bootstrap | 8 | 1 | 1 | **80%** |
| Platform (PLT/SEC) | 2 | 3 | 2 | **45%** |
| Commerce phases (ECOM) | 12 | 1 | 18 | **38%** |
| AI / DNA / UI | 1 | 0 | 3 | **25%** |
| **Overall execution** | — | — | — | **~48%** |

---

### MVP 8 proofs — canonical order ([mvp.md](./mvp.md) §1)

| # | Proof | Dot | % | Linear | Proof / validation | Attention |
|---|--------|:---:|:---:|--------|-------------------|-----------|
| 1 | Mercur backend running | 🟢 | 100 | [IPI-5](https://linear.app/ipix/issue/IPI-5) | `my-marketplace/` · health `:9000` · IPIX-COM-001 | — |
| 2 | One approved vendor | 🟢 | 100 | [IPI-7](https://linear.app/ipix/issue/IPI-7) | Seller `ipix` · `sel_01KV23CX3TX7V8ZD6RXXXNC3ZV` · status `open` | — |
| 3 | 10 fashion SKUs | 🟢 | 100 | [IPI-8](https://linear.app/ipix/issue/IPI-8) | `yarn seed:ipix-catalog` · Store API ≥14 SKUs | — |
| 4 | B2C storefront checkout UX | 🟢 | 90 | [IPI-9](https://linear.app/ipix/issue/IPI-9) | PDP/cart/checkout browser + [evidence](./docs/ecommerce/evidence/2026-06-14/ipix-b2c-checkout-e2e.md) | Stripe UI re-check after region link fix |
| 5 | Stripe test paid order | 🟢 | 100 | [IPI-10](https://linear.app/ipix/issue/IPI-10) | `og_01KV2JDXQ8VVWFK5VXTBYY1BQG` · PI succeeded · [smoke](./scripts/commerce/paid-order-smoke.mjs) | — |
| 6 | Brand profile (URL → Supabase) | 🟢 | 100 | [IPI-18](https://linear.app/ipix/issue/IPI-18) | `brand-intelligence` · `npm run supabase:verify-brand-intelligence` ✅ | Wire dashboard Brand Setup UI |
| 7 | DNA-scored asset | ⚪ | 0 | [IPI-19](https://linear.app/ipix/issue/IPI-19) | No `audit-asset-dna` function | After AI-001 |
| 8 | `commerce_product_links` row | ⚪ | 0 | — | Table in migration; no UI/link flow | After proofs 6–7 |

---

### IPIX-COM bootstrap — execution order

| Order | ID | Task | Dot | % | Linear | Proof | Attention |
|------:|-----|------|:---:|:---:|--------|-------|-----------|
| 1 | IPIX-COM-001 | Mercur backend boot | 🟢 | 100 | [IPI-5](https://linear.app/ipix/issue/IPI-5) | Postgres `:5433`, Redis, migrate, `yarn dev` | — |
| 2 | IPIX-COM-002 | Admin account | 🟢 | 100 | [IPI-6](https://linear.app/ipix/issue/IPI-6) | Login `/app` | — |
| 3 | IPIX-COM-003 | Register + approve seller | 🟢 | 100 | [IPI-7](https://linear.app/ipix/issue/IPI-7) | Seller approved | — |
| 4 | IPIX-COM-004 | Wire Redis in medusa-config | 🟢 | 100 | [IPI-11](https://linear.app/ipix/issue/IPI-11) | `medusa-config.ts` `redisUrl` | — |
| 5 | IPIX-COM-008 | Fashion catalog seeds | 🟢 | 100 | [IPI-8](https://linear.app/ipix/issue/IPI-8) | 10 fashion + legacy SKUs | — |
| 6 | IPIX-COM-005 | Stripe webhook + paid order | 🟢 | 100 | [IPI-10](https://linear.app/ipix/issue/IPI-10) | Captured payment proof | — |
| 7 | IPIX-COM-006 | B2C storefront clone | 🟢 | 100 | [IPI-9](https://linear.app/ipix/issue/IPI-9) | `b2c-storefront/` | Use `npm run storefront:dev` |
| 8 | IPIX-COM-009 | ADR commerce ownership | 🟢 | 100 | [IPI-13](https://linear.app/ipix/issue/IPI-13) | [ADR-002](./docs/ecommerce/adr/002-ipix-commerce-ownership.md) **Accepted** | IPI-13 → Done in Linear |
| 9 | IPIX-COM-010 | Commit marketplace + docs | 🟢 | 100 | [IPI-12](https://linear.app/ipix/issue/IPI-12) | Monorepo commit `my-marketplace/` `b2c-storefront/` `docs/ecommerce/` | — |
| — | IPIX-COM-007 | Algolia + TalkJS | ⚪ | 0 | — | Optional | Skip until browse demo |

---

### Platform — PLT / SEC (after commerce bootstrap, before AI)

| Order | ID | Task | Dot | % | Linear | Proof | Attention |
|------:|-----|------|:---:|:---:|--------|-------|-----------|
| 1 | PLT-001 | Supabase MVP migration | 🟢 | 100 | [IPI-14](https://linear.app/ipix/issue/IPI-14) | `20260614000000` + `npm run supabase:verify` ✅ | — |
| 2 | PLT-002 | Auth + RLS | 🟡 | 85 | [IPI-15](https://linear.app/ipix/issue/IPI-15) | `npm run supabase:verify-rls` ✅ · `/login` `/dashboard` · `AuthContext` | Brand setup UI incomplete; close Linear when signed off |
| 3 | SEC-002 | Secrets / Infisical | 🟢 | 95 | [IPI-53](https://linear.app/ipix/issue/IPI-53) | Paths `/`, `/mercur`, `/mercur/api`, `/storefront` · [folder-structure](./docs/infisical/folder-structure.md) | Add `staging`/`prod` envs |
| 4 | PLT-003 | Edge scaffold + Gemini | 🟢 | 100 | [IPI-16](https://linear.app/ipix/issue/IPI-16) | `health` + `edge-test` + `brand-intelligence` · verify ✅ | — |
| 5 | PLT-004 | Vite env validation | ⚪ | 0 | [IPI-17](https://linear.app/ipix/issue/IPI-17) | No `validateEnv` module | Parallel, low risk |
| 6 | PLT-011 | Cloudinary media (MVP) | ⚪ | 10 | [IPI-30](https://linear.app/ipix/issue/IPI-30) | Docs + [CLD-001–012](./docs/cloudinary/cloudinary-linear-tasks.md) | No `cloudinary-sign` yet |

**Verification commands (Infisical):**

```bash
infisical run -- npm run build              # ✅ 2026-06-14
infisical run -- npm run supabase:verify    # ✅ tasks/profiles/assets/shoots
infisical run -- npm run supabase:verify-rls
infisical run -- npm run supabase:verify-edge
infisical run -- npm run supabase:verify-brand-intelligence  # ✅ 2026-06-14
```

---

### Commerce phases — ECOM-C / ECOM-M ([INDEX](./docs/ecommerce/tasks/INDEX.md) order)

#### Phase 0

| ID | Task | Dot | % | Proof |
|----|------|:---:|:---:|-------|
| ECOM-C-000 | Verification floor | 🟡 | 40 | mdeapp evidence; ipix partial |

#### Phase 1 — standalone proof

| Order | ID | Task | Dot | % | Proof |
|------:|-----|------|:---:|:---:|-------|
| 1 | ECOM-C-001 | Commerce ADR | 🟢 | 100 | ADR-001 + ipix ADR-002 |
| 2 | ECOM-C-002 | Mercur backend spike | 🟢 | 100 | `my-marketplace/` |
| 3 | ECOM-C-003 | Env & secrets | 🟢 | 90 | Infisical `/mercur*` + local `.env` |
| 4 | ECOM-C-005 | Demo seller | 🟢 | 100 | IPIX-COM-003 |
| 5 | ECOM-C-006 | Catalog seed | 🟢 | 100 | IPIX-COM-008 |
| 6 | ECOM-C-004 | Stripe test checkout | 🟢 | 100 | IPIX-COM-005 |
| 7 | ECOM-C-016 | Paid order proof | 🟢 | 100 | Order `#3` |
| 8 | ECOM-C-018 | Core commerce exit gate | 🟢 | 95 | [evidence](./docs/ecommerce/evidence/2026-06-14/ipix-b2c-checkout-e2e.md) + git commit COM-010 |

#### Phase 2 — buyer bridge

| Order | ID | Task | Dot | % | Proof |
|------:|-----|------|:---:|:---:|-------|
| 8b | ECOM-C-021 | B2C reference storefront | 🟢 | 85 | Clone + `:3000` (IPIX-COM-006) |
| 9 | ECOM-C-007 | Medusa JS SDK wrapper | ⚪ | 0 | Done in mdeapp; **not in ipix `src/`** |
| 9b | ECOM-C-022 | Seller reviews field-mask | ⚪ | 0 | mdeapp only |
| 10 | ECOM-C-008 | Commerce API proxy | ⚪ | 0 | **Next commerce code task** |

#### Phase 3 — AI commerce (blocked: MVP proofs 6–8 + C-008)

| ID | Task | Dot | % | Link |
|----|------|:---:|:---:|------|
| ECOM-C-009 | Supabase links + embedding sync | ⚪ | 0 | [task](./docs/ecommerce/tasks/ECOM-C-009-product-embedding-sync.md) |
| ECOM-C-010 | Mastra `product_search` | ⚪ | 0 | [task](./docs/ecommerce/tasks/ECOM-C-010-mastra-product-search.md) |
| ECOM-C-011 | Mastra `product_detail` | ⚪ | 0 | [task](./docs/ecommerce/tasks/ECOM-C-011-mastra-product-detail.md) |
| ECOM-C-012 | Mastra cart tools | ⚪ | 0 | [task](./docs/ecommerce/tasks/ECOM-C-012-mastra-cart-tools.md) |
| ECOM-C-013 | Mastra `checkout_link` | ⚪ | 0 | [task](./docs/ecommerce/tasks/ECOM-C-013-mastra-checkout-link.md) |
| ECOM-C-014 | CopilotKit ProductCard | ⚪ | 0 | [task](./docs/ecommerce/tasks/ECOM-C-014-copilotkit-product-card.md) |
| ECOM-C-015 | Cart state UI | ⚪ | 0 | [task](./docs/ecommerce/tasks/ECOM-C-015-cart-state-ui.md) |
| ECOM-C-019 | AI E2E checkout proof | ⚪ | 0 | [task](./docs/ecommerce/tasks/ECOM-C-019-ai-checkout-proof.md) |
| ECOM-C-017 | Ops & refund playbook | ⚪ | 0 | [task](./docs/ecommerce/tasks/ECOM-C-017-manual-ops-refund-playbook.md) |
| ECOM-C-020 | Production readiness | ⚪ | 0 | [task](./docs/ecommerce/tasks/ECOM-C-020-production-readiness.md) |

#### Phase 4 — Marketplace MVP

| ID | Task | Dot | % | Link |
|----|------|:---:|:---:|------|
| ECOM-M-001 | Mercur marketplace verify | ⚪ | 0 | [task](./docs/ecommerce/tasks/ECOM-M-001-mercur-marketplace-foundation.md) |
| ECOM-M-002 | Vendor application | ⚪ | 0 | [task](./docs/ecommerce/tasks/ECOM-M-002-vendor-application.md) |
| ECOM-M-003 | Vendor admin invite | ⚪ | 0 | [task](./docs/ecommerce/tasks/ECOM-M-003-vendor-admin-invite.md) |
| ECOM-M-004 | Vendor dashboard v1 | ⚪ | 0 | [task](./docs/ecommerce/tasks/ECOM-M-004-vendor-dashboard-v1.md) |
| ECOM-M-005 | Stripe Connect Express | ⚪ | 0 | [task](./docs/ecommerce/tasks/ECOM-M-005-stripe-connect-express.md) |
| ECOM-M-006 | Multi-vendor order split | ⚪ | 0 | [task](./docs/ecommerce/tasks/ECOM-M-006-multi-vendor-order-split.md) |
| ECOM-M-007 | Vendor payout visibility | ⚪ | 0 | [task](./docs/ecommerce/tasks/ECOM-M-007-vendor-payout-visibility.md) |

#### Phase 5 — Lifestyle extensions

| ID | Task | Dot | % | Link |
|----|------|:---:|:---:|------|
| ECOM-M-008 | WhatsApp payment link | ⚪ | 0 | [task](./docs/ecommerce/tasks/ECOM-M-008-whatsapp-payment-link.md) |
| ECOM-M-009 | Event product links | ⚪ | 0 | [task](./docs/ecommerce/tasks/ECOM-M-009-event-product-links.md) |
| ECOM-M-010 | Trip product links | ⚪ | 0 | [task](./docs/ecommerce/tasks/ECOM-M-010-trip-product-links.md) |
| ECOM-M-011 | Venue product links | ⚪ | 0 | [task](./docs/ecommerce/tasks/ECOM-M-011-venue-product-links.md) |
| ECOM-M-012 | Basic commerce analytics | ⚪ | 0 | [task](./docs/ecommerce/tasks/ECOM-M-012-basic-commerce-analytics.md) |
| ECOM-M-013 | Featured listings pilot | ⚪ | 0 | [task](./docs/ecommerce/tasks/ECOM-M-013-featured-listings-pilot.md) |

---

### iPix product — AI / UI / wireframes

| Order | Area | Task | Dot | % | Linear | Proof | Attention |
|------:|------|------|:---:|:---:|--------|-------|-----------|
| 1 | Marketing | Vite service pages | 🟢 | 100 | — | `src/pages/*` · `npm run build` ✅ | — |
| 2 | UI | Operator hub shell | 🟡 | 25 | [IPI-22](https://linear.app/ipix/issue/IPI-22) | `/dashboard` stub only | 3-panel layout not started |
| 3 | Wireframes | Shoot / canvas | 🟡 | 30 | — | [ipix/16-CANVAS.md](./ipix/16-CANVAS.md) | Not wired to app |
| 4 | AI | Brand intelligence | 🟢 | 100 | [IPI-18](https://linear.app/ipix/issue/IPI-18) | Edge + verify ✅ · UI pending | Brand Setup screen |
| 5 | AI | Asset DNA scoring | ⚪ | 0 | [IPI-19](https://linear.app/ipix/issue/IPI-19) | Spec only | After AI-001 |

---

### 🔴 Failed / needs attention

| Item | Why | Fix |
|------|-----|-----|
| **MVP proof #7** | No `audit-asset-dna` edge function | Implement DNA scoring after product link design |
| **MVP proof #8** | No UI to create `commerce_product_links` | Brand Setup + Mercur SKU picker |
| **Dashboard UI** | Brand intel not wired in app | `/dashboard` Brand Setup → call `brandIntelligenceService` |

---

### Next 3 actions (production-ready order)

1. **Brand Setup UI** — wire `brandIntelligenceService` on `/dashboard` (proof #6 operator UX)  
2. **MVP proof #7** — [IPI-19](https://linear.app/ipix/issue/IPI-19) `audit-asset-dna` edge (DNA scoring)  
3. **ECOM-C-008** — commerce API proxy in `src/` (buyer bridge)

---

## Local URLs

### Mercur admin

| | |
|--|--|
| Admin | http://localhost:9000/app |
| Orders | http://localhost:9000/app/orders |
| Login | `it@socialmediaville.ca` / local dev password (Infisical `/mercur/api` or admin setup) |
| Seller register | http://localhost:9000/seller/register |

### B2C storefront

| | |
|--|--|
| Shop | http://localhost:3000/de |
| Repo | `b2c-storefront/` |
| Start | `npm run storefront:dev` (from repo root) |
| Secrets | Infisical path `/storefront` |

### iPix marketing app

| | |
|--|--|
| Site | http://localhost:8080 |
| Start | `npm run dev:secrets` |
| Login | http://localhost:8080/login |

---

## Seed commands (`my-marketplace/packages/api`)

```bash
infisical run --path=/mercur/api -- sh -c 'cd my-marketplace/packages/api && yarn seed:seller'
infisical run --path=/mercur/api -- sh -c 'cd my-marketplace/packages/api && yarn seed:ipix-catalog'
infisical run --path=/mercur/api -- sh -c 'cd my-marketplace/packages/api && yarn seed:checkout-prep'
```

---

## Reference tables (detail)

<details>
<summary>IPIX-COM full notes (legacy)</summary>

| ID | Task | Status | Linear | Notes |
|----|------|--------|--------|-------|
| IPIX-COM-001 | Fresh Mercur backend boot | Done | IPI-5 | See tracker above |
| IPIX-COM-002 | Create admin account | Done | IPI-6 | |
| IPIX-COM-003 | Register + approve first seller | Done | IPI-7 | |
| IPIX-COM-004 | Wire real Redis | Done | IPI-11 | |
| IPIX-COM-005 | Stripe webhook + paid order | Done | IPI-10 | |
| IPIX-COM-006 | Clone B2C storefront | Done | IPI-9 | |
| IPIX-COM-007 | Algolia + TalkJS | Todo | — | Optional |
| IPIX-COM-008 | ipix catalog seeds | Done | IPI-8 | |
| IPIX-COM-009 | ADR commerce ownership | Done | IPI-13 | ADR-002 Accepted |
| IPIX-COM-010 | Commit marketplace + docs | Done | IPI-12 | Monorepo commit |

</details>
