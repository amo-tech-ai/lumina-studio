# Audit verdict

The revised roadmap is **strong and about 94% correct**. The execution order is sensible, official-tool-first, and much more production-aware than the earlier version. 

It will likely succeed, but it is **not production-ready yet** because the remote Worker, authentication, bundle margin, runtime smoke, database persistence, and rollback have not been proven.

## Remaining corrections

| Severity | Finding                                                                  | Required correction                                                                                                                                                                                                                                                  |
| -------- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 🔴       | Preview checklist still says “IPI-468 complete **or** Cloudflare Access” | Remove the “or.” Access is extra protection, not a replacement for application authentication. Require **IPI-468 before upload**, then optionally enable Access.                                                                                                     |
| 🔴       | WAF is listed for the `workers.dev` preview                              | WAF rules are zone-based. For a `workers.dev` preview, use **Cloudflare Access** and/or a **Workers Rate Limiting binding**. Use zone WAF rules after adding a custom domain in your Cloudflare zone. ([Cloudflare Docs][1])                                         |
| 🔴       | Current bundle is already above the internal 9 MiB failure gate          | `9.98 MiB` means preview upload is blocked by your own policy. Add dependency trimming before IPI-472 upload; do not merely record the size. Cloudflare’s hard limits are 3 MB Free and 10 MB Paid after gzip, with a 1-second startup limit. ([Cloudflare Docs][2]) |
| 🟡       | `public/_headers` is treated as the SSR security-header mechanism        | Use Next.js `headers()` or Worker response middleware for dynamic routes. Keep `_headers` for static assets. OpenNext documents `_headers` specifically in its static-asset caching setup. ([OpenNext][3])                                                           |
| 🟡       | Dashboard changes and Wrangler config could drift                        | Cloudflare recommends treating `wrangler.jsonc` as the Worker configuration source of truth. Use Dashboard for Access, WAF and observability, but persist Worker bindings, vars and environments in Wrangler. ([Cloudflare Docs][4])                                 |
| 🟡       | `MASTRA-SUPABASE-004` includes unrelated env cleanup                     | Keep `disableInit` and `schemaName` in the app task. Move duplicate `DATABASE_URL` cleanup to **IPI-626 · SUPA-CLEANUP — Canonical Clients and Environment Configuration**.                                                                                          |
| 🟡       | Hyperdrive task says “per-request `pg.Client`” as an absolute rule       | That matches Cloudflare’s Supabase example, but verify Mastra’s `PostgresStore` can accept the chosen Worker-compatible client or pool path. Do not assume the Node `PostgresStore` constructor can consume a one-request client unchanged.                          |
| ⚪        | The 8.5/9.0 MiB thresholds are presented beside official limits          | Label them clearly as **iPix safety policy**, not Cloudflare requirements.                                                                                                                                                                                           |

---

# Most efficient path by task

| Task                                                                   | Best path                                                                                                               | Official/prebuilt source                                                | Avoid                                     |                                          Success |
| ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------- | -----------------------------------------------: |
| **IPI-625 · CF-BASE-001 — OpenNext Baseline and Type Checks**          | Reuse `npm run check:cf-types`; add one CI step and `.nvmrc`                                                            | Wrangler `types`; OpenNext’s documented `cf-typegen` script             | New type generator                        |                                          **98%** |
| **IPI-468 · SEC-001 — Fail-Closed Operator Authentication**            | Harden existing `withOperatorAuth`; set deployed env to fail closed; add unauthenticated tests                          | Existing app gate + Wrangler vars                                       | New auth framework                        |                                          **95%** |
| **Preview protection**                                                 | Enable one-click Cloudflare Access on the Worker preview URL                                                            | Workers Dashboard → Domains & Routes → Access                           | Custom preview login proxy                |                   **98%** ([Cloudflare Docs][5]) |
| **IPI-472 · INFRA-001 — OpenNext CI Build and Preview Upload**         | Reuse existing OpenNext scripts; `npm run upload -- --env preview` or equivalent verified command                       | `@opennextjs/cloudflare` build/upload scripts and Wrangler environments | Custom deployment service                 |                          **92%** ([OpenNext][3]) |
| **Bundle reduction gate**                                              | Use Wrangler dry-run output; first remove unused providers, duplicate SDKs, Studio-only code and large JSON imports     | `wrangler deploy --dry-run --outdir bundled`                            | Custom bundler                            | **85%** until below 9 MiB ([Cloudflare Docs][2]) |
| **IPI-490 · CF-MIG-210 — Remote Runtime Smoke and Bundle Validation**  | Upload a version, use its versioned preview URL, test health/info/stream/auth                                           | Wrangler version preview URLs                                           | Custom preview infrastructure             |                   **90%** ([Cloudflare Docs][6]) |
| **Marketing rate limit**                                               | On `workers.dev`, use Workers Rate Limiting binding; on custom domain, prefer WAF Dashboard rule                        | Cloudflare Rate Limiting API or WAF rules                               | In-memory counters                        |                   **92%** ([Cloudflare Docs][7]) |
| **CopilotKit rate limit**                                              | Rate Limit binding keyed by authenticated user or organization; optionally add outer WAF IP limit later                 | Workers Rate Limiting API                                               | IP-only custom Map/DO limiter             |                                          **90%** |
| **IPI-627 · CF-SEC-020 — Deployment Security Proof**                   | Generate route inventory from filesystem; test headers with curl/Playwright; use Next `headers()` for dynamic responses | Next/OpenNext runtime + Cloudflare Dashboard events                     | Manual checklist without tests            |                                          **90%** |
| **IPI-616 · CF-DB-001 — Mastra Storage and Schema ADR**                | Use live Supabase inventory, installed Mastra package source, and official storage docs                                 | Mastra `schemaName`, `disableInit`; Supabase private-schema guidance    | Designing a new persistence layer first   |                            **95%** ([Mastra][8]) |
| **Mastra table classification**                                        | Generate matrix from Supabase MCP SQL and map each table to enabled app features                                        | Supabase MCP + installed `@mastra/pg` source                            | Guessing from table names                 |                                          **95%** |
| **MASTRA-SUPABASE-002 — Version-Pinned Mastra Schema Migration**       | Generate DDL from installed package, review it, then create a Supabase migration                                        | `exportSchemas()` + Supabase CLI migration workflow                     | Hand-writing all schema from scratch      |                                          **88%** |
| **Snapshot backup**                                                    | Use Supabase backup first; add table-scoped `pg_dump` for the critical Mastra tables if available                       | Supabase backups + PostgreSQL dump                                      | Copying rows manually                     |                                          **95%** |
| **MASTRA-SUPABASE-003 — Runtime Grants and RLS Security**              | Migration with narrow grants and policies only for classified runtime tables                                            | PostgreSQL grants + Supabase RLS                                        | Granting all 33 tables or `CREATE public` |                          **90%** ([Supabase][9]) |
| **MASTRA-SUPABASE-004 — PostgresStore Runtime Initialization Control** | Set `schemaName` and `disableInit: true`; reuse one store/pool                                                          | Mastra `PostgresStore` options                                          | Runtime DDL                               |                            **95%** ([Mastra][8]) |
| **IPI-245 · Mastra Database Authorization Probes**                     | pgTAP plus runtime-role connection tests and anon REST negative tests                                                   | Supabase testing workflow                                               | Manual Dashboard-only checks              |                                          **92%** |
| **IPI-619 · CF-DB-005 — Hyperdrive Binding**                           | Reuse existing Hyperdrive ID; add binding under each Wrangler environment; regenerate types                             | Wrangler Hyperdrive binding                                             | Creating another configuration            |                                          **98%** |
| **IPI-620 · CF-DB-006 — Hyperdrive Query Helper**                      | Start from Cloudflare’s Supabase/Hyperdrive example; isolate it behind one adapter                                      | Official Hyperdrive Supabase recipe and GitHub docs source              | Custom pool manager                       |                  **90%** ([Cloudflare Docs][10]) |
| **IPI-621 · CF-DB-007 — Tenant Authorization Tests**                   | Two-organization fixtures; test every read/write tool against cross-org access                                          | Existing Vitest tool patterns + PostgreSQL RLS                          | One generic RLS test                      |                                          **90%** |
| **IPI-624 · CF-DB-010 — Hyperdrive Monitoring**                        | Use Workers metrics, logs and Hyperdrive Dashboard metrics before custom alerts                                         | Cloudflare observability Dashboard                                      | Custom telemetry platform initially       |                  **95%** ([Cloudflare Docs][11]) |
| **IPI-623 · CF-DB-009 — One Mastra Workload on Hyperdrive**            | Migrate one thread/message workflow behind a feature flag; retain `noop` rollback                                       | Hyperdrive binding + Mastra storage adapter                             | Migrating every agent at once             |                                          **82%** |
| **IPI-586 · CF-AI-003 — Managed AI Gateway Smoke**                     | Configure `env.AI`; use one temporary protected smoke route                                                             | AI Gateway Workers binding tutorial                                     | New proxy Worker                          |                  **95%** ([Cloudflare Docs][12]) |
| **IPI-594 · CF-MIG-230 — Native Agent Routing**                        | Reuse centralized resolver; migrate agent tiers gradually with evaluation gates                                         | Existing resolver + Workers AI binding                                  | Provider logic inside each agent          |                                          **85%** |
| **Rollback and soak**                                                  | Use Workers Versions rollback and preview/version deployments                                                           | Wrangler versions + Dashboard rollback                                  | Custom rollback scripts                   |                                          **95%** |
| **CF-MIG-810 · Production DNS Cutover and Rollback**                   | Prefer Workers Custom Domain rather than manually creating a CNAME when applicable                                      | Workers Custom Domains Dashboard                                        | Manual DNS wiring without rollback        |                  **95%** ([Cloudflare Docs][13]) |

---

# Official repos and examples to reuse

| Purpose                                                | Reference                                                                                                          |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| OpenNext adapter implementation and current issues     | Official `opennextjs/opennextjs-cloudflare` repository. ([GitHub][14])                                             |
| Mastra framework source and installed-version behavior | Official `mastra-ai/mastra` repository. ([GitHub][15])                                                             |
| Hyperdrive + Supabase recipe source                    | Official Cloudflare docs source file. ([GitHub][16])                                                               |
| External Postgres session pattern through Hyperdrive   | Cloudflare Agents experimental Postgres session example; use as a pattern, not as a Mastra drop-in. ([GitHub][17]) |
| OpenNext setup, bindings and generated scripts         | Official OpenNext guide and bindings reference. ([OpenNext][3])                                                    |

---

# Additional blockers to add

## 1. Bundle trimming must precede upload

The plan says CI fails at 9 MiB, but the current artifact is about 9.98 MiB. Therefore:

```text
IPI-625
→ IPI-468
→ IPI-490 bundle investigation/trim slice
→ IPI-472 preview upload
→ IPI-490 remote runtime smoke
```

Do not create a separate **CF-SIZE-001** issue unless the trim becomes substantial. Fold it into **IPI-490 · CF-MIG-210 — Remote Runtime Smoke and Bundle Validation**.

Likely high-value checks:

* Mastra Studio packages bundled into production.
* Multiple AI provider SDKs.
* Node polyfills introduced by unused dependencies.
* Static documentation or model registry JSON bundled into code.
* Duplicate CopilotKit/Mastra versions.
* Source maps or package assets included in upload.
* Routes importing server modules eagerly at top level.

Cloudflare recommends removing dependencies, moving static/configuration data to platform storage, or splitting workloads with Service Bindings when bundles are too large. ([Cloudflare Docs][2])

## 2. Add real startup headroom

The platform limit is one second, but `999 ms` is not production-safe. Use:

```text
warning ≥ 500 ms
failure ≥ 750 ms
platform limit 1000 ms
```

These are internal safety thresholds, not official limits.

## 3. Test streaming through Access

Cloudflare Access must be tested with:

* CopilotKit SSE.
* Marketing-chat streaming.
* OAuth callbacks.
* Preview smoke automation using a service token.

A preview that loads HTML but breaks SSE is not a successful smoke test.

## 4. Separate browser authorization from database-role authorization

`hyperdrive_mastra_runtime` is a shared server role. RLS policies that simply say:

```sql
TO hyperdrive_mastra_runtime
USING (true)
```

do not provide tenant isolation. They only allow that server role through RLS.

Tenant safety must still come from:

* organization-scoped SQL,
* transaction/session context,
* security-definer functions with validated arguments,
* or tool-level authorization.

This is a production blocker for any multi-tenant Mastra tool.

## 5. Verify Mastra storage compatibility on Workers

The roadmap assumes:

```text
Hyperdrive connection string
→ pg Client
→ PostgresStore
```

But this needs a spike against your exact `@mastra/pg@1.12.0`. Mastra’s official reference documents a connection string or `pg.Pool`, not a `pg.Client`. ([Mastra][8])

The efficient proof is:

1. Build a tiny Worker-only storage adapter test.
2. Create a pool or supported connection method using the Hyperdrive connection string.
3. Run thread create/read.
4. Confirm no global-scope I/O.
5. Confirm connections close or are safely reused.
6. Confirm streaming continues under concurrent requests.

Do this before estimating **IPI-623** as a straightforward configuration change.

---

# Corrected execution order

```text
1. IPI-625 · CF-BASE-001 — OpenNext Baseline and Type Checks
2. IPI-468 · SEC-001 — Fail-Closed Operator Authentication
3. IPI-490 · CF-MIG-210 — Bundle Investigation and Trim Below 9 MiB
4. IPI-472 · INFRA-001 — OpenNext CI and Protected Preview Upload
5. IPI-490 · CF-MIG-210 — Remote Runtime, Streaming and Startup Smoke
6. Workers Rate Limit binding for workers.dev preview
7. IPI-627 · CF-SEC-020 — Deployment Security Proof
8. IPI-616 · CF-DB-001 — Mastra Storage, Schema and Table Classification ADR
9. MASTRA-SUPABASE-002 — Version-Pinned Schema Migration
10. MASTRA-SUPABASE-003 — Runtime Grants and RLS Security
11. MASTRA-SUPABASE-004 — PostgresStore Initialization Control
12. IPI-245 · Mastra Database Authorization Probes
13. IPI-619 → IPI-620 → IPI-621 → IPI-624 → IPI-623
14. IPI-586 → IPI-594
15. Production WAF rules on the custom domain
16. Rollback drill and soak
17. CF-MIG-810 · Production DNS Cutover and Rollback
```

# Readiness

| Environment                  | Readiness |
| ---------------------------- | --------: |
| Local OpenNext build         |   **85%** |
| Protected preview            |   **55%** |
| Local Mastra durable storage |   **35%** |
| Worker durable storage       |   **20%** |
| Security baseline            |   **45%** |
| Production cutover           |   **30%** |
| Roadmap quality              |   **94%** |

## Will it succeed?

* **Current roadmap unchanged:** approximately **75%** chance of reaching a working preview; main risks are bundle size and preview protection.
* **After the corrections above:** approximately **92%** chance of reaching a stable protected preview.
* **Production success:** approximately **80–85%** after Hyperdrive storage, tenant authorization, monitoring and rollback are proven.

## Final decision

**Approved with four final changes:**

1. Code authentication remains mandatory before upload; Access is additional.
2. Trim the bundle below the internal 9 MiB gate before upload.
3. Use the Workers Rate Limit binding on `workers.dev`; reserve zone WAF rules for the custom domain.
4. Prove that the installed Mastra PostgreSQL storage works through Hyperdrive before treating IPI-623 as implementation-ready.

It is **not production-ready yet**, but the plan is now technically sound and efficient enough to execute.

[1]: https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/?utm_source=chatgpt.com "Rate Limiting - Workers"
[2]: https://developers.cloudflare.com/workers/platform/limits/ "Limits · Cloudflare Workers docs"
[3]: https://opennext.js.org/cloudflare/get-started "Get Started - OpenNext"
[4]: https://developers.cloudflare.com/workers/wrangler/configuration/?utm_source=chatgpt.com "Configuration - Wrangler · Cloudflare Workers docs"
[5]: https://developers.cloudflare.com/changelog/post/2025-12-03-reusable-access-policies/?utm_source=chatgpt.com "One-click Access protection for Workers now creates ..."
[6]: https://developers.cloudflare.com/workers/versions-and-deployments/preview-urls/?utm_source=chatgpt.com "Preview URLs - Workers"
[7]: https://developers.cloudflare.com/waf/rate-limiting-rules/?utm_source=chatgpt.com "Rate limiting rules · Cloudflare Web Application Firewall ..."
[8]: https://mastra.ai/reference/storage/postgresql "Reference: PostgreSQL storage | Storage | Mastra Docs"
[9]: https://supabase.com/docs/guides/database/postgres/row-level-security?utm_source=chatgpt.com "Row Level Security | Supabase Docs"
[10]: https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/postgres-database-providers/supabase/ "Supabase · Cloudflare Hyperdrive docs"
[11]: https://developers.cloudflare.com/workers/observability/metrics-and-analytics/?utm_source=chatgpt.com "Metrics and analytics - Workers"
[12]: https://developers.cloudflare.com/ai-gateway/usage/worker-binding-methods/?utm_source=chatgpt.com "Workers Bindings - AI Gateway"
[13]: https://developers.cloudflare.com/workers/configuration/routing/custom-domains/?utm_source=chatgpt.com "Custom Domains · Cloudflare Workers docs"
[14]: https://github.com/opennextjs/opennextjs-cloudflare?utm_source=chatgpt.com "opennextjs/opennextjs-cloudflare: Open Next.js adapter for ..."
[15]: https://github.com/mastra-ai/mastra?utm_source=chatgpt.com "Mastra is the modern TypeScript framework for AI-powered ..."
[16]: https://github.com/cloudflare/cloudflare-docs/blob/production/src/content/docs/hyperdrive/examples/connect-to-postgres/postgres-database-providers/supabase.mdx?utm_source=chatgpt.com "supabase.mdx"
[17]: https://github.com/cloudflare/agents/blob/main/experimental/session-planetscale/README.md?utm_source=chatgpt.com "PlanetScale Postgres Session Example - cloudflare/agents"
