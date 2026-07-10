## IPI-487 · CLOUDFLARE-EPIC — Cloudflare Platform Migration

**Linear:** https://linear.app/amo100/issue/IPI-487  
**SSOT:** `tasks/cloudflare/CLOUDFLARE-EPIC.md`

**Next:** **CF-MIG-210 · Runtime Compatibility — Hono, OAuth & Groq Bundle**

---

## Progress tracker (lean 10 tasks)

| # | Full task name | Dot | % | Key proof / blocker |
|---|----------------|:---:|:---:|---------------------|
| 1 | **CF-MIG-110 · OpenNext Foundation — Scaffold & Edge Middleware** | 🟢 | 100% | PR #282 merged |
| 2 | **CF-MIG-210 · Runtime Compatibility — Hono, OAuth & Groq Bundle** | 🔴 | 25% | **NEXT** |
| 3 | **CF-MIG-111 · OpenNext CI Build Pipeline** | ⚪ | 0% | — |
| 4 | **CF-MIG-220 · Preview Smoke Testing & Validation** | ⚪ | 0% | Blocked on 210 |
| 5 | **CF-MIG-810 · Production DNS Cutover & Rollback** | 🔴 | 0% | Vercel still prod |
| 6 | **IPI-457 · CF-AI-005 — Unified AI Provider Types & Registry** | 🟡 | 60% | Merge to `main` |
| 7 | **IPI-454 · CF-AI-001 — AI Gateway — Cloudflare Provider Routing** | 🟡 | 45% | AC-F open |
| 8 | **IPI-485 · MASTRA-CF-001 — Mastra Provider Gateway Cutover** | ⚪ | 0% | After 454 AC-F |
| 9 | **IPI-462 · CF-AI-006 — AI Provider Evaluation Suite** | ⚪ | 0% | After gateway |
| 10 | **IPI-463 · CF-AI-008 — AI Provider Failover & Rollback** | ⚪ | 0% | After 462 |

**Overall:** 🟡 ~55%

---

## Gantt chart

```mermaid
gantt
    title Cloudflare Epic — Lean 10-Task Spine
    dateFormat YYYY-MM-DD
    axisFormat %b %d

    section Hosting
    CF-MIG-110 OpenNext Foundation           :done, mig110, 2026-07-07, 3d
    CF-MIG-210 Runtime Compatibility         :crit, mig210, 2026-07-09, 7d
    CF-MIG-111 CI OpenNext Build               :mig111, 2026-07-09, 5d
    CF-MIG-220 Preview Smoke Testing           :milestone, mig220, after mig210, 3d
    CF-MIG-810 Production DNS Cutover          :milestone, mig810, after mig220, 2d

    section AI platform
    IPI-457 Unified Provider Registry          :crit, i457, 2026-07-09, 4d
    IPI-454 AI Gateway Routing                 :crit, i454, after i457, 5d
    IPI-485 Mastra Gateway Cutover             :i485, after i454, 5d
    IPI-462 Provider Eval Suite                :i462, after i485, 5d
    IPI-463 Failover Rollback                  :i463, after i462, 4d
```

### Plain-English guide

| Order | Full task name | What you ship |
|:-----:|----------------|---------------|
| ✅ | **CF-MIG-110 · OpenNext Foundation — Scaffold & Edge Middleware** | Worker preview on :8787 |
| **1** | **CF-MIG-210 · Runtime Compatibility — Hono, OAuth & Groq Bundle** | Operator works on workers.dev |
| ∥ | **CF-MIG-111 · OpenNext CI Build Pipeline** | CI OpenNext build |
| ∥ | **IPI-457 · CF-AI-005 — Unified AI Provider Types & Registry** | Single registry on main |
| **2** | **IPI-454 · CF-AI-001 — AI Gateway — Cloudflare Provider Routing** | Gateway REST for all inference |
| **3** | **IPI-485 · MASTRA-CF-001 — Mastra Provider Gateway Cutover** | Agents off direct SDKs |
| **4** | **CF-MIG-220 · Preview Smoke Testing & Validation** | E2E smoke green |
| **5** | **IPI-462 · CF-AI-006 — AI Provider Evaluation Suite** | Eval before Workers AI default |
| **6** | **IPI-463 · CF-AI-008 — AI Provider Failover & Rollback** | Failover runbook |
| **last** | **CF-MIG-810 · Production DNS Cutover & Rollback** | DNS cutover |

```text
✅ CF-MIG-110 done → NEXT: CF-MIG-210 ∥ IPI-457
→ IPI-454 → IPI-485 → CF-MIG-220 → IPI-462 → IPI-463 → CF-MIG-810
```
