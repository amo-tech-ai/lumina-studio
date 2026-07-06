---
name: pr-workflow
description: >
  iPix GitHub PR lifecycle — branch, review-before-PR, verify, commit safely, open PR,
  triage and resolve review threads (Bugbot/CodeRabbit/human/optibot), and gate merge.
  Use whenever the user says "open a PR", "create a pull request", "review this PR",
  "review-pr", "pr-fix", "fix PR feedback", "resolve review threads/comments", "bugbot",
  "cursor review", "is this PR mergeable", "ship this PR", or pastes a `gh pr` URL / PR
  number. Also use before any `git push` that will open or update a PR, and whenever
  GitHub review comments need triage (fix / already-fixed / out-of-scope / dismiss) or
  GraphQL reply+resolve. Do NOT use for Linear-only bookkeeping with no GitHub PR involved
  (state transitions, todo.md rows, issue markdown) — that's
  [ipix-task-lifecycle](../ipix-task-lifecycle/SKILL.md) Phase 5. Do NOT use for setting up
  a worktree itself — that's [worktrees](../worktrees/SKILL.md).
---

# PR Workflow

Port of `.cursor/rules/pr-workflow.mdc` / `pr-review-loop.mdc` / `pr-fix.mdc` for Claude
Code. Same rules, one hub instead of three overlapping files. The Cursor `.mdc` rules still
apply to Cursor sessions — this skill is the Claude Code equivalent, not a replacement.

## 🚫 #1 rule — never mix concerns

**Never mix docs and production files in one PR/commit. Never mix two tasks/concerns in one
PR/commit.** One concern per PR *and* per commit — docs-only, code-only, migration-only,
CI/config-only, each separate. This is enforced in `CLAUDE.md` (PR #99 fallout) and applies
here without exception. If a change set already spans docs+code or two tasks: stop, split
before staging, don't push more changes into the mix.

Common shapes this takes in practice — same rule, recognize it faster:
feature code + PR tooling/commands · schema + unrelated docs · dashboard work + matching/other
feature work · `.claude/commands/**` mixed with product code. When you spot one: **stop
fixing the feature**, split or remove the unrelated files first, then resume — don't keep
layering fixes onto a PR that's already mixed (see PR #174/#172 in this repo's history for
exactly this: 5 docs commits landed on a feature branch by accident, caught and split via
rebase rather than fixed-in-place).

## Required skills — load before any PR work

Auditing, fixing, reviewing, rebasing, verifying, or merging **any** PR must load the
relevant domain skill(s) below first and use them instead of ad-hoc analysis — same
evidence-over-memory discipline as the rest of this skill. Match by changed path; the
full path→skill/MCP matrix is in [references/pr-fix-triage.md](references/pr-fix-triage.md).

| Domain | Skill to load | Note |
|---|---|---|
| GitHub CLI/GraphQL (threads, checks, mergeability) | *this skill* | `gh`/GraphQL usage is `pr-workflow`'s own job — there's no separate `github`/`gh-address-comments`/`gh-fix-ci` skill in this repo. Comment triage → [references/pr-review-resolve.md](references/pr-review-resolve.md); CI triage → [references/verify-matrix.md](references/verify-matrix.md) |
| Next.js (proxy, config, caching) | [`nextjs-16`](../nextjs-16/SKILL.md) — satellite | |
| Next.js (App Router, RSC, pages) | [`nextjs-developer`](../nextjs-developer/SKILL.md) — hub | |
| React | [`vercel-react-best-practices`](../vercel-react-best-practices/SKILL.md) | |
| CopilotKit | [`copilotkit`](../copilotkit/SKILL.md) | |
| Mastra agents/tools | [`mastra`](../mastra/SKILL.md) | |
| Supabase / Postgres / RLS | [`ipix-supabase`](../ipix-supabase/SKILL.md) (hub) — routes to its own `postgres.md` for Postgres/RLS performance rules | |
| shadcn/ui components | [`shadcn`](../shadcn/SKILL.md) | |
| Verification (typecheck/lint/test/RLS) | [references/verify-matrix.md](references/verify-matrix.md) (this skill) — no separate "verification" skill exists, this file is it | |

**Known gap:** the `Skill` tool's registry doesn't always match every `.claude/skills/*`
directory — `ipix-supabase` exists on disk but has failed to invoke by name via the `Skill`
tool in practice. If a `Skill()` call for any of the above returns "Unknown skill," fall
back to reading that skill's `SKILL.md` (and its reference files) directly with `Read`
rather than skipping the domain guidance.

## Order of operations — the 14 steps

Every PR audit/fix/merge pass follows this order. Each step has a stop condition — don't
skip ahead to fixing while an earlier gate is still open, that's how the same issue gets
rediscovered three times in one session instead of once.

```
 1. Identify PR scope           — what is this PR actually for (title/body vs. real diff)
 2. Load required skills        — table above, match by changed path
 3. Check dependencies          — does this PR need another PR merged first? (dependency gate below)
 4. Check mixed concerns        — #1 rule above; stop and split before any feature fix
 5. Check merge conflicts       — mergeable state, branch vs. main
 6. Check CI                    — app-build, supabase-web015, and know what each actually tests
 7. Check review threads        — full inventory, not just the obvious ones
 8. Check Codacy / CodeRabbit / Vercel — including dashboard-only gates you can't see line detail for
 9. Audit auth/RLS/security     — if Supabase touched (gate below) — do this BEFORE step 10, not after
10. Fix only blockers first     — fix order below; style/nits/docs come last
11. Re-run verification         — references/verify-matrix.md, on the commit you just made, not memory
12. Resolve threads with evidence — references/pr-review-resolve.md; never blind-resolve
13. Commit/push only clean changes — stage allowlist, one concern per commit
14. Recommend merge only when green — references/forensic-audit.md report, all rows backed by a fresh run
```

Full checklist template for steps 1–9 (fillable table, dependency gate, Supabase/RLS gate):
[references/pr-triage-checklist.md](references/pr-triage-checklist.md).

## Anti-loop rules

The whole point of this skill is not re-discovering the same PR issue three times in one
session. Enforce these:

- Don't start fixing a downstream PR before its dependency PR is actually merged (not just
  opened, not just green) — see the dependency gate.
- Don't re-investigate something you already have evidence for — write the evidence down
  (a reply, a report row) the first time, then cite it, don't re-derive it.
- Don't run a broad branch/repo audit unless the user asked for one — scope to the PR.
- Don't rewrite unrelated docs while fixing a PR — that's its own mixed-concern violation.
- Don't mix PR tooling/commands with feature code — #1 rule.
- Don't open a PR before its scope is already clean — cheaper to not-bundle than to un-bundle.
- Don't merge with CI missing entirely — a check that never ran is not the same as a check
  that passed silently; confirm it actually triggered.
- Don't mark the Linear issue Done until the PR is actually merged, or the user explicitly
  accepts an unmerged state.

## The one clean loop

```
1. Review before PR   — read your own diff before a bot does; fix Critical/Important locally
2. Fix locally        — small, focused changes only
3. Verify             — tests + lint + build + diff-scope check (references/verify-matrix.md)
4. Commit safely       — stage allowlist only, never secrets/config junk
5. Push + open PR      — CI + Bugbot/CodeRabbit/Codacy start running
6. Triage & resolve    — classify every thread, fix, reply, resolve (references/pr-review-resolve.md)
7. Ship                — CI green + unresolved threads = 0 + sign-off comment
```

Steps 1–5 run once per PR ("before PR" loop); steps 6–7 repeat every time new review
feedback lands ("after PR" loop, i.e. what the old `@pr-fix` rule covered).

## Branch & PR size

```
Branch:   ipi/<task-id>-short-name        (lowercase spec id, e.g. ipi/plt-004-env-validation)
Target:   1 task = 1 PR
Max diff: 500–800 lines — split if larger
Never:    combine unrelated Linear issues in one PR
```

Never branch or commit from `main` — see [worktrees](../worktrees/SKILL.md). If not on the
PR's branch/worktree, stop before fixing or committing anything.

## Before opening a PR

1. Read the Linear issue + acceptance criteria; read `docs/linear/issues/IPI-*.md` if it exists.
2. Check dependencies (blocked-by links) — see the dependency gate in
   [references/pr-triage-checklist.md](references/pr-triage-checklist.md) if this feature
   builds on another PR/schema that isn't merged yet.
3. Set Linear `Todo → In Progress` (`ipix-task-lifecycle` owns the Linear state machine —
   don't hand-roll it here).
4. Run the verify matrix for whatever paths changed — [references/verify-matrix.md](references/verify-matrix.md).
5. Self-review the diff (`git diff main...HEAD`) before pushing — catches most bot findings for free.
6. `git diff main...HEAD | grep -n "TODO\|FIXME"` on the changed files — a new TODO/FIXME in
   your own diff is a decision to make now (finish it, or note why it's deliberately
   deferred), not something to let a bot find later.

## Fixing review feedback on an open PR

Before triaging comments, orient on the PR's domain (changed paths → which skills/MCP
servers give you real evidence instead of memory) and read every thread in full — see
[references/pr-fix-triage.md](references/pr-fix-triage.md) for the path→skill/MCP matrix and
the fix-phase order (bug → refactor → tech debt → style).

Every thread gets bucketed **before** any code changes: Fix / Already fixed / Out of scope /
Dismiss. Full taxonomy, git safety, stage allowlist, and the GraphQL reply+resolve protocol
are in [references/pr-review-resolve.md](references/pr-review-resolve.md) — that file is the
shared core for both the pre-PR self-review and the post-PR bot/human-comment loop, so read
it once regardless of which side of the loop you're on.

## PR body, sign-off, waivers

Templates (PR body, verification checklist, sign-off comment, waiver text) live in
[references/pr-template.md](references/pr-template.md).

## Never merge if

```
❌ Build fails · Tests fail · Required verify:* fails
❌ Secrets exposed in diff (grep SERVICE_ROLE, GEMINI_API_KEY, etc. before push)
❌ Linear not updated / acceptance criteria incomplete
❌ PR > 800 lines without a split justification
❌ Unrelated tasks bundled in one PR
❌ Bugbot High/Critical unresolved without a documented waiver
❌ Unresolved GitHub PR review threads (fix verified + resolved, or waived)
```

**Never state that any part of a PR is complete without evidence.** "I fixed it" / "that's
handled" / "should be fine" is not evidence. Evidence is one of: a GitHub PR/commit SHA, a
CI status, a test/typecheck/lint run's actual output, a `supabase:verify-rls` run, a Linear
issue state, or a direct read of the current runtime/code. This applies everywhere in this
skill — merging, resolving a thread, claiming a dependency is met, claiming docs are synced
— not just the merge gate, and it applies even to your own prior fixes (a bot re-flagging a
line you already touched still needs fresh verification, not a memory of having fixed it
once). **If evidence genuinely cannot be produced, say so explicitly** ("Codacy's dashboard
gate isn't inspectable without login access" is a valid statement; silently treating it as
resolved is not).

**Never call an `auth.uid()`-dependent RPC with a service-role admin client.** Use a
user-scoped client / access-token pattern instead (`createUserScopedClient(accessToken)` +
`requestToken` — see [references/pr-triage-checklist.md](references/pr-triage-checklist.md)'s
Supabase/RLS gate for the full pattern and why). This is not a hypothetical — it shipped in
this exact repo and had to be found and fixed after the fact.

## Definition of done

"Never merge if" (above) is the blocker list — what stops you. This is the positive
exit criterion — what "actually done" means, including the process items that aren't code
blockers but still get forgotten if nothing checks for them:

```
🟢 Dependency PRs merged (not just opened) — or explicitly accepted as a documented risk
🟢 Scope clean — no unrelated files, confirmed via `gh pr view --json files`, not assumed
🟢 Merge conflicts resolved — including semantic ones, not just mechanical auto-merges
🟢 CI green — and you know what each check actually covers (see failure-patterns.md)
🟢 Typecheck / lint / test / build pass — on the commit you're recommending, not an earlier one
🟢 Review threads resolved or explicitly waived — zero silently-skipped threads
🟢 Security/RLS verified if Supabase touched — pr-triage-checklist.md's gate, not skipped
🟢 Linear issue state matches reality (In Review / Done) — not left at Todo/In Progress
🟢 docs/linear/issues/*.md and tasks/plan/todo.md updated if this PR changed the plan
🟢 Lessons learned recorded — only if something non-obvious actually happened (see
   references/lessons-learned.md) — most PRs don't need an entry, don't force one
🟢 Merge recommendation issued — one of 🟢/🟡/🔴, not left implicit
```

A PR isn't done because CI is green. It's done when every row above is true and backed by
evidence — the "never state complete without evidence" rule above applies to every 🟢 here.

## Forensic audit format

For an "audit this PR" / "is this safe to merge" / full-review request (not a narrow
single-comment fix), produce the audit in the structure and grading scale defined in
[references/forensic-audit.md](references/forensic-audit.md) — categorized findings
(errors, blockers, security, RLS/auth, performance, accessibility, merge risks) plus a
🟢🟡🔴⚪ grading table per audited area.

## Routing

| Need | Go to |
|------|-------|
| Conditional verify scripts by changed path (root/app/edge/RLS/BI/DNA) | [references/verify-matrix.md](references/verify-matrix.md) |
| Comment taxonomy, git safety, stage allowlist, GraphQL resolve, CI gate, per-thread tracking table | [references/pr-review-resolve.md](references/pr-review-resolve.md) |
| Path→skill/MCP matrix, fix order (9-step) | [references/pr-fix-triage.md](references/pr-fix-triage.md) |
| 19-item triage checklist, dependency gate, Supabase/RLS gate | [references/pr-triage-checklist.md](references/pr-triage-checklist.md) |
| Past mistakes and reusable patterns from real PRs in this repo | [references/lessons-learned.md](references/lessons-learned.md) |
| "I've seen this symptom before" lookup — which gate/rule owns it | [references/failure-patterns.md](references/failure-patterns.md) |
| PR body / sign-off / waiver templates | [references/pr-template.md](references/pr-template.md) |
| Full forensic audit format + PR report template (findings categories + grading table) | [references/forensic-audit.md](references/forensic-audit.md) |
| Worktree setup | [worktrees](../worktrees/SKILL.md) |
| Linear state machine, todo.md tracker, commit templates | [ipix-task-lifecycle](../ipix-task-lifecycle/SKILL.md) Phase 5 (`shipping.md`) |
| Forensic Done gate before closing the Linear issue | [task-verifier](../task-verifier/SKILL.md) |
| Multi-file impact before editing flagged lines | [graphify](../graphify/SKILL.md) |
| Current MVP priority queue | `tasks/plan/todo.md` § Progress Task Tracker — **not** this skill, it changes too often to duplicate here |
