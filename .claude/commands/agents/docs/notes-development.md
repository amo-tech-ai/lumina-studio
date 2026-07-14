# iPix Development Process

_How to build iPix modules with Claude Code: from PRD to merged PR._
_Updated: 2026-06-21_

---

## The Pipeline

```
PRD
 ↓
Linear Issue          ← acceptance criteria, wireframe ref, Linear ID
 ↓
Feature Plan          ← /feature-dev or /writing-plans → saved to tasks/plans/
 ↓
/goal                 ← completion condition + turn cap
 ↓
Rubric                ← module-specific quality checklist
 ↓
Implementation        ← hooks run automatically (lint, env-protect, stop-verify)
 ↓
Review Agents         ← @security-reviewer @migration-reviewer @edge-function-reviewer
 ↓
QA Agent              ← @qa-reviewer (AC · journeys · edge cases · mobile · a11y · regression)
 ↓
Human Approval        ← HITL gate: ai_drafts → approvals → activity_log
 ↓
PR                    ← conventional commit, Linear ref, CI green
```

Every module follows this pipeline. Compress phases for small tasks, but **never skip QA or human approval**.

---

## Phase 0 — Pre-Task Setup (2 min)

Before touching any code:

```bash
# 1. Check memory for prior decisions on this area
# (Claude reads MEMORY.md automatically, but prompt it explicitly for large tasks)
"Check your memory for anything relevant to [Shoot System / Brand Intake / ...]"

# 2. Orient with Graphify for cross-cutting changes
graphify query "Shoot System"
graphify path "Brand Intake" "Asset DNA"

# 3. Read the Linear issue
# Use /linear or the linear MCP — get acceptance criteria before writing a line

# 4. Confirm PRD section
# prd.md is the single source of truth — cite it in the plan
```

**Outcome:** You know what "done" looks like before starting.

---

## Phase 1 — Plan First

For any task touching >2 files or requiring schema changes:

```text
/writing-plans  # generates a structured plan file

or

/feature-dev    # full feature lifecycle: plan → impl → test → PR
```

Save the plan to a file (e.g. `tasks/plans/shoot-system.md`) before implementing. Long sessions compact context — the saved plan survives where conversation history does not.

**Plan must include:**
- Files to create/modify (with paths)
- Schema changes needed (new tables, columns, indexes)
- Edge functions affected
- Tests to write or update
- HITL gate: what requires human approval before going live

---

## Phase 2 — Goal + Rubric

### Set the `/goal`

```text
/goal Build [module] until:
- [specific acceptance criteria from Linear issue]
- npm run lint exits 0
- npm run test passes
- npm run build succeeds
- no .env files modified
- types regenerated if schema changed (npm run supabase:types)
- final summary lists all changed files
or stop after 25 turns
```

### Attach a rubric (for complex modules)

Rubrics define quality, not just completion. Claude self-evaluates against them before stopping.

**Module rubrics are in §Rubrics below.** Paste the relevant one into your prompt or save to `tasks/rubrics/<module>.md`.

---

## Phase 3 — Implementation

Hooks run automatically during implementation:

| Hook | What it does |
|------|-------------|
| PreToolUse: Edit\|Write | Blocks `.env` / `.env.*` writes |
| PostToolUse: Edit\|Write | Runs ESLint on `.ts`/`.tsx` files |
| SessionStart: compact | Re-injects branch/sprint/HITL rules after compaction |
| Stop: prompt | Verifies task is actually complete before Claude stops |
| PostToolUse: Bash | git-ai checkpoints every tool call |

**During implementation, Claude must:**
- Write to `ai_drafts` for any AI-generated content — never durable tables
- Run `npm run supabase:push` + `npm run supabase:types` after any migration
- Keep each migration in `supabase/migrations/<timestamp>_<slug>.sql`
- Never self-approve (no `approver_id = agent_run_user`)

---

## Phase 4 — Review Agents

After implementation, before QA:

```text
# Security review (auth, RLS, JWT, secrets)
@security-reviewer review the changes in [files]

# Migration review (before any supabase:push)
@migration-reviewer review supabase/migrations/<new-file>.sql

# Edge function review (before deploying)
@edge-function-reviewer review supabase/functions/<function>/index.ts

# Code quality (after any significant feature)
@code-reviewer review the [module] implementation
```

Run in parallel for large features:
```text
Use security-reviewer, migration-reviewer, and edge-function-reviewer in parallel on the Shoot System changes
```

---

## Phase 5 — QA Agent

After code review passes, before human approval:

```text
@qa-reviewer review the [Feature Name] implementation against IPI-[N]
```

The QA reviewer checks six areas and returns a structured report:

| Check | What it covers |
|-------|---------------|
| **Acceptance criteria** | Every AC from the Linear issue: PASS / FAIL / PARTIAL with file evidence |
| **User journeys** | Happy path + error path for each actor (operator, brand admin, visitor) |
| **Edge cases** | Empty input, null brand_id, edge function 500, unauthenticated access, max-length fields |
| **Mobile** | Tailwind breakpoints at 375 / 414 / 768 / 1024 / 1440px — overflow, touch targets, missing responsive prefixes |
| **Accessibility** | Labels, alt text, focus order, contrast, error association, no color-only information |
| **Regression risk** | Files changed × blast radius — flags HIGH risk areas (AuthContext, ProtectedRoute, shared components, App.tsx routes) |

**QA verdict gates the PR:**
- `SHIP` — all AC pass, no HIGH regression, no FAIL accessibility
- `NEEDS FIXES` — list of items; fix and re-run QA
- `BLOCK` — do not merge; escalate

**Run QA in parallel with review agents when moving fast:**
```text
Use security-reviewer and qa-reviewer in parallel on the Brand Intake phase 2 changes
```

**QA agent has persistent memory** — it builds up a knowledge base of iPix-specific patterns (known edge cases, recurring a11y gaps, hotspots) across sessions. Ask it to consult memory first:
```text
@qa-reviewer review IPI-83 changes. Check your memory for known Brand Intake edge cases first.
```

---

## Phase 6 — Human Approval Gate

**HITL spine: `ai_drafts` → `approvals` → `activity_log`**

Any AI-generated content (brand profiles, asset DNA scores, intake analyses) must:
1. Land in `ai_drafts` with `status = 'draft'`
2. Have a human set `approver_id` (not the agent that created it)
3. Trigger an `approvals` row before any durable write
4. Log to `activity_log`

The DB trigger blocks self-approval: `agent_run_user != approver_id`.

**For code changes:** human reviews the diff and merges the PR. Claude does not push to `main`.

---

## Phase 7 — Commit + PR

```text
/commit  # or use commit-commands plugin

# Conventional commit format:
feat(brand-intake): add phase 2 analyze-draft endpoint [IPI-83]
fix(asset-dna): correct DNA score calculation for pattern matching [IPI-45]
chore(migrations): add context_engineering tables CE-001

# PR description must include:
- Linear issue reference
- What changed and why (not how)
- Test evidence (paste test output or CI link)
- Any HITL gates that apply to new features
```

---

## Module Rubrics

Use these when setting `/goal` for a specific module. Paste the rubric into your prompt or reference `tasks/rubrics/<module>.md`.

### Brand Intake

```markdown
## Brand Intake Rubric

### Schema
- [ ] `brand_intake_drafts` table has all required columns
- [ ] RLS: service role writes, authenticated users read own
- [ ] Migration uses timestamp naming, includes FK indexes

### Edge Function
- [ ] `resolveAuth()` called with required=true
- [ ] `handleCors()` at top
- [ ] Gemini structured output schema matches `BrandIntakeAnalysis` type
- [ ] Result stored in `ai_drafts`, not durable tables
- [ ] `insertAgentLog()` called after Gemini invocation

### Frontend
- [ ] Brand intake form validates all required fields (Zod)
- [ ] Submission shows loading state
- [ ] Draft result displays with approve/reject UI
- [ ] No secrets in VITE_ prefixed env vars

### Tests
- [ ] Unit test for intake form validation
- [ ] Edge function health check passes (`npm run supabase:verify-brand-intelligence`)
```

### Asset DNA

```markdown
## Asset DNA Rubric

### Schema
- [ ] `assets` table extended (not replaced) — existing columns preserved
- [ ] `asset_dna_scores` columns: approved #059669, review #D97706, blocked #DC2626
- [ ] RLS covers all new columns

### Edge Function
- [ ] `audit-asset-dna` function uses `resolveAuth()` required mode
- [ ] Gemini vision call uses structured output schema
- [ ] DNA score stored as draft — human approves final score
- [ ] `insertAgentLog()` records every AI invocation

### Frontend
- [ ] DNA status badge uses correct brand colors
- [ ] AssetDNA component shows score with review/approve/block actions
- [ ] Actions gated behind human approval (no client-side auto-approve)
```

### Shoot System

```markdown
## Shoot System Rubric

### Schema
- [ ] `shoots` table: id, brand_id, user_id, status, brief, created_at
- [ ] `shoot_assets` junction table: shoot_id, asset_id
- [ ] RLS: users read/write own shoots; service role for AI ops
- [ ] FK indexes on brand_id, user_id

### Routes
- [ ] `/app/shoots` — shoot list
- [ ] `/app/shoots/:id` — shoot detail with brief
- [ ] `/app/shoots/new` — create shoot form
- [ ] All routes inside `<ProtectedRoute>`

### Services
- [ ] `src/services/shootService.ts` — CRUD via supabase client
- [ ] No direct SQL from client; all writes through service layer

### AI Integration
- [ ] Brief generation lands in `ai_drafts`
- [ ] Channel requirements analysis stored as draft
- [ ] Asset/DNA review suggestions require approval before applying

### Tests
- [ ] Route renders without crashing
- [ ] Form validation rejects empty brief
- [ ] Service mock tests for create/update/list
```

### Product Links (Mercur)

```markdown
## Product Links Rubric

### Schema
- [ ] `commerce_product_links` table: id, brand_id, mercur_product_id, asset_id, status
- [ ] RLS consistent with existing brand data policies

### Service Layer
- [ ] `src/services/productLinkService.ts` queries Supabase — no direct Mercur API from client
- [ ] Mercur API calls go through edge function only
- [ ] Product sync status tracked (linked / unlinked / error)

### Frontend
- [ ] ProductsPage shows linked/unlinked state
- [ ] Link/unlink action requires confirmation
- [ ] Error state handles Mercur unavailable gracefully

### Commerce Separation
- [ ] No Mercur DB (`:5433`) queries from Supabase edge functions
- [ ] Mercur product data stays in Mercur; only link IDs stored in Supabase
```

---

## Quick Reference — Skills & Agents by Task

| Task | Invoke |
|------|--------|
| New feature plan | `/feature-dev` or `/writing-plans` |
| New migration | `/create-migration` |
| Generate tests | `/gen-test` |
| Security review | `@security-reviewer` |
| Migration review | `@migration-reviewer` |
| Edge function review | `@edge-function-reviewer` |
| Code quality review | `@code-reviewer` |
| **QA — AC, journeys, mobile, a11y, regression** | **`@qa-reviewer`** |
| Brand intelligence | `@brand-intelligence-analyst` |
| Context restore | `@context-engineer` |
| Read-only DB query | `@db-reader` |
| Mercur commerce work | `@mercur-developer` |
| Competitor research | `/apix-ecommerce` or `firecrawl` |
| Commit message | `/commit` |
| Linear issue update | linear MCP |

---

## Common Mistakes to Avoid

| Mistake | Correct approach |
|---------|-----------------|
| Writing AI output directly to durable tables | Always use `ai_drafts` first |
| Running `supabase start` locally | Remote-only. Use `npm run supabase:push` |
| Putting secrets in VITE_ vars | VITE_ is client-exposed. Use Edge secrets (Infisical) |
| Skipping `npm run supabase:types` after migration | Types go stale → TS errors in client |
| Committing without running build | `npm run build` catches import errors CI will catch |
| Agent approving its own draft | DB trigger blocks this — but don't even try |
| Skipping RLS on new tables | Every new table needs `enable row level security` |
| Using `supabase.from().insert()` from the client for AI writes | AI writes via edge function (service role) only |

---

## Background Agents for Parallel Work

For large modules, dispatch background agents while continuing other work:

```bash
# Run tests in background while implementing
claude --bg "run npm test and report failures in src/test/"

# Review in background while writing next feature
claude --bg --agent security-reviewer "review the brand intake changes in supabase/functions/brand-intelligence/"

# Open agent view to monitor all sessions
claude agents
```

---

## Context Engineering Integration

At the start of any multi-session module:

```text
# Restore prior context
@context-engineer restore context for brand-intake task, brand_id <id>

# At task end — store learnings
@context-engineer store task_end snapshot: [what was built, decisions made, next steps]
```

The context manager embeds snapshots with Gemini `text-embedding-004` and retrieves semantically similar prior work at the start of the next session.
