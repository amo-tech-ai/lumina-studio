# Audit verdict

> **Verified 2026-07-18** against live project `nvdlhrodvevgwdsneplk` (MCP `list_edge_functions` + HTTP probes + source).  
> Independent score: **~84/100**. Linear updated: 687→canceled into 685; 686 `blockedBy` 669; 690 unblocked/urgent; added **IPI-692** / **IPI-693**. Plan: `j18-edge-plan.md`.

**Overall plan correctness: 78/100** (author) · **84/100** (live verify).

The six tasks address real findings, but three structural changes would make the wave safer and faster:

1. Do not separate capture-lead security changes from their tests.
2. Do not use Edge-file path filtering for remote inventory drift.
3. Gemini rotation must replace and revoke the key at Google—not only update Supabase and Infisical.

## Scored matrix

| Task                                                                                                   | Spec correct | Success now | Verdict                        |
| ------------------------------------------------------------------------------------------------------ | -----------: | ----------: | ------------------------------ |
| **IPI-685 · SB-EDGE-002 — Harden Capture-Lead Origin Allowlist, Rate Limit, and Transactional Writes** |          68% |         75% | 🟡 Rescope                     |
| **IPI-686 · SB-EDGE-003 — Deno Unit Tests for Firecrawl Webhook and Start Brand Crawl**                |          90% |         95% | 🟢 Good                        |
| **IPI-687 · SB-EDGE-004 — Deno Unit Tests for Capture-Lead After Hardening**                           |          55% |         95% | 🟡 Correct but inefficient     |
| **IPI-688 · SB-EDGE-005 — Restrict or Retire Edge-Test from Production**                               |          86% |         97% | 🟢 Small safe PR               |
| **IPI-689 · SB-EDGE-006 — CI Inventory Gate for Edge Repository, Remote, and Config**                  |          70% |         85% | 🟡 CI design correction needed |
| **IPI-690 · SB-EDGE-007 — Assess Gemini API Key Exposure and Rotate if Needed**                        |          87% |         98% | 🟢 Run immediately             |

---

## Corrections for each task

### IPI-685 · SB-EDGE-002 — Harden Capture-Lead Origin Allowlist, Rate Limit, and Transactional Writes

**Main error:** the scope treats `Origin` as the primary security boundary.

`Origin` and CORS protect browsers, but non-browser clients can call a public HTTP endpoint directly. The current proxy secret only controls whether the claim token is returned; callers without that secret can still create conversations and leads.

**More efficient architecture:**

```text
Public Next.js marketing route
→ distributed rate limit
→ trusted proxy secret
→ capture-lead Edge Function
→ one transactional Postgres RPC
```

Require the proxy secret for **all production writes**, not only the claim-token response. Supabase supports backend-only functions using secret authentication while leaving `verify_jwt=false` for custom-authenticated endpoints. ([Supabase][1])

**Critical fixes:**

* Make `CAPTURE_LEAD_PROXY_SECRET` mandatory in production.
* Deny writes when the secret is absent or invalid.
* Keep origin validation as defense-in-depth, not authentication.
* Move distributed rate limiting to the public app route where possible.
* Otherwise use an existing global Redis implementation such as Supabase’s documented Upstash pattern. ([Supabase][2])
* Use one RPC for conversation, message, event, and draft writes.
* Add rollback/atomicity tests.

**Major efficiency correction:** merge IPI-687 tests into this PR. Security tests are part of the same concern; shipping hardening first and regression protection later creates an unnecessary vulnerable window.

---

### IPI-686 · SB-EDGE-003 — Deno Unit Tests for Firecrawl Webhook and Start Brand Crawl

The two functions belong to one crawl lifecycle, so one shared test PR is efficient. Supabase recommends Deno’s native runner and mocking at the `fetch` boundary for deterministic Edge tests. ([Supabase][3])

**Errors/gaps:**

* The description says IPI-669 blocks it, but Linear has IPI-669 only as `relatedTo`, not `blockedBy`. Fix the actual relation. 
* Use the final neutral test command such as `npm run supabase:test-edge-unit`, not the legacy Groq-named command.
* Export testable handlers instead of relying on modules that immediately call `Deno.serve`.
* Mock `EdgeRuntime.waitUntil` and await the captured promise.
* Test repeated webhook delivery and repeated workflow-resume attempts.

**Missing follow-up:** tests do not solve webhook replay risks. Create a separate task for idempotent workflow resume if duplicate completed/failed events can trigger multiple resumes.

**Will succeed:** **95%** after the blocked relation and handler-test pattern are corrected.

---

### IPI-687 · SB-EDGE-004 — Deno Unit Tests for Capture-Lead After Hardening

The dependency on IPI-685 is correctly represented in Linear. 

However, this task is operationally inefficient.

**Recommended correction:** cancel or merge it into IPI-685.

One concern per PR means:

> capture-lead hardening plus tests proving that hardening

It does not require a separate PR for tests.

If kept separate, it must test:

* missing and invalid proxy secret;
* invalid and absent Origin;
* field-length limits;
* rate-limit denial;
* transactional rollback when one write fails;
* no claim token for untrusted callers;
* happy path through the new RPC.

**Verdict:** technically correct, but unnecessary as a separate task.

---

### IPI-688 · SB-EDGE-005 — Restrict or Retire Edge-Test from Production

The problem is valid: `edge-test` authenticates a user and writes an `ai_agent_logs` record on every successful probe.

**Most efficient option:**

1. Remove the `ai_agent_logs` write.
2. Keep it as an opt-in, read-only authenticated runtime probe.
3. Stop calling it from the default production verify command.
4. Run it only with an explicit flag such as `REQUIRE_AUTH_EDGE_SMOKE=1`.

This preserves an authenticated Edge-runtime test that `health` cannot provide, without creating production log noise.

Delete it only when no authenticated runtime smoke is needed. If deleted, remove:

* remote function;
* repository folder;
* `config.toml` block;
* verify-script caller.

Supabase function configuration supports explicitly controlling per-function deployment and JWT behavior. ([Supabase][4])

**Will succeed:** **97%**.

---

### IPI-689 · SB-EDGE-006 — CI Inventory Gate for Edge Repository, Remote, and Config

The core task is correct, but the trigger strategy is wrong.

Remote drift can be created through the Dashboard or CLI without changing repository files. Therefore, an Edge-file-only job filter can miss the exact drift this task is meant to catch.

**Correct design:**

```text
PR check — secretless
repo directories ↔ config.toml

Trusted scheduled/main check
repo ↔ config.toml ↔ remote Supabase inventory
```

Run the remote comparison:

* after pushes to `main`;
* on a daily schedule;
* manually through `workflow_dispatch`.

Do not require remote secrets on untrusted fork PRs.

Also:

* pin the Supabase CLI version;
* prefer structured Management API/JSON output;
* exclude `_shared`, `tests`, and utility directories;
* compare live `verify_jwt` with `config.toml`;
* use a version-controlled explicit exception file;
* prove one fake local mismatch and one fake remote mismatch fail.

Avoid workflow-level path filtering for required checks because GitHub documents that skipped required workflows can remain Pending and block merging. ([GitHub Docs][5])

IPI-689 remains correctly blocked because IPI-667 is still In Progress in Linear. 

**Will succeed:** **90%** after splitting trusted and secretless checks.

---

### IPI-690 · SB-EDGE-007 — Assess Gemini API Key Exposure and Rotate if Needed

This is the highest-priority immediate task and does not technically need to wait for IPI-667.

**Errors:**

* Updating Supabase and Infisical alone does not rotate the compromised credential.
* Redeploying Edge Functions after changing Supabase secrets is unnecessary; Supabase states secret updates are available immediately. ([Supabase][6])
* A clean log search does not prove no exposure when log retention is limited by plan. ([Supabase][7])

**Correct rotation sequence:**

1. Inventory every current consumer of `GEMINI_API_KEY`.
2. Create/rotate the key at Google with the same or stricter restrictions.
3. Update Infisical and Supabase.
4. Smoke-test `brand-intelligence` and `audit-asset-dna`.
5. Revoke/delete the old key at Google.
6. Confirm usage has moved to the new key.

Google’s official rotation guidance is create replacement → update applications → delete the old key. ([Google Cloud Documentation][8])

Also verify whether the key is an older standard key. Google is transitioning Gemini toward authorization keys and requires tighter restrictions on standard keys. ([Google AI for Developers][9])

**Will succeed:** **98%**.

---

## Missing work

Two gaps remain outside the six tasks:

| Missing task                                                             | Why                                                                                                 |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| **IPI-XXX · SB-EDGE-008 — Make Firecrawl Webhook Resume Idempotent**     | Tests alone do not prevent duplicate completed/failed webhook events from resuming a workflow twice |
| **IPI-XXX · SB-EDGE-009 — Add Per-Brand Crawl Quotas and Cost Controls** | `start-brand-crawl` has request idempotency but no broader per-brand/user crawl quota               |

Supabase recommends designing Edge operations as short-lived and idempotent because instances are concurrent and may cold-start. ([Supabase][10])

## Improved execution order

```text
IMMEDIATE
├─ IPI-690 · SB-EDGE-007 — Gemini Key Exposure Assessment
└─ Finish merge wave: #445 → rerun #442/#443/#444 → #441

PARALLEL
├─ IPI-685 · SB-EDGE-002 — Capture-Lead Hardening + tests
└─ IPI-688 · SB-EDGE-005 — Restrict Read-Only Edge Test

AFTER IPI-669
└─ IPI-686 · SB-EDGE-003 — Crawl Path Deno Tests

AFTER IPI-667
└─ IPI-689 · SB-EDGE-006 — Edge Inventory CI

CANCEL/MERGE
└─ IPI-687 · SB-EDGE-004 — merge into IPI-685
```

**Final assessment:** the follow-up set covers the major findings, but combining IPI-685 and IPI-687 and redesigning IPI-689 would remove duplicate work and reduce security gaps.

[1]: https://supabase.com/docs/guides/functions/auth?utm_source=chatgpt.com "Securing Edge Functions | Supabase Docs"
[2]: https://supabase.com/docs/guides/functions/examples/upstash-redis?utm_source=chatgpt.com "Upstash Redis | Supabase Docs"
[3]: https://supabase.com/docs/guides/functions/unit-test?utm_source=chatgpt.com "Testing your Edge Functions | Supabase Docs"
[4]: https://supabase.com/docs/guides/functions/function-configuration?utm_source=chatgpt.com "Function Configuration | Supabase Docs"
[5]: https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax?utm_source=chatgpt.com "Workflow syntax for GitHub Actions - GitHub Docs"
[6]: https://supabase.com/docs/guides/functions/secrets?utm_source=chatgpt.com "Environment Variables | Supabase Docs"
[7]: https://supabase.com/docs/guides/functions/logging?utm_source=chatgpt.com "Logging | Supabase Docs"
[8]: https://docs.cloud.google.com/docs/authentication/api-keys?utm_source=chatgpt.com "Manage API keys  |  Authentication  |  Google Cloud Documentation"
[9]: https://ai.google.dev/gemini-api/docs/generate-content/api-key?utm_source=chatgpt.com "Using Gemini API keys  |  Gemini Generate Content API (Legacy)  |  Google AI for Developers"
[10]: https://supabase.com/docs/guides/functions?utm_source=chatgpt.com "Edge Functions | Supabase Docs"
