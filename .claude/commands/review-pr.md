---
description: "Pre-PR diff review — read-only, no commits. Find problems before Bugbot/CodeRabbit."
argument-hint: "[code|tests|errors|types|comments|simplify|all] [parallel]"
allowed-tools: ["Bash", "Glob", "Grep", "Read", "Task"]
---

# /review-pr — Pre-PR diff review (read-only)

**Review aspects (optional):** `$ARGUMENTS` — default: all applicable aspects.

**Inspired by:** [Anthropic pr-review-toolkit](https://github.com/anthropics/claude-plugins-official/tree/main/plugins/pr-review-toolkit)

**Rule:** Do **not** commit or push. Humans decide; report findings only. (`@pr-review-loop` was referenced here in an earlier revision — no such rule file exists anywhere in the repo; removed rather than left dangling. `.claude/commands/pr-fix.md`'s "Comment taxonomy" section is the closest real equivalent if you need the merge-blocker source of truth.)

---

## Injected context

- Current branch: !`git branch --show-current`
- Git status: !`git status -sb`
- Diff vs main (stat): !`git diff main...HEAD --stat 2>/dev/null || git diff --stat HEAD`
- Changed paths: !`git diff main...HEAD --name-only 2>/dev/null || git diff --name-only HEAD`
- Recent commits: !`git log -5 --oneline`
- Open PR (if any): !`gh pr view --json number,url,headRefOid,isDraft 2>/dev/null || echo "no open PR"`

---

## Workflow

1. **Parse aspects** from `$ARGUMENTS`:
   - `comments` · `tests` · `errors` · `types` · `code` · `simplify` · `all` (default)
   - Add `parallel` to launch applicable agents concurrently

2. **Determine scope** — review `git diff main...HEAD` (or unstaged if pre-commit on feature branch).

3. **Load the matching domain skill first** (read `SKILL.md`, not memory), then **select agents**:

   | Signal in diff | Skill to load | Agent |
   |----------------|---------------|-------|
   | Always | — | **code-reviewer** — CLAUDE.md, AGENTS.md, iPix defaults (confidence ≥80 only) |
   | `*.test.ts`, new logic | — | **pr-test-analyzer** — gaps rated 8–10 = blocker |
   | `catch`, fallbacks, API routes, edge fn, RLS-adjacent DB reads | — | **silent-failure-hunter** — catches errors swallowed as "not found" (e.g. IPI-536/PR #347's P1) |
   | New types / Zod schemas / changed function signatures | — | **type-design-analyzer** — catches unused/misleading params before a bot does |
   | Comment/doc changes | — | **comment-analyzer** (advisory only) |
   | `app/src/mastra/**` | `mastra` | **mastra-agent-reviewer** — known iPix Mastra gotchas (top-level `getMastra()`, `mastra dev` proxy pattern, registry wiring) |
   | `app/src/app/api/copilotkit/**`, CopilotKit provider/chat components | `copilotkit` | **copilotkit-v1-guard** — deprecated v1 imports the eslint guard misses |
   | `supabase/migrations/**`, `*.sql`, any new/changed RLS policy | `ipix-supabase` | **rls-policy-auditor** — adversarial check against the proven ownership pattern; this is the real, existing agent — do not look for a "migration-reviewer," it isn't in the available agent list |
   | Root `src/` (legacy Vite) touched | — | **vite-drift-auditor** — flags new functionality landing in the retiring Vite tree instead of `app/` |
   | `app/src/app/api/**/route.ts` or `supabase/functions/**` added/removed/changed shape | — | **api-documenter** — keeps `app/AGENTS.md` route/function docs in sync |
   | After 0 Critical/Important | — | **code-simplifier** (optional polish) |

   **Note:** "security-reviewer" and "qa-reviewer" referenced in older docs are aspirational — they are not real subagent types. Use `rls-policy-auditor` + `code-reviewer`'s security checklist for security-adjacent diffs instead of looking for those names.

4. **Launch reviews** — sequential by default; parallel if user passed `parallel`.

5. **Aggregate** into one summary:

   ```markdown
   # PR Review Summary

   ## Critical (must fix before PR)
   - [agent]: issue [file:line]

   ## Important (should fix before PR)
   - [agent]: issue [file:line]

   ## Suggestions
   - [agent]: suggestion [file:line]

   ## Strengths
   - …

   ## Recommended action
   1. Fix Critical + Important locally
   2. Run verify matrix (`@pr-workflow`)
   3. Re-run `/review-pr <aspect>` on changed paths
   4. Commit → push → open PR → Bugbot
   ```

---

## iPix code-reviewer checks (always)

- CopilotKit v2 imports only (`@copilotkit/react-core/v2`)
- No client-side `SERVICE_ROLE` / `GEMINI_API_KEY`
- `createSupabaseServerClient()` async · RLS on new tables
- Mastra: no top-level `getMastra()` in routes
- One concern per PR · no docs + code mix
- Worktree branch naming: `ipi/<task>-<slug>`

---

## Usage

```text
/review-pr                    # all applicable aspects
/review-pr code errors        # before commit
/review-pr tests              # after adding tests
/review-pr all parallel       # faster full pass
```

**When:** After implementation, **before** `gh pr create`.

**After PR feedback:** Run targeted aspects only, e.g. `/review-pr tests errors`.
