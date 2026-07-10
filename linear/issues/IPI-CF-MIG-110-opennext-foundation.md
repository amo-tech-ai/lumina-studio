## CF-MIG-110 · OpenNext Foundation — Scaffold & Edge Middleware

**In plain terms:** Add OpenNext + Wrangler to existing `app/` so it can build for Cloudflare Workers — no application logic changes yet.

**Linear:** _(create under epic CF-MIG · Vercel → Cloudflare Workers)_

**Project:** AI Platform — LLM Providers  
**Track:** INFRA · CLOUDFLARE · OPENNEXT · P0  
**Priority:** Urgent  
**Estimate:** S (1 pt)

**Blocked by:** IPI-469 (CF-000 approved)  
**Blocks:** CF-MIG-111, CF-MIG-210  
**Related:** IPI-472 (INFRA-001)

**Branch:** `ipi/cf-mig-110-opennext`  
**Worktree:** `../wt-cf-mig-110-opennext`  
**Plan SSOT:** `tasks/cloudflare/migration/plan-migrate.md`  
**Spec SSOT:** `linear/issues/IPI-CF-MIG-110-opennext-foundation.md`

### Skills

| Skill | Role |
|-------|------|
| `cloudflare` | OpenNext, wrangler, `nodejs_compat` |
| `nextjs-best-practices` | App Router build |
| `pr-workflow` | One-concern PR |
| `worktrees` | Branch setup |
| `task-verifier` | Pre-ship gate |

### Scope

- [x] **A1** Install `@opennextjs/cloudflare` + `wrangler` devDeps in `app/package.json`
- [x] **A2** Add `app/wrangler.jsonc` — `main: .open-next/worker.js`, assets binding, `nodejs_compat`, current `compatibility_date`
- [x] **A3** Add `app/open-next.config.ts` with `defineCloudflareConfig()`
- [x] **A4** Scripts: `preview`, `deploy`, `upload`, `cf-typegen`
- [ ] **A5** Env matrix doc section in plan-migrate §5 (Build / Runtime / Both per var)

**Also shipped (OpenNext hard requirement):** `proxy.ts` → Edge `src/middleware.ts` + test migration

**Out of scope:** Hono adapter, groq FS, OAuth, marketing-chat CopilotKit fixes (→ CF-MIG-210)

### Verify

```bash
cd app && npm run lint && npm run typecheck && npm test
cd app && npm run build
cd app && npm run cf:preview   # after A4
```

### Acceptance criteria

- [x] `opennextjs-cloudflare build` completes
- [x] Edge `middleware.ts` replaces `proxy.ts` (OpenNext hard error otherwise)
- [x] Vercel CI path (`npm run build`) unchanged and green
- [ ] Env matrix doc (A5) — separate docs PR

### References

- [Next.js on Workers (OpenNext)](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/)
- [OpenNext env vars](https://opennext.js.org/cloudflare/howtos/env-vars)
