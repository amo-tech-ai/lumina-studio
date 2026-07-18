# Audit review verdict

> **Doc-link verification (2026-07-18):** footnotes [1]–[10] checked against live Supabase/Postgres docs. HIBP = Pro+ ✅ · GraphQL/Data API grant+RLS model ✅ · trigger ≠ client RPC ✅ · PUBLIC EXECUTE default ✅ · RLS empty without policies ✅ · Edge rate-limit ≠ pg_net ✅ · advisors = investigate not bulk-drop ✅ · `(select auth.uid())` initPlan ✅. Live MCP also confirmed the **13** anon DEFINER names (5 triggers + 3 priority RPCs). Linear filed from this note: [IPI-681](https://linear.app/amo100/issue/IPI-681) · refined [IPI-679](https://linear.app/amo100/issue/IPI-679) · [IPI-682](https://linear.app/amo100/issue/IPI-682). CF durability already tracked as [IPI-619](https://linear.app/amo100/issue/IPI-619)/[IPI-623](https://linear.app/amo100/issue/IPI-623) (not new).

**Overall correctness: 64/100.**

The report is useful as a **live inventory and Supabase Advisor export**, but its security interpretation and remediation plan are unreliable. Several recommendations could break production if applied as written. 

| Area                                    | Accuracy |
| --------------------------------------- | -------: |
| Live schema and migration inventory     |      86% |
| Advisor finding counts                  |      90% |
| RLS and function-risk interpretation    |      55% |
| Frontend, Mastra and Cloudflare mapping |      52% |
| Recommended fixes                       |      41% |
| **Overall**                             |  **64%** |

## What is correct

* The migration ledger currently contains 208 applied versions.
* `public` has 114 tables, `planner` 10 and `shoot` 8.
* There are 36 `public` tables with RLS enabled but no policies: 33 Mastra tables and three chatbot tables.
* The reported Advisor categories—unused indexes, unindexed foreign keys, RLS init-plan warnings, overlapping permissive policies and GraphQL exposure—are real.
* Five deployed Edge Functions are missing from the repository.
* Leaked-password protection is currently flagged by the Supabase Security Advisor. Supabase recommends enabling it where the plan supports it. ([Supabase][1])

## Factual and architecture errors

|  # | Audit claim                                                                    | Correction                                                                                                                                   |
| -: | ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
|  1 | 182 tables                                                                     | Live total is **181 tables plus three views**.                                                                                               |
|  2 | 166 tables have RLS                                                            | Live total is **165**.                                                                                                                       |
|  3 | 61 RLS tables have no policies                                                 | Live total is **60** across all listed schemas.                                                                                              |
|  4 | `talent` has nine tables                                                       | It has **eight tables and one view**.                                                                                                        |
|  5 | Seven Mastra agents                                                            | The runtime registry contains **nine agent IDs**, including `default`, `production-planner` and `creative-director`.                         |
|  6 | Mastra uses the Supabase service role exclusively                              | False. Node uses `PostgresStore` through `DATABASE_URL`; Cloudflare currently falls back to `InMemoryStore`.                                 |
|  7 | Two Cloudflare Workers                                                         | Incomplete. The repository also defines the `ipix-operator` OpenNext Worker with observability enabled.                                      |
|  8 | No frontend use of `shoot`                                                     | False. The app contains a live `get-shoot-detail` client wrapper.                                                                            |
|  9 | No frontend/backend use of `talent`                                            | False. The app contains the booking service and Mastra booking tools.                                                                        |
| 10 | No non-Planner RLS tests                                                       | False. Required CI now runs the broad `verify-rls` suite plus chatbot grant assertions.                                                      |
| 11 | Existing RLS tests are mainly Planner                                          | False. The suite covers brands, scores, Assets, CRM, notifications, intake drafts and crawl tables.                                          |
| 12 | Cloudinary invokes `firecrawl-webhook`                                         | Incorrect data-flow diagram. The endpoint receives signed **Firecrawl crawl events**, not Cloudinary uploads.                                |
| 13 | Deployed-only functions cannot be audited                                      | They are not version-controlled, but Supabase MCP can retrieve their deployed source. The real problem is reproducibility and ownership.     |
| 14 | Edge Function versions                                                         | Already stale: live versions are now higher for `edge-test`, Brand Intelligence, Asset DNA, crawl and capture functions.                     |
| 15 | No Stripe tables proves Stripe may be client-side                              | Unsupported inference. The architecture explicitly assigns commerce, orders and payouts to Mercur/Medusa, with Stripe as the payment system. |
| 16 | Supabase needs `stripe_customers`, `stripe_payment_intents` and webhook tables | Conflicts with the documented source-of-truth boundary. Mutable commerce and payment facts must remain in Mercur/Medusa and Stripe.          |

## Security interpretation errors

### 1. GraphQL exposure is overstated

The report turns the Advisor warning into:

> “Any visitor can query all business data.”

That is not proven.

Live results show:

* 79 `public` tables have an `anon` SELECT grant.
* Only 41 have an `anon` or `public` RLS policy.
* RLS remains a separate enforcement layer.

A grant makes a table reachable through the Data/GraphQL API; RLS determines which rows can actually be returned. RLS with no applicable policy returns no rows. ([Supabase][2])

**Correct severity:** important attack-surface reduction work, not confirmed mass data disclosure.

### 2. The 13 anonymous SECURITY DEFINER functions are not equally dangerous

The count is correct, but the classification is wrong:

* Five are trigger functions and cannot be treated like normal client RPCs.
* `get_shoot_detail` rejects unauthenticated callers and verifies ownership.
* `get_brand_assets` rejects unauthenticated callers and verifies brand/org membership.
* `is_org_member`, `is_org_owner` and `is_org_editor_or_above` evaluate the current `auth.uid()` and return false for anonymous callers.

Trigger functions are special functions invoked by triggers; their presence in a function ACL report does not prove a remotely exploitable RPC. ([PostgreSQL][3])

However, three findings deserve immediate attention:

| Function                                     | Actual concern                                                      |
| -------------------------------------------- | ------------------------------------------------------------------- |
| `search_context_snapshots`                   | Accepts arbitrary `p_user_id` and contains no caller-identity check |
| `traverse_brand_graph`                       | Contains no explicit authentication or brand authorization          |
| `identify_rls_policies_needing_optimization` | Allows unauthenticated schema/policy introspection                  |

PostgreSQL grants `EXECUTE` on newly created functions to `PUBLIC` by default, so SECURITY DEFINER functions should normally revoke PUBLIC and grant only intended roles. ([PostgreSQL][4])

### 3. RLS with zero policies is not inherently weak

For the Mastra and chatbot tables, RLS with no policies means ordinary anonymous and authenticated clients are denied. Adding client policies simply to remove the Advisor warning could weaken security. ([Supabase][5])

The correct questions are:

* Should the table be accessible through the Data API at all?
* Should its `anon` and `authenticated` table grants be revoked?
* Does the backend use a direct database connection or service role?

### 4. `verify_jwt: false` does not automatically mean unprotected

`firecrawl-webhook` validates an HMAC signature. Public lead and health endpoints can also perform application-level validation. Each endpoint must be audited from its source, caller and abuse controls rather than graded from `verify_jwt` alone. Supabase supports authentication and rate limiting either at the gateway or inside the function. ([Supabase][6])

## Unsafe recommendations

| Recommendation in audit                         | Problem                                                                                         | Better approach                                                                                      |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Revoke SELECT from `anon` on every public table | Could break intentionally public events, reference data and marketing flows                     | Inventory exact public surfaces and revoke per table                                                 |
| Revoke EXECUTE on every public function         | Could break required RPCs and extension functions                                               | Revoke by exact function signature, then re-grant selectively                                        |
| Re-grant `capture-lead` as an RPC               | Category error; it is an Edge Function                                                          | Test the Edge Function’s endpoint security                                                           |
| Drop 179 unused indexes                         | Unsafe; “unused” can reflect new tables, reset statistics or an insufficient observation window | Review index statistics, query plans, constraints and table sizes before dropping                    |
| Add all 41 missing FK indexes immediately       | Some empty or low-volume tables gain little                                                     | Prioritize high-row and frequently joined tables                                                     |
| Consolidate all overlapping RLS policies        | Multiple permissive policies use intentional OR semantics in some cases                         | Prove an authorization bypass or performance problem first                                           |
| Add policies to all 36 no-policy tables         | Could expose backend-only tables                                                                | Revoke Data API grants where client access is unnecessary                                            |
| Move all extensions from `public`               | Existing dependent objects may break                                                            | Evaluate each extension and dependencies in a branch                                                 |
| Add Stripe state to Supabase                    | Violates the Mercur/Stripe ownership boundary                                                   | Audit the Mercur payment and webhook implementation                                                  |
| Add `deleted_at` everywhere                     | Not appropriate for immutable ledgers, join tables and framework storage                        | Apply only where business recovery requirements justify it                                           |
| Add `created_by`/`updated_by` everywhere        | Blanket schema expansion without use cases                                                      | Define an audit model per sensitive domain                                                           |
| Use `pg_net` for rate limiting                  | `pg_net` is an asynchronous HTTP client, not a rate limiter                                     | Use Edge gateway limits, Cloudflare, or an atomic Redis-based limiter ([Supabase][7])                |
| Require `down.sql` for every migration          | Not a universal Supabase requirement                                                            | Use forward corrective migrations, tested backups and documented rollback procedures ([Supabase][8]) |
| Add vectors to brands, assets and profiles      | Conflates PostgreSQL full-text `tsvector` with embedding vectors                                | Start from proven search use cases and query measurements                                            |

Supabase’s Advisor labels unused indexes and missing indexes as findings to investigate, not permission to bulk-drop or bulk-create without workload evidence. ([Supabase][9])

## Important omissions

1. **No executable anonymous-access proof.** The report should make real anon REST/GraphQL calls and record returned rows, errors and policies.
2. **No function-body authorization matrix.** It counts SECURITY DEFINER grants without inspecting authentication and ownership checks.
3. **No distinction between system schemas and application schemas.** `auth`, `storage` and `realtime` should not be remediated like user-owned tables.
4. **No query-statistics observation period.** The unused-index recommendation lacks reset time, scans, writes, table sizes and query plans.
5. **No deployed-function caller/log inventory.** Missing repository source does not prove a function should be restored rather than retired.
6. **No data classification.** The report does not identify PII, secrets, financial records or tenant-critical tables.
7. **No environment classification.** It does not clearly distinguish shared development, staging and production.
8. **No backup restore drill.** Listing backup availability is weaker than proving a restore into a safe project. Supabase recommends managed backups or CLI dumps depending on plan. ([Supabase][8])
9. **Cloudflare Mastra durability blocker is missing.** The deployed Worker is configured with `MASTRA_STORAGE_MODE=noop`, so it uses in-memory storage rather than the 33 Mastra PostgreSQL tables.
10. **No evidence-linked scoring method.** The 40–95 scores have no weights, formulas or pass/fail criteria.

## Correct critical path (filed)

1. **[IPI-681 · SB-SEC-003 — Prove anonymous Data API and GraphQL row access](https://linear.app/amo100/issue/IPI-681)**  
   Execute actual anon/auth tests per exposed table. Record whether rows are returned, not merely whether a grant exists.

2. **[IPI-679 · SB-SEC-001 — Harden anonymous SECURITY DEFINER grants](https://linear.app/amo100/issue/IPI-679)** *(covers former SB-SEC-004)*  
   Prioritize `search_context_snapshots`, `traverse_brand_graph`, `identify_rls_policies_needing_optimization`. Revoke per exact signature + negative tests. Triggers/helpers are second-pass.

3. **[IPI-667 · SB-EDGE-001 — Quarantine Legacy FashionOS Edge Functions Not in Repo](https://linear.app/amo100/issue/IPI-667)**  
   Inspect deployed source, callers and logs; then retain, migrate or delete each function individually.

4. **[IPI-682 · SB-PERF-001 — Prioritize DB Advisor findings from workload evidence](https://linear.app/amo100/issue/IPI-682)**  
   Fix hot `auth_rls_initplan` with `(select auth.uid())` first; evaluate FK/unused indexes with stats. ([Supabase][10])

5. **Existing [IPI-619](https://linear.app/amo100/issue/IPI-619) / [IPI-623](https://linear.app/amo100/issue/IPI-623) Cloudflare storage work**  
   Restore durable Mastra storage before describing Cloudflare agent persistence as production-ready.

## Final assessment

* **Inventory:** useful and mostly correct.
* **Security posture:** genuinely needs work, but not proven to be the mass exposure claimed.
* **Remediation plan:** unsafe without revision.
* **Production readiness conclusion:** directionally correct that the platform is not fully hardened.
* **Audit readiness for creating migrations:** **No.**
* **Audit readiness as a discovery document:** **Yes, after corrections.**
* **Correctness:** **64/100.**

[1]: https://supabase.com/docs/guides/auth/password-security "Password security | Supabase Docs (HIBP = Pro+)"
[2]: https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically "Breaking Change: Tables not exposed to Data and GraphQL API automatically"
[3]: https://www.postgresql.org/docs/current/functions-trigger.html "PostgreSQL — Trigger Functions"
[4]: https://www.postgresql.org/docs/current/ddl-priv.html "PostgreSQL — Privileges (PUBLIC EXECUTE default)"
[5]: https://supabase.com/docs/guides/troubleshooting/why-is-my-select-returning-an-empty-data-array-and-i-have-data-in-the-table-xvOPgx "Empty select with data — usually RLS"
[6]: https://supabase.com/docs/guides/functions "Edge Functions"
[7]: https://supabase.com/docs/guides/functions/examples/rate-limiting "Rate Limiting Edge Functions"
[8]: https://supabase.com/docs/guides/platform/backups "Database Backups"
[9]: https://supabase.com/docs/guides/database/database-advisors "Performance and Security Advisors"
[10]: https://supabase.com/docs/guides/database/debugging-performance "Debugging performance · see also RLS (select auth.uid())"
