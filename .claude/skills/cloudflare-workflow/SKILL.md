---
name: cloudflare-workflow
description: Accuracy-first engineering workflow standard for ALL Cloudflare-related work — Workers, OpenNext, AI Gateway, Workers AI, Durable Objects, Queues, KV, Vectorize, Hyperdrive, D1, R2, Workflows, AI provider integrations, CopilotKit, Mastra, Supabase integration, OAuth, runtime compatibility, deployment, CI/CD, and security. Enforces a 9-stage gate (Stage 0 research & architecture review, scope verification, evidence collection, focused implementation, layered testing, runtime matrix verification, documentation contradiction check, architecture review, production readiness) with a per-stage reporting template and a Cloudflare Outcome Grader rubric. Use whenever touching Cloudflare infrastructure, Workers code, OpenNext builds, bindings, or any task that crosses Cloudflare + Supabase/Mastra/CopilotKit — even if the user does not say "Cloudflare". Do NOT skip stages or merge before all quality gates pass.
---

# Cloudflare Engineering Workflow (Accuracy-First Standard)

Applies to **all** Cloudflare-related work, including:

- Cloudflare Workers
- OpenNext
- AI Gateway
- Workers AI
- Durable Objects
- Queues
- KV
- Vectorize
- Hyperdrive
- D1
- R2
- Workflows
- AI Provider integrations
- CopilotKit
- Mastra
- Supabase integration
- OAuth
- Runtime compatibility
- Deployment
- CI/CD
- Security

---

## Principles

- Verify before changing.
- Keep each task focused.
- Base decisions on evidence, not assumptions.
- Preserve architecture consistency.
- Prevent documentation drift.
- Keep implementation aligned with Linear, PRDs, and the current codebase.
- Official Cloudflare docs override training-data assumptions — the runtime evolves fast.

---

## MCP Cloudflare Tools Reference

Use these tools throughout all stages. Names are exact — copy/paste into ToolSearch.

| Tool | Purpose | When to use |
|------|---------|------------|
| `mcp__claude_ai_Cloudflare_Developer_Platform__search_cloudflare_documentation` | Official Cloudflare API docs | Stage 0 research, any "is this supported?" question |
| `mcp__claude_ai_Cloudflare_Developer_Platform__workers_get_worker` | Get live Worker code | Stage 5 runtime verification — compare deployed vs local |
| `mcp__claude_ai_Cloudflare_Developer_Platform__workers_get_worker_code` | Fetch Worker JS | Stage 2 evidence collection for deployed code |
| `mcp__claude_ai_Cloudflare_Developer_Platform__workers_list` | List Workers | Stage 1 scope verification (no orphan Workers created) |
| `mcp__claude_ai_Cloudflare_Developer_Platform__d1_databases_list` | List D1 instances | Stage 1 scope verification |
| `mcp__claude_ai_Cloudflare_Developer_Platform__d1_database_query` | Run SQL query | Stage 5 runtime verification for schema changes |
| `mcp__claude_ai_Cloudflare_Developer_Platform__kv_namespaces_list` | List KV namespaces | Stage 1 scope verification |
| `mcp__claude_ai_Cloudflare_Developer_Platform__kv_namespace_get` | Get KV namespace config | Stage 5 verify binding exists and is configured |
| `mcp__claude_ai_Cloudflare_Developer_Platform__r2_buckets_list` | List R2 buckets | Stage 1 scope verification |
| `mcp__plugin_cloudflare_cloudflare-api__execute` | Execute arbitrary API call | Stage 5 when MCP tools insufficient |
| `mcp__plugin_cloudflare_cloudflare-docs__search_cloudflare_documentation` | Alternate docs search | Backup if Developer Platform search times out |

---

## Stage 0 — Research & Architecture Review

Before any code changes. Many previous mistakes came from architecture drift, not coding errors.

```
Read Issue / Linear task
  ↓
Read PR (if open)
  ↓
Read Current Code (git show / Read tool)
  ↓
Read Official Cloudflare Docs (cloudflare_docs / webfetch)
  ↓
Read Installed Package Source (node_modules)
  ↓
Architecture Review (ADRs, PRDs, roadmap, graphify)
  ↓
Duplicate Search (Linear, GitHub, codebase, existing PRs)
  ↓
Plan
  ↓
Approval (if scope is ambiguous)
  ↓
Implementation
```

### Architecture review checklist

- [ ] Read relevant ADRs / architecture docs
- [ ] Read PRD section for this feature area
- [ ] Check roadmap for alignment
- [ ] `graphify query "<concept>"` for dependency map
- [ ] Confirm this task is the right owner of the change (not a sibling PR/issue)

### Duplicate search

Before implementing, search across all surfaces:

| Surface | How to search | Questions |
|---------|---------------|-----------|
| Linear | Linear MCP or `docs/linear/issues/` | Already implemented? Already merged? Duplicate issue? |
| GitHub | `gh pr list --state all --search "<keyword>"` | Duplicate PR? Already shipped? |
| Codebase | `grep` / `glob` / `graphify query` | Already implemented in code? |
| Existing PRs | `gh pr list --state open` | Active branch doing the same thing? |

If a duplicate is found → stop, report, and redirect to the existing work. Do not re-implement.

### node:fs and Node API guidance

**Do NOT assume `node:fs` is unsupported.** Cloudflare now supports `node:fs` natively in Workers with `nodejs_compat` and a recent `compatibility_date`, but it is a **virtual bundled filesystem**, not a general-purpose disk.

If `node:fs` is used:

- [ ] Verify `nodejs_compat` is in `compatibility_flags`
- [ ] Verify `compatibility_date` is current (>= 2024-09-23 for polyfills, >= 2025-09-01 for native modules)
- [ ] Verify the file exists in the Worker bundle (static import or `import` statement, not runtime `readFileSync` on an arbitrary path)
- [ ] Verify under `wrangler dev` preview
- [ ] Verify under remote Workers preview

**The rule is:** avoid relying on Node filesystem *semantics* (arbitrary runtime disk reads), not `node:fs` the module. A static `import json from "./config.json"` is Workers-safe; a runtime `readFileSync(path)` that expects a real disk is not.

### CI Testing Audit

Before claiming a test passes, verify that CI actually runs security-sensitive tests with the same configuration as local development:

**Checklist:**
- [ ] Local tests run with security features **ENABLED** (auth, RLS, edge validation) — not bypassed via `.dev.vars` or test fixtures
- [ ] CI runs the same test suites (not a subset)
- [ ] CI explicitly injects secrets/env vars (never using `.dev.vars` or hardcoded test tokens — use actual credentials)
- [ ] CI gate is a **required check** (not optional)
- [ ] If any test file is missing from CI → Stage 0 blocker

**Red flag patterns:**
- `.dev.vars` with `ALLOW_UNAUTHENTICATED=true` used in CI (dev-only bypass)
- Test coverage for auth/RLS/edge missing from CI job matrix
- Security-critical tests only running locally

**Prevention:** Add to `.github/workflows/ci.yml` any test suites that verify authentication, RLS policies, or edge function behavior. Example: `services/cloudflare-worker/npm test` must run in CI with explicit token injection, not dev-mode bypass.

---

## Stage 1 — Scope Verification

Before writing code:

- Verify the task still aligns with the current architecture (Stage 0 output).
- Compare with `origin/main`.
- Check for overlapping PRs and active branches.
- Review related Linear issues.
- Review current PRDs, roadmap, and architecture documents.

Classify work as:

- ✅ In scope
- ⚠️ Related but separate
- ❌ Out of scope

Do not expand the scope.

---

## Stage 2 — Evidence Collection

For every issue or review comment:

Collect evidence from:

1. Current source code
2. Installed package source (`node_modules`)
3. Official Cloudflare documentation (`cloudflare_docs` / webfetch)
4. Runtime reproduction (when possible)

Classify each finding:

- ✅ Confirmed
- 🟡 Unproven
- ⚪ Already fixed
- ❌ Incorrect
- ⚠️ Out of scope

Only implement confirmed, in-scope issues.

### Official Sources Rule

**For any claim about status, pricing, limits, or deprecation — cite the official source.**

Cloudflare documentation evolves fast (models deprecate monthly, limits change, pricing updates). Training data is stale. **Do NOT assume.**

**Source hierarchy (highest to lowest authority):**

1. **Official Cloudflare docs** (via `cloudflare_docs` MCP lookup or webfetch to developers.cloudflare.com)
2. Installed package source (`node_modules/@cloudflare/`, `package.json` dependencies)
3. Test results (local or CI verification)
4. Training data / memory (⚠️ treat as hypothesis, verify before shipping)

**Hard rule: Material claims require proof**

| Claim Type | Example | Proof Required |
|------------|---------|----------------|
| **Status** | "Model X is currently supported" | Link to [Cloudflare model page](https://developers.cloudflare.com/workers-ai/models/) or MCP result |
| **Deprecation** | "Model X was deprecated on DATE" | Link to [Cloudflare changelog](https://developers.cloudflare.com/changelog) with deprecation date |
| **Pricing** | "Model X costs $0.06 per 1M input tokens" | Link to [official pricing page](https://developers.cloudflare.com/workers-ai/pricing/) |
| **Limits** | "Model X supports up to 128k context" | Link to model card or MCP `search_cloudflare_documentation` result |
| **Capability** | "Model X supports tool calling" | Link to model capability matrix or official docs |

**Unverified claims must be marked "TBD"**

If a claim cannot be sourced → mark as "TBD" in the code/PR, not shipped as fact.

**PR review flags:**

- 🔴 **Blocker:** "same pricing" / "same performance" / "zero risk" without source → request link or reject
- 🟡 **Question:** "currently supported" without docs link → ask for source before merge
- 🔴 **Blocker:** "deprecated as of [DATE]" without Cloudflare changelog link → reject until sourced

**Example (from IPI-525 audit):**
- ❌ "Llama 3.1 8B Fast variant has same pricing" (unverified)
- ✅ "Llama 3.1 8B Fast variant: active, 128k context, per [Cloudflare model page](link), pricing TBD" (honest)

---

## Stage 3 — Implementation

- Make one logical change at a time.
- Keep commits small and focused.
- Preserve backwards compatibility where required.
- Avoid unrelated refactoring.
- If a new root cause belongs to another feature or epic, stop and create or update the appropriate Linear task instead of expanding the current work.

---

## Stage 4 — Testing

For every logical change:

Run focused validation first.

Examples:

- targeted unit tests
- typecheck
- lint

After focused validation succeeds:

- full test suite
- production build
- OpenNext build (if applicable)
- Cloudflare preview (if applicable)

### Regression tests

Every bug fix should introduce:

```
Bug → Fix → Regression Test
```

The test must fail before the fix and pass after.

### HTTP Header Edge Cases (Auth-critical code)

**For any authentication, authorization, or header-parsing code:**

Test these edge cases automatically. HTTP parsers inject whitespace and normalization that can break string comparisons.

| Input | Expected | Why | Issue (if missed) |
|-------|----------|-----|-------------------|
| `"secret-token"` | ✅ Pass | Happy path | N/A |
| `"secret-token  "` (trailing spaces) | ✅ Pass | HTTP header parsers inject whitespace | Token comparison fails (401 on valid token) |
| `"SECRET-TOKEN"` (uppercase) | Handle per policy | Case sensitivity policy-dependent | Inconsistent rejection |
| `"secret-token\r\n"` (CRLF) | ✅ Pass | HTTP normalization | Token comparison fails |
| `""` (empty) | ❌ Fail | Empty token detection | Allows empty tokens to bypass auth |
| `null` / `undefined` | ❌ Fail | Null handling | Type error or unexpected auth bypass |
| `" secret-token "` (leading + trailing) | ✅ Pass | Full trim required | Token comparison fails |

**Rule:** Every auth route must pass all seven tests. **Always trim both sides of token before equality check.**

**Code pattern (Bearer token):**
```typescript
const token = match[1];                    // Extract from "Bearer <token>"
if (!token || token.trim() === "") return; // Check for empty
const trimmedToken = token.trim();        // TRIM before comparison
if (trimmedToken !== env.AUTH_TOKEN) return 401;  // Compare trimmed values
```

**Prevention:** Add these tests to any new auth/header parsing code. (Real incident: IPI-468 whitespace bug shipped because happy-path test passed but edge case wasn't covered.)

---

## Stage 5 — Runtime Matrix Verification

Clearly distinguish verification levels. Never claim production readiness without production evidence.

| Level | Meaning | How to verify |
|-------|---------|---------------|
| Code Verified | Source code reviewed | `Read` tool, `git diff` |
| Unit Verified | Tests pass | `npm test` / `vitest run` |
| Build Verified | Application builds | `npm run build` + `npx opennextjs-cloudflare build` |
| Local Runtime Verified | Local Workers runtime | `wrangler dev` / `npm run preview` (local) |
| Remote Preview Verified | Cloudflare preview deploy | `npm run deploy` to preview URL |
| Production Verified | Live production | DNS cutover + production smoke test |

Never say just "Verified" — always specify the level.

### Bundle audit (after `opennextjs-cloudflare build`)

Especially for Workers. After the build, inspect the generated bundle:

| Check | How |
|-------|-----|
| Bundled files present | `ls .open-next/` — verify `worker.js`, `assets/` exist |
| Bundle size reasonable | `du -sh .open-next/` — flag if >50MB unexpectedly |
| Static JSON bundled | `grep -r "groqModelsSsot\|envMapping" .open-next/` — confirm config is in the bundle |
| Server chunks correct | `ls .open-next/server-functions/` — verify route chunks exist |
| No secrets in bundle | `grep -r "SERVICE_ROLE\|GEMINI_API_KEY\|GROQ_API_KEY" .open-next/` — must be empty |
| No unexpected Node imports | `grep -r "require(\|readFileSync\|existsSync" .open-next/server-functions/` — investigate any hit |
| No `eval` or code-gen-from-string | `grep -r "eval(\|Function(" .open-next/` — Workers blocks this |

This catches problems before deployment, not after.

### Stage 5b — Cloudflare Bindings & Service Verification (if applicable)

For any PR touching KV, D1, R2, Hyperdrive, Durable Objects, or deployed Workers:

| Check | MCP Tool | Command | Pass criteria |
|-------|----------|---------|---------------|
| Workers code deployed | `workers_get_worker_code` | Compare commit hash vs deployed code | Deployed version matches latest push |
| D1 schema applied | `d1_database_query` | Query `sqlite_master` (D1 is SQLite, not Postgres — no `information_schema`) or check D1 migration state | All migrations present and consistent |
| KV namespaces exist | `kv_namespaces_list` | Verify expected namespaces listed in response | No orphan/missing namespaces |
| KV binding config | `kv_namespace_get` | Check binding exists in wrangler.jsonc | Matches deployed configuration |
| R2 buckets configured | `r2_buckets_list` | Verify expected buckets exist | Buckets match wrangler.jsonc, CORS rules applied |
| Hyperdrive configured | `hyperdrive_configs_list` / `hyperdrive_config_get` | Check Hyperdrive credentials are bound (not exposed) — `kv_namespaces_list` cannot see Hyperdrive at all | No secrets in environment |

---

## Stage 6 — Documentation Contradiction Check

Before updating any documentation:

- PR description
- Linear
- PRD
- Roadmap
- Architecture docs

Perform a **contradiction check** across all five surfaces:

```
Source Code  ==  Tests  ==  Runtime  ==  Documentation  ==  Linear
```

Verify that:

- implementation matches documentation
- acceptance criteria are satisfied
- task status reflects reality
- test counts are current
- file references exist
- links are valid

Only if all agree should the documentation be updated. If any surface contradicts another, resolve the contradiction first — do not update docs to match code while Linear still says "In Progress" or tests don't cover the new behavior.

Do not mark work complete without evidence.

---

## Stage 7 — Architecture Review

Confirm the work:

- matches the current architecture
- avoids duplicate implementations (re-run duplicate search from Stage 0)
- maintains single sources of truth
- preserves clear ownership between tasks
- does not introduce unnecessary abstractions
- follows Cloudflare and OpenNext best practices

---

## Stage 8 — Production Readiness

Before recommending merge:

Verify:

- CI passes
- builds pass (`next build` + `opennextjs-cloudflare build`)
- runtime matrix verification passes (at least Local Runtime Verified)
- bundle audit passes (Stage 5)
- security requirements satisfied
- review comments addressed
- regression tests added where appropriate
- documentation updated and contradiction-checked (Stage 6)
- Linear synchronized

If any production blocker remains, classify it clearly.

Do not describe mitigations as complete fixes.

---

## Known Cloudflare Gotchas (Real Incidents)

### Workers AI embed dimension mismatch (IPI-492)

- **Gotcha:** BGE Base returns **768 dimensions**, not 512 or 1536
- **Impact:** Adapter code assumes wrong dimension; vectors silently truncated or padded
- **Prevention:** Always verify embed response shape against [official model card](https://developers.cloudflare.com/workers-ai/models/bge-base-en-v1.5/)
- **Test:** Call `/v1/embeddings` with test input; inspect `data[0].embedding.length`
- **MCP:** `mcp__claude_ai_Cloudflare_Developer_Platform__search_cloudflare_documentation` for model specs

### OpenNext build requires exact compatibility_date

- **Gotcha:** `opennextjs-cloudflare build` succeeds but `wrangler dev` fails if `compatibility_date` is stale
- **Impact:** Build passes CI; runtime fails only on `wrangler dev` or deployed Workers
- **Prevention:** Keep `compatibility_date` in `wrangler.jsonc` on latest stable (check official docs monthly)
- **Test:** Run both `opennextjs-cloudflare build` AND `wrangler dev` locally before push
- **MCP:** `mcp__claude_ai_Cloudflare_Developer_Platform__search_cloudflare_documentation` for current recommended date

### D1 remote DB vs local preview mismatch

- **Gotcha:** Migrations apply locally; remote apply fails due to auth/state divergence or SQL incompatibility
- **Impact:** Code passes local tests; fails on production D1 at deploy time
- **Prevention:** Test migrations on actual D1 instance before merge (Stage 5b)
- **Test:** Run `d1_database_query` on production DB; verify schema state matches local
- **MCP:** `mcp__claude_ai_Cloudflare_Developer_Platform__d1_database_query` to inspect remote schema

### KV key collisions with reserved prefixes

- **Gotcha:** Keys starting with `_` have special handling; overlaps can cause silent data loss
- **Impact:** System keys and user keys collide; data silently overwritten or inaccessible
- **Prevention:** Reserve `_internal_*` prefix for framework keys only; document user key convention
- **Test:** Namespace keys and verify no `_` prefix overlap with user namespaces
- **MCP:** `mcp__plugin_cloudflare_cloudflare-api__execute` to list KV keys (MCP tools show namespaces only)

### Workers script size limits (gzip after compression)

- **Gotcha:** OpenNext build succeeds locally; deployed Worker fails at upload if over service limits
- **Impact:** Code passes local tests; fails on `wrangler deploy` with size error
- **Official limits:** Free tier 3 MB (after gzip) / 64 MB (before gzip); Paid tier 10 MB (after gzip) / 64 MB (before gzip)
- **Prevention:** Use `wrangler deploy --dry-run` to check gzip upload size (not local file size)
- **Test:** Run `wrangler deploy --dry-run` and check reported upload size against tier limits
- **Fix:** Tree-shake unused imports, defer code-splitting, or migrate to service workers if exceeding limits

### nodejs_compat flag must be in compatibility_flags array

- **Gotcha:** Setting `nodejs_compat = true` in wrangler.jsonc does NOT enable `node:fs`/`node:path`
- **Impact:** Code uses `node:fs` but Workers environment doesn't have the flag
- **Prevention:** Use `compatibility_flags = ["nodejs_compat"]` (array syntax, exact name)
- **Test:** `wrangler dev` with simple `import fs from "node:fs"` should not throw
- **MCP:** `mcp__claude_ai_Cloudflare_Developer_Platform__search_cloudflare_documentation` for nodejs_compat docs

---

## Reporting Template

Return after every stage:

| Item | Result |
|------|--------|
| Finding | Exact issue |
| Evidence | Code / Docs / Runtime / Bundle |
| Classification | Confirmed / Unproven / Already Fixed / Incorrect / Out of Scope |
| Change Made | Files changed |
| Regression Test | Test added or updated |
| Validation Level | Code / Unit / Build / Local Runtime / Remote Preview / Production |
| Bundle Audit | Pass / Fail / N/A |
| Scope Preserved | Yes / No |
| Duplicates Found | None / List |
| Contradictions | None / Resolved / Unresolved |
| Remaining Risks | Details |
| Next Recommended Action | Details |

---

## AI Gateway — Embed & Error Contract Gate (IPI-492+)

Applies when changing `services/cloudflare-worker/` embeddings, provider error mapping, or `app/src/lib/ai/provider-adapter.ts` embed/error paths.

**Official docs (must re-check via `cloudflare-docs` MCP, not memory):**

- OpenAI-compat: `/v1/chat/completions` + `/v1/embeddings` — [OpenAI compatibility](https://developers.cloudflare.com/workers-ai/configuration/open-ai-compatibility/)
- BGE Base `@cf/baai/bge-base-en-v1.5`: **768** dims, **512** max input tokens, batch supported — [model page](https://developers.cloudflare.com/workers-ai/models/bge-base-en-v1.5/)
- Native Workers AI embed body uses `text`; OpenAI-compat path uses `input` (string | string[]) — iPix Worker must stay on the compat shape

### Hard rules (from verified IPI-492 audit)

| Rule | Do | Don't |
|------|----|-------|
| Invalid embed model | **Reject** with `400` + `unsupported_embedding_model` | Silent remap to `embedding` |
| Model allowlist | Capability / explicit set (`embedding`, `@cf/baai/bge-base-en-v1.5`) | `model.includes("gemini")` string match |
| Unknown model | Fail closed before `selectProvider` default fallback | Fall through to `default` chat tier on `/v1/embeddings` |
| Client validation | `400` + `invalid_request` **before** provider fetch | Opaque `502` wrapping provider 400 |
| Upstream status | Map + sanitize (429→429, timeout→504, unavailable→503, other→502) | Blind passthrough of provider 401/403/bodies |
| Adapter errors | Typed `AiGatewayError` (`status`, `code`, `providerStatus?`, `retryable`, `requestId?`) | Callers parse `"embedding failed: 400 {...}"` strings |
| Empty / bad input | Reject `[]`, `""`, whitespace, mixed blanks, non-strings, null | Call Workers AI then wrap failure |
| Embed SSOT wording | "iPix gateway supports Workers AI BGE; Gemini embed **routing** not implemented" | "Gemini cannot do embeddings" |

### Minimum tests before merge

```text
Worker: empty/whitespace/malformed input → 400, provider fetch not called
Worker: unsupported model (e.g. gemini-3.1-flash-lite) → 400, no Gemini/Workers call
Worker: model embedding + valid input → 200, 768-d
Adapter: 400 envelope → typed AiGatewayError with code
Live Wrangler: same three curls (empty / wrong model / happy)
```

**Plan SSOT:** `tasks/cloudflare/tasks/492-audit.md` · Linear **IPI-492 · CF-AI-004c**

---

## Cloudflare Outcome Grader

Reusable rubric — score every Cloudflare PR/task against these criteria before merge:

| Criterion | Pass | Fail |
|-----------|------|------|
| Runtime compatibility | No `require()`, no runtime disk reads, ESM imports only in Workers-loaded modules | `require()` or `readFileSync` in Workers path |
| Official docs checked | `cloudflare_docs` or `webfetch` used for runtime API claims | Assumed from training data |
| Bundle verified | `.open-next/` inspected — no secrets, no unexpected Node imports, static assets present | Bundle not inspected |
| No Node runtime assumptions | `node:fs`/`node:path` usage verified against `nodejs_compat` + `compatibility_date` | Assumed unsupported/supported without checking |
| OpenNext build passes | `npx opennextjs-cloudflare build` exits 0 | Build fails or skipped |
| Wrangler preview passes | `wrangler dev` or `npm run preview` routes tested | Not tested locally |
| Regression tests added | Bug → Fix → Test that fails before, passes after | No test for the fix |
| Documentation synchronized | Source == Tests == Runtime == Docs == Linear (Stage 6) | Any surface contradicts |
| Linear synchronized | Issue state matches reality (In Review / Done) | Stale state |
| Scope preserved | One concern per PR, no mixing (AGENTS.md #1) | Mixed docs+code or two tasks |
| Embed/error contract (when touched) | Allowlist reject; no silent remap; no opaque 502 for client validation; typed adapter error | Remap / gemini-name detect / raw provider body leak |

**Merge gate:** all criteria must be Pass or explicitly waived with a documented reason. Any Fail = blocker.

---

## Skills × MCP Integration Table

Load skills in this order for Cloudflare work:

| Skill | MCP Tools Available | When to load | Key integration |
|-------|-------------------|--------------|-----------------|
| **cf-wf** (this) | `search_cloudflare_documentation`, `workers_*`, `d1_*`, `kv_*`, `r2_*`, `cloudflare-api__execute` | Every Cloudflare task | Primary skill; provides 9-stage gate |
| `ipix-task-lifecycle` | Linear MCP | Any task with Linear tracking (IPI-###) | Provides context + acceptance criteria |
| `pr-workflow` | GitHub MCP (PR threads, CI status) | Before merge gate | Provides PR state + review gate |
| `ipix-supabase` | Supabase MCP | For Supabase/Postgres only | D1 is SQLite, not Postgres; route D1 work to Cloudflare D1 docs, not Supabase |
| `graphify` | — | Stage 0 architecture review | Dependency mapping |

**Load order:**
1. Start with this skill (cloudflare-workflow)
2. Grab MCP tools via ToolSearch (copy/paste tool names from MCP Tools Reference above)
3. Load domain skill if needed (e.g., `ipix-supabase` for D1)
4. Load lifecycle skills (`ipix-task-lifecycle`, `pr-workflow`) for tracking

---

## Verification Checklist

The full step-by-step checklist mapping every verification step to the exact skill, MCP tool,
command, and pass/fail criteria is in [references/verification-checklist.md](references/verification-checklist.md).
Use it as the operational checklist for any Cloudflare PR or task — it covers all 9 stages
plus the Outcome Grader rubric and quick-reference tables for MCP servers and skills.

## Quality Gates

Before closing a task:

- ✅ Stage 0 research completed (architecture review + duplicate search)
- ✅ Current architecture verified
- ✅ Scope preserved
- ✅ Runtime matrix verified (at least Local Runtime)
- ✅ Bundle audit passed
- ✅ Documentation synchronized (contradiction check passed)
- ✅ Linear synchronized
- ✅ No unresolved contradictions
- ✅ No duplicate implementations
- ✅ Production readiness evaluated
- ✅ Outcome Grader: all Pass or explicitly waived

Only recommend merging or marking a task complete after all applicable quality gates pass.
