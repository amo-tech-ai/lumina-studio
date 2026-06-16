# Dashboard Page UI

Use when:
- adding pages under `apps/admin/src/routes` or `apps/vendor/src/routes`
- extending list or detail pages
- adding page actions, sections, or empty states

Applies to **admin** and **vendor** — same component library and routing.

## First checks

- Routes under `src/routes` (**not** `src/pages` — `mercurDashboardPlugin` scans `src/routes` only).
- Page vs form vs tab — load [dashboard-form-ui.md](dashboard-form-ui.md) or [dashboard-tab-ui.md](dashboard-tab-ui.md) as needed.
- Before custom UI → [medusa-ui-conformance.md](medusa-ui-conformance.md).

## Hard rules

1. i18n for all user-facing strings.
2. Obvious file-based routing folder structure.
3. Explicit loading, empty, error, success states.
4. Match existing page patterns — don't invent new anatomy.
5. Clear header structure for actions.
6. Never place routes in `src/pages`.

## Sidebar navigation

```tsx
import type { RouteConfig } from "@mercurjs/dashboard-sdk";
import { Star } from "@medusajs/icons";

export const config: RouteConfig = {
  label: "My Page",
  icon: Star,
};
```

Without `config`, page is URL-only (no sidebar entry).

## List page

`_DataTable`, `SingleColumnPage`, `useDataTable` from `@mercurjs/dashboard-shared`:

- `SingleColumnPage` wrapper
- `Container` + heading + Create `Link`
- `_DataTable` with pagination, search, filters, orderBy, noRecords
- `navigateTo` for row → detail

## Detail page

`TwoColumnPage` with `.Main` and `.Sidebar`:

- `SectionRow` for key-value pairs
- `StatusBadge` for statuses only — never `Badge`
- Plain text for categories/types/descriptions
- `ActionMenu` with `groups`; destructive actions in separate group
- `showJSON` / `showMetadata` when appropriate

## Create page

`src/routes/<entity>/create/page.tsx` — `RouteFocusModal` overlay:

```tsx
const CreatePage = () => (
  <RouteFocusModal>
    <CreateForm />
  </RouteFocusModal>
);
export default CreatePage;
```

Form details → [dashboard-form-ui.md](dashboard-form-ui.md) or [dashboard-tab-ui.md](dashboard-tab-ui.md).

## Edit drawer

**Critical:** `@` prefix for parallel route:

- Correct: `src/routes/<entity>/[id]/@edit/page.tsx`
- Wrong: `src/routes/<entity>/[id]/edit/page.tsx`

Detail page needs `hasOutlet` on `TwoColumnPage`. Use `RouteDrawer` + `useRouteModal().handleSuccess`.

## Routing layout

- Detail: `src/routes/<entity>/[id]/page.tsx`
- Create: `src/routes/<entity>/create/page.tsx`
- Edit drawer: `src/routes/<entity>/[id]/@edit/page.tsx`

## Verification

- Route resolves; sidebar shows if `config` exported
- Copy translation-ready
- StatusBadge vs plain text correct
- App build/lint after non-trivial changes
