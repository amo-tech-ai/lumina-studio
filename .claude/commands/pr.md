---
description: "iPix PR orchestrator — auto-detect state, run the right workflow, ask before commit."
argument-hint: "[new|open|fix|ship|ready|status|resolve|clean] [PR#]"
allowed-tools: ["Bash", "Glob", "Grep", "Read", "Task"]
---

# /pr — PR workflow orchestrator (primary entry point)

**Aliases:** `/pr` · `/pr-process` (same command)

**Arguments:** `$ARGUMENTS` — optional subcommand + PR reference.

**Rules:** `@pr-review-loop` · `@pr-workflow` · `@pr-fix` · `/worktree`

**Principle:** One command you run 95% of the time. It **detects state**, **reports findings**, **delegates** to focused subcommands — and **never commits, pushes, or resolves without explicit user approval** unless subcommand is `ship` (user invoked ship explicitly).

---

## Injected context

- Branch: !`git branch --show-current`
- Worktree: !`git worktree list 2>/dev/null | head -10`
- Git status: !`git status -sb`
- Diff vs main: !`git diff main...HEAD --stat 2>/dev/null || git diff --stat HEAD`
- Changed paths: !`git diff main...HEAD --name-only 2>/dev/null || git diff --name-only HEAD`
- Recent commits: !`git log -5 --oneline`
- Local HEAD: !`git rev-parse HEAD`
- Open PR: !`gh pr view --json number,url,headRefName,headRefOid,isDraft,mergeable,statusCheckRollup 2>/dev/null || echo "no open PR"`

---

## Subcommands

| Subcommand | Delegates to | Commits? |
|------------|--------------|----------|
| **`/pr`** (none) | Auto-detect → run one phase, **stop at gate** | No |
| `/pr new` | `/review-pr` + verify prep | No |
| `/pr open` | push + draft PR | No (push only) |
| `/pr fix [N]` | `/pr-fix` triage + fix | **Ask first** |
| `/pr ship [N]` | `/pr-fix-ship` | Yes (explicit) |
| `/pr resolve [N]` | `/pr-fix-resolve` | No |
| `/pr ready [N]` | `/pr-ready` | No |
| `/pr status [N]` | dashboard only | No |
| `/pr clean` | `/worktree clean` + `/clean-gone` | No |

Extract PR `N` from `170`, `PR#170`, or URL.

---

## Phase 0 — Always run first (every `/pr` invocation)

Output a **state banner** before any action:

```markdown
# /pr — state detection

| Check | Result |
|-------|--------|
| Branch | `…` |
| On main? | yes → **STOP** |
| Worktree | main / isolated @ `…` |
| Commits vs main | N |
| Uncommitted | N files |
| Open PR | #N draft/open/none |
| HEAD vs PR | match / mismatch |
| CI | pass/fail/pending |
| Unresolved threads | N |
| **Recommended** | `/pr <subcommand>` |
```

### 0a. Worktree gate

```bash
git worktree list
git rev-parse --show-toplevel
```

- On `main` with feature work → **STOP.** Recommend: `npm run worktree:add -- IPI-XXX slug`
- HEAD ≠ `headRefOid` when PR exists → **STOP.** Checkout correct worktree first.
- Nested worktree → **STOP.** Return to main repo checkout.

### 0b. Git safety (always inspect, never skip)

```bash
git status -sb
git diff --stat HEAD
git diff main...HEAD --stat
git log -5 --oneline
```

Flag forbidden paths if modified: `.env*`, `.mcp.json`, `.agents/**`, `skills-lock.json`

### 0c. PR + CI + threads (if PR exists)

```bash
gh pr view <N> --json headRefOid,isDraft,mergeable,statusCheckRollup
gh pr checks <N> --watch=false
# unresolved inline threads (GraphQL) — see @pr-fix
```

---

## Auto-detect decision tree (`/pr` with no args)

Run Phase 0, then pick **one** path. Execute that path only — **do not chain commit/push/resolve silently.**

```text
/pr
│
├── On main?
│      → STOP. Suggest: npm run worktree:add -- IPI-XXX slug
│
├── HEAD ≠ headRefOid (PR exists)?
│      → STOP. cd to PR worktree
│
├── Unresolved inline threads > 0?
│      → Run /pr fix (Phase FIX)
│      → STOP after fixes + verify. Ask: "Run /pr ship?"
│
├── CI failing on open PR?
│      → Report failed checks + logs hint
│      → Fix if code issue; else STOP with CI link
│
├── Uncommitted changes + open PR + threads = 0?
│      → Show diff summary. Ask: "Commit? → /pr ship" or "Discard?"
│
├── Commits vs main but no PR?
│      → Run /pr new (review + verify)
│      → STOP. Ask: "Open draft PR? → /pr open"
│
├── Draft PR + threads = 0?
│      → Run /pr ready (status + undraft offer)
│      → STOP unless user confirms undraft
│
├── Open PR + CI green + threads = 0 + not draft?
│      → /pr status → "Merge-ready ✅"
│
└── No diff, no PR, clean branch?
       → "Nothing to do. Start implementation or /worktree add"
```

**Never** auto-run the full fix→ship→ready chain in one turn.

---

## Phase NEW (`/pr new`)

1. **Review** — delegate `.claude/commands/review-pr.md` (read-only)
2. **Report** Critical / Important / Suggestions / Strengths
3. **Fix** Critical + Important only if user says continue
4. **Verify** — `@pr-workflow` matrix for changed paths
5. **STOP** — show staged-files preview. Ask:

   ```text
   Ready to commit? (yes → stage allowlist + commit, or /pr open after commit)
   Re-review? → /review-pr
   ```

**Does not commit** unless user explicitly says yes in this session.

---

## Phase OPEN (`/pr open`)

Preconditions: feature branch · verify green · user approved commit (or already committed)

1. `git push -u origin HEAD`
2. `gh pr create --draft` with `@pr-workflow` template body
3. **STOP** — ask: "Run /pr ready for bot review?"

---

## Phase FIX (`/pr fix [N]`)

Delegate `.claude/commands/pr-fix.md` Phases 0–3:

1. Comment taxonomy (inline vs bot summary vs CI)
2. Triage table — show before coding
3. Fix valid items
4. Verify

**STOP before commit.** Output:

```text
Fixes ready locally. Next:
  /pr ship [N]  — commit + push + resolve (explicit)
  /pr resolve [N] — if already pushed
```

---

## Phase SHIP (`/pr ship [N]`)

User invoking `/pr ship` = **explicit consent** to commit + push + resolve.

Delegate `.claude/commands/pr-fix-ship.md` end-to-end.

Then offer: `/pr ready [N]`

---

## Phase RESOLVE (`/pr resolve [N]`)

Delegate `.claude/commands/pr-fix-resolve.md` — reply + resolve only, no code unless user asks.

---

## Phase READY (`/pr ready [N]`)

Delegate `.claude/commands/pr-ready.md`:

- Undraft (confirm if was draft)
- CI inventory
- Thread count
- Suggest bot triggers (`cursor review`, `@coderabbitai review`)
- Merge-ready summary

---

## Phase STATUS (`/pr status [N]`)

Read-only dashboard:

```markdown
# PR status — #N

**Branch** · **HEAD** · **PR state** · **mergeable**

## Diff / dirty
## CI table
## Threads (unresolved = blocker)
## Worktree health (npm run worktree:audit -- --write)

## Next recommended command
```

---

## Phase CLEAN (`/pr clean`)

1. `npm run worktree:audit`
2. Show safe-to-delete list
3. **Ask before each remove**
4. Delegate `/clean-gone` for `[gone]` branches

---

## Approval gates (hard rules)

| Action | Requires |
|--------|----------|
| `git add` / `git commit` | User says yes, or `/pr ship` |
| `git push` | User says yes, or `/pr ship` / `/pr open` |
| GraphQL resolve | Fix verified at HEAD + user OK or `/pr ship` |
| `gh pr ready` | User confirms undraft |
| `git worktree remove` | User confirms + audit shows safe |
| `--force` anything | User explicit + backup stash |

Never `--no-verify`. Never stage forbidden paths.

---

## Subcommand files (power users)

| File | When to use directly |
|------|---------------------|
| `.claude/commands/review-pr.md` | Review only, no orchestration |
| `.claude/commands/pr-fix.md` | Deep fix session |
| `.claude/commands/pr-fix-resolve.md` | Resolve only |
| `.claude/commands/pr-fix-ship.md` | Full ship |
| `.claude/commands/pr-ready.md` | Ready gate only |
| `.claude/commands/worktree.md` | Worktree ops |
| `.claude/commands/clean-gone.md` | Branch cleanup |

---

## Quick reference

```text
Day to day:     /pr
Pre-PR review:  /pr new
Open draft PR:  /pr open
Bot comments:   /pr fix 170  →  /pr ship 170
Already pushed: /pr resolve 170
Mark ready:     /pr ready 170
Dashboard:      /pr status
Cleanup:        /pr clean
```

**95% of the time:** type `/pr` and follow the recommended next step.
