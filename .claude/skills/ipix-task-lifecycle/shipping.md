# Phase 5 — Shipping

Coordinator for **closing the loop** — Linear, todo.md, git commit. **Mandatory** for every shipped issue.

---

## Entry / exit criteria

| | Criterion |
|---|---|
| **Entry** | Phase 4 gates green. Verify proofs captured. |
| **Exit** | Linear verify steps `[x]` · todo.md dot 🟢 · spec md updated · commit created · user informed. Push only if explicitly requested. |

---

## Shipping checklist

```
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
```

---

## Three-record bookkeeping (iPix)

| Record | Path | Update |
|--------|------|--------|
| Backlog status | [todo.md](../../../todo.md) | Dot 🟢, date, seq intact |
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

---

## Rollback awareness

| Situation | Action |
|-----------|--------|
| Small forward fix | Follow-up commit; update todo note |
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
| PR creation, review-thread triage/resolve, merge gate | [pr-workflow](../pr-workflow/SKILL.md) |

After Phase 5: offer next row from [todo.md](../../../todo.md) active queue.
