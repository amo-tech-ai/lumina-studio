# Cloudflare Platform — Task Roadmap (lean)

**Last updated:** 2026-07-09 (audit: main + [PR #286](https://github.com/amo-tech-ai/lumina-studio/pull/286) + Linear)  
**SSOT:** [`CLOUDFLARE-EPIC.md`](./CLOUDFLARE-EPIC.md) · Linear [**IPI-487 · CLOUDFLARE-EPIC — Cloudflare Platform Migration**](https://linear.app/amo100/issue/IPI-487)  
**Mastra:** [`mastra/MASTRA-EPIC.md`](./mastra/MASTRA-EPIC.md) · [IPI-486](https://linear.app/amo100/issue/IPI-486)  
**AI project:** [AI Platform — LLM Providers](https://linear.app/amo100/project/ai-platform-llm-providers-8088f63224f2/issues)

**10 active tasks only.** No new CF-INFRA tasks. Vercel stays prod until **CF-MIG-220** green.

---

## Progress tracker (verified Jul 9)

| # | Task | Dot | % | Proof / gap |
|---|------|:---:|:---:|-------------|
| 1 | **CF-MIG-110 · OpenNext Foundation — Scaffold & Edge Middleware** | 🟢 | 100% | [PR #282](https://github.com/amo-tech-ai/lumina-studio/pull/282) merged; `app/wrangler.jsonc`, `open-next.config.ts`, preview scripts on `main` |
| 2 | **CF-MIG-210 · Runtime Compatibility — Hono, OAuth & Groq Bundle** | 🟡 | 85% | [PR #286](https://github.com/amo-tech-ai/lumina-studio/pull/286) open · CI green · **not on `main`** · Workers smoke + `opennextjs-cloudflare build` pending |
| 3 | **CF-MIG-111 · OpenNext CI Build Pipeline** | ⚪ | 0% | No OpenNext job in `.github/workflows/ci.yml` |
| 4 | **CF-MIG-220 · Preview Smoke Testing & Validation** | ⚪ | 0% | Blocked: merge CF-MIG-210 + scripted `*.workers.dev` E2E |
| 5 | **CF-MIG-810 · Production DNS Cutover & Rollback** | 🔴 | 0% | Vercel still prod; DNS last (policy ✅) |
| 6 | **IPI-457 · CF-AI-005 — Unified AI Provider Types & Registry** | 🟡 | 60% | `app/src/lib/ai/model-registry.ts` **missing on `main`**; work on branch `ai/ipi-471-agent-001-ai-agent-architecture` ([PR #271](https://github.com/amo-tech-ai/lumina-studio/pull/271)) |
| 7 | **IPI-454 · CF-AI-001 — AI Gateway — Cloudflare Provider Routing** | 🟡 | 45% | AC-C ✅ [PR #279](https://github.com/amo-tech-ai/lumina-studio/pull/279); AC-F/I open · `AI_GATEWAY_URL` absent in app |
| 8 | **IPI-485 · MASTRA-CF-001 — Mastra Provider Gateway Cutover** | ⚪ | 0% | Linear Backlog; blocked on IPI-454 AC-F + IPI-457 |
| 9 | **IPI-462 · CF-AI-006 — AI Provider Evaluation Suite** | ⚪ | 0% | Linear Backlog; no eval script yet |
| 10 | **IPI-463 · CF-AI-008 — AI Provider Failover & Rollback** | ⚪ | 0% | Linear Backlog; after IPI-462 |

**Overall migration:** 🟡 **~58%** (foundation done; CF-MIG-210 coded but unmerged; gateway wiring + smoke remain)

**Epic correctness:** 🟡 **~86%** doc vs repo · Linear project accuracy ~55% (hosting tasks live under IPI-487, not separate CF-MIG issues)

---

## ⭐ Next

1. **Merge [PR #286](https://github.com/amo-tech-ai/lumina-studio/pull/286)** — CF-MIG-210 (hosting-only; CI green, ready for review)
2. After merge: `npm run preview` on `*.workers.dev` + set `TRUSTED_OAUTH_FORWARDED_HOSTS` for preview OAuth
3. Parallel queue: **IPI-457** registry merge (separate PR — do not mix with #286)

---

## Main-branch blockers (repo probes — Jul 9)

| Probe | `main` | Fixed in PR #286? |
|-------|:------:|:-----------------:|
| `hono/vercel` in CopilotKit route | 🔴 | ✅ fetch handler |
| `readFileSync(groq-models.json)` in `provider.ts` | 🔴 | ✅ bundled SSOT + prebuild sync |
| OAuth `*.workers.dev` | 🔴 (`.vercel.app` only) | 🟡 exact allowlist via `TRUSTED_OAUTH_FORWARDED_HOSTS` |
| CI OpenNext build | 🔴 | — (CF-MIG-111) |
| `AI_GATEWAY_URL` in app | 🔴 | — (IPI-454 AC-F) |
| `app/src/lib/ai/model-registry.ts` | 🔴 missing | — (IPI-457) |

---

## PR #286 · CF-MIG-210 status

| Check | Status |
|-------|:------:|
| State | Open · mergeable |
| CI (`app-build`, `supabase-web015`, `booking-gate`) | 🟢 |
| Vercel preview | 🟢 |
| Local gate (lint, typecheck, test, build) | 🟢 per author |
| `opennextjs-cloudflare build` | ⚪ unchecked (CF-MIG-111 follow-up) |
| Workers.dev E2E smoke | ⚪ post-merge |
| Review threads | Resolved (OAuth allowlist, groq sync, lazy fs) |

---

## Cloudflare hosting (5)

| # | Task | Status |
|---|------|:------:|
| 1 | **CF-MIG-110 · OpenNext Foundation — Scaffold & Edge Middleware** | 🟢 #282 |
| 2 | **CF-MIG-210 · Runtime Compatibility — Hono, OAuth & Groq Bundle** | 🟡 **PR #286** |
| 3 | **CF-MIG-111 · OpenNext CI Build Pipeline** | ⚪ |
| 4 | **CF-MIG-220 · Preview Smoke Testing & Validation** | ⚪ |
| 5 | **CF-MIG-810 · Production DNS Cutover & Rollback** | ⚪ last |

## AI platform (5)

| # | Task | Status |
|---|------|:------:|
| 6 | **IPI-457 · CF-AI-005 — Unified AI Provider Types & Registry** | 🟡 branch only |
| 7 | **IPI-454 · CF-AI-001 — AI Gateway — Cloudflare Provider Routing** | 🟡 AC-F open |
| 8 | **IPI-485 · MASTRA-CF-001 — Mastra Provider Gateway Cutover** | ⚪ |
| 9 | **IPI-462 · CF-AI-006 — AI Provider Evaluation Suite** | ⚪ |
| 10 | **IPI-463 · CF-AI-008 — AI Provider Failover & Rollback** | ⚪ |

IPI-461 adapter = sub-task of IPI-454 (not in top 10).

---

## Linear · AI Platform — LLM Providers

[Project board](https://linear.app/amo100/project/ai-platform-llm-providers-8088f63224f2/issues) · status **Planned** · target **2026-08-25**

| Issue | Linear status | Repo truth |
|-------|---------------|------------|
| **IPI-487 · CLOUDFLARE-EPIC** | In Progress | Parent epic — attach CF-MIG children |
| **IPI-454 · CF-AI-001** | In Progress | AC-C merged; AC-F/I open |
| **IPI-457 · CF-AI-005** | In Progress | Not on `main` |
| **IPI-461 · CF-AI-004** | In Progress | Worker scaffold on `main`; Mastra wire pending |
| **IPI-469 · CF-000** | In Review | Doc complete — mark Done |
| **IPI-485 · MASTRA-CF-001** | Backlog | Correct |
| **IPI-462 / IPI-463** | Backlog | Correct |
| **IPI-354 GROQ epic** | Canceled | Correct |

---

## Order

```text
286 merge → 210 smoke → 111 → 457 merge → 454 AC-F → 485 → 220 → 462 → 463 → 810
110 ✅ done
```

---

## Needs attention (red / yellow)

| Priority | Item | Action |
|:--------:|------|--------|
| 🔴 | CF-MIG-210 not on `main` | Merge PR #286 |
| 🔴 | No Workers preview proof | Run smoke after merge; configure OAuth allowlist |
| 🔴 | Dual registry (IPI-457) | Merge registry PR before gateway cutover |
| 🟡 | OpenNext CI missing | CF-MIG-111 after 210 lands |
| 🟡 | Gateway not wired | IPI-454 AC-F (`AI_GATEWAY_URL` → `resolveModel`) |
| 🟡 | Linear CF-MIG issues | Create/link under IPI-487 or update epic description |

---

## Rules

- One concern per PR (hosting ≠ AI)
- No DNS before CF-MIG-220
- No Workers AI default before IPI-462
- Feature work (Brand, CRM, Shoot…) uses existing epics — not migration blockers

## Docs

- Preview runbook: `migration/startup.md`
- Plan: `migration/plan-migrate.md`
- Notes: `migration/notes-2.md`, `notes-3.md`
