# iPix CopilotKit v2 Conventions (authoritative)

Reference base: `github/CopilotKit/examples/integrations/mastra` — already v2.
This file is the single source of truth for hook/runtime names in iPix. Where any
shoot issue snippet shows a v1 hook, **the v2 name below wins**.

## What "v2" means in iPix

- `@copilotkit/*` package version stays `1.60.0`; v2 APIs are imported from the
  **`/v2` subpath** (`@copilotkit/react-core/v2`, `@copilotkit/runtime/v2`).
- Protocol is **AG-UI (SSE)**, not GraphQL.
- Mastra agents are bridged with **`MastraAgent` from `@ag-ui/mastra`**.

## Hook / API mapping (v1 → v2) — use the RIGHT column only

| v1 (deprecated — do NOT use) | v2 (use this) |
|---|---|
| `useCoAgent` | `useAgent` — read `agent.state`, write `agent.setState` |
| `useCopilotReadable` | `useAgentContext` |
| `useCopilotAction` | `useFrontendTool` |
| `useCopilotAction({ render })` / `useCoAgentStateRender` | `useRenderToolCall` (or `useRenderActivityMessage`) |
| `useLangGraphInterrupt` | `useInterrupt` ✅ (already correct in issues) |
| `useCopilotChat` | `useAgent` + `useSuggestions` |
| `useCopilotChatSuggestions` | `useConfigureSuggestions` + `useSuggestions` |
| `CopilotTextarea` | removed — plain `<textarea>` + `useFrontendTool` |
| `CopilotKit` from `@copilotkit/react-core` | `CopilotKit` from `@copilotkit/react-core/v2` |
| `CopilotRuntime` (adapters) + `copilotKitEndpoint()` | `CopilotRuntime` (agents) + `createCopilotEndpoint()` from `@copilotkit/runtime/v2` |
| `LangGraphAgent` endpoint | `MastraAgent` (`@ag-ui/mastra`) / `BuiltInAgent` |

> Do NOT migrate to `CopilotKitProvider` — `CopilotKit` (from `/v2`) is the
> compatibility bridge and accepts every provider prop.

## Runtime shape (from the example)

```ts
// route.ts equivalent → iPix runs this in a Vite-served route / edge boundary
import { CopilotRuntime, createCopilotEndpoint } from "@copilotkit/runtime/v2";
import { MastraAgent } from "@ag-ui/mastra";

const runtime = new CopilotRuntime({
  agents: { "production-planner": new MastraAgent({ /* mastra client */ }) },
});
const app = createCopilotEndpoint({ runtime, basePath: "/api/copilotkit" });
```

## iPix architecture invariants (unchanged by v2)

- **Center panel = workspace** (the editable artifact: shot list grid, deliverables, gallery).
- **Right panel = AI intelligence** (`CopilotSidebar` from `/v2`; advisory, gaps, alerts).
- **No silent writes.** Every durable write goes through a Supabase edge function
  after a `useInterrupt` HITL approval. Agents may only INSERT into draft/`ai_*` tables.
- AG-UI streaming (`@ag-ui/mastra`) carries agent state → `useAgent.state`. Use it
  for live `useCoAgent`-style shared artifacts; never poll.

## Translation cheatsheet for the shoot issues

- Anywhere an issue says `useCoAgent<XState>` → implement as `useAgent({ agentId })`
  and a typed `agent.state` / `agent.setState`.
- Anywhere it says `useCopilotReadable({ value })` → `useAgentContext(value)`.
- `useInterrupt` stays as written.
