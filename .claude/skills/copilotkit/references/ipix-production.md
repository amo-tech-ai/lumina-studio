# iPix production CopilotKit — plain-language ops guide

**Linear:** [IPI-127 · AIOR-011](https://linear.app/amo100/issue/IPI-127)

## What this is

The operator app at **www.ipix.co/app** uses CopilotKit for the right-hand AI chat. In production, two things must be true:

1. **You are signed in** (Supabase session) — otherwise the runtime returns `401`.
2. **Vercel has the license token** — otherwise chat may work but **Threads** stay locked.

## Smoke test (30 seconds)

1. Go to [https://www.ipix.co/login](https://www.ipix.co/login) → sign in with Google.
2. Open [https://www.ipix.co/app/shoots](https://www.ipix.co/app/shoots) (any `/app/*` route works).
3. Open DevTools → **Console** — expect **no** red errors mentioning `copilotkit` or `401`.
4. DevTools → **Network** → filter `copilotkit` → `info` request should be **200**.
5. Type “hello” in the AI sidebar → you should see a streamed reply.

**Pass without license:** steps 1–3 (page + no console noise).  
**Full pass:** steps 1–5 + Threads drawer not showing “licensed feature”.

## Vercel project

| Setting | Value |
|---------|--------|
| Project | `ipix-operator` (or root project if monorepo deploy uses `app/` as root) |
| Root directory | `app` |
| Runtime route | `app/src/app/api/copilotkit/[[...slug]]/route.ts` |

## Env vars (production)

| Variable | Required | What it does |
|----------|----------|--------------|
| `COPILOTKIT_LICENSE_TOKEN` | For threads | Unlocks CopilotKit Intelligence (thread history) |
| `INTELLIGENCE_API_KEY` | If license set | Paired key — runtime throws if license without this |
| `OPERATOR_AUTH_ENABLED` | Yes in prod | `true` → `/app/*` requires login |
| `GEMINI_API_KEY` | Yes | Powers Mastra agents behind the runtime |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Auth + edge function calls |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Browser Supabase client |

Sync from Infisical; never commit tokens. Local dev: `app/.env.local`.

## How auth + CopilotKit interact

```
Sign in → session cookie set
  → visit /app/shoots
  → (operator)/layout.tsx checks getUser()
  → if authed: mount <CopilotKit> + sidebar
  → if not: render page only (no /api/copilotkit/info spam)
```

## Common errors

| Error | Meaning | Fix |
|-------|---------|-----|
| `401` on `/api/copilotkit/info` | No valid session | IPI-125 OAuth URLs |
| Threads “licensed feature” | No license on Vercel | Set `COPILOTKIT_LICENSE_TOKEN` |
| Import-time throw | License without `INTELLIGENCE_API_KEY` | Add both or remove license |
| Chat works locally, not prod | Env missing on Vercel | Redeploy after Infisical sync |

## Code pointers

- Runtime: `app/src/app/api/copilotkit/[[...slug]]/route.ts`
- Provider gate: `app/src/app/(operator)/layout.tsx`
- Auth middleware: `app/src/proxy.ts`
- Example env: `app/.env.example`

## Related issues

- [IPI-125](https://linear.app/amo100/issue/IPI-125) — OAuth (must be green before IPI-127)
- [IPI-48](https://linear.app/amo100/issue/IPI-48) — Mastra runtime foundation
