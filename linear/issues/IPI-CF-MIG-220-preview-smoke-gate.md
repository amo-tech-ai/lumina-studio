## CF-MIG-220 · Preview Smoke Testing & Validation

**In plain terms:** Prove the full operator app on `*.workers.dev` before any DNS cutover — one checklist, not separate Mastra/CopilotKit/Cloudinary tickets.

**Project:** AI Platform — LLM Providers  
**Track:** INFRA · CLOUDFLARE · QA · P0  
**Priority:** Urgent  
**Estimate:** M (2 pt)

**Blocked by:** CF-MIG-210, CF-MIG-111  
**Blocks:** CF-MIG-810  
**Related:** IPI-468 (secrets audit — parallel)

**Branch:** n/a (validation + evidence doc)  
**Plan SSOT:** `tasks/cloudflare/migration/plan-migrate.md`

### Smoke checklist (preview URL)

- [ ] **D1** `/login` + Supabase OAuth callback
- [ ] **D2** `/app` operator shell (auth gate via `src/proxy.ts`)
- [ ] **D3** CopilotKit — default agent, **3 consecutive SSE turns** without Error 1102
- [ ] **D4** Mastra workflow — brand-intelligence or shoot-wizard suspend/resume
- [ ] **D5** Cloudinary webhook — `next/after()` DNA trigger fires
- [ ] **D6** Marketing chat (`/api/marketing-chat` or public route)
- [ ] **D7** Spot-check API routes: `/api/brands`, `/api/bookings`

### Verify

```bash
cd app && npm run cf:preview
# Manual + optional Playwright smoke
```

### Deliverable

Evidence doc: `docs/ecommerce/evidence/YYYY-MM-DD/cf-mig-220-preview-smoke.md` (or `tasks/cloudflare/migration/evidence/`)

### Acceptance criteria

- [ ] All D1–D7 checked on latest preview deploy
- [ ] Vercel remains production — no DNS change in this issue
- [ ] Failures block CF-MIG-810 explicitly

### References

- [Workers platform limits](https://developers.cloudflare.com/workers/platform/limits/)
