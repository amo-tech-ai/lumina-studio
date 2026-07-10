# Monitoring & Observability

**Purpose:** Show what verification actually exists today (CI build-time checks) and label runtime monitoring as a genuine, currently-unaddressed gap.

## Explanation

**This is a real gap, not a planned-vs-built split.** A repo-wide search for Sentry, Datadog, Grafana, and Cloudflare Analytics Engine references across `app/package.json` and `app/src/**` returned zero hits — no error-tracking or metrics SDK is installed or wired anywhere in the codebase. `roadmap.md` §4 confirms this: "Automated accessibility testing" and formal monitoring are listed as explicitly missing, and §2 Phase 4 lists Cloudflare Analytics Engine only under "🔬 Evaluate ... once Phase 0-3 traffic gives real usage data" — i.e. not even scheduled yet. What *does* exist today is build-time/CI verification: 4 real CI jobs (`supabase-web015`, `app-build`, `booking-gate-check`, `booking-gate`) that catch regressions before merge, plus `ai_agent_logs` and `planner.events` as after-the-fact audit tables queryable via SQL — but neither is a monitoring dashboard, alerting pipeline, or uptime check. There is no runtime error tracking, no APM, no alerting on production today.

## Diagram

```mermaid
flowchart TD
    subgraph BuildTime["Build-time verification — REAL, runs on every push/PR"]
        direction TB
        Push["git push / PR"] --> J1["supabase-web015\n(Docker RLS + claim_lead_draft tests)"]
        Push --> J2["app-build\n(env guard, lint, build, tsc, vitest)"]
        Push --> J3["booking-gate-check → booking-gate\n(conditional on DATABASE_URL secret)"]
    end

    subgraph RuntimeGap["Runtime monitoring — NOT IMPLEMENTED (genuine gap)"]
        direction TB
        NoError["No error-tracking SDK\n(no Sentry/Datadog/etc. in package.json or src/)"]
        NoMetrics["No APM / metrics pipeline"]
        NoAlert["No alerting on production incidents"]
        NoUptime["No uptime/synthetic monitoring"]
    end

    subgraph AfterTheFact["After-the-fact audit trail — REAL, queryable via SQL only"]
        direction TB
        Events["planner.events table\n(task moves, approvals, assignments)"]
        AgentLogs["ai_agent_logs table\n(Mastra tool-call input/output/tokens/duration)"]
    end

    BuildTime -.->|"catches regressions before merge"| Prod["Production (Vercel today)"]
    Prod -.->|"NO live signal today"| RuntimeGap
    Prod --> AfterTheFact
```

## Related Linear issues

None open specifically for runtime monitoring/observability tooling — this gap has no tracking issue yet.

## Related PRD section

`roadmap.md` §4 (Testing & Validation — "Explicitly missing" list), §2 Phase 4 ("🔬 Evaluate" row: Analytics Engine deferred until real traffic exists), `prd.md` §8 (Non-Functional Requirements), §9 (Risks & Known Gaps).
