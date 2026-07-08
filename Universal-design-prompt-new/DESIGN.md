# DESIGN.md — iPix / FashionOS

> Single entry point for every Claude Design session. Read this first; pull the referenced files for depth.
>
> **Visual language: v3 "Zeely Editorial" — pure, image-first, magazine-grade.** A pure white / light-grey / charcoal / black palette with **Inter** typography and large editorial fashion photography as the primary visual element. The 3-panel architecture, every AI workflow, and the HITL pattern are unchanged — this is a visual + imagery evolution. Supersedes v2 "Atelier" (warm beige + orange), which is retired.

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

The AI is a proactive teammate, not a chatbox. The interface should feel like a calm executive workspace — effortless, spacious, intelligent — not a busy dashboard.

---

## 3. Product Principles

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

## 4. Visual Design Principles (v3)

These govern every visual decision. When in doubt, choose the calmer, more editorial option.

1. **Calm over colorful.** The default interface is pure white, light grey, charcoal, and black. **No beige, no warm tints, no off-white.** Colour is an event, not a backdrop.
2. **Typography before colour.** Hierarchy comes from size, weight, and spacing — not coloured labels or filled chips.
3. **White space creates hierarchy.** Generous padding and breathing room do the structural work. Density is a last resort.
4. **Borders, not shadows.** A 1px hairline separates surfaces. Shadows are near-invisible and used only to lift transient overlays (popovers, sheets).
5. **Black is the primary action.** Charcoal/black is the primary action colour. There is **no decorative accent colour** — orange is retired except where a project explicitly approves it for a specific AI action. Never large coloured panels.
6. **AI should feel trustworthy, not playful.** Restrained motion, precise copy, evidence on every claim. No bouncing, no confetti, no chat-bubble theatrics.
7. **Enterprise quality, luxury polish.** Tight optical alignment, consistent radii, monospaced numerals. It should read as premium software a fashion house would trust.
8. **Editorial fashion photography carries the visual interest.** Large photography — **female models wearing apparel** (fashion, never glamour), brands, products, shoots, AI outputs — is the hero; the UI stays neutral so the work shines. Images replace icons, decorative graphics, and empty white space wherever they can, without slowing the scan. **Never** random stock, illustrations, cartoons, office photos, or unrelated imagery; prefer the project's uploaded images.

---

## 5. Visual Language

| Property | Value (token) |
|---|---|
| Page background | `#FFFFFF` pure white — `--color-bg-page` |
| Card surface | `#FFFFFF` — `--color-bg-card` |
| Subtle section | `#FAFAFA` light grey — `--color-bg-subtle` |
| Hairline border | `#E5E7EB` 1px — `--color-border` |
| Primary text | `#111111` near-black — `--color-text-primary` |
| Secondary text | `#4B5563` — `--color-text-secondary` |
| Muted text | `#9CA3AF` — `--color-text-muted` |
| Primary action | `#111111` black fill, white text — `--color-action` |
| AI badge / draft | grey badge — `--color-bg-subtle` fill, charcoal text (no colour) |
| HITL pending | white card, `#F3B93C` 1px border + amber dot — `--approval-border` |
| HITL approved | white card, `#059669` 1px border + check — `--approval-border-done` |
| Card radius | `1.25rem` (20px) — `--card-radius` |
| Image radius | `1.25rem` (20px) — `--image-radius` |
| Card shadow | near-invisible — `--shadow-card` (borders do the work) |
| Font — body / UI | **Inter** |
| Font — data/numbers/IDs | Geist Mono (numbers only) |
| Icons | Lucide — 1.5px stroke, 20px default / 16px inline; used sparingly |
| Style | Pure, editorial, spacious. No beige. No gradients. No heavy shadows. No large colour fields. |

All values exist as tokens in `tokens.css`. Always use the token name, never the raw hex.

---

## 5A. Colour System

Reduce colour usage dramatically. The interface is **almost entirely neutral** — white, grey, charcoal, black:

- **Surfaces:** pure white (`--color-bg-card` / `--color-bg-page`), light grey (`--color-bg-subtle` / `--color-bg-muted`). **No beige, no warm near-white.**
- **Text + primary actions:** charcoal/black (`--color-text-primary` / `--color-action`).
- **AI badges:** a quiet **grey** badge (subtle fill + charcoal text), never a coloured pill.

Colour appears **only** to carry status meaning:

| Use | Token | Treatment |
|---|---|---|
| AI draft / suggestion / selected | neutral grey badge or 1px charcoal ring | no colour fill |
| Approval / pending review | `--color-warning` (amber) | 1px border + dot on a white card |
| Success / approved | `--color-approved` (green) | border + check, light `--color-approved-bg` tint sparingly |
| Warning | `--color-warning` (amber) | inline icon + text |
| Error / destructive | `--color-blocked` (red) | border + text; solid only on destructive buttons |

**Never** use large coloured panels, coloured hero cards, coloured section backgrounds, or beige surfaces. **Orange is retired** unless a project explicitly approves it for a named AI action. Status is communicated with a hairline border, a small dot, and a label — not a filled block.

---

## 5B. Cards

The default container. Lightweight by design.

- Background `--color-bg-card` (white).
- 1px `--color-border` (#E5E7EB) hairline. **No nested borders** — one border per card, dividers inside are `--color-border-subtle`.
- Radius `--card-radius` (20px).
- Padding `--space-6` to `--space-8` (24–32px). Generous editorial whitespace.
- Shadow `--shadow-card` only — near-invisible. Reserve any visible elevation for transient overlays.
- Primary action on a card is **black** (`--color-action`); secondary is an outline.
- Hover (interactive cards only): border darkens to `--color-border-strong`; no shadow jump, no scale.

**Image-first card (the default for any visual object).** When a card represents a brand, model, product, shoot, campaign, asset, venue, or AI output, lead with the image, not an icon:
- Image fills the top edge-to-edge at the content type's aspect ratio (see §5H), rounded to the card corners — **editorial fashion photography of female models wearing apparel**, never icons or stock filler.
- Title + 1–2 lines of quiet metadata sit below on white; status is a small grey/amber chip on the image corner.
- Black primary action, thin grey border, images before text.
- The icon-led card is reserved for non-visual, action-only tiles (e.g. "Create new").

A card should feel like it's resting on the page, not floating above it — and when it represents something visual, the photograph is the card.

---

## 5C. Typography

Hierarchy is **primarily typographic**. Reduce dependence on coloured labels.

| Role | Token | Weight |
|---|---|---|
| Page title | `--font-size-2xl` (24px) → `--font-size-display` (32px) on hero screens | 600 |
| Section title | `--font-size-lg` (18px) | 600 |
| Body | `--font-size-base` (16px) / `--font-size-sm` (14px) | 400 |
| Secondary / caption | `--font-size-xs` (12px) | 400–500 |
| Scores, IDs, metrics, counts | Geist Mono, `tnum` | 500 |

- **Inter** is the primary UI typeface for everything except numbers.
- Page titles are charcoal/black and bold; let size — not colour — signal importance.
- Use `--color-text-secondary` / `--color-text-muted` for supporting copy instead of coloured labels.
- All numeric data (DNA scores, confidence %, counts, dates, IDs) is **Geist Mono**.

---

## 5D. Buttons

Map to the four `Button` variants. Primary is **black**, not orange.

| Intent | Variant | Treatment |
|---|---|---|
| Primary action | `default` | solid black `--color-action`, white text, radius 10px (pill for hero CTAs) |
| Secondary | `outline` | white bg, 1px `--color-border`, charcoal text |
| Tertiary / inline | `ghost` | transparent, charcoal text, subtle `--color-bg-subtle` hover |
| AI approval ("Approve") | `default` (black) | black fill, white text — same as primary; an amber-border card carries the AI meaning, not a coloured button |
| Destructive | `destructive` | solid `--color-blocked` (red), white text |

Only **one** primary (black) button per view. **Orange is retired** — do not use it for any button unless a project explicitly approves it for a named AI action.

---

## 5E. Navigation

Modern, minimal Zeely-inspired SaaS rail. Calm at rest, reduced icon dependence.

- Large vertical spacing between items; one row = one destination.
- Icons are thin (1.5px Lucide), 20px, charcoal — used sparingly, never coloured at rest.
- **Active state is a calm thin-grey treatment:** `--nav-item-active` light-grey fill + `--nav-item-active-text` charcoal label + charcoal icon. No orange, no heavy highlight.
- **Image avatars** for brands and accounts (small rounded photo) instead of generic icons where a real image exists.
- Section labels (`MARKETING`, `SOCIAL`) in `--font-size-xs` `--color-text-muted`, generous top margin.
- Collapsed rail (`--nav-width-collapsed`) shows icons/avatars only; expanded (`--nav-width-expanded`) adds labels.
- **Mobile (`≤1024px`):** the rail is replaced by a **fixed bottom tab bar** (5 slots — Home · Shoots · Assets · Brands · More, 56px + safe-area, fill/weight active state). The **More** slot opens a bottom sheet of secondary destinations (Campaigns · Matching · Channel Preview · Onboarding · Settings · Account) with the current page highlighted. See §12.

---

## 5F. Tables & Lists

- Generous row height (≥48px) and cell padding.
- Soft horizontal dividers (`--color-border-subtle`); avoid full grid borders.
- Header row: `--font-size-xs` uppercase `--color-text-muted`, no fill.
- Right-align and monospace all numeric columns.
- Zebra striping is off by default; whitespace separates rows.

---

## 5G. Empty States

Every empty state **educates and guides**, and is **illustrated with a realistic editorial image preview** — not a generic icon. Show what the space will hold.

Structure:
1. **Visual preview** — a realistic, quietly-faded mockup of the populated result using **editorial fashion photography** (e.g. a ghosted brand card with a model cover, a sample shoot cover, a 3-up asset moodboard of models in apparel, an example AI ad frame). Slightly desaturated so it reads as a placeholder. Never a cartoon, illustration, or generic icon.
2. Clear one-line explanation of what lives here.
3. Recommended next action (one sentence).
4. Primary CTA (black `default` button).
5. Optional AI suggestion below the CTA — a single muted line offering the agent's next best step.

Use a plain Lucide icon only when no representative imagery exists (e.g. a connection error). No dead ends — always one obvious action forward.

---

## 5H. Imagery & Visual Content (the image-first system)

**Why the benchmark feels premium:** it isn't the layout — it's that real, high-quality **editorial fashion photography** does the visual heavy lifting while the chrome stays quiet (pure white + Inter). Neutral surfaces + rich imagery = a magazine-grade feel with SaaS scanning speed. FashionOS *is* a visual product — the interface should look like the work it produces.

**Subject & sourcing rules (non-negotiable)**
- Images must show **female models wearing apparel** — fashion/editorial, **not** glamour.
- **Never** use random stock images, illustrations, cartoons, office/corporate photos, abstract gradients, or unrelated imagery.
- **Prefer the project's uploaded images** for every prototype; fall back to tasteful editorial fashion mock photography only when none exist.

**Principles**
- **Image-first, not icon-first.** Where a card represents a visual thing, lead with the image; reserve icons for actions and nav.
- **One consistent frame.** All thumbnails: `--image-radius` (16px large / 10px small), `object-fit: cover`, fixed aspect ratio per content type, never distorted.
- **Let images breathe.** Generous gaps; the image is the focal point, text is quiet metadata beneath it.
- **Imagery communicates state, quality, progress.** A brand hero, a shoot cover, a DNA palette strip, a model portrait, an asset's DNA-match — show it, don't spell it out.
- **Images provide the colour.** Photos carry the palette, so the UI stays neutral. No competing colour fields.

**Aspect ratios (by content type)**

| Content | Ratio | Use |
|---|---|---|
| Brand cover / hero | 16:9 | brand card, brand-detail header |
| Model | 3:4 portrait | model cards, casting grids |
| Product | 1:1 | product cards, asset match |
| Shoot cover | 4:3 | shoot cards, planner |
| Campaign cover | 16:9 | campaign cards |
| Venue / location | 3:2 | venue cards |
| Asset | native (masonry) or 1:1 | asset grid |
| AI output — social | 4:5 | image-ad preview |
| AI output — story / reel | 9:16 | video / story preview |
| AI output — square | 1:1 | square ad preview |

**Image card anatomy**
- Image full-bleed to the card's rounded corners; metadata below on white.
- Bottom scrim (`--image-scrim`) only when text overlays the image.
- Status = a small chip on a corner of the image (DNA match %, `active`, `draft`).
- Hover: subtle image zoom (1.02) inside a fixed frame, or a quiet overlay action bar. Reduced-motion safe.

**Placeholders & loading**
- Skeleton = neutral block at the **exact aspect ratio** (no spinner).
- Missing image = tasteful neutral fill (`--image-placeholder-bg`) + a small centred camera glyph and label — never a broken-image icon.
- Prototypes use an `<image-slot>`-style drop target so operators fill real assets; ship with the **project's uploaded editorial fashion photography**, never lorem-grey or random stock.

**AI previews (before approval)**
- Every AI image/video output is a **large visual preview card** — the generated frame at its native ratio, full and uncropped — with the ApprovalCard's confidence / evidence / actions beneath it. The operator approves what they can *see*.

**Galleries & moodboards**
- Asset grids, casting, and references use a creative-tool layout (masonry / justified grid), not a spreadsheet. Filter chips above; selection is a checked overlay on the image; bulk actions float.
- A **moodboard** arrangement (mixed-ratio justified collage, generous gaps) is the house style for Brand DNA visuals, campaign references, and shoot inspiration.

**Casting Review** (SCR-09 Matching → Talent tab; ref `Pages/SCR-09-Matching-Talent.dc.html` + `SCR-09-Casting-Review.plan.md`)
- Talent review offers three **modes** on one result set: **Casting Review** (default — one focused model card at a time), **Grid** (the moodboard grid above), **List** (dense rows). Switching never refetches.
- The casting card is a **professional review card**, not a dating card: 3:4 photo · fit score · name · agency/independent · location · availability · rate tier · ≤3 tags · one-line AI rationale · "Why this fit?" → EvidenceBlock.
- Actions are **Skip · Shortlist · View Profile** as always-visible ≥44px buttons (keyboard ←/→/↑ and swipe are enhancements — never gesture-only); each fires an `aria-live` toast. **Never** use Like/Match/Superlike/hearts/confetti or any dating-app language.

**Image tokens** (see `redesign-spec.md` / `tokens.css`): `--image-radius`, `--image-radius-sm`, `--image-placeholder-bg`, `--image-scrim`, `--image-border`.

Full per-screen image audit (where images replace icons / text / white space on each of the 10 screens): `docs/design/claude-design/image-strategy.md`.

No dead ends — always one obvious action forward.

---

## 5I. Global AI Chat Dock

**Every operator screen includes a persistent AI chat dock** — the agent is always present, always aware of context.

- **Location:** docked at the **bottom of the center workspace** (never overlaps the IntelligencePanel; stays put while the workspace scrolls).
- **Context-aware greeting:** knows the active **page, brand, shoot, campaign, or asset** and names it plus the next action — e.g. *"You're reviewing Nike – Spring Campaign. I found 3 opportunities."* **Never** opens with "How can I help?".
- **Quick-action chips:** 3–5 context-specific actions (e.g. Generate shot list, Plan shoot, Improve visuals), thin grey, with minimal line icons.
- **Streaming status:** actions stream live progress steps (green check = done, pulsing dot = active, faint dot = pending) — **never a spinner** — then return to the greeting.
- **Input:** full-width "Ask about this {context}…" with mic + **black** send button.
- Matches the pure system: white, thin grey border, Inter, black actions, no orange, no gradients, restrained motion.

The dock is the in-context conversation surface; the IntelligencePanel remains the executive briefing (context → insights → evidence → approvals). They are complementary, never duplicative.

---

## 6. Design System Overview

Four-layer token hierarchy (full spec: `tokens.css`):

```
Primitive  → raw values (--primitive-ink-900: #111111, --primitive-grey-50: #FAFAFA)
Semantic   → purpose aliases (--color-action: var(--primitive-ink-900))
Component  → component-specific (--approval-border: var(--color-warning))
Brand      → per-brand overrides (planned, not active yet)
```

**Rule:** components reference semantic tokens only. Semantic tokens reference primitives. Never skip a layer.

12 shadcn/ui primitives installed: `Button Card Badge Input Select Tabs Skeleton Dialog Sheet Sonner Progress Separator`. These are the only allowed primitive elements — never build from scratch what shadcn provides.

---

## 7. Layout Architecture

Every screen in the operator workspace (unchanged):

```
grid-template-columns: auto  minmax(0, 1fr)  auto
                        ↑          ↑              ↑
                    NavSidebar  Workspace   IntelligencePanel
```

| Panel | Token | Notes |
|---|---|---|
| NavSidebar | `--nav-width-collapsed: 3.5rem` / `--nav-width-expanded: 14rem` | Collapses to icon rail |
| Workspace | `flex-1`, `--page-padding: 32px`, `--content-max-width: 1280px` | Route content lives here, with the AI Chat Dock (§5I) at its base. Generous editorial breathing room. |
| IntelligencePanel | `--intel-bg` = always white | AI context, approvals, chat |

Full layout token reference: `tokens.css` Layout section.

---

## 8. Component Reuse Rules

Full tree: `docs/design/claude-design/21-component-dependencies.md`.

1. Every card-shaped surface extends `ui/card.tsx`. No exceptions.
2. Every button uses `Button` variants: `default | outline | ghost | destructive` (+ accent treatment for the AI Approve action).
3. Every status indicator uses `Badge` with StatusChip tokens (`--status-*`) — border + dot + label, no heavy fill.
4. Every loading state uses `Skeleton`. Never a spinner for content.
5. Every tab group uses `Tabs` from `ui/tabs.tsx`.
6. Every modal uses `Dialog`; every side drawer uses `Sheet`.
7. New composite components are fine. New primitives require explicit justification.
8. **Simplify by default:** one border per surface, no nested borders, no decorative gradients, no shadow stacks.

---

## 9. AI Component Standards

The IntelligencePanel reads like an **executive briefing**, not a chat log.

| Component | When to use |
|---|---|
| `ApprovalCard` | Any AI write action — the only allowed HITL gate |
| `AIContextCard` | Opening card in IntelligencePanel showing active brand + next action |
| `EvidenceBlock` | Collapsible citation list for AI recommendations |
| `SuggestionChips` | Quick-action chips (3 max) below agent greeting |
| `AIChatDock` | Persistent context-aware chat at the bottom of the center workspace (see §5I) — on every operator screen |

IntelligencePanel content order (never reorder):
`context → AI insights → evidence → pending approvals → conversation`

Avoid a chat-like appearance: the conversation transcript sits **below** the briefing, not as the panel's headline.

---

## 10. HITL Rules

- **Every AI write requires an `ApprovalCard`.** No inline approve/reject elsewhere.
- **Premium, low-colour treatment:** white card, 1px `--approval-border` (amber) hairline + a small amber status dot/label — **no orange background fill**.
- **Required elements:** amber status dot + title, concise before/after diff (two columns), confidence %, evidence source, `[Approve]` (black) + `[Edit]` (outline) + `[Discard]` (ghost).
- **Token spec:** `--approval-bg` (white) background, `--approval-border` (amber) 1px border, `--card-radius` (20px).
- **On approve:** border → `--approval-border-done` (green) + check, brief, then fade out after 1s.
- **Confidence colours:** `--ai-confidence-high` (≥80%), `--ai-confidence-mid` (60–79%), `--ai-confidence-low` (<60%) — used on the number only, not as a fill.

---

## 11. Accessibility

- Minimum touch target: `--touch-target-min: 2.75rem` (44px). Required on all interactive elements.
- Focus ring: `--shadow-focus: 0 0 0 2px var(--color-border-focus)`. Never remove outline without replacing.
- Contrast: charcoal text on white easily clears WCAG AA (≥ 4.5:1 body, ≥ 3:1 large/UI). Verify muted text on subtle backgrounds.
- Colour is never the only signal — pair with text or icon (status chips always carry a label; the weakest DNA pillar carries a dot **and** is the lowest number).
- Reduced motion: `tokens.css` includes `@media (prefers-reduced-motion)` that zeroes all durations. Never bypass it.
- Semantic HTML required: `<button>` for actions, `<nav>` for NavSidebar, `aria-label` on icon-only buttons.

---

## 12. Responsive

Desktop-first. One breakpoint: `max-width: 1024px` (tablet/mobile).

| Element | Desktop | ≤1024px |
|---|---|---|
| NavSidebar | collapsed rail (3.5rem) | hidden; replaced by a **fixed bottom tab bar** (Home · Shoots · Assets · Brands · More — 56px + safe-area, fill/weight active state) |
| Secondary nav | in-rail | **More sheet** — the More tab opens a bottom sheet (Campaigns · Matching · Channel Preview · Onboarding · Settings · Account), current page highlighted, rows link through |
| IntelligencePanel | visible, right side | hidden; an **Insights/Details/Checks** trigger (FAB or pill) opens it as a 90vh bottom `Sheet` (drag handle + backdrop dismiss) |
| AI Chat Dock | at base of workspace | **stays pinned above the bottom tab bar** — the workspace column reserves the tab-bar height so the dock never overlaps the tabs; compacted padding + height cap |
| Workspace | full 3-panel grid | single-column, full width, with the persistent chat dock above the tab bar |

Full-width wizards (Shoot Wizard, Onboarding) have no shell, so they keep their own full-width step layout with no tab bar.

Mobile min-width: 375px. All touch targets ≥ 44px. Strategy + per-screen wireframes: `MOBILE-PLAN.md`.

---

## 13. Motion

Very subtle. Fade, scale, slide — nothing flashy.

| Token | Value | Use |
|---|---|---|
| `--duration-instant` | 50ms | Hover state switches |
| `--duration-fast` | 150ms | Card selection, chip press |
| `--duration-normal` | 250ms | Panel open, skeleton fade |
| `--duration-slow` | 400ms | Sheet slides, modal open |
| `--ease-default` | `cubic-bezier(0.16, 1, 0.3, 1)` | Standard easing |
| `--ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Approve confirmation — used sparingly |

All durations collapse to `0ms` under `prefers-reduced-motion`. Prefer opacity fades over transforms; avoid entrance animations on persistent content.

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

Every operator screen also carries the **Global AI Chat Dock** (§5I) at the bottom of the center workspace, with a context-aware greeting and quick actions.

Page-specific prompts: `docs/design/claude-design/prompts/`

---

## 15. Naming Conventions

| Pattern | Example |
|---|---|
| Token names | `--color-bg-page`, `--color-action`, `--approval-border-done` |
| Component files | `approval-card.tsx`, `dna-score-bar.tsx` (kebab-case) |
| Route paths | `/app/brand/[id]`, `/app/shoots` |
| Agent IDs | `brand-intelligence`, `production-planner` |
| Status values | `planning | active | complete | archived` |
| DNA pillars | `Brand | Visual | Voice | Commerce` |

---

## 16. What Claude Should Always Do

- Use token variables for every colour, spacing, and shadow value.
- Use semantic tokens over primitive tokens in all component output.
- Default to **pure white / grey / black** surfaces; **no beige or warm tints**; spend colour only on status meaning.
- Make the primary button **black** (`--color-action`); do not use orange unless a project explicitly approves it for a named AI action.
- Use **Inter** for all UI type; Geist Mono for numbers only.
- Use editorial **fashion photography of female models wearing apparel**; prefer the project's uploaded images; never random stock, illustrations, or unrelated imagery.
- Include the **Global AI Chat Dock** (§5I) at the bottom of the center workspace on every operator screen, with a context-aware greeting.
- Separate surfaces with a 1px hairline, not a shadow.
- Generate all 5 states for every screen.
- Include before/after diff, confidence %, and evidence on every ApprovalCard.
- Show progress as text during AI streaming — never a spinner.
- Make the agent greeting context-aware (active brand, pending count, next action).
- Produce a full-page HTML prototype as the final output.
- Add mobile layout at `max-width: 1024px` — NavSidebar → **fixed bottom tab bar** (with a **More sheet** for secondary destinations), IntelligencePanel → bottom `Sheet`, and the **AI Chat Dock pinned above the tab bar** (workspace reserves the tab-bar height). See §12.
- Name the next action on every empty state.
- Use `Geist Mono` for all numeric data.
- Lead visual-object cards (brand, model, product, shoot, campaign, asset, venue, AI output) with a large image at the content type's aspect ratio — not an icon.
- Show every AI image/video output as a large, uncropped preview card above its ApprovalCard.
- Illustrate empty states with a realistic, quietly-faded preview of the populated result; use a plain icon only when no representative imagery exists.
- Keep one consistent image frame everywhere: `--image-radius` (16px), `object-fit: cover`, fixed aspect ratio per type, neutral placeholder for missing images.

---

## 17. What Claude Must Never Do

- Hardcode hex values or raw pixel numbers.
- Use primitive tokens directly in component styles.
- Use large coloured panels, coloured hero cards, coloured section backgrounds, or **beige / warm-tinted surfaces**.
- Make orange (or any accent) the primary button colour — **black is primary**; orange is retired unless a project explicitly approves it for a named AI action.
- Use **random stock images, illustrations, cartoons, office/corporate photos, or unrelated imagery** — imagery is editorial fashion photography of female models in apparel, preferring uploaded project images.
- Stack shadows or use heavy elevation; nest borders inside borders.
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
| `app/src/styles/tokens.css` | Complete design token source of truth (v3) |
| `app/src/styles/design-system-rules.md` | Shell architecture, AI pattern rules |
| `docs/design/claude-design/redesign-spec.md` | v3 token delta, component redesign list, migration checklist |
| `MOBILE-PLAN.md` | Mobile-first strategy: bottom-tab nav, sheets, chat dock, per-screen wireframes, MVP→Advanced priority |
| `docs/design/claude-design/00-README.md` | Product context, agents, HITL pattern |
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
- [ ] **Global AI Chat Dock** present at the bottom of the center workspace, context-aware greeting (never "How can I help?")
- [ ] IntelligencePanel is always white, even in dark OS mode
- [ ] Active nav item highlighted with the **calm thin-grey** state (grey fill + charcoal text/icon), not orange
- [ ] Page background is pure white `--color-bg-page` (#FFFFFF) — **no beige/warm tint** — surfaces separated by hairlines, not shadows

**Tokens & colour discipline**
- [ ] Zero hardcoded hex values in the output
- [ ] Component tokens use semantic layer (not primitive directly)
- [ ] Palette is **white / light grey / charcoal / black** only; no beige, no warm backgrounds
- [ ] Typography is **Inter** (Geist Mono for numbers only)
- [ ] Primary button is **black** `--color-action`; **no orange** unless explicitly approved for a named AI action
- [ ] No large coloured panels or coloured section backgrounds
- [ ] All buttons use `Button` variant classes, not custom styled divs

**Imagery (image-first, editorial)**
- [ ] Visual-object cards lead with a photo, not an icon, at the correct aspect ratio (§5H)
- [ ] Imagery is **editorial fashion photography of female models wearing apparel** (not glamour, not stock, not illustration); uploaded project images preferred
- [ ] Thumbnails share one frame: `--image-radius` (20px), `object-fit: cover`, consistent ratio
- [ ] AI outputs shown as large uncropped preview cards before approval
- [ ] Empty state shows a realistic faded editorial preview, not a generic icon
- [ ] Missing/loading images use a neutral placeholder / aspect-ratio skeleton (no broken-image icon, no spinner)
- [ ] Galleries use a creative-tool grid (masonry/justified), not a spreadsheet

**States**
- [ ] Populated — full data, agent greeting, quick-action chips
- [ ] Loading — Skeleton matching populated layout exactly
- [ ] Empty — icon + explanation + next action + CTA + AI suggestion
- [ ] Error — icon + message + retry; agent still operable
- [ ] Approval-pending — ApprovalCard (white, amber hairline) with all required elements

**AI / HITL**
- [ ] Every AI value shows confidence % and evidence source
- [ ] ApprovalCard: amber dot + title, before/after diff, confidence, evidence, Approve (black) + Edit + Discard
- [ ] No orange background fill on the approval card
- [ ] Approve transition: amber → green border + check → fade out
- [ ] No AI output is auto-approved or silently applied

**Accessibility**
- [ ] All interactive elements ≥ 44px touch target
- [ ] Focus ring present on all focusable elements
- [ ] Colour not the only status signal (paired with text/icon)
- [ ] `prefers-reduced-motion` respected (durations collapse)

**Responsive**
- [ ] Mobile layout at ≤1024px: NavSidebar → **bottom tab bar**; **More sheet** present for secondary destinations
- [ ] IntelligencePanel hidden on mobile with a Sheet trigger (Insights/Details/Checks)
- [ ] AI Chat Dock stays **pinned above the tab bar** (no overlap; workspace reserves tab-bar height)
- [ ] Touch targets ≥ 44px at 375px viewport
