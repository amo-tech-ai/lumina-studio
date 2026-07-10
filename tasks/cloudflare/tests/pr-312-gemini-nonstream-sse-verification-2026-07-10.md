# PR #312 pre-merge verification — Gemini non-stream SSE

**Task:** **IPI-454 · CF-AI-001 — Fix Gemini Non-Stream SSE**  
**PR:** https://github.com/amo-tech-ai/lumina-studio/pull/312  
**Branch:** `ipi/454-gemini-nonstream-sse`  
**Verified HEAD:** `0d38d0bb32ca0b1990c2be0d6fb593637ba13a74`  
**Base (`origin/main`):** `44b8dacae4b2b775727877d541ed85ce9892b95d`  
**Date:** 2026-07-10  
**Verification level:** Local Runtime Verified (Worker + `createProviderAdapter`)

> Docs-only artifact. Do **not** mix into the code PR (#312). One concern: verification record for Cloudflare AI Gateway Gemini URL fix.

---

## Stage 1 — Scope

| Check | Result |
| ----- | ------ |
| Changed files | `services/cloudflare-worker/src/providers/gemini.ts`, `services/cloudflare-worker/src/providers/gemini.test.ts` |
| One concern | Yes — Gemini non-stream `alt=sse` only |
| Commits | 2 (fix + test) — same concern; not a single squash commit |
| Scope preserved | Yes |
| Out-of-scope changes | None (`resolveModel`, Mastra, registry, Wrangler config, AC-F/J, IPI-472 absent) |

---

## Stage 2 — Root cause

| Claim | Evidence | Classification |
| ----- | -------- | -------------- |
| Non-stream `generateContent` included `alt=sse` on `main` | `geminiFetch` URL always `?alt=sse&key=…` regardless of `stream` | **Confirmed** |
| Non-stream path expects JSON | `chat()` → `await res.json()` | **Confirmed** |
| SSE body breaks JSON parse | Live pre-fix: 502 / `Unexpected token 'd'…`; unit test reproduces SyntaxError | **Confirmed** |
| Streaming worked with SSE | Pre-fix live `chatStream` Pass; stream uses `streamGenerateContent` + `alt=sse` | **Confirmed** |
| Embeddings share this defect | Separate `embedContent` URL — no `alt=sse` | **Out of Scope** (different failure: Gemini 404 / Workers AI 400) |

---

## Stage 3 — Fix

```text
stream = true  → streamGenerateContent?alt=sse&key=…
stream = false → generateContent?key=…   (no alt=sse)
```

Extracted as exported `geminiRequestUrl()`. No changes to routing, auth, payloads, model selection, timeouts, or error handling beyond URL construction.

---

## Stage 4 — Regression tests

| Requirement | Covered? |
| ----------- | -------- |
| Non-stream URL omits `alt=sse` | Yes |
| Stream URL includes `alt=sse` | Yes |
| Non-stream JSON parse succeeds | Yes (`parses JSON generateContent response`) |
| Structured also omits `alt=sse` | Yes |
| Pre-fix SSE parse failure shape | Yes (`rejects SSE-shaped body…`) |
| Stream path SSE **chunk** parse | Partial — unit asserts URL only; **live** `chatStream` Pass |
| Embed uses `embedContent` without `alt=sse` | Yes |

Would fail on pre-fix `main`: non-stream URL assertions (`not.toContain("alt=sse")`) fail if `alt=sse` is always appended.

---

## Stage 5–6 — Worker gates

| Gate | Result |
| ---- | ------ |
| `npx vitest run src/providers/gemini.test.ts` | **Pass — 7** (PR description said 3; suite expanded) |
| Combined gemini + workers-ai + index | **Pass — 21** (PR description said 17) |
| `npm test` (full Worker) | **Pass — 21** |
| `npm run typecheck` / `lint` | **N/A** — scripts not in Worker `package.json` |
| `npx tsc --noEmit` | Pre-existing errors (incl. embed `unknown` in `gemini.ts`); **not introduced by URL fix** |
| `npx wrangler deploy --dry-run` | **Pass** — Total Upload **21.26 KiB** / gzip **5.41 KiB** |

---

## Stage 7 — Live proof (`createProviderAdapter` → `http://127.0.0.1:8787`)

| Path | Result | Notes |
| ---- | ------ | ----- |
| `GET /health` | Pass | 200 `ai-gateway` |
| `chat()` | **Pass** | `PONG` |
| `structured()` | **Pass** | `{ ok: true, n: 1 }` |
| `chatStream()` | **Pass** | streamed text |
| `embed()` | **Fail** | `Gemini embedding error 404` — independent of `alt=sse` |
| non-2xx | Pass | `POST /v1/nope` → 404 |
| Wrangler logs | Yes | chat completions 200; embeddings 502 |

---

## Stage 8 — Before / after

| Path | Before PR #312 | After PR #312 |
| ---- | -------------- | ------------- |
| `chat()` | 502 / SSE parse failure | **Pass** |
| `structured()` | 502 / SSE parse failure | **Pass** |
| `chatStream()` | Pass | **Pass** |
| `embed()` | Fail (Workers AI 400 / Gemini 404) | **Fail** (same class — not this bug) |

---

## Stage 9 — PR readiness

| Check | Result |
| ----- | ------ |
| Mergeable | Yes |
| Branch contains `origin/main` | Yes (ahead 2, behind 0) |
| CI | Green (app-build, supabase-web015, booking-gate, Codacy, Vercel) — MatterAI may still be pending |
| Review threads | 0 |
| Live non-stream + stream | Pass |

---

## Final report

| Item | Result |
| ---- | ------ |
| Current HEAD | `0d38d0bb32ca0b1990c2be0d6fb593637ba13a74` |
| Base branch current | Yes |
| Scope clean | Yes |
| Root cause confirmed | Yes |
| Fix minimal | Yes |
| Gemini focused tests | Pass — 7 |
| Combined gateway tests | Pass — 21 |
| Full Worker tests | Pass — 21 |
| Typecheck | N/A script; pre-existing `tsc` noise |
| Lint | N/A (no script) |
| Wrangler dry-run | Pass |
| Live `chat()` | Pass |
| Live `structured()` | Pass |
| Live `chatStream()` | Pass |
| Embed regression | Fail (independent; N/A to this fix) |
| Review threads | 0 |
| CI | Green |
| Remaining blocker | None for this PR’s concern |
| **Merge recommendation** | **Merge** |

**Do not auto-merge.** Embeddings remain a separate follow-up (not AC-F). After merge, **IPI-461 · CF-AI-004** still needs embed proof before Done; **IPI-454 · CF-AI-001** stays open for AC-F.
