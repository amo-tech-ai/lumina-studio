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

**Reviewer verdict on the plan: 82/100 — strategy correct, approved after 9 fixes.** All 9 fixes
have been applied to the plan. Nothing here is implemented yet; implementation is task
`PRAGENT-002`.

## 2. What PR-Agent is (one minute)

Every pull request (PR) is a proposed change to the codebase — like a "change request" form
before it ships. A human must review it. **PR-Agent is a free AI reviewer** that reads the PR
and posts a comment: what changed, what could break, what's missing.

Real proof it works: on PR #791 it caught a **race condition** in a sign-out test — the test could
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

## 4. What the plan improves — before and after

| | Today | After this plan | Plain-English win |
|---|---|---|---|
| **Reviewer knowledge** | Generic AI advice | Given the iPix rulebook (see §5) | Catches iPix-specific dangers: leaked DB keys, missing RLS, Node APIs on Cloudflare Workers |
| **Noise** | "No major issues detected" on clean PRs | Comments only when there's something real; one comment that updates in place | Developers stop ignoring bot comments — every comment means something |
| **Wasted work** | Reviews every PR a human opens | Skips drafts, dependabot/renovate, docs-only, and labeled `skip-ai-review` PRs | No spam, no wasted AI calls |
| **Bots** | 3 AI reviewers + Vercel all commenting (CodeRabbit is rate-limited and adding noise) | One clear voice; pause CodeRabbit; keep Copilot review off during pilot | One reviewer the team can learn to trust |
| **Cost** | Reviews on every open/reopen | Same triggers, but skip-labels stop the runner before it starts | Smallest possible AWS bill |
| **Safety** | Already good | Hardened: label gates in workflow + app, comment commands PR-only, restricted mode | Nothing can silently approve or push code |
| **Measurement** | No data on quality | 5-PR pilot with a pass/fail scorecard (≥70% useful, <20% duplicates, <10% wrong) | We know it works before we rely on it |

## 5. Making PR-Agent an iPix stack expert

**The problem.** A generic AI reviewer doesn't know that a Supabase table without an RLS policy is
a merge-blocker, that v1 CopilotKit imports break our build, or that Node's `fs`/`path` explode on
Cloudflare Workers.

**The fix — "the expert pack":** four short cheat-sheets (each ≤90 lines) the reviewer reads on
every PR, stored on the default branch so PR authors can't tamper with them:

| Sheet | What it teaches the reviewer |
|---|---|
| `supabase.md` | Every table needs an org-scoped RLS policy; migrations must be additive and reversible; the service-role key must never reach client code; Mercur owns the commerce catalog, Supabase doesn't |
| `mastra.md` | Agents live in `app/src/mastra/`; the registry key = agent id = `useAgent()` must all match; no direct DB writes that bypass the RPC/service/approval path |
| `copilotkit.md` | Only `/v2` imports (`@copilotkit/react-core/v2`); v1 imports fail the build; HITL wiring through `/api/copilotkit` |
| `cloudflare.md` | We deploy via OpenNext → Workers: no Node-only APIs (`fs`, `path`, …) in Worker-bound code; check AI Gateway usage |

**Real-world example of the payoff:** today a PR that adds a Supabase table without an RLS policy
gets "no major issues detected". After the expert pack, it gets a BLOCKING finding naming the exact
migration lines — exactly like the PR #791 race-condition catch.

**One honest limitation:** PR-Agent's fancier "Agent Skills" feature can't be used in our GitHub
Action deployment (skill paths are admin-only, and the action runner has no files). The cheat-sheet
approach achieves the same goal with a mechanism we can control.

## 6. The 9 fixes (what changed in the plan)

1. **Comment commands now require the comment to be on a PR** — a `/`-comment on a plain bug issue can no longer start the reviewer.
2. **Version claim corrected** — latest GitHub release is `v0.41.1` (verified via Releases API), while the package itself declares `0.41.0`; the plan now says bump the pinned action SHA only as a separate, reversible step, never in the same PR as config.
3. **Token limit documented, not assumed** — `custom_model_max_tokens = 250000` stays (it was empirically validated during IPI-519 and has run green for weeks) but is flagged for re-verification on the Bedrock model's real limits when we bump versions.
4. **Skip-labels now enforced twice** — in the workflow (before the runner starts, saving cost) *and* in the config (app-level backstop); a maintainer can still manually `/review` a skipped PR.
5. **Author list cleaned** — only exact logins: `dependabot[bot]`, `renovate[bot]`; the CodeRabbit entry was removed (it reviews PRs, it doesn't author them).
6. **Noise-suppression flagged for pilot check** — the "only comment on real findings" setting can also hide security/ticket lines on clean PRs; we verify it doesn't before trusting it.
7. **Context budget is measured** — 800-line estimate with instructions: if debug output shows truncation, extend; if sheets are clipped, shorten them. Keep the contract ≤120 lines, sheets ≤90.
8. **Debug config output is pilot-only** — on for the first 2–3 PRs, then off.
9. **Task naming fixed** — full `IPI-TBD · PRAGENT-00X — Full Task Name` format everywhere; **OIDC is now its own task** (it changes AWS trust, not just measurement).

## 7. What's needed to make it happen

Nothing exotic — mostly decisions, not engineering:

1. **Two GitHub labels** (`skip-ai-review`, `docs-only`) — 2 minutes, manual.
2. **A docs-only PR** — the review contract + 4 expert sheets.
3. **A config-only PR** — the new `.pr_agent.toml` + slimmed workflow. No product code.
4. **One owner decision** — pause/downgrade the CodeRabbit app during the pilot.
5. **Already in place** — AWS Bedrock keys, pinned action SHA, least-privilege permissions.
6. **A short pilot** — 5 representative PRs (UI, Supabase, Mastra/CopilotKit, Workers, docs-only),
   graded on usefulness and specialty-proof.
7. **Later (PRAGENT-006)** — swap static AWS keys for OIDC (no stored secrets).

**What it does NOT need:** no new servers, no subscription, no app install, no rewriting existing
code, no change to the human merge gate.

## 8. Execution order

```
PRAGENT-001  Audit + plan                     → done (this doc + plan)
PRAGENT-002  Expert pack: review contract + expert sheets  → docs-only PRs
PRAGENT-003  Restricted config + workflow (allowlist, context, restricted_mode) → config-only PR
PRAGENT-004  Seeded-defect validation PRs (1 defect each; quiet on clean) — recall + precision
PRAGENT-005  Pilot across 5 representative PRs, graded
PRAGENT-006  Consolidate reviewers (pause CodeRabbit, keep Copilot review off)
PRAGENT-007  Measure accuracy, noise, security, cost → go/no-go
PRAGENT-008  OIDC: replace static AWS credentials
PRAGENT-009  Test and upgrade pinned PR-Agent action version (separate, last)
```

> Full detail: `tasks/pr-agent/pr-agent-expert.md` (PRAGENT-001 — expert configuration plan,
> reviewer-v2 corrections applied: manual-command allowlist, seeded-defect gate, non-absolute
> expert rules, docs/config task split, pinned SHA throughout the pilot).

## 9. Guardrails (non-negotiables)

- **Humans decide.** PR-Agent never approves, never merges, never writes code (`restricted_mode`).
- **One concern per PR** — docs PR and config PR are never mixed (repo rule #1).
- **Trusted context only** — the reviewer reads rules from the default branch, so a PR author
  can't inject instructions into the AI.
- **No secrets** — nothing sensitive is added to prompts or configs; AWS keys stay in GitHub Secrets.
- **Version bumps are separate, reversible changes** — never bundled with config work.

## 10. Success gate (how we'll know it worked)

| Metric | Pass bar |
|---|---|
| High-confidence useful findings | ≥ 70% |
| Duplicate findings | < 20% |
| Incorrect findings | < 10% |
| Added PR noise | Acceptable (one evolving comment, no empty comments) |
| Specialty proof | Area-specific finding on ≥ 3 of 5 pilot PRs |
| Security | 0 issues introduced by the setup |
| Cost | Within existing AWS budget (currently pennies per PR) |
