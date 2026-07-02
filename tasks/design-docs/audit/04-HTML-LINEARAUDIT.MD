# IPI Design Task Audit — HTML LINEAR AUDIT

**Date:** 2026-07-02 · **Rev:** 2 (2026-07-02 — Playwright correction, skills matrix, Linear sync notes)
**Auditor:** task-verifier (forensic)
**Scope:** 7 IPI tasks — DESIGN-053/054b/055/056/057 · SUPA-DV2-001 · DESIGN-074
**Branch:** `main` @ `353fc0c` (disk probes); re-verify after merge of PR #181+
**Project:** DESIGN V2 — Operator React Parity (DV2-M3 · Workspace Parity)

> **Out of scope for this audit:** PR #181 Command Center / Brand List / Brand Detail parity (separate track). This audit gates **DV2-M3 workspace queue** execution only.

---

## Executive Summary

| Dot | Meaning |
|:---:|---------|
| 🟢 | Spec quality / implementation meets bar |
| 🟡 | Issues found — fix before execution or Done |
| 🔴 | Blocker — not safe to execute or ship |
| ⚪ | Not started / N/A |

| Task | Priority | Task Score | Exec Score | Dot | Safe? | Critical Fixes |
|------|:--------:|:----------:|:----------:|:---:|:-----:|----------------|
| **IPI-257** Cloudinary Pipeline | P1-Urgent | **85/100** 🟢 | **20/100** 🔴 | 🟡 | ⚠️ Partial | Install SDK, create 074a–f routes, wire upload |
| **IPI-268** Campaigns/Matching Schema | P1-Urgent | **88/100** 🟢 | **5/100** 🔴 | 🟡 | ✅ Yes | Create migration SQL, apply, regen types |
| **IPI-336** Onboarding 13-screen | P2-High | **78/100** 🟡 | **15/100** 🔴 | 🟡 | ✅ Yes | Build 13 screens from scratch (current is 3-step) |
| **IPI-337** Shoot Detail 6 tabs | P2-High | **82/100** 🟢 | **30/100** 🔴 | 🟡 | ✅ Yes | Wire 6 tab components, link data sources |
| **IPI-274** Shoot Wizard parity | P2-High | **85/100** 🟢 | **45/100** 🟡 | 🟡 | ✅ Yes | Extract WizardStep, add OperatorShell, mount dock |
| **IPI-273** Shoots List parity | P2-High | **88/100** 🟢 | **50/100** 🟡 | 🟡 | ✅ Yes | Wrap OperatorShell, add IntelPanel, add 5 states |
| **IPI-248** Asset Library | P3-Medium | **85/100** 🟢 | **5/100** 🔴 | 🟡 | ⚠️ Gate IPI-257 | Create API route, build masonry grid, wire EvidenceBlock |

---

## Per-Task Audit

---

### 1. IPI-257 · DESIGN-074 · Cloudinary Media Pipeline

| Attribute | Detail |
|-----------|--------|
| Linear | [IPI-257](https://linear.app/amo100/issue/IPI-257) |
| Status | In Progress (re-opened — epic with 6 subs) |
| Priority | Urgent (P1) |
| Estimate | 13 pts |
| Labels | QA, HTML, DESIGNV2, SUPA, GEMINI |

#### Spec Quality: 85/100 🟢

| Criterion | Score | Notes |
|-----------|:-----:|-------|
| Purpose clear | ✅ | End-to-end Cloudinary pipeline |
| Goals concrete | ✅ | 6 sub-deliverables (074a–f), each with clear acceptance |
| Features defined | ✅ | Upload-sign, webhook, DNA trigger, presets, bulk |
| Workflows exact | ✅ | File paths, SQL, route contracts — implementation-ready |
| Mermaid diagrams | ✅ | Data flow + sequence diagram |
| Testing | ✅ | verify-rls, verify-edge, secret guard, manual E2E |
| DoD checklist | ✅ | Per-sub-PR evidence requirements |
| Dependencies | ✅ | Blocks IPI-248, IPI-269, IPI-338; related to IPI-276, IPI-282 |
| Rollback plan | ✅ | Down migration documented |
| Security | ✅ | Server-only SDK, no NEXT_PUBLIC*, signed uploads only |

**Issues:**
- 🟡 Spec references `cloudinary` SDK but it's **not in app/package.json** (gap between spec and implementation)
- 🟡 Spec claims 074b migration is "Done" but 3 separate migrations exist — needs reconciliation
- 🟡 SLA breached (date shows past dates due to SLA start before creation)

#### Execution Readiness: 20/100 🔴

| Check | Result | Evidence |
|-------|--------|----------|
| 074b migration | 🟡 3 migration files exist, not 1 clean migration | `20251129063729`, `20260630052200`, `20260630143000` |
| 074b RLS | 🟡 verify-rls not confirmed | Must re-run after 3rd migration |
| cloudinary SDK | 🔴 **NOT installed** | `require('cloudinary')` → `NOT_INSTALLED` |
| POST /api/assets/upload-sign | 🔴 **Does not exist** | No `app/api/assets/` directory |
| Webhook route | 🔴 **Does not exist** | Not found |
| Named presets | 🔴 **Does not exist** | Not created |
| Bulk API | 🔴 **Does not exist** | Not created |
| DNA pipeline end-to-end | 🟡 audit-asset-dna edge exists but not wired | Deployed but no trigger path |
| Cloudinary_assets rows | 🔴 **0 rows** | Stated in spec |

**Red flags / blockers:**
- 🔴 **SDK not installed** — no Cloudinary code can run
- 🔴 **No upload sign route** — cannot upload assets
- 🟡 **Migration sprawl** — 3 migrations instead of 1 clean sequence

#### Critical Fixes
1. Install `cloudinary` SDK in `app/` (server-only)
2. Consolidate or audit 3 existing migrations into clean sequence
3. Create `POST /api/assets/upload-sign` route with `withOperatorAuth`
4. Create webhook handler for post-upload linking
5. Wire `audit-asset-dna` trigger after upload link
6. Create named transform presets via Admin API
7. Run `supabase:verify-rls` after RLS migration

#### Is production ready?
**No** — 0/6 sub-deliverables complete. Cannot upload or serve assets via Cloudinary.

---

### 2. IPI-268 · SUPA-DV2-001 · Campaigns/Matching Schema

| Attribute | Detail |
|-----------|--------|
| Linear | [IPI-268](https://linear.app/amo100/issue/IPI-268) |
| Status | Todo |
| Priority | Urgent (P1) |
| Estimate | 8 pts |
| Labels | QA, HTML, DESIGNV2, SUPA |

#### Spec Quality: 88/100 🟢

| Criterion | Score | Notes |
|-----------|:-----:|-------|
| Purpose clear | ✅ | Schema for Campaigns, Matching, Analytics |
| Goals concrete | ✅ | Tables, FKs, indexes, RLS, types |
| ER diagram | ✅ | Complete with all columns and relationships |
| RLS pattern | ✅ | Uses `is_org_member()` helper — correct pattern |
| API contracts | ✅ | Documented for frontend consumers |
| Testing | ✅ | verify-rls, types regen, tsc |
| Rollback | ✅ | Down migration sequence documented |
| Dependencies | ✅ | Blocked by IPI-257 074b (done), blocks IPI-249/250/296/297 |

**Issues:**
- 🟡 Relies on IPI-257 074b for brand RLS alignment — 074b has 3 migrations, not 1
- 🟡 Assumes `is_org_member()` function exists — need to verify on remote
- 🟡 No mention of existing `talent_shortlists` table collision risk

#### Execution Readiness: 5/100 🔴

| Check | Result | Evidence |
|-------|--------|----------|
| Campaign migration files | 🔴 **None exist** | `ls supabase/migrations/ \| grep -iE "campaign\|matching\|creator"` → NONE FOUND |
| Campaign tables on remote | 🔴 **None exist** | Verified: no campaigns/creators/campaign_metrics |
| RLS policies | 🔴 Not created | No tables exist |
| Types generated | 🔴 Not done | N/A |
| API routes | 🔴 Not created | N/A |

**Red flags / blockers:**
- 🟡 **No migration authored yet** — greenfield, which also means no blockers other than effort
- 🟡 IPI-257 074b dependency chain — 074b has 3 migrations, need to verify RLS is stable

#### Critical Fixes
1. Author migration SQL (campaigns, deliverables, creators, shortlists, invites, campaign_metrics, brand_analytics_snapshots)
2. Add RLS policies per table
3. Add indexes on FK + status columns
4. Run migration-reviewer before push
5. `supabase:push` → regen types → run verify-rls

#### Is production ready?
**No** — greenfield. Spec is solid but no SQL exists yet.

---

### 3. IPI-336 · DESIGN-053 · Onboarding 13-screen Zeely Funnel

| Attribute | Detail |
|-----------|--------|
| Linear | [IPI-336](https://linear.app/amo100/issue/IPI-336) |
| Status | Todo |
| Priority | High (P2) |
| Labels | FRONTEND, QA, HTML, DESIGNV2, COPILOTKIT, BRAND |

#### Spec Quality: 78/100 🟡

| Criterion | Score | Notes |
|-----------|:-----:|-------|
| Purpose clear | ✅ | 13-screen Zeely funnel to DNA payoff |
| Goals defined | ✅ | Per-screen validation, analysis progress, DNA payoff |
| Design source | ✅ | DC HTML prototype referenced |
| Route | ✅ | `/app/onboarding` |
| Implementation steps | ✅ | A–E with proof |
| Testing | ✅ | lint, test, tsc, build, browser |
| DoD | ✅ | Checklist present |
| Agent wiring | ✅ | brand-intelligence agent |
| Wireframe | 🟡 | Basic flowchart only — no per-screen wireframes |
| Dependency detail | 🟡 | Depends on IPI-46 (Done) but no mention of existing 264-line onboarding page |

**Issues:**
- 🔴 **Existing onboarding exists** at 264 lines (3-step) — spec does not acknowledge it. Needs gap analysis: reuse vs rewrite
- 🟡 **No per-screen wireframes** in spec — 13 screens is large, needs more granular planning
- 🟡 **DC prototype status unknown** — `Onboarding.v2.zeely.dc.html` exists but its parity vs current UI is not documented
- 🟡 No mention of mobile optimization requirements (13-step mobile is non-trivial)
- 🟡 No error/recovery states specified per screen (network failure mid-funnel)

#### Execution Readiness: 15/100 🔴

| Check | Result | Evidence |
|-------|--------|----------|
| `/app/onboarding` route | ✅ Exists | page.tsx (264 lines, 3-step) |
| 13-screen parity | 🔴 **Current is 3-step, not 13** | Code shows 3 dots, uses `DOTS = [1, 2, 3]` |
| IPI-46 orchestration used | ✅ Reuses `createOrgAndBrand` + `invokeBrandIntelligence` | Confirmed in existing code |
| Screen components | 🔴 **None created** | All inline in single page.tsx |
| Progress rail component | 🔴 Not created | None |
| DNA payoff screen | 🔴 Not created | None |
| Mobile layout | 🔴 Not verified | Unknown |

**Red flags / blockers:**
- 🔴 **10 new screens to build** — current 3-step must become 13-screen
- 🟡 **264-line single file** needs refactoring into components
- 🟡 Need to audit existing vs DC before rewriting

#### Critical Fixes
1. Audit current 3-step onboarding vs DC 13-screen — document gap
2. Extract reusable screen components (wizard container, progress rail, form step)
3. Build remaining 10 screens
4. Wire IPI-46 orchestration on final submit (reuse existing `createOrgAndBrandShell` + `brand-intelligence`)
5. Add Screen 12 analysis progress + Screen 13 DNA payoff
6. Mobile: stacked steps, sticky progress, 44px touch targets

#### Is production ready?
**No** — existing onboarding is 3-step, needs 13-screen refactor.

---

### 4. IPI-337 · DESIGN-054b · Shoot Detail Remaining Tab Parity

| Attribute | Detail |
|-----------|--------|
| Linear | [IPI-337](https://linear.app/amo100/issue/IPI-337) |
| Status | Todo |
| Priority | High (P2) |
| Labels | FRONTEND, QA, HTML, DESIGNV2, SHOOT, DESIGN, COPILOTKIT |

#### Spec Quality: 82/100 🟢

| Criterion | Score | Notes |
|-----------|:-----:|-------|
| Purpose clear | ✅ | Wire 6 remaining placeholder tabs |
| Goals defined | ✅ | All tabs live with real data |
| Design source | ✅ | DC HTML referenced |
| Route | ✅ | `/app/shoots/[shootId]` |
| Testing | ✅ | lint, test, tsc, build, playwright |
| Dependencies | ✅ | Parent IPI-209 (shell done) |
| Tab scope | ✅ | Clear: Assets, Team, Schedule, Budget, Approvals, Activity |
| Deep link | ✅ | Assets tab → view in assets library |

**Issues:**
- 🟡 **No data source contracts** per tab — which RPC/endpoint powers each tab?
- 🟡 **No component breakdown** — will each tab be its own component or inline?
- 🟡 **No loading/empty/error states** per tab — spec mentions "empty/loading/error per tab" in acceptance but no detail

#### Execution Readiness: 30/100 🔴

| Check | Result | Evidence |
|-------|--------|----------|
| Shoot Detail shell | ✅ **Merged** | 3 live tabs + 6 placeholder stubs |
| API data route | ✅ Exists | `GET /api/shoots/[shootId]` |
| Data layer | ✅ Exists | `get-shoot-detail.ts` with RPC |
| Tab components | 🔴 **None created** | No shoot-detail-tab-* components found |
| Assets tab | 🔴 Placeholder | Text: "wired in follow-up" |
| Team tab | 🔴 Placeholder | Same placeholder text |
| Schedule tab | 🔴 Placeholder | Same |
| Budget tab | 🔴 Placeholder | Same |
| Approvals tab | 🔴 Placeholder | Same |
| Activity tab | 🔴 Placeholder | Same |

**Red flags / blockers:**
- 🟡 Tab-specific data sources not defined — each tab needs its own query/knowledge
- 🟡 Assets tab needs to link to IPI-248 (assets library) or stand alone

#### Critical Fixes
1. Define data sources per tab (RPC/endpoint table)
2. Build tab components (6 files or 6 sections in detail client)
3. Wire data fetching per tab
4. Add loading/empty/error states per tab
5. Implement Assets tab → view in assets deep link
6. Playwright test per tab

#### Is production ready?
**No** — 6/9 tabs are placeholders. Shell and 3 tabs live.

---

### 5. IPI-274 · DESIGN-056 · Shoot Wizard Parity

| Attribute | Detail |
|-----------|--------|
| Linear | [IPI-274](https://linear.app/amo100/issue/IPI-274) |
| Status | Todo |
| Priority | High (P2) |
| Estimate | L |
| Labels | FRONTEND, QA, HTML, DESIGNV2, SHOOT, DESIGN, MASTRA, COPILOTKIT, GEMINI, UX |

#### Spec Quality: 85/100 🟢

| Criterion | Score | Notes |
|-----------|:-----:|-------|
| Purpose clear | ✅ | Port wizard chrome to DC parity |
| Goals defined | ✅ | WizardStep, dock, HITL gates, Zeely tokens |
| Wireframes | ✅ | Desktop + mobile ASCII diagrams |
| Mermaid | ✅ | Step flow + HITL sequence diagrams |
| Implementation steps | ✅ | A–E with clear test/proof |
| Testing | ✅ | lint, test, build, playwright |
| Dependencies | ✅ | IPI-275 (soft), IPI-247 (Done), IPI-270 (Done) |
| DoD | ✅ | Evidence requirements |
| Out of scope | ✅ | IPI-252 explicitly excluded |

**Issues:**
- 🟡 **OperatorChatDock exists** (25 lines) but spec calls it `PersistentChatDock` (IPI-275/DESIGN-033) — naming mismatch
- 🟡 **No mobile wireframe detail** for step content layout
- 🟡 **10-step expansion decision** (IPI-252) not yet resolved — spec says keep 6-step but DC has 10

#### Execution Readiness: 45/100 🟡

| Check | Result | Evidence |
|-------|--------|----------|
| Wizard route | ✅ Exists | `shoots/new/page.tsx` (824 lines) |
| 6-step logic | ✅ Working | HITL: brief → deliverables → shots → budget → review |
| HITL gates | ✅ Implemented | ApprovalCard components for deliverables/shots/budget |
| OperatorShell | 🔴 **Not wrapping wizard** | Wizard is standalone form layout |
| WizardStep component | 🔴 **Not extracted** | No `WizardStep` component in `components/` |
| OperatorChatDock | ✅ Exists | `operator-chat-dock.tsx` (25 lines) |
| Dock step-aware context | 🔴 **Not implemented** | Dock has no step awareness |
| Mobile parity | 🔴 Not done | No mobile layout |
| Zeely v3 tokens | 🟡 Partial | IPI-270 merged, but wizard may not use them |

**Red flags / blockers:**
- 🟡 **824-line wizard page** needs careful refactoring without breaking 6-step logic
- 🟡 OperatorChatDock exists but may be too simple (25 lines, only `CopilotChat` wrapper)

#### Critical Fixes
1. Extract WizardStep component from inline code
2. Wrap page in OperatorShell (3-panel)
3. Mount OperatorChatDock with step-aware context
4. Apply Zeely v3 tokens
5. Add mobile single-column layout
6. Preserve all HITL gates — do not rewrite Mastra workflow

#### Is production ready?
**No** — functional but chrome/parity incomplete.

---

### 6. IPI-273 · DESIGN-055 · Shoots List Parity

| Attribute | Detail |
|-----------|--------|
| Linear | [IPI-273](https://linear.app/amo100/issue/IPI-273) |
| Status | Todo |
| Priority | High (P2) |
| Labels | FRONTEND, QA, HTML, DESIGNV2, SHOOT, DESIGN, MASTRA, COPILOTKIT, UX |

#### Spec Quality: 88/100 🟢

| Criterion | Score | Notes |
|-----------|:-----:|-------|
| Purpose clear | ✅ | Port Shoots List to DC parity |
| Current state table | ✅ | Clear gap analysis vs today |
| Component list | ✅ | Exact components to reuse |
| Wireframes | ✅ | Desktop + mobile ASCII |
| Mermaid | ✅ | Flowchart + state diagram |
| Implementation steps | ✅ | A–E with test/proof |
| Testing | ✅ | lint, test, build, playwright, hex guard |
| Dependencies | ✅ | IPI-243/247/255/270/275 all mapped |
| Out of scope | ✅ | Clear boundaries |

**Issues:**
- 🟡 **No template/new-shoot CSS in mobile wireframe** — shows `[+ New]` but not implementation
- 🟡 IPI-245 (Mobile shell) is soft dependency — mobile may be incomplete

#### Execution Readiness: 50/100 🟡

| Check | Result | Evidence |
|-------|--------|----------|
| Shoots list route | ✅ Exists | `shoots/page.tsx` (195 lines) |
| Data layer | ✅ Solid | `shoot_portfolio_view + RLS` |
| ShootCard component | ✅ Exists | In `components/shoot/ShootCard` |
| Search/filter | ✅ Working | Status tabs + text search + DNA sort |
| OperatorShell | 🔴 **Not wrapping** | Standalone page layout |
| IntelligencePanel slot | 🔴 **Missing** | Uses CopilotKit sidebar, not IntelPanel |
| PersistentChatDock | 🔴 **Missing** | No dock on shoots list |
| 5 states | 🔴 **Not implemented** | Only basic populated state |
| Mobile parity | 🔴 Not done | No mobile layout |
| Zeely v3 tokens | 🟡 Partial | Need to verify |

**Red flags / blockers:**
- 🟡 **Standalone page** — needs wrapping in OperatorShell without breaking existing filter/search logic

#### Critical Fixes
1. Wrap page in OperatorShell (NavSidebar, workspace area, IntelligencePanel slot)
2. Add IntelligencePanel for brand DNA brief
3. Mount PersistentChatDock with production-planner greeting
4. Implement 5 states: loading(skeleton), empty, error, populated, filtered
5. Verify Zeely v3 tokens (no hardcoded hex)
6. Mobile: verify respects IPI-251 patterns

#### Is production ready?
**No** — functional list exists but lacks shell/panel/dock parity.

---

### 7. IPI-248 · DESIGN-057 · Asset Library Parity

| Attribute | Detail |
|-----------|--------|
| Linear | [IPI-248](https://linear.app/amo100/issue/IPI-248) |
| Status | Todo |
| Priority | Medium (P3) |
| Labels | FRONTEND, QA, HTML, DESIGNV2, DESIGN, SUPA, MASTRA, COPILOTKIT, GEMINI, UX |

#### Spec Quality: 85/100 🟢

| Criterion | Score | Notes |
|-----------|:-----:|-------|
| Purpose clear | ✅ | Replace placeholder with full Asset Library |
| Wireframes | ✅ | Desktop + mobile ASCII with masonry |
| Mermaid | ✅ | Component/data map + state diagram |
| Implementation steps | ✅ | 0–E with clear test/proof |
| Backend wiring | ✅ | GET /api/assets route contract |
| Dependencies | ✅ | IPI-246/247/257/276 all mapped |
| Upload gating | ✅ | Upload behind IPI-257 flag |
| Out of scope | ✅ | Cloudinary internals, EvidenceBlock component |

**Issues:**
- 🟡 **IPI-246 EvidenceBlock** — component **shipped** (`evidence-block.tsx`); hard blocker removed for read-only DNA explain. Upload still gated on IPI-257.
- 🟡 **No AssetCard component exists** — must be built (DC reference exists)
- 🟡 **No GET /api/assets route** — step 0 must create before any UI work

#### Execution Readiness: 5/100 🔴

| Check | Result | Evidence |
|-------|--------|----------|
| `/app/assets` route | 🟡 Exists as **SectionPlaceholder** | page.tsx (11 lines) |
| GET /api/assets | 🔴 **Not created** | No `app/api/assets/` directory |
| AssetCard component | 🔴 **Does not exist** | Not found in `app/src/` |
| FilterBar (shared) | 🔴 **Does not exist as shared** | Not found (may exist elsewhere) |
| EvidenceBlock | ✅ **Exists** | `evidence-block.tsx` (263 lines) |
| Masonry grid | 🔴 Not implemented | N/A |
| Bulk selection | 🔴 Not implemented | N/A |
| Upload modal | 🔴 Not implemented (gated on IPI-257) | N/A |
| Upload sign route | 🔴 Not created (IPI-257 prerequisite) | N/A |

**Red flags / blockers:**
- 🔴 **Step 0 blocked** — must create API route before UI (no assets endpoint)
- 🔴 **Upload fully blocked** on IPI-257 074a (not started)
- 🔴 **AssetCard must be built** — not shared from elsewhere (does not exist anywhere)

#### Critical Fixes
1. Create `app/api/assets/route.ts` (GET with withOperatorAuth, query Supabase assets + DNA)
2. Build AssetCard component from DC prototype
3. Build masonry grid layout
4. Wire FilterBar (type/status/DNA)
5. Wire EvidenceBlock on DNA click
6. Implement loading/empty/error/selected states
7. Add upload modal scaffold (gated behind IPI-257)

#### Is production ready?
**No** — placeholder page, no API, no components.

---

## Cross-Cutting Findings

### Dependency Chain Issues

| From | To | Status | Risk |
|------|-----|--------|------|
| **IPI-268** 🔴 | IPI-257 (074b) | 074b has 3 migrations, needs audit | 🟡 Stability unclear |
| **IPI-248** 🔴 | IPI-257 (074a upload) | 074a not started | 🔴 Upload blocked |
| **IPI-248** 🟡 | IPI-246 (EvidenceBlock) | EvidenceBlock EXISTS | ✅ OK |
| **IPI-248** 🟡 | IPI-247 (route-agent) | ✅ Done | ✅ OK |
| **IPI-274** 🟡 | IPI-275 (PersistentChatDock) | OperatorChatDock exists (25 lines) | 🟡 Needs parity check |
| **IPI-273** 🟡 | IPI-243 (IntelligencePanel) | ✅ Done | ✅ OK |
| **IPI-336** 🟡 | IPI-46 (onboarding orchestration) | ✅ Done, reused in existing code | ✅ OK |
| **IPI-337** ✅ | IPI-209 (Shoot Detail shell) | ✅ Done, merged | ✅ OK |
| **IPI-337** 🟡 | no additional data sources defined | Tab data sources not specified | 🟡 |

### Common Gaps Across All Tasks

| Gap | Affected Tasks | Severity |
|-----|---------------|:--------:|
| No hardcoded hex guard evidence | IPI-273, IPI-274, IPI-248, IPI-337 | 🟡 |
| No per-screen design Playwright specs (IPI-258) | IPI-273, 274, 248, 337 | 🟡 |
| Root `e2e/*.spec.ts` smoke/API specs exist (6+) | — | ✅ Not a gap |
| EvidenceBlock exists but only tested in isolation | IPI-248 | 🟡 |
| route-agent-map.ts uses `model-match` for matching, not `social-discovery` | IPI-268 (related) | 🟡 |
| SLA breach dates show past dates | IPI-257, IPI-268 | 🟡 Data issue |
| All 7 tasks are Todo (except IPI-257 In Progress) | All | 🔴 |

### Stack Alignment Verification

| Requirement | Status | Notes |
|-------------|--------|-------|
| CopilotKit v2 (no v1 imports) | ✅ Verified | `/v2` subpath used |
| Mastra agent registry keys match | ✅ | default, production-planner, creative-director |
| Supabase remote-only (no local Docker) | ✅ | Remote project nvdlhrodvevgwdsneplk |
| 3-panel OperatorShell on operator routes | 🟡 Partial | Command Center has it, Shoots/Wizard/Assets don't |
| Zeely Editorial v3 tokens (no hardcoded hex) | 🟡 Partial | DESIGN-010 (IPI-270) merged but not applied to all screens |
| Route-agent-map.ts complete | ✅ | All routes mapped |

---

## Corrective Actions Summary

### 🔴 Must Fix Before Execution

| # | Task | Issue | Fix |
|---|------|-------|-----|
| 1 | IPI-257 | cloudinary SDK not installed | `npm install cloudinary` in app/ |
| 2 | IPI-248 | No GET /api/assets route | Create route before UI work |
| 3 | IPI-336 | Current onboarding is 3-step, not 13-screen | Audit → gap doc → build 10 new screens |
| 4 | IPI-257 | 3 migration files instead of clean sequence | Consolidate or verify sequence integrity |

### 🟡 Fix Before Done

| # | Task | Issue | Fix |
|---|------|-------|-----|
| 5 | IPI-268 | No migration SQL authored | Author campaigns + matching + analytics tables |
| 6 | IPI-337 | Tab data sources undefined | Document RPC/endpoint per tab |
| 7 | IPI-274 | WizardStep component not extracted | Refactor from 824-line page |
| 8 | IPI-273 | No OperatorShell wrapping list page | Wrap in OperatorShell |
| 9 | UI parity tasks | No per-screen Playwright specs | IPI-258 or per-task Step E |
| 10 | All | Hardcoded hex not verified | Run hex guard on all operator routes |

### 📋 Process Improvements

| # | Issue | Suggestion |
|---|-------|------------|
| A | SLA breach dates show past dates | Re-set SLA start dates or ignore (data artifact) |
| B | Design ↔ production gap not explicitly stated in each task | Add "current production state" table (like IPI-273/274 already have) |
| C | route-agent-map.ts uses `model-match` vs handoff's `social-discovery` | Reconcile agent naming |
| D | No cross-task dependency map in spec | Add dependency chain diagram to each task |
| E | Skills missing in 3/7 issue md files | See § Skills matrix below; sync Linear → repo |

---

## Skills matrix (required before implementation)

Per `tasks/design-docs/plan/TASK-EXECUTION-GUIDE.md` + `tasks/intelligence/ai/skill-map.md` § DV2-M3.

| Task | Skills to run | Issue md has Skills block? |
|------|---------------|---------------------------|
| **IPI-257** | ipix-task-lifecycle · cloudinary · ipix-supabase · gemini · mermaid-diagrams · **task-verifier** | ✅ |
| **IPI-268** | ipix-task-lifecycle · ipix-supabase · mermaid-diagrams · migration-reviewer · **task-verifier** | ✅ (this PR) |
| **IPI-336** | ipix-task-lifecycle · design-md · **design-to-production** · frontend-design · ipix-wireframe · copilotkit · mermaid-diagrams · **task-verifier** | ✅ (this PR) |
| **IPI-337** | ipix-task-lifecycle · design-md · **design-to-production** · fashion-production · feature-dev · frontend-design · **task-verifier** | ✅ (this PR) |
| **IPI-274** | ipix-task-lifecycle · design-md · **design-to-production** · frontend-design · mastra · copilotkit · fashion-production · ipix-wireframe · mermaid-diagrams · **task-verifier** | ✅ (add design-md in skill-map) |
| **IPI-273** | ipix-task-lifecycle · design-md · **design-to-production** · frontend-design · copilotkit · mastra · ipix-wireframe · mermaid-diagrams · **task-verifier** | ✅ |
| **IPI-248** | ipix-task-lifecycle · design-md · **design-to-production** · frontend-design · cloudinary · copilotkit · ipix-wireframe · mermaid-diagrams · **task-verifier** | ✅ |

**Universal:** `ipix-task-lifecycle` orchestrates · `task-verifier` gates Done · UI tasks load `design-md` first · DC parity tasks load **`design-to-production`**.

---

## Grading System

| Score | Grade | Meaning |
|:-----:|:-----:|---------|
| 90-100 | 🟢 A | Production-ready, minimal follow-up |
| 75-89 | 🟢 B | Spec/implementation solid, minor issues |
| 60-74 | 🟡 C | Issues found, needs work before ship |
| 40-59 | 🟡 D | Significant gaps, fix before execution |
| 20-39 | 🔴 F | Major blockers, do not proceed |
| 0-19 | 🔴 F- | Greenfield or placeholder only |

| Task | Spec Score | Grade | Exec Score | Grade |
|------|:----------:|:-----:|:----------:|:-----:|
| IPI-257 | 85 | 🟢 B | 20 | 🔴 F |
| IPI-268 | 88 | 🟢 B | 5 | 🔴 F- |
| IPI-336 | 78 | 🟡 C | 15 | 🔴 F- |
| IPI-337 | 82 | 🟢 B | 30 | 🔴 F |
| IPI-274 | 85 | 🟢 B | 45 | 🟡 D |
| IPI-273 | 88 | 🟢 B | 50 | 🟡 D |
| IPI-248 | 85 | 🟢 B | 5 | 🔴 F- |
| **Average** | **84** | 🟢 **B** | **24** | 🔴 **F** |

---

## Will Each Task Succeed?

| Task | Verdict | Confidence | Rationale |
|------|---------|:----------:|-----------|
| **IPI-257** | ⚠️ Conditional | 60% | Well-specified but massive scope (6 subs, 13 pts). SDK not installed, 0 routes. Risk: scope creep. |
| **IPI-268** | ✅ Yes | 90% | Greenfield migration only, no React. Well-specified with ERD. Lower risk once unblocked from 074b. |
| **IPI-336** | ⚠️ Conditional | 65% | 13 screens is large for one issue. Risk: scope too big for one PR. Recommend splitting into 2 PRs. |
| **IPI-337** | ✅ Yes | 85% | Well-bounded: 6 tab components, shell exists, data layer exists. Low risk. |
| **IPI-274** | ✅ Yes | 80% | Functional wizard exists. Risk is refactoring 824 lines without regression. |
| **IPI-273** | ✅ Yes | 85% | Functional list exists, DC parity is additive (shell, panel, states). Low risk. |
| **IPI-248** | ⚠️ Conditional | 50% | Most greenfield of UI tasks. No API route, no AssetCard, no components. Upload fully blocked on IPI-257. |

---

## Production Readiness

| Criteria | Status |
|----------|--------|
| All 7 tasks spec quality ≥ 75/100 | ✅ Yes (avg 84 🟢) |
| All 7 tasks execution ready ≥ 70/100 | 🔴 **No** (avg 24 🔴) |
| Dependencies clear and valid | 🟡 Partial (IPI-257↔IPI-248 chain blocked) |
| Supabase types in sync | 🟡 Stale (from previous audit) |
| Build passes | ✅ Verified (`npm run build` clean on `353fc0c`) |
| Lint passes | ✅ Verified |
| Tests pass | ✅ Verified (`562` on `353fc0c`; PR #181 branch `602+`) |
| verify-rls passes | ✅ 68/68 |
| No console errors | 🟡 Not verified for all routes |

**Overall Production Readiness: 🔴 NOT READY**

Zero of seven tasks are executed. Combined execution readiness is 24/100. This is expected — all are Todo except IPI-257 (In Progress, 20% execution). Spec quality is strong (84/100), which de-risks implementation.

---

## Implementation Order Recommendation

```
Phase A — Schema Foundation (parallel-safe)
  1. IPI-268  Campaigns/Matching Schema  (migration-only, blocks nothing UI)
  2. IPI-257  Cloudinary Pipeline  (migration consolidation first, then 074a–f)

Phase B — UI Parity (can run in parallel with Phase A if IPI-268/257 aren't blocking)
  3. IPI-273  Shoots List  (additive, lowest risk)
  4. IPI-337  Shoot Detail tabs  (additive to existing shell)
  5. IPI-274  Shoot Wizard  (refactor existing code)

Phase C — Greenfield / Gated
  6. IPI-336  Onboarding 13-screen  (recommend split into 2 PRs: core screens + analysis/DNA)
  7. IPI-248  Asset Library  (wait for IPI-257 upload, but read-only grid can ship first)
```

---

## Audit Metadata

| Field | Value |
|-------|-------|
| Auditor | task-verifier forensic |
| Date | 2026-07-02 · Rev 2 |
| Git HEAD (probes) | `353fc0c` |
| Linear sync | IPI-257/268/336/337 verified 2026-07-02 via Linear MCP |
| Verification tools | Linear MCP, disk probes, CLI, source-of-truth cross-reference |
| Report location | `tasks/design-docs/audit/04-HTML-LINEARAUDIT.MD` |
| Skill-map | `tasks/intelligence/ai/skill-map.md` § DV2-M3 |
