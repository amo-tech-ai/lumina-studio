# Workers Observability Runbook — ipix-operator

**Ticket:** IPI-709 · CF-OBS-001 (Establish Native Workers Observability and Cutover Alerts)
**Scope:** native Cloudflare Workers Logs only — no Sentry, no external log sinks.
**Workers covered:** `ipix-operator` (production env) and `ipix-operator-preview` (preview env), both defined in `app/wrangler.jsonc`.

## What is enabled

`app/wrangler.jsonc` declares `observability.enabled: true` with `head_sampling_rate: 1` at the top level **and repeated inside both `env.preview` and `env.production`** (named envs do not inherit top-level keys). Sampling rate 1 means 100% of requests are logged — deliberate while traffic is low; drop it (e.g. `0.1`) before any real scale-up. Logs retain for 7 days on the Workers paid plan.

Official reference: <https://developers.cloudflare.com/workers/observability/logs/workers-logs/>

> **Preview-URL caveat:** version-specific preview URLs (the `*-preview.sk-498.workers.dev` style version aliases) do **not** get Workers Logs or tail. The deployed Workers themselves (`ipix-operator`, `ipix-operator-preview`) do. Always tail/query the deployed Worker.

## Dashboard: where the logs live

1. <https://dash.cloudflare.com> → select the iPix account
2. **Workers & Pages** → click **`ipix-operator-preview`** (or **`ipix-operator`**)
3. **Logs** tab (labelled *Observability → Logs* in some dashboard versions) — live and historical (7 days) invocation logs
4. Account-wide querying: **Workers & Pages → Observability → Query Builder**

## Live tail from the CLI

Run from `app/` (worker names and envs resolve from `wrangler.jsonc`). Requires `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` in the environment or `app/.env.local`.

```bash
# Preview Worker (ipix-operator-preview)
npx wrangler tail --env preview --format pretty

# Production Worker (ipix-operator)
npx wrangler tail --env production --format pretty

# Machine-readable (one JSON event per invocation)
npx wrangler tail --env preview --format json
```

Useful filters: `--status error` (only errored invocations), `--method POST`, `--search "<text>"`.

### Verified evidence (2026-07-24, preview Worker)

Three known requests curled against `https://ipix-operator-preview.sk-498.workers.dev` while tailing; all three appeared as tail events (sanitized):

| Request | Outcome | Status | Exceptions |
|---|---|---|---|
| `GET /` (marketing page) | `ok` | 200 | 0 |
| `GET /app` (protected route) | `ok` | 307 → `/login?redirect=%2Fapp` | 0 |
| `GET /api/copilotkit/info` (anonymous) | `ok` | 401 | 0 |

All events carried `scriptVersion.id`, wall/CPU timing, and request metadata — the fields the query views below rely on.

## Query Builder views (definitions)

These are the two standing views IPI-709 names. Query Builder views are created in the dashboard UI (**Workers & Pages → Observability → Query Builder → New query → Save**); the definitions below are the source of truth for what to save.

### View 1 — Errors and exceptions

- **Dataset:** Workers Logs
- **Filter:** `$metadata.error EXISTS` (add `OR $metadata.trigger = "fetch" AND outcome != "ok"` to also catch canceled/exceeded invocations)
- **Scope:** `scriptName in (ipix-operator, ipix-operator-preview)`
- **Visualize:** count of events, grouped by `$metadata.error`
- **Purpose:** any uncaught exception or errored invocation surfaces here; this is the view the cutover alert should be built on.

### View 2 — Latency and CPU by script version

- **Dataset:** Workers Logs
- **Filter:** `scriptName in (ipix-operator, ipix-operator-preview)`
- **Visualize:** `p99(wallTime)` and `p99(cpuTime)`
- **Group by:** `$metadata.scriptVersion` (fall back to `scriptName` for cross-worker comparison)
- **Purpose:** regression check across deploys — a bad version shows up as a step change in p99 grouped by version.

## Logging rules — no secrets, no prompts

Workers Logs stores whatever `console.log` emits, for 7 days, currently at 100% sampling. Therefore:

- **Never log secrets:** no auth headers, cookies, bearer tokens, `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, or any `env.*` secret value.
- **Never log user prompt or completion content** from CopilotKit/Mastra routes — log ids, counts, durations, and outcome codes instead.
- When adding a `console.log` near an AI or auth path, log the request id and status, not the payload.

## Dashboard-only follow-ups (repo admin)

These cannot be done from the repo — they live in the Cloudflare dashboard UI:

- [ ] **Save Query Builder View 1 (errors/exceptions):** Workers & Pages → Observability → Query Builder → build the View 1 definition above → **Save query** as `ipix — errors & exceptions`.
- [ ] **Save Query Builder View 2 (latency/CPU by version):** same path → build the View 2 definition above → **Save query** as `ipix — p99 latency+CPU by version`.
- [ ] **Create the cutover alert:** Notifications → **Add** → choose a Workers alert on error rate for `ipix-operator` (or, if the account plan lacks a suitable Workers alert type, a Health Check / scheduled synthetic hitting `https://ipix.co/` and alerting on failure) → route to the team email/Slack webhook.

Once those three boxes are checked, IPI-709's dashboard-side acceptance criteria are met.
