# Planner Task Efficiency Review Prompt

Review the tasks
 review every related live Linear Planner task.

## Objective

Determine whether the current task plan is the **simplest, safest, and most efficient** way to convert the approved HTML designs into production-ready React/Next.js pages.

Do not assume the document is correct. Verify everything.

---

## Phase 1 — Review the document

Understand:

* overall implementation strategy
* task order
* dependencies
* architecture
* vertical-slice approach
* reuse strategy
* testing strategy
* responsive strategy
* accessibility strategy
* AI/HITL strategy
* data flow
* mutation flow

Identify contradictions, unnecessary complexity, duplicated work, or missing steps.

---

## Phase 2 — Review every Linear task

For each task:
 
* verify dependencies
* verify scope
* verify acceptance criteria
* verify build order
* verify implementation approach
* verify testing requirements

Determine if the task should be:

* ✅ Keep
* ✏️ Edit
* 🔀 Merge
* ❌ Cancel
* ⏸ Defer

---

## Phase 3 — Evaluate efficiency

For every task answer:

* Is this the simplest solution?
* Can it be completed with fewer steps?
* Is there duplicated work?
* Can existing components be reused?
* Is the task too large?
* Is the task too small?
* Does it introduce unnecessary abstraction?
* Does it reduce future maintenance?
* Will it reduce bugs?
* Is it easy for a new developer to understand?
* Does it follow current Next.js, React and Supabase best practices?

Always recommend the **simplest proven approach**.

Avoid:

* unnecessary infrastructure
* premature abstractions
* duplicate components
* duplicate hooks
* duplicate services
* unnecessary state management
* unnecessary repository layers

---

## Phase 4 — HTML → React evaluation

Assume every Planner page starts as an approved HTML design.

Verify the process is:

```
Verify
→ Reuse
→ Route
→ Read-only UI
→ Real data
→ Loading/Empty/Error states
→ Safe mutations
→ Responsive
→ Accessibility
→ Browser verification
```

If a better workflow exists, recommend it and explain why.

---

## Phase 5 — Research

Verify against current official documentation and best practices for:

* Next.js App Router
* React
* Supabase
* Server Components
* Server Actions
* RLS
* Accessibility
* Responsive UI
* Testing
* HTML → React migration

Recommend only mature, proven patterns.

---

## Phase 6 — Audit each task

For every task produce:

| Task | Score | Issues | Best Improvement | Keep/Edit/Merge/Cancel | Safe? |
| ---- | ----: | ------ | ---------------- | ---------------------- | ----- |

Include:

* errors
* red flags
* blockers
* failure points
* duplicated work
* missing requirements
* unnecessary complexity
* security concerns
* testing gaps
* performance concerns

---

## Phase 7 — Improve the implementation plan

Suggest:

* better task ordering
* simpler dependencies
* opportunities to merge tasks
* opportunities to split oversized tasks
* reusable components
* reusable patterns
* reusable layouts
* reusable mutations
* reusable testing

Goal:

* fewer PRs
* fewer merge conflicts
* less duplicated code
* easier reviews
* fewer bugs
* faster development

---

## Final Report

Provide:

1. Executive Summary
2. Overall Efficiency Score (/100)
3. Simplicity Score (/100)
4. Production Readiness (/100)
5. Maintainability (/100)
6. Developer Experience (/100)

Then list:

* Top 10 improvements
* Tasks to edit
* Tasks to merge
* Tasks to cancel
* Tasks to simplify
* Recommended implementation order
* Final optimized task roadmap

Prioritize **clarity, simplicity, reuse, maintainability, and the lowest opportunity for implementation errors**. Recommend only solutions that are proven in production and easy for any developer to follow.
