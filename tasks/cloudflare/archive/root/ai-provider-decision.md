# AI Provider Architecture Decision

**Date:** 2026-07-07
**Status:** Approved

## Decision
Replace Supabase Edge Functions with Cloudflare Workers as the primary AI/edge runtime. Adopt provider-agnostic architecture with Workers AI as default MVP provider.

## Why Groq Removed
- Provider volatility (Llama 3.x deprecated 2026-08-16)
- Production gates never passed (GROQ-005/006/007 not started)
- Gemini sufficient for all current workloads

## Why Cloudflare Workers
- Supabase Edge Functions being deprecated for complex workloads
- AI Gateway provides caching, rate limiting, logging, fallback out of the box
- Workers AI free tier (10K neurons/day) covers MVP
- Provider-agnostic via OpenAI-compatible API

## What Stays
- Vercel → Next.js app
- Supabase → DB, Auth, pgvector
- Cloudinary → Media pipeline

## Timeline
- Phase 1 (P0): AI Gateway, Provider Adapter, Types, Architecture docs
- Phase 2 (P1): Brand Intelligence migration, Eval Suite, Cost Tracking
- Phase 3 (P2): Groq cleanup, NVIDIA eval, Failover, DNA migration

## References
- `tasks/cloudflare/cf-000-platform-architecture.md` — architecture decisions
- `linear/audit/july-7/09-gemini-groq-audit.md` — original Groq audit
