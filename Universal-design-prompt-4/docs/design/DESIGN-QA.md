# Master Design QA Checklist (D-DS24)

> Run this before marking any screen **Design-100%** (`DESIGN-TASKS.md §0`). Every DC prototype must pass all sections. This is the design gate — React parity/QA is a separate gate in the code repo (`docs/handoff/13-react-mobile-verification.md`).

**How to use:** copy the checklist into the screen's PR/notes, tick each box, attach the verified screenshot(s). A single 🔴 blocks Design-100%. Cross-refs: `DESIGN-TOKENS.md`, `PATTERNS.md`, `STATES.md`, `ANIMATIONS.md`, `ACCESSIBILITY.md`, `AI-UX.md`, `components/COMPONENTS.md`.

---

## 1. Type & spacing
- [ ] All text ≥ the token scale min (no ad-hoc font-size below `--fs-xs`).
- [ ] Type uses `--fs-*` tokens only — no hard-coded px sizes.
- [ ] Spacing uses the 4px grid / spacing tokens; no magic-number margins.
- [ ] Headings, body, captions use the defined weights (no random 500/600 mixing).
- [ ] `text-wrap: pretty`/`balance` on headings + long paragraphs; no orphaned single words in titles.

## 2. Color & tokens
- [ ] Every color is a `tokens.css` variable — **zero** raw hex in the screen.
- [ ] No new colors/fonts introduced (Zeely Editorial v3 palette only).
- [ ] Hairline borders `1px` at the token border color; card radius from token.
- [ ] Status colors come from StatusChip, not re-implemented inline.
- [ ] Contrast ≥ WCAG AA (4.5:1 text / 3:1 large + UI).

## 3. Components & reuse
- [ ] Screen is wrapped in `OperatorShell` (operator screens); nav + panel + mobile chrome all present.
- [ ] All cards/chips/empty/loading use the shared components — **no forked variants** (see dependency matrix, `03-component-map.md`).
- [ ] AI explainability uses **EvidenceBlock** (frozen contract — extend, don't fork).
- [ ] Selection/drag uses the host-overlay pattern (`PATTERNS.md#selection`), not a new card.
- [ ] No duplicate component logic that a shared primitive already covers.

## 4. States (all present + reachable)
- [ ] **Loading** — SkeletonLoader (not a spinner) in the real layout shape.
- [ ] **Empty / no-data** — EmptyState with icon + title + body + action.
- [ ] **Error** — correct type from the 9-state catalog (`STATES.md`): network/timeout/404/500/permission/sync/AI-failed — with the canonical copy + recovery action.
- [ ] **Populated** — real-looking content, no lorem, no placeholder counts.
- [ ] Any screen-specific states (analysing, publishing, syncing) demoable via the state switcher.

## 5. AI UX
- [ ] Agent surface labelled (which agent) + AgentStatusIndicator state correct (idle/thinking/streaming/awaiting-approval).
- [ ] Streaming/determinate progress where the agent is non-instant; non-durable agents show retry, not resumable stream.
- [ ] HITL approvals go through ApprovalCard/EvidenceBlock with confidence + evidence + before/after.
- [ ] AI copy follows `AI-UX.md` tone (explain the why, no magic-box claims).

## 6. Motion
- [ ] Every animation communicates a state change (no ambient motion) — `ANIMATIONS.md` timings/easing.
- [ ] `prefers-reduced-motion` respected (skeletons + transitions disabled).
- [ ] No layout shift on hover; no re-render restart on CSS-only transitions.

## 7. Responsive — mobile @390
- [ ] Left rail hidden; bottom tab bar shown; **0 horizontal overflow** (`scrollWidth == clientWidth`).
- [ ] Multi-col grids collapse to 1–2 col; bulk bars `flex-wrap`.
- [ ] Modals/sheets go `inset:0` + `max-width:100%`; close control reachable.
- [ ] Hit targets ≥ 44px.

## 8. Responsive — tablet 768–1024 (`MOBILE-PLAN.md §18`)
- [ ] Portrait 768–834 = mobile-plus (2-col, sheet retained); landscape 835–1024 = collapsed rail + inline panel.
- [ ] No dead zone / broken 3-col at this band.

## 9. Accessibility
- [ ] Logical heading order; landmarks (`nav`/`main`/`aside`) present.
- [ ] All icon-only buttons have `aria-label` + `title` tooltip (`PATTERNS.md` tooltip).
- [ ] Focus visible; modal/sheet focus-trap **specified** for React (`ACCESSIBILITY.md`) even if CSS-only in DC.
- [ ] Live regions specified for toasts/streaming (`aria-live`).
- [ ] Color is never the only signal (icon/label too).

## 10. Technical / console
- [ ] **Zero console errors/warnings** on load and through the primary flow.
- [ ] No unresolved template holes (no `{{ }}` visible, no placeholder flashes stuck).
- [ ] All nav links + buttons work (no dead controls); dev-only affordances gated (`?dev=1`).
- [ ] Images load (real Cloudinary/placeholder), correct ratio, no broken refs.

## 11. Sign-off
- [ ] Verified live (loaded in preview, stepped through states + mobile) — screenshot attached.
- [ ] `DESIGN-TASKS.md §0` row updated to 🟢 / Design 100%.
- [ ] `changelog.md` entry added.

---

**Definition of Design-100%:** build + all states + mobile @390 + tablet band + reuse (shell/tokens/components) + a11y specced + zero console errors + a live verified pass. Anything short = 🟡.
