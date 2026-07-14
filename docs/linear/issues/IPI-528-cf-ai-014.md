# IPI-528 · CF-AI-014 — Add Explicit Tool Message Guard to toGeminiMessages
**Status:** Ready for Phase 1  
**Type:** Bug Fix (Critical Blocker)  
**Priority:** P0  
**Severity:** Critical  
**Skills:** `cloudflare-workflow`, `gemini`  
**Blocked By:** None

---

## Problem Statement

The `toGeminiMessages()` function doesn't explicitly reject `role: "tool"` messages. If such a message reaches the function (defensive layer failure), it's silently converted to `role: "user"`, corrupting the message type.

**Impact:** Silent message corruption if router validation fails.

---

## Acceptance Criteria

### A. Add explicit tool message rejection
```
- [ ] Add guard at start of toGeminiMessages function
- [ ] Check: if (messages.some(m => m.role === "tool"))
- [ ] Throw Error("Tool messages cannot be converted to Gemini format")
```

### B. Test guard blocks tool messages
```
- [ ] Create ChatCompletionRequest with role: "tool" message
- [ ] Call geminiProvider.chat(req, config)
- [ ] Assert throws with message containing "Tool"
```

### C. Verify guard on both chat and chatStream paths
```
- [ ] chatStream() also reaches toGeminiMessages
- [ ] Guard prevents tool messages in both paths
```

### D. Confirm validateGeminiRequest still runs first
```
- [ ] Ensure validateGeminiRequest() is called before toGeminiMessages()
- [ ] Both guards work in tandem (defense-in-depth)
```

---

## Proof Commands

```bash
cd /home/sk/wt-ipi-342-fix/services/cloudflare-worker
npm test -- gemini.test.ts
npm run typecheck
```

---

## Spec Details

**File:** `services/cloudflare-worker/src/providers/gemini.ts`

**Add at line 22, start of `toGeminiMessages` function:**
```ts
function toGeminiMessages(messages: ChatCompletionRequest["messages"]) {
  // Explicit guard: tool messages cannot reach this function
  if (messages.some((m) => m.role === "tool")) {
    throw new Error("Tool messages cannot be converted to Gemini format");
  }
  
  // ... rest of function
}
```

---

## Severity & Blocker

🔴 **CRITICAL** — Defensive layer gap. Must fix before merge.

