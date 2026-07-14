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
