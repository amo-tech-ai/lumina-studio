#!/usr/bin/env bash
# Fetch Seer-by-Sentry inline PR comments (and optional issue comments).
# Usage: fetch-seer-comments.sh <pr_number> [owner] [repo]
set -euo pipefail

PR="${1:?usage: $0 <pr_number> [owner] [repo]}"
OWNER="${2:-amo-tech-ai}"
REPO="${3:-lumina-studio}"

echo "## Inline review comments (PR #$PR)"
gh api "repos/$OWNER/$REPO/pulls/$PR/comments" --paginate \
  --jq '[.[] | select(.user.login == "seer-by-sentry[bot]") |
      {id, path, line, original_line, html_url, body}] |
    if length == 0 then "none" else . end'

echo
echo "## Issue/PR conversation comments"
gh api "repos/$OWNER/$REPO/issues/$PR/comments" --paginate \
  --jq '[.[] | select(.user.login == "seer-by-sentry[bot]") |
      {id, html_url, body: .body[0:500]}] |
    if length == 0 then "none" else . end'
