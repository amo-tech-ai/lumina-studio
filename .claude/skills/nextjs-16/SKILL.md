---
name: nextjs-16
description: >
  Thin satellite for Next.js 16 platform work on app/ — use when touching
  app/next.config.ts, app/src/proxy.ts, app/src/middleware*.ts, anything under
  app/src/app/**, middleware migration comments, Turbopack failures, or caching APIs.
  Full content lives in nextjs-developer/references/ipix-16.md. Use alongside the
  nextjs-developer hub for platform-file reviews. NOT for generic page/layout work
  (use nextjs-developer) or Supabase auth (ipix-supabase).
metadata:
  version: "2.0.0"
---

# Next.js 16 — satellite

**Hub:** [nextjs-developer](../nextjs-developer/SKILL.md)  
**Full reference:** [nextjs-developer/references/ipix-16.md](../nextjs-developer/references/ipix-16.md)

This skill is a **thin pointer** for platform files (`next.config.ts`, `proxy.ts`, `middleware*.ts`). Read the reference above for all iPix v16 rules, MCP setup, and breaking-change checklist.

**Quick reminders:**

- Export `proxy` from `app/src/proxy.ts` — not `middleware`
- `await params`, `await cookies()`, `await headers()` — async only
- `cd app && npm run lint` separately — not bundled in `next build`
- Auth / session → **`ipix-supabase`**, not archived `nextjs-supabase-auth`
