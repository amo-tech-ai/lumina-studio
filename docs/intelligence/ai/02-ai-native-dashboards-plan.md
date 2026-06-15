---
title: "AI-Native Dashboards Plan"
version: "1.2"
lastUpdated: "2026-06-14"
status: "Active"
purpose: "How CopilotKit + Mastra transforms every Operator Hub dashboard from static UI to AI-native command centers"
relatedDocs:
  - copilotkit-operator-ui.md
  - mastra-agent-catalog.md
  - ../01-copilotkit-mastra-implementation-plan.md
  - ../../tasks/wireframes-ipix/new/00-index.md
  - ../../plan/01-foundation/06-brand-dashboards.md
  - ../../index-docs.md
---

# AI-Native Dashboards Plan

**Problem:** Most dashboard specs describe **static KPI cards + filters**. That is table-stakes. iPix wins when every screen **explains**, **suggests**, **approves**, and **acts** — without leaving the 3-panel layout.

**Principle:** Dashboards are not chat wrappers. The **center panel stays human-first** (forms, grids, editors). The **right panel is intelligence** (CopilotKit). Agents **read** what the user sees via `useAgentContext` + `useCopilotReadable`, and **write** only through HITL tools.

---

## 1. Current state

| Layer | Status | Evidence |
|-------|--------|----------|
| **Platform** | PLT-001–004 ✅ | Migrations, auth, edge scaffold, env validation (PR #3) |
| **Edge AI** | **`brand-intelligence` shipped** | `supabase/functions/brand-intelligence/` · `gemini-2.5-flash` |
| **Code UI** | Shell only | `src/pages/Dashboard.tsx` — placeholder, no 3-panel layout |
| **Routes** | `/dashboard` only | `src/App.tsx` — no nested operator routes |
| **Wireframes** | 17 screens spec'd | `tasks/wireframes-ipix/new/` |
| **Linear** | **Next: UI-001** (IPI-22) | DASH-001–012 queued (IPI-91–102) |
| **AI runtime** | Edge proven · Mastra/CopilotKit not wired | `services/agent/` absent |

**Gap:** Rich wireframes + edge proof + zero Operator UI. **Next queue:** UI-001 → DASH-001 → UI-002.

---

## 2. Dashboard inventory

### Canonical MVP routes (UI-001 shell)

**Source of truth for routing.** Do not add routes outside this set without updating this table + `copilotkit-operator-ui.md` + wireframe index.

| # | Dashboard | Route (canonical) | Wireframe | Linear task | Phase | Default agent |
|---|-----------|-------------------|-----------|-------------|-------|---------------|
| D0 | **Command Center** | `/dashboard` | (derived) | IPI-22 · UI-001 — Operator Hub Shell | MVP | `brand-intelligence` (placeholder) |
| D1 | **Brand** | `/dashboard/brand` | 08 | IPI-18 · AI-001 — Brand Intelligence Agent (edge) | MVP | `brand-intelligence` |
| D1b | **Brand Intake** | `/dashboard/brand/intake` | W2 | IPI-23 · UI-002 — Brand Intake Screen | MVP | `brand-intelligence` |
| D3 | **Assets + DNA** | `/dashboard/assets` | 04, 11 | IPI-24 · UI-003 — Asset Library Screen | MVP | `asset-dna` |
| D3b | **Asset Detail** | `/dashboard/assets/:assetId` | 04 | (part of UI-003) | MVP | `asset-dna` |
| D4 | **Products** | `/dashboard/products` | — | (commerce UI) | MVP | `product-linking` |
| D4b | **Product Links** | `/dashboard/products/links` | — | IPI-25 · UI-004 — Product Links Screen | MVP | `product-linking` |
| D10 | **Analytics** | `/dashboard/analytics` | 06 | IPI-97 · DASH-011 — D10 Analytics Scaffold | Advanced | `analytics` |
| D16 | **Settings** | `/dashboard/settings` | — | (TBD) | MVP shell | — |

**UI-001 (IPI-22)** ships placeholder pages for: Dashboard, Brand, Assets, Products, Analytics, Settings — center workspace + right intelligence panel shell only (no CopilotKit/Mastra wiring yet).

### Legacy / future nested aliases (do not implement unless multi-brand scope revives)

| Legacy / wireframe path | Canonical target | Notes |
|-------------------------|------------------|-------|
| `/dashboard/brand/new` | `/dashboard/brand/intake` | W2 wizard |
| `/dashboard/brands/:id/assets` | `/dashboard/assets` | Future: `?brandId=` or nested when multi-brand |
| `/dashboard/brands/:id/products` | `/dashboard/products` | Same |
| `/dashboard/intelligence/:id` | `/dashboard/brand` | Report view on brand hub |
| `/dashboard/media` | `/dashboard/assets` | Wireframe 04 label |
| `/dashboard/performance` | `/dashboard/analytics` | Wireframe 06 label |

### Deferred (post-MVP — not in UI-001 route set)

| # | Dashboard | Route (deferred) | Wireframe | Agent |
|---|-----------|------------------|-----------|-------|
| D5 | Shoots | `/dashboard/shoots` | 02 | `production-planner` |
| D6 | Shoot Detail | `/dashboard/shoots/:id` | 03 | `production-planner` |
| D7 | Production Package | `/dashboard/package` | 10 | `production-planner` |
| D8 | Media Library (org) | `/dashboard/media` | 04 | `content-planner` |
| D9 | Content Calendar | `/dashboard/calendar` | 05 | `content-planner` |
| D11 | Brief Creator | `/dashboard/brief` | 01 | `creative-director` |
| D12 | Canvas Editor | `/dashboard/canvas` | W3 | `creative-director` |
| D13 | Professional Network | `/dashboard/network` | 07 | `model-scout` |
| D14 | Photographer View | `/dashboard/photographer` | 12 | `production-planner` |
| D15 | Upload Triage | `/dashboard/triage` | 11 | `asset-dna` |

### Deferred (FashionOS legacy — do not build for iPix MVP)

Events, CRM, Sponsors dashboards in `plan/01-foundation/02-core-dashboards.md` are **out of MVP scope** unless explicitly revived in `prd.md`.

---

## 3. The AI-native upgrade pattern

Every dashboard gets the **same five layers**. Implementation complexity scales by phase, not by reinventing architecture per screen.

```text
┌─────────────────────────────────────────────────────────────────┐
│ L1  Context injection     useAgentContext + useCopilotReadable  │
│ L2  Proactive surface     Right panel: alerts, gaps, next step  │
│ L3  Conversational depth  CopilotChat on route-specific agent   │
│ L4  Generative artifacts  useCoAgent / useRenderTool cards      │
│ L5  HITL persistence      Approval before any Supabase write    │
└─────────────────────────────────────────────────────────────────┘
```

### L1 — Context injection (all dashboards, MVP+)

```tsx
// DashboardLayout — updates on route + selection
useAgentContext({
  description: "Operator session context",
  value: {
    route: location.pathname,
    brandId, brandName,
    shootId, assetId,
    filters: activeFilters,
    permissions: userRole,
  },
});

// KPI / grid dashboards — analytics pattern from chat-with-your-data
useCopilotReadable({
  description: "Visible dashboard metrics",
  value: { kpis, selectedRows, dateRange },
});
```

**ROI:** User stops re-explaining context in chat. Agent answers match what's on screen.

### L2 — Proactive intelligence (right panel, not center)

| Static dashboard | AI-native replacement |
|------------------|----------------------|
| KPI card "DNA: 78" | "14 assets flagged — [Review →]" with root cause |
| Empty state | "Paste a URL to start" + one-click analyze chip |
| Filter bar only | Filter + "AI suggests: show blocked assets first" |
| Toast on error | Agent explains failure + retry action |

**Wireframe reference:** `09-chat-panel.md` — Context Card + Quick Actions above chat.

### L3 — Route-specific agents

One default `agentId` per route (see inventory table). User can override in panel header for power users (Advanced).

### L4 — Generative center panel (where it helps)

| Pattern | Source repo | Use on |
|---------|-------------|--------|
| `useCoAgent` shared state | mastra-pm-canvas | Canvas editor, shot list, map pins |
| `useRenderTool` proposal cards | strands-crm | Production package preview |
| `renderAndWaitForResponse` charts | adk-generative-dashboard | Performance dashboard |
| `write_todos` checklist | deep-agents | Shoot planning, package builder |

**Rule:** Generative UI in **center** only when the artifact *is* the work product (canvas, charts, kanban). Otherwise keep generative output in **right panel** tool cards.

### L5 — HITL before writes

| Action | Approval surface |
|--------|------------------|
| Save brand profile | Inline form + chat approval card |
| Link asset → SKU | Modal + chat confirm |
| Publish package | Sticky approval in center + chat |
| Add chart to dashboard | Chart preview card (ADK pattern) |

---

## 4. Per-dashboard AI upgrade spec

### D0 — Command Center (`/dashboard`)

**Today:** Placeholder shell.  
**Target:** 30-second "what needs me" hub.

| Center panel | Right panel (AI) |
|--------------|------------------|
| 4 KPI cards (proofs status, DNA avg, active shoots, commerce links) | "What should I do next?" ranked queue |
| Critical path list (overdue, blocked DNA, missing links) | One-click navigate via `navigateTo` frontend tool |
| Active work cards (last 3 shoots / brands) | Proactive: "Brand X needs intake" |

| CopilotKit | Agent | Tools |
|------------|-------|-------|
| `useCopilotReadable` — KPI snapshot | `brand-intelligence` (MVP) → `ipix-supervisor` (Advanced) | `prioritizeTasks`, `navigateTo` |

**Copy from:** strands-crm `KpiRow` + banking priority queue pattern.

**Phase:** MVP+ (after UI-001 shell). KPIs can be static in Core.

---

### D1 — Brand (`/dashboard/brand`)

**Wireframe:** 08-brand-intelligence (report view)  
**Linear:** IPI-18 · AI-001 — Brand Intelligence Agent

| Center | Right |
|--------|-------|
| 5 score bars + 18 data points | "Biggest gap" narrative + prioritized suggestions |
| Re-analyze button | "Start Brief →" (deferred `/dashboard/brief`) |

---

### D1b — Brand Intake (`/dashboard/brand/intake`)

**Wireframe:** W2-brand-setup  
**Linear:** IPI-23 · UI-002 — Brand Intake Screen

| Center | Right |
|--------|-------|
| URL form + competitor URLs + progress | "Analyze URL", "Add competitor", citation panel |
| Profile editor (post-analysis) | Field-level "Explain this score" |

| CopilotKit | Agent | HITL |
|------------|-------|------|
| `useFrontendTool` `prefillBrandUrl` | `brand-intelligence` | Approve profile before save |
| `WorkflowTimeline` | | `brand-intake` workflow suspend |

**MVP path:** Form → edge `brand-intelligence` (no Mastra). Add CopilotKit when AIOR-002 lands.

---

### D2 — Brand Intelligence Report (legacy alias → D1)

**Canonical route:** `/dashboard/brand`  
**Legacy alias:** `/dashboard/intelligence/:id` — do not add as separate UI-001 route.

**Wireframe:** 08-brand-intelligence

| Center | Right |
|--------|-------|
| 5 score bars + 18 data points | "Biggest gap" narrative + prioritized suggestions |
| Re-analyze button | "Start Brief →" routes to canvas with context |

| CopilotKit | Agent |
|------------|-------|
| `useCopilotReadable` — scores + gaps | `brand-intelligence` |
| Tool cards — citation list | |

**AI upgrade vs static:** Scores are not just numbers — right panel ranks **actions by impact × effort** (wireframe already shows this; agent generates dynamically from `brand_scores`).

---

### D3 — Assets + DNA (`/dashboard/assets`)

**Detail route:** `/dashboard/assets/:assetId`  
**Linear:** IPI-24 · UI-003 — Asset Library Screen

**Wireframe:** 04-media-library, 11-upload-triage

| Center | Right |
|--------|-------|
| Upload zone + DNA badge grid | "Why blocked?" per selected asset |
| Filter: approved / review / blocked | "Suggest retake" with technical fix list |

| CopilotKit | Agent | Tools |
|------------|-------|-------|
| `useAgentContext` — `assetId` on select | `asset-dna` | `explainDnaScore`, `highlightAsset` |
| `ToolResultCard` — pillar breakdown | | `auditAssetDna` (edge) |

**DNA colors (locked):** approved `#059669` · review `#D97706` · blocked `#DC2626`

---

### D4 — Products (`/dashboard/products`) · D4b — Product Links (`/dashboard/products/links`)

**Linear:** IPI-25 · UI-004 — Product Links Screen

| Center | Right |
|--------|-------|
| Asset ↔ SKU link table + confidence | "Find matching SKUs", "Explain confidence" |
| Mercur product picker | HITL before link commit |

| Agent | HITL |
|-------|------|
| `product-linking` | Confirm each link (strands-crm proposal card) |

**Revenue tie:** Proof #8 — links creative work to commerce.

---

### D5 — Shoots Dashboard (`/dashboard/shoots`)

**Wireframe:** 02-shoots-dashboard

| Center | Right |
|--------|-------|
| Grid/list/calendar + DNA on cards | DNA alerts queue ("2 shoots need review") |
| Shoot cards with progress bars | Upcoming dates + quick stats |

| CopilotKit | Agent |
|------------|-------|
| `useCopilotReadable` — visible shoot summaries | `production-planner` |
| Pipeline state optional (Phase 2) | strands-crm kanban for shoot stages |

**AI upgrade:** Right panel **aggregates** DNA exceptions across shoots — center stays visual browse.

---

### D6 — Shoot Detail (`/dashboard/shoots/:id`)

**Wireframe:** 03-shoot-detail (7 tabs)

| Tab | AI assist (right panel) |
|-----|-------------------------|
| Overview | Risk flags, schedule conflicts |
| Shot list | Regenerate shot, explain coverage gap |
| Assets | DNA batch review |
| Crew | Call sheet gaps |
| Location | Map pins (travel-planner pattern) |
| Package | Link to D7 |
| Activity | Agent run log |

| CopilotKit | Agent |
|------------|-------|
| `useAgentContext` — tab + shootId | `production-planner` |
| `useCoAgent` — shot list draft (Advanced) | deep-agents todos |

---

### D7 — Production Package (`/dashboard/package`)

**Wireframe:** 10-production-package

| Center | Right |
|--------|-------|
| 8-document package viewer/editor | "Generate missing doc", section regen |
| Export actions | HITL sign-off before PDF/send |

| CopilotKit | Agent |
|------------|-------|
| `useRenderTool` — package preview cards | `production-planner` |
| `WorkflowTimeline` | `production-package` workflow |

---

### D8–D9 — Media Library & Content Calendar

| Dashboard | AI focus |
|-----------|----------|
| Media | Duplicate detection, channel fit scoring, batch DNA |
| Calendar | "Fill gaps next week", caption drafts, optimal post times |

| Agent | `content-planner` |

**Phase:** Post-MVP (after assets + links proofs).

---

### D10 — Analytics (`/dashboard/analytics`)

**Legacy alias:** `/dashboard/performance` (wireframe 06)  
**Linear:** IPI-97 · DASH-011 — D10 Analytics Scaffold

**Wireframe:** 06-performance-dashboard

| Center | Right |
|--------|-------|
| KPI cards + channel comparison + top assets | Top insight narrative + "Apply to next brief" |
| Creative temperature analysis | Recommendations list |

| CopilotKit | Agent | Pattern |
|------------|-------|---------|
| `useCoAgent<DashboardState>` | `analytics` | adk-generative-dashboard |
| `useCopilotReadable` — all visible metrics | | chat-with-your-data |
| Chart HITL | | `renderAndWaitForResponse` |

**Data dependency:** Mercur orders + `commerce_product_links` + asset DNA — ship after ANA-* tables.

**Generative upgrade:** User asks "show conversion by DNA tier" → agent proposes chart → user approves → chart persists in center panel.

---

### D11–D12 — Brief Creator & Canvas (deferred MVP)

`prd.md` defers full 4-level brief wizard. When built:

| Pattern | Source |
|---------|--------|
| Section-by-section co-agent state | mastra-pm-canvas |
| `useCoAgent<LeanCanvasState>` | 8 sections in working memory |
| Right panel regenerates single section | `creative-director` |

---

## 5. Three-panel component map

| Panel | Shared components | Dashboard-specific |
|-------|-------------------|-------------------|
| **Left** (240–280px) | `BrandSwitcher`, `OperatorNav`, route filters | Shoot status filters, date range, channel filters |
| **Center** (flex) | `PageHeader`, `EmptyState`, `DataGrid` | `ShootCardGrid`, `DnaAssetGrid`, `IntelligenceReport`, `ChartGrid` |
| **Right** (320–380px) | `OperatorCopilotPanel`, `ContextCard`, `QuickActionChips`, `CopilotChat` | `DnaAlertStack`, `SuggestionList`, `ApprovalCard`, `WorkflowTimeline` |

**Layout source of truth:** `tasks/wireframes-ipix/new/` + `copilotkit-operator-ui.md`

```tsx
// Target: src/layouts/DashboardLayout.tsx
<DashboardLayout>
  <LeftNav />           {/* L: context */}
  <Outlet />            {/* M: route dashboard */}
  <OperatorCopilotPanel agentId={routeAgent} />  {/* R: intelligence */}
</DashboardLayout>
```

---

## 6. Static vs AI-native — comparison

| Capability | Static dashboard | AI-native dashboard |
|------------|------------------|-------------------|
| KPIs | Fixed queries | `useCopilotReadable` + agent explains delta |
| Alerts | Badge counts | Prioritized queue with root cause + action |
| Empty states | Copy + CTA button | Agent-initiated workflow ("Paste URL") |
| Filters | Manual only | Suggested filters from context |
| Charts | Pre-built only | Generative + HITL confirm (performance) |
| Editing | Forms only | Form + chat co-edit + approval |
| Navigation | Click nav | Agent `navigateTo` + deep links from chat |
| Learning | None | Observational memory (Advanced) — "you prefer golden hour" |

---

## 7. Phased rollout

### Phase A — Core (no CopilotKit)

| Deliverable | Dashboards |
|-------------|--------------|
| UI-001 `DashboardLayout` 3-panel | All routes |
| Static right panel placeholder | "Intelligence coming soon" |
| D1 Brand Intake form → edge | D1 |
| D3 asset grid (static DNA badges) | D3 |

**AI:** Edge functions only. Right panel is **UX shell** for future CopilotKit.

### Phase B — MVP+ (CopilotKit + Mastra)

| Deliverable | Dashboards |
|-------------|--------------|
| AIOR-002 CopilotKit panel | All `/dashboard/*` |
| `useAgentContext` global | All |
| Brand workflow + approval | D1, D2 |
| DNA explain tool | D3 |
| Product link HITL | D4 |
| `useCopilotReadable` on D0 | D0 |

### Phase C — Advanced

| Deliverable | Dashboards |
|-------------|--------------|
| Generative performance charts | D10 |
| `useCoAgent` canvas + shot list | D6, D12 |
| Shoot pipeline kanban | D5 |
| Supervisor "plan my season" | D0 |
| Location map co-agent | D6 location tab |

---

## 8. Implementation tasks (dashboard-specific)

### 8.1 Linear DASH-001→012 map (executable specs)

| Linear | File | Plan task # | Dashboard | Phase |
|--------|------|-------------|-----------|-------|
| DASH-001 | [`IPI-91`](../../linear/issues/IPI-91-DASH-001.md) | 3 | All — right panel shell | A |
| DASH-002 | [`IPI-92`](../../linear/issues/IPI-92-DASH-002.md) | 4 | D0 Command Center KPIs | A |
| DASH-003 | [`IPI-93`](../../linear/issues/IPI-93-DASH-003.md) | 6 | D2 Intelligence Report | A |
| DASH-004 | [`IPI-94`](../../linear/issues/IPI-94-DASH-004.md) | 10 | All — L1 context | B |
| DASH-005 | [`IPI-95`](../../linear/issues/IPI-95-DASH-005.md) | 11 | All — route agents | B |
| DASH-006 | [`IPI-96`](../../linear/issues/IPI-96-DASH-006.md) | 12 | D1, D2 — HITL | B |
| DASH-007 | [`IPI-97`](../../linear/issues/IPI-97-DASH-007.md) | 13 | D3 DNA explain | B |
| DASH-008 | [`IPI-98`](../../linear/issues/IPI-98-DASH-008.md) | 14 | D4 product links | B |
| DASH-009 | [`IPI-99`](../../linear/issues/IPI-99-DASH-009.md) | 15 | D0 readable KPIs | B |
| DASH-010 | [`IPI-100`](../../linear/issues/IPI-100-DASH-010.md) | 16 | D5 Shoots grid | A/B |
| DASH-011 | [`IPI-101`](../../linear/issues/IPI-101-DASH-011.md) | 17 | D10 analytics | C |
| DASH-012 | [`IPI-102`](../../linear/issues/IPI-102-DASH-012.md) | 18 | D10 generative charts | C |

**UI shell (prerequisite):** UI-001→004 in [`IPI-22`–`IPI-25`](../../linear/issues/) map to tasks #1–2, #5, #7–8.

**Doc rule:** Every new dashboard Linear issue must cite this file + include L1–L5 columns from §3 and center/right split from §4.

### 8.2 Task list

| # | Task | Deps | Effort |
|---|------|------|--------|
| 1 | `DashboardLayout` + nested routes | PLT-002 auth | M |
| 2 | `OperatorNav` + `BrandSwitcher` | 1 | S |
| 3 | `OperatorCopilotPanel` placeholder | 1 | S |
| 4 | D0 Command Center KPIs (static) | 1 | M |
| 5 | D1 Brand Intake page | AI-001, 1 | M |
| 6 | D2 Intelligence Report view | 5 | M |
| 7 | D3 Assets grid + DNA badges | DNA-001, 1 | L |
| 8 | D4 Product Links screen | COM-034, 1 | M |
| 9 | CopilotKit provider + proxy | AIOR-001/002 | M |
| 10 | `useAgentContext` in layout | 9 | S |
| 11 | Route `agentId` map | 9 | S |
| 12 | D1/D2 approval cards + timeline | AIOR-003, 9 | L |
| 13 | D3 `explainDnaScore` tool UI | 9, 7 | M |
| 14 | D4 link approval cards | 9, 8 | M |
| 15 | D0 `useCopilotReadable` KPIs | 9, 4 | S |
| 16 | D5 Shoots grid | 1 | L |
| 17 | D10 analytics scaffold | ANA-*, 9 | L |
| 18 | D10 generative charts HITL | 17, AIOR-008 | L |

---

## 9. Anti-patterns

| Don't | Do instead |
|-------|------------|
| Replace center forms with chat-only | Form stays primary; chat assists |
| Auto-save agent output | HITL on every persist |
| One mega-agent for all routes | Route-default agents + supervisor later |
| Build all 15 dashboards before D1–D4 proofs | MVP dashboards first |
| Embed Gemini keys in Vite | Agent server + edge only |
| Copy FashionOS Events/CRM dashboards | iPix MVP = brand → shoot → commerce |

---

## 10. Success metrics

| Metric | Target |
|--------|--------|
| Time URL → approved profile | < 10 min (vs 2+ hrs manual) |
| DNA blocked → explained | < 30 sec via right panel |
| Critical issue → action from D0 | < 30 sec (plan/01-foundation goal) |
| Chat context accuracy | Agent cites visible KPIs without user re-typing |
| HITL bypass rate | 0% on production writes |

---

## 11. Dashboard Doc Compliance Template

Copy into **every** dashboard wireframe, Linear UI/DASH issue, and plan section:

```markdown
## {Dashboard Name}

| Field | Value |
|-------|-------|
| **Route** | `{canonical route}` |
| **Wireframe** | `{file}.md` |
| **Linear task** | IPI-XXX · TASK-ID — Full Task Name |
| **Phase** | MVP \| Advanced \| Deferred |
| **Default agent** | `{agent-id}` |
| **Plan ref** | `02-ai-native-dashboards-plan.md` §4 |

### Panel contract

| Panel | Purpose |
|-------|---------|
| **Center** | Human-first workspace (forms, grids, editors) |
| **Right** | AI insight, recommendations, approvals |

| Center panel | Right panel (intelligence) |
|--------------|----------------------------|
| {primary work UI} | {proactive queue, chat, tool cards} |

### AI-Native Dashboard Compliance

| Layer | Required? | Implementation |
|-------|-----------|----------------|
| L1 Context | Yes | `useCopilotReadable` / `useAgentContext` |
| L2 Proactive Suggestions | Yes | Right panel recommendations |
| L3 Chat | Yes | CopilotKit assistant (Phase B+; placeholder in UI-001) |
| L4 Generative UI | Optional for MVP | Cards / tool results in right panel |
| L5 HITL | Required for writes | Approval card before save / send / publish |

### L1–L5 checklist (this dashboard)

| Layer | This dashboard |
|-------|----------------|
| L1 Context | `useAgentContext`: … · `useCopilotReadable`: … |
| L2 Proactive | … |
| L3 Chat | `agentId`: … |
| L4 Generative | … (or N/A) |
| L5 HITL | Writes: … · Approval surface: … |

### HITL requirement

| Action | Approval surface |
|--------|------------------|
| {write action} | {inline form / modal / chat card} |

### Edge vs Mastra (Phase A vs B)

| Action | Path |
|--------|------|
| {primary AI action} | POST `/functions/v1/{edge-slug}` (as-built) OR Mastra tool `{name}` (target) |

### Required evidence (verifier / PR)

- [ ] Route registered in `App.tsx` / router config
- [ ] 3-panel layout: left nav · center · right intelligence shell
- [ ] Center = human workspace; right = intelligence placeholder
- [ ] L1 context fields documented (even if stubbed)
- [ ] HITL documented for any write path
- [ ] Screenshot or browser check at canonical route

### Verification commands

\`\`\`bash
npm run build
npm run test
# Optional when UI exists:
# npm run dev — navigate to {canonical route}
\`\`\`
```

**Route rule:** Use §2 canonical routes only. Wireframe paths that differ → legacy alias table in §2, not a third route.

**Task ID format:** `IPI-XXX · TASK-ID — Full Task Name` (e.g. `IPI-22 · UI-001 — Operator Hub Shell`).

---

## 12. As-built vs target

### As-built (post PR #3 — platform foundation)

| Item | Status |
|------|--------|
| Supabase migrations, auth, RLS | ✅ PLT-001–002 |
| Edge scaffold + env validation | ✅ PLT-003–004 |
| Edge `brand-intelligence` | ✅ `gemini-2.5-flash` |
| Edge `health`, `edge-test` | ✅ |
| Operator Hub shell (3-panel + routes) | ❌ UI-001 next |
| Mastra `services/agent/` | ❌ AIOR-001 |
| CopilotKit in Vite | ❌ AIOR-002 |
| HITL approval cards | ❌ DASH-006+ |
| Agent memory | ❌ AIOR-005+ |

### Target architecture

| Item | Task |
|------|------|
| Gemini 3.5 default | AI-009 · AI-018 |
| Mastra orchestration | AIOR-001 |
| CopilotKit assistant | AIOR-002 · DASH-001 |
| HITL approval cards | DASH-006, DASH-008 |
| Agent memory | AIOR-005 |

**Operator Hub shell is separate from AI runtime** — UI-001 can ship layout + placeholders without CopilotKit/Mastra.

---

## 13. As-built appendix (2026-06-14)

| Item | Shipped | Notes |
|------|---------|-------|
| Edge `brand-intelligence` | ✅ | Model `gemini-2.5-flash`; not `enrich-brand` |
| Edge `health`, `edge-test` | ✅ | Smoke + liveness |
| Edge `audit-asset-dna` | ❌ | DNA-001 / AI-010 |
| `_shared/gemini.ts` | ❌ | AI-009 target |
| `config.toml` | ✅ | `health`, `edge-test`, `brand-intelligence` |
| Mastra `services/agent/` | ❌ | AIOR-001 |
| CopilotKit in Vite | ❌ | AIOR-002 |
| Model target (AI-018) | — | `gemini-3.5-flash` per `gemeni-plan.md` |

---

## References

- [`copilotkit-operator-ui.md`](./copilotkit-operator-ui.md)
- [`../01-copilotkit-mastra-implementation-plan.md`](../01-copilotkit-mastra-implementation-plan.md)
- [`../../../tasks/wireframes-ipix/new/09-chat-panel.md`](../../../tasks/wireframes-ipix/new/09-chat-panel.md)
- CopilotKit: `chat-with-your-data`, `strands-crm`, `adk-generative-dashboard`
- Linear: [IPI-22](https://linear.app/ipix/issue/IPI-22) (UI-001), [IPI-23](https://linear.app/ipix/issue/IPI-23) (UI-002), [IPI-24](https://linear.app/ipix/issue/IPI-24) (UI-003), [IPI-25](https://linear.app/ipix/issue/IPI-25) (UI-004), [IPI-82](https://linear.app/ipix/issue/IPI-82) (AIOR-002), [IPI-91–102](https://linear.app/ipix/view/all-issues-a48540fcf640) (DASH-001–012)
