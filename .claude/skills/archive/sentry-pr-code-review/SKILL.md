---
name: sentry-pr-code-review
description: >
  Review and fix issues flagged by Seer (Sentry Bug Prediction) in GitHub PR review
  comments. Use whenever the user mentions Seer, Sentry PR review, "Sentry comments",
  "Seer findings", "@sentry review", "fix Sentry issues on this PR", or pastes a PR
  URL/number alongside Sentry/Seer feedback. Also use when scanning open PRs for
  unresolved Seer comments, or when triage of PR bots should include Seer alongside
  Bugbot/CodeRabbit. Prefer this skill over generic PR comment scraping when the bot
  is Seer. Do NOT use for Sentry SDK setup / DSN / Next.js instrumentation (that is
  app observability config, not PR review). Do NOT use for Linear-only work with no
  GitHub PR. For full PR lifecycle (open/merge/thread resolve GraphQL) load
  [pr-workflow](../pr-workflow/SKILL.md) after Seer findings are triaged.
---

# Sentry / Seer PR Code Review

Triage and fix **Seer by Sentry** findings on GitHub PRs. Seer posts inline review
comments predicting bugs; this skill fetches them, verifies each against current code,
and either fixes or skips with an evidence-backed reason.

Companion: [pr-workflow](../pr-workflow/SKILL.md) for reply/resolve and merge gates.
Comment shape details: [references/seer-comment-format.md](references/seer-comment-format.md).

## Hard rules (iPix)

- **One concern per PR/commit** — Seer fixes stay on the same concern as the PR; do not
  bolt unrelated refactors onto a Seer pass.
- **Never mix docs + production** in the same commit.
- **Evidence over description** — confirm the issue still exists at the cited line before
  changing code. Do not approve or dismiss from the Seer summary alone.
- **Full task names** in user-facing text (`IPI-NNN · SPEC — Title`), never bare IDs.
- Default repo: `amo-tech-ai/lumina-studio` (override if the user names another).

## Prerequisites

- `gh` CLI authenticated
- [Seer by Sentry](https://github.com/apps/seer-by-sentry) installed on the repo

**Bot login is `seer-by-sentry[bot]`** — not `sentry[bot]` or `sentry-io[bot]`.

## Phase 1 — Fetch Seer comments

If the user gave a PR number/URL:

```bash
OWNER=amo-tech-ai REPO=lumina-studio PR=<N>
gh api "repos/$OWNER/$REPO/pulls/$PR/comments" --paginate \
  --jq '.[] | select(.user.login == "seer-by-sentry[bot]") | {id, path, line, original_line, commit_id, body, html_url}'
```

Also pull issue/PR conversation comments (Seer sometimes posts a summary there):

```bash
gh api "repos/$OWNER/$REPO/issues/$PR/comments" --paginate \
  --jq '.[] | select(.user.login == "seer-by-sentry[bot]") | {id, body, html_url}'
```

If no PR is given, scan recent open PRs:

```bash
OWNER=amo-tech-ai REPO=lumina-studio
gh pr list --repo "$OWNER/$REPO" --state open --json number,title --limit 20 \
  --jq '.[].number' | while read -r pr; do
  count=$(gh api "repos/$OWNER/$REPO/pulls/$pr/comments" --paginate \
    --jq '[.[] | select(.user.login == "seer-by-sentry[bot]")] | length')
  [ "$count" -gt 0 ] && echo "PR #$pr: $count Seer inline comments"
done
```

Optional helper: `scripts/fetch-seer-comments.sh <pr>` (same repo defaults).

If zero comments: check Seer app install, PR not draft, and that review was triggered
(`Ready for Review`, push while ready, or `@sentry review`).

## Phase 2 — Parse each comment

From the markdown body extract (see [references/seer-comment-format.md](references/seer-comment-format.md)):

| Field | Where |
|-------|--------|
| Bug description | Line starting with `**Bug:**` |
| Severity / confidence | `<sub>Severity: … \| Confidence: …</sub>` |
| Detailed analysis | `<summary>🔍 <b>Detailed Analysis</b></summary>` |
| Suggested fix | `<summary>💡 <b>Suggested Fix</b></summary>` |
| AI agent prompt | `<summary>🤖 <b>Prompt for AI Agent</b></summary>` |

Treat Seer's format as **best-effort** — it is not a stable API. If headings differ, read
the full body and map fields by meaning.

## Phase 3 — Verify & fix

For each finding, in order:

1. **Locate** — open `path` at `line` (or `original_line` if the diff moved).
2. **Still present?** — if a later commit already fixed it, mark **Skipped (already fixed)**.
3. **Real bug?** — read callers/context; classify Confirmed / False positive / Out of scope
   (same evidence standard as `task-accuracy`).
4. **Fix** — use Seer's suggested fix as a starting point, not gospel. Prefer the smallest
   safe change (ponytail ladder). Load the domain skill for the touched path
   (`mastra`, `cloudflare`, `ipix-supabase`, etc.).
5. **Regression** — run the focused verify matrix for that path before claiming done.
6. **Do not** expand into AC-F, registry redesign, or unrelated cleanup because Seer
   mentioned a nearby smell.

False positives: reply on the thread with evidence (optional) and list under Skipped —
do not "fix" correct code to silence the bot.

## Phase 4 — Report

ALWAYS use this template:

```markdown
## Seer Review: PR #[number] — [title]

### Resolved
| File:Line | Issue | Severity | Fix Applied |
|-----------|-------|----------|-------------|
| path:123  | desc  | HIGH     | what done   |

### Skipped (false positive, already fixed, or out of scope)
| File:Line | Issue | Reason |
|-----------|-------|--------|

**Summary:** X resolved, Y skipped
**Verification:** commands run + Pass/Fail
**Next:** push / request re-review / `@sentry review` if needed
```

After code fixes on an open PR: push the branch (user must ask before commit/push if their
rules require it), then optionally comment `@sentry review` for a fresh pass.

## Seer triggers (when comments appear)

| Trigger | Behavior |
|---------|----------|
| PR set to Ready for Review | Automatic prediction |
| Commit pushed while ready | Re-runs prediction |
| `@sentry review` on the PR | Manual full review |
| Draft PR | Skipped until ready |

## Common finding categories

| Category | Examples | Typical response |
|----------|----------|------------------|
| Type safety | Missing null checks, unsafe asserts | Guard or narrow types at the trust boundary |
| Error handling | Swallowed errors, empty `catch` | Surface or log with safe message; never silent data loss |
| Validation | Permissive inputs | Validate at API/edge boundaries only |
| Config | Missing env, wrong paths | Fix config or document required Infisical keys — no hardcoded secrets |

## Troubleshooting

| Symptom | Check |
|---------|--------|
| No Seer comments | App installed? PR ready (not draft)? |
| Wrong bot filter | Login must be `seer-by-sentry[bot]` |
| Partial `gh api` results | Pass `--paginate` |
| Stale line numbers | Diff moved — search by symbol / use `original_line` |
| Format mismatch | Read full body; update local notes in `references/` if recurring |

## Related skills

| Need | Skill |
|------|--------|
| Reply/resolve threads, merge gate | [pr-workflow](../pr-workflow/SKILL.md) |
| Bugbot-style local review | Cursor `review-bugbot` / repo `/review-pr` |
| Sentry Next.js SDK install | Not this skill — follow Sentry Next.js setup docs / wizard |
