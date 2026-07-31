---
title: "Linear & Project Process — Report"
version: "1.0"
lastUpdated: "2026-07-31"
status: Active
purpose: "How iPix tracks work today, why the markdown trackers keep drifting, and how to make Linear the machine-readable source of order."
ssot: ../../../tasks/plan/todo.md
verifiedAgainst: "tasks/plan/todo.md v3.9.1 · tasks/todo.md v2.1 · docs/linear/issues/ · docs/index-docs.md"
verifiedAt: "2026-07-31"
scores: { core: 70, advanced: 40, overall: 58 }
---

# Linear & Process — 58/100 (C+) 🟡

**One-line problem:** the answer to "what do we build next" lives in a 400-line
markdown file that a human must read and keep in sync by hand.

> ⚠️ **Linear MCP requires interactive approval** and could not be queried in this
> session. Everything below is verified against the repo's own trackers. Run
> [`PROMPTS.md` §8](../PROMPTS.md) in an interactive session to verify the Linear
> side.

---

## 1. What exists

| Thing | State | Evidence |
|-------|:-----:|----------|
| Linear team `IPI` | 🟢 | `linear.app/amo100/team/IPI` |
| Projects | 🟢 | AI INTELLIGENCE · BRAND |
| Per-issue acceptance docs | 🟢 | `docs/linear/issues/IPI-*.md` |
| Branch naming convention | 🟢 | `ipi/<issue>-<name>`, enforced by `worktree:add` |
| PR ↔ issue linkage | 🟢 | PR titles carry IPI-NNN |
| Master markdown tracker | 🟡 | `tasks/plan/todo.md` — self-scored 82/100 |
| Design parity mirror | 🟡 | `tasks/todo.md` — explicitly "mirror only" |
| **Cycles** | 🔴 | not referenced anywhere in the repo |
| **Milestones** | 🔴 | no evidence of use |
| **`mvp` / `p0` labels** | 🔴 | priority lives in markdown, not labels |
| Issues for known work | 🔴 | STR-001–003 marked *"No Linear issues"* |

---

## 2. The core problem

The repo has **two** markdown trackers plus Linear, and they each hold state:

| Tracker | Role | Version | Risk |
|---------|------|---------|------|
| `tasks/plan/todo.md` | "canonical master" — priority, sprint, blockers | 3.9.1 | Hand-maintained |
| `tasks/todo.md` | design-vs-code parity mirror | 2.1 | Says "mirror only — update plan/todo.md first" |
| Linear IPI | issues + status | — | Not the order-of-work source |

The discipline is genuinely good — `tasks/todo.md` opens with *"Not the execution
master"* and `docs/index-docs.md` carries its own staleness banner. That's more
self-awareness than most repos manage.

**But state that must be manually mirrored will drift.** `tasks/plan/todo.md` was
last verified 2026-07-02 — four weeks before this report. The frontmatter still
cites `verifiedMain: 0479aba` and PR #181 as an open draft.

---

## 3. What Linear features would fix

| Feature | Fixes | How |
|---------|-------|-----|
| **Cycles** | "what's in this sprint" | Enable 2-week cycles; the current-sprint section of `plan/todo.md` disappears |
| **Project milestones** | "what's left before launch" | One milestone per MVP proof (`mvp.md` proofs 1–8) |
| **Labels** `mvp`, `p0`, `stack:*` | filtering without reading markdown | Label every issue; the priority table becomes a saved view |
| **Initiatives** | grouping BRAND + AI INTELLIGENCE under "MVP launch" | One roadmap view |
| **Triage** | new work lands somewhere | Currently new work appears as a markdown row |
| **Saved views** | replaces the tracker tables | "MVP · not done · ordered by priority" is a URL, not a file |

---

## 4. Target model

| Question | Answer today | Answer after |
|----------|--------------|--------------|
| What ships in MVP? | `mvp.md` | Linear milestone + `mvp` label |
| What's next? | Read `tasks/plan/todo.md` | Current cycle, ordered by priority |
| Is IPI-NNN done? | A markdown row says so | Issue state + linked PR + passing CI |
| What's blocked? | A "blockers" section | `blocked` label + relation |
| Design vs code parity | `tasks/todo.md` | Keep — it's a genuinely different axis |

**Keep `tasks/todo.md`.** Design-vs-code parity with screenshot evidence is not
something Linear models well, and that file is honest about being a mirror.
**Shrink `tasks/plan/todo.md`** to architecture rules + links into Linear views.

---

## 5. Verifying issues against code

The rule that matters: **an issue's own description is not evidence.**

| Verdict | Requires |
|---------|----------|
| VERIFIED | A file, PR, or passing test that demonstrates the behaviour |
| UNPROVEN | Marked done, no code found |
| CONTRADICTED | Code shows the opposite |

**Real example from this audit.** `tasks/todo.md` row `MVP-7 · Asset DNA scoring
UI` is marked 🟡 35% with the note *"DNA gallery blocked on assets."* Checking the
code: `creative-director` has all 3 asset-intelligence tools wired
(`agents/index.ts:96`), `audit-asset-dna` is deployed, and the `assets` table has
35 rows. So the backend is further along than 35% suggests — the gap is UI only.
That's the kind of drift a code-verified pass catches and a hand-updated table
does not.

---

## 6. Progress tracker

| ID | Task | | % | Examine | Verify | Blocker |
|----|------|:-:|--:|---------|--------|---------|
| LN-01 | Team + projects | 🟢 | 90 | Linear IPI | `list_teams` | — |
| LN-02 | Per-issue acceptance docs | 🟢 | 85 | `docs/linear/issues/` | `ls` | — |
| LN-03 | Branch/PR linkage | 🟢 | 90 | `worktree:add` | branch names | — |
| LN-04 | Cycles | 🔴 | 0 | — | `list_cycles` | not enabled |
| LN-05 | Milestones | 🔴 | 10 | — | `list_milestones` | not populated |
| LN-06 | `mvp` / `p0` labels | 🔴 | 0 | markdown priority | `list_issue_labels` | not created |
| LN-07 | STR issues filed | 🔴 | 0 | `tasks/todo.md` | `list_issues` | blocks payments tracking |
| LN-08 | Code-verified statuses | 🔴 | 20 | `tasks/plan/todo.md` | PROMPTS §8 | manual |
| LN-09 | Tracker freshness | 🟡 | 50 | `verifiedAt: 2026-07-02` | frontmatter | 4 weeks stale |

---

## 7. Next 5 tasks

| # | Task | Effort | Why |
|:-:|------|:------:|-----|
| 1 | Run [PROMPTS §8](../PROMPTS.md) — verify every non-Done IPI issue against code | M | Establishes real state before restructuring anything |
| 2 | Create `mvp`, `p0`, `blocked`, `stack:*` labels; apply to launch-critical issues | S | Makes priority machine-readable |
| 3 | Enable cycles; put the launch-critical set in the current cycle | S | Retires the "current sprint" markdown section |
| 4 | One milestone per `mvp.md` proof (1–8); attach issues | M | "What's left before launch" becomes a progress bar |
| 5 | File STR-001–003 with real titles | S | Payments work is invisible to tracking today |

---

## 8. Sources

- Local: `tasks/plan/todo.md` v3.9.1 · `tasks/todo.md` v2.1 · `mvp.md` · `docs/linear/issues/`
- Skill: `linear` · `ipix-task-lifecycle`
- Prompt: [`PROMPTS.md` §8](../PROMPTS.md)
