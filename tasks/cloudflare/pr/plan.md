# PR split plan — replacing #391

**Why:** PR #391 (`codex/IPIX` → `main`) accidentally bundled 28 commits (2,300+ file diff, exceeds GitHub's API render limit) because `codex/IPIX` carries 26 commits of unrelated prior branch history — a production Planner module, the `cf-wf` skill rename, `infisical`/`groq-inference` skill deletions — none of which this session touched. Bugbot correctly flagged this against `AGENTS.md`'s rule: never mix docs, production, and CI/config changes in one PR.

**Fix:** close #391. Cherry-pick only this session's 2 commits onto a clean branch off current `main`, split into 2 separately-reviewable PRs (one concern each), skip the main `/home/sk/ipix` worktree entirely (currently checked out to `ai/ipi-614-clean` by a concurrent process with active uncommitted work — do not touch its branch state).

## Status

- [x] Diagnosed: PR #391 = 28 commits, not 2. Confirmed via `gh pr view 391 --json commits` + failed diff render (>300 files).
- [x] Isolated worktree created: `/home/sk/wt-skills-cf-cleanup` on branch `docs/claude-skills-and-cf-tasks-cleanup`, forked cleanly off `origin/main` (not `codex/IPIX`) — avoids re-inheriting the 26 unrelated commits.
- [x] Created `chore/claude-skills-cleanup` directly from `origin/main`, cherry-picked only `4a28620e` → became **PR #394**
- [x] Created `docs/cf-tasks-audit-corrections` directly from `origin/main`, cherry-picked only `83fee455` → became **PR #395**
- [x] Verified each branch: exactly 1 commit ahead of `origin/main`, file list matched, zero production/config/lockfile paths
- [x] Pushed both, PRs auto-created on push (#394, #395)
- [x] Closed #391 with a comment pointing to #394 and #395
- [x] Reconstructed `tasks/cloudflare/Tasks/notes/07`, `09`, `10` (exact) and `08` (partial, truncated at line 197) — added to #395 in a follow-up commit. `02`, `04`, `05`, `06` intentionally left absent per explicit instruction — not recoverable, no paraphrased replacement written.

**Post-split status (2026-07-15):**
- **PR #394 — MERGED** (2026-07-15T03:19:56Z, by amo-tech-ai, merge commit `defb80e5`).
- **PR #395 — still OPEN.** Also received the `012` filename rename (ported from #381) in a third commit, plus the recovered notes above. Currently has a **failing Codacy check** and **20 actionable CodeRabbit comments** — neither yet triaged. See `pr-3-plan.md` context and the next chat turn for detail; not yet filed to a plan doc.

## The 2 commits to extract

| Commit | Concern | Files | Target |
|---|---|---|---|
| `4a28620e` — `chore(claude-skills): remove dead docs, dedupe Chrome guide, relocate official mirror` | Claude skill hygiene only. No production code, no Cloudflare task content. | 17 (`.claude/commands/agents/docs/*`, `docs/reference/claude-code-official/*`) | **PR A** |
| `83fee455` — `docs(cf-tasks): apply audit corrections, archive superseded plan-a files` | Cloudflare AI Gateway migration task-doc corrections only. No skill files, no production code. | 45 (all under `tasks/cloudflare/`) | **PR B** |

Both are docs-only and safe to keep as 2 separate PRs rather than 1, since they're genuinely unrelated concerns (Claude tooling hygiene vs. a specific migration's task docs) — matches `AGENTS.md`'s "each separate" instruction, not just "not mixed with code."

## Execution steps (from `/home/sk/wt-skills-cf-cleanup`, not `/home/sk/ipix`)

Corrected 2026-07-15 per review: create each branch **independently from `origin/main`**, cherry-pick only its one intended commit — never both commits onto one branch and split after.

```bash
cd /home/sk/wt-skills-cf-cleanup
test "$(pwd)" = "/home/sk/wt-skills-cf-cleanup" || exit 1

git fetch origin --prune
git cat-file -e 4a28620e^{commit}
git cat-file -e 83fee455^{commit}
```

### PR A — Claude skill hygiene

```bash
git switch --detach origin/main
git switch -c chore/claude-skills-cleanup
git cherry-pick 4a28620e

git rev-list --count origin/main..HEAD   # expect: 1
git diff --stat origin/main...HEAD
git diff --name-only origin/main...HEAD
git diff --name-only origin/main...HEAD | grep -E '^(app/|supabase/|services/|\.github/workflows/|package.*json)' \
  && echo "ERROR: unexpected production/config files present"

git push -u origin chore/claude-skills-cleanup
```

Expected: 1 commit, ~17 files, only `.claude/commands/agents/docs/**` and `docs/reference/claude-code-official/**`, no `tasks/cloudflare/**`, no production/config/lockfile matches.

### PR B — Cloudflare task documentation

```bash
git switch --detach origin/main
git switch -c docs/cf-tasks-audit-corrections
git cherry-pick 83fee455

git rev-list --count origin/main..HEAD   # expect: 1
git diff --stat origin/main...HEAD
git diff --name-only origin/main...HEAD
git diff --name-only origin/main...HEAD | grep -E '^(app/|supabase/|services/|\.github/workflows/|package.*json)' \
  && echo "ERROR: unexpected production/config files present"

git push -u origin docs/cf-tasks-audit-corrections
```

Expected: 1 commit, ~45 files, everything under `tasks/cloudflare/**`, no `.claude/**`, no production/config/lockfile matches.

### Create the replacement PRs

```bash
gh pr create --base main --head chore/claude-skills-cleanup \
  --title "chore(claude-skills): remove dead docs, dedupe Chrome guide, relocate official mirror" \
  --body "Extracted from PR #391 onto a clean branch based on current main. Scope is limited to Claude skill and official-reference documentation hygiene."

gh pr create --base main --head docs/cf-tasks-audit-corrections \
  --title "docs(cf-tasks): apply audit corrections, archive superseded plan-a files" \
  --body "Extracted from PR #391 onto a clean branch based on current main. Scope is limited to Cloudflare migration task documentation."
```

Capture both PR numbers before the next step.

### Close #391 — only after both replacement PRs exist

```bash
gh pr close 391 --comment "Superseded by #<PR-A> and #<PR-B>. PR #391 inherited 26 unrelated commits from the divergent codex/IPIX branch history. The two session commits were extracted onto clean branches based on current main."
```

## Guardrails

- Do not run any `git checkout <branch>` inside `/home/sk/ipix` (main worktree) until whatever concurrent process is using it finishes — it currently has 11 uncommitted Supabase migration changes on `ai/ipi-614-clean` that must not be disturbed.
- Verify each new branch's diff against `origin/main` matches exactly the file list in the table above before pushing — no silent scope creep back in.
- Do not touch the wider `codex/IPIX` ↔ `main` reconciliation (26-commit divergence) as part of this — that's a separate, larger, already-flagged decision for the team.
