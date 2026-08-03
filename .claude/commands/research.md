---
description: "Research before code — evidence report, reuse first, custom last."
argument-hint: "[IPI-XXX|topic|path]"
allowed-tools: ["Bash", "Glob", "Grep", "Read", "WebSearch", "WebFetch", "Task"]
---

# /research — AI Research before implementation

**Arguments:** `$ARGUMENTS` (IPI id, feature topic, or path)

**Load skill:** Read `.claude/skills/ai-research/SKILL.md` and follow it exactly.  
**Playbook:** `docs/process/03-ai-research-playbook.md`

## Steps

1. Parse `$ARGUMENTS` into task + user outcome.  
2. Run the skill workflow (code → Linear/PRs → dashboard → docs → GitHub → SDK/CLI/MCP).  
3. Output the report template (concise table).  
4. Set MVP stage + verdict.  
5. **Stop** — do not implement unless user says “implement” after the report.

**Peers:** `/efficient` to rank approaches after research; `/task` to implement.
