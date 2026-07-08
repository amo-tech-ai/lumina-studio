# AGENTS.md

Project memory for AI coding agents working in this repository.

## 🚫 #1 RULE — NEVER MIX CONCERNS

**NEVER mix docs and production files in the same PR or commit. NEVER mix two different tasks/concerns in the same PR or commit. EVER.**

One concern per PR **and** per commit: docs-only, code-only, migration-only, CI/config-only — each in its own PR. If a change set spans docs + code (or two tasks), STOP and split along the seam before staging. This is the most-enforced rule in the repo (it exists because of the PR #99 mega-bundle). Violating it is a blocking error, not a style preference. When asked to fix/merge an already-mixed PR, flag the bundling and split it — do not push more changes into it.

## Project Overview

**iPix / Lumina Studio** — AI-powered content planning & commerce platform for fashion and DTC brands.

The repo has **two product surfaces** and a marketplace:

| Surface | Location | Stack | Status |
|---|---|---|---|
| **Operator app** | `app/` | Next.js 16 + CopilotKit v2 + Mastra + Gemini | **Canonical — build here** |
| **Legacy Vite app** | `src/` (root) | React 18 + Vite + shadcn/ui | **Retiring** (IPI-89) — do not extend |
| **B2C storefront** | `b2c-storefront/` | Next.js + Algolia + Medusa | Active |
| **Mercur marketplace** | `my-marketplace/` | Medusa v2 (Mercur) | Active (separate Postgres) |
| **Supabase backend** | `supabase/` | Postgres + Edge Functions (Deno) | Active — remote-only |

PRD: `prd.md`. Wireframes: `tasks/wireframes-ipix/new/`. Linear: `docs/linear/issues/` (IPI-* / PLT-* / AI-* / COM-* / UI-* / DNA-*).

## Commands

### Operator app (Next.js — primary)

```bash
cd app && npm run dev          # Next.js :3002 + Mastra :4111 (concurrent)
cd app && npm run lint         # ESLint (v1 import guard for CopilotKit)
cd app && npm run build        # Production build
cd app && npx tsc --noEmit     # Full typecheck (build has ignoreBuildErrors)
cd app && npm test             # Vitest
```

### Legacy Vite app (do not extend)

```bash
npm run dev                    # Vite on localhost:8080
npm run build                  # Production build
npm run lint                   # ESLint
npm run test                   # Vitest
npm run check:env              # Validate VITE_* client env vars (CI gate)
```

### Supabase (remote-only — see policy)

```bash
npm run supabase:verify                     # Health-check linked remote DB
npm run supabase:verify-rls                 # Verify RLS policies
npm run supabase:verify-edge                # Verify deployed edge functions
npm run supabase:verify-brand-intelligence  # Verify brand intelligence pipeline
npm run supabase:migrations                 # List migrations
npm run supabase:push                       # Push schema changes
npm run supabase:types                      # Regenerate src/types/supabase.ts
# Create a new migration:
#   supabase migration new <name>
# then edit the generated file in supabase/migrations/
```

### Single test

```bash
npx vitest run src/path/to/file.test.ts         # root Vite
cd app && npx vitest run src/path/to/file.test.ts  # Next.js app
# or by name:
npx vitest run -t "test name"
```

### Seeds & checks

```bash
npm run seed:sample-brand    # Seed a sample brand via edge function
node scripts/seed-sample-brand.mjs
```

## Secrets

Managed via **Infisical**. For the operator app: `infisical run -- npm run dev` injects `GEMINI_API_KEY` and other secrets. For the Vite app: copy `.env.example` → `.env.local` and set `VITE_*` vars.

**Never expose `SUPABASE_SERVICE_ROLE_KEY` or `GEMINI_API_KEY` client-side.** Edge function secrets live in Supabase Dashboard, not in `.env`.

## Architecture

### Frontend — canonical (`app/` — Next.js 16)

Next.js App Router with two route groups:
- `(marketing)` — public site (`/`, `/services/*`, `/login`)
- `(operator)` — authed app hub (`/app/*`) with CopilotKit + Mastra agent sidebar

Key paths:
- `app/src/app/(marketing)/` — public pages
- `app/src/app/(operator)/` — operator pages
- `app/src/app/api/copilotkit/[[...slug]]/route.ts` — CopilotKit runtime endpoint
- `app/src/mastra/` — Mastra agent registry, agents (`production-planner`, `creative-director`), tools
- `app/src/lib/supabase/` — Supabase client, server client, admin client
- `app/src/components/` — shared components

Auth: PKCE flow via `app/src/app/auth/callback/route.ts`. Login at `/(marketing)/login`.

CopilotKit v2 imports from `/v2` subpath: `@copilotkit/react-core/v2`, `@copilotkit/runtime/v2`. Mastra agents connect via `MastraAgent.getLocalAgents()`. The Mastra registry key = agent `id` = frontend `useAgent({ agentId })` — keep all three identical.

### Legacy Vite (`src/`) — retiring

Do **not** add new features. Routes in `src/App.tsx` duplicate `app/`. The dashboard pages (`CommandCenterPage`, `BrandHubPage`, `AssetsPage`, etc.) were the MVP product surface — now being ported to Next.js.

Key directories still live here:
- `src/pages/` — service pages + dashboard pages
- `src/components/` — shared components + 50+ shadcn/ui primitives in `src/components/ui/`
- `src/components/operator/` — dashboard-specific components
- `src/contexts/AuthContext.tsx` — Supabase session state
- `src/services/` — `profileService`, `brandIntelligenceService`, `edgeFunctionService`, etc.
- `src/lib/` — `env.ts` (zod-validated env), `supabase.ts` (typed client), `utils.ts` (cn())
- `src/types/` — `supabase.ts` (generated DB types — do not hand-edit)
- `src/hooks/` — `use-mobile.tsx`, `use-toast.ts`

### B2C Storefront (`b2c-storefront/`)

Next.js storefront with Algolia search + Medusa commerce backend. Business-facing consumer experience.

### Backend — Supabase

- **`supabase/migrations/`** — ~97 SQL migrations. Platform MVP schema: `20260614000000_ipix_platform_mvp.sql`
- **Remote-only policy:** Do NOT run `supabase start` / local Docker. Historical migrations don't replay cleanly on fresh local DB. The remote project (`nvdlhrodvevgwdsneplk`) is the source of truth. Ship schema via `npm run supabase:push`.
- Commerce catalog lives on **Mercur** (separate Postgres `:5433`), not Supabase.
- Supabase holds: brand intelligence, asset metadata, Mercur product links, AI agent logs.
- After any schema change: `npm run supabase:types`.

### Edge Functions (`supabase/functions/`)

Deno functions with `_shared/` building blocks:
- `_shared/auth.ts` — `resolveAuth` (Bearer JWT → user, optional/required)
- `_shared/cors.ts` — `handleCors`
- `_shared/response.ts` — `jsonResponse`/`errorResponse`/`safeErrorMessage`
- `_shared/supabase-client.ts` — `createUserClient`
- `_shared/env.ts` — `getOptionalSecret`
- `_shared/agent-log.ts` — `insertAgentLog`
- `_shared/gemini.ts` — Gemini structured-output via `npm:@google/genai` (default `gemini-3.5-flash`)

Active functions: `brand-intelligence`, `audit-asset-dna`, `capture-lead`, `firecrawl-webhook`, `start-brand-crawl`, `health`, `edge-test`.

### Mercur Marketplace (`my-marketplace/`)

See `my-marketplace/AGENTS.md`. Commerce catalog, sellers, checkout, and Stripe on Medusa v2 (Mercur). Separate Postgres DB on `:5433`.

### CI

`.github/workflows/ci.yml`: `npm ci` → `npm run check:env` → `npm run build` → `npm run test`. Keep green.

## Design System

### Typography
- **Serif (headings):** Cormorant Garamond
- **Sans (body):** Outfit
- Both loaded via Google Fonts in `src/index.css`
- CSS vars `--font-serif` / `--font-sans` in `:root`; all `h1-h6` use serif by default
- **Do NOT use Inter, Roboto, or generic system fonts**

### Brand Colors
- Primary orange `#E87C4D`
- Secondary blue `#1E293B`
- Accent mustard `#F3B93C`
- Background off-white `#FBF8F5`
- DNA compliance: Approved `#059669` · Review `#D97706` · Blocked `#DC2626`

### Tokens & Style
- CSS custom properties in `src/index.css` `:root`
- `tailwind.config.ts` maps them to utilities (custom `--surface-*`, `--text-*` tokens)
- Premium aesthetic — generous whitespace, muted palette, glassmorphism. Avoid generic AI look.

### Service Page Pattern (Vite legacy)
Every service page: Header › Hero (image + copy) › Feature grid (cards w/ Lucide icons) › FAQ accordion › Portfolio/case study › CTA › Footer.

## Coding Conventions

- **Path alias (Vite):** `@/*` → `./src/*`
- **Path alias (Next.js):** `@/` → `./src/*`
- **TypeScript:** lenient (`strict: false`, `noImplicitAny: false`) — intentional for rapid prototyping
- **shadcn/ui:** `components.json` configured; add with `npx shadcn@latest add <component>`
- **Dark mode:** class-based, not actively used
- **Development port:** Vite on 8080, Next.js on 3002
- **HMR overlay:** disabled in Vite config
- **No commented code** — delete rather than comment out
- **No debug logs** — remove console.log before committing
- **Components are default-exported** from their files (page-level convention)
- **Use Lucide icons** for UI — already in the dependency tree
- **Framer Motion** available for animations

## Worktrees

Use git worktrees for multi-step implementation tasks. Convention:
- Branch: `ipi/<task-id>-<short-name>`
- Dir: `../wt-ipi-<task-id>-<short-name>` (sibling directory)
- Validate before PR: `npm ci && npm run lint && npx tsc --noEmit && npm run test && npm run build`

## Skills & Tools

Project skills live in `.claude/skills/`. Key consolidated hubs:
- `ipix` — general iPix domain routing
- `ipix-task-lifecycle` — 5-phase task workflow (plan → research → implement → test → ship)
- `ipix-supabase` — Supabase schema, RLS, migrations, edge functions
- `copilotkit` — CopilotKit v2 integration
- `mastra` — Mastra agents, tools, workflows
- `gemini` — Gemini AI integration patterns
- `medusa` — Medusa commerce development
- `cloudinary` — Cloudinary media delivery
- `infisical` — Secret management
- `linear` — Linear issue management
- `fashion-production` — Shoot production toolkit
- `frontend-design` — UI/frontend design patterns
- `graphify` — Knowledge graph for codebase exploration
- `brainstorming` — Requirement exploration before implementation
- `writing-plans` — Plan generation for multi-step tasks
- `feature-dev` — Multi-file feature development
- `worktrees` — Git worktree setup and operation
- `claude-md-improver` — CLAUDE.md audits + project glossary

Full inventory: `index-skills.md`.

## Graphify

Knowledge graph of the codebase at `docs/graphify/graphify-out/graph.json` (~80K nodes). Use for architecture exploration, dependency analysis, and impact assessment before changes.

```bash
# Query from repo root
graphify query "Brand Intelligence" --graph docs/graphify/graphify-out/graph.json
graphify explain "commerce_product_links" --graph docs/graphify/graphify-out/graph.json
graphify path "Brand Intelligence" "Asset DNA" --graph docs/graphify/graphify-out/graph.json

# Rebuild — do NOT run `graphify update docs/graphify/`
# (that overwrites the full graph with just the docs folder)
```

## Common Gotchas

1. **CopilotKit agent IDs:** Mastra registry key = agent `id` = frontend `useAgent({ agentId })`. If they mismatch, you get a runtime "agent not found" error. Three keys must be kept in sync: `default` (alias), `production-planner`, `creative-director`.
2. **Remote-only Supabase:** Never run `supabase start` locally. All schema work targets the remote project.
3. **Edge function secrets:** `GEMINI_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are Supabase Edge secrets — never in `.env` files.
4. **CopilotKit v1 vs v2:** Build fails on deprecated v1 imports (`useCoAgent`, `useCopilotReadable`, root `@copilotkit/react-core`, `copilotKitEndpoint`). Always use `/v2` subpath imports.
5. **Vite `src/` is retiring:** Do not add new features. Build in `app/` instead.
6. **`github/` directory:** ~1.7 GB of vendored CopilotKit examples. Never commit. Listed in `.gitignore`.
