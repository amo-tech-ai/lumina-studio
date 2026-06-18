# iPix (Lumina Studio)

AI-powered content planning for fashion and DTC brands. Vite + React marketing site today; Supabase + Cloudinary + Mercur product stack in progress.

**PRD:** [`prd.md`](./prd.md) · **Secrets:** [`docs/supabase/secrets-inventory.md`](./docs/supabase/secrets-inventory.md) · **Infisical:** [`docs/infisical/folder-structure.md`](./docs/infisical/folder-structure.md) · [migration report](./docs/infisical/migration-report.md)

## Stack

- **Frontend:** Vite, React 18, TypeScript, Tailwind, shadcn/ui
- **Backend (planned):** Supabase (Postgres, Auth, Edge Functions)
- **Media (MVP):** Cloudinary (not Supabase Storage for images)
- **Commerce:** Mercur / Medusa (`my-marketplace/`, `b2c-storefront/`)
- **Secrets:** [Infisical](https://infisical.com) — project `secret-management`

## Prerequisites

- Node.js 20+
- [Infisical CLI](https://infisical.com/docs/cli/overview) (`brew install infisical/get-cli/infisical` or `npm i -g @infisical/cli`)

## Infisical setup (secrets)

Infisical is the **source of truth** for environment variables. Do not commit `.env` or `.env.local`.

### 1. Login

```bash
infisical login
# or non-browser: infisical login --interactive
infisical login status
```

### 2. Link project (once per clone)

The repo already includes `.infisical.json` for workspace `81f93e92-167a-4ae2-806e-4b5bee28cf12`. If missing:

```bash
cd /path/to/ipix
infisical init
# select organization → secret-management project
```

### 3. Run with injected secrets

```bash
npm install

# Development (port 8080)
infisical run -- npm run dev

# Production build
infisical run -- npm run build

# Explicit environment
infisical run --env=staging -- npm run dev
```

Branch → environment mapping is in `.infisical.json` (`main` → `prod`, `develop` → `dev`).

**Infisical paths:**

| Path | App |
|------|-----|
| `/` | iPix Vite (`npm run dev`) |
| `/mercur/api` | Medusa API |
| `/mercur` | Mercur shared (Stripe) |
| `/storefront` | B2C Next.js |

```bash
npm run mercur:dev          # Medusa API
npm run storefront:dev      # B2C storefront
```

### 4. Manage secrets

```bash
# List secret names in dev (no subcommand "list")
infisical secrets --env=dev

# Set / import (avoid echoing values in shared terminals)
infisical secrets set KEY=placeholder --env=dev
infisical secrets set --file=.env.local --env=dev --silent

# Generate redacted template
infisical secrets generate-example-env --env=dev > .env.example.generated
```

Placeholder template without values: [`.env.example`](./.env.example).

### Fallback (temporary)

If Infisical is unavailable: `cp .env.example .env.local` and fill from the Infisical dashboard. Do not commit `.env.local`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite dev server (use via `infisical run --`) |
| `npm run build` | Production build |
| `npm run test` | Vitest |
| `npm run supabase:verify` | Supabase connectivity |
| `npm run supabase:verify-rls` | RLS smoke tests |
| `npm run supabase:verify-edge` | Edge function health |

## Project layout

```
src/                 Vite app (pages, components)
supabase/            Migrations, edge functions
my-marketplace/      Mercur API + vendor (separate env path)
b2c-storefront/      Next.js storefront
docs/                Architecture, Linear, Cloudinary, Infisical
```

## Deploy

Vite SPA — configure SPA rewrites on Vercel/Netlify. Sync production secrets from Infisical (Vercel Secret Sync or `infisical run` in CI with machine identity).
