# Repo Ground Truth — iPix / FashionOS

Pure code-grounded snapshot of `/home/sk/ipix/app` as of 2026-07-09. No planning/architecture docs were read to produce this — every claim below cites a real file path. Where something wasn't found, it says "not found."

Note: `graphify` is listed as a skill/MCP capability in this environment but has no CLI binary (`graphify: command not found`). All findings below come from direct `find`/`grep`/`Read` against the working tree.

---

## 1. Top-level structure

`app/src/app/` route groups (2 levels deep):

- `app/src/app/api/` — API routes (see §11 list)
- `app/src/app/api/_lib/` — shared API helpers (e.g. `cloudinary-signed-url.ts`)
- `app/src/app/auth/` — `app/src/app/auth/callback/` (OAuth callback, see §11)
- `app/src/app/(marketing)/` — public marketing site: `login/`, `services/` (with `amazon/`, `clothing/`, `ecommerce-photography/`, `fashion-photography/`, `instagram/`, `jewellery/`, `location/`, `shopify/`, `video/` sub-pages)
- `app/src/app/(operator)/` — operator product: `app/(operator)/app/` containing `assets/`, `brand/[id]/`, `campaigns/`, `crm/` (`companies/[id]`, `contacts/[id]`, `pipeline/[id]`), `matching/`, `onboarding/`, `preview/`, `shoots/` (`new/`, `[shootId]/`)

`app/src/lib/` subdirectories: `active-brand/`, `ai/`, `api/`, `booking/`, `brand/`, `brand-hub/`, `cloudinary/`, `command-center/`, `copilotkit/`, `crm/`, `intelligence/`, `media/`, `notifications/`, `planner/`, `shoot/`, `supabase/`, `talent/` (plus loose files like `brand-utils.ts`, `brand-scores.ts`, `safe-redirect.ts`, `notifications/validation.ts`).

`app/src/mastra/` — see §7 for full breakdown (agents/, tools/, workflows/, prompts/, types/, public/, plus `index.ts`, `durable.ts`, `memory.ts`, `models.ts`, `storage.ts`, `agent-workflows.ts`).

`app/src/components/` subdirectories: `brand-context-panel/`, `brand-hub/`, `command-center/`, `copilot/`, `crm/`, `evidence-block/`, `intelligence-panel/`, `marketing/`, `matching/`, `media/`, `operator-panel/`, `shoot/` (with `hitl/`, `shoot-detail-tabs/`), `threads-drawer/`, `ui/`.

---

## 2. Feature modules

| Feature | Route | lib | Notes |
|---|---|---|---|
| CRM | `app/src/app/(operator)/app/crm/` (companies, contacts, pipeline + `[id]` details) | `app/src/lib/crm/` | Components: `app/src/components/crm/` (crm-detail-shell.tsx, crm-list-workspace.tsx, crm-avatar.tsx, crm-screen-gate.tsx). Agent: `app/src/mastra/agents/crm-assistant-agent.ts`. Tools: `app/src/mastra/tools/crm/`. API: no dedicated `/api/crm` route found — CRM appears to be data-fetched client/server-side, not via a REST route. |
| Booking | `app/src/app/api/bookings/` (`route.ts`, `[id]/route.ts`, `[id]/approve/route.ts`) | `app/src/lib/booking/booking-service.ts` | Agent: `app/src/mastra/agents/booking-agent.ts`. Tools: `app/src/mastra/tools/booking-tools.ts`. No dedicated `app/(operator)/app/booking` page route found (booking lives inside shoot wizard flow). |
| Shoot | `app/src/app/(operator)/app/shoots/` (`new/`, `[shootId]/`) + `app/src/app/api/shoots/` (`commit/`, `[shootId]/`, `suggest-brief/`) | `app/src/lib/shoot/` | Components: `app/src/components/shoot/` (ShootCard.tsx, shoots-list-workspace.tsx, shoot-wizard-context.tsx, shoot-detail-workspace.tsx, shoot-detail-tabs/). Workflow: `app/src/mastra/workflows/shoot-wizard.ts`. |
| Brand | `app/src/app/(operator)/app/brand/[id]/` | `app/src/lib/brand/`, `app/src/lib/brand-hub/`, `app/src/lib/active-brand/`, plus loose `brand-list-filters.ts`, `brand-scores.ts`, `brand-utils.ts`, `brand-detail-greeting.ts` | API: `app/src/app/api/brands/route.ts`, `app/src/app/api/brands/[id]/route.ts`, `app/src/app/api/brands/[id]/assets/route.ts`. Context: `app/src/context/active-brand-context.tsx`. |
| Campaign | `app/src/app/(operator)/app/campaigns/` | not found as dedicated `lib/campaign` module | Migration exists: `supabase/migrations/20260707100000_ipi268_campaigns_schema.sql`. No `app/src/lib/campaign*` file found; no `/api/campaigns` route found. |
| Planner | not found as a route (`app/(operator)/app/planner` does not exist) | `app/src/lib/planner/` (untracked, `??` in git status) | Migration: `supabase/migrations/20260709000000_planner_schema_rls.sql` (also untracked in git). No route or component directory found yet — lib-only, in-progress. |
| Assets | `app/src/app/(operator)/app/assets/` + `app/src/app/api/assets/` (`route.ts`, `upload-sign/route.ts`, `cloudinary/webhook/route.ts`) | `app/src/lib/shoot/get-brand-assets.ts` | Components: `app/src/components/shoot/shoot-detail-tabs/assets-tab.tsx`. |
| Intelligence | not found as its own `app/(operator)/app/intelligence` route | `app/src/lib/intelligence/` | API: `app/src/app/api/intelligence/panel/route.ts`, `app/src/app/api/workflows/brand-intelligence/{start,approve,resume}/route.ts`. Agent: `app/src/mastra/agents/brand-intelligence-agent.ts`. Workflow: `app/src/mastra/workflows/brand-intelligence-workflow.ts`. Components: `app/src/components/intelligence-panel/`. Surfaced inline (panel), not a standalone page. |
| Notifications | not found as its own page route | `app/src/lib/notifications/notification-service.ts`, `app/src/lib/notifications/validation.ts` | API: `app/src/app/api/notifications/route.ts`, `app/src/app/api/notifications/read/route.ts`. |

---

## 3. Supabase integration

- Client creation:
  - Browser: `app/src/lib/supabase/client.ts:1` (`import { createBrowserClient } from "@supabase/ssr"`), used at `client.ts:16`.
  - Server: `app/src/lib/supabase/server.ts:1` / `:14` (`createServerClient`).
  - Session helper: `app/src/lib/supabase/session.ts:1` / `:30` (`createServerClient`, used in auth callback cookie plumbing).
- RLS-related code (non-test) found via grep for `RLS`/`row level security`/`create policy`: `app/src/mastra/tools/edge.ts`, `app/src/mastra/tools/social-discovery.ts`, `app/src/mastra/tools/index.ts`, `app/src/mastra/tools/lookupShotReferences.ts`, `app/src/app/api/assets/upload-sign/route.ts`, `app/src/app/api/shoots/suggest-brief/route.ts`, `app/src/lib/safe-redirect.ts`, `app/src/app/api/marketing-chat/[[...slug]]/route.ts`, `app/src/lib/notifications/validation.ts`, `app/src/app/api/_lib/cloudinary-signed-url.ts` (comment references, not a dedicated RLS module).
  - Root-level RLS scripts: `scripts/verify-rls.mjs`, `scripts/test-notification-reads-rls.sql`, `scripts/test-booking-rls-bypass.sql`.
- `supabase/migrations/`: **157 files**. Most recent 5 by filename (timestamp-sorted):
  1. `20260704120000_crm_fk_cascade_indexes.sql`
  2. `20260704150000_check_talent_availability_rpc.sql`
  3. `20260707100000_ipi268_campaigns_schema.sql`
  4. `20260707105444_get_shoot_detail_asset_resource_type.sql`
  5. `20260709000000_planner_schema_rls.sql` (untracked — `?? supabase/migrations/20260709000000_planner_schema_rls.sql` in git status)
- `supabase/functions/` (edge functions): `audit-asset-dna`, `brand-intelligence`, `capture-lead`, `edge-test`, `firecrawl-webhook`, `health`, `start-brand-crawl`, plus shared code in `_shared/`.

---

## 4. Cloudinary integration

Files referencing `cloudinary` (case-insensitive, non-test):

- `app/src/app/api/assets/cloudinary/webhook/route.ts`
- `app/src/app/api/assets/upload-sign/route.ts`
- `app/src/app/api/brands/[id]/assets/route.ts`
- `app/src/app/api/_lib/cloudinary-signed-url.ts`
- `app/src/app/api/media/specs/route.ts`
- `app/src/components/brand-context-panel/brand-context-panel.tsx`
- `app/src/components/media/channel-preview-studio.tsx`
- `app/src/components/shoot/ShootCard.tsx`
- `app/src/components/shoot/shoot-detail-tabs/assets-tab.tsx`
- `app/src/components/shoot/shoot-detail-tabs/overview-tab.tsx`
- `app/src/components/shoot/shoot-detail-workspace.tsx`
- `app/src/lib/cloudinary/url.ts` (dedicated URL-builder module)
- `app/src/lib/command-center/sample-images.ts`
- `app/src/lib/intelligence/dev-panel-fixture.ts`, `app/src/lib/intelligence/panel-approval-fallbacks.ts`
- `app/src/lib/shoot/get-shoot-detail.ts`
- `app/src/mastra/agents/visual-identity.ts`
- `app/src/types/supabase.ts` (generated type reference)

---

## 5. Stripe integration

**Not found — no Stripe integration exists in this repo today.** The only hits for `stripe` (case-insensitive) anywhere under `app/src` and `supabase/` are two migration filenames that merely contain the word "payments" in a different context, and are unrelated to Stripe itself:
- `supabase/migrations/20251129061747_create_shoot_payments_table_service_booking_fixed_20250128.sql`
- `supabase/migrations/20250125000003_create_ticket_system.sql`

No `stripe` npm package, no `STRIPE_*` env var, no `stripe.ts`/`stripe/` module found anywhere in `app/src`.

---

## 6. CopilotKit integration

`app/src/app/api/copilotkit/[[...slug]]/route.ts` — read in full. Current runtime adapter:

```ts
import { handle } from "hono/vercel";
```
(line 13)

It builds a `CopilotRuntime` (`@copilotkit/runtime/v2`) with an `InMemoryAgentRunner`, wraps it via `createCopilotEndpoint`, and calls `handle(app)` from **`hono/vercel`** (not `hono/cloudflare-workers`) to produce the Next.js route handler (`GET`/`POST`/`PATCH`/`DELETE` all point to the same `handler`). Auth is enforced via `withOperatorAuth` before entering the CopilotKit endpoint, using `AsyncLocalStorage` to propagate the resolved operator identity (comment cites "C3 fix v2 — 2026-06-24").

---

## 7. Mastra

- `app/src/mastra/index.ts` — `getMastra()` builds the `Mastra` instance with:
  - `agents` map (line 16-24): `...durableAgents`, `"visual-identity"`, `"social-discovery"`, `"brand-intelligence"`, `"model-match"`, `"crm-assistant"`, `"booking"`.
  - `REQUIRED_AGENT_IDS` guard (line 26-30): `"default"`, `"production-planner"`, `"creative-director"` — throws if missing.
  - `workflows`: `"shoot-wizard"`, `"brand-intelligence"`.
  - Exports a `Proxy`-wrapped `mastra` (named export) for `mastra dev` CLI compatibility (ponytail comment at line 60-62).
- `app/src/mastra/agents/index.ts` — defines (via `grep "id:"`): `productionPlannerAgent` (line 24, `id: "production-planner"`), `creativeDirectorAgent` (line 62, `id: "creative-director"`). Also re-exports `visualIdentityAgent`, `socialDiscoveryAgent`, `modelMatchAgent`, `bookingAgent` from sibling files (`visual-identity.ts`, `social-discovery.ts`, `model-match-agent.ts`, `booking-agent.ts`).
- `app/src/mastra/agents/` full file list: `booking-agent.ts` (+ `.snapshot.test.ts`), `brand-intelligence-agent.ts`, `crm-assistant-agent.ts` (+ `.test.ts`), `index.ts` (+ `.test.ts`), `model-match-agent.ts`, `public-marketing-agent.ts` (+ `.test.ts`), `social-discovery.ts`, `visual-identity.ts` (+ `.test.ts`).
- `app/src/mastra/durable.ts` — wraps `productionPlannerAgent`/`creativeDirectorAgent` via `createDurableAgent` from `@mastra/core/agent/durable`; exports `durableAgents = { default: durablePlanner, "production-planner": durablePlanner, "creative-director": durableCreativeDirector }` (lines 39-43).
- **No `registry.ts` file exists** — only `app/src/mastra/registry.test.ts` was found (a test file with no corresponding source module in `app/src/mastra/`).
- `app/src/mastra/tools/index.ts` registers `agentTools` (const object, ~20 entries) pulled from: `recommendShootType`, `planDeliverables`, `lookupShotReferences`, `lookupChannelSpecs`, `generateShotListDraft`, `saveApprovedShootDraft`, `approveShotList`, `estimateShootBudget`, `explainShootDnaAlerts`, `discoverSocialChannels`, `searchTalentByFilters`, `computeTalentMatchScore`, `manageShortlist`, `searchCompanies`, `searchContacts`, `logActivity`, `moveDealStage`, `checkTalentAvailability`, `draftBookingQuote`, `createBookingDraft`. Also re-exports `callEdgeFunction`, `EdgeFunctionError` from `./edge`.
  - Tool source files present: `approveShotList.ts`, `booking-tools.ts` (+test), `brand-intelligence-tools.ts` (+test), `crm/` (dir), `edge.ts` (+test), `estimateShootBudget.ts`, `explainShootDnaAlerts.ts`, `generateShotListDraft.ts`, `lookupChannelSpecs.ts` (+test), `lookupShotReferences.ts`, `planDeliverables.ts`, `recommendShootType.ts`, `saveApprovedShootDraft.ts`, `social-discovery.ts` (+test), `suggestShootBrief.ts`, `talent-match-tools.ts`.

---

## 8. AI provider layer

`app/src/lib/ai/` contains exactly 4 files: `gemini-registry.ts`, `provider.ts`, `provider.test.ts`, `types.ts`.

- **`model-registry.ts` does NOT exist** in `app/src/lib/ai/`. (A file of that name — `services/cloudflare-worker/src/model-registry.ts` — exists in the separate Cloudflare-worker service, see §9, but not in the Next.js app's AI lib.)
- **`AI_GATEWAY_URL`**: no references found anywhere in `app/src/lib/ai/` or `app/src/mastra/` (`grep -rn "AI_GATEWAY_URL"` returned nothing).
- **`readFileSync` usage** — `app/src/lib/ai/provider.ts:1`:
  ```ts
  import { existsSync, readFileSync } from "node:fs";
  ```
  Used inside `loadGroqModelsConfig()` (line 45-56): `return JSON.parse(readFileSync(path, "utf8")) as GroqModelsConfig;` (line 48). This is **not** called at module top level — it's lazily invoked and memoized via `getGroqModelsConfig()` (line 70-75), with an explicit comment: `/** Lazy — avoid top-level readFileSync (breaks Cloudflare Workers when AI_PROVIDER=gemini). */` (line 69). The path is resolved by walking up from the module's own directory looking for `config/groq-models.json` (function `findGroqModelsConfigPath`, lines 24-36) rather than a hardcoded relative path — comment explains this was fixed because Mastra's bundled output sits at a different directory depth than the Next.js source (lines 14-23).
  - This still means `readFileSync`/`existsSync` from `node:fs` are imported and will be included in any Cloudflare Workers bundle; whether that's compatible depends on `nodejs_compat` (see §9 — `wrangler.jsonc` does set `"compatibility_flags": ["nodejs_compat"]`).

---

## 9. Cloudflare/OpenNext config

- **`app/wrangler.jsonc` exists on disk** (currently untracked in git — `?? app/wrangler.jsonc`). Contents (full file):
  ```jsonc
  {
    "$schema": "node_modules/wrangler/config-schema.json",
    "main": ".open-next/worker.js",
    "name": "ipix-operator",
    "compatibility_date": "2026-07-08",
    "compatibility_flags": ["nodejs_compat"],
    "assets": { "directory": ".open-next/assets", "binding": "ASSETS" },
    "services": [{ "binding": "WORKER_SELF_REFERENCE", "service": "ipix-operator" }],
    "images": { "binding": "IMAGES" },
    "observability": { "enabled": true },
    "alias": {
      "@ast-grep/napi": "./scripts/cf-ast-grep-stub.mjs",
      "@ast-grep/napi-linux-x64-gnu": "./scripts/cf-ast-grep-stub.mjs"
    }
  }
  ```
- **`app/open-next.config.ts` exists on disk** (also untracked — `?? app/open-next.config.ts`). It is the **default scaffold** generated by `@opennextjs/cloudflare` — `defineCloudflareConfig({})` with the R2 incremental-cache import commented out. Not yet customized.
- **`services/cloudflare-worker/` directory exists**, structure:
  - `src/index.ts`, `src/index.test.ts`
  - `src/router.ts`
  - `src/model-registry.ts`
  - `src/providers/provider.ts`, `src/providers/gemini.ts`, `src/providers/workers-ai.ts`
  - `wrangler.jsonc`, `worker-configuration.d.ts`, `package.json`, `package-lock.json`, `tsconfig.json`, `vitest.config.mts`, `.prettierrc`, `.editorconfig`, `.gitignore`, `AGENTS.md` (modified — `M services/cloudflare-worker/AGENTS.md` in git status), `.vscode/settings.json`
  - Only one test file found (`src/index.test.ts`) — no separate `tests/` directory.

---

## 10. CI/CD

`.github/workflows/ci.yml` — 4 job names:

1. `supabase-web015` — runs `npm run test:web015` (Docker-based RLS + `claim_lead_draft` tests), independent of the build job.
2. `app-build` — `working-directory: app`; steps: env-guard client-secret scan (`node scripts/check-client-env.mjs`), `npm ci`, `npm run lint`, `npm run build`, `npx tsc --noEmit`, `npm run test`.
3. `booking-gate-check` — probe job that sets `db_configured` output based on whether `secrets.DATABASE_URL` is set.
4. `booking-gate` — conditional on `booking-gate-check`, runs `npm run supabase:verify-booking-gate` against a real Supabase project (Node 22, installs `psql` client, installs root + app deps).

**No job runs an OpenNext or Wrangler build step.** No `wrangler` or `opennext`/`open-next` string appears anywhere in `ci.yml`.

---

## 11. Auth/middleware

OAuth callback handler: `app/src/app/auth/callback/route.ts`.

Host-trust logic (`isTrustedForwardedHost`, lines 15-28):

```ts
function isTrustedForwardedHost(forwardedHost: string, requestOrigin: string): boolean {
  const host = forwardedHost.toLowerCase();
  try {
    if (host === new URL(requestOrigin).host.toLowerCase()) return true;
  } catch {
    // ignore malformed request origin
  }
  try {
    if (host === new URL(SITE_URL).host.toLowerCase()) return true;
  } catch {
    // ignore malformed SITE_URL
  }
  return host.endsWith(".vercel.app");
}
```

It trusts, in order: (1) the request's own origin host, (2) the configured `SITE_URL` host (`app/src/lib/site.ts`), (3) any host ending in `.vercel.app`. **It does NOT trust `.workers.dev`** or any Cloudflare-specific host — there is no `.workers.dev` string anywhere in this file. In development (`NODE_ENV === "development"`) or when there's no forwarded host, it falls back to the request's own origin unconditionally (lines 35-37).

All API routes found under `app/src/app/api/` (for reference, from `find ... -name route.ts`):
`assets/cloudinary/webhook`, `assets`, `assets/upload-sign`, `bookings/[id]/approve`, `bookings/[id]`, `bookings`, `brands/[id]/assets`, `brands/[id]`, `brands`, `copilotkit/[[...slug]]`, `intelligence/panel`, `marketing-chat/[[...slug]]`, `marketing-lead`, `media/specs`, `notifications/read`, `notifications`, `org/current`, `shoots/commit`, `shoots/[shootId]`, `shoots/suggest-brief`, `workflows/brand-intelligence/approve`, `workflows/brand-intelligence/resume`, `workflows/brand-intelligence/start`, `workflows/resume`, `workflows/shoot-wizard`.

---

## 12. Git state

Current branch: `ipi/restore-universal-design-prompt` (up to date with `origin/ipi/restore-universal-design-prompt`).

`git status` summary: 603 changed paths total. Overwhelming majority (~500+) are inside `.claude/skills/cloudflare/references/**` (net-new Cloudflare skill reference docs being staged) and `.claude/skills/ipix-task-lifecycle/**` (modified). Outside `.claude/`, notable staged/unstaged/untracked changes include:

- Deleted: `Universal design prompt` (dir), most of `Universal-design-prompt-new/tasks/**` and `Universal-design-prompt-new/plan/**`, `config/groq-models.json`, `config/groq-models.schema.json`, `app/src/proxy.ts` / `app/src/proxy.test.ts`, `.cursor/rules/mercur.mdc`, `.cursor/skills/mercur`, `tasks/plan/todo.md`, several `tasks/cloudflare/*.md` files.
- Modified: `app/next.config.ts`, `app/package.json` / `package-lock.json`, `app/src/app/(operator)/layout.tsx`, `app/src/app/api/marketing-chat/[[...slug]]/route.ts` (+test), `app/src/lib/ai/provider.ts`, `app/src/middleware.test.ts`, `app/src/test/operator-middleware-contract.test.ts`, `scripts/verify-rls.mjs`, `services/cloudflare-worker/AGENTS.md`, `tasks/cloudflare/todo.md`, `tasks/diagrams/02-ai-provider-flow.md`.
- Untracked (`??`): `app/wrangler.jsonc`, `app/open-next.config.ts`, `app/src/middleware.ts`, `app/src/middleware-auth-gate.test.ts`, `app/src/lib/copilotkit/`, `app/src/lib/planner/`, `app/scripts/cf-ast-grep-stub.mjs`, `app/public/_headers`, `app/index.md`, `supabase/migrations/20260709000000_planner_schema_rls.sql`, `supabase/seed-planner-workflows.sql`, many new `linear/issues/IPI-*.md` files (including several `IPI-CF-MIG-*` and Mastra/Cloudflare-provider-related ones), `worktrees/`, `.infisical.json`, `skills-lock.json`.

This means: **`app/wrangler.jsonc`, `app/open-next.config.ts`, and `app/src/middleware.ts` all exist on disk right now but are not yet committed** — the Cloudflare/OpenNext migration scaffolding and a new root middleware are present in the working tree but untracked.

Recent commits (`git log --oneline -15`):
```
dedbe3da chore(design): un-ignore Universal design prompt in Claude index
84155521 chore(design): track Universal-design-prompt-new in git
ec0080b6 docs: restore tasks/cloudflare/prompts from ai/ipi-471 branch
ea45b848 fix(ipi-392): tap-to-copy on email/phone rows — unmet mobile/a11y AC
dd7d7964 fix(crm): roving tabindex + arrow-key nav for CrmDetailShell's tab strip
68b391ca feat(ipi-392): CRM Contact Detail page — RF-04b
3eff20bb refactor(crm): extract CrmDetailShell from CompanyDetailWorkspace (RF-04b)
77195ced fix(crm): normalize email/phone jsonb fields — real seed data is plain strings
00779cb2 chore: restore remaining cloudflare docs from context
4c439d86 chore: restore cloudflare docs and architecture diagrams after worktree cleanup
6eb689f9 docs: restore tasks/cloudflare from ai/ipi-471 branch
ac5b3477 chore: preserve worktree docs and audit artifacts
08b3f825 fix(ipi-390): search contacts by organization name too
64d53f43 fix(ipi-390): SCR-28 Contacts List — filter labels + skeleton row count parity
a03e0aed refactor(crm): use ComingSoonButton for the header New CTA too
```

`git branch -a` — 415 total branches (local + remote). First 30 (alphabetical from `git branch -a | head -30`):
```
  ai/aior-016-hide-internal-tool-calls
  ai/ipi-11-onboarding-wizard-brand-intake
  ai/ipi-135-aior-019-agent-memory-foundation
  ai/ipi-23-brand-intake-complete
  ai/ipi-471-agent-001-ai-agent-architecture
  ai/ipi2-113-shoot-pre-001-schema-decision
  ai/ipi2-117-shoot-core-schema
  ai/mi-03-device-preview
  aior/017-durable-agents
  aior/018-workflow-snapshots
  archive/pr9-storefront-test
  audit/copilotkit-init
  backup/pre-cleanup-feature
  backup/pre-cleanup-main
  ci/deepsource-exclude-app
+ claude/adoring-snyder-2de01d
  claude/kind-jackson-14fcfd
  claude/modest-borg-23ec23
  cursor/missing-test-coverage-3bb3
  cursor/missing-test-coverage-d46c
  docs/ai-native-p0-dashboard-sync
  docs/media-system
  docs/pr23-post-merge-verify
  feat/ipi-52-approval-cards
  fix/b01-wizard-copilotkit-provider
  fix/ipi-451-seed-422-orphan-auth-users
  (... truncated, 415 branches total)
```
