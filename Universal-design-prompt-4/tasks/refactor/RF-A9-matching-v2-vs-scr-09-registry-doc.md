# RF-A9 — Matching.v2 vs SCR-09 registry doc

| Field | Value |
|---|---|
| **ID** | RF-A9 |
| **Refactor action** | A9 — naming clarification |
| **Priority** | P2 |
| **Complexity** | S |
| **Status** | ⏸ Deferred |
| **Dependencies** | — |
| **Unblocks** | SCR-09 · prevent double-build |
| **Branch** | `ipi/rf-a9-matching-registry-docs` |
| **Sources** | [`../../REFACTOR.md`](../docs/REFACTOR.md) · [`../../refactor/build-order.md`](README.md) |

## Objective

Update SCREEN-REGISTRY.md (both copies) to record Matching.v2 (brand↔creator) and SCR-09-Matching-Talent (casting) as distinct screens with distinct routes.

## Ground truth (2026-07-06)

Registry exists in two locations. ADR-002 — do not merge screens.

## Design source

- [`../../../Pages/Matching.v2.image-first.dc.html`](../../Pages/Matching.v2.image-first.dc.html)
- [`../../../Pages/SCR-09-Matching-Talent.dc.html`](../../Pages/SCR-09-Matching-Talent.dc.html)

## Files to inspect

- `Universal-design-prompt-new/docs/handoff/SCREEN-REGISTRY.md`

## Files likely to modify / create

- `docs/handoff/SCREEN-REGISTRY.md`

## Definition of Done

- [ ] Both screens listed with routes and purposes
- [ ] ADR-002 reference
- [ ] Docs-only PR

## Verification

```bash
— (docs only)
```

## Risk

None

## Notes

Trivial independent docs PR. One concern per PR.

## Skills

`refactor-plan` · `design-to-production` · `shadcn` · `nextjs-developer` · `worktrees`
