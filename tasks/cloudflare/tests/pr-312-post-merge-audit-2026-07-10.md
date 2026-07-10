# Post-merge audit — PR #312 Gemini non-stream SSE

**Task:** **IPI-454 · CF-AI-001 — Fix Gemini Non-Stream SSE**  
**PR:** [#312](https://github.com/amo-tech-ai/lumina-studio/pull/312)  
**Merged:** 2026-07-10T17:04:13Z  
**Merge commit:** `0635fd9555ddef2aecdeeeed93bd403475660529`  
**Pre-merge HEAD:** `281a977909d56adf722cdd47601c35cd3a0476cd`  
**Audit date:** 2026-07-10  
**Verification level:** Local Runtime Verified (post-merge `origin/main`)

> **Successor (2026-07-10):** PR [#316](https://github.com/amo-tech-ai/lumina-studio/pull/316) is **merged** (`d112dea4`). Local `embed()` now **Pass** (768-d via Workers AI). Do not treat the embed Fail rows below as current truth — see [`pr-315-316-post-merge-audit-2026-07-10.md`](./pr-315-316-post-merge-audit-2026-07-10.md). **IPI-461 · CF-AI-004** → Done (local gate). AC-F → PR [#317](https://github.com/amo-tech-ai/lumina-studio/pull/317). AC-J / AC-I still open.

> Docs-only. Sibling code PR #312 already merged. Related: #313 (Sentry), #314 (pre-merge verify doc), [#316](https://github.com/amo-tech-ai/lumina-studio/pull/316) / **IPI-491 · CF-AI-004b** (embed fix — **merged**).

---

## Executive summary (plain English)

Operators can again get **finished** AI answers (brand DNA summaries, JSON shot lists) through the AI Gateway. Live typing/streaming was never the broken path. Embeddings still fail for a **different** reason — do not treat the adapter or the full Cloudflare AI epic as Done.

| Scorecard | Score | Notes |
|-----------|------:|-------|
| **PR #312 concern (SSE fix)** | **96%** | Live chat/structured/stream green on merged main; encodeURIComponent included |
| **IPI-461 · CF-AI-004 — AI Provider Adapter** | **~78%** | Adapter runtime OK except embeddings |
| **IPI-454 · CF-AI-001 — AI Gateway routing** | **~75%** | SSE blocker cleared; AC-F / AC-J / deploy still open |

---

## Merge state

| Item | Result |
|------|--------|
| PR #312 | **MERGED** |
| Files | `gemini.ts`, `gemini.test.ts` only |
| Unresolved threads at merge | 0 |
| Required CI | Green (app-build, supabase-web015, booking-gate, Codacy) |
| Docs sibling #314 | Already on `main` (`e31e7f30`) |
| Sentry #313 | Already on `main` (`66e2f70d`) |

---

## Post-merge tests (this audit)

| Gate | Result |
|------|--------|
| `npx vitest run src/providers/gemini.test.ts` | **Pass — 8** |
| Full Worker `npm test` | **Pass — 22** |
| `npx wrangler deploy --dry-run` | **Pass** (21.15 KiB / 5.40 KiB gzip) |
| Live `createProviderAdapter` → `:8787` | See table below |

### Live smoke on `0635fd95`

| Path | Result | Red flag? |
|------|--------|-----------|
| health | Pass | No |
| `chat()` | Pass (`PONG`) | No |
| `structured()` | Pass | No |
| `chatStream()` | Pass | No |
| cancel | Pass | No |
| timeout | Pass | No |
| `embed()` | **Fail** — `Gemini embedding error 404` | **Yes — separate** |
| Wrangler logs | chat 200; embeddings 502 | Embed path only |

---

## Errors / red flags / failure points

### Critical (blocks product paths that need embeddings)

| ID | Finding | Classification | Blocker for |
|----|---------|----------------|-------------|
| E1 | Default adapter `embed()` sends model `gemini-3.1-flash-lite` → Worker falls back to Gemini `embedContent` → **404** | Confirmed | Semantic search / RAG / any embed UX |
| E2 | Forcing Worker tier `embedding` → Workers AI path → **400** (prior evidence) | Confirmed | Same |

**Not caused by `alt=sse`.** Separate investigation + PR required.

### High (epic still incomplete)

| ID | Finding | Classification | Blocker for |
|----|---------|----------------|-------------|
| H1 | Mastra `resolveModel()` not wired to gateway (**AC-F**) | Confirmed missing | Agents using gateway in prod |
| H2 | AC-J E2E checklist unchecked | Confirmed missing | Claiming IPI-454 Done |
| H3 | Prod Worker deploy / pipeline (**IPI-472 · INFRA-001**) | Confirmed missing | Production gateway |

### Medium (correctness / ops)

| ID | Finding | Classification |
|----|---------|----------------|
| M1 | Adapter default embedding model ≠ Worker `embedding` tier key | Confirmed contract mismatch |
| M2 | Dual model registries (app vs Worker) still diverge | Confirmed (pre-existing) |
| M3 | Worker package has no `typecheck` / `lint` scripts; `tsc` has pre-existing noise | Confirmed |
| M4 | `chatStream` unit test asserts URL only (not full SSE chunk parse) — live covers it | Accepted residual |
| M5 | Seer GitHub App not responding to `@sentry review` | Confirmed (tooling), not a #312 defect |

### Low

| ID | Finding |
|----|---------|
| L1 | Empty `catch {}` in Gemini stream transform (pre-existing) |
| L2 | MatterAI check sometimes pending/neutral — not a merge blocker when GraphQL threads = 0 |

---

## Critical fixes (ordered)

1. **Embedding contract** — **IPI-491 · CF-AI-004b** / [#316](https://github.com/amo-tech-ai/lumina-studio/pull/316): adapter default → Worker tier `embedding`; Workers AI OpenAI-compat `{ input }` (not `text`).
2. **Do not** reopen #312 for embeds.
3. After embeds green on main → reassess **IPI-461 · CF-AI-004** Done.
4. **AC-F** may proceed in parallel (Option A: chat/stream only; no `embed()` in the cutover agent).
5. Then **AC-J**, then **IPI-472 · INFRA-001**.

---

## Is anything missing?

| Expected for #312 | Status |
|-------------------|--------|
| Non-stream JSON | Done |
| Stream SSE only when streaming | Done |
| Regression tests | Done (8) |
| Live chat/structured/stream | Done post-merge |
| Key encoding | Done (`encodeURIComponent`) |
| Embeddings | **Missing** (out of scope — tracked) |
| Mastra cutover | **Missing** (AC-F) |
| Prod deploy | **Missing** (IPI-472) |
| Infisical Sentry DSN for all envs | **Missing** (ops for #313) |

---

## Suggested improvements (not blockers for #312)

1. Shared `encodeQueryKey` helper if more providers build query URLs.
2. Adapter: default `modelForTier("embedding")` to `"embedding"` to match Worker registry.
3. Add one Worker integration test that hits `/v1/chat/completions` non-stream with a mocked Gemini fetch (end-to-end URL + JSON).
4. Replace silent stream `catch {}` with counted/logged parse failures.
5. Add `npm run typecheck` to Worker package once `cloudflare:test` types are clean.
6. Install Seer GitHub App if PR Bug Prediction is desired.

---

## Percent correct (detail)

### PR #312 (this change) — **96%**

| Criterion | Weight | Score |
|-----------|-------:|------:|
| Root cause fixed | 30 | 30 |
| Live non-stream paths | 25 | 25 |
| Stream preserved | 15 | 15 |
| Tests catch regression | 15 | 14 (stream parse unit partial) |
| Scope discipline | 10 | 10 |
| Review hardening (encode) | 5 | 5 |
| **Total** | 100 | **96** |

−4: stream SSE chunk parsing not unit-tested end-to-end; embed left broken (correctly out of scope but still a product hole).

### Broader epics

| Epic | % | Why not 100 |
|------|--:|-------------|
| **IPI-461 · CF-AI-004** | ~78 | Embed Fail |
| **IPI-454 · CF-AI-001** | ~75 | AC-F, AC-J, AC-I open; prior AC-C/registry work landed |

---

## Next steps (execution order)

1. ~~Merge #312~~ **Done** (`0635fd95`)
2. ~~Docs #314~~ **Done** on main
3. ~~File Linear for embedding 404/400~~ **Done** — **IPI-491 · CF-AI-004b** · [#316](https://github.com/amo-tech-ai/lumina-studio/pull/316)
4. ~~Merge #316 → live prove `embed()` on `main`~~ **Done** (`d112dea4`) — see successor audit
5. ~~Reassess **IPI-461 · CF-AI-004** Done~~ **Done** (local runtime gate)
6. **IPI-454 · CF-AI-001 — AC-F** — PR [#317](https://github.com/amo-tech-ai/lumina-studio/pull/317) (In Review)
7. **AC-J** checklist (after #317 on main)
8. **IPI-472 · INFRA-001** deploy pipeline (owns AC-I / prod AC-J evidence)
9. Ops: Infisical/Vercel Sentry DSN for preview/prod

---

## Stage report table

| Item | Result |
|------|--------|
| Task | **IPI-454 · CF-AI-001 — Fix Gemini Non-Stream SSE** |
| Evidence | Code on `main` + Worker tests 22 + live adapter smoke |
| Classification | SSE fix **Confirmed Done**; embeds **Confirmed fixed** in #316 (see successor) |
| Merge state | **Merged** |
| Remaining blocker | AC-F (#317), AC-J, **IPI-472 · INFRA-001** (AC-I) |
| Next task | Merge **PR #317** (AC-F) → AC-J → **IPI-472** |
