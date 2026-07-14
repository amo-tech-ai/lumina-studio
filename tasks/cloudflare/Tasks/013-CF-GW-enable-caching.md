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

---

## Dashboard Steps

1. Open the Cloudflare dashboard → **AI Gateway**.
2. Select the gateway created in task 001.
3. Select the **Settings** tab (verified against current docs — caching lives under Settings, not a dedicated "Caching" tab).
4. Toggle **Cache Responses** on.
5. Set TTL (default 1 hour is fine; bump to 24 hours for static marketing prompts).
6. Click **Save**.

Machine-checkable pass signal (works without dashboard access): the cached response's `cf-aig-cache-status` header reads `HIT`. Caching only applies to **identical** requests, and only text/image responses (per current docs).

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

Cached entries expire immediately on the next request — no further action required.

---

## Evidence Required

1. Screenshot of the Caching tab showing the toggle is on and TTL is set.
2. Two curl outputs showing the second is served from cache (or analytics dashboard showing cache HIT summary).

---

## What Custom Code This Removes

Removes any in-Mastra or in-Worker response caching code. Custom LRU caches, custom Redis-backed prompt caches, or any in-memory `resultCache` map in the previous gateway Worker can be deleted once AI Gateway caching is on. Custom caching code in `services/cloudflare-worker/` is deleted as part of task 053.

---

## User Journey After This Task

> A marketing lead opens the iPix landing page at 9 AM Monday and asks the chat agent "What does iPix cost?". The agent returns the answer in 480 ms. Twenty other visitors ask the same question before lunch. Each gets the answer in 28 ms. The billing dashboard shows one Workers AI inference charge for the day, not 21. The marketing team ships a campaign landing page that afternoon; the same caching applies the moment the prompt is first asked.
