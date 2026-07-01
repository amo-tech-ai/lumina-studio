---
name: nextjs-16
description: >
  Next.js 16 for the iPix operator app (app/ on :3002). Use when fixing or reviewing
  proxy.ts, next.config.ts, async params/searchParams/cookies/headers, Turbopack build
  failures, caching APIs (use cache, revalidateTag, updateTag), route segments, or
  middleware→proxy migration comments. Load with next-devtools MCP when dev server is
  running. NOT for CopilotKit/Mastra (use those skills) or Supabase edge (ipix-supabase).
version: 1.0.0
paths:
  - "app/next.config.ts"
  - "app/src/proxy.ts"
  - "app/src/app/**"
  - "app/src/middleware*.ts"
---

# Next.js 16 — iPix operator app

**Stack:** Next.js **16.1.x** · Turbopack default · App Router · React 19 · port **3002**.

**Upstream skills (install or reference):**

- [gocallum/nextjs16-agent-skills](https://github.com/gocallum/nextjs16-agent-skills) — `nextjs16-skills`, `ai-sdk-6-skills`, `shadcn-skills`
- Install: `npx skills add gocallum/nextjs16-agent-skills` (pick `nextjs16-skills` + `ai-sdk-6-skills`)

**Official:**

- [Next.js 16 blog](https://nextjs.org/blog/next-16) · [upgrade guide](https://nextjs.org/docs/app/guides/upgrading/version-16)
- [Next.js DevTools MCP](https://nextjs.org/docs/app/guides/mcp) · npm [`next-devtools-mcp`](https://www.npmjs.com/package/next-devtools-mcp)

---

## iPix as-built (do not regress)

| Topic | iPix pattern |
|-------|----------------|
| Network gate | `app/src/proxy.ts` — `export async function proxy()` + `config.matcher` |
| No dual entry | **Do not** add `middleware.ts` alongside `proxy.ts` — build fails (see `operator-middleware-contract.test.ts`, IPI2-127) |
| Turbopack root | `next.config.ts` → `turbopack: { root: __dirname }` (multi-lockfile monorepo) |
| Server externals | `serverExternalPackages` for CopilotKit + Mastra libs |
| Async request APIs | `await params`, `await searchParams`, `await cookies()`, `await headers()` |
| Lint | ESLint directly (`npm run lint`) — `next lint` removed in v16 |
| AI SDK | `ai@6.x` — `maxOutputTokens`, not `maxTokens` (see `ai-sdk-6-skills`) |

---

## Next.js DevTools MCP (pr-fix / debug)

Thin connector to the running dev server's `/_next/mcp` endpoint.

**Install (Cursor):**

```bash
npx add-mcp next-devtools-mcp@latest
# or Cursor Settings → MCP → add:
# { "command": "npx", "args": ["-y", "next-devtools-mcp@latest"] }
```

**Requires:** `cd app && npm run dev` on Next 16+ before runtime probes.

**Use when:**

- Build passes but route behavior wrong
- Review asks about caching/rendering for a specific page
- Need live stack traces or dev/build logs without copy-paste

**Pair with:** `cursor-ide-browser` or `agent-browser` for visual proof; Vercel MCP for CI/deploy failures.

---

## Breaking changes checklist (review dismissals)

| Claim | iPix truth |
|-------|------------|
| "Rename middleware → proxy" | Already `proxy.ts`; export must be `proxy`, not `middleware` |
| "proxy runs on Edge" | **Node.js only** — Edge stays on deprecated `middleware.ts` |
| "Sync params OK" | **No** — async only in v16 |
| "revalidateTag('tag')" | Deprecated — needs `cacheLife` profile or use `updateTag()` in Server Actions |
| "next build runs lint" | **No** — run `npm run lint` separately |
| "experimental.turbopack" | Moved to top-level `turbopack` |

---

## Upgrade / codemod

```bash
npx @next/codemod@canary upgrade latest
# Covers: turbopack config move, middleware→proxy, next lint→eslint, unstable_ prefixes
```

After codemod: run `cd app && npm run typecheck && npm run build && npm test`.

---

## Related iPix skills

| Area | Skill |
|------|-------|
| CopilotKit runtime | `copilotkit` |
| Mastra agents | `mastra` |
| Supabase auth in Next | `ipix-supabase` → `references/auth/nextjs.md` |
| UI / tokens | `design-md`, `frontend-design` |
| PR review loop | `@pr-fix` → `.cursor/rules/pr-fix.mdc` |
