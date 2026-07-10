# CF-MIG startup — OpenNext installed (2026-07-08)

**Status:** CF-MIG-110 **build + partial smoke green** · CF-MIG-210 **in progress**  
**Plan SSOT:** [`plan-migrate.md`](plan-migrate.md)  
**Linear:** [`linear/issues/IPI-CF-MIG-110-opennext-foundation.md`](../../../linear/issues/IPI-CF-MIG-110-opennext-foundation.md)

Vercel remains production until **CF-MIG-220** smoke passes on `*.workers.dev`.

**Stack:** `next@16.2.10` · `@opennextjs/cloudflare@1.20.1` · `wrangler@4.107.1`

**Last verified (2026-07-09):** `npm run preview` on `:8787` — `/`, `/login`, `/api/marketing-chat` **200**; marketing chat streams Gemini replies. **Inference today:** `AI_PROVIDER=gemini` → Google API (not Workers AI yet).

---

## Official docs (read first)

| Topic | URL | Use when |
|-------|-----|----------|
| Next.js on Workers | [developers.cloudflare.com/.../nextjs](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/) | Existing app, OpenNext, build/preview/deploy |
| Wrangler autoconfig | [developers.cloudflare.com/.../automatic-configuration](https://developers.cloudflare.com/workers/framework-guides/automatic-configuration/) | `wrangler setup`, in-place migration |
| OpenNext Cloudflare | [opennext.js.org/cloudflare](https://opennext.js.org/cloudflare) | Adapter limits, supported features |
| OpenNext get started | [opennext.js.org/cloudflare/get-started](https://opennext.js.org/cloudflare/get-started) | Manual install (we used `wrangler setup`) |
| OpenNext env vars | [opennext.js.org/cloudflare/howtos/env-vars](https://opennext.js.org/cloudflare/howtos/env-vars) | Workers dashboard + `.dev.vars` |
| OpenNext caching | [opennext.js.org/cloudflare/caching](https://opennext.js.org/cloudflare/caching) | R2 incremental cache (optional P1) |
| Mastra CF deploy | [mastra.ai/docs/deployment/providers/cloudflare](https://mastra.ai/docs/deployment/providers/cloudflare) | **Phase 2** — separate Mastra worker (not current path) |
| Mastra CF deployer ref | [mastra.ai/reference/deployer/cloudflare](https://mastra.ai/reference/deployer/cloudflare) | `@mastra/deployer-cloudflare` API |
| Workers AI provider | [mastra.ai/models/providers/cloudflare-workers-ai](https://mastra.ai/models/providers/cloudflare-workers-ai) | Mastra model string `cloudflare-workers-ai/@cf/...` |
| Workers AI — get started | [developers.cloudflare.com/workers-ai/get-started](https://developers.cloudflare.com/workers-ai/get-started/) | Entry: binding vs REST vs OpenAI-compat |
| Workers AI — Wrangler binding | [developers.cloudflare.com/workers-ai/get-started/workers-wrangler](https://developers.cloudflare.com/workers-ai/get-started/workers-wrangler/) | `env.AI.run("@cf/...", { prompt })` in Worker |
| Workers AI — REST API | [developers.cloudflare.com/workers-ai/get-started/rest-api](https://developers.cloudflare.com/workers-ai/get-started/rest-api/) | `POST .../accounts/{id}/ai/run/@cf/...` |
| Workers AI — OpenAI compat | [developers.cloudflare.com/workers-ai/configuration/open-ai-compatibility](https://developers.cloudflare.com/workers-ai/configuration/open-ai-compatibility/) | `/ai/v1/chat/completions` — Mastra + openai-node |
| Workers AI — model catalog | [developers.cloudflare.com/workers-ai/models](https://developers.cloudflare.com/workers-ai/models/) | **81 models** (Apr 2026); unified catalog at [developers.cloudflare.com/ai/models](https://developers.cloudflare.com/ai/models/) |

**Local mirrors:** [`docs/nextjs-cloudflare.md`](docs/nextjs-cloudflare.md) · [`docs/open-next.md`](docs/open-next.md) · [`docs/existing.md`](docs/existing.md)

**Do not use:** [`docs/migrate-vercel.md`](docs/migrate-vercel.md) — static/SPA only.

---

## Architecture decision (iPix)

| Layer | Phase 1 (now) | Phase 2 (optional) |
|-------|-----------------|-------------------|
| Next.js app | OpenNext single Worker (`app/wrangler.jsonc`) | Same |
| Mastra agents | **In-process** inside OpenNext Worker | Separate Worker via `@mastra/deployer-cloudflare` |
| LLM inference | **Gemini** via `resolveModel()` + `GEMINI_API_KEY` (outbound API) | **Workers AI** default + Gemini vision fallback (IPI-454 / CF-AI-001) |
| Postgres memory | `@mastra/pg` + `DATABASE_URL` (remote Supabase) | Same — Workers FS is ephemeral |
| Mastra dev | `mastra dev` (Node) — unchanged for daily dev | — |

Mastra's standalone Cloudflare deployer is **not** the CF-MIG-110 path. See [`tasks/cloudflare/mastra/`](../mastra/) for when to split.

### Workers AI — three integration paths (official)

| Path | When to use | iPix fit |
|------|-------------|----------|
| **[Wrangler binding](https://developers.cloudflare.com/workers-ai/get-started/workers-wrangler/)** — `"ai": { "binding": "AI" }` → `env.AI.run("@cf/...", …)` | Native inference inside the same Worker; lowest hop count | Add to `app/wrangler.jsonc` when switching `public-marketing` off Gemini |
| **[REST API](https://developers.cloudflare.com/workers-ai/get-started/rest-api/)** — `POST /accounts/{id}/ai/run/@cf/...` | Scripts, edge fn, external callers | Already mirrored in `services/cloudflare-worker/` |
| **[OpenAI-compatible](https://developers.cloudflare.com/workers-ai/configuration/open-ai-compatibility/)** — `/ai/v1/chat/completions` | Drop-in for `@ai-sdk/*`, Mastra `cloudflare-workers-ai/@cf/...`, openai-node | **Preferred for Mastra agents** — no binding plumbing in OpenNext handler |

**Today:** marketing chat on preview uses **Gemini** (`AI_PROVIDER=gemini`), not Workers AI. Service-category replies (Shopify, Amazon, Instagram, …) come from **`PUBLIC_MARKETING_INSTRUCTIONS`**, not the model vendor.

**MVP model picks** (align with `cf-000-platform-architecture.md`; eval-gated via IPI-462):

| Tier | Workers AI model ID | Notes |
|------|---------------------|-------|
| fast / chat | `@cf/meta/llama-3.1-8b-instruct-fast` or `@cf/meta/llama-3.1-8b-instruct-fp8` | Marketing + CopilotKit default |
| structured | `@cf/mistralai/mistral-small-3.1-24b-instruct` | Function calling, JSON |
| vision | Gemini (keep) | `@cf/meta/llama-4-scout-17b-16e-instruct` eval only |
| embedding | `@cf/baai/bge-base-en-v1.5` | 768-dim — matches existing Vectorize schema |

Env for OpenAI-compat / Mastra provider: `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_KEY` (Workers AI API token). Local `wrangler dev` **still bills** Workers AI usage ([docs](https://developers.cloudflare.com/workers-ai/get-started/workers-wrangler/)).

---

## What we ran

```bash
cd app
npx wrangler setup          # autoconfig per existing.md
# → confirmed OpenNext migrate when prompted
```

---

## Troubleshooting checklist

Run in order when preview/deploy fails.

### Pre-flight

- [ ] **Stop `next dev`** before `npm run preview` — concurrent `.next` writes cause manifest races
- [ ] **Stop stale preview** — `pkill -f 'opennextjs-cloudflare preview'` if :8787 hangs (zombie workerd)
- [ ] **Next version:** `next@16.2.6+` required (we use **16.2.10**). OpenNext 1.20.1 explicitly excludes early 16.x ([releases](https://github.com/opennextjs/opennextjs-cloudflare/releases))
- [ ] **Wrangler:** `>=4.59.2` for Next 16.1+ workerd fixes (we have **4.107.1**)
- [ ] **Clean artifacts:** `preview`/`deploy` scripts already run `rm -rf .next .open-next`

### Build gate (`CF-MIG-110`)

```bash
cd app
npm run build                    # Vercel path — must stay green
npx opennextjs-cloudflare build  # Workers bundle → .open-next/worker.js
npm test
```

- [x] `npm run build` green
- [x] `opennextjs-cloudflare build` completes
- [x] 914 tests pass (2026-07-08)
- [ ] `npm run cf-typegen` — generate `cloudflare-env.d.ts`
- [ ] `npm run preview` — workerd smoke (Ctrl+C to stop; server runs until killed)

### Config sanity

- [x] **No `proxy.ts`** — use Edge `src/middleware.ts` only (OpenNext rejects Node middleware)
- [x] **`initOpenNextCloudflareForDev()`** — dev-only guard in `next.config.ts` (production build must not start Wrangler)
- [x] **`serverExternalPackages`** — Mastra natives externalized; CopilotKit **must not** use `/v2` barrel (express eval)
- [x] **CopilotKit fetch-only imports** — `@/lib/copilotkit/runtime-v2-fetch` + turbopack aliases (marketing-chat)
- [x] **`NEXT_PRIVATE_WORKER_THREADS=false`** on build script
- [x] **`turbopack.root`** pinned to `app/` (multi-lockfile monorepo)
- [ ] **Env vars** mirrored to Workers Build + Runtime ([OpenNext env vars](https://opennext.js.org/cloudflare/howtos/env-vars))

---

## Errors → fixes (verified)

| Error | Root cause | Fix | Status |
|-------|------------|-----|--------|
| `@ast-grep/napi` / Turbopack | Mastra native module bundled by Turbopack | `serverExternalPackages` in `next.config.ts` | ✅ Fixed |
| `Node.js middleware is not currently supported` | Next 16 `proxy.ts` = Node runtime | `src/middleware.ts` (Edge); delete `proxy.ts` | ✅ Fixed |
| `ENOENT .next/server/pages-manifest.json` | Early Next 16.1.x + OpenNext peer mismatch; `initOpenNextCloudflareForDev()` racing build; stale `.next` | Bump **Next 16.2.10**; dev-only OpenNext hook; clean `.next`; `NEXT_PRIVATE_WORKER_THREADS=false` | ✅ Fixed |
| `__dirname is not defined` | OpenNext ESM bundle | `import.meta.url` + `path.dirname` in `next.config.ts` | ✅ Fixed |
| ESLint `src/proxy.ts` not found | Pre-stop hook linted deleted files | Skip missing paths in `verify-before-stop.sh` | ✅ Fixed |
| `Failed to copy hast-util-*` | OpenNext bundle copy warnings (non-fatal) | Monitor; upgrade OpenNext if runtime breaks | 🟡 Warn only |
| Preview hangs (curl timeout, 0 bytes) | `wrangler dev` rebundles handler → `@ast-grep/napi` `.node` loader fails; zombie workerd on :8787 | **`wrangler.jsonc` `alias`** → `scripts/cf-ast-grep-stub.mjs`; kill stale preview PIDs before retry | ✅ Fixed |
| `/api/marketing-chat` 500 — express eval | `@copilotkit/runtime/v2` barrel top-level-imports express | Fetch-only re-exports via `runtime-v2-fetch.ts` + turbopack aliases | ✅ Fixed |
| `/api/marketing-chat` 500 — LibSQL `file:` | `LibSQLStore(:memory:)` → `file:` URL on Workers | Drop storage on public route; `InMemoryAgentRunner` owns threads | ✅ Fixed |
| `hono/vercel` at runtime | Vercel adapter in CopilotKit **operator** route | Switch to `hono/cloudflare-workers` or `@copilotkit/runtime/v2/hono` | 🔴 CF-MIG-210 |
| `config/groq-models.json` ENOENT | Runtime `readFileSync` when `AI_PROVIDER=groq` | Static import or bundle JSON at build time | 🟡 Lazy-load OK for gemini-only preview |
| OAuth callback on `*.workers.dev` | Supabase redirect URL allowlist | Add workers.dev URL to Supabase + env | 🔴 CF-MIG-210 |
| `DATABASE_URL` / Mastra PG | Remote DB required on Workers (ephemeral FS) | Ensure pooler URL in Workers secrets | 🟡 Verify at smoke |
| Inference still outbound Gemini | Workers AI not wired in `resolveModel()` | IPI-454: Mastra `cloudflare-workers-ai/@cf/...` or AI Gateway worker | 🟡 Parallel — not CF-MIG-110 blocker |

---

## Red flags & blockers

### 🔴 Blockers (CF-MIG-210 — runtime, not build)

| # | Item | File / area | Blocks |
|---|------|-------------|--------|
| 1 | Hono Vercel adapter | `app/src/app/api/copilotkit/[[...slug]]/route.ts` | **Operator** CopilotKit on Workers |
| 2 | Groq SSOT filesystem load | `app/src/lib/ai/provider.ts` | AI routes when `AI_PROVIDER=groq` on Workers |
| 3 | OAuth redirect URLs | Supabase dashboard + `auth/callback` | Operator login on `*.workers.dev` |

### 🟢 Fixed on preview (2026-07-09)

| Item | Fix |
|------|-----|
| Public marketing chat (`/api/marketing-chat`) | CopilotKit express bypass + no LibSQLStore |
| Homepage + static routes | ast-grep wrangler alias |
| Marketing agent inference | Gemini via existing `resolveModel("fast")` — **not** Workers AI yet |

### 🟡 Gaps (not DNS blockers)

| Item | Action |
|------|--------|
| R2 incremental cache | Optional; migrate warned — [OpenNext caching](https://opennext.js.org/cloudflare/caching) |
| `cloudflare-env.d.ts` | `npm run cf-typegen` |
| Workers env matrix | Mirror Vercel + `.env.local` per plan-migrate §5 |
| CI OpenNext build | CF-MIG-111 — `opennextjs-cloudflare build` on `app/**` PRs |
| Linear CF-MIG issues | Create epic + 5 issues (script needs valid project ID) |

### 🟢 Correct (do not revert)

| Artifact | Path |
|----------|------|
| Wrangler config | `app/wrangler.jsonc` — `main`, `assets`, `nodejs_compat`, `WORKER_SELF_REFERENCE`, `images` |
| OpenNext config | `app/open-next.config.ts` |
| Scripts | `preview`, `deploy`, `upload`, `cf-typegen` |
| Static headers | `app/public/_headers` |
| Gitignore | `.open-next`, `.wrangler`, `.dev.vars*` |

---

## Critical fixes applied (2026-07-08)

| Fix | Confidence | Evidence |
|-----|:----------:|----------|
| Next **16.1.2 → 16.2.10** | 98% | OpenNext peer dep `>=16.2.6`; release notes exclude early 16.x |
| `serverExternalPackages` for Mastra natives | 95% | `@ast-grep/napi` build failure resolved |
| Dev-only `initOpenNextCloudflareForDev()` | 95% | pages-manifest race during `next build` |
| Clean `.next` + `.open-next` before preview/deploy | 95% | Stale dev artifacts |
| `NEXT_PRIVATE_WORKER_THREADS=false` | 90% | Known Next 15/16 manifest race mitigation |
| `proxy.ts` → Edge `middleware.ts` | 100% | OpenNext hard error |

---

## Dev vs preview vs deploy

| Command | Runtime | Use when |
|---------|---------|----------|
| `npm run dev` | Node (Next + Mastra dev) | Daily development — **not** Workers proof |
| `npm run build` | Node (Next prod) | Vercel CI — must stay green |
| `npm run preview` | **workerd** (Wrangler) | CF integration test — **CF-MIG-220 target** |
| `npm run deploy` | Cloudflare Workers | After smoke on `*.workers.dev` |

---

## Next steps (order)

```text
1. [CF-MIG-110 PR] Commit OpenNext scaffold + marketing-chat Workers fixes (code-only)
2. npm run cf-typegen
3. npm run preview → extend smoke: operator /api/copilotkit, auth callback, groq path
4. [CF-MIG-210] Hono adapter, groq JSON bundling, OAuth callback
5. [CF-MIG-111] CI: opennextjs-cloudflare build on app/** PRs
6. [CF-MIG-220] Full smoke checklist on *.workers.dev
7. [CF-MIG-810] DNS cutover last
```

Parallel (AI, not hosting blockers):

```text
IPI-454 AC-F — Mastra @ai-sdk/openai-compatible → gateway worker   ← NEXT code PR
IPI-454 AC-I — prod deploy services/cloudflare-worker (IPI-472)
IPI-454 AC-G — KV model registry
IPI-461 Provider adapter (reopen — not on main)
IPI-462 golden eval → Workers AI vs Gemini for fast/structured tiers
Workers AI wire: resolveModel("cloudflare-workers-ai") OR ai binding in wrangler.jsonc
  → see ../mastra/cloudflare-workersai.md + Workers AI OpenAI-compat docs
IPI-468 secrets audit (CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_KEY in Workers Build + Runtime)

Done: IPI-454 AC-C — Workers AI URL fix (PR #279, dcbdf25b, 14/14 tests)
Evidence: tasks/cloudflare/tests/pr-279-workers-ai-url-verification.md
```

---

## Workers Builds (GitHub connect)

```text
Root directory: app/
Build command:  opennextjs-cloudflare build
Deploy command: wrangler deploy
```

Set **Build variables and secrets** to match Vercel + `.env.local` (see plan-migrate §5).

---

## GitHub search patterns

When stuck, search issues before guessing:

```text
repo:opennextjs/opennextjs-cloudflare pages-manifest
repo:opennextjs/opennextjs-cloudflare next 16.2
repo:vercel/next.js turbopack native module
repo:mastra-ai/mastra ast-grep
repo:mastra-ai/mastra Cloudflare Workers
repo:cloudflare/workers-sdk nextjs opennext
```

**Repos:** [OpenNext Cloudflare](https://github.com/opennextjs/opennextjs-cloudflare) · [OpenNext releases](https://github.com/opennextjs/opennextjs-cloudflare/releases) · [workers-sdk](https://github.com/cloudflare/workers-sdk) · [next.js](https://github.com/vercel/next.js/issues) · [mastra](https://github.com/mastra-ai/mastra/issues)

---

## Suggested improvements

1. **Pin `next` exactly** — use `"16.2.10"` not `^16.2.10` in `app/package.json` to avoid surprise minor bumps breaking OpenNext peer checks.
2. **Bundle `groq-models.json`** — replace runtime FS walk with `import groqModels from '../../../config/groq-models.json' assert { type: 'json' }` or copy into `app/config/` at build time (CF-MIG-210).
3. **Add `verify:cf-build` script** — `rm -rf .next .open-next && opennextjs-cloudflare build` in CI matrix alongside `npm run build`.
4. **R2 cache** — enable after smoke green; reduces ISR/cache latency on Workers.
5. **Mastra split evaluation** — only if in-process bundle size or cold start exceeds limits; see [`deploy-cloudflare.md`](../mastra/deploy-cloudflare.md).
6. **Workers AI cutover path** — (a) Mastra `cloudflare-workers-ai/@cf/...` in `resolveModel`, or (b) `"ai"` binding + custom adapter, or (c) route via `services/cloudflare-worker` OpenAI-compat gateway. Eval before flipping marketing chat off Gemini.
7. **Document env parity table** — Vercel var → Workers Build vs Runtime vs `.dev.vars` (plan-migrate §5 expansion).
8. **Preview smoke script** — minimal Playwright/curl against `wrangler dev` URL for CF-MIG-220 automation.

---

## CF-MIG-110 acceptance

- [x] `@opennextjs/cloudflare` + `wrangler` in `app/`
- [x] `wrangler.jsonc` + `open-next.config.ts`
- [x] `preview` / `deploy` / `cf-typegen` scripts
- [x] Next **16.2.10** (OpenNext peer satisfied)
- [x] Build fixes: middleware, serverExternalPackages, dev-only OpenNext hook
- [x] `opennextjs-cloudflare build` completes
- [x] `npm run build` (Vercel path) green
- [x] `npm run preview` workerd smoke (2026-07-09 — `/`, `/login`, `/api/marketing-chat` 200; chat streams)
- [ ] Operator `/api/copilotkit` 200 on preview
- [ ] `npm run cf-typegen` run once

---

## Doc index

| File | Role |
|------|------|
| [`startup.md`](startup.md) | This file — status + troubleshooting |
| [`plan-migrate.md`](plan-migrate.md) | Full migration plan + Linear tasks |
| [`docs/existing.md`](docs/existing.md) | Wrangler autoconfig reference |
| [`docs/nextjs-cloudflare.md`](docs/nextjs-cloudflare.md) | Official Next.js + OpenNext guide |
| [`docs/open-next.md`](docs/open-next.md) | Adapter limits, Node runtime |
| [`../mastra/`](../mastra/) | Mastra CF deployer + Workers AI (Phase 2) |
