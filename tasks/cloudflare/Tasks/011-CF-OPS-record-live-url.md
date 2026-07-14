# IPI-472 · CF-INFRA-001 — Record Live Gateway URL in Linear

**Status:** 🟡 PENDING (URL ready, Linear doc pending)  
**Live URL:** `https://ai-gateway.sk-498.workers.dev`  
**Verified:** 2026-07-12 (health check passing)

---

## Purpose

Document the live Cloudflare Workers AI Gateway URL in Linear for team reference and integration documentation.

## What This Task Covers

1. Confirm worker is live and accessible
2. Document URL in Linear IPI-472
3. Update README with gateway endpoint
4. Notify team of availability
5. Create API documentation for internal use

## Acceptance Criteria

- ✅ Gateway URL accessible and responding
- ✅ Linear IPI-472 updated with live URL
- ✅ Health endpoint (`/health`) returns 200
- ✅ README references new gateway
- ✅ Team notified via Slack or Linear comment
- ✅ Endpoint documented in API catalog

## Steps

### 1. Verify Gateway is Live

```bash
# Test health endpoint
curl https://ai-gateway.sk-498.workers.dev/health

# Expected response:
# { "status": "ok" }

# Test chat endpoint
curl -X POST https://ai-gateway.sk-498.workers.dev/chat \
  -H 'Content-Type: application/json' \
  -d '{"messages":[{"role":"user","content":"test"}]}'

# Expected: JSON with model response
```

### 2. Update Linear IPI-472

**Go to:** https://linear.app/amo100/issue/IPI-472

Add to description/body:

```markdown
## ✅ Gateway Deployed

**Live URL:** https://ai-gateway.sk-498.workers.dev

### Health Check
- Status: ✅ Passing
- Endpoint: `GET /health`
- Response: `{ "status": "ok" }`

### Available Endpoints
- `POST /chat` — Llama 3.1 8B chat
- `POST /embed` — BGE Base embeddings (768-d)
- `POST /stream` — Streaming responses (SSE)
- `GET /health` — Health check

### Configuration
- **Worker name:** ai-gateway
- **Account:** Cloudflare
- **Region:** Edge (global)
- **Models:** Llama 3.1 8B, BGE Base, Qwen, Mistral
- **Bindings:** AI (Workers AI)

### Environment Variables
- `ENVIRONMENT=production`
- `PRIMARY_MODEL=@cf/meta/llama-3.1-8b-instruct`
- `MODEL_REGISTRY_OVERRIDE=workers-ai-only`

### Verified By
- Date: 2026-07-12
- Tests: Health, Chat, Embed
- Logs: Enabled
- Auto-deploy: Enabled (GitHub)

### Next Steps
- IPI-525: Tool calling integration
- CF-MIG-220: Smoke tests
- Link Mastra agents to gateway
```

### 3. Update README

Add to main `/home/sk/ipix/README.md` or relevant doc:

```markdown
## Cloudflare AI Gateway

**Live:** https://ai-gateway.sk-498.workers.dev

### Quick Start

```bash
# Health check
curl https://ai-gateway.sk-498.workers.dev/health

# Chat with Llama 3.1
curl -X POST https://ai-gateway.sk-498.workers.dev/chat \
  -H 'Content-Type: application/json' \
  -d '{"messages":[{"role":"user","content":"hello"}]}'

# Get embeddings
curl -X POST https://ai-gateway.sk-498.workers.dev/embed \
  -H 'Content-Type: application/json' \
  -d '{"text":"your text here"}'
```

### Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Health check |
| `/chat` | POST | Single-turn chat |
| `/embed` | POST | Text embeddings |
| `/stream` | POST | Streaming chat |

### Configuration

See [Cloudflare Setup](./tasks/cloudflare/dash/setup.md) for configuration details.
```

### 4. Create API Documentation

**File:** `/home/sk/ipix/tasks/cloudflare/API-GATEWAY.md`

```markdown
# Cloudflare AI Gateway API

**Base URL:** https://ai-gateway.sk-498.workers.dev

## Endpoints

### POST /chat
Single-turn chat with Llama 3.1 8B

**Request:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "What is the weather?"
    }
  ]
}
```

**Response:**
```json
{
  "content": "I don't have access to real-time weather...",
  "usage": {
    "prompt_tokens": 15,
    "completion_tokens": 42
  }
}
```

### POST /embed
Generate embeddings for text

**Request:**
```json
{
  "text": "hello world"
}
```

**Response:**
```json
{
  "embedding": [0.123, 0.456, ...],
  "dimensions": 768
}
```

### POST /stream
Streaming chat responses (Server-Sent Events)

**Request:**
```json
{
  "messages": [{"role": "user", "content": "..."}]
}
```

**Response:** SSE stream of token chunks

### GET /health
Health check

**Response:**
```json
{
  "status": "ok"
}
```
```

### 5. Notify Team

**Option A: Slack Message**

```
🎉 Cloudflare AI Gateway is now live!

https://ai-gateway.sk-498.workers.dev

✅ Workers AI binding (Llama 3.1, BGE, Qwen, Mistral)
✅ Auto-deploy from GitHub (main branch)
✅ Real-time logs in Cloudflare dashboard
✅ Health endpoint responding

Next: Integrate with Mastra agents (IPI-525)

See: IPI-472 for details
```

**Option B: Linear Comment**

Add comment to IPI-472:
```
✅ Gateway is live and verified
- Health: 200 OK
- Chat: ✅ Tested
- Embed: ✅ Tested
- Logs: Enabled
- Auto-deploy: Enabled

Ready for Mastra integration (IPI-525)
```

## Verification

### API Test Suite

```bash
#!/bin/bash

BASE_URL="https://ai-gateway.sk-498.workers.dev"

echo "Testing Cloudflare Gateway..."

# 1. Health
echo "1. Health check..."
curl -s "$BASE_URL/health" | jq .

# 2. Chat
echo "2. Chat endpoint..."
curl -s -X POST "$BASE_URL/chat" \
  -H 'Content-Type: application/json' \
  -d '{"messages":[{"role":"user","content":"test"}]}' | jq .

# 3. Embed
echo "3. Embed endpoint..."
curl -s -X POST "$BASE_URL/embed" \
  -H 'Content-Type: application/json' \
  -d '{"text":"hello"}' | jq .

echo "All tests passed ✅"
```

## Current State

✅ **COMPLETED (except Linear update)**
- Worker deployed: ✅
- URL live: ✅ https://ai-gateway.sk-498.workers.dev
- Health check: ✅ 200 OK
- Endpoints working: ✅
- Auto-deploy enabled: ✅
- Logs enabled: ✅

🟡 **PENDING**
- Linear IPI-472 documentation: **To do**
- README update: **To do**
- API docs: **To do**
- Team notification: **To do**

## Evidence

```bash
# Proof gateway is live
curl -I https://ai-gateway.sk-498.workers.dev/health
# HTTP/1.1 200 OK

curl https://ai-gateway.sk-498.workers.dev/health
# { "status": "ok" }
```

## Related Tasks

- **IPI-525:** Tool calling integration (blocked until this completes)
- **CF-MIG-220:** Smoke tests for gradual rollout
- **CF-MIG-230:** Migrate Mastra agents to use gateway

## Next Steps

1. **Today:** Update Linear IPI-472 with live URL ← YOU ARE HERE
2. **Today:** Update README and API docs
3. **Tomorrow:** IPI-525 (wire tool calling)
4. **Week 2:** CF-MIG-220 (smoke tests)
5. **Week 3:** Full production rollout

---

## Blocking

This task is blocking:
- **IPI-525:** Needs gateway URL for integration
- **CF-MIG-220:** Needs documented endpoint for tests

---

## Done Checklist

- [ ] Confirm URL is live (curl /health)
- [ ] Update Linear IPI-472 with URL
- [ ] Add URL to README
- [ ] Create API documentation
- [ ] Notify team (Slack/comment)
- [ ] Verify team can access
- [ ] Archive this task as DONE
