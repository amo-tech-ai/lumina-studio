<<<<<<< HEAD
# IPI-533 · CF-AI-019 — Add Registry Schema Validation with Zod

**Status:** Ready for Phase 1  
**Type:** Feature (Production Hardening)  
**Priority:** P1  
**Severity:** High  
**Skills:** `cloudflare-workflow`, `pr-workflow`  
**Blocked By:** None (independent)

---

## Problem Statement

`buildEffectiveRegistry()` only checks for `tiers` object existence. Invalid override entries (negative pricing, unknown provider, missing model) are accepted. No runtime validation of entry properties.

**Impact:** Configuration errors not caught; invalid models accepted.

---

## Acceptance Criteria

### A. Define Zod schema for ModelEntry

```text
- [ ] Create modelEntrySchema with Zod
- [ ] Validate provider enum: ["workers-ai", "gemini", "bedrock", "nvidia"]
- [ ] Validate model: non-empty string
- [ ] Validate capabilities: array of known capabilities
- [ ] Validate contextWindow: positive integer
- [ ] Validate costPer1kIn, costPer1kOut: non-negative finite numbers
```

### B. Add tool-tier capability check

```text
- [ ] If tier === "tool-calling", require "function-calling" capability
- [ ] Throw RegistryConfigurationError if missing
```

### C. Integrate validation into buildEffectiveRegistry

```text
- [ ] For each override tier, run schema validation
- [ ] On validation error, log error and return DEFAULT_REGISTRY
- [ ] Include error details in log (but not secrets)
```

### D. Test schema validation

```text
- [ ] Valid override passes
- [ ] Invalid provider rejected
- [ ] Negative pricing rejected
- [ ] Missing model ID rejected
- [ ] tool-calling without function-calling rejected
```

### E. Document configuration policy

```text
- [ ] Add comment explaining validation rules
- [ ] List rejected patterns
```

---

## Proof Commands

```bash
cd /home/sk/wt-ipi-342-fix/services/cloudflare-worker
npm test -- registry.test.ts
npm run typecheck
```

---

## Spec Details

**File:** `services/cloudflare-worker/src/model-registry.ts`

**Add at top:**

```ts
import { z } from "zod";

const modelEntrySchema = z.object({
  provider: z.enum(["workers-ai", "gemini", "bedrock", "nvidia"]),
  model: z.string().min(1),
  capabilities: z.array(z.enum([...])),
  contextWindow: z.number().int().positive(),
  costPer1kIn: z.number().finite().nonnegative(),
  costPer1kOut: z.number().finite().nonnegative(),
});
```

**Update buildEffectiveRegistry to validate each tier.**

---

## Severity & Blocker

🟡 **HIGH** — Not a merge blocker but critical for configuration safety. Recommend pre-production.
=======
# IPI-533 · CF-AI-019 — Reject bad AI model registry overrides before they go live

**Role:** iPix engineer. One concern per PR. Research before custom code.

**Plain English:** Invalid Cloudflare AI Gateway model overrides (bad provider, negative price, tool tier without function-calling) fail validation instead of poisoning the live registry.

| Field | Value |
|-------|--------|
| **MVP stage** | Core (AI gateway reliability) |
| **Parallel** | OK with unrelated app UI; avoid parallel edits to `model-registry.ts` |
| **Blocked by** | — |
| **Unblocks** | Safer gateway config changes · fewer “mystery model” outages |
| **Track** | Platform · AI |
| **Skills** | `ipix-task-lifecycle` · `cloudflare-workflow` · `pr-workflow` · `worktrees` |
| **Agents / hooks / commands** | `/task` · Cloudflare MCP docs · worker tests |
| **Stack** | `services/cloudflare-worker` · schema validation (Zod or worker-local validator) · Vitest |

**Quality scores (1–5):** P4 · C2 · R3 · UV3 · LV4  
**Linear:** https://linear.app/amo100/issue/IPI-533

---

## 1. Purpose

Validate `buildEffectiveRegistry()` overrides with schema validation (Zod or worker-local validator) so bad config falls back safely.

## 2. Real-world iPix example

- **Persona:** Engineer configuring gateway  
- **Surface:** AI Gateway worker model registry (affects marketing/agent routing)  
- **Today:** Only checks `tiers` object exists  
- **After:** Invalid entries rejected; default registry used; error logged without secrets  

## 3. User journey impact

| Before | During | After |
|--------|--------|-------|
| Bad override may break routing | Deploy/config change | Invalid config refused; traffic stays on defaults |

## 4. Business value

Prevents gateway misconfig from looking like a product outage during brand/agent AI calls.

## 5. Quality checks

- [x] Required for reliable AI path  
- [x] Not duplicate of embed validation tasks  
- [x] Reuse Zod if present; else minimal worker-local validator  
- [x] Parallel OK outside registry file  

**Verdict:** Ship — small worker hardening.

---

## 6. Research checklist

- [ ] Read `services/cloudflare-worker/src/model-registry.ts` + tests  
- [ ] Cloudflare AI Gateway / Workers AI model docs  
- [ ] Existing Zod usage in worker package  
- [ ] GitHub examples of registry validation  
- [ ] Prefer schema + tests over new service  

## 7. Platform-first plan

| Step | Choice |
|------|--------|
| Dashboard | Optional: document override shape in CF notes |
| CLI | `vitest` in worker package |
| Existing | `DEFAULT_REGISTRY`, `buildEffectiveRegistry` |
| Custom | Schema validation + tests |

**Do NOT:** Change routing policy beyond validation · mix OpenNext cutover  
**Out of scope:** New providers · UI for registry editing  

---

## 8. Multi-step implementation prompt

```xml
<role>Implement IPI-533 · CF-AI-019 in cloudflare-worker only. One concern.</role>
<task>
1. Research current registry + validation approach (Zod if already in worker deps).
2. Add schema; validate overrides; fallback to DEFAULT_REGISTRY on error.
3. tool-calling requires function-calling capability.
4. Tests for valid/invalid cases; run worker vitest.
</task>
```

### Completion steps (A→E)

#### A. Research / setup
- [ ] **A1** Confirm deps + entry shape — proof: notes in PR  

#### B. Core
- [ ] **B1** `modelEntrySchema` + integrate in `buildEffectiveRegistry` — proof: code  
- [ ] **B2** tool-calling capability guard — proof: test  

#### C. Edges
- [ ] **C1** Log validation error without secrets — proof: test spy  

#### D. Tests
- [ ] **D1** Worker vitest cases (valid, bad provider, negative price, missing model, tool-calling) — proof: N passed  

#### E. Real-world + ship
- [ ] **E1** Local worker test / miniflare — proof: green  
- [ ] **E2** No browser required (infra) — proof: N/A noted  
- [ ] **E3** PR evidence · CI `cloudflare-worker-tests` — proof: PR #  

---

## 9. Acceptance criteria

- **A:** Valid override accepted  
- **B:** Invalid provider / negative price / missing model rejected → default registry  
- **C:** tool-calling without function-calling rejected  
- **E:** Unrelated embed/routing tests still pass  

## 10. Tests & real-world validation

Worker unit tests primary (`services/cloudflare-worker` vitest). No browser required for infra-only change.

## 11. Risks & rollback

| Risk | Failure | Rollback |
|------|---------|----------|
| Over-strict schema blocks legit overrides | Deploy blocked on valid config | Start with known providers enum from code; revert PR |
| Validation too loose | Bad override reaches prod | Tighten schema in follow-up PR |

## 12. PR evidence required

- [ ] One concern: worker validation only  
- [ ] Title: `IPI-533 · CF-AI-019 — …`  
- [ ] Proof: worker vitest + CI `cloudflare-worker-tests` green  
- [ ] Residual risks named  
>>>>>>> origin/main
