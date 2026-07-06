# React + Next.js rules for design parity

Load with **`vercel-react-best-practices`** when implementing or reviewing parity PRs.

---

## Architecture (App Router)

| Pattern | Use for parity screens |
|---------|------------------------|
| **RSC `page.tsx`** | Auth + Supabase fetch + pass serializable props |
| **`loading.tsx`** | Route-level skeleton matching DC `wsLoading` |
| **`error.tsx`** | Optional — or workspace error state with retry |
| **Client workspace** | Search/filter/sort UI only — `'use client'` boundary as small as possible |
| **CSS modules** | `feature-workspace.module.css` — spacing from DC inspect |
| **No page wrapper** | Never `min-h-screen` + page bg inside `OperatorPanel` child |

### Shoots List target shape

```text
app/(operator)/app/shoots/page.tsx          ← async RSC, fetch shoots
app/(operator)/app/shoots/loading.tsx       ← ShootsListSkeleton (3-col shimmer)
app/src/components/shoot/shoots-list-workspace.tsx  ← 'use client' filter/grid
app/src/components/shoot/shoots-list.module.css
app/src/components/shoot/ShootCard.tsx      ← extend, don't duplicate
```

**Current anti-pattern** (pre-parity): entire `page.tsx` client + `useEffect` fetch + `#FBF8F5` + 4-col grid + legacy orange — see audit in `tasks/design-docs/audit/05-skills-improve.md`.

---

## Data fetching (CRITICAL — no waterfalls)

From Vercel React best practices — apply to list screens:

```tsx
// ✅ RSC page — fetch once, stream skeleton via loading.tsx
export default async function ShootsPage() {
  const shoots = await getShootsForUser() // React.cache() or server helper
  return <ShootsListWorkspace initialShoots={shoots} />
}

// ❌ Client page — useEffect waterfall, no SSR skeleton, layout shift
'use client'
useEffect(() => { supabase.from(...).then(...) }, [])
```

| Rule | Why |
|------|-----|
| Fetch in RSC or route handler | Matches loading.tsx; SEO/auth consistent |
| Pass minimal props to client | RSC boundary — only fields UI needs |
| Client search/filter on props | Derive with `useMemo` — no second fetch for filter |
| `useDeferredValue` for heavy filter | Keeps search input responsive on large lists |
| Supabase in server client | `createSupabaseServerClient` — not browser client in page |

---

## Re-render / UX (list + search screens)

| Rule | Application |
|------|-------------|
| Derive filtered list in render/`useMemo` | Don't duplicate list in state |
| `startTransition` for filter updates | Non-urgent grid refresh |
| Event handlers for retry | `onRetry` — not effect on error flag |
| No components inside components | Extract `ShootCard`, skeleton cell |
| Explicit ternary for counts | `{count > 0 ? … : null}` not `{count && …}` |

---

## Bundle / imports

| Rule | Application |
|------|-------------|
| `optimizePackageImports` for lucide | Already in Next config — keep standard imports |
| Dynamic import heavy modals | EvidenceBlock, upload wizard — not list page |
| No barrel imports for shoot feature | Import from `@/components/shoot/ShootCard` directly |

---

## Styling gates

```bash
# Blocking — fail PR if matches in changed files
rg '#FBF8F5|#E87C4D|#64748B|min-h-screen' app/src/components/shoot app/src/app/\(operator\)/app/shoots

# Require tokens
rg 'var\(--' app/src/components/shoot/*.module.css
```

| Don't | Do |
|-------|-----|
| Inline `style={{ background: '#E87C4D' }}` | `className={styles.primaryButton}` + token |
| Tailwind arbitrary hex in workspace | CSS module + tokens |
| `font-serif text-3xl` without checking DC | Match DC `fs-2xl` / weight / letter-spacing |
| Spinner-only loading for grids | Shimmer skeleton matching card aspect ratio |

---

## Component complexity (extract before shipping, not after Codacy flags it)

A workspace component that inlines header + all 5 states + orchestration in one file *will* get flagged (see PR #219 / IPI-372 — Codacy: "This component is becoming too large and complex"). Split upfront during **Implement**, not as a follow-up PR:

| Extract | File | Trigger |
|---------|------|---------|
| Search + filter chips | `<feature>-header.tsx` | Header owns its own input/chip state via props, not inline JSX in the workspace |
| `EmptyState` / `ErrorState` / `NoMatchState` | `<feature>-states.tsx` | Any state with its own copy + CTA — one component per state, not a ternary chain |
| Skeleton | keep in workspace file or `loading.tsx` | Usually fine inline — only extract if it duplicates >20 lines elsewhere |

Rule of thumb: if the workspace component exceeds **~150 lines** or has **3+ inline state branches**, extract before requesting review. Keep the workspace file to orchestration (state hooks, `useMemo` filter, composing the pieces) — same testids/roles so existing tests don't need to change.

Don't extract to a *shared cross-screen* component (e.g. merging with `brand-list-workspace.tsx`) in the same PR — that's a separate concern per one-concern-per-PR; log it as a follow-up instead.

---

## States checklist (every workspace)

Per `tasks/design-docs/docs/handoff/08-state-map.md`:

- [ ] **Loading** — skeleton grid (not blank)
- [ ] **Empty portfolio** — DC empty with CTA (not generic card)
- [ ] **No matches** — search/filter empty (distinct copy)
- [ ] **Error** — message + retry (not red banner only)
- [ ] **Populated** — grid matches DC columns/gap/radius
- [ ] **Honest data** — no fake DNA scores or counts (see production-readiness.md)

---

## Verification commands

```bash
cd app && npm run lint && npm test && npx tsc --noEmit && CI=true npm run build
npx playwright test e2e/shoots-list.spec.ts --project=chromium-desktop
```

Browser: DC @ `:8765` vs React @ `:3002/app/shoots` — screenshot 1280 + 390.

---

## Related skills

| Skill | When |
|-------|------|
| `design-md` | HITL, 3-panel contract, tokens |
| `vercel-react-best-practices` | Performance review on workspace |
| `nextjs-developer` | App Router hub (RSC, routing, actions) |
| `task-verifier` | Forensic gate before Done |
| `ipix-task-lifecycle` | Linear A–E + proof commands |
