# iPix / FashionOS — Design System Rules

Companion to `tokens.css`. Explains what CSS alone cannot convey.

Upload both files to Claude Design as Tier 1 assets.

---

## Token rules

- Always use semantic tokens (`--color-action`, `--color-bg-page`, `--ipix-accent`). Never use primitive tokens (`--primitive-orange-500`) in components. Do not use `--color-*` names that collide with shadcn/Tailwind theme keys (`accent`, `primary`, etc.).
- Never hardcode hex values. If a color is not in `tokens.css`, add a new semantic token first, then use it.
- If a required token is missing, recommend a new semantic token name — do not invent a raw value.
- All spacing uses `--space-*` vars or Tailwind's default scale. No arbitrary `px` values in components.

---

## Shell architecture

The operator workspace uses a 3-panel CSS grid:

```
grid-template-columns: auto  minmax(0, 1fr)  auto
                        ↑         ↑              ↑
                     NavSidebar  Workspace  IntelligencePanel
```

- **Left (NavSidebar):** `auto` — `3.5rem` collapsed, `14rem` expanded. Icon rail only. Never overlaps center.
- **Center (Workspace):** `flex-1` — route-specific page content. Scrollable. All detail/context panels live here.
- **Right (IntelligencePanel):** `auto` — width managed by CopilotKit. Always light-mode (white background), even if OS is in dark mode.

Single mobile breakpoint at `max-width: 1024px` → single column, IntelligencePanel hidden.

---

## Component hierarchy

Every component belongs to exactly one level. Never import upward.

```
Foundation  → tokens.css values only
Primitive   → shadcn/ui (Button, Badge, Card, Input, Tabs, Dialog, Skeleton, Toast)
Composite   → ApprovalCard, DNAScoreBar, StatusChip, BrandCard, ShootCard
Feature     → BrandHub, ShootWizard, AssetGrid, IntelligencePanel, CommandPalette
Page        → BrandDetailPage, ShootsListPage, CampaignsPage, DashboardPage
Workflow    → BrandOnboarding, ShootPlanning, CampaignApproval
```

All cards (BrandCard, ShootCard, CampaignCard, ApprovalCard) extend the base `Card` primitive. Never create an isolated card that doesn't share the Card foundation.

---

## AI / CopilotKit rules

1. **Every AI-generated value must show:** confidence %, evidence source, before/after diff.
2. **Every AI write action requires an ApprovalCard** — amber border (`--approval-border`), amber background (`--approval-bg`). The operator must explicitly approve or reject.
3. **AI drafts are visually distinct** — `--draft-border` + `--draft-bg`. Never display a draft as confirmed data.
4. **IntelligencePanel content order** (top → bottom):
   - Context card (active brand/shoot/campaign)
   - Pending approvals (HITL stack, amber)
   - AI suggestions (chips)
   - Evidence (collapsible citations)
   - Activity feed (timestamped trail)
   - Chat transcript + input
5. **Never generate a chat-only right panel.** The IntelligencePanel is an AI workspace, not a chatbox.
6. **Suggestion chips are static** — set by `useConfigureSuggestions`, not AI-generated per response.

---

## Agent lifecycle states

| State | Visual |
|---|---|
| `idle` | Quiet, chips visible, no indicator |
| `thinking` | Pulsing 3-dot (`--thinking-dot`), no chips |
| `streaming` | Animated text cursor (`--streaming-cursor`) |
| `awaiting-approval` | Amber HITL card stack, badge on nav |
| `complete` | Brief green flash, returns to idle |
| `failed` | Red error card with retry |

---

## Interaction states

All interactive components must define these states:

| State | Treatment |
|---|---|
| hover | `--opacity-hover` bg overlay, `cursor: pointer` |
| focus | `ring-2` using `--color-border-focus` (#E87C4D) |
| pressed | `scale-[0.98]` + slightly darker bg |
| disabled | `--opacity-disabled` (0.4), `cursor: not-allowed` |
| loading | Skeleton for content, spinner for actions |

---

## Accessibility minimums

- Contrast: 4.5:1 body text, 3:1 large text and UI
- All icons need `aria-label` or `sr-only` text
- HITL approval cards: `role="alertdialog"` + `aria-label="Approval required"`
- AI streaming regions: `aria-live="polite"`
- Touch targets: `--touch-target-min` (44px) on mobile
- Focus rings must be visible — use `--color-border-focus`

---

## What not to do

- Never create a full-page modal for a detail view — use inline panels in the center workspace
- Never use the right panel (IntelligencePanel) for page content — it is AI-only
- Never show AI output without confidence and evidence
- Never auto-approve an AI action — always show an ApprovalCard
- Never use marketing components (`components/marketing/`) in operator screens — different product surface
- Never hardcode colors — always use a semantic token
