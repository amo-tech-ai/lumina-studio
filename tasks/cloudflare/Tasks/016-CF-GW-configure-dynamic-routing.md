# IPI-XXX · CF-GW-006 — Configure AI Gateway Dynamic Routing & Fallback

**Task ID:** CF-GW-006
**Track:** AI Gateway Features
**Phase:** 2 — Gateway config
**Difficulty:** Easy
**Risk:** Low
**Estimated time:** 15 minutes
**Dependencies:** 001 (gateway created), 004 (models selected), 015 (spend limits optional but recommended)

---

## Purpose

Configure dynamic routes in AI Gateway so that a primary model failure or budget overflow automatically falls back to a secondary model. Eliminates the custom retry/fallback router code currently living in `services/cloudflare-worker/`.

### Real-world iPix example

The Production Planner agent calls `openai/gpt-5` as its primary model. OpenAI has a 10-minute outage. Without dynamic routing, every Production Planner request fails with a 502 from the custom router, and users see errors. With dynamic routing, the gateway automatically rewrites the request to `@cf/meta/llama-4-scout-17b-16e-instruct` (the default iPix managed Workers AI model), users keep working, and the analytics dashboard shows the fallback traffic in green.

---

## Recommended Setup Method

**Dashboard — create a Dynamic Route with a primary and at least one fallback model.**

Priority order: option 1 (dashboard setup).

---

## Official Links

| Resource | Link |
|----------|------|
| Dynamic Routing | https://developers.cloudflare.com/ai-gateway/features/dynamic-routing/ |
| Auto-retry changelog (Apr 2026) | https://developers.cloudflare.com/changelog/post/2026-04-02-auto-retry-upstream-failures/ |
| Fallback configuration | https://developers.cloudflare.com/ai-gateway/configuration/fallbacks/ |
| Spend Limits (pairs with fallback) | https://developers.cloudflare.com/ai-gateway/features/spend-limits/ |

---

## Commands

No CLI required.

---

## Dashboard Steps

### Step 1: Open Dynamic Routing

1. Open the Cloudflare dashboard → **AI Gateway**.
2. Select the gateway.
3. Select the **Dynamic Routing** tab.

### Step 2: Create a route

1. Click **Create route**.
2. Configure:
   - **Route name:** `planner-primary`
   - **Strategy**: weighted or fallback.
   - **Primary model:** `openai/gpt-5` (or per project choice — no `@cf/` prefix for third-party models; that prefix is reserved for Workers-AI-hosted models)
   - **Fallback model:** `@cf/meta/llama-4-scout-17b-16e-instruct`
   - **Trigger for fallback:** on 5xx, on timeout, or on spend limit (links to task 015).
3. Click **Save**.

### Step 3: Point the agent at this route

The Mastra provider config (`004-CF-AI-setup-models.md`'s `resolveModel()`) will reference this route by name — no code changes are needed once the route exists. (Correction: the original `task 031` reference here pointed to `031-CF-MASTRA-model-registry.md`, which was archived — it imported a nonexistent package and was never a real dependency of this step.)

---

## Files Changed

None in this task. Task 031 (Mastra model registry) references the route by name.

---

## Dependencies

| Dependency | Status |
|------------|--------|
| AI Gateway created | ✅ Task 001 |
| Models selected | ✅ Task 004 |

---

## Tests

### Test 1: Primary succeeds

Send a normal request.

Pass criteria: Response comes from the primary model. Analytics dashboard shows the primary model as the source.

### Test 2: Fallback fires on simulated 5xx

Force a 5xx by pointing the primary at an obviously invalid URL in a test route (or simply wait for the provider's next outage).

Pass criteria: The 5xx triggers the fallback, the request still succeeds, and the gateway analytics attributes the response to the fallback model with the reason "upstream_5xx".

### Test 3: Fallback fires on spend-limit exhaustion

Set a very low spend limit on the primary (e.g. $0.01), exhaust it, send another request.

Pass criteria: Request returns from the fallback model instead of returning 429.

### Test 4: Weighted routing (if chosen)

If you chose weighted strategy with 90/10 split between primary and secondary, send 100 requests.

Pass criteria: Approximately 10 requests are served by the secondary, 90 by the primary. Confirms weighted distribution.

---

## Acceptance Criteria

- [ ] At least one Dynamic Route configured
- [ ] Primary and fallback models are specified
- [ ] Failover conditions configured (5xx, timeout, or spend limit)
- [ ] Fallback is verified by a real test request

---

## Rollback

1. Open Dynamic Routing tab.
2. Click **Delete** next to the route.
3. Save.

All requests then route directly to the requested model without fallback.

---

## Evidence Required

1. Screenshot of the Dynamic Route configuration showing primary and fallback.
2. Analytics dashboard screenshot showing at least one request served by the fallback, with the failover reason.

---

## What Custom Code This Removes

This is the single biggest cleanup item for the custom gateway Worker. Replaces:

- `services/cloudflare-worker/router.ts` (~400 lines) — the custom retry/fallback chooser
- `services/cloudflare-worker/retry-classifier.ts` (~112 lines) — classifies which errors should retry
- `services/cloudflare-worker/gateway-errors.ts` (~107 lines) — typed error mapping for the custom router
- Any weighted-round-robin logic

These are removed as part of task 053 once dynamic routing is verified working end-to-end.

---

## User Journey After This Task

> A retailer's merchandising team is on deadline. The Creative Director agent tries to call the premium OpenAI model. OpenAI has a brief hiccup. Two seconds later the same request flows through the fallback Llama 4 model and the team gets their moodboard. The merchandising lead never knew anything happened. The billing admin spots a small spike of fallback traffic in the gateway dashboard the next morning and decides to add a third tier to the dynamic route.
