# IPI-537 · CF-AI-023 — Add Tool Authorization and Allowlist Enforcement
**Status:** Ready for Phase 1  
**Type:** Security Feature (High Priority)  
**Priority:** P1  
**Severity:** High  
**Skills:** `cloudflare-workflow`, `gen-test`  
**Blocked By:** IPI-527

---

## Problem Statement

Not every tool should be available to every user or tenant. Tools must be authorized per user/tenant before execution.

Currently: No authorization gate on tool execution.

**Impact:** P1 security issue. Unauthorized users could invoke privileged tools.

---

## Acceptance Criteria

### A. Define tool allowlist per tenant
```
- [ ] Environment variable: TOOL_ALLOWLIST_JSON
- [ ] Format: { "tenant-id": ["tool-name", ...], "default": [...] }
- [ ] Load at startup, validate JSON schema
```

### B. Validate tool authorization before execution
```
- [ ] Extract tenant from request context
- [ ] Check tool name against allowlist
- [ ] Reject with 403 "unauthorized_tool" if not in list
- [ ] Test: allowed tools pass, forbidden rejected
```

### C. Audit log all tool invocations
```
- [ ] Log: tenant, user, tool name, arguments (sanitized), result (sanitized)
- [ ] Include: timestamp, request_id, outcome (success/denied)
```

### D. Default-deny, explicit-allow
```
- [ ] If tenant not in allowlist, deny all tools
- [ ] If tool not in tenant list, deny
- [ ] Never implicit grant
```

---

## Proof Commands

```bash
cd /home/sk/wt-ipi-342-fix/services/cloudflare-worker
npm test -- router.tools.test.ts --grep "authorization"
npm run typecheck
```

---

## Spec Details

**Files:**
- `services/cloudflare-worker/src/router.ts` — add authorization check
- `services/cloudflare-worker/src/tool-allowlist.ts` (new) — load and validate allowlist

---

## Severity & Blocker

🔴 **HIGH** — Security gate. Must be in place before production.

