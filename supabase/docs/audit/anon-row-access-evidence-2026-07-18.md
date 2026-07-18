# Anon Data API / GraphQL row-access evidence

**Task:** IPI-681 · SB-SEC-003 — Prove anonymous Data API and GraphQL row access  
**Captured:** 2026-07-18T09:09:24.827Z  
**Project:** nvdlhrodvevgwdsneplk  
**Validation:** Local Runtime Verified (anon HTTP + privileged metadata)

## Critical rule

`0 rows` from anon ≠ safe if the table is empty. Conclusive deny requires
`table_contains_rows = true` **and** anon empty/deny. Otherwise label
`inconclusive_empty`.

## Summary counts

| Class | Count |
| --- | ---: |
| conclusive deny | 15 |
| rows_leaked | 0 |
| inconclusive_empty | 0 |
| error | 0 |
| other empty_ok (pre-refine) | 0 |

## Matrix

| table | schema | anon SELECT | RLS | anon policy | has_rows | REST status | REST class | GQL status | GQL class | conclusive? | result | notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| brands | public | yes | yes | no | yes | 200 | deny | 200 | deny | yes | deny | — |
| brand_scores | public | yes | yes | 1 | yes | 200 | deny | — | — | yes | deny | — |
| brand_intake_drafts | public | yes | yes | no | yes | 200 | deny | — | — | yes | deny | — |
| assets | public | yes | yes | 1 | yes | 200 | deny | 200 | deny | yes | deny | — |
| org_members | public | yes | yes | no | yes | 200 | deny | — | — | yes | deny | — |
| organizations | public | yes | yes | no | yes | 200 | deny | — | — | yes | deny | — |
| shoots | public | yes | yes | no | yes | 200 | deny | — | — | yes | deny | — |
| profiles | public | yes | yes | no | yes | 200 | deny | 200 | deny | yes | deny | — |
| commerce_product_links | public | yes | yes | no | yes | 200 | deny | — | — | yes | deny | — |
| ai_agent_logs | public | yes | yes | no | yes | 200 | deny | — | — | yes | deny | — |
| crm_deals | public | yes | yes | 4 | yes | 200 | deny | — | — | yes | deny | — |
| crm_contacts | public | yes | yes | 4 | yes | 200 | deny | — | — | yes | deny | — |
| instances | planner | no | yes | no | yes | 401 | deny | — | — | yes | deny | Accept-Profile: planner; rest:42501 |
| chatbot_conversations | public | no | yes | no | yes | 401 | deny | — | — | yes | deny | rest:42501 |
| lead_intake_drafts | public | no | yes | no | yes | 401 | deny | — | — | yes | deny | rest:42501 |

## GraphQL samples (3)

Raw HTTP class below. With `table_contains_rows = true`, matrix refines `empty_ok` → **deny**.

| id | status | count_category | raw result_class | error code |
| --- | --- | --- | --- | --- |
| brands | 200 | zero | empty_ok | — |
| profiles | 200 | zero | empty_ok | — |
| assets | 200 | zero | empty_ok | — |

## Artifacts

- `supabase/docs/audit/anon-row-access-metadata.json`
- `supabase/docs/audit/anon-row-access-http.json`
- `supabase/docs/audit/anon-row-access-metadata.sql` (privileged inventory)

## How to reproduce

```bash
# 1) Privileged metadata (MCP execute_sql on nvdlhrodvevgwdsneplk, or):
#    infisical run --env=dev -- psql "$DATABASE_URL" -f supabase/docs/audit/anon-row-access-metadata.sql
#    → write supabase/docs/audit/anon-row-access-metadata.json
# 2) Anon HTTP (anon key only — never service_role):
infisical run --env=dev -- node scripts/probe-anon-data-api.mjs
# Fallback if Infisical project not linked in the worktree:
#    copy .env.local / app/.env.local, then: node scripts/probe-anon-data-api.mjs
```

Metadata source: supabase_mcp_execute_sql  
No row contents stored in any artifact.
