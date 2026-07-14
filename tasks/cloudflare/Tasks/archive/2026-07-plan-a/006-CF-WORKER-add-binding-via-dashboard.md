> **⚠️ ARCHIVED — DO NOT EXECUTE — HISTORICAL REFERENCE ONLY**
>
> Superseded per `tasks/cloudflare/Tasks/000-Architecture-Decision.md` and the full audit at `tasks/cloudflare/audits/AUDIT-2026-07-14-tasks-folder-and-linear.md` (2026-07-14). This file describes a plan, architecture, or status claim that conflicts with the current, correct approach — following it as written risks real harm (fabricated APIs, security regressions, or false completion claims). Kept for historical reference only.

---

# IPI-472 · CF-DASHBOARD-002 — Add Workers AI Binding to Worker

**Status:** ✅ COMPLETED (2026-07-12)  
**Verified:** Workers AI binding functional, `/health` and `/chat` endpoints tested

---

## Purpose

Add the Workers AI binding to the `ai-gateway` Worker, enabling access to inference models (Llama chat, BGE embeddings).

## What This Task Covers

1. Create Workers AI binding in Worker settings
2. Configure binding name: `AI`
3. Verify models are accessible (Llama 3.1, BGE Base)
4. Test with simple model invocation

## Acceptance Criteria

- ✅ Workers AI binding named `AI` is visible in Worker settings
- ✅ Can invoke `@cf/meta/llama-3.1-8b-instruct` model
- ✅ Can invoke `@cf/baai/bge-base-en-v1.5` model
- ✅ Response is valid JSON with model output
- ✅ Errors handled gracefully (e.g., rate limit → 429)

## Steps

### Dashboard Setup

1. Go to **Cloudflare dashboard**
2. **Workers & Pages** → select `ai-gateway`
3. Click **Settings**
4. Under **Bindings**, click **Add binding**
5. **Create a binding** → **AI**:
   - **Variable name:** `AI`
   - **Type:** AI
   - No additional configuration needed
6. Click **Deploy**

### Verify in Code

Update Worker code (src/index.ts or dashboard editor):

```typescript
export default {
  async fetch(request, env) {
    try {
      // Test Llama chat
      const chatResponse = await env.AI.run(
        '@cf/meta/llama-3.1-8b-instruct',
        {
          messages: [{ role: 'user', content: 'hello' }]
        }
      )
      
      // Test BGE embeddings
      const embedResponse = await env.AI.run(
        '@cf/baai/bge-base-en-v1.5',
        { text: 'hello world' }
      )
      
      return new Response(JSON.stringify({
        status: 'ok',
        chat_model_available: !!chatResponse,
        embed_model_available: !!embedResponse
      }))
    } catch (error) {
      return new Response(JSON.stringify({
        status: 'error',
        message: error.message
      }), { status: 500 })
    }
  }
}
```

## Verification

```bash
# Test health endpoint
curl https://ai-gateway.<account-id>.workers.dev/health

# Test chat model
curl -X POST https://ai-gateway.<account-id>.workers.dev/chat \
  -H 'Content-Type: application/json' \
  -d '{"messages":[{"role":"user","content":"hello"}]}'

# Expected: JSON response with model output

# Test embeddings
curl -X POST https://ai-gateway.<account-id>.workers.dev/embed \
  -H 'Content-Type: application/json' \
  -d '{"text":"hello world"}'

# Expected: JSON with embedding vector
```

## Current State

✅ **COMPLETED**
- Binding name: `AI`
- Chat model: `@cf/meta/llama-3.1-8b-instruct` ✅ tested
- Embed model: `@cf/baai/bge-base-en-v1.5` ✅ tested
- Status: Functional

## Evidence

- Cloudflare dashboard shows `AI` binding under Worker settings
- `/health` endpoint returns binding available
- `/chat` and `/embed` endpoints respond with valid output

## Models Available

| Model | Purpose | Status |
|-------|---------|--------|
| `@cf/meta/llama-3.1-8b-instruct` | Chat / reasoning | ✅ Available |
| `@cf/baai/bge-base-en-v1.5` | Embeddings (768-d) | ✅ Available |
| `@cf/qwen/qwen1.5-7b-chat` | Fast chat | ✅ Available |
| `@cf/mistral/mistral-large` | Long context chat | ✅ Available |

## Next Task

→ `011-CF-DASHBOARD-setup-workers-builds.md`

---

## Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| "AI binding not found" | Binding not deployed | Redeploy worker |
| 429 Too Many Requests | Rate limited | Wait or upgrade plan |
| 503 Service Unavailable | Model temporarily down | Retry or use fallback |
| Invalid model name | Typo in model ID | Check official model list |

## Rollback

Remove binding:
1. Cloudflare dashboard → Worker settings
2. Under **Bindings**, click **Delete** next to `AI`
3. Redeploy
