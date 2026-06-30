---
title: Design Handoff — Implementation Tracker (mirror)
version: "2.0"
lastUpdated: "2026-06-30"
ssot: ./plan/todo.md
mirrorSyncedFrom: plan/todo.md Design track § · 2026-06-30 footer sync
verifiedAgainst: plan/todo.md Design track § · DESIGN-TASKS §0 · app/src · SCREEN-DOD.md
accuracyNote: "Mirror only — update plan/todo.md first. Code ≠ Design."
source_version:
  design_handoff: "Zeely Editorial v3 · handoff 01–12 · 2026-06-30"
  design_tasks: "DESIGN-TASKS §0 · 2026-06-30"
  shared_components: 20
  mirror_verified_by: "manual path check + plan/todo crosswalk"
  verified_at: "2026-06-30"
  proof_bundle: []  # populate per ⭐ row: route · component_path · screenshot · playwright · pr_url · linear_issue
---

# Design Todo — implementation tracker

> **Not the execution master.** Priority + blockers: **`tasks/plan/todo.md`**.  
> **This file:** Code vs Design parity + evidence — not a second SSOT.  
> **Last structural sync:** v1.6 · dual-axis mirror · path spot-check 2026-06-30 (7/7 evidence paths exist).

**Design contract:** `design.md` · **DoD:** `tasks/design-docs/design/SCREEN-DOD.md` · **Checklists:** `tasks/design-docs/handoff/11-screen-checklists.md` · **Execute:** `tasks/design-docs/plan/TASK-EXECUTION-GUIDE.md` · **Contract:** [`TASK-CONTRACT.yaml`](./design-docs/plan/TASK-CONTRACT.yaml) · **Prototype:** `tasks/design-docs/design/DESIGN-TASKS.md` §0 · **Stack:** `tasks/design-docs/STACK-ALIGNMENT.md` · **Agents:** [`AGENT-MAP.md`](./design-docs/plan/AGENT-MAP.md)

> **Axis rule:** **Design** = DC prototype + handoff spec (`design.md`, 01–12). **Code** = `app/` React port + verifier. A screen can be Design 🟢 while Code is ⚪ (Shoot Detail, Assets).
>
> **Routes:** production operator paths use **`/app/*`**. Channel Preview is **`/app/preview`** (not `/app/channel-preview`). Onboarding is **`/app/onboarding`** (not `/onboarding`).
>
> **Components:** **20** shared `.dc.html` components incl. **EvidenceBlock** (`handoff/03`). D-DS5 selection is a host pattern — not a 21st component.

---

## Linear — DESIGN V2 project

**Project:** [DESIGN V2 — Operator React Parity](https://linear.app/amo100/project/design-v2-operator-react-parity-e276f28e26a0/issues) · label **`DESIGNV2`** · target **2026-08-18**

**Dependencies SSOT:** [`intelligence/ai/MASTER-DEPENDENCIES.md`](./intelligence/ai/MASTER-DEPENDENCIES.md) · footer matrix · critical path

**Epic:** [IPI-254 · React Production Parity](https://linear.app/amo100/issue/IPI-254)

**AI Intelligence crosswalk:** [AI INTELLIGENCE project](https://linear.app/amo100/project/ai-intelligence-fe1f696f58be/issues) · synced 2026-06-30 — see § below

| Milestone | Target | Scope |
|-----------|--------|--------|
| [DV2-M1 · Shared Spine](https://linear.app/amo100/project/design-v2-operator-react-parity-e276f28e26a0) | Jul 7 | EvidenceBlock · route map · agent wiring 075–079 |
| [DV2-M2 · Operator Shell](https://linear.app/amo100/project/design-v2-operator-react-parity-e276f28e26a0) | Jul 21 | IntelPanel · HITL · live data · error UX · mobile · a11y |
| [DV2-M3 · Workspace Parity](https://linear.app/amo100/project/design-v2-operator-react-parity-e276f28e26a0) | Aug 4 | Shoot Detail · Assets · Campaigns · Matching · Cloudinary |
| [DV2-M4 · Production Verified](https://linear.app/amo100/project/design-v2-operator-react-parity-e276f28e26a0) | Aug 18 | QA epic · wizard · Command Center · Brand Hub |

| Cycle | Dates | Focus |
|-------|-------|--------|
| **DESIGN-S1** P0 Spine | Jun 30 – Jul 13 | 246 · 247 · 209 · 243 |
| **DESIGN-S2** Shell + HITL | Jul 14 – 27 | 244 · 251 · 253 · 255 · 256 · **264** · 075–076 |
| **DESIGN-S3** Screen Parity | Jul 28 – Aug 10 | 248–250 · 257 · 077–079 |
| **DESIGN-S4** Verified Ship | Aug 11 – 24 | 252 · 258 · **264** · 17 · 23 |

Re-assign: `node scripts/linear-designv2-setup.mjs`

---

## AI Intelligence ↔ Design V2 crosswalk (2026-06-30)

Forensic audit **2026-06-30: 94/100** — Linear spine verified; code execution ~62 until PRs merge.

| Audit gap | Status | Canonical issue | AI Intelligence mirror |
|-----------|--------|-----------------|------------------------|
| EvidenceBlock React port | ✅ mapped | **[IPI-246](https://linear.app/amo100/issue/IPI-246)** DESIGN-046 | ~~IPI-267~~ canceled · duplicateOf IPI-246 |
| Shoot Detail 404 | ✅ exists | **[IPI-209](https://linear.app/amo100/issue/IPI-209)** | IPI-86 Duplicate → IPI-209 |
| Gemini foundation | 🟡 partial | **[IPI-47](https://linear.app/amo100/issue/IPI-47)** AI-009 **In Review** | `supabase/functions/_shared/gemini.ts` shipped; registry/CI gap in IPI-107 |
| Campaigns/matching schema | ✅ created | **[IPI-268](https://linear.app/amo100/issue/IPI-268)** SUPA-DV2-001 | Blocks IPI-249 · IPI-250 |
| Asset upload/bulk/drag | ✅ created | **[IPI-248](https://linear.app/amo100/issue/IPI-248)** DESIGN-057 umbrella | [IPI-265](https://linear.app/amo100/issue/IPI-265) ASSET-UX-001 workflow slice |
| Contextual Copilot | ✅ updated | **[IPI-243](https://linear.app/amo100/issue/IPI-243)** + [IPI-247](https://linear.app/amo100/issue/IPI-247) | [IPI-197](https://linear.app/amo100/issue/IPI-197) all screens · design ✅ code 🔴 |
| Wizard 6 vs 10 steps | ✅ noted | **[IPI-252](https://linear.app/amo100/issue/IPI-252)** decision | [IPI-87](https://linear.app/amo100/issue/IPI-87) 6-step prod · comment + IPI-252 link |
| Mobile modals/selection | ✅ mapped | **[IPI-264](https://linear.app/amo100/issue/IPI-264)** pass/fail matrix | ~~IPI-266~~ canceled · duplicateOf IPI-264 |
| Analytics chart standards | 🟡 design done | defer code | Wait for IPI-47 + foundation; chart spec in design docs only |

**Recommended execution order (both projects):**

Canonical spine + batches — full matrix in [`MASTER-DEPENDENCIES.md`](./intelligence/ai/MASTER-DEPENDENCIES.md).

```text
Critical path:
IPI-47 → IPI-246 → IPI-243 ∥ IPI-247 → IPI-255 ∥ IPI-257 → IPI-248 → IPI-268 → IPI-249 → IPI-250

Batch 1 — Core blockers (do first — **246+247 before 243**):
  1. IPI-246  EvidenceBlock (critical path first)
  2. IPI-247  Route-agent map (quick win)
  3. IPI-243  IntelligencePanel shell
  4. IPI-209  Shoot Detail workspace (parallel shell — 246 gates Assets tab only)
  5. IPI-255  Live intelligence data  ∥
  6. IPI-257  Cloudinary pipeline      (255 and 257 parallel)

Batch 2 — AI & Design:
  7. IPI-197  Contextual Copilot (all routes)
  8. IPI-248  Assets workspace
  9. IPI-268  Campaigns + matching schema
 10. IPI-249  Campaigns workspace
 11. IPI-250  Matching workspace
 12. IPI-261  Creative-director agent wiring (/app/assets) · IPI-156 → `/app/campaigns`
 13. IPI-269  Channel Preview DV2 refresh (/app/preview)

Batch 3 — QA & Platform:
 14. IPI-258  Playwright / production QA epic
 15. IPI-264  Mobile verification matrix
 16. IPI-253  Accessibility gate ≥85
 17. IPI-107  Gemini model registry + CI
 18. IPI-47   Gemini foundation (In Review · IPI-107 closes AC)
```

**Parallel (not blocking Batch 1):** IPI-209 page shell (246 only gates Assets-tab EvidenceBlock) · IPI-259–263 agent wiring · IPI-244 HITL · IPI-251 mobile shell · IPI-252 wizard parity

**Red flags still open:** 74/91 unassigned · breached due dates · duplicate/canceled issues (IPI-53, IPI-86) — triage separately.

---

## Status legend (two axes)

Use **Code** and **Design** columns independently.

| | ⚪ Planned | 🔵 Scaffolded | 🟡 Functional | 🟢 Complete / parity | ⭐ Production verified |
|---|:---:|:---:|:---:|:---:|:---:|
| **Code** | not in app | placeholder/route | works · partial data | feature-complete | browser + Playwright + PR |
| **Design** | spec only | wireframe/DC draft | partial DC match | matches design.md + handoff | visual diff approved |

🔴 blocked · 🔒 gated — override either axis.

**Verification order:** implement → build → **browser (manual)** → **design review** → Playwright → task-verifier → merge → ⭐

**Not production-ready until:** a11y ≥80 (currently **68** in DESIGN-TASKS §0) · **[IPI-264](https://linear.app/amo100/issue/IPI-264) mobile pass/fail matrix** complete · ⭐ proof_bundle filled.

---

## Code execution spine (canonical — matches MASTER-DEPENDENCIES)

> **Override rule:** Batch table below is the execution queue. Stage tables track Design vs Code parity only.

| # | Batch | Linear | Spec | Depends | Code | Next action |
|---|-------|--------|------|---------|:----:|-------------|
| 1 | **1** | [IPI-246](https://linear.app/amo100/issue/IPI-246) | DESIGN-046 | IPI-47 partial | ⚪ | `evidence-block.tsx` |
| 2 | **1** | [IPI-247](https://linear.app/amo100/issue/IPI-247) | DESIGN-070 | IPI-51 ✅ | 🟡 | Fix `route-agent-map.ts` |
| 3 | **1** | [IPI-243](https://linear.app/amo100/issue/IPI-243) | DESIGN-032 | IPI-242 ✅ · IPI-255 live (phase B) | 🔵 | IntelligencePanel in `.chatPanel` |
| 4 | **1** | [IPI-209](https://linear.app/amo100/issue/IPI-209) | DESIGN-054 | Shoot RPCs ✅ · 246 for Assets-tab explain | 🔵 | `app/shoots/[id]/page.tsx` · 9 tabs |
| 5 | **1** | [IPI-255](https://linear.app/amo100/issue/IPI-255) | DESIGN-071 | IPI-243, IPI-247 | ⚪ | Live panel APIs + SWR |
| 6 | **1** | [IPI-257](https://linear.app/amo100/issue/IPI-257) | DESIGN-074 | — (parallel w/ IPI-255) | ⚪ | Cloudinary 074a–f |
| 7 | **2** | [IPI-197](https://linear.app/amo100/issue/IPI-197) | UX contextual | IPI-243, IPI-247 | ⚪ | Per-route greetings |
| 8 | **2** | [IPI-248](https://linear.app/amo100/issue/IPI-248) | DESIGN-057 | IPI-246, IPI-247 · IPI-257 soft (upload) | 🔵 | Assets workspace |
| 9 | **2** | [IPI-268](https://linear.app/amo100/issue/IPI-268) | SUPA-DV2-001 | — (soft: IPI-248 context) | ⚪ | campaigns + matching migration |
| 10 | **2** | [IPI-249](https://linear.app/amo100/issue/IPI-249) | DESIGN-058 | IPI-268, IPI-246, IPI-247 | 🔵 | Campaigns workspace |
| 11 | **2** | [IPI-250](https://linear.app/amo100/issue/IPI-250) | DESIGN-059 | IPI-268, IPI-246, IPI-247 | 🔵 | Matching workspace |
| 12 | **2** | [IPI-261](https://linear.app/amo100/issue/IPI-261) | DESIGN-077 | IPI-247 · IPI-248/IPI-246 soft | ⚪ | creative-director on `/app/assets` · [IPI-156](https://linear.app/amo100/issue/IPI-156) → `/app/campaigns` |
| 13 | **2** | [IPI-269](https://linear.app/amo100/issue/IPI-269) | DESIGN-060 | IPI-246, IPI-247 | ⚪ | Channel Preview DV2 · `/app/preview` |
| 14 | **3** | [IPI-258](https://linear.app/amo100/issue/IPI-258) | DESIGN-080–088 | Core screens | ⚪ | Playwright + evidence epic |
| 15 | **3** | [IPI-264](https://linear.app/amo100/issue/IPI-264) | Mobile matrix | — (soft: IPI-243) | 🔵 | **390px DC pass** — [`mobile-verification report`](../docs/ecommerce/evidence/2026-06-30/mobile-verification/report.md) |
| 16 | **3** | [IPI-253](https://linear.app/amo100/issue/IPI-253) | DESIGN-A11Y | — | ⚪ | axe CI · score ≥85 |
| 17 | **3** | [IPI-107](https://linear.app/amo100/issue/IPI-107) | AI-018 registry | IPI-47 partial | 🟡 | CI model allowlist |
| 18 | **3** | [IPI-47](https://linear.app/amo100/issue/IPI-47) | AI-009 | — | 🟡 | In Review · edge + Mastra shipped |

**Execution footers:** standardized on all rows above — see [`LINEAR-ISSUE-FOOTER.md`](./intelligence/ai/LINEAR-ISSUE-FOOTER.md) · completion matrix in [`MASTER-DEPENDENCIES.md`](./intelligence/ai/MASTER-DEPENDENCIES.md).

---

## P0 blockers (execution — see master for priority)

| Blocker | Code | Design | Linear | Depends | Next action |
|---------|:----:|:------:|--------|---------|-------------|
| **IPI-209** Shoot Detail 404 | 🔵 | 🟢 | [IPI-209](https://linear.app/amo100/issue/IPI-209) | RPCs ✅ · 246 for Assets-tab explain | Merge `app/shoots/[id]/page.tsx` · 9 tabs |
| **DESIGN-046** EvidenceBlock | ⚪ | 🟢 | [IPI-246](https://linear.app/amo100/issue/IPI-246) | 040 | `evidence-block.tsx` · wire 5 screens |
| **DESIGN-070** route-agent gaps | 🟡 | 🟡 | [IPI-247](https://linear.app/amo100/issue/IPI-247) | — | Patch `route-agent-map.ts` per AGENT-MAP |
| **DESIGN-032** IntelligencePanel | 🔵 | 🟢 | [IPI-243](https://linear.app/amo100/issue/IPI-243) | 030, 040 | Port DC panel onto CK shell |
| **A11y gate** | ⚪ | 🟡 | [IPI-253](https://linear.app/amo100/issue/IPI-253) | — | Live regions + modal keyboard before ⭐ |

---

## Stage 0 — Prototype + governance

| ID | Item | Code | Design |
|----|------|:----:|:------:|
| — | 11 DC prototypes + handoff 01–12 | 🟢 | 🟢 |
| DESIGN-090 | `design.md` | 🟢 | 🟢 |
| DESIGN-004 | claude-design-handoff skill v3 | 🟢 | 🟢 |
| DESIGN-001 | DC todo SSOT header | 🟢 | 🟢 |
| DESIGN-005 | plan + handoff + design.md sync | 🟡 | 🟡 |
| DESIGN-002 | PLAN.md component tracker | ⚪ | ⚪ |
| DESIGN-003 | dedupe onboarding prompt | ⚪ | ⚪ |

---

## Stage 1 — Tokens + shell

| ID | Task | Evidence (code) | Code | Design |
|----|------|-----------------|:----:|:------:|
| DESIGN-010 | tokens.css v3 | `app/src/styles/tokens.css` ✓ | 🟡 | 🟡 |
| DESIGN-030 | OperatorShell | `operator-panel/operator-panel.tsx` ✓ | 🟡 | 🟢 |
| DESIGN-031 | NavSidebar | `nav-sidebar.tsx` ✓ | 🟡 | 🟢 |
| DESIGN-032 | IntelligencePanel | CopilotSidebar — no `intelligence-panel.tsx` | 🔵 | 🟢 |
| DESIGN-033 | PersistentChatDock | CopilotSidebar partial | 🟡 | 🟢 |
| DESIGN-045 | Mobile shell | tab bar / sheet not first-class in app | ⚪ | 🟡 |

---

## Stage 2 — Components

> **Code priority:** DESIGN-046 before 043/044 screen parity (explainability spine).

| ID | Component | Evidence (code) | Code | Design |
|----|-----------|-----------------|:----:|:------:|
| **DESIGN-046** | **EvidenceBlock** | **not in app** — DC ✓ 5 screens | ⚪ | 🟢 |
| DESIGN-040 | ApprovalCard | `brand-hub/approval-card.tsx` ✓ | 🟡 | 🟡 |
| DESIGN-041 | BrandCard | partial in brand hub | 🟡 | 🟡 |
| DESIGN-042 | ShootCard | `shoot/ShootCard.tsx` ✓ | 🟡 | 🟡 |
| DESIGN-043 | CampaignCard | — | ⚪ | 🟢 |
| DESIGN-044 | AssetCard | — | ⚪ | 🟢 |

---

## Stage 1b — Maps

| ID | Artifact | Code | Design |
|----|----------|:----:|:------:|
| DESIGN-016 | API-MAP stub | 🟢 | 🟢 |
| DESIGN-017 | AGENT-MAP stub | 🟢 | 🟡 |
| DESIGN-018 | MEDIA-MAP stub | 🟢 | 🟢 |

---

## Stage 3 — MVP screens

| ID | Screen | Route | Code | Design | Verify |
|----|--------|-------|:----:|:------:|--------|
| DESIGN-050 | Command Center | `/app` | 🟡 | 🟢 | [IPI-17](https://linear.app/amo100/issue/IPI-17) · placeholder KPIs |
| DESIGN-052 | Brand List | `/app/brand` | 🟡 | 🟢 | page ✓ · [IPI-23](https://linear.app/amo100/issue/IPI-23) epic |
| DESIGN-051 | Brand Detail | `/app/brand/[id]` | 🟡 | 🟢 | partial · IPI-23 epic |
| DESIGN-053 | Onboarding | `/app/onboarding` ✓ | 🟡 | 🟢 | IPI-46 shipped |

---

## Stage 4 — Core screens

| ID | Screen | Route | Code | Design | Verify |
|----|--------|-------|:----:|:------:|--------|
| DESIGN-055 | Shoots List | `/app/shoots` | 🟡 | 🟢 | list ✓ · PW ○ |
| DESIGN-056 | Shoot Wizard | `/app/shoots/new` | 🟡 | 🟡 | prod 6-step · DC 10-step |
| DESIGN-056b | Wizard parity | WIZARD-PARITY (`tasks/shoot/WIZARD-PARITY.md`) | ⚪ | ⚪ | track separately |
| DESIGN-054 | Shoot Detail | `/app/shoots/[id]` | ⚪ | 🟢 | **404** · [IPI-209](https://linear.app/amo100/issue/IPI-209) |
| DESIGN-057 | Assets | `/app/assets` | 🔵 | 🟢 | [IPI-248](https://linear.app/amo100/issue/IPI-248) · SectionPlaceholder |

---

## Stage 5 — Growth screens

| ID | Screen | Route | Code | Design | Verify |
|----|--------|-------|:----:|:------:|--------|
| DESIGN-058 | Campaigns | `/app/campaigns` | 🔵 | 🟢 | [IPI-249](https://linear.app/amo100/issue/IPI-249) |
| DESIGN-059 | Matching | `/app/matching` | 🔵 | 🟢 | [IPI-250](https://linear.app/amo100/issue/IPI-250) |
| DESIGN-060 | Channel Preview | `/app/preview` ✓ | 🟡 | 🟡 | IPI-188 partial · **no DV2 refresh issue** |

---

## Stage 6 — AI + media

| ID | Task | Linear | Code | Design |
|----|------|--------|:----:|:------:|
| DESIGN-070 | Route-agent map | [IPI-247](https://linear.app/amo100/issue/IPI-247) | 🟡 | 🟡 |
| DESIGN-071 | Live intel data | [IPI-255](https://linear.app/amo100/issue/IPI-255) | ⚪ | ⚪ |
| DESIGN-072 | HITL persist | [IPI-244](https://linear.app/amo100/issue/IPI-244) | 🟡 | 🟡 |
| DESIGN-073 | BI error UX | [IPI-256](https://linear.app/amo100/issue/IPI-256) | ⚪ | ⚪ |
| DESIGN-074 | Cloudinary pipeline | [IPI-257](https://linear.app/amo100/issue/IPI-257) | ⚪ | ⚪ |
| DESIGN-075 | production-planner wiring | [IPI-259](https://linear.app/amo100/issue/IPI-259) | 🟡 | 🟡 |
| DESIGN-076 | brand-intelligence wiring | [IPI-260](https://linear.app/amo100/issue/IPI-260) | 🟡 | 🟡 |
| DESIGN-077 | creative-director wiring | [IPI-261](https://linear.app/amo100/issue/IPI-261) | ⚪ | ⚪ |
| DESIGN-078 | visual-identity wiring | [IPI-262](https://linear.app/amo100/issue/IPI-262) | ⚪ | ⚪ |
| DESIGN-079 | social-discovery wiring | [IPI-263](https://linear.app/amo100/issue/IPI-263) | ⚪ | ⚪ |

---

## Stage 7 — QA + ship

| ID | Task | Linear | Code | Design |
|----|------|--------|:----:|:------:|
| DESIGN-080–088 | QA epic (evidence · PW · visual · perf) | [IPI-258](https://linear.app/amo100/issue/IPI-258) | ⚪ | ⚪ |
| DESIGN-A11Y | Accessibility gate ≥85 | [IPI-253](https://linear.app/amo100/issue/IPI-253) | ⚪ | ⚪ |
| Mobile verification | Pass/fail matrix · 390/430/768/1024 · journeys · states | [IPI-264](https://linear.app/amo100/issue/IPI-264) | 🟡 | 🟡 | **390px started** · 0 🔴 overflow · report in evidence |

---

## Progress summary (Code / Design)

| Stage | Code ⭐+🟢 | Code 🟡+🔵 | Design 🟢+⭐ | Design 🟡+🔵 | Blocker |
|-------|----------:|-----------:|-------------:|-------------:|---------|
| 0 Governance | 4 | 1 | 4 | 1 | — |
| 1 Shell | 0 | 5 | 4 | 2 | DESIGN-032 Code |
| 2 Components | 0 | 3 | 3 | 3 | **046 Code ⚪** |
| 1b Maps | 3 | 0 | 2 | 1 | — |
| 3 MVP screens | 0 | 4 | 4 | 0 | — |
| 4 Core | 0 | 3 | 3 | 1 | **054 Code ⚪** |
| 5 Growth | 0 | 3 | 2 | 1 | — |
| 6 AI | 0 | 3 | 0 | 3 | 070 · 071 |
| 7 QA | 0 | 0 | 0 | 0 | a11y 68 (D-A11Y) |

**⭐ Production verified today:** none — populate `proof_bundle` in frontmatter when first screen ships.

**Claude Design (D-*):** `tasks/design-docs/design/DESIGN-TASKS.md` §0 — prototype ~70% · readiness 82/100 · AI UX 84 · **a11y 68** · mobile 78. Does not auto-update Code/Design here.

---

## Known gaps

| Gap | Code | Design | Track |
|-----|------|--------|-------|
| Shoot Detail 404 | ⚪ | 🟢 DC 9 tabs | **IPI-209** · DESIGN-054 |
| Legacy 7-tab plans | — | — | `tasks/intelligence/dashboards/` **stale** → handoff 02 §5 |
| EvidenceBlock missing | ⚪ | 🟢 DC 5 screens | **[IPI-246](https://linear.app/amo100/issue/IPI-246)** · DESIGN-046 |
| Route-agent map | 🔴 assets/matching/preview | handoff spec | **[IPI-247](https://linear.app/amo100/issue/IPI-247)** · DESIGN-070 |
| IntelligencePanel | 🔵 CopilotSidebar | 🟢 DC spec | **[IPI-243](https://linear.app/amo100/issue/IPI-243)** · DESIGN-032 |
| Live intel data | ⚪ | ⚪ | **[IPI-255](https://linear.app/amo100/issue/IPI-255)** · DESIGN-071 |
| Cloudinary pipeline | ⚪ | ⚪ | **[IPI-257](https://linear.app/amo100/issue/IPI-257)** · DESIGN-074 |
| Agent wiring 075–079 | 🟡 partial | handoff | **IPI-259–263** under [IPI-254](https://linear.app/amo100/issue/IPI-254) |
| Production QA | ⚪ | ⚪ | **[IPI-258](https://linear.app/amo100/issue/IPI-258)** · 080–088 |
| Wizard steps | 🟡 6-step prod | 🟡 10-step DC | **DESIGN-056b** · WIZARD-PARITY |
| Campaigns/Matching DB | 🔵 placeholders | 🟢 DC | **[IPI-268](https://linear.app/amo100/issue/IPI-268)** · blocks 249/250 |
| Mobile modals + selection | — | 🟡 partial | **[IPI-264](https://linear.app/amo100/issue/IPI-264)** · [`MOBILE-VERIFICATION.md`](./design-docs/design/MOBILE-VERIFICATION.md) |
| Duplicate prompt `09` | — | — | `app/design/prompts/09-onboarding.md` · DESIGN-003 |

### Still no dedicated Linear issue (tracker-only)

| ID | Why |
|----|-----|
| DESIGN-043/044 | Component ports — folded into screen issues (248/209) unless split needed |
| DESIGN-060 refresh | [IPI-269](https://linear.app/amo100/issue/IPI-269) | IPI-188 partial baseline |
| DESIGN-002–005 | Governance/docs — not React implementation |
| DESIGN-K/L | Gated — post-MVP |
*Mirror of `tasks/plan/todo.md` Design track §. Update master first, then bump `mirrorSyncedFrom` + `verified_at` here.*

**Audit:** [`audit/02-tasks-audit.md`](./audit/02-tasks-audit.md) · [`audit/full-task-audit-2026-06-30.md`](./audit/full-task-audit-2026-06-30.md) · [`audit/task-corrections-2026-06-30.md`](./audit/task-corrections-2026-06-30.md)
