# IPI-538 · CF-AI-024 — Add Tool Argument Schema Validation
**Status:** Ready for Phase 1  
**Type:** Security Feature (High Priority)  
**Priority:** P1  
**Severity:** High  
**Skills:** `cloudflare-workflow`, `gen-test`  
**Blocked By:** IPI-527

---

## Problem Statement

Tool arguments must be validated against the tool's declared parameter schema before execution. An untrusted model response could include extra fields, wrong types, or missing required fields.

Currently: No schema validation of tool arguments before execution.

**Impact:** P1 security issue. Invalid arguments could crash tools or be exploited.

---

## Acceptance Criteria

### A. Validate arguments against tool schema
```
- [ ] Parse tool.function.parameters (OpenAI JSON schema)
- [ ] For each tool_call, validate arguments JSON against schema
- [ ] Reject with 400 "invalid_tool_arguments" if schema violation
- [ ] Test: valid args pass, extra fields rejected, missing required rejected
```

### B. Type coercion (strict)
```
- [ ] No implicit coercion (string→number, etc.)
- [ ] Enforce exact types from schema
- [ ] Test: "123" as number rejected, 123 as number accepted
```

### C. Enum and constraint validation
```
- [ ] Validate enum values
- [ ] Validate string patterns (if regex present)
- [ ] Validate number ranges (min/max if present)
```

### D. Sanitize arguments in logs
```
- [ ] Never log raw user arguments
- [ ] Log only: tool name, field names, types (not values)
```

---

## Proof Commands

```bash
cd /home/sk/wt-ipi-342-fix/services/cloudflare-worker
npm test -- router.tools.test.ts --grep "argument.*validation"
npm run typecheck
```

---

## Spec Details

**File:** `services/cloudflare-worker/src/tool-validator.ts` (new)

Use JSON Schema validation library (already installed or std).

---

## Severity & Blocker

🔴 **HIGH** — Security gate. Must be in place before production.

