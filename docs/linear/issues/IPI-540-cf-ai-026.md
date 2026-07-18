# IPI-540 · CF-AI-026 — Add Retry, Backoff, Fallback, and Circuit-Breaker Policy
**Status:** Ready for Phase 1  
**Type:** Reliability Feature (High Priority)  
**Priority:** P1  
**Severity:** High  
**Skills:** `cloudflare-workflow`, `gen-test`  
**Blocked By:** IPI-527

---

## Problem Statement

Provider calls (GLM, Gemini, Bedrock) can fail transiently (429 rate limit, 5xx error, timeout). Without retry + backoff, transient failures result in 5xx responses to the user.

Currently: No retry or backoff policy on provider calls.

**Impact:** Production reliability issue. Transient failures cause visible outages.

---

## Acceptance Criteria

### A. Exponential backoff on retryable errors
```
- [ ] Retryable: 429, 503, 504, timeout
- [ ] Not retryable: 400, 401, 403, 4xx (except 429)
- [ ] Backoff: 100ms, 200ms, 400ms, 800ms (max 3 retries)
- [ ] Test: 429 retries 3 times, 400 fails immediately
```

### B. Fallback to secondary provider on repeated failure
```
- [ ] Primary GLM fails 3 times with 5xx → try Bedrock
- [ ] Bedrock fails → return 503 "service unavailable"
- [ ] Test: GLM 503 → Bedrock 200 succeeds
```

### C. Circuit breaker per provider
```
- [ ] Track error rate: if > 50% of last 100 calls fail, circuit open
- [ ] Circuit open: fast-fail (do not attempt call), return 503
- [ ] Circuit close: exponential backoff (1 min, 2 min, 5 min)
- [ ] Test: 50+ consecutive failures → circuit opens
```

### D. Observability
```
- [ ] Log each retry with backoff duration
- [ ] Log circuit state transitions
- [ ] Alert on circuit open
```

---

## Proof Commands

```bash
cd /home/sk/wt-ipi-342-fix/services/cloudflare-worker
npm test -- router.tools.test.ts --grep "retry\|circuit"
npm run typecheck
```

---

## Spec Details

**File:** `services/cloudflare-worker/src/retry-policy.ts` (new)

---

## Severity & Blocker

🔴 **HIGH** — Production reliability gate. Must be in place before live traffic.

