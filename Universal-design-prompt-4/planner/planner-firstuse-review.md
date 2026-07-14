# Planner — First-Time-User UX Review

> **Planning + build tracker.** Reviews SCR-32 Workspace · SCR-33 Dashboard · SCR-34 Settings · SCR-35 Hub across desktop / tablet / mobile, from the perspective of a busy planner or photographer opening the app for the first time. Companion to `planner.md` (§2A adaptive panel, §2B nav, §2B.1 sheet), `planner-mobile-plan.md`, and `user-journeys.md`. Low-fi wireframes = structure only; all fixes reuse Design V2 components — no new patterns, no new entities.

## Build progress tracker
Legend: 🟢 done · 🟡 in progress · ⚪ queued

| Phase | Items | Screen | Status |
|---|---|---|:--:|
| **1 — Shared foundation** | P4 Assistant-first · P9 terminology (Approval≠Gate) · P6 plain-language · P11 empty/at-risk/completion | all 4 | 🟢 terminology + plain-language swept across all 4 (Gate→Approval, phases→steps); P4/P11 landed on Dashboard/Hub/Workspace |ending |
| **2 — Dashboard** | P8 home · P2 Start Here · P10 action summaries · urgency-ordered KPIs | SCR-33 | 🟢 built + verified |
| **3 — Hub** | P1 attention band · risk-sorted · one status sentence/plan | SCR-35 | 🟢 built + verified |
| **4 — Workspace** | P3 pin Current Step + Next Approval · P7 desktop/mobile parity | SCR-32 | 🟢 built + verified (Now & Next pinned bar) |
| **5 — Settings** | P5 invite-first layout | SCR-34 | 🟢 built + verified (invite-first hero + role shortcuts + pending/resend) |
| **Docs** | first-use review · user-journeys · three-question principle · decision hierarchy · copy refinements | — | 🟢 done |

> Mobile gallery (`Pages/SCR-MOBILE-Planner-Gallery.dc.html`) already carries most Phase-1/3/4 patterns (attention framing, pinned Next-approval, decision sheet, positive states). Desktop is catching up phase by phase.

**North-star test:** a first-timer should, within ~10 seconds on each screen, be able to say *"what am I looking at, what needs me, and what do I click next."*

> **Design principle (apply to every Planner screen, every future change).** Each screen must answer three questions within five seconds:
> 1. **Where am I?**
> 2. **What needs my attention?**
> 3. **What should I do next?**
> If a proposed element doesn't serve one of these, it's clutter — cut or demote it.

---

## 0. Cross-cutting issues (all screens)
| # | Issue | Why it hurts a first-timer | Fix (reuse existing) |
|---|---|---|---|
| X1 | **"Instance" / "phase" / "gate" vocabulary** appears before it's explained | Jargon with no anchor = hesitation | First-run one-liner under each title ("A plan tracks one shoot from brief to delivery"); use **Plan / Step / Approval** as the plain-language synonyms in tooltips |
| X2 | **No single "what needs me now"** entry across screens | User must scan 4 screens to find their job | Dashboard is that home; every screen's Assistant opens with **"3 things need you"** |
| X3 | **Right panel starts empty / generic** until something is selected | Dead space reads as "broken" on first load | Panel default = **Assistant "what needs attention"** summary, not a blank state |
| X4 | **Active-nav ambiguity** (icon-only rail) | New user can't tell where they are | Keep `aria-current` + add a text label on ≥1024px; already partly done |

---

## 1. SCR-35 Hub — "where do I start?"
**Job:** pick a plan (or see there's nothing urgent).

### Current
```
[filters: All Shoot Campaign Deal]
┌ Summer Lookbook      [At risk] ┐   ← cards equal weight
│ Shoot · Mar 2–Apr 5   ▓░░ 27%  │
└────────────────────────────────┘
┌ Q3 Retail Push        [Active] ┐
│ …                              │
```
**Issues**
- **H1** All plans look equally urgent — the one *at risk* doesn't stand out. First-timer can't triage.
- **H2** Filters lead; the user hasn't seen a plan yet, so filters are premature.
- **H3** No "what needs you" summary — the Assistant is silent until asked.

### Proposed
```
✦ 2 plans need you · [Summer Lookbook ›][Orbit Denim ›]   ← attention band first
──────────────────────────────────────────
Needs attention
┌ ● Summer Lookbook    [At risk] › ┐   ← risk sorted to top, dot marker
│ Item delivery late · due Apr 5   │
On track
┌ Q3 Retail Push        [Active] › ┐
[filters ▾]  (secondary, below the fold)
```
**Improvements & why**
- **Attention band + risk-sorted list** (H1/H3): the one action that matters is first; on-track plans recede. Fewer scans → faster triage.
- **Demote filters** (H2): show value before controls.
- **Tap → the decision sheet** (already built in mobile) so the next action is one tap.

---

## 2. SCR-33 Dashboard — "what needs me today?"
**Job:** the daily home; answer "where do I spend the next hour."

### Current
```
Good morning, Maya
[My Tasks 12][Needs Appr 2][At Risk 3][Due Today 4]   ← 4 equal KPIs
Recent plans  → → →
Upcoming this week …
```
**Issues**
- **D1** Four equal KPIs = no priority. "Needs approval" (the blocking action) looks the same as "My tasks."
- **D2** KPIs are counts, not doors — unclear they're tappable or what they lead to.
- **D3** "Recent plans" competes with "what's due" for the eye; recency ≠ priority.

### Proposed
```
Good morning, Maya · Fri Mar 13
➤ Start here: 2 approvals are blocking work  [Review →]   ← single primary
[Needs Appr 2 ●][At Risk 3][Due Today 4][My Tasks 12]     ← ordered by urgency
Today  ▸ Item delivery (Summer Lookbook) …                ← today first
Recent plans (collapsed / below)
```
**Improvements & why**
- **One "Start here" line** (D1): the blocking work is named and actionable before the grid — obvious next action.
- **KPIs reordered by urgency + labelled as links** (D1/D2): approvals first; hover/press affordance.
- **Today before Recent** (D3): priority over recency.

---

## 3. SCR-32 Workspace — "what is this plan and what's next?"
**Job:** the deep surface; understand status, act on the next gate.

### Current
```
[Timeline][Kanban][Calendar][List]
WEEK 1 …  WEEK 2 …  (Gantt scrolls)
right panel: Intelligence / phase detail
```
**Issues**
- **W1** Opens on **Timeline (Gantt)** — the densest view — for a first-timer. Overwhelming; "where do I look?"
- **W2** Four view toggles shown before the user knows they need any. Choice paralysis.
- **W3** The **next approval** (the one thing needing them) isn't pinned — it's somewhere in the scroll.
- **W4** Right panel technical ("Intelligence") — unclear it's the guide.

### Proposed
```
Summer Lookbook · 27% · At risk
➤ Next: approve Outfit confirmation (Mar 17)  [Review →]   ← pinned gate
Now: Item delivery · +2d late                              ← current step
[Timeline ▾ Kanban Calendar List]   ← Timeline default but secondary
right panel: ✦ "What needs attention" (Assistant) by default
```
**Improvements & why**
- **Pin next approval + current step at top** (W1/W3): the two facts that matter are above the dense view; the Gantt becomes reference, not the headline.
- **Assistant-first panel** (W4/X3): the guide speaks first ("3 things need you"), so the panel is never dead.
- **Views stay, de-emphasized** (W2): available, not demanded.
- Mobile already does vertical week list + collapsible weeks + Today/Next-approval controls — carry the *pin* idea to desktop for parity.

---

## 4. SCR-34 Settings — "who's on this and can I invite someone?"
**Job:** manage access; mostly a return visit, but must be legible first time.

### Current
```
[Members][Notifications*][*]   (* disabled "soon")
row: avatar · name · email · [role]
```
**Issues**
- **S1** Disabled tabs shown first-class — first-timer clicks and nothing happens.
- **S2** Role chips (owner/manager/contributor/viewer) with no legend — what can each do?
- **S3** "Invite" affordance not prominent — the primary reason people open Settings.

### Proposed
```
Members · 4          [+ Invite]         ← primary action top-right
● You (Owner) — full access
  Jon Alvi (Manager) — can edit
  Priya R. (Contributor) — can edit tasks
  dana@… (Viewer · Invited) — view + approve
Notifications  (greyed, "Coming soon" muted, moved last)
```
**Improvements & why**
- **Inline access phrase per role** (S2): "can edit" beats a bare chip — no legend hunt.
- **Invite promoted** (S3): the top job is one obvious button.
- **Disabled tabs demoted + clearly muted** (S1): no dead clicks.

---

## 5. Responsive notes (first-timer lens)
- **Desktop (≥1280):** the pinned "Next / Start here" line + Assistant-first panel do the heavy lifting; don't rely on the 3rd panel being noticed.
- **Tablet (960–1279):** context panel becomes slide-over (960–1023) / persistent (1024+) per §14.5 — keep the pinned action line in the main column so it survives when the panel is a sheet.
- **Mobile:** attention band (Hub) + "Start here" (Dashboard) + pinned gate (Workspace) all collapse into the **top of the scroll**, above the fold, before any toggle. Bottom sheet already decision-oriented (§2B.1).

---

## 6. Prioritized improvement list (build after approval)
| # | Screen | Change | Effort | Impact |
|---|:--:|---|:--:|:--:|
| P1 | Hub | Attention band + risk-sorted list; demote filters | M | ★★★ |
| P2 | Dashboard | "Start here" line; KPIs urgency-ordered + link affordance; Today before Recent | M | ★★★ |
| P3 | Workspace | Pin next-approval + current-step above views; Assistant-first panel | M | ★★★ |
| P4 | All | Assistant opens with "N things need you" (X2/X3) | S | ★★★ |
| P5 | Settings | Promote Invite; inline access phrase; demote disabled tabs | S | ★★ |
| P6 | All | Plain-language synonyms (Plan/Step/Approval) in tooltips + first-run one-liner (X1) | S | ★★ |
| P7 | Desktop/Tablet | Carry mobile pinned-action pattern to desktop for parity | S | ★★ |

**Sequence:** P4 (shared Assistant summary — unblocks the "guide me" feel everywhere) → P1 → P2 → P3 → P5 → P6 → P7. All reuse Design V2 (cards, chips, banners, Assistant dock, bottom sheet); no new components, no backend, no new entities/status values.

---

## 7. What NOT to change (guardrails)
Per `planner-mobile-plan.md` §14.8: no fourth panel, no duplicate nav, no new status enums, no replacement of Design V2 components, no invented entities. This review only **reorders, pins, and relabels** — it does not add surfaces.

---

## 8. Decision hierarchy (information priority — apply whenever UI is added)
When two things compete for the same space, the higher one wins:
1. **What needs me now?** (blocking approvals, at-risk plans)
2. **What changed?** (recent activity, new assignments)
3. **What blocks progress?** (late steps, dependencies)
4. **What should I do next?** (recommended action)
5. **Everything else** (stats, history, settings)

Stats *support* decisions — they never lead. This ordering is the tie-breaker that keeps the Planner from drifting back into a stats-first project tool over time.

---

## 9. Copy & language refinements (98/100 review — adopted)
All copy/hierarchy only; no new UI. Fold into the P-builds.

| # | Rule | Before → After |
|---|---|---|
| C1 | **One consistent action heading** everywhere | mix of "Needs attention" / "At risk" section titles → **"Needs your attention"** (same words on Hub band, Dashboard, Assistant) |
| C2 | **Dashboard is Home — priority-first** | KPI grid leads → order: greeting → **Today's priority** (one action) → Today's work → At risk → Plans → stats last |
| C3 | **Hub cards get one status sentence** | "Summer Lookbook · At risk" → adds **"Waiting on item delivery"** / **"2 approvals pending"** |
| C4 | **Workspace header is action-first** | "Summer Lookbook · 27% · At risk" → **"Today: approve Outfit confirmation" → "Current step: Item delivery" → "27% complete"** (progress last) |
| C5 | **Assistant speaks first** | silent "Assistant" panel → opens with **"You have 3 things needing attention. 1 approval is blocking today's shoot — let's review it."** (this is P4's copy) |
| C6 | **Explain "At risk" on hover/tap** | bare chip → tooltip **"May miss its deadline — item delivery is 2 days late."** |
| C7 | **UI says "Approval," never "Gate"** | "Approval gate" in UI → **"Approval"** (code/docs may keep `gate`; frozen enum unchanged) |
| C8 | **Positive empty states** | "No approvals" → **"All clear — nothing needs approval today."** |
| C9 | **Celebrate completion** | silent done → **"✓ Summer Lookbook completed · delivered Apr 5"** + Archive · Duplicate · New plan |
| C10 | **Three-question principle banner** | — → added to doc top (done) as the standing design rule |

**Note on C7:** UI-label-only change. The status/enum vocabulary in `planner.md` §3.2 stays frozen (`gate` remains the data term); this only swaps the *visible* word.

### P-list additions
| # | Screen | Change | Effort | Impact |
|---|:--:|---|:--:|:--:|
| P8 | Dashboard | Reframe as Home: Today's-priority-first order (C2) | S | ★★★ |
| P9 | All | Consistent "Needs your attention" heading (C1) + "Approval" not "Gate" (C7) | S | ★★ |
| P10 | Hub | One status sentence per card (C3) | S | ★★ |
| P11 | All | "At risk" explainer tooltip (C6); positive empty states (C8); completion celebration (C9) | S | ★★ |

**Updated sequence:** P4 → **P8** (Dashboard-as-Home is the biggest single win) → P1 → P2 → P3 → **P9** → P5 → P6 → **P10** → **P11** → P7. Still all reorder/relabel — no new surfaces, no backend, no new entities/status values.
