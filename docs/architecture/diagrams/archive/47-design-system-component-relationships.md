# Design System Component Relationships

**Purpose:** Show how the reusable Claude Design components (the `.dc.html` library) relate to each other and to the shell, per `DESIGN.md` and the design-prompt reuse conventions.

## Explanation

`OperatorShell.dc.html` is the root layout component every screen composes into: `NavSidebar` + a workspace slot (`PageHeader` + feature content + `PersistentChatDock`) + `IntelligencePanel`. A small set of shared primitives (`StatusChip`, `ApprovalCard`, `EmptyState`, `SkeletonLoader`, `FilterBar`, `BottomSheet`/`BottomNavigation` for mobile) are reused across nearly every feature screen rather than rebuilt per-feature — this is the explicit rule in `DESIGN.md` §8 ("new primitives require explicit justification, reuse first") and is echoed in the Planner design-prompt reuse table (`00-review-and-conventions.md` §2), which reuses 11 of these components as-is.

## Diagram

```mermaid
flowchart TD
    Shell["OperatorShell.dc.html\n(grid: 56px NavSidebar | 1fr Workspace | 340px IntelligencePanel)"]

    Shell --> NavSidebar["NavSidebar.dc.html"]
    Shell --> PageHeader["PageHeader.dc.html"]
    Shell --> IntelPanel["IntelligencePanel.dc.html\nfixed order: context → AI insights →\nevidence → pending approvals → conversation"]
    Shell --> ChatDock["PersistentChatDock.dc.html\npinned to workspace bottom, never overlaps IntelligencePanel"]

    PageHeader --> FeatureCards["Feature-specific cards:\nBrandCard, ShootCard, CampaignCard, AssetCard"]

    FeatureCards --> StatusChip["StatusChip.dc.html\nborder+dot, no filled blocks"]
    IntelPanel --> ApprovalCard["ApprovalCard.dc.html\nthe only HITL write-trigger — before/after diff + confidence"]
    IntelPanel --> EvidenceBlock["EvidenceBlock.dc.html"]

    Shell --> FilterBar["FilterBar.dc.html\nview toggles, role/status filters"]
    Shell --> EmptyState["EmptyState.dc.html"]
    Shell --> SkeletonLoader["SkeletonLoader.dc.html\nline/card variants — never a spinner"]

    Shell --> Mobile["Mobile reflow"]
    Mobile --> BottomSheet["BottomSheet.dc.html\nIntelligencePanel replacement <768px"]
    Mobile --> BottomNav["BottomNavigation.dc.html"]

    Shell --> AgentStatus["AgentStatusIndicator.dc.html"]
    Shell --> SearchBar["SearchBar.dc.html"]
    Shell --> WizardStep["WizardStep.dc.html\nmulti-step flows (shoot wizard, onboarding)"]
```

## Related Linear issues

none — reflects shipped design-system structure (`Universal-design-prompt-new/components/*.dc.html`, 19 files).

## Related PRD section

`prd.md` §3 (3-panel shell, HITL invariant — `ApprovalCard` is the only allowed write-trigger). Source: `Universal-design-prompt-new/DESIGN.md` §7 (Layout Architecture), §8 (Component Reuse Rules), and the reuse table in `Universal-design-prompt-new/plan/design-prompts/00-review-and-conventions.md` §2.
