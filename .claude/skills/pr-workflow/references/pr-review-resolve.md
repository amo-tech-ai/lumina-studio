# Review-thread taxonomy, git safety, resolve protocol

Shared core for both loops in [SKILL.md](../SKILL.md) — self-review before opening a PR, and
triaging bot/human comments after. Read once, apply in both places.

## Worktree + HEAD gate

Before triaging or fixing anything:

```bash
gh pr view <N> --json headRefOid,headRefName,isDraft
git rev-parse HEAD
git branch --show-current
```

- `headRefOid` must match local `HEAD` on the PR branch.
- Not on the PR's branch/worktree → **stop**. Never fix or resolve from a `main` checkout or
  a stale worktree — a "fix" verified against the wrong commit is worse than no fix.

## Git safety (run in parallel, before every commit)

```bash
git status -sb
git diff --stat HEAD
git diff main...HEAD --stat
git log -5 --oneline
```

## Stage allowlist

Stage **only** paths related to the current fix or feature:

```
app/** · supabase/** · my-marketplace/** · b2c-storefront/** · scripts/** (when in scope)
```

**Never stage:**

```
.env*
.mcp.json
.agents/**
skills-lock.json
docs/**                    (unless this is a docs-only PR)
unrelated config/lockfile churn
```

If `git status` shows any forbidden path touched, unstage and exclude before committing —
don't ask forgiveness after.

Don't auto-commit unless the user explicitly asks, or the workflow phase says to (e.g. a
"ship" step that verifies → commits → pushes → resolves in one explicit ask).

## Comment taxonomy — classify every thread before touching code

| Source | Merge blocker? | Action |
|--------|-----------------|--------|
| Inline review thread | Yes | Fix → GraphQL reply → `resolveReviewThread` |
| Bot summary review (e.g. CodeRabbit body, not inline) | No thread to resolve | Fix if valid → PR comment only |
| Codacy / DeepSource / CI check | Per check config | Fix in code, or dismiss in the external UI |
| Draft PR | Blocks full bot review | `gh pr ready <N>` before triggering Bugbot/CodeRabbit |

Then bucket every **unresolved inline thread**:

| Bucket | Meaning | Action |
|--------|---------|--------|
| **Fix** | Valid, in scope, not already fixed at HEAD | Minimal commit; cite the fix commit in the reply |
| **Already fixed** | Verify at the current line on the PR branch (+ MCP probe if it's a DB claim) | Reply with evidence; resolve |
| **Out of scope** | Real but not this PR's job | Reply + note a follow-up Linear title; **do not resolve** |
| **Dismiss** | Wrong assumption | Reply with skill/MCP/tsc evidence; resolve |
| **Waiver** (High/Critical only) | Valid but safe to defer for this PR | Document in the PR body (template in `pr-template.md`); resolve |

For a PR with many threads, track them in one table instead of triaging ad hoc — fill in
as you go, don't resolve until the row's Fix column is backed by evidence:

```markdown
| Thread | File | Severity | Valid? | Fix | Resolve? |
|---|---|:---:|:---:|---|:---:|
```

`Valid?` = did you verify the finding against current code (yes/no/stale). `Resolve?` = only
once Fix is done-and-verified, or the finding is proven false with cited evidence — never
resolve on a blank Fix column.

Rules that apply to all buckets:

- Never resolve without reading the **full** comment body, not just the title/summary line.
- Never claim "already fixed" without reading HEAD at that exact line (plus an MCP probe if
  the claim is about database/schema state — code that *looks* fixed can still be wrong at
  runtime).
- Cite evidence over memory when dismissing — a `tsc` run, a test, a skill doc, or a file/line,
  never "that's not how it works" from training data.
- Skipping a thread — including bot-only ones like optibot/CodeRabbit inline — counts as a
  merge blocker. Inventory every thread first, don't cherry-pick the obvious ones.

## GraphQL resolve protocol

Push first, then re-fetch `headRefOid` and cite **that** SHA in every reply — a reply that
cites a stale SHA is a dangling claim.

```bash
# 1. Reply
gh api graphql -f query='
mutation {
  addPullRequestReviewThreadReply(input: {
    pullRequestReviewThreadId: "<PRRT_...>"
    body: "Fixed in <sha>: <one-line what changed>. Verified: <command> passed."
  }) { comment { id } }
}'

# 2. Resolve
gh api graphql -f query='
mutation { resolveReviewThread(input: { threadId: "<PRRT_...>" }) {
  thread { isResolved }
}}'

# 3. Gate — must return 0 before merge
gh api graphql -f query='
query { repository(owner:"amo-tech-ai", name:"lumina-studio") {
  pullRequest(number:<N>) {
    reviewThreads(first:100) { nodes { isResolved } }
  }
}}' --jq '[.data.repository.pullRequest.reviewThreads.nodes[] | select(.isResolved==false)] | length'
```

Resolved threads still show under "Show resolved" on GitHub — that's normal. The gate is
**unresolved count = 0** (or every remaining one documented as an explicit out-of-scope reply
or waiver, never silently skipped).

Inventory query (list every thread with its resolve state, author, and a body snippet):

```bash
gh api graphql -f query='
query { repository(owner:"amo-tech-ai", name:"lumina-studio") {
  pullRequest(number:<N>) {
    reviewThreads(first:100) {
      nodes { id isResolved path line comments(first:1){nodes{author{login} body}} }
    }
  }
}}' --jq '.data.repository.pullRequest.reviewThreads.nodes[] | {id, isResolved, path, author: .comments.nodes[0].author.login, body: (.comments.nodes[0].body[0:120])}'
```

Include Bugbot, optibot, CodeRabbit, Copilot, and human reviewers in the inventory — not just
inline human threads.

Re-fetch threads ~10s after pushing to catch newly-posted bot comments. Re-trigger `cursor
review` / `bugbot run` if the diff changed by >50 LOC or touched a sensitive path (migrations,
RLS, auth, edge functions, secrets).

## CI gate

```bash
gh pr checks <N> --watch=false
gh pr view <N> --json statusCheckRollup,mergeable
```

Merge only when CI is green **and** unresolved inline threads = 0 (or every remaining one is a
documented waiver in the PR body).
