# IPI-XXX · CF-GW-008 — Tag Requests with Custom Metadata

**Task ID:** CF-GW-008
**Track:** AI Gateway Features
**Phase:** 2 — Gateway config
**Difficulty:** Easy
**Risk:** Low
**Estimated time:** 15 minutes
**Dependencies:** 003 (AI binding), 001 (gateway created)

---

## Purpose

Attach up to 5 key/value pairs to every AI Gateway request so logs can be filtered by user ID, tenant, session, or feature. Required if you want per-user spend limits (task 015) or per-user rate limits (task 014).

### Real-world iPix example

The Creative Director agent runs in three tenants: Brand A (premium), Brand B (mid), Brand C (trial). Each call needs `tenant_id`, `user_id`, `feature`, and `session_id` attached so the gateway can scope spend rules and the analytics dashboard can compare tenant usage by feature. Without metadata, every request in the dashboard is anonymous and the iPix ops team cannot answer "who is using what."

---

## Recommended Setup Method

**CLI — add the `cf-aig-metadata` header in Worker code that calls `env.AI.run()` (or any fetch to the gateway).**

Priority order: option 2 (simple CLI/library usage). It is a one-liner per request.

---

## Official Links

| Resource | Link |
|----------|------|
| Custom Metadata docs | https://developers.cloudflare.com/ai-gateway/observability/custom-metadata/ |
| Glossary (headers) | https://developers.cloudflare.com/glossary/ |
| AI Analytics dashboard | https://developers.cloudflare.com/ai-gateway/observability/analytics/ |
| AI Binding methods reference | https://developers.cloudflare.com/ai-gateway/usage/worker-binding-methods/ |

---

## Commands

No CLI changes — this is code-level. From inside a Worker calling the AI binding:

```ts
// passing metadata through the AI binding
const resp = await env.AI.run(
  "@cf/meta/llama-4-scout-17b-16e-instruct",
  { messages: [{ role: "user", content: "Plan a shoot" }] },
  {
    gateway: { id: "ipix-default" },
    // metadata keys/values can be string, number, or boolean (no objects)
    metadata: {
      user_id: "u_42",
      tenant_id: "brand_a",
      feature: "production_planner",
      session_id: "s_abc123",
      is_trial: false,
    },
  }
);
```

Or via the REST API header:

```bash
curl -X POST "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/ai/v1/chat/completions" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -H "cf-aig-metadata: user_id=u_42,tenant_id=brand_a,feature=production_planner" \
  -d '{"model":"@cf/meta/llama-4-scout-17b-16e-instruct","messages":[{"role":"user","content":"hi"}]}'
```

Limits: 5 metadata entries per request, types string/number/boolean.

---

## Dashboard Steps

No dashboard setup required. The metadata appears in:
- The AI Gateway analytics Log Explorer as filterable columns.
- The Spend Limits and Rate Limiting rules as scoping dimensions.

To verify in dashboard:
1. Open **AI Gateway**.
2. Select the gateway.
3. Open the **Logs** / **Analytics** tab.
4. Filter by `tenant_id = brand_a` and confirm only those requests appear.

---

## Files Changed

### File 1: `app/src/mastra/tools/production-planner.ts` (or equivalent)

Add the `metadata` object to the second argument of every `ai.run()` call. The Mastra deployer (tasks 029-031) provides the binding.

### File 2: `app/src/lib/ai/gateway-metadata.ts` (new helper)

A small helper that builds metadata from the request context (auth user, tenant, session):

```ts
export function gatewayMetadata(req: RequestContext) {
  return {
    user_id: req.userId,
    tenant_id: req.tenantId,
    feature: req.feature,
    session_id: req.sessionId,
    is_trial: !!req.isTrial,
  };
}
```

---

## Dependencies

| Dependency | Status |
|------------|--------|
| Workers AI binding added | ✅ Task 003 |
| Gateway created | ✅ Task 001 |
| Mastra model registry (for the binding) | Task 031 |

---

## Tests

### Test 1: Metadata is logged

Send a request with metadata.

Pass criteria: The request appears in the gateway analytics with all 5 metadata fields populated.

### Test 2: Filter by metadata

In the dashboard, filter logs by `tenant_id = brand_a`.

Pass criteria: Only requests for brand_a are returned.

### Test 3: Per-user spend limit (paired with task 015)

Configure a spend limit scoped by `metadata.user_id: split by value`. Make one request from user A exceeding the budget, another from user B.

Pass criteria: User A is blocked, user B succeeds.

### Test 4: Empty metadata does not error

Send a request without metadata.

Pass criteria: Request succeeds. No analytics column is populated.

---

## Acceptance Criteria

- [ ] Metadata helper exists in `app/src/lib/ai/gateway-metadata.ts`
- [ ] Every Mastra agent's AI call passes the metadata object
- [ ] At least 5 metadata fields are populated (user_id, tenant_id, feature, session_id, is_trial)
- [ ] Logs in the dashboard are filterable by every metadata field

---

## Rollback

Remove the `metadata` parameter (or the `cf-aig-metadata` header) from the call site. Future requests carry no metadata; existing log entries are preserved until the 3-day log retention window expires.

---

## Evidence Required

1. Screenshot of the gateway analytics filtered by tenant_id, showing filtered results.
2. Code diff showing the `metadata: {...}` object on the AI binding call.

---

## What Custom Code This Removes

Removes any custom logging-sidecar code that annotated AI calls with user IDs before sending them. Removes custom KV-based or D1-based "who called what" audit tables (those become gateway analytics).

---

## User Journey After This Task

> A premium brand's account manager gets a support ticket: "Why was I rate limited at 3 PM yesterday?" The ops team opens the gateway analytics, filters by `tenant_id = brand_premium` and `user_id = u_42`, sees the exact times, models, prompts, and token counts for that user. They confirm the user ran a Creative Director loop that hit the rate limit. They respond to the user with the dashboard screenshot. No ticket escalation, no engineering time spent.
