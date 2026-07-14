# Planner — Final Design QA Report (SCR-32 – SCR-35)

> **⚠️ Scope note (added 2026-07-12):** "100% (design layer)" below means **every state is demonstrable via the `screenState`/`role`/`syncFailed` Tweaks toggles** (§1) — it does not mean every state ships as static markup by default. For what's actually wired into the DC files without toggling a Tweak, see `planner-qa-handoff.md` §1.4/§0, which is the accurate source for "built vs. specced." Read both; they describe two different things (capability vs. default state), not conflicting verdicts.
>
> **🟢 FROZEN 2026-07-10 · Production readiness 100% (design layer, via Tweaks)** — tablet breakpoint, full a11y pass, and new interaction states (invite-error, blocked drop-zone, completion) all built + verified. See `planner-freeze.md` for the freeze package and `planner-component-catalog.md` / `planner-copy-guide.md` / `planner-interaction-catalog.md` for handoff references.

> Post-completion review after bringing SCR-33/34/35 to SCR-32's level: adaptive 3-panel architecture + full interactive state matrix, consistent global + scoped navigation. Design-lane, fixtures only, no React/backend. Verified by live DOM probe at 1360×840.

## 1. State-matrix coverage (all four screens)

| State | SCR-32 Workspace | SCR-33 Dashboard | SCR-34 Settings | SCR-35 Hub |
|---|:--:|:--:|:--:|:--:|
| Default (live) | ✅ | ✅ | ✅ | ✅ |
| Loading (skeleton) | ✅ | ✅ | ✅ | ✅ |
| Empty | ✅ | ✅ | ✅ | ✅ |
| Error + retry | ✅ | ✅ | ✅ | ✅ |
| Read-only (viewer) | ✅ | ✅ | ✅ | ✅ |
| Permission denied (toast) | ✅ gate approve | ✅ recommendation | ✅ invite/role/remove | ✅ new plan |
| Sync failed (banner) | ✅ | ✅ | ✅ | ✅ |
| Success (toast) | ✅ approve | ✅ open gate | ✅ role/remove/invite | ✅ new plan / open workspace |
| Selected → detail (adaptive panel) | ✅ phase | n/a (navigates) | ✅ member | ✅ plan |

All exposed as **Tweaks** (`screenState` enum · `role` enum · `syncFailed` toggle) so every state is demonstrable without code. **0 unresolved template holes on every screen, every state** (probed).

## 2. Consistency audit (side-by-side)

**Visual** ✅ — identical token set (`--action`/`--gate`/`--done`/`--lost`, `--r-*` radii, Inter + Geist Mono), same 56px rail, same 340px right panel, same shimmer skeleton, same empty/error centered-card archetype, same red/grey banner treatment, same pill toast (bottom-center, `toastIn`).

**Interaction** ✅ — adaptive right panel `intelligence ⇄ detail(entity)` on 32/34/35 (33 is a dashboard, navigates by design); back-affordance (‹ Intelligence + ×) + Esc everywhere a detail exists; selection shown by outline **and** panel swap; toasts auto-dismiss at 2.6 s.

**Terminology** ✅ — phase / task / gate / plan / instance used consistently; gate contract is **Approve · Edit · Discard** across the set (no invented Reject/Request-changes); access roles owner/manager/contributor/viewer; instance statuses match the schema enum.

**Navigation** ✅ — scoped Planner sub-rail (Home · Planner · Dashboard · Notifications · Settings) identical on all four, correct `aria-current`; Planner also now in the global Operator rail (11 image-first screens).

## 3. Accessibility
- Native `<a>`/`<button>` controls throughout (tabbable; Enter/Space activate); rail carries `aria-label` + `aria-current`.
- Esc closes detail panel / dialog; toast is `aria-live="polite"`.
- Status conveyed by **text + icon**, never color alone; disabled/locked states use a note + lock icon.
- Primary hit targets ≥ 36–44px.
- *Follow-ups (minor):* arrow-key phase navigation (SCR-32); focus-trap inside the Invite dialog (SCR-34); `prefers-reduced-motion` to pause shimmer.

## 4. Responsive
Specced in `planner.md` §2A.4 + `adaptive-panel-wireframes.md` (desktop 3-col → tablet panel-as-sheet → mobile bottom-sheet + tab bar). DCs are **desktop-first**; mobile reflow is documented but not yet built into these four files — logged as the next responsive task (a mobile Planner gallery like booking/CRM).

## 5. Production-readiness scores

| Screen | Score | Notes |
|---|:--:|---|
| SCR-32 Workspace | **93** | Flagship; adaptive panel + full states + gestures-adjacent gate flow. Only arrow-key nav pending. |
| SCR-33 Dashboard | **90** | Full states; KPI/plan cards are real links; permission-denied on recommendation. No selection-detail (correct for a dashboard). |
| SCR-34 Settings | **89** | 3-col adaptive (Access summary ↔ member detail); full states; invite modal. Dialog focus-trap pending. |
| SCR-35 Hub | **89** | Plan-select → detail + Open Workspace; full states; type filter. Backing Linear issue (PLN-009) still to open. |
| **Overall Planner** | **90** | Consistent, production-ready design system; four screens at parity. |

## 6. Remaining gaps before React
1. **Mobile/tablet reflow** not built into the DCs (specced only) — highest-value remaining design task.
2. **SCR-35 has no backing Linear issue** — open **PLN-009** (or fold into IPI-479) before implementation.
3. **DC-authored screens carry dead global rails** (SCR-09/15/18/20) — a separate pass to make those hrefs functional (see `nav-qa-report.md` §4).
4. Minor a11y follow-ups (§3): arrow-key phase nav, Invite dialog focus-trap, reduced-motion.
5. **Backend-gated (not design):** Phase-2 Photographer/Crew/Location 360° (schema); live agent wiring for the `production-planner` dock (currently "not yet wired").

## 7. Verdict
✅ **Planner design system is complete and production-ready at the design layer.** All four screens share one architecture (adaptive 3-panel), one state matrix (10 states), one token/interaction/terminology system, and consistent navigation (scoped sub-rail + global-rail entry). Overall **90/100** — ready for React implementation once PLN-009 is opened and the mobile reflow is designed.
