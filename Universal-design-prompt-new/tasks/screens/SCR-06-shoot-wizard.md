# SCR-06 — Shoot Wizard

| Field | Value |
|---|---|
| **ID** | SCR-06 |
| **Route** | `/app/shoots/new` |
| **Priority** | P1 |
| **Status** | ✅ ~80% |
| **Linear** | [IPI-274](https://linear.app/amo100/issue/IPI-274) Done |
| **Dependencies** | T3 WizardShell |
| **Branch** | `ipi/scr-06-shoot-wizard-polish` |
| **Matrix** | [MATRIX.md](./MATRIX.md) |
| **Wireframe** | [./wireframes/SCR-06-shoot-wizard.md](./wireframes/SCR-06-shoot-wizard.md) |
| **Diagram** | [./diagrams/SCR-06-shoot-wizard.md](./diagrams/SCR-06-shoot-wizard.md) |

## Conversion plan

> **SSOT:** [`../../plan/designtoreact.md`](../docs/designtoreact.md) · [`design-to-production`](../../../.claude/skills/design-to-production/SKILL.md) · Full sections: [`SCR-TEMPLATE.md`](SCR-TEMPLATE.md)

### 1. Target

| Field | Value |
|---|---|
| **HTML source** | `Pages/Shoot Wizard.v2.image-first.dc.html` |
| **React route** | `/app/shoots/new` |
| **Page file** | `app/src/app/(operator)/app/shoots/new/page.tsx` |
| **Route status** | **existing** |
| **Scope note** | 6-step scope lock (IPI-274) — not 10-step DC demo. |


### Layout — wireframe & diagram (must match DC)

| Asset | Path |
|---|---|
| **DC SSOT** | [`Pages/Shoot Wizard.v2.image-first.dc.html`](../../Pages/Shoot%20Wizard.v2.image-first.dc.html) |
| **Wireframe** | [./wireframes/SCR-06-shoot-wizard.md](./wireframes/SCR-06-shoot-wizard.md) |
| **Mermaid** | [./diagrams/SCR-06-shoot-wizard.md](./diagrams/SCR-06-shoot-wizard.md) |
| **Shell** | `wizard-full` · grid `flex column 100vh` |

Skills: [`ipix-wireframe`](../../../.claude/skills/ipix-wireframe/SKILL.md) · [`mermaid-diagrams`](../../../.claude/skills/mermaid-diagrams/SKILL.md)

### 2. Skill routing

| Skill | When | This screen |
|---|---|:---:|
| `design-to-production` | Load before coding | ✅ |
| `nextjs-developer` | Load before coding | ✅ |
| `vercel-react-best-practices` | Load before coding | ✅ |
| `ipix-supabase` | Load before coding | ✅ |
| `copilotkit` | Load before coding | ✅ |
| `mastra` | Load before coding | ✅ |
| `gemini` | Load before coding | — |
| `task-verifier` | Load before coding | ✅ |
| `ipix-wireframe` | Wireframe matches DC | ✅ |
| `mermaid-diagrams` | Layout/flow diagrams | ✅ |

### Definition of Ready

- [ ] DC file read; Workspace zones identified
- [ ] §0 Prove tables filled below
- [ ] Reuse audit complete
- [ ] No conflicting PR/worktree
- [ ] Linear assigned
- [ ] Out of scope listed

### Phase 0 — Prove (fill before line 1)

#### Production-state

| Area | Exists today? | This PR changes? |
|---|---|---|
| Route | _verify disk_ | |
| Shell | ✅ OperatorPanel | No |
| Workspace | _verify_ | Yes (workspace column) |
| Data wiring | _verify_ | Yes — layout PR preserves queries |

#### Data-source (per block — fill)

| Block | Data source | Empty | Error | Image slot |
|---|---|---|---|---|
| _TBD_ | | | | |

#### Negative rules

- No fake scores, dates, crew, or counts when API null
- No fallback images in asset/upload contexts
- Existing route → preserve wiring unless §0 proves wrong

### Reuse audit

- [ ] Components · hooks · CSS modules · utils · RPCs · routes searched

### Screen-specific Done criteria

_See § Definition of Done below — plus designtoreact §18 parity report before merge._

### Verification gate

```bash
cd app && npm run lint && npm test && npx tsc --noEmit && CI=true npm run build
```

Browser: `qa@ipix.test` · `:3002` · 1280 + 390 · screenshots → `docs/qa/screenshots/YYYY-MM-DD/`  
Visual regression: DC `:8765` vs React `:3002` ([§17 designtoreact](../docs/designtoreact.md))

### Out of scope

- Shell / nav / IntelligencePanel / chat dock rebuild
- Backend migrations (separate BE-* PR)
- Mobile shell (MOB-* track)

## Readiness

| Layer | Status |
|---|---|
| React | ✅ |
| Backend | 🟢 |
| AI | 🟢 |
| Mobile | ⚪ |

## Design source

- **DC:** [`../../Pages/Shoot Wizard.v2.image-first.dc.html`](../../Pages/Shoot Wizard.v2.image-first.dc.html)
- **Index:** [`../../HTML.md`](../../HTML.md)
- **Discipline:** [`../../plan/designtoreact.md`](../docs/designtoreact.md)

## Files to inspect

- `app/src/app/(operator)/app/shoots/new/page.tsx`
- `app/src/components/shoot/wizard/`

## Files likely to modify

- `Step validation polish`
- `WizardShell extract`

## Supabase dependency

shoots create RPC/API

## AI dependency

shoot-planner agent — production HITL flow

## Mobile dependency

M1

## Definition of Done

- [ ] Multi-step wizard matches DC
- [ ] Creates shoot on commit
- [ ] AI drafts behind ApprovalCard

## Verification

```bash
cd app && npm test -- wizard
```

## Risk

Low

## Notes

Production HITL reference implementation.

## Skills

`design-to-production` · `nextjs-developer` · `copilotkit` · `designtoreact`

