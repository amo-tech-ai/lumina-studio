# OpenCode Prompt — Full Supabase, AI Agents, EventOS and Application Architecture Audit

Act as a **senior Supabase architect, PostgreSQL security auditor, AI-agent engineer, and full-stack systems detective**.

## Project context

* Repository: `amo-tech-ai/lumina-studio`
* Supabase project ref: `nvdlhrodvevgwdsneplk`
* Architecture includes:

  * Supabase PostgreSQL, Auth, RLS, RPCs, Realtime and Edge Functions
  * Next.js frontend and backend
  * Mastra agents, workflows, memory and scheduling
  * Cloudflare Workers
  * Event management
  * Shoot production
  * Planner workflows
  * CRM
  * Chat and AI agents
  * Automations and wizards
  * Dashboards
  * Bookings and Stripe payments

Use the available skills and MCP tools, especially:

* `ipix-supabase`
* `task-verifier`
* Supabase MCP
* GitHub/repository inspection
* Official-document web research

## Non-negotiable safety rules

1. Begin in **read-only audit mode**.
2. Do not deploy, delete, push migrations, change RLS, reset databases or modify production data.
3. Never run:

   * `supabase db reset --linked`
   * migration repair when drift is zero
   * broad Edge Function `--prune`
4. Do not expose secrets or customer data.
5. Clearly distinguish:

   * verified live facts;
   * repository evidence;
   * assumptions;
   * recommendations.
6. Verify technical recommendations using current official documentation:

   * Supabase
   * PostgreSQL
   * Mastra
   * Cloudflare
   * Stripe
   * GitHub Actions

---

# Phase 1 — Establish the live baseline

Use Supabase MCP and repository files to inventory:

* schemas;
* tables;
* views and materialized views;
* columns and data types;
* primary keys;
* foreign keys;
* unique constraints;
* check constraints;
* indexes;
* RLS status;
* policies;
* grants;
* functions and RPCs;
* triggers;
* Realtime publications;
* storage buckets;
* Edge Functions;
* migration ledger;
* database extensions;
* cron jobs and scheduled tasks.

Compare:

1. Live Supabase
2. `supabase/migrations`
3. generated TypeScript types
4. application queries and RPC calls
5. existing documentation

Identify drift, missing source files, duplicate concepts and stale documentation.

Output:

* live inventory;
* repo-versus-live differences;
* critical inconsistencies;
* confidence level for each finding.

---

# Phase 2 — Schema and relationship audit

Audit every major domain:

* organizations and users;
* events;
* event phases and tasks;
* venues and availability;
* registrations and ticketing;
* sponsors;
* models, designers and stakeholders;
* shoots and shoot deliverables;
* planner workflows, phases, instances and tasks;
* CRM companies, contacts, deals and activities;
* campaigns;
* assets and Cloudinary;
* chatbot and lead intake;
* notifications;
* commerce and social integrations;
* Mastra framework tables;
* AI-agent logs, memory and decision records.

Check for:

* missing foreign keys;
* cross-tenant references;
* duplicate tables representing the same entity;
* nullable columns that should be required;
* incorrect cascade behavior;
* orphan-row risks;
* missing uniqueness constraints;
* polymorphic relationships without validation;
* inconsistent organization ownership;
* missing audit timestamps;
* incorrect enum or status handling;
* excessive JSONB where relational columns are preferable.

Score each domain from 0–100.

---

# Phase 3 — Index and performance audit

For important queries and foreign keys, verify:

* foreign-key indexes;
* organization and tenant indexes;
* partial indexes;
* composite index column order;
* unique indexes;
* indexes supporting RLS predicates;
* indexes supporting Realtime;
* search and vector indexes;
* unused or duplicate indexes;
* indexes missing from high-volume tables.

Review likely query patterns for:

* dashboards;
* planner timelines;
* event schedules;
* CRM pipelines;
* notifications;
* agent memory;
* asset searches;
* booking availability;
* Stripe reconciliation.

Classify findings:

* 🔴 Critical
* 🟡 Important
* 🟢 Correct
* ⚪ Optional optimization

---

# Phase 4 — RLS, grants and authorization audit

For every exposed table and RPC, verify:

* RLS enabled;
* correct tenant isolation;
* organization membership checks;
* role levels such as owner, manager, editor, contributor and viewer;
* anonymous access;
* authenticated access;
* service-role-only tables;
* direct grants versus RLS policies;
* UPDATE `USING` and `WITH CHECK`;
* INSERT ownership validation;
* DELETE restrictions;
* SECURITY DEFINER safety;
* explicit `search_path`;
* RPC execution grants;
* cross-organization denial;
* data enumeration risks.

Test representative scenarios:

1. Anonymous user
2. Authenticated user without an organization
3. Organization A owner
4. Organization A viewer
5. Organization A editor
6. Organization B user attempting access to Organization A
7. Service role
8. Revoked or demoted member

Verify that the existing `supabase:verify-rls` suite covers the highest-risk paths.

Identify missing probes rather than expanding tests blindly.

---

# Phase 5 — Functions, RPCs and trigger audit

Inspect all important SQL functions and triggers.

Focus on:

* authorization order;
* transaction atomicity;
* idempotency;
* optimistic locking;
* input validation;
* cross-organization checks;
* status transitions;
* raw PostgreSQL error leakage;
* trigger recursion;
* duplicate side effects;
* audit event creation;
* cleanup behavior;
* grants and ownership;
* stable versus volatile declarations;
* search-path safety.

Prioritize:

* Planner instance creation
* Planner task updates and shifting
* CRM deal conversion
* Notification updates
* Lead-draft claiming
* Booking creation and status transitions
* Payment reconciliation
* Agent action logging

For every high-risk RPC, state:

* inputs;
* outputs;
* permissions;
* side effects;
* failure modes;
* rollback behavior;
* test coverage.

---

# Phase 6 — Edge Functions and Cloudflare Workers

Inventory all deployed Supabase Edge Functions and Cloudflare Workers.

Compare deployed functions with repository source.

For each function, document:

* purpose;
* source path;
* owner;
* authentication model;
* secrets used;
* external APIs;
* callers;
* logs;
* timeout and retry behavior;
* idempotency;
* error handling;
* whether it should be retained, migrated or deleted.

Identify:

* deployed functions missing from the repository;
* obsolete FashionOS functions;
* public endpoints without a documented reason;
* duplicated Supabase and Cloudflare implementations;
* unbounded retries;
* secrets embedded in code;
* missing webhook-signature validation;
* missing rate limits;
* missing observability.

Never recommend deletion without checking repository references, n8n, cron, webhooks and invocation logs.

---

# Phase 7 — Mastra and AI-agent architecture

Audit the complete Mastra implementation:

* agents;
* tools;
* workflows;
* memory;
* threads;
* messages;
* schedules;
* background tasks;
* prompt blocks;
* evaluations;
* observability;
* MCP clients and servers.

Check:

* which Mastra tables are actively used;
* why high-volume workflow snapshots and schedule triggers exist;
* retention and cleanup policies;
* organization isolation;
* agent permissions;
* tool allowlists;
* human approval gates;
* prompt injection defenses;
* sensitive-data handling;
* token and cost controls;
* retries and duplicate executions;
* agent decision audit trails;
* stale or unused framework tables.

Map agents to real application features:

* event concierge;
* event planning;
* shoot planning;
* venue matching;
* sponsor research;
* CRM follow-up;
* brand intelligence;
* asset analysis;
* booking support;
* operations assistant.

---

# Phase 8 — Frontend and backend wiring

Trace real data flows from UI to database.

Audit:

* Next.js pages and route handlers;
* Server Actions;
* Supabase clients;
* service-role clients;
* API routes;
* RPC wrappers;
* Edge Functions;
* Cloudflare Workers;
* Mastra tools and workflows;
* Realtime subscriptions;
* background jobs;
* webhook handlers.

For each major feature, map:

```text
User action
→ frontend component
→ API/Server Action
→ authorization
→ RPC/table/function
→ agent or automation
→ database writes
→ Realtime/UI update
→ audit and observability
```

Cover:

* chat;
* AI agents;
* automations;
* setup wizards;
* dashboards;
* planner;
* shoot management;
* event management;
* CRM;
* bookings;
* payments;
* assets;
* notifications.

Identify dead UI, unwired tables, backend functions without consumers and frontend features using mock data.

---

# Phase 9 — Domain-specific feature audit

## Event management

Evaluate support for:

* event creation;
* venue sourcing;
* budgeting;
* sponsors;
* models and designers;
* staff;
* run of show;
* rehearsals;
* tickets;
* registrations;
* payments;
* live operations;
* post-event reporting.

Map findings to the event lifecycle:

1. Event inception
2. Planning and design
3. Sponsorship
4. Marketing
5. Ticketing and CRM
6. Pre-event production
7. Live event management
8. Post-event reporting

## Shoot production

Evaluate:

* shoot requests;
* quotations;
* scheduling;
* locations;
* talent;
* shot lists;
* products and garments;
* call sheets;
* deliverables;
* asset review;
* approvals;
* payments;
* reshoots;
* client delivery.

## Planner

Evaluate:

* workflow templates;
* complete phase materialization;
* task dependencies;
* business-day scheduling;
* roles and assignments;
* notifications;
* idempotency;
* realtime updates;
* calendar views;
* workload capacity;
* audit events;
* exceptions and rescheduling.

## Bookings and Stripe

Evaluate:

* availability;
* quotations;
* booking holds;
* deposits;
* checkout;
* PaymentIntents or Checkout Sessions;
* webhook verification;
* refunds;
* disputes;
* payouts;
* taxes;
* invoices;
* sponsorship payments;
* ticket purchases;
* shoot payments;
* reconciliation.

Never store raw card information.

---

# Phase 10 — Diagrams

Generate Mermaid diagrams for:

1. Full high-level ERD
2. Organization and authorization ERD
3. Event domain ERD
4. Planner ERD
5. Shoot and booking ERD
6. CRM and brand ERD
7. Agent and Mastra ERD
8. Chat and lead-intake data flow
9. Planner workflow data flow
10. Booking and Stripe payment flow
11. Edge Function and Cloudflare architecture
12. Frontend-to-backend request flow

Split large diagrams by domain so they remain readable.

---

# Phase 11 — Missing features and improvements

Suggest practical additions only when supported by evidence.

Consider:

* event budget and expense tracking;
* sponsor pipeline and deliverables;
* attendee check-in and QR codes;
* waitlists and ticket transfers;
* event capacity controls;
* resource conflict detection;
* call-sheet generation;
* vendor contracts;
* approval workflows;
* asset feedback and versioning;
* planner workload capacity;
* calendar synchronization;
* WhatsApp reminders;
* n8n orchestration;
* Stripe deposits and milestone payments;
* automated refund workflows;
* agent approval queues;
* prompt and workflow versioning;
* AI evaluation datasets;
* retention policies;
* audit dashboards;
* dead-letter queues;
* webhook replay tools;
* operational health dashboards.

For every suggestion include:

* business value;
* affected stakeholder;
* event lifecycle phase;
* tables/services required;
* complexity;
* priority;
* dependencies.

---

# Phase 12 — Final report

Produce a concise but complete report containing:

## Executive verdict

* Overall architecture score: `__/100`
* Supabase readiness: `__/100`
* Security readiness: `__/100`
* Data-model quality: `__/100`
* AI-agent readiness: `__/100`
* Event platform completeness: `__/100`
* Production readiness: `__/100`
* Probability the current architecture will succeed: `__%`

## Findings table

| Severity | Domain | Finding | Evidence | Impact | Required fix |
| -------- | ------ | ------- | -------- | ------ | ------------ |

## Critical blockers

List only issues that could cause:

* tenant data exposure;
* data corruption;
* payment loss;
* broken deployments;
* unauthorized agent actions;
* duplicate bookings;
* incomplete Planner instances;
* production outages.

## Missing work

Separate into:

* must fix before production;
* should fix next;
* optional improvements;
* outdated or unnecessary work.

## Implementation plan

Create a phased plan:

1. Security and data-integrity blockers
2. Required CI and tests
3. Core event, shoot and planner wiring
4. Agents and automations
5. Bookings and Stripe
6. Performance and observability
7. Advanced features

For every proposed task, use:

`IPI-XXX · TASK-ID — Full Task Name`

Include:

* purpose;
* exact files/schemas involved;
* acceptance criteria;
* dependencies;
* estimated complexity;
* verification steps;
* rollback plan.

## Final questions

Answer clearly:

1. Is the current schema logically correct?
2. Is tenant isolation safe?
3. Are the indexes sufficient?
4. Are triggers and RPCs safe?
5. Are frontend and backend fully wired?
6. Are Mastra and Cloudflare responsibilities clear?
7. Can the Event, Shoot and Planner products operate end to end?
8. Are bookings and Stripe production-ready?
9. What are the five highest-value next tasks?
10. What work should be canceled, merged or deferred?

Do not make changes during this audit. Finish the verified report first and wait for explicit approval before implementing fixes.
