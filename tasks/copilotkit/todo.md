# CopilotKit — Progress Task Tracker

**Last reviewed:** 2026-07-18  
**Linear project:** [AI Platform — Agents](https://linear.app/amo100/project/ai-platform-agents-8a30bc8146cd)  
**Plan:** [`PLAN.md`](./PLAN.md) · Audit: [`j16-copilotkit-audit.md`](./j16-copilotkit-audit.md)  
**Code:** `app/src/app/api/copilotkit/` · Skill: `.claude/skills/copilotkit/`

Legend: 🟢 Complete · 🟡 In progress · 🔴 Failed/blocked · ⚪ Not started  
**Status authority:** Linear (this file is evidence progress only).

| Status | Linear task | Progress | Evidence | Missing or failing | Next action |
|:---:|---|---:|---|---|---|
| 🟢 | CopilotKit route unit/runtime tests (j16 mock fix) | 100% | `npx vitest run src/app/api/copilotkit` → 20/20 per j16 audit | None | Keep mocks in sync with `operator-gate` exports |
| 🟡 | [IPI-702 · COPILOT-RUNTIME-001 — Restore Production CopilotKit /info Discovery and Agent Execution](https://linear.app/amo100/issue/IPI-702) | ~60% | Linear In Progress; PR #453 path | Production `/info` evidence this cycle | Land code + prod smoke via parent |
| 🟡 | [IPI-127 · AIOR-011 — Restore CopilotKit production runtime configuration](https://linear.app/amo100/issue/IPI-127) | ~70% | Parent ops; auth-gated runtime in code | Confirm live signed-in `/info` = 200 | Record Production probe |
| 🟡 | Operator auth on CopilotKit runtime ([IPI-468 · SEC-001](https://linear.app/amo100/issue/IPI-468) related) | 90% | Fail-closed path used by route; CF preview local proven | Remote Worker SSE not fully verified | Tie off with [IPI-632 · CF-MIG-220 — Protected Preview Runtime Smoke Validation](https://linear.app/amo100/issue/IPI-632) |
| ⚪ | License-branch unit coverage (`isOperatorAuthEnforced === true`) | 0% | Optional in j16 audit | No dedicated tests | Add focused Vitest if license path regresses |
| 🟡 | Agent ID registry sync (Mastra ↔ CopilotKit) | 80% | Registry in `app/src/mastra/`; route uses `getLocalAgents` | Occasional drift risk on new agents | Checklist on each new agent PR |
| ⚪ | Protected preview one agent turn (SSE) | 0% | Blocked on CF preview smoke | No Production Verified CF chat yet | After [IPI-606 · CF-SEC-010](https://linear.app/amo100/issue/IPI-606) / [IPI-632 · CF-MIG-220](https://linear.app/amo100/issue/IPI-632) |
| 🟡 | [IPI-91 · WEB-015 — EPIC — Public Homepage AI Chatbot](https://linear.app/amo100/issue/IPI-91) | — | Linear In Progress; related public surface | Lead save tool gaps | See child WEB-015 issues |
| ⚪ | [IPI-128 · AIOR-012 — useRenderToolCall Gen UI registry](https://linear.app/amo100/issue/IPI-128) | 0% | Linear Backlog | Registry not shipped | After runtime restore |

## Linear documents

| Doc | URL |
|-----|-----|
| Overview | [CopilotKit — Overview](https://linear.app/amo100/document/copilotkit-overview-9d67bc20a26a) |
| Product Plan and Roadmap | [CopilotKit — Product Plan and Roadmap](https://linear.app/amo100/document/copilotkit-product-plan-and-roadmap-d84b0741993c) |
| Progress Tracker | [CopilotKit — Progress Tracker](https://linear.app/amo100/document/copilotkit-progress-tracker-b1784d2041fb) |

## Do not

- Revive canceled **AI INTELLIGENCE** project.
- Treat Mastra storage / Hyperdrive as CopilotKit scope (see `tasks/mastra/`).
- Mark Linear Done from this tracker alone.
