# Animation & Motion Guide

> Motion rules for the Zeely Editorial system. Calm, fast, purposeful — motion clarifies state change, never decorates. Honour `prefers-reduced-motion` everywhere.
>
> **Canonical motion spec (D-DS21).** This file is the single source for timings, easing, and per-element motion. Adoption across screens is tracked separately as **D-MO1** (apply these tokens/patterns consistently) — this doc *defines*, D-MO1 *applies*.

## Principles
- **Functional** — every animation communicates a state change (open, navigate, complete, stream). No ambient motion.
- **Fast & soft** — default `250ms` with `cubic-bezier(.16,1,.3,1)` (ease-out, gentle settle). Micro-interactions 120–180ms; overlays 250–320ms.
- **Reduced-motion** — under `prefers-reduced-motion: reduce`, disable transforms/keyframes; keep instant state changes (opacity-only or none).

## Motion tokens
| Token | Value | Use |
|---|---|---|
| `--duration-fast` | 120–180ms | hover, toggle, chip |
| `--duration-normal` | 250ms | most transitions |
| `--duration-slow` | 300–320ms | sheets, modals, page |
| `--ease-default` | `cubic-bezier(.16,1,.3,1)` | enter/settle |
| linear | — | streaming/skeleton loops |

## Patterns
| Element | Motion |
|---|---|
| **Hover/press** | color/border/background 120–180ms; press = subtle bg, no scale jump |
| **Card hover** | border `--color-border` → `-strong`, 250ms; no shadow jump, no scale |
| **AI streaming** | steps appear top-down; active dot **pulse** (`opacity 1↔.25`, ~1s); check on done. Never a spinner |
| **Skeletons** | shimmer sweep, ~1.4s linear loop; matches populated layout |
| **Panel/sheet open** | bottom sheet slide-up `translateY(101%)→0` ~300ms; backdrop fade; drag handle |
| **Modal** | backdrop fade + content 250ms; focus trap; esc/backdrop close |
| **Drawer (shortlist)** | slide from right; backdrop fade |
| **Toast** | fade/slide up from bottom; auto-dismiss ~2.2–2.4s |
| **Navigation** | instant route change; preserve scroll where relevant; no full-page spinners (skeletons instead) |
| **Progress (determinate)** | bar/counter eased to target (e.g. DNA "n/47"); no infinite spinner |
| **Approval resolve** | approved → brief check → fade out (~1–1.5s) |
| **Success state** | check badge scale-in (reduced-motion: appear); concise |

## Don'ts
- No decorative/looping ambient motion, parallax, or bouncy springs.
- No spinners for content (skeletons + determinate progress only).
- No scale-pop on cards/buttons; no shadow jumps on hover.
- No motion that blocks interaction or delays navigation.

## Streaming reference (AI dock)
```
○ Reading shoot…        → ● Reading shoot…      → ✅ Reading shoot…
○ Analyzing Brand DNA…     ○ Analyzing Brand DNA…   ● Analyzing Brand DNA…
```
Active = pulsing filled dot; done = green check; pending = faint hollow dot. Steps stream ~600–700ms apart, then return to the greeting.
