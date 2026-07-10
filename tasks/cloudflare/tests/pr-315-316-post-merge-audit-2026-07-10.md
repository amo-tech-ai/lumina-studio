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
**Verified Linear (2026-07-10 MCP):** **IPI-461 · CF-AI-004** = **Done** (local Done-gate Pass). **IPI-491 · CF-AI-004b** = **Done** with AC checkboxes checked. Do not re-open hygiene for those two.

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

**Initial audit Worker:** `workerd` from `wt-ipi-491-gateway-embeddings` (same embed/chat sources as `d112dea4`).

**Pure-main re-smoke (2026-07-10):** restarted Wrangler from clean worktree `wt-docs-315-316-successor` @ `75ae8c2c` (tip includes `d112dea4` + CRM #311 + this docs commit). Adapter API smoke via `tsx` — all Pass:

| Path | Result | Evidence |
|------|--------|----------|
| `GET /health` | Pass | `{"status":"ok","service":"ai-gateway"}` |
| Adapter `chat()` | Pass | `PONG` |
| Adapter `structured()` | Pass | `{ ok: true }` |
| Adapter `embed()` | Pass | **768-d** |
| Adapter `chatStream()` | Pass | chunks ≥ 1 (`Hello`) |
| Adapter cancel | Pass | `reader.cancel` clean |

Earlier audit table (same tip Worker sources) also recorded raw `/v1/embeddings` + dual-input embed Pass.

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
| E3 | **IPI-461** still **In Progress** though Done gate now Pass | ✅ **Done** in Linear (local runtime gate) |
| E4 | **IPI-454** Linear body still says “embeddings Fail on main” | ✅ Updated — B4 Pass; AC-F → PR #317; J/I open |
| E5 | **IPI-491** AC checkboxes unchecked in body | ✅ Checked off 2026-07-10 |
| E5 | No Cloudflare **production** Worker deploy | 🔴 Blocks AC-I / prod claims (**IPI-472 · INFRA-001**) |

### High (epic incomplete)

| ID | Finding | Status (verified 2026-07-10) |
|----|---------|------------------------------|
| H1 | Mastra `resolveModel()` not on gateway (**AC-F**) | Open — PR [#317](https://github.com/amo-tech-ai/lumina-studio/pull/317) |
| H2 | AC-J E2E checklist mostly unchecked | Open |
| H3 | Dual model registries (app vs Worker) still diverge | Open |
| H4 | ~~IPI-491 AC checkboxes unchecked while status=Done~~ | ✅ Resolved — AC boxes checked; Linear **Done** |

### Medium

| ID | Finding |
|----|---------|
| M1 | Empty `input: []` → opaque 502 (Worker wraps provider 400) — follow-up **IPI-492 · CF-AI-004c** / PR [#319](https://github.com/amo-tech-ai/lumina-studio/pull/319) |
| M2 | Explicit wrong embed model still routes to Gemini 404 — same hardening track as M1 |
| M3 | #315 audit file still says “#316 open” / embed Fail (historical; successor note added) |
| M4 | Extra untracked test docs under dirty `/home/sk/ipix` checkout **not** on `origin/main` |
| M5 | Live Worker was not restarted from `wt-audit-315-316` (content-equivalent; restart for purity) |

### Low

| ID | Finding |
|----|---------|
| L1 | Worker package still no `typecheck` / `lint` scripts |
| L2 | Stream unit tests still URL-focused (live covers SSE) |

---

## Critical fixes (ordered)

**Linear hygiene (verified Done — no further action):**

| Issue | Linear status (2026-07-10) | Notes |
|-------|----------------------------|-------|
| **IPI-461 · CF-AI-004** | ✅ **Done** | Local Done gate Pass; prod deploy is **IPI-472**, not 461 |
| **IPI-491 · CF-AI-004b** | ✅ **Done** | AC checkboxes checked; PR #316 merged |

**Still open (do these next):**

1. Keep **IPI-454 · CF-AI-001** open — B4 local Pass via #316; AC-F → [#317](https://github.com/amo-tech-ai/lumina-studio/pull/317); AC-J / AC-I remain.  
2. **Do not** reopen #315/#316 for AC-F.  
3. Next code after #317: AC-J E2E + **IPI-472 · INFRA-001** (owns prod AC-I).  
4. Embed hardening (empty input / wrong model → clear 400): **IPI-492 · CF-AI-004c** / [#319](https://github.com/amo-tech-ai/lumina-studio/pull/319).

Optional hardening notes (tracked on IPI-492, not merge blockers for #316):

- Reject empty embed inputs before provider fetch (clear 400).  
- Reject unsupported embed models (no silent Gemini remap).  
- Stable sanitized error envelope on the Worker.

---

## Is anything missing?

| Expected | Status |
|----------|--------|
| #316 on `main` | ✅ |
| Unit tests for adapter default + Workers AI body | ✅ |
| Live embed on local Worker | ✅ (this audit) |
| Live chat regression | ✅ |
| #315 successor audit after #316 | ✅ **this file** |
| **IPI-461 · CF-AI-004** Done | ✅ Linear **Done** (local gate; not Production Verified) |
| **IPI-491 · CF-AI-004b** Done + AC boxes | ✅ Linear **Done** |
| **IPI-454** Linear B4 / AC-F truth | ✅ Updated (AC-F → #317; J/I open) |
| Mastra gateway wire (AC-F) on `main` | ❌ until #317 merges |
| Prod Worker | ❌ → **IPI-472 · INFRA-001** |
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
| **IPI-491 · CF-AI-004b** | ~95 | ✅ Linear **Done**; residual empty-input / wrong-model polish → IPI-492 |
| **IPI-461 · CF-AI-004** | ~96 | ✅ Linear **Done** on local gate; not Production Verified |
| **IPI-454 · CF-AI-001** | ~76 | AC-F in #317; J/I open; B4 local only |

---

## Real-world iPix examples

| Operator need | Works now? |
|---------------|------------|
| One-shot brand summary via adapter `chat()` | ✅ |
| JSON shot-list via `structured()` | ✅ |
| Live typing via `chatStream()` | ✅ |
| Semantic / vector prep via `embed()` | ✅ local gateway |
| Mastra agent → gateway (no direct Gemini) | ❌ AC-F (#317) |
| Same paths on Cloudflare prod Worker | ❌ IPI-472 |

---

## Stage report table

| Item | Result |
|------|--------|
| Finding | #315+#316 merged; embed fixed locally; **IPI-454** epic not Done |
| Evidence | Unit 24+23; live health/chat/structured/embed/stream/cancel; Linear MCP: **IPI-461**/**IPI-491** = Done |
| Classification | #316 **Confirmed correct**; #315 **Confirmed historical / successor landed**; IPI-461/491 **Done (local)** |
| Change made | This audit doc only (no production code) |
| Regression test | Adapter + Worker suites green; live smoke script used once |
| Validation level | **Local Runtime Verified** |
| Scope preserved | Yes — audit only |
| Remaining risks | Prod undeployed; AC-F not on `main` until #317; empty embed input 502 → #319 |
| Next action | Merge #317 (AC-F) → #319 (embed errors) → AC-J → **IPI-472** for prod |

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
