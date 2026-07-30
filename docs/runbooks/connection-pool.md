# Connection Pool Monitoring Runbook

**Owner:** ⚠️ unassigned — see [Alert Owner](#alert-owner). This runbook is **not operational** until filled in.
**Project:** Supabase `nvdlhrodvevgwdsneplk` · PostgreSQL 17.6
**Linear:** [IPI-855 · SB-MON-001 — Configure Connection Pool Monitoring & Alerting](https://linear.app/amo100/issue/IPI-855)

## Overview

Monitoring and alerting for the Supabase connection pool, to catch exhaustion before it takes the app down.

**The thing to understand first:** there is no single "the pool." Several independent ceilings sit in front of this database. Alerting on direct connections alone will miss pooler and Hyperdrive failure modes.

## The connection budget — ceilings, verified 2026-07-30

| Path | Ceiling | Where it's set | Verified how |
|---|---:|---|---|
| **Direct Postgres** | **60** | `max_connections` (compute-derived) | `SHOW max_connections` |
| **App-usable direct** | **57** | `60 − superuser_reserved_connections (3)` | PG setting |
| **Supavisor transaction pooler** | Plan/pooler limit (port **6543**) | Supabase pooler; preferred by Mastra via `MASTRA_DATABASE_URL` | `app/src/mastra/storage.ts`, `app/.env.example` |
| **Cloudflare Hyperdrive** (`ipix-supabase-fresh`) | **5 soft** — configured, **not live prod ceiling** | `origin_connection_limit` (synthetic burst only) | Cloudflare API + [hyperdrive-monitoring-runbook](../../tasks/cloudflare/docs/hyperdrive-monitoring-runbook.md) |
| **Mastra Node `PostgresStore`** | **4** (this app) | `DEFAULT_PG_POOL_MAX = 4` / `MASTRA_PG_POOL_MAX` | `app/src/mastra/storage.ts` |
| **Mastra Workers Hyperdrive store** | **1** (this app; path inactive while `MASTRA_STORAGE_MODE=noop`) | `WORKERS_MASTRA_PG_POOL_MAX = 1` | `app/src/lib/db/mastra-workers-pg-scope.ts`, `app/wrangler.jsonc` |
| **Upstream `@mastra/pg` default** | **20** | Only if app overrides are removed | `@mastra/pg` docs — **not** what this repo uses |

Consequences that are easy to miss:

- **This app already caps Mastra Node at 4 and Workers at 1.** Do not diagnose with the upstream default of 20 unless those overrides were removed. Upstream 20 would claim a third of the 60-connection budget per instance.
- **`ipix-supabase-fresh` is configured but not live.** Binding exists (`HYPERDRIVE_FRESH`); production Workers still default `MASTRA_STORAGE_MODE=noop`, so organic production traffic is **not** routed through Hyperdrive yet. The **5** figure is from a **synthetic burst** against the real binding — treat it as a configured soft limit to monitor, **not** a confirmed production ceiling. Remeasure after a real workload is routed through it.
- **Hyperdrive `origin_connection_limit` is a soft maximum** — it can be briefly exceeded under failures/high traffic. Multiple Hyperdrive configs to the same origin each keep their own pool; **sum them manually** when budgeting against Postgres.
- **Supavisor (6543) is the primary Mastra path today.** Postgres can look fine under 48/60 while the pooler (or, later, Hyperdrive waiting-clients) is saturated. Monitor those surfaces separately.
- **Workers may create request-scoped stores** (`mastra-workers-pg-scope.ts`) when mode=`pg`. There is **no** `postgresStoreInstanceChecker` Babel plugin in this repo or installed Mastra packages — do not assume a build guard. Verify call sites and env caps during incidents.

Hyperdrive origin: `db.nvdlhrodvevgwdsneplk.supabase.co:5432`, user `hyperdrive_mastra_runtime`, caching disabled.

## Configuration

### Threshold

- **Alert threshold**: **≥ 48 of 60** direct connections (80%)
- **Baseline**: 12 in use (2026-07-30)
- **`max_connections`**: 60 (applications effectively contend for **57**)

### Why this threshold

- The original requirement said "80% of pool" without defining *which* pool — see the budget table above. This runbook picks **direct connections** as the Grafana Client Connections denominator.
- Connection **storms** (Vercel serverless fan-out + Mastra concurrency) are the real failure mode, not gradual growth.
- Therefore: **also alert on rate of change**, not level alone (e.g. +25 connections in 60s).

## Accessing monitoring tools

### Grafana Cloud dashboard

1. Open Supabase Dashboard
1. **Integrations** → **Grafana Cloud**
1. Click "Connect" if not already enabled (one-click setup, no credit card for the free tier)
1. Pre-built dashboard with 200+ metrics is configured automatically

⚠️ Connecting Grafana Cloud **exports database metrics to a third party**. Confirm that's acceptable before enabling.

### Database Reports

Dashboard → **Reports** → **Database connections** — historical data, broken down by service (PostgREST, Auth, Storage…).

Equivalent SQL if the report is unavailable or plan-gated:

```sql
select usename, application_name, state, count(*)
from pg_stat_activity
group by 1,2,3
order by 4 desc;
```

### Connection charts

Dashboard → **Database** → **Metrics** — real-time active/idle.

### Hyperdrive (not visible in Supabase)

Hyperdrive pool health lives in the **Cloudflare** dashboard / Hyperdrive metrics (`waitingClients`, `currentPoolSize`, `maxPoolSize`), not Supabase. Check it separately; Supabase cannot see it.

### Supavisor pooler

Mastra durable storage prefers `MASTRA_DATABASE_URL` on port **6543** (transaction pooler). Pooler saturation can starve the app while direct `pg_stat_activity` still looks healthy — check Supabase pooler metrics / connection reports for pooler roles, not only the 48/60 direct alert.

## Interpreting metrics

### Key metrics

- **Active connections** — currently executing
- **Idle connections** — held open, available
- **Idle in transaction** — held open *inside* a transaction; the dangerous one. `idle_in_transaction_session_timeout` is currently **0 (disabled)**, so a leaked transaction holds its connection indefinitely
- **Connection wait time** — time spent waiting for a free slot
- **Connection errors** — failed attempts
- **Hyperdrive `waitingClients`** — clients waiting on the Hyperdrive pool (origin soft-cap pressure)

### Normal operating range (direct connections)

| Range | Count | Meaning |
|---|---|---|
| Normal | 0–30 | 0–50% |
| Warning | 31–47 | 50–79% |
| **Critical** | **≥ 48** | **80%+ — alert fires** |
| Application-exhausted | **57** | Regular application connections rejected (`superuser_reserved_connections = 3`) |
| Total maximum | **60** | Absolute Postgres limit including reserved |

## Alert configuration

### Alert setup

1. Open the **Client Connections** graph in the Grafana dashboard
1. Alert when direct connections are **at or above 48** (`>= 48`), not "exceed 48"
1. Add a second alert on **rate of change** (e.g. +25 connections in 60s)
1. Add a **Hyperdrive contention** check for config `ipix-supabase-fresh` / `HYPERDRIVE_FRESH` (arm when organic traffic is routed; today config is not live — see budget table): alert when `waitingClients` stays elevated or `currentPoolSize` sits at `maxPoolSize`. Direct 48/60 will **not** catch a Hyperdrive-only stall.
1. Notification channels:
   - **Email**: `ops@ipix.ai` — ⚠️ **unverified**, confirm this alias exists and is monitored
   - **Slack**: `#alerts-infrastructure` — ⚠️ **unverified**, confirm the channel exists and the Grafana webhook is installed
1. Fire a **Grafana test notification** (or staging) and confirm delivery — see [Alert testing](#alert-testing)

### Alert Owner

> 🔴 **BLOCKER — this section must be filled in before IPI-855 can be marked Done.**
>
> An alert with no named owner is not monitoring; it is a dashboard nobody watches. These are
> people decisions and are deliberately left blank rather than guessed.

| Role | Who | Contact |
|---|---|---|
| **Primary** | _unassigned_ | — |
| **Backup** | _unassigned_ | — |
| **Escalation** | _unassigned_ | — |

Also confirm: does the on-call rotation exist anywhere else already? If so, link it here rather than duplicating it.

## Response procedures

### Immediate (within 5 minutes)

1. **Acknowledge** the alert in Grafana
1. **Check the spike pattern** — sudden storm or gradual climb? They have different causes
1. **Identify the source**:

```sql
select usename, application_name, client_addr, state, count(*)
from pg_stat_activity
group by 1,2,3,4
order by 5 desc;
```

   - `application_name = 'ipix-mastra'` → Mastra Node pool (`app/src/mastra/storage.ts`)
   - `hyperdrive_mastra_runtime` → Hyperdrive / Workers path
   - PostgREST → app Data API

1. **Check recent deploys** — did a release change pool config, `MASTRA_PG_POOL_MAX`, or add another store?

### Investigation (within 15 minutes)

1. **Look for leaked transactions** — the most common silent cause, and unbounded here:

```sql
select pid, backend_start, usename, application_name, state, now() - state_change as held_for, left(query, 120)
from pg_stat_activity
where state = 'idle in transaction'
order by state_change;
```

1. **Review Database Reports** for historical shape
1. **Check Vercel logs** for serverless fan-out
1. **Check Mastra agent runs** for concurrent execution spikes
1. **Check Hyperdrive metrics** (`waitingClients`, pool size) in Cloudflare — configured soft cap 5 (synthetic; not a live prod ceiling yet); invisible to Supabase graphs
1. **Check Supavisor / `:6543` path** if Mastra is on the pooler
1. **Verify Mastra store call sites and caps** — Node max 4, Workers max 1; do not assume a Babel singleton guard exists in this repo

### Mitigation

1. **List, then terminate leaked transactions** (never blanket-kill without review):

```sql
-- Step A: review candidates (carry pid + backend_start; filter to the leaking identity when known)
select pid, backend_start, usename, application_name, state, now() - state_change as held_for, left(query, 120)
from pg_stat_activity
where state = 'idle in transaction'
  and now() - state_change > interval '10 minutes'
  -- example filter once the leak source is known:
  -- and application_name = 'ipix-mastra'
order by state_change;
```

```sql
-- Step B: terminate only approved (pid, backend_start) pairs — pid alone can be reused
with approved(pid, backend_start) as (
  values
    -- replace with reviewed pairs from Step A (keep backend_start exact):
    (12345::int, '2026-07-30 12:00:00+00'::timestamptz)
)
select pg_terminate_backend(a.pid)
from pg_stat_activity a
join approved using (pid, backend_start);
```

1. **Throttle at the application layer**
1. **Kill long-running queries** via the SQL Editor (same list-then-approve discipline; match `pid` + `backend_start`)
1. **Restart the affected service** if a leak is suspected
1. **Scale compute** if genuinely at capacity — ⚠️ on Supabase `max_connections` is **derived from compute size**; you cannot raise it directly. Changing compute may require a restart. Treat as a capacity decision, not a fast incident action.

### Escalation

| Level | Trigger | Owner | Response | Action |
|---|---|---|---|---|
| 1 | Alert fires | Primary | 15 min | Investigate and mitigate |
| 2 | Sustained >30 min | Primary + Backup | 10 min | Escalate to engineering |
| 3 | Application exhaustion (**≥ 57**/60) | Engineering lead | 5 min | Emergency incident response |

## Prevention

1. **Keep app Mastra caps** — Node `DEFAULT_PG_POOL_MAX = 4`, Workers `WORKERS_MASTRA_PG_POOL_MAX = 1`; override only via `MASTRA_PG_POOL_MAX` with a budget review
1. **Prefer `MASTRA_DATABASE_URL` on Supavisor `:6543`** (transaction pooler) over session/direct `:5432` — see [IPI-740 · MASTRA-OPS-001 — Prevent Supabase Pool Exhaustion Across Mastra Agent and Workflow Runs](https://linear.app/amo100/issue/IPI-740) and [IPI-678 · SB-OPS-001 — Align Infisical DB URL with GitHub session-mode DATABASE_URL](https://linear.app/amo100/issue/IPI-678)
1. **Audit store construction sites** during incidents — Workers intentionally use request-scoped stores; there is no repo Babel `postgresStoreInstanceChecker`
1. **Set query timeouts** — `statement_timeout` is currently 120 s
1. **Consider enabling `idle_in_transaction_session_timeout`** — currently 0. Needs a Supabase support request (`context = superuser`)
1. **Load-test before production deploys** (staging, not unbounded prod)
1. **Review connection patterns weekly** alongside [IPI-857 · SB-MON-003 — Query Performance Monitoring System](https://linear.app/amo100/issue/IPI-857)

## Related

- [IPI-740 · MASTRA-OPS-001 — Prevent Supabase Pool Exhaustion Across Mastra Agent and Workflow Runs](https://linear.app/amo100/issue/IPI-740) — Mastra-specific pool fix
- [IPI-855 · SB-MON-001 — Configure Connection Pool Monitoring & Alerting](https://linear.app/amo100/issue/IPI-855) — this runbook
- [IPI-857 · SB-MON-003 — Query Performance Monitoring System](https://linear.app/amo100/issue/IPI-857) — weekly report this pairs with
- [IPI-803 · CF-DB-012 — Activate Durable Mastra Postgres Storage on the Production Cloudflare Worker](https://linear.app/amo100/issue/IPI-803) — Hyperdrive Mastra storage (origin soft-cap 5)

## References

| Topic | URL |
|---|---|
| Supabase Grafana Cloud | https://supabase.com/blog/observability-for-every-supabase-project-with-grafana-cloud |
| Connection management | https://supabase.com/docs/guides/database/connection-management |
| Telemetry reports | https://supabase.com/docs/guides/telemetry/reports |
| Cloudflare Hyperdrive config | https://developers.cloudflare.com/hyperdrive/configuration/ |
| Hyperdrive soft `origin_connection_limit` | https://developers.cloudflare.com/hyperdrive/configuration/tune-connection-pool/ |
| Hyperdrive metrics | https://developers.cloudflare.com/hyperdrive/observability/metrics/ |
| Mastra PostgreSQL storage | https://mastra.ai/reference/storage/postgresql |
| PG17 `pg_stat_activity` | https://www.postgresql.org/docs/17/monitoring-stats.html#MONITORING-PG-STAT-ACTIVITY-VIEW |

## Testing

### Alert testing

Prefer in this order (do **not** start with an unbounded production connection spike):

1. **Grafana test notification** — use the channel's "test" / "send test notification" path to prove email + Slack delivery without loading the DB
1. **Staging / disposable project** — if you must exercise the threshold query, use a non-prod database
1. **Production only with guardrails** — if production is unavoidable: max synthetic connections ≤ 10, abort if total `pg_stat_activity` ≥ 40, tear down all test backends immediately, coordinate with Primary owner first
1. **Acknowledges** — confirm ack works in Grafana
1. **Escalates** — walk the chain end to end once owners are assigned

### Runbook testing

1. Every team member can open the Grafana dashboard
1. Steps match the current UI
1. Owner/backup contacts are current — **currently unassigned, see blocker above**
1. Monthly review scheduled

## Changelog

| Date | Change | Author |
|---|---|---|
| 2026-07-30 | Initial runbook creation | S K |
| 2026-07-30 | Added multi-ceiling budget (direct / Hyperdrive / Mastra), leaked-transaction detection, compute-derived `max_connections` note, unassigned-owner blocker | Claude |
| 2026-07-30 | PR review fixes: app Mastra caps (4 / 1), Supavisor path, Hyperdrive soft limit + metrics alert, `>= 48` threshold, app-exhausted 57, list-then-terminate, safe alert testing, remove false Babel guard, canonical Linear titles, MD031 fences | Claude |
| 2026-07-30 | Hyperdrive marked configured-not-live (synthetic 5); MD029 `1.` list prefixes; terminate joins on `pid` + `backend_start` | Claude |
