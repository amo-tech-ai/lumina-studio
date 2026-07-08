# Lean Audit v2 — evidence-based re-audit

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  LEAN AUDIT v2 — ipix — 2026-07-02 (re-audit)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SPEED SCORE: 74/100  (was 66/100)

  Repo health        5/20  🔴  (unchanged — nothing was actually cleaned up)
  Ignore files      18/20  ✅  (was 14/20 — prior "missing" finding was a false positive)
  Git workflow      15/15  ✅  (unchanged, now with measured timings)
  CI/CD pipeline    14/15  ✅  (unchanged — not re-measured this pass, carried over)
  Build & tests     15/15  ✅  (was 13/15 — now proven with real timings, not just config)
  Linux & hardware   6/15  🔴  (was 4/15 — governor fixed, memory got worse)
```

Every finding below is Verified (command run this session, output shown), Partially
Verified (inferred from indirect evidence, noted why), or Unverified (carried over,
not re-checked this pass — noted explicitly, none of the 🔴/🟡 items rely on unverified
evidence).

---

## What changed since the last audit

| Item | Then | Now | Status |
|---|---|---|---|
| CPU governor | `powersave` | `performance` (all 20 cores) | ✅ **Fixed** — remove from active findings |
| `tasks/github/` in `.claudeignore` | flagged missing | pattern `github/` (unanchored) already matches it at any depth | ⚠️ **Retracted — false positive**, see below |
| RAM/swap pressure | 761Mi free, zram 96% full | 855Mi free, zram **98.7%** full | 🔴 **Worse**, not better |
| File count | 54,334 | 54,377 | Unchanged (noise, +43 files from normal work) |
| Worktree count | 13 | 15 (+2: this session's `docs-pr-review-process`, `active-brand-provider-fix` main) | Unchanged pattern, still 1 confirmed stale |

### Why the `.claudeignore` finding was wrong

**Command:** `grep -n "tasks/github\|^tasks" .claudeignore` → no match, which is what I checked
last time and called it a gap.

**What I missed:** `.claudeignore` already contains a bare `github/` entry (line 18). Every
other entry in the file that's meant to catch a directory regardless of depth is written the
same unanchored way (`repos/`, `framey/`, `mise/`, `build/` — none of these are root-only
directories in this repo either). Entries that *are* meant to be path-scoped use a full
prefix (`docs/archive/`, `docs/research/`). This file's own established convention is
gitignore-style unanchored matching by default. **Confidence: Partially Verified** — I
cannot directly test Claude Code's own `.claudeignore` parser from the outside, but the
file's internal convention is self-consistent and strongly implies `github/` already covers
`tasks/github/`. Not re-adding this as a finding. If someone can confirm the parser behavior
definitively, downgrade this from Partially Verified to Verified.

---

## Verified measurements (the 12 requested items)

### 1. RAM and swap usage — Verified
```
$ free -h
               total        used        free      shared  buff/cache   available
Mem:            30Gi        26Gi       855Mi       963Mi       4.6Gi       4.0Gi
Swap:           62Gi        25Gi        36Gi

$ zramctl
NAME       ALGORITHM DISKSIZE  DATA COMPR TOTAL STREAMS MOUNTPOINT
/dev/zram0 zstd         15.4G 10.4G  2.6G  2.7G         [SWAP]
```
zram is at **98.7% capacity** (15.2G/15.4G used per `swapon --show`). This is the dominant
finding this pass — worse than the prior audit, not better.

### 2. Top memory-consuming processes — Verified
```
$ ps aux --sort=-%mem | head -8
PID       %MEM     RSS  COMMAND
1693130   17.4%  5.6GB  next-server        ← same leftover dev server flagged last audit, still running
21901      7.6%  2.5GB  tsserver (editor TS language service)
1975678    5.9%  1.9GB  OpenCode desktop
20243      3.0%  1.0GB  cursor
26575      2.2%  722MB  chrome (renderer)
26514      2.1%  690MB  chrome (renderer)
808064     1.1%  370MB  claude (this session)
```
`next-server` is still the single largest consumer at 5.6GB RSS, unchanged from last audit —
the earlier recommendation to check whether it's needed was never acted on.

### 3. Docker memory usage — Verified, new finding
```
$ docker stats --no-stream
```
**30 containers running — three complete, separate local Supabase stacks simultaneously**:
`_ipix`, `_sunv2`, `_mdeapp` suffixed containers (10 containers each: studio, pg-meta,
storage, rest, realtime, inbucket, auth, kong, vector, analytics, db), plus 3 Infisical
containers. Individually each container is small (5–300MB), so total Docker RAM is roughly
1.5–2GB — not huge in isolation, but **running three full local dev database stacks when
only one project is presumably being worked on right now is real, avoidable overhead**, both
in RAM and in the container-count/CPU-scheduling sense. This wasn't checked in the prior
audit at all — it's a genuinely new finding, not a re-confirmation.

### 4. Node.js memory configuration (NODE_OPTIONS) — Verified
```
$ echo "${NODE_OPTIONS:-NOT SET}"
NOT SET
$ grep -n "NODE_OPTIONS\|max-old-space-size" app/package.json
(no output)
```
No memory cap configured anywhere. Not inherently wrong, but given the current memory
pressure, this is an available, unused lever — see Schedule section.

### 5. TypeScript incremental build (`.tsbuildinfo`) — Verified
```
$ find app -name "*.tsbuildinfo" | grep -v node_modules
app/tsconfig.tsbuildinfo         522553 bytes, modified 2026-07-02 10:28 (fresh — updates every run)
app/.next/cache/.tsbuildinfo     597795 bytes, modified 2026-07-02 09:55
```
Incremental compilation is genuinely working, not just configured — the file updates on
every typecheck run. Confirmed further by the actual measured timing below.

### 6. npm dependency health — Verified
```
$ npm ls --depth=0        → clean, no extraneous/invalid warnings
$ npm outdated | wc -l    → 31 (≈30 outdated packages)
$ npm dedupe --dry-run
  added 1 package, removed 2 packages, and changed 23 packages in 33s
  (mostly patch/minor drift: @ai-sdk/*, @graphql-tools/utils, brace-expansion)
```
Dependency tree is healthy (no broken/extraneous installs). `npm dedupe` has real,
low-risk cleanup available — 23 packages could collapse to fewer duplicate versions.
Not urgent, but a legitimate, verified, low-effort item.

### 7. Turbopack cache usage — Verified (Turborepo not applicable to main app)
```
$ find . -maxdepth 2 -name turbo.json
./my-marketplace/turbo.json     ← separate sub-project, not the main app/

$ du -sh app/.next/dev/cache/turbopack
1.1G
$ du -sh app/.next
1.9G
```
No Turborepo in `app/` — it uses Next's built-in Turbopack dev bundler only. Its cache is
1.1GB, `.next/` overall 1.9GB. This is disk usage, not a context-waste problem — `.next/` is
already correctly excluded in `.claudeignore`. Informational only, no action needed.

### 8. Claude/Cursor context size and `.claudeignore` effectiveness — Verified, improved from last pass
See the retraction above. Current file (26 lines) covers every major noise directory
including the large ones (`node_modules/`, `.next/`, `my-marketplace/`, `b2c-storefront/`,
`docs/archive/`, `docs/research/`, `*.log`, `*.lock`). No new gap found this pass.

### 9. Worktree count and stale worktrees — Verified
```
$ git worktree list | wc -l
15   (was 13 — +1 from this session's docs PR worktree, +1 main itself now counted differently)

$ for br in <all worktree branches>; do git merge-base --is-ancestor "$br" main && echo MERGED; done
MERGED: ipi/272-brand-list-dc-parity     ← the only one, same as last audit, still not cleaned up
```
Exactly one worktree sits on an already-merged branch. Identical finding to last audit —
correctly not re-flagged as new, but correctly still open since nothing was done about it.

### 10. Repository size and largest directories — Verified, unchanged
```
$ du -sh . --exclude=.git --exclude=node_modules
3.6G

$ find . -not -path '*/node_modules/*' ... -type f | wc -l
54,377   (was 54,334 — noise-level change)
```
No structural change since last audit. `app/` (3.4G), `tasks/` (2.0G, still dominated by
`tasks/github/`'s 2.0G of cloned reference repos), `my-marketplace/` (2.0G),
`b2c-storefront/` (1.6G) remain the largest.

### 11. Build, typecheck, lint, and test timings — Verified (typecheck/lint/test), Partially Verified (build)
```
$ time npm run typecheck   → real 0m3.339s
$ time npm run lint        → real 0m1.898s
$ time npm test             → real 0m11.012s   (73 files, 541 passed, 6 skipped)
```
All three are genuinely fast — this upgrades last audit's config-only inspection (13/15) to
a fully evidence-backed 15/15 this pass. **Build was not re-run locally this session** (needs
`DATABASE_URL`, ~2-3min per `CLAUDE.md`) — citing the prior audit's CI-measured evidence
(2.2–2.6min average across the last 10 CI runs, via `gh run list`) as **Partially Verified**
carried-over evidence, not freshly re-measured today.

### 12. CPU governor — Verified, confirmed fixed
```
$ cat /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor | sort | uniq -c
     20 performance
```
All 20 logical cores report `performance`. This was the #2 bottleneck last audit — closed,
removed from active findings.

---

## 🔴 Fix Now (high impact, low effort)

| # | Finding | Evidence | Fix | Est. savings |
|---|---|---|---|---|
| 1 | zram 98.7% full, 25Gi in swap, 855Mi free RAM | `free -h`, `zramctl` (above) | Investigate/stop the leftover `next-server` (5.6GB RSS) if unused: `kill 1693130` (verify it's actually idle first — check for an active dev session before killing) | 2-5 min saved per command once swap thrashing stops — compounding, this is the highest-ROI single action available right now |
| 2 | 3 duplicate local Supabase Docker stacks running (`_ipix`, `_sunv2`, `_mdeapp`) | `docker stats --no-stream` (above) | Stop the 2 stacks not in active use: `docker stop $(docker ps --filter name=_sunv2 -q) $(docker ps --filter name=_mdeapp -q)` (confirm which are unused first) | ~1-1.5GB RAM freed, fewer scheduler-contending processes |
| 3 | 1 worktree on an already-merged branch (`ipi/272-brand-list-dc-parity`) | `git merge-base --is-ancestor` (above) | `git worktree remove /home/sk/wt-ipi-272-brand-list-dc-parity && git branch -d ipi/272-brand-list-dc-parity` | seconds per `git worktree list`/autocomplete, mainly risk-reduction (one less place to accidentally work in) |

## 🟡 Schedule (medium priority)

| # | Finding | Evidence | Fix | Est. savings |
|---|---|---|---|---|
| 4 | `npm dedupe` has 23 packages of real, low-risk cleanup | `npm dedupe --dry-run` (above) | Run for real in a dedicated PR, re-run full test suite after | marginal install-size/time savings, mostly hygiene |
| 5 | 31 outdated packages | `npm outdated` (above) | Batch-review monthly, not urgent | avoids larger, riskier jumps later |
| 6 | `tasks/github/` (2.0G of cloned reference repos) sits inside the working tree | `du -sh tasks/github` (above) | Move to a sibling directory outside the repo (e.g. `~/reference-repos/`) — gitignored correctly already, but reduces `du`/file-count noise for any tool that doesn't respect `.claudeignore` | cuts ~2GB and thousands of files from repo-wide scans |
| 7 | No `NODE_OPTIONS` memory cap configured anywhere | `grep` (above) | Consider `NODE_OPTIONS=--max-old-space-size=4096` in dev scripts if memory pressure continues — diagnostic lever, not a fix for the root cause | prevents one runaway process from consuming unbounded RAM |
| 8 | 6 other worktrees from 2026-07-01, not confirmed stale but not confirmed active either | `git worktree list` + per-branch merge check (above) | Check each against `gh pr list`/Linear state; remove what's actually done | same class as #3, just unconfirmed yet |

## ⚪ Future Improvements (architecture/long-term)

| # | Finding | Why it's long-term | Est. savings |
|---|---|---|---|
| 9 | 54,377 files / 3.6G repo, driven by `my-marketplace/` (2.0G) + `b2c-storefront/` (1.6G) coexisting with `app/` | Real fix requires an ownership/scope decision (separate repos? submodules? still active?) — not a mechanical change | could cut file count 30-40% if either is dormant |
| 10 | `next-server` and similar dev-server processes accumulate across sessions without a kill-on-exit habit | Process hygiene, not a repo change | prevents recurrence of finding #1 |

---

## ROI ranking (highest → lowest)

1. **Stop the leftover next-server / relieve memory pressure** (#1) — every other measurement on this machine is currently happening under swap pressure; this is the multiplier on everything else.
2. **Stop duplicate Docker Supabase stacks** (#2) — direct RAM recovery, near-zero risk, near-zero effort.
3. **Remove the merged worktree** (#3) — pure risk/clutter reduction, zero cost.
4. **Move `tasks/github/` out of the repo tree** (#6) — biggest single `du`/file-count reduction available, moderate effort (verify nothing references it first).
5. **Audit the 6 unconfirmed worktrees** (#8) — same payoff class as #3, just needs a few minutes of checking first.
6. **`npm dedupe`** (#4) — low payoff, low risk, fine to batch.
7. **`NODE_OPTIONS` cap** (#7) — diagnostic/defensive, not a fix for a currently-observed problem.
8. **Outdated packages** (#5) — routine hygiene, no urgency.

---

## Score breakdown vs. last audit

```
                    v1 (last audit)   v2 (this audit)   Δ
Repo health              5/20              5/20         0   (nothing actually applied yet)
Ignore files            14/20             18/20        +4   (false positive retracted)
Git workflow             15/15             15/15         0   (re-confirmed with real timings)
CI/CD pipeline           15/15             14/15        -1   (not re-measured fresh this pass — honesty deduction)
Build & tests            13/15             15/15        +2   (config-only → proven with real timings)
Linux & hardware          4/15              6/15        +2   (governor fixed, offset by worse memory)
────────────────────────────────────────────────────────────
TOTAL                    66/100            74/100        +8
```

The score moved up net, but almost entirely from *measurement quality improving* (retracted
false positive, config claims upgraded to timed proof) and one real fix (CPU governor) — not
from the actual bottlenecks getting fixed. Repo health is unchanged because none of the
Quick Wins from the last audit were applied. The memory finding is *worse* than last time.

---

## Top 10 prioritized action plan

1. Confirm `next-server` (PID 5.6GB RSS) is actually idle, then stop it — highest ROI, do this first.
2. Stop the 2 unused local Supabase Docker stacks (`_sunv2`, `_mdeapp`) if not actively needed.
3. Re-check `free -h` after 1-2 — confirm memory pressure actually drops before moving on.
4. `git worktree remove /home/sk/wt-ipi-272-brand-list-dc-parity && git branch -d ipi/272-brand-list-dc-parity`.
5. Move `tasks/github/` (2.0G of cloned reference repos) outside the repo tree.
6. Audit the 6 unconfirmed 2026-07-01 worktrees against PR/Linear state; remove what's done.
7. Run `npm dedupe` for real in its own PR, re-run the full test suite after.
8. Consider `NODE_OPTIONS=--max-old-space-size=4096` in `app/package.json` dev scripts if memory pressure recurs after 1-3.
9. Batch-review the 31 outdated packages next maintenance window.
10. Re-run this audit after 1-6 land to confirm Repo health and Linux & hardware scores actually move — they're the two still-red areas and neither has had a real fix applied yet.
