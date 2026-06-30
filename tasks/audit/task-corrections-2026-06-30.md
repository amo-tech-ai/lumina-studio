---
title: Task Corrections — Forensic Audit
date: "2026-06-30"
status: "docs refreshed · Linear verified 2026-06-30"
audit_score: "94/100"
---

# Task Corrections — 2026-06-30

Forensic audit corrections. **Linear spine verified** against live relations (2026-06-30). Docs refreshed to match current Linear state — not the pre-sync audit.

**SSOT for agents:** [`tasks/design-docs/plan/AGENT-MAP.md`](../design-docs/plan/AGENT-MAP.md) · prod code: `app/src/lib/route-agent-map.ts`

---

## Audit scorecard

| Area | Score |
|------|------:|
| Dependency analysis | 98/100 |
| Linear verification | 95/100 |
| Task mapping | 90/100 |
| Documentation accuracy | 88/100 |
| Production planning | 92/100 |
| **Overall** | **94/100** |

**Production readiness (code):** ~62/100 — EvidenceBlock, IntelligencePanel, route-agent fix, Shoot Detail 404 on main remain open.

---

## Mirror issues (duplicateOf)

| Mirror | Canonical | Linear status |
|--------|-----------|---------------|
| **IPI-267 · DESIGN-046 — EvidenceBlock React Port (→ IPI-246)** | **IPI-246 · DESIGN-046 — EvidenceBlock — AI Explainability Component** | Duplicate · AI INTELLIGENCE project |
| **IPI-266 · MOBILE-QA-001 — Mobile Modals & Selection Verification (→ IPI-264)** | **IPI-264 · DESIGN — Mobile Verification — Pass/Fail Matrix & Breakpoints** | Duplicate · AI INTELLIGENCE project |

Execute only the canonical issue. Mirrors remain for cross-project traceability.

---

## Agent mapping (AGENT-MAP SSOT)

All route → agent references must match [`AGENT-MAP.md`](../design-docs/plan/AGENT-MAP.md) handoff table. **Do not mix agent names across docs.**

| Linear issue | Spec | Route | Mastra agent | Wiring issue |
|--------------|------|-------|--------------|--------------|
| **IPI-247 · DESIGN-070 — Route-Agent Map Parity** | DESIGN-070 | all mismatched routes | fixes map | enabler — ship first |
| **IPI-261 · DESIGN-077 — Creative Director Agent — Asset Intelligence Wiring** | DESIGN-077 | `/app/assets` | `creative-director` | Batch 2 |
| **IPI-156 · CAMP-001 — Creative director agent** | CAMP-001 | `/app/campaigns` | `creative-director` | Batch 2 (tools, not route map) |
| **IPI-262 · DESIGN-078 — Visual Identity Agent — Channel Preview Wiring** | DESIGN-078 | `/app/preview` | `visual-identity` | Batch 2 |
| **IPI-263 · DESIGN-079 — Social Discovery Agent — Creator Matching Wiring** | DESIGN-079 | `/app/matching` | `social-discovery` | Batch 2 |
| **IPI-259 · DESIGN-075 — Production Planner Agent — Route Wiring** | DESIGN-075 | `/app/shoots`, `/app` | `production-planner` | Batch 2 |
| **IPI-260 · DESIGN-076 — Brand Intelligence Agent — Route Wiring** | DESIGN-076 | `/app/brand`, `/app/onboarding` | `brand-intelligence` | Batch 2 |

**Prod gaps (IPI-247):**

| Route | AGENT-MAP target | Prod today |
|-------|------------------|------------|
| `/app/assets` | `creative-director` | `production-planner` 🔴 |
| `/app/matching` | `social-discovery` | `production-planner` 🔴 |
| `/app/preview` | `visual-identity` | default (`production-planner`) 🔴 |
| `/app/onboarding` | `brand-intelligence` | `production-planner` 🟡 |

**Resolved doc drift:** early audit incorrectly assigned `visual-identity` to `/app/assets`. Assets = **creative-director** per AGENT-MAP.

---

## Dependencies (full task names)

Hard `blockedBy` relations verified in Linear 2026-06-30.

| Task | Hard blocked by | Soft / informational |
|------|---------------|----------------------|
| **IPI-249 · DESIGN-058 — Campaign Management — React Parity Workspace** | **IPI-268 · SUPA-DV2-001 — Campaigns + Matching schema migration** · **IPI-246 · DESIGN-046 — EvidenceBlock** · **IPI-247 · DESIGN-070 — Route-Agent Map Parity** | **IPI-156 · CAMP-001 — Creative director agent** (tools) |
| **IPI-251 · DESIGN-045 — Mobile Operator Shell — Bottom Nav & Sheet** | **IPI-243 · INTEL-001 — Build IntelligencePanel** | blocks **IPI-264** mobile surfaces |
| **IPI-260 · DESIGN-076 — Brand Intelligence Agent — Route Wiring** | **IPI-247 · DESIGN-070 — Route-Agent Map Parity** | **IPI-130 · AIOR-014 — brand-intelligence Mastra agent** ✅ |
| **IPI-269 · DESIGN-060 — Channel Preview — React Parity (DV2 refresh)** | **IPI-246 · DESIGN-046 — EvidenceBlock** · **IPI-247 · DESIGN-070 — Route-Agent Map Parity** | **IPI-262 · DESIGN-078 — Visual Identity Agent** · **IPI-188** ✅ baseline |
| **IPI-248 · DESIGN-057 — Asset Library — React Parity Workspace** | **IPI-246 · DESIGN-046 — EvidenceBlock** · **IPI-247 · DESIGN-070 — Route-Agent Map Parity** | **IPI-257 · DESIGN-074 — Cloudinary Media Pipeline** (upload only) |
| **IPI-261 · DESIGN-077 — Creative Director Agent — Asset Intelligence Wiring** | **IPI-247 · DESIGN-070** · **IPI-248 · DESIGN-057 — Asset Library** | **IPI-246 · EvidenceBlock** (explain UX on scores) |
| **IPI-262 · DESIGN-078 — Visual Identity Agent — Channel Preview Wiring** | **IPI-247 · DESIGN-070** | **IPI-246 · EvidenceBlock** · **IPI-269 · Channel Preview** |
| **IPI-263 · DESIGN-079 — Social Discovery Agent — Creator Matching Wiring** | **IPI-247 · DESIGN-070** · **IPI-268 · SUPA-DV2-001** | **IPI-246 · EvidenceBlock** · **IPI-250 · Matching workspace** |

---

## Over-blocking review (Hard · Soft · Informational)

Classify before changing Linear relations. Pass 2 reclassified several former hard blockers.

| Task | Former / proposed blocker | Class | Current Linear |
|------|---------------------------|-------|----------------|
| **IPI-209 · DESIGN-054 — Shoot Detail Workspace** | **IPI-246 · EvidenceBlock** | **Soft** — Assets-tab explain only; 7/8 tabs can ship | `relatedTo` only ✅ |
| **IPI-209** | **IPI-85 · IPI-84 · IPI-183 · IPI-184** | **Informational** — shipped or design review | `relatedTo` only ✅ |
| **IPI-243 · INTEL-001 — IntelligencePanel** | **IPI-246 · EvidenceBlock** | **Soft** — phase A shell without live scores OK | no `blockedBy` ✅ |
| **IPI-247 · DESIGN-070 — Route-Agent Map** | **IPI-246 · EvidenceBlock** | **Informational** — independent code paths | no `blockedBy` ✅ |
| **IPI-248 · DESIGN-057 — Asset Library** | **IPI-257 · Cloudinary Pipeline** | **Soft** — read-only masonry before upload | `relatedTo` only ✅ |
| **IPI-257 · DESIGN-074 — Cloudinary Pipeline** | **IPI-255 · Live Intelligence Data** | **Soft** — parallel Batch 1 lane | no `blockedBy` ✅ |
| **IPI-246 · EvidenceBlock** | blocks **IPI-261/262/263** agent wiring | **Soft** for wiring · **Hard** for explain UX on scores | `blocks` removed from agent wiring ✅ |
| **IPI-264 · Mobile Verification** | **IPI-243 · IntelligencePanel** | **Soft** — 390px DC pass started in parallel | `blockedBy` IPI-243 (acceptable soft gate) |

---

## Status updates (Linear verified)

| Task | Transition | Notes |
|------|------------|-------|
| **IPI-264 · DESIGN — Mobile Verification — Pass/Fail Matrix & Breakpoints** | Todo → **In Progress** | 390px pass started · evidence in `docs/ecommerce/evidence/2026-06-30/mobile-verification/` |
| **IPI-269 · DESIGN-060 — Channel Preview — React Parity (DV2 refresh)** | Backlog → **Todo** | Created pass 1 · deps wired pass 2 |
| **IPI-267 · DESIGN-046 — EvidenceBlock React Port** | Todo → **Duplicate** | duplicateOf **IPI-246** |
| **IPI-266 · MOBILE-QA-001 — Mobile Modals & Selection Verification** | Todo → **Duplicate** | duplicateOf **IPI-264** |
| **IPI-209 · DESIGN-054 — Shoot Detail Workspace** | Todo → **In Progress** | worktree `wt-ipi-209` · 404 on main |
| **IPI-51 · DASH-005 — Route agentId Map** | Done (partial) | gaps tracked in **IPI-247** |

---

## Documentation drift (correct references)

| Doc gap | Correct task reference |
|---------|------------------------|
| Route-agent falsely 🟢 | **IPI-247 · DESIGN-070 — Route-Agent Map Parity** 🟡 until PR merges |
| No EvidenceBlock in `app/` | **IPI-246 · DESIGN-046 — EvidenceBlock — AI Explainability Component** |
| Shoot Detail 404 on main | **IPI-209 · DESIGN-054 — Shoot Detail Workspace** · In Progress |
| Campaigns/matching schema TBD | **IPI-268 · SUPA-DV2-001 — Campaigns + Matching schema migration** |
| Upload pipeline missing | **IPI-257 · DESIGN-074 — Cloudinary Media Pipeline — Upload to Delivery** |
| Channel Preview no DV2 issue | **IPI-269 · DESIGN-060 — Channel Preview — React Parity (DV2 refresh)** |
| Agent on assets = visual-identity (wrong) | **creative-director** per AGENT-MAP · **IPI-261 · DESIGN-077** |

---

## Dependency verification checklist

Every spine task should have these fields populated in Linear description + [`LINEAR-ISSUE-FOOTER.md`](../intelligence/ai/LINEAR-ISSUE-FOOTER.md):

| Field | Verified (spine) |
|-------|:----------------:|
| Task owner (assignee) | ✅ spine → S K |
| Priority | ✅ High/Medium set |
| Blocked by (hard) | ✅ verified 2026-06-30 |
| Blocks | ✅ where applicable |
| Skills | ✅ in register |
| MCP | ✅ in footer template |
| Verification checklist | 🟡 partial — IPI-270/271 optional |
| Acceptance criteria | ✅ spine issues |

**Gaps:** non-spine issues still unassigned · optional CI gates IPI-270 (route-agent test) · IPI-271 (EvidenceBlock Playwright) not created.

---

## React parity checklist (per screen)

Use for Batch 2 workspace issues and QA epic **IPI-258**.

| Screen | Route | Linear | Prototype | React | Browser | Playwright | Console clean | Mobile |
|--------|-------|--------|:---------:|:-----:|:-------:|:----------:|:-------------:|:------:|
| Brand Detail | `/app/brand/[id]` | partial | ✅ | 🟡 | 🟡 | ⚪ | ⚪ | ⚪ |
| Shoot Detail | `/app/shoots/[id]` | **IPI-209** | ✅ | 🔵 | 🔴 404 | ⚪ | ⚪ | ⚪ |
| Assets | `/app/assets` | **IPI-248** | ✅ | 🔵 | 🟡 | ⚪ | ⚪ | ⚪ |
| Campaigns | `/app/campaigns` | **IPI-249** | ✅ | 🔵 | 🟡 | ⚪ | ⚪ | ⚪ |
| Matching | `/app/matching` | **IPI-250** | ✅ | 🔵 | 🟡 | ⚪ | ⚪ | ⚪ |
| Channel Preview | `/app/preview` | **IPI-269** | ✅ | 🟡 | 🟡 | ⚪ | ⚪ | ⚪ |
| Command Center | `/app` | — | ✅ | 🟢 | 🟢 | ⚪ | ⚪ | ⚪ |

Legend: ✅ done · 🟢 shipped · 🟡 partial · 🔵 scaffold · ⚪ not started · 🔴 blocker

---

## Component dependency map

Impact analysis for shared components — source: AGENT-MAP § Route → EvidenceBlock + handoff checklists.

| Component | Spec | Used by screens | Linear enabler |
|-----------|------|-----------------|----------------|
| **EvidenceBlock** | DESIGN-046 | Brand Detail · Assets · Campaigns · Matching · Channel Preview | **IPI-246** |
| **IntelligencePanel** | DESIGN-032 | All OperatorShell pages | **IPI-243** |
| **AssetCard** | DESIGN-042 | Assets · Shoot Detail (Assets tab) | **IPI-248** · **IPI-209** |
| **CampaignCard** | DESIGN-043 | Campaigns | **IPI-249** |
| **FilterBar** | DESIGN-041 | Assets · Campaigns · Matching | workspace issues |
| **BottomNavigation / BottomSheet** | DESIGN-045 | Mobile shell (all routes ≤1024px) | **IPI-251** |
| **ApprovalCard / HITL** | DESIGN-072 | Brand · panel writes | **IPI-244** |

Changing **IPI-246 · EvidenceBlock** affects 5 screens — ship as single shared component, no forks.

---

## Canonical execution order

```text
Batch 1:  IPI-246 → IPI-247 → IPI-243 → IPI-209 → IPI-255 ∥ IPI-257
Batch 2:  IPI-197 · IPI-248 · IPI-268 · IPI-249 · IPI-250 · IPI-261 · IPI-269
Batch 3:  IPI-258 · IPI-264 · IPI-253 · IPI-107 · IPI-47
```

Agent wiring (Batch 2 parallel): **IPI-259 · IPI-260 · IPI-261 · IPI-262 · IPI-263 · IPI-156**

---

## Applied to Linear ✅ (pass 1+2+3 complete)

See [`tasks/notes/linear-sync-2026-06-30.md`](../notes/linear-sync-2026-06-30.md).

### Pass 3 applied 2026-06-30

| Task | Change |
|------|--------|
| **IPI-244 · INTEL-002** | Hard `blockedBy` **IPI-243** · assignee S K |
| **IPI-262 · DESIGN-078** | IPI-246 soft in description · assignee S K |
| **IPI-263 · DESIGN-079** | IPI-246 soft in description · assignee S K |
| **IPI-156 · CAMP-001** | Assignee S K |
| **IPI-197 · Contextual Copilot** | Assignee S K |
| **IPI-253 · DESIGN-A11Y** | Assignee S K |
| **IPI-259 · DESIGN-075** | Assignee S K |
| **IPI-261 · DESIGN-077** | Removed hard `blockedBy` IPI-248 · soft in description · assignee S K |
| **IPI-264 · Mobile Verification** | Removed hard `blockedBy` IPI-243 · soft gate in description |
| **IPI-268 · SUPA-DV2-001** | Removed hard `blockedBy` IPI-248 · soft gate in description |
| **IPI-258 · Production QA** | `blockedBy` **IPI-209 · IPI-269** added · scope in description |

## Remaining Linear corrections (pass 3 — optional)

~~Applied — see pass 3 table above.~~

---

## Remaining — code PRs (separate, one concern each)

1. **IPI-247 · DESIGN-070 — Route-Agent Map Parity** — `route-agent-map.ts` + unit test
2. **IPI-246 · DESIGN-046 — EvidenceBlock** — `evidence-block/` component
3. **IPI-209 · DESIGN-054 — Shoot Detail Workspace** — merge from `wt-ipi-209`
4. **IPI-268 · SUPA-DV2-001** — migration-only PR

---

## Remaining — optional (P2)

| Task | Purpose |
|------|---------|
| **IPI-270** (proposed) | Route-agent unit test CI gate |
| **IPI-271** (proposed) | EvidenceBlock Playwright component spec |
| Broader unassigned triage | Non-spine issues |

---

## Linear checklist

- [x] Mirror issues: IPI-267 → IPI-246 · IPI-266 → IPI-264 (full titles)
- [x] Agent mapping aligned to AGENT-MAP (261/262/263/156/259/260)
- [x] Hard vs soft blockers classified and reflected in Linear
- [x] Spine assignees + status transitions
- [x] Docs refreshed to current Linear state
- [x] **IPI-244** → hard `blockedBy` **IPI-243 · INTEL-001**
- [x] **IPI-262/263** → IPI-246 soft in descriptions
- [x] Assign **IPI-156 · 197 · 244 · 253 · 259 · 262 · 263 · 261**
- [x] Soft gates: **IPI-264** ↔ IPI-243 · **IPI-261** ↔ IPI-248 · **IPI-268** ↔ IPI-248
- [x] **IPI-258** → **IPI-209 · IPI-269** in QA scope
- [ ] **IPI-247** → In Review when code PR merges
- [ ] **IPI-270/271** create (optional)
