# Design HTML → React route map

**Design SSOT folder:** `/home/sk/ipix/Universal design prompt/`

## P0 MVP screens (current skill scope)

| HTML file | React route | Page file | Workspace components (typical) |
|-----------|-------------|-----------|--------------------------------|
| `Command Center.v2.image-first.dc.html` | `/app` | `app/src/app/(operator)/app/page.tsx` | `components/command-center/*` |
| `Brand List.v2.image-first.dc.html` | `/app/brand` | `app/src/app/(operator)/app/brand/page.tsx` | `components/brand-hub/*`, `brand-list-*` |
| `Brand Detail.v2.image-first.dc.html` | `/app/brand/[id]` | `app/src/app/(operator)/app/brand/[id]/page.tsx` | `components/brand-hub/brand-hub-client.tsx` or workspace |

## Shell — do NOT reimplement in parity PRs

| DC import | Production (already shipped) |
|-----------|------------------------------|
| `OperatorShell.dc.html` | `components/operator-panel/operator-panel.tsx` |
| `NavSidebar.dc.html` | `components/operator-panel/nav-sidebar.tsx` |
| `IntelligencePanel.dc.html` | `components/intelligence-panel/intelligence-panel.tsx` |
| `PersistentChatDock.dc.html` | CopilotKit chat dock in operator shell |

Parity work targets the **center workspace column** only unless explicitly scoped.

## Extended map (defer unless requested)

| HTML file | React route |
|-----------|-------------|
| `Shoots List.v2.image-first.dc.html` | `/app/shoots` |
| `Shoot Detail.v2.image-first.dc.html` | `/app/shoots/[shootId]` |
| `Shoot Wizard.v2.image-first.dc.html` | `/app/shoots/new` |
| `Assets.v2.image-first.dc.html` | `/app/assets` |
| `Campaigns.v2.image-first.dc.html` | `/app/campaigns` |
| `Matching.v2.image-first.dc.html` | `/app/matching` |
| `Channel Preview.v2.image-first.dc.html` | `/app/preview` |
| `Onboarding.v2.zeely.dc.html` | `/app/onboarding` |
| `Analytics.v2.image-first.dc.html` | **no route yet** — greenfield build, not a parity port |
| `Campaign Performance.v2.image-first.dc.html` | **no route yet** — greenfield build, not a parity port |

Current build status for every screen above (verified %, what's built, what's missing): [`tasks/design-docs/progess.md`](../../../../tasks/design-docs/progess.md).

## DC reference server (optional)

```bash
# From repo root — serve Universal design prompt for side-by-side
python3 -m http.server 8765 --directory "Universal design prompt"
# DC: http://localhost:8765/Command%20Center.v2.image-first.dc.html
# React: http://localhost:3002/app (infisical run -- cd app && npm run dev)
```

## Evidence paths

```text
docs/qa/screenshots/YYYY-MM-DD/      # docs/qa/ does not exist yet — mkdir -p before first use
docs/qa/design-parity-checklist.md   # per-PR QA (create on branch)
tasks/design-docs/implementation/brand/parity-audit.md
tasks/design-docs/progess.md         # current verified parity % per screen — check before scoping work
```
