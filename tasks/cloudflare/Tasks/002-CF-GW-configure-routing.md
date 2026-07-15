# IPI-XXX · CF-GW-002 — Configure AI Gateway Features

**Linear:** [IPI-590 · CF-GW-002 — Configure AI Gateway managed features](https://linear.app/amo100/issue/IPI-590)  
**Task ID:** CF-GW-002  
**Phase:** 2 — Gateway setup  
**Difficulty:** Easy  
**Risk:** Low  
**Estimated time:** 30 minutes  
**Dependencies:** Task CF-GW-001 (gateway must exist)

---

## Purpose

Enable the managed features of the AI Gateway: caching, rate limiting, spend limits, retries, and dynamic routing for fallbacks. Each feature replaces custom code or custom tasks that were planned but never built.

### Real-world iPix example

During a busy fashion week, fifty iPix users simultaneously ask agents to analyze different brands. Without caching and rate limiting, this could overwhelm Workers AI and incur significant cost — **the "300 requests per minute" figure previously here was unverified and has been removed (audit finding, 2026-07-14); do not assume a specific Workers AI rate limit without checking current Cloudflare pricing/limits docs at execution time.** With the AI Gateway configured, repeated requests are cached, abusive users are rate-limited, the daily spend is capped at a budget the team sets, and if the primary model fails, the gateway automatically falls back to a cheaper model. Caching, rate limits, spend limits, and retries are dashboard-only. **Dynamic Routing is the exception — see Feature 5 below, it requires application code to invoke the route by name.**

---

## Recommended Setup Method

**Dashboard — toggle features in the gateway settings.**

**Corrected 2026-07-14 (audit finding, verified against `developers.cloudflare.com/ai-gateway/features/dynamic-routing/`):** caching, rate limiting, spend limits, and retries are pure dashboard configuration, no code changes needed. **Dynamic Routing is the one exception** — creating the route is dashboard-managed, but the application must explicitly call it by its deployed route name (e.g. `dynamic/ipix-default`) instead of a normal model ID. See Feature 5 below.

---

## Official Links

| Feature | Link |
|---------|------|
| Caching | https://developers.cloudflare.com/ai-gateway/features/caching/ |
| Rate limiting | https://developers.cloudflare.com/ai-gateway/features/rate-limiting/ |
| Spend limits | https://developers.cloudflare.com/ai-gateway/features/spend-limits/ |
| Dynamic routing (fallbacks) | https://developers.cloudflare.com/ai-gateway/features/dynamic-routing/ |
| Auto-retry (April 2026) | https://developers.cloudflare.com/changelog/post/2026-04-02-auto-retry-upstream-failures/ |
| Request handling | https://developers.cloudflare.com/ai-gateway/configuration/request-handling/ |

---

## Dashboard Steps

### Feature 1: Enable caching

**Purpose:** Cache identical AI requests so repeated questions do not incur new model calls. This saves money and reduces latency.

**Corrected 2026-07-14 (audit finding, verified against `developers.cloudflare.com/ai-gateway/features/caching/`):** the cache key includes the full request body and the provider authorization header, so only genuinely identical requests hit cache — but agent responses are often user-specific, organization-specific, or dependent on private CRM/brand data. **Do not enable globally without a data-classification decision first.**

**Recommended initial state:** leave global caching OFF. Add `skipCache: true` to smoke-test/verification calls. Enable selectively only for deterministic, non-private, read-only prompts (e.g. the public marketing agent's FAQ-style answers) — not agents that touch brand or client data.

**Steps (once a caching decision is made):**
1. Open the Cloudflare dashboard and navigate to AI, then AI Gateway
2. Select the `ipix-prod` gateway
3. Click the Settings tab
4. Find the Caching section
5. Toggle Cache Responses to On (only for the agents/routes cleared above)
6. Set the default cache TTL to 1 hour (3600 seconds)
7. Save

**iPix example:** When two users ask the marketing agent "What services does iPix offer?" within the same hour, the second request is served from cache. The gateway response header `cf-aig-cache-status` shows `HIT` for the cached request.

### Feature 2: Enable rate limiting

**Purpose:** Prevent any single user or IP from overwhelming the AI models.

**Corrected 2026-07-14 (audit finding):** the 200 rpm figure below is a placeholder, not a value derived from an actual Workers AI limit — set it from measured peak traffic, per-agent cost, concurrency, and acceptable burst size once real usage data exists, not by assumption. Also: a single gateway-wide limit is not automatically per-user — it caps total gateway traffic. Per-user/per-org limiting needs rate-limit dimensions or custom metadata identifying the caller, not just a raw count.

**Steps:**
1. In the same Settings tab, find the Rate Limiting section
2. Toggle Rate Limiting to On
3. Set the limit to a starting value (e.g. 200 requests per minute) — treat as provisional, tune from real traffic
4. Set the window to 1 minute
5. Save

**iPix example:** If a script accidentally sends 500 requests per minute to the Production Planner agent, the gateway returns 429 errors after the 200th request instead of overwhelming Workers AI and causing failures for all users.

### Feature 3: Configure spend limits

**Purpose:** Cap daily or monthly AI spending to prevent unexpected cost overruns.

**Corrected 2026-07-14 (audit finding, verified against `developers.cloudflare.com/ai-gateway/features/spend-limits/`):** spend limits are eventually consistent — a burst of concurrent requests can briefly exceed the configured threshold before enforcement catches up, and cost figures are best-effort estimates. Treat this as a guardrail, not a guaranteed hard billing cap; reconcile Cloudflare's cost dashboard against actual provider billing periodically.

**Steps:**
1. Navigate to the Spend Limits tab in the gateway
2. Click Add Rule
3. Set the rule name to `Daily Cap`
4. Set the limit to $50 per day (adjust based on expected usage)
5. Set the window to 24 hours
6. Set the behavior to Block requests when limit is reached
7. Save

**iPix example:** If a client accidentally triggers a loop of brand analyses that would cost $200 in a day, the gateway blocks requests after $50, protecting the iPix budget. The operator sees a 429 error and knows to investigate.

### Feature 4: Enable automatic retries

**Purpose:** Automatically retry failed requests so users do not see transient errors.

**Steps:**
1. In the Settings tab, find the Retry Requests section
2. Toggle Retries to On
3. Set the maximum attempts to 3
4. Set the retry delay to 500 milliseconds
5. Set the backoff strategy to Exponential
6. Save

**iPix example:** When Workers AI has a brief hiccup and returns a 503 for a brand DNA analysis request, the gateway automatically retries. The user never sees the error. The retry succeeds on the second attempt.

### Feature 5: Configure dynamic routing (fallback)

**Purpose:** If the primary model is unavailable, automatically fall back to a cheaper model instead of failing.

**⚠️ This is the one feature on this page that is NOT "just dashboard config" (corrected 2026-07-14, audit finding).** Creating the route is dashboard-managed, but the application must call it **by its route name** instead of a normal model ID — e.g. `dynamic/ipix-default`, not `@cf/meta/llama-4-scout-17b-16e-instruct`. This requires a real code change at every call site that should use the route, plus testing that the fallback actually triggers. Treat this as its own small integration task, not a toggle.

**Steps:**
1. Navigate to the Dynamic Routing tab
2. Click Create Route
3. Name the route `ipix-default` (this name is what application code calls, not `Default with fallback`)
4. Set the primary model to `@cf/meta/llama-4-scout-17b-16e-instruct`
5. Set the fallback model to `@cf/zai-org/glm-4.7-flash` (cheaper, faster)
6. Set the condition to `On 5xx error`
7. Save
8. **Update the calling code** to invoke `dynamic/ipix-default` in place of the direct model ID — this step has no dashboard equivalent

**iPix example:** When the Llama 4 Scout model is temporarily down for maintenance, the Creative Director agent's requests automatically fall back to GLM-4.7-Flash — but only for call sites that were updated to invoke `dynamic/ipix-default` in step 8. The user gets a response (slightly less capable but still useful) instead of an error.

---

## Commands

None. All configuration is done in the dashboard.

---

## Files Changed

None. All configuration is stored in the Cloudflare dashboard, not in code files.

**Recommendation:** Document the chosen settings in a file in the repository (for example, `docs/cloudflare/ai-gateway-config.md`) so the team has a record of what was configured.

---

## Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| AI Gateway exists (Task CF-GW-001) | Must be complete | The features are configured on the gateway |

---

## Tests

### Test 1: Caching works

Send the same request twice within the cache TTL.

Pass criteria: The second response has the header `cf-aig-cache-status: HIT`.

### Test 2: Rate limiting works

Send more than 200 requests in a minute (use a script).

Pass criteria: After the 200th request, responses return 429.

### Test 3: Spend limit is enforced

Check the dashboard after a day of usage.

Pass criteria: The dashboard shows spend tracking and the limit is visible.

### Test 4: Retries work on failure

Temporarily point the binding at an invalid model to trigger an error.

Pass criteria: The gateway retries 3 times before returning the error. The analytics show the retry attempts.

### Test 5: Fallback works

Trigger a 5xx error on the primary model.

Pass criteria: The response comes from the fallback model. The response header indicates which model was used.

---

## Managed-First Verification & Definition of Done

*(Added 2026-07-14, per `tasks/cloudflare/Tasks/notes/04-improvements.md` — fill in at execution time, not in advance. A dashboard toggle alone does not satisfy "done.")*

| Verification gate | Result |
|---|---|
| Cloudflare dashboard feature available? | — |
| Wrangler command available? | — |
| Cloudflare API available? | — |
| Official package/module available? | — |
| Official GitHub repository checked? | — |
| Official example checked? | — |
| Official tutorial/recipe checked? | — |
| Existing iPix code already implements it? | — |
| Configuration-only solution possible? | — |
| Minimum integration code required | — |
| Custom implementation necessary? | — |
| Why custom code is unavoidable | — |
| Rollback method | — |
| Production evidence | — |

**Definition of done:** Configured + integrated + tested + observed in logs + failure tested + rollback tested + documented = complete.

---

## Acceptance Criteria

- [ ] Caching is enabled only for agents/routes cleared by the data-classification decision (Feature 1), with 1-hour TTL where enabled — not enabled globally by default
- [ ] Rate limiting is enabled with a limit justified by measured traffic and documented capacity needs (Feature 2) — not a fixed 200 RPM pass/fail bar
- [ ] A daily spend limit of $50 is configured
- [ ] Automatic retries are set to 3 attempts with exponential backoff
- [ ] Dynamic routing is configured with GLM-4.7-Flash as the fallback, **and** at least one real call site has been updated to invoke `dynamic/ipix-default` by name (not just the route existing in the dashboard)
- [ ] Global caching decision is documented (on/off per agent, based on data sensitivity) — not enabled blindly
- [ ] All features are documented in the repository

---

## Rollback

Each feature can be individually disabled by toggling it off in the dashboard. No code changes are needed to roll back any feature.

If all features need to be disabled, toggle each one off in the gateway Settings tab. The gateway continues to route requests but without any of the managed features.

---

## Evidence Required

1. Screenshot of the gateway Settings tab showing caching and rate limiting enabled
2. Screenshot of the Spend Limits tab showing the daily cap rule
3. Screenshot of the Dynamic Routing tab showing the fallback route
4. Screenshot of the analytics dashboard showing cache hits and request volume

---

## What Custom Code This Removes

| Feature | Custom code or task it replaces |
|---------|-------------------------------|
| Caching | No equivalent existed — new capability |
| Rate limiting | No equivalent existed — new capability |
| Spend limits | IPI-531 circuit breaker task (canceled) |
| Automatic retries | Custom retry-classifier.ts (112 lines) — removed in Task 5 |
| Dynamic routing fallback | Custom Bedrock fallback in router.ts — removed in Task 5 |
| Cost tracking | IPI-460 cost tracking task (canceled) |
| Failover | IPI-463 failover task (canceled) |

This single dashboard task cancels or replaces four Linear tasks and removes hundreds of lines of custom retry and fallback code.

---

## User Journey After This Task

> A fashion brand signs up for iPix and immediately starts analyzing twenty competitor brands. The Brand Intelligence agent sends twenty requests to Workers AI. The AI Gateway caches two requests that were identical (two competitors had the same website structure), rate-limits are not triggered (twenty is well under 200 per minute), retries one request that hit a transient 503, and tracks the total cost at $0.40. The spend dashboard shows the usage. The daily cap of $50 is nowhere near reached. The team has full visibility into what happened, with zero custom monitoring code.
