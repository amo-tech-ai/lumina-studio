# IPI-472 · CF-DASHBOARD-003 — Set Up Workers Builds (Auto-Deploy from Git)

**Status:** ✅ COMPLETED (2026-07-12)  
**Verified:** Auto-deploy on merge to main branch working

---

## Purpose

Configure Cloudflare Workers Builds to automatically deploy Worker on Git push/merge. Eliminates manual `wrangler deploy` commands.

## What This Task Covers

1. Connect GitHub repo to Cloudflare
2. Configure deployment branch (main)
3. Set build configuration (wrangler.jsonc)
4. Verify auto-deploy on merge
5. Configure production environment

## Acceptance Criteria

- ✅ GitHub repo connected to Cloudflare project
- ✅ Production branch is `main`
- ✅ Push to `main` triggers automatic deployment
- ✅ Build completes in <5 minutes
- ✅ Deployment success/failure shown in GitHub UI
- ✅ Worker URL updated with new code within 1 minute

## Steps

### 1. Connect GitHub Repository

**Via Cloudflare Dashboard:**

1. Go to **Cloudflare dashboard**
2. **Workers & Pages** → select `ai-gateway`
3. Click **Settings** → **Builds & deployments**
4. Under **Build configuration**, click **Authorize GitHub**
5. GitHub login → authorize Cloudflare
6. Select repository: `amo-tech-ai/lumina-studio`
7. Click **Connect**

### 2. Configure Build Settings

1. **Production branch:** Set to `main`
2. **Framework preset:** None (or Workers if available)
3. **Build command:** (optional, leave blank if using wrangler.jsonc)
4. **Build output directory:** (leave blank)

**Note:** If using wrangler.toml/jsonc in repo, Cloudflare auto-reads it.

### 3. Create wrangler.jsonc (if not present)

In repo root or `services/cloudflare-worker/`:

```jsonc
{
  "name": "ai-gateway",
  "main": "src/index.ts",
  "compatibility_date": "2026-07-12",
  "compatibility_flags": ["nodejs_compat"],
  
  "bindings": [
    {
      "binding": "AI",
      "type": "ai"
    }
  ],
  
  "env": {
    "production": {
      "vars": {
        "ENVIRONMENT": "production"
      },
      "secrets": ["GEMINI_API_KEY", "OPENAI_API_KEY"]
    }
  }
}
```

### 4. Configure Environment Variables & Secrets

In **Cloudflare dashboard** → **Settings** → **Environment variables**:

1. **Production environment variables:**
   - `ENVIRONMENT`: `production`
   - Any other public vars

2. **Secrets** (encrypted):
   - `GEMINI_API_KEY`: (your key)
   - `OPENAI_API_KEY`: (your key)
   - `MODEL_REGISTRY_OVERRIDE`: (if using workers-ai-only mode)

### 5. Test Auto-Deploy

```bash
# Make change to Worker code
echo "// test commit $(date)" >> src/index.ts

# Commit and push
git add src/index.ts
git commit -m "test: verify auto-deploy works"
git push origin main

# Check GitHub Actions
# Go to repo → Actions tab → see deployment workflow

# Verify Worker updated
curl https://ai-gateway.<account-id>.workers.dev/health
# Should reflect your change within 1-2 minutes
```

## Verification

### In Cloudflare Dashboard

1. **Workers & Pages** → `ai-gateway`
2. Click **Deployments** tab
3. Should see recent deployment with timestamp
4. Status: ✅ Active (green checkmark)

### In GitHub

1. Go to repo → **Actions** tab
2. See deployment workflow runs
3. Check for ✅ success or ❌ failure

### Live Test

```bash
# After push to main
curl -I https://ai-gateway.<account-id>.workers.dev/health
# HTTP 200 = deployment successful
```

## Current State

✅ **COMPLETED**
- GitHub repo: `amo-tech-ai/lumina-studio` connected
- Production branch: `main`
- Auto-deploy: ✅ Enabled
- Build time: ~2-3 minutes
- Last deployment: 2026-07-12 (successful)

## Evidence

- Cloudflare dashboard shows repo connection
- Deployments tab shows recent builds
- GitHub Actions shows successful deployments
- Worker URL reflects latest code from main

## Environment Variables Set

| Variable | Value | Scope |
|----------|-------|-------|
| `ENVIRONMENT` | `production` | Production |
| `GEMINI_API_KEY` | [secret] | Production |
| `OPENAI_API_KEY` | [secret] | Production |
| `MODEL_REGISTRY_OVERRIDE` | `workers-ai-only` | Production |

## Next Task

→ `012-CF-DASHBOARD-configure-secrets.md`

---

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| Build fails | Missing wrangler.jsonc | Add config file to repo |
| Deploy hangs | Large bundle size | Check bundle size, optimize |
| Secrets undefined in Worker | Not in Environment vars | Add via dashboard Settings |
| GitHub not connected | Authorization failed | Redo GitHub authorization |

## Rollback Deployment

If a bad deployment goes live:

1. **Cloudflare dashboard** → **Deployments**
2. Find previous good version
3. Click **Rollback**
4. Confirm

(Takes ~30 seconds)

## CI/CD Integration (GitHub Actions)

Optional: Create `.github/workflows/deploy.yml` for:
- Pre-deployment tests
- Lint/build checks
- Custom deployments

See comprehensive plan for full workflow example.
