#!/bin/bash
# PreToolUse(Edit|Write) — block writes to secret-bearing files that aren't in
# Claude Code's built-in protected-path list (that list covers .npmrc/.gitconfig/etc,
# not .env or .infisical.json). Enforces CLAUDE.md's "AI keys are server-only" rule.

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

PROTECTED_PATTERNS=(".env" ".infisical.json")

for pattern in "${PROTECTED_PATTERNS[@]}"; do
  if [[ "$FILE_PATH" == *"$pattern"* && "$FILE_PATH" != *.example && "$FILE_PATH" != *.template ]]; then
    echo "Blocked: $FILE_PATH matches protected pattern '$pattern'. Secrets live in Infisical/Supabase Edge secrets, not in files Claude edits directly. If this is genuinely needed, ask the user to make the change." >&2
    exit 2
  fi
done

exit 0
