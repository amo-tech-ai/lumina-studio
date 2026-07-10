## IPI-486 · MASTRA-EPIC — Mastra × Cloudflare Operating System

**Linear:** https://linear.app/amo100/issue/IPI-486  
**SSOT doc:** `tasks/cloudflare/mastra/MASTRA-EPIC.md`  
**Parent epic for:** all Mastra × Cloudflare agent, gateway, and runtime work  
**Related hosting epic:** [IPI-487 · CLOUDFLARE-EPIC](https://linear.app/amo100/issue/IPI-487)

### Strategy (one paragraph)

Keep **Mastra in-process** inside the OpenNext Worker. Route all model calls through **Cloudflare AI Gateway REST** (`resolveModel()` → gateway → Workers AI / Gemini fallback). Do **not** use standalone `@mastra/deployer-cloudflare` as primary path. Do **not** flip Workers AI default before **IPI-462 · CF-AI-006 — AI Provider Evaluation Suite**.

### Current position (2026-07-09)

- ✅ **CF-MIG-110 · OpenNext Foundation** — PR #282 merged
- ✅ **IPI-129, IPI-132–135, IPI-278** — runtime foundation on `main`
- **NEXT (one PR each):** **CF-MIG-210** (hosting) OR **IPI-457** merge (AI registry)
- Then: **IPI-454 AC-F** → **IPI-485** → **IPI-462** → **CF-MIG-220** → **CF-MIG-810** (DNS last)

### Child issues (attach as sub-issues in Linear)

| Issue | Full name | Phase |
|-------|-----------|:-----:|
| IPI-454 | **IPI-454 · CF-AI-001 — AI Gateway — Cloudflare Provider Routing** | P0–P1 |
| IPI-457 | **IPI-457 · CF-AI-005 — Unified AI Provider Types & Registry** | P0 |
| IPI-461 | **IPI-461 · CF-AI-004 — AI Provider Adapter Layer** | P0 |
| IPI-485 | **IPI-485 · MASTRA-CF-001 — Mastra Provider Gateway Cutover** | P1 |
| IPI-462 | **IPI-462 · CF-AI-006 — AI Provider Evaluation Suite** | P3 |
| IPI-463 | **IPI-463 · CF-AI-008 — AI Provider Failover & Rollback** | P3 |
| IPI-465 | **IPI-465 · AGENT-002 — Shared AI Tool Registry** | P1 |
| IPI-470 | **IPI-470 · AGENT-004 — Cloudflare Workflows & Orchestration** | P6 defer |
| IPI-482 | **IPI-482 · Mastra Planner AI Tools + CopilotKit HITL** | P4 |
| IPI-240 | **IPI-240 · Provider Options Alignment (gateway-era)** | P1 |
| IPI-129 | **IPI-129 · AIOR-013 — Mastra Durable Storage (Postgres)** | ✅ Done |
| IPI-132–135 | Durable agents + memory foundation | ✅ Done |
| IPI-278 | **IPI-278 · MASTRA-CLEAN-001 — Unregister Brand Approval Scaffold** | ✅ Done |

**Related (CLOUDFLARE-EPIC, not duplicates):** CF-MIG-110, CF-MIG-210, CF-MIG-220, CF-MIG-810 — see `linear/issues/IPI-CF-MIG-*.md`

### Gantt + plain-English guide

See **§7** in `tasks/cloudflare/mastra/MASTRA-EPIC.md` — mermaid Gantt + table with full task names and descriptions.
