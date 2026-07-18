Use this in Cursor Agent mode:

```text
Audit the Mastra PostgreSQL storage tables in the linked Supabase project.

Project:
- Repository: /home/sk/ipix
- Application: /home/sk/ipix/app
- Supabase project ref: nvdlhrodvevgwdsneplk
- Current failure: PostgreSQL error 42501, “permission denied for schema public”
- Failing object: mastra_threads
- Runtime database role: hyperdrive_mastra_runtime
- Installed Mastra packages must be read from /home/sk/ipix/app/package.json and package-lock.json. Do not assume current APIs or schemas from memory.

Mandatory tools and skills:
1. Use the Supabase MCP server for live database inspection.
2. Use the Mastra MCP documentation server for current Mastra documentation.
3. Load and follow the project’s Mastra skill.
4. Load and follow the project’s Supabase skill.
5. Load the Supabase PostgreSQL best-practices skill if installed.
6. Use official Mastra and Supabase documentation only for technical verification.
7. Inspect the live database before trusting local migrations or documentation.

Safety rules:
- Start read-only.
- Do not apply migrations.
- Do not alter tables, indexes, roles, grants, schemas, policies, or data.
- Do not expose secrets or print connection strings.
- Do not grant CREATE on the public schema.
- Do not delete, rename, move, truncate, or rebuild any Mastra table.
- Do not run `npx mastra migrate` until the audit is complete and explicitly approved.
- Do not mark anything fixed without runtime evidence.
- If Supabase MCP is not connected, stop and report the exact connection problem.
- Confirm the selected Supabase project before querying.
- Prefer project-scoped, read-only MCP access.

Audit objectives

A. Verify the live Mastra inventory
Use Supabase MCP tools such as:
- list_tables
- list_migrations
- execute_sql with SELECT-only SQL
- get_advisors
- get_logs when relevant

Return the exact, untruncated names of every table matching:

  mastra_%

For every Mastra table collect:
- schema
- table name
- owner
- table type
- estimated row count
- total table size
- RLS enabled or disabled
- primary key
- foreign keys
- unique constraints
- check constraints
- columns, data types, nullability and defaults
- indexes and index definitions
- triggers
- grants by role
- whether anon, authenticated or service_role can access it
- whether hyperdrive_mastra_runtime has SELECT, INSERT, UPDATE and DELETE
- whether sequences exist and whether the runtime role can use them
- whether the table is exposed through the Supabase Data API
- whether the table appears in local Supabase migrations

B. Verify the current runtime role
Run read-only queries to establish:
- current_user
- session_user
- current_database()
- current_schema()
- SHOW search_path
- schema owner for public
- USAGE and CREATE privileges on public
- table-level privileges for every mastra_% table
- sequence privileges
- default privileges affecting future Mastra objects
- whether the role inherits privileges from other roles
- whether the connection is direct, session pooler, transaction pooler or Hyperdrive, without printing credentials

Explain exactly why Mastra receives:

  42501 permission denied for schema public
  MASTRA_STORAGE_PG_CREATE_TABLE_FAILED
  tableName: mastra_threads

Distinguish:
1. missing table,
2. invisible table because of search_path,
3. missing table privilege,
4. attempted CREATE TABLE,
5. attempted CREATE INDEX,
6. attempted ALTER TABLE,
7. schema-version drift.

C. Compare live Supabase against the installed Mastra version
Use Mastra MCP and the locally installed package source under node_modules.

Determine:
- installed versions of mastra, @mastra/core, @mastra/pg and @mastra/memory
- whether these versions are mutually compatible
- the exact PostgresStore constructor options supported by the installed version
- whether schemaName is supported
- whether disableInit is supported
- what PostgresStore.init() does
- every table, index and constraint expected by this exact @mastra/pg version
- whether Mastra provides a migration command for this version
- whether the migration command generates SQL, applies SQL directly, or requires an elevated database role
- whether upgrading Mastra would change the storage schema

Do not compare only against the latest Mastra docs. Compare:
1. installed package implementation,
2. installed package typings,
3. official current docs,
4. relevant migration or upgrade documentation.

Produce a live-versus-expected matrix:

| Object | Expected by installed Mastra | Exists live | Definition matches | Runtime access | Action |
|---|---|---|---|---|---|

Include tables, columns, indexes, constraints and sequences.

D. Specifically verify the visible tables
Confirm the exact names and definitions for at least:

- mastra_agent_versions
- mastra_agents
- mastra_ai_spans
- mastra_background_tasks
- mastra_channel_config
- mastra_channel_installations
- mastra_dataset_items
- mastra_dataset_versions
- mastra_datasets
- mastra_experiment_results
- mastra_experiments
- mastra_favorites
- mastra_mcp_client_versions
- mastra_mcp_clients
- mastra_mcp_server_versions
- mastra_mcp_servers
- mastra_messages
- mastra_prompt_block_versions
- mastra_prompt_blocks
- mastra_resources
- mastra_schedule_triggers
- mastra_schedules
- mastra_scorer_definitions
- mastra_scorers
- mastra_skill_blobs
- mastra_skill_versions
- mastra_skills
- mastra_threads
- mastra_workflow_snapshot
- mastra_workspace_versions
- mastra_workspaces

Resolve every truncated table name from the screenshots by querying the database. Do not guess.

Also explicitly check whether these exist:
- mastra_evals
- mastra_traces
- mastra_notifications
- observational-memory-related tables
- scorer-definition-version tables

E. Audit local configuration
Inspect, without printing secret values:
- app/src/mastra/storage.ts
- app/src/mastra/index.ts
- app/src/mastra/memory.ts
- app/package.json
- app/package-lock.json
- app/.env.example
- variable names only from app/.env.local
- app/wrangler.jsonc
- relevant Supabase migrations
- CI Node configuration
- .nvmrc, .node-version and package.json engines

Verify:
- duplicate DATABASE_URL definitions
- actual environment-variable precedence
- whether Infisical supplies DATABASE_URL
- whether local Node and CI Node versions differ
- whether PostgresStore is instantiated more than once during hot reload
- whether the connection pool is safely reused
- whether Workers use InMemoryStore or PostgreSQL
- whether production and local development follow different storage paths
- whether `disableInit` is currently set
- whether `schemaName` is currently set
- whether SSL configuration is appropriate for Supabase
- whether connection pooling settings are safe

F. Security and architecture audit
Evaluate these options:

Option A:
Grant CREATE on public to hyperdrive_mastra_runtime.

Option B:
Create a dedicated mastra schema and allow Mastra initialization there.

Option C:
Manage Mastra tables through reviewed Supabase migrations and use disableInit: true for the runtime.

Option D:
Use a separate database for Mastra.

Score each option for:
- security
- least privilege
- migration safety
- Supabase compatibility
- local development
- production
- Cloudflare/Hyperdrive compatibility
- operational complexity
- upgrade safety

Do not automatically select Option C. Base the recommendation on the live schema, installed Mastra implementation and official documentation.

Check whether a dedicated `mastra` schema should remain private and excluded from the Data API. Mastra storage tables should not be exposed to anon or authenticated users unless there is a documented requirement.

G. Additional checks
Also inspect:
- missing indexes
- duplicate or redundant indexes
- invalid indexes
- unused indexes, while noting that low usage may be normal in development
- oversized tables
- dead tuples and bloat
- long-running queries
- blocked queries and locks
- connection exhaustion
- orphaned rows
- broken foreign keys
- nullable columns that conflict with Mastra expectations
- timestamp and timezone consistency
- JSON/JSONB validity assumptions
- UUID versus text identifier consistency
- duplicate thread or message identifiers
- workflow snapshot consistency
- stale experimental, dataset, MCP, skill and Studio metadata
- tables created by Mastra Studio versus tables required by runtime storage
- data-retention requirements for spans, traces, experiments and datasets
- backup and rollback requirements before any schema migration
- whether generated database types include internal Mastra tables unnecessarily
- whether RLS is relevant for these server-only tables or grants alone should control access
- whether anon/authenticated grants should be revoked
- whether default privileges could expose future Mastra tables
- whether the public schema is the correct long-term location
- whether Mastra startup should be included in CI as a smoke test

H. Reproduce and validate the failure
Using the existing configuration, reproduce the failure safely and capture:
- the first failing SQL operation, where possible
- whether it is CREATE TABLE, CREATE INDEX or ALTER TABLE
- the complete Mastra error ID
- whether the API briefly listens on port 4111 before crashing
- whether the restart loop is caused solely by storage initialization
- whether workflow restart errors are downstream symptoms
- whether Next.js Turbopack SST errors are independent

Do not repeatedly restart the process indefinitely. Stop after collecting sufficient evidence.

Required report

1. Executive verdict
2. Audit method
3. Evidence sources used
4. Exact Mastra table inventory
5. Installed-versus-live schema matrix
6. Root-cause chain
7. Errors, red flags, failure points and blockers
8. Missing objects or mismatched definitions
9. Security and privilege findings
10. Environment and version findings
11. Option comparison
12. Recommended architecture
13. Critical fixes in dependency order
14. Safe migration plan
15. Rollback plan
16. Validation checklist
17. Production-readiness assessment
18. Success probability before and after fixes
19. Scorecard from 0–100
20. Final decision

Use this status legend:
- 🟢 Correct / safe / verified
- 🟡 Partial / needs improvement
- ⚪ Informational / low risk
- 🔴 Blocker / unsafe / incorrect

For each finding include:

| Severity | Finding | Evidence | Impact | Exact correction | Validation |

Important output rules:
- Clearly label verified facts, inferences and unknowns.
- Include the exact MCP tool or query used as evidence.
- Do not claim an object is missing until both the live database and installed Mastra schema have been checked.
- Do not recommend broad grants.
- Do not generate or apply a migration during the audit.
- Do not expose IDs, keys, passwords or complete connection strings.
- Use full task naming format for any proposed task:
  IPI-XXX · TASK-ID — Full Task Name
- End with one recommended next task only.
```

## Cursor MCP setup check

Before running the prompt, confirm **Supabase** appears as connected under:

```text
Cursor Settings → Tools & MCP
```

Supabase officially recommends scoping the MCP server to one project and using `read_only=true` for inspection. The database tool group includes table listing, SQL execution, migrations, logs and advisors. ([Supabase][1])

A suitable audit-only URL is:

```text
https://mcp.supabase.com/mcp?project_ref=nvdlhrodvevgwdsneplk&read_only=true&features=database,docs,debugging
```

Mastra’s official docs server package name is singular:

```text
@mastra/mcp-docs-server
```

not `@mastra/mcp-docs-servers`. Mastra recommends enabling it from Cursor’s MCP settings and reopening the agent chat after activation. ([Mastra][2])

The prompt also asks Cursor to inspect indexes, locks, bloat and query performance because Supabase’s official inspection guidance identifies these as common database failure and performance areas. ([Supabase][3]) Supabase additionally provides official `supabase` and `supabase-postgres-best-practices` agent skills for schema, migration, security and PostgreSQL reviews. ([Supabase][4])

[1]: https://supabase.com/docs/guides/ai-tools/mcp "Supabase MCP Server | Supabase Docs"
[2]: https://mastra.ai/blog/introducing-mastra-mcp "Introducing Mastra MCP Documentation Server | Mastra Blog"
[3]: https://supabase.com/docs/guides/database/inspect "Debugging and monitoring | Supabase Docs"
[4]: https://supabase.com/docs/guides/ai-tools/ai-skills "Agent Skills | Supabase Docs"
