# IPI-539 · CF-AI-025 — Add Tool Execution Timeouts and Loop Limits
**Status:** Ready for Phase 1  
**Type:** Reliability Feature (High Priority)  
**Priority:** P1  
**Severity:** High  
**Skills:** `cloudflare-workflow`, `gen-test`  
**Blocked By:** IPI-527, IPI-535

---

## Problem Statement

Tool execution can hang (timeout) or loop indefinitely. Without bounds, the Worker can exhaust its time budget (15 seconds max in Cloudflare) or enter an infinite loop.

Currently: No timeout on tool execution; loop depth bounded in validation but not enforced at runtime.

**Impact:** P1 reliability issue. Hung tools can cause cascading failures.

---

## Acceptance Criteria

### A. Set per-tool execution timeout
```
- [ ] Default: 5 seconds
- [ ] Configurable via TOOL_TIMEOUT_MS env var
- [ ] Per-tool override in tool allowlist
- [ ] Cancel execution on timeout, return error
```

### B. Abort tool execution mid-stream
```
- [ ] Use AbortController to cancel fetch/promise
- [ ] Return 504 "tool_execution_timeout"
- [ ] Log timeout with tool name and elapsed time
```

### C. Bound total multi-turn depth
```
- [ ] Max 10 assistant→tool→assistant turns per request
- [ ] Count at request start, check before each tool invocation
- [ ] Return 400 "tool_loop_depth_exceeded" if violated
```

### D. Test timeout behavior
```
- [ ] Slow tool (hangs for 10s) aborted at 5s
- [ ] Fast tool (100ms) completes
- [ ] Loop depth counter increments correctly
```

---

## Proof Commands

```bash
cd /home/sk/wt-ipi-342-fix/services/cloudflare-worker
npm test -- router.tools.test.ts --grep "timeout"
npm run typecheck
```

---

## Spec Details

**File:** `services/cloudflare-worker/src/router.ts`

Add:
```ts
const abortController = new AbortController();
const timeoutId = setTimeout(() => abortController.abort(), TOOL_TIMEOUT_MS);
try {
  const result = await executeTool(tool, args, { signal: abortController.signal });
} catch (e) {
  if (e.name === "AbortError") throw new ToolTimeoutError(...);
} finally {
  clearTimeout(timeoutId);
}
```

---

## Severity & Blocker

🔴 **HIGH** — Production reliability gate. Must be in place before live traffic.

