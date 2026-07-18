# IPI-535 · CF-AI-021 — Add Tool History and Tool-Call Correlation Validation
**Status:** Ready for Phase 1  
**Type:** Bug Fix (High Priority)  
**Priority:** P1  
**Severity:** High  
**Skills:** `cloudflare-workflow`, `gen-test`  
**Blocked By:** IPI-527

---

## Problem Statement

When a request includes tool results (role: "tool" messages), the router must validate that:
1. Each tool_call_id in a result message corresponds to a tool_call from the previous assistant message
2. Tool calls do not reference undefined tools
3. Tool loop depth is bounded (no infinite loops)

Currently: No validation of tool result coherence.

**Impact:** Malformed tool loops could crash the model or produce nonsensical results.

---

## Acceptance Criteria

### A. Validate tool_call_id correlation
```
- [ ] For each role: "tool" message, verify tool_call_id exists in prior assistant.tool_calls
- [ ] Reject with 400 "invalid_tool_call_id" if mismatch
- [ ] Test: valid correlation passes, orphaned IDs rejected
```

### B. Validate tool_call references
```
- [ ] Each tool_call in request must reference a declared tool
- [ ] Reject with 400 "undefined_tool_reference" if not in tools array
- [ ] Test: valid names pass, unknown names rejected
```

### C. Bound tool loop depth
```
- [ ] Count consecutive assistant→tool→assistant exchanges
- [ ] Reject with 400 "tool_loop_limit_exceeded" if > 10 turns
- [ ] Test: 10 passes, 11 rejected
```

### D. Test with streaming reconstruction
```
- [ ] Validate even when tool_calls reconstructed from SSE chunks
- [ ] Ensure chunk buffering doesn't skip validation
```

---

## Proof Commands

```bash
cd /home/sk/wt-ipi-342-fix/services/cloudflare-worker
npm test -- router.tools.test.ts --grep "tool.*correlation"
npm run typecheck
```

---

## Spec Details

**File:** `services/cloudflare-worker/src/router.ts`

Add function:
```ts
function validateToolCallCorrelation(
  messages: ChatMessage[],
  tools: ToolDeclaration[]
): void {
  // Check each tool: message references known tool_call_id
  // Bound loop depth
  // Throw BadRequestError if violated
}
```

Call in `selectProvider()` before returning.

---

## Severity & Blocker

🟡 **HIGH** — Unvalidated tool correlation could cause model crashes. Not a merge blocker but critical for robustness.

