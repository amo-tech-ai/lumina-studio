---
description: "Triage and fix PR review comments — inline threads, bot summaries, CI failures"
argument-hint: "PR number or URL"
allowed-tools: ["Bash", "Edit", "Write", "Read", "Grep", "Glob", "Task"]
---

# /pr-fix — PR review fix orchestrator

Act as a senior GitHub PR reviewer and fixer for the iPix / Lumina Studio codebase.

## Arguments

`$ARGUMENTS` — PR number (e.g. `162`) or full GitHub PR URL. Required.

## Workflow hub

- **Orchestrator:** `/pr` — auto-detect; use `/pr fix` for this command's full loop
- **Rule:** comment taxonomy, merge-blocker source of truth, and HEAD/worktree gate are inlined below — this file is self-contained. (`@pr-review-loop` was referenced here in an earlier revision; no such rule file exists anywhere in the repo — removed rather than left dangling.)
- **Resolve only:** `/pr resolve` or `/pr-fix-resolve`
- **Full ship:** `/pr ship` or `/pr-fix-ship` (explicit commit consent)

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

| Source | Blocks merge? | Action |
|--------|---------------|--------|
| **Inline review thread** (`isResolved = false`) | **Yes** | Fix → GraphQL reply → resolve |
| Bot summary review (“Needs Changes 🔧”, Conversation tab) | **No** | Track in PR comment; do not treat as open thread |
| Bot summary-only nit (Codacy, CodeRabbit body) | **No** | Fix, dismiss, or PR comment — not GraphQL resolve |
| Codacy/CI check failure | **Yes** (if required check) | Fix or waiver in PR body |
| Draft PR | — | `gh pr ready <N>` before full bot review |

### Merge blockers — source of truth

**Only unresolved inline review threads block merge.**

Top-level bot reviews like “Needs Changes” may remain visible after fixes.  
They are **not** the source of truth.

**Source of truth:**

```text
GraphQL reviewThreads where isResolved = false
+
CI status (required checks)
+
latest HEAD SHA (fix verified on headRefOid)
```

Count unresolved threads:

```bash
REPO="$(gh repo view --json nameWithOwner --jq '.nameWithOwner' 2>/dev/null || echo 'amo-tech-ai/lumina-studio')"
OWNER="${REPO%%/*}"
NAME="${REPO#*/}"
gh api graphql -f query='
query { repository(owner:"'$OWNER'", name:"'$NAME'") {
  pullRequest(number:<N>) {
    reviewThreads(first:100) {
      nodes { id isResolved path line }
    }
  }
}}' --jq '[.data.repository.pullRequest.reviewThreads.nodes[] | select(.isResolved==false)] | length'
```

If count > 0 → `/pr fix` continues.  
If count = 0 but Conversation still shows “Needs Changes” → stale summary; proceed when CI green.

### Post-push thread re-fetch (mandatory)

After **every push**, re-fetch unresolved threads.

Bots may create **new threads on sibling files** after the first fix (e.g. fix `panel/route.ts` → new thread on `suggestions/route.ts`).

**Do not sign off until unresolved thread count stays 0 on latest HEAD.**

```text
push → wait ~10s → re-fetch GraphQL count
→ if new threads: fix siblings/shared callers → push again → repeat
→ sign off only when count = 0 at headRefOid
```

**Example (#164):** `parseBrandScore` had to land in both `intelligence/panel/route.ts` and `brands/[id]/suggestions/route.ts`. Fixing only one triggered a follow-up optibot thread.

### Sign-off gate (merge-ready)

```text
Wait for bot re-review on latest HEAD
→ confirm unresolved threads = 0
→ confirm CI green (required checks)
→ merge or /pr ready
```

---

## Worktree + HEAD gate

Before triage: `headRefOid` from `gh pr view` must match `git rev-parse HEAD`.  
If not on PR branch/worktree → stop.

Run `npm run worktree:audit` before every fix (see #173).

---

## Fix efficiency tiers

**Default to Tier A.** Escalate only when confidence drops below 80% or the issue touches auth, RLS, agents, migrations, CI, or runtime UI.

| Tier | When | Skills / MCP | Verify |
|------|------|--------------|--------|
| **A — Thread-only** | Clear inline comment with exact file/line | None unless confidence < 80% | Targeted test + lint |
| **B — Domain** | UI architecture, Supabase/RLS, auth, agents, migrations, shared components | Max 1–2 skills from matrix below; MCP only if external truth needed | `npm test` on affected glob |
| **C — Forensic** | CI red, runtime disputed, AC drift, stacked PR state unclear | `task-verifier` + MCP probes + browser snapshot | Full `@pr-workflow` matrix |

### Tier A — Thread-only

Use for clear inline comments with exact file/line.  
No skills or MCP unless confidence is below 80%.  
Verify with targeted test + lint.

### Tier B — Domain

Use when the fix touches UI architecture, Supabase/RLS, auth, agents, migrations, or shared components.  
Load max 1–2 relevant skills.  
Use MCP only if external truth is needed (DB state, build logs, live runtime).

### Tier C — Forensic

Use when CI is red, runtime behavior is disputed, AC drift exists, or stacked PR state is unclear.  
Use `task-verifier`, MCP probes, browser snapshot, and full verify matrix.

**Efficient `/pr fix` loop:**

```text
0. npm run worktree:audit
1. gh pr view N --json files → unresolved threads (GraphQL)
2. Classify each thread: A | B | C (show in triage table)
3. IF any B/C: graphify query → load 1 skill → optional 1 MCP probe
4. Smallest diff → verify by tier → reply (SHA + commands) → resolve
```

This keeps `/pr fix` fast for simple threads and powerful for risky PRs.

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

**Tier gate:** Skip heavy Phase 0 for Tier A threads. Run full Phase 0 only for Tier B/C (or when confidence < 80%).

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
| `app/src/app/api/copilotkit/**`, CopilotKit provider/chat components | `copilotkit` | **`copilotkit-v1-guard`** subagent — deprecated v1 imports the eslint guard misses |
| `app/src/mastra/**` | `mastra`, `gemini` | **`mastra-agent-reviewer`** subagent (known iPix Mastra gotchas) + `user-mastra` MCP (`searchMastraDocs`) |
| `app/src/lib/supabase/**`, auth, `proxy.ts` | `ipix-supabase`, `nextjs-developer`, `nextjs-16` | Supabase MCP |
| App Router (data fetching, RSC) | **`nextjs-developer`**, `nextjs-16` | `next-devtools-mcp` |
| `supabase/migrations/**`, `*.sql`, any new/changed RLS policy | `ipix-supabase`, `create-migration` | **`rls-policy-auditor`** subagent — the real agent for this; there is no "migration-reviewer" in the available agent list, do not reference it |
| `supabase/functions/**` | `ipix-supabase`, `gemini` | `list_edge_functions`, `get_edge_function` |
| Root `src/` (legacy Vite) touched | — | **`vite-drift-auditor`** subagent — flags new functionality landing in the retiring Vite tree |
| `app/src/app/api/**/route.ts`, `supabase/functions/**` added/removed/changed shape | — | **`api-documenter`** subagent — keeps `app/AGENTS.md` in sync |
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
4. Assign tier **A | B | C** per thread (see Fix efficiency tiers).
5. Show triage table before coding.

---

## Phase 2 — Fix

Order: Bug → Refactor → Tech debt → Style

1. Checkout PR branch (worktree required if not already there).
2. Tier A: read flagged lines only. Tier B/C: `graphify query` → read flagged lines.
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
- Stop if fix needs migration — report, use `create-migration` + the `rls-policy-auditor` subagent (adversarial review before applying, see IPI-536/PR #347's `planner_get_my_assignment` RPC for the pattern)

---

## Phase 3 — Verify

Verify depth matches tier (see Fix efficiency tiers).

### 3a. Static

```bash
cd app && npm run typecheck
cd app && npm test
```

Also: lint, build, `supabase:verify-rls`, edge/BI/DNA scripts as applicable.

### 3b. Domain (skills + MCP)

Tier B/C only. Run Phase 0 probes. DB claims → Supabase MCP.

### 3c. Spec compliance

Tier C, or `/pr ready` gate. If closes IPI-###: each AC → probe → result. Run `@task-verifier` before merge-ready.

### 3d. CI

```bash
gh pr checks <N> --watch=false
gh pr view <N> --json statusCheckRollup
```

---

## Phase 4 — Push & resolve

Use GraphQL `addPullRequestReviewThreadReply` + `resolveReviewThread`.  
Gate: unresolved thread count = 0 **on latest `headRefOid`** (see Comment taxonomy).

After every push: re-fetch unresolved threads (~10s). Do not sign off until count stays 0 on HEAD.  
Re-trigger Bugbot if material diff.

**Resolve-only path:** use `/pr-fix-resolve` when no local code changes needed.

---

## Phase 5 — Final report

No external template file exists for this (an earlier revision pointed at `.cursor/rules/pr-fix.mdc`, which was never created) — use this format directly:

```markdown
## Phase 5 — Final report: `/pr-fix` on PR #<N>

### Triage
| # | File:line | Source | Tier | Outcome |
|---|---|---|---|---|
| 1 | ... | Sentry/CodeRabbit/Codex/inline | A/B/C | Fixed / Dismissed (reason) |

### Fixes applied (commit <sha>)
One paragraph per real finding: what was wrong, how it was verified (not assumed), how it was fixed.

### Dismissed, with reasoning (not silently)
Anything closed without a code change — the evidence checked before dismissing, not just "looks fine."

### Verification
- Static: typecheck/test/lint/build results
- Domain (Tier B/C only): skill/MCP probes run, live-system checks
- Unresolved GraphQL review threads: <N> (must be 0 to sign off)
- CI on latest HEAD: <pass/fail per check>

### Prevention (if this session found something worth generalizing)
What skill/command/rule was updated so this class of bug is caught earlier next time — not just "fixed," but "why won't this recur."
```

---

## Rules

- **Only unresolved inline threads block merge** — ignore stale “Needs Changes” summaries when GraphQL count = 0
- Re-fetch thread count after every push; fix sibling files before sign-off
- Never resolve unread threads
- Verify "already fixed" at HEAD (+ MCP for DB)
- Load domain skill before pattern arguments
- One concern per commit
- Never `--no-verify`
- Docs-only fixes → separate PR

## Project context

- Repo: resolved dynamically via `gh repo view --json nameWithOwner`
- Stack: Next.js (`app/`), Mastra, Supabase, CopilotKit v2
- Test baseline: compare `npm test` vs main — new failures = blocker
