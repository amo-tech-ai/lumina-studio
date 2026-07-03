# Zeely Editorial v3 — Claude Design Component Library

**When to read:** handoff from a Claude Design HTML export that includes `components/` and `*.v2*.dc.html` screen prototypes.

**Visual language:** v3 **Zeely Editorial** — pure white / grey / charcoal / black, **Inter** UI font, **black** primary actions, image-first editorial photography, persistent AI chat dock. Orange and warm off-white (v2 Atelier) are **retired**.

---

## Design project locations

| Artifact | Primary path | Mirror (if synced) |
|----------|--------------|-------------------|
| Screen prototypes | `Universal design prompt/*.v2*.dc.html` | `app/design/` |
| Component library | `Universal design prompt/components/` | — |
| Component spec | `Universal design prompt/components/COMPONENTS.md` | — |
| Live gallery | `Universal design prompt/Component Library.dc.html` | — |
| Design SSOT | `Universal design prompt/DESIGN.md` | `app/DESIGN.md` |
| Tokens | `Universal design prompt/design-patched/tokens.css` | `app/src/styles/tokens.css` |
| Audit + completion | `Universal design prompt/checklist.md` | — |
| Handoff plan | `Universal design prompt/plan/` | — |

---

## Mandatory read order (Claude Design export)

```
1.  DESIGN.md
2.  components/COMPONENTS.md
3.  Component Library.dc.html          (skim gallery)
4.  checklist.md                       (audit + completion tracker)
5.  PLAN.md · todo.md · MOBILE-PLAN.md
6.  Target screen *.v2*.dc.html        (read full file, top to bottom)
7.  Every dc-import in that screen → components/*.dc.html
8.  app/src/components/               (production gap analysis)
9.  app/src/styles/tokens.css
```

---

## dc-import pattern

Screens embed shared components:

```html
<dc-import
  name="components/BrandCard"
  title="{{ b.name }}"
  on-open="{{ b.open }}"
  hint-size="100%,320px">
</dc-import>
```

**Rules:**
- `name` resolves relative to the **root screen document** (not the component file).
- Props are Tweaks-editable — see `COMPONENTS.md` per component.
- Nested imports inside `OperatorShell.dc.html` resolve the same way — preview `OperatorShell.dc.html` **directly**, not double-nested inside another DC.
- **New screens:** compose from `OperatorShell.dc.html` + library imports — do not copy-paste inline shell markup from legacy screens.

---

## Library index (19 components)

| Component | File | Used via dc-import on |
|-----------|------|----------------------|
| OperatorShell | `OperatorShell.dc.html` | **New screens** (template) |
| NavSidebar | `NavSidebar.dc.html` | Via OperatorShell |
| IntelligencePanel | `IntelligencePanel.dc.html` | Via OperatorShell |
| PersistentChatDock | `PersistentChatDock.dc.html` | Via OperatorShell / inline |
| PageHeader | `PageHeader.dc.html` | Via OperatorShell |
| BrandCard | `BrandCard.dc.html` | Brand List |
| ShootCard | `ShootCard.dc.html` | Shoots List |
| CampaignCard | `CampaignCard.dc.html` | Campaigns |
| AssetCard | `AssetCard.dc.html` | Assets, Brand Detail, Shoot Detail |
| ApprovalCard | `ApprovalCard.dc.html` | Command Center, Shoot Detail |
| AgentStatusIndicator | `AgentStatusIndicator.dc.html` | Library demo |
| SearchBar | `SearchBar.dc.html` | List screens |
| FilterBar | `FilterBar.dc.html` | List screens |
| WizardStep | `WizardStep.dc.html` | Shoot Wizard |
| StatusChip | `StatusChip.dc.html` | Matching, Shoot Detail |
| SkeletonLoader | `SkeletonLoader.dc.html` | All loading states |
| EmptyState | `EmptyState.dc.html` | All empty states |
| BottomNavigation | `BottomNavigation.dc.html` | Mobile ≤1024px |
| BottomSheet | `BottomSheet.dc.html` | Mobile intel / More / filters |

Full spec (anatomy, variants, do/don't): `components/COMPONENTS.md`.

---

## Intentionally NOT migrated (bespoke — do not blind swap)

Per `COMPONENTS.md` refactor status — these screens keep inline markup for verified behavior:

| Screen | Reason |
|--------|--------|
| Matching | Swipe deck + data table interactions |
| Brand Detail | Image-diff HITL, dotless chips |
| Command Center | Large image-preview HITL, dotless active chip |
| Shoot Wizard | 10-step AI planner + Review dashboard |
| Shoot Detail | 9-tab production workspace |

Extend library props first; migrate one screen at a time with parity verification.

---

## Operator screens (11 prototypes)

| # | Screen | Route | Prototype file |
|---|--------|-------|----------------|
| 01 | Command Center | `/app` | `Command Center.v2.image-first.dc.html` |
| 02 | Brand List | `/app/brand` | `Brand List.v2.image-first.dc.html` |
| 03 | Brand Detail | `/app/brand/[id]` | `Brand Detail.v2.image-first.dc.html` |
| 04 | Shoots List | `/app/shoots` | `Shoots List.v2.image-first.dc.html` |
| 4b | Shoot Detail | `/app/shoots/[id]` | `Shoot Detail.v2.image-first.dc.html` |
| 05 | Shoot Wizard | `/app/shoots/new` | `Shoot Wizard.v2.image-first.dc.html` |
| 06 | Campaigns | `/app/campaigns` | `Campaigns.v2.image-first.dc.html` |
| 07 | Assets | `/app/assets` | `Assets.v2.image-first.dc.html` |
| 08 | Onboarding | `/onboarding` | `Onboarding.v2.zeely.dc.html` (standalone — no shell) |
| 09 | Matching | `/app/matching` | `Matching.v2.image-first.dc.html` |
| 10 | Channel Preview | `/app/preview` | `Channel Preview.v2.image-first.dc.html` |

---

## Agent durability (UI pattern)

| Agent ID | Typical screens | Stream reconnect? |
|----------|-----------------|-------------------|
| `production-planner` | Command Center, Shoots, Shoot Detail, Wizard | ✅ Yes |
| `creative-director` | Campaigns | ✅ Yes |
| `brand-intelligence` | Brand List, Brand Detail, Onboarding | ❌ **Error + retry** — not durable |
| `visual-identity` | Assets, Channel Preview* | *Registered in Mastra; may fall back to production-planner in prod routing |
| `social-discovery` | Matching* | *Same |

Never show resumable-stream UI on `brand-intelligence` screens.

---

## Approval gates (checklist K/L)

Before building **new** prototype overlays or routes, confirm with the user:

| ID | Feature | Default recommendation |
|----|---------|------------------------|
| **K** | Asset lightbox overlay | Extend existing right-panel detail — no new modal |
| **L** | Standalone Campaign Detail | Keep right-panel detail — no new route unless full workspace needed |

See `checklist.md` §9 for completion phases E–L.

---

## v3 token quick reference

```
--color-bg-page       → #FFFFFF (pure white — not warm off-white)
--color-bg-card       → #FFFFFF
--color-border        → #E5E7EB (hairline)
--color-text-primary  → #111111
--color-action        → #111111 (black primary — orange retired)
--approval-border     → #F3B93C (HITL pending hairline only)
--approval-border-done→ #059669
--card-radius         → 1.25rem (20px)
Font UI               → Inter
Font numbers          → Geist Mono (tabular-nums)
```

HITL pending = **white card + amber hairline + dot** — not amber fill background.

---

## Production handoff

Map each `components/*.dc.html` → React in `app/src/components/operator/` (Phase C). See `references/component-mapping.md` DC column and `Universal design prompt/plan/COMPONENT-MAP.md`.

Prototype ✅ ≠ production shipped. IntelligencePanel exists in DCs; production may still use bare `CopilotSidebar` — check `operator-panel.tsx` before assuming parity.
