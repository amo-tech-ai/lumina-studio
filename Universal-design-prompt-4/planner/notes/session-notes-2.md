Good context — there's already a `/worktree clean` command, but it's framed as a "weekly ritual" or "after merge," never as a mandatory pre-check before opening a *new* one. That's exactly the gap — this very session created `wt-ipi-536-foundation` then `wt-ipi-536-qa` without cleaning up the first. Adding the rule, grounded in that real evidence:

Also updating `/worktree.md`'s "Add" subcommand for consistency:

Now applying the rule to this session's own worktrees:

The audit shows many stale merged worktrees repo-wide (unrelated to this session — some going back weeks). I'll only clean up the one from *this* session (`wt-ipi-536-foundation`, confirmed merged #347) since I have context on it; the rest are other people's/past sessions' work I shouldn't touch without confirmation. `wt-ipi-536-qa` correctly isn't flagged — PR #348 is still open.

Confirmed no uncommitted changes; the "ahead" commits are expected since PR #347 was squash-merged (content is in `298b1f51` on main, not the individual SHAs). Safe to remove:

Done. Summary:

**Durable rule added** — CLAUDE.md's "Worktree workflow" now has a mandatory **Step 0**: run `npm run worktree:audit` and remove anything safe-to-delete *before* creating a new worktree, every time — not just as a weekly ritual. Grounded in this session's own evidence (created `wt-ipi-536-foundation` then `wt-ipi-536-qa` without cleaning up the first). Mirrored the same note into `/worktree.md`'s `add` subcommand.

**Applied right now:** Audit revealed a large backlog of stale merged worktrees repo-wide (~13, going back weeks — other tasks/sessions I have no context on). I only removed `wt-ipi-536-foundation` — confirmed merged (#347), zero uncommitted changes, safe. Left the other ~12 untouched since removing them would be a much larger, unrelated action I shouldn't take without your sign-off.

`wt-ipi-536-qa` stays (PR #348 still open).

Want me to also clean up the rest of that repo-wide stale list, or leave that for you to review separately?

Created **[IPI-584 — Operator nav-sidebar: fix aria-current, focus-visible, and icon accessible names](https://linear.app/amo100/issue/IPI-584/operator-nav-sidebar-fix-aria-current-focus-visible-and-icon)**.

Follows the same prompt-engineering template as the rest of this session's tickets — Role/Context/User story/Examples (denied vs. allowed code snippets for all 3 fixes)/AC with `proof:` commands/Do-NOT+Out-of-scope/Completion steps A-D/Verification instructions with a source-of-truth table pointing back to the exact `grep` commands and live-browser checks that found each gap.

Key points captured:
- **Medium priority, XS complexity, 2-4hr estimate** — this is a small, low-risk, CSS/markup-only fix (no logic changes)
- **Explicitly scoped out**: the icon-to-Lucide migration (already dismissed once on PR #347's review) and the duplicate-`<h1>` CopilotKit issue (different subsystem, needs its own investigation)
- **Traceable**: links back to IPI-536, PR #347, and PR #348 for full context
- Labeled `FRONTEND` + `DESIGNV2` + `Bug`, placed in the same "DESIGN V2 — Operator React Parity" project — no `PLANNER` label since this affects all 8 nav items, not just Planner

Created **[IPI-584 — Operator nav-sidebar: fix aria-current, focus-visible, and icon accessible names](https://linear.app/amo100/issue/IPI-584/operator-nav-sidebar-fix-aria-current-focus-visible-and-icon)**.

Follows the same prompt-engineering template as the rest of this session's tickets — Role/Context/User story/Examples (denied vs. allowed code snippets for all 3 fixes)/AC with `proof:` commands/Do-NOT+Out-of-scope/Completion steps A-D/Verification instructions with a source-of-truth table pointing back to the exact `grep` commands and live-browser checks that found each gap.

Key points captured:
- **Medium priority, XS complexity, 2-4hr estimate** — this is a small, low-risk, CSS/markup-only fix (no logic changes)
- **Explicitly scoped out**: the icon-to-Lucide migration (already dismissed once on PR #347's review) and the duplicate-`<h1>` CopilotKit issue (different subsystem, needs its own investigation)
- **Traceable**: links back to IPI-536, PR #347, and PR #348 for full context
- Labeled `FRONTEND` + `DESIGNV2` + `Bug`, placed in the same "DESIGN V2 — Operator React Parity" project — no `PLANNER` label since this affects all 8 nav items, not just Planner

This is a full forensic QA pass on the now-merged IPI-536. Given the scope (10 phases), I'll work through this systematically in a fresh worktree tracking the merged `main`, and add the Playwright tests as requested. Let me set up first.

Confirmed — merge commit `298b1f51` is on `origin/main` HEAD. Creating the QA worktree:

All 14 expected files present, correctly placed (not-found at parent segment, not `[instanceId]/`). Now verifying the supporting lib files:

Static audit confirmed: no hardcoded route literals outside `constants.ts`, `PlannerInstanceStatus`/`PlannerTaskStatus` are genuinely separate types (no `done`/`completed` collision possible at the type level), `at_risk` isn't a stored status anywhere, permissions fail closed (`throw` not silent-empty), `MutationResult<T>` matches convention. Phase 1 complete. Now Phase 9 — automated verification:

Clean. Now full test suite and build:

All automated verification (Phase 9) complete: typecheck ✅, lint ✅, 1187 unit tests ✅, build ✅ (4 routes in manifest), and full RLS verification ✅ including the 3 new `planner_get_my_assignment` probes — this also gives real, live evidence for most of Phase 5's permission matrix (owner/manager/contributor/viewer/cross-org all tested against live Supabase).

Given the constraint against inserting live Supabase rows without fresh authorization, and that `planner.instances` currently has 0 production rows, I'll write tests that are fully real and runnable today, with the 2 scenarios needing a seeded fixture (Workspace/Settings happy path) gated on an env var rather than silently faked or requiring another live write. Let me check for an existing fixture convention first:

Let me fix the numbering to match the user's exact list and properly handle #9 (error boundary) rather than silently dropping it:

Now adding the real component-level test for scenario 9 (error boundary), since forcing a live error in a black-box browser test isn't safe/deterministic:

Now running this new component test to confirm it passes:

Needs the per-file `@vitest-environment jsdom` pragma (default is `node`). Adding it:

Confirmed — this repo uses `.toBeDefined()`/`.toBeNull()`, not jest-dom matchers. Fixing:

All 4 pass. Running full suite to confirm no regression, then starting the dev server for the real Playwright run:

Now setting up the dev server to actually run the Playwright suite:

Server running on port 3002. Now running the real Playwright suite against it:

Real finding, but not a regression — the operator shell's persistent chat dock renders its own `<h1>` ("Ask about your portfolio..."), so `page.locator("h1")` matches two elements. My test locator is too broad, not an app bug. Let me check the actual DOM to scope it correctly:

That was the interactive preview tab (unrelated to Playwright's own browser). Let me navigate it directly to inspect the real structure:

My `<h1>` has no class; the chat dock's has `cpk:*` classes. Fixing all locators in the spec:

Now investigating test 7 (unauthenticated redirect, timed out) and test 10 (touch-target height 32 vs 38) before re-running:

Potentially serious finding — an unauthenticated browser context reached `/app/planner` and rendered the full operator shell instead of redirecting to login. Before flagging this as a Planner-specific bug, let me check if this is systemic (an existing dev-mode auth-gate setting) rather than something IPI-536 introduced:

Not a Planner bug — `OPERATOR_AUTH_ENABLED=false` in this dev environment is a deliberate, repo-wide, documented flag (`middleware.ts:15-16`) that applies to *all* `/app/*` routes, not just Planner. My test's assumption was wrong for this environment. Fixing it to match the established pattern (`serverAuthGateEnabled` in `06-booking-wizard.spec.ts`):

Now investigating test 10's touch-target measurement before re-running:

**Critical context found**: `nav-sidebar.module.css:170-172` — `@media (max-width: 768px) { .nav { display: none; } }`. The entire left nav rail (all icons, not just Planner) is **intentionally hidden below 768px** — the comment says CopilotSidebar handles navigation on mobile instead. This is pre-existing, repo-wide behavior, not an IPI-536 gap. My test was also running under `chromium-desktop` (not an actual mobile viewport), which is why it measured the desktop rail. Rewriting test 10 to test the real, correct claim:

Now re-running the full suite — desktop project for tests 1-9, and mobile project for test 10:

6/6 core tests pass (rest correctly skip with documented reasons). Test 10 failed only because it ran under `chromium-desktop` (not a mobile viewport) — running it under the real mobile project now:

All 10 scenarios now pass or correctly skip with documented reasoning. Copying the tests to the requested location and finalizing:

Confirmed visually — nav rail is gone on mobile exactly as the CSS specifies, content still renders without horizontal overflow. Now checking the remaining static/security items and accessibility:

Confirmed real, but pre-existing (repo-wide) finding: `aria-current` is never set anywhere in `nav-sidebar.tsx`'s shared rendering path — affects all 8 nav items identically, not just Planner. Not a regression IPI-536 introduced; flagging it rather than silently fixing a shared component out of scope. Quick keyboard-focus check, then moving to remaining phases:

Confirmed — no focus-visible styling defined anywhere in `nav-sidebar.module.css` either; another real, pre-existing, repo-wide gap (WCAG 2.4.7). Phase 2/3/4 browser testing is done. Moving to Phase 5/6:

Real gap: `getInstanceUiTreatment` is only tested for 3 of 7 states. Closing it since it's a trivial, safe, pure-function addition:

All checks green. Committing the QA test additions and opening a PR, then compiling the final report:

Per the hard rule I added earlier today, running `/review-pr` before opening the PR:

Confirmed real, deterministic bug — the tests would fail across 3 of 5 configured Playwright projects when run normally (not just my manual single-project invocations). Fixing properly by making the nav-visibility assertion viewport-aware, so the suite gains full 5-project coverage instead of losing it:

Now running the full suite across ALL 5 configured projects to properly verify the fix:

All 50 test invocations resolve correctly across all 5 projects (30 pass, 20 correctly skip with documented reasons, 0 failures). Committing this fix and opening the PR:

Now opening the PR:

## Phase 10 — Final Report: IPI-536 · PLN-FND-001 Forensic QA

### Scorecard

| Area | Score /100 | Status |
|---|---:|:---:|
| Route correctness | 95 | 🟢 |
| Operator shell integration | 95 | 🟢 |
| Navigation | 82 | 🟡 |
| Loading/error/not-found | 92 | 🟢 |
| Permissions | 95 | 🟢 |
| State transitions | 98 | 🟢 |
| Accessibility | 62 | 🟡 |
| Responsive behavior | 93 | 🟢 |
| Regression safety | 98 | 🟢 |
| Test coverage | 88 | 🟡 |
| **Overall production readiness** | **88** | 🟡 |

**Verdict: 🟡 Ready to ship, proceed with 2 follow-up tickets recommended — not blocked.** None of the 8 explicit critical-failure conditions were met (checked each one below).

---

### Critical failure conditions — checked against evidence, none triggered

| Condition | Result |
|---|---|
| Planner route falls into marketing 404 | ❌ Did not occur — confirmed scoped `not-found.tsx` renders inside the operator shell, twice, with live browser evidence |
| Contributor/viewer incorrectly denied | ❌ Did not occur — `verify-rls.mjs` live probe confirms a viewer reads their own assignment via `planner_get_my_assignment` |
| Unassigned/cross-org user can read a plan | ❌ Did not occur — cross-org isolation and no-enumeration-leak both confirmed live |
| Workspace/Settings untested | ⚠️ Not re-tested live in *this* QA pass (env-gated, no fixture authorized) — but tested with real browser screenshots earlier this session, plus build-manifest + unit/component coverage now |
| Console errors/failed requests | ❌ None observed |
| Operator shell disappears on loading/error/not-found | ❌ Confirmed shell persists in all 3 states |
| Route-agent mapping resolves wrong | ❌ Confirmed `/app/planner` → `production-planner`, explicit |
| Regression test hollowed out to hide a failure | ❌ `marketing-routes.test.ts` change accurately reflects new reality (added real section), not a workaround |

---

### What was found and fixed *during this QA pass*
1. **`status-transitions.test.ts`** only asserted UI treatment for 3 of 7 stored statuses — expanded to all 7, verified.
2. **Playwright spec bug** (caught by `/review-pr`'s code-reviewer before the PR even opened): blanket nav-visibility assertions failed deterministically on 3-of-5 or 2-of-5 configured projects depending on direction. Fixed with a viewport-aware helper; re-verified 50/50 test invocations resolve correctly (30 pass, 20 documented-skip, 0 fail) across all 5 projects.
3. Two of my own test-authoring mistakes caught mid-session: an `h1` locator matching the CopilotKit chat dock's own heading, and an `OPERATOR_AUTH_ENABLED=false` dev-mode flag I initially mistook for a security bug.

### Real findings, confirmed pre-existing (not fixed — out of scope for this ticket)
All 4 apply identically to every nav item / every operator route — not introduced by IPI-536:
- `nav-sidebar.tsx` never sets `aria-current` on any link
- No focus-visible styling anywhere in `nav-sidebar.module.css`
- Icon-only nav links have no `aria-label` — accessible name resolves to the raw emoji
- The persistent CopilotKit chat dock renders its own `<h1>` on every `/app/*` route — 2 headings per page

### Evidence
- **Screenshots:** desktop Hub render, mobile (390px) nav-hidden confirmation — both captured this session
- **Live browser proof:** all 4 routes navigated for real (logged in as `qa@ipix.test`), both not-found variants, nav active-state, auth-gate behavior
- **Live Supabase proof:** full `verify-rls.mjs` run (123 probes, including the 3 Planner-specific ones) green against `nvdlhrodvevgwdsneplk`
- **Automated:** typecheck ✅, lint ✅, 1191 unit/component tests ✅, build ✅ (4 routes in manifest), Playwright 50/50 ✅

### Deliverables
- **PR #348:** [test(ipi-536): QA forensic pass](https://github.com/amo-tech-ai/lumina-studio/pull/348) — Playwright spec + component test + coverage fix
- **Tests archived at your requested location:** `/home/sk/ipix/Universal-design-prompt-4/tests/` (with a README pointing to the canonical executable copies in `app/e2e/` and `app/src/`)

### Recommended follow-ups (not blocking)
1. New ticket: fix `nav-sidebar.tsx`'s 3 accessibility gaps (aria-current, focus-visible, aria-label) — affects all 8 nav items, cheap fix
2. Seed a permanent QA fixture `planner.instances` row so Workspace/Settings happy-path can run live in CI instead of being env-gated

Real gap found. Let me confirm it precisely before fixing anything.

Confirmed — `/pr-fix` already has a path→skill matrix (line 197-222) that routes Mastra/CopilotKit/migrations to skills, but it references a **`migration-reviewer` subagent that doesn't exist** in the actual available agent list, and never routes to the real subagents that already exist for these exact domains (`mastra-agent-reviewer`, `copilotkit-v1-guard`, `rls-policy-auditor`, `vite-drift-auditor`). `/review-pr` — the gate I just made mandatory — is even thinner: it only has a vague catch-all row ("iPix paths → migration-reviewer, security-reviewer, qa-reviewer, mastra-agent-reviewer as applicable") with no skill-loading step at all.

This is the same class of gap as before: the tools exist, they're just not wired into the workflow that's supposed to invoke them. Fixing both files now.

Now fixing `pr-fix.md`'s stale `migration-reviewer` reference and adding explicit subagent routing alongside the skill-loading it already has:

The doc itself says `.claude/commands/pr-fix.md` must stay in sync with `.cursor/rules/pr-fix.mdc` — checking if that file has the same stale references:

Found a deeper gap, and it's worse: **`@pr-review-loop` — referenced as "the Rule" in both `/pr-fix` and `/review-pr` — doesn't exist anywhere.** Not a skill, not a `.cursor/rules/*.mdc` file, nothing. Same for `.cursor/rules/pr-fix.mdc`, which `/pr-fix`'s own Phase 5 defers to for the final report template. These are dangling references to files that were apparently planned but never created.

The good news: `pr-fix.md` already has the actual content (comment taxonomy, merge-blocker rules) inlined in its own body — so `@pr-review-loop` is redundant decoration, not a functional gap. But Phase 5's report template genuinely doesn't exist anywhere, which is why I had to improvise the report format each time I ran it this session. Fixing both:

Now the same fix in `review-pr.md`:

Let me also fix `/pr`'s (the orchestrator's) own reference to the same phantom rule, for consistency:

All command files fixed. Here's the complete strategy — three concrete gaps found and closed, not just discussed:

## 1. `/review-pr` (the pre-PR gate) had no domain routing at all
It only named generic subagents (code-reviewer, silent-failure-hunter, etc.) and one vague line — *"iPix paths → migration-reviewer, security-reviewer, qa-reviewer, mastra-agent-reviewer as applicable"* — three of those four names don't exist as real subagents. **Fixed:** added explicit routing to the real agents (`mastra-agent-reviewer`, `copilotkit-v1-guard`, `rls-policy-auditor`, `vite-drift-auditor`, `api-documenter`) plus a skill-loading step, so Mastra/CopilotKit/RLS changes get domain-specific review *before* a PR ever opens.

## 2. `/pr-fix` referenced a `migration-reviewer` subagent that doesn't exist
It had the right skill-loading matrix (`mastra`, `copilotkit`, `ipix-supabase` skills) but paired migrations with a fictional agent instead of the real `rls-policy-auditor` — in 2 places. **Fixed both**, plus added explicit Mastra/CopilotKit subagent pairings alongside the skills.

## 3. `@pr-review-loop` and `.cursor/rules/pr-fix.mdc` don't exist anywhere
Referenced as "the Rule" in **6 different command files** (`pr.md`, `pr-fix.md`, `pr-ready.md`, `pr-fix-ship.md`, `pr-fix-resolve.md`, `review-pr.md`) and as the source of `/pr-fix`'s final-report template — none of it was ever created. This is why I had to improvise the report format every time I ran `/pr-fix` this session. **Fixed:** removed the dangling references everywhere, and inlined an actual Phase 5 report template directly into `pr-fix.md` (based on the format that already worked in this session, now including a "Prevention" section so every future run asks "why won't this recur," not just "what did I fix").

## Why this matters more than the CLAUDE.md hard rule I added earlier
The hard rule ("`/review-pr` before `gh pr create`") only helps if `/review-pr` actually has the domain coverage to catch domain-specific bugs. Before this fix, it would have run generic code-reviewer/silent-failure-hunter passes but had zero chance of invoking `mastra-agent-reviewer` or `copilotkit-v1-guard` even if the diff touched those exact files — the routing simply wasn't there. Now it is, in the same file that's now mandatory.

These are documentation fixes to `.claude/commands/*.md` — no code changes, nothing to test/build. Want me to commit these separately (docs-only, per the one-concern rule), or hold them uncommitted since they're config the harness reads directly from disk either way?

All checks pass on `71bcc653`, 0 unresolved threads. PR #347 is confirmed clean.

## Retroactive `/review-pr` confirmation pass — final results

I ran the 4 agents `/review-pr`'s (now-fixed) routing table would have selected for this diff, against the already-fixed code, to test whether the new strategy actually works:

| Agent | Verdict | Found | Fixed? |
|---|---|---|---|
| **code-reviewer** | No Critical/Important findings. Confirmed the P1 RLS fix matches the `crm_convert_deal` convention exactly, branch naming correct, no client-side secrets. | 1 sub-threshold note (single commit mixing migration+code — judged defensible, functionally coupled) | Nothing to fix |
| **silent-failure-hunter** | Confirmed both original bugs (RLS lockout, `maybeSingle()` error-swallowing) are genuinely fixed and tested. Found **1 new real gap**: `PlannerErrorBoundary` catches every error the fixes now correctly surface, but never reports them to Sentry — a real production incident would render silently with zero observability. | 1 real finding | ✅ Fixed (commit `7dc31f97`) |
| **type-design-analyzer** | Confirmed the `userId` signature fix is sound, no way to spoof it anymore. 2 minor non-blocking suggestions (a comment overclaiming parity with `ServiceResult<T>`, and a note on a tautological `.find()`). | 0 blocking | Non-blocking, left as-is |
| **rls-policy-auditor** | Confirmed the RPC itself is secure (no injection/escalation vector), checked all 10 other RLS policies in the same migration for the same bug class — only `assignments_select_org` had it, already fixed. Found **1 real gap**: the new RPC had zero automated regression coverage — "safe by reasoning, not safe by test." | 1 real finding | ✅ Fixed — added 3 probes to `verify-rls.mjs` (commit `71bcc653`), all verified passing against live Supabase |

**Net result: the strategy worked.** 2 more real, non-trivial gaps found and closed *before* any external bot found them — a Sentry-observability blind spot and a missing regression test for a security-sensitive RPC. Both are exactly the kind of thing that would otherwise have surfaced as a 3rd review round from Sentry/CodeRabbit, or worse, shipped silently.

PR #347 is now doubly confirmed clean and ready to merge.