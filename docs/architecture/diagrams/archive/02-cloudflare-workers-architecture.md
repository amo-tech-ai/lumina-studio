# Cloudflare Workers Architecture — Real vs. Planned

**Purpose:** Give a precise picture of what actually executes on Cloudflare Workers today versus what is still in progress or deferred, so no one assumes the main app is already Workers-hosted.

## Explanation

Exactly one thing runs on Cloudflare Workers in production today: the **AI Gateway Worker** (`services/cloudflare-worker/`), a small Hono-less fetch handler (`src/index.ts` → `src/router.ts`) that provider-routes between Workers AI and Gemini (`src/providers/`). It is deployed and has its own `wrangler.jsonc`, but nothing in the main app calls it yet. The main Next.js operator app moving onto Workers via OpenNext is real code (`app/wrangler.jsonc`, `app/open-next.config.ts` exist) but is **unmerged and not deployed** — `CF-MIG-210` (runtime compatibility) is an open PR (#286), and there is no CI job that builds or deploys it (`CF-MIG-111`, 0%). KV, Queues, Durable Objects, and Vectorize are all deferred/evaluate-only per `prd.md` §4.1 — none are provisioned or used in code today.

## Diagram

```mermaid
flowchart TB
    subgraph Live["LIVE ON CLOUDFLARE WORKERS TODAY"]
        Gateway["AI Gateway Worker\nservices/cloudflare-worker/\nsrc/index.ts -> src/router.ts"]
        Router["router.ts\nprovider routing logic"]
        Providers["providers/workers-ai.ts\nproviders/gemini.ts"]
        Registry["model-registry.ts\n(worker-local copy)"]
        Gateway --> Router --> Providers
        Router --> Registry
    end

    subgraph InProgress["IN PROGRESS — not yet deployed"]
        direction TB
        OpenNextApp["Next.js app as a Worker\napp/wrangler.jsonc (name: ipix-operator)\n.open-next/worker.js entrypoint"]
        PR286["PR #286 — CF-MIG-210\nHono adapter, OAuth allowlist,\nGroq bundle fix — CI green, unmerged"]
        CIGap["CF-MIG-111 — OpenNext CI build job\n0% — no job in .github/workflows/ci.yml"]
        OpenNextApp -.-> PR286
        OpenNextApp -.-> CIGap
    end

    subgraph Deferred["DEFERRED / EVALUATE-ONLY — prd.md §4.1"]
        KV["KV — model/prompt registry seed\n(planned use, not wired from app)"]
        Queues["Queues — batch jobs\n(deferred, not MVP)"]
        DO["Durable Objects — provider health,\nPlanner presence (IPI-480)\n(deferred)"]
        Vectorize["Vectorize\n(evaluate vs. pgvector)"]
    end

    App["Next.js app (Vercel, current prod)"] -.->|"NOT wired yet — IPI-454 AC-F"| Gateway

    style InProgress stroke-dasharray: 5 5
    style Deferred stroke-dasharray: 5 5
    style OpenNextApp stroke-dasharray: 5 5
    style KV stroke-dasharray: 5 5
    style Queues stroke-dasharray: 5 5
    style DO stroke-dasharray: 5 5
    style Vectorize stroke-dasharray: 5 5
```

## Related Linear issues

IPI-461 (CF-AI-004, Worker scaffold — done), IPI-454 (CF-AI-001, gateway wiring — AC-F open), CF-MIG-210 (PR #286, open), CF-MIG-111 (0%), IPI-480 (Durable Objects, deferred, Phase 4)

## Related PRD section

prd.md §4.1 (Service Decision Table), §4.3 (Cloudflare migration status)
