---
parent: groq-inference
title: Mastra + Groq
description: Mastra agents and workflows on Groq via model router or @ai-sdk/groq. iPix production tier map lives in mastra/references/groq.md.
load_when: Mastra agent on Groq, @ai-sdk/groq, createGroq, groq/ model router string, iPix app/src/mastra
tags: groq, mastra, ai-sdk, agents, workflows
---

# Mastra + Groq

**iPix canonical (production tiers, resolveModel, GROQ-001…007):** [`.claude/skills/mastra/references/groq.md`](../../mastra/references/groq.md)

This file covers general Mastra + Groq integration. For operator app patterns, always load the iPix doc above first.

## Setup

```bash
npm install @ai-sdk/groq
export GROQ_API_KEY=gsk_...
```

## Model router (recommended in iPix)

```typescript
import { Agent } from "@mastra/core/agent";

export const agent = new Agent({
  id: "production-planner",
  name: "Production Planner",
  instructions: "You are a helpful assistant.",
  model: "groq/llama-3.3-70b-versatile",
});

const response = await agent.generate("Hello!");
const stream = await agent.stream("Tell me a story");
for await (const chunk of stream) {
  console.log(chunk);
}
```

Router prefix `groq/` + API key from `GROQ_API_KEY`. Common strings:

| Router string | Use |
|---------------|-----|
| `groq/llama-3.1-8b-instant` | Fast/cheap |
| `groq/llama-3.3-70b-versatile` | Multi-tool agents |
| `groq/groq/compound` | Built-in search + code exec |
| `groq/groq/compound-mini` | Lighter compound |
| `groq/openai/gpt-oss-120b` | Strict JSON / heavy reasoning |
| `groq/meta-llama/llama-4-scout-17b-16e-instruct` | Vision |

## Direct @ai-sdk/groq provider

```typescript
import { Agent } from "@mastra/core/agent";
import { createGroq } from "@ai-sdk/groq";

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });

export const researchAgent = new Agent({
  id: "research",
  name: "Research Assistant",
  instructions: "Accurate, well-sourced answers.",
  model: groq("llama-3.3-70b-versatile"),
});
```

## Tools on Groq

```typescript
import { createTool } from "@mastra/core/tools";
import { z } from "zod";

const weatherTool = createTool({
  id: "get_weather",
  description: "Get current weather for a location",
  inputSchema: z.object({ location: z.string() }),
  execute: async ({ context }) => `Weather in ${context.location}: 72°F`,
});

export const weatherAgent = new Agent({
  id: "weather",
  name: "Weather Assistant",
  instructions: "Help with weather.",
  model: groq("llama-3.3-70b-versatile"),
  tools: { weatherTool },
});
```

**iPix tier rule:** multi-tool agents → `llama-3.3-70b-versatile` or `qwen/qwen3-32b`, not `gpt-oss-120b`.

## Dynamic model selection

```typescript
const agent = new Agent({
  id: "dynamic-agent",
  name: "Dynamic Agent",
  model: ({ requestContext }) =>
    requestContext.task === "complex"
      ? "groq/llama-3.3-70b-versatile"
      : "groq/llama-3.1-8b-instant",
});
```

## Verify (iPix)

```bash
cd app && npm run lint && npm run build && npm test
```

Agent `id` must match Mastra registry, CopilotKit `useAgent({ agentId })`, and `route-agent-map.ts`.

## Links

- Mastra Groq docs: https://mastra.ai/docs/models/groq
- AI SDK Groq provider: https://ai-sdk.dev/providers/ai-sdk-providers/groq
- Mastra doc index: https://mastra.ai/llms.txt
