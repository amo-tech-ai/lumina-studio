# Cloudflare AI Migration Research

**Date:** 2026-07-07

## Workers AI Model Catalog (key picks)
| Model | Use Case | Cost/M tok |
|-------|----------|:----------:|
| `@cf/meta/llama-3.1-8b-instruct-fp8-fast` | Fast chat, MVP default | $0.045/$0.384 |
| `@cf/mistralai/mistral-small-3.1-24b-instruct` | Structured output, tool use | $0.35/$0.56 |
| `@cf/meta/llama-4-scout-17b-16e-instruct` | Vision, 131K context | $0.27/$0.85 |
| `@cf/baai/bge-base-en-v1.5` | Embeddings (768-dim) | $0.067/M |

## Mastra Integration
- Keep Mastra on Vercel — `@mastra/deployer-cloudflare` exists but is immature
- Route inference through AI Gateway via `@ai-sdk/openai-compatible`
- Zero agent code changes needed (only base URL config)

## Supabase Edge → Workers Migration
| Function | AI? | Status |
|----------|:---:|:------:|
| brand-intelligence (666 lines) | ✅ | IPI-455, P0 |
| audit-asset-dna (406 lines) | ✅ | IPI-456, deferred |
| start-brand-crawl (260 lines) | ❌ | Deferred |
| firecrawl-webhook (344 lines) | ❌ | Deferred |
| capture-lead (343 lines) | ❌ | Deferred |

## Key Recommendations
1. AI Gateway first (immediate value, low friction)
2. Edge Functions → Workers is feasible but non-trivial (Deno → Workers SDK)
3. pgvector → Vectorize is HIGH complexity — defer unless clear win
4. Keep pgvector default per CF-000
