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
| `nextjs-app-router-patterns` | Overlap with hub | `nextjs-developer` |
| `nextjs-react-typescript` | Thin style guide | `shadcn` + `frontend-design` |

**Archived 2026-07-06 (Next.js cluster dedup):**

| Skill | Why | Use instead |
|-------|-----|-------------|
| `nextjs-best-practices` | Generic cheat sheet; weak triggers | `nextjs-developer` hub |
| `nextjs-supabase-auth` | Wrong `middleware.ts` pattern for iPix | `ipix-supabase` → `references/auth/nextjs.md` |

**Active Next stack (2026-07-06):**

| Skill | Role |
|-------|------|
| `nextjs-developer` | **Hub** — App Router, RSC, Server Actions, routing |
| `nextjs-16` | **Satellite** — `proxy.ts`, config, Turbopack, caching (path trigger) |
| `vercel-react-best-practices` | Perf / CWV — don't load with hub on small tasks |
| `react-patterns` | Client hooks / Suspense — conditional |

Auth in Next.js: **`ipix-supabase`** only — not a separate Next skill.
