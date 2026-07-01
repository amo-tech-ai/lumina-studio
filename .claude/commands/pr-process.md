---
description: "Run the full iPix PR process — auto-detect new branch vs existing PR and execute the right loop."
argument-hint: "[new|open|fix|ship|ready|status] [PR# or IPI-XXX]"
allowed-tools: ["Bash", "Glob", "Grep", "Read", "Task"]
---

# /pr-process — Full PR workflow orchestrator

**Arguments:** `$ARGUMENTS` — optional mode + PR/IPI reference.

**Rule:** `@pr-review-loop` · `@pr-workflow` · `@pr-fix`

**Principle:** Humans decide, AI assists, nothing happens silently. Report every gate; stop on failure.

---

## Injected context

- Branch: !`git branch --show-current`
- Git status: !`git status -sb`
- Diff vs main: !`git diff main...HEAD --stat 2>/dev/null || git diff --stat HEAD`
- Changed paths: !`git diff main...HEAD --name-only 2>/dev/null || git diff --name-only HEAD`
- Recent commits: !`git log -5 --oneline`
- Local HEAD: !`git rev-parse HEAD`
- Open PR for branch: !`gh pr view --json number,url,headRefOid,isDraft,mergeable,statusCheckRollup 2>/dev/null || echo "no open PR for current branch"`

---

## Modes

| Mode | When | Runs |
|------|------|------|
| **auto** (default) | No args or unknown | Detect → route (see below) |
| **new** | Feature done, no PR yet | Pre-PR loop |
| **open** | After verify, create PR | Push + `gh pr create` |
| **fix** | PR has review feedback | `@pr-fix` triage + fix |
| **ship** | Fixes done, push + resolve | `/pr-fix-ship` |
| **ready** | Mark merge-ready | `/pr-ready` |
| **status** | Audit only, no changes | CI + threads + diff summary |

**Parse args:**

```text
/pr-process                    → auto
/pr-process new                → pre-PR loop
/pr-process open               → push + create PR (draft)
/pr-process fix 170            → post-feedback fix loop
/pr-process ship PR#170        → verify → commit → push → resolve
/pr-process ready 170          → undraft + CI + bots
/pr-process status             → read-only dashboard
```

Extract PR number from `PR#170`, `170`, or URL.

---

## Auto-detect routing

Run this decision tree first (output the chosen mode):

```text
1. On main? → STOP. Create worktree branch first (`ipi/<task>-<slug>`).

2. Open PR exists for branch?
   a. Unresolved inline threads > 0 → mode: fix (then offer ship)
   b. Local uncommitted/unpushed changes + threads = 0 → mode: ship or open
   c. isDraft + CI pending → mode: ready
   d. CI green + threads = 0 → mode: status ("merge-ready")
   e. No PR yet + diff vs main → mode: new

3. Explicit arg overrides auto.
```

Fetch unresolved count:

```bash
gh api graphql -f query='
query { repository(owner:"amo-tech-ai", name:"lumina-studio") {
  pullRequest(number:<N>) {
    reviewThreads(first:100) { nodes { isResolved } }
  }
}}' --jq '[.data.repository.pullRequest.reviewThreads.nodes[] | select(.isResolved==false)] | length'
```

---

## Loop A — `new` (pre-PR)

Execute in order. **Stop** if any gate fails.

### A1. Review

Follow `.claude/commands/review-pr.md`:

- Run applicable review agents on `git diff main...HEAD`
- Output: Critical / Important / Suggestions / Strengths

**Gate:** If Critical > 0 → fix before continuing (loop A1 after fixes).

### A2. Fix

- Fix Critical + Important from review summary
- Smallest safe diff · one concern · no docs+code mix

### A3. Verify

Per `@pr-workflow` matrix from changed paths:

```bash
# Always if app/** touched:
cd app && npm run typecheck && npm test

# If app/**:
cd app && npm run lint

# If routes/config/middleware:
cd app && npm run build

# If supabase/migrations:
infisical run -- npm run supabase:verify-rls

# If supabase/functions:
npm run supabase:verify-edge
```

**Scope check:**

```bash
git status -sb
git diff --stat HEAD
git diff main...HEAD --stat
```

**Gate:** All verify commands green. New test failures vs main = blocker.

### A4. Commit safely

**NEVER stage:** `.env*`, `.mcp.json`, `.agents/**`, `skills-lock.json`, unrelated `docs/**`

- Stage allowlist only (changed product paths from diff)
- Commit only if user confirms OR `$ARGUMENTS` includes `commit` OR mode is `open`/`ship`
- Message: `feat(ipi-NNN): …` or `fix(ipi-NNN): …` — match `git log -5` style

### A5. Offer next

```text
Ready to push and open PR? → /pr-process open
Or re-review: → /review-pr
```

---

## Loop B — `open` (create PR)

**Preconditions:** On feature branch · verify green · not on `main`

```bash
git push -u origin HEAD
```

Create **draft** PR (unless user says otherwise):

```bash
gh pr create --draft --title "[IPI-XXX] SPEC-ID — Short name" --body "$(cat <<'EOF'
## Summary
…

## Changes
- …

## Verification
- [x] `cd app && npm run typecheck` (date)
- [x] `cd app && npm test` (date)
- [ ] …

## Risks
…

## Linear
IPI-XXX — …
EOF
)"
```

Then run **Loop E — `ready`** if user wants full bot review immediately.

---

## Loop C — `fix` (post-feedback)

Follow `.claude/commands/pr-fix.md` end-to-end:

1. **HEAD gate** — `headRefOid` == `git rev-parse HEAD`
2. **Phase 0** — skills + MCP audit from changed paths
3. **Phase 1** — triage table (Fix · Already fixed · Out of scope · Dismiss)
4. **Comment taxonomy** — inline thread vs bot summary vs CI
5. **Phase 2** — fix valid items only
6. **Phase 3** — verify

**Stop before commit** unless user says ship or mode continues to `ship`.

Offer: `/pr-process ship PR#N`

---

## Loop D — `ship`

Follow `.claude/commands/pr-fix-ship.md`:

1. Verify (typecheck, test, lint, scope)
2. Commit allowlist only → `fix(pr-<N>): address review — …`
3. Push → re-fetch `headRefOid`
4. GraphQL reply + resolve each fixed thread
5. Unresolved count must be **0**
6. Sign-off comment on PR
7. Phase 5 report from `@pr-fix`

Then offer: `/pr-process ready PR#N`

---

## Loop E — `ready`

Follow `.claude/commands/pr-ready.md`:

1. Undraft if needed: `gh pr ready <N>`
2. `gh pr checks <N>`
3. Unresolved thread count
4. Trigger: `cursor review` / `bugbot run` / `@coderabbitai review`
5. Output ready summary template

**Merge gate:** CI green + unresolved inline threads = 0 (+ human approval).

---

## Loop F — `status` (read-only)

No commits. Output dashboard:

```markdown
# PR Process Status

**Branch:** `…` · **HEAD:** `…`
**PR:** #N · draft? · mergeable?

## Diff
- Files changed vs main: N
- Uncommitted: yes/no

## CI
| Check | Status |

## Threads
- Unresolved inline: N (blocker if >0)

## Recommended mode
- `/pr-process new` | `fix` | `ship` | `ready` | merge-ready ✅
```

---

## Sub-commands (do not duplicate — delegate)

| Step | Command file |
|------|----------------|
| Pre-PR review | `.claude/commands/review-pr.md` |
| Fix feedback | `.claude/commands/pr-fix.md` |
| Resolve only | `.claude/commands/pr-fix-resolve.md` |
| Ship fixes | `.claude/commands/pr-fix-ship.md` |
| Ready gate | `.claude/commands/pr-ready.md` |
| Cleanup | `.claude/commands/clean-gone.md` |

---

## Hard rules

- Never commit from `main`
- Never stage secrets or `.agents/**`
- Never resolve threads without HEAD match + fix verified
- Never `--no-verify`
- Never auto-create branch from main — use worktree
- Docs-only changes → separate PR from code
- Stop on verify failure, migration need, or security issue

---

## Quick reference card

```text
NEW FEATURE (no PR yet):
  /pr-process new     → review → fix → verify → (commit) → /pr-process open

PR HAS COMMENTS:
  /pr-process fix 170 → triage → fix → verify → /pr-process ship 170

ALREADY FIXED, NEED RESOLVE:
  /pr-fix-resolve 170

READY FOR BOTS / MERGE CHECK:
  /pr-process ready 170

WHAT SHOULD I DO NOW?
  /pr-process status
  /pr-process          (auto-detect)
```
