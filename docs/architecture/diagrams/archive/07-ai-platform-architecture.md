# 07 — AI Platform Architecture

**Purpose:** Show the whole AI stack top to bottom — CopilotKit (frontend chat surface) → Mastra (in-process orchestration) → provider resolution → inference — and make the current-vs-target provider path unambiguous.

## Explanation

Today, `resolveModel()` in `app/src/lib/ai/provider.ts` resolves straight to `@ai-sdk/google` (Gemini) or `@ai-sdk/groq` (Groq) based on the `AI_PROVIDER` env var — there is no gateway in this path. A real Cloudflare Worker AI Gateway exists at `services/cloudflare-worker/` (router + model-registry + Gemini/Workers AI providers), but it is a standalone scaffold: zero code in `app/src/mastra/` or `app/src/lib/ai/` references `AI_GATEWAY_URL`. The target (IPI-454 AC-F, IPI-461, IPI-485) routes every agent call through that Worker instead. Both states are shown below, clearly labeled.

## Diagram

```mermaid
flowchart TB
  subgraph Frontend ["Frontend — Next.js (app/)"]
    UI["Operator UI\n(shoot/brand/CRM/booking screens)"]
    CK["CopilotKit v2\nCopilotRuntime + InMemoryAgentRunner"]
  end

  subgraph Route ["/api/copilotkit/[[...slug]]/route.ts"]
    Hono["Hono app\nhono/vercel adapter\n(not yet hono/cloudflare-workers)"]
  end

  subgraph Orchestration ["Mastra — in-process (app/src/mastra/)"]
    Registry["getMastra() registry\n8 real agents, 2 workflows"]
    Tools["agentTools barrel\n(~20 tools)"]
    Mem["PostgresStore memory"]
  end

  subgraph Resolve ["Provider resolution — app/src/lib/ai/provider.ts"]
    RM["resolveModel(tier)"]
  end

  subgraph Current [" CURRENT — direct SDK calls "]
    direction LR
    Gemini["@ai-sdk/google\nGemini"]
    Groq["@ai-sdk/groq\nGroq"]
  end

  subgraph Target [" TARGET — via AI Gateway (not wired) "]
    direction LR
    GW["AI Gateway Worker\nservices/cloudflare-worker/\n(built, standalone, unwired)"]
    WAI["Workers AI"]
    GemT["Gemini"]
  end

  UI --> CK --> Hono --> Registry
  Registry --> Tools
  Registry --> Mem
  Registry --> RM
  RM -->|"AI_PROVIDER=gemini (today)"| Gemini
  RM -->|"AI_PROVIDER=groq (today)"| Groq
  RM -.->|"target: IPI-454 AC-F / IPI-485"| GW
  GW -.-> WAI
  GW -.-> GemT

  classDef target stroke-dasharray: 5 5,opacity:0.7;
  class GW,WAI,GemT,Target target;
```

## Related Linear issues

IPI-454 (AI Gateway routing, AC-F), IPI-457 (unified provider registry), IPI-461 (ProviderAdapter), IPI-462 (eval suite), IPI-485 (Mastra gateway cutover).

## Related PRD section

`prd.md` §4.4 (Provider strategy — "Key rule ... not yet enforced in code"), §5.3 (Provider/registry status).
