# 02 · Task Template

**Goal:** Every Linear IPI issue uses one reusable format — real business value, platform-first, fewer PR errors, faster MVP.

**Canonical files**
| File | Use |
|------|-----|
| [`templates/linear-issue-body.md`](./templates/linear-issue-body.md) | Paste into Linear team template + `docs/linear/issues/` |
| [`templates/README.md`](./templates/README.md) | Install + quality gate + research notes |
| [`templates/linear-task-example.md`](./templates/linear-task-example.md) | Filled DNA/Assets example |
| Skill SSOT | `.claude/skills/ipix-task-lifecycle/references/linear-spec-template.md` |

**Depends on:** [01](./01-development-standards.md) · [03](./03-ai-research-playbook.md) · [04](./04-testing-qa-playbook.md)

---

## Title

`IPI-NNN · TASK-ID — Real-world operator title`

## Must include

Purpose · Real-world iPix example · User journey · Business value · MVP stage (Core / Launch Blocker / Post-MVP / Advanced) · Dependencies · Research checklist · Platform-first plan · Multi-step implementation prompt · Stack · Skills/agents/hooks/commands · Tests · Real-world validation · Risks/rollback · AC · PR evidence · Quality scores

## Platform-first

```text
Dashboard → CLI → Existing code → Official docs → SDK → GitHub → Templates
  → Smallest custom code → Tests → Browser → PR
```

## Multistep prompt — create/rewrite one issue

```xml
<role>You create or rewrite one iPix Linear issue using the reusable task template.</role>
<context>
Template: docs/process/templates/linear-issue-body.md
Product surfaces: Brand Hub, Command Center, Assets DNA, shoots, booking, agents.
</context>
<task>
1. Research: current code, official docs, GitHub examples, Dashboard/CLI options.
2. Run quality checks; set MVP stage + scores; defer if not needed.
3. Fill every required section; keep short tables.
4. Write A→E with proof commands; include local :3002 + journey + agent tests if relevant.
5. Write docs/linear/issues/IPI-NNN-….md; sync Linear when MCP/API available.
</task>
<constraints>One concern. Custom code last. No bare IDs. Concise.</constraints>
<output_format>Verdict · scores · full issue markdown · open questions</output_format>
```

## Install in Linear

1. IPI team → Settings → Templates → New  
2. Paste `templates/linear-issue-body.md`  
3. Set as default for team members ([Linear docs](https://linear.app/docs/issue-templates))

## Done when

- [x] Reusable template published under `docs/process/templates/`
- [x] Skill `linear-spec-template.md` points at the same format
- [ ] Linear team default template updated (manual — Linear MCP needsAuth)
- [ ] Next 5 active issues rewritten to this shape
