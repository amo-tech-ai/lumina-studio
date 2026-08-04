# PR-Agent × iPix — Plain-Language Summary

> Companion to the full audit: `tasks/pr-agent/pr-agent-plan.md` (approved with corrections, see §6).
> This document explains, in everyday language: what we're doing, why, what changes, and what's needed.

## 1. TL;DR

**Keep PR-Agent, don't replace it.** It's already installed, already catching real bugs, and costs
almost nothing to run. This plan gives it the iPix rulebook (so it reviews like a senior iPix
engineer), quiets its noise, removes duplicate bot reviewers, and proves its accuracy with a
short pilot before we trust it fully.

**Analogy.** PR-Agent is like a quality inspector on a factory line. He's already on the job and
finds real defects. The plan gives him the *line's* checklist (not a generic manual), tells him
to shut up when there's nothing wrong, and asks the boss to measure whether his calls are right
before promoting him.

**Reviewer verdict on the plan: 82/100 — strategy correct, approved after fixes.** Both reviewer
rounds are fully applied: the first 9-fix audit (`pr-agent-expert.md` §4.2) **and** the PR #802 — docs: PR-Agent (PRAGENT-001/002) audit baseline + reference registry
review's 10 findings (see §3.1). The docs `summary.md` + `pr-agent-plan.md` + `pr-agent-expert.md`
(IPI-928 · PRAGENT-001) and `reference-registry.md` (IPI-929 · PRAGENT-002) ship as **two separate docs-only PRs** so one
concern per PR. Nothing here is implemented yet; the expert pack (docs) is task
IPI-661 · PRAGENT-003 — Add iPix PR-Agent Review Contract and Expert Guidance and the
config/workflow is IPI-659 · PRAGENT-004 — Add Restricted PR-Agent Configuration and GitHub Workflow.

## 2. What PR-Agent is (one minute)

Every pull request (PR) is a proposed change to the codebase — like a "change request" form
before it ships. A human must review it. **PR-Agent is a free AI reviewer** that reads the PR
and posts a comment: what changed, what could break, what's missing.

Real proof it works: on PR #791 — IPI-915 · AUTH-FIX — E2E evidence: Sign out posts /auth/signout on preview it caught a **race condition** in a sign-out test — the test could
finish before the browser finished logging out, so CI would pass when it shouldn't. It named the
exact lines. That's the value we're keeping.

It runs as a GitHub Action on our own infrastructure (Amazon Bedrock, Qwen3 model), not a paid SaaS.
Cost today: a fraction of a cent per PR. It cannot approve, merge, or edit code — it only comments.

## 3. The verdict we received

An independent review scored the plan **82/100 — "mostly correct, fix before implementation"**:

| What it got right (11 items) | What it said to fix (9 items) |
|---|---|
| Keep PR-Agent (don't rebuild) | 1. Comment-trigger also needs a "is this a PR?" check |
| Minimal config (don't copy upstream) | 2. Version claim needs evidence (release tag vs package version) |
| Trusted context from `main` only | 3. Token limit value needs verification, not assumption |
| `restricted_mode` (can't push code) | 4. Skip-labels must be enforced in the workflow too, not just inside the app |
| Auto `/review` only, `/improve` manual | 5. Ignored-author list had an unverified entry |
| One persistent comment per PR | 6. "Only comments with real findings" needs a pilot check (security info could hide) |
| Suppress "no major issues" noise | 7. Context budget must be measured, not guessed |
| No checkout, no `pull_request_target` | 8. Debug config output must be pilot-only |
| Pilot with measurable gates | 9. Task names must use the full required format; OIDC is its own task |

**All nine fixes are now in the plan** (details in §6).

### 3.1 Second review round (PR #802) — all 10 findings folded in

The PR #802 review re-read the merged commit and added 10 more findings. All are applied to this doc-set:

1. **This PR is split into two docs-only PRs** — `summary.md` + `pr-agent-plan.md` + `pr-agent-expert.md`
   (PRAGENT-001 audit/planning) and `reference-registry.md` (PRAGENT-002 reference registry). One concern
   per PR (AGENTS.md rule #1).
2. **Config section-fix** — `repo_context_*`, `restricted_mode`, `ignore_*` now sit under `[config]`,
   not `[pr_reviewer]` (`pr-agent-expert.md` §6); only `num_max_findings` / `persistent_comment` /
   `publish_output_no_suggestions` stay in `[pr_reviewer]`.
3. **Manual-command allowlist** — the `issue_comment` branch now requires `author_association` in
   `OWNER/MEMBER/COLLABORATOR` **and** a token-boundary match on exactly `/review`, `/describe`,
   `/ask`, or `/improve` (whole comment or followed by a space — `/review-malicious` / `/asker`
   are rejected); the workflow gate describes the same rule.
4. **Non-absolute expert rules** — `extra_instructions` no longer says "migrations must be reversible,
   every table needs an org-scoped RLS policy, no Node APIs" — those were reworded to the evidence-based
   form from `pr-agent-expert.md` §4.2 (RLS + grants per IPI-896, forward-safe migrations, Worker-bound
   code vs `nodejs_compat` compatibility date).
5. **Task numbering aligned** — the rollout now uses the **official Linear `PRAGENT-001..010` map with
   full task names** everywhere (see §8); `reference-registry.md` keeps the upstream-verification
   evidence (it is not a parallel numbering scheme).
6. **Config defaults URL pinned** — registry links `configuration.toml` to the pinned commit SHA, not to
   mutable `main`; `main` is cited only as the version-upgrade source.
7. **No fake precision** — finding-quality does **not** require findings on clean pilot PRs; the
   seeded-defect corpus (§7.1) is where recall+precision are proven, and clean PRs must stay silent.
8. **`publish_output_no_suggestions = false`** — the noise-suppression switch is now explicitly `false`
   in every config sample (upstream sets it to avoid "no major issues" noise comments; `true` would
   re-enable them).
9. **Prompt-injection claim scoped** — "protects instructions from prompt-injection" now reads as
   "protects the repo context files" only, and the docs add a caution that PR title/body/comments/diff
   are still untrusted input.
10. **Expert pack sized at 6 sheets** — `commerce.md` + `github-actions.md` added so the plan, summary,
    and deliverable seam all agree on the 6-sheet expert pack (not 4).

## 4. What the plan improves — before and after

| | Today | After this plan | Plain-English win |
|---|---|---|---|
| **Reviewer knowledge** | Generic AI advice | Given the iPix rulebook (see §5) | Catches iPix-specific dangers: leaked DB keys, missing RLS, unproven local-filesystem/native-module assumptions on Cloudflare Workers |
| **Noise** | "No major issues detected" on clean PRs | Comments only when there's something real; one comment that updates in place | Developers stop ignoring bot comments — every comment means something |
| **Wasted work** | Reviews every human-opened PR on the three pull_request triggers | Skips drafts, dependabot/renovate, docs-only, and labeled `skip-ai-review` PRs | No spam, no wasted AI calls |
| **Bots** | 3 AI reviewers + Vercel all commenting (CodeRabbit is rate-limited and adding noise) | One clear voice; pause CodeRabbit; keep Copilot review off during pilot | One reviewer the team can learn to trust |
| **Cost** | Runs on `opened`/`reopened`/`ready_for_review` only (no push/`synchronize` trigger) | Same triggers, but skip-labels and the draft/bot gates stop the runner before it starts | Smallest possible AWS bill |
| **Safety** | Already good | Hardened: label gates in workflow + app, comment commands PR-only, restricted mode | Nothing can silently approve or push code |
| **Measurement** | No data on quality | ~5-PR **initial pilot** for signal, then a **promotion gate across ≥20 PRs** with a pass/fail scorecard (≥70% useful, <20% duplicates, <10% wrong) | We know it works before we rely on it |

## 5. Making PR-Agent an iPix stack expert

**The problem.** A generic AI reviewer doesn't know that a Supabase table without an RLS policy is
a merge-blocker, that v1 CopilotKit imports break our build, or that an unproven local-filesystem
assumption (e.g. reading a local file that the Worker build never bundles) breaks under
OpenNext/Workers — while plain `fs`/`path` usage under `nodejs_compat` is *not* automatically a defect.

**The fix — "the expert pack":** six short cheat-sheets (each ≤90 lines), stored on the default branch
so PR authors can't tamper with them. **Phase A (ships first) loads only `AGENTS.md` +
`docs/pr-review-guidelines.md`** within the 500-line default budget; the four highest-traffic sheets
(`supabase`, `mastra`, `copilotkit`, `cloudflare`) join in Phase B **only after a 3-PR measurement
gate passes** (and any budget raise toward ~800 lines happens then, driven by measurement); `commerce`
and `github-actions` stay Phase C on-demand (staged per `pr-agent-expert.md` §5):

| Sheet | What it teaches the reviewer |
|---|---|
| `supabase.md` | Guard rules (RLS + grants, forward-safe migrations, service-role never client-side) per the corrected wording in `pr-agent-expert.md` §4.2; Mercur owns the commerce catalog, Supabase doesn't |
| `mastra.md` | Agents live in `app/src/mastra/`; the registry key = agent id = `useAgent()` must all match; no direct DB writes that bypass the RPC/service/approval path |
| `copilotkit.md` | Only import paths the installed `app/package.json` supports (v2+AG-UI per the build guard); flags v1 imports against the repo's proven integration |
| `cloudflare.md` | OpenNext → Workers bound by the configured compatibility date + `nodejs_compat`; flag only behaviors not proven by the Cloudflare build + smoke tests (no blanket "no Node APIs") |
| `commerce.md` | Mercur owns the commerce catalog; what is / isn't a flag on `my-marketplace/` code |
| `github-actions.md` | SHA pinning, least-privilege `permissions`, secrets via env only; command + author allowlists for manual triggers |

**Real-world example of the payoff:** today a PR that adds a Supabase table without an RLS policy
gets "no major issues detected". After the expert pack, it gets a BLOCKING finding naming the exact
migration lines — exactly like the PR #791 race-condition catch.

**One honest limitation:** PR-Agent's fancier "Agent Skills" feature can't be used in our GitHub
Action deployment (skill paths are admin-only, and the action runner has no files). The cheat-sheet
approach achieves the same goal with a mechanism we can control.

## 6. The 9 fixes (what changed in the plan)

1. **Comment commands now require the comment to be on a PR** — a `/`-comment on a plain bug issue can no longer start the reviewer.
2. **Version claim corrected and split by source** (all verified 2026-08-04): latest **GitHub release tag `v0.41.1`** (published 2026-08-01 · source: GitHub Releases API); latest **PyPI package `0.39.0`** (uploaded 2026-07-05 · source: PyPI JSON API); **source-declared version `0.41.0`** in `pyproject.toml` at tag `v0.41.1` (source: GitHub contents API). The plan now says bump the pinned action SHA only as a separate, reversible step, never in the same PR as config.
3. **Token limit documented, not assumed** — `custom_model_max_tokens = 250000` stays (it was empirically validated during IPI-519 and has run green for weeks) but is flagged for re-verification on the Bedrock model's real limits when we bump versions.
4. **Skip-labels now enforced twice** — in the workflow (before the runner starts, saving cost) *and* in the config (app-level backstop); a maintainer can still manually `/review` a skipped PR.
5. **Author list cleaned** — only exact logins: `dependabot[bot]`, `renovate[bot]`; the CodeRabbit entry was removed (it reviews PRs, it doesn't author them).
6. **Noise-suppression flagged for pilot check** — the "only comment on real findings" setting can also hide security/ticket lines on clean PRs; we verify it doesn't before trusting it.
7. **Context budget is measured, not guessed** — Phase A ships at the upstream default 500 lines with only `AGENTS.md` + the contract loaded, and we measure three varied PRs before any expansion; the ~800-line figure is the **post-measurement Phase B target**, not the baseline. Keep the contract ≤120 lines, sheets ≤90.
8. **Debug config output is pilot-only** — on for the first 2–3 PRs, then off.
9. **Task naming fixed** — full `IPI-NNN · TASK-ID — Full Task Name` format everywhere (no placeholder task IDs); **OIDC is now its own task** (IPI-522 · PRAGENT-009 — Replace Static AWS Credentials With GitHub OIDC; it changes AWS trust, not just measurement).

## 7. What's needed to make it happen

Nothing exotic — mostly decisions, not engineering:

1. **Two GitHub labels** (`skip-ai-review`, `docs-only`) — 2 minutes, manual.
2. **A docs-only PR** — the review contract + 6 expert sheets (IPI-661 · PRAGENT-003 — Add iPix PR-Agent Review Contract and Expert Guidance).
3. **A config-only PR** — the new `.pr_agent.toml` + slimmed workflow (IPI-659 · PRAGENT-004 — Add Restricted PR-Agent Configuration and GitHub Workflow). No product code.
4. **One owner decision** — pause/downgrade the CodeRabbit app during the pilot.
5. **Already in place** — AWS Bedrock keys, pinned action SHA, least-privilege permissions.
6. **A short initial pilot** — ~5 representative PRs (UI, Supabase, Mastra/CopilotKit, Workers, docs-only),
   graded on usefulness and specialty-proof. This is the **initial pilot only** — the **production
   promotion decision requires evaluation across at least 20 PRs** (IPI-932 · PRAGENT-008). Note: the
   docs-only member is exercised through the **maintainer-only manual `/review`** path once the
   PRAGENT-004 workflow gates the `docs-only` label (auto-review skips labeled PRs), or dropped from
   the cohort if that workflow hasn't merged yet.
7. **Later (IPI-522 · PRAGENT-009 — Replace Static AWS Credentials With GitHub OIDC)** — swap static AWS keys for OIDC (no stored secrets).

**What it does NOT need:** no new servers, no subscription, no app install, no rewriting existing
code, no change to the human merge gate.

## 8. Execution order

Official Linear `PRAGENT-001..010` map (full task names):

```text
IPI-928 · PRAGENT-001 — Audit Existing PR-Agent and AI Review Configuration            → done (this doc + plan)
IPI-929 · PRAGENT-002 — Verify Upstream PR-Agent Best Practices and iPix Architecture Alignment  → reference registry docs
IPI-661 · PRAGENT-003 — Add iPix PR-Agent Review Contract and Expert Guidance          → docs-only PR
IPI-659 · PRAGENT-004 — Add Restricted PR-Agent Configuration and GitHub Workflow      → config-only PR
IPI-930 · PRAGENT-005 — Validate PR-Agent With Controlled Specialty Test Pull Requests → seeded-defect validation (1 defect each; quiet on clean)
IPI-660 · PRAGENT-006 — Pilot PR-Agent Across Representative iPix Pull Requests        → initial pilot: ~5 representative PRs, graded
IPI-931 · PRAGENT-007 — Consolidate Automated Pull Request Reviewers                   → pause CodeRabbit, keep Copilot review off
IPI-932 · PRAGENT-008 — Measure PR-Agent Accuracy, Noise, Security, and Cost           → promotion gate: ≥20 PRs evaluated, go/no-go
IPI-522 · PRAGENT-009 — Replace Static AWS Credentials With GitHub OIDC                → OIDC: replace static AWS credentials
IPI-933 · PRAGENT-010 — Test and Upgrade the Pinned PR-Agent Action Version            → separate, last (after measurement)
```

> Full detail: `tasks/pr-agent/pr-agent-expert.md` (PRAGENT-001 — expert configuration plan,
> reviewer v2 + v3 corrections applied: manual-command allowlist, seeded-defect gate, non-absolute
> expert rules, docs/config task split, `[config]` key placement, `publish_output_no_suggestions = false`, pinned SHA throughout the pilot).

## 9. Guardrails (non-negotiables)

- **Humans decide.** PR-Agent never approves, never merges, never writes code: `restricted_mode`
  blocks upstream operations that need `contents: write` (e.g. pushing changelog updates), and the
  dedicated controls pin the rest — approvals off (`pr_reviewer.approve_pr_on_self_review = false`)
  and committable code suggestions off (`pr_code_suggestions.commitable_code_suggestions = false`).
- **One concern per PR** — docs PR and config PR are never mixed (repo rule #1).
- **Trusted context only** — the reviewer's *repo context files* (contract + sheets) load from the
  default branch, so a PR author can't tamper with the review rulebook. The PR title/body/comments
  and diff are still untrusted input — they inform the review but never override the rulebook.
- **No secrets** — nothing sensitive is added to prompts or configs; AWS keys stay in GitHub Secrets.
- **Version bumps are separate, reversible changes** — never bundled with config work.

## 10. Success gate (how we'll know it worked)

| Metric | Pass bar |
|---|---|
| High-confidence useful findings | ≥ 70% |
| Duplicate findings | < 20% |
| Incorrect findings | < 10% |
| Added PR noise | Acceptable (one evolving comment, no empty comments) |
| Specialty proof | Seeded-defect corpus catches each planted defect; ≥ 3 of 5 pilot PRs show an area-specific finding *when one exists* (clean PRs must stay quiet, not be forced to find things) |
| Security | 0 issues introduced by the setup |
| Cost | Within existing AWS budget (currently pennies per PR) |
