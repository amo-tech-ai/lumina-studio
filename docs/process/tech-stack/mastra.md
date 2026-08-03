# Tech stack · Mastra

**SSOT playbook:** [06 · Tech Stack Playbook](../06-tech-stack-playbook.md) §3.3

| | |
|--|--|
| **Purpose** | Server-side agents, tools, workflows, memory for `/app` |
| **Current (✅)** | 8 distinct product agents + `default` alias of `production-planner` (9 registry keys); `@mastra/core` ~1.41; memory alpha; pg + observability packages |
| **Core** | Registry, tools, `resolveModel`, org `resourceId` |
| **Advanced** | Evals, RAG modules, agent networks |
| **Class** | Agents/tools/memory harden = **MVP** · Evals depth = **Post-MVP** |
| **Rec** | **Keep** as only product agent runtime · **Improve** obs + Hyperdrive storage · no OpenClaw in product |

## Gotchas

Never `getMastra()` at route module top-level; guard `DATABASE_URL` at build; sync registry key = agent `id` = `useAgent({ agentId })`.

## Refs

[mastra.ai/docs](https://mastra.ai/docs) · [github.com/mastra-ai/mastra](https://github.com/mastra-ai/mastra)
