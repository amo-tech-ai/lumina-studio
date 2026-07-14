# Post-Merge Verification — PR #302 + PR #310

**Date:** 2026-07-10  
**Probe base:** `origin/main` @ `44b8daca` (worktree `/home/sk/wt-verify-pr310-302`)  
**Tasks:**
- **IPI-457 · CF-AI-005 — Unified AI Provider Types & Registry** (PR #302)
- **IPI-461 · CF-AI-004 — AI Provider Adapter Runtime Integration** (PR #310)

**Did not change:** `resolveModel()`, Mastra agents, CopilotKit routing, **IPI-454 · CF-AI-001** AC-F.

---

## Executive verdict

| Task | Composite | Safe Done? | Why |
|------|----------:|:----------:|-----|
| **IPI-457 · CF-AI-005** | **96** | ✅ Yes | Types + registry + adapter contract on `main`; CI green; no duplicates |
| **IPI-461 · CF-AI-004** | **78** | 🟡 Hold | App adapter + `/api/ai/health` work; **live `chat()` / `structured()` / `embed()` fail** against local Worker |

> Health `200` alone is **not** enough for IPI-461 Done. Stream + cancel + timeout pass; non-stream chat is broken in the **Worker Gemini provider** (`alt=sse` on `generateContent`).

---

## Merge state

| Check | Result | Evidence |
|-------|--------|----------|
| PR #302 merged | ✅ Yes | `1412de3a` — `feat(ipi-457): unified AI provider types & model registry (#302)` |
| PR #302 CI | ✅ Pass | [run 29100753041](https://github.com/amo-tech-ai/lumina-studio/actions/runs/29100753041) |
| PR #310 merged | ✅ Yes | `44b8dacae` — `IPI-461 · CF-AI-004 — AI Provider Adapter Runtime Integration (#310)` |
| PR #310 CI | ✅ Pass | [run 29106115582](https://github.com/amo-tech-ai/lumina-studio/actions/runs/29106115582) |
| Files on `main` | ✅ | `model-registry.ts`, `provider-adapter.ts`, `api/ai/health/route.ts` (+ tests) |

---

## Static validation (`origin/main`)

| Command | Result |
|---------|--------|
| `npm run typecheck` | ✅ Pass |
| `npm run lint` | ✅ Pass |
| `npx vitest run src/lib/ai/provider-adapter.test.ts` | ✅ **23** passed |
| `npx vitest run src/app/api/ai/health/route.test.ts` | ✅ **3** passed |
| Focused total | ✅ **26** |
| `npm test` | ✅ **1052** passed, **6** skipped (142 files) |
| `CI=true npm run build` | ✅ Pass (route `/api/ai/health` present) |
| `provider.test.ts` (`resolveModel`) | ✅ **20** passed — still gemini/groq only |

**Note:** First build attempt failed because `node_modules` was a symlink outside the worktree root (Turbopack). Hardlink copy fixed it — environment issue, not product code.

---

## Type / architecture probes (IPI-457)

| Item | Result | Notes |
|------|--------|-------|
| `model-registry.ts` loads | ✅ Pass | On `main` |
| `provider-adapter.ts` compiles | ✅ Pass | typecheck + build |
| `AiProvider` includes live providers | ✅ Pass | gemini, groq, openai, workers-ai, nvidia, openai-compatible, mock |
| `GroqModelTier` strongly typed | ✅ Pass | `types.ts` |
| `ModelTier` one SSOT (app) | ✅ Pass | `"default" \| "fast" \| "structured" \| "vision" \| "embedding"` |
| No `@ts-ignore` / `as any` in `app/src/lib/ai` | ✅ Pass | rg clean |
| Duplicate adapter | ✅ No | Only `provider-adapter.ts` + health consumer |
| Duplicate registry | 🟡 Partial | App `model-registry.ts` **≠** Worker `services/cloudflare-worker/src/model-registry.ts` (known; not IPI-457 AC) |
| `resolveModel()` uses adapter | ✅ Intentionally pending | Error text points to AC-F / `providerAdapter` |
| Runtime wiring (Mastra/CopilotKit) | ✅ Intentionally pending | **IPI-454 · CF-AI-001** AC-F |

---

## Live runtime (IPI-461)

**Setup:** Node 22 required for Wrangler 4.107 (`npx wrangler` fails on Node 20).  
Next on `:3010` ( `:3002` occupied by unrelated SCR-31 worktree without health route).  
Worker: `wrangler dev --port 8787` with gitignored `.dev.vars` (`GEMINI_API_KEY`, `CLOUDFLARE_*`).

### Health matrix

| Probe | Result | Body |
|-------|--------|------|
| `GET :8787/health` | ✅ | `{"status":"ok","service":"ai-gateway"}` |
| `GET :3010/api/ai/health` (gateway up) | ✅ | `status:ok`, `gatewayUrl:http://127.0.0.1:8787`, `adapterAvailable:true` |
| Same after killing Worker | ✅ | HTTP **503**, `status:gateway_unreachable`, `adapterAvailable:true` |

### `createProviderAdapter()` → live Worker

| Method | Result | Evidence |
|--------|--------|----------|
| `chat()` | 🔴 **Fail** | `502` — `Unexpected token 'd', "data: {"ca"... is not valid JSON` |
| `chatStream()` | ✅ Pass | Text `PONG`; Worker log `200` |
| `structured()` | 🔴 **Fail** | Same SSE/JSON parse error as `chat()` |
| `embed()` | 🔴 **Fail** | `502` — `Workers AI embedding error 400` |
| Stream cancel | ✅ Pass | Cancel after first chunk |
| Timeout (`timeoutMs: 1`) | ✅ Pass | `Gateway timeout after 1ms` |
| Non-2xx (`POST /v1/nope`) | ✅ Pass | `404` |
| Requests in Worker logs | ✅ Yes | GET/POST lines observed in wrangler output |

### Config checks

| Item | Result |
|------|--------|
| Default URL `http://localhost:8787` | ✅ `DEFAULT_AI_GATEWAY_URL` |
| `AI_GATEWAY_URL` override | ✅ Health used `http://127.0.0.1:8787` |
| `AI_GATEWAY_API_KEY` attached when set | ✅ Unit tests; live run had `hasApiKey:false` (unset) |
| Secrets not logged | ✅ Wrangler shows `(hidden)` |
| Malformed / error messages clear | ✅ Adapter prefixes `chat completion failed: 502 …` |

### Scope boundary

| Claim | Result |
|-------|--------|
| `resolveModel()` unchanged (gemini/groq) | ✅ |
| Mastra still direct providers | ✅ |
| CopilotKit not via gateway | ✅ |
| **IPI-454 · CF-AI-001** AC-F not complete | ✅ correctly not claimed |
| **IPI-485 · MASTRA-CF-001** not complete | ✅ |

---

## Critical defects / red flags

### 🔴 P0 — Worker Gemini non-stream always requests SSE

**File:** `services/cloudflare-worker/src/providers/gemini.ts` L38

```ts
?alt=sse&key=...
```

is appended for **both** `generateContent` and `streamGenerateContent`.  
Non-stream path then `JSON.parse`s an SSE body → **every `chat()` / `structured()` call fails**.  
`chatStream()` works because it consumes SSE correctly.

**Critical fix:** only add `alt=sse` when `stream === true` (or parse SSE in non-stream path). Add Worker unit test for non-stream JSON response.

**Owner:** gateway Worker / **IPI-454 · CF-AI-001** (not introduced by PR #310 app code).

### 🔴 P1 — Embeddings fail against Workers AI (400)

Live `POST /v1/embeddings` with `model: "embedding"` → `Workers AI embedding error 400`.  
Likely token/account/base URL config or model path — needs separate CF Workers AI probe.

### 🟡 P1 — Adapter sends model **IDs**, Worker looks up **tier keys**

`createProviderAdapter` → `modelForTier()` → e.g. `gemini-3.1-flash-lite`.  
Worker `resolveModelEntry(model)` looks up registry **tiers** (`default`, `fast`, …) and falls back to `default`.  

Works accidentally for chat (fallback), but:
- Default embed model id is also `gemini-3.1-flash-lite` unless `AI_MODEL_EMBEDDING` is set → wrong provider path.
- AC-F must send **tier names** (or Worker must accept OpenAI model IDs).

### 🟡 P2 — Dual registries

App vs Worker registries still diverge (content + defaults). Track as follow-up; do not block IPI-457 Done.

### 🟡 P2 — Local ops friction

- Wrangler requires **Node ≥ 22** (repo default shell was Node 20).
- Port `:3002` may be an old worktree without `/api/ai/health` → false 404s.

### ⚪ Not bugs (intentional)

- Mastra / CopilotKit not on gateway yet → **IPI-454 · CF-AI-001** AC-F.
- Prod deploy → **IPI-472 · INFRA-001**.
- Failover → **IPI-463 · CF-AI-008**.

---

## Scorecards

### IPI-457 · CF-AI-005 (PR #302)

| Item | Result |
|------|--------|
| PR #302 on main | **Yes** |
| Type architecture | **Pass** |
| Registry load | **Pass** |
| Adapter chat (unit/mock) | **Pass** |
| Streaming (unit/mock) | **Pass** |
| Structured output (unit/mock) | **Pass** |
| Embeddings (unit/mock) | **Pass** |
| Abort/cancel (unit) | **Pass** |
| Focused tests | **23** adapter (+ registry covered via typecheck/build) |
| Full tests | **1052** passed / 6 skipped |
| Build | **Pass** |
| Duplicate implementation | **No** (app adapter) |
| Runtime wiring status | **Intentionally pending** (AC-F) |
| **IPI-457 final status** | **Done** |

### IPI-461 · CF-AI-004 (PR #310)

| Item | Result |
|------|--------|
| PR #310 merged | **Yes** |
| CI | **Pass** |
| Typecheck | **Pass** |
| Lint | **Pass** |
| Focused adapter tests | **Pass — 23** |
| Health route tests | **Pass — 3** |
| Full suite | **Pass — 1052** / 6 skipped |
| Build | **Pass** |
| Live `/api/ai/health` | **Pass** |
| Gateway-down behavior | **Pass** |
| Real adapter chat | **Fail** (Worker SSE bug) |
| Real streaming | **Pass** |
| Real structured output | **Fail** (same) |
| Real embeddings | **Fail** (Workers AI 400) |
| Timeout | **Pass** |
| Cancellation | **Pass** |
| Requests in Worker logs | **Yes** |
| Scope preserved | **Yes** |
| **IPI-461 ready for Done** | **No** — until non-stream chat proven, or Linear AC explicitly scoped to health+stream only |
| Remaining for **IPI-454 · CF-AI-001** AC-F | See below |

---

## Remaining work — **IPI-454 · CF-AI-001** AC-F (exact list)

1. Fix Worker Gemini non-stream (`alt=sse` only when streaming) + regression test.
2. Fix / prove embeddings path (Workers AI 400) or route embed tier to Gemini embed.
3. Align adapter↔Worker **model contract** (send tier names **or** accept model IDs).
4. Wire `resolveModel()` → `@ai-sdk/openai-compatible` → `AI_GATEWAY_URL` (feature-flagged).
5. Run AC-J checklist (stream/tools/fallback/metrics through Mastra/CopilotKit).
6. Prod gateway deploy via **IPI-472 · INFRA-001** (AC-I).

---

## Suggested improvements

1. Add `services/cloudflare-worker` live smoke script (`chat` + `chatStream` + `structured` + `embed`) to CI or `npm run gateway:smoke`.
2. Document Node 22 for Wrangler in `services/cloudflare-worker/README` / AGENTS.
3. Health route: optional `?deep=1` that runs one `chatStream` token (not only `/health`) — still not AC-F.
4. Keep mock unit tests; add one `describe.skipIf(!process.env.LIVE_GATEWAY)` integration file so local proof is repeatable.
5. Do **not** mark IPI-461 Done from health alone; require at least one non-stream + one stream live proof after Worker fix.

---

## Percent correct (this verification)

| Layer | % | Notes |
|------:|--:|-------|
| IPI-457 types/registry merge | **96%** | Done |
| IPI-461 app runtime (factory + health + tests) | **92%** | Merged + proven |
| IPI-461 live method matrix vs Worker | **50%** | Stream/cancel/timeout/health only |
| Combined “gateway ready for Mastra” | **~55%** | Blocked on Worker chat + AC-F |

**Overall audit confidence:** high (probes re-run this session on `44b8daca`).

---

## Anti-fake-done

| Gate | IPI-457 | IPI-461 |
|------|:-------:|:-------:|
| On `main` | ✅ | ✅ |
| CI green | ✅ | ✅ |
| Unit tests | ✅ | ✅ |
| Live health | ⚪ N/A | ✅ |
| Live chat | ⚪ N/A | 🔴 |
| Scope not overclaimed | ✅ | ✅ |

---

## Commands to reproduce

```bash
git fetch origin && git worktree add /tmp/wt-verify-pr310 origin/main
cd /tmp/wt-verify-pr310/app
# Node 22 for wrangler
export PATH="$HOME/.nvm/versions/node/v22.23.1/bin:$PATH"
npm ci   # or hardlink real node_modules — no out-of-tree symlink
npm run typecheck && npm run lint
npx vitest run src/lib/ai/provider-adapter.test.ts src/app/api/ai/health/route.test.ts
npm test && CI=true npm run build

# Terminal A
cd ../services/cloudflare-worker && npx wrangler dev --port 8787 --ip 127.0.0.1

# Terminal B
cd ../app && AI_GATEWAY_URL=http://127.0.0.1:8787 npx next dev -p 3010
curl -si http://127.0.0.1:3010/api/ai/health
```
