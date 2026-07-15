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
    gateway: {
      id: "ipix-prod", // matches the gateway created in Task 001 — not "ipix-default"
      // Corrected 2026-07-14: metadata must be nested INSIDE the gateway object,
      // not a sibling key at the top level (verified against
      // developers.cloudflare.com/ai-gateway/usage/worker-binding-methods/).
      // Keys/values can be string, number, or boolean (no objects).
      // Illustrative only — use hashed identifiers in real code (see File 2
      // below), not raw user_id/tenant_id, since metadata is visible in
      // analytics/logs, not a secure store.
      metadata: {
        user_id: "u_42",
        tenant_id: "brand_a",
        feature: "production_planner",
        session_id: "s_abc123",
        is_trial: false,
      },
    },
  }
);
```

Or via the REST API header:

```bash
curl -X POST "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/ai/v1/chat/completions" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "cf-aig-gateway-id: ipix-prod" \
  -H "Content-Type: application/json" \
  -H 'cf-aig-metadata: {"user_id":"u_42","tenant_id":"brand_a","feature":"production_planner"}' \
  -d '{"model":"@cf/meta/llama-4-scout-17b-16e-instruct","messages":[{"role":"user","content":"hi"}]}'
```

**Corrected 2026-07-14 (real bugs, verified against `developers.cloudflare.com/ai-gateway/observability/custom-metadata/`):** the `cf-aig-metadata` header value is **JSON**, not the old comma-separated `key=value,key=value` format shown here previously. Limits: up to 5 metadata entries per request — if more than 5 are provided, only the first 5 are saved (not an error, just silently dropped past 5).

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

### File 2: `app/src/lib/ai/gateway-context.ts` (new helper, added 2026-07-14 — corrected location and content per audit finding)

**Never store in gateway metadata** (it's visible in analytics/logs, not a secure store): names, email addresses, client brand names, raw session tokens, authorization IDs, private URLs, tool arguments, or raw Supabase identifiers unless formally approved.

**Implement this once, centrally** — not inside every individual Mastra tool file (audit finding: putting it in `production-planner.ts` etc. means every new agent has to remember to add it manually and drifts out of sync). A small helper in one shared location, called from wherever the AI binding is invoked, ensures every call gets normalized metadata automatically:

```ts
export function gatewayMetadata(req: RequestContext) {
  return {
    tenant_hash: hash(req.tenantId),
    actor_hash: hash(req.userId),
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
