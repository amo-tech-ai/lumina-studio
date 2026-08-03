# Tech stack · Supabase

**SSOT playbook:** [06 · Tech Stack Playbook](../06-tech-stack-playbook.md) §3.2

| | |
|--|--|
| **Purpose** | Auth, Postgres+RLS, Edge Functions, Storage — operator data plane |
| **Current (✅)** | Remote-only; PKCE login; Edge crawl/DNA/leads; verify scripts for RLS/edge/BI |
| **Core** | Auth, RLS, migrations, Edge |
| **Advanced** | Realtime, Queues, Cron |
| **Class** | Auth/RLS/Edge = **MVP** · Realtime crawl UX = **Post-MVP** |
| **Rec** | **Keep** · **Improve** Realtime progress + advisors habit · never local Docker as SSOT |

## Gaps

Realtime underused; queues/cron not standardized; observability = verify + Sentry.

## Refs

[Docs](https://supabase.com/docs) · [RLS](https://supabase.com/docs/guides/auth/row-level-security) · [Edge](https://supabase.com/docs/guides/functions) · [pgvector](https://supabase.com/docs/guides/database/extensions/pgvector)
