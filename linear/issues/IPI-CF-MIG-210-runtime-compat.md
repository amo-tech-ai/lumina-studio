## CF-MIG-210 · Runtime Compatibility — Hono, OAuth & Groq Bundle

**In plain terms:** Fix the three Vercel-specific blockers so CopilotKit and Mastra boot on Cloudflare Workers preview.

**Project:** AI Platform — LLM Providers  
**Track:** INFRA · CLOUDFLARE · COPILOTKIT · P0  
**Priority:** Urgent  
**Estimate:** M (2 pt)

**Blocked by:** CF-MIG-110  
**Blocks:** CF-MIG-220  
**Related:** IPI-125 (OAuth prod URLs), IPI-428 (Done — build-time groq path)

**Branch:** `ipi/cf-mig-210-runtime-compat`  
**Plan SSOT:** `tasks/cloudflare/migration/plan-migrate.md`

### Skills

| Skill | Role |
|-------|------|
| `cloudflare` | Workers runtime, bundle limits |
| `copilotkit` | CopilotKit route |
| `nextjs-supabase-auth` | OAuth callback |

### Scope

- [ ] **C1** Replace `hono/vercel` → `hono/cloudflare-workers` in `app/src/app/api/copilotkit/[[...slug]]/route.ts`
- [ ] **C2** Remove runtime `readFileSync` for `config/groq-models.json` — static import or build-time embed
- [ ] **C3** Auth callback: trust `*.workers.dev` + production domain (`auth/callback/route.ts`)
- [ ] **C4** Record Worker bundle size after build; note vs platform limits
- [ ] **C5** Update vitest mocks for Hono adapter

### Verify

```bash
cd app && npm run lint && npm test
cd app && npm run cf:preview
# Hit /api/copilotkit on preview — no 500 on boot
```

### Acceptance criteria

- [ ] No `hono/vercel` import in app
- [ ] No runtime FS read of groq config on Worker path
- [ ] OAuth round-trip works on `*.workers.dev` preview

### References

- [Mastra on Cloudflare](https://mastra.ai/guides/deployment/cloudflare)
