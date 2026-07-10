**Priority:** P0 — Foundation  
**Status:** ⚪ Backlog (create after IPI-457 merge + IPI-454 AC-F)  
**Tags:** MASTRA, CLOUDFLARE, AI  
**SSOT:** `tasks/cloudflare/mastra/mastra-audit.md`

## Purpose

Cut over **all Mastra agents and tools** from direct Gemini/Groq assumptions to the shared provider adapter and Cloudflare AI Gateway.

## Blocked by

- [IPI-457](https://linear.app/amo100/issue/IPI-457) — unified types/registry on `main`
- [IPI-454](https://linear.app/amo100/issue/IPI-454) — AC-F Mastra → gateway wire

## Acceptance criteria

- [ ] No agent/tool file imports `@google/generative-ai`, `@ai-sdk/google`, or `@ai-sdk/groq` directly
- [ ] All model calls go through `resolveModel(tier)` → gateway OpenAI-compat (`AI_GATEWAY_URL`)
- [ ] `AI_GATEWAY_URL` path tested on OpenNext preview (`:8787`) — marketing + operator smoke
- [ ] Gemini remains **vision + fallback** only (env-controlled)
- [ ] Workers AI as default tier flip **blocked** until [IPI-462](https://linear.app/amo100/issue/IPI-462) eval sign-off
- [ ] `cd app && npm run lint && npm test && npm run build` green
- [ ] Update `.claude/skills/mastra/SKILL.md` — gateway-first model section

## Out of scope

- Standalone `CloudflareDeployer` / second Mastra Worker
- RAG / pgvector (IPI-141 defer)

## Verification

```bash
cd app && npm test
rg '@ai-sdk/(google|groq)' app/src/mastra/agents app/src/mastra/tools  # expect 0 after cutover
# Preview: wrangler tail shows gateway requests when chatting
```

_Source: `linear/issues/IPI-MASTRA-CF-001-provider-gateway-cutover.md`_
