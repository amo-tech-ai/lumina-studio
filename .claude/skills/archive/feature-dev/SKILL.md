---
name: feature-dev
description: >
  Guided multi-file feature development with codebase exploration, architecture
  design, and quality review. Use whenever the user says build a feature, implement
  functionality, add a module, /feature-dev, architectural decisions, multi-file
  changes, complex integration, or greenfield code that spans UI + API + database.
  For iPix Linear tasks (IPI-/PLT-/UI-), prefer ipix-task-lifecycle hub first — this
  skill is the Phase 3 deep-dive when scope is large or architecture is unclear.
version: "1.1.0"
---

# Feature Development Workflow

Seven-phase workflow: discover → explore codebase → clarify → design → implement → review → summarize. **Do not jump to code.**

**iPix:** Load [ipix-task-lifecycle](../../../.claude/skills/ipix-task-lifecycle/SKILL.md) for Linear gates, verify commands, and ship checklist. Use this skill inside Phase 3 when the change is non-trivial (see routing below).

---

## When to use

| Use | Skip |
|-----|------|
| Multi-file feature (hooks + pages + edge fn) | Single-line bugfix |
| Architectural fork (patterns others will copy) | Trivial rename |
| Unclear integration points | Urgent hotfix with known fix |
| `/feature-dev` or explicit architecture ask | Linear issue with full wiring plan + ≤5 files |

---

## The 7 phases

### 1 — Discovery
Clarify request, constraints, success criteria. Confirm with user.

### 2 — Codebase exploration
Use explore subagent or semantic search. Read similar features and abstractions.

**Ref:** [references/code-explorer.md](references/code-explorer.md)

### 3 — Clarifying questions
Edge cases, errors, integration, performance. **Wait for answers** before design.

### 4 — Architecture design
Compare approaches; recommend one; get approval.

**Ref:** [references/code-architect.md](references/code-architect.md)

### 5 — Implementation
Read all relevant files first. Match conventions. Track with todos.

**iPix:** `npm run build` before handoff to [ipix-task-lifecycle testing phase](../../../.claude/skills/ipix-task-lifecycle/testing.md).

### 6 — Quality review
Review for bugs, scope creep, missing states.

**Ref:** [references/code-reviewer.md](references/code-reviewer.md)

### 7 — Summary
What shipped, decisions, files touched, next steps / Linear update.

---

## iPix routing (with ipix-task-lifecycle)

```
Linear IPI issue with A–E steps + wiring plan
  └─ ipix-task-lifecycle Phase 3 (implementation.md) — default

Large / ambiguous multi-file (no wiring plan yet)
  └─ feature-dev phases 1–4 → writing-plans → lifecycle Phase 3

Architecture fork (new pattern for dashboard, edge fn, RLS)
  └─ feature-dev phase 4 → user approval → implement

Post-implementation review before ship
  └─ feature-dev phase 6 OR task-verifier for task specs
```

---

## Reference index

| File | Contents |
|------|----------|
| [references/code-explorer.md](references/code-explorer.md) | Exploration prompts |
| [references/code-architect.md](references/code-architect.md) | Design blueprints |
| [references/code-reviewer.md](references/code-reviewer.md) | Review checklist |
| [references/feature-development.md](references/feature-development.md) | Full phase playbook |
