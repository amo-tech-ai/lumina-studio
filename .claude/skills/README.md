# iPix Agent Skills

**Canonical inventory:** [`index-skills.md`](../../index-skills.md) · Last updated: **2026-07-01**.

**27 active top-level skills** (+ nested refs in `linear/`, `mastra/`, hubs).

## Start here — hubs

| Hub | Use for |
|-----|---------|
| [`ipix`](./ipix/SKILL.md) | Domain router · workflow map |
| [`ipix-task-lifecycle`](./ipix-task-lifecycle/SKILL.md) | IPI plan → ship |
| [`ipix-supabase`](./ipix-supabase/SKILL.md) | Schema, RLS, edge — routes to [`firecrawl`](./firecrawl/SKILL.md), [`infisical`](./infisical/SKILL.md). ⚠️ `Skill("ipix-supabase")` currently fails with "Unknown skill" despite the directory being valid — root-caused as far as external inspection allows (not a frontmatter/size/duplicate-name/plugin-collision issue; see the callout at the top of its `SKILL.md`). `Read` the file directly until this harness-level gap is resolved. |
| [`fashion-production`](./fashion-production/SKILL.md) | Shoot pipeline (13 phases) |
| [`copilotkit`](./copilotkit/SKILL.md) | CopilotKit v2 single plugin |
| [`mastra`](./mastra/SKILL.md) | Agents + tools |
| [`cloudinary`](./cloudinary/SKILL.md) | Media pipeline |
| [`infisical`](./infisical/SKILL.md) | Secrets |
| [`firecrawl`](./firecrawl/SKILL.md) | Web crawl/scrape/search |
| [`linear`](./linear/SKILL.md) | Issues MCP |
| [`mercur`](./mercur/SKILL.md) | `my-marketplace/` commerce |
| [`frontend-design`](./frontend-design/SKILL.md) | Production UI |
| [`pr-workflow`](./pr-workflow/SKILL.md) | Branch → PR → review-thread triage/resolve → merge gate |

## Hub pattern (skill-creator)

| Layer | Purpose |
|-------|---------|
| **`description`** | Triggering + negative triggers |
| **`SKILL.md`** | Routing only (<500 lines) |
| **`references/`** | Load on demand |

## Rules

1. Fold duplicates into hub `references/` — no new top-level dirs without reason.
2. No symlinks to `.agents/skills/` (CopilotKit upstream cache).
3. Archived skills: `archive/<name>/` — link as `../archive/<name>/SKILL.md`.
4. `graphify query` before multi-file reads.

## Authoring

[`skill-creator`](./skill-creator/SKILL.md) — eval workflow in `references/eval-workflow.md`.
