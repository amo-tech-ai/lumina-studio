# PR-Agent Expert Sheet — CopilotKit

> Domain rules for PRs touching `app/src/app/api/copilotkit/`, `useAgent`, `useFrontendTool`,
> `CopilotChat`/`CopilotSidebar`, AG-UI, or A2UI surfaces. Sheet: `copilotkit.md` · phase: B (post-measurement).

## The one hard rule (package.json is the ladder)

**Approved imports = whatever the installed versions in `app/package.json` support.**
The repo's proven integration today is the v2 ladder: `@copilotkit/react-core/v2`,
`@copilotkit/runtime/v2`, `@ag-ui/mastra/bindings`. Before flagging ANY import:

1. Check the installed CopilotKit/AG-UI versions in `app/package.json` at the PR base.
2. Only flag an import if it conflicts with the installed version or breaks `npx tsc --noEmit`.
3. The lint import guard (`app/eslint.config.mjs`) is the enforcement record — do not
   re-litigate patterns it already permits.

A deprecated v1 import (`useCoAgent`, root `copilotKitEndpoint` props, plain
`@copilotkit/react-core` without `/v2`) is a `BLOCKING` build failure — but only flag
it when it actually lands on the v2 ladder above.

## Architecture facts

- Runtime endpoint: `app/src/app/api/copilotkit/[[...slug]]/route.ts` owned by Mastra
  (`MastraAgent.getLocalAgents()` / AG-UI bindings). The frontend and runtime model
  paths must match; a stripped/duplicated model-path claim without evidence = IMPORTANT.
- Agent wiring rule: registry key = agent `id` = `useAgent({ agentId })` (see `mastra.md`).
- Check the runtime route for 401/auth expectations before claiming a chat failure.

## Human-in-the-loop

- HITL surfaces flow through `@ag-ui/mastra` + CopilotKit bindings; no bespoke confirmation
  modals that skip the AG-UI state contract.
- `useFrontendTool` registrations must be scoped to the component that renders them;
  a globally registered tool that leaks into marketing pages = IMPORTANT.

## Acceptable patterns (do NOT flag)

- KK2/OAuth-specific Copilot configurations when the test routes are unchanged.
- A2UI/`createSurface` experiments behind feature flags that do not alter the runtime route.
- Skeleton/loading-state differences inside chat components that preserve the AG-UI state shape.

## How to flag

`BLOCKING` — v1 import or endpoint change that fails typecheck on the installed ladder;
`agentId` mismatch against the Mastra registry.
`IMPORTANT` — runtime route changes without a matching frontend/auth path update;
frontend tool side-effects escaping a component's ownership.
