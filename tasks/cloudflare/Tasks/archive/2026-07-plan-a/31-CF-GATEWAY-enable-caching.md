> **⚠️ ARCHIVED — DO NOT EXECUTE — HISTORICAL REFERENCE ONLY**
>
> Superseded per `tasks/cloudflare/Tasks/000-Architecture-Decision.md` and the full audit at `tasks/cloudflare/audits/AUDIT-2026-07-14-tasks-folder-and-linear.md` (2026-07-14). This file describes a plan, architecture, or status claim that conflicts with the current, correct approach — following it as written risks real harm (fabricated APIs, security regressions, or false completion claims). Kept for historical reference only.

---

---
title: "Task 31: Enable AI Gateway Caching"
references:
  - title: "AI Gateway Caching"
    url: "https://developers.cloudflare.com/ai-gateway/configuration/caching/"
    topic: "Reduce latency by up to 90% and lower API costs"
  - title: "AI Gateway Overview"
    url: "https://developers.cloudflare.com/ai-gateway/"
    topic: "Gateway features and configuration"
  - title: "AI Gateway Analytics"
    url: "https://developers.cloudflare.com/ai-gateway/observability/"
    topic: "Monitor cache hit rates and savings"
  - title: "Cloudflare Blog - AI Gateway"
    url: "https://blog.cloudflare.com/announcing-cloudflare-ai-gateway/"
    topic: "Architecture and best practices"
---

# Task 31: Enable AI Gateway Caching (Frontmatter Already Included)

**Phase:** 4 (Optimization)  
**Complexity:** Low | **Time:** 20 min  
**Depends on:** Tasks 01-06 (gateway created)  
**Enables:** 40-90% latency reduction on repeated queries

---

## Purpose

Enable response caching in AI Gateway so repeated queries (common user questions, support bot responses) are served from cache instead of calling the origin model. Reduces latency and API costs.

---

## Goal

✅ Enable AI Gateway caching via dashboard  
✅ Configure cache TTL (time-to-live)  
✅ Monitor cache hit rate  
✅ Measure latency improvement

---

## User Journey

**iPix operator:** "Users ask the same questions repeatedly (e.g., 'How do I reset my password?'). Gateway caching lets us serve cached responses instantly instead of calling Qwen every time."

**Impact:**
- First query: 500ms (calls Qwen)
- Cached queries: 50ms (from cache) — 10x faster
- Cost: Each cached response costs ~0 API calls

---

## Steps

### 1. Enable Caching via Dashboard

1. Go to **Cloudflare dashboard** → **AI Gateway**
2. Select your gateway
3. Click **Settings** tab
4. Under **Caching**, toggle **Enable Response Caching** → ON
5. Set **Default Cache TTL** to `3600` seconds (1 hour)
   - For support bot queries: 24 hours (86400)
   - For chat: 1 hour (3600)
6. Save

### 2. Configure Cache Keys (Optional)

By default, cache is based on:
- Provider
- Model
- Request body (exact match)
- Auth headers

To customize, add header to requests:

```bash
# Skip cache for this request
curl -H "cf-aig-skip-cache: true" https://your-gateway.ai.cloudflare.com/v1/chat/completions

# Use custom cache key (group similar queries)
curl -H "cf-aig-cache-key: support-faq" ...

# Set custom TTL for this request
curl -H "cf-aig-cache-ttl: 86400" ...
```

### 3. Monitor Cache Performance

Go to dashboard → **Analytics** tab:

Look for:
- **Cache Hit Rate** (goal: >10% for support bots, >5% for chat)
- **Cache Hits** (# of served-from-cache responses)
- **Average Latency** (should decrease over time)
- **Cost Savings** (displayed in $ if tracked)

---

## Verification

✅ Dashboard shows "Response Caching: Enabled"

✅ Send same query twice:
```bash
# First request (MISS)
curl -v -X POST https://gateway.ai.cloudflare.com/v1/chat/completions \
  -H 'Content-Type: application/json' \
  -d '{"model":"qwen","messages":[{"role":"user","content":"Hello"}]}'
# Response header: cf-aig-cache-status: MISS

# Second request (HIT)
curl -v -X POST https://gateway.ai.cloudflare.com/v1/chat/completions \
  -H 'Content-Type: application/json' \
  -d '{"model":"qwen","messages":[{"role":"user","content":"Hello"}]}'
# Response header: cf-aig-cache-status: HIT
# Latency: ~50ms (vs 500ms on first request)
```

✅ Check analytics: Cache hit rate > 0%

---

## Testing

**Unit: Cache key matching**
- Same request twice → HIT
- Different request → MISS
- Skip-cache header → always MISS

**Integration: Support bot scenario**
- 10 users ask "What is my balance?" (same query)
- Result: 9 cache hits + 1 miss = 90% cache rate
- Latency: 10th response in 50ms (vs 500ms if uncached)

**Metrics:**
```bash
# Query Cloudflare Analytics API (requires setup)
# Report: Cache Hit %, Latency P50/P99, Cost Savings
```

---

## Real-World Context

**Without caching:**
```
Request 1: Query Qwen (500ms) → "How to reset password?" → Response
Request 2: Query Qwen (500ms) → "How to reset password?" → Same response
Request 3: Query Qwen (500ms) → "How to reset password?" → Same response
Total: 1500ms + 3 API calls
```

**With caching (1 hour TTL):**
```
Request 1: Query Qwen (500ms) → Cache for 1 hour → Response
Request 2: Serve from cache (50ms) → Same response
Request 3: Serve from cache (50ms) → Same response
Total: 500ms + 1 API call (90% improvement)
```

---

## Limitations & Workarounds

| Limitation | Workaround |
|-----------|-----------|
| Only text/image responses cached | JSON or structured data? Cache the wrapper |
| Requires exact request match | Use `cf-aig-cache-key` header for fuzzy matching |
| Doesn't cache streamed responses | Cache summary after streaming completes |
| Per-location cache (not global) | Expected; Cloudflare caches at each edge location |

---

## Rollback

```bash
# Disable caching
# Go to dashboard → AI Gateway → Settings → Caching → OFF

# If code uses skip-cache headers, remove them:
# curl -H "cf-aig-skip-cache: true" ...  # Remove this line
```

---

## Cost Impact

| Scenario | Before | After | Savings |
|----------|--------|-------|---------|
| 100 support FAQs/day, 80% repeated | $0.50/day | $0.10/day | 80% |
| 1000 chat messages/day, 5% repeated | $5.00/day | $4.75/day | 5% |

---

## Next step

Task 32: Configure Worker Rate Limiting (protect endpoints)

---

**Updated:** 2026-07-12  
**Status:** Ready to implement
