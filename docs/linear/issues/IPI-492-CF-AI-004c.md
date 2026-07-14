# IPI-492 — CF-AI-004c Harden AI Gateway embed & error contracts

**Linear:** <https://linear.app/amo100/issue/IPI-492>  
**Audit:** `tasks/cloudflare/tasks/492-audit.md` (MCP-verified 2026-07-10)  
**Skills:** ipix-task-lifecycle · cloudflare · cloudflare-workflow · gemini · worktrees · pr-workflow · ponytail  
**Parent:** IPI-461 · CF-AI-004 · **Blocked by:** IPI-491 (Done)

## Locked decisions

1. Reject invalid embed models — never silent remap  
2. Embedding allowlist — not `gemini*` string match  
3. Map + sanitize upstream statuses  
4. Typed `AiGatewayError` on adapter  
5. Fail closed on `/v1/embeddings` before `selectProvider` default chat fallback  

## Acceptance criteria

- [ ] **A** Input validation → 400 before provider  
- [ ] **B** Model allowlist reject  
- [ ] **C** Sanitized error envelope + status map  
- [ ] **D** Typed adapter error  
- [ ] **E** Unit/integration tests  
- [ ] **F** Live Wrangler: 768-d / empty 400 / wrong model 400  
- [ ] **G** Chat/structured/stream regression  
- [ ] **H** Scope: no AC-F / deploy / Gemini embed route / registry redesign  

## Verify

```bash
cd services/cloudflare-worker && npm test
cd app && npx vitest run src/lib/ai/provider-adapter.test.ts
```

**Validation level:** Local Runtime Verified.
