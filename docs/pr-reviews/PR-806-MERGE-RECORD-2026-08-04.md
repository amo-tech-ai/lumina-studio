# PR #806 — Merge Record

**Task:** IPI-928 · PRAGENT-001 — Audit Existing PR-Agent and AI Review Configuration
**PR:** `docs(pr-agent): add PRAGENT-001 audit and rollout baseline` (#806)
**Merge SHA:** `c4fd61ceb768ed4113acc862b841c55b8f2e02fd` (squash, `main`)
**Author:** amo-tech-ai · **Merged:** 2026-08-04 01:09:55 -0400

---

## Purpose

Add the PRAGENT-001 audit, rollout plan, and expert-pack design for the existing PR-Agent /
AI review configuration. The documents explain how PR-Agent is deployed today (GitHub Action,
Bedrock `qwen.qwen3-coder-next`), what it has already caught in real iPix PRs (e.g. PR #791 —
a sign-out race condition), where duplicate-review noise and security gaps exist, and the
dependency-ordered task sequence (`PRAGENT-001..010`) for safely rolling out a restricted,
stack-aware configuration. This is a documentation-only change; no reviewer behavior, workflow,
or config changed as part of this PR. It supersedes the audit-doc portion of PR #802; the
companion reference registry (PRAGENT-002) ships separately in `ipi/929-pragent-002-registry`.

## Files / systems changed

- `tasks/pr-agent/summary.md` (new, +210) — plain-language audit summary and before/after table.
- `tasks/pr-agent/pr-agent-plan.md` (new, +608) — full audit, rollout Gantt, proposed
  `.pr_agent.toml` / workflow diffs (proposals only, not applied), pilot and scoring plan.
- `tasks/pr-agent/pr-agent-expert.md` (new, +400) — 7-file expert-pack design (review contract +
  6 stack cheat sheets), staged context-loading plan, manual-command allowlist design, seeded-defect
  validation plan.
- `tasks/prime/01-plan.md` (existing file, header updated) — marked **SUPERSEDED**, pointing to the
  `tasks/pr-agent/` set as the single source of truth; its verified findings (model string, region
  env, pinned Action SHA, `pr_actions` ↔ `pull_request.types` pairing) were folded into the new plan.
- No changes to `.pr_agent.toml`, `.github/workflows/pr-agent.yml`, application code, Supabase
  migrations/policies, Cloudflare deployment config, Mastra/CopilotKit runtime code, AWS credentials,
  or GitHub repository/label settings — all explicitly out of scope per the PR description.

## Tests / CI results

- Documentation-only change; no application build, lint, or test suite applies to the content itself.
- Per the final commit message, markdownlint was run clean on all three new files (no
  MD040/MD022/MD047/MD032 findings) and `git diff --check` was clean; the diff was confirmed to
  touch only the four markdown files listed above (no workflow/TOML/migration/code changes).
- Standard repository CI still applies to the PR as merged; no CI failures are recorded against
  this merge.

## Production impact

None. This PR does not change application code, Supabase migrations or policies, Cloudflare
deployment behavior, Mastra or CopilotKit runtime code, `.pr_agent.toml`, `.github/workflows/pr-agent.yml`,
AWS credentials, or GitHub settings. The live PR-Agent Action continues to run exactly as it did
before this merge (auto `/review` on `opened`/`reopened`/`ready_for_review`, Bedrock
`qwen.qwen3-coder-next`, pinned Action SHA `01569655d8b4825bbe599fd5b2a8de59d5c58390`).

## Known limitations

- The documents are a **plan and audit only** — the proposed `.pr_agent.toml`, workflow hardening
  (manual-command allowlist, skip-labels), and the 6-file expert pack are not yet implemented; they
  are scoped to follow-up tasks (PRAGENT-003 onward).
- Upstream PR-Agent version claims are recorded as three distinct, separately-sourced facts (GitHub
  release tag `v0.41.1`, PyPI package `0.39.0`, `pyproject.toml` source version `0.41.0`, all verified
  2026-08-04) rather than a single "latest version" — the pinned Action SHA is intentionally left
  unchanged pending a later, separate upgrade task (PRAGENT-010).
- The two GitHub labels referenced by the proposed config (`skip-ai-review`, `docs-only`) do not yet
  exist in the repository; creating them is a manual step deferred to the config task (PRAGENT-004).
- The reviewer-overlap findings (CodeRabbit rate-limiting, GitHub Copilot auto-review status) are
  point-in-time observations (as of 2026-08-03/04) and may drift before the consolidation task
  (PRAGENT-007) runs.

## Rollback / cleanup notes

- Additive, docs-only change across three new files plus a header edit to one existing file —
  revertable with `git revert c4fd61c` with no impact on running systems, secrets, or infrastructure.
- No migrations, feature flags, workflow changes, secrets, or deployments to clean up.

## Follow-up tasks

- IPI-929 · PRAGENT-002 — Verify Upstream PR-Agent Best Practices and iPix Architecture Alignment
  (reference registry; companion PR `ipi/929-pragent-002-registry` / PR #807).
- IPI-661 · PRAGENT-003 — Add iPix PR-Agent Review Contract and Expert Guidance (docs-only: review
  contract + 6 expert sheets).
- IPI-659 · PRAGENT-004 — Add Restricted PR-Agent Configuration and GitHub Workflow (config/workflow-only:
  proposed `.pr_agent.toml`, hardened `pr-agent.yml`, and the two new GitHub labels).
- IPI-930 · PRAGENT-005 — Validate PR-Agent With Controlled Specialty Test Pull Requests (seeded-defect
  precision/recall gate).
- IPI-660 · PRAGENT-006 — Pilot PR-Agent Across Representative iPix Pull Requests (~5-PR initial pilot).
- IPI-931 · PRAGENT-007 — Consolidate Automated Pull Request Reviewers (pause/downgrade CodeRabbit,
  keep Copilot review off during pilot).
- IPI-932 · PRAGENT-008 — Measure PR-Agent Accuracy, Noise, Security, and Cost (production promotion
  gate across ≥20 PRs).
- IPI-522 · PRAGENT-009 — Replace Static AWS Credentials With GitHub OIDC.
- IPI-933 · PRAGENT-010 — Test and Upgrade the Pinned PR-Agent Action Version (after PRAGENT-008
  measurement).