# IPI-288 · Claude Design System Sync — iPix / FashionOS Design System project (Phase 0+1)

**Linear:** https://linear.app/amo100/issue/IPI-288
**Parent:** IPI-254 · DESIGNV2 React Production Parity
**Status:** Done · Spec mirrored from Linear 2026-07-01

> This repo spec mirrors the Linear issue so there is **one implementation contract** in both places. Update both when scope changes.

---

## Overview

Created a new claude.ai design-system project, `iPix / FashionOS Design System` (`a15c63a4-2a0b-4051-80d1-7697efedf81e`), after verifying none of the 3 pre-existing projects (`Design System`, `mdeapp UI Primitives`, `mdeai Design System`) contain any iPix/FashionOS content. Synced `app/src/styles/tokens.css` + 53 production components, then added metadata-only `@dsCard` preview cards for all 53 so they render in the Design System pane.

**Plan:** [`tasks/design-docs/plan/DESIGN-SYSTEM-CARD-SYNC-PLAN.md`](../../tasks/design-docs/plan/DESIGN-SYSTEM-CARD-SYNC-PLAN.md)
**Target-selection audit:** [`tasks/notes/notes-11-session.md`](../../tasks/notes/notes-11-session.md)

## Acceptance criteria

- [x] New project created; other 3 projects untouched (verified via `list_files`)
- [x] `.design-sync/config.json` excludes `**/*.test.tsx` / `**/*.spec.tsx`
- [x] `styles/tokens.css` + 53 components pushed (54 files), 0 deletes
- [x] 53 `@dsCard` preview `.html` files pushed (one per component)
- [x] `list_files` confirms every `.tsx` has a matching `.html` sibling

## Out of scope

Live-rendered previews · CI drift guard for future components — see [IPI-289](https://linear.app/amo100/issue/IPI-289).

## Verification

```bash
# No app/ code changed — verify via DesignSync list_files against projectId a15c63a4-2a0b-4051-80d1-7697efedf81e
```

## task-verifier checklist

- [x] Source-of-truth check: confirmed via `Universal design prompt/design-patched/00-README.md` (product identity) before creating the project
- [x] Current-state verification: `list_files` run before AND after each push, diffed against the finalized plan
- [x] Scope: one concern (design-system sync tooling), no production code touched
- [x] Anti-fake-done: every file count in this doc is from a live `list_files` call, not assumed

## Independent verification pass (2026-07-01)

Re-checked after an external review scored the plan 94/100. Re-derived the expected file list from `.design-sync/config.json` and diffed against a fresh `list_files` — **exact match**: 53/53 `.tsx`, 53/53 `.html`, 0 missing, 0 orphaned, 0 duplicates, 0 test/spec leakage, 0 `ui/**` leakage. Two non-blocking findings logged in the plan doc: canonical-20 coverage is ~5/20 today (rest are prototype-only, not yet ported — see `DESIGN-TASKS.md` §0), and whether the 16 marketing-site components belong in the same project is an open product-owner question, not decided here. No files changed; read-only pass.
