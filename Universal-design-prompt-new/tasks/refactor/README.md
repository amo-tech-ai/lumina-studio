# Refactor tasks — shared primitives (HTML → React extraction)

> **Sources:** [`../../REFACTOR.md`](../docs/REFACTOR.md) (app-wide audit A1–A9) · [`../../refactor/build-order.md`](README.md) (executable sequence)
> **Rule:** Refactor **during** React conversion — do **not** rewrite `.dc.html` prototypes.

## Build order (follow top-to-bottom)

Each step = one PR · one concern · worktree branch.

| Step | ID | Task | Pri | Status | Spec |
|:--:|:---|:---|:--:|:--:|---|
| 1 | **RF-01** | StatusChip + CRM status tokens | P0 | 🔴 | [RF-01](./RF-01-status-chip.md) |
| 1b | **RF-A7b** | EmptyState + ErrorState | P0 | 🔴 | [RF-A7b](./RF-A7b-empty-error-state.md) |
| 2 | **RF-02** | EntityList template | P0 | 🔴 | [RF-02](./RF-02-entity-list.md) |
| 3 | **RF-03** | CRM Companies + Contacts lists | P1 | 🔴 | [RF-03](./RF-03-crm-list-screens.md) |
| 4a | **RF-04a** | CRM Company detail | P1 | 🔴 | [RF-04a](./RF-04a-crm-company-detail.md) |
| 4b | **RF-04b** | Contact detail + Profile360 extract | P1 | 🔴 | [RF-04b](./RF-04b-profile360-extract.md) |
| 5 | **RF-05** | Token cleanup (same PR as consumer) | P2 | rule | [RF-05](./RF-05-token-touch-as-you-go.md) |

**After Step 4b:** continue with screen tasks [SCR-30 Pipeline](../screens/SCR-30-crm-pipeline.md) · [SCR-31 Deal](../screens/SCR-31-crm-deal-detail.md).

---

## REFACTOR.md action map

| Action | Description | React status | Task |
|:--:|---|:--:|---|
| A1 | Split Wizard/Detail giants → shell + flow configs | 🟠 Wizard 801L; Detail already 209L | [RF-A1](./RF-A1-wizard-shell-split.md) · [RF-A1b](./RF-A1b-detail-shell.md) ⏸ |
| A2 | One AppShell | ✅ **Done** — `OperatorPanel`/`NavSidebar`/`IntelligencePanel` | — |
| A3 | Standardize icons | 🟡 lucide shipped; emoji residual | [RF-A3](./RF-A3-icon-cleanup.md) ⏸ |
| A4 | EntityList template | 🔴 not built | RF-02 · RF-03 |
| A5 | Profile360 / detail template | 🔴 not built | RF-04a · RF-04b |
| A6 | Analytics KPI kit | ⚪ no analytics route | [RF-A6](./RF-A6-kpi-kit.md) ⏸ |
| A7 | Atoms (StatusChip, Timeline, …) | 🟡 partial | RF-01 · RF-A7b · [RF-OPT](./RF-OPT-shootcard-statuschip.md) ⏸ |
| A8 | One token file | ✅ **Done** — `tokens.css` | RF-05 (incremental only) |
| A9 | Matching naming registry | 🟡 doc fix | [RF-A9](./RF-A9-matching-registry.md) ⏸ |

⏸ = deferred — no current trigger or separate initiative.

---

## Ground truth (2026-07-06)

- **Nothing to un-build.** StatusChip, EntityList, Profile360, `crm/status-tokens.ts` do not exist — clean create-targets.
- **Design source = atom library**, not 600-line screen DCs. Build from `components/StatusChip.dc.html`, etc.
- **Proven pattern:** `ShootCard` + `shootStatusDotToken`/`shootStatusLabel` — generalize this, not shadcn Badge.
- **CRM routes** are `CrmScreenGate` stubs — fill slots, don't rewrite shell.
- **No `kind` column** → `<TypeChip>` deferred (needs schema migration).

---

## Deferred (do NOT start now)

| ID | Why deferred |
|---|---|
| RF-A1 | Shoot Wizard split — highest blast-radius; needs test coverage audit first |
| RF-A1b | DetailShell — pair with SCR-05; shoot-detail already collapsed |
| RF-A3 | Emoji→lucide — cosmetic, blocks nothing |
| RF-A6 | KPI kit — no Analytics route yet |
| RF-A9 | Registry doc — trivial docs-only PR, anytime |
| RF-OPT | ShootCard migration — optional proof of StatusChip on live screen |

---

## Mapping to implement.md IDs

| implement.md | Refactor task |
|---|---|
| SC1 StatusChip | RF-01 |
| SC2 EmptyState/ErrorState | RF-A7b |
| T1 EntityList | RF-02 |
| T2 Profile360 | RF-04b |
| T3 WizardShell | RF-A1 |
| T4 DetailShell | RF-A1b |
| CRM1–2 list screens | RF-03 |
| CRM2 detail screens | RF-04a · RF-04b |

---

## Rules (every step)

1. **One concern per PR** — StatusChip ≠ EntityList ≠ screen wire
2. **Worktree:** `git worktree add ../wt-ipi-NNN -b ipi/rf-NN-slug`
3. **Additive until wired** — new components touch no imports until a screen consumes them
4. **Copy proven look** — ShootCard badge is the visual reference; zero drift
5. **No prototype rewrites** — DC files stay standalone-renderable

---

## Related

- Screen tasks: [`../screens/README.md`](../screens/README.md)
- Backend tasks: [`../README.md`](../README.md)
- Deep audit: [`../../REFACTOR.md`](../docs/REFACTOR.md)
- Live-code plan: [`../../refactor/refactor-plan.md`](../../refactor/refactor-plan.md)
