# Screen checklists — design parity index

Tick during **Audit** and **Verify** phases. Full baseline: [`tasks/design-docs/docs/handoff/11-screen-checklists.md`](../../../../tasks/design-docs/docs/handoff/11-screen-checklists.md).

---

## Every screen (baseline)

- [ ] Layout matches DC **workspace column** only (3-panel desktop / tab+sheet mobile)
- [ ] `tokens.css` + CSS modules — no hardcoded legacy hex
- [ ] Shared components reused (`ShootCard`, `BrandCard`, etc.)
- [ ] All states per [`08-state-map.md`](../../../../tasks/design-docs/docs/handoff/08-state-map.md)
- [ ] Skeleton for grids — not spinner-only
- [ ] AI dock: contextual greeting — never blank "How can I help?"
- [ ] Mobile @1024: tab bar, More sheet, intel-as-sheet (shell — verify, don't rebuild)
- [ ] a11y: labels, ≥44px targets, focus visible
- [ ] No fake production data ([`production-readiness.md`](../../../../tasks/design-docs/shoot/production-readiness.md))
- [ ] Side-by-side screenshots saved

---

## Shoots List (`Shoots List.v2.image-first.dc.html`)

**Linear:** IPI-273 · **Route:** `/app/shoots` · **Plan:** [`shoots-list-dc-conversion.md`](../../../../tasks/design-docs/shoot/PLAN/shoots-list-dc-conversion.md)

From handoff §11 + conversion plan §6 (14 dimensions):

| # | Dimension | DC reference | Pass criteria |
|---|-----------|--------------|---------------|
| 1 | Workspace max-width | 920px centered | CSS `max-width: 920px` |
| 2 | Header | H1 + count + New shoot button | spacing 28/40/0 |
| 3 | Search + filter row | 40px height, wrap | combines with filter chip |
| 4 | Grid | 3 columns, gap 20px | not 4-col |
| 5 | ShootCard | 4:3 cover, status dot, DNA | match `ShootCard.dc.html` |
| 6 | Loading | 6 skeletons, 3-col | `loading.tsx` |
| 7 | Empty portfolio | stacked photos + Plan shoot CTA | ≠ filter empty |
| 8 | No matches | shows query in copy | when search active |
| 9 | Error | Try again button | wired retry |
| 10 | New shoot → wizard | `/app/shoots/new` | primary CTA |
| 11 | Open card → detail | `/app/shoots/[id]` | card click |
| 12 | Typography | sans body, semibold titles | Outfit not Inter |
| 13 | Chat dock footer | Production Planner context | shell/dock — contextual chips |
| 14 | Mobile @390 | grid collapse, no horizontal scroll | screenshot |

**Phase 7 gate:** All 14 scored 🟢/🟡 with screenshot paths — 0% validated = not Done (see plan rollup).

---

## Command Center · Brand List · Brand Detail

See [`11-screen-checklists.md`](../../../../tasks/design-docs/docs/handoff/11-screen-checklists.md) sections.

**Evidence:** `e2e/command-center-dc-parity-screenshots.spec.ts`, `e2e/brand-dc-parity-screenshots.spec.ts`

---

## Pre-PR gates (all screens)

From [`lessons-from-brand-parity.md`](../../../../tasks/design-docs/shoot/lessons-from-brand-parity.md):

1. **Production state table** in issue md
2. **Data-source table** for every list/tab block
3. **Negative AC** — no fake fallbacks
4. **Phase 2 disk probe** — component exists before "create"
5. **`task-verifier`** before `gh pr create`
