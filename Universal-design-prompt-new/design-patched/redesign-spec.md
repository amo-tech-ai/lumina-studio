# FashionOS v3 "Zeely Editorial" — Visual Redesign Spec

> Companion to the rewritten `DESIGN.md` and `image-strategy.md`. Direction: pure, image-first, magazine-grade. **Visual only** — AI workflows, HITL gates, agent map, and the 3-panel shell are unchanged. Pair with the updated `tokens.css` in this folder. Supersedes the v2 "Atelier" spec.

---

## 1. Direction in one paragraph

Move FashionOS from the warm, beige "Atelier" palette to a pure **white / light-grey / charcoal / black** operating system. **Black** is the primary action colour; **orange is retired** as chrome (opt-in only for a named AI action). **Inter** becomes the primary UI font; Geist Mono is reserved for numbers, scores, and IDs. Hairline borders replace shadows; radii grow to 20px on cards and images. Above all, **large editorial fashion photography** (female models in apparel) carries the visual interest while the UI recedes, and **every operator screen gains a persistent context-aware AI chat dock** at the base of the workspace. The result reads as a premium, magazine-grade SaaS a fashion house would trust.

---

## 2. Migration from v2 "Atelier" → v3 "Zeely Editorial"

The biggest change is the neutral scale: the warm "stone" primitives are replaced by **pure greys**, and orange stops being an accent.

### 2A. Primitive scale — REPLACE warm "stone" with pure neutral grey

| v2 (Atelier, warm) | v3 (Zeely, pure) | Value |
|---|---|---|
| `--primitive-stone-50` `#FCFBF9` | `--primitive-grey-50` | `#FAFAFA` |
| `--primitive-stone-100` `#F7F5F1` | `--primitive-grey-100` | `#F5F5F5` |
| `--primitive-stone-150` `#F0EEE9` | `--primitive-grey-150` | `#EDEDED` |
| `--primitive-stone-200` `#EAE7E1` | `--primitive-grey-200` | `#E5E7EB` |
| `--primitive-stone-300` `#CDC9C1` | `--primitive-grey-300` | `#D1D5DB` |
| `--primitive-stone-500` `#8B8780` | `--primitive-grey-400` | `#9CA3AF` |
| `--primitive-stone-600` `#57554F` | `--primitive-grey-600` | `#4B5563` |
| `--primitive-ink-900` `#1A1A18` | `--primitive-ink-900` | `#111111` |
| `--primitive-ink-800` `#2E2D2A` | `--primitive-ink-800` | `#2A2A2A` |

### 2B. Semantic tokens — CHANGE

| Token | v2 (Atelier) | v3 (Zeely) | Why |
|---|---|---|---|
| `--color-bg-page` | `#FCFBF9` (warm) | `#FFFFFF` (pure white) | no beige; pure white-forward |
| `--color-bg-subtle` | `#F7F5F1` (warm) | `#FAFAFA` (grey) | remove warm tint |
| `--color-bg-muted` | `#F0EEE9` | `#F5F5F5` | pure grey |
| `--color-border` | `#EAE7E1` | `#E5E7EB` | neutral hairline |
| `--color-border-subtle` | `#F0EEE9` | `#EDEDED` | neutral divider |
| `--color-border-focus` | `#E87C4D` (orange) | `#111111` (charcoal) | **orange retired** from focus ring |
| `--color-text-primary` | `#1A1A18` | `#111111` | pure near-black |
| `--color-text-secondary` | `#57554F` (warm) | `#4B5563` (grey) | neutral |
| `--color-text-muted` | `#8B8780` (warm) | `#9CA3AF` (grey) | neutral |
| `--color-accent` | `#E87C4D` (orange) | `var(--primitive-ink-900)` (black) | **orange retired** — legacy refs go neutral |
| `--streaming-cursor` | orange | charcoal | neutral |

### 2C. Semantic tokens — ADD

| Token | Value | Purpose |
|---|---|---|
| `--font-sans` | `"Inter", -apple-system, …` | **primary UI font** |
| `--font-mono` | `"Geist Mono", …` | numbers / scores / IDs only |
| `--color-blocked-light` | `#FEE2E2` | light destructive tint (closes a v2 gap) |
| `--ai-badge-bg / -text / -border` | grey / secondary / hairline | quiet grey AI badge (never a coloured pill) |
| `--chatdock-*` | white / hairline / black send | the new Global AI Chat Dock |

### 2D. Radius — CHANGE (cards + images grow to 20px)

| Token | v2 | v3 |
|---|---|---|
| `--card-radius` | `--radius-lg` (16px) | `--radius-xl` (20px) |
| `--image-radius` | `--radius-lg` (16px) | `--radius-xl` (20px) |
| `--image-radius-sm` | `--radius-md` (10px) | `--radius-md` (10px) — unchanged |

### 2E. Component tokens — CHANGE

| Token | v2 | v3 | Why |
|---|---|---|---|
| `--btn-accent-bg` (orange Approve) | orange fill | **removed** → Approve uses `--btn-primary-bg` (black) | orange retired |
| `--nav-item-active` | warm `#F7F5F1` | grey `#F5F5F5` | calm thin-grey active |
| `--nav-item-active-text` | charcoal | charcoal | unchanged |
| `--approval-bg` | white | white | unchanged (still no orange fill) |
| `--approval-border` | amber | amber | unchanged (HITL keeps amber hairline) |

### 2F. Unchanged on purpose

DNA score colours (`--color-dna-*`), confidence colours (`--ai-confidence-*`), status hues (green/amber/red/blue/purple), motion tokens, spacing scale, typography size scale, z-index, breakpoint, and the **HITL amber treatment**. The redesign is about a pure neutral palette, Inter, imagery, and the chat dock — not new status hues.

---

## 3. Components that need redesign / addition

| Component | Change | Effort |
|---|---|---|
| **Button** (`ui/button.tsx`) | `default` → **black** fill. Remove the orange accent treatment; the AI **Approve** button is now black (the amber-border card carries the AI meaning). Radius 10px. | M |
| **Card** (`ui/card.tsx`) | Radius 16 → **20px**, padding 24–32px, near-invisible shadow, single hairline border. | S |
| **MediaCard / image-first cards** | Brand / Shoot / Campaign / Asset / Model / Venue cards lead with an editorial fashion image at the type's ratio; title + quiet metadata below; status chip on the image corner. | M |
| **AIChatDock** *(new)* | Persistent context-aware chat docked at the base of the center workspace: greeting names the active object, 3–5 quick chips, streaming status (no spinner), black send button. On every operator screen. | M |
| **NavSidebar** | Calm thin-grey active state; image avatars for brands/accounts; reduced icon dependence; widen spacing. | M |
| **ApprovalCard** | White card + amber hairline + amber status dot; **Approve button = black**; on-approve → green border + check, fade. | M |
| **StatusChip** | Border + dot + label on white (no filled pill). | S |
| **EmptyState** | Faded realistic **editorial fashion preview** of the populated result + one black CTA + AI suggestion line; plain icon only when no representative imagery exists. | S |
| **IntelligencePanel** | Executive briefing order: context → insights → evidence → approvals → conversation; white hairline sections. | M |
| **Typography** | Swap Geist Sans → **Inter** for all UI; keep Geist Mono for numbers only. | S |

---

## 4. `design-system-rules.md` updates

- **Palette rule:** "Surfaces are pure white / light grey; text + primary actions are charcoal/black. **No beige or warm tints.** Colour appears only as a status signal."
- **Action rule:** "Primary actions use `--color-action` (black). **Orange is retired** — do not use it for any button or chrome unless a project explicitly approves it for a named AI action."
- **Type rule:** "Inter is the primary UI font. Geist Mono is reserved for numbers, scores, IDs."
- **Imagery rule (new):** "Content objects lead with editorial fashion photography of female models in apparel; prefer uploaded images; never random stock, illustration, office, or glamour imagery."
- **Chat dock rule (new):** "Every operator screen includes a persistent, context-aware AI chat dock at the base of the center workspace; greeting names the active object and never opens with 'How can I help?'."
- **Elevation rule:** "Surfaces are separated by 1px hairlines; shadows are reserved for transient overlays (Popover, Dialog, Sheet)."
- **Colour-field rule:** "No element may use a saturated colour as a fill larger than a button, dot, chip, or 2px accent line."

---

## 5. Migration checklist (Atelier v2 → Zeely Editorial v3)

**Phase 0 — Tokens (do first; everything inherits)**
- [ ] Replace `tokens.css` with the v3 file (this folder). Diff against §2 before merging.
- [ ] Grep components for warm hardcoded hex (`#FCFBF9`, `#F7F5F1`, `#EAE7E1`, `#1A1A18`, `#57554F`, `#8B8780`, `#E87C4D`) → replace with tokens.
- [ ] Confirm `--font-sans` (Inter) is wired in `globals.css` / `layout.tsx` and `--color-blocked-light` + `--chatdock-*` resolve everywhere.

**Phase 1 — Primitives**
- [ ] Button: **black** `default`, remove orange accent, radius 10px.
- [ ] Card: 20px radius, 24–32px padding, near-invisible shadow.
- [ ] Badge / StatusChip: border + dot + label (un-fill); AI badge = quiet grey.
- [ ] Tabs: charcoal underline indicator.
- [ ] Typography: switch UI font to Inter; numbers stay Geist Mono.

**Phase 2 — Shell**
- [ ] NavSidebar: calm grey active state; image avatars; widen spacing; reduce icons.
- [ ] IntelligencePanel: executive-briefing order; white hairline sections.
- [ ] Workspace: 32px page padding; **mount the AIChatDock at the base**.

**Phase 3 — AI / HITL**
- [ ] ApprovalCard: white card + amber hairline + amber dot; **black Approve button**; green-border approved state.
- [ ] AIChatDock: context-aware greeting + quick chips + streaming status on every operator screen.
- [ ] DNAScoreBar: thin bars, mono numerals, weakest-pillar dot.
- [ ] EmptyState: faded editorial fashion preview structure.

**Phase 4 — Imagery**
- [ ] Replace icon-led content cards with image-first MediaCards at the correct ratios.
- [ ] Wire uploaded fashion images (`app/design/images`) into prototypes via `<image-slot>` / real `src`.
- [ ] Galleries (Assets, casting, matching) → masonry/justified grids, not tables.

**Phase 5 — Screens (re-skin, layout unchanged)**
- [ ] Command Center — v3 (pure white, black primary, calm nav, chat dock, real fashion imagery).
- [ ] Brand Detail — same; before/after diff reads on white; before/after as image strips.
- [ ] Shoots List — cover-first ShootCards + chat dock.
- [ ] Apply v3 to each new screen as it's built (Brand List, Campaigns, Assets, …).

**Phase 6 — QA**
- [ ] Run the updated Screen Generation Checklist (DESIGN.md §20) on every screen.
- [ ] Contrast audit: muted grey text on white/subtle ≥ 4.5:1.
- [ ] Confirm zero beige surfaces and zero orange chrome remain (orange only on an approved AI action, if any).
- [ ] Confirm the AI chat dock is present and context-aware on every operator screen.
- [ ] `prefers-reduced-motion` still zeroes durations.

**Unchanged (do NOT touch):** agent map, durability, HITL gate logic, 3-panel grid, route structure, 5-state requirement, evidence/confidence rules.
