# Overall System Architecture

**Purpose:** Show the full iPix request path from browser to data layer, distinguishing what is actually deployed today from the target Cloudflare-hosted state.

## Explanation

iPix's Next.js operator dashboard, Mastra agent orchestration, and CopilotKit AI chat UI all run in one Next.js process. **Today, that process is deployed on Vercel** — this remains the actual production host. The target state moves the same process onto Cloudflare Workers via OpenNext (`app/wrangler.jsonc`, `app/open-next.config.ts` exist on disk but are not yet the production path — see `CF-MIG-210`/`CF-MIG-810`, both open). Regardless of host, outbound calls are unchanged: Supabase (Postgres system of record, Auth, pgvector, Realtime) and Cloudinary (media pipeline) are called directly from Next.js server code today. The AI Gateway Worker (`services/cloudflare-worker/`) is real and deployed, but nothing in the app calls it yet (`AI_GATEWAY_URL` is absent from `app/src/lib/ai/provider.ts` — IPI-454 AC-F, open) — Mastra agents still resolve providers (Gemini/Groq) directly.

## Diagram

```mermaid
flowchart TB
    User(["Operator (Browser)"])

    subgraph Current["CURRENT PRODUCTION — Vercel"]
        direction TB
        NextApp["Next.js App Router\n(Operator Dashboard)"]
        Mastra["Mastra\n(Agent Orchestration, in-process)"]
        CopilotKit["CopilotKit\n(AI Chat UI, Frontend Tools, HITL)"]
        NextApp --- Mastra
        NextApp --- CopilotKit
    end

    subgraph Target["TARGET — Cloudflare Workers via OpenNext (in progress, not yet live)"]
        direction TB
        NextAppCF["Next.js App Router\n(same code, .open-next/worker.js)"]
    end

    User -->|HTTPS| NextApp
    User -.->|"after CF-MIG-810 DNS cutover\n(not yet done)"| NextAppCF

    NextApp -->|"Supabase JS client, RLS-scoped"| Supabase[("Supabase\nPostgres + Auth + pgvector + Realtime")]
    NextApp -->|"upload/transform URLs"| Cloudinary[("Cloudinary\nMedia Pipeline")]
    Mastra -.->|"direct provider SDK calls today\n(Gemini/Groq) — NOT via gateway"| Providers["Gemini / Groq APIs"]
    Mastra -.->|"planned: ProviderAdapter.chat()\nIPI-454 AC-F, not wired"| Gateway["AI Gateway Worker\n(services/cloudflare-worker/)\nreal, deployed, unused by app"]

    NextAppCF -.->|"same outbound calls, once cut over"| Supabase
    NextAppCF -.->|"same outbound calls, once cut over"| Cloudinary

    style Target stroke-dasharray: 5 5
    style NextAppCF stroke-dasharray: 5 5
    style Gateway stroke-dasharray: 5 5
```

## Related Linear issues

IPI-454 (AI Gateway wiring, AC-F open), IPI-457 (provider registry, not on `main`), CF-MIG-210 (runtime compat, PR #286 open), CF-MIG-810 (DNS cutover, not started)

## Related PRD section

prd.md §3 (Architecture Overview, including its "Important correction" note on Vercel vs. Cloudflare) and §4.2 (Runtime boundaries)
