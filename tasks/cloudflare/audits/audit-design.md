# Design V2 × Cloudflare Workers — Forensic Audit

**Date:** 2026-07-09  
**Project:** [DESIGN V2 — Operator React Parity](https://linear.app/amo100/project/design-v2-operator-react-parity-e276f28e26a0/issues)  
**App:** `/home/sk/ipix/app`  
**Hosting target:** Cloudflare Workers via OpenNext ([CF Next.js guide](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/))

---

## A. Executive verdict

| Metric | Score | Dot |
|--------|------:|:---:|
| **Design V2 Linear accuracy** | **68%** | 🟡 |
| **Design vs platform separation** | **72%** | 🟡 |
| **Code parity vs Done claims** | **78%** | 🟡 |
| **Cloudflare migration readiness** | **58%** | 🟡 |
| **Production ready (CF Workers)** | **No** | 🔴 |
| **Design V2 will succeed (UI on Vercel)** | **Yes** | 🟢 |
| **Design V2 will succeed (UI on CF without fixes)** | **No** | 🔴 |

**Bottom line:** Design V2 is real progress (43 Done / 131 issues) but the Linear project is **polluted with 18 platform/backend/Cloudflare tasks**. Pure React parity work can continue on Vercel today. **Do not treat Design V2 as Cloudflare-ready or production-ready on Workers** until **CF-MIG-210** (PR #286) merges and **CF-MIG-220** smoke passes.

### Top 5 blockers (Cloudflare)

1. 🔴 **`hono/vercel`** in `app/src/app/api/copilotkit/[[...slug]]/route.ts` on `main` — operator CopilotKit breaks on Workers (fix in [PR #286](https://github.com/amo-tech-ai/lumina-studio/pull/286))
2. 🔴 **Runtime `readFileSync(groq-models.json)`** in `app/src/lib/ai/provider.ts` — Workers FS read fails (fix in PR #286)
3. 🔴 **No OpenNext CI gate** — `.github/workflows/ci.yml` has no `opennextjs-cloudflare build` (**CF-MIG-111**)
4. 🔴 **No Workers preview smoke** — `/api/copilotkit`, OAuth on `*.workers.dev` unproven (**CF-MIG-220**)
5. 🔴 **AI Gateway not wired** — `resolveModel()` → direct Gemini/Groq; no `AI_GATEWAY_URL` (**IPI-454 · CF-AI-001** AC-F)

---

## B. Repo probes (`main`, Jul 9)

| Probe | Result | CF impact |
|-------|--------|-----------|
| `app/wrangler.jsonc` | 🟢 present, `nodejs_compat`, ASSETS, IMAGES | Foundation OK |
| `app/open-next.config.ts` | 🟢 minimal; R2 cache commented | Perf later |
| `npm run preview` / `deploy` scripts | 🟢 in `package.json` | Manual only |
| CI OpenNext | 🔴 absent | No merge gate |
| `middleware.ts` | 🟢 Edge-safe (Supabase cookie refresh) | OK per CF-MIG-110 |
| CopilotKit route | 🔴 `hono/vercel` + `@copilotkit/runtime/v2` barrel | Blocks operator AI |
| `runtime-v2-fetch.ts` + turbopack aliases | 🟡 on `main` (partial); webpack alias in PR #286 only | Build path risk |
| Groq SSOT | 🔴 runtime FS read in `provider.ts` | Worker boot risk |
| OAuth callback | 🔴 `.vercel.app` only on `main` | Preview login fails |
| Mastra agents | 🟡 direct `resolveModel()` → Gemini/Groq SDK | Gateway bypass |
| `DATABASE_URL` / PostgresStore | 🟡 works if secret set | Hyperdrive optional |
| Design placeholders | 🔴 `/app/assets`, `/app/campaigns` = `SectionPlaceholder` | UI gap, not CF |

---

## C. Task table — active & high-signal issues

**Legend:** 🟢 keep · 🟡 change/split · ⚪ move/defer · 🔴 close/block  
**Before cutover:** can UI land on Vercel? · CF prod requires Phase 2 gates

### C1. True design parity — keep in Design V2

| Dot | ID | Full task name | Linear | Correct | CF risk | Correction | Before CF cutover? |
|:---:|:---:|----------------|:------:|:-------:|:-------:|------------|:------------------:|
| 🟢 | **IPI-304** | **DESIGN-081 · De-fork ApprovalCard** | Backlog | Backlog | Low | 4 forks still exist (`approval-card.tsx`, `BudgetApprovalCard`, etc.) — consolidate first | ✅ UI only |
| 🟡 | **IPI-404** | **SCR-08 · Assets library (read-only masonry)** | Backlog | Backlog | Low | `/app/assets` still placeholder; dupes **IPI-248** — pick one ID | ✅ read-only Cloudinary/Supabase |
| 🟡 | **IPI-248** | **DESIGN-057 · Asset Library — React Parity** | Backlog | **Duplicate → close** | Low | Same scope as IPI-404; merge into IPI-404 | — |
| 🟡 | **IPI-405** | **SCR-09 · Talent matching workspace** | Backlog | In Progress | Low | Partial: `matching/page.tsx` + `TalentTab` exist; finish DC parity + token cleanup | ✅ |
| 🟡 | **IPI-407** | **SCR-15 · Notification Center inbox** | Backlog | Backlog | Low | MVP polling; **no** Realtime/Queues in same PR | ✅ |
| 🟡 | **IPI-409** | **SCR-20 · Talent Profile** | Backlog | Backlog | Low | Blocked by SCR-09 + Profile360 (**IPI-392** partial) | ✅ after deps |
| 🟡 | **IPI-249** | **DESIGN-058 · Campaign Management workspace** | Backlog | Backlog | Low | `/app/campaigns` = placeholder | ✅ UI only |
| 🟡 | **IPI-285** | **Intelligence Panel — AI Suggestion Rail** | Backlog | **Split** | Med | UI rail = Design V2; API/Mastra = **IPI-454/485** | 🟡 UI yes; AI route needs CF-MIG-210 |
| 🟡 | **IPI-396** | **SCR-31 · CRM Deal Detail — React Parity** | In Progress | In Progress | Low | Continue; RSC + Supabase only | ✅ |
| 🟢 | **IPI-253** | **DESIGN-A11Y · Accessibility Gate ≥85** | Backlog | Backlog | Low | No `@axe-core` in `package.json` yet — infra first | ✅ |
| 🟢 | **IPI-258** | **DESIGN-080 · Playwright DC verification** | Backlog | Backlog | Low | QA gate for Design V2, not CF migration | ✅ |
| 🟡 | **IPI-415–425** | **MOB-* mobile shell tasks** | Backlog | Backlog | Low | Valid Design V2; test CopilotKit sheet on narrow viewports post CF-MIG-210 | ✅ UI; 🟡 AI sidebar |

### C2. Agent “DESIGN-* wiring” — not pure design (split or move)

| Dot | ID | Full task name | Linear | Correct | CF risk | Correction |
|:---:|:---:|----------------|:------:|:-------:|:-------:|------------|
| ⚪ | **IPI-259** | **DESIGN-075 · Production Planner Agent — Route Wiring** | Backlog | **Move → Mastra** | **High** | Touches `route-agent-map`, `/api/copilotkit`, Mastra registry |
| ⚪ | **IPI-261** | **DESIGN-077 · Creative Director — Asset Intelligence Wiring** | Backlog | **Move → Mastra** | **High** | Agent + tools, not DC screen |
| ⚪ | **IPI-262** | **DESIGN-078 · Visual Identity — Channel Preview Wiring** | Backlog | **Move → Mastra** | **High** | Same |
| ⚪ | **IPI-263** | **DESIGN-079 · Social Discovery — Creator Matching Wiring** | Backlog | **Move → Mastra** | **High** | Same |
| 🟡 | **IPI-256** | **DESIGN-073 · Error & Recovery UX — AI Failures** | Backlog | Backlog (UI) | Med | UI-only in Design V2; error copy must not assume Vercel-only stack traces |

### C3. Platform / backend — move out of Design V2

| Dot | ID | Full task name | Linear | Correct | CF risk | Move to |
|:---:|:---:|----------------|:------:|:-------:|:-------:|---------|
| ⚪ | **IPI-480** | **Real-time sync — Supabase + Durable Objects** | Backlog | Defer | Med | **IPI-487 · CLOUDFLARE-EPIC** |
| ⚪ | **IPI-481** | **Notification rules + Queue fan-out** | Backlog | Defer | Med | **IPI-487** ([Queues](https://developers.cloudflare.com/queues/)) |
| ⚪ | **IPI-482** | **Mastra planner AI tools + CopilotKit HITL** | Backlog | Defer | **High** | **IPI-486 · MASTRA-EPIC** — blocked CF-MIG-210 + IPI-454 |
| ⚪ | **IPI-483** | **Workflow engine v2 — dependencies & approvals** | Backlog | Defer | Low | Planner epic (**IPI-484**) |
| ⚪ | **IPI-477** | **Shoot production timeline template** | Backlog | Defer | Low | Planner / Supabase |
| ⚪ | **IPI-478** | **Hybrid timeline / kanban / calendar UI shell** | Backlog | Backlog later | Low | Planner epic after schema |
| ⚪ | **IPI-479** | **Role-based views + assignments** | Backlog | Defer | Low | Supabase RLS / planner |
| 🔴 | **IPI-400** | **BE-ST1 · Storage buckets** | Backlog | Defer/close | Med | Cloudinary is media SSOT; no Supabase bucket unless upload staging spec |
| ⚪ | **IPI-401** | **BE-RT1 · Realtime notifications + bookings** | Backlog | Defer | Med | Supabase realtime — not Design V2 |
| ⚪ | **IPI-398** | **BE-ACT1 · Org activity log RPC** | Backlog | Defer | Low | Backend |
| ⚪ | **IPI-399** | **BE-D2 · Analytics views + RPCs** | Backlog | Defer | Low | Backend |
| ⚪ | **IPI-402** | **BE-B4 · set_availability batch RPC** | Backlog | Defer | Low | Backend |
| ⚪ | **IPI-476** | **Planner schema & reusable engine core** | In Progress | In Progress | Low | **IPI-484** epic — not Design V2 |
| ⚪ | **IPI-488** | **BE-SD1b · Booking QA seed + E2E** | In Progress | In Progress | Low | QA/infra — not design parity |
| 🟡 | **IPI-453** | **FIX · Production Error Boundaries** | In Review | In Progress | Low | Valid for operator; keep but label `platform` not DESIGNV2 |

### C4. Done — spot-check vs `main` (forensic)

| Dot | ID | Claim | Code proof on `main` | Verdict |
|:---:|:---:|-------|------------------------|---------|
| 🟢 | **IPI-272** | Brand List parity | `app/.../brand/page.tsx` + workspace components | ✅ Done valid |
| 🟢 | **IPI-271** | Brand Detail parity | `app/.../brand/[id]/page.tsx` | ✅ |
| 🟢 | **IPI-372** | Shoots List parity | `app/.../shoots/page.tsx` | ✅ |
| 🟢 | **IPI-371** | Shoot Detail tabs | `app/.../shoots/[shootId]/page.tsx` | ✅ |
| 🟢 | **IPI-389–395** | CRM lists/pipeline | `app/.../crm/*` routes | ✅ |
| 🟢 | **IPI-410–411** | Booking wizard/detail | routes exist + tests | ✅ |
| 🟢 | **IPI-306** | Intelligence Panel parity | `intelligence-panel/*` | ✅ |
| 🟡 | **IPI-405** | (Backlog but partial code) | Matching shell live, not full SCR-09 | Linear status OK |
| 🔴 | **IPI-404/248** | Assets | Still `SectionPlaceholder` | Backlog correct |

---

## D. Stale / close list

| Dot | Action | Items |
|:---:|:------:|-------|
| 🔴 | **Close duplicate** | **IPI-248** (fold into **IPI-404**), **IPI-393**, **IPI-394** |
| 🔴 | **Defer/close** | **IPI-400** unless explicit upload-staging spec |
| 🟢 | **Keep canceled** | MOBILE-002–005, WEB-014/015, old shoot-detail edit epics (27 canceled — correct) |
| 🟡 | **Linear Done audit** | Re-verify any Done >30d without linked PR on `main` (sample above passes) |

---

## E. Move-to-other-epic list

| Target epic | Tasks |
|-------------|-------|
| **IPI-487 · CLOUDFLARE-EPIC** | IPI-480, IPI-481 |
| **IPI-486 · MASTRA-EPIC** | IPI-482, IPI-259, IPI-261, IPI-262, IPI-263 |
| **IPI-484 · Production Planner** | IPI-476, IPI-477, IPI-478, IPI-479, IPI-483 |
| **Supabase / ipix-supabase** | IPI-398, IPI-399, IPI-401, IPI-402, IPI-276, IPI-277 |
| **Cloudinary** | IPI-400 (if revived) |

---

## F. Missing tasks (Cloudflare + Design V2 hygiene)

| Dot | Proposed task | Why |
|:---:|:-------------|-----|
| 🔴 | **CF-MIG-111 · OpenNext CI Build Pipeline** | Official Workers Builds need reproducible OpenNext artifact ([CF Next.js](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/)) |
| 🔴 | **CF-MIG-220 · Preview Smoke Testing** | Gate before DNS |
| 🔴 | **DV2-CF-GUARD · Node API grep CI guard** | Fail PR if `node:fs` in runtime import graph (exclude `*.test.*`) |
| 🟡 | **DV2-CF-ENV · Wrangler secrets matrix** | Build-time vs runtime vars ([OpenNext env](https://opennext.js.org/cloudflare/howtos/env-vars)) |
| 🟡 | **Bundle size budget check** | Worker size limits |
| 🟡 | **SSE smoke: `/api/copilotkit`** | CopilotKit + Mastra streaming on Workers |
| 🟡 | **OPS-002 · DNS rollback drill** | Part of CF-MIG-810 |
| 🟢 | **DV2-CF-AUDIT · Design V2 Linear cleanup** | Execute §D/E of this audit |

---

## G. Exact file changes needed in `/home/sk/ipix/app`

| Priority | File | Change |
|:--------:|------|--------|
| 🔴 | `src/app/api/copilotkit/[[...slug]]/route.ts` | Replace `hono/vercel` → `createCopilotRuntimeHandler` via `runtime-v2-fetch.ts` (PR #286) |
| 🔴 | `src/lib/ai/provider.ts` | Bundle `groq-models.ssot.json`; remove runtime FS (PR #286) |
| 🔴 | `next.config.ts` | Webpack + Turbopack aliases for `@copilotkit/runtime-internal/*` (PR #286) |
| 🔴 | `src/app/auth/callback/route.ts` | `TRUSTED_OAUTH_FORWARDED_HOSTS` allowlist (PR #286) |
| 🔴 | `.github/workflows/ci.yml` | Add `opennextjs-cloudflare build` job |
| 🟡 | `open-next.config.ts` | Enable R2 incremental cache when ISR needed ([OpenNext caching](https://opennext.js.org/cloudflare/caching)) |
| 🟡 | `src/lib/ai/provider.ts` + `model-registry.ts` | Wire `AI_GATEWAY_URL` (IPI-454) |
| 🟡 | `src/app/(operator)/app/assets/page.tsx` | Replace placeholder (IPI-404) |
| 🟡 | `src/app/(operator)/app/campaigns/page.tsx` | Replace placeholder (IPI-249) |
| 🟢 | Design-only components | No CF changes for pure RSC/client UI if no new API routes |

---

## H. Recommended execution order

### Design V2 (UI-only, Vercel-safe)

```text
1. IPI-304 · DESIGN-081 — De-fork ApprovalCard
2. IPI-404 · SCR-08 — Assets read-only masonry
3. IPI-407 · SCR-15 — Notification inbox (polling)
4. IPI-405 · SCR-09 — Matching workspace (finish)
5. IPI-409 · SCR-20 — Talent Profile
6. IPI-249 · DESIGN-058 — Campaigns workspace
7. IPI-285 · Suggestion Rail (UI slice only)
8. MOB-01 → MOB-04 → MOB-90 (mobile shell)
9. IPI-253 / IPI-258 — A11y + Playwright gates
```

### Cloudflare (parallel — blocks CF production, not all UI)

```text
1. Merge PR #286 · CF-MIG-210
2. CF-MIG-111 · OpenNext CI
3. IPI-457 · Registry merge
4. IPI-454 · AI Gateway AC-F
5. CF-MIG-220 · Workers smoke (include /app/matching, /api/copilotkit)
6. IPI-462 → IPI-463
7. CF-MIG-810 · DNS last
```

---

## Grading summary

| Area | Grade | Dot |
|------|:-----:|:---:|
| Design source → task mapping | B+ | 🟢 |
| Linear status honesty | C+ | 🟡 |
| Project purity (design vs platform) | C | 🟡 |
| Operator route parity | B | 🟡 |
| Cloudflare Workers compatibility | D+ | 🔴 |
| **Overall forensic score** | **70/100** | 🟡 |

**Will Design V2 succeed?** 🟢 Yes for operator UI on current Vercel prod path.  
**Is it production ready on Cloudflare?** 🔴 No — merge CF-MIG-210, add CI/smoke, wire gateway, then cutover.

---

## References

- [Cloudflare Next.js on Workers](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/)
- [OpenNext Cloudflare](https://opennext.js.org/cloudflare)
- [Mastra Cloudflare deploy](https://mastra.ai/guides/deployment/cloudflare)
- [CopilotKit Mastra](https://docs.copilotkit.ai/mastra)
- Repo: [`CLOUDFLARE-EPIC.md`](../CLOUDFLARE-EPIC.md) · [`todo.md`](../todo.md)
