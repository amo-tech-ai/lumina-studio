# Linear Task Template — Design-Driven Tasks

**When to use:** generating Linear tasks from a design handoff analysis.

---

## Standard 8-task set per design screen

Create these tasks in order for each new design implementation. Assign to the same Linear project.

---

### T1 — Design Analysis

**Title:** `[Screen] — Design analysis + component mapping`  
**Type:** `spike` + `frontend`  
**Labels:** `D-TRACK`, `spike`  

```markdown
## Context
Analyze the [Screen Name] design and produce a structured
handoff spec before any implementation begins.

**Design source:** [design file path or URL]
**Claude Design project:** https://claude.ai/design/p/[id] (if applicable)

## Problem
We have a design spec but no structured analysis of what components exist vs need
building. Without this, implementation will duplicate existing components or miss design intent.

## Proposal
Run the `claude-design-handoff` skill: intake the design, produce a structured spec,
compare to existing components, identify reuse/extend/new split.

## Acceptance Criteria
- [ ] Design analysis doc saved to `docs/design/handoff-[screen]-[date].md`
- [ ] All components classified as Phase A (reuse) / B (extend) / C (new)
- [ ] Design system validation checklist run; all 🔴 violations resolved before T4

## Verification
- `docs/design/handoff-*.md` file exists and has all required sections
- Component inventory table complete
- No unresolved 🔴 violations

## Out of Scope
- Implementation (T4)
- Test writing (T6)
```

---

### T2 — Component Mapping

**Title:** `[Screen] — Map design elements to iPix stack`  
**Type:** `spike` + `frontend`  
**Labels:** `D-TRACK`, `spike`  

```markdown
## Context
Map every design element from the [Screen Name] to the correct iPix target:
Next.js 16, React 19, Tailwind v4, shadcn/ui, CopilotKit 1.61.0, Mastra, Supabase.

## Problem
Without a mapping table, engineers will build components that already exist or
use the wrong tech (raw HTML forms, hardcoded colors, wrong CopilotKit version).

## Proposal
For each design element: lookup existing component, decide reuse/extend/new,
document in the handoff spec. Produce the Phase A/B/C implementation plan.

## Acceptance Criteria
- [ ] Every design element in the inventory table has a mapped iPix target
- [ ] Phase A/B/C plan written in `docs/design/plan-[screen]-[date].md`
- [ ] No net-new component proposed where an existing one covers the need

## Verification
- `docs/design/plan-*.md` exists with Phase A, B, C sections
- At least 1 Phase A (reuse) item identified
```

---

### T3 — Design Tokens / Design System Check

**Title:** `[Screen] — Design system validation + token audit`  
**Type:** `chore` + `frontend`  
**Labels:** `D-TRACK`, `chore`  

```markdown
## Context
Before implementation, verify the design against app/DESIGN.md, CLAUDE.md, and app/design/todo.md.
Catch token gaps, color rule violations, and out-of-scope items before code is written.

## Problem
Hardcoded colors, missing design tokens, and scope creep (building ✅ Recently done items)
are easier to catch in design review than in code review.

## Proposal
Run the design system validation checklist from the `claude-design-handoff` skill.
Document any new tokens needed and get decisions on ambiguous items.

## Acceptance Criteria
- [ ] `checklists/design-system-validation.md` checklist complete; zero 🔴 violations
- [ ] All new design tokens mapped to tokens.css equivalents or added as named tokens
- [ ] Route status confirmed in app/design/todo.md (not ✅ Recently done)
- [ ] HITL gates identified for any AI write actions

## Verification
- Checklist saved with sign-off in design analysis doc
- No hardcoded color values in the component spec
```

---

### T4 — UI Components

**Title:** `[Screen] — Implement [component names]`  
**Type:** `feature` + `frontend`  
**Labels:** `D-TRACK`, `feature`, `frontend`  
**Depends on:** T1, T2, T3  

```markdown
## Context
Implement the [Screen Name] UI following the Phase A/B/C plan from T2.
Design source: [design file path]

## Problem
[What is missing / not built yet]

## Proposal
Phase A: reuse [list]. Phase B: extend [list]. Phase C: build [list].
Follow code generation rules from `claude-design-handoff/references/code-generation.md`.

## Acceptance Criteria
- [ ] All Phase A components wired (zero new code for those)
- [ ] All Phase B components extended (prop/variant added, tests updated)
- [ ] All Phase C components built to design spec
- [ ] `data-testid` on every interactive element
- [ ] No hardcoded colors — semantic tokens from tokens.css only
- [ ] iPix orange (#E87C4D) used sparingly for primary actions only
- [ ] Warm off-white (#FBF8F5) background, never pure white
- [ ] Geist Mono for all numbers/data values
- [ ] 3-panel shell present: NavSidebar · Workspace · IntelligencePanel
- [ ] All five states designed: populated, loading, empty, error, approval-pending

## Verification
Browser screenshot of surface at correct URL
Console: zero errors
`npm run typecheck` exits 0
```

---

### T5 — State Management

**Title:** `[Screen] — State, interactions, and data flow`  
**Type:** `feature` + `frontend`  
**Labels:** `D-TRACK`, `feature`  
**Depends on:** T4  

```markdown
## Context
Wire up state transitions, API calls, and data flow for [Screen Name].

## Acceptance Criteria
- [ ] All state transitions in the interaction table work correctly
- [ ] Loading states shown during async operations (Skeleton layouts match populated)
- [ ] Error states handled with user-facing message + retry option
- [ ] HITL approval card wired for AI write actions (amber border + bg, confidence %)
- [ ] IntelligencePanel updates with context, approvals, evidence, activity

## Verification
Manual flow through all states; screenshot of each state
```

---

### T6 — Tests

**Title:** `[Screen] — Vitest unit tests + Playwright e2e`  
**Type:** `chore` + `frontend`  
**Labels:** `D-TRACK`, `chore`  
**Depends on:** T4, T5  

```markdown
## Context
Write Vitest unit tests for all new components and Playwright e2e for the golden path.

## Acceptance Criteria
- [ ] `npm test -- --run` exits 0 (no regression)
- [ ] New components: ≥ 2 Vitest tests each
- [ ] Golden path tested in Playwright (happy path + error state)
- [ ] All `data-testid` elements covered in tests
- [ ] HITL approval flow tested (pending → approved/rejected)

## Verification
`npm test -- --run` output showing test count did not decrease
```

---

### T7 — Accessibility

**Title:** `[Screen] — a11y pass`  
**Type:** `chore` + `frontend`  
**Labels:** `D-TRACK`, `chore`  
**Depends on:** T4  

```markdown
## Context
Ensure [Screen Name] meets WCAG AA and the iPix accessibility standards.

## Acceptance Criteria
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] `prefers-reduced-motion` honored on all animations (tokens.css handles this)
- [ ] All text ≥ 4.5:1 contrast
- [ ] ARIA attributes complete (progress bar, icon buttons, modals)
- [ ] Screen reader announces state changes via `aria-live`
- [ ] Touch targets ≥ 44px on mobile

## Verification
Manual keyboard walkthrough. axe DevTools scan shows 0 critical issues.
```

---

### T8 — Production Verification

**Title:** `[Screen] — Production proof + typecheck + test gate`  
**Type:** `chore`  
**Labels:** `D-TRACK`, `chore`  
**Depends on:** T6, T7  

```markdown
## Context
Final gate before marking the screen Done. Must produce evidence matching the merge gate.

## Acceptance Criteria
- [ ] `npm run typecheck` exits 0
- [ ] `npm test` exits 0
- [ ] Browser screenshot at correct URL (design vs implementation comparison)
- [ ] Console: zero errors
- [ ] `npm run dev` boots clean
- [ ] PR body includes all evidence links

## Verification
Screenshot + terminal output attached to PR
```
