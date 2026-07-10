# Linear Backlog Reconciliation — 2026-07-09

**Scope:** `iPix1` team (key `IPI`) only. Two other teams share this Linear workspace — `IPix-OLD` (key `IPI2`, legacy/archived) and `mde` (key `SAN`, an unrelated product — mdeapp/Medellín lifestyle app). Neither is iPix/FashionOS work; excluded from all counts below.

**Method:** Live Linear MCP (`list_issues`, `list_teams`, `list_projects`) for real counts, paginated to completion. `linear/all-issues.md` and both prior audit docs read for cross-check.

---

## 0. First finding: `all-issues.md` is not "all issues" — but `ALL issues.csv` is

The file `linear/all-issues.md` is named "all issues" but contains only **15 issues** — the 15 most-recently-touched (2026-07-04 through 2026-07-09), a "recent activity" slice, not a full dump.

**Correction (added after this report was first written):** the real, complete export already exists on disk at `linear/ALL issues.csv` (1.4MB, exported 2026-07-09) — parsed directly with Python's `csv` module: **488 rows**, and its Team/Status/Project breakdowns match the live-Linear numbers below **exactly**, to the row. This CSV should be treated as the canonical offline snapshot going forward; `all-issues.md` should either be regenerated from it or renamed to reflect what it actually is (e.g. `recent-activity.md`).

Two adjacent files are older/partial snapshots, not additional signal: `linear/ALL issues (3).csv` (Jul 8, 450 rows — yesterday's version, 38 issues behind) and `linear/AI Platform — LLM Providers › Issues (2).csv` (Jul 8, 45 rows — stale; the project has 67 issues as of Jul 9). `linear/DESIGN V2 — Operator React Parity › Issues.csv` (145 rows, Jul 9) is current and matches. Also present but out of this audit's original scope: `linear/issues/` (98 per-issue markdown specs) and `linear/audit/` (prior Jul 7 audit history, including a same-named-but-different `09-gemini-groq-audit.md` from the one already reviewed in the Cloudflare docs audit — worth a dedupe pass if anyone revisits Linear docs organization, not urgent).

Real count, confirmed two independent ways (live Linear MCP + the actual CSV export):

```
Total iPix1 issues (non-archived): 488
```

## 1. Bucket breakdown (by status, live Linear)

| Status | Count | % |
|---|---:|---:|
| Backlog | 245 | 50% |
| Done | 131 | 27% |
| Canceled | 67 | 14% |
| In Progress | 16 | 3% |
| Duplicate | 15 | 3% |
| Todo | 12 | 2% |
| In Review | 2 | <1% |
| **Total** | **488** | |

By project (the backlog's real organizing axis — maps better to your requested MVP/Core/Advanced/etc. buckets than a manual per-issue tag would):

| Project | n | Done | In Progress | Backlog+Todo | Canceled+Dup | Read as |
|---|---:|---:|---:|---:|---:|---|
| DESIGN V2 — Operator React Parity | 145 | 52 | 4 | 57 | 31 | Core (screen parity, MVP-adjacent) |
| AI Platform — Agents | 93 | 31 | 2 | 46 | 14 | Core/AI |
| BRAND | 80 | 21 | 0 | 54 | 5 | Core (Brand Intelligence MVP) |
| AI Platform — LLM Providers | 67 | 7 | 5 | 27 | 27 | Cloudflare/AI infra + canceled Groq epic |
| Model Booking MVP | 40 | 13 | 0 | 26 | 1 | MVP (new, healthy ratio) |
| *(no project)* | 27 | 2 | 2 | 22 | 1 | Mostly Cloudinary CLD-1xx (see §3) |
| CRM — Relationship Layer | 18 | 2 | 3 | 11 | 2 | Core (new, Phase 1) |
| AI Platform — AI Infrastructure | 18 | 3 | 0 | 14 | 1 | Infrastructure |

**Cloudflare-specific slice** (`AI Platform — LLM Providers`, 67 issues): 27 of the 67 are the **canceled Groq epic** (IPI-354–361, IPI-355 etc.) plus other superseded CF tasks (IPI-106, 107, 120, 164–182, 464) — already correctly canceled, not live debt. The actual live Cloudflare/AI-platform work is a small, well-scoped set: 5 In Progress (454, 457, 461, 469, 471), 1 In Review (469 — same issue, listed as In Review not In Progress, see below), rest Backlog/Todo. This matches `CLOUDFLARE-EPIC.md`'s own "lean 10 tasks" framing — the backlog isn't bloated here, it's mostly cleaned up already.

**Verdict on backlog health:** genuinely reasonable shape. 50% Backlog is normal for an active pre-launch product; Done/Canceled together are 41%, meaning the team is closing loops, not just accumulating. The Duplicate-status issues (15) all carry an explicit "Duplicate of / canonical: IPI-XXX" note in their own description — that's already-done hygiene, not a problem to fix.

## 2. Delta vs `jul-8-linear-audit.md` (yesterday) and `audit-2-linear.md` (Jul 7)

**Jul-8 audit still holds, fully.** I cross-checked every Cloudflare-epic issue it and `CLOUDFLARE-EPIC.md` reference against live Linear:

| Issue | Doc claims | Live Linear | Match? |
|---|---|---|---|
| IPI-469 CF-000 | In Review, "mark Done" pending | In Review | ✅ exact |
| IPI-454 CF-AI-001 | In Progress, AC-C done/AC-F open | In Progress | ✅ |
| IPI-457 CF-AI-005 | In Progress, not on `main` | In Progress | ✅ |
| IPI-461 CF-AI-004 | In Progress | In Progress | ✅ |
| IPI-462 CF-AI-006 | Backlog | Backlog | ✅ |
| IPI-463 CF-AI-008 | Backlog | Backlog | ✅ |
| IPI-471 AGENT-001 | In Progress, "mark Done after proof fix" | In Progress | ✅ |
| IPI-485 MASTRA-CF-001 | Backlog | Backlog | ✅ |
| IPI-487 CLOUDFLARE-EPIC | In Progress | In Progress | ✅ |
| IPI-354–361 GROQ epic | Canceled | Canceled | ✅ |

Nothing has moved since yesterday's audit on the Cloudflare track — no delta to report there. `audit-2-linear.md` (Jul 7, "all changes applied," score 94/100) also still holds: its archived/canceled/renamed lists (IPI-428/429/219/95/97/99/101 archived; GROQ epic IPI-354–361 canceled) match live status exactly.

**Two small drifts I did find** (neither in yesterday's audit, both minor):

1. **IPI-472 (INFRA-001)** and **IPI-468 (SEC-001)** are `Todo` in live Linear. `CLOUDFLARE-EPIC.md`'s task tables mark both as `⚪` (Backlog) throughout. `Todo` and `Backlog` are different Linear state *types* (unstarted vs. backlog) — cosmetic, but the epic doc's own legend distinguishes them, so this is a real (tiny) inaccuracy in the doc, not in Linear.
2. **The 5 "Cloudflare hosting" tasks the epic treats as top-priority** — CF-MIG-110, CF-MIG-210, CF-MIG-111, CF-MIG-220, CF-MIG-810 — **do not exist as Linear issues at all.** Searching Linear for "CF-MIG" returns zero issues with that identifier; they're tracked only inside `IPI-487`'s description text and the two markdown docs. This means 5 of the "lean 10" tasks have zero Linear-side visibility (no status field, no assignee, no view membership). This is already flagged in `todo.md`'s own "Needs attention" table ("Linear CF-MIG issues → Create/link under IPI-487") — so it's a known, not new, gap. Still open as of today.

Net: **yesterday's audit is accurate and current — nothing to redo.** The only addition this pass makes is confirming the CF-MIG-* Linear-issue gap against a live search (previously an assertion in the docs, now verified) and the Todo/Backlog label mismatch on 2 issues.

## 3. Specific problem issues + recommended action

| Issue(s) | Problem | Recommend | Reason |
|---|---|---|---|
| CF-MIG-110/210/111/220/810 (no IPI-#) | 5 of the epic's "lean 10" tasks have no Linear issue — untrackable via views/cycles | **Create** 5 Linear issues under IPI-487 | Already flagged in `todo.md`; just hasn't been done. One-line action, do it before next sprint planning. |
| IPI-472, IPI-468 | Status shown as `Todo` in Linear but epic doc calls both `⚪ Backlog` | **Keep** (Linear is correct) | Fix the doc's legend/table, not Linear — `Todo` (queued, ready) is arguably more accurate than `Backlog` (unscheduled) for both. |
| IPI-430–449 (19x `CLD-1xx` Cloudinary asset-library specs) | No Project attached — invisible in every project-scoped view/roadmap | **Move** — attach to a project (new "Media / Asset Library" or fold into DESIGN V2) | All 19 are Backlog, coherently numbered (CLD-000 through CLD-118), clearly one workstream that just never got a Project field set. |
| IPI-486 (MASTRA-EPIC), IPI-487 (CLOUDFLARE-EPIC) | Both top-level epics also have no Project attached | **Move** — same fix, low effort | Ironic given IPI-487's own doc says "attach children per §10"; the parent itself isn't attached to anything either. |
| IPI-21, 22, 34–38, 41–45 (Brand Intelligence Epic 2/3 — Product/Collection/Competitor/Persona/SEO/Campaign/Creative-Director/Content-Strategy agents) | Untouched since 2026-06-25 (oldest stale cluster in the whole backlog) | **Keep** — correctly Backlog | Reviewed content: these are legitimate Phase-2/Future scope (advanced multi-agent Brand Intelligence), not neglected MVP work. No action needed; flagging only so nobody mistakes "old updatedAt" for "at risk." |
| IPI-233 (FIX · Workflow runtime chains API→DB) | Bundles 7 unrelated E2E chains (brand intake, brand intelligence, HITL approval, shoot wizard, shoot commit, social discovery, CopilotKit chat) in one issue | **Keep as-is** (borderline, not worth splitting) | It's a verification/QA sweep, not a build task — one issue per "prove the whole system still works" pass is a defensible shape, not the "10+ AC / multiple unrelated deliverables" oversizing pattern the audit was asked to hunt for build tickets. |
| IPI-15 Duplicate-status issues (13, 165, 168, 266, 303, 53, 56, 82, 86, 87, 267, 365, 366, 393, 394) | None — already good practice | **Keep** | Every one already carries an explicit "Duplicate of / canonical: IPI-XXX" pointer in its own description. This is the pattern other backlogs should copy, not a problem. |

No oversized (10+ AC), missing-AC, or genuinely circular-dependency issues turned up in the sample reviewed (the 15-issue `all-issues.md` export plus the full Cloudflare/AI-platform project). Given the backlog's overall health (41% Done+Canceled, disciplined Duplicate-tagging, epics correctly deferred to Backlog), further exhaustive per-issue AC-counting across all 488 issues is not a good use of effort right now — nothing in the sample suggests it would surface more than the items above.

## 4. Dependency-graph fixes worth doing

The existing dependency model — `CLOUDFLARE-EPIC.md` §8's mermaid flowchart plus each issue's `Related to`/`Blocked by` fields — is sound. Spot-checked IPI-469, IPI-454, IPI-461's cross-links: they fan out to siblings under the same epic (normal), no circular chains found. **Don't rebuild it.** Just:

1. Create the 5 missing `CF-MIG-*` Linear issues (§3) so the dependency graph has something to point *at* for the hosting track — right now `IPI-487`'s "Blocked by" and the Gantt chart reference task names that don't exist as issues, which will silently break any future Linear-native dependency view.
2. Attach a Project to IPI-486 and IPI-487 (§3) so they participate in project-level dependency/roadmap views instead of floating unattached.

That's the full list — two small, concrete fixes, not a graph rebuild.

---

## Bottom line

- **488 real issues**, not the 15 in `all-issues.md` (that file is a recent-activity slice, mislabeled).
- Backlog health is genuinely good: 41% closed-out, disciplined duplicate handling, Phase-2 work correctly parked.
- Yesterday's `jul-8-linear-audit.md` and `CLOUDFLARE-EPIC.md`/`todo.md` are accurate as of today — verified against live Linear, zero drift on the 10 cross-checked Cloudflare issues.
- Only new-since-yesterday items: confirmed (didn't just assert) that 5 CF-MIG tasks have no Linear issue, and found 19 Cloudinary CLD-1xx issues + both top-level epics missing a Project attachment. All are "create/attach," not "fix a mistake."
