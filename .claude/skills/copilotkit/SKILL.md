---
name: copilotkit
description: >
  CopilotKit v2 hub — operator chat runtime, AG-UI/SSE streaming, A2UI surfaces, Mastra/LangGraph
  integrations, setup, develop, debug, upgrade, OSS contribute. Use whenever the user touches
  CopilotKit, CopilotChat/CopilotSidebar/Popup, /api/copilotkit (including 401 on /info),
  useAgent/useFrontendTool/useHumanInTheLoop, agent not found / agentId mismatch, frontend tools
  not executing, SSE stuck after RunStarted, AG-UI, A2UI createSurface, license token /
  publicLicenseKey, v1→v2 migration, or wiring Mastra agents in app/ — even if they never say
  "CopilotKit". Load references/ on demand. iPix prod: references/ipix-production.md; debug:
  references/debug/debug.md. Do NOT use for Supabase-only migrations/RLS, Mercur checkout,
  shadcn-only UI tweaks, Gemini edge prompts, or Linear issue updates without CopilotKit code.
version: 2.1.0
metadata:
  priority: 2
---

# CopilotKit Skills Hub

One consolidated CopilotKit plugin skill. **Load the matching `references/` file on demand** — do not
paste reference bodies here. Each topic folder keeps its own `references/` sub-docs and `assets/`.

> **Consolidation (v2.1.0):** former standalone skills `copilotkit-setup`, `copilotkit-develop`,
> `copilotkit-integrations`, `copilotkit-agui`, `copilotkit-debug`, `copilotkit-upgrade`,
> `copilotkit-self-update`, `copilotkit-contribute`, `a2ui-renderer`, `runtime`, and `react-core`
> are now `references/` inside this skill. Behavior preserved; packaging only.

---

## Routing — load the reference that matches the task

| User intent | Reference to load |
|-------------|-------------------|
| **iPix production:** license token, Vercel env, `/app/*` smoke, 401 on `/api/copilotkit/info` | [`references/ipix-production.md`](references/ipix-production.md) · Linear [IPI-127](https://linear.app/amo100/issue/IPI-127) |
| Add CopilotKit to a project, first chat, runtime + provider, framework detection | [`references/setup/setup.md`](references/setup/setup.md) |
| Build features: CopilotChat/Popup/Sidebar, frontend tools, context, HITL interrupts, chat customization | [`references/develop/develop.md`](references/develop/develop.md) |
| Wire an external agent framework (Mastra, LangGraph, CrewAI, ADK, PydanticAI, LlamaIndex, Agno, Strands, MS Agent Framework, A2A) | [`references/integrations/integrations.md`](references/integrations/integrations.md) |
| AG-UI protocol, custom backend agents, SSE transport, `HttpAgent`, event flow | [`references/agui/agui.md`](references/agui/agui.md) |
| A2UI surfaces — `createSurface` / `updateComponents` / `updateDataModel`, CopilotRuntime `a2ui`, themes | [`references/a2ui-renderer.md`](references/a2ui-renderer.md) |
| Debug runtime connectivity, streaming, tool execution, transcription, version mismatch, AG-UI event tracing | [`references/debug/debug.md`](references/debug/debug.md) |
| Migrate CopilotKit v1 → v2 (imports, deprecated hooks, GraphQL→AG-UI runtime) | [`references/upgrade/upgrade.md`](references/upgrade/upgrade.md) |
| Refresh/reinstall upstream CopilotKit agent skills (not app code) | [`references/self-update.md`](references/self-update.md) |
| Contribute to the CopilotKit OSS monorepo (fork, branch, test, PR) | [`references/contribute/contribute.md`](references/contribute/contribute.md) |
| **`@copilotkit/runtime`** — CopilotRuntime, AgentRunner, BuiltInAgent, server tools, Intelligence mode | [`references/runtime/runtime.md`](references/runtime/runtime.md) |
| **`@copilotkit/react-core`** — provider, CopilotChat/Popup/Sidebar, useAgent/useThreads/useFrontendTool | [`references/react-core/react-core.md`](references/react-core/react-core.md) |

### Related sibling skills (not folded in)

| Task | Skill |
|------|-------|
| Mastra agents + workflows (iPix) | [`mastra`](../mastra/SKILL.md) |
| iPix implementation plan | [`tasks/design-docs/copilotkit-mastra.md`](../../../tasks/design-docs/copilotkit-mastra.md) |

---

## Routing decision tree

```
CopilotKit task
  ├─ iPix prod / Vercel / license / 401?           → references/ipix-production.md
  ├─ New project / first integration?              → references/setup/setup.md
  ├─ Chat UI, frontend tools, context, interrupts? → references/develop/develop.md
  ├─ External agent framework (Mastra, LangGraph…)?  → references/integrations/integrations.md
  │     (+ references/runtime/runtime.md for deep server wiring)
  ├─ Custom backend / AG-UI events / SSE?          → references/agui/agui.md
  ├─ Agent emits A2UI createSurface/updateComponents? → references/a2ui-renderer.md
  ├─ Something broken (stream, tools, connectivity)?  → references/debug/debug.md
  ├─ Upgrading from v1?                            → references/upgrade/upgrade.md
  ├─ Stale CopilotKit skill knowledge?             → references/self-update.md
  ├─ PR to CopilotKit/CopilotKit?                  → references/contribute/contribute.md
  ├─ Deep @copilotkit/runtime API?                 → references/runtime/runtime.md
  └─ Deep @copilotkit/react-core hooks?             → references/react-core/react-core.md
```

**iPix Operator Hub path:** `setup` → `integrations` (Mastra) → `develop` → `a2ui-renderer` as needed.

---

## Reference map (sub-docs to load deeper)

| Topic | Entry guide | Deeper references |
|-------|-------------|-------------------|
| **setup** | `references/setup/setup.md` | `references/setup/references/{framework-detection,runtime-architecture,telemetry-setup}.md` · `references/setup/assets/*` |
| **develop** | `references/develop/develop.md` | `references/develop/references/{api-surface,runtime-api,chat-customization}.md` |
| **integrations** | `references/integrations/integrations.md` | `references/integrations/references/integrations/{mastra,langgraph,crewai,adk,...}.md` |
| **agui** | `references/agui/agui.md` | `references/agui/references/{protocol-spec,client-sdk,building-agents,event-flow-diagrams}.md` |
| **debug** | `references/debug/debug.md` | `references/debug/references/{quick-workflows,runtime-debugging,agent-debugging,error-patterns}.md` |
| **upgrade** | `references/upgrade/upgrade.md` | `references/upgrade/references/{v1-to-v2-migration,breaking-changes,deprecation-map}.md` · `ipix-v2-conventions.md` |
| **contribute** | `references/contribute/contribute.md` | `references/contribute/references/{contribution-guide,pr-guidelines,repo-structure,testing-guide}.md` |
| **runtime** | `references/runtime/runtime.md` | `references/runtime/references/{setup-endpoint,built-in-agent,agent-runners,wiring-*,...}.md` |
| **react-core** | `references/react-core/react-core.md` | `references/react-core/references/{provider-setup,chat-components,client-side-tools,...}.md` |
| **a2ui-renderer** | `references/a2ui-renderer.md` | — (single file) |
| **self-update** | `references/self-update.md` | — (single file) |

Each topic folder also carries a `sources.md` where upstream provenance is recorded.

---

## Live documentation (MCP)

This plugin bundles the `copilotkit-docs` MCP server (`search-docs`, `search-code`) for live
CopilotKit docs and source lookups. See [`.mcp.json`](.mcp.json).

- **Cursor / Claude Code:** MCP auto-configured when the plugin is installed.
- **Codex / manual:** see [`references/debug/debug.md#mcp-setup`](references/debug/debug.md#mcp-setup).

Use MCP alongside references when API signatures may have changed since the bundled docs were synced.

---

## How to use this skill

1. Identify the task from the routing table or decision tree above.
2. Load **only** that topic's entry guide (`references/<topic>/...`).
3. Load deeper sub-references **on demand** when the guide points to them — keep context lean.
4. For framework wiring, also load [`references/runtime/runtime.md`](references/runtime/runtime.md) when server-side detail is needed.
