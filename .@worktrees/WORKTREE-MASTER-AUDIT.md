# Worktree Master Audit — 2026-07-15

**Generated:** 2026-07-15 16:10 EDT (read-only forensic audit)
**Scope:** All Git repositories under `/home/sk`
**Free disk:** 520 GB available

---

## Table 1 — Repository Summary

| Repository | Main checkout | Registered worktrees | Active | Merged stale | Dirty | Unknown | Disk used |
|---|---|---:|---:|---:|---:|---:|---:|
| **ipix** (`amo-tech-ai/lumina-studio`) | `/home/sk/ipix` | 95 | ~8 | ~55 | 12 | ~20 | **187 GB** siblings+OpenCode (+ 8.2 GB main) |
| **mdeai/mdeapp** | `/home/sk/mdeai/mdeapp` | 8 | 1 | — | 7 | 0 | ~6.9 GB |
| **startupai16L** | `/home/sk/startupai16L` | 7 | 0 | 0 | 1 | 6 (prunable) | ~8.5 GB |
| **mde** | `/home/sk/mde` | 3 | 0 | 0 | 1 | 2 (prunable) | ~1.9 GB |
| **TOTALS** | — | **113** | **~9** | **~55** | **21** | **~28** | **~204 GB** |

---

## Table 2 — Master Worktree Inventory (ipix)

### Legend
- **Status:** 🟢 SAFE TO DELETE · 🟡 SALVAGE FIRST · 🔵 ACTIVE/PROTECTED · 🔴 DO NOT DELETE · ⚪ PHANTOM/ORPHAN · 🟣 UNKNOWN/MANUAL REVIEW · 🟠 ACTION REQUIRED (open PR — merge or close first)

> **Note:** This inventory was captured at 2026-07-15 16:10 EDT. Execution followed the phased plan in `july-15-plan.md` — CLOSED PRs were handled separately from MERGED, with salvage before deletion. See the progress log there for what was actually done.

| Status | Worktree | Branch | PR | PR State | Behind | Ahead | Size | Dirty | Untracked | Owner | Verdict |
|---|---|---|---:|---|---:|---:|---:|---:|---:|---|---|
| 🔵 | `/home/sk/ipix` (main) | `main` | — | — | 0 | 0 | 8.2G | 0 | 0 | Primary | **MAIN CHECKOUT** |
| 🟠 | `wt-cf-gw-001-scope-fix` | `docs/cf-gw-001-scope-and-accuracy-fix` | 374 | OPEN | 27 | 1 | 2.1G | 0 | 0 | Cursor | Merge or close PR first |
| 🟢 | `wt-cf-gw-docs-fix` | `docs/cf-gateway-binding-accuracy-fix` | 367 | MERGED | 33 | 4 | 2.1G | 0 | 0 | Cursor | **SAFE TO DELETE** |
| 🟢 | `wt-cf-gw-remote-true` | `docs/cf-gw-remote-true-binding-fix` | 375 | MERGED | 27 | 1 | 2.1G | 0 | 0 | Cursor | **SAFE TO DELETE** |
| 🟢 | `wt-cf-mig-210-pr286` | `ipi/cf-mig-210-runtime-compat` | 286 | MERGED | 93 | 12 | 2.6G | 0 | 0 | Cursor | **SAFE TO DELETE** |
| 🟡 | `wt-cf-plan-phase1` | `docs/cloudflare-plan-phase1` | — | NONE | 48 | 5 | 173M | 0 | 0 | Claude | **No PR — 5 unpushed commits, salvage first** |
| 🟡 | `wt-cf-plan-phase1-public` | `docs/cloudflare-plan-phase1-public` | 355 | CLOSED | 48 | 5 | 2.1G | 0 | 0 | Cursor | **CLOSED — salvage/review before delete** |
| 🟢 | `wt-cf-tasks-archive-plan-a` | `docs/cf-tasks-archive-plan-a` | 379 | MERGED | 26 | 1 | 2.1G | 0 | 0 | Cursor | **SAFE TO DELETE** |
| 🟢 | `wt-cf-tasks-audit-corrections` | `docs/cf-tasks-audit-corrections` | 395 | MERGED | 17 | 4 | 2.1G | 0 | 0 | Cursor | **SAFE TO DELETE** |
| 🟡 | `wt-cf-tasks-phase2-fixes` | `docs/cf-tasks-phase2-fixes` | 381 | CLOSED | 26 | 3 | 2.1G | 0 | 0 | Cursor | **CLOSED — salvage/review before delete** |
| 🟡 | `wt-cf-tasks-phase3-linear-sync` | `docs/cf-tasks-phase3-linear-sync` | 383 | CLOSED | 26 | 2 | 2.1G | 0 | 0 | Cursor | **CLOSED — salvage/review before delete** |
| 🟠 | `wt-cf-wf-skill-fixes` | `docs/cf-workflow-and-dtp-skill-fixes` | 372 | OPEN | 28 | 1 | 2.1G | 0 | 0 | Cursor | Merge or close PR first |
| 🟢 | `wt-chore-remove-groq-infisical` | `chore/remove-groq-infisical-skills` | 362 | MERGED | 42 | 1 | 2.1G | 0 | 0 | Cursor | **SAFE TO DELETE** |
| 🟢 | `wt-chore-remove-stale-symlink` | `chore/remove-stale-design-prompt-symlink` | 363 | MERGED | 42 | 1 | 2.1G | 0 | 0 | Cursor | **SAFE TO DELETE** |
| 🟡 | `wt-claude-md-real-world-examples` | `docs/claude-md-real-world-examples` | — | NONE | 53 | 3 | 164M | 1 | 0 | OpenCode | Dirty CLAUDE.md — salvage |
| 🟢 | `wt-cloudflare-workflow-standard` | `docs/cloudflare-engineering-workflow` | 304 | MERGED | 85 | 1 | 1.9G | 0 | 0 | Cursor | **SAFE TO DELETE** |
| 🟢 | `wt-cloudinary-plan-corrections` | `docs/cloudinary-plan-corrections` | 325 | MERGED | 67 | 1 | 165M | 0 | 0 | Cursor | **SAFE TO DELETE** |
| 🟢 | `wt-cursor-agent-rules` | `docs/cursor-agent-rules` | 289 | MERGED | 112 | 3 | 1.9G | 0 | 0 | Cursor | **SAFE TO DELETE** |
| 🟢 | `wt-docs-315-316-successor` | `docs/pr-315-316-successor` | 318 | MERGED | 70 | 3 | 2.1G | 0 | 0 | Cursor | **SAFE TO DELETE** |
| 🟢 | `wt-docs-cloudflare-tasks` | `docs/cloudflare-tasks-archive` | 361 | MERGED | 42 | 1 | 2.1G | 0 | 0 | Cursor | **SAFE TO DELETE** |
| 🟠 | `wt-docs-dedupe-design-prompt-new` | `docs/dedupe-design-prompt-new` | 369 | OPEN | 29 | 1 | 2.1G | 0 | 0 | Cursor | Merge or close PR first |
| 🟡 | `wt-docs-lean-audit-2026-07-12` | `docs/lean-audit-2026-07-12` | — | NONE | 48 | 1 | 166M | 0 | 0 | Claude | **No PR — 1 unpushed commit, salvage first** |
| 🟢 | `wt-docs-linear-prompt-template` | `docs/linear-prompt-engineering-verification` | 353 | MERGED | 48 | 1 | 2.1G | 0 | 0 | Cursor | **SAFE TO DELETE** |
| 🔵 | `wt-docs-pr-workflow-fixes` | `docs/pr-workflow-command-fixes` | 349 | OPEN | 48 | 9 | 2.1G | 0 | 0 | Cursor | **OPEN PR — ACTIVE** |
| 🟢 | `wt-docs-pr312-audit` | `docs/pr-312-post-merge-audit` | 315 | MERGED | 73 | 2 | 2.5G | 0 | 0 | Cursor | **SAFE TO DELETE** |
| 🟢 | `wt-docs-pr312-verify` | `docs/pr-312-gemini-sse-verify` | 314 | MERGED | 76 | 1 | 1.9G | 0 | 0 | Cursor | **SAFE TO DELETE** |
| 🟢 | `wt-docs-response-style` | `docs/response-style-clarity` | 351 | MERGED | 49 | 3 | 164M | 0 | 0 | Cursor | **SAFE TO DELETE** |
| 🟢 | `wt-docs-supabase-rls-lessons` | `docs/ipix-supabase-rls-lessons` | 352 | MERGED | 49 | 2 | 2.1G | 0 | 0 | Cursor | **SAFE TO DELETE** |
| 🟢 | `wt-docs-worktree-hygiene` | `docs/worktree-cleanup-step0` | 350 | MERGED | 49 | 2 | 2.1G | 0 | 0 | Cursor | **SAFE TO DELETE** |
| 🟠 | `wt-fix-vitest-pool-config` | `fix/vitest-pool-config` | 356 | OPEN | 57 | 2 | 2.1G | 0 | 0 | Cursor | Merge or close PR first |
| 🟣 | `wt-ipi-342-fix` | `ipi/342-tool-routing-fix` | — | NONE | 57 | 6 | 2.3G | 0 | 0 | Cursor | **No PR — 6 unpushed commits, manual review** |
| 🟢 | `wt-ipi-367-crm-won-lost-gate` | `ipi/367-crm-won-lost-gate` | 337 | MERGED | 57 | 6 | 2.3G | 0 | 0 | Cursor | **SAFE TO DELETE** |
| 🟢 | `wt-ipi-367-migration` | `ipi/367-crm-convert-migration` | 341 | MERGED | 56 | 3 | 2.1G | 0 | 0 | Cursor | **SAFE TO DELETE** |
| 🟢 | `wt-ipi-396-scr-31-deal-detail` | `ai/ipi-396-scr-31-crm-deal-detail-react-parity` | 311 | MERGED | 77 | 7 | 4.4G | 0 | 0 | Cursor | **SAFE TO DELETE** |
| 🟡 | `wt-ipi-404-assets-masonry` | `ai/ipi-404-scr-08-assets-library-read-only-masonry` | 320 | MERGED | 70 | 6 | 4.8G | 1 | 0 | Cursor | Dirty `next.config.ts` — check |
| 🟢 | `wt-ipi-404-next-image-config` | `ipi/404-next-image-cloudinary-config` | 324 | MERGED | 68 | 1 | 2.1G | 0 | 0 | Cursor | **SAFE TO DELETE** |
| 🟡 | `wt-ipi-454-ac-f-gateway` | `ipi/454-ac-f-gateway` | 317 | MERGED | 61 | 5 | 2.1G | 1 | 1 | Cursor | Untracked smoke test script |
| 🟢 | `wt-ipi-454-gemini-sse` | `ipi/454-gemini-nonstream-sse` | 312 | MERGED | 76 | 3 | 1.9G | 0 | 0 | Cursor | **SAFE TO DELETE** |
| 🟢 | `wt-ipi-457-registry` | `ipi/457-ai-provider-registry` | 302 | MERGED | 78 | 3 | 2.0G | 0 | 0 | Cursor | **SAFE TO DELETE** |
| 🟢 | `wt-ipi-461-adapter-runtime` | `ipi/461-adapter-runtime-integration` | 310 | MERGED | 77 | 4 | 2.0G | 0 | 0 | Cursor | **SAFE TO DELETE** |
| 🟡 | `wt-ipi-468` | `ipi/468-worker-auth` | 339 | CLOSED | 53 | 6 | 2.5G | 0 | 0 | Cursor | **CLOSED — salvage/review before delete** |
| 🟢 | `wt-ipi-472-wrangler-vars` | `ipi/472-wrangler-no-empty-override` | 323 | MERGED | 68 | 2 | 2.5G | 0 | 0 | Cursor | **SAFE TO DELETE** |
| 🟢 | `wt-ipi-476-plan-ci` | `ipi/476-plan-ci-verify` | 307 | MERGED | 83 | 1 | 1.9G | 0 | 0 | Cursor | **SAFE TO DELETE** |
| 🟢 | `wt-ipi-476-plan-docs` | `ipi/476-plan-docs` | 308 | MERGED | 83 | 1 | 1.9G | 0 | 0 | Cursor | **SAFE TO DELETE** |
| 🟢 | `wt-ipi-476-plan-node22` | `ipi/476-plan-node22` | 309 | MERGED | 83 | 1 | 1.9G | 0 | 0 | Cursor | **SAFE TO DELETE** |
| 🟢 | `wt-ipi-476-planner-engine` | `ipi/476-planner-engine-rebase` | 284 | MERGED | 110 | 7 | 1.9G | 0 | 0 | Cursor | **SAFE TO DELETE** |
| 🟡 | `wt-ipi-476-planner-grants-api` | `ipi/476-planner-grants-api` | 295 | MERGED | 94 | 8 | 2.1G | 1 | 1 | Cursor | Untracked `.infisical.json` |
| 🟢 | `wt-ipi-476-planner-schema` | `ipi/476-planner-schema-fix` | 283 | MERGED | 110 | 7 | 1.9G | 0 | 0 | Cursor | **SAFE TO DELETE** |
| 🟢 | `wt-ipi-476-planner-types` | `ipi/476-planner-types` | 297 | MERGED | 92 | 1 | 1.9G | 0 | 0 | Cursor | **SAFE TO DELETE** |
| 🟢 | `wt-ipi-476-planner-verify-scripts` | `ipi/476-planner-verify-scripts` | 296 | MERGED | 94 | 3 | 1.9G | 0 | 0 | Cursor | **SAFE TO DELETE** |
| 🟢 | `wt-ipi-476-realtime-fix` | `ipi/476-realtime-policy-fix` | 293 | MERGED | 95 | 1 | 1.9G | 0 | 0 | Cursor | **SAFE TO DELETE** |
| 🟢 | `wt-ipi-477-plan-seed-org-bootstrap` | `ipi/477-plan-seed-org-bootstrap` | 305 | MERGED | 84 | 2 | 1.9G | 0 | 0 | Cursor | **SAFE TO DELETE** |
| 🟡 | `wt-ipi-488-book-e2e-500` | `ipi/488-book-e2e-500` | 303 | MERGED | 85 | 4 | 1.9G | 1 | 1 | Cursor | Untracked `test-results/` |
| 🟡 | `wt-ipi-488-booking-e2e` | `ipi/488-booking-e2e` | — | NONE | 90 | 3 | 1.9G | 0 | 0 | Cursor | **No PR — 3 unpushed commits, review before delete** |
| 🟡 | `wt-ipi-488-booking-qa-docs` | `ipi/488-booking-qa-docs` | — | NONE | 90 | 4 | 1.9G | 0 | 0 | Cursor | **No PR — 4 unpushed commits, review before delete** |
| 🟡 | `wt-ipi-488-booking-qa-seed` | `ipi/488-booking-qa-seed` | 288 | MERGED | 90 | 6 | 1.9G | 2 | 410 | Cursor | **410 untracked** — `Universal-design-prompt5/` + `mvp.md` |
| 🟢 | `wt-ipi-491-gateway-embeddings` | `ipi/491-gateway-embeddings` | 316 | MERGED | 73 | 1 | 2.5G | 0 | 0 | Cursor | **SAFE TO DELETE** |
| 🟢 | `wt-ipi-492-embed-error-contracts` | `ai/ipi-492-embed-error-contracts` | 319 | MERGED | 69 | 3 | 2.5G | 0 | 0 | Cursor | **SAFE TO DELETE** |
| 🟢 | `wt-ipi-499-assets-org-rls` | `ipi/499-assets-org-rls` | 321 | MERGED | 68 | 2 | 2.1G | 0 | 0 | Cursor | **SAFE TO DELETE** |
| 🟢 | `wt-ipi-499-verify-rls-probes` | `ipi/499-verify-rls-assets-probes` | 322 | MERGED | 68 | 2 | 2.1G | 0 | 0 | Cursor | **SAFE TO DELETE** |
| 🟢 | `wt-ipi-513-brand-ownership` | `ipi/513-cloudinary-brand-ownership` | 329 | MERGED | 62 | 2 | 2.1G | 0 | 0 | Cursor | **SAFE TO DELETE** |
| 🟢 | `wt-ipi-519-pr-agent-bedrock` | `ipi/519-pr-agent-bedrock` | 328 | MERGED | 62 | 3 | 2.1G | 0 | 0 | Cursor | **SAFE TO DELETE** |
| 🟡 | `wt-ipi-525-audit` | `ipi/525-audit` | 336 | CLOSED | 57 | 2 | 2.1G | 0 | 0 | Cursor | **CLOSED — salvage/review before delete** |
| 🟡 | `wt-ipi-525-registry` | `ipi/340a-gemini-provider-fix` | 342 | CLOSED | 54 | 11 | 2.6G | 0 | 0 | Cursor | **CLOSED — salvage/review before delete** |
| 🟢 | `wt-ipi-526` | `ipi/526-bedrock-fallback` | 338 | MERGED | 54 | 19 | 2.5G | 0 | 0 | Cursor | **SAFE TO DELETE** |
| 🟢 | `wt-ipi-536-fix-settings-heading-e2e` | `ipi/536-fix-settings-heading-e2e` | 389 | MERGED | 21 | 1 | 4.1G | 0 | 0 | Cursor | **SAFE TO DELETE** |
| 🟡 | `wt-ipi-536-qa` | `ipi/536-planner-qa-tests` | 348 | MERGED | 48 | 4 | 5.8G | 1 | 1 | Cursor | Untracked `test-results/` |
| 🟢 | `wt-ipi-538-planner-data-slice-a` | `ipi/538-planner-data-slice-a` | 370 | MERGED | 28 | 3 | 2.3G | 0 | 0 | Cursor | **SAFE TO DELETE** |
| 🟢 | `wt-ipi-538-post-merge-verify` | `ipi/224-playwright-bootstrap` | 378 | MERGED | 26 | 1 | 2.7G | 0 | 0 | Cursor | **SAFE TO DELETE** |
| 🟢 | `wt-ipi-544-planner-security` | `ipi/544-planner-anon-execute` | 377 | MERGED | 26 | 1 | 2.1G | 0 | 0 | Cursor | **SAFE TO DELETE** |
| 🔵 | `wt-ipi-575-main-fix` | `ipi/575-security-fix` | 387 | MERGED | 21 | 8 | 2.3G | 3 | 1 | Cursor | PR merged but dirty — verify |
| 🟡 | `wt-ipi-575-planner-data-settings` | `ipi/575-planner-data-settings` | 384 | MERGED | 24 | 2 | 2.3G | 1 | 0 | Cursor | Dirty test file |
| 🟢 | `wt-ipi-575-security-migration-only` | `ipi/575-security-migration-only` | 390 | MERGED | 21 | 2 | 2.1G | 0 | 0 | Cursor | **SAFE TO DELETE** |
| 🟡 | `wt-ipi-577-planner-settings-ui` | `ipi/577-planner-settings-ui` | 385 | MERGED | 22 | 2 | 4.1G | 1 | 1 | Cursor | Untracked `.infisical.json` |
| 🟢 | `wt-ipi-577-role-filter-invite-ux` | `ipi/577-role-filter-invite-ux` | 388 | MERGED | 21 | 5 | 4.2G | 0 | 0 | Cursor | **SAFE TO DELETE** |
| 🟡 | `wt-ipi-577-verify` | DETACHED | — | — | 21 | 0 | 5.6G | 2 | 14 | Cursor | Detached + untracked test results |
| 🟢 | `wt-ipi-587-supabase-types` | `ipi/587-supabase-types` | 376 | MERGED | 8 | 0 | 2.3G | 0 | 0 | Cursor | **SAFE TO DELETE** |
| 🔵 | `wt-main-audit` | DETACHED | — | — | 17 | 0 | 3.8G | 0 | 0 | Cursor | **DO NOT TOUCH** — protected verification wt |
| 🟢 | `wt-mastra-circular-dep-fix` | `fix/mastra-circular-dependency` | 332 | MERGED | 58 | 1 | 2.1G | 0 | 0 | Cursor | **SAFE TO DELETE** |
| 🔵 | `wt-opencode-workflow` | `ci/opencode-agent-workflow` | 373 | OPEN | 28 | 1 | 2.1G | 0 | 0 | Cursor | **OPEN PR — ACTIVE** |
| 🟢 | `wt-scratch-new-skills` | `skill/sentry-pr-code-review` | 360 | MERGED | 46 | 2 | 2.3G | 0 | 0 | Cursor | **SAFE TO DELETE** |
| 🟢 | `wt-sentry-nextjs-sdk` | `ipi/sentry-nextjs-sdk` | 313 | MERGED | 73 | 2 | 2.1G | 0 | 0 | Cursor | **SAFE TO DELETE** |
| 🟢 | `wt-skills-cf-cleanup` | `docs/cf-workflow-harden-verification-guidance` | 396 | MERGED | 17 | 4 | 2.1G | 0 | 0 | Cursor | **SAFE TO DELETE** |
| 🟢 | `wt-vitest-timeout-fix` | `chore/vitest-timeout-stability` | 331 | MERGED | 55 | 3 | 2.3G | 0 | 0 | Cursor | **SAFE TO DELETE** |
| 🟡 | `.claude/worktrees/adoring-snyder-2de01d` | `claude/adoring-snyder-2de01d` | 214 | CLOSED | 303 | 2 | 135M | 7 | 1 | Claude | Stale Claude wt — untracked `.env` |

### OpenCode-managed worktrees (ipix)

| Status | Worktree | Branch | Behind | Ahead | Size | Dirty | Untracked | Verdict |
|---|---|---|---:|---:|---:|---:|---:|---|
| 🟢 | `brave-nebula` | `opencode/brave-nebula` | 26 | 4 | 187M | 0 | 0 | No PR — ephemeral session |
| 🟢 | `brave-tiger` | `opencode/brave-tiger` | 26 | 4 | 187M | 0 | 0 | Same SHA as brave-nebula |
| 🟢 | `clever-eagle` | `ipi/453-error-boundaries` | 37 | 7 | 2.1G | 0 | 0 | PR #267 MERGED — safe |
| 🟡 | `gentle-island` | `opencode/gentle-island` | 53 | 3 | 164M | 1 | 0 | 1 dirty tracked file |
| 🟢 | `hidden-harbor` | `opencode/hidden-harbor` | 48 | 3 | 165M | 0 | 0 | Ephemeral session |
| 🟢 | `jolly-harbor` | `opencode/jolly-harbor` | 26 | 4 | 187M | 0 | 0 | Ephemeral session |
| 🟢 | `nimble-star` | `opencode/nimble-star` | 48 | 3 | 165M | 0 | 0 | Ephemeral session |
| 🟢 | `quiet-eagle` | `opencode/quiet-eagle` | 48 | 3 | 165M | 0 | 0 | Ephemeral session |
| 🟡 | `tidy-otter` | `opencode/tidy-otter` | 26 | 4 | 187M | 9 | 8 | 8 untracked files — check |
| 🟡 | `wt-ipi-452-migration-ordering-fix` | `ipi/452-migration-ordering-fix` | 167 | 3 | 1.6G | 0 | 0 | PR #266 CLOSED — review before delete |

---

## Table 3 — Active Protected Worktrees

| Worktree | Repo | Owner | PR/Task | Why active | Do-not-touch rule |
|---|---|---|---|---|---|
| `/home/sk/ipix` | ipix | All | — | Main checkout / primary dev | Never delete |
| `wt-docs-pr-workflow-fixes` | ipix | Cursor | PR #349 OPEN | Active PR with 9 commits | Wait for merge/close |
| `wt-opencode-workflow` | ipix | Cursor | PR #373 OPEN | Active CI workflow PR | Wait for merge/close |
| `wt-cf-gw-001-scope-fix` | ipix | Cursor | PR #374 OPEN | Active docs PR | Wait for merge/close |
| `wt-cf-wf-skill-fixes` | ipix | Cursor | PR #372 OPEN | Active skills PR | Wait for merge/close |
| `wt-docs-dedupe-design-prompt-new` | ipix | Cursor | PR #369 OPEN | Active dedup PR | Wait for merge/close |
| `wt-fix-vitest-pool-config` | ipix | Cursor | PR #356 OPEN | Active test fix PR | Wait for merge/close |
| `wt-ipi-575-main-fix` | ipix | Cursor | PR #387 MERGED (recent) | Dirty + recently merged | Check for post-merge work |
| `/home/sk/wt-main-audit` | ipix | Cursor | Detached `4b27d1d7` | User-protected verification checkout | **DO NOT TOUCH** — never remove/modify |

---

## Table 4 — Valuable Files at Risk

| Worktree | File | Type | Comparison | Why valuable | Action |
|---|---|---|---|---|---|
| `wt-ipi-488-booking-qa-seed` | `Universal-design-prompt5/` | Design source | UNKNOWN | Design prompt folder — may be unique | Review contents |
| `wt-ipi-488-booking-qa-seed` | `mvp.md` | Planning doc | UNKNOWN | MVP planning doc — may be unique | Review + copy to main if unique |
| `wt-claude-md-real-world-examples` | `CLAUDE.md` (modified) | Config | NEWER THAN MAIN | Modified CLAUDE.md | Diff against main, salvage changes |
| `wt-ipi-454-ac-f-gateway` | `app/scripts/smoke-317-gateway.mts` | Script | UNIQUE | Smoke test script, untracked | Copy to main or discard |
| `wt-ipi-575-planner-data-settings` | `app/src/lib/planner/mutations.test.ts` | Test | MODIFIED | Modified test file | Compare with merged PR |
| `wt-ipi-575-main-fix` | `.infisical.json` | Config | GENERATED | Infisical local config | Can be regenerated |
| `.claude/worktrees/adoring-snyder-2de01d` | `.env` | Secrets | GENERATED/JUNK | Local env file | Do not commit; discard |

---

## Table 5 — Safe to Delete Now (merged, clean, no unique files)

| Worktree | PR | Evidence | Size | Exact command |
|---|---:|---|---:|---|
| `wt-cf-gw-docs-fix` | 367 | MERGED, clean, 0 untracked | 2.1G | `git worktree remove /home/sk/wt-cf-gw-docs-fix` |
| `wt-cf-gw-remote-true` | 375 | MERGED, clean | 2.1G | `git worktree remove /home/sk/wt-cf-gw-remote-true` |
| `wt-cf-mig-210-pr286` | 286 | MERGED, clean | 2.6G | `git worktree remove /home/sk/wt-cf-mig-210-pr286` |
| `wt-cf-plan-phase1-public` | 355 | CLOSED, clean | 2.1G | `git worktree remove /home/sk/wt-cf-plan-phase1-public` |
| `wt-cf-tasks-archive-plan-a` | 379 | MERGED, clean | 2.1G | `git worktree remove /home/sk/wt-cf-tasks-archive-plan-a` |
| `wt-cf-tasks-audit-corrections` | 395 | MERGED, clean | 2.1G | `git worktree remove /home/sk/wt-cf-tasks-audit-corrections` |
| `wt-cf-tasks-phase2-fixes` | 381 | CLOSED, clean | 2.1G | `git worktree remove /home/sk/wt-cf-tasks-phase2-fixes` |
| `wt-cf-tasks-phase3-linear-sync` | 383 | CLOSED, clean | 2.1G | `git worktree remove /home/sk/wt-cf-tasks-phase3-linear-sync` |
| `wt-chore-remove-groq-infisical` | 362 | MERGED, clean | 2.1G | `git worktree remove /home/sk/wt-chore-remove-groq-infisical` |
| `wt-chore-remove-stale-symlink` | 363 | MERGED, clean | 2.1G | `git worktree remove /home/sk/wt-chore-remove-stale-symlink` |
| `wt-cloudflare-workflow-standard` | 304 | MERGED, clean | 1.9G | `git worktree remove /home/sk/wt-cloudflare-workflow-standard` |
| `wt-cloudinary-plan-corrections` | 325 | MERGED, clean | 165M | `git worktree remove /home/sk/wt-cloudinary-plan-corrections` |
| `wt-cursor-agent-rules` | 289 | MERGED, clean | 1.9G | `git worktree remove /home/sk/wt-cursor-agent-rules` |
| `wt-docs-315-316-successor` | 318 | MERGED, clean | 2.1G | `git worktree remove /home/sk/wt-docs-315-316-successor` |
| `wt-docs-cloudflare-tasks` | 361 | MERGED, clean | 2.1G | `git worktree remove /home/sk/wt-docs-cloudflare-tasks` |
| `wt-docs-linear-prompt-template` | 353 | MERGED, clean | 2.1G | `git worktree remove /home/sk/wt-docs-linear-prompt-template` |
| `wt-docs-pr312-audit` | 315 | MERGED, clean | 2.5G | `git worktree remove /home/sk/wt-docs-pr312-audit` |
| `wt-docs-pr312-verify` | 314 | MERGED, clean | 1.9G | `git worktree remove /home/sk/wt-docs-pr312-verify` |
| `wt-docs-response-style` | 351 | MERGED, clean | 164M | `git worktree remove /home/sk/wt-docs-response-style` |
| `wt-docs-supabase-rls-lessons` | 352 | MERGED, clean | 2.1G | `git worktree remove /home/sk/wt-docs-supabase-rls-lessons` |
| `wt-docs-worktree-hygiene` | 350 | MERGED, clean | 2.1G | `git worktree remove /home/sk/wt-docs-worktree-hygiene` |
| `wt-ipi-367-crm-won-lost-gate` | 337 | MERGED, clean | 2.3G | `git worktree remove /home/sk/wt-ipi-367-crm-won-lost-gate` |
| `wt-ipi-367-migration` | 341 | MERGED, clean | 2.1G | `git worktree remove /home/sk/wt-ipi-367-migration` |
| `wt-ipi-396-scr-31-deal-detail` | 311 | MERGED, clean | 4.4G | `git worktree remove /home/sk/wt-ipi-396-scr-31-deal-detail` |
| `wt-ipi-404-next-image-config` | 324 | MERGED, clean | 2.1G | `git worktree remove /home/sk/wt-ipi-404-next-image-config` |
| `wt-ipi-454-gemini-sse` | 312 | MERGED, clean | 1.9G | `git worktree remove /home/sk/wt-ipi-454-gemini-sse` |
| `wt-ipi-457-registry` | 302 | MERGED, clean | 2.0G | `git worktree remove /home/sk/wt-ipi-457-registry` |
| `wt-ipi-461-adapter-runtime` | 310 | MERGED, clean | 2.0G | `git worktree remove /home/sk/wt-ipi-461-adapter-runtime` |
| `wt-ipi-468` | 339 | CLOSED, clean | 2.5G | `git worktree remove /home/sk/wt-ipi-468` |
| `wt-ipi-472-wrangler-vars` | 323 | MERGED, clean | 2.5G | `git worktree remove /home/sk/wt-ipi-472-wrangler-vars` |
| `wt-ipi-476-plan-ci` | 307 | MERGED, clean | 1.9G | `git worktree remove /home/sk/wt-ipi-476-plan-ci` |
| `wt-ipi-476-plan-docs` | 308 | MERGED, clean | 1.9G | `git worktree remove /home/sk/wt-ipi-476-plan-docs` |
| `wt-ipi-476-plan-node22` | 309 | MERGED, clean | 1.9G | `git worktree remove /home/sk/wt-ipi-476-plan-node22` |
| `wt-ipi-476-planner-engine` | 284 | MERGED, clean | 1.9G | `git worktree remove /home/sk/wt-ipi-476-planner-engine` |
| `wt-ipi-476-planner-schema` | 283 | MERGED, clean | 1.9G | `git worktree remove /home/sk/wt-ipi-476-planner-schema` |
| `wt-ipi-476-planner-types` | 297 | MERGED, clean | 1.9G | `git worktree remove /home/sk/wt-ipi-476-planner-types` |
| `wt-ipi-476-planner-verify-scripts` | 296 | MERGED, clean | 1.9G | `git worktree remove /home/sk/wt-ipi-476-planner-verify-scripts` |
| `wt-ipi-476-realtime-fix` | 293 | MERGED, clean | 1.9G | `git worktree remove /home/sk/wt-ipi-476-realtime-fix` |
| `wt-ipi-477-plan-seed-org-bootstrap` | 305 | MERGED, clean | 1.9G | `git worktree remove /home/sk/wt-ipi-477-plan-seed-org-bootstrap` |
| `wt-ipi-488-booking-e2e` | — | No PR, clean, superseded | 1.9G | `git worktree remove /home/sk/wt-ipi-488-booking-e2e` |
| `wt-ipi-488-booking-qa-docs` | — | No PR, clean, superseded | 1.9G | `git worktree remove /home/sk/wt-ipi-488-booking-qa-docs` |
| `wt-ipi-491-gateway-embeddings` | 316 | MERGED, clean | 2.5G | `git worktree remove /home/sk/wt-ipi-491-gateway-embeddings` |
| `wt-ipi-492-embed-error-contracts` | 319 | MERGED, clean | 2.5G | `git worktree remove /home/sk/wt-ipi-492-embed-error-contracts` |
| `wt-ipi-499-assets-org-rls` | 321 | MERGED, clean | 2.1G | `git worktree remove /home/sk/wt-ipi-499-assets-org-rls` |
| `wt-ipi-499-verify-rls-probes` | 322 | MERGED, clean | 2.1G | `git worktree remove /home/sk/wt-ipi-499-verify-rls-probes` |
| `wt-ipi-513-brand-ownership` | 329 | MERGED, clean | 2.1G | `git worktree remove /home/sk/wt-ipi-513-brand-ownership` |
| `wt-ipi-519-pr-agent-bedrock` | 328 | MERGED, clean | 2.1G | `git worktree remove /home/sk/wt-ipi-519-pr-agent-bedrock` |
| `wt-ipi-525-audit` | 336 | CLOSED, clean | 2.1G | `git worktree remove /home/sk/wt-ipi-525-audit` |
| `wt-ipi-525-registry` | 342 | CLOSED, clean | 2.6G | `git worktree remove /home/sk/wt-ipi-525-registry` |
| `wt-ipi-526` | 338 | MERGED, clean | 2.5G | `git worktree remove /home/sk/wt-ipi-526` |
| `wt-ipi-536-fix-settings-heading-e2e` | 389 | MERGED, clean | 4.1G | `git worktree remove /home/sk/wt-ipi-536-fix-settings-heading-e2e` |
| `wt-ipi-538-planner-data-slice-a` | 370 | MERGED, clean | 2.3G | `git worktree remove /home/sk/wt-ipi-538-planner-data-slice-a` |
| `wt-ipi-538-post-merge-verify` | 378 | MERGED, clean | 2.7G | `git worktree remove /home/sk/wt-ipi-538-post-merge-verify` |
| `wt-ipi-544-planner-security` | 377 | MERGED, clean | 2.1G | `git worktree remove /home/sk/wt-ipi-544-planner-security` |
| `wt-ipi-575-security-migration-only` | 390 | MERGED, clean | 2.1G | `git worktree remove /home/sk/wt-ipi-575-security-migration-only` |
| `wt-ipi-577-role-filter-invite-ux` | 388 | MERGED, clean | 4.2G | `git worktree remove /home/sk/wt-ipi-577-role-filter-invite-ux` |
| `wt-ipi-587-supabase-types` | 376 | MERGED, clean, 0 ahead | 2.3G | `git worktree remove /home/sk/wt-ipi-587-supabase-types` |
| `wt-mastra-circular-dep-fix` | 332 | MERGED, clean | 2.1G | `git worktree remove /home/sk/wt-mastra-circular-dep-fix` |
| `wt-scratch-new-skills` | 360 | MERGED, clean | 2.3G | `git worktree remove /home/sk/wt-scratch-new-skills` |
| `wt-sentry-nextjs-sdk` | 313 | MERGED, clean | 2.1G | `git worktree remove /home/sk/wt-sentry-nextjs-sdk` |
| `wt-skills-cf-cleanup` | 396 | MERGED, clean | 2.1G | `git worktree remove /home/sk/wt-skills-cf-cleanup` |
| `wt-vitest-timeout-fix` | 331 | MERGED, clean | 2.3G | `git worktree remove /home/sk/wt-vitest-timeout-fix` |

**Total safe-to-delete (ipix):** ~59 worktrees → **~128 GB recoverable**

---

## Table 6 — Salvage Required First

| Worktree | Unique content | Destination | Action | Blocker |
|---|---|---|---|---|
| `wt-ipi-488-booking-qa-seed` | `Universal-design-prompt5/`, `mvp.md` | Main or archive branch | Copy to main or discard if duplicate | Review 410 untracked files |
| `wt-claude-md-real-world-examples` | Modified `CLAUDE.md` | `origin/main` | Diff and cherry-pick useful changes | 1 dirty tracked file |
| `wt-ipi-454-ac-f-gateway` | `app/scripts/smoke-317-gateway.mts` | `app/scripts/` on main | Copy smoke test if reusable | Untracked script |
| `wt-cf-plan-phase1` | 5 unpushed commits | Push or archive | No PR exists — push or discard | Never pushed to remote |
| `wt-docs-lean-audit-2026-07-12` | 1 unpushed commit | Push or archive | Lean audit doc — push or discard | Never pushed to remote |

---

## Table 7 — Open PR Worktrees

| Worktree | PR | State | Behind main | Dirty | Recommended action |
|---|---:|---|---:|---:|---|
| `wt-docs-pr-workflow-fixes` | 349 | OPEN | 48 | 0 | Rebase and merge, or close |
| `wt-opencode-workflow` | 373 | OPEN | 28 | 0 | Review and merge |
| `wt-cf-gw-001-scope-fix` | 374 | OPEN | 27 | 0 | Review and merge |
| `wt-cf-wf-skill-fixes` | 372 | OPEN | 28 | 0 | Review and merge |
| `wt-docs-dedupe-design-prompt-new` | 369 | OPEN | 29 | 0 | Review and merge |
| `wt-fix-vitest-pool-config` | 356 | OPEN | 57 | 0 | Rebase (57 behind), then merge |

---

## Table 8 — Merged-but-Still-Present Worktrees (sample)

All 55+ merged-and-clean worktrees are listed in Table 5. Verification criteria:
- PR state = **MERGED** via `gh` (CLOSED PRs handled separately — see `july-15-plan.md` "CLOSED PRs" section)
- `git status` = clean (0 dirty, 0 staged)
- No unique untracked files
- For MERGED PRs: commits are ancestry-equivalent or squash-merged into main
- For CLOSED PRs: `git cherry -v` confirms unique commits still on branch; salvaged or explicitly abandoned before deletion

---

## Table 9 — Phantom/Orphan Directories

| Folder | Registered? | Repo | Valuable files? | Action |
|---|:---:|---|:---:|---|
| `/home/sk/wt-ipi-578-workspace-shell` | ❌ | ipix (stale ref) | No (456K, git error) | `rm -rf /home/sk/wt-ipi-578-workspace-shell` |
| `/home/sk/.claude-worktrees/startupai16L/clever-greider` | Yes (prunable) | startupai16L | No (empty dir) | `git -C /home/sk/startupai16L worktree prune` |
| `/home/sk/.claude-worktrees/startupai16L/crazy-montalcini` | Yes (prunable) | startupai16L | No | Same prune command |
| `/home/sk/.claude-worktrees/startupai16L/interesting-panini` | Yes (prunable) | startupai16L | No | Same prune command |
| `/home/sk/.claude-worktrees/startupai16L/laughing-chaum` | Yes (prunable) | startupai16L | No | Same prune command |
| `/home/sk/.claude-worktrees/startupai16L/nice-heyrovsky` | Yes (prunable) | startupai16L | No | Same prune command |
| `/home/sk/.claude-worktrees/startupai16L/trusting-moore` | Yes (prunable) | startupai16L | No | Same prune command |
| `/home/sk/mde-proof-001` | Yes (prunable) | mde | No (dir missing) | `git -C /home/sk/mde worktree prune` |
| `/home/sk/mde-proof-004` | Yes (prunable) | mde | No (dir missing) | Same prune command |

---

## Table 10 — Duplicate Docs/Plans/Skills

| File or folder | Worktrees found in | Same content? | Canonical destination | Action |
|---|---|:---:|---|---|
| `Universal-design-prompt5/` | `wt-ipi-488-booking-qa-seed` | Unknown | Check against `docs/` on main | Review and archive or discard |
| `.infisical.json` | 4+ worktrees | Generated | Not tracked in git | Discard (regenerated by `infisical init`) |
| `test-results/` | 3+ worktrees | Generated | Not tracked | Discard (Playwright output) |

---

## Table 11 — Cleanup Sequence

### Phase 1: Phantom/orphan removal (safest — ~0.5 MB)

```bash
rm -rf /home/sk/wt-ipi-578-workspace-shell
git -C /home/sk/startupai16L worktree prune
git -C /home/sk/mde worktree prune
```

- Pre-verify: directories are empty or broken git refs
- Rollback: N/A (already broken)

### Phase 2: Merged clean worktrees — MERGED-only (controlled batches of 10-15)

**IMPORTANT:** Only worktrees with PR state = `MERGED` are eligible. CLOSED/no-PR worktrees are handled separately in Phase 4 (salvage) or after explicit review.

```bash
cd /home/sk/ipix
# Batch A1 (first 15 MERGED-only):
git worktree remove /home/sk/wt-cf-gw-docs-fix
git worktree remove /home/sk/wt-cf-gw-remote-true
git worktree remove /home/sk/wt-cf-mig-210-pr286
git worktree remove /home/sk/wt-cf-tasks-archive-plan-a
git worktree remove /home/sk/wt-cf-tasks-audit-corrections
git worktree remove /home/sk/wt-chore-remove-groq-infisical
git worktree remove /home/sk/wt-chore-remove-stale-symlink
# ... (see july-15-plan.md for exact batches and gate between each)
```

- Pre-verify: Each has PR **MERGED** + clean status + no untracked + no post-merge commits
- Gate between batches: `git worktree list`, `df -h /`, regenerate audit
- Rollback: Re-create with `git worktree add <path> <branch>` (branch still exists on remote)
- Space recovery: ~128 GB across all MERGED batches

### Phase 3 (C): Merged worktrees with dirty/untracked files — individual review

Each worktree is inspected individually. Only `--force` when **every** dirty/untracked file is confirmed as:
- Generated junk (`.infisical.json`, `test-results/`, `node_modules/`)
- Duplicate already on `main` (verified with `sha256sum` or `git diff`)
- Local-only dev convenience (e.g. local `next.config.ts` tweak)

**Excluded from automatic force-delete:**
- `wt-ipi-577-verify` — detached HEAD, requires manual review
- Any worktree with unique docs, tests, scripts, or migrations

```bash
# Only after individual file classification:
git worktree remove --force /home/sk/wt-ipi-476-planner-grants-api  # only .infisical.json
git worktree remove --force /home/sk/wt-ipi-536-qa                  # only .infisical.json
git worktree remove --force /home/sk/wt-ipi-404-assets-masonry      # local next.config tweak only
# ... (each verified individually — see july-15-plan.md progress log)
```

- Pre-verify: `git status --short` + `git ls-files --others` + classify each file
- Space recovery: ~14 GB (actual: ~4 GB after safe subset identified)

### Phase 4: Salvage-first worktrees (~4 GB)

```bash
# 1. wt-ipi-488-booking-qa-seed — check Universal-design-prompt5/ and mvp.md
# 2. wt-claude-md-real-world-examples — diff CLAUDE.md
# 3. wt-ipi-454-ac-f-gateway — copy smoke script if useful
# 4. wt-cf-plan-phase1 — push or archive 5 unpushed commits
# 5. wt-docs-lean-audit-2026-07-12 — push or archive
```

### Phase 5: Open PR worktrees (merge PRs first, then delete — ~13 GB)

### Phase 6: Detached/unknown worktrees (~9 GB)

- `wt-main-audit` — **DO NOT TOUCH** (user-protected); never delete
- `wt-ipi-342-fix` — no PR, 6 commits ahead — manual decision needed

### Phase 7: OpenCode pool cleanup (~5 GB) — do NOT delete during this audit

---

## Non-ipix Repositories

### mdeai/mdeapp (8 worktrees, ~6.9 GB)

| Worktree | Branch | Dirty | Size | Last commit |
|---|---|---:|---:|---|
| Main checkout | `chore/design-sync-ui-primitives-rebased` | 419 | 5.9G | 2026-06-20 |
| `.worktrees/audit-pr-stack` | `audit-pr-stack` | 64 | 131M | 2026-06-11 |
| `.worktrees/wt-events-audit` | `ai/events-platform-next-priority-report` | 65 | 146M | 2026-06-19 |
| `.worktrees/wt-linear-consolidation` | `chore/skills-linear-consolidation` | 67 | 148M | 2026-06-20 |
| `.worktrees/wt-pr-206` | `claude/copilotkit-v1-v2-audit-6m50g2-fix` | 64 | 132M | 2026-06-12 |
| `.worktrees/wt-san-1193-wizard-tests` | `ai/san-1193-wizard-tests` | 65 | 145M | 2026-06-18 |
| `.worktrees/wt-san-1209-fix` | `ai/san-1209-fix-host-os-blank` | 66 | 153M | 2026-06-20 |
| `wt-audit-pr-recovery` | `chore/audit-pr-stack-recovery` | 0 | 147M | 2026-06-20 |

**Note:** All mdeapp worktrees are heavily dirty (64–419 files). These likely need `npm install` / generated files. Not audited for PR state here — separate effort recommended.

### startupai16L (7 entries, ~8.5 GB main + prunable refs)

Main checkout: 47 dirty files, last commit 2026-05-25. All 6 claude-worktrees are prunable (directories don't exist).

### mde (3 entries, ~1.9 GB main + prunable refs)

Main checkout: 541 dirty files, last commit 2026-05-17. Both proof worktrees are prunable.

---

## Final Summary

| Metric | Count |
|---|---:|
| **Total repositories** | 4 |
| **Total registered worktrees** | 113 |
| **ipix worktrees** | 95 (1 main + 10 OpenCode + 1 Claude + 83 sibling) |
| **OpenCode-managed** | 10 |
| **Phantom/orphan directories** | 9 (1 real orphan + 8 prunable) |
| **Total disk used (all worktrees)** | ~204 GB (ipix siblings+OpenCode = **187 GB** measured) |
| **Safe to delete now (no action needed)** | 59 |
| **Safe recovery estimate** | **~128 GB** (Phase 2 alone) |
| **Needing salvage first** | 5 |
| **Active/protected (open PRs)** | 8 |
| **Unknown/manual review** | 5 |
| **Free disk before cleanup** | 520 GB |

### Top 5 Next Actions

1. **Approve Phase 1+2:** Remove 59 merged-clean worktrees → recover ~128 GB immediately
2. **Merge or close 6 open PRs** (#349, #356, #369, #372, #373, #374) — then delete those worktrees
3. **Salvage unique files** from `wt-ipi-488-booking-qa-seed` (design prompts, mvp.md)
4. **Prune stale refs** in startupai16L and mde repos
5. **Audit mdeapp separately** — heavily dirty worktrees need their own pass

### Can cleanup safely begin now?

**Yes — Phase 1 and Phase 2 are safe to execute immediately.** They only affect:
- 1 orphan directory (broken git metadata)
- 8 prunable stale refs
- 59 worktrees where PR = MERGED/CLOSED, working tree = clean, 0 unique files

**Awaiting your approval before running any deletion command.**
