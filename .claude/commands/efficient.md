---
description: "Efficient implementation paths — reuse, minimal PRs, ranked approaches before coding."
argument-hint: "[task|plan|branch|api|feature] <IPI-XXX|path|description>"
allowed-tools: ["Bash", "Glob", "Grep", "Read", "SemanticSearch", "Task"]
---

# /efficient — Efficient implementation discovery

**Aliases:** `/efficient` · `/discover` · `/optimize-plan`

**Arguments:** `$ARGUMENTS` — Linear issue (`IPI-46`), plan doc path, feature description, API route, or subcommand.

**Rules:** `@ponytail` · `@graphify` · `@pr-workflow` · `/lean` (when repo velocity is the bottleneck)

**Principle:** Read-only by default. **Suggest before build** — find what already exists, rank 2–4 approaches, recommend one. **Never commit or edit production code** unless the user explicitly says "implement" in the same turn.

---

## When to use

| Situation | Example |
|-----------|---------|
| Starting a Linear task | `/efficient task IPI-344` |
| Auditing a design/plan doc | `/efficient plan tasks/llm/groq-plan.md` |
| Current branch scope unclear | `/efficient branch` |
| New API or UI feature | `/efficient api POST /api/bookings` |
| Free-text feature idea | `/efficient feature brand intake wizard` |

**Use before:** `/task`, `@ponytail`, or opening a PR — especially when the task touches 3+ files, migrations, AI, or auth.

---

## Injected context

- Branch: !`git branch --show-current`
- Diff vs main: !`git diff main...HEAD --stat 2>/dev/null | head -20 || echo "n/a"`
- Tracker row: !`grep -n "IPI-" tasks/plan/todo.md 2>/dev/null | head -15 || echo "see tasks/plan/todo.md"`
- Worktrees: !`git worktree list 2>/dev/null | head -8`

---

## Subcommands

| Subcommand | Scope |
|------------|--------|
| **`/efficient task IPI-XXX`** | Linear issue + `docs/linear/issues/` + AC mapping |
| **`/efficient plan <path>`** | Review doc for gaps, red flags, phased efficiency |
| **`/efficient branch`** | Infer intent from branch name + diff vs `main` |
| **`/efficient api <METHOD> <path>`** | Find existing route/RPC/auth patterns to copy |
| **`/efficient feature <text>`** | Greenfield — search codebase for reuse |
| **`/efficient`** (no args) | Branch if on feature branch; else ask one clarifying question |

---

## Phase 0 — Parse scope (always)

1. Extract target from `$ARGUMENTS` (issue ID, path, route, or description).
2. If `IPI-XXX`: read `docs/linear/issues/IPI-*.md` if present; fetch Linear via MCP when available.
3. Restate in **one sentence**: smallest change that satisfies AC / plan goal.
4. Classify:

```text
S — single file / ≤200 LOC / known pattern     → Tier A discovery
M — 3–8 files / one concern                    → Tier B
L — migration + edge + app / stacked PRs / AI    → Tier C
```

5. **Stop and report blockers** (unmerged dependency, missing RPC, wrong stack) before ranking approaches.

---

## Phase 1 — Orient (evidence, not memory)

Run in order — skip only when scope is a single known file:

```bash
# 1. Graph (multi-file or unknown blast radius)
graphify query "<feature topic>" --graph docs/graphify/graphify-out/graph.json

# 2. Existing patterns (copy before inventing)
grep -r "<keyword>" app/src supabase/functions --include="*.ts" -l | head -15

# 3. SSOT docs for domain
# tasks/plan/todo.md · docs/linear/issues/ · tasks/<domain>/*.md · AGENTS.md stack table
```

**Load skills (max 2):**

| Scope | Skill |
|-------|--------|
| Supabase / RLS / edge | `ipix-supabase` |
| Mastra / agents | `mastra` |
| UI / operator | `frontend-design` · `design.md` |
| Commerce | `mercur` |
| AI provider | `gemini` · `groq-inference` |
| Multi-step delivery | `writing-plans` · `ipix-task-lifecycle` |

---

## Phase 2 — Reuse inventory (mandatory table)

Before proposing new code, list what **already ships**:

| Asset | Path | Reuse for this task? |
|-------|------|----------------------|
| RPC / migration | `supabase/migrations/...` | yes / partial / no |
| Edge function | `supabase/functions/...` | |
| API route pattern | `app/src/app/api/.../route.ts` | |
| Service layer | `app/src/lib/...` | |
| Component | `app/src/components/...` | |
| Test pattern | `*.test.ts` nearby | |
| Verify script | `scripts/verify-*.mjs` | |

**Ponytail ladder** — for each proposed net-new file, justify why rungs 1–4 failed:

1. Does this need to exist? (YAGNI)
2. Stdlib / platform?
3. Installed dep?
4. Extend existing file?

---

## Phase 3 — Generate approaches (2–4 options)

For each approach, specify:

| Field | Content |
|-------|---------|
| **Name** | Short label (e.g. "Extend booking-service only") |
| **Summary** | 2–3 sentences |
| **Files touched** | Est. count + key paths |
| **PRs** | 1 vs stacked (must respect one-concern-per-PR) |
| **Deps** | New packages? Migrations? Edge deploy? |
| **Verify** | Exact commands from `@pr-workflow` matrix |
| **Rollback** | Revert / env flag / no migration |
| **Risks** | Auth, RLS, AI, UX |

**Hard rejects** (flag, do not recommend):

- New code in legacy `src/` (Vite) — build in `app/`
- Client-side `SERVICE_ROLE` or AI keys
- Docs + production in same PR
- Two Linear issues in one PR
- `getMastra()` at module top-level
- Preview/experimental models for launch-critical paths without fallback

---

## Phase 4 — Score and recommend

Score each approach **0–100** on:

| Dimension | Weight | Question |
|-----------|--------|----------|
| **Reuse** | 25% | How much existing code/RPC/UI? |
| **Scope** | 25% | LOC, files, PR count |
| **Risk** | 20% | Auth, migration, blast radius |
| **Time-to-proof** | 20% | Days to MVP proof / green verify |
| **Maintainability** | 10% | Clear ownership, testability |

Output:

```markdown
## Recommendation: **Option N — <name>** (score XX/100)

**Why first:** <one paragraph>

| Option | Score | PRs | Est. days | Verdict |
|--------|-------|-----|-----------|---------|
| A — … | … | … | … | 🟢 / 🟡 / 🔴 |
| B — … | … | … | … | |
| … | | | | |

### Execution plan (minimal)
1. Branch: `ipi/<id>-<slug>` + worktree
2. Files (ordered): …
3. Verify: …
4. PR title: `[IPI-XXX] SPEC — …`

### Defer / split
- … → separate IPI-YYY PR

### If user says "implement"
→ `/task IPI-XXX` or `@ponytail` with Option N only
```

---

## Phase 5 — Plan-doc mode (`/efficient plan`)

When argument is a markdown plan (e.g. migration, epic):

1. **Correctness** — factual errors vs `AGENTS.md`, live codebase, official vendor docs
2. **Efficiency** — parallelizable phases, unnecessary steps, missing reuse
3. **Production gaps** — eval gates, rollback, cost, observability, security
4. **PR sequencing** — one concern per PR; suggest split if bundled
5. **Score** — 🟢/🟡/🔴 overall + "ship Phase 1 only" if not production-ready

Do **not** rewrite the whole doc — output a **correction table + efficient path** (like groq-plan audit).

---

## Phase 6 — Stop gate

End every `/efficient` with:

```text
Efficiency pass complete — no code changed.

Next:
  /task IPI-XXX       — implement recommended option
  /efficient plan …   — deeper plan audit
  /lean               — if slowness is repo/CI, not design
  writing-plans       — expand to bite-sized task doc
```

**Do not** auto-run `/task` or edit files unless user explicitly requests implementation.

---

## Quick reference

```text
Before coding:     /efficient task IPI-46
Plan audit:        /efficient plan tasks/llm/groq-plan.md
What's on branch:  /efficient branch
Copy API pattern:  /efficient api GET /api/bookings
Greenfield idea:   /efficient feature notification inbox
Repo slow:         /lean
Minimal build:     @ponytail
Ship:              /pr
```

---

## iPix defaults (always apply)

- **Canonical app:** `app/` Next.js — not root `src/` Vite
- **Tracker:** `tasks/plan/todo.md` — not root `todo.md`
- **One concern per PR/commit** — split in discovery, not at PR time
- **MCP first:** Supabase MCP before hand-rolling schema checks
- **Verify matrix:** `cd app && npm run lint && npm run build && npm test` when `app/**` touched
