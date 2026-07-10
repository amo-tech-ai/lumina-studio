**Priority:** P0 — Foundation  
**Status:** 🟡 **In Progress** — **NOT on `main`** (branch `ai/ipi-471-agent-001-ai-agent-architecture`)  
**Spec:** CF-AI-005  
**SSOT:** `tasks/cloudflare/mastra/mastra-audit.md`

## Repo truth (2026-07-09)

| Artifact | Expected | `main` |
|----------|----------|:------:|
| `app/src/lib/ai/types.ts` (unified SSOT) | CF-AI-005 | partial (Groq-era) |
| `app/src/lib/ai/model-registry.ts` | tier registry | 🔴 **missing** |
| `services/cloudflare-worker/model-registry.ts` | gateway tiers | ✅ divergent copy |
| `config/groq-models.json` | legacy Groq allowlist | ✅ |

**Linear must stay In Progress** until branch merges to `main` and registries unify.

## Deliverables

- [ ] Merge `ai/ipi-471-agent-001-ai-agent-architecture` (or split PR) to `main`
- [ ] Single `ModelTier` SSOT: `default | fast | structured | vision | embedding`
- [ ] `AiProvider` enum: `workers-ai | gemini | openai-compatible | mock` (groq deprecated → IPI-459)
- [ ] Gateway + app share tier IDs (no drift vs `services/cloudflare-worker/model-registry.ts`)
- [ ] Edge `_shared/llm/types.ts` re-exports app SSOT
- [ ] `cd app && npm run lint && npm test && npm run build` green on `main`

## Blocked-by

- Merge PR before IPI-454 AC-F and MASTRA-CF-001

## Do not

- Mark Done while `app/src/lib/ai/model-registry.ts` is absent on `main`
- Store secrets in registry JSON

_Source: `linear/issues/IPI-457-cf-ai-005-unified-types-registry.md`_
