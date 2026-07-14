# Component Dependency Tree

How components relate. Claude Design must use this to reuse existing components instead of inventing new ones.

---

## Shell

```
OperatorShell
├── NavSidebar
│   ├── BrandSwitcher (brand list + active indicator + badge count)
│   ├── NavItem (icon + label, active/inactive states)
│   └── UserMenu (avatar + settings)
├── Workspace (route-specific content)
│   ├── PageHeader (title + breadcrumbs + actions)
│   └── [page components — see below]
└── IntelligencePanel (CopilotSidebar)
    ├── AIContextCard (active brand/shoot/campaign)
    ├── ApprovalCard × N (HITL stack)
    ├── SuggestionChips (quick actions)
    ├── EvidenceBlock (citations, collapsible)
    ├── ActivityFeed (timestamped trail)
    └── ChatComposer (input + send)
```

---

## Primitive layer (shadcn/ui — never bypass)

```
Button        — all CTAs, actions
Card          — all card surfaces (base for every product card)
Badge         — status chips, count pills
Input         — all text inputs
Select        — all dropdowns
Tabs          — tab navigation
Skeleton      — all loading states
Dialog        — modals
Sheet         — side drawers (mobile IntelligencePanel, shoot detail)
Sonner        — toast notifications
Progress      — progress bars (DNA scores, upload progress)
Separator     — dividers
```

---

## Composite components (extend Card primitive)

```
ApprovalCard              ← Card + Badge + Button × 2 + confidence/evidence display
BrandCard                 ← Card + Badge (status) + DNAScoreBar
ShootCard                 ← Card + Badge (status) + DNABadge + thumbnail
CampaignCard              ← Card + Badge (status) + deliverables count
AssetCard                 ← Card + image + DNA match % + select checkbox
ProductMatchCard          ← Card + image + confidence + match score
AIContextCard             ← Card + agent avatar + context summary
EvidenceBlock             ← Card + citation list (collapsible)
ActivityFeedItem          ← timestamp + icon + description + agent
CopilotToolPresentation   ← Card + tool result rendering
```

---

## Feature components (composed of composite + primitives)

```
BrandHub
├── BrandHubHeader (brand name + status + DNA score summary)
├── Tabs (Overview | DNA | Approvals | Assets | Activity)
├── ScoresTab
│   ├── DNAScoreBar × N
│   └── EvidenceBlock
├── ApprovalsTab
│   └── ApprovalCard × N
├── AssetsTab
│   └── AssetGrid → AssetCard × N
└── ActivityTab
    └── ActivityFeedItem × N

ShootWizard
├── Stepper (step progress)
├── BriefForm → Input × N + Select × N
├── BudgetApprovalCard (HITL variant)
├── ShotListCard
└── TeamCard

AssetGrid
├── FilterBar → Select × N + Input (search)
├── AssetCard × N (masonry or grid)
└── BulkActionBar (visible when selected > 0)

CommandPalette (⌘K overlay)
├── Dialog
├── Input (search)
└── CommandItem × N

ChannelPreviewStudio
├── DeviceFrame (mobile/tablet/desktop)
├── PreviewContent
└── PlatformGlyphs (IG/TikTok/Amazon/Shopify icons)
```

---

## Rules

1. Every card-shaped element extends the `Card` primitive. No exceptions.
2. Every button uses `Button` variants. No custom styled `<div onClick>` acting as a button.
3. `ApprovalCard` is the ONLY component that can gate an AI write action. Never inline approve/reject buttons outside of it.
4. `IntelligencePanel` content is always in this order: context → approvals → suggestions → evidence → activity → chat. Never reorder.
5. New composite components: acceptable. New primitive components: requires explicit justification. Never bypass shadcn primitives.
