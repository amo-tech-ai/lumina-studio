# 08 — Mastra Architecture

**Purpose:** Document Mastra's real internal structure — the `getMastra()` registry, the `durableAgents` wrapper, the actual registered agent IDs, workflows, and memory backing — as it exists in `app/src/mastra/index.ts` today.

## Explanation

`getMastra()` (`app/src/mastra/index.ts:43`) registers 9 keys resolving to 8 distinct `Agent` instances — `default` and `production-planner` both point at the same wrapped `productionPlannerAgent` (via `durablePlanner`). Two agents (`production-planner`/`default`, `creative-director`) are wrapped in `createDurableAgent()` for resumable streams (IPI-133); the other 6 are registered directly, unwrapped. Two Mastra workflows are registered: `shoot-wizard` and `brand-intelligence`. A 9th agent, `publicMarketingAgent`, exists in the same `agents/` directory but is **not** in this registry — it's wired into a separate, standalone Mastra instance behind `/api/marketing-chat` for the public (non-operator) marketing widget.

## Diagram

```mermaid
flowchart TB
  subgraph GetMastra ["getMastra() — app/src/mastra/index.ts"]
    direction TB
    Reg["Mastra({ agents, storage, workflows, logger })"]
  end

  subgraph AgentsMap ["agents map (9 registry keys)"]
    direction LR
    Durable["durableAgents\n(createDurableAgent wrapper — IPI-133)"]
    Direct["registered directly, unwrapped"]
  end

  subgraph DurableKeys [" "]
    direction TB
    D1["default →\ndurablePlanner"]
    D2["production-planner →\ndurablePlanner\n(same instance as default)"]
    D3["creative-director →\ndurableCreativeDirector"]
  end

  subgraph DirectKeys [" "]
    direction TB
    K1["visual-identity"]
    K2["social-discovery"]
    K3["brand-intelligence"]
    K4["model-match"]
    K5["crm-assistant"]
    K6["booking"]
  end

  subgraph Workflows ["workflows (2)"]
    direction LR
    W1["shoot-wizard\n3 HITL gates"]
    W2["brand-intelligence\nworkflow"]
  end

  subgraph Storage ["storage"]
    PG["PostgresStore\ngetMastraStorage()\nfalls back to no-op stub\nwhen DATABASE_URL unset"]
  end

  subgraph Memory ["memory (per-agent, not global)"]
    M1["getMastraMemory()\nlastMessages: 40"]
    M2["getPlannerMemory()\n+ PlannerWorkingMemory schema\n(production-planner only)"]
  end

  Reg --> AgentsMap
  Durable --> DurableKeys
  Direct --> DirectKeys
  Reg --> Workflows
  Reg --> Storage
  M1 -.-> Storage
  M2 -.-> Storage
  D2 -.-> M2
  D3 -.-> M1
  K3 -.-> M1

  subgraph Separate ["separate Mastra instance — /api/marketing-chat (not in getMastra())"]
    PM["public-marketing agent\nstateless, no tools, no memory"]
  end
```

**Registry-hygiene note (verified in code, not in prd.md's table):** `productionPlannerAgent`'s `tools` field (`app/src/mastra/agents/index.ts:14-19`) is built by destructuring `agentTools` and excluding only 3 booking-write tools (`checkTalentAvailability`, `draftBookingQuote`, `createBookingDraft`). That leaves it holding all 17 remaining tools — including `searchCompanies`/`searchContacts`/`logActivity`/`moveDealStage` (CRM) and `searchTalentByFilters`/`computeTalentMatchScore`/`manageShortlist` (talent-match) — even though its own instructions only reference the 10 shoot-specific tools. `prd.md` §5.2's "10 tools" figure describes the *instructed* tool set, not the *registered* one; the gap between the two isn't currently caught by any lint/test.

## Related Linear issues

IPI-133–135 (durable agent foundation), IPI-129 (PostgresStore), IPI2-121/114 (production-planner foundation).

## Related PRD section

`prd.md` §5.2 (Agent roster — described vs. real), §5.3 ("Agent memory — already shipped. Not a gap").
