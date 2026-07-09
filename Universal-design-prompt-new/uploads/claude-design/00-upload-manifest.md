# Claude Design — Upload Manifest

What to upload, in what order, and why. Follow the tier sequence exactly — Claude Design builds its understanding layer by layer.

---

## Tier 1 — Foundation (upload first, establish visual identity)

These tell Claude Design what the design system looks like. Upload before anything else.

| File | Path | What Claude learns |
|---|---|---|
| **tokens.css** ⭐ | `app/src/styles/tokens.css` | All brand colors, spacing, shadows, motion, AI tokens |
| **globals.css** | `app/src/app/globals.css` | Radius vars, typography, theme |
| **design-system-rules.md** | `app/src/styles/design-system-rules.md` | Shell architecture, AI rules, component hierarchy |
| **components.json** | `app/components.json` | shadcn/ui config — component style + aliases |

**Instruction to paste after Tier 1:**
```
tokens.css is the canonical token source. Never hardcode colors.
Always prefer semantic tokens (--color-accent) over primitive tokens (--primitive-orange-500).
If a token is missing, suggest a new semantic token — never invent a raw hex value.
design-system-rules.md defines layout architecture and AI component behavior. Follow it strictly.
```

---

## Tier 2 — Primitives (upload second, establish component vocabulary)

These tell Claude Design which reusable components already exist. It must use them, not reinvent them.

| File | Path | Components |
|---|---|---|
| `ui/button.tsx` | `app/src/components/ui/button.tsx` | Button (default/outline/ghost/destructive) |
| `ui/card.tsx` | `app/src/components/ui/card.tsx` | Card base (all product cards extend this) |
| `ui/badge.tsx` | `app/src/components/ui/badge.tsx` | Badge (status chips, counts) |
| `ui/input.tsx` | `app/src/components/ui/input.tsx` | Input field |
| `ui/select.tsx` | `app/src/components/ui/select.tsx` | Select dropdown |
| `ui/tabs.tsx` | `app/src/components/ui/tabs.tsx` | Tab navigation |
| `ui/skeleton.tsx` | `app/src/components/ui/skeleton.tsx` | Loading skeleton |
| `ui/dialog.tsx` | `app/src/components/ui/dialog.tsx` | Modal dialog |
| `ui/sheet.tsx` | `app/src/components/ui/sheet.tsx` | Side sheet / drawer |
| `ui/sonner.tsx` | `app/src/components/ui/sonner.tsx` | Toast notifications |
| `ui/progress.tsx` | `app/src/components/ui/progress.tsx` | Progress bar |
| `ui/separator.tsx` | `app/src/components/ui/separator.tsx` | Divider |

**Instruction to paste after Tier 2:**
```
These are the only approved primitives. Every button, badge, card, and input must use these files.
Do not create custom variants. Use the existing variant props (size, variant) from each component.
All cards derive from ui/card.tsx — never create a standalone card that bypasses the Card base.
```

---

## Tier 3 — Composite + Feature Components (upload third)

Tell Claude Design what production-grade components look like and how they behave.

| File | Path | What Claude learns |
|---|---|---|
| `approval-card.tsx` | `app/src/components/brand-hub/approval-card.tsx` | HITL pattern: amber border, before/after diff, approve/reject |
| `brand-hub-client.tsx` | `app/src/components/brand-hub/brand-hub-client.tsx` | Brand hub composite layout with tabs |
| `scores-tab.tsx` | `app/src/components/brand-hub/scores-tab.tsx` | DNA score bars + citations block |
| `activity-tab.tsx` | `app/src/components/brand-hub/activity-tab.tsx` | Activity feed pattern |
| `ShootCard.tsx` | `app/src/components/shoot/ShootCard.tsx` | Card with DNA badge + status chip |
| `operator-panel.tsx` | `app/src/components/operator-panel/operator-panel.tsx` | Shell + CopilotSidebar wiring |
| `nav-sidebar.tsx` | `app/src/components/operator-panel/nav-sidebar.tsx` | Left nav rail |
| `copilot-tool-presentation.tsx` | `app/src/components/copilot/copilot-tool-presentation.tsx` | AI tool result card |
| `channel-preview-studio.tsx` | `app/src/components/media/channel-preview-studio.tsx` | Device preview layout |
| `hitl/BudgetApprovalCard.tsx` | `app/src/components/shoot/hitl/` | HITL shoot variants |

---

## Tier 4 — Design Documentation (upload fourth)

Context Claude Design cannot infer from code alone.

| File | Path | What Claude learns |
|---|---|---|
| **3-panel logic** | `docs/design/05-3-panel-logic.md` | Panel roles, widths, mobile rules, agent wiring |
| **HITL approval card spec** | `docs/design/08-components/hitl-approval-card.md` | Full approval card states + variants |
| **DNA score bars spec** | `docs/design/08-components/dna-score-bars.md` | Score bar anatomy + color thresholds |
| **AI intelligence panel spec** | `docs/design/08-components/ai-intelligence-panel.md` | Right panel content order + states |
| **Asset grid spec** | `docs/design/08-components/asset-grid.md` | Grid layout + DNA overlay |
| **Command palette spec** | `docs/design/08-components/command-palette.md` | ⌘K overlay |
| **Activity feed spec** | `docs/design/08-components/activity-feed.md` | Timestamped trail pattern |
| **Design system master** | `docs/design/00-design-system/design-system-master.md` | Visual style + influence references |
| **Visual style guide** | `docs/design/00-design-system/visual-style-guide.md` | Color palette, typography, iconography |

---

## Tier 5 — Wireframes (upload fifth, one at a time per session)

Each wireframe is the source of truth for one screen. Upload the target screen's wireframe at the start of that session.

| Wireframe | Path | Screen |
|---|---|---|
| 01-dashboard | `docs/design/wireframes/01-dashboard.md` | `/app` — Command Center |
| 02-brand-list | `docs/design/wireframes/02-brand-list.md` | `/app/brand` |
| 03-brand-detail | `docs/design/wireframes/03-brand-detail.md` | `/app/brand/[id]` |
| 04-campaigns | `docs/design/wireframes/04-campaigns.md` | `/app/campaigns` |
| 05-shoots-list | `docs/design/wireframes/05-shoots-list.md` | `/app/shoots` |
| 06-shoot-new | `docs/design/wireframes/06-shoot-new.md` | `/app/shoots/new` |
| 07-assets | `docs/design/wireframes/07-assets.md` | `/app/assets` |
| 08-matching | `docs/design/wireframes/08-matching.md` | `/app/matching` |
| 09-preview | `docs/design/wireframes/09-preview.md` | `/app/preview` |
| 10-onboarding | `docs/design/wireframes/10-onboarding.md` | `/app/onboarding` |
| 11-login | `docs/design/wireframes/11-login.md` | `/` login page |

---

## Tier 6 — Screenshots (upload sixth, per session)

For each screen session, upload screenshots of the current live UI so Claude has visual grounding.

| Screenshot | State | How to capture |
|---|---|---|
| Brand hub populated | DNA scores tab visible | `/app/brand/[id]` on port 3002 |
| Approval card active | HITL card in right panel | Brand with pending draft |
| Shoot list | Multiple shoot cards | `/app/shoots` |
| Nav rail collapsed | Icon-only left panel | Any `/app/*` route |
| Nav rail expanded | Full labels visible | Hover/click expand |
| Command center | Dashboard populated | `/app` with active brand |

---

## Session start template

Paste this at the start of every Claude Design session (after uploading files):

```
You are designing screens for iPix / FashionOS, an AI-native SaaS platform for fashion brand operators.

RULES:
1. tokens.css is the only source of colors. Never hardcode hex values.
2. Always use semantic tokens (--color-accent, --color-bg-page). Never primitive tokens.
3. All buttons use ui/button.tsx variants. All cards extend ui/card.tsx.
4. The shell is always: NavSidebar (auto) | Workspace (flex-1) | IntelligencePanel (auto).
5. IntelligencePanel is always white background — never dark mode.
6. Every AI-generated value shows: confidence %, evidence source, before/after.
7. Every AI write action shows an ApprovalCard (amber border #F3B93C, amber bg #FFFBF0).
8. Never create a chat-only right panel. IntelligencePanel = AI workspace.
9. Never put detail panels in the right column — they belong in the center workspace.
10. Generate all states: populated, empty, loading (skeleton), error, approval-pending.

BRAND:
- Background: #FBF8F5 (warm off-white)
- Cards: white, 1px #E8E0D8 border, 0.625rem radius
- Accent: #E87C4D (orange) — primary actions only
- Warning/pending: #F3B93C border + #FFFBF0 bg
- Font: Geist Sans body, Geist Mono for data
- Icons: Lucide (already in shadcn config)
```

---

## What NOT to upload

| Item | Reason |
|---|---|
| `.env`, `.env.local` | API keys, credentials |
| `node_modules/` | 500MB+ of irrelevant files |
| `supabase/migrations/` | Raw SQL with schema secrets |
| `.claude/` | Agent config with system prompts |
| `graphify-out/` | Large generated graph |
| `src/components/marketing/` | Different product surface |
| Build outputs (`.next/`, `dist/`) | Generated files |
| Private customer data | Never |
