# IPI-527 · CF-AI-013 — Add selectProvider Integration Test

**Status:** Ready for Phase 1  
**Type:** Bug Fix (Critical Blocker)  
**Priority:** P0  
**Severity:** Critical  
**Skills:** `cloudflare-workflow`, `gen-test`, `pr-workflow`  
**Blocked By:** None

---

## Problem Statement

PR #342 tests router helper functions in isolation (`resolveModelEntry`, manual object merges) but never invokes the actual `selectProvider(req, env)` function. Tests pass even though core routing logic is untested.

**Impact:** Code ships with unverified routing behavior.

---

## Acceptance Criteria

### A. Import actual router functions in test file

```text
- [ ] router.tools.test.ts imports selectProvider, validateToolRequest, hasToolsInHistory, needsToolProvider
- [ ] No type errors on import
```

### B. Test selectProvider routes tool requests to GLM

```text
- [ ] Call selectProvider with ChatCompletionRequest containing tools array
- [ ] Assert returned entry.model === "@cf/zai-org/glm-4.7-flash"
- [ ] Assert returned provider === workersAiProvider
```

### C. Test selectProvider respects tool history

```text
- [ ] Call selectProvider with message containing role: "tool"
- [ ] Assert routes to tool-calling tier despite no top-level tools
```

### D. Test selectProvider preserves non-tool tiers

```text
- [ ] Call selectProvider with no tools, no history, requesting "structured" tier
- [ ] Assert tier preserved (not overridden to tool-calling)
- [ ] Assert provider === geminiProvider
```

### E. Test selectProvider error handling

```text
- [ ] Call selectProvider when tool-calling tier missing
- [ ] Assert throws error containing "Tool-capable provider required"
```

---

## Proof Commands

```bash
cd /home/sk/wt-ipi-342-fix/services/cloudflare-worker
npm test -- router.tools.test.ts  # All tests pass
npm run typecheck  # No type errors
```

---

## Spec Details

**File:** `services/cloudflare-worker/src/router.tools.test.ts`

**Add tests after line 237 (after existing registry tests):**

```ts
describe("selectProvider routing", () => {
  it("selectProvider routes tool request to GLM", () => {
    const req = {
      model: "default",
      messages: [{ role: "user", content: "Get weather" }],
      tools: [{ type: "function", function: { name: "get_weather", ... } }]
    };
    const env = { CLOUDFLARE_API_TOKEN: "test", CLOUDFLARE_ACCOUNT_ID: "test" };
    
    const result = selectProvider(req, env);
    expect(result.entry.model).toBe("@cf/zai-org/glm-4.7-flash");
  });
  // ... additional test cases per AC B–E
});
```

---

## Severity & Blocker

🔴 **CRITICAL** — Must pass before PR merge. This test closure on core routing logic.
