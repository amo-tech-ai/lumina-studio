# 08 — Brand → AI Brief → Shoot Workflow

**Status:** 🟢 Built — all three stages are real, shipped code paths with working HITL gates.

**Purpose:** Show the end-to-end path from a brand URL to an approved, budgeted shoot as one continuous workflow, not three disconnected features.

## Explanation

Merges the old `16-brand-onboarding-workflow.md`, `17-ai-brief-workflow.md`, and `18-shoot-workflow.md` into one flow: **Brand Intelligence → Brief Generation → Shoot Wizard**. All three stages are verified against current code:

- **Brand stage** (`app/src/mastra/workflows/brand-intelligence-workflow.ts`): a 7-step Mastra workflow. **Carried-forward correction** (already verified, re-confirmed today): `tasks/cloudflare/plan/ai-agent-architecture.md` §3.1 describes **two** separate approval points (profile draft, then DNA scores). The real code has **one combined gate** — `saveDraftAndWait` suspends once with `resumeSchema: z.object({ approved: z.boolean() })`, and `commitOrReject` reads a single `draft.status === "approved"` to atomically commit both `ai_profile` and `brand_scores` together. Re-verified directly against `brand-intelligence-workflow.ts` lines 190–266 for this pass.
- **Brief stage** (`app/src/app/api/shoots/suggest-brief/route.ts`): stateless, single-call, no DB write, no formal HITL gate — the operator's inline edit of the returned brief text is the de facto review before it becomes Shoot Wizard input.
- **Shoot stage** (`app/src/mastra/workflows/shoot-wizard.ts`): 6-step, 3-gate workflow, re-confirmed this pass — step ids `deliverable-gate`, `shot-list-gate`, `budget-gate` all present and each calls `suspend()`. The workflow itself never writes to the database; the actual write happens afterward via `POST /api/shoots/commit` → `commitShootDraft` → `commit_shoot_draft` RPC (service-role only).

**New finding this pass (not in old diagrams, now in `prd.md` §5.2, verified 2026-07-09):** the Shoot Agent (`productionPlannerAgent`, id `"production-planner"`) was previously described as having "10 tools" — the real count is **17 of 20** registered tools in the shared `agentTools` barrel (it only excludes 3 booking-write tools). This is a registry-hygiene gap (unused tools exposed to the agent), not a functional bug, and doesn't change the gate flow below — noted here so this diagram doesn't repeat the stale "10 tools" figure.

## Diagram

```mermaid
sequenceDiagram
    participant Op as Operator
    participant BrandAPI as /api/workflows/brand-intelligence/{start,approve}
    participant BrandWF as brandIntelligenceWorkflow (Mastra)
    participant FC as Firecrawl (start-brand-crawl edge fn)
    participant GE as brand-intelligence edge fn (Gemini)
    participant BriefAPI as POST /api/shoots/suggest-brief
    participant WizStart as POST /api/workflows/shoot-wizard
    participant WizResume as POST /api/workflows/resume
    participant WizWF as shootWizardWorkflow (Mastra)
    participant Commit as POST /api/shoots/commit
    participant DB as Supabase (brands, brand_intake_drafts, shoots)

    rect rgb(235,245,255)
    Note over Op,DB: Stage 1 — Brand Intelligence (7 steps, 1 combined HITL gate)
    Op->>BrandAPI: POST /start {brandId, brandUrl}
    BrandAPI->>BrandWF: run.start()
    BrandWF->>FC: startCrawl (async, webhook-resumed)
    BrandWF->>GE: extractProfile (draft_mode:true)
    GE-->>DB: ai_profile_draft + embedded _draft_scores
    BrandWF->>DB: saveDraftAndWait — upsert brand_intake_drafts
    BrandWF-->>Op: suspend — HITL GATE (profile + scores shown together, ONE gate)
    Op->>BrandAPI: POST /approve {runId, approved}
    BrandAPI->>BrandWF: run.resume()
    BrandWF->>DB: commitOrReject → promoteBrandDraft (ai_profile + brand_scores committed atomically)
    end

    rect rgb(245,245,235)
    Note over Op,BriefAPI: Stage 2 — AI Brief Generation (stateless, no DB write)
    Op->>BriefAPI: {brandId?, channels, shootName, briefSeed, tone}
    BriefAPI->>DB: brandId? → fetch brands.ai_profile
    BriefAPI-->>Op: { brief } — pre-filled, editable (de facto review step)
    end

    rect rgb(245,235,245)
    Note over Op,DB: Stage 3 — Shoot Wizard (6 steps, 3 HITL gates, no DB write until commit)
    Op->>WizStart: {brand_id, shoot_name, brief, channels}
    WizStart->>WizWF: run.start()
    WizWF-->>Op: suspend — GATE 1: deliverable-gate (approve deliverables)
    Op->>WizResume: {stepId:"deliverable-gate", approved:true}
    WizResume->>WizWF: run.resume()
    WizWF-->>Op: suspend — GATE 2: shot-list-gate (approve shots)
    Op->>WizResume: {stepId:"shot-list-gate", approved:true}
    WizResume->>WizWF: run.resume()
    WizWF-->>Op: suspend — GATE 3: budget-gate (approve budget)
    Op->>WizResume: {stepId:"budget-gate", approved:true}
    WizResume->>WizWF: run.resume()
    WizWF-->>Op: workflow output (brief, deliverables, shots, budget) — held client-side, no DB row yet
    Op->>Commit: POST /api/shoots/commit (full approved draft)
    Commit->>DB: commitShootDraft → commit_shoot_draft RPC (service-role)
    DB-->>Op: shoot_id (201)
    end
```

## Verification notes

- **Corrected (carried forward):** Brand Agent has one combined approval gate, not two — re-confirmed against `brand-intelligence-workflow.ts` this pass (`resumeSchema: z.object({ approved: z.boolean() })` on `saveDraftAndWait`, single `draft.status` check in `commitOrReject`).
- **New note this pass:** Shoot Agent tool count is 17/20, not the previously-cited 10 — see `prd.md` §5.2 (verified 2026-07-09) and `12-shared-tool-registry.md`. Not a gate/flow change, just a stale figure this diagram avoids repeating.
- No missing implementation — all three stages are shipped, gated code paths.
- No blockers.

## Related Linear issues

IPI-32 (Brand Intelligence workflow), IPI-149 / IPI-228 (Shoot Wizard + commit RPC). No dedicated issue for `suggest-brief` itself.

## Related PRD/Roadmap section

`prd.md` §6.3 (Brand — Mature), §6.4 (Shoot — Mature), §5.2 (Agent roster, Shoot Agent tool-count correction), §3 (HITL invariant).
