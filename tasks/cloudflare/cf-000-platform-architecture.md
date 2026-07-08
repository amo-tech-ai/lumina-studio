# CF-000 — Cloudflare Platform Architecture

**Status:** Approved
**Date:** 2026-07-07
**Author:** S K
**Gates:** IPI-454, IPI-461, IPI-457, IPI-455, IPI-462, IPI-460, IPI-463, IPI-465, IPI-471, IPI-473
**This is a decision document, not an implementation task.**

## 1. Architecture Overview

```
┌────────────────────────────────────────────────────────────────────┐
│                           End Users                                │
└──────────────────────┬─────────────────────────────────────────────┘
                       │
┌──────────────────────▼─────────────────────────────────────────────┐
│                          Vercel                                    │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │ Next.js App  │  │ Mastra       │  │ CopilotKit               │  │
│  │ (Operator    │  │ (Agent       │  │ (AI Chat UI,             │  │
│  │  Dashboard)  │  │  Orchestration)│  │  Frontend Tools, HITL)  │  │
│  └─────────────┘  └──────────────┘  └──────────────────────────┘  │
│         │                │                      │                  │
│         ▼                ▼                      ▼                  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              API Routes (Next.js)                            │  │
│  │  /api/copilotkit, /api/bookings, /api/shoots, /api/brands    │  │
│  └──────────────────────────────────────────────────────────────┘  │
└──────────────────────┬─────────────────────────────────────────────┘
                       │
┌──────────────────────▼─────────────────────────────────────────────┐
│                       Cloudflare Workers                           │
│  ┌────────────┐ ┌──────────────┐ ┌───────────┐ ┌──────────────┐   │
│  │ AI Gateway  │ │ Brand Intel  │ │ Research   │ │ Async        │   │
│  │ (Inference  │ │ (Crawl →     │ │ (Web Crawl,│ │ (Queues,     │   │
│  │  Routing)   │ │  Analyze)    │ │  Summarize)│ │  Cron Jobs)  │   │
│  └────────────┘ └──────────────┘ └───────────┘ └──────────────┘   │
│         │                                                          │
│  ┌──────┴──────────────────────────────────────────────────────┐   │
│  │  KV (Model Registry, Prompt Registry)                       │   │
│  └─────────────────────────────────────────────────────────────┘   │
└──────────────────────┬─────────────────────────────────────────────┘
                       │
┌──────────────────────▼─────────────────────────────────────────────┐
│                    Supabase                                        │
│  ┌──────────┐  ┌────────────┐  ┌──────────┐  ┌────────────────┐  │
│  │ PostgreSQL│  │ Auth       │  │ pgvector  │  │ Realtime       │  │
│  │ (SSOT)    │  │ (Supabase  │  │ (Vector   │  │ (Notifications,│  │
│  │           │  │  Auth)     │  │  Store)   │  │  Live Updates) │  │
│  └──────────┘  └────────────┘  └──────────┘  └────────────────┘  │
└────────────────────────────────────────────────────────────────────┘
                       │
┌──────────────────────▼─────────────────────────────────────────────┐
│                       Cloudinary                                   │
│                Media Pipeline (upload → transform → deliver)       │
└────────────────────────────────────────────────────────────────────┘
```

## 2. Service Decision Table

| Service | Decision | Rationale | Related Task |
|---------|:--------:|-----------|:------------:|
| **Workers** | ✅ Use now | Default compute runtime for all AI inference + edge services | INFRA-001 |
| **Workers AI** | ✅ Use now | Free-first inference ($0.011/1K neurons, 10K/day free). Best for MVP | CF-AI-001 |
| **AI Gateway** | ✅ Use now | Provider routing, caching, rate limiting, logging | CF-AI-001 |
| **KV** | ✅ Use now | Model registry seed, prompt registry, provider config | CF-AI-005 |
| **Queues** | ⏳ Defer | Needed for batch DNA scoring + cost log export. Not MVP | CF-AI-010 |
| **Workflows** | ⏳ Defer | Compare vs Mastra workflows. Evaluate in AGENT-004 | AGENT-004 |
| **Durable Objects** | ⏳ Defer | Circuit breaker shared state, provider health tracking | CF-AI-008 |
| **Vectorize** | 🔬 Evaluate | Compare vs pgvector on cost, quality, latency | SEARCH-001 |
| **AI Search** | 🔬 Evaluate | Compare vs Vectorize + pgvector for brand/knowledge search | SEARCH-001 |
| **Browser Rendering** | 🔬 Evaluate | Brand intelligence web crawling, competitor capture | AGENT-006 |
| **Analytics Engine** | 🔬 Evaluate | Compare vs Supabase + Grafana for observability | CF-006 |
| **R2** | ⏳ Defer | Cost log exports, eval artifact storage. Not MVP | CF-AI-010 |
| **Images** | ❌ Skip | Cloudinary is the dedicated media pipeline | — |
| **D1** | ❌ Skip | Supabase PostgreSQL is system of record | — |
| **Hyperdrive** | ❌ Skip | No direct Supabase connection needed from Workers | — |

## 3. Runtime Boundaries

### What runs on Cloudflare Workers

- **Stateless AI inference** — all provider calls through AI Gateway
- **Async workloads** — brand crawls, webhooks, scheduled jobs
- **Stateless edge functions** — request-response, no memory needed
- **Model/Prompt registry** — KV-backed config stores

### What stays on Vercel / Mastra

- **Next.js app** — operator dashboard, API routes, CopilotKit UI
- **Stateful agent orchestration** — Mastra workflows with HITL gates, conversation memory
- **Agents needing memory** — Brand, CRM, Booking, Shoot, Campaign agents
- **All frontend code** — CopilotKit, React components, routing

### What stays on Supabase

- **All persistent data** — PostgreSQL is system of record (brands, shoots, CRM, bookings, notifications)
- **Auth** — Supabase Auth (PLT-002)
- **Vector storage** — pgvector unless Vectorize clearly wins evaluation
- **Realtime** — notifications, live updates

### What stays on Cloudinary

- **Media pipeline** — upload, transform, deliver. No change.

## 4. Provider Strategy

| Tier | MVP Provider | Fallback | Rationale |
|:----:|:------------:|:--------:|-----------|
| default | Workers AI | Gemini | Workers AI is free, good for chat/text. Gemini if quality need |
| fast | Workers AI | Gemini | Low latency, cheap inference for high-volume agents |
| structured | Workers AI | Gemini | JSON output quality depends on model; eval decides |
| vision | Gemini | NVIDIA NIM (eval) | Workers AI has limited vision. Gemini is mature for image analysis |
| embedding | Workers AI | Gemini (text-embedding) | Workers AI BGE/Qwen3 are cheap; eval decides quality |

**Key rule:** No provider SDK is imported by agents. All inference through `ProviderAdapter` → `AI Gateway Worker`.

## 5. Task Dependency Order

```
Phase 1 — Foundation
  1. CF-000 — Platform Architecture (this document)
  2. CF-AI-001 — AI Gateway Worker (already in progress)
  3. CF-AI-004 — Provider Adapter Layer
  4. CF-AI-005 — Unified Provider Types & Registry
  5. AGENT-001 — AI Agent Architecture
  6. AGENT-002 — Shared AI Tool Registry
  7. INFRA-001 — Worker Deployment Pipeline
  8. SEC-001 — Cloudflare AI Security Architecture

Phase 2 — Migration
  9.  CF-AI-002 — Migrate Brand Intelligence to Worker
  10. AGENT-004 — Cloudflare Workflows & Orchestration
  11. CF-AI-006 — AI Provider Evaluation Suite
  12. CF-AI-010 — AI Cost Tracking & Observability
  13. SEARCH-001 — AI Search & Vector Architecture
  14. AGENT-005 — MCP Server Integration Strategy
  15. AGENT-006 — Browser Automation Architecture
  16. AGENT-003 — Shared Prompt Registry

Phase 3 — Expansion
  17. CF-AI-009 — Groq Code & Config Cleanup
  18. CF-AI-008 — AI Provider Failover & Rollback
  19. CF-AI-007 — NVIDIA NIM Evaluation
  20. CF-AI-003 — Migrate Asset DNA Scoring (deferred)
  21. TOOL-001 — Function Calling Tools for Mercur
  22. DOC-AI-001 — Shoot PDF Brief Processing
  23. SEARCH-002 — RAG Stack Evaluation
  24. SHOOT-AI-004B — Shoot DNA Scoring via Worker
```

## 6. Principles

1. **Supabase is system of record.** Cloudflare KV/D1/R2 are not primary databases. No business data lives exclusively on Cloudflare storage.
2. **pgvector is default vector store.** Vectorize is evaluated but must clearly win on cost + quality to justify migration.
3. **Vercel hosts Next.js.** Cloudflare Workers do not replace Vercel for the main app. OpenNext evaluation is separate.
4. **Workers AI is free-first default.** Paid inference (Gemini, NVIDIA) is fallback only, gated by eval results.
5. **One provider adapter.** No agent imports any AI SDK directly. All inference through `ProviderAdapter.chat()`.
6. **Human approval on writes.** No agent writes data without explicit operator confirmation (HITL).
7. **Mastra stays for orchestration.** Cloudflare Agents SDK may complement, not replace, Mastra for stateful workflows.

## 7. Out of Scope (deliberately excluded)

- Migrating Next.js from Vercel to Cloudflare (separate OpenNext evaluation)
- Replacing Supabase as the primary database
- Replacing Cloudinary as the media pipeline
- Building a full agent platform on Cloudflare Agents SDK (evaluate separately)
- Real-time video/audio processing (Cloudflare Stream, Realtime)
- Email routing (Cloudflare Email Routing)
