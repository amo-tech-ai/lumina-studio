---
name: groq-inference
description: |
  Groq API + ultra-fast LLM inference for chat, vision, audio STT/TTS, tool use, structured outputs, and Mastra agents.
  Use whenever the user mentions Groq, GroqCloud, GROQ_API_KEY, fast inference, low latency, Whisper on Groq,
  PlayAI TTS, Llama on Groq, compound models, groq hello world, groq quick start, groq-sdk, API reference,
  production checklist, model pricing RPM, or migrating off Gemini to Groq — even if they don't name this skill. Replaces legacy groq-api and groq-hello-world skills.
---

# Groq Inference

Ultra-fast LLM inference (300–1000+ tok/s) via Groq Chat Completions API. **iPix production defaults:** [`tasks/llm/groq-plan.md`](../../../tasks/llm/groq-plan.md) · Mastra router: [`mastra/references/groq.md`](../mastra/references/groq.md).

## Hello world (verify setup)

```bash
export GROQ_API_KEY=gsk_...   # console.groq.com
pip install groq              # or: npm install groq-sdk
```

**Python:**

```python
from groq import Groq

client = Groq()  # reads GROQ_API_KEY
response = client.chat.completions.create(
    model="llama-3.3-70b-versatile",
    messages=[{"role": "user", "content": "Say OK if Groq works."}],
)
print(response.choices[0].message.content)
```

**TypeScript:**

```typescript
import Groq from "groq-sdk";

const client = new Groq();
const response = await client.chat.completions.create({
  model: "llama-3.3-70b-versatile",
  messages: [{ role: "user", content: "Say OK if Groq works." }],
});
console.log(response.choices[0].message.content);
```

| Error | Fix |
|-------|-----|
| Auth | Set `GROQ_API_KEY` (Infisical / `.env.local` — never commit) |
| 429 | Read `retry-after` + `x-ratelimit-*`; exponential backoff |
| Import | `pip install groq` / `npm install groq-sdk` (not `@groq/sdk`) |

**iPix smoke:** `node scripts/groq-smoke.mjs` (after IPI-355).

## Model selection (iPix)

| Use case | Model | Notes |
|----------|-------|-------|
| Fast + cheap | `llama-3.1-8b-instant` | Simple tasks, highest throughput |
| Balanced chat + tools | `llama-3.3-70b-versatile` | Default Mastra multi-tool tier |
| Structured JSON (strict) | `openai/gpt-oss-20b` or `openai/gpt-oss-120b` | `strict: true` schema only on gpt-oss |
| Agentic (built-in search/code) | `groq/compound` or `groq/compound-mini` | **Not** `compound-beta` (deprecated) |
| Vision / OCR | `meta-llama/llama-4-scout-17b-16e-instruct` | Up to 5 images |
| Reasoning | `openai/gpt-oss-20b` + `reasoning_effort` | Or `qwen/qwen3-32b` |
| STT | `whisper-large-v3-turbo` | Groq-hosted Whisper (not OpenAI API) |
| TTS | `playai-tts` | Fritz-PlayAI, Arista-PlayAI |

Full catalog (curated) → [`reference/models-catalog.md`](reference/models-catalog.md) · official table (pricing/RPM) → [`reference/models.md`](reference/models.md).

## API constraints (read before combining flags)

| Combination | Allowed |
|-------------|---------|
| `response_format: json_schema` (strict) + tools | ❌ pick one |
| Strict JSON + `stream: true` | ❌ |
| Tools + strict JSON schema | ❌ |
| `max_completion_tokens` | ✅ preferred over legacy `max_tokens` |

Multi-tool Mastra agents: **`llama-3.3-70b-versatile`** or **`qwen/qwen3-32b`** — not `gpt-oss-120b` (no parallel tool calls).

## Core patterns

### Streaming

```python
stream = client.chat.completions.create(
    model="llama-3.3-70b-versatile",
    messages=[{"role": "user", "content": prompt}],
    stream=True,
)
for chunk in stream:
    if chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="")
```

### JSON mode vs structured outputs

```python
# Best-effort JSON object (most models)
response = client.chat.completions.create(
    model="llama-3.3-70b-versatile",
    messages=[{"role": "user", "content": "Return {\"ok\": true}"}],
    response_format={"type": "json_object"},
)
```

Strict schema → [`reference/structured-outputs.md`](reference/structured-outputs.md).

### Tool use (client-side)

```python
response = client.chat.completions.create(
    model="llama-3.3-70b-versatile",
    messages=messages,
    tools=tools,
    tool_choice="auto",
)
# Append assistant message + role:"tool" results, then call again
```

Built-in compound tools + loops → [`reference/tool-use-patterns.md`](reference/tool-use-patterns.md).

### Vision, audio, reasoning

| Topic | Reference |
|-------|-----------|
| Images / OCR | [`reference/vision-multimodal.md`](reference/vision-multimodal.md) |
| Whisper STT + PlayAI TTS | [`reference/audio-speech.md`](reference/audio-speech.md) |
| Reasoning models | [`reference/reasoning-models.md`](reference/reasoning-models.md) |

### Async + retries

```python
from groq import AsyncGroq
from tenacity import retry, stop_after_attempt, wait_exponential

async_client = AsyncGroq()

@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=10))
def reliable_chat(prompt: str) -> str:
    ...
```

## Mastra (iPix operator app)

Use model router strings (`groq/llama-3.3-70b-versatile`) or `@ai-sdk/groq` — see [`reference/mastra.md`](reference/mastra.md) and canonical iPix doc [`mastra/references/groq.md`](../mastra/references/groq.md).

```typescript
import { Agent } from "@mastra/core/agent";

export const agent = new Agent({
  id: "production-planner",
  name: "Production Planner",
  instructions: "...",
  model: "groq/llama-3.3-70b-versatile",
});
```

## Advanced API topics

Batch jobs, MCP (Responses API), prompt caching, moderation, error taxonomy → [`reference/api-advanced.md`](reference/api-advanced.md).

Full endpoint/parameter reference → [`reference/api-reference.md`](reference/api-reference.md) (GroqDocs mirror).

Cost routing and batch → [`reference/cost-optimization.md`](reference/cost-optimization.md).

Production launch (iPix GROQ-007) → [`reference/production-ready-checklist.md`](reference/production-ready-checklist.md).

SDK install details → [`reference/libraries.md`](reference/libraries.md) · [Groq client libraries](https://console.groq.com/docs/libraries).

## Reference index

| File | Load when |
|------|-----------|
| [`models.md`](reference/models.md) | Official pricing, RPM/TPM, production vs preview model IDs |
| [`models-catalog.md`](reference/models-catalog.md) | Curated selection guide + capabilities matrix |
| [`api-reference.md`](reference/api-reference.md) | Full REST params/endpoints (grep this file) |
| [`libraries.md`](reference/libraries.md) | `pip install groq` / `groq-sdk` install + usage |
| [`production-ready-checklist.md`](reference/production-ready-checklist.md) | Pre-prod launch, monitoring, cost SLAs |
| [`structured-outputs.md`](reference/structured-outputs.md) | JSON schema, strict mode, Pydantic |
| [`tool-use-patterns.md`](reference/tool-use-patterns.md) | Function calling, `groq/compound` |
| [`vision-multimodal.md`](reference/vision-multimodal.md) | Image URL/base64, OCR |
| [`audio-speech.md`](reference/audio-speech.md) | Whisper, TTS, streaming audio |
| [`reasoning-models.md`](reference/reasoning-models.md) | gpt-oss, qwen3, reasoning_format |
| [`cost-optimization.md`](reference/cost-optimization.md) | Model routing, caching, batch |
| [`api-advanced.md`](reference/api-advanced.md) | MCP, moderation, batches, errors (curated) |
| [`mastra.md`](reference/mastra.md) | Mastra agents/workflows on Groq |

## Official links

- Docs: https://console.groq.com/docs
- Python SDK: https://github.com/groq/groq-python
- TypeScript SDK: https://github.com/groq/groq-typescript

## Related skills

| Skill | When |
|-------|------|
| [`mastra`](../mastra/SKILL.md) | Agent registry, tools, iPix `app/src/mastra/` |
| [`gemini`](../gemini/SKILL.md) | DNA vision baseline until Groq gate passes |
| [`infisical`](../infisical/SKILL.md) | `GROQ_API_KEY` in dev/CI |
