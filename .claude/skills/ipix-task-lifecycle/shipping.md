# Phase 5 — Shipping

Coordinator for **closing the loop** — PR, Linear, [`tasks/plan/todo.md`](../../../tasks/plan/todo.md), git commit. **Mandatory** for every shipped issue.

**PR + threads:** [pr-workflow](../pr-workflow/SKILL.md) · **Done gate:** [task-verifier](../task-verifier/SKILL.md)

---

## Entry / exit criteria

| | Criterion |
|---|---|
| **Entry** | Phase 4 verify matrix green. Proofs captured. |
| **Exit** | **Never mark Done unless** Done gate in [SKILL.md](../SKILL.md) is satisfied. PR merged (or waived) · threads resolved · `tasks/plan/todo.md` 🟢 · commit · user informed. |

---

## Shipping checklist

```
<<<<<<< HEAD
[ ]  1. Re-run: npm run lint && npm run build (+ test / supabase verify if required).
[ ]  2. Update docs/linear/issues/IPI-*-<SPEC-ID>.md — AC [x], verify evidence.
[ ]  3. Tick Linear completion steps A–E (UI or node scripts/linear-update-issue.mjs).
[ ]  4. Set Linear state Done or In Review per team gate.
[ ]  5. Update todo.md row → 🟢 + date; bump executive summary if needed.
[ ]  6. Self-review git diff — no scope creep, no secrets, no console.log.
[ ]  7. Stage explicit paths (never git add -A).
[ ]  8. Commit with conventional message (template below).
[ ]  9. task-verifier on spec if user requires forensic Done (optional).
[ ] 10. Report: issue link, files changed, verify summary.
[ ] 11. Push / PR only if user explicitly asks.
[ ] 12. **Worktree teardown (if used):** [documentation preservation gate](../worktrees/SKILL.md#documentation-preservation-gate-mandatory--p0) → commit/split docs → `npm run worktree:pre-delete` → `git worktree remove <path>` → `npm run worktree:audit`.
=======
[ ]  1. Re-run verify matrix ([pr-workflow verify-matrix](../pr-workflow/references/verify-matrix.md)) — paste output.
[ ]  2. task-verifier report (mandatory for auth/RLS/edge/Mastra/UI; document waiver if trivial).
[ ]  3. Update docs/linear/issues/IPI-*-<SPEC-ID>.md — AC [x], verify evidence.
[ ]  4. Tick Linear completion steps A–E (UI or node scripts/linear-update-issue.mjs).
[ ]  5. pr-workflow: PR open · Bugbot clean or waived · all threads resolved.
[ ]  6. Set Linear state Done (or In Review if waiting on human merge).
[ ]  7. Update tasks/plan/todo.md row → 🟢 + date.
[ ]  8. Self-review git diff — one concern, no secrets, no console.log.
[ ]  9. Stage explicit paths (never git add -A).
[ ] 10. Commit with conventional message (template below).
[ ] 11. Report: issue link, PR link, files changed, verify summary.
[ ] 12. Push / merge only if user explicitly asks.
[ ] 13. worktree:pre-delete before removing worktree (if applicable).
>>>>>>> origin/main
```

---

## Three-record bookkeeping (iPix)

| Record | Path | Update |
|--------|------|--------|
| Backlog status | [`tasks/plan/todo.md`](../../../tasks/plan/todo.md) | Dot 🟢, date, seq intact |
| Spec + AC | `docs/linear/issues/IPI-*.md` | AC checked, verify block filled |
| System of record | Linear issue | Steps `[x]`, state, optional comment |

All three must agree before calling the issue shipped.

---

## Templates

See [references/shipping-templates.md](references/shipping-templates.md).

### Commit message

```
<type>(<area>): IPI-<n> <SPEC-ID> — <outcome>

Co-Authored-By: Claude <noreply@anthropic.com>
```

| type | When |
|------|------|
| `feat` | New capability |
| `fix` | Bug on shipped behavior |
| `refactor` | No behavior change |
| `docs` | Spec / todo / linear docs only |
| `chore` | Tooling, deps |
| `test` | Tests only |

| area | When |
|------|------|
| `plt` | Platform / auth / env |
| `ai` | Edge + Gemini |
| `dna` | DNA scoring |
| `ui` | Dashboard / operator UI |
| `com` | Commerce (Mercur) |
| `supabase` | Migrations / RLS |

---

## Linear sync

**Script:** [scripts/linear-update-issue.mjs](../../../scripts/linear-update-issue.mjs)

```bash
# Single issue
node scripts/linear-update-issue.mjs IPI-16

# Bulk push local spec descriptions → Linear
node scripts/linear-update-issue.mjs --all
```

Requires `LINEAR_API_KEY` in `.env.local`. See [references/linear-issue-steps.md](references/linear-issue-steps.md).

---

## Push policy

| Action | Allowed |
|--------|---------|
| Local commit | Yes — every Phase 5 |
| Push to remote | User explicitly requests |
| Force-push main | Never |
| Push to `main` | Never — `ipi/*` branch + PR only |

---

## Rollback awareness

| Situation | Action |
|-----------|--------|
| Small forward fix | Follow-up commit; update todo row note |
| Bad migration | Rollback SQL from migration comment; repair per supabase/README |
| Broken edge fn | Redeploy previous version; reopen issue |
| Unclear regression | `git revert`; set Linear Back to In Progress |

---

## Routing

| Need | Route to |
|------|----------|
| Linear step format | [references/linear-issue-steps.md](references/linear-issue-steps.md) |
| Commit templates | [references/shipping-templates.md](references/shipping-templates.md) |
| Forensic Done gate | [task-verifier](../task-verifier/SKILL.md) |
| PR create, verify, threads, merge | [pr-workflow](../pr-workflow/SKILL.md) |
| Worktree cleanup | [worktrees](../worktrees/SKILL.md) |

After Phase 5: offer next row from [`tasks/plan/todo.md`](../../../tasks/plan/todo.md) active queue.
