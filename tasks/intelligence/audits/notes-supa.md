**Supabase audit #1 ↔ Linear — verified** (Supabase MCP + Linear MCP). Full reconciliation is in [`01-supabase-audit-2026-06-30.md`](tasks/intelligence/audits/01-supabase-audit-2026-06-30.md) § Linear reconciliation and [`notes.md`](tasks/intelligence/notes.md).

## Verdict: 84/100 (post–Batch 1 refresh) — v1 snapshot had 4 stale claims

Audits ran on a **stale branch**, not **`origin/main`**. Several cross-stack findings (IPI-247, Shoot Detail missing) are **fixed on main**.

### Corrections to audit #1

| Audit v1 | MCP + Linear truth |
|----------|-------------------|
| **95 tables** | **106** public tables, all RLS on |
| Shoot Detail 🔴 no page on main | 🟡 shell shipped — PR #150, RPC + migration on main |
| Migration drift (`get_shoot_detail`) | **Resolved** on main; IPI-225 Done (2026-06-28) |
| Reopen **IPI-247** | **Do not** — route map correct on main (PR #147) |

### Still valid — P0 Supabase

1. **No campaigns/matching tables** — MCP: 0 `%campaign%` / `%match%` / `%creator%` tables  
2. **`cloudinary_assets` RLS stale** — shoot→designer join; no `brand_id` on remote  
3. **074b not on remote** — PR [#154](https://github.com/amo-tech-ai/lumina-studio/pull/154) open; **IPI-257** In Progress  
4. **Org-member RLS gap** — `assets` uses `brands.user_id`, not `is_org_member` — **no Linear issue yet**

---

## [DESIGN V2](https://linear.app/amo100/project/design-v2-operator-react-parity-e276f28e26a0/issues) — Supabase-relevant

| Issue | Status | Action |
|-------|--------|--------|
| **IPI-268** SUPA-DV2-001 | Todo · High | ✅ Correct P0 — start when branch ready |
| **IPI-257** 074b | In Progress · PR #154 | ✅ Merge migration-only first |
| **IPI-209** Shoot Detail | Done · PR #150 | ✅ Keep Done — tab depth via IPI-210–217 |
| **IPI-247** Route map | Done · PR #147 | ✅ Correct on main — **don’t reopen** |
| **IPI-249/250** Campaigns/Matching | Backlog | ✅ Correctly blocked by IPI-268 |
| **IPI-248** Assets | Todo | Blocked on 074b pipeline |

## [AI INTELLIGENCE](https://linear.app/amo100/project/ai-intelligence-fe1f696f58be/issues) — Supabase-adjacent

| Issue | Status | Action |
|-------|--------|--------|
| **IPI-183** shoot schema | Done | ✅ Aligns with live tables |
| **IPI-151** DNA gallery | Todo | Keep blocked until 074b |
| **IPI-156** CAMP-001 | Todo | Keep blocked until IPI-268 |
| **IPI-86** SHOOT-UX-003 | Duplicate | ✅ Good dedup vs IPI-209 |
| **IPI-85** vs **IPI-273** | Overlap | 🟡 Consolidate UX ownership (not schema) |

---

## Recommended Linear edits (not executed)

1. **Don’t** reopen IPI-247 or IPI-209  
2. **Start** IPI-268 → `ipi/268-campaigns-matching-schema`  
3. **Merge** PR #154 → push 074b → tick IPI-257 checkbox  
4. **Create** org-member RLS follow-up (post-074b)  
5. **Fix** Mastra/CopilotKit audits — drop “reopen IPI-247” (wrong on main)

---

**Score updated to 84** (IPI-272 Brand List fix, advisor view names, Batch 1 refresh). Blockers: **IPI-268 + PR #154**.

Reply `approve supabase` to sync `supabase-plan.md`, or say **continue Gemini #2** for the next Linear cross-check.