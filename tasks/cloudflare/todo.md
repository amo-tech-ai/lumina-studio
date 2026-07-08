# Cloudflare Platform — Task Roadmap

**Last updated:** 2026-07-07 (restored after worktree cleanup)
**Status:** Phase 0 complete, Phase 1 active (IPI-454 MVP shipped)
**Total active tasks:** 23
**Runtime:** Cloudflare Workers (AI + edge). Vercel stays for Next.js app.

## Rule — All Cloudflare docs go here
Every Cloudflare architecture doc, research report, audit, and plan lives in this directory. No Cloudflare docs in `docs/architecture/`, `docs/decisions/`, or `linear/audit/`.

## Legend
- 🟢 Done · 🟡 In Progress · ⚪ Backlog · 🔴 Blocked

## Phase 0 — Planning Complete
| Item | Status |
|------|:------:|
| Research & architecture | 🟢 `cf-ai-migration-research.md` |
| Decision log | 🟢 `ai-provider-decision.md` |
| Intelligence platform plan | 🟢 `intelligence-platform-plan.md` |
| Agent architecture | 🟢 `ai-agent-architecture.md` |
| Platform architecture | 🟢 `cf-000-platform-architecture.md` |
| Architecture diagrams | 🟢 `tasks/diagrams/` (5 files) |
| Groq archive (14 IPIs) | 🟢 |
| C3 scaffold initialized | 🟢 |

## Phase 1 — Foundation (P0)
1. **IPI-469 · CF-000** — Cloudflare Platform Architecture ⚪
2. **IPI-454 · CF-AI-001** — AI Gateway 🔵 **_already In Progress_**
3. **IPI-461 · CF-AI-004** — AI Provider Adapter Layer 🟡 In Review
4. **IPI-457 · CF-AI-005** — Unified AI Provider Types & Registry 🟡 In Review
5. **IPI-471 · AGENT-001** — AI Agent Architecture 🟡 In Review
6. **IPI-465 · AGENT-002** — Shared AI Tool Registry ⚪
7. **IPI-472 · INFRA-001** — Worker Deployment Pipeline ⚪
8. **IPI-468 · SEC-001** — Cloudflare AI Security Architecture ⚪

## Phase 2 — Migration (P1)
9. **IPI-455 · CF-AI-002** — Migrate Brand Intelligence ⚪
10. **IPI-470 · AGENT-004** — Workflows & Orchestration ⚪
11. **IPI-462 · CF-AI-006** — AI Provider Evaluation Suite ⚪
12. **IPI-460 · CF-AI-010** — AI Cost Tracking & Observability ⚪
13. **IPI-474 · SEARCH-001** — AI Search & Vector Architecture ⚪
14. **IPI-466 · AGENT-005** — MCP Server Integration Strategy ⚪
15. **IPI-467 · AGENT-006** — Browser Automation Architecture ⚪
16. **IPI-473 · AGENT-003** — Shared Prompt Registry ⚪

## Phase 3 — Expansion (P2)
17. **IPI-459 · CF-AI-009** — Groq Code & Config Cleanup ⚪
18. **IPI-463 · CF-AI-008** — AI Provider Failover & Rollback ⚪
19. **IPI-458 · CF-AI-007** — NVIDIA NIM Evaluation ⚪
20. **IPI-456 · CF-AI-003** — Migrate Asset DNA Scoring (DEFERRED) ⚪
21. **IPI-181 · TOOL-001** — Function Calling Tools ⚪
22. **IPI-174 · DOC-AI-001** — Shoot PDF Brief Processing ⚪
23. **IPI-177 · SEARCH-002** — RAG Stack Evaluation ⚪
24. **IPI-282 · SHOOT-AI-004B** — Shoot DNA Scoring via Worker ⚪
25. **IPI-80 · AI-016** — Campaign Image Agent (Future) ⚪

## Summary
| Phase | Tasks | Count |
|-------|-------|:-----:|
| Phase 0 — Planning | Research, decision log, archive, scaffold | 7 🟢 |
| Phase 1 — Foundation (P0) | 8 architecture + provider tasks | 8 |
| Phase 2 — Migration (P1) | 8 migration + evaluation tasks | 8 |
| Phase 3 — Expansion (P2) | 9 expansion + cleanup tasks | 9 |
| Canceled/Archived | Groq (8), old tasks (7), merged (7) | 22 ❌ |
