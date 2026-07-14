# Claude Design Prompt — Command Center (`/app`)

**Screen:** Command Center — the operator's home screen after login.
**Route:** `/app`
**Agent:** `production-planner`

Paste this prompt into Claude Design after uploading all Tier 1–4 files from `00-upload-manifest.md`.
Then upload the `01-dashboard.md` wireframe and any live screenshots you have.

---

## Prompt (copy everything below this line)

---

Design the **Command Center** screen (`/app`) for iPix / FashionOS — an AI-native SaaS platform for fashion brand operators.

### Layout

Use the 3-panel grid from `design-system-rules.md`:

```
grid-template-columns: auto  minmax(0, 1fr)  auto
                        ↑          ↑              ↑
                    NavSidebar  Workspace   IntelligencePanel
```

- **NavSidebar** — `var(--sidebar-width)` = 3.5rem collapsed, `var(--sidebar-width-expanded)` = 14rem expanded. White bg (`var(--nav-bg)`), 1px right border (`var(--nav-border)`).
- **Workspace** — flex-1. Background `var(--color-bg-page)` (#FBF8F5). Full height, vertically scrollable if content overflows.
- **IntelligencePanel** — white bg (`var(--intel-bg)`), 1px left border (`var(--intel-border)`). Width: 320px. Never dark mode.

Page background: `var(--color-bg-page)` (#FBF8F5 warm off-white). Not pure white, not gray.

---

### NavSidebar — Left panel

**Collapsed state (default):** 3.5rem wide, icon rail only.

Top section (icons, vertically stacked, 48px touch targets):
- Hamburger / expand icon at top
- Brand switcher: show active brand logo/initial (Nike → N) with a small orange dot indicator. Badge count `[3]` shown as `var(--color-accent)` pill if approvals pending.
- Divider `var(--color-border-subtle)`
- Nav icons (Lucide icons, 20px, `var(--color-text-secondary)` inactive, `var(--color-accent)` active):
  - Home (active state — this screen)
  - Layers (Brands)
  - Camera (Shoots)
  - Grid (Assets)
  - Megaphone (Campaigns)

Bottom section:
- User avatar (32px circle, initials SK)
- Settings icon

**Expanded state (hover or click):** 14rem wide, icon + label pairs. Same items, labels appear to the right. Active item: `var(--nav-item-active)` bg (#F5F0EB), `var(--nav-item-active-text)` label (#E87C4D). Section label "BRANDS" above brand list in `var(--font-size-xs)` `var(--color-text-muted)`.

In expanded state, show under brand switcher:
- `● Nike  [3]` — orange dot, brand name, approval badge
- `○ Adidas` — grey dot, no badge
- `○ Zara` — grey dot
- `+ Add brand` ghost link at bottom of brand list

Recent chats section (expanded state only):
- Label: "RECENT" in `var(--font-size-xs)` `var(--color-text-muted)`
- 3 items: "Spring shoot", "DNA review", "IG campaign" — `var(--font-size-sm)` truncated

---

### Workspace — Center panel

The workspace is the AI conversation surface. The Creative Director agent (`production-planner`) speaks first.

**AI greeting card** (top of workspace, not a modal — inline):
- Not a bare chat bubble. It's a structured context card.
- Header line: `You're working with Nike.` — `var(--font-size-base)` `var(--font-weight-semibold)` `var(--color-text-primary)`
- Body: `3 approvals need your review. Next: generate IG deliverables for Spring Campaign.` — `var(--font-size-sm)` `var(--color-text-secondary)`
- Subtle bg: `var(--color-bg-subtle)`, 1px border `var(--color-border)`, `var(--card-radius)` = 0.625rem

**Quick-action chips** (below greeting, horizontal row):
Three `<Button variant="outline" size="sm">` chips:
1. `Generate deliverables`
2. `Review approvals`
3. `Plan a shoot`

Chip style: white bg, 1px `var(--color-border)`, 0.625rem radius, `var(--font-size-sm)`, `var(--color-text-primary)`. On hover: `var(--color-bg-subtle)` bg.

**Content area** (below chips):
Empty for the populated state — this is where AI responses render as cards. Show a subtle scroll indicator if content would overflow.

**Chat input** (pinned to bottom of workspace):
- Full-width input: `var(--color-bg-card)` bg, 1px `var(--color-border)` border, 0.625rem radius, placeholder `Ask anything…`
- Mic icon (Lucide `Mic`) left, Send icon (Lucide `Send`) right — both `var(--color-text-muted)`, orange on hover `var(--color-accent)`
- 16px padding inside input

---

### IntelligencePanel — Right panel

Always white bg (`var(--primitive-white)`). Never dark mode even if OS is dark.

**Panel header:**
- Brand name: `Nike` — `var(--font-size-base)` `var(--font-weight-semibold)`
- Dropdown chevron (can switch active brand)
- Status chip: `active` — `var(--status-active-text)` (#059669), `var(--status-active-bg)` (#D1FAE5), `var(--font-size-xs)`, pill shape

**DNA Score section:**

Overall score: `87` — `var(--font-size-display)` (32px) `var(--font-weight-bold)` `var(--color-text-primary)`. Right-aligned label "DNA Score".

Full-width progress bar (overall): filled 87% in `var(--color-dna-high)` (#059669), track in `var(--dna-bar-track)`. Height: 6px, full radius.

Pillar breakdown (3 rows, each with label + score + bar):
```
Brand     ████████░  88
Visual    ██████░░░  65
Voice     █████████  94
```
- Label: `var(--font-size-sm)` `var(--color-text-secondary)`
- Score: `var(--font-size-sm)` `var(--font-weight-medium)` right-aligned
- Bar: 4px height, `var(--dna-bar-high)` for ≥80, `var(--dna-bar-mid)` for 60–79, `var(--dna-bar-low)` for <60
- Visual pillar at 65 = `var(--dna-bar-mid)` (#D97706 amber)

Divider: `var(--color-border-subtle)` 1px.

**Approvals section:**

Header: `Approvals` label left, badge `[3]` orange pill right.

Stack of 3 ApprovalCards (HITL pattern):

Each card:
- Border: 1.5px `var(--approval-border)` (#F3B93C)
- Background: `var(--approval-bg)` (#FFFBF0)
- Radius: 0.625rem
- Padding: 12px
- Warning triangle icon (Lucide `AlertTriangle`, 14px, amber) + title right

Card 1: `Brand DNA draft`
- Body: 2-line preview of proposed DNA change (truncated)
- Confidence: `87% confidence` — `var(--ai-confidence-high)` green text, `var(--font-size-xs)`
- Source: `Based on web crawl` — `var(--font-size-xs)` `var(--color-text-muted)`
- Two buttons: `[Approve]` `[Edit]`
  - Approve: `<Button variant="default" size="sm">` — orange bg `var(--color-accent)`, white text
  - Edit: `<Button variant="outline" size="sm">` — white bg, border, dark text

Card 2: `IG caption draft` — same structure, confidence `72%` (`var(--ai-confidence-mid)` amber)
Card 3: `Shot list v2` — same structure, confidence `91%` (`var(--ai-confidence-high)` green)

**Panel tabs** (below approvals, pinned):
`Overview | Approvals | Activity` — using `<Tabs>` from `ui/tabs.tsx`. Active tab: `var(--color-accent)` underline + text. Inactive: `var(--color-text-muted)`.

---

### Generate all 5 states

**State 1 — Populated (primary state)**
Exactly as described above. Nike active, 3 approvals, DNA scores loaded.

**State 2 — Empty (no brands yet)**
- Left nav: No brand items. Show `+ Add your first brand` CTA.
- Center workspace: AI greeting changes to: `Welcome! Let's set up your first brand. I can crawl your website and build your Brand DNA in minutes.` + `[Set up brand]` button (primary, orange).
- Right panel: Hidden or shows empty state: `No brand selected` in `var(--color-text-muted)` centered.

**State 3 — Loading (skeleton)**
Use `<Skeleton>` from `ui/skeleton.tsx` for:
- DNA score number: skeleton 48px wide, 32px tall
- Each score bar: skeleton 100% wide, 6px tall
- Each approval card: skeleton card (120px tall, full width)
- Greeting card: 2 skeleton lines

Skeleton color: `var(--color-bg-subtle)` with standard shimmer animation.

**State 4 — Error (right panel fetch failed)**
Right panel shows:
- Error icon (Lucide `WifiOff`, 24px, `var(--color-text-muted)`)
- `Brand unavailable` — `var(--font-size-sm)` `var(--color-text-muted)`
- `[Try again]` ghost button
Center workspace continues working normally — AI chat is not affected by right panel error.

**State 5 — Approval pending (agent awaiting human)**
Center workspace shows an inline HITL interrupt card (not replacing the chat — appearing inline in message thread):
- Same ApprovalCard style: amber border + amber bg
- Title: `Brand DNA ready for review`
- Full before/after diff visible: two columns, `Before` / `After` labels
- Confidence: `87%` with evidence source: `Crawled 47 pages of nike.com`
- `[Approve]` `[Edit]` `[Reject]` buttons (reject uses `<Button variant="ghost" size="sm">`)
- Agent status: thinking dots `···` above the card with label `Waiting for your approval`

---

### Design tokens to use (never hardcode hex values)

| Element | Token |
|---|---|
| Page bg | `var(--color-bg-page)` |
| Card bg | `var(--color-bg-card)` |
| Card border | `var(--color-border)` |
| Card radius | `var(--card-radius)` = 0.625rem |
| Card shadow | `var(--shadow-card)` |
| Accent (CTA) | `var(--color-accent)` |
| Approval border | `var(--approval-border)` |
| Approval bg | `var(--approval-bg)` |
| DNA bar high | `var(--dna-bar-high)` |
| DNA bar mid | `var(--dna-bar-mid)` |
| DNA bar low | `var(--dna-bar-low)` |
| Nav bg | `var(--nav-bg)` |
| Intel panel bg | `var(--intel-bg)` = white always |
| Active nav | `var(--nav-item-active)` + `var(--nav-item-active-text)` |
| Body text | `var(--color-text-primary)` |
| Secondary text | `var(--color-text-secondary)` |
| Muted text | `var(--color-text-muted)` |
| Focus ring | `var(--color-border-focus)` = #E87C4D |

---

### Rules for this screen

1. IntelligencePanel is AI workspace — not a chat box. It shows context, approvals, DNA scores, and activity. Chat input is in the center workspace.
2. Never put detail panels in the right column. The right column is always IntelligencePanel.
3. Approval cards always show confidence % and evidence source. Never show an AI write without them.
4. The agent greeting in the center workspace must reference the active brand by name. Never a blank "How can I help?"
5. Quick-action chips are always visible — they are the primary navigation hint for common tasks.
6. ApprovalCard buttons: Approve = primary orange. Edit = outline. Reject = ghost (destructive-light).
7. All text in the IntelligencePanel is `var(--font-size-sm)` or smaller. Panel is compact, not spacious.
8. DNA score bars animate in on load (`var(--duration-normal)` = 250ms, `var(--ease-default)`). No animation if `prefers-reduced-motion`.

---

### Output format

Generate as a full-page HTML prototype:
- Exact pixel layout, not a wireframe
- Real token values (use the CSS variable names — they resolve from `tokens.css`)
- Use Geist Sans for all text (system fallback: -apple-system, sans-serif)
- Use Geist Mono for numeric data (DNA scores, badge counts)
- All 5 states as separate sections or toggle-able views
- Include hover states on all interactive elements
- NavSidebar should be collapsible/expandable on click
- Mobile: at `max-width: 1024px`, NavSidebar collapses to icon rail, IntelligencePanel hides (accessible via bottom sheet or drawer)

Do not add features not described above. Do not add dark mode. Do not add gradients.
