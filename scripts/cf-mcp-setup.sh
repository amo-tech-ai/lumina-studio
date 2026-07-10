#!/usr/bin/env bash
# Install ~/.cursor/mcp.json Cloudflare entries (official hosted MCP).
# https://github.com/cloudflare/mcp
#
# Default: HTTP-only (docs + agents-sdk + api OAuth) — connects instantly in Cursor.
# Optional: --api-token uses CLOUDFLARE_API_TOKEN bearer (bypasses OAuth; recommended if Connect fails).
# Optional: --with-bridges for bindings/builds/observability/ai-gateway stdio bridges
# (slower cold start; disable in Cursor if they error on timeout).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SCRIPTS="${ROOT}/scripts"
TARGET="${HOME}/.cursor/mcp.json"
WITH_BRIDGES=false
API_TOKEN=false
for arg in "$@"; do
  case "$arg" in
    --with-bridges) WITH_BRIDGES=true ;;
    --api-token) API_TOKEN=true ;;
  esac
done

if $WITH_BRIDGES || $API_TOKEN; then
  if [[ ! -f "${ROOT}/app/.env.local" ]] || ! grep -qE '^CLOUDFLARE_API_TOKEN=' "${ROOT}/app/.env.local"; then
    echo "cf-mcp-setup: set CLOUDFLARE_API_TOKEN in app/.env.local" >&2
    exit 1
  fi
  echo "Installing mcp-remote (pinned)..."
  (cd "$SCRIPTS" && npm install --silent)
  chmod +x "${SCRIPTS}/cf-mcp-bridge.sh" "${SCRIPTS}/cf-mcp-api-bridge.sh"
fi

python3 - "$TARGET" "$SCRIPTS" "$WITH_BRIDGES" "$API_TOKEN" <<'PY'
import json
import sys
from pathlib import Path

target = Path(sys.argv[1])
scripts = Path(sys.argv[2])
with_bridges = sys.argv[3] == "true"
api_token = sys.argv[4] == "true"
api_bridge = str(scripts / "cf-mcp-api-bridge.sh")
bridge = str(scripts / "cf-mcp-bridge.sh")

current = json.loads(target.read_text()) if target.exists() else {"mcpServers": {}}
servers = current.setdefault("mcpServers", {})

cf = {
    "cloudflare-docs": {
        "type": "http",
        "url": "https://docs.mcp.cloudflare.com/mcp",
    },
    "cloudflare-agents-sdk": {
        "type": "http",
        "url": "https://agents.cloudflare.com/mcp",
    },
}

if api_token:
    # Option 2: bearer token via stdio bridge (bypasses Cursor OAuth)
    cf["cloudflare-api"] = {
        "command": api_bridge,
        "args": [],
    }
else:
    # Option 1: OAuth — click Connect in Cursor Customize → MCP
    cf["cloudflare-api"] = {
        "type": "http",
        "url": "https://mcp.cloudflare.com/mcp",
    }

if with_bridges:
    cf.update({
        "cloudflare-workers-bindings": {
            "command": bridge,
            "args": ["https://bindings.mcp.cloudflare.com/mcp"],
        },
        "cloudflare-workers-builds": {
            "command": bridge,
            "args": ["https://builds.mcp.cloudflare.com/mcp"],
        },
        "cloudflare-observability": {
            "command": bridge,
            "args": ["https://observability.mcp.cloudflare.com/mcp"],
        },
        "cloudflare-ai-gateway": {
            "command": bridge,
            "args": ["https://ai-gateway.mcp.cloudflare.com/mcp"],
        },
    })
else:
    for name in (
        "cloudflare-workers-bindings",
        "cloudflare-workers-builds",
        "cloudflare-observability",
        "cloudflare-ai-gateway",
    ):
        servers.pop(name, None)

servers.update(cf)
target.write_text(json.dumps({"mcpServers": servers}, indent=2) + "\n")
print(f"Updated {target} (bridges={'on' if with_bridges else 'off'})")
PY

echo ""
echo "Next: quit Cursor → reopen → Settings → MCP"
if $API_TOKEN; then
  echo "  cloudflare-api uses CLOUDFLARE_API_TOKEN from app/.env.local (no OAuth Connect needed)"
else
  echo "  2. ENABLE cloudflare-api → Connect / OAuth when prompted"
fi
echo "  ENABLE cloudflare-docs + cloudflare-agents-sdk"
if $WITH_BRIDGES; then
  echo "  4. ENABLE bridge servers; if they still error, rerun without --with-bridges"
fi
