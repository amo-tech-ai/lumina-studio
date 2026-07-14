# 11 — Screen Implementation Checklists

> One checklist per screen. Tick during build. Components → [03](03-component-map.md). States → [08](08-state-map.md). Acceptance → [09](09-react-implementation-map.md).

**Every screen (baseline):**
- [ ] Layout matches prototype (3-panel desktop / tab+sheet mobile); tokens only, no hardcoded hex
- [ ] Navigation in/out wired (routes + deep-link params)
- [ ] Shared components reused (no re-implementation)
- [ ] All states (per [08](08-state-map.md)); skeleton not spinner
- [ ] AI dock: contextual greeting + chips (never "How can I help?")
- [ ] Mobile: tab bar + More sheet + panel-as-sheet + chat dock above tabs
- [ ] A11y: labels, ≥44px targets, focus order, live region for streaming, why-disabled hints
- [ ] Tests: render, states, nav, key interactions; no console errors
- [ ] No dead **primary** actions

---

### Command Center
- [ ] Hero/portfolio · approvals (ApprovalCard) · quick actions · realtime status strip (live/reconnecting/stale/blocked + Refresh/Request-access)
- [ ] States: populated/loading/empty/error/approval · brand rows → Brand Detail

### Brand List
- [ ] BrandCard grid (has-data/no-data/analysing) · SearchBar (name/brand/status + no-match) · FilterBar
- [ ] Card/rail/Fix-now → `/app/brand/:id` · per-card analysing · non-durable retry

### Brand Detail
- [ ] DNA hero + pillars · breadcrumb → list · **Plan a Shoot** → wizard (`?brand&campaign&season`)
- [ ] States: loaded/analysing(n/47)/error(Retry·Report·Go back)/no-data/approval · assets (AssetCard tile) · approvals
- [ ] **EvidenceBlock**: click a DNA pillar → modal (score→potential, confidence, why, reasoning, evidence, suggestions, before/after, Approve→re-score)

### Shoots List
- [ ] ShootCard grid · search+filter combine · Open → detail · New → wizard

### Shoot Detail
- [ ] 9 tabs (Overview·Shot List·Assets·Team·Schedule·Budget·Approvals·Deliverables·Activity) · insights panel
- [ ] Resolve `:id` · edit-shoot modal · View-in-Assets deep-link (header + Overview)

### Shoot Wizard
- [ ] 10 steps · inline dock · hydrate+lock Step 2 from params (Change to edit)
- [ ] Review = Production Readiness dashboard (live scoring from props/savings/shot edits)
- [ ] Confirm → create → detail · Save draft · unsaved-exit guard · step-jump menu

### Campaigns
- [ ] CampaignCard grid · card → right-panel detail (deliverables + timeline) · search/filter
- [ ] **D-DS5 selection**: Select toggle · checkbox overlay · bulk bar (Duplicate/Archive/Select all/Clear) · drag card → drop dock (Duplicate/Archive)
- [ ] **EvidenceBlock**: “Explain campaign health” → modal (health from deliverables/timeline/quality/budget; Approve→re-score)

### Assets
- [ ] Masonry + table toggle · FilterBar (type/DNA/search) · `?shoot=` chip (filter + clear + URL)
- [ ] Right panel: preview · DNA-match · **AI analysis** · **channel readiness** · used-in · actions (use shoot/campaign · Replace · Download · Channel Preview)
- [ ] **Upload** modal (Uploading→Auto-tagging→DNA analysis→Ready, per-file) · **D-DS5 selection**: Select toggle · checkbox overlay · bulk bar · drag → drop dock (Shoot/Campaign)
- [ ] **EvidenceBlock**: “Explain DNA match” → modal (score→potential, evidence imgs, suggestions, Approve→re-score)

### Matching
- [ ] Swipe deck + data table · Save/Invite toasts · **Shortlist (n) drawer** (Remove · Send invites) · persists across swipe/table
- [ ] **D-DS5 selection** (table): Select toggle · row checkboxes · bulk bar (Save to shortlist/Invite/Select all/Clear)
- [ ] **EvidenceBlock**: “Explain fit score” → modal (creator fit: confidence, reasoning, evidence, suggestions, Approve→re-score)

### Channel Preview
- [ ] Phone frames (FB/IG feed/IG story/TikTok) · safe-zone + image/video toggles · channel-readiness checks
- [ ] Publish: confirm (select/deselect channels → count) → progress (per selected) → success → Return to dashboard
- [ ] **EvidenceBlock**: “Explain readiness” → modal (channel readiness: crop reasoning, safe-zone evidence, DNA breakdown, crop suggestions, Approve→re-score)

### Onboarding
- [ ] 13-screen funnel · per-screen validation · progress segments · review dock
- [ ] Analysis (screen 12) → DNA payoff (13) → **Open FashionOS** → `/app`
