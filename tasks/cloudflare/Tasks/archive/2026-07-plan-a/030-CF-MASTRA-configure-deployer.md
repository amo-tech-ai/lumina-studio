> **⚠️ ARCHIVED — DO NOT EXECUTE — HISTORICAL REFERENCE ONLY**
>
> Superseded 2026-07-14. Reason: assumes Mastra deploys as its own standalone Cloudflare Worker — confirmed false; Mastra stays in-process in the OpenNext Worker (IPI-486). Current plan: `tasks/cloudflare/Tasks/000-Architecture-Decision.md`, Linear IPI-487 (migration gate) and IPI-586/590/591/592/594 (active work).

---

---
title: "Task 26: Configure Mastra Deployer + KV"
references:
  - title: "Cloudflare KV"
    url: "https://developers.cloudflare.com/kv/"
    topic: "Low-latency data storage for agent state"
  - title: "Wrangler Configuration Bindings"
    url: "https://developers.cloudflare.com/workers/wrangler/configuration/"
    topic: "Configure KV namespace bindings"
  - title: "Mastra Deployment"
    url: "https://mastra.ai/guides/deployment/cloudflare"
    topic: "Wire deployer into wrangler.jsonc"
  - title: "Environment Variables"
    url: "https://developers.cloudflare.com/workers/configuration/environment-variables/"
    topic: "Configure per-environment settings"
---

# Task 26: Configure Mastra Deployer in wrangler.jsonc

**Phase:** 3 (Mastra Integration)  
**Complexity:** Medium | **Time:** 20 min  
**Depends on:** Tasks 21, 22, 25  
**Blocks:** 27, 28

---

## Purpose

Wire Mastra deployer into `wrangler.jsonc` so that `npm run build` generates both OpenNext (Next.js) and Mastra (agents) handlers in the Worker bundle. Enable KV binding for persistent agent state.

---

## Goal

✅ Extend wrangler.jsonc with Mastra deployer config  
✅ Add KV binding for Mastra state storage  
✅ Verify config is valid (no conflicts with OpenNext bindings)  
✅ Understand routing: OpenNext handles `/api/*`, Mastra handles `/api/agents/*`

---

## User Journey

**iPix backend:** "Our agents need to persist memory across requests. Mastra on Vercel uses in-memory Redis; Cloudflare has no in-memory store, so we need KV."

**Flow:**
1. Add Mastra deployer config to wrangler.jsonc
2. Add KV namespace binding (`MASTRA_KV`)
3. Update environment vars for agent provider (Workers AI)
4. Test that both Next.js and agent handlers coexist

---

## Steps

### 1. Extend wrangler.jsonc

Open `wrangler.jsonc` (from task 22) and add Mastra config:

```jsonc
{
  "name": "ipix-operator",
  "main": ".open-next/worker.js",
  "compatibility_date": "2026-07-12",
  "compatibility_flags": ["nodejs_compat"],
  
  "bindings": [
    { "binding": "AI", "type": "ai" },
    {
      "binding": "MASTRA_KV",
      "type": "kv_namespace",
      "id": "YOUR_KV_NAMESPACE_ID"  // Will get from task 28
    }
  ],
  
  // ← ADD THIS SECTION:
  "env": {
    "production": {
      "vars": {
        "PRIMARY_MODEL": "@cf/qwen/qwen1.5-7b-chat",
        "EMBEDDING_MODEL": "@cf/baai/bge-base-en-v1.5",
        "ENVIRONMENT": "production",
        "MASTRA_KV_NAMESPACE": "MASTRA_KV"
      },
      "secrets": [
        "GEMINI_API_KEY",
        "MASTRA_API_KEY"  // For agent auth (task 28)
      ]
    }
  }
}
```

### 2. Update app/src/mastra/index.ts

This file already exists (from prior setup). Extend it to use Cloudflare deployer:

```typescript
import { Mastra } from '@mastra/core'
import { CloudflareDeployer } from '@mastra/deployer-cloudflare'

export const mastra = new Mastra({
  name: 'ipix-operator',
  deployer: new CloudflareDeployer({
    name: 'ipix-operator',
    vars: {
      NODE_ENV: process.env.ENVIRONMENT || 'development',
      MASTRA_KV_NAMESPACE: process.env.MASTRA_KV_NAMESPACE,
    },
  }),
})

// Export agents (example; update as needed)
export { agents } from './agents/index'
```

### 3. Create KV namespace for Mastra

Run in root (not yet deployed, just local):

```bash
# Create local KV for preview (Wrangler does this automatically)
# We'll bind it to production KV in task 28
# For now, just note the binding name: MASTRA_KV
```

### 4. Verify wrangler config is valid

```bash
cd app
npx wrangler publish --dry-run  # Should compile without errors
```

**Expected output:**
```
Validating configuration...
✓ Configuration valid
✓ Dry-run complete
```

---

## Verification

✅ `wrangler.jsonc` is valid JSON/JSONC (no parse errors)

✅ Run:
```bash
npx wrangler publish --dry-run 2>&1 | grep -i "valid\|error"
```

✅ Output shows `Configuration valid` or lists only missing secrets (OK for now)

✅ Both bindings present:
```bash
grep -A5 '"bindings"' wrangler.jsonc
```
Should show: `AI` binding + `MASTRA_KV` binding

---

## Testing

**Local wrangler preview:**
```bash
npm run build  # Both OpenNext + Mastra build
npx wrangler dev  # Start local Workers runtime
```

**In another terminal:**
```bash
# Test OpenNext route (Next.js)
curl http://localhost:8787/health

# Test Mastra route (agent endpoint)
curl http://localhost:8787/api/agents/health  # May return 401 until auth is wired (task 28)
```

**Expected:**
- `/health` → 200 ✓
- `/api/agents/health` → 401 or 200 (depending on auth)

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| **JSONC parse error in wrangler.jsonc** | Remove trailing commas; check quotes |
| **KV namespace ID not found** | Leave as placeholder `"YOUR_KV_NAMESPACE_ID"`; task 28 fills it in |
| **Mastra deployer not recognized** | Ensure task 25 `npm install` succeeded |
| **Dry-run fails with "secret not found"** | Expected; secrets are optional for dry-run. Proceed. |

---

## Real-world context

**Route separation:**

```
Request → Cloudflare Workers
  ├─ /health → OpenNext → Next.js
  ├─ /api/chat → OpenNext → API route → delegates to Mastra
  └─ /api/agents/* → Mastra deployer → Agents runtime
```

Mastra deployer auto-generates the agent endpoint handler. OpenNext continues to handle Next.js routes. KV stores agent memory between requests.

---

## Rollback

```bash
# Revert wrangler.jsonc to OpenNext-only
git checkout wrangler.jsonc
```

Result: Only Next.js routes work; agent endpoints return 404.

---

## Next step

Task 27: Configure Mastra model registry with Workers AI

---

**Updated:** 2026-07-12  
**Status:** Ready to start
