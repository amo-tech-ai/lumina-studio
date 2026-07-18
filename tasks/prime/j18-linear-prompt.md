# Cursor remediation prompt

Use this prompt from the repository root. It instructs Cursor to verify first and only apply high-confidence Linear corrections.

**Last forensic pass:** 2026-07-18 — results in [`j18-linear-tasks.md`](./j18-linear-tasks.md) (live Advisor + Linear MCP writes). Re-run this prompt only when evidence may have drifted; do not re-cancel already-canceled issues without new proof.

# iPix Linear Forensic Cleanup and Production-Readiness Audit

Act as a senior software specialist, forensic auditor and Linear roadmap maintainer.

## Goal

Audit and correct the supplied Linear tasks using live evidence from:

* Linear MCP
* GitHub MCP and GitHub CLI
* Supabase MCP, CLI and Dashboard evidence
* Cloudflare MCP, Wrangler and Dashboard evidence
* repository code, migrations, tests and CI
* official documentation
* official GitHub repositories, examples, tutorials and recipes

Do not trust task descriptions, statuses, blockers or old audit notes without verification.

Always reference tasks using:

`IPI-XXX · TASK-ID — Full Task Name`

## Mandatory skills and instructions

Load and follow, where available:

1. repository root `AGENTS.md`
2. `ipix-task-lifecycle`
3. `linear`
4. `github`
5. `ipix-supabase` / `supabase`
6. `supabase-postgres-best-practices`
7. `cloudflare`
8. `cloudinary`
9. `mastra`
10. `copilotkit`
11. `task-verifier`
12. relevant domain skill for CRM, Planner, Booking, Shoot or Commerce

Use MCP reads before writes.

Do not merge pull requests automatically.
Do not expose or copy secrets.
Do not modify production data merely to satisfy stale task text.
Use one concern per PR.

## Managed-first implementation rule

For every issue, prove that this order was checked:

1. Managed Dashboard feature
2. Official CLI or GitHub Action
3. Official SDK/package/repository
4. Official example, tutorial or recipe
5. Small custom adapter
6. Fully custom implementation only when a documented capability gap remains

Required examples:

* Cloudflare AI: official `cloudflare/ai` providers and examples
* Cloudflare AI Gateway: managed analytics, logging controls, spend limits, metadata and routing
* Supabase: CLI, setup action, Realtime Broadcast, pgTAP and managed backups
* Cloudinary: Upload Widget, signed presets, moderation and named transformations
* Postiz: official API/CLI for scheduling
* Mercur: existing repository modules and webhook patterns

## Phase 1 — Build live evidence inventory

Fetch every supplied issue from Linear with relations, status, priority, parent, blockers, attachments and comments.

For each task, record:

| Field                            | Evidence                                               |
| -------------------------------- | ------------------------------------------------------ |
| Exact task title                 | Linear                                                 |
| Current state and priority       | Linear                                                 |
| Actual repo implementation       | GitHub/repo                                            |
| Linked PR state                  | GitHub                                                 |
| CI status                        | GitHub Actions                                         |
| Remote Supabase/Cloudflare state | MCP/CLI/Dashboard                                      |
| Official platform capability     | official docs/repository                               |
| True blocker                     | verified evidence                                      |
| Recommended action               | keep, rewrite, merge, duplicate, cancel, close or park |

Do not use title similarity alone to cancel a task.

## Phase 2 — Apply high-confidence Linear corrections

### Cloudflare and Edge AI

1. Keep **IPI-694 · CF-EDGE-AI — Route Supabase Edge LLM Through Cloudflare AI Gateway** as the current Phase A epic.
2. Keep **IPI-697 · CF-EDGE-003 — Add Cloudflare AI Gateway REST Client and Wire Brand Intelligence** as the code implementation task.
3. Keep **IPI-699 · CF-EDGE-005 — Edge Secrets, Cloudflare Canary and Rollback** blocked only by IPI-697.
4. Keep **IPI-698 · CF-EDGE-004 — DNA Vision Evaluation After BI Canary** as the authoritative DNA decision.
5. Mark **IPI-456 · Migrate Asset DNA Scoring to Cloudflare** Duplicate/Canceled into IPI-698 after preserving any unique evidence.
6. Merge the useful scope of **IPI-282 · SHOOT-AI-004B — Shoot DNA Scoring Pipeline via Cloudflare Worker** into the implementation outcome of IPI-698. Do not preselect a Worker before evaluation.
7. Keep **IPI-455 · CF-EDGE-B — Phase B: Port Brand Intelligence Handler to Cloudflare Worker** parked and evidence-gated. Add a cancellation gate: cancel if IPI-699 proves the direct REST design meets requirements.
8. Correct **IPI-502 · CF-UJ-002 — Journey Test: AI Brand Intelligence**:

   * current Gemini/Groq baseline can run without IPI-455;
   * Cloudflare rerun depends on IPI-699;
   * optional full Worker-port rerun occurs only if IPI-455 ships.
9. Rewrite **IPI-460 · CF-AI-010 — AI Cost Tracking and Observability** into:

   * managed Gateway observability first;
   * optional per-brand attribution second;
   * no custom raw cost collector without evidence.
10. Strengthen **IPI-693 · SB-EDGE-009 — Add Per-Brand Crawl Quotas and Cost Controls** with explicit organization, brand, user, page-budget and concurrency limits.
11. Strengthen **IPI-692 · SB-EDGE-008 — Make Firecrawl Webhook Workflow Resume Idempotent** with an atomic provider-event claim and duplicate replay tests.

### Supabase security and CI

12. Make **IPI-680 · SB-SEC-002 — Disable or Scope pg_graphql Anon Table Exposure** the primary GraphQL hardening task.
13. Merge **IPI-683 · SB-SEC-002B — Scope or Disable pg_graphql Authenticated Table Exposure** into IPI-680.
14. Raise **IPI-684 · SB-SEC-001B — Revoke Default EXECUTE on New Functions** to High and add a regression test creating a new function.
15. Keep **IPI-241 · FIX — Document Chatbot Default-Deny RLS Policy** as a separate pre-production security gate.
16. Merge **IPI-69 · PLT-007 — Database Performance Review** into **IPI-682 · SB-PERF-001 — Prioritize DB Advisor Findings from Workload**.
17. Cancel or replace **IPI-676 · SB-CI-001D — Orphan Migration Allowlist** with a time-limited exception policy containing owner, reason and expiry.
18. Do not make shared-remote “apply first, types later” the normal workflow under **IPI-675 · SB-CI-001C — Types-After-Apply CI Workflow Redesign**. Prefer a fresh or disposable database.
19. Keep **IPI-704 · SB-TEST-002 — pgTAP Suite and Supabase Test DB in CI** parked, but document both valid paths:

* clean local replay after PLT-010;
* dedicated disposable database.

20. Mark **IPI-239 · FIX — Legacy Edge Functions Audit and Retire** superseded by the completed quarantine and inventory-gate work.

### Planner, assets and product tasks

21. Remove completed blockers from **IPI-480 · PLN-RT-001 — Planner Supabase Realtime Sync**. Preserve private Broadcast, debounce, cleanup and refetch-as-truth.
22. Mark **IPI-248 · DESIGN-057 — Asset Library React Parity Workspace** Duplicate of the current SCR-08 implementation ticket after verifying the route and repository state.
23. Reconcile **IPI-249 · DESIGN-058 — Campaign Management React Parity Workspace** and **IPI-250 · DESIGN-059 — Creator Matching React Parity Workspace** against current route-level SCR tickets; keep one implementation source of truth.
24. Rewrite **IPI-265 · ASSET-UX-001 — Asset Upload, Bulk Selection and Drag Workflow** around Cloudinary Upload Widget and signed presets. Keep only custom product UX.
25. Cancel **IPI-60 · CLD-004 — DAM Structure** if current Cloudinary governance fully supersedes it.
26. Cancel **IPI-67 · CLD-012 — Production Optimization** if current Cloudinary cost/performance tasks cover its acceptance criteria.
27. Merge **IPI-61 · CLD-005 — AI Asset Analysis** into IPI-698.
28. Keep **IPI-151 · SHOOT-AI-004 — Auto-Tag Shoot Photos and AI Gallery** only as an umbrella; no implementation PR should target it directly.
29. Keep **IPI-281 · SHOOT-AI-004A — Shoot Gallery UI: DNA Badges and Realtime** after the scoring contract is proven.
30. Consolidate publishing:

* IPI-192 owns deterministic/AI quality checks;
* IPI-193 owns human approval/edit state;
* IPI-195 owns the thin Postiz adapter;
* IPI-338 remains an umbrella or is closed when children cover it.

31. Split **IPI-309 · MODEL-P3 — Talent Profile Detail and URL-Context Profile Creation** into UI and import-pipeline concerns.
32. Split **IPI-310 · MODEL-P6 — Independent Model Dashboard and Agency Dashboard** into two routes sharing one shell/query layer.
33. Rewrite **IPI-313 · MODEL-P7 — Full Verification, Mobile QA, RLS Audit and Production MVP Gate** against actual live routes and current replacement tasks.
34. Keep BOOK-101 through BOOK-209 Low/Backlog and evidence-gated.

### Analytics consolidation

Create or select one analytics epic.

Order the existing tasks as:

```text
IPI-58 + IPI-66 + IPI-72
  → canonical event/fact models

IPI-74
  → aggregation functions/materialized views

IPI-75
  → reporting views

IPI-73
  → dashboard presentation

IPI-59
  → revenue layer after transaction facts exist
```

Remove false cross-blockers and prevent parallel implementations of the same metric.

## Security exception: IPI-690

Do not automatically override the human decision on:

**IPI-690 · SB-EDGE-007 — Assess GEMINI_API_KEY Exposure from Generate-Media and Rotate if Needed**

Instead:

1. Record a red forensic finding that the key was exposed and confirmed active.
2. Verify Google’s current key-rotation guidance.
3. Present two explicit choices:

   * rotate and revoke;
   * accept risk formally with owner, review date, restrictions and usage monitoring.
4. Do not mark “key works” as evidence that no exposure occurred.
5. Do not copy the key into Linear, logs, commits or reports.

## Phase 3 — Verify code and live state

For every retained implementation task:

* inspect existing modules before adding files;
* search official GitHub repositories and examples;
* verify remote schema/config through MCP or CLI;
* run the narrowest relevant tests;
* run full required CI before merge;
* prove RLS and cross-tenant denial where applicable;
* record rollback;
* use real route/browser verification for user-facing tasks;
* distinguish Unit Verified, Local Runtime Verified, Remote Runtime Verified and Production Canary Verified.

## Required output

Produce:

1. Executive scorecard
2. Exact list of issues changed
3. Proposed changes not applied because evidence was insufficient
4. Canceled/duplicate/merged/parked table
5. Correct dependency graph
6. Official-first implementation table
7. Errors, red flags and blockers
8. Production-readiness percentage
9. Remaining security exceptions
10. GitHub PR plan with one concern per PR
11. Verification evidence and commands
12. Linear comments added
13. Final before/after backlog counts

Do not declare production-ready while any of these remain unresolved:

* exposed credential without rotation or formal risk acceptance;
* anonymous/authenticated GraphQL exposure;
* unsafe default function execution;
* duplicate webhook resume;
* unbounded Firecrawl cost;
* unverified backup restore;
* Cloudflare canary and rollback not proven.

Apply automated changes only where the evidence is conclusive; return ncertain items as proposed diffs for human review.

[1]: https://docs.cloud.google.com/docs/authentication/api-keys-best-practices?utm_source=chatgpt.com "Best practices for managing API keys  |  Authentication  |  Google Cloud Documentation"
[2]: https://developers.cloudflare.com/workers-ai/models/?capabilities=Batch&utm_source=chatgpt.com "Workers AI Models · Cloudflare Workers AI docs"
[3]: https://developers.cloudflare.com/ai-gateway/observability/analytics/?utm_source=chatgpt.com "Analytics · Cloudflare AI Gateway docs"
[4]: https://github.com/cloudflare/ai?utm_source=chatgpt.com "GitHub - cloudflare/ai · GitHub"
[5]: https://supabase.com/docs/guides/realtime/broadcast?utm_source=chatgpt.com "Broadcast | Supabase Docs"
[6]: https://cloudinary.com/documentation/upload_widget?utm_source=chatgpt.com "Upload Widget | Documentation"
[7]: https://docs.postiz.com/public-api/introduction?utm_source=chatgpt.com "API Overview - Postiz Documentation"
[8]: https://github.com/mercurjs/mercur?utm_source=chatgpt.com "GitHub - mercurjs/mercur: Open-source multi-vendor marketplace platform for B2B & B2C. Built on top of MedusaJS. Create your own custom marketplace. 🛍️ · GitHub"
[9]: https://supabase.com/docs/guides/database/extensions/pgtap?utm_source=chatgpt.com "pgTAP: Unit Testing | Supabase Docs"
