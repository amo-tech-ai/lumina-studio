# IPI-XXX · CF-GW-001 — Create AI Gateway in Dashboard

**Task ID:** CF-GW-001  
**Phase:** 2 — Gateway setup  
**Difficulty:** Easy  
**Risk:** Low  
**Estimated time:** 15 minutes  
**Dependencies:** None (can be done in parallel with Tasks 1 and 2)

---

## Purpose

Create a managed AI Gateway in the Cloudflare dashboard. This task only creates the gateway shell — it does not turn on any of its controls. Right after creation, caching, rate limiting, retries, fallback routing, spend limits, and cost tracking are all still off (verified live: `cache_ttl: 0`, `rate_limiting_limit: 0`, `retry_max_attempts: null` on a freshly-created gateway). Those get configured and verified in later tasks (CF-GW-002 and on). What this task does provide immediately: a place for the gateway's settings and analytics pages to exist, and a fixed `ipix-prod` gateway ID that later tasks route traffic through.

### Real-world iPix example

Today, every Workers AI request goes straight to the model with no protection, no caching, and no visibility into cost or performance. Once `ipix-prod` exists *and* is configured *and* is wired into application traffic (later tasks), fifty users simultaneously asking the Brand Intelligence agent to analyze different fashion brands would get caching on identical requests, rate limits on abusive users, per-request cost tracking, and automatic retries. None of that is live after this task alone.

---

## Recommended Setup Method

**Dashboard — create the gateway in the Cloudflare dashboard.**

Dashboard is the recommended method for this task and is what the rest of this plan assumes. Cloudflare's REST API can also create gateways (`POST /accounts/{account_id}/ai-gateway/gateways`) — dashboard is not the only method, it's the one this task deliberately uses for a one-time, low-frequency setup step. No code is needed either way.

**Priority order confirmation:** This is option 1 (official dashboard setup) in the priority list — the intentional choice for this task, not the only choice Cloudflare offers.

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

Enter the name `ipix-prod` for the production gateway. This name is the gateway ID — it gets passed at request time in application code (see Step 6 and "Connecting the Gateway to the Worker" below), not written into `wrangler.jsonc`.

Do not use the `default` gateway for this migration. Cloudflare auto-creates a `default` gateway on the first authenticated request in some flows (and Workers AI REST calls still require an explicit `cf-aig-gateway-id` header regardless), but every task and control in this plan targets `ipix-prod` by name — using `default` would split analytics, spend limits, and dynamic routes away from the gateway this plan configures and verifies.

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

Nothing, yet. This task creates an empty gateway shell with every control still off — it doesn't route traffic, retry requests, or track cost on its own, so there's nothing here for it to replace. The custom router (400 lines), retry classifier (112 lines), error handling (107 lines), and ad-hoc logging only become genuinely redundant once CF-GW-002 turns the equivalent gateway features on *and* application traffic is proven to route through them. Actual removal happens in `053-CF-MIGRATION-cleanup-custom-code.md`, after routing, retries, logging, rollback, and production validation are all proven — not here.

---

## User Journey After This Task

> The native `ipix-prod` gateway exists in the Cloudflare dashboard. Its Settings and Analytics pages are reachable and show zero requests. No application traffic is connected yet — an iPix operator using the Creative Director agent right now still goes through the existing custom `ai-gateway` Worker, unchanged. A later task (Workers AI binding + wiring `env.AI.run()`'s `gateway: { id: "ipix-prod" }` option) routes real traffic through it and verifies the request shows up in Gateway Logs and Analytics with model, cost, and latency data.
