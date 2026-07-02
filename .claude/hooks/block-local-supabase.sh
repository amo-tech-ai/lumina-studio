#!/bin/bash
# PreToolUse(Bash) — block local Supabase stack commands. AGENTS.md's remote-only
# policy exists because ~97 historical migrations don't replay cleanly on a fresh
# local DB; the remote project is the only source of truth.

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

if echo "$COMMAND" | grep -qE '(^|[;&|])[[:space:]]*((npx|bunx)[[:space:]]+|pnpm[[:space:]]+dlx[[:space:]]+)?supabase[[:space:]]+(start|stop|db[[:space:]]+reset)([[:space:]]|$)'; then
  echo "Blocked: '$COMMAND' runs the local Supabase stack. This repo is remote-only (see AGENTS.md) — historical migrations don't replay cleanly locally. Use npm run supabase:verify* / supabase:push against the remote project instead." >&2
  exit 2
fi

exit 0
