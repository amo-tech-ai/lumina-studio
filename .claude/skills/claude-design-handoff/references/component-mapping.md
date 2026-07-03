# Component Mapping — Design Element → iPix Target

**When to read:** mapping design elements to the iPix stack before building anything new.

**Rule:** reuse before extending; extend before building new.

**Claude Design export:** also read [`zeely-v3-dc-library.md`](zeely-v3-dc-library.md) and `Universal design prompt/components/COMPONENTS.md`.

---

## Full mapping table

| Design Element | DC Source (prototype) | iPix React Target | File path | dc-import on screens |
|---------------|----------------------|-------------------|-----------|----------------------|
| **Shell** | | | | |
| 3-panel shell | `components/OperatorShell.dc.html` | OperatorShell layout | `operator-panel.tsx` | New screens template |
| Nav sidebar | `components/NavSidebar.dc.html` | NavSidebar | `nav-sidebar.tsx` | Via OperatorShell |
| Intelligence panel | `components/IntelligencePanel.dc.html` | IntelligencePanel | **build** (replaces CopilotSidebar slot) | Via OperatorShell |
| AI chat dock | `components/PersistentChatDock.dc.html` | PersistentChatDock | **build** + CopilotKit | All panel screens |
| Page header | `components/PageHeader.dc.html` | PageHeader | **build** | List/detail screens |
| **Cards** | | | | |
| Brand card | `components/BrandCard.dc.html` | BrandCard | **build** | Brand List |
| Shoot card | `components/ShootCard.dc.html` | ShootCard | **build** | Shoots List |
| Campaign card | `components/CampaignCard.dc.html` | CampaignCard | **build** | Campaigns |
| Asset card | `components/AssetCard.dc.html` | AssetCard | **build** | Assets, Brand Detail, Shoot Detail |
| **AI / HITL** | | | | |
| Approval card | `components/ApprovalCard.dc.html` | ApprovalCard | `brand-hub/approval-card.tsx` | Command Center, Shoot Detail |
| Agent status | `components/AgentStatusIndicator.dc.html` | AgentStatusIndicator | **build** | Dock, intel panel |
| Evidence block | — (inline Brand Detail) | EvidenceBlock | **build** | Brand Detail |
| Suggestion chips | inline / dock | SuggestionChips | CopilotKit + dock | Workspace dock |
| **Input / filter** | | | | |
| Search bar | `components/SearchBar.dc.html` | SearchBar | **build** | Brand List, Shoots List |
| Filter bar | `components/FilterBar.dc.html` | FilterBar | **build** | Shoots, Assets, Brand List |
| Wizard step | `components/WizardStep.dc.html` | WizardStep | **build** | Shoot Wizard |
| **Feedback** | | | | |
| Status chip | `components/StatusChip.dc.html` | StatusChip | Badge variants | Matching, Shoot Detail, cards |
| Skeleton | `components/SkeletonLoader.dc.html` | Skeleton layouts | `ui/skeleton.tsx` | All loading states |
| Empty state | `components/EmptyState.dc.html` | EmptyState | **build** | All empty states |
| **Mobile** | | | | |
| Bottom tabs | `components/BottomNavigation.dc.html` | MobileTabBar | **build** | All panel ≤1024px |
| Bottom sheet | `components/BottomSheet.dc.html` | BottomSheet | `ui/sheet.tsx` extend | Intel / More / filters |
| **shadcn primitives** | | | | |
| Button | — | Button | `ui/button.tsx` | default / outline / ghost / destructive |
| Card | — | Card | `ui/card.tsx` | All card surfaces |
| Badge | — | Badge | `ui/badge.tsx` | |
| Input | — | Input | `ui/input.tsx` | |
| Select | — | Select | `ui/select.tsx` | |
| Tabs | — | Tabs | `ui/tabs.tsx` | |
| Dialog | — | Dialog | `ui/dialog.tsx` | |
| Sheet | — | Sheet | `ui/sheet.tsx` | |
| Sonner | — | Sonner | `ui/sonner.tsx` | |
| Progress | — | Progress | `ui/progress.tsx` | DNA bars |
| Separator | — | Separator | `ui/separator.tsx` | |

**Gallery:** `Universal design prompt/Component Library.dc.html`

---

## dc-import usage

```html
<dc-import name="components/BrandCard"
  title="{{ b.name }}"
  on-open="{{ b.open }}"
  hint-size="100%,320px">
</dc-import>
```

When porting to React: match props documented in `COMPONENTS.md` (variants: `compact`, `bare`, `tile`, `masonry`, etc.).

---

## Decision tree

```
Design element
  │
  ├─ Exists in components/*.dc.html?
  │   └─ Yes → Port DC spec to React (Phase C) or dc-import in prototype work
  │
  ├─ Exists in app/src/components/?
  │   └─ Yes → Reuse (Phase A) or Extend (Phase B)
  │
  ├─ Covered by shadcn/ui primitive?
  │   └─ Yes → Phase A
  │
  └─ New → Phase C; add row to this table when done
```

**Bespoke screens (do not blind library swap):** Matching, Brand Detail HITL, Command Center image HITL, Shoot Wizard, Shoot Detail — see COMPONENTS.md refactor status.

---

## iPix stack summary

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 App Router |
| Styling | Tailwind v4 + semantic tokens |
| UI | shadcn/ui at `app/src/components/ui/` |
| AI | Mastra + Gemini (server only) |
| Chat | CopilotKit 1.61.0 `/v2` |
| Database | Supabase + RLS |
| Tokens | `app/src/styles/tokens.css` |
| Fonts | **Inter** (UI) + **Geist Mono** (data) |
| Design | v3 Zeely Editorial — light mode only |

---

## Anti-patterns

| Anti-pattern | Use instead |
|-------------|-------------|
| Warm off-white `#FBF8F5` page | `--color-bg-page` white |
| Orange `#E87C4D` primary CTA | `--color-action` black |
| Geist Sans body | Inter |
| HITL amber fill background | White card + amber hairline |
| Hardcoded hex | Semantic token |
| `@copilotkit/react-core` (v1) | `/v2` subpath |
| Dark mode | Never |
| Gradients / heavy shadows | Hairline borders |
| Spinners for content load | Skeleton layouts |
| Inline approve buttons outside ApprovalCard | ApprovalCard only |
| Detail workspace in right panel | Center workspace only |
