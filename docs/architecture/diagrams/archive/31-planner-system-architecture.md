# Planner System Architecture

**Purpose:** Show every container that participates in the Planner subsystem — browser, Next.js/Mastra runtime, Cloudflare edge, and Supabase — and which of them exist today versus which are still spec-only.

## Explanation

Adapted from `Universal-design-prompt-new/plan/planner/mermaid-diagrams.md` §1 (C4 Container). The `planner.*` Postgres schema and the pure-TypeScript `PlannerEngine` (`app/src/lib/planner/engine.ts`, `types.ts`) are real, written, and CI-green in two open PRs (`IPI-476`, PRs #283/#284) — not yet merged to `main`. Every Cloudflare container in this diagram (`planner-gateway`, `planner-coordinator` DO, `planner-notify` Queue/Worker, `planner-cache` KV, `planner-ai` Worker) is `IPI-480`/`IPI-481` target-state spec only — no `cloudflare/planner-*` directory exists in the repo yet. The Operator SPA's Planner routes, and the `production-planner` Mastra agent's planner-specific tools, are also unbuilt: the agent itself exists (`id: "production-planner"`) but carries none of `IPI-482`'s 8 planner tools yet.

## Diagram

```mermaid
C4Container
    title iPix Production Planner — Container Diagram (build status as of 2026-07-09)

    Person(operator, "Operator User", "Producer, photographer, retoucher, client approver")
    Person(admin, "Org Admin", "Manages workflows and membership")

    Container_Boundary(browser, "Browser / Next.js App") {
        Container(spa, "Operator SPA", "Next.js 16 + React", "Planner UI, chat dock, notifications — NOT BUILT: SCR-32/33/34 design-only, zero route/component code")
    }

    Container_Boundary(vercel, "Vercel Edge / Serverless") {
        Container(nextapi, "Next.js API Routes", "TypeScript", "/api/copilotkit, /api/planner/* — planner-specific routes NOT BUILT")
        Container(mastra, "Mastra Runtime", "TypeScript", "production-planner agent exists; IPI-482's 8 planner tools NOT YET WIRED")
    }

    Container_Boundary(cloudflare, "Cloudflare Edge — SPEC ONLY, no code in repo") {
        Container(gateway, "planner-gateway Worker", "Workers", "WebSocket upgrade + notify webhook — IPI-480, not started")
        Container(do, "planner-coordinator DO", "Durable Objects", "Per-instance presence + cursor sync — IPI-480, not started")
        Container(queue, "planner-notify Queue", "Queues", "Notification fan-out buffer — IPI-481, not started")
        Container(notifyworker, "planner-notify Worker", "Workers", "Email / SMS / push delivery — IPI-481, not started")
        Container(kv, "planner-cache KV", "KV", "Hot view cache — not started")
        Container(aiworker, "planner-ai Worker", "Workers AI", "Urgency scoring + summarization — not started")
    }

    Container_Boundary(supabase, "Supabase") {
        ContainerDb(postgres, "Postgres", "PostgreSQL", "planner.* (10 tables, 3 enums, 4-tier RLS) — WRITTEN, migration 20260709000000_planner_schema_rls.sql, CI-green PR #283, not yet on main")
        Container(realtime, "Supabase Realtime", "Realtime", "Broadcast triggers on instances/tasks/events/assignments — WRITTEN in the same migration")
        Container(edge, "Edge Functions", "Deno", "seed-shoot-plan, schedule-shoot-plan, planner-notify-enqueue — NOT BUILT, only named in IPI-477/481/482 wiring plans")
    }

    Rel(operator, spa, "Plans shoots, approves gates")
    Rel(admin, spa, "Configures workflows & roles")
    Rel(spa, nextapi, "HTTPS / JSON")
    Rel(spa, realtime, "subscribe planner:&lt;instance_id&gt;")
    Rel(spa, gateway, "WSS / presence")
    Rel(gateway, do, "route to instance DO")
    Rel(nextapi, mastra, "in-process agent calls")
    Rel(mastra, postgres, "READ via RLS")
    Rel(mastra, edge, "WRITE via HITL-approved edge function")
    Rel(edge, queue, "enqueue notification")
    Rel(queue, notifyworker, "fan out")
    Rel(notifyworker, postgres, "mark delivered")
    Rel(spa, kv, "cached templates & views")
    Rel(spa, aiworker, "summarize / score")
```

## Related Linear issues

- `IPI-476` (schema + engine — in PR, CI-green, not merged)
- `IPI-478` (Operator SPA planner routes — not started)
- `IPI-480` (planner-gateway Worker, planner-coordinator DO — not started)
- `IPI-481` (planner-notify Queue + Worker — not started)
- `IPI-482` (Mastra planner tools — not started)
- `IPI-484` (epic)

## Related PRD section

`prd.md` §6.7 (Planner target-state spec) and §7 (`planner.*` schema status)
