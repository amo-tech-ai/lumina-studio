# Planner — Comprehensive Design Audit

> **Reviewer stance:** senior UX + product + design-systems review. Evidence-based, critical, no new features unless they clearly reduce load and fit Design V2.
> **Scope:** SCR-32 Workspace · SCR-33 Dashboard · SCR-34 Instance Settings · SCR-35 Hub (desktop, with tablet reflow specced) · SCR-MOBILE-Planner-Gallery (Hub/Dashboard/Workspace-Timeline/Kanban/Calendar/List/Settings/Bottom-sheets/Assistant).
> **Method:** live DOM probe + screenshots at design sizes (1360×840 desktop, 390px mobile frames) on 2026-07-10; cross-read against `planner.md`, `planner-mobile-plan.md`, `navigation.md`, `planner-final-qa.md`, `planner-qa-handoff.md`, `planner-firstuse-review.md`, `adaptive-panel-wireframes.md`, `sheet-wireframes.md`, `user-journeys.md`.
> **Status of this doc:** audit only — no code changed. Recommendations are queued, not applied.
> **UPDATE 2026-07-10:** C-1 (mobile terminology drift) is **RESOLVED**. Production-readiness pass **COMPLETE (100%)** — tablet breakpoint, full a11y pass, and new interaction states built + verified across all 4 DCs. System **FROZEN**; see `planner-freeze.md` for the final report, scorecard, and implementation order, and `planner-component-catalog.md` / `planner-copy-guide.md` / `planner-interaction-catalog.md` for the handoff references.

---

## 1. Executive summary

The Planner is a **mature, coherent, near-handoff design system.** Four desktop screens share one architecture (adaptive 3-panel: rail · main · Intelligence), one token set, one interaction grammar, and one honest AI voice. The recent first-use pass materially improved it: the Dashboard now leads with a single **"Start here"** priority, the Workspace pins a **Now & Next** bar, the Hub surfaces an **attention band**, and Settings is **invite-first**. These are the right moves and they landed well (see §5 per-screen).

The system is **strong on the desktop happy path and weak on three axes that block a confident "ship it":**

1. **Cross-surface consistency has regressed.** The desktop terminology sweep (Gate→Approval, phase→step) was scoped to the four desktop DCs and **the mobile gallery was left on the old vocabulary.** A first-time user moving phone→desktop now sees two different words for the same object ("2 gates need approval" on mobile vs "approvals waiting" on desktop). This is the single most visible new defect.
2. **Mobile is a gallery of static frames, not the product.** The reflow is *illustrated* at 390px but the four real DCs are fixed desktop width. Nothing between 768–1279px is built. One-handed use, gestures, and scroll behavior can be *shown* but not *tested*.
3. **Accessibility and state coverage are specced faster than they're built.** Empty/loading/error now exist as Tweaks on desktop (good), but keyboard timeline nav, dialog focus-trap, reduced-motion, and live-region announcements remain follow-ups — and none exist in the mobile frames.

None of these are architectural. They are finishing work. **Recommendation: conditional GO for React** — start the framework and reusable primitives now, but gate the Planner-specific build on the four fixes in §9 (terminology reconciliation, one responsive breakpoint proof, the a11y quartet, and PLN-009).

---

## 2. Scorecard

| Dimension | Score | Grade | One-line rationale |
|---|:--:|:--:|---|
| **Overall UX** | **84 / 100** | 🟡 Good | Happy path is now genuinely guided; load is low on desktop. Loses points on cross-surface consistency + mobile depth. |
| **Overall Design** | **90 / 100** | 🟢 Excellent | Disciplined tokens, restrained amber-for-risk, strong type rhythm, no slop. |
| **Mobile** | **72 / 100** | 🟡 Good | Patterns are correct and attractive but unbuilt as components; terminology drifted; no real gesture/scroll test surface. |
| **Desktop** | **91 / 100** | 🟢 Excellent | Flagship. Adaptive panel + full state matrix + priority-first IA. |
| **Accessibility** | **74 / 100** | 🟡 Good | Semantics + contrast + text-not-color-alone are solid; keyboard depth, focus-trap, reduced-motion, live regions pending. |
| **Design System** | **88 / 100** | 🟢 Excellent | Byte-consistent `:root`, shared chrome, one icon component. −12 for two status enums rendering identically + mobile not sharing the tokens as live components. |
| **React handoff readiness** | **82 / 100** | 🟡 Good | Component inventory, routes, interaction + state specs all exist. Blocked by PLN-009, unbuilt responsive, and the persona→stat map. |
| **Production readiness** | **83 / 100** | 🟡 Good | Design layer is ready; the gaps are finishing + one tracking issue, not redesign. |

**Grade legend:** 🟢 Excellent (≥88) · 🟡 Good (72–87) · 🔴 Needs work (<72) · ⚪ Future

---

## 3. Errors, red flags, failure points, blockers

### 🔴 Critical (block a clean handoff)
- **C-1 · Terminology drift, phone vs desktop.** Mobile gallery still renders "gates" and "phases"; desktop now says "approvals" and "steps." *Evidence:* mobile Hub header "12 plans · 3 need attention" is fine, but mobile Dashboard KPI reads **"Needs Appr. · gates"** and header **"2 gates need approval"**; desktop Dashboard reads "Needs your approval · approvals." *Impact:* breaks the "same product everywhere" contract for exactly the cross-device persona the review targets. *Fix:* run the same Gate→Approval / phase→step sweep across `SCR-MOBILE-Planner-Gallery.dc.html` (visible copy only; keep `--gate` token + data keys). *Effort:* S (~20 min). *Priority:* P0.
- **C-2 · No built responsive breakpoint.** The four DCs are fixed ~1360px; 768–1279px is specced (`planner.md` §14.5, `adaptive-panel-wireframes.md`) but never demonstrated. *Impact:* frontend has no reference render for tablet slide-over / panel-as-sheet; QA can't verify state consistency across breakpoints. *Fix:* build **one** proof — Workspace at 1024px (persistent ~300px panel) and 768px (panel→bottom sheet). *Effort:* M. *Priority:* P0 for handoff.
- **C-3 · SCR-35 Hub has no backing Linear issue.** Every other screen maps to IPI-478/479; Hub is untracked. *Impact:* building React against an untracked surface. *Fix:* open **PLN-009** (or fold into IPI-479). *Effort:* 5 min. *Priority:* P0.

### 🟡 Red flags (fix before or alongside React)
- **R-1 · Mobile is frames, not components.** The gallery proves layout but shares no live code with desktop; drift (C-1) is the symptom, not the disease. Plan the mobile build as the *same* DCs reflowing, not a parallel artifact.
- **R-2 · Two status enums render as one pill.** Task status (todo/in_progress/blocked/done/cancelled) and instance status (draft/planned/active/blocked/completed/archived/cancelled) look identical. Documented, but a first-timer can't tell a plan's "blocked" from a task's "blocked." Consider a subtle shape/label distinction.
- **R-3 · "Sample data — not live" pill on every screen.** Correct honesty for a prototype, but it occupies prime header space next to the H1 on all four screens and will confuse stakeholders in demos. Make it a single dismissible ribbon, not a per-screen chip.
- **R-4 · Assistant dock says "not yet wired" everywhere.** Right for now, but it means the single most-promised feature (guidance) is inert across the whole system. Ensure the persona→opening-line map (P4) is specced so it's not empty on day one of React.
- **R-5 · Dead global rails on some DC-authored screens** (SCR-09/15/18/20 per `nav-qa-report.md`). Rail icons that don't navigate read as broken to a first-time user.

### Failure points (where a real user gets stuck)
- **F-1 · Calendar view semantics undefined.** Fixture shows event chips; spec is silent on multi-day status bars. A producer scanning a month can't tell duration from the chips. Decide before build.
- **F-2 · Empty Dashboard for a brand-new user.** State exists as a Tweak, but the *copy* ("not assigned to any plans") is a dead end unless the owner-invite CTA is always present. Verify the empty state routes somewhere.
- **F-3 · Kanban gated column** — the "requires approval to enter" rule is visualized but the *blocked drag* interaction (what the user sees when they try) isn't demonstrated. Easy to ship a silently-failing drag.

---

## 4. Missing (states · interactions · docs · a11y · responsive)

**Missing states**
- Mobile: no loading / empty / error / offline states in the gallery frames (desktop has them as Tweaks; mobile has a STATE switcher UI but the offline/error frames are thin).
- Completion celebration (P11 / C9) — specced, only partially present; no "plan finished" success surface on desktop or mobile.
- Invite-error inline state (SCR-34) — specced, not built (only invite-pending is built).

**Missing interactions**
- Keyboard: arrow-key navigation across timeline phases/steps (SCR-32).
- Focus-trap + focus-return inside the Invite dialog (SCR-34).
- Blocked-drag feedback on gated Kanban columns.
- `aria-live` result-count announcements on Hub filter/search and invite validation.

**Missing documentation**
- Persona→stat map for the role-conditional Dashboard (Producer vs Client-approver stat sets) — open question in handoff §4.7.
- Notifications tab destiny (tab here vs route to SCR-15) — non-committal in spec.
- Nav active-state convention for SCR-34 (Planner vs Settings rail item) — two conventions in play.

**Missing accessibility**
- `prefers-reduced-motion` to pause the shimmer skeleton + panel slide animations.
- Confirmed focus order through the 3-panel layout (rail → main → Intelligence).
- Screen-reader labels for the timeline gate diamonds / risk markers (currently `title` only in places).

**Missing responsive behavior**
- Everything 768–1279px (tablet) — unbuilt (C-2).
- State consistency proof across breakpoints (does "at risk" look the same on the tablet sheet as the desktop panel?).

---

## 5. Per-screen findings

### SCR-32 · Workspace 🟢 (flagship — ~91)
- 🟢 **Now & Next pinned bar** ("Happening now: Item delivery" + "Your next approval: Outfit confirmation") makes the next action unmissable. Intelligence panel mirrors it (risk → evidence → approval).
- 🟢 Four views (Timeline/Kanban/Calendar/List) with a clear segmented toggle; terminology now "steps."
- 🟡 Timeline horizontal scroll on a fixed-width canvas is tight; the "TODAY" marker helps but week columns crowd below ~1200px.
- 🟡 Assistant dock line is contextual per view (good) but static; no follow-up affordances.
- 🔴 No arrow-key step navigation; Kanban blocked-drag feedback missing.
- ⚪ Consider a "jump to next approval" shortcut key.

### SCR-33 · Dashboard 🟢 (~90)
- 🟢 **"Start here"** banner is the strongest single improvement in the system — one action, one reason, one button ("2 approvals are blocking today's work → Review").
- 🟢 KPI cards are real links with descriptive `aria-label`s; order is urgency-first (Needs approval → At risk → Due today → My tasks).
- 🟢 Activity feed terminology corrected ("Maya approved Casting," "reached the Retouching step").
- 🟡 "At a glance" KPI row still competes with the Start-here banner for the eye; consider demoting stats further down for first-timers.
- ⚪ Role-conditional stat sets need the real persona map before build.

### SCR-34 · Instance Settings 🟢 (~88)
- 🟢 **Invite-first hero** ("Bring your team into this plan") with plain-language role explanation and three one-tap role shortcuts (+ Producer / + Contributor / + Client approver) — turns an admin table into an onboarding act.
- 🟢 **Pending-invite callout** with Resend; Access Summary panel is scannable.
- 🟡 Disabled tabs (Notifications/Workflow/Danger zone, "Soon") are honest but three of four tabs inert reads as a thin surface.
- 🔴 Invite dialog focus-trap + focus-return pending; invite-error inline state not built.
- 🟡 Nav highlights global Settings, not Planner — pick one convention (also a system-wide nav note).

### SCR-35 · Hub 🟢 (~88)
- 🟢 **Attention band** up top + risk-sorted cards + one status sentence per card ("Waiting on item delivery," "2 approvals pending").
- 🟢 Type filter (Shoot/Campaign/CRM Deal) with stable entity icons.
- 🟡 Panel detail label now "Steps" (swept); good.
- 🔴 **No Linear issue (C-3).**
- ⚪ Search + saved filters for when plan count grows past a screenful.

### SCR-MOBILE-Planner-Gallery 🟡 (~72)
- 🟢 Correct mobile architecture: top app bar · bottom tab bar · docked AI composer · adaptive bottom sheet; attractive, on-brand.
- 🟢 STATE switcher (Default/Loading/Empty/Error/Offline) shows intent to cover the matrix.
- 🔴 **Terminology drift (C-1):** "2 gates need approval," "Needs Appr. · gates," "At risk · slipping" — desktop has moved on.
- 🔴 **Frames, not components (R-1):** no shared code, no true gesture/scroll/reachability test.
- 🟡 KPI abbreviation "Needs Appr." sacrifices clarity for width; spell it out or restructure the card.
- 🟡 Offline/error frames are thin vs the desktop equivalents.

---

## 6. Recommendations by horizon

### Quick wins (< 30 min each)
1. **Mobile terminology sweep** (C-1) — Gate→Approval, phase→step in the gallery; spell out "Needs Appr." → "Needs your approval." *P0.*
2. **Open PLN-009** for the Hub (C-3). *P0.*
3. **Consolidate the "Sample data — not live" chips** (R-3) into one dismissible ribbon. *P2.*
4. **Add `prefers-reduced-motion`** to pause shimmer + panel slide (a11y quick win). *P2.*
5. **Fix / disable dead global rails** on SCR-09/15/18/20 (R-5) — at minimum a "coming soon" affordance. *P2.*

### High-impact improvements
6. **One built responsive proof** — Workspace at 1024px + 768px (C-2). Unblocks tablet handoff.
7. **A11y quartet** — arrow-key step nav (SCR-32), invite dialog focus-trap + return (SCR-34), timeline marker SR labels, Hub/invite `aria-live` counts.
8. **Complete P4 + P11** — persona→opening-line map for the Assistant; build the invite-error inline state and a plan-completion success surface.
9. **Blocked-drag feedback** on gated Kanban columns (F-3).

### Medium-term
10. **Make mobile the same DCs reflowing**, not a parallel gallery — retire the drift risk at the root (R-1).
11. **Distinguish the two status enums** visually (R-2).
12. **Decide Calendar semantics** (F-1) and Notifications-tab destiny.
13. **Persona→stat map** for the role-conditional Dashboard.

### Future (⚪)
14. Hub search + saved filters at scale.
15. Keyboard command palette ("jump to next approval").
16. Live Assistant wiring (backend — IPI-482).
17. Completion celebration polish + plan archive flow.

---

## 7. Workflow coverage check

| Workflow | State today | Gap |
|---|---|---|
| **Create Plan** | CTA present (Hub + Workspace empty), template picker deferred (IPI-477, SQL-seeded) | Picker not designed; acceptable for v1 |
| **Open Plan** | Hub/Dashboard card → Workspace, consistent card anatomy | ✅ |
| **Review Approval** | Now/Next bar → gate drawer → Approve·Edit·Discard → next step unlocks | ✅ strongest flow |
| **Complete Task** | StatusChip + Kanban drag (sets phase_id + status) | Blocked-drag feedback missing (F-3) |
| **Invite Member** | Invite-first hero + dialog + pending/resend | Focus-trap + invite-error pending |
| **Finish Plan** | Completed status exists (Vega Studios AW) | No completion celebration / archive flow (P11/C9) |

---

## 8. React implementation readiness

**Ready:** route table, component inventory (reuse-first: OperatorShell, PersistentChatDock, IntelligencePanel, StatusChip, EmptyState, SkeletonLoader, shadcn Tabs/Dialog, ShootCard, KPI stat-card), interaction specs, state specs, coherent single fixture ("Summer Lookbook") running across all screens, enums schema-true (no invented features).

**One genuinely new build:** the Gantt **TimelineGrid** (phase rows × week columns, gate diamonds, today line). Everything else is reskin/compose.

**Blocking handoff:** PLN-009 (C-3), one responsive proof (C-2), persona→stat map, and terminology reconciliation so the React copy source is single-truth (C-1).

---

## 9. Roadmap & recommended order

**Sprint 0 — unblock (½ day)**
1. Mobile terminology sweep (C-1) · 2. Open PLN-009 (C-3) · 3. Consolidate sample-data ribbon (R-3) · 4. Reduced-motion (a11y).

**Sprint 1 — finish the design layer (2–3 days)**
5. Responsive proof at 1024 + 768 (C-2) · 6. A11y quartet · 7. Invite-error + completion-success states · 8. Blocked-drag feedback · 9. Persona→opening-line map for the Assistant.

**Sprint 2 — reconcile + document (1–2 days)**
10. Re-plan mobile as reflowing DCs (R-1) · 11. Distinguish status enums (R-2) · 12. Calendar semantics + Notifications destiny + nav active-state convention · 13. Fix dead global rails.

**Then:** freeze prototypes → React handoff package (routes, components, fixtures, state matrix).

---

## 10. Final go / no-go

🟡 **CONDITIONAL GO for React.**

Begin the framework, routing, and reuse-first primitives **now** — the architecture is sound, the tokens are disciplined, and the happy path is genuinely well-guided after the first-use pass. **Gate the Planner-specific feature build** on the four Sprint-0/1 items that are cheap and prevent expensive rework: reconcile terminology to a single copy source (C-1), prove one responsive breakpoint (C-2), open PLN-009 (C-3), and land the a11y quartet. None require redesign; all are finishing work. Ship Sprint 0 this week and the conditional becomes an unconditional GO.

**Bottom line:** a genuinely good, restrained, low-slop system that is ~85% of the way to production. The remaining 15% is consistency and coverage, not concept.
