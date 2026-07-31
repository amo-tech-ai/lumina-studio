---
title: "Supabase — Feature Adoption Report"
version: "1.0"
lastUpdated: "2026-07-31"
status: Active
purpose: "What is actually set up and working in Supabase, what is broken, and which platform features we are paying for but not using."
ssot: ../../../tasks/plan/todo.md
verifiedAgainst: "Live SQL against project nvdlhrodvevgwdsneplk (fashionos) · supabase/migrations (277) · supabase/functions (8)"
verifiedAt: "2026-07-31"
scores: { core: 90, advanced: 45, overall: 72 }
---

# Supabase — 72/100 (B−) 🟡

**One-line problem:** 37 tables have RLS switched **on with zero policies** — that
denies everyone, including the app. Not a leak; a lockout.

---

## 1. Summary

| Area | Score | Dot | State |
|------|------:|:---:|-------|
| Schema & migrations | 95 | 🟢 | 174 tables, 277 migrations, clean multi-schema split |
| Indexes | 90 | 🟢 | 494 indexes, ~2.8/table |
| RLS coverage | 70 | 🟡 | 353 policies, 0 tables unprotected — but 37 sealed shut |
| Triggers | 85 | 🟢 | 67 non-internal |
| Postgres functions | 65 | 🟡 | 393 in `public`; 30 over-granted |
| Edge Functions | 85 | 🟢 | 8 deployed, Deno-tested in CI |
| Auth | 85 | 🟢 | SSR + org scoping works |
| Realtime | 25 | 🔴 | **2 tables** |
| pgvector | 20 | 🔴 | Installed, 4 columns, **0 queries** |
| Storage | 30 | 🔴 | Buckets exist; media goes to Cloudinary instead |
| Queues / cron / branching | 15 | 🔴 | `pg_cron` on, `pgmq` not installed, no branching |

---

## 2. What is set up and working

| Thing | Count | Evidence |
|-------|------:|----------|
| Tables — `public` | 115 | `pg_class` where `relkind='r'` |
| Tables — `mastra` | 33 | Mastra storage after the IPI-616 schema move |
| Tables — `planner` | 10 | `assignments`, `phases`, `tasks`, `workflows`, `gate_conditions`… |
| Tables — `talent` | 8 | `talent_profiles`, `bookings`, `talent_shortlists`… |
| Tables — `shoot` | 8 | `shoots`, `shot_list`, `shoot_crew`, `shoot_deliverables`… |
| Views | 4 app views | `shoot_portfolio_view`, `shot_type_references_view`, `talent_profiles_public`, `decrypted_secrets` |
| Indexes | 494 | across the 4 app schemas |
| RLS policies | 353 | |
| Triggers | 67 | |
| Functions (`public`) | 393 | |
| Migrations | 277 | `supabase/migrations/` |
| Extensions installed | 9 | `vector` 0.8.0, `pg_cron`, `pg_trgm`, `btree_gist`, `pgtap`, `pgcrypto`, `uuid-ossp`, `pg_stat_statements`, `supabase_vault` |

**Multi-schema design is the strongest thing here.** Splitting `talent`, `shoot`,
and `planner` out of `public` means a `talent.bookings` policy can't be confused
with a `public.registrations` policy. Most Supabase projects never do this.

---

## 3. 🔴 Finding 1 — 37 tables: RLS on, zero policies

RLS enabled with no policy means **deny-all** for `anon` and `authenticated`.
`service_role` bypasses RLS, so server-side code still works — which is exactly
why this has gone unnoticed.

| Group | Count | Tables |
|-------|------:|--------|
| Mastra storage duplicates in `public` | 33 | `mastra_agents`, `mastra_threads`, `mastra_messages`, `mastra_workflow_snapshot`, `mastra_ai_spans`, `mastra_scorers`, `mastra_skills`, `mastra_workspaces`, … (all 33) |
| Chatbot | 3 | `chatbot_conversations`, `chatbot_events`, `chatbot_messages` |
| Webhook dedupe | 1 | `processed_firecrawl_webhooks` |

**The 33 `mastra_*` ones are the interesting part.** The same 33 table names exist
in *both* `public` and the `mastra` schema — and the `mastra` schema copies each
have exactly 1 policy. That is the fingerprint of a half-finished schema move
(see `tasks/mastra/ipi-616-storage-schema-adr.md`, and the `MASTRA_SCHEMA=mastra`
opt-in flag in `app/src/mastra/index.ts`).

⚠️ **Do not drop them yet.** Which set is authoritative depends on whether
`MASTRA_SCHEMA=mastra` is set in the deployed environment. Verify first:

```sql
select 'public' s, count(*) from public.mastra_threads
union all select 'mastra', count(*) from mastra.mastra_threads;
```

| If | Then |
|----|------|
| `public` has the live rows | Keep it, add policies (or accept service-role-only and document it) |
| `mastra` has the live rows | `public.mastra_*` are stale — archive in one migration |
| Both have rows | Data is split across two schemas. Highest priority on this list |

The 3 `chatbot_*` tables and `processed_firecrawl_webhooks` are simpler: they are
server-written only, so either add a service-role-only comment or add policies.
Right now their intent is unreadable from the schema.

---

## 4. 🟡 Finding 2 — 30 SECURITY DEFINER functions executable by `authenticated`

`get_advisors(security)` returns 38 WARN / 37 INFO / **0 ERROR**:

| Lint | Count | Level | Meaning |
|------|------:|-------|---------|
| `rls_enabled_no_policy` | 37 | INFO | Finding 1 above |
| `authenticated_security_definer_function_executable` | 30 | WARN | A logged-in user can call a function that runs as its owner |
| `function_search_path_mutable` | 3 | WARN | `search_path` not pinned — schema-shadowing risk |
| `extension_in_public` | 3 | WARN | `vector`, `pg_trgm`, `btree_gist` in `public` |

`SECURITY DEFINER` + `EXECUTE` granted to `authenticated` is the standard
privilege-escalation path in Postgres. Most of the 30 are probably fine (RPCs are
meant to be called), but "probably" isn't an audit. `get_brand_assets` appears
twice, which suggests an overload pair worth checking first.

**Fix shape:** one migration that `REVOKE EXECUTE ... FROM authenticated` on
everything not deliberately an RPC, plus `SET search_path = ''` on the 3 flagged.

---

## 5. 🔴 Finding 3 — pgvector installed, indexed, never queried

| Table | Column | Type | Index |
|-------|--------|------|-------|
| `public.brands` | `embedding` | `vector(768)` | ✅ `brands_embedding_idx` |
| `public.brand_graph_nodes` | `embedding` | `vector(768)` | ✅ `idx_graph_nodes_embedding` |
| `public.agent_context_snapshots` | `embedding` | `vector(768)` | ✅ `agent_context_snapshots_embedding_idx` |
| `talent.talent_profiles` | `ai_embedding` | `vector(768)` | ❌ none |

Four columns, three indexes, and **no code path that runs a `<=>` similarity
query**. We pay storage and index-maintenance cost for a feature that returns
nothing to a user.

**Real iPix example:** `model-match-agent.ts` says in its own instructions —
*"Matching is filter-based for MVP, not embedding similarity — don't claim a
'semantic match'"*. The agent is honest about it. Meanwhile `talent_profiles.
ai_embedding` sits there, un-indexed and unused. That column is the exact thing
that would make the claim true.

| Option | Effort | Recommendation |
|--------|--------|----------------|
| Wire `talent_profiles.ai_embedding` into `searchTalentByFilters` | M | ✅ Highest value — turns a documented MVP limitation into a feature |
| Semantic recall for Mastra memory | M | Deferred to IPI-136 already |
| Brand similarity ("brands like this one") | M | Good second |
| Drop the columns | S | Only if none of the above is on the roadmap |

---

## 6. 🟡 Finding 4 — Realtime on 2 tables

| Published today | Should be evaluated |
|-----------------|---------------------|
| `brand_crawls` | `shoots` — status changes during planning |
| `brand_crawl_results` | `talent.bookings` — the inbox is the definition of a live view |
| | `assets` — DNA scores land asynchronously from `audit-asset-dna` |
| | `notifications` — 10,533 rows, currently fetch-on-load |

**Why it matters in plain English:** the brand crawl streams live because someone
wired it. Everywhere else, the operator hits refresh to find out whether the edge
function finished. That is UX principle #1 ("remove waiting") failing quietly.

---

## 7. Auth — what's set up

| Feature | State | Evidence |
|---------|:-----:|----------|
| Email/password | 🟢 | `qa@ipix.test` QA account |
| SSR session handling | 🟢 | `@supabase/ssr` ^0.12.0 |
| Org scoping | 🟢 | `org_members` (5,832 rows) + `organizations` (5,818) |
| Profiles | 🟢 | `profiles` — 12,779 rows |
| RLS ownership pattern | 🟢 | Proven pattern; `rls-policy-auditor` agent guards it |
| OAuth providers | 🟡 | `auth.oauth_clients` table present, adoption unverified |
| MFA | ⚪ | `auth.mfa_factors` exists, unused |
| SSO / SAML | ⚪ | tables exist, unused |
| Anonymous sign-in | ⚪ | Would suit the marketing widget |

---

## 8. Suggested additional Supabase features

| Feature | iPix use case | Replaces | Priority |
|---------|---------------|----------|:--------:|
| **Realtime** on shoots/bookings/assets | Live status without refresh | Polling + manual refresh | 🔴 High |
| **pgvector** search on talent | Real semantic model matching | The "filter-based for MVP" caveat | 🔴 High |
| **`index_advisor`** | Which of the 494 indexes are unused, what's missing | Guesswork | 🟡 Med |
| **`pgmq`** queues | Asset DNA audits, crawl fan-out | Ad-hoc edge invocations | 🟡 Med |
| **Branching** | Preview DB per PR | Shared dev DB collisions | 🟡 Med |
| **`pg_cron`** (installed, expand use) | Nightly DNA re-scores, stale-draft cleanup | GitHub Actions cron | 🟡 Med |
| **Vault** (installed) | Cloudinary/Firecrawl keys in-DB for edge functions | Env sprawl | 🟢 Low |
| **Stripe FDW / Sync Engine** | Query Stripe data as Postgres tables | Custom sync code (unwritten) | See [07](./07-stripe-payments.md) |
| **`pg_net`** | Edge-free webhook fan-out from triggers | Edge function hops | 🟢 Low |
| **Storage** | Raw shoot originals before Cloudinary | Nothing — deliberate split | ⚪ Skip |

---

## 9. Progress tracker

**Legend:** 🟢 complete · 🟡 in progress · 🔴 attention · ⚪ not started

| ID | Task | | % | Examine | Verify | Blocker |
|----|------|:-:|--:|---------|--------|---------|
| SB-01 | Schema + migrations | 🟢 | 95 | `supabase/migrations/` | `npm run supabase:migrations` | — |
| SB-02 | RLS policy coverage | 🟡 | 70 | `pg_policies` | `npm run supabase:verify-rls` | 37 tables |
| SB-03 | Resolve 37 RLS-no-policy | 🔴 | 0 | `public.mastra_*` + `chatbot_*` | row-count query in §3 | Which schema is live? |
| SB-04 | SECURITY DEFINER audit | 🔴 | 0 | 30 functions | `get_advisors security` | — |
| SB-05 | pgvector query path | 🔴 | 20 | 4 vector columns | `grep -rn "<=>" app supabase` | No embedding write path |
| SB-06 | Realtime expansion | 🔴 | 25 | `pg_publication_tables` | SQL in §6 | — |
| SB-07 | Auth core | 🟢 | 85 | `@supabase/ssr` | QA login | — |
| SB-08 | Auth MFA/SSO | ⚪ | 0 | `auth.mfa_factors` | — | Not scoped |
| SB-09 | Edge Functions | 🟢 | 85 | `supabase/functions/` | `npm run supabase:verify-edge` | — |
| SB-10 | Branching per PR | ⚪ | 0 | — | `list_branches` | Cost decision |

---

## 10. Next 5 tasks

| # | Task | Effort | Why first |
|:-:|------|:------:|-----------|
| 1 | Determine which `mastra_*` schema is live, then policy-or-archive the other | S | Everything else on that data is ambiguous until resolved |
| 2 | `REVOKE EXECUTE` audit on the 30 SECURITY DEFINER functions + pin 3 `search_path` | M | Security gate before external users |
| 3 | Add RLS policies (or documented service-role-only comments) to `chatbot_*` + `processed_firecrawl_webhooks` | S | Makes intent readable from the schema |
| 4 | Publish `shoots`, `talent.bookings`, `assets` to realtime + subscribe in the UI | M | Directly serves UX principle #1 |
| 5 | Wire `talent_profiles.ai_embedding` into talent search (+ HNSW index) | M | Converts a known MVP limitation into a shipped feature |

---

## 11. Sources

- [Supabase docs](https://supabase.com/docs) · [Vector / pgvector](https://supabase.com/modules/vector) · [Stripe wrapper](https://supabase.com/docs/guides/database/extensions/wrappers/stripe) · [Stripe Sync Engine](https://supabase.com/blog/stripe-sync-engine-integration)
- Live SQL against project `nvdlhrodvevgwdsneplk`, 2026-07-31
- `tasks/supabase/STATUS.md` · `tasks/mastra/ipi-616-storage-schema-adr.md`
