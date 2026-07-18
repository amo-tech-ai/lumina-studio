````text
Audit the Mastra setup in:

/home/sk/ipix/app

Use these sources as mandatory inputs:

- Local skill:
  /home/sk/ipix/.claude/skills/mastra
- Mastra MCP tools
- Official Mastra documentation only
- Current repository code and runtime logs
- Existing environment and database configuration

Do not rely on old notes. Verify every claim against the live codebase, installed package versions, current database permissions, and official docs.

## Primary problem to investigate

Current runtime repeatedly reports:

- `permission denied for schema public`
- PostgreSQL error code `42501`
- `MASTRA_STORAGE_PG_CREATE_TABLE_FAILED`
- failure creating `mastra_threads`
- Mastra storage initialization failure
- repeated Mastra restart loop
- `Failed to restart all active workflow runs: TypeError: fetch failed`
- SST persistence and compaction errors
- Node runtime shown as `v20.20.2`

The Next.js UI starts successfully on port 3002, while Mastra starts on port 4111 and then repeatedly fails.

## Step 1 — Read project guidance

Read and apply:

```text
/home/sk/ipix/.claude/skills/mastra
````

Also inspect:

```text
/home/sk/ipix/AGENTS.md
/home/sk/ipix/CLAUDE.md
/home/sk/ipix/app/package.json
/home/sk/ipix/app/src/mastra/
/home/sk/ipix/app/mastra.config.*
/home/sk/ipix/app/.env*
/home/sk/ipix/app/.dev.vars
```

Do not expose secret values.

## Step 2 — Inspect the installed Mastra stack

Report exact installed versions for:

* `mastra`
* `@mastra/core`
* `@mastra/pg`
* related Mastra storage packages
* `pg`
* Node.js
* npm

Run:

```bash
cd /home/sk/ipix/app

node --version
npm --version
npm ls mastra @mastra/core @mastra/pg pg
npm outdated
```

Verify compatibility against current official Mastra documentation and package requirements.

Do not recommend upgrades automatically. First determine whether the current alpha versions are supported, compatible, and appropriate for production.

## Step 3 — Map the actual architecture

Identify:

* Mastra entry point
* storage initialization file
* PostgreSQL connection source
* `DATABASE_URL` source
* schema configuration
* table prefix or namespace
* memory/thread/workflow storage configuration
* agent registration
* workflow registration
* server port configuration
* whether Mastra uses Supabase PostgreSQL directly
* whether it attempts runtime DDL
* whether migrations are available instead of runtime table creation

Produce a simple architecture flow:

```text
Next.js
→ Mastra dev server
→ Mastra storage adapter
→ PostgreSQL role
→ schema
→ Mastra tables
```

## Step 4 — Audit PostgreSQL permissions

Determine the exact database role Mastra uses.

Run safe read-only checks:

```sql
select current_user;
select session_user;

select
  has_schema_privilege(current_user, 'public', 'USAGE') as has_usage,
  has_schema_privilege(current_user, 'public', 'CREATE') as has_create;

select
  nspname,
  nspowner::regrole
from pg_namespace
where nspname in ('public', 'mastra');

select table_schema, table_name
from information_schema.tables
where table_name like 'mastra_%'
order by table_schema, table_name;
```

Check:

* whether the role has `USAGE`
* whether it has `CREATE`
* whether runtime DDL is intended
* whether Mastra should use a dedicated `mastra` schema
* whether Supabase restricts the connected role
* whether the connection uses the correct direct or pooled connection
* whether transaction-pooler mode is incompatible with the storage adapter
* whether the current user is too privileged or underprivileged

Do not grant broad access without proving it is required.

## Step 5 — Verify official Mastra storage best practices

Using official Mastra docs, verify:

* supported PostgreSQL configuration
* recommended schema
* recommended initialization pattern
* whether tables should be auto-created
* required database grants
* migration options
* connection pooling requirements
* SSL requirements
* serverless compatibility
* development versus production configuration
* retry behavior
* workflow persistence behavior
* thread and memory table expectations

Cite the exact official documentation sections in the report.

## Step 6 — Audit runtime errors

Classify every observed message:

### Root cause

* `permission denied for schema public`
* `MASTRA_STORAGE_PG_CREATE_TABLE_FAILED`

### Likely downstream symptoms

* repeated server restart
* workflow restart fetch failure
* storage retry messages
* SST persistence failure
* compaction conflict

### Independent warnings

* Next.js `middleware` deprecation
* Node version mismatch
* Infisical configuration
* Turbopack warnings

For each error provide:

* exact cause
* evidence
* severity
* whether it blocks IPI-432
* whether it blocks local development
* whether it blocks production
* safest fix
* verification command

## Step 7 — Audit Node version consistency

Check:

```bash
which node
node -v
npm config get prefix
cat .nvmrc 2>/dev/null
cat .node-version 2>/dev/null
cat package.json | grep -A4 engines
grep -Rni "node-version" .github 2>/dev/null
```

Determine why Mastra reports Node 20 while the repository previously standardized on Node 22.

Check for:

* nvm
* system Node
* Infisical PATH differences
* subprocess PATH differences
* Mastra CLI bundled runtime
* CI version mismatch

Recommend one canonical version and exact enforcement steps.

## Step 8 — Audit environment loading

Inspect how Infisical, `.env`, `.env.local`, and `.dev.vars` interact.

Verify:

* which source wins
* duplicate variables
* stale variables
* malformed `DATABASE_URL`
* direct versus pooled Supabase URL
* SSL parameters
* leaked service-role credentials
* whether Next.js and Mastra receive the same environment
* whether `infisical run` changes PATH or Node version

Do not print secret values. Report only variable names, source, and whether present.

## Step 9 — Audit Mastra production readiness

Score each area from 0–100:

* package/version compatibility
* database design
* database permissions
* schema isolation
* storage reliability
* workflow persistence
* agent registration
* environment management
* secrets management
* observability
* error handling
* retry behavior
* local development stability
* CI coverage
* production deployment readiness

Use:

* 🟢 90–100
* 🟡 70–89
* ⚪ 50–69
* 🔴 below 50

Provide:

* overall score
* local-development ready: yes/no
* staging-ready: yes/no
* production-ready: yes/no
* probability current setup succeeds unchanged
* probability after corrections

## Step 10 — Provide correction options

For the database issue, compare at least these paths:

### Option A — Grant limited schema privileges

Example only after verification:

```sql
grant usage, create on schema public to <mastra_role>;
```

Evaluate security risk and whether this violates Supabase best practices.

### Option B — Dedicated Mastra schema

Example:

```sql
create schema if not exists mastra;
grant usage, create on schema mastra to <mastra_role>;
```

Configure Mastra to use it if supported.

### Option C — Pre-create Mastra tables through migrations

Evaluate whether official Mastra migrations or generated SQL exist.

### Option D — Separate PostgreSQL database for Mastra

Evaluate when isolation is justified.

Recommend the safest option for this repository.

## Step 11 — Additional checks

Also inspect:

* duplicate Mastra instances
* multiple processes using the same local persistence directory
* stale `.mastra`, `.next`, or cache directories
* corrupted SST files
* port collisions on 3002 and 4111
* multiple dev servers
* database connection exhaustion
* missing indexes
* unexpected public schema writes
* orphaned Mastra tables
* workflow restart loops
* signal handling and graceful shutdown
* readiness and health endpoints
* logging verbosity
* secret redaction
* CI smoke test for Mastra startup

## Step 12 — Final report structure

Return:

# Mastra Setup Audit

## Executive Summary

## Current Architecture

## Verified Package Versions

## Errors Found

Use a table:

| Severity | Error | Root Cause | Impact | Fix |

## Red Flags

## Failure Points

## Blockers

## Database Permission Audit

## Environment Audit

## Node Version Audit

## Official Documentation Verification

## Corrections by Area

## Recommended Architecture

## Safe Fix Sequence

## Validation Checklist

## Scores

## Will It Succeed?

## Production Readiness

## Exact Next Commands

## Final Verdict

Rules:

* use official Mastra documentation as the primary authority
* verify current versions and behavior live
* do not expose secrets
* do not make database changes
* do not install packages
* do not update Linear
* do not merge PRs
* do not modify files
* clearly separate verified facts from assumptions
* identify anything that cannot be verified
* include exact commands for every recommended validation
* get to the point
* verify 100% before recommending any privilege change

```
```
