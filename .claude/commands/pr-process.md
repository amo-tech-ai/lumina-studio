---
description: "Alias for /pr — iPix PR orchestrator (auto-detect, ask before commit)."
argument-hint: "[new|open|fix|ship|ready|status|resolve|clean] [PR#]"
allowed-tools: ["Bash", "Glob", "Grep", "Read", "Task"]
---

# /pr-process — alias for `/pr`

**Use `/pr` as the primary command.** This file exists for backward compatibility.

**Canonical:** `.claude/commands/pr.md`

**Arguments:** `$ARGUMENTS` — same as `/pr`.

Follow **every** step in `.claude/commands/pr.md` exactly. The orchestrator detects state, delegates to subcommands, and **asks before commit/push/resolve** unless the user invoked `/pr ship` or `/pr-process ship`.
