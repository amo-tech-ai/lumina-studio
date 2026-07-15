> **⚠️ ARCHIVED — DO NOT EXECUTE — HISTORICAL REFERENCE ONLY**
>
> Superseded 2026-07-14. Reason: describes the custom ai-gateway Worker, which the team decided to stop investing in (2026-07-14) — see IPI-487 migration gate. Current plan: `tasks/cloudflare/Tasks/000-Architecture-Decision.md`, Linear IPI-487 (migration gate) and IPI-586/590/591/592/594 (active work).

---

---
title: "Task 33: Setup Cron Triggers for Maintenance"
references:
  - title: "Cron Triggers Documentation"
    url: "https://developers.cloudflare.com/workers/platform/triggers/cron-triggers/"
    topic: "Schedule periodic tasks on Workers"
  - title: "Wrangler Cron Configuration"
    url: "https://developers.cloudflare.com/workers/wrangler/configuration/"
    topic: "Cron trigger configuration in wrangler.jsonc"
  - title: "Scheduled Handlers"
    url: "https://developers.cloudflare.com/workers/runtime-apis/handlers/scheduled/"
    topic: "Implement scheduled() handler"
  - title: "Workers Monitoring"
    url: "https://developers.cloudflare.com/workers/observability/"
    topic: "Monitor cron job execution"
---

# Task 33: Setup Cron Triggers for Maintenance (Frontmatter Already Included)

**Phase:** 4 (Optimization)  
**Complexity:** Low | **Time:** 25 min  
**Depends on:** Tasks 25-30 (Mastra deployed)  
**Enables:** Automatic cleanup, model updates, analytics

---

## Purpose

Schedule periodic maintenance tasks (cleanup old chat sessions, refresh model list, generate daily analytics) using Cloudflare Cron Triggers. Run jobs on a schedule without external tools.

---

## Goal

✅ Create scheduled handler in Worker  
✅ Configure cron expression in wrangler.jsonc  
✅ Implement 3 example jobs (cleanup, analytics, health check)  
✅ Monitor cron execution via logs  
✅ Handle failures gracefully

---

## User Journey

**iPix ops:** "Every day at 2 AM, we want to clean up old chat sessions from KV to save storage. Cron triggers let us run this automatically without external infrastructure."

**Jobs to schedule:**
1. **Cleanup old KV data** (daily, 2 AM UTC)
2. **Refresh agent status** (hourly)
3. **Generate daily analytics** (nightly, 11 PM UTC)

---

## Steps

### 1. Create Scheduled Handler

Add to Worker code (e.g., `services/cloudflare-worker/src/scheduled.ts`):

```typescript
export async function handleScheduled(
  event: ScheduledEvent,
  env: Env,
  ctx: ExecutionContext
) {
  // Determine which job to run based on cron
  const { cron } = event

  console.log(`[cron] Scheduled event: ${cron}`)

  try {
    if (cron === 'cleanup') {
      await cleanupOldSessions(env)
    } else if (cron === 'analytics') {
      await generateDailyAnalytics(env)
    } else if (cron === 'health') {
      await runHealthCheck(env)
    }
  } catch (error) {
    console.error('[cron] Job failed:', error)
    // Send alert or log to Sentry
    throw error
  }
}

// Job implementations
async function cleanupOldSessions(env: Env) {
  console.log('[cleanup] Starting cleanup of sessions older than 7 days')
  const kvNamespace = env.MASTRA_KV

  // List all keys with mastra: prefix
  const { keys } = await kvNamespace.list({ prefix: 'mastra:' })

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  let deletedCount = 0

  for (const key of keys) {
    const data = await kvNamespace.getWithMetadata(key.name)
    if (data?.metadata?.timestamp < sevenDaysAgo) {
      await kvNamespace.delete(key.name)
      deletedCount++
    }
  }

  console.log(`[cleanup] Deleted ${deletedCount} old sessions`)
}

async function generateDailyAnalytics(env: Env) {
  console.log('[analytics] Generating daily report')
  // Query Analytics Engine or KV logs
  // Aggregate: requests, errors, cost, models used
  // Store in KV: reports:2026-07-12
}

async function runHealthCheck(env: Env) {
  console.log('[health] Running health check')

  try {
    // Test AI binding
    const response = await env.AI.run('@cf/qwen/qwen1.5-7b-chat', {
      messages: [{ role: 'user', content: 'ping' }],
    })
    console.log('[health] AI binding: OK')

    // Test KV
    await env.MASTRA_KV.get('health:check')
    console.log('[health] KV binding: OK')
  } catch (error) {
    console.error('[health] Check failed:', error)
    throw error
  }
}
```

### 2. Export Scheduled Handler

In Worker main file (e.g., `services/cloudflare-worker/src/index.ts`):

```typescript
import { handleScheduled } from './scheduled'

export default {
  fetch: handleFetch,
  scheduled: handleScheduled,
}
```

### 3. Configure Cron Expressions

Update `wrangler.jsonc`:

```jsonc
{
  "name": "ipix-operator",
  
  "triggers": {
    "crons": [
      "0 2 * * *",      // Daily at 2 AM UTC (cleanup)
      "0 * * * *",      // Hourly (health check)
      "0 23 * * *"      // Daily at 11 PM UTC (analytics)
    ]
  },
  
  "env": {
    "production": {
      "triggers": {
        "crons": [
          "0 2 * * *",
          "0 * * * *",
          "0 23 * * *"
        ]
      }
    }
  }
}
```

**Cron format:** `minute hour day month dayOfWeek` (5 fields, UTC)

| Expression | Meaning |
|-----------|---------|
| `0 2 * * *` | Daily at 2:00 AM UTC |
| `0 * * * *` | Every hour at :00 |
| `0 23 * * *` | Daily at 11:00 PM UTC |
| `*/15 * * * *` | Every 15 minutes |
| `0 0 * * MON` | Every Monday at midnight |

### 4. Test Locally

```bash
# Start wrangler dev
npm run preview

# Trigger scheduled event manually
curl http://localhost:8787/cdn-cgi/mf/scheduled

# Watch logs
# [cron] Scheduled event: ...
# [cleanup] Starting cleanup...
# [cleanup] Deleted 5 old sessions
```

### 5. Deploy & Monitor

```bash
npm run deploy
```

Check execution in Cloudflare dashboard:

1. Go to **Workers & Pages** → **ipix-operator** → **Triggers** tab
2. View "100 most recent invocations"
3. Each cron job shows:
   - Execution time
   - Status (success/failure)
   - Error message (if failed)

---

## Verification

✅ Scheduled handler exists:
```bash
grep -r "handleScheduled" services/cloudflare-worker/src/
```

✅ Cron expressions in wrangler.jsonc:
```bash
grep -A3 "crons" wrangler.jsonc
```

✅ Export in main Worker file:
```bash
grep "scheduled:" services/cloudflare-worker/src/index.ts
```

✅ Local test: Trigger manually, see logs

✅ Production: Dashboard shows scheduled invocations

---

## Testing

**Unit: Cron expressions**
```typescript
// Test parsing of cron strings
const validCrons = ['0 2 * * *', '0 * * * *']
// All should parse without error
```

**Integration: Actual execution**
```bash
# Wait for scheduled time (or trigger manually in dashboard)
# Check logs: wrangler tail
# Verify cleanup happened: query KV or Analytics
```

**Monitoring:**
```bash
# Query dashboard
# Success rate should be 100%
# Execution time should be consistent
```

---

## Real-World Context

**Common scheduled tasks:**

| Task | Frequency | Payload |
|------|-----------|---------|
| Cleanup old KV data | Daily, 2 AM | Delete keys older than 7 days |
| Generate reports | Daily, 11 PM | Aggregate metrics, store in R2 |
| Refresh models list | Hourly | Fetch latest model IDs from Workers AI |
| Health check | Every 15 min | Verify AI + KV + auth working |
| Sync with external API | Daily, 1 AM | Fetch user list, sync permissions |

---

## Limitations

| Limitation | Impact | Workaround |
|-----------|--------|-----------|
| Slow propagation (up to 15 min) | Job may start late | Acceptable for maintenance |
| Runs on underutilized capacity | May be delayed | Cron triggers are "best effort" |
| No retries (single attempt) | Job failure = missed run | Implement retry logic in code |
| Max 1 concurrent execution | Jobs run serially | Acceptable for iPix scale |
| Max execution time: 30 seconds | Long-running jobs fail | Offload to D1 + read from dashboard |

---

## Error Handling

```typescript
export async function handleScheduled(event, env, ctx) {
  try {
    await runJob(env)
  } catch (error) {
    console.error('Job failed:', error)
    
    // Option 1: Retry (manual)
    // await sleep(5000); await runJob(env)
    
    // Option 2: Alert (email, Slack, Sentry)
    // await notifyOps('Cron job failed', error)
    
    // Option 3: Don't throw (silent failure)
    // return new Response('Job failed, but not critical')
  }
}
```

---

## Rollback

```bash
# Remove cron triggers
# Edit wrangler.jsonc: delete "triggers" section

# Remove scheduled handler
# Edit index.ts: remove scheduled export

# Redeploy
npm run deploy
```

---

## Monitoring in Production

**Dashboard view:**
1. Workers & Pages → ipix-operator → Triggers
2. Filter by status: Success / Failure
3. Export logs: `wrangler tail --env production`

**Logs to look for:**
```
[cron] Scheduled event: 0 2 * * *
[cleanup] Starting cleanup
[cleanup] Deleted 42 old sessions
```

---

## Optional: Advanced Scheduling

For more complex schedules, use **Durable Objects** or **Workflows**:

```typescript
// If cron alone isn't enough:
// - Need guaranteed retries → Use Workflows
// - Need state management → Use Durable Objects
// - Current cron is sufficient for iPix
```

---

## Next step

None—all optimization tasks complete. Summary:

| Task | Feature | Impact |
|------|---------|--------|
| 31 | AI Gateway Caching | 40-90% latency reduction |
| 32 | Worker Rate Limiting | DDoS protection, cost control |
| 33 | Cron Triggers | Automated maintenance |

---

**Updated:** 2026-07-12  
**Status:** Ready to implement (optional)
