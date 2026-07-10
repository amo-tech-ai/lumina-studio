# Agent & Tool Registry — Real Status

**Status:** 🟡 Partial — 4 of 7 described agent roles are real and registered; the tool "registry" is a plain barrel file with no HITL classification; Prompt Registry and Provider Registry are both zero-code today.

**Purpose:** One inventory of every agent and every tool that actually exists in code, cross-referenced against the architecture doc's 7-role taxonomy — the most-drifted category in the original 52-file set.

## Explanation

Of the architecture doc's 7 described roles, **4 are real and registered** in `getMastra()` (Brand, CRM, Booking, Shoot), **2 are not built** (Campaign, Research), and **1 is intentionally not a Mastra agent** (Notification — system-triggered via Supabase trigger → Realtime, by design, not a gap). `creative-director` exists in code and is registered, but has **zero tools** — it is not the Campaign Agent the doc describes, just an empty shell. `brand-intelligence` covers some research-adjacent flows, but there is no dedicated Research Agent.

Four more real, registered agents fall outside this 7-role taxonomy entirely: `creative-director` (the empty shell above), `visual-identity`, `social-discovery`, `model-match`. A **9th real agent**, `public-marketing-agent`, exists outside `getMastra()` altogether — it runs behind `/api/marketing-chat` on a separate, standalone Mastra instance (see `04-ai-architecture.md`).

The shared tool surface, `agentTools` (`app/src/mastra/tools/index.ts`), is a single object exporting **20 tools** — confirmed by direct read, matching the prior pass's count exactly. There is no ID-based lookup and no HITL classification metadata; agents just import the whole barrel and destructure what they use. **`production-planner` actually holds 17 of the 20 tools, not "10"** — confirmed by direct read of `app/src/mastra/agents/index.ts`: its exclusion list removes only 3 booking-write tools (`checkTalentAvailability`, `draftBookingQuote`, `createBookingDraft`), leaving it with the other 17, including CRM and talent-match tools its own instructions never mention. This is the figure already corrected in `prd.md` §5.2 — cited here, not re-derived.

**Prompt Registry and Provider Registry are both confirmed zero-code** by a repo-wide search for `PromptRegistry`, `prompt-registry`, `ProviderAdapter`, and any provider-registry class — no hits anywhere in `app/src`. Both are Approved-architecture, tracked-in-Linear, not-yet-built — same status as the Tool Registry's HITL tiers (IPI-465).

## Diagram

```mermaid
flowchart TB
  subgraph Real["🟢 REAL — registered in getMastra(), verified in code (4 of 7 described roles)"]
    direction LR
    Brand["Brand Agent\nbrandIntelligenceAgent — id: brand-intelligence"]
    CRM["CRM Agent\ncrmAssistantAgent — id: crm-assistant\n4 tools"]
    Booking["Booking Agent\nbookingAgent — id: booking\n3 tools, draft-only (snapshot-tested)"]
    Shoot["Shoot Agent\nproductionPlannerAgent — id: production-planner / default\n17 of 20 tools (not '10' — prd.md §5.2 correction)\n3-gate HITL shoot-wizard workflow"]
  end

  subgraph NotBuilt["🔴 NOT BUILT — described in doc, no agent exists"]
    direction LR
    Campaign["Campaign Agent\ncreative-director exists but has\nZERO tools — not this agent"]
    Research["Research Agent\nno dedicated agent;\nbrand-intelligence covers some overlapping flows"]
  end

  subgraph ByDesign["⚪ BY DESIGN — not a Mastra agent"]
    Notif["Notification Agent\nSupabase trigger → Realtime → frontend"]
  end

  subgraph Unmapped["4 more real, registered agents — outside the 7-role taxonomy"]
    direction LR
    CD["creative-director (the empty shell above)"]
    VI["visual-identity"]
    SD["social-discovery"]
    MM["model-match"]
  end

  subgraph NinthAgent["9th real agent — outside getMastra() entirely"]
    PM["public-marketing-agent\nseparate Mastra instance, /api/marketing-chat"]
  end

  subgraph Barrel["agentTools barrel — app/src/mastra/tools/index.ts (20 tools, plain object, no ID lookup)"]
    direction TB
    ShootT["Shoot-planning (10)"]
    TalentT["Talent-match (3)"]
    CRMT["CRM (4)"]
    BookT["Booking (3)"]
  end

  ShootT --> Shoot
  TalentT --> Shoot
  CRMT --> Shoot
  TalentT --> MM
  CRMT --> CRM
  BookT --> Booking
  ShootT --> SD

  subgraph NotBuiltInfra["⚪ Not built — supporting registry infrastructure"]
    direction LR
    PromptReg["Prompt Registry\nIPI-473 — zero code,\nprompts still hard-coded per agent"]
    ProvReg["Provider Registry / ProviderAdapter\nIPI-457 / IPI-461 — class doesn't exist,\nagents still call SDKs directly"]
    ToolReg["Tool Registry HITL tiers\nIPI-465 — barrel has no\ndangerous-tool classification or enforcement"]
  end

  classDef notbuilt stroke-dasharray:5 5,opacity:0.7;
  classDef bydesign stroke-dasharray:2 2,opacity:0.7;
  class Campaign,Research,PromptReg,ProvReg,ToolReg notbuilt;
  class Notif bydesign;
```

## Verification notes

- Spot-checked directly: `app/src/mastra/agents/booking-agent.ts` — tool set is exactly `checkTalentAvailability`, `draftBookingQuote`, `createBookingDraft`; no `confirm_booking` tool exists.
- Spot-checked directly: `app/src/mastra/agents/index.ts` — `production-planner`'s destructuring excludes exactly the 3 booking-write tools named above, confirming 17/20 held, matching `prd.md` §5.2.
- Spot-checked directly: repo-wide grep for `PromptRegistry`/`prompt-registry`/`ProviderAdapter` in `app/src` returned zero hits — both registries are confirmed not-built, not just undocumented.
- Missing implementation: HITL tool classification (IPI-465), Prompt Registry (IPI-473), Provider Registry (IPI-457/461) — none built.
- No blockers to the diagram; the gap in every case is "ship what's already designed," per `prd.md` §5.3, not "design something new."

## Related Linear issues

IPI-465 (AGENT-002, declarative tool registry + HITL tiers), IPI-473 (Prompt Registry), IPI-457 (unified model/provider registry), IPI-461 (ProviderAdapter Worker), IPI-268 (campaigns schema, deployed — Campaign Agent still not built on top of it)

## Related PRD/Roadmap section

`prd.md` §5.2 (Agent roster — described vs. real, full verified table), §5.3 (Provider/registry status), §5.1 principles 2–3 (Tool registry, Prompt registry)
