# Mastra MCP docs server (Cursor)

SSOT for wiring [`@mastra/mcp-docs-server`](https://github.com/mastra-ai/mastra/tree/main/packages/mcp-docs-server) in this environment.

Official guide: [Build with AI](https://mastra.ai/docs/getting-started/build-with-ai).

## Verdict (2026-07-16)

| Claim | Result |
|---|---|
| Failure is “Mastra not installed in `app/`” | **False** — error is before the package runs |
| Package name `@mastra/mcp-docs-servers` | **404** — wrong (plural). Real package: **`@mastra/mcp-docs-server`** |
| Root cause of ENOENT | Cursor’s MCP host runs `npx` with Cursor’s bundled Node/npm, which expects **`/usr/share/cursor/resources/app/resources/lib`** — that dir is **missing** on this machine |
| Fix | Point MCP `command` at **nvm Node 22 `npx`** (absolute path + `PATH`), not bare `npx` |

## Evidence

From `~/.npm/_logs/2026-07-16T05_27_13_512Z-debug-0.log`:

```text
cli /usr/share/cursor/resources/app/resources/helpers/node .../npm-cli.js
config load:file:/usr/share/cursor/resources/app/resources/etc/npmrc
title npm exec @mastra/mcp-docs-server@latest
ENOENT lstat '/usr/share/cursor/resources/app/resources/lib'
```

Cursor MCP log (`mcp-server-user-mastra.log`) repeats the same ENOENT.

On disk:

```text
/usr/share/cursor/resources/app/resources/
  helpers/   ✅ (includes Cursor’s node)
  linux/     ✅
  lib/       ❌ missing → npm ENOENT
```

`/usr/bin/cursor` still exists → install is **partial**, not fully removed.

Wrong package check:

```bash
npm view @mastra/mcp-docs-server version   # → 1.2.7
npm view @mastra/mcp-docs-servers          # → 404
```

## Correct Cursor config

File: `~/.cursor/mcp.json`

```json
{
  "mcpServers": {
    "mastra": {
      "type": "stdio",
      "command": "/home/sk/.nvm/versions/node/v22.23.1/bin/npx",
      "args": ["-y", "@mastra/mcp-docs-server@latest"],
      "env": {
        "PATH": "/home/sk/.nvm/versions/node/v22.23.1/bin:/usr/bin:/bin"
      }
    }
  }
}
```

After editing: **Cursor → MCP → reload / restart** so `user-mastra` reconnects.

Do **not** install this package into `/home/sk/ipix/app` just to fix MCP — the operator app already depends on `@mastra/*` for runtime; the docs MCP is a separate IDE tool via `npx`.

## Prefer skills for day-to-day Mastra coding

Mastra’s own docs say **skills outperform the MCP docs server** for general coding; use MCP when you need its tools (e.g. migration).

```bash
npx skills add mastra-ai/skills
npx skills update mastra
```

Repo already has `.claude/skills/mastra/` for iPix-specific patterns — keep using that for product work; use upstream skills/MCP for API freshness.

## Remote fallback (if local stdio still fails)

From [Build with AI](https://mastra.ai/docs/getting-started/build-with-ai):

- Remote URL: `https://mastra.mcp.kapa.ai` (Google auth for rate limits)
- Prefer local when possible

## MCP tools (once connected)

From the [package README](https://github.com/mastra-ai/mastra/tree/main/packages/mcp-docs-server):

| Tool | Use |
|---|---|
| `mastraDocs` | Fetch docs by path |
| `mastraMigration` | Version upgrade guides |
| `getMastraHelp` | Entry / workflow |
| `listMastraPackages` / `getMastraExports` / `getMastraExportDetails` | Installed package APIs (`projectPath` required) |
| `readMastraDocs` / `searchMastraDocs` | Embedded package docs |
| Course tools | Interactive Mastra course |

## Longer-term

Reinstall or repair Cursor so `/usr/share/cursor/resources/app/resources/lib` exists — otherwise **any** MCP that uses bare `npx` can hit the same ENOENT.
