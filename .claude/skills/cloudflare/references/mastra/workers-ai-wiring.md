# Mastra + Workers AI wiring

How iPix maps model tiers to Cloudflare Workers AI — via Mastra model router or AI Gateway.

**Source task docs:** `tasks/cloudflare/mastra/cloudflare-workersai.md`

---

## Auth env vars

```bash
CLOUDFLARE_ACCOUNT_ID=...
CLOUDFLARE_API_KEY=...   # Workers AI API token (Read + Edit)
# Or for gateway worker:
CLOUDFLARE_API_TOKEN=...
```

Mastra uses OpenAI-compatible endpoint:

`https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/ai/v1`

Official: [Workers AI OpenAI compatibility](https://developers.cloudflare.com/workers-ai/configuration/open-ai-compatibility/)

---

## Mastra model strings

Prefix: `cloudflare-workers-ai/@cf/...`

```typescript
import { Agent } from "@mastra/core/agent";

const agent = new Agent({
  id: "marketing",
  name: "Marketing",
  instructions: "...",
  model: "cloudflare-workers-ai/@cf/meta/llama-3.1-8b-instruct-fp8",
});
```

Mastra exposes **22** models; Cloudflare catalog has **81** — use raw OpenAI-compat for models outside Mastra's list.

---

## iPix MVP tier mapping (eval-gated — IPI-462)

| Tier | Workers AI ID | Mastra string |
|------|---------------|---------------|
| fast / chat | `@cf/meta/llama-3.1-8b-instruct-fp8` | `cloudflare-workers-ai/@cf/meta/llama-3.1-8b-instruct-fp8` |
| structured | `@cf/mistralai/mistral-small-3.1-24b-instruct` | same prefix |
| vision | Gemini until eval | `@cf/meta/llama-3.2-11b-vision-instruct` candidate |
| embedding | `@cf/baai/bge-base-en-v1.5` | `/v1/embeddings` OpenAI-compat |

**Today:** `resolveModel()` in `app/src/lib/ai/provider.ts` uses Gemini/Groq only — Workers AI not wired on `main`.

---

## Integration options

| Path | Issue | Notes |
|------|-------|-------|
| **A — Mastra provider string** | IPI-454 AC-F alt | Change `resolveModel()` branch for `AI_PROVIDER=workers-ai` |
| **B — AI Gateway worker** | IPI-454 | `@ai-sdk/openai-compatible` → `services/cloudflare-worker` |
| **C — Wrangler `ai` binding** | Optional | `env.AI.run(model, input)` in same OpenNext worker |

Gateway worker bug (2026-07-09): must use **account ID in URL path**, token in `Authorization` — see verification audit.

---

## Wrangler binding (optional)

```jsonc
// app/wrangler.jsonc
"ai": { "binding": "AI" }
```

Guide: [Workers AI + Wrangler](https://developers.cloudflare.com/workers-ai/get-started/workers-wrangler/). Local `wrangler dev --remote` incurs usage charges.

---

## Dynamic model selection

```typescript
model: ({ requestContext }) =>
  requestContext.task === "complex"
    ? "cloudflare-workers-ai/@cf/mistralai/mistral-small-3.1-24b-instruct"
    : "cloudflare-workers-ai/@cf/meta/llama-3.1-8b-instruct-fp8",
```
