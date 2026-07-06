---
title: Week 20 \u00b7 May 11\u201315, 2026
source: https://code.claude.com/docs/en/whats-new/2026-w20
path: /docs/en/whats-new/2026-w20
---

# Week 20 · May 11–15, 2026

> Manage every Claude Code session from one screen with agent view, keep Claude working toward a goal until a condition holds, and run fast mode on Opus 4.7 by default.

Releases [v2.1.139 → v2.1.142](https://code.claude.com/docs/en/changelog#2-1-139)
3 features · May 11–15

Agent view
research preview


`claude agents` opens one screen for every Claude Code session: what's running, what's blocked on your input, and what's done. Dispatch a bug fix, a pull request review, and a flaky-test investigation as three rows, keep working in another window, and step in only when a row needs you. Attach to any row to drop into its full conversation, then press `←` to return to the list. Each background session keeps running without a terminal attached.



Video: https://mintcdn.com/claude-code/ITvjicPxe1SM3GX7/images/whats-new/agent-view.mp4?fit=max&auto=format&n=ITvjicPxe1SM3GX7&q=85&s=0eefe6cbe75464c8f7902bba630ab7a4



Open the dashboard from your shell:
```bash
  claude agents
```

[Agent view](https://code.claude.com/docs/en/agent-view)

    /goal
v2.1.139


Set a completion condition and Claude keeps working toward it across turns without you prompting each step. After every turn, a fast model checks whether the condition holds; if not, Claude starts another turn instead of handing control back. Useful for substantial work with a verifiable end state, like migrating a module until every call site compiles and tests pass. The goal clears once the condition is met, and works in interactive, `-p`, and Remote Control.



Video: https://mintcdn.com/claude-code/ITvjicPxe1SM3GX7/images/whats-new/goal.mp4?fit=max&auto=format&n=ITvjicPxe1SM3GX7&q=85&s=6806df3780c548b93a02d6fa71da276b



Set a goal and let Claude run until it holds:
```text Claude Code
  > /goal all tests in test/auth pass and the lint step is clean
```

[Goals](https://code.claude.com/docs/en/goal)

Fast mode on Opus 4.7
research preview


`/fast` now runs on Opus 4.7 by default instead of Opus 4.6. Fast mode is a high-speed Opus configuration: the same model quality at about 2.5x the speed for a higher per-token cost, useful for rapid iteration and live debugging. Pricing is unchanged at \$30/\$150 per MTok, the same as Opus 4.6 fast mode. To pin fast mode to Opus 4.6, set `CLAUDE\_CODE\_OPUS\_4\_6\_FAST\_MODE\_OVERRIDE=1`.



![](https://mintcdn.com/claude-code/ITvjicPxe1SM3GX7/images/whats-new/fast-mode-opus-47.png?fit=max&auto=format&n=ITvjicPxe1SM3GX7&q=85&s=6b6d92f7748ce5328a1ee9a269fb1a87)



Toggle fast mode, now running on Opus 4.7:
```text Claude Code
  > /fast
```

[Fast mode on Opus 4.7](https://code.claude.com/docs/en/fast-mode#understand-the-cost-tradeoff)

Other wins

`claude agents` gained dispatch flags (`--add-dir`, `--settings`, `--mcp-config`, `--plugin-dir`, `--permission-mode`, `--model`, `--effort`, `--dangerously-skip-permissions`) to configure background sessions, and `claude agents --cwd \<path>` scopes the session list to a directory
New hook `args: string\[]` exec form spawns the command directly without a shell, so path placeholders never need quoting
New `continueOnBlock` config option for `PostToolUse` hooks feeds the hook's rejection reason back to Claude and continues the turn instead of ending it
New `terminalSequence` field in hook JSON output lets hooks emit desktop notifications, window titles, and bells without a controlling terminal
The Rewind menu added "Summarize up to here" to compress earlier context while keeping recent turns intact
Remote Control, `/schedule`, Claude.ai MCP connectors, and notification preferences are now disabled when `ANTHROPIC\_API\_KEY`, `apiKeyHelper`, or `ANTHROPIC\_AUTH\_TOKEN` is set, even alongside a Claude.ai login; unset the API key to use these features
MCP stdio servers now receive `CLAUDE\_PROJECT\_DIR` in their environment, matching hooks, and plugin configs can reference `\${"{"}CLAUDE\_PROJECT\_DIR{"}"}` in commands
`claude plugin details \<name>` shows a plugin's component inventory and projected per-session token cost, and the `/plugin` details pane now also lists the LSP servers a plugin provides
Plugins with a root-level `SKILL.md` and no `skills/` subdirectory are now surfaced as a skill
`/feedback` can now include recent sessions from the last 24 hours or 7 days for issues spanning more than the current session
Agent tool `subagent\_type` now matches case- and separator-insensitively, so `"Code Reviewer"` resolves to `code-reviewer`

[Full changelog for v2.1.139–v2.1.142 →](/en/changelog#2-1-139)
