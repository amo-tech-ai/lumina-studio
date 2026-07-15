---
description: "Worktree manager — audit, add, clean, list. Standard iPix paths and branch naming."
argument-hint: "[audit|add|clean|list|remove] [IPI-XXX slug | path]"
allowed-tools: ["Bash", "Read"]
---

# /worktree — iPix worktree manager

**Arguments:** `$ARGUMENTS` — subcommand + optional args.

**Skill:** `.claude/skills/worktrees/SKILL.md`  
**Audit script:** `scripts/worktree-audit.mjs`  
**Tracker (generated):** `docs/development/worktree-tracker.md`

**Principle:** one worktree per task · sibling paths only · never nest · backup before `--force`.

---

## Injected context

- Worktrees: !`git worktree list 2>/dev/null`
- Current branch: !`git branch --show-current`
- Repo root: !`git rev-parse --show-toplevel`
- Sibling wt dirs: !`ls -d ../wt-ipi-* ../wt-* 2>/dev/null | sort -u | head -15 || echo "none"`

---

## Subcommands

| Command | Action |
|---------|--------|
| `/worktree` or `/worktree audit` | Run audit → show inventory + health score |
| `/worktree list` | Same as audit (compact) |
| `/worktree add IPI-286 slug` | Standardized create via `worktree-add.mjs` |
| `/worktree clean` | Safe cleanup: merged/gone only (interactive confirm) |
| `/worktree remove <path>` | Remove one worktree after forensic check |
| `/worktree write` | Regenerate `docs/development/worktree-tracker.md` |

Parse `$ARGUMENTS` — default subcommand: **audit**.

---

## iPix conventions (enforce)

| Field | Pattern |
|-------|---------|
| Branch | `ipi/<issue>-<slug>` — e.g. `ipi/286-route-aware-sections` |
| Path | `../wt-ipi-<issue>-<slug>` — **sibling** of repo, never inside repo |
| Base | `origin/main` |
| Env | copy via `.worktreeinclude` |

**Never:**

- Create worktree on `main` branch checkout for feature work
- `rm -rf` a worktree directory — use `git worktree remove`
- `git worktree remove --force` without stash/backup
- Nest worktree inside repo or another worktree

---

## Audit (`audit` | `list`)

```bash
npm run worktree:audit
# or persist tracker:
npm run worktree:audit -- --write
# JSON for automation:
node scripts/worktree-audit.mjs --json
```

Report includes:

- 🟢 active · 🟡 waiting/idle · ⚪ merged · 🔴 stale
- PR linkage (via `gh`)
- Disk size per worktree
- Uncommitted file count
- **Orphan dirs** (`../wt-*` not in `git worktree list`)
- Safe-to-delete list with exact commands

---

## Add (`add IPI-286 slug`)

**Before adding — clean up stale worktrees first, every time (CLAUDE.md Step 0), not just on the weekly `clean` ritual below.** Run audit, remove anything ⚪/🔴 with `safeToDelete ✅`, then create the new one:

```bash
npm run worktree:audit
# remove anything safe-to-delete, then:
npm run worktree:add -- IPI-286 route-aware-sections
cd ../wt-ipi-286-route-aware-sections
```

Then:

1. Implement task
2. `/pr-process new` → verify → commit
3. `/pr-process open`

---

## Clean (`clean`)

**Read-only triage first** — always run audit before deleting.

```bash
npm run worktree:audit -- --write
git fetch --prune
git worktree prune
```

For each row with **safeToDelete ✅** and status ⚪ or 🔴 (not dirty):

1. Confirm PR merged or branch `[gone]`
2. Confirm `git -C <path> status --porcelain` empty (or stash first)
3. Remove:

```bash
git worktree remove "<path>"
```

Then delete **orphan** directories only after manual verify — not registered in git:

```bash
# After confirming empty / no unique work:
rm -rf ../wt-orphan-name   # last resort — prefer git worktree repair + remove
git worktree prune
```

Also run `/clean-gone` for `[gone]` local branches without worktrees.

**Weekly ritual:** `/worktree clean` + `/clean-gone` (~5 min).

---

## Remove single (`remove <path>`)

Forensic audit before any remove:

```bash
git -C "<path>" status --short
git -C "<path>" log --oneline origin/main..HEAD
git -C "<path>" stash list
```

If dirty → stash `-u` first or refuse.

```bash
git worktree remove "<path>"
# if refuses and user confirms discard:
git worktree remove --force "<path>"
git worktree prune
```

---

## Integration with PR workflow

| Phase | Command |
|-------|---------|
| Start task | `/worktree add IPI-XXX slug` |
| Before PR | `/pr-process new` (in worktree) |
| After merge | `/worktree clean` |
| Disk pressure | audit → remove ⚪ merged + orphans |

---

## Port conflicts

Parallel dev servers need distinct ports:

| Worktree | Suggested port |
|----------|----------------|
| Main | 3002 (app default) |
| wt #2 | 3003 |
| wt #3 | 3004 |

---

## Output template (audit)

```markdown
# Worktree audit — <date>

**Health:** NN/100 · **Count:** N · **Orphans:** N

| Status | Path | Branch | PR | Size | Safe delete |
| … |

## Recommended actions
1. …
```

Always explain cleanup with evidence (PR state, merge status, dirty count).
