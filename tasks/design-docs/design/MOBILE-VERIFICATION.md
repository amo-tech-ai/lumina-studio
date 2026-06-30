---
title: Mobile Verification — Pass/Fail Matrix
version: "1.0"
lastUpdated: "2026-06-30"
ssot: checklist.md §13 · DESIGN-TASKS §0
linear: IPI-264
---

# Mobile Verification — Measurable QA Pass

> **Purpose:** Final design→React verification at mobile breakpoints. Verification and refinement only — **no redesign**.

**Linear:** [IPI-264 · Mobile Verification Pass/Fail Matrix](https://linear.app/amo100/issue/IPI-264)

---

## Breakpoints (required)

| Viewport | Device class | Must pass |
|----------|--------------|-----------|
| **390px** | iPhone 14 / standard phone | ✅ |
| **430px** | Large phone | ✅ |
| **768px** | Tablet portrait | ✅ |
| **1024px** | Tablet landscape / shell breakpoint | ✅ |

Shell rule: `max-width: 1024px` → BottomNavigation + BottomSheet (see `handoff/12-production-handoff.md`).

---

## Per-screen pass/fail matrix

For each of **11 screens** + **20 shared components** (EvidenceBlock on 5):

| Check | Pass criteria |
|-------|---------------|
| **Layout** | Matches desktop design intent; no horizontal scroll |
| **Navigation** | Bottom nav visible; More sheet works; no dead tabs |
| **Components** | Cards, modals, sheets render; no clipped images |
| **AI** | Dock pinned; never covers CTAs; contextual greeting |
| **States** | empty · loading · error · success · AI thinking · approval · offline (if designed) |
| **Accessibility** | Touch targets ≥44px; focus visible; sheet focus trap |
| **Mobile** | Safe areas (notch, home indicator, dynamic island) |
| **Console** | Zero errors on load + primary interaction |

Mark each cell: ✅ Pass · 🔴 Critical · 🟡 Major · ⚪ Minor · 🟢 Verified

---

## Acceptance checklist (global)

- [ ] Layout matches desktop design intent
- [ ] No overflow / horizontal scroll
- [ ] No clipped images or overlapping elements
- [ ] Touch targets ≥44px
- [ ] Bottom navigation always visible (panel screens)
- [ ] Chat dock never covers primary content or CTAs
- [ ] Bottom sheets fully usable (3 detents, drag, dismiss)
- [ ] No console errors

---

## States (every screen)

Verify **all** designed states — not just populated default:

| State | Verify |
|-------|--------|
| Empty | CTA + guidance |
| Loading | Skeleton ≥300ms, no layout jump |
| Error | Retry + message |
| Success | Confirmation visible |
| AI thinking | Streaming indicator |
| Approval | HITL gate blocks silent writes |
| Offline | Graceful (if designed) |

---

## User journeys (end-to-end)

| Journey | Route flow |
|---------|------------|
| Onboarding → Command Center | `/app/onboarding` → `/app` |
| Brand → Shoot | Brand Detail → Plan shoot → Wizard |
| Shoot → Assets | Shoot Detail → View Assets (filtered) |
| Assets → Campaign | Selection / drag dock |
| Campaign → Channel Preview | Readiness → publish |
| Matching → Invite | Save/Invite + shortlist |

---

## Safe areas & orientation

- [ ] iPhone bottom safe area + home indicator spacing
- [ ] Notch / Dynamic Island — no clipped headers
- [ ] **Portrait** and **landscape** (wizard, preview frames)

---

## Gesture conflicts

Verify no conflict between:

- BottomSheet drag vs page scroll
- Swipe (Matching deck) vs scroll
- Long-press select vs tap open
- Drag selection vs card click

---

## Keyboard

Verify keyboard never hides on:

- Search inputs
- AI chat input
- Wizard / onboarding forms

Must remain visible: primary buttons, bottom nav, chat dock.

---

## Performance (visual)

- [ ] Skeletons appear before content
- [ ] Images lazy-load / blur-up
- [ ] No layout shift (CLS ≈ 0)
- [ ] No flicker on state change
- [ ] Animations smooth at 60fps

---

## Severity (findings)

| Level | Action |
|-------|--------|
| 🔴 Critical | Blocks ship — fix before ⭐ |
| 🟡 Major | Fix in current milestone |
| ⚪ Minor | Backlog / waiver documented |
| 🟢 Verified | Pass with evidence screenshot |

---

## Exit criteria (audit complete)

- [ ] 🟢 All 11 screens verified at 4 breakpoints
- [ ] 🟢 All 20 components spot-checked on mobile
- [ ] 🟢 All 6 user journeys pass
- [ ] 🟢 All required states verified
- [ ] 🟢 Zero 🔴 Critical · zero 🟡 Major mobile regressions
- [ ] 🟢 Documentation updated (`DESIGN-TASKS.md` §0 · `checklist.md` · changelog)
- [ ] 🟢 Mobile Verification Report published with pass/fail matrix

---

## Evidence output

Save to: `docs/ecommerce/evidence/YYYY-MM-DD/mobile-verification/`

Per screen: `{screen-slug}-{390|430|768|1024}.png` + matrix row in report md.
