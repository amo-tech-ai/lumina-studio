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

## 3. ✅ Finding 1 — 37 tables RLS-on-zero-policies is **intentional**, not neglect

> **Corrected 2026-07-31.** My first pass read this as accidental lockout. It is
> not. Every one of the 37 is a deliberate service-role-only lockdown with
> migrations, pgTAP coverage, and tracked follow-ups. The real finding is narrower
> and more interesting — see §3b.

RLS enabled with no policy means **deny-all** for `anon` and `authenticated`.
`service_role` bypasses RLS, so server-side code still works. That is the design.

| Group | Count | Deliberate? | Evidence |
|-------|------:|:-----------:|----------|
| `public.mastra_*` **shadows** | 33 | ✅ | `20260724102922` Phase A lockdown (PR #628) · `20260730232458_ipi875_rerevoke_public_mastra_shadow_grants.sql` · pgTAP `004_public_mastra_shadow_lockdown.sql` |
| `chatbot_*` | 3 | ✅ | IPI-664 · re-asserted by IPI-872 (`20260730223430`) · test `supabase/tests/security/chatbot-grants.sql` |
| `processed_firecrawl_webhooks` | 1 | ✅ | server-written dedupe table |

**And the `mastra_*` question I raised is already answered.** IPI-875's migration
header calls them *"shadows"* explicitly, and names the plan:

> *"After IPI-801 · MASTRA-PG-011 — Remove Leftover `public.mastra_*` Tables After
> Soak (Phase A lockdown… ) … Phase B stays on IPI-801."*

So: the `mastra` schema is authoritative, `public.mastra_*` are locked shadows
awaiting a soak period, and Phase B drops them. No investigation needed — it's
planned work with a ticket.

---

## 3b. 🔴 The real finding — the lockdown keeps drifting

`ipi875` exists *because* the earlier lockdown came undone. From its own header:

> *"deny-role ACLs drifted: anon + authenticated regained SELECT on all 33
> `public.mastra_*` shadows. pgTAP `004_public_mastra_shadow_lockdown.sql` fails
> tests 103–135."*

The same thing happened to `chatbot_*`: IPI-664 revoked the grants, and IPI-872
had to **re-revoke** them because `chatbot-grants.sql` was failing on `main`.

| Ticket | What it did | Why it existed |
|--------|-------------|----------------|
| IPI-801 | Phase A lockdown of 33 shadows | Original |
| **IPI-875** | **Re-revoke** the same 33 | Grants drifted back |
| IPI-664 | Revoke `chatbot_*` DML | Original |
| **IPI-872** | **Re-revoke** the same 3 | Grants drifted back |
| **IPI-876** | Find out *why* it drifts | ⚠️ **Root cause — still open** |

**Plain English:** something is silently re-granting `SELECT` to `anon` and
`authenticated` on tables that were deliberately locked. It has happened at least
twice, on two unrelated table groups. The team caught both via pgTAP — the tests
are doing their job — but a re-revoke migration is a symptom fix.

**IPI-876 is the real priority here, not the 37 tables.** Until the drift source is
found, expect a third re-revoke. Likely suspects worth checking first: a
`GRANT ... ON ALL TABLES IN SCHEMA public` somewhere in the migration history, or
default privileges (`ALTER DEFAULT PRIVILEGES`) that re-apply on table recreation.

---

## 4. 🟡 Finding 2 — SECURITY DEFINER audit is **already in flight**

> **Corrected 2026-07-31.** I wrote that nobody was auditing these. IPI-809 ·
> SEC-ONB-001 is exactly that audit, and two PRs have already landed.

`get_advisors(security)` returns 38 WARN / 37 INFO / **0 ERROR**:

| Lint | Count | Level | Status |
|------|------:|-------|--------|
| `rls_enabled_no_policy` | 37 | INFO | ✅ Intentional — §3 |
| `authenticated_security_definer_function_executable` | 30 | WARN | 🟡 **IPI-809 in progress** |
| `function_search_path_mutable` | 3 | WARN | 🔴 Open |
| `extension_in_public` | 3 | WARN | 🟢 Low — `vector`, `pg_trgm`, `btree_gist` |

**What already shipped** (`20260730220000_ipi809_revoke_org_function_execute.sql`,
PR #681) — and note the pattern, which is the right one:

```sql
-- REVOKE ALL from every role that might hold grants, then GRANT only the intended
REVOKE ALL ON FUNCTION public.is_org_member(uuid) FROM public, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_org_member(uuid) TO authenticated, service_role;
-- Trigger-only functions: service_role and nothing else
REVOKE ALL ON FUNCTION public.handle_new_user() FROM public, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
```

Revoke-then-grant leaves no leftover ACL ambiguity — the IPI-544 precedent. PR #682
added pgTAP coverage so it can't silently regress, and PR #655 (IPI-809) fixed the
underlying issue: *any logged-in user could see every organization*.

**What's left:** the audit covered org helpers and trigger functions. The advisor
still reports 30, so the remaining RPCs need the same pass. `get_brand_assets`
appears twice — an overload pair worth checking first.

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
| SB-02 | RLS policy coverage | 🟢 | 90 | `pg_policies` | `npm run supabase:verify-rls` | — |
| SB-03 | `public.mastra_*` shadow drop (IPI-801 Phase B) | 🟡 | 60 | Phase A locked | pgTAP `004_public_mastra_shadow_lockdown` | Soak period |
| SB-03b | **Grant re-drift root cause (IPI-876)** | 🔴 | 0 | 2 re-revokes already needed | pgTAP failures | ⚠️ **Open — expect a third** |
| SB-04 | SECURITY DEFINER audit (IPI-809) | 🟡 | 45 | org helpers + triggers done | `get_advisors security` | Remaining RPCs |
| SB-04b | `function_search_path_mutable` × 3 | 🔴 | 0 | 3 functions | `get_advisors security` | — |
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
| 1 | **IPI-876 — find why grants re-drift** | M | Two re-revokes already needed on unrelated tables. Without the root cause there will be a third |
| 2 | Finish IPI-809 across the remaining SECURITY DEFINER RPCs + pin the 3 `search_path` | M | Half done; the advisor still reports 30 |
| 3 | Publish `shoots`, `talent.bookings`, `assets` to realtime + subscribe in the UI | M | Directly serves UX principle #1 |
| 4 | Wire `talent_profiles.ai_embedding` into talent search (+ HNSW index) | M | Converts a documented MVP limitation into a shipped feature |
| 5 | IPI-801 Phase B — drop the 33 shadows once the soak completes | S | Already planned; removes the duplicate-schema confusion for good |

---

## 11. Sources

- [Supabase docs](https://supabase.com/docs) · [Vector / pgvector](https://supabase.com/modules/vector) · [Stripe wrapper](https://supabase.com/docs/guides/database/extensions/wrappers/stripe) · [Stripe Sync Engine](https://supabase.com/blog/stripe-sync-engine-integration)
- Live SQL against project `nvdlhrodvevgwdsneplk`, 2026-07-31
- `tasks/supabase/STATUS.md` · `tasks/mastra/ipi-616-storage-schema-adr.md`
