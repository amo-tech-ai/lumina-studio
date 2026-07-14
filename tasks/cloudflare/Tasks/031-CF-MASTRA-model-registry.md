---
title: "Task 27: Configure Mastra Model Registry"
references:
  - title: "Mastra Models Documentation"
    url: "https://mastra.ai/models/providers/cloudflare-workers-ai"
    topic: "Register and configure models in Mastra"
  - title: "Cloudflare Workers AI Models"
    url: "https://developers.cloudflare.com/workers-ai/models/"
    topic: "Available models, capabilities, and pricing"
  - title: "Workers AI Setup with Wrangler"
    url: "https://developers.cloudflare.com/workers-ai/get-started/workers-wrangler/"
    topic: "Configure AI binding in wrangler.jsonc"
  - title: "Function Calling in Workers AI"
    url: "https://developers.cloudflare.com/workers-ai/features/function-calling/"
    topic: "Enable tool calling in models"
---

# Task 27: Configure Mastra Model Registry with Workers AI

**Phase:** 3 (Mastra Integration)  
**Complexity:** Medium | **Time:** 25 min  
**Depends on:** Tasks 21, 25, 26  
**Blocks:** 28

---

## Purpose

Register Cloudflare Workers AI models (Qwen, Mistral, BGE) in Mastra's model registry so agents can call `mastra.models['qwen-chat']` instead of hardcoding API calls. This enables provider abstraction + fallback routing.

---

## Goal

✅ Create `app/src/mastra/models.ts` with Workers AI provider config  
✅ Register `qwen-chat`, `mistral-large`, `bge-embed` models  
✅ Wire model registry into `mastra/index.ts`  
✅ Verify agent can call a model via registry (no direct API calls)

---

## User Journey

**iPix agent developer:** "I want agents to use Qwen via Workers AI, with Mistral fallback, but I don't want to hardcode the API shape in every agent."

**Flow:**
1. Create model registry with Workers AI provider
2. Agents call `mastra.models['qwen-chat'].generate()` (abstracted)
3. On Vercel: uses fallback (Gemini)
4. On Cloudflare: uses Workers AI binding
5. Mastra handles routing automatically

---

## Steps

### 1. Create app/src/mastra/models.ts

```typescript
import { Model } from '@mastra/core'
import { CloudflareWorkersAI } from '@mastra/ai'  // Mastra provider for Workers AI

export const qwenChat = new Model({
  name: 'qwen-chat',
  provider: 'cloudflare-workers-ai',
  model: '@cf/qwen/qwen1.5-7b-chat',
  config: {
    temperature: 0.7,
    maxTokens: 2048,
  },
})

export const mistralLarge = new Model({
  name: 'mistral-large',
  provider: 'cloudflare-workers-ai',
  model: '@cf/mistral/mistral-large-latest',
  config: {
    temperature: 0.5,
    maxTokens: 4096,
  },
})

export const bgeEmbed = new Model({
  name: 'bge-embed',
  provider: 'cloudflare-workers-ai',
  model: '@cf/baai/bge-base-en-v1.5',
  config: {
    dimensions: 768,
  },
})

export const models = {
  'qwen-chat': qwenChat,
  'mistral-large': mistralLarge,
  'bge-embed': bgeEmbed,
}
```

**Note:** Replace with actual Mastra v0.6+ syntax if different (check `package.json` version).

### 2. Update app/src/mastra/index.ts

Add model registry:

```typescript
import { Mastra } from '@mastra/core'
import { CloudflareDeployer } from '@mastra/deployer-cloudflare'
import { models } from './models'

export const mastra = new Mastra({
  name: 'ipix-operator',
  deployer: new CloudflareDeployer({
    name: 'ipix-operator',
    vars: {
      NODE_ENV: process.env.ENVIRONMENT || 'development',
      MASTRA_KV_NAMESPACE: process.env.MASTRA_KV_NAMESPACE,
    },
  }),
  models,  // ← Add this
})

export { agents } from './agents/index'
```

### 3. Verify models are registered

```bash
cd app
npm run typecheck  # TypeScript should not error
```

### 4. Create a simple agent to test registry access

Create `app/src/mastra/agents/test-registry.ts`:

```typescript
import { Agent } from '@mastra/core'
import { mastra } from '../index'

export const testRegistryAgent = new Agent({
  name: 'test-registry',
  model: mastra.models['qwen-chat'],  // ← Uses registry
  instructions: 'You are a helpful test agent.',
})
```

---

## Verification

✅ TypeScript compiles:
```bash
npm run typecheck
```

✅ No model import errors:
```bash
grep -r "models\[" app/src/mastra/
```

✅ Registry is used (not hardcoded API calls):
```bash
grep -r "@cf/qwen" app/src/mastra/  # Should only appear in models.ts
```

---

## Testing (Local)

### Unit: Verify model names are registered

```bash
cat > /tmp/test-models.mjs << 'EOF'
import { execSync } from 'child_process'
const output = execSync('cd app && npm run typecheck 2>&1').toString()
if (output.includes('error')) {
  console.error('❌ TypeScript errors:', output)
  process.exit(1)
} else {
  console.log('✅ Model registry compiles')
}
EOF
node /tmp/test-models.mjs
```

### Integration: Test agent can call model

(Deferred to task 28 with auth + local preview)

In task 28's preview:
```bash
curl -X POST http://localhost:8787/api/agents/test-registry \
  -H 'Content-Type: application/json' \
  -d '{"messages":[{"role":"user","content":"Hello"}]}'
```

**Expected:** Agent calls Qwen via Workers AI, returns response (not 401, not error about model not found)

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| **Import `@mastra/ai` not found** | May need separate package. Check `node_modules` or Mastra docs for correct import |
| **`mastra.models` undefined** | Ensure `models` is passed to `Mastra()` constructor in index.ts |
| **Model name typo** | `mastra.models['qwen-chat']` is case-sensitive; check agents/test-registry.ts |
| **Worker AI binding missing in runtime** | Expected; task 26 added binding. If still missing, check wrangler.jsonc `bindings` array |

---

## Real-world context

**Before:**
```typescript
// Inside an agent tool
const response = await fetch('https://api.cloudflare.com/...');
// Hardcoded API, hard to test, hard to swap providers
```

**After:**
```typescript
// Inside an agent
const response = await mastra.models['qwen-chat'].generate(messages);
// Abstracted. Same code works on Vercel (falls back to Gemini) and Cloudflare (uses Workers AI)
```

This abstraction makes agents portable across runtimes.

---

## Rollback

```bash
rm app/src/mastra/models.ts
git checkout app/src/mastra/index.ts
npm run typecheck  # Should pass again (models removed)
```

---

## Next step

Task 28: Implement agent auth + KV state persistence

---

**Updated:** 2026-07-12  
**Status:** Ready to start
