# iPix Agent Skills

Agent skills for **iPix / Lumina Studio**. Orientation doc only — graded inventory and cleanup
log: [`../../index-skills.md`](../../index-skills.md).

**32 top-level skills** (+ 2 nested). Last updated: 2026-06-28.

## Start here — hubs

Most work routes through a hub (`SKILL.md` + on-demand `references/`):

| Hub | Use for |
|-----|---------|
| [`ipix`](./ipix/SKILL.md) | Domain router · canonical workflow map |
| [`ipix-task-lifecycle`](./ipix-task-lifecycle/SKILL.md) | **IPI tasks** — plan → research → implement → test → ship |
| [`ipix-supabase`](./ipix-supabase/SKILL.md) | Schema, RLS, migrations, edge functions |
| [`fashion-production`](./fashion-production/SKILL.md) | Shoot pipeline (direction → capture → triage) |
| [`frontend-design`](./frontend-design/SKILL.md) | Production UI, tokens, color systems |
| [`copilotkit`](./copilotkit/SKILL.md) | CopilotKit v2 runtime + operator chat |
| [`mastra`](./mastra/SKILL.md) | Agent registry, tools, workflows |
| [`cloudinary`](./cloudinary/SKILL.md) | Media transforms + React SDK |
| [`infisical`](./infisical/SKILL.md) | Secrets injection |
| [`linear`](./linear/SKILL.md) | Issue/roadmap MCP |
| [`firecrawl`](./firecrawl/SKILL.md) | Web integration — onboarding, search, scrape, interact, research |

## Planning lane (pre-code)

| Skill | Role |
|-------|------|
| [`brainstorming`](./brainstorming/SKILL.md) | Pre-build exploration → `docs/plan/tasks/*-design.md` |
| [`writing-plans`](./writing-plans/SKILL.md) | Implementation plans → `docs/plan/tasks/*.md` |
| [`prd-template`](./ipix-task-lifecycle/references/prd-template.md) | PRD structure (in lifecycle) |
| [`mvp`](./mvp/SKILL.md) | MVP scoping / cuts |

Archived (restore from `archive/`): `product-designer`, `file-organizer`, `memory-management`.

## Other core (non-hub)

`gemini` · `graphify` · `lean` · `worktrees` · `task-verifier` · **`nextjs-16`** · **`nextjs-supabase-auth`** · **`nextjs-best-practices`** · `ipix-wireframe` ·
`gen-test` · `create-migration` · `skill-creator` · `accessibility` · `agent-browser` ·
`claude-md-improver` · `senior-prompt-engineer` · `mermaid-diagrams` · `fashion-styling`

Full grades (🟢 / 🟡 / ⚪ / 🔴): [`index-skills.md`](../../index-skills.md).

## Adding or editing a skill

Follow [`skill-creator`](./skill-creator/SKILL.md):

1. **One dir per skill** — `.claude/skills/<name>/SKILL.md` with YAML frontmatter.
2. **Trigger-rich `description`** — concrete intents/keywords; primary firing mechanism.
3. **Progressive disclosure** — lean `SKILL.md`; depth in `references/`.
4. **Consolidate, don't proliferate** — fold into an existing hub as `references/<topic>.md`.
5. **No tombstones** — delete merged skills; don't leave "Merged into X" stubs.
6. **Don't fold `.agents` symlinks** — `skill-creator` lives in `../../.agents/skills/`; reference as sibling.

## Conventions

- Hubs route; they never paste child bodies inline.
- Folded content → `references/` or `archive/` (reversible).
- Keep this README short — inventory lives in `index-skills.md`.
