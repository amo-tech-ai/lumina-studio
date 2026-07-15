> **⚠️ ARCHIVED — DO NOT EXECUTE — HISTORICAL REFERENCE ONLY**
>
> Superseded 2026-07-14. Reason: assumes Mastra deploys as its own standalone Cloudflare Worker — confirmed false; Mastra stays in-process in the OpenNext Worker (IPI-486). Current plan: `tasks/cloudflare/Tasks/000-Architecture-Decision.md`, Linear IPI-487 (migration gate) and IPI-586/590/591/592/594 (active work).

---

---
title: "Task 30: Monitor Agent Performance + Error Tracking"
references:
  - title: "Cloudflare Workers Observability"
    url: "https://developers.cloudflare.com/workers/observability/"
    topic: "Logging, metrics, and monitoring overview"
  - title: "Workers Logs"
    url: "https://developers.cloudflare.com/workers/observability/logs/"
    topic: "Console logs and log streaming"
  - title: "Tail Workers"
    url: "https://developers.cloudflare.com/workers/observability/logs/tail-workers/"
    topic: "Real-time log streaming with wrangler tail"
  - title: "Analytics Engine"
    url: "https://developers.cloudflare.com/analytics/analytics-engine/"
    topic: "Time-series analytics and cost tracking"
  - title: "AI Gateway Observability"
    url: "https://developers.cloudflare.com/ai-gateway/observability/"
    topic: "Monitoring, usage, and failure tracking"
---

# Task 30: Monitor Agent Performance + Error Tracking

**Phase:** 3 (Mastra Integration)  
**Complexity:** Medium | **Time:** 30 min  
**Depends on:** Tasks 25–29  
**Blocks:** None (final task)

---

## Purpose

Enable observability for agent execution on Cloudflare Workers. Track latency, token usage, errors, and tool call patterns. Use Cloudflare's native logging + optional Sentry for alerts.

---

## Goal

✅ Log agent execution (start, tokens, tool calls, end)  
✅ Capture latency + token cost  
✅ Track errors with context (agent name, message count)  
✅ Query logs via `wrangler tail`  
✅ (Optional) Wire Sentry for error alerting

---

## User Journey

**iPix ops:** "Agents are live on the edge, but we're blind. Is Qwen failing? Are tool calls slow? Are users hitting auth errors?"

**Flow:**
1. Agent starts → log entry
2. Each token → track count + timing
3. Tool call → log name + args
4. Completion → log total latency + cost estimate
5. Error → log with full context
6. Ops runs `wrangler tail` or checks Cloudflare dashboard

---

## Steps

### 1. Create logging utility

Create `app/src/lib/agent-logger.ts`:

```typescript
export interface AgentExecutionLog {
  sessionId: string
  agent: string
  status: 'start' | 'token' | 'toolCall' | 'done' | 'error'
  tokenCount?: number
  toolName?: string
  latencyMs?: number
  costEstimate?: number
  error?: string
}

export class AgentLogger {
  private context: Record<string, unknown> = {}

  setContext(key: string, value: unknown) {
    this.context[key] = value
  }

  log(entry: AgentExecutionLog) {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        ...entry,
        ...this.context,
      })
    )
  }

  error(message: string, err: Error, context?: Record<string, unknown>) {
    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        status: 'error',
        message,
        errorName: err.name,
        errorMessage: err.message,
        stack: err.stack,
        ...this.context,
        ...context,
      })
    )
  }
}
```

### 2. Update stream endpoint to use logging

Update `app/src/app/api/agents/[agent]/stream/route.ts`:

```typescript
import { AgentLogger } from '@/lib/agent-logger'

export async function POST(
  req: NextRequest,
  { params }: { params: { agent: string } }
) {
  const logger = new AgentLogger()
  const sessionId = generateSessionId() // implement or use uuid
  logger.setContext('agent', params.agent)
  logger.setContext('sessionId', sessionId)

  // ... auth check ...

  const startTime = Date.now()
  let tokenCount = 0

  logger.log({
    sessionId,
    agent: params.agent,
    status: 'start',
  })

  try {
    const stream = await agent.stream({ messages })

    for await (const chunk of stream) {
      if (chunk.type === 'token') {
        tokenCount++
        if (tokenCount % 10 === 0) {
          // Log every 10 tokens to avoid noise
          logger.log({
            sessionId,
            agent: params.agent,
            status: 'token',
            tokenCount,
          })
        }
      } else if (chunk.type === 'toolCall') {
        logger.log({
          sessionId,
          agent: params.agent,
          status: 'toolCall',
          toolName: chunk.toolName,
        })
      }
    }

    const latencyMs = Date.now() - startTime
    const costEstimate = (tokenCount * 0.00002) // example: $0.00002 per token for Qwen

    logger.log({
      sessionId,
      agent: params.agent,
      status: 'done',
      tokenCount,
      latencyMs,
      costEstimate,
    })
  } catch (error) {
    logger.error(
      `Agent execution failed`,
      error instanceof Error ? error : new Error(String(error)),
      { tokenCount, latencyMs: Date.now() - startTime }
    )
    // ... send error event ...
  }
}
```

### 3. Query logs locally

```bash
npm run build && npm run preview
```

In another terminal:

```bash
# View live logs (tail mode)
wrangler tail --env production

# Make a request to trigger logs
curl -X POST http://localhost:8787/api/agents/test-registry/stream \
  -H 'Authorization: Bearer dev-key' \
  -H 'Content-Type: application/json' \
  -d '{"messages":[{"role":"user","content":"Hello"}],"sessionId":"test"}'

# Logs should appear in wrangler tail output
```

### 4. (Optional) Sentry integration

Install Sentry:

```bash
cd app
npm install @sentry/nextjs
```

Initialize in `app/src/middleware.ts` or app initialization:

```typescript
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.ENVIRONMENT || 'development',
  tracesSampleRate: 0.1,
})
```

Update logger to capture to Sentry:

```typescript
export class AgentLogger {
  error(message: string, err: Error, context?: Record<string, unknown>) {
    console.error(...)
    
    // Send to Sentry
    if (process.env.SENTRY_DSN) {
      Sentry.captureException(err, {
        tags: context,
        level: 'error',
      })
    }
  }
}
```

### 5. Create dashboard query (Cloudflare)

(Manual via dashboard for now)

1. Go to Cloudflare dashboard
2. Workers → ipix-operator → Logs tab
3. Filter: `status = "done"` to see completed requests
4. Monitor: `latencyMs`, `costEstimate`, `error` columns

---

## Verification

✅ Logger file exists:
```bash
ls app/src/lib/agent-logger.ts
```

✅ Logs structured as JSON:
```bash
npm run build && npm run preview &
sleep 2
curl -X POST http://localhost:8787/api/agents/test-registry/stream \
  -H 'Authorization: Bearer dev-key' \
  -H 'Content-Type: application/json' \
  -d '{"messages":[{"role":"user","content":"Hi"}],"sessionId":"test"}' 2>/dev/null
```

Should see JSON logs in terminal (structured format)

✅ No errors in `wrangler tail`

---

## Testing

### Unit: Log format

```bash
cat > /tmp/test-logger.mjs << 'EOF'
const log = {
  timestamp: new Date().toISOString(),
  agent: 'test-agent',
  status: 'done',
  tokenCount: 42,
  latencyMs: 1234,
  costEstimate: 0.0008,
}
const str = JSON.stringify(log)
console.assert(JSON.parse(str).tokenCount === 42, 'Log parses as JSON')
console.log('✅ Log format valid')
EOF
node /tmp/test-logger.mjs
```

### Integration: Tail logs during streaming

```bash
# Terminal 1: Watch logs
wrangler tail --env development

# Terminal 2: Make request
curl -X POST http://localhost:8787/api/agents/test-registry/stream \
  -H 'Authorization: Bearer dev-key' \
  -H 'Content-Type: application/json' \
  -d '{"messages":[{"role":"user","content":"Count to 5"}],"sessionId":"tail-test"}'
```

**Expected in tail:**
```json
{"timestamp":"2026-07-12T...","agent":"test-registry","status":"start","sessionId":"tail-test"}
{"timestamp":"2026-07-12T...","agent":"test-registry","status":"token","tokenCount":10,"sessionId":"tail-test"}
{"timestamp":"2026-07-12T...","agent":"test-registry","status":"done","tokenCount":25,"latencyMs":2500,"costEstimate":0.0005,"sessionId":"tail-test"}
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| **Logs not appearing in wrangler tail** | Ensure stream endpoint was called (check auth); `console.log()` only works with active preview |
| **JSON.stringify errors (circular)** | Don't log raw `error` object; extract `name`, `message`, `stack` |
| **Sentry DSN not set** | Optional; logs work without it. Only needed for error alerting. |
| **Cost calculation wrong** | Adjust pricing per actual Cloudflare Workers AI rates (check dashboard) |

---

## Real-world context

**Without logging:**
- Agent fails silently in production
- Users report "it's broken"
- No way to debug

**With logging:**
```
2026-07-12T14:23:45Z agent=summarizer status=start
2026-07-12T14:23:47Z agent=summarizer status=done latencyMs=2100 tokenCount=512 costEstimate=0.01
2026-07-12T14:23:50Z agent=extractor status=error errorMessage="Tool 'search' timed out"
```

Ops can see patterns, debug tool failures, estimate costs.

---

## Rollback

```bash
# Remove logging integration
git checkout app/src/app/api/agents/[agent]/stream/route.ts
# Or just leave it; logging is non-breaking
```

---

## Next step

None—all tasks complete. Summary:

| Range | Status |
|-------|--------|
| 01-10: Setup & Gateway | ✅ Complete |
| 11-20: Dashboard Config | ✅ Complete (16 pending) |
| 21-24: NextJS + OpenNext | ✅ Ready |
| 25-30: Mastra Integration | ✅ Ready |

**To deploy:** `npm run deploy` when IPI-525 complete.

---

**Updated:** 2026-07-12  
**Status:** Ready to start
