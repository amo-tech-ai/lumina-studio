# What to do with PRs #353, #354, and #355

**Verified 2026-07-15** against live GitHub state before filing: `gh pr view`/`gh pr diff` confirm #353 (OPEN, MERGEABLE, base `main`, head `docs/linear-prompt-engineering-verification`, 1 file — `.claude/skills/ipix-task-lifecycle/references/linear-prompt-engineering.md`, +33/-2), #354 (OPEN, MERGEABLE, base `main`, head `docs/cloudflare-workflow-skill-corrections`, 1 file — `.claude/skills/cloudflare-workflow/SKILL.md`, +190/-1), #355 (OPEN, **CONFLICTING** — not mergeable, base `main`, head `docs/cloudflare-plan-phase1-public`, 45 files, +10,712/-1).

Also directly confirmed:
- `origin/main`'s current `.claude/skills/cloudflare-workflow/SKILL.md` still has `name: cloudflare-workflow` — the rename has **not** landed on `main` independently.
- PR #354's diff does exactly what's claimed: line 2 changes `name: cloudflare-workflow` → `name: cf-wf`, plus adds a new "MCP Cloudflare Tools Reference" section and more, beyond the title's stated "correct Workers size limits and D1/Supabase routing" scope.
- `.claude/skills/` is genuinely git-tracked in this repo (not gitignored, contrary to an earlier stale assumption) — confirmed via `git check-ignore` returning no match on this exact file.

---

## Execution status — 2026-07-15

### 0. PR #353 — ✅ MERGED (since previous check)

Merged as `docs(ipix-task-lifecycle): add self-verification section + Rule 8 to Linear template (#353)`, commit `5e5bb89c`, now on `origin/main` HEAD. Confirmed via `git fetch origin main` during this session — not merged by this session, discovered after the fact. The "safe to merge, holding for go-ahead" verdict below stands as the record of why it was clear to merge.

### 1. PR #355 — ✅ CLOSED

Closed with the prepared superseded-by comment (pointing to #379 and #395). Branch `docs/cloudflare-plan-phase1-public` left in place, not deleted.

### 2. PR #353 — kept open, full check run, **safe to merge**

| Check | Result | Evidence |
|---|---|---|
| CI | 🟢 All required checks pass | `pr_agent_job` pass, Codacy pass (0 new issues), `app-build` pass, `booking-gate`/`booking-gate-check` pass, `supabase-web015` pass, CodeRabbit "Review completed", Vercel preview deployed. `Seer Code Review` and `Supabase Preview` show `skipping` — expected for a docs-only change, not a failure. |
| Review comments | 🟢 No blockers | 6 comments total: Vercel/Codacy/pr-agent bot summaries (informational), CodeRabbit hit its own PR-review rate limit and never actually reviewed (not a failure state), one manual `@sentry review` trigger with no findings posted back. Zero `CHANGES_REQUESTED` reviews. |
| Broken relative links | 🟢 None | Diff adds no `[text](path)`-style links at all — only prose, a placeholder claim/source/re-check table, and a checklist line. Nothing to break. |
| Overlap with `task-verifier` | 🟢 None — complementary, not duplicate | This PR adds a lightweight *ticket-authoring-time* self-check (naming-collision grep, claim→source table, proof-before-checking-the-box) to `ipix-task-lifecycle`'s Linear template. `task-verifier`'s own SKILL.md (read directly this session) has no equivalent naming-collision or claim-sourcing step in its Phase 0–10 — the two operate at different points in the lifecycle (draft-time vs. pre-Done forensic gate) and don't conflict. |

**Verdict: safe to merge.** Not merged — holding per instruction, awaiting explicit go-ahead.

### 3. PR #354 — kept open, additions audited into 3 groups

Full diff read directly (`gh pr diff 354`, 249 lines, 1 file). Grouped below.

#### Group A — validated corrections worth preserving (generic, no environment coupling)

| Addition | Assessment |
|---|---|
| **Official Sources Rule** (source hierarchy, material-claims-require-proof table, PR review flags) | Sound, generic methodology — matches this session's own "verify against live docs, never trust training data" discipline throughout. No environment coupling. |
| **CI Testing Audit** (security-test-parity checklist, red-flag patterns) | Sound and generic; the one repo-specific example (`services/cloudflare-worker/npm test`) is an accurate real path, not stale. |
| **HTTP Header Edge Cases** (auth token whitespace/CRLF/null test matrix) | Sound, generic security-testing pattern. **One claim needs a fix before merge:** it attributes the motivating incident to "IPI-468" — but IPI-468 (`SEC-001 — Cloudflare AI Security Architecture`, read directly this session) is a broad security-architecture task, not a header-whitespace bug report. This citation is either wrong or refers to a sub-finding inside IPI-468 not visible from the issue title alone — needs the author to confirm or correct the IPI number before merge. |
| **Known Cloudflare Gotchas** — D1 remote/local mismatch, KV reserved-prefix collisions, `nodejs_compat` flag placement | Sound, generic, consistent with what CLAUDE.md's own "Mastra — known gotchas" section already documents in the same style. |
| **Known Cloudflare Gotchas** — Workers script size limits (exact MB figures cited) | Content is good, but the exact numeric limits (Free 3MB/64MB, Paid 10MB/64MB) are precisely the kind of claim the PR's own new "Official Sources Rule" says must be sourced/dated — no citation link is attached. Should be verified against current Cloudflare docs and dated before merge, or marked TBD per its own new rule. |

#### Group B — environment-specific or stale-risk MCP references

| Addition | Risk |
|---|---|
| **"MCP Cloudflare Tools Reference"** table (11 exact tool names, e.g. `mcp__claude_ai_Cloudflare_Developer_Platform__search_cloudflare_documentation`, `mcp__plugin_cloudflare_cloudflare-api__execute`) | These are real, currently-working tool names in this session's own MCP connector setup — not fabricated. But they're tied to a specific connector/plugin naming scheme that can change if the Cloudflare Developer Platform connector is renamed, reconfigured, or a different developer's MCP setup differs. Hard-coding them into a shared skill file risks silent staleness. |
| **Stage 5b table** (reuses the same `workers_get_worker_code`, `d1_database_query`, `kv_namespaces_list`, `r2_buckets_list` tool names) | Same risk as above — same tool-name coupling. |
| **"Skills × MCP Integration Table"** (references the same tool-name patterns, plus lists itself as `cf-wf`) | Same MCP-naming risk, **and** bakes in the `cf-wf` rename directly into a table cell — doubly coupled to the unresolved rename decision. |
| Per-gotcha `**MCP:**` lines throughout "Known Cloudflare Gotchas" | Same risk, smaller blast radius per line. |

#### Group C — the `cloudflare-workflow` → `cf-wf` rename and every affected reference

The rename itself is one line (frontmatter `name:` field). But confirmed via `git grep "cloudflare-workflow" origin/main` — **35+ real references across the repo**, including:

- **`CLAUDE.md`** lines 31 and 212 — both are live routing instructions ("load the `cloudflare-workflow` skill"). If the skill's actual name becomes `cf-wf`, these instructions stop resolving correctly. This is the exact issue an earlier Bugbot review flagged on a different, now-closed oversized PR (#391) — confirmed independently here, not just recalled.
- **8 Linear issue spec files** under `docs/linear/issues/` (`IPI-492`, `IPI-526` through `IPI-534`) that list `cloudflare-workflow` as a required skill by name.
- **The skill's own `references/verification-checklist.md`** — 12 self-references to `cloudflare-workflow` as a column value throughout its verification tables.
- Numerous historical/archival files under `tasks/cloudflare/notes/`, `tasks/cloudflare/tests/`, `tasks/cloudflare/draft/` — these describe past events and arguably don't need updating (correct at the time written), but add to the total surface if a full rename were pursued.

**Separately discovered, not caused by #354:** `tasks/cloudflare/tests/worker-user-journeys.md` and `user-journeys/00-index.md` reference `.cursor/rules/cloudflare-workflow.mdc` — that file **does not exist** on `main` (only `.cursor/rules/cloudflare-mcp.mdc` does). This is a pre-existing broken reference, unrelated to this PR's rename — noted for a separate fix, not blocking this decision.

### 4. Recommendation: clean replacement, not in-place revision

**Rationale:** Group C alone (20+ real, non-historical touch points — 2 CLAUDE.md lines + 8 Linear specs + 12 self-references in the skill's own checklist) cannot be cleanly separated from Groups A/B within #354's single-file diff without either (a) a much larger PR that updates all 20+ files in the same change, mixing a rename with content corrections, or (b) leaving the rename half-applied (skill renamed, callers still say the old name — actively broken). Per the original instruction ("prefer a clean replacement if the rename and unrelated additions cannot be separated cleanly"), a clean replacement PR is the right call:

1. Keep `name: cloudflare-workflow` — do not rename in the replacement PR. If the team wants `cf-wf` later, that's a separate, deliberate, full-repo rename PR that updates all 35+ references atomically.
2. Cherry-pick Group A content as-is, with the two flagged fixes: correct or drop the IPI-468 citation, source/date the Workers-size-limit figures.
3. Keep Group B's MCP tool tables (they're genuinely useful and currently accurate), but add one caveat line noting these are environment/connector-specific and may need periodic re-verification — rather than presenting them as permanent fact.
4. Do not touch the `cf-wf` naming anywhere, including the "Skills × MCP Integration Table" row that currently says `**cf-wf** (this)`.

### 5. PR #354 replacement — ✅ EXECUTED as PR #396

Built in isolated worktree `/home/sk/wt-skills-cf-cleanup`, branch `docs/cf-workflow-harden-verification-guidance`, based on `origin/main` at `5e5bb89c` (current HEAD, includes #353 and #394). One commit, one file (`.claude/skills/cloudflare-workflow/SKILL.md`, +104/-0). Pushed and opened as **[#396](https://github.com/amo-tech-ai/lumina-studio/pull/396)**.

**What carried over from Group A, and how each flagged issue was resolved:**

| Group A item | Resolution in #396 |
|---|---|
| Official Sources Rule | Carried over verbatim (generic, no fixes needed) |
| CI Testing Audit | Carried over verbatim (generic, no fixes needed) |
| HTTP Header Edge Cases | Carried over; **IPI-468 citation removed** (not replaced with a guess) — the line now reads as a general lesson without a specific issue number attached |
| Known Cloudflare Gotchas — D1 remote/local mismatch | Carried over, reworded to be generic (no MCP tool-name coupling) |
| Known Cloudflare Gotchas — Workers script size limits | Carried over; **now cited** to [Workers platform limits](https://developers.cloudflare.com/workers/platform/limits/) — figures re-verified live via WebFetch this session (Free 3MB gzip/64MB uncompressed, Paid 10MB gzip/64MB uncompressed — matches #354's original figures exactly) |
| Known Cloudflare Gotchas — `nodejs_compat` flag placement | Carried over; **now cited** to [Node.js compatibility docs](https://developers.cloudflare.com/workers/runtime-apis/nodejs/) |
| Known Cloudflare Gotchas — KV reserved-`_`-prefix collisions | **Dropped.** Re-verification against the [KV write docs](https://developers.cloudflare.com/kv/api/write-key-value-pairs/) this session found no mention of any reserved-prefix behavior — the claim isn't documented anywhere official, so it wasn't carried into a replacement PR that leads with "cite the official source" |
| Workers AI embed dimension gotcha (768-d BGE) | **Dropped as redundant** — origin/main's existing "AI Gateway — Embed & Error Contract Gate" section already documents this exact fact with the same citation |

**Group B (MCP tool-name tables) and Group C (`cf-wf` rename): excluded entirely**, per instruction — not a "keep with a caveat" as the original recommendation above suggested, since the explicit execution instruction was narrower ("remove environment-specific MCP tool-name tables... do not include the rename").

**Verification checklist run before push:**

| Check | Result |
|---|---|
| Branch based directly on current `origin/main` | ✅ `5e5bb89c` |
| Exactly one commit | ✅ `git rev-list --count origin/main..HEAD` → 1 |
| Only intended file changed | ✅ `git diff --stat` → 1 file, `.claude/skills/cloudflare-workflow/SKILL.md` |
| No `mcp__` identifiers remain | ✅ `grep -n "mcp__"` → no match |
| No `cf-wf` string remains | ✅ `grep -n "cf-wf"` → no match |
| No `IPI-468` citation remains | ✅ `grep -n "IPI-468"` → no match |
| Frontmatter `name:` unchanged | ✅ still `cloudflare-workflow` |
| Pre-push gate | ✅ `tsc --noEmit` clean, `vitest run` 162 files / 1254 passed / 6 skipped |

**#354 closed** with a comment pointing to #396, explaining the A/B/C split and the two content fixes. Branch `docs/cloudflare-workflow-skill-corrections` preserved (not deleted), per instruction, until #396 merges.

Not yet done: the `.cursor/rules/cloudflare-workflow.mdc` missing-reference issue remains untouched, as instructed — still needs its own separate follow-up.

---

## Recommended decision

| PR       | Action                                          | Reason                                                                                                                                       |
| -------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **#353** | 🟢 Keep open and review for merge               | Focused, one file, still contains unique self-verification guidance not present on `main`                                                    |
| **#354** | 🟡 Do not merge unchanged; re-evaluate or split | Focused file scope, but it also renames the skill to `cf-wf` and adds broader content that may conflict with current skill cleanup decisions |
| **#355** | 🔴 Close as superseded                          | Its Cloudflare plan was subsequently archived, corrected, and replaced by newer PRs including #379 and #395                                  |

---

# PR #353 — Linear prompt self-verification

## Verdict: keep and merge after normal review

PR #353 is clean:

* one commit;
* one documentation file;
* 33 additions and 2 deletions;
* mergeable;
* no production code.

It adds:

* a verification-instructions section;
* naming-collision checks;
* a claim-to-source verification table;
* proof-first completion rules;
* Rule 8 for self-verification.

Current `main` still says "Seven rules" and does not include that verification block.

### Action

Keep #353 open. It is a focused and independently useful improvement.

Before merging, confirm:

| Check                                       | Expected                                                                     |
| --------------------------------------------- | -------------------------------------------------------------------------------|
| Changed files                               | Exactly one                                                                  |
| Path                                        | `.claude/skills/ipix-task-lifecycle/references/linear-prompt-engineering.md` |
| Conflicts with newer task-verifier guidance | None                                                                         |
| Broken relative links                       | None                                                                         |
| Review status                               | Green                                                                        |

**Recommendation: merge #353.**

---

# PR #354 — Cloudflare workflow skill corrections

## Verdict: useful content, but do not merge blindly

PR #354 changes one file and is mergeable.

However, it does more than correct size limits and Supabase routing. It also changes the frontmatter skill name from:

```yaml
name: cloudflare-workflow
```

to:

```yaml
name: cf-wf
```

Current `main` still uses `cloudflare-workflow` (confirmed live, not assumed).
The PR branch changes it to `cf-wf`.

It also adds:

* a long MCP tool reference;
* CI security audit guidance;
* an official-source hierarchy;
* new verification and blocking rules.

## Red flags

| Finding                                                 | Status |
| ---------------------------------------------------------- | :----: |
| One-file PR                                             |   🟢   |
| Skill rename may break references/triggers              |   🔴   |
| MCP tool names may become stale or environment-specific |   🟡   |
| Broad additions exceed the title's narrow stated scope  |   🟡   |
| Could overlap with later Cloudflare skill work          |   🟡   |
| Content remains potentially useful                      |   🟢   |

### Best approach

Do not close it immediately, but do not merge it as-is.

Choose one of these:

#### Preferred

Create a clean replacement PR that:

1. keeps the official skill name `cloudflare-workflow`;
2. cherry-picks only validated content corrections;
3. removes environment-specific MCP tool names unless they are guaranteed repository standards;
4. keeps official-source and CI-audit improvements;
5. verifies every limit and compatibility-date claim against current Cloudflare docs.

Suggested title:

**IPI-XXX · DOCS-CF-001 — Harden Cloudflare Workflow Verification Guidance**

#### Alternative

Update #354 itself to remove the rename and narrow the scope.

### Decision

| Question                 | Verdict |
| --------------------------- | --------- |
| Close immediately?       | No      |
| Merge unchanged?         | No      |
| Preserve useful content? | Yes     |
| Replace or revise?       | 🟢 Yes  |

---

# PR #355 — old Cloudflare migration plan

## Verdict: close as superseded

PR #355 is an older five-commit, 45-file Cloudflare-plan import with more than 10,000 additions. It is currently **not mergeable** (GitHub reports `CONFLICTING`).

Its scope includes:

* the old task plan;
* files later archived by PR #379;
* files corrected by #381–#383;
* files now comprehensively updated by #395;
* the Cloudflare workflow skill that should be handled separately in #354 or a replacement PR.

The changed-file list includes the same major task documents now owned by #395, including tasks `000–019`, `039`, `053`, and `054`. It also includes many plan-A files that were later deliberately archived.

## Why it must not merge

| Problem                                         | Result                |
| -------------------------------------------------- | ------------------------ |
| Old architecture/task assumptions               | Superseded            |
| Includes files later archived                   | Redundant/conflicting |
| Includes files corrected by later audits        | Stale                 |
| Includes skill change plus Cloudflare task docs | Mixed concerns         |
| Not mergeable                                   | Blocked                |
| Newer focused replacement exists                | #395                  |

### Action

Close #355 with a superseded comment.

Suggested comment:

```markdown
Superseded by the later Cloudflare remediation sequence:

- #379 archived the obsolete plan-A task set.
- #395 carries the current audited Cloudflare task corrections on a clean branch based on current `main`.
- Any remaining Cloudflare workflow skill improvements are being handled separately from the task-document migration plan.

This PR is intentionally closed without merge to avoid restoring stale or already-archived planning files.
```

Do not cherry-pick the complete #355 branch.

If any unique file appears valuable, recover it individually only after comparing it against current `main` and #395.

---

# Correct cleanup order

| Order | Action                                                                                |
| ----: | ---------------------------------------------------------------------------------------|
|     1 | Keep #353 and run normal review                                                       |
|     2 | Review #354's useful sections against current Cloudflare skill standards              |
|     3 | Remove or reject the `cf-wf` rename unless the full repo has intentionally adopted it |
|     4 | Replace or revise #354                                                                |
|     5 | Close #355 as superseded                                                              |
|     6 | Do not delete #355's branch until any genuinely unique files are checked              |
|     7 | Delete old branches only after replacements merge                                     |

## Final answer

| PR       | Final disposition                            |
| -------- | ----------------------------------------------- |
| **#353** | 🟢 Merge after review                        |
| **#354** | 🟡 Revise or replace; do not merge unchanged |
| **#355** | 🔴 Close as superseded by #379/#395          |

The highest-value immediate action is to merge the focused self-verification improvement in #353, preserve only the validated guidance from #354, and close the obsolete migration-plan PR #355.
