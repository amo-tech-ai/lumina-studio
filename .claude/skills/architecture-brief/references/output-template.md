# Architecture brief — output template

Use the sections the ask actually calls for. None of these are mandatory in isolation — a small
feature brief might only need Executive Summary, Architecture, Risks, and Roadmap. Don't pad a
brief with empty sections just to match this list.

```markdown
# [Project/Feature Name] — Architecture Brief

**Goal:** [one sentence — what's being built and for whom]
**Scope:** MVP-now: [...] · Later: [...] · Not now: [...]
**Production-ready means (for this ask):** [which of secure/scalable/tested/monitored apply, and why]

## Executive Summary
2-4 sentences: what this is, why it's being built, the single highest-leverage decision in this
brief (the thing most likely to be second-guessed later).

## Risks (read this before the design below)
| Risk | Reversibility | Mitigation |
|---|---|---|
| [schema change / auth flow / secret handling / etc.] | [easy / hard / one-way] | [...] |

## Architecture
High-level shape: what's new vs. reused (per graphify + existing-code check in Step 1). Reference
existing patterns by file path, not by description.

## User Flows
The 1-3 flows that matter — as numbered steps or a short flow diagram (see Mermaid Diagrams
below), not an exhaustive flowchart of every branch.

## Database
Owned by `ipix-supabase` — schema, RLS policies, migration shape. Reference or embed its output;
don't hand-design SQL from scratch here. Every new table needs an RLS policy named in this
section, not deferred to "later."

## Frontend
Owned by `frontend-design` (production surfaces) or `ipix-wireframe` (early/lo-fi). Note which
existing components in `app/src/components/` are reused vs. net-new.

## Backend / APIs
Existing `app/src/app/api/` conventions and `AGENTS.md`'s backend section. New routes should match
an existing route's shape unless there's a stated reason not to.

## AI Agents / Workflows
Owned by `mastra` — which existing agent(s) this extends vs. a genuinely new agent, and why a new
one is warranted (reuse is the default per Step 3).

## Mermaid Diagrams
Owned by `mermaid-diagrams` — use its syntax reference rather than hand-rolling diagram syntax
here.

## Implementation Roadmap
A pointer, not a task list: "Next: `writing-plans` produces the task-by-task plan from this brief"
(or `ipix-task-lifecycle` Phase 1 for IPI-tracked work). Optionally name the 2-4 major milestones
this will land in, not individual tasks.

## Later / Not Now
Explicit list of things deliberately excluded from this brief's scope, and why. This is the
over-engineering guard from Step 4 — if it's not in MVP-now and not here, it got missed, not
deferred on purpose.

## Recommendations
1-3 calls the reader needs to make before implementation starts (not a restatement of the brief).

## Verification
How each "production-ready" claim above gets checked — typecheck/test commands, manual QA steps,
which hard-to-reverse actions need a confirm-before-proceeding gate.
```
