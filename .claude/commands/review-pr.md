---
description: "Pre-PR diff review — read-only, no commits. Find problems before Bugbot/CodeRabbit."
argument-hint: "[code|tests|errors|types|comments|simplify|all] [parallel]"
allowed-tools: ["Bash", "Glob", "Grep", "Read", "Task"]
---

# /review-pr — Pre-PR diff review (read-only)

**Review aspects (optional):** `$ARGUMENTS` — default: all applicable aspects.

**Inspired by:** [Anthropic pr-review-toolkit](https://github.com/anthropics/claude-plugins-official/tree/main/plugins/pr-review-toolkit)

**Rule:** `@pr-review-loop` · Do **not** commit or push. Humans decide; report findings only.

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

3. **Select agents** (Task subagent or pr-review-toolkit equivalents):

   | Signal in diff | Agent / focus |
   |----------------|---------------|
   | Always | **code-reviewer** — CLAUDE.md, AGENTS.md, iPix defaults (confidence ≥80 only) |
   | `*.test.ts`, new logic | **pr-test-analyzer** — gaps rated 8–10 = blocker |
   | `catch`, fallbacks, API routes, edge fn | **silent-failure-hunter** |
   | New types / Zod schemas | **type-design-analyzer** |
   | Comment/doc changes | **comment-analyzer** (advisory only) |
   | iPix paths | **migration-reviewer** · **security-reviewer** · **qa-reviewer** · **mastra-agent-reviewer** as applicable |
   | After 0 Critical/Important | **code-simplifier** (optional polish) |

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
