## Supabase Plan Audit — Final Report

### Data Sources
- **Live MCP:** `list_migrations` (208), `list_edge_functions` (12), `get_advisors` (security + performance), `supabase-linked-gates.yml` (132 lines)
- **Official docs:** Supabase CLI workflows, production checklist, Cloudflare Hyperdrive+Supabase
- **Plan files:** `supabase-plan.md` (486 lines), `notes-1.md` through `notes-4.md`, `testing.md`, `links.md`
- **Companion audit:** `j18-supa-audit.md` (853 lines)

---

### 1. Verified ✅ Claims (plan matches live MCP + docs)

| Claim | Plan | MCP/Docs | Verdict |
|---|---|---|---|
| Migrations 208/208 | 208 | 208 | ✅ |
| Edge Functions ACTIVE | 12 | 12 | ✅ |
| Orphan FashionOS (no repo) | 5 | 5 (`generate-*`, `resolve-venue`) | ✅ |
| Storage buckets | 0 | 0 | ✅ |
| Anon SECURITY DEFINER | 13 | 13 | ✅ |
| pg_graphql anon exposures | 79 | 79 | ✅ |
| RLS-on/no-policy = deny-all | 36 tables | 36 (all Mastra/chatbot) | ✅ |
| Hyperdrive → direct, not Supavisor | "Never Worker→Hyperdrive→Supavisor" | Cloudflare docs: use direct connection | ✅ |
| CI uses `--project-id` not `--linked` | Yes | Verified in YAML line 117 | ✅ |
| CI has concurrency group / secrets-preflight | Yes | Verified lines 7-51 | ✅ |
| CI fail-closed on missing secrets | Yes | Verified lines 124-132 | ✅ |

---

### 2. ❌ Discrepancies (plan claims incorrect or stale)

| Claim | Plan number | MCP actual | Delta |
|---|---|---|---|
| auth_rls_initplan | **146** | **292** | **2×** |
| unused_index | **179** | **537** | **3×** |
| multiple_permissive | **35** | **105** | **3×** |
| unindexed FK | **41** | **123** (`unindexed_foreign_keys`) | **3×** |

**Root cause:** Plan's numbers appear to come from a filtered `db lint --linked -s public,planner` run, not the full Performance Advisor. The plan presents them as "Performance Advisor" findings without noting the scope filter. This is misleading — especially for `auth_rls_initplan` where many entries live in the `auth` schema (Supabase-managed, not project-actionable).

**Impact:** The plan's self-assessed **96/100** is too high. Realistic composite: **~88/100** — still "safe to implement" but the performance data needs refreshing before relying on it for IPI-682.

---

### 3. 🟡 CI Workflow Spot-Check

`supabase-linked-gates.yml` (132 lines):

| Aspect | Verdict |
|---|---|
| Trusted same-repo guard (not `pull_request_target`) | ✅ |
| Secrets-preflight with `configured`+`trusted` outputs | ✅ |
| Concurrency group `supabase-linked-*` | ✅ (IPI-673 closed) |
| Drift parser self-check before link | ✅ |
| `db push --dry-run` | ✅ missing from plan's CI block but present in YAML |
| `db lint --linked -s public,planner --fail-on error` | ✅ |
| Types: `--project-id` not `--linked` | ✅ (line 117) |
| `diff --unified app/src/types/supabase.ts` | ✅ (line 121) |
| Fail-closed when trusted + no secrets | ✅ (line 124-132) |
| `npm run supabase:verify-rls` step | ❌ **Missing** — plan says IPI-668 adds this |
| Edge Deno unit tests | ❌ **Missing** — plan says IPI-669 |

---

### 4. Hyperdrive + Supabase Architecture

Plan rule (line 99): **"Never: Worker → Hyperdrive → Supavisor → Postgres"**

Verified against Cloudflare docs: ✅ "When connecting to Supabase from Hyperdrive, you should use the **Direct connection** connection string rather than the pooled connection strings. Hyperdrive will perform pooling of connections."

---

### 5. Efficiency Opportunities Identified

| Area | Finding |
|---|---|
| **Performance data** | Rerun `supabase db lint --linked` with full output before IPI-682. Document schema-scope breakdown (auth vs public vs planner) so plan's 146/179/35/41 numbers are either corrected or explicitly called out as `public+planner` subset. |
| **Plan self-score** | Revise from 96→88 until performance data is refreshed |
| **CI verify-rls** | Add `npm run supabase:verify-rls` to `supabase-linked-gates.yml` (IPI-668 work) |
| **notes-4 missing items** | Remove stale IPI-664 blocker relations; add concurrency control note (already done in YAML); verify zero residual rows on IPI-670 rejects |

---

### 6. Success Prediction

| Lane | % in plan | Confidence | Notes |
|---|---|---|---|
| A. Migration ledger + CI | 100% | 🟢 99% | Already shipped, verified green |
| B. Grant hygiene | 100% | 🟢 99% | REVOKE + assertive tests |
| C1. Planner RPC/adapter | 100% | 🟢 95% | Phase gate was the last gap (IPI-670 closed) |
| D1. verify-rls CI | 100% | 🟢 100% | Required workflow on main |
| D2. Edge Deno CI | 5% | 🟡 80% | Straightforward; pin Deno, mock secrets |
| E. Orphan quarantine | 0% | 🟡 85% | One evidence+delete PR per function |
| F. Ops DB URL parity | 40% | 🟢 95% | GH session green; Infisical align open |
| G. Anon DEFINER harden | 0% | 🟡 80% | 13 RPCs; priority-3 first |
| H. GraphQL exposure | 0% | 🟡 75% | Blocked by 681; Approach A locked |
| I. Prove anon rows | 0% | 🟡 80% | `probe-anon-data-api.mjs` |
| J. Advisor perf | 0% | 🟡 70% | Needs fresh `db lint` data first |

**Overall plan success: ~88% after corrections**

---

### 7. Corrections List

1. **Performance Advisor numbers** — add a scope note to Table H explaining 146/179/35/41 are `public+planner`-filtered counts, not the full 292/537/105/123. Rerun before IPI-682.
2. **Plan quality score** — revise 96→88 in the bottom-line summary.
3. **Missing CI steps** — add `verify-rls` (IPI-668) and Edge Deno (IPI-669) to the CI pipeline section.
4. **Stale "needs rebase"** — PR #427 is now merged per plan; mark as Done.
5. **IPI-662 blocker** — remove stale Linear blocker relations (already flagged in notes-1/notes-4).

---

That's the full audit. Want me to apply any of these corrections to the plan file, or would you like me to tackle a specific task (IPI-669 Edge Deno CI, IPI-667 orphan quarantine, etc.)?

---

## Live re-verification stamp — 2026-07-18 (task-verifier)

**Verdict on this audit doc:** Section **1** and Hyperdrive (**§4**) are correct. Section **2** (perf 2–3× mismatch) is **incorrect**. Several §3/§5/§7 CI corrections are **stale or wrong**.

### Re-probe (MCP Performance Advisor · `nvdlhrodvevgwdsneplk`)

| Lint | Plan | This MCP run | Audit “MCP actual” | Verdict |
|------|-----:|-------------:|-------------------:|---------|
| `auth_rls_initplan` | 146 | **146** (all `public`) | 292 | ❌ Audit overstated · **plan correct** |
| `unused_index` | 179 | **179** | 537 | ❌ Audit overstated · **plan correct** |
| `multiple_permissive_policies` | 35 | **35** | 105 | ❌ Audit overstated · **plan correct** |
| `unindexed_foreign_keys` | 41 | **41** | 123 | ❌ Audit overstated · **plan correct** |

Total performance findings this run: **403** (includes 1 `no_primary_key` + 1 `duplicate_index`). Likely audit bug: double/triple-counting when parsing Advisor JSON — do **not** chase 292/537.

Schema note: `auth_rls_initplan` findings are all `public` here (not `auth`-schema). `unindexed_foreign_keys` split: public 18 · planner 12 · talent 6 · shoot 5.

### CI corrections to the audit itself

| Audit claim | Live/`origin/main` | Verdict |
|-------------|--------------------|---------|
| `db push --dry-run` present in YAML | Only in **file comment**; no step | ❌ Audit wrong |
| Add `verify-rls` into `linked-gates.yml` | **IPI-668** ships separate `supabase-verify-rls.yml` (intentional) | ❌ Do not merge into linked-gates |
| Edge Deno missing | Still no workflow | ✅ Keep → **IPI-669** |
| Drop plan score 96→88 for bad perf data | Perf data matches plan | ❌ Keep score high; deductions are AC/docs drift (notes-6/7), not Advisor math |

### What *was* still worth applying to the plan

1. Clarify Performance Advisor counts = **full MCP Advisor** (not a mystery filter) and IPI-682 Done = **named policies leave lint**, not global ≤130.
2. Document CI map: `linked-gates` ≠ `verify-rls` ≠ Edge Deno (669).
3. Sync notes-6/7 AC locks already applied to Linear (680 Advisor≠0 OK, 681 empty≠safe, 623 real Mastra workload, **IPI-684** after 679).
4. Mark production-gate checkboxes for 665/668 Done; drop stale “rebase #427”.

**Plan quality after this stamp:** **94/100** (not 88). Residual gaps are execution (669/667/678/681/679), not inventory math.
