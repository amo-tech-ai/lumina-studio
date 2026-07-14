---
title: "Task 24: Update package.json Scripts"
references:
  - title: "Wrangler dev command"
    url: "https://developers.cloudflare.com/workers/wrangler/commands/dev"
    topic: "Local development and testing"
  - title: "Wrangler deploy command"
    url: "https://developers.cloudflare.com/workers/wrangler/commands/deploy"
    topic: "Deployment to production"
  - title: "Workers CI/CD"
    url: "https://developers.cloudflare.com/workers/ci-cd/"
    topic: "GitHub Actions and deployment workflows"
---

# CF-NEXTJS-004 — Update package.json with Build & Deploy Scripts

**Status:** 🟡 Ready to start  
**Effort:** 10 minutes  
**Dependency:** 015, 016, 017 (all prior configs)  
**Enables:** Build and deploy to Cloudflare

---

## Purpose

Add npm scripts to `package.json` that automate:
1. **`build`** — Build for BOTH Vercel AND Cloudflare
2. **`preview`** — Test locally on Cloudflare runtime
3. **`deploy`** — Deploy to Cloudflare Workers
4. **`cf-typegen`** — Generate TypeScript types for Cloudflare

## Real-World Context

iPix currently uses:
```bash
npm run build  # Builds for Vercel only → .next/
npm run dev    # Runs on Vercel dev server
npm run deploy # Only Vercel has this
```

After this task:
```bash
npm run build  # Builds for BOTH Vercel AND Cloudflare → .next/ + .open-next/
npm run preview # Test on local Cloudflare runtime
npm run deploy # NEW: Deploy to Cloudflare Workers
```

## Goal

Enable iPix to build and deploy to Cloudflare in one command, while keeping Vercel deployment unchanged.

---

## Success Criteria

✅ **Scripts added to package.json:**
- `build` script exists and runs OpenNext build
- `preview` script exists for local testing
- `deploy` script exists for Cloudflare deployment
- `cf-typegen` script exists for TypeScript types

✅ **Scripts work:**
- `npm run build` succeeds (creates .open-next/)
- `npm run preview` starts local server
- `npm run deploy` deploys to Cloudflare
- All existing scripts still work

✅ **No breaking changes:**
- `npm run dev` still works (Vercel dev server)
- `npm run lint` still works
- `npm test` still works
- Vercel deployment still works

---

## Step-by-Step Instructions

### Step 1: Locate package.json

**Find the scripts section:**

```bash
cd /home/sk/ipix
cat package.json | head -50
# Look for "scripts": { ... }
```

**You should see something like:**

```json
{
  "name": "ipix-operator",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "test": "vitest"
  },
  ...
}
```

### Step 2: Update Build Script

**Find the existing `"build"` line:**

```json
"build": "next build",
```

**Replace it with:**

```json
"build": "next build && opennextjs-cloudflare build",
```

**What changed:**
- **Before:** `next build` (Vercel only)
- **After:** `next build && opennextjs-cloudflare build` (Vercel + Cloudflare)

This runs both builds sequentially:
1. First: `next build` → creates `.next/` for Vercel
2. Second: `opennextjs-cloudflare build` → creates `.open-next/` for Cloudflare

### Step 3: Add Three New Scripts

**After the `build` line, add these lines:**

```json
"preview": "opennextjs-cloudflare build && opennextjs-cloudflare preview",
"deploy": "opennextjs-cloudflare build && opennextjs-cloudflare deploy",
"cf-typegen": "wrangler types --env-interface CloudflareEnv cloudflare-env.d.ts",
```

**What each does:**

| Script | Command | Purpose |
|--------|---------|---------|
| `build` | `next build && opennextjs-cloudflare build` | Build for both Vercel and Cloudflare |
| `preview` | `opennextjs-cloudflare build && opennextjs-cloudflare preview` | Test locally before deploying |
| `deploy` | `opennextjs-cloudflare build && opennextjs-cloudflare deploy` | Deploy to Cloudflare Workers |
| `cf-typegen` | `wrangler types ...` | Generate TypeScript types for Worker env |

### Step 4: Final package.json scripts

**Your scripts section should now look like:**

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build && opennextjs-cloudflare build",
    "start": "next start",
    "preview": "opennextjs-cloudflare build && opennextjs-cloudflare preview",
    "deploy": "opennextjs-cloudflare build && opennextjs-cloudflare deploy",
    "cf-typegen": "wrangler types --env-interface CloudflareEnv cloudflare-env.d.ts",
    "lint": "eslint .",
    "test": "vitest"
  }
}
```

### Step 5: Verify JSON Syntax

```bash
# Check JSON is valid
node -e "console.log(JSON.stringify(require('./package.json').scripts, null, 2))"

# Expected output: Your scripts in valid JSON format
# If error: SyntaxError in package.json (check commas, quotes)
```

---

## Real-World User Journey

### Scenario: iPix DevOps Engineer Deploying to Cloudflare

**Goal:** Add one-command build and deploy

**Journey:**
1. ✅ "I've installed dependencies"
2. ✅ "I've created wrangler.jsonc and open-next.config.ts"
3. ✅ "Now I update package.json scripts"
4. ✅ "Run `npm run build`" → Both build targets succeed
5. ✅ "Run `npm run preview`" → Test locally
6. ✅ "Run `npm run deploy`" → Live on Cloudflare

**Success moment:** "Single command deploys to Workers"

---

## Testing & Verification

### Step 1: Syntax Check

```bash
# Verify JSON syntax
npx json-parse-better-errors package.json
# Expected: Valid JSON
# If error: Shows line number of JSON syntax problem
```

### Step 2: List Scripts

```bash
# Show all available scripts
npm run
# Expected output:
# npm run build          # Build for Vercel + Cloudflare
# npm run preview        # Test locally
# npm run deploy         # Deploy to Cloudflare
# npm run cf-typegen     # Generate types
# npm run dev            # (existing)
# npm run lint           # (existing)
# npm run test           # (existing)
```

### Step 3: Test Build

```bash
# Test that build script works (doesn't fully deploy yet)
npm run build
# Expected output:
# > next build
# ✓ Build complete
# > opennextjs-cloudflare build
# ✓ Built for Cloudflare
# 
# Output directories created:
# .next/                 ← For Vercel
# .open-next/            ← For Cloudflare
```

### Step 4: Test Existing Scripts

```bash
# Verify existing scripts still work
npm run lint
# Expected: Linter runs (may have warnings, but runs)

npm run test
# Expected: Tests run
```

---

## Script Explanation

### The `build` Script

```bash
npm run build
```

**Does:**
1. Run `next build` → creates `.next/`
2. Then run `opennextjs-cloudflare build` → creates `.open-next/`

**Result:** Both output directories ready
- **Vercel deployment:** Uses `.next/`
- **Cloudflare deployment:** Uses `.open-next/`

### The `preview` Script

```bash
npm run preview
```

**Does:**
1. Build OpenNext adapter
2. Start local Cloudflare runtime emulation
3. Opens http://localhost:8787 with your app

**Use case:** Test app exactly as it runs on Cloudflare before deploying

### The `deploy` Script

```bash
npm run deploy
```

**Does:**
1. Build OpenNext adapter
2. Deploy `.open-next/` to Cloudflare Workers
3. App live at `https://ipix-operator.<account>.workers.dev`

**One-command deploy** (similar to Vercel's `git push`)

### The `cf-typegen` Script

```bash
npm run cf-typegen
```

**Does:**
1. Generate TypeScript types for Cloudflare environment
2. Creates `cloudflare-env.d.ts`

**Use case:** TypeScript autocomplete for `env` parameter in Worker code

---

## Before & After

### Before (Vercel only)

```bash
# Only way to deploy
git push origin main  # Auto-deploys to Vercel

# No Cloudflare support
npm run deploy  # (doesn't exist or does Vercel)
```

### After (Vercel + Cloudflare)

```bash
# Vercel deployment (unchanged)
git push origin main  # Auto-deploys to Vercel

# Cloudflare deployment (new)
npm run build      # Build for both
npm run preview    # Test locally
npm run deploy     # Deploy to Workers
```

---

## File Structure

**After all tasks complete:**

```
/home/sk/ipix/
├── wrangler.jsonc              ← Task 016
├── open-next.config.ts         ← Task 017
├── package.json                ← ← UPDATED THIS TASK
├── cloudflare-env.d.ts         ← Created by cf-typegen (optional)
├── .next/                       ← Created by `npm run build` (Vercel)
├── .open-next/                 ← Created by `npm run build` (Cloudflare)
│   ├── worker.js               ← Main entry point
│   ├── assets/                 ← Static files
│   └── server-functions/       ← API routes
├── app/                        ← Your Next.js code
└── ... (other files)
```

---

## Common Mistakes

| Mistake | Symptom | Fix |
|---------|---------|-----|
| Missing comma after `build` | JSON parse error | Add comma: `"build": "...",` |
| Wrong command name | `opennext-cloudflare: command not found` | Should be `opennextjs-cloudflare` (no hyphen) |
| Not updating build script | OpenNext never runs | Change `"next build"` to `"next build && opennextjs-cloudflare build"` |
| Extra spaces | `npm run build` hangs | Remove extra spaces in command |
| Missing npm packages | Command not found | Verify task 015 completed (installed packages) |

---

## Troubleshooting

### "command not found: opennextjs-cloudflare"

```bash
# Problem: Package not installed
# Solution: Reinstall
npm i -D @opennextjs/cloudflare@latest
npm i -D wrangler@latest
```

### "Cannot find wrangler"

```bash
# Problem: Wrangler not installed
# Solution: Reinstall
npm i -D wrangler@latest
npm list wrangler  # Verify installed
```

### Build fails with TypeScript error

```bash
# Problem: open-next.config.ts has type error
# Solution: Check TypeScript
npx tsc --noEmit open-next.config.ts
# Fix any errors shown
```

---

## Next Steps After This Task

### Immediate (same day):

```bash
# Verify everything works
npm run build
# Watch for errors, make sure both builds succeed
```

### Next Task (019):

→ `019-CF-NEXTJS-test-local-preview.md`

Test the app locally on Cloudflare runtime before deploying.

### Then Deploy:

→ `020-CF-NEXTJS-deploy-production.md`

Deploy to production Cloudflare Workers.

---

## References

- **OpenNext Docs:** https://opennext.js.org/cloudflare
- **Wrangler Docs:** https://developers.cloudflare.com/workers/wrangler/
- **NPM Scripts Guide:** https://docs.npmjs.com/cli/v8/using-npm/scripts

---

## Time Estimate

- **Backup package.json:** 1 minute
- **Update build script:** 2 minutes
- **Add new scripts:** 3 minutes
- **Verify JSON syntax:** 2 minutes
- **Test scripts:** 2 minutes
- **Total:** ~10 minutes

---

## Rollback

If you need to undo:

```bash
# Restore original build script
# Change back from:
"build": "next build && opennextjs-cloudflare build"
# To:
"build": "next build"

# Remove new scripts:
# Delete: "preview", "deploy", "cf-typegen" lines

# Your app is back to Vercel-only setup
```

---

## Done Checklist

- [ ] package.json backup created (optional but recommended)
- [ ] `build` script updated to include OpenNext
- [ ] `preview` script added
- [ ] `deploy` script added
- [ ] `cf-typegen` script added
- [ ] JSON syntax is valid (no errors)
- [ ] `npm run build` succeeds without errors
- [ ] Existing scripts still work (`npm run dev`, `npm run lint`, etc.)
- [ ] Ready for next task (local preview testing)
