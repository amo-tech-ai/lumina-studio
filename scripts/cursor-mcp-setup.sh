#!/usr/bin/env bash
# Reset Cursor MCP + plugin caches and install canonical ~/.cursor/mcp.json from repo SSOT.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SSOT="${ROOT}/tasks/intelligence/ai/cursor-mcp.json"
TARGET="${HOME}/.cursor/mcp.json"
BACKUP_DIR="${HOME}/.cursor/backups"

if [[ ! -f "$SSOT" ]]; then
  echo "cursor-mcp-setup: missing SSOT at ${SSOT}" >&2
  exit 1
fi

chmod +x "${ROOT}/scripts/mcp-env-bridge.sh"
chmod +x "${ROOT}/scripts/cf-mcp-bridge.sh"
chmod +x "${ROOT}/scripts/cf-mcp-api-bridge.sh"

mkdir -p "${HOME}/.cursor" "${BACKUP_DIR}"

if [[ -f "$TARGET" ]]; then
  STAMP="$(date +%Y%m%d-%H%M%S)"
  cp "$TARGET" "${BACKUP_DIR}/mcp.json.${STAMP}.bak"
  echo "Backed up existing mcp.json → ${BACKUP_DIR}/mcp.json.${STAMP}.bak"
fi

python3 - "$SSOT" "$TARGET" <<'PY'
import json
import sys

src, dst = sys.argv[1], sys.argv[2]
with open(src) as f:
    data = json.load(f)

servers = data.get("mcpServers", {})
with open(dst, "w") as f:
    json.dump({"mcpServers": servers}, f, indent=2)
    f.write("\n")
PY

echo "Installed ${TARGET} from repo SSOT"

echo "Clearing MCP tool caches..."
rm -rf "${HOME}/.cursor/projects/"*/mcps/* 2>/dev/null || true

echo "Clearing plugin download cache (re-fetches on next Cursor start)..."
rm -rf "${HOME}/.cursor/plugins/cache"/* 2>/dev/null || true

echo ""
echo "=== Next steps (manual in Cursor UI) ==="
echo "1. Restart Cursor completely (quit + reopen)."
echo "2. Settings → MCP:"
echo "   - ENABLE user servers from mcp.json (firecrawl, mastra, cloudflare-*, etc.)"
echo "   - DISABLE plugin-cloudflare-* MCP servers (OAuth/SSE broken — use stdio bridges)"
echo "   - KEEP plugin-linear-linear, plugin-supabase-supabase, plugin-vercel-plugin-vercel"
echo "3. Authenticate OAuth plugins when prompted (Linear, Supabase, Vercel)."
echo "4. Confirm secrets exist in ${ROOT}/.env.local:"
echo "   FIRECRAWL_API_KEY, MORPH_API_KEY (optional), LINEAR_API_KEY"
echo "   and ${ROOT}/app/.env.local: CLOUDFLARE_API_TOKEN"
echo ""
echo "Removed from old config (broken after reinstall):"
echo "  - mdeai gemini/google MCP scripts (directory empty)"
echo "  - optibot-mcp-bridge.sh (missing)"
echo "  - mcp-pandoc (needs: curl -LsSf https://astral.sh/uv/install.sh | sh)"
echo "  - hardcoded API keys in mcp.json (now read via mcp-env-bridge.sh)"
