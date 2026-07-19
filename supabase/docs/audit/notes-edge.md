# Audit verdict

**Report correctness: 73/100.**
The inventory and main security direction are good, but the report overstates certainty, contains several contradictions, and recommends deletion before proving inactivity. 

| Area                    |   Score |
| ----------------------- | ------: |
| Function inventory      |     92% |
| Repo caller mapping     |     82% |
| Authentication analysis |     72% |
| Runtime/log evidence    |     50% |
| Security findings       |     78% |
| Remediation safety      |     62% |
| **Overall**             | **73%** |

## Main errors

| Severity | Error                                                                   | Correction                                                                                                                                                                                                                                                          |
| -------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 🔴       | **Deployment count is treated like usage evidence**                     | “108 deployments” means versions deployed, not successful production invocations. Require last invocation, request count, error rate and caller evidence.                                                                                                           |
| 🔴       | **`generate-event-draft` is called public**                             | The same report later says live `verify_jwt=true`. It may lack handler-level auth, but the gateway still requires JWT. Only four legacy functions are confirmed public.                                                                                             |
| 🔴       | **“Quarantine” is implemented as immediate deletion**                   | Deleting is retirement, not quarantine. Preserve source/config, contain access, verify callers/logs, obtain approval, then delete individually. Supabase CLI deletion removes the remote function; `--prune` can delete every remote-only function. ([Supabase][1]) |
| 🔴       | **Legacy functions are marked “unknown,” but `UNKNOWN` group is empty** | The five functions lack proven last-use evidence. They belong in **QUARANTINE / MORE EVIDENCE**, not confirmed retirement.                                                                                                                                          |
| 🟡       | **All 12 allegedly use `GEMINI_API_KEY`**                               | False. `health`, `edge-test`, `capture-lead`, `start-brand-crawl` and `firecrawl-webhook` do not all require Gemini. Generate the matrix from actual `Deno.env.get()` references.                                                                                   |
| 🟡       | **All repo functions allegedly use service role**                       | False. `health` uses no database client, while `edge-test` creates a user-scoped client.                                                                                                                                                                            |
| 🟡       | **Two workflow resume calls are called suspicious duplication**         | They handle different events: one resumes successful crawls and one resumes failed crawls. That is intentional branching, not evidence of earlier failures.                                                                                                         |
| 🟡       | **`waitUntil` is described as likely to terminate early**               | Supabase documents that `EdgeRuntime.waitUntil()` keeps the instance running until the promise completes, subject to platform duration and CPU limits. The real risk is exceeding those limits or losing observability. ([Supabase][2])                             |
| 🟡       | **Firecrawl page upserts are said to lack idempotency**                 | They already use conflict keys based on crawl/scrape ID or crawl/page URL. The missing control is event-level deduplication and idempotent workflow resume.                                                                                                         |
| 🟡       | **Audit Asset DNA RLS warning is inaccurate**                           | It intentionally queries through the resolved caller client and selects explicit fields. RLS restricting an unauthorized caller is expected, not “partial data.”                                                                                                    |
| 🟡       | **Model deprecation claims are unsupported**                            | Verify model availability against the current official Google model/API listing before calling models deprecated or nonexistent.                                                                                                                                    |
| 🟡       | **Scores lack component evidence**                                      | The report gives totals but no per-category scoring breakdown, making 65% production readiness difficult to reproduce.                                                                                                                                              |

## Missed critical risks

### `capture-lead`

This function needs a higher risk rating than 72/100:

* `ALLOWED_ORIGINS` is optional; missing configuration allows every origin.
* Rate limiting uses an in-memory `Map`, so it is not shared across Edge instances and resets on cold starts.
* The rate-limit salt has a hardcoded fallback.
* The request performs several separate writes—conversation, message, event and draft—without one database transaction.
* Event insertion failures are logged but ignored, which can create incomplete audit history.

**Correct score:** approximately **62/100 until hardened**.

Supabase recommends external distributed rate limiting for Edge Functions rather than relying on per-instance memory. ([Supabase][3])

### `edge-test`

It is not merely a health check. It authenticates a user and writes an `ai_agent_logs` row on every probe. That can create production test noise and database growth.

**Better decision:** move it to non-production, restrict it to an admin/test identity, or retire it after replacing the required integration probe.

### Legacy AI functions

Four functions are reportedly public and capable of invoking costly AI/media APIs. Public Edge Functions are valid only when intentionally designed as public and protected inside the handler. ([Supabase][4])

The `generate-media` API-key-in-query-string finding is serious. Preserve the source, search logs for the affected URL pattern, and rotate the Gemini key if exposure cannot be ruled out.

## Corrected function decisions

| Function                 | Revised score | Will succeed?     | Recommendation                             |
| ------------------------ | ------------: | ----------------- | ------------------------------------------ |
| `brand-intelligence`     |           86% | Yes               | Keep; add cost/payload controls            |
| `audit-asset-dna`        |           88% | Yes               | Keep                                       |
| `firecrawl-webhook`      |           80% | Yes after tests   | Keep; add event/resume idempotency         |
| `start-brand-crawl`      |           82% | Yes               | Keep; add quota controls and tests         |
| `capture-lead`           |           62% | Risky under abuse | Harden rate limit and transactional writes |
| `health`                 |           92% | Yes               | Keep; smoke test is enough                 |
| `edge-test`              |           65% | Technically yes   | Restrict or retire from production         |
| `generate-event-draft`   |           35% | Unknown           | Quarantine; JWT status contradicts report  |
| `generate-media`         |           15% | Unsafe            | Immediate containment; likely retire       |
| `generate-image-preview` |           20% | Unsafe publicly   | Immediate containment                      |
| `generate-image-final`   |           15% | Unsafe publicly   | Immediate containment                      |
| `resolve-venue`          |           25% | Unsafe publicly   | Immediate containment                      |

## Critical fixes

1. **Contain the four public legacy AI endpoints now.** Preserve downloaded source and metadata, then either require authentication or deploy a temporary `410 Gone` handler while confirming external callers.
2. **Do not delete all five immediately.** Require last-invocation evidence, external integration checks, ownership confirmation and a rollback package.
3. **Rotate `GEMINI_API_KEY`** if `generate-media` URLs could have reached logs or third-party monitoring.
4. **Harden `capture-lead`:** mandatory origin allowlist, distributed rate limit, field-length limits and one transactional RPC for related writes.
5. **Add tests first for:** `firecrawl-webhook`, `start-brand-crawl`, then `capture-lead`. Supabase recommends Deno unit tests and mocked network integration tests. ([Supabase][5])
6. **Remove or restrict `edge-test`** in production.
7. **Create an exact secret matrix:** referenced, required, optional and currently active provider.
8. **Add an inventory CI gate** comparing repository functions, `config.toml` entries and approved deployed exceptions. The repository currently codifies authentication only for the seven maintained functions.

## Final assessment

* **Inventory:** strong.
* **Legacy risk identification:** directionally correct.
* **Deletion recommendation:** too aggressive.
* **Maintained-function scoring:** slightly too generous.
* **Production readiness:** approximately **55–60%**, not 65%, until the public legacy endpoints and `capture-lead` controls are addressed.
* **Safe to close IPI-667:** **No.**
* **Safe next action:** containment and evidence collection, followed by individually approved retirement.

[1]: https://supabase.com/docs/reference/cli/supabase-projects-list?utm_source=chatgpt.com "CLI Reference | Supabase Docs"
[2]: https://supabase.com/docs/guides/functions/background-tasks?utm_source=chatgpt.com "Background Tasks | Supabase Docs"
[3]: https://supabase.com/docs/guides/functions?utm_source=chatgpt.com "Edge Functions | Supabase Docs"
[4]: https://supabase.com/docs/guides/functions/auth?utm_source=chatgpt.com "Securing Edge Functions | Supabase Docs"
[5]: https://supabase.com/docs/guides/functions/unit-test?utm_source=chatgpt.com "Testing your Edge Functions | Supabase Docs"
