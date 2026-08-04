# PR-Agent Expert Sheet — Mastra

> Domain rules for PRs touching `app/src/mastra/`, agent/tool/workflow definitions, memory,
> or streaming events. Sheet: `mastra.md` · phase: B (post-measurement).

## Hard rules (BLOCKING if violated)

1. **The three keys must stay in sync.** Mastra registry key = agent `id` = frontend
   `useAgent({ agentId })`. A rename in one without the others produces a runtime
   *"agent not found"* — flag immediately with the mismatching identifiers.
2. **Tools never bypass data paths.** Mastra tools call existing `app/src/lib/supabase/*`
   clients (RPC/service/approval path). A tool performing a direct DB write that skips
   those layers is BLOCKING.
3. **HITL surfaces belong to Mastra + CopilotKit.** Approval/suspend flows must use the
   wired HITL path — no ad-hoc "confirm" routes that skip the operator UI contract.
4. **Approval semantics:** approvals are per-instance (`resolve-instance-gates`); no
   silent auto-approval paths may be added.

## Architecture facts

- Agent registry: `app/src/mastra/index.ts`; agents live in `app/src/mastra/agents/`
  (`production-planner`, `creative-director`).
- Tools: `app/src/mastra/tools/`; workflows: `app/src/mastra/workflows/`.
- CopilotKit connects via `MastraAgent.getLocalAgents()` — the route must keep passing
  the model path the runtime expects.
- Dev server runs Next.js + Mastra concurrently (`npm run dev` in `app/`).

## Streaming and memory

- Streaming changes must preserve AG-UI events the CopilotKit frontend consumes —
  removing an event type without a frontend twin is a break.
- Memory/storage adapters must follow the version pinned in `app/package.json`
  (verify the provider's Postgres/Redis/OAuth paths against installed SDK shapes,
  not training data).

## How to flag

`BLOCKING` — registry/id/agentId mismatch; tool bypassing data-path layers; removed
HITL/approval step on a mutable path.
`IMPORTANT` — new agent without a toolset entry; workflow step without error-path
handling; memory schema drift without a migration note.
