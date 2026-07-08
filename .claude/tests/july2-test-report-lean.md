Lean Audit Report

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    LEAN AUDIT — ipix — 2026-07-02 (re-run, evening)
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  SPEED SCORE: 77/100  (was 66/100 this morning — +11)

    Repo health        5/20  🔴  (unchanged)
    Ignore files      17/20  ✅  (was 14/20 — tasks/github/ gap closed)
    Git workflow      15/15  ✅  (unchanged, now also self-heals stale node_modules)
    CI/CD pipeline    15/15  ✅  (unchanged)
    Build & tests     13/15  ✅  (unchanged)
    Linux & hardware  12/15  ✅  (was 4/15 — governor + memory pressure both fixed)

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  WHAT CHANGED SINCE THIS MORNING
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ✅ CPU governor: powersave → performance (bottleneck #2, fixed)
  ✅ Memory pressure: 761Mi free / zram 96% full → 6.4Gi available / zram ~65% full
     (bottleneck #1, resolved — no longer "severe", still worth another look, see below)
  ✅ tasks/github/ (2GB of cloned reference repos) is no longer nested under tasks/ —
     it's been moved to a top-level github/ dir AND is now correctly in both
     .gitignore and .claudeignore (bottleneck #3, fixed — this was the Advanced-tier
     recommendation from this morning, done same day)
  ✅ Pre-push hook hardened further (this session): both .git/hooks/pre-push and
     pre-push-full now auto-run `npm ci` when package-lock.json is newer than
     node_modules/.package-lock.json, instead of failing with a confusing
     "cannot find module" error on a stale worktree

  ⚠️ Worktree count grew 13 → 16 (moving the wrong direction — see #2 below)
  ⚠️ File count basically flat: 54,334 → 55,118 (repo health score unchanged)

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  TOP BOTTLENECKS  (ranked by impact)
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  #1 55,118 files outside node_modules/dist/.next — 18x this skill's "full marks"
  threshold (3000), well past "critical" (10000). Was bottleneck #4 this morning;
  now #1 since governor/memory/tasks-github are fixed.
     Why it hurts: slower git operations, IDE indexing, any tool walking the tree.
     Fix: no single command — structural (my-marketplace/, b2c-storefront/ are the
     two biggest nested projects, see Advanced section).

  #2 Worktree count grew 13 → 16, and the specific fix from this morning's report
  was slightly wrong: `wt-ipi-272-brand-list-dc-parity` is NOT stale — it's on
  branch `ipi/design-command-brand-parity` with active work (last commit:
  "fix(pr-181): graceful degrade on brand_scores failures"). The actual merged,
  safe-to-delete branch is `ipi/272-brand-list-dc-parity` (a differently-named,
  differently-purposed branch with no worktree attached at all).
     Why it hurts: pure overhead — disk, `git worktree list` noise, risk of working
     in the wrong tree by accident. 16 worktrees is a lot to track manually.
     Fix: `git branch -d ipi/272-brand-list-dc-parity` (no worktree remove needed —
     nothing has it checked out). Do NOT remove the wt-ipi-272-brand-list-dc-parity
     worktree — it has unmerged, active work.

  #3 package-lock.json / yarn.lock / pnpm-lock.yaml still not in .claudeignore
     Why it hurts: lock files can be 50k+ tokens each; a stray broad read (Glob/Grep
     without a path filter) pulls them into context for no reason.
     Fix: `echo -e 'package-lock.json\nyarn.lock\npnpm-lock.yaml' >> .claudeignore`

  #4 Available RAM still moderate (6.4Gi of 30Gi), zram at ~65% (4.7G/15.4G data)
     Why it hurts: better than this morning's "severe" pressure, but still enough
     swap activity to slow a cold `next build` or a large `tsc` run.
     Fix: `ps aux --sort=-%mem | head` — check for another leftover next-server /
     Chrome/Cursor process before a heavy build; not urgent, just not "solved."

  #5 No explicit test-runner pool/thread config in `app/vitest.config.ts` for 70
  test files (unchanged from this morning)
     Why it hurts: minor — defaults are fast today, but unpinned, so it's one
     dependency-version-bump away from regressing silently.
     Fix: add `test: { pool: 'threads', poolOptions: { threads: { maxThreads: 4 } } }`.

  #6 `docs/research/*.pdf` (~100MB+) still shows as untracked, not ignored
  (unchanged from this morning)
     Why it hurts: one `git add -A` away from a 100MB+ accidental commit.
     Fix: add `docs/research/` to `.gitignore`, or move the PDFs out of the repo tree.

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ⚡ QUICK WINS  (<5 minutes each)
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  [ ] Delete the actually-stale merged branch (corrected target — not the worktree)
      $ git branch -d ipi/272-brand-list-dc-parity
      Verify: git branch --merged main | grep -v '^\*\|main' — should be empty

  [ ] Add remaining lock-file patterns to .claudeignore
      $ printf 'package-lock.json\nyarn.lock\npnpm-lock.yaml\n*.log\n' >> .claudeignore
      Verify: grep -c "lock\|\.log" .claudeignore

  [ ] Add docs/research/ to .gitignore
      $ echo 'docs/research/' >> .gitignore
      Verify: git status --porcelain docs/research/ shows nothing (or `!!` if forced)

  [ ] Check for a leftover memory-hogging process before your next heavy build
      $ ps aux --sort=-%mem | head -5
      Verify: free -h — available should stay comfortably above 4Gi under load

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🔧 MEDIUM IMPROVEMENTS  (<30 minutes each)
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  [ ] Audit the other worktrees for staleness (16 total now, up from 13)
      What to do: for each of the 16, check `gh pr list` / Linear state — if merged
      or abandoned, `git worktree remove` it. wt-ipi-272-brand-list-dc-parity is
      confirmed NOT stale (active branch); check the rest individually, don't assume.
      Verify: git worktree list count trends down, not up
      Saves: fewer places to accidentally work in the wrong branch

  [ ] Pin vitest pool config (see bottleneck #5)
      What to do: add explicit pool/maxThreads to app/vitest.config.ts, benchmark
      before/after.
      Verify: time (cd app && npm test) before and after — flat or faster
      Saves: defensive, prevents a future regression

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🏗️   ADVANCED IMPROVEMENTS
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  [ ] Investigate whether my-marketplace/ (2.0G) and b2c-storefront/ (1.6G) still
  need to be full nested projects in this repo (unchanged from this morning)
      Why: combined 3.6G — the single biggest remaining lever on the file-count
      score, now that github/ has already been relocated the same way.
      How: check last-commit recency inside each, cross-reference with whoever owns
      Mercur/commerce work before touching anything.
      Saves: could cut file count by ~30-40% if either is dormant.

  [ ] Move github/ (2.0G, already gitignored + claudeignored) fully outside the
  repo tree, same as was floated for tasks/github/ this morning
      Why: it no longer leaks into Claude's context or git, but it still counts
      toward `du -sh .` and any tool (including raw `find`) that doesn't respect
      ignore files — including this skill's own file-count metric.
      How: move to a sibling `~/reference-repos/` directory.
      Saves: ~2G off `du`, and would move the repo-health file count meaningfully
      closer to the "problem" threshold from "critical."

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  AI CONTEXT WASTE
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  The highest-risk gap from this morning (tasks/github/ readable by Claude despite
  being 2GB of someone else's codebase) is now closed — it's correctly in
  .claudeignore under its new top-level github/ path.

  Remaining gap: lock files (package-lock.json etc.) still not excluded — same
  one-line fix as this morning, still not applied. Cheap enough that estimating a
  dollar cost isn't worth the time — just add the lines (see Quick Wins).

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ALREADY GOOD ✅
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  - git status still runs in ~9ms — fsmonitor, untrackedCache, manyFiles all enabled
  - Pre-push hook gates every push (typecheck + test), and as of this session also
    auto-heals a stale/missing node_modules instead of failing confusingly
  - CI averages ~2.4min across the last 10 runs (131-149s range), well under the
    8min full-marks bar, 2 parallel jobs, caching in place
  - tsconfig has both `incremental` and `skipLibCheck` set correctly
  - Turbopack already enabled for dev
  - graphify graph is fresh (only 1 file newer than the last rebuild)
  - CPU governor is now `performance` (was `powersave` this morning)
  - inotify watch limit at the recommended floor (524288)
  - github/ relocation + .claudeignore/.gitignore coverage — closed the single
    highest-risk context-leak gap from this morning's audit, same day

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ESTIMATED TOTAL SAVINGS IF ALL REMAINING FIXED
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    Per PR:    ~30-60s (lock-file context noise avoided; memory pressure no longer
    a live compounding factor now that governor + RAM are fixed)
    Per day:   ~5-10 minutes, mostly from worktree hygiene avoiding a wrong-tree
    mistake and the lock-file/docs-research quick wins
    Per week:  ~30-60 minutes, plus avoided risk of a 100MB+ accidental commit from
    docs/research/

  The three biggest wins from this morning (memory pressure, CPU governor,
  tasks/github/ context leak) are all resolved. What's left is smaller and more
  structural — file count is now the clear #1 lever, and it needs the
  my-marketplace/b2c-storefront ownership conversation, not a one-line fix.
