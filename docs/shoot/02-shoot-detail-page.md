---
task_number: 02
title: Shoot Detail Page
category: Content Production
subcategory: Core UI
phase: 1
priority: P0
status: Open
percent_complete: 0
owner: Full Stack Developer
dependencies: 01-shoots-dashboard, 12-shoot-schema
estimated_effort: L
complexity: Medium
---

# Task 02: Shoot Detail Page

---

## Summary Table

| Aspect | Details |
|--------|---------|
| **Screens** | Shoot Detail (`/app/shoots/:id`), 8 section tabs |
| **Features** | Gallery, Shot List, Deliverables, Crew, Mood Board, Documents, DNA Audit, **Product Linking**, Overview |
| **Agents** | `production-planner` route agent with `asset-dna` context and shot-list tools |
| **Use Cases** | Manage shoot assets, track shot list, coordinate crew, review DNA compliance |
| **Real-World Example** | Photographer uploads 50 images, AI audits each for DNA compliance, creative director approves 45, flags 5 for re-edit |

---

## AI-Native Update — Mastra + CopilotKit v2

**Source of truth:** [`00-ai-native-shoot-system.md`](./00-ai-native-shoot-system.md)  
**Dashboard plan:** [`../dashboards/02-ai-native-dashboards-plan.md`](../dashboards/02-ai-native-dashboards-plan.md)  
**Repo mapping:** [`../intelligence/repos-links.md`](../intelligence/repos-links.md)

| Layer | Shoot Detail behavior |
|---|---|
| L1 context injection | `useAgentContext` sends `brandId`, `shootId`, active tab, selected assets, and operator role; `useCopilotReadable` exposes visible tab data |
| L2 right-panel intelligence | Right panel explains tab-specific risks: schedule, asset DNA, missing shots, package gaps, and approval items |
| L3 route agent | `/app/shoots/:id` routes to Mastra `production-planner` |
| L4 generative artifacts | Shot-list drafts and production-package sections render in the center workspace when they become editable work product |
| L5 HITL before writes | Asset decisions, shot-list changes, crew matches, and package approvals require approve/reject/edit |

**Reference repos to use:** Mastra PM Canvas for shared editable draft state, Chat with Your Data for visible tab context, Strands CRM for HITL cards, and Banking for route/role context.

---

## Description

The Shoot Detail Page is the single source of truth for content production. It displays all shoot assets in an organized gallery, tracks shot list completion, coordinates crew assignments, and monitors DNA compliance in real-time. The 3-panel layout surfaces AI-powered audit results in the Right Panel while keeping the main work area focused on content management.

---

## Rationale

During active shoots, teams need:
- A centralized gallery with DNA compliance visibility
- Shot list tracking to ensure all required content is captured
- Crew coordination with contact information
- Mood board reference for creative direction
- Document management for briefs, contracts, releases
- Real-time DNA audit feedback

Without a unified detail page, teams juggle Google Drive, WhatsApp, spreadsheets, and email - creating communication gaps and brand consistency issues.

---

## Purpose, Goals & Outcomes

### Purpose
Serve as the complete workspace for managing a single shoot from planning through asset delivery, with AI-powered brand compliance monitoring.

### Goals

| Goal | Success Criteria |
|------|------------------|
| Centralized asset view | All shoot assets in one gallery |
| Shot list tracking | Visual progress on required shots |
| Crew coordination | Contact info and assignments visible |
| DNA compliance | Real-time audit results on every asset |

### Outcomes

- Every uploaded asset audited for brand DNA
- Shot list serves as checklist for photographers
- Crew knows their assignments and can communicate
- Mood boards guide creative direction
- Documents organized and accessible
- Flagged images reviewed before distribution

---

## User Stories

### Creative Director Stories

| As a... | I want to... | So that... |
|---------|--------------|------------|
| Creative Director | Review all uploaded assets | I can approve for distribution |
| Creative Director | See DNA scores on each image | I know which need attention |
| Creative Director | Check shot list progress | I know what's still needed |
| Creative Director | Bulk approve passing images | I can work efficiently |

### Photographer Stories

| As a... | I want to... | So that... |
|---------|--------------|------------|
| Photographer | Upload images directly | I don't need separate file sharing |
| Photographer | See the shot list | I know what to capture |
| Photographer | View mood board | I understand the creative direction |
| Photographer | See which images are flagged | I can re-edit or re-shoot |

### Producer Stories

| As a... | I want to... | So that... |
|---------|--------------|------------|
| Producer | Manage crew assignments | Everyone knows their role |
| Producer | Access contracts and releases | Legal documents are organized |
| Producer | Track overall progress | I can report to stakeholders |

### Real-World Example

**Scenario:** Alex, photographer for a resort wear brand, shoots a beach lifestyle campaign.

1. Before the shoot, Alex opens the Shoot Detail page and reviews the mood board and shot list
2. The shot list shows 20 required shots with specifications for each channel (Instagram, Amazon, TikTok)
3. During/after the shoot, Alex uploads 60 images directly to the gallery
4. AestheticAuditorAgent automatically scores each image against brand DNA
5. 52 images pass (80+ score), 8 are flagged (below 60)
6. Creative director reviews flagged images in Right Panel, requests 5 re-edits, overrides 3
7. Producer marks shot list items as "captured" as matching assets are uploaded
8. All 20 required shots are fulfilled, shoot status changes to "Complete"

---

## Acceptance Criteria

### Navigation & Structure

- [ ] Page renders at `/app/shoots/:id`
- [ ] 7 section tabs accessible: Overview, Gallery, Shot List, Crew, Mood Board, Documents, DNA Audit
- [ ] Tab state persisted in URL for sharing
- [ ] Back button returns to dashboard with preserved filters
- [ ] Breadcrumb navigation visible

### Overview Section

- [ ] Shoot summary: name, type, dates, location
- [ ] Brief/description field (editable)
- [ ] Quick stats: asset count, DNA score average, crew count
- [ ] Status indicator with change history
- [ ] Edit mode for basic details

### Gallery Section

- [ ] Grid view of all uploaded assets
- [ ] DNA score badge on each thumbnail
- [ ] Status badges: Approved, Pending, Flagged, Rejected
- [ ] Multi-select with shift/ctrl-click
- [ ] Lightbox view with full image and DNA breakdown
- [ ] Bulk actions: Approve, Flag, Download, Delete
- [ ] Filter by: Score range, Status, Type (photo/video)
- [ ] Upload zone with drag-drop support

### Shot List Section

- [ ] Table/list of required shots
- [ ] Columns: Shot #, Description, Channel, Aspect Ratio, Status
- [ ] Checkbox to mark as captured
- [ ] AI generate button for new suggestions
- [ ] Reorder via drag-and-drop
- [ ] Add/edit/delete shots manually

### Crew Section

- [ ] List of assigned crew members
- [ ] Role badges: Photographer, Model, Stylist, Makeup Artist
- [ ] Contact actions: Email, Phone, Message
- [ ] Availability status indicator
- [ ] Add/remove crew members
- [ ] Link to Professional Network for new assignments

### Mood Board Section

- [ ] Grid of reference images
- [ ] URL input to add from web
- [ ] Upload local images
- [ ] Notes/annotations per image
- [ ] Full-screen gallery view

### Documents Section

- [ ] File list: Briefs, Contracts, Releases
- [ ] Upload with category selection
- [ ] Preview in-browser for PDFs/images
- [ ] Download buttons
- [ ] Version tracking

### DNA Audit Section

- [ ] Overall shoot DNA score
- [ ] Per-pillar breakdown chart
- [ ] Flagged items list with thumbnails
- [ ] Individual review modal
- [ ] Batch approve/reject controls
- [ ] Override with justification

### Product Linking Section (SHOOT-UX-011)

Closes the iPix loop: Asset → Product Link → Commerce → Conversion. This is the key differentiator vs Soona and Squareshot, which end at asset delivery.

- [ ] Tab: "Product Links" — list of approved assets with their linked Mercur products
- [ ] Per-asset: link button opens product search (queries `commerce_product_links` via edge function)
- [ ] Linked state shows product name, SKU, Mercur product ID, link status (linked / unlinked / error)
- [ ] Unlink action requires confirmation
- [ ] Bulk link: select multiple assets → assign same product
- [ ] Right panel: coverage summary — how many assets are linked vs unlinked
- [ ] `production-planner` `explainProductLinkingGaps` tool surfaces unlinked assets in right panel
- [ ] No direct Mercur DB (`:5433`) queries from Supabase — edge function only
- [ ] Link IDs stored in `commerce_product_links`; product data stays in Mercur

---

## 3-Panel Layout

| Panel | Content | AI Actions |
|-------|---------|------------|
| **Left (Context)** | Section tabs, brief summary, quick actions | None |
| **Main (Work)** | Active section content (gallery, shot list, etc.) | None |
| **Right (Intelligence)** | DNA audit results, flagged images, improvement suggestions, approval cards | `production-planner`, `asset-dna` |

### Wireframe

```
+----------------+--------------------------------+------------------+
| SECTIONS       | GALLERY                [Upload]| DNA AUDIT        |
|                |                               |                  |
| o Overview     | [img][img][img][img][img]     | Overall: 92      |
| * Gallery      | [95] [88] [92] [78] [95]      | ============     |
| o Shot List    |                               |                  |
| o Crew         | [img][img][img][img][img]     | -----------      |
| o Mood Board   | [90] [45] [88] [52] [91]      |                  |
| o Documents    | [ v] [!]  [ v] [!]  [ v]      | ! 2 Flagged      |
| o DNA Audit    |                               |                  |
|                | [img][img][img][img][img]     | IMG_042.jpg      |
| -----------    | [87] [93] [89] [94] [86]      | Score: 45        |
|                |                               | Color: Low       |
| BRIEF          |                               | [Review]         |
| Summer beach   | Showing 15 of 42 assets       |                  |
| lifestyle...   |                               | [Approve All]    |
+----------------+--------------------------------+------------------+
```

---

## Screens & Features

### Gallery Grid Component

| Element | Position | Content |
|---------|----------|---------|
| Thumbnail | Full card | Asset preview with g_auto crop |
| DNA Badge | Top-right | Score 0-100 with color |
| Status Badge | Bottom-left | Approved/Pending/Flagged |
| Checkbox | Top-left | For multi-select |
| Actions | Bottom-right (hover) | Approve, Flag, Download, Delete |

### Lightbox Modal

| Element | Content |
|---------|---------|
| Full Image | High-res preview |
| DNA Scores | Per-pillar breakdown with progress bars |
| Actions | Approve, Flag, Download, Transform |
| Navigation | Previous/Next arrows, keyboard shortcuts |
| Metadata | Filename, dimensions, file size, upload date, tags |

### Shot List Item

| Column | Data |
|--------|------|
| # | Order number |
| Description | What to capture |
| Channel | Target platform (Instagram, Amazon, TikTok) |
| Aspect Ratio | Required dimensions |
| Style Notes | Creative direction |
| Status | Pending, Captured, Approved |

---

## Agents

### AestheticAuditorAgent

| Field | Value |
|-------|-------|
| **Provider** | Gemini Vision |
| **Trigger** | Asset upload |
| **Input** | asset_url, brand_dna_pillars |
| **Output** | dna_score, pillar_scores[], flags[], suggestions[] |
| **Display** | DNA Audit section, Right Panel alerts |

### Legacy ImageGeneratorAgent Mapping

| Field | Value |
|-------|-------|
| **Provider** | Gemini |
| **Trigger** | "Generate Shot List" button |
| **Input** | shoot_brief, mood_board_urls, channels, brand_dna |
| **Output** | shots[] with descriptions, channels, specs |
| **Display** | Shot List section |

---

## Supabase Schema

### shoots (read/update)

| Column | Type | Used For |
|--------|------|----------|
| id | uuid | Page key |
| name | text | Title |
| type | enum | Type badge |
| brief | text | Overview section |
| mood_board_urls | text[] | Mood Board section |
| dna_score | integer | DNA Audit section |

### shoot_assets (CRUD)

| Column | Type | Used For |
|--------|------|----------|
| id | uuid | Asset key |
| shoot_id | uuid | Relationship |
| cloudinary_id | text | Image source |
| url | text | Display |
| dna_score | integer | Badge |
| dna_scores | jsonb | Pillar breakdown |
| status | enum | Status badge |
| tags | text[] | Filtering |

### shot_list (CRUD)

| Column | Type | Used For |
|--------|------|----------|
| id | uuid | Row key |
| shoot_id | uuid | Relationship |
| description | text | What to capture |
| channel | enum | Target platform |
| aspect_ratio | text | Specs |
| status | enum | Checkbox state |
| order | integer | Sorting |

### shoot_crew (CRUD)

| Column | Type | Used For |
|--------|------|----------|
| id | uuid | Assignment key |
| shoot_id | uuid | Relationship |
| contact_id | uuid | Crew member |
| role | enum | Role badge |
| confirmed | boolean | Status |

---

## Edge Functions

### audit-asset

| Field | Value |
|-------|-------|
| **Trigger** | Asset upload |
| **Input** | asset_url, brand_dna_pillars |
| **Process** | Gemini Vision analyzes color, lighting, composition, style |
| **Output** | dna_score, pillar_scores[], flags[], suggestions[] |

### generate-shot-list

| Field | Value |
|-------|-------|
| **Trigger** | User click "Generate Shot List" |
| **Input** | shoot_brief, mood_board_urls, channels, brand_dna |
| **Process** | AI generates channel-specific shot requirements |
| **Output** | shots[] with descriptions, channels, specs |

---

## Workflows

### Asset Upload & Audit Workflow

1. Photographer drags images to upload zone
2. Files upload to Cloudinary
3. Cloudinary webhook triggers asset-insert
4. audit-asset edge function called with asset URL
5. AestheticAuditorAgent scores each image
6. Scores stored in shoot_assets
7. Below-threshold assets flagged
8. Right Panel shows flagged items
9. User reviews, approves or requests re-edit

### Shot List Generation Workflow

1. User clicks "Generate Shot List" in Shot List section
2. System gathers brief, mood boards, target channels
3. generate-shot-list edge function called
4. `production-planner` creates channel-specific draft shots
5. Shots returned and displayed in table
6. User reviews, edits as needed
7. Photographer references list during shoot

### Crew Assignment Workflow

1. Producer clicks "Add Crew" in Crew section
2. System opens Professional Network modal
3. User searches/filters for professionals
4. User selects and assigns role
5. Assignment saved to shoot_crew
6. Crew member notified (email/in-app)

---

## Gemini 3 Features

| Feature | Usage |
|---------|-------|
| **Vision Analysis** | DNA compliance scoring of uploaded images |
| **URL Context** | Analyze mood board URLs for style extraction |
| **Pro Model** | Complex image analysis and shot list generation |
| **Flash Model** | Quick metadata extraction and tagging |

---

## Claude SDK Agents

| Agent | Purpose |
|-------|---------|
| **Shoot Assistant** | Natural language queries about this shoot |
| **Brief Summarizer** | Generate brief from mood boards and context |

---

## Frontend Wiring

### Components

```
src/pages/app/shoots/[id]/
  ├── index.tsx              # Detail page container
  ├── components/
  │   ├── ShootHeader.tsx    # Title, status, actions
  │   ├── SectionTabs.tsx    # Tab navigation
  │   ├── OverviewSection.tsx
  │   ├── GallerySection.tsx
  │   ├── ShotListSection.tsx
  │   ├── CrewSection.tsx
  │   ├── MoodBoardSection.tsx
  │   ├── DocumentsSection.tsx
  │   ├── DNAAuditSection.tsx
  │   ├── AssetLightbox.tsx  # Full image modal
  │   └── AssetCard.tsx      # Gallery item
  └── hooks/
      ├── useShootQuery.ts      # Fetch shoot data
      ├── useAssetsQuery.ts     # Fetch assets
      ├── useShotListQuery.ts   # Fetch shot list
      └── useUploadMutation.ts  # Handle uploads
```

### State Management

- React Query for server state
- URL hash for active tab (#gallery, #crew)
- Local state for selection, modals

---

## Backend Wiring

### API Routes

| Operation | Method | Endpoint |
|-----------|--------|----------|
| Get shoot | GET | `/rest/v1/shoots?id=eq.:id&select=*` |
| Get assets | GET | `/rest/v1/shoot_assets?shoot_id=eq.:id` |
| Upload asset | POST | `/functions/v1/upload-asset` |
| Audit asset | POST | `/functions/v1/audit-asset` |
| Update asset | PATCH | `/rest/v1/shoot_assets?id=eq.:id` |
| Generate shots | POST | `/functions/v1/generate-shot-list` |

### Cloudinary Integration

- Upload API for direct browser uploads
- Signed uploads with preset
- Webhook for post-processing
- Transformation URLs for thumbnails

---

## Dependencies

| Dependency | Why Needed |
|------------|------------|
| Task 01: Shoots Dashboard | Navigation context |
| Task 09: Cloudinary Integration | Asset storage |
| Task 12: Shoot Schema | Database tables |
| Task 07: DNA Compliance Auditor | Audit edge function |

---

## Implementation Order

1. Page routing and structure
2. Section tabs navigation
3. Overview section
4. Gallery section with upload
5. Asset card with DNA badge
6. Lightbox modal
7. Shot List section
8. Crew section
9. Mood Board section
10. Documents section
11. DNA Audit section
12. Real-time subscriptions
13. AI agent integrations

---

## Testing & Validation

### Functional Tests

| Test | Steps | Expected |
|------|-------|----------|
| Load detail | Navigate to /shoots/:id | Page renders with data |
| Upload asset | Drag file to zone | Asset uploads, audit runs |
| View lightbox | Click asset | Modal opens with scores |
| Bulk approve | Select 5, click Approve | Status updates |
| Generate shots | Click Generate | Shot list populates |

### Screenshot Validation

| Check | Method | Proof |
|-------|--------|-------|
| Gallery displays | Add test assets | Screenshot |
| DNA badges show | Upload varied scores | Screenshot |
| Lightbox works | Click asset | Screenshot |
| Mobile responsive | Resize | Screenshots |

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Asset upload | <5 seconds |
| Audit completion | <30 seconds |
| Page load | <2 seconds |
| Gallery pagination | <500ms |
