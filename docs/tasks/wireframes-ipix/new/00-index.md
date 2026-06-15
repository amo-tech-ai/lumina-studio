# iPix — Wireframe Index

**Version:** 1.1 | **Date:** June 14, 2026  
**Layout:** 3-panel (Context 240px | Work flex-1 | Intelligence 320px)  
**Design:** Cormorant Garamond headings + Outfit body. Warm neutral palette (`#FBF8F5`). Primary `#E87C4D`.

**Canonical routes:** [`02-ai-native-dashboards-plan.md`](../../intelligence/ai/02-ai-native-dashboards-plan.md) §2 · [`copilotkit-operator-ui.md`](../../intelligence/ai/copilotkit-operator-ui.md)

---

## Canonical MVP routes (UI-001)

| Route | Dashboard | Wireframe | Linear task |
|-------|-----------|-----------|-------------|
| `/dashboard` | Command Center | (derived) | IPI-22 · UI-001 — Operator Hub Shell |
| `/dashboard/brand` | Brand hub / report | 08 | IPI-18 · AI-001 — Brand Intelligence Agent |
| `/dashboard/brand/intake` | Brand intake wizard | W2 | IPI-23 · UI-002 — Brand Intake Screen |
| `/dashboard/assets` | Assets + DNA | 04, 11 | IPI-24 · UI-003 — Asset Library Screen |
| `/dashboard/assets/:assetId` | Asset detail | 04 | (UI-003) |
| `/dashboard/products` | Products hub | — | — |
| `/dashboard/products/links` | Product links | — | IPI-25 · UI-004 — Product Links Screen |
| `/dashboard/analytics` | Analytics | 06 | IPI-97 · DASH-011 — D10 Analytics Scaffold |
| `/dashboard/settings` | Settings | — | TBD |

---

## Route aliases (wireframe label → canonical)

| Wireframe | Wireframe route (label) | Canonical route |
|-----------|-------------------------|-----------------|
| W2 Brand Setup | `/dashboard/brand/new` | `/dashboard/brand/intake` |
| 04 Media Library | `/dashboard/media` | `/dashboard/assets` |
| 08 Brand Intelligence | `/dashboard/intelligence/:id` | `/dashboard/brand` |
| 06 Performance | `/dashboard/performance` | `/dashboard/analytics` |
| 10 Production Package | `/dashboard/shoots/:id/package` | **Deferred** `/dashboard/package` |
| 11 Upload Triage | `/dashboard/shoots/:id/upload` | **Deferred** (flows into `/dashboard/assets`) |
| 02–03 Shoots | `/dashboard/shoots` … | **Deferred** post-MVP |

Legacy nested paths (`/dashboard/brands/:id/assets`) → `/dashboard/assets` until multi-brand scope.

---

## Wireframe Files

| # | Screen | File | Phase | Priority | MVP route |
|---|--------|------|-------|----------|-----------|
| 01 | Brief Creator (4 levels) | `01-brief-creator.md` | Deferred | P1 | `/dashboard/brief` |
| 02 | Shoots Dashboard | `02-shoots-dashboard.md` | Deferred | P0 | `/dashboard/shoots` |
| 03 | Shoot Detail (7 tabs) | `03-shoot-detail.md` | Deferred | P0 | `/dashboard/shoots/:id` |
| 04 | Media Library | `04-media-library.md` | MVP | P0 | `/dashboard/assets` |
| 05 | Content Calendar | `05-content-calendar.md` | Deferred | P1 | `/dashboard/calendar` |
| 06 | Performance Dashboard | `06-performance-dashboard.md` | Advanced | P1 | `/dashboard/analytics` |
| 07 | Professional Network | `07-professional-network.md` | Deferred | P1 | `/dashboard/network` |
| 08 | Brand Intelligence Report | `08-brand-intelligence.md` | MVP | P0 | `/dashboard/brand` |
| 09 | Chat & Intelligence Panel | `09-chat-panel.md` | Core | P0 | (right panel all routes) |
| 10 | Production Package Viewer | `10-production-package.md` | Deferred | P0 | `/dashboard/package` |
| 11 | Upload & Triage | `11-upload-triage.md` | Post-MVP | P1 | `/dashboard/assets` |
| 12 | Photographer Dashboard | `12-photographer-dashboard.md` | Post-MVP | P2 | `/dashboard/photographer` |
| W1 | Shoot Wizard (5 steps) | `W1-shoot-wizard.md` | Deferred | P0 | — |
| W2 | Brand Setup Wizard | `W2-brand-setup.md` | MVP | P0 | `/dashboard/brand/intake` |
| W3 | Canvas Onboarding | `W3-canvas-onboarding.md` | Deferred | P1 | `/dashboard/canvas` |
| W4 | Event Wizard | `W4-event-wizard.md` | Post-MVP | P2 | — |

**Compliance:** MVP dashboard wireframes (04, 06, 08, W2) include § AI-Native Dashboard Compliance per `02-ai-native-dashboards-plan.md` §11.
