# CopilotKit — Domain plan (PRD + roadmap)

**Updated:** 2026-07-18  
**Authority:** Linear for status · this file for roadmap · [`todo.md`](./todo.md) for evidence progress  
**Related epic:** [IPI-486 · MASTRA-EPIC — Mastra × Cloudflare Operating System](https://linear.app/amo100/issue/IPI-486) (agents behind the chat)

## Linear (active)

| Surface | Link |
|---------|------|
| **Project** | [AI Platform — Agents](https://linear.app/amo100/project/ai-platform-agents-8a30bc8146cd) |
| **Overview** | [CopilotKit — Overview](https://linear.app/amo100/document/copilotkit-overview-9d67bc20a26a) |
| **Product Plan and Roadmap** | [CopilotKit — Product Plan and Roadmap](https://linear.app/amo100/document/copilotkit-product-plan-and-roadmap-d84b0741993c) |
| **Progress Tracker** | [CopilotKit — Progress Tracker](https://linear.app/amo100/document/copilotkit-progress-tracker-b1784d2041fb) |

Active issues: [IPI-702 · COPILOT-RUNTIME-001](https://linear.app/amo100/issue/IPI-702) · [IPI-127 · AIOR-011](https://linear.app/amo100/issue/IPI-127) · [IPI-91 · WEB-015](https://linear.app/amo100/issue/IPI-91) · [IPI-128 · AIOR-012](https://linear.app/amo100/issue/IPI-128)

## Purpose

Keep the operator chat shell (CopilotKit v2 + AG-UI/SSE) reliable so Production Planner, Brand Hub, CRM, and Booking agents stream tools and HITL approvals without a second chat stack.

## Goals

1. v2-only imports (`@copilotkit/*/v2`) — ESLint guard stays green.
2. Auth-gated `/api/copilotkit` (fail-closed) with stable `resourceId` / agent scopes.
3. Registry sync: Mastra key = agent `id` = `useAgent({ agentId })`.
4. Preview/production smoke: `/info` 200 when signed in; SSE idle timeout sane on Workers.

## Scope

| In | Out |
|----|-----|
| Runtime route, provider, license env, frontend hooks | New Mastra agents (Mastra domain) |
| HITL / frontend tools wiring | Cloudflare OpenNext cutover (Cloudflare domain) |
| Test mocks + CI for CopilotKit path | Cloudinary upload UI (Cloudinary domain) |

## Current state

- Runtime: `app/src/app/api/copilotkit/[[...slug]]/route.ts` + `runtime-v2-fetch`.
- Auth: `withOperatorAuth` / `isOperatorAuthEnforced` (IPI-468 related).
- Tests: CopilotKit route suite green after mock fix — see [`j16-copilotkit-audit.md`](./j16-copilotkit-audit.md).
- Production host today: Vercel; Worker preview must keep SSE compatible (CF-MIG / IPI-632).

## Target architecture

```text
Operator UI (CopilotKit v2)
  → POST /api/copilotkit (auth + ALS request token)
  → CopilotRuntime + MastraAgent.getLocalAgents()
  → Mastra agents (Gemini today; Gateway later)
  → HITL ApprovalCard / EvidenceBlock in shell
```

## Feature tables

### Core

| Feature | Who / why | Example | Related |
|---------|-----------|---------|---------|
| Auth-gated runtime | Operators only | Unsigned `/info` → 401 | [IPI-127](https://linear.app/amo100/issue/IPI-127) · IPI-468 |
| Agent ID sync | Chat finds agent | Planner on `/app` | Mastra registry + `route-agent-map` |
| SSE streaming | No stuck RunStarted | Shot-list stream | AG-UI / runtime-v2-fetch |
| HITL tools | AI drafts, humans approve | Deal stage move | CopilotKit develop + ApprovalCard |

### Advanced

| Feature | Example | Related |
|---------|---------|---------|
| License / identifyUser | Prod license token | Skill `references/ipix-production.md` |
| Workers SSE idle timeout | Preview on `*.workers.dev` | CF-MIG-210 / IPI-632 |
| Intelligence env gating | Optional thumbs/env | Open PRs / follow-ups — verify in Linear |

## Dependencies

- Mastra agents registered before wiring `useAgent`.
- Cloudflare protected preview for Worker SSE proof.
- Infisical / env for `COPILOTKIT_LICENSE_TOKEN` (server-only).

## Risks

| Risk | Mitigation |
|------|------------|
| Agent not found | Keep three keys identical |
| Mock drift breaks CI | Extend operator-gate mocks when route imports change |
| v1 imports | ESLint v1-import guard |

## Success criteria

- [ ] Signed-in `/api/copilotkit/info` = 200 on preview + prod evidence
- [ ] Route + runtime Vitest green in CI
- [ ] One full agent turn (tool call) on protected CF preview when IPI-632 runs
- [ ] No v1 CopilotKit imports in `app/`

## Roadmap

```text
1. Keep runtime auth + tests green (hygiene)
2. License-branch unit coverage (optional)
3. Live smoke with IPI-127 / IPI-632
4. Stay v2; follow Mastra native routing flags — do not fork chat stack
```

## Official docs

- CopilotKit docs (MCP / skill hub) · AG-UI protocol notes in `.claude/skills/copilotkit/`
- iPix production: `.claude/skills/copilotkit/references/ipix-production.md`

## Related Linear documents

* CopilotKit — Overview · Product Plan and Roadmap · Progress Tracker (AI Platform — Agents)
* Mastra — * (same project — agents behind the shell)

**Last reviewed:** 2026-07-18
