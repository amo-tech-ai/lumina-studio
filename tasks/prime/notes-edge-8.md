# Verdict

**Three PRs is the right shape, but the target architecture should change.**

**Current specifications: 68/100.**
**After corrections: 94/100.**
**Expected success: 92–95%.**

The most efficient current path is:

```text
PR 1 — Docs
IPI-695 · CF-EDGE-001 — ADR addendum

PR 2 — Code
IPI-696 · CF-EDGE-002 + IPI-697 · CF-EDGE-003
Supabase Deno → Cloudflare AI Gateway REST API → Workers AI

PR 3 — Ops
IPI-699 · CF-EDGE-005 — Secrets, canary and rollback

Later
IPI-698 · CF-EDGE-004 — DNA vision evaluation
IPI-455 · CF-EDGE-B — Full Worker port
```

## Main architectural correction

Do **not** route Supabase Edge through the existing custom `ai-gateway` Worker unless there is a deliberate security reason.

Cloudflare’s current REST API already lets an external runtime call Workers AI through AI Gateway directly:

```text
Supabase Edge
→ api.cloudflare.com/.../ai/v1/chat/completions
→ AI Gateway
→ Workers AI
```

It supports OpenAI-compatible requests and all AI Gateway features without another Worker proxy. Workers AI requests use an `@cf/...` model and the `cf-aig-gateway-id` header. ([Cloudflare Docs][1])

This also matches the repository’s existing architecture decision, which says to stop investing in `services/cloudflare-worker/` and prove Cloudflare-native routing before deleting the custom gateway.

### Security tradeoff

The direct REST path requires a Cloudflare API token. AI Gateway `Run` tokens are account-scoped and cannot be restricted to one gateway. That tradeoff must be explicitly accepted in the ADR. ([Cloudflare Docs][2])

If that token scope is unacceptable, retain the proxy Worker—but then the safe plan is **four concerns**, not three, and **IPI-700 · CF-EDGE-006 — Require Service Authentication on AI Gateway Worker** remains mandatory.

---

# Corrections by task

| Task                                                                                         | Current | Corrected score | Required correction                                                                                          |
| -------------------------------------------------------------------------------------------- | ------: | --------------: | ------------------------------------------------------------------------------------------------------------ |
| **IPI-694 · CF-EDGE-AI — Route Supabase Edge LLM through Cloudflare AI Gateway Worker**      |     62% |             95% | Rename away from “Gateway Worker”; lock direct AI Gateway REST unless proxy isolation is deliberately chosen |
| **IPI-695 · CF-EDGE-001 — ADR: Edge Stays on Deno; LLM via AI Gateway Worker HTTP**          |     55% |             95% | Amend existing architecture decision instead of creating a contradictory standalone ADR                      |
| **IPI-696 · CF-EDGE-002 — Edge LLM Client for Cloudflare AI Gateway and Allowlist**          |     78% |             94% | Merge into IPI-697; use current REST API, not deprecated `/compat` or Universal endpoints                    |
| **IPI-697 · CF-EDGE-003 — Wire Brand Intelligence Edge to Cloudflare Workers AI Path**       |     84% |             96% | Own combined client + BI vertical slice; remove remote deployment from code PR                               |
| **IPI-698 · CF-EDGE-004 — Wire Audit Asset DNA Edge to Cloudflare or Defer Vision**          |     72% |             88% | Park until BI smoke; use a representative evaluation set, not one image                                      |
| **IPI-699 · CF-EDGE-005 — Edge Secrets and Remote Smoke: Gateway Workers AI Without Gemini** |     74% |             94% | Ops-only canary; add privacy headers, negative test and real rollback                                        |
| **IPI-700 · CF-EDGE-006 — Require Service Authentication on AI Gateway Worker**              |     88% |             N/A | Cancel under direct REST architecture; retain only if custom Worker remains                                  |

## IPI-694 · CF-EDGE-AI — Route Supabase Edge LLM through Cloudflare AI Gateway Worker

### Errors

* It locks a custom Worker even though the repository architecture says that Worker is temporary and should eventually be deleted.
* It does not acknowledge Cloudflare’s newer direct REST API.
* The epic itself is shown as blocked by its ADR child, which is unnecessary administrative serialization. 

### Fix

Rename to:

**IPI-694 · CF-EDGE-AI — Route Supabase Edge LLM Through Cloudflare AI Gateway**

Architecture:

```text
Supabase Edge Deno
→ Cloudflare AI Gateway REST API
→ Workers AI
```

Remove `blockedBy: IPI-695`. The ADR and code investigation can run in parallel.

---

## IPI-695 · CF-EDGE-001 — ADR: Edge Stays on Deno; LLM via AI Gateway Worker HTTP

### Red flag

PR #448 adds a separate 219-line ADR while the repository already has:

`tasks/cloudflare/Tasks/000-Architecture-Decision.md`

That existing decision explicitly says the custom Worker should not receive further investment.

### Efficient fix

Change PR #448 into a short addendum covering only:

1. Supabase handlers remain on Deno.
2. External inference uses Cloudflare’s current REST API.
3. Account-scoped API-token risk is accepted or rejected.
4. `/compat` and Universal endpoints are deprecated.
5. Rollback remains Gemini/Groq until canary completion.

Cloudflare directs new integrations to the REST API; Universal and `/compat` endpoints are deprecated. ([Cloudflare Docs][3])

---

## IPI-696 · CF-EDGE-002 — Edge LLM Client for Cloudflare AI Gateway and Allowlist

### Efficient correction

Merge its scope into **IPI-697 · CF-EDGE-003 — Wire Brand Intelligence Edge to Cloudflare Workers AI Path**.

The client and first consumer form one vertical feature:

```text
_shared/llm Cloudflare client
+ provider allowlist
+ Brand Intelligence call sites
+ tests
```

### Required implementation details

Use:

* `CLOUDFLARE_ACCOUNT_ID`
* `CLOUDFLARE_AI_GATEWAY_TOKEN`
* `CLOUDFLARE_AI_GATEWAY_ID`
* current `/ai/v1/chat/completions` endpoint;
* `cf-aig-gateway-id`;
* `cf-aig-collect-log-payload: false`;
* explicit timeout;
* typed non-2xx errors;
* mocked-fetch Deno tests.

AI Gateway stores request and response payloads by default. Setting `cf-aig-collect-log-payload: false` retains operational metadata without storing brand prompts or generated profiles. ([Cloudflare Docs][4])

---

## IPI-697 · CF-EDGE-003 — Wire Brand Intelligence Edge to Cloudflare Workers AI Path

### Corrections

* Absorb IPI-696.
* Remove its `blockedBy: IPI-696` relation.
* Keep code and tests in one PR.
* Do **not** deploy `brand-intelligence` from the code PR. Named deployment and secret changes belong to IPI-699.
* Validate returned JSON against the existing Brand Intelligence schema.

Workers AI supports JSON mode, but Cloudflare states that schema compliance is not guaranteed. Runtime validation and a controlled failure are therefore required. ([Cloudflare Docs][5])

### Done gate

```text
Cloudflare provider selected
+ Gemini SDK not called
+ Gateway request mocked
+ schema validated
+ Gemini/Groq rollback tests green
```

---

## IPI-698 · CF-EDGE-004 — Wire Audit Asset DNA Edge to Cloudflare or Defer Vision

Correctly parked and not blocking IPI-699. 

### Corrections

* Run after BI succeeds remotely.
* Use at least 5–10 representative assets covering:

  * people;
  * products;
  * venue/editorial imagery;
  * low-quality images;
  * difficult lighting.
* Compare field completeness, score stability, latency and cost.
* Do not mark the implementation **Done** merely because it was deferred. Move it to Backlog/Canceled with a linked evaluation task.

Current Workers AI includes vision-capable models, but model capability does not prove parity with the existing Gemini DNA prompts. ([Cloudflare Docs][6])

---

## IPI-699 · CF-EDGE-005 — Edge Secrets and Remote Smoke: Gateway Workers AI Without Gemini

### Missing controls

* “Remote Preview Verified” is inaccurate unless a separate staging Supabase project exists.
* One successful request is insufficient.
* It does not explicitly prevent storage of brand prompt/response payloads.
* It mixes Gemini rotation timing with Cloudflare cutover.

### Correct canary

Run:

1. successful standard brand;
2. large or complex crawl;
3. malformed/invalid request;
4. Cloudflare timeout/failure simulation;
5. rollback to Gemini or Groq.

Record:

* HTTP status;
* structured-schema result;
* provider/model;
* Gateway log ID;
* latency;
* no raw prompt data in evidence;
* rollback result.

Use **Remote Runtime Verified** or **Production Canary Verified**, not Preview, unless an actual preview environment exists.

Supabase secret changes become available immediately and do not require redeploying the function. ([Supabase][7])

---

# Recommended Linear changes

```text
IPI-695
Keep docs-only, but rewrite as an addendum to 000-Architecture-Decision.md.

IPI-696
Cancel as merged into IPI-697, or retain as a secondary issue attached to the same PR.
Remove blockedBy IPI-695.

IPI-697
Retitle:
“IPI-697 · CF-EDGE-003 — Add Cloudflare AI Gateway REST Client and Wire Brand Intelligence”

IPI-698
Keep Backlog/Medium; do not block IPI-699.

IPI-699
Block only on IPI-697.
Change validation wording to Remote Runtime / Canary Verified.

IPI-700
Cancel if direct REST is accepted.
Keep only if the custom Worker proxy remains.
```

## Final sequence

```text
PARALLEL
├─ IPI-695 · CF-EDGE-001 — Short ADR Addendum
└─ IPI-697 · CF-EDGE-003 — Gateway REST Client + Brand Intelligence

THEN
IPI-699 · CF-EDGE-005 — Secrets + Canary + Rollback

LATER
IPI-698 · CF-EDGE-004 — DNA Vision Evaluation
IPI-455 · CF-EDGE-B — Full Handler Port
```

**Bottom line:** the three-PR idea is correct, but the leanest implementation removes the custom AI Gateway Worker from Phase A rather than adding more code and authentication around it.

---

## Linear sync — applied 2026-07-18

Verdict verified against Cloudflare REST/auth docs, `000-Architecture-Decision.md`, and Edge allowlist code. Linear updated:

| Issue | Action |
|-------|--------|
| **IPI-694** | Retitled (drop “Worker”); direct REST architecture; removed `blockedBy` IPI-695 |
| **IPI-695** | Retitled as ADR **addendum** to `000-Architecture-Decision.md` (rewrite PR #448) |
| **IPI-696** | **Canceled** — duplicateOf IPI-697 |
| **IPI-697** | Retitled REST client + BI; absorbs 696; no remote deploy |
| **IPI-698** | Backlog / Medium; blockedBy IPI-699 only |
| **IPI-699** | Ops canary; blockedBy IPI-697 only; Remote Runtime / Canary Verified |
| **IPI-700** | **Canceled** — direct REST Phase A |

[1]: https://developers.cloudflare.com/ai-gateway/usage/rest-api/?utm_source=chatgpt.com "REST API · Cloudflare AI Gateway docs"
[2]: https://developers.cloudflare.com/ai-gateway/configuration/authentication/?utm_source=chatgpt.com "Authenticated Gateway · Cloudflare AI Gateway docs"
[3]: https://developers.cloudflare.com/ai-gateway/usage/universal/?utm_source=chatgpt.com "Universal Endpoint (Deprecated) · Cloudflare AI Gateway docs"
[4]: https://developers.cloudflare.com/changelog/product/ai-gateway/?utm_source=chatgpt.com "AI Gateway Changelog | Cloudflare Docs"
[5]: https://developers.cloudflare.com/workers-ai/features/json-mode/?utm_source=chatgpt.com "JSON Mode · Cloudflare Workers AI docs"
[6]: https://developers.cloudflare.com/workers-ai/models/index.md?utm_source=chatgpt.com "Workers AI Models · Cloudflare Workers AI docs"
[7]: https://supabase.com/docs/guides/functions/secrets?utm_source=chatgpt.com "Environment Variables | Supabase Docs"
