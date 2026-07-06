# Known failure patterns — symptom → where it's handled

A lookup index, not a second copy of the rules. If you recognize one of these symptoms,
jump straight to the section that owns it instead of re-deriving the fix from scratch.
Patterns already fully covered by an existing gate are listed once here and not
re-explained — the "Full rule" column is where the actual content lives.

| Symptom | Full rule |
|---|---|
| Service-role client calling an `auth.uid()`-dependent RPC | SKILL.md "Never merge if" (explicit rule) + [pr-triage-checklist.md](pr-triage-checklist.md) Supabase/RLS gate |
| Docs/tooling mixed into a feature PR | SKILL.md #1 rule |
| Feature PR depends on a schema/PR that isn't merged yet | [pr-triage-checklist.md](pr-triage-checklist.md) dependency gate |
| Missing RLS verification on new tables/policies | [pr-triage-checklist.md](pr-triage-checklist.md) Supabase/RLS gate |
| CI check passing without actually covering the changed code | [pr-triage-checklist.md](pr-triage-checklist.md) — "green is not proof" note |
| Review thread resolved without a verified fix or cited evidence | [pr-review-resolve.md](pr-review-resolve.md) comment taxonomy + per-thread table |
| `SECURITY DEFINER` function with no explicit `search_path` | [pr-triage-checklist.md](pr-triage-checklist.md) Supabase/RLS gate |
| RPC trusts a client-supplied org/owner id instead of re-deriving it server-side (IDOR-shaped) | [pr-triage-checklist.md](pr-triage-checklist.md) Supabase/RLS gate — ownership checks item |
| PR exceeds ~800 lines with no split justification | SKILL.md "Branch & PR size" |
| Generated types (`supabase:types`) not regenerated after a schema change | [verify-matrix.md](verify-matrix.md) base checks |
| Merge conflict silently resolved by picking one side without checking what the other side actually did | [pr-fix-triage.md](pr-fix-triage.md) Phase 2 fix order, step 3 |

## Not this skill's job — see the owning skill instead

These come up *during* PR work but belong to a different skill. Don't build ad-hoc handling
for them here — route to the owner:

| Symptom | Owning skill |
|---|---|
| Stale/abandoned worktrees, worktree lifecycle | [worktrees](../../worktrees/SKILL.md) |
| Repo-wide health/speed audit (not this one PR) | [lean](../../lean/SKILL.md) |
| "Is there already a component/hook/pattern for this" before writing new code | `ponytail` mode (ladder rung 2) — not a separate skill, a standing session mode |
