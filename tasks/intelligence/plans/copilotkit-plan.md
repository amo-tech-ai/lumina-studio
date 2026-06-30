---
title: CopilotKit Plan
version: "1.0"
lastUpdated: "2026-06-29"
---

# CopilotKit Plan

## Purpose

Operator AI chat UI + runtime bridge to Mastra agents via AG-UI SSE at `/api/copilotkit`.

## Current setup

| Component | Status | Path |
|-----------|:------:|------|
| v2 runtime | 🟢 | `app/src/app/api/copilotkit/[[...slug]]/route.ts` |
| Provider | 🟢 | `(operator)/layout.tsx` |
| CopilotSidebar | 🟢 | `operator-panel.tsx` |
| `useAgentContext` | 🟢 | route, brandId, brand scores |
| Route → agentId | 🟡 | `route-agent-map.ts` — gaps in [IPI-247](https://linear.app/amo100/issue/IPI-247); IPI-51 partial Done |
| Auth ALS (IPI2-127) | 🟢 | Per-request user → Mastra `resourceId` |
| Marketing chat | 🟢 | `/api/marketing-chat` separate |
| IntelligencePanel (DC) | 🔴 | DESIGN-032 — replace/extend sidebar |
| ChatDock (DC) | 🔴 | DESIGN-033 |
| Thread persistence | 🟡 | License token + `OPERATOR_AUTH_ENABLED` |

## Related tasks

| Task | Scope |
|------|-------|
| IPI-110 | Operator shell (shipped) |
| IPI-51 | Route-agent map (partial — gaps → IPI-247) |
| IPI-247 | Route-agent parity (assets/matching/preview/onboarding) |
| IPI-243 / DESIGN-032 | IntelligencePanel (canonical — IPI-242 was shell revert epic only) |
| DESIGN-033 | PersistentChatDock |
| DESIGN-050 | Command Center + contextual suggestions |
| DESIGN-071 | Live data in intel panel |

## Required skills

- `.claude/skills/copilotkit/SKILL.md`
- `.claude/skills/frontend-design/SKILL.md` (panel UX)

## Files to inspect

- `app/src/app/api/copilotkit/[[...slug]]/route.ts`
- `app/src/components/operator-panel/operator-panel.tsx`
- `app/src/lib/route-agent-map.ts`
- `app/src/components/copilot/copilot-tool-presentation.tsx`

## MCP / tools

| Tool | When |
|------|------|
| `cursor-ide-browser` | Visual QA sidebar + mobile |
| CopilotKit docs MCP | v2 API changes |

## Implementation phases

| Phase | Deliverable |
|-------|-------------|
| 1 ✅ | Runtime + sidebar + auth boundary |
| 2 🟡 | Context injection (brand, route) — done |
| 3 ⚪ | IntelligencePanel component (DESIGN-032) |
| 4 ⚪ | ChatDock + bottom mobile (DESIGN-033, 045) |
| 5 ⚪ | Live Supabase intel sections (DESIGN-071) |
| 6 ⚪ | Thread persistence prod (license + auth) |

## Acceptance criteria

- [ ] v2 imports only (`/v2` subpath)
- [ ] `default` + `production-planner` + `creative-director` registry keys
- [ ] No 401 on authenticated `/api/copilotkit` calls
- [ ] Internal tools hidden in prod chat
- [ ] DC IntelligencePanel order: context → approvals → tabs → evidence → activity

## Risks

| Risk | Mitigation |
|------|------------|
| `default` agent missing | `REQUIRED_AGENT_IDS` guard |
| Request identity loss in ALS | Keep ALS pattern — do not revert to WeakMap |
| Sidebar ≠ DC design | Follow COMPONENT-MAP Phase C · port **EvidenceBlock** + IntelligencePanel |

## Verification

```bash
cd app && npm run lint && npm test
cd app && npx vitest run src/app/api/copilotkit
# Manual: login → /app → chat responds with production-planner
```

**UI component map:** `tasks/intelligence/copilotkit-mastra/copilotkit-operator-ui.md` · **Design alignment:** `tasks/design-docs/STACK-ALIGNMENT.md` · `tasks/design-docs/handoff/06-ai-workflows.md` · **EvidenceBlock:** `tasks/design-docs/design/AI-EXPLAINABILITY.md`
