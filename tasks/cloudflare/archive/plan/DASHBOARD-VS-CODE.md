# Cloudflare: Dashboard Setup vs Code Development

**Rule of thumb:** Use dashboard for infrastructure; use code for behavior.

---

## What Belongs in Dashboard (No Code)

### ✅ DO THIS IN DASHBOARD

| Task | Where | Why | Time |
|------|-------|-----|------|
| **Create/delete a Worker** | Workers & Pages | Instant | 1 min |
| **Add AI binding** | Settings → Bindings | Permission + env var | 2 min |
| **Set environment variables** | Settings → Variables | Non-secret config | 3 min |
| **Set secrets** | Settings → Secrets | API keys, tokens | 2 min |
| **Enable logs/traces** | Settings → Observability | Monitoring | 1 min |
| **Set build watch path** | Settings → Builds | Auto-deploy filter | 2 min |
| **Rotate API tokens** | Profile → API Tokens | Security | 2 min |
| **Set custom domain** | Workers & Pages → Routes | Prod URL | 5 min |
| **Scale compute** | Settings → General | Upgrade plan if needed | 1 min |
| **Connect to Git** | Workers & Pages → Connect | Auto-deploy on push | 5 min |

**Total dashboard work: ~20 minutes once per Worker.**

### ❌ DO NOT PUT IN DASHBOARD

| ❌ Tempting but wrong | Why | Do this instead |
|----------------------|-----|-----------------|
| Model selection | Hardcoded in UI → you can't change per request | Code: `env.AI.run(request.model, ...)` |
| Retry logic | Timing/backoff needs testing | Code: `@cloudflare/ai-utils` handles it |
| Cost limits | Budget should live in code or KV, not a toggle | Code: check spend before calling API |
| Tool definitions | Tools change per request, need validation | Code: generate from OpenAPI spec |
| Request routing | "If X then model A, else B" — this is business logic | Code: if/else + gateway config |
| Data transformation | Prompts, parsing, summarization — business logic | Code: always |

**Key:** If it changes per request or needs logic, it belongs in code.

---

## Workflow: Dashboard First, Then Code

### Phase 1: Prove It Works (Dashboard Only)

1. Create Worker
2. Add AI binding
3. Deploy hello-world code
4. Test `/health`, `/chat`, `/embed` endpoints
5. Verify models respond

**No business logic yet. Just "does the connection work?"**

### Phase 2: Wire It Up (Code)

1. Implement request handling (model selection, prompts)
2. Add error handling
3. Add logging/tracing
4. Deploy code

### Phase 3: Optimize (Code + Dashboard)

1. Add KV cache (dashboard binding + code)
2. Add rate limiting (code)
3. Scale compute (dashboard)

**Never go back to Phase 1.** If infrastructure breaks, investigate in dashboard. If behavior breaks, investigate in code.

---

## Decision Tree

```
Should this live in dashboard or code?

├─ Is it "connect me to a Cloudflare product"?
│  └─ YES → Dashboard (binding)
│
├─ Is it "authenticate this request"?
│  └─ YES → Dashboard (secret) + Code (use env.SECRET)
│
├─ Is it "run on every request"?
│  └─ YES → Code
│
├─ Is it "static per Worker, never changes"?
│  └─ YES → Can go in dashboard (env var) but code is safer
│
├─ Is it "changes per request or per user"?
│  └─ YES → Code (always)
│
└─ Is it "a business rule" (routing, logic, validation)?
   └─ YES → Code (always)
```

---

## Example: Model Selection

### ❌ Wrong: Dashboard Hardcode

```
Dashboard → Settings → Variables
CHATBOT_MODEL = @cf/qwen/qwen1.5-7b-chat
```

Then request says "use GPT" → can't switch without re-deploying.

### ✅ Right: Code Decision

```typescript
export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const model = url.searchParams.get('model') || '@cf/qwen/qwen1.5-7b-chat'
    
    // Validate model is on approved list
    const approved = [
      '@cf/qwen/qwen1.5-7b-chat',
      '@cf/mistral/mistral-7b-instruct-v0.1',
    ]
    if (!approved.includes(model)) {
      return new Response('Model not approved', { status: 400 })
    }
    
    const response = await env.AI.run(model, { prompt: '...' })
    return new Response(JSON.stringify(response))
  },
}
```

Now: `/chat?model=qwen` or `/chat?model=mistral` → works instantly, no redeploy.

---

## Secrets: Dashboard Rules

### ✅ DO store in dashboard

- `CLOUDFLARE_API_TOKEN` (encrypted)
- `OPENAI_API_KEY` (if using external API)
- `BEARER_TOKEN` (if guarding endpoints)

### Why dashboard, not `.env`?

- Encrypted at rest
- Not in git (safer)
- Easy to rotate
- Accessible to all Builds auto-deploys

### ❌ DO NOT put secrets in `.env.example` or comments

```
# ❌ BAD (leaks hint of secret)
# OPENAI_API_KEY=sk-xxx...

# ✅ GOOD (no hint)
# OPENAI_API_KEY=(add in dashboard → Settings → Secrets)
```

---

## Bindings: When to Add

### ✅ Add a binding when

- Linear task explicitly names it (e.g., "Add R2 binding for ISR cache")
- You need `env.SOMETHING` in code
- You're ready to deploy that code

### ❌ Do not add a binding when

- Just browsing features
- "It might be useful later"
- Code doesn't use it yet
- Empty bindings → confusing for next developer

### Add bindings in code, not dashboard-only

**Dashboard binding can drift from git:**

```
Dashboard → Settings → Bindings → Add R2
  ↓
Next developer pulls code → no R2 in wrangler.jsonc
  ↓
Code runs, expects env.R2 → undefined
  ↓
Bug
```

**Right way:**

```
1. Add to wrangler.jsonc (version controlled)
   [env.production]
   r2_buckets = [{ binding = "BUCKET", bucket_name = "my-bucket" }]

2. Use in code
   const object = await env.BUCKET.get('file.txt')

3. Deploy
   Dashboard or wrangler publish

4. Dashboard reflects it (no manual step needed)
```

---

## Git + Dashboard Sync

### What should be in git?

✅ Code  
✅ `wrangler.jsonc` (bindings, config)  
✅ Env var **names** (not values)  
✅ `.gitignore` (never commit `.env`)  

### What should NOT be in git?

❌ Secrets (API keys, tokens)  
❌ `.env` or `.env.local`  
❌ Env var **values**

### Sync rule

After adding a binding in dashboard:
- Dashboard is the source of truth
- Code (wrangler.jsonc) must match

If you change **dashboard settings**, pull them into wrangler.jsonc for git.

```bash
# Download dashboard state to local
wrangler deployments list
wrangler secret list

# Then update wrangler.jsonc to match
```

---

## Rollback: Where to Fix

| Problem | Where it lives | How to fix |
|---------|----------------|-----------|
| Worker is down | Code | Git revert + redeploy |
| No AI binding | Dashboard | Add binding |
| Secret expired | Dashboard | Rotate in dashboard |
| Wrong model in request | Code | Fix code, redeploy |
| Rate limited | Dashboard | Upgrade plan or KV cache |
| Custom domain broken | Dashboard | Check Routes, fix DNS |

---

## Recommended Setup Order

1. **Dashboard only** (10 min)
   - Create Worker
   - Add AI binding
   - Add secrets
   - Test `/health`

2. **Code** (30 min)
   - Implement hello-world
   - Add error handling
   - Deploy

3. **Optimize** (as needed)
   - Add KV/R2 bindings
   - Add logging
   - Set up monitoring

---

## One Simple Rule

> **"If you can't test it in code (unit test, integration test), it doesn't belong in the dashboard."**

Models, routing, validation, retry logic → all testable in code → put in code.  
Secrets, bindings, observability → not testable locally → put in dashboard.

---

**TL;DR:** Dashboard for infrastructure (once). Code for behavior (iterate). Never hardcode business logic in dashboard.
