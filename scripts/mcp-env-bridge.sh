#!/usr/bin/env bash
# Launch an MCP server with a secret read from repo .env.local (never hardcode in mcp.json).
# Usage: mcp-env-bridge.sh <ENV_VAR_NAME> <command> [args...]
set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "mcp-env-bridge: usage: mcp-env-bridge.sh <ENV_VAR_NAME> <command> [args...]" >&2
  exit 1
fi

VAR_NAME="$1"
shift

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${ROOT}/.env.local"

if [[ -z "${!VAR_NAME:-}" && -f "$ENV_FILE" ]]; then
  VALUE="$(
    grep -E "^${VAR_NAME}=" "$ENV_FILE" | tail -1 | cut -d= -f2- | sed 's/^["'\'']//;s/["'\'']$//'
  )"
  if [[ -n "$VALUE" ]]; then
    export "${VAR_NAME}=${VALUE}"
  fi
fi

if [[ -z "${!VAR_NAME:-}" ]]; then
  echo "mcp-env-bridge: ${VAR_NAME} not set (expected in ${ENV_FILE})" >&2
  exit 1
fi

exec "$@"
