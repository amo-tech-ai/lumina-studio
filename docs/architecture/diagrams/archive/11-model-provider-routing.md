# 11 — Model/Provider Routing (Tier System)

**Purpose:** Show the tier-based routing logic that lives inside the AI Gateway Worker — `router.ts` + `model-registry.ts` — and reconcile it against `prd.md` §4.4's provider-strategy table.

## Explanation

`prd.md` §4.4 documents a target tier table (MVP provider = Workers AI for default/fast/structured, Gemini for vision, Workers AI for embedding). The Worker's actual `DEFAULT_REGISTRY` (`services/cloudflare-worker/src/model-registry.ts:14-57`) currently assigns **Gemini** as the provider for `default`, `fast`, and `structured` — only `embedding` uses `workers-ai` today. This is a real discrepancy between the documented target and the code's current default, worth calling out explicitly rather than redrawing the doc's aspirational table as if it were already live. Both are shown below.

## Diagram

### Code today — `DEFAULT_REGISTRY` (services/cloudflare-worker/src/model-registry.ts)

```mermaid
flowchart LR
  subgraph Registry ["DEFAULT_REGISTRY.tiers"]
    T1["default →\ngemini-3.1-flash-lite"]
    T2["fast →\ngemini-3.1-flash-lite"]
    T3["structured →\ngemini-3.1-pro-preview"]
    T4["vision →\ngemini-3.5-flash"]
    T5["embedding →\n@cf/baai/bge-base-en-v1.5"]
  end
  subgraph Providers
    Gem["gemini provider"]
    WAI["workers-ai provider"]
  end
  T1 --> Gem
  T2 --> Gem
  T3 --> Gem
  T4 --> Gem
  T5 --> WAI

  Override["MODEL_REGISTRY_OVERRIDE env\n(JSON-parsed ModelRegistry)"] -.->|replaces whole registry, not per-tier| Registry
```

### prd.md §4.4 target table (not yet reflected in `DEFAULT_REGISTRY`)

| Tier | MVP provider (doc) | Fallback (doc) | Actual code provider today |
|:---:|:---:|:---:|:---:|
| default | Workers AI | Gemini | **Gemini** |
| fast | Workers AI | Gemini | **Gemini** |
| structured | Workers AI | Gemini | **Gemini** |
| vision | Gemini | NVIDIA NIM (eval) | Gemini (matches doc) |
| embedding | Workers AI | Gemini (text-embedding) | Workers AI (matches doc) |

```mermaid
flowchart TD
  Req["ChatCompletionRequest{ model: tier }"] --> Select["selectProvider(model, env)\nrouter.ts"]
  Select --> Resolve["resolveModelEntry(tier, override?)"]
  Resolve -->|found| GetProvider["getProvider(entry.provider)"]
  Resolve -->|not found| Fallback["resolveModelEntry('default')"]
  GetProvider --> Gemini["geminiProvider.chat/chatStream"]
  GetProvider --> WorkersAI["workersAiProvider.chat/chatStream"]
```

## Related Linear issues

IPI-457 (registry SSOT), IPI-462 (eval suite — gates flipping default tiers to Workers AI), IPI-463 (failover/rollback).

## Related PRD section

`prd.md` §4.4 (Provider strategy table).
