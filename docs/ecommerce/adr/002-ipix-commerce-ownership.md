# ADR-002: iPix Owns Commerce (Mercur + B2C Storefront)

**Status:** Accepted  
**Date:** 2026-06-14  
**Linear:** IPI-13 (COM-009)  
**Supersedes (for iPix):** Path/layout portions of [ADR-001](./001-standalone-mercur.md) (mdeapp `commerce/mercur/` layout)

## Context

iPix is bootstrapping marketplace commerce locally with Mercur (Medusa 2 + marketplace modules), an approved seller, seeded catalog, Stripe checkout, and a B2C buyer storefront. Phase 1 proof is complete: Store API catalog, captured Stripe test order, admin/vendor UIs on `:9000`, shop on `:3000/de`.

mdeapp remains a separate product. It must not become the owner of Mercur, commerce env, or buyer checkout for iPix.

## Decision

| Principle | Rule |
|-----------|------|
| **Commerce owner** | **iPix** (this repo) |
| **mdeapp** | Does **not** own Mercur; may link later via HTTP/SDK only |
| **System of record** | Mercur for products, sellers, carts, orders, payments |
| **Buyer UI** | `b2c-storefront/` (Mercur B2C reference clone) |
| **Admin / vendor UI** | Mercur on `:9000` (`/app`, `/seller`) |
| **Cross-app integration** | Read-only or API-driven; **no** importing mdeapp commerce code into iPix |

### Repository layout (iPix)

```text
/home/sk/ipix/                    # origin: amo-tech-ai/lumina-studio
├── my-marketplace/               # Mercur backend (Medusa 2 + marketplace)
│   └── packages/api/             # API, seeds, medusa-config, webhooks
├── b2c-storefront/               # Next.js buyer storefront (:3000)
├── src/                          # Vite marketing site (:8080) — separate from checkout
└── docs/ecommerce/               # ADRs, tasks, runbooks
```

### Data ownership

| Domain | System of record | iPix path / endpoint |
|--------|------------------|----------------------|
| Products, variants, prices | Mercur | `my-marketplace/` · Store API |
| Sellers, approvals | Mercur | Admin `/app` · seller `ipix` |
| Carts, orders, fulfillments | Mercur | Store API · Admin orders |
| Payments | Stripe via Medusa | Webhook `/hooks/payment/stripe_stripe` |
| Buyer UX | B2C storefront | `http://localhost:3000/de` |
| Marketing site | Vite app | `http://localhost:8080` — links to shop, no cart logic |

**Invariant:** No duplicate commerce truth in Supabase or the marketing app. Future Supabase mirrors (embeddings, CRM) are read-only and keyed by Mercur IDs.

### Architecture boundary

```text
Marketing (Vite :8080)     Buyer (B2C :3000/de)     Ops (Mercur :9000)
        │                          │                      │
        │  links only              │  Store API           │  Admin / Vendor
        └──────────────────────────┴──────────────────────┘
                                   │
                          my-marketplace :9000
                    (products, sellers, carts, orders)
                                   │
                                   ▼
                          Stripe test (Phase 1)
```

### mdeapp relationship

- mdeapp **does not** host `commerce/mercur/` for iPix.
- mdeapp **may** consume iPix Mercur Store API later (concierge, deep links) — integration ADR TBD.
- mdeapp **must not** import iPix `my-marketplace/` or `b2c-storefront/` source into its tree.
- Shared patterns (seed scripts) are **copy-once, fork** — not a shared npm package in Phase 1.

## Phase 1 proof (2026-06-14)

| Check | Evidence |
|-------|----------|
| Seller approved | `ipix` · `sel_01KV23CX3TX7V8ZD6RXXXNC3ZV` |
| Catalog | 14 products via Store API |
| Stripe paid order | `order_01KV23HEK56ME7DNGCA8ND38ZJ` · captured |
| Seeds | `yarn seed:seller` · `seed:ipix-catalog` · `seed:checkout-prep` |

## Non-goals (iPix Phase 1)

- mdeapp CopilotKit cart or product cards
- Stripe Connect / multi-vendor payouts
- Supabase as commerce catalog authority
- Committing secrets (`.env`, `.env.local`, Stripe keys) to git
- Merging commerce into the Vite marketing bundle

## Consequences

**Positive**

- Single repo (`lumina-studio`) can hold marketing + commerce bootstrap with clear folder boundaries
- Phase 2 (Algolia, TalkJS, production deploy) has a signed ownership model
- mdeapp stays decoupled; no accidental dual-Mercur drift

**Negative / trade-offs**

- Large repo surface (monorepo-style) — require strict `.gitignore` and no secrets in `my-marketplace/` / `b2c-storefront/`
- Two dev servers minimum for full stack (9000 + 3000; marketing optional on 8080)

## References

- [ADR-001](./001-standalone-mercur.md) — original mdeapp Phase 1 decision (historical)
- [todo.md](../../../todo.md) — bootstrap status
- Mercur docs: https://docs.mercurjs.com/
- B2C storefront: https://github.com/mercurjs/b2c-marketplace-storefront
