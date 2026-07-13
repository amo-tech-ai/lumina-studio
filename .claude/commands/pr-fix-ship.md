---
description: "End-to-end PR fix ship — verify, safe commit, push, resolve threads, sign-off."
argument-hint: "PR number or URL"
allowed-tools: ["Bash", "Read", "Grep"]
---

# /pr-fix-ship — Verify → commit → push → resolve → sign off

**Arguments:** `$ARGUMENTS` — PR number or URL. Required.

**Combines:** `@pr-fix` Phases 2–5 (git safety + resolve protocol are inlined in `pr-fix.md`, not a separate `@pr-review-loop` file — none exists in the repo).

**Commit:** This command **may** commit and push when verification passes. User invoking `/pr-fix-ship` is explicit consent.

---

## Injected context

- PR: !`gh pr view $ARGUMENTS --json number,url,headRefName,headRefOid,isDraft 2>/dev/null || echo "set PR in arguments"`
- Git status: !`git status -sb`
- Diff stat: !`git diff --stat HEAD`
- Branch diff: !`git diff main...HEAD --stat 2>/dev/null || echo "n/a"`
- Recent commits: !`git log -5 --oneline`
- Local HEAD: !`git rev-parse HEAD`
- Unresolved threads: !`echo "fetch after PR number known — see Phase 1"`

---

## Workflow

### 0. Pre-flight

- Extract PR `<N>` from `$ARGUMENTS`
- Confirm on PR branch/worktree (`headRefName` vs `git branch --show-current`)
- Run `@pr-fix` Phase 0 (skills + MCP audit) if not already done

### 1. Triage (if threads open)

- `@pr-fix` Phase 1 — bucket: Fix · Already fixed · Out of scope · Dismiss
- Show triage table before coding

### 2. Fix

- `@pr-fix` Phase 2 — smallest safe diff
- Skip if `/pr-fix-resolve` only was intended (no local changes)

### 3. Verify

- `@pr-fix` Phase 3a–3c (typecheck, test, lint, build, domain MCP)
- **Scope check:**

  ```bash
  git diff --stat HEAD
  git diff main...HEAD --stat
  ```

- **CI (if PR exists):** `gh pr checks <N> --watch=false`

### 4. Commit safely

Parallel inspect:

```bash
git status -sb
git diff --stat HEAD
git diff main...HEAD --stat
git log -5 --oneline
```

- Stage **allowlist only** — paths from triage/fix
- **Never stage:** `.env*`, `.mcp.json`, `.agents/**`, `skills-lock.json`, unrelated `docs/**`
- Commit: `fix(pr-<N>): address review — <summary>`
- Never `--no-verify`

### 5. Push

```bash
git push -u origin HEAD
```

Re-fetch `headRefOid` after push.

### 6. Resolve

- Run `/pr-fix-resolve` logic for each fixed thread
- Re-count unresolved = 0
- Re-trigger `cursor review` / `bugbot run` if diff >50 LOC or sensitive paths

### 7. Sign-off + report

- Post PR sign-off comment
- Output `@pr-fix` Phase 5 report template
- Include: CI status, unresolved thread count, HEAD sha

---

## Draft PR

If `isDraft: true` and full bot review needed:

```bash
gh pr ready <N>
```

Then re-trigger Bugbot/CodeRabbit after push.

**When merge-ready:** run `/pr-ready PR#N` — undraft, CI inventory, trigger bots, summarize threads.
