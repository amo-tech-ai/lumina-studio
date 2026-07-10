# Authentication Flow

**Purpose:** Trace the real Supabase Auth OAuth callback path in `app/src/app/auth/callback/route.ts`, including the host-trust gap that blocks the Cloudflare cutover.

## Explanation

The callback exchanges the OAuth `code` for a session via `supabase.auth.exchangeCodeForSession()`, then redirects to `/app`. Before redirecting it must pick the right origin: `redirectOrigin()` trusts `x-forwarded-host` only if `isTrustedForwardedHost()` says so. That function trusts the request's own origin, `SITE_URL`, or any `.vercel.app` host — it has **no case for `.workers.dev`**, so a Cloudflare-Workers-hosted preview cannot yet complete OAuth correctly (per `roadmap.md` §5, this is an open 🔴 blocker for `CF-MIG-810`).

## Diagram

```mermaid
sequenceDiagram
    participant U as User Browser
    participant Provider as OAuth Provider
    participant CB as /auth/callback route.ts
    participant Trust as isTrustedForwardedHost()
    participant SB as Supabase Auth

    U->>Provider: Sign in (Google/etc.)
    Provider-->>U: Redirect with ?code=...
    U->>CB: GET /auth/callback?code=...
    CB->>CB: read x-forwarded-host, x-forwarded-proto
    CB->>Trust: forwardedHost, requestOrigin

    alt host == request origin
        Trust-->>CB: trusted
    else host == new URL(SITE_URL).host
        Trust-->>CB: trusted
    else host ends with ".vercel.app"
        Trust-->>CB: trusted
    else host ends with ".workers.dev"
        Trust-->>CB: NOT trusted (gap — falls through to origin)
        Note over CB,Trust: Blocks CF-MIG-810 cutover —<br/>roadmap.md §5 / §3 item 4
    end

    CB->>SB: exchangeCodeForSession(code)
    alt success
        SB-->>CB: session + Set-Cookie (sb-*-auth-token)
        CB-->>U: 302 redirect to {origin}/app
    else error
        SB-->>CB: error
        CB-->>U: 302 redirect to {origin}/login?error=auth
    end
```

## Related Linear issues

CF-MIG-210 (OAuth `.workers.dev` trust fix, per roadmap.md §5 line 36), CF-MIG-810 (blocked by this gap)

## Related PRD section

`roadmap.md` §3 item 4, §5 (Go/No-Go checklist, line 114/154/247); PRD §8 (Security & RLS)
