---
title: "Mercur + B2C Storefront — Local Setup"
version: "1.0"
lastUpdated: "2026-06-13"
status: "Draft"
purpose: "Step-by-step from zero to running marketplace backend + optional buyer storefront"
---

# 01 — Setup from scratch

You already have:

- Global CLI: `bun add -g @mercurjs/cli@latest`
- Project scaffold: `ipix/my-marketplace/` (Mercur monorepo, `yarn install` done)
- Root `.env` with Stripe test keys only — **not enough to run the backend yet**

This doc finishes backend setup, then adds the **buyer-facing** B2C storefront as a **separate repo**.

---

## What you are building (plain English)

| Piece | What it is | Who uses it |
|-------|------------|-------------|
| **Medusa** | Open-source commerce engine (products, cart, orders, payments) | Developers only — you do not install Medusa separately |
| **Mercur** | Marketplace layer **on top of** Medusa (sellers, commissions, split orders, vendor payouts) | Your platform |
| **`my-marketplace`** | Your Mercur project (API + Admin + Vendor in one monorepo) | Operators + sellers |
| **B2C storefront** | Next.js shop for **buyers** (browse, cart, checkout) | Shoppers |

Medusa = engine. Mercur = marketplace features + dashboards. Storefront = customer website that talks to the API.

```
Shopper  →  b2c-storefront (:3000)  →  Mercur API (:9000)  →  PostgreSQL + Redis
Operator →  Admin  (:9000/dashboard)
Seller   →  Vendor (:9000/seller)
```

References: [Mercur](https://github.com/mercurjs/mercur) · [Medusa marketplace](https://medusajs.com/marketplace/) · [Mercur docs](https://docs.mercurjs.com/getting-started/introduction) · [B2C storefront](https://github.com/mercurjs/b2c-marketplace-storefront)

---

## Prerequisites (install once)

| Requirement | Version | Check |
|-------------|---------|-------|
| Node.js | v20+ | `node -v` |
| Bun | v1.3+ (CLI) | `bun -v` |
| Yarn | v1.x (project uses it) | `yarn -v` |
| PostgreSQL | v14+ | `psql --version` |
| Redis | any recent | `redis-cli ping` → `PONG` |
| Git | — | `git --version` |

### Quick local Postgres (Docker)

```bash
docker run -d --name mercur-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 postgres:16
```

Create a database:

```bash
docker exec -it mercur-postgres psql -U postgres -c "CREATE DATABASE mercur;"
```

### Quick local Redis (Docker)

```bash
docker run -d --name mercur-redis -p 6379:6379 redis:7
```

---

## Phase A — Finish `my-marketplace` (backend)

**Goal:** API + Admin + Vendor running on port **9000**.

### A1. Current state check

```bash
cd /home/sk/ipix/my-marketplace
ls packages/api/.env   # should exist after A2 — currently missing
```

If `packages/api/.env` is missing, the CLI `create` step did not finish DB setup (or you only copied Stripe keys to the wrong file).

### A2. Create backend environment file

```bash
cd /home/sk/ipix/my-marketplace
cp packages/api/.env.template packages/api/.env
```

Edit `packages/api/.env` — minimum required:

```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/mercur
REDIS_URL=redis://localhost:6379
JWT_SECRET=<random-long-string>
COOKIE_SECRET=<random-long-string>

STORE_CORS=http://localhost:3000,http://localhost:8000
ADMIN_CORS=http://localhost:9000
VENDOR_CORS=http://localhost:9000
AUTH_CORS=http://localhost:9000,http://localhost:3000

MERCUR_VENDOR_URL=http://localhost:9000/seller

# Payments (move from root .env if you added Stripe there)
STRIPE_API_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...   # after stripe listen (see A6)
```

**Important:** Medusa reads env from `packages/api/` (where `medusa-config.ts` lives). Root `my-marketplace/.env` is **not** used by the backend unless you symlink or duplicate vars into `packages/api/.env`.

### A3. Install deps (if needed) and migrate DB

From project root:

```bash
cd /home/sk/ipix/my-marketplace
yarn install          # already done if node_modules exists
cd packages/api
yarn medusa db:migrate
yarn medusa db:seed   # if seed script exists in package.json; CLI create may have seeded already
```

If `create` never ran migrations:

```bash
cd /home/sk/ipix/my-marketplace/packages/api
npx medusa db:migrate
```

### A4. Start dev server

```bash
cd /home/sk/ipix/my-marketplace
yarn dev
# or: bun dev  (if you prefer bun for scripts)
```

### A5. First-time accounts

| URL | Action |
|-----|--------|
| http://localhost:9000/dashboard | Create **admin** (invite flow on first run) |
| http://localhost:9000/seller/register | Register **first seller**, then approve in Admin |

Seed data does **not** include a seller — you must register one.

### A6. Stripe (test mode)

1. Put `STRIPE_API_KEY` in `packages/api/.env` (test secret key).
2. Forward webhooks locally:

```bash
stripe listen --forward-to localhost:9000/hooks/payment/stripe_stripe
```

3. Copy the printed `whsec_...` into `STRIPE_WEBHOOK_SECRET`.

Use a **separate** Stripe webhook from any other app (e.g. Supabase ticket payments).

### A7. Create publishable API key (needed for storefront)

In **Admin** → Settings → Publishable API keys → create a key.

Save it as `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` for Phase B.

### A8. Verify backend

```bash
curl -s http://localhost:9000/health
# expect OK / healthy response

curl -s http://localhost:9000/store/regions | head
# expect JSON with regions
```

---

## Phase B — B2C storefront (buyers)

**Goal:** Fashion-style multi-vendor shop on port **3000**, talking to `my-marketplace`.

This is a **separate repository** — not inside the Mercur monorepo.

### B1. Clone next to backend

```bash
cd /home/sk/ipix
git clone https://github.com/mercurjs/b2c-marketplace-storefront.git b2c-storefront
cd b2c-storefront
yarn install
```

Suggested layout:

```
ipix/
├── my-marketplace/     # Mercur backend (Phase A)
├── b2c-storefront/     # Buyer UI (Phase B)
└── docs/ecommerce/     # Plans & ADRs
```

### B2. Storefront environment

```bash
cp .env.template .env.local
```

Minimum `.env.local` for local dev:

```env
MEDUSA_BACKEND_URL=http://localhost:9000
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=<from Admin A7>
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_DEFAULT_REGION=us
NEXT_PUBLIC_STRIPE_KEY=<stripe publishable pk_test_...>
REVALIDATE_SECRET=<random-string>
NEXT_PUBLIC_SITE_NAME="iPix Marketplace"
NEXT_PUBLIC_SITE_DESCRIPTION="Multi-vendor fashion marketplace"

# Optional for full features — can stub for first boot:
NEXT_PUBLIC_ALGOLIA_ID=dev
NEXT_PUBLIC_ALGOLIA_SEARCH_KEY=dev
NEXT_PUBLIC_TALKJS_APP_ID=dev
```

Algolia and TalkJS power search and buyer–seller chat. For a first smoke test you can use placeholder values; search/chat will not work until configured ([storefront README](https://github.com/mercurjs/b2c-marketplace-storefront)).

### B3. Run storefront

```bash
cd /home/sk/ipix/b2c-storefront
yarn dev
```

Open http://localhost:3000

### B4. CORS reminder

`STORE_CORS` in `packages/api/.env` must include `http://localhost:3000` or browser requests from the storefront will fail.

---

## Phase C — Optional integrations (later)

| Integration | Purpose | When |
|-------------|---------|------|
| **Algolia** | Product search & filters | Before demo-quality browse |
| **TalkJS** | Buyer ↔ seller messaging | Before messaging features |
| **Stripe Connect** | Vendor payouts | Before multi-vendor payouts |
| **Resend** | Transaction email | Production |

---

## Daily dev workflow

Terminal 1 — infrastructure (if not always-on):

```bash
docker start mercur-postgres mercur-redis
```

Terminal 2 — backend:

```bash
cd /home/sk/ipix/my-marketplace && yarn dev
```

Terminal 3 — storefront (when working on buyer UI):

```bash
cd /home/sk/ipix/b2c-storefront && yarn dev
```

Terminal 4 — Stripe webhooks (when testing checkout):

```bash
stripe listen --forward-to localhost:9000/hooks/payment/stripe_stripe
```

---

## Checklist — “done with setup”

### Backend (`my-marketplace`)

- [ ] PostgreSQL running, `DATABASE_URL` set in `packages/api/.env`
- [ ] Redis running, `REDIS_URL` set
- [ ] Migrations applied
- [ ] `yarn dev` — http://localhost:9000/health OK
- [ ] Admin login works — http://localhost:9000/dashboard
- [ ] Seller registered + approved — http://localhost:9000/seller
- [ ] Publishable API key created
- [ ] Stripe test keys in `packages/api/.env` (not only root `.env`)

### Storefront (`b2c-storefront`)

- [ ] Cloned and `yarn install`
- [ ] `.env.local` with backend URL + publishable key
- [ ] `yarn dev` — http://localhost:3000 loads
- [ ] Can browse at least one product (after seller lists products in Vendor panel)

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `DATABASE_URL` / connection refused | Postgres not running or wrong URL | Start Docker Postgres; fix `packages/api/.env` |
| Redis errors on start | Redis not running | `docker run ... redis:7` or install locally |
| Admin 404 | Wrong URL | Use `/dashboard` on **9000**, not legacy `:7000` unless README template says otherwise |
| Storefront CORS errors | Missing origin | Add `http://localhost:3000` to `STORE_CORS` |
| Empty store | No products / no approved seller | Complete vendor onboarding + add products |
| Stripe checkout fails | Missing webhook or wrong key namespace | `STRIPE_*` in `packages/api/.env` + `stripe listen` |

---

## What NOT to do yet

- Do not merge B2C storefront into `my-marketplace` — keep repos separate (official Mercur layout).
- Do not point ipix marketing site (`:8080`) at Medusa until you deliberately add a proxy or SDK client (separate task).
- Do not reuse mdeapp Supabase Stripe webhook secrets for Mercur.

---

## Next docs (after this step)

- `02-seed-catalog.md` — demo products, regions, seller (port from mdeapp seeds if needed)
- `03-stripe-connect.md` — vendor payouts
- `04-algolia-talkjs.md` — full storefront search + chat
- ADR: ipix as commerce owner vs reference-only storefront

---

## AI / MCP helpers

- Mercur MCP: `https://docs.mercurjs.com/mcp`
- LLM index: `https://docs.mercurjs.com/llms.txt`
- Project context: `my-marketplace/AGENTS.md`, `my-marketplace/CLAUDE.md`
