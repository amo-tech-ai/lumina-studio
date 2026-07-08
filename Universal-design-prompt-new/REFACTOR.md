# iPix — App-Wide Refactor Audit (pre-React)

> **Scope:** the whole iPix design set — operator screens (Command Center, Brands, Shoots, Assets, Campaigns, Analytics, Channel) + the shoot lifecycle + the booking/model set. CRM has its own companion audit: `crm/CRM-REFACTOR-AUDIT.md`.
> **Audit only** — no prototype changes, no React, no redesign. All findings measured (lines/chars/pattern counts).
> Legend: 🟢 keep · 🟡 minor tidy · 🟠 extract/consolidate in React · 🔴 large / real problem.

---

## 1. Executive summary

Unlike the CRM set (small, uniform files), the **root operator screens are genuinely large**, and two are the biggest files in the project by a wide margin:

- **`Shoot Wizard.v2` — 1,166 lines / 128 KB** 🔴
- **`Shoot Detail.v2` — 1,049 lines / 109 KB** 🔴

Both are large for a *good* reason — each now hosts **two flows** (`shoot` + `booking`) behind a `flow`/`FLOWCFG` switch (16–17 flow-markers each). That was the right product decision (booking = a flow of the shoot lifecycle, not a parallel app), but it means these two files are doing double duty and are the **clear #1 refactor target**. Seven more root screens sit at 570–780 lines.

Three app-wide issues, in priority order:

1. **The two shoot-lifecycle giants** need the shared wizard/detail *shell* extracted and the flow-specific bodies split — so `shoot` and `booking` are sibling configs, not one 1,100-line file.
2. **Two icon systems coexist.** Root `*.v2.image-first` screens use **inline `<svg>`** (18–42 per file); the booking + CRM screens use the **`lu-ic` custom element**. That's real cross-suite drift — React should standardize on one `<Icon>`.
3. **The 3-panel OperatorShell is re-implemented in every screen** (NavRail + workspace + IntelligencePanel + chat dock, ~15 screens). Same finding as CRM but at larger scale and higher payoff.

**Same core guidance as the CRM audit: refactor _during_ React conversion, not before.** Do **not** rewrite the `.dc.html` prototypes to share code — that breaks standalone rendering. The exception worth considering *pre-conversion* is documentation-only: none. The prototypes are the spec; the work is the extraction map below.

One naming clarification (not a bug): **`Matching.v2` (root) and `booking/SCR-09` are different screens**, not duplicates — see §7.

---

## 2. Files reviewed (measured)

**Root — operator + shoot lifecycle (14 DCs)**

| File | Lines | Size | Verdict |
|---|--:|--:|:--:|
| `Shoot Wizard.v2.image-first` | 1166 | 128 KB | 🔴 split |
| `Shoot Detail.v2.image-first` | 1049 | 109 KB | 🔴 split |
| `Channel Preview.v2.image-first` | 780 | 86 KB | 🟠 |
| `Assets.v2.image-first` | 757 | 82 KB | 🟠 |
| `Brand Detail.v2.image-first` | 737 | 71 KB | 🟠 |
| `Matching.v2.image-first` | 671 | 78 KB | 🟠 |
| `Command Center.v2.image-first` | 645 | 57 KB | 🟠 |
| `Onboarding.v2.zeely` | 616 | 43 KB | 🟠 |
| `Campaign Performance.v2.image-first` | 606 | 65 KB | 🟠 |
| `Campaigns.v2.image-first` | 589 | 64 KB | 🟠 |
| `Brand List.v2.image-first` | 583 | 58 KB | 🟠 |
| `Analytics.v2.image-first` | 571 | 63 KB | 🟠 |
| `Shoots List.v2.image-first` | 501 | 51 KB | 🟠 |
| `Component Library` | 183 | 13 KB | 🟢 |

**Booking / model set (9 DCs)**

| File | Lines | Size | Verdict |
|---|--:|--:|:--:|
| `SCR-MOBILE-Gallery` | 829 | 80 KB | 🟢 (data-driven — correct) |
| `SCR-09-Matching-Talent` | 496 | 46 KB | 🟠 |
| `SCR-20-Talent-Profile` | 436 | 36 KB | 🟠 (360° template) |
| `SCR-MOBILE-Booking-Shell` | 357 | 31 KB | 🟢 |
| `SCR-24-Talent-Onboarding` | 327 | 24 KB | 🟡 |
| `SCR-15-Notification-Center` | 265 | 20 KB | 🟡 |
| `SCR-25-Role-Dashboards` | 261 | 21 KB | 🟠 (360°-ish) |
| `SCR-MOBILE-BottomSheet` | 226 | 15 KB | 🟢 primitive |
| `SCR-23-Availability-Editor` | 150 | 11 KB | 🟢 |

**Totals:** 23 DCs · ~12,800 lines · ~1.25 MB. (CRM adds 8 more — see its audit.)

---

## 3. Refactor priority table

| # | Action | Files | Priority | Effort |
|---|---|---|:--:|:--:|
| A1 | **Split the two giants** — extract `<WizardShell>` + `<DetailShell>`, make `shoot`/`booking` sibling flow-configs | Shoot Wizard, Shoot Detail | 🔴 P0 | L |
| A2 | **One `<AppShell>`** (NavRail · workspace · IntelligencePanel · chat dock) | all ~15 operator screens | 🔴 P0 | M |
| A3 | **Standardize icons** — one `<Icon>`; retire inline-`<svg>` vs `lu-ic` split | root vs booking/CRM | 🟠 P1 | M |
| A4 | **Shared list template** — rows + filters + search + selection panel | Brand List, Shoots List, Assets, Campaigns, SCR-09, (+CRM lists) | 🟠 P1 | M |
| A5 | **Shared 360°/detail template** | Brand Detail, SCR-20, SCR-25, (+CRM details) | 🟠 P1 | M |
| A6 | **Analytics/KPI kit** — KPI card, delta, sparkline, bar/trend rows | Analytics, Campaign Performance, Command Center, dashboards | 🟠 P1 | M |
| A7 | **Extract atoms** — StatusChip, Card, Timeline, EvidenceBlock, ApprovalCard, Tabs, Wizard stepper | app-wide | 🟠 P1 | M |
| A8 | **One token file** — unify `:root` across all suites; fix drift colors | app-wide | 🟡 P2 | S |
| A9 | Clarify **Matching naming** (`Matching.v2` vs `SCR-09`) in the registry | 2 files | 🟡 P2 | S |

**None are "before" conversion** — P0 = "do first *within* conversion."

---

## 4. The two giants (deep dive — the real story)

`Shoot Wizard.v2` (1166) and `Shoot Detail.v2` (1049) are large because each carries **both** the shoot flow and the booking flow (SCR-21 / SCR-22) in one file, selected at runtime by `flow` + `FLOWCFG`. Evidence: 16–17 flow-markers per file vs 0–2 everywhere else.

**This is correct architecture, wrong file size for React.** In conversion:

- **`Shoot Wizard`** → `<WizardShell>` (stepper, nav, sticky footer, progress, validation, unsaved-guard) + two step-config sets (`shootSteps`, `bookingSteps`). The shell is ~1 component; each flow is data.
- **`Shoot Detail`** → `<DetailShell>` (hero, tab strip, timeline, panel, chat) + `FLOWCFG` per flow (already the prototype's own pattern — lift it verbatim). Booking tabs (Talent/Availability/Approvals) become config, not markup.

Result: two ~1,100-line files become **two shells + four small config objects**. This is the single highest-leverage refactor in the app.

---

## 5. Recommended shared components (app-wide design system)

The same ~12 primitives serve every screen (operator + booking + CRM):

| Component | Replaces | Scope |
|---|---|---|
| `<AppShell>` | 3-panel markup ×~15 | every operator/booking/CRM screen |
| `<Icon>` | inline `<svg>` (root) **+** `lu-ic` (booking/CRM) | app-wide — **unifies the two systems** |
| `theme` tokens | `:root` block, every DC | app-wide |
| `<WizardShell>` | Shoot Wizard shell | wizard (shoot + booking flows) |
| `<DetailShell>` / `<Profile360>` | Shoot/Brand Detail, SCR-20/25, CRM details | all detail/profile screens |
| `<EntityList>` | Brand/Shoots/Assets/Campaigns lists, SCR-09, CRM lists | all list screens |
| `<KPICard>` + `<Sparkline>` + `<TrendRow>` | analytics markup | dashboards + analytics |
| `<Timeline>` | activity markup | details, dashboards |
| `<Tabs>` / `<Stepper>` | tab & step markup | details, wizard |
| `<StatusChip>` / `<Card>` | pill & card markup (dozens/file) | app-wide |
| `<EvidenceBlock>` / `<ApprovalCard>` | AI-evidence + HITL blocks | AI surfaces (all suites) |
| `<ImageSlot>` | `image-first` photo tiles | image-first screens |

`Pages/Component Library.dc.html` already exists (183 lines) — it should become the **canonical catalog** these are built from and checked against.

---

## 6. Files that should stay as-is

- **`Component Library`** 🟢 — small; promote to the design-system source of truth.
- **`SCR-MOBILE-Gallery` / `SCR-MOBILE-Booking-Shell` / `SCR-MOBILE-BottomSheet`** 🟢 — already correctly consolidated (data-driven; one primitive). Models, not targets.
- **`SCR-23-Availability-Editor`** 🟢 — small, single-purpose.
- **CRM `.md` docs + this set's plans** 🟢.

---

## 7. Duplicated & drifting patterns (evidence)

- **Two icon systems** — root `*.v2` use **inline `<svg>`** (Command Center 18, Shoot Detail 33, Matching 42) with an `ico()` helper; booking + CRM use **`lu-ic`**. No shared icon source. → A3.
- **3-panel shell** re-authored in ~15 screens (NavRail + workspace + IntelligencePanel + chat). → A2.
- **Dual-flow bloat** — Wizard/Detail carry two flows inline (16–17 markers). → A1.
- **List pattern** — rows + filter chips + search + selection panel repeats across Brand List, Shoots List, Assets, Campaigns, SCR-09, CRM lists. → A4.
- **Detail/360° pattern** — hero + tabs + timeline + panel repeats across Brand Detail, Shoot Detail, SCR-20, SCR-25, CRM details. → A5.
- **KPI/analytics** — KPI cards + deltas + sparklines + bar rows repeat across Command Center, Analytics, Campaign Performance, dashboards. → A6.
- **Naming (not a dupe):** `Matching.v2` (root, 671) is **brand↔creator matching** — no "Talent Matches" tab, no Casting Review. `booking/SCR-09` (496) is the **talent/casting** screen (Casting Review + swipe). They're distinct screens that share a name stem. → A9: record both in `SCREEN-REGISTRY.md` with clear routes so conversion doesn't merge or double-build them.

---

## 8. Mobile-specific refactor notes

- Booking mobile is already consolidated (gallery + shell + bottom-sheet primitive). CRM mobile likewise. **No per-screen mobile files to build.**
- **Operator screens have no dedicated mobile build yet** — `MOBILE-PLAN.md` specs them, but the `*.v2.image-first` DCs are desktop-first. In React they should be the **responsive** form of `<AppShell>`/`<EntityList>`/`<DetailShell>` (`<1024px` → bottom tab bar + Insights sheet + composer), not separate files.
- The **kanban → stage-accordion** reflow (Pipeline) remains the one genuinely mobile-only pattern needing real responsive logic + drag-a11y.

---

## 9. Risks before React conversion

| Risk | Severity | Mitigation |
|---|:--:|---|
| The two giants converted **as-is** → two unmaintainable 1,000-line components | 🔴 High | A1 first: build `<WizardShell>`/`<DetailShell>` + flow-configs before any screen work. |
| Two icon systems ported verbatim → permanent inconsistency + double icon payload | 🟠 Med-High | A3: one `<Icon>`; map both inventories into it early. |
| 15 bespoke shells (shell re-duplicated per screen) | 🔴 High | A2: `<AppShell>` is the first shared PR; every screen renders through it. |
| `Matching.v2` and `SCR-09` merged or double-built by mistake | 🟡 Med | A9: register both with distinct routes + purposes. |
| **HITL gates** (booking confirm, won/lost, drafted offers) lost in translation | 🔴 High | `ApprovalCard` a hard dependency of every write path; verify vs each suite's plan. |
| Token drift (per-suite `:root` copies, inline hex) baked in | 🟡 Med | A8: single token file; fold in CRM audit's R7 color list. |
| States (empty/loading/error/gated) dropped as "extra" | 🟡 Med | Treat as required props on shared templates. |

---

## 10. Final recommendation

**Refactor during conversion; change no prototype now.** Build order:

1. **Foundation first** — `<AppShell>` (A2) + `<Icon>` (A3, unify both systems) + token file (A8). Unblocks everything and kills the biggest duplication.
2. **The two giants** — `<WizardShell>` + `<DetailShell>` with `shoot`/`booking` flow-configs (A1). Highest single payoff; lift the prototype's own `FLOWCFG`.
3. **Two templates** — `<EntityList>` (A4) and `<DetailShell>`/`<Profile360>` (A5). Convert Brand/Shoots/Assets/Campaigns lists and Brand/SCR-20/25 details as **configs**.
4. **Analytics kit** (A6) + **atoms** (A7) — from `Component Library`, which becomes the catalog.
5. **Unique screens** consume the above; **mobile = responsive templates**, not new files.

**Order of magnitude:** the app is ~12,800 lines across 23 DCs today; the vast majority collapses into **~12 shared components + configs**. The two shoot-lifecycle files alone (~2,200 lines) reduce to two shells + four configs — that's where to start.

The prototypes are a **complete, faithful** design source. Their size and duplication are properties of the standalone-DC medium (each must paint alone) and resolve in React via this extraction map. **No pre-conversion rewrite of any prototype is warranted.**

---

### Companion
- **CRM specifics:** `crm/CRM-REFACTOR-AUDIT.md` (same method, CRM-scoped).
- **Screen IDs / routes:** `docs/handoff/SCREEN-REGISTRY.md` (owner of numbering — update per A9).
- **Component catalog:** `Pages/Component Library.dc.html` (promote to design-system source).
