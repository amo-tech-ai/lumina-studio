# Cloudflare AI Gateway Worker — real-world verification

**Date:** 2026-07-10  
**Prompt:** `tasks/cloudflare/prompts/test-real.md`  
**Baseline:** `origin/main` @ `c9086000` (`IPI-492 · CF-AI-004c` / #319)  
**Worktree:** `/home/sk/wt-cf-worker-real-verify`  
**Scope:** Prove local Worker + app health path. No production deploy. No merge. No production code changes.

**Tools used:** Wrangler, OpenNext, Vitest, Playwright (Chromium), Linear MCP (`IPI-472`). Chrome DevTools / browser MCP **unavailable** in this session — Playwright CLI used instead.

---

## Stage 1 — Clean baseline

| Check | Result |
|-------|--------|
| `git fetch` + worktree @ `origin/main` | Pass — `c9086000` |
| Ports cleared before run | Pass (8787 Worker; Next started on **3010** alone — `npm run dev -- --port 3010` is ignored by scripts and still binds **3002**) |

---

## Stage 2 — Static gates

| Gate | Result | Notes |
|------|--------|-------|
| `services/cloudflare-worker` `npm test` | **Pass** | **51/51** |
| `npx wrangler deploy --dry-run` | **Pass** | Bundle OK |
| `app` `npm run typecheck` | **Pass** | |
| `app` `npm run lint` | **Pass** | |
| `app` `npm test` | **Pass** | **1093 passed, 6 skipped** |
| `CI=true npm run build` | **Pass** | Required real `npm ci` in worktree (symlink `node_modules` broke Turbopack) |
| `CI=true npx opennextjs-cloudflare build` | **Pass** | Exit 0; some package copy warnings, Worker artifact saved |

---

## Stage 3 — Runtime processes

| Process | Command | Port | Status |
|---------|---------|------|--------|
| AI Gateway Worker | `npx wrangler dev --port 8787` | 8787 | Running |
| Next.js (UI only) | `AI_GATEWAY_URL=http://127.0.0.1:8787 npx next dev --turbopack -p 3010` | 3010 | Running |

Note: full `npm run dev` also starts Mastra on a second process and hardcodes UI to **3002**. For gateway health proof, Next-only on **3010** is sufficient.

---

## Stage 4 — Core Worker probes

| Probe | Result | Evidence |
|-------|--------|----------|
| `GET /health` | **Pass** | `200` `{"status":"ok","service":"ai-gateway"}` |
| App `GET /api/ai/health` | **Pass** | `200` `status=ok`, `gatewayUrl=http://127.0.0.1:8787`, nested gateway ok, `adapterAvailable=true` |
| Empty embed | **Pass** | `400` `invalid_request` |
| Wrong embed model | **Pass** | `400` `unsupported_embedding_model` |
| Valid embed | **Pass** | `200`, **768-d** BGE |
| Batch embed | **Pass** | `200`, **two** 768-d vectors |
| Chat (`fast`) | **Pass** | `200`, content e.g. `PONG` / adapter `ADAPTER_OK` |
| Structured (adapter) | **Pass** | `createProviderAdapter().structured` → `{ a: 1, b: 2 }` |
| Structured (raw `model:"structured"`) | **Fail** | Worker maps tier → `gemini-3.1-pro-preview` → provider remaps to `gemini-3.1-pro-preview-002` → Gemini **404** → Worker **502** |
| `chatStream` | **Pass** | SSE chunks + `[DONE]`; content `STREAM_OK` |
| Cancellation | **Partial** | Client abort (`curl -m`) stops waiting; Worker stays healthy. No app-level AbortController product path exercised |
| Timeout | **Partial** | Client timeout only; Worker may still finish upstream. Not a Worker-enforced deadline proof |
| Secrets in logs / health | **Pass** | No API keys in health JSON or Wrangler info lines |
| Wrangler traffic logs | **Yes** | `GET /health`, `POST /v1/chat/completions`, embeddings visible |

### Confirmed bug (not fixed in this run)

**Worker `structured` tier model ID is dead.**  
Registry: `gemini-3.1-pro-preview` → Gemini provider map: `gemini-3.1-pro-preview-002` → API 404.  
App adapter avoids this by sending `gemini-3.1-flash-lite` when `AI_MODEL_STRUCTURED` is unset (`modelForTier`).  
**Do not treat raw `/v1/chat/completions` with `model: "structured"` as green until registry/map is updated.**

---

## Stage 5 — Real journey tests

| Journey | Result | Notes |
|---------|--------|-------|
| **J11 · AI Gateway Health** | **Pass** | Playwright: home loads; in-page `fetch('/api/ai/health')` → 200 + Worker nested ok; no secrets |
| **J09 · Embeddings / Asset Search** | **Partial / Pass (API)** | Adapter + Worker embed contracts green (768-d). Browser→Worker blocked by **CORS** (expected — product path is server-side). Product similarity search UI still **IPI-474** |
| **J08 · Marketing / Operator Fast Chat** | **Partial** | Marketing UI loads. `NEXT_PUBLIC_MARKETING_CHAT_ENABLED` defaults **false** (no Copilot popup). Mastra `resolveModel('fast')` on `main` still **direct** (AC-F / #317 not required for this baseline). Gateway `fast` chat proven via **adapter + Worker**, not via CopilotKit UI |

**Not tested:** Booking through gateway (explicitly out of scope).

**Browser console:** HMR WebSocket noise + intentional CORS from J09 probe. No product-breaking app errors on health path.

---

## Stage 6 — Environment truth

| Level | Result |
|-------|--------|
| Unit Verified | **Pass** (Worker 51/51; app 1093 passed) |
| Build Verified | **Pass** (Next + OpenNext) |
| Local Worker Verified | **Pass** (health, embed, chat, stream; structured via adapter) |
| Browser Journey Verified | **Partial** (J11 Pass; J09 API-only; J08 UI without gateway Copilot path) |
| Remote Preview Verified | **Not run** |
| Production Verified | **Not run** |

---

## Stage 7 — Remote preview readiness (**IPI-472 · INFRA-001**)

Linear: [IPI-472](https://linear.app/amo100/issue/IPI-472) — status **In Progress**. AC checkboxes still open.

| Need | Present? |
|------|----------|
| Preview Worker URL | **No** — `wrangler deployments list` → Worker `ai-gateway` **does not exist** on account (code 10007) |
| Runtime secrets in CF | **No** (local `.dev.vars` only for this proof) |
| Documented `AI_GATEWAY_URL` for preview | Spec only; no live URL |
| Smoke-test workflow for gateway deploy | **Missing** as automated remote gate |
| Rollback instructions | Spec in issue; **not tested** |
| Logs / observability (prod) | Local Wrangler only |

**Stop after local verification.** Remote preview is blocked on **IPI-472 · INFRA-001**.

---

## Final report

| Item | Result |
|------|--------|
| Worker tests | **Pass** — 51/51 |
| Dry-run deploy | **Pass** |
| OpenNext build | **Pass** |
| Worker health | **Pass** |
| App health | **Pass** |
| Chat | **Pass** (Worker + adapter) |
| Structured | **Pass** (adapter) / **Fail** (raw tier `structured`) |
| Streaming | **Pass** |
| Embeddings | **Pass** |
| Invalid input handling | **Pass** |
| Cancellation/timeout | **Partial** |
| J11 health journey | **Pass** |
| J09 embedding journey | **Partial** (API Pass; product search N/A) |
| J08 fast-chat journey | **Partial** (gateway via adapter; marketing Copilot off / Mastra direct) |
| Wrangler logs confirm traffic | **Yes** |
| Remote preview ready | **No** |
| Critical blockers | 1) **IPI-472** — no remote `ai-gateway` Worker / preview URL / smoke pipeline 2) Raw Worker `structured` model 404/502 3) Mastra→gateway product path still AC-F / marketing chat flag 4) Chrome MCP unavailable (Playwright used) |
| **Cloudflare Worker actually working** | **Partial → Yes locally** |

### Verdict

The AI Gateway Worker **works for real local traffic**: health, embeddings (incl. validation), chat, and streaming are proven against Wrangler, and the Next app’s `/api/ai/health` reaches that Worker. It is **not** production- or preview-verified. Structured via the **adapter** works; the Worker’s own `structured` registry model is broken. End-to-end marketing Copilot → gateway was **not** exercised on this baseline.

---

## Reproduce

```bash
# Terminal A
cd /home/sk/wt-cf-worker-real-verify/services/cloudflare-worker
npx wrangler dev --port 8787

# Terminal B
cd /home/sk/wt-cf-worker-real-verify/app
AI_GATEWAY_URL=http://127.0.0.1:8787 npx next dev --turbopack -p 3010

# Probes
curl -sS http://127.0.0.1:8787/health
curl -sS http://127.0.0.1:3010/api/ai/health
```
