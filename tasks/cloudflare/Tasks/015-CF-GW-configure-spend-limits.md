# IPI-XXX · CF-GW-005 — Configure AI Gateway Spend Limits

**Task ID:** CF-GW-005
**Track:** AI Gateway Features
**Phase:** 2 — Gateway config
**Difficulty:** Easy
**Risk:** Low (low risk to configure; medium risk if set too low)
**Estimated time:** 15 minutes
**Dependencies:** 001 (gateway created), 004 (models selected with known pricing)

---

## Purpose

Set cost-based budgets on the AI Gateway. When cumulative spend reaches the limit within a window, AI Gateway blocks further requests with a 429 (or routes to a fallback model via a Dynamic Route). Released June 5 2026 as a generally available feature.

### Real-world iPix example

A premium client's customer success rep accidentally configures a Creative Director agent to use `@cf/openai/gpt-5` for every internal status check instead of the fast tier. Without spend limits, three weeks later the iPix invoice shows $14,000 of unintended OpenAI calls. With a $200/day spend limit on the gateway, the runaway agent hits the cap on day one, the gateway returns 429, and someone notices in 24 hours instead of in the next billing cycle.

---

## Recommended Setup Method

**Dashboard — add a spend limit rule per model, provider, or custom metadata dimension.**

Priority order: option 1 (dashboard setup). No code, no CLI.

---

## Official Links

| Resource | Link |
|----------|------|
| AI Gateway Spend Limits | https://developers.cloudflare.com/ai-gateway/features/spend-limits/ |
| Spend Limits changelog (2026-06-05) | https://developers.cloudflare.com/changelog/post/2026-06-05-spend-limits/ |
| Unified Billing | https://developers.cloudflare.com/ai-gateway/features/unified-billing/ |
| Dynamic Routing for fallback | https://developers.cloudflare.com/ai-gateway/features/dynamic-routing/ |

---

## Commands

No CLI required. Verify the budget enforcement with a single request:

```bash
# Send a request that should be blocked because the limit is already exhausted for the day
curl -X POST "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/ai/v1/chat/completions" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "cf-aig-gateway-id: ipix-prod" \
  -d '{"model":"openai/gpt-5","messages":[{"role":"user","content":"long prompt..."}]}'
```

**Corrected 2026-07-14:** spend limits are eventually consistent — a burst of concurrent requests can briefly exceed the configured threshold before enforcement catches up, and cost figures are best-effort estimates, not a guaranteed hard billing cap. Reconcile against actual provider billing periodically. For testing, use a tiny staging budget (e.g. $0.01) with a low-cost model rather than spending to a production-sized cap.

---

## Dashboard Steps

1. Open the Cloudflare dashboard → **AI Gateway**.
2. Select the gateway.
3. Open the **Spend Limits** tab.
4. Click **Add rule**.
5. Configure:
   - **Budget:** $200 USD
   - **Window:** 1 day (rolling)
   - **Scope settings:**
     - Default rule for the whole gateway (cap total daily spend)
     - Plus per-user rule using `metadata.user_id` split by value (cap each user at $20/day) — **corrected 2026-07-14 (audit finding): use a server-generated hashed identifier, not a raw `user_id`, as gateway metadata is visible in analytics/logs and shouldn't carry raw user identity**
6. Click **Save**.

**⚠️ Production readiness blocker, added 2026-07-14 (audit finding):** do not enable Block mode in production until the application UI actually handles the blocked-request state (a clear "budget reached" message, not a raw error) and an operator can raise or disable the limit quickly without a deploy. Enabling blocking before that UX exists turns a cost guardrail into a surprise outage.
7. (Optional) Pair with a Dynamic Route that has a cheaper fallback model — see task 015.

You may define up to 20 spend limit rules per gateway.

---

## Files Changed

None.

---

## Dependencies

| Dependency | Status |
|------------|--------|
| AI Gateway created | ✅ Task 001 |
| Models selected with known pricing | ✅ Task 004 |
| Custom metadata (user_id) attached to requests | Task 018 |

---

## Tests

### Test 1: Hard block when limit hit

Send requests until cumulative spend exceeds the limit.

Pass criteria: Requests after the limit return 429. The 429 message identifies the spend limit rule that was triggered.

### Test 2: Per-user limit is independent

Two users send requests; user A hits their $20 cap, user B keeps succeeding until they hit their own.

Pass criteria: User A blocked, user B succeeds. Confirms split-by-value dimension works.

### Test 3: Window reset

Wait until the rolling window passes (or the fixed window resets).

Pass criteria: Requests succeed again at the start of the new window.

### Test 4: Fallback model via dynamic route

If paired with task 015 (Dynamic Routing), verify that requests fall back to the cheaper model instead of returning 429.

Pass criteria: No 429 — requests return model responses from the fallback model.

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

- [ ] At least one spend limit rule configured on the gateway
- [ ] Per-user spend limit configured using metadata.user_id (when task 018 is complete)
- [ ] Request above the cap returns 429 (or routes to the configured fallback model)
- [ ] Limit resets correctly after the window

---

## Rollback

Open the Spend Limits tab → click **Delete** next to the rule → Save.

The gateway stops enforcing the budget.

---

## Evidence Required

1. Screenshot of the spend limit rule list showing the configured budget and window.
2. Screenshot of a 429 response (or fallback model response) after the limit is hit.

---

## What Custom Code This Removes

Removes any custom cost-estimation, token-counting, budget-tracking, or "spend guard" middleware in the gateway Worker. Custom per-user budget code (KV-backed counters with TTL) can be deleted. These are all replaced by gateway-side enforcement.

---

## User Journey After This Task

> The operator of a large fashion brand license uses the Creative Director agent heavily for a new campaign. After 200 generations on day one, the gateway blocks the 201st request with a 429 and surfaces it in the analytics dashboard. A billing admin reviews the spend limit alert the next morning, sees the usage is legitimate, and bumps the user-specific rule from $50/day to $200/day from the dashboard in 30 seconds. No code change. No deploy. The platform stops the bleed if it ever occurs.
