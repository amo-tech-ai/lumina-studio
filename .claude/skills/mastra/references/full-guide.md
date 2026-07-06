# Mastra — full framework guide

**Parent:** [../SKILL.md](../SKILL.md) · **Index:** [README.md](./README.md)

Progressive disclosure hub — load topic files on demand; do not paste vendor docs here.

---

## Verify before coding (priority order)

1. **Embedded docs:** `grep -r "Agent" app/node_modules/@mastra/core/dist/docs/references`
2. **Source map:** `cat app/node_modules/@mastra/core/dist/docs/assets/SOURCE_MAP.json`
3. **Remote:** https://mastra.ai/llms.txt
4. **MCP:** `searchMastraDocs` with `projectPath: /home/sk/ipix/app`

Never trust training-data API shapes — Mastra beta drift is common.

---

## iPix wiring (mandatory)

| Rule | Detail |
|------|--------|
| Location | `app/src/mastra/` only |
| Singleton | `getMastra()` inside handlers — **never** at route module top-level |
| CLI export | Proxy `mastra` in `index.ts` for `mastra dev` |
| Storage | `PostgresStore` via `getMastraStorage()` · `DATABASE_URL` required in prod |
| Models | `resolveModel()` / `models.ts` — default `gemini-3.1-flash-lite` |
| Agent IDs | Match `route-agent-map.ts` + `useAgent({ agentId })` |
| CopilotKit | In-process `getLocalAgents` — not separate-server `:4111/chat` for operator |

Full iPix block: [SKILL.md § iPix-specific wiring](../SKILL.md).

---

## Core concepts

| Concept | Reference |
|---------|-----------|
| Agents + tools | [tools.md](./tools.md) · [embedded-docs.md](./embedded-docs.md) |
| Workflows / HITL | [workflows.md](./workflows.md) |
| Memory / threads | [memory.md](./memory.md) |
| Streaming / AG-UI | [streaming.md](./streaming.md) |
| MCP | [mcp.md](./mcp.md) |
| Model providers | [model-providers.md](./model-providers.md) · [gemini.md](./gemini.md) |
| Errors / migration | [common-errors.md](./common-errors.md) · [migration-guide.md](./migration-guide.md) |
| Doc routing | [topic-routing.md](./topic-routing.md) · [../links.md](../links.md) |

---

## TypeScript / dev workflow

- Run agents: `cd app && npm run dev` (Next + Mastra dev)
- Typecheck: `cd app && npm run typecheck` before PR
- Tests: `cd app && npm test` for agent/tool unit tests
- CI build: guard `DATABASE_URL` with `!process.env.CI` in storage stub when needed

---

## When to load sibling skills

| Need | Skill |
|------|-------|
| CopilotKit operator UI | [copilotkit](../../copilotkit/SKILL.md) |
| Gemini prompts (edge) | [gemini](../../gemini/SKILL.md) |
| Forensic Done gate | [task-verifier](../../task-verifier/SKILL.md) |
