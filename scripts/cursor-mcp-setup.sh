#!/usr/bin/env bash
# Install ~/.cursor/mcp.json from repo template (.cursor/mcp.example.json).
# Never commit secrets or machine-specific paths — edit ~/.cursor/mcp.json locally after install.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SSOT="${ROOT}/.cursor/mcp.example.json"
TARGET="${HOME}/.cursor/mcp.json"
BACKUP_DIR="${HOME}/.cursor/backups"

if [[ ! -f "$SSOT" ]]; then
  echo "cursor-mcp-setup: missing template at ${SSOT}" >&2
  exit 1
fi

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

echo "Installed ${TARGET} from ${SSOT}"

echo "Clearing MCP tool caches..."
rm -rf "${HOME}/.cursor/projects/"*/mcps/* 2>/dev/null || true

echo ""
echo "=== Next steps (manual in Cursor UI) ==="
echo "1. Restart Cursor completely (quit + reopen)."
echo "2. Settings → MCP:"
echo "   - ENABLE user servers from mcp.json (mastra, cloudflare-*, copilotkit-docs, etc.)"
echo "   - DISABLE plugin-cloudflare-* MCP servers (use HTTP servers above instead)"
echo "   - KEEP plugin-linear-linear, plugin-supabase-supabase, plugin-vercel-plugin-vercel"
echo "3. Authenticate OAuth plugins when prompted (Linear, Supabase, Vercel)."
echo "4. Mastra MCP requires Node.js ≥ 22.13."
echo "5. Add env-backed stdio servers locally in ~/.cursor/mcp.json only (never commit keys)."
echo "   Example: firecrawl via scripts/mcp-env-bridge.sh + FIRECRAWL_API_KEY in .env.local"
