# MCP (Cursor)

## Cloudflare — canonical setup

**Rule:** `.cursor/rules/cloudflare-mcp.mdc`  
**SSOT template:** `tasks/cloudflare/cursor-mcp-cloudflare.json`  
**Repo template:** `.cursor/mcp.json` (HTTP URLs only, no secrets)  
**Live config:** `~/.cursor/mcp.json` (never commit — use `cf-mcp-setup.sh`)

### Three user servers only

| Server | URL / bridge | Auth |
|--------|----------------|------|
| `cloudflare-docs` | `https://docs.mcp.cloudflare.com/mcp` | None |
| `cloudflare-agents-sdk` | `https://agents.cloudflare.com/mcp` | None |
| `cloudflare-api` | HTTP OAuth **or** `cf-mcp-api-bridge.sh` | OAuth or `CLOUDFLARE_API_TOKEN` |

Install/refresh:

```bash
# OAuth — click Connect in Cursor Customize → MCP
bash scripts/cf-mcp-setup.sh

# Account token (cfat_) — reads app/.env.local via grep (recommended here)
bash scripts/cf-mcp-setup.sh --api-token
```

Verify account token (`cfat_`) — **not** `/user/tokens/verify`:

```bash
curl -s "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/tokens/verify" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" | jq '.result.status'
```

`curl -I https://mcp.cloudflare.com/mcp` → **401** without auth is normal ([Cloudflare MCP](https://github.com/cloudflare/mcp)).

### Remove duplicate marketplace plugin (required)

The Cloudflare **marketplace plugin** (id `407`) registers `plugin-cloudflare-*` duplicates. Uninstall UI is broken.

```bash
# 1. File → Quit Cursor (all windows) — mandatory or plugin returns
bash scripts/cursor-uninstall-cloudflare-plugin.sh
bash scripts/cf-mcp-setup.sh --api-token   # or without --api-token for OAuth
# 2. Reopen Cursor — use user-cloudflare-* only, ignore plugin-* servers
```

If `plugin-cloudflare-*` reappear after reopening, Cursor was still running during cleanup — quit and re-run the script.

## Mastra docs MCP

**Rule:** `.cursor/rules/mastra-mcp.mdc`

```json
"mastra": {
  "type": "stdio",
  "command": "npx",
  "args": ["-y", "@mastra/mcp-docs-server@latest"]
}
```

Requires **Node ≥ 22.13**. Enable in Settings → MCP after config change; start a new chat.

## Manual cleanup paths (if script is not enough)

| Step | Path | Action |
|------|------|--------|
| 1 | `~/.config/Cursor/User/globalStorage/state.vscdb` | Backup; remove plugin `407` from `cursor.plugins.installedIds.*` |
| 2 | `~/.cursor/plugins/cache/cursor-public/cloudflare/` | `rm -rf` |
| 3 | `~/.cursor/projects/**/mcps/plugin-cloudflare-*` | `find … -exec rm -rf` |
| 4 | OAuth (optional) | Delete `mcpOAuth.*` keys for `plugin-cloudflare` only |
| — | `~/.cursor/mcp.json` | **Keep** — run `cf-mcp-setup.sh` to refresh Cloudflare entries |

Reference: [Cloudflare MCP](https://github.com/cloudflare/mcp) · [Build with AI (Mastra)](https://mastra.ai/docs/getting-started/build-with-ai)

