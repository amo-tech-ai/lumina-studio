---
title: "Task 22: Create Wrangler Configuration"
references:
  - title: "Wrangler Configuration"
    url: "https://developers.cloudflare.com/workers/wrangler/configuration/"
    topic: "wrangler.jsonc, bindings, environments and routes"
  - title: "Wrangler Commands"
    url: "https://developers.cloudflare.com/workers/wrangler/commands/"
    topic: "Deploy, dev, and configuration commands"
  - title: "Environment Variables in Workers"
    url: "https://developers.cloudflare.com/workers/configuration/environment-variables/"
    topic: "Variables and environment separation"
  - title: "Secrets in Workers"
    url: "https://developers.cloudflare.com/workers/configuration/secrets/"
    topic: "Secure credentials management"
---

# CF-NEXTJS-002 — Create Wrangler Configuration File

**Status:** 🟢 Already complete (verified 2026-07-14 against live `app/wrangler.jsonc`, `app/open-next.config.ts`, and `app/package.json` — this exact setup already exists). See IPI-486 / `CF-MIG-110` (PR #282, merged) for the tracked completion.

> **🛑 DO NOT RUN the steps below — corrected 2026-07-14 (audit finding).** `app/wrangler.jsonc` already exists and is correct; the body below instructs creating a second config, possibly at the wrong path, and describes deleting the file as harmless when deployment depends on it. Kept as historical record only. Verify current state instead:
> ```bash
> cd ~/ipix/app
> cat wrangler.jsonc | head -20
> npx wrangler types
> ```

**Effort:** 10 minutes  
**Dependency:** 015 (OpenNext deps installed)  
**Enables:** Local development with `wrangler dev`

---

## Purpose

Create `wrangler.jsonc` configuration file that tells Wrangler how to:
- Build your Next.js app for Cloudflare Workers
- Serve static assets from Cloudflare's edge network
- Configure compatibility settings for Node.js APIs
- Enable observability (logging)

## Real-World Context

iPix needs this config to:
- Tell Wrangler where the built app is (`.open-next/worker.js`)
- Enable Node.js compatibility (iPix uses node APIs)
- Serve static assets (images, CSS, JS bundles)
- Work with Cloudflare Workers runtime

## Goal

Create a production-ready wrangler configuration that matches iPix's existing Next.js setup.

---

## Success Criteria

✅ **File created:**
- `wrangler.jsonc` exists in project root
- Valid JSON syntax (no parse errors)

✅ **Configuration complete:**
- Worker name set to `ipix-operator`
- Main entry point: `.open-next/worker.js`
- Compatibility flags enabled: `nodejs_compat`
- Assets directory configured: `.open-next/assets`
- Observability enabled: `true`

✅ **Validation:**
- `wrangler deploy --dry-run` succeeds (no errors)
- File can be parsed by Wrangler CLI

---

## Step-by-Step Instructions

### Step 1: Create wrangler.jsonc File

**Navigate to project root:**

```bash
cd /home/sk/ipix
# Confirm you're in the right place
ls -la | grep "package.json"
# Should show: -rw-r--r-- ... package.json
```

**Create empty wrangler.jsonc:**

```bash
touch wrangler.jsonc
# File created at: /home/sk/ipix/wrangler.jsonc
```

### Step 2: Add Wrangler Configuration

**Open `wrangler.jsonc` and paste:**

```jsonc
{
  // Project metadata
  "name": "ipix-operator",
  "main": ".open-next/worker.js",
  
  // Runtime compatibility
  "compatibility_date": "2026-07-12",
  "compatibility_flags": ["nodejs_compat"],
  
  // Enable observability (logging)
  "observability": {
    "enabled": true
  },
  
  // Static assets (CSS, JS, images)
  "assets": {
    "directory": ".open-next/assets",
    "binding": "ASSETS"
  },
  
  // Environments (production vs staging)
  "env": {
    "production": {
      "route": "ipix-operator.example.workers.dev/*",
      "vars": {
        "ENVIRONMENT": "production"
      }
    },
    "staging": {
      "route": "ipix-operator-staging.example.workers.dev/*",
      "vars": {
        "ENVIRONMENT": "staging"
      }
    }
  }
}
```

### Step 3: Explain Each Section

| Section | What It Does | Why iPix Needs It |
|---------|--------------|-------------------|
| `name: "ipix-operator"` | Identifies your Worker | Cloudflare dashboard shows this name |
| `main: ".open-next/worker.js"` | Entry point after build | OpenNext creates this file during build |
| `compatibility_date: "2026-07-12"` | Cloudflare API version | Ensures consistent behavior |
| `compatibility_flags: ["nodejs_compat"]` | Enable Node.js APIs | iPix uses `node:fs`, `node:path`, etc. |
| `observability.enabled: true` | Enable real-time logs | See errors in dashboard |
| `assets.directory: ".open-next/assets"` | Where static files are | CSS, images, bundles live here |
| `assets.binding: "ASSETS"` | How to access assets in code | Use `env.ASSETS` to serve files |
| `env` sections | Different configs per environment | Prod vs staging settings |

### Step 4: Customize for iPix

**Update these values if different:**

```jsonc
{
  "name": "ipix-operator",  // Change if your Worker has different name
  "main": ".open-next/worker.js",  // Keep as is (OpenNext creates this)
  "compatibility_date": "2026-07-12",  // Update to today's date
  "compatibility_flags": ["nodejs_compat"],  // Keep as is
  "observability": {
    "enabled": true  // Set to false if you don't want logs (not recommended)
  },
  "assets": {
    "directory": ".open-next/assets",  // Keep as is
    "binding": "ASSETS"  // Keep as is
  }
}
```

### Step 5: Validate Configuration

```bash
# Check for JSON syntax errors
npx wrangler deploy --dry-run
# Expected output:
# ✓ Validating project configuration...
# ✓ Configuration is valid
# ✓ Would deploy to ipix-operator

# If errors appear, check:
# - No trailing commas
# - All { } are matched
# - All " " quotes are closed
# - No comments outside of strings
```

---

## Real-World User Journey

### Scenario: iPix Backend Engineer Setting Up Cloudflare

**Goal:** Configure Wrangler to build and run iPix on Workers

**Journey:**
1. ✅ "I install OpenNext and Wrangler" (previous task)
2. ✅ "I create wrangler.jsonc in my project root"
3. ✅ "I paste the configuration"
4. ✅ "I verify with `wrangler deploy --dry-run`"
5. ✅ "Configuration is valid, I can proceed to next step"

**Success moment:** "Wrangler tells me the config is valid and it would deploy correctly"

---

## File Locations Reference

After build, OpenNext creates these directories:

```
/home/sk/ipix/
├── .open-next/
│   ├── worker.js           ← Main entry point (referenced in wrangler.jsonc)
│   ├── assets/             ← Static files (CSS, JS, images)
│   ├── server-functions/   ← API routes compiled
│   └── cache/              ← ISR cache
├── app/                    ← Your Next.js app (unchanged)
├── package.json            ← Dependencies
├── wrangler.jsonc          ← ← YOU CREATE THIS
└── open-next.config.ts     ← Next task
```

**Key:** Wrangler looks for `.open-next/worker.js` after build runs.

---

## Testing & Verification

### Validation Test

```bash
# Test that wrangler.jsonc is valid
npx wrangler deploy --dry-run

# Expected output:
# ✓ Validating project configuration
# ✓ Configuration is valid
# ✓ Building for platform: Workers
# ✓ Would create deploy (ipix-operator)
```

### Parse Test

```bash
# Verify JSON is valid (without deploying)
node -e "console.log(JSON.stringify(require('./wrangler.jsonc')))"

# Expected: Valid JSON output or error message
# If error: "SyntaxError in wrangler.jsonc"
```

### File Exists Test

```bash
# Confirm file was created
ls -la wrangler.jsonc
# Expected: -rw-r--r-- ... wrangler.jsonc

# Confirm it has content
wc -l wrangler.jsonc
# Expected: ~30 lines
```

---

## Common Mistakes & How to Avoid

| Mistake | Symptom | Fix |
|---------|---------|-----|
| Wrong filename | "wrangler.json" instead of "wrangler.jsonc" | Use `.jsonc` extension (JSONC = JSON with comments) |
| Trailing comma | `"enabled": true,` after last property | Remove comma before closing `}` |
| Wrong path | `"main": ".next/worker.js"` | Should be `.open-next/worker.js` |
| Missing quotes | `name: ipix-operator` | Should be `"name": "ipix-operator"` |
| Mixed tabs/spaces | Python-like indentation errors | Use 2 spaces (consistent) |

---

## Environment Variables (Optional)

If you need environment-specific values:

```jsonc
{
  "env": {
    "production": {
      "vars": {
        "ENVIRONMENT": "production",
        "API_URL": "https://api.ipix.example.com"
      }
    },
    "development": {
      "vars": {
        "ENVIRONMENT": "development",
        "API_URL": "http://localhost:3000"
      }
    }
  }
}
```

Access in Worker code:
```typescript
const env = process.env.ENVIRONMENT // "production" or "development"
```

---

## What Happens at Build Time

When you run `npm run build` (after tasks 017-018):

```bash
$ npm run build

1. OpenNext reads wrangler.jsonc
2. Builds Next.js app
3. Creates .open-next/ directory structure:
   - worker.js (main entry point)
   - assets/ (static files)
   - server-functions/ (API routes)
4. Ready for wrangler deploy
```

---

## Next Task

→ `017-CF-NEXTJS-create-opennext-config.md`

After wrangler.jsonc is validated, create the OpenNext config file.

---

## References

- **Wrangler Config Docs:** https://developers.cloudflare.com/workers/wrangler/configuration/
- **OpenNext Cloudflare:** https://opennext.js.org/cloudflare
- **Compatibility Date:** https://developers.cloudflare.com/workers/platform/compatibility-dates/

---

## Time Estimate

- **Create file:** 1 minute
- **Paste config:** 2 minutes
- **Validation:** 2 minutes
- **Troubleshooting (if needed):** 5 minutes
- **Total:** ~10 minutes

---

## Rollback

If you need to undo:

```bash
# Delete the config file
rm wrangler.jsonc

# Your app is back to pre-Wrangler state
# (no harm, nothing changed elsewhere)
```

---

## Done Checklist

- [ ] `wrangler.jsonc` created in project root
- [ ] Configuration pasted and formatted correctly
- [ ] `npx wrangler deploy --dry-run` succeeds
- [ ] No syntax errors in JSON
- [ ] File contains all required sections
- [ ] Compatibility flags set to `["nodejs_compat"]`
- [ ] Assets directory configured
- [ ] Observability enabled
- [ ] Ready for next task (open-next.config.ts)
