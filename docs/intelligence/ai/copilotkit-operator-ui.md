---
title: "CopilotKit Operator Hub UI Plan"
version: "1.2"
lastUpdated: "2026-06-14"
status: "Active"
purpose: "CopilotKit v2 integration in iPix 3-panel Operator Hub"
relatedDocs:
  - 02-ai-native-dashboards-plan.md
  - mastra-copilotkit-plan.md
  - mastra-workflows.md
  - ../../tasks/wireframes-ipix/new/00-index.md
---

# CopilotKit Operator Hub UI Plan

**Layout:** UI-001 three-panel — **Left** context nav · **Main** work surface · **Right** Intelligence (CopilotKit target)

**Stack:** Vite React · `@copilotkit/react-core/v2` (target) · Mastra agent server proxy (target)

**Route source of truth:** [`02-ai-native-dashboards-plan.md`](./02-ai-native-dashboards-plan.md) §2

---

## PR sequencing (docs — not Linear sync in this pass)

| PR | Linear task | Scope | Status |
|----|-------------|-------|--------|
| **#3** | PLT-001–004 + AI-001 | Platform foundation: migrations, auth, edge scaffold, env validation, `brand-intelligence` | **Shipped** |
| **#4** | IPI-22 · UI-001 — Operator Hub Shell | 3-panel layout, left nav, canonical routes, placeholder pages, right intelligence **shell** (no CopilotKit) | **Target** |
| **#5** | IPI-23 · UI-002 — Brand Intake Screen | Brand intake form + edge `brand-intelligence` | **Target** (do not start until UI-001 merges) |

**Mastra/CopilotKit is target architecture** — not fully wired unless repo contains `services/agent/` + CopilotKit provider. As-built: edge-only AI via `brand-intelligence`.

---

## As-built vs target

| | As-built (PR #3) | Target |
|---|------------------|--------|
| **Edge AI** | `brand-intelligence` · `gemini-2.5-flash` | Gemini 3.5 via `_shared/gemini.ts` (AI-009) |
| **UI** | Single `/dashboard` placeholder | UI-001 shell + canonical nested routes |
| **Mastra** | Not present | AIOR-001 |
| **CopilotKit** | Not in Vite | AIOR-002 · DASH-001 |
| **HITL** | N/A | DASH-006+ approval cards |
| **Memory** | N/A | AIOR-005 |

Operator Hub **shell** (layout, nav, routes) ships independently of AI runtime.

---

## Canonical routes (MVP — UI-001)

Implement **only** these routes for the operator shell. No extra paths.

| Route | Dashboard | Main panel | Intelligence focus | Default agent | Linear task |
|-------|-----------|------------|-------------------|---------------|-------------|
| `/dashboard` | D0 Command Center | KPIs + critical path (placeholder) | “What should I do next?” | `brand-intelligence` | IPI-22 · UI-001 — Operator Hub Shell |
| `/dashboard/brand` | D1 Brand | Intelligence report / brand hub | Gap narrative, re-analyze | `brand-intelligence` | IPI-18 · AI-001 (edge) |
| `/dashboard/brand/intake` | D1b Brand Intake | URL form + profile editor | Analyze URL, citations | `brand-intelligence` | IPI-23 · UI-002 — Brand Intake Screen |
| `/dashboard/assets` | D3 Assets + DNA | Upload + DNA grid | Explain blocked assets | `asset-dna` | IPI-24 · UI-003 — Asset Library Screen |
| `/dashboard/assets/:assetId` | D3b Asset Detail | Asset viewer + DNA pillars | “Why blocked?” | `asset-dna` | (UI-003) |
| `/dashboard/products` | D4 Products | Product hub (placeholder) | Link suggestions | `product-linking` | — |
| `/dashboard/products/links` | D4b Product Links | Link table + confidence | HITL link confirm | `product-linking` | IPI-25 · UI-004 — Product Links Screen |
| `/dashboard/analytics` | D10 Analytics | KPI + channel comparison | Top insight narrative | `analytics` | IPI-97 · DASH-011 — D10 Analytics Scaffold |
| `/dashboard/settings` | D16 Settings | Org / account settings | — | — | TBD |

**UI-001 scope:** Left navigation · center workspace · right intelligence panel · responsive layout · **placeholder** center content for rows above. **No** CopilotKit provider · **no** Brand Intake logic · **no** DNA · **no** new backend.

---

## Legacy / wireframe aliases

Do **not** implement these as primary routes in UI-001. Map in router redirects or document only.

| Legacy / wireframe path | Canonical route |
|-------------------------|-----------------|
| `/dashboard/brand/new` | `/dashboard/brand/intake` |
| `/dashboard/brands/:id/assets` | `/dashboard/assets` (future `?brandId=`) |
| `/dashboard/brands/:id/products` | `/dashboard/products` |
| `/dashboard/intelligence/:id` | `/dashboard/brand` |
| `/dashboard/media` | `/dashboard/assets` |
| `/dashboard/performance` | `/dashboard/analytics` |

---

## Deferred routes (post-MVP)

Not in UI-001. See `02-ai-native-dashboards-plan.md` §2 deferred table.

Examples: `/dashboard/shoots`, `/dashboard/shoots/:id`, `/dashboard/package`, `/dashboard/brief`, `/dashboard/canvas`, `/dashboard/calendar`, `/dashboard/network`, `/dashboard/triage`.

---

## Provider Setup (target — AIOR-002)

```tsx
// src/layouts/DashboardLayout.tsx — Phase B+, not UI-001
import { CopilotKit } from "@copilotkit/react-core/v2";
import { OperatorCopilotPanel } from "@/components/intelligence/OperatorCopilotPanel";

export function DashboardLayout() {
  return (
    <CopilotKit
      runtimeUrl={import.meta.env.VITE_COPILOTKIT_RUNTIME_URL ?? "/api/copilotkit"}
      useSingleEndpoint={false}
      agentId="brand-intelligence"
    >
      <div className="flex h-screen">
        <LeftNav />
        <main className="flex-1 overflow-auto">{/* <Outlet /> */}</main>
        <aside className="w-[380px] border-l border-border">
          <OperatorCopilotPanel />
        </aside>
      </div>
    </CopilotKit>
  );
}
```

**UI-001:** Use static `OperatorIntelligencePanel` placeholder — no `CopilotKit` wrapper yet.

---

## Route → agentId map (target — DASH-005)

| Route prefix | Default `agentId` |
|--------------|-------------------|
| `/dashboard/brand` | `brand-intelligence` |
| `/dashboard/assets` | `asset-dna` |
| `/dashboard/products` | `product-linking` |
| `/dashboard/analytics` | `analytics` |
| `/dashboard/shoots` (deferred) | `production-planner` |

---

## Compliance

Every dashboard spec must include §11 template from [`02-ai-native-dashboards-plan.md`](./02-ai-native-dashboards-plan.md):

- Panel contract (center = human · right = intelligence)
- L1–L5 checklist
- HITL for writes
- Verification: `npm run build` · `npm run test`

---

## Checklist (UI-001 PR)

- [ ] Routes match **Canonical routes** table above  
- [ ] Center panel = human workspace; right = intelligence placeholder  
- [ ] Auth + Supabase session from existing stack  
- [ ] No CopilotKit · no Mastra · no Brand Intake · no DNA backend  
- [ ] `npm run build` · `npm run test` pass  

---

## References

- [`02-ai-native-dashboards-plan.md`](./02-ai-native-dashboards-plan.md)
- [`09-chat-panel.md`](../../tasks/wireframes-ipix/new/09-chat-panel.md)
- Linear: [IPI-22](https://linear.app/ipix/issue/IPI-22), [IPI-23](https://linear.app/ipix/issue/IPI-23), [IPI-91–102](https://linear.app/ipix/view/all-issues-a48540fcf640)
