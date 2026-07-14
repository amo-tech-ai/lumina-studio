# IPI-XXX · CF-GW-001 — Create AI Gateway in Dashboard

**Task ID:** CF-GW-001  
**Phase:** 2 — Gateway setup  
**Difficulty:** Easy  
**Risk:** Low  
**Estimated time:** 15 minutes  
**Dependencies:** None (can be done in parallel with Tasks 1 and 2)

---

## Purpose

Create a managed AI Gateway in the Cloudflare dashboard. The AI Gateway is a managed product that sits between the iPix application and the AI models. It provides caching, rate limiting, cost tracking, retries, fallbacks, and analytics — all without writing any code.

### Real-world iPix example

When fifty users simultaneously ask the Brand Intelligence agent to analyze different fashion brands, the AI Gateway caches identical requests, rate-limits abusive users, tracks how much each analysis costs, and automatically retries if a model is temporarily unavailable. Without the gateway, every request goes straight to the model with no protection, no caching, and no visibility into cost or performance.

---

## Recommended Setup Method

**Dashboard — create the gateway in the Cloudflare dashboard.**

This is the only method available. The AI Gateway is a managed product configured through the dashboard. No CLI command creates it. No code is needed.

**Priority order confirmation:** This is option 1 (official dashboard setup) in the priority list. It is the highest priority and the only option for this component.

---

## Official Links

| Resource | Link |
|----------|------|
| AI Gateway overview | https://developers.cloudflare.com/ai-gateway/ |
| Get started | https://developers.cloudflare.com/ai-gateway/get-started/ |
| Workers AI binding integration | https://developers.cloudflare.com/ai-gateway/integrations/aig-workers-ai-binding/ |
| Manage gateway | https://developers.cloudflare.com/ai-gateway/configuration/manage-gateway/ |
| Default gateway auto-creation | https://developers.cloudflare.com/changelog/post/2026-03-02-default-gateway/ |

---

## Dashboard Steps

### Step 1: Open the Cloudflare dashboard

Log into the Cloudflare dashboard at dash.cloudflare.com and select the iPix account.

### Step 2: Navigate to AI Gateway

In the left sidebar, click on AI, then click on AI Gateway.

### Step 3: Create a new gateway

Click the Create Gateway button.

### Step 4: Name the gateway

Enter the name `ipix-prod` for the production gateway. This name will be used in the wrangler.jsonc configuration to route AI requests through this gateway.

Alternatively, use the `default` gateway, which is automatically created on the first request. However, a named gateway is recommended for production to keep analytics and configuration separate.

### Step 5: Confirm creation

Click Create. The gateway is created immediately and appears in the gateway list.

### Step 6: Note the gateway ID

After creation, note the gateway ID (it's the gateway name, e.g. `ipix-prod`). This ID is passed at **request time** in application code — it is not a `wrangler.jsonc` configuration value.

---

## Connecting the Gateway to the Worker

**Correction (verified against current Cloudflare docs, 2026-07-13):** the AI binding in `wrangler.jsonc` does NOT take a `gateway` sub-key. The binding is always just:

```jsonc
{
  "ai": { "binding": "AI" }
}
```

(This is what Task CF-AI-020 / `003-CF-AI-add-workers-ai-binding.md` already adds — nothing more is needed there for gateway routing.)

The gateway ID is instead passed as the **third argument** to `env.AI.run()` in the Worker/Mastra code that calls the model:

```ts
const response = await env.AI.run(
  "@cf/meta/llama-3.1-8b-instruct",
  { prompt: "..." },
  { gateway: { id: "ipix-prod", skipCache: false } }, // <- gateway ID goes here, per call
);
```

This tells Cloudflare to route that specific request through the named AI Gateway, enabling caching, rate limiting, and analytics for it.

---

## Commands

None required for gateway creation itself — that's dashboard-only.

Once the gateway exists and the code that calls `env.AI.run()` passes the `gateway: { id: "ipix-prod" }` option (see above), run the preview server to confirm requests route through the gateway:

Command: `npm run preview`

---

## Files Changed

None in this task. `wrangler.jsonc` only ever needs the plain `{ "ai": { "binding": "AI" } }` block added in Task CF-AI-020 — there is no gateway-specific config file to change. The gateway ID is wired in wherever `env.AI.run()` is called (tracked separately, e.g. in the Mastra model-registry task).

---

## Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| Cloudflare account | Active | iPix account verified |
| Workers AI binding (Task CF-AI-020) | Recommended first | The `ai` binding must exist before any `env.AI.run()` call can pass a gateway option |
| Wiring the `gateway: { id }` option into `env.AI.run()` calls | **Separate follow-up task, not part of CF-GW-001** | This task only creates the gateway in the dashboard. Nothing calls it yet until that wiring task lands (tracked wherever `env.AI.run()` is first added — e.g. the Mastra model-registry task) |

---

## Tests

These verify the gateway itself. Full end-to-end request routing (Test 2/3) can only be exercised once the separate wiring task above has landed — they are not blocking for this task's completion.

### Test 1: Gateway appears in dashboard

After creation, the gateway `ipix-prod` appears in the AI Gateway list.

Pass criteria: The dashboard shows the gateway with zero requests initially.

### Test 2: Requests route through the gateway (post-wiring)

Once some `env.AI.run()` call passes `gateway: { id: "ipix-prod" }`, make a test AI request.

Pass criteria: The gateway analytics dashboard shows one new request within a few seconds.

### Test 3: Gateway metadata is logged (post-wiring)

In the gateway analytics, verify that the request shows the model, latency, token count, and estimated cost.

Pass criteria: The analytics page displays all metadata fields for the test request.

---

## Acceptance Criteria

This task is dashboard-only — its criteria stop at gateway creation, not request routing:

- [ ] The `ipix-prod` gateway exists in the Cloudflare dashboard
- [ ] The gateway's Settings tab loads without error

Routing verification (Test 2/3 above) is the acceptance criteria of the separate wiring task, not this one — see Dependencies.

---

## Rollback

To roll back this change:

1. Remove the `gateway: { id: "ipix-prod" }` option from wherever `env.AI.run()` is called (the wrangler.jsonc AI binding itself is untouched by this task and needs no change)
2. Optionally delete the gateway from the dashboard (the gateway can also be kept but unused)

Removing the gateway option means AI calls go directly to Workers AI without caching, rate limiting, or analytics. The application continues to work.

---

## Evidence Required

1. Screenshot of the AI Gateway list showing `ipix-prod` (required for this task)
2. Screenshot of the gateway analytics dashboard showing at least one request (post-wiring — evidence for the separate wiring task, not blocking here)
3. Copy of the `env.AI.run()` call showing the `gateway: { id: "ipix-prod" }` option (post-wiring — same as above)

---

## What Custom Code This Removes

This task replaces the following custom code (removed in Task 5):

- Custom router logic (400 lines) — the AI Gateway routes requests
- Custom retry classifier (112 lines) — the AI Gateway retries automatically
- Custom error handling (107 lines) — the AI Gateway standardizes errors
- Custom cost tracking (not built) — the AI Gateway dashboard shows costs
- Custom logging (scattered console.log) — the AI Gateway logs every request

---

## User Journey After This Task

> An iPix operator asks the Creative Director agent to "create a moodboard for a luxury skincare campaign." The request flows through the AI Gateway. The gateway checks if a similar request is cached (it is not, since this is the first time). It forwards the request to the Workers AI model. The model generates the moodboard description. The gateway logs the request, calculates that it cost $0.002, and records a 1.3-second latency. The analytics dashboard updates in real time. The engineering team can see exactly how much each creative direction session costs, without writing any tracking code.
