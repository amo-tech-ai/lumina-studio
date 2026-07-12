# Cloudflare Verification Checklist — Steps × Skills × MCP

Maps every verification step in the cloudflare-workflow skill to the exact skill to load,
MCP tool to call, command to run, and pass/fail criteria. Use this as the operational
checklist for any Cloudflare PR or task.

## How to use

For each stage, run the checks in order. A check is Pass, Fail, or N/A (with reason).
Any Fail in a Required row = blocker. Advisory rows are recommended but not blocking.

---

## Stage 0 — Research & Architecture Review

### 0.1 Read issue / Linear task

| Check | Skill | MCP / Tool | Command | Pass criteria |
|-------|-------|------------|---------|---------------|
| Read Linear issue | `linear` | Linear MCP (if available) | Read `docs/linear/issues/IPI-*.md` | Issue file exists and ACs are listed |
| Check task status | `linear` | — | `grep -r "IPI-<N>" docs/linear/` | Status is In Progress or In Review, not Done |
| Read PRD section | `ipix` | — | Read `prd.md` relevant section | PRD addresses this feature area |

### 0.2 Read current code

| Check | Skill | MCP / Tool | Command | Pass criteria |
|-------|-------|------------|---------|---------------|
| Read changed files | — | — | `git show <SHA>:<path>` | All changed files read at HEAD |
| Dependency map | `graphify` | — | `graphify query "<concept>"` | Subgraph reviewed before editing |
| Impact analysis | `graphify` | — | `graphify path "<src>" "<dst>"` | No unexpected downstream consumers |

### 0.3 Read official Cloudflare docs

| Check | Skill | MCP / Tool | Command | Pass criteria |
|-------|-------|------------|---------|---------------|
| Runtime API docs | `cloudflare` | `cloudflare_docs` / `cloudflare-bindings_search_cloudflare_documentation` | Search for the API being used (e.g. "node:fs Workers", "nodejs_compat") | Docs confirm the API is supported + required flags |
| OpenNext docs | `cloudflare` | `cloudflare_docs` | Search "OpenNext" + feature name | OpenNext compatibility confirmed |
| Workers best practices | `workers-best-practices` | — | Read SKILL.md | Pattern matches recommended approach |

### 0.4 Read installed package source

| Check | Skill | MCP / Tool | Command | Pass criteria |
|-------|-------|------------|---------|---------------|
| Package is ESM | — | — | `grep '"type"\|"module"\|"exports"' node_modules/<pkg>/package.json` | Has ESM export path (`"import"` or `"module"`) |
| No Node-only deps | — | — | `grep -r "require(\|readFileSync\|child_process" node_modules/<pkg>/dist/` | No Node-only runtime calls in imported paths |

### 0.5 Architecture review

| Check | Skill | MCP / Tool | Command | Pass criteria |
|-------|-------|------------|---------|---------------|
| ADRs reviewed | `ipix` | — | Read `docs/architecture/` or ADR files | No ADR contradicts the planned change |
| Roadmap aligned | `ipix` | — | Read `tasks/plan/todo.md` or roadmap | Task is in current priority queue |
| Right ownership | `ipix-task-lifecycle` | — | Check no sibling PR/issue owns this | This task is the correct owner |

### 0.6 Duplicate search

| Check | Skill | MCP / Tool | Command | Pass criteria |
|-------|-------|------------|---------|---------------|
| Linear duplicates | `linear` | Linear MCP | Search Linear for keyword | No duplicate issue found |
| GitHub PR duplicates | `pr-workflow` | — | `gh pr list --state all --search "<keyword>"` | No duplicate PR found |
| Codebase duplicates | — | — | `grep -r "<function-name>\|<pattern>" app/src/` | No existing implementation found |
| Open PR duplicates | `pr-workflow` | — | `gh pr list --state open` | No active branch doing the same thing |

### 0.7 node:fs / Node API verification

| Check | Skill | MCP / Tool | Command | Pass criteria |
|-------|-------|------------|---------|---------------|
| nodejs_compat enabled | `cloudflare` | — | `grep "nodejs_compat" wrangler.jsonc` | Flag is present |
| compatibility_date current | `cloudflare` | — | `grep "compatibility_date" wrangler.jsonc` | Date >= 2024-09-23 (polyfills) or >= 2025-09-01 (native) |
| File exists in bundle | `cloudflare-workflow` | — | Static `import` not runtime `readFileSync` | File is bundled, not disk-read |
| Wrangler preview | `wrangler` | — | `wrangler dev` + test route | Route works without ENOENT |

---

## Stage 1 — Scope Verification

| Check | Skill | MCP / Tool | Command | Pass criteria | Required? |
|-------|-------|------------|---------|---------------|-----------|
| Aligns with architecture | `cloudflare-workflow` | — | Compare task vs Stage 0 output | ✅ In scope | Yes |
| No overlapping PRs | `pr-workflow` | — | `gh pr list --state open` | No overlapping branch | Yes |
| One concern per PR | `pr-workflow` | — | `git diff main...HEAD --name-only` | All files are one concern | Yes |
| No docs + code mix | `pr-workflow` | — | Check no `docs/**` in code PR diff | Clean separation | Yes |

---

## Stage 2 — Evidence Collection

### For each review comment / issue:

| Check | Skill | MCP / Tool | Command | Pass criteria |
|-------|-------|------------|---------|---------------|
| Read source at HEAD | — | — | `git show <SHA>:<path>` | File read at exact line |
| Read package source | — | — | `cat node_modules/<pkg>/dist/<file>` | Package behavior confirmed |
| Cloudflare docs confirm | `cloudflare` | `cloudflare_docs` / `user-cloudflare-docs` | Search for the API/pattern | Docs support or refute the claim |
| Runtime reproduction | `cloudflare-workflow` | — | `wrangler dev` + curl the route | Behavior reproduced or refuted |
| Classify finding | `cloudflare-workflow` | — | — | Confirmed / Unproven / Already Fixed / Incorrect / Out of Scope |

### 2.1 AI Gateway embeddings / errors (when `**/embeddings` or `provider-adapter` embed touched)

| Check | Skill | MCP / Tool | Command | Pass criteria | Required? |
|-------|-------|------------|---------|---------------|-----------|
| BGE dims / token limit | `cloudflare` | `search_cloudflare_documentation` `"bge-base-en-v1.5"` | — | Docs say **768** dims, **512** max input tokens | Yes |
| OpenAI-compat embed shape | `cloudflare` | docs search `"OpenAI compatible embeddings"` | — | Compat path uses `input` (not native `text`) | Yes |
| No silent model remap | `cloudflare-workflow` | — | `rg -n "remap\|embedding.*gemini\|startsWith\\(\"gemini\"\\)" services/cloudflare-worker app/src/lib/ai` | No gemini-name heuristic; allowlist only | Yes |
| Unknown model ≠ default chat | — | — | Read `selectProvider` / `handleEmbed` | `/v1/embeddings` rejects unknown before default fallback | Yes |
| Empty input → 400 pre-provider | — | — | Unit test + `expect(fetch).not.toHaveBeenCalled()` | Pass | Yes |
| Error envelope sanitized | — | — | Inspect error JSON | Has `code`/`message`; no raw provider body / secrets | Yes |
| Adapter typed error | — | — | `rg AiGatewayError app/src/lib/ai` | Callers get `error.code`, not string-parse | Yes |
| Live smoke | — | — | curl empty / wrong model / happy on `:8787` | 400 / 400 / 200+768 | Yes (Local Runtime) |

---

## Stage 3 — Implementation

| Check | Skill | MCP / Tool | Command | Pass criteria |
|-------|-------|------------|---------|---------------|
| Domain skill loaded | (by path matrix) | — | Load skill matching changed paths | SKILL.md read before editing |
| Smallest safe diff | `pr-workflow` | — | `git diff --stat HEAD` after fix | Only flagged lines changed |
| >3 files → confirm | `pr-workflow` | — | Ask user | User approved |
| One concern per commit | `pr-workflow` | — | `git log --oneline -3` | Each commit is one logical change |

### Path → skill matrix (by changed area)

| Changed paths | Skill to load | MCP to use |
|---|---|---|
| `app/src/app/api/copilotkit/**` | `copilotkit` | — |
| `app/src/mastra/**` | `mastra`, `gemini` | Mastra docs search |
| `app/src/lib/supabase/**`, auth | `ipix-supabase`, `nextjs-developer` | `supabase` MCP |
| App Router, RSC, data fetching | `nextjs-developer`, `nextjs-16` | — |
| `supabase/migrations/**` | `ipix-supabase` | `supabase` MCP (`execute_sql`, `get_advisors`) |
| `supabase/functions/**` | `ipix-supabase`, `gemini` | `supabase` MCP (`list_edge_functions`) |
| Cloudflare Workers, wrangler config | `cloudflare`, `workers-best-practices`, `wrangler` | `cloudflare-docs` MCP |
| D1 / KV / R2 bindings | `cloudflare` | `cloudflare-bindings` MCP |
| Durable Objects | `durable-objects` | `cloudflare-docs` MCP |
| Workers builds / deploy | `cloudflare`, `wrangler` | `cloudflare-builds` MCP |
| Worker logs / observability | `cloudflare` | `cloudflare-observability` MCP |
| AI / Gemini / Groq | `gemini`, `groq-inference` | — |
| Cloudinary / media | `cloudinary` | — |
| Tests | `gen-test` | — |
| Env / secrets | `infisical` | — |

---

## Stage 4 — Testing

| Check | Skill | MCP / Tool | Command | Pass criteria | Required? |
|-------|-------|------------|---------|---------------|-----------|
| Typecheck | — | — | `cd app && npm run typecheck` | 0 errors | Yes |
| Lint | — | — | `cd app && npm run lint` | 0 errors | Yes |
| Targeted tests | `gen-test` | — | `cd app && npx vitest run <path>` | Pass | Yes |
| Full test suite | — | — | `cd app && npm test` | No new failures vs main | Yes |
| Regression test exists | `gen-test` | — | `grep -r "<bug-pattern>" app/src/**/*.test.ts` | Test covers the fix | Yes for bug fixes |
| Supabase verify | `ipix-supabase` | `supabase` MCP | `infisical run -- npm run supabase:verify` | Pass | If Supabase touched |
| RLS verify | `ipix-supabase` | `supabase` MCP (`get_advisors`) | `infisical run -- npm run supabase:verify-rls` | Pass + advisors clean | If migrations touched |
| Edge verify | `ipix-supabase` | `supabase` MCP (`list_edge_functions`) | `npm run supabase:verify-edge` | Pass | If edge touched |

---

## Stage 5 — Runtime Matrix + Bundle Audit

### Runtime matrix

| Level | Skill | MCP / Tool | Command | Pass criteria | Required? |
|-------|-------|------------|---------|---------------|-----------|
| Code Verified | `pr-workflow` | — | `git diff main...HEAD` review | All changes reviewed | Yes |
| Unit Verified | `gen-test` | — | `cd app && npm test` | All tests pass | Yes |
| Build Verified | `nextjs-developer` | — | `cd app && npm run build` | Build exits 0 | Yes |
| OpenNext Build | `cloudflare`, `wrangler` | — | `cd app && CI=true npx opennextjs-cloudflare build` | Build exits 0 | Yes for CF |
| Local Runtime | `wrangler` | — | `cd app && wrangler dev` + curl routes | Routes respond correctly | Yes for CF |
| Remote Preview | `wrangler` | `cloudflare-builds` MCP | `cd app && npm run preview` or `npm run upload` | Preview URL live | Recommended |
| Production | `cloudflare` | `cloudflare-observability` MCP | DNS cutover + smoke test | Live routes pass | For production deploys |

### Bundle audit (after `opennextjs-cloudflare build`)

| Check | Skill | MCP / Tool | Command | Pass criteria | Required? |
|-------|-------|------------|---------|---------------|-----------|
| Bundle files exist | `cloudflare` | — | `ls .open-next/worker.js .open-next/assets/` | Both exist | Yes |
| Bundle size | `lean` | — | `du -sh .open-next/` | <50MB or justified | Advisory |
| Static JSON bundled | `cloudflare-workflow` | — | `grep -r "envMapping\|groqModels" .open-next/` | Config found in bundle | If JSON bundling |
| Server chunks | `nextjs-developer` | — | `ls .open-next/server-functions/` | Route chunks exist | Yes |
| No secrets in bundle | `pr-workflow` | — | `grep -r "SERVICE_ROLE\|GEMINI_API_KEY\|GROQ_API_KEY" .open-next/` | Empty output | Yes |
| No unexpected Node imports | `cloudflare-workflow` | — | `grep -r "require(\|readFileSync\|existsSync" .open-next/server-functions/` | No unexpected hits | Yes |
| No eval / code-gen | `workers-best-practices` | — | `grep -r "eval(\|Function(" .open-next/` | Empty output | Yes |

---

## Stage 6 — Documentation Contradiction Check

| Check | Skill | MCP / Tool | Command | Pass criteria | Required? |
|-------|-------|------------|---------|---------------|-----------|
| Source == Tests | `gen-test` | — | Compare diff vs test coverage | Tests cover new behavior | Yes |
| Tests == Runtime | `cloudflare-workflow` | — | Test assertions match wrangler dev behavior | No mismatch | Yes |
| Runtime == Docs | `pr-workflow` | — | PR body matches actual behavior | No contradiction | Yes |
| Docs == Linear | `linear`, `ipix-task-lifecycle` | — | Linear issue state matches PR state | No stale state | Yes |
| ACs satisfied | `ipix-task-lifecycle` | — | Each AC has a probe result | All green or explicitly waived | Yes if closes IPI |
| Test counts current | `pr-workflow` | — | PR body test count matches `npm test` output | Numbers match | Yes |
| File references exist | `pr-workflow` | — | Every file path in PR body exists at HEAD | All paths valid | Yes |
| Links valid | — | — | URLs in PR body return 200 | No dead links | Advisory |

---

## Stage 7 — Architecture Review

| Check | Skill | MCP / Tool | Command | Pass criteria | Required? |
|-------|-------|------------|---------|---------------|-----------|
| Matches architecture | `ipix`, `cloudflare` | — | Compare against ADRs / architecture docs | Consistent | Yes |
| No duplicate impl | `graphify` | — | `graphify query "<concept>"` + codebase grep | No duplicate | Yes |
| Single source of truth | `ipix-supabase` | — | Check SSOT file (e.g. `config/groq-models.json`) | One SSOT, bundled copy synced | Yes |
| Clear ownership | `ipix-task-lifecycle` | — | No sibling task owns this change | Clean ownership | Yes |
| No unnecessary abstractions | `lean` | — | Review for wrapper functions / indirection | Minimal abstraction | Advisory |
| Cloudflare best practices | `workers-best-practices`, `cloudflare` | `cloudflare-docs` MCP | Search for pattern in docs | Follows current guidance | Yes |

---

## Stage 8 — Production Readiness

| Check | Skill | MCP / Tool | Command | Pass criteria | Required? |
|-------|-------|------------|---------|---------------|-----------|
| CI passes | `pr-workflow` | — | `gh pr checks <N> --watch=false` | All required checks green | Yes |
| Next build passes | `nextjs-developer` | — | `cd app && npm run build` | Exit 0 | Yes |
| OpenNext build passes | `cloudflare` | — | `npx opennextjs-cloudflare build` | Exit 0 | Yes for CF |
| Local runtime verified | `wrangler` | — | `wrangler dev` + route tests | Routes respond | Yes for CF |
| Bundle audit passed | `cloudflare-workflow` | — | Stage 5 bundle audit all Pass | All checks green | Yes for CF |
| Security satisfied | `pr-workflow` | — | Grep for secrets in diff + bundle | No secrets exposed | Yes |
| Review threads resolved | `pr-workflow` | — | GraphQL unresolved count = 0 | 0 unresolved | Yes |
| Regression tests added | `gen-test` | — | Bug → Fix → Test pattern | Test exists for each fix | Yes for bug fixes |
| Docs updated + checked | `cloudflare-workflow` | — | Stage 6 contradiction check passed | No contradictions | Yes |
| Linear synchronized | `linear` | — | Issue state = In Review or Done | Matches reality | Yes |
| Worker observability | `cloudflare` | `cloudflare-observability` MCP | `query_worker_observability` for errors | No runtime errors post-deploy | For production |

---

## Cloudflare Outcome Grader (merge gate)

Score every Cloudflare PR against this rubric. Any Fail = blocker.

| # | Criterion | Skill | MCP | How to verify | Pass | Fail |
|---|-----------|-------|-----|---------------|------|------|
| 1 | Runtime compatibility | `workers-best-practices` | `cloudflare-docs` | Grep Workers-loaded modules for `require()` | No `require()`, ESM only | `require()` in Workers path |
| 2 | Official docs checked | `cloudflare` | `cloudflare_docs` / `cloudflare-bindings_search_cloudflare_documentation` | Search docs for each runtime API claim | Docs confirm support + flags | Assumed from training data |
| 3 | Bundle verified | `cloudflare-workflow` | — | Stage 5 bundle audit | No secrets, no Node imports, assets present | Bundle not inspected |
| 4 | No Node runtime assumptions | `cloudflare` | `cloudflare-docs` | Verify node:fs/require against nodejs_compat + compat_date | Verified against current docs | Assumed without checking |
| 5 | OpenNext build passes | `cloudflare` | — | `npx opennextjs-cloudflare build` | Exit 0 | Fails or skipped |
| 6 | Wrangler preview passes | `wrangler` | — | `wrangler dev` + curl routes | Routes respond | Not tested |
| 7 | Regression tests added | `gen-test` | — | Test fails before fix, passes after | Test exists | No test for fix |
| 8 | Docs synchronized | `cloudflare-workflow` | — | Stage 6 contradiction check | Source==Tests==Runtime==Docs==Linear | Any surface contradicts |
| 9 | Linear synchronized | `linear` | — | Issue state matches PR state | In Review / Done | Stale state |
| 10 | Scope preserved | `pr-workflow` | — | One concern, no mixing | Clean PR | Mixed concerns |

**Merge gate:** all 10 must be Pass or explicitly waived with documented reason.

---

## MCP Quick Reference — which server for which task

| MCP Server | When to use | Key tools |
|------------|-------------|-----------|
| `cloudflare` | API calls, OpenAPI spec search, doc search | `cloudflare_request`, `cloudflare_search`, `cloudflare_docs` |
| `cloudflare-docs` | Documentation lookup for Workers/AI/D1/R2 | `cloudflare-docs_search_cloudflare_documentation` |
| `cloudflare-bindings` | D1/KV/R2/Hyperdrive CRUD + queries | `d1_database_query`, `kv_namespaces_list`, `r2_buckets_list`, `hyperdrive_configs_list` |
| `cloudflare-builds` | Workers build inspection + logs | `workers_builds_list_builds`, `workers_builds_get_build_logs` |
| `cloudflare-observability` | Worker logs, metrics, error analysis | `query_worker_observability`, `observability_keys`, `observability_values` |
| `supabase` | SQL execution, migrations, advisors, edge functions | `execute_sql`, `apply_migration`, `get_advisors`, `list_edge_functions` |

---

## Skill Quick Reference — which skill for which domain

| Skill | Location | When to load |
|-------|----------|-------------|
| `cloudflare-workflow` | `.opencode/skills/` | ALWAYS — process gate for all CF work |
| `pr-workflow` | `.opencode/skills/` | Any PR lifecycle operation |
| `cloudflare` | `.agents/skills/` | Platform reference hub (Workers/Pages/KV/D1/R2/AI) |
| `workers-best-practices` | `.agents/skills/` | Writing or reviewing Worker code |
| `wrangler` | `.agents/skills/` | CLI commands (deploy, dev, build, secrets) |
| `durable-objects` | `.agents/skills/` | DO class, state, RPC, alarms, WebSocket |
| `agents-sdk` | `.agents/skills/` | Agents SDK, stateful agents, workflows |
| `ipix-supabase` | `.claude/skills/` | Schema, RLS, migrations, edge functions |
| `supabase` | `.agents/skills/` | Generic Supabase guidance |
| `supabase-postgres-best-practices` | `.agents/skills/` | Postgres performance tuning |
| `copilotkit` | `.claude/skills/` | CopilotKit v2 integration |
| `mastra` | `.claude/skills/` | Mastra agents, tools, workflows |
| `gemini` | `.claude/skills/` | Gemini AI in edge functions |
| `groq-inference` | `.claude/skills/` | Groq API + model config |
| `nextjs-developer` | `.claude/skills/` | Next.js App Router patterns |
| `nextjs-16` | `.claude/skills/` | Next.js 16 platform specifics |
| `linear` | `.claude/skills/` | Linear issue management |
| `ipix-task-lifecycle` | `.claude/skills/` | 5-phase IPI task workflow |
| `gen-test` | `.claude/skills/` | Vitest test generation |
| `graphify` | `.claude/skills/` | Codebase knowledge graph queries |
| `infisical` | `.claude/skills/` | Secret management |
| `lean` | `.claude/skills/` | Scope/bundle/performance optimization |
