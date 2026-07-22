# ADR — IPI-616 · CF-DB-001 — Mastra Storage and Schema

**Status:** Accepted (2026-07-22)
**Type:** Architecture Decision Record only — **no production schema changes in this ticket**
**Linear:** https://linear.app/amo100/issue/IPI-616

---

## Context (live probes 2026-07-22, Supabase MCP against `nvdlhrodvevgwdsneplk`)

| Fact | Value |
| --- | --- |
| Live `mastra_*` tables | **33**, all in `public`, all owned by `postgres` |
| `mastra` schema | Does not exist yet (`pg_namespace` check empty) |
| `hyperdrive_mastra_runtime` role | Exists (IPI-617 Done), `rolbypassrls=false`, not superuser, not table owner |
| Grants on `hyperdrive_mastra_runtime` | **Partial** — SELECT/INSERT/UPDATE/DELETE already exist on exactly 3 tables: `mastra_threads`, `mastra_messages`, `mastra_workflow_snapshot` |
| RLS policies on `mastra_*` | **Zero** — `rls_enabled=true` on all 33, but `pg_policies` is empty. Full default-deny today, not a too-permissive `USING (true)` |
| `max_connections` | 60 |
| Installed package | `@mastra/pg@1.12.0` |
| `@mastra/pg` `exportSchemas('mastra')` output | Generates DDL for **24 tables** (verified by calling the real function, not reading docs) |
| Live tables not in `exportSchemas()` output | **9**: `mastra_mcp_clients`, `mastra_mcp_client_versions`, `mastra_mcp_servers`, `mastra_mcp_server_versions`, `mastra_skills`, `mastra_skill_versions`, `mastra_skill_blobs`, `mastra_workspaces`, `mastra_workspace_versions` |
| App storage mode | `MASTRA_STORAGE_MODE=noop` on Workers (`InMemoryStore`); Node dev uses `PostgresStore` with default init (`app/src/mastra/storage.ts`) |
| `mastra dev` | `42501` insufficient-privilege error on table creation — root cause not fully isolated, but zero RLS policies is a likely contributor once the connecting role hits a Hyperdrive-scoped role instead of `postgres` |

---

## Decision 1 — Schema placement: private `mastra` schema

**Chosen: create tables in a new private `mastra` schema, not `public`.**

Why:
- Supabase's [API security guide](https://supabase.com/docs/guides/api/securing-your-api) recommends non-`public` schemas for tables that should never be reachable via the Data API (PostgREST only exposes schemas listed in `config.toml`'s `schemas = [...]`) — Mastra internals (agent memory, workflow snapshots, traces) have no reason to be REST-addressable.
- `public` today mixes Mastra internals with iPix product tables (`brands`, `crm_deals`, `shoots`, ...). A private schema draws a hard boundary that a stray `GRANT ... ON ALL TABLES IN SCHEMA public` can no longer cross.
- `@mastra/pg`'s `PostgresStore` supports `schemaName` natively — no custom code needed, confirmed via the installed package's own type signature and this ADR's live `exportSchemas('mastra')` call.

Rejected: keep `public`. This is what's live today and is exactly the state IPI-628 needs to migrate away from — it's the reason a single overly-broad grant can currently touch both Mastra internals and product data in one statement.

**Also rejected: Cloudflare-native storage (`@mastra/cloudflare`), instead of Postgres at all.** Mastra ships a first-party Cloudflare storage package (`stores/cloudflare` in the Mastra monorepo, `@mastra/cloudflare@1.3.3-alpha.1`) exporting `CloudflareKVStorage` (backed by a KV namespace) and `CloudflareDOStorage` (backed by a Durable Object's `SqlStorage`) — neither is installed in `app/package.json` today. Both were considered and rejected for two concrete reasons, not just "we didn't look":
- **No observability domain support.** `@mastra/core`'s `StorageDomains` type defines an optional `observability` key (the trace/span store IPI-628's `mastra_ai_spans` table backs via `@mastra/pg`'s `ObservabilityPG`). Both Cloudflare adapters' `stores` objects only populate `{ memory, workflows, scores, backgroundTasks }` — no `observability` key exists in either. Moving to Cloudflare-native storage today would mean losing agent trace/span data outright, not just re-implementing it elsewhere.
- **A second persistence system, not a simpler one.** iPix's product data (`brands`, `crm_deals`, `shoots`, ...) already lives in this same Supabase Postgres database, with its own RLS conventions and observability tooling (Supabase MCP `get_advisors`, `get_logs`, `list_tables`). Splitting Mastra's runtime state into KV/Durable Objects would mean maintaining two storage systems with two different security models instead of one, for tables that need no more than what Postgres/RLS already does well.

This alternative was practically resolved before it was explicitly written down here: IPI-620B's PostgresStore/Hyperdrive compatibility spike (PR #609) already proved the Postgres-via-Hyperdrive path works in the Workers runtime, so by the time this gap in the ADR was noticed, the decision had already been made and executed. This note exists for a future reader asking "why not just use Durable Objects" — not to reopen the question.

## Decision 2 — Table classification: 24 runtime vs 9 excluded

**Chosen: migrate only the 24 tables `exportSchemas('mastra')` generates. Exclude the 9 Studio/feature tables.**

Verified directly (not from memory or old docs) by calling the installed `@mastra/pg@1.12.0`'s `exportSchemas('mastra')` function and diffing its output against the 33 live tables:

**Runtime (24 — migrate):** `mastra_agent_versions`, `mastra_agents`, `mastra_ai_spans`, `mastra_background_tasks`, `mastra_channel_config`, `mastra_channel_installations`, `mastra_dataset_items`, `mastra_dataset_versions`, `mastra_datasets`, `mastra_experiment_results`, `mastra_experiments`, `mastra_favorites`, `mastra_messages`, `mastra_observational_memory`, `mastra_prompt_block_versions`, `mastra_prompt_blocks`, `mastra_resources`, `mastra_schedule_triggers`, `mastra_schedules`, `mastra_scorer_definition_versions`, `mastra_scorer_definitions`, `mastra_scorers`, `mastra_threads`, `mastra_workflow_snapshot`

**Excluded (9 — Mastra Studio / agent-builder tooling, not used by iPix's production agents):** `mastra_mcp_clients`, `mastra_mcp_client_versions`, `mastra_mcp_servers`, `mastra_mcp_server_versions`, `mastra_skills`, `mastra_skill_versions`, `mastra_skill_blobs`, `mastra_workspaces`, `mastra_workspace_versions`

iPix's app never registers MCP clients/servers, Mastra Skills, or Workspaces — these tables exist only because `mastra dev`'s auto-init created every table Mastra's storage layer knows about, not because the app uses them.

**Active-use subset today** (from live row counts): `mastra_threads` (25 rows), `mastra_messages` (50), `mastra_workflow_snapshot` (5,712), `mastra_schedules` (1), `mastra_schedule_triggers` (5,668). These five already carry real data; the rest of the 24 are schema-ready but empty. IPI-629's grants apply to all 24 uniformly — narrowing further is unnecessary complexity for tables that cost nothing empty.

## Decision 3 — Hyperdrive vs Data API boundary

Mastra's `PostgresStore` talks to Postgres directly (SQL, not REST) — it is **never** exposed through the Supabase Data API/PostgREST. Because the tables live in a private `mastra` schema (Decision 1), PostgREST cannot reach them even if someone forgot to configure `config.toml`'s `schemas` list — this is enforced by schema placement, not by discipline alone.

Hyperdrive (when IPI-619/620/623 land) is a connection-pooling proxy in front of this same SQL path — it changes *where the connection is dialed from* (Cloudflare Worker vs Node process), not *how* authorization works. The role (`hyperdrive_mastra_runtime`) and its grants/RLS (Decision 4) are identical whether the connection arrives via Hyperdrive or a direct Node `pg` connection.

## Decision 4 — RLS / tenant model (not `USING (true)`)

`hyperdrive_mastra_runtime` is **not** a bypass-RLS role (`rolbypassrls=false`, confirmed live) and does not carry a Supabase JWT — `auth.uid()` is unavailable to it. Today it has zero RLS policies at all (full default-deny). IPI-629 must create real policies, and per IPI-621's already-documented findings: **a blanket `USING (true)` policy is role-passthrough, not tenant isolation.** Mastra threads/messages/workflow snapshots are scoped by `resourceId`/`threadId` at the application layer (Mastra's own model), not by a Postgres-native `organization_id` column — so IPI-629's policies should scope by role membership (deny `anon`/`authenticated`, allow only the runtime role), and any cross-*iPix-tenant* isolation (which Mastra thread belongs to which iPix organization) is enforced by the application passing the correct `resourceId`/`threadId`, verified by IPI-621's tests — not by a Postgres RLS predicate Mastra's own schema has no column for today.

## Decision 5 — Cache strategy

Fresh-only (no Hyperdrive caching) until IPI-622 benchmarks prove a cached config is safe. Hyperdrive's cache does not invalidate on write — an immediate read-after-write (a chat message right after being sent) could return stale data with caching on.

## Decision 6 — Connection budget

`max_connections=60` confirmed live. Current Hyperdrive config limit is 20 (IPI-618, already provisioned). No change recommended here — IPI-624 measures real concurrent usage before adjusting, per its own acceptance criteria.

## Decision 7 — Mastra storage mode for Workers

Stays `MASTRA_STORAGE_MODE=noop` (`InMemoryStore`) on Cloudflare Workers until IPI-619 (binding) → IPI-620 (compatibility spike, PROCEED/HOLD/REDESIGN) → IPI-623 (one workload canary) complete, in that order. This ADR does not change Workers storage behavior.

## Disposition of existing partial state

Two facts found live during this session's audit, not anticipated by any prior doc, that IPI-628/629 must explicitly handle rather than assume a clean slate:

1. **Partial grants already exist** on 3 of the 24 tables (`mastra_threads`, `mastra_messages`, `mastra_workflow_snapshot`) in `public`, despite IPI-629 not yet having shipped. IPI-628's migration creates the *new* `mastra`-schema copies of these tables — it does not touch the existing `public` ones. IPI-629 grants the new `mastra`-schema tables independently; the stray `public` grants are a separate cleanup (not in scope here, flagged for whoever retires the `public.mastra_*` tables after cutover).
2. **Zero RLS policies exist today** on any `mastra_*` table. IPI-629 is not "tightening" an existing policy — it is creating the first one.

---

## Non-goals (this ADR)

- Migration SQL → IPI-628
- Grants/RLS DDL → IPI-629
- App `disableInit` wiring → IPI-630
- Hyperdrive binding → IPI-619
- Retiring the existing `public.mastra_*` tables — out of scope until a cutover ticket is filed
