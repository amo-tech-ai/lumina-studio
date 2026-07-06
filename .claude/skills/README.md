# iPix Agent Skills

**Canonical inventory:** [`index-skills.md`](../../index-skills.md) · Last updated: **2026-07-06** · Grade: **A- (92/100)** post P0 link fixes.

**35 active top-level skills** (+ 1 nested ref in `linear/references/pm/`, + 2 archive symlinks).
**27** skills in [`archive/`](./archive/).

## Start here — hubs

| Hub | Use for |
|-----|---------|
| [`ipix`](./ipix/SKILL.md) | Domain router · workflow map |
| [`ipix-task-lifecycle`](./ipix-task-lifecycle/SKILL.md) | IPI plan → ship |
| [`ipix-supabase`](./ipix-supabase/SKILL.md) | Schema, RLS, edge — routes to [`firecrawl`](./firecrawl/SKILL.md), [`infisical`](./infisical/SKILL.md). ⚠️ `Skill("ipix-supabase")` may fail with "Unknown skill" — `Read` the file directly until harness gap is fixed. 🔴 6 stale doc links — see inventory. |
| [`design-to-production`](./design-to-production/SKILL.md) | DESIGN V2: DC HTML → Next.js parity (execute + verify) |
| [`fashion-production`](./fashion-production/SKILL.md) | Shoot pipeline (13 phases). 🔴 link to `fashion-styling` |
| [`copilotkit`](./copilotkit/SKILL.md) | CopilotKit v2 single plugin. 🔴 1 stale doc link |
| [`mastra`](./mastra/SKILL.md) | Agents + tools. 🔴 missing `references/full-guide.md` |
| [`cloudinary`](./cloudinary/SKILL.md) | Media pipeline |
| [`infisical`](./infisical/SKILL.md) | Secrets |
| [`firecrawl`](./firecrawl/SKILL.md) | Web crawl/scrape/search |
| [`linear`](./linear/SKILL.md) | Issues MCP |
| `mercur` | `my-marketplace/` commerce. ✅ `name:` slug fixed 2026-07-06 |
| [`frontend-design`](./frontend-design/SKILL.md) | Production UI |
| [`pr-workflow`](./pr-workflow/SKILL.md) | Branch → PR → review-thread triage → merge gate |

**Next.js:** hub [`nextjs-developer`](./nextjs-developer/SKILL.md) + satellite [`nextjs-16`](./nextjs-16/SKILL.md) (proxy/config). Auth → `ipix-supabase`. Archived: `nextjs-best-practices`, `nextjs-supabase-auth`.

## Hub pattern (skill-creator)

| Layer | Purpose |
|-------|---------|
| **`description`** | Triggering + negative triggers (“Use when” / “NOT for”) |
| **`SKILL.md`** | Routing only (<500 lines) |
| **`references/`** | Load on demand |

## Rules

1. Fold duplicates into hub `references/` — no new top-level dirs without reason.
2. No symlinks to `.agents/skills/` (CopilotKit upstream cache).
3. Archived skills: `archive/<name>/` — link as `../archive/<name>/SKILL.md`.
4. `graphify query` before multi-file reads.
5. Keep [`index-skills.md`](../../index-skills.md) in sync after add/remove/archive.

## Authoring

[`skill-creator`](./skill-creator/SKILL.md) — eval workflow in `references/eval-workflow.md`.

## Audit quick reference (2026-07-06)

| Metric | Value |
|--------|------:|
| Active (excl. symlinks) | 35 |
| Broken link skills | 8 |
| Archive | 27 |
| Phantom entries fixed | `release-notes` |

Full scorecard + P0 fixes: [`index-skills.md`](../../index-skills.md).
