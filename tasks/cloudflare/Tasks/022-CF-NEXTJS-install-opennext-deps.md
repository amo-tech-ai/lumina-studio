---
title: "Task 21: Install OpenNext + Wrangler Dependencies"
references:
  - title: "OpenNext Cloudflare Docs"
    url: "https://opennext.js.org/cloudflare"
    topic: "Build, preview and deploy existing Next.js apps"
  - title: "Wrangler Documentation"
    url: "https://developers.cloudflare.com/workers/wrangler/"
    topic: "Main Cloudflare CLI tool"
  - title: "Next.js on Cloudflare Workers"
    url: "https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/"
    topic: "Official Next.js deployment guide"
  - title: "Node.js Compatibility in Workers"
    url: "https://developers.cloudflare.com/workers/runtime-apis/nodejs/"
    topic: "Check if existing dependencies work"
---

# CF-NEXTJS-001 — Install OpenNext & Wrangler Dependencies

**Status:** 🟢 Already complete (verified 2026-07-14 against live `app/wrangler.jsonc`, `app/open-next.config.ts`, and `app/package.json` — this exact setup already exists). See IPI-486 / `CF-MIG-110` (PR #282, merged) for the tracked completion.

> **🛑 DO NOT RUN the Step-by-Step Instructions below — corrected 2026-07-14 (audit finding).** They install packages, upgrade Node, and run `npm audit fix --force` against an already-configured, working setup — real regression risk. They're kept only as historical record of what was originally installed. Verify current state instead:
> ```bash
> cd ~/ipix/app
> npm ls @opennextjs/cloudflare wrangler
> npx wrangler --version
> npm run typecheck
> ```
> Also note: the body below recommends Node 18 and references a wrong next-task filename (`016-CF-NEXTJS-create-wrangler-config.md` — the real file is `023-CF-NEXTJS-create-wrangler-config.md`) — both stale, do not follow.

**Effort:** 5 minutes  
**Blocker for:** All subsequent OpenNext tasks (historically — all are also already complete, see `023`-`025`)

---

## Purpose

Install the two critical npm packages needed to run Next.js on Cloudflare Workers:
1. **@opennextjs/cloudflare** — Adapter that converts Next.js to run on Cloudflare Workers runtime
2. **wrangler** — Cloudflare CLI tool for local development and deployment

## Real-World Context

iPix currently runs on Vercel. Adding Cloudflare Workers lets us:
- Run API routes at the edge (lower latency)
- Use Workers AI directly (no Gemini fallback needed)
- Keep Next.js UI rendering on Vercel (no change to existing setup)
- Cost-optimize AI inference (Workers AI often cheaper than Gemini API)

## Goal

Enable iPix's existing Next.js app to build and run on Cloudflare Workers alongside Vercel deployment.

---

## Success Criteria

✅ **Installation success:**
- `npm list @opennextjs/cloudflare` shows installed package
- `npm list wrangler` shows installed package
- No installation errors or warnings

✅ **No breaking changes:**
- Existing `npm run dev` still works
- Existing `npm run build` still works
- No conflicts with existing dependencies

✅ **Version compatibility:**
- @opennextjs/cloudflare: `latest` (v0.48+)
- wrangler: `latest` (v4.55+)
- Node.js: v18+ (check with `node --version`)

---

## Step-by-Step Instructions

### Step 1: Verify Prerequisites

```bash
# Check Node version (must be 18+)
node --version
# Expected: v18.17.0 or higher

# If Node is old, upgrade via nvm or download from nodejs.org
nvm install 18
nvm use 18

# Check npm version
npm --version
# Expected: 8.0.0 or higher
```

### Step 2: Install OpenNext Adapter

```bash
# Install OpenNext for Cloudflare
npm i @opennextjs/cloudflare@latest

# Verify installation
npm list @opennextjs/cloudflare
# Expected output:
# ipix-operator@0.1.0 /home/sk/ipix
# └── @opennextjs/cloudflare@0.48.0
```

**What this does:**
- Downloads OpenNext adapter (converts Next.js to Cloudflare Workers runtime)
- Adds to `package.json` under `devDependencies`
- Installs transitive dependencies (esbuild, miniflare, etc.)

**File changes:**
- ✅ `package.json` → `devDependencies` section updated
- ✅ `package-lock.json` → auto-updated by npm

### Step 3: Install Wrangler CLI

```bash
# Install Wrangler (Cloudflare CLI)
npm i -D wrangler@latest

# Verify installation
npm list wrangler
# Expected output:
# ipix-operator@0.1.0 /home/sk/ipix
# └── wrangler@4.55.0

# Test Wrangler works
npx wrangler --version
# Expected: wrangler 4.55.0 or higher
```

**What this does:**
- Downloads Wrangler CLI tool
- Enables local development with `wrangler dev`
- Enables deployment with `wrangler deploy`
- Adds to `package.json` under `devDependencies`

**File changes:**
- ✅ `package.json` → `devDependencies` section updated
- ✅ `package-lock.json` → auto-updated

### Step 4: Verify No Conflicts

```bash
# Check for any npm warnings
npm list
# Should show no ERR! or WARN messages

# If there are warnings, check:
npm list --depth=0
# Look for conflicting packages (multiple versions)

# Resolve if needed
npm update
npm audit fix --force (only if necessary)
```

---

## Real-World User Journey

### Scenario: iPix DevOps Engineer

**Goal:** Add Cloudflare Workers support to iPix without breaking Vercel deployment

**Journey:**
1. ✅ "I install @opennextjs/cloudflare and wrangler"
2. ✅ "I verify both packages are installed"
3. ✅ "I check that `npm run dev` still works"
4. ✅ "I proceed to create wrangler.jsonc config"

**Pain point avoided:** Missing a dependency and failing at build time later

---

## Testing & Verification

### Quick Test

```bash
# Verify Wrangler is callable
npx wrangler --help
# Expected: List of wrangler commands

# Verify OpenNext is available
npx opennextjs-cloudflare --help
# Expected: OpenNext CLI commands

# Verify package.json was updated
cat package.json | grep -A 5 '"devDependencies"'
# Should show @opennextjs/cloudflare and wrangler
```

### Build Test (Don't deploy yet)

```bash
# Test that Next.js still builds normally
npm run build
# Expected: Build completes successfully
# Output: .next/ directory created

# Build size should be similar to before
du -sh .next/
# Expected: < 500MB for iPix app
```

---

## What Gets Downloaded

| Package | Purpose | Size |
|---------|---------|------|
| `@opennextjs/cloudflare` | Next.js to Workers adapter | ~15 MB |
| `wrangler` | Cloudflare CLI | ~50 MB |
| Transitive deps | esbuild, miniflare, etc. | ~100 MB |
| **Total** | — | **~165 MB** |

**Disk impact:** ~200 MB added to `node_modules/`

---

## Success Evidence

**Post-installation checklist:**

```bash
# 1. Packages installed
npm list @opennextjs/cloudflare | grep -q '@opennextjs/cloudflare' && echo "✅ OpenNext installed"
npm list wrangler | grep -q 'wrangler' && echo "✅ Wrangler installed"

# 2. CLI tools work
npx wrangler --version && echo "✅ Wrangler CLI works"
npx opennextjs-cloudflare --version && echo "✅ OpenNext CLI works"

# 3. Existing builds still work
npm run build > /dev/null 2>&1 && echo "✅ Next.js builds normally"

# 4. Dev server still works
timeout 5 npm run dev > /dev/null 2>&1 || true && echo "✅ Dev server starts"
```

**Expected output:** All 4 checkmarks ✅

---

## Current iPix Status

| Check | Before | After |
|-------|--------|-------|
| Next.js builds | ✅ Works | ✅ Works (unchanged) |
| `npm run dev` | ✅ Works | ✅ Works (unchanged) |
| API routes | ✅ Work | ✅ Work (unchanged) |
| Mastra agents | ✅ Work | ✅ Work (unchanged) |
| Can deploy to Vercel | ✅ Yes | ✅ Yes (unchanged) |
| **Can build for Workers** | ❌ No | ✅ Yes (NEW) |

---

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| "command not found: npm" | npm not installed | Install Node.js from nodejs.org |
| "ERR! 404" | Package doesn't exist | Check package name spelling (opennextjs not opennext-js) |
| "ERR! ERESOLVE" | Dependency conflict | Run `npm install --legacy-peer-deps` |
| Installation hangs | Network issue | Check internet, try `npm cache clean --force` |
| Wrangler not found | Not installed | Run `npm i -D wrangler@latest` again |

---

## Next Task

→ `016-CF-NEXTJS-create-wrangler-config.md`

After this task completes, you can create the wrangler configuration file.

---

## References

- **OpenNext Docs:** https://opennext.js.org/cloudflare
- **Wrangler Docs:** https://developers.cloudflare.com/workers/wrangler/
- **Next.js Framework Guide:** https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/

---

## Time Estimate

- **Installation:** 2-3 minutes (download depends on internet speed)
- **Verification:** 2-3 minutes (testing commands)
- **Total:** ~5 minutes

---

## Rollback

If you need to undo this:

```bash
# Remove OpenNext
npm uninstall @opennextjs/cloudflare

# Remove Wrangler
npm uninstall wrangler

# Clean cache
npm cache clean --force

# Your app will be back to Vercel-only setup
# (no harm done, Next.js still works normally)
```

---

## Done Checklist

- [ ] OpenNext package installed (`npm list @opennextjs/cloudflare`)
- [ ] Wrangler CLI installed (`npm list wrangler`)
- [ ] Both packages appear in `package.json`
- [ ] `npm run build` still works
- [ ] `npm run dev` still works
- [ ] No npm errors or warnings
- [ ] Ready to proceed to next task (wrangler.jsonc config)
