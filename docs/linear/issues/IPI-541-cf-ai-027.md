# IPI-541 · CF-AI-027 — Add Live Cloudflare GLM Multi-Turn E2E Test
**Status:** Blocked on PR merge  
**Type:** Verification Test  
**Priority:** P0  
**Severity:** Critical  
**Skills:** `cloudflare-workflow`, `pr-workflow`  
**Blocked By:** IPI-527, IPI-528, IPI-529, IPI-530, IPI-531

---

## Problem Statement

All prior tests are unit/integration on mocked or local inputs. Never tested against live Cloudflare Workers AI GLM-4.7-Flash with real tool-calling request/response cycle.

Currently: No live E2E test.

**Impact:** P0 production blocker. Code could fail at runtime despite passing all unit tests.

---

## Acceptance Criteria

### A. Call live GLM with tool-calling request
```
- [ ] Deploy to staging Worker
- [ ] Send real request with tools declared
- [ ] Assert: 200 response, tool_calls in body
```

### B. Verify tool_calls are valid
```
- [ ] Parse tool_calls from response
- [ ] Assert: all IDs, types, names valid
- [ ] Assert: all names in declared tools list
- [ ] Assert: arguments are valid JSON
```

### C. Send tool result back to same model
```
- [ ] Construct tool result message
- [ ] Send same conversation back to GLM
- [ ] Assert: 200 response, final answer (not more tool_calls)
```

### D. Verify streaming tool-call reconstruction
```
- [ ] Enable streaming on live GLM request
- [ ] Buffer chunks and reconstruct tool_calls
- [ ] Assert: same tool_calls as non-streaming
```

### E. Log full interaction for audit
```
- [ ] Request ID
- [ ] User message
- [ ] tool_calls from model
- [ ] Tool results sent back
- [ ] Final answer
- [ ] Model and provider used
```

---

## Proof Commands

```bash
cd /home/sk/wt-ipi-342-fix
npm run deploy:staging
curl -X POST https://staging.ipix-gateway.com/v1/chat/completions \
  -H "Authorization: Bearer $STAGING_TOKEN" \
  -H "Content-Type: application/json" \
  -d @test/e2e/multi-turn-tool-request.json
```

---

## Spec Details

**Files:**
- `services/cloudflare-worker/src/__tests__/e2e-live-glm.test.ts` (new)
- `test/e2e/multi-turn-tool-request.json` (new) — fixture

---

## Severity & Blocker

🔴 **CRITICAL** — Must pass before production deployment.

