Use this prompt for Claude Code.

````markdown
Work on Linear issue **IPI-526 · CF-AI-012 — AWS Bedrock Provider Fallback**.

Suggested branch:

ai/ipi-526-bedrock-provider-fallback

## Objective

Replace the Gemini fallback with AWS Bedrock.

Cloudflare Workers AI remains the PRIMARY provider.

AWS Bedrock becomes the ONLY fallback provider.

Do NOT use Gemini anywhere in the gateway.

---

## Existing AWS Configuration

The credentials already exist locally.

Environment file:

/home/sk/ipix/app/.env.local

Available variables:

- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY
- AWS_BEARER_TOKEN (if needed)
- AWS_REGION=us-east-1

AWS CLI verification:

```bash
aws sts get-caller-identity
```

returns

```
Account:
787178085189
```

Current AWS region:

```
us-east-1
```

Do NOT ask for credentials unless they are actually missing.

Reuse the existing environment variables.

---

## What to build

Implement a new provider:

```
services/cloudflare-worker/src/providers/bedrock.ts
```

Requirements:

- OpenAI-compatible Bedrock Chat Completions
- support:
  - messages
  - tools
  - tool_choice
  - tool_calls
  - tool_call_id
  - streaming
- compatible with PR #333 tool protocol
- same request/response contract as Workers AI provider

---

## Routing

Current architecture:

Mastra
↓
Cloudflare Worker
↓
Workers AI

Target architecture:

Mastra
↓
Cloudflare Worker
↓
Workers AI
↓
(if retryable failure)
AWS Bedrock

Retry only for:

- 429
- 500
- 502
- 503
- 504
- timeout

Do NOT retry:

- invalid request
- invalid tools
- authentication
- permission
- schema errors

---

## Registry

Extend the provider registry.

Support:

```ts
provider:
  | "workers-ai"
  | "bedrock"
```

Example:

```json
"default": {
  "provider": "workers-ai",
  "model": "@cf/openai/gpt-oss-120b"
},

"default-fallback": {
  "provider": "bedrock",
  "model": "openai.gpt-oss-120b-1:0"
}
```

---

## Tests

Add tests for:

- successful Bedrock request
- streaming
- tool calling
- Workers AI failure
- fallback to Bedrock
- logging of fallback

---

## Documentation

Update:

- CLOUDFLARE-EPIC.md
- todo.md
- provider architecture diagram
- model registry documentation

---

## Deliverables

- provider implementation
- tests
- documentation
- Linear updates
- migration notes

Keep the PR focused only on Bedrock fallback.
Do not modify unrelated features.
````

---

## What Claude needs

Claude **does not need your actual secret values** if it is only writing code.

It only needs to know the **environment variable names**:

* `AWS_ACCESS_KEY_ID`
* `AWS_SECRET_ACCESS_KEY`
* `AWS_REGION`
* `AWS_BEARER_TOKEN` (only if you actually use it)

It should **never** ask you to paste the secret values into the prompt.

If Claude needs to test locally, it can read them from:

```text
/home/sk/ipix/app/.env.local
```

or use your existing AWS CLI configuration.

From your output:

```bash
aws sts get-caller-identity
```

the AWS CLI is already authenticated.

Also:

```bash
aws configure list
```

shows:

* ✅ AWS credentials configured
* ✅ Region: `us-east-1`

That is sufficient for development. The only additional information Claude may need is **which Bedrock model ID you want as the fallback** (for example, `openai.gpt-oss-120b-1:0` if you have access to it). It can also discover available models from your account rather than assuming one is enabled.
Yes — **AWS Bedrock is a better fallback than Gemini for your current situation**, especially because Gemini has no available credits.

## Recommended architecture

```text
Mastra agents
      ↓
iPix AI Gateway Worker
      ↓
Primary: Cloudflare Workers AI
      ↓ failure / rate limit / unsupported model
Fallback: AWS Bedrock
```

This gives you:

* Cloudflare Workers AI as the main provider.
* AWS Bedrock only when Cloudflare fails.
* No dependency on Gemini credits.
* One central gateway for logging and routing.

## Why Bedrock fits well

Amazon Bedrock supports hundreds of models, including:

* OpenAI `gpt-oss-20b` and `gpt-oss-120b`
* Amazon Nova
* Anthropic Claude
* Qwen
* DeepSeek
* Llama
* Mistral

AWS also lets you switch models without rewriting the complete application. ([AWS Documentation][1])

Bedrock supports function/tool calling. Your app sends tool definitions, the model requests a tool, your application executes it, and the tool result is sent back to produce the final answer. Tool use is available through the Chat Completions, Converse and InvokeModel APIs, depending on the selected model. ([AWS Documentation][2])

## Best model for the fallback

Start with:

```text
openai.gpt-oss-120b-1:0
```

Why:

* Same 128K context as the Workers AI version.
* Suitable for production and reasoning.
* Supports the OpenAI Chat Completions API on Bedrock.
* Uses almost the same request format you just implemented for IPI-525. ([AWS Documentation][3])

That means your existing types can mostly be reused:

```text
messages
tools
tool_choice
tool_calls
tool_call_id
stream
```

## Important implementation choice

Bedrock offers two integration paths.

### Option A — OpenAI-compatible Bedrock endpoint

Best for your gateway because PR #333 already uses the OpenAI format.

```text
Cloudflare Worker
→ Bedrock OpenAI-compatible endpoint
→ openai.gpt-oss-120b-1:0
```

AWS documents an OpenAI-compatible endpoint and states that it uses an Amazon Bedrock API key for authentication. ([AWS Documentation][3])

**Recommendation: use this first.**

### Option B — Bedrock Converse API

Best when you later want:

* Amazon Nova
* Claude
* broader model selection
* AWS-native tool configuration
* Bedrock Guardrails

But it requires translating your OpenAI messages and tools into Bedrock’s Converse format.

```text
OpenAI tools
→ Bedrock ToolConfiguration
→ toolUse response
→ toolResult
```

This is more work.

## Changes needed in the gateway

Add a Bedrock provider:

```text
services/cloudflare-worker/src/providers/bedrock.ts
```

Expand the provider type:

```ts
export interface ModelEntry {
  provider: "workers-ai" | "bedrock";
  model: string;
  capabilities: string[];
}
```

Add environment variables:

```text
AWS_BEDROCK_API_KEY
AWS_BEDROCK_REGION
AWS_BEDROCK_BASE_URL
```

Example registry:

```json
{
  "tiers": {
    "default": {
      "provider": "workers-ai",
      "model": "@cf/openai/gpt-oss-120b",
      "capabilities": ["text", "tools", "streaming"]
    },
    "default-fallback": {
      "provider": "bedrock",
      "model": "openai.gpt-oss-120b-1:0",
      "capabilities": ["text", "tools", "streaming"]
    }
  }
}
```

## Fallback logic

```ts
try {
  return await workersAiProvider.chat(request, workersConfig);
} catch (error) {
  if (!isRetryableProviderError(error)) {
    throw error;
  }

  return bedrockProvider.chat(request, bedrockConfig);
}
```

Fallback only for failures such as:

* `429` rate limit
* `500–504` provider error
* timeout
* unavailable model

Do **not** automatically retry on:

* invalid tool schema
* invalid request
* authentication errors
* permission errors

Those are configuration problems, not temporary failures.

## What to do with the Gemini test

The Gemini test should be removed from PR #333 if Gemini is no longer part of the architecture.

Replace:

```text
Gemini tool guards
Gemini fallback tests
```

with:

```text
Bedrock fallback tests
```

Test:

```text
Workers AI returns 503
→ gateway retries through Bedrock
→ Bedrock returns tool_calls
→ tool result is sent
→ final answer succeeds
```

## Suggested new task

**IPI-526 · CF-AI-012 — AWS Bedrock Provider Fallback**

Acceptance criteria:

```text
□ Add Bedrock provider adapter
□ Use Bedrock OpenAI-compatible Chat Completions endpoint
□ Support tools and tool_choice
□ Support streaming
□ Add retryable-error classification
□ Workers AI remains primary
□ Bedrock is used only on retryable failure
□ Log primary provider failure and fallback provider
□ Add unit tests
□ Add live smoke test
□ Remove Gemini fallback configuration
```

## Recommended model routing

| Use case           | Primary                     | Fallback                      |
| ------------------ | --------------------------- | ----------------------------- |
| Marketing chat     | Workers AI small/fast model | Bedrock GPT OSS 20B           |
| Booking agent      | Workers AI GPT OSS 120B     | Bedrock GPT OSS 120B          |
| Production planner | Workers AI GPT OSS 120B     | Bedrock GPT OSS 120B          |
| Heavy reasoning    | Workers AI GPT OSS 120B     | Bedrock Qwen or Claude        |
| Vision             | Workers AI vision model     | Bedrock Nova or Claude vision |

## Bottom line

Your corrected target should be:

```text
Cloudflare Workers AI = primary
AWS Bedrock = fallback
Gemini = remove
```

This is cleaner because both Workers AI and Bedrock can use OpenAI-compatible requests for GPT OSS models, allowing the gateway to reuse the tool-calling work from PR #333 instead of maintaining a separate Gemini message converter.

[1]: https://docs.aws.amazon.com/bedrock/latest/userguide/conversation-inference-supported-models-features.html "Models at a glance - Amazon Bedrock"
[2]: https://docs.aws.amazon.com/bedrock/latest/userguide/tool-use.html "Use a tool to complete an Amazon Bedrock model response - Amazon Bedrock"
[3]: https://docs.aws.amazon.com/bedrock/latest/userguide/model-parameters-openai.html "OpenAI models - Amazon Bedrock"
