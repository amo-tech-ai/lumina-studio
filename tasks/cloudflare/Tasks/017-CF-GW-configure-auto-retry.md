# IPI-XXX · CF-GW-007 — Configure AI Gateway Auto-Retry

**Task ID:** CF-GW-007
**Track:** AI Gateway Features
**Phase:** 2 — Gateway config
**Difficulty:** Easy
**Risk:** Low
**Estimated time:** 5 minutes
**Dependencies:** 001 (gateway created)

---

## Purpose

Enable auto-retry of transient upstream failures (429, 503, network timeout) before the error reaches the Worker code. Built into the AI Gateway since April 2026.

### Real-world iPix example

At 11 PM the Anthropic API rate-limits the Brand Intelligence agent. The previous custom router handled this in Node code: intercept the 429, retry with exponential backoff. The new gateway retries it at the platform layer before the Worker ever sees it — zero app code, zero timing bugs, zero risk of `process.env.REQUEST_TIMEOUT` race conditions.

---

## Recommended Setup Method

**Dashboard — set retry behavior on the gateway (or via request headers per-call).**

Priority order: option 1 (dashboard).

---

## Official Links

| Resource | Link |
|----------|------|
| Auto-retry changelog (Apr 2026) | https://developers.cloudflare.com/changelog/post/2026-04-02-auto-retry-upstream-failures/ |
| Request handling (retry headers) | https://developers.cloudflare.com/ai-gateway/configuration/request-handling/ |
| Fallbacks config | https://developers.cloudflare.com/ai-gateway/configuration/fallbacks/ |

---

## Commands

No CLI required. Per-request retry overrides via headers:

```bash
curl -X POST "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/ai/v1/chat/completions" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "cf-aig-gateway-id: ipix-prod" \
  -H "cf-aig-max-attempts: 5" \
  -H "cf-aig-retry-delay: 1000" \
  -H "cf-aig-backoff: exponential" \
  -H "Content-Type: application/json" \
  -d '{"model":"@cf/meta/llama-4-scout-17b-16e-instruct","messages":[{"role":"user","content":"hi"}]}'
```

**Corrected 2026-07-14 (audit findings):** the Worker does not skip the failure process — it waits for the gateway's final response after retries complete, it doesn't get notified retry-by-retry. Never retry a request whose side effect already happened (a tool call) — retries belong to the model-inference layer, not tool execution. Do not test against a genuinely unreliable random upstream for a demo; use a controlled failure simulation instead. Define a total user-facing latency budget (attempts × delay must stay under whatever the agent's UX can tolerate) before picking attempt/delay values.

Header reference:
- `cf-aig-max-attempts` — max tries including the initial request. **Platform ceiling: 5 retry attempts** (verified against `developers.cloudflare.com/ai-gateway/configuration/request-handling/` — Cloudflare's own docs use "retry attempts," not just "attempts")
- `cf-aig-retry-delay` — delay between attempts in milliseconds. **Platform ceiling: 5000ms**
- `cf-aig-request-timeout` — per-attempt timeout in milliseconds

---

## Dashboard Steps

1. Open the Cloudflare dashboard → **AI Gateway**.
2. Select the gateway.
3. Open the **Settings** tab (or **Request Handling** depending on dashboard version).
4. **Enable Auto-Retry** toggle on.
5. Set defaults:
   - **Max attempts:** 3
   - **Retry delay:** 1000 ms
   - **Backoff:** exponential
6. Save.

Per-request overrides via request headers override the dashboard defaults.

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

### Test 1: Retry on transient failure

Point the gateway at a model that intermittently returns 503 (or simulate by hitting an upstream that does). Send one request.

Pass criteria: The single request is retried automatically. The Worker receives a 200 response. The analytics dashboard shows 3 attempts for one final 200.

### Test 2: Per-request override respected

Send a request with `cf-aig-max-attempts: 1` while dashboard default is 3, force an upstream failure.

Pass criteria: Only 1 attempt is made, the upstream error is returned to the caller. Confirms header override works.

### Test 3: Non-retryable status not retried

Force a 400 Bad Request from the upstream.

Pass criteria: Single attempt, immediate 400 returned to caller. Auto-retry does not retry client errors.

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

- [ ] Auto-retry enabled in the dashboard or per-request header
- [ ] Max attempts, delay, and backoff configured
- [ ] Retry only fires on retryable (5xx/429/timeout) errors, not client (4xx) errors
- [ ] Per-request headers can override dashboard defaults

---

## Rollback

Open the gateway settings → toggle Auto-Retry off → Save. Or simply set `cf-aig-max-attempts: 1` on per-request calls.

---

## Evidence Required

1. Screenshot of the gateway retry settings.
2. Analytics log showing multiple attempts for one successful request.

---

## What Custom Code This Removes

Removes the custom retry wrapper code currently in the gateway Worker:
- Custom exponential-backoff loops
- `retry-classifier.ts` (112 lines) — gated "is this error retryable" logic
- Custom timeout combinator and `Promise.race` patterns
- Any `setTimeout`-based retry scheduler in Mastra tools

All deleted as part of task 053.

---

## User Journey After This Task

> The iPix backend briefly experiences a Cloudflare regional hiccup. Three retries happen automatically inside the gateway. The user's loading spinner completes normally. No one knows. The analytics dashboard logs a clean 200 with retries: 3.
