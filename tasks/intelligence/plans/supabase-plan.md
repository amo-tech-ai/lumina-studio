---
title: Supabase Plan (App + Edge)
version: "1.0"
lastUpdated: "2026-06-29"
---

# Supabase Plan

## Purpose

Auth, RLS-scoped data, edge functions for AI writes, Mastra Postgres persistence, realtime crawl progress.

## Current setup

| Layer | Status | Notes |
|-------|:------:|-------|
| SSR auth client | 🟢 | `@supabase/ssr` |
| Typed schema | 🟢 | `types/supabase.ts` |
| Brand hub reads | 🟢 | brands, scores, crawls |
| Org layer | 🟢 | organizations, org_members |
| Shoot schema + RPC | 🟢 | commit_shoot_draft |
| Mastra PG tables | 🟢 | snapshots, messages, threads |
| Edge fn MVP set | 🟢 | brand-intelligence, crawl, audit-asset-dna |
| Realtime crawl UI | 🟡 | IPI-31 partial |
| Campaigns + matching tables | 🔴 | [IPI-268](https://linear.app/amo100/issue/IPI-268) Todo · blocks IPI-249/250 |
| Stripe tables | 🔴 | STR-001 pending |
| Storage buckets | 🔴 | 0 — Cloudinary boundary |

Live audit: [supabase-live-audit.md](../../data/supabase-live-audit.md)

**Architecture:** `tasks/intelligence/copilotkit-mastra/mastra-agent-catalog.md` · `mastra-workflows.md` · `06-ai-native-master-plan.md`

## Related tasks

| Task | Supabase touch |
|------|----------------|
| IPI-126 | BI migration ✅ |
| IPI-268 | Campaigns + matching schema (SUPA-DV2-001) |
| IPI-209–217 | Shoot detail + RPCs |
| IPI-26/24 | Schema v2 + Firecrawl |
| DESIGN-016 | API-MAP |
| DESIGN-071–072 | Intel panel + HITL persist |
| STR-001–003 | Payment tables + webhooks |

## Required skills

- `.claude/skills/ipix-supabase/SKILL.md`
- `.claude/skills/create-migration/SKILL.md`
- Supabase plugin skill (MCP)

## Files to inspect

- `app/src/lib/supabase/*`
- `app/src/types/supabase.ts`
- `app/src/app/api/_lib/supabase-admin.ts`
- `supabase/migrations/`
- `supabase/functions/_shared/auth.ts`

## MCP / tools

| Tool | When |
|------|------|
| `project-0-ipix-supabase` | **Primary** — tables, SQL, migrations, edge fn |
| `list_tables`, `execute_sql`, `get_advisors` | Every schema PR |
| `apply_migration` | Remote push (careful) |

## Implementation phases

| Phase | Deliverable |
|-------|-------------|
| 1 ✅ | Platform MVP schema + RLS |
| 2 ✅ | Brand intelligence v2 + org layer |
| 3 ✅ | Shoot schema + Mastra snapshots |
| 4 ⚪ | Shoot detail RPCs (IPI-209) |
| 5 ⚪ | Campaigns + matching migrations |
| 6 ⚪ | Stripe schema (STR-001) |
| 7 ⚪ | API-MAP completion (DESIGN-016) |

## Acceptance criteria

- [ ] RLS on every new table
- [ ] `npm run supabase:verify-rls` green
- [ ] No `SERVICE_ROLE` in client code
- [ ] Migrations idempotent + rollback noted in PR
- [ ] Types regenerated after schema change

## Risks

| Risk | Mitigation |
|------|------------|
| Local supabase start | **Forbidden** — remote only |
| Legacy event tables | Ignore for MVP; don't drop without audit |
| chatbot RLS INFO lints | Documented service-role pattern |

## Verification

```bash
infisical run -- npm run supabase:verify
infisical run -- npm run supabase:verify-rls
npm run supabase:types   # after migration
cd app && npm test
```

**Design / API alignment:** `tasks/design-docs/plan/API-MAP.md` · `tasks/design-docs/STACK-ALIGNMENT.md`
