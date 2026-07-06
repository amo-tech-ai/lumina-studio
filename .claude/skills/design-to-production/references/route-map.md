# Design HTML → React route map

**Design SSOT:** `Universal design prompt/`

## P0 MVP screens

| HTML file | React route | Page file | Workspace components |
|-----------|-------------|-----------|----------------------|
| `Command Center.v2.image-first.dc.html` | `/app` | `app/src/app/(operator)/app/page.tsx` | `components/command-center/*` |
| `Brand List.v2.image-first.dc.html` | `/app/brand` | `app/src/app/(operator)/app/brand/page.tsx` | `components/brand-hub/*` |
| `Brand Detail.v2.image-first.dc.html` | `/app/brand/[id]` | `app/src/app/(operator)/app/brand/[id]/page.tsx` | `brand-hub-client.tsx` |

## P1 — Shoots (active parity queue)

| HTML file | React route | Page | Target components | Linear | Conversion plan |
|-----------|-------------|------|-------------------|--------|-----------------|
| **`Shoots List.v2.image-first.dc.html`** | **`/app/shoots`** | `app/.../shoots/page.tsx` | `shoots-list-workspace.tsx` · `shoots-list.module.css` · `ShootCard.tsx` · `loading.tsx` | **IPI-273** | [`shoots-list-dc-conversion.md`](../../../../tasks/design-docs/shoot/PLAN/shoots-list-dc-conversion.md) |
| `Shoot Detail.v2.image-first.dc.html` | `/app/shoots/[shootId]` | `app/.../shoots/[shootId]/page.tsx` | `shoot-detail-client.tsx` | IPI-274 | `shoot-detail-dc-conversion.md` |
| `Shoot Wizard.v2.image-first.dc.html` | `/app/shoots/new` | `app/.../shoots/new/page.tsx` | wizard steps | IPI-248+ | shoot PRD |

**DC measurements (Shoots List workspace):** max-width **920px** · grid **3× gap 20px** · card **4:3** · header pad **28px 40px 0**.

**Current gap:** `page.tsx` is legacy client page (hex colors, 4-col grid, no `loading.tsx`) — full audit in `tasks/design-docs/audit/05-skills-improve.md`.

## Shell — do NOT reimplement

| DC import | Production |
|-----------|------------|
| `OperatorShell.dc.html` | `operator-panel/operator-panel.tsx` |
| `NavSidebar.dc.html` | `nav-sidebar.tsx` |
| `IntelligencePanel.dc.html` | `intelligence-panel/intelligence-panel.tsx` |
| `PersistentChatDock.dc.html` | CopilotKit dock in shell |

Parity = **`main[data-screen-label="Workspace"]`** only.

## Extended map (defer unless requested)

| HTML file | React route |
|-----------|-------------|
| `Assets.v2.image-first.dc.html` | `/app/assets` |
| `Campaigns.v2.image-first.dc.html` | `/app/campaigns` |
| `Matching.v2.image-first.dc.html` | `/app/matching` |
| `Channel Preview.v2.image-first.dc.html` | `/app/preview` |
| `Onboarding.v2.zeely.dc.html` | `/app/onboarding` |

## DC reference server

```bash
python3 -m http.server 8765 --directory "Universal design prompt"
# http://localhost:8765/Shoots%20List.v2.image-first.dc.html
# React: http://localhost:3002/app/shoots
```

## Evidence paths

```text
docs/qa/screenshots/YYYY-MM-DD/<screen>/
tasks/design-docs/shoot/PLAN/shoots-list-dc-conversion.md  # §6 parity matrix
e2e/shoots-list.spec.ts
```
