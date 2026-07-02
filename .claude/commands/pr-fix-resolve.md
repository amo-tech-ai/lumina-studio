---
description: "Reply and resolve already-fixed PR review threads — no code changes unless user asks."
argument-hint: "PR number or URL"
allowed-tools: ["Bash"]
---

# /pr-fix-resolve — Reply + resolve only

**Arguments:** `$ARGUMENTS` — PR number (e.g. `170`) or full GitHub PR URL. Required.

**Use when:** Fixes are already pushed; threads need reply + GraphQL resolve only.

**Rule:** `@pr-review-loop` · `@pr-fix` (Phase 4 resolve protocol)

**Do not** commit, stage, or edit code unless user explicitly asks.

---

## Injected context

- PR: !`gh pr view $ARGUMENTS --json number,url,headRefName,headRefOid,isDraft 2>/dev/null || echo "set PR in arguments"`
- Local HEAD: !`git rev-parse HEAD`
- Branch: !`git branch --show-current`
- Unresolved threads: !`echo "run GraphQL thread count in Phase 1 — see @pr-fix"`
- CI: !`gh pr checks $ARGUMENTS --watch=false 2>/dev/null || echo "n/a"`

---

## Workflow

1. Extract PR number from `$ARGUMENTS`.

2. **HEAD gate** — must match before any resolve:

   ```bash
   gh pr view <N> --json headRefOid,headRefName
   git rev-parse HEAD
   ```

   If mismatch → checkout PR branch/worktree first. Stop if cannot match.

3. **Fetch unresolved threads** (GraphQL) — see `@pr-fix` Phase 1.

4. **Per thread:**
   - Read full comment body
   - Verify fix exists at current `headRefOid` (read file at path/line; MCP if DB claim)
   - If **not fixed** → skip; report as "needs /pr-fix"
   - If fixed → reply via GraphQL, then resolve:

   ```bash
   # Reply:
   REPO="$(gh repo view --json nameWithOwner --jq '.nameWithOwner')"
   gh api graphql -f query='
   mutation {
     addPullRequestReviewThreadReply(input: {
       pullRequestId: "'$PULL_REQUEST_ID'"
       body: "Fixed in <SHA>. Verified: <commands>."
     }) { comment { id } }
   }'

   # Then resolve:
   gh api graphql -f query='
   mutation {
     resolveReviewThread(input: {
       threadId: "'$THREAD_ID'"
     }) { thread { isResolved } }
   }'
   ```

5. **Re-count unresolved** — must be `0`:

   ```bash
   gh api graphql ... --jq '[.data.repository.pullRequest.reviewThreads.nodes[] | select(.isResolved==false)] | length'
   ```

6. **Bot summary-only findings** (not inline threads):
   - Do not use resolve API
   - Post PR comment referencing commit if addressed

7. **Sign-off comment** (recommended):

   ```markdown
   ## Review sign-off — all threads resolved ✅
   | Finding | Fix | Commit |
   |---------|-----|--------|
   | … | … | `<sha>` |
   Verified: `<commands>` on `<sha>`. Unresolved threads: 0.
   ```

8. **Output:** thread count before/after, list skipped (needs code fix), CI status.

---

## Do not

- Resolve without verifying fix at HEAD
- Resolve out-of-scope threads (reply only + follow-up Linear)
- Stage or commit `.env*`, `.mcp.json`, `.agents/**`, `skills-lock.json`
