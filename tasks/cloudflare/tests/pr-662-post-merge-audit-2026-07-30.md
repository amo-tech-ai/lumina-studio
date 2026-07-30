# Post-merge audit — PR #662

**Audit date:** 2026-07-30
**Merge commit:** `2feade8d545c530e7b508421bfa4ea83b4562203` (squash-merge to `main`, 2026-07-29)
**Post-merge review commit:** `4314e3bbd3898e828b5752a20a66abe43ba2d78f` — `docs(ipi-706): address review — historical labels, numbering, lint, full titles`
**Concern:** Docs-only

| PR | Title | IPI task | Concern |
|----|-------|----------|---------|
| [#662](https://github.com/amo-tech-ai/lumina-studio/pull/662) | **IPI-706 · CF-BUNDLE-220 — OpenNext Worker size audit (docs)** | [IPI-706 · CF-BUNDLE-220 — Restore OpenNext Worker Bundle Headroom](https://linear.app/amo100/issue/IPI-706) | Audit-only documentation of the Cloudflare Worker gzip-size fail-gate incident and remediation path |

---

## Purpose

Adds an evidence-backed forensic audit explaining why the OpenNext Cloudflare Worker crossed the iPix **9.0 MiB gzip** fail gate after PR #658 (Hyperdrive Mastra storage) landed, and documents the measured path back under **8.5 MiB**. Root cause: CopilotKit `/v2` barrel imports pulling Mermaid/Cytoscape/KaTeX into SSR chunks. Documents the fix that shipped separately (OpenNext build-time stubs for `mermaid`/`katex` in PR #663), with re-measured metafile evidence. This PR records history and guidance only — it does not implement, gate, or deploy anything itself.

---

## Files / systems changed

| Item | Result |
|------|--------|
| Files touched | 1 — `tasks/cloudflare/audits/2026-07-29-opennext-worker-size-optimization.md` (+355/-0) |
| Production code | **None** |
| CI / workflows | **None** |
| Fail gate (9.0 MiB) | **Unchanged** |
| One-concern discipline | ✅ docs-only, no code/config mixed in |

---

## Tests / CI results

| Check | Result |
|-------|--------|
| PR test-plan item: content matches measured gzip figures | Doc states **7.832 MiB** (stubbed build) and current `main` **7.806 MiB** @ `aae84bc0`, consistent with sibling PR #663/#664/#666 CI run [30499164983](https://github.com/amo-tech-ai/lumina-studio/actions/runs/30499164983) |
| PR test-plan item: no production files in diff | **Confirmed** — single markdown file only |
| Review pass (2nd commit) | Addressed 8 review threads: historical-status labels, section numbering, Markdown lint, full task/PR titles, stale-SSOT callout |
| `build:cf` / gzip gate | Not applicable to this PR (no code changed); gate status is inherited from already-merged PR #663 |

No application or Worker tests run as part of this PR — none apply to a documentation-only change.

---

## Production impact

**None.** This PR changes only a Markdown audit file under `tasks/cloudflare/audits/`. It does not touch the OpenNext build, Wrangler config, the 9.0 MiB fail gate, or any deployed Worker behavior. The Worker bundle-size fix it documents (Mermaid/KaTeX stubs) was already shipped and merged independently via PR #663.

---

## Known limitations

| ID | Finding |
|----|---------|
| L1 | The audit itself flags that `tasks/cloudflare/todo.md` remains **stale** (still shows 8.985 MiB / `next/dynamic` remedy) and is explicitly **not** updated by this PR — reconciliation is deferred |
| L2 | Two competing size targets remain unreconciled: Linear IPI-706 AC (**<8.5 MiB**, met) vs. `todo.md` row (**≤7.5 MiB**, not met — 0.31 MiB short) |
| L3 | Sections 1 and 9 of the audit are explicitly marked historical (2026-07-29 snapshot) and no longer reflect current `main` state; readers must consult section 0 for current status |
| L4 | `@copilotkit/web-inspector` (~578.8 KiB input / ~0.12 MiB gzip) remains unremoved, tracked separately under IPI-849 |

---

## Rollback / cleanup notes

- No infrastructure, CI, or production code was changed; rollback (if ever needed) is a simple revert of this single-file commit with no downstream effects.
- No cleanup actions required — no temporary branches, flags, or config were introduced by this PR.
- The still-open sibling PRs #660/#661 (Phase 1A report/CI) need a **rebase**, not a fix, per the audit's own findings — no action required from this PR.

---

## Follow-up tasks

| Priority | Task |
|----------|------|
| Next | Reconcile `tasks/cloudflare/todo.md` stale IPI-706 rows (8.985 MiB / `next/dynamic`) against the measured 7.806 MiB / stub-alias outcome — separate docs-only PR |
| Next | [IPI-845 · CF-BUNDLE-220b](https://linear.app/amo100/issue/IPI-845) — CopilotKit `/v2/headless` import hygiene (prevents re-pinning Mermaid/Cytoscape/KaTeX) |
| Soon | [IPI-848 · CF-BUNDLE-223](https://linear.app/amo100/issue/IPI-848) — metafile regression gate + Worker bundle composition CI, using this audit's re-measured composition numbers |
| Soon | [IPI-849](https://linear.app/amo100/issue/IPI-849) — remove `@copilotkit/web-inspector` (~0.12 MiB gzip) |
| Later | Rebase and merge Phase 1A PRs [#660](https://github.com/amo-tech-ai/lumina-studio/pull/660) and [#661](https://github.com/amo-tech-ai/lumina-studio/pull/661) onto post-#663 `main` |
| Later | File a ticket for `@mastra/core` surface reduction (~6.4 MiB input, largest remaining bucket, currently unticketed) |

---

## Recommendation

| Action | Decision |
|--------|----------|
| Reopen #662 | **No** |
| Treat IPI-706 docs concern | **Done** — audit merged, no production risk |
| Treat IPI-706 ticket overall | **Not yet** — size goal met per Linear AC, but `todo.md` reconciliation (L1/L2) still open |
| Next PR | Docs-only `todo.md` reconciliation, or code-only IPI-845 (separate PRs, per one-concern rule) |