---
title: CRM CopilotKit Plan
version: "1.0"
lastUpdated: "2026-07-04"
baseline: origin/main
audit: tasks/crm/03-crm-existing-state-audit.md
---

## Purpose

Wire `crm-assistant` into the existing IntelligencePanel/chat-dock — no new runtime, no new route, no new approval-UI pattern.

**Wave ownership:** **IPI-368** = phases 1–2 below (route map, `useAgentContext`, `navigateTo`, frontend tool error safety). **IPI-369** = phase 3 (IntelligencePanel sections). **IPI-367** = won/lost `ApprovalCard` (phase 4 won/lost half); **IPI-369** = `draftFollowUp` approval (phase 4 draft half).

## Current setup

| Component | Status | Notes |
| ----------- | :------: | ------- |
| Runtime | 🟢 (reused) | `app/src/app/api/copilotkit/[[...slug]]/route.ts` — adding `crm-assistant` only needs a new entry in the `agents` map in `mastra/index.ts`, no new route |
| Route → agent map | 🔴 | Add `/app/crm/*` → `crm-assistant` in `app/src/lib/route-agent-map.ts` |
| Context injection | 🔴 | Follow `brand-intelligence`'s pattern: current company/contact/deal id auto-injected, used before tool calls |
| IntelligencePanel sections | 🔴 | New sections for CRM (deal health, next-best-action) follow the existing `panel-contract.ts` shape — no new panel type |
| Approval UI | 🟢 (reused) | `intel-approval-card.tsx` / `applyDraft` — deal `won`/`lost` and outbound-draft approvals reuse this verbatim |
| Frontend tool: `navigateTo` | 🟢 (reused pattern) | Same shape as `brand-intelligence-agent.ts`'s nav tool |
| Tool error handling | 🔴 | Wrap each `crm-assistant` frontend tool so a handler exception returns `{ok: false, error}` instead of re-throwing — an uncaught throw aborts the whole CopilotKit run and wipes the panel. Pattern from `atomic-crm`'s `useAuditedFrontendTool.ts` — see `tasks/crm/04-reference-implementations-analysis.md` |

Full audit: [`../03-crm-existing-state-audit.md`](../03-crm-existing-state-audit.md#ai-agents--copilotkit)

## Required skills

- `.claude/skills/copilotkit/SKILL.md`
- `.claude/skills/frontend-design/SKILL.md` (panel UX)

## Files to inspect

- `app/src/app/api/copilotkit/[[...slug]]/route.ts`
- `app/src/lib/route-agent-map.ts`
- `app/src/components/intelligence-panel/panel-contract.ts`
- `app/src/components/intelligence-panel/intel-approval-card.tsx`

## Implementation phases

| Phase | Deliverable | Issue |
| ------- | ------------- | ------- |
| 1 | `crm-assistant` in `route-agent-map.ts` for `/app/crm/*` | IPI-368 |
| 2 | `useAgentContext` on CRM list/detail routes + `navigateTo` (extend operator-panel or CRM frontend tool) + audited frontend-tool error returns | IPI-368 |
| 3 | IntelligencePanel sections: deal health, next-best-action, activity feed | IPI-369 |
| 4 | Approval wiring: `draftFollowUp` (IPI-369); deal `won`/`lost` (IPI-367) | IPI-367 / IPI-369 |

## Acceptance criteria

- [ ] v2 imports only (`/v2` subpath)
- [ ] No new CopilotKit route — reuses the single existing endpoint
- [ ] `crm-assistant` context injected before any tool call, per instructions convention
- [ ] Panel section order matches existing convention: context → approvals → tabs → evidence → activity

## Risks

| Risk | Mitigation |
| ------ | ------------ |
| New panel section order breaks the existing `context → approvals → tabs → evidence → activity` convention | Follow `panel-contract.ts` ordering exactly, don't reorder for CRM |
| `crm-assistant` missing from `REQUIRED_AGENT_IDS`-adjacent checks causes a runtime 401/404 | Verify against `mastra-plan.md`'s registry guard before wiring the route map |

## Verification

```bash
cd app && npm run lint && npm test
cd app && npx vitest run src/app/api/copilotkit
# Manual: login → /app/crm/companies → chat responds with crm-assistant
```
