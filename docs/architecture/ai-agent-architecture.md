# AI Agent Architecture — iPix / FashionOS

**Status:** Approved
**Date:** 2026-07-07
**Author:** S K
**Supersedes:** scattered agent definitions in `app/src/mastra/agents/*.ts`

## 1. Architecture Principles

### 1.1 Provider Abstraction
Every agent calls inference through a single `ProviderAdapter` interface (IPI-461 · CF-AI-004). No agent imports `@ai-sdk/google`, `@ai-sdk/groq`, or any other AI SDK directly.

```
Agent → ProviderAdapter.chat() → AI Gateway Worker → Provider API
```

### 1.2 Tool Registry
Every tool is defined once in the shared tool registry (IPI-465 · AGENT-002). Agents call tools by ID, not by importing tool functions. Dangerous tools (write, delete, pay, publish) require HITL approval.

### 1.3 Prompt Registry
Every system prompt, task prompt, and output schema lives in the shared prompt registry (IPI-473 · AGENT-003). No hard-coded prompt strings in agent code.

### 1.4 Runtime Placement
- **Cloudflare Workers:** stateless, low-latency inference, edge functions, webhook handlers
- **Vercel / Mastra:** stateful orchestration, HITL workflows, memory, multi-step coordination
- Agents that need memory, workflows, or HITL run on Mastra/Vercel
- Agents that are stateless request-response run as Cloudflare Workers

### 1.5 Human-in-the-Loop
Any agent action that writes data, publishes content, processes payments, or communicates externally requires explicit human approval. HITL gates suspend the workflow and resume on operator action.

---

## 2. Agent Inventory

### 2.1 Current Mastra Agents (8)

| Agent ID | Type | Runtime | Tools | Memory | HITL |
|----------|------|---------|-------|--------|:----:|
| production-planner | Mastra Agent | Vercel | 10 shoot tools | PlannerMemory | ✅ 3 gates |
| creative-director | Mastra Agent | Vercel | None | MastraMemory | ❌ |
| brand-intelligence | Mastra Agent | Vercel | Brand tools | None | ✅ |
| crm-assistant | Mastra Agent | Vercel | 4 CRM tools | None | ✅ |
| model-match | Mastra Agent | Vercel | 3 match tools | None | ❌ |
| booking | Mastra Agent | Vercel | 3 booking tools | None | ✅ draft-only |
| visual-identity | Mastra Agent | Vercel | Vision tools | None | ❌ |
| social-discovery | Mastra Agent | Vercel | Social tools | None | ❌ |

### 2.2 Planned Cloudflare Workers (from CF-000)

| Worker | Purpose | Model Tier | Status |
|--------|---------|:----------:|:------:|
| ai-gateway | Provider routing, OpenAI-compatible API | — | 🟡 MVP |
| brand-intelligence | Brand crawl → structured profile | default | ⚪ |
| audit-asset-dna | Image DNA scoring (vision) | vision | ⏸️ deferred |

---

## 3. Agent Definitions

### 3.1 Brand Agent

**User goal:** A brand operator submits a URL and the agent discovers, analyzes, and scores the brand automatically.

**Real-world example:** "Add Zara to my brand hub" → agent crawls zara.com, extracts brand voice/visual identity/target audience, assigns DNA scores, and presents a profile for operator approval.

**Tools:** Firecrawl (crawl), Cloudinary (media), Supabase (brands, brand_scores, brand_intelligence)

**Data read:** brands, brand_scores, brand_crawls, brand_crawl_results
**Data write:** brands.ai_profile, brand_scores (after HITL approval)

**Approval points:**
- ✅ Brand profile draft → operator reviews before committing
- ✅ DNA scores → operator can accept/reject/re-run

**Memory:** Brand crawl results (temporary), conversation context during review

**Model tier:** `default` (structured output for profile extraction)

**Runtime:** Mastra on Vercel (workflow orchestration with HITL gates). Worker for crawl + inference.

**Failure behavior:** Crawl failure → retry with different settings (3 attempts). Inference failure → Gemini fallback. Profile parse failure → return structured error to operator.

**Current state:** ✅ Existing as `brandIntelligenceAgent` in Mastra. Edge function at `brand-intelligence/handler.ts` (666 lines). To be migrated to Cloudflare Worker (IPI-455 · CF-AI-002).

---

### 3.2 CRM Agent

**User goal:** An operator searches for a company or contact, views their profile, logs activity, and moves deals through a pipeline.

**Real-world example:** "Find Acme Corp contacts and log a call about the Q3 campaign" → agent searches CRM, finds the contact, logs the activity.

**Tools:** Supabase (crm_companies, crm_contacts, crm_deals, crm_activities)

**Data read:** crm_companies, crm_contacts, crm_deals, crm_activities
**Data write:** crm_activities (after HITL), crm_deals.stage (after HITL)

**Approval points:**
- ✅ Logging activity → operator confirms note is accurate
- ✅ Moving deal stage → operator confirms before transition
- ❌ No write access to company/contact profiles (create/update handled by import flows)

**Memory:** Conversation context during CRM review session

**Model tier:** `default` (text generation for summaries), `structured` (parse activity notes)

**Runtime:** Mastra on Vercel (conversational CRM agent)

**Failure behavior:** Search failure → clear "no results" message. Write failure → retry once, then surface error.

**Current state:** ✅ Existing as `crmAssistantAgent` in Mastra. 4 CRM tools registered.

---

### 3.3 Booking Agent

**User goal:** A brand operator drafts a booking request for a talent model. Agent checks availability, drafts a quote, and creates the request after operator approval.

**Real-world example:** "Draft a booking for Maria (Zara shoot, May 15-16, $1000/day)" → agent checks availability → drafts quote → operator approves → request sent.

**Tools:** checkTalentAvailability, draftBookingQuote, createBookingDraft, Supabase (talent.bookings, talent.talent_availability)

**Data read:** talent.talent_profiles, talent.talent_availability, talent.bookings
**Data write:** talent.bookings (status='requested', only after operatorConfirmed: true)

**Approval points:**
- ✅ Quote draft → operator reviews rate + message before sending
- ⛔ Agent NEVER confirms a booking (no confirm_booking tool — human-only via POST /api/bookings/{id}/approve)

**Memory:** Conversation context during booking draft session

**Model tier:** `default`

**Runtime:** Mastra on Vercel (agent logic + HITL). Backend RPCs on Supabase.

**Failure behavior:** Availability check fails → tell operator dates are blocked. Draft creation fails → surface error to operator. Never auto-retry write operations.

**Current state:** ✅ Existing as `bookingAgent` in Mastra. 3 tools. Draft-only guaranteed by snapshot tests (IPI-397 verification).

---

### 3.4 Shoot Agent

**User goal:** An operator plans a fashion photo shoot: selects shoot type, plans deliverables, generates shot list, estimates budget, and commits the plan.

**Real-world example:** "Plan a Zara summer campaign shoot for Instagram/TikTok/Amazon" → agent walks through 6-step wizard with 3 HITL gates.

**Tools:** recommendShootType, planDeliverables, lookupShotReferences, lookupChannelSpecs, generateShotListDraft, estimateShootBudget, saveApprovedShootDraft, approveShotList, explainShootDnaAlerts

**Data read:** shoots, brands, channel_specs (via API), shot_references
**Data write:** shoots (after 3 HITL gates + final approval)

**Approval points:**
- ✅ Deliverables plan → operator approves before shot list generation
- ✅ Shot list → operator approves before budget
- ✅ Budget → operator approves before saving draft

**Memory:** PlannerWorkingMemory — tracks wizard state across 6 steps

**Model tier:** `default` (most operations), `structured` (shot list generation), `vision` (DNA alerts)

**Runtime:** Mastra on Vercel (6-step wizard workflow with 3 HITL gates). Mastra Workflow for orchestration.

**Failure behavior:** Each step retryable. Operator can go back to previous steps. Workflow resumes from last completed step if interrupted.

**Current state:** ✅ Existing as `productionPlannerAgent` in Mastra (default agent). 10 tools. 3-gate HITL workflow (shoot-wizard).

---

### 3.5 Campaign Agent

**User goal:** A creative director plans a campaign: defines campaign brief, sets channels, tracks deliverables, and monitors performance.

**Real-world example:** "Create a Q3 campaign for Zara covering Instagram, TikTok, and Amazon" → agent drafts campaign brief, sets channel deliverables, tracks progress.

**Tools:** Supabase (campaigns, campaign_deliverables), Cloudinary (media), lookupChannelSpecs

**Data read:** campaigns, campaign_deliverables, brands, assets
**Data write:** campaigns (after HITL), campaign_deliverables (after HITL)

**Approval points:**
- ✅ Campaign brief → operator approves before creating
- ✅ Deliverable set → operator approves before publishing

**Memory:** Campaign planning session context

**Model tier:** `default` (creative brief generation), `structured` (deliverable planning)

**Runtime:** Mastra on Vercel (creative workflow). Backend: campaigns table (IPI-268, already deployed).

**Failure behavior:** Campaign creation fails → surface error. Deliverable generation fails → retry with relaxed constraints.

**Current state:** 🔴 Campaigns UI at /app/campaigns is a stub (5%). Backend schema deployed (IPI-268). No campaign agent yet — defined here for architecture completeness.

---

### 3.6 Research Agent

**User goal:** An operator discovers new brands, analyzes competitors, or researches market trends — automatically gathering and structuring web data.

**Real-world example:** "Research Zara's social media presence" → agent crawls brand pages, social accounts, reviews, and produces a structured report.

**Tools:** Firecrawl (web crawl), Browser Rendering (screenshots), Supabase (brand_crawls, brand_crawl_results), Cloudinary (media capture)

**Data read:** brand_crawls, brand_crawl_results
**Data write:** brand_crawl_results, brand_crawls.status

**Approval points:**
- ✅ Research report → operator reviews before adding to brand profile
- ❌ Crawl jobs auto-start based on operator request (no approval for starting a crawl)

**Memory:** Crawl results cache, research session context

**Model tier:** `default` (summarization), `structured` (data extraction)

**Runtime:** Cloudflare Worker (async crawl orchestration via Firecrawl webhook). Mastra on Vercel for review UI.

**Failure behavior:** Crawl fails → retry with different settings (3 attempts). All results returned even if partial.

**Current state:** 🟡 Partial. Firecrawl webhook and start-brand-crawl edge function exist. No dedicated agent yet — brand-intelligence agent covers some research flows.

---

### 3.7 Notification Agent

**User goal:** Proactively notify operators of important events: booking status changes, approval requests, shoot milestones, CRM updates.

**Real-world example:** When a booking is confirmed, notify the brand operator and talent. When DNA scores are ready, notify the operator.

**Tools:** Supabase (notifications), Supabase Realtime

**Data read:** notifications
**Data write:** notifications (system-generated, not agent-written)

**Approval points:** ❌ No agent-initiated notifications. All notifications are system-triggered (DB triggers, workflow events).

**Memory:** None (stateless event → notification mapping)

**Model tier:** `default` (optional: notification content generation for complex events)

**Runtime:** Supabase trigger → Realtime → frontend. Optional: Cloudflare Worker for notification enrichment.

**Failure behavior:** Notification delivery failure → logged, no retry (Realtime handles eventual delivery).

**Current state:** 🟡 Partial. Notifications table deployed. Booking triggers write notification rows. Realtime not yet configured for all notification types.

---

## 4. Agent Communication Patterns

### 4.1 Synchronous (Request-Response)
```
Operator → CopilotKit → Mastra Agent → ProviderAdapter.chat() → AI Gateway → Provider
                                       → Tool Registry → Supabase/Cloudinary/API
```
Used for: CRM search, booking draft, brand lookup, shoot planning step

### 4.2 Asynchronous (Event-Driven)
```
System Event → Supabase Trigger → Notification → Realtime → Frontend
                                         ↓
                                    Mastra Agent (optional enrichment) → Notification
```
Used for: booking confirmed, DNA scores ready, approval requested

### 4.3 Workflow (Multi-Step with HITL)
```
Mastra Workflow → Step 1 → ProviderAdapter → Result → HITL Gate → Step 2 → ...
```
Used for: brand analysis, shoot wizard, booking request

### 4.4 Queue (Fire-and-Forget)
```
Worker → Queue → Consumer Worker → Write Result → Notify
```
Used for: brand crawl, batch DNA scoring, cost log export

---

## 5. Runtime Decision Matrix

| Agent | Runtime | Why |
|-------|---------|-----|
| Brand Agent | Mastra/Vercel | Needs HITL workflow + multi-step orchestration |
| CRM Agent | Mastra/Vercel | Conversational, needs agent memory |
| Booking Agent | Mastra/Vercel | HITL draft gates + conversation |
| Shoot Agent | Mastra/Vercel | 6-step wizard with 3 HITL gates (existing) |
| Campaign Agent | Mastra/Vercel | Creative workflow with approvals |
| Research Agent | Cloudflare Worker | Async crawl, no HITL needed for execution |
| Notification Agent | Supabase Trigger | System-triggered, stateless |
| AI Gateway | Cloudflare Worker | Stateless inference routing (already built) |
| Brand Intelligence inference | Cloudflare Worker | Stateless LLM call, no memory needed |

---

## 6. Current State vs Target

| Aspect | Current | Target |
|--------|---------|--------|
| Provider coupling | Gemini default, Groq wired | Provider-agnostic through adapter |
| Tool registry | Single `agentTools` barrel file | Declarative registry with HITL classification (AGENT-002) |
| Prompt management | Hard-coded in agent files | KV-based prompt registry (AGENT-003) |
| Agent definitions | Scattered across `app/src/mastra/agents/*.ts` | Unified doc (this file) |
| HITL gates | Implemented per-agent (inconsistent) | Standardized HITL pattern across all agents |
| Memory | PlannerMemory + MastraMemory | Evaluate if Cloudflare Agents SDK Durable Objects replace Mastra memory |
| Runtime | All on Vercel/Next.js | Inference on Workers, orchestration on Vercel |

---

## 7. Next Steps

| Step | Action | Depends On |
|:----:|--------|:----------:|
| 1 | Approve this architecture document | — |
| 2 | Build ProviderAdapter (IPI-461) | IPI-454 (Gateway) |
| 3 | Build Tool Registry (IPI-465) | Architecture doc |
| 4 | Migrate Brand Intelligence Worker (IPI-455) | Gateway + Adapter |
| 5 | Build Prompt Registry (IPI-473) | Architecture doc |
| 6 | Add Campaign Agent | Campaigns UI (post IPI-268) |
| 7 | Add Research Agent | Browser Rendering eval (IPI-467) |
| 8 | Standardize HITL across all agents | Tool registry (IPI-465) |
