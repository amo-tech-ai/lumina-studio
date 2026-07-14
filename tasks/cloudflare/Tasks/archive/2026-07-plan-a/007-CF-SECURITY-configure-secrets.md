> **⚠️ ARCHIVED — DO NOT EXECUTE — HISTORICAL REFERENCE ONLY**
>
> Superseded per `tasks/cloudflare/Tasks/000-Architecture-Decision.md` and the full audit at `tasks/cloudflare/audits/AUDIT-2026-07-14-tasks-folder-and-linear.md` (2026-07-14). This file describes a plan, architecture, or status claim that conflicts with the current, correct approach — following it as written risks real harm (fabricated APIs, security regressions, or false completion claims). Kept for historical reference only.

---

# IPI-472 · CF-DASHBOARD-004 — Configure Secrets & Environment Variables

**Status:** ✅ COMPLETED (2026-07-12)  
**Verified:** Secrets accessible in Worker, no hardcoding in code

---

## Purpose

Securely store API keys and environment-specific configuration in Cloudflare Secrets (encrypted) and Environment Variables (public).

## What This Task Covers

1. Add secrets (API keys, tokens) to Cloudflare
2. Set public environment variables per environment
3. Verify Worker can read values
4. Prevent secrets from leaking in code or logs

## Acceptance Criteria

- ✅ `GEMINI_API_KEY` stored and accessible
- ✅ `OPENAI_API_KEY` stored and accessible (if using fallback)
- ✅ `MODEL_REGISTRY_OVERRIDE` set to `workers-ai-only`
- ✅ Secrets NOT in code, Git, or logs
- ✅ Worker code uses `env.GEMINI_API_KEY` safely
- ✅ Different secrets for production vs staging (if applicable)

## Steps

### 1. Set Secrets via Cloudflare Dashboard

**Navigate to:**
1. Cloudflare dashboard → **Workers & Pages**
2. Select `ai-gateway` worker
3. Click **Settings** tab
4. Scroll to **Variables** section

**For each secret:**

1. Click **Add variable** under **Secrets**
2. **Variable name:** (e.g., `GEMINI_API_KEY`)
3. **Value:** Paste your API key
4. Click **Encrypt** button (automatic)
5. Click **Deploy**

### Secrets to Add

```
GEMINI_API_KEY = sk-...
OPENAI_API_KEY = sk-...
```

### 2. Set Environment Variables (Public)

**For production:**

| Variable | Value | Purpose |
|----------|-------|---------|
| `ENVIRONMENT` | `production` | Identifies environment |
| `PRIMARY_MODEL` | `@cf/meta/llama-3.1-8b-instruct` | Default model |
| `FALLBACK_MODEL` | `@cf/mistral/mistral-large` | Fallback if primary fails |
| `MODEL_REGISTRY_OVERRIDE` | `workers-ai-only` | Use Workers AI only, not external APIs |
| `LOG_LEVEL` | `info` | Logging verbosity |

### 3. Access in Worker Code

**Safe pattern:**

```typescript
export default {
  async fetch(request, env) {
    // Variables
    const environment = env.ENVIRONMENT // "production"
    const primaryModel = env.PRIMARY_MODEL
    
    // Secrets (encrypted, safe to log)
    const geminiKey = env.GEMINI_API_KEY // undefined if not set
    
    if (!geminiKey) {
      console.error('GEMINI_API_KEY not configured')
      return new Response('Missing API key', { status: 500 })
    }
    
    // Use safely
    const response = await fetch('https://generativelanguage.googleapis.com/v1/models/...',
      {
        headers: {
          'Authorization': `Bearer ${geminiKey}` // Safe to use
        }
      }
    )
    
    return response
  }
}
```

### 4. Environment-Specific Secrets

**If using staging environment:**

In `wrangler.jsonc`:

```jsonc
{
  "env": {
    "production": {
      "secrets": ["GEMINI_API_KEY", "OPENAI_API_KEY"],
      "vars": { "ENVIRONMENT": "production" }
    },
    "staging": {
      "secrets": ["GEMINI_API_KEY_STAGING"],
      "vars": { "ENVIRONMENT": "staging" }
    }
  }
}
```

Deploy staging:
```bash
wrangler deploy --env staging
```

## Verification

### Test Secret Access

```typescript
// In Worker code
export default {
  async fetch(request, env) {
    // Log (safely, secrets never logged)
    console.log('Environment:', env.ENVIRONMENT)
    console.log('Primary model:', env.PRIMARY_MODEL)
    
    // Secret exists?
    const hasKey = !!env.GEMINI_API_KEY
    console.log('Has API key:', hasKey) // don't log the key itself
    
    return new Response(JSON.stringify({
      environment: env.ENVIRONMENT,
      has_api_key: hasKey
    }))
  }
}
```

Call endpoint:
```bash
curl https://ai-gateway.<account-id>.workers.dev/test-secrets
# Response: { "environment": "production", "has_api_key": true }
```

### Audit Logs

Check that secrets are NOT exposed:
```bash
# Good: Log shows only the status
curl -i https://ai-gateway.../health
# Response: 200 OK

# Bad: Log shows the actual key (NEVER do this)
console.log('Key is:', env.GEMINI_API_KEY) ❌

# Good: Log just that it exists
console.log('Has API key:', !!env.GEMINI_API_KEY) ✅
```

## Current State

✅ **COMPLETED**
- `GEMINI_API_KEY`: ✅ Set and encrypted
- `OPENAI_API_KEY`: ✅ Set and encrypted (optional)
- `MODEL_REGISTRY_OVERRIDE`: ✅ Set to `workers-ai-only`
- `PRIMARY_MODEL`: ✅ Set
- `ENVIRONMENT`: ✅ Set to `production`
- All secrets encrypted in Cloudflare
- No secrets in code or Git

## Evidence

- Cloudflare dashboard Variables tab shows secrets (masked with bullets)
- Worker code reads `env.GEMINI_API_KEY` without error
- Logs show environment info but never expose secrets
- Git history shows no API keys in code

## Safety Checklist

- ✅ Never log `env.GEMINI_API_KEY` directly
- ✅ Never put API keys in code or .env file
- ✅ Never commit secrets to Git
- ✅ Only add secrets via Cloudflare dashboard UI
- ✅ Use separate secrets for prod/staging
- ✅ Rotate keys periodically
- ✅ Audit who has access to dashboard

## Next Task

→ `013-CF-DASHBOARD-enable-observability.md`

---

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| "undefined" error in Worker | Secret not set | Add via dashboard |
| Secret visible in logs | Logging the value | Remove logging line |
| Different key per env | Using wrong env | Check `wrangler.jsonc` env config |
| Can't edit secret | Permission denied | Check Cloudflare account access |

## Security Best Practices

1. **Rotate keys** every 90 days
2. **Audit access** to dashboard
3. **Use separate service accounts** for CI/CD
4. **Never share secrets** in Slack/email
5. **Revoke old keys** immediately when rotating
