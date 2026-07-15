# IPI-XXX · CF-GW-003 — Enable AI Gateway Caching

**Task ID:** CF-GW-003
**Track:** AI Gateway Features
**Phase:** 2 — Gateway config
**Difficulty:** Easy
**Risk:** Low
**Estimated time:** 10 minutes
**Dependencies:** 001 (gateway created)

---

## Purpose

Turn on response caching in the AI Gateway dashboard so identical prompts return cached results in <50 ms instead of re-running inference. Free model cost on repeated prompts.

### Real-world iPix example

The Marketing Chat agent on the public iPix landing page answers the same ten visitor questions hundreds of times per day ("What services does iPix offer?", "How does the DNA scoring work?", "Can I book a shoot?"). Without caching, every one of those hits Workers AI for 200-500 ms and bills the account. With caching, the first visitor gets the full answer, the next 999 visitors get the cached response in 30 ms and cost $0.

---

## Recommended Setup Method

**Dashboard — flip the caching toggle in the gateway settings.**

Officially supported, zero code, zero CLI. This is option 1 (dashboard setup) in the priority order.

---

## Official Links

| Resource | Link |
|----------|------|
| AI Gateway Caching | https://developers.cloudflare.com/ai-gateway/features/caching/ |
| AI Gateway Get Started | https://developers.cloudflare.com/ai-gateway/get-started/ |
| AI Gateway Features overview | https://developers.cloudflare.com/ai-gateway/features/ |
| AI Gateway Changelog | https://developers.cloudflare.com/ai-gateway/changelog/ |

---

## Commands

Caching is dashboard-only — there is no required CLI command. To verify from CLI:

```bash
# Send the same prompt twice and confirm the second is served from cache
curl -X POST "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/ai/v1/chat/completions" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "cf-aig-gateway-id: ipix-prod" \
  -H "Content-Type: application/json" \
  -d '{"model":"@cf/meta/llama-4-scout-17b-16e-instruct","messages":[{"role":"user","content":"What is iPix?"}]}'
```

**Corrected 2026-07-14:** `<50ms` and "$0" above are illustrative, not documented guarantees — measure actual latency/cost, don't treat them as acceptance requirements. Global one-hour caching is unsafe for personalized, tool-derived, or CRM/brand-data-dependent responses — only enable for deterministic, non-private, read-only prompts (e.g. this file's marketing-FAQ example), not agents that touch client data. Cache key includes the full request body plus the provider auth header, so only genuinely identical requests hit cache.

---

## Dashboard Steps

1. Open the Cloudflare dashboard → **AI Gateway**.
2. Select the gateway created in task 001.
3. Select the **Caching** tab.
4. Toggle **Enable caching** on.
5. Set TTL (default 1 hour is fine; bump to 24 hours for static marketing prompts).
6. Click **Save**.

---

## Files Changed

None. AI Gateway caching is a dashboard-side feature toggled on the gateway, not on the Worker.

---

## Dependencies

| Dependency | Status |
|------------|--------|
| AI Gateway created | ✅ Task 001 |

---

## Tests

### Test 1: Cache hit on identical prompt

Send the same prompt twice within the TTL window.

Pass criteria: The second response returns in <50 ms. The AI Gateway analytics shows `cache: HIT` on the second request.

### Test 2: Cache miss on different prompt

Send two slightly different prompts.

Pass criteria: Both return cache: MISS. Confirms cache is keyed on prompt content.

### Test 3: Cache expires after TTL

Set TTL to 1 minute, send a prompt, wait 70 seconds, repeat.

Pass criteria: The second request returns cache: MISS again.

### Test 4: Different tenant/request body is a cache miss (added 2026-07-14, audit finding)

Send the same prompt text but with different tenant metadata or a different system prompt.

Pass criteria: cache MISS — confirms the cache key includes the full request body, not just the visible prompt text, so tenant/context differences aren't accidentally served a cached response meant for someone else.

### Test 5: Explicit cache bypass for tool-bearing requests (corrected 2026-07-15, audit finding)

**Corrected 2026-07-15:** tool-bearing requests are not automatically excluded from cache — the cache key is derived from the full request body, including the `tools` array, per Cloudflare's caching docs (https://developers.cloudflare.com/ai-gateway/features/caching/). Two identical tool-bearing requests can still return a cache HIT. If stale tool output must never be served, the caller must explicitly opt out.

Send a request that includes a `tools` array, setting the `cf-aig-skip-cache: true` header (the current documented bypass; the older `cf-skip-cache` header is deprecated).

Pass criteria: response is a confirmed cache bypass (not merely a changed cache key or a MISS from a first-time prompt) — verify via the gateway analytics/response metadata that skip-cache was honored. Keep this alongside a second case without the header, sending the same tool-bearing payload twice, to confirm it CAN return cache HIT — proving the two behaviors are distinct and cache bypass for live-state calls is explicit, not assumed.

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

- [ ] Caching is toggled on in the AI Gateway dashboard
- [ ] TTL is configured (1 hour default, 24 hours for marketing prompts)
- [ ] Two identical consecutive prompts return a cache HIT on the second call
- [ ] AI Gateway analytics shows cache hit ratio

---

## Rollback

1. Open the gateway in the dashboard.
2. Toggle caching off.
3. Click Save.

**Corrected 2026-07-14:** cached entries clearing immediately on toggle-off is not a documented Cloudflare guarantee — verify actual behavior rather than assuming, especially if a cached response ever needs to be invalidated urgently (e.g. incorrect content).

---

## Evidence Required

1. Screenshot of the Caching tab showing the toggle is on and TTL is set.
2. Two curl outputs showing the second is served from cache (or analytics dashboard showing cache HIT summary).

---

## What Custom Code This Removes

**Corrected 2026-07-14 (overclaim):** gateway exact-match caching is not equivalent to a general-purpose application cache — it only helps for genuinely identical requests. It does not replace business-logic caches (e.g. a Redis cache keyed on business entities, not raw prompts) that serve a different purpose. Custom caching code in `services/cloudflare-worker/` is only deleted as part of task 053, and only if it's confirmed redundant, not assumed redundant.

---

## User Journey After This Task

> A marketing lead opens the iPix landing page at 9 AM Monday and asks the chat agent "What does iPix cost?". The agent returns the answer in 480 ms. Twenty other visitors ask the same question before lunch. Each gets the answer in 28 ms. The billing dashboard shows one Workers AI inference charge for the day, not 21. The marketing team ships a campaign landing page that afternoon; the same caching applies the moment the prompt is first asked.
