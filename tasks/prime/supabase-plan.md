# iPix Supabase architecture plan (live-corrected)

**Project:** `nvdlhrodvevgwdsneplk` (fashionos) · Postgres 17 · us-east-2  
**Policy today:** remote-only until **PLT-010** migration baseline squash  
**Companion notes:** [`notes-1.md`](./notes-1.md) · [`notes-2.md`](./notes-2.md) · [`notes-3.md`](./notes-3.md) · [`notes-4.md`](./notes-4.md) · [`todo`](./todo) · [`j17-plan.md`](./j17-plan.md) · [`july-17supa-test.md`](./july-17supa-test.md) · [`testing.md`](./testing.md) · [`links.md`](./links.md)  
**Evidence date:** 2026-07-18 · Linear + MCP advisors + `migration list --linked` + GH Actions on `origin/main`  
**Mirror:** [`supabase/docs/plan/supabase-plan.md`](../../supabase/docs/plan/supabase-plan.md) · audit [`j18-supa-audit.md`](../../supabase/docs/audit/j18-supa-audit.md) · plan audit [`j18-audit-supa-plan.md`](./j18-audit-supa-plan.md)  
**Testing SSOT:** [`testing.md`](./testing.md) · **Drift:** **0** (208/208; do **not** `migration repair`)  
**Plan quality:** **94/100** (j18 plan-audit §2 perf “2–3×” claim **rejected** — MCP matches plan counts)

---

## Progress Task Tracker (verified 2026-07-18)

Legend: 🟢 complete · 🟡 in progress / blocked-ops · 🔴 failed / broken · ⚪ not started

**Overall near-term plan (must-ship lanes A–F): ~54%** — 7 Done / 13 scoped · CI+grants lane **100%** · Edge/ops/advisor residual **0%** · Hub UI unblocked but not built.

| ● | % | Lane / task | Proof (verify) | Attention |
|---|--:|-------------|----------------|-----------|
| 🟢 | 100% | **A · Migration ledger + linked CI** — [IPI-664](https://linear.app/amo100/issue/IPI-664) · [IPI-665](https://linear.app/amo100/issue/IPI-665) · [IPI-673](https://linear.app/amo100/issue/IPI-673) | `migration list --linked` 208/208 · workflows on `main`: `supabase-linked-gates.yml` · PRs #428/#431/#433/#437 | Keep dry-run clean |
| 🟢 | 100% | **B · Grant hygiene** — [IPI-664](https://linear.app/amo100/issue/IPI-664) REVOKE · [IPI-677](https://linear.app/amo100/issue/IPI-677) · asserted by [IPI-668](https://linear.app/amo100/issue/IPI-668) | Live: chatbot = `service_role` only; `lead_intake_drafts` = auth SELECT · `chatbot-grants.sql` on `main` · verify-rls run green | HIBP still WARN (Pro) — documented, not a code defect |
| 🟢 | 100% | **C1 · Planner create RPC + adapter + phase gate** — [IPI-653](https://linear.app/amo100/issue/IPI-653) · [IPI-670](https://linear.app/amo100/issue/IPI-670) | PRs #422/#427/#430 merged · Linear Done | — |
| ⚪ | 0% | **C2 · Hub New Plan UI** — [IPI-650 · PLN-HUB-002](https://linear.app/amo100/issue/IPI-650) | Unblocked (653+670); Linear **Todo**; no CTA yet | Product #8 after Edge/security |
| 🟢 | 100% | **D1 · Required verify-rls CI** — [IPI-668 · SB-TEST-001](https://linear.app/amo100/issue/IPI-668) | `supabase-verify-rls.yml` on `main` · GH run success on merge (`853b70ff` wave) | Local checkout may lag `main` |
| 🟡 | 5% | **D2 · Edge Deno unit CI** — [IPI-669 · SB-CI-002](https://linear.app/amo100/issue/IPI-669) | Linear **In Progress** · assigned · no workflow yet | **Start here #1** |
| ⚪ | 0% | **E · Orphan Edge quarantine** — [IPI-667 · SB-EDGE-001](https://linear.app/amo100/issue/IPI-667) (+ close [IPI-239](https://linear.app/amo100/issue/IPI-239)) | MCP: 5 FashionOS orphans still ACTIVE · Todo · High | **#2** · no `--prune` |
| 🟡 | 40% | **F · Ops DB URL parity** — [IPI-678 · SB-OPS-001](https://linear.app/amo100/issue/IPI-678) | GH session `:5432` green; Infisical align open · Todo | **#3** |
| ⚪ | 0% | **G · Anon DEFINER harden** — [IPI-679 · SB-SEC-001](https://linear.app/amo100/issue/IPI-679) | Live **13**; Todo · High · **∥ 681** | Priority 3 RPCs + `definer-grants.sql` |
| ⚪ | 0% | **H · GraphQL anon exposure** — [IPI-680 · SB-SEC-002](https://linear.app/amo100/issue/IPI-680) | Advisor **79**; Approach **A**; Advisor≠0 OK if REST kept · blocked by 681 | Child [IPI-683](https://linear.app/amo100/issue/IPI-683) = auth GraphQL 107 |
| ⚪ | 0% | **I · Prove anon row access** — [IPI-681 · SB-SEC-003](https://linear.app/amo100/issue/IPI-681) | Todo · High · blocks **680 only** · empty≠safe | metadata JSON + anon HTTP |
| ⚪ | 0% | **J · Advisor perf from evidence** — [IPI-682 · SB-PERF-001](https://linear.app/amo100/issue/IPI-682) | Live initplan **146**; Done = named policies leave lint | **Not** global ≤130 |
| ⚪ | — | **G2 · Default EXECUTE privileges** — [IPI-684 · SB-SEC-001b](https://linear.app/amo100/issue/IPI-684) | After 679 | Prevention only |
| ⚪ | — | **CF Mastra durability** — [IPI-619](https://linear.app/amo100/issue/IPI-619) · [IPI-623](https://linear.app/amo100/issue/IPI-623) | 623 = real Mastra thread/memory (not `ai_agent_logs`) | After 616→619→620→621→624 |
| ⚪ | — | **Optional** — [IPI-671](https://linear.app/amo100/issue/IPI-671) · [IPI-672](https://linear.app/amo100/issue/IPI-672) · [IPI-663](https://linear.app/amo100/issue/IPI-663) · [IPI-675](https://linear.app/amo100/issue/IPI-675) · [IPI-676](https://linear.app/amo100/issue/IPI-676) | Backlog | Do not block Hub |
| ⚪ | — | **Later P2** — PLT-010 squash / local pgTAP | Branching `MIGRATIONS_FAILED` | — |
| 🔴 | — | **Misframed “weak RLS” (36 tables)** | RLS ON + 0 policies = **deny-all** (intentional Mastra/chatbot) | Do **not** file “add policies” without owner |

### Validation checklist (stage gates)

| Stage | Gate | Status |
|-------|------|--------|
| Examine | Inventory matches live project | 🟢 migrations 208 · storage 0 · edge 12 |
| Verify | Done tickets = Linear Done + merged PR | 🟢 664/665/670/653/673/677/668 |
| Validate | CI artifacts on `origin/main` + green runs | 🟢 linked-gates + verify-rls |
| Measure | Lane % above | 🟢 CI/grants 100% · overall ~54% |
| Identify | Missing / attention | ⚪ **669** · 667 · 678 · **681** · **679** · 680 · 684 · 682 · 650 |

**Start here today:** [IPI-669](https://linear.app/amo100/issue/IPI-669). Then **in parallel:** [IPI-667](https://linear.app/amo100/issue/IPI-667) · [IPI-678](https://linear.app/amo100/issue/IPI-678) · [IPI-681](https://linear.app/amo100/issue/IPI-681) · [IPI-679](https://linear.app/amo100/issue/IPI-679) (**679 ∥ 681**). After 681: [IPI-680](https://linear.app/amo100/issue/IPI-680). After 679: [IPI-684](https://linear.app/amo100/issue/IPI-684). Later: [IPI-682](https://linear.app/amo100/issue/IPI-682) · [IPI-650](https://linear.app/amo100/issue/IPI-650). CF: **616 → 619 → 620 → 621 → 624 → 623**.

### CI map (do not merge workflows)

| Workflow (`origin/main`) | Owns | Ticket |
|--------------------------|------|--------|
| `supabase-linked-gates.yml` | Drift parser · link · `db lint -s public,planner` · types `--project-id` | IPI-665 / 673 |
| `supabase-verify-rls.yml` | Required `supabase:verify-rls` + grant asserts | IPI-668 Done |
| *(missing)* Edge Deno unit | `deno test --frozen` / existing unit suite | **IPI-669** |

Do **not** fold verify-rls into linked-gates (different secrets + concurrency).

This document replaces the earlier greenfield checklist with an **iPix-grounded** plan: what is already in use, what is broken, and what to implement in which order.

---

## Live architecture (verified in use)

| Surface | Status | iPix use |
|---------|--------|----------|
| Postgres + RLS | Healthy | brands, org_members, planner.*, CRM, assets metadata, Mastra tables |
| Auth (GoTrue) | Enabled | PKCE login → `/app`, profiles sync |
| PostgREST | `public`, `planner`, `graphql_public` | Primary CRUD + many RPCs |
| Supavisor | Platform pooler | Mastra `DATABASE_URL` expects transaction mode `:6543` |
| Realtime | Enabled | Brand crawl progress; planner CI probe |
| Edge Functions | 12 ACTIVE | BI, DNA, crawl, lead, health + **5 legacy FashionOS** not in repo |
| Storage | **0 buckets** | Media via **Cloudinary**, not Supabase Storage |
| pgvector | Installed | `agent_context_snapshots.embedding` |
| pg_cron | 1 job | hourly `expire_stale_bookings()` |
| pg_graphql | Installed | **No app clients** — exposure is advisor noise |
| Hyperdrive | Not wired | Planned on Cloudflare CF-DB track only |
| Branching | `main` = `MIGRATIONS_FAILED` | Confirms local/preview replay broken |
| pgTAP | **Not installed** | No `supabase/tests/database/*.test.sql` |

### Connection rules (one pool layer per path)

```text
Browser / ordinary CRUD
→ supabase-js → PostgREST / Auth / Realtime

Next.js server (user JWT)
→ createSupabaseServerClient / session helpers

Service-role (agents, webhooks)
→ createSupabaseAdminClient only (no ad-hoc createClient)

Mastra / Node serverless SQL
→ Supavisor transaction mode (:6543)

CI / local psql multi-statement (booking-gate, grant SQL, verify-rls SQL)
→ Supavisor **session** (:5432) or direct — with password
→ GitHub `DATABASE_URL` is session today; Infisical parity = IPI-678

Cloudflare Worker direct SQL (future)
→ Hyperdrive → Supabase **direct** connection
→ pg or postgres.js (not supabase-js)
→ cache disabled for auth, tenant, booking, CRM, Mastra state

Migrations / pg_dump / schema admin
→ Direct DB connection (never transaction pool)
```

**Never:** Worker → Hyperdrive → Supavisor → Postgres ([Cloudflare Hyperdrive + Supabase][hd-supabase]).

---

## Platform components — how to talk about them

| Layer | Examples | Treat as |
|-------|----------|----------|
| Application-facing | Postgres, Auth, PostgREST, Realtime, Edge Functions, Cron | Plan work here |
| Platform-managed | Studio, Logs Explorer, Advisors, backups/PITR | Operate via Dashboard/CLI |
| Local-dev only | Kong, Mailpit, imgproxy, Vector, postgres-meta | Do not file app tasks to “configure” these on hosted |
| Not used for media | Supabase Storage / imgproxy | Cloudinary is SSOT until Storage is deliberately adopted |

Prefer **Logs Explorer / platform observability** over the historical name “Logflare” in architecture docs.

---

## What is already working in the repo

* Canonical clients: `app/src/lib/supabase/{client,server,session}.ts` + `app/src/app/api/_lib/supabase-admin.ts`
* Types: `npm run supabase:types` → `app/src/types/supabase.ts` (`public,planner,graphql_public`)
* Remote probes: `supabase:verify`, `supabase:verify-rls`, booking-gate, planner, edge/BI scripts
* CI: `supabase-web015` (Docker slice, not full history) + optional live booking/planner when secrets set
* Seed: `[db.seed] enabled = false` — use `scripts/setup-dev-users.mjs` (and related seed scripts)

---

## Critical gaps (verified)

1. ~~**Migration drift**~~ — **Closed** (IPI-664 + IPI-665 + IPI-673). Live list 208/208; dry-run/list gated in CI.
2. ~~**Chatbot / lead_intake over-broad grants**~~ — **Closed** (IPI-664 REVOKE + IPI-677 SELECT-only drafts); asserted by IPI-668 `chatbot-grants.sql`.
3. ~~**verify-rls optional on CI**~~ — **Closed** (IPI-668 #438 — required workflow + `REQUIRE_SERVICE_ROLE=1`).
4. **Local Docker blocked** until PLT-010 — do not make `supabase start` + `test db` the first CI gate.
5. **Security Advisor (still open):** HIBP WARN (Pro); **79** `pg_graphql_anon_table_exposed` (no app GraphQL clients — defense-in-depth); **13** anon-executable `SECURITY DEFINER`; **36** public tables RLS-on/no-policy = **deny-all** (intentional for Mastra/chatbot — not “weak RLS”).
6. **Performance Advisor (MCP full, 2026-07-18 re-probe):** **146** `auth_rls_initplan` (all `public`), **35** `multiple_permissive_policies`, **179** `unused_index`, **41** `unindexed_foreign_keys`. Ignore j18 plan-audit §2 “292/537” — parse error. IPI-682 Done ≠ dropping global count.
7. **Legacy Edge Functions** (5 FashionOS orphans, several `verify_jwt=false`) → IPI-667.
8. **Edge Deno unit tests not in CI** → IPI-669.
9. **Infisical vs GitHub DB URL mode drift** (session `:5432` for `psql`) → IPI-678.
10. **Ad-hoc service-role clients** still in Mastra tools/workflows.
11. **README types path** still mentions `src/types/supabase.ts` in places; canonical is `app/src/types/supabase.ts`.

---

## Planner seam — IPI-653 / PR #427 (from verified [`notes-1.md`](./notes-1.md))

**Status:** **Done** — RPC (#422) + app adapter ([PR #427](https://github.com/amo-tech-ai/lumina-studio/pull/427) merged 2026-07-18) + phase completeness ([IPI-670](https://linear.app/amo100/issue/IPI-670) / #430). Hub UI remains [IPI-650 · PLN-HUB-002](https://linear.app/amo100/issue/IPI-650).

| Decision | Verdict |
| --- | --- |
| App architecture (engine-computes / RPC-persists)? | **Shipped** |
| DB enforces complete workflow phases on create? | **Yes** via IPI-670 |
| Weekend phase-start normalization? | **Deferred** (IPI-672 lane) |
| Advisory lock for same-key concurrency? | **P3** |
| `migration repair`? | **Do not run** |

### Execution order (updated 2026-07-18 evening)

```text
DONE: IPI-664 → IPI-665 → IPI-670 → IPI-653 (#427) → IPI-673 → IPI-677 → IPI-668 (#438)

NEXT (preferred):
1. IPI-669 · SB-CI-002 — Edge Deno unit tests in CI (always-start · no top-level paths: · --frozen)
2. Parallel: IPI-667 · IPI-678 · IPI-681 · IPI-679 (679 ∥ 681)
3. After 681: IPI-680 · SB-SEC-002 (endpoint unavailable or approved-only; Advisor≠0 OK)
4. After 679: IPI-684 · SB-SEC-001b — default EXECUTE privileges
5. Later: IPI-682 · SB-PERF-001 (named policies leave initplan)
6. IPI-650 · PLN-HUB-002 — Hub New Plan UI
7. CF: IPI-616 ADR → 619 bind → 620 spike → 621 tenant → 624 monitor → 623 Mastra workload
8. Optional: IPI-675 · IPI-671 · IPI-672 · IPI-663 · IPI-676 · IPI-683
```

### PLN-DATA-003B acceptance (forward migration only) — IPI-670

```text
workflow phase count > 0
submitted task count = workflow phase count
distinct submitted phase IDs = workflow phase count
every submitted phase belongs to the selected workflow
```

Do **not** add a global unique on `planner.tasks(instance_id, phase_id)` — future multi-task phases. Enforce only inside `planner_create_instance`.

### Linear hygiene

* Remove stale **IPI-653 blocks IPI-664** / reverse relation (664 is Done).
* Keep **[IPI-662 · Supabase Migration Ledger Drift Repair](https://linear.app/amo100/issue/IPI-662)** as Duplicate of IPI-664; run IPI-663 after IPI-665.

---

## Development source of truth

### Near-term (remote-only)

```bash
npx supabase projects list
npx supabase migration list --linked   # must show zero drift
npm run supabase:push                  # after reviewed new migration only
npm run supabase:types
npm run supabase:verify-rls
```

Always pass explicit `--linked` or `--local`. Never automate `supabase db reset --linked` against production ([CLI workflows][cli-workflows]).

### After PLT-010 (local parity)

```bash
npx supabase start
npx supabase db reset --local
npx supabase db lint --local -s public,planner --fail-on error
npx supabase test db --local
```

Pin CLI via the repo’s existing `supabase` tooling; keep developers and CI on the same major version.

### Schema change strategy

**Decision: imperative migrations only** for iPix (do not casually mix declarative `supabase/schemas` until drift is gone).

```text
supabase migration new <name>
→ review SQL
→ npm run supabase:push
→ npm run supabase:types
→ npm run supabase:verify-rls
```

Do not edit already-applied migrations. Review every `db pull` / `db diff` for surprise grants and extensions.

---

## Testing strategy

**SSOT detail:** [`testing.md`](./testing.md) — strategy is correct for remote-first; main gap is CI enforcement, not pgTAP.

| Layer | When | Ticket |
|-------|------|--------|
| Remote client RLS (`verify-rls` required on trusted CI) | **Done** | IPI-668 (#438) |
| web015 + booking-gate / planner | **Now** | existing CI |
| Migration drift + `db push --dry-run` | **Done** | IPI-665 + IPI-673 |
| `db lint --linked --fail-on error` | **Done** | IPI-665 |
| Types drift (`--project-id` in CI vs committed file; local may `--linked`) | **Done** | IPI-665 |
| Grant asserts (post-REVOKE) | **Done** | IPI-664 → IPI-677 → IPI-668 |
| Edge Deno unit in CI | **Next** | IPI-669 |
| Infisical ↔ GH `DATABASE_URL` session parity | **Next** | IPI-678 |
| pgTAP (`supabase test db --local`) | **After squash (P2)** | defer |
| Vitest + supabase-js | Continuous | app CI |

Also verify **grants**, not only RLS: `anon` / `authenticated` / `service_role`, RPC `EXECUTE`, schema `USAGE`, Realtime publication membership, and every `SECURITY DEFINER` (`search_path`, authz, minimal grants).

---

## Recommended architecture diagram

```text
Browser
│
├── Supabase JS (Auth, PostgREST, Realtime)
│
Next.js / OpenNext
│
├── User-scoped Supabase client
├── Admin client (justified server ops only)
├── Mastra → Supavisor :6543 (today)
├── Hyperdrive + pg (selected Worker SQL only — future)
└── Cloudflare AI Gateway
│
Supabase (hosted)
├── Postgres + RLS + RPCs
├── Supavisor
├── PostgREST (+ planner schema)
├── Realtime (selective)
├── Edge Functions (repo-owned only)
├── Cron (short DB jobs)
├── pgvector (as needed)
└── Logs Explorer / Advisors
│
Cloudinary  ← media delivery (not Supabase Storage)
Mercur      ← commerce catalog (not duplicated here)
```

---

## Rules that prevent the most errors

1. **One factory per context** — browser, SSR/user, admin, (future) Hyperdrive helper. No ad-hoc `createClient(service_role)` in agents.
2. **RLS is the security boundary** — `.eq("org_id", …)` is not enough without matching policies.
3. **Service-role never in the browser** — keep under `app/api/` / server-only modules.
4. **Realtime selective** — crawl progress / notifications; not every table.
5. **Constraints + transactional RPCs** over app-only checks.
6. **Backward-compatible migrations** — add nullable → deploy → backfill → constrain later.
7. **One pooling layer** on any direct Postgres path (Hyperdrive **or** Supavisor, never both).

---

## Prioritized improvements

| Priority | Improvement | Value |
| ---: | --- | --- |
| P0 | Reconcile local ↔ remote migration history | Stop silent schema divergence |
| P0 | Grants + SECURITY DEFINER + exposed-schema audit | Close advisor / over-grant holes |
| P0 | Enable Auth leaked-password protection (HIBP) | Auth hardening |
| P0 | Expand remote org-scoped RLS / client Auth tests | Prove tenant isolation without Docker |
| P0 | Inventory / quarantine legacy Edge Functions | Remove orphan `verify_jwt=false` risk |
| P1 | CI: `db lint --linked --fail-on error` + types drift | Enforceable quality |
| P1 | Consolidate Mastra/admin client factories | Remove unsafe ad-hoc access |
| P1 | Fix `auth_rls_initplan` + duplicate policies on hot iPix tables | Perf + clearer authz |
| P1 | Staging project + backup/rollback runbook | Safe migration proof |
| P1 | Monitor DB + pooler (+ future Hyperdrive) connections | Prevent exhaustion |
| P2 | PLT-010 baseline squash → local start/reset | Unlocks official local CI |
| P2 | pgTAP suite + `test db` in CI | Deep policy tests |
| P2 | Deterministic local fixtures (re-enable seed carefully) | Reproducible environments |
| P2 | Hyperdrive pilot (CF-DB track) with measured limits | Worker SQL without double pooling |
| P3 | Branching / OTEL / new extensions only with proven need | Cost and maintenance control |

### Proposed Linear titles

```text
IPI-XXX · SB-MIG-001 — Reconcile local and remote migration history
IPI-XXX · SB-SEC-001 — Enable Auth leaked-password protection
IPI-XXX · SB-SEC-002 — Tighten grants on service-only tables and SECURITY DEFINER RPCs
IPI-XXX · SB-EDGE-001 — Inventory and quarantine legacy Edge Functions
IPI-XXX · SB-API-001 — Reduce unused GraphQL API exposure
IPI-XXX · SB-RLS-001 — Fix auth_rls_initplan on hot iPix tables
IPI-XXX · SB-CLIENT-001 — Standardize Mastra service-role clients through admin factory
IPI-XXX · SB-CI-001 — Add linked db lint and types drift gates
IPI-XXX · SB-TEST-001 — Expand remote RLS matrix (org A/B assets, CRM, planner)
IPI-XXX · SB-BASE-001 — PLT-010 migration baseline squash for local Docker
IPI-XXX · SB-TEST-002 — pgTAP suite and supabase test db in CI
IPI-XXX · SB-OPS-001 — Staging project and migration rollback runbook
```

---

## CI pipelines

### IPI-665 corrections (from [`notes-2.md`](./notes-2.md))

| Topic | Rule |
|-------|------|
| Gate name | **Ledger + pending-migration validation** — not “schema byte-equality” |
| Types in CI | `supabase gen types typescript --project-id "$SUPABASE_PROJECT_ID" --schema public,planner,graphql_public` (not `--linked` in CI) |
| Secrets | `SUPABASE_ACCESS_TOKEN` + `SUPABASE_PROJECT_ID` (+ `SUPABASE_DB_PASSWORD` for link / `db push` / `db lint --linked`) |
| Trigger | `pull_request` + same-repo guard; skip forks / Dependabot; **never** `pull_request_target` + secrets |
| Drop | `supabase projects list` (noise) |
| Branching | `MIGRATIONS_FAILED` is a **historical preview-branch** failure; linked ledger drift is separately **0** after IPI-664 |

### Phase A — remote-only (implement now — IPI-665)

```bash
set -euo pipefail
# Trusted same-repo only. Required secrets: SUPABASE_ACCESS_TOKEN, SUPABASE_PROJECT_ID,
# SUPABASE_DB_PASSWORD (for link / db push dry-run / db lint --linked).

# Ledger + pending-migration validation (timestamps / pending set — not SQL byte-diff)
# PR: fail remote-only; allow local-only only if introduced by this PR
# main: zero history drift; dry-run pending must match PR migrations
node scripts/check-supabase-migration-drift.mjs
npx supabase db push --linked --dry-run

npx supabase db lint --linked -s public,planner \
  --level warning --fail-on error

tmp_types="$(mktemp)"
npx supabase gen types typescript \
  --project-id "$SUPABASE_PROJECT_ID" \
  --schema public,planner,graphql_public > "$tmp_types"
test -s "$tmp_types"
diff --unified app/src/types/supabase.ts "$tmp_types"

# IPI-668: required on trusted runs (not silent-skip) — separate job OK
# npm run supabase:verify-rls
npm run test:web015

cd app && npm run lint && npm run typecheck && npm test
```

Local developer types may still use `npm run supabase:types` (`--linked`) after `supabase link`.

### Phase B — local (only after PLT-010)

```bash
set -euo pipefail
npx supabase start
npx supabase db reset --local
npx supabase db lint --local -s public,planner \
  --level warning --fail-on error
npx supabase test db --local
# regenerate types with --local and diff against app/src/types/supabase.ts
```

---

## Cron, webhooks, branching

* **Cron:** keep short DB jobs (`expire_stale_bookings` pattern). Add idempotency, advisory locks when overlap is dangerous, monitor `cron.job_run_details`. No long AI workflows inside Postgres ([Cron docs][cron]).
* **Database webhooks / pg_net:** only with signed, idempotent handlers and small payloads.
* **Branching:** optional later. Prefer a **staging project** now; retry Branching only after migrations replay cleanly.

---

## Extensions — enable only with a use case

| Extension | iPix stance |
|-----------|-------------|
| `pgvector` | Already installed — use for proven semantic search |
| `pg_cron` | Already used — expand carefully |
| `pg_stat_statements` | Keep for slow-query work |
| `pgTAP` | Install when local CI lands |
| `pg_graphql` | Prefer shrink exposure unless product needs GraphQL |
| PostGIS / pg_net / Vault | Only when a named feature requires them |

---

## Production-readiness gates

- [x] `supabase migration list --linked` shows no drift *(IPI-664 Done)*
- [x] Chatbot service-only grants tightened *(IPI-664 / IPI-677)*
- [ ] Security Advisor: HIBP — **accepted Pro-plan limitation** (documented on IPI-664; not a merge blocker)
- [x] `supabase:verify-rls` required on trusted CI *(IPI-668 — separate workflow on `main`)*
- [x] Types regeneratable in CI via `--project-id` *(IPI-665 linked-gates)*
- [ ] Edge Deno unit tests in CI *(IPI-669)*
- [ ] Legacy Edge Functions decided *(IPI-667)*
- [ ] No `SERVICE_ROLE` / AI keys in client bundles (`check-client-env`)
- [ ] Staging path for migrations before prod push
- [ ] Rollback notes for the last migration (forward-fix companion if needed)

**Validation (safe):**

```bash
npm run supabase:migrations
npm run supabase:verify && npm run supabase:verify-rls
npx supabase db lint --linked -s public,planner --fail-on error
npm run supabase:types && git diff --stat app/src/types/supabase.ts
```

**Do not:** `db reset --linked`, rewrite applied migrations, or enable Branching until squash succeeds.

---

## Safest implementation order

```text
1. ~~Migration history / grants / planner create / linked CI / verify-rls~~ (664–668/670/653/673/677 Done)
2. Edge Deno CI (IPI-669) ← now
3. Parallel: orphan Edge (667) · Infisical DB URL (678) · prove anon rows (681) · DEFINER revoke (679)
4. GraphQL anon surface (680 after 681) · default privileges (684 after 679)
5. Hot-table auth_rls_initplan (682) — named policies only
6. Hub New Plan UI (650)
7. CF Mastra Hyperdrive chain (616→…→623)
8. PLT-010 squash → local pgTAP → staging
```

---

## Bottom line

The biggest win is not adding more hosted services. It is this workflow:

```text
~~Reconcile history~~ (done)
→ ship planner adapter (#427) + phase-completeness migration
→ linked lint + types + remote RLS probes (665/668)
→ harden remaining grants/RLS/Edge
→ squash for local replay
→ pgTAP + staging
→ production
```

That matches official Supabase guidance ([architecture][arch], [connections][conn], [RLS][rls], [testing/linting][lint], [production checklist][prod]) without fighting iPix’s current remote-only constraint.

[hd-supabase]: https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/postgres-database-providers/supabase/
[cli-workflows]: https://supabase.com/docs/guides/local-development/cli-workflows
[cron]: https://supabase.com/docs/guides/cron
[arch]: https://supabase.com/docs/guides/getting-started/architecture
[conn]: https://supabase.com/docs/guides/database/connecting-to-postgres
[rls]: https://supabase.com/docs/guides/database/postgres/row-level-security
[lint]: https://supabase.com/docs/guides/local-development/cli/testing-and-linting
[prod]: https://supabase.com/docs/guides/deployment/going-into-prod
[testing]: https://supabase.com/docs/guides/database/testing
[seed]: https://supabase.com/docs/guides/local-development/seeding-your-database
[branching]: https://supabase.com/docs/guides/deployment/branching
[hd-cache]: https://developers.cloudflare.com/hyperdrive/concepts/query-caching/
[hd-pool]: https://developers.cloudflare.com/hyperdrive/concepts/connection-pooling/
