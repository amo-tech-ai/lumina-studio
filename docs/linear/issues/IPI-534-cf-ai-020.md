# IPI-534 · CF-AI-020 — Add Monitoring & Observability for Tool Routing

**Status:** Ready for Phase 1  
**Type:** Feature (Production Hardening)  
**Priority:** P1  
**Severity:** Medium  
**Skills:** `cloudflare-workflow`, `pr-workflow`, `ipix-supabase`  
**Blocked By:** None (independent)

---

## Problem Statement

Logging is basic. Production visibility into tool routing is insufficient. Missing: request tracking, cost telemetry, error categorization, alerts.

**Impact:** Production debugging difficult; cost overruns undetected.

---

## Acceptance Criteria

### A. Add structured logging to selectProvider

```text
- [ ] Log: request_id, requested_model, selected_tier, selected_provider, selected_model
- [ ] Log: tool_count, tool_names, parallel_tool_calls flag
- [ ] Log: override_used (yes/no)
```

### B. Add latency and cost tracking

```text
- [ ] Measure selectProvider execution time
- [ ] Log: estimated_cost = (input_tokens * costPer1kIn + output_tokens * costPer1kOut) / 1000
- [ ] Include in structured log
```

### C. Categorize errors

```text
- [ ] 400 validation: "validation_error"
- [ ] 429 rate limit: "rate_limit"
- [ ] 500+ provider: "provider_error"
- [ ] Timeout: "timeout"
- [ ] Log category with error details
```

### D. Add alerts for anomalies

```text
- [ ] Alert: tool requests routed to Gemini (indicates router bug)
- [ ] Alert: invalid override (configuration error)
- [ ] Alert: high error rate on tool tier (>5% failures)
- [ ] Alert: cost spike (>2x daily average)
```

### E. Prevent secret leakage

```text
- [ ] Never log: API keys, bearer tokens, full prompts
- [ ] Never log: sensitive tool arguments
- [ ] Sanitize customer data in logs
```

---

## Proof Commands

```bash
cd /home/sk/wt-ipi-342-fix/services/cloudflare-worker
npm test -- observability.test.ts
npm run typecheck

# Verify logs don't contain secrets
grep -r "API_KEY\|Bearer\|Authorization" logs/ && echo "FAIL" || echo "PASS"
```

---

## Spec Details

**Files to modify:**

- `router.ts`: Add structured logging in selectProvider
- `model-registry.ts`: Add cost calculation helpers
- `gateway-errors.ts`: Categorize errors
- `observability.ts` (new): Alert definitions

---

## Severity & Blocker

🟡 **MEDIUM** — Not a merge blocker but strongly recommended for production. Without this, operational blind spots.
