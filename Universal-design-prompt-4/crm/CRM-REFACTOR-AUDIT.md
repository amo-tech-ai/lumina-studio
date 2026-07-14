# CRM — Refactor Audit (pre-React)

> **Purpose:** identify which CRM design files to refactor *before* Claude Code converts them to React. **Audit only** — no prototype changes, no React, no redesign.
> **Method:** measured every file (lines/chars), scanned for duplicated boilerplate, un-tokenized colors, and repeated card/tab/timeline markup, and checked drift against `crm-plan.md` + `PROFILE-360-template.md`.
> Legend: 🟢 keep as-is · 🟡 minor tidy · 🟠 extract/consolidate in React · 🔴 real problem.

---

## 1. Executive summary

**The CRM prototypes are healthy. None are too large** — the biggest is `SCR-26` at 324 lines / 26 KB; most sit at 140–200 lines. There is **no bloated or runaway file to split.**

The genuine finding is **duplication that is correct in this medium but must collapse in React.** Every `.dc.html` is deliberately self-contained (it must paint standalone), so all 8 CRM DCs each re-embed:
- the **`lu-ic` icon map + custom-element definition** (~1.6–2.7 KB × 8 ≈ **17 KB of identical boilerplate**),
- the **`:root` design-token block**, and
- the same **card / chip / badge / timeline / IntelligencePanel** inline markup.

**Do not "fix" this in the prototypes** — sharing code across `.dc.html` files fights the format and breaks standalone rendering. The audit's real output is a **component-extraction map** for the React conversion: the duplication that is ~17 KB of copy-paste today becomes ~8 shared components + one token file in React.

Secondary finding: **minor color drift** — 4 files use `#7c3aed` (AI/agency violet) and soft icon-backgrounds (`#e7f0ff`, `#eaf7f0`, `#f3edff`) and the approval border `#f4d9ad` as **inline hex, not tokens.** These should become tokens *during* conversion so the React theme is complete.

**No structural drift from the plan.** `SCR-27`, `SCR-29`, and `DEMO-360-Agency` are all faithful instances of the `PROFILE-360-template.md` pattern; `SCR-26`/`SCR-28` are the shared list pattern. The docs and prototypes agree.

**Bottom line:** refactor **during** React conversion (extract components + finish tokens), not before. No prototype needs rewriting now.

---

## 2. Files reviewed

| File | Lines | Chars | Type | Verdict |
|---|--:|--:|---|:--:|
| `INDEX.html` | 118 | 8.4 KB | nav index | 🟢 |
| `SCR-26-CRM-Companies-List.dc.html` | 324 | 26 KB | Organizations list | 🟠 |
| `SCR-27-CRM-Company-Detail.dc.html` | 202 | 21 KB | Org 360° | 🟠 |
| `SCR-28-CRM-Contacts-List.dc.html` | 142 | 18 KB | People list | 🟠 |
| `SCR-29-CRM-Contact-Detail.dc.html` | 147 | 17 KB | Person 360° | 🟠 |
| `SCR-30-CRM-Pipeline.dc.html` | 174 | 17 KB | Pipeline kanban | 🟢 |
| `SCR-31-CRM-Deal-Detail.dc.html` | 185 | 21 KB | Deal detail | 🟡 |
| `SCR-MOBILE-CRM-Gallery.dc.html` | 317 | 28 KB | mobile gallery | 🟢 |
| `DEMO-360-Agency.dc.html` | 228 | 25 KB | template demo | 🟢 |
| `crm-plan.md` | 599 | 48 KB | plan | 🟢 |
| `RELATIONSHIP-HUB.strategy.md` | 201 | 13 KB | strategy | 🟢 |
| `PROFILE-360-template.md` | 168 | 10 KB | template spec | 🟢 |
| `CRM-MOBILE-tasks.md` | 171 | 12 KB | mobile tasks | 🟢 |

🟠 here means **"source of a shared React component"**, not "broken." Every 🟠 file renders clean (0 holes) and stays as-is until conversion.

---

## 3. Refactor priority table

| # | Action | Files | Priority | Effort | When |
|---|---|---|:--:|:--:|---|
| R1 | Extract **`<Icon>`** — replace the 8 embedded `lu-ic` maps | all 8 DCs | 🔴 P0 | S | at conversion |
| R2 | Extract **token file** — one `:root` / theme, delete 8 copies | all 8 DCs | 🔴 P0 | S | at conversion |
| R3 | Build **`Profile360` template component** + config registry | SCR-27, SCR-29, DEMO-Agency | 🟠 P1 | M | at conversion |
| R4 | Build **`EntityList` template** (rows + filter chips + search + panel) | SCR-26, SCR-28 | 🟠 P1 | M | at conversion |
| R5 | Extract **`Timeline`** (unified activity) | SCR-27, 29, 31, DEMO | 🟠 P1 | S | at conversion |
| R6 | Extract atoms: **`StatusChip` · `TypeChip` · `Card` · `EvidenceBlock` · `ApprovalCard`** | all | 🟠 P1 | M | at conversion |
| R7 | **Tokenize drift colors** (`#7c3aed`, icon-bg trio, `#f4d9ad`) | 27, 29, 31, DEMO, 26, 28 | 🟡 P2 | S | at conversion |
| R8 | Confirm **mobile = responsive `Profile360`/`EntityList`**, not a parallel build | mobile gallery | 🟡 P2 | — | design decision, already specced |

**Nothing is P0 "before" conversion** — P0 = "do first *within* conversion." No pre-work rewrite is warranted.

---

## 4. Recommended shared components (the extraction map)

Ten components absorb essentially all duplication:

| Component | Replaces (today) | Used by |
|---|---|---|
| `<Icon name>` | `lu-ic` map ×8 | every screen |
| `theme.css` / tokens | `:root` block ×8 | every screen |
| `<AppShell>` (3-pane: NavRail · main · IntelligencePanel · chat dock) | shell markup ×8 | every desktop screen |
| `<Profile360 config>` | SCR-27 / 29 / DEMO layouts | all detail screens |
| `<EntityList config>` | SCR-26 / 28 layouts | all list screens |
| `<Timeline items>` | activity markup ×4 | 27, 29, 31, DEMO |
| `<StatusChip>` / `<TypeChip>` | pill markup (4–8 per file) | every screen |
| `<Card>` | `border+radius` card (2–5 per file) | every screen |
| `<EvidenceBlock>` | summary+confidence markup | detail screens + panel |
| `<ApprovalCard>` | HITL draft→approve block | 27, 29, 31, DEMO, pipeline |

`<Profile360>` + `<EntityList>` + the config registry are the heart — they realize the `PROFILE-360-template.md` promise ("design once, configure per entity") in code. `DEMO-360-Agency` already proves the config approach with **zero new schema**; it is the reference for `<Profile360>`'s prop shape.

---

## 5. Files that should stay as-is (no refactor)

- **`INDEX.html`** 🟢 — small, static, not converted; navigation surface.
- **`SCR-30-CRM-Pipeline.dc.html`** 🟢 — the kanban is genuinely unique (no shared-layout sibling); reuses only atoms (chips/cards). Keep whole; on mobile it becomes the stage-accordion per `CRM-MOBILE-tasks.md`.
- **`SCR-MOBILE-CRM-Gallery.dc.html`** 🟢 — already the *right* consolidation: one data-driven file renders all 6 phone frames from a config array. This is the model, not a refactor target. (Its off-token hex values are phone-frame **chrome**, not app UI — leave them.)
- **`DEMO-360-Agency.dc.html`** 🟢 — keep as the living reference for `<Profile360>`; it demonstrates a 4th config (Agency) with linked-list tabs + a gated tab.
- **All 4 `.md` docs** 🟢 — current, consistent, and the source of truth for conversion. No drift.

---

## 6. Files that should be split or simplified

**None need splitting.** No file is large or multi-responsibility enough to warrant it. To be explicit:

- The largest (`SCR-26`, 324 lines) is big only because it carries the icon map + tokens + list + panel + states inline — **all of which leave the file at conversion** (R1/R2/R4). The *authored* surface is small.
- `SCR-31-CRM-Deal-Detail` 🟡 is the only "simplify later" candidate: it re-implements a timeline + ApprovalCard that will come from `<Timeline>` / `<ApprovalCard>`. Not a split — just consumes shared components in React.

**Recommendation: do not split any prototype.** Splitting `.dc.html` files across shared partials breaks standalone rendering; consolidation belongs in React only.

---

## 7. Duplicated patterns found (evidence)

Measured across the 8 DCs:

- **Icon boilerplate** — `lu-ic` map + `customElements.define` in **8/8** files, 1.6–2.7 KB each (~17 KB total identical). → R1.
- **Token block** — `:root{…}` in **8/8**, near-identical. → R2.
- **360° skeleton** — header + type-chip + tab-strip + tab-body + timeline + IntelligencePanel appears **3×** (SCR-27, SCR-29, DEMO-Agency), differing only by config. → R3.
- **List skeleton** — row + filter-chips + search + selection-driven panel appears **2×** (SCR-26, SCR-28). → R4.
- **Timeline markup** — `activities.map` + `iconBg`/`iconColor` node styling in **4** files (27, 29, 31, DEMO). → R5.
- **Pill chips** — `border-radius:var(--r-pill)` repeated **3–8×/file**. → `StatusChip`/`TypeChip`.
- **MD cards** — `border:1px solid var(--border);border-radius:var(--r-md)` repeated **2–5×/file**. → `Card`.
- **Un-tokenized colors** — `#7c3aed` (AI/agency) in **4** files; icon-bg trio `#e7f0ff/#eaf7f0/#f3edff` in **4**; approval border `#f4d9ad` in **all** (only `--approval-bg` is a token). → R7.

---

## 8. Mobile-specific refactor notes

- **Mobile is already consolidated correctly.** `SCR-MOBILE-CRM-Gallery` renders all 6 frames from one config array (shared chrome: tab bar · top bar · persistent composer · Insights sheet; Pipeline → stage accordion). Do **not** create per-screen mobile files.
- **In React, mobile is not a separate build.** `<Profile360>` and `<EntityList>` should be **responsive** (`<1024px` → NavRail becomes bottom tab bar, IntelligencePanel becomes the Insights BottomSheet, tab strip scrolls). `CRM-MOBILE-tasks.md §6` already specs routes/CTAs/states — feed it directly to conversion.
- **One genuine mobile-only pattern:** the **kanban → stage accordion** reflow (Pipeline). It is specced but only *demonstrated* in the gallery; it's the single piece needing real responsive logic + a keyboard/button move alternative to drag (a11y).
- **Leave the gallery's frame-chrome hex** (`#0e0e10`, `#1c1c1e`, `#8a8a92`, `#c7c7cf`) alone — that's the phone bezel, not app tokens.

---

## 9. Risks before React conversion

| Risk | Severity | Mitigation |
|---|:--:|---|
| Devs convert screen-by-screen and **re-duplicate** the 360°/list layouts into 6 bespoke components | 🔴 High | Build `<Profile360>` + `<EntityList>` **first**; SCR-27 & SCR-26 are the reference configs. Enforce "new entity = config, not screen." |
| Un-tokenized colors bake in as magic hex → incomplete theme / dark-mode later | 🟡 Med | R7 — promote `#7c3aed` + icon-bg trio + `#f4d9ad` to tokens during conversion. |
| Gated/empty/loading/error states get dropped (they read as "extra") | 🟡 Med | Every screen ships all states in the prototype; treat states as required props on `<Profile360>`/`<EntityList>`, not optional. |
| **HITL gates** silently lost in translation (won/lost, convert, drafted offer) | 🔴 High | `ApprovalCard` must be a hard dependency of any write path; verify against `crm-plan.md` won/lost gate + `CRM-HANDOFF.md §3`. |
| Building 🔴-gated tabs (Photographer/Location/Revenue) against absent schema | 🟡 Med | Keep `gated:'schema'` behavior — render greyed "not connected yet"; don't wire until IPI-362. |
| Kanban drag with no keyboard alternative (a11y regression) | 🟡 Med | Spec'd in mobile tasks; make button/keyboard move first-class, drag an enhancement. |

---

## 10. Final recommendation

**Refactor during conversion, not before. Change nothing in the prototypes now.**

1. **First PRs:** `<Icon>` (R1) + token file (R2) + `<AppShell>` — removes ~17 KB of boilerplate and sets the theme.
2. **Then the two templates:** `<Profile360>` (from SCR-27; validate against `DEMO-360-Agency`) and `<EntityList>` (from SCR-26). Convert SCR-27/28/29 as **configs**, not new components.
3. **Then atoms:** `Timeline`, `StatusChip`, `TypeChip`, `Card`, `EvidenceBlock`, `ApprovalCard` (R5/R6) + tokenize drift colors (R7).
4. **Unique screens last:** Pipeline (SCR-30) + Deal Detail (SCR-31) consume the atoms; Pipeline gets the responsive accordion + drag-a11y.
5. **Mobile = responsive templates**, driven by `CRM-MOBILE-tasks.md` — no separate mobile components.

The prototypes are a **clean, faithful, appropriately-sized** design source. Their duplication is a property of the standalone-DC medium and resolves naturally in React via the extraction map above. **No pre-conversion rewrite is needed.**
