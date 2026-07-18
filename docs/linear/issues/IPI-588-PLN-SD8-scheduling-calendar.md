## IPI-588 — PLN-SD8 — Scheduling Calendar view

**In plain terms:** Month/week calendar view of scheduled shoots/shoot days for a planner instance. Shoots rendered as cards within day cells of a CSS grid calendar.

**Blocked by:** IPI-578 (hard) — scheduling domain must be implemented first · **Soft dep:** IPI-483 (approval — calendar actions may need approval gates) · **Unblocks:** None directly · **Related:** IPI-579 (List view — sibling), IPI-580 (Timeline — sibling)

**Skills:** `nextjs-developer` · `frontend-design` · `shadcn`

**Labels:** PLANNER · SCHEDULING · FRONTEND · CALENDAR

**Milestone:** PLN-M2 · Scheduling

**Spec:** `Universal-design-prompt-4/planner/tasks/01-efficiency.md` §IPI-588
**Design:** `Universal-design-prompt-4/Pages/SCR-32-Planner-Workspace.dc.html` (workspace shell with Calendar section: CSS grid cells, shoot cards in day cells) · `Universal-design-prompt-4/components/EmptyState.dc.html` · `Universal-design-prompt-4/components/SkeletonLoader.dc.html` · `Universal-design-prompt-4/components/COMPONENTS.md`

---

### Completion steps

#### A. Data

- [ ] **A1** Consumes scheduling data from IPI-578 domain — proof: data loads correctly
- [ ] **A2** Monthly/weekly date range queries — proof: correct date filtering

#### B. Frontend

- [ ] **B1** Month grid: days as CSS grid cells, shoots as cards within cells — see `SCR-32-Planner-Workspace.dc.html` Calendar section (grid cells with shoot cards) — proof: browser smoke
- [ ] **B2** Week grid toggle: switch between month and week view — proof: browser smoke
- [ ] **B3** Click shoot card → opens shoot detail — proof: browser smoke
- [ ] **B4** Empty state when no shoots in date range — use `EmptyState.dc.html` — proof: browser smoke
- [ ] **B5** Loading skeleton — use `SkeletonLoader.dc.html` — proof: browser smoke

#### C. Architecture note

- [ ] **C1** Calendar uses CSS grid with day cells. Do NOT share a `<WeekGrid>` rendering abstraction with List/Timeline/Kanban — they have different layout models — proof: code review

#### D. Verify + ship

- [ ] **D1** `cd app && npm run lint && npm test` — proof: green
- [ ] **D2** Browser smoke: Calendar renders correctly, shoots appear in correct day cells — proof: browser

---

### Corrections Applied

- **Dependency corrected:** Blocked by IPI-578 (scheduling domain), NOT IPI-579/580 as previously classified
- **Soft dep on IPI-483:** Calendar actions (create/edit shoots) may need approval gates — verify at integration
- **Architecture note added:** Do NOT share WeekGrid — Calendar is CSS grid cells, not bars or table rows
- **Status:** To Do (blocked by IPI-578)
