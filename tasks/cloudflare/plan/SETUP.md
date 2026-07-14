# The Easiest Setup — Cloudflare Workers AI for Next.js

**One page. Three options. Pick one.**

---

## What the 6 PRs Were Doing (and why to stop)

| PR | What it did | What it should have been |
|----|-------------|--------------------------|
| [#333](https://github.com/amo-tech-ai/lumina-studio/pull/333) | Added tool protocol forwarding to custom Worker | Not needed — `workers-ai-provider` handles it |
| [#334](https://github.com/amo-tech-ai/lumina-studio/pull/334) | More custom provider code | Delete — use managed AI Gateway |
| [#336](https://github.com/amo-tech-ai/lumina-studio/pull/336) | Audit doc for #333 | Audit of code that shouldn't exist |
| [#339](https://github.com/amo-tech-ai/lumina-studio/pull/339) | Bearer token auth on custom gateway | Not needed — binding is in-process, no auth |
| [#340](https://github.com/amo-tech-ai/lumina-studio/pull/340) | Swapped deprecated Llama 2 → Llama 3.1 in registry | Not needed — just change one model ID string |
| [#342](https://github.com/amo-tech-ai/lumina-studio/pull/342) | Fixed Gemini provider | Not needed — drop Gemini |

**Pattern:** Every PR patches `services/cloudflare-worker/`. That entire directory duplicates what Cloudflare ships for free. Stop patching. Delete it.

---

## Option 1: The One-Command CLI (recommended for existing apps)

### `npx @opennextjs/cloudflare migrate` — OpenNext's official migration tool

**What it does automatically:**
- ✅ Installs `@opennextjs/cloudflare`
- ✅ Installs `wrangler`
- ✅ Creates `wrangler.jsonc`
- ✅ Creates `open-next.config.ts`
- ✅ Updates `package.json` scripts (`deploy`, `preview`, `cf-typegen`)
- ✅ Adds `.dev.vars`
- ✅ Configures R2 caching if enabled
- ✅ Updates `.gitignore`

**One command. Everything set up.**

📘 **Official doc:** [OpenNext: Existing Next.js apps](https://opennext.js.org/cloudflare/get-started#existing-nextjs-apps) · [CLI reference](https://opennext.js.org/cloudflare/cli)

### `npx wrangler setup` — Cloudflare's automatic framework detection

**What it does automatically:**
- ✅ Detects Next.js
- ✅ Installs the right adapter
- ✅ Generates `wrangler.jsonc`
- ✅ Adds scripts to `package.json`
- ✅ Updates `.gitignore`
- ✅ Configures R2 for caching (if enabled)

Requires Wrangler 4.68.0+. We have 4.86.0. ✅

📘 **Official doc:** [Automatic project configuration](https://developers.cloudflare.com/workers/framework-guides/automatic-configuration/)

**Dry run first** (see what it would do without changing anything):
```bash
npx wrangler setup --dry-run
```

---

## Option 2: Dashboard-Only Setup (zero CLI)

### For AI Gateway (observability, caching, rate limits):

1. Log into [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. **AI** → **AI Gateway** → **Create Gateway** (or use `default`)
3. Toggle features in Settings:
   - ✅ Cache Responses
   - ✅ Rate Limiting
   - ✅ Spend Limits
   - ✅ Retries (up to 5 attempts)

**Zero code. Zero CLI. Click to configure.**

📘 **Official doc:** [AI Gateway get-started](https://developers.cloudflare.com/ai-gateway/get-started/) · [Manage gateway](https://developers.cloudflare.com/ai-gateway/configuration/manage-gateway/)

### For deploying from Git (Workers Builds):

1. Dashboard → **Workers & Pages** → **Create** → **Import a repository**
2. Select your GitHub/GitLab repo
3. Cloudflare auto-detects Next.js, creates a PR with config, deploys on every push

**Zero local CLI needed. Push to deploy.**

📘 **Official doc:** [Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/) · [Automatic PRs](https://developers.cloudflare.com/workers/ci-cd/builds/automatic-prs/)

---

## Option 3: Add AI to Our Existing App (3 lines)

**We already have Next.js on Cloudflare Workers.** Confirmed:
- ✅ `app/wrangler.jsonc` exists (38 lines, OpenNext configured)
- ✅ `app/open-next.config.ts` exists
- ✅ Wrangler 4.86.0 installed
- ✅ `nodejs_compat`, assets, images, observability all bound

**The entire AI setup is 3 changes:**

### Change 1: Add `ai` binding to `app/wrangler.jsonc`

```jsonc
{
  // ... existing config ...
  "ai": {
    "binding": "AI"
  }
}
```

### Change 2: Install one package

```bash
cd app && npm i workers-ai-provider
```

### Change 3: Use it

```ts
import { createWorkersAI } from "workers-ai-provider";
const model = createWorkersAI({ binding: env.AI })("@cf/meta/llama-4-scout-17b-16e-instruct");
```

**That's it.** Done. No migration tool needed because we're already set up.

📘 **Official docs:** [Workers AI binding](https://developers.cloudflare.com/workers-ai/configuration/bindings/) · [workers-ai-provider](https://www.npmjs.com/package/workers-ai-provider) · [Using AI Models in Agents](https://developers.cloudflare.com/agents/runtime/operations/using-ai-models/)

---

## Comparison: Which Option for Us?

| Option | When to use | Our status |
|--------|-------------|------------|
| **Option 1** — `migrate` or `wrangler setup` CLI | Greenfield Next.js app, no Cloudflare config yet | ❌ We already have it |
| **Option 2** — Dashboard only | Want observability without code changes | ✅ Use this for AI Gateway features |
| **Option 3** — Add `ai` binding to existing app | Already on Cloudflare Workers, just adding AI | ✅ **This is us — do this** |

---

## The Complete Picture

```
┌─────────────────────────────────────────────────────┐
│  OUR SITUATION                                       │
│                                                      │
│  ✅ Next.js app exists              (app/)           │
│  ✅ OpenNext configured             (wrangler.jsonc) │
│  ✅ Deployed to Workers             (ipix-operator)  │
│  ✅ Wrangler 4.86.0                 (CLI ready)      │
│  ❌ No `ai` binding                 ← ADD THIS       │
│  ❌ No `workers-ai-provider`        ← INSTALL THIS   │
│  ❌ Custom gateway Worker           ← DELETE THIS    │
│                                                      │
│  THREE ACTIONS:                                      │
│  1. Add `"ai": { "binding": "AI" }` to wrangler.jsonc│
│  2. `npm i workers-ai-provider`                      │
│  3. Delete services/cloudflare-worker/ (1,392 lines) │
│                                                      │
│  OPTIONAL (dashboard, no code):                      │
│  4. Create AI Gateway in dashboard                   │
│  5. Toggle caching, rate limits, spend limits        │
└─────────────────────────────────────────────────────┘
```

---

## Official Documentation — Quick Reference

### Setup CLIs

| Tool | Command | Doc |
|------|---------|-----|
| OpenNext migrate | `npx @opennextjs/cloudflare migrate` | [OpenNext get-started](https://opennext.js.org/cloudflare/get-started#existing-nextjs-apps) |
| Wrangler auto-setup | `npx wrangler setup` | [Automatic configuration](https://developers.cloudflare.com/workers/framework-guides/automatic-configuration/) |
| Wrangler dry-run | `npx wrangler setup --dry-run` | Same as above |
| Create from template | `npm create cloudflare@latest -- my-app --framework=next` | [Quickstarts](https://developers.cloudflare.com/workers/get-started/quickstarts/) |

### AI Setup

| Topic | Doc |
|-------|-----|
| Workers AI overview | https://developers.cloudflare.com/workers-ai/ |
| Add `ai` binding | https://developers.cloudflare.com/workers-ai/configuration/bindings/ |
| Workers AI get-started | https://developers.cloudflare.com/workers-ai/get-started/workers-wrangler/ |
| `workers-ai-provider` npm | https://www.npmjs.com/package/workers-ai-provider |
| Model catalog | https://developers.cloudflare.com/workers-ai/models/ |
| Using AI in Agents | https://developers.cloudflare.com/agents/runtime/operations/using-ai-models/ |

### AI Gateway (dashboard)

| Topic | Doc |
|-------|-----|
| Get-started | https://developers.cloudflare.com/ai-gateway/get-started/ |
| Create gateway | https://developers.cloudflare.com/ai-gateway/get-started/ |
| + Workers AI binding | https://developers.cloudflare.com/ai-gateway/integrations/aig-workers-ai-binding/ |
| Caching | https://developers.cloudflare.com/ai-gateway/features/caching/ |
| Rate limiting | https://developers.cloudflare.com/ai-gateway/features/rate-limiting/ |
| Spend limits | https://developers.cloudflare.com/ai-gateway/features/spend-limits/ |
| Dynamic routing (fallbacks) | https://developers.cloudflare.com/ai-gateway/features/dynamic-routing/ |
| Auto-retry (Apr 2026) | https://developers.cloudflare.com/changelog/post/2026-04-02-auto-retry-upstream-failures/ |

### Deployment

| Topic | Doc |
|-------|-----|
| Workers Builds (CI/CD) | https://developers.cloudflare.com/workers/ci-cd/builds/ |
| Import from Git | https://developers.cloudflare.com/workers/ci-cd/builds/configuration/ |
| OpenNext develop & deploy | https://opennext.js.org/cloudflare/howtos/dev-deploy |
| Environment variables | https://opennext.js.org/cloudflare/howtos/env-vars |
| Deploy command | https://developers.cloudflare.com/workers/wrangler/commands/general/#deploy |

---

## Bottom Line

**Stop opening PRs that patch the custom gateway.** Six PRs in, the pattern is clear: every fix creates new bugs because the architecture is wrong.

**The simplest path for us:**

```bash
# 1. Add the binding (one line in wrangler.jsonc)
# 2. Install the provider
cd app && npm i workers-ai-provider

# 3. Delete the custom gateway
git rm -r services/cloudflare-worker/

# 4. (Optional) Create AI Gateway in dashboard for observability

# 5. Deploy
npm run deploy
```

**5 minutes of work. 2,300 lines deleted. Done.**
