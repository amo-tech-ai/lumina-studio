# Universal Design Prompt

Use this as the base for every Claude Design session. Append the page-specific prompt below it.

> **Visual direction: v3 "Zeely Editorial"** — pure white / grey / black, Inter, black actions, image-first editorial fashion photography, and a global AI chat dock on every operator screen. Supersedes v2 "Atelier."

---

## Paste at the start of every session

```
You are designing screens for iPix / FashionOS.

Read 00-README.md first. It tells you what you're designing and who uses it.

BEFORE designing, review in order:
1. tokens.css — source of truth for all colors, spacing, motion (v3)
2. design-system-rules.md — shell architecture and AI component rules
3. 00-README.md — product context, HITL pattern, agent IDs, v3 direction
4. image-strategy.md — image-first rules + per-screen image audit
5. The wireframe file for this screen (if provided)

RULES — non-negotiable:
1. Never hardcode hex values. Only token variable names.
2. Always use semantic tokens (--color-action) over primitive (--primitive-ink-900).
3. All buttons: ui/button.tsx variants only (default=black/outline/ghost/destructive).
4. All cards extend ui/card.tsx — never standalone card elements.
5. Shell is always: NavSidebar | Workspace (+ AI chat dock) | IntelligencePanel.
6. IntelligencePanel background is always white — never dark, even in dark OS mode.
7. Every AI-generated value must show: confidence %, evidence source, before/after.
8. Every AI write action requires an ApprovalCard (white card + amber hairline).
9. Never create a chat-only right panel.
10. Never put detail content in the right column — center workspace only.
11. Every operator screen has a persistent, context-aware AI chat dock at the base
    of the center workspace — greeting names the active object, never "How can I help?".
12. Content objects lead with editorial fashion photography (female models in apparel);
    prefer uploaded images in app/design/images; never random stock/illustration/office/glamour.
13. Pure white / grey / black only. No beige, no warm tints, no orange chrome.

OUTPUT ORDER for every screen:
1. Purpose (one sentence)
2. User goal (what the operator is trying to accomplish)
3. Component hierarchy (tree structure)
4. Components reused from existing library (list)
5. New components needed (if any — justify each)
6. Desktop layout (primary) — image-first where content objects appear
7. States: populated → loading (skeleton) → empty → error → approval-pending
8. AI chat dock: greeting copy + quick-action chips + a streaming-status example
9. Mobile layout at 1024px breakpoint
10. Interaction notes
11. Accessibility notes
12. HTML prototype

BRAND IDENTITY (v3 "Zeely Editorial"):
- Background: #FFFFFF (pure white) / #FAFAFA (subtle). No beige, no warm off-white.
- Cards: white, 1px #E5E7EB border, 1.25rem (20px) radius, near-invisible shadow.
- Primary action: #111111 (black) fill, white text. Secondary: white + hairline.
- Orange is RETIRED — never a button or chrome unless explicitly approved for a named AI action.
- HITL pending: white card + #F3B93C amber hairline + amber status dot (no fill).
- Imagery: large editorial fashion photography (female models in apparel), 20px frame,
  object-fit cover; prefer app/design/images; never stock/illustration/office/glamour.
- AI badge: quiet grey (subtle fill + charcoal text), never a coloured pill.
- Font: Inter (UI/body), Geist Mono for numbers/scores/IDs only.
- Icons: Lucide, used sparingly (image avatars + photography carry the interest).
- No gradients. No heavy shadows. Whitespace over decoration.
```

---

## Page-specific prompt templates

Append one of these after the universal prompt above. Each operator screen keeps the 3-panel shell, the 5 states, and the base AI chat dock.

---

### Dashboard / Command Center

```
Design the Command Center screen (/app).

Active brand: Nike. Pending approvals: 3. DNA score: 87.

Center workspace: AI greeting card (brand context + next action) + 3 quick-action chips
+ a "Recent work" editorial moodboard row (real fashion photography) + AI chat dock at the base.

Right panel (IntelligencePanel): DNA score (87, breakdown Brand/Visual/Voice/Commerce)
+ approval stack (3 ApprovalCards, each with a thumbnail of what's being approved)
+ tabs (Overview | Approvals | Activity).

See prompts/01-dashboard.md for full specification.
```

---

### Brand List

```
Design the Brand List page (/app/brand).

Show: a grid of image-first BrandCards — brand hero/lockup (16:9 cover, editorial fashion)
on top → brand name, DNA score (mono), status chip below. Card hover reveals a 2–3 asset peek.

Filter chips above the grid (status, sort). AI chat dock at the base: greeting names the
portfolio ("4 brands — Nike's Visual score dropped to 72") + quick actions.

Right panel: Brand Intelligence — portfolio health + pending approvals + suggestions.

Empty state: a faded sample BrandCard ("Your brands will appear here") + black CTA, not an icon.
States: populated → loading → empty → error → approval-pending.
```

---

### Shoot List

```
Design the Shoots list page (/app/shoots).

Show: grid of cover-image-first ShootCards (4:3 editorial fashion cover) → shoot name,
date (mono), status chip (planning/active/complete), DNA badge. No icon tiles.

Filter chips: status + brand + date range. AI chat dock at the base (Production Planner):
context greeting + quick actions (Plan shoot, Generate shot list, Create call sheet).

New shoot: floating [+ New shoot] button (black) bottom-right.

Empty state: faded sample shoot cover + "Plan your first shoot" + AI suggestion line.
States: populated → loading → empty → error → approval-pending.
```

---

### Shoot Wizard

```
Design the Shoot Wizard (/app/shoots/new).

Multi-step and visual: location step = venue cards (3:2 photos); model step = casting grid
(3:4 editorial portraits); shot-list step = a shot grid where each row carries a reference image.
Budget/deliverable approval cards show the deliverable's preview frame.

Side rail shows a live moodboard of choices made so far. AI chat dock at the base guides the step.

Keep the 3-panel shell. States: populated → loading → empty → error → approval-pending.
```

---

### Campaigns

```
Design the Campaigns page (/app/campaigns).

Show: grid of 16:9 cover-first CampaignCards (editorial fashion) → name, date range (mono),
deliverables count, status. Card shows a stacked thumbnail count ("+8") on the cover.

Right panel: Creative Director — campaign brief summary, next deliverable (preview thumbnail),
AI suggestions. AI chat dock at the base.

Empty state: faded sample campaign cover + black CTA.
States: populated → loading → empty → error → approval-pending.
```

---

### Assets

```
Design the Assets page (/app/assets).

This is the gallery screen: masonry/justified grid of AssetCards (native ratios, generous gaps,
real editorial fashion photography). DNA match shown as a corner chip on the image; selection =
checked overlay; bulk-action bar floats.

Filter chips: brand + shoot + DNA score range + asset type. AI chat dock at the base (Visual Identity).

Right panel: selected-asset detail — large preview + EXIF + match suggestions as thumbnails.
Empty state: faded 6-up asset moodboard + black CTA.
States: populated → loading → empty → error → approval-pending.
```

---

### Matching

```
Design the Matching page (/app/matching).

Swipe-card variant = full-bleed portrait/cover (model 3:4, venue 3:2, designer lookbook) —
the match IS the image. Table variant keeps a leading thumbnail column. Match quality = chip on
the image; saved = overlay check. AI chat dock at the base (Social Discovery).

Right panel: match context + why-this-match evidence + pending approvals.
Empty state: a faded sample match card.
States: populated → loading → empty → error → approval-pending.
```

---

### Channel Preview

```
Design the Channel Preview page (/app/preview).

Device frames render the actual creative at platform ratios (9:16 story, 4:5 feed, 1:1) —
the screen is inherently image-led; enlarge the frames, reduce surrounding chrome. Replace
platform icon rows with small rendered-thumbnail tabs. Generous neutral stage around frames.

Right panel: Creative Director — channel notes + scheduling + pending approvals. AI chat dock at base.
States: populated → loading → empty → error → approval-pending.
```

---

### Onboarding — Brand Setup (standalone — no shell)

```
Design the brand setup wizard (/app/onboarding).

Standalone full-width wizard — NO 3-panel shell, NO chat dock.

Multi-step: 1. Brand name + URL → 2. AI crawling in progress → 3. DNA draft ready →
4. HITL review (ApprovalCard) → 5. Done.

Step 2 is AI-active: show streaming progress ("Crawling nike.com… 47 pages analyzed") with
LIVE THUMBNAILS of pages/images being pulled — no spinner.
Step 3: present the drafted DNA as a moodboard (palette + sample editorial imagery + type).
Step 4 is the key HITL moment: full ApprovalCard with before/after DNA diff (visual identity strip),
confidence %, evidence from crawl. Operator approves to commit. Approve = black button.

A large brand-hero placeholder fills as the crawl resolves.
```

---

### Empty State (generic)

```
Design an empty state for [screen name].

Preview: a faded, realistic editorial fashion preview of the populated result (e.g. a sample
card) — NOT an icon-only empty. Plain Lucide icon only when no representative imagery exists.
Heading: [what's missing, e.g. "No brands yet"]
Body: one sentence explaining what to do.
CTA: one black primary button.
AI suggestion: subtle text below CTA — the agent's recommended next step.

No dead ends. Always show the next action.
```

---

### Loading / Skeleton (generic)

```
Design loading skeletons for [screen name].

Match the final populated layout exactly — skeleton must have the same structure, including
image frames at their aspect ratios.
Use ui/skeleton.tsx. Background: --color-bg-subtle with shimmer animation.
Never use spinners for content loading — only for button actions and AI streaming.
If AI is streaming: show animated text cursor (--streaming-cursor, charcoal) + "thinking"
indicator (3 pulsing dots, --thinking-dot color).
Skeleton duration: 250ms fade-in (--duration-normal).
```

---

### HITL Approval Card (standalone)

```
Design an ApprovalCard for [what's being approved].

Required elements:
- Warning triangle icon (Lucide AlertTriangle, 14px, amber)
- Title: [draft name]
- Before: current value (if updating existing) — IMAGE STRIP when the change is visual
- After: proposed new value (AI-generated) — IMAGE STRIP when the change is visual
- Confidence: [X]% in --ai-confidence-high/mid/low color
- Evidence: "Based on [source]" in --color-text-muted
- Actions: [Approve] (Button default, BLACK) | [Edit] (Button outline) | [Reject] (Button ghost, destructive-light)

Card style: white bg, 1px --approval-border (amber) hairline, 1.25rem radius, amber status dot.
After approval: transition to --approval-border-done (green) + check, then fade.
```

---

### AI Chat Dock (standalone)

```
Design the persistent AI chat dock for [operator screen].

Docked at the BASE of the center workspace (never overlaps the IntelligencePanel).

Required:
- Context-aware greeting naming the active object + next best action
  (e.g. "You're reviewing Nike – Spring Campaign. I found 3 opportunities…"). Never "How can I help?".
- 3–5 quick-action chips relevant to the screen (white + hairline + charcoal; selected = charcoal).
- Streaming status: live steps with green checks / pulsing active dot / faint pending dots
  (and thumbnails where visual) — never a bare spinner.
- Input: full-width "Ask about this [object]…" with mic + BLACK send button.
- Pure white, hairline top border, Inter.
```
