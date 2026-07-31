---
title: "Cloudflare — Migration & Feature Adoption Report"
version: "1.0"
lastUpdated: "2026-07-31"
status: Active
purpose: "What runs on Cloudflare today, what it takes to move off Vercel, and which Cloudflare services would delete custom code."
ssot: ../../../tasks/cloudflare/todo.md
verifiedAgainst: "app/wrangler.jsonc · services/cloudflare-worker/wrangler.jsonc · Cloudflare API (D1 list) · app/package.json scripts"
verifiedAt: "2026-07-31"
scores: { core: 40, advanced: 25, overall: 34 }
---

# Cloudflare — 34/100 (D) 🔴

**One-line problem:** the migration is half done and has been for a while.
Bindings are configured, the adapter is installed, CI never deploys it.

> **Say this correctly.** *Not* "Cloudflare is 0% live" — the AI Gateway Worker is
> the only real production AI path. *Not* "the app is on Workers" — it's on Vercel.
> Both halves of that sentence get misquoted constantly.

---

## 1. What's live

| Piece | Platform | Live? | Evidence |
|-------|----------|:-----:|----------|
| `ai-gateway` Worker | Cloudflare | 🟡 | Deployed, but **opt-in**: `AI_ROUTING_MODE` defaults to `direct` (`app/src/lib/ai/provider.ts:90`). Even in `gateway` mode only the `fast` tier routes by default — tool tiers need `AI_GATEWAY_ALLOW_TOOL_TIERS=1`, vision stays direct. Production routing value unverified |
| Operator app | **Vercel** | 🟢 | no Workers deploy job in `.github/workflows/ci.yml` |
| OpenNext build | Cloudflare | 🔴 | `npm run build:cf` works; nothing runs it in CI |
| Workers AI binding | Cloudflare | 🟡 | bound as `AI`, used via `workers-ai-provider` |
| Hyperdrive | Cloudflare | 🟡 | bound as `HYPERDRIVE_FRESH`, id `f594218…` — **bind-only** |
| D1 / KV / R2 / Queues / DO | — | ⚪ | **0 D1 databases** (API-verified); KV block commented out |

---

## 2. Bindings in `app/wrangler.jsonc`

| Binding | Type | Configured | Read at runtime? |
|---------|------|:----------:|:----------------:|
| `ASSETS` | Static assets | ✅ | via OpenNext |
| `WORKER_SELF_REFERENCE` | Service | ✅ | via OpenNext |
| `IMAGES` | Cloudflare Images | ✅ | ❌ — Cloudinary does media |
| `AI` | Workers AI | ✅ | 🟡 `workers-ai-provider` |
| `HYPERDRIVE_FRESH` | Hyperdrive → Supabase | ✅ | ❌ bind-only (IPI-619 scoped it that way; query helper is IPI-620) |
| `observability` | Workers Logs | ✅ | ✅ `head_sampling_rate: 1` |

**`IMAGES` is worth a decision.** It's configured and unused because Cloudinary
owns media. Either drop the binding or write down why it's reserved — an
unexplained binding is the kind of thing that gets "fixed" by someone later.

---

## 3. Vercel → Workers: the real steps

| # | Step | Status | The actual blocker here |
|:-:|------|:------:|-------------------------|
| 1 | Install `@opennextjs/cloudflare` + `wrangler` | 🟢 | done — 1.20.2 / ^4.107.1 |
| 2 | `wrangler.jsonc` with `nodejs_compat` + compat date | 🟢 | done — `2026-07-08` |
| 3 | `open-next.config.ts` | 🟡 | verify incremental cache config |
| 4 | **Worker bundle under limit** | 🔴 | **Measured: 8.985 MiB gzip against a 9.0 MiB hard-fail CI gate** — 0.015 MiB of headroom (`tasks/cloudflare/todo.md`, 2026-07-24, IPI-706 🟡). Root cause: `@copilotkit/react-core → streamdown → mermaid/cytoscape/katex` + `@copilotkit/web-inspector`, none used directly in `src`. Fix in flight via `next/dynamic(..., {ssr:false})` |
| 5 | Mastra + `@mastra/pg` in Workers runtime | 🔴 | Postgres driver on `nodejs_compat`; this is why Hyperdrive was provisioned |
| 6 | Supabase SSR auth on Workers | 🟡 | cookie handling differs from Node |
| 7 | Env/secrets parity | 🟡 | `cloudflare-secrets-sync.yml` exists (`worker-bootstrap` job) |
| 8 | Preview deploy + smoke | 🔴 | `npm run preview` never run in CI |
| 9 | CI deploy job | 🔴 | doesn't exist |
| 10 | DNS cutover + rollback plan | ⚪ | not written |

**Fastest honest path:** steps 4 and 5 decide everything. If the bundle can't fit
or `@mastra/pg` won't run, the answer is "stay on Vercel and stop hedging in the
docs" — which is a perfectly good outcome, just one nobody has written down.

### 🔴 Four cutover gates at 0%, and one that isn't on this list

`tasks/cloudflare/todo.md` (2026-07-24) scores the **hosting lane at ~70%** —
architecture and preview are proven. What's stalled is the safety work:

| Issue | Gate | State |
|-------|------|:-----:|
| IPI-708 | Rollback rehearsal | 🔴 0%, 6+ days stale |
| IPI-709 | Observability baseline + Sentry CI token | 🔴 0% |
| IPI-707 | Automated Playwright preview smoke | 🔴 0% |
| IPI-763 | Branch protection residual | 🔴 0% |

All four block **IPI-631 (DNS cutover)**. Do not start 631 before they're Done.

⚠️ **IPI-763 is worse than a cutover gate.** `main` currently has **zero branch
protection** — confirmed via `gh api .../branches/main/protection` → 404. So
`CLAUDE.md`'s first hard rule ("🚫 NEVER push directly to `main`") is enforced by
nothing. That is a one-screen dashboard fix and the highest-value item in this
report.

**IPI-708 needs no design work either:** `wrangler versions rollback` is built in.
See [`BUILD-VS-BUY.md`](../BUILD-VS-BUY.md) §1.

---

## 4. Dashboard vs CLI vs MCP — which to use

| Task | Best tool | Why |
|------|-----------|-----|
| Create D1 / KV / R2 / Hyperdrive | **Dashboard** | One-time, needs the ID pasted into config anyway |
| Deploy / preview / tail logs | **Wrangler CLI** | `wrangler deploy`, `wrangler tail`, `wrangler versions upload` |
| Generate binding types | **Wrangler CLI** | `npm run cf-typegen` — already wired into `typecheck` |
| Read config / list resources / audit | **MCP** | `workers_list`, `d1_databases_list`, `hyperdrive_configs_list` — no context switch |
| Search Cloudflare docs | **MCP** | `search_cloudflare_documentation` beats web search for this |
| Secrets | **CLI + GH Actions** | `wrangler secret put`; `cloudflare-secrets-sync.yml` |
| Debug a live request | **Dashboard** | Workers Logs UI; sampling is already at 100% |

⚠️ **`keep_vars: true` is set deliberately** in the gateway worker config — an empty
local `vars` block previously wiped `MODEL_REGISTRY_OVERRIDE` and caused a Gemini
403. Set overrides in the dashboard, not in `wrangler.jsonc`.

---

## 5. Suggested additional Cloudflare services

| Service | iPix use case | Deletes | Priority |
|---------|---------------|---------|:--------:|
| **Workflows** | Brand-intelligence crawl → extract → enrich → approve, with retries and durable state | The `wait-for-crawl` polling step in `brand-intelligence-workflow.ts:175` | 🔴 High |
| **Queues** | Asset DNA audit fan-out; Firecrawl webhook processing | `processed_firecrawl_webhooks` dedupe table | 🟡 Med |
| **Durable Objects** | Live shoot-day coordination — multiple crew on one shot list | Would enable a feature we don't have | 🟡 Med |
| **Vectorize** | Alternative to pgvector for talent/brand search | Nothing — pgvector is already installed. **Prefer Supabase here** | ⚪ Skip |
| **Browser Rendering** | Screenshots for `visual-identity` | The Firecrawl dependency in `visual-identity.ts:52` | 🟡 Med |
| **Cron Triggers** | Nightly DNA re-scores | A GitHub Actions schedule | 🟢 Low |
| **Images** | Already bound, unused | Would compete with Cloudinary | ⚪ Decide |
| **AI Search / AutoRAG** | Shot-reference library retrieval | Custom `lookupShotReferences` SQL | 🟢 Low |

**Workflows is the standout.** `brand-intelligence-workflow.ts` has a
`wait-for-crawl` step — polling for an external job to finish. That is precisely
what Cloudflare Workflows exists to replace: durable, resumable, automatic retry.

---

## 6. Progress tracker

| ID | Task | | % | Examine | Verify | Blocker |
|----|------|:-:|--:|---------|--------|---------|
| CF-01 | AI Gateway Worker | 🟢 | 90 | `services/cloudflare-worker/` | `npm run verify:cloudflare-gateway` | frozen for new features |
| CF-02 | Workers AI binding | 🟡 | 60 | `wrangler.jsonc` `ai` | `ENABLE_CF_AI_SMOKE=1` | — |
| CF-03 | OpenNext build | 🟡 | 55 | `npm run build:cf` | local run | never in CI |
| CF-04 | Worker bundle size (IPI-706) | 🔴 | 20 | `check-worker-bundle-size.mjs` | `npm run check:worker-bundle` | **8.985 / 9.0 MiB** — 0.015 headroom |
| CF-11 | Branch protection on `main` (IPI-763) | 🔴 | 0 | GitHub settings | `gh api .../branches/main/protection` → 404 | none — one dashboard screen |
| CF-12 | Rollback rehearsal (IPI-708) | 🔴 | 0 | — | `wrangler versions rollback` | blocks IPI-631 |
| CF-05 | Hyperdrive query path | 🔴 | 45 | `HYPERDRIVE_FRESH` | `ENABLE_HYPERDRIVE_PG_SMOKE=1` | IPI-620 |
| CF-06 | Preview deploy | 🔴 | 0 | `npm run preview` | — | — |
| CF-07 | CI deploy job | 🟡 | 40 | `cloudflare-secrets-sync.yml` — `build:cf`, Worker upload, optional promote | `workflow_dispatch` | Manual only, not PR CI |
| CF-08 | Secrets sync | 🟡 | 60 | `cloudflare-secrets-sync.yml` | workflow run | — |
| CF-09 | Workflows adoption | ⚪ | 0 | — | — | not scoped |
| CF-10 | Queues adoption | ⚪ | 0 | — | — | not scoped |

---

## 7. Next 5 tasks

| # | Task | Effort | Why |
|:-:|------|:------:|-----|
| 1 | **Enable branch protection on `main` (IPI-763)** | 5 min | A hard rule with zero enforcement; also a cutover gate |
| 2 | Close IPI-708 with `wrangler versions rollback` | 30 min | Built-in. No rollback process to design |
| 3 | Bundle fix via `next/dynamic`, then delete the 4 `cf-*-stub.mjs` files | M | 0.015 MiB of headroom; the stubs are config debt |
| 4 | Copy the Playwright harness from `cloudflare/templates` for IPI-707 | M | Don't write an E2E suite the vendor ships |
| 5 | Cloudflare go / no-go decision, written down | S | Unblocks a dozen docs that currently hedge |

---

## 8. Sources

- [Workers](https://developers.cloudflare.com/workers/) · [Workers AI](https://developers.cloudflare.com/workers-ai/) · [Next.js framework guide](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/)
- [OpenNext Cloudflare](https://opennext.js.org/cloudflare) · [get started](https://opennext.js.org/cloudflare/get-started) · [opennextjs/opennextjs-cloudflare](https://github.com/opennextjs/opennextjs-cloudflare)
- Local SSOT: `tasks/cloudflare/todo.md` · skill: `/cloudflare`
