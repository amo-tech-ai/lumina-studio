# 06: Brand Dashboards - Intelligence Command Center

> **⚠️ Deprecated for iPix MVP** — Superseded by [`docs/intelligence/ai/02-ai-native-dashboards-plan.md`](../../intelligence/ai/02-ai-native-dashboards-plan.md). FashionOS CRM/Sponsors/Events dashboards are **out of scope** unless revived in `prd.md`.

## Progress Tracker

| Task                      | Status         | Phase | Owner      | Notes                  |
| ------------------------- | -------------- | ----- | ---------- | ---------------------- |
| Overview Dashboard Design | ⬜ Not Started | 1     | Frontend   | Main entry point       |
| Shoots Dashboard          | ⬜ Not Started | 1     | Frontend   | Content production hub |
| CRM Dashboard             | ⬜ Not Started | 1     | Frontend   | Contact management     |
| Sponsors Dashboard        | ⬜ Not Started | 2     | Frontend   | Partnership tracking   |
| Media Library             | ⬜ Not Started | 1     | Frontend   | Asset management       |
| Analytics Dashboard       | ⬜ Not Started | 2     | Frontend   | Performance insights   |
| Three-Panel Layout        | ⬜ Not Started | 1     | Frontend   | Core layout system     |
| Right Panel Intelligence  | ⬜ Not Started | 2     | AI Team    | AI copilot integration |
| Settings Management       | ⬜ Not Started | 1     | Full Stack | User/brand preferences |

**Progress:** 0/10 completed (0%)

---

| Metric             | Details                                                |
| ------------------ | ------------------------------------------------------ |
| **Feature ID**     | 006                                                    |
| **Category**       | Dashboards / UI                                        |
| **Stakeholders**   | Brand Owners, Producers, Creative Directors, All Users |
| **Primary Agents** | CopilotAgent, DNASyncAgent, AnalyticsAgent             |
| **Phase**          | Phase 1 (Core), Phase 2 (AI Enhancement)               |
| **Status**         | Planning                                               |

---

## Executive Summary

Brand Dashboards form the operational command center of FashionOS. Built on the universal 3-panel layout system, each dashboard provides contextual intelligence through the Left Panel (navigation and context), Main Panel (human work), and Right Panel (AI intelligence). Every screen enables users to monitor operations, execute tasks, and receive proactive AI suggestions without leaving their current workflow.

---

## 3-Panel Layout Logic

### Mental Model

> **Left = Context** • **Main = Work** • **Right = Intelligence**

### Desktop Layout (1024px+)

| Panel     | Width       | Purpose              | Contains                                         |
| --------- | ----------- | -------------------- | ------------------------------------------------ |
| **Left**  | 280px fixed | Navigation and scope | Brand selector, nav menu, filters, quick actions |
| **Main**  | Flexible    | Human-first work     | Lists, forms, editors, dashboards, wizards       |
| **Right** | 380px fixed | AI assistance        | Suggestions, warnings, actions, explanations     |

### Tablet Layout (768-1023px)

| Panel     | Behavior           | Notes                   |
| --------- | ------------------ | ----------------------- |
| **Left**  | Collapsible drawer | Overlays main when open |
| **Main**  | Full width         | Primary focus           |
| **Right** | Hidden or modal    | AI accessed via button  |

### Mobile Layout (Below 768px)

| Panel     | Behavior          | Notes                |
| --------- | ----------------- | -------------------- |
| **Left**  | Bottom navigation | Always visible icons |
| **Main**  | Full screen       | Scrollable content   |
| **Right** | Slide-up drawer   | AI on demand         |

---

## Dashboard Screens

### 1. Overview Dashboard

**Route:** `/app`

**Description:** The central hub showing brand health, active projects, and priority actions.

**Purpose:** Give users a 30-second snapshot of everything requiring attention.

**Goals:**

- Display key metrics at a glance
- Surface urgent tasks and deadlines
- Provide quick navigation to active projects

**Data Displayed:**

- Active shoots count and status
- Pending tasks with due dates
- Recent AI suggestions
- Brand DNA compliance score
- Upcoming deadlines

**Features:**

- Metric cards with sparkline trends
- Priority task queue
- Event/shoot status timeline
- Quick create buttons
- Recent activity feed

**AI Agents Utilized:**
| Agent | Role | Trigger |
|-------|------|---------|
| PriorityAgent | Ranks tasks by urgency | On dashboard load |
| TrendAnalyzerAgent | Calculates trend lines | Daily batch |
| CopilotAgent | Suggests next actions | Continuous |

**Right Panel Intelligence:**

- "3 tasks due this week" with quick actions
- "Recommended: Review pending sponsor contract"

---

### 2. Events Dashboard

**Route:** `/app/events`

**Description:** Centralized view of all fashion events with status tracking and AI-powered planning.

**Purpose:** Enable producers to manage runway shows, galas, and pop-ups from planning to execution.

**Goals:**

- Visualize event pipeline and status
- Enable quick event creation
- Surface critical path issues

**Screens Content:**
| View | Content | Interaction |
|------|---------|-------------|
| List View | Event cards with status, date, budget | Click to open detail |
| Grid View | Visual cards with hero images | Hover for quick actions |
| Calendar View | Month/week timeline | Drag to reschedule |
| Kanban View | Status columns | Drag between stages |

**Features:**

- Multi-view toggle (list, grid, calendar, kanban)
- Status filters (Planning, Confirmed, Live, Completed)
- Budget tracking badges
- Critical path warnings
- Bulk actions (archive, assign, update status)

**AI Agents Utilized:**
| Agent | Role | Trigger |
|-------|------|---------|
| EventPlannerAgent | Generates task lists from SOP | Event creation |
| CriticalPathAgent | Monitors blockers | Task status change |
| VenueRecommenderAgent | Suggests venues | During wizard |
| BudgetAnalyzerAgent | Tracks spend patterns | On budget update |

**Right Panel Intelligence:**

- "Event X missing venue confirmation" alert
- "Similar events used 15% less budget" insight
- "Recommended: Confirm catering by Friday"

---

### 3. Shoots Dashboard

**Route:** `/app/shoots`

**Description:** Content production hub for photo and video shoots with DNA compliance tracking.

**Purpose:** Manage shoot planning, crew coordination, and asset delivery with brand consistency enforcement.

**Goals:**

- Track all active and planned shoots
- Monitor DNA compliance scores
- Coordinate professional network

**Screens Content:**
| View | Content | Interaction |
|------|---------|-------------|
| List View | Shoot cards with type, crew, DNA score | Click to open detail |
| Grid View | Visual gallery with sample images | Hover for quick audit |
| Calendar View | Scheduled shoots on timeline | Click to view details |

**Features:**

- DNA compliance badges (color-coded 0-100)
- Crew assignment overview
- Shot list completion percentage
- Asset upload progress
- Channel distribution status

**AI Agents Utilized:**
| Agent | Role | Trigger |
|-------|------|---------|
| AestheticAuditorAgent | Audits uploaded images | Asset upload |
| ShootTypeRecommenderAgent | Suggests shoot types | Wizard start |
| ProfessionalMatcherAgent | Matches crew to requirements | Crew assignment |
| ImageGeneratorAgent | Creates shot lists | Brief submission |

**Right Panel Intelligence:**

- "5 images flagged for DNA review" warning
- "Photographer Sarah Chen available next week" suggestion
- "Shot list 80% complete, generate remaining?"

---

### 4. CRM Dashboard

**Route:** `/app/crm`

**Description:** Contact relationship management for models, vendors, sponsors, and media professionals.

**Purpose:** Maintain relationships with the fashion ecosystem and automate outreach.

**Goals:**

- Centralize contact information
- Track interaction history
- Automate follow-up communications

**Screens Content:**
| Segment | Content | Features |
|---------|---------|----------|
| Models | Portfolio, measurements, availability | Casting quick-add |
| Vendors | Services, rates, reliability score | Contract status |
| Sponsors | Package tier, deliverables, ROI | Renewal tracking |
| Media | Portfolio, rates, past work | Assignment history |

**Features:**

- Contact segmentation by type
- Interaction timeline
- Task auto-generation from interactions
- WhatsApp/email integration
- Relationship strength scoring

**AI Agents Utilized:**
| Agent | Role | Trigger |
|-------|------|---------|
| RelationshipManagerAgent | Scores relationship health | Weekly batch |
| OutreachComposerAgent | Drafts personalized messages | User request |
| VendorScoutAgent | Finds new vendors | Search request |
| CastingMatcherAgent | Matches models to shoots | Shoot creation |

**Right Panel Intelligence:**

- "Haven't contacted Vendor X in 45 days" reminder
- "Model Y perfect match for upcoming shoot" suggestion
- "Draft follow-up email to sponsor?" action

---

### 5. Sponsors Dashboard

**Route:** `/app/sponsors`

**Description:** Partnership management hub tracking sponsor deliverables, ROI, and renewal pipeline.

**Purpose:** Maximize sponsor value delivery and automate ROI reporting.

**Goals:**

- Track deliverable completion
- Calculate and report ROI
- Manage renewal pipeline

**Screens Content:**
| View | Content | Metrics |
|------|---------|---------|
| Active Sponsors | Current partnerships | Deliverable progress |
| Pipeline | Potential sponsors | Conversion probability |
| Historical | Past sponsors | Renewal rate, lifetime value |

**Features:**

- Deliverable checklist with status
- EMV (Earned Media Value) calculation
- Automated PDF report generation
- Renewal reminder automation
- Logo placement tracking

**AI Agents Utilized:**
| Agent | Role | Trigger |
|-------|------|---------|
| ROICalculatorAgent | Computes EMV and ROI | Event completion |
| ReportGeneratorAgent | Creates PDF reports | Manual trigger |
| RenewalPredictorAgent | Scores renewal likelihood | Quarterly batch |
| ProposalWriterAgent | Drafts sponsor proposals | User request |

**Right Panel Intelligence:**

- "Sponsor X deliverables 90% complete" status
- "Renewal risk: Sponsor Y engagement down 30%"

---

### 6. Media Library

**Route:** `/app/media`

**Description:** Centralized asset management with AI-powered tagging and DNA compliance auditing.

**Purpose:** Store, organize, and transform media assets while ensuring brand consistency.

**Goals:**

- Organize assets by shoot, event, and channel
- Enforce DNA compliance
- Enable multi-channel asset transformation

**Screens Content:**
| View | Content | Interaction |
|------|---------|-------------|
| Grid View | Asset thumbnails with DNA badges | Click to preview |
| List View | Asset details with metadata | Bulk selection |
| Collections | Grouped by shoot/event/campaign | Folder navigation |

**Features:**

- DNA compliance scoring on upload
- Automatic tagging via AI
- Cloudinary transformation presets
- Channel-specific resize (Instagram, Amazon, etc.)
- Bulk download and export

**AI Agents Utilized:**
| Agent | Role | Trigger |
|-------|------|---------|
| AestheticAuditorAgent | Scores DNA compliance | Asset upload |
| AutoTaggerAgent | Generates tags from image | Asset upload |
| TransformationAgent | Applies channel presets | User request |
| CollectionOrganizerAgent | Suggests organization | Weekly batch |

**Right Panel Intelligence:**

- "12 assets pending DNA review" queue
- "Resize for Instagram?" quick action
- "These assets match upcoming shoot brief" suggestion

---

### 7. Analytics Dashboard

**Route:** `/app/analytics`

**Description:** Performance insights across events, shoots, sponsors, and social channels.

**Purpose:** Data-driven decision making with AI-powered trend analysis.

**Goals:**

- Visualize performance metrics
- Identify trends and patterns
- Provide actionable recommendations

**Screens Content:**
| Section | Metrics | Visualization |
|---------|---------|---------------|
| Shoots | DNA scores, output volume, efficiency | Trend lines |
| Sponsors | ROI, EMV, renewal rate | Comparison charts |
| Social | Followers, engagement, reach | Growth curves |

**Features:**

- Customizable date ranges
- Comparative analysis (period vs period)
- Export to PDF/CSV
- Scheduled report delivery
- KPI alert configuration

**AI Agents Utilized:**
| Agent | Role | Trigger |
|-------|------|---------|
| TrendAnalyzerAgent | Identifies patterns | Data refresh |
| AnomalyDetectorAgent | Flags unusual metrics | Real-time |
| RecommendationEngine | Suggests improvements | Weekly batch |
| ForecastingAgent | Predicts future performance | User request |

**Right Panel Intelligence:**

- "Engagement up 25% after content strategy change" insight
- "Predict Q2 event revenue" action
- "Anomaly: Sponsor ROI dropped 40% - investigate"

---

### 8. Settings Page

**Route:** `/app/settings`

**Description:** User and brand configuration center for preferences, integrations, and team management.

**Purpose:** Enable customization and third-party service connections.

**Sections:**
| Section | Features |
|---------|----------|
| Profile | Personal info, avatar, preferences |
| Brand | DNA pillars, style guide, logos |
| Team | Member management, roles, permissions |
| Integrations | Cloudinary, Stripe, WhatsApp, Postiz |
| Notifications | Email/push preferences |
| Billing | Subscription, usage, invoices |

---

## User Journey Schema

### New User First Dashboard Experience

1. **Login** → Redirect to Overview Dashboard
2. **Overview** → See empty state with setup prompts
3. **Left Panel** → Brand selector shows current brand
4. **Main Panel** → Setup wizard cards for Events, Shoots, DNA
5. **Right Panel** → "Complete your brand profile" suggestion
6. **Action** → Click "Create First Event" → Event Wizard

### Power User Daily Workflow

1. **Login** → Overview Dashboard loads with priority tasks
2. **Scan** → Quick review of metrics and urgent items
3. **Navigate** → Click into Events Dashboard for active event
4. **Work** → Update task status in main panel
5. **AI Assist** → Right panel shows blocker recovery suggestion
6. **Execute** → Accept suggestion, AI updates dependent tasks
7. **Continue** → Move to Shoots Dashboard for asset review

---

## Edge Functions

| Function             | Purpose                         | Trigger        | AI Provider |
| -------------------- | ------------------------------- | -------------- | ----------- |
| `dashboard-metrics`  | Aggregate dashboard data        | Page load      | None        |
| `priority-tasks`     | Calculate task priority         | Dashboard load | Claude      |
| `copilot-suggestion` | Generate contextual suggestions | Context change | Claude      |
| `trend-analysis`     | Calculate metric trends         | Daily cron     | Gemini      |
| `anomaly-detection`  | Flag unusual patterns           | Data update    | Gemini      |

---

## Implementation Phases

| Phase   | Focus               | Deliverables                                    |
| ------- | ------------------- | ----------------------------------------------- |
| **6.1** | Layout Foundation   | 3-panel layout, responsive behavior, navigation |
| **6.2** | Core Dashboards     | Overview, Shoots, Media Library                 |
| **6.3** | Extended Dashboards | CRM, Sponsors, Analytics                        |
| **6.4** | Right Panel AI      | CopilotAgent integration, proactive suggestions |
| **6.5** | Advanced Features   | Custom widgets, automated reports, forecasting  |

---

## Success Metrics

| Metric                 | Target              | Measurement            |
| ---------------------- | ------------------- | ---------------------- |
| Dashboard Load Time    | Less than 2 seconds | Performance monitoring |
| Task Completion Rate   | 80% from dashboard  | Action tracking        |
| AI Suggestion Adoption | 60% acceptance rate | Analytics              |
| User Session Duration  | 15+ minutes average | Session tracking       |
| Mobile Usage           | 30% of sessions     | Device analytics       |

---

## Key Points

- **Universal 3-Panel Layout**: Left (Context) • Main (Work) • Right (Intelligence)
- **AI Never Acts Silently**: All AI suggestions require human approval before execution
- **Context-Aware Intelligence**: Right panel adapts based on current screen and user context
- **Progressive Enhancement**: Core functionality works without AI, intelligence layer enhances
- **Mobile-First Responsive**: Full functionality on all device sizes
