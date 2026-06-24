# iPix Changelog

All notable changes to the iPix monorepo. Newest first.

Format loosely follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [Unreleased]

### 2026-06-23 — Operator auth gate + public-chatbot schema (IPI2-127, IPI2-160 · WEB-015.1)

- **Auth foundation merged (IPI2-127 · PR #37 → `main` `f90cea7`):** Supabase-backed operator identity replaces the hardcoded `demo-user`. `resolveOperatorUser` validates the Supabase JWT server-side (Bearer + chunked `sb-*-auth-token` cookie); `withOperatorAuth` HTTP guard gates the CopilotKit runtime in **both** modes (intelligence + default SSE) — closing a CodeAnt-flagged unauthenticated-SSE bypass; `proxy.ts` `/app/*` page gate requires a JWT-shaped session cookie and preserves the redirect query. Flag-gated by `OPERATOR_AUTH_ENABLED` (default **off**). 27 tests.
- **Login wired to Supabase (IPI2-127 · PR #46, open):** real email/password auth via `@supabase/ssr` browser client; `safeRedirect()` open-redirect guard scoped to `/app*`; sign-up error neutralized (no account enumeration); email trimmed + lowercased; `router.refresh()` kept (revalidates server components post-login). First jsdom component tests in `app/` (login-form + client factory). 55 tests.
- **WEB-015 Phase 0 schema (IPI2-160 · PR #48, open):** migration `20260623000000_web015_chatbot_lead_drafts.sql` — `chatbot_conversations` / `chatbot_messages` / `chatbot_events` + `lead_intake_drafts` (uuid PKs so anon drafts are non-enumerable), **RLS default-deny**, and `claim_lead_draft()` `SECURITY DEFINER` + `search_path=''` single-use-token RPC. Ephemeral-Postgres harness proves 6 RLS/claim properties (anon-deny, user-ownership, wrong-token, expired, double-claim, safe search_path). Not yet pushed to the remote DB.
- **WEB-015 epic planned (IPI2-159 + 12 subissues):** architecture / journey / build-order mermaid diagrams, per-task order + steps + success-criteria + skills, and lo-fi wireframes for the chat widget + prefilled-intake hand-off.
- **Review hygiene:** absorbed the genuinely-unique tests from the Cursor auto-coverage PRs, then closed **11** duplicates (#34/35/36/38/40/41/42/43/44/45/47). The Cursor `missing-test-coverage` automation keeps regenerating these — recommend disabling/narrowing it.

### 2026-06-23 — Marketing site migrated Vite → Next.js (IPI2-135 · PLT-015 · WEB-001…014)

Branch `ipi/web-marketing-migration` — commit **`8fd25f0`** (131 files, +13,874/−32). Built new in `app/`; Vite `src/` left untouched as visual reference.

- **Route-group restructure (WEB-001):** root `layout.tsx` reduced to `html/body/fonts/metadata`; CopilotKit + OperatorPanel moved into an `(operator)` group and operator routes relocated `/`,`/brand`… → **`/app/*`** (clean `R100` renames). Marketing lives in a `(marketing)` group with header/footer only.
- **12 marketing routes ported** (server components, SSG): home (WEB-002) + 9 service pages — fashion, ecommerce, clothing, amazon, location, jewellery, instagram, video, shopify (WEB-003–011) + login (WEB-012, UI-only/stubbed auth/`noindex`) + custom 404 (WEB-013).
- **Interactive sub-components rebuilt** without framer-motion: `FashionPackages` (shoot-type price toggle), `EcommerceExtension` (Amazon slider + Creative-Temperature range), `ClothingSlider` (dark snap-scroll). framer-motion → `AnimatedSection` (IntersectionObserver); `next/image` throughout; shadcn `Slider` → native range input.
- **Design system** scoped to `.marketing` (Cormorant Garamond + Outfit + brand tokens via `marketing.css`) so the CopilotKit operator theme is untouched.
- **Canonical URL centralized** at `app/src/lib/site.ts` → **`fashionos.co`** (final domain, decided 2026-06-22); `metadataBase` drives all per-page OG image resolution.
- **Bug fixed (caught in 404 verification):** unlayered `.marketing a { color: inherit }` overrode Tailwind's `text-white` (cascade layers, not specificity) → every dark CTA `<Link>` rendered dark-on-dark. Fixed by moving the link reset into `@layer base`.
- **Cutover audit (WEB-014):** lint + tsc + build green (20 routes); 0 `ipix.co` refs; 0 real framer-motion imports; 0 operator components in marketing; `/` clean / `/app` keeps CopilotKit; all 9 nav links resolve. **Readiness 95/100.**
- **Not done (intentional):** Vite not removed; DNS cutover to fashionos.co, operator deploy + `/app/*` auth gate (IPI2-127), SEC-001 key rotation, and brand-name reconciliation (`ipix.` vs `fashionos.co` vs Lumina Studio) remain as production-cutover tasks.

### 2026-06-22 — Operator app foundation: vendored, verified, CI-gated (PRs #23–#26)

- **PR #23 merged** (`ede6747`) — vendored the Next.js operator app (`app/`); IPI2-121 (CopilotKit v2 + AG-UI runtime foundation) → **Done**.
  - Post-audit remediations (squashed in): restored typecheck gate (dropped `next.config.ts` `ignoreBuildErrors`, 2 targeted `@ts-expect-error` on `@mastra/memory` beta); a11y/type/error-handling batch; package → `ipix-operator`, dropped unused `@ai-sdk/openai`.
  - **Fixed runtime blocker** `useAgent: Agent 'default' not found after runtime sync` — registered `default` as a compatibility alias → `production-planner` + a `REQUIRED_AGENT_IDS` startup guard (build/lint/tsc could not catch it; found via live browser test).
- **PR #24 merged** (`70da546`) — PR #23 post-merge verification report + corrected `PR-23` checklist; `app/AGENTS.md` corrected to merged state + architecture/fix mermaid diagrams.
- **PR #25 merged** (`0546700`) — CI split: new `app-build` job (`npm ci → tsc → lint → build`); IPI2-124 (PLT-012) → **Done** (CI now validates both Vite root + Next `app/`).
- **PR #26 merged** — dev-loop hardening: Mastra **registry contract test** (`app/src/mastra/registry.test.ts` via vitest — the CI half of the `default`-agent guard), CI `concurrency` group + reordered `app-build` (lint→build→tsc→test), and `.gitattributes` (`eol=lf`) to end CRLF churn.
- **Testing standard** — rewrote IPI2-129 (TEST-001) for the real stack (npm not pnpm, `app/` commands, v2/guard/Gemini-registry specifics); added per-task **Tests & Verification** comments to 12 hard-gate + near-term issues.
- **Pre-PR reviews** (verified vs disk + MCP): IPI2-116 — `commit-approved-shoot` "transaction" needs a Postgres RPC (sequential `supabase-js` inserts aren't atomic); IPI2-127 — `identifyUser` exists only in Intelligence-mode runtime, so the default SSE path needs `beforeRequestMiddleware` for auth.
- **Dependency order encoded** in Linear: 81→(82+84)→83 critical path; 116 as parallel shoot track; 127 deferred (High→Medium). Filed DEVX-001…004 (IPI2-130–133): dev:clean+fixtures, root ESLint fix, npm audit triage, operator deploy target.
- **Restored** root `todo.md` (was tracked at `64a3624`, missing from the working tree).

### 2026-06-22 — IPI-* team execution (from audit)

- **Closed 8 issues** in IPix (IPI) team: AI-002, AI-003, AI-012, DASH-001, DASH-006, DASH-007, DASH-008, DASH-009 — all set to Canceled with merge-into-owner comments.
- **Merged 5 issues** (source closed, target notified): AI-004→AIOR-010, AI-005→AI-006, DASH-002→UI-001, DASH-003→UI-002, DASH-004→AIOR-002.
- **Updated** DNA-001 (IPI-19) Todo→Done — `audit-asset-dna` edge function shipped; spec created at `docs/linear/issues/IPI-19-DNA-001.md`.
- **Created AIOR-002a** (IPI-107) — Mastra-CopilotKit AG-UI Bridge (P1, child of AIOR-002), the #1 execution blocker for MVP.
- **Vendored `app/`** (Next.js sub-project: Mastra + CopilotKit runtime) in `0fb03fb` — 39 files, full safety audit passed (no secrets, no build artifacts, both root + app build green).
  - `app/src/mastra/agents/`, `app/src/mastra/tools/` — 2 agents, now git-tracked
  - `app/AGENTS.md` — created documenting structure
- **`docs/linear/notes-linear.md`** — corrected to Vite/Tailwind/npm (not Next.js/MUI/Refine/pnpm) with correction banner.
- **`docs/linear/audit/june-22-Intelligence-audit.md`** — appended §0b IPI-* execution log.

### 2026-06-22 — Linear intelligence backlog rationalization

- **Audit:** `docs/linear/audit/june-22-Intelligence-audit.md` (§0 execution log) + `docs/linear/june-22-audit-linear.md`.
- **Cancelled 18 issues** — duplicates & stale: old SHOOT-UX 108–112 (→ 114–118), DASH-009 (v1 `useCopilotReadable`), AI-005/006 (→ MATCH-001), AI-014/015 spikes, DNA-001 (→ AI-010), AI-002/003/012, DASH-001/006/007/008 (merged into AIOR/UI owners).
- **Merged** DNA-001 → AI-010 (IPI2-72) — single canonical Asset DNA issue; gained `proof-gate` label.
- **Created** AI-020 (Search grounding), MATCH-001 (pgvector matching), PLT-012 (vendor `app/` + CI split), PLT-013 (`app/` → Infisical), PLT-014 (stack decision: Tailwind/npm).
- **Label unification** — added `AI` to all `area:ai` + shoot/DASH issues; a single `label = AI` filter now returns the whole intelligence backlog.
- **Architecture re-align comments** on drifted DASH-*/AIOR-* issues (`/dashboard`→`/app`, v1 hooks→v2, MUI/Refine→Tailwind/shadcn).
- **Todo trimmed** toward 8 (foundation-first); see `todo.md` CURRENT section. Stack corrected: **Vite/Next + Tailwind + npm** (not MUI/Refine/pnpm).

### Added

- **`my-marketplace/`** — Fresh Mercur 2.0 project via `@mercurjs/cli` (IPIX-COM-001)
  - `packages/api/.env` with Postgres, Redis, Stripe test keys, CORS for storefront
  - Docker: `mercur-postgres` on **5433** (host 5432 in use), `mercur-redis` on 6379
  - DB migrate + default Mercur seed (regions, products, publishable API key)
  - Dev stack: API `:9000`, admin Vite `:7000/dashboard`, vendor Vite `:7001/seller`
- **`docs/ecommerce/plan/01-setup.md`** — Step-by-step Mercur + B2C storefront setup guide
- **`docs/ecommerce/`** — Commerce docs migrated from mdeapp (69 files: ADRs, tasks, evidence, PRD)
- **`docs/notes-ecom.md`** — Phase 1 migration discovery report (audit-only)
- **`todo.md`** — Master task list (iPix bootstrap + ECOM-C/M backlog)

### Changed

- Commerce documentation owner: **mdeapp → ipix** (`docs/ecommerce/`)
- `mdeapp/index.md` — Pointer to ipix commerce docs

### Verified

- `curl http://localhost:9000/health` → `OK`
- Store API regions with publishable key header
- Dashboard + seller routes return 200

### Known gaps

- Medusa logs `redisUrl not found` — using in-memory fake Redis until config wired (IPIX-COM-004)
- Root `my-marketplace/.env` not read by backend — secrets must live in `packages/api/.env`
- Admin account, seller registration, Stripe paid order — not completed on ipix yet
- B2C storefront not cloned to ipix yet (IPIX-COM-006)

---

## [2026-06-13] — Commerce migration prep

### Added

- Discovery audit: mdeapp Mercur backend ~95% Phase 1 vs ipix marketing-only baseline
- Recommended layout: `my-marketplace/` backend, optional `b2c-storefront/`, `docs/ecommerce/`

### Documentation

- Copied `mdeapp/docs/ecommerce/` → `ipix/docs/ecommerce/`
- Removed source tree from mdeapp after copy

---

## [2026-06-18] — IPI-900 forensic audit & execution update

**Auditor:** Codex  
**Method:** Forensic audit against current code, remote Supabase probes, local build/test/lint probes, local runtime probes, and checked-in planning docs.  

### Execution Update

Implemented and verified the P0/P1 recovery slice from `todo.md`.

- Lint now passes after scoping ESLint to app source/config and fixing root app lint errors.
- CI now includes `npm run lint`.
- Added and deployed `audit-asset-dna`; live remote invocation wrote `assets.dna_score`, `assets.dna_status`, `assets.dna_pillars`, and an `ai_agent_logs` row.
- Replaced Assets placeholder with list/empty/error/loading states, DNA badges, and audit actions.
- Replaced Products placeholder with `commerce_product_links` create/list/delete UI and duplicate validation.
- Expanded RLS verification for commerce link delete denial and asset DNA update isolation.
- Re-proved local Mercur API with Postgres/Redis, migrations, base seed, checkout prep, and iPix catalog seed.
- Re-proved B2C `/de` and cart route on `localhost:3006`.
- Completed a Stripe test payment and Mercur order proof: PaymentIntent `pi_3TjkqoFAkFMiToA125qC3br3`, order `order_01KVE0GB93WV9SR3S26BYQEWXY`, payment collection `completed`.
- Added evidence under `docs/evidence/`.

Remaining known gaps:

- Mercur `/dashboard` and `/seller` still return `Dashboard not built`.
- Product link hydrate from Mercur title/handle/thumbnail is not implemented.
- `npm run supabase:migrations` is blocked by `SUPABASE_DB_PASSWORD` auth.
- No production deploy, monitoring, or Playwright screenshot proof was added.

## Current State Summary

iPix is a working Vite/React marketing site plus an authenticated operator dashboard foundation. The strongest verified product slice is **Brand Intelligence with human approval**: an authenticated operator can submit a URL, the Supabase Edge Function creates a pending draft via Gemini, the UI previews the draft, and approval commits `brands` plus four `brand_scores`.

Supabase is the most mature backend layer. Remote schema, RLS, edge health, edge auth smoke, and HITL Brand Intelligence all passed verification on 2026-06-18. The database includes `brands`, `brand_scores`, `brand_intake_drafts`, `commerce_product_links`, `ai_agent_logs`, and DNA columns on `assets`.

Commerce is present as code and is now partially live-verified locally. `my-marketplace/` and `b2c-storefront/` exist; Mercur was run with temporary local Postgres/Redis, migrations, base seed, checkout prep, and the 10-product iPix catalog. The API health, Store API, B2C `/de`, B2C cart, Stripe test PaymentIntent, Mercur order row, and payment row were verified. Mercur admin/vendor dashboard assets still return `Dashboard not built`, so commerce is improved but not fully launch-ready.

The project is not production-ready. Build/test/env/lint checks pass and local commerce/Stripe/DNA/product-link proofs are materially stronger, but Mercur dashboard assets, product hydrate, production deployment, monitoring, Playwright browser proof, and live Linear workspace access remain unresolved.

## Completed

### Marketing Site

- Verified page files and route registration for homepage and service pages in `src/App.tsx`.
- Production build passes with Vite.
- Visual assets are present under `src/assets/`.

### Authenticated Operator Shell

- `/dashboard` is protected by `ProtectedRoute` and now renders `OperatorLayout`.
- Nested dashboard routes exist for command center, brand hub, brand intake, assets, products, analytics, and settings.
- `OperatorNav`, `IntelligencePanel`, and placeholder pages are implemented.
- Vitest includes route coverage for canonical operator paths.

### Brand Intelligence HITL

- `supabase/functions/brand-intelligence/index.ts` uses `npm:@google/genai@2.8.0`, model `gemini-2.5-flash`, URL context, and structured JSON.
- Analyze mode validates URL, requires JWT, creates `brand_intake_drafts`, stores citations/url metadata, and logs to `ai_agent_logs`.
- Commit mode approves or rejects a draft. Approve creates/updates `brands`, replaces `brand_scores`, marks the draft approved, and logs the action.
- `src/pages/dashboard/BrandIntakePage.tsx`, `BrandIntakeForm`, `BrandProfileResult`, and `BrandScoreGrid` provide the connected UI.
- `npm run supabase:verify-brand-intelligence` passed: anonymous rejection, analyze-only draft, no premature brand/scores, approve commit, 4 scores, non-null duration log.

### Supabase Foundation

- Remote Supabase verify passed for basic tables.
- RLS verify passed for `profiles`, `brands`, `brand_scores`, `commerce_product_links`, `ai_agent_logs`, and `brand_intake_drafts`.
- Edge verify passed for `health` and `edge-test`.
- Client env guard passed and found no forbidden secret patterns in `src/`.

### Tests and Build

- `npm run test` passed: 3 test files, 7 tests.
- `npm run build` passed. Build warning remains for a large JS chunk.

## In Progress

### Commerce

- `my-marketplace/packages/api` exists with Mercur/Medusa, Redis config, Stripe provider, admin/vendor UI modules, seller seed, catalog seed, and checkout prep seed.
- `b2c-storefront` exists with cart/checkout pages and Stripe dependencies.
- COM-012 evidence verifies delivery option normalization and Stripe Elements mounting, but not full checkout completion.
- Live audit blocked because commerce services were not running on expected ports.

### Product App UI

- Brand hub loads latest brand and scores.
- Command center, assets, products, analytics, and settings routes exist, but several remain placeholders.
- Intelligence panel is intentionally disabled; no CopilotKit runtime is installed.

### AI Logging and Memory

- `ai_agent_logs` captures brand-intelligence and edge-test calls.
- Brand memory exists as persisted `brands.ai_profile` and `brand_scores`.
- No conversational memory, pgvector, RAG, or prompt-history system is implemented.

### EventOS Legacy Schema

- Historical migrations include events, venues, stakeholders, sponsors, models, phases, tasks, schedules, and related RLS.
- No current React EventOS routes or workflows were found in the iPix app.

## Missing

### MVP Proofs

- DNA-scored asset proof is missing: no `audit-asset-dna`, no Cloudinary upload/sign/register edge, no connected asset library.
- Product-link proof is missing: `commerce_product_links` exists and RLS passes, but no UI or verified live Mercur product link exists.
- Stripe paid order proof is missing from checked-in evidence and was not live-verified.

### AI and Agent Layer

- No Mastra runtime (`services/agent` absent).
- No CopilotKit dependency/runtime; only placeholder UI text.
- No Claude runtime.
- No ADK runtime.
- No shared Gemini model registry.
- No vector embeddings/RAG.
- No production package generator.
- No Lean Canvas runtime.

### Marketing, Messaging, Analytics

- No Postiz integration.
- No lead-generation/campaign-generation runtime.
- No WhatsApp, Chatwoot, Instagram DM, or Facebook Messenger runtime.
- Analytics dashboard is a placeholder.

### Production Operations

- No verified Vercel/preview deployment.
- No Sentry/error monitoring.
- No E2E/browser smoke tests.
- `npm run lint` fails.
- Live Linear workspace could not be checked.

## Risks

### Critical

- **False readiness risk:** Old docs claim 6/8 proofs and a paid Stripe order, but this audit cannot verify live commerce or paid-order evidence.
- **Lint/CI risk:** Lint fails massively, and CI does not run lint. This masks real root-app lint errors.
- **Commerce runtime risk:** Expected Mercur/B2C ports were not serving the claimed apps during audit.

### High

- **MVP dependency risk:** Proofs #7 and #8 are entirely blocking launch readiness.
- **Deployment risk:** Build passes locally, but no preview/prod deployment evidence exists.
- **Observability risk:** AI logs exist, but there is no app-wide monitoring or alerting.
- **Planning drift risk:** Local Linear issue specs are stale relative to the current HITL implementation, and live Linear auth is unavailable.

### Medium

- **Model drift risk:** Brand Intelligence is hardcoded to `gemini-2.5-flash`; docs discuss future Gemini model targets.
- **Legacy schema risk:** Event/FashionOS-era migrations coexist with iPix MVP schema and do not represent shipped app functionality.
- **Test depth risk:** Unit tests are useful but narrow; no Playwright or full browser path is verified.

## Recommended Next Sprint

1. Fix lint scope/config and root lint errors.
2. Restore/re-prove Mercur API, admin, vendor, and B2C storefront locally.
3. Capture a fresh Stripe test paid-order evidence file.
4. Merge/sync Brand Intake HITL work and checked-in Linear specs.
5. Build Cloudinary foundation: signed upload and asset registration.
6. Ship `audit-asset-dna` edge function with RLS and logging.
7. Replace Assets placeholder with DNA review UI.
8. Build Product Links UI and prove one `commerce_product_links` row against a live Mercur product.
9. Add Playwright smoke for auth, operator shell, and brand intake.
10. Restore Linear workspace auth and reconcile issue statuses.

## Completion Summary

| Area | % Complete | Evidence |
| --- | ---: | --- |
| Brand Intelligence | 90% | HITL edge/UI/verify green |
| Lean Canvas | 5% | Docs/wireframes only |
| Production Package | 5% | Docs/wireframes only |
| AI Agents | 20% | Edge-only brand agent; no Mastra/CopilotKit |
| Event Planning | 20% | Legacy schema only; no current UI |
| Marketing | 35% | Marketing site complete; automation missing |
| Commerce | 45% | Code/scripts exist; live proof failed |
| Messaging | 0% | Docs only |
| Analytics | 10% | Placeholder route |
| Infrastructure | 50% | Supabase green; lint/deploy/monitoring gaps |
| Overall Product | 42% | MVP proof count currently 1/8 fully verified in this audit, with several commerce proofs code-present but live-unverified |

## Production Readiness

| Area | Score /100 |
| --- | ---: |
| Product | 45 |
| UI | 55 |
| Backend | 55 |
| Database | 80 |
| AI | 50 |
| Security | 65 |
| Testing | 45 |
| Infrastructure | 45 |
| Observability | 30 |
| Deployment | 25 |
| Documentation | 70 |

**Launch readiness:** Not ready. The product should not be represented as launch-ready until lint, live commerce, Stripe paid order, DNA scoring, product links, deploy, and monitoring are proven.
