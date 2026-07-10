# Intelligence Platform Planning Update

**Date:** 2026-07-07

## Executive Summary
Transition from dual-stack (Gemini on Mastra + Groq on Edge) to Cloudflare Workers as primary AI/edge runtime. Provider-agnostic design with Workers AI as default MVP provider.

## Key Decisions
- Workers AI replaces Groq as secondary provider
- NVIDIA NIM = evaluation only (not core)
- Gemini stays for vision and structured output fallback
- Provider abstraction (AiProviderAdapter) routes all inference
- Tool registry (AGENT-002) separate from provider adapter

## Tasks Created
- 11 CF-AI tasks (IPI-454→464), later reduced to 7 core + 9 platform
- IPI-465→474: AGENT-001→006, CF-000, INFRA-001, SEC-001, SEARCH-001

## Tasks Canceled
- IPI-354→361 (Groq epic, all 8)
- IPI-108 (PLT-017, Mastra RAG)
- IPI-167 (GEMINI-004, structured hardening)
- IPI-107/106/182/464 (merged into surviving tasks)

## Architecture
```
Cloudflare Workers = AI inference + edge services
Vercel = Next.js app host
Supabase = PostgreSQL/Auth/pgvector SSOT
Cloudinary = media pipeline
Mastra = orchestration
CopilotKit = AI UI
Workers AI = MVP default inference
Gemini/NVIDIA = fallback/evaluation only
Groq = removed
```

## Risks
- KV used too early as registry SSOT (mitigated: file seed first)
- Secrets accidentally stored in KV (mitigated: explicit rule)
- Shared type package breaks Worker/App imports (mitigated: test both)
