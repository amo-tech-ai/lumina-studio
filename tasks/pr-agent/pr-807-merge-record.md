# Merge Record

**Task:** [IPI-929 · PRAGENT-002 — Verify Upstream PR-Agent Assumptions](https://linear.app/amo100/issue/IPI-929)
**PR:** [#807](https://github.com/amo-tech-ai/lumina-studio/pull/807) — docs(pr-agent): add PRAGENT-002 reference registry
**Merge SHA:** `522d79d4d70120c98a5f67c617e56cb8a6446c68` (squash-merged to `main`, parent `c4fd61ceb768ed4113acc862b841c55b8f2e02fd`)
**Merged:** 2026-08-04T01:20:51-04:00
**Recorded:** 2026-08-04

## Squashed commits (folded into merge)

- `docs(pr-agent): PRAGENT-002 reference registry — pinned upstream config + task mapping`
- `docs(pr-agent): resolve #807 P2 review findings — official task IDs, pinned fetches, safe local loop`
- `docs(pr-agent): address PR #807 review — registry accuracy + official task map`

## Purpose

Adds a single shared reference registry for the PR-Agent follow-up rollout (PRAGENT-002 through
PRAGENT-010): source-authority order, official documentation/repo links, pinned versions and
commit SHAs, verified CLI commands, a shared pilot scorecard, a rollback template, and the
official Linear `PRAGENT-001..010` task map. Documentation-only; supersedes the registry portion
of PR #802. The companion PRAGENT-001 audit docs are tracked separately in the already-merged
PR #806.

## Files / systems changed

| Path | Change |
| --- | --- |
| `tasks/pr-agent/reference-registry.md` | New file (+216 lines) — reference registry only, no code |

No application code, database schema/RLS, Cloudflare/Vercel deployment config, Mastra/CopilotKit
runtime behavior, `.pr_agent.toml`, `.github/workflows/pr-agent.yml`, AWS credentials, IAM roles,
or GitHub settings were touched.

## Tests / CI at merge

- Docs-only change; no application, database, or infra test suites are triggered by this path.
- Normal repository CI applied (standard PR checks); no build, migration, or RLS gates apply to
  a markdown-only diff.
- Review cycle: 8 unresolved review threads on the registry (accuracy of task IDs, pinned
  commit SHA formatting, Seer scope boundary wording, MD031 lint, baseline metric sourcing,
  rollback wording, Linear numbering) were resolved in-PR prior to merge.

## Production impact

**None.** Documentation only — no production application code, schema, deployment configuration,
runtime behavior, PR-Agent configuration/workflow, or credentials were changed.

## Known limitations

- Registry pins are a point-in-time snapshot (verified 2026-08-03); the PR-Agent Action pin
  (`01569655d8b4825bbe599fd5b2a8de59d5c58390`) is already noted in the registry as ~3 weeks
  behind upstream `v0.41.1` — tracked for the version bump in PRAGENT-010, not this PR.
  - `configure-aws-credentials` in this registry still reflects the pre-OIDC static-key state;
  migrating to OIDC is explicitly scoped to PRAGENT-009, not this PR.
- Cost figures in §5.1 are marked `estimated` pending AWS Cost Explorer attribution (PRAGENT-008).

## Rollback / cleanup notes

- What changed: added one new markdown file, `tasks/pr-agent/reference-registry.md`.
- Revert source of truth: `git revert 522d79d4d70120c98a5f67c617e56cb8a6446c68` (or delete the
  file) — no other files depend on it existing.
- Signal to roll back: none expected; docs-only addition with no runtime coupling.
- Isolation: none required — the file is inert reference material, not loaded by any workflow,
  build, or runtime process.
- Data loss risk: none (no schema, no state).

## Follow-ups

Per the registry's official Linear `PRAGENT-001..010` map (§7):

- **PRAGENT-003 · IPI-661** — Add iPix PR-Agent Review Contract and Expert Guidance (Todo)
- **PRAGENT-004 · IPI-659** — Add Restricted PR-Agent Configuration and GitHub Workflow (Todo)
- **PRAGENT-005 · IPI-930** — Create Seeded Defect PRs to Validate Review Quality (Todo)
- **PRAGENT-006 · IPI-660** — Run Initial PR-Agent Pilot on Representative PRs (Backlog)
- **PRAGENT-007 · IPI-931** — Consolidate AI Reviewers (Backlog)
- **PRAGENT-008 · IPI-932** — Measure PR-Agent Accuracy, Noise and Cost (Backlog)
- **PRAGENT-009 · IPI-522** — Replace Static AWS Credentials With GitHub OIDC (Backlog, Urgent/P1)
- **PRAGENT-010 · IPI-933** — Test and Upgrade the Pinned PR-Agent Action Version (Backlog)