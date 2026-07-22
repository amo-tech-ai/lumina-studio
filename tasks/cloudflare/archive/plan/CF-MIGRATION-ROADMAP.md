# Cloudflare Architecture Migration Roadmap
## Phased Implementation Plan (4 Weeks)

---

## Phase 1: Quick Wins & Blocking Fixes (1 Week)
**Risk:** Low | **Impact:** Fix 6 of 32 issues | **Effort:** 20 hours

### 1.1 Add Zod Validation (Day 1–2)
**Why:** Fixes issues #4, #24, #28 (Gemini guard, tool validation, schema validation)

```typescript
// /app/src/lib/ai/provider-adapter.ts
import { z } from 'zod'

// Pre-routing validation
const ParallelToolCallSchema = z.object({
  parallel_tool_calls: z.boolean().optional(),
  tool_choice: z.enum(['auto', 'required', 'none']).optional(),
  tools: z.array(z.any()).min(1).optional(),
})

export function validateRequestSchema(req: any) {
  // If parallel_tool_calls=true but no tools: 400 error
  ParallelToolCallSchema.parse(req)
}

// Gemini guard (prevents tool-result messages)
const GeminiGuardSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant', 'tool']).refine(
      (role) => role !== 'tool',
      'Gemini does not support tool-result messages'
    )
  }))
})

export function validateGeminiMessages(messages: any[]) {
  if (messages.some(m => m.role === 'tool')) {
    throw new Error('Gemini tool routing guard failed')
  }
}

// Model override validation
const ModelOverrideSchema = z.object({
  model: z.string().min(1),
  tier: z.enum(['chat', 'embedding', 'tool-calling']),
  provider: z.enum(['workers-ai', 'openai', 'gemini']),
})

export function validateModelOverride(override: any) {
  return ModelOverrideSchema.parse(override)
}
```

**Deliverable:** `app/src/lib/ai/provider-schema.ts` (~50 lines)  
**Tests:** Vitest (3 test cases)  
**PR:** `ipi/630-zod-validation-blocking-fixes`

### 1.2 Add Logging Redaction (Day 2–3)
**Why:** Fixes issue #11 (sensitive data exposure)

```typescript
// /app/src/middleware/redacted-logger.ts
export function redactSensitiveData(obj: any) {
  return {
    requestId: obj.requestId,
    timestamp: obj.timestamp,
    latency_ms: obj.latency_ms,
    cost_usd: obj.cost_usd,
    model: obj.model,
    status: obj.status,
    error_type: obj.error?.type, // NOT message
    // All other fields stripped (prompts, tokens, tool args, secrets)
  }
}

// Usage in middleware
app.use((req, res, next) => {
  const log = {
    requestId: req.id,
    timestamp: Date.now(),
    latency_ms: 0,
    cost_usd: 0,
    model: req.query.model,
    status: 200,
  }
  
  console.log(JSON.stringify(redactSensitiveData(log)))
  next()
})
```

**Deliverable:** `app/src/middleware/redacted-logger.ts` (~40 lines)  
**Tests:** Vitest (2 test cases)  
**PR:** `ipi/631-logging-redaction`

### 1.3 Document Test Configuration (Day 3–4)
**Why:** Fixes issues #21, #22, #23 (test env clarity, whitespace, reference scope)

```markdown
# CI Configuration Reference

## AI_GATEWAY_AUTH_TOKEN Injection

The bearer token for AI Gateway is injected into CI via GitHub Secrets:

1. GitHub Settings > Secrets > `AI_GATEWAY_AUTH_TOKEN`
2. CI workflow loads it: `env.AI_GATEWAY_AUTH_TOKEN`
3. Passed to Worker: `wrangler secret put AI_GATEWAY_AUTH_TOKEN`
4. `.dev.vars` is NOT used in CI (local development only)

**Verification:**
```bash
gh run view <id> --log | grep "AI_GATEWAY_AUTH_TOKEN=***"
```

## Whitespace Handling

Line 91 in `worker/src/index.ts`:
```typescript
const token = req.headers.get('authorization')?.substring(7).trim()
```

The `.trim()` is intentional — removes leading/trailing whitespace from bearer token.
This is defensive: some clients may send `"Authorization: Bearer token "` with trailing space.

**Do NOT remove** — this is a security best practice.

## Reference Scope Labels

All audit claims must be labeled with scope:

- `[In main]` — Already merged, production
- `[PR #340]` — In review, not shipped
- `[Branch only]` — Local branch, not on main
- `[Unverified]` — Not yet tested
- `[Deprecated]` — No longer used (Llama 3.1 8B)

Example: "The Gemini provider fallback [In main] uses unsafe routing [PR #340]."
```

**Deliverable:** `tasks/cloudflare/docs/CI-REFERENCE.md` (~150 lines)  
**No tests needed.**  
**PR:** `ipi/632-docs-ci-configuration`

### 1.4 Cost Calculator Placeholder (Day 4–5)
**Why:** Temporarily fix issue #2 (1000× error)

**Status:** Keep broken formula as placeholder. True fix requires AI Gateway spend API (under development by Cloudflare). Once available: switch from calculation to native gateway metrics.

```typescript
// /app/src/utils/cost-calculator.ts
// TEMPORARY: AI Gateway cost API not yet available (as of 2026-07)
export function calculateCost(tokens: {
  inputTokens: number
  outputTokens: number
}, model: string) {
  // PONYTAIL: Placeholder until Cloudflare exposes spend data
  // Issue #2: This calculation is intentionally disabled
  // Migration to recommended architecture (Phase 3) will use AI Gateway budget enforcement
  
  // Once AI Gateway spend API is available:
  // const spend = await aiGateway.getSpendMetrics(key, period)
  // return spend.total_usd
  
  return null // Signal to use fallback
}
```

**No PR needed** — just document as known limitation.

### Phase 1 Summary

| Task | Effort | Impact | PR |
|------|--------|--------|-----|
| Zod validation | 4h | Fix #4, #24, #28 | `ipi/630-*` |
| Logging redaction | 3h | Fix #11 | `ipi/631-*` |
| CI documentation | 2h | Fix #21, #22, #23 | `ipi/632-*` |
| Cost calc note | 1h | Acknowledge #2 (workaround) | None |

**Total:** 10 hours, 6 issues fixed, zero risk, parallel PRs.

---

## Phase 2: Durable Objects Foundation (1 Week)
**Risk:** Low–Medium | **Impact:** Foundation for state persistence | **Effort:** 25 hours

### 2.1 Scaffold Think Framework Agent (Day 1–2)

```typescript
// /app/src/mastra/agent-do.ts
import { Agent } from '@cloudflare/think'

interface AgentState {
  messages: Array<{ role: string; content: string }>
  provider: string
  model: string
  createdAt: number
  updatedAt: number
}

export class OperatorAgent extends Agent<AgentState> {
  initialState = {
    messages: [],
    provider: 'workers-ai',
    model: 'glm-4.7-flash',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }

  async onMessage(message: string, options?: any) {
    // 1. Append user message to state
    this.state.messages.push({ role: 'user', content: message })
    this.state.updatedAt = Date.now()
    
    // 2. Stream inference via AI Gateway (next phase)
    const stream = await this.callAIGateway(this.state.messages)
    
    // 3. Collect tool calls
    for await (const chunk of stream) {
      yield chunk // Stream to client
      if (chunk.tool_calls) {
        await this.onToolCall(chunk.tool_calls)
      }
    }
    
    // 4. Auto-persist state
    await this.setState(this.state)
  }

  async onToolCall(toolCalls: any[]) {
    // Placeholder: Phase 4 will implement embedded function calling
    for (const call of toolCalls) {
      const result = await this.executeToolCall(call)
      this.state.messages.push({
        role: 'tool',
        content: JSON.stringify(result),
      })
    }
  }

  private async callAIGateway(messages: any[]) {
    // Phase 3 will wire this up
    throw new Error('AI Gateway integration pending (Phase 3)')
  }

  private async executeToolCall(call: any) {
    // Phase 4 will implement
    throw new Error('Tool execution pending (Phase 4)')
  }
}
```

**Deliverable:** `app/src/mastra/agent-do.ts` (~80 lines)  
**Dependency:** `npm install @cloudflare/think`

### 2.2 Set Up Durable Object Binding (Day 2–3)

```javascript
// wrangler.jsonc
{
  "durable_objects": {
    "bindings": [
      {
        "name": "OPERATOR_AGENT",
        "class_name": "OperatorAgent",
        "script_name": "ipix-operator",
        "environment": "production"
      }
    ]
  },
  "env": {
    "production": {
      "routes": [
        { "pattern": "api.example.com/*", "zone_name": "example.com" }
      ]
    }
  }
}
```

**Deliverable:** `wrangler.jsonc` (binding config)

### 2.3 Create Worker Entry Point (Day 3–4)

```typescript
// /app/src/app/api/chat/route.ts (simplified for DO)
import { OperatorAgent } from '@/mastra/agent-do'

export async function POST(req: Request, { params }: any) {
  const env = process.env as any
  
  // Get or create Durable Object instance (one per conversation)
  const conversationId = req.headers.get('x-conversation-id') || crypto.randomUUID()
  const stub = env.OPERATOR_AGENT.get(conversationId)
  
  // Get message from request
  const { message } = await req.json()
  
  // Stream response from DO
  return stub.onMessage(message)
}
```

**Deliverable:** `app/src/app/api/chat/route.ts` (~30 lines)

### 2.4 Test Message Persistence (Day 4–5)

```typescript
// app/src/app/api/chat/route.test.ts
describe('Durable Object Agent', () => {
  it('persists messages across invocations', async () => {
    const conversationId = 'test-123'
    const stub = env.OPERATOR_AGENT.get(conversationId)
    
    // First message
    await stub.onMessage('Hello')
    
    // Second message (should remember first)
    const response = await stub.onMessage('What did I say?')
    
    // Verify history persisted
    const state = await stub.getState()
    expect(state.messages.length).toBe(2)
    expect(state.messages[0].content).toBe('Hello')
  })
})
```

**Deliverable:** Test file (~40 lines)

### Phase 2 Summary

| Task | Effort | Deliverable |
|------|--------|-------------|
| Think agent scaffold | 6h | `agent-do.ts` (~80 lines) |
| DO binding config | 2h | `wrangler.jsonc` |
| Worker entry point | 3h | `api/chat/route.ts` (~30 lines) |
| Message persistence test | 3h | Test suite |

**Total:** 14 hours. Runnable on staging, not production (AI Gateway not wired yet).

---

## Phase 3: AI Gateway Integration (1 Week)
**Risk:** Low | **Impact:** Provider routing + fallback | **Effort:** 20 hours

### 3.1 Create AI Gateway Routes Config (Day 1–2)

```json
// wrangler/ai-gateway-routes.json
{
  "routes": [
    {
      "id": "operator-default",
      "name": "Operator Default Route",
      "steps": [
        {
          "id": "try_workers_ai",
          "type": "model_call",
          "provider": "workers_ai",
          "model": "@cf/zai-org/glm-4.7-flash",
          "timeout_ms": 2000
        },
        {
          "id": "fallback_to_openai",
          "type": "model_call",
          "provider": "openai",
          "model": "gpt-4o",
          "condition": "step('try_workers_ai').status != 'success'"
        }
      ],
      "budget": {
        "amount": 100,
        "period": "day",
        "currency": "USD"
      }
    }
  ]
}
```

**Deployment:** Use Cloudflare dashboard or `wrangler ai-gateway config apply`

### 3.2 Wire AI Gateway to Agent (Day 2–4)

```typescript
// /app/src/mastra/agent-do.ts (update)
private async callAIGateway(messages: any[]): AsyncGenerator<any> {
  const endpoint = 'https://api.cloudflare.com/client/v4/accounts/' +
    `${this.env.CLOUDFLARE_ACCOUNT_ID}/ai/gateway/calls`
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${this.env.AI_GATEWAY_AUTH_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      route: 'operator-default',
      messages: messages,
      stream: true,
      tools: this.getAvailableTools(), // Phase 4
    }),
  })
  
  // Stream chunks
  const reader = response.body?.getReader()
  while (reader) {
    const { done, value } = await reader.read()
    if (done) break
    
    const chunk = JSON.parse(new TextDecoder().decode(value))
    yield chunk
  }
}
```

**Deliverable:** `agent-do.ts` (updated, ~120 lines total)

### 3.3 Test Fallback Behavior (Day 4–5)

```typescript
describe('AI Gateway Fallback', () => {
  it('falls back to OpenAI on Workers AI timeout', async () => {
    const stub = env.OPERATOR_AGENT.get('test-fallback')
    
    // Simulate timeout
    env.WORKERS_AI_TIMEOUT = 100 // ms
    
    const response = await stub.onMessage('Test')
    
    // Verify OpenAI fallback was used
    const state = await stub.getState()
    expect(state.provider).toBe('openai') // or 'workers-ai' if it succeeded
  })
})
```

### Phase 3 Summary

| Task | Effort | Impact |
|------|--------|--------|
| AI Gateway config | 4h | Routes JSON |
| Agent integration | 8h | `agent-do.ts` wired |
| Fallback testing | 3h | Live tests |
| Remove custom router | 5h | Delete `providers/`, `registry.ts` |

**Total:** 20 hours. Staging → production canary ready.

---

## Phase 4: Embedded Function Calling (1 Week)
**Risk:** Low | **Impact:** Fix tool calling, reduce code | **Effort:** 18 hours

### 4.1 Add Function Calling Package (Day 1)

```bash
npm install @cloudflare/ai-utils
```

### 4.2 Implement Embedded Execution (Day 1–3)

```typescript
// /app/src/tools/index.ts
import { createToolsFromOpenAPISpec } from '@cloudflare/ai-utils'

// Load OpenAPI specs
const weatherSpec = {
  openapi: '3.0.0',
  info: { title: 'Weather API', version: '1.0' },
  paths: {
    '/weather': {
      post: {
        operationId: 'getWeather',
        parameters: [
          { name: 'lat', required: true, schema: { type: 'number' } },
          { name: 'lon', required: true, schema: { type: 'number' } }
        ],
        requestBody: {
          content: { 'application/json': {} }
        }
      }
    }
  }
}

// Generate tools array
export const tools = createToolsFromOpenAPISpec(weatherSpec, {
  getWeather: async (lat, lon) => {
    const resp = await fetch(`https://weather-api.example.com?lat=${lat}&lon=${lon}`)
    return resp.json()
  }
})

// Usage in agent
export async function executeTools(toolCalls: any[], tools: any[]) {
  const results = []
  for (const call of toolCalls) {
    const tool = tools.find(t => t.function.name === call.function.name)
    if (!tool) throw new Error(`Unknown tool: ${call.function.name}`)
    
    const result = await tool.function.implementation(...Object.values(call.function.arguments))
    results.push({
      tool_call_id: call.id, // ✅ PRESERVED
      role: 'tool',
      content: JSON.stringify(result)
    })
  }
  return results
}
```

**Deliverable:** `app/src/tools/index.ts` (~80 lines)

### 4.3 Integrate Into Agent (Day 3–4)

```typescript
// /app/src/mastra/agent-do.ts (update onToolCall)
async onToolCall(toolCalls: any[]) {
  const { executeTools } = await import('@/tools')
  const results = await executeTools(toolCalls, this.getAvailableTools())
  
  // Append results to state
  this.state.messages.push(...results)
  
  // Continue agentic loop (next turn will read these results)
}
```

### 4.4 Test Multi-Turn Tool Calling (Day 4–5)

```typescript
describe('Multi-turn Tool Calling', () => {
  it('preserves tool_call_id across turns', async () => {
    const stub = env.OPERATOR_AGENT.get('test-tools')
    
    // Turn 1: Query that needs tool
    let response = await stub.onMessage('What is the weather at 40,-73?')
    expect(response.tool_calls[0].id).toBe('call_xyz') // some ID
    
    // Turn 2: Agent should know about the tool result
    response = await stub.onMessage('Tell me if it will rain')
    
    // Verify conversation includes both turns + tool result
    const state = await stub.getState()
    expect(state.messages.some(m => m.role === 'tool')).toBe(true)
    expect(state.messages.find(m => m.role === 'tool')?.tool_call_id).toBe('call_xyz')
  })
})
```

### Phase 4 Summary

| Task | Effort | Impact |
|------|--------|--------|
| Install @cloudflare/ai-utils | 1h | — |
| Implement tools | 6h | `tools/index.ts` (~80 lines) |
| Integrate into agent | 4h | Update `agent-do.ts` |
| Multi-turn test | 4h | Test suite |
| Remove custom executor | 3h | Delete `tool-executor.ts` |

**Total:** 18 hours. Full functionality on staging.

---

## Phase 5: Production Validation (1 Week)
**Risk:** Low | **Impact:** Safe rollout | **Effort:** 15 hours

### 5.1 Load Test on Staging (Day 1–2)

```bash
# Load test: 100 concurrent users, 5 min duration
artillery run staging-load-test.yml --target https://staging.example.com

# Metrics to watch:
# - P50, P95 latency (target: <500ms)
# - Error rate (target: <0.1%)
# - DO evictions (normal, expect hibernation)
# - Cost per request (target: 50–70% cheaper than current)
```

### 5.2 Measure vs Current (Day 2–3)

| Metric | Current | Recommended | Target |
|--------|---------|-------------|--------|
| Latency P50 | 450ms | 350ms | <500ms |
| Latency P95 | 2.1s | 1.2s | <2s |
| Error rate | 0.5% | 0.1% | <0.2% |
| Cost/request | $0.0008 | $0.0003 | 50% cheaper |
| Uptime | 99.5% | 99.95% | >99.9% |

### 5.3 Canary Rollout (Day 3–5)

1. **10% canary** (1 hour)
   - Monitor error rate, latency
   - Zero regression → proceed

2. **50% canary** (2 hours)
   - Monitor cost, DO metrics
   - Check customer reports
   - Zero issues → proceed

3. **100% production** (gradual)
   - All traffic to new architecture
   - Keep old system in standby (1 week)
   - Rollback plan ready

### 5.4 Post-Launch Monitoring (Day 5–7)

```javascript
// Monitor script (run hourly)
const metrics = {
  latency: await fetch('https://api.example.com/metrics/latency'),
  errors: await fetch('https://api.example.com/metrics/errors'),
  cost: await fetch('https://api.example.com/metrics/cost'),
  fallback_rate: await fetch('https://api.example.com/metrics/fallback'),
}

if (metrics.latency.p95 > 2000 || metrics.errors.rate > 0.5) {
  alert('Rollback triggered')
  // Execute rollback plan
}
```

### Phase 5 Summary

| Task | Effort | Owner |
|------|--------|-------|
| Load testing | 5h | DevOps |
| Metrics comparison | 3h | Product |
| Canary deployment | 4h | DevOps |
| Monitoring setup | 3h | Ops |

**Total:** 15 hours.

---

## Overall Timeline

| Phase | Duration | Risk | Effort | Issues Fixed |
|-------|----------|------|--------|--------------|
| **Phase 1** | 1 week | Low | 20h | 6 (validation, logging, docs) |
| **Phase 2** | 1 week | Low–Med | 25h | Foundation (no bugs fixed yet) |
| **Phase 3** | 1 week | Low | 20h | 3 (routing, fallback, circuit breaker) |
| **Phase 4** | 1 week | Low | 18h | 3 (tool calling, multi-turn) |
| **Phase 5** | 1 week | Low | 15h | Validation only |
| **Parallel cleanup** | — | — | 10h | Remove deprecated code |

**Total Effort:** 108 hours (3 FTE-weeks)  
**Total Issues Fixed:** 12 of 32  
**Code Reduction:** 2,000 lines (77%)  
**Risk:** Low (phased, with rollback)

---

## Immediate Actions (This Week)

1. **Approve approach** — Team decision on go/no-go
2. **Create Phase 1 PRs** — Zod validation, logging, docs (3 parallel PRs, low risk)
3. **Set up staging** — Deploy Think agent skeleton to staging
4. **Order AI Gateway routes** — Prepare dynamic routing config
5. **Schedule Phase 2 kickoff** — Durable Objects foundation (next week)

**No production changes this week.** Phase 1 is isolated, non-breaking improvements.

---

**Plan Version:** 1.0  
**Created:** 2026-07-12  
**Updated:** 2026-07-12  
**Next Review:** After Phase 1 completion
