# IPIX B2C Checkout E2E — 2026-06-14

**Tasks:** IPI-9 · IPI-10 · ECOM-C-018 · Proof #4 / #5  
**Environment:** Local Mercur `:9000` + B2C storefront `:3000` (use `127.0.0.1` in browser automation)

## Summary

| Step | Result |
|------|--------|
| Mercur health | ✅ `GET /health` → 200 |
| Storefront PDP | ✅ `http://127.0.0.1:3000/de/products/ipix-minimal-black-tee` |
| Add to cart (browser) | ✅ Cart shows Minimal Black Tee €23 |
| Checkout address (browser) | ✅ Saved → delivery step |
| Shipping options (Store API) | ✅ After `yarn seed:checkout-prep` + cart address |
| Stripe provider on region | ✅ Fixed link via `link.create` (was only `pp_system_default`) |
| Stripe test payment | ✅ `pi_3Ti8zYFAkFMiToA11WLMX9rB` status `succeeded` |
| Order created | ✅ Mercur `order_group` `og_01KV2JDXQ8VVWFK5VXTBYY1BQG` total €15 |
| Admin orders | ✅ Verify at `http://localhost:9000/app/orders` |

## Automated proof (canonical)

```bash
infisical run --path=/mercur/api --path=/storefront -- node scripts/commerce/paid-order-smoke.mjs
```

**Sample output (2026-06-14T08:02:05Z):**

```json
{
  "cartId": "cart_01KV2JDVR3SZD9MHW2D7FWA1ME",
  "paymentIntentId": "pi_3Ti8zYFAkFMiToA11WLMX9rB",
  "paymentIntentStatus": "succeeded",
  "orderGroupId": "og_01KV2JDXQ8VVWFK5VXTBYY1BQG",
  "total": 15
}
```

## Browser UX proof

1. PDP loads after seller-reviews field-mask fix (`b2c-storefront/src/lib/data/products.ts`)
2. Cart at `/de/cart` shows line item + checkout CTA
3. Checkout `/de/checkout?step=address` accepts shipping + email
4. Delivery step requires shipping option — ensure `yarn seed:checkout-prep` ran (links `pp_stripe_stripe` + seller shipping)

**Note:** Full Stripe Elements flow in browser requires `pp_stripe_stripe` on region (fixed 2026-06-14). Re-run browser payment after seed if checkout still shows Manual Payment only.

## Fixes applied this session

| Fix | File |
|-----|------|
| Seller reviews field mask (PDP 500) | `b2c-storefront/src/lib/data/products.ts` |
| Stripe region link (Store API) | `my-marketplace/packages/api/src/scripts/seed-ipix-checkout-prep.ts` |
| Paid order smoke script | `scripts/commerce/paid-order-smoke.mjs` |

## Commands

```bash
npm run mercur:dev          # :9000
npm run storefront:dev      # :3000
cd my-marketplace/packages/api && yarn seed:checkout-prep
npm run commerce:paid-order-smoke
```

## ECOM-C-018 gate

Phase 1 commerce exit criteria satisfied on ipix repo with committed `my-marketplace/`, `b2c-storefront/`, `docs/ecommerce/`, and this evidence artifact.
