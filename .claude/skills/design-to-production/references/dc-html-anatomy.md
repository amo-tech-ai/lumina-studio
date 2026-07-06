# DC HTML anatomy — how to read `*.v2.image-first.dc.html`

Use when auditing or implementing any screen in `Universal design prompt/`.

---

## File structure

| Section | Selector / marker | Parity scope |
|---------|-------------------|--------------|
| **Shell grid** | outer `display:grid; grid-template-columns: auto minmax(0,1fr) auto` | ❌ Do not rebuild — `OperatorPanel` |
| **NavSidebar** | `nav[data-screen-label="NavSidebar"]` | ❌ Shell |
| **Workspace** | `main[data-screen-label="Workspace"]` | ✅ **Primary parity target** |
| **IntelligencePanel** | `aside[data-screen-label="IntelligencePanel"]` | ❌ Shell (340px desktop) |
| **Mobile tab bar** | `.m-tabbar` @ `max-width:1024px` | ⚠️ Shell — verify behavior only |
| **Intel sheet** | `aside.sheet-open` @ mobile | ⚠️ Shell |
| **Chat dock** | `.m-chatdock` inside workspace footer | ⚠️ Often shell — check if DC embeds in workspace |

**Rule:** Only implement markup/CSS inside `main[data-screen-label="Workspace"]` unless issue explicitly scopes shell mobile.

---

## Workspace zones (typical list screen — e.g. Shoots List)

Extract measurements from inline styles (DevTools or grep):

| Zone | DC pattern (Shoots List) | React target |
|------|--------------------------|--------------|
| Header padding | `padding: 28px 40px 0` | `.module.css` header block |
| Content max-width | `max-width: 920px; margin: 0 auto` | **920px** — not `max-w-5xl` (1024px) |
| Scroll body padding | `padding: 20px 40px 24px` | scroll region inside workspace |
| Card grid | `grid-template-columns: repeat(3,1fr); gap: 20px` | 3-col desktop — not 4-col |
| Card aspect | `aspect-ratio: 4/3` on skeleton / ShootCard | match in CSS module |
| Image radius | `var(--image-radius)` → often `1.25rem` | `tokens.css` `--radius-*` |
| Primary button | `height: 40px; padding: 0 18px; border-radius: var(--radius-md)` | no `rounded-full` unless DC shows it |

---

## State blocks in DC HTML

DC uses `sc-if value="{{ wsLoading }}"` etc. Map each to React:

| DC flag | UI | React pattern |
|---------|-----|---------------|
| `wsLoading` | 6 skeleton cards, 3-col grid, shimmer | `loading.tsx` + `ShootsListSkeleton` or Suspense fallback |
| `wsEmpty` | stacked photos + headline + CTA + planner hint | distinct from filter-empty |
| `wsError` | icon + message + **Try again** button | must wire `onRetry` — not inline red banner only |
| `noMatches` | search/filter no results | separate from portfolio empty |
| `wsGrid` | populated grid + `dc-import ShootCard` | map live data; no fake rows |

**Anti-pattern:** Treating error like empty, or one generic empty for both "no shoots" and "no matches".

---

## `dc-import` components

```html
<dc-import name="components/ShootCard" title="..." cover-url="..." ...>
```

1. Open `Universal design prompt/components/ShootCard.dc.html` (or path in `name=`).
2. Reuse production component if exists (`app/src/components/shoot/ShootCard.tsx`).
3. Extend props/CSS to match DC — do not fork a second card.

---

## Token mapping (DC → iPix production)

DC prototypes often use **Inter** and Zeely neutrals (`#111`, `#fafafa`). Production uses **Cormorant + Outfit** and `app/src/styles/tokens.css`.

| DC variable | Typical DC value | iPix token / rule |
|-------------|------------------|-------------------|
| `--color-action` | `#111111` | `--text-primary` / action button token — **not** legacy `#E87C4D` |
| `--color-bg-page` | `#ffffff` | workspace inherits shell bg — **no** `#FBF8F5` page wrapper |
| `--color-text-secondary` | `#6b7280` | `--text-secondary` |
| `--fs-2xl` | `1.5rem` | serif heading scale in module |
| `--image-radius` | `1.25rem` | `--radius-lg` or module constant |
| Font | Inter | `--font-sans` (Outfit) · headings `--font-serif` |

**Do not** copy DC `:root` wholesale into React. Map each used variable to `tokens.css` or module.

---

## Breakpoints

| Width | DC behavior | Verify |
|-------|-------------|--------|
| ≥1025px | 3-panel desktop | 1280 viewport |
| ≤1024px | nav hidden, tab bar, intel sheet | 390 viewport |
| Grid collapse | Shoots List stays 3-col until narrower — check `@media` in HTML | grep `@media` in file |

---

## Optional DC server

```bash
python3 -m http.server 8765 --directory "Universal design prompt"
# http://localhost:8765/Shoots%20List.v2.image-first.dc.html
```

Toggle DC `STATE` switcher in HTML (if present) to screenshot each state before implementing.

---

## Screen-specific conversion plans

| Screen | Plan doc |
|--------|----------|
| Shoots List | `tasks/design-docs/shoot/PLAN/shoots-list-dc-conversion.md` |
| Shoot Detail | `tasks/design-docs/shoot/PLAN/shoot-detail-dc-conversion.md` |
| Handoff checklists | `tasks/design-docs/docs/handoff/11-screen-checklists.md` |
