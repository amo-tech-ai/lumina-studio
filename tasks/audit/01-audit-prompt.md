````markdown
# Cursor Task — Forensic Audit of All Tasks

Do not implement features yet. This is an audit and correction pass only.

## Role

Act as a:

- Senior Software Specialist
- Forensic Auditor
- Product Architect
- QA Lead
- Production Readiness Reviewer

## Goal

Audit all current project tasks and verify whether each task is correct, complete, feasible, production-ready, and aligned with the latest FashionOS/iPix design and implementation plans.

You must identify:

- errors
- stale tasks
- duplicate tasks
- missing dependencies
- missing owners
- missing verification
- blockers
- red flags
- production risks
- tasks that will fail
- tasks that need correction
- missing tasks

## Read first

Review all task and planning sources:

- `tasks/todo.md`
- `tasks/intelligence/ai/MASTER-DEPENDENCIES.md`
- `tasks/intelligence/ai/LINEAR-ISSUE-FOOTER.md`
- `tasks/intelligence/ai/skill-map.md`
- `tasks/intelligence/ai/task-stack-map.md`
- `tasks/intelligence/ai/mcp-plan.md`
- `tasks/intelligence/plans/copilotkit-plan.md`
- `tasks/intelligence/plans/mastra-plan.md`
- `tasks/intelligence/plans/gemini-plan.md`
- `tasks/intelligence/plans/supabase-plan.md`
- `design-docs/design/DESIGN-TASKS.md`
- `design-docs/handoff/11-screen-checklists.md`
- `design-docs/design/SCREEN-DOD.md`
- Linear issue markdown files if present
- Current `app/` code structure

## Audit every task

For each task, check:

```text
Task ID
Task title
Current status
Correct status?
Task type
Owner needed?
Priority correct?
Dependencies correct?
Blocked by correct?
Blocks correct?
Required stack correct?
Required skills correct?
Required MCP correct?
Acceptance criteria complete?
Verification complete?
Production ready?
Will this task succeed as written?
Corrections needed
````

## Required grading system

Use this grading system:

|                        Score | Grade | Dot |
| ---------------------------: | :---: | :-: |
|                       95–100 |   A+  |  🟢 |
|                        90–94 |   A   |  🟢 |
|                        80–89 |   B   |  🟡 |
|                        70–79 |   C   |  🟠 |
|                     Below 70 |   D   |  🔴 |
| Not started / not applicable |   —   |  ⚪  |

## For each task output

Use this format:

```markdown
### IPI-XXX · TASK-ID — Full Task Name

Status: 🟢 / 🟡 / 🔴 / ⚪
Score: __/100
Production ready: Yes / No
Will succeed as written: Yes / No / Risky

Issues:
- ...

Corrections:
- ...

Required before starting:
- ...

Verification required:
- Browser
- Playwright
- Visual QA
- Task Verifier
- Supabase Verify
- Console clean
```

## Audit categories

Group the report by:

1. P0 blockers
2. Design V2 / React parity
3. CopilotKit v2
4. Mastra
5. Gemini
6. Supabase
7. Cloudinary / media
8. AI Intelligence
9. Assets
10. Campaigns
11. Matching
12. Shoot Detail / Shoot Wizard
13. Mobile QA
14. Accessibility
15. Playwright / QA
16. Documentation-only tasks

## Critical checks

Verify these specific areas carefully:

* `IPI-209` Shoot Detail
* `IPI-246` EvidenceBlock React port
* `IPI-243` IntelligencePanel
* `IPI-247` Route-Agent Map
* `IPI-255` Live intelligence data
* `IPI-257` Cloudinary pipeline
* `IPI-248` Assets
* `IPI-249` Campaigns
* `IPI-250` Matching
* `IPI-264` Mobile QA
* `IPI-47` Gemini foundation
* `IPI-107` model registry
* `IPI-268` campaigns/matching schema
* any task marked Done but not verified
* any task marked In Progress but code already exists
* any task with missing dependencies
* any task with no verification plan

## Identify red flags

Find and report:

* stale statuses
* duplicate work
* wrong task ownership
* missing Linear links
* missing `blockedBy`
* missing `Blocks`
* missing skill/MCP footer
* tasks that mix design + code + backend
* tasks missing production acceptance criteria
* tasks that cannot be completed because dependencies are missing
* tasks that should be split
* tasks that should be merged
* tasks that should be archived

## Production readiness review

For every major task, answer:

```text
Can this ship to production?
What blocks production?
What proof is required?
What tests are required?
What evidence file should exist?
```

## Best-practice review

Check against:

* reuse shared components
* no duplicate components
* one concern per PR
* no client AI keys
* Supabase RLS
* route-agent correctness
* HITL approval before AI writes
* mobile accessibility
* keyboard accessibility
* Playwright proof
* browser console clean
* design parity with Claude Design
* task verifier evidence

## Output files to create/update

Create:

```text
tasks/audit/full-task-audit-2026-06-30.md
tasks/audit/task-corrections-2026-06-30.md
tasks/audit/task-scorecard-2026-06-30.md
```

Update if needed:

```text
tasks/todo.md
tasks/intelligence/ai/MASTER-DEPENDENCIES.md
```

Do not update Linear yet. Only recommend Linear changes unless explicitly approved.

## Final report must include

* Executive summary
* Overall score `/100`
* P0 blockers
* Red flags
* Missing tasks
* Duplicate tasks
* Stale statuses
* Tasks likely to fail
* Production-readiness gaps
* Corrections per task
* Recommended execution order
* Required Linear updates
* Required docs updates
* Final scorecard
* “Can this plan succeed?” answer

## Final answer format

End with:

```text
Overall audit score: __/100
Task accuracy: __/100
Production readiness: __/100
Execution readiness: __/100

Can the plan succeed?
Yes / No / Yes, if corrections are applied.
```

```
```
