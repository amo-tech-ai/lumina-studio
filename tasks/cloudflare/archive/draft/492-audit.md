# Audit verdict

**IPI-492 · CF-AI-004c — Harden AI Gateway Embed & Error Contracts** is well scoped and should succeed, but several acceptance criteria need tightening before implementation.

**Specification correctness: 86/100**
**Production readiness after completing this task alone: about 72/100** because deployment, authentication, AC-F, and AC-J remain separate.

Cloudflare officially supports OpenAI-compatible `/v1/embeddings`, where requests contain a model and either a string or collection of text inputs. Its documented BGE Base model returns 768-dimensional vectors and supports batching. ([Cloudflare Docs][1])

## Scorecard

| Area                    |  Score | Status |
| ----------------------- | -----: | :----: |
| Problem definition      | 95/100 |   🟢   |
| Scope discipline        | 94/100 |   🟢   |
| Validation design       | 82/100 |   🟡   |
| HTTP/error semantics    | 70/100 |   🟡   |
| Model-routing safety    | 76/100 |   🟡   |
| Tests and runtime proof | 90/100 |   🟢   |
| Future compatibility    | 78/100 |   🟡   |

---

# What is correct

## 🟢 1. Empty input should be rejected before provider invocation

This is the correct design.

An empty array or blank string is a caller-validation problem, not an upstream-provider failure. It should not become a gateway 502.

Recommended response:

```json
{
  "error": {
    "code": "invalid_request",
    "message": "input must contain at least one non-empty string"
  }
}
```

Recommended HTTP status:

```text
400 Bad Request
```

## 🟢 2. Embedding requests should use an embedding-capable model

Cloudflare documents its embedding endpoint using an explicit embedding model such as `@cf/baai/bge-large-en-v1.5`; the BGE Base model currently used by iPix produces 768-dimensional vectors and accepts strings or arrays. ([Cloudflare Docs][1])

A Gemini chat model such as `gemini-3.1-flash-lite` is therefore invalid for the current Workers AI embedding route.

## 🟢 3. One-concern PR boundary is strong

The exclusions are correct:

* no Mastra `resolveModel()` work;
* no AC-F;
* no production deployment;
* no Gemini embedding implementation;
* no registry rewrite;
* no documentation-only work.

That makes the change easier to review and reduces regression risk.

## 🟢 4. Local runtime verification is appropriate

The proposed gate is correct:

```text
adapter
→ local AI Gateway Worker
→ Workers AI BGE
→ 768-dimensional vectors
```

Cloudflare’s official BGE Base documentation confirms the expected output dimension is 768. ([Cloudflare Docs][2])

---

# Critical fixes required before implementation

## 🔴 1. Choose rejection, not silent remapping

Acceptance criterion B currently permits either:

* reject the wrong model; or
* silently remap it to `embedding`.

**Use rejection.**

Silent remapping hides caller bugs. An engineer explicitly passing:

```ts
embed(["hello"], { model: "gemini-3.1-flash-lite" })
```

should receive a clear error rather than unknowingly using a different provider and model.

Recommended contract:

```json
{
  "error": {
    "code": "unsupported_embedding_model",
    "message": "Model 'gemini-3.1-flash-lite' is not configured for embeddings"
  }
}
```

HTTP:

```text
400 Bad Request
```

This also prevents unexpected changes in vector dimensions, cost, quality, and embedding space.

---

## 🔴 2. Do not detect invalid models by looking for `gemini` in the name

The task says:

> Detect Gemini chat model IDs.

That approach is brittle.

Google currently has dedicated embedding models such as `gemini-embedding-2` and `gemini-embedding-001`. Therefore, a rule such as `model.startsWith("gemini")` would incorrectly reject legitimate future Gemini embedding support. Google documents that chat and embedding models are distinct, and that its current embedding endpoint uses dedicated embedding model IDs. ([Google AI for Developers][3])

### Better rule

Validate against an embedding allowlist or capability registry:

```ts
const SUPPORTED_EMBEDDING_MODELS = new Set([
  "embedding",
  "@cf/baai/bge-base-en-v1.5",
]);
```

Or:

```ts
modelRegistry.resolve(model)?.capabilities.embeddings === true
```

For this task, the small explicit allowlist is safer because registry unification is out of scope.

---

## 🔴 3. Acceptance criterion C is too broad

This wording is risky:

> Provider failures preserve upstream status when possible.

Blindly forwarding provider statuses is not always correct.

Examples:

* provider `401` may indicate an internal server credential problem—it must not imply that the end user needs to authenticate;
* provider `403` could reveal infrastructure policy;
* provider error bodies might expose account IDs, model details, internal URLs, or sensitive diagnostics;
* provider `400` can represent a gateway translation bug, not necessarily invalid client input.

### Correct status policy

| Failure source                             |                                   Gateway status |
| ------------------------------------------ | -----------------------------------------------: |
| Invalid client input                       |                                              400 |
| Unsupported model or capability            |                                              400 |
| Gateway authentication failure from caller |                                       401 or 403 |
| Upstream rate limit                        | 429, optionally with sanitized retry information |
| Upstream timeout                           |                                              504 |
| Upstream unavailable                       |                                              503 |
| Upstream malformed/error response          |                                              502 |
| Internal gateway error                     |                                              500 |

Preserve the upstream status in metadata only when safe:

```json
{
  "error": {
    "code": "provider_unavailable",
    "message": "Embedding provider is temporarily unavailable",
    "providerStatus": 503,
    "retryable": true,
    "requestId": "..."
  }
}
```

Do not expose raw provider response bodies to clients.

---

## 🔴 4. Validation must cover more than `input: []`

Acceptance criterion A currently names:

* empty array;
* empty string.

It should also reject:

```ts
"   "
[""]
["   "]
["valid", ""]
null
{}
[123]
```

Recommended normalization rule:

```ts
function validateEmbeddingInput(
  input: unknown,
): string | string[] {
  if (typeof input === "string") {
    if (!input.trim()) throw invalidInput();
    return input;
  }

  if (
    Array.isArray(input) &&
    input.length > 0 &&
    input.every(
      value => typeof value === "string" && value.trim().length > 0,
    )
  ) {
    return input;
  }

  throw invalidInput();
}
```

Whether mixed blank/nonblank arrays should be rejected or filtered must be explicit. **Reject the whole request**—silent filtering changes positional correspondence between inputs and output vectors.

---

# Red flags and possible failure points

## 🟡 1. Duplicated validation between adapter and Worker

The issue says:

> Worker preferred; adapter may short-circuit too.

Duplicating rules can create drift:

```text
Adapter accepts request
Worker rejects request
```

or:

```text
Adapter rejects something Worker supports
```

### Recommended ownership

* **Worker:** canonical validation and HTTP error contract.
* **Adapter:** optional immediate validation for developer ergonomics, using the same shared helper only if sharing does not create architecture coupling.
* **Tests:** Worker contract is authoritative.

For this PR, Worker validation alone is enough. Adapter tests should confirm it parses the Worker’s structured error correctly.

---

## 🟡 2. Error code names are underspecified

The specification provides `invalid_request`, but does not define the complete set.

Add a small stable union:

```ts
type GatewayErrorCode =
  | "invalid_request"
  | "unsupported_embedding_model"
  | "provider_rate_limited"
  | "provider_timeout"
  | "provider_unavailable"
  | "provider_error"
  | "internal_error";
```

Without this, each provider handler may invent different codes.

---

## 🟡 3. Adapter behavior on structured errors is missing

The Worker may return excellent JSON, but the adapter currently may still throw a flat message like:

```text
embedding failed: 400 {"error":{...}}
```

AC-C should define what `createProviderAdapter().embed()` does.

Recommended typed exception:

```ts
class AiGatewayError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
    readonly providerStatus?: number,
    readonly retryable = false,
    readonly requestId?: string,
  ) {
    super(message);
  }
}
```

Then callers can distinguish:

```ts
error.code === "invalid_request"
```

from:

```ts
error.code === "provider_unavailable"
```

without parsing an error string.

This is one of the most important missing requirements.

---

## 🟡 4. Model aliases need clear rules

The happy path currently uses:

```json
{"model":"embedding"}
```

Cloudflare’s native OpenAI-compatible API expects a real model ID such as `@cf/baai/bge-base-en-v1.5`. The custom iPix Worker can legitimately translate `embedding` into that model, but this alias contract must be explicit. Cloudflare’s documented native request uses the full model identifier. ([Cloudflare Docs][1])

Define:

```text
embedding
→ internal stable tier alias
→ @cf/baai/bge-base-en-v1.5
```

Do not let callers assume `embedding` is a Cloudflare-native model name.

---

## 🟡 5. Maximum batch and input limits are missing

The BGE Base model has a 512-token maximum input and supports batch requests. ([Cloudflare Docs][2])

The task does not specify:

* maximum input array length;
* maximum characters/tokens per item;
* total request-body size;
* behavior for excessive batches.

At minimum, add a conservative gateway limit:

```ts
const MAX_EMBED_INPUTS = 100;
```

Return:

```json
{
  "error": {
    "code": "invalid_request",
    "message": "input may contain at most 100 items"
  }
}
```

Token-level checking can remain out of scope, but body and batch limits should not be omitted entirely.

---

## 🟡 6. Gemini support wording is inaccurate

The proposed SSOT statement says:

> Gemini embeddings remain unsupported.

That sounds like Gemini itself does not support embeddings. It does. Google currently documents dedicated models including `gemini-embedding-2` and `gemini-embedding-001`. ([Google AI for Developers][3])

Use:

> The iPix AI Gateway currently supports Workers AI BGE for embeddings. Gemini embedding routing is not implemented in this gateway.

That accurately describes the application boundary rather than the provider’s capabilities.

---

## 🟡 7. Upstream error redaction is not included

Provider errors may contain:

* API endpoint information;
* model names;
* internal diagnostics;
* request fragments;
* Cloudflare account identifiers.

Add:

* sanitized client message;
* detailed server-side structured log;
* request ID linking the two;
* no API keys or raw authorization headers.

---

# Missing acceptance criteria

Add these requirements.

## F — Whitespace and malformed input

```text
Reject empty, whitespace-only, malformed, mixed-invalid, null, and non-string input.
```

## G — Stable adapter exception

```text
createProviderAdapter().embed() converts the gateway error envelope into a typed AiGatewayError without requiring JSON-string parsing by callers.
```

## H — No provider call on validation failure

The test should prove that Workers AI/Gemini fetch mocks were not invoked:

```ts
expect(providerFetch).not.toHaveBeenCalled();
```

## I — Error redaction

```text
Raw provider bodies, credentials, account IDs, and authorization headers are never returned to the client.
```

## J — Request correlation

Return or log a request ID:

```json
{
  "error": {
    "code": "invalid_request",
    "message": "...",
    "requestId": "req_..."
  }
}
```

A correlation ID is particularly valuable once AC-J runs through Next.js, Mastra, Gateway Worker, and a provider.

---

# Recommended revised acceptance criteria

| AC | Revised requirement                                                                                                     |
| -- | ----------------------------------------------------------------------------------------------------------------------- |
| A  | Reject empty, whitespace-only, malformed or empty-array inputs with HTTP 400 before provider invocation                 |
| B  | Reject every model that is not explicitly embedding-capable; do not silently remap explicit overrides                   |
| C  | Return one sanitized, stable error envelope with code, message, optional provider status, retryable flag and request ID |
| D  | Convert gateway errors into a typed adapter error                                                                       |
| E  | Test invalid input, unsupported model, no provider call, upstream 429/5xx, malformed provider response and happy path   |
| F  | Live Wrangler proves default embed gives 768 dimensions, invalid input gives 400 and explicit chat model gives 400      |
| G  | Chat, structured and streaming smoke tests remain green                                                                 |
| H  | No AC-F, Mastra, deployment, Gemini embedding implementation or registry redesign enters the PR                         |

---

# Recommended tests

## Worker tests

```text
input: []                         → 400 invalid_request
input: ""                         → 400 invalid_request
input: "   "                      → 400 invalid_request
input: [""]                       → 400 invalid_request
input: ["valid", ""]              → 400 invalid_request
input: null                       → 400 invalid_request
input: [123]                      → 400 invalid_request
unsupported explicit model        → 400 unsupported_embedding_model
model: "embedding", valid string  → 200
model: "embedding", valid array   → 200
provider 429                      → stable sanitized error
provider 500                      → stable sanitized error
```

For every client-validation case:

```ts
expect(workersAiFetch).not.toHaveBeenCalled();
expect(geminiFetch).not.toHaveBeenCalled();
```

## Adapter tests

```text
400 envelope → typed invalid_request error
400 unsupported model → typed unsupported_embedding_model
429 → retryable true
502/503 → provider error, sanitized
valid array → vector order preserved
```

## Live tests

```bash
# Empty
curl ... -d '{"model":"embedding","input":[]}'
# expect HTTP 400

# Whitespace
curl ... -d '{"model":"embedding","input":"   "}'
# expect HTTP 400

# Wrong model
curl ... -d '{"model":"gemini-3.1-flash-lite","input":"hello"}'
# expect HTTP 400

# Good
curl ... -d '{"model":"embedding","input":["hello"]}'
# expect HTTP 200 and 768 dimensions
```

---

# Recommended implementation decision

## Model handling

```text
No explicit model
→ use "embedding" tier alias

Explicit "embedding"
→ resolve to Workers AI BGE

Explicit known Workers AI embedding model
→ allow if desired

Any chat/vision/unknown model
→ 400 unsupported_embedding_model
```

## Error handling

```text
Client validation failure
→ 400

Provider rate limit
→ 429 or sanitized gateway 429

Provider timeout
→ 504

Provider unavailable
→ 503

Unexpected provider response
→ 502

Internal gateway bug
→ 500
```

---

# Blockers

| Blocker                                      | Severity    | Notes                                 |
| -------------------------------------------- | ----------- | ------------------------------------- |
| No decision between rejection and remapping  | 🔴 Critical | Choose rejection                      |
| AC-C can cause unsafe status passthrough     | 🔴 Critical | Define mapping policy                 |
| No typed adapter error                       | 🔴 Critical | Otherwise callers still parse strings |
| Model detection may use Gemini-name matching | 🟠 High     | Use capability allowlist              |
| No malformed/whitespace validation           | 🟠 High     | Empty array alone is insufficient     |
| No proof provider is skipped                 | 🟠 High     | Add mock call assertions              |
| No redaction policy                          | 🟠 High     | Prevent internal detail leakage       |
| No batch/input limits                        | 🟡 Medium   | Add basic bound                       |
| Gemini SSOT wording inaccurate               | 🟡 Medium   | Clarify iPix implementation scope     |

---

# Final evaluation

| Question                                          | Answer                                                              |
| ------------------------------------------------- | ------------------------------------------------------------------- |
| Is the task needed?                               | 🟢 Yes                                                              |
| Is the scope appropriate?                         | 🟢 Yes                                                              |
| Can it be one PR?                                 | 🟢 Yes                                                              |
| Is the current error contract complete?           | 🔴 No                                                               |
| Should wrong models be remapped?                  | 🔴 No—reject explicit invalid overrides                             |
| Should raw upstream statuses always be preserved? | 🔴 No—map and sanitize                                              |
| Is Workers AI BGE the correct current default?    | 🟢 Yes                                                              |
| Is Gemini incapable of embeddings?                | 🔴 No; iPix simply has not implemented that route                   |
| Will the task succeed as written?                 | 🟡 Probably, but it may leave callers parsing opaque thrown strings |
| Specification correctness                         | **86/100**                                                          |
| Correctness after critical revisions              | **96/100**                                                          |

The highest-priority changes are: **choose rejection, use an embedding-capability allowlist, define a safe status mapping, and require a typed adapter error contract.**

---

# MCP verification stamp — 2026-07-10 · task-verifier + cloudflare-docs

| Audit claim | Classification | Evidence |
|-------------|----------------|----------|
| OpenAI-compat `/v1/embeddings` exists | ✅ Confirmed | Cloudflare docs MCP — Workers AI OpenAI compatibility |
| BGE Base → 768-d, 512 max tokens, batch yes | ✅ Confirmed | [bge-base-en-v1.5](https://developers.cloudflare.com/workers-ai/models/bge-base-en-v1.5/) |
| Reject empty input before provider | ✅ Confirmed needed | `router.ts` `handleEmbed` has no input guard; catch → **502** |
| Reject wrong model (not remap) | ✅ Confirmed correct | Silent remap hides bugs; dims/cost/space change |
| Do not use `gemini*` name detect | ✅ Confirmed correct | Future Gemini embed IDs exist; allowlist safer |
| Blind upstream status passthrough unsafe | ✅ Confirmed correct | Gateway auth ≠ client auth |
| Typed adapter error needed | ✅ Confirmed | Adapter `assertOk` throws flat strings today |
| `MAX_EMBED_INPUTS = 100` | 🟡 Unproven as CF hard limit | Docs say batch yes, no published max of 100 — OK as **gateway policy** |
| Unknown model falls to default chat | ✅ Confirmed root cause | `selectProvider`: `resolveModelEntry(model) ?? resolveModelEntry("default")` then Gemini `embed` → 404 |
| Gemini “cannot embed” wording | ✅ Confirmed inaccurate | Prefer “iPix routing not implemented” |
| Scope / one-concern | ✅ Confirmed | Matches AGENTS.md #1 |

**Audit doc score (this run):** Spec claims **92/100** after MCP (was 86 as written).  
**IPI-492 execution readiness:** 🛑 Not ready until Linear ACs lock rejection + allowlist + typed error (updated in Linear this run).  
**Skill adapted:** `.opencode/skills/cloudflare-workflow` — embed/error gate + checklist §2.1 + Outcome Grader row.

**Not this audit:** [IPI-404 · SCR-08 Assets](https://linear.app/amo100/issue/IPI-404/scr-08-assets-library-read-only-masonry) is DESIGN V2 UI — Cloudflare MCP N/A; use `design-to-production` / SCR DoR separately.

[1]: https://developers.cloudflare.com/workers-ai/configuration/open-ai-compatibility/ "OpenAI compatible API endpoints · Cloudflare Workers AI docs"
[2]: https://developers.cloudflare.com/workers-ai/models/bge-base-en-v1.5/ "bge-base-en-v1.5 (BAAI) · Cloudflare AI docs · Cloudflare Workers AI docs"
[3]: https://ai.google.dev/gemini-api/docs/embeddings "Embeddings  |  Gemini API  |  Google AI for Developers"
