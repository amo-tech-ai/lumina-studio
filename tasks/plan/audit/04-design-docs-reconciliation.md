# Design Docs Reconciliation Audit — `Universal-design-prompt-new/` vs `Universal-design-prompt5/`

Audited 2026-07-09. Scope: `/home/sk/ipix/Universal-design-prompt-new/` (DESIGN.md, PLAN.md, REFACTOR.md, SITEMAP.md, PAGES-REORG-PLAN.md, MOBILE-PLAN.md, MOBILE-IMPROVE.md, ANALYTICS-PLAN.md, AI-EXPLAINABILITY.md, design-audit-2026-06-28-rev2.md, changelog.md, checklist.md, todo.md, `docs/`, `booking/`, `crm/`, `components/`), cross-checked against the sibling `Universal-design-prompt5/` folder. Every claim below is grounded in `diff`, `git log`, `git status`, and direct file reads — no claim is taken from a doc's own self-description without verifying on disk.

## Executive summary

The headline finding is not inside either folder's prose — it's the **relationship between the two folders**, which is a live, uncommitted split-brain:

- `Universal-design-prompt-new/` and `Universal-design-prompt5/` are **byte-identical on every file that exists in both** (`DESIGN.md`, `todo.md`, all of `Pages/`, all of `docs/` — confirmed via `diff -rq`, zero content differences reported).
- `Universal-design-prompt-new/` is the git-tracked copy (397 files tracked; restored via commit `84155521 chore(design): track Universal-design-prompt-new in git` after "the full Claude Design package... lost during Jul 8 worktree cleanup").
- `Universal-design-prompt5/` is **completely untracked** (`git ls-files` returns 0 files) — it is pure working-tree state, invisible to git, invisible to any fresh clone, and unprotected by any commit.
- Git's HEAD for `-new` still contains a `plan/` and `tasks/` tree (120 files) that **no longer exist on disk** in `-new` — `git status` shows all 120 as `D` (deleted, uncommitted). Those exact 120 files now live, uncommitted, in `Universal-design-prompt5/plan/` and `Universal-design-prompt5/tasks/`.
- `Universal-design-prompt5/plan/` also contains genuinely **new** content that was never committed anywhere in `-new`'s git history — e.g. `plan/design-prompts/SCR-32-planner-workspace.md`, `SCR-33-planner-dashboard.md`, `SCR-34-planner-instance-settings.md`, `plan/planner/architecture-plan.md` (`git log --all` for these paths returns nothing).
- `Universal-design-prompt-new/` in turn has two things `-new`-only: `HTML.md` (git-tracked) and an untracked `tests/` folder of QA screenshots (`?? Universal-design-prompt-new/tests/`).

**Net effect:** someone moved `plan/` + `tasks/` out of the committed `-new` tree into an untracked `prompt5` tree (as a rename or a manual copy-then-delete), kept working in `prompt5` (adding SCR-32/33/34 and planner docs), and never committed the deletion in `-new` nor ever `git add`ed `prompt5`. Today: (a) `git checkout -- Universal-design-prompt-new/` would silently resurrect the old `plan/`+`tasks/` in `-new` from HEAD, overwriting nothing in `prompt5` but creating a second, older copy; (b) if `prompt5/` is ever deleted, moved, or excluded by a future `.gitignore` entry, the SCR-32–34 planner work and the newer `plan/tasks` content vanish with no git history to recover from — exactly the "worktree cleanup" failure mode the Jul 8 recovery commit already had to fix once for `-new`.

This is the single highest-priority fix in this audit and is cheap: `git add -A Universal-design-prompt5/ && git rm -r --cached` the stale duplicate half, or better, decide which folder is canonical, `git mv` the unique `plan/`/`tasks/`/`HTML.md`/`tests/` content into it, and delete the other. Do not add more content to either folder until this is resolved — every doc edit made in the untracked folder today has the same loss exposure that triggered the Jul 8 recovery.

## Per-document verdict

| Doc | Verdict | Why |
|---|---|---|
| `DESIGN.md` | **Keep** | Current, byte-identical in both trees, actively the "single entry point" — but see Finding 5 (broken paths in its own Quick Start). |
| `PLAN.md` | **Delete or archive** | Self-admitted stale by the sibling `todo.md`: *"root `PLAN.md` (1/10) and `changelog.md` (Command Center only) are stale. The accurate detail is in `design-patched/plan.md`... Reconcile pending."* `PLAN.md` itself also says its own status is superseded (§ "Single source of truth for status = `docs/design/DESIGN-TASKS.md §0`"). Three status trackers (`PLAN.md`, `design-patched/plan.md`, `DESIGN-TASKS.md`) exist for the same thing; only one should remain live. |
| `REFACTOR.md` | **Keep** | Distinct purpose (pre-React code-refactor audit of the `.dc.html` files: line counts, icon-system drift, shared-shell duplication) — not a duplicate of the other four "plan-shaped" docs. Companion doc `crm/CRM-REFACTOR-AUDIT.md` is cross-referenced, not overlapping. |
| `PAGES-REORG-PLAN.md` | **Keep, mark closed** | Distinct purpose (file/directory migration record), and its own header says the migration executed 2026-07-06 and is done except an optional Phase C rename and a still-open Phase D ("21 docs still reference old paths" — not re-verified in this pass, worth a follow-up spot check). Should be moved to an `archive/` or have its status line updated so it stops reading as an open plan. |
| `MOBILE-PLAN.md` | **Keep** | Distinct purpose (mobile screen build/spec tracker with its own progress table), legitimately large (90KB) because it's both spec and per-screen verification log. Not a duplicate of `MOBILE-IMPROVE.md`. |
| `MOBILE-IMPROVE.md` | **Keep** | Explicitly scoped as review/scoring backlog, companion to `MOBILE-PLAN.md` ("this doc is the review + backlog" vs. "spec + rollout") — genuinely different content (scorecard, rubric, per-screen findings), not overlap. |
| `changelog.md` (68KB) | **Update / reconcile** | Same self-admitted staleness as `PLAN.md` — `todo.md` calls out root `changelog.md` as covering "Command Center only" and stale vs. `design-patched/changelog.md`. Two changelogs for one project is the same duplication pattern as the `PLAN.md` situation, just one directory level down (`design-patched/` vs. root). |
| `checklist.md` (46KB) | **Keep, but re-point** | Explicitly labelled by its own header as "a point-in-time audit record (2026-06-29)," deferring live status to `docs/design/DESIGN-TASKS.md §0`. Internally consistent about its own limits — fine as a historical record, just should not be read as current status (it already says so). |
| `todo.md` | **Keep** | Most self-aware doc in the set — correctly flags the `PLAN.md`/`changelog.md` staleness itself and points to the real source of truth. Good state; no action needed beyond acting on its own "Reconcile pending" note. |
| `SITEMAP.md` | **Keep** | Not read to the same depth as the others in this pass (not flagged as duplicated by any other doc); no conflicting claims found. |
| `ANALYTICS-PLAN.md`, `AI-EXPLAINABILITY.md` | **Keep** | Narrow, single-purpose docs; no overlap or conflict found with anything else in the set. |
| `design-audit-2026-06-28-rev2.md` | **Superseded, archive** | Explicitly superseded by `docs/design/DESIGN-AUDIT-2026-07-01.md`, which opens by saying the project is "materially more complete than the last audit (`design-audit-2026-06-28-rev2.md`)." Root-level location for a dated, superseded audit is clutter — move to `archive/` (which already exists in this folder and holds a similar prior doc). |
| `docs/design/DESIGN-AUDIT-2026-07-01.md` | **Keep — most authoritative doc in the set** | This is a forensic self-audit that already found the exact class of problem this task was asked to find: its own "Documentation Drift" section flags screen-count mismatches ("11 screens"/"10 screens" vs. the actual 13) and inconsistent component counts (21 vs. 20+1). Treat this as the standing reconciliation checklist rather than writing a new one from scratch. |

## Vercel / Groq stale-content check

**Finding: clean.** No stale Vercel-as-host or Groq-as-primary-AI-provider guidance exists anywhere in this doc set.

- `grep -rni "vercel"` across every `.md` in `Universal-design-prompt-new/` returns exactly 2 hits, both in secondary/archived files, both about **design-tool export options**, not deployment infrastructure:
  - `uploads/claude-design/design-plan.md:31`: `| Export to Figma / Vercel / Claude Code | ✅ | Vercel deploy + Claude Code handoff most useful |`
  - `design-patched/archive/2026-06-design-setup-plan.md:36`: identical line, in an archived doc.
  
  Neither implies the *product* deploys to Vercel — both are comparing where a Claude-Design HTML export could be previewed. Not a conflict with the Cloudflare Workers/OpenNext migration in `tasks/cloudflare/`. No action needed.
- `grep -rni "groq"` across the same scope returns **zero hits**. No AI-provider guidance in this doc set references Groq at all, so there is no stale Groq-as-primary claim to reconcile against the Workers AI/Gemini direction.

## Missing-file finding (Severity: Medium — broken doc paths, not lost content)

`DESIGN.md`'s own "Quick Start" (lines 9–19) instructs every Claude Design session to upload/paste, in order:

```
docs/design/claude-design/00-README.md
docs/design/claude-design/prompts/00-universal.md
docs/design/claude-design/00-upload-manifest.md
```

**None of these paths exist.** `docs/design/` has no `claude-design/` subfolder at all (confirmed: `ls docs/design/ | grep -i claude` → no match). The files themselves exist, but at different paths, and in **two different, non-identical versions**:

1. `uploads/claude-design/00-README.md`, `uploads/claude-design/prompts/00-universal.md`, `uploads/claude-design/00-upload-manifest.md` — the older **v2 "Atelier"** version (warm beige, orange accents).
2. `design-patched/00-README.md`, `design-patched/prompts/00-universal.md` — a newer **v3 "Zeely Editorial"** version (white/black, image-first, chat dock) that materially disagrees with the v2 copy (confirmed via `diff`: different token values, different nav description, adds a whole "Global AI chat dock" section and an "Imagery — non-negotiable" section absent from v2). `design-patched/` has **no** `00-upload-manifest.md` at all — that file only exists under `uploads/claude-design/`.

So a reader following `DESIGN.md`'s own Quick Start literally hits three broken links, and even after finding the right files by search, would have to choose between two contradictory README versions and splice the manifest from one directory with the README from another. Given `DESIGN.md` itself declares v3 "Zeely Editorial" as current (its own header), the `design-patched/` version is presumably the intended target — but the upload manifest for it doesn't exist anywhere.

**Recommendation (lean):** either (a) fix the 3 broken paths in `DESIGN.md` to point at wherever the v3 files actually live (`design-patched/` + a missing manifest to be written), or (b) if `design-patched/` is meant to be merged into `docs/design/claude-design/` as the literal target path, do that move once and update the 3 references — don't maintain 2 physical copies of the onboarding kit as well as the 2 physical copies of the whole `Universal-design-prompt-*` tree.

## `docs/` subfolder reality check

`docs/design/`, `docs/handoff/`, and `docs/models/` all exist and are populated (17, 15, and 6 files respectively) and are identical between `-new` and `prompt5`. This part of `DESIGN.md`'s assumed structure is accurate — the gap is specifically the `docs/design/claude-design/` subpath referenced only in the Quick Start section (see above), which was never created under `docs/`.

## Conflicting-docs check (`checklist.md` / `todo.md` vs. `changelog.md`)

No new conflict found beyond what the docs already flag on themselves — the set is unusually self-auditing:

- `todo.md` (top of file): *"⚠️ Source-of-truth note: root `PLAN.md` (1/10) and `changelog.md` (Command Center only) are stale. The accurate detail is in `design-patched/plan.md` + `design-patched/changelog.md` and this tracker. Reconcile pending (see Now)."* — i.e. the doc set already knows `PLAN.md`/`changelog.md` conflict with reality and has an open, unresolved TODO to fix it.
- `checklist.md` and `todo.md` both correctly defer live counts to `docs/design/DESIGN-TASKS.md §0` rather than asserting their own — sampled screen counts ("13 screens," "10/10 built") are consistent between `todo.md`, `checklist.md`, and `DESIGN-TASKS.md` at the point each was written.
- `docs/design/DESIGN-AUDIT-2026-07-01.md` independently flags the same drift class ("Documentation Drift" section: stale "11 screens"/"10 screens" language vs. 13 actually built, inconsistent component counts) — this is a second, independent confirmation of the exact same conflict, from a doc that already exists in the tree.

**Conclusion:** the "conflict" isn't hidden — it's a known, self-documented, unresolved reconciliation debt (`PLAN.md` + root `changelog.md` vs. `design-patched/` + `DESIGN-TASKS.md`) that the docs themselves have been tracking since at least 2026-07-01 without anyone closing it out. Closing it is a doc-merge task (fold `design-patched/plan.md` and `design-patched/changelog.md` into the root files, or delete the root ones and repoint every cross-reference at `design-patched/`), not a new investigation.

## Recommended actions, ranked by payoff/effort

1. **(Highest priority, cheap)** Resolve the `-new` vs. `prompt5` split-brain: pick one folder as canonical, move the unique content (`prompt5`'s `plan/`+`tasks/` incl. SCR-32–34; `-new`'s `HTML.md`+`tests/`) into it, `git add` everything, delete the other folder. Until this happens, any edit made in `prompt5` carries the same uncommitted-loss risk that already cost a recovery effort on Jul 8.
2. **(Medium priority, cheap)** Fix `DESIGN.md`'s 3 broken Quick Start paths (`docs/design/claude-design/...` → wherever the v3 kit actually ends up living after #1).
3. **(Low priority, already scoped by existing docs)** Execute the reconciliation `todo.md` already flags: fold `design-patched/plan.md` + `design-patched/changelog.md` into (or replace) the root `PLAN.md` + `changelog.md`, and archive `design-audit-2026-06-28-rev2.md` next to the existing `archive/` folder since it's explicitly superseded.
4. **(Low priority, optional)** Complete `PAGES-REORG-PLAN.md`'s self-described Phase D (spot-check whether the "21 docs still reference old paths" claim is still true) or mark the doc closed/archived if it no longer needs tracking.

No wholesale restructuring proposed — every recommendation above is a merge/move/delete of what already exists, per the audit's scope.
