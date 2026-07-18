https://mastra.ai/models/providers/cloudflare-workers-ai

> **Catalog note (2026-07-09):** Cloudflare hosts **81 models** ([full catalog](https://developers.cloudflare.com/workers-ai/models/)). Mastra's provider router exposes **22** via `cloudflare-workers-ai/@cf/...`. For models outside the Mastra list, use the [OpenAI-compatible API](https://developers.cloudflare.com/workers-ai/configuration/open-ai-compatibility/) directly.

# ![Cloudflare Workers AI logo](https://models.dev/logos/cloudflare-workers-ai.svg)Cloudflare Workers AI

Access Cloudflare Workers AI models through Mastra's model router. Authentication uses `CLOUDFLARE_API_KEY` + `CLOUDFLARE_ACCOUNT_ID` (OpenAI-compat endpoint under the hood).

**Official entry points:**

| Method | Doc | Example |
|--------|-----|---------|
| Wrangler binding | [workers-wrangler](https://developers.cloudflare.com/workers-ai/get-started/workers-wrangler/) | `env.AI.run("@cf/meta/llama-3.1-8b-instruct", { prompt })` |
| REST API | [rest-api](https://developers.cloudflare.com/workers-ai/get-started/rest-api/) | `POST .../accounts/{id}/ai/run/@cf/...` |
| OpenAI-compat (Mastra) | [open-ai-compatibility](https://developers.cloudflare.com/workers-ai/configuration/open-ai-compatibility/) | `cloudflare-workers-ai/@cf/meta/llama-3.1-8b-instruct-fp8` |

Learn more: [Workers AI get started](https://developers.cloudflare.com/workers-ai/get-started/) · [Models catalog](https://developers.cloudflare.com/workers-ai/models/)

```bash
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_API_KEY=your-api-key
```

```typescript
import { Agent } from "@mastra/core/agent";

const agent = new Agent({
  id: "my-agent",
  name: "My Agent",
  instructions: "You are a helpful assistant",
  model: "cloudflare-workers-ai/@cf/aisingapore/gemma-sea-lion-v4-27b-it"
});

// Generate a response
const response = await agent.generate("Hello!");

// Stream a response
const stream = await agent.stream("Tell me a story");
for await (const chunk of stream) {
  console.log(chunk);
}
```

> **Info:** Mastra uses the OpenAI-compatible `/chat/completions` endpoint. Some provider-specific features may not be available. Check the [Cloudflare Workers AI documentation](https://developers.cloudflare.com/workers-ai/models/) for details.

## Models

| Model                                                                | Context | Tools | Reasoning | Image | Audio | Video | Input $/1M | Output $/1M |
| -------------------------------------------------------------------- | ------- | ----- | --------- | ----- | ----- | ----- | ---------- | ----------- |
| `cloudflare-workers-ai/@cf/aisingapore/gemma-sea-lion-v4-27b-it`     | 128K    |       |           |       |       |       | $0.35      | $0.56       |
| `cloudflare-workers-ai/@cf/deepseek-ai/deepseek-r1-distill-qwen-32b` | 80K     |       |           |       |       |       | $0.50      | $5          |
| `cloudflare-workers-ai/@cf/google/gemma-4-26b-a4b-it`                | 256K    |       |           |       |       |       | $0.10      | $0.30       |
| `cloudflare-workers-ai/@cf/ibm-granite/granite-4.0-h-micro`          | 131K    |       |           |       |       |       | $0.02      | $0.11       |
| `cloudflare-workers-ai/@cf/meta/llama-3.1-8b-instruct-fp8`           | 32K     |       |           |       |       |       | $0.15      | $0.29       |
| `cloudflare-workers-ai/@cf/meta/llama-3.2-11b-vision-instruct`       | 128K    |       |           |       |       |       | $0.05      | $0.68       |
| `cloudflare-workers-ai/@cf/meta/llama-3.2-1b-instruct`               | 60K     |       |           |       |       |       | $0.03      | $0.20       |
| `cloudflare-workers-ai/@cf/meta/llama-3.2-3b-instruct`               | 80K     |       |           |       |       |       | $0.05      | $0.34       |
| `cloudflare-workers-ai/@cf/meta/llama-3.3-70b-instruct-fp8-fast`     | 24K     |       |           |       |       |       | $0.29      | $2          |
| `cloudflare-workers-ai/@cf/meta/llama-4-scout-17b-16e-instruct`      | 131K    |       |           |       |       |       | $0.27      | $0.85       |
| `cloudflare-workers-ai/@cf/meta/llama-guard-3-8b`                    | 131K    |       |           |       |       |       | $0.48      | $0.03       |
| `cloudflare-workers-ai/@cf/mistralai/mistral-small-3.1-24b-instruct` | 128K    |       |           |       |       |       | $0.35      | $0.56       |
| `cloudflare-workers-ai/@cf/moonshotai/kimi-k2.6`                     | 262K    |       |           |       |       |       | $0.95      | $4          |
| `cloudflare-workers-ai/@cf/moonshotai/kimi-k2.7-code`                | 262K    |       |           |       |       |       | $0.95      | $4          |
| `cloudflare-workers-ai/@cf/nvidia/nemotron-3-120b-a12b`              | 256K    |       |           |       |       |       | $0.50      | $2          |
| `cloudflare-workers-ai/@cf/openai/gpt-oss-120b`                      | 128K    |       |           |       |       |       | $0.35      | $0.75       |
| `cloudflare-workers-ai/@cf/openai/gpt-oss-20b`                       | 128K    |       |           |       |       |       | $0.20      | $0.30       |
| `cloudflare-workers-ai/@cf/qwen/qwen2.5-coder-32b-instruct`          | 33K     |       |           |       |       |       | $0.66      | $1          |
| `cloudflare-workers-ai/@cf/qwen/qwen3-30b-a3b-fp8`                   | 33K     |       |           |       |       |       | $0.05      | $0.34       |
| `cloudflare-workers-ai/@cf/qwen/qwq-32b`                             | 24K     |       |           |       |       |       | $0.66      | $1          |
| `cloudflare-workers-ai/@cf/zai-org/glm-4.7-flash`                    | 131K    |       |           |       |       |       | $0.06      | $0.40       |
| `cloudflare-workers-ai/@cf/zai-org/glm-5.2`                          | 262K    |       |           |       |       |       | $1         | $4          |

## iPix MVP tier mapping (CF-000 — eval via IPI-462)

| Tier | Recommended Workers AI ID | Mastra string |
|------|---------------------------|---------------|
| fast / chat | `@cf/meta/llama-3.1-8b-instruct-fast` | `cloudflare-workers-ai/@cf/meta/llama-3.1-8b-instruct-fp8` |
| structured | `@cf/mistralai/mistral-small-3.1-24b-instruct` | same prefix |
| vision | Keep Gemini until eval | `@cf/meta/llama-4-scout-17b-16e-instruct` candidate |
| embedding | `@cf/baai/bge-base-en-v1.5` (768-dim) | via `/v1/embeddings` OpenAI-compat |

**Not wired in app yet** — preview marketing chat still uses `AI_PROVIDER=gemini`. Wire after IPI-454 gateway or direct `resolveModel()` branch.

## Wrangler binding (optional — same Worker as OpenNext)

Add to `app/wrangler.jsonc` when using native `env.AI.run` instead of HTTP:

```jsonc
"ai": { "binding": "AI" }
```

See [Workers Bindings guide](https://developers.cloudflare.com/workers-ai/get-started/workers-wrangler/). Local `wrangler dev` incurs Workers AI usage charges.

## Advanced configuration

### Custom headers

```typescript
const agent = new Agent({
  id: "custom-agent",
  name: "custom-agent",
  model: {
    url: "https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/v1",
    id: "cloudflare-workers-ai/@cf/aisingapore/gemma-sea-lion-v4-27b-it",
    apiKey: process.env.CLOUDFLARE_API_KEY,
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
      ? "cloudflare-workers-ai/@cf/zai-org/glm-5.2"
      : "cloudflare-workers-ai/@cf/aisingapore/gemma-sea-lion-v4-27b-it";
  }
});
```
