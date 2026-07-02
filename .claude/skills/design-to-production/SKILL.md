---
name: design-to-production
description: >
  Convert Claude Design HTML (*.v2.image-first.dc.html) into production Next.js React
  screens with verified visual parity. Use whenever the user says "design to production",
  "DC parity", "convert HTML to React", "match the design file", "image-first parity",
  references Universal design prompt/*.dc.html, or asks to port Command Center / Brand List /
  Brand Detail (or any *.dc.html screen) into app/. Also use before merging design parity PRs,
  when comparing prototype HTML to /app/* routes, or when creating workspace components from
  Claude Design exports. HTML design wins for layout; React wins for data/auth/shell. Does NOT
  replace claude-design-handoff for full program planning — use this skill for execute-and-verify
  on a single screen or small route bundle.
---

# design-to-production — HTML design → React parity

**Workflow:** `HTML design file → audit current React → minimal production files → verify visual parity`

**Design SSOT:** `/home/sk/ipix/Universal design prompt/` — **must use the actual `.dc.html` files**; production must match them for layout, spacing, cards, panels, typography, image ratios, buttons, and responsive behavior.

**Production app:** `app/` (Next.js 16) · routes under `/app/*` · legacy Vite `src/` is retired — do not port there.

**Related skills:** `claude-design-handoff` (full handoff program) · `frontend-design` · `task-verifier` (gate before Done) · `pr-workflow` (one concern per PR)

---

## Non-negotiable rules

| Layer | Wins for |
|-------|----------|
| **HTML `.dc.html`** | Visual layout, spacing, card structure, image-first ratios, chip rows, workspace column width, empty/loading/error **presentation** |
| **React `app/`** | Live data, routing, auth, Supabase, CopilotKit, Mastra, APIs, business logic |

**Do not:**

- Rebuild **OperatorPanel**, **NavSidebar**, **IntelligencePanel**, **PersistentChatDock**, CopilotKit provider, or Supabase clients
- Invent new architecture, routes, or agent wiring
- Copy prototype-only JS (DC `STATE` switchers, demo fixtures, bulk-select demos unless product asks)
- Mix design parity with infra fixes, migrations, or unrelated refactors in one PR
- Ship without lint · test · typecheck · build · browser evidence

**Do:**

- Prefer **existing** production components; extend before creating
- Create **local** workspace components under `app/src/components/<feature>/`
- Use **`app/src/styles/tokens.css`** + **CSS modules** (`*.module.css`) — no hardcoded legacy orange hex
- Keep PRs **small** (target ≤500 LOC); one screen bundle or one concern per PR
- Capture **before/after screenshots**; mark unmatched items as **known gaps**
- Work on branch `ipi/<issue>-<slug>` via worktree per `CLAUDE.md`

---

## Route mapping (P0)

Read full map: [`references/route-map.md`](references/route-map.md)

| HTML file | React route |
|-----------|-------------|
| `Command Center.v2.image-first.dc.html` | `/app` |
| `Brand List.v2.image-first.dc.html` | `/app/brand` |
| `Brand Detail.v2.image-first.dc.html` | `/app/brand/[id]` |

**Page entrypoints:**

```text
app/src/app/(operator)/app/page.tsx
app/src/app/(operator)/app/brand/page.tsx
app/src/app/(operator)/app/brand/[id]/page.tsx
```

**Shell is already wired** via `(operator)/layout.tsx` + `OperatorPanel`. Parity = **center workspace column** only.

---

## Workflow (run in order)

### 1. Discover

1. Read the target **`*.v2.image-first.dc.html`** in full (inline CSS + structure + dc-imports).
2. List **dc-import** components referenced; open matching files under `Universal design prompt/components/*.dc.html` only when the screen imports them.
3. Read production **page.tsx** + workspace components (grep `app/src/components/` for route name).
4. Read [`design.md`](../../../design.md) § layout + [`tasks/plan/todo.md`](../../../tasks/plan/todo.md) for tracker status.
5. Check **current verified parity %** for this screen in [`tasks/design-docs/progess.md`](../../../tasks/design-docs/progess.md) — don't assume "shell already wired, workspace column only" is the actual starting point; some screens (e.g. Brand List) are still a plain list, not a grid, and score well under 50% (wrong-layout-paradigm territory per the scoring guide below).
6. Note existing QA: `tasks/design-docs/implementation/brand/parity-audit.md`, PR #181 checklist if present.
7. Check for collisions: `git worktree list` and `gh pr list --state open` for branches/PRs already targeting this route (this repo regularly has parallel in-flight work, e.g. `ipi/272-brand-list-dc-parity`, draft PR #181). Flag overlap to the user before starting rather than duplicating or conflicting with it.

**Output:** file list (HTML sources, React targets, reusable components) + any collision warning.

### 2. Audit

Open HTML and React **side by side** (DC server `:8765` optional — see route-map).

Build a **mismatch table**:

| Area | DC (HTML) | React (today) | Action |
|------|-----------|---------------|--------|
| Workspace width / padding | | | reuse / fix CSS |
| Header / greeting | | | |
| Card grid vs list | | | |
| Image aspect ratios | | | |
| Filter / search chips | | | |
| Intel panel tabs | | | usually OK — shell |
| States | | | |
| Mobile | | | |

Score each row: 🟢 match · 🟡 partial · 🔴 missing · ➖ defer (product call).

**Output:** audit table + recommended reuse vs create vs defer.

### 3. Plan

Before coding:

- **Reuse:** existing components (e.g. `ShootCard`, `EvidenceBlock`, `IntelligencePanel` data hooks)
- **Create:** new workspace-only components (e.g. `brand-list-workspace.tsx` + `.module.css`)
- **Defer:** DC-only affordances (Sort button stub OK if layout-only), bulk select, demo STATE switcher

One PR scope — e.g. "Brand List workspace only" not List + Detail + infra.

Link Linear: IPI-17 / IPI-271 / IPI-272 / DESIGN-050–052 as applicable.

**Output:** 3–8 file touch list + explicit out-of-scope list.

### 4. Implement

1. Create worktree branch: `git worktree add ../wt-ipi-XXX -b ipi/XXX-slug`
2. **Minimal diff** in workspace components + page composition only.
3. Wire **live data** via existing lib hooks (`brand-hub`, `command-center/queries`, panel API).
4. Map DC labels to production schema when names differ (e.g. pillars: Visual/Audience/Consistency/Commerce ↔ `brand_scores` keys).
5. Use **`heroFallbackForBrand`** / `sample-images.ts` when schema has no cover URL.
6. Remove debug UI (DC state switchers, "target banner" placeholders).
7. Do **not** move `ActiveBrandProvider`, CopilotKit layout, or auth unless separate infra PR.

**CSS:** tokens + modules; match DC spacing from HTML inspect (padding, gap, grid columns, 16:9 covers).

### 5. Verify

Run in worktree:

```bash
cd app
npm run lint
npm test
npx tsc --noEmit
CI=true npm run build
```

Browser (QA account `qa@ipix.test`, app on `:3002`):

- Navigate target route(s)
- Check console (no app errors)
- Check network (panel API 200 where applicable)
- Desktop **1280** + mobile **390** at minimum

Playwright (no dc-parity screenshot specs exist yet as of 2026-07 — don't assume the two below are real; `e2e/` uses `NN-name.spec.ts` numbering, see `e2e/01-app-loads.spec.ts`):

```bash
# If automated screenshot diffing is worth it for this screen, create one following
# the existing e2e/ naming convention, e.g. e2e/06-brand-list-dc-parity.spec.ts.
# Otherwise browser smoke + manual screenshots (below) are sufficient for the report.
npx playwright test e2e/<NN-name>-dc-parity.spec.ts   # only if you created one
```

Save screenshots to `docs/qa/screenshots/YYYY-MM-DD/` (create the `docs/qa/` tree if it doesn't exist yet — `mkdir -p docs/qa/screenshots/$(date +%F)`).

### 6. Report

**Always** produce the report using [`references/report-template.md`](references/report-template.md).

Include:

- Files changed
- Visual parity score (overall + per dimension)
- Screenshot paths
- Known gaps (honest — do not overstate)
- Production readiness: 🟢 / 🟡 / 🔴

Attach report to PR body or `docs/qa/design-parity-checklist.md` on branch.

---

## Verification commands (copy-paste)

```bash
cd app
npm run lint
npm test
npx tsc --noEmit
CI=true npm run build
npx playwright test --project=chromium-desktop   # when e2e exists for screen
```

Repo policy: `cd app && npm run lint && npm run build && npm test` before PR.

---

## Parity scoring guide

| Score | Meaning |
|-------|---------|
| **90–100%** | Layout, cards, typography, states match; live data OK |
| **75–89%** | Structure match; minor label/fixture/mobile gaps documented |
| **50–74%** | Core grid/hero present; major affordances or states missing |
| **<50%** | Wrong layout paradigm (list vs grid, missing shell integration) |

Dimensions: layout · spacing · cards/images · typography · right panel · states · responsive.

---

## Example prompts

```text
Use design-to-production to convert Brand Detail.v2.image-first.dc.html into production React for /app/brand/[id].
```

```text
@design-to-production audit Command Center HTML vs /app — mismatch table only, no code.
```

```text
Run design-to-production verify pass on PR #181 — report template + parity score.
```

---

## Overlap with claude-design-handoff

| Need | Skill |
|------|-------|
| Single screen / route parity, PR-sized execution | **design-to-production** (this) |
| Full program: Linear tasks, Phase A/B/C, component library import | `claude-design-handoff` |
| Tracker / priority | `tasks/plan/todo.md` |
| Forensic gate before Done | `task-verifier` |

---

## Checklist before merge

- [ ] HTML source file read and cited
- [ ] Only workspace column changed (unless infra PR split)
- [ ] No secrets in diff · no `src/` Vite changes
- [ ] lint + test + tsc + build green
- [ ] Browser smoke + screenshots
- [ ] Report filled · gaps listed
- [ ] One concern per PR · Bugbot threads resolved
