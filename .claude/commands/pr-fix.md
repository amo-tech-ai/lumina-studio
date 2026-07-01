Act as a senior GitHub PR reviewer and fixer for the iPix / Lumina Studio codebase.

## Arguments

`$ARGUMENTS` — PR number (e.g. `162`) or full GitHub PR URL. Required.

## Workflow hub

- **Rule:** `@pr-review-loop` — full 7-step loop, git safety, comment taxonomy
- **Pre-PR (read-only):** `/review-pr` — run before opening PR, not here
- **Resolve only:** `/pr-fix-resolve` — fixes already pushed
- **Full ship:** `/pr-fix-ship` — verify → commit → push → resolve (explicit consent to commit)

**Canonical Cursor rule:** `.claude/commands/pr-fix.md` ↔ `.cursor/rules/pr-fix.mdc` (keep in sync).

## Skill map SSOT

- `tasks/intelligence/ai/skill-map.md` — task → skill → MCP
- `.claude/skills/README.md` — hub inventory
- `task-verifier/references/mcp-cadence-ipix.md` — surface probes

---

## Injected context

- PR: !`gh pr view $ARGUMENTS --json number,url,headRefName,headRefOid,isDraft 2>/dev/null || echo "set PR in arguments"`
- Git status: !`git status -sb`
- Diff stat: !`git diff --stat HEAD`
- Branch diff: !`git diff main...HEAD --stat 2>/dev/null || echo "n/a"`
- Recent commits: !`git log -5 --oneline`
- Local HEAD: !`git rev-parse HEAD`
- Branch: !`git branch --show-current`

---

## Comment taxonomy (classify first)

| Source | Action |
|--------|--------|
| Inline review thread | Fix → GraphQL reply → resolve |
| Bot summary (not inline) | Fix → PR comment only |
| Codacy/CI | Fix or external UI |
| Draft PR | `gh pr ready <N>` before full bot review |

---

## Worktree + HEAD gate

Before triage: `headRefOid` from `gh pr view` must match `git rev-parse HEAD`.  
If not on PR branch/worktree → stop.

---

## Git safety (before commit)

```bash
git status -sb
git diff --stat HEAD
git diff main...HEAD --stat
git log -5 --oneline
```

**NEVER stage:** `.env*`, `.mcp.json`, `.agents/**`, `skills-lock.json`, unrelated `docs/**`

**Do not commit** unless user asks or `/pr-fix-ship`.

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

**Evidence over memory** for dismissals.

---

## Phase 1 — Fetch & triage

1. Extract PR number from `$ARGUMENTS`.
2. HEAD gate + fetch unresolved threads (GraphQL) — see `.cursor/rules/pr-fix.mdc`.
3. Bucket: **Fix** · **Already fixed** · **Out of scope** · **Dismiss**
4. Show triage table before coding.

---

## Phase 2 — Fix

Order: Bug → Refactor → Tech debt → Style

1. Checkout PR branch (worktree required if not already there).
2. `graphify query` → read flagged lines.
3. Smallest safe diff; >3 files → confirm with user.
4. One concern per commit.

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

Also: lint, build, `supabase:verify-rls`, edge/BI/DNA scripts as applicable.

### 3b. Domain (skills + MCP)

Run Phase 0 probes. DB claims → Supabase MCP.

### 3c. Spec compliance

If closes IPI-###: each AC → probe → result. Run `@task-verifier` before merge-ready.

### 3d. CI

```bash
gh pr checks <N> --watch=false
gh pr view <N> --json statusCheckRollup
```

---

## Phase 4 — Push & resolve

Use GraphQL `addPullRequestReviewThreadReply` + `resolveReviewThread`.  
Gate: unresolved thread count = 0. See `.cursor/rules/pr-fix.mdc` for full protocol.

Re-fetch threads after ~10s. Re-trigger Bugbot if material diff.

**Resolve-only path:** use `/pr-fix-resolve` when no local code changes needed.

---

## Phase 5 — Final report

Output the report template from `.cursor/rules/pr-fix.mdc`.

---

## Rules

- Never resolve unread threads
- Verify "already fixed" at HEAD (+ MCP for DB)
- Load domain skill before pattern arguments
- One concern per commit
- Never `--no-verify`
- Docs-only fixes → separate PR

## Project context

- Repo: `amo-tech-ai/lumina-studio`
- Stack: Next.js (`app/`), Mastra, Supabase, CopilotKit v2
- Test baseline: compare `npm test` vs main — new failures = blocker
