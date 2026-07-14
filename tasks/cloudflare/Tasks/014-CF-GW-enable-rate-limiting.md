# IPI-XXX · CF-GW-004 — Enable AI Gateway Rate Limiting

**Task ID:** CF-GW-004
**Track:** AI Gateway Features
**Phase:** 2 — Gateway config
**Difficulty:** Easy
**Risk:** Low
**Estimated time:** 10 minutes
**Dependencies:** 001 (gateway created)

---

## Purpose

Cap the number of requests a single user, IP, or session can send through the AI Gateway per minute. Protects the platform from runaway loops, abusive scrapers, and accidental infinite recursion.

### Real-world iPix example

A misconfigured script in a partner integration accidentally loops the Creative Director agent 5,000 times per minute. Without rate limiting, Workers AI's own 300 req/min limit returns 429s for every customer — a global outage from one partner's bug. With rate limiting at the gateway, that one partner hits a 100 req/min cap, the rest of iPix traffic flows normally, and the partner gets a clean 429 with a `Retry-After` header to retry correctly.

---

## Recommended Setup Method

**Dashboard — add a rate limit rule in the gateway.**

Priority order: option 1 (dashboard setup). No code.

---

## Official Links

| Resource | Link |
|----------|------|
| AI Gateway Rate Limiting | https://developers.cloudflare.com/ai-gateway/features/rate-limiting/ |
| AI Gateway Get Started | https://developers.cloudflare.com/ai-gateway/get-started/ |
| AI Gateway Dynamic Routing | https://developers.cloudflare.com/ai-gateway/features/dynamic-routing/ |

---

## Commands

No CLI required. Verify with a loop:

```bash
# Fire 20 requests and confirm requests 11+ return 429
for i in {1..20}; do
  curl -s -o /dev/null -w "%{http_code}\n" \
    -X POST "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/ai/v1/chat/completions" \
    -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
    -d '{"model":"@cf/meta/llama-4-scout-17b-16e-instruct","messages":[{"role":"user","content":"hi"}]}'
done
```

Expected: first 10 return 200, rest return 429.

---

## Dashboard Steps

1. Open the Cloudflare dashboard → **AI Gateway**.
2. Select the gateway.
3. Open the **Rate Limiting** tab.
4. Click **Add rule**.
5. Configure:
   - **Requests:** 100
   - **Window:** 1 minute
   - **Scope:** entire gateway (or per custom metadata key — see task 018).
6. Click **Save**.

Optionally scope by `metadata.user_id` to enforce per-user limits.

---

## Files Changed

None.

---

## Dependencies

| Dependency | Status |
|------------|--------|
| AI Gateway created | ✅ Task 001 |

---

## Tests

### Test 1: Limit is enforced

Fire 20 requests inside 60 seconds.

Pass criteria: Requests beyond the configured limit return `429 Too Many Requests`.

### Test 2: `Retry-After` header is present

Inspect the 429 response headers.

Pass criteria: `Retry-After` header present with seconds-until-reset.

### Test 3: Limit resets after the window

Fire the limit, wait 60 seconds, fire again.

Pass criteria: The second burst succeeds up to the limit again.

---

## Acceptance Criteria

- [ ] Rate limit rule is configured on the gateway
- [ ] Requests beyond the limit return 429
- [ ] `Retry-After` header is returned on 429
- [ ] Limit resets correctly after the window expires

---

## Rollback

Open the Rate Limiting tab → click **Delete** on the rule → Save.

All requests then bypass the cap and fall through to Workers AI's own 300 req/min account limit.

---

## Evidence Required

1. Screenshot of the rate limit rule in the dashboard.
2. curl loop output showing the 200 → 429 transition.

---

## What Custom Code This Removes

Removes any custom throttling code in the Worker, ip-based rate limit maps, or per-user request counters in KV. Custom rate-limit middleware in `services/cloudflare-worker/` is deleted as part of task 053.

---

## User Journey After This Task

> A QA engineer accidentally leaves a load test loop running against the staging endpoint. Within 60 seconds, the AI Gateway starts returning 429s. The dashboard logs the throttled calls, the on-call engineer gets an alert from the gateway analytics, the partner's buggy script starts receiving `Retry-After` headers, and the production traffic from real users continues to flow normally. No global outage. No risk of Workers AI account-level throttling. The engineer kills the script and the gateway returns to normal within the next minute.
