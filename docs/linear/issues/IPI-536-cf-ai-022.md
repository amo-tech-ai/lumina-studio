# IPI-536 · CF-AI-022 — Add Streaming Tool-Call Failure Tests
**Status:** Ready for Phase 1  
**Type:** Bug Fix (High Priority)  
**Priority:** P1  
**Severity:** High  
**Skills:** `cloudflare-workflow`, `gen-test`  
**Blocked By:** IPI-527

---

## Problem Statement

Streaming tool_calls are reconstructed across SSE chunks. If a chunk arrives malformed, corrupted, or incomplete, the reconstruction must fail safely, not silently drop the tool_call or corrupt the arguments.

Currently: No tests for streaming chunk failures.

**Impact:** Silent tool-call loss or corruption under network failures.

---

## Acceptance Criteria

### A. Test incomplete chunk buffering
```
- [ ] Simulate chunk stream that ends mid-tool_call
- [ ] Assert: returns error, not partial tool_call
- [ ] Test: chunk "...tool_calls: [{id: ..." without closing
```

### B. Test malformed JSON in chunk
```
- [ ] Simulate arguments JSON: "...arguments: {invalid json}..."
- [ ] Assert: 400 error, not silent skip
- [ ] Test: missing quotes, unescaped quotes, truncation
```

### C. Test duplicate tool_call_id in same stream
```
- [ ] Same ID appears twice in streaming response
- [ ] Assert: error, not last-write-wins silently
```

### D. Test tool_call across chunk boundary
```
- [ ] tool_call split across two chunks: first chunk ends mid-string
- [ ] Assert: buffer correctly reassembles
- [ ] Verify JSON.parse succeeds
```

---

## Proof Commands

```bash
cd /home/sk/wt-ipi-342-fix/services/cloudflare-worker
npm test -- router.toolloop.test.ts --grep "stream.*fail"
npm run typecheck
```

---

## Spec Details

**Files:**
- `services/cloudflare-worker/src/router.toolloop.test.ts` — add streaming-failure test suite
- `services/cloudflare-worker/src/stream-reconstruct.ts` — ensure reconstruction throws on malformed

---

## Severity & Blocker

🟡 **HIGH** — Streaming robustness is critical for production. Not a merge blocker but must be verified before live traffic.

