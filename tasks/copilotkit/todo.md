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
| 🟡 | [IPI-127](https://linear.app/amo100/issue/IPI-127) · CopilotKit production / license / `/info` smoke | 70% | Skill production notes; auth-gated runtime in code | Confirm live signed-in `/info` = 200 evidence this cycle | Record Remote Preview or Production probe |
| 🟡 | Operator auth on CopilotKit runtime (IPI-468 related) | 90% | Fail-closed path used by route; CF preview local proven | Remote Worker SSE not fully verified | Tie off with **IPI-632 · CF-MIG-220** |
| ⚪ | License-branch unit coverage (`isOperatorAuthEnforced === true`) | 0% | Optional in j16 audit | No dedicated tests | Add focused Vitest if license path regresses |
| 🟡 | Agent ID registry sync (Mastra ↔ CopilotKit) | 80% | Registry in `app/src/mastra/`; route uses `getLocalAgents` | Occasional drift risk on new agents | Checklist on each new agent PR |
| ⚪ | Protected preview one agent turn (SSE) | 0% | Blocked on CF preview smoke | No Production Verified CF chat yet | After **IPI-606** / **IPI-632** |

## Do not

- Revive canceled **AI INTELLIGENCE** project.
- Treat Mastra storage / Hyperdrive as CopilotKit scope (see `tasks/mastra/`).
- Mark Linear Done from this tracker alone.

## Related docs (Linear)

* CopilotKit — Overview · Product Plan and Roadmap · Progress Tracker  
* Mastra — * (same AI Platform — Agents project)
