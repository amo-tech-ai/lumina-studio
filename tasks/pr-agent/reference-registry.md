# PR-Agent Reference Registry

> **Purpose:** single shared reference for the PR-Agent rollout — official source registry,
> current pinned versions, verified CLI commands, evidence/scorecard/rollback templates, and the
> source-authority order. Uses the reviewer-preferred 9-task sequence with the official Linear
> `PRAGENT-001..010` mapping (§7). Every PRAGENT linear task should link here instead of duplicating URLs.
> Companion docs land in the **PRAGENT-001 PR (#806)** — merge order is **#806 first, then this PR**;
> until #806 merges these repo-relative links are intentionally unresolvable:
> `tasks/pr-agent/pr-agent-plan.md` (audit + rollout) · `tasks/pr-agent/summary.md` (plain-language) · `tasks/pr-agent/pr-agent-expert.md` (expert pack design).

## 1. Source authority order

Always resolve conflicts in this order (highest wins):

1. **Current PR-Agent source code** — `pr_agent/settings/configuration.toml` (canonical supported settings).
   Read it at the **pinned commit** we run (`01569655d8b4825bbe599fd5b2a8de59d5c58390`) so config claims
   match what the Action actually loads today; `/main` is the version-upgrade look-ahead source, not the
   authority for the current pin.
2. **Official PR-Agent documentation** — https://docs.pr-agent.ai/
3. **Current release notes / changelog** — GitHub releases
4. DeepWiki / community mirrors — **navigation aid only, never config truth**

> The The-PR-Agent GitHub repo is the upstream. `qodo-ai/pr-agent` and legacy `codiumai/pr-agent`
> links found in older docs are stale mirrors — route nav through the canonical sources above.

## 2. Official source registry

### 2.1 PR-Agent (upstream)

| Source | URL |
|---|---|
| Repo (canonical) | https://github.com/The-PR-Agent/pr-agent |
| Config defaults — current pin (canonical settings) | https://github.com/The-PR-Agent/pr-agent/blob/01569655d8b4825bbe599fd5b2a8de59d5c58390/pr_agent/settings/configuration.toml |
| Config defaults — `main` (version-upgrade look-ahead only) | https://github.com/The-PR-Agent/pr-agent/blob/main/pr_agent/settings/configuration.toml |
| Docs – configuration options | https://docs.pr-agent.ai/usage-guide/configuration_options/ |
| Docs – usage/automation | https://docs.pr-agent.ai/usage-guide/automations_and_usage/ |
| Docs – GitHub install | https://docs.pr-agent.ai/installation/github/ |
| Docs – review tool options | https://docs.pr-agent.ai/tools/review/ |
| Docs – additional configs | https://github.com/The-PR-Agent/pr-agent/blob/main/docs/docs/usage-guide/additional_configurations.md |
| Releases | https://github.com/The-PR-Agent/pr-agent/releases |
| Current pin (ours) | commit `01569655d8b4825bbe599fd5b2a8de59d5c58390` |

### 2.2 AWS (OIDC + Bedrock)

| Source | URL |
|---|---|
| `aws-actions/configure-aws-credentials` (official) | https://github.com/aws-actions/configure-aws-credentials |
| GitHub OIDC in AWS (official guide) | https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-aws |
| AWS IAM – create OIDC IdP | https://docs.aws.amazon.com/IAM/latest/UserGuide/grid_roles_providers_create_oidc.html |
| AWS IAM – role for GitHub OIDC | https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_create_for-idp_oidc.html |
| AWS Bedrock IAM/security | https://docs.aws.amazon.com/bedrock/latest/userguide/security-iam.html |
| Monsterwalk (recommended walkthrough incl. CLI + console) | https://aws.amazon.com/blogs/security/use-iam-roles-to-connect-github-actions-to-actions-in-aws/ |

### 2.3 Reviewer consolidation

| Source | URL |
|---|---|
| CodeRabbit docs (config reference) | https://docs.coderabbit.ai/reference/configuration |
| CodeRabbit config overview | https://docs.coderabbit.ai/guides/configuration-overview |
| CodeRabbit auto-review controls | https://docs.coderabbit.ai/configuration/auto-review |
| GitHub Copilot code review (about) | https://docs.github.com/en/copilot/concepts/agents/code-review |
| GitHub Copilot – configure automatic review | https://docs.github.com/en/copilot/how-tos/copilot-on-github/set-up-copilot/configure-automatic-review |
| GitHub REST – apps/installations | https://docs.github.com/rest/apps/installations |
| GitHub REST – rulesets | https://docs.github.com/rest/analyze/rules |

### 2.4 iPix stack expert-sheet anchors (IPI-661)

| Domain | Official docs to ground the sheets in |
|---|---|
| Supabase | RLS: https://supabase.com/docs/guides/database/postgres/row-level-security · API security (grants): https://supabase.com/docs/guides/api/securing-your-api · migrations: https://supabase.com/docs/guides/deployment/database-migrations |
| Mastra | Agents: https://mastra.ai/docs/agents/overview · Tools (`createTool`): https://mastra.ai/docs/agents/using-tools · Workflows: https://mastra.ai/docs/workflows/overview · HITL/approval: https://mastra.ai/docs/agents/agent-approval |
| CopilotKit (canonical) | v2 ref: https://docs.copilotkit.ai/reference/v2 · Mastra HITL: https://docs.copilotkit.ai/mastra/human-in-the-loop · tail-based: https://docs.copilotkit.ai/integrations/mastra/human-in-the-loop/tool-based |
| Cloudflare/OpenNext | OpenNext for Cloudflare: https://opennext.js.org/cloudflare · Next.js on Workers: https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/ · wrangler: https://developers.cloudflare.com/workers/wrangler/ |
| Commerce (Mercur) | Mercur docs + `my-marketplace/`: https://github.com/ampere/mercur (repo) · Medusa: https://docs.medusajs.com/ |
| GitHub Actions | Security hardening: https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions · pinning to SHA: https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions#using-third-party-actions |

## 3. Current pinned versions (verified 2026-08-03)

| Component | Ours | Upstream latest | Notes |
|---|---|---|---|
| PR-Agent GitHub Action | commit `01569655d8b4825bbe5` (2026-07-10) | tag `v0.41.1` (2026-08-01) | Shallow: current pin is ~3 weeks behind latest; soon: `PyPI` package still 0.41.0 |
| `configure-aws-credentials` | `aws.*` static keys (no Action) | `v6.2.3` (2026-07-22) | Pin full SHA at implementation; never float `@vN` |
| Bedrock model | `bedrock/qwen.qwen3-coder-next` | – | region `us-east-1`; static keys → OIDC (official PRAGENT-009 · IPI-522) |

## 4. Verified CLI commands

### 4.1 GitHub CLI (evidence collection)

```bash
# current repo config snapshot
gh api repos/amo-tech-ai/lumina-studio/contents/.pr_agent.toml --jq '.content' | base64 -d

# current workflow snapshot
gh api repos/amo-tech-ai/lumina-studio/contents/.github/workflows/pr-agent.yml --jq '.content' | base64 -d

# recent runs of the action (success/skipped/short-circuit)
gh api repos/amo-tech-ai/lumina-studio/actions/workflows/pr-agent.yml/runs --paginate

# pilot pool of PRs (official PRAGENT-006 · IPI-660 — pilot)
gh pr list --repo amo-tech-ai/lumina-studio --state merged --limit 50 \
  --json number,title,url,files,labels,mergedAt

# per-PR comments (review findings + persistent comment updates)
gh api repos/amo-tech-ai/lumina-studio/issues/<PR>/comments --paginate

# reviewer capability matrix (official PRAGENT-007 · IPI-931 — consolidate)
gh api repos/amo-tech-ai/lumina-studio/installations
gh api repos/amo-tech-ai/lumina-studio/rulesets
gh api repos/amo-tech-ai/lumina-studio/branches/main/protection
```

### 4.2 Upstream verification (feeds official PRAGENT-001 audit + PRAGENT-010 version bump)

```bash
gh api repos/The-PR-Agent/pr-agent/releases/latest
gh api repos/The-PR-Agent/pr-agent/commits/<PINNED_SHA>
# config at the audited pin — `ref` selects the commit; omitting it reads drifting default-branch main (§1 rule)
gh api "repos/The-PR-Agent/pr-agent/contents/pr_agent/settings/configuration.toml?ref=01569655d8b4825bbe599fd5b2a8de59d5c58390"
gh api repos/The-PR-Agent/pr-agent/tags --paginate
```

### 4.3 Controlled defect iteration (official PRAGENT-005 · IPI-930 — seeded defects)

```bash
# install the exact source the pinned Action runs — floating PyPI latest drifts out of sync with production (§1)
pip install "git+https://github.com/The-PR-Agent/pr-agent@01569655d8b4825bbe599fd5b2a8de59d5c58390"
export GITHUB_TOKEN=...          # required: CLI authenticates to GitHub to fetch the PR (docs.pr-agent.ai/installation/locally/)
export OPENAI_KEY=...            # or Bedrock env for qwen3
# real override, not a comment — without it the default `publish_output=true` posts every local trial to the PR
python -m pr_agent.cli --pr_url=<PR_URL> --config.publish_output=false review
```
CLI still needs a real PR URL — create one tiny temporary branch + PR per seeded defect, tune locally, run the GitHub-action once, then close without merging. The Action workflow only fires on `opened` / `reopened` / `ready_for_review` — **not** on subsequent pushes — so open the temp PR as a **draft** (the automatic run happens before tuning), tune locally, then mark **ready for review** to trigger the one post-tuning Action run. **This corpus is where precision is proven — a clean PR that produces no findings is a pass; do not force findings on real PRs.**

### 4.4 Cost/measurement (official PRAGENT-008 · IPI-932) — proxy only, no custom dashboard first

```bash
aws cloudwatch list-metrics --namespace AWS/Bedrock
# filter to Amazon Bedrock — without --filter this returns TOTAL account spend and corrupts the cost scorecard
aws ce get-cost-and-usage --time-period Start=YYYY-MM-DD,End=YYYY-MM-DD \
  --granularity DAILY --metrics UnblendedCost \
  --filter '{"Dimensions":{"Key":"SERVICE","Values":["Amazon Bedrock"],"MatchOptions":["EQUALS"]}}'
```

## 5. Shared evidence / scorecard template

For every measured PR (copy the row):

| PR | Category | Expected risk | Findings | Useful | Duplicates | Incorrect | Noisy | file:line | latency | run id | Bedrock proxy | Verdict |
|---|---|---|---|---|---|---|---|---|---|---|---|---|

Fixed primer:

```text
Target: ≥3–5 PRs (3 historical merged w/ known outcomes + 2 live/edit)
Expert success = correct domain rule + correct touched file + no unsupported claim.
Score findings = useful / duplicate / incorrect / noisy.
```

### 5.1 Measured baseline (IPI-928 audit, 2026-08-03)

| Metric | Value | Source |
|---|---|---|
| Review LLM latency | ~13.8s call + ~1.1s output (run 508) | Actions run log |
| Token usage | ~11.3K total (10K prompt / 331 completion) | LiteLLM log |
| Wall-clock (runs 507–514) | 44–85s per run, all success | Actions API |
| Failures / timeouts | 0 of 6 recent runs | Actions API |

Treat per-PR cost as `estimated` until AWS cost explorer attribution exists (official PRAGENT-008 — measure).

## 6. Rollback template

Every config/CI/security PR must document:

```text
- What changed                               # .pr_agent.toml key | workflow step | IAM policy
- Trim source-of-truth                        # git revert <PR>/<sha> | `aws iam delete-role` | … 
- Signal to roll back                         # the failure/error/slowdown observed
- Isolation countermeasure                  # pinned SHA, no pull_request_target, no checkout of untrusted PR code
- Data loss risk: none / <describe>          # schema-free, config only
```

## 7. Linear linkage (preferred 9-task sequence ↔ official Linear IDs)

The rollout uses the reviewer-preferred **9-task sequence** (matches `summary.md` §8, `pr-agent-plan.md`
Gantt, `pr-agent-expert.md` §9). Official Linear has 10 IDs — including the **verify-upstream** task
(IPI-929) that produced this very registry — so official numbers are +1 offset for 003–010. Map:

| Preferred | Task | Official PRAGENT | IPI | Priority | Status | Links this registry |
|---|---|---|---|---|---|---|
| 001 | Audit existing AI review config | PRAGENT-001 | IPI-928 | High (P2) | Todo | ✅ evidence: repo files + runs |
| 002 | Expert pack: review contract + 6 sheets | PRAGENT-003 | IPI-661 | Medium (P3) | Todo | ✅ doc URLs |
| 003 | Restricted config + workflow | PRAGENT-004 | IPI-659 | High (P2) | Todo | ✅ config keys + install docs |
| 004 | Seeded-defect validation PRs | PRAGENT-005 | IPI-930 | High (P2) | Todo | ✅ CLI + temp-PR patterns |
| 005 | Pilot across representative PRs | PRAGENT-006 | IPI-660 | High (P2) | Backlog | ✅ gh CLI + scorecard |
| 006 | Consolidate reviewers | PRAGENT-007 | IPI-931 | Medium (P3) | Backlog | ✅ reviewer sources |
| 007 | Measure accuracy/noise/cost | PRAGENT-008 | IPI-932 | Medium (P3) | Backlog | ✅ cost/API sources |
| 008 | OIDC (static → GitHub OIDC) | PRAGENT-009 | IPI-522 | Urgent (P1) | Backlog | ✅ AWS docs + exact SHA pinning |
| 009 | Test + upgrade pinned version | PRAGENT-010 | IPI-933 | High (P2) | Backlog | ✅ releases/tags |

**Official-only task (keeps Linear IDs contiguous):**

| Official | Task | IP | Notes |
|---|---|---|---|
| PRAGENT-002 | Verify upstream PR-Agent (this registry + verification) | IPI-929 | Runs with the audit; produces and maintains this reference registry |