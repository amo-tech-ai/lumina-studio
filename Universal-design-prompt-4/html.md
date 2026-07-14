# HTML File Inventory — Universal Design Prompt v4

## Pages (`Pages/`) — 39 files

### Operator & Shoot Lifecycle (12 screens)
| File | SCR | Route | Description |
|------|-----|-------|-------------|
| `Command Center.v2.image-first.dc.html` | SCR-01 | `/app` | Operator home — KPIs, needs-attention, IntelligencePanel |
| `Brand List.v2.image-first.dc.html` | SCR-02 | `/app/brand` | Brand portfolio with DNA scores + at-risk surfacing |
| `Brand Detail.v2.image-first.dc.html` | SCR-03 | `/app/brand/[id]` | Brand 360° — DNA, health, campaigns, shoots |
| `Shoots List.v2.image-first.dc.html` | SCR-04 | `/app/shoots` | Production pipeline with status + progress |
| `Shoot Detail.v2.image-first.dc.html` | SCR-05 | `/app/shoots/[id]` | Tabbed workspace; `flow=booking` → Booking Detail (SCR-22) |
| `Shoot Wizard.v2.image-first.dc.html` | SCR-06 | `/app/shoots/new` | Multi-step wizard; `flow=booking` → Booking Wizard (SCR-21) |
| `Campaigns.v2.image-first.dc.html` | SCR-07 | `/app/campaigns` | Campaign planning + creative direction |
| `Assets.v2.image-first.dc.html` | SCR-08 | `/app/assets` | Asset library — rights, usage, release metadata |
| `Channel Preview.v2.image-first.dc.html` | SCR-10 | `/app/preview` | In-feed preview + publish flow |
| `Onboarding.v2.zeely.dc.html` | SCR-11 | `/onboarding` | Brand onboarding (13-screen flow) |
| `Analytics.v2.image-first.dc.html` | SCR-16 | `/app/analytics` | KPIs with deltas + sparklines |
| `Campaign Performance.v2.image-first.dc.html` | SCR-17 | `/app/analytics/campaigns` | Per-campaign drill-down |
| `Activity & Audit.dc.html` | SCR-18 | `/app/activity` | Collaboration feed + immutable audit log |
| `Matching.v2.image-first.dc.html` | SCR-09 (legacy) | `/app/matching` | **Legacy** brand↔creator discovery reference |

### Booking — Two-Sided (6 screens)
| File | SCR | Route | Description |
|------|-----|-------|-------------|
| `SCR-09-Matching-Talent.dc.html` | SCR-09 (current) | `/app/matching` | Talent matches — Casting Review (card/swipe) + Grid + List |
| `SCR-20-Talent-Profile.dc.html` | SCR-20 | `/app/matching/talent/:id` | Talent/Model 360° — portfolio, measurements, availability |
| `SCR-24-Talent-Onboarding.dc.html` | SCR-24 | `/app/talent/profile` | Talent onboarding w/ FieldReview per AI field |
| `SCR-23-Availability-Editor.dc.html` | SCR-23 | talent-scoped | Month editor — available/blocked/tentative/booked |
| `SCR-25-Role-Dashboards.dc.html` | SCR-25 | `/app/model` / `/app/roster` | Role dashboards (Model/Agency) w/ Accept/Decline |
| `SCR-15-Notification-Center.dc.html` | SCR-15 | `/app/inbox` | Notification center — bell + slide-over |

### CRM / Relationships (7 screens)
| File | SCR | Route | Description |
|------|-----|-------|-------------|
| `SCR-26-CRM-Companies-List.dc.html` | SCR-26 | `/app/crm/companies` | Organizations — kind chips (Brand/Agency/Vendor/Sponsor) |
| `SCR-27-CRM-Company-Detail.dc.html` | SCR-27 | `/app/crm/companies/[id]` | Organization 360° — header + tab strip + activity timeline |
| `SCR-28-CRM-Contacts-List.dc.html` | SCR-28 | `/app/crm/contacts` | People — role chips (Contact/Model/Photographer/Crew) |
| `SCR-29-CRM-Contact-Detail.dc.html` | SCR-29 | `/app/crm/contacts/[id]` | Person 360° — contact arrays + linked deals |
| `SCR-30-CRM-Pipeline.dc.html` | SCR-30 | `/app/crm/pipeline` | Pipeline Kanban (desktop) / stage accordion (mobile) |
| `SCR-31-CRM-Deal-Detail.dc.html` | SCR-31 | `/app/crm/pipeline/[id]` | Deal detail — stage + EvidenceBlock + ApprovalCard |
| `DEMO-360-Agency.dc.html` | DEMO | template demo | 360° profile template applied to an agency entity |

### Planner (4 screens)
| File | SCR | Route | Description |
|------|-----|-------|-------------|
| `SCR-32-Planner-Workspace.dc.html` | SCR-32 | `/app/planner/[id]` | Timeline (Gantt) · Kanban · Calendar · List — task drawer |
| `SCR-33-Planner-Dashboard.dc.html` | SCR-33 | `/app/planner/dashboard` | Role-based landing — KPI cards, recent plans, week strip |
| `SCR-34-Planner-Instance-Settings.dc.html` | SCR-34 | `/app/planner/[id]/settings` | Members + Invite dialog; placeholder tabs |
| `SCR-35-Planner-Hub.dc.html` | SCR-35 | `/app/planner` | Index of all plan instances — type filter + cross-plan summary |

### Mobile Reference Builds (4 screens)
| File | Description |
|------|-------------|
| `SCR-MOBILE-Gallery.dc.html` | All 28 platform screens as 390px phone frames |
| `SCR-MOBILE-CRM-Gallery.dc.html` | 6 CRM screens as phone frames (kanban→accordion reflow) |
| `SCR-MOBILE-Booking-Shell.dc.html` | Phone-frame shell — tab bar, persistent composer, Insights sheet |
| `SCR-MOBILE-BottomSheet.dc.html` | Snap-point sheet primitive — drag handle, keyboard-aware |

### Reference
| File | Description |
|------|-------------|
| `INDEX.html` | Navigation index page — card grid linking all screens with SCR IDs and routes |
| `Component Library.dc.html` | Shared component / token reference |

---

## Components (`components/`) — 20 files

| File | Purpose |
|------|---------|
| `AgentStatusIndicator.dc.html` | AI agent online/offline/busy status dot |
| `ApprovalCard.dc.html` | Approval HITL card (approve/reject with reviewer avatar) |
| `AssetCard.dc.html` | Thumbnail card for media assets (image, metadata badges) |
| `BottomNavigation.dc.html` | Mobile bottom tab bar |
| `BottomSheet.dc.html` | Slide-up panel with drag handle (mobile overlay) |
| `BrandCard.dc.html` | Brand summary card — logo, name, DNA score |
| `CampaignCard.dc.html` | Campaign summary card — status, dates, KPI snippet |
| `EmptyState.dc.html` | Empty state placeholder — icon + message + optional CTA |
| `EvidenceBlock.dc.html` | Evidence display block for AI decisions / scoring |
| `FilterBar.dc.html` | Horizontal filter row — chips, date range, sort |
| `IntelligencePanel.dc.html` | Right-side AI insights panel (brand context) |
| `NavSidebar.dc.html` | Left sidebar navigation — icon + label items |
| `OperatorShell.dc.html` | Full-page layout shell — NavSidebar + workspace + IntelligencePanel + ChatDock |
| `PageHeader.dc.html` | Page title bar — heading, subtitle, action button |
| `PersistentChatDock.dc.html` | Bottom chat bar — CopilotKit agent input |
| `SearchBar.dc.html` | Text search input with icon |
| `ShootCard.dc.html` | Shoot summary card — brand, status, progress, date |
| `SkeletonLoader.dc.html` | Loading placeholder — shimmer skeleton |
| `StatusChip.dc.html` | Small colored status badge (e.g., Active, Review, Blocked) |
| `WizardStep.dc.html` | Wizard step indicator — step number, label, state |
