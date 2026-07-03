---
name: worktrees
description: Set up and operate git worktrees for isolated, parallel development — running multiple branches or Claude sessions at once without stashing or branch-switching, reviewing a PR while developing, comparing implementations side by side, or giving a risky change its own clean checkout. Use this whenever the user mentions worktrees, "isolated workspace", "parallel branches", "work on two things at once", `git worktree`, `--worktree`, or before executing a multi-step implementation plan that should not touch the current working tree. Also use when you (the agent) need an isolated checkout to make file changes that must not collide with the user's working tree.
---

# Git Worktrees

A git worktree is a second working directory with its own files and branch that **shares the same repository history and remote** as your main checkout. Worktrees let you have several branches checked out at once — edits in one never touch another — without stashing, cloning, or constantly switching branches.

**Core principle:** one worktree per active task. Switch context by changing directories, not branches. A branch can only be checked out in one worktree at a time.

**When NOT to bother:** a quick read of another branch (`git show branch:file`), a one-line fix on a clean tree, or anything where switching branches costs nothing. Worktrees pay off when you have *uncommitted work to protect* or *parallel work to run*.

## iPix defaults

For iPix work, use a worktree for any **multi-step implementation task** (anything beyond a trivial one-file edit) so the current working tree stays clean. Prefer the native flow (`claude --worktree`, `EnterWorktree`); when creating manually, follow these conventions:

- **Branch:** `ipi/<task-id>-<short-name>` — e.g. `ipi/22-ui-shell`
- **Directory:** `../wt-ipi-<task-id>-<short-name>` (sibling of the repo) — e.g. `../wt-ipi-22-ui-shell`

```bash
git worktree add ../wt-ipi-22-ui-shell -b ipi/22-ui-shell origin/main
cd ../wt-ipi-22-ui-shell
```

**Default validation** — run in the worktree before opening a PR (the repo uses **npm**; commit must leave all five green):

```bash
npm ci            # clean install against package-lock.json
npm run lint
npm run typecheck # tsc --noEmit
npm run test
npm run build
```

> The operator app (`app/`, Next.js) has no `test` script and its build sets `ignoreBuildErrors`, so validate it with `npm run lint`, `npx tsc --noEmit`, and `npm run build`.

## iPix safety rails

Always-on guardrails for iPix worktree work. Command recipes for the longer ones live in [references/ipix-ops.md](references/ipix-ops.md).

### Merge gate checklist

Before opening a PR, merging, or flipping a task to Done — all must hold, or it's "looks done" but broken:

- [ ] All five validations green: `npm ci` · `lint` · `typecheck` · `test` · `build`
- [ ] [Forensic audit](references/ipix-ops.md#forensic-audit) clean — no unexpected dirty or untracked files
- [ ] [Production SHA check](references/ipix-ops.md#production-sha-check) — base is current `origin/main`, local `main` not diverged
- [ ] No leaked dirs in the diff (see Leak guard below)
- [ ] PR scoped to one concern ([PR splitting playbook](references/ipix-ops.md#pr-splitting-playbook))
- [ ] Worktree backed up if it held uncommitted work (Backup-before-cleanup below)

### Never run blindly

These discard work or rewrite history. **Run the [forensic audit](references/ipix-ops.md#forensic-audit) first** and only proceed once you can name exactly what will be lost:

- `git worktree remove --force` — discards a worktree's uncommitted changes + untracked files
- `git clean -fdx` / `rm -rf` — deletes untracked files (incl. `.env`) / arbitrary trees
- `git reset --hard` — discards working-tree and index changes
- `git checkout -- .` / `git restore .` — discards unstaged changes
- `git branch -D` — force-deletes a possibly-unmerged branch
- `git push --force` — use `--force-with-lease` instead

### Backup before cleanup

Before removing a dirty worktree or running any `--force`/`reset`, preserve the work first:

```bash
git -C <worktree> stash push -u -m "pre-cleanup"        # quickest, reversible
# or capture a patch you can re-apply later:
git -C <worktree> diff HEAD > /tmp/wt-<task-id>.patch
```

Only then `git worktree remove --force`. A 10-second backup beats unrecoverable loss.

### Leak guard

These must be gitignored so they never show as untracked or get committed (`github/` alone is ~1.7 GB of vendored examples):

`.claude/worktrees/` · `.worktrees/` · `github/` · `node_modules/`

```bash
for d in .claude/worktrees .worktrees github node_modules; do
  git check-ignore -q "$d" || echo "$d/" >> .gitignore
done
```

> **iPix today:** `node_modules/` is ignored, but `.claude/worktrees/`, `.worktrees/`, and `github/` are **not** — add them before creating worktrees so a 1.7 GB `github/` doesn't leak into `git status` or a commit.

### Nested worktree guard

Never create a worktree inside the repo or inside another worktree — that nests checkouts and corrupts `git status`. Before any `git worktree add`:

- Run [Step 0 detection](#step-0-detect-existing-isolation-run-before-creating-anything). If `GIT_DIR != GIT_COMMON`, you're already in a linked worktree — don't nest another; return to the main worktree first.
- Target path must be a **sibling** (`../wt-ipi-…`) or under `.claude/worktrees/` — never a subdirectory of the current repo.

## Decision: how to create the worktree

Try these in order — **prefer the harness's native mechanism over raw git.** Using `git worktree add` when a native tool exists creates phantom state the harness can't track or clean up.

1. **Already isolated?** Detect first (see Step 0). If yes, don't create another.
2. **Claude Code native** — the `EnterWorktree` tool, the `--worktree`/`-w` CLI flag, or a `--worktree`/`--isolation worktree` option on the agent/task tool. This handles placement, branch creation, env copying, and cleanup automatically. Use it.
3. **Raw `git worktree add`** — only when no native mechanism is available (plain shell, CI, non-Claude-Code context). See [references/git-commands.md](references/git-commands.md).

### Step 0: Detect existing isolation (run before creating anything)

```bash
GIT_DIR=$(cd "$(git rev-parse --git-dir)" 2>/dev/null && pwd -P)
GIT_COMMON=$(cd "$(git rev-parse --git-common-dir)" 2>/dev/null && pwd -P)
git rev-parse --show-superproject-working-tree 2>/dev/null   # non-empty ⇒ submodule, NOT a worktree
```

- `GIT_DIR != GIT_COMMON` **and not a submodule** → you are already in a linked worktree. Skip creation; go straight to setup. Report: "Already in an isolated worktree at `<path>` on `<branch>`."
- `GIT_DIR == GIT_COMMON` (or in a submodule) → normal checkout. If the user hasn't already expressed a preference, ask before creating one: *"Set up an isolated worktree so your current branch stays untouched?"* Honor any standing preference without re-asking.

## Claude Code native worktrees

The fastest path. Default placement is `.claude/worktrees/<name>/` at the repo root, on a new branch `worktree-<name>`, branched from `origin/HEAD` (a clean tree matching the remote; falls back to local `HEAD` if no remote).

```bash
claude --worktree feature-auth      # create + start a session in an isolated worktree
claude -w bugfix-123                 # short flag; run in a second terminal for a parallel session
claude --worktree                    # auto-named, e.g. bright-running-fox
claude --worktree "#1234"            # branch from PR #1234 → .claude/worktrees/pr-1234
```

- **In-session:** ask Claude to "work in a worktree" and it uses the `EnterWorktree` tool. It can hop to another worktree under `.claude/worktrees/` by calling `EnterWorktree` with that path; the previous one stays on disk.
- **First-time trust:** run plain `claude` once in the directory to accept the trust dialog before `--worktree` works interactively (`-p` runs skip this).
- **Always add `.claude/worktrees/` to `.gitignore`** so worktree contents don't show as untracked in the main checkout.
- **Base branch:** set `worktree.baseRef: "head"` in settings to branch from local `HEAD` (carries unpushed commits) instead of the clean default `"fresh"`.

### Copy gitignored files (.env, secrets) — `.worktreeinclude`

A worktree is a fresh checkout, so untracked files like `.env` are **not** present. Add a `.worktreeinclude` (gitignore syntax) at the project root; matching files that are *also gitignored* get copied into every new worktree (tracked files are never duplicated):

```text
.env
.env.local
config/secrets.json
```

Applies to `--worktree`, subagent worktrees, and desktop parallel sessions. (Not processed when a custom `WorktreeCreate` hook replaces git behavior — copy configs inside the hook instead.)

### Isolate subagents/parallel agents

Give each parallel agent its own worktree so concurrent edits don't conflict: ask Claude to "use worktrees for your agents", or set `isolation: worktree` in a custom subagent's frontmatter. Each gets a temporary worktree, auto-removed when the agent finishes with no changes. While an agent runs, Claude `git worktree lock`s its worktree so cleanup can't remove it mid-run.

## After creation: make the worktree usable

A fresh worktree has the code but none of the *environment*. Initialize it:

1. **Dependencies** — install per worktree (they don't share `node_modules`/`.venv`):
   ```bash
   [ -f package.json ] && npm install
   [ -f Cargo.toml ]   && cargo build
   [ -f go.mod ]       && go mod download
   [ -f requirements.txt ] && pip install -r requirements.txt
   [ -f pyproject.toml ]   && poetry install
   ```
2. **Untracked config** — if not using `.worktreeinclude`, copy needed `.env`/secret files in by hand.
3. **Port conflicts** — parallel worktrees can't all bind the same dev port. Give each a distinct port (e.g. one runs the app on `3002`, the parallel one on `3003`) or only run one dev server at a time. This is the most common "why is it broken" surprise.
4. **Baseline check** — run the test/build command once so you can tell new breakage from pre-existing. If it fails, report and ask before continuing rather than chasing a bug you didn't introduce.

## Cleanup

**Never `rm -rf` a worktree** — that orphans metadata in `.git/worktrees/`. Use git (or let the native session do it).

- **Native sessions:** on exit, a worktree with no uncommitted changes, untracked files, or new commits is removed automatically (named sessions prompt instead). A dirty worktree prompts keep-or-remove. `-p` runs don't auto-clean — remove manually.
- **Manual:**
  ```bash
  git worktree list                 # see all worktrees + their branches
  git worktree remove <path>        # clean tree required
  git worktree remove --force <path> # discards uncommitted changes
  git worktree prune                # clear stale metadata after a manual delete
  ```
- **Backup first** if the worktree is dirty — see [Backup before cleanup](#backup-before-cleanup). Never `--force` without it.
- **Weekly tidy ritual** (prune stale branches + merged worktrees) → [references/ipix-ops.md#weekly-tidy-ritual](references/ipix-ops.md#weekly-tidy-ritual).

## Quick reference

| Task | Command |
|------|---------|
| Native isolated session | `claude --worktree <name>` |
| Native, from a PR | `claude --worktree "#<n>"` |
| Manual: new branch | `git worktree add ../<proj>-<name> -b <branch>` |
| Manual: existing branch | `git worktree add ../<proj>-<name> <branch>` |
| Manual: from remote | `git worktree add --track -b <branch> ../<p> origin/<branch>` |
| Detached (experiment) | `git worktree add --detach ../<proj>-exp <commit>` |
| List | `git worktree list` |
| Remove | `git worktree remove <path>` (`--force` if dirty) |
| Prune stale | `git worktree prune` |
| Repair after manual move | `git worktree repair` |

Full command set, locking, and troubleshooting → [references/git-commands.md](references/git-commands.md).
Comparing files/commits and selectively merging *between* worktrees → [references/compare-merge.md](references/compare-merge.md).
iPix command playbooks (forensic audit, production SHA check, PR splitting, weekly tidy) → [references/ipix-ops.md](references/ipix-ops.md).

## Best practices for parallel work

| Practice | Why |
|----------|-----|
| One worktree per task; cap active ones at ~3–4 | More directories ≠ more output; coordination cost grows fast |
| Name by purpose (`-review`, `-hotfix`), not ticket noise | `project-review` reads clearer than `project-pr-123` |
| Native tool over raw git when available | Avoids phantom state the harness can't clean up |
| Distinct dev port per running worktree | Prevents silent "address in use" failures |
| Commit or stash before `git worktree remove` | `remove` without `--force` refuses; `--force` discards work |
| `/clear` when switching contexts in a long session | Keeps one task's context from polluting another |

## Common mistakes

| Mistake | Fix |
|---------|-----|
| `rm -rf` to delete a worktree | `git worktree remove`, then `git worktree prune` |
| `git worktree add` despite a native tool | Use the native mechanism (Step in Decision) |
| Creating a nested worktree inside another | Run Step 0 detection first |
| Worktree dir tracked by git | Add `.claude/worktrees/` (or your path) to `.gitignore` |
| Same dev port in two worktrees | Assign distinct ports |
| "Branch already checked out" error | A branch lives in one worktree only — `git worktree list` to find it |
| Forgetting deps/env in the new worktree | Install deps + copy `.env` (or use `.worktreeinclude`) |

## Non-git VCS

For SVN/Perforce/Mercurial, configure `WorktreeCreate` and `WorktreeRemove` hooks to supply custom create/cleanup logic (the hook replaces git behavior, so `.worktreeinclude` is skipped — copy configs in the hook). See the Claude Code hooks reference.
