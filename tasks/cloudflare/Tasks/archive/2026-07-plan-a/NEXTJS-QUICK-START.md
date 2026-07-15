> **⚠️ ARCHIVED — DO NOT EXECUTE — HISTORICAL REFERENCE ONLY**
>
> Superseded 2026-07-14. Reason: superseded index/summary doc from the abandoned custom-Worker plan (Plan A). Current plan: `tasks/cloudflare/Tasks/000-Architecture-Decision.md`, Linear IPI-487 (migration gate) and IPI-586/590/591/592/594 (active work).

---

# NextJS + Cloudflare Workers — Quick Start Guide

**Real-world setup for deploying iPix to Cloudflare in 30 minutes**

---

## The Challenge

iPix is currently on Vercel. To run it on Cloudflare Workers:
- Need to convert Next.js to Workers runtime ✅ (OpenNext does this)
- Need to configure build + deployment ✅ (Wrangler handles this)
- Need to keep Vercel working (in case we want to roll back) ✅ (Both builds run in parallel)

## The Solution: 4 Tasks in 30 Minutes

| Task | Command | Time | What It Does |
|------|---------|------|--------------|
| **015** | `npm i @opennextjs/cloudflare wrangler` | 5 min | Install OpenNext + Wrangler |
| **016** | Create `wrangler.jsonc` | 10 min | Configure Wrangler |
| **017** | Create `open-next.config.ts` | 5 min | Configure OpenNext |
| **018** | Update `package.json` scripts | 10 min | Add build/deploy commands |
| **TOTAL** | — | **~30 min** | Ready to build + deploy |

---

## Real-World Examples

### Example 1: iPix Backend Engineer

**Goal:** "Deploy iPix to Cloudflare alongside Vercel"

**Process:**

```bash
# 1. Task 015: Install packages (5 min)
npm i @opennextjs/cloudflare@latest
npm i -D wrangler@latest

# 2. Task 016: Create config (10 min)
# Copy wrangler.jsonc template to project root

# 3. Task 017: Create config (5 min)
# Copy open-next.config.ts template to project root

# 4. Task 018: Update scripts (10 min)
# Update package.json with new scripts

# 5. Done! Now you can:
npm run build       # Build for both Vercel + Cloudflare
npm run preview     # Test on local Cloudflare runtime
npm run deploy      # Deploy to Cloudflare Workers
```

**Result:** iPix runs on both Vercel AND Cloudflare simultaneously.

### Example 2: DevOps Engineer Rolling Out

**Goal:** "Test Cloudflare then gradually migrate traffic"

**Week 1: Local Testing**
```bash
npm run build    # Build for both
npm run preview  # Test locally
# Verify: App works the same on Cloudflare as Vercel
```

**Week 2: Production Testing (Canary)**
```bash
npm run deploy   # Deploy to Cloudflare staging
# Send 10% traffic to Cloudflare, 90% to Vercel
# Monitor logs, errors, performance
```

**Week 3: Full Rollout**
```bash
# If canary successful: 100% traffic to Cloudflare
# Vercel becomes failover (if Cloudflare has issues)
```

### Example 3: API Route Migration

**Goal:** "Move only AI Gateway API to Cloudflare"

**Current setup:**
```
Browser → Vercel (Next.js)
         → Gemini API (external)
```

**After deployment:**
```
Browser → Vercel (Next.js)      [UI only]
      ↓
      → Cloudflare Worker        [AI API only]
         → Workers AI (edge)
         → Gemini (fallback)
```

**Benefits:**
- Faster AI responses (edge compute)
- Cheaper (Workers AI < Gemini API)
- Still resilient (Vercel + Cloudflare both running)

---

## Files You'll Create

| File | Size | Purpose |
|------|------|---------|
| `wrangler.jsonc` | ~30 lines | Cloudflare configuration |
| `open-next.config.ts` | 3 lines | Build configuration |
| `package.json` | (4 new lines) | npm scripts |
| **Total files** | — | 3 new + 1 modified |

---

## Success Milestones

| Milestone | How to Verify |
|-----------|---------------|
| ✅ Task 015: Packages installed | `npm list @opennextjs/cloudflare wrangler` shows both |
| ✅ Task 016: Wrangler config valid | `wrangler deploy --dry-run` succeeds |
| ✅ Task 017: OpenNext config valid | TypeScript compiles `open-next.config.ts` |
| ✅ Task 018: Scripts work | `npm run` shows preview + deploy commands |
| ✅ Build succeeds | `npm run build` creates `.open-next/` directory |
| ✅ Local preview works | `npm run preview` starts on localhost:8787 |
| ✅ Deploy succeeds | `npm run deploy` shows "Published" message |

---

## Rollback Plan (If Needed)

**At any point, you can revert:**

```bash
# Option 1: Just remove the configs
rm wrangler.jsonc open-next.config.ts
git checkout package.json

# Result: Back to Vercel-only setup
# iPix still works on Vercel exactly as before

# Option 2: Keep configs but change build script
# In package.json, change:
"build": "next build && opennextjs-cloudflare build"
# Back to:
"build": "next build"

# Result: Configs exist locally but not used
# Easier to re-enable later
```

---

## Performance Expectations

### Build Time

**Before (Vercel only):**
```
$ npm run build
> next build
✓ Compiled successfully
~ 60 seconds total
```

**After (Vercel + Cloudflare):**
```
$ npm run build
> next build && opennextjs-cloudflare build
✓ Compiled successfully
✓ Built for Cloudflare
~ 90 seconds total (+30 sec)
```

### Deployment Time

**Vercel (unchanged):**
- Automatic on `git push`
- ~2-3 minutes to live

**Cloudflare (new):**
- `npm run deploy`
- ~30 seconds to live
- (Much faster, edge-native)

---

## Cost Estimate

| Service | Cost | Notes |
|---------|------|-------|
| **Vercel** | ~$50/mo | UI + API routes (unchanged) |
| **Cloudflare Workers** | Free tier | 100k requests/day free |
| **Workers AI** | Free tier + usage | Qwen chat free, Mistral paid |
| **Total (free tier)** | ~$50/mo | Same as before |
| **Total (with usage)** | ~$50-100/mo | Depends on AI traffic |

**Benefit:** Cloudflare often cheaper than Gemini API for high volume.

---

## Monitoring After Deployment

### Check Logs

```bash
# View real-time logs from Cloudflare
wrangler tail --env production

# Expected output:
# [info] GET / 200 (45ms)
# [info] POST /api/chat 200 (350ms)
# [error] Model unavailable (retry)
```

### Check Performance

```bash
# View Cloudflare dashboard
# https://dash.cloudflare.com → Workers & Pages → ipix-operator

# Metrics to monitor:
# - Request volume
# - Error rate (should be <1%)
# - P99 latency (should be <500ms)
# - Cost tracking
```

### Compare Before/After

```bash
Before (Vercel):
  - Chat latency: ~500ms (Vercel → Gemini API)
  - Cost: Gemini pricing

After (Cloudflare):
  - Chat latency: ~200ms (Edge → Workers AI)
  - Cost: Often cheaper
```

---

## Common Questions

### Q: Will Vercel still work?
**A:** Yes. Both deployments coexist. You can switch between them anytime.

### Q: Do I need to change my Next.js code?
**A:** No. OpenNext handles the conversion. Your code stays the same.

### Q: What about database connections?
**A:** Supabase is unchanged. Both Vercel and Cloudflare can connect to it.

### Q: What about environment variables?
**A:** Vercel env vars are separate from Cloudflare. You'll set them in Wrangler config.

### Q: Can I gradually migrate traffic?
**A:** Yes. Use DNS to route % traffic to Cloudflare vs Vercel.

### Q: What if Cloudflare has issues?
**A:** Traffic automatically routes back to Vercel (if set up as fallback).

---

## Next Steps After These 4 Tasks

| After Task | Do This | Purpose |
|------------|---------|---------|
| 018 | `npm run build` | Test build completes |
| 018 | `npm run preview` | Test locally on Workers runtime |
| 018 | Review logs | Look for errors in local preview |
| 018 | `npm run deploy` | Deploy to production |
| Deploy | Check Cloudflare dashboard | Monitor first requests |
| Monitoring | Set up alerts | Get notified if errors spike |

---

## Reference Files

Each task has full details:

| Task | File | Time | Includes |
|------|------|------|----------|
| 015 | `015-CF-NEXTJS-install-opennext-deps.md` | 5 min | Install steps, verification, rollback |
| 016 | `016-CF-NEXTJS-create-wrangler-config.md` | 10 min | Config template, explanation, troubleshooting |
| 017 | `017-CF-NEXTJS-create-opennext-config.ts` | 5 min | Config file (3 lines), what it does |
| 018 | `018-CF-NEXTJS-update-package-json.md` | 10 min | Script updates, before/after, testing |

---

## Estimated Timeline

| Timeframe | Action | Status |
|-----------|--------|--------|
| **Today** | Complete tasks 015-018 | 🟡 Ready |
| **Today** | Verify build succeeds | 🟡 Ready |
| **Today** | Test preview locally | 🟡 Ready |
| **Tomorrow** | Deploy to production | 🟡 Ready |
| **Day 3** | Monitor performance | 🟡 Ready |
| **Week 1** | Gradual traffic migration | 🟡 Optional |
| **Week 2** | Full Cloudflare rollout | 🟡 Optional |

---

## Success Criteria (Final)

After completing all 4 tasks, you should be able to:

- ✅ Run `npm run build` → creates both `.next/` and `.open-next/`
- ✅ Run `npm run preview` → app runs on local Cloudflare runtime
- ✅ Run `npm run deploy` → app live on Cloudflare Workers
- ✅ Verify on https://ipix-operator.<account>.workers.dev/health
- ✅ See logs in Cloudflare dashboard
- ✅ Vercel still works (git push still deploys)
- ✅ No code changes needed (OpenNext handles it)

---

## Resources

| Resource | Link | Use For |
|----------|------|---------|
| OpenNext Docs | https://opennext.js.org/cloudflare | Understanding the adapter |
| Wrangler Docs | https://developers.cloudflare.com/workers/wrangler/ | CLI commands |
| Next.js Guide | https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/ | Framework integration |
| Article | https://bhataasim.medium.com/deploy-your-nextjs-app-on-cloudflare-workers-in-under-2-minutes-df8a483617a5 | Step-by-step walkthrough |

---

**Ready? Start with Task 015. You'll be live in 30 minutes.**
