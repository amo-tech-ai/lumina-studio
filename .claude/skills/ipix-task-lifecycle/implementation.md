# Phase 3 — Implementation

Coordinator for coding in `/home/sk/ipix`. Routes trivial edits directly; non-trivial work through
[feature-dev](../archive/feature-dev/SKILL.md). **Per-task testing:** [references/per-task-testing.md](references/per-task-testing.md).

---

## Entry / exit criteria

| | Criterion |
|---|---|
| **Entry** | `docs/linear/issues/IPI-*.md` wiring plan exists. Linear **In Progress**. Phase 2 = green-light or trivial-skip. Plan tasks each have a `Test` block (or use [writing-plans](../writing-plans/SKILL.md)). |
| **Exit** | All plan tasks implemented. **Each task's test command passed.** `cd app && npm run lint && npm run typecheck` pass. Ready for [testing.md](testing.md) aggregate gates. |

---

## Workflow checklist

```
[ ] 1.  Worktree on branch ipi/<task>-<slug> — confirm matches issue.
[ ] 2.  Set Linear In Progress (mcp__claude_ai_Linear__save_issue).
[ ] 3.  Read docs/linear/issues/IPI-*-<SPEC-ID>.md + docs/plan/tasks/*.md if present.
[ ] 4.  Read-before-edit: every file in plan + 1–2 siblings for pattern.
[ ] 5.  Trivial vs non-trivial (table below).
[ ] 6.  For EACH task in plan (in order):
        a. Write failing test (or document smoke pre-check)
        b. Run task Test command — confirm FAIL (or smoke baseline)
        c. Implement minimal change
        d. Run task Test command — confirm PASS
        e. cd app && npm run typecheck on touched files
        f. Do NOT start next task until (d) passes
[ ] 7.  Implement order: migration → edge fn → lib/hooks → UI (when cross-layer).
[ ] 8.  cd app && npm run lint && npm run typecheck before handoff.
[ ] 9.  Self-review git diff — each hunk maps to an AC + test file.
[ ] 10. Hand off to testing.md for aggregate matrix.
```

---

## Per-task test loop

```
Task N: implement → run Test command → PASS? → Task N+1
                              ↓ FAIL
                         fix code or test (stay on Task N)
```

Load [gen-test](../gen-test/SKILL.md) when authoring Vitest. Full contract:
[per-task-testing.md](references/per-task-testing.md).

---

## Read-before-edit rule

**Mandatory.**

- Read all wiring-plan paths before first edit.
- Grep callers for hooks/services you touch.
- Migrations: read latest in `supabase/migrations/`.
- Edge: [ipix-supabase](../ipix-supabase/SKILL.md) + [gemini](../gemini/SKILL.md) if AI.
- RLS: [ipix-supabase](../ipix-supabase/SKILL.md) patterns.

---

## Trivial vs non-trivial

| Trivial — edit directly | Non-trivial — [feature-dev](../archive/feature-dev/SKILL.md) + [writing-plans](../writing-plans/SKILL.md) |
|-------------------------|--------------------------------------------------------|
| ≤5 file edits | >5 files or cross-layer |
| Single area (`app/` only) | UI + edge + migration |
| No migration / RLS | Any schema or RLS change |
| No new abstractions | Pattern others will copy |
| Clear AC + wiring + test | Ambiguous integration |

Even trivial edits need at least one test run or documented smoke in the task proof.

---

## Code quality (reminders)

- Canonical surface: `app/` (Next.js) — not legacy root `src/`.
- `@/` imports in `app/src/`.
- `cn()` for conditional Tailwind.
- Four states on data UI components.
- RLS: `(select auth.uid())` subquery pattern.
- No client `SERVICE_ROLE` / `GEMINI_API_KEY`.

Full rules: [CLAUDE.md](../../../CLAUDE.md) · `.cursor/rules/`.

---

## Migration safety

[references/migration-safety.md](references/migration-safety.md) · after migration task:
`infisical run -- npm run supabase:verify-rls`.

---

## Validation per task

| After each task | Pass |
|-----------------|------|
| Task `Test` command (Vitest/smoke/verify) | Exit 0 / expected output |
| `cd app && npm run typecheck` | 0 errors on changed area |

## Validation before Phase 4

| Command | Pass |
|---------|------|
| `cd app && npm run lint` | No new errors |
| `cd app && npm run typecheck` | Exit 0 |
| All task Test commands | Passed (logged in plan or Linear proof) |
| `git diff` review | Each hunk → AC + test |

---

## Anti-patterns

| Don't | Do |
|-------|-----|
| Defer all tests to Phase 4 | Test after every plan task |
| `it.skip` without follow-up issue | Fix or file IPI follow-up |
| Edit before reading | Read wiring plan files first |
| Scope creep | One issue = one shippable unit |
| `supabase start` | Remote linked project only |

---

## Routing

| Need | Route to |
|------|----------|
| Per-task contract | [references/per-task-testing.md](references/per-task-testing.md) |
| Vitest patterns | [gen-test](../gen-test/SKILL.md) |
| Multi-file / architecture | [feature-dev](../archive/feature-dev/SKILL.md) |
| Supabase / edge | [ipix-supabase](../ipix-supabase/SKILL.md) |
| Migration checklist | [references/migration-safety.md](references/migration-safety.md) |

Hand off to [testing.md](testing.md) when all per-task tests pass.
