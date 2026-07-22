# Audit Corrections: 4R Linear Issues
**Date:** 2026-07-12 · **Verified by:** task-verifier audit probes  
**Action:** Update Linear issue statuses per corrections below

---

## Issue Status Corrections

| Issue | Current | Audit Correction | Priority | Evidence |
|-------|---------|------------------|----------|----------|
| **IPI-525** | Proposed | **In Progress** | — | PR #333 types + tests merged; model registry update pending |
| **IPI-490** | In Progress | **Done (92%)** | — | PR #286 merged; PostgresStore mitigation in place |
| **IPI-454** | In Progress | In Progress | — | 68% done; AI_ROUTING_MODE blocks AC-J completion |
| **IPI-468** | Todo | **Todo (URGENT)** | **1-Urgent** | 🔴 BLOCKER: requireOperator() missing, Worker auth = 0 |
| **IPI-465** | In Progress | **Todo (Design)** | — | No shared registry code; pre-design phase |
| **IPI-508** | In Progress | **Blocked** | — | Blocked on IPI-454 AC-J (AI_ROUTING_MODE) |

---

## Critical Security Finding (IPI-468)

**🔴 Production Blocker — Do NOT deploy to production without fix**

| Finding | Evidence | Impact |
|---------|----------|--------|
| `requireOperator()` function **does not exist** | `grep -r "^export.*requireOperator"` → 0 results | `middleware.ts` references non-existent function; auth appears enabled but isn't |
| Worker has **zero authentication** | No Bearer token check on `handleChat()` | `/v1/chat/completions` is fully public |
| `OPERATOR_AUTH_ENABLED` defaults false | `middleware.ts` checks `!== "true"` | All 26 API routes unprotected |

**Fix:** Add Bearer token auth guard to Worker before production flip.

---

## Model Registry Blocker (IPI-525)

**🟡 Completion Blocker — Model registry missing tool-capable model**

| Registry Tier | Current | Required |
|---------------|---------|----------|
| `default` | `gemini-3.1-flash-lite` (no tool support) | Workers-AI model with function calling |
| `fast` | `gemini-3.1-flash-lite` (no tool support) | Workers-AI model with function calling |
| `embedding` | Workers AI BGE | ✅ Correct |

**Examples (replace one of above):**
- `meta/llama-2-7b-chat-int8`
- `@cf/openai/gpt-oss-120b-1:0`
- `qwen/qwen2-7b-instruct`

---

## Environment Variable Blocker (IPI-454, IPI-508)

**🟡 E2E Test Blocker — Precondition not set anywhere**

| Var | Required For | Current | Needed |
|-----|--------------|---------|--------|
| `AI_ROUTING_MODE` | Browser E2E journey test (IPI-508) | Unset in all envs | `gateway` (local dev) or `direct` (Gemini SDK) |
| `AI_GATEWAY_URL` | Fallback for custom gateway | Unset | `http://localhost:8787` (local) or production URL |

**Blocks:** IPI-508 cannot run browser journey until IPI-454 AC-J sets this.

---

## Linear Update Actions

### 1. IPI-525 (Workers AI Tool Calling)
```
Status: In Progress
Add comment: "Audit 2026-07-12: PR #333 merged (code-only). 
  Remaining: Add Workers-AI-capable model to model-registry.ts (fast/default tier).
  Current registry routes both to Gemini (no tool support)."
```

### 2. IPI-490 (Runtime Compatibility)
```
Status: Done
Add comment: "Audit 2026-07-12: Runtime compat complete (92%). 
  PostgresStore hang mitigated (timeout fallback).
  Creating follow-up task: PostgresStore investigation (not blocking)."
```

### 3. IPI-454 (Gateway Provider Routing)
```
Status: In Progress (no change)
Add comment: "Audit 2026-07-12: AC-J blocked on environment variable.
  AI_ROUTING_MODE not set in any env (app, local, Infisical).
  Cannot test browser E2E path until this is configured."
```

### 4. IPI-468 (Security Architecture) [CRITICAL]
```
Status: Todo
Priority: 1 (Urgent)
Add comment: "🔴 PRODUCTION BLOCKER (verified 2026-07-12):
  1. requireOperator() function DOES NOT EXIST but middleware.ts references it
  2. Worker gateway has ZERO authentication (/v1/chat/completions is public)
  3. OPERATOR_AUTH_ENABLED defaults to false (all API routes unprotected)
  
  Immediate fix: Add Bearer token auth check to Worker handleChat().
  Do not deploy to production without this security layer."
```

### 5. IPI-465 (Shared Tool Registry)
```
Status: Todo
Add comment: "Audit 2026-07-12: Incorrectly marked 'In Progress'.
  No shared registry code exists. Pre-design phase.
  Mastra tools (20) are Mastra-only; no cross-runtime sharing started."
```

### 6. IPI-508 (Journey Test)
```
Status: Blocked (by IPI-454)
Add comment: "Audit 2026-07-12: Blocked on precondition.
  AI_ROUTING_MODE not set → cannot test gateway browser path.
  Awaiting IPI-454 AC-J (environment variable setup)."
```

---

## Follow-up Task: Create IPI-490-FU

**Title:** PostgresStore timeout investigation  
**Scope:** Investigate silent turn drops under Workers preview when PostgresStore hangs  
**Not blocking:** IPI-490 complete (timeout fallback mitigates)  
**Link to:** IPI-490 (done), IPI-472 (remote preview)  

---

## Summary: Production Readiness

| Category | Status | Blocker? |
|----------|--------|----------|
| **Runtime Compat (IPI-490)** | ✅ Done | No |
| **Tool Calling (IPI-525)** | 🟡 Missing model registry entry | Yes |
| **Gateway Routing (IPI-454)** | 🟡 AI_ROUTING_MODE not set | Yes (for E2E) |
| **Security (IPI-468)** | 🔴 No auth + missing function | **YES (critical)** |
| **Shared Registry (IPI-465)** | 🔴 Pre-design | Not yet needed |
| **E2E Journey (IPI-508)** | 🔴 Blocked by IPI-454 | Yes |

**Overall:** ~40% production-ready. Three blockers before production: IPI-468 (security), IPI-525 (model registry), IPI-454 (environment config).
