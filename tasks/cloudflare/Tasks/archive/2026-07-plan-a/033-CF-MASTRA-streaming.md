> **⚠️ ARCHIVED — DO NOT EXECUTE — HISTORICAL REFERENCE ONLY**
>
> Superseded 2026-07-14. Reason: assumes Mastra deploys as its own standalone Cloudflare Worker — confirmed false; Mastra stays in-process in the OpenNext Worker (IPI-486). Current plan: `tasks/cloudflare/Tasks/000-Architecture-Decision.md`, Linear IPI-487 (migration gate) and IPI-586/590/591/592/594 (active work).

---

---
title: "Task 29: Implement Streaming Agent Responses"
references:
  - title: "Vercel AI SDK Integration"
    url: "https://developers.cloudflare.com/workers-ai/configuration/ai-sdk/"
    topic: "Streaming with React chat and provider integration"
  - title: "Workers Runtime APIs"
    url: "https://developers.cloudflare.com/workers/runtime-apis/"
    topic: "TransformStream and Response streaming"
  - title: "Mastra Streaming"
    url: "https://mastra.ai/guides/deployment/cloudflare"
    topic: "Stream agent responses in real-time"
  - title: "Server-Sent Events MDN"
    url: "https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events"
    topic: "EventSource API and SSE protocol"
---

# Task 29: Implement Streaming Agent Responses (SSE)

**Phase:** 3 (Mastra Integration)  
**Complexity:** High | **Time:** 30 min  
**Depends on:** Tasks 25, 26, 27, 28  
**Blocks:** 30

---

## Purpose

Enable real-time streaming of agent responses via Server-Sent Events (SSE). Clients see tokens and tool calls as they stream, not after full completion. Cloudflare Workers natively support streaming; Mastra has built-in streaming support.

---

## Goal

✅ Implement `/api/agents/[agent]/stream` endpoint with SSE  
✅ Stream token-by-token output from Qwen model  
✅ Stream tool call status updates  
✅ Handle connection cleanup + error recovery  
✅ Test in browser with EventSource API

---

## User Journey

**iPix frontend:** "Chat feels slow when waiting for full agent response. We want to show tokens as they arrive (like ChatGPT)."

**Flow:**
1. Frontend opens EventSource to `/api/agents/chat/stream`
2. Backend starts agent with streaming enabled
3. Agent yields tokens → backend sends SSE chunks
4. Tool calls happen → backend sends `toolCall:` events
5. Completion → backend sends `done` + closes stream

---

## Steps

### 1. Create streaming endpoint

Create `app/src/app/api/agents/[agent]/stream/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { validateAgentAuth, createAuthResponse } from '../../middleware'
import { mastra } from '@/mastra'

export async function POST(
  req: NextRequest,
  { params }: { params: { agent: string } }
) {
  // Auth check
  const auth = validateAgentAuth(req)
  if (!auth.valid) {
    return createAuthResponse(auth.error!)
  }

  const { messages, sessionId } = await req.json()

  // Load agent
  const agent = mastra.agents[params.agent]
  if (!agent) {
    return NextResponse.json(
      { error: `Agent "${params.agent}" not found` },
      { status: 404 }
    )
  }

  // Create streaming response
  const { readable, writable } = new TransformStream()
  const writer = writable.getWriter()
  const encoder = new TextEncoder()

  // Helper to send SSE event
  const sendEvent = async (type: string, data: unknown) => {
    const message = `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`
    await writer.write(encoder.encode(message))
  }

  // Run agent in background, stream to client
  ;(async () => {
    try {
      // Send start event
      await sendEvent('start', { sessionId })

      // Stream agent response
      const stream = await agent.stream({
        messages,
        // ...(state && { context: state }),
      })

      let fullContent = ''
      for await (const chunk of stream) {
        if (chunk.type === 'token') {
          // Token received
          fullContent += chunk.content
          await sendEvent('token', { content: chunk.content })
        } else if (chunk.type === 'toolCall') {
          // Tool call initiated
          await sendEvent('toolCall', {
            name: chunk.toolName,
            args: chunk.args,
            callId: chunk.callId,
          })
        } else if (chunk.type === 'toolResult') {
          // Tool call completed
          await sendEvent('toolResult', {
            callId: chunk.callId,
            result: chunk.result,
          })
        }
      }

      // Save state to KV
      // const kvStore = new CloudflareKVStore({ namespace: env.MASTRA_KV })
      // await kvStore.set(sessionId, { content: fullContent, timestamp: Date.now() })

      // Send completion
      await sendEvent('done', { content: fullContent, sessionId })
      await writer.close()
    } catch (error) {
      console.error(`Stream error for agent ${params.agent}:`, error)
      await sendEvent('error', {
        message: error instanceof Error ? error.message : 'Unknown error',
      })
      await writer.close()
    }
  })()

  // Return streaming response
  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
```

### 2. Frontend EventSource client

Create `app/src/lib/agent-client.ts`:

```typescript
export class AgentStreamClient {
  private baseUrl: string
  private token: string

  constructor(baseUrl: string, token: string) {
    this.baseUrl = baseUrl
    this.token = token
  }

  async *stream(agent: string, messages: Array<{ role: string; content: string }>, sessionId: string) {
    const url = `${this.baseUrl}/api/agents/${agent}/stream`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`,
      },
      body: JSON.stringify({ messages, sessionId }),
    })

    if (!response.ok) {
      throw new Error(`Agent stream failed: ${response.statusText}`)
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error('No response body')

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      let event: string | null = null
      let data: string | null = null

      for (const line of lines) {
        if (line.startsWith('event: ')) {
          event = line.slice(7)
        } else if (line.startsWith('data: ')) {
          data = line.slice(6)
        } else if (line === '' && event && data) {
          yield { event, data: JSON.parse(data) }
          event = null
          data = null
        }
      }
    }
  }
}
```

### 3. React hook for streaming

Create `app/src/lib/useAgentStream.ts`:

```typescript
import { useState, useCallback } from 'react'
import { AgentStreamClient } from './agent-client'

export function useAgentStream(token: string) {
  const [isStreaming, setIsStreaming] = useState(false)
  const [tokens, setTokens] = useState<string[]>([])

  const client = new AgentStreamClient(process.env.NEXT_PUBLIC_API_URL || '', token)

  const stream = useCallback(
    async (agent: string, messages: any[], sessionId: string) => {
      setIsStreaming(true)
      setTokens([])

      try {
        for await (const { event, data } of client.stream(agent, messages, sessionId)) {
          if (event === 'token') {
            setTokens((prev) => [...prev, data.content])
          } else if (event === 'toolCall') {
            console.log('Tool call:', data.name, data.args)
          } else if (event === 'done') {
            console.log('Stream complete')
          } else if (event === 'error') {
            console.error('Stream error:', data.message)
          }
        }
      } finally {
        setIsStreaming(false)
      }
    },
    [client]
  )

  return { stream, isStreaming, tokens: tokens.join('') }
}
```

---

## Verification

✅ TypeScript compiles:
```bash
npm run typecheck
```

✅ Stream endpoint exists:
```bash
ls app/src/app/api/agents/[agent]/stream/route.ts
```

✅ Client utils exist:
```bash
ls app/src/lib/agent-client.ts app/src/lib/useAgentStream.ts
```

---

## Testing

### Unit: SSE event format

```bash
cat > /tmp/test-sse.mjs << 'EOF'
const testEvent = `event: token\ndata: {"content":"hello"}\n\n`
const lines = testEvent.split('\n')
console.assert(lines[0] === 'event: token', 'Event line format')
console.assert(lines[1].startsWith('data:'), 'Data line format')
console.log('✅ SSE format valid')
EOF
node /tmp/test-sse.mjs
```

### Integration: Local streaming

```bash
npm run build && npm run preview
```

In browser (or curl):

```bash
curl -X POST http://localhost:8787/api/agents/test-registry/stream \
  -H 'Authorization: Bearer dev-key' \
  -H 'Content-Type: application/json' \
  -d '{"messages":[{"role":"user","content":"Say hello"}],"sessionId":"test-1"}'
```

**Expected output:**
```
event: start
data: {"sessionId":"test-1"}

event: token
data: {"content":"Hello"}

event: token
data: {"content":" there"}

event: done
data: {"content":"Hello there","sessionId":"test-1"}
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| **Stream endpoint returns 404** | Check route file path: `app/src/app/api/agents/[agent]/stream/route.ts` |
| **EventSource fails with CORS** | Add `Access-Control-Allow-Origin` header in stream handler (already in code) |
| **Tokens not arriving** | Check agent `.stream()` method exists in Mastra; may be `.streamTokens()` in some versions |
| **Connection hangs** | Ensure `writer.close()` is called after streaming completes |

---

## Real-world context

**Without streaming:**
- User sends message
- Wait 5 seconds (full inference)
- Get entire response at once → feels slow

**With streaming:**
- User sends message
- See first token in 100ms
- See tokens arriving 1–10 per second
- Full response ready in 5 sec, but UI shows progress

---

## Rollback

```bash
rm app/src/app/api/agents/[agent]/stream/route.ts
rm app/src/lib/agent-client.ts app/src/lib/useAgentStream.ts
npm run typecheck
```

---

## Next step

Task 30: Monitor agent performance + error tracking

---

**Updated:** 2026-07-12  
**Status:** Ready to start
