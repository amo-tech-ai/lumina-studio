# Cloudflare Workers AI — 10 Minute Dashboard Setup

**Official:** [Cloudflare Workers AI Docs](https://developers.cloudflare.com/workers-ai/)  
**Examples:** [cloudflare/workers-ai-web-crawler](https://github.com/cloudflare/workers-ai-web-crawler) · [cloudflare/ai](https://github.com/cloudflare/ai)

---

## Step 1: Verify You Have a Cloudflare Account

Dashboard: https://dash.cloudflare.com

If not, create one. Free tier includes:
- Workers (120k requests/day free)
- Workers AI (limited free tier, see pricing)
- Workers KV (3GB free)

---

## Step 2: Create or Open a Worker

**Dashboard → Workers & Pages → Create application → Create Worker**

Name: `my-ai-worker`

You now have:
- A live URL: `https://my-ai-worker.USERNAME.workers.dev`
- A basic `hello world` script

---

## Step 3: Add Workers AI Binding (Dashboard)

**Worker settings → Bindings → Add binding → AI**

| Field | Value |
|-------|-------|
| Variable name | `AI` |
| AI model | (leave empty — AI binding is just permission) |

Click **Deploy**.

Your Worker now has `env.AI` available.

---

## Step 4: Use It in Code

Replace `src/index.ts` with:

```typescript
export default {
  async fetch(request, env) {
    const response = await env.AI.run('@cf/mistral/mistral-7b-instruct-v0.1', {
      prompt: 'Hello, how are you?',
    })
    return new Response(JSON.stringify(response))
  },
}
```

Deploy: Dashboard → **Deploy** (or `wrangler publish`)

Test: Open your Worker URL in browser → see response

---

## Step 5: Try Other Models

Official model list: [Cloudflare Workers AI Models](https://developers.cloudflare.com/workers-ai/models/)

Replace `@cf/mistral/mistral-7b-instruct-v0.1` with any model ID, e.g.:

| Task | Model | Example |
|------|-------|---------|
| Chat | `@cf/qwen/qwen1.5-7b-chat` | `{ prompt: 'Hi' }` |
| Embed | `@cf/baai/bge-base-en-v1.5` | `{ text: 'hello' }` → 768 dims |
| Translate | `@cf/meta/m2m100-1.2b` | `{ text: '...', target_lang: 'en' }` |
| Image gen | `@cf/stabilityai/stable-diffusion-xl-base-1.0` | `{ prompt: '...' }` |

**Pro tip:** Start with one model, test it, then add more.

---

## Step 6: No More Setup Needed

That's it. You now have:

✅ A Worker running on Cloudflare edge  
✅ Workers AI access (pay-as-you-go after free tier)  
✅ A live URL  
✅ Auto-scaling, no server management  

---

## Common Next Steps (Separate Tasks)

| Goal | Link | Effort |
|------|------|--------|
| Add to Next.js app | [Next.js Integration](https://developers.cloudflare.com/workers/get-started/quickstarts/#frameworks) | 1 hour |
| Add KV cache | [KV Docs](https://developers.cloudflare.com/kv/) | 30 min |
| Use with OpenAI SDK | [OpenAI Compatibility](https://developers.cloudflare.com/workers-ai/configuration/open-ai-compatibility/) | 15 min |
| Tool calling | [Function Calling](https://developers.cloudflare.com/workers-ai/features/function-calling/) | 2 hours |
| Deploy to production | [Custom domain](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/) | 15 min |

---

## Troubleshooting

**"Model not found"**  
→ Check model name on [models list](https://developers.cloudflare.com/workers-ai/models/). Copy exact ID.

**"Rate limited"**  
→ Free tier has limits. Check dashboard → Analytics. Upgrade plan if needed.

**"401 Unauthorized"**  
→ Binding not added. Re-do Step 3.

**"Timeout"**  
→ Model is slow. Add timeout: `timeout: 30000` to request.

---

## Official Examples to Copy From

1. **Web crawler + summarize:** https://github.com/cloudflare/workers-ai-web-crawler
2. **Chat interface:** https://github.com/cloudflare/ai/tree/main/examples
3. **RAG with embeddings:** https://github.com/cloudflare/ai/tree/main/examples/rag

Copy, modify, deploy. No need to write from scratch.

---

**That's all. You're done.**

Next: Pick a task from the table above or open your Worker to production.
