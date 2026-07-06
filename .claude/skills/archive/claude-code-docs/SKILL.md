---
name: claude-code-docs
description: >-
  Local mirror of Anthropic Claude Code product documentation
  (code.claude.com/docs): CLI, hooks, skills, plugins, MCP, subagents,
  AGENTS.md, slash commands, output styles, sandboxing, permissions, Agent SDK
  (TypeScript and Python), Claude Desktop, Slack, Chrome, Web, monitoring and
  usage, the Claude Code changelog, and weekly "What's New" digests. Use
  whenever the user asks how Claude Code behaves, how to install or configure
  Claude Code, or what a Claude Code flag, hook, slash command, environment
  variable, or feature does. Read this skill's references/ before generic web
  search for Claude Code product questions. Do NOT use for OpenAI Codex,
  Cursor, general Anthropic API, Claude.ai consumer, or other coding agents.
---

# Claude Code Docs

Local mirror of Anthropic Claude Code documentation, kept fresh by a 3-hour GitHub Action. The cleaned Markdown lives in `references/`; the auto-generated topic list lives in `references/INDEX.md`; the per-file manifest with upstream URLs lives in `references/docs_manifest.json`.

## Scope

Use this skill for Claude Code-specific product and configuration questions, including CLI behavior, settings, slash commands, hooks, skills, plugins, MCP, subagents, AGENTS.md, output styles, sandboxing, permissions, environment variables, monitoring and usage, Claude Desktop, Slack, Chrome, Web, Agent SDK, and release notes. If the question is about OpenAI Codex, Cursor, Claude.ai consumer features, the general Anthropic API, or another non-Claude-Code product, this skill does not apply.

## Workflow

1. If the user supplied a topic, normalize it to a slug:
   - lowercase, strip leading `/docs/en/`, strip surrounding slashes
   - join nested segments with `__` (e.g. `agent sdk hooks` -> `agent-sdk__hooks`, `whats new 2026 w19` -> `whats-new__2026-w19`)
2. If `references/<slug>.md` exists, read that file directly. Do NOT grep the whole `references/` tree first - the index plus targeted reads is faster and uses less context.
3. If no exact match, read `references/INDEX.md` and pick the closest topic. If still ambiguous, list the candidates and ask.
4. If the user supplied no topic, read `references/INDEX.md` and present the available topics.

## Answer format

- Lead with a direct answer to the user's question grounded in the file you read.
- Quote short snippets (commands, config keys) when they appear verbatim in the doc.
- End with `Source: <upstream URL>` using the `original_url` from the file frontmatter or `references/docs_manifest.json`.

## Freshness and fallback

The mirror is refreshed every 3 hours by upstream CI. If the local content looks stale, contradicted by the user, or empty:

1. Suggest the user run `npx skills update claude-code-docs`.
2. Cross-check the canonical URL via `original_url` in `references/docs_manifest.json` and offer it as a follow-up source.
3. If a specific page failed MDX cleaning, the unmodified source is preserved at `references/_raw/<slug>.md` -- read that as a fallback.

## Examples

| Invocation | Reads |
| --- | --- |
| `$claude-code-docs hooks` / `/claude-code-docs hooks` | `references/hooks.md` |
| `$claude-code-docs mcp` | `references/mcp.md` |
| `$claude-code-docs agent sdk hooks` | `references/agent-sdk__hooks.md` |
| `$claude-code-docs cli reference` | `references/cli-reference.md` |
| `$claude-code-docs changelog` | `references/changelog.md` |
| `$claude-code-docs` (no argument) | `references/INDEX.md` |
