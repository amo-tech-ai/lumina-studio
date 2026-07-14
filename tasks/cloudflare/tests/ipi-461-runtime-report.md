# IPI-461 Stage 2+ — Final report

**PR:** https://github.com/amo-tech-ai/lumina-studio/pull/310  
**Branch:** `ipi/461-adapter-runtime-integration` @ `c5d631ca`  
**Worktree:** `/home/sk/wt-ipi-461-adapter-runtime`  
**Date:** 2026-07-10

| Item | Result |
| ---- | ------ |
| PR #302 merged | **Yes** |
| Adapter runtime entry point | `createProviderAdapter()` / `providerAdapter` in `app/src/lib/ai/provider-adapter.ts` |
| Gateway contract verified | **Yes** — `/health`, `/v1/chat/completions`, `/v1/embeddings`, SSE/`[DONE]`, Bearer auth |
| Runtime caller added | **Yes** — `GET /api/ai/health` |
| `resolveModel()` changed | **No** — deferred to IPI-454 AC-F |
| Focused tests | **Pass — 25** (22 adapter + 3 health) |
| Full tests | **Pass — 1051** passed, 6 skipped |
| Build | **Pass** (`CI=true npm run build`; route in `.next`) |
| OpenNext build | **N/A** |
| Local gateway proof | **Pass** — mock `:18787` health + chat |
| Scope preserved | **Yes** |
| Remaining work for IPI-454 AC-F | Wire `resolveModel` → openai-compatible → `AI_GATEWAY_URL`; streaming/tools E2E; prod deploy |
| PR ready | **Yes** — #310 |
| Recommendation | **Merge** after CI green (do not auto-merge) |

## What shipped

- Single client: `createProviderAdapter({ baseUrl, apiKey, timeoutMs })` in `provider-adapter.ts`
- Default URL `http://localhost:8787` (Worker, not Mastra `:4111`)
- Deleted duplicate `provider-adapter-factory.ts`
- Controlled caller: `/api/ai/health`

## Next steps

1. Review/merge [PR #310](https://github.com/amo-tech-ai/lumina-studio/pull/310)
2. Mark IPI-461 Done after merge
3. Start **IPI-454 · CF-AI-001** AC-F (`resolveModel` → gateway)
4. Then **IPI-485 · MASTRA-CF-001**
