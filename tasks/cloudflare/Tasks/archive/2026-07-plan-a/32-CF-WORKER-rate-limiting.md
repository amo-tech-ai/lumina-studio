> **⚠️ ARCHIVED — DO NOT EXECUTE — HISTORICAL REFERENCE ONLY**
>
> Superseded per `tasks/cloudflare/Tasks/000-Architecture-Decision.md` and the full audit at `tasks/cloudflare/audits/AUDIT-2026-07-14-tasks-folder-and-linear.md` (2026-07-14). This file describes a plan, architecture, or status claim that conflicts with the current, correct approach — following it as written risks real harm (fabricated APIs, security regressions, or false completion claims). Kept for historical reference only.

---

---
title: "Task 32: Configure Worker Rate Limiting"
references:
  - title: "Rate Limiting API"
    url: "https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/"
    topic: "Implement rate limits in Worker code"
  - title: "Workers Analytics Engine"
    url: "https://developers.cloudflare.com/analytics/analytics-engine/"
    topic: "Track rate-limited requests"
  - title: "AI Gateway Rate Limiting"
    url: "https://developers.cloudflare.com/ai-gateway/configuration/rate-limiting/"
    topic: "Gateway-level rate limiting"
  - title: "Security Best Practices"
    url: "https://developers.cloudflare.com/workers/reference/security-model/"
    topic: "Secure API design"
---

# Task 32: Configure Worker Rate Limiting (Frontmatter Already Included)

**Phase:** 4 (Optimization)  
**Complexity:** Medium | **Time:** 30 min  
**Depends on:** Tasks 25-30 (Mastra agents deployed)  
**Enables:** DDoS protection, cost control, fair usage

---

## Purpose

Protect agent endpoints from abuse by implementing rate limiting. Prevent malicious users from overwhelming the service with thousands of requests. Control costs (limit expensive model calls per user).

---

## Goal

✅ Add rate limiting binding to wrangler.jsonc  
✅ Implement rate limit checks in agent routes  
✅ Return 429 (Too Many Requests) when exceeded  
✅ Differentiate limits by user tier (free vs premium)  
✅ Monitor rate-limited requests

---

## User Journey

**iPix ops:** "Someone is spamming our chat endpoint with 1000 requests/second. Without rate limiting, we're paying for every call. With rate limiting, we shut them down at 10 requests/min."

**Scenario:**
- **Normal user:** 10 requests/min ✅ allowed
- **Power user:** 100 requests/min ✅ allowed
- **Bot/attacker:** 1000+ requests/min ❌ rate limited (429)

---

## Steps

### 1. Add Rate Limit Binding to wrangler.jsonc

Update `wrangler.jsonc`:

```jsonc
{
  "name": "ipix-operator",
  
  "ratelimits": [
    {
      "name": "AGENT_LIMITER",
      "namespace_id": "1",
      "simple": {
        "limit": 100,
        "period": 60
      }
    },
    {
      "name": "CHAT_LIMITER",
      "namespace_id": "2",
      "simple": {
        "limit": 10,
        "period": 1
      }
    }
  ],
  
  "env": {
    "production": {
      "bindings": [
        { "binding": "AI", "type": "ai" },
        { "binding": "MASTRA_KV", "type": "kv_namespace", "id": "..." }
      ]
    }
  }
}
```

**Explanation:**
- `AGENT_LIMITER`: 100 requests per 60 seconds (general agent endpoint)
- `CHAT_LIMITER`: 10 requests per 1 second (for chat streaming, stricter)

### 2. Add Rate Check Middleware

Create `app/src/lib/rate-limit-middleware.ts`:

```typescript
export async function checkRateLimit(
  env: Env,
  userId: string,
  limiterName: 'AGENT' | 'CHAT'
): Promise<{ allowed: boolean; remaining: number }> {
  const limiter = limiterName === 'AGENT' ? env.AGENT_LIMITER : env.CHAT_LIMITER
  
  const { success, limit, remaining } = await limiter.limit({
    key: userId,  // Use userId as key, not IP (IPs are shared)
  })
  
  return {
    allowed: success,
    remaining: limit - 1 - (limit - remaining),
  }
}
```

### 3. Wire Into Agent Routes

Update `app/src/app/api/agents/[agent]/route.ts`:

```typescript
import { checkRateLimit } from '@/lib/rate-limit-middleware'

export async function POST(
  req: NextRequest,
  { params }: { params: { agent: string } }
) {
  // 1. Extract user ID from auth token
  const userId = extractUserIdFromAuth(req)
  
  // 2. Check rate limit
  const rateCheck = await checkRateLimit(env, userId, 'AGENT')
  if (!rateCheck.allowed) {
    return NextResponse.json(
      {
        error: 'Rate limit exceeded',
        retryAfter: 60,
      },
      { status: 429 }
    )
  }
  
  // 3. Proceed with agent execution
  // ... rest of handler ...
  
  // 4. Include rate limit info in response
  return NextResponse.json(response, {
    headers: {
      'X-RateLimit-Remaining': String(rateCheck.remaining),
      'X-RateLimit-Reset': String(Math.floor(Date.now() / 1000) + 60),
    },
  })
}
```

### 4. Deploy & Test Locally

```bash
npm run build && npm run preview
```

Test rate limiting:

```bash
# Loop: 15 requests in rapid succession
for i in {1..15}; do
  curl -X POST http://localhost:8787/api/agents/chat \
    -H 'Authorization: Bearer dev-key' \
    -H 'Content-Type: application/json' \
    -d '{"messages":[{"role":"user","content":"Hello"}],"sessionId":"user123"}'
  echo "Request $i"
done

# Expected: First 10 succeed, requests 11-15 return 429
```

---

## Verification

✅ Rate limit binding added to wrangler.jsonc:
```bash
grep -A5 "ratelimits" wrangler.jsonc
```

✅ Middleware function exists:
```bash
ls app/src/lib/rate-limit-middleware.ts
```

✅ Agent route includes rate check:
```bash
grep -A3 "checkRateLimit" app/src/app/api/agents/*/route.ts
```

✅ Local test: 15 requests → 10 pass + 5 get 429 status

---

## Testing

**Unit: Rate limit logic**
```typescript
// First 10 requests → success: true
// Requests 11-15 → success: false
// After 1 second → counter resets, request 16 → success: true
```

**Integration: Actual endpoint**
```bash
# Run loop test above
# Verify HTTP 429 responses on requests 11-15
```

**Monitoring:**
```bash
# View rate-limited requests
wrangler tail --env production | grep "429"

# Should show pattern: 10 success, 5 429, repeat
```

---

## Real-World Context

**Tiers:**

| Tier | Limit | Use Case |
|------|-------|----------|
| **Free** | 10 req/min | Individual users |
| **Pro** | 100 req/min | Small teams |
| **Enterprise** | 1000 req/min | Production apps |

**Implementation:**

```typescript
const tierLimits = {
  'free': 10,
  'pro': 100,
  'enterprise': 1000,
}

const userTier = await getUserTier(userId)  // From database
const limit = tierLimits[userTier]

// Implement tier-based rate limiting
const { success } = await env.AGENT_LIMITER.limit({
  key: userId,
  // Note: Rate Limit API doesn't support dynamic limits
  // Workaround: Use custom logic + return 429 if exceeded
})
```

---

## Limitations & Workarounds

| Limitation | Workaround |
|-----------|-----------|
| Per-location rate limiter (not global) | Each edge location tracks independently (acceptable) |
| Can't use IP address (shared IPs) | Use user ID or auth token as key ✅ |
| No dynamic limits per tier | Implement in code: fetch tier, enforce manually |
| Eventually consistent (not exact) | Acceptable for DDoS; use Analytics Engine for exact counts |

---

## Monitoring

**Query rate-limited requests:**

```bash
# Via wrangler tail
wrangler tail --env production | grep "429"

# Via Analytics Engine (requires setup)
# SELECT COUNT(*) FROM requests WHERE status = 429
```

**Metrics to track:**
- 429 error rate (should be <1% for normal usage)
- Rate-limit rejections per user
- Cost savings from preventing runaway requests

---

## Rollback

```bash
# Remove rate limit binding
# Edit wrangler.jsonc: delete "ratelimits" section

# Remove rate check from routes
# Edit app/src/app/api/agents/[agent]/route.ts: remove checkRateLimit call

# Redeploy
npm run deploy
```

---

## Cost Impact

| Scenario | Without Limit | With Limit | Savings |
|----------|---------------|-----------|---------|
| 1 bot spam (1000 req/sec for 1 hour) | $50+ | $0.10 | 99% |
| Normal + 1 spike user | $10 | $8 | 20% |

---

## Next step

Task 33: Setup Cron Triggers (optional maintenance tasks)

---

**Updated:** 2026-07-12  
**Status:** Ready to implement
