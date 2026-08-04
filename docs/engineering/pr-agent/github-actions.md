# PR-Agent Expert Sheet — GitHub Actions & Workflow Security

> Domain rules for PRs touching `.github/workflows/`, `pr-agent.yml`, CI gates, labels,
> or workflow-triggered review tooling. Sheet: `github-actions.md` · phase: C (on demand).

## Hard rules (BLOCKING if violated)

1. **Full SHA pinning only.** `uses:` refs are immutable 40-char SHAs — never `@vN` or `@main`.
2. **Least-privilege `permissions:`.** Declare exactly the scopes used; unspecified scopes
   = none by GitHub default. PR-Agent needs `contents: read + pull-requests: write +
   issues: write`; nothing more (contents: read is required to read `.pr_agent.toml` and
   repo context files from the default branch).
3. **No `pull_request_target`** with secrets, and **no `actions/checkout`** in the PR-Agent
   job — the tool reads PR data via GitHub APIs; checking out untrusted PR code inside a
   privileged workflow voids the isolation.
4. **Token-boundary command allowlist.** Manual `/review`, `/describe`, `/ask`, `/improve`
   only — matched with `endsWith(body,'/cmd') || startsWith(body,'/cmd ')` so
   `/review-malicious` and `/asker` never trigger. Restrict to `author_association` in
   `OWNER/MEMBER/COLLABORATOR` and to `github.event.issue.pull_request` (PR comments only —
   `issue_comment` fires on ordinary issues too).
5. **Actor check matches the event.** For `pull_request` events:
   `github.event.pull_request.user.type != 'Bot'`. For `issue_comment`:
   `github.event.sender.type != 'Bot'`. Do not swap them.
6. **Secrets never inline in YAML steps** — fanned into `env:` of the step that needs them;
   AWS static keys are pilot-only, tracked for OIDC migration (IPI-522 · PRAGENT-009).

## Config hygiene (IMPORTANT if violated)

- `restricted_mode = true`; `pr_reviewer.approve_pr_on_self_review = false`;
  `pr_code_suggestions.commitable_code_suggestions = false` stay explicit — the pilot
  never relaxes these to gain a feature.
- Context files load from the default branch (`repo_context_from_default_branch = true`).
- Debug output (`output_relevant_configurations`) is pilot-only and must be removed
  once PRAGENT-007 verification passes.
- `github_action_config.handle_push_trigger = false` stays pinned (workflow has no
  `synchronize`/`push` trigger — keep the pin as documentation).

## Labels the workflow respects

- `skip-ai-review` — skip automatic run (manual `/review` still allowed).
- `docs-only` — skip automatic run on documentation-only PRs.
Both must exist on the repo before the config references them.

## How to flag

`BLOCKING` — floating `@vN` pin; expanded `permissions:`; any checkout of PR head;
command without token-boundary/association gating; `pull_request_target` with secrets.
`IMPORTANT` — relaxed restricted-mode controls; default-branch context trust removed;
labels referenced in config before they exist.
