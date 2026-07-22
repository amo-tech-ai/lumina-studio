Review and update the following Linear issues using the latest Cloudflare Workers AI, AI Gateway, Function Calling, and Model Registry official documentation.

Issues:
- IPI-527 · CF-AI-012 — Fix and Directly Test Tool Routing
- IPI-528 · CF-AI-013 — Harden Gemini Tool-Message Handling
- IPI-529 · CF-AI-014 — Validate Model Registry and Tool Tier Configuration
- IPI-530 · CF-AI-015 — Verify Live Multi-Turn Tool Calling and Security
- IPI-531 · CF-AI-016 — Add Tool Routing Reliability and Observability
- IPI-465 · Shared AI Tool Registry
- IPI-508 · Journey Test – Marketing/Operator Fast Chat Gateway

Requirements:
- Use Skills MCP and official Cloudflare documentation only.
- Verify every acceptance criterion against the current codebase.
- Remove incorrect assumptions, duplicate work, and contradictory tasks.
- Do not recreate code, tests, or files that already exist.
- Verify model IDs, pricing, context windows, capabilities, and routing behavior.
- Replace arbitrary timeout, retry, circuit-breaker, and loop limits with configurable values and documented rationale.
- Validate dependencies and execution order.
- Keep tasks focused and independently mergeable.
- Add only missing work required for production readiness.
- Include Mermaid diagrams for:
  - Current architecture
  - Target architecture
  - Request routing
  - Tool-calling workflow
  - Multi-turn tool loop
  - Bedrock fallback
  - AI Gateway routing
  - Deployment and CI flow
- Define measurable success criteria for every task.
- Add verification steps, regression tests, real-world user journeys, staging validation, rollback plan, and production gates.
- Ensure every claim references official documentation or verified code.
- Flag unsupported assumptions as "Needs Verification" instead of treating them as facts.

Deliver:
1. Corrected Linear tasks
2. List of changes made to each task
3. Missing work
4. Risks and blockers
5. Updated dependency graph
6. Mermaid diagrams
7. Production readiness score
8. Final recommendation: Merge, Revise, or Block, with evidence.

# Review of the Latest Audit

## Verdict

**Audit accuracy: 61%**
**Official Cloudflare facts: 92% correct**
**Internal consistency: 43%**
**Code conclusions: not fully independently verified from the repository**
**Decision: 🟡 Useful evidence, but not reliable as the final implementation plan.**

The audit correctly verifies several Cloudflare model facts and identifies likely pricing and Gemini-message risks. However, it repeatedly contradicts itself about which files, functions, tests, and registry tiers exist.

## What is verified as correct

| Claim                                                           | Result     |
| --------------------------------------------------------------- | ---------- |
| GLM-4.7-Flash model ID                                          | 🟢 Correct |
| GLM context window: 131,072                                     | 🟢 Correct |
| GLM function calling and reasoning                              | 🟢 Correct |
| GLM pricing: $0.06/M input, $0.40/M output                      | 🟢 Correct |
| GLM supports tools, `tool_choice`, parallel calls and streaming | 🟢 Correct |
| Llama 4 Scout context: 131,000                                  | 🟢 Correct |
| Llama supports function calling and vision                      | 🟢 Correct |
| Llama pricing: $0.27/M input, $0.85/M output                    | 🟢 Correct |
| GPT-OSS-120B pricing: $0.35/M input, $0.75/M output             | 🟢 Correct |
| Function calling is still Beta                                  | 🟢 Correct |

Cloudflare confirms GLM-4.7-Flash supports multi-turn tool calling, function calling, reasoning, streaming, `tools`, `tool_choice`, and `parallel_tool_calls`. ([Cloudflare Docs][1])

Cloudflare confirms Llama 4 Scout supports function calling and vision, with a 131,000-token context and pricing of $0.27/M input and $0.85/M output. ([Cloudflare Docs][2])

GPT-OSS-120B is listed at $0.35/M input and $0.75/M output, with function calling enabled. ([Cloudflare Docs][3])

---

# Critical errors in the audit

## 🔴 1. It contradicts itself about IPI-527

Early in the report it correctly says:

* `hasToolsInHistory()` exists;
* `validateToolRequest()` exists;
* `needsToolProvider()` exists;
* `selectProvider()` uses them;
* `router.tools.test.ts` exists;
* the `tool-calling` tier exists.

Later, under “Exact Corrections,” it incorrectly says:

* add those functions;
* add tool-aware routing;
* create `router.tools.test.ts`;
* add the missing `tool-calling` tier.

Both statements cannot be true.

### Required correction

Rewrite **IPI-527 · CF-AI-012 — Fix and Directly Test Tool Routing** to say:

> Verify existing functions are directly invoked by tests, identify missing scenarios, and fix only behavior proven incorrect.

Do not instruct Claude to recreate existing code or files.

---

## 🔴 2. The test-file table contradicts its own evidence

The audit first says:

> `router.tools.test.ts` exists with 18 tests.

Later it lists the same file under:

> “Key test gaps—files that do not exist.”

This invalidates several scoring and merge-readiness conclusions.

### Required correction

Use one verified inventory:

| File | Exists? | Directly calls production code? | Missing coverage |
| ---- | ------- | ------------------------------- | ---------------- |

Existence alone is not enough. Inspect the imports and actual calls.

---

## 🔴 3. The registry-tier findings contradict each other

The audit correctly reports:

> `tool-calling` tier exists at lines 48–55.

But later says:

> Add the missing tool-calling tier.

### Required correction

**IPI-529 · CF-AI-014 — Validate Model Registry and Tool Tier Configuration** should validate and correct the existing entry—not add a duplicate.

Required checks:

* exact model ID;
* context window;
* capabilities;
* pricing units;
* required tier presence;
* runtime override validation;
* deprecated model detection.

---

## 🔴 4. Pricing errors are treated as routing merge blockers without context

Incorrect pricing metadata matters for:

* cost reporting;
* model comparison;
* budgets;
* alerts;
* chargeback.

But incorrect price metadata does not necessarily break provider routing or tool execution.

### Better severity

| Problem                                        | Severity |
| ---------------------------------------------- | -------- |
| Wrong model ID/provider                        | P0       |
| Tool tier missing                              | P0       |
| Tool capability incorrect and used for routing | P0/P1    |
| Incorrect price metadata                       | P1       |
| Incorrect context metadata without enforcement | P1/P2    |

Pricing should block release when cost controls rely on it, but it may not need to block a narrowly scoped routing PR.

---

## 🔴 5. Timeout reasoning remains partly wrong

The audit still contains this claim:

> “30s timeout matches Workers limit.”

It does not.

Cloudflare distinguishes CPU time from wall-clock duration. Waiting on `fetch()`, KV, databases, or other network I/O does not count as CPU time. HTTP-triggered Workers have no fixed wall-clock duration limit while the client stays connected. ([Cloudflare Docs][4])

Therefore:

* 5 seconds is not disproved by a 30-second CPU limit;
* 30 seconds is not justified by a 30-second CPU default;
* timeout values must be selected from UX goals and measured provider latency.

### Correct approach

Use configurable values:

```text
AI_PROVIDER_TIMEOUT_MS
TOOL_EXECUTION_TIMEOUT_MS
TOTAL_TOOL_LOOP_TIMEOUT_MS
MAX_TOOL_TURNS
```

Set provisional staging values, measure P50/P95/P99, then document production defaults.

---

## 🔴 6. Bedrock fallback is still overstated

The audit alternates between:

* “Bedrock fallback works with tools”; and
* “live multi-turn compatibility is unverified.”

The second statement is the accurate one.

Forwarding these fields:

```text
tools
tool_choice
parallel_tool_calls
```

proves adapter implementation, not full provider compatibility.

Still required:

* live Bedrock tool selection;
* valid argument generation;
* named `tool_choice`;
* parallel tools;
* tool-result continuation;
* streaming;
* normalized finish reasons and errors.

Correct wording:

> Bedrock tool forwarding is implemented and mock-tested; live contract compatibility remains unverified.

---

## 🟡 7. Gemini guard may duplicate an existing entry guard

The audit proposes adding a guard specifically inside `toGeminiMessages()`.

That is a useful defensive layer, but first verify whether `validateGeminiRequest()` is always invoked before conversion in both:

* `chat()`;
* `chatStream()`.

The best design is defense in depth:

1. Router sends tool conversations to the tool provider.
2. Gemini provider entry points reject tool-bearing requests.
3. `toGeminiMessages()` asserts that only supported roles remain.

Also reject:

* assistant messages containing `tool_calls`;
* nonempty `tools`;
* active `tool_choice`;
* `parallel_tool_calls`;
* `role: "tool"`.

---

## 🟡 8. IPI-530 is still handled inconsistently

The audit says both:

* split IPI-530;
* keep security and live verification together;
* merge security into IPI-531.

Choose one approach.

### Recommended approach

Keep **IPI-530 · CF-AI-015 — Verify Live Multi-Turn Tool Calling and Security** as one staging release gate with three sections:

1. Tool-loop contract
2. Deterministic execution security
3. Live streaming and failure verification

Do not merge authorization and injection controls into an observability task. Security and telemetry are related but separate responsibilities.

---

## 🟡 9. IPI-508 should not be rewritten completely

**IPI-508 · CF-UJ-008 — Journey Test: Marketing & Operator Fast Chat Gateway** originally focuses on fast, non-tool chat.

Keep it focused on:

```text
marketing/operator fast chat
→ gateway mode
→ fast tier
→ streaming response
→ direct-mode regression
```

Create a separate tool-enabled operator journey rather than changing the original acceptance criteria.

Do not require `AI_GATEWAY_ALLOW_TOOL_TIERS=1` for the original fast-chat journey.

---

## 🟡 10. The proposed production gate is overbuilt and partly arbitrary

These are not automatically required:

* Sentry specifically;
* DNS cutover;
* 24-hour soak;
* exactly 100 random requests;
* cost within exactly 10%;
* circuit breaker before first release.

Cloudflare already provides Workers Logs and exposes CPU and wall-time data; Logpush or another approved observability pipeline may be sufficient. ([Cloudflare Docs][4])

Use risk-based gates:

* structured logs;
* request correlation;
* routing/provider/model fields;
* error rate;
* P95 latency;
* cost visibility;
* rollback proof;
* live user journey.

---

# Missing items

## Before merge

* Verify tests directly call production router functions.
* Remove duplicated test logic.
* Test malformed tool history.
* Test unknown `tool_call_id`.
* Test partial registry override.
* Test invalid registry entries, not just invalid JSON.
* Test that defaults are not mutated.
* Add defensive Gemini conversion assertions.
* Correct pricing and model metadata.
* Run clean-checkout CI.
* Confirm PR mergeability and unresolved review threads.

## Before staging approval

* Live GLM tool-call request.
* Live multi-turn continuation.
* Streaming tool-call reconstruction.
* Tool argument JSON-schema validation.
* Allowlist and authorization.
* Tenant isolation.
* Maximum tool-call depth.
* Idempotency for write operations.
* Deterministic refusal of undeclared or unauthorized tools.

## Before production

* Live fallback contract test.
* Structured telemetry with secret redaction.
* Provider timeout and cancellation.
* Retry classification by HTTP/error type.
* Rollback test.
* Real operator tool journey.
* Baseline latency, reliability and cost measurements.

---

# Corrected scoring

| Area                            |      Score |
| ------------------------------- | ---------: |
| Official Cloudflare model facts |         92 |
| Pricing verification            |         90 |
| Code inventory consistency      |         35 |
| Task-scope recommendations      |         58 |
| Dependency analysis             |         55 |
| Security recommendations        |         70 |
| Reliability guidance            |         52 |
| Release-gate quality            |         60 |
| **Overall audit correctness**   | **61/100** |

## Corrected readiness

| Stage                | Readiness |
| -------------------- | --------: |
| Task plan            |       70% |
| Merge readiness      |       55% |
| Staging readiness    |       35% |
| Production readiness |       25% |

These percentages remain estimates until the repository, current PR head, CI results, and deployed staging Worker are directly inspected.

# Final recommendation

**Use the audit as a source of findings, not as the authoritative plan.**

The credible findings are:

* Gemini defensive rejection likely needs strengthening;
* model pricing and metadata require correction;
* live multi-turn behavior remains unverified;
* security must rely on deterministic authorization and schema validation;
* reliability thresholds need measurement rather than guesswork.

The report must first remove all contradictory statements about existing functions, test files, routing logic, and the tool-calling tier.

**Final verdict: 🟡 PARTIALLY CORRECT — 61/100. Revise before updating Linear or implementing changes.**

[1]: https://developers.cloudflare.com/workers-ai/models/glm-4.7-flash/ "glm-4.7-flash (Zhipu AI) · Cloudflare AI docs · Cloudflare Workers AI docs"
[2]: https://developers.cloudflare.com/workers-ai/models/llama-4-scout-17b-16e-instruct/ "llama-4-scout-17b-16e-instruct (Meta) · Cloudflare AI docs · Cloudflare Workers AI docs"
[3]: https://developers.cloudflare.com/workers-ai/models/gpt-oss-120b/ "gpt-oss-120b (OpenAI) · Cloudflare AI docs · Cloudflare Workers AI docs"
[4]: https://developers.cloudflare.com/workers/platform/limits/ "Limits · Cloudflare Workers docs"
