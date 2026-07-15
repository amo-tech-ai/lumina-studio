# IPI-XXX · CF-GW-009 — Enable AI Gateway Guardrails (Content Moderation)

**Task ID:** CF-GW-009
**Track:** AI Gateway Features
**Phase:** 2 — Gateway config
**Difficulty:** Easy
**Risk:** Low
**Estimated time:** 10 minutes
**Dependencies:** 001 (gateway created)

---

## Purpose

Run prompt and response content through Cloudflare's built-in guardrails so toxic, harassing, or policy-violating content is blocked or flagged before reaching the user. Zero code, zero integration.

### Real-world iPix example

A trial user pastes competitor-bashing and inappropriate prompts into the Marketing Chat agent, trying to get the LLM to generate offensive copy. Without guardrails, the model might comply — a reputational risk for iPix. With guardrails configured to "block" on harassment, the request is intercepted, the user receives a clear "content blocked" message, and the incident appears in the gateway analytics with the matched hazard category.

---

## Recommended Setup Method

**Dashboard — enable guardrails on the gateway and pick hazard categories.**

Priority order: option 1 (dashboard setup). No code, no CLI.

---

## Official Links

| Resource | Link |
|----------|------|
| AI Gateway Guardrails | https://developers.cloudflare.com/ai-gateway/features/guardrails/ |
| AI Gateway Features | https://developers.cloudflare.com/ai-gateway/features/ |
| Cloudflare blog on Guardrails | https://blog.cloudflare.com/guardrails-in-ai-gateway/ |
| DLP (companion) | https://developers.cloudflare.com/ai-gateway/features/dlp/ |

---

## Commands

No CLI.

---

## Dashboard Steps

1. Open the Cloudflare dashboard → **AI Gateway**.
2. Select the gateway.
3. Select the **Guardrails** tab (also available under Settings, depending on dashboard version).
4. Toggle **Enable guardrails** on.
5. **Evaluation scope:** choose both — user prompts and model responses.
6. **Hazard categories:** select the categories you want to block or flag. **Verify the exact current list in the dashboard at configuration time** — official docs describe this as customizable rather than publishing a fixed category list; treat any specific category names as a starting point to confirm, not a guaranteed-current set.
7. **Action per category:** Block (recommended for production) or Flag (for analytics only).
8. Save.

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

### Test 1: Hazardous prompt is blocked

Send a known-harassment prompt through the gateway:

```bash
curl -X POST "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/ai/v1/chat/completions" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "cf-aig-gateway-id: ipix-prod" \
  -d '{"model":"@cf/meta/llama-4-scout-17b-16e-instruct","messages":[{"role":"user","content":"<known-harassment test prompt>"}]}'
```

**Pass criteria (corrected 2026-07-14 — the original "400 or 451 with `moderation_blocked`" claim was wrong, re-verified against `developers.cloudflare.com/ai-gateway/features/guardrails/`):** the response contains error code **`2016`**, message `"Prompt blocked due to security configurations"`. A response blocked by the *model's* output instead uses error code **`2017`**, message `"Response blocked due to security configurations"`. No specific HTTP status is documented for either case — match on the error code/message in application logic, don't assume a status code. Analytics logs the matched hazard category.

### Test 2: Safe prompt passes

Send a normal prompt.

Pass criteria: 200 response, no moderation flag.

### Test 3: Flag mode does not block

Toggle one category from Block to Flag, send a matching prompt.

Pass criteria: Response returns successfully but the analytics shows the flagged indicator.

### Test 4: Response guardrails trigger

Force a model to return content matching a hazard category (use a jailbreak-style prompt in staging).

Pass criteria: Response-guardrail triggers, the user sees a safe message block.

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

- [ ] Guardrails enabled on the gateway, starting in **Flag mode**, not Block (added 2026-07-14, audit finding — rolling straight to Block in production is too risky before false-positive rate is known)
- [ ] Evaluation scope includes both prompts and responses
- [ ] Hazard categories selected
- [ ] Action per category set (Block or Flag)
- [ ] At least one blocked request visible in the analytics dashboard
- [ ] False-positive rate measured against curated safe/unsafe test datasets before enabling Block mode in production
- [ ] Blocked-response UX is defined in the application (what the user actually sees), not left as a raw gateway error
- [ ] Tool-calling and structured-output requests have a defined behavior when blocked (not just plain chat)

**Missing companion task (audit finding):** Guardrails evaluates harmful content; it does not cover data loss prevention (DLP) — secrets or sensitive client data appearing in prompts/responses need a separate DLP evaluation, not assumed covered by this task.

---

## Rollback

Open Guardrails tab → toggle **Enable guardrails** off → Save. All future requests bypass moderation.

---

## Evidence Required

1. Screenshot of the Guardrails configuration showing selected hazard categories.
2. Screenshot of a blocked request in the analytics dashboard with the matched hazard reason.

---

## What Custom Code This Removes

**Corrected 2026-07-14 (overclaim):** don't delete custom moderation code immediately on enabling this. Run Guardrails in Flag mode first, measure false-positive rate against real traffic, and only remove the old custom profanity filter / harassment-detection middleware / OpenAI Moderation API wrapper once Guardrails has been proven equivalent or better in production — not on the strength of it being configured.

---

## User Journey After This Task

> An anonymous visitor on the marketing site tries to misuse the chat agent. The agent responds with a calm, messaging-appropriate "content blocked" reply. The iPix policy team reviews the analytics dashboard, sees an uptick in guardrail blocks from a particular region, and decides to add "Violence" to the Block list from the dashboard in 30 seconds. No code change. No deploy.
