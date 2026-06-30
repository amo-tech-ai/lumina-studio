# Forensic Task Audit — 2026-06-30

**Scope:** DESIGN V2 spine (17 rows) · AI Intelligence crosswalk · platform foundation · critical checks from audit prompt.  
**Sources:** `tasks/todo.md` · `MASTER-DEPENDENCIES.md` · stack plans · DESIGN-TASKS §0 · Linear MCP (read-only) · `app/` code probes.  
**Status:** **Pre-sync snapshot** — Linear pass 1+2 applied 2026-06-30. **Current SSOT:** [`task-corrections-2026-06-30.md`](./task-corrections-2026-06-30.md) · [`MASTER-DEPENDENCIES.md`](../intelligence/ai/MASTER-DEPENDENCIES.md) v1.6.

> ⚠️ Sections below reflect **pre-sync findings**. Do not treat stale scores or “recommend only” Linear items as current. See **Post-sync addendum** at end.

---

## Post-sync addendum — remaining Linear work

Verified against live Linear 2026-06-30 after pass 1+2. Overall governance **94/100**; code **62/100**.

### Already fixed in Linear ✅ (was flagged in this doc)

| Finding in this audit | Current Linear |
|----------------------|----------------|
| Batch 1: 243 before 246 | Order + deps aligned · IPI-243 no `blockedBy` IPI-246 |
| IPI-209 five hard blockers | `blockedBy` empty · IPI-246 soft `relatedTo` |
| IPI-261 wrong agent (visual-identity / campaigns) | **IPI-261 · DESIGN-077** → `/app/assets` · `creative-director` · **IPI-156 · CAMP-001** → `/app/campaigns` |
| IPI-247 targets wrong (said visual-identity on assets) | AGENT-MAP: assets=`creative-director`, preview=`visual-identity` |
| Missing IPI-269 Channel Preview | **IPI-269 · DESIGN-060** created · Todo · deps wired |
| IPI-267/266 duplicate mirrors | Duplicate status · duplicateOf IPI-246 / IPI-264 |
| Spine unassigned | Batch 1–3 core → S K |
| IPI-248 ↔ IPI-257 over-block | IPI-257 soft · `relatedTo` only |
| IPI-257 ↔ IPI-255 over-block | Parallel · no `blockedBy` |

### Still needs Linear attention

~~All pass 3 items applied 2026-06-30.~~ See changelog in [`task-corrections-2026-06-30.md`](./task-corrections-2026-06-30.md).

**Optional remaining:** IPI-270 · IPI-271 create · IPI-247 → In Review when code PR merges.

### Code blockers unchanged (not Linear)

IPI-247 route map · IPI-246 EvidenceBlock · IPI-209 merge · IPI-268 migration PR.

---

## Executive summary

The **documentation and dependency graph improved significantly** on 2026-06-30 (footers, IPI-268, `blockedBy` spine, mobile 390px evidence). Governance docs score ~88/100. **Execution readiness is lower (~71/100)** because:

1. **Batch order conflicts with critical path** — Batch 1 lists IPI-243 before IPI-246, but Linear blocks 243 on 246.
2. **Code lag on main** — Shoot Detail 404, no EvidenceBlock, no IntelligencePanel component, route-agent map wrong on 3 routes.
3. **Stale plan docs** — `copilotkit-plan.md` marks route map 🟢 while IPI-247 open; `supabase-plan.md` omits IPI-268.
4. **Agent naming drift** — IPI-261 assigned to assets in todo row 12; AGENT-MAP assigns visual-identity to assets.
5. **IPI-209 over-blocked in Linear** — five `blockedBy` relations; RPCs already shipped.
6. **Zero ⭐ production-verified screens** — `proof_bundle` empty; a11y 68/100 blocks ship gate.

**Verdict:** Plan can succeed **if corrections are applied** before Batch 1 coding. Without reordering and IPI-247 fix, teams will stall on IPI-243 or ship wrong agents on Assets/Matching.

---

## Overall scores

| Dimension | Score |
|-----------|------:|
| Task accuracy | 78/100 |
| Production readiness | 62/100 |
| Execution readiness | 71/100 |
| **Overall audit score** | **76/100** |

**Can the plan succeed?** Yes, if corrections are applied.

---

## P0 blockers

| Blocker | Severity | Root cause |
|---------|----------|------------|
| Execution order Batch 1 vs critical path | 🔴 | 243 before 246 in todo Batch 1 |
| IPI-247 route-agent gaps | 🔴 | Code wrong; plan doc stale |
| IPI-246 EvidenceBlock missing | 🔴 | Blocks explainability on 5 screens |
| IPI-209 404 on main | 🟠 | In Progress but not merged |
| IPI-268 schema not merged | 🟠 | Blocks 249/250 |
| IPI-257 Cloudinary not started | 🟠 | Blocks asset upload |
| a11y 68 + empty proof_bundle | 🟠 | No ⭐ ship path |
| 74/91 Linear unassigned | 🟡 | Ownership risk |

---

## Red flags

- **Stale statuses:** IPI-209 issue md Todo vs Linear In Progress; copilotkit-plan route map 🟢
- **Duplicate work:** IPI-267/266 mirrors; duplicate DB rows in todo
- **Wrong ownership:** IPI-261 → assets in todo; should be campaigns
- **Missing blockedBy in register:** IPI-268 shows `—` in MASTER register; Linear has IPI-248
- **Mixed concerns risk:** IPI-243 + IPI-255 + IPI-244 could bundle shell + APIs + HITL
- **Tasks that will fail as written:** IPI-249, IPI-250 without IPI-268; IPI-243 starting in Batch 1 before 246
- **Done but not fully verified:** IPI-51 route map (gaps in IPI-247); IPI-110 operator shell (~30% gaps per prior audit)
- **In Progress but no main code:** IPI-243, IPI-209 (worktree only)

---

## Missing tasks

See corrections doc: Channel Preview DV2 refresh, route-agent CI gate, EvidenceBlock Playwright spec, STR-001 Stripe schema.

---

## Duplicate tasks

| Canonical | Duplicate / mirror |
|-----------|-------------------|
| IPI-246 | IPI-267, IPI-53 (canceled) |
| IPI-209 | IPI-86 |
| IPI-264 | IPI-266 |
| IPI-248 | IPI-265 (workflow slice) |

---

## Stale statuses

| Location | Says | Reality |
|----------|------|---------|
| tasks/todo P0 IPI-209 | Code ⚪ | Linear In Progress; wt-ipi-209 exists |
| tasks/todo crosswalk | Audit 82/100 resolved | Forensic 76/100 — governance ≠ execution |
| copilotkit-plan | Route map 🟢 | 3 wrong agent IDs |
| supabase-plan | Campaigns 🔴 missing | IPI-268 created, not in plan |
| MASTER-DEPENDENCIES audit_score | 98/100 | Overstates; batch conflict |

---

## Tasks likely to fail

1. **IPI-249 / IPI-250** — no DB schema on main
2. **IPI-243 in Batch 1 slot 2** — blocked by IPI-246 in Linear
3. **IPI-248 full upload UX** — before IPI-257 074a
4. **IPI-261 as written on assets** — wrong agent vs registry
5. **⭐ any screen** — before IPI-253 + IPI-264 complete

---

## Production-readiness gaps

| Area | Can ship? | Blocks | Proof required |
|------|:---------:|--------|----------------|
| Shoot Detail | No | 404; no PR on main | Browser + PW + evidence |
| Assets | No | Cloudinary; EvidenceBlock | Upload journey + RLS verify |
| Campaigns/Matching | No | IPI-268 | Migration + verify-rls |
| Intel panel | No | No component; mock data | IPI-255 APIs |
| Mobile | No | 390px 🟡 only | 430/768/1024 + state matrix |
| Gemini | Partial | IPI-107 CI | No client keys ✅ |

---

## Recommended execution order

See [`task-corrections-2026-06-30.md`](./task-corrections-2026-06-30.md) Phase 0→3.

---

## Required Linear updates (recommend only)

1. IPI-209: trim blockedBy
2. IPI-261/262/263: route assignment titles
3. IPI-51 comment: partial → IPI-247
4. Assign owners on spine issues
5. IPI-47 → Done when IPI-107 merges

---

## Required docs updates

Applied/recommended in corrections doc: todo batch order, MASTER IPI-268 register, copilotkit-plan, supabase-plan, IPI-209 issue md.

---

# Audit by category

---

## 1. P0 blockers

### IPI-209 · DESIGN-054 — Shoot Detail Workspace

Status: 🟠  
Score: 74/100  
Production ready: No  
Will succeed as written: Risky

**Issues:**
- Main branch: no `app/shoots/[id]/page.tsx` — **404 confirmed**
- Work exists in `wt-ipi-209/` — not merged
- Linear `blockedBy` 5 issues — over-blocked (RPCs Done)
- Spec md: 7 sections vs Linear/handoff **9 tabs**
- P0 table Code ⚪ contradicts spine 🔵 In Progress
- Linear blocks IPI-248 oddly (detail should unblock assets, not reverse)

**Corrections:**
- Merge shell PR without Assets-tab EvidenceBlock
- Align issue md to 9 tabs, In Progress
- Soft-gate IPI-246 for Assets tab only

**Required before starting:** Shoot RPCs ✅ · OperatorShell 🟡  
**Verification:** Browser · Playwright shoot journey · Supabase verify · Console clean

---

### IPI-246 · DESIGN-046 — EvidenceBlock

Status: ⚪  
Score: 82/100  
Production ready: No  
Will succeed as written: Yes

**Issues:**
- No `app/src/components/evidence-block/` on main
- DC prototype ✅ on 5 screens
- Depends IPI-47 partial — mock structured payload acceptable with waiver

**Corrections:**
- First React port PR: component only + Storybook/browser test
- Wire screens in follow-on PRs (one screen per PR or grouped by route)

**Verification:** Visual QA vs DC · Task Verifier · component test · HITL approve flow

---

### IPI-243 · DESIGN-032 — IntelligencePanel

Status: 🟠  
Score: 71/100  
Production ready: No  
Will succeed as written: Risky

**Issues:**
- Only `--intelligence-panel-width` token — no React component
- Batch 1 slot 2 but **blockedBy IPI-246** in Linear
- CopilotSidebar exists (IPI-110) — panel chrome ≠ IntelligencePanel spec

**Corrections:**
- Split shell (layout/tabs) from live data (IPI-255)
- Start shell after 246 OR waive 246 for chrome-only PR

**Verification:** Browser panel layout · Visual QA vs DC · Mobile sheet (IPI-264)

---

### IPI-247 · DESIGN-070 — Route-Agent Map

Status: 🟠  
Score: 73/100  
Production ready: No  
Will succeed as written: Yes

**Issues:**
- `/app/assets` → `production-planner` (should `visual-identity`)
- `/app/matching` → `production-planner` (should `social-discovery`)
- `/app/onboarding` → `production-planner` (should `brand-intelligence`)
- IPI-51 marked Done — regression tracked here
- copilotkit-plan falsely 🟢

**Corrections:** 3-line map fix + unit test — **smallest high-leverage PR**

**Verification:** Unit test · Browser per-route agent greeting · Task Verifier

---

## 2. Design V2 / React parity

### IPI-248 · DESIGN-057 — Assets

Status: 🟡  
Score: 74/100  
Production ready: No  
Will succeed as written: Risky

**Issues:** SectionPlaceholder on route; needs 246+247+257; IPI-265 workflow slice overlaps

**Verification:** Browser masonry · Cloudinary upload · Playwright · Supabase RLS

---

### IPI-249 · DESIGN-058 — Campaigns

Status: 🟡  
Score: 72/100  
Production ready: No  
Will succeed as written: **No** (without IPI-268)

---

### IPI-250 · DESIGN-059 — Matching

Status: 🟡  
Score: 72/100  
Production ready: No  
Will succeed as written: **No** (without IPI-268)

---

## 3. CopilotKit v2

Foundation **IPI-112/114 Done** — score 85/100 category.

**IPI-197** contextual sidebar: 75/100 — design ✅ code 🔴 — blocked 243+247.

**IPI-244** HITL: separate PR from 243 — don't mix.

**IPI-127** license: In Progress — prod smoke blocker.

---

## 4. Mastra

**IPI-113 Done** — 10 shoot tools shipped ✅  
**IPI-247** gates IPI-259–263  
**IPI-261 naming conflict** — see corrections

---

## 5. Gemini

### IPI-47 · AI-009

Status: 🟡  
Score: 86/100  
Production ready: Partial  
Will succeed: Yes

Edge + Mastra shipped; close with IPI-107.

### IPI-107 · Registry CI

Status: 🟡  
Score: 83/100  
Production ready: No  
Will succeed: Yes

---

## 6. Supabase

### IPI-268 · SUPA-DV2-001

Status: ⚪  
Score: 84/100  
Production ready: No  
Will succeed: Yes

**Issues:** Register blockedBy `—` vs Linear IPI-248; supabase-plan stale

**Verification:** supabase:verify · verify-rls · migration reviewer · types regen

### IPI-255 · Live intelligence data

Score: 76/100 — blocked 243+247 — define API contracts first

---

## 7. Cloudinary / media

### IPI-257 · DESIGN-074

Score: 78/100 — 074a–f epic; migration PR separate from upload API

---

## 8. AI Intelligence

Crosswalk in todo largely ✅ mapped. **IPI-152** DNA explain → IPI-246.

---

## 9–12. Assets / Campaigns / Matching / Shoot

Covered above. **Shoot Wizard IPI-252** — 6 vs 10 step decision deferred — not blocking Detail shell.

---

## 13. Mobile QA

### IPI-264

Status: 🟡  
Score: 81/100  
Production ready: No  
Will succeed: Yes

**Evidence:** [`docs/ecommerce/evidence/2026-06-30/mobile-verification/report.md`](../../docs/ecommerce/evidence/2026-06-30/mobile-verification/report.md)

390px: 0 overflow 🔴; SVG console errors 🟡; Shoot Wizard header overlap 🟡

**Verification:** 430/768/1024 · state matrix · EvidenceBlock modal at 390px

---

## 14. Accessibility

### IPI-253

Score: 77/100 — baseline 68; gate ≥85 for ⭐

**Verification:** axe CI · keyboard modal audit · live regions

---

## 15. Playwright / QA

### IPI-258

Score: 80/100 — start after core screens 🟡 minimum

---

## 16. Documentation-only

DESIGN-016/017/018 stubs ✅ — no blockers. DESIGN-002/003/005 tracker debt — low priority.

---

# Critical checks summary

| Check | Result |
|-------|--------|
| IPI-209 Shoot Detail | 🔴 404 main · In Progress · over-blocked |
| IPI-246 EvidenceBlock | 🔴 not in app |
| IPI-243 IntelligencePanel | 🔴 not in app · order conflict |
| IPI-247 Route map | 🔴 3 wrong agents |
| IPI-255 Live data | ⚪ not started |
| IPI-257 Cloudinary | ⚪ not started |
| IPI-248 Assets | 🟡 placeholder |
| IPI-249/250 | 🟡 blocked by 268 |
| IPI-264 Mobile | 🟡 390px started |
| IPI-47 Gemini | 🟡 In Review partial |
| IPI-107 registry | 🟡 In Review |
| IPI-268 schema | ⚪ created not merged |
| Done but unverified | IPI-51 partial |
| In Progress no main code | IPI-243, IPI-209 |

---

# Best-practice review

| Check | Status |
|-------|--------|
| Reuse shared components | 🟡 EvidenceBlock not ported — risk of forks |
| No duplicate components | 🟢 DC canonical |
| One concern per PR | 🟡 enforce on 257, 243/255 split |
| No client AI keys | 🟢 verified |
| Supabase RLS | 🟢 platform; 🔴 IPI-268 pending |
| Route-agent correctness | 🔴 IPI-247 |
| HITL before AI writes | 🟡 design ✅ · IPI-244 Todo |
| Mobile a11y | 🟡 78 mobile · 68 a11y |
| Playwright proof | 🔴 none ⭐ |
| Design parity | 🟢 prototypes · 🔴 React |
| Task verifier evidence | 🔴 proof_bundle empty |

---

# Final scorecard

See [`task-scorecard-2026-06-30.md`](./task-scorecard-2026-06-30.md).

---

```text
Overall audit score: 76/100
Task accuracy: 78/100
Production readiness: 62/100
Execution readiness: 71/100

Can the plan succeed?
Yes, if corrections are applied.
```
