---
name: ipix-task-lifecycle
description: >
  Five-phase orchestrator for iPix / FashionOS Linear team IPI — plan, research, implement,
  test, ship (worktrees, verify matrix, PR workflow, Linear state). Use whenever implementing
  or shipping IPI-NNN, wiring plans in docs/linear/issues, forensic verify before Done,
  MVP/P0 queue from tasks/plan/todo.md, multi-file platform work across app/supabase/edge,
  or user says "implement IPI-", "ship IPI-", "/task IPI", "close out Linear", "next P0 task",
  "forensic verify", "wiring plan", "open PR with verify". Always use for multi-step iPix
  delivery. Do NOT use for one-line typo fixes, explain-only questions, isolated copilotkit/
  supabase/migration/lean/release-notes tasks without full lifecycle, or non-iPix repos.
version: "1.6.0"
---

# ipix-task-lifecycle

**BLUF:** One hub, five phases, one bookkeeping contract for **iPix / FashionOS** (team **IPI**). Each Linear issue + `docs/linear/issues/IPI-*.md` is the execution contract.

**Hub index:** [README.md](README.md)

---

## When to invoke

| Trigger | Action |
|---------|--------|
| "Work on IPI-###" / `/task IPI-NNN` | Load issue → mark In Progress → phases 2–5 |
| "Add Linear steps to IPI-###" | Phase 1 + [linear-issue-steps.md](references/linear-issue-steps.md) |
| "Process platform backlog" / "Next task" | [`tasks/plan/todo.md`](../../../tasks/plan/todo.md) |
| "Ship IPI-###" / "Sync Linear" | Phase 5 · mark Done via `mcp__claude_ai_Linear__save_issue` |
| "Build feature" / greenfield / wiring plan | Phase 1 → child skills → Phase 3 |
| "Forensic verify" before Done | [task-verifier](../task-verifier/SKILL.md) |

### Don't invoke for

- One-off questions or trivial single-file edits
- Commit-only with no Linear traceability

---

## iPix context

| Topic | Rule |
|-------|------|
| **Linear** | [linear.app/amo100](https://linear.app/amo100) · team **IPI** · `LINEAR_API_KEY` in `.env.local` |
| **Linear read** | `mcp__linear-ipix__get_issue` — read issues, descriptions, comments |
| **Linear status** | `mcp__claude_ai_Linear__save_issue` with `state: "In Progress"` / `"Done"` — **not** `mcp__linear-ipix__save_issue` (cannot update status) |
| **Supabase** | Remote linked · project `nvdlhrodvevgwdsneplk` · service role via API routes only |
| **App** | Next.js `:3002` · `app/` · `(operator)` route group |
| **Issue IDs** | `IPI-NNN` (Linear) — old `PLT-`/`AI-`/`DNA-`/`COM-`/`UI-` spec IDs are retired |

---

## Child skills (load on demand)

| Intent | Child |
|--------|-------|
| Explore intent | [brainstorming](../archive/brainstorming/SKILL.md) |
| Idea → design + spec dialogue | [feature-design-assistant](references/feature-design-assistant.md) |
| Implementation plan | [writing-plans](../writing-plans/SKILL.md) |
| MVP cuts | [mvp](../mvp/SKILL.md) |
| Full PRD | [prd-template](references/prd-template.md) |
| Epic → feature PRD | [breakdown-feature-prd](../archive/brainstorming/breakdown-feature-prd/SKILL.md) |
| Repo / docs hygiene | [lean](../lean/SKILL.md) |
| Multi-file / architecture | [feature-dev](../archive/feature-dev/SKILL.md) |
| Per-task test contract | [per-task-testing](references/per-task-testing.md) |
| Vitest authoring | [gen-test](../gen-test/SKILL.md) |

### Sibling skills (not symlinked)

| Intent | Skill |
|--------|-------|
| CLAUDE.md / project memory | [claude-md-improver](../archive/claude-md-improver/SKILL.md) |
| Forensic Done gate | [task-verifier](../task-verifier/SKILL.md) |
| Mermaid in Linear | [mermaid-diagrams](../mermaid-diagrams/SKILL.md) |

### Routing tree

```
New / ambiguous → brainstorming → writing-plans → Phase 3
Linear issue w/ A–E + spec md → phases 2–5
Large / architecture → feature-dev → writing-plans → Phase 3
MVP cut → mvp
New PRD → prd-template → Linear spec + writing-plans
```

Phase modules: [planning.md](planning.md) · [research.md](research.md) · [implementation.md](implementation.md) · [testing.md](testing.md) · [shipping.md](shipping.md)

---

## Per-task testing (mandatory)

Every task in `docs/plan/tasks/*.md` and every Linear step A–E must include a **Test** block
before the next task starts. No batching tests to the end of Phase 3.

| Phase | Testing duty |
|-------|----------------|
| 1 Plan | Each AC → test type; each Linear step → proof command |
| 3 Implement | After each task: run its Vitest/smoke/verify command → PASS → next task |
| 4 Test | Full matrix + aggregate gates ([testing-matrix](references/testing-matrix.md)) |

Contract: [references/per-task-testing.md](references/per-task-testing.md) · authoring: [gen-test](../gen-test/SKILL.md)

---

## Five phases

| # | Phase | Output |
|---|-------|--------|
| 1 | [planning.md](planning.md) | Linear A–E + gantt + spec md + **diagrams/wireframes** |
| 2 | [research.md](research.md) | Audit note + green-light + **API route inventory** |
| 3 | [implementation.md](implementation.md) | Code + **per-task tests green** |
| 4 | [testing.md](testing.md) | Aggregate verify + smoke |
| 5 | [shipping.md](shipping.md) | todo 🟢 · Linear Done · commit |

---

## Issue enrichment — when to add diagrams, wireframes, and wiring

Add these to the Linear issue description during **Phase 1 (planning)**. Never skip if the issue touches UI or multiple services.

### Wireframe — add when
- Any new UI surface, panel, or screen
- Existing layout is significantly reorganised
- Stakeholder alignment needed before coding

**How:** ASCII wireframe inline in the Linear description (no external tool needed for lo-fi).
Load [`/ipix-wireframe`](../ipix-wireframe/SKILL.md) · use ASCII + spec table method for speed.

```
┌─────────────┬──────────────────┬─────────────┐
│ LEFT        │ CENTER           │ RIGHT       │
│ Nav         │ AI chat          │ Context     │
└─────────────┴──────────────────┴─────────────┘
 ← 240px       ← flex-1           ← 320px →
```

### Mermaid diagrams — add when

| Diagram type | Add when |
|---|---|
| `sequenceDiagram` | Any API call chain, auth flow, or multi-service interaction |
| `flowchart` | User journey with decisions, or data pipeline |
| `stateDiagram-v2` | Component has multiple states (loading/loaded/error/empty) |
| `erDiagram` | New tables or schema changes |
| `flowchart` (component tree) | New React component hierarchy with 3+ components |

**How:** embed fenced ` ```mermaid ``` ` blocks directly in the Linear issue.
Load [`/mermaid-diagrams`](../mermaid-diagrams/SKILL.md) — type-selection table is the quick reference.

### Frontend ↔ Backend wiring — add when
- Issue creates or changes any API route
- Component fetches data from Supabase (directly or via route)
- Supabase Realtime subscription is involved
- New React context or shared state is introduced

**Include in the issue:**
1. **API routes table** — route path · status (🔴 create / 🟡 check / ✅ exists) · auth pattern · return shape
2. **Auth pattern** — always `withOperatorAuth` + `createSupabaseServerClient`
3. **Context/state** — provider name, where it wraps, what it exposes
4. **Data fetch pattern** — `useSWR` null-gated on dependency, or server component fetch
5. **Realtime** — channel name, table, filter, what triggers refetch

**Minimum wiring block:**
```
| Route | Status | Auth | Returns |
|---|---|---|---|
| GET /api/foo/[id] | 🔴 create | withOperatorAuth | { ... } |
```

### Decision table

| Issue type | Wireframe | Mermaid | Wiring |
|---|---|---|---|
| New UI screen / panel | ✅ always | flowchart + sequence | ✅ always |
| UI change (existing screen) | if layout changes | state diagram | if fetch changes |
| API route only | — | sequence | ✅ always |
| DB migration only | — | erDiagram | if types change |
| Bug fix | — | — | only if root cause is a wiring gap |
| Refactor / cleanup | — | component tree if complex | — |

---

## Slash commands (use these first)

| Command | When |
|---------|------|
| `/task IPI-NNN` | Full task lifecycle: read → worktree → implement → test → PR → pr-fix → Done |
| `/audit [scope]` | Forensic audit of a feature or route before shipping |
| `/supa [scope]` | Supabase schema, RLS, migration, type-drift audit |
| `/pr-fix PR#` | Fix PR review comments, resolve threads, re-run tests |

## Scripts (fallback)

| Script | When |
|--------|------|
| `node scripts/linear-update-issue.mjs <id>` | Push spec md → Linear description (bulk sync) |
| `node scripts/linear-update-issue.mjs --all` | Bulk sync all IPI-*.md → Linear |

Requires `LINEAR_API_KEY` in `.env.local`. Details: [shipping.md](shipping.md)

---

## Verification gates

```bash
cd app
npm run typecheck   # must be 0 errors
npm run lint        # must be clean
npm test            # compare against main baseline — no new failures
npm run build       # only if route/config/schema changed (~2-3min)
```

After DB changes: run `/supa` to verify RLS, indexes, type drift.

**Done gate:** ACs checked `[x]` · `mcp__claude_ai_Linear__save_issue state:"Done"` · todo.md 🟢 · PR merged.

---

## Phase sequencing

| Skip | When |
|------|------|
| Phase 1 | Issue has A–E + gantt + spec md |
| Phase 2 | ≤3 files, no Supabase/RLS |
| Phase 4 | Never on auth/RLS/edge |
| Phase 5 | Never |

Check `docs/plan/todo.md` for current sprint dependencies before starting any IPI task.

---

## Quick links

| Resource | Path |
|----------|------|
| Linear steps | [references/linear-issue-steps.md](references/linear-issue-steps.md) |
| Spec template | [references/linear-spec-template.md](references/linear-spec-template.md) |
| Migration safety | [references/migration-safety.md](references/migration-safety.md) |
| Issue specs | `docs/linear/issues/IPI-*.md` |
| Backlog | [todo.md](../../../todo.md) |
| Supabase hub | [ipix-supabase/SKILL.md](../ipix-supabase/SKILL.md) |
| MCP cadence | [references/mcp-cadence-ipix.md](references/mcp-cadence-ipix.md) |

---

## Contract

- Remote Supabase only · no client secrets · traceability IPI ↔ SPEC ↔ todo ↔ code · no push without user ask.
