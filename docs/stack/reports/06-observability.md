---
title: "Observability — Sentry, Grafana, Mastra spans"
version: "1.0"
lastUpdated: "2026-07-31"
status: Active
purpose: "What we can see when something breaks in production, and what we cannot."
ssot: ../../../tasks/plan/todo.md
verifiedAgainst: "app/package.json · app/src/mastra/index.ts observability block · app/wrangler.jsonc observability · .github/workflows/"
verifiedAt: "2026-07-31"
scores: { core: 75, advanced: 30, overall: 57 }
---

# Observability — 57/100 (C) 🟡

**One-line problem:** errors, traces and replays are all captured — but the agent
layer is dark. The Mastra span exporter is built, tested, and switched off, so when
an agent produces a wrong answer there is no trace to inspect.

---

## 1. What's in place

| Tool | State | Evidence |
|------|:-----:|----------|
| Sentry error capture | 🟢 | `@sentry/nextjs` ^10.65.0, `NEXT_PUBLIC_SENTRY_DSN` |
| Cloudflare Workers Logs | 🟢 | `app/wrangler.jsonc` `observability.head_sampling_rate: 1` (100%) |
| Mastra `ConsoleLogger` | 🟢 | `index.ts`, `LOG_LEVEL` env |
| Mastra AI spans → Postgres | 🟡 | Built, **opt-in and off** |
| `SensitiveDataFilter` on spans | 🟢 | wired when the exporter is on |
| Supabase logs | 🟢 | `get_logs` via MCP |
| `pg_stat_statements` | 🟢 | installed |
| Sentry tracing / performance | 🟢 | **Configured** — `tracesSampleRate: 0.1` (`instrumentation-client.ts:9`, `sentry.server.config.ts:7`) |
| Sentry session replay | 🟢 | **Configured** — `replaysSessionSampleRate: 0.1` + `Sentry.replayIntegration()` (`instrumentation-client.ts:11,16`) |
| Sentry Seer (AI triage) | ⚪ | MCP available, unused |
| Grafana | ⚪ | not present |
| Uptime / synthetic checks | ⚪ | none |
| Agent quality metrics | ⚪ | see [01-mastra](./01-mastra.md) |

---

## 2. 🟡 The Mastra observability gap

`app/src/mastra/index.ts` contains a fully-built observability pipeline:
`Observability` → `MastraStorageExporter` (batch-with-updates) →
`SensitiveDataFilter`. It's gated behind two env flags:

```env
MASTRA_OBSERVABILITY_EXPORTER=1
MASTRA_SCHEMA=mastra
```

The code comment says the full prod cutover is *"set both flags in Infisical/Vercel
after rehearsal evidence."* The `mastra_ai_spans` table (46 columns) exists and is
empty.

**Plain English:** we built the flight recorder, installed it, and never turned it
on. When `production-planner` produces a wrong shot list today, there is no span to
inspect — only the chat transcript.

This is the cheapest fix on this page: two environment variables.

---

## 3. What's missing that matters

| Gap | Consequence | Fix |
|-----|-------------|-----|
| Mastra exporter off | No agent traces at all | 2 env vars |
| Trace/replay sampled at 10% | Configured — open question is whether 10% catches rare failures | Assess prod capture rate; do **not** reconfigure |
| No Seer triage | Manual issue triage | Sentry MCP `analyze_issue_with_seer` |
| No uptime checks | We learn about downtime from users | Cron ping on `/api/ai/health` |
| Edge function logs unaggregated | 8 functions, separate log stream | Supabase logs → Sentry |
| No agent quality metrics | Can't tell a bad answer from a bad day | Mastra scorers |

---

## 4. Grafana — worth it?

**Not yet.** Grafana solves metric aggregation across many services. iPix has one
app, one database, one worker. Sentry + Supabase logs + Workers Logs already cover
that surface, and adding Grafana now means maintaining a dashboard nobody opens.

**Revisit when** either of these becomes true:
- The Cloudflare migration lands and there are Workers + Vercel + Supabase metrics to correlate
- Mastra AI spans are flowing and we want cost/latency per agent over time

At that point the natural stack is Grafana Cloud with the Postgres datasource
pointed at `mastra_ai_spans` — no extra ingestion pipeline.

---

## 5. Real iPix example

`brand-intelligence-workflow.ts` has 7 steps including `wait-for-crawl` and
`fan-out-enrichment`. If a brand analysis stalls today, the diagnosis path is:

1. Check `brand_crawls.status` in Postgres
2. Check the `start-brand-crawl` edge function logs in the Supabase dashboard
3. Check whether the Firecrawl webhook arrived (`processed_firecrawl_webhooks`)
4. Guess

With the Mastra exporter on, step 1 becomes: open the span for that `runId` and
read which step failed and why. Three manual steps collapse into one.

---

## 6. Progress tracker

| ID | Task | | % | Examine | Verify | Blocker |
|----|------|:-:|--:|---------|--------|---------|
| OB-01 | Sentry error capture | 🟢 | 80 | `@sentry/nextjs` | trigger a test error | — |
| OB-02 | Sentry tracing | 🟢 | 75 | `instrumentation-client.ts:9` | `grep tracesSampleRate` | verify prod capture rate |
| OB-03 | Sentry session replay | 🟢 | 75 | `instrumentation-client.ts:11,16` | `grep replayIntegration` | verify prod capture rate |
| OB-04 | Sentry Seer | ⚪ | 0 | MCP | `analyze_issue_with_seer` | not scoped |
| OB-05 | Mastra span exporter | 🟡 | 50 | `index.ts` | set both flags | rehearsal evidence |
| OB-06 | Workers Logs | 🟢 | 85 | `wrangler.jsonc` | dashboard | — |
| OB-07 | Supabase logs | 🟢 | 70 | MCP `get_logs` | — | not aggregated |
| OB-08 | Uptime checks | ⚪ | 0 | **`/api/ai/health`** — `/api/health` is not a route | — | not scoped |
| OB-09 | Grafana | ⚪ | 0 | — | — | **deliberately deferred** |

---

## 7. Next 5 tasks

| # | Task | Effort | Why |
|:-:|------|:------:|-----|
| 1 | Turn on `MASTRA_OBSERVABILITY_EXPORTER=1` + `MASTRA_SCHEMA=mastra` in prod | S | Built, tested, gated. Two variables |
| 2 | Verify the existing 10% sampling actually captures prod failures | S | Both configured — the question is coverage, not setup |
| 3 | Uptime check on `/api/ai/health` + the `ai-gateway` worker | S | Currently users are the monitor. Note `/api/health` does not exist |
| 4 | Aggregate the 8 edge-function log streams into Sentry | M | Today each is checked separately |
| 5 | Wire Sentry Seer into PR triage | M | Sentry MCP is already connected |

---

## 8. Sources

- [Sentry Next.js](https://docs.sentry.io/platforms/javascript/guides/nextjs/) · Sentry MCP (connected)
- [Cloudflare Workers Logs](https://developers.cloudflare.com/workers/observability/logs/workers-logs/)
- Code: `app/src/mastra/index.ts` observability block · `app/wrangler.jsonc`
