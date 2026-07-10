# Master Reconciliation Synthesis — iPix Platform Planning Audit

**Date:** 2026-07-09
**Origin:** `tasks/plan/prompt-plan.md` asked for an 11-phase, from-scratch architecture rebuild (PRDs, roadmaps, ADRs, Mermaid diagrams, a full `/docs/v3/` tree) for Cloudflare/Mastra/CopilotKit/Supabase/etc. Before running that, we audited what already exists. **This is that audit's answer.**

## The one-sentence verdict

**The existing planning is overwhelmingly accurate — do not run the 11-phase rebuild.** Across 5 independent forensic audits (Cloudflare/infra, Mastra/AI, Linear backlog, design docs, repo ground truth), almost every claim in the existing docs checked out against real code, real PRs, and live Linear. The actual work items are: one urgent git-hygiene fix, a handful of doc merges/deletes, two Linear-hygiene fixes, and two one-paragraph additions to an existing doc — **zero new PRDs, zero new roadmaps, zero new ADRs, no `/docs/v3/` tree.**

## Scorecard

| Area | Grade | Verdict |
|---|:---:|---|
| Cloudflare/infra docs (`CLOUDFLARE-EPIC.md`, `todo.md`, `cf-000-*`, `migration/*`, `audits/*` — 26 files) | 🟡 | Accurate in substance. Two internal % self-contradictions, one factually stale audit file, ~7 of 12 migration notes safe to prune. No architecture redesign needed. |
| Mastra/AI architecture docs (`MASTRA-EPIC.md`, `mastra-audit.md`, `ai-agent-architecture.md`) | 🟢 | Unusually accurate — correctly tracks the two things that actually matter (missing `model-registry.ts`, unwired AI Gateway). Real finding was in Linear's own issue bodies, not these docs. |
| Linear backlog (488 issues, confirmed via both live MCP and the real `ALL issues.csv` export) | 🟢 | Healthy: 41% Done+Canceled, disciplined duplicate-tagging. Needs 5 issues created + ~21 issues given a Project — hygiene, not triage. |
| Design docs (`Universal-design-prompt-new/` + `Universal-design-prompt5/`) | 🔴 | Content itself is fine (no stale Vercel/Groq guidance). But the two folders are in a **live git split-brain with real data-loss exposure** — this is the single most urgent finding across all 5 audits. |
| Repo ground truth (`app/` codebase) | ⚪ | Reference snapshot, not a grade — but surfaced that Cloudflare/OpenNext scaffolding (`wrangler.jsonc`, `open-next.config.ts`, `middleware.ts`) is untracked in git right now. |

---

## Do this first (real risk, not just cleanup)

### 1. 🔴 Fix the `Universal-design-prompt-new` / `Universal-design-prompt5` git split-brain

`Universal-design-prompt5/` — where today's new Planner design-prompt work (`SCR-32/33/34`, `plan/planner/architecture-plan.md`) lives — is **completely untracked in git** (`git ls-files` → 0 files). Meanwhile `Universal-design-prompt-new/` (the git-tracked folder) shows 120 files staged as deletions, because that content moved into the untracked `prompt5/` folder and was never re-committed. If `prompt5/` is ever cleaned up, moved, or gitignored, today's new work disappears with no history to recover from — the exact failure mode that already required a recovery commit on Jul 8.

**Action:** decide which folder is canonical, `git mv` the unique content into it (prompt5's `plan/`+`tasks/`+new SCR files; `-new`'s `HTML.md`+`tests/`), `git add`, delete the other folder. This is a decision only you should make (which folder wins), but it shouldn't wait — every edit made in `prompt5/` today carries the same loss exposure. Detail: `04-design-docs-reconciliation.md`.

### 2. 🟡 Commit or reconcile the untracked Cloudflare scaffolding

`app/wrangler.jsonc`, `app/open-next.config.ts`, and `app/src/middleware.ts` all exist on disk and are referenced as "done" by `todo.md`/`CLOUDFLARE-EPIC.md`, but are **untracked** in the current working tree. Separately, the working tree also has **uncommitted deletions** of `config/groq-models.json` + its schema, which are valid on `main` — if that deletion ever got committed, it would break the Groq provider path (`provider.ts`'s `loadGroqModelsConfig()` throws if the file is missing). Neither is this audit's job to fix (both are incidental to whatever branch work is in flight), but both are worth resolving before the next commit on this branch. Detail: `00-repo-ground-truth.md` §12, `02-mastra-ai-reconciliation.md` Appendix.

---

## Quick doc fixes (merge/update/delete — no new documents)

These are all edits to what already exists, ranked by payoff/effort, per audit:

**Cloudflare/infra** (`01-cloudflare-infra-reconciliation.md`):
- Reconcile `todo.md` (~58%) vs. its own declared SSOT `CLOUDFLARE-EPIC.md` (~55%) — pick one number or label them as measuring different scopes.
- Fix `CLOUDFLARE-EPIC.md`'s internal self-contradiction on IPI-469/IPI-471 status (shown both 🟢 and 🟡 in different tables of the same doc).
- Delete/replace `audits/09-gemini-groq-audit.md` — it treats the Groq track as a live blocker; the whole Groq epic (IPI-355/360/361) was Canceled the day before that audit's snapshot. `audits/audit-2-linear.md` already has it right.
- Archive 7 of 12 `migration/*.md` files (superseded snapshots, a raw session transcript, and the wrong-guide doc mirror) — keep the 5 that are still live reference.
- Add two short paragraphs to `cf-000-platform-architecture.md`: a Rate Limiting policy line and a Cost Optimization pointer (the only real gaps versus the original Phase-4 service checklist — everything else is answered, just not co-located).
- Decide `deep-architecture-review.md`'s fate: don't delete outright (it has a real, un-actioned 70-issue Linear audit and a cost table), but either action its findings into Linear now or mark it "Draft — not adopted" so its unexecuted "supersedes" claim stops being misleading.
- Resolve the one open contradiction between `plan-migrate.md` and `cf-000-platform-architecture.md` on whether Vercel or Cloudflare is the long-term Next.js host — `plan-migrate.md` already flags this itself, just needs a one-line resolution recorded.

**Mastra/AI** (`02-mastra-ai-reconciliation.md`):
- Fix two Linear issue descriptions with dead/fabricated proof: IPI-471 points at a deleted doc path (real doc moved to `tasks/cloudflare/plan/ai-agent-architecture.md`); IPI-461 cites a `provider-adapter.ts` file that **does not exist anywhere in repo history** — a hallucinated or reverted status claim. The good news: `MASTRA-EPIC.md`/`mastra-audit.md` weren't fooled by either.
- Delete or clearly re-label `cloudflare-mastra-build.md` — it's a verbatim public blog post about a D1/Vectorize architecture iPix doesn't use, zero iPix-specific content.
- Archive `mastra issues.md` (300KB raw Linear export — this is literally the source of the two fabricated proof claims above; everything useful in it is already in the two curated 44KB docs).
- Add IPI-473 (Prompt Registry) back into `MASTRA-EPIC.md`'s child-issue table — it's tracked in Linear and in the architecture doc, just fell out of the epic's own dependency list.

**Linear** (`03-linear-issues-reconciliation.md`):
- Create the 5 missing `CF-MIG-*` Linear issues (hosting track) — currently text-only inside `IPI-487`'s description, invisible to any Linear view/cycle. Already flagged in `todo.md`, just not done yet.
- Attach a Project to ~19 Cloudinary `CLD-1xx` issues plus both top-level epics (IPI-486, IPI-487), which are currently invisible in project-scoped views.
- Point future Linear audits at `linear/ALL issues.csv` (488 rows, confirmed current and accurate) instead of `linear/all-issues.md` (only 15 recent-activity rows, mislabeled).

**Design** (`04-design-docs-reconciliation.md`):
- Fix `DESIGN.md`'s 3 broken Quick Start paths (`docs/design/claude-design/...` doesn't exist; the real files live split across `uploads/claude-design/` [old v2] and `design-patched/` [new v3, missing its manifest]).
- Execute the doc set's own already-flagged, already-known reconciliation debt: fold `design-patched/plan.md` + `design-patched/changelog.md` into (or replace) the root `PLAN.md` + `changelog.md` — `todo.md` has said "Reconcile pending" on this since before today.
- Archive `design-audit-2026-06-28-rev2.md` (explicitly superseded by `docs/design/DESIGN-AUDIT-2026-07-01.md`).

---

## What this means for the original 11-phase ask

Mapping back to `prompt-plan.md`'s phases:

| Original phase | Verdict |
|---|---|
| Phase 1 — Repo Audit | **Done** — `00-repo-ground-truth.md` is the factual snapshot originally requested, scoped to what's true rather than what's claimed. |
| Phase 2 — Documentation Audit | **Done** — `04-design-docs-reconciliation.md` covers `Universal-design-prompt-new`; Cloudflare docs covered in `01-`. No Vercel/Groq staleness found in design docs (clean); Cloudflare docs' staleness was narrow (one audit file) not systemic. |
| Phase 3 — Linear Audit | **Done** — `03-linear-issues-reconciliation.md`, cross-checked against the real 488-row export. Backlog is healthy; only hygiene fixes needed. |
| Phase 4 — Cloudflare Architecture | **Already exists and is accurate** (`cf-000-platform-architecture.md`, Approved). Only gap: 2 short paragraphs (rate limiting, cost). **No new document needed.** |
| Phase 5 — AI Architecture | **Already exists and is accurate** (`ai-agent-architecture.md`, Approved; `MASTRA-EPIC.md`). Only gap: 1 bookkeeping fix (IPI-473). **No new document needed.** |
| Phase 6 — Feature Architecture | Partially covered by `00-repo-ground-truth.md` §2 (per-feature current-state table: CRM/Booking/Shoot/Brand real; Campaign/Planner/Intelligence partial-or-missing). A full "target state + risks + priority" write-up per feature was **not** produced — flag if you still want this; it's the one phase where a genuine gap plausibly exists, since no prior doc covers "target state" for Campaign/Planner/Intelligence specifically. |
| Phase 7 — PRDs (per subsystem) | **Not produced, and evidence suggests not needed** — every subsystem audited already had an Approved or accurate architecture doc. If you want a PRD for a *specific* still-thin area (Campaign, Planner, Intelligence — the 3 features `00-repo-ground-truth.md` found weakest), say which one rather than generating 15 speculative PRDs. |
| Phase 8 — Roadmaps | **Already exists** (`CLOUDFLARE-EPIC.md`'s Gantt, `MASTRA-EPIC.md`'s phase plan, `todo.md`'s 10-task tracker). No new roadmap set needed. |
| Phase 9 — Mermaid Diagrams | Existing docs already contain C4/sequence/Gantt/flowchart diagrams throughout (`CLOUDFLARE-EPIC.md`, `ai-agent-architecture.md`, `IPI-454`'s own body). No evidence of a diagram gap. |
| Phase 10 — File Structure | Not needed — `tasks/cloudflare/`, `tasks/plan/`, `linear/` already have a working structure; the fixes above are pruning/reconciling it, not restructuring it. |
| Phase 11 — Skills | Not evaluated in this pass (out of scope for a doc-reconciliation audit) — flag separately if wanted. |

**Bottom line: the only phase with a plausible real gap is Phase 6/7 for three specific features (Campaign, Planner, Intelligence) that `00-repo-ground-truth.md` found to be thin or code-only.** Everything else the master prompt asked for already exists, is accurate, and just needed verification — which is what these 5 reports are.

## Where to look next

- Full detail per area: `00-repo-ground-truth.md`, `01-cloudflare-infra-reconciliation.md`, `02-mastra-ai-reconciliation.md`, `03-linear-issues-reconciliation.md`, `04-design-docs-reconciliation.md` (all in this folder).
- If you want Phase 6/7 depth for Campaign/Planner/Intelligence specifically, that's a small, targeted follow-up — not a reason to run the other 8 phases.
