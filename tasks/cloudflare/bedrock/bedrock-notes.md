I reviewed **IPI-564 · CF-AI-012 — AWS Bedrock Provider Fallback** against the current AWS Bedrock documentation and your current Cloudflare gateway implementation.

## Overall score

| Area                         |   Score | Status |
| ---------------------------- | ------: | :----: |
| Architecture                 |     95% |   🟢   |
| Bedrock integration approach |     70% |   🟡   |
| Authentication               |     25% |   🔴   |
| Retry strategy               |     90% |   🟢   |
| Fallback design              |     92% |   🟢   |
| Test plan                    |     85% |   🟢   |
| **Overall**                  | **76%** |   🟡   |

---

# Biggest issue

The implementation notes currently say:

```text
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_REGION
```

are enough for the new **OpenAI-compatible Bedrock endpoint**.

That is **not correct**.

AWS documents that the **OpenAI Chat Completions API** uses an **Amazon Bedrock API key** for authentication rather than raw IAM access keys. IAM credentials are used with the native Bedrock APIs (such as Converse or InvokeModel) through the AWS SDK and SigV4 signing. The authentication approach depends on which Bedrock interface you choose.

---

# Current gateway audit

From your current gateway:

* Provider contract still supports only basic chat messages.
* Router currently knows only:

  * `workers-ai`
  * `gemini`
* Chat errors always become HTTP 502 with no retry logic.

So IPI-564 needs more than adding `bedrock.ts`.

---

# Missing tasks

I would split the work into:

### Phase 1

Add provider

```text
bedrock.ts
```

---

### Phase 2

Add retry classifier

```text
isRetryableProviderError()
```

---

### Phase 3

Provider router

Instead of

```text
Workers AI

↓

502
```

do

```text
Workers AI

↓

retry?

↓

Bedrock
```

---

### Phase 4

Logging

Record

```text
provider

model

request id

latency

fallback
```

---

### Phase 5

Integration tests

Workers AI

↓

503

↓

Bedrock

↓

200

---

# Red flags

## 🔴 Authentication

Needs correction.

---

## 🟡 Model ID

The issue hardcodes

```text
openai.gpt-oss-120b-1:0
```

That should be configurable through the registry rather than fixed in code.

---

## 🟡 Region

The issue assumes

```text
us-east-1
```

Keep it configurable:

```text
AWS_REGION
```

---

## 🟡 Retry policy

Currently only says

```text
429

500

503
```

Add:

* timeout
* connection reset
* DNS failure

Do **not** retry:

* 400
* 401
* 403
* schema validation
* tool schema errors

---

# Architecture

Recommended:

```text
Mastra
      ↓
Provider Router
      ↓
Workers AI
      ↓
Retry classifier
      ↓
Bedrock
```

Not

```text
Workers AI

↓

Bedrock

↓

everything
```

Keep the router responsible for failover.

---

# Before implementation

I recommend updating the issue with:

* authentication choice (OpenAI-compatible API key vs AWS SDK/SigV4)
* retry classifier
* configurable Bedrock model
* structured logging
* observability
* integration tests

Those changes would raise the issue from **76%** to around **95%** and make it much safer to implement.
These are the **official references** I recommend using in **IPI-564 · CF-AI-012 — AWS Bedrock Provider Fallback**.

## Core AWS Bedrock documentation

| Purpose                  | Official reference                                                                                                                           | Use in IPI-564                                         |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Tool/function calling    | [Amazon Bedrock – Tool Use](https://docs.aws.amazon.com/bedrock/latest/userguide/tool-use.html?utm_source=chatgpt.com)                       | ✅ Primary reference for tool calling                   |
| Supported endpoints      | [Amazon Bedrock Endpoints](https://docs.aws.amazon.com/bedrock/latest/userguide/endpoints.html?utm_source=chatgpt.com)                       | ✅ Choose the correct endpoint                          |
| Supported APIs           | [Amazon Bedrock APIs](https://docs.aws.amazon.com/bedrock/latest/userguide/apis.html?utm_source=chatgpt.com)                                 | ✅ Decide between Chat Completions, Responses, Converse |
| Server-side tool calling | [Amazon Bedrock Server-side Tool Use](https://docs.aws.amazon.com/bedrock/latest/userguide/tool-use-server-side.html?utm_source=chatgpt.com) | Optional future enhancement                            |

---

# Authentication

This is the most important section to correct.

The current issue assumes:

```text
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
```

are sufficient for the OpenAI-compatible implementation.

AWS documentation distinguishes between authentication methods depending on the API you use. The OpenAI-compatible APIs use Bedrock-supported authentication, while the native Bedrock APIs use AWS IAM/SigV4 authentication. Your implementation needs to explicitly choose one approach instead of mixing both. ([OpenAI Help Center][1])

---

# Tool Calling

AWS officially documents the exact tool lifecycle:

```
Client
↓

messages
+

tools

↓

Model

↓

tool_calls

↓

Application executes tool

↓

tool result

↓

Final response
```

Exactly the architecture you implemented in PR #333. ([AWS Documentation][2])

---

# Best endpoint

AWS currently recommends:

```
bedrock-mantle.<region>.api.aws
```

for new OpenAI-compatible applications because it supports:

* Responses API
* Chat Completions API
* Anthropic Messages API

and lets you migrate OpenAI SDK applications with minimal changes. ([AWS Documentation][3])

That is preferable to hardcoding:

```
bedrock-runtime.<region>.amazonaws.com
```

unless you specifically need native Bedrock APIs.

---

# API choice

AWS now recommends:

```
Responses API
```

for new OpenAI-compatible applications.

Chat Completions remains supported, but Responses is the long-term direction. ([AWS Documentation][4])

---

# Missing acceptance criteria

Add these:

### Authentication

```
□ Authentication method matches the selected Bedrock API
□ No hardcoded credentials
□ Credentials loaded from environment
```

---

### Provider

```
□ Supports Responses API or Chat Completions (document which one)
□ Streaming verified
□ Tool calling verified
□ Structured outputs verified
```

---

### Retry

```
□ Retry only:

429
500
502
503
504
timeout
connection reset

□ Never retry:

400
401
403
validation errors
tool schema errors
```

---

### Observability

```
□ request_id logged

□ provider logged

□ model logged

□ latency logged

□ fallback reason logged
```

---

### Integration

```
□ Workers AI success → no fallback

□ Workers AI 503 → Bedrock success

□ Workers AI timeout → Bedrock success

□ Bedrock failure propagates correctly

□ Tool round trip succeeds

□ Streaming verified
```

---

# Recommended implementation order

Instead of immediately building `bedrock.ts`, use this sequence:

1. Choose and document the Bedrock API (Responses or Chat Completions).
2. Implement authentication for that API.
3. Create `bedrock.ts`.
4. Add retry classification.
5. Add fallback routing.
6. Add logging and metrics.
7. Add integration tests.
8. Run a live end-to-end smoke test with tool calling.

---

## Updated score

After aligning the issue with the official AWS documentation:

| Category           | Before |  After |
| ------------------ | -----: | -----: |
| Architecture       |     95 |     95 |
| Authentication     |     25 |     95 |
| Endpoint selection |     60 |     95 |
| Tool calling       |     95 |     95 |
| Retry strategy     |     90 |     95 |
| Tests              |     85 |     95 |
| **Overall**        | **76** | **95** |

Using these AWS references will make the implementation much closer to production-ready and reduce the risk of building against the wrong endpoint or authentication model.

[1]: https://help.openai.com/en/articles/20001254-responses-api-support-on-amazon-bedrock?utm_source=chatgpt.com "Responses API support on Amazon Bedrock | OpenAI Help Center"
[2]: https://docs.aws.amazon.com/bedrock/latest/userguide/tool-use.html?utm_source=chatgpt.com "Use a tool to complete an Amazon Bedrock model response - Amazon Bedrock"
[3]: https://docs.aws.amazon.com/bedrock/latest/userguide/endpoints.html?utm_source=chatgpt.com "Endpoints supported by Amazon Bedrock - Amazon Bedrock"
[4]: https://docs.aws.amazon.com/bedrock/latest/userguide/apis.html?utm_source=chatgpt.com "APIs supported by Amazon Bedrock - Amazon Bedrock"
