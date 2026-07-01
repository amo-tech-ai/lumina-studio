Act as a senior GitHub PR reviewer and fixer for the iPix / Lumina Studio codebase.

## Arguments

`$ARGUMENTS` — PR number (e.g. `162`) or full GitHub PR URL. Required.

## Skill map SSOT

- `tasks/intelligence/ai/skill-map.md` — task → skill → MCP
- `.claude/skills/README.md` — hub inventory
- `task-verifier/references/mcp-cadence-ipix.md` — surface probes

**Canonical Cursor rule:** `.cursor/rules/pr-fix.mdc` (keep in sync).

---

## Phase 0 — Pre-flight (Skills & MCP audit)

Before triage or code:

```bash
gh pr view <N> --json number,title,body,headRefName,files
```

1. **Read changed paths** → load domain skills (read `SKILL.md`, not memory).
2. **If PR closes IPI-###** → read `docs/linear/issues/IPI-<N>-*.md`.
3. **`graphify query "<concept>"`** before reading flagged source files.
4. **Output:** one paragraph — PR intent, skills loaded, MCP probes planned.

### Path → skill matrix (`app/` + backend)

| Changed paths | Skills to load | MCP / subagent |
|---------------|----------------|----------------|
| `app/src/styles/**`, `tokens.css` | `design-md`, `frontend-design`, `claude-design-handoff` | — |
| `app/src/components/**`, operator UI | `design-md`, `frontend-design`, `shadcn`, `accessibility` | `cursor-ide-browser` |
| `app/src/app/api/copilotkit/**` | `copilotkit` | — |
| `app/src/mastra/**` | `mastra`, `gemini` | `user-mastra` (`searchMastraDocs`) |
| `app/src/lib/supabase/**`, auth, `proxy.ts` | `ipix-supabase`, **`nextjs-supabase-auth`**, `nextjs-16` | Supabase MCP |
| App Router (data fetching, RSC) | **`nextjs-best-practices`**, `nextjs-16` | `next-devtools-mcp` |
| `supabase/migrations/**`, `*.sql` | `ipix-supabase`, `create-migration` | Supabase MCP + **migration-reviewer** |
| `supabase/functions/**` | `ipix-supabase`, `gemini` | `list_edge_functions`, `get_edge_function` |
| AI / prompts | `gemini`, `senior-prompt-engineer` | `user-gemini-api-docs-mcp` |
| Cloudinary / media | `cloudinary` | Cloudinary MCP plugins |
| Firecrawl / crawl | `firecrawl`, `ipix-supabase` | `user-firecrawl` |
| Commerce | `mercur` | Mercur MCP |
| Multi-file / >3 paths | `feature-dev`, `graphify` | — |
| Tests | `gen-test` | — |
| UI smoke | `agent-browser` | `cursor-ide-browser` |
| Env / secrets | `infisical` | — |
| `proxy.ts`, `middleware.ts`, `next.config.*`, App Router | **`nextjs-16`**, `ipix-task-lifecycle` | **`next-devtools-mcp`** + Vercel MCP |
| `ai` / `@ai-sdk/*` | `nextjs-16` → upstream `ai-sdk-6-skills` | Context7 |
| Linear / spec drift | `linear`, `ipix-task-lifecycle` | `project-0-ipix-linear-ipix` |
| Worktree / branch | `worktrees` | — |
| Scope / bundle risk | `lean` | — |
| Merge-ready gate | **`task-verifier`** | `verifier-probes-ipix.md` |

**Hub router:** `ipix/SKILL.md` when domain is unclear.

### MCP servers

| Server | When | Key tools |
|--------|------|-----------|
| `project-0-ipix-supabase` | Schema, RLS, migrations, edge | `execute_sql`, `list_migrations`, `get_advisors`, `list_edge_functions` |
| `user-mastra` | Agent/tool/workflow disputes | `searchMastraDocs`, `readMastraDocs` |
| `user-gemini-api-docs-mcp` | Model/token/structured output | docs fetch |
| `user-firecrawl` | Crawl PRs | scrape/search |
| `project-0-ipix-linear-ipix` | AC vs scope | issue tools |
| `plugin-vercel-plugin-vercel` | Build/deploy failures | `get_deployment_build_logs`, `get_runtime_errors` |
| `cursor-ide-browser` | UI/token visual diff | snapshot |
| **`next-devtools-mcp`** | Next 16 runtime (dev server up) | `nextjs_index`, `nextjs_call` |

**Next.js 16:** `.claude/skills/nextjs-16/SKILL.md` · upstream [gocallum/nextjs16-agent-skills](https://github.com/gocallum/nextjs16-agent-skills) · [DevTools MCP blog](https://nextjs.org/blog/next-16#nextjs-devtools-mcp)
| Context7 (if enabled) | SDK disputes | `ai@6.x` → `maxOutputTokens` |

**Evidence over memory** for dismissals.

### Example routing

| PR | Skills | MCP |
|----|--------|-----|
| #162 DESIGN-010 tokens | `design-md`, `frontend-design`, `claude-design-handoff`, `accessibility` | browser snapshot vs tokens |
| #163 middleware/proxy inline | `nextjs-16`, `worktrees`, `ipix-task-lifecycle` | `next-devtools-mcp` + Vercel build logs |

---

## Phase 1 — Fetch & triage

1. Extract PR number from `$ARGUMENTS`.
2. `gh pr view <N> --json number,title,headRefName,baseRefName,url`
3. Fetch unresolved threads (GraphQL) + inline comments (REST) — see `.cursor/rules/pr-fix.mdc`.
4. Bucket: **Fix** · **Already fixed** · **Out of scope** · **Dismiss**
5. Show triage table before coding.

---

## Phase 2 — Fix

Order: Bug → Refactor → Tech debt → Style

1. Checkout PR branch (worktree preferred).
2. `graphify query` → read flagged lines.
3. Re-read loaded domain skill for pattern comments.
4. Smallest safe diff; >3 files → confirm with user.
5. One concern per commit.

### iPix defaults

- Auth: `withOperatorAuth(req)` → `OperatorAuthError` → 401
- RLS: `createSupabaseServerClient()` (async)
- CopilotKit: v2 imports only
- Mastra: `tool.execute!()` from routes
- Gemini: server-only; see `gemini` skill
- AI SDK 6.x: `maxOutputTokens`
- Never `--no-verify`
- Stop if fix needs migration — report, use `create-migration` + migration-reviewer

---

## Phase 3 — Verify

### 3a. Static

```bash
cd app && npm run typecheck
cd app && npm test
```

Also: lint (`app/**`), build (routes/config/middleware), `supabase:verify-rls`, `supabase:verify-edge`, `verify-brand-intelligence`, `verify-dna` as applicable.

### 3b. Domain (skills + MCP)

Run Phase 0 probes. DB claims → Supabase MCP, not code inference.

### 3c. Spec compliance

If closes IPI-###: each AC → probe → result. Run `@task-verifier` before merge-ready.

---

## Phase 4 — Push & resolve

Commit `fix(pr-<N>): address review — <summary>`, push, reply on each thread, resolve via GraphQL. Out-of-scope: reply only, do not resolve. Dismiss: evidence + resolve.

Re-fetch threads after ~10s for new bot comments (CodeRabbit, Bugbot). Re-enter Phase 1 if new valid threads.

Re-trigger `cursor review` / `bugbot run` if diff >50 LOC or sensitive paths.

---

## Phase 5 — Final report

Output the report template from `.cursor/rules/pr-fix.mdc` including **Skills verified** and **MCP verified** sections.

---

## Skills audit — recommended for pr-fix

**Core (path-triggered):** `ipix`, `ipix-task-lifecycle`, `ipix-supabase`, `mastra`, `copilotkit`, `gemini`, **`nextjs-16`**, **`nextjs-supabase-auth`**, **`nextjs-best-practices`**, `frontend-design`, `design-md`, `task-verifier`, `graphify`, `worktrees`, `feature-dev`, `create-migration`, `cloudinary`, `firecrawl`, `infisical`, `linear`, `gen-test`, `agent-browser`, `accessibility`, `shadcn`, `lean`, `claude-design-handoff`, `mercur`.

**Upstream (optional install):** `npx skills add gocallum/nextjs16-agent-skills` → `nextjs16-skills`, `ai-sdk-6-skills`, `shadcn-skills`.

**High-value adds:** `senior-prompt-engineer` (prompt review), `mvp` (scope), `mermaid-diagrams` (flow specs).

**Subagents:** `migration-reviewer`, `security-reviewer`, `qa-reviewer`, `bugbot`.

**Gap candidates:** `pr-fix` meta-skill, `review-bugbot` (Cursor plugin).

---

## Rules

- Never resolve unread threads
- Verify "already fixed" at HEAD (+ MCP for DB)
- Load domain skill before pattern arguments
- One concern per commit
- Never `--no-verify`
- Stop on test fail, security issue, or migration need
- Docs-only fixes → separate PR

## Project context

- Repo: `amo-tech-ai/lumina-studio`
- Stack: Next.js (`app/`), Mastra, Supabase, CopilotKit v2
- Test baseline: compare `npm test` vs main — new failures = blocker
