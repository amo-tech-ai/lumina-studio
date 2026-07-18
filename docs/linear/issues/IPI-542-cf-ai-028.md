# IPI-542 · CF-AI-028 — Add Staging Deployment and Rollback Verification
**Status:** Blocked on PR merge  
**Type:** Deployment Verification  
**Priority:** P0  
**Severity:** Critical  
**Skills:** `cloudflare-workflow`, `pr-workflow`  
**Blocked By:** IPI-541

---

## Problem Statement

After live E2E test passes on staging, must verify that rollback (deployment revert) works and that production deployment process is safe.

Currently: No rollback verification.

**Impact:** P0 production blocker. Unable to rollback if production issues arise.

---

## Acceptance Criteria

### A. Deploy to staging
```
- [ ] `npm run deploy:staging` succeeds
- [ ] Verify deployed Worker code matches git HEAD
- [ ] Compare via Cloudflare MCP: workers_get_worker_code
```

### B. Smoke test on staging
```
- [ ] Basic tool-calling request succeeds
- [ ] Streaming request succeeds
- [ ] Error scenarios return correct status codes
```

### C. Rollback to prior version
```
- [ ] Record deployed version hash
- [ ] Trigger rollback via Cloudflare API
- [ ] Verify prior version is now active
- [ ] Smoke test on rolled-back version
```

### D. Production deployment checklist
```
- [ ] All Phase 1 fixes merged
- [ ] All Phase 2 tests passed
- [ ] All Phase 3 security tests passed
- [ ] CI green (typecheck, build, test, lint)
- [ ] No secrets in bundle
- [ ] Bundle size < 1MB
- [ ] Staging smoke test passed
- [ ] Rollback plan documented and tested
```

---

## Proof Commands

```bash
# Deploy staging
cd /home/sk/wt-ipi-342-fix
npm run deploy:staging

# Verify deployment
curl https://staging.ipix-gateway.com/health

# Record version
DEPLOYED_VERSION=$(curl https://staging.ipix-gateway.com/version | jq -r .version)

# Rollback
npm run rollback:staging -- --to-previous

# Verify rollback
curl https://staging.ipix-gateway.com/version
```

---

## Spec Details

**Files:**
- `.github/workflows/deploy-staging.yml` (update) — add pre-deployment checks
- `scripts/rollback.mjs` (new) — rollback script
- `docs/DEPLOYMENT.md` (new) — deployment and rollback runbook

---

## Severity & Blocker

🔴 **CRITICAL** — Must pass before production deployment. No production cutover without verified rollback.

