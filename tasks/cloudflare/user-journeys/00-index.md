# 00 — Real-world AI journey index

**Created:** 2026-07-10  
**SSOT companions:** [`../tests/worker-user-journeys.md`](../tests/worker-user-journeys.md) · [`.cursor/rules/cloudflare-workflow.mdc`](../../../.cursor/rules/cloudflare-workflow.mdc)  
**Concern:** Docs-only test plans (no production code)  
**Linear epic:** [**IPI-500 · CF-UJ-000 — Real-World AI Journey Test Suite**](https://linear.app/amo100/issue/IPI-500) (parent of **IPI-487**)

## Routing truth (do not invent)

| Mode | When | What hits Cloudflare Worker |
|------|------|-----------------------------|
| **`AI_ROUTING_MODE=direct`** (default) | Today on most local/prod app boots | **Nothing** from Mastra — Gemini/Groq SDKs direct |
| **`AI_ROUTING_MODE=gateway`** | Opt-in (**IPI-454 · CF-AI-001** AC-F / PR #317) | **`fast` only** unless `AI_GATEWAY_ALLOW_TOOL_TIERS=1` |
| **Vision** | Always | **Direct Gemini** (Worker has no ImageParts) |
| **Embeddings** | `providerAdapter.embed` / Worker `/v1/embeddings` | Workers AI BGE **768-d** (**IPI-492 · CF-AI-004c** Done) |
| **Tools on gateway** | Not implemented | Keep tool agents on **direct** |

**Do not claim Production Verified** for any journey until production DNS cutover (**IPI-631**) and soak gates pass. Remote Preview for OpenNext is available on `ipix-operator-preview` (see below).

### Remote hosting snapshot (2026-07-20)

| Surface | Host | Status |
|---------|------|--------|
| Production `www.ipix.co` | **Vercel** | Live operator app |
| Preview OpenNext | Cloudflare Worker `ipix-operator-preview` · `https://ipix-operator-preview.sk-498.workers.dev` | Live (`x-opennext: 1`) |
| Custom AI Gateway Worker | `ai-gateway.sk-498.workers.dev` | Live public `/health` 200; frozen for new features |
| Native `ipix-prod` AI Gateway | Dashboard | Provisioned; not production traffic yet (**IPI-586**) |
| Preview smoke evidence | `tasks/cloudflare/tests/ipi-632-preview-smoke/` | Committed (#509); residuals in `*-residuals.json` |
| Preview AI health | `GET /api/ai/health` | 🟡 URL set; Worker→Worker 404 without service binding — `tests/ipi-510-health/` |

---

## Journey catalog

| ID | Linear | Document | When to test (feature gate) | Readiness | Priority |
|----|--------|----------|----------------------------|:---------:|:--------:|
| J01 | [**IPI-501 · CF-UJ-001**](https://linear.app/amo100/issue/IPI-501) | [01-ai-onboarding.md](./01-ai-onboarding.md) | Onboarding + `brand-intelligence` CopilotKit MVP-ready | 🟡 | P1 |
| J02 | [**IPI-502 · CF-UJ-002**](https://linear.app/amo100/issue/IPI-502) | [02-brand-intelligence.md](./02-brand-intelligence.md) | Crawl + BI panel demoable; CF rerun after **IPI-697→IPI-699** | 🟡 baseline | P0 |
| J03 | [**IPI-503 · CF-UJ-003**](https://linear.app/amo100/issue/IPI-503) | [03-ai-brand-brief.md](./03-ai-brand-brief.md) | Brief generate UI / CD tools ship | 🟡 | P1 |
| J04 | [**IPI-504 · CF-UJ-004**](https://linear.app/amo100/issue/IPI-504) | [04-shoot-planning.md](./04-shoot-planning.md) | `production-planner` draft→**approve** ships (chat clarifying ≠ pass) | ⚪ Backlog | P1 |
| J05 | [**IPI-505 · CF-UJ-005**](https://linear.app/amo100/issue/IPI-505) | [05-booking-workflow.md](./05-booking-workflow.md) | Booking draft-only + confirm UI ships | 🟡 | P1 |
| J06 | [**IPI-506 · CF-UJ-006**](https://linear.app/amo100/issue/IPI-506) | [06-crm-workflow.md](./06-crm-workflow.md) | `crm-assistant` on CRM routes ships | 🟡 | P2 |
| J07 | [**IPI-507 · CF-UJ-007**](https://linear.app/amo100/issue/IPI-507) | [07-planner-workflow.md](./07-planner-workflow.md) | Planner schema + HITL ships | 🟡 | P1 |
| J08 | [**IPI-508 · CF-UJ-008**](https://linear.app/amo100/issue/IPI-508) | [08-marketing-operator-chat.md](./08-marketing-operator-chat.md) | **IPI-454** AC-F + gateway env; before AC-J Done | 🟡 | P0 |
| J09 | [**IPI-509 · CF-UJ-009**](https://linear.app/amo100/issue/IPI-509) | [09-embeddings-asset-search.md](./09-embeddings-asset-search.md) | **Now** (contracts); search UI after **IPI-474**; remote after preview | 🟢 local | P0 |
| J10 | [**IPI-511 · CF-UJ-010**](https://linear.app/amo100/issue/IPI-511) | [10-visual-dna-analysis.md](./10-visual-dna-analysis.md) | Asset DNA audit UI ships; CF path only after **IPI-456** | 🟡 | P2 |
| J11 | [**IPI-510 · CF-UJ-011**](https://linear.app/amo100/issue/IPI-510) | [11-ai-gateway-health.md](./11-ai-gateway-health.md) | **Continuous** — every AI/Worker PR + before demos | 🟡 remote partial | P0 |

Status: 🟢 verified (local evidence) · 🟡 partial · 🔴 blocked · ⚪ not started

---

## Recommended test execution order (when features land)

1. **J11** health + **J09** embed contracts (already Local Runtime) → CI smoke — **start now**  
2. **J08** marketing chat with `AI_ROUTING_MODE=gateway` (browser) — first true Mastra→Worker product proof  
3. **J01 / J02** onboarding + BI (still **direct** until tool bridge) — when those surfaces are MVP  
4. **J03–J07** tool-heavy agents — when each agent UI ships; keep **direct**  
5. **J10** vision — when DNA UI ships; never force through gateway until ImageParts supported  

---

## Critical blockers (cross-cutting)

| Blocker | Impact |
|---------|--------|
| Preview `/api/ai/health` Worker→Worker 404 | Same-zone `*.workers.dev` fetch needs **service binding** (or custom domain) — see IPI-510 evidence |
| No production OpenNext Worker / DNS (**IPI-631**) | No Production Verified on Cloudflare |
| Cutover before **IPI-627** security proof | Unsafe DNS move |
| Gateway has **no tool calling** | Booking/CRM/BI/planner stay **direct** under gateway mode |
| Gateway has **no vision** | Visual identity must stay direct |
| Agents bind `resolveModel()` at **module load** | Env must be set before Next boot |
| Dual registries (app vs Worker) | Drift risk (**IPI-457** Done types; runtime still dual) |
| BI Cloudflare path | Parked until **IPI-697 → IPI-699** canary |

---

## Test coverage snapshot

| Layer | Status |
|-------|--------|
| Worker vitest (embed/chat unit) | 🟢 |
| Adapter vitest | 🟢 |
| `resolveModel` gateway unit | 🟢 (merged path; default still direct) |
| Playwright journey packs | ⚪ (manual preview smoke only) |
| Wrangler live curls (custom gateway) | 🟢 public `/health` |
| Preview OpenNext CopilotKit | 🟢 auth `/info` + agent turn (#509) |
| Preview `/api/ai/health` | 🟡 URL correct; binding required for 200 |
| Browser CopilotKit under gateway mode | ⚪ |
| Supabase RLS journey asserts | 🟡 (CI web015; not journey-tied) |

**Overall real-world readiness (product AI journeys + CF preview hosting): ~58%**  
(Preview OpenNext + CopilotKit proven; AI health remote not green; production still Vercel; journeys mostly plan-only.)

---

## Evaluated but not separate docs (yet)

| Candidate | Verdict |
|-----------|---------|
| Campaign generation | Fold into J03/J07 until dedicated agent ships (**IPI-80 · AI-016** Backlog) |
| Sponsor matching | ⚪ no production path found — defer |
| Talent recommendations | Covered under J05 (`model-match`) |
| Customer support assistant | Overlaps J08 marketing; no dedicated support agent |
| Notifications / approvals | Cross-cutting HITL — note in J04–J07, not a solo AI journey |
| Post-event reporting | ⚪ not implemented as AI journey |
| Social discovery agent | Exists in registry — fold into BI/CRM later if productized |

---

## Related Linear (full names)

- **IPI-500 · CF-UJ-000 — Real-World AI Journey Test Suite** (epic; children IPI-501–511)  
- **IPI-454 · CF-AI-001 — AI Gateway — Cloudflare Provider Routing** (In Review; AC-F = #317)  
- **IPI-461 · CF-AI-004 — AI Provider Adapter** (Done)  
- **IPI-491 · CF-AI-004b — Fix AI Gateway embeddings** (Done)  
- **IPI-492 · CF-AI-004c — Harden AI Gateway embed & error contracts** (Done)  
- **IPI-472 · INFRA-001 — Cloudflare Worker Deployment Pipeline** (In Progress)  
- **IPI-485 · MASTRA-CF-001 — Mastra Provider Gateway Cutover** (Backlog)  
- **IPI-474 · SEARCH-001 — AI Search & Vector Architecture** (Backlog)  
- **IPI-495 · CF-AI-004e — Chat error-contract parity with embed envelope** (Backlog)  
- **IPI-455** Migrate Brand Intelligence to Cloudflare · **IPI-456** Migrate Asset DNA to Cloudflare (Backlog)  
