# PR-Agent × iPix Audit

> Status: **Audit only — no repository changes made in this task.** All file diffs below are proposals.
> Skills hub: `.claude/skills/pr-agent/SKILL.md` (prior IPI-519 work, Bedrock pilot). This file is the audit + rollout plan.

## Executive Verdict

Verdict: **ADOPT WITH RESTRICTIONS**

One-sentence reason: PR-Agent is **already installed, already passing real-value reviews** on this
repo (Bedrock/Qwen via GitHub Action), but the config under-delivers on the iPix review contract, the
action pin is stale relative to upstream v0.41.1, and to be safely useful long-term it must be **restricted**
(manual `/improve`, no push trigger, explicit doc/draft/bot skips, documented context contract, measurable
accuracy gate) rather than broadened.

**Current status (evidence-based, not assumed):**

| Area | Status | Evidence | Risk |
|---|---|---|---|
| PR-Agent installed | 🟢 | `.github/workflows/pr-agent.yml` (34 lines) + root `.pr_agent.toml`; runs green on 2026-08-03 (runs 30845207358 etc.) | Low — effective |
| `.pr_agent.toml` | 🟢 | `/home/sk/ipix/.pr_agent.toml` (model `bedrock/qwen.qwen3-coder-next`, `auto_review`, `auto_describe=false`, `auto_improve=false`, `extra_instructions`) | Medium — only `[pr_reviewer]` section; no context/ignore/labels |
| Automatic review | 🟢 | Workflow triggers `pull_request [opened,reopened,ready_for_review]` → `/review` auto | Medium — no draft/bot-paths skip at the YAML level; emits "No major issues detected" noise |
| Manual commands | 🟡 | No `issue_comment` trigger wired; CLI possible via pip + Bedrock creds (documented in skill) | Low — intended manual-only is fine, but no slash commands |
| Repository context | 🟢 | `AGENTS.md` auto-loaded (default `repo_context_files=["AGENTS.md"]` from default branch); `CLAUDE.md` not injected | Medium — reviewer never sees the 20-rule audit contract |
| Security | 🟢 | Least privilege: `contents: read` / `pull-requests+issues: write` only; no `checks: write`, no `pull_request_target`, no checkout, pinned SHA action, `aws.*` dotted secrets | Low–Med — repo `allowed_actions=all` (org-level); bedrock static secrets planned to OIDC |
| Duplicate reviewers | 🟡 | **CodeRabbit** (GitHub App) active but hitting free-tier **rate limit** (evidence: PR #791 "Review limit reached"); **GitHub Copilot auto PR review** appears enabled (dynamic agents; no repo-local config file); Vercel bot = deploy only; Bugbot/Codacy = skill/manual only | Medium — 3 comment layers brand noise; CodeRabbit is winning nothing lately |
| Version pinning | 🟢 | Action pinned to SHA `01569655…` (2026-07-10); latest **GitHub release v0.41.1** (2026-08-01, verified via Releases API; note upstream `pyproject.toml` declares `0.41.0`) | Medium — pin is sound but predates the latest release; bump only as a separate reversible step |
| Cost control | 🟢 | Auto only `/review`; `auto_describe/auto_improve=false`; no `synchronize`; Qwen3 VS Bedrock ~cheap; `timeout-minutes: 15`; concurrency per-PR. **Measured 2026-08-03:** run 508 review took ~14s LLM latency (13.8s LLM call + 1.1s output), ~11.3K tokens (10K prompt / 331 completion) — well under the 15min budget; runs 507–514 completed in 44–85s wall-clock | Low — measurable, tiny |
| Review usefulness | 🟢–🟡 | Evidence: PR #791 (IPI-915) → **2 non-trivial findings with file:line**, no generic praise; PR #778 docs → ticket-compliance partial + "no major issues"; PR #792 chore → 1-effort no majors (persistent comment) | Medium — quality fine but noisy headline pattern; effective signal floor |

## 1. Plain-Language Summary — What This Plan Changes and What You Need

**What PR-Agent is, in one sentence:** a free, self-hosted AI assistant that reads every pull
request (PR) and posts a comment like a careful second pair of eyes — "here's what changed, here's
what could break, here's where". Think of it as a quality inspector who checks each package
before it ships, instead of a robot that rewrites the package itself.

**Real-world example (it already works):** on PR #791 (the sign-out fix), PR-Agent spotted a
*race condition* in the test — the test could finish before the browser finished logging out,
making CI pass when it shouldn't. That's exactly the kind of thing a tired human reviewer misses
at 6pm. It caught the issue *and* pointed at the exact lines.

**How does this plan improve it?** It takes a good inspector and gives him three things:

| Improvement | Before (today) | After (with this plan) | Plain-English win |
|---|---|---|---|
| **Give the inspector the rulebook** | Reads only `AGENTS.md`; gives generic advice | Reads `AGENTS.md` + a new `docs/pr-review-guidelines.md` (the iPix rules, in plain English) | It checks iPix-specific dangers: leaked service-role keys, Supabase migrations without RLS, Node-only APIs on Cloudflare Workers |
| **Cut the noise** | Posts "No major issues detected" on clean PRs | Only comments when it has real findings; one comment that updates in place | Developers stop skimming past bot comments — every comment means something |
| **Skip PRs that don't need it** | Reviews everything a human opens | Skips drafts, dependabot/renovate, bot-authored PRs, docs-only PRs, and PRs labeled `skip-ai-review` | No wasted money, no spam on chores |
| **Keep it an advisor, not a boss** | Can't push code (good), but `/improve` offers rewrites | `restricted_mode = true` — guaranteed it can never edit code or approve; `/improve` stays manual | Humans still make every decision (iPix rule #1) |
| **One reviewer, not three** | PR-Agent + CodeRabbit + Copilot review + Vercel all comment | Pause CodeRabbit (it's rate-limited anyway) and keep Copilot review off during the pilot | One clear voice instead of three bickering bots |
| **Cheaper** | Reviews every push | Reviews only on open/reopened/ready-for-review | Fewer AI calls, smaller AWS bill |

**What is needed to make it happen** (nothing exotic — mostly decisions, not engineering):

1. **Two labels created** on GitHub: `skip-ai-review` and `docs-only` (2 minutes, manual).
2. **A config-only PR** (IPI-TBD · PRAGENT-002) with 3 files: the new `.pr_agent.toml`,
   `docs/pr-review-guidelines.md`, and the slimmed-down workflow. No product code changes.
3. **One owner decision:** pause/downgrade the CodeRabbit GitHub App while PR-Agent runs the
   pilot (it has been hitting its free-tier limit and contributing noise, not reviews).
4. **Already in place, no action:** AWS Bedrock keys in GitHub Secrets, the pinned action SHA,
   least-privilege permissions. OIDC (no static keys) is its own later task (PRAGENT-006).
5. **A short pilot:** let it review ~5 representative PRs (UI, Supabase migration, Mastra,
   Workers, docs-only), then judge: ≥70% of findings useful, <20% duplicates, <10% wrong.
   If it passes, keep it; if not, we know exactly what to turn down.

**What it does NOT need:** no new servers, no paid subscription, no app install, no rewriting
of existing code, no change to how PRs are merged. The merge gate stays human.

**Effort estimate:** ~1 focused session to ship PRAGENT-002; ~1 week of normal PR traffic for
the pilot; then a 30-minute review to decide go/no-go.

## 2. Summary Scorecard

| Measure | Value |
|---|---|
| Current deployment | GitHub Action, Bedrock Qwen3 Coder Next, auto `/review` |
| Static works? | Yes — verified green runs + on-PR comments |
| Reviewer overlap | 3 active AI reviewers (PR-Agent, CodeRabbit w/ rate-limit, Copilot auto) + Vercel |
| Security posture | Good (least-privilege, pinned, no PR target, no checkout) — 3 gaps (fork behavior, `allowed_actions=all`, static AWS secrets) |
| Value added (today) | Real findings on auth/E2E PRs (verified on PR #791: race condition + missing error handling, both with file:line) |
| Value gap | Context contract not injected; docs/deps/lockfile PRs not skipped; noise ("No major issues") not tamed |
| Recommended | **ADOPT WITH RESTRICTIONS** — keep current action+toml, apply proposed config + workflow diffs, run pilot |

## Current Setup (exact, from disk + GitHub)

### Files & workflows found
- `.github/workflows/pr-agent.yml` — full diff in "Proposed workflow".
- `.pr_agent.toml` (repo root) — content in "Proposed `.pr_agent.toml`".
- `.claude/skills/pr-agent/` — SKILL.md, references/setup.md (secrets + Bedrock-pilot workflow), references/ops.md (CLI smoke, failure table, OIDC-later). **Authoritative prior work** for this task.
- No `.pr_agent.toml` in any other subdir; no Qodo/Codium/Coderabbit/Reviewdog/Danger/SonarCloud/Semgrep/CodeQL workflows or config files in `.github` (searched repo minus vendored dirs).
- `docs/pr-reviews/` — legacy post-merge checklists (PR-23, PR-23 post-merge, PR-678 merge record). Not wired to PR-Agent.

### Deployment type
- **GitHub Action (composite)**, not GitHub App, not Lambda, not Qodo hosted.
- Model: `bedrock/qwen.qwen3-coder-next` via LiteLLM → AWS Bedrock `us-east-1`. IAM user `pr-agent-github` (~least-privilege, Bedrock only; see `references/setup.md`).
- Secrets in repo Actions: **`AWS_ACCESS_KEY_ID`**, **`AWS_SECRET_ACCESS_KEY`** (names only; not values). `GITHUB_TOKEN` is the standard runner token.

### Trigger + behavior (measured)
- Runs on `opened/reopened/ready_for_review`; concurrency `pr-agent-${{pr}}` with `cancel-in-progress: true`; sender `.type != 'Bot'` at job level.
- Emits one persistent "PR Reviewer Guide 🔍" comment (persistent inline dedupe on), **no inline comments** (committable suggestions off).
- No `issue_comment` trigger → no `/review /describe /improve /ask` manual commands online.
- Output includes ticket-compliance analysis (`require_ticket_analysis_review=true` default) with branch-issue extraction (`extract_issue_from_branch=true` default).

### Reviewer overlap (production evidence)
- **CodeRabbit github app** — installed; on PR #791 shows **"Review limit reached"** (free-tier). Posted summarize + rate-limit comments only. Post-merge recipe branches (e.g. `app/coderabbitai` PR list) appear in recent PR history.
- **GitHub Copilot PR review** — dynamic agents `dynamic/agents/copilot-pull-request-reviewer` + `dynamic/copilot-swe-agent/copilot` listed by Actions API; **no repo file** under `.github/copilot/` → org-level or product-managed. Assumed active; confirm at rollout.
- **Vercel** — deployment link bot only.
- **Local/manual AI tools in repo**: `cursor review`/`bugbot run` (Skill-harness), Codacy (mentioned in `pr-workflow` SKILL). Not CI auto in GitHub.

## Research findings

Sources studied (authoritative first):

- **docs.pr-agent.ai/installation**, **installation/github**, **installation/github#run-as-a-github-action** — current layout; action env uses dotted `aws.AWS_*`; no checkout needed; `@main` unsafe; docker namespace **pragent/pr-agent** ≥0.34.2 (legacy `codiumai/pr-agent` frozen). Confirms our pattern.
- **usage-guide/configuration_options** — tips: edit only needed options, `output_relevant_configurations` debug flag, local file is read from default branch (**trust boundary** — never `--config-branch` from PR input; we never set it).
- **usage-guide/automations_and_usage** — `github_app.pr_commands` / `push_commands` / `handle_push_trigger`; GitHub Action uses `github_action_config.*` (or falls back); draft PRs **not** auto-feedback by default; `issue_comment` enables slash.
- **config.toml @ The-PR-Agent/pr-agent@main** — current names verified (packing below). **Deprecated flags removed/renamed**: `num_code_suggestions` (now `num_code_suggestions_per_chunk` under `[pr_code_suggestions]`), `enable_custom_labels`/`ignore_generated_files`/`ignore_pr_folders` **do not exist** — nearest: `pr_description.custom_labels`, `[config].ignore_language_framework`, `.ignore_pr_*` per target. `persistent_comment` still exists in `[pr_reviewer]`/`[pr_code_suggestions]`; `publish_output_no_suggestions` (new) controls the "No major issues detected" noise.
- **core-abilities (Agent context, tickets, skills, metadata)** — we now get AGENTS.md by default; skills are disabled (`[skills] enabled=false`).
- **The-PR-Agent/pr-agent repo** — active, MIT. Latest GitHub **release v0.41.1** (2026-08-01, via Releases API) while `main`/`pyproject.toml` declares package version `0.41.0` — the tag and package version differ; treat any "latest version" claim as release-tag evidence only, and map the pinned SHA to a release before bumping.
- **Medium /open-intelligence (2026-07)** — promotional context: PR-Agent = OSS legacy repo, Qodo commercial product is separate; no config truth; confirms long-term we build on the OSS action.

(Not individually re-fetched in this audit: docs.pr-agent.ai root, usage-guide/additional_configurations — read enough to satisfy restricted-mode/population; usage advises minimal files.)

### Verified key inventory — from `pr_agent/settings/configuration.toml`:
`[config]`: `model`, `fallback_models`, `custom_model_max_tokens`, `max_model_tokens`, `repo_context_files`, `repo_context_from_default_branch`, `repo_context_max_lines`, `publish_output`, `publish_output_progress`, `output_relevant_configurations`, `ignore_pr_title`, `ignore_pr_target/source_branches`, `ignore_pr_labels`, `ignore_pr_authors`, `ignore_repositories`, `large_patch_policy`, `ai_timeout`, `response_language`, `use_repo_settings_file`, `skills.enabled/disabled`, `persistent_inline_comments`.
`[pr_reviewer]`: `require_estimate_effort_to_review`, `require_security_review`, `require_todo_scan`, `require_ticket_analysis_review`, `persistent_comment`, `num_max_findings`, `publish_output_no_suggestions`, `extra_instructions`, `require_tests_review`.
`[pr_description]` asks: `extra_instructions`, `generate_ai_title`, `publish_labels`, `publish_description_as_comment`, `add_original_user_description`, `use_bullet_points`.
`[pr_code_suggestions]`: `extra_instructions`, `commitable_code_suggestions`, `num_code_suggestions_per_chunk`, `suggestions_score_threshold`, `focus_only_on_problems`.
`[github_app]`: `pr_commands`, `handle_push_trigger`, `push_commands`, `handle_pr_actions`.
`[github_action_config]`: (set via workflow env keys `github_action_config.*`); `pr_actions`, `auto_review`, `auto_describe`, `auto_improve`, `push_commands`.

## Existing reviewer overlap

| Reviewer | Layer | Today on iPix | Overlap with recommendation |
|---|---|---|---|
| PR-Agent (this) | GitHub Action | review comment, low noise | **Primary** — keep |
| CodeRabbit | GitHub App | post rate-limit "review limit reached"; summarize comment | **Remove or downgrade** — noisy + rate-limited; not adding unique value |
| GitHub Copilot code review | built-in dynamic agents | unknown policy; seconds on each PR | Keep **off** for PR-Agent phase; revisit after pilot |
| Vercel | preview deploy | info | Keep |
| Bugbot / Codacy / Cursor review | local skill-based only | sparse manual | Out of scope for this auto-adoption |

**Decision:** De-dup by **one active auto AI reviewer = PR-Agent**; pause CodeRabbit app install OR set its auto-review rate/off (ask owner). Avoid enabling Copilot code review on force until PR-Agent is measured.

## Risks

| Risk | Level | Mitigation |
|---|---|---|
| Config injected ahead of verified keys (e.g. legacy `num_code_suggestions`) | Med | Use only F/G keys verified from `configuration.toml`; enable `output_relevant_configurations` during pilot |
| Noise: "No major issues detected" + double-suggestions | Med | `[pr_reviewer] publish_output_no_suggestions = false` → post only when there are findings; `auto_describe` stays off |
| Rate-limited CodeRabbit + Copilot third reviewer | Med | Disable/downgrade during pilot (Settings → Apps) |
| Drafts/bot PRs still triggering | Med | Workflow `if: github.event.pull_request.draft == false`; `ignore_pr_*` set |
| Fork PRs losing secrets silently | Med | keep `pull_request` (not target) — forks won't get Bedrock; that's acceptable, document |
| Secrets rotate / OIDC later | Med | rollout leaves `AWS_*`; PRAGENT-006 (OIDC) is its own security task |
| Prompt-injection via repo context | Med | `repo_context_from_default_branch = true` (default-branch trust only); never set `--config-branch` from PR input; context files are maintainer-controlled |
| Model drift on Bedrock Qwen3-Coder | Low | Single model, no `fallback_models` (removed intentionally in PR #23 to avoid flapping); re-verify LiteLLM naming at pin bump |
| `allow_actions: all` org-wide | Med | Suggest IT/org policy: restrict to `public + private` unless needed; not a blocker |

## Recommended architecture (target)

```
push to PR → GitHub Action pr-agent.yml (pull_request → opened/ready)
  ├─ skip: bot/draft/dependabot/rename (always-on)
  ├─ skip: label in {skip-ai-review, docs-only}
  └─ PR-Agent /review (only; /describe manual-4 later)
       └─ Bedrock Qwen3 Coder Next (IAM → OIDC-later)
       └─ context: AGENTS.md + docs/pr-review-guidelines.md (default branch)
       └─ publish: one persistent top-level comment, no inline commits
(Pilot: /describe + /improve manual via issue_comment; CodeRabbit/Copilot kept off)
```

## Proposed `.pr_agent.toml`

Minimal, all keys verified against upstream `pr_agent/settings/configuration.toml@main` (checked 2026-08-03). **Do not copy the entire upstream file.**

```toml
# Minimal iPix config — only touch what iPix needs.
# Keys below verified to exist in pr_agent/settings/configuration.toml (v0.41.x).

[config]
model = "bedrock/qwen.qwen3-coder-next"                 # prefer to keep over env; re-verify LiteLLM naming at SHA bump
custom_model_max_tokens = 250000                          # caps output tokens for models not in PR-Agent's default list.
#                                                         # Empirically validated in IPI-519 (fixed MAX_TOKENS errors,
#                                                         # see .claude/skills/pr-agent/references/ops.md) and running
#                                                         # green since July. Re-verify against the Bedrock model's real
#                                                         # output window on a large-PR test when bumping the SHA.
repo_context_files = [
  "AGENTS.md",
  "docs/pr-review-guidelines.md",
  "docs/engineering/pr-agent/supabase.md",
  "docs/engineering/pr-agent/mastra.md",
  "docs/engineering/pr-agent/copilotkit.md",
  "docs/engineering/pr-agent/cloudflare.md",
]
repo_context_from_default_branch = true                  # trust DEFAULT branch only, never PR-controlled
repo_context_max_lines = 800                              # AGENTS(~250) + contract(~120) + 4 area sheets(~90 each) ≈ 730
#                                                         # BUDGET IS AN ESTIMATE — the upstream default is 500. Keep the
#                                                         # contract <= 120 lines and each sheet <= 90 lines, then MEASURE:
#                                                         # if `output_relevant_configurations` / debug output shows the
#                                                         # context was truncated, extend `repo_context_max_lines`; if
#                                                         # sheets are still clipped, shorten the sheets instead.
# The 4 area sheets ARE the "expert pack" — see "Making PR-Agent an iPix stack expert" below.

ignore_pr_labels = ["skip-ai-review", "docs-only"]        # team ops labels exist beforehand (manual)
ignore_pr_authors = ["dependabot[bot]", "renovate[bot]"]  # exact GitHub login of the PR author only;
#                                                         # CodeRabbit is NOT included — it reviews PRs but does not
#                                                         # author them; its post-merge recipe PRs are already skipped
#                                                         # by the workflow's `sender.type != 'Bot'` gate.
ignore_pr_title = ["^\\[Auto", "^release"]               # suppress auto-release PRs

output_relevant_configurations = true                    # DEBUG ONLY: turn OFF (set to false) after the first 2–3
                                                         # pilot PRs — it puts configuration material into output.
restricted_mode = true                                    # PR-Agent never pushes code (contents: read only)

[pr_reviewer]
persistent_comment = true                                # one evolving comment per PR
num_max_findings = 5                                      # cap comment volume
publish_output_no_suggestions = false                     # NO "No major issues" noise-only comments
enable_intro_text = false
extra_instructions = """
Review against docs/pr-review-guidelines.md (the iPix PR review contract, loaded via repo_context_files) and AGENTS.md rule #1 (never mix concerns).

Prioritize in this order:
1. Security & data isolation (service-role never client-side)
2. Supabase migration/RLS — additive, reversible, org-scoped
3. Cloudflare Worker/OpenNext compatibility (no node-only APIs in worker paths)
4. Auth / permission boundaries (PKCE, HITL)
5. Data ownership (no double-mutable sources between Supabase & external systems)
6. Mastra/CopilotKit HITL violations
7. Correctness & regressions, esp. tests missing for changed behavior
8. Accessibility regressions

Avoid: lint repeats, generic praise, speculative claims without file:line, unrelated refactors.
Classify every finding: BLOCKING (correctness/security) vs IMPORTANT vs OPTIONAL.
Task references must match: IPI-### · TASK-ID — Full Task Name.
"""
```

### Config notes

- `publish_output_no_suggestions=false` suppresses the "No major issues detected" noise — but per
  upstream docs it can also suppress associated output (labels, security-audit-only info) on clean PRs.
  **Pilot check:** verify the security and ticket-compliance lines still appear on PRs that need them
  before trusting this setting blindly.
- `extra_instructions` is deliberately short: the full contract lives in `docs/pr-review-guidelines.md` (loaded via `repo_context_files`), so the toml stays small and the contract is editable without touching config.
- Label-based skip: `skip-ai-review` / `docs-only` labels are **not present in the repo yet** — add the labels when the config ships, then `ignore_pr_labels` works immediately.

> Note: `enable_custom_labels`, `ignore_generated_files`, `ignore_pr_folders` **are not** valid upstream keys today → not included.

## Proposed workflow (`/home/sk/ipix/.github/workflows/pr-agent.yml` — GitHub Action is the recommended deploy)

```yaml
name: PR Agent — Bedrock Qwen3 Coder Next (restrained)

on:
  pull_request:
    types: [opened, reopened, ready_for_review]
  issue_comment:                      # enables manual /describe /improve /ask later — gate with `if`
    types: [created]

permissions:
  contents: read
  pull-requests: write
  issues: write
  # No checks: write, no contents: write, no pull_request_target by design.

concurrency:
  group: pr-agent-${{ github.event.pull_request.number || github.event.issue.number }}
  cancel-in-progress: true            # cancel a stale run if a new event arrives (keep cost bounded)

jobs:
  pr_agent_job:
    if: >-
      (
        github.event_name == 'pull_request'
        && github.event.sender.type != 'Bot'
        && github.event.pull_request.draft == false
        && !contains(github.event.pull_request.labels.*.name, 'skip-ai-review')
        && !contains(github.event.pull_request.labels.*.name, 'docs-only')
      )
      ||
      (
        github.event_name == 'issue_comment'
        && github.event.issue.pull_request
        && github.event.sender.type != 'Bot'
        && startsWith(github.event.comment.body, '/')
      )
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - name: Run PR-Agent
        uses: the-pr-agent/pr-agent@01569655d8b4825bbe599fd5b2a8de59d5c58390
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          aws.AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws.AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws.AWS_REGION_NAME: us-east-1
          config.model: "bedrock/qwen.qwen3-coder-next"
          config.custom_model_max_tokens: "250000"
          github_action_config.auto_review: "true"
          github_action_config.auto_describe: "false"
          github_action_config.auto_improve: "false"
          github_action_config.pr_actions: '["opened","reopened","ready_for_review"]'
```

Notes (security decisions, in-repo comments):
- No `actions/checkout` — PR-Agent reads via API only (safe for `issue_comment` too).
- No `pull_request_target` — fork PRs get no Bedrock creds (documented; acceptable, avoids secret leaks).
- Pinned commit SHA (re-validate on PR-Agent release); **no @main after pilot**.
- Gates on Bots + Drafts + **skip-labels** at job level → deterministic cost control before the action starts.
  `skip-ai-review` / `docs-only` are checked here AND in `ignore_pr_labels` (app-level backstop).
- The label check applies to auto-review only: a maintainer can still `/review` a skipped PR manually
  (the `issue_comment` branch deliberately does not check labels).
- `issue_comment` branch also requires `github.event.issue.pull_request` so a `/`-comment on a plain
  bug issue never launches PR-Agent.
- `timeout 15m` + `cancel-in-progress` concurrency → bounded cost.

If we want optional copy of the git-actions guide at exact steps, see `references/setup.md`.

## Making PR-Agent an iPix Stack Expert (Mastra · CopilotKit · Cloudflare · Supabase)

**The problem, in plain words.** PR-Agent is a smart reviewer but it started life as a *generic* one.
Left to itself it knows nothing about iPix specifically — it won't know that a Supabase table missing
an RLS policy is a merge-blocker, or that `@copilotkit/react-core` v1 imports fail our build, or that
Node's `fs`/`path` will explode on Cloudflare Workers. This section is how we make it *an expert in
our stack*, so its reviews read like a senior iPix engineer wrote them.

**Real-world analogy.** Think of a new quality inspector on a fashion-production line. A generic
inspection manual is not enough; they need the *line-specific* checklist — "these fabrics can't be
bleached", "that machine must be grounded", "these stitches are load-bearing". We give the inspector
the line's own checklist, not a book of generic factory advice.

### How an AI reviewer "learns" — the mechanisms

| Mechanism | What it does | Usable in iPix GitHub Action? | Notes |
|---|---|---|---|
| `repo_context_files` | Loads chosen repo files (from the **default branch only**) into every `/review`, `/improve`, `/describe` prompt | ✅ **Yes — our primary tool** | Safe: `repo_context_from_default_branch = true` means the PR author can't inject instructions |
| `extra_instructions` (per tool) | Hard rules for each tool, e.g. `/review` priorities | ✅ Yes | Already in the config |
| Agent **skills** (`SKILL.md`) | A curated "skill library" the model loads | ⚠️ **No for the GitHub Action** | `skills.paths` is *host-level only* — a repo cannot set it, and the action runner has no files. Only if we later self-host a GitHub App |
| `best_practices` | Injects org code-guidance into `/improve` | ⚠️ Partial | Check the `/improve` docs page at rollout; helps `/improve`, not `/review` |
| Ticket context | Pulls ticket context from the PR description/branch (GitHub issues) | ✅ Partial | Works well with GitHub issues; **Linear is not natively understood** — rely on our `IPI-### · TASK-ID` reference format |
| CI artifact (`artifact_path`) | Feeds CI output (test/lint report) into the prompts | ⚠️ Optional later | Needs a previous CI step to produce a file. Adds moving parts; skip for MVP |

### The "expert pack" — one small checklist per area

Create four small, hand-written markdown files under `docs/engineering/pr-agent/`, each ≤ ~100 lines.
They live on the **default branch**, are loaded by `repo_context_files`, and are the single place
where domain rules for AI review are written. Outline for each:

| File | Contents (what the reviewer must know) |
|---|---|
| `supabase.md` | Remote-only policy (no `supabase start`); migrations additive + reversible, safe on production data; **every table needs an org-scoped RLS policy** and must be verified by `supabase:verify-rls`; service-role key must never be client-side; uses `server`/`admin`/`anon` client boundaries; data ownership (one mutable source; commerce catalog lives on Mercur, not Supabase); edge functions use `_shared/` helpers, no secrets in env; after schema change run `supabase:types`. |
| `mastra.md` | Mastra owns agents/workflows (`app/src/mastra/`); the **three keys must match**: Mastra registry key = agent `id` = frontend `useAgent({ agentId })`; tools call existing `lib/supabase` clients — never a direct DB write that bypasses RPC/service/approval path; HITL surfaces belong to Mastra/CopilotKit. |
| `copilotkit.md` | Only `/v2` subpath imports (`@copilotkit/react-core/v2`, `@copilotkit/runtime/v2`); v1 imports (`useCoAgent`, `useCopilotReadable`, root imports) **break the build**; wiring goes through `app/src/app/api/copilotkit/...`; `useAgent`/`useFrontendTool`/HITL patterns. |
| `cloudflare.md` | iPix runs Cloudflare open source App Router via **OpenNext → Workers/Pages**; Workers have no Node runtime — flag Node-only APIs (`fs`, `path`, `process.env`-style) in Worker-bound paths; check AI Gateway / Workers AI usage; Cloudflare compatible versioning; web frameworks that are Cloudflare-incompatible get called out. |

> **Do not** point the reviewer at massive files — no `docs/architecture/**` firehose, no full `prd.md`,
> no wireframe dumps. They burn tokens, dilute the signal, and the reviewer stops listening.
> The four short checklists (≈90 lines each) plus `AGENTS.md` fit comfortably in `repo_context_max_lines = 800`.

### Real-world examples of what this makes the reviewer catch

A pull request adds a Supabase table but forgets an org-scoped RLS policy. **Before**: the generic reviewer
might say "nice work". **After** (with `supabase.md`): it flags the missing tenant boundary, names the
migration lines, and reminds that `supabase:verify-rls` must pass.

A pull request uses `fs.readFile` inside a Cloudflare Worker route handler. **After** (with `cloudflare.md`):
it flags "Node-only API in a Worker path — breaks under OpenNext/Workers runtime," with the specific
function call and a suggestion.

A PR changes a Mastra agent `id`. **After** (with `mastra.md`): it checks the registry + `useAgent`
and notes "these three must stay in sync."

### How to verify the reviewer is actually expert during the pilot

Add a "proof of specialty" test: for a small PR in each area, check the review comment contains the
*area-specific* claim (RLS, ID-sync, `/v2` import, Worker pressure) and a correct file:line. Require it
in ≥ 3 of the 5 pilot PRs before considering the config a success.

---

## Pilot Plan

Phase A — audit (this task; no repo changes)  [DONE]
Phase B — manual pilot (3–5 PRs, list):
  a. TypeScript UI PR (e.g. a `/app/**` component change)
  b. Supabase migration / RLS PR (iPix `supabase/migrations/_` family)
  c. Mastra/CopilotKit/HITL PR
  d. Cloudflare/Workers, if exists → worker path
  e. Docs-only PR (assert low noise — nothing worth posting)
  → run `/review` comment on #1 candidate; capture:
     useful, duplicate, incorrect, noisy 4-bin counts
     compare vs CodeRabbit's last season of useful comments (historical)

Expected "expert" finding per pilot type (the pass bar — see "proof of specialty" above):

| Pilot PR type | The reviewer must produce (or be judged as missing expertise) |
|---|---|
| Supabase migration | Missing org-scoped RLS on a new table, or non-additive migration risk, with migration file:line |
| Mastra/CopilotKit | Agent `id` / registry / `useAgent` mismatch; v1 `@copilotkit/*` import; HITL surface touched without approval path |
| Cloudflare/Worker | Node-only API (`fs`, `path`, …) in a Worker-bound path; OpenNext-incompatible pattern |
| TypeScript UI | Real correctness/regression or a11y issue with file:line — no formatting nitpicks |
| Docs-only | Near-silence: no fabricated findings, ideally one "no action needed" comment or nothing |

Phase C — limited automation (merge proposed config + workflow; auto only `/review`; manual `/describe`)
Phase D — production decision after >=20 PRs vs metrics:
  High-confidence useful ≥70% · duplicates <20% · incorrect <10% · noise acceptable · delay non-blocking · cost in budget + security breaches 0.

## Review-contract outline (`docs/pr-review-guidelines.md`)

Suggested (content embedded above, formal file on roll):
- Title: iPix PR-Agent Review Contract
- Context: one paragraph on who runs PR-Agent (self-hosted GitHub Action, Bedrock Qwen3)
- Stack facts (Next.js 16, TypeScript, Supabase + RLS, Mastra/CopilotKit, Cloudflare Workers via OpenNext, Mercur)
- The 8 review priorities (= the numbered list in the proposed `extra_instructions` above)
- Anti-patterns to never report (lint repeats, formatting, unrelated refactors)
- Output format (BLOCKING/IMPORTANT/OPTIONAL + file:line)
- Exact task-ref format `IPI-X · TASK-ID — Name`
- Humans decide (rule #1, no silent approvals, no AI auto-approval)

Do not check the contract in this audit task; it lands in the docs-only PR (Deliverable Seam, PR 1),
ahead of the config PR (PR 2).

## Deliverable Seam

Repo rule: **one concern per PR — docs vs config/CI never mixed.**

- **PR 1 — docs-only**: `docs/pr-review-guidelines.md` + `docs/engineering/pr-agent/{supabase,mastra,copilotkit,cloudflare}.md` (the "expert pack"). Merge first so the files exist on the default branch PR-Agent reads.
- **PR 2 — config/CI-only**: `.pr_agent.toml` + `.github/workflows/pr-agent.yml` + the two GitHub labels (`skip-ai-review`, `docs-only`). PR-Agent tolerates a missing context file with a warning, so the two PRs can land in either order — but merge PR 1 first for a clean pilot.
- **PR 3 (code-only, later, only if needed)**: any Mastra/watch changes. Never mixed with the above.

## Rollout Gantt

Task names use the required `IPI-XXX · TASK-ID — Full Task Name` format. `IPI-TBD` until Linear issues exist.

| Id | Task | Owner | Depends | Status |
|----|------|-------|---------|--------|
| 001 | IPI-TBD · PRAGENT-001 — Audit Existing PR-Agent and AI Review Configuration | — | — | done (this doc) |
| 002 | IPI-TBD · PRAGENT-002 — Add Minimal iPix PR-Agent Configuration and Review Contract | you | 001 | queue |
| 003 | IPI-TBD · PRAGENT-003 — Pilot PR-Agent Across Representative Pull Requests | you | 002 | queue |
| 004 | IPI-TBD · PRAGENT-004 — Consolidate Automated Pull Request Reviewers | you | 003 | queue |
| 005 | IPI-TBD · PRAGENT-005 — Measure PR-Agent Accuracy, Noise, Security, and Cost | you (verifier) | 004 | queue |
| 006 | IPI-TBD · PRAGENT-006 — Replace Static AWS Credentials With GitHub OIDC | you | 005 | queue |

Overlap notes:
- `PRAGENT-002` ships **two PRs** (docs-only first, then config/CI) to respect the one-concern-per-PR rule
  (see Deliverable Seam). The expert-pack sheets ship with the docs PR.
- `PRAGENT-004` intentionally lands **after** the pilot: no reviewer is removed until PR-Agent proves
  it can replace its share without losing coverage.
- `PRAGENT-006` is a **separate security task** (changes AWS trust policy + auth), never bundled with
  the measurement task.

## Final implementation prompt (marked: do NOT run in this audit)

```text
Follow-up session prompt — do NOT run during this audit.

Repo: /home/sk/ipix. Plan: tasks/pr-agent/pr-agent-plan.md is approved (PRAGENT-001 done).

Implement IPI-TBD · PRAGENT-002 — Add Minimal iPix PR-Agent Configuration and Review Contract,
in TWO PRs (one concern each — repo rule #1):

PR 1 — docs-only:
- Create docs/pr-review-guidelines.md (contract per "Review-contract outline"; target <=120 lines).
- Create docs/engineering/pr-agent/supabase.md, mastra.md, copilotkit.md, cloudflare.md
  (the expert pack, per "Making PR-Agent an iPix stack expert"; each <=90 lines).
- No config, no workflow, no product code.

PR 2 — config/CI-only, after PR 1 merges:
- Replace root .pr_agent.toml with the verified config (see "Proposed .pr_agent.toml").
- Replace .github/workflows/pr-agent.yml with the restrained workflow (see "Proposed workflow"),
  keeping the pinned SHA until a reviewed bump.
- Add GitHub labels skip-ai-review and docs-only (Settings → Labels).
- Do NOT touch app/, supabase/, or any source files.

Then verify on ONE UI PR and ONE database/RLS PR:
- exactly one auto /review comment per PR,
- "proof of specialty" findings appear (per the pilot table),
- set output_relevant_configurations back to false after these runs,
- check that the security/ticket-compliance section is NOT hidden on a PR with real findings
  (publish_output_no_suggestions caveat).

Keep /improve manual. Do NOT bump the pinned SHA in PR 2 — test an upstream bump later as a
separate reversible change. Report cost via gh api repos/amo-tech-ai/lumina-studio/actions/runs.
```