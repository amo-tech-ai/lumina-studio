#!/bin/bash
# PreToolUse(Edit|Write) — advisory only (matches the existing graphify hook pattern:
# additionalContext, no blocking). supabase/functions/_shared/** is imported by every
# edge function, so a change here has repo-wide blast radius worth flagging up front.

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

if [[ "$FILE_PATH" == *"supabase/functions/_shared/"* ]]; then
  echo '{"hookSpecificOutput":{"hookEventName":"PreToolUse","additionalContext":"This file is imported by every edge function (auth/cors/response/gemini shared helpers). Check callers with graphify before changing its signature or behavior."}}'
fi

exit 0
