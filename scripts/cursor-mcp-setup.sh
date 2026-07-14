#!/usr/bin/env bash
# Install ~/.cursor/mcp.json from repo template (.cursor/mcp.example.json).
# Merges template servers into any existing local config (preserves env-backed servers).
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
  # Nanoseconds avoid collisions when the script is re-run within the same second.
  STAMP="$(date +%Y%m%d-%H%M%S).$(date +%N)"
  BACKUP_PATH="${BACKUP_DIR}/mcp.json.${STAMP}.bak"
  while [[ -e "$BACKUP_PATH" ]]; do
    STAMP="$(date +%Y%m%d-%H%M%S).$(date +%N)-$$"
    BACKUP_PATH="${BACKUP_DIR}/mcp.json.${STAMP}.bak"
  done
  cp "$TARGET" "$BACKUP_PATH"
  echo "Backed up existing mcp.json → ${BACKUP_PATH}"
fi

python3 - "$SSOT" "$TARGET" <<'PY'
import json
import os
import sys
import tempfile

src, dst = sys.argv[1], sys.argv[2]

with open(src) as f:
    template = json.load(f)

servers = template.get("mcpServers")
if not isinstance(servers, dict):
    print(
        "cursor-mcp-setup: template mcpServers must be a JSON object "
        f"(got {type(servers).__name__})",
        file=sys.stderr,
    )
    sys.exit(1)

existing: dict = {}
if os.path.isfile(dst):
    try:
        with open(dst) as f:
            existing = json.load(f)
    except json.JSONDecodeError as e:
        print(f"cursor-mcp-setup: existing {dst} is invalid JSON: {e}", file=sys.stderr)
        sys.exit(1)

existing_servers = existing.get("mcpServers")
if existing_servers is None:
    existing_servers = {}
elif not isinstance(existing_servers, dict):
    print(
        "cursor-mcp-setup: existing mcpServers must be a JSON object "
        f"(got {type(existing_servers).__name__})",
        file=sys.stderr,
    )
    sys.exit(1)

# Template wins on key collision; local-only servers are preserved.
merged = {**existing_servers, **servers}
out = {k: v for k, v in existing.items() if k != "mcpServers"}
out["mcpServers"] = merged

dst_dir = os.path.dirname(dst) or "."
fd, tmp = tempfile.mkstemp(prefix="mcp.json.", suffix=".tmp", dir=dst_dir)
try:
    with os.fdopen(fd, "w") as f:
        json.dump(out, f, indent=2)
        f.write("\n")
    os.replace(tmp, dst)
except Exception:
    try:
        os.unlink(tmp)
    except OSError:
        pass
    raise
PY

echo "Installed ${TARGET} from ${SSOT} (merged mcpServers)"

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
echo "4. Mastra MCP requires Node.js ≥ 22.13.0."
echo "5. Add env-backed stdio servers locally in ~/.cursor/mcp.json only (never commit keys)."
echo "   Example: firecrawl via scripts/mcp-env-bridge.sh + FIRECRAWL_API_KEY in .env.local"
