# Archived skills

Reversible — restore to active:

```bash
mv .claude/skills/archive/<name> .claude/skills/<name>
```

Update [`index-skills.md`](../../index-skills.md) when restoring.

## Currently archived

| Skill | Why |
|-------|-----|
| `brainstorming`, `feature-dev`, `claude-md-improver` | Planning lane — lifecycle still links via `../archive/` |
| `design-md` | Root [`design.md`](../../design.md) is SSOT |
| `create-migration` | Folded → `ipix-supabase/references/migrations/scaffold.md` |
| `medusa` | Superseded by active `mercur/` |
| `accessibility`, `agent-browser`, `social-media`, … | Off-domain or defer |

**Restored 2026-07-01:** `firecrawl`, `infisical`, `fashion-production` (active again).

**Removed 2026-07-01:** `archive/mercur/` (duplicate of active `mercur/`).

**Archived 2026-07-01 (Next.js duplicates):**

| Skill | Why | Use instead |
|-------|-----|-------------|
| `nextjs-app-router-patterns` | ~70% overlap with `nextjs-developer` | `nextjs-developer` (+ `references/details.md` if needed) |
| `nextjs-react-typescript` | Thin style guide; overlaps `shadcn`, `frontend-design` | `shadcn` + project TS conventions |

**Active Next stack:** `nextjs-developer` (architecture) · `vercel-react-best-practices` (perf) · `react-patterns` (conditional Client/hooks).
