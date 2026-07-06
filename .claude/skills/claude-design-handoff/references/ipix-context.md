# iPix/FashionOS Context for Design Handoff

**When to read:** any design handoff task involving the iPix codebase.

This file captures project-specific rules that override generic design handoff patterns.

**Design system version:** v3 **Zeely Editorial** (supersedes v2 Atelier warm-beige + orange).

---

## Critical rules (non-negotiable)

| Rule | Detail |
|------|--------|
| **AI = Mastra + Gemini** | `@mastra/core` agents + `@ai-sdk/google` with Gemini models only. |
| **CopilotKit pinned** | Package `1.61.0`, `/v2` subpath imports only. Never mix v1 + v2. |
| **No service-role in src/** | Server-only API routes and Supabase Edge Functions only. |
| **RLS on every table** | `ENABLE ROW LEVEL SECURITY` + ≥ 1 policy on new tables. |
| **HITL for all AI writes** | ApprovalCard with confidence + evidence + before/after on edits. |
| **Five states required** | populated · loading · empty · error · approval-pending (or wizard step model). |
| **3-panel shell mandatory** | NavSidebar · Workspace · IntelligencePanel on every operator screen. |
| **Light-mode only** | Never propose dark mode. Page bg **pure white** `#FFFFFF`. |
| **Semantic tokens only** | No hardcoded hex — `app/src/styles/tokens.css`. |
| **Inter for UI** | Body, headings, labels — **Inter**. Geist Mono for numbers/data only. |
| **Black primary actions** | `--color-action` `#111111` — orange chrome is **retired**. |
| **Image-first** | Editorial fashion photography leads content cards — not icons/stock filler. |
| **Persistent AI chat dock** | Every operator screen (except Onboarding step 0) — context greeting, never "How can I help?" |

---

## Design system quick reference (v3 Zeely Editorial)

From `app/DESIGN.md` / `tokens.css`:

```
Surfaces:
  --color-bg-page      → #FFFFFF (pure white)
  --color-bg-card      → #FFFFFF
  --color-bg-subtle    → #FAFAFA
  --color-border       → #E5E7EB (1px hairline)

Text & actions:
  --color-text-primary → #111111
  --color-action       → #111111 (black fill, white text — primary CTA)

HITL (status colour only — no large fills):
  --approval-border      → #F3B93C (1px hairline + dot on white card)
  --approval-border-done → #059669
  Pending card           → white bg + amber hairline (NOT #FFFBF0 fill)

Typography:
  Inter                → all UI / body / headings
  Geist Mono           → numbers, dates, KPIs, IDs (tabular-nums)

Radii:
  --card-radius        → 1.25rem (20px)
  --image-radius       → 1.25rem

Layout breakpoints:
  ≥1024px              → Full 3-panel shell
  <1024px              → BottomNavigation + IntelligencePanel as BottomSheet + chat dock above tabs

Motion:
  prefers-reduced-motion on all animations
  --duration-fast 150ms · --duration-normal 250ms
```

**Retired (do not use in new work):** warm off-white `#FBF8F5`, iPix orange `#E87C4D` as primary, beige borders `#E8E0D8`, Geist Sans as body font.

---

## Claude Design export + component library

When handoff source is the Claude Design HTML export:

| Resource | Path |
|----------|------|
| Screen prototypes | `Universal design prompt/*.v2*.dc.html` |
| 19 shared DCs | `Universal design prompt/components/` |
| Component spec | `Universal design prompt/components/COMPONENTS.md` |
| Gallery | `Universal design prompt/Component Library.dc.html` |
| Audit / completion | `Universal design prompt/checklist.md` |
| Handoff plans | `Universal design prompt/plan/` |

**Read:** [`zeely-v3-dc-library.md`](zeely-v3-dc-library.md) for dc-import workflow and library index.

**New screens:** start from `components/OperatorShell.dc.html` + `dc-import` — not inline shell copy from legacy files.

---

## Agent durability (UI patterns)

From `app/src/mastra/durable.ts` — only these agents have resumable streams:

| Agent ID | Screens | On disconnect |
|----------|---------|---------------|
| `production-planner` | Command Center, Shoots, Shoot Detail, Wizard | Stream reconnect UI OK |
| `creative-director` | Campaigns | Stream reconnect UI OK |
| `brand-intelligence` | Brand List, Brand Detail, Onboarding | **Error + retry** — never resumable-stream UI |
| `visual-identity` | Assets, Channel Preview | Registered in Mastra; check `route-agent-map.ts` |
| `social-discovery` | Matching | Registered in Mastra; check `route-agent-map.ts` |

---

## Operator routes (11 surfaces)

| Route | Screen | Agent (target) |
|-------|--------|----------------|
| `/app` | Command Center | production-planner |
| `/app/brand` | Brand List | brand-intelligence |
| `/app/brand/[id]` | Brand Detail | brand-intelligence |
| `/app/shoots` | Shoots List | production-planner |
| `/app/shoots/[id]` | Shoot Detail | production-planner |
| `/app/shoots/new` | Shoot Wizard | production-planner |
| `/app/campaigns` | Campaigns | creative-director |
| `/app/assets` | Assets | visual-identity |
| `/app/matching` | Matching | social-discovery |
| `/app/preview` | Channel Preview | visual-identity |
| `/onboarding` | Onboarding | brand-intelligence (standalone — no 3-panel shell) |

---

## Route / tracker status (check before building)

```bash
# Prototype progress (Claude Design export)
cat "Universal design prompt/todo.md"
cat "Universal design prompt/checklist.md"   # §0 completion tracker

# Production design tracker
cat app/design/todo.md | grep -E "(\[x\]|\[ \]|🔵|⬜|✅)"
```

| Status | Meaning | Action |
|--------|---------|--------|
| 🔵 Now | In progress | Build to spec |
| ⬜ Next | Planned | Defer unless scoped |
| ✅ Recently done / prototype 🟢 | Shipped in prototype or prod | **Extend only — never rebuild** |

**Prototype complete ≠ production shipped.** IntelligencePanel is full in DCs; production right slot may still be bare `CopilotSidebar`.

---

## Design system files

| File | Location | Use for |
|------|----------|---------|
| Design SSOT | `app/DESIGN.md` | All design rules |
| Tokens | `app/src/styles/tokens.css` | Semantic CSS variables |
| Shell rules | `app/src/styles/design-system-rules.md` | 3-panel + AI patterns |
| Component tree | `docs/design/claude-design/21-component-dependencies.md` | Dependency tree |
| DC library spec | `Universal design prompt/components/COMPONENTS.md` | Prototype component props |
| Handoff plans | `Universal design prompt/plan/` | Audit, maps, tasks |

---

## Production implementations (reuse first)

| Element | Status | Path |
|---------|--------|------|
| Shell layout | 🟡 partial | `app/src/components/operator-panel/operator-panel.tsx` |
| NavSidebar | 🟡 partial | `app/src/components/nav-sidebar/nav-sidebar.tsx` |
| IntelligencePanel (full) | ⬜ target | Replace CopilotSidebar slot (IPI-242+) |
| ApprovalCard | 🟡 partial | `app/src/components/brand-hub/approval-card.tsx` |
| shadcn/ui primitives | ✅ | `app/src/components/ui/*` |
| Entity cards from DC library | ⬜ | Port from `Universal design prompt/components/` |

**ThreadsDrawer:** exists in production (`operator-panel.tsx`) — not in Claude Design prototypes; decide merge vs separate.

---

## Cross-cutting states (every screen)

Beyond the 5 data states:

- **Error recovery** — Retry · Report · Go back; never a dead end.
- **Permissions** — read-only / operator / admin; gate writes with why-disabled hint.
- **Realtime** — connected / reconnecting / stale-data banner; never present dropped-stream output as live (respect agent durability table).

---

## Approval gates (prototype only)

Before new overlays/routes, confirm with user (`checklist.md` K/L):

- **K** Asset lightbox — default: extend right panel, not new modal.
- **L** Campaign Detail route — default: keep right-panel detail.

---

## Linear conventions

Branch: `ipi/<issue-number>-<short-name>`  
Acceptance criteria: ≥ 2 concrete testable items  
One concern per PR — never mix docs + production code.

---

## Proof requirements for Done

1. `cd app && npm run typecheck` exits 0
2. `npm test` exits 0
3. `npm run lint` exits 0 (PR gate)
4. No console errors on implemented surface
5. All five states implemented and testable
6. Mobile ≤1024px per `MOBILE-PLAN.md` (if operator screen)
7. `data-testid` on interactive elements (Playwright)

---

## Production port backlog (from DC library)

Port to React when building production (Phase C):

- [ ] OperatorShell + NavSidebar parity with DC
- [ ] IntelligencePanel (context → approvals → tabs)
- [ ] PersistentChatDock + CopilotKit wire
- [ ] BrandCard · ShootCard · CampaignCard · AssetCard
- [ ] EvidenceBlock · DNAScoreBar · BottomSheet primitive
- [ ] StatusChip full variant set
- [ ] EmptyState extracted component

Prototype DCs exist for most — use `COMPONENTS.md` as the spec, not re-invent from screenshots.
