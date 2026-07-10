# Operator App Navigation

**Purpose:** Show the real left-nav rail items and the two top-level route groups they sit inside.

## Explanation

The app has exactly two Next.js route groups: `(marketing)` (public site, no auth) and `(operator)` (the authenticated 3-panel product, wrapped by `OperatorPanel`/`OperatorShell`). The nav rail itself is a single hard-coded array (`NAV` in `app/src/components/operator-panel/nav-sidebar.tsx:13-21`) with exactly 7 items. Three operator routes exist on disk (`onboarding`, `preview`, and brand's own list page) but are **not** in that array — they're reached by deep link/flow redirect, not the persistent nav. Planner has no nav entry because it has no route yet.

## Diagram

```mermaid
flowchart TD
    Root(("Next.js root layout"))
    Root --> Marketing["(marketing) route group\nno auth, public site"]
    Root --> Operator["(operator) route group\nauthed, OperatorPanel shell"]

    Marketing --> MLogin["/login"]
    Marketing --> MServices["/services/* (9 static pages)"]
    Marketing --> MHome["/ (landing)"]

    Operator --> NavSidebar["NavSidebar\n(nav-sidebar.tsx — 7 hard-coded items)"]

    NavSidebar --> N1["Home → /app"]
    NavSidebar --> N2["Shoots → /app/shoots"]
    NavSidebar --> N3["CRM → /app/crm (routes to /app/crm/companies)"]
    NavSidebar --> N4["Brand → /app/brand"]
    NavSidebar --> N5["Assets → /app/assets"]
    NavSidebar --> N6["Campaigns → /app/campaigns (UI stub, schema-only)"]
    NavSidebar --> N7["Matching → /app/matching"]

    Operator -.not in NavSidebar, reached by flow/deep-link only.-> Onboarding["/app/onboarding"]
    Operator -.not in NavSidebar.-> Preview["/app/preview"]

    Operator -.no route exists yet — design-prompt only.-> Planner["/app/planner (NOT BUILT)"]
```

## Related Linear issues

`IPI-476`–`IPI-484` (Planner backend + UI epic — explains why Planner has no nav entry: no route exists yet, only Claude Design prompts `SCR-32`–`SCR-35`).

## Related PRD section

`prd.md` §6.7 (Planner — route not built), §3 (3-panel shell). Ground truth: `app/src/components/operator-panel/nav-sidebar.tsx:13-21`, `tasks/plan/audit/00-repo-ground-truth.md` §1.
