# Universal Design Prompt

Use this as the base for every Claude Design session. Append the page-specific prompt below it.

---

## Paste at the start of every session

```
You are designing screens for iPix / FashionOS.

Read 00-README.md first. It tells you what you're designing and who uses it.

BEFORE designing, review in order:
1. tokens.css — source of truth for all colors, spacing, motion
2. design-system-rules.md — shell architecture and AI component rules
3. 00-README.md — product context, HITL pattern, agent IDs
4. The wireframe file for this screen (if provided)

RULES — non-negotiable:
1. Never hardcode hex values. Only token variable names.
2. Always use semantic tokens (--color-accent) over primitive (--primitive-orange-500).
3. All buttons: ui/button.tsx variants only (default/outline/ghost/destructive).
4. All cards extend ui/card.tsx — never standalone card elements.
5. Shell is always: NavSidebar | Workspace | IntelligencePanel.
6. IntelligencePanel background is always white — never dark, even in dark OS mode.
7. Every AI-generated value must show: confidence %, evidence source, before/after.
8. Every AI write action requires an ApprovalCard (amber border + amber bg).
9. Never create a chat-only right panel.
10. Never put detail content in the right column — center workspace only.

OUTPUT ORDER for every screen:
1. Purpose (one sentence)
2. User goal (what the operator is trying to accomplish)
3. Component hierarchy (tree structure)
4. Components reused from existing library (list)
5. New components needed (if any — justify each)
6. Desktop layout (primary)
7. States: populated → loading (skeleton) → empty → error → approval-pending
8. Mobile layout at 1024px breakpoint
9. Interaction notes
10. Accessibility notes
11. HTML prototype

BRAND IDENTITY:
- Background: #FBF8F5 (warm off-white, not gray, not pure white)
- Cards: white, 1px #E8E0D8 border, 0.625rem radius
- Accent: #E87C4D (orange) — primary actions only, use sparingly
- HITL pending: #F3B93C border + #FFFBF0 bg
- Font: Geist Sans body, Geist Mono for numbers/data
- Icons: Lucide (20px default, 16px inline)
- No gradients. No heavy shadows. Whitespace over decoration.
```

---

## Page-specific prompt templates

Append one of these after the universal prompt above.

---

### Dashboard / Command Center

```
Design the Command Center screen (/app).

Active brand: Nike. Pending approvals: 3. DNA score: 87.

Center workspace: AI greeting card (brand context + next action) + 3 quick-action chips + chat input pinned to bottom.

Right panel (IntelligencePanel): DNA score (87, breakdown Brand/Visual/Voice) + approval stack (3 ApprovalCards) + tabs (Overview | Approvals | Activity).

See prompts/01-dashboard.md for full specification.
```

---

### Brand Detail

```
Design the Brand Detail page (/app/brand/[id]).

Active brand: Nike. DNA score: 87.

Center workspace: BrandHub with tabs (Overview | DNA | Approvals | Assets | Activity). Overview tab shows: brand header, DNA summary card, recent activity, AI recommendations.

Right panel: AI context card (current brand health) + pending approvals + suggestions.

States: loaded (all tabs populated) → loading (skeleton) → DNA-analysis-in-progress (streaming progress banner) → no-data (brand exists but no crawl yet).
```

---

### Shoot List

```
Design the Shoots list page (/app/shoots).

Show: grid of ShootCards. Each card: shoot name, brand logo, date, status chip (planning/active/complete), DNA badge, thumbnail.

Filter bar: status filter + brand filter + date range.

Empty state: "No shoots yet. Plan your first shoot." + [Plan shoot] CTA. Agent in right panel suggests: "Spring Campaign needs 3 shoots — I can plan them now."

New shoot: floating [+ New shoot] button (primary orange) bottom-right.
```

---

### Campaigns

```
Design the Campaigns page (/app/campaigns).

Show: list of campaign cards with: name, brand, date range, deliverables count, status.

Right panel: Creative Director agent — shows campaign brief summary, next deliverable due, AI suggestions.

States: populated → empty ("No campaigns. Create your first campaign.") → loading.
```

---

### Assets

```
Design the Assets page (/app/assets).

Show: masonry grid of asset cards. Each card: image, filename, DNA match %, shoot name, brand.

Filter: brand + shoot + DNA score range + asset type.

Select mode: multi-select with bulk-action bar (download, tag, match to product).

Right panel: selected asset detail (DNA score breakdown, EXIF, match suggestions from AI).
```

---

### Onboarding — Brand Setup

```
Design the brand setup wizard (/app/onboarding).

Multi-step: 1. Brand name + URL → 2. AI crawling in progress → 3. DNA draft ready → 4. HITL review (ApprovalCard) → 5. Done.

Step 2 is AI-active: show streaming progress ("Crawling nike.com… 47 pages analyzed"). No spinner — show actual progress text.

Step 4 is the key HITL moment: full ApprovalCard with before/after DNA diff, confidence %, evidence from crawl. Operator approves to commit.

No right panel during onboarding — full center workspace, wizard takes full width.
```

---

### Empty State (generic)

```
Design an empty state for [screen name].

Illustration: simple Lucide icon (large, muted, centered).
Heading: [what's missing, e.g. "No brands yet"]
Body: one sentence explaining what to do.
CTA: one primary button.
AI suggestion: subtle text below CTA — the agent's recommended next step.

No dead ends. Always show the next action.
```

---

### Loading / Skeleton (generic)

```
Design loading skeletons for [screen name].

Match the final populated layout exactly — skeleton must have the same structure.
Use ui/skeleton.tsx. Background: --color-bg-subtle with shimmer animation.
Never use spinners for content loading — only for button actions and AI streaming.
If AI is streaming: show animated text cursor (--streaming-cursor) + "thinking" indicator (3 pulsing dots, --thinking-dot color).
Skeleton duration: 250ms fade-in (--duration-normal).
```

---

### HITL Approval Card (standalone)

```
Design an ApprovalCard for [what's being approved].

Required elements:
- Warning triangle icon (Lucide AlertTriangle, 14px, amber)
- Title: [draft name]
- Before: current value (if updating existing)
- After: proposed new value (AI-generated)
- Confidence: [X]% in --ai-confidence-high/mid/low color
- Evidence: "Based on [source]" in --color-text-muted
- Actions: [Approve] (Button default, orange) | [Edit] (Button outline) | [Reject] (Button ghost, destructive-light)

Card style: 1.5px --approval-border, --approval-bg, 0.625rem radius.
After approval: transition to --approval-done-border + --approval-done-bg (green).
```
