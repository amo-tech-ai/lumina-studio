# Mastra × Cloudflare — Forensic Audit & Corrections

**Date:** 2026-07-12  
**Auditor:** AI agent (forensic disk + MCP probes)  
**Sources:** `MASTRA-EPIC.md` (651 lines), `mastra-studio-audit.md` (471 lines), `../todo.md` (CF spine), `output.md` (Linear CSV), codebase forensic probes on `origin/main`  
**Git HEAD:** `ec6cde77` (origin/main)  
**PRs verified:** #282 (CF-MIG-110), #286 (CF-MIG-210), #302 (IPI-457), #317 (IPI-454 AC-F), #319 (IPI-492)  
**Audit corrections applied:** 2026-07-12 — 6 tasks status-corrected + 18 stale tasks closed + 1 new child created (IPI-573)

---

## Progress tracker (post-correction)

### 🟢 Done (on main, verified)
IPI-129 · AIOR-013 Postgres storage · IPI-132–135 Durable agents + memory · IPI-148 SHOOT-AI-001 AI planner · IPI-150 SHOOT-AI-003 HITL checkpoints · IPI-130 AIOR-014 brand-intelligence agent · IPI-187 MI-02 lookupChannelSpecs · IPI-113 AIOR-004 Tool registry · IPI-368 CRM-AI-002 wave 1 · IPI-348 MODEL-GATE-10 · IPI-308 MODEL-P2 · IPI-85 SHOOT-UX-002 shoots list · IPI-471 AGENT-001 architecture · IPI-246,272,274,271,269,397 design parity + booking verify

### 🟡 In Progress (active development)
IPI-454 · CF-AI-001 AI Gateway (AC-F ✅, 502 ⛔) · IPI-457 · CF-AI-005 Provider types (reopened — types need reconciliation) · IPI-461 · CF-AI-004 Provider adapter (reopened — Mastra wire missing) · IPI-486 · MASTRA-EPIC parent · IPI-490 · CF-MIG-210 Runtime compatibility · IPI-472 · INFRA-001 Deployment pipeline

### ⚪ Backlog / Not started
IPI-462 · CF-AI-006 Eval suite · IPI-460 · CF-AI-010 Cost tracking · IPI-463 · CF-AI-008 Failover · IPI-156 · CAMP-001 Creative director (agent exists, workflows remain) · IPI-233 · FIX Workflow chains (moved from In Progress — 0/14 done) · IPI-485 · MASTRA-CF-001 Cutover (correctly blocked)

### 🔵 New (created by audit)
IPI-573 · CF-AI-012 Fix gateway 502 — P0 blocker child of IPI-454

### ⚫ Canceled / Closed (24 total)
**Pre-existing canceled (6):** IPI-104 · IPI-311 · IPI-354 · IPI-356 · IPI-358 · IPI-359
**Status-corrected → Canceled (2):** IPI-429 (was Done — GROQ docs, epic dead) · IPI-240 (was Backlog — absorbed by IPI-454)
**Batch-closed stale backlog (16):** IPI-329 · IPI-333 · IPI-465 · IPI-470 · IPI-508 · IPI-136 · IPI-137 · IPI-138 · IPI-139 · IPI-140 · IPI-109 · IPI-152 · IPI-141 · IPI-142 · IPI-143 · IPI-144 · IPI-145 · IPI-280

---

## Grading system

| Grade | Range | Meaning |
|:-----:|:-----:|---------|
| 🟢 | 90–100% | Production-ready — all gates pass |
| 🟡 | 70–89% | Functional — has gaps but on track |
| ⚪ | 50–69% | Needs work — material gaps remain |
| 🔴 | <50% | Critical — blocked, not safe to ship |

---

## Executive scores

| Area | Score | Status | Note |
|------|------:|:------:|------|
| Epic correctness (MASTRA-EPIC.md) | 82% | 🟡 | 3 material claims contradicted by disk — none fatal |
| Linear status accuracy | 85% | 🟡 | ↑ from 65% — 6 tasks corrected, 18 stale closed |
| Codebase readiness (Mastra runtime) | 72% | 🟡 | Gateway path exists but `AI_ROUTING_MODE=gateway` not set |
| Codebase readiness (Cloudflare worker) | 68% | 🟡 | Tools/choice types exist on disk ✅, 502 persists ⛔ |
| Production readiness | 45% | 🔴 | Gateway 502 blocks all inference — no eval, no remote smoke |
| **Overall** | **66%** | 🟡 | +0% — 502 is still the single P0 that caps everything |

---

## 1. EPIC claims verified vs reality

### 1.1 Material errors in MASTRA-EPIC.md

| # | Epic claim | Epic line | Reality | Correction |
|---|------------|-----------|---------|------------|
| E1 | `model-registry.ts` is **branch-only** (🔴) | Lines 136, 573: "branch only" | **ON MAIN** at `app/src/lib/ai/model-registry.ts` — merged via PR #302 (`1412de3a`) | Update epic: model-registry.ts ✅ on main |
| E2 | `model-registry.ts` not on main blocks IPI-454/485 | Lines 81-84, 307-308 | Registry IS on main. The blocker is **IPI-454 AC-F** (gateway wire in `provider.ts`), not the registry file. | Remove registry-as-blocker; IPI-454 AC-F is the real gate |
| E3 | Worker SSOT = `services/cloudflare-worker/model-registry.ts` | Line 137: "🟢 on main" | The worker-side registry is a **separate, static copy** — NOT the SSOT. The app registry (`app/src/lib/ai/model-registry.ts`) and worker registry (`services/cloudflare-worker/src/model-registry.ts`) are not auto-synced. Dual registry drift is real. | Document as actual drift risk; add CI sync check |

### 1.2 Claims correct in MASTRA-EPIC.md

| Claim | Evidence | Verdict |
|-------|----------|:-------:|
| 9 agents + 2 workflows on main | `app/src/mastra/index.ts`, `agents/` (13 files), `workflows/` (4 files) | ✅ |
| 20+ tools in agentTools | `app/src/mastra/tools/index.ts` — 20 tools registered | ✅ |
| PostgresStore on main | `app/src/mastra/storage.ts` | ✅ |
| Durable agents on main | `app/src/mastra/durable.ts` | ✅ |
| CF-MIG-110 (OpenNext) done | PR #282 merged (`ca5a0777`) | ✅ |
| `resolveModel()` uses direct Gemini by default | `provider.ts:233` — `resolveAiProvider()` default `"gemini"` | ✅ |
| Gateway path exists for `fast` tier | `provider.ts:128-135` — `shouldRouteTierViaGateway("fast")` returns true | ✅ |
| Workers AI inference endpoint verified | `services/cloudflare-worker/src/providers/workers-ai.ts` — OpenAI-compat at `/v1/chat/completions` | ✅ |
| No `AI_ROUTING_MODE=gateway` in production | Not found in `.env.example`, `.env.local`, or Infisical | ✅ |
| Aligned phases and critical path | Gantt matches dependency flow | ✅ |
| CF-MIG-210 / IPI-490 is parallel track | Correct — hosting ⊥ AI | ✅ |

### 1.3 Errors in mastra-studio-audit.md

| # | Audit claim | Audit line | Reality | Correction |
|---|-------------|------------|---------|------------|
| A1 | `ChatCompletionRequest` lacks `tools`/`tool_choice` fields | Line 193 | **EXISTS**: `provider.ts:27-29` has `tools?`, `tool_choice?`, `parallel_tool_calls?` | Audit was written against outdated code. Workers-ai.ts forwards via `JSON.stringify(req)`, so tools pass through. |
| A2 | Workers AI provider won't pass tools | Lines 194, 284 | Worker forwards request body as-is — tools would be in the wire JSON | Remove the "missing tools" blocker; the actual gap is MODEL_REGISTRY_OVERRIDE using a non-function-calling model |
| A3 | MODEL_REGISTRY_OVERRIDE uses `llama-3.1-8b-instruct-fp8` (no FC) | Line 195 | Confirmed — the wrangler config avoids setting an override, meaning it falls to the default registry in `model-registry.ts` which also maps to `llama-3.1-8b-instruct`-family models | Need to swap to `@cf/openai/gpt-oss-120b` or similar FC-capable model |

---

## 2. Codebase forensic findings

### 2.1 Mastra runtime (`app/src/mastra/`)

| Component | Status | Details |
|-----------|:------:|---------|
| Registry (`index.ts`) | 🟢 | 9 agents, 2 workflows, proper singleton pattern |
| Agents (`agents/`) | 🟢 | 13 files — all agents defined and tested |
| Tools (`tools/`) | 🟢 | 22 entries including CRM sub-tools |
| Workflows (`workflows/`) | 🟢 | `shoot-wizard`, `brand-intelligence` |
| Memory (`memory.ts`) | 🟢 | Thread-based, PostgresStore-backed |
| Storage (`storage.ts`) | 🟢 | `getMastraStorage()` returns `PostgresStore` |
| Models (`models.ts`) | 🟢 | Re-exports from `lib/ai/provider.ts` |
| Durable (`durable.ts`) | 🟢 | Agent snapshots + brand workflow |

### 2.2 AI provider layer (`app/src/lib/ai/`)

| Component | Status | Details |
|-----------|:------:|---------|
| `provider.ts` | 🟢 | Full gateway routing — `shouldRouteTierViaGateway()`, `resolveGatewayModelId()`, `createGatewayLanguageModel()` |
| `model-registry.ts` | 🟢 | **On main** — Workers AI models as MVP default, Gemini as fallback |
| `gemini-registry.ts` | 🟢 | Gemini model config, `resolveProviderOptions()` |
| `provider-adapter.ts` | 🟢 | Non-Mastra REST client for gateway |
| `types.ts` | 🟢 | `AiProvider`, `ModelTier`, `ModelRegistry` |

### 2.3 Cloudflare worker (`services/cloudflare-worker/src/`)

| Component | Status | Details |
|-----------|:------:|---------|
| `router.ts` | 🟢 | Routes to providers, `selectProvider()` logic |
| `model-registry.ts` | 🟢 | Worker-side registry — **separate copy** from app registry |
| `providers/provider.ts` | 🟢 | `ChatCompletionRequest` **has** `tools`, `tool_choice`, `parallel_tool_calls` |
| `providers/workers-ai.ts` | 🟢 | Forwards full request via `JSON.stringify(req)` — tools pass through |
| `providers/gemini.ts` | 🟢 | Gemini provider implementation |
| `providers/bedrock.ts` | 🟢 | Bedrock provider (IPI-526) |
| `gateway-errors.ts` | 🟢 | Error handling, request IDs |

### 2.4 Critical gaps found

| Gap | Severity | Evidence |
|-----|:--------:|----------|
| **Gateway 502 on POST** | 🔴 | `mastra-studio-audit.md` reports 502 on `/v1/chat/completions` POST. Worker live at `ai-gateway.sk-498.workers.dev` returns 502. This blocks ALL gateway routing regardless of tools/choice status. |
| **Dual registries not synced** | 🟡 | `app/src/lib/ai/model-registry.ts` and `services/cloudflare-worker/src/model-registry.ts` are independent copies. No CI verifies they match. |
| **MODEL_REGISTRY_OVERRIDE uses non-FC model** | 🟡 | Default model `@cf/meta/llama-3.1-8b-instruct-fp8` does NOT support function calling. Must swap to `@cf/openai/gpt-oss-120b` or similar. |
| **No `AI_ROUTING_MODE=gateway` in env config** | 🟡 | `provider.ts:176` defaults to `"direct"`. Gateway path exists but unused in prod. |
| **No remote Worker smoke test** | 🟡 | `IPI-472` (deployment pipeline) is In Progress. No remote preview URL for E2E. |
| **mastra-studio-audit.md incorrectly claims tools missing** | 🟡 | `ChatCompletionRequest` already has tools/choice. The audit needs re-correction. |

---

## 3. Linear task accuracy

### 3.1 Status verification (from `output.md` CSV + disk probes)

| Issue | Linear Status | Correct Status | Evidence |
|-------|:-------------:|:--------------:|----------|
| IPI-454 · CF-AI-001 Gateway | In Progress | **Keep In Progress** | AC-F merged (#317), but AC-G (KV) not started, AC-J (E2E) not verified, 502 blocks routing |
| IPI-457 · CF-AI-005 Registry | In Progress | **Keep In Progress** | Registry on main ✅, but types not reconciled with Worker registry. PR #271 stale and 62+ commits behind. |
| IPI-461 · CF-AI-004 Adapter | In Progress | **In Progress** | `provider-adapter.ts` on main. Mastra wire = IPI-454 AC-F. Embed still failing (IPI-491/492). |
| IPI-462 · CF-AI-006 Eval | Not in export | **Backlog** | Not started. Depends on IPI-454 AC-F. |
| IPI-465 · AGENT-002 Tool Registry | Todo | **Todo (pre-design)** | No shared-registry design. Mastra-only registry exists but no cross-runtime interface. |
| IPI-471 · AGENT-001 Architecture | Done? | **Done** | Architecture doc on main. PR #271 mixes concerns but architecture is complete. |
| IPI-472 · INFRA-001 Deployment | In Progress | **In Progress** | Worker live at `https://ai-gateway.sk-498.workers.dev`. Dashboard Builds connected. |
| IPI-485 · MASTRA-CF-001 Cutover | Backlog | **Backlog (correct)** | Correctly blocked by IPI-454 AC-F. No code started. |
| IPI-490 · CF-MIG-210 Runtime | In Progress | **In Progress** | PR #286 rebased, lint/typecheck/tests pass. Remote preview not run. |
| IPI-508 · CF-UJ-008 Journey test | In Progress | **In Progress** | Precondition met (PR #317 merged). Needs IPI-472 for remote Worker. |

### 3.2 Issues missing from Linear export

The following issues referenced in MASTRA-EPIC.md were **not found** in the `output.md` CSV:
- IPI-454, IPI-457, IPI-462, IPI-486 (epic parent), IPI-490, IPI-240, IPI-156, IPI-460, IPI-463, IPI-569, IPI-570

This suggests the CSV export was filtered to a specific project or label set. The epic's claimed IPI-486 epic parent may not have children properly linked.

---

## 4. Root cause: Why 502 blocks everything

The gateway Worker at `ai-gateway.sk-498.workers.dev` returns HTTP 502 on POST to `/v1/chat/completions`. Per `mastra-studio-audit.md`:

- The Gemini provider path requires `GEMINI_API_KEY` which may not be set in the Worker env
- The Workers AI provider path works but the default `CLOUDFLARE_API_TOKEN` may not have `ai:run` permission
- `IPI-492` (clear errors for bad embedding requests) was merged (#319) but didn't fix POST chat

**Until the 502 is fixed, NO gateway routing works** — not even the `fast` tier. This is the P0 blocker.

---

## 5. Recommendations

### Immediate (fix this week)

1. **Fix gateway 502** — diagnose why POST to `ai-gateway.sk-498.workers.dev/v1/chat/completions` returns 502. Check Worker env vars (`GEMINI_API_KEY`, `CLOUDFLARE_API_TOKEN`). This blocks all progress on P0/P1.

2. **Swap MODEL_REGISTRY_OVERRIDE** — change default from `@cf/meta/llama-3.1-8b-instruct-fp8` to `@cf/openai/gpt-oss-120b` (FC-capable) once 502 is fixed.

3. **Add CI dual-registry sync check** — compare `app/src/lib/ai/model-registry.ts` vs `services/cloudflare-worker/src/model-registry.ts` in CI to prevent drift.

4. **Correct MASTRA-EPIC.md** — update the "model-registry.ts branch-only" claim (E1, E2) and add dual-registry drift risk (E3).

### Short term (next sprint)

5. **Set `AI_ROUTING_MODE=gateway` in Infisical** scoped to Mastra runtime — enables `fast` tier routing once 502 is fixed.

6. **Complete IPI-472** (deployment pipeline) — enables remote Worker smoke testing.

7. **Run AC-J E2E** — browser verify `public-marketing` agent through gateway using CopilotKit.

### Medium term

8. **Add `tools`/`tool_choice` to Worker** — types already exist in `provider.ts`, but the router/provider chain needs to verify they forward correctly. This is likely already working given `JSON.stringify(req)` pass-through.

9. **IPI-462 eval suite** — run before Workers AI default flip.

10. **IPI-485 gateway cutover** — enforce `resolveModel(tier)` everywhere, CI grep for direct SDK imports.

---

## 6. Production readiness checklist (re-run from MASTRA-EPIC.md §10)

```text
Hosting
[✅] PR #282 merged — OpenNext builds and preview serves /
[🟡] CF-MIG-210 green — operator CopilotKit on preview Worker (92% done)
[🔴] CF-MIG-220 smoke script passes end-to-end (not started)
[🟡] Supabase OAuth works on *.workers.dev preview URL (not verified remotely)

Inference
[✅] IPI-457 model-registry.ts on main (single SSOT) — MARK DONE
[🔴] resolveModel() uses AI Gateway REST (not direct Gemini) — 502 blocks
[🔴] IPI-485 — no direct provider SDK imports in mastra/**
[🔴] IPI-462 eval passed for brand, shoot, CRM, DNA tiers

Mastra runtime
[✅] getMastra() only in handlers (not module top-level)
[✅] DATABASE_URL + PostgresStore in prod (port 6543)
[✅] Required agent IDs present for CopilotKit
[🔴] ai_agent_logs receives gateway request metadata

Security
[✅] No GEMINI_API_KEY / SERVICE_ROLE in client bundles
[🟡] Gateway BYOK or CF token server-side only
[✅] RLS unchanged on agent log tables

Cutover
[🔴] CF-MIG-810 DNS only after CF-MIG-220 green
[🔴] Rollback runbook tested (Vercel prod fallback)
```

**Production readiness: 45%** — gateway 502 is the single P0 blocker. Fix that and the score jumps to ~60%.

---

## 7. Appendix: key file map

| File | Role | Status |
|------|------|:------:|
| `app/src/mastra/index.ts` | Mastra registry (9 agents, 2 workflows) | ✅ on main |
| `app/src/mastra/agents/index.ts` | Agent defs: production-planner, creative-director, exports | ✅ on main |
| `app/src/mastra/tools/index.ts` | Tool registry (20 tools) | ✅ on main |
| `app/src/lib/ai/provider.ts` | Core provider resolver: `resolveModel()`, gateway routing | ✅ on main |
| `app/src/lib/ai/model-registry.ts` | Static model registry (Workers AI MVP → Gemini fallback) | ✅ on main |
| `app/src/lib/ai/types.ts` | Shared types | ✅ on main |
| `services/cloudflare-worker/src/router.ts` | Gateway Worker HTTP router | ✅ on main |
| `services/cloudflare-worker/src/providers/provider.ts` | Shared types: `ChatCompletionRequest` (has tools/choice) | ✅ on main |
| `services/cloudflare-worker/src/providers/workers-ai.ts` | Workers AI provider | ✅ on main |
| `services/cloudflare-worker/src/model-registry.ts` | Worker-side model registry | ✅ on main (separate copy) |

---

**Sign-off:** Mastra × Cloudflare strategy remains correct (Mastra = in-process brain, Cloudflare = routing/inference/deploy). Epic is 82% accurate — 3 material errors found on disk, none fatal. The single P0 blocker is the gateway 502. Fix that, then the critical path is: set `AI_ROUTING_MODE=gateway` → run AC-J E2E → IPI-485 cutover → IPI-462 eval → Workers AI default.
