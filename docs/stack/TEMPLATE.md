---
title: "iPix Doc & Tracker Template"
version: "1.0"
lastUpdated: "2026-07-31"
purpose: "The shape every stack doc, mini-report, and progress tracker uses. Plus the archive policy for stale docs."
---

# Doc & Tracker Template

The repo has 20 `docs/` directories and 13 `tasks/` directories. They drifted because
each was invented separately. This is the shape everything new uses.

---

## 1. Frontmatter (required)

```yaml
---
title: "<Stack> — Feature Adoption Report"
version: "1.0"
lastUpdated: "YYYY-MM-DD"
status: Active | Archive
purpose: "One sentence. What question does this doc answer?"
ssot: ../../tasks/plan/todo.md   # the doc that wins if this one disagrees
                                 # depth-sensitive: ../../ from docs/stack/,
                                 # ../../../ from docs/stack/reports/
verifiedAgainst: "files + live systems checked"
verifiedAt: "YYYY-MM-DD"
scores:
  core: 0
  advanced: 0
  overall: 0
---
```

`ssot` is the important field. A doc that does not name what overrides it becomes a
second source of truth by accident — that is exactly how `docs/index-docs.md` ended
up self-declaring stale.

---

## 2. Section order (do not reorder)

| § | Section | Contains |
|---|---------|----------|
| 1 | Summary table | Score, dot, one-line problem. Readable in 10 seconds |
| 2 | What we use today | `file:line` evidence for every claim |
| 3 | What the platform offers | Docs link for every feature named |
| 4 | The gap | Unused feature → the custom file it would replace |
| 5 | Real iPix example | An actual screen, table, or operator sentence |
| 6 | Progress tracker | The table in §3 below |
| 7 | Next 5 tasks | Ordered, with effort and blocker |
| 8 | Sources | Every URL used |

---

## 3. Progress tracker table (canonical shape)

Matches the convention already used in `tasks/todo.md` and `tasks/plan/todo.md` —
do not invent a new one.

```markdown
**Legend:** 🟢 complete · 🟡 in progress · 🔴 failed / attention · ⚪ not started

| ID | Task | | % | Examine | Verify | Blocker |
|----|------|:-:|--:|---------|--------|---------|
| ST-01 | Short task name | 🟡 | 45 | where to look | the command | what stops it |
```

`Examine` and `Verify` are required — a row without both is an opinion, not a
tracker entry. Add an optional `Proof` column (link or PR) only where a row's
evidence is a merged change rather than a command you can re-run; leaving a
column that is empty in most rows is decoration.

| Column | Rule |
|--------|------|
| `ID` | `ST-NN` for stack rows, `IPI-NNN` for Linear-backed work |
| `%` | Feature adoption, not effort spent |
| dot | 🟢 ≥80 · 🟡 40–79 · 🔴 <40 · ⚪ 0 |
| `Examine` | A path or a table name. Never "the codebase" |
| `Verify` | **A runnable command.** A row with no command is a guess |
| `Proof` | PR link, screenshot path, or test output |
| `Blocker` | What stops the next 20%. `—` if nothing |

---

## 4. Scoring model

```text
Overall = (Core × 0.6) + (Advanced × 0.4)
```

| Band | Grade | Dot | Means |
|-----:|:-----:|:---:|-------|
| 90–100 | A | 🟢 | Using the platform as designed |
| 80–89 | B+ | 🟢 | Solid, minor gaps |
| 70–79 | B− | 🟡 | Works, but hand-rolling some of it |
| 60–69 | C++ | 🟡 | Meaningful custom code the platform would replace |
| 55–59 | C+ | 🟡 | Core solid, advanced barely started |
| 45–54 | C | 🟡 | Core only. Advanced surface untouched |
| 40–44 | C− | 🟡 | Core has real holes too |
| 25–39 | D | 🔴 | Configured but not really adopted |
| 0–24 | F | 🔴 | Absent or non-functional |

**Core** = the baseline you cannot ship without (agents, tables, auth, deploys).
**Advanced** = what the platform gives free that we currently hand-build (scorers,
realtime, MediaFlows, HITL primitives, Durable Objects).

A stack scoring 🔴 does **not** mean the feature is broken. It means we wrote code
the vendor would have given us.

---

## 5. Archive policy

Never delete a stale doc — a dead link is better than a silently rewritten history.

| Step | Action |
|:----:|--------|
| 1 | Set `status: Archive` in frontmatter |
| 2 | Add the banner below at the very top of the body |
| 3 | `git mv` to `docs/archive/<year>/` |
| 4 | Update every inbound link (`grep -rn "old-path" docs tasks *.md`) |
| 5 | Docs-only commit — never mixed with production files |

```markdown
> **⚠️ Archived YYYY-MM-DD.** Superseded by [`<new doc>`](<path>).
> Kept for history. Do not use for current decisions.
```

**Stale triggers:** no update in 30 days · contradicts `tasks/plan/todo.md` ·
references a retired path (`src/`, `VITE_`, `/dashboard/*`) · its owner shipped
the work and moved on.

---

## 6. Per-stack folder layout

```text
docs/stack/
├── README.md              # master scorecard — the only cross-stack SSOT
├── PROMPTS.md             # one prompt per stack
├── TEMPLATE.md            # this file
└── reports/
    └── NN-<stack>.md      # one mini-report per stack, §2 section order
```

Deep working notes stay where they are (`tasks/<stack>/`). `docs/stack/reports/`
holds the **scored summary** and links down into them. One direction only —
reports link to task notes, never the reverse.

---

## 7. New-stack checklist

| | Step |
|:-:|------|
| ☐ | Copy this template into `docs/stack/reports/NN-<stack>.md` |
| ☐ | Add a prompt to `PROMPTS.md` |
| ☐ | Add a row to `README.md` §1 scorecard **and** §4 tracker |
| ☐ | Fill `Verify` with a command that actually runs |
| ☐ | Add the doc link to `README.md` §7 |
| ☐ | Commit docs-only |

---

## 8. Anti-patterns

| Don't | Why | Do |
|-------|-----|-----|
| Two docs claiming SSOT | Trackers drift, nobody knows which is real | One SSOT, everything else links |
| A `%` with no command | Becomes folklore within a week | Command in `Verify` |
| "the codebase" in `Examine` | Unactionable | A path or table name |
| Restating another doc's content | Two copies to update, one gets stale | Link |
| Deleting a stale doc | History disappears mid-argument | Banner + archive |
| Mixing docs + code in one PR | Repo hard rule (PR #99 fallout) | Split |
| A count without names ("37 tables") | Cannot act on it | Name them |
