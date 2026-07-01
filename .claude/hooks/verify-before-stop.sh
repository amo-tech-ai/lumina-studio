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
  [ "$TYPECHECK_STATUS" -ne 0 ] && REASON="$REASON\n\ntypecheck:\n$TYPECHECK_OUT"
  [ "$LINT_STATUS" -ne 0 ] && REASON="$REASON\n\nlint:\n$LINT_OUT"
  jq -n --arg reason "$REASON" '{"decision":"block","reason":$reason}'
  exit 0
fi

exit 0
