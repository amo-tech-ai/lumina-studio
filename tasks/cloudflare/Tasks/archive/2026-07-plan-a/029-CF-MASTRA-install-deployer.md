> **⚠️ ARCHIVED — DO NOT EXECUTE — HISTORICAL REFERENCE ONLY**
>
> Superseded 2026-07-14. Reason: assumes Mastra deploys as its own standalone Cloudflare Worker — confirmed false; Mastra stays in-process in the OpenNext Worker (IPI-486). Current plan: `tasks/cloudflare/Tasks/000-Architecture-Decision.md`, Linear IPI-487 (migration gate) and IPI-586/590/591/592/594 (active work).

---

---
title: "Task 25: Install Mastra Deployer for Cloudflare"
references:
  - title: "Mastra Deployment Guide"
    url: "https://mastra.ai/guides/deployment/cloudflare"
    topic: "Official Mastra deployer setup for Cloudflare Workers"
  - title: "Cloudflare Agents"
    url: "https://developers.cloudflare.com/agents/"
    topic: "Agent framework and capabilities on Cloudflare"
  - title: "Mastra on Cloudflare Blog"
    url: "https://blog.cloudflare.com/build-ai-agents-on-cloudflare/"
    topic: "Architecture overview and patterns"
  - title: "Mastra GitHub"
    url: "https://github.com/cloudflare/agents"
    topic: "Agents SDK and implementation examples"
---

# Task 25: Install Mastra Deployer for Cloudflare

**Phase:** 3 (Mastra Integration)  
**Complexity:** Low | **Time:** 10 min  
**Depends on:** Task 21 (packages installed)  
**Blocks:** 26, 27, 28

---

## Purpose

Enable Mastra framework deployment to Cloudflare Workers via the official `@mastra/deployer-cloudflare` package. This deployer auto-configures Wrangler and handles edge-specific runtime concerns.

---

## Goal

✅ Install Mastra deployer + required dependencies  
✅ Verify install via `npm list`  
✅ Understand edge-first architecture differences (ephemeral vs persistent state)

---

## User Journey

**Developer:** "We want to move Mastra agents from Vercel to Cloudflare edge, but Mastra needs its own deployment layer."

**Flow:**
1. Install deployer package
2. Verify no conflicts with existing OpenNext setup
3. Note ephemeral filesystem requirement
4. Plan external storage (KV for temp, D1 for state)

---

## Steps

### 1. Install Mastra Deployer
```bash
cd app
npm install @mastra/deployer-cloudflare
npm list @mastra/deployer-cloudflare  # Verify
```

**Why separate from OpenNext?** OpenNext handles Next.js routes (Server Components, API routes); Mastra deployer handles agent runtime (memory, tools, streaming). Both coexist in `wrangler.jsonc` via different handlers.

### 2. Check for version conflicts
```bash
npm list @mastra/core
npm list @cloudflare/workers-types
```

**If mismatch:** Record version + escalate to task 26 (we may need adapter code).

### 3. Read the architecture difference
- **Vercel:** Local filesystem, persistent disk, request isolation
- **Cloudflare Workers:** Ephemeral (each request is fresh), **NO** persistent local files
- **iPix solution:** Store Mastra state in Cloudflare KV (sessions, chat history)

---

## Verification

✅ Run:
```bash
npm list @mastra/deployer-cloudflare  # Should show package
grep -r "CloudflareDeployer" app/src/  # Check if imported anywhere (should be 0 for now)
```

✅ No errors from npm

✅ Record in app/package.json: `"@mastra/deployer-cloudflare": "^X.Y.Z"`

---

## Testing

**Smoke test:**
```bash
# Verify import works (no syntax errors yet, just import)
cat > /tmp/test-import.mjs << 'EOF'
import { CloudflareDeployer } from '@mastra/deployer-cloudflare'
console.log('✓ Deployer imported successfully')
EOF
node /tmp/test-import.mjs
```

**Expected:** `✓ Deployer imported successfully` (no 404, no version mismatch)

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| **@mastra/deployer-cloudflare not found** | Check npm registry; may be prerelease. Use `npm install @mastra/deployer-cloudflare@latest` |
| **Peer dependency conflict** | Note version in task 26 prompt; defer to task 26 if blockers |
| **Old @mastra/core version** | Task 26 will update if needed; don't update yet |

---

## Rollback

```bash
npm uninstall @mastra/deployer-cloudflare
git checkout package.json package-lock.json
```

Result: Back to OpenNext-only setup. Mastra still runs on Vercel.

---

## Real-world context

iPix has Mastra agents running on Vercel with in-memory tool state. Moving to Workers means:

- **Before:** Agent tool calls live in Vercel Lambda (stateful within 15min request window)
- **After:** Agent tool calls on Cloudflare edge (must store state externally)

This task prepares the deployer. Tasks 26–28 wire storage + auth + streaming.

---

## Next step

Task 26: Configure Mastra deployer in wrangler.jsonc

---

**Updated:** 2026-07-12  
**Status:** Ready to start
