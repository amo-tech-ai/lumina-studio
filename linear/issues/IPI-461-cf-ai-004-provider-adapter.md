**Priority:** P0 — Foundation  
**Status:** 🟡 **In Progress** — gateway Worker partial on `main`; **Mastra wire pending** (IPI-454 AC-F)  
**Spec:** CF-AI-004  
**SSOT:** `tasks/cloudflare/mastra/mastra-audit.md` · `services/cloudflare-worker/`

## Repo truth (2026-07-09)

| Layer | Path | On `main`? |
|-------|------|:----------:|
| Gateway Worker adapter | `services/cloudflare-worker/src/providers/` | ✅ |
| Model router | `services/cloudflare-worker/src/router.ts` | ✅ |
| Workers AI URL fix | PR #279 merged | ✅ |
| Mastra `resolveModel()` → gateway | `app/src/lib/ai/provider.ts` | 🔴 |
| `provider-adapter.ts` in `app/` | — | 🔴 branch only |

**Do not mark Done** until Mastra agents call inference through the gateway path.

## Strategy

```text
Mastra agents/tools → resolveModel() / openai-compatible → AI Gateway Worker → Workers AI | Gemini fallback
```

- **No** direct `@ai-sdk/google` / `@ai-sdk/groq` in agents after MASTRA-CF-001.
- **No** standalone `@mastra/deployer-cloudflare` — Mastra stays in-process (OpenNext).

## Deliverables

- [x] `AiProvider` interface + `workers-ai` / `gemini` providers in gateway Worker
- [x] OpenAI-compat HTTP to Workers AI (AC-C — PR #279)
- [x] Unit tests in `services/cloudflare-worker/` (14+)
- [ ] **Mastra wire** — `AI_GATEWAY_URL` in `resolveModel()` (IPI-454 AC-F)
- [ ] Integration test: marketing chat hits gateway on `:8787` preview
- [ ] Prod deploy via IPI-472

## Out of scope

- Tool execution framework → IPI-465 AGENT-002
- Browser automation → IPI-467

## Verification

```bash
cd services/cloudflare-worker && npm test
cd app && npm test -- src/lib/ai/provider.test.ts
# After AC-F: curl AI Gateway + preview marketing-chat
```

_Source: `linear/issues/IPI-461-cf-ai-004-provider-adapter.md`_
