# Design Intake & Analysis

**When to read:** receiving any design artifact before implementation.

---

## Input type detection

| Input | How to identify | Approach |
|-------|----------------|----------|
| Claude Design export (HTML) | `*.v2*.dc.html` + `components/` | Read screen full file + trace `dc-import` |
| Component library | `Component Library.dc.html` | Gallery reference; read `COMPONENTS.md` |
| Screenshot (PNG/JPG) | Pasted image | Vision analysis |
| HTML mock | `.html` with inline CSS | Read directly |
| PDF | Design document | PDF read / vision per page |
| Figma URL | `figma.com/design/…` | Figma MCP — **not this skill** |

---

## Design system map (iPix)

```
app/
├── DESIGN.md                         # Master spec (v3 Zeely Editorial)
├── src/styles/
│   ├── tokens.css                    # Semantic tokens — SSOT for code
│   └── design-system-rules.md        # Shell + AI patterns
└── src/components/                   # Production React (gap vs prototypes)

Universal design prompt/              # Claude Design export (when present)
├── DESIGN.md
├── checklist.md                      # Audit + completion tracker
├── PLAN.md · todo.md · MOBILE-PLAN.md
├── Component Library.dc.html
├── components/
│   ├── COMPONENTS.md                 # 19 DC specs
│   └── *.dc.html
└── *.v2*.dc.html                     # 11 screen prototypes
```

**Read `DESIGN.md` first.** For HTML exports, follow [`zeely-v3-dc-library.md`](zeely-v3-dc-library.md) read order.

---

## Claude Design screen intake workflow

1. Read target `*.v2*.dc.html` **top to bottom** (do not skim)
2. Grep `dc-import` — open each `components/*.dc.html` dependency
3. Read `components/COMPONENTS.md` for props/variants used
4. Check `checklist.md` §0 — what's done vs gated (K/L)
5. Check `PLAN.md` / `todo.md` — do not rebuild 🟢 prototypes
6. Gap analysis vs `app/src/components/`
7. Output spec via `templates/design-analysis.md`

---

## Extraction workflow

### Step A — Layout hierarchy (3-panel)

```
Page
├── NavSidebar (left)
├── Workspace (center)
│   ├── PageHeader
│   ├── Main content
│   └── PersistentChatDock (base)
└── IntelligencePanel (right — white)
    └── context → approvals → tabs → evidence → activity

Mobile ≤1024px:
  NavSidebar → BottomNavigation
  IntelligencePanel → BottomSheet
  Chat dock above tab bar
```

Onboarding: standalone — no 3-panel shell.

### Step B — Component inventory

| Component | Type | DC source | Location | States |
|-----------|------|-----------|----------|--------|
| BrandCard | Composite | `components/BrandCard.dc.html` | Workspace grid | populated, loading, empty, analysing |
| ApprovalCard | HITL | `components/ApprovalCard.dc.html` | Workspace / intel | pending, approved |
| PersistentChatDock | AI | `components/PersistentChatDock.dc.html` | Workspace base | idle, streaming |

### Step C — Design tokens (v3 Zeely)

```markdown
**Colors:**
- Page: #FFFFFF (--color-bg-page) — pure white
- Card: #FFFFFF + 1px #E5E7EB border
- Primary CTA: #111111 black (--color-action) — NOT orange
- HITL pending: amber hairline on white card — NOT amber fill
- HITL approved: #059669 hairline

**Typography:**
- UI: Inter
- Numbers: Geist Mono tabular-nums

**Layout:**
- Grid: auto minmax(0,1fr) auto
- Mobile breakpoint: 1024px
- Card/image radius: 1.25rem
```

**Retired — flag if seen in old files:** `#FBF8F5`, `#E87C4D` primary, `#E8E0D8` borders, Geist Sans body.

### Step D — Interactions & agent patterns

Document state transitions. For `brand-intelligence` screens: analysing → error+retry (not stream reconnect).

### Step E — Accessibility

Keyboard nav, 44px touch targets, focus trap on sheets, `prefers-reduced-motion`, status never color-only.

---

## Output spec format

Save to `docs/design/handoff-[screen-slug]-[date].md` using `templates/design-analysis.md`:

1. Screen name + prototype file path
2. dc-import dependency list
3. Layout tree
4. Component inventory (DC + React targets)
5. Token diff vs `tokens.css`
6. Five states
7. Mobile notes (MOBILE-PLAN §12)
8. Agent ID + durability pattern
9. Open questions

---

## Vision prompts (screenshots only)

When no local DC file exists, use vision with **v3 Zeely** expectations:

- Pure white/grey/black — reject warm beige/orange primary in extraction
- Inter-style typography; monospaced numbers
- Image-first cards with editorial photography
- Black primary buttons
- 3-panel or mobile tab+sheet layout

Confidence: High / Medium / Low per item. Flag ambiguous tokens for human review.
