# July 9 · Cloudflare + Design V2 — Audit Plan Checklist

**Scope:** `/home/sk/ipix/app` + Linear [DESIGN V2 — Operator React Parity](https://linear.app/amo100/project/design-v2-operator-react-parity-e276f28e26a0/issues)  
**SSOT outputs:** [`audit-design.md`](./audit-design.md) · [`audit-jul-9.md`](./audit-jul-9.md) · [`../CLOUDFLARE-EPIC.md`](../CLOUDFLARE-EPIC.md)  
**Skills used:** `cloudflare` · `mastra` · `ipix-supabase` (RLS/data tasks only)

---

## Phase 0 — Preflight

- [x] Pull Linear project + all issues (131 unique)
- [x] Read `wrangler.jsonc`, `open-next.config.ts`, `package.json`, `next.config.ts`
- [x] Scan `.github/workflows/*` for OpenNext gate
- [x] Grep runtime-risk patterns (`fs`, `hono/vercel`, direct provider SDKs)
- [x] Cross-check operator routes vs `SectionPlaceholder`
- [ ] Re-run after **CF-MIG-210** PR #286 merges

---

## Phase 1 — Linear hygiene

- [ ] Tag every active issue: `design-parity` | `platform` | `ai-runtime` | `data-rls` | `defer-post-cutover`
- [ ] Move **18 platform tasks** out of Design V2 (see audit-design §D)
- [ ] Close **3 Duplicate** issues (IPI-393, IPI-394, + confirm IPI-248 vs IPI-404)
- [ ] Downgrade false **Done** if code proof missing (none critical found Jul 9; spot-check ongoing)
- [ ] Link each SCR/DESIGN task → DC handoff file path

---

## Phase 2 — Cloudflare runtime (hosting track)

| Gate | Command / probe | Pass? |
|------|-----------------|-------|
| OpenNext scaffold | `app/wrangler.jsonc` exists | 🟢 |
| OpenNext config | `app/open-next.config.ts` minimal | 🟢 |
| CopilotKit Workers path | no `hono/vercel` on `main` | 🔴 → PR #286 |
| Groq config bundle | no runtime `readFileSync` in `provider.ts` | 🔴 → PR #286 |
| OAuth preview | `TRUSTED_OAUTH_FORWARDED_HOSTS` for Workers preview | 🟡 PR #286 |
| Webpack + Turbopack aliases | `@copilotkit/runtime-internal/*` both bundlers | 🟡 PR #286 |
| CI OpenNext build | `opennextjs-cloudflare build` in CI | 🔴 CF-MIG-111 |
| Preview smoke | scripted `*.workers.dev` E2E | 🔴 CF-MIG-220 |
| DNS cutover | blocked until smoke green | 🔴 policy OK |

---

## Phase 3 — AI / Mastra (parallel track)

| Gate | Probe | Pass? |
|------|-------|-------|
| Gateway wiring | `AI_GATEWAY_URL` in app `resolveModel()` | 🔴 IPI-454 AC-F |
| Unified registry | `app/src/lib/ai/model-registry.ts` on `main` | 🔴 IPI-457 |
| Direct Gemini in agents | all via gateway post-cutover | 🔴 IPI-485 |
| Workers AI default | eval suite sign-off | 🔴 IPI-462 |
| Mastra PostgresStore | `DATABASE_URL` from Wrangler secret | 🟡 works on Vercel |

---

## Phase 4 — Design V2 per-task gate (before ⭐ Production Verified)

Every Design V2 PR that touches operator shell or AI routes:

```bash
cd app && npm run lint && npm run typecheck && npm test && CI=true npm run build
# After CF-MIG-111:
CI=true npx opennextjs-cloudflare build
# After CF-MIG-220:
npm run preview   # smoke /app, /login, /api/copilotkit, target screen
```

**Rules:**

- One concern per PR (no UI + Queues + DO + Mastra cutover)
- No task marked Done without file path proof on `main`
- Design parity may ship on **Vercel** before CF cutover; **CF production** requires Phase 2 green

---

## Phase 5 — Missing tasks to create

- [ ] **CF-MIG-111 · OpenNext CI Build Pipeline** (if not in Linear under IPI-487)
- [ ] **CF-MIG-220 · Preview Smoke Testing & Validation**
- [ ] **DV2-CF-GUARD · Node API grep CI guard** (`node:fs` in non-test runtime graph)
- [ ] **DV2-CF-ENV · Wrangler secrets / `.dev.vars` matrix** (fold IPI-472)
- [ ] **OPS-002 · DNS rollback drill** (fold CF-MIG-810)
- [ ] **IPI-258 · DESIGN-080 · Playwright DC verification** (Design V2 QA, not CF blocker)

---

## Phase 6 — Sign-off criteria

**Design V2 project clean:** platform tasks moved; duplicates closed; every Backlog SCR maps to DC file + app route.

**Cloudflare production ready:** CF-MIG-210 merged → CF-MIG-111 → CF-MIG-220 green → IPI-454/457/485 wired → IPI-462 eval → then CF-MIG-810 only.

**Do not DNS cutover** until CF-MIG-220 passes twice consecutively (see CLOUDFLARE-EPIC §13).

---

## Official doc refs (verified)

| Topic | URL |
|-------|-----|
| Next.js on Workers | https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/ |
| OpenNext Cloudflare | https://opennext.js.org/cloudflare |
| OpenNext env vars | https://opennext.js.org/cloudflare/howtos/env-vars |
| Workers runtime compat | https://developers.cloudflare.com/workers/runtime-apis/nodejs/ |
| AI Gateway REST | https://developers.cloudflare.com/ai-gateway/usage/chat-completion/ |
| Durable Objects WebSockets | https://developers.cloudflare.com/durable-objects/best-practices/websockets/ |
| Cloudflare Queues | https://developers.cloudflare.com/queues/ |
| Mastra on Cloudflare | https://mastra.ai/guides/deployment/cloudflare |
| CopilotKit + Mastra | https://docs.copilotkit.ai/mastra |
