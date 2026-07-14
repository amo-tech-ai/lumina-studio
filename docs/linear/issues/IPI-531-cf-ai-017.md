# IPI-531 · CF-AI-017 — Add Tool Routing Reliability, Observability & Cost Tracking

**Status:** Ready for Phase 1  
**Type:** Feature (Reliability)  
**Priority:** P1  
**Severity:** High  
**Skills:** `cloudflare-workflow`  
**Blocked By:** IPI-527, IPI-529

---

## Problem Statement

Tool routing has no timeout, retry, or observability. Requests hang indefinitely, failures aren't logged, costs aren't tracked. Production operations lack visibility and resilience.

**Impact:** Silent failures, unbounded latency, no cost tracking, no audit trail.

---

## Acceptance Criteria

### A. Configurable Thresholds (With Provisional Defaults)

- [ ] `AI_PROVIDER_TIMEOUT_MS` (default: 30000, range 5000–60000, configurable via env)
- [ ] `AI_TOOL_RETRY_COUNT` (default: 1, range 0–3, configurable via env)
- [ ] `AI_TOOL_LOOP_MAX_TURNS` (default: 10, range 1–20, configurable via env)
- [ ] `.env.example` documents all variables + defaults marked "provisional, tune from staging data"

### B. Timeout Enforcement (AbortController)

- [ ] When `AI_PROVIDER_TIMEOUT_MS` is set, use `AbortController`
- [ ] Pass signal to `fetch(..., { signal: controller.signal })`
- [ ] On timeout: log `"Provider timeout"`, respond with 504
- [ ] No orphaned requests
- [ ] Proof: timeout test in `router.test.ts` passes

### C. Selective Retry (Using isRetryableProviderError)

- [ ] Retry on: 429, 5xx, network errors (IANA standard)
- [ ] Never retry: 4xx (except 429), auth, validation
- [ ] Max retries: read from `AI_TOOL_RETRY_COUNT`
- [ ] Exponential backoff: 100ms, 200ms, 400ms, 800ms
- [ ] Proof: retry classifier used correctly in selectProvider call chain

### D. Circuit Breaker (Optional, Deferred)

- [ ] **This task does NOT implement circuit breaker**
- [ ] Document in PR: "Circuit breaker deferred to IPI-XXX (requires Durable Object state)"
- [ ] Fallback + retry sufficient for MVP

### E. Structured JSON Logging

- [ ] Tool routing events log as JSON: `{ timestamp, requestId, event, provider, model, latency, success }`
- [ ] Tool errors log: `{ event, toolName, error, retryCount, fallbackUsed }`
- [ ] NO sensitive data (keys, secrets, tokens, full results)
- [ ] Destination: Cloudflare Workers Analytics Engine (or Sentry via MCP)
- [ ] Proof: logger implementation in `router.ts`

### F. Cost Tracking (Using Corrected Formula)

- [ ] Extract `inputTokens`, `outputTokens` from provider response
- [ ] Calculate: `(inputTokens / 1000) * costPer1kIn + (outputTokens / 1000) * costPer1kOut`
- [ ] Log per-request cost in structured event
- [ ] Example: 1,000 in + 1,000 out Llama = (1 × 0.00027) + (1 × 0.00085) = $0.00112 ✅
- [ ] Proof: structured logs include cost field, correctly calculated

### G. Staging Measurement (Post-Merge Task, Not This PR)

- [ ] Before production: run 100+ real requests in staging
- [ ] Measure: latency P50/P95/P99, error rate, retry effectiveness
- [ ] Decide final defaults from data, update `.env.production`
- [ ] Document: "Measured P99: 2.1s, chose timeout 5s for safety margin"

---

## Proof Commands

```bash
cd /home/sk/ipix/services/cloudflare-worker
npm test -- router.test.ts  # All tests pass
npm run typecheck
npm run build

# Verify timeout works locally:
wrangler dev  # start local worker
# In another terminal, send slow request and verify 504 after 30s
```

---

## Architecture Notes

**Reliability flow:**

1. Request arrives → AbortController created with timeout
2. selectProvider called with timeout signal
3. If provider times out → 504 response
4. If provider returns 5xx/429 → retry with backoff (up to `AI_TOOL_RETRY_COUNT`)
5. If retries exhausted → Bedrock fallback (IPI-526 already merged)

**Observability:**

- Every request: timestamp, requestId, provider, model, latency, cost
- Errors: tool name, error message, retry count, fallback decision

---

## Severity & Blocker

🟡 **HIGH** — Reliability features required before production. Merge gate: timeouts + logging only. Circuit breaker deferred.
