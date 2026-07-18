I connected to Linear and reviewed the Cloudflare migration epic plus the task relationships.

The main parent is:

**IPI-487 · CLOUDFLARE-EPIC — Cloudflare Platform Migration**

Linear’s current first-app launch path is:

```text
IPI-606
→ IPI-472
→ IPI-632
→ IPI-627
→ IPI-510
→ selected journey tests
→ preview soak
→ IPI-631
```

Hyperdrive, native Workers AI routing, and legacy-worker retirement are listed as later platform phases rather than first-preview blockers. 

# Cloudflare hosting migration tasks

## Phase 1 — Get the Next.js application hosted on Cloudflare

These are the immediate tasks.

| Order | Linear task                                                                            | Purpose                                                                             |
| ----: | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
|     1 | **IPI-606 · CF-SEC-010 — Connect Infisical Secrets to Cloudflare Deployment**          | Securely load runtime secrets into Cloudflare deployments                           |
|     2 | **IPI-472 · INFRA-001 — OpenNext CI and Deployment Pipeline**                          | Build the Next.js app with OpenNext and upload the preview Worker                   |
|     3 | **IPI-632 · CF-MIG-220 — Protected Preview Runtime Smoke Validation**                  | Prove the remote preview works with login, CopilotKit, SSE and real agent execution |
|     4 | **IPI-627 · CF-SEC-020 — Deployment Security Proof**                                   | Prove the deployed Worker, bindings, secrets and access controls are secure         |
|     5 | **IPI-510 · CF-UJ-011 — Journey Test: AI Health, Readiness and Continuous Validation** | Confirm core AI services remain healthy on Cloudflare                               |
|     6 | **IPI-631 · CF-MIG-810 — Production DNS Cutover and Rollback**                         | Move `ipix.co` traffic to Cloudflare with a tested rollback plan                    |

### Current blocker chain

`IPI-632 · CF-MIG-220 — Protected Preview Runtime Smoke Validation` is blocked by `IPI-472 · INFRA-001 — OpenNext CI and Deployment Pipeline`.

It then blocks:

* **IPI-627 · CF-SEC-020 — Deployment Security Proof**
* **IPI-631 · CF-MIG-810 — Production DNS Cutover and Rollback**
* **IPI-586 · CF-AI-003 — Wire One Workers AI Call Through ipix-prod Gateway**

Linear explicitly requires remote login, authenticated `/api/copilotkit/info`, CopilotKit SSE, marketing-chat streaming, one real operator agent turn and startup-time evidence. 

# Phase 2 — Production journey validation

These tasks prove that real iPix workflows work on Cloudflare before DNS cutover.

| Task        | Full task name                                                                         | Real-world validation                                        |
| ----------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| **IPI-500** | **IPI-500 · CF-UJ-000 — Real-World AI Journey Test Suite**                             | Parent test suite covering major user workflows              |
| **IPI-501** | **IPI-501 · CF-UJ-001 — Journey Test: AI Onboarding**                                  | A new user completes onboarding                              |
| **IPI-502** | **IPI-502 · CF-UJ-002 — Journey Test: AI Brand Intelligence**                          | User analyzes a brand and receives useful intelligence       |
| **IPI-503** | **IPI-503 · CF-UJ-003 — Journey Test: AI Brand Brief Generation**                      | Brand analysis becomes a usable creative brief               |
| **IPI-504** | **IPI-504 · CF-UJ-004 — Journey Test: Shoot Planning Workflow**                        | User plans a production shoot                                |
| **IPI-505** | **IPI-505 · CF-UJ-005 — Journey Test: Booking Workflow**                               | User completes a booking workflow                            |
| **IPI-506** | **IPI-506 · CF-UJ-006 — Journey Test: CRM Workflow**                                   | Operator manages a company, contact or deal                  |
| **IPI-507** | **IPI-507 · CF-UJ-007 — Journey Test: Planner Workflow**                               | Operator uses the Planner end to end                         |
| **IPI-509** | **IPI-509 · CF-UJ-009 — Journey Test: Embeddings and Asset Search**                    | User searches assets using semantic/vector search            |
| **IPI-511** | **IPI-511 · CF-UJ-010 — Journey Test: Visual DNA Analysis**                            | Image analysis and scoring work correctly                    |
| **IPI-510** | **IPI-510 · CF-UJ-011 — Journey Test: AI Health, Readiness and Continuous Validation** | AI endpoints, providers and health checks remain operational |

For the first production cutover, Linear currently treats **IPI-502** and **IPI-504** as the most important journeys. **IPI-505** and **IPI-507** are optional unless booking and Planner are explicit launch promises. 

# Phase 3 — Mastra persistence and Hyperdrive

These are Cloudflare hosting tasks, but they are **post-preview** unless persistent Mastra threads are required for the first launch.

| Order | Task                                                                                 | Purpose                                                          |
| ----: | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------- |
|     1 | **IPI-616 · CF-DB-001 — Mastra Storage and Schema ADR**                              | Decide the correct long-term Mastra persistence architecture     |
|     2 | **IPI-619 · CF-DB-005 — Add Initial Supabase Hyperdrive Binding to OpenNext Worker** | Connect the Worker to Supabase Postgres through Hyperdrive       |
|     3 | **IPI-620 · CF-DB-006 — Hyperdrive Query Helper and PostgresStore Integration**      | Create the shared database helper and Mastra storage integration |
|     4 | **IPI-621 · CF-DB-007 — Tenant Authorization and RLS Tests**                         | Prove tenant isolation and Supabase RLS still work               |
|     5 | **IPI-622 · CF-DB-008 — Benchmark Hyperdrive Placement and Supabase Data API**       | Compare latency and deployment placement                         |
|     6 | **IPI-624 · CF-DB-010 — Configure Hyperdrive Monitoring and Connection Controls**    | Add operational monitoring, limits and connection safeguards     |
|     7 | **IPI-623 · CF-DB-009 — Migrate One Mastra Workload to Hyperdrive**                  | Move one controlled Mastra workload as a production canary       |
|     8 | **IPI-626 · SUPA-CLEANUP — Canonical Clients and Environment Configuration**         | Remove duplicated Supabase clients and configuration drift       |

Recommended dependency order:

```text
IPI-616
→ IPI-619
→ IPI-620
→ IPI-621
→ IPI-624
→ IPI-623
```

`IPI-622 · CF-DB-008 — Benchmark Hyperdrive Placement and Supabase Data API` can run alongside the integration work once the initial binding exists.

Linear’s epic says not to begin this storage track before `IPI-632 · CF-MIG-220 — Protected Preview Runtime Smoke Validation` unless the product specifically requires persistent Mastra conversations at first cutover. 

# Phase 4 — Cloudflare-native AI routing

These tasks migrate AI execution and observability onto Cloudflare.

| Task        | Full task name                                                               | Purpose                                                           |
| ----------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| **IPI-586** | **IPI-586 · CF-AI-003 — Wire One Workers AI Call Through ipix-prod Gateway** | Prove one controlled Workers AI request works                     |
| **IPI-458** | **IPI-458 · CF-AI-007 — NVIDIA NIM Evaluation**                              | Evaluate NVIDIA as an additional provider                         |
| **IPI-462** | **IPI-462 · CF-AI-006 — AI Provider Evaluation Suite**                       | Compare quality, latency, failures and cost                       |
| **IPI-463** | **IPI-463 · CF-AI-008 — AI Provider Failover and Rollback**                  | Add controlled provider failover                                  |
| **IPI-460** | **IPI-460 · CF-AI-010 — AI Cost Tracking and Observability**                 | Track model cost, traffic, errors and latency                     |
| **IPI-594** | **CF-MIG-230 — Migrate Mastra Agents to Cloudflare-Native AI Routing**       | Move Mastra agents onto the final Cloudflare routing architecture |

Do not start the native AI migration as a prerequisite for the first preview. Linear places it after `IPI-632` passes. 

# Phase 5 — Supabase Edge and Cloudflare canary migration

These tasks move selected edge AI workloads through Cloudflare.

| Order | Task                                                                                          | Purpose                                                     |
| ----: | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
|     1 | **IPI-694 · CF-EDGE-AI — Route Supabase Edge LLM Through Cloudflare AI Gateway**              | Route an existing Supabase Edge LLM call through Cloudflare |
|     2 | **IPI-697 · CF-EDGE-003 — Add Cloudflare AI Gateway REST Client and Wire Brand Intelligence** | Implement the Gateway client and connect Brand Intelligence |
|     3 | **IPI-455 · CF-EDGE-B — Phase B: Port Brand-Intelligence Handler to Cloudflare Worker**       | Move the full handler to a Worker                           |
|     4 | **IPI-699 · CF-EDGE-005 — Edge Secrets, Cloudflare Canary and Rollback**                      | Configure safe secrets, canary traffic and rollback         |
|     5 | **IPI-698 · CF-EDGE-004 — DNA Vision Evaluation After BI Canary**                             | Evaluate the DNA Vision path after the first canary         |
|     6 | **IPI-456 · Migrate Asset DNA Scoring to Cloudflare**                                         | Move Asset DNA scoring execution to Cloudflare              |

These are migration tasks, but they are not required simply to host the main Next.js iPix application on Cloudflare.

# Phase 6 — Soak and legacy retirement

| Task        | Full task name                                                                      | Purpose                                                         |
| ----------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| **IPI-609** | **IPI-609 · CF-MIG-230 — Soak, Zero-Legacy-Traffic Audit and Production Soak Gate** | Prove traffic and error rates remain stable over time           |
| **IPI-631** | **IPI-631 · CF-MIG-810 — Production DNS Cutover and Rollback**                      | Move production traffic safely                                  |
| **IPI-592** | **CF-MIG-820 — Delete Custom AI Gateway Worker**                                    | Remove the old custom gateway only after the platform is stable |

`IPI-609` is primarily a later platform-maturity and legacy-retirement gate. The epic notes it should not unnecessarily block the first application DNS cutover. 

# Related tasks that are not hosting migration blockers

These appeared in your list but are primarily product or architecture work.

## Brand Intelligence product work

* **IPI-656 · BRAND-INTEL-001 — Multi-Source Brand Intelligence and Scoring**
* **IPI-657 · BRAND-AGENT-001 — Improve Brand Agent Conversation and Lead Capture**
* **IPI-658 · BRAND-PROFILE-001 — Save Guest Brand Analysis as an Authenticated Brand Profile**

These can use the Cloudflare platform, but they do not need to block Cloudflare hosting.

## General AI and agent architecture

* **IPI-474 · SEARCH-001 — AI Search and Vector Architecture**
* **IPI-473 · AGENT-003 — Shared Prompt Registry**
* **IPI-467 · AGENT-006 — Browser Automation Architecture**
* **IPI-466 · AGENT-005 — MCP Server Integration Strategy**

These are broader architecture tasks, not part of the minimum Next.js hosting cutover.

## Cloudinary reliability

* **IPI-637 · CLD-EVENT-001 — Durable Cloudinary Event Inbox and Retry Processing**

Important for asset reliability, but separate from moving Next.js hosting to Cloudflare.

# Recommended execution order now

## Minimum path to Cloudflare preview

```text
IPI-606 · CF-SEC-010 — Connect Infisical Secrets to Cloudflare Deployment
→ IPI-472 · INFRA-001 — OpenNext CI and Deployment Pipeline
→ first preview upload
→ IPI-632 · CF-MIG-220 — Protected Preview Runtime Smoke Validation
```

## Minimum path to production

```text
IPI-632
→ IPI-627 · CF-SEC-020 — Deployment Security Proof
→ IPI-510 · CF-UJ-011 — AI Health, Readiness and Continuous Validation
→ IPI-502 · CF-UJ-002 — AI Brand Intelligence
→ IPI-504 · CF-UJ-004 — Shoot Planning Workflow
→ short preview soak
→ IPI-631 · CF-MIG-810 — Production DNS Cutover and Rollback
```

## Post-launch

```text
Mastra storage:
IPI-616 → IPI-619 → IPI-620 → IPI-621 → IPI-624 → IPI-623

Cloudflare-native AI:
IPI-586 → provider evaluation/failover → IPI-594

Legacy retirement:
IPI-609 → IPI-592
```

## Main conclusion

You have enough work ready to proceed without waiting for Vercel:

1. Complete and merge **IPI-606 · CF-SEC-010 — Connect Infisical Secrets to Cloudflare Deployment**.
2. Complete and merge **IPI-472 · INFRA-001 — OpenNext CI and Deployment Pipeline**.
3. Upload the first protected preview.
4. Move **IPI-632 · CF-MIG-220 — Protected Preview Runtime Smoke Validation** from Backlog to In Progress.
5. Do not pull all Hyperdrive, AI provider and Brand Intelligence tasks into the first hosting milestone.
