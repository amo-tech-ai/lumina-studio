---
name: design-md
description: >
  Canonical UI/UX contract for iPix — read before Claude Design sessions, wireframes,
  Figma handoff, or operator screen implementation. Routes to design.md (how it looks)
  between PRD (what) and tasks/plan/todo.md (how to build). Use for screen specs,
  design review, 3-panel layout, HITL states, component reuse, motion, and accessibility gates.
version: 1.0.0
---

# design-md — Claude Design entry skill

**Read first:** [`design.md`](../../design.md) at repo root.

## When to use

- Designing or porting any `/app/*` operator screen
- Converting Claude DC HTML → Next.js React (no Figma)
- Reviewing prototypes against HITL + 3-panel contract
- Before flipping a DESIGN-* task to done

## Read order

1. [`design.md`](../../design.md) — principles, contract, checklist
2. [`tasks/docs/handoff/handoff.md`](../../tasks/docs/handoff/handoff.md) — screen SSOT
3. Screen row in [`02-screen-map.md`](../../tasks/docs/handoff/02-screen-map.md)
4. [`COMPONENT-LIBRARY.md`](../../tasks/docs/design/COMPONENT-LIBRARY.md)
5. [`SCREEN-TEMPLATE.md`](../../tasks/docs/design/SCREEN-TEMPLATE.md) — copy for new specs
6. Production: [`app/src/styles/tokens.css`](../../app/src/styles/tokens.css) · [`design-system-rules.md`](../../app/src/styles/design-system-rules.md)

## Do not

- Invent a parallel design architecture
- Replace PRD, MVP, or Mastra/CopilotKit specs
- Use floating/full-screen AI unless mobile sheet pattern
- Skip required states (empty, loading, error, HITL)

## Sibling skills

| Need | Skill |
|------|-------|
| Production UI code | [`frontend-design`](../frontend-design/SKILL.md) |
| Lo-fi wireframes | [`ipix-wireframe`](../ipix-wireframe/SKILL.md) |
| WCAG audit | [`accessibility`](../accessibility/SKILL.md) |
| Multi-file feature | [`feature-dev`](../feature-dev/SKILL.md) |
| Build execution | [`ipix-task-lifecycle`](../ipix-task-lifecycle/SKILL.md) |

## Verification

- [`DESIGN-REVIEW-CHECKLIST.md`](../../tasks/docs/design/DESIGN-REVIEW-CHECKLIST.md)
- [`Universal design prompt/checklist.md`](../../Universal%20design%20prompt/checklist.md)
- Task: **DESIGN-090** in [`tasks/docs/plan/TASKS.md`](../../tasks/docs/plan/TASKS.md)
