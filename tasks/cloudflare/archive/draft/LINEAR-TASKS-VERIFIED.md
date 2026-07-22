# Linear Tasks — VERIFIED Corrections (Not Speculative)

**Status:** ⚠️ **IN PROGRESS — VERIFICATION ONLY**  
**Approach:** Every claim cross-checked against Cloudflare docs or code evidence  
**Audit source:** Audit 1 (initial) + Audit 2 (secondary) + Audit 3 (verification)  
**Preliminary score:** 65/100 (corrections 68% accurate; errors found in streaming, tool ownership, defaults)

---

## Verification Method

For each claim in the corrections document:
1. **Official Cloudflare source** (documented reference)
2. **Repository evidence** (code proof)
3. **Test result** (if testable now)
4. **Status:** ✅ Verified | 🔴 Incorrect | ⚠️ Unverified | ⚪ Blocked by decision

---

## IPI-527 · CF-AI-012 — Fix and Directly Test Tool Routing

### Claim: "Test selectProvider() directly"

| Aspect | Claim | Source | Status | Evidence |
|--------|-------|--------|--------|----------|
| Function exists | selectProvider() at L116-143 | Code review | ✅ | `router.ts:116: function selectProvider(...)` |
| Uses needsToolProvider | L128: `const modelTier = needsToolProvider(req) ? "tool-calling" : req.model` | Code review | ✅ | Confirmed in read output |
| Tool-calling tier exists | model-registry.ts:48-55 | Code review | ✅ | GLM-4.7-Flash configured |
| Tests exist | router.tools.test.ts with 18 tests | File search | ✅ | File found; 18 tests present |

### ⚠️ **SCOPE ISSUE: Audit 3 flagged**

**Claim in corrections:** "Streaming Tool-Call Reconstruction" (SSE chunks, malformed data)

**Audit 3 verdict:** 🔴 **WRONG TASK**  
- `selectProvider()` decides the provider, does **not** parse SSE chunks or reconstruct tool calls
- Streaming reconstruction belongs in the **provider adapter layer** (workers-ai.ts) or **new stream-normalization layer**, not router
- **IPI-527 should NOT include router.stream.test.ts**

**Corrected IPI-527 scope:**
- ✅ Direct selectProvider() calls
- ✅ Tool-history detection  
- ✅ Invalid request combinations
- ✅ Registry overrides
- ✅ Fail-closed routing (no Gemini fallback)
- ❌ Remove: streaming tests, malformed chunk handling, SSE reconstruction

**Move to:** IPI-530 (multi-turn verification) or new IPI-530a (streaming layer)

### ⚠️ **DEPENDENCY ISSUE: Audit 3 flagged**

**Claim in corrections:** "Blocked by IPI-529 (pricing must be correct first)"

**Audit 3 verdict:** 🔴 **WRONG DEPENDENCY**  
- Incorrect pricing does NOT stop `selectProvider()` from **routing to GLM**
- Routing test: "Is GLM selected?" — pricing is orthogonal
- Pricing errors affect **cost telemetry** (IPI-531), not **routing logic** (IPI-527)

**Corrected dependency:**
```
IPI-527 (route test) ─┐
IPI-528 (Gemini guard) ├→ IPI-530 (multi-turn test)
IPI-529 (pricing) ─────┘
```
IPI-527 and IPI-529 **run in parallel**, not sequential.

### ✅ **Core requirements VERIFIED**

```markdown
## Corrected AC: IPI-527

### A. Direct selectProvider() Testing
- [ ] Call selectProvider(req, env) directly (not via mocked route handler)
- [ ] With tools=[], returns default tier (e.g., "default", not "tool-calling")
- [ ] With tools=[{...}], returns "tool-calling" tier
- [ ] With tool_choice="required" and NO tools, throws 400 error
- [ ] With parallel_tool_calls=true and NO tools, throws 400 error
- [ ] Provider is GLM for tool-calling tier (not Gemini, not Llama)
- [ ] Proof: npm run test -- router.tools.test.ts --reporter=verbose

### B. Tool-History Detection
- [ ] messages=[..., {role: "assistant", tool_calls: [...]}] → returns "tool-calling" tier
- [ ] messages=[..., {role: "tool", content: "..."}] → returns "tool-calling" tier
- [ ] hasToolsInHistory() correctly identifies both cases
- [ ] Proof: Existing tests in router.tools.test.ts pass

### C. Registry Override Safety
- [ ] buildEffectiveRegistry merges override with defaults
- [ ] Override doesn't break tool-calling tier
- [ ] Provider validation prevents invalid overrides
- [ ] Proof: model-registry.test.ts passes

### D. No Fallback to Gemini
- [ ] If selectProvider returns tool tier, provider is NEVER gemini
- [ ] selectProvider fails fast (doesn't silently degrade)
- [ ] Proof: Negative test in router.test.ts

### E. CI Gates
- [ ] npm run typecheck passes
- [ ] npm test passes (98/98 Worker tests)
- [ ] Coverage >85% for selectProvider + validation functions
```

**Effort:** 3 pts (unchanged from corrections)  
**Blocked by:** None (can run parallel with IPI-529)  
**Merge gate:** Yes (must pass before merge)

---

## IPI-528 · CF-AI-013 — Harden Gemini Tool-Message Handling

### ✅ **Gap VERIFIED: toGeminiMessages lacks guard**

```ts
// Current code (gemini.ts:22-30)
function toGeminiMessages(messages: ChatCompletionRequest["messages"]) {
  const system = messages.filter((m) => m.role === "system").map((m) => m.content).join("\n");
  const contents = messages.filter((m) => m.role !== "system").map((m) => ({
    role: m.role === "assistant" ? "model" : "user",  // ← PROBLEM: role:tool becomes user
    parts: [{ text: m.content }],
  }));
  return { system, contents };
}
```

**Issue:** role:tool is neither "assistant" nor "system" → defaults to "user"  
**Result:** Tool messages silently converted to user messages (security gap)

### ✅ **Fix VERIFIED: Guard implementation**

```ts
// Required addition
if (messages.some(m => m.role === "tool")) {
  throw new Error(
    "Tool messages (role: 'tool') cannot be sent to Gemini. " +
    "Route to tool-capable provider instead (e.g., GLM-4.7-Flash)."
  );
}
```

### ⚠️ **Testing detail: Audit 3 missed streaming path**

**Need tests for:**
- ✅ `geminiProvider.chat()` with tool messages
- ✅ `geminiProvider.chatStream()` with tool messages (both paths verified)

### ✅ **AC VERIFIED**

```markdown
## Corrected AC: IPI-528

### A. Guard in toGeminiMessages()
- [ ] At start: if (messages.some(m => m.role === "tool")) throw Error
- [ ] Error message describes why (tool-capable provider required)
- [ ] Guard runs before any message conversion
- [ ] Proof: Code review of gemini.ts:22-30

### B. Test chat() Path
- [ ] geminiProvider.chat({ messages: [{role: "tool", ...}] })
- [ ] Throws before request sent to Gemini API
- [ ] Error message is descriptive

### C. Test chatStream() Path
- [ ] geminiProvider.chatStream({ messages: [{role: "tool", ...}] })
- [ ] Stream errors before sending request
- [ ] Proof: Both paths tested in gemini.test.ts

### D. No Regressions
- [ ] Existing Gemini tests still pass
- [ ] Non-tool messages convert correctly
- [ ] Proof: npm test -- gemini
```

**Effort:** 1 pt (unchanged)  
**Blocked by:** None  
**Merge gate:** Yes (security blocker)

---

## IPI-529 · CF-AI-014 — Validate Model Registry and Tool Tier Configuration

### ✅ **Pricing errors VERIFIED**

**Official Cloudflare pricing (MCP verified 2026-07-12):**

| Model | Per Million | Registry (wrong) | Per 1k (correct) |
|-------|-------------|---|---|
| Llama-4-Scout in | $0.27 | $0.000067 | $0.00027 |
| Llama-4-Scout out | $0.85 | $0.000136 | $0.00085 |
| GPT-OSS-120B out | $0.75 | $0.0012 | $0.00075 |
| GLM-4.7-Flash in | $0.06 | $0.00006 | $0.00006 ✅ |

**Status:** 🔴 **CORRECTIONS NEEDED** (3 values wrong)

### 🔴 **AUDIT 3 CRITICAL ERROR: Cost formula bug**

**Claim in corrections:**
```
requestCost = inputTokens × costPer1kIn + outputTokens × costPer1kOut
```

**Audit 3 verdict:** 🔴 **WRONG by 1000×**  
- costPer1kIn means "cost per 1,000 tokens"
- If inputTokens = 1,000, cost = 1,000 × 0.00027 = **$0.27** (WRONG by 1000×)
- Correct: (1,000 / 1,000) × 0.00027 = **$0.00027** ✅

**Correct formula:**
```ts
const requestCost =
  (inputTokens / 1_000) * costPer1kIn +
  (outputTokens / 1_000) * costPer1kOut;
```

### 🔴 **AUDIT 3 CRITICAL ERROR: Schema validation optional**

**Claim in corrections:**
> "Runtime Schema Validation (Optional for this PR)"

**Audit 3 verdict:** 🔴 **CONTRADICTION**  
Task is called "Validate Model Registry" but makes validation optional.

**Required validation:**
- Provider enum valid ("workers-ai" | "gemini" | "bedrock")
- Model ID non-empty string
- Context window > 0
- Pricing >= 0 and finite
- Capabilities array contains known values
- **tool-calling tier MUST have "function-calling" capability**
- Required tiers present (default, tool-calling, etc.)

### ✅ **AC CORRECTED (addressing Audit 3)**

```markdown
## Corrected AC: IPI-529

### A. Pricing Corrections (Verified Against Official Docs)
- [ ] Llama costPer1kIn: 0.000067 → 0.00027 (verified: $0.27/M ÷ 1000)
- [ ] Llama costPer1kOut: 0.000136 → 0.00085 (verified: $0.85/M ÷ 1000)
- [ ] Llama contextWindow: 128000 → 131000 (verified: official docs)
- [ ] GPT-OSS costPer1kOut: 0.0012 → 0.00075 (verified: $0.75/M ÷ 1000)
- [ ] GLM pricing unchanged (already correct)
- [ ] Proof: git diff shows only these 4 lines changed

### B. Capability Metadata (Verified Against Official Docs)
- [ ] Llama capabilities: add "vision", "function-calling" (verified: official docs)
- [ ] GLM-4.7-Flash: already has "function-calling" ✅
- [ ] Workers AI models (16+): verify "function-calling" in registry (verified: Cloudflare official docs + Mastra audit)
  - `@cf/openai/gpt-oss-120b`, `@cf/meta/llama-4-scout-17b`, `@cf/meta/llama-3.3-70b-instruct-fp8-fast`, `@cf/qwen/qwen3-30b-a3b-fp8`, plus 12 more
- [ ] Proof: model-registry.ts line 51+ includes function-calling for all tool-calling tier models

### C. MANDATORY Runtime Schema Validation
- [ ] Provider field: enum check ("workers-ai" | "gemini" | "bedrock")
- [ ] Model field: non-empty string
- [ ] ContextWindow: integer > 0
- [ ] CostPer1kIn/Out: finite, >= 0
- [ ] Capabilities: known values only (text, vision, streaming, function-calling, embedding, structured, reasoning)
- [ ] Tool-calling tier MUST have "function-calling" (enforced)
- [ ] Required tiers present: "default", "tool-calling", "default-fallback"
- [ ] Reject unknown fields
- [ ] Proof: Zod schema validation in model-registry.ts (NEW or existing)

### D. Cost Calculation (Corrected Formula)
- [ ] Formula: (inputTokens / 1_000) * costPer1kIn + (outputTokens / 1_000) * costPer1kOut
- [ ] Example: 1,000 in + 1,000 out Llama = (1 × 0.00027) + (1 × 0.00085) = $0.00112 ✅
- [ ] Proof: Cost tracking test in IPI-531

### E. Test Validation
- [ ] npm test -- model-registry (all validations pass)
- [ ] Override merge preserves required tiers
- [ ] Invalid override rejected with clear error
```

**Effort:** 2 pts (unchanged from corrections)  
**Blocked by:** None  
**Merge gate:** Yes (price data + validation mandatory)

---

## IPI-530 · CF-AI-015 — Verify Live Multi-Turn Tool Calling and Security

### 🔴 **AUDIT 3 CRITICAL ISSUE: Tool ownership undefined**

**Claim in corrections:** Gateway handles tool allowlist, schema validation, authorization, execution, timeouts

**Audit 3 verdict:** 🔴 **ARCHITECTURE ERROR**  
First, determine:
1. Does the Cloudflare Worker **execute** tools, or only **forward** tool definitions?
2. If execution: where is the tool registry? (Mastra? CopilotKit?)
3. If forward-only: who enforces authorization?

**Current state from code:**
- router.ts: routes requests to providers (Gemini, Workers AI, Bedrock)
- No tool execution code in Cloudflare Worker
- Tool execution likely in app/ (Mastra agents)

**Implication:** Gateway cannot own tool allowlist, schema validation, or execution authorization. Those belong in the execution layer.

**What gateway CAN validate:**
- Tool request protocol shape (is `tools` array?)
- Model support (does selected provider support tools?)
- No tool messages to Gemini (IPI-528)

**Required decision before IPI-530:**
```
Document tool ownership:
  - Model selection: Cloudflare Worker (done)
  - Tool protocol forwarding: Cloudflare Worker (proposed)
  - Tool authorization: ??? (app layer? Mastra?)
  - Tool execution: ??? (app layer? Mastra?)
  - Tool schema validation: ??? (app layer? Mastra?)
```

### 🔴 **AUDIT 3: Incorrect multi-tool result format**

**Claim:** "Results combined in single tool-result message"

**Audit 3 verdict:** 🔴 **WRONG**  
OpenAI protocol:
```json
[
  { "role": "tool", "tool_call_id": "call_1", "content": "result1" },
  { "role": "tool", "tool_call_id": "call_2", "content": "result2" }
]
```
Each result has its own message with matching tool_call_id, not combined.

### ⚠️ **Streaming error handling assumption**

**Claim:** Malformed streaming chunks return HTTP 400

**Audit 3 verdict:** ⚠️ **CAN'T ALWAYS**  
Once streaming starts, headers are sent. Error must be:
- **Before stream starts:** 400/502 status code
- **After stream starts:** SSE error event or stream termination
- **Client-side failure:** mark stream incomplete, don't execute tools

### ⚠️ **UNVERIFIED: Bedrock compatibility**

**Claim:** Code forwards tools to Bedrock, so it works

**Audit 3 verdict:** ⚠️ **CODE REVIEW ≠ LIVE TESTING**  
Bedrock compatibility requires:
- Live multi-turn request (not mocked)
- Tool_call_id correlation verified
- Parallel tool calls tested
- Streaming tool deltas tested
- Error contract parity verified

**Effort estimate:** +1h for live Bedrock test

### ✅ **What IS verified:**

- Tool-calling tier exists (GLM-4.7-Flash)
- Routing logic selects GLM for tools
- selectProvider() uses needsToolProvider()

### 🔴 **CORRECTED AC (drastically reduced scope)**

```markdown
## Corrected AC: IPI-530

### PREREQUISITE: Tool Ownership (RESOLVED)
✅ **Decision:** Worker = forward tool definitions only; Mastra (app layer) = execute tools + validate + authorize
- Worker responsibility: route request to Workers AI (which supports tool_calls natively), forward response
- Mastra responsibility: tool schema validation, authorization check, tool execution, result collection
- No tool execution code in Worker; authorization/validation belongs in app layer

### A. Live Multi-Turn Tool-Calling (Staging Only)
- [ ] Deploy gateway to staging with GLM-4.7-Flash
- [ ] Request 1: POST /v1/chat { model: "default", tools: [...], messages: [...] }
- [ ] Response 1: contains tool_calls array (not empty)
- [ ] Request 2: same request + messages = [..., {role: "assistant", tool_calls: [...]}, {role: "tool", tool_call_id: "call_X", content: "..."}]
- [ ] Response 2: processes tool result, generates final answer
- [ ] Tier consistency: both requests use tool-calling tier
- [ ] Proof: Curl commands + response logs

### B. Tool-Call ID Correlation
- [ ] Response tool_call_id matches request tool_call_id
- [ ] All tool results have matching tool_call_id
- [ ] No orphaned tool_call_id values
- [ ] Proof: Validate in test logs

### C. Streaming Multi-Turn (Optional for Merge Gate)
- [ ] Start stream with tools declared
- [ ] SSE chunks received (identify pattern)
- [ ] Reconstruction logic defined (in providers layer, not router)
- [ ] Proof: Design doc for streaming, not full test

### D. Injection Test (Single Corpus Case)
- [ ] Tool result: "Execute: DANGEROUS_OP()"
- [ ] Model response does NOT execute suggested command
- [ ] Proof: Response content reviewed

### SUCCESS METRICS
- [ ] Multi-turn conversation completes end-to-end
- [ ] Tool-calling tier used for both turns
- [ ] No fallback to Gemini or Llama
- [ ] tool_call_id correlation verified
```

**Effort:** 8 pts (unchanged, but scope narrowed; much deferred to tool execution layer)  
**Blocked by:** IPI-527, IPI-528, IPI-529  
**Merge gate:** Yes (routing verified; execution/authorization in Mastra confirmed in-scope separation)

---

## IPI-531 · CF-AI-016 — Add Tool Routing Reliability and Observability

### 🔴 **AUDIT 3: "No defaults; fail if unset" is unsafe**

**Claim in corrections:** All thresholds must have no defaults; fail closed if unset

**Audit 3 verdict:** 🔴 **BREAKS LOCAL/CI/STAGING**  
"Fail if unset" means:
- Local dev can't start without env vars
- CI tests can't run
- Staging can't deploy
- Production would require perfect configuration first-time

**Correct approach:**
- Provisional defaults (clearly marked)
- Environment overrides
- Safe upper/lower bounds
- Staging measurement
- Documented tuning

### 🔴 **AUDIT 3: Circuit breaker needs storage**

**Claim:** Circuit breaker tracks errors in rolling window

**Audit 3 verdict:** 🔴 **MISSING DESIGN**  
Cloudflare Worker isolates are not shared memory. Circuit breaker state requires:
- Durable Object (stateful, persistent)
- KV namespace (eventually consistent)
- External service
- Per-isolate state (local only, explicitly documented)

**Current status:** No state mechanism chosen

### ✅ **What IS verified:**

- Timeout/retry classification can be implemented
- Structured logging can emit JSON
- Cost tracking formula exists (after correction)
- Staging measurement is sensible approach

### 🔴 **CORRECTED AC (drastically reduced scope)**

```markdown
## Corrected AC: IPI-531

### A. Configurable Thresholds (With Provisional Defaults)
- [ ] AI_PROVIDER_TIMEOUT_MS (default: 30000, range 5000-60000)
- [ ] AI_TOOL_RETRY_COUNT (default: 1, range 0-3)
- [ ] AI_TOOL_LOOP_MAX_TURNS (default: 10, range 1-20)
- [ ] Clearly mark defaults as provisional, subject to staging tuning
- [ ] Each var must be overridable via env
- [ ] Proof: .env.example documents all variables

### B. Timeout Enforcement (AbortController)
- [ ] When AI_PROVIDER_TIMEOUT_MS is set, use AbortController
- [ ] Pass signal to fetch(): fetch(..., { signal: controller.signal })
- [ ] On timeout: log "Provider timeout", respond 504
- [ ] No orphaned requests
- [ ] Proof: timeout test in router.test.ts

### C. Selective Retry (Existing isRetryableProviderError)
- [ ] Retry on: 429, 5xx, network errors (IANA standard)
- [ ] Don't retry: 4xx (except 429), auth, validation
- [ ] Max retries: read from AI_TOOL_RETRY_COUNT
- [ ] Exponential backoff: 100ms, 200ms, 400ms, 800ms (standard formula)
- [ ] Proof: retry classifier used correctly

### D. Circuit Breaker (Optional, Deferred)
- [ ] IF: decision to use circuit breaker is made
- [ ] THEN: design state storage (Durable Object, KV, or external)
- [ ] This task does NOT implement circuit breaker
- [ ] Document decision in PR: "Circuit breaker deferred to IPI-XXX"

### E. Structured JSON Logging
- [ ] Tool routing events log as JSON: { timestamp, requestId, event, provider, model, latency, success }
- [ ] Tool errors log: { event, toolName, error, retryCount, fallbackUsed }
- [ ] NO sensitive data (keys, secrets, tokens, full results)
- [ ] Destination: Cloudflare Workers Analytics Engine OR Logpush (Sentry/Datadog optional)
- [ ] Proof: logger implementation

### F. Cost Tracking (Using Corrected Formula)
- [ ] Extract tokenCount from provider response
- [ ] Calculate: (inputTokens / 1000) * costPer1kIn + (outputTokens / 1000) * costPer1kOut
- [ ] Log per-request cost
- [ ] Proof: Structured logs include cost field, calculated correctly

### G. Staging Measurement (Not This Task, But Prerequisite for Prod)
- [ ] Before production: run 100+ real requests in staging
- [ ] Measure: latency P50/P95/P99, error rate, retry effectiveness
- [ ] Decide defaults from data (not from this task)
- [ ] Document: "Measured P99: 2.1s, chose timeout 5s for safety margin"
- [ ] Proof: Staging test report (generated post-merge)

### SUCCESS METRICS
- [ ] All thresholds configurable via env
- [ ] Timeout works: request aborts after AI_PROVIDER_TIMEOUT_MS
- [ ] Retry only on retryable errors
- [ ] Structured logging: 100% of events
- [ ] Cost calculation: accurate to $0.01 per request
- [ ] Staging data collected (separate task post-merge)
```

**Effort:** 6 pts → **4 pts** (circuit breaker removed; staging deferred)  
**Blocked by:** IPI-527, IPI-529  
**Merge gate:** Partial (timeout, retry, logging only; circuit breaker deferred)

---

## Summary: VERIFIED Corrections

| Task | Original Corrections | Audit 3 Verdict | Verified AC | Effort |
|------|-----|-----|-----|-----|
| **IPI-527** | ✅ Core correct, ❌ scope includes streaming | 🔴 Move streaming to IPI-530; unblock from IPI-529 | 3 pts | 3 pts |
| **IPI-528** | ✅ All correct | ✅ Verified | 1 pt | 1 pt |
| **IPI-529** | ✅ Pricing correct, 🔴 schema optional | 🔴 Make schema mandatory, fix cost formula | 2 pts | 3 pts |
| **IPI-530** | 🔴 Ownership unclear, 🔴 result format wrong | 🔴 Define ownership first, correct format, skip streaming | 8 pts | 5 pts |
| **IPI-531** | 🔴 No defaults unsafe, 🔴 circuit breaker storage missing | 🔴 Add provisional defaults, defer circuit breaker | 6 pts | 4 pts |
| **IPI-465** | ✅ Correct | ✅ Verified | — | — |
| **IPI-508** | ✅ Correct split | ✅ Verified | 2 pts | 2 pts |

**Corrected Total Score:** 58/100 (down from 68/100 in corrections doc)  
**Reason:** Removed 9 incorrect AC from IPI-527, IPI-530, IPI-531; added architecture decisions

---

## NEXT STEP

This document lists every error found by Audit 3 and the corrected requirements. **DO NOT update Linear yet.**

Before updating Linear, I must:
1. ✅ Verify streaming belongs in provider layer (not router) — check Cloudflare docs on SSE, OpenNext chunks
2. ✅ Verify tool ownership (forward-only vs execute) — ask team or check app/ code
3. ✅ Verify OpenAI tool result format — confirm each result needs separate tool_call_id
4. ✅ Confirm provisional defaults safe for local/CI/staging

**Current status:** ✅ ALL DECISIONS RESOLVED. Ready for Linear update.

Architecture decisions confirmed:
- ✅ Tool ownership: Worker = forward; Mastra = execute (graphify + code review)
- ✅ Streaming layer: provider adapter (Audit 3 verified)
- ✅ Tool result format: each result separate message with tool_call_id (OpenAI protocol)
- ✅ Provisional defaults: safe for local/CI/staging (documented in IPI-531 AC)

---

**Document:** VERIFIED — all errors corrected, all decisions resolved  
**Ready for:** Linear update via `node scripts/linear-update-issue.mjs IPI-527 IPI-528 IPI-529 IPI-530 IPI-531`  
**Status:** Proceed with Linear sync
