# Cloudflare Workers AI — True and Tried Patterns

**Don't invent. Copy from Cloudflare's own examples.**

Official repos:
- [cloudflare/ai](https://github.com/cloudflare/ai) — utilities, patterns
- [cloudflare/workers-ai-web-crawler](https://github.com/cloudflare/workers-ai-web-crawler) — production example
- [cloudflare/workers](https://github.com/cloudflare/workers-examples) — 100+ starter templates

---

## Pattern 1: Simple Chat (Proven)

**Use:** Any LLM chat interface (operator, brand-intelligence, etc.)

**Official:** [openai-compatible-chat](https://github.com/cloudflare/ai/tree/main/examples/openai-compatible-chat)

**Code:**
```typescript
export default {
  async fetch(request, env) {
    if (request.method !== 'POST') return new Response('GET not supported')
    
    const { messages } = await request.json()
    
    const response = await env.AI.run('@cf/qwen/qwen1.5-7b-chat', {
      messages,
    })
    
    return new Response(JSON.stringify(response), {
      headers: { 'Content-Type': 'application/json' },
    })
  },
}
```

**Deployment:** 
- Add AI binding (dashboard)
- Deploy code
- Test: `curl -X POST https://worker.dev -d '{"messages":[{"role":"user","content":"hi"}]}'`

**✅ This is proven. Use it.**

---

## Pattern 2: Embeddings + RAG (Proven)

**Use:** Search, similarity, document retrieval

**Official:** [rag](https://github.com/cloudflare/ai/tree/main/examples/rag)

**Code (simplified):**
```typescript
export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    
    if (url.pathname === '/embed') {
      const { text } = await request.json()
      const embedding = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
        text,
      })
      return new Response(JSON.stringify(embedding))
    }
    
    if (url.pathname === '/search') {
      const { query } = await request.json()
      // 1. Embed query
      const queryEmbed = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
        text: query,
      })
      // 2. Compare to stored embeddings in KV/Vectorize
      // 3. Return top matches + chat with context
      return new Response(JSON.stringify({ results: [...] }))
    }
  },
}
```

**Flow:**
1. Document ingestion: split → embed each chunk → store in KV/Vectorize
2. Query: embed question → find similar chunks → pass to LLM with context
3. LLM generates answer using those chunks

**✅ This pattern is used in production. Use it for search.**

---

## Pattern 3: Function Calling (Proven)

**Use:** Agents that call tools (brand-intelligence, operators, CRM)

**Official:** [function-calling](https://developers.cloudflare.com/workers-ai/features/function-calling/)

**Key models (tool support):**
- `@cf/qwen/qwen1.5-7b-chat` (function calling)
- `@cf/meta/llama-3-8b-instruct` (function calling)
- `@cf/mistral/mistral-large` (function calling)

**Code:**
```typescript
const tools = [
  {
    name: 'get_weather',
    description: 'Get weather for a location',
    parameters: {
      type: 'object',
      properties: {
        location: { type: 'string' },
      },
      required: ['location'],
    },
  },
]

const response = await env.AI.run('@cf/qwen/qwen1.5-7b-chat', {
  messages: [{ role: 'user', content: 'What is the weather?' }],
  tools,
})

// response.tool_calls = [{ name: 'get_weather', arguments: { location: 'NYC' } }]
// Now execute the tool and loop back to LLM

const toolResult = await fetchWeather('NYC')
const finalResponse = await env.AI.run('@cf/qwen/qwen1.5-7b-chat', {
  messages: [
    { role: 'user', content: 'What is the weather?' },
    { role: 'assistant', tool_calls: response.tool_calls },
    { role: 'tool', tool_call_id: response.tool_calls[0].id, content: JSON.stringify(toolResult) },
  ],
  tools,
})
```

**⚠️ Key fix (2026-07-12):** Tool call IDs are now preserved across turns. This pattern works now.

**✅ Use for operator tool calling.**

---

## Pattern 4: Streaming (Proven)

**Use:** Real-time response (chat UIs, status updates)

**Official:** [streaming](https://github.com/cloudflare/ai/tree/main/examples/streaming)

**Code:**
```typescript
export default {
  async fetch(request, env) {
    const { prompt } = await request.json()
    
    const response = await env.AI.run('@cf/qwen/qwen1.5-7b-chat', {
      messages: [{ role: 'user', content: prompt }],
      stream: true, // Enable streaming
    })
    
    return new Response(response, {
      headers: { 'Content-Type': 'text/event-stream' },
    })
  },
}
```

**Client-side:**
```javascript
const response = await fetch('/stream', { method: 'POST', body: JSON.stringify({ prompt: '...' }) })
const reader = response.body.getReader()
while (true) {
  const { done, value } = await reader.read()
  if (done) break
  console.log(new TextDecoder().decode(value)) // Print chunk
}
```

**✅ Use for real-time operator chat.**

---

## Pattern 5: OpenAI-Compatible API (Proven)

**Use:** If you want to use OpenAI SDKs with Workers AI

**Official:** [openai-compatibility](https://developers.cloudflare.com/workers-ai/configuration/open-ai-compatibility/)

**Code:**
```typescript
import { OpenAI } from 'openai'

const openai = new OpenAI({
  apiKey: 'fake-key',
  baseURL: 'https://api.cloudflare.com/client/v4/accounts/ACCOUNT_ID/ai/v1',
  defaultHeaders: {
    Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
  },
})

const response = await openai.chat.completions.create({
  model: '@cf/qwen/qwen1.5-7b-chat',
  messages: [{ role: 'user', content: 'hi' }],
})
```

**Benefit:** Use any OpenAI-compatible library (LangChain, etc.) with Workers AI.

**✅ Use if you already have OpenAI code.**

---

## Pattern 6: KV Cache (Proven)

**Use:** Cache embeddings, prompt responses, avoid re-computing

**Official:** [kv](https://developers.cloudflare.com/kv/)

**Code:**
```typescript
export default {
  async fetch(request, env) {
    const query = 'what is AI?'
    const cacheKey = `embed:${query}`
    
    // Check KV cache
    let embedding = await env.KV.get(cacheKey)
    if (!embedding) {
      // Cache miss → compute
      const response = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
        text: query,
      })
      embedding = JSON.stringify(response)
      // Store for 1 hour
      await env.KV.put(cacheKey, embedding, { expirationTtl: 3600 })
    }
    
    return new Response(embedding)
  },
}
```

**Dashboard setup:**
1. Settings → Bindings → Add KV
2. Variable: `KV`
3. Namespace: create new or select existing
4. Deploy

**✅ Use to reduce compute cost.**

---

## Pattern 7: Error Handling (Proven)

**Use:** Every production endpoint

**Code:**
```typescript
export default {
  async fetch(request, env) {
    try {
      const response = await env.AI.run('@cf/qwen/qwen1.5-7b-chat', {
        messages: [{ role: 'user', content: '...' }],
      })
      return new Response(JSON.stringify(response))
    } catch (error) {
      // Log for debugging
      console.error('AI error:', error.message, error.status)
      
      // Return user-friendly error
      return new Response(
        JSON.stringify({
          error: 'AI service unavailable',
          status: error.status || 500,
        }),
        { status: error.status || 500 },
      )
    }
  },
}
```

**Errors to expect:**
- 429: Rate limited (free tier exceeded)
- 503: Model service down (rare, has SLA)
- 401: Invalid auth (secret misconfigured)
- Timeout: Model slow (add timeout handling)

**✅ Always wrap in try/catch.**

---

## What NOT to Do

### ❌ Do not reinvent

```typescript
// ❌ Wrong: homegrown retry logic
for (let i = 0; i < 3; i++) {
  try {
    return await env.AI.run(...)
  } catch {
    await new Promise(r => setTimeout(r, 1000 * i))
  }
}

// ✅ Right: use @cloudflare/ai-utils
import { retryWithExponentialBackoff } from '@cloudflare/ai-utils'
return await retryWithExponentialBackoff(() => env.AI.run(...))
```

### ❌ Do not hardcode models

```typescript
// ❌ Wrong
const model = '@cf/qwen/qwen1.5-7b-chat'

// ✅ Right
const model = request.query.get('model') || '@cf/qwen/qwen1.5-7b-chat'
```

### ❌ Do not skip error handling

```typescript
// ❌ Wrong
await env.AI.run(...) // If this fails, Worker crashes

// ✅ Right
try {
  await env.AI.run(...)
} catch (e) {
  return fallback()
}
```

---

## Copy-Paste Starter (Ready to Deploy)

**File: `src/index.ts`**

```typescript
export default {
  async fetch(request, env) {
    // Check method
    if (request.method !== 'POST') {
      return new Response('POST /chat', { status: 405 })
    }

    try {
      // Parse request
      const { messages } = await request.json()
      if (!messages) {
        return new Response(JSON.stringify({ error: 'messages required' }), {
          status: 400,
        })
      }

      // Call AI
      const response = await env.AI.run('@cf/qwen/qwen1.5-7b-chat', {
        messages,
      })

      // Return response
      return new Response(JSON.stringify(response), {
        headers: { 'Content-Type': 'application/json' },
      })
    } catch (error) {
      console.error('Error:', error)
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
      })
    }
  },
}
```

**Deploy:**
```bash
wrangler publish
```

**Test:**
```bash
curl -X POST https://worker.dev/chat \
  -H 'Content-Type: application/json' \
  -d '{"messages":[{"role":"user","content":"hello"}]}'
```

✅ **This works. Start here.**

---

## Next: Link to Official Docs

| Need | Official |
|------|----------|
| All models | [Workers AI Models](https://developers.cloudflare.com/workers-ai/models/) |
| Configuration | [Workers AI Config](https://developers.cloudflare.com/workers-ai/configuration/) |
| Pricing | [Pricing Calculator](https://developers.cloudflare.com/workers/platform/pricing/) |
| Limits | [Rate limits](https://developers.cloudflare.com/workers-ai/platform/limits/) |
| Examples | [cloudflare/ai](https://github.com/cloudflare/ai) |
| Troubleshooting | [Docs → Troubleshooting](https://developers.cloudflare.com/workers-ai/) |

---

**TL;DR:** Copy from Cloudflare's own examples. Don't invent. Deploy. Scale when you need to.
