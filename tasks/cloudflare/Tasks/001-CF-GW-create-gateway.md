# IPI-XXX · CF-GW-001 — Create AI Gateway in Dashboard

**Note (2026-07-13):** before starting this, check `005-CF-WORKER-create-via-dashboard.md`, `006-CF-WORKER-add-binding-via-dashboard.md`, `009-CF-CICD-connect-github-repo.md`, and `010-CF-OBS-enable-observability.md` — those document related setup work (Worker creation, binding, CI/CD, observability) already marked done with dated evidence. This task is specifically about the AI *Gateway* resource, which is a separate thing from the Worker itself — confirm it's genuinely not done yet before treating it as pending.

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

After creation, note the gateway ID. This ID is used in the wrangler.jsonc configuration in Task CF-AI-020 (or as an update to that task) to route the Workers AI binding through this gateway.

---

## Connecting the Gateway to the Worker

After creating the gateway, update the wrangler.jsonc AI binding to reference it.

The AI binding in wrangler.jsonc should include a gateway configuration. The binding block should specify the binding name as `AI` and include a gateway object with the `id` set to `ipix-prod` (or whatever name was chosen in Step 4).

This tells Cloudflare to route all Workers AI calls through the AI Gateway, enabling caching, rate limiting, and analytics.

---

## Commands

None required. This task is entirely dashboard-based.

After creating the gateway and updating wrangler.jsonc, run the preview server to confirm the binding routes through the gateway:

Command: `npm run preview`

---

## Files Changed

### File 1: app/wrangler.jsonc

Update the AI binding (added in Task CF-AI-020) to include the gateway configuration.

The AI block now contains both the binding name and a gateway object with the gateway ID.

---

## Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| Cloudflare account | Active | iPix account verified |
| Workers AI binding (Task CF-AI-020) | Recommended first | The gateway is connected via the binding |

---

## Tests

### Test 1: Gateway appears in dashboard

After creation, the gateway `ipix-prod` appears in the AI Gateway list.

Pass criteria: The dashboard shows the gateway with zero requests initially.

### Test 2: Requests route through the gateway

After deploying or previewing with the updated binding, make a test AI request.

Pass criteria: The gateway analytics dashboard shows one new request within a few seconds.

### Test 3: Gateway metadata is logged

In the gateway analytics, verify that the request shows the model, latency, token count, and estimated cost.

Pass criteria: The analytics page displays all metadata fields for the test request.

---

## Acceptance Criteria

- [ ] The `ipix-prod` gateway exists in the Cloudflare dashboard
- [ ] The wrangler.jsonc AI binding includes the gateway configuration
- [ ] A test request appears in the gateway analytics
- [ ] The gateway shows model, latency, and cost data for the test request

---

## Rollback

To roll back this change:

1. Remove the gateway configuration from the AI binding in wrangler.jsonc (leave just the binding name)
2. Optionally delete the gateway from the dashboard (the gateway can also be kept but unused)

Removing the gateway configuration means AI calls go directly to Workers AI without caching, rate limiting, or analytics. The application continues to work.

---

## Evidence Required

1. Screenshot of the AI Gateway list showing `ipix-prod`
2. Screenshot of the gateway analytics dashboard showing at least one request
3. Copy of the updated wrangler.jsonc AI binding block

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
