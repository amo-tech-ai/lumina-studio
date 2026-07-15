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

A misconfigured script in a partner integration accidentally loops the Creative Director agent thousands of times per minute. **Corrected 2026-07-14: the "300 req/min Workers AI account limit" claim below was never verified against current Cloudflare docs — do not assume a specific number without checking current limits/pricing at execution time.** Without rate limiting, that limit (whatever it currently is) returns 429s for every customer — a global outage from one partner's bug.

**Corrected 2026-07-15 (audit finding):** the gateway rate limit configured below (100 req/min) is a single **shared, gateway-wide cap**, not an isolated per-partner scope — standard AI Gateway rate limiting applies to the whole gateway, not per-caller, unless scoped separately with custom metadata. So this scenario is only partially fixed by rate limiting alone: the noisy partner still gets throttled once the shared cap is hit, but so does everyone else sharing that gateway — one bad script can still degrade service for all iPix traffic, just at a higher, capped threshold instead of an unbounded one. Rate limiting bounds the blast radius (429s at 100 req/min instead of an unlimited flood hitting Workers AI's own account limit), it does not isolate the bad actor. True per-partner isolation requires scoping by custom metadata (see task 018) or Spend Limits per caller, not the base rate-limiting feature. Whoever hits the 429 (which could be the buggy partner or an innocent one sharing the cap) gets a clean 429 with a `Retry-After` header to retry correctly (note: `Retry-After` is not a documented guarantee — verify it's actually present before relying on it in application code).

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
# Fire more requests than the configured limit within the window and confirm the excess return 429
for i in {1..20}; do
  curl -s -o /dev/null -w "%{http_code}\n" \
    -X POST "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/ai/v1/chat/completions" \
    -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
    -H "cf-aig-gateway-id: ipix-prod" \
    -d '{"model":"@cf/meta/llama-4-scout-17b-16e-instruct","messages":[{"role":"user","content":"hi"}]}'
done
```

**Corrected 2026-07-14 (real inconsistency, audit finding):** this loop fires 20 requests, but the dashboard rule below is configured for 100 requests/minute — 20 requests would never trigger a 429 against that limit. For an actual demo, either set a temporary low staging rule (e.g. 3 requests / 30 seconds) and use this loop, or fire well over 100 requests to test the real production rule — don't mix a 20-request test loop with a 100-request limit and expect to see 429s.

---

## Dashboard Steps

1. Open the Cloudflare dashboard → **AI Gateway**.
2. Select the gateway.
3. Open the **Rate Limiting** tab.
4. Click **Add rule**.
5. Configure:
   - **Requests:** 100 — treat as a provisional starting value, tune from measured peak traffic and per-agent cost, not chosen to leave headroom under an assumed provider limit
   - **Window:** 1 minute
   - **Scope:** entire gateway is a single shared cap, **not automatically per-user** (corrected 2026-07-14) — for true per-user/per-org limiting, scope by custom metadata (task 018) so each caller is identified separately
6. Click **Save**.

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

**Corrected 2026-07-15 (audit finding):** 20 requests cannot trigger a 429 against the configured 100/minute gateway limit — 20 < 100. Either use a temporary low staging rule for this test, or fire enough requests to exceed the real configured limit.

For a fast test: set a temporary staging rate limit rule (e.g. 3 requests / 30 seconds), then fire 20 requests inside that window.

For testing the actual production rule: fire more than 100 requests inside 60 seconds.

Pass criteria: Requests beyond whichever limit is actually configured for the test return `429 Too Many Requests`.

### Test 2: `Retry-After` header is present

Inspect the 429 response headers.

Pass criteria: `Retry-After` header present with seconds-until-reset.

### Test 3: Limit resets after the window

Fire the limit, wait 60 seconds, fire again.

Pass criteria: The second burst succeeds up to the limit again.

---

## Application-side 429 handling (added 2026-07-14, audit finding)

Rate limiting is not just a gateway toggle — the application must handle a 429 correctly, not treat it as a generic failure:
- Show the user a clear "too many requests, try again shortly" message, not a raw error.
- Retry only when safe to do so, with jittered backoff — never a tight retry loop.
- Never automatically re-execute a tool call on a 429; a retried tool call can have side effects the first attempt already caused.
- Log the agent and tenant/user identifier (hashed, see task 018) so repeated throttling on one tenant is visible in analytics, not just silently retried away.

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

- [ ] Rate limit rule is configured on the gateway
- [ ] Requests beyond the limit return 429
- [ ] `Retry-After` header is returned on 429 — **verify this is actually present in a real response before relying on it; it is not a documented guarantee (corrected 2026-07-14)**
- [ ] Limit resets correctly after the window expires
- [ ] Application handles 429 per the guidance above — no tight retry loop, no automatic tool re-execution

---

## Rollback

Open the Rate Limiting tab → click **Delete** on the rule → Save.

All requests then bypass the cap and fall through to Workers AI's own account-level limit (check current Cloudflare docs for the actual figure — not verified here).

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
