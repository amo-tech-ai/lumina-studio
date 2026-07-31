---
title: "Stripe & Payments — Feature Adoption Report"
version: "1.0"
lastUpdated: "2026-07-31"
status: Active
purpose: "Where payments exist today, whether the operator app should charge, and the ordered task list to launch."
ssot: ../../../tasks/plan/todo.md
verifiedAgainst: "grep -ri stripe across app/ b2c-storefront/ my-marketplace/ supabase/ · payments + shoot_payments tables"
verifiedAt: "2026-07-31"
scores: { core: 25, advanced: 0, overall: 15 }
---

# Stripe & Payments — 15/100 (F) 🔴

**One-line problem:** `grep -ri stripe app/src` returns **nothing**. The operator
app cannot take money for a shoot.

---

## 1. Current state

| Where | Stripe present | Evidence |
|-------|:--------------:|----------|
| `app/` (operator) | ❌ **none** | zero matches in `app/src` |
| `b2c-storefront/` | ✅ | `@stripe/react-stripe-js` ^3.7.0, `@stripe/stripe-js` ^7.1.0 |
| `my-marketplace/` | 🟡 | via Medusa/Mercur payment providers |
| `supabase/` | 🟡 | `payments` (9 cols) + `shoot_payments` (7 cols) tables exist, **no rows** |
| Linear | ❌ | `tasks/todo.md` lists STR-001–003 with the note *"No Linear issues"* |

### ⚠️ "The database is ready" is not true — check the columns

`shoot_payments` exists and has never been written to, but it is **not** a
schema you could ship Connect against. All 7 columns, from
`information_schema` on `fashionos`:

```text
id · shoot_id · user_id · amount(numeric) · provider_payment_id(text)
status(enum) · created_at
```

| Missing | Why it blocks the model recommended below |
|---------|-------------------------------------------|
| `currency` | `amount` is a bare `numeric`. A payments table without a currency is a defect waiting for the first non-CAD booking |
| Capture state | Manual-capture Payment Intents need `authorized` / `captured` / `expired` distinguished. One `status` enum holding both intent and payout state will collapse them |
| `transfer_id` / `destination_account` | Connect pays talent from a transfer. Without these there is no record of who got paid |
| `application_fee_amount` | The platform fee is the business model. It isn't stored |
| Idempotency key | Stripe requires one per intent to make retries safe |

**Plain English:** the table is a placeholder someone sketched, not a design. Treat
"add the missing columns" as step 0 of STR-001, not as a detail — building the
integration first and migrating the table under live payment rows afterwards is the
expensive order to do it in.

---

## 2. The architectural question — and a recommendation

Two models are possible:

| Model | How money flows | Fits iPix? |
|-------|-----------------|-----------|
| **A. Storefront-only** | Consumers buy products in `b2c-storefront`; shoots are billed offline | Works today. Leaves the core product unmonetised |
| **B. Operator charges for shoots** | Brand books a shoot in `/app/shoots/new`, pays a deposit, balance on delivery | Matches the actual business |

**Recommendation: B, with Stripe Connect.**

iPix's product is a two-sided fashion-production marketplace — brands on one side,
models and crew on the other. `talent.bookings` and `shoot_payments` gesture at
that shape, though `shoot_payments` needs the columns above before it can carry it. Connect is built for exactly this shape: the platform takes a fee, talent
gets paid out, and iPix never holds funds directly.

The shoot lifecycle also maps cleanly onto Stripe primitives already:

| Shoot stage | Stripe primitive |
|-------------|------------------|
| Shoot draft approved (`saveApprovedShootDraft`) | Payment Intent, manual capture — a hold, not a charge |
| Booking request sent (`createBookingDraft`) | Nothing yet — talent hasn't accepted |
| Booking confirmed (human-only approve) | Capture the deposit |
| Assets delivered | Capture the balance |
| Talent paid | Connect transfer |

That's the whole integration, and every stage already exists as a gate in the app.

---

## 3. Supabase + Stripe: Sync Engine vs FDW Wrapper

| | **Stripe Sync Engine** | **Stripe FDW Wrapper** |
|---|---|---|
| What it does | Syncs Stripe objects into real Postgres tables | Maps Stripe API endpoints to foreign tables, queried live |
| Setup | One click in the Supabase dashboard | `create foreign table` + Vault key |
| Reads | Fast, local, joinable, indexable | Live but network-bound per query |
| Writes | No | Yes (customers, subscriptions, invoices) |
| Stale data | Webhook-lag | Never |
| Good for | Reporting, joining payments to `shoots`/`brands` | Occasional lookups, admin |

**Recommendation: Sync Engine.** iPix needs to join payment state to
`shoots`, `brands`, and `talent.bookings` — a join across a foreign table would be
slow and unindexable. The one-click dashboard setup also beats writing a webhook
handler, which is the classic place this integration rots.

Keep the Wrapper in mind only if an admin screen needs to *write* to Stripe from
SQL, which is unlikely.

---

## 4. Stripe features worth using (filtered to iPix)

From Stripe's 2026 announcements — most of the 288 launches are irrelevant here.
These are not:

| Feature | iPix use | Priority |
|---------|----------|:--------:|
| **Connect** | Pay models and crew; platform fee | 🔴 Required for model B |
| **Payment Intents, manual capture** | Deposit hold at shoot approval, capture at confirm | 🔴 Required |
| **Adaptive Pricing** | Brands are international; localised checkout. Stripe's A/B across 1.5M subscription checkouts: +4.7% conversion, +5.4% LTV | 🟡 Nice |
| **Billing** | Retainer / subscription clients | 🟡 Later |
| **Tax** | Cross-border shoot invoicing | 🟡 Later |
| **Radar** | Fraud on first-time brand accounts | 🟢 Low |
| **Agentic Commerce Suite** | Sell shoot packages inside AI interfaces | ⚪ Watch |
| **Metronome usage billing** | Per-asset or per-shot pricing | ⚪ Watch |

⚠️ Stripe's 2026 direction is heavily agentic-commerce. Interesting given iPix is
agent-native, but it's a 2027 conversation — deposits and Connect come first.

---

## 5. Progress tracker

| ID | Task | | % | Examine | Verify | Blocker |
|----|------|:-:|--:|---------|--------|---------|
| ST-01 | Stripe in operator app | ⚪ | 0 | `app/src` | `grep -ri stripe app/src` | No decision |
| ST-02 | `payments` / `shoot_payments` schema | 🔴 | 25 | Supabase `information_schema.columns` | see §1 column list | **No currency, capture state, transfer id, fee, or idempotency key** |
| ST-03 | Storefront checkout | 🟡 | 60 | `b2c-storefront/` | commerce proofs 1–5 | Separate app |
| ST-04 | Marketplace payouts | 🟡 | 40 | `my-marketplace/` | Mercur config | — |
| ST-05 | Connect onboarding | ⚪ | 0 | — | — | Model decision |
| ST-06 | Deposit hold / capture | ⚪ | 0 | — | — | Model decision |
| ST-07 | Supabase Stripe Sync Engine | ⚪ | 0 | — | dashboard | — |
| ST-08 | STR Linear issues | 🔴 | 0 | `tasks/todo.md` "No Linear issues" | Linear | **Blocking everything above** |

---

## 6. Next 5 tasks, in dependency order

| # | Task | Effort | Blocks |
|:-:|------|:------:|--------|
| 1 | **Decide model A vs B.** One decision, written into `mvp.md` | S | Everything |
| 2 | File STR-001–003 in Linear with real titles and `mvp` labels | S | All tracking |
| 3 | Enable the Supabase Stripe Sync Engine (dashboard, one click) | S | Reporting joins |
| 4 | Payment Intent with manual capture at `saveApprovedShootDraft` | M | Deposits |
| 5 | Connect onboarding for talent | L | Payouts |

**Task 1 is genuinely blocking.** Everything below it is wasted if the answer is
"storefront only." It is a business decision, not an engineering one — this doc
recommends B but cannot make the call.

---

## 7. Sources

- [Stripe docs](https://stripe.com/docs) · [Sessions 2026 announcements](https://stripe.com/blog/everything-we-announced-at-sessions-2026) · [Adaptive Pricing for subscriptions](https://stripe.com/blog/adaptive-pricing-for-subscriptions)
- [Supabase Stripe Sync Engine](https://supabase.com/blog/stripe-sync-engine-integration) · [Stripe FDW Wrapper](https://supabase.com/docs/guides/database/extensions/wrappers/stripe)
- Local: `mvp.md` (commerce proofs 1–5) · `tasks/todo.md` STR rows
