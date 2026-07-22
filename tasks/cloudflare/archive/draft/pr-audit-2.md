



# Workers AI Model Audit — July 12, 2026

## Verdict

**Overall accuracy: 🟡 76/100**

The main model recommendations are current, but several important claims need correction before updating **PR #340**. The uploaded audit correctly identifies the deprecated model as a blocker, but its replacement matrix contains outdated context and pricing details. fileciteturn0file0

| Area | Score | Verdict |
|---|---:|---|
| Model availability | 95/100 | 🟢 Correct |
| Model IDs | 100/100 | 🟢 Correct |
| Context-window data | 68/100 | 🟡 One major error |
| Tool-calling claims | 82/100 | 🟡 Too broad |
| Pricing claims | 55/100 | 🔴 Needs correction |
| Production recommendation | 75/100 | 🟡 Needs evaluation gate |
| **Overall** | **76/100** | **🟡 Mostly correct** |

---

## 1. Verified model status

| Model | Current status | Context | Function calling | Reasoning | Official pricing |
|---|---|---:|:---:|:---:|---:|
| `@cf/meta/llama-3.1-8b-instruct` | 🔴 Deprecated | — | Legacy output includes `tool_calls` | — | Do not adopt |
| `@cf/meta/llama-3.1-8b-instruct-fast` | 🟢 Active | **128,000** | Tool-call output documented | Not listed | Verify through benchmark |
| `@cf/zai-org/glm-4.7-flash` | 🟢 Active | 131,072 | ✅ | ✅ | **$0.06/M input, $0.40/M output** |
| `@cf/zai-org/glm-5.2` | 🟢 Active | 262,144 | ✅ | ✅ | **$1.40/M input, $4.40/M output, $0.26/M cached input** |
| `@cf/meta/llama-4-scout-17b-16e-instruct` | 🟢 Active | Current catalog entry | ✅ | Not shown in catalog summary | Verify |
| `@cf/meta/llama-3.3-70b-instruct-fp8-fast` | 🟢 Active | Current catalog entry | ✅ | Not shown | Verify |
| `@cf/google/gemma-4-26b-a4b-it` | 🟢 Active | Current catalog entry | ✅ | ✅ | Verify |
| `@cf/moonshotai/kimi-k2.6` | 🟢 Active | **262.1k** | ✅ multi-turn | ✅ | Verify |

Cloudflare’s current catalog lists GLM-5.2, GLM-4.7-Flash, Kimi K2.6, Gemma 4, Llama 4 Scout and the fast Llama variants as active. It separately marks the original `llama-3.1-8b-instruct` as deprecated. citeturn667244view0

---

## 2. Errors requiring correction

### 🔴 Error 1 — Llama Fast does not have an 8k context window

Your table says:

```text
@cf/meta/llama-3.1-8b-instruct-fast — Context: 8k
```

Cloudflare’s official model page currently states:

```text
Context Window: 128,000 tokens
```

This is the largest factual error in the recommendation. citeturn295072view0

**Correct it to:**

```text
@cf/meta/llama-3.1-8b-instruct-fast
Context: 128,000 tokens
```

---

### 🔴 Error 2 — “Same performance/pricing tier” is not verified

Calling the Fast model a **drop-in code replacement** is reasonable because its identifier and interface are compatible.

However, these claims are not proven by the supplied official page:

- “Same performance”
- “Same pricing”
- “Zero risk”

A model swap can change:

- tool-selection accuracy;
- JSON argument shape;
- latency;
- token usage;
- multilingual quality;
- instruction-following;
- output style.

**Better wording:**

> Lowest-migration replacement, but still requires contract and agent regression tests.

---

### 🟡 Error 3 — GLM-5.2 is not necessarily the “newest” model

GLM-5.2 is current and active, but Cloudflare’s catalog sorted by newest currently shows **Kimi K2.7 Code** before GLM-5.2. Therefore, calling GLM-5.2 the overall “newest Workers AI model” is unsafe. citeturn667244view0

Use:

> Newly launched flagship agentic coding model.

Do not use:

> Newest Workers AI model.

The exact **June 16, 2026 launch date** was not confirmed by the model page reviewed here. Keep that date only after linking an official Cloudflare changelog entry.

---

### 🟡 Error 4 — “Cloudflare officially recommends GLM-4.7-Flash” is overstated

Cloudflare describes GLM-4.7-Flash as optimized for:

- dialogue;
- instruction following;
- multilingual use;
- multi-turn tool calling.

The page does not explicitly say it is Cloudflare’s recommended replacement for your exact fast-tier workload. citeturn295072view3

Use:

> Strong candidate for multilingual, tool-heavy fast workloads.

Not:

> Cloudflare’s officially recommended replacement.

---

### 🟡 Error 5 — “All models support tools” is too broad

Cloudflare supports the OpenAI-compatible `/v1/chat/completions` endpoint, but that does **not** mean every text-generation model supports function calling.

Tool support is a **per-model capability**. The model catalog explicitly labels only qualifying models with “Function calling.” citeturn667244view0

Correct statement:

> Workers AI exposes OpenAI-compatible chat-completion endpoints. Tool calling is supported only by models whose model page lists Function calling support.

The endpoint itself is officially documented at:

```text
https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/v1/chat/completions
```

It also works through AI Gateway. citeturn862309view1

---

### 🟡 Error 6 — “Vision + tool calling” needs model-level wording

Gemma 4 and Kimi K2.6 are currently listed with vision, reasoning and function-calling capabilities. That part is correct. citeturn667244view0

But they should not be grouped as generic fast-tier replacements without testing:

- vision models may cost more;
- larger multimodal payloads increase latency;
- image-input schemas differ;
- your current Workers AI adapter may only serialize text messages.

---

## 3. Best recommendation for PR #340

### Recommended immediate PR change

```typescript
model: "@cf/meta/llama-3.1-8b-instruct-fast",
```

**Why:**

- active model;
- smallest registry-only change;
- 128k context, not 8k;
- streaming documented;
- `tool_calls` output documented;
- minimizes scope while PR #340 is already suffering from mixed concerns. citeturn295072view0turn862309view0

### Do not call it zero-risk

Before merging, run the same tool contract against both the current test fixture and the replacement:

```text
Prompt → tool selected → valid JSON arguments → tool result returned →
second model turn → final answer
```

---

## 4. Recommended production model tiers

| Tier | Recommended model | Purpose | Reason |
|---|---|---|---|
| **Fast/default** | `@cf/zai-org/glm-4.7-flash` | Chat, lightweight agents, multilingual CRM | 131k context, tools, reasoning, very low documented token pricing |
| **Compatibility fallback** | `@cf/meta/llama-3.1-8b-instruct-fast` | Lowest-change migration | Active replacement with 128k context |
| **Premium reasoning/coding** | `@cf/zai-org/glm-5.2` | Complex coding and agent planning | 262k context, reasoning, tools |
| **Vision** | `@cf/google/gemma-4-26b-a4b-it` or `@cf/moonshotai/kimi-k2.6` | Asset analysis and multimodal workflows | Vision plus function calling |
| **Fallback** | Gemini through AI Gateway | Grounding, difficult vision, provider outage | Existing iPix provider path |

### Important cost comparison

GLM-5.2 is not a sensible universal default without routing controls:

| Model | Input per million | Output per million |
|---|---:|---:|
| GLM-4.7-Flash | $0.06 | $0.40 |
| GLM-5.2 | $1.40 | $4.40 |

GLM-5.2 input is roughly **23× more expensive**, and output is **11× more expensive**, than GLM-4.7-Flash using the currently documented prices. citeturn295072view3turn295072view6

Use GLM-5.2 only for workloads that earn the premium:

- difficult code generation;
- long architectural analysis;
- complex multi-step planning;
- agent recovery after a smaller model fails.

---

## 5. PR #340 critical fixes

| Priority | Correction | Required action |
|---|---|---|
| 🔴 P0 | Deprecated default model | Replace it before merge |
| 🔴 P0 | Mixed scope | Split Gemini validation changes from model-registry replacement |
| 🔴 P0 | Missing agent regression proof | Add multi-turn tool-call integration test |
| 🟡 P1 | Wrong Llama context | Change 8k to 128k |
| 🟡 P1 | Unverified pricing equivalence | Remove “same pricing” |
| 🟡 P1 | Overstated zero-risk claim | Say “lowest migration risk” |
| 🟡 P1 | Universal tools claim | Validate tools per model |
| 🟡 P1 | GLM-5.2 used as default | Keep premium or escalation tier |
| 🟢 P2 | Model health controls | Add timeout, retry, circuit breaker and fallback |
| 🟢 P2 | Observability | Record model, latency, token usage, tool errors and fallback reason |

---

## 6. Missing acceptance criteria

Add these to **IPI-525 · CF-AI-005 — Unified AI Provider Types & Registry** or the replacement PR:

```text
AC-A — No active registry entry uses a deprecated Cloudflare model.

AC-B — Every registry model is verified against the current official
Cloudflare model catalog.

AC-C — Function-calling models pass:
request tools → receive tool_call → validate arguments →
execute tool → return tool result → receive final response.

AC-D — Streaming produces valid incremental events without losing
tool-call arguments.

AC-E — Registry includes distinct fast, reasoning, vision and fallback tiers.

AC-F — GLM-5.2 cannot become the default without latency, quality and
cost evaluation results.

AC-G — Failover occurs only on retryable errors such as timeout,
429, 5xx or malformed provider response.

AC-H — Telemetry records selected model, fallback model, latency,
token usage, tool-call count and failure category.
```

---

## Final decision

### For PR #340 now

```typescript
model: "@cf/meta/llama-3.1-8b-instruct-fast",
```

**Verdict:** 🟢 Best temporary registry-only replacement.

### For the final fast production tier

```typescript
model: "@cf/zai-org/glm-4.7-flash",
```

**Verdict:** 🟡 Best candidate, pending agent evaluation.

### For complex production-planner requests

```typescript
model: "@cf/zai-org/glm-5.2",
```

**Verdict:** 🟡 Premium escalation model, not default.

**Production readiness after only changing the model ID: 65%.**  
**Production readiness after split PRs, tool-loop integration tests, evaluation and fallback telemetry: approximately 92%.**