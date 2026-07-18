## Review verdict on `mastra-plan-notes.md`

The notes are **mostly right as a second-pass review**, but about **20% target issues already fixed** in the revised `mastra-plan.md`, and **~5% would over-complicate** the plan if added as new workstreams.

| Notes section | Correct? | Action |
|---------------|----------|--------|
| §1 Bundle at 10,218 KiB | ✅ | Real blocker. Plan now gates **before upload** (fail ≥9.0 MiB). Notes’ 9.5 MiB fail is looser than plan — keep **9.0**. |
| §2 Auth before smoke | ✅ but **stale** | Plan already has **IPI-468 → upload**. Notes still describe the old order. |
| §3 Hyperdrive/RLS | ✅ but **stale** | Plan already fixed wording. One leftover “RLS bypass” in IPI-616 AC — **fixed**. |
| §4 Mastra DO storage | ⚠️ **Partial** | Valid ADR mention. **Do not** open a DO migration track — 5.6k snapshots on Supabase. One-line “reject unless greenfield” in IPI-616 is enough. |
| §5 No `DATABASE_URL` on Workers | ✅ but **stale** | Plan already had this; added **fail-closed** to IPI-623 AC. |
| §6 `NEXT_PUBLIC_*` build-time | ✅ **New** | Valid. Diagram updated: build-time in CI, not wrangler runtime vars. |
| §7 Vars/secrets matrix | ✅ | Aligns with plan. `secrets.required` = optional doc only (IPI-626). |
| §8 `disableInit` only | ✅ | Matches plan; drop any “admin URL without disableInit” compromise. |
| §9 Workers Builds vs GH Actions | ✅ | Valid **decision**, not a new system. Plan: **GH Actions = gates**, **`npm run upload` = deploy**, Workers Builds optional later. |
| §10 Preview/prod env earlier | ✅ **Minimal fix** | Not a new phase — first upload uses `wrangler env.preview` only. |
| Additional checks table | ⚠️ **Over-engineered** | Token caps, circuit breakers, secret rotation, etc. → post-smoke / IPI-627, not preview blockers. |

## What changed in `mastra-plan.md` (only valid deltas)

1. **Bundle dry-run before upload** (not after smoke)
2. **`NEXT_PUBLIC_SUPABASE_*`** → build-time, not Worker vars
3. **First upload** → preview Worker (`env.preview`)
4. **IPI-616 / IPI-623** AC wording (RLS + Hyperdrive fail-closed)
5. **CI/deploy ownership** table (one deploy path)

## What we deliberately did not add

- Full Durable Objects storage workstream  
- 15-step parallel execution doc  
- Extra production hardening tasks before first preview  
- Third bundle threshold (9.5 MiB) on top of 8.5/9.0  

## SSOT

- **Execute:** [`tasks/mastra/mastra-plan.md`](tasks/mastra/mastra-plan.md)  
- **Notes review record:** [`tasks/mastra/mastra-plan-notes.md`](tasks/mastra/mastra-plan-notes.md) (trimmed to verdict + ponytail summary)

**Order unchanged:** `IPI-625 → IPI-468 → dry-run gate → preview upload → IPI-490` — then storage ADR, then Supabase migrations.

Your review is **validated** against repo evidence and official docs. All eight critical corrections hold; [`tasks/mastra/mastra-plan.md`](tasks/mastra/mastra-plan.md) is updated (revision §0, §15–§17).

## Verdict on your corrections

| # | Your finding | Verified? | Notes |
|---|--------------|-----------|-------|
| 1 | Auth too late | ✅ | `tasks/cloudflare/todo.md` already says Phase B before remote Worker; original plan had upload at step 4 and IPI-468 at step 6 — **wrong**. `operator-gate.ts` fail-open confirmed. |
| 2 | Bundle margin | ✅ | 10,218 KiB ≈ 9.98 MiB vs [10 MB Paid limit](https://developers.cloudflare.com/workers/platform/limits/). Warn **8.5 / fail 9.0 MiB** is the right CI posture. |
| 3 | Hyperdrive/RLS wording | ✅ | Audit: `rolbypassrls = false` — RLS applies. Gap is **JWT tenant context**, not bypass. |
| 4 | 33-table migration | ✅ | **10 drift** = 9 Studio/feature + 1 `mastra_observational_memory` (audit said “9 extra” loosely). Classify before IaC. |
| 5 | Schema ADR first | ✅ | Aligns with Option B in `j16-mastra-supabase.md` + [Supabase API security](https://supabase.com/docs/guides/api/securing-your-api). |
| 6 | No casual DISABLE RLS in `public` | ✅ | Use `CREATE POLICY` for `hyperdrive_mastra_runtime`; DISABLE only if tables move to private `mastra` schema. |
| 7 | Node storage ≠ preview blocker | ✅ | `wrangler.jsonc` has only `MASTRA_STORAGE_MODE=noop` — no `DATABASE_URL`. |
| 8 | No `DATABASE_URL` on Workers yet | ✅ | [Hyperdrive Supabase guide](https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/postgres-database-providers/supabase/) — creds in binding, per-request `pg.Client`. |

**Overall:** Your **88%** score was fair; revised plan self-scores **~93%** after fixes.

## More efficient path per task (dashboard/CLI/builtins first)

The full table is **§16** in `mastra-plan.md`. Highlights:

| Task | Don’t build custom | Use instead |
|------|-------------------|-------------|
| IPI-625 | New typegen tooling | Existing `npm run check:cf-types` + CI YAML |
| IPI-468 | New auth framework | `OPERATOR_AUTH_ENABLED` **wrangler var** + existing `withOperatorAuth` |
| Preview protection | Public `*.workers.dev` | **Cloudflare Access** (Dashboard) *or* IPI-468 — both is best |
| IPI-472 | Custom deploy pipeline | `@opennextjs/cloudflare` scripts + `wrangler versions upload` |
| Bundle gate | Custom bundler analysis | `wrangler deploy --outdir bundled/ --dry-run` (official) |
| Rate limits | App middleware first | **WAF** Dashboard rules; Workers Rate Limit binding only if needed |
| MASTRA-SUPABASE-002 | Hand-written DDL | `@mastra/pg@1.12.0` **`exportSchemas()`** → `supabase migration new` |
| IPI-619 | New Hyperdrive config | **Reuse** `ipix-supabase-fresh` (IPI-618 Done) — add binding to `wrangler.jsonc` |
| IPI-620/623 | Custom pool | CF recipe: per-request `pg.Client` + `env.HYPERDRIVE_FRESH.connectionString` |
| IPI-586 | Custom gateway Worker | Dashboard `ipix-prod` + `env.AI` binding ([official doc](https://developers.cloudflare.com/ai-gateway/integrations/aig-workers-ai-binding/)) |
| Rollback | Custom scripts | Dashboard Workers version rollback |

## Corrected execution order (now in plan §15)

```text
IPI-625 → IPI-468 → IPI-472 (CI + protected upload) → IPI-490
→ WAF/rate limits → IPI-627 → IPI-616 (ADR + classify)
→ MASTRA-SUPABASE-002→003→004 → IPI-245
→ IPI-619→624→623 (if ADR picks Hyperdrive)
→ IPI-586→594 → rollback/soak → DNS last
```

## One nuance on auth sequencing

**IPI-468 before upload** is mandatory for code-level fail-closed. **Cloudflare Access** on the preview hostname is a fast Dashboard belt-and-suspenders option (§16, ~1h) — not a substitute for production auth, but useful if upload must happen before every auth edge case is tested.

Your twelve missing production checks are captured in **§16** with task owners (tool auth → IPI-621; startup → IPI-490; backup → MASTRA-SUPABASE-002).

Next step if you want it: draft Linear issue bodies for **MASTRA-SUPABASE-002/003/004** and extend **IPI-490** AC with the 8.5/9.0 MiB gates.