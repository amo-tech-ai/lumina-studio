# iPix / FashionOS — Claude Design Knowledge Base

Read this first. It tells you what you're designing, who uses it, and the non-negotiable rules.

> **Visual direction: v3 "Zeely Editorial."** Pure white / light-grey / charcoal / black, **Inter** type, **black** primary actions, and large **editorial fashion photography** doing the visual work. This supersedes the v2 "Atelier" warm-beige + orange direction. See `redesign-spec.md` for the full migration.

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
│ 3.5rem/14rem │ + AI chat dock at the base   │ AI workspace         │
└──────────────┴─────────────────────────────┴──────────────────────┘
```

- **NavSidebar** — brand switcher (image avatars), primary nav, collapses to icon rail. Calm thin-grey active state.
- **Workspace** — the route-specific page. Scrollable. All detail views live here. **A persistent AI chat dock sits at the base.**
- **IntelligencePanel** — AI context + approvals + activity. **Always white background, never dark mode.**

The right panel is NOT a chatbox. It is an AI workspace showing: context card → pending approvals → suggestions → evidence → activity.

---

## Global AI chat dock (every operator screen)

Every operator screen carries a persistent, **context-aware AI chat dock** at the **bottom of the center workspace**:

- Knows the active **page, brand, shoot, campaign, or asset**.
- Opens with a context-aware greeting + the next best action — **never** "How can I help?".
- 3–5 **quick-action chips** (e.g. "Plan shoot," "Improve visuals," "Generate shot list").
- **Streaming status** with live steps/thumbnails — never a bare spinner.
- Pure white, hairline top border, Inter, **black** send button. Never overlaps the IntelligencePanel.

---

## The most important pattern — HITL (Human in the Loop)

Every AI-generated value requires operator approval before it becomes real. This is the product's core philosophy.

**ApprovalCard** is the component that enforces this:
- **White** card + **amber hairline** (`#F3B93C`) + amber status dot (no orange/amber fill).
- Shows: what changed (before/after diff — **image strips** when the change is visual), confidence %, evidence source.
- Two actions: `[Approve]` (**black** primary) and `[Edit]` (outline).
- Never auto-approves. Never skips the confidence and evidence display.
- On approve → green hairline + check, then fades.

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

## Imagery — non-negotiable

Content objects (brands, shoots, campaigns, assets, models, venues) **lead with editorial fashion photography**:

- **Subject:** **female models wearing apparel** — high-fashion / editorial, shot like a magazine.
- **Never:** random stock, illustrations, cartoons, office/corporate photos, abstract gradients, or **glamour/nude** imagery.
- **Source:** **prefer the project's uploaded images** in `app/design/images`; fall back to tasteful editorial fashion mock photography only if none exist.
- One frame standard: 20px radius, 1px hairline, `object-fit: cover`, ratio by type.

See `image-strategy.md` for the full per-screen image audit.

---

## Design token source of truth

`app/src/styles/tokens.css` — upload this file in every Claude Design session.

Key v3 values (never hardcode these):

| Token | Value | Use |
|---|---|---|
| `--color-bg-page` | `#FFFFFF` | Page background (pure white — **no beige**) |
| `--color-bg-subtle` | `#FAFAFA` | Subtle section bg |
| `--color-bg-card` | `#FFFFFF` | Card surface |
| `--color-border` | `#E5E7EB` | Default hairline border |
| `--color-text-primary` | `#111111` | Text + primary action (charcoal/black) |
| `--color-action` | `#111111` | **Primary button fill (black)** |
| `--approval-border` | `#F3B93C` | Amber hairline — HITL pending |
| `--color-dna-high` | `#059669` | DNA score ≥ 80 |
| `--color-dna-mid` | `#D97706` | DNA score 60–79 |
| `--color-dna-low` | `#DC2626` | DNA score < 60 |
| `--card-radius` / `--image-radius` | `1.25rem` (20px) | Cards + images |

Font: **Inter** (UI/body), **Geist Mono** (numeric data only). **Orange is retired** — never a button or chrome unless a project explicitly approves it for a named AI action.

---

## What NOT to design

- Dark mode — not in scope
- **Beige / warm backgrounds** — surfaces are pure white / light grey
- **Orange chrome** — black is the primary action; orange is retired
- Chat-only right panel — the IntelligencePanel is never a bare chatbox (the chat dock lives in the center workspace base)
- Detail panels in the right column — detail lives in the center workspace
- Gradients, drop shadows heavier than `--shadow-card`
- Icon-only empty states — use a faded editorial fashion preview + one CTA
- Random stock / illustration / office / glamour imagery
- Any AI output without confidence % and evidence source
- Auto-approved AI actions — every write needs an ApprovalCard

---

## File index (upload in this order)

See `00-upload-manifest.md` for the complete tier-by-tier upload sequence.

| File | What it gives Claude Design |
|---|---|
| `00-README.md` (this file) | Product context + v3 direction |
| `00-upload-manifest.md` | What to upload and when |
| `app/src/styles/tokens.css` | All design tokens (v3) |
| `app/src/styles/design-system-rules.md` | Shell rules, AI patterns, component hierarchy |
| `redesign-spec.md` | v2 → v3 migration + token deltas |
| `image-strategy.md` | Image-first strategy + per-screen audit |
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
| Matching | `/app/matching` | `social-discovery` |
| Channel Preview | `/app/preview` | `visual-identity` |
| Onboarding | `/onboarding` (pre-app) | `brand-intelligence` |
