---
description: "Mark PR ready — undraft, watch CI, trigger bots, summarize threads + checks."
argument-hint: "PR number or URL"
allowed-tools: ["Bash", "Read"]
---

# /pr-ready — Undraft PR + CI + bot review gate

**Arguments:** `$ARGUMENTS` — PR number (e.g. `170`) or full GitHub PR URL. Required.

**Use when:** Local verify passed, fixes pushed, ready for full Bugbot/CodeRabbit + human review.

**Rule:** `@pr-workflow` (`@pr-review-loop` referenced here previously — no such rule file exists anywhere in the repo, removed)

**Do not** commit code unless user separately asks. This command orchestrates PR state + checks only.

---

## Injected context

- PR: !`gh pr view $ARGUMENTS --json number,url,title,headRefName,headRefOid,isDraft,mergeable 2>/dev/null || echo "set PR in arguments"`
- Local branch: !`git branch --show-current`
- Local HEAD: !`git rev-parse HEAD`
- CI checks: !`gh pr checks $ARGUMENTS --watch=false 2>/dev/null || echo "n/a"`
- Unresolved threads: !`echo "fetch in Phase 3 — GraphQL count"`

---

## Workflow

### 1. Pre-flight

- Extract PR `<N>` from `$ARGUMENTS`
- Confirm local branch matches `headRefName` (or report mismatch — do not undraft from wrong checkout)

```bash
gh pr view <N> --json number,url,headRefName,headRefOid,isDraft,mergeable,statusCheckRollup
git rev-parse HEAD
git branch --show-current
```

**HEAD gate:** If fixing/resolving on same machine, `headRefOid` should match `git rev-parse HEAD`. If not, stop and checkout PR branch/worktree first.

### 2. Undraft (if needed)

```bash
gh pr view <N> --json isDraft --jq .isDraft
```

If `true`:

```bash
gh pr ready <N>
```

Report: was draft → now ready (or already ready).

### 3. CI + thread inventory

```bash
gh pr checks <N> --watch=false
gh pr view <N> --json statusCheckRollup,mergeable
```

Unresolved inline threads:

```bash
REPO="$(gh repo view --json nameWithOwner --jq '.nameWithOwner' 2>/dev/null || echo 'amo-tech-ai/lumina-studio')"
OWNER="${REPO%%/*}"
NAME="${REPO#*/}"
gh api graphql -f query='
query { repository(owner:"'$OWNER'", name:"'$NAME'") {
  pullRequest(number:<N>) {
    reviewThreads(first:100) {
      nodes { id isResolved path line
        comments(first:1) { nodes { author { login } body } }
      }
    }
  }
}}' --jq '{
  unresolved: [.data.repository.pullRequest.reviewThreads.nodes[] | select(.isResolved==false)],
  count: ([.data.repository.pullRequest.reviewThreads.nodes[] | select(.isResolved==false)] | length)
}'
```

### 4. Trigger bot review

On the PR, post or confirm:

```text
cursor review
```

or

```text
bugbot run
```

For CodeRabbit (if configured):

```text
@coderabbitai review
```

**Do not** claim bots ran — report "trigger requested" and note user may need to comment on PR manually if CLI cannot post.

Optional: post a short PR comment:

```markdown
## Ready for review
- Local verify: ✅ (paste commands run)
- HEAD: `<sha>`
- Draft cleared: yes/no
- Unresolved inline threads before bot pass: `<n>`
```

### 5. Summarize (output template)

```markdown
# PR Ready — #<N>

**URL:** <url>
**Branch:** `<headRefName>` @ `<headRefOid>`
**Draft:** cleared | was already ready

## CI
| Check | Status |
|-------|--------|
| … | ✅ / ❌ / pending |

**Mergeable:** yes/no

## Review threads
- Unresolved inline: **<n>** (merge blocker if >0 unless waived)
- Bot summary-only findings: not resolvable via GraphQL — track in PR comments

## Bots
- Bugbot/Cursor review: triggered | skipped (reason)
- CodeRabbit: triggered | skipped (reason)

## Next step
- Unresolved > 0 → `@pr-fix PR#<N>` or `/pr-fix-ship PR#<N>`
- Unresolved = 0 + CI green → merge when human approves
- CI red → fix and re-run `/pr-ready PR#<N>`
```

---

## When to use

| Situation | Command |
|-----------|---------|
| First time marking PR ready for full review | `/pr-ready PR#N` |
| After `/pr-fix-ship` pushed fixes | `/pr-ready PR#N` (re-trigger bots) |
| "Are we merge-ready?" audit | `/pr-ready PR#N` (read-only summary OK) |

---

## Related

- Before opening PR: `/review-pr` → verify → commit
- After feedback: `@pr-fix` → `/pr-fix-ship`
- Resolve only: `/pr-fix-resolve`
