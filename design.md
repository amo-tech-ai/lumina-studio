---
title: iPix Design Contract
version: "1.0"
lastUpdated: "2026-06-29"
status: Canonical — Claude Design entry (not a parallel architecture)
owner: Product + Design
related:
  - prd.md
  - mvp.md
  - tasks/plan/todo.md
  - tasks/design-docs/handoff/handoff.md
  - CLAUDE.md
---

# design.md — How every screen should look

> **Not a replacement.** This doc plugs into the existing stack — PRD (what) · MVP (proofs) · Linear/tasks (how to build) · CopilotKit + Mastra (how AI runs). Claude Design reads **this file first**, then depth docs below.

```text
PRD (what)  →  design.md (how it looks)  →  tasks (how to build)  →  code  →  verification
                    ↓
              Claude HTML/DC prototype (Universal design prompt/)
                    ↓
              Next.js React (app/) — no Figma step
```

**Do not invent a separate “Claude Design architecture.”** Reuse 3-panel shell, HITL, agents, and dashboard standards already in PRDs and handoff.

---

## 1. Document hierarchy

| Layer | Canonical doc | Answers |
|-------|---------------|---------|
| Product | [`prd.md`](./prd.md) · [`mvp.md`](./mvp.md) | **What** to build |
| **Design (this file)** | **`design.md`** | **How it looks** — layout, states, motion, a11y |
| Design depth | [`tasks/design-docs/design/`](./tasks/design-docs/design/README.md) · [`tasks/design-docs/handoff/`](./tasks/design-docs/handoff/handoff.md) | Tokens, components, screens, journeys |
| Execution | [`tasks/plan/todo.md`](./tasks/plan/todo.md) · [`tasks/design-docs/plan/TASKS.md`](./tasks/design-docs/plan/TASKS.md) | **How to build** (DESIGN-* · IPI-*) |
| Prototypes | [`Universal design prompt/`](./Universal%20design%20prompt/DESIGN.md) | DC HTML only — not production status |
| Production tokens | [`app/src/styles/tokens.css`](./app/src/styles/tokens.css) · [`design-system-rules.md`](./app/src/styles/design-system-rules.md) | Shipped CSS contract |
| Verification | [`Universal design prompt/checklist.md`](./Universal%20design%20prompt/checklist.md) · Playwright · `@pr-workflow` | Proof before merge |

**Conflict rules:** Product scope → **`prd.md` / `mvp.md`**. Screen inventory → **`tasks/design-docs/handoff/02-screen-map.md`**. Build order → **`tasks/plan/todo.md`**. Visual tokens in code → **`app/src/styles/tokens.css`**.

---

## 2. Non-negotiable layout — 3-panel shell

Every operator screen (`/app/*`) uses:

```text
Left (240–280px)     Center (flex)              Right (320–380px)
Navigation           Human work                 AI intelligence
NavSidebar           forms · grids · wizards    IntelligencePanel + ChatDock
```

| Panel | Role | Never |
|-------|------|-------|
| **Left** | Route nav, brand switcher, counts | Hide primary nav without mobile substitute |
| **Center** | Primary human task — one responsibility per screen | Full-screen AI chat replacing work |
| **Right** | Context, scores, approvals, agent activity | Floating popup AI unless mobile sheet |

**Mobile (`≤1024px`):** bottom tab bar + More sheet; IntelligencePanel → bottom sheet; ChatDock pinned above tab bar. See [`Universal design prompt/MOBILE-PLAN.md`](./Universal%20design%20prompt/MOBILE-PLAN.md).

Detail: [`tasks/intelligence/06-ai-native-master-plan.md`](./tasks/intelligence/06-ai-native-master-plan.md) · [`tasks/design-docs/handoff/03-component-map.md`](./tasks/design-docs/handoff/03-component-map.md).

---

## 3. Design principles

Align with [`CLAUDE.md`](./CLAUDE.md) UX principles and PRD HITL contract.

| # | Principle |
|---|-----------|
| 1 | **Human first, AI second** — AI drafts; humans approve before any write |
| 2 | **Never replace forms** — AI pre-fills; operator edits inline |
| 3 | **Never hide information** — confidence, evidence, status always visible |
| 4 | **Always show the next step** — no dead ends; proactive greeting, not “How can I help?” |
| 5 | **Always show approval** — HITL card before Supabase writes |
| 6 | **Always explain confidence** — % + source on every AI claim |
| 7 | **Always show history / undo path** — destructive actions reversible |
| 8 | **One primary action per surface** — black primary; outline secondary |
| 9 | **Calm editorial UI** — white/grey/charcoal; imagery carries visual interest |
| 10 | **Tokens only** — no hardcoded hex in components |

Visual depth: [`Universal design prompt/DESIGN.md`](./Universal%20design%20prompt/DESIGN.md) §3–5 · [`tasks/design-docs/design/DESIGN-TOKENS.md`](./tasks/design-docs/design/DESIGN-TOKENS.md).

---

## 4. Mandatory design contract (per screen)

Every new or redesigned screen **must** document these sections (in handoff, Linear spec, or PRD §0.1):

| Section | Required content |
|---------|------------------|
| **Purpose** | One sentence — why this screen exists |
| **Users** | Primary persona (operator, producer, …) |
| **Primary goal** | Single outcome per visit |
| **Route + agent** | `/app/...` · Mastra `agentId` · [`route-agent-map.ts`](./app/src/lib/route-agent-map.ts) |
| **Three-panel layout** | What lives left / center / right |
| **States** | All rows in §5 below |
| **Interactions** | Primary + secondary actions; selection → right panel |
| **AI** | Agent greeting, chips, tools, HITL gates |
| **Data** | Supabase entities read/written (writes via edge + approval only) |
| **Desktop / tablet / mobile** | Breakpoint behavior |
| **Accessibility** | Focus order, labels, live regions, touch targets |
| **Motion** | Durations per §7 |
| **Components** | Reuse from [`COMPONENT-LIBRARY.md`](./tasks/design-docs/design/COMPONENT-LIBRARY.md) |
| **Acceptance criteria** | Testable checkboxes · link Playwright when shipped |

Template instance: copy [`tasks/design-docs/design/SCREEN-TEMPLATE.md`](./tasks/design-docs/design/SCREEN-TEMPLATE.md).

---

## 5. Required states (every screen)

| State | User sees | AI behavior |
|-------|-----------|-------------|
| **Populated** | Full data | Context-aware greeting + chips |
| **Loading** | Skeleton matching final layout | Stream progress where possible |
| **Empty** | Explanation + primary CTA + AI suggestion | Offer one-click draft |
| **Error** | Message + retry; nav still works | Agent remains usable |
| **No data / first visit** | Onboarding-style guidance | Prefill from brand context |
| **Returning user** | Resume / recent selections | Skip re-entry |
| **Permission denied** | Explain role gap | No silent failure |
| **AI running** | Streaming / thinking indicator | `AgentStatusIndicator` |
| **AI failed** | Error + retry + fallback manual path | Never block entire screen |
| **Approval pending** | `ApprovalCard` — approve · edit · discard | No auto-write |
| **AI success** | Confirm + next step | Fade approval; show undo window |

Map: [`tasks/design-docs/handoff/08-state-map.md`](./tasks/design-docs/handoff/08-state-map.md).

---

## 6. Screen template (structure)

Use this outline in specs and Claude Design prompts:

```text
1. Purpose · Users · Business goal
2. Route · Agent · HITL write gates
3. Layout (3-panel) — desktop · tablet · mobile
4. Components (from library — no one-offs)
5. States (§5 checklist)
6. Interactions + deep links
7. AI context (useAgentContext fields)
8. Accessibility + performance notes
9. Acceptance criteria
```

Screen inventory: [`tasks/design-docs/handoff/02-screen-map.md`](./tasks/design-docs/handoff/02-screen-map.md).

---

## 7. UX rules

| Rule | Rationale |
|------|-----------|
| Never surprise users | Preview AI changes before apply |
| Always explain AI | Evidence block on every recommendation |
| Undo whenever possible | Especially after approve |
| Progressive disclosure | Advanced fields collapsed until needed |
| One screen · one responsibility | Split wizards by step, not by hiding nav |
| No floating/full-screen AI | Unless explicit mobile sheet pattern |

---

## 8. Motion standards

Not animation everywhere — consistent timing:

| Interaction | Duration | Token / pattern |
|-------------|----------|-----------------|
| Hover / focus | 150ms | `--duration-fast` |
| Drawer / sheet | 250ms | ease-out |
| Dialog | 300ms | focus trap |
| Page transition | 400ms | skeleton first |
| AI streaming | continuous | optimistic UI + skeleton |
| Reduced motion | 0ms | `prefers-reduced-motion` |

Full spec: [`tasks/design-docs/design/ANIMATIONS.md`](./tasks/design-docs/design/ANIMATIONS.md).

---

## 9. Component library

Reuse — never duplicate. Canonical inventory:

| Category | Components |
|----------|------------|
| Shell | OperatorShell, NavSidebar, IntelligencePanel, PersistentChatDock, PageHeader, WizardStep |
| Mobile | BottomNavigation, BottomSheet |
| Cards | BrandCard, ShootCard, CampaignCard, AssetCard, ApprovalCard |
| Atoms | StatusChip, AgentStatusIndicator, EmptyState, SkeletonLoader, FilterBar, SearchBar |
| Buttons | Primary (black) · Outline · Ghost — via shared `Button` |

Full map: [`tasks/design-docs/design/COMPONENT-LIBRARY.md`](./tasks/design-docs/design/COMPONENT-LIBRARY.md) · [`tasks/design-docs/handoff/03-component-map.md`](./tasks/design-docs/handoff/03-component-map.md).

---

## 10. Design review checklist

Run before marking a screen done (prototype or production):

**Layout & shell**
- [ ] 3-panel shell (or documented mobile exception)
- [ ] IntelligencePanel white; ChatDock context-aware
- [ ] One primary action; tokens only (no hardcoded hex)

**States**
- [ ] Populated · Loading · Empty · Error · Approval-pending (minimum)
- [ ] Permission · AI running · AI failed covered where applicable

**AI / HITL**
- [ ] Confidence + evidence on AI values
- [ ] ApprovalCard before any write
- [ ] No silent auto-approve

**Quality**
- [ ] Responsive (desktop · tablet · mobile)
- [ ] Keyboard + screen reader + ≥44px touch targets
- [ ] Visual hierarchy · contrast · reusable components
- [ ] Matches design system · performance acceptable

Extended checklist: [`Universal design prompt/DESIGN.md`](./Universal%20design%20prompt/DESIGN.md) §20 · [`tasks/design-docs/design/DESIGN-REVIEW-CHECKLIST.md`](./tasks/design-docs/design/DESIGN-REVIEW-CHECKLIST.md).

---

## 11. Canonical UI pipeline (no Figma)

iPix does **not** use Figma in the operator design loop. Claude Design prototypes convert directly to production React.

```text
design.md              UI rules + per-screen contract
    ↓
Claude HTML/DC         Universal design prompt/*.dc.html (explore + sign-off)
    ↓
Next.js React          app/src/components + app/(operator)/app/*
    ↓
Reuse                  OperatorShell · cards · ApprovalCard · tokens.css
    ↓
Verify                 Playwright · browser screenshots · DESIGN-REVIEW-CHECKLIST
    ↓
Improve                Iterate until prod matches design.md + handoff
    ↓
PR review              Bugbot + design checklist in PR body
```

**Figma elsewhere in repo:** legacy *marketing* page prompts (`docs/website/`) and competitor research only — **not** operator `/app/*` workflow.

### Claude Design session steps

```text
1. Read design.md (this file)
2. Read screen row in handoff/02 + checklist/11
3. Generate or update DC HTML prototype (if screen not yet signed off)
4. Pull tokens.css + design-system-rules.md for React port
5. Paste Universal prompt (00-universal.md) + page prompt
6. Port to app/ — reuse COMPONENT-LIBRARY; no new one-offs without DESIGN-*
7. Playwright + screenshots vs prototype; fix until checklist passes
8. PR under DESIGN-* / IPI-* in tasks/plan/todo.md
```

**Skills:** [`frontend-design`](./.claude/skills/frontend-design/SKILL.md) · [`ipix-wireframe`](./.claude/skills/ipix-wireframe/SKILL.md) · [`accessibility`](./.claude/skills/accessibility/SKILL.md) · [`design-md`](./.claude/skills/design-md/SKILL.md).

---

## 12. What stays unchanged

| Keep as SSOT | Do not duplicate |
|--------------|------------------|
| [`prd.md`](./prd.md) · layer PRDs in `tasks/prd/` | Product requirements |
| [`tasks/plan/todo.md`](./tasks/plan/todo.md) | Execution priority |
| CopilotKit + Mastra + edge fn architecture | AI runtime |
| HITL / AIOR-018 snapshots | Write safety |
| Dashboard L1–L5 layering | Intelligence depth |

---

*Owner: Product + Design. Update this file when the universal design contract changes; bump `tasks/design-docs/plan/TASKS.md` DESIGN-090.*
