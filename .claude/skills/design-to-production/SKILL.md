---
name: design-to-production
description: >
  Convert Claude Design HTML (*.v2.image-first.dc.html) into production Next.js React
  screens with verified visual parity. Use whenever the user says "design to production",
  "DC parity", "convert HTML to React", "match the design file", "image-first parity",
  references Universal design prompt/*.dc.html (including Shoots List), or asks to port
  Command Center / Brand List / Brand Detail / Shoots List into app/. Load before line 1
  on any DESIGN-* UI task. HTML design wins for layout; React wins for data/auth/shell.
  Enforces RSC + CSS modules + tokens + state parity + side-by-side verification. Does NOT
  replace claude-design-handoff for full program planning — use this skill for execute-and-verify
  on a single screen or small route bundle.
metadata:
  version: "2.1.0"
---

# design-to-production — HTML design → React parity

**Workflow:** `Phase 0 gates → read DC HTML → audit React → minimal files → side-by-side verify → report`

**Design SSOT:** `Universal design prompt/*.v2.image-first.dc.html` — layout, spacing, cards, image ratios, states, responsive behavior.

**Production:** `app/` (Next.js 16) · `/app/*` · legacy Vite `src/` retired.

---

## Load before line 1 (mandatory stack)

| Order | Skill / doc | Purpose |
|-------|-------------|---------|
| 1 | **`design-md`** | Tokens, 3-panel contract, HITL |
| 2 | **This skill** | DC → React execution |
| 3 | [`reuse-first-checklist.md`](references/reuse-first-checklist.md) | **Run before any task exists** — prove nothing reusable was missed |
| 4 | [`dc-html-anatomy.md`](references/dc-html-anatomy.md) | Parse Workspace zones + states |
| 5 | [`react-next-parity-rules.md`](references/react-next-parity-rules.md) | RSC, CSS modules, no hex |
| 6 | [`screen-checklists.md`](references/screen-checklists.md) | Per-screen dimensions |
| 7 | **`vercel-react-best-practices`** | Search/filter performance |
| 8 | **`task-verifier`** | Phase 2 readiness + Done gate |

Shoot domain: also [`shoot/lessons-from-brand-parity.md`](../../../tasks/design-docs/shoot/lessons-from-brand-parity.md).

---

## Non-negotiable rules

| Layer | Wins for |
|-------|----------|
| **HTML `.dc.html`** | Visual layout, spacing, card structure, image-first ratios, chip rows, workspace width, empty/loading/error **presentation** |
| **React `app/`** | Live data, routing, auth, Supabase, CopilotKit, Mastra, APIs, business logic |

**Do not:**

- Rebuild **OperatorPanel**, **NavSidebar**, **IntelligencePanel**, **PersistentChatDock**
- Use `min-h-screen`, `#FBF8F5`, `#E87C4D`, or other legacy Vite hex in workspace
- Whole-page `'use client'` + `useEffect` fetch when RSC + `loading.tsx` suffices
- Invent fake DNA scores, history, or counts when API null
- Copy DC `Inter` font or `:root` wholesale — map to `tokens.css`
- Mix parity with migrations/infra in one PR

**Do:**

- Parity = **`main[data-screen-label="Workspace"]`** column only
- **RSC page** + **client workspace** + **`loading.tsx`** skeleton matching DC
- **CSS modules** + **`app/src/styles/tokens.css`**
- **Production state table** + **data-source table** in issue md before code
- Side-by-side screenshots DC `:8765` vs React `:3002`
- Branch `ipi/<issue>-<slug>` via worktree

---

## Regression guardrails (IPI-383/372 lessons — do not repeat)

Folded from `tasks/design-docs/audit/checklist.md`. These are the exact mistakes that cost review cycles — each is now a hard step, not advice.

**Also read [`Universal-design-prompt-4/lessons.md`](../../../Universal-design-prompt-4/lessons.md) Top 10 before starting a screen.** That doc captures the *broader* mistakes (migration drift, cross-org data bugs, stale branches reintroducing fixed code, accessibility fixes that miss third-party utility classes) found across CRM + Planner PRs — this table below is the narrower, DC-parity-specific subset. Both apply; neither replaces the other. When you find a new mistake during a screen conversion, add it to `lessons.md`, not a third list.

| # | Trap | Guardrail |
|---|------|-----------|
| 1 | Edit/Write before reading the file's exact path | `Read` (after `graphify query`) every file before editing. Never assume a path. |
| 2 | Ran `tsc`/tests before deps installed in a fresh worktree | First worktree command is `npm ci`. Baseline-green before writing code. |
| 3 | Stale worktree — local branch behind remote; a commit would revert shipped work | Before editing: `git fetch && git status` vs `origin/<branch>` + `gh pr list --head <branch>`. Reset/rebase to remote first. |
| 4 | Crammed all detail into `aria-label`, overriding visible text | Concise `aria-label` (accessible name) + `aria-describedby` → `className="sr-only"` summary. Never one giant label. |
| 5 | Brittle exact-string name assertions broke on copy tweaks | Assert accessible names by prefix regex (`/^Select …/`), not `===`. |
| 6 | `<Link>` to current route as "retry" — silent no-op | Retry re-runs the server fetch: `"use client"` + `useRouter().refresh()`. Mock `next/navigation` in tests. |
| 7 | Test mocked only own CSS module, not shared base module | Mock **every** `*.module.css` the tree imports with the Proxy stub. |
| 8 | Panel/dock preview test asserted on a published node never rendered | Render provider + a `DetailSink` that renders `detail` (copy `shoots-list-workspace.test.tsx`). |
| 9 | Read exit code `0` from a piped test run that had failed | Read actual test output, not just tail/exit-code notification. |
| 10 | Over-scoped to the whole DC file (extra steps/flows) | Honor the decision of record (e.g. IPI-252: 6 steps ship, not 10). Build only in-scope nodes; mark the rest ➖ deferred with its issue. |
| 11 | Trusted local `supabase/migrations/*.sql` as ground truth without checking the live ledger | Audit Supabase first (Phase 0, below) — `list_migrations` + `pg_get_functiondef()` against the live project before assuming a local file reflects what's actually deployed. |

Full write-ups, dates, and PR links: [`Universal-design-prompt-4/lessons.md`](../../../Universal-design-prompt-4/lessons.md).

---

## Phase 0 — gates (before Discover)

Run from [`improve.md`](../../../Universal-design-prompt-new/docs/design/improve.md) + brand parity lessons:

```text
[ ] Audit Supabase FIRST — live schema, RLS, and migration ledger before reading anything else
[ ] Read target *.dc.html + screen checklist row
[ ] Production state table — shell/route/API exists on disk?
[ ] Data-source table — Supabase MCP probe for list/tab columns
[ ] Negative AC — no fake fallbacks documented
[ ] @task-verifier readiness — fix 🔴 spec gaps before coding
```

**Audit Supabase first — before trusting any local file.** Local schema/migration files and written specs can both diverge from what's actually live. Before building against any table/column/RPC this screen needs, run against the live project via Supabase MCP (read-only):

1. `list_tables` / a targeted `select` — does the column the DC mockup implies actually exist, and is it non-null on real rows (not just in dev fixtures)? A field that's always null in seed data hides whether the feature works at all (lessons #7, #8).
2. For any RPC the screen calls, `execute_sql`: `select pg_get_functiondef('public.<fn>(<args>)'::regprocedure)` — confirm the **live** function body, not just the migration file's version. `create or replace` migrations can be reapplied incrementally on the live project (via `apply_migration` during iteration) in a way local files don't always track 1:1 (lesson #9).
3. `list_migrations` — confirm the live ledger's version/name list matches what's in `supabase/migrations/` locally. A squashed or renumbered local file that doesn't match a live-applied version is invisible to CI and will desync on the next `db push` (lesson #9).

Only after this — not before — read the `.dc.html` and start the Discover phase below.

**Shoots List example:** `Shoots List.v2.image-first.dc.html` requires 920px workspace, 3-col grid, 5 distinct states — current `/app/shoots/page.tsx` fails layout + tokens + architecture.

---

## Route mapping

Full map: [`references/route-map.md`](references/route-map.md)

| Priority | HTML | Route | Linear |
|----------|------|-------|--------|
| P0 | Command Center · Brand List · Brand Detail | `/app` · `/app/brand` · `/app/brand/[id]` | IPI-271/272 |
| **P1** | **`Shoots List.v2.image-first.dc.html`** | **`/app/shoots`** | **IPI-273** |
| P1+ | Shoot Detail · Wizard · Assets · … | `/app/shoots/[id]` · `/app/shoots/new` · … | IPI-274+ |

**Conversion plans (shoot family):**
- Shoots List → `tasks/design-docs/shoot/PLAN/shoots-list-dc-conversion.md` — 14 parity dimensions; Phase 7 must be >0% before Done.
- Shoot Wizard → `tasks/design-docs/shoot/PLAN/shoot-wizard-dc-conversion.md` — **scope-locked to 6 steps (IPI-274)**; DC's extra 4 steps + booking flow are deferred (IPI-252 / IPI-340-342). Folds the IPI-383 regression guardrails into §0.1.

---

## Workflow (run in order)

### 1. Discover

1. Read target **`*.v2.image-first.dc.html`** — grep `data-screen-label`, `max-width`, `grid-template-columns`, `sc-if` state flags ([dc-html-anatomy.md](references/dc-html-anatomy.md)).
2. Open `dc-import` components under `Universal design prompt/components/`.
3. Grep production route + `app/src/components/<feature>/`.
4. Fill **production state table** — what exists vs what this PR changes.
5. Read screen row in [`screen-checklists.md`](references/screen-checklists.md).

**Output:** HTML zones table + file touch list (3–8 paths).

### 2. Audit

Side-by-side: DC server optional `:8765` vs `:3002`.

| Area | DC | React | Action |
|------|----|----|--------|
| Workspace width | e.g. 920px | | fix module |
| Grid cols / gap | e.g. 3 × 20px | | |
| States | loading/empty/error/no-match/grid | | each distinct |
| Tokens | `#111` action | legacy orange? | 🟢/🔴 |
| Architecture | N/A | RSC vs client page | |
| Mobile @1024 | tab bar / sheet | shell OK? | |

Score: 🟢 match · 🟡 partial · 🔴 missing · ➖ defer.

### 3. Plan

- **Reuse:** `ShootCard`, `BrandCard`, panel hooks
- **Create:** `*-workspace.tsx` + `*.module.css` only
- **Defer:** DC STATE switcher, bulk select demos
- **Out of scope:** explicit list in PR
- **Data access:** one typed function per read/mutation (e.g. `listCompanies()`, `updateDealStage()`) — no component calls `supabase.from()` directly. UI, Mastra tools, and CopilotKit actions all call the same function. (See `lessons.md` — the pattern that prevents "which of these five queries is the real one.")

Link Linear · one concern per PR · ≤500 LOC target.

**Before merge, prove every "REUSE" line in the table above, don't just state it** (lessons.md #2 — a reuse table is a plan, not proof):
```bash
rg "<ComponentName>" app/src/components/<feature> app/src/app/\(operator\)/app/<route>
```
If the grep comes back empty, the component was planned to be reused but isn't actually imported — fix before merge, not after review flags it.

### 4. Implement

Follow [`react-next-parity-rules.md`](references/react-next-parity-rules.md):

1. Worktree branch
2. RSC `page.tsx` fetch → pass props to client workspace
3. `loading.tsx` = DC skeleton (shimmer, correct aspect ratio)
4. CSS module measurements from DC inline styles
5. Wire live data — honest empty/error; `onRetry` on error
6. Map DC labels to schema (`shoot_portfolio_view`, etc.)

```bash
# Style gate on changed paths
rg '#FBF8F5|#E87C4D|min-h-screen' app/src/components/shoot app/src/app/\(operator\)/app/shoots
```

### 5. Verify

```bash
cd app && npm run lint && npm test && npx tsc --noEmit && CI=true npm run build
npx playwright test e2e/shoots-list.spec.ts   # when Shoots List touched
npx playwright test e2e/brand-dc-parity-screenshots.spec.ts  # brand screens
```

Browser QA (`qa@ipix.test`, `:3002`):

- 1280 desktop + 390 mobile (+ 1024 if shell mobile in scope)
- Console clean · network 200 on data routes
- Screenshot **each state** vs DC toggle

Save: `docs/qa/screenshots/YYYY-MM-DD/<screen>/`

### 6. Report

Use [`references/report-template.md`](references/report-template.md) — include 14-dimension table for Shoots List.

**@task-verifier** before merge · Bugbot threads resolved.

---

## Parity scoring

| Score | Meaning |
|-------|---------|
| **90–100%** | Layout, cards, typography, all states match; live data honest |
| **75–89%** | Structure match; documented minor gaps |
| **50–74%** | Grid present; major states or mobile gaps |
| **<50%** | Wrong paradigm (legacy hex, wrong cols, client-only fetch) |

Dimensions: layout · spacing · cards/images · typography · states (×5) · responsive · data honesty.

---

## Example prompts

```text
@design-to-production — audit Shoots List.v2.image-first.dc.html vs /app/shoots.
Phase 0 tables only; cite dc-html-anatomy zones + 14-dimension checklist.
```

```text
@design-to-production implement IPI-273 workspace only — RSC page + shoots-list.module.css.
Match 920px / 3-col / DC empty state. No shell rebuild.
```

---

## Overlap

| Need | Skill |
|------|-------|
| Single screen parity | **design-to-production** |
| Full program / Linear phases | `claude-design-handoff` |
| Linear steps + proof | `ipix-task-lifecycle` |
| Forensic Done | `task-verifier` |

---

## Checklist before merge

- [ ] Phase 0 tables in issue md
- [ ] DC HTML file read; Workspace-only diff
- [ ] No legacy hex / min-h-screen in changed files
- [ ] RSC + loading.tsx where list screen
- [ ] All DC states implemented (not collapsed) — loading/empty/error/retry, not just populated
- [ ] Every "REUSE" line grep-verified as actually imported, not just planned (lessons.md #2)
- [ ] All data reads/writes go through one typed function per operation — no direct `supabase.from()` in a component
- [ ] lint · test · tsc · build green — **and this proves nothing about whether a database function actually runs** (lessons.md #10); if this PR touches an RPC, invoke it live at least once
- [ ] Side-by-side screenshots per checklist dimension
- [ ] Report + known gaps honest
- [ ] One concern per PR
- [ ] **Rebased onto current `origin/main` immediately before requesting review** (lessons.md #4, #13) — `git fetch origin && git rebase origin/main`; a same-day merge on `main` can make an un-rebased diff misread as a regression, or silently reintroduce a bug `main` already fixed

---

## References

| File | Contents |
|------|----------|
| [reuse-first-checklist.md](references/reuse-first-checklist.md) | Stop-and-prove gate — run before any task is created |
| [dc-html-anatomy.md](references/dc-html-anatomy.md) | Parse DC HTML structure |
| [react-next-parity-rules.md](references/react-next-parity-rules.md) | Next.js + React patterns |
| [screen-checklists.md](references/screen-checklists.md) | Shoots List 14 dims + index |
| [route-map.md](references/route-map.md) | HTML → route |
| [report-template.md](references/report-template.md) | PR / QA report |
