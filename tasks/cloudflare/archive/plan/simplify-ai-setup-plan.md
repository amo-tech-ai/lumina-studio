> **Supporting / superseded (not domain SSOT).** Active Cloudflare roadmap: [`../PLAN.md`](../PLAN.md). Active progress: [`../todo.md`](../todo.md).

# The Plan — Simplify Our Cloudflare AI Setup

**Goal:** Stop fighting bugs. Start shipping.  
**Time to complete:** 5 days  
**Code we delete:** 2,300+ lines  
**Code we write:** ~30 lines

---

## The Problem (plain English)

We have **32 known bugs** across our last 4 PRs. Every fix creates new bugs. We're losing.

**Why?** Because we built a custom AI gateway that we didn't need to build. Cloudflare already sells exactly what we built — for free, maintained by their engineers.

> **Analogy:** It's like we built our own post office in our backyard because we didn't know USPS delivers to our door.

---

## The Solution (plain English)

**Delete our custom gateway. Use what Cloudflare already gives us.**

Cloudflare offers **three prebuilt paths** — simplest first:

### Path A — Dashboard only (zero code)
```
Cloudflare Dashboard → AI → AI Gateway → Create Gateway
```
- Caching, rate limits, spend limits, retries, fallbacks — **all click-to-enable**
- The `default` gateway **auto-creates on first request** (zero setup)
- Call from anywhere with one header: `cf-aig-gateway-id: default`
- **Unified Billing** — pay for all AI through Cloudflare, no provider keys

### Path B — One-command prebuilt starter (Cloudflare's recommendation)
```bash
npx create-cloudflare@latest --template cloudflare/agents-starter
```
- Complete working agent out of the box: streaming chat, tools, HITL, scheduling
- Uses Workers AI by default — **no API keys required**
- Cloudflare's official starter template

### Path C — Add binding to our existing app ← **this is what we do**
```jsonc
// wrangler.jsonc — one line added
"ai": { "binding": "AI" }
```
```ts
// anywhere in the app
const result = await env.AI.run("@cf/meta/llama-4-scout-17b-16e-instruct", { messages });
```
For Mastra: `npm i workers-ai-provider` → `createWorkersAI({ binding: env.AI })`

**We pick Path C** because we already have a Next.js app with Mastra. Paths A and B are for greenfield.

### What each Cloudflare product replaces

| Cloudflare gives us (free/managed) | Replaces our custom... |
|------------------------------------|------------------------|
| **Workers AI** (`env.AI` binding) | Gateway router (400 lines) |
| **`workers-ai-provider`** (official npm package) | Provider adapter (455 lines) |
| **AI Gateway** (dashboard product) | Retry logic, error handling, cost tracking, failover |

---

## Before vs After (visual)

### Now — too many moving parts

```
Browser → App → Mastra → [custom router → custom adapter → custom registry]
  → [custom gateway Worker] → [Workers AI or Gemini or Bedrock]
```

### After — simple

```
Browser → App → Mastra → env.AI → Workers AI
                          ↓
                   (AI Gateway watches everything)
```

---

## What We Delete

Almost everything in two folders:

- ❌ `services/cloudflare-worker/` — the entire custom gateway (1,392 lines)
- ❌ `app/src/lib/ai/provider-adapter.ts` — custom HTTP client (455 lines)
- ❌ `app/src/lib/ai/model-registry.ts` — one of four registries (103 lines)
- ❌ `app/src/lib/ai/gemini-registry.ts` — Gemini code (29 lines)
- ❌ `app/src/lib/ai/groq-models.*` — Groq code (147 lines)
- ❌ Most of `app/src/lib/ai/provider.ts` and `types.ts`

**Total: ~2,300 lines gone.**

---

## What We Keep

Everything that actually works:

- ✅ **Mastra agents** (all 9) — they don't change at all
- ✅ **Mastra tools** (all 20+) — they stay in the app, where they belong
- ✅ **Mastra memory** (PostgresStore) — unchanged
- ✅ **CopilotKit** — unchanged
- ✅ **Supabase** — unchanged

The agents don't even notice we changed anything. They still call `resolveModel("fast")`. The function just returns a different model internally.

---

## What We Drop Entirely

- 🗑️ **Gemini** — we're done with it
- 🗑️ **Groq** — already retiring
- 🗑️ **Bedrock** — AI Gateway handles fallback now

**Only Workers AI.** Four models cover everything we need.

---

## The New Code (all of it)

### Step 1: Add one line to `wrangler.jsonc`

```jsonc
"ai": { "binding": "AI" }
```

📘 **Official docs:** [Workers AI bindings](https://developers.cloudflare.com/workers-ai/configuration/bindings/) · [Get started guide](https://developers.cloudflare.com/workers-ai/get-started/workers-wrangler/)

### Step 2 (minimum): Call `env.AI.run()` directly — no npm package needed

```ts
const result = await env.AI.run("@cf/meta/llama-4-scout-17b-16e-instruct", {
  messages: [{ role: "user", content: "hello" }]
});
```

📘 **Official docs:** [Workers AI get-started](https://developers.cloudflare.com/workers-ai/get-started/workers-wrangler/) · [Model catalog](https://developers.cloudflare.com/workers-ai/models/)

### Step 2 (for Mastra): Install one package, write 30 lines

```bash
npm i workers-ai-provider
```

```ts
import { createWorkersAI } from "workers-ai-provider";

const MODELS = {
  fast: "@cf/zai-org/glm-4.7-flash",
  default: "@cf/meta/llama-4-scout-17b-16e-instruct",
  structured: "@cf/google/gemma-4-26b-a4b-it",
  embedding: "@cf/baai/bge-base-en-v1.5",
};

export function resolveModel(tier, env) {
  return createWorkersAI({ binding: env.AI })(MODELS[tier]);
}
```

📘 **Official docs:** [workers-ai-provider on npm](https://www.npmjs.com/package/workers-ai-provider) · [AI SDK integration guide](https://developers.cloudflare.com/workers-ai/configuration/ai-sdk/) · [Agents: Using AI Models](https://developers.cloudflare.com/agents/runtime/operations/using-ai-models/)

### Step 3 (optional): Turn on AI Gateway in dashboard — zero code

Dashboard → AI → AI Gateway → Settings → toggle:
- ✅ Cache Responses (saves money on repeated requests)
- ✅ Rate Limiting (prevents abuse)
- ✅ Spend Limits (budget cap per day/week/month)
- ✅ Retries (up to 5 attempts, configurable backoff)
- ✅ Dynamic Routing (fallback to cheaper model if primary fails)

📘 **Official docs:** [AI Gateway get-started](https://developers.cloudflare.com/ai-gateway/get-started/) · [Workers AI + AI Gateway binding](https://developers.cloudflare.com/ai-gateway/integrations/aig-workers-ai-binding/) · [Caching](https://developers.cloudflare.com/ai-gateway/features/caching/) · [Rate limiting](https://developers.cloudflare.com/ai-gateway/features/rate-limiting/) · [Spend limits](https://developers.cloudflare.com/ai-gateway/features/spend-limits/) · [Dynamic routing](https://developers.cloudflare.com/ai-gateway/features/dynamic-routing/) · [Auto-retry](https://developers.cloudflare.com/changelog/post/2026-04-02-auto-retry-upstream-failures/)

**That's the whole provider layer.** Done.

---

## Step-by-Step Setup Guide (for our existing Next.js app)

We already have Next.js on Cloudflare Workers via OpenNext — confirmed at `app/wrangler.jsonc` and `app/open-next.config.ts`. Wrangler is at v4.86.0 (above the 4.68.0 minimum). Here's exactly what to do:

### What we already have ✅

| Component | Status | File |
|-----------|--------|------|
| Next.js 16 app | ✅ Exists | `app/` |
| OpenNext adapter | ✅ Configured | `app/open-next.config.ts` |
| Wrangler config | ✅ Exists | `app/wrangler.jsonc` |
| `nodejs_compat` flag | ✅ Enabled | `app/wrangler.jsonc:6-8` |
| Assets binding | ✅ Configured | `app/wrangler.jsonc:9-12` |
| Cloudflare Images | ✅ Bound | `app/wrangler.jsonc:19-21` |
| Observability | ✅ Enabled | `app/wrangler.jsonc:22-24` |

📘 **Reference:** [Next.js on Cloudflare Workers](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/) · [OpenNext for Cloudflare](https://opennext.js.org/cloudflare) · [OpenNext get-started](https://opennext.js.org/cloudflare/get-started)

### What we add (3 changes)

#### Change 1: Add `ai` binding to `wrangler.jsonc`

```jsonc
{
  // ... existing config ...
  "ai": {
    "binding": "AI"
  }
}
```

Run `npx wrangler types` to regenerate the `CloudflareEnv` types with `AI: Ai`.

📘 **Docs:** [Workers AI binding config](https://developers.cloudflare.com/workers-ai/configuration/bindings/) · [wrangler types command](https://developers.cloudflare.com/workers/wrangler/commands/general/#types)

#### Change 2: Install `workers-ai-provider`

```bash
cd app && npm i workers-ai-provider
```

📘 **Docs:** [workers-ai-provider on npm](https://www.npmjs.com/package/workers-ai-provider) · [AI SDK + Workers AI guide](https://developers.cloudflare.com/workers-ai/configuration/ai-sdk/)

#### Change 3: Replace `app/src/lib/ai/provider.ts`

Replace 234 lines with the ~30-line version from "The New Code" section above.

#### Optional Change 4: Enable AI Gateway (dashboard, no code)

1. Dashboard → **AI** → **AI Gateway** → **Create Gateway** (or use `default`)
2. In `wrangler.jsonc`, point the binding at it:
   ```jsonc
   "ai": {
     "binding": "AI",
     "gateway": { "id": "ipix-prod" }
   }
   ```
3. Toggle caching/rate limits/spend limits in the dashboard Settings tab.

📘 **Docs:** [Create a gateway](https://developers.cloudflare.com/ai-gateway/get-started/) · [Gateway + Workers AI binding](https://developers.cloudflare.com/ai-gateway/integrations/aig-workers-ai-binding/) · [Manage gateway settings](https://developers.cloudflare.com/ai-gateway/configuration/manage-gateway/)

### Alternative: Start from Cloudflare's template (for reference)

If we were starting fresh, Cloudflare's official command is:

```bash
npm create cloudflare@latest -- my-next-app --framework=next --platform=workers
```

Or the agents starter:

```bash
npx create-cloudflare@latest --template cloudflare/agents-starter
```

📘 **Docs:** [Create Cloudflare CLI (C3)](https://developers.cloudflare.com/workers/get-started/quickstarts/) · [agents-starter template](https://github.com/cloudflare/agents-starter) · [Automatic project configuration](https://developers.cloudflare.com/workers/framework-guides/automatic-configuration/)

We don't need this — our Next.js app is already deployed. But it shows the pattern Cloudflare recommends.

### Verify it works

```bash
cd app
npx wrangler types          # regenerates CloudflareEnv with AI: Ai
npm run dev                 # local dev (Next.js server)
npm run preview             # local preview in Workers runtime (wrangler dev)
npm run deploy              # deploy to production
```

📘 **Docs:** [OpenNext develop & deploy](https://opennext.js.org/cloudflare/howtos/dev-deploy) · [Environment variables](https://opennext.js.org/cloudflare/howtos/env-vars) · [Bindings in OpenNext](https://opennext.js.org/cloudflare/bindings)

---

---

## The Timeline (5 days)

| Day | What happens | Proof it worked |
|:---:|--------------|-----------------|
| **0** | Click "Create AI Gateway" in Cloudflare dashboard | Gateway URL exists |
| **1** | One agent (`public-marketing`) runs through new path | Type "hello" in chat → get a streamed reply |
| **2** | Delete the old gateway code | Build still green |
| **3** | Migrate agents + fix tool calling | **The 502 bug is gone** |
| **4** | Turn on caching, rate limits, cost tracking in dashboard | Dashboard shows analytics |
| **5** | Buffer / polish / docs | Production-ready |

---

## The One Test That Proves It Works

The exact thing that's broken today must work:

```
You: "Schedule a shoot for August 1st"
Agent: [calls schedule_shoot tool]
Agent: "Done — Shoot #42 is booked for Aug 1"
```

Today this 502s on step 3. After the migration, it just works. That's our acceptance test.

---

## What About the 18 Linear Tasks?

**14 of them get canceled.** They exist to maintain custom code we're deleting.

| Task | Why cancel |
|------|-----------|
| IPI-454 (Gateway) | No custom gateway anymore |
| IPI-457 (Registry) | No registry — 4 inline model IDs |
| IPI-461 (Adapter) | Official package replaces it |
| IPI-527–531 (Tool routing, retry, etc.) | AI Gateway handles all of it |
| IPI-460 (Cost tracking) | AI Gateway dashboard shows costs |
| IPI-463 (Failover) | AI Gateway dynamic routing |
| IPI-573 (Fix 502) | Custom gateway deleted — bug gone |
| ...and 7 more | All maintain code we're deleting |

**We create 1 new epic** with 4 phase tasks. That's it.

---

## Is This What Cloudflare Recommends?

**Yes — this is literally their starter template.**

From the [Cloudflare Agents docs](https://developers.cloudflare.com/agents/):

> *"Three commands to a running agent. No API keys required — the starter uses Workers AI by default."*

```bash
npx create-cloudflare@latest --template cloudflare/agents-starter
cd agents-starter && npm install
npm run dev
```

From the [Workers AI get-started guide](https://developers.cloudflare.com/workers-ai/get-started/workers-wrangler/):

> Step 1: `npm create cloudflare@latest -- hello-ai`  
> Step 2: Add `"ai": { "binding": "AI" }` to wrangler.jsonc  
> Step 3: `env.AI.run("@cf/meta/llama-3.1-8b-instruct", { prompt })`  
> Step 4: `npx wrangler deploy`

**That's their entire tutorial.** Four steps. No custom gateway. No provider abstraction. No registry. No retry classifier.

From the [AI Gateway get-started](https://developers.cloudflare.com/ai-gateway/get-started/):

> *"For third-party models, you do not need to specify a gateway — AI Gateway uses `default` as the gateway ID and automatically creates it on the first authenticated request."*

**Zero setup.** The gateway creates itself.

| What we built custom | What Cloudflare ships |
|---------------------|----------------------|
| 1,392-line gateway Worker | `env.AI` binding (1 line in wrangler.jsonc) |
| 4 model registries | Inline model ID strings |
| Custom retry classifier | Dashboard toggle: "Retry up to 5 attempts" |
| Custom error envelope | AI Gateway returns standardized errors |
| Custom circuit breaker | Dashboard: "Spend limit: $50/day" |
| Custom cost tracking | Dashboard: Cost analytics tab |
| Custom failover to Bedrock | Dashboard: Dynamic routing → fallback model |

We were solving problems that don't exist.

---

## Official Documentation References

Every recommendation in this plan is backed by official Cloudflare documentation. All links verified July 2026.

### Next.js on Cloudflare Workers (our existing setup)

| Topic | Link |
|-------|------|
| Next.js framework guide | https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/ |
| OpenNext for Cloudflare (home) | https://opennext.js.org/cloudflare |
| OpenNext get-started (existing apps) | https://opennext.js.org/cloudflare/get-started |
| Automatic project configuration | https://developers.cloudflare.com/workers/framework-guides/automatic-configuration/ |
| OpenNext bindings guide | https://opennext.js.org/cloudflare/bindings |
| OpenNext develop & deploy | https://opennext.js.org/cloudflare/howtos/dev-deploy |
| OpenNext environment variables | https://opennext.js.org/cloudflare/howtos/env-vars |
| `@opennextjs/cloudflare` on npm | https://www.npmjs.com/package/@opennextjs/cloudflare |

### Workers AI (the inference engine)

| Topic | Link |
|-------|------|
| Workers AI overview | https://developers.cloudflare.com/workers-ai/ |
| Get-started (Wrangler + bindings) | https://developers.cloudflare.com/workers-ai/get-started/workers-wrangler/ |
| Model catalog (50+ models) | https://developers.cloudflare.com/workers-ai/models/ |
| Bindings configuration | https://developers.cloudflare.com/workers-ai/configuration/bindings/ |
| OpenAI-compatible API | https://developers.cloudflare.com/workers-ai/configuration/open-ai-compatibility/ |
| AI SDK integration | https://developers.cloudflare.com/workers-ai/configuration/ai-sdk/ |
| Pricing | https://developers.cloudflare.com/workers-ai/platform/pricing/ |
| Limits | https://developers.cloudflare.com/workers-ai/platform/limits/ |

### AI Gateway (managed observability + control)

| Topic | Link |
|-------|------|
| AI Gateway overview | https://developers.cloudflare.com/ai-gateway/ |
| Get-started guide | https://developers.cloudflare.com/ai-gateway/get-started/ |
| Workers AI + AI Gateway binding | https://developers.cloudflare.com/ai-gateway/integrations/aig-workers-ai-binding/ |
| Unified API (OpenAI compat) | https://developers.cloudflare.com/ai-gateway/usage/chat-completion/ |
| REST API | https://developers.cloudflare.com/ai-gateway/usage/rest-api/ |
| Caching | https://developers.cloudflare.com/ai-gateway/features/caching/ |
| Rate limiting | https://developers.cloudflare.com/ai-gateway/features/rate-limiting/ |
| Spend limits | https://developers.cloudflare.com/ai-gateway/features/spend-limits/ |
| Dynamic routing (fallbacks) | https://developers.cloudflare.com/ai-gateway/features/dynamic-routing/ |
| Auto-retry (Apr 2026) | https://developers.cloudflare.com/changelog/post/2026-04-02-auto-retry-upstream-failures/ |
| Request handling (timeouts) | https://developers.cloudflare.com/ai-gateway/configuration/request-handling/ |
| BYOK (store keys) | https://developers.cloudflare.com/ai-gateway/configuration/bring-your-own-keys/ |
| Custom providers | https://developers.cloudflare.com/ai-gateway/configuration/custom-providers/ |
| Default gateway (auto-create) | https://developers.cloudflare.com/changelog/post/2026-03-02-default-gateway/ |
| Analytics dashboard | https://developers.cloudflare.com/ai-gateway/observability/analytics/ |
| Cost tracking | https://developers.cloudflare.com/ai-gateway/observability/costs/ |
| Custom metadata | https://developers.cloudflare.com/ai-gateway/observability/custom-metadata/ |

### Official npm packages

| Package | Link |
|---------|------|
| `workers-ai-provider` (AI SDK v6) | https://www.npmjs.com/package/workers-ai-provider |
| `ai-gateway-provider` (AI SDK v6) | https://www.npmjs.com/package/ai-gateway-provider |
| `agents` (Agents SDK) | https://www.npmjs.com/package/agents |
| `@opennextjs/cloudflare` | https://www.npmjs.com/package/@opennextjs/cloudflare |
| `wrangler` CLI | https://www.npmjs.com/package/wrangler |

### Cloudflare Agents SDK (for reference — not adopting now)

| Topic | Link |
|-------|------|
| Agents overview | https://developers.cloudflare.com/agents/ |
| Using AI Models in Agents | https://developers.cloudflare.com/agents/runtime/operations/using-ai-models/ |
| agents-starter template | https://github.com/cloudflare/agents-starter |
| Agents SDK GitHub | https://github.com/cloudflare/agents |
| v0.3.0 + AI SDK v6 changelog | https://developers.cloudflare.com/changelog/post/2025-12-22-agents-sdk-ai-sdk-v6/ |

### Workers AI models we'll use

| Model | Link |
|-------|------|
| GLM-4.7-Flash (fast tier) | https://developers.cloudflare.com/workers-ai/models/glm-4.7-flash/ |
| Llama 4 Scout 17B (default tier) | https://developers.cloudflare.com/workers-ai/models/llama-4-scout-17b-16e-instruct/ |
| Gemma 4 26B A4B (structured tier) | https://developers.cloudflare.com/workers-ai/models/gemma-4-26b-a4b-it/ |
| BGE base en v1.5 (embedding) | https://developers.cloudflare.com/workers-ai/models/bge-base-en-v1.5/ |
| Function calling overview | https://developers.cloudflare.com/workers-ai/features/function-calling/ |

### Deployment & CI/CD

| Topic | Link |
|-------|------|
| Workers Builds | https://developers.cloudflare.com/workers/ci-cd/builds/ |
| Build configuration | https://developers.cloudflare.com/workers/ci-cd/builds/configuration/ |
| Auto PRs from dashboard import | https://developers.cloudflare.com/workers/ci-cd/builds/automatic-prs/ |
| Create from template (C3) | https://developers.cloudflare.com/workers/get-started/quickstarts/ |
| Deploy to workers.dev | https://developers.cloudflare.com/workers/configuration/routing/workers-dev/ |
| Custom domains | https://developers.cloudflare.com/workers/configuration/routing/custom-domains/ |

### Cloudflare Workers platform

| Topic | Link |
|-------|------|
| Workers overview | https://developers.cloudflare.com/workers/ |
| Wrangler configuration | https://developers.cloudflare.com/workers/wrangler/configuration/ |
| Wrangler CLI commands | https://developers.cloudflare.com/workers/wrangler/commands/general/ |
| Node.js compatibility | https://developers.cloudflare.com/workers/runtime-apis/nodejs/ |
| Compatibility dates | https://developers.cloudflare.com/workers/configuration/compatibility-dates/ |
| Worker size limits | https://developers.cloudflare.com/workers/platform/limits/ |
| Observability | https://developers.cloudflare.com/workers/observability/logs/ |

---

---

## Risks (honest assessment)

| What could go wrong | How likely | Our backup plan |
|---------------------|:----------:|-----------------|
| New code has a bug | Low | We can revert in 1 command |
| Workers AI quality worse than Gemini | Medium | We can re-add Gemini via AI Gateway as a "custom provider" in 10 minutes |
| Rate limits hit | Medium | AI Gateway caching + rate limiting handles it |
| Tool calling breaks again | Low | Phase 3 tests the exact scenario before we ship |

**Biggest risk of all: doing nothing.** The next 4 PRs will have 32 more issues. Then 40. Then 50. We're patching a ship we should dry-dock.

---

## What We Need From You

**Three yes/no decisions:**

1. **Drop Gemini, Groq, and Bedrock entirely?** (Workers AI only) — Yes / No
2. **Delete the custom gateway Worker?** (~2,300 lines gone) — Yes / No
3. **Cancel the 14 Linear tasks maintaining it?** — Yes / No

If three yeses → we start tomorrow morning. Working chat by end of Day 1. Done by end of week.

---

## The Mindset Shift

We've been asking: *"How do we fix this gateway bug?"*

We should be asking: *"Why do we have a gateway at all?"*

Cloudflare already built it. Let's use theirs.
