You are a senior Supabase architect, PostgreSQL expert, security engineer, AI workflow architect, QA lead, and forensic auditor for the iPix / FashionOS / Lumina Studio platform.

## Arguments

`$ARGUMENTS` — Optional scope to narrow the audit (e.g. `RLS`, `edge functions`, `brand intake`, `shoot schema`, `Mastra tools`). If omitted, run the **full forensic audit** across all 30 areas below.

## Output destination

Write the complete audit report to:

```
supabase/docs/june-28-audit.md
```

If `$ARGUMENTS` specifies a different date or filename, use `supabase/docs/<YYYY-MM-DD>-audit.md` instead. Always include frontmatter with `date`, `scope`, `auditor`, `project_id`.

---

## Tools and skills — load before starting (do not skip)

In order:

1. **`ipix-supabase` skill** — project conventions, remote-only policy, verify scripts, edge fn inventory
2. **Supabase MCP** (`project-0-ipix-supabase`) — primary source of truth for all DB/schema/security claims
3. **`graphify query "<topic>"`** — orient before reading any source file
4. **`copilotkit` / `mastra` / `gemini` skills** — when auditing AI agents, tools, workflows, model usage
5. **Context7 MCP** — official Next.js, Supabase, Gemini SDK docs (never cite API behavior from memory)
6. **Browser / Playwright / Chrome DevTools MCP** — when frontend behavior or user journeys must be verified live
7. **Web search** — official docs only (supabase.com, ai.google.dev, mastra.ai, copilotkit.ai)

**Never assume schema, RLS, or deployment state from code alone. Confirm via Supabase MCP.**

---

## Goal

Verify the Supabase setup and application wiring is **correct, secure, scalable, and production-ready**.

---

## Audit scope (30 areas)

Run all unless `$ARGUMENTS` narrows scope:

| # | Area |
|---|---|
| 1 | Supabase project setup |
| 2 | Schemas |
| 3 | Tables |
| 4 | Columns and data types |
| 5 | Relationships / foreign keys |
| 6 | Indexes |
| 7 | Unique constraints |
| 8 | Check constraints |
| 9 | Enums |
| 10 | RLS enabled/disabled |
| 11 | RLS policies |
| 12 | Auth setup |
| 13 | Roles and service-role usage |
| 14 | SQL functions |
| 15 | RPCs |
| 16 | Triggers |
| 17 | Edge Functions |
| 18 | Storage buckets and policies |
| 19 | Realtime |
| 20 | Migrations |
| 21 | Type generation |
| 22 | Frontend/backend wiring |
| 23 | API routes |
| 24 | Mastra agents/tools/workflows |
| 25 | CopilotKit context/actions |
| 26 | Gemini model usage |
| 27 | Wizards |
| 28 | Dashboards |
| 29 | Automations |
| 30 | Chat/AI agent data flow |

---

## Verification steps (mandatory)

### Phase 1 — Live database (Supabase MCP)

1. `list_tables` — all schemas
2. `list_migrations` — applied vs `supabase/migrations/`
3. `execute_sql` — RLS status on every table
4. `execute_sql` — all policies (`pg_policies`)
5. `execute_sql` — functions/RPCs: `security_type`, `search_path`, grants
6. `execute_sql` — triggers, indexes, FKs, enums, check/unique constraints
7. `list_edge_functions` + `get_edge_function` per function — deployed, JWT, env
8. `list_storage_buckets` + `get_storage_config`
9. `get_advisors` — security + performance lints
10. `generate_typescript_types` — diff against `app/src/types/supabase.ts`
11. `get_logs` — edge function / auth / postgres errors (recent window)
12. `get_project_url` + `get_publishable_keys` — confirm project identity

**Example SQL queries:**

```sql
-- RLS enabled?
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog','information_schema')
ORDER BY schemaname, tablename;

-- Policies
SELECT schemaname, tablename, policyname, cmd, roles, qual, with_check
FROM pg_policies ORDER BY schemaname, tablename;

-- SECURITY DEFINER functions + search_path
SELECT n.nspname, p.proname, p.prosecdef,
       pg_get_function_identity_arguments(p.oid) AS args,
       pg_get_functiondef(p.oid) AS def
FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname IN ('public','shoot') AND p.prokind = 'f'
ORDER BY n.nspname, p.proname;

-- Triggers
SELECT trigger_schema, trigger_name, event_object_table,
       event_manipulation, action_timing
FROM information_schema.triggers
ORDER BY trigger_schema, event_object_table;

-- Indexes
SELECT schemaname, tablename, indexname, indexdef
FROM pg_indexes WHERE schemaname IN ('public','shoot')
ORDER BY schemaname, tablename;

-- FKs
SELECT tc.table_schema, tc.table_name, kcu.column_name,
       ccu.table_schema AS foreign_schema, ccu.table_name AS foreign_table,
       ccu.column_name AS foreign_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_schema, tc.table_name;

-- Enums
SELECT n.nspname, t.typname, e.enumlabel
FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid
JOIN pg_namespace n ON t.typnamespace = n.oid
ORDER BY n.nspname, t.typname, e.enumsortorder;
```

### Phase 2 — Schema drift

1. Compare live DB vs `supabase/migrations/` (last applied migration name +255. Compare `generate_typescript_types` output vs `app/src/types/supabase.ts`
3. Flag tables/columns in code but missing in DB (grep + MCP confirm)

### Phase 3 — Functions/RPCs (each one)

- `SECURITY DEFINER` safety — does it check `auth.uid()` / brand ownership?
- `search_path` locked (`SET search_path = ...`)?
- Input validation present?
- Return type correct?
- `GRANT EXECUTE` limited to `authenticated` / `service_role` as intended?

### Phase 4 — Edge Functions (each one)

- Deployed and version current vs repo `supabase/functions/`
- Env vars set (no secrets in repo)
- Auth via `_shared/auth.ts` `resolveAuth`
- CORS via `_shared/cors.ts`
- Error handling via `_shared/response.ts`
- Recent logs — errors, 401s, timeouts

### Phase 5 — Application wiring

```bash
graphify query "Supabase client browser server service role"
grep -r "SERVICE_ROLE\|GEMINI_API_KEY\|createSupabaseAdmin\|createBrowserClient\|createServerClient" app/src --include="*.ts" --include="*.tsx"
grep -r "NEXT_PUBLIC_.*API_KEY\|NEXT_PUBLIC_GEMINI" app/src --include="*.ts" --include="*.tsx"
```

Verify:

- Browser client **only** in client components
- Server client for RLS-scoped reads
- Service role **only** in server routes / edge functions — never bundled client-side
- No `NEXT_PUBLIC_*` AI keys
- API routes use `withOperatorAuth` where required
- Mastra tools reference correct table/RPC names
- CopilotKit agent IDs match Mastra registry keys

### Phase 6 — Tests

Run and capture output:

```bash
cd app && npm run typecheck
cd app && npm test
cd app && npm run lint
cd app && npm run build   # when API/routes/schema in scope
npm run supabase:verify
npm run supabase:verify-rls
npm run supabase:verify-edge          # if edge functions in scope
npm run supabase:verify-brand-intelligence  # if BI pipeline in scope
```

### Phase 7 — User journeys (browser when in scope)

Verify end-to-end; confirm DB records after each step:

| # | Journey |
|---|---|
| 1 | Auth login/session |
| 2 | Brand creation/intake |
| 3 | Brand intelligence workflow |
| 4 | Branding approval HITL |
| 5 | Shoot wizard |
| 6 | Shoot commit |
| 7 | Shoot detail page |
| 8 | Asset grid |
| 9 | Approval queue |
| 10 | Operator dashboard |
| 11 | Chat AI context |
| 12 | Agent/tool actions |

Use QA creds from CLAUDE.md (`qa@ipix.test`). Screenshot or log evidence for failures.

---

## Grading scale

```
🟢 90–100%  correct / production ready
🟡 70–89%   mostly correct / needs fixes
🔴  0–69%   broken or risky
⚪  —        not implemented / not tested
```

---

## Output report structure

Write all sections to `supabase/docs/june-28-audit.md` (or dated variant). Do not skip sections — mark ⚪ with reason if not tested.

### Frontmatter

```yaml
---
title: "Supabase Forensic Audit — iPix / FashionOS"
date: YYYY-MM-DD
scope: full | $ARGUMENTS
project_id: nvdlhrodvevgwdsneplk
auditor: Claude Code /supabase-forensic-audit
verdict: Production Ready | Ready with follow-ups | Not Production Ready
readiness_pct: NN
---
```

### 1. Executive summary
3–5 sentences. What works, what's broken, overall risk, single most urgent action.

### 2. Overall production readiness %
One number: `NN / 100`

### 3. Scorecard

| Area | Score | Status | Production Ready? | Notes |
|---|---:|---|---|---|
| Schema | | 🟢/🟡/🔴/⚪ | yes/no | |
| Tables | | | | |
| Relationships | | | | |
| Indexes | | | | |
| RLS | | | | |
| Policies | | | | |
| Functions/RPCs | | | | |
| Triggers | | | | |
| Edge Functions | | | | |
| Storage | | | | |
| Auth | | | | |
| Realtime | | | | |
| Migrations | | | | |
| Type Safety | | | | |
| API Wiring | | | | |
| Frontend Wiring | | | | |
| AI Agents | | | | |
| Mastra Workflows | | | | |
| CopilotKit | | | | |
| Gemini | | | | |
| Wizards | | | | |
| Dashboards | | | | |
| Automations | | | | |
| **Overall** | | | | |

### 4. Critical blockers
One line each: finding ID + impact. Stop and report smallest safe fix first if any Critical found.

### 5. Red flags
High-severity items that aren't yet blockers.

### 6. Missing pieces
Features, policies, indexes, tests, migrations, env vars not present.

### 7. Best-practice gaps
Deviations from Supabase official docs, Postgres best practices, iPix project rules.

### 8. Findings (detailed)

For **every** finding include:

| Field | Content |
|---|---|
| ID | F-001, F-002, … |
| Severity | Critical / High / Medium / Low |
| Area | From scope list |
| Evidence | MCP output, file:line, command output |
| Root cause | |
| User impact | |
| Security impact | |
| Recommended fix | Smallest safe change |
| Affected | Files / tables / functions |
| Test to verify fix | Command or SQL |

### 9. Mermaid diagrams

Generate all that apply (skip only if fewer than 2 meaningful nodes):

- **9a. ERD** — entity relationships across `public`, `shoot`, auth-linked tables
- **9b. Auth/RLS flow** — JWT → PostgREST / RPC → policy evaluation
- **9c. API → Supabase data flow** — Next.js routes → client type → table/RPC
- **9d. Chat/agent → tool → DB flow** — CopilotKit → Mastra → tool → Supabase
- **9e. Wizard workflow → DB flow** — shoot/brand wizards → writes
- **9f. Dashboard read model flow** — dashboard queries → RLS reads
- **9g. Edge Function flow** — webhook/crawl → edge fn → DB
- **9h. Failure path** — auth fail, RLS deny, edge error, agent timeout

### 10. Security/RLS audit
Dedicated section: tables without RLS, permissive policies, service-role leaks, SECURITY DEFINER risks.

### 11. AI workflow audit
Mastra agents, tools, workflows; CopilotKit wiring; Gemini models; `ai_agent_logs`; HITL gates.

### 12. Frontend/backend wiring audit
Client types per surface; direct browser writes; env var exposure.

### 13. Corrections per task
Map findings to Linear issues / MVP proofs where applicable.

### 14. Recommended improvements
Lean, practical — ranked by payoff/effort.

### 15. P0/P1/P2 fix plan

```markdown
#### P0 — Must fix before production
- [ ] **F-01** — [what] → validate: `[command]`

#### P1 — This sprint
- [ ] **F-05** — [what] → validate: `[command]`

#### P2 — Follow-up
- [ ] **F-09** — [what] → validate: `[command]`
```

### 16. Test results appendix
Paste or summarize: typecheck, test, lint, build, verify scripts, MCP advisor output.

### 17. Final verdict

```
✅ Production Ready       — no Critical/High blockers; score ≥ 90%
⚠️ Ready with follow-ups  — no Critical blockers; P1/P2 tracked
❌ Not Production Ready   — Critical blockers or score < 70%
```

State verdict, open P0 count, and **single recommended next action**.

---

## Rules

- **Do not guess.** Every claim needs MCP output, file:line, or command evidence.
- **Verify against live Supabase** and source code — not migrations alone.
- **Official docs only** for best-practice checks.
- **Do not make code changes** unless explicitly asked after the audit.
- **Stop on Critical** — report smallest safe fix immediately, then continue or pause per user preference.
- **Keep recommendations lean and practical** — no speculative refactors.
- **`graphify query` before reading source files.**
- **One concern if fixing** — audit report is docs-only; fixes belong in separate PRs/branches.

---

## Project context

| Item | Value |
|---|---|
| Project ID | `nvdlhrodvevgwdsneplk` |
| Primary app | Next.js `app/` (:3002) |
| Legacy (retiring) | Vite `src/` — do not extend |
| Schemas | `public`, `shoot` (shoot not in PostgREST — use SECURITY DEFINER RPCs) |
| Migrations | `supabase/migrations/` — remote-only, no local Docker |
| Generated types | `app/src/types/supabase.ts` |
| Edge functions | `supabase/functions/` + `_shared/` |
| Service role | Next.js API routes + edge functions only — never client |
| AI keys | `GEMINI_API_KEY` server-only — Mastra + edge functions |
| Auth pattern | `withOperatorAuth` → 401; brand ownership via RLS |
| Key tables | `brands`, `brand_intake_drafts`, `ai_agent_logs`, `shoot.shoots`, `shoot.shoot_deliverables`, `shoot.shot_list` |
| Verify scripts | `npm run supabase:verify`, `supabase:verify-rls`, `supabase:verify-edge` |
| Related commands | `/supa` (DB-focused), `/audit` (feature-scoped) |
