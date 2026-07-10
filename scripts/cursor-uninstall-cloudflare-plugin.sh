#!/usr/bin/env bash
# Full Cloudflare marketplace plugin removal + MCP state cleanup.
# Run while Cursor is QUIT — if Cursor is running it re-writes plugin 407 on exit.
#
# Keeps ~/.cursor/mcp.json user servers (cloudflare-api, docs, agents-sdk).
# See: .cursor/docs/mcp.md
set -euo pipefail

CLOUDFLARE_PLUGIN_ID="407"
GLOBAL_DB="${HOME}/.config/Cursor/User/globalStorage/state.vscdb"
BACKUP_DIR="${HOME}/.cursor/backups"
FORCE=false
[[ "${1:-}" == "--force" ]] && FORCE=true

if pgrep -x cursor >/dev/null 2>&1 || pgrep -f '/usr/share/cursor/cursor' >/dev/null 2>&1; then
  if ! $FORCE; then
    echo "ERROR: Cursor is still running." >&2
    echo "Quit Cursor completely (File → Quit), then re-run:" >&2
    echo "  bash scripts/cursor-uninstall-cloudflare-plugin.sh" >&2
    echo "Or pass --force if you will quit immediately after." >&2
    exit 1
  fi
  echo "WARNING: Cursor is running — quit immediately after this script or plugin 407 may return." >&2
fi

mkdir -p "${BACKUP_DIR}"
STAMP="$(date +%Y%m%d-%H%M%S)"
cp "${GLOBAL_DB}" "${BACKUP_DIR}/state.vscdb.${STAMP}.bak"
cp "${GLOBAL_DB}" "${HOME}/.config/Cursor/User/globalStorage/state.vscdb.backup"

python3 - "${GLOBAL_DB}" "${CLOUDFLARE_PLUGIN_ID}" <<'PY'
import base64
import json
import sqlite3
import sys

db_path, plugin_id = sys.argv[1], sys.argv[2]
con = sqlite3.connect(db_path)
cur = con.cursor()

# 1) Remove plugin 407 from every installedIds key
cur.execute("SELECT key, value FROM ItemTable WHERE key LIKE 'cursor.plugins.installedIds.%'")
for key, value in cur.fetchall():
    try:
        items = json.loads(value)
    except json.JSONDecodeError:
        continue
    if not isinstance(items, list):
        continue
    filtered = [item for item in items if item.get("id") != plugin_id]
    if len(filtered) != len(items):
        cur.execute("UPDATE ItemTable SET value=? WHERE key=?", (json.dumps(filtered), key))
        print(f"Removed plugin {plugin_id} from {key}")

# 2) OAuth: drop plugin-cloudflare + stale project bridge servers; keep user HTTP servers
PLUGIN_CF = base64.b64encode(b"[plugin-cloudflare").decode()  # W3BsdWdpbi1jbG91ZGZsYXJl
USER_CF_KEEP = {
    base64.b64encode(b"[user-cloudflare-api").decode(),
    base64.b64encode(b"[user-cloudflare-docs").decode(),
    base64.b64encode(b"[user-cloudflare-agents-sdk").decode(),
}
STALE_PREFIXES = (
    "[project-0-ipix-cloudflare-",
    "[user-cloudflare-workers-",
    "[user-cloudflare-observability",
    "[user-cloudflare-ai-gateway",
)

def _decode_key(key: str) -> str:
    # mcpOAuth.global.<b64blob>...
    parts = key.split(".", 2)
    if len(parts) < 3:
        return key
    blob = parts[2].split(" ", 1)[0]
    try:
        pad = "=" * (-len(blob) % 4)
        return base64.b64decode(blob + pad).decode("utf-8", "replace")
    except Exception:
        return key

cur.execute("SELECT key FROM ItemTable WHERE key LIKE 'mcpOAuth.%'")
deleted_oauth = 0
for (key,) in cur.fetchall():
    decoded = _decode_key(key)
    if any(decoded.startswith(p) for p in STALE_PREFIXES):
        cur.execute("DELETE FROM ItemTable WHERE key=?", (key,))
        deleted_oauth += 1
        continue
    if PLUGIN_CF in key:
        cur.execute("DELETE FROM ItemTable WHERE key=?", (key,))
        deleted_oauth += 1
print(f"Deleted {deleted_oauth} plugin/stale OAuth keys")

# 3) Prune knownServerIds — remove plugin + stale bridge/project cloudflare entries
KEEP_USER_CF = {
    "user-cloudflare-api",
    "user-cloudflare-docs",
    "user-cloudflare-agents-sdk",
}
cur.execute("SELECT value FROM ItemTable WHERE key=?", ("mcpService.knownServerIds",))
row = cur.fetchone()
if row:
    ids = json.loads(row[0])
    pruned = [
        sid for sid in ids
        if not (
            sid.startswith("plugin-cloudflare")
            or (sid.startswith("project-0-ipix-cloudflare-"))
            or (sid.startswith("user-cloudflare-") and sid not in KEEP_USER_CF)
        )
    ]
    if len(pruned) != len(ids):
        cur.execute(
            "UPDATE ItemTable SET value=? WHERE key=?",
            (json.dumps(pruned), "mcpService.knownServerIds"),
        )
        removed = sorted(set(ids) - set(pruned))
        print(f"Pruned knownServerIds ({len(removed)}): {', '.join(removed[:8])}{'…' if len(removed)>8 else ''}")

con.commit()
con.close()
PY

echo "Removing marketplace plugin cache..."
rm -rf "${HOME}/.cursor/plugins/cache/cursor-public/cloudflare"

echo "Removing plugin-cloudflare MCP caches (plugins/cache)..."
find "${HOME}/.cursor/plugins/cache" -type d -name 'plugin-cloudflare*' -prune -exec rm -rf {} + 2>/dev/null || true

echo "Removing plugin-cloudflare MCP caches (projects)..."
find "${HOME}/.cursor/projects" -type d -name 'plugin-cloudflare-*' -prune -exec rm -rf {} + 2>/dev/null || true

echo "Removing Cloudflare MCP OAuth attempt files..."
python3 - <<'PY'
import glob, json, os
for path in glob.glob(os.path.expanduser("~/.config/Cursor/User/globalStorage/mcp-oauth-attempts/*.json")):
    try:
        data = json.load(open(path))
    except Exception:
        continue
    ident = data.get("identifier", "")
    if "plugin-cloudflare" in ident or "cloudflare" in ident.lower():
        os.remove(path)
        print("Removed oauth attempt:", os.path.basename(path))
PY

echo ""
echo "Done. ~/.cursor/mcp.json was NOT modified (your manual config is preserved)."
echo "Ensure it has only HTTP cloudflare servers — run: bash scripts/cf-mcp-setup.sh"
echo "Then start Cursor → Customize → MCP → Connect cloudflare-api if needed."
