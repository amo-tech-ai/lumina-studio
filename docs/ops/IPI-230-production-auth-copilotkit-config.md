# IPI-230 — Production Auth + CopilotKit Config

**Branch:** `ipi/ops-auth-prod-config`  
**Last verified:** 2026-06-29

---

## Current state (local `app/.env.local`)

| Variable | Value | Prod ready? |
|---|---|---|
| `OPERATOR_AUTH_ENABLED` | `false` | ❌ Must be `true` |
| `COPILOTKIT_LICENSE_TOKEN` | `ck_pub_88e3269838fb61176853d6c40a328417` | ✅ Set |
| `INTELLIGENCE_API_KEY` | `cpk-127_GquMU2KT_EJXFK5HpMvmjpZvtGqggEfKW` | ✅ Set (required w/ license) |
| `DATABASE_URL` | `postgresql://postgres.nvdlhrodvevgwdsneplk:...@aws-1-us-east-2.pooler.supabase.com:6543/postgres` | ✅ Pooler `:6543` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://nvdlhrodvevgwdsneplk.supabase.co` | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Set | ✅ |
| `GEMINI_API_KEY` | Set | ✅ |
| `SITE_URL` default | `https://fashionos.co` | Needs `NEXT_PUBLIC_SITE_URL` override |

---

## Verification results

### Tests (all pass)

```bash
cd app
npx vitest run src/app/api/copilotkit/[[...slug]]/route.runtime.test.ts  → 5/5
npm run typecheck                                                      → exit 0
npm run build                                                          → exit 0

# Full suite (baseline)
npm test → 404 passed | 7 skipped | 0 failed
```

### Auth callback

- File: `app/src/app/auth/callback/route.ts`
- Uses `SITE_URL` (= `https://fashionos.co` or `NEXT_PUBLIC_SITE_URL`)
- Callback path: `/auth/callback`
- OAuth redirect URL: `https://fashionos.co/auth/callback`

### Operator gate

- File: `app/src/lib/operator-gate.ts`
- When `OPERATOR_AUTH_ENABLED=true`: validates Supabase session via `resolveOperatorUser`, returns 401 on failure
- When `false`: returns dev fallback `{ id: "dev-unauthenticated" }`

### CopilotKit runtime

- File: `app/src/app/api/copilotkit/[[...slug]]/route.ts`
- License only injected when `OPERATOR_AUTH_ENABLED=true` AND `COPILOTKIT_LICENSE_TOKEN` set
- `identifyUser` reads from ALS context (set by `withOperatorAuth`)
- No license → threads disabled, per-page-load fresh conversation (warns console)

---

## Required for production

### 1. Vercel env vars

Set these in Vercel project `ipix-operator` (or root deploy project):

| Variable | Value | Source |
|---|---|---|
| `OPERATOR_AUTH_ENABLED` | `true` | Infisical |
| `NEXT_PUBLIC_SITE_URL` | `https://fashionos.co` | Infisical |
| `COPILOTKIT_LICENSE_TOKEN` | `ck_pub_88e3269838fb61176853d6c40a328417` | Infisical |
| `INTELLIGENCE_API_KEY` | `cpk-127_...` | Infisical |
| `DATABASE_URL` | `postgresql://...pooler.supabase.com:6543/...` | Infisical |
| `GEMINI_API_KEY` | `AQ.Ab8RN6Jk_...` | Infisical |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://nvdlhrodvevgwdsneplk.supabase.co` | Infisical |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJ...` | Infisical |

### 2. Supabase OAuth redirect URLs

Configure in Supabase Dashboard → Authentication → URL Configuration:

| Field | Value |
|---|---|
| Site URL | `https://fashionos.co` |
| Redirect URLs | `https://fashionos.co/auth/callback` |

### 3. Vercel production domain

- Production URL: `https://fashionos.co`
- Custom domain should be configured in Vercel project settings

---

## Smoke test checklist

After deploying to production:

- [ ] Logged-out visit to `/app` → redirects to `/login` (or returns 401)
- [ ] Login with Google OAuth → redirects to `/app/<brand-id>`
- [ ] Authenticated GET `/api/copilotkit/info` → 200
- [ ] Unauthenticated POST `/api/copilotkit` → 401
- [ ] Chat sidebar opens and streams reply
- [ ] No 401 console/network errors
- [ ] No redirect loop

---

## Rollback

Revert `OPERATOR_AUTH_ENABLED` to `false` in Vercel env and redeploy.
