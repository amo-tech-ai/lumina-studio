# Post-merge audit — PR #315 + PR #316

**Audit date:** 2026-07-10  
**Main tip audited:** `d112dea4` (`origin/main`)  
**Worktree:** `/home/sk/wt-audit-315-316` (detached)  
**Verification level:** Local Runtime Verified (unit + live Wrangler `:8787`)  
**Not claimed:** Production Verified / Remote Preview Verified

| PR | Title | Merge commit | Concern |
|----|-------|--------------|---------|
| [#315](https://github.com/amo-tech-ai/lumina-studio/pull/315) | **IPI-454 · CF-AI-001 — Post-merge audit for PR #312** | `9ccfb5fd` | Docs-only audit |
| [#316](https://github.com/amo-tech-ai/lumina-studio/pull/316) | **IPI-491 · CF-AI-004b — Fix AI Gateway embeddings** | `d112dea4` | Adapter default + Workers AI OpenAI-compat embed |

---

## Executive summary (plain English)

Both PRs are **merged**. Embeddings through the local AI Gateway now work: `createProviderAdapter().embed()` returns **768-d** vectors via Workers AI BGE. Chat / structured / stream still pass (no regression from #312).

**Do not** mark **IPI-454 · CF-AI-001** Done — AC-J / AC-I remain open; AC-F is in PR [#317](https://github.com/amo-tech-ai/lumina-studio/pull/317) (not on `main` until merge).  
**Do** treat **IPI-461 · CF-AI-004** as Done (local Done-gate paths all Pass on this run).  
**IPI-491 · CF-AI-004b** is Done in Linear with AC checkboxes checked (2026-07-10 hygiene pass).

| Scorecard | Score | Notes |
|-----------|------:|-------|
| **PR #316 (embed fix)** | **94%** | Live embed + chat green; empty-input + wrong-model edges remain |
| **PR #315 (docs audit)** | **88%** | Accurate *at write time*; successor note added on `pr-312-post-merge-audit` |
| **IPI-461 · CF-AI-004 Done gate** | **96%** | health + chat + stream + structured + embed + cancel Pass |
| **IPI-454 · CF-AI-001 epic** | **~76%** | B4 local Pass; F in #317; J / I still open; no prod deploy |

---

## Merge state

| Item | Result |
|------|--------|
| #315 | **MERGED** 2026-07-10T17:59:05Z — 1 file docs |
| #316 | **MERGED** 2026-07-10T17:59:37Z — 4 files code+tests |
| Order on `main` | `9ccfb5fd` (#315) then `d112dea4` (#316) |
| One-concern discipline | ✅ both PRs |

---

## Tests run this audit

### Unit

| Gate | Result |
|------|--------|
| `app` `provider-adapter.test.ts` | **Pass — 24** |
| Worker full `npm test` | **Pass — 23** (index 5 + workers-ai 10 + gemini 8) |
| `wrangler deploy --dry-run` | **Pass** (21.14 KiB / 5.46 KiB gzip) |

### Live (`http://127.0.0.1:8787`)

Worker process at audit time: `workerd` from `wt-ipi-491-gateway-embeddings` (same embed/chat sources as `d112dea4`; `git diff origin/main` on those files empty).

| Path | Result | Evidence |
|------|--------|----------|
| `GET /health` | Pass | `{"status":"ok","service":"ai-gateway"}` |
| `POST /v1/embeddings` `model=embedding` | Pass | `@cf/baai/bge-base-en-v1.5`, **768-d** |
| `POST /v1/chat/completions` non-stream | Pass | `PONG` |
| Adapter `chat()` | Pass | `PONG` (~1.1s) |
| Adapter `structured()` | Pass | `{ ok: true }` |
| Adapter `embed()` (2 inputs) | Pass | dims `[768, 768]` |
| Adapter `chatStream()` | Pass | chunks ≥ 1 |
| Adapter cancel | Pass | reader.cancel OK |

### Edge probes (real-world failure points)

| Probe | Result | Classification |
|-------|--------|----------------|
| `input: []` empty array | **502** — Workers AI 400 `invalid input` | 🟡 Expected provider reject; adapter should fail clearly (does) |
| `input: "single string"` | **200** / 768-d | ✅ OpenAI-compat string form works |
| `model: gemini-3.1-flash-lite` on `/v1/embeddings` | **502** — `Gemini embedding error 404` | 🟡 Wrong model still hits Gemini embed path — default path fixed; explicit override still dangerous |
| Empty catch / silent failures in stream | Unchanged | Low residual from #312 era |

---

## Errors / red flags / blockers

### Critical (product / Done gates)

| ID | Finding | Status after #316 |
|----|---------|-------------------|
| E1 | Adapter default embed → Gemini chat model → 404 | **Fixed** on `main` (`modelForTier("embedding")` → `"embedding"`) |
| E2 | Workers AI `{ text }` → 400 | **Fixed** (`{ model, input }` + OpenAI `data[].embedding` parse) |
| E3 | **IPI-461** still **In Progress** though Done gate now Pass | 🔴 Process blocker — reassess Done |
| E4 | **IPI-454** Linear body still says “embeddings Fail on main” | 🔴 Doc/Linear drift — update B4 |
| E5 | No Cloudflare **production** Worker deploy | 🔴 Blocks AC-I / prod claims (**IPI-472 · INFRA-001**) |

### High (epic incomplete)

| ID | Finding |
|----|---------|
| H1 | Mastra `resolveModel()` not on gateway (**AC-F**) |
| H2 | AC-J E2E checklist mostly unchecked |
| H3 | Dual model registries (app vs Worker) still diverge |
| H4 | IPI-491 AC checkboxes unchecked while status=Done |

### Medium

| ID | Finding |
|----|---------|
| M1 | Empty `input: []` → opaque 502 (Worker wraps provider 400) |
| M2 | Explicit wrong embed model still routes to Gemini 404 |
| M3 | #315 audit file still says “#316 open” / embed Fail (historical; needs successor note) |
| M4 | Extra untracked test docs under dirty `/home/sk/ipix` checkout **not** on `origin/main` |
| M5 | Live Worker was not restarted from `wt-audit-315-316` (content-equivalent; restart for purity) |

### Low

| ID | Finding |
|----|---------|
| L1 | Worker package still no `typecheck` / `lint` scripts |
| L2 | Stream unit tests still URL-focused (live covers SSE) |

---

## Critical fixes (ordered)

1. **Linear hygiene (no code)** — Update **IPI-454** truth: B4 local Pass via #316; keep F/J/I open; bump ~74%.  
2. **Reassess IPI-461 Done** — All Done-gate probes Pass this run → mark Done *or* leave open only if you require prod deploy (that belongs to IPI-472, not 461).  
3. **Tick IPI-491 AC boxes** to match Done.  
4. **Do not** reopen #315/#316 for AC-F.  
5. Next code: **IPI-454 · CF-AI-001 AC-F** (Option A: chat/stream only).  
6. Parallel infra: **IPI-472 · INFRA-001** (owns prod AC-I).

Optional hardening (not merge blockers for #316):

- Reject empty embed inputs in adapter before fetch (clear 400).  
- If `opts.model` looks like a Gemini chat id on `embed()`, warn or remap to `"embedding"`.  
- Add one Worker integration test for empty `input` → stable error shape.

---

## Is anything missing?

| Expected | Status |
|----------|--------|
| #316 on `main` | ✅ |
| Unit tests for adapter default + Workers AI body | ✅ |
| Live embed on local Worker | ✅ (this audit) |
| Live chat regression | ✅ |
| #315 successor audit after #316 | ✅ **this file** |
| IPI-461 Done flip | ❌ still In Progress |
| IPI-454 Linear B4 update | ❌ stale |
| Mastra gateway wire (AC-F) | ❌ |
| Prod Worker | ❌ |
| Remote Preview Verified | ❌ |
| Production Verified | ❌ |

---

## Suggested improvements

1. Shared smoke script under `tasks/cloudflare/tests/` or `scripts/` (health/chat/structured/embed/stream/cancel) — keep out of production packages.  
2. Contract test: adapter default model string ∈ Worker registry keys.  
3. Document embed SSOT: Workers AI BGE only; Gemini embed path = unsupported until explicit AC.  
4. After AC-F: one Mastra agent live probe in the same smoke matrix.  
5. Restart `wrangler dev` from `origin/main` tip before any Done claim ceremony.

---

## Percent correct (detail)

### PR #316 — **94%**

| Criterion | Weight | Score |
|-----------|-------:|------:|
| Root causes fixed (E1+E2) | 30 | 30 |
| Live embed Pass | 25 | 25 |
| Chat regression | 15 | 15 |
| Unit tests | 15 | 15 |
| Scope discipline | 10 | 10 |
| Edge hardening (empty/wrong model) | 5 | 0 |
| **Total** | 100 | **94** |

### PR #315 — **88%** (as living doc)

Accurate snapshot of post-#312 / pre-#316 world. −12 for now-stale “#316 open” / embed Fail / next-step “merge #316” without a follow-up note on `main`.

### Broader epics

| Epic | % | Why not 100 |
|------|--:|-------------|
| **IPI-491 · CF-AI-004b** | ~95 | Done justified; AC boxes + empty-input polish |
| **IPI-461 · CF-AI-004** | ~96 | Ready for Done on local gate |
| **IPI-454 · CF-AI-001** | ~74 | F/J/I open; B4 local only |

---

## Real-world iPix examples

| Operator need | Works now? |
|---------------|------------|
| One-shot brand summary via adapter `chat()` | ✅ |
| JSON shot-list via `structured()` | ✅ |
| Live typing via `chatStream()` | ✅ |
| Semantic / vector prep via `embed()` | ✅ local gateway |
| Mastra agent → gateway (no direct Gemini) | ❌ AC-F |
| Same paths on Cloudflare prod Worker | ❌ IPI-472 |

---

## Stage report table

| Item | Result |
|------|--------|
| Finding | #315+#316 merged; embed fixed locally; epic not Done |
| Evidence | Unit 24+23; live health/chat/structured/embed/stream/cancel; dry-run |
| Classification | #316 **Confirmed correct**; #315 **Confirmed historical / partially stale**; IPI-461 **Ready for Done reassessment** |
| Change made | This audit doc only (no production code) |
| Regression test | Adapter + Worker suites green; live smoke script used once |
| Validation level | **Local Runtime Verified** |
| Scope preserved | Yes — audit only |
| Remaining risks | Prod undeployed; AC-F missing; Linear drift; empty embed input 502 |
| Next action | Update Linear (454/461/491) → start AC-F → IPI-472 for prod |

---

## Appendix — smoke commands

```bash
# From a clean origin/main worktree with Worker .dev.vars
cd services/cloudflare-worker && npx wrangler dev --port 8787
cd app && npx vitest run src/lib/ai/provider-adapter.test.ts
cd services/cloudflare-worker && npm test
curl -sS http://127.0.0.1:8787/health
curl -sS http://127.0.0.1:8787/v1/embeddings \
  -H 'Content-Type: application/json' \
  -d '{"model":"embedding","input":["hello gateway"]}'
```
