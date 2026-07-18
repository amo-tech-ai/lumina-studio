# IPI-543 · CF-AI-029 — Add Deprecated Model and Invalid Registry CI Gates
**Status:** Ready for Phase 1  
**Type:** CI/Config Gate  
**Priority:** P1  
**Severity:** High  
**Skills:** `cloudflare-workflow`, `pr-workflow`  
**Blocked By:** IPI-533

---

## Problem Statement

Configuration (MODEL_REGISTRY_OVERRIDE, model names in requests) can become stale or invalid. CI should catch deprecated models and broken registry entries before merge.

Currently: No CI gate for deprecated models or invalid registry.

**Impact:** Configuration errors merged silently; discovered at runtime.

---

## Acceptance Criteria

### A. Maintain deprecation list
```
- [ ] File: services/cloudflare-worker/src/deprecated-models.json
- [ ] Format: { "gemini-2.0-flash": { "deprecated": "2026-06-01", "replacement": "gemini-3.1-flash" } }
- [ ] Update when Cloudflare or Google deprecates models
```

### B. CI check: no deprecated models in registry
```
- [ ] Read DEFAULT_REGISTRY and any MODEL_REGISTRY_OVERRIDE samples
- [ ] Cross-reference against deprecated-models.json
- [ ] Fail CI if any deprecated model found
- [ ] Error message includes: model name, deprecation date, replacement
```

### C. CI check: registry schema validation
```
- [ ] Validate DEFAULT_REGISTRY against Zod schema (IPI-533)
- [ ] Fail CI if schema violation
- [ ] Error message includes: field, expected type, actual value
```

### D. CI check: required tiers present
```
- [ ] Verify "default", "structured", "tool-calling" tiers exist
- [ ] Fail CI if any missing
```

---

## Proof Commands

```bash
cd /home/sk/wt-ipi-342-fix/services/cloudflare-worker
npm run check:registry  # Custom script
npm run check:deprecated-models  # Custom script
npm run typecheck
```

---

## Spec Details

**Files:**
- `services/cloudflare-worker/src/deprecated-models.json` (new)
- `services/cloudflare-worker/scripts/check-registry.mjs` (new)
- `.github/workflows/ci.yml` (update) — add registry checks

---

## Severity & Blocker

🟡 **HIGH** — Configuration safety gate. Recommended before production.

