# Mastra Setup Audit — 2026-07-16

**Scope:** `/home/sk/ipix/app` (read-only audit — no code/DB/package changes)  
**Sources:** live repo, runtime logs (`tasks/tests/1-test.md`), read-only Postgres probes, Mastra MCP (`mastraDocs` → [reference/storage/postgresql](https://mastra.ai/reference/storage/postgresql)), `.claude/skills/mastra`

---

## Executive Summary

**Mastra `dev` is blocked by a database permission mismatch, not a missing npm install.**

The `DATABASE_URL` in `.env.local` connects as **`hyperdrive_mastra_runtime`** to Supabase **direct Postgres (port 5432)**. That role has **`USAGE` on `public` but not `CREATE`**. Official [`PostgresStore`](https://mastra.ai/reference/storage/postgresql) runs **automatic schema/table/index initialization** on `init()` unless `disableInit: true`. At startup, `@mastra/pg` calls `createTable` for `mastra_threads` → PostgreSQL **`42501`** → `MASTRA_STORAGE_PG_CREATE_TABLE_FAILED` → Mastra dev **restart loop** and port **4111** unavailable.

**Verified today:** 31+ `mastra_*` tables already exist in `public` (owner `postgres`); runtime role can **SELECT/INSERT/UPDATE** them but **cannot run DDL**. Infisical **`dev` does not inject `DATABASE_URL`** (only `.env.local` does). Shell default Node is **v20.20.2** while CI standardizes **Node 22**. Workers OpenNext preview is on a **separate path** (`InMemoryStore` via `MASTRA_STORAGE_MODE=noop`) and is **not** affected by this Postgres DDL failure.

**Safest fix for this repo:** **Option C** — pre-provision Mastra schema/tables/indexes via Supabase migration (as `postgres`), then set **`disableInit: true`** on `PostgresStore` for the runtime role. Option B (dedicated `mastra` schema + grants) is a strong alternative; **do not** grant `CREATE` on `public`.

---

## Current Architecture

```text
npm run dev
├── dev:ui  → next dev :3002          (✅ listening)
└── dev:agent → mastra dev :4111      (🔴 init fails / not listening)

Next.js CopilotKit route (:3002)
  → getMastra() in handler
  → PostgresStore (Node dev) OR InMemoryStore (Workers preview)

mastra dev (:4111)
  → app/src/mastra/index.ts → getMastraStorage()
  → PostgresStore({ connectionString: DATABASE_URL })   # no schemaName, no disableInit
  → pg.Pool → Supabase db.nvdlhrodvevgwdsneplk.supabase.co:5432
  → role: hyperdrive_mastra_runtime
  → schema: public (default)
  → init(): runtime DDL (CREATE TABLE / indexes)
  → mastra_* tables
```

| Layer | File / config | Verified behavior |
|-------|---------------|-------------------|
| Entry (app) | `app/src/mastra/index.ts` | `getMastra()` + `storage: getMastraStorage()` |
| Storage | `app/src/mastra/storage.ts` | Node: `PostgresStore`; Workers: `InMemoryStore` when skip |
| Memory | `app/src/mastra/memory.ts` | `Memory` → same `getMastraStorage()` |
| Agents | `app/src/mastra/agents/index.ts` | `production-planner` uses `getPlannerMemory()` |
| CopilotKit | `app/src/app/api/copilotkit/[[...slug]]/route.ts` | `MastraAgent.getLocalAgents({ mastra: getMastra() })` |
| Workers | `app/wrangler.jsonc` | `MASTRA_STORAGE_MODE=noop` |
| Env (local dev) | `.env.local` | `DATABASE_URL` present (duplicate key — last wins) |
| Env (Infisical dev) | `infisical run --env=dev` | **`DATABASE_URL` not injected** |

---

## Verified Package Versions

| Package | Installed | Wanted (npm) | Latest (npm) | Notes |
|---------|-----------|--------------|--------------|-------|
| Node (shell default) | **v20.20.2** | — | — | Mastra dev logs show v20.20.2 |
| Node (nvm 22) | v22.23.1 | — | — | CI uses 22; not default shell |
| npm | 10.8.2 (shell) / 10.9.8 (nvm22) | — | — | |
| `mastra` | **1.1.0-alpha.3** | 1.1.0-alpha.3 | 1.19.0 | Alpha CLI |
| `@mastra/core` | **1.41.0** | 1.51.0 (transitive) | 1.51.0 | Pinned in app; deps want newer |
| `@mastra/pg` | **1.12.0** | 1.12.0 | 1.16.0 | |
| `@mastra/memory` | **1.0.1-alpha.1** | — | 1.23.0 | Alpha |
| `pg` | **8.22.0** | — | — | via `@mastra/pg` |
| `package.json` `engines` | **(none)** | — | — | No Node pin in app |

**Compatibility note (official):** [`PostgresStore`](https://mastra.ai/reference/storage/postgresql) documents `disableInit`, `schemaName` (default `public`), auto table creation, and `npx mastra migrate` for controlled migrations. Current app code uses none of `schemaName`, `disableInit`, or `ssl` overrides.

---

## Errors Found

| Severity | Error | Classification | Root cause | Impact | Fix |
|----------|-------|----------------|------------|--------|-----|
| 🔴 **Blocker** | `permission denied for schema public` (42501) | **Root cause** | `hyperdrive_mastra_runtime` lacks `CREATE` on `public`; `PostgresStore.init()` runs DDL | Mastra storage never initializes | Migrations + `disableInit: true`, or dedicated schema + grants |
| 🔴 **Blocker** | `MASTRA_STORAGE_PG_CREATE_TABLE_FAILED` / `mastra_threads` | **Symptom of above** | Same DDL failure in `@mastra/pg` `createTable` | Logged on every init retry | Same as above |
| 🔴 **Blocker** | Mastra dev restart loop; `:4111` unreachable | **Downstream** | Uncaught/fatal init + dev server restart | No Studio/API; workflow resume fails | Fix storage init |
| 🟡 **High** | `Failed to restart all active workflow runs: TypeError: fetch failed` | **Downstream** | Mastra API restarting / storage not ready | Active workflows not resumed on dev boot | Fix storage; verify after stable boot |
| 🟡 **High** | `Storage init failed; will retry on next storage call` | **Downstream** | Non-fatal retry path after failed `init()` | Agent memory/workflow persistence unreliable | Same as DDL fix |
| ⚪ **Medium** | Next.js `Persisting failed: Unable to write SST file` | **Independent** | Turbopack/local cache write contention | UI dev noise; not Mastra PG | Clear `.next` cache; single dev instance |
| ⚪ **Medium** | `Compaction failed: Another write batch or compaction is already active` | **Independent** | Turbopack SST compaction race | UI dev noise | Same |
| ⚪ **Medium** | Node **v20.20.2** in `[agent]` logs vs CI **22** | **Independent warning** | No `.nvmrc` / `engines`; shell default v20 | Engine warnings on newer Mastra tooling (MCP docs server wants ≥22.13) | Standardize Node 22 locally |
| ⚪ **Low** | Infisical `dev` missing `DATABASE_URL` | **Config gap** | Secret not in Infisical dev bundle | `infisical run -- npm run dev` may differ from `.env.local`-only dev | Align secret source or document `.env.local` requirement |
| 🟢 **Info** | Workers `STREAM_IDLE_TIMEOUT` (prior session) | **Separate track** | `pg.Pool` hang on Workers — mitigated with `InMemoryStore` | Cloudflare preview only | Hyperdrive Client path (IPI-619/623) for durable Workers memory |

**Evidence stack trace:** `tasks/tests/1-test.md` lines 90–165 — `PgDB.createTable` → `_MemoryPG.init` → `PostgresStore.init` → 42501.

---

## Red Flags

1. **Runtime DDL on a least-privilege role** — Official docs: init auto-creates tables; Supabase role intentionally has no `CREATE` on `public`.
2. **Tables owned by `postgres`, app connects as `hyperdrive_mastra_runtime`** — DDL/migrations must run as admin; runtime should be DML-only + `disableInit`.
3. **`DATABASE_URL` uses port 5432 direct**, while `.env.example` documents **pooler 6543** — intentional for Hyperdrive role, but differs from app docs; verify pool mode if switching URLs.
4. **Duplicate `DATABASE_URL` keys in `.env.local`** (lines 39 and 97) — last value wins silently.
5. **No `engines` in `package.json`** — Node 20/22 drift confirmed in logs.
6. **Alpha stack** (`mastra@1.1.0-alpha.3`, `@mastra/memory@alpha`) with **`@mastra/core` 8 minor versions behind** wanted — upgrade risk if bumped without migration plan.
7. **`mastra dev` process alive but `:4111` not listening** at audit time — crash/restart thrashing.
8. **Infisical vs `.env.local` split** — Mastra may not see DB URL under Infisical-only workflows.

---

## Failure Points

| Point | What breaks |
|-------|-------------|
| `PostgresStore.init()` | First storage touch on Mastra boot |
| `createTable('mastra_threads')` | Even if table exists, index/constraint migration steps may need `CREATE` |
| `mastra dev` restart | Fatal error path triggers rebundle/restart (see `1-test.md`) |
| Workflow resume on boot | HTTP `fetch` to local API while server unstable |
| CopilotKit agent memory | Same storage init when `getMastra()` uses Postgres on Node |

---

## Blockers

| Blocker | Blocks |
|---------|--------|
| `public` CREATE denied for runtime role | Local Mastra dev (:4111), durable agent memory, workflow persistence in dev |
| Unstable Mastra API | Studio, `mastra` CLI against local API, workflow restart |
| Node 20 default (secondary) | Future Mastra CLI/MCP tooling; not primary cause of 42501 |

**Does not block:** Next.js UI on :3002 (runs); Workers preview with `MASTRA_STORAGE_MODE=noop` (separate); unit tests (mock/no live PG init).

---

## Database Permission Audit (read-only, verified 2026-07-16)

**Connection (from `.env.local`, values redacted):**

| Field | Value |
|-------|-------|
| Host | `db.nvdlhrodvevgwdsneplk.supabase.co` |
| Port | **5432** (direct) |
| Database | `postgres` |
| User | `hyperdrive_mastra_runtime` |
| `sslmode` query param | none |

**Privileges:**

| Check | Result |
|-------|--------|
| `current_user` / `session_user` | `hyperdrive_mastra_runtime` |
| `has_schema_privilege(..., 'public', 'USAGE')` | **true** |
| `has_schema_privilege(..., 'public', 'CREATE')` | **false** ← **root cause** |
| `mastra` schema | **does not exist** |
| `public` owner | `pg_database_owner` |

**Existing tables:** **31** `mastra_*` tables in `public`, all **`tableowner: postgres`**.

**Sample DML (runtime role):**

| Check | Result |
|-------|--------|
| `SELECT count(*) FROM mastra_threads` | ✅ 0 rows |
| `INSERT` privilege on `mastra_threads` | ✅ true |
| `INSERT` privilege on `mastra_messages` | ✅ true |

**Missing vs official [`PostgresStore` table list](https://mastra.ai/reference/storage/postgresql):** `mastra_evals`, `mastra_traces`, `mastra_notifications` (may trigger create attempts on init).

**Assumption (not re-run):** `CREATE INDEX` / constraint migrations during init also require schema `CREATE` or superuser — consistent with 42501 on `createTable` path.

---

## Environment Audit

| Source | Present vars (names only) | Wins for Mastra DB |
|--------|---------------------------|-------------------|
| `.env.local` | `DATABASE_URL` (×2), `GEMINI_*`, `SUPABASE_*` | **Yes** — `hyperdrive_mastra_runtime` |
| `.env` | `SUPABASE_DB_PASSWORD` | No `DATABASE_URL` |
| `.dev.vars` | (minimal) | Workers only |
| Infisical `--env=dev` | `GEMINI_API_KEY`, `SUPABASE_*`, **no `DATABASE_URL`** | **No** unless added |
| `wrangler.jsonc` | `MASTRA_STORAGE_MODE=noop` | Workers preview only |

**Precedence:** `mastra dev` / Node loads `.env.local` via dotenv (28 vars injected). **`infisical run --env=dev` alone does not provide `DATABASE_URL`** (verified exit: NOT SET).

**Security (names only):** `.env.local` contains `SUPABASE_SERVICE_ROLE_KEY` — server-only; must never reach client bundles (not re-audited in this pass).

---

## Node Version Audit

| Context | Version |
|---------|---------|
| Default `which node` | v20.20.2 (`~/.nvm/.../v20.20.2`) |
| `nvm use 22` | v22.23.1 |
| Mastra `[agent]` logs | **Node.js v20.20.2** |
| GitHub Actions `ci.yml` | **node-version: "22"** |
| `app/package.json` engines | **none** |
| `.nvmrc` / `.node-version` | **not found** in `app/` |

**Why drift:** Dev shell and `mastra dev` child inherit default nvm **20**, not CI **22**.

**Enforcement (recommendation only):** add `engines.node: ">=22.13.0"`, `.nvmrc` with `22`, document `nvm use` before `npm run dev`.

---

## Official Documentation Verification

From Mastra MCP [`reference/storage/postgresql`](https://mastra.ai/reference/storage/postgresql):

| Topic | Official guidance | iPix current |
|-------|-------------------|--------------|
| Initialization | `init()` auto-creates tables when storage passed to `Mastra` | ✅ Matches — no `disableInit` |
| `disableInit` | `true` disables automatic table creation; use when migrations run separately | ❌ Not set |
| `schemaName` | Default `'public'`; can set dedicated schema | ❌ Default `public` |
| Migrations | `npx mastra migrate` CLI; manual SQL for upgrades ([storage migration guide](https://mastra.ai/guides/migrations/upgrade-to-v1/storage)) | ❌ No Supabase migration for Mastra grants/init |
| Pooling | Supports `pg.Pool`; max/idle configurable | Default pool in `@mastra/pg` |
| Next.js HMR | Warns duplicate pools; recommends global singleton | Partial — module singleton in `storage.ts` but HMR global pattern not used |
| Production | SSL configurable; indexes created at init | No explicit `ssl` in `storage.ts` |

---

## Corrections by Area — Options Compared

| Option | Description | Security | Fits Supabase | Effort | Verdict |
|--------|-------------|----------|---------------|--------|---------|
| **A** | `GRANT CREATE ON SCHEMA public TO hyperdrive_mastra_runtime` | 🔴 Poor — violates least privilege | ❌ Discouraged | Low | **Reject** |
| **B** | `CREATE SCHEMA mastra`; grant USAGE+CREATE on `mastra`; `schemaName: 'mastra'` | 🟢 Good isolation | ✅ Yes | Medium | **Good** if greenfield DDL |
| **C** | Supabase migration creates all tables/indexes as `postgres`; app uses `disableInit: true` | 🟢 Best match for existing tables | ✅ Yes | Medium | **Recommended** |
| **D** | Separate Postgres database for Mastra | 🟢 Strong isolation | ⚪ Possible | High | Overkill unless compliance |

**Recommended for iPix:** **Option C** — tables already exist (31+) under `postgres`; runtime role already has DML. Add migration for **missing** tables/indexes (`mastra_evals`, `mastra_traces`, `mastra_notifications`, any index deltas), then **`disableInit: true`** for `hyperdrive_mastra_runtime`. Optionally migrate to **Option B** later for schema isolation.

---

## Recommended Architecture

```text
Supabase migration (postgres role, one-time)
  → CREATE/ALTER mastra_* tables + indexes in public OR dedicated mastra schema
  → GRANT SELECT, INSERT, UPDATE, DELETE on mastra_* TO hyperdrive_mastra_runtime
  → (optional) GRANT USAGE ON SCHEMA mastra — NOT CREATE on public

app/src/mastra/storage.ts
  → PostgresStore({
       id: 'mastra-storage',
       connectionString: process.env.DATABASE_URL,
       schemaName: 'public' | 'mastra',
       disableInit: true,        // runtime role — no DDL
       ssl: { rejectUnauthorized: false } // if required by Supabase
     })

Node dev (:4111) + Next.js CopilotKit (:3002)
  → same DATABASE_URL, DML only

Workers preview (:8787)
  → MASTRA_STORAGE_MODE=noop → InMemoryStore (until Hyperdrive Client, IPI-619/623)
```

---

## Safe Fix Sequence (no execution in this audit)

1. **Freeze DDL role** — Do not grant `CREATE` on `public`.
2. **Inventory** — Run `npx mastra migrate` **or** diff `@mastra/pg@1.12.0` init SQL vs existing 31 tables (as migration author role).
3. **Supabase migration** — Create missing objects + indexes; grant DML to `hyperdrive_mastra_runtime`.
4. **App config** — Add `disableInit: true` (+ optional `schemaName`) in `getMastraStorage()` for Node path only.
5. **Node 22** — `nvm use 22`; add `.nvmrc` + `engines` (separate PR).
6. **Env** — Add `DATABASE_URL` to Infisical dev **or** document `.env.local` as required for `mastra dev`.
7. **Validate** — Boot checklist below.
8. **Workers** — Keep `InMemoryStore` until Hyperdrive Client; do not enable `MASTRA_STORAGE_MODE=pg` on Workers yet.

---

## Validation Checklist

```bash
# Node
cd /home/sk/ipix/app && nvm use 22 && node -v   # expect v22.x

# DB privileges (read-only)
node -e "require('dotenv').config({path:'.env.local'}); ..."  # see audit SQL in prompt

# Mastra boot
cd /home/sk/ipix/app && npm run dev:agent
curl -sS http://localhost:4111/api | head
# expect JSON response, no 42501 in logs

# Storage smoke (after disableInit + grants)
# Studio :4111 → create thread / send message → rows in mastra_threads/mastra_messages

# Unit tests
cd /home/sk/ipix/app && npm test -- src/mastra

# Workers (separate)
# MASTRA_STORAGE_MODE=noop → planner SSE completes (IPI-490)
```

---

## Additional Checks

| Check | Result |
|-------|--------|
| Duplicate dev processes | ✅ `next dev` + `mastra dev` running (expected via concurrently) |
| Port 3002 | ✅ listening |
| Port 4111 | 🔴 **not listening** at audit time |
| Port 8787 | Not checked (preview not required for this audit) |
| `.mastra/` cache | Present (bundler output); no corruption assessed |
| `.next/` | Present (Turbopack SST errors in logs — clear if persistent) |
| Connection exhaustion | Not observed; single pool default max 20 |
| Mastra health endpoint | `:4111/api` unreachable |
| CI Mastra startup smoke | **Missing** — CI runs app build/test, not `mastra dev` boot |
| Secret leakage in report | None printed |

---

## Tests Run (audit)

```text
npm test -- src/mastra
→ 19 files, 139 tests passed (2.99s)
```

Storage/agent registry tests pass **without live Postgres init** (stubs/InMemory in tests).

---

## Scores (0–100)

| Area | Score | |
|------|-------|---|
| Package/version compatibility | 58 | ⚪ Alpha CLI/memory; core drift |
| Database design | 72 | 🟡 Tables exist; grants misaligned |
| Database permissions | **25** | 🔴 No CREATE; init expects DDL |
| Schema isolation | 40 | 🔴 Everything in `public` |
| Storage reliability | 30 | 🔴 Init fails locally |
| Workflow persistence | 35 | 🔴 Resume fetch fails on boot |
| Agent registration | 88 | 🟡 Tests green; IDs synced |
| Environment management | 55 | ⚪ Infisical/local split |
| Secrets management | 70 | 🟡 Service role in `.env.local` (expected server-side) |
| Observability | 50 | ⚪ Logs exist; no health gate |
| Error handling | 45 | ⚪ Retry loops; fatal restarts |
| Local dev stability | **30** | 🔴 Mastra side broken |
| CI coverage | 65 | 🟡 App CI green; no Mastra boot probe |
| Production deployment readiness | 40 | 🔴 Node dev PG path blocked; Workers noop only |

**Overall: 48/100** 🔴

---

## Will It Succeed?

| Scenario | Probability | Notes |
|----------|-------------|-------|
| **Unchanged** (runtime DDL + current role) | **~5%** | Init will keep failing 42501 |
| **After Option C** (migrate + `disableInit` + DML grants) | **~85%** | Matches existing table layout |
| **After Option B** (dedicated schema) | **~80%** | Requires data move or fresh schema |
| **After Option A** (CREATE on public) | **~70%** | Would work but unsafe on Supabase |

---

## Production Readiness

| Environment | Ready? | Reason |
|-------------|--------|--------|
| **Local Node dev** (`mastra dev` + Postgres) | **No** | 42501 on init |
| **Local Next.js only** | **Partial** | UI runs; agent memory unreliable if storage init fails in-process |
| **Workers preview** | **Partial** | Agents stream with `InMemoryStore`; no durable memory |
| **Staging/production Node** | **No** | Same DDL/init pattern until fixed |
| **Production Workers** | **Not verified** | Noop storage; Hyperdrive Client not wired |

---

## Exact Next Commands (read-only / safe)

```bash
# Versions
cd /home/sk/ipix/app && node -v && npm ls mastra @mastra/core @mastra/pg pg

# DB privileges (no secrets printed if using dotenv locally)
cd /home/sk/ipix/app && node -r dotenv/config -e "
  require('dotenv').config({path:'.env.local'});
  const {Client}=require('pg');
  (async()=>{
    const c=new Client({connectionString:process.env.DATABASE_URL});
    await c.connect();
    const r=await c.query(\"select has_schema_privilege(current_user,'public','CREATE') as c\");
    console.log(r.rows[0]);
    await c.end();
  })();
"

# Mastra logs (historical)
rg '42501|MASTRA_STORAGE_PG' /home/sk/ipix/tasks/tests/1-test.md

# Official migration CLI (run only after backup + migration PR — not in this audit)
# npx mastra migrate

# Tests
cd /home/sk/ipix/app && npm test -- src/mastra
```

---

## Final Verdict

🔴 **48/100 — Not production-ready; local Mastra dev is blocked.**

**Single root cause (verified):** `PostgresStore.init()` performs DDL against **`public`**, but **`hyperdrive_mastra_runtime` lacks `CREATE` on `public`**. Everything else (restart loop, workflow fetch failed, storage retries) cascades from that.

**Safest path:** **Option C** — Supabase migration completes Mastra schema as `postgres`, grant DML to runtime role, set **`disableInit: true`** in `getMastraStorage()` for Node. Keep Workers on **`InMemoryStore`** until Hyperdrive Client lands.

**Separate tracks:** Node 22 enforcement, Infisical `DATABASE_URL` alignment, Turbopack SST noise, Workers durable memory (IPI-490 / IPI-619).

---

*Audit performed read-only. Assumptions labeled inline. No secrets, DB writes, package installs, or Linear updates.*
