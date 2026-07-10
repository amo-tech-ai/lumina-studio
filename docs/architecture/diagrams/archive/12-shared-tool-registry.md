# 12 — Shared Tool Registry

**Purpose:** Show the real tool registration surface — `app/src/mastra/tools/index.ts`'s `agentTools` barrel — and its actual per-agent distribution, not the aspirational "declarative registry" described in the architecture doc.

## Explanation

`agentTools` (`app/src/mastra/tools/index.ts:35-56`) is a single object exporting 20 tools, each a plain import from its own file — there is no ID-based lookup, no HITL classification metadata, and no runtime enforcement of "dangerous tools require approval." Agents import the whole barrel and destructure what they use (see `08-mastra-architecture.md`'s registry-hygiene note: `production-planner` ends up holding 17 of the 20 because its exclusion list only removes 3 booking tools). IPI-465 (AGENT-002) is the tracked work to turn this into a declarative registry with HITL tiers — **not built yet**; today it's a plain barrel file.

## Diagram

```mermaid
flowchart TB
  subgraph Barrel ["agentTools — app/src/mastra/tools/index.ts (20 tools)"]
    direction TB
    subgraph Shoot ["Shoot-planning (10)"]
      T1["recommendShootType"]
      T2["planDeliverables"]
      T3["lookupShotReferences"]
      T4["lookupChannelSpecs"]
      T5["generateShotListDraft"]
      T6["saveApprovedShootDraft"]
      T7["approveShotList"]
      T8["estimateShootBudget"]
      T9["explainShootDnaAlerts"]
      T10["discoverSocialChannels"]
    end
    subgraph Talent ["Talent-match (3)"]
      T11["searchTalentByFilters"]
      T12["computeTalentMatchScore"]
      T13["manageShortlist"]
    end
    subgraph CRM ["CRM (4)"]
      T14["searchCompanies"]
      T15["searchContacts"]
      T16["logActivity"]
      T17["moveDealStage"]
    end
    subgraph Booking ["Booking (3)"]
      T18["checkTalentAvailability"]
      T19["draftBookingQuote"]
      T20["createBookingDraft"]
    end
  end

  subgraph Consumers ["Agents that import agentTools"]
    PP["production-planner\n(destructures OUT 18/19/20 only\n→ still holds 17 of 20)"]
    CRMA["crm-assistant\n(only 14-17)"]
    BookA["booking\n(only 18-20)"]
    ModelM["model-match\n(only 11-13)"]
    SocialA["social-discovery\n(only 10)"]
  end

  Shoot --> PP
  Talent --> PP
  CRM --> PP
  Talent --> ModelM
  CRM --> CRMA
  Booking --> BookA
  Shoot --> SocialA

  IPI465["IPI-465 · AGENT-002\nDeclarative registry + HITL classification\n— tracked, IN PROGRESS, not built"] -.-> Barrel
```

## Related Linear issues

IPI-465 (AGENT-002 — declarative tool registry with HITL classification).

## Related PRD section

`prd.md` §5.1 principle 2 ("Tool registry ... IPI-465, tracked, in progress"), §5.3 ("Model evaluation, failover, cost routing ... not built yet, not a missing architectural layer — just not shipped").
