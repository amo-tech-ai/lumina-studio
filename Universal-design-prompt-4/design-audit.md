# Design Audit — Planner (Universal-design-prompt-4)

**Date:** 2026-07-12
**Scope:** Full `Universal-design-prompt-4/` project, emphasis on the Planner feature (design docs, `.dc.html` prototypes, shared component library, Linear tasks IPI-476–484).
**Method:** Read-only. Five independent research passes (Planner doc trees, Planner screens, shared component library, doc-structure/prior-audit integrity, user journeys/QA/React-readiness) + direct Linear API cross-check. No files modified in producing this report.
**Legend:** 🟢 Excellent/resolved · 🟡 Good, needs attention · 🔴 Critical issue · ⚪ Future / not applicable

---

## Executive Summary

The Planner design package is **visually mature and unusually well-documented for a design-stage artifact**, but it has a specific, recurring failure pattern: **documents claim things about their own state that the underlying files don't support.** Two "frozen"/"final" QA docs dated the same day (2026-07-10) directly contradict each other on whether core states are built. The component catalog says Planner screens reuse the shared library; a direct grep of all 5 Planner `.dc.html` files finds **zero** `dc-import` calls. The mobile plan says responsive behavior is built; the desktop screens' own CSS shows the nav rail never collapses to a bottom tab bar. This is not a visual-quality problem — the interaction design, state coverage, and component depth are genuinely strong — it is a **self-reporting accuracy problem**, and it is the single thing standing between this package and a confident "safe to build" verdict.

Underneath that, the Linear tracker (`IPI-484`) confirms the stakes: **only 2 of 8 Planner backend tasks are Done** (schema/engine `IPI-476` at 94/100, and the timeline template `IPI-477`). The UI shell this entire design package specs (`IPI-478`) is still **Backlog**, flagged "Next — highest-priority next feature." Everything downstream — role views (`IPI-479`), real-time sync (`IPI-480`), notifications (`IPI-481`), AI/CopilotKit (`IPI-482`), workflow v2 (`IPI-483`) — is also Backlog. This design package **is** the spec for that unstarted work, which raises the bar for its own internal consistency.

**Bottom line:** the design is not "done" in the sense its own freeze doc claims, but it is close, and every gap found is a documentation/reconciliation fix (S–M effort) or a targeted component-integration pass (M–L effort) — none require re-designing a screen from scratch.

---

## Linear task validation (IPI-476–484, "PLN-009")

| Task | Linear status | What's actually shipped | Design-package coverage |
|---|---|---|---|
| **IPI-476** · Planner schema & reusable engine core (PLN-001) | 🟢 Done (94/100 forensic verify) | 10-table schema, RLS 4-tier roles, pure TS engine, cycle detection — 11 merged PRs | ⚪ Backend only, not a design artifact |
| **IPI-477** · Shoot production timeline template (PLN-002) | 🟢 Done | `ensure_default_5_week_workflow`, 769/769 orgs seeded | ⚪ Backend only |
| **IPI-478** · Hybrid timeline/kanban/calendar UI shell (PLN-003) | 🔴 **Backlog — "Next," highest priority** | Nothing built in React yet | This is what SCR-32 (Planner Workspace) specs. Design is the entire input to this ticket. |
| **IPI-479** · Role-based views + assignments (PLN-004) | 🔴 Backlog | Schema/RLS roles exist; UI pending | SCR-33/34/35 role-gating (owner/manager/contributor/viewer) is the spec for this |
| **IPI-480** · Real-time sync (Supabase + Cloudflare DO) (PLN-005) | 🔴 Backlog | Broadcast channel + RLS shipped w/ 476; DO/presence not built | Not represented in any Planner screen (no presence indicators in the DC prototypes) |
| **IPI-481** · Notification rules + Queue fan-out (PLN-006) | 🔴 Backlog | `notification_rules` table exists; delivery not built | Not represented in any Planner screen |
| **IPI-482** · Mastra planner AI tools + CopilotKit HITL (PLN-007) | 🔴 Backlog | Engine helpers exist; agent tools not wired | The chat dock on SCR-32/33/35 is explicitly labeled "not yet wired" in-screen — consistent with this ticket's real status |
| **IPI-483** · Workflow engine v2: deps & approvals (PLN-008) | 🔴 Backlog | Deps/gates in schema v1; auto-shift/approval UX not built | — |
| **"PLN-009"** | 🔴 **Does not exist.** The PLN-numbering only runs 001–008, mapped 1:1 to IPI-476–483. | — | The user brief's reference to PLN-009 doesn't resolve to any Linear issue. Independently, 3 of the 5 research agents each separately found the same real gap: **SCR-35 (Planner Hub) has no backing Linear issue at all**, flagged as a blocker in `planner-final-qa.md`, `planner-qa-handoff.md`, and `planner-mobile-plan.md`. Whoever wrote "PLN-009" into the brief was very likely referring to this exact missing ticket. **Action: open a Linear issue for SCR-35/Hub** — it's flagged often enough across the corpus that its absence is itself a documentation-hygiene signal. |

**Epic score:** 2/8 (25%) — confirms the design package is pre-implementation, not post-implementation drift.

---

## Overall Scores (/100)

| Category | Score | Grade |
|---|--:|:--:|
| **Overall** | **72** | 🟡 |
| UX (journeys, interaction depth, states) | 78 | 🟡 |
| UI (visual consistency, polish) | 76 | 🟡 |
| Mobile | 62 | 🔴 |
| Desktop | 80 | 🟢 |
| Tablet | 66 | 🟡 |
| Accessibility | 58 | 🔴 |
| Design System compliance (tokens/nav/component reuse) | 52 | 🔴 |
| Component Library (the shared `components/` set itself) | 78 | 🟡 |
| Documentation (accuracy, not volume) | 68 | 🟡 |
| React Readiness | 68 | 🟡 |
| Production Readiness | 58 | 🔴 |

**Why Design System compliance is the lowest score:** every Planner screen defines its own parallel `:root` token set (`--bg/--text/--action/--gate…`) instead of the canonical `--color-*` tokens, and none of the 5 Planner `.dc.html` files contain a single `dc-import` of the shared component library — confirmed by direct grep, with a working control-check against already-migrated screens (Command Center, Brand List, Assets, Shoots List all correctly `dc-import` their cards/components). This is the single highest-leverage fix in the whole audit.

**Why Accessibility is 🔴:** primary interactive units — Timeline phase bars, Kanban cards, list rows on SCR-32; plan cards on SCR-35; member rows on SCR-34 — are `<div onClick>` with no `tabindex`, unreachable by keyboard or screen reader. This is a **regression against the project's own written standard** (`docs/design/ACCESSIBILITY.md`: "card/row 'open' actions are real buttons/links"), and against a sibling screen in the same feature: SCR-33's structurally identical stat/plan cards correctly use `<a href>`.

---

## Critical issues (🔴) — errors, red flags, blockers

1. **Two "frozen" QA docs contradict each other on the same day.** `planner-final-qa.md` (2026-07-10): *"Production readiness 100%... 0 unresolved template holes on every screen, every state."* `planner-qa-handoff.md` (same date): *"empty/loading/error states are specced... but not built into these four DCs... the #1 pre-handoff design task."* Confirmed independently by two separate research passes. **Impact:** anyone reading only one of these two "final" documents gets an opposite readiness signal. **Fix:** reconcile immediately — pick one canonical QA doc, deprecate the other, or state explicitly that one describes prop-toggle *capability* and the other describes what's *wired in the static markup*. **Priority: Critical. Effort: S (docs-only).**

2. **Zero component reuse in the actual Planner prototypes, despite the catalog claiming otherwise.** `planner-component-catalog.md` tags OperatorShell/NavSidebar/IntelligencePanel/PersistentChatDock/SkeletonLoader/EmptyState as "REUSE." Grep of all 5 Planner screens: 0 `dc-import` matches. Each screen hand-rolls its own nav, panel, dock, and skeleton shimmer (with different colors than `SkeletonLoader.dc.html`). **Impact:** the "1 substantial new build + 4 tiny utilities, everything else reuse" effort estimate in the catalog is not supported by the artifacts it's estimating from. **Fix:** either rebuild the 4 desktop screens against the real shared components before calling this frozen, or relabel the catalog's REUSE tags as "React-target, not yet demonstrated in DC." **Priority: Critical. Effort: L.**

3. **Reproducible mobile layout bug: FAB overlaps the chat dock.** SCR-32 correctly offsets its "toggle insights panel" FAB to `bottom:88px` because it has an in-flow chat dock. SCR-33 and SCR-35 have the identical dock-at-bottom layout but leave the FAB at `bottom:18px` — it will sit on top of the composer on tablet/mobile widths. **Fix:** copy SCR-32's offset to SCR-33/35. **Priority: Critical (visible, shipped-looking bug). Effort: S (one CSS value, 2 files).**

4. **Primary interactive elements are not keyboard-operable on 3 of 5 Planner screens.** Timeline bars/Kanban cards/list rows (SCR-32), plan cards (SCR-35), member rows (SCR-34) are `<div onClick>` with no `tabindex`/keyboard handler for the base element (SCR-32 does add a separate arrow-key handler, but it requires the user to discover it exists — no visible affordance). SCR-33's identical-purpose cards correctly use `<a href>`. **Fix:** convert to `<button>`/`role="button" tabindex="0"` with `onKeyDown` Enter/Space across all three screens, matching SCR-33's pattern. **Priority: Critical. Effort: M.**

5. **No responsive strategy actually wired for the 4 desktop Planner screens.** `SCR-MOBILE-Planner-Gallery.dc.html` is a **separate static mockup** of 4 phone frames on a design canvas — it is not `@media`-linked to SCR-32–35, which never swap their icon nav rail for a bottom tab bar at any breakpoint (unlike Command Center/Brand List/Shoots List, which explicitly hide `NavSidebar` and show a real `.m-tabbar` below 1024px). **Impact:** today, opening any Planner desktop screen on an actual phone would not produce the mobile-gallery layout — it would show a squeezed desktop layout. **Fix:** either wire the real `@media` swap into all 4 files, or explicitly scope Planner v1 as desktop/tablet-only and say so in `planner-freeze.md`. **Priority: Critical. Effort: L** (wiring) or **S** (scoping decision + doc update).

6. **`ApprovalCard.dc.html` — the component this entire feature's HITL principle depends on — has no wired actions.** Zero `onClick=` occurrences on Approve/Edit/Discard in either variant; no `onApprove`/`onEdit`/`onDiscard` in its props schema, unlike its sibling `EvidenceBlock.dc.html` which correctly wires all three. **Impact:** CLAUDE.md's "AI drafts, humans decide — every AI write is a reversible draft behind a gate" principle currently can't be enforced through this component; it's presentational only. **Priority: High (blocks a stated platform principle). Effort: S.**

7. **`StatusChip` is documented as "used on every card" but is imported by none of them, and the status-color maps disagree.** `ShootCard`/`CampaignCard`/`BrandCard` each hand-roll their own status→color map instead of importing `StatusChip`. The colors for the *same* status key differ: `StatusChip`'s map says `in-production:#2563eb`, `ShootCard`'s inline map says `in-production:#d97706` — same status, different color depending which card renders it. **Priority: Medium-High (real, visible inconsistency). Effort: M** (3-file consolidation).

8. **Broken-link bug propagated into the per-screen template itself.** `tasks/screens/SCR-TEMPLATE.md` line 4 links text `../../plan/designtoreact.md` to href `../docs/designtoreact.md`, which resolves to a nonexistent `tasks/docs/designtoreact.md` (real file is `tasks/designtoreact.md`). The same broken href appears in `MATRIX.md` and `README.md`. Because every new `SCR-*.md` is generated from this template, **the bug is inherited by every future screen task file** until the template is fixed. **Priority: High (propagating). Effort: S** — fix the template first, then the two other files.

9. **SCR-34 (Planner Instance Settings) has no AI assistant surface at all** — zero matches for chat dock / composer / PersistentChatDock — while the other 4 Planner screens all have one. This directly contradicts CLAUDE.md's golden rule ("proactive teammate... one click for common tasks") on the exact screen (member/access management) where "who should I invite next" guidance is most useful. **Priority: Medium. Effort: M.**

---

## Missing features, states, journeys, documentation

### Missing user journeys (of the 7 personas requested)
Only 4 personas have any documented journey (First-time user, Returning user, Manager/Owner, Photographer/crew). **3 are entirely missing:**
- **Producer** — no distinct journey; folded silently into "Owner/Producer" as one bullet in `planner-react-onboarding.md`.
- **Project Manager** — does not exist as a concept anywhere in the corpus (roles are owner/manager/contributor/viewer, not job titles).
- **Client Approver** — defined only as a role label ("Viewer+approve") in two docs, never walked step-by-step.
- **Team Administrator** — doesn't exist as a persona; invite/access management is folded into the Owner/Manager journey without saying so explicitly.

### Missing core workflows (true for every persona, no exceptions)
- **Create Plan** — never documented step-by-step anywhere. The "New plan" CTA exists as a UI element, but even there the picker itself is noted as "deferred (SQL-seeded v1)" — no journey shows what happens after the click.
- **Complete Plan** — exists only as a visual state (celebration screen), never as a persona-driven journey (who triggers it, what the last approval looks like, what happens next).
- **Move Through Workflow (status transitions)** — described only architecturally ("Approve → next phase unlocks"), never first-person for any persona/status pair.
- **Invite Team Member** — one single line in the Manager journey, no detail on confirmation, pending state, or the already-designed `invite-error` state.

### Missing/inconsistent accessibility
- No `aria-live` region for KPI/approval-count updates on SCR-33.
- Search bar has no `aria-label`/visible `<label>` (relies on placeholder alone).
- Filter chips have no `aria-pressed`; active state is color-only.
- WizardStep progress has no `role="progressbar"`/`aria-valuenow` despite the catalog claiming "numeric position announced."
- `BottomSheet.dc.html` has no `role="dialog"`/`aria-modal`/focus-trap, though its own doc entry is honest that the trap is planned future work (React ticket MOBILE-004) — the top-level "Accessibility" claim for the component still overstates current behavior.
- (Positive counter-example: SCR-34's Invite dialog has a full, correct focus trap + Escape-to-close + focus-return — the best a11y implementation in the whole set, worth using as the reference pattern elsewhere.)

### Missing stress-test coverage
| Scenario | Status |
|---|:--:|
| 500+ tasks | 🟡 Stated as a design *assumption/contract* ("virtualized/long lists"), not demonstrated in any wireframe |
| 100+ plans | ⚪ Unaddressed — Hub mockups all show 2 plans, no pagination/search-at-scale design |
| Large timelines | 🟡 Mobile has collapsible-weeks mitigation; desktop Timeline has no equivalent |
| Many concurrent approvals | ⚪ Unaddressed beyond "2 approvals" examples |
| Many users/collaborators | ⚪ No pagination/search for large member lists |
| Slow network | ⚪ Conflated with offline; no distinct degraded-latency/retry design |
| Offline recovery | 🟡 Read-only offline mode is spec'd (mobile); **no conflict-resolution/reconciliation flow** documented for queued-vs-server-state on reconnect — corroborated by the backend audit itself flagging optimistic-locking as an open question |
| Keyboard-only nav | 🟡 Thoroughly specified in `planner-react-onboarding.md` §8, but the flagship interaction (arrow-key Timeline nav) is explicitly still missing at "frozen" status per the QA docs themselves |

### Missing implementation guidance (React readiness gaps)
- **No state-management approach named anywhere** — component boundaries are excellent (full REUSE/NEW inventory), but nothing says how cross-component state (selected entity, view-toggle mode, filter state) should be held. Risk: 4 incompatible implementations across Hub/Dashboard/Workspace/Settings.
- **No PR-boundary guidance** — a build-order table exists (~11–12 dev-days) but doesn't map to PR cuts, risking a violation of this repo's own one-concern-per-PR rule.
- **5 open engineering questions live only in `planner-qa-handoff.md` §4.7** (Calendar-view semantics, Producer/Client-approver stat-map, Notifications-tab placement, Settings nav active-state, PLN-009/Hub ticket) and are **not carried into `planner-react-onboarding.md`**, despite that doc calling itself "the single onboarding guide — read this first."

---

## Per-screen findings

### SCR-32 — Planner Workspace
🟢 Best-in-set state coverage (loading/empty/error/read-only/sync-failed/completion — exceeds the documented baseline). 🔴 Own parallel token system; zero component reuse; primary interactive units (phase bars, Kanban cards, list rows) are non-keyboard-operable `<div>`s. 🟡 Chat-dock send button has no `aria-label`. Production readiness: **needs work before React port** — rebuild against shared components is the single biggest lift here.

### SCR-33 — Planner Dashboard
🟢 The one screen that gets card interactivity right (real `<a href>` for stat/plan cards) — use as the reference. 🔴 FAB/chat-dock overlap bug (see Critical #3). 🟡 IntelligencePanel width (320px) doesn't match its own siblings (340px) or the documented spec (332px). Production readiness: **close — fix the FAB bug and token system, otherwise solid.**

### SCR-34 — Planner Instance Settings
🟢 Best accessibility implementation in the set — a real, correct modal focus trap on the Invite dialog, and proper inline validation (`role="alert"`, `aria-describedby`, `aria-invalid`). 🔴 No AI assistant surface at all (Critical #9). 🟡 Member rows not keyboard-operable. Production readiness: **good bones, missing the AI-dock parity and keyboard support.**

### SCR-35 — Planner Hub
🟢 Risk-sorted card ordering surfaces at-risk plans first — good "guide, don't wait" alignment with the platform's UX principles. 🔴 Plan cards are non-keyboard-operable `<div>`s (unlike SCR-33's identical-purpose cards); same FAB/dock overlap bug. 🟡 "New plan" is clickable for viewers with only a post-click toast rejection, instead of being hidden/disabled up front like SCR-34 correctly does for "Invite member." Production readiness: **needs the same fixes as SCR-32/33, plus the permission-gating pattern from SCR-34.**

### SCR-MOBILE-Planner-Gallery
🔴 This is a **design-reference mockup, not implemented responsive behavior** — the 4 real Planner screens never actually collapse into this layout (Critical #5). 🟢 Good per-frame state-chip coverage (loading/empty/error/offline/default) as a review tool. 🟡 Its 5-tab bottom bar (Home/Planner/Dashboard/Inbox/Settings) is a bespoke variant of `BottomNavigation.dc.html`'s fixed 5-slot contract — worth resolving as a sanctioned design-system variant rather than a silent fork.

---

## Shared component library findings

**Strong core, two real integration gaps:**
- 🟢 `OperatorShell`, `PageHeader`, `EvidenceBlock`, `AgentStatusIndicator`, `SkeletonLoader`, `EmptyState`, `BottomNavigation` — well-built, genuinely reusable, no issues.
- 🔴 `ApprovalCard` — actions not wired (Critical #6).
- 🔴 `StatusChip` — documented as universal, imported nowhere, conflicting color maps with hand-rolled equivalents (Critical #7).
- 🟡 `IntelligencePanel` — tabs are decorative `<span>`s with no `role="tab"`/keyboard support, despite the catalog claiming "keyboard-navigable."
- 🟡 `BottomSheet` — no dialog semantics/focus-trap yet (already tracked as future work, but the top-level a11y claim overstates today's behavior).
- 🟡 `AssetCard`/`CampaignCard`/`ShootCard`/`BrandCard` — ~80% identical markup with diverging prop names (`border` vs `cardBorder`) and inconsistent `onSelect` support (BrandCard has none). Real consolidation opportunity: merge Asset/Campaign/Shoot into one `Card` + `variant`, keep BrandCard distinct (legitimately different interaction model).
- Icon path data duplicated verbatim between `NavSidebar` and `BottomNavigation` — low priority, easy extraction into a shared icon map.

**Component-library score: 78/100 (🟡)** — the components themselves are well-built; the score is held down by the two blocking gaps (ApprovalCard, StatusChip) and the fact that the Planner screens don't use any of this library at all (a Planner-side problem, not a library-side one).

---

## Documentation structure & prior-audit integrity

- **Three `DESIGN.md` files exist.** Root `DESIGN.md` is canonical (referenced 80+ times across the repo). `design-patched/DESIGN.md` is a near-duplicate staging copy pointing at a copy-target (`app/design/`) that doesn't exist in this repo — orphaned, low risk. `uploads/claude-design/DESIGN.md` is **genuinely stale** — it describes the retired v2 "Atelier" palette (`#FBF8F5`, `#E87C4D`, Geist Sans), not the current v3 Zeely Editorial system. Risk: if this folder is ever re-uploaded to a Claude Design session, it regenerates screens in the wrong visual language. **Recommend deleting or banner-marking it `ARCHIVED — pre-v3, do not upload.`**
- **A recurring drift pattern across 4 independent instances:** screen/component counts get fixed once by an audit, then silently go stale again every time a new screen batch ships (13→27→37 screens across CRM then Planner additions, with `MOBILE-PLAN.md` currently stating "36" and "27" in the *same file*). `docs/handoff/SCREEN-REGISTRY.md` is the one index that's actually current (includes SCR-32–35 correctly). `Pages/INDEX.html`, `tasks/screens/MATRIX.md`, and `docs/design/DESIGN-TASKS.md` are all stale by varying degrees.
- **`tasks/screens/` has zero scaffolding for Planner** (no `SCR-32…35` task/wireframe/diagram files, despite the convention covering SCR-01–31 completely). Planner's equivalent content lives in a parallel, differently-structured location (`planner/` + `plan/planner/design-prompts/`). Not wrong, but will confuse anyone following the stated "one file per SCR" convention.
- **Two Planner doc trees exist** (`planner/` and `plan/planner/`) — verified as a coherent upstream/downstream relationship (Tree B = engineering audit + input prompts, Tree A = design-lane output), not a meaningless fork. However: `planner.md`'s own "Files" section cites a **third, superseded copy** in `uploads/` as its source-of-truth prompts, instead of the corrected `plan/planner/design-prompts/` versions. A literal duplicate pair also exists: `plan/planner/audit-planner.md` and `planner/planner-audit.md` are byte-identical except one has an unsynced resolution note.
- **A platform-level wording conflict:** `docs/design/DESIGN-PRINCIPLES.md` states AI actions need an "Approve/Edit/**Reject**" path; every Planner doc and `DESIGN.md` itself specify "Approve/Edit/**Discard**" and explicitly forbid inventing "Reject." The Planner docs are consistent with `DESIGN.md`; `DESIGN-PRINCIPLES.md` is the outlier and should be corrected (1-line fix).

---

## Prioritized improvements

### Quick Wins (<30 min each) — ✅ all 8 done 2026-07-12
1. ✅ Reconciled `planner-final-qa.md` vs `planner-qa-handoff.md` — each now carries a scope note explaining they measure different things (Tweaks-driven demonstrability vs. static-markup default state), not conflicting verdicts.
2. ✅ Fixed `DESIGN-PRINCIPLES.md`'s "Reject" → "Discard" to match every other doc.
3. ✅ Fixed the FAB/chat-dock CSS overlap on SCR-33 and SCR-35 (`bottom:18px` → `bottom:88px`).
4. ✅ Added `aria-label="Send"` to the Planner chat-dock send button on SCR-32, SCR-33, and SCR-35.
5. ✅ Opened Linear issue [`IPI-526`](https://linear.app/amo100/issue/IPI-526/planner-hub-scr-35-screen-implementation-tracking) for SCR-35/Hub (closes the "PLN-009" gap flagged 3 separate times).
6. ✅ Fixed the broken `designtoreact.md`/`HTML.md` hrefs in `tasks/screens/SCR-TEMPLATE.md`, `MATRIX.md`, and `README.md`.
7. ✅ Archive-banner added to `uploads/claude-design/DESIGN.md` (retired v2 Atelier system) pointing to the canonical root `DESIGN.md`.
8. ✅ Copied the 5 open engineering questions from `planner-qa-handoff.md` §4.7 into `planner-react-onboarding.md` §2A, with #1 (PLN-009) marked resolved via `IPI-526`.

### High Impact
9. Rebuild SCR-32–35 against the real shared components (`OperatorShell`/`NavSidebar`/`IntelligencePanel`/`PersistentChatDock`) instead of the parallel bespoke markup — the single highest-leverage fix in the audit; unblocks design-system compliance, token consistency, and most of the a11y gaps in one pass.
10. Convert non-keyboard-operable `<div onClick>` interactive units (SCR-32 timeline/kanban/list, SCR-35 plan cards, SCR-34 member rows) to real buttons/links.
11. Decide and document the real mobile/responsive strategy for Planner (wire the breakpoint swap, or explicitly scope v1 desktop/tablet-only).
12. Wire `ApprovalCard`'s Approve/Edit/Discard actions (currently non-functional, blocking the platform's HITL principle).
13. Name a concrete state-management approach in `planner-react-onboarding.md` before Workspace build starts.

### Medium Priority
14. Consolidate `StatusChip` usage across the 4 card components; resolve the conflicting color maps.
15. Write journeys for the 3 missing personas (Producer, Client Approver, Team Administrator) — or explicitly document their equivalence to existing personas.
16. Add Create Plan, Complete Plan, and status-transition steps to at least one persona's journey each.
17. Add PR-boundary annotations to the React build-order table.
18. Add a chat-dock/AI surface to SCR-34; gate "New plan" for viewers up front on SCR-35 (matching SCR-34's invite-hero pattern).
19. Standardize `IntelligencePanel` width to the documented 332px across all screens.
20. Merge `AssetCard`/`CampaignCard`/`ShootCard` into one `Card` + `variant` component (keep `BrandCard` distinct).

### Long-term
21. Wire the actual responsive/mobile-gallery layout into production screens (if v1 isn't scoped desktop-only).
22. Design large-scale states (100+ plans, 20+ concurrent approvals, large member lists) — currently only "2 of X" examples exist anywhere.
23. Design a conflict-resolution/reconciliation flow for offline-queued changes meeting server state on reconnect.
24. Build `tasks/screens/SCR-32…35-*.md` + matching wireframe/diagram files to bring Planner into the canonical per-screen scaffolding convention.

---

## Final recommendation

**1. Is the Planner truly production-ready?** No. Production-ready would require: the QA-doc contradiction resolved, the component-reuse gap closed (or explicitly re-scoped as "React will do the reuse, DC didn't"), the FAB bug fixed, and the non-keyboard-operable controls fixed. None of these are large design changes — they're a focused reconciliation + integration pass, estimated at 1–2 weeks, not a redesign.

**2. Is the design complete?** Mostly. Screen coverage, state depth, and interaction design are genuinely strong and among the most thorough in this project's history. What's incomplete: 3 of 7 requested personas have no journey, Create/Complete Plan and status-transition workflows are undocumented for everyone, and large-scale/stress states (100+ plans, many concurrent approvals) have no design at all yet.

**3. Is React implementation safe to begin?** **Conditionally yes, but not on SCR-32–35 as currently built.** `IPI-478` (the UI shell) is next in the backend-unblocked queue, and the backend it depends on (`IPI-476`, `IPI-477`) is done and verified at 94/100 — so the underlying data model is trustworthy. But building directly against the current DC prototypes would import the parallel token system and zero component reuse straight into production. **Recommend:** treat items 9–13 above ("High Impact") as pre-implementation gates, not post-implementation cleanup — they're cheaper to fix in the design layer than to inherit as React tech debt.

**4. What are the last improvements worth making before coding?** In order: (a) resolve the QA-doc contradiction so there's one trustworthy source of truth, (b) rebuild the 4 screens against the shared component library so React starts from a system-compliant base, (c) fix the keyboard-operability gaps, (d) make an explicit, documented decision on the mobile strategy instead of leaving `SCR-MOBILE-Planner-Gallery` disconnected from the desktop screens, (e) name the state-management approach so the React build doesn't reinvent it four times.

---

## Top 20 improvements Claude Design should complete before React implementation

1. Rebuild SCR-32–35 to `dc-import` the real shared components (OperatorShell/NavSidebar/IntelligencePanel/PersistentChatDock/SkeletonLoader/EmptyState) instead of bespoke markup.
2. Replace the parallel `--bg/--text/--action/--gate` token set with the canonical `--color-*` tokens across all 5 Planner files.
3. Fix the FAB/chat-dock overlap on SCR-33 and SCR-35.
4. Convert all non-keyboard-operable primary interactive `<div>`s to real buttons/links (SCR-32, SCR-34, SCR-35).
5. Wire `ApprovalCard`'s Approve/Edit/Discard actions.
6. Reconcile `planner-final-qa.md` vs `planner-qa-handoff.md` into one canonical, accurate QA doc.
7. Decide and wire (or explicitly defer) the mobile responsive strategy for the 4 desktop screens.
8. Add an AI/chat-dock surface to SCR-34.
9. Consolidate `StatusChip` usage + fix conflicting status-color maps across the 4 card components.
10. Standardize `IntelligencePanel` width to 332px on all screens.
11. Gate "New plan" (SCR-35) and any viewer-restricted actions up front, not via post-click toast rejection.
12. Write journeys for Producer, Client Approver, and Team Administrator (or document their equivalence to existing personas).
13. Document Create Plan, Complete Plan, and status-transition workflows end-to-end for at least one persona.
14. Design large-scale states: 100+ plans in the Hub, 20+ concurrent approvals, large member lists.
15. Design the offline-reconnect conflict-resolution flow (currently unaddressed even as a concept).
16. Fix `IntelligencePanel`'s tabs to be real keyboard-operable `role="tab"` elements.
17. Open the missing Linear issue for SCR-35/Hub (the "PLN-009" gap).
18. Repoint `planner.md`'s source-of-truth citation from the stale `uploads/` snapshot to `plan/planner/design-prompts/`.
19. Fix `DESIGN-PRINCIPLES.md`'s "Reject" → "Discard" wording conflict.
20. Build the missing `tasks/screens/SCR-32…35` task/wireframe/diagram files so Planner follows the same scaffolding convention as every other screen.

---

## Answers to the direct questions

- **Which pages should be redesigned?** None — no Planner screen needs a visual redesign. The work needed is integration (component reuse, tokens) and interaction fixes (keyboard operability), not new design.
- **Which pages only need small improvements?** SCR-33 (fix FAB overlap + panel width) and SCR-34 (add AI dock + keyboard support on member rows) are the closest to done.
- **Which pages are production-ready?** None yet, as-is — every screen needs at least the token/component-reuse pass. SCR-33 and SCR-34 are closest.
- **Which shared components should be improved?** `ApprovalCard` (wire actions), `StatusChip` (fix conflicting maps + get it actually imported), `IntelligencePanel` (real tab semantics), `BottomSheet` (dialog semantics now, focus-trap already tracked as MOBILE-004).
- **Which components should be merged or removed?** Merge `AssetCard`/`CampaignCard`/`ShootCard` into one `Card` + `variant` (keep `BrandCard` separate — legitimately different interaction model). Remove nothing outright; delete/archive the stale `uploads/claude-design/DESIGN.md`.
- **Is the overall Design V2 system consistent?** Yes, for screens that were migrated onto the shared component library (Command Center, Brand List, Shoots List, Assets, CRM screens). No, for Planner specifically — it was built as a structurally parallel implementation and needs the integration pass described above before it can be called consistent with the rest of Design V2.
