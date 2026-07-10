## CF-MIG-810 · Production DNS Cutover & Rollback

**In plain terms:** Move production traffic to Cloudflare Workers only after CF-MIG-220 is green; document rollback before flipping DNS.

**Project:** AI Platform — LLM Providers  
**Track:** INFRA · CLOUDFLARE · OPS · P0  
**Priority:** High  
**Estimate:** M (2 pt)

**Blocked by:** CF-MIG-220  
**Related:** IPI-125 (Supabase OAuth prod URLs)

**Branch:** docs + ops (DNS is dashboard)  
**Plan SSOT:** `tasks/cloudflare/migration/plan-migrate.md`

### Scope

- [ ] **E1** Write `tasks/cloudflare/migration/rollback-runbook.md` — DNS revert, OAuth URLs, secrets, 48h criteria
- [ ] **E2** Custom domain on Workers ([routing docs](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/))
- [ ] **E3** Update Supabase Auth redirect URLs for production domain
- [ ] **E4** Monitor 48h — error rates, CopilotKit, webhooks
- [ ] **E5** Decommission Vercel project after stable window

### Acceptance criteria

- [ ] CF-MIG-220 evidence linked in issue
- [ ] Rollback runbook reviewed before DNS flip
- [ ] 48h monitoring complete before E5

### Out of scope

- AI Gateway wiring (IPI-454/461 — P1 parallel)
- Brand-intelligence edge migration (IPI-455)
