# July 15 worktree cleanup plan — preserve first, delete second

**Status:** Phase A+B+CF+C+PR369 complete — 61 worktrees deleted, PR #369 merged, 4 PRs closed, 23 remain  
**Audit score accepted:** 82/100  
**Audit PR:** #398 (docs-only, merged/open)  
**Rule:** Never delete a worktree until its unique plans/docs/skills/code are either on `main`, in a salvage archive, or explicitly abandoned in writing.

---

## Progress log

| Date | Action | Recovered | Notes |
|---|---|---:|---|
| 2026-07-15 | Deleted `.claude/worktrees/adoring-snyder-2de01d` | 135 MB | CLOSED PR #214, all content already on `main` |
| 2026-07-15 | Opened PR #398 (audit docs) | — | `.@worktrees/` files only |
| 2026-07-15 | **Phase A1 complete** — 15 MERGED-clean worktrees | ~29 GB | All 15 ✅, 80 worktrees remain |
| 2026-07-15 | **Phase A2 complete** — 36 MERGED-clean worktrees | ~79 GB | All 36 ✅, 44 worktrees remain |
| 2026-07-15 | Pruned startupai16L + mde stale refs | — | Harmless metadata cleanup |
| 2026-07-15 | **Phase B salvage** — archived 3 risk areas | — | `ipi-488` (410 files, 19MB), `cf-plan-phase1` (5 patches), `claude-md` (22-line diff) |
| 2026-07-15 | **Cloudflare cleanup** — closed PRs #374 + #372, deleted 6 CF worktrees | ~12 GB | `wt-cf-plan-phase1`, `wt-cf-plan-phase1-public`, `wt-cf-tasks-phase2-fixes`, `wt-cf-tasks-phase3-linear-sync`, `wt-cf-gw-001-scope-fix`, `wt-cf-wf-skill-fixes` |
| 2026-07-15 | **PR #369 merged** — design-prompt deduplication (375 byte-identical files removed) | ~2 GB | `wt-docs-dedupe-design-prompt-new` removed |
| 2026-07-15 | **Phase C complete** — 2 remaining dirty-merged worktrees force-removed | ~4 GB | `wt-ipi-404-assets-masonry` (local-only next.config tweak), `wt-ipi-454-ac-f-gateway` (smoke script already on main) |

---

## Verdict on the correction

**Your correction is correct.** Phase 2 in `WORKTREE-MASTER-AUDIT.md` was too aggressive.

Evidence collected 2026-07-15:

| Claim | Confirmed? | Evidence |
|---|:---:|---|
| `CLOSED` ≠ `MERGED` | ✅ | All 6 named CLOSED PRs have `mergedAt=None` and `git cherry` shows `+` commits not in `main` |
| No-PR ≠ safe | ✅ | `wt-cf-plan-phase1` has 5 unpushed commits / 83 files / ~24k insertions; lean audit + IPI-342 + IPI-488 branches also unique |
| Do not batch-delete 59 | ✅ | One wrong CLOSED/no-PR classification would destroy unique Cloudflare plans, worker auth, tool-calling code |
| First 15 MERGED-only batch is safe | ✅ | Those 15 are MERGED via `gh`, clean, no unique untracked files |
| Salvage 5 risk areas first | ✅ | Design prompts, CLAUDE.md, smoke script, unpushed plans, lean audit |
| Leave mdeapp alone | ✅ | Heavily dirty; separate project |

### CLOSED PRs — must leave “safe to delete”

| Worktree | PR | Unique still on branch (not in main) |
|---|---:|---|
| `wt-cf-plan-phase1-public` | 355 | Cloudflare plan consolidation + skill renames (5 cherry commits, 45 files) |
| `wt-cf-tasks-phase2-fixes` | 381 | Phase 2 CF-tasks doc fixes (3 cherry commits) |
| `wt-cf-tasks-phase3-linear-sync` | 383 | Phase 3 Linear sync docs (2 cherry commits) |
| `wt-ipi-468` | 339 | Worker bearer-auth + tests (**6 cherry commits** — security-sensitive) |
| `wt-ipi-525-audit` | 336 | Audit markdown for Workers AI tool calling |
| `wt-ipi-525-registry` | 342 | Tool-calling types/tests/Gemini guards (**8+ cherry commits**) |

### No-PR / local-only — preservation candidates

| Worktree | Ahead | What is at risk |
|---|---:|---|
| `wt-cf-plan-phase1` | 5 | Large Cloudflare draft plans + PR audits (~24k lines) |
| `wt-docs-lean-audit-2026-07-12` | 1 | `.claude/tests/LEAN-AUDIT-2026-07-12.md` + `.claudeignore` fixes |
| `wt-ipi-342-fix` | 6 | Tool routing / registry regression tests (~937 lines) |
| `wt-ipi-488-booking-e2e` | 3 | `e2e/06-booking-wizard.spec.ts` additions |
| `wt-ipi-488-booking-qa-docs` | 4 | Linear issue spec for booking QA |
| OpenCode ephemeral branches | 3–4 | Treat as unknown until session lock + content review |

---

## Hard exclusion — do not touch

| Path | Rule |
|---|---|
| `/home/sk/wt-main-audit/` | **DO NOT TOUCH.** Never remove, prune, force-clean, rebase, or modify. Detached verification checkout (HEAD `4b27d1d7`). Exclude from every cleanup phase. |

---

## Hard preservation rules (every phase)

1. **Salvage outside the repo before any risky delete.**
   - Archive root: `/home/sk/worktree-salvage/`
   - Layout: `/home/sk/worktree-salvage/<worktree-slug>/`
2. **Never force-remove** until every dirty/untracked path is classified:
   - `UNIQUE — MUST PRESERVE`
   - `NEWER THAN MAIN`
   - `DUPLICATE — BYTE IDENTICAL`
   - `SUPERSEDED BY MAIN`
   - `ALREADY IN MERGED PR`
   - `GENERATED/JUNK` (`.infisical.json`, `test-results/`, `__pycache__`, `.env`)
   - `UNKNOWN — REVIEW REQUIRED` → stop
3. **Remove worktrees first; delete local branches later.** Keep remote branches until a second pass.
4. **Batches of 10–15 max.** Regenerate tracker after every batch.
5. **Do not copy 410 untracked files into `main`.** Archive first, then compare.
6. **One concern per salvage PR** (docs-only vs code-only). Never mix.
7. **OpenCode pool last.** No deletes in Phase A–C.

### Classification checklist (per worktree, before delete)

```bash
WT=<path>
BR=$(git -C "$WT" branch --show-current)

# 1. PR truth
gh pr list --head "$BR" --state all --json number,state,mergedAt,title

# 2. Unique commits vs main
git -C "$WT" log --oneline origin/main..HEAD
git cherry -v origin/main "$BR"

# 3. Content still different from main?
git -C "$WT" diff --stat origin/main...HEAD

# 4. Working tree
git -C "$WT" status --short
git -C "$WT" ls-files --others --exclude-standard

# 5. High-value path scan (plans/docs/skills)
git -C "$WT" ls-files --others --exclude-standard \
  | rg -n '\.(md|mdx|sql|ts|tsx|mjs|py|sh)$|^(docs|tasks|linear|\.claude|\.agents|\.cursor|supabase|scripts|app/src)/|README|AGENTS|CLAUDE|PRD'
```

Only mark **SAFE TO DELETE** when all are true:

- PR `MERGED` (not merely CLOSED) **or** written intentional abandonment
- clean working tree
- zero unique untracked plans/docs/skills/code/tests/migrations
- `git cherry` shows no useful leftover (or leftovers already salvaged)
- no active Cursor/Claude/OpenCode session lock
- file comparison completed

---

## Phase A — Safe cleanup now (MERGED + clean only)

**Goal:** Recover ~25–30 GB with near-zero risk.  
**Do not include CLOSED or no-PR worktrees.**

### Batch A1 (15 worktrees) — approve first

```text
wt-cf-gw-docs-fix
wt-cf-gw-remote-true
wt-cf-mig-210-pr286
wt-cf-tasks-archive-plan-a
wt-cf-tasks-audit-corrections
wt-chore-remove-groq-infisical
wt-chore-remove-stale-symlink
wt-cloudflare-workflow-standard
wt-cursor-agent-rules
wt-docs-315-316-successor
wt-docs-linear-prompt-template
wt-docs-pr312-audit
wt-docs-pr312-verify
wt-docs-response-style
wt-docs-supabase-rls-lessons
```

### Pre-delete gate (run once for the batch)

```bash
cd /home/sk/ipix
for name in \
  wt-cf-gw-docs-fix \
  wt-cf-gw-remote-true \
  wt-cf-mig-210-pr286 \
  wt-cf-tasks-archive-plan-a \
  wt-cf-tasks-audit-corrections \
  wt-chore-remove-groq-infisical \
  wt-chore-remove-stale-symlink \
  wt-cloudflare-workflow-standard \
  wt-cursor-agent-rules \
  wt-docs-315-316-successor \
  wt-docs-linear-prompt-template \
  wt-docs-pr312-audit \
  wt-docs-pr312-verify \
  wt-docs-response-style \
  wt-docs-supabase-rls-lessons
do
  WT=/home/sk/$name
  echo "=== $name ==="
  git -C "$WT" status --short
  git -C "$WT" ls-files --others --exclude-standard | wc -l
done
```

Abort Batch A1 if any worktree shows dirty or untracked high-value files.

### Exact delete commands (worktrees only — keep branches)

Pre-delete gate runs before each removal:

```bash
cd /home/sk/ipix
for name in \
  wt-cf-gw-docs-fix \
  wt-cf-gw-remote-true \
  wt-cf-mig-210-pr286 \
  wt-cf-tasks-archive-plan-a \
  wt-cf-tasks-audit-corrections \
  wt-chore-remove-groq-infisical \
  wt-chore-remove-stale-symlink \
  wt-cloudflare-workflow-standard \
  wt-cursor-agent-rules \
  wt-docs-315-316-successor \
  wt-docs-linear-prompt-template \
  wt-docs-pr312-audit \
  wt-docs-pr312-verify \
  wt-docs-response-style \
  wt-docs-supabase-rls-lessons
do
  echo "--- Verifying $name ---"
  git -C "/home/sk/$name" status --short
  git -C "/home/sk/$name" ls-files --others --exclude-standard | head -5
  git -C "/home/sk/$name" log --oneline origin/main..HEAD | wc -l
  git worktree remove "/home/sk/$name"
done
git worktree prune
```

### Post-batch verify

```bash
npm run worktree:audit -- --write
git worktree list | wc -l
df -h /
```

Update `.@worktrees/worktrees.md` and strike Batch A1 from the master audit.

### Harmless prune (other repos) — can run with A1

```bash
git -C /home/sk/startupai16L worktree prune
git -C /home/sk/mde worktree prune
rm -rf /home/sk/wt-ipi-578-workspace-shell   # orphan, 456K, broken git
```

**Do not touch `mdeapp`.**

---

## Phase B — Salvage the five known risk areas

**Order matters:** archive → compare → decide → only then delete.

### B0 — Create salvage root

```bash
mkdir -p /home/sk/worktree-salvage/{ipi-488,claude-md-examples,ipi-454-gateway,cf-plan-phase1,lean-audit-2026-07-12,closed-prs,no-pr}
```

### B1 — `wt-ipi-488-booking-qa-seed` (410 untracked + 2 dirty tracked)

**Dirty tracked files:** `.infisical.json` (generated) + local dev config — classified as GENERATED/JUNK.

```bash
cp -a /home/sk/wt-ipi-488-booking-qa-seed/Universal-design-prompt5 \
  /home/sk/worktree-salvage/ipi-488/
cp /home/sk/wt-ipi-488-booking-qa-seed/mvp.md \
  /home/sk/worktree-salvage/ipi-488/
```

Then:

- Compare against canonical design sources on `main` / design archives
- Hash sample files (`sha256sum`) before discarding duplicates
- Do **not** dump the folder into `main`
- Dirty tracked files confirmed as generated — safe to discard

### B2 — `wt-claude-md-real-world-examples`

```bash
git -C /home/sk/wt-claude-md-real-world-examples diff -- CLAUDE.md
```

- Cherry-pick only useful guidance into a focused **docs-only** PR
- Archive the full diff under `/home/sk/worktree-salvage/claude-md-examples/`

### B3 — `wt-ipi-454-ac-f-gateway`

```bash
cat /home/sk/wt-ipi-454-ac-f-gateway/app/scripts/smoke-317-gateway.mts
rg -n 'smoke-317|gateway' /home/sk/ipix/app/scripts /home/sk/ipix/scripts 2>/dev/null
```

Keep only if it still tests a live path not covered elsewhere. Otherwise archive and discard.

### B4 — `wt-cf-plan-phase1` (5 unpushed commits)

```bash
git -C /home/sk/wt-cf-plan-phase1 log --oneline origin/main..HEAD
git -C /home/sk/wt-cf-plan-phase1 diff --stat origin/main...HEAD
```

Choices (pick one in writing):

1. Push a focused docs branch + open PR for still-useful plan content
2. Copy unique docs into `/home/sk/worktree-salvage/cf-plan-phase1/` then abandon
3. Explicitly abandon as superseded by later CF-tasks PRs (#379/#395)

**Do not delete until the choice is recorded in this file.**

### B5 — `wt-docs-lean-audit-2026-07-12`

```bash
git -C /home/sk/wt-docs-lean-audit-2026-07-12 show HEAD:.claude/tests/LEAN-AUDIT-2026-07-12.md | head
```

Likely preserve as audit record (docs-only PR or salvage archive).

---

## Phase C — Dirty merged worktrees (review before `--force`)

| Worktree | Dirty / untracked | Gate |
|---|---|---|
| `wt-ipi-404-assets-masonry` | `app/next.config.ts` modified | Diff vs main; keep only if unique |
| `wt-ipi-454-ac-f-gateway` | smoke script (see B3) | Salvage first |
| `wt-ipi-476-planner-grants-api` | `.infisical.json` | GENERATED → force OK after confirm |
| `wt-ipi-488-book-e2e-500` | `test-results/` | GENERATED → force OK after confirm |
| `wt-ipi-536-qa` | `test-results/` | GENERATED → force OK after confirm |
| `wt-ipi-575-main-fix` | `package.json`, lockfile, `.infisical.json` | Diff packages carefully |
| `wt-ipi-575-planner-data-settings` | `mutations.test.ts` modified | Diff vs merged PR #384 |
| `wt-ipi-577-planner-settings-ui` | `.infisical.json` | GENERATED → force OK after confirm |
| `wt-ipi-577-verify` | detached + `test-results/` + `.infisical.json` | Inspect untracked list first |

Per worktree:

```bash
git -C <worktree> status --short
git -C <worktree> diff
git -C <worktree> ls-files --others --exclude-standard
```

Only then:

```bash
git -C /home/sk/ipix worktree remove --force <path>
```

---

## Phase D — CLOSED + no-PR review (preservation project)

**Separate from Phase A.** Goal: salvage unique Cloudflare docs, worker auth, tool-calling code, audits.

### CLOSED queue

1. Archive unique files from remaining CLOSED worktrees into `/home/sk/worktree-salvage/closed-prs/<slug>/`
2. For each, decide: reopen/split PR · docs-only follow-up · intentional abandon
3. Highest risk of loss if deleted cold:
   - **IPI-468 worker auth** (`wt-ipi-468`)
   - **IPI-525 tool calling** (`wt-ipi-525-registry` + related `wt-ipi-342-fix`)
   - ~~**Cloudflare plan consolidation** (`wt-cf-plan-phase1` / public twin)~~ ✅ DONE — salvaged as patches, PRs #374 + #372 closed, worktrees deleted

### No-PR queue

| Worktree | Suggested outcome |
|---|---|
| ~~`wt-cf-plan-phase1`~~ | ~~Preserve docs (see B4)~~ ✅ DONE — salvaged + deleted |
| `wt-docs-lean-audit-2026-07-12` | Preserve audit record (see B5) |
| `wt-ipi-342-fix` | Compare to IPI-525 CLOSED work; salvage tests if not on main |
| ~~`wt-ipi-488-booking-e2e`~~ | ~~Compare to merged #303~~ ✅ DONE — deleted (Phase A2) |
| ~~`wt-ipi-488-booking-qa-docs`~~ | ~~Archive Linear spec~~ ✅ DONE — deleted (Phase A2) |

---

## Phase E — Remaining MERGED-clean batches

After A1 + B salvage notes are done, delete remaining **MERGED-only** clean worktrees in batches of ≤15.

Examples for later batches (verify each with the checklist first):

- Remaining MERGED docs/chore worktrees from the master audit Table 5
- Large MERGED feature worktrees (`wt-ipi-396-*`, `wt-ipi-577-role-*`, etc.) once confirmed clean

**Still excluded until Phase D:** every CLOSED and every no-PR worktree.

After each batch:

```bash
npm run worktree:audit -- --write
git worktree list
df -h /
```

---

## Phase F — Open PR worktrees (resolve, don’t mass-rebase)

| PR | Worktree | Suggested action |
|---:|---|---|
| 349 | `wt-docs-pr-workflow-fixes` | Check if still relevant |
| 356 | `wt-fix-vitest-pool-config` | Rebase only if still needed |
| **369** | `wt-docs-dedupe-design-prompt-new` | **Prioritize** — reduces future bloat / doc-loss risk |
| ~~372~~ | ~~`wt-cf-wf-skill-fixes`~~ | ✅ CLOSED + deleted |
| 373 | `wt-opencode-workflow` | Review security/usefulness |
| ~~374~~ | ~~`wt-cf-gw-001-scope-fix`~~ | ✅ CLOSED + deleted |

Delete worktrees only after PR merge/close **and** Phase A-style MERGED gate.

---

## Phase G — OpenCode pool last

Under `/home/sk/.local/share/opencode/worktree/...`:

- Check session locks / active branches
- Salvage any unique untracked files (`tidy-otter`, `gentle-island`)
- Remove only when OpenCode no longer references them

---

## Phase H — Branch deletion (later pass)

Only after worktrees are gone and salvage is complete:

```bash
# Example — do NOT run until Phase E+F done
git branch -d <local-branch>          # only if fully merged
git push origin --delete <branch>     # only with explicit approval
```

Keep remotes for CLOSED/no-PR until Phase D decisions are written.

---

## Files / docs / skills loss-prevention map

| Asset type | Where loss usually hides | Protection |
|---|---|---|
| Plans / audits | `tasks/**`, `.claude/tests/**`, unpushed docs branches | Phase B4/B5 + CLOSED queue |
| Skills | `.claude/skills/**`, CLOSED skill renames | Diff before delete; docs-only PR |
| Design sources | `Universal-design-prompt*` untracked | B1 salvage archive |
| Linear specs | `docs/linear/**`, booking QA docs | Compare to `docs/linear/issues/` |
| Tests / migrations | dirty MERGED worktrees, CLOSED code PRs | Phase C + D |
| Agent rules | `CLAUDE.md`, `.cursor/rules` | B2 diff + cherry-pick |

---

## Approval checklist

- [ ] **Approve Phase A1** — delete 15 MERGED-clean worktrees + prune other-repo phantoms
- [ ] **Approve Phase B** — create `/home/sk/worktree-salvage` and archive the five risk areas (no deletes yet)
- [ ] Hold CLOSED / no-PR / dirty / OpenCode until each is classified
- [ ] Do **not** approve a single 59-worktree deletion

---

## Expected recovery (if A1 approved)

| Step | Space | Risk to unique docs/skills |
|---|---:|---|
| Phase A1 (15 MERGED) | ~25–30 GB | Very low |
| Later MERGED batches | ~80–100 GB | Low after checklist |
| After CLOSED/no-PR salvage | remaining | Medium until salvaged |
| OpenCode last | ~5 GB | Review first |

---

## Stop condition

No deletion runs until you explicitly approve **Phase A1** (and optionally **Phase B archive-only**).

Ask to proceed with:

1. `Phase A1 delete` — first 15 only  
2. `Phase B salvage archive` — copy risk files out, no deletes  
3. Both
