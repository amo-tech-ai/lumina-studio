---
title: Mobile Verification Report — 390px Prototype Pass
date: 2026-06-30
linear: IPI-264
spec: tasks/design-docs/design/MOBILE-VERIFICATION.md
scope: Claude Design DC prototypes (*.v2.image-first.dc.html + Onboarding)
breakpoint: 390px (iPhone 14 class)
next_breakpoint: 430px
status: in_progress
---

# Mobile Verification — 390px Prototype Pass

**Linear:** [IPI-264 · Mobile Verification Pass/Fail Matrix](https://linear.app/amo100/issue/IPI-264)  
**Epic:** [IPI-254 · DESIGN V2 React Parity](https://linear.app/amo100/issue/IPI-254)  
**Process SSOT:** [`MOBILE-VERIFICATION.md`](../../../../../tasks/design-docs/design/MOBILE-VERIFICATION.md)

> **Scope:** DC prototype HTML at `Universal design prompt/` — **not** Next.js `/app/*` (React pass follows IPI-243 + IPI-251).  
> **Goal:** Validate IPI-264 matrix + evidence workflow before React mobile shell lands.

---

## Executive summary

| Metric | 390px prototype pass |
|--------|----------------------|
| Screens captured | **11 / 11** |
| Page-level horizontal overflow | **0 / 11** 🔴 |
| Shell screens with bottom nav | **9 / 9** expected ✅ |
| Console clean | **6 / 11** (5 SVG parse errors) |
| 🔴 Critical (ship blockers) | **0** |
| 🟡 Major | **2 themes** (SVG console errors · Shoot Wizard card scroll) |
| ⚪ Minor | Touch targets · chat-dock probe false-negatives · onboarding 404 asset |

**Verdict (390px prototypes):** 🟡 **Proceed to 430px** after fixing SVG path errors. No page-level overflow blockers. Shoot Wizard mobile chrome remains 🟡 Major (known P3 in `checklist.md`).

**Next breakpoint:** **430px** → then 768px → 1024px → desktop regression.

---

## Method

1. Static server: `python3 -m http.server 8765` in `Universal design prompt/`
2. Viewport: **390×844**, DPR 2 (mobile)
3. Screenshots: `screenshots/{slug}-390.png`
4. Automated probe: overflow · bottom nav · chat dock heuristics · console · touch-target count  
   → [`390-pass-metrics.json`](./390-pass-metrics.json)
5. Manual visual review: priority screens (Assets, Shoot Wizard, Matching)

**Not yet run at 390px:** alternate states (empty/loading/error/selected), EvidenceBlock modal open, journeys E2E, safe-area notch simulation.

---

## Screen-by-screen matrix (390px · default populated state)

Severity: ✅ Pass · 🔴 Critical · 🟡 Major · ⚪ Minor · ⏳ Pending

| # | Screen | Layout | Nav | Components | AI dock | States | A11y | Mobile | Console | Overall | Screenshot |
|---|--------|:------:|:---:|:----------:|:-------:|:------:|:----:|:------:|:-------:|:-------:|------------|
| 1 | Onboarding | ✅ | N/A | ✅ | N/A | ⏳ | ⚪ | ✅ | 🟡 404 asset | 🟡 | [onboarding-390.png](./screenshots/onboarding-390.png) |
| 2 | Shoot Wizard | 🟡 inner scroll | N/A | 🟡 chrome | ✅ | ⏳ | ⚪ | 🟡 | ✅ | 🟡 | [shoot-wizard-390.png](./screenshots/shoot-wizard-390.png) |
| 3 | Shoot Detail | ✅ | ✅ | ✅ | ✅ | ⏳ | ⚪ | ✅ | ✅ | 🟢 | [shoot-detail-390.png](./screenshots/shoot-detail-390.png) |
| 4 | Assets | ✅ | ✅ | ✅ | ✅ | ⏳ | ⚪ | ✅ | 🟡 SVG | 🟡 | [assets-390.png](./screenshots/assets-390.png) |
| 5 | Channel Preview | ✅ | ✅ | ✅ | ⚪ collapsed | ⏳ | ⚪ | ✅ | ✅ | 🟢 | [channel-preview-390.png](./screenshots/channel-preview-390.png) |
| 6 | Matching | ✅ | ✅ | ✅ | ✅ | ⏳ | ⚪ | ✅ | 🟡 SVG | 🟡 | [matching-390.png](./screenshots/matching-390.png) |
| 7 | Campaigns | ✅ | ✅ | ✅ | ✅ | ⏳ | ⚪ | ✅ | 🟡 SVG | 🟡 | [campaigns-390.png](./screenshots/campaigns-390.png) |
| 8 | Command Center | ✅ | ✅ | ✅ | ✅ | ⏳ | ⚪ | ✅ | ✅ | 🟢 | [command-center-390.png](./screenshots/command-center-390.png) |
| 9 | Brand Detail | ✅ | ✅ | ✅ | ✅ | ⏳ | ⚪ | ✅ | ✅ | 🟢 | [brand-detail-390.png](./screenshots/brand-detail-390.png) |
| 10 | Brand List | ✅ | ✅ | ✅ | ✅ | ⏳ | ⚪ | ✅ | 🟡 SVG | 🟡 | [brand-list-390.png](./screenshots/brand-list-390.png) |
| 11 | Shoots List | ✅ | ✅ | ✅ | ✅ | ⏳ | ⚪ | ✅ | ✅ | 🟢 | [shoots-list-390.png](./screenshots/shoots-list-390.png) |

---

## Critical blockers (🔴)

_None at 390px page level._ Horizontal overflow probe returned `scrollWidth === clientWidth === 390` on all 11 screens.

---

## Major issues (🟡)

| ID | Screen(s) | Finding | Evidence | Recommended fix |
|----|-----------|---------|----------|-----------------|
| M-390-01 | Assets, Matching, Campaigns, Brand List | Console: malformed SVG `<path d=…>` (Lucide/icon template bug) | `390-pass-metrics.json` | Fix shared icon SVG in DC components; re-run console gate |
| M-390-02 | Shoot Wizard | Feature card shows **internal H+V scrollbars** at 390px; header text overlap ("Step"/"Welcome") | [shoot-wizard-390.png](./screenshots/shoot-wizard-390.png) | P3 mobile wizard chrome (`checklist.md` §P3) — responsive card height + top bar |

---

## Minor issues (⚪)

| ID | Screen(s) | Finding | Recommended fix |
|----|-----------|---------|-----------------|
| m-390-01 | All shell screens | Many chip/icon controls <44px (filter chips, state switcher, rail icons) | Audit against D-A11Y4 during IPI-253; increase hit slop on primary actions only |
| m-390-02 | Onboarding | 404 resource on load (non-blocking render) | Identify missing asset URL in onboarding DC |
| m-390-03 | EvidenceBlock (5 screens) | Modal/sheet behaviour **not re-tested** at 390px (desktop-only prior pass) | Next sub-pass: open explain modal on Assets + Matching |
| m-390-04 | Selection/drag (Assets) | Bulk bar + drop dock not exercised at 390px | Journey pass: Assets → Campaign selection |

---

## User journeys (390px)

| Journey | Status | Notes |
|---------|:------:|-------|
| Onboarding → Command Center | ⏳ | Terminal CTA wired per checklist — not exercised this pass |
| Brand → Shoot | ⏳ | |
| Shoot → Assets | ⏳ | |
| Assets → Campaign | ⏳ | |
| Campaign → Channel Preview | ⏳ | |
| Matching → Invite | ⏳ | |

---

## Recommended fixes (prototype-only — no redesign)

1. **Fix SVG path errors** in shared DC icons (unblocks console gate on 5 screens).
2. **Shoot Wizard 390px card** — remove nested scroll; single-column stack per `MOBILE-PLAN.md`.
3. **390px sub-pass:** open EvidenceBlock on Assets + Matching; capture `{slug}-390-evidence-block.png`.
4. **Do not fix** touch-target backlog until IPI-253 a11y gate — document waivers in matrix.

---

## Artifacts

| File | Purpose |
|------|---------|
| [`report.md`](./report.md) | This report |
| [`390-pass-metrics.json`](./390-pass-metrics.json) | Automated probe output |
| [`390-pass-results.json`](./390-pass-results.json) | Screenshot manifest |
| [`screenshots/*-390.png`](./screenshots/onboarding-390.png) | Per-screen captures (11 PNGs in `screenshots/`) |
| `run-390-chrome.sh` | Re-run screenshot batch (local script — not in repo) |

---

## Linear / process verification (IPI-264)

| Check | Status |
|-------|:------:|
| Parent epic IPI-254 | ✅ |
| Spec link `MOBILE-VERIFICATION.md` | ✅ |
| Breakpoints 390/430/768/1024 in issue | ✅ |
| `blockedBy` IPI-243 | ✅ correct for **React** re-verify; **waived for DC prototype pass** |
| Related IPI-251 mobile shell | ✅ |
| Related IPI-253 a11y gate | ✅ |
| Related IPI-258 QA epic | ✅ |
| Mirror IPI-266 | ✅ |
| Execution footer v2 | ✅ |

---

## Next steps

1. ☐ Fix M-390-01 SVG errors in DC prototypes (single PR · prototype-only)
2. ☐ Run **430px** pass — duplicate matrix columns
3. ☐ 390px state matrix (empty/loading/error) on priority 4 screens
4. ☐ EvidenceBlock modal sub-pass at 390px
5. ☐ Link this report in IPI-264 + `tasks/todo.md` proof_bundle when 4 breakpoints green
