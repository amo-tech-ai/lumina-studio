#!/usr/bin/env bash
# Stdio bridge to Cloudflare API MCP with bearer token (bypasses broken Cursor OAuth on mcp.cloudflare.com).
# Token: app/.env.local CLOUDFLARE_API_TOKEN (same as wrangler whoami).
set -euo pipefail

exec "$(cd "$(dirname "$0")" && pwd)/cf-mcp-bridge.sh" "https://mcp.cloudflare.com/mcp"
