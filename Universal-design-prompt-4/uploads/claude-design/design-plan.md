# Claude Design — iPix / FashionOS Setup Plan

**Role:** Principal Design Systems Architect + Senior UX Designer + Frontend Architect  
**Date:** 2026-06-28  
**Sources:** Claude Design official docs · live codebase audit · existing design docs  
**Status:** Pre-screen generation — setup and governance only

---

## 1. Executive Summary

iPix / FashionOS is an AI-native SaaS operator workspace for fashion and DTC brands. The design system must reflect three values: **premium calm** (fashion studio feel), **operator precision** (Stripe/Linear-grade workflow clarity), and **AI trust** (every AI action is visible, explainable, and reversible).

Claude Design should treat this as a **component-aware system**, not a blank-canvas tool. The codebase already has production-grade components with established design decisions. Claude must learn those components first and reuse them in all generated screens.

**Readiness score: 61 / 100** — good foundations, significant gaps in primitive layer and token consistency before Claude Design can generate reliable screens.

---

## 2. Claude Design Capability Review

*What Claude Design can and cannot do for iPix, based on official documentation.*

| Capability | Claude Design | iPix fit |
|---|---|---|
| Upload codebase (reads React + styles) | ✅ | Upload `app/src/components/` + `app/src/app/globals.css` |
| Upload screenshots + wireframes | ✅ | 11 wireframes in `docs/design/wireframes/` ready |
| Upload design docs (PDF/MD) | ✅ | Design system master, component specs available |
| Upload GitHub repo | ✅ | Primary source of truth |
| Generate interactive HTML prototypes | ✅ | Target output format |
| Export to Figma / Vercel / Claude Code | ✅ | Vercel deploy + Claude Code handoff most useful |
| Apply brand colors + typography automatically | ✅ | Requires clean token file (gap — see below) |
| Reuse named components by reference | ✅ | Requires component names in prompt |
| Multi-person simultaneous editing | ⚠️ unstable | Single-author per session |
| Dark mode variants | ⚠️ partial | CopilotSidebar is always light — must specify |
| Complex Mastra/AG-UI streaming UI | ❌ | Claude Design generates static/interactive HTML; streaming wired by Claude Code |

**Key constraint:** Claude Design generates static and interactive HTML prototypes. It does not wire CopilotKit hooks, Supabase queries, or Mastra streaming. Generated screens hand off to Claude Code for production implementation.

---

## 3. Design System Architecture

*Recommended layer structure for Claude Design. Maps to codebase reality.*

```
iPix Design System
│
├── 1. Foundations
│   ├── Color tokens          (CSS vars in globals.css — needs consolidation)
│   ├── Typography            (Geist Sans + Geist Mono — already set)
│   ├── Spacing               (Tailwind scale — no custom overrides needed)
│   ├── Radius                (0.625rem base, sm/md/lg/xl variants — defined)
│   ├── Shadows               (not yet defined — gap)
│   ├── Motion                (not yet defined — gap)
│   └── Icons                 (not yet defined — gap; no icon system in codebase)
│
├── 2. Primitives (shadcn/ui)
│   ├── Button                ✅ exists (app/src/components/ui/button.tsx)
│   ├── Card                  ✅ exists (app/src/components/ui/card.tsx)
│   ├── Badge                 🔴 missing
│   ├── Input / Select        🔴 missing
│   ├── Table                 🔴 missing
│   ├── Dialog / Sheet        🔴 missing
│   ├── Tabs                  🔴 missing
│   ├── Tooltip / Popover     🔴 missing
│   ├── Toast                 🔴 missing
│   ├── Progress              🔴 missing
│   ├── Skeleton              🔴 missing
│   ├── Avatar                🔴 missing
│   └── Separator             🔴 missing
│
├── 3. Layout
│   ├── 3-panel shell         ✅ operator-panel.tsx + operator-shell.module.css
│   ├── NavSidebar            ✅ nav-sidebar.tsx (collapsed rail)
│   ├── CopilotSidebar        ✅ via @copilotkit/react-core/v2 (always light)
│   ├── Workspace container   🟡 section-placeholder.tsx (stub only)
│   ├── Page header           🔴 missing
│   ├── Empty state           🔴 missing
│   └── Loading skeleton      🔴 missing
│
├── 4. AI / CopilotKit Components
│   ├── Approval card         ✅ approval-card.tsx (brand DNA, with score diff)
│   ├── Budget approval card  ✅ hitl/BudgetApprovalCard.tsx
│   ├── Deliverable approval  ✅ hitl/DeliverableApprovalCard.tsx
│   ├── Shot list approval    ✅ hitl/ShotListApprovalCard.tsx
│   ├── Draft banner          ✅ draft-banner.tsx
│   ├── Analysis banner       ✅ analysis-progress-banner.tsx
│   ├── Tool presentation     ✅ copilot-tool-presentation.tsx
│   ├── Threads drawer        ✅ threads-drawer.tsx
│   ├── AI context card       🔴 missing
│   ├── AI evidence card      🔴 missing (scores-tab has citations — extract it)
│   ├── AI confidence badge   🔴 missing
│   ├── AI timeline           🔴 missing
│   ├── Agent status          🔴 missing
│   └── Command palette       🔴 missing
│
├── 5. Brand Components
│   ├── Brand hub client      ✅ brand-hub-client.tsx
│   ├── DNA scores tab        ✅ scores-tab.tsx (with citations block)
│   ├── Brand overview tab    ✅ overview-tab.tsx
│   ├── Brand profile tab     ✅ profile-tab.tsx
│   ├── Profile field         ✅ profile-field.tsx (inline edit)
│   ├── Activity tab          ✅ activity-tab.tsx
│   ├── Re-analyze button     ✅ re-analyze-button.tsx
│   ├── Intake banner         ✅ intake-banner.tsx
│   ├── Brand card            🔴 missing (brand list card for /app/brand)
│   ├── Brand DNA score bar   🟡 inline in scores-tab — needs extraction
│   ├── Brand status badge    🟡 inline — needs extraction
│   └── Brand switcher        🔴 missing
│
├── 6. Shoot Components
│   ├── Shoot card            ✅ ShootCard.tsx (with DNA badge, status chip)
│   ├── Shoot wizard context  ✅ shoot-wizard-context.tsx (AI context only)
│   ├── Shoot wizard UI       🔴 missing (wizard steps not built)
│   ├── Shot list card        🔴 missing
│   ├── Shoot preview panel   🔴 missing
│   └── Location card         🔴 missing
│
├── 7. Media / Preview Components
│   ├── Channel preview studio ✅ channel-preview-studio.tsx
│   ├── Device frame preview   ✅ device-frame-preview.tsx
│   └── Platform icons         ✅ platform-icons.tsx
│
├── 8. Asset Components
│   ├── Asset grid            🔴 missing
│   ├── Asset preview card    🔴 missing
│   ├── Asset DNA badge       🟡 DnaBadge in ShootCard — needs extraction
│   └── Asset approval card   🔴 missing
│
├── 9. Campaign Components
│   ├── Campaign card         🔴 missing (all campaign UI unbuilt)
│   ├── Deliverable checklist 🔴 missing
│   ├── Campaign timeline     🔴 missing
│   └── Campaign status badge 🔴 missing
│
├── 10. Commerce Components
│   └── (all missing — not yet built)
│
├── 11. Analytics Components
│   └── (all missing — not yet built)
│
└── 12. Marketing Components
    ├── Hero section          ✅ hero-section.tsx
    ├── Marketing chat        ✅ marketing-chat.tsx
    ├── Login form            ✅ login-form.tsx
    └── Various sections      ✅ (footer, FAQ, portfolio, etc.)
```

---

## 3A. Design Hierarchy

Every component belongs to exactly one level. Claude Design uses this to avoid duplicating components.

```
Foundation     → Color tokens, Typography, Spacing, Radius, Shadows, Motion, Icons
     ↓
Primitive      → Button, Badge, Card, Input, Select, Tabs, Table, Dialog, Skeleton, Toast
     ↓
Composite      → ApprovalCard, DNAScoreBar, StatusChip, BrandCard, ShootCard, AIContextCard
     ↓
Feature        → BrandHub, ShootWizard, AssetGrid, IntelligencePanel, CommandPalette
     ↓
Page           → BrandDetailPage, ShootsListPage, CampaignsPage, AssetsPage, DashboardPage
     ↓
Workflow       → BrandOnboarding, ShootPlanning, CampaignApproval
```

| Level | Naming convention | Example |
|---|---|---|
| Primitive | PascalCase noun | `Button`, `Badge`, `Card` |
| Composite | PascalCase compound | `ApprovalCard`, `DNAScoreBar` |
| Feature | PascalCase + context | `BrandHub`, `ShootWizard` |
| Layout | PascalCase + Shell/Panel/Layout | `OperatorShell`, `IntelligencePanel` |
| Page | PascalCase + Page | `BrandDetailPage` |
| Workflow | PascalCase + flow context | `BrandOnboarding` |

---

## 3B. Component Dependency Graph

Claude Design must follow this dependency tree to avoid duplicating or inverting dependencies.

```
OperatorShell
├── NavSidebar
│   ├── Badge (notification count)
│   └── Avatar (user)
├── Workspace (center, flex-1)
│   ├── PageHeader
│   │   ├── Breadcrumb
│   │   └── Button (actions)
│   ├── [Route-specific content]
│   │   ├── BrandHub → DNAScoreBar, ApprovalCard, ActivityTab, ProfileField
│   │   ├── AssetGrid → AssetCard, DNABadge, StatusChip
│   │   ├── ShootWizard → WizardStep, ShotListCard, BudgetApprovalCard
│   │   └── CampaignsPage → CampaignCard, DeliverableChecklist, CampaignTimeline
│   └── EmptyState (when no data)
└── IntelligencePanel (right, CopilotSidebar)
    ├── AgentStatusIndicator
    ├── ContextCard (active brand/shoot/campaign)
    ├── ApprovalCard stack (pending HITLs)
    ├── AIToolCard (tool result renders)
    ├── ActivityFeed (timestamped trail)
    └── ChatTranscript + SuggestionChips

Card (base)
├── BrandCard
├── ShootCard
├── CampaignCard
├── AssetCard
├── ApprovalCard
└── InsightCard
```

**Rules:**
- Never import Page into Feature
- Never import Feature into Composite
- Primitives have zero imports from this codebase — only shadcn/ui and Tailwind

---

## 3C. Component Metadata Specification

Every component uploaded to Claude Design should include this metadata. Claude uses it to select the right component rather than inventing a new one.

### Example: ApprovalCard

```
Name:         ApprovalCard
Level:        Composite
Category:     AI / HITL
File:         app/src/components/brand-hub/approval-card.tsx
Dependencies: Button, Badge, Card, CitationsBlock
Variants:     brand-dna | campaign | shoot-budget | shoot-deliverable | shoot-shotlist | asset
States:       pending | approving | rejecting | approved | rejected | already-processed | error
Accessibility: role="region", aria-label="Approval required", keyboard: Tab → Approve → Reject
Rules:
  - Always show: before value, after value, confidence %, evidence source
  - amber border (#F3B93C) + amber tint background (#FFFBF0) when pending
  - green border (#059669) when approved
  - Never auto-approve — always requires explicit operator action
```

### Example: DNAScoreBar

```
Name:         DNAScoreBar
Level:        Composite
Category:     Brand
File:         extract from scores-tab.tsx → ui/dna-score-bar.tsx
Dependencies: Badge, Tooltip
Variants:     full (label + bar + score) | compact (bar + score only) | inline (score only)
States:       loading (skeleton) | populated | no-data
Accessibility: aria-label="[Dimension] score: [N] out of 100", role="meter"
```

### Example: IntelligencePanel

```
Name:         IntelligencePanel
Level:        Feature
Category:     AI / Shell
File:         app/src/components/operator-panel/operator-panel.tsx (CopilotSidebar)
Dependencies: AgentStatusIndicator, ContextCard, ApprovalCard, AIToolCard, ActivityFeed, ChatTranscript
Panel order (top → bottom):
  1. Context section     — active brand/shoot/campaign summary card
  2. Pending Approvals   — HITL card stack (amber, urgent)
  3. AI Suggestions      — quick-action chips
  4. Evidence            — source citations from last AI action
  5. Activity Feed       — timestamped AI action trail
  6. Conversation        — chat transcript + input
States:       idle | agent-thinking | agent-streaming | awaiting-approval | agent-failed
Always light-mode — CopilotSidebar does not follow OS dark mode
```

---

## 4. Component Inventory

### ✅ Implemented (23 components)

| Component | File | Reuse status |
|---|---|---|
| Button | `ui/button.tsx` | ✅ use as-is |
| Card | `ui/card.tsx` | ✅ use as-is |
| Operator shell | `operator-panel/operator-panel.tsx` | ✅ layout reference |
| NavSidebar | `operator-panel/nav-sidebar.tsx` | ✅ layout reference |
| Brand hub client | `brand-hub/brand-hub-client.tsx` | ✅ composite |
| Approval card | `brand-hub/approval-card.tsx` | ✅ AI HITL reference |
| Scores tab | `brand-hub/scores-tab.tsx` | ✅ extract DNA bars |
| Overview tab | `brand-hub/overview-tab.tsx` | ✅ reference |
| Profile tab | `brand-hub/profile-tab.tsx` | ✅ reference |
| Profile field | `brand-hub/profile-field.tsx` | ✅ inline edit pattern |
| Activity tab | `brand-hub/activity-tab.tsx` | ✅ reference |
| Draft banner | `brand-hub/draft-banner.tsx` | ✅ AI draft pattern |
| Intake banner | `brand-hub/intake-banner.tsx` | ✅ onboarding pattern |
| Analysis progress banner | `brand-hub/analysis-progress-banner.tsx` | ✅ AI loading pattern |
| Re-analyze button | `brand-hub/re-analyze-button.tsx` | ✅ AI action pattern |
| Shoot card | `shoot/ShootCard.tsx` | ✅ card reference |
| Budget approval card | `shoot/hitl/BudgetApprovalCard.tsx` | ✅ HITL reference |
| Deliverable approval card | `shoot/hitl/DeliverableApprovalCard.tsx` | ✅ HITL reference |
| Shot list approval card | `shoot/hitl/ShotListApprovalCard.tsx` | ✅ HITL reference |
| Channel preview studio | `media/channel-preview-studio.tsx` | ✅ preview reference |
| Device frame preview | `media/device-frame-preview.tsx` | ✅ preview reference |
| Platform icons | `media/platform-icons.tsx` | ✅ icon reference |
| Threads drawer | `threads-drawer/threads-drawer.tsx` | ✅ drawer pattern |

### 🔴 Missing — High Priority (build before screen generation)

| Component | Category | Impact |
|---|---|---|
| Brand card | Brand | Every brand list screen |
| DNA score bar (extracted) | Brand | Brand detail, dashboard |
| Brand status badge (extracted) | Brand | Brand list, nav |
| Brand switcher | Navigation | Shell-level |
| Asset grid | Asset | /app/assets |
| Asset preview card | Asset | /app/assets |
| Asset DNA badge (extracted) | Asset | Asset grid |
| Campaign card | Campaign | /app/campaigns |
| Deliverable checklist | Campaign | Campaign detail |
| Shoot wizard steps | Shoot | /app/shoots/new |
| Shot list card | Shoot | Shoot detail |
| Badge (shadcn) | Primitive | Used everywhere |
| Input / Select (shadcn) | Primitive | All forms |
| Tabs (shadcn) | Primitive | Brand hub, assets |
| Skeleton (shadcn) | Primitive | All loading states |
| Dialog / Sheet (shadcn) | Primitive | Confirmations |
| Toast (shadcn) | Primitive | Action feedback |
| Page header | Layout | Every page |
| Empty state | Layout | Every page |
| AI context card | AI | Intelligence panel |
| AI evidence card | AI | HITL approvals |
| AI confidence badge | AI | All AI outputs |
| Command palette | Navigation | Power operators |
| Agent status indicator | AI | Shell |

### 🟡 Needs Extraction (inline → standalone)

| Pattern | Currently in | Extract to |
|---|---|---|
| DNA score bar | `scores-tab.tsx` | `ui/dna-score-bar.tsx` |
| DNA score badge | `ShootCard.tsx` | `ui/dna-badge.tsx` |
| Status chip | `ShootCard.tsx` | `ui/status-chip.tsx` |
| Citations block | `scores-tab.tsx` | `ui/citations-block.tsx` |
| Score color utility | `brand-utils.ts` | Already utility — keep |

### 🗑️ Candidates for Deprecation

| Component | Reason |
|---|---|
| `section-placeholder.tsx` | Stub — replace with real empty state component |
| Marketing components (all) | Different product surface — separate design system |

---

## 5. Token Specification

*Current state: CSS vars in globals.css + hardcoded values in components. Must consolidate.*

### Token hierarchy (Primitive → Semantic → Component → Brand)

Tokens are organized in four layers. Claude Design reads from Semantic level upward — never use Primitive tokens directly in components.

```
Primitive (raw values)
  gray-100: #F8FAFC
  gray-900: #1E293B
  orange-500: #E87C4D
  amber-400: #F3B93C

Semantic (purpose-based)
  --color-bg-page:        gray-50    → #FBF8F5
  --color-bg-card:        white      → #FFFFFF
  --color-text-body:      gray-900   → #1E293B
  --color-text-muted:     gray-500   → #64748B
  --color-accent:         orange-500 → #E87C4D
  --color-warning:        amber-400  → #F3B93C
  --color-approved:       green-600  → #059669
  --color-review:         amber-600  → #D97706
  --color-blocked:        red-600    → #DC2626

Component (component-specific)
  --approval-card-border: var(--color-warning)
  --approval-card-bg:     #FFFBF0
  --dna-bar-approved:     var(--color-approved)
  --dna-bar-review:       var(--color-review)

Brand (per-brand theming — planned)
  --brand-primary:        [brand override]
  --brand-secondary:      [brand override]
```

Rules:
- Primitive tokens → only in `tokens.css`
- Semantic tokens → used in Tailwind config and component CSS vars
- Component tokens → used inside component stylesheets only
- Brand tokens → shell-level injection when ActiveBrandContext is implemented

### Current design tokens (globals.css)

```css
/* Radius */
--radius: 0.625rem          /* 10px — base */
--radius-sm: 0.375rem       /* ~6px */
--radius-md: 0.500rem       /* ~8px */
--radius-lg: 0.625rem       /* 10px */
--radius-xl: 0.875rem       /* ~14px */

/* Typography */
--font-body: Geist Sans
--font-code: Geist Mono

/* Colors (semantic) */
--background:        #ffffff
--foreground:        #171717
--card:              oklch(1 0 0)
--primary:           oklch(0.205 0 0)   /* near-black */
--secondary:         oklch(0.97 0 0)    /* near-white */
--muted:             oklch(0.97 0 0)
--muted-foreground:  oklch(0.556 0 0)
--border:            oklch(0.922 0 0)
--destructive:       oklch(0.577 0.245 27.325)
```

### Hardcoded values in components (must move to tokens)

```css
/* Found in approval-card.tsx, scores-tab.tsx, ShootCard.tsx */
--color-amber:       #F3B93C   /* warning / mustard */
--color-amber-tint:  #FFFBF0   /* amber background */
--color-warm-border: #E8E0D8   /* warm off-white border */
--color-accent:      #E87C4D   /* iPix orange */
--color-slate-text:  #64748B   /* muted text */
--color-slate-dark:  #1E293B   /* body text */
--color-bg-warm:     #FBF8F5   /* page background */

/* Status colors */
--color-approved:    #059669   /* green */
--color-review:      #D97706   /* amber */
--color-blocked:     #DC2626   /* red */
```

### Target token file to create before Claude Design upload

```
app/src/styles/tokens.css
```

This file contains Primitive + Semantic layers. Component tokens live in component stylesheets. Brand tokens are shell-level injections (planned — requires ActiveBrandContext implementation).

---

## 6. Claude Design Upload Plan

### Phase 1 — Foundation (upload first, in this order)

| Asset | Path | Why |
|---|---|---|
| Token file (create first) | `app/src/styles/tokens.css` | Claude reads this for brand colors |
| globals.css | `app/src/app/globals.css` | Radius, typography, semantic vars |
| Component files (zip) | `app/src/components/` | Component names + patterns |
| Design system master | `docs/design/00-design-system/design-system-master.md` | Visual style definition |
| Visual style guide | `docs/design/00-design-system/visual-style-guide.md` | Color, typography, iconography |
| Component library doc | `docs/design/00-design-system/component-library.md` | Component inventory |

### Phase 2 — Screen Context (upload second)

| Asset | Path | Why |
|---|---|---|
| 3-panel logic doc | `docs/design/05-3-panel-logic.md` | Layout architecture |
| Wireframes (all 11) | `docs/design/wireframes/*.md` | Screen-by-screen spec |
| HITL approval card spec | `docs/design/08-components/hitl-approval-card.md` | AI approval pattern |
| DNA score bars spec | `docs/design/08-components/dna-score-bars.md` | Brand intelligence pattern |
| AI intelligence panel spec | `docs/design/08-components/ai-intelligence-panel.md` | Right panel design |
| Asset grid spec | `docs/design/08-components/asset-grid.md` | Asset browser pattern |
| CopilotKit wiring doc | `docs/design/wireframes/copilotkit.md` | AI hook reference |

### Phase 3 — Screenshots (upload third)

| Asset | Source | Why |
|---|---|---|
| Current brand hub screen | Run dev server, screenshot | Actual component styles |
| Approval card in action | Brand hub /app/brand/[id] | HITL pattern reference |
| Shoot card list | /app/shoots | Card density reference |
| Channel preview studio | /app/preview | Preview layout reference |
| Nav sidebar (collapsed) | Any /app/* screen | Left panel reference |

### Required (do not skip)

- ✅ Token CSS file (create first)
- ✅ globals.css
- ✅ Component source (zipped `src/components/`)
- ✅ Design system master doc
- ✅ 3-panel logic doc
- ✅ At least 3 live screenshots

### Recommended

- ✅ All 11 wireframe files
- ✅ Component spec docs from `docs/design/08-components/`
- ✅ User journey docs from `docs/design/07-user-journeys/`
- ✅ HITL approval card spec
- CopilotKit approval flow example (annotated screenshot)
- Empty / loading / error state examples

### Avoid (never upload)

- `.env`, `.env.local` — API keys, Supabase credentials
- `node_modules/` — never
- `supabase/` migrations — raw SQL with schema details
- `.claude/` — agent config with system prompts
- Private customer data or real brand assets
- Build output (`.next/`, `dist/`)
- `graphify-out/` — large generated graph file

---

## 7. AI-Native Design Standards

*Rules Claude Design must follow for every generated screen. Paste these into every Claude Design session prompt.*

### Layout rules

1. Always use the 3-panel shell: `NavSidebar | Page content | CopilotSidebar`
2. NavSidebar: `3.5rem` collapsed, `14rem` expanded — icon rail only
3. CopilotSidebar: always visible on desktop, full-screen modal on mobile
4. Page content: `flex-1`, scrollable, `min-width: 0`
5. Never generate modals for detail views — use page-level panels
6. All forms are inline, never full-page form routes

### AI component rules

7. Every AI-generated value must show: **confidence %**, **evidence source**, **before vs after**
8. Every AI write action must have an explicit `[Approve]` / `[Edit]` / `[Reject]` HITL card
9. HITL cards render in the CopilotSidebar chat, not in a modal or alert
10. AI drafts are visually distinct from confirmed data — amber border + `#FFFBF0` background
11. Agent status indicator visible in the shell header when AI is active
12. AI timeline appears in the intelligence panel showing all actions since session start

### Visual rules

13. Background: `#FBF8F5` warm off-white (not pure white)
14. Cards: `#FFFFFF`, `1px solid #E8E0D8`, `0.625rem radius`, subtle shadow
15. Text: `#1E293B` (dark slate), `#64748B` (muted)
16. Accent: `#E87C4D` (iPix orange) — for primary actions only
17. Secondary accent: `#F3B93C` (mustard) — for warnings and pending states
18. Status: `#059669` approved / `#D97706` review / `#DC2626` blocked
19. Font: Geist Sans body, Geist Mono for data/code
20. Always low visual noise: whitespace over decoration, hierarchy over color

### Operator workflow rules

21. Desktop-first: primary layout for ≥1280px operators
22. Mobile simplifies — one panel at a time, not three stacked
23. Empty states are actionable — always include a primary CTA and an AI suggestion
24. Loading states use skeleton, not spinners (except for AI streaming)
25. Every destructive action requires a confirmation step before execution

---

## 8. CopilotKit Intelligence Panel Strategy

*How Claude Design should represent the right panel AI workspace.*

### Current state (implemented)
```
CopilotSidebar
└── Chat transcript only
    └── Static suggestion chips (5 global)
    └── HITL cards render inline via useInterrupt
```

### Target state (planned — design for this)
```
CopilotSidebar (AI Workspace)
├── Context Section
│   └── Active brand / shoot / campaign card (live summary)
├── Approvals Section (if pending)
│   └── HITL card stack with before/after diff + confidence
├── Tool Results Section
│   └── Rendered output from last agent tool call
├── Activity Feed
│   └── Timestamped AI action trail (last 5 actions)
└── Chat Transcript
    └── Conversation history
    └── Input with chips
```

### Design guidance for Claude Design

When generating the intelligence panel:
- Use amber (`#FFFBF0` / `#F3B93C` border) for pending approval items
- Use green (`#D1FAE5` / `#059669` border) for completed approvals
- Show confidence as a percentage badge: `87% confident`
- Show evidence as a collapsible `Sources (3)` block
- Show before/after as a two-column diff inside the HITL card
- AI streaming state: pulsing dot next to agent name, not a spinner
- Never show a blank chat panel — always show active brand context card at top

---

## 8A. Agent-Aware Components

These components represent agent lifecycle states. Claude Design must generate them as distinct visual states, not just text changes.

### Agent lifecycle states

| State | Visual treatment | Description |
|---|---|---|
| `idle` | Quiet sidebar, suggestion chips visible | Agent ready, no active task |
| `thinking` | Pulsing dot next to agent name, no chips | Agent processing, not yet streaming |
| `streaming` | Animated text stream in chat bubble | Agent generating response |
| `awaiting-approval` | Amber HITL card stack, pulsing badge | Agent paused at human gate |
| `interrupted` | Yellow banner: "Interrupted — review required" | Agent hit an error mid-stream |
| `complete` | Green success state on last action | Task fully complete |
| `failed` | Red error card with retry button | Agent encountered unrecoverable error |

### Agent-specific components needed

```
AgentStatusIndicator   — header chip showing agent name + state dot
AgentThinkingIndicator — three-dot pulse animation
AgentStreamingBubble   — chat bubble with animated text cursor
AgentCompleteCard      — summary card: what was done, what changed
AgentErrorCard         — error with: what failed, why, retry/manual-override
AgentWaitingBadge      — amber badge on nav sidebar when HITL pending
```

### AI Message Types

Each message type has a distinct visual treatment:

| Type | Visual | When |
|---|---|---|
| `question` | Standard chat bubble | Agent asks operator for input |
| `suggestion` | Bordered card with action button | Agent recommends an action |
| `warning` | Amber card with ⚠️ icon | Risk or constraint detected |
| `approval` | HITL card (amber border, before/after) | Requires operator decision |
| `evidence` | Collapsible `Sources (N)` block | Citing data for a claim |
| `draft` | Amber tint card with `[Edit]` button | AI-generated content pending approval |
| `summary` | Neutral card with key points | AI summarising completed work |
| `recommendation` | Card with confidence % badge | AI advising next best action |
| `error` | Red card with retry | Something went wrong |
| `tool-result` | Rendered tool card (varies by tool) | Output from a Mastra tool call |

---

## 8B. Interaction & Motion Standards

Claude Design must apply these consistently. Do not invent new interaction patterns.

### Interaction states (all interactive components)

| State | Treatment |
|---|---|
| `default` | As designed |
| `hover` | 2% background darken, `cursor: pointer` |
| `focus` | `ring-2 ring-[#E87C4D] ring-offset-2` (orange focus ring) |
| `pressed` | 4% background darken, slight scale down (`scale-[0.98]`) |
| `disabled` | 40% opacity, `cursor: not-allowed` |
| `loading` | Skeleton or spinner depending on context (see below) |
| `streaming` | Animated text cursor (AI chat only) |
| `thinking` | Pulsing dot (3-dot bounce, `#64748B`) |
| `success` | Brief green flash + checkmark, fades to default |
| `error` | Red border + shake animation, stays until resolved |

### When to use skeleton vs spinner

| Use skeleton | Use spinner |
|---|---|
| Page/section initial load | Action in progress (button clicked) |
| Content that will fill a known layout | AI generating (streaming not yet started) |
| List/grid loading | File uploading |

### Motion system

All animations use these values:

```css
/* Duration */
--duration-instant:  50ms   /* micro-feedback: pressed state */
--duration-fast:    150ms   /* hover transitions, focus rings */
--duration-normal:  250ms   /* panel slides, card reveals */
--duration-slow:    400ms   /* page transitions, modal open/close */

/* Easing */
--ease-default:     cubic-bezier(0.16, 1, 0.3, 1)    /* snappy decelerate */
--ease-spring:      cubic-bezier(0.34, 1.56, 0.64, 1) /* springy, for approvals */
--ease-linear:      linear                             /* streaming text only */
```

| Animation | Duration | Easing | Notes |
|---|---|---|---|
| Hover state | 150ms | ease-default | Immediate feel |
| Panel slide | 250ms | ease-default | Left/right panels |
| Card reveal | 250ms | ease-default | HITL card appears |
| Approval success | 400ms | ease-spring | Green flash + scale |
| AI streaming text | linear | ease-linear | No easing on typed text |
| Notification badge | 300ms | ease-spring | Badge count update |
| Skeleton shimmer | 1.5s loop | ease-linear | Consistent with shadcn |

**Reduced motion:** All animations must respect `prefers-reduced-motion`. Replace motion with opacity fade at 150ms.

---

## 8C. Responsive Design Standards

iPix is desktop-first. Breakpoints map to real device widths.

| Breakpoint | Width | Layout |
|---|---|---|
| `xl` (wide desktop) | ≥ 1600px | All three panels, expanded NavSidebar |
| `lg` (desktop) | 1280–1599px | All three panels, NavSidebar collapsed to rail |
| `md` (laptop) | 1024–1279px | All three panels, NavSidebar collapsed |
| `sm` (tablet) | 768–1023px | Two panels (nav + center), IntelligencePanel hidden |
| `xs` (mobile) | < 768px | Single panel, bottom nav, IntelligencePanel as full-screen modal |

**Per-component responsive rules:**

| Component | Desktop | Tablet (768–1023) | Mobile (< 768) |
|---|---|---|---|
| OperatorShell | 3-column grid | 2-column (hide right) | 1-column |
| NavSidebar | Icon rail (3.5rem) / expanded (14rem) | Icon rail only | Hidden, bottom nav |
| IntelligencePanel | Always visible (auto-width) | Hidden (toggle button) | Full-screen modal |
| ApprovalCard | Inline in right panel | Full-width in center | Full-width, stacked buttons |
| AssetGrid | 4–5 columns | 2–3 columns | 1 column |
| DNAScoreBar | Full (label + bar + score) | Compact (bar + score) | Inline (score only) |
| DataTable | Full columns | Scroll horizontally | Prioritized columns only |

**Single implemented breakpoint:** `@media (max-width: 1024px)` in `operator-shell.module.css`. Tablet (768–1023) and mobile (< 768) rules are planned, not yet implemented — design for them, Claude Code implements them.

---

## 8D. Accessibility Standards

All generated screens must meet WCAG AA. Claude Design should apply these automatically.

### Minimum requirements

| Standard | Requirement |
|---|---|
| Color contrast | 4.5:1 for body text, 3:1 for large text and UI components |
| Keyboard navigation | Tab order follows visual reading order (top-left → bottom-right) |
| Focus visible | All interactive elements have visible focus ring (`ring-[#E87C4D]`) |
| Touch targets | Minimum 44×44px on mobile |
| Screen readers | All icons have `aria-label` or `sr-only` text |
| HITL cards | `role="alertdialog"` with `aria-label="Approval required"` |
| AI streaming | `aria-live="polite"` on streaming text regions |
| Reduced motion | Respect `prefers-reduced-motion` — disable animations |
| Error states | `aria-invalid="true"` + `aria-describedby` error message |
| Loading states | `aria-busy="true"` on skeleton/spinner containers |

### Keyboard shortcuts (planned)

| Shortcut | Action |
|---|---|
| `⌘K` | Open command palette |
| `⌘/` | Focus intelligence panel chat input |
| `A` | Approve focused HITL card |
| `R` | Reject focused HITL card |
| `Esc` | Close modal / dismiss suggestion |
| `Tab` | Move between approval cards in queue |

---

## 8E. Prompt Library for Claude Design

Paste these prompts (with the AI-native design standards from section 7) into Claude Design sessions. Each references components by their exact name so Claude reuses rather than invents.

### Shell / Layout

```
Generate the OperatorShell for /app/brand/[id].
- Left: NavSidebar (icon rail, 3.5rem, brand-intelligence agent active)
- Center: BrandDetailPage with BrandHub (DNA scores tab active)
- Right: IntelligencePanel (CopilotSidebar, showing brand intelligence report)
- Use tokens.css colors: background #FBF8F5, card white, accent #E87C4D
- Apply 3-panel grid: auto minmax(0,1fr) auto
```

### Approval Card

```
Generate an ApprovalCard (pending state) for brand DNA update.
- amber border #F3B93C, background #FFFBF0
- Show: AI confidence badge (87%), before value, after value, evidence Sources (3) collapsed
- Buttons: [Approve] (primary, green) [Edit] (secondary) [Reject] (ghost, red)
- Use Button and Badge primitives from ui/button.tsx and ui/badge.tsx
```

### Empty State

```
Generate an EmptyState for /app/assets when no assets are uploaded.
- Centered layout, max-width 480px
- Illustration placeholder (dashed border box, 120x80px)
- Headline: "No assets yet"
- Body: "Upload your first asset or let the AI discover assets from your brand."
- Primary CTA: [Upload assets] (Button, accent #E87C4D)
- Secondary: [Let AI find them] (Button, ghost)
- AI suggestion chip below: "I can scan your website for brand assets"
```

### Intelligence Panel

```
Generate the IntelligencePanel in awaiting-approval state.
- AgentStatusIndicator: brand-intelligence agent, amber dot (awaiting approval)
- ContextCard: Nike brand summary (DNA score 84, status: review)
- ApprovalCard: brand DNA update pending (amber, before/after, confidence 91%)
- ActivityFeed: last 5 AI actions with timestamps
- ChatTranscript: last 3 messages
- SuggestionChips: ["View evidence", "Compare to last version", "Reject all"]
- Always light-mode — white background, never dark
```

### AI Activity Feed

```
Generate an ActivityFeed component showing AI action trail.
- Timestamped list, newest first
- Each entry: timestamp (relative) + agent name + action summary + status dot
- Status dots: green (complete), amber (pending approval), blue (in progress), red (failed)
- Show max 10 entries, "View full history" link at bottom
- Compact: 48px row height, left border accent line matching status color
```

### Data Table with DNA

```
Generate a shoots list table for /app/shoots.
- Columns: Name | Type | Status | DNA Score | Channels | Budget | Updated
- StatusChip: planning/active/post_production/complete/archived variants
- DNABadge: green >=80, amber >=60, red <60
- Empty state: EmptyState component with "Plan your first shoot" CTA
- Skeleton: 5 rows x 7 columns while loading
- Desktop: full table. Mobile: Name + Status + DNA only, horizontal scroll for rest
```

---

## 8F. Screenshot Strategy

Upload screenshots in these specific states. Each gives Claude richer context than a single "populated" screenshot.

For each key screen, capture:

| State | What to show | Priority |
|---|---|---|
| Populated (desktop) | Fully loaded, real data | ✅ Required |
| Populated (1280px) | Laptop-width layout | ✅ Required |
| Empty | No data, EmptyState component | ✅ Required |
| Loading | Skeleton layout | Recommended |
| Approval pending | HITL card visible in right panel | ✅ Required |
| Agent streaming | AI text streaming in progress | Recommended |
| Error state | Failed action, error card | Recommended |
| Mobile (375px) | Simplified single-column | Optional |

### Screenshots to capture before first Claude Design session

| Screen | State | URL |
|---|---|---|
| Brand hub | Populated (DNA scores tab) | /app/brand/[any-id] |
| Brand hub | Approval card visible | /app/brand/[id-with-draft] |
| Shoot list | Populated (multiple shoots) | /app/shoots |
| Nav sidebar | Collapsed (icon rail) | Any /app/* |
| Nav sidebar | Expanded | Hover over it |
| Channel preview | Multi-platform | /app/preview |
| Command center | Dashboard overview | /app |

---

## 8G. Screen QA Checklist

Run this checklist on every screen generated by Claude Design before handing off to Claude Code.

### Tokens & primitives

- [ ] All colors use CSS vars from `tokens.css` (no hardcoded hex values)
- [ ] All spacing uses Tailwind scale (no arbitrary `px` values)
- [ ] All radius values use `--radius-*` vars
- [ ] All text uses Geist Sans / Geist Mono

### Layout

- [ ] 3-panel grid applied: `auto minmax(0,1fr) auto`
- [ ] NavSidebar is `auto` width (icon rail or expanded)
- [ ] IntelligencePanel is `auto` width (CopilotKit-managed)
- [ ] No standalone page modals for detail views (use inline panels)
- [ ] Responsive: tablet and mobile breakpoints defined

### AI / CopilotKit

- [ ] Every AI-generated value shows confidence %
- [ ] Every AI-generated value shows evidence source
- [ ] Every AI write action has an explicit ApprovalCard (before/after)
- [ ] ApprovalCard: amber border + amber tint background
- [ ] IntelligencePanel is always light-mode (white background)
- [ ] Suggestion chips present (static, not AI-generated)

### Components

- [ ] Uses existing components by name (not invented equivalents)
- [ ] No duplicate components that already exist in the inventory
- [ ] All cards derive from base `Card` primitive
- [ ] Buttons use `ui/button.tsx` variants (not custom)

### States

- [ ] Loading state defined (skeleton or spinner)
- [ ] Empty state defined (EmptyState component with CTA)
- [ ] Error state defined
- [ ] Hover + focus states on all interactive elements

### Accessibility

- [ ] Focus rings visible (orange, `ring-[#E87C4D]`)
- [ ] All icons have labels
- [ ] Touch targets >= 44px on mobile
- [ ] Color is not the only differentiator (icons or labels supplement)
- [ ] HITL cards have `role="alertdialog"`

---

## 9. File Organization Plan

```
app/src/
├── styles/
│   └── tokens.css              ← CREATE FIRST (Claude Design source of truth)
├── components/
│   ├── ui/                     ← shadcn/ui primitives (currently only button + card)
│   │   ├── button.tsx          ✅
│   │   ├── card.tsx            ✅
│   │   ├── badge.tsx           🔴 add
│   │   ├── input.tsx           🔴 add
│   │   ├── select.tsx          🔴 add
│   │   ├── tabs.tsx            🔴 add
│   │   ├── dialog.tsx          🔴 add
│   │   ├── skeleton.tsx        🔴 add
│   │   ├── toast.tsx           🔴 add
│   │   ├── dna-score-bar.tsx   🔴 extract from scores-tab
│   │   ├── dna-badge.tsx       🔴 extract from ShootCard
│   │   ├── status-chip.tsx     🔴 extract from ShootCard
│   │   └── citations-block.tsx 🔴 extract from scores-tab
│   ├── layout/                 ← 🔴 create this folder
│   │   ├── page-header.tsx
│   │   ├── empty-state.tsx
│   │   └── workspace-container.tsx
│   ├── ai/                     ← 🔴 create this folder
│   │   ├── ai-context-card.tsx
│   │   ├── ai-evidence-card.tsx
│   │   ├── ai-confidence-badge.tsx
│   │   ├── ai-timeline.tsx
│   │   └── agent-status.tsx
│   ├── brand-hub/              ✅ (mostly complete)
│   ├── shoot/                  🟡 (wizard UI missing)
│   ├── operator-panel/         ✅
│   ├── copilot/                ✅
│   └── media/                  ✅
```

---

## 10. Governance Model

### Who controls the design system

| Role | Responsibility |
|---|---|
| Design System Owner | Approves new tokens and primitives |
| Component Author | Writes component, documents variants |
| Claude Design Session | Generates screens using approved system |
| Claude Code Handoff | Implements generated screens in production |

### How new components enter the system

```
1. Identify gap (wireframe references missing component)
2. Check shadcn/ui first — use existing if it fits
3. If custom: design in Claude Design, review against token system
4. Extract to ui/ folder with documented variants
5. Upload updated component to Claude Design project
6. Update component inventory in docs/design/00-design-system/component-library.md
```

### How Claude Design sessions work

```
1. Open Claude Design project (iPix)
2. Paste the AI-native design standards (section 7 above) into every session
3. Reference components by name: "Use the ApprovalCard component with amber border"
4. Reference the wireframe for the target screen: "Build the /app/brand/[id] screen per wireframe 03-brand-detail.md"
5. Review output against the 3-panel layout and token system
6. Export HTML → hand off to Claude Code for production wiring
```

### Token change control

- Never hardcode colors in new components — always use CSS vars
- New semantic colors require a token entry in `tokens.css` before use
- Token names follow `--color-{role}` pattern (`--color-accent`, `--color-approved`)
- Tailwind config must map to CSS vars (not hardcoded hex)

---

## 11. Migration Roadmap

### Week 1 — Foundation (prerequisite for Claude Design)

| Task | Owner | Status |
|---|---|---|
| Create `tokens.css` with all extracted hardcoded colors | Dev | 🔴 |
| Add missing shadcn/ui primitives (badge, input, tabs, skeleton, dialog, toast) | Dev | 🔴 |
| Extract DNA score bar to `ui/dna-score-bar.tsx` | Dev | 🔴 |
| Extract DNA badge to `ui/dna-badge.tsx` | Dev | 🔴 |
| Extract status chip to `ui/status-chip.tsx` | Dev | 🔴 |
| Create `layout/page-header.tsx` and `layout/empty-state.tsx` | Dev | 🔴 |
| Take live screenshots of current implemented screens | Dev | 🔴 |

### Week 2 — Claude Design Setup

| Task | Owner |
|---|---|
| Create Claude Design project for iPix | Design |
| Upload Phase 1 assets (tokens, components, design docs) | Design |
| Upload Phase 2 assets (wireframes, component specs) | Design |
| Upload Phase 3 assets (live screenshots) | Design |
| Verify Claude extracts correct brand palette | Design |
| Test with dashboard screen (01-dashboard) | Design |
| Test with brand detail screen (03-brand-detail) | Design |

### Week 3 — Screen Generation (per route, in priority order)

1. `/app` — Command Center (dashboard)
2. `/app/brand` — Brand list
3. `/app/brand/[id]` — Brand detail (most complex)
4. `/app/shoots` — Shoot list
5. `/app/shoots/new` — Shoot wizard
6. `/app/campaigns` — Campaigns
7. `/app/assets` — Asset browser
8. `/app/matching` — Matching
9. `/app/preview` — Device preview
10. `/app/onboarding` — Brand intake

### Week 4 — Claude Code Handoff

- Export HTML prototypes per screen
- Hand off to Claude Code for production React implementation
- Wire CopilotKit hooks per wireframe `## CopilotKit Wiring` sections
- Wire Supabase data per wireframe `## Frontend ↔ Backend Wiring` sections

---

## 12. Risks / Red Flags / Blockers

### 🔴 Blockers (must fix before generating screens)

| Risk | Impact | Fix |
|---|---|---|
| No `tokens.css` — Claude will guess brand colors from scattered hex values | Wrong palette in all generated screens | Create `tokens.css` first |
| Only 2 shadcn/ui primitives — Claude cannot reuse what doesn't exist | Will invent custom primitives that don't match codebase | Add 10+ shadcn/ui components |
| No live screenshots uploaded — Claude has no visual reference for current UI | Generated screens won't match existing style | Take screenshots before first session |
| Hardcoded hex values in components are inconsistent | Claude extracts conflicting colors | Consolidate into tokens first |

### ⚠️ Red Flags (fix within first iteration)

| Risk | Impact |
|---|---|
| CopilotSidebar is always light-mode — if Claude generates dark shell, chat will clash | Visual inconsistency — specify "shell is light-mode, CopilotSidebar is always white" in every prompt |
| Marketing components are in the same `src/components/` folder — Claude may mix them into operator screens | Specify "ignore `components/marketing/` — that is a different product surface" |
| Brand intelligence agent is not durable — if Claude generates reconnection UI, it won't wire correctly | Note in handoff: brand-intelligence needs `createDurableAgent` wrapper before stream reconnect works |
| No icon system — Claude will use Lucide or Heroicons by default | Specify which icon library to use in every prompt (Lucide is most compatible with shadcn/ui) |

### 🟡 Known Gaps (document, don't block)

| Gap | Status |
|---|---|
| Command palette | Not designed or built — generate in Claude Design |
| AI timeline / activity feed | Not built — generate in Claude Design |
| `setActiveBrand` frontend tool | Not implemented — mark as planned in generated screens |
| Brand-intelligence agent durability | Not wrapped in `createDurableAgent` |
| Mobile < 768px two-tier layout | Not implemented — generate aspirational in Claude Design |

---

## 13. P0 / P1 / P2 Action Plan

### P0 — Before first Claude Design session

- [ ] Create `app/src/styles/tokens.css` with all brand colors
- [ ] Add shadcn/ui: `badge`, `input`, `select`, `tabs`, `skeleton`, `dialog`, `sheet`, `toast`, `progress`, `separator`
- [ ] Extract: `dna-score-bar`, `dna-badge`, `status-chip`, `citations-block` to `ui/`
- [ ] Create: `layout/page-header`, `layout/empty-state`, `layout/workspace-container`
- [ ] Take screenshots of: brand hub, shoot list, nav sidebar, approval card in action
- [ ] Create Claude Design project, upload Phase 1 assets

### P1 — First generation sprint (screens)

- [ ] Upload Phase 2 + 3 assets
- [ ] Generate Command Center screen
- [ ] Generate Brand Detail screen (most components, best test)
- [ ] Generate HITL approval card with before/after diff
- [ ] Generate AI intelligence panel (context + approvals + timeline + chat)
- [ ] Generate empty state variants for each route
- [ ] Generate loading skeleton variants

### P2 — Future iterations

- [ ] Generate campaign screens
- [ ] Generate asset browser with DNA grid
- [ ] Generate matching UI (swipe-card and table variants)
- [ ] Generate onboarding wizard
- [ ] Generate command palette overlay
- [ ] Generate mobile simplified layouts
- [ ] Generate dark mode variants (if required)

---

## 14. Overall Readiness Score

| Area | Score | Blocker? |
|---|---|---|
| Design philosophy + direction | 95/100 | No |
| Visual identity tokens | 45/100 | ⚠️ Yes — scattered and inconsistent |
| Primitive component layer | 20/100 | ⚠️ Yes — only 2 of ~15 needed |
| Product component layer | 55/100 | No — enough for initial screens |
| AI component layer | 40/100 | No — patterns exist, extraction needed |
| Design documentation | 80/100 | No — wireframes + specs ready |
| Screen screenshots for upload | 10/100 | ⚠️ Yes — none taken yet |
| Claude Design project | 0/100 | ⚠️ Yes — not created yet |

**Overall: 61 / 100**

The biggest blockers are mechanical: create the token file, fill out the shadcn/ui layer, take screenshots. None require design decisions — they're implementation steps. Complete P0 and the score goes to ~85/100, enough to generate reliable screens.

---

## 15. Exact Next Steps Before Generating Screens

Run these in order. Do not start Claude Design screen generation until all 6 are done.

```
1. npx shadcn@latest add badge input select tabs skeleton dialog sheet toast progress separator
   → Adds missing primitives to app/src/components/ui/

2. Create app/src/styles/tokens.css
   → Move all hardcoded hex values from components to this file
   → This is the Claude Design color source of truth

3. Extract inline patterns to standalone components
   → dna-score-bar, dna-badge, status-chip, citations-block

4. Create layout primitives
   → page-header.tsx, empty-state.tsx, workspace-container.tsx

5. Take screenshots (with dev server running on port 3002)
   → /app/brand/[any-brand-id]  — brand hub with scores + approval card
   → /app/shoots                — shoot card list
   → any /app/* screen          — nav sidebar collapsed state

6. Create Claude Design project
   → Upload Phase 1 (tokens.css, globals.css, components zip, design docs)
   → Verify brand palette extracted correctly
   → Upload Phase 2 (wireframes, component specs)
   → Upload Phase 3 (screenshots)
   → Test with: "Generate the /app command center dashboard using the 3-panel shell"
```
