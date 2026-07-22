# Sentry Thread #1 Resolution — Test Environment Configuration (PR #339)

**Status:** 🟡 **Documented, awaiting fix**

---

## Current State: Auth is DISABLED in Test Environment

### Local Development (`.dev.vars`)
```
AI_GATEWAY_ALLOW_UNAUTHENTICATED=true
```

**Impact:** Bearer token authentication is **bypassed** for local testing.

**File:** `services/cloudflare-worker/.dev.vars` (line 1)

### CI Testing (`.github/workflows/ci.yml`)
**Current:** Cloudflare-worker tests are **NOT run in CI**.

**Issue:** The CI workflow has no step that runs `services/cloudflare-worker` tests. The `app-build` job only runs app tests (`cd app && npm run test`).

---

## Problem

1. **Local:** Tests run with auth **disabled** (not testing the actual auth gate)
2. **CI:** Tests don't run at all
3. **Result:** Bearer token verification is untested in both environments

Sentry thread #1 correctly flags this: "Test environment may lack explicit authentication configuration."

---

## Recommended Fix (for separate PR after #339)

Add CI step to run cloudflare-worker tests **with explicit BEARER_TOKEN injected**:

### Option A: Add to `.github/workflows/ci.yml`

```yaml
  cloudflare-worker-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "22"
          cache: npm
          cache-dependency-path: services/cloudflare-worker/package-lock.json
      
      - name: Install dependencies
        working-directory: services/cloudflare-worker
        run: npm ci
      
      - name: Run bearer token tests (auth enabled)
        working-directory: services/cloudflare-worker
        env:
          AI_GATEWAY_AUTH_TOKEN: "test-token-ci-${{ github.run_id }}"
        run: npm test
```

### Option B: Update `.dev.vars` for CI

Create conditional config that:
- Disables auth locally (dev mode)
- But CI can override via env vars

---

## For PR #339 Right Now

**Reply to Sentry thread #1:**

```
Documented: Bearer token verification tests run with auth DISABLED locally 
via AI_GATEWAY_ALLOW_UNAUTHENTICATED=true (.dev.vars, line 1).

CI does not currently run cloudflare-worker tests. This is a separate gap 
to address in a follow-up PR.

For now: The router.ts fix (thread #2) is testable locally by removing 
the dev-mode bypass and setting AI_GATEWAY_AUTH_TOKEN explicitly:

  AI_GATEWAY_AUTH_TOKEN=secret-token-123 npm test

Regression test for whitespace handling has been added and passes.

Next: Add CI job to run cloudflare-worker tests with explicit BEARER_TOKEN 
injected. (Separate PR after #339 ships.)
```

---

## Summary

| Item | Status |
|------|--------|
| **Local test env config** | ✅ Documented (auth disabled via `.dev.vars`) |
| **Bearer token in CI** | 🟡 Not configured; tests not run in CI |
| **Whitespace fix** | ✅ Fixed + tested (thread #2) |
| **Can ship PR #339 now?** | 🟡 Yes, with caveat that CI gap is known |
| **Recommended follow-up** | Add CI job for cloudflare-worker tests (separate PR) |

**Blocker status:** Thread #1 is now documented and explainable. PR #339 can merge with this understanding, and CI testing can be added in a follow-up task (IPI-567 · Phase 4 P1 improvements).
