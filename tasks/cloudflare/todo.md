# Cloudflare Platform — Progress Task Tracker

**Last verified:** 2026-07-10  
**Source of truth:** current `origin/main`, Linear, PR #286, PR #271, and `tasks/cloudflare/audit-ai-platform/`  
**Runtime direction:** Next.js operator app on Cloudflare Workers through OpenNext; Vercel remains production until preview, security, deployment, and cutover gates pass.

## Legend

- 🟢 Complete and verified
- 🟡 In progress or partially verified
- 🔴 Failing or blocked
- ⚪ Not started or needs implementation

## Current foundation tracker

| Status | Task | Complete | Verified done | Missing / needs attention | Proof required to close |
|:---:|---|---:|---|---|---|
| 🟡 | **IPI-490 · CF-MIG-210 — Runtime Compatibility — Hono, OAuth & Groq Bundle** | **92%** | PR #286 rebased; lint, typecheck, 1,018 tests, Next build, OpenNext build and local Wrangler preview pass; CopilotKit fetch runtime, OAuth exact allowlist and Groq static bundle verified; stalled operator streams now return bounded `RUN_ERROR` | Remote Cloudflare preview not run; intermittent `@mastra/pg` `PostgresStore` hang remains mitigated, not fixed | Latest CI green; remote non-production preview; create a separate Hyperdrive/PostgresStore investigation task before relying on operator memory in production |
| 🟢 | **IPI-471 · AGENT-001 — AI Agent Architecture** | **100%** | Seven-agent architecture is on `main` at `tasks/cloudflare/cf-000-platform-architecture.md` | PR #271 still mixes unrelated registry/adapter code, but that belongs to IPI-457 and IPI-461 | Correct Linear status to Done after confirming the architecture sections remain complete; do not wait for PR #271 code |
| ⚪ | **IPI-465 · AGENT-002 — Shared AI Tool Registry** | **20%** | Mastra has 20 Zod-typed tools in `app/src/mastra/tools/index.ts` | No shared registry design or PR; no permission/HITL metadata contract; no cross-runtime interface; tool-call audit logging incomplete | Approved registry design, runtime ownership decision, permission model, generic HITL enforcement, audit-log schema and tests |
| 🟡 | **IPI-461 · CF-AI-004 — AI Provider Adapter** | **50%** | Gateway providers/router and 14 Worker tests are on `main` | App-side adapter remains only in stale PR #271; Mastra still bypasses gateway; no preview integration proof | Salvage adapter into a focused PR; fix stream error handling; wire through IPI-454 AC-F; prove marketing and operator requests hit the gateway |
| 🟡 | **IPI-457 · CF-AI-005 — Unified AI Provider Types & Registry** | **35%** | Proposed typed registry and unified types exist in PR #271 | Branch is far behind `main`; current `AiProvider` values do not match resolver support; app and Worker registries still diverge; edge re-export unmerged | Create focused replacement PR, reconcile provider enum with runtime support, establish one `ModelTier` SSOT, run app/Worker/edge tests |
| 🟡 | **IPI-454 · CF-AI-001 — AI Gateway — Cloudflare Provider Routing** | **55%** | OpenAI-compatible gateway, Gemini and Workers AI providers, fallback scaffolding and 14 tests are on `main` | AC-F Mastra-to-gateway wire missing; no production deploy; KV registry optional; end-to-end streaming, structured output, tools, fallback and metrics not proven through gateway | Merge IPI-457 and IPI-461 focused work, configure gateway transport, run preview integration matrix, then deploy through IPI-472 |

## Immediate blockers and corrections

| Priority | Status | Finding | Action |
|---:|:---:|---|---|
| 1 | 🔴 | Operator memory intermittently hangs through raw `@mastra/pg` under Workers preview | Create a dedicated Hyperdrive/PostgresStore investigation task; do not hide the underlying issue behind the stream timeout |
| 2 | 🔴 | PR #271 is 62+ commits behind and mixes architecture, registry, adapter and edge types | Do not merge as-is. Extract IPI-457 and IPI-461 into focused PRs, then close PR #271 as superseded |
| 3 | 🔴 | Mastra still calls providers directly instead of the AI Gateway | Complete IPI-454 AC-F only after the unified registry and adapter contracts are stable |
| 4 | 🟡 | IPI-465 is marked In Progress but its shared architecture has not started | Treat as pre-design; define ownership and contract before implementation |
| 5 | 🟡 | Remote Cloudflare proof is missing | Run a non-production preview before closing IPI-490 or depending on operator chat in production |

## Verified execution order

1. Finish **IPI-490 · CF-MIG-210 — Runtime Compatibility — Hono, OAuth & Groq Bundle**: latest CI, remote preview, and separate the PostgresStore/Hyperdrive follow-up.
2. Close **IPI-471 · AGENT-001 — AI Agent Architecture** as architecture-complete after final Linear verification.
3. Split PR #271:
   - **IPI-457 · CF-AI-005 — Unified AI Provider Types & Registry**
   - **IPI-461 · CF-AI-004 — AI Provider Adapter**
4. Complete **IPI-454 · CF-AI-001 — AI Gateway — Cloudflare Provider Routing** AC-F and the end-to-end gateway verification matrix.
5. Implement **IPI-472 · INFRA-001 — Cloudflare Worker Deployment Pipeline** and **IPI-468 · SEC-001 — Cloudflare AI Security Architecture** in parallel before production cutover.
6. Design and implement **IPI-465 · AGENT-002 — Shared AI Tool Registry** after runtime ownership and security contracts are approved.
7. Complete **IPI-485 · MASTRA-CF-001 — Mastra Provider Gateway Cutover**, then run the full preview and DNS-cutover gates.

## Production-ready validation gates

- [ ] Every change is on current `origin/main` or an explicitly linked active PR
- [ ] Lint, typecheck, unit tests and Next.js build pass
- [ ] `opennextjs-cloudflare build` passes in CI
- [ ] Remote Cloudflare preview smoke tests pass
- [ ] CopilotKit operator and marketing streams complete or return controlled errors
- [ ] AI Gateway receives and routes real Mastra requests
- [ ] Structured output, tool calling, fallback and cancellation pass end to end
- [ ] OAuth accepts only explicit trusted hosts
- [ ] Operator authentication fails closed in production
- [ ] Service-role routes have authorization and cross-organization tests
- [ ] Rate limiting, logging, redaction and alerting are enabled
- [ ] Rollback procedure is documented and tested
- [ ] Vercel remains production until all cutover gates pass

## Summary

| Status | Count | Meaning |
|:---:|---:|---|
| 🟢 | 1 | Architecture deliverable verified complete |
| 🟡 | 4 | Active implementation with material work remaining |
| 🔴 | 0 | No entire tracked task is failed, but three critical blockers remain |
| ⚪ | 1 | Shared registry is still pre-design |

**Weighted completion across these six tasks:** **59%**.  
**Production readiness:** **approximately 40%** — runtime compatibility is substantially proven, but gateway wiring, remote preview, deployment/security gates and reliable operator memory are incomplete.
