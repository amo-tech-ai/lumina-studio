---
name: copilotkit-self-update
description: Use when the user wants to update, refresh, or reinstall the CopilotKit agent SKILLS (the SKILL.md files that teach this agent about CopilotKit). NOT for updating the CopilotKit codebase or project — this is specifically about refreshing the skills/knowledge this agent has loaded. Triggers on "update copilotkit skills", "update skills", "refresh skills", "skills are stale", "skills are outdated", "get latest skills", "my copilotkit knowledge is wrong", "copilotkit APIs changed", "skills seem old", "wrong API names", "reinstall skills", "skills not working right", "update your copilotkit knowledge".
version: 1.0.0
user_invocable: true
argument_hint: ""
---

# Update CopilotKit Skills

Run this command to pull the latest CopilotKit skills from GitHub:

```bash
npx skills add copilotkit/CopilotKit --full-depth -y
```

This does a fresh clone every time — it always gets the latest version regardless of what's cached.

This works across all tools — Claude Code, Codex, Cursor, Gemini CLI, and others. It detects which tools are installed and updates skills for each.

## iPix consolidation (after upstream pull)

Upstream installs individual skills under `.agents/skills/` (`copilotkit-setup`, `runtime`, `react-core`, …).
iPix uses **one hub**: `.claude/skills/copilotkit/` with `references/` subfolders.

After `npx skills add`, re-sync into the hub:

```bash
# Topic guides (setup, develop, debug, …) — already under references/<topic>/
# Sync package-level indexes + deep refs:
cp .agents/skills/runtime/SKILL.md .claude/skills/copilotkit/references/runtime/runtime.md
rsync -a .agents/skills/runtime/references/ .claude/skills/copilotkit/references/runtime/references/
cp .agents/skills/react-core/SKILL.md .claude/skills/copilotkit/references/react-core/react-core.md
rsync -a .agents/skills/react-core/references/ .claude/skills/copilotkit/references/react-core/references/
```

Remove any re-created symlinks in `.claude/skills/` that point at `.agents/skills/copilotkit-*` — only the `copilotkit` hub should remain.

After the command completes, **start a new session** in your tool to pick up the changes.

## When to Suggest This

- User says the skills have wrong API names or outdated information
- User reports that a CopilotKit API doesn't match what the skill says
- User explicitly asks to update or refresh skills
- A new CopilotKit version was released and skills may be stale
