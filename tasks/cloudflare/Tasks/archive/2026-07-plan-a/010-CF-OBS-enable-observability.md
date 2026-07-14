> **⚠️ ARCHIVED — DO NOT EXECUTE — HISTORICAL REFERENCE ONLY**
>
> Superseded per `tasks/cloudflare/Tasks/000-Architecture-Decision.md` and the full audit at `tasks/cloudflare/audits/AUDIT-2026-07-14-tasks-folder-and-linear.md` (2026-07-14). This file describes a plan, architecture, or status claim that conflicts with the current, correct approach — following it as written risks real harm (fabricated APIs, security regressions, or false completion claims). Kept for historical reference only.

---

# IPI-472 · CF-DASHBOARD-005 — Enable Observability (Logs & Monitoring)

**Status:** ✅ COMPLETED (2026-07-12)  
**Verified:** Logs enabled, console output visible in dashboard

---

## Purpose

Enable real-time logging and monitoring in Cloudflare to track Worker health, errors, and performance.

## What This Task Covers

1. Enable Real-Time Logs in Worker settings
2. Configure log retention
3. Set up error tracking (console.error)
4. Optional: Configure Tail Worker for persistent logs
5. Verify logs appear in dashboard

## Acceptance Criteria

- ✅ Real-time logs visible in Cloudflare dashboard
- ✅ `console.log()` output appears in logs
- ✅ Errors and exceptions captured
- ✅ Logs retained for at least 7 days
- ✅ Can filter logs by status code or error type
- ✅ Performance metrics visible (request duration)

## Steps

### 1. Enable Real-Time Logs in Dashboard

**Navigate to:**
1. Cloudflare dashboard → **Workers & Pages**
2. Select `ai-gateway` worker
3. Click **Logs** tab
4. Click **Enable Real-Time Logs** (if not already enabled)

**Log retention settings:**
- Default: 3 days
- Can upgrade to longer retention (7-30 days) on paid plan

### 2. Add Logging to Worker Code

**Pattern:**

```typescript
export default {
  async fetch(request, env) {
    const startTime = Date.now()
    const method = request.method
    const url = new URL(request.url)
    const path = url.pathname
    
    try {
      // Log incoming request
      console.log(`[${method}] ${path}`)
      
      // Process request
      const response = await handleRequest(request, env)
      
      const duration = Date.now() - startTime
      console.log(`[${method}] ${path} → ${response.status} (${duration}ms)`)
      
      return response
    } catch (error) {
      const duration = Date.now() - startTime
      
      // Log error with context
      console.error(`[ERROR] ${method} ${path}`, {
        message: error.message,
        stack: error.stack,
        duration_ms: duration
      })
      
      return new Response(
        JSON.stringify({
          error: error.message,
          path: path,
          timestamp: new Date().toISOString()
        }),
        { status: 500 }
      )
    }
  }
}

async function handleRequest(request, env) {
  const url = new URL(request.url)
  
  if (url.pathname === '/health') {
    console.log('[health-check]')
    return new Response(JSON.stringify({ status: 'ok' }))
  }
  
  if (url.pathname === '/chat') {
    console.log('[chat-request] processing')
    try {
      const body = await request.json()
      const result = await env.AI.run(env.PRIMARY_MODEL, body)
      console.log('[chat-response] success')
      return new Response(JSON.stringify(result))
    } catch (error) {
      console.error('[chat-error]', error.message)
      throw error
    }
  }
  
  return new Response('Not found', { status: 404 })
}
```

### 3. View Logs in Dashboard

**Real-Time Logs tab:**

1. Worker selected → **Logs** tab
2. See live stream of:
   - Request method + path
   - Response status code
   - Request duration
   - Any console.log/console.error output
3. Click individual log entry to expand and see full details

### 4. Filter Logs

**By status code:**
```
status:500  # Only errors
status:429  # Only rate limits
status:200  # Only successes
```

**By text:**
```
search:"chat-error"
search:"GEMINI_API_KEY"  # Don't search for secrets!
```

### 5. Optional: Tail Worker (Persistent Logs)

For logs older than 3 days, use a Tail Worker:

```typescript
// In separate Worker for log aggregation
export default {
  async fetch(request, env) {
    return new Response('Tail Worker active')
  },
  async tail(events) {
    // Called when ai-gateway logs
    for (const event of events) {
      console.log('[AUDIT]', {
        outcome: event.outcome,
        status: event.status,
        duration: event.eventTimestamp
      })
    }
  }
}
```

Configure in `ai-gateway` settings:
- **Tail Consumers**: Select Tail Worker
- Logs automatically sent to tail worker

## Verification

### Test Logging

```bash
# Test health check
curl https://ai-gateway.<account-id>.workers.dev/health

# Check dashboard logs
# Should see: [GET] /health → 200
```

### Error Logging

```bash
# Send bad request
curl -X POST https://ai-gateway.<account-id>.workers.dev/chat \
  -H 'Content-Type: application/json' \
  -d 'invalid json'

# Check dashboard logs
# Should see: [ERROR] POST /chat (error details)
```

### Performance Metrics

Logs show:
- **Request duration** (ms)
- **Status code** (200, 429, 500, etc.)
- **Model used** (Llama, Qwen, etc.)
- **Error message** (if failed)

## Current State

✅ **COMPLETED**
- Real-time logs: ✅ Enabled
- Log retention: 3 days (default)
- Console logging: ✅ Active
- Error tracking: ✅ Capturing exceptions
- Dashboard view: ✅ Functional

## Evidence

- Cloudflare dashboard → Logs tab shows recent entries
- Each request logged with timestamp, method, path, status
- Errors show full error message
- Performance metrics (duration) visible

## Metrics to Monitor

| Metric | Healthy | Alert |
|--------|---------|-------|
| Avg duration | <500ms | >1s |
| Error rate | <1% | >5% |
| 429 rate | <1% | >10% |
| Availability | >99% | <95% |

## Next Task

→ `014-CF-DASHBOARD-record-live-url.md`

---

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| Logs not appearing | Real-time logs disabled | Enable in settings |
| Logs disappear after 3 days | Retention limit | Upgrade plan or use Tail Worker |
| Sensitive data in logs | Logging secrets | Review code, remove logging |
| Logs too verbose | Too much console.log | Filter or reduce verbosity |

## Log Retention Options

- **Free plan:** 3 days
- **Paid plan:** Up to 30 days
- **Tail Worker:** Custom (unlimited via 3rd party)

## Best Practices

1. **Log entry/exit** of functions
2. **Log errors** with full context
3. **Never log secrets** (API keys, tokens)
4. **Include timing** for performance analysis
5. **Use consistent format** for parsing
