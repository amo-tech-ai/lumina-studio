# Cloudflare + Design V2 — July 9 Audit Snapshot

**Auditor:** forensic pass · **App:** `/home/sk/ipix/app`  
**Linear:** [DESIGN V2 — Operator React Parity](https://linear.app/amo100/project/design-v2-operator-react-parity-e276f28e26a0/issues) (131 issues) · [AI Platform](https://linear.app/amo100/project/ai-platform-llm-providers-8088f63224f2/issues)  
**Checklist:** [`july-9-audit-plan.md`](./july-9-audit-plan.md) · **Design detail:** [`audit-design.md`](./audit-design.md)

---

## Executive verdict

| Question | Answer |
|----------|--------|
| **Overall percent correct** | **70%** (Design V2 Linear) · **58%** (CF migration) |
| **Will Design V2 tasks succeed?** | 🟢 **Yes** on Vercel for UI parity · 🔴 **No** on Workers until runtime gates pass |
| **Production ready?** | 🔴 **No** (CF Workers). Vercel prod remains valid interim. |
| **Verify 100% correct?** | 🔴 **No** — 18 misplaced platform tasks, 5 CF blockers on `main`, PR #286 not merged |

### Scorecard

| Area | Score | Dot |
|------|------:|:---:|
| Architecture direction (OpenNext + in-process Mastra) | 93% | 🟢 |
| OpenNext foundation (CF-MIG-110) | 95% | 🟢 |
| Design V2 route parity (shipped screens) | 78% | 🟡 |
| Design V2 Linear hygiene | 68% | 🟡 |
| Runtime Workers compatibility | 40% | 🔴 |
| AI Gateway wiring | 45% | 🔴 |
| CI / smoke / env matrix | 40% | 🔴 |
| **Combined audit grade** | **70/100** | 🟡 |

---

## Top 5 blockers

1. 🔴 **CF-MIG-210** — `hono/vercel`, Groq FS read, OAuth allowlist ([PR #286](https://github.com/amo-tech-ai/lumina-studio/pull/286) open)
2. 🔴 **CF-MIG-111** — no OpenNext build in CI
3. 🔴 **CF-MIG-220** — no scripted `*.workers.dev` smoke
4. 🔴 **IPI-454 AC-F** — Mastra not routed through AI Gateway REST ([deprecated `/compat`](https://developers.cloudflare.com/ai-gateway/usage/chat-completion/))
5. 🟡 **Design V2 scope creep** — IPI-480–483, BE-* tasks block clarity; move out before sprint planning

---

## Design V2 project stats (Linear)

| Status | Count |
|--------|------:|
| Done | 43 |
| Backlog | 52 |
| In Progress | 4 |
| In Review | 1 |
| Todo | 1 |
| Duplicate | 3 |
| Canceled | 27 |
| **Total unique** | **131** |

| Classification (active only) | Count |
|--------------------------------|------:|
| True design parity | 62 |
| Platform/backend/CF (misplaced) | 18 |
| Other (Cloudinary, MI, data audit) | 21 |

**Milestone progress (Linear):** DV2-M1 64% · M2 75% · M3 45% · M4 67% — credible for UI; **not** CF-verified.

---

## Cloudflare repo truth (`main`)

| Component | Status |
|-----------|:------:|
| `wrangler.jsonc` | 🟢 |
| `open-next.config.ts` | 🟢 minimal |
| `middleware.ts` Edge-safe | 🟢 |
| `/api/copilotkit` | 🔴 `hono/vercel` |
| `provider.ts` Groq load | 🔴 `readFileSync` |
| `next.config.ts` CopilotKit aliases | 🟡 turbopack only on `main`; webpack in PR #286 |
| CI OpenNext | 🔴 |
| `/app/assets`, `/app/campaigns` | 🔴 placeholder |

**PR #286 status (Jul 9):** OPEN · CI green · webpack+turbopack aliases · unresolved threads 0 · **not on `main`**.

---

## Design V2 × Cloudflare risk matrix

| Work type | Can ship before CF cutover? | CF note |
|-----------|:---------------------------:|---------|
| Pure RSC/client screens (CRM, MOB, RF) | ✅ | Safe on Vercel; re-verify on Workers after CF-MIG-220 |
| Screens using Supabase only | ✅ | Remote DB unchanged |
| HITL / ApprovalCard UI | ✅ | **IPI-304** first |
| Intelligence Panel AI rail | 🟡 | UI yes; SSE/API needs CF-MIG-210 |
| New Mastra agent wiring (DESIGN-075–079) | 🔴 | Move to Mastra epic; gateway blocked |
| Durable Objects / Queues (480–481) | 🔴 | Defer post-cutover |
| Planner engine (476–483) | ⚪ | Not migration blocker |

---

## Missing gates (add to backlog)

See [`audit-design.md` §F](./audit-design.md) — **CF-MIG-111**, **CF-MIG-220**, **DV2-CF-GUARD**, env matrix, bundle budget, rollback drill.

---

## Recommended order (combined)

```text
HOSTING:  PR #286 merge → CF-MIG-111 → CF-MIG-220 → (457 → 454 → 485) → CF-MIG-810 last
DESIGN:   IPI-304 → IPI-404 → IPI-407 → IPI-405 → IPI-409 → IPI-249 → MOB-* → IPI-253/258
HYGIENE:  Move IPI-480–483, BE-*, planner tasks out of Design V2 project
```

---

## Doc verification (official)

| Claim | Verified |
|-------|:--------:|
| Next.js on Workers via OpenNext | 🟢 [CF docs](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/) |
| Build vs runtime env separation | 🟢 [OpenNext env](https://opennext.js.org/cloudflare/howtos/env-vars) |
| AI Gateway REST (not `/compat`) | 🟢 [AI Gateway](https://developers.cloudflare.com/ai-gateway/usage/chat-completion/) |
| Mastra in-process on OpenNext | 🟢 [Mastra CF guide](https://mastra.ai/guides/deployment/cloudflare) |
| DO for WebSockets (not needed for DV2 MVP) | 🟢 [DO WebSockets](https://developers.cloudflare.com/durable-objects/best-practices/websockets/) |
| Queues for async fan-out (defer) | 🟢 [Queues](https://developers.cloudflare.com/queues/) |

---

**Sign-off:** Design V2 is **on track for UI** but **not Cloudflare-production-ready**. Clean Linear, merge CF-MIG-210, then run OpenNext CI + smoke before tying any Design task to ⭐ Production Verified on Workers.
