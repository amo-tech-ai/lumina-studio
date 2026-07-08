# Claude Code Setup — iPix Audit & Improvement Plan

_Generated: 2026-06-21 | Validated against actual repo state_

---

## Codebase Profile

| Area | Stack |
|------|-------|
| Frontend | React 18 · TypeScript · Vite (SWC) · Tailwind 3 · shadcn/ui · Radix UI |
| Routing / State | React Router v6 · TanStack Query v5 |
| Animation | Framer Motion |
| Backend | Supabase (Postgres + Auth + Edge Functions / Deno) |
| AI | Gemini 2.5 Flash via Edge Functions · CopilotKit · Mastra |
| Commerce | Mercur / Medusa v2 (separate Postgres :5433) |
| Media | Cloudinary |
| Issue tracking | Linear |
| Testing | Vitest · @testing-library/react |
| Linting | ESLint 9 + typescript-eslint |
| CI | GitHub Actions (ci.yml) |

---

## Current Setup Status

### ✅ Working

| Component | Detail |
|-----------|--------|
| Graphify hooks | PreToolUse fires on Bash (grep/find) and Read/Glob — path fixed to `docs/graphify/graphify-out/graph.json` |
| Plugins | `linear` · `supabase` · `code-review` · `coderabbit` · `commit-commands` · `ponytail` · `stripe` · `claude-code-setup` |
| Skills | 40 active dirs · 7 consolidated hubs · `index-skills.md` inventory |
| Playwright agents | Global: `playwright-test-generator` · `playwright-test-healer` · `playwright-test-planner` |
| git-ai checkpoints | Global PostToolUse + PreToolUse hooks checkpoint every tool call |
| MCP (Cursor) | supabase · linear-ipix · cloudinary (×2) · mercur · mastra — in `.cursor/mcp.json` |
| Ponytail | Active full mode, documented in CLAUDE.md |
| SUPABASE_ACCESS_TOKEN | Set in `settings.local.json` env block |

### ❌ Gaps

| # | Gap | Impact |
|---|-----|--------|
| G1 | No `.mcp.json` at repo root — MCP servers only in `.cursor/mcp.json` | Claude Code CLI doesn't get supabase/linear/cloudinary/mercur/mastra MCPs |
| G2 | No PostToolUse lint hook — ESLint runs manually only | Lint errors accumulate between runs |
| G3 | No `.env` write-protection hook | Claude can accidentally overwrite secrets |
| G4 | No project-level agents dir (`.claude/agents/`) | No iPix-specific subagents (security, migration review) |
| G5 | `context7` MCP not installed | No live doc lookup for React, Supabase, TanStack Query, Zod, Framer Motion |
| G6 | `settings.local.json` has ~80 stale one-time `Bash(*)` allow entries | Permission noise; harder to audit what's actually needed |
| G7 | No `gen-test` or `create-migration` skills | Common tasks require manual prompting each time |
| G8 | `firecrawl` plugin disabled | Competitor/market research (useful for iPix market intel) |

---

## P0 — Must Fix

### P0-1: Add `.mcp.json` at repo root

**Why:** Claude Code reads `.mcp.json` for project MCP servers. Without it, the supabase, linear, cloudinary, mercur, and mastra servers only work in Cursor — not in the Claude Code CLI or IDE extensions.

**Action:** Create `/home/sk/ipix/.mcp.json`:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "/home/sk/ipix/scripts/supabase-mcp-bridge.sh",
      "args": []
    },
    "linear-ipix": {
      "command": "/home/sk/ipix/scripts/linear-mcp-bridge.sh",
      "args": []
    },
    "cloudinary-asset-mgmt-remote": {
      "url": "https://asset-management.mcp.cloudinary.com/sse",
      "headers": {
        "cloudinary-url": "cloudinary://314599957976619:aoiYMvb6YMjgF4IfBvbt9yhauiY@dzqy2ixl0"
      }
    },
    "mercur": {
      "url": "https://docs.mercurjs.com/mcp"
    },
    "mastra": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@mastra/mcp-docs-server@latest"]
    }
  }
}
```

> **Security note:** The cloudinary credentials above are in `.cursor/mcp.json` already. Move them to Infisical and inject via the bridge script pattern before committing `.mcp.json`. Do not commit API keys to git.

### P0-2: Add `.env` write-protection hook

**Why:** `settings.local.json` has `SUPABASE_ACCESS_TOKEN` and the project uses Infisical. Accidentally overwriting `.env.local` or `.env` is a data-loss risk.

**Add to `.claude/settings.json` `PreToolUse`:**

```json
{
  "matcher": "Edit|Write",
  "hooks": [
    {
      "type": "command",
      "command": "FILE=$(python3 -c \"import json,sys;d=json.load(sys.stdin);print(d.get('tool_input',d).get('file_path',''))\" 2>/dev/null||true); case \"$FILE\" in *.env|*.env.*|*/.env|*/.env.*) echo '{\"decision\":\"block\",\"reason\":\"Blocked: editing env files is not allowed. Use Infisical or .env.example instead.\"}' ;; esac"
    }
  ]
}
```

---

## P1 — Should Fix

### P1-1: Add PostToolUse lint hook

**Why:** ESLint 9 is configured. Auto-linting after TypeScript/TSX edits catches issues immediately without a separate `npm run lint`.

**Add to `.claude/settings.json` `PostToolUse`:**

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "FILE=$(python3 -c \"import json,sys;d=json.load(sys.stdin);print(d.get('tool_input',d).get('file_path',''))\" 2>/dev/null||true); case \"$FILE\" in *.ts|*.tsx) cd /home/sk/ipix && npx eslint --max-warnings=0 \"$FILE\" 2>&1 | tail -5 || true ;; esac"
          }
        ]
      }
    ]
  }
}
```

### ✅ P1-2: Install context7 MCP — DONE (2026-06-21)

Installed via `claude plugin install context7@claude-plugins-official`. Verified: `plugin:context7:context7 — Connected`.

Usage: add `use context7` to any prompt touching a library API (React, Supabase JS, TanStack Query, Zod, Framer Motion).

### ✅ P1-3: Add iPix-specific subagents — DONE (2026-06-21)

**Why:** No project agents exist. Two high-value ones for iPix:

**`.claude/agents/security-reviewer.md`** — auth flows, RLS policies, edge function JWT handling:

```markdown
---
name: security-reviewer
description: Reviews auth, RLS, JWT, and Stripe flows for security issues. Use after touching ProtectedRoute, resolveAuth, supabase policies, or stripe webhooks.
---

You are a security-focused code reviewer for the iPix platform.

Focus areas:
- Supabase RLS policies (are all tables covered? service role leaks?)
- Edge function auth (`resolveAuth` — required vs optional mode)
- JWT validation in Deno edge functions
- Client-side secret exposure (VITE_ prefix on secrets)
- Stripe webhook signature verification
- SQL injection risk in raw queries

Report: PASS / WARN / FAIL per area, with line references.
```

**`.claude/agents/migration-reviewer.md`** — reviews SQL before `supabase db push`:

```markdown
---
name: migration-reviewer
description: Reviews Supabase SQL migrations for safety, RLS coverage, and rollback risk before pushing to remote.
---

You are a database migration reviewer for iPix (Supabase Postgres, remote-only, no local replay).

Check every migration for:
- RLS enabled on new tables
- Destructive operations (DROP, TRUNCATE) without explicit user approval
- Missing indexes on FK columns
- NOT NULL additions on populated tables (need defaults or backfill)
- Naming conventions (snake_case, plural tables)
- Whether `npm run supabase:types` needs to run after

Report: SAFE TO PUSH / REVIEW NEEDED / BLOCK with reasons.
```

### ✅ P1-4: Create `create-migration` skill — DONE (2026-06-21)

**Why:** Every Supabase schema change follows the same pattern: write SQL, name file correctly, push, regen types. A skill enforces the workflow.

**`.claude/skills/create-migration/SKILL.md`:**

```markdown
---
name: create-migration
description: Creates a new Supabase SQL migration file for iPix with correct timestamp naming, RLS boilerplate, and reminder to regen types. Use when adding tables, columns, indexes, or policies to the iPix Supabase schema.
---

## Workflow

1. Generate timestamp: `date -u +%Y%m%d%H%M%S`
2. Create file: `supabase/migrations/<timestamp>_<slug>.sql`
3. Add RLS boilerplate for any new tables:
   ```sql
   ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "<table>_owner" ON <table> FOR ALL USING (auth.uid() = user_id);
   ```
4. Remind user to run after push:
   ```bash
   npm run supabase:push
   npm run supabase:types
   ```
5. Recommend running `/migration-reviewer` before pushing.
```

---

## P2 — Nice to Have

### ✅ P2-1: Enable `firecrawl` plugin — DONE (2026-06-21)

**Why:** iPix does competitor/market research (apify-ecommerce skill exists). Firecrawl gives structured web scraping directly in Claude.

```bash
claude plugin enable firecrawl@claude-plugins-official
```

### ✅ P2-2: Create `gen-test` skill — DONE (2026-06-21)

For generating Vitest tests matching the existing `@testing-library/react` pattern in `src/test/`.

### P2-3: Clean up `settings.local.json` permissions

~80 `Bash(*)` entries are one-time commands from past sessions. Audit and reduce to:
- `Bash(npm run *)` (covers all project scripts)
- `Bash(git *)` (covers all git ops)
- `Bash(npx vitest *)` `Bash(npx eslint *)` `Bash(npx supabase *)`
- `Bash(graphify *)` (query/update/affected)
- Remove all the one-off `Bash(cp ...)`, `Bash(mv ...)`, `Bash(perl ...)` entries

### P2-4: Add `mediaflows` Cloudinary MCP to `.mcp.json`

The `.cursor/mcp.json` has a second Cloudinary server (`mediaflows`) not included in P0-1 above. Add it if Cloudinary media workflows are used in Claude Code CLI:

```json
"mediaflows": {
  "url": "https://mediaflows.mcp.cloudinary.com/v2/mcp",
  "headers": {
    "cld-cloud-name": "dzqy2ixl0",
    "cld-api-key": "314599957976619",
    "cld-secret": "aoiYMvb6YMjgF4IfBvbt9yhauiY"
  }
}
```

> Same security note: move creds to Infisical before committing.

---

## Final Scorecard

| Area | Score /100 | Notes |
|------|----------:|-------|
| Hooks | 55 | Graphify hooks work; missing lint + env protection |
| MCP Servers | 30 | All MCPs in Cursor only; none available to Claude Code CLI |
| Skills | 85 | 40 active, well-organized hubs; missing create-migration, gen-test |
| Plugins | 80 | 7 of 8 active plugins relevant; firecrawl disabled |
| Subagents | 10 | Only global Playwright agents; no iPix-specific reviewers |
| Permissions | 50 | ~80 stale one-time entries; hard to audit |
| Documentation | 90 | CLAUDE.md accurate after today's fixes |
| **Overall** | **57** | **Improve** |

---

## Priority Action Plan

```
P0  → Create .mcp.json (MCP parity between Cursor and Claude Code)
P0  → Add .env write-protection hook
P1  → install context7 MCP (`claude mcp add context7 ...`)
P1  → Create .claude/agents/security-reviewer.md
P1  → Create .claude/agents/migration-reviewer.md
P1  → Create .claude/skills/create-migration/SKILL.md
P2  → Enable firecrawl plugin
P2  → Create gen-test skill
P2  → Clean up settings.local.json stale permissions
```

---

## §5 — Goals, Outcomes, Hooks & Agents (Official Docs Synthesis)

_Source: `official/goal.md`, `define-outcomes.md`, `hooks-guide.md`, `sub-agents.md`, `agent-view.md`, `large-codebases.md`, `workflows.md`_
_Last reviewed: 2026-06-21_

---

### 5.1 `/goal` — Autonomous Multi-Turn Work

`/goal` sets a verifiable completion condition; a fast model checks after every turn and keeps Claude working until the condition holds. Requires Claude Code v2.1.139+.

**iPix use cases:**

```text
/goal all tests in src/test/ pass and npm run lint exits 0

/goal migration pushed, types regenerated, and src/types/supabase.ts committed

/goal brand intake analysis stored in agent_context_snapshots and draft committed to ai_drafts

/goal all failing tests in src/test/operator-routes.test.ts pass without modifying other test files
```

**Rules for effective conditions:**
- One measurable end state (exit code, file exists, row count)
- State the check explicitly: "`npm test` exits 0" not "tests work"
- Add a turn cap to prevent runaway loops: `or stop after 15 turns`
- Pair with auto mode: `/goal` removes per-turn prompts; auto mode removes per-tool prompts

**Workflow for long tasks:**
```text
# Start goal with auto mode for hands-free execution
[Switch to auto mode via Shift+Tab]
/goal all supabase migrations pushed, types regenerated, CI green
```

**Check status / cancel:**
```bash
/goal          # status: turns, tokens, last evaluator reason
/goal clear    # cancel early
```

---

### 5.2 Hooks — iPix-Specific Additions

The existing hooks (Graphify PreToolUse, git-ai checkpoints) are in place. These additions address the remaining gaps.

All hooks go in `.claude/settings.json` (project-level, committed). Personal overrides go in `.claude/settings.local.json`.

#### Hook A: Re-inject context after compaction

When Claude's context compacts, it loses sprint state, current branch, and recent decisions. This `SessionStart` hook with `compact` matcher re-injects critical context:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "compact",
        "hooks": [
          {
            "type": "command",
            "command": "printf 'CONTEXT RESTORED AFTER COMPACTION\\nBranch: %s\\nRecent commits:\\n%s\\nActive HITL rule: AI writes drafts only — human approver_id required to commit.\\nStack: React 18 + Supabase + Gemini edge functions (Deno). Remote-only DB.\\n' \"$(git branch --show-current 2>/dev/null)\" \"$(git log --oneline -3 2>/dev/null)\""
          }
        ]
      }
    ]
  }
}
```

#### Hook B: Stop hook — verify tasks before Claude stops

Uses a prompt-based Stop hook so Claude keeps working if tasks remain incomplete:

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "prompt",
            "prompt": "Review the conversation. If the user's original request is fully complete (all files written, tests passing, types regenerated if schema changed), respond {\"ok\": true}. Otherwise respond {\"ok\": false, \"reason\": \"what still needs to be done\"}."
          }
        ]
      }
    ]
  }
}
```

> Add `stop_hook_active` guard if this triggers infinite loops — see hooks-guide §troubleshooting.

#### Hook C: Notify on idle (Linux)

```json
{
  "hooks": {
    "Notification": [
      {
        "matcher": "idle_prompt",
        "hooks": [
          {
            "type": "command",
            "command": "notify-send 'Claude Code' 'Waiting for your input'"
          }
        ]
      }
    ]
  }
}
```

#### Hook D: Audit config changes

Logs any `.claude/` settings change during a session:

```json
{
  "hooks": {
    "ConfigChange": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "jq -c '{ts: now|todate, src: .source, file: .file_path}' >> ~/.claude/ipix-config-audit.log"
          }
        ]
      }
    ]
  }
}
```

#### Hook E: Block SQL writes in db-reader subagent

Already included in the `db-reader` agent frontmatter below. See §5.3.

---

### 5.3 Subagents — Enhanced iPix Agent Library

Store in `.claude/agents/`. These load automatically; Claude delegates when the description matches. Run `/agents` to manage.

**Fields that matter for iPix agents:**

| Field | When to use |
|-------|------------|
| `memory: project` | Agent should remember patterns across sessions (stored in `.claude/agent-memory/<name>/`) |
| `skills` | Preload iPix skills at startup (e.g., `ipix-supabase`, `gemini`) |
| `model: haiku` | Fast/cheap agents (explore, summarize, search) |
| `model: sonnet` | Default capable agents |
| `isolation: worktree` | Agent edits files — keep isolated from main checkout |
| `hooks: PreToolUse` | Add conditional validation (SQL write blocking, file path checking) |
| `permissionMode: acceptEdits` | Skip per-edit prompts for trusted agents |

#### Agent: brand-intelligence-analyst

```markdown
---
name: brand-intelligence-analyst
description: Analyzes brand profiles using the brand intelligence edge function. Use after brand intake or when brand scores need updating. Reads Supabase brand data; writes drafts only.
tools: Read, Grep, Glob, Bash
model: sonnet
memory: project
skills:
  - ipix-supabase
  - gemini
---

You are the iPix brand intelligence analyst.

Your job: read brand data from Supabase, call the brand-intelligence edge function via curl, and store results as drafts in ai_drafts (never durable tables directly).

HITL invariant: you write to ai_drafts only. A human must approve before any draft becomes live. Never set approver_id to your own session.

Start by reading .claude/agent-memory/brand-intelligence-analyst/MEMORY.md for patterns from prior sessions.
Update memory after each analysis with: brand name, key findings, edge cases encountered.
```

#### Agent: context-engineer

```markdown
---
name: context-engineer
description: Manages iPix context engineering — stores snapshots, retrieves memory, runs semantic search. Use at the start of a complex task to restore prior context or after a task to store learnings.
tools: Read, Bash
model: haiku
memory: project
---

You are the iPix context engineering assistant.

Tasks you handle:
1. Retrieve recent context: call getRecentContext() from contextService.ts
2. Store task snapshots: call storeSnapshot() via the context-manager edge module
3. Semantic search: find similar prior work with semanticSearch()
4. Build continuity: summarize prior decisions for the current session

Always check .claude/agent-memory/context-engineer/MEMORY.md for known patterns before starting.
```

#### Agent: edge-function-reviewer

```markdown
---
name: edge-function-reviewer
description: Reviews Supabase edge functions (Deno/TypeScript) for auth, CORS, error handling, and Gemini API usage. Use before deploying any edge function change.
tools: Read, Grep, Glob
model: sonnet
---

You are a Deno edge function reviewer for iPix.

Check every function for:
- resolveAuth() called with correct required/optional mode
- handleCors() at top of handler
- jsonResponse/errorResponse used (never raw Response)
- GEMINI_API_KEY accessed via getOptionalSecret() only — never import.meta.env
- insertAgentLog() called for AI operations
- No VITE_ env vars — those are client-only
- Structured output schema matches expected response shape

Report: DEPLOY SAFE / REVIEW NEEDED / BLOCK with line references.
```

#### Agent: db-reader (read-only Supabase queries)

```markdown
---
name: db-reader
description: Execute read-only Supabase queries for data analysis. Use when you need to inspect brand scores, agent logs, or context snapshots without risk of writes.
tools: Bash
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: ".claude/hooks/validate-readonly-query.sh"
---

You are a read-only data analyst for iPix Supabase.
Execute SELECT queries via `npm run supabase:verify` or psql only.
Never INSERT, UPDATE, DELETE, DROP, or ALTER anything.
```

Create the guard script at `.claude/hooks/validate-readonly-query.sh`:

```bash
#!/bin/bash
INPUT=$(cat)
CMD=$(echo "$INPUT" | jq -r '.tool_input.command // empty')
if echo "$CMD" | grep -iE '\b(INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE)\b' > /dev/null; then
  echo "Blocked: write operations not allowed in db-reader" >&2
  exit 2
fi
exit 0
```

```bash
chmod +x .claude/hooks/validate-readonly-query.sh
```

#### Agent: mercur-developer (Medusa v2 commerce)

```markdown
---
name: mercur-developer
description: Implements Mercur/Medusa v2 commerce features in my-marketplace/. Use when working on sellers, checkout, Stripe, or catalog. Scoped to my-marketplace/ only.
tools: Read, Edit, Write, Bash, Grep, Glob
model: sonnet
skills:
  - medusa
mcpServers:
  - mercur
---

You are a Mercur/Medusa v2 developer working in my-marketplace/.
Follow my-marketplace/CLAUDE.md for all conventions.
Never touch supabase/ or src/ — those are the iPix frontend, not Mercur.
Use mercur MCP for docs lookup before searching files.
```

---

### 5.4 Agent View — Parallel Background Work

`claude agents` opens a dashboard for managing multiple sessions simultaneously. Useful for iPix when:
- Running brand intelligence analysis + UI work in parallel
- Investigating Supabase logs while implementing a feature
- Running tests in background while reviewing another PR

**Key commands:**

```bash
claude agents                          # open dashboard
claude --bg "run npm test and fix failures"   # dispatch background session
claude --bg --agent edge-function-reviewer "review brand-intelligence function"
claude agents --cwd /home/sk/ipix      # scope to this project only
```

**Worktree isolation:** Background sessions automatically move into `.claude/worktrees/` before editing files. Multiple sessions can run in parallel without conflicting. Merge/push before deleting a session.

**Dispatch from agent view:**
```text
edge-function-reviewer review the audit-asset-dna function
@brand-intelligence-analyst analyze brands with low scores
! npm test                             # run shell command as background job
```

---

### 5.5 Large Codebase Config (monorepo patterns)

iPix has two logical codebases: the React app (`src/`) and the Mercur marketplace (`my-marketplace/`). Apply these patterns:

#### `claudeMdExcludes` — hide `my-marketplace/` when working on frontend

Add to `.claude/settings.local.json` (personal, gitignored):

```json
{
  "claudeMdExcludes": [
    "**/my-marketplace/**"
  ]
}
```

Add `**/src/**` equivalent when working inside `my-marketplace/`.

#### Read deny rules — block generated/vendor files

Add to `.claude/settings.json` (committed):

```json
{
  "permissions": {
    "deny": [
      "Read(./**/dist/**)",
      "Read(./**/build/**)",
      "Read(./**/*.generated.*)",
      "Read(./**/node_modules/**)",
      "Read(./**/.next/**)"
    ]
  }
}
```

#### `worktree.sparsePaths` — faster background agent worktrees

For background agents that only touch the React frontend:

```json
{
  "worktree": {
    "sparsePaths": [
      ".claude",
      "src",
      "supabase/functions",
      "supabase/migrations"
    ],
    "symlinkDirectories": [
      "node_modules"
    ]
  }
}
```

#### Per-directory skills (already in place)

The skill system already handles this — skills in `.claude/skills/` load on demand. The `mercur` skill fires only when Claude works on `my-marketplace/`. No changes needed here.

#### Stop hook for cross-area changes

When a change touches both `src/types/supabase.ts` AND a migration, a Stop hook can verify both were updated:

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "prompt",
            "prompt": "If the session created or modified any file in supabase/migrations/, check whether src/types/supabase.ts was also regenerated (look for 'supabase:types' in the conversation). If not, respond {\"ok\": false, \"reason\": \"Run npm run supabase:types to regenerate types after migration changes\"}. Otherwise {\"ok\": true}."
          }
        ]
      }
    ]
  }
}
```

---

### 5.6 Outcomes (Managed Agents API)

`define-outcomes.md` covers the Managed Agents API (`managed-agents-2026-04-01` beta header) — this is for building AI products via the Anthropic API, not for Claude Code CLI use.

**iPix relevance:** When building brand intelligence pipelines that call Claude directly (not via edge functions calling Gemini), use `user.define_outcome` with a rubric to make the grader self-evaluate output quality. Example rubric for brand analysis:

```markdown
# Brand Intelligence Output Rubric

## Brand Identity
- Voice and tone clearly identified with supporting evidence
- Target audience defined with demographic specifics

## Competitive Position
- At least 2 competitors identified with differentiation noted
- Market positioning statement present

## Recommendations
- Minimum 3 actionable content recommendations
- Each recommendation tied to a brand attribute

## Output Quality
- Response is structured JSON matching BrandAnalysis schema
- No hallucinated brand names or made-up statistics
```

Store rubrics in `supabase/functions/brand-intelligence/rubrics/` for reuse.

---

### 5.7 Updated Scorecard

| Area | Before | After (with §5 applied) | Notes |
|------|-------:|------------------------:|-------|
| Hooks | 55 | 80 | Add compaction re-inject, Stop verifier, ConfigChange audit |
| MCP Servers | 30 | 75 | `.mcp.json` + context7 installed |
| Skills | 85 | 88 | create-migration, gen-test added |
| Plugins | 80 | 82 | firecrawl enabled |
| Subagents | 10 | 70 | 6 iPix-specific agents + memory |
| Permissions | 50 | 55 | Deny rules + env protection |
| Goal/Automation | — | 70 | `/goal` patterns documented, agent view ready |
| Documentation | 90 | 92 | This doc updated |
| **Overall** | **57** | **77** | **+20 points from §5** |
