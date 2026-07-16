#!/bin/bash
# Stop — before Claude finishes a turn, if any app/src files changed (tracked or
# untracked), run typecheck + lint once and block the stop with the failure if
# either fails. Deliberately a single end-of-turn check rather than a per-edit
# PostToolUse hook: tsc --noEmit takes ~15s, and running it after every single
# Edit call would add that latency to every file save during active development.
# This gives the same "verify before declaring done" guarantee at a fraction of
# the cost. Matches CLAUDE.md's "Verify before declaring done" working principle.

set -o pipefail
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"
[ -z "$REPO_ROOT" ] && exit 0

CHANGED=$(git -C "$REPO_ROOT" status --porcelain -- app/src 2>/dev/null | awk '{print $2}')
[ -z "$CHANGED" ] && exit 0

cd "$REPO_ROOT/app" || exit 0

# Non-interactive shells skip ~/.bashrc's nvm sourcing, so `node`/`npm` on PATH
# can resolve to whatever version happens to be first on PATH (observed: v20,
# while `npm run typecheck`'s cf-typegen step needs wrangler's Node floor).
# Read the required major from app/.nvmrc (the repo's own source of truth)
# rather than hardcoding it, so this doesn't silently drift if the floor
# changes — falls back to 22 (today's actual floor) if .nvmrc is unreadable.
REQUIRED_NODE_MAJOR=$(sed -E 's/^v?([0-9]+).*/\1/' "$REPO_ROOT/app/.nvmrc" 2>/dev/null || true)
[ -z "$REQUIRED_NODE_MAJOR" ] && REQUIRED_NODE_MAJOR=22

export NVM_DIR="$HOME/.nvm"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  # shellcheck disable=SC1091
  \. "$NVM_DIR/nvm.sh"
  nvm use "$REQUIRED_NODE_MAJOR" >/dev/null 2>&1
fi

# Fail closed with a clear, actionable message rather than silently running
# typecheck under the wrong Node version — `nvm use`'s own exit status is
# ignored above (it fails when the version isn't installed, not just
# misconfigured), so verify the version that's actually active before
# spending ~15s on tsc.
NODE_MAJOR=$(node -v 2>/dev/null | sed -E 's/^v([0-9]+).*/\1/')
if [ -z "$NODE_MAJOR" ] || [ "$NODE_MAJOR" -lt "$REQUIRED_NODE_MAJOR" ]; then
  jq -n --arg reason "Pre-stop verification could not run: this hook requires Node ${REQUIRED_NODE_MAJOR}+ (wrangler types' floor, per app/.nvmrc) but $(node -v 2>/dev/null || echo 'no node binary') is active. Run \`nvm install ${REQUIRED_NODE_MAJOR}\` and retry." \
    '{"decision":"block","reason":$reason}'
  exit 0
fi

TYPECHECK_OUT=$(npm run typecheck 2>&1)
TYPECHECK_STATUS=$?

# Convert repo-root-relative paths (app/src/...) to app-relative (src/...) for eslint
LINT_FILES=$(echo "$CHANGED" | sed -n 's#^app/##p' | grep -E '\.(ts|tsx|js|jsx)$')
LINT_OUT=""
LINT_STATUS=0
if [ -n "$LINT_FILES" ]; then
  LINT_OUT=$(echo "$LINT_FILES" | xargs npx eslint 2>&1)
  LINT_STATUS=$?
fi

if [ "$TYPECHECK_STATUS" -ne 0 ] || [ "$LINT_STATUS" -ne 0 ]; then
  REASON="Pre-stop verification failed on changed app/src files."
  NL=$'\n'
  [ "$TYPECHECK_STATUS" -ne 0 ] && REASON="$REASON${NL}${NL}typecheck:${NL}$TYPECHECK_OUT"
  [ "$LINT_STATUS" -ne 0 ] && REASON="$REASON${NL}${NL}lint:${NL}$LINT_OUT"
  jq -n --arg reason "$REASON" '{"decision":"block","reason":$reason}'
  exit 0
fi

exit 0
