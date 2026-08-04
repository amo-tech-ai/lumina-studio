# PR-Agent Expert Sheet — Commerce (Mercur/Medusa)

> Domain rules for PRs touching `my-marketplace/`, `b2c-storefront/` checkout/cart,
> Stripe, sellers/vendors, or Supabase↔Mercur product links.
> Sheet: `commerce.md` · phase: C (loaded on demand only).

## Ownership contract (the one rule that stops most commerce bugs)

**Mercur/Medusa owns commerce. Supabase never duplicates commerce state.**

- `my-marketplace/` (Mercur on Medusa v2, own Postgres `:5433`): catalog, products, orders,
  sellers, checkout, Stripe.
- `b2c-storefront/`: consumer-facing Next.js; talks to Medusa + Algolia; no direct Postgres.
- Supabase holds **links/metadata only**: `commerce_product_links`, brand intelligence,
  asset DNA — joined to Medusa products by stable product IDs.

Flag any PR that adds purchase/inventory/price persistence to Supabase, or that bypasses
Medusa's data model with raw SQL into `my-marketplace` tables from the operator app.

## Hard rules (BLOCKING if violated)

1. Stripe secrets/keys server-side only (Medusa config or env), never in storefront/client bundles.
2. Storefront checkout flows use the Medusa SDK routes already wired — no new direct
   Postgres or unrestricted admin API calls from the browser.
3. Product-link drift: a Supabase change removing/renaming the link without a
   fallback path for the marketplace product it referenced is data-loss risk — BLOCKING.
4. Seller/vendor trust boundaries: vendor-owned fields must not accept writes from
   buyer-scoped contexts.

## Acceptable patterns (do NOT flag)

- Medusa module API queries inside `my-marketplace` API routes even when they traverse
  sellers/payments — that is the ownership pattern working as designed.
- Supabase reads of `commerce_product_links` from `app/` that only *reference* Medusa IDs.
- Algolia search index updates that mirror, not own, product state.

## How to flag

`BLOCKING` — duplicate commerce state in Supabase; Stripe key client-reachable; breaking
product-link change without migration/recovery note.
`IMPORTANT` — new admin API surface without ownership boundary; checkout flow changes
without payment-path tests.
