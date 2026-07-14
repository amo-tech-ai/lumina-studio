# Cloudflare Setup Problems & Fixes — Comprehensive List

**Date:** 2026-07-12  
**Source:** PR #342 audit (IPI-527 through IPI-534)  
**Total issues:** 17 · **Critical:** 7 · **High:** 5 · **Medium:** 5

---

## 🔴 CRITICAL Issues (Must Fix Before Merge)

| # | Problem | Error | Fix |
|---|---------|-------|-----|
| 1 | **Tool routing scope wrong** | Tests for SSE reconstruction & parallel tools inside router tests | Move streaming/tool-execution tests to adapter layer; router only handles provider selection |
| 2 | **Cost calculation 1000× wrong** | Formula: `inputTokens × costPer1kIn` (should divide by 1000) | Change to: `(inputTokens / 1_000) * costPer1kIn + (outputTokens / 1_000) * costPer1kOut` |
| 3 | **Tool execution ownership unclear** | Task assumes Worker executes tools + validates auth, contradicts Mastra role | Document: Worker = gateway/router only; Mastra = execute/authorize tools |
| 4 | **Gemini tool-message guard missing** | `toGeminiMessages()` converts tool-results to user-messages silently | Add check: throw if `messages.some(m => m.role === "tool")` before conversion |
| 5 | **Multi-tool result format wrong** | Single `tool-result` message with multiple tools | Use separate message per tool: each gets own `role: "tool"` + `tool_call_id` |
| 6 | **No circuit breaker state storage** | Task specifies circuit breaker but doesn't say where state lives | Design first: Durable Object / KV / external service — then implement |
| 7 | **No provisional defaults** | Task says fail if reliability env vars unset — breaks local dev/CI | Use validated defaults: `TIMEOUT_MS=30000`, `RETRY_COUNT=1`, `LOOP_MAX_TURNS=10` with env overrides |

---

## 🟡 HIGH Priority Issues (Unsafe Behavior)

| # | Problem | Error | Fix |
|---|---------|-------|-----|
| 8 | **SSE errors after headers sent** | Can't return 400 once streaming started | Emit structured error in stream OR terminate stream gracefully |
| 9 | **Invalid retry policy** | Retry all 5xx/network errors indiscriminately | Add: respect `Retry-After`, skip non-idempotent ops, use jitter, cap total duration |
| 10 | **Arbitrary coverage thresholds** | "100% middleware, 85% routing coverage" undefined | Use scenario-based: every auth branch tested, every routing decision tested |
| 11 | **Logging exposes sensitive data** | Task logs full prompts, raw tool args/results | Only log: requestId, latency, cost, model, status — redact tokens/secrets |
| 12 | **No Gemini fallback gate** | Task title says "verify no fallback" but doesn't test it | Add negative test: tool request with gemini override still routes to GLM |

---

## 🟠 MEDIUM Priority Issues (Design/Clarity)

| # | Problem | Error | Fix |
|---|---------|-------|-----|
| 13 | **Unsupported latency guarantee** | Claims `<2s` without Cloudflare proof | Document: measure P50/P95, compare to agreed SLO, don't assume platform guarantee |
| 14 | **Typed error missing** | Generic `Error` thrown as "user-facing" | Use typed internal error (e.g., `UnsupportedToolConversationError`), map at HTTP boundary |
| 15 | **Scope contradiction** | Task says "4 values changed" but requires Zod validation + tests + CI changes | Replace with: "No unrelated files changed" |
| 16 | **Arbitrary escalation trigger** | "More than 5 schema mismatches" has no clear meaning | Use: prod defect caused by drift, same tool in 2+ places, manual sync needed in PRs |
| 17 | **Linear issue ID preassigned** | Task assumes IPI-509 exists | Let Linear assign ID, use title: `IPI-XXX · CF-UJ-009 — Journey Test: Operator Tool-Chat Gateway` |

---

## Summary

### By Severity
- 🔴 **Critical (blocks merge):** 7 issues
- 🟡 **High (unsafe behavior):** 5 issues
- 🟠 **Medium (design/clarity):** 5 issues

### Root Causes
1. **Architecture not decided** — Tool ownership (Worker vs Mastra)
2. **Formulas wrong** — Cost calculation off by 1000×
3. **Missing tests** — Gemini guard, multi-turn continuation
4. **Unsafe defaults** — No fallbacks, breaks local dev/CI
5. **Arbitrary thresholds** — No SLOs defined (latency, coverage)

### Fix Effort
- **Total time:** ~20 hours
- **Type:** Mostly requirement rewrites, not code
- **Merge blocker:** All 7 critical issues must be fixed

### Dependency Order (After Fixes)
```
Parallel foundation (IPI-527, 528, 529)
└── Multi-turn verification (IPI-530)
    └── Reliability & observability (IPI-531)
        └── New operator journey (IPI-XXX)
```

---

## Affected Tasks (IPI-527–534)

| Task | Issue Count | Severity | Status |
|------|:-----------:|----------|--------|
| IPI-527 (Tool Routing) | 1 | Critical | Scope misaligned |
| IPI-528 (Gemini Guard) | 1 | Critical | Guard missing |
| IPI-529 (Registry Validation) | 1 | Critical | Optional requirement |
| IPI-530 (Multi-Turn) | 3 | Critical, High | Ownership unclear, format wrong |
| IPI-531 (Reliability) | 4 | Critical, High | Defaults, breaker, logging, retry |
| IPI-465 (Shared Registry) | 1 | Medium | Arbitrary trigger |
| IPI-508 (Marketing Fast Chat) | 1 | Medium | Unverified latency |
| IPI-509 (Operator Journey) | 1 | Medium | ID preassigned |

---

## 🆕 ADDITIONAL Issues (PR #336, #339, #340, #342 audits)

### PR #340: Deprecated Model (Production Blocker)

| # | Problem | Error | Fix |
|---|---------|-------|-----|
| 18 | **Using deprecated Llama 3.1 8B** | `@cf/meta/llama-3.1-8b-instruct` deprecated 5/30/2026 | Replace with `@cf/meta/llama-3.1-8b-instruct-fast` (drop-in) OR `@cf/zai-org/glm-4.7-flash` (recommended) |
| 19 | **Mixed scope violation** | PR #340 touches 6 files: model-registry + Gemini provider + worker types + tests + lockfile | Split into 2 PRs: PR A (Gemini fix only), PR B (model registry only) |
| 20 | **Lockfile churn unexplained** | `package-lock.json` 87 lines deleted, no commit message | Explain if Cloudflare version bump needed or revert |

### PR #339: Bearer Token Auth (Unresolved Threads)

| # | Problem | Error | Fix |
|---|---------|-------|-----|
| 21 | **Test environment config unclear** | CI may not inherit `.dev.vars`; Sentry thread unresolved | Explicitly document `AI_GATEWAY_AUTH_TOKEN` injection in CI (not relying on `.dev.vars`) |
| 22 | **Whitespace handling undocumented** | `.trim()` called on line 91; decision not documented; Sentry thread unresolved | Document if `.trim()` is intentional (safety) or remove if exact match required |

### PR #336: Audit Documentation (Unresolved Thread)

| # | Problem | Error | Fix |
|---|---------|-------|-----|
| 23 | **Reference scope unclear** | Audit refers to tool features without labeling if they're in main/PR/branch/unverified; Sentry thread unresolved | Label each claim: `[In main]`, `[PR #340]`, `[PR #334]`, `[Branch only]`, or `[Unverified]` |

### Runtime Issues (From PR #342 Audit)

| # | Problem | Error | Fix |
|---|---------|-------|-----|
| 24 | **`parallel_tool_calls` without tools** | `parallel_tool_calls: true` with no `tools` array silently reroutes to tool tier | Validate: throw 400 if `parallel_tool_calls` or `tool_choice` set without declared tools OR tool history |
| 25 | **Registry override fallback to Gemini** | Partial override missing `tool-calling` tier → fallback to Gemini (rejects tool requests) | Use `buildEffectiveRegistry()`: merge overrides with defaults, fail closed on missing tier |
| 26 | **Multi-turn tool continuation broken** | Second request (with tool result) omits original `tools` → router sees no tool flags → routes to Gemini | Detect tool history in messages: if `role: "tool"` or `assistant.tool_calls`, route to tool-calling tier |
| 27 | **DEFAULT_REGISTRY not exported** | Registry merge code depends on `DEFAULT_REGISTRY` but it's not exported; cast only happens at import | Export `DEFAULT_REGISTRY`; use Zod validation instead of unsafe type cast |
| 28 | **Override JSON not runtime-validated** | Override registry accepted without validation; malformed entry could break tier selection | Use `modelRegistrySchema.parse(override)` before merging with defaults |
| 29 | **No conversation metadata for provider continuity** | Router infers provider from message history; if history is pruned, provider changes mid-conversation | Store selected provider/model in conversation metadata; use same provider for continuation unless explicit migration |

### Missing Integration Tests

| # | Problem | Error | Fix |
|---|---------|-------|-----|
| 30 | **No live tool-calling test** | Unit tests pass; no curl/preview test for actual tool request/response cycle | Add: live curl test for tool request → tool_calls response → second request with tool result |
| 31 | **No token expiration/rotation test** | Bearer auth tests pass; no test for expired token, rotated token, or token refresh cycle | Add: test for 401 on expired token; test for token rotation without restarting Worker |
| 32 | **No Cloudflare runtime test** | Tests run locally; no verification on actual Cloudflare Workers preview/production | Deploy to staging preview URL; run live tool-calling flow with real Cloudflare AI Gateway |

---

## Summary of All Issues

### By Severity (30 total)
- 🔴 **Critical (blocks merge):** 10 issues (#1–7, #18, #24–25, #27)
- 🟡 **High (unsafe behavior):** 8 issues (#8–12, #21–22, #26)
- 🟠 **Medium (design/clarity):** 12 issues (#13–17, #19–20, #23, #28–32)

### By Category
- **Architecture decisions:** #3, #25, #26, #27, #29 (5 issues)
- **Missing validation:** #28, #27, #24 (3 issues)
- **Missing tests:** #30, #31, #32 (3 issues)
- **Deprecated/unsafe code:** #18, #19, #20 (3 issues)
- **Documentation gaps:** #21, #22, #23 (3 issues)
- **Cost/math errors:** #2 (1 issue)
- **Scope/design issues:** #1, #4–7, #9–17 (13 issues)

### PRs Affected
- **PR #339** (Bearer Auth): 2 unresolved threads (#21–22)
- **PR #340** (Model Registry + Gemini): 3 blockers (#18–20)
- **PR #336** (Audit Docs): 1 unresolved thread (#23)
- **PR #342** (Architecture proposals): 8 runtime issues (#24–29)
- **All PRs**: 3 missing integration tests (#30–32)

### Fix Effort
- **Total time:** ~30–40 hours (20 hours from original + 10–20 hours for new issues)
- **Merge blockers:** 10 critical issues must be fixed
- **Production blockers:** #18 (deprecated model), #25 (unsafe fallback), #26 (broken multi-turn)

---

**Document updated:** 2026-07-12 14:45 UTC
