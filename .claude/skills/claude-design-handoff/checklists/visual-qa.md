# Visual QA Checklist

Run before marking any design implementation Done.

**Design system:** v3 **Zeely Editorial** — light mode only. Reference: `app/DESIGN.md`, screen DC prototype, [`zeely-v3-dc-library.md`](../references/zeely-v3-dc-library.md).

---

## Visual QA

### Layout & fidelity
- [ ] Matches prototype / design at 100% zoom (screenshot evidence saved)
- [ ] 3-panel shell on desktop: NavSidebar · Workspace · IntelligencePanel
- [ ] IntelligencePanel **white**; correct content order
- [ ] PersistentChatDock at workspace base with **context-specific greeting** (not "How can I help?")
- [ ] Pure white page background — not warm off-white
- [ ] Cards: white + 1px `#E5E7EB` hairline, 20px radius
- [ ] Primary CTAs **black** — not orange
- [ ] Image-first content cards where spec requires photography
- [ ] Empty states: heading + body + black CTA + AI hint — not blank void

### Responsive (1024px breakpoint)
- [ ] Desktop ≥1024px: full 3-column layout
- [ ] Mobile <1024px: BottomNavigation visible; NavSidebar hidden
- [ ] IntelligencePanel → BottomSheet with handle + backdrop dismiss
- [ ] Chat dock above tab bar; content not obscured
- [ ] Shoot Wizard: acceptable full-width exception (no tab bar)
- [ ] No horizontal scroll on mobile
- [ ] Touch targets ≥ 44px

### Loading states
- [ ] Skeleton matches populated layout exactly — not spinner-only for content
- [ ] `prefers-reduced-motion`: skeleton static / no shimmer
- [ ] AI streaming: checklist or determinate progress — not infinite spinner alone
- [ ] brand-intelligence: analysing uses progress/retry — not fake stream reconnect

### HITL / AI
- [ ] Every AI write behind ApprovalCard (white + amber hairline)
- [ ] Confidence % + evidence on recommendations
- [ ] Before/after on edits/drafts
- [ ] Approve button black; Edit/Discard outline/ghost

### Cross-screen navigation (prototype parity)
- [ ] No dead primary buttons on verified flows (see `checklist.md` §10)
- [ ] Deep links preserve query params (`?id=`, `?shoot=`)

---

## Accessibility

### Keyboard & focus
- [ ] Logical tab order; Enter activates; Escape closes sheets/dialogs
- [ ] Visible focus rings (not removed without replacement)
- [ ] Sheet/dialog focus trap while open

### Contrast & semantics
- [ ] Text ≥ WCAG AA 4.5:1
- [ ] Status never conveyed by color alone (dot + label + border)
- [ ] Icon buttons have `aria-label`
- [ ] Landmarks: `nav`, `main`, `aside`
- [ ] Live regions for streaming AI text

### Motion
- [ ] All animations respect `prefers-reduced-motion`

---

## Engineering

### Build & tests
- [ ] `cd app && npm run lint` exits 0
- [ ] `npm run typecheck` exits 0
- [ ] `npm test` exits 0
- [ ] `npm run build` exits 0 (pre-merge)
- [ ] No `console.log` in production paths
- [ ] No hardcoded hex — grep `#E87C4D`, `#FBF8F5` in changed files (should be absent)

### Security
- [ ] No service-role or AI keys in `app/src/**`
- [ ] Auth before DB writes; RLS on new tables

### Design system regressions (block merge)
- [ ] No dark mode surfaces introduced
- [ ] No gradients or heavy shadows added
- [ ] No orange primary buttons (unless explicitly waived rare AI accent)
- [ ] No Geist Sans forced as UI font

---

## Five states verification

| State | Verified |
|-------|----------|
| Populated | [ ] |
| Loading (skeleton) | [ ] |
| Empty (+ CTA) | [ ] |
| Error (+ retry) | [ ] |
| Approval-pending OR wizard step | [ ] |

---

## Production evidence (before Done)

1. Terminal: lint + typecheck + test green
2. Browser screenshot at correct URL
3. Side-by-side with DC prototype or design reference
4. Console: zero errors
5. Mobile screenshot at ≤1024px width (operator screens)
6. Optional: update `app/design/screenshots/[screen]/`

---

## Explicitly NOT in scope (v3 iPix)

Do **not** fail QA for missing:
- Dark mode support (light-only product)
- Teal/gold legacy brand colors from other projects
- 920px or 768px breakpoints unless MOBILE-PLAN specifies
