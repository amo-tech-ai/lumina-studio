---
title: Task Scorecard — Forensic Audit
date: "2026-06-30"
auditor: Cursor forensic pass
scope: DESIGN V2 spine · AI Intelligence crosswalk · P0 blockers
---

# Task Scorecard — 2026-06-30

Grading: **A+** 95–100 🟢 · **A** 90–94 🟢 · **B** 80–89 🟡 · **C** 70–79 🟠 · **D** <70 🔴 · **—** N/A ⚪

## Spine + P0 (17 execution rows)

| Linear | Spec | Status dot | Score | Grade | Prod ready | Succeed as written |
|--------|------|:----------:|------:|:-----:|:----------:|:------------------:|
| [IPI-209](https://linear.app/amo100/issue/IPI-209) | DESIGN-054 | 🟠 | 74 | C | No | Risky |
| [IPI-243](https://linear.app/amo100/issue/IPI-243) | DESIGN-032 | 🟠 | 71 | C | No | Risky |
| [IPI-247](https://linear.app/amo100/issue/IPI-247) | DESIGN-070 | 🟠 | 73 | C | No | Yes |
| [IPI-255](https://linear.app/amo100/issue/IPI-255) | DESIGN-071 | ⚪ | 76 | C | No | Yes |
| [IPI-257](https://linear.app/amo100/issue/IPI-257) | DESIGN-074 | ⚪ | 78 | C | No | Yes |
| [IPI-246](https://linear.app/amo100/issue/IPI-246) | DESIGN-046 | ⚪ | 82 | B | No | Yes |
| [IPI-197](https://linear.app/amo100/issue/IPI-197) | UX contextual | ⚪ | 75 | C | No | Risky |
| [IPI-248](https://linear.app/amo100/issue/IPI-248) | DESIGN-057 | 🟡 | 74 | C | No | Risky |
| [IPI-268](https://linear.app/amo100/issue/IPI-268) | SUPA-DV2-001 | ⚪ | 84 | B | No | Yes |
| [IPI-249](https://linear.app/amo100/issue/IPI-249) | DESIGN-058 | 🟡 | 72 | C | No | No |
| [IPI-250](https://linear.app/amo100/issue/IPI-250) | DESIGN-059 | 🟡 | 72 | C | No | No |
| [IPI-261](https://linear.app/amo100/issue/IPI-261) | DESIGN-077 | ⚪ | 70 | C | No | Risky |
| [IPI-258](https://linear.app/amo100/issue/IPI-258) | DESIGN-080–088 | ⚪ | 80 | B | No | Yes |
| [IPI-264](https://linear.app/amo100/issue/IPI-264) | Mobile matrix | 🟡 | 81 | B | No | Yes |
| [IPI-253](https://linear.app/amo100/issue/IPI-253) | DESIGN-A11Y | ⚪ | 77 | C | No | Yes |
| [IPI-107](https://linear.app/amo100/issue/IPI-107) | AI-018 registry | 🟡 | 83 | B | No | Yes |
| [IPI-47](https://linear.app/amo100/issue/IPI-47) | AI-009 | 🟡 | 86 | B | Partial | Yes |

## Platform foundation (verified shipped)

| Linear | Title | Status dot | Score | Grade | Prod ready | Notes |
|--------|-------|:----------:|------:|:-----:|:----------:|-------|
| IPI-112 | CopilotKit v2 runtime | 🟢 | 92 | A | Yes | Foundation |
| IPI-110 | Operator panel | 🟢 | 90 | A | Partial | ~30% shell gaps |
| IPI-114 | Real auth runtime | 🟢 | 91 | A | Yes | |
| IPI-48 | Mastra runtime | 🟢 | 93 | A | Yes | |
| IPI-129 | Mastra PG storage | 🟢 | 92 | A | Yes | |
| IPI-113 | Tool registry | 🟢 | 88 | B | Yes (shoot) | Done 2026-06-30; brand/asset tools deferred |
| IPI-126 | BI migration | 🟢 | 94 | A | Yes | |
| IPI-228 | Shoot RPCs | 🟢 | 90 | A | Yes | Blocks 209 data layer |

## Agent wiring (DESIGN-075–079)

| Linear | Agent | Status dot | Score | Grade | Blocked by |
|--------|-------|:----------:|------:|:-----:|------------|
| IPI-259 | production-planner | 🟡 | 78 | C | IPI-247 |
| IPI-260 | brand-intelligence | 🟡 | 82 | B | IPI-130 ✅ |
| IPI-261 | creative-director | ⚪ | 70 | C | IPI-247 · naming conflict |
| IPI-262 | visual-identity | ⚪ | 72 | C | IPI-247 |
| IPI-263 | social-discovery | ⚪ | 72 | C | IPI-247 |

## Governance / doc-only

| Artifact | Score | Grade | Issue |
|----------|------:|:-----:|-------|
| MASTER-DEPENDENCIES v1.2 | 88 | B | Batch vs critical-path conflict; IPI-268 register gap |
| tasks/todo.md v2.0 | 82 | B | IPI-209 status contradiction; stale 82/100 note |
| copilotkit-plan.md | 68 | 🔴 | Route map marked 🟢; IPI-247 still open |
| supabase-plan.md | 72 | C | Campaigns schema still 🔴; IPI-268 not linked |
| gemini-plan.md | 86 | B | Accurate partial state |
| mastra-plan.md | 84 | B | Agent table correct; execution order drift |
| DESIGN-TASKS §0 | 88 | B | Prototype strong; a11y/mobile gaps noted |
| docs/linear/IPI-209 md | 70 | C | Status Todo vs Linear In Progress; 7 vs 9 tabs |

## Category averages

| Category | Avg score | Grade |
|----------|----------:|:-----:|
| P0 blockers | 74 | C |
| Design V2 / React parity | 76 | C |
| CopilotKit v2 | 85 | B |
| Mastra | 84 | B |
| Gemini | 85 | B |
| Supabase | 78 | C |
| Cloudinary / media | 76 | C |
| QA / Playwright / Mobile | 80 | B |
| Documentation | 78 | C |

## Aggregate scores (audit rubric)

| Dimension | Score |
|-----------|------:|
| Task accuracy (IDs, deps, owners) | 78 |
| Production readiness | 62 |
| Execution readiness | 71 |
| **Overall audit score** | **76** |
