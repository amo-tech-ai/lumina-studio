---
title: MCP Plan
version: "1.0"
lastUpdated: "2026-06-29"
---

# MCP Plan

## Purpose

Document which MCP servers agents/devs should use per task — Cursor MCP for development; in-app Mastra MCP for future agent tools.

## Cursor MCP servers (available)

| Server | Status | Primary use |
|--------|:------:|-------------|
| `project-0-ipix-supabase` | 🟢 | Schema, RLS, migrations, edge fn, SQL |
| `project-0-ipix-linear-ipix` | 🟢 | Issue state, spec lookup |
| `user-firecrawl` | 🟢 | Crawl research, competitive intel |
| `user-mastra` | 🟢 | Mastra framework docs |
| `user-gemini-api-docs-mcp` | 🟢 | Gemini API reference |
| `user-mercur` | 🟢 | Commerce docs (separate DB) |
| `cursor-ide-browser` | 🟢 | Operator UI E2E |
| `user-chrome-devtools` | 🟢 | Debug, performance |
| `user-desktop-commander` | 🟢 | Shell automation |
| `user-mcp-pandoc` | 🟡 | Doc conversion |
| `user-adk-docs-mcp` | ⚪ | ADK docs — not iPix runtime |
| `user-cubic` / `user-morph-mcp` | ⚪ | Optional dev tools |

## In-app Mastra MCP (not wired)

| DB table | Rows | Status |
|----------|:----:|:------:|
| `mastra_mcp_servers` | 0 | 🔴 |
| `mastra_mcp_clients` | 0 | 🔴 |

**Post-MVP:** P10 advanced platform (RAG/MCP) — IPI-138–145.

## Task → MCP mapping

| Task type | MCP first |
|-----------|-----------|
| Schema / RLS change | Supabase MCP → migration → verify-rls |
| Brand crawl debug | Supabase logs + Firecrawl MCP |
| CopilotKit/Mastra bug | Mastra MCP + read route.ts |
| Gemini prompt/model | Gemini docs MCP |
| UI regression | browser MCP |
| Linear sync | Linear MCP |
| Commerce checkout | Mercur MCP (not app/) |

## Related tasks

| Task | MCP |
|------|-----|
| DESIGN-016 | Supabase list_tables, execute_sql |
| IPI-24 | Firecrawl + Supabase crawl tables |
| DESIGN-081 | browser MCP for Playwright spec gen |
| P10 RAG/MCP | Future in-app wiring |

## Required skills

- `.claude/skills/ipix/SKILL.md` (routing)
- `.claude/skills/firecrawl/SKILL.md` (crawl tasks)

## Implementation phases

| Phase | Deliverable |
|-------|-------------|
| 1 ✅ | Dev MCP documented (this file) |
| 2 🟡 | Supabase MCP in agent workflow (mandatory for DB) |
| 3 ⚪ | Firecrawl MCP for IPI-24 pipeline ops |
| 4 ⚪ | In-app Mastra MCP registry (P10) |

## Acceptance criteria

- [ ] DB ops use Supabase MCP before hand-rolling SQL
- [ ] MCP tool schema read before CallMcpTool
- [ ] No MCP secrets committed

## Risks

| Risk | Mitigation |
|------|------------|
| apply_migration on prod | Review + migration-reviewer agent |
| MCP vs CLI drift | Prefer MCP for audit; CLI for verify scripts |

## Verification

- Supabase MCP: `list_tables`, `get_advisors`
- Document MCP used in PR verification section
