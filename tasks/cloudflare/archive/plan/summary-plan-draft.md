# Cloudflare + Next.js Setup Plan — From Dashboard to Production

**Current date:** 2026-07-12  
**Status:** AI Gateway live · Automatic configuration (official official fastest path)  
**Timeline:** 20 minutes to production · Operator features phase-gated by IPI-525 + CF-MIG-220

---

## 📍 Where We Are Now

### ✅ Already Deployed & Verified

| Component | Status | What it does |
|-----------|--------|------------|
| **AI Gateway Worker** | 🟢 LIVE | Runs at edge (Cloudflare). Handles chat (Llama 3.1) & search (BGE embeddings). |
| **Workers AI** | 🟢 LIVE | Powers both. No API keys needed for iPix routes. |
| **Auto-deploy** | 🟢 LIVE | Push to main → gateway auto-deploys. No manual steps. |
| **Health check** | 🟢 VERIFIED | `/health` returns 200 OK. Gateway is ready to receive requests. |

### What This Means for iPix

**Today:** Operator can chat with Llama 3.1, get embeddings for search.  
**Next:** Operator chat with tool calling (plan refinement, CRM lookups, shoot creation). Brand Intelligence agents can use RAG (embeddings + KV cache).  
**Blocker:** IPI-525 (tool calling forwarding) — gates planning/CRM workflows.

### 🟡 Dashboard Checklist (Finish Today)

**What this is:** Admin tasks to tell your team where the AI Gateway lives and how it's monitored.

**Why it matters:** Without this, your team doesn't know the API is live, can't monitor it, and might re-build it later.

**To-do:**
- [ ] **Record gateway URL on Linear (IPI-472)** — Team needs to know: `https://ai-gateway.sk-498.workers.dev` is live
- [ ] **Narrow auto-deploy path** — Tell Cloudflare to only re-build when `services/cloudflare-worker/` changes (not when you change docs)
- [ ] **Verify secrets are encrypted** — API token should be locked, not visible in dashboard
- [ ] **(Optional) Enable traces** — For debugging "why is the gateway slow?" later

**Real example:**
Your team asks: "Is AI Gateway deployed?" You answer: "Yes, see IPI-472 in Linear. The gateway is live at the URL recorded there." They test it. It works. Done.

**Time:** 15 minutes  
**Impact:** Team knows the gateway exists and where to find it

---

---

## 🎬 Real-World iPix Workflows

### Today (With AI Gateway)
Brand Guardian asks: "What's the creative direction for Spring Campaign?" Operator sends the question to AI Gateway (running at Cloudflare edge). Llama 3.1 responds in under 200 milliseconds. Brand Guardian gets the answer immediately.

### This Week (After IPI-525: Tool Calling)
Creative Director says: "Create a plan for Spring Campaign shoot." Operator sends the message plus available tools (plan creation, asset tagging). Llama decides which tool to use. Tool results come back. Llama refines the response. Plan appears in Operator UI, ready for review.

### Next Week (After CF-MIG-220: State)
Brand Intelligence Agent runs on a schedule. It searches brand performance data using embeddings. Cloudflare KV cache stores summaries so we don't re-compute every time. Insights are sent to Brand Guardian through CopilotKit.

---

## 🎯 Phase 1: Deploy to Cloudflare (This Week)

### What Phase 1 Does

**Today:** Your Next.js app runs on your local machine.  
**After Phase 1:** Your Next.js app runs on Cloudflare Workers (global edge). AI Gateway requests route through iPix → Cloudflare edge → Workers AI → response back in <200ms.

**Why Cloudflare Workers?** 
- Faster response times (closer to users)
- No server to manage
- AI Gateway bindings built-in
- Auto-scales

---

### Quick Comparison: Which Option for iPix?

| Option | Setup | Ease | Deploy | Best for |
|--------|-------|------|--------|----------|
| **A: Auto-config** | 5 min | Easiest | Manual (`wrangler deploy`) | Today, testing |
| **B: C3** | 10 min | Easy | Manual (`wrangler deploy`) | Fresh start, clean separation |
| **C: Dashboard** | 15 min | Medium | Auto (merge → deploy) | Long-term, hands-off CI/CD |

**iPix recommendation:** Start with **Option A** (auto-config). You get Operator on Cloudflare today. Later, if you want auto-deploy, switch to **Option C** (one-time setup).

---

### Option Explained in Plain English

**Option A: Auto-config**
> You already have a Next.js app. Just tell Wrangler "deploy this to Cloudflare." Wrangler figures out the rest. You deploy manually each time you push.
> 
> **When:** Today, testing, quick verification.

**Option B: C3**
> You want a brand-new Next.js project, clean and only for Operator. C3 scaffolds it for Cloudflare from the start.
> 
> **When:** You want a separate, dedicated Operator project (not mixed with other app code).

**Option C: Dashboard + Git**
> You connect your GitHub repo to Cloudflare's dashboard. Every time you merge a PR, Cloudflare automatically builds and deploys. No manual commands.
> 
> **When:** You want hands-off, push-to-production workflow (like Pages).

**iPix right now:** Option A (get it running today). Later, Option C (automate deploys).

---

### References
- [Next.js on Cloudflare Workers — Official Guide](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/)
- [Automatic Configuration (Wrangler)](https://developers.cloudflare.com/workers/framework-guides/automatic-configuration/)
- [Dashboard Setup (Git Integration)](https://developers.cloudflare.com/workers/get-started/dashboard/)

### Option A: Automatic Config (Existing `app/`) — FASTEST

**What you do:** Run one deploy command. Wrangler figures out everything.

**Step 1: Set environment** 
Add the AI Gateway URL to your `.env.local` file so the app knows where to send requests.

**Step 2: Deploy**
Run the deploy command in your app directory. Wrangler automatically:
- Detects you have a Next.js app
- Installs the Cloudflare adapter (OpenNext)
- Generates the Wrangler configuration file
- Deploys your app to Cloudflare Workers

**Step 3: Verify**
Visit your deployed app URL (Cloudflare gives you one). Test the AI endpoint. You should get a response from Llama.

**Time:** 5 minutes

---

### Option B: C3 (New Separate Project)

**When to use:** You want a brand-new, clean Next.js project on Cloudflare (separate from `/app`).

**Real-world iPix example:**
- Current: Operator runs in `/app` (mixed with other features, might have tech debt)
- Option B: Create fresh `ipix-operator` just for Operator UI + AI Gateway
- Benefit: Cleaner, easier to maintain, deploy independently

**What happens:**
1. **Run C3** (2 min) — C3 creates a new folder with Next.js pre-configured for Cloudflare. All Cloudflare settings are already built in.

2. **Add AI Gateway environment** (1 min) — Set the gateway URL in `.env.local` so the new app knows where to send requests.

3. **Deploy** (1 min) — Run deploy in the new project folder. Wrangler auto-configures and deploys to Cloudflare Workers with a URL like `ipix-operator.workers.dev`.

**Pro:** Clean separation. Operator lives independently.  
**Con:** Need to migrate existing Operator code from `/app` → `ipix-operator`.

**Time:** 10 minutes setup + migration time (if needed)

---

### Option C: Dashboard + Git (Auto-Deploy on Merge)

**When to use:** You want push-to-deploy (merge to main → auto-deploys to Cloudflare). Hands-off.

**Real-world iPix example:**
- Current: Deploy manually each time (`npx wrangler deploy`)
- Option C: Merge PR → GitHub → Cloudflare auto-deploys
- Benefit: No manual steps. CI/CD handles deployment.

**What happens:**
1. **Connect repo in Cloudflare dashboard** (3 min) — Go to the Cloudflare dashboard and click "Connect Git." Select your Lumina Studio repo. Cloudflare authenticates with GitHub.

2. **Cloudflare creates a PR** (auto) — Cloudflare generates a pull request that adds all the Cloudflare configuration files to your repo. You review and approve it.

3. **Merge the PR** (1 min) — When you merge, GitHub signals Cloudflare. Cloudflare automatically builds and deploys your app. No manual commands needed.

**Pro:** Hands-off. Every merge to main auto-deploys. Works like Pages (you're used to this).  
**Con:** Requires GitHub repo and PR workflow setup.

**For iPix CI/CD:**
Developer pushes to a feature branch. GitHub creates a PR. Cloudflare builds a preview deployment so you can test. Team approves and merges. GitHub signals Cloudflare. Cloudflare deploys to production automatically. Operator is live.

**Time:** 15 minutes (includes GitHub + Cloudflare setup)

---

## Phase 1 Checklist

- [ ] Environment set (NEXT_PUBLIC_AI_GATEWAY_URL)
- [ ] Deployment command run (auto-config generates config)
- [ ] Verify Workers deployment succeeds
- [ ] Test route responds

**Recommended:** Option A (5 min, uses existing `app/`)

**Time:** 5–15 minutes  
**Blockers:** None

---

## ✅ Phase 2: Verify & Monitor

**What you're checking:** Is the app running on Cloudflare? Can it talk to AI Gateway?

### Verification Checklist

**Check 1: Is it deployed?**
Look at your Cloudflare deployments. You should see a recent deploy timestamp.

**Check 2: Does the app respond?**
Visit your worker URL in a browser. The Next.js app should load and show your Operator UI.

**Check 3: Does AI work?**
Test the AI endpoint. Send a request. You should get a JSON response from Llama.

**Check 4: Any errors?**
Check the Cloudflare logs. There should be no ERROR or WARNING messages.

### iPix-Specific Test
Brand Guardian opens the Operator. Next.js loads from Cloudflare edge ✅. They ask "What's my top product?" The question routes through AI Gateway ✅. Llama responds in under 200 milliseconds ✅.

**Time:** ~5 minutes

---

## Reference: What Auto-Config Does

When you deploy, Wrangler automatically:

1. **Detects** that you have a Next.js app (reads package.json)
2. **Installs** the Cloudflare adapter (the bridge between Next.js and Cloudflare)
3. **Generates** all the Cloudflare configuration files with the right settings for your app
4. **Deploys** your app to Cloudflare Workers

No manual config needed. Everything is automatic. See [Automatic Configuration docs](https://developers.cloudflare.com/workers/framework-guides/automatic-configuration/).
/compaweb
---

## 🔧 Phase 3: Enable Operator Features (Week 2–3)

**What Phase 3 Does:** Unlock AI workflows (planning, CRM, agent autonomy).

### Currently Blocked — Why They Matter for iPix

| Feature | Blocker | What it enables |
|---------|---------|-----------------|
| **Tool calling** | IPI-525 | Operator can call plan tools, CRM lookup, asset tagging. "Plan this shoot" → AI creates plan automatically. |
| **Multi-turn state** | CF-MIG-220 | Conversations persist. Brand Guardian can ask follow-ups; context remembered across messages. |
| **Agent loops** | Mastra + above | Brand Intelligence agent runs autonomously. Searches data, generates insights, posts to feed. |

### IPI-525 Example: When Tool Calling Works

**User:** "Create a mood board plan for the Spring Campaign"

**What happens:**
1. Operator sends request + available tools (plan_create, asset_search)
2. Llama decides: "I'll use plan_create()"
3. Plan appears with moods, color palette, style direction
4. User reviews + accepts in Operator UI

**Without tool calling:** User manually fills form; Llama writes description. Slower + less creative.

---

### When IPI-525 Is Fixed

The Operator will be updated to send tool information to AI Gateway. Llama will receive the list of available tools and decide which one to use. The AI will call the tool, get the result, and refine its response to the user.

Integration will happen in the gateway-client (the file that talks to AI Gateway). The client will add a `tools` parameter to the chat request, telling Llama what tools are available.

---

## 📊 Architecture

**User's browser** sends a request to **Cloudflare edge** (servers near the user). The request goes to your **Next.js app running as a Cloudflare Worker**. The app has routes for chat, planning, and CRM. When you need AI, the app sends a request to **AI Gateway (another Cloudflare Worker)**. AI Gateway routes to **Workers AI** (Llama 3.1 for chat, BGE for search). All data lives in **Supabase** (not Cloudflare D1). Responses come back through the same path, fast.

---

## Blockers

### 🔴 Critical

1. **Linter OOM in CI** — Blocks all PRs (ETA: Today)
2. **IPI-525** — Tool calling (ETA: This week)
3. **CF-MIG-220** — State verification (ETA: Next week)

---

## Timeline

**Today (20 minutes)**
- ✅ Phase 1: Deploy Operator to Cloudflare (5 min)
- ✅ Phase 2: Verify it works (5 min)
- ✅ Dashboard checklist (15 min)

**This week**
- 🔴 IPI-525: Tool calling (blocks planning and CRM)
- 🔴 CF-MIG-220: State persistence (blocks multi-turn conversations)

**Next week+**
- 🚀 Phase 3: Enable all operator features
- 🚀 Full rollout to Brand Guardians

---

## Quick Reference

| Task | Status | ETA |
|------|--------|-----|
| AI Gateway | 🟢 LIVE | — |
| Auto-config deploy | 🟡 Today | 5 min |
| Verify | 🟡 Today | 5 min |
| Dashboard checklist | 🟡 Today | 15 min |
| Tool calling | 🔴 IPI-525 | This week |
| Operator features | 🔴 Gated | Week 2+ |

---

## Links

- [Workers Guide](https://developers.cloudflare.com/workers/get-started/guide/)
- [Next.js on Workers](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/)
- [OpenNext](https://github.com/opennextjs/open-next)
- [Workers AI Models](https://developers.cloudflare.com/workers-ai/models/)

---

## Success Criteria

**Phase 1:** Next.js + client working locally  
**Phase 2:** Deployed to staging + production  
**Phase 3:** Tools + multi-turn enabled

---

## 🎯 End-to-End iPix Journey

### Week 1: Deploy (Phase 1–2, 20 min)
Monday morning: Deploy Operator to Cloudflare. Verify the AI endpoint works. Complete dashboard checklist. **Status:** Operator runs on Cloudflare. Chat works. Ready for testing.

### Week 2: Plan & Test (IPI-525)
Team builds tool calling integration. Operator unlocks plan creation, CRM lookup, asset tagging. QA tests "Create shoot plan" workflow end-to-end.

### Week 3: Agent Loop & Full Rollout (CF-MIG-220)
Brand Intelligence agent runs autonomously. Operator conversations preserve context across messages. Creative Director uses Operator for daily planning workflow.

---

## When Stuck

**"Deploy failed"** → Run deploy again with verbose logging to see the error message.  
**"AI Gateway timeout"** → Check IPI-472 in Linear to confirm the gateway URL is recorded and correct.  
**"Tool calling not working"** → This is expected. IPI-525 hasn't shipped yet.  
**"Conversations don't remember context"** → This is expected. CF-MIG-220 hasn't shipped yet.  

All blockers are tracked in Linear. Don't guess — check Linear for the latest status.

---

**Version:** 1.0 (official Cloudflare auto-config)  
**Updated:** 2026-07-12  
**Next review:** After Phase 1 completes
