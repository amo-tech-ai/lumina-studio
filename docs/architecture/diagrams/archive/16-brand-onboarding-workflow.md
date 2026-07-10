# 16 — Brand Onboarding Workflow

**Purpose:** Show the real crawl → analyze → score → approve flow that turns a brand URL into an approved Brand DNA profile.

## Explanation

Verified against `app/src/mastra/workflows/brand-intelligence-workflow.ts` (7-step Mastra workflow) and its two entry/exit API routes: `app/src/app/api/workflows/brand-intelligence/start/route.ts` and `.../approve/route.ts`. **Correction to source docs:** `tasks/cloudflare/plan/ai-agent-architecture.md` §3.1 states the Brand Agent has **two** approval points ("profile draft" and "DNA scores" reviewed separately). The actual code has **one** combined HITL gate: `saveDraftAndWait` suspends once with a single `brand_intake_drafts` row whose `draft_profile` JSON embeds both the AI profile and `_draft_scores` together; `commitOrReject` (via `promoteBrandDraft`) commits both atomically on a single `approved` boolean. There is no separate scores-only approval step in code today.

## Diagram

```mermaid
sequenceDiagram
    participant Op as Operator
    participant API as /api/workflows/brand-intelligence/{start,approve}
    participant WF as brandIntelligenceWorkflow (Mastra)
    participant FC as Firecrawl (start-brand-crawl edge fn)
    participant GE as brand-intelligence edge fn (Gemini)
    participant EN as social-discovery + visual-identity agents
    participant DB as Supabase (brands, brand_intake_drafts, brand_scores)

    Op->>API: POST /start {brandId, brandUrl}
    API->>WF: run.start()
    WF->>DB: validateBrand — guard intake_status, set crawl_running
    WF->>FC: startCrawl — POST start-brand-crawl (workflowId=runId)
    FC-->>WF: crawlId
    WF->>WF: waitForCrawl — suspend until firecrawl-webhook resumes
    Note over WF: async wait, not an HITL gate — no operator input required
    WF->>GE: extractProfile — POST brand-intelligence (draft_mode:true)
    GE-->>DB: writes ai_profile_draft (+ embedded _draft_scores), intake_status=draft_ready
    WF->>EN: fanOutEnrichment — Promise.allSettled (best-effort, failures don't block)
    WF->>DB: saveDraftAndWait — upsert brand_intake_drafts (status=pending_approval)
    WF-->>Op: suspend — HITL GATE (profile + scores shown together)
    Op->>API: POST /approve {runId, approved}
    API->>WF: run.resume()
    alt approved
        WF->>DB: commitOrReject → promoteBrandDraft — ai_profile + brand_scores committed, intake_status=ready
    else rejected
        WF->>DB: commitOrReject → discardBrandDraft — draft discarded, brand stays brand_created
    end
```

## Related Linear issues

IPI-32 (Brand Intelligence workflow, source of the workflow file header).

## Related PRD section

`prd.md` §6.3 (Brand — Mature), §3 (HITL invariant — three-level enforcement).
