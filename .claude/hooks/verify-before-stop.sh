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
# changes — falls back to 22 (today's actual floor) if .nvmrc is unreadable
# OR non-numeric (e.g. an `lts/*` alias): sed leaves non-matching input
# unchanged rather than empty, so an alias would otherwise reach the `-lt`
# comparison below as a string, which bash treats as a silently-false test
# (stderr "integer expression expected", but the gate bypasses regardless).
REQUIRED_NODE_MAJOR=$(sed -E 's/^v?([0-9]+).*/\1/' "$REPO_ROOT/app/.nvmrc" 2>/dev/null || true)
if ! [[ "$REQUIRED_NODE_MAJOR" =~ ^[0-9]+$ ]]; then
  REQUIRED_NODE_MAJOR=22
fi

# `node -v`'s output isn't guaranteed to be a bare `vNN...` line either (a
# wrapper/shim could prepend a warning, or the binary could be broken) —
# sed's non-matching-line passthrough would leave NODE_MAJOR non-numeric in
# that case too, exactly like the REQUIRED_NODE_MAJOR case above. Validate
# the same way so an unexpected `node -v` output is treated as "no node"
# (fails closed below) rather than reaching `-lt` as a string, which bash
# evaluates as a silently-false test.
current_node_major() {
  local major
  major=$(node -v 2>/dev/null | sed -E 's/^v([0-9]+).*/\1/')
  if [[ "$major" =~ ^[0-9]+$ ]]; then
    echo "$major"
  fi
}

# Check whatever Node is already active on PATH first. Only fall back to nvm
# if that doesn't already satisfy the floor — sourcing nvm.sh activates its
# own default/last-used version immediately, which can be OLDER than a
# perfectly good Node already active (e.g. a global/Volta install ahead of
# nvm on PATH); if `nvm use` then also fails to find the required major
# installed, that older nvm version would be left active, causing a false
# block even though the original PATH was already fine.
NODE_MAJOR=$(current_node_major)

if [ -z "$NODE_MAJOR" ] || [ "$NODE_MAJOR" -lt "$REQUIRED_NODE_MAJOR" ]; then
  export NVM_DIR="$HOME/.nvm"
  if [ -s "$NVM_DIR/nvm.sh" ]; then
    # shellcheck disable=SC1091
    \. "$NVM_DIR/nvm.sh"
    nvm use "$REQUIRED_NODE_MAJOR" >/dev/null 2>&1
  fi
  NODE_MAJOR=$(current_node_major)
fi

# Fail closed with a clear, actionable message rather than silently running
# typecheck under the wrong Node version.
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
