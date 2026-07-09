# RF-05 — Token cleanup (touch-as-you-go)

| Field | Value |
|---|---|
| **ID** | RF-05 |
| **Refactor action** | A8 — token drift (incremental) |
| **Priority** | P2 |
| **Complexity** | S |
| **Status** | 🔴 Not Started |
| **Dependencies** | RF-03 or RF-04a/b (when colors needed) |
| **Unblocks** | — |
| **Branch** | `n/a — same PR as consumer` |
| **Sources** | [`../../REFACTOR.md`](../docs/REFACTOR.md) · [`../../refactor/build-order.md`](README.md) |

## Objective

When a refactor screen needs a drift color, add token to `tokens.css` in **that same PR**. No standalone tokenize-everything pass.

## Ground truth (2026-07-06)

`app/src/styles/tokens.css` already exists as SSOT. `--primitive-purple-700: #7c3aed` exists — alias, don't duplicate.

## Design source

- SCR-27 approval colors: `#d97706` on `#fef3e2`, border `#f4d9ad`
- Activity icon-bg: `#e7f0ff` · `#eaf7f0` · `#f3edff` (ai `#7c3aed`)

## Files to inspect

- `app/src/styles/tokens.css`

## Files likely to modify / create

- `app/src/styles/tokens.css (only when consumer PR needs a token)`

## Definition of Done

- [ ] No standalone token PR
- [ ] New tokens only when a screen in RF-03/04 uses them
- [ ] Reference existing primitives before adding new hex

## Verification

```bash
cd app && npm run lint
```

## Risk

Low

## Notes

Build-order Step 5. Not a separate workstream — rule for RF-03/04 PRs.

## Skills

`refactor-plan` · `design-to-production` · `shadcn` · `nextjs-developer` · `worktrees`
