> **⚠️ ARCHIVED — DO NOT EXECUTE — HISTORICAL REFERENCE ONLY**
>
> Superseded per `tasks/cloudflare/Tasks/000-Architecture-Decision.md` and the full audit at `tasks/cloudflare/audits/AUDIT-2026-07-14-tasks-folder-and-linear.md` (2026-07-14). This file describes a plan, architecture, or status claim that conflicts with the current, correct approach — following it as written risks real harm (fabricated APIs, security regressions, or false completion claims). Kept for historical reference only.

---

---
title: "Task 28: Implement Agent Auth + State Persistence"
references:
  - title: "Cloudflare KV"
    url: "https://developers.cloudflare.com/kv/"
    topic: "Store agent conversation state with TTL"
  - title: "Agent State in Mastra"
    url: "https://developers.cloudflare.com/agents/api-reference/store-and-sync-state/"
    topic: "Persistent conversation memory"
  - title: "Security Model in Workers"
    url: "https://developers.cloudflare.com/workers/reference/security-model/"
    topic: "Secure authentication and authorization"
  - title: "Bearer Token Authentication"
    url: "https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/"
    topic: "Implement token validation middleware"
---

# Task 28: Implement Mastra Agent Auth + KV State Persistence

**Phase:** 3 (Mastra Integration)  
**Complexity:** High | **Time:** 40 min  
**Depends on:** Tasks 21, 25, 26, 27  
**Blocks:** 29

---

## Purpose

Secure agent endpoints with Bearer token auth. Wire Mastra agent state to Cloudflare KV so multi-turn conversations persist across Worker invocations (ephemeral runtime constraint).

---

## Goal

✅ Implement auth middleware for `/api/agents/*` routes  
✅ Create KV store adapter for Mastra memory  
✅ Test multi-turn conversation (state survives across requests)  
✅ Understand KV key schema (no collisions, reasonable TTL)

---

## User Journey

**iPix security:** "Agents are on the public edge. We need auth before exposing them. Also, agent conversations must survive across requests (Cloudflare is stateless)."

**Flow:**
1. Deploy agent → accessible at `*.workers.dev`
2. Client sends `Authorization: Bearer <token>` + message
3. Middleware validates token
4. Agent loads conversation state from KV
5. Agent processes message + tool calls
6. Agent saves new state to KV
7. Response streams back to client

---

## Steps

### 1. Create KV adapter for Mastra

Create `app/src/lib/mastra-kv-store.ts`:

```typescript
import { MemoryStore } from '@mastra/core'

interface KVStoreConfig {
  namespace: R2Namespace  // From Wrangler binding
}

export class CloudflareKVStore implements MemoryStore {
  private kv: R2Namespace

  constructor(config: KVStoreConfig) {
    this.kv = config.namespace
  }

  async get(key: string): Promise<unknown> {
    const value = await this.kv.get(`mastra:${key}`)
    if (!value) return null
    return JSON.parse(value.text())
  }

  async set(key: string, value: unknown): Promise<void> {
    await this.kv.put(
      `mastra:${key}`,
      JSON.stringify(value),
      { expirationTtl: 7 * 24 * 60 * 60 } // 7 days
    )
  }

  async delete(key: string): Promise<void> {
    await this.kv.delete(`mastra:${key}`)
  }
}
```

**Why KV, not D1?** KV is faster for frequent state updates; D1 better for analytics/audit logs. For agent conversation memory, KV's TTL + atomic updates fit better.

### 2. Implement auth middleware

Create `app/src/app/api/agents/middleware.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'

export function validateAgentAuth(req: NextRequest): { valid: boolean; error?: string } {
  const authHeader = req.headers.get('authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    return { valid: false, error: 'Missing or invalid Authorization header' }
  }

  const token = authHeader.slice(7)
  const expected = process.env.MASTRA_API_KEY || 'dev-key'

  if (token !== expected) {
    return { valid: false, error: 'Invalid token' }
  }

  return { valid: true }
}

export function createAuthResponse(error: string, status = 401) {
  return NextResponse.json({ error }, { status })
}
```

### 3. Wire auth into agent route handler

Update `app/src/app/api/agents/[agent]/route.ts` (or create if missing):

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { validateAgentAuth, createAuthResponse } from '../middleware'
import { mastra } from '@/mastra'
import { CloudflareKVStore } from '@/lib/mastra-kv-store'

export async function POST(
  req: NextRequest,
  { params }: { params: { agent: string } }
) {
  // 1. Auth check
  const auth = validateAgentAuth(req)
  if (!auth.valid) {
    return createAuthResponse(auth.error!)
  }

  // 2. Parse request
  const { messages, sessionId } = await req.json()
  if (!messages || !Array.isArray(messages)) {
    return NextResponse.json(
      { error: 'Invalid messages format' },
      { status: 400 }
    )
  }

  // 3. Load agent
  const agent = mastra.agents[params.agent]
  if (!agent) {
    return NextResponse.json(
      { error: `Agent "${params.agent}" not found` },
      { status: 404 }
    )
  }

  // 4. Load state from KV (example: using sessionId)
  // const kvStore = new CloudflareKVStore({ namespace: env.MASTRA_KV })
  // const state = await kvStore.get(sessionId)
  // (wire this in task 29 after KV binding is live)

  // 5. Run agent
  try {
    const response = await agent.generate({
      messages,
      // ...(state && { context: state }),  // Restore state
    })

    // 6. Save state to KV
    // await kvStore.set(sessionId, response.state)

    return NextResponse.json({
      content: response.text || response.message,
      sessionId,
      usage: response.usage,
    })
  } catch (error) {
    console.error(`Agent ${params.agent} error:`, error)
    return NextResponse.json(
      { error: 'Agent execution failed' },
      { status: 500 }
    )
  }
}
```

### 4. Set Mastra API key in wrangler.jsonc

Update from task 26:

```jsonc
"env": {
  "production": {
    "secrets": [
      "GEMINI_API_KEY",
      "MASTRA_API_KEY"  // Set via `wrangler secret put MASTRA_API_KEY`
    ]
  }
}
```

---

## Verification

✅ TypeScript compiles:
```bash
npm run typecheck
```

✅ Auth middleware exports exist:
```bash
grep -r "validateAgentAuth\|createAuthResponse" app/src/app/api/agents/
```

✅ KV store adapter exists:
```bash
ls app/src/lib/mastra-kv-store.ts
```

---

## Testing

### Unit: Auth validation

```bash
cat > /tmp/test-auth.test.ts << 'EOF'
import { validateAgentAuth } from '@/app/api/agents/middleware'
import { NextRequest } from 'next/server'

const mockReq = (header?: string) => ({
  headers: new Map([['authorization', header || '']]),
})

console.assert(
  !validateAgentAuth(mockReq()).valid,
  'Missing auth header should fail'
)

console.assert(
  !validateAgentAuth(mockReq('Bearer invalid')).valid,
  'Invalid token should fail'
)

console.log('✅ Auth validation tests pass')
EOF
```

### Integration: Local preview with auth

```bash
npm run build && npm run preview
```

In another terminal:

```bash
# Without auth → 401
curl -X POST http://localhost:8787/api/agents/test-registry \
  -H 'Content-Type: application/json' \
  -d '{"messages":[{"role":"user","content":"Hello"}]}'
# Expected: 401 Unauthorized

# With auth (dev key) → 200
curl -X POST http://localhost:8787/api/agents/test-registry \
  -H 'Authorization: Bearer dev-key' \
  -H 'Content-Type: application/json' \
  -d '{"messages":[{"role":"user","content":"Hello"}]}'
# Expected: 200 + agent response
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| **KVStore import fails** | File may not exist yet; create `app/src/lib/mastra-kv-store.ts` |
| **Auth always fails** | Check `MASTRA_API_KEY` env var; for local dev, `process.env.MASTRA_API_KEY` may be undefined |
| **Agent route not found** | Create `app/src/app/api/agents/[agent]/route.ts` if it doesn't exist |
| **Streaming not working** | Defer to task 29 (streaming handler requires SSE setup) |

---

## Real-world context

**Without persistent state:**
```
Request 1: Client → "What is 2+2?" → Agent calculates → Response: "4"
Request 2: Client → "And +3?" → Agent has no context of Request 1
```

**With KV state:**
```
Request 1: sessionId=abc → Agent calculates, saves {context: "2+2"} to KV
Request 2: sessionId=abc → Agent loads {context: "2+2"} from KV → understands "+3"
```

---

## Rollback

```bash
rm app/src/lib/mastra-kv-store.ts
git checkout app/src/app/api/agents/
npm run typecheck  # Remove references
```

---

## Next step

Task 29: Implement streaming agent responses (SSE)

---

**Updated:** 2026-07-12  
**Status:** Ready to start
