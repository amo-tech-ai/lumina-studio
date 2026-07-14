# DESIGN.md — iPix / FashionOS

> Single entry point for every Claude Design session. Read this first; pull the referenced files for depth.

---

## Quick Start

1. Read this file in full.
2. Upload `app/src/styles/tokens.css` — tokens are the source of truth; never hardcode hex.
3. Upload `app/src/styles/design-system-rules.md` — shell rules + AI patterns.
4. Upload `docs/design/claude-design/00-README.md` — product context, agent IDs, HITL pattern.
5. Upload the wireframe for the screen you are designing (if available).
6. Paste `docs/design/claude-design/prompts/00-universal.md`, then the page-specific prompt.
7. Validate every output against the **Screen Generation Checklist** at the bottom of this file.

Full upload sequence: `docs/design/claude-design/00-upload-manifest.md`.

---

## 1. Project Overview

**iPix / FashionOS** (`fashionos.co`) is an AI-native SaaS platform for fashion brand operators. It manages brand DNA, photo shoot planning, creative deliverables, and AI-assisted content approval from a single operator workspace.

Stack: Next.js (`app/`), Mastra AI runtime, Supabase. All AI calls are server-side only.

---

## 2. Product Vision

Guide operators — never wait for them. The product eliminates: waiting (blank spinners), guessing (unclear next steps), repetitive work (re-entering the same context), and unreviewed AI writes (every AI output is a draft behind a gate).

The AI is a proactive teammate, not a chatbox.

---

## 3. Design Principles

| # | Principle |
|---|---|
| 1 | Remove waiting — stream progress |
| 2 | Remove guessing — show the spec, the target, the next step |
| 3 | Remove repetitive work — smart defaults |
| 4 | Prevent mistakes — live validation before save |
| 5 | Always show the next step — no dead ends |
| 6 | Keep users in context — preview/act inline |
| 7 | AI drafts, humans decide — every AI write is a reversible draft |
| 8 | One click for common tasks |
| 9 | Every AI recommendation is explainable — confidence + evidence |
| 10 | Everything is undoable |

---

## 4. AI-Native UX Principles

- **Context-first right panel.** IntelligencePanel opens with what's relevant (active brand, pending approvals, next action) — not a blank chat prompt.
- **Stream over wait.** AI streaming shows live text cursor (`--streaming-cursor`) + thinking dots (`--thinking-dot`). Never a spinner for content.
- **Progress is text.** `Crawling nike.com… 31 of 47 pages` not `Loading…`.
- **Approve or discard — nothing in between is silent.** The only gate is `ApprovalCard`. No inline approve buttons anywhere else.
- **Evidence always.** Confidence %, source, before/after on every AI write. No exceptions.

---

## 5. Visual Language

| Property | Value |
|---|---|
| Page background | `#FBF8F5` warm off-white — not gray, not pure white |
| Card surface | `#FFFFFF`, 1px `#E8E0D8` border, `0.625rem` radius |
| Primary accent | `#E87C4D` orange — primary CTAs only, use sparingly |
| HITL pending | `#F3B93C` border + `#FFFBF0` bg |
| HITL approved | `#059669` border + `#D1FAE5` bg |
| Font — body | Geist Sans |
| Font — data/numbers | Geist Mono |
| Icons | Lucide (20px default, 16px inline) |
| Style | Calm, premium, editorial. No gradients. No heavy shadows. Whitespace over decoration. |

All values exist as tokens in `tokens.css`. Always use the token name, never the raw hex.

---

## 6. Design System Overview

Four-layer token hierarchy (full spec: `tokens.css`):

```
Primitive  → raw values (--primitive-orange-500: #e87c4d)
Semantic   → purpose aliases (--color-accent: var(--primitive-orange-500))
Component  → component-specific (--approval-border: var(--color-warning))
Brand      → per-brand overrides (planned, not active yet)
```

**Rule:** components reference semantic tokens only. Semantic tokens reference primitives. Never skip a layer.

12 shadcn/ui primitives installed: `Button Card Badge Input Select Tabs Skeleton Dialog Sheet Sonner Progress Separator`. These are the only allowed primitive elements — never build from scratch what shadcn provides.

---

## 7. Layout Architecture

Every screen in the operator workspace:

```
grid-template-columns: auto  minmax(0, 1fr)  auto
                        ↑          ↑              ↑
                    NavSidebar  Workspace   IntelligencePanel
```

| Panel | Token | Notes |
|---|---|---|
| NavSidebar | `--nav-width-collapsed: 3.5rem` / `--nav-width-expanded: 14rem` | Collapses to icon rail |
| Workspace | `flex-1`, `--page-padding: 24px`, `--content-max-width: 1280px` | Route content lives here |
| IntelligencePanel | `--intel-bg` = always white | AI context, approvals, chat |

Full layout token reference: `tokens.css` Layout section.

---

## 8. Component Reuse Rules

Full tree: `docs/design/claude-design/21-component-dependencies.md`.

1. Every card-shaped surface extends `ui/card.tsx`. No exceptions.
2. Every button uses `Button` variants: `default | outline | ghost | destructive`.
3. Every status indicator uses `Badge` with StatusChip tokens (`--status-*`).
4. Every loading state uses `Skeleton`. Never a spinner for content.
5. Every tab group uses `Tabs` from `ui/tabs.tsx`.
6. Every modal uses `Dialog`; every side drawer uses `Sheet`.
7. New composite components are fine. New primitives require explicit justification.

---

## 9. AI Component Standards

| Component | When to use |
|---|---|
| `ApprovalCard` | Any AI write action — the only allowed HITL gate |
| `AIContextCard` | Opening card in IntelligencePanel showing active brand + next action |
| `EvidenceBlock` | Collapsible citation list for AI recommendations |
| `SuggestionChips` | Quick-action chips (3 max) below agent greeting |

IntelligencePanel content order (never reorder):
`context → approvals → suggestions → evidence → activity → chat`

---

## 10. HITL Rules

- **Every AI write requires an `ApprovalCard`.** No inline approve/reject elsewhere.
- **Required elements:** warning triangle icon, title, before/after diff (two columns), confidence %, evidence source, `[Approve]` + `[Edit]` + `[Discard]` buttons.
- **Token spec:** `--approval-border` border, `--approval-bg` background, `0.625rem` radius.
- **On approve:** transition to `--approval-border-done` + `--approval-bg-done` (green), then fade out after 1s.
- **Confidence colors:** `--ai-confidence-high` (≥80%), `--ai-confidence-mid` (60–79%), `--ai-confidence-low` (<60%).

---

## 11. Accessibility

- Minimum touch target: `--touch-target-min: 2.75rem` (44px). Required on all interactive elements.
- Focus ring: `--shadow-focus: 0 0 0 2px var(--color-border-focus)` (orange). Never remove outline without replacing.
- Color is never the only signal — pair color with text or icon (e.g. status chips always have a label).
- Reduced motion: `tokens.css` includes `@media (prefers-reduced-motion)` that zeroes all durations. Never bypass it.
- Semantic HTML required: `<button>` for actions, `<nav>` for NavSidebar, `aria-label` on icon-only buttons.

---

## 12. Responsive

Desktop-first. One breakpoint: `max-width: 1024px` (tablet/mobile).

| Element | Desktop | ≤1024px |
|---|---|---|
| IntelligencePanel | visible, right side | hidden; `[Details]` button opens `Sheet` from bottom |
| NavSidebar | collapsed rail (3.5rem) | hidden; hamburger opens `Sheet` |
| Workspace | full 3-panel grid | single-column, full width |

Mobile min-width: 375px. All touch targets ≥ 44px.

---

## 13. Motion

| Token | Value | Use |
|---|---|---|
| `--duration-instant` | 50ms | Hover state switches |
| `--duration-fast` | 150ms | Card selection, chip press |
| `--duration-normal` | 250ms | Panel open, skeleton fade, bar animations |
| `--duration-slow` | 400ms | Sheet slides, modal open |
| `--ease-default` | `cubic-bezier(0.16, 1, 0.3, 1)` | Standard easing |
| `--ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Approve confirmation pop |

All durations collapse to `0ms` under `prefers-reduced-motion`.

---

## 14. Page Standards

Every screen must include all 5 states:

| State | Description |
|---|---|
| Populated | Full data, agent greeting, quick-action chips |
| Loading | Skeleton layout matching populated structure exactly |
| Empty | Lucide icon + heading + one CTA + agent suggestion |
| Error | Lucide `WifiOff` + message + retry. Agent still operable. |
| Approval-pending | `ApprovalCard` in center workspace or IntelligencePanel stack |

Agent greeting always: names the active brand, states the next action — never "How can I help?"

Page-specific prompts: `docs/design/claude-design/prompts/`

---

## 15. Naming Conventions

| Pattern | Example |
|---|---|
| Token names | `--color-bg-page`, `--approval-border-done` |
| Component files | `approval-card.tsx`, `dna-score-bar.tsx` (kebab-case) |
| Route paths | `/app/brand/[id]`, `/app/shoots` |
| Agent IDs | `brand-intelligence`, `production-planner` |
| Status values | `planning | active | complete | archived` |
| DNA pillars | `Brand | Visual | Voice | Commerce` |

---

## 16. What Claude Should Always Do

- Use token variables for every color, spacing, and shadow value.
- Use semantic tokens over primitive tokens in all component output.
- Generate all 5 states for every screen.
- Include before/after diff, confidence %, and evidence on every ApprovalCard.
- Show progress as text during AI streaming — never a spinner.
- Make the agent greeting context-aware (active brand, pending count, next action).
- Produce a full-page HTML prototype as the final output.
- Add mobile layout at `max-width: 1024px` — IntelligencePanel as a bottom Sheet.
- Name the next action on every empty state.
- Use `Geist Mono` for all numeric data.

---

## 17. What Claude Must Never Do

- Hardcode hex values or raw pixel numbers.
- Use primitive tokens directly in component styles.
- Design a dark mode (not in scope).
- Make the IntelligencePanel a bare chatbox or give it a dark background.
- Put detail content in the right panel (detail lives in center workspace).
- Skip the HITL ApprovalCard for any AI write action.
- Auto-approve or silently apply AI suggestions.
- Use a spinner for content loading (use Skeleton).
- Create cards without extending `ui/card.tsx`.
- Add new shadcn-equivalent primitives when the installed 12 cover the case.
- Omit confidence % or evidence source from any AI-generated value.

---

## 18. Design Workflow

1. **Orient** — read this file + relevant page prompt.
2. **Upload** — follow `00-upload-manifest.md` tier order. Tokens first.
3. **Prompt** — paste `prompts/00-universal.md` + page-specific prompt.
4. **Review output** — validate against the checklist below before using.
5. **Iterate** — refine states individually; reference token names explicitly in follow-up prompts.
6. **Screenshot** — capture approved states to `docs/design/claude-design/screenshots/<screen>/`.
7. **Hand off** — attach prototype link + screenshot set to the Linear ticket.

---

## 19. Related Documentation

| File | Purpose |
|---|---|
| `app/src/styles/tokens.css` | Complete design token source of truth |
| `app/src/styles/design-system-rules.md` | Shell architecture, AI pattern rules |
| `docs/design/claude-design/00-README.md` | Product context, agents, HITL pattern |
| `docs/design/claude-design/00-upload-manifest.md` | Tier-by-tier upload sequence |
| `docs/design/claude-design/21-component-dependencies.md` | Full component tree |
| `docs/design/claude-design/prompts/00-universal.md` | Universal session prompt |
| `docs/design/claude-design/prompts/01-dashboard.md` | Command Center spec |
| `docs/design/claude-design/prompts/02-brand-detail.md` | Brand Detail spec |
| `docs/design/claude-design/prompts/03-shoots.md` | Shoots List spec |

---

## 20. Screen Generation Checklist

Run this on every prototype before marking it done.

**Layout**
- [ ] 3-panel shell: NavSidebar | Workspace | IntelligencePanel
- [ ] IntelligencePanel is always white, even in dark OS mode
- [ ] Correct nav item highlighted (active state with orange text)
- [ ] Page background is `--color-bg-page` (#FBF8F5), not gray or pure white

**Tokens**
- [ ] Zero hardcoded hex values in the output
- [ ] Component tokens use semantic layer (not primitive directly)
- [ ] All buttons use `Button` variant classes, not custom styled divs

**States**
- [ ] Populated state — full data, agent greeting, quick-action chips
- [ ] Loading state — Skeleton matching populated layout exactly
- [ ] Empty state — icon + heading + CTA + agent suggestion
- [ ] Error state — icon + message + retry; agent still operable
- [ ] Approval-pending state — ApprovalCard with all required elements

**AI / HITL**
- [ ] Every AI value shows confidence % and evidence source
- [ ] ApprovalCard has: warning icon, before/after diff, confidence, evidence, Approve + Edit + Discard
- [ ] Approve transition: amber → green border/bg → fade out
- [ ] No AI output is auto-approved or silently applied

**Accessibility**
- [ ] All interactive elements ≥ 44px touch target
- [ ] Focus ring present on all focusable elements
- [ ] Color not the only status signal (paired with text/icon)
- [ ] `prefers-reduced-motion` respected (durations collapse)

**Responsive**
- [ ] Mobile layout at ≤1024px: IntelligencePanel hidden, Sheet trigger present
- [ ] NavSidebar hidden on mobile with hamburger/Sheet
- [ ] Touch targets ≥ 44px at 375px viewport
