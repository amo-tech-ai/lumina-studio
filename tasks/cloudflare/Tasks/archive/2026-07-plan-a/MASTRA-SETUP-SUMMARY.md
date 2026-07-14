> **⚠️ ARCHIVED — DO NOT EXECUTE — HISTORICAL REFERENCE ONLY**
>
> Superseded per `tasks/cloudflare/Tasks/000-Architecture-Decision.md` and the full audit at `tasks/cloudflare/audits/AUDIT-2026-07-14-tasks-folder-and-linear.md` (2026-07-14). This file describes a plan, architecture, or status claim that conflicts with the current, correct approach — following it as written risks real harm (fabricated APIs, security regressions, or false completion claims). Kept for historical reference only.

---

# Mastra on Cloudflare — Setup Summary

**Date:** 2026-07-12  
**Tasks created:** 25–30  
**Total implementation time:** ~2.5 hours (tasks 25–30)  
**Status:** Ready to implement

---

## What Changed

Tasks **21-24** focused on Next.js → Cloudflare conversion (OpenNext).  
Tasks **25-30** focus on **Mastra agent deployment** on Cloudflare Workers.

Both coexist:
- OpenNext handles Next.js routes (`/health`, `/api/chat`)
- Mastra deployer handles agent endpoints (`/api/agents/test-registry/stream`)

---

## Key Insights from Official Docs

### 1. Mastra Deployer is Separate from OpenNext

**Mastra Deployer** (`@mastra/deployer-cloudflare`):
- Auto-generates handler for agent runtime
- Wires into `wrangler.jsonc` environment
- Requires external storage (no local filesystem on Workers)

**OpenNext**:
- Converts Next.js to Workers
- Handles Server Components, API routes
- Stateless per request

**iPix setup:** Both run in the same Worker. Routing decides which handler processes the request.

---

### 2. Storage is Ephemeral — Use KV for Persistence

From Mastra docs:

> Cloudflare Workers use ephemeral filesystems. Local database files won't persist.

**Solution:** Store Mastra state (conversation memory, tool results) in Cloudflare KV with 7-day TTL.

- **Why KV over D1?** KV is faster for frequent updates; better for session state.
- **Why not in-memory?** Workers restart after each request; state is lost.

---

### 3. Context Engineering Is the Fundamental Shift

From Medium article (Alex Fuentes):

> "Everything is context engineering" — managing what information language models can access.

**For iPix agents on Cloudflare:**
- Agents need to see conversation history (context)
- Store it in KV
- Load it on each request
- Update it after agent response

---

### 4. Edge-First Design Philosophy

Mastra's advantage:
- Processes AI workloads at Cloudflare edge (global distribution)
- Lower latency to end users
- Reduced backend load

**iPix benefit:**
- Chat agent responses in 200-500ms (vs 500ms+ on Vercel)
- Global presence (users in Europe get EU servers)

---

## Task Breakdown (25–30)

| Task | Purpose | Key | Time |
|------|---------|-----|------|
| **25** | Install `@mastra/deployer-cloudflare` | Understand ephemeral runtime | 10 min |
| **26** | Configure deployer in wrangler.jsonc | Add KV binding for state | 20 min |
| **27** | Register models (Qwen, Mistral, BGE) | Agents call via registry, not hardcoded | 25 min |
| **28** | Auth middleware + KV store adapter | Secure endpoints, persist memory | 40 min |
| **29** | Streaming (SSE) for real-time tokens | Users see responses as they arrive | 30 min |
| **30** | Observability (logging + error tracking) | Ops can debug in production | 30 min |

---

## Critical Implementation Notes

### 1. KV Store Adapter (Task 28)

Mastra expects a `MemoryStore` interface. Create adapter:

```typescript
class CloudflareKVStore implements MemoryStore {
  async get(key: string) { /* load from KV */ }
  async set(key: string, value: unknown) { /* save to KV */ }
  async delete(key: string) { /* remove from KV */ }
}
```

Use `sessionId` as key prefix: `mastra:abc123`

### 2. Auth is Mandatory Before Public

From Mastra docs:

> "Set up authentication before exposing your endpoints publicly."

Task 28 implements Bearer token validation. Only clients with valid token can call agent endpoints.

### 3. Streaming Design

SSE (Server-Sent Events) pattern:
```
Client: POST /api/agents/chat/stream
Server: event: start
        event: token (repeated)
        event: done
```

EventSource API on frontend consumes stream natively (no polling).

### 4. Model Registry Abstraction

Agents call `mastra.models['qwen-chat']` instead of hardcoding API:

- On Vercel: Falls back to Gemini (fallback in registry)
- On Cloudflare: Uses Workers AI (edge provider)
- Same agent code works on both

---

## Rollout Strategy

### Step 1: Local Build + Preview (Tasks 25–30)
```bash
npm run build     # Builds both Next.js + Mastra
npm run preview   # Local Workers runtime on :8787
```

Test:
- Next.js routes work: `curl http://localhost:8787/health`
- Agent endpoints secured: `curl http://localhost:8787/api/agents/chat` → 401 (no auth)
- Agent endpoints work with auth: `curl -H 'Authorization: Bearer dev-key' ...` → 200

### Step 2: Production Deploy
```bash
npm run deploy    # Pushes to Cloudflare
```

Deploy to preview first:
```bash
ENVIRONMENT=staging npm run deploy --env staging
```

### Step 3: Verify Live
- Check logs: `wrangler tail --env production`
- Send test chat: Browser EventSource → see streaming tokens
- Monitor cost: Check Cloudflare dashboard → Workers AI usage

---

## Success Criteria

✅ **After task 30, you should be able to:**

1. Deploy iPix to Cloudflare with full Next.js app
2. Call Mastra agents from anywhere (auth token required)
3. See conversations stream in real-time (SSE)
4. Inspect agent behavior in logs (`wrangler tail`)
5. Know exact cost per agent invocation
6. Roll back any deployment in <30 seconds

---

## Fallback to Vercel

If Cloudflare deployment has issues:

```bash
# Revert to Vercel-only
git checkout wrangler.jsonc open-next.config.ts
npm run build    # Next.js only
git push         # Auto-deploys to Vercel
```

Mastra agents still work on Vercel (use Gemini fallback). No code changes needed.

---

## When to Start

**Preconditions:**
- ✅ Tasks 01-06 complete (gateway live)
- ✅ Tasks 11-15 complete (dashboard config)
- ✅ Task 16 done (team notified)
- ✅ IPI-525 resolved or deferred (tool calling; not blocking streaming)

**Recommended order:**
1. Tasks 21-24 (NextJS conversion) → verify `npm run build` succeeds
2. Tasks 25-30 (Mastra setup) → test agent endpoints locally
3. `npm run deploy` when all tests pass

---

## References

- **Mastra deployment:** https://mastra.ai/guides/deployment/cloudflare
- **Workers AI models:** https://developers.cloudflare.com/workers-ai/models/
- **Context engineering:** https://falexm.medium.com/context-engineering-building-intelligent-ai-agents-with-memory-using-mastra-on-cloudflare-c063ebad2654
- **Official docs:** developers.cloudflare.com (KV, Workers, D1)

---

**Ready to implement. Start with task 25.**
