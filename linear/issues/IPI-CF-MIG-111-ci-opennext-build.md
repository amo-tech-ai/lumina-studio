## CF-MIG-111 · OpenNext CI Build Pipeline

**In plain terms:** Add a CI job that runs OpenNext build on PRs touching `app/` so Worker regressions fail before merge.

**Linear:** _(create — extends IPI-472 scope, do not duplicate epic)_

**Project:** AI Platform — LLM Providers  
**Track:** INFRA · CLOUDFLARE · CI · P0  
**Priority:** Urgent  
**Estimate:** S (1 pt)

**Blocked by:** CF-MIG-110  
**Blocks:** CF-MIG-220 (full smoke needs CI gate)  
**Extends:** [IPI-472](https://linear.app/amo100/issue/IPI-472) · INFRA-001

**Branch:** `ipi/cf-mig-111-ci-opennext`  
**Plan SSOT:** `tasks/cloudflare/migration/plan-migrate.md`

### Scope

- [ ] **B1** `.github/workflows/ci.yml` — job or step: `cd app && npm run cf:build` (or `opennextjs-cloudflare build`)
- [ ] **B2** Trigger only when `app/**` or root wrangler-related paths change
- [ ] **B3** Document Workers Builds preview deploy in IPI-472 description (optional CF token secret)
- [ ] **B4** Keep existing `services/cloudflare-worker` test + dry-run in CI

### Verify

```bash
# Local
cd app && npm run cf:preview
# CI green on PR branch
```

### Acceptance criteria

- [ ] PR touching `app/` runs OpenNext build in CI
- [ ] IPI-472 description updated: Vercel stays prod until CF-MIG-220 passes; includes OpenNext pipeline

### References

- [Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/)
