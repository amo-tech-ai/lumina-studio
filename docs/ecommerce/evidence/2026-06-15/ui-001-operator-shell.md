# UI-001 — Operator Hub Shell Evidence

**Date:** 2026-06-15  
**Linear:** [IPI-22](https://linear.app/ipix/issue/IPI-22) · UI-001  
**Branch:** `ipi/ui-001-operator-shell`

---

## Summary

Implemented 3-panel Operator Hub shell with canonical MVP routes. No CopilotKit, Mastra, or AI runtime.

---

## Files added/changed

| Path | Change |
|------|--------|
| `src/layouts/OperatorLayout.tsx` | 3-panel layout with `<Outlet />`, CSS mobile nav (no flicker) |
| `src/components/operator/OperatorNav.tsx` | Left navigation 240px |
| `src/components/operator/IntelligencePanel.tsx` | Right placeholder 320px |
| `src/components/operator/PlaceholderScreen.tsx` | Center placeholder cards |
| `src/pages/dashboard/*.tsx` | 7 route screens |
| `src/App.tsx` | Nested `/dashboard/*` routes |
| `src/pages/Dashboard.tsx` | Removed (replaced by layout) |
| `docs/linear/issues/IPI-22-UI-001.md` | Spec + checklist |

---

## Route map

| Route | Component |
|-------|-----------|
| `/dashboard` | `CommandCenterPage` |
| `/dashboard/brand` | `BrandHubPage` |
| `/dashboard/brand/intake` | `BrandIntakePage` |
| `/dashboard/assets` | `AssetsPage` |
| `/dashboard/products` | `ProductsPage` |
| `/dashboard/analytics` | `AnalyticsPage` |
| `/dashboard/settings` | `SettingsPage` |

All routes wrapped in `ProtectedRoute` → `OperatorLayout`.

---

## Verification

```bash
npm ci          # ✅
npm run check:env  # ✅ check-client-env: OK
npm run build   # ✅
npm run test    # ✅
```

### Build output

```
✓ 2254 modules transformed.
✓ built in 2.78s
```

### Test output

```
Test Files  2 passed (2)
     Tests  2 passed (2)
```

---

## Out of scope (confirmed)

- No `@copilotkit/*` dependencies
- No `services/agent/` Mastra runtime
- No edge function changes
- No brand-intelligence UI wiring (UI-002)

---

## Screens

Manual smoke at `http://localhost:8080/dashboard` (auth required):

- [ ] Left nav highlights active route
- [ ] Command Center shows proof placeholder cards
- [ ] Right panel shows context + disabled quick actions
- [ ] All 7 nav links render without console errors

---

## Next task

**IPI-23 · UI-002** — Brand intake form + `brandIntelligenceService` (do not start until UI-001 PR merges).
