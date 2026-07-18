# Mastra × Cloudflare Workers Audit — OpenNext Operator App

**Date:** 2026-07-16  
**Scope:** `/home/sk/ipix/app` (+ sibling `services/cloudflare-worker/` where Mastra AI routing depends on it)  
**Mode:** Read-only (no file edits, no Linear issues created, no secrets exposed)  
**Prompt:** User audit request + skill refs under `.claude/skills/mastra/references/cloudflare*.md`

---

## Plain-English summary

**What you have:** iPix does **not** deploy Mastra as a standalone Cloudflare Worker via `CloudflareDeployer`. Instead, Mastra runs **inside the Next.js operator app**, bundled by **OpenNext for Cloudflare** into Worker `ipix-operator`. CopilotKit calls agents at `/api/copilotkit` (operator) and `/api/marketing-chat` (public site). A **separate** Worker `ai-gateway` handles Workers AI / Gemini routing when you opt in with `AI_ROUTING_MODE=gateway`.

**What works today (verified in repo):**

- OpenNext scripts (`preview`, `deploy`, `upload`) and `wrangler.jsonc` with `nodejs_compat`, observability enabled, and `MASTRA_STORAGE_MODE=noop` so agents **stream without hanging** on `pg.Pool` (IPI-490 mitigation).
- Wrangler aliases stub native `@ast-grep/napi` so local `wrangler dev` rebundling does not crash.
- Operator CopilotKit route uses Workers-safe fetch handler + optional Supabase auth gate (`withOperatorAuth`).
- Storage unit tests cover Workers noop path (`app/src/mastra/storage.test.ts`).
- `.mastra/` and `.open-next` are gitignored; build output is not committed.

**What is broken or incomplete for production:**

| Issue | Plain meaning |
|-------|----------------|
| **No durable Mastra memory on Workers** | Every deploy/restart loses threads, messages, workflow snapshots — `InMemoryStore` only. |
| **No Hyperdrive binding on `ipix-operator`** | Cannot safely use `PostgresStore` from the Worker until IPI-619 → IPI-623 land. |
| **Operator auth off by default** | `OPERATOR_AUTH_ENABLED=false` → CopilotKit accepts a dev identity; anyone who can reach `/api/copilotkit` can invoke agents. |
| **Public marketing chat** | `/api/marketing-chat` has **no auth**, `cors: true` — intentional for the public site but needs rate limiting / abuse controls before scale. |
| **CI does not build OpenNext** | GitHub Actions runs `next build`, not `opennextjs-cloudflare build` — Worker bundle regressions can merge unnoticed. |
| **Secrets not documented for Workers** | `.env.example` lacks `AI_GATEWAY_*`, `AI_ROUTING_MODE`, Wrangler secret upload steps; `GEMINI_API_KEY` must be `wrangler secret put`, not `vars`. |
| **Docs drift** | `app/AGENTS.md` still describes LibSQL + 2 agents; code has Postgres/InMemoryStore + 9+ agents. |
| **Workers AI model ID drift** | `app/src/lib/ai/model-registry.ts` uses `@cf/meta/llama-3.1-8b-instruct-fp8-fast` — **not** in Mastra’s official Workers AI model list (likely invalid); live gateway Worker uses `@cf/meta/llama-4-scout-17b-16e-instruct`. |

**Architecture verdict:** The **OpenNext in-process** path matches Mastra’s documented exception: *“If you're using a server adapter or web framework, deploy the way you normally would for that framework.”* ([Mastra Cloudflare guide](https://mastra.ai/guides/deployment/cloudflare)). **Do not** add `@mastra/deployer-cloudflare` as the primary operator path — it would fork deployment and expose a separate `/api/agents` surface ([CloudflareDeployer reference](https://mastra.ai/reference/deployer/cloudflare)).

**Scores:** Configuration correctness **~62%** · Production readiness **~38%** · Probability first deploy succeeds without changes **~65%** (if secrets + dashboard are configured manually) · **Not production-ready**.

**Recommended next task:** **IPI-490 · CF-MIG-210 — Verify OpenNext Runtime Compatibility, OAuth, Streaming and Persistence** — prove operator CopilotKit + Mastra on Workers preview before binding Hyperdrive or flipping gateway defaults.

---

## 1. Executive verdict

**🟠 Deployable after blockers — not production-ready.**

| Metric | Value |
|--------|------:|
| Overall configuration correctness | **62%** |
| Production-readiness | **38%** |
| P(deploy succeeds without code changes) | **~65%** (manual secrets + dashboard assumed) |
| Critical blockers | **4** |
| High-risk findings | **8** |
| Minimum tasks before first preview deploy | **3** |
| Minimum tasks before production | **12+** |

**Critical blockers (deployment / security):**

1. **IPI-490 · CF-MIG-210** — OpenNext runtime proof incomplete (CopilotKit streaming, OAuth, bundle size, Node API compat).
2. **Secrets not wired in repo/CI** — `GEMINI_API_KEY`, Supabase keys, optional `AI_GATEWAY_*` must be Cloudflare Secrets ([Wrangler secrets](https://developers.cloudflare.com/workers/configuration/secrets/)); not documented in `app/.env.example`.
3. **`OPERATOR_AUTH_ENABLED=false`** — operator agent surface effectively open when deployed ([`app/src/lib/operator-gate.ts`](../../app/src/lib/operator-gate.ts)).
4. **No OpenNext build in CI** — `.github/workflows/ci.yml` runs `npm run build` (Next only), not `opennextjs-cloudflare build`.

**Correctly implemented (keep):**

- OpenNext + Wrangler shell for `ipix-operator` ([`app/wrangler.jsonc`](../../app/wrangler.jsonc)).
- IPI-490 storage guard: `InMemoryStore` when `MASTRA_STORAGE_MODE=noop` or on Workers ([`app/src/mastra/storage.ts`](../../app/src/mastra/storage.ts)).
- CopilotKit v2 fetch handler pattern (no Hono on operator route).
- Separate `ai-gateway` Worker with `keep_vars`, `nodejs_compat`, observability ([`services/cloudflare-worker/wrangler.jsonc`](../../services/cloudflare-worker/wrangler.jsonc)).
- `resolveModel()` gateway opt-in (`AI_ROUTING_MODE=gateway`) with tests ([`app/src/lib/ai/provider.ts`](../../app/src/lib/ai/provider.ts)).
- Epic SSOT: OpenNext in-process, not CloudflareDeployer ([`tasks/cloudflare/mastra/MASTRA-EPIC.md`](../cloudflare/mastra/MASTRA-EPIC.md)).

---

## 2. Audit method

| Step | Tool / source |
|------|----------------|
| Repo inspection | `rg`, file reads under `app/`, `services/cloudflare-worker/` |
| Package versions | `npm list`, `npx mastra --version`, `npx wrangler --version` |
| Official docs | WebFetch: [Mastra Cloudflare guide](https://mastra.ai/guides/deployment/cloudflare), [CloudflareDeployer ref](https://mastra.ai/reference/deployer/cloudflare), [mastra.ai/llms.txt](https://mastra.ai/llms.txt), [Wrangler configuration](https://developers.cloudflare.com/workers/wrangler/configuration/), [Workers secrets](https://developers.cloudflare.com/workers/configuration/secrets/) |
| Skill refs | `.claude/skills/mastra/references/cloudflare.md`, `cloudflare-deploy.md`, `cloudflare-workers-ai.md` |
| Cross-audit | [`tasks/mastra/j16-mastra-supabase.md`](./j16-mastra-supabase.md) (Postgres/init/RLS — Node + Hyperdrive prerequisite) |
| Epic / task SSOT | [`tasks/cloudflare/todo.md`](../cloudflare/todo.md), MASTRA-EPIC |

**Note:** `https://mastra.ai/docs/deployment/cloudflare` returns **404** (2026-07-16). Use [guides/deployment/cloudflare](https://mastra.ai/guides/deployment/cloudflare) and [reference/deployer/cloudflare](https://mastra.ai/reference/deployer/cloudflare) instead.

---

## 3. Architecture (as implemented)

```text
Browser / Operator UI
        │
        ▼
┌───────────────────────────────────────────────────┐
│  Cloudflare Worker: ipix-operator (OpenNext)      │
│  main: .open-next/worker.js                       │
│  bindings: ASSETS, IMAGES, WORKER_SELF_REFERENCE    │
│  vars: MASTRA_STORAGE_MODE=noop                     │
└───────────────┬───────────────────────────────────┘
                │
    ┌───────────┼───────────┐
    ▼           ▼           ▼
 Next.js      CopilotKit    getMastra() in-process
 routes       /api/copilotkit/*     9+ agents
              /api/marketing-chat/*  (public, isolated Mastra)
                │
                ▼
         resolveModel() ──direct──► Gemini / Groq (@ai-sdk/*)
                │
                └──gateway (opt-in)──► ai-gateway Worker :8787
                                         └── Workers AI REST
```

**Not present:** Standalone Mastra HTTP server (`/api/agents`), `@mastra/deployer-cloudflare`, Hyperdrive binding, D1/KV Mastra storage on operator Worker.

---

## 4. Current-state matrix

| Area | Current setup | Evidence | Correct? | Missing or risky | Best supported solution | Official source | Verification |
|------|---------------|----------|:--------:|------------------|-------------------------|-----------------|--------------|
| **Deployment pattern** | OpenNext in-process (Next.js on Workers) | `app/package.json` scripts; no `CloudflareDeployer` in app source | ✅ | Team might assume CloudflareDeployer is required | Keep OpenNext; document as SSOT | [Mastra CF guide — web framework exception](https://mastra.ai/guides/deployment/cloudflare) | `rg CloudflareDeployer app/src` → 0 |
| **Mastra packages** | `mastra@1.1.0-alpha.3`, `@mastra/core@1.41.0`, `@mastra/pg@1.12.0`, `@mastra/memory@1.0.1-alpha.1` | `app/package.json`, `npm list` | 🟡 | Alpha CLI; pg/memory alpha pins | Pin after smoke; track Mastra releases | [mastra.ai/llms.txt](https://mastra.ai/llms.txt) | `cd app && npm list @mastra/core mastra` |
| **Cloudflare deployer** | **Not installed** (`@mastra/deployer-cloudflare` absent) | `npm list @mastra/deployer-cloudflare` → empty | ✅ (intentional) | N/A for operator app | Do not add unless standalone Mastra Worker needed | [CloudflareDeployer ref](https://mastra.ai/reference/deployer/cloudflare) | `npm list @mastra/deployer-cloudflare` |
| **OpenNext** | `@opennextjs/cloudflare@1.20.1` | `app/package.json` | ✅ | Not in CI | Add CI job or nightly | [OpenNext Cloudflare](https://opennext.js.org/cloudflare) | `npm run preview` locally |
| **Wrangler** | `4.110.0` (via OpenNext) | `npx wrangler --version` | ✅ | — | Keep aligned with OpenNext | [Wrangler config](https://developers.cloudflare.com/workers/wrangler/configuration/) | `npx wrangler --version` |
| **Build output** | `.open-next/worker.js` + assets | `app/wrangler.jsonc` `main` | ✅ | Ephemeral; gitignored | `opennextjs-cloudflare build` before deploy | Mastra CF guide (framework path) | `ls app/.open-next` after build |
| **Worker entry** | `.open-next/worker.js` | `wrangler.jsonc` | ✅ | — | OpenNext deploy scripts | Same | `cat app/wrangler.jsonc` |
| **Compatibility date** | `2026-07-08` | `wrangler.jsonc` | 🟡 | Review flag drift (IPI-589) | Dashboard review + bump date | [Compatibility dates](https://developers.cloudflare.com/workers/configuration/compatibility-dates/) | `wrangler deploy --dry-run` |
| **Compatibility flags** | `nodejs_compat` | `wrangler.jsonc` | ✅ | Required for Node APIs in OpenNext/Mastra | Keep; verify after date bump | [Compatibility flags](https://developers.cloudflare.com/workers/configuration/compatibility-flags/) | Preview smoke |
| **Workers AI (Mastra model strings)** | **Not used in agents** — `resolveModel()` → Gemini/Groq or gateway OpenAI-compat | `app/src/lib/ai/provider.ts` | 🟡 | Registry file has non-catalog model id | Gateway Worker + optional `cloudflare-workers-ai/@cf/...` only after eval | [Mastra Workers AI ref](https://mastra.ai/models/providers/cloudflare-workers-ai) (skill mirror) | `rg cloudflare-workers-ai app/src/mastra` → 0 |
| **Workers AI (gateway Worker)** | `@cf/meta/llama-4-scout-17b-16e-instruct` default tier | `services/cloudflare-worker/src/model-registry.ts` | ✅ | Separate deploy lifecycle | Dashboard secrets `CLOUDFLARE_ACCOUNT_ID` + API token | [Workers AI models](https://developers.cloudflare.com/workers-ai/models/) | `curl ai-gateway/health` |
| **Secrets** | Not in wrangler `vars` (good); **not documented** in `app/.env.example` for CF deploy | `wrangler.jsonc` vars only `MASTRA_STORAGE_MODE`; `.env.example` | 🔴 | `GEMINI_API_KEY`, Supabase, gateway keys | `wrangler secret bulk` / Dashboard | [Wrangler secrets](https://developers.cloudflare.com/workers/configuration/secrets/) | `wrangler secret list` (dashboard) |
| **Non-secret vars** | `MASTRA_STORAGE_MODE: "noop"` in wrangler | `wrangler.jsonc` | ✅ | Correct for current pg hang | Keep until Hyperdrive client path | Mastra CF warning on ephemeral FS | Preview agent turn |
| **Storage** | Workers: `InMemoryStore`; Node: `PostgresStore` if `DATABASE_URL` | `storage.ts`, wrangler var | 🟡 | No durable memory on CF; pg hangs | IPI-619 bind Hyperdrive → IPI-623 PostgresStore client mode | [Mastra CF guide — external storage](https://mastra.ai/guides/deployment/cloudflare) | Write→read test on preview |
| **Observability** | `observability.enabled: true` on both workers | `wrangler.jsonc` files | ✅ | No custom dashboards in repo | Cloudflare Workers Observability dashboard | [Workers observability](https://developers.cloudflare.com/workers/observability/) | Dashboard logs after deploy |
| **Authentication** | Operator: `withOperatorAuth` but **disabled**; Marketing: none | `operator-gate.ts`, marketing-chat route | 🔴 | Public agent invocation | Enable `OPERATOR_AUTH_ENABLED`; CF Access / rate limits for marketing | Mastra guide: auth before public endpoints | 401 test with auth on |
| **CORS** | Marketing chat `cors: true` | `marketing-chat/route.ts` | 🟡 | Wide open by design | Restrict origins in production | CopilotKit + CF security rules | Browser preflight test |
| **Rate limiting** | None on CopilotKit routes | `rg rate.limit app/src/app/api` | 🔴 | Abuse / cost exposure | Cloudflare Rate Limiting / WAF | [Cloudflare rate limiting](https://developers.cloudflare.com/waf/rate-limiting-rules/) | Load test 429 |
| **Supabase from Worker** | `@supabase/ssr` server clients; anon key + user JWT | `app/src/lib/supabase/*` | 🟡 | No Hyperdrive; HTTP to Supabase API OK; direct Postgres via pg **not** on Workers | Keep Supabase HTTP; Postgres only via Hyperdrive | [Hyperdrive](https://developers.cloudflare.com/hyperdrive/) | RLS tests on operator routes |
| **Preview environment** | No `env.preview` in wrangler; script `preview` is local | `wrangler.jsonc`, `package.json` | 🟡 | Prod/preview resource collision risk | Wrangler environments + separate Worker names | [Wrangler environments](https://developers.cloudflare.com/workers/wrangler/environments/) | `wrangler deploy --env preview` |
| **Production environment** | Worker name `ipix-operator` | `wrangler.jsonc` | 🟡 | Single env only | Named envs + custom domain | Wrangler config | Dashboard Workers list |
| **Git deployment** | Scripts exist; **no** repo CI/CD to Cloudflare | `package.json` deploy; no CF in `.github/workflows` | 🟡 | Manual deploy only unless Dashboard Git connected | Cloudflare Workers Builds (Dashboard) | [Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/) | Dashboard → Builds |
| **Custom domain** | Not in wrangler routes | `wrangler.jsonc` | ⚪ | DNS likely separate (CF-MIG-810) | Dashboard custom domain | Wrangler routes docs | Dashboard DNS |
| **Tests** | Storage noop tests; provider gateway tests; `/api/ai/health` test | `storage.test.ts`, `provider.test.ts` | 🟡 | No OpenNext e2e in CI | Extend IPI-490 smoke | — | `cd app && npm test` |
| **Monitoring** | Sentry Next.js plugin | `next.config.ts` | 🟡 | Worker-native tracing unverified | Sentry + CF observability | Sentry Next.js docs | Trigger error on preview |
| **Rollback** | Not documented in app | — | 🔴 | No runbook | CF gradual deploy / version rollback | [Workers versions](https://developers.cloudflare.com/workers/configuration/versions-and-deployments/) | Dashboard rollback |
| **Documentation** | MASTRA-EPIC current; **`app/AGENTS.md` stale** | `app/AGENTS.md` vs `mastra/index.ts` | 🔴 | LibSQL, 2 agents | Update app/AGENTS.md (docs-only PR) | Internal | Read both files |

---

## 5. Findings (errors, blockers, red flags)

| # | Severity | Finding | Evidence | Why it matters | Official source | Exact correction | Verification | Blocks deploy? |
|---|:--------:|---------|----------|----------------|-------------------|------------------|--------------|:--------------:|
| F1 | 🔴 | **No `@mastra/deployer-cloudflare` — not a bug** but easy to mis-audit | No direct dep; no `deployer:` in `getMastra()` | Wrong fix path (standalone `/api/agents`) breaks CopilotKit architecture | [Mastra CF guide](https://mastra.ai/guides/deployment/cloudflare) | Document OpenNext as SSOT; do not add CloudflareDeployer to operator | `rg deployer-cloudflare app/package.json` | No |
| F2 | 🔴 | **Durable Mastra storage disabled on Workers** | `MASTRA_STORAGE_MODE=noop` in wrangler; `InMemoryStore` | Threads/memory lost every isolate restart | [Mastra CF — ephemeral FS](https://mastra.ai/guides/deployment/cloudflare) | IPI-619 Hyperdrive binding → IPI-623 client PostgresStore | Write message → redeploy → read | **Yes** (production memory) |
| F3 | 🔴 | **`PostgresStore` / `pg.Pool` hangs on Workers** | `storage.ts` comments IPI-490; wrangler noop var | Enabling `MASTRA_STORAGE_MODE=pg` without Hyperdrive client will hang | [Hyperdrive for Postgres](https://developers.cloudflare.com/hyperdrive/) | Keep noop until IPI-623; 20s stream idle timeout already in copilotkit route | Preview with pg mode (expect hang) | **Yes** (if pg forced) |
| F4 | 🔴 | **Operator auth disabled by default** | `OPERATOR_AUTH_ENABLED=false` in `.env.example`; `withOperatorAuth` bypass | Unauthenticated agent/tool execution on deployed Worker | Mastra guide: *“Set up authentication before exposing endpoints publicly”* | Set `OPERATOR_AUTH_ENABLED=true` + wrangler secret; enforce Supabase session | `curl -X POST /api/copilotkit` → 401 | **Yes** (production) |
| F5 | 🔴 | **CI does not run OpenNext Cloudflare build** | `.github/workflows/ci.yml` → `npm run build` only | Worker bundle breakages merge silently | OpenNext docs | Add `opennextjs-cloudflare build` job (or `--dry-run` deploy) | CI log | **Yes** (confidence) |
| F6 | 🟠 | **Public marketing CopilotKit — no auth, CORS on** | `marketing-chat/route.ts` | Cost/abuse; prompt injection to public agent | CF WAF / rate limiting | Rate limit `/api/marketing-chat`; cap tokens | Load test | Partial |
| F7 | 🟠 | **No Hyperdrive binding on `ipix-operator`** | `wrangler.jsonc` — no `hyperdrive` block; `cloudflare-env.d.ts` | Blocks durable Postgres from Worker | [Wrangler Hyperdrive binding](https://developers.cloudflare.com/hyperdrive/) | IPI-619: add binding `HYPERDRIVE_FRESH` | `wrangler types` shows binding | **Yes** (durable DB) |
| F8 | 🟠 | **Secrets missing from operator `.env.example`** | No `AI_GATEWAY_URL`, `AI_ROUTING_MODE`, Wrangler upload notes | Engineers deploy without `GEMINI_API_KEY` secret | [Wrangler secrets](https://developers.cloudflare.com/workers/configuration/secrets/) | Document `wrangler secret bulk` + required keys | Deploy smoke | Partial |
| F9 | 🟠 | **IPI-490 / CF-MIG-210 runtime proof incomplete** | `tasks/cloudflare/todo.md` — local ✅ remote 🔴 | CopilotKit/OAuth/Groq bundle may fail on Workers | OpenNext + CF compat docs | Complete smoke checklist in IPI-490 | `npm run preview` + agent turn | **Yes** |
| F10 | 🟠 | **Invalid Workers AI model id in app registry file** | `@cf/meta/llama-3.1-8b-instruct-fp8-fast` in `model-registry.ts` | Not in [Mastra Workers AI catalog](https://mastra.ai/models/providers/cloudflare-workers-ai) (`fp8` exists, `-fast` on 3.1-8b does not) | Align with `@cf/meta/llama-3.1-8b-instruct-fp8` or gateway registry | Fix ids when registry wired (IPI-457) | Workers AI model list API | No (file seed unused by agents today) |
| F11 | 🟠 | **Mastra agents do not use Workers AI native model router** | Agents use `resolveModel()` not `cloudflare-workers-ai/@cf/...` | By design until IPI-454/462; direct Gemini keys on Worker | [Workers AI provider](https://mastra.ai/models/providers/cloudflare-workers-ai) | Gateway-first cutover (IPI-454 AC-F, IPI-485) | `AI_ROUTING_MODE=gateway` integration test | No |
| F12 | 🟠 | **Supabase Postgres init blocked on Node** (related) | See `j16-mastra-supabase.md` | Local `mastra dev` + future Hyperdrive role need migration/`disableInit` | `@mastra/pg` behavior | IPI-227 Option C | `mastra dev` boot | No (CF noop path) |
| F13 | 🟡 | **No wrangler preview/production environments** | Single `name: ipix-operator` | Preview deploy can overwrite prod config | [Wrangler environments](https://developers.cloudflare.com/workers/wrangler/environments/) | Add `env.preview` worker name + vars | Two workers in dashboard | Partial |
| F14 | 🟡 | **`app/AGENTS.md` documentation drift** | Claims LibSQL + 2 agents | Misleading for CF deploy audits | Internal | Docs-only update | Read file | No |
| F15 | 🟡 | **LibSQL packages still in dependencies** | `@mastra/libsql`, `@libsql/client` in package.json; externalized in next.config | Bundle bloat risk; file URLs break on Workers | Mastra CF warning | Remove if unused (ponytail after grep) | `npm run build` size | No |
| F16 | 🟡 | **No `/api/agents` Mastra server route** | CopilotKit only | Expected for framework path; not CloudflareDeployer | [CloudflareDeployer `/api` prefix](https://mastra.ai/reference/deployer/cloudflare) | None — document intentional | `rg api/agents app` | No |
| F17 | 🟡 | **Bindings not initialized via `cloudflare:workers`** | Storage uses `process.env`, not `env.HYPERDRIVE` | Required pattern when adding Hyperdrive per Mastra deployer docs | [CloudflareDeployer bindings example](https://mastra.ai/reference/deployer/cloudflare) | Wire inside `getMastraStorage()` when binding exists | Typegen + runtime | Future |
| F18 | 🟢 | **`.mastra/` gitignored** | `app/.gitignore` | Prevents committing CLI build artifacts | Mastra build output docs | Keep | `git check-ignore .mastra` | No |
| F19 | 🟢 | **`nodejs_compat` present** | `wrangler.jsonc` | Required for OpenNext + many Node deps | CF docs | Keep | Preview boot | No |
| F20 | ⚪ | **Observability enabled** | both wranglers | Logs/traces in dashboard | CF observability | Add alerts (optional) | Dashboard | No |

---

## 6. Option comparison (efficiency ladder)

For each major gap, preferred approach:

| Gap | 1 Dashboard | 2 Wrangler CLI | 3 Mastra module | 4 Official example | 5 Config | 6 Custom code | **Winner** |
|-----|:-----------:|:--------------:|:---------------:|:------------------:|:--------:|:-------------:|------------|
| Deploy operator app | Workers Builds connect Git | `npm run deploy` | CloudflareDeployer ❌ wrong path | OpenNext CF template | `package.json` scripts ✅ | — | **Dashboard Git + existing scripts** |
| Secrets | Secrets UI | `wrangler secret put/bulk` | deployer skips .env ✅ | — | — | — | **Wrangler CLI + Dashboard** |
| Durable storage | Hyperdrive config | `hyperdrive` binding in wrangler | PostgresStore + `disableInit` | Hyperdrive + pg example | `MASTRA_STORAGE_MODE` | Hyperdrive Client in storage.ts | **Wrangler binding + Mastra PostgresStore (IPI-623)** |
| Workers AI inference | AI Gateway dashboard | ai-gateway worker deploy | `cloudflare-workers-ai/...` strings | ai-gateway OpenAI compat ✅ | `AI_ROUTING_MODE=gateway` | — | **Existing ai-gateway Worker (gateway mode)** |
| Auth | Cloudflare Access (optional) | — | `requiresAuth` on Mastra server routes N/A | — | `OPERATOR_AUTH_ENABLED=true` | `withOperatorAuth` ✅ exists | **Env flag + Supabase (already coded)** |
| Rate limiting | WAF rate rules | — | — | — | — | express-rate-limit ❌ not on Workers | **Cloudflare WAF / rate limiting** |
| CI verification | — | `wrangler deploy --dry-run` | — | OpenNext CI docs | GitHub Actions job | — | **CI: opennext build + dry-run** |

**Avoid duplicating:** Cloudflare Git deployments, Wrangler secret management, Cloudflare Access (optional layer), Workers observability, Mastra CloudflareDeployer for the operator app, custom rate-limit middleware when WAF exists.

---

## 7. Additional items to check (not fully verified in this pass)

| Item | Why check | Suggested verification |
|------|-----------|------------------------|
| **OpenNext gzip upload size limit** | Local build can pass while deploy fails | `wrangler deploy --dry-run` after `opennextjs-cloudflare build` |
| **CopilotKit license + thread persistence on Workers** | Gated on `OPERATOR_AUTH_ENABLED` + license token | Enable both on preview; reload thread |
| **OAuth callback on Workers** | PKCE `/auth/callback` under OpenNext | Full login flow on preview URL (IPI-490) |
| **Groq model JSON sync on Workers** | `prebuild` runs `sync-groq-models.mjs` | Agent tool call on preview with `AI_PROVIDER=groq` |
| **Sentry source maps on Worker** | `withSentryConfig` — Worker upload path | Error in preview; check Sentry issue |
| **Cloudflare Images binding usage** | `IMAGES` in typegen | Asset route smoke |
| **Service binding self-reference** | `WORKER_SELF_REFERENCE` | OpenNext incremental cache / middleware |
| **Gradual deployments + rollback** | Production safety | Dashboard deployment history drill |
| **AI Gateway Bearer auth in prod** | `AI_GATEWAY_API_KEY` optional locally | Worker rejects unauthenticated gateway calls |
| **Model registry KV (IPI-469)** | Future runtime tier changes | Not blocking MVP |

---

## 8. Proposed Linear tasks (do not create yet)

### Phase 0 — Repository and configuration cleanup

| Order | Priority | Proposed title | Problem/evidence | Exact implementation | Most efficient method | Dashboard/CLI/module/example | Dependencies | Acceptance criteria | Verification commands | Estimate | Official sources |
|------:|:--------:|----------------|------------------|----------------------|----------------------|------------------------------|--------------|---------------------|----------------------|----------:|------------------|
| 0.1 | 🟡 | **DOCS — Refresh app/AGENTS.md for OpenNext + Postgres/InMemory** | Stale LibSQL / 2-agent claim | Edit `app/AGENTS.md` only | Small config (docs) | — | None | Doc matches `mastra/index.ts` + `storage.ts` | Read diff | 1h | Internal |
| 0.2 | 🟡 | **DOCS — Add Cloudflare secrets section to app/.env.example** | Missing gateway + wrangler secret workflow | Comments in `.env.example`; link to `tasks/cloudflare/cli/cli-setup.md` | Wrangler CLI docs | `wrangler secret bulk` | None | Lists required secrets, no values | — | 1h | [Wrangler secrets](https://developers.cloudflare.com/workers/configuration/secrets/) |
| 0.3 | 🟢 | **Unnecessary if registry stays seed-only — Fix Workers AI model IDs in model-registry.ts** | F10 invalid `-fast` suffix | Update ids in `app/src/lib/ai/model-registry.ts` | Mastra model catalog | Workers AI models page | IPI-457 | IDs match official catalog | Unit test snapshot | 2h | Mastra Workers AI ref |

### Phase 1 — Build and deploy blockers

| Order | Priority | Proposed title | Problem/evidence | Exact implementation | Most efficient method | Dashboard/CLI/module/example | Dependencies | Acceptance criteria | Verification commands | Estimate | Official sources |
|------:|:--------:|----------------|------------------|----------------------|----------------------|------------------------------|--------------|---------------------|----------------------|----------:|------------------|
| 1.1 | 🔴 | **IPI-490 · CF-MIG-210 — Verify OpenNext Runtime Compatibility, OAuth, Streaming and Persistence** | todo.md remote 🔴 | Run preview smoke checklist; fix bundle/runtime issues | OpenNext + Wrangler preview | `npm run preview` | CF-MIG-110 ✅ | CopilotKit agent turn completes on :8787 preview | Document pass/fail | 2–3d | [Workers compat](https://developers.cloudflare.com/workers/configuration/compatibility-dates/) |
| 1.2 | 🔴 | **CI — Add OpenNext Cloudflare build (or dry-run deploy) to GitHub Actions** | F5 CI gap | New job in `.github/workflows/ci.yml` or separate workflow | GitHub Actions | OpenNext docs | None | CI fails if OpenNext build fails | `gh run view` | 4h | OpenNext CF |
| 1.3 | 🟠 | **CF-CICD — Connect ipix-operator repo to Cloudflare Workers Builds** | Manual deploy only | Dashboard Git integration | Cloudflare Dashboard | Workers Builds | 1.1 | Push to main triggers preview/prod | Dashboard build log | 4h | [Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/) |

### Phase 2 — Secrets, authentication, and security

| Order | Priority | Proposed title | Problem/evidence | Exact implementation | Most efficient method | Dashboard/CLI/module/example | Dependencies | Acceptance criteria | Verification commands | Estimate | Official sources |
|------:|:--------:|----------------|------------------|----------------------|----------------------|------------------------------|--------------|---------------------|----------------------|----------:|------------------|
| 2.1 | 🔴 | **SEC — Enable operator auth on Cloudflare (`OPERATOR_AUTH_ENABLED=true`)** | F4 default false | Wrangler secret + var; middleware already exists | Wrangler secret | `withOperatorAuth` | Supabase login wired | Unauthed `/api/copilotkit` → 401 | curl test | 2h | Mastra auth note |
| 2.2 | 🟠 | **SEC — Rate limit public `/api/marketing-chat`** | F6 no limit | Cloudflare WAF rate rule | Dashboard | WAF rate limiting | None | 429 after threshold | load test | 2h | CF WAF docs |
| 2.3 | 🟠 | **SEC — Restrict marketing CORS origins in production** | `cors: true` | Env-gated origin allowlist in `marketing-chat/route.ts` | Small config | — | None | Preflight from allowed origin only | Browser devtools | 3h | — |
| 2.4 | 🟡 | **SEC — Document wrangler secret set for GEMINI/GROQ/SUPABASE** | F8 | Runbook in `tasks/cloudflare/cli/` | Wrangler CLI | `wrangler secret list` | None | Runbook complete | Manual audit | 2h | [Secrets](https://developers.cloudflare.com/workers/configuration/secrets/) |

### Phase 3 — External storage and observability

| Order | Priority | Proposed title | Problem/evidence | Exact implementation | Most efficient method | Dashboard/CLI/module/example | Dependencies | Acceptance criteria | Verification commands | Estimate | Official sources |
|------:|:--------:|----------------|------------------|----------------------|----------------------|------------------------------|--------------|---------------------|----------------------|----------:|------------------|
| 3.1 | 🔴 | **IPI-227 · MASTRA-SUPABASE-001 — Supabase migration + disableInit** | j16-mastra-supabase.md | Migration + `storage.ts` `disableInit: true` | Supabase migration + Mastra PostgresStore | `@mastra/pg` | None (Node path) | `mastra dev` boots without 42501 | `mastra dev` | 2d | Mastra postgres ref |
| 3.2 | 🔴 | **IPI-619 · CF-DB-005 — Hyperdrive binding on ipix-operator** | F7 no binding | Add `hyperdrive` to `app/wrangler.jsonc`; `wrangler types` | Wrangler + Dashboard | Hyperdrive | IPI-618 ✅ | Typegen shows binding | `npm run cf-typegen` | 4h | [Hyperdrive binding](https://developers.cloudflare.com/hyperdrive/) |
| 3.3 | 🔴 | **IPI-623 · CF-DB-009 — One Mastra workload on Hyperdrive** | F2/F3 ephemeral memory | PostgresStore via Hyperdrive Client in `storage.ts`; remove noop var | Mastra PostgresStore + Hyperdrive | CF Hyperdrive docs | 3.1, 3.2, 1.1 | Write→immediate read survives restart | Preview smoke | 3d | Mastra CF external storage |
| 3.4 | 🟡 | **OBS — Alerting on Worker errors + AI gateway 5xx** | Observability on but no alerts | Dashboard notification policies | Dashboard | Workers observability | Deploy exists | Alert fires on test error | Inject error | 2h | CF observability |

### Phase 4 — Preview and production environments

| Order | Priority | Proposed title | Problem/evidence | Exact implementation | Most efficient method | Dashboard/CLI/module/example | Dependencies | Acceptance criteria | Verification commands | Estimate | Official sources |
|------:|:--------:|----------------|------------------|----------------------|----------------------|------------------------------|--------------|---------------------|----------------------|----------:|------------------|
| 4.1 | 🟠 | **INFRA — Wrangler preview environment for ipix-operator** | F13 single env | `env.preview` block + separate secrets | Wrangler environments | [Wrangler envs](https://developers.cloudflare.com/workers/wrangler/environments/) | 1.1 | Two workers in dashboard | `wrangler deploy --env preview` | 4h | Wrangler |
| 4.2 | 🟡 | **INFRA — Custom domain + routes for operator Worker** | No routes in wrangler | Dashboard custom domain or wrangler routes | Dashboard | CF DNS | 4.1 | `/app` on prod domain | Browser | 2h | Wrangler routes |

### Phase 5 — Automated tests and deployment verification

| Order | Priority | Proposed title | Problem/evidence | Exact implementation | Most efficient method | Dashboard/CLI/module/example | Dependencies | Acceptance criteria | Verification commands | Estimate | Official sources |
|------:|:--------:|----------------|------------------|----------------------|----------------------|------------------------------|--------------|---------------------|----------------------|----------:|------------------|
| 5.1 | 🟠 | **TEST — Extend CF-MIG-210 smoke script (CopilotKit + health)** | Partial coverage | Script under `scripts/` or `tasks/cloudflare/tests/` | Small config + script | Existing `/api/ai/health` | 1.1 | Script exits 0 on preview | `node scripts/...` | 1d | — |
| 5.2 | 🟡 | **TEST — Hyperdrive persistence integration test** | None for IPI-623 | Vitest or smoke against preview | Custom test | — | 3.3 | Thread survives redeploy | CI optional | 1d | — |
| 5.3 | 🟢 | **Already correct — storage.test.ts noop path** | Tests exist | No change | — | — | — | — | `npm test storage.test.ts` | 0 | — |

### Phase 6 — Monitoring, rollback, and documentation

| Order | Priority | Proposed title | Problem/evidence | Exact implementation | Most efficient method | Dashboard/CLI/module/example | Dependencies | Acceptance criteria | Verification commands | Estimate | Official sources |
|------:|:--------:|----------------|------------------|----------------------|----------------------|------------------------------|--------------|---------------------|----------------------|----------:|------------------|
| 6.1 | 🟠 | **RUNBOOK — Rollback procedure for ipix-operator** | F20 no runbook | Markdown in `tasks/cloudflare/` | Dashboard rollback | [Versions & deployments](https://developers.cloudflare.com/workers/configuration/versions-and-deployments/) | 1.3 | Rollback tested once | Dashboard | 2h | CF docs |
| 6.2 | 🟡 | **IPI-454 · CF-AI-001 AC-F — Gateway default for safe tiers** | Direct Gemini on Worker today | `AI_ROUTING_MODE=gateway` prod var | Env + existing code | `resolveModel()` | ai-gateway deployed | Integration test green | `npm test provider.test.ts` | 1d | MASTRA-EPIC |
| 6.3 | 🟡 | **IPI-462 · CF-AI-006 — AI provider evaluation before Workers AI default** | Epic gate | Eval harness | — | Workers AI docs | 6.2 | Sign-off doc | — | 3d | CF Workers AI |

**Parallel tracks:** Phase 0 anytime · Phase 1 ∥ Phase 2 (partial) · Phase 3.1 (Supabase) ∥ Phase 1 · Phase 3.2–3.3 after 1.1 · Phase 6.2 after gateway stable.

---

## 9. Package and command evidence

```text
# Versions (2026-07-16, app/)
mastra@1.1.0-alpha.3
@mastra/core@1.41.0
@mastra/pg@1.12.0
@opennextjs/cloudflare@1.20.1
wrangler@4.110.0
@mastra/deployer-cloudflare — NOT installed (intentional)

# Key files
app/wrangler.jsonc          — OpenNext worker config
app/open-next.config.ts     — defineCloudflareConfig({})
app/package.json            — preview | deploy | upload scripts
app/src/mastra/storage.ts   — InMemoryStore vs PostgresStore gate
app/src/mastra/index.ts     — getMastra() Proxy; no deployer
services/cloudflare-worker/ — ai-gateway (Workers AI)
```

---

## 10. Improvements (non-blocking)

1. **Remove unused LibSQL deps** after confirming no imports (`@mastra/libsql` externalized but still installed).
2. **Add `keep_vars: true`** to operator `wrangler.jsonc` if dashboard vars get wiped on deploy (pattern already in ai-gateway).
3. **Wire `AI_ROUTING_MODE=gateway` in production** once IPI-462 passes — keeps `GEMINI_API_KEY` off Worker where possible.
4. **Cloudflare Access** in front of preview URLs — optional zero-code layer for internal QA.
5. **Unify model registry** — single SSOT between `app/src/lib/ai/model-registry.ts` and `services/cloudflare-worker/src/model-registry.ts` (today they diverge: llama-3.1 vs llama-4-scout).
6. **Add readiness endpoint** — extend `/api/ai/health` to report Mastra storage mode + auth flag (no secrets).

---

## 11. Required final assessment

| Question | Answer |
|----------|--------|
| **Overall correctness** | **62%** — architecture choice is sound; storage, auth, CI, and env docs lag |
| **Production-readiness** | **38%** |
| **P(deploy succeeds without changes)** | **~65%** for a smoke deploy with manually configured secrets; **~15%** for production-grade |
| **Critical blockers** | **4** (F2 durable storage path, F4 auth, F5 CI OpenNext, F9 runtime proof — count F2+F4+F5+F9) |
| **High-risk findings** | **8** (F6–F12) |
| **Minimum tasks before first deployment** | **1.1** (IPI-490 smoke) + **2.4** (secrets runbook) + **1.2** or manual `npm run deploy` verification |
| **Minimum tasks before production** | **1.1, 1.2, 2.1, 2.2, 3.1, 3.2, 3.3, 4.1, 5.1, 6.1** (+ IPI-454/462 for gateway defaults) |
| **Already correct** | OpenNext path, `nodejs_compat`, observability flag, IPI-490 InMemoryStore mitigation, CopilotKit fetch handler, gitignore `.mastra`/`.open-next`, ai-gateway separation, gateway opt-in code + tests |
| **Top 5 immediate corrections** | 1) Complete **IPI-490** preview smoke · 2) Add **OpenNext build to CI** · 3) **`wrangler secret`** for GEMINI/Supabase before deploy · 4) **`OPERATOR_AUTH_ENABLED=true`** on any non-dev deploy · 5) **Rate-limit** `/api/marketing-chat` |
| **Recommended execution order** | IPI-490 → CI OpenNext → secrets runbook → enable operator auth → IPI-619 Hyperdrive bind → IPI-227 + IPI-623 storage → preview env → gateway eval (IPI-454/462) |

### Verdict: 🟠 **Deployable after blockers** (preview/smoke with manual secrets) · 🔴 **Not production-ready**

---

## 12. Cross-link: Supabase storage audit

Durable Mastra memory on **Node** (`next dev`, future Hyperdrive-backed Workers) depends on **[IPI-227 · MASTRA-SUPABASE-001](./j16-mastra-supabase.md)** (`disableInit`, migration, grants/RLS). Cloudflare Workers **today** intentionally bypass Postgres via `MASTRA_STORAGE_MODE=noop` until **IPI-623 · CF-DB-009** completes.

---

## 13. Official documentation index (verified 2026-07-16)

| Topic | URL | Status |
|-------|-----|:------:|
| Mastra llms index | https://mastra.ai/llms.txt | ✅ |
| Mastra deploy to Cloudflare (guide) | https://mastra.ai/guides/deployment/cloudflare | ✅ |
| CloudflareDeployer reference | https://mastra.ai/reference/deployer/cloudflare | ✅ |
| Mastra web framework deployment | https://mastra.ai/docs/deployment/web-framework.md | ✅ (via llms.txt) |
| Cloudflare Workers | https://developers.cloudflare.com/workers/ | ✅ |
| Wrangler configuration | https://developers.cloudflare.com/workers/wrangler/configuration/ | ✅ |
| Workers secrets | https://developers.cloudflare.com/workers/configuration/secrets/ | ✅ |
| Workers AI | https://developers.cloudflare.com/workers-ai/ | ✅ |
| Hyperdrive | https://developers.cloudflare.com/hyperdrive/ | ✅ |
| Mastra `/docs/deployment/cloudflare` | https://mastra.ai/docs/deployment/cloudflare | ❌ 404 — use guide + reference |

---

**Next recommended task:** **IPI-490 · CF-MIG-210 — Verify OpenNext Runtime Compatibility, OAuth, Streaming and Persistence**
