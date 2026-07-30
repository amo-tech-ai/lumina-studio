# Connection Pool Monitoring Runbook

**Owner:** ⚠️ unassigned — see [Alert Owner](#alert-owner). This runbook is **not operational** until filled in.
**Project:** Supabase `nvdlhrodvevgwdsneplk` · PostgreSQL 17.6
**Linear:** IPI-855 (SB-MON-001 — Configure Connection Pool Monitoring & Alerting)

## Overview

Monitoring and alerting for the Supabase connection pool, to catch exhaustion before it takes the app down.

**The thing to understand first:** there is no single "the pool." Three independent ceilings sit in front of this database, and the smallest one binds. Alerting on direct connections alone will miss two of the three failure modes.

## The connection budget — three ceilings, verified 2026-07-30

| Path | Ceiling | Where it's set | Verified how |
|---|---:|---|---|
| **Direct Postgres** | **60** | `max_connections`, derived from compute size | `SHOW max_connections` |
| **Cloudflare Hyperdrive** | **5** | `origin_connection_limit` on config `ipix-supabase-fresh` | Cloudflare API — Hyperdrive config list |
| **Mastra `PostgresStore`** | **20 per instance** | `max` option; `DEFAULT_MAX_CONNECTIONS = 20` | `@mastra/pg` `stores/pg/src/storage/index.ts` |

Two consequences that are easy to miss:

- **One Mastra store at its default `max: 20` claims a third of the entire 60-connection budget.** Two would claim two-thirds. Mastra ships a Babel plugin, `postgresStoreInstanceChecker`, that **fails the Cloudflare Workers build** if more than one `PostgresStore` is instantiated — precisely to stop this. If that build check ever gets bypassed, this runbook's 48/60 alert is the last line of defence.
- **Hyperdrive caps its own origin pool at 5**, so Hyperdrive-routed traffic can saturate *its* pool while total direct connections still look healthy at, say, 20/60. A Hyperdrive stall will not show up on the Client Connections graph.

Hyperdrive origin: `db.nvdlhrodvevgwdsneplk.supabase.co:5432`, user `hyperdrive_mastra_runtime`, caching disabled.

## Configuration

### Threshold

- **Alert threshold**: **48 of 60** direct connections (80%)
- **Baseline**: 12 in use (2026-07-30)
- **`max_connections`**: 60

### Why this threshold

- The original requirement said "80% of pool" without defining *which* pool — see the budget table above. This runbook picks **direct connections** as the denominator, because that's what Grafana's Client Connections graph actually reports.
- Connection **storms** (Vercel serverless fan-out + Mastra agent concurrency) are the real failure mode here, not gradual growth. A 60-connection ceiling can be crossed in seconds.
- Therefore: **also alert on rate of change**, not level alone. A jump from 12 → 40 in under a minute is more actionable than a steady 45.

## Accessing monitoring tools

### Grafana Cloud dashboard

1. Open Supabase Dashboard
2. **Integrations** → **Grafana Cloud**
3. Click "Connect" if not already enabled (one-click setup, no credit card for the free tier)
4. Pre-built dashboard with 200+ metrics is configured automatically

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

Hyperdrive pool health lives in the **Cloudflare** dashboard, not Supabase. Check it separately; Supabase cannot see it.

## Interpreting metrics

### Key metrics

- **Active connections** — currently executing
- **Idle connections** — held open, available
- **Idle in transaction** — held open *inside* a transaction; the dangerous one. `idle_in_transaction_session_timeout` is currently **0 (disabled)**, so a leaked transaction holds its connection indefinitely
- **Connection wait time** — time spent waiting for a free slot
- **Connection errors** — failed attempts

### Normal operating range (direct connections)

| Range | Count | Meaning |
|---|---|---|
| Normal | 0–30 | 0–50% |
| Warning | 31–47 | 50–79% |
| **Critical** | **48+** | **80%+ — alert fires** |
| Exhausted | 60 | New connections rejected |

Note `superuser_reserved_connections = 3`, so applications effectively contend for **57**, not 60.

## Alert configuration

### Alert setup

1. Open the **Client Connections** graph in the Grafana dashboard
2. Alert when direct connections exceed **48**
3. Add a second alert on **rate of change** (e.g. +25 connections in 60s)
4. Notification channels:
   - **Email**: `ops@ipix.ai` — ⚠️ **unverified**, confirm this alias exists and is monitored
   - **Slack**: `#alerts-infrastructure` — ⚠️ **unverified**, confirm the channel exists and the Grafana webhook is installed
5. Fire a test alert and confirm delivery

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
2. **Check the spike pattern** — sudden storm or gradual climb? They have different causes
3. **Identify the source**:
   ```sql
   select usename, application_name, client_addr, state, count(*)
   from pg_stat_activity
   group by 1,2,3,4 order by 5 desc;
   ```
   `hyperdrive_mastra_runtime` points at Hyperdrive/Mastra; PostgREST points at the app
4. **Check recent deploys** — did a release change pool config or add a `PostgresStore`?

### Investigation (within 15 minutes)

1. **Look for leaked transactions** — the most common silent cause, and unbounded here:
   ```sql
   select pid, usename, state, now() - state_change as held_for, left(query, 120)
   from pg_stat_activity
   where state = 'idle in transaction'
   order by state_change;
   ```
2. **Review Database Reports** for historical shape
3. **Check Vercel logs** for serverless fan-out
4. **Check Mastra agent runs** for concurrent execution spikes
5. **Check Hyperdrive in the Cloudflare dashboard** — it has its own ceiling of 5 and is invisible to Supabase metrics
6. **Confirm only one `PostgresStore` exists** — the Babel check should prevent more, but verify if the build was bypassed

### Mitigation

1. **Terminate leaked transactions** (targeted, not blanket):
   ```sql
   select pg_terminate_backend(pid)
   from pg_stat_activity
   where state = 'idle in transaction'
     and now() - state_change > interval '10 minutes';
   ```
2. **Throttle at the application layer**
3. **Kill long-running queries** via the SQL Editor
4. **Restart the affected service** if a leak is suspected
5. **Scale compute** if genuinely at capacity — ⚠️ on Supabase `max_connections` is **derived from compute size**; you cannot raise it directly. Changing compute may require a restart. This is not a fast mitigation — treat it as a capacity decision, not an incident action.

### Escalation

| Level | Trigger | Owner | Response | Action |
|---|---|---|---|---|
| 1 | Alert fires | Primary | 15 min | Investigate and mitigate |
| 2 | Sustained >30 min | Primary + Backup | 10 min | Escalate to engineering |
| 3 | Exhaustion (57–60/60) | Engineering lead | 5 min | Emergency incident response |

## Prevention

1. **One `PostgresStore` per Worker** — enforced by Mastra's Babel check; don't disable it
2. **Set `max` explicitly** on `PostgresStore` rather than relying on the default 20 — size it against the 60-connection budget, not in isolation
3. **Set query timeouts** — `statement_timeout` is currently 120 s
4. **Consider enabling `idle_in_transaction_session_timeout`** — currently 0, so leaked transactions never self-release. This needs a Supabase support request (`context = superuser`)
5. **Load-test before production deploys**
6. **Review connection patterns weekly** alongside the IPI-857 query-performance report

## Related

- IPI-740 (MASTRA-OPS-001 — Prevent Supabase Pool Exhaustion Across Mastra Agent and Workflow Runs) — fixed the Mastra-specific case
- IPI-855 (SB-MON-001) — this runbook
- IPI-857 (SB-MON-003 — Query Performance Monitoring System) — weekly report this pairs with
- IPI-803 (CF-DB-012) / IPI-822 — Hyperdrive Mastra storage, owner of the 5-connection ceiling

## References

| Topic | URL |
|---|---|
| Supabase Grafana Cloud | https://supabase.com/blog/observability-for-every-supabase-project-with-grafana-cloud |
| Connection management | https://supabase.com/docs/guides/database/connection-management |
| Telemetry reports | https://supabase.com/docs/guides/telemetry/reports |
| Cloudflare Hyperdrive config | https://developers.cloudflare.com/hyperdrive/configuration/ |
| Mastra PostgreSQL storage (`max`, default 20) | https://mastra.ai/reference/storage/postgresql |
| PG17 `pg_stat_activity` | https://www.postgresql.org/docs/17/monitoring-stats.html#MONITORING-PG-STAT-ACTIVITY-VIEW |

## Testing

### Alert testing

1. **Fires** — simulate a connection spike (coordinate first; this is a production database)
2. **Delivers** — confirm email *and* Slack actually receive it
3. **Acknowledges** — confirm ack works in Grafana
4. **Escalates** — walk the chain end to end

### Runbook testing

1. Every team member can open the Grafana dashboard
2. Steps match the current UI
3. Owner/backup contacts are current — **currently unassigned, see blocker above**
4. Monthly review scheduled

## Changelog

| Date | Change | Author |
|---|---|---|
| 2026-07-30 | Initial runbook creation | S K |
| 2026-07-30 | Added the three-ceiling connection budget (direct 60 / Hyperdrive 5 / Mastra 20), verified against Cloudflare and `@mastra/pg`. Added leaked-transaction detection and targeted termination. Corrected "scale up connection pool" — `max_connections` is compute-derived on Supabase, not directly settable. Flagged the unassigned owner as a blocker and the email/Slack targets as unverified. | Claude |
