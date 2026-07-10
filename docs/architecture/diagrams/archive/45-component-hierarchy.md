# Component Hierarchy

**Purpose:** Show the real shared component tree — the 3-panel operator shell and the per-feature component directories it wraps.

## Explanation

`OperatorPanel` (`app/src/components/operator-panel/operator-panel.tsx`) is the single wrapper every `(operator)` route renders inside — it owns the CopilotKit provider, `IntelligenceDetailProvider`, and route-derived `agentId`. Inside it, `OperatorShell` lays out the actual 3-panel grid: `NavSidebar` (left), route `children` + `OperatorChatDock` (center workspace), `IntelligencePanel` (right), plus a `ThreadsDrawer` overlay toggled from the nav. Per-feature component directories (crm, shoot, matching, etc.) only ever render inside the center workspace slot — none of them re-implement the shell.

## Diagram

```mermaid
flowchart TD
    OP["OperatorPanel\n(operator-panel.tsx)"]
    OP --> OS["OperatorShell"]

    OS --> Nav["NavSidebar\n(nav-sidebar.tsx)"]
    OS --> Workspace["Workspace slot\n(route children + OperatorChatDock)"]
    OS --> Intel["IntelligencePanel\n(intelligence-panel/)"]
    OS --> Threads["ThreadsDrawer overlay\n(threads-drawer/)"]

    Intel --> IntelSections["ai-context-card, ai-insights-section,\ndna-scores-section, health-section,\nintel-approval-card / -queue-section,\nrecent-activity-section, recommended-actions-section,\nportfolio-panel-section"]

    Workspace --> CRM["crm/\ncrm-list-workspace, crm-detail-shell,\ncompanies/contacts/pipeline workspaces"]
    Workspace --> ShootC["shoot/\nshoots-list-workspace, shoot-detail-workspace,\nShootCard, shoot-wizard-context, hitl/"]
    Workspace --> BrandHub["brand-hub/ + brand-context-panel/\nactive-brand-context driven"]
    Workspace --> Matching["matching/\ntalent-card, talent-match-tabs, shortlist-drawer"]
    Workspace --> Media["media/\nchannel-preview-studio, device-frame-preview"]
    Workspace --> CmdCenter["command-center/\nportfolio-hero-card, quick-action-chips,\ncommand-center-approvals"]
    Workspace --> EvidenceBlock["evidence-block/\nreused across CRM, Brand, Intelligence"]

    OS --> Copilot["copilot/\ncopilot-tool-presentation (hides internal tool calls)"]
    OS --> UI["ui/\nshadcn primitives — Card, Dialog, Sheet, Tabs, Badge"]

    Marketing["marketing/\nheader, hero-section, services-section, footer, login-form,\nmarketing-chat"] -.rendered only inside the (marketing) route group, never inside OperatorShell.-> OP
```

## Related Linear issues

`IPI-85` / `IPI-110` (NavSidebar), `IPI-218` (brand switcher), `IPI-197` (contextual chat dock), `IPI-243` (IntelligencePanel briefing pattern) — all cited directly in code comments in `operator-panel.tsx` and `nav-sidebar.tsx`.

## Related PRD section

`prd.md` §3 (3-panel operator shell, HITL pattern). Ground truth: `app/src/components/operator-panel/operator-panel.tsx`, directory listing in `tasks/plan/audit/00-repo-ground-truth.md` §1.
