# Post-merge audit — PR #319

**Audit date:** 2026-07-10  
**Main tip audited:** `c9086000` (`origin/main`)  
**Worktree:** `/home/sk/wt-audit-319-post-merge` (detached at merge commit)  
**Live Worker:** `wrangler dev` from that worktree → `http://127.0.0.1:8787`  
**Verification level:** Local Runtime Verified (unit + live Wrangler + live adapter)  
**Not claimed:** Production Verified · Remote Preview Verified · full browser AC-J

| PR | Title | Merge commit | Concern |
|----|-------|--------------|---------|
| [#319](https://github.com/amo-tech-ai/lumina-studio/pull/319) | **IPI-492 · CF-AI-004c — Clear errors for bad embedding requests (no more fake 502s)** | `c9086000` | Worker embed validation + sanitized error envelope + typed `AiGatewayError` |

**Linear:** **IPI-492 · CF-AI-004c** → **Done** (2026-07-10). AC checkboxes in the issue body may still be unchecked (process debt only).

---

## Executive summary (plain English)

#319 is **merged** and **works on local Wrangler**. Bad embedding requests no longer look like “gateway down”: empty / blank / missing input and non-embedding models return **HTTP 400** with a stable `{ error: { code, message, requestId } }` envelope **before** Workers AI is called. Happy embeds still return **768-d** BGE vectors; chat still returns **200**.

Compared to the #315/#316 post-merge audit (where empty input and wrong model were still **502**), those failure modes are **fixed** on `main`.

| Scorecard | Score | Notes |
|-----------|------:|-------|
| **PR #319 (IPI-492 concern)** | **95%** | Live contracts Pass; residuals are out-of-scope (JSON parse, chat envelope) |
| **IPI-461 · CF-AI-004 Done gate (local)** | **96%** | health + chat + stream + embed + bad-request contracts Pass |
| **Gateway error hygiene (all routes)** | **78%** | Embed green; chat + malformed JSON still old shapes |
| **Production readiness** | **N/A** | No remote Worker deploy (**IPI-472 · INFRA-001**) |

---

## Merge state

| Item | Result |
|------|--------|
| #319 | **MERGED** 2026-07-10T19:51:33Z |
| On `origin/main` | **Yes** (`c9086000`) |
| Files | 8 — Worker + `provider-adapter` (+ tests) only |
| One-concern discipline | ✅ no docs / AC-F / deploy mix |
| Pre-merge rebase | Onto `4c0badb3` (#318 docs); conflicts: none |

---

## Tests run this audit (evidence)

### Unit (main tip `c9086000`)

| Gate | Result | Evidence |
|------|--------|----------|
| Worker `npm test` | **Pass — 51/51** | embed-validation 20 + router.embed 6 + index 7 + workers-ai 10 + gemini 8 |
| App `provider-adapter.test.ts` | **Pass — 25/25** | includes `AiGatewayError` envelope parsing |
| `wrangler deploy --dry-run` | **Pass** | Total Upload **25.88 KiB** / gzip **6.60 KiB** |

### Live Worker (`http://127.0.0.1:8787`) — UJ-HEALTH / UJ-EMBED

| Probe | Expected | Result | Evidence (abbrev) |
|-------|----------|--------|-------------------|
| `GET /health` | 200 ok | **Pass** | `{"status":"ok","service":"ai-gateway"}` |
| `input: []` | 400 `invalid_request` | **Pass** | `req_f011b353-…` |
| `input: "   "` | 400 `invalid_request` | **Pass** | blank rejected |
| missing `input` | 400 `invalid_request` | **Pass** | “non-empty string or array” |
| `model: gemini-3.1-flash-lite` | 400 `unsupported_embedding_model` | **Pass** | no Gemini 404 / no fake 502 |
| `model: default` on embed | 400 unsupported | **Pass** | no silent chat-tier remap |
| `model: embedding` + text | 200 / **768-d** | **Pass** | `@cf/baai/bge-base-en-v1.5` |
| batch `["hello","world"]` | 200 / **768,768** | **Pass** | `{"n":2,"dims":[768,768]}` |
| explicit `@cf/baai/bge-base-en-v1.5` | 200 / 768 | **Pass** | canonical BGE |
| chat `fast` → `PONG` | 200 | **Pass** | regression green |
| malformed `{bad` JSON | (follow-up) | **Fail residual** | 500 `gateway_error` — **IPI-494** |
| chat missing `messages` | (follow-up) | **Fail residual** | 502 raw JS — **IPI-495** |

Raw curl transcript: `/tmp/pr-319-post-merge-evidence.txt` (local audit machine).

### Live adapter (against same `:8787`)

Ephemeral vitest (5 cases) against `createProviderAdapter({ baseUrl: "http://127.0.0.1:8787" })`:

| Case | Result |
|------|--------|
| `chat` → PONG | **Pass** (~643ms) |
| `embed(["hello","world"])` → 768,768 | **Pass** |
| `embed([])` → `AiGatewayError` `invalid_request` / 400 | **Pass** |
| `embed(..., { model: "gemini-3.1-flash-lite" })` → `unsupported_embedding_model` / 400 | **Pass** |
| `chatStream` ≥ 1 chunk + cancel | **Pass** |

**Journey IDs covered (local):** `UJ-HEALTH`, `UJ-EMBED` (Worker + adapter).  
**Not run this audit:** full browser `UJ-OP-CHAT` / CopilotKit under `AI_ROUTING_MODE=gateway` (that is **#317 / AC-F**, not #319).

---

## What #319 fixed vs #316-era audit

| Failure point (pre-#319) | After #319 on `main` |
|--------------------------|----------------------|
| Empty embed → opaque **502** | **400** `invalid_request` |
| Chat model on `/v1/embeddings` → Gemini **404**/502 | **400** `unsupported_embedding_model` |
| Adapter threw raw `Error` strings | Typed **`AiGatewayError`** (`code`, `httpStatus`, `retryable`, `requestId`) |
| Override missing `embedding` tier | Falls back to canonical BGE (no incomplete override re-query) |

---

## Errors / red flags / blockers

### Critical for #319 product concern

| ID | Finding | Status |
|----|---------|--------|
| — | None for embed validation / envelope on local main | ✅ |

### High — out of scope residuals (already filed)

| ID | Finding | Follow-up |
|----|---------|-----------|
| H1 | Malformed JSON → 500 `gateway_error` (not stable envelope) | **IPI-494 · CF-AI-004d** |
| H2 | Chat missing `messages` → 502 with raw JS internals | **IPI-495 · CF-AI-004e** |
| H3 | Dead export `SUPPORTED_EMBEDDING_MODELS` unused | **IPI-496 · CF-AI-004f** |
| H4 | Few call sites branch on `AiGatewayError.retryable` | **IPI-498 · CF-AI-004g** |
| H5 | Docs that still say empty/wrong embed → 502 | **IPI-497 · CF-AI-004h** |

### Epic / platform (not #319 blockers)

| ID | Finding |
|----|---------|
| E1 | No production Worker deploy — **IPI-472 · INFRA-001** |
| E2 | Mastra → gateway opt-in still open — **#317 / AC-F** |
| E3 | AC-J browser E2E mostly unchecked — **IPI-454** |
| E4 | Dual model registries (app vs Worker) still diverge |

### Process debt

| ID | Finding |
|----|---------|
| P1 | IPI-492 Linear AC checkboxes still unchecked while status=**Done** |
| P2 | Codacy complexity was waived pre-merge (acceptable; not a functional defect) |

---

## Critical fixes needed now?

**None** for the merged #319 concern. Do **not** reopen #319 for H1–H5 — use the follow-up issues above (one concern each).

---

## Missing / improvements

| Priority | Improvement |
|----------|-------------|
| Next | Ship **IPI-494** (JSON wrap) — small, closes the last non-envelope path on embed POSTs |
| Next | Ship **IPI-495** (chat envelope) — removes scary 502s for operators debugging agents |
| Soon | **IPI-497** docs sync so audits/#318 notes don’t re-teach 502 for empty embed |
| Later | **IPI-498** adopt typed errors at BI / DNA callers |
| Later | Wire or delete `SUPPORTED_EMBEDDING_MODELS` (**IPI-496**) |
| Separate | Merge/rebase **#317** only after `UJ-OP-CHAT` / `UJ-MKT-CHAT` gateway smoke |

---

## Percent correct

| Lens | % | Rationale |
|------|--:|-----------|
| IPI-492 acceptance (A–H) on local main | **95** | A–G proven live; H scope held; tiny residual = JSON not in AC |
| Real-world embed journey (`UJ-EMBED`) | **97** | Bad requests fail closed; happy 768-d; adapter typed |
| Whole AI Gateway surface | **78** | Chat + bad JSON still leaky |
| Claim “Production ready” | **0** | Not Production Verified |

---

## Cloudflare docs alignment

Workers AI **BGE Base** (`@cf/baai/bge-base-en-v1.5`) → **768-dimensional** vectors ([Cloudflare model docs](https://developers.cloudflare.com/workers-ai/models/bge-base-en-v1.5/)). Live probes match.

---

## Recommendation

| Action | Decision |
|--------|----------|
| Reopen #319 | **No** |
| Treat IPI-492 Done | **Yes** (local gate); tick AC boxes in Linear when convenient |
| Next code PR | **IPI-494** or **IPI-495** (separate) |
| Next docs PR | **IPI-497** (docs-only) |
| Unblock AC-F | Continue **#317** after gateway chat smoke — not blocked by #319 |

---

## Reproduce

```bash
git fetch origin && git worktree add ../wt-audit-319 origin/main
cd ../wt-audit-319/services/cloudflare-worker && npm ci && npm test
cd ../app && npm ci && npx vitest run src/lib/ai/provider-adapter.test.ts
cd ../services/cloudflare-worker && npx wrangler dev --port 8787
# curls: empty → 400; gemini model → 400; embedding → 768; chat → 200
```
