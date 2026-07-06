---
name: frontend-design
description: >
  Frontend & UI design hub — create distinctive, production-grade interfaces, with on-demand
  references for a UI pattern catalog and brand color systems. Use when building or styling web
  components, pages, dashboards, or apps; choosing a visual style / font pairing / layout / chart;
  building a design system (Tailwind tokens, component libraries, responsive patterns); or
  generating an accessible brand color palette (11-shade scale, semantic tokens, dark mode, WCAG
  contrast). Generates creative, polished code that avoids generic AI aesthetics. Pairs with the
  `shadcn` MCP skill, `accessibility`, and `ipix-wireframe`.
version: 2.0.0
metadata:
  priority: 3
---

# Frontend & UI Design Hub

Create distinctive, production-grade frontend interfaces. **Load a `references/` file on demand**
for deeper UI patterns or color systems — don't paste their bodies here.

> **Consolidation note (v2.0.0):** the former standalone skills `ui-ux-pro-max` and
> `color-palette` are now `references/` inside this skill. Behavior preserved; only the packaging
> changed.

## Design principles
- **Avoid generic AI aesthetics** — no boring cards, overused gradients, or generic icons.
- **Typography-first** — distinctive font pairings set the tone.
- **Purposeful whitespace** — breathing room communicates premium quality.
- **Consistent micro-interactions** — hover, focus, transition states.
- **Dark mode support** — class-based; design both themes.

## Process
1. Understand the content hierarchy.
2. Define the visual rhythm (type scale, spacing, grid).
3. Build components inside-out (content → padding → border → shadow).
4. Animate with purpose (entry, state change, feedback).
5. Responsive from the start (mobile-first).

## Stacks
- React + TypeScript + Tailwind CSS (preferred) · shadcn/ui (Radix primitives) · Framer Motion / CSS transitions.

## References — load on demand
| Need | Reference |
|------|-----------|
| UI **pattern catalog** — 50 styles, 21 palettes, 50 font pairings, 20 charts, 9 stacks; plan/build/review actions | [`references/ui-catalog/ui-ux-pro-max.md`](references/ui-catalog/ui-ux-pro-max.md) |
| **Brand color system** — hex → 11-shade scale (50–950), semantic tokens, dark mode, WCAG contrast; Tailwind token template | [`references/color/color-palette.md`](references/color/color-palette.md) (+ `references/color/{references,templates,rules,agents}/`) |
| **Design system** — tokens, component libraries, responsive patterns (Tailwind **v4** — matches iPix's installed version, `@tailwindcss/postcss`, no `tailwind.config.js`) | [`references/tailwind/tailwind-design-system.md`](references/tailwind/tailwind-design-system.md) |

### Related sibling skills
| Task | Skill |
|------|-------|
| Add / search / compose **shadcn/ui** components (registry, presets — pairs with the `shadcn` MCP) | [`shadcn`](../shadcn/SKILL.md) |
| **Responsive layouts** — container queries, fluid typography, CSS Grid, mobile-first breakpoints | No dedicated skill yet — follow the "Process" §5 rule above (mobile-first) and the Responsive checklist in [`dc-to-react-plan-template.md` §12](../../../tasks/design-docs/dc-to-react-plan-template.md) |
| WCAG / a11y audit | [`accessibility`](../accessibility/SKILL.md) |
| Lo-fi wireframes before production UI | [`ipix-wireframe`](../ipix-wireframe/SKILL.md) |
| Build the multi-file feature behind the UI | [`feature-dev`](../archive/feature-dev/SKILL.md) |

## iPix design system
Honor the iPix brand (`.cursor/rules/ui-design.mdc`): Cormorant Garamond + Outfit, orange
`#E87C4D` / blue `#1E293B` / mustard `#F3B93C` / off-white `#FBF8F5`, premium muted aesthetic.
