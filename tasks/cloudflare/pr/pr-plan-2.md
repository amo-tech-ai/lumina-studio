# What to do with PRs #381, #382, and #383

---

## Execution status — 2026-07-15 — ✅ FULLY EXECUTED

1. `012-CF-TEST-verify-endpoints.md` → `012-CF-TEST-multi-turn-tool-calling.md` rename ported into `docs/cf-tasks-audit-corrections` (commit `871f7ce2`), pushed to PR #395. No internal references to the old filename found (`git grep` clean) — nothing else needed updating.
2. **#382 closed** with the prepared superseded-by-#395 comment.
3. **#383 closed** with the prepared duplicate/superseded comment.
4. **#381 closed** with the prepared superseded-by-#395 comment (filename rename preserved, so closing was safe).
5. Old branches (`docs/cf-tasks-phase2-fixes`, `docs/cf-tasks-phase3-linear-sync`) left in place, not deleted — correct per plan, since #395 hasn't merged yet.

**Verified 2026-07-15** against live GitHub state before filing: `gh pr view` confirms #381 (OPEN, mergeable, base `main`, head `docs/cf-tasks-phase2-fixes`, 12 files), #382 (OPEN, mergeable, base `docs/cf-tasks-phase2-fixes` — stacked on #381, head `docs/cf-tasks-phase3-linear-sync`, 4 files), #383 (OPEN, mergeable, base `main`, head `docs/cf-tasks-phase3-linear-sync` — same head as #382, retargeted, 11 files). Also confirmed: PR #395 still modifies (not renames) `tasks/cloudflare/Tasks/012-CF-TEST-verify-endpoints.md` — the `012` rename from #381 is genuinely not represented in #395.

## Recommended decision

| PR       | Action                                     | Reason                                                                                                 |
| -------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| **#381** | 🟡 Close **after one final content check** | Mostly superseded by #395, but it contains a filename rename not present in #395                       |
| **#382** | 🔴 Close as superseded                     | Stacked on #381 and its four corrections are already represented in #395                               |
| **#383** | 🔴 Close as duplicate/superseded           | Same head branch as #382, but retargeted to `main`; now obsolete because #395 is the clean replacement |

---

# PR-by-PR analysis

## PR #381 — Phase 2 task corrections

PR #381 is still open, mergeable, and contains 12 task-document files.

Most of its scope is included and expanded in PR #395:

* gateway headers;
* model setup;
* caching;
* rate limiting;
* spend limits;
* Dynamic Routing;
* retries;
* metadata;
* Guardrails;
* cleanup gating;
* Mastra migration ordering.

PR #395 modifies all of those main task files and adds broader corrections.

### One unique item to preserve

PR #381 renamed:

```text
012-CF-TEST-verify-endpoints.md
→
012-CF-TEST-multi-turn-tool-calling.md
```

PR #395 currently modifies the old filename:

```text
tasks/cloudflare/Tasks/012-CF-TEST-verify-endpoints.md
```

So the rename from #381 is **not currently represented in #395**.

### Decision for #381

Before closing it, choose one of these:

1. **Preferred:** apply the correct rename inside PR #395.
2. Keep the old filename intentionally and document that the rename is rejected.
3. Open a tiny follow-up rename-only PR.

The preferred correction is:

```bash
git mv \
  tasks/cloudflare/Tasks/012-CF-TEST-verify-endpoints.md \
  tasks/cloudflare/Tasks/012-CF-TEST-multi-turn-tool-calling.md
```

Then update links that reference the old path.

After that, close #381 as superseded by #395.

---

## PR #382 — Linear cross-link sync

PR #382:

* has one commit;
* changes four files;
* is stacked on the #381 branch instead of `main`;
* adds Linear links and fixes the `CF-MIG-220` → `CF-MIG-820` collision.

PR #395 already includes those same files:

* `002-CF-GW-configure-routing.md`
* `004-CF-AI-setup-models.md`
* `012-CF-TEST-verify-endpoints.md`
* `053-CF-MIGRATION-cleanup-custom-code.md`

PR #395's description explicitly states that it fixes the `CF-MIG-220` collision and applies the audit corrections.

### Decision for #382

Close it now as superseded by #395.

Suggested comment:

```markdown
Superseded by #395, which applies the Phase 2 and Phase 3 task-document corrections on a clean branch based directly on current `main`. The Linear cross-links, corrected cancellation claims, and `CF-MIG-820` ID fix are included there.
```

---

## PR #383 — duplicate combined PR

PR #383 uses:

```text
head: docs/cf-tasks-phase3-linear-sync
base: main
```

That is the same head branch used by #382, but #382 targets the Phase 2 branch.

PR #383 therefore combines the stacked #381 and #382 work into one direct-to-main PR. It contains 11 files and is currently not mergeable.

It has no reason to remain open now that PR #395 provides a clean one-commit replacement against current `main`.

### Decision for #383

Close it now as a duplicate and superseded PR.

Suggested comment:

```markdown
Superseded by #395. This PR combined the older stacked Phase 2/Phase 3 branches, while #395 carries the current audited corrections as one clean, focused commit based on current `main`.
```

---

# Correct cleanup order

| Order | Action                                                                 |
| ----: | ------------------------------------------------------------------------ |
|     1 | Compare PR #381's renamed `012` task against PR #395                   |
|     2 | Add the rename to #395 or explicitly decide to retain the old filename |
|     3 | Confirm #395 contains the final content from the four #382 files       |
|     4 | Close #382 as superseded                                               |
|     5 | Close #383 as duplicate/superseded                                     |
|     6 | Close #381 after the filename decision                                |
|     7 | Leave comments pointing to #395                                        |
|     8 | Delete old remote branches only after #395 merges                     |

---

# Should the old branches be deleted?

Not yet.

| Branch                             | Delete when                           |
| ----------------------------------- | ---------------------------------------- |
| `docs/cf-tasks-phase2-fixes`       | After #395 merges and #381 closes     |
| `docs/cf-tasks-phase3-linear-sync` | After #395 merges and #382/#383 close |

Keep them temporarily as forensic references. Once #395 is merged and verified, delete the remote branches to reduce branch clutter.

---

# Final status

| PR       |              Unique work remaining?             | Final action                         |
| -------- | :-----------------------------------------------: | --------------------------------------- |
| **#381** | 🟡 Filename rename only, possibly minor wording | Port/check, then close               |
| **#382** |                 🔴 None apparent                | Close now                             |
| **#383** |                 🔴 None apparent                | Close now                             |
| **#395** |              🟢 Current replacement             | Continue review and merge when green |

**Do not merge #381, #382, or #383. PR #395 should be the single source of truth, after preserving or intentionally rejecting the `012` filename rename.**
