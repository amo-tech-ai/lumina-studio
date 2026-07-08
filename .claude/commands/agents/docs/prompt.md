Create a Claude Code slash command:

`/claude-code-audit`

File:

`.claude/commands/claude-code-audit.md`

Purpose:

Audit our Claude Code setup against official Claude best practices for context windows, workflows, tools, agents, hooks, commands, memory, and efficient development.

Official docs to review:

* https://platform.claude.com/docs/en/build-with-claude/context-windows
* https://code.claude.com/docs/en/context-window
* https://code.claude.com/docs/en/best-practices
* https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices
* https://code.claude.com/docs/en/common-workflows

Audit scope:

* `.claude/`
* `CLAUDE.md`
* slash commands
* skills
* hooks
* agents
* MCP tools
* worktree workflow
* PR review workflow
* context/memory usage
* permissions/settings
* task lifecycle
* testing workflow
* Supabase/Mastra/CopilotKit/Gemini workflows

Check:

1. Are commands lean and reusable?
2. Are skills organized and not duplicated?
3. Is context kept small and relevant?
4. Are long tasks split correctly?
5. Are hooks useful or noisy?
6. Are MCP tools used correctly?
7. Are agents/tools safe and scoped?
8. Are worktrees used consistently?
9. Are PR/testing commands efficient?
10. Are instructions too long, stale, or conflicting?

Output:

* Executive summary
* Best-practice scorecard
* What is working
* Red flags
* Context waste
* Slow workflow causes
* Missing commands
* Duplicate commands/skills
* Unsafe permissions
* Improvements

Use scoring:

* 🟢 90–100% best practice
* 🟡 70–89% needs improvement
* 🔴 0–69% risky/inefficient
* ⚪ not implemented

For every finding include:

* Severity
* Evidence
* Why it matters
* Recommended fix
* File path

Create a fix plan:

* P0 must fix
* P1 improve this sprint
* P2 nice to have

Also suggest better commands for:

* task implementation
* PR comment fixing
* Supabase verification
* user journey testing
* forensic audits
* Mermaid architecture audits
* release readiness

Rules:

* Verify against official docs.
* Do not guess.
* Keep recommendations lean.
* Prefer fewer, stronger commands.
* Do not over-engineer.
* Focus on faster development, less context waste, better testing, and safer PRs.
Also audit Claude Code skills deeply.

Skills audit scope:
- `.claude/skills/`
- skill names and folder structure
- SKILL.md clarity
- trigger conditions
- overlap between skills
- stale instructions
- duplicated workflows
- missing verification steps
- missing official-doc references
- overly long skills that waste context
- skills that should become slash commands
- commands that should become skills
- skills that conflict with CLAUDE.md or project rules

Check:
1. Which skills are useful and should stay?
2. Which skills are duplicated or stale?
3. Which skills are too broad?
4. Which skills are too long and waste context?
5. Which skills need examples?
6. Which skills need MCP/tool usage guidance?
7. Which skills need test/verification checklists?
8. Which skills should be split?
9. Which skills should be merged?
10. Which missing skills would speed up development?

For every skill, score:
- Purpose clarity %
- Trigger accuracy %
- Context efficiency %
- Reusability %
- Safety %
- Testing guidance %
- Overall %

Output a skills scorecard:

| Skill | Purpose | Trigger | Context Efficiency | Safety | Testing | Overall | Status |
|---|---:|---:|---:|---:|---:|---:|---|

Use:
🟢 keep
🟡 improve
🔴 remove or rewrite
⚪ missing

Create a skill improvement plan:
- P0 skills to fix now
- P1 skills to improve this sprint
- P2 new skills to create later

Suggest:
- skills to merge
- skills to split
- skills to delete
- skills to rewrite
- skills to convert into slash commands
- slash commands to convert into skills

Goal:
Reduce context waste, improve reliability, speed up implementation, and make Claude Code use the right skill only when needed.