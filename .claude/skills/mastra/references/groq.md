---
title: Groq via Mastra
description: Load for Groq model strings, @ai-sdk/groq, GROQ-001…007 migration, resolveModel() tiers, or config/groq-models.json. Pair with groq-api skill for edge/OpenAI-compatible API. iPix production defaults → tasks/llm/groq-plan.md.
parent: mastra
impact: MEDIUM
impactDescription: Groq router strings, AI SDK provider, iPix tier map
tags: mastra, groq, ai-sdk, llama, inference
load_when: Groq migration, AI_PROVIDER=groq, Mastra agents on Groq, llama-3.1-8b-instant, gpt-oss-120b, structured outputs on Groq
---

> Discover all available pages from the documentation index: https://mastra.ai/llms.txt

# ![Groq logo](https://models.dev/logos/groq.svg)Groq

Access 15 Groq models through Mastra's model router. Authentication is handled automatically using the `GROQ_API_KEY` environment variable.

Learn more in the [Groq documentation](https://console.groq.com/docs/models).

```bash
GROQ_API_KEY=your-api-key
```

```typescript
import { Agent } from "@mastra/core/agent";

const agent = new Agent({
  id: "my-agent",
  name: "My Agent",
  instructions: "You are a helpful assistant",
  model: "groq/canopylabs/orpheus-arabic-saudi"
});

// Generate a response
const response = await agent.generate("Hello!");

// Stream a response
const stream = await agent.stream("Tell me a story");
for await (const chunk of stream) {
  console.log(chunk);
}
```

## Models

| Model                                            | Context | Tools | Reasoning | Image | Audio | Video | Input $/1M | Output $/1M |
| ------------------------------------------------ | ------- | ----- | --------- | ----- | ----- | ----- | ---------- | ----------- |
| `groq/canopylabs/orpheus-arabic-saudi`           | 4K      |       |           |       |       |       | —          | —           |
| `groq/canopylabs/orpheus-v1-english`             | 4K      |       |           |       |       |       | —          | —           |
| `groq/groq/compound`                             | 131K    |       |           |       |       |       | —          | —           |
| `groq/groq/compound-mini`                        | 131K    |       |           |       |       |       | —          | —           |
| `groq/llama-3.1-8b-instant`                      | 131K    |       |           |       |       |       | $0.05      | $0.08       |
| `groq/llama-3.3-70b-versatile`                   | 131K    |       |           |       |       |       | $0.59      | $0.79       |
| `groq/meta-llama/llama-4-scout-17b-16e-instruct` | 131K    |       |           |       |       |       | $0.11      | $0.34       |
| `groq/meta-llama/llama-prompt-guard-2-22m`       | 512     |       |           |       |       |       | $0.03      | $0.03       |
| `groq/meta-llama/llama-prompt-guard-2-86m`       | 512     |       |           |       |       |       | $0.04      | $0.04       |
| `groq/openai/gpt-oss-120b`                       | 131K    |       |           |       |       |       | $0.15      | $0.60       |
| `groq/openai/gpt-oss-20b`                        | 131K    |       |           |       |       |       | $0.07      | $0.30       |
| `groq/openai/gpt-oss-safeguard-20b`              | 131K    |       |           |       |       |       | $0.07      | $0.30       |
| `groq/qwen/qwen3-32b`                            | 131K    |       |           |       |       |       | $0.29      | $0.59       |
| `groq/whisper-large-v3`                          | —       |       |           |       |       |       | —          | —           |
| `groq/whisper-large-v3-turbo`                    | —       |       |           |       |       |       | —          | —           |

## Advanced configuration

### Custom headers

```typescript
const agent = new Agent({
  id: "custom-agent",
  name: "custom-agent",
  model: {
    url: "https://api.groq.com/openai/v1",
    id: "groq/canopylabs/orpheus-arabic-saudi",
    apiKey: process.env.GROQ_API_KEY,
    headers: {
      "X-Custom-Header": "value"
    }
  }
});
```

### Dynamic model selection

```typescript
const agent = new Agent({
  id: "dynamic-agent",
  name: "Dynamic Agent",
  model: ({ requestContext }) => {
    const useAdvanced = requestContext.task === "complex";
    return useAdvanced
      ? "groq/whisper-large-v3-turbo"
      : "groq/canopylabs/orpheus-arabic-saudi";
  }
});
```

## Direct provider installation

This provider can also be installed directly as a standalone package, which can be used instead of the Mastra model router string. View the [package documentation](https://www.npmjs.com/package/@ai-sdk/groq) for more details.

**npm**:

```bash
npm install @ai-sdk/groq
```

**pnpm**:

```bash
pnpm add @ai-sdk/groq
```

**Yarn**:

```bash
yarn add @ai-sdk/groq
```

**Bun**:

```bash
bun add @ai-sdk/groq
```

For detailed provider-specific documentation, see the [AI SDK Groq provider docs](https://ai-sdk.dev/providers/ai-sdk-providers/groq).

---

## iPix best practices (GROQ-001…007)

**SSOT:** [`tasks/llm/groq-plan.md`](../../../../tasks/llm/groq-plan.md) · Linear [IPI-354](https://linear.app/amo100/issue/IPI-354) epic · [`config/groq-models.json`](../../../../config/groq-models.json) (Phase 1)

| Rule | Do | Don't |
|------|-----|--------|
| **Secrets** | `GROQ_API_KEY` server-only (Infisical, Edge, Mastra runtime) | `NEXT_PUBLIC_GROQ_*` or client bundle |
| **Default provider** | `AI_PROVIDER=gemini` until GROQ-007 staged rollout | Cut over all paths at once |
| **Model pick** | Read allowlist JSON — use production tiers below | Hardcode preview IDs (`llama-4-scout` for DNA launch) |
| **Structured JSON** | `openai/gpt-oss-20b` or `120b` + strict JSON Schema + **Zod validate + retry/repair** | Trust "guaranteed" JSON without post-parse validation |
| **Compound** | Separate call for web search / visit — **never** Compound + strict JSON same request | Mix enrichment + structured profile in one Groq call |
| **Vision / DNA** | Keep **Gemini** until GROQ-006 golden eval passes | Groq vision as launch-critical default |
| **Mastra wiring** | `resolveModel(tier)` in `app/src/mastra/models.ts` → `@ai-sdk/groq` or router string | Top-level `getMastra()` or per-agent hardcoded model IDs |
| **Fallback** | Per-function `*_USE_GEMINI=1` + env `AI_PROVIDER=gemini` rollback | Global-only kill switch |

### Production tier map (Mastra `resolveModel`)

| Tier | Mastra / router string | Use |
|------|------------------------|-----|
| `fast` | `groq/llama-3.1-8b-instant` | CopilotKit chat, marketing sidebar |
| `reasoning` | `groq/openai/gpt-oss-120b` | Agent tool loops, shoot brief |
| `structured` | `groq/openai/gpt-oss-20b` | Structured tool outputs (still Zod after parse) |
| `vision` | **Gemini** (until golden eval) | `visual-identity` agent — defer Groq cutover |

### AI SDK in iPix (preferred for Mastra Phase 4)

```typescript
import { groq } from "@ai-sdk/groq";
import { Agent } from "@mastra/core/agent";

// Prefer resolveModel() wrapper — don't inline in agents/
const agent = new Agent({
  id: "production-planner",
  name: "Production Planner",
  instructions: "...",
  model: groq("llama-3.1-8b-instant"), // or router: "groq/llama-3.1-8b-instant"
});
```

### Related skills

| Skill | When |
|-------|------|
| [`groq-api`](../../groq-api/SKILL.md) | Edge OpenAI-compatible client, structured outputs, rate limits |
| [`gemini`](../../gemini/SKILL.md) | DNA vision, embeddings, fallback paths |
| [`copilotkit`](../../copilotkit/SKILL.md) | Agent IDs unchanged after model swap (GROQ-005) |

**Verify (Mastra path):** `cd app && npm run lint && npm run build && npm test` · agent IDs must stay synced with `route-agent-map.ts`.