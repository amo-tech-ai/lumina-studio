#!/usr/bin/env bash
# Stdio bridge to a hosted Cloudflare MCP endpoint with bearer token.
# Official Option 2: https://github.com/cloudflare/mcp — API token via Authorization header.
# Usage: cf-mcp-bridge.sh <mcp-url>
# Token: app/.env.local CLOUDFLARE_API_TOKEN (same as wrangler whoami).
set -euo pipefail

MCP_URL="${1:-}"
if [[ -z "$MCP_URL" ]]; then
  echo "cf-mcp-bridge: usage: cf-mcp-bridge.sh <mcp-url>" >&2
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SCRIPTS_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="${ROOT}/app/.env.local"

if [[ -z "${CLOUDFLARE_API_TOKEN:-}" && -f "$ENV_FILE" ]]; then
  CLOUDFLARE_API_TOKEN="$(
    grep -E '^CLOUDFLARE_API_TOKEN=' "$ENV_FILE" | tail -1 | cut -d= -f2- | sed 's/^["'\'']//;s/["'\'']$//'
  )"
fi

if [[ -z "${CLOUDFLARE_API_TOKEN:-}" ]]; then
  echo "cf-mcp-bridge: CLOUDFLARE_API_TOKEN not set (expected in app/.env.local)" >&2
  exit 1
fi

MCP_REMOTE="${SCRIPTS_DIR}/node_modules/.bin/mcp-remote"
if [[ ! -x "$MCP_REMOTE" ]]; then
  echo "cf-mcp-bridge: mcp-remote not installed — run: cd ${SCRIPTS_DIR} && npm install" >&2
  exit 1
fi

export CF_AUTH_HEADER="Bearer ${CLOUDFLARE_API_TOKEN}"

# http-only: skip deprecated SSE probe; Authorization header bypasses OAuth flow.
exec "$MCP_REMOTE" "$MCP_URL" \
  --transport http-only \
  --header "Authorization:${CF_AUTH_HEADER}"
