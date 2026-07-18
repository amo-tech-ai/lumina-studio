# Git Worktree Cleanup Audit — Jul 18, 2026

> **Repo:** amo-tech-ai/lumina-studio · **Baseline:** `84ea702e` on `origin/main`
> **Scope:** 34 ipix worktrees under `/home/sk/` + 1 mdeai worktree noted at bottom
> **Critical:** Disk **100% full** (843G/888G). Deleting P1 worktrees recovers ~7.4 GB immediately.

## Master Table

| Priority | Worktree | Branch | Status | PR | Merge Status | Last Commit | Unique Work | Recommendation | Reason |
|----------|----------|--------|--------|----|--------------|-------------|-------------|----------------|--------|
| P1 | `~/wt-main-audit` | `(detached)` | ✅ Safe to delete now | — | Detached at ancestor (? behind tip) | 4b27d1d7 fix(e2e): correct stale Settings heading asser | None | Delete immediately | Detached at merged ancestor, clean |
| P1 | `~/.local/share/opencode/worktree/cc069a3b0ed1b529e9b2b2c710709bd01d775004/clever-eagle` | `ipi/453-error-boundaries` | ✅ Safe to delete now | #267 MERGED | Diverged history only — no file diff (510 ahead) | 4c624865 Merge branch 'main' into ipi/453-error-boundar | History diverged — no unique file diff | Delete immediately | PR #267 merged, clean, no diff |
| P1 | `~/.local/share/opencode/worktree/cc069a3b0ed1b529e9b2b2c710709bd01d775004/wt-ipi-452-migration-ordering-fix` | `ipi/452-migration-ordering-fix` | ✅ Safe to delete now | #266 CLOSED | Diverged history only — no file diff (376 ahead) | bfca4803 fix(ipi-452): rename migration to run after ty | History diverged — no unique file diff | Delete immediately | Agent scratch — no unique diff |
| P1 | `~/ipix/.claude/worktrees/ecstatic-yalow-77f0dc` | `claude/ecstatic-yalow-77f0dc` | ✅ Safe to delete now | — | Merged into main (50 behind) | db3da805 docs(audit): correct IPI-649 status and push j | None | Delete immediately | Merged to main, no diff |
| P1 | `~/.local/share/opencode/worktree/cc069a3b0ed1b529e9b2b2c710709bd01d775004/hidden-harbor` | `opencode/hidden-harbor` | ✅ Safe to delete now | — | Diverged history only — no file diff (495 ahead) | 424957aa docs(cf-wf): Correct Workers size limits and D | History diverged — no unique file diff | Delete immediately | Agent scratch — no unique diff |
| P1 | `~/.local/share/opencode/worktree/cc069a3b0ed1b529e9b2b2c710709bd01d775004/nimble-star` | `opencode/nimble-star` | ✅ Safe to delete now | — | Diverged history only — no file diff (495 ahead) | 424957aa docs(cf-wf): Correct Workers size limits and D | History diverged — no unique file diff | Delete immediately | Agent scratch — no unique diff |
| P1 | `~/.local/share/opencode/worktree/cc069a3b0ed1b529e9b2b2c710709bd01d775004/quiet-eagle` | `opencode/quiet-eagle` | ✅ Safe to delete now | — | Diverged history only — no file diff (495 ahead) | 424957aa docs(cf-wf): Correct Workers size limits and D | History diverged — no unique file diff | Delete immediately | Agent scratch — no unique diff |
| P2 | `~/wt-ipi-512-cld-qa-fixtures` | `ipi/512-cld-qa-fixtures` | 🟡 Merge or salvage first | — | Merged into main (121 behind) | 06661f08 fix(app-build): remove orphaned eslint-disable | None | Stash/copy uncommitted, then delete | 9 meaningful uncommitted on merged/stale tree |
| P2 | `~/wt-ipi-653-instance-creation-app` | `main` | 🟡 Merge or salvage first | — | Merged into main (31 behind) | 4dbcb320 IPI-685 · SB-EDGE-002 — capture_lead_write RPC | None | Stash/copy uncommitted, then delete | 1 meaningful uncommitted on merged/stale tree |
| P2 | `~/wt-audit-jul17-main` | `(detached)` | 🟡 Merge or salvage first | — | Detached at ancestor (? behind tip) | 2b7c3ed5 feat(ipi-653): PLN-DATA-003 — planner_create_i | None | Stash/copy uncommitted, then delete | 22 meaningful uncommitted on merged/stale tree |
| P2 | `~/wt-ipi-685-capture-lead-harden` | `ipi/685-capture-lead-harden` | 🟡 Merge or salvage first | #450 MERGED | 7 files changed, 776 insertions(+), 351 deletions(-); 3 | cad6ce9f fix(ipi-685): rate-limit capture-lead by clien | 7 files changed, 776 insertions(+), 351 deletions(-) · cad6ce9f fix(ipi-685): rate-limit capture-lea | Stash/copy uncommitted, then delete | 1 meaningful uncommitted on merged/stale tree |
| P2 | `~/wt-ipi-664-hygiene` | `verify-main-664` | 🟡 Merge or salvage first | — | Merged into main (58 behind) | 9adb16b9 IPI-664 · SB-HYGIENE-001 — Align migration fil | None | Stash/copy uncommitted, then delete | 1 meaningful uncommitted on merged/stale tree |
| P2 | `~/wt-ipi-670-enforce-complete-phases` | `ipi/670-enforce-complete-phases` | 🟡 Merge or salvage first | #430 MERGED | 5 files changed, 768 insertions(+), 15 deletions(-); 56 | fa4c3c2b fix(ipi-670): require positive task/phase coun | 5 files changed, 768 insertions(+), 15 deletions(-) · fa4c3c2b fix(ipi-670): require positive task/p | Stash/copy uncommitted, then delete | 1 meaningful uncommitted on merged/stale tree |
| P2 | `~/wt-ipi-490-workers-mastra-storage-noop` | `ipi/490-workers-mastra-storage-noop` | 🟡 Merge or salvage first | — | 3 files changed, 93 insertions(+), 3 deletions(-); 124  | 38654ff5 fix(ipi-490): skip PostgresStore on Workers to | 3 files changed, 93 insertions(+), 3 deletions(-) · 38654ff5 fix(ipi-490): skip PostgresStore on Wor | Cherry-pick or open PR | 3 files differ from main, no PR |
| P2 | `~/wt-ipi-665-sb-ci-gates` | `ipi/665-sb-ci-gates` | 🟡 Merge or salvage first | #431 MERGED | 7 files changed, 492 insertions(+), 16 deletions(-); 54 | 3c6f6ac6 fix(ipi-665): reject migration mutations; pin  | 7 files changed, 492 insertions(+), 16 deletions(-) · 3c6f6ac6 fix(ipi-665): reject migration mutati | Stash/copy uncommitted, then delete | 2 meaningful uncommitted on merged/stale tree |
| P2 | `~/.local/share/opencode/worktree/cc069a3b0ed1b529e9b2b2c710709bd01d775004/tidy-otter` | `opencode/tidy-otter` | 🟡 Merge or salvage first | — | 4 files changed, 248 insertions(+), 9 deletions(-); 152 | a232165e Configure OpenCode GitHub agent with Z.AI (5 d | 4 files changed, 248 insertions(+), 9 deletions(-) · a232165e Configure OpenCode GitHub agent with Z | Cherry-pick or open PR | 4 files differ from main, no PR |
| P2 | `~/.local/share/opencode/worktree/cc069a3b0ed1b529e9b2b2c710709bd01d775004/brave-nebula` | `opencode/brave-nebula` | 🟡 Merge or salvage first | — | 4 files changed, 248 insertions(+), 9 deletions(-); 152 | a232165e Configure OpenCode GitHub agent with Z.AI (5 d | 4 files changed, 248 insertions(+), 9 deletions(-) · a232165e Configure OpenCode GitHub agent with Z | Cherry-pick or open PR | 4 files differ from main, no PR |
| P2 | `~/.local/share/opencode/worktree/cc069a3b0ed1b529e9b2b2c710709bd01d775004/jolly-harbor` | `opencode/jolly-harbor` | 🟡 Merge or salvage first | — | 4 files changed, 248 insertions(+), 9 deletions(-); 152 | a232165e Configure OpenCode GitHub agent with Z.AI (5 d | 4 files changed, 248 insertions(+), 9 deletions(-) · a232165e Configure OpenCode GitHub agent with Z | Cherry-pick or open PR | 4 files differ from main, no PR |
| P2 | `~/.local/share/opencode/worktree/cc069a3b0ed1b529e9b2b2c710709bd01d775004/brave-tiger` | `opencode/brave-tiger` | 🟡 Merge or salvage first | — | 4 files changed, 248 insertions(+), 9 deletions(-); 152 | a232165e Configure OpenCode GitHub agent with Z.AI (5 d | 4 files changed, 248 insertions(+), 9 deletions(-) · a232165e Configure OpenCode GitHub agent with Z | Cherry-pick or open PR | 4 files differ from main, no PR |
| P2 | `~/wt-docs-restore-prd` | `docs/restore-platform-prd` | 🟡 Merge or salvage first | — | Merged into main (55 behind) | b6da2733 IPI-670 · PLN-DATA-003B — Enforce complete wor | None | Stash/copy uncommitted, then delete | 3 meaningful uncommitted on merged/stale tree |
| P2 | `~/wt-pr427` | `pr-427` | 🟡 Merge or salvage first | — | 9 files changed, 1200 insertions(+), 4 deletions(-); 60 | 24b39684 test(ipi-653): live RLS probes for planner_cre | 9 files changed, 1200 insertions(+), 4 deletions(-) · 24b39684 test(ipi-653): live RLS probes for pl | Cherry-pick or open PR | 9 files differ from main, no PR |
| P2 | `~/wt-ipi-342-fix` | `ipi/342-tool-routing-fix` | 🟡 Merge or salvage first | — | Diverged history only — no file diff (493 ahead) | 5f0a3dcc docs(IPI-525): Add comprehensive evidence and  | History diverged — no unique file diff | Stash/copy uncommitted, then delete | 10 meaningful uncommitted on merged/stale tree |
| P2 | `~/wt-claude-md-real-world-examples` | `docs/claude-md-real-world-examples` | 🟡 Merge or salvage first | — | Diverged history only — no file diff (490 ahead) | c84c31dd docs(cf-wf): Correct Workers size limits and D | History diverged — no unique file diff | Stash/copy uncommitted, then delete | 1 meaningful uncommitted on merged/stale tree |
| P2 | `~/.local/share/opencode/worktree/cc069a3b0ed1b529e9b2b2c710709bd01d775004/gentle-island` | `opencode/gentle-island` | 🟡 Merge or salvage first | — | Diverged history only — no file diff (490 ahead) | c84c31dd docs(cf-wf): Correct Workers size limits and D | History diverged — no unique file diff | Stash/copy uncommitted, then delete | 1 meaningful uncommitted on merged/stale tree |
| P3 | `~/ipix` | `fix/cf-secrets-classification` | 🔴 Active — keep | #475 OPEN | 33 files changed, 6594 insertions(+), 113 deletions(-); | ecacd90d checkpoint before checking out fix/cf-secrets- | 33 files changed, 6594 insertions(+), 113 deletions(-) · ecacd90d checkpoint before checking out fix | Keep — primary checkout | Main repo on active branch fix/cf-secrets-classification (#475) |
| P3 | `~/wt-ipi-650-planner-hub` | `ai/ipi-650-planner-hub-create-flow` | 🔴 Active — keep | #474 OPEN | 13 files changed, 1220 insertions(+), 39 deletions(-);  | 54d611de feat(IPI-650): Create Planner Instance Flow —  | 13 files changed, 1220 insertions(+), 39 deletions(-) · 54d611de feat(IPI-650): Create Planner Insta | Finish open PR | Open PR #474 |
| P3 | `~/wt-ipi-304-approvalcard` | `ai/ipi-304-approvalcard-shell` | 🔴 Active — keep | #472 OPEN | 14 files changed, 659 insertions(+), 172 deletions(-);  | 02698a87 feat(IPI-304): de-fork ApprovalCard into share | 14 files changed, 659 insertions(+), 172 deletions(-) · 02698a87 feat(IPI-304): de-fork ApprovalCard | Finish open PR | Open PR #472 |
| P3 | `~/wt-ipi-692-webhook-idempotent` | `ipi/692-webhook-claim-edge` | 🔴 Active — keep | #477 OPEN | 5 files changed, 647 insertions(+), 106 deletions(-); 0 | 38ffdb9b fix(ipi-692): retryable Firecrawl webhook clai | 5 files changed, 647 insertions(+), 106 deletions(-) · 38ffdb9b fix(ipi-692): retryable Firecrawl we | Finish open PR | Open PR #477 |
| P3 | `~/wt-opencode-workflow` | `ci/opencode-agent-workflow` | 🔴 Active — keep | #373 OPEN | Diverged history only — no file diff (513 ahead) | 1a0ca861 ci(opencode): add OpenCode GitHub agent workfl | History diverged — no unique file diff | Finish open PR | Open PR #373 |
| P3 | `~/wt-docs-pr-workflow-fixes` | `docs/pr-workflow-command-fixes` | 🔴 Active — keep | #349 OPEN | Diverged history only — no file diff (501 ahead) | b329bd4e fix(claude): align pre-PR review hard rule wit | History diverged — no unique file diff | Finish open PR | Open PR #349 |
| P3 | `~/wt-fix-vitest-pool-config` | `fix/vitest-pool-config` | 🔴 Active — keep | #356 OPEN | Diverged history only — no file diff (493 ahead) | 59fd466b fix(test): cap Vitest workers via forks pool,  | History diverged — no unique file diff | Finish open PR | Open PR #356 |
| P4 | `~/wt-ipi-525-registry` | `ipi/340a-gemini-provider-fix` | ⚪ Review manually | #342 CLOSED | **No merge base** with main (orphan branch) | 7bcf1acf fix(IPI-525): Route tool-bearing requests to t | Orphan history — diff unavailable | Delete if branch abandoned | Closed PR #342; clean tree; 2.6G mostly node_modules |
| P4 | `~/wt-ipi-525-audit` | `ipi/525-audit` | ⚪ Review manually | #336 CLOSED | **No merge base** with main (orphan branch) | f636af3c docs(IPI-525): Correct audit doc — 96%→70%, re | Orphan history — diff unavailable | Delete if branch abandoned | Closed PR #336; clean tree |
| P4 | `~/wt-docs-lean-audit-2026-07-12` | `docs/lean-audit-2026-07-12` | ⚪ Review manually | — | **No merge base** with main (orphan branch) | eae41186 docs(lean): record 2026-07-12 dev-speed audit  | Orphan history — diff unavailable | Delete if branch abandoned | Clean tree; lean audit likely superseded |

## Content Flags by Worktree

| Worktree | Size | Dirty (non-gen) | Content Types |
|----------|------|-----------------|---------------|
| `~/wt-main-audit` | 3.8G | 0 | — |
| `~/.local/share/opencode/worktree/cc069a3b0ed1b529e9b2b2c710709bd01d775004/clever-eagle` | 2.1G | 0 | Merged PR |
| `~/.local/share/opencode/worktree/cc069a3b0ed1b529e9b2b2c710709bd01d775004/wt-ipi-452-migration-ordering-fix` | 1.6G | 0 | Closed PR |
| `~/ipix/.claude/worktrees/ecstatic-yalow-77f0dc` | 174M | 0 | — |
| `~/.local/share/opencode/worktree/cc069a3b0ed1b529e9b2b2c710709bd01d775004/hidden-harbor` | 165M | 0 | — |
| `~/.local/share/opencode/worktree/cc069a3b0ed1b529e9b2b2c710709bd01d775004/nimble-star` | 165M | 0 | — |
| `~/.local/share/opencode/worktree/cc069a3b0ed1b529e9b2b2c710709bd01d775004/quiet-eagle` | 165M | 0 | — |
| `~/wt-ipi-512-cld-qa-fixtures` | 3.2G | 9 | Production code, Tests, Uncommitted code |
| `~/wt-ipi-653-instance-creation-app` | 2.3G | 1 | Uncommitted code |
| `~/wt-audit-jul17-main` | 2.3G | 22 | AI prompts, Documentation, Planning documents, Uncommitted code |
| `~/wt-ipi-685-capture-lead-harden` | 2.2G | 1 | Committed but unmerged code, Config changes, Merged PR, Production code, Tests, Uncommitted code |
| `~/wt-ipi-664-hygiene` | 2.2G | 1 | Uncommitted code |
| `~/wt-ipi-670-enforce-complete-phases` | 2.1G | 1 | Committed but unmerged code, Merged PR, Migrations, Production code, Scripts, Tests, Uncommitted code |
| `~/wt-ipi-490-workers-mastra-storage-noop` | 2.1G | 2 | Committed but unmerged code, Config changes, Production code, Tests, Uncommitted code |
| `~/wt-ipi-665-sb-ci-gates` | 2.1G | 2 | Committed but unmerged code, GitHub workflows, Merged PR, Migrations, Production code, Scripts, Tests, Uncommitted code |
| `~/.local/share/opencode/worktree/cc069a3b0ed1b529e9b2b2c710709bd01d775004/tidy-otter` | 188M | 18 | Committed but unmerged code, Documentation, GitHub workflows, Linear tasks, Skills, Uncommitted code |
| `~/.local/share/opencode/worktree/cc069a3b0ed1b529e9b2b2c710709bd01d775004/brave-nebula` | 187M | 0 | Committed but unmerged code, Documentation, GitHub workflows, Skills |
| `~/.local/share/opencode/worktree/cc069a3b0ed1b529e9b2b2c710709bd01d775004/jolly-harbor` | 187M | 0 | Committed but unmerged code, Documentation, GitHub workflows, Skills |
| `~/.local/share/opencode/worktree/cc069a3b0ed1b529e9b2b2c710709bd01d775004/brave-tiger` | 187M | 0 | Committed but unmerged code, Documentation, GitHub workflows, Skills |
| `~/wt-docs-restore-prd` | 172M | 3 | Documentation, PRDs, Uncommitted code |
| `~/wt-pr427` | 172M | 0 | Committed but unmerged code, Migrations, Production code, Scripts, Tests |
| `~/wt-ipi-342-fix` | 168M | 10 | Documentation, Linear tasks, Uncommitted code |
| `~/wt-claude-md-real-world-examples` | 164M | 1 | Documentation, Uncommitted code |
| `~/.local/share/opencode/worktree/cc069a3b0ed1b529e9b2b2c710709bd01d775004/gentle-island` | 164M | 1 | Documentation, Uncommitted code |
| `~/ipix` | 11G | 4 | AI prompts, Committed but unmerged code, Config changes, Documentation, GitHub workflows, Linear tasks, Open PR, Planning documents, Tests, Uncommitted code |
| `~/wt-ipi-650-planner-hub` | 5.9G | 0 | Committed but unmerged code, Open PR, Production code, Tests |
| `~/wt-ipi-304-approvalcard` | 4.9G | 0 | Committed but unmerged code, Open PR, Production code, Tests |
| `~/wt-ipi-692-webhook-idempotent` | 2.2G | 1 | Committed but unmerged code, Migrations, Open PR, Production code, Tests, Uncommitted code |
| `~/wt-opencode-workflow` | 2.1G | 0 | Open PR |
| `~/wt-docs-pr-workflow-fixes` | 2.1G | 0 | Open PR |
| `~/wt-fix-vitest-pool-config` | 2.1G | 0 | Open PR |
| `~/wt-ipi-525-registry` | 2.6G | 0 | Closed PR |
| `~/wt-ipi-525-audit` | 2.1G | 0 | Closed PR |
| `~/wt-docs-lean-audit-2026-07-12` | 166M | 0 | — |

## Priority 1 — Delete Immediately

**7 worktrees** · ~7.4 GB recoverable

- `~/wt-main-audit` · `(detached)` · **3.8G** — Detached at merged ancestor, clean
  ```bash
  git worktree remove "/home/sk/wt-main-audit"
  ```
- `~/.local/share/opencode/worktree/cc069a3b0ed1b529e9b2b2c710709bd01d775004/clever-eagle` · `ipi/453-error-boundaries` · **2.1G** — PR #267 merged, clean, no diff
  ```bash
  git worktree remove "/home/sk/.local/share/opencode/worktree/cc069a3b0ed1b529e9b2b2c710709bd01d775004/clever-eagle"
  ```
- `~/.local/share/opencode/worktree/cc069a3b0ed1b529e9b2b2c710709bd01d775004/wt-ipi-452-migration-ordering-fix` · `ipi/452-migration-ordering-fix` · **1.6G** — Agent scratch — no unique diff
  ```bash
  git worktree remove "/home/sk/.local/share/opencode/worktree/cc069a3b0ed1b529e9b2b2c710709bd01d775004/wt-ipi-452-migration-ordering-fix"
  ```
- `~/ipix/.claude/worktrees/ecstatic-yalow-77f0dc` · `claude/ecstatic-yalow-77f0dc` · **174M** — Merged to main, no diff
  ```bash
  git worktree remove "/home/sk/ipix/.claude/worktrees/ecstatic-yalow-77f0dc"
  ```
- `~/.local/share/opencode/worktree/cc069a3b0ed1b529e9b2b2c710709bd01d775004/hidden-harbor` · `opencode/hidden-harbor` · **165M** — Agent scratch — no unique diff
  ```bash
  git worktree remove "/home/sk/.local/share/opencode/worktree/cc069a3b0ed1b529e9b2b2c710709bd01d775004/hidden-harbor"
  ```
- `~/.local/share/opencode/worktree/cc069a3b0ed1b529e9b2b2c710709bd01d775004/nimble-star` · `opencode/nimble-star` · **165M** — Agent scratch — no unique diff
  ```bash
  git worktree remove "/home/sk/.local/share/opencode/worktree/cc069a3b0ed1b529e9b2b2c710709bd01d775004/nimble-star"
  ```
- `~/.local/share/opencode/worktree/cc069a3b0ed1b529e9b2b2c710709bd01d775004/quiet-eagle` · `opencode/quiet-eagle` · **165M** — Agent scratch — no unique diff
  ```bash
  git worktree remove "/home/sk/.local/share/opencode/worktree/cc069a3b0ed1b529e9b2b2c710709bd01d775004/quiet-eagle"
  ```

## Priority 2 — Salvage then Delete

**17 worktrees**

### `~/wt-ipi-512-cld-qa-fixtures` · `ipi/512-cld-qa-fixtures` · 3.2G
- 9 meaningful uncommitted on merged/stale tree
- **Uncommitted (9 files):** `git -C "/home/sk/wt-ipi-512-cld-qa-fixtures" stash push -u -m "salvage-wt-ipi-512-cld-qa-fixtures"`

### `~/wt-ipi-653-instance-creation-app` · `main` · 2.3G
- 1 meaningful uncommitted on merged/stale tree
- **Uncommitted (1 files):** `git -C "/home/sk/wt-ipi-653-instance-creation-app" stash push -u -m "salvage-wt-ipi-653-instance-creation-app"`

### `~/wt-audit-jul17-main` · `(detached)` · 2.3G
- 22 meaningful uncommitted on merged/stale tree
- **Uncommitted (22 files):** `git -C "/home/sk/wt-audit-jul17-main" stash push -u -m "salvage-wt-audit-jul17-main"`

### `~/wt-ipi-685-capture-lead-harden` · `ipi/685-capture-lead-harden` · 2.2G
- 1 meaningful uncommitted on merged/stale tree
- **Uncommitted (1 files):** `git -C "/home/sk/wt-ipi-685-capture-lead-harden" stash push -u -m "salvage-wt-ipi-685-capture-lead-harden"`
- **Committed diff (7 files vs main):** `git -C "/home/sk/wt-ipi-685-capture-lead-harden" diff origin/main...ipi/685-capture-lead-harden` — cherry-pick if needed

### `~/wt-ipi-664-hygiene` · `verify-main-664` · 2.2G
- 1 meaningful uncommitted on merged/stale tree
- **Uncommitted (1 files):** `git -C "/home/sk/wt-ipi-664-hygiene" stash push -u -m "salvage-wt-ipi-664-hygiene"`

### `~/wt-ipi-670-enforce-complete-phases` · `ipi/670-enforce-complete-phases` · 2.1G
- 1 meaningful uncommitted on merged/stale tree
- **Uncommitted (1 files):** `git -C "/home/sk/wt-ipi-670-enforce-complete-phases" stash push -u -m "salvage-wt-ipi-670-enforce-complete-phases"`
- **Committed diff (5 files vs main):** `git -C "/home/sk/wt-ipi-670-enforce-complete-phases" diff origin/main...ipi/670-enforce-complete-phases` — cherry-pick if needed

### `~/wt-ipi-490-workers-mastra-storage-noop` · `ipi/490-workers-mastra-storage-noop` · 2.1G
- 3 files differ from main, no PR
- **Uncommitted (2 files):** `git -C "/home/sk/wt-ipi-490-workers-mastra-storage-noop" stash push -u -m "salvage-wt-ipi-490-workers-mastra-storage-noop"`
- **Committed diff (3 files vs main):** `git -C "/home/sk/wt-ipi-490-workers-mastra-storage-noop" diff origin/main...ipi/490-workers-mastra-storage-noop` — cherry-pick if needed

### `~/wt-ipi-665-sb-ci-gates` · `ipi/665-sb-ci-gates` · 2.1G
- 2 meaningful uncommitted on merged/stale tree
- **Uncommitted (2 files):** `git -C "/home/sk/wt-ipi-665-sb-ci-gates" stash push -u -m "salvage-wt-ipi-665-sb-ci-gates"`
- **Committed diff (7 files vs main):** `git -C "/home/sk/wt-ipi-665-sb-ci-gates" diff origin/main...ipi/665-sb-ci-gates` — cherry-pick if needed

### `~/.local/share/opencode/worktree/cc069a3b0ed1b529e9b2b2c710709bd01d775004/tidy-otter` · `opencode/tidy-otter` · 188M
- 4 files differ from main, no PR
- **Uncommitted (18 files):** `git -C "/home/sk/.local/share/opencode/worktree/cc069a3b0ed1b529e9b2b2c710709bd01d775004/tidy-otter" stash push -u -m "salvage-tidy-otter"`
- **Committed diff (4 files vs main):** `git -C "/home/sk/.local/share/opencode/worktree/cc069a3b0ed1b529e9b2b2c710709bd01d775004/tidy-otter" diff origin/main...opencode/tidy-otter` — cherry-pick if needed

### `~/.local/share/opencode/worktree/cc069a3b0ed1b529e9b2b2c710709bd01d775004/brave-nebula` · `opencode/brave-nebula` · 187M
- 4 files differ from main, no PR
- **Committed diff (4 files vs main):** `git -C "/home/sk/.local/share/opencode/worktree/cc069a3b0ed1b529e9b2b2c710709bd01d775004/brave-nebula" diff origin/main...opencode/brave-nebula` — cherry-pick if needed

### `~/.local/share/opencode/worktree/cc069a3b0ed1b529e9b2b2c710709bd01d775004/jolly-harbor` · `opencode/jolly-harbor` · 187M
- 4 files differ from main, no PR
- **Committed diff (4 files vs main):** `git -C "/home/sk/.local/share/opencode/worktree/cc069a3b0ed1b529e9b2b2c710709bd01d775004/jolly-harbor" diff origin/main...opencode/jolly-harbor` — cherry-pick if needed

### `~/.local/share/opencode/worktree/cc069a3b0ed1b529e9b2b2c710709bd01d775004/brave-tiger` · `opencode/brave-tiger` · 187M
- 4 files differ from main, no PR
- **Committed diff (4 files vs main):** `git -C "/home/sk/.local/share/opencode/worktree/cc069a3b0ed1b529e9b2b2c710709bd01d775004/brave-tiger" diff origin/main...opencode/brave-tiger` — cherry-pick if needed

### `~/wt-docs-restore-prd` · `docs/restore-platform-prd` · 172M
- 3 meaningful uncommitted on merged/stale tree
- **Uncommitted (3 files):** `git -C "/home/sk/wt-docs-restore-prd" stash push -u -m "salvage-wt-docs-restore-prd"`

### `~/wt-pr427` · `pr-427` · 172M
- 9 files differ from main, no PR
- **Committed diff (9 files vs main):** `git -C "/home/sk/wt-pr427" diff origin/main...pr-427` — cherry-pick if needed

### `~/wt-ipi-342-fix` · `ipi/342-tool-routing-fix` · 168M
- 10 meaningful uncommitted on merged/stale tree
- **Uncommitted (10 files):** `git -C "/home/sk/wt-ipi-342-fix" stash push -u -m "salvage-wt-ipi-342-fix"`

### `~/wt-claude-md-real-world-examples` · `docs/claude-md-real-world-examples` · 164M
- 1 meaningful uncommitted on merged/stale tree
- **Uncommitted (1 files):** `git -C "/home/sk/wt-claude-md-real-world-examples" stash push -u -m "salvage-wt-claude-md-real-world-examples"`

### `~/.local/share/opencode/worktree/cc069a3b0ed1b529e9b2b2c710709bd01d775004/gentle-island` · `opencode/gentle-island` · 164M
- 1 meaningful uncommitted on merged/stale tree
- **Uncommitted (1 files):** `git -C "/home/sk/.local/share/opencode/worktree/cc069a3b0ed1b529e9b2b2c710709bd01d775004/gentle-island" stash push -u -m "salvage-gentle-island"`

## Priority 3 — Finish Open Work

**7 worktrees**

| `~/ipix` | #475 OPEN | 11G | ecacd90d checkpoint before checking out fix/cf-secrets-class |
| `~/wt-ipi-650-planner-hub` | #474 OPEN | 5.9G | 54d611de feat(IPI-650): Create Planner Instance Flow — New P |
| `~/wt-ipi-304-approvalcard` | #472 OPEN | 4.9G | 02698a87 feat(IPI-304): de-fork ApprovalCard into shared she |
| `~/wt-ipi-692-webhook-idempotent` | #477 OPEN | 2.2G | 38ffdb9b fix(ipi-692): retryable Firecrawl webhook claims be |
| `~/wt-opencode-workflow` | #373 OPEN | 2.1G | 1a0ca861 ci(opencode): add OpenCode GitHub agent workflow, h |
| `~/wt-docs-pr-workflow-fixes` | #349 OPEN | 2.1G | b329bd4e fix(claude): align pre-PR review hard rule with wor |
| `~/wt-fix-vitest-pool-config` | #356 OPEN | 2.1G | 59fd466b fix(test): cap Vitest workers via forks pool, not t |

## Priority 4 — Manual Review

**3 worktrees** (~4.9 GB if deleted after confirming branches are abandoned)

These branches share **no merge base** with current `origin/main` — git cannot three-dot diff them. All three are **clean** (0 uncommitted). Likely safe to delete unless you need the branch ref for archaeology.

- `~/wt-ipi-525-registry` · `ipi/340a-gemini-provider-fix` · #342 CLOSED · **2.6G**
- `~/wt-ipi-525-audit` · `ipi/525-audit` · #336 CLOSED · **2.1G**
- `~/wt-docs-lean-audit-2026-07-12` · `docs/lean-audit-2026-07-12` · no PR · **166M**

## Summary

| Metric | Value |
|--------|-------|
| **Total worktrees (ipix)** | 34 |
| **Safe to delete (P1)** | 7 (7 excl. main) |
| **Require salvage (P2)** | 17 |
| **Active (P3)** | 7 |
| **Manual review (P4)** | 3 |
| **Estimated disk recoverable (P1)** | ~7.4 GB |
| **Additional if P4 orphans deleted** | ~4.9 GB |
| **Additional if P2 salvaged then deleted** | ~25+ GB (mostly node_modules/.next) |

### Recommended deletion order (largest P1 first)

1. `~/wt-main-audit` — **3.8G** (Detached at merged ancestor, clean)
2. `~/.local/share/opencode/worktree/cc069a3b0ed1b529e9b2b2c710709bd01d775004/clever-eagle` — **2.1G** (PR #267 merged, clean, no diff)
3. `~/.local/share/opencode/worktree/cc069a3b0ed1b529e9b2b2c710709bd01d775004/wt-ipi-452-migration-ordering-fix` — **1.6G** (Agent scratch — no unique diff)
4. `~/ipix/.claude/worktrees/ecstatic-yalow-77f0dc` — **174M** (Merged to main, no diff)
5. `~/.local/share/opencode/worktree/cc069a3b0ed1b529e9b2b2c710709bd01d775004/hidden-harbor` — **165M** (Agent scratch — no unique diff)
6. `~/.local/share/opencode/worktree/cc069a3b0ed1b529e9b2b2c710709bd01d775004/nimble-star` — **165M** (Agent scratch — no unique diff)
7. `~/.local/share/opencode/worktree/cc069a3b0ed1b529e9b2b2c710709bd01d775004/quiet-eagle` — **165M** (Agent scratch — no unique diff)

### mdeai repo (separate)

| Worktree | Branch | Size | Dirty | Notes |
|----------|--------|------|-------|-------|
| `~/mdeai/wt-audit-pr-recovery` | `chore/audit-pr-stack-recovery` | 147M | 0 | Separate repo — not in ipix worktree list. Review independently. |
