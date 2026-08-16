#!/usr/bin/env bash
# git pre-commit hook: branch safety guard
# Prevents committing docs.json changes on non-docs branches and catches
# when the working directory doesn't match the intended branch.
set -e

BRANCH=$(git branch --show-current)
if [ -z "$BRANCH" ]; then
  echo "⚠️  Detached HEAD — commit anyway? (y/N)"
  read -r reply
  [ "$reply" = "y" ] || exit 1
fi

# Block docs/docs.json on non-docs branches
if git diff --cached --name-only | grep -q '^docs/docs\.json$'; then
  case "$BRANCH" in
    docs/*|chore/docs-*)
      echo "✅ docs/docs.json on docs branch: $BRANCH"
      ;;
    *)
      echo "🔴 docs/docs.json staged for commit on branch: $BRANCH"
      echo "   AGENTS.md rule #1: docs-only changes belong in docs/* PRs"
      echo "   Unstage: git reset HEAD docs/docs.json"
      exit 1
      ;;
  esac
fi

echo "✅ Branch: $BRANCH — pre-commit safety OK"
