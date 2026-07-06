---
name: mastra
description: "Mastra framework: docs lookup (links.md, mastraDocs MCP, embedded docs), agents, workflows, streaming, browser, tools, memory, RAG, processors, CopilotKit guide. Verify from installed docs — never trust training-data APIs. NOT for: product intent routing (mastra-routing), Managed Agents API harness (mde-agents), non-Mastra frameworks. Load when editing src/mastra/**, Mastra tools/workflows, memory, streaming/events, browser automation, or Mastra doc URLs."
title: Mastra framework guide
impact: HIGH
impactDescription: Docs routing, agents/workflows, embedded vs remote APIs
tags: mastra, agents, workflows, tools, memory, rag, typescript
license: Apache-2.0
metadata:
  author: Mastra
  version: "2.1.0"
  repository: https://github.com/mastra-ai/skills
paths:
  - "app/src/mastra/**"
  - "**/*mastra*"
---

# Mastra Framework Guide

## When NOT to use

- **Generic "build an agent"** with no Mastra imports → product docs, not framework internals here
- **CopilotKit v2** (`useComponent`, slots, headless v2) → use `copilotkit-integrations` skill

---

## ⚠️ Never trust training-data knowledge

Mastra evolves rapidly — APIs, constructor signatures, and patterns change between versions. Always verify against installed docs before writing code.

**Priority order:**
1. Embedded docs: `grep -r "Agent" node_modules/@mastra/core/dist/docs/references`
2. Source: `cat node_modules/@mastra/core/dist/docs/assets/SOURCE_MAP.json`
3. Remote: `https://mastra.ai/llms.txt`

---

## iPix-specific wiring

**Location:** `app/src/mastra/` (NOT `src/mastra/`)

- **Singleton:** call `getMastra()` in handlers; `index.ts` exports a Proxy `mastra` for `mastra dev` CLI only
- **Storage:** `PostgresStore` via `getMastraStorage()` — requires `DATABASE_URL` (port 6543) in prod
- **Model:** Gemini via `resolveModel()` / `resolveGeminiModel()` in `models.ts` — default **`gemini-3.1-flash-lite`**; no OpenAI key
- **Tool registry:** `app/src/mastra/tools/index.ts` as `agentTools` — all agents import from there
- **Route consumption:** `getMastra()` inside handler body only, never at import time
- **Required agent IDs:** `default`, `production-planner`, `creative-director`, `brand-intelligence`, `visual-identity`, `social-discovery` (must match `route-agent-map.ts` + `useAgent({ agentId })`)
- **HTTP workflow routes:** `shoot-wizard` + `brand-intelligence` only — no `brand-approval` route (scaffold → **IPI-278**)
- **Cleanup / defer:** IPI-278 unregister scaffold · IPI-279 durable stream cache · IPI-280 observational memory

---

## Quick topic routing

| Question | Where to look |
|----------|---------------|
| "Where is the doc for X?" | [`links.md`](links.md) → [`references/topic-routing.md`](references/topic-routing.md) |
| Agent / Workflow / Tool API | [`references/embedded-docs.md`](references/embedded-docs.md) |
| Memory (threads, OM, recall) | [`references/memory.md`](references/memory.md) |
| Workflows / HITL / suspend-resume | [`references/workflows.md`](references/workflows.md) |
| Streaming / AG-UI bridge | [`references/streaming.md`](references/streaming.md) |
| MCP client/server | [`references/mcp.md`](references/mcp.md) + [`links.md`](links.md) |
| CopilotKit + Mastra (in-process) | iPix wiring above + `getMastra()` → `getLocalAgents` |
| Common errors | [`references/common-errors.md`](references/common-errors.md) |
| v0→v1 migration | [`references/migration-guide.md`](references/migration-guide.md) |
| All reference files | [`references/README.md`](references/README.md) |

**Full framework guide** (priority order, core concepts, TypeScript config, model format, dev workflow): [`references/full-guide.md`](references/full-guide.md)

---

## Mastra docs MCP

| Tool | Use when |
|------|----------|
| `mastraDocs` | Know the doc path (`docs/…`, `guides/…`, `reference/…`) |
| `readMastraDocs` | Browse embedded topics in installed `@mastra/*` packages |
| `searchMastraDocs` | Keyword grep — **requires `projectPath: /home/sk/ipix/app`** |
| `listMastraPackages` | See which packages ship embedded docs |
