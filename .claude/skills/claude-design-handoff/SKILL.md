---
name: claude-design-handoff
description: >
  Design-to-code handoff for iPix/FashionOS: converts Claude Design exports (HTML dc-import
  libraries, *.v2*.dc.html screens), screenshots, mockups, and design-system docs into
  implementation-ready tasks and production code. Visual system: v3 Zeely Editorial
  (white/grey/black, Inter, black actions, image-first). Use when the user says "implement
  this design", "import Claude Design", "handoff from design", "convert mockup to code",
  "design to code", "map design to iPix stack", or shows design files from
  Universal design prompt/. Covers intake, gap analysis, DC library mapping, Phase A/B/C
  plan, Linear tasks, code generation, and QA. Does NOT handle Figma imports (Figma MCP)
  or wireframe creation from scratch (mde-wireframe).
---

# claude-design-handoff — design → production code

Canonical handoff from **design artifacts** to **production iPix/FashionOS code**.

**North star:** never start coding until analysis + reuse audit are complete.

**Design system:** v3 **Zeely Editorial** — pure white/grey/black, **Inter** UI, **black** primary actions, image-first, persistent AI chat dock. v2 Atelier (warm off-white, orange chrome) is **retired**.

---

## Pipeline at a glance

```
Design Input
  │
  ├─ 1 · Intake & Analysis      → design-intake.md + zeely-v3-dc-library.md
  ├─ 2 · Gap Analysis           → app/ + Universal design prompt/ trackers
  ├─ 3 · Component Mapping      → component-mapping.md + COMPONENTS.md
  ├─ 4 · Design System Check    → design-system-validation.md
  ├─ 5 · Implementation Plan    → implementation-plan.md (Phase A/B/C)
  ├─ 6 · Linear Task Generation → task-template.md
  ├─ 7 · Code Generation        → code-generation.md
  └─ 8 · QA & Verification      → visual-qa.md + checklist.md
```

---

## When to invoke

| Trigger | Route |
|---------|-------|
| Claude Design HTML export / `*.v2*.dc.html` | Step 1 → `design-intake.md` + `zeely-v3-dc-library.md` |
| Component library / `dc-import` | Step 3 → `COMPONENTS.md` + `component-mapping.md` |
| "Does this violate design system?" | Step 4 → `design-system-validation.md` |
| "Create Linear tasks" | Step 6 → `task-template.md` |
| "Generate code" | Step 7 → `code-generation.md` |
| "QA this UI" | Step 8 → `visual-qa.md` |
| Full handoff | All steps in order |

### Don't invoke for

- Figma file URL — use Figma MCP
- Wireframes from scratch — use `mde-wireframe`
- Pure backend — no UI
- Token-only tweaks — read `app/DESIGN.md` directly

---

## Step 1 — Design Intake

**Read:** [`references/design-intake.md`](references/design-intake.md) · [`references/zeely-v3-dc-library.md`](references/zeely-v3-dc-library.md)

### Read order (Claude Design HTML export)

```
1.  DESIGN.md
2.  components/COMPONENTS.md
3.  Component Library.dc.html
4.  checklist.md
5.  PLAN.md · todo.md · MOBILE-PLAN.md
6.  Target *.v2*.dc.html (full read)
7.  Every dc-import → components/*.dc.html
8.  app/src/components/ (production gap)
9.  app/src/styles/tokens.css
```

Accepted inputs: Claude Design exports, screenshots, PDFs, HTML mocks.

**Output:** `templates/design-analysis.md` format → `docs/design/handoff-[screen]-[date].md`

---

## Step 2 — Gap Analysis

Before writing any code:

```bash
# Prototype progress (Claude Design export)
cat "Universal design prompt/todo.md"
cat "Universal design prompt/checklist.md"

# Production tracker
cat app/design/todo.md | grep -E "(\[x\]|\[ \]|🔵|⬜|✅|🟢)"

# Production React components
find app/src/components -name "*.tsx" | sort

# DC library
ls "Universal design prompt/components/"

# dc-import usage on target screen
grep "dc-import" "Universal design prompt/[Screen].v2*.dc.html"
```

Rules:
- **Prototype 🟢 / checklist ✅** → do not rebuild HTML — port to React or extend
- **Production ✅ Recently done** → extend only
- **DC library exists** → port from `components/*.dc.html` spec, don't re-invent
- **Bespoke screens** (Matching, Shoot Wizard, etc.) → see COMPONENTS.md refactor status

---

## Step 3 — Component Mapping

**Read:** [`references/component-mapping.md`](references/component-mapping.md) · `Universal design prompt/components/COMPONENTS.md`

| Design Element | DC Source | React Target |
|---------------|-----------|--------------|
| 3-panel shell | `OperatorShell.dc.html` | `operator-panel.tsx` |
| Nav sidebar | `NavSidebar.dc.html` | `nav-sidebar.tsx` |
| Intelligence panel | `IntelligencePanel.dc.html` | **build** (IPI-242+) |
| AI chat dock | `PersistentChatDock.dc.html` | **build** + CopilotKit |
| Brand card | `BrandCard.dc.html` | **build** · Brand List dc-import |
| Shoot card | `ShootCard.dc.html` | **build** · Shoots List |
| Campaign card | `CampaignCard.dc.html` | **build** · Campaigns |
| Asset card | `AssetCard.dc.html` | **build** · Assets, Brand Detail, Shoot Detail |
| Approval card | `ApprovalCard.dc.html` | `approval-card.tsx` |
| Status chip | `StatusChip.dc.html` | Badge variants |
| Mobile tabs / sheet | `BottomNavigation` · `BottomSheet` | **build** |

**New screens:** compose from `OperatorShell.dc.html` + `dc-import`.

Full table: `references/component-mapping.md`.

---

## Step 4 — Design System Validation

**Read:** [`checklists/design-system-validation.md`](checklists/design-system-validation.md)

Run against `app/DESIGN.md`, `tokens.css`, and prototype `checklist.md`:

- [ ] Semantic tokens only — no hardcoded hex
- [ ] Page bg **pure white** `#FFFFFF` — not warm off-white `#FBF8F5`
- [ ] Primary actions **black** `#111111` — not orange `#E87C4D`
- [ ] Cards: white + `#E5E7EB` hairline, `--card-radius` 1.25rem
- [ ] HITL pending: **white card + amber hairline** + dot — not amber fill bg
- [ ] HITL approved: green hairline + check
- [ ] **Inter** UI font; **Geist Mono** numbers only
- [ ] Image-first editorial photography on content cards
- [ ] Persistent AI chat dock — context greeting, never "How can I help?"
- [ ] Skeleton loading — not spinners for content layout
- [ ] 3-panel shell: NavSidebar · Workspace · IntelligencePanel (white)
- [ ] All five states (or wizard step model)
- [ ] Every AI value: confidence % + evidence; edits: before/after
- [ ] Every AI write → ApprovalCard; Approve button black
- [ ] Mobile ≤1024px: tabs + intel sheet + dock above tabs
- [ ] Touch targets ≥ 44px; `prefers-reduced-motion`
- [ ] Light-mode only — no dark mode, gradients, heavy shadows
- [ ] `brand-intelligence`: error+retry — not stream reconnect UI
- [ ] dc-import / COMPONENTS.md consulted before new DC patterns

---

## Step 5 — Implementation Plan (Phase A / B / C)

**Read:** [`references/implementation-plan.md`](references/implementation-plan.md)

1. **Phase A — Reuse:** shadcn/ui primitives
2. **Phase B — Extend:** existing `nav-sidebar`, `operator-panel`, `approval-card`
3. **Phase C — Port/build:** from `components/*.dc.html` library

Handoff plans (when present): `Universal design prompt/plan/IMPLEMENTATION-PLAN.md`

---

## Step 6 — Linear Task Generation

**Read:** [`templates/task-template.md`](templates/task-template.md)

Branch: `ipi/<issue>-<short-name>` · ≥ 2 acceptance criteria · one concern per PR.

---

## Step 7 — Code Generation

**Read:** [`references/code-generation.md`](references/code-generation.md)

Order: Reuse → Extend → Port from DC library

Never generate code that:
- Uses warm off-white, orange primary, or Geist Sans body
- Hardcodes hex or uses primitive orange tokens in components
- Bypasses 3-panel shell
- Puts detail workspace in IntelligencePanel
- Uses spinners for content loading
- Creates dark mode, gradients, heavy shadows
- Inline approve buttons outside ApprovalCard
- Stream-reconnect UI on `brand-intelligence` screens
- Rebuilds prototypes already 🟢 in `checklist.md`

---

## Step 8 — QA & Verification

**Read:** [`checklists/visual-qa.md`](checklists/visual-qa.md)

Also run prototype audit checks from `Universal design prompt/checklist.md` §10 when verifying HTML.

Three passes: Visual · Accessibility · Engineering

```bash
cd app && npm run lint && npm run typecheck && npm test
```

---

## iPix-specific context

**Read:** [`references/ipix-context.md`](references/ipix-context.md)

- AI = Mastra + Gemini (server only)
- CopilotKit `/v2` only
- Tokens: `app/src/styles/tokens.css`
- 11 operator surfaces including **Shoot Detail** `/app/shoots/[id]`
- Prototype SSOT: `Universal design prompt/` (19 DCs, 11 screens)
- Approval gates **K/L** before new lightbox / Campaign Detail route

---

## Quick links

| Resource | Path |
|----------|------|
| DC library + dc-import | [references/zeely-v3-dc-library.md](references/zeely-v3-dc-library.md) |
| iPix context | [references/ipix-context.md](references/ipix-context.md) |
| Component mapping | [references/component-mapping.md](references/component-mapping.md) |
| Design intake | [references/design-intake.md](references/design-intake.md) |
| Implementation plan | [references/implementation-plan.md](references/implementation-plan.md) |
| Code generation | [references/code-generation.md](references/code-generation.md) |
| Design validation | [checklists/design-system-validation.md](checklists/design-system-validation.md) |
| Visual QA | [checklists/visual-qa.md](checklists/visual-qa.md) |
| Design analysis template | [templates/design-analysis.md](templates/design-analysis.md) |
| Linear task template | [templates/task-template.md](templates/task-template.md) |
| Handoff plans (project) | `Universal design prompt/plan/` |
