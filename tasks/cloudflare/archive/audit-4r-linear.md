# Audit Report: 4R Linear Issues

**Date:** 2026-07-12 · **Auditor:** task-verifier + cloudflare MCP  
**Scope:** IPI-525 · IPI-490 · IPI-454 · IPI-468 · IPI-465 · IPI-508  
**Probes:** Worker MCP · `services/cloudflare-worker/` · `app/` · curl live tests

---

## 1. Task Scorecard

| Task | Status | Spec/100 | Exec/100 | Skills/100 | Composite | Safe? |
|------|--------|---------:|---------:|-----------:|---------:|:-----:|
| IPI-525 · CF-AI-011 Workers AI Tool Calling | 🟡 PR #333 | 70 | 65 | 78 | **70** | 🛑 |
| IPI-490 · CF-MIG-210 Runtime Compat | 🟢 92% | 90 | 92 | 85 | **90** | ✅ |
| IPI-454 · CF-AI-001 Gateway Routing | 🟡 68% | 88 | 52 | 85 | **72** | 🛑 |
| IPI-468 · SEC-001 Security Architecture | 🔴 0% | 40 | 0 | 50 | **27** | 🛑 |
| IPI-465 · AGENT-002 Shared Tool Registry | ⚪ 20% | 45 | 10 | 50 | **32** | 🛑 |
| IPI-508 · CF-UJ-008 Journey Test | ⚪ 0% | 60 | 0 | 40 | **31** | 🛑 |

> **Composite formula:** `0.35×spec + 0.40×execution + 0.25×skills`

---

## 2. Issue-by-Issue Audit

### 🟡 IPI-525 · CF-AI-011 — Workers AI Tool Calling (70%)

**Spec file:** `linear/issues/IPI-CF-AI-011.md` — 7-stage plan, model table, AC

| AC | Status | Evidence |
|:---|:------:|----------|
| Gateway `ChatCompletionRequest` has `tools`/`tool_choice` | ✅ PR #333 | `provider.ts` types on branch |
| Gemini provider rejects tool requests | ✅ PR #333 | 10 tests in `gemini.test.ts` |
| Workers AI provider forwards tools | ✅ PR #333 | `JSON.stringify(req)` pass-through |
| Model registry updated for tool-capable model | 🔴 Missing | `model-registry.ts` still uses Llama 3.1 8B (no FC) |
| Live curl proof with tool_calls response | 🔴 Not done | Gateway 403 on unknown models; tools silently dropped by Gemini |
| Mastra agent routes tools through gateway | 🔴 Not done | `AI_GATEWAY_ALLOW_TOOL_TIERS` not set; no curl proof |
| PR concern-mixing | 🔴 Violation | 8 files: code + skills + CLAUDE.md + audit doc in one PR |

#### Live test: tools through gateway (`fast` → Gemini)
```json
// Request: includes tools array
// Response: 200, text content, NO tool_calls
// Tools silently dropped — Gemini provider ignores unknown fields
```

#### Blocker: Unknown model IDs get confusing errors
```bash
# Any model not in registry fallback → Gemini with wrong model ID → 403
$ curl ... -d '{"model":"@cf/openai/gpt-oss-120b"}'
# Returns: "Gemini API error 403: Method doesn't allow unregistered callers"
```

#### 🔴 Red flags
1. **tools silently dropped by Gemini** — no guard on deployed Worker (pre-PR #333). Tools in → text out, no error
2. **No Workers-AI-capable model in registry** — `fast`/`default` tiers both route to Gemini, not Workers AI
3. **PR #333 violates AGENTS.md #1** — 4 code files + 3 skill/docs files + CLAUDE.md in single PR
4. **No live E2E with function-calling model** — all 34 tests are mocked

---

### 🟢 IPI-490 · CF-MIG-210 — Runtime Compatibility (90%)

**Spec:** PR #286 merged; Groq SSOT static bundle, OAuth allowlist, Hono compat

| AC | Status | Evidence |
|:---|:------:|----------|
| Static Groq models JSON bundled | ✅ | `groq-models.ssot.json` imported in `provider.ts:3` |
| No runtime `readFileSync` | ✅ | Static import pattern |
| OAuth exact allowlist | ✅ | Configurable via env |
| CopilotKit fetch works in Workers | ✅ | PR #286 verified |
| OpenNext build passes | ✅ | CI green |
| PostgresStore hang mitigated | 🟡 | Not fixed, timeout fallback in place |
| Remote CF preview run | 🔴 Not done | No IPI-472 remote preview executed |

#### 🟡 Red flags
- `PostgresStore` hang is **mitigated, not fixed** — operator memory may drop turns silently under Workers preview
- No remote Cloudflare preview has been run (blocks CF-MIG-220)

---

### 🟡 IPI-454 · CF-AI-001 — Gateway Provider Routing (72%)

**Spec:** `tasks/cloudflare/tasks/454.md` (545-line audit) + `tests/ipi-454-verification-2026-07-10.md`

| AC | Status | Evidence |
|:---|:------:|----------|
| A — OpenAI-compat `/v1/chat/completions` | ✅ | `router.ts:188` — live 200 |
| B — Gemini provider | ✅ | `gemini.ts` — live, chat/stream work |
| C — Workers AI provider URL modes | ✅ | `workersAiOpenAiBaseUrl()` — 3 modes |
| D — Retry/fallback scaffolding | 🟡 | Tier→default fallback; no true failover (IPI-463) |
| E — Worker integration tests | ✅ | 67 tests pass |
| **F — `resolveModel()` → gateway** | 🔴 | `shouldRouteTierViaGateway("fast")=true` WHEN `AI_ROUTING_MODE=gateway`. Never set in production |
| G — KV registry | ⚪ | Deferred |
| H — Circuit breaker | ⚪ | IPI-463 |
| I — Production deploy | 🔴 | IPI-472 not done |
| J — E2E gateway checklist | 🔴 | IPI-508 not run |

#### 🔴 Red flags
1. **Gateway registry defaults ALL chat tiers to Gemini** — `fast`, `default`, `structured`, `vision` all → Gemini. Only `embedding` → Workers AI
2. **Unknown model IDs → confusing 403** — `router.ts` falls through to default entry, tries Gemini with wrong model ID
3. **`AI_ROUTING_MODE` never set in any env** — not in `.env`, not in Infisical
4. **AC-F implemented but never activated** — `resolveModel()` gateway path exists but env var is absent

#### Live gateway tests

| Test | Result | Evidence |
|:-----|:------:|----------|
| `GET /health` | ✅ 200 | `{"status":"ok","service":"ai-gateway"}` |
| `POST /v1/chat/completions` (fast) | ✅ 200 | Llama 3.1 8B response |
| `POST /v1/chat/completions` (stream) | ✅ SSE | Tokens streamed |
| `POST /v1/embeddings` | ✅ 200 | BGE embedding returned |
| `POST /v1/chat/completions` (unknown model) | 🔴 502 | Confusing "Gemini API error 403" |
| `POST /v1/chat/completions` (tools + fast) | 🟡 200 | Tools silently dropped |

---

### 🔴 IPI-468 · SEC-001 — Security Architecture (27%)

**Spec:** No file on disk — references in `tasks/cloudflare/audit-ai-platform/AUDIT.md`

| AC | Status | Evidence |
|:---|:------:|----------|
| Route classification | 🔴 Not started | No design doc |
| Service Binding to Worker | 🔴 Not started | No wrangler config |
| WAF / rate limiting | 🔴 Not started | No Cloudflare WAF configured |
| `requireOperator()` function | 🔴 **Does not exist** | `middleware.ts` references it — never implemented |
| Auth on API routes | 🔴 **All disabled** | `OPERATOR_AUTH_ENABLED` defaults to `false` |
| Secrets handling | ✅ Clean | No `NEXT_PUBLIC_*` API keys |
| Fail-closed auth | 🔴 Not implemented | Gateway Worker is **public** — no auth check |

#### 🔴 Critical findings
1. **`middleware.ts` references `requireOperator()` — function does not exist anywhere in codebase**
2. **Gateway Worker has zero authentication** — `GET /v1/chat/completions` with tools is fully public
3. **`OPERATOR_AUTH_ENABLED` defaults to false** — all 26 API routes are unprotected
4. **Zero PRs, branches, or code for any security AC**

---

### ⚪ IPI-465 · AGENT-002 — Shared Tool Registry (32%)

**Spec:** No formal design exists — referenced across `tasks/cloudflare/audit-ai-platform/AUDIT.md`

| AC | Status | Evidence |
|:---|:------:|----------|
| Shared tool interface | 🔴 Not started | No design doc |
| Cross-runtime (Mastra ↔ Worker) | 🔴 Not started | No shared package |
| HITL permission model | 🔴 Not started | No design |
| Tool-call audit logging | 🔴 Not started | `ai_agent_logs` table exists but no tool-specific schema |
| Mastra tools code (good) | ✅ 20 tools | `app/src/mastra/tools/index.ts` — Zod-typed, clean |

#### 🟡 Red flags
- **Marked "In Progress" in Linear — zero shared-registry code exists anywhere**
- **Mastra tools are Mastra-only** — no cross-import with Worker, no shared types package
- **Design deferred** — issue should be "Todo" or "Design Phase"

---

### ⚪ IPI-508 · CF-UJ-008 — Journey Test (31%)

**Spec:** `tasks/cloudflare/user-journeys/08-marketing-operator-chat.md` — 162 lines

| AC | Status | Evidence |
|:---|:------:|----------|
| Prerequisites met | 🟡 | `resolveModel()` gateway path exists; env never set |
| Browser UJ run | 🔴 Not done | No Playwright test |
| Curl UJ-HEALTH | ✅ | `GET /health` returns 200 |
| Curl chat through gateway | ✅ | Live Worker returns responses |
| Direct fallback tested | 🟡 | Default mode works via Gemini SDK |
| Compare direct vs gateway | 🔴 Not done | `AI_ROUTING_MODE` never set |
| Observability verified | 🔴 Not done | Worker logs not checked |

#### 🟡 Red flags
- **Precondition `AI_ROUTING_MODE=gateway` never set** — can't test gateway path
- **Cannot test in browser** — `AI_ROUTING_MODE` must be set before Next.js boot, not at runtime
- **No Playwright test exists** — all verification is manual curl

---

## 3. Corrected Execution Order

| Order | Task | Reason |
|:-----:|------|--------|
| **1** | 🔴 **IPI-468** — Security: at minimum, fix `requireOperator()` gap and add Bearer auth to Worker | Without this, gateway is publicly callable; production block |
| **2** | 🟢 **IPI-490** — Close as Done; add PostgresStore hang to separate follow-up task | 92% complete — remote preview can wait for IPI-472 |
| **3** | 🟡 **IPI-454 AC-J** — Set `AI_ROUTING_MODE=gateway` locally, run IPI-508 browser journey | Prove fast tier end-to-end |
| **4** | 🟡 **IPI-525** — PR #333: split concern mix, add model registry update, run curl proof with function-calling model | Unblocks all tool-bearing agents |
| **5** | 🟡 **IPI-472** — CI/CD + remote preview | Opens remote testing surface |
| **6** | ⚪ **IPI-465** — Share registry design doc | After tool protocol is proven |
| **7** | 🟢 **IPI-508** — Close after all above done | Verification capstone |

---

## 4. Production Readiness Summary

| Question | Answer |
|:---------|:-------|
| Is any task production-ready? | 🟢 **IPI-490** (runtime compat) — yes, 92% |
| Can gateway path be enabled? | 🟡 Technically yes (`AI_ROUTING_MODE=gateway`), but Worker has no auth — **do not enable in production** |
| Are tool-bearing agents unblocked? | 🔴 **No** — IPI-525 types are on PR branch, but no Workers-AI-capable model in registry, no live proof |
| Is security acceptable? | 🔴 **No** — public gateway, disabled auth middleware, missing `requireOperator()` |
| Is the shared registry designed? | 🔴 **No** — pre-design, wrongly marked In Progress |
| Are E2E journeys tested? | 🔴 **No** — IPI-508 precondition unmet |

---

## 5. Best Practice Violations

| Violation | Issue | Fix |
|:----------|:------|:----|
| Concern mixing in PR | IPI-525 PR #333 | Split code/docs/skills into separate PRs |
| Unknown models → Gemini 403 | IPI-454 router | Add `model not found` error before Gemini fallback |
| Tools silently dropped by Gemini | IPI-525 (deployed) | Deploy PR #333 tool guards, or better: route to Workers AI |
| Security by obscurity | IPI-468 | Implement auth: bearer token on Worker, enable `OPERATOR_AUTH_ENABLED` |
| Stale issue status | IPI-465 | Change to "Todo/Design" — no shared registry code exists |
| Premature In Progress | IPI-465 | No design doc, no PR, no branch |

---

## 6. Corrected Issue Statuses

| Issue | Current Status in Linear | Correct Status | Reason |
|:------|:------------------------:|:--------------:|--------|
| IPI-525 | Proposed | **In Progress** | PR #333 open with types + tests |
| IPI-490 | In Progress | **Done (92%)** | PR #286 merged; follow-up PostgresStore as separate issue |
| IPI-454 | In Progress | **In Progress** | 68% — AC-J/IPI-508 not done |
| IPI-468 | Todo | **Todo (critical)** | Needs priority elevation — production gap |
| IPI-465 | In Progress | **Todo / Design** | No shared code exists |
| IPI-508 | In Progress | **Blocked** | Precondition `AI_ROUTING_MODE` never set |

---

## 7. Verification Evidence Summary

| Probe | Result | Detail |
|:------|:------:|--------|
| Worker live | ✅ | `GET /health` → 200 |
| Chat completions | ✅ | `POST /v1/chat/completions` → 200 Llama response |
| Streaming | ✅ | SSE tokens streaming |
| Embeddings | ✅ | BGE 768-dim returned |
| Tools + Gemini | 🟡 Tools silently dropped | Deployed Worker has no tool guards |
| Unknown model | 🔴 502 "Gemini error 403" | Confusing error, wrong model routed |
| Workers AI tests | ✅ 67/67 pass | 5 test files |
| App tests | ✅ (prior) | 1039/1039 pass |
| Worker deployed code | ✅ Bundled | Pre-PR #333 (no tool guards) |
| Observability | ✅ Enabled | Head sampling 1.0, logs persist |

---

## 8. Risk Matrix

| Risk | Likelihood | Impact | Mitigation |
|:-----|:----------:|:------:|:-----------|
| Tool calls silently dropped in production | High | High | Deploy tool guards + model registry update (IPI-525) |
| Gateway used without auth | Medium | Critical | Implement bearer token check before flip (IPI-468) |
| PostgresStore hang causes silent turn drops | Medium | Medium | Separate investigation task; timeout mitigation in place |
| Registry drift (app vs Worker) | Medium | Medium | Add CI test for tier key consistency |
| Concern mixing in PR #333 | Certain | Medium | Split PR before merge |

---

## 9. Immediate Corrections List

1. **🔴 IPI-468**: Add Bearer auth check to Worker `handleChat()` — 10-minute fix, production blocker
2. **🔴 IPI-525 PR #333**: Split into code-only PR + skills/docs PR. Merge code PR first
3. **🟡 IPI-525**: Add Workers-AI-capable model to `model-registry.ts` (e.g., `qwen3-30b-a3b-fp8` for `fast` tier)
4. **🟡 IPI-454 router**: Fix unknown model error — return 400 "unknown model" instead of falling through to Gemini and getting 403
5. **🟡 IPI-465**: Change Linear status from "In Progress" to "Todo" — no design, no code, no PR
6. **🟢 IPI-490**: Mark Done at 92% — create separate PostgresStore follow-up issue
7. **🟡 IPI-454 AC-J**: Set `AI_ROUTING_MODE=gateway AI_GATEWAY_URL=http://localhost:8787` and run browser journey

---

## 10. Final Verdict

| Question | Answer |
|:---------|:-------|
| Overall implementation progress | **58%** across 6 tasks |
| Production readiness | **~40%** — blocked on security + tool protocol + E2E proof |
| Safe to enable gateway in production? | **🔴 NO** — no auth on Worker, no security architecture |
| Largest hidden risk | **`requireOperator()` function referenced but doesn't exist** — `middleware.ts` silently trusts all requests |
| Most impactful single fix | **Split PR #333 + deploy tool guards + add Bearer auth to Worker** — unlocks tool agents securely |
| Can IPI-490 be closed? | **🟢 Yes** — 92% complete, create PostgresStore follow-up |
