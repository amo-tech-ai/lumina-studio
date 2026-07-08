# iPix / FashionOS — Claude Design Knowledge Base

Read this first. It tells you what you're designing, who uses it, and the non-negotiable rules.

---

## What is this product?

**iPix / FashionOS** is an AI-native SaaS platform for fashion brand operators. It helps teams manage brand DNA, plan photo shoots, produce creative deliverables, and approve AI-generated content — all from one operator workspace.

The product is in active development. The public domain is `fashionos.co`.

---

## Who uses it?

**Operators** — brand managers, creative directors, production leads at fashion companies.
They work with multiple brands (Nike, Adidas, Zara) and need to review + approve everything the AI proposes before it becomes canonical.

One operator, multiple brands. The active brand drives what appears in the right panel and what the AI talks about.

---

## Architecture — 3-panel shell

Every screen in the operator workspace uses this layout:

```
┌──────────────┬─────────────────────────────┬──────────────────────┐
│ NavSidebar   │ Workspace (center)           │ IntelligencePanel    │
│ auto width   │ flex-1, route content        │ auto, always white   │
│ 3.5rem / 14rem │                            │ AI workspace         │
└──────────────┴─────────────────────────────┴──────────────────────┘
```

- **NavSidebar** — brand switcher, primary nav, collapses to icon rail
- **Workspace** — the route-specific page. Scrollable. All detail views live here.
- **IntelligencePanel** — AI context + approvals + activity + chat. **Always white background, never dark mode.**

The right panel is NOT a chatbox. It is an AI workspace showing: context card → pending approvals → suggestions → evidence → activity → chat input.

---

## The most important pattern — HITL (Human in the Loop)

Every AI-generated value requires operator approval before it becomes real. This is the product's core philosophy.

**ApprovalCard** is the component that enforces this:
- Amber border (`#F3B93C`) + amber background (`#FFFBF0`)
- Shows: what changed (before/after diff), confidence %, evidence source
- Two actions: `[Approve]` (orange primary) and `[Edit]` (outline)
- Never auto-approves. Never skips the confidence and evidence display.

---

## AI agents

Five agents, two durable:

| Agent | ID | What it does |
|---|---|---|
| Production Planner | `production-planner` | Default dashboard agent. Guides operators through their day. |
| Creative Director | `creative-director` | Campaign and shoot planning. |
| Brand Intelligence | `brand-intelligence` | DNA analysis. Crawls brand web presence. |
| Visual Identity | `visual-identity` | Image and asset analysis. |
| Social Discovery | `social-discovery` | Social media research. |

The agent speaking is always context-aware: it knows the active brand, current screen, and pending approvals. It opens with the next best action — never a blank "How can I help?"

---

## Design token source of truth

`app/src/styles/tokens.css` — upload this file in every Claude Design session.

Key values (never hardcode these):

| Token | Value | Use |
|---|---|---|
| `--color-bg-page` | `#FBF8F5` | Page background (warm off-white) |
| `--color-bg-card` | `#FFFFFF` | Card surface |
| `--color-border` | `#E8E0D8` | Default border |
| `--color-accent` | `#E87C4D` | Orange — primary CTA only |
| `--approval-border` | `#F3B93C` | Amber — HITL pending |
| `--approval-bg` | `#FFFBF0` | Amber bg — HITL pending |
| `--color-dna-high` | `#059669` | DNA score ≥ 80 |
| `--color-dna-mid` | `#D97706` | DNA score 60–79 |
| `--color-dna-low` | `#DC2626` | DNA score < 60 |

Font: **Geist Sans** (body), **Geist Mono** (numeric data). Radius: **0.625rem** on all cards.

---

## What NOT to design

- Dark mode — not in scope
- Chat-only right panel — the IntelligencePanel is never a bare chatbox
- Detail panels in the right column — detail lives in the center workspace
- Gradients, drop shadows heavier than `--shadow-card`
- Any AI output without confidence % and evidence source
- Auto-approved AI actions — every write needs an ApprovalCard

---

## File index (upload in this order)

See `00-upload-manifest.md` for the complete tier-by-tier upload sequence.

| File | What it gives Claude Design |
|---|---|
| `00-README.md` (this file) | Product context |
| `00-upload-manifest.md` | What to upload and when |
| `app/src/styles/tokens.css` | All design tokens |
| `app/src/styles/design-system-rules.md` | Shell rules, AI patterns, component hierarchy |
| `prompts/00-universal.md` | Universal design prompt template |
| `prompts/01-dashboard.md` | Command Center screen prompt |

---

## Screens

| Screen | Route | Agent |
|---|---|---|
| Command Center | `/app` | `production-planner` |
| Brand List | `/app/brand` | `brand-intelligence` |
| Brand Detail | `/app/brand/[id]` | `brand-intelligence` |
| Campaigns | `/app/campaigns` | `creative-director` |
| Shoots | `/app/shoots` | `production-planner` |
| Assets | `/app/assets` | `visual-identity` |
| Onboarding | `/app/onboarding` | `brand-intelligence` |
