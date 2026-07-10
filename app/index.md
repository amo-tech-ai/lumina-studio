# app/ — file & folder index

**Product:** Lumina Studio / iPix operator app  
**Stack:** Next.js 16 App Router · Mastra · CopilotKit · Supabase · Cloudinary · **OpenNext → Cloudflare Workers**  
**Dev:** `npm run dev` → UI `:3002` + Mastra dev  
**CF preview:** `npm run preview` → OpenNext build + Wrangler (`workerd`)  
**Migration status:** CF-MIG-110 scaffold installed 2026-07-08 — see [`tasks/cloudflare/migration/startup.md`](../tasks/cloudflare/migration/startup.md)  
**Canonical docs:** [`AGENTS.md`](./AGENTS.md) · [`DESIGN.md`](./DESIGN.md) · [`README.md`](./README.md)

> Generated index for navigation. Excludes `node_modules/`, `.next/`, `.open-next/`, `.mastra/output/`, and other build artifacts.

---

## Top level

| Path | Purpose |
|------|---------|
| [`src/`](./src/) | Application source (App Router, components, lib, Mastra) |
| [`public/`](./public/) | Static assets + `public/_headers` (CF static cache) |
| [`scripts/`](./scripts/) | Dev infra helpers (CopilotKit env) |
| [`fixtures/`](./fixtures/) | Dev/test fixture JSON |
| [`wrangler.jsonc`](./wrangler.jsonc) | Cloudflare Worker config (OpenNext output) |
| [`open-next.config.ts`](./open-next.config.ts) | OpenNext Cloudflare adapter config |
| [`index.md`](./index.md) | This file |
| `package.json` | Scripts: `dev`, `build`, `preview`, `deploy`, `lint`, `test` |
| `next.config.ts` | Next.js + `initOpenNextCloudflareForDev()` |
| `vitest.config.ts` | Unit/integration tests |
| `tsconfig.json` | TypeScript project |
| `eslint.config.mjs` | ESLint |
| `components.json` | shadcn/ui registry |
| `.env.example` | Env template (copy → `.env.local`) |
| `.dev.vars` | Wrangler local secrets stub (gitignored; use `.dev.vars.example` if added) |

---

## Cloudflare / OpenNext (CF-MIG-110)

Installed via `wrangler setup` + `@opennextjs/cloudflare migrate` (2026-07-08).

| File / script | Role |
|---------------|------|
| `wrangler.jsonc` | Worker name `ipix-operator`, `main: .open-next/worker.js`, assets + images bindings, `nodejs_compat` |
| `open-next.config.ts` | `defineCloudflareConfig()` — R2 cache optional (not enabled yet) |
| `npm run preview` | `opennextjs-cloudflare build && preview` — **workerd** smoke (not `next dev`) |
| `npm run deploy` | Build + deploy to Cloudflare Workers |
| `npm run upload` | Build + upload only |
| `npm run cf-typegen` | Generate `cloudflare-env.d.ts` from wrangler bindings |
| `public/_headers` | Long-cache headers for `/_next/static/*` |
| `next.config.ts` | Appends `initOpenNextCloudflareForDev()` for local CF dev integration |

**Packages:** `@opennextjs/cloudflare@^1.20.1`, `wrangler@^4.107.1` (dev)

**Still open (CF-MIG-210+):** `hono/vercel` → `hono/cloudflare-workers`, groq JSON bundling, OAuth `*.workers.dev`, full preview smoke.

**Separate worker:** [`../services/cloudflare-worker/`](../services/cloudflare-worker/) — AI Gateway (not this Next bundle).

---

## `src/` layout

```
src/
├── app/           # Next.js App Router (pages + API routes)
├── components/    # React UI by product domain
├── context/       # React context providers
├── lib/           # Server/client utilities & data access
├── mastra/        # AI agents, tools, workflows, storage
├── styles/        # Design tokens + CSS rules
├── test/          # Cross-cutting tests + fixtures
├── types/         # Generated + ambient types
├── middleware.ts  # Auth gate + Supabase session refresh (Edge — Vercel + OpenNext)
└── graphify-out/  # Code graph snapshots (generated)
```

---

## App Router — `src/app/`

### Route groups

| Group | URL prefix | Layout | Role |
|-------|------------|--------|------|
| `(marketing)/` | `/`, `/login`, `/services/*` | `marketing/layout.tsx` | Public marketing site |
| `(operator)/` | `/app/*` | `operator/layout.tsx` | Authenticated operator shell |
| `auth/` | `/auth/callback` | — | Supabase OAuth callback |

### Operator pages — `(operator)/app/`

| Route | File |
|-------|------|
| `/app` | `app/page.tsx` — Command Center (D0) |
| `/app/onboarding` | `app/onboarding/page.tsx` |
| `/app/brand` | `app/brand/page.tsx` — Brand list |
| `/app/brand/[id]` | `app/brand/[id]/page.tsx` — Brand Hub detail |
| `/app/assets` | `app/assets/page.tsx` |
| `/app/shoots` | `app/shoots/page.tsx` |
| `/app/shoots/new` | `app/shoots/new/page.tsx` |
| `/app/shoots/[shootId]` | `app/shoots/[shootId]/page.tsx` |
| `/app/campaigns` | `app/campaigns/page.tsx` |
| `/app/matching` | `app/matching/page.tsx` |
| `/app/preview` | `app/preview/page.tsx` |
| `/app/crm` | `app/crm/page.tsx` |
| `/app/crm/contacts` | `app/crm/contacts/page.tsx` |
| `/app/crm/contacts/[id]` | `app/crm/contacts/[id]/page.tsx` |
| `/app/crm/companies` | `app/crm/companies/page.tsx` |
| `/app/crm/companies/[id]` | `app/crm/companies/[id]/page.tsx` |
| `/app/crm/pipeline` | `app/crm/pipeline/page.tsx` |
| `/app/crm/pipeline/[id]` | `app/crm/pipeline/[id]/page.tsx` |

### Marketing pages — `(marketing)/`

| Route | File |
|-------|------|
| `/` | `page.tsx` |
| `/login` | `login/page.tsx` |
| `/services/fashion-photography` | `services/fashion-photography/page.tsx` |
| `/services/ecommerce-photography` | `services/ecommerce-photography/page.tsx` |
| `/services/clothing` | `services/clothing/page.tsx` |
| `/services/jewellery` | `services/jewellery/page.tsx` |
| `/services/amazon` | `services/amazon/page.tsx` |
| `/services/shopify` | `services/shopify/page.tsx` |
| `/services/instagram` | `services/instagram/page.tsx` |
| `/services/video` | `services/video/page.tsx` |
| `/services/location` | `services/location/page.tsx` |

### Shared app files

| File | Role |
|------|------|
| `layout.tsx` | Root layout, fonts, providers |
| `globals.css` | Global styles |
| `not-found.tsx` | 404 |

---

## API routes — `src/app/api/`

| Method path | File | Notes |
|-------------|------|-------|
| `/api/copilotkit/*` | `copilotkit/[[...slug]]/route.ts` | CopilotKit AG-UI SSE · Mastra agents |
| `/api/marketing-chat/*` | `marketing-chat/[[...slug]]/route.ts` | Public marketing agent |
| `/api/marketing-lead` | `marketing-lead/route.ts` | Lead capture |
| `/api/workflows/brand-intelligence/start` | `workflows/brand-intelligence/start/route.ts` | BI workflow start |
| `/api/workflows/brand-intelligence/resume` | `workflows/brand-intelligence/resume/route.ts` | BI HITL resume |
| `/api/workflows/brand-intelligence/approve` | `workflows/brand-intelligence/approve/route.ts` | BI approval |
| `/api/workflows/shoot-wizard` | `workflows/shoot-wizard/route.ts` | Shoot wizard workflow |
| `/api/workflows/resume` | `workflows/resume/route.ts` | Generic workflow resume |
| `/api/brands` | `brands/route.ts` | Brand CRUD list/create |
| `/api/brands/[id]` | `brands/[id]/route.ts` | Brand by id |
| `/api/brands/[id]/assets` | `brands/[id]/assets/route.ts` | Brand assets |
| `/api/assets` | `assets/route.ts` | Asset operations |
| `/api/assets/upload-sign` | `assets/upload-sign/route.ts` | Cloudinary signed upload |
| `/api/assets/cloudinary/webhook` | `assets/cloudinary/webhook/route.ts` | DNA webhook (`after()`) |
| `/api/shoots/commit` | `shoots/commit/route.ts` | Commit shoot draft RPC |
| `/api/shoots/[shootId]` | `shoots/[shootId]/route.ts` | Shoot detail API |
| `/api/shoots/suggest-brief` | `shoots/suggest-brief/route.ts` | AI brief suggestion |
| `/api/bookings` | `bookings/route.ts` | Booking requests |
| `/api/bookings/[id]` | `bookings/[id]/route.ts` | Booking detail |
| `/api/bookings/[id]/approve` | `bookings/[id]/approve/route.ts` | Booking approval |
| `/api/intelligence/panel` | `intelligence/panel/route.ts` | Intelligence panel data |
| `/api/notifications` | `notifications/route.ts` | Notifications feed |
| `/api/notifications/read` | `notifications/read/route.ts` | Mark read |
| `/api/org/current` | `org/current/route.ts` | Current org context |
| `/api/media/specs` | `media/specs/route.ts` | Channel/media specs |
| `/api/_lib/` | Shared route helpers | `supabase-admin`, Cloudinary sign, draft approval |

### Auth

| Path | File |
|------|------|
| `/auth/callback` | `auth/callback/route.ts` |

---

## Components — `src/components/`

| Folder | Files | Domain |
|--------|------:|--------|
| [`brand-hub/`](./src/components/brand-hub/) | 24 | Brand list, detail, intake, scores, approval |
| [`marketing/`](./src/components/marketing/) | 22 | Public site sections, chat, lead forms |
| [`ui/`](./src/components/ui/) | 20 | shadcn primitives (button, card, dialog, …) |
| [`intelligence-panel/`](./src/components/intelligence-panel/) | 19 | Route-aware intel sidebar, approvals, scores |
| [`crm/`](./src/components/crm/) | 16 | Contacts, companies, pipeline workspaces |
| [`shoot/`](./src/components/shoot/) | 12 | Shoot list, detail tabs, wizard UI |
| [`command-center/`](./src/components/command-center/) | 11 | D0 home, KPIs, recent work, greetings |
| [`operator-panel/`](./src/components/operator-panel/) | 8 | Shell, Copilot dock, layout chrome |
| [`matching/`](./src/components/matching/) | 5 | Talent/model matching UI |
| [`threads-drawer/`](./src/components/threads-drawer/) | 4 | CopilotKit thread history |
| [`evidence-block/`](./src/components/evidence-block/) | 4 | Brand evidence display |
| [`media/`](./src/components/media/) | 3 | Platform icons, media helpers |
| [`brand-context-panel/`](./src/components/brand-context-panel/) | 1 | Active brand context strip |
| [`copilot/`](./src/components/copilot/) | 1 | Copilot-specific wrappers |

Also: [`theme-provider.tsx`](./src/components/theme-provider.tsx)

---

## Libraries — `src/lib/`

| Folder | Role |
|--------|------|
| [`ai/`](./src/lib/ai/) | `resolveModel()`, Gemini/Groq provider abstraction |
| [`supabase/`](./src/lib/supabase/) | Browser/server clients, session helpers |
| [`intelligence/`](./src/lib/intelligence/) | Panel contract, route suggestions, panel data builders |
| [`command-center/`](./src/lib/command-center/) | D0 queries, greeting, recent work |
| [`brand/`](./src/lib/brand/) | Draft promote/discard, social discovery persist |
| [`brand-hub/`](./src/lib/brand-hub/) | Crawl progress formatting |
| [`crm/`](./src/lib/crm/) | CRM queries, search, detail loaders |
| [`shoot/`](./src/lib/shoot/) | Shoot detail, commit draft, RPC errors |
| [`booking/`](./src/lib/booking/) | Booking service + validation |
| [`cloudinary/`](./src/lib/cloudinary/) | URL transforms |
| [`media/`](./src/lib/media/) | Channel specs (server + shared) |
| [`notifications/`](./src/lib/notifications/) | Notification service |
| [`talent/`](./src/lib/talent/) | Match scoring |
| [`active-brand/`](./src/lib/active-brand/) | Hero brand sync for command center |
| [`api/`](./src/lib/api/) | Error envelope helpers |

Root lib modules: `auth.ts`, `operator-gate.ts`, `route-agent-map.ts`, `onboarding.ts`, `site.ts`, `utils.ts`, `types.ts`, `copilot-debug.ts`, `request-token.ts`, …

---

## Mastra — `src/mastra/`

| Path | Role |
|------|------|
| [`index.ts`](./src/mastra/index.ts) | Registry proxy · `getMastra()` |
| [`storage.ts`](./src/mastra/storage.ts) | `PostgresStore` via `DATABASE_URL` |
| [`models.ts`](./src/mastra/models.ts) | Default Gemini model ids |
| [`memory.ts`](./src/mastra/memory.ts) | Agent memory config |
| [`agent-workflows.ts`](./src/mastra/agent-workflows.ts) | Agent ↔ workflow bindings |

### Agents — `src/mastra/agents/`

| File | Agent |
|------|-------|
| `index.ts` | Registry + `REQUIRED_AGENT_IDS` guard |
| `brand-intelligence-agent.ts` | Brand analysis |
| `booking-agent.ts` | Booking / quotes |
| `crm-assistant-agent.ts` | CRM copilot |
| `model-match-agent.ts` | Talent matching |
| `public-marketing-agent.ts` | Marketing site chat |
| `visual-identity.ts` | Visual identity |
| `social-discovery.ts` | Social discovery |

### Workflows — `src/mastra/workflows/`

| File | Workflow |
|------|----------|
| `brand-intelligence-workflow.ts` | Brand intake HITL |
| `shoot-wizard.ts` | Shoot planning wizard |

### Tools — `src/mastra/tools/`

| Area | Files |
|------|-------|
| Brand / BI | `brand-intelligence-tools.ts`, `social-discovery.ts`, `edge.ts` |
| Shoot | `generateShotListDraft.ts`, `saveApprovedShootDraft.ts`, `suggestShootBrief.ts`, `planDeliverables.ts`, … |
| CRM | `crm/` — search, log activity, move deal stage |
| Booking | `booking-tools.ts` |
| Media | `lookupChannelSpecs.ts`, `lookupShotReferences.ts` |

---

## Context & types

| Path | Role |
|------|------|
| [`src/context/active-brand-context.tsx`](./src/context/active-brand-context.tsx) | Selected brand for operator UI |
| [`src/context/intelligence-detail-context.tsx`](./src/context/intelligence-detail-context.tsx) | Intel panel detail state |
| [`src/types/supabase.ts`](./src/types/supabase.ts) | Generated DB types |
| [`src/middleware.ts`](./src/middleware.ts) | Operator auth gate + Supabase session refresh (Edge — Vercel + OpenNext) |

---

## Tests — `src/test/` + colocated `*.test.ts`

| Area | Location |
|------|----------|
| Integration / contract | `src/test/*.test.ts` |
| API routes | `src/app/api/**/*.test.ts` |
| Components | `src/components/**/*.test.tsx` |
| Lib | `src/lib/**/*.test.ts` |
| Mastra | `src/mastra/**/*.test.ts` |

Run: `npm test` · `npm run typecheck` · `npm run lint`

---

## Static assets — `public/`

| Path | Contents |
|------|----------|
| `public/images/` | Marketing hero, portfolio, service page photography (~50 JPG/PNG/WebP) |
| `public/*.svg` | Icons (next, vercel, globe, …) |

---

## Scripts — `scripts/`

| File | Role |
|------|------|
| `copilotkit-dev-infra.mjs` | Pre-dev CopilotKit project setup |
| `copilotkit-dev-env.mjs` | Env validation for dev |
| `*.test.mjs` | Script unit tests |

---

## Generated / local-only (do not edit)

| Path | Notes |
|------|-------|
| `.next/` | Next.js build output |
| `.open-next/` | OpenNext Cloudflare build output (worker + assets) |
| `.wrangler/` | Wrangler local state |
| `.dev.vars` | Wrangler local secrets (gitignored) |
| `.mastra/output/` | Mastra dev bundler output |
| `src/graphify-out/` | Graphify code graph |
| `.vercel/` | Vercel project metadata |
| `tsconfig.tsbuildinfo` | TS incremental cache |
| `.env`, `.env.local` | Secrets — never commit |

---

## Related repo paths

| Path | Relation |
|------|----------|
| [`../supabase/`](../supabase/) | Migrations, edge functions, RLS |
| [`../config/groq-models.json`](../config/groq-models.json) | Groq tier registry (read at build/runtime) |
| [`../services/cloudflare-worker/`](../services/cloudflare-worker/) | AI Gateway Worker (separate deploy) |
| [`../tasks/cloudflare/migration/plan-migrate.md`](../tasks/cloudflare/migration/plan-migrate.md) | Vercel → Cloudflare migration plan |
| [`../tasks/cloudflare/migration/startup.md`](../tasks/cloudflare/migration/startup.md) | Post-install status + next steps |

---

## Quick commands

```bash
cd app
npm run dev          # UI :3002 + mastra dev (Node — daily dev)
npm run build        # Next production build (Vercel CI path)
npm run preview      # OpenNext + wrangler dev (Cloudflare workerd)
npm run deploy       # OpenNext build + deploy to Workers
npm run cf-typegen   # Wrangler binding types
npm run lint && npm test && npm run typecheck
```
