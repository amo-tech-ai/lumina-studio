# Cursor Audit Prompt — Planner Data Model & Supabase Architecture Review

Review the existing iPix/FashionOS codebase, Supabase schema, migrations, PRDs, Linear tasks, and planner documentation before making any recommendations.

**Do not design new features first.**
First understand what already exists.

## Objectives

Perform a deep audit of the Planner backend architecture and create a technical document that Claude Design can use as the source of truth when designing the Planner UI.

---

# Phase 1 — Current State Audit

Identify everything that already exists.

Review:

- Supabase migrations
- Database schema
- Tables
- Views
- RPCs
- Edge Functions
- RLS policies
- Realtime
- Storage
- Existing planner-related code
- Existing planner tasks
- Existing documentation
- Existing AI agents
- Existing workflows
- Existing notification system

For every object determine:

- Exists
- Partial
- Missing
- Deprecated

---

# Phase 2 — Planner Data Model

Determine whether the current schema supports the Planner.

Audit for tables such as:

- planner_instances
- planner_templates
- planner_phases
- planner_tasks
- planner_dependencies
- planner_assignments
- planner_members
- planner_comments
- planner_activity
- planner_notifications
- planner_views
- planner_labels
- planner_custom_fields
- planner_history
- planner_ai_runs
- planner_ai_drafts

If equivalent tables already exist elsewhere, recommend reuse instead of creating duplicates.

---

# Phase 3 — Relationship Diagram

Document relationships including:

Organizations

↓

Brands

↓

Shoots

↓

Planner Instances

↓

Phases

↓

Tasks

↓

Assignments

↓

Approvals

↓

Notifications

↓

Activity

Create Mermaid ER diagrams.

---

# Phase 4 — Supabase Architecture

Document:

- table ownership
- foreign keys
- indexes
- constraints
- cascade rules
- soft deletes
- audit tables
- versioning
- optimistic locking

Identify missing indexes and performance risks.

---

# Phase 5 — Security Audit

Review:

- RLS
- organization isolation
- planner permissions
- role permissions
- client access
- producer access
- admin access

Create a complete permission matrix.

---

# Phase 6 — API Layer

Document required:

- RPCs
- Edge Functions
- Server Actions
- REST endpoints
- Realtime channels

For each API include:

- purpose
- inputs
- outputs
- permissions
- errors

---

# Phase 7 — AI Integration

Review existing:

- Mastra agents
- CopilotKit
- production-planner agent
- AI tools
- HITL approvals

Determine:

- what already exists
- what should be reused
- what is missing

Recommend planner tools such as:

- buildSchedule
- optimizeTimeline
- detectRisks
- shiftTimeline
- assignTasks
- summarizePlan
- explainDelay
- estimateCompletion

No duplicate AI architecture.

---

# Phase 8 — Realtime

Review support for:

- Supabase Realtime
- Presence
- Broadcast
- optimistic updates
- offline sync
- conflict resolution

Recommend best practices.

---

# Phase 9 — Notifications

Audit:

- existing notification tables
- notification workflows
- queues
- triggers

Determine how Planner should integrate without duplication.

---

# Phase 10 — Performance

Review scalability for:

- 10,000+ tasks
- multiple planners
- concurrent users
- virtual scrolling
- pagination
- indexing
- caching

Identify bottlenecks.

---

# Phase 11 — Production Readiness

Generate:

## Architecture Score (/100)

## Database Score (/100)

## Security Score (/100)

## Performance Score (/100)

## Realtime Score (/100)

## AI Integration Score (/100)

## Production Readiness (/100)

---

# Deliverables

Produce a document named:

planner-backend-architecture.md

Include:

1. Executive Summary
2. Current Architecture
3. Existing Supabase Objects
4. Planner Data Model
5. Database ER Diagram (Mermaid)
6. Planner Schema Diagram (Mermaid)
7. API Architecture Diagram
8. Realtime Architecture
9. AI Architecture
10. Notification Architecture
11. Security Model
12. Permission Matrix
13. Required Tables
14. Required RPCs
15. Required Edge Functions
16. Required AI Tools
17. Missing Components
18. Critical Risks
19. Recommendations
20. Implementation Roadmap

---

# Rules

- Reuse before creating.
- Do not duplicate existing tables or APIs.
- Verify everything against the actual codebase and Supabase schema.
- Clearly distinguish **Existing**, **Needs Modification**, and **New**.
- Flag stale documentation or Linear tasks.
- Use Mermaid diagrams throughout.
- Make this document the canonical backend reference for Claude Design before any planner UI implementation.