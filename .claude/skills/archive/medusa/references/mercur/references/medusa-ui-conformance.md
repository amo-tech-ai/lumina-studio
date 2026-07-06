# Medusa UI Conformance

Use when:
- adding custom admin or vendor UI
- choosing components for overlays, menus, selectors, tables
- reviewing reusable dashboard components

## Component priority

1. `@mercurjs/dashboard-shared` (TabbedForm, _DataTable, SingleColumnPage, TwoColumnPage, RouteFocusModal, Form, …)
2. `@medusajs/ui` (Button, Input, Container, StatusBadge, toast, …)
3. Compose the above
4. Lower-level primitive only if genuinely needed

## dashboard-shared exports

**Layout:** `SingleColumnPage`, `TwoColumnPage` (.Main, .Sidebar), `SectionRow`  
**Data:** `_DataTable`, `useDataTable`, `DataGrid`  
**Modal:** `RouteFocusModal`, `RouteDrawer`, `StackedFocusModal`, `StackedDrawer`  
**Form:** `Form`, `TabbedForm`, `TabbedForm.useForm`  
**Actions:** `ActionMenu`  
**Hooks:** `useRouteModal`, `useStackedModal`, `useTabManagement`, `useQueryParams`

## @medusajs/ui

**Input:** Button, Input, Textarea, Select, Checkbox, Switch, RadioGroup  
**Layout:** Container, Heading, Text, Table, Tabs, ProgressTabs  
**Status:** `StatusBadge` — statuses with colored dot  
**Tags:** `Badge` — counts/tags only, never statuses  
**Feedback:** toast · **Icons:** `@medusajs/icons`

## Usage rules

| Need | Use |
|------|-----|
| published, draft, active | `StatusBadge` (color: green/orange/red/blue/grey) |
| counts, tags | `Badge` |
| category, type, name | plain text |
| Detail key-value | `SectionRow` |
| Row/detail actions | `ActionMenu` with `groups` |
| Multi-step form | `TabbedForm` — not raw `ProgressTabs` |
| Data table | `_DataTable` — not custom `Table` |

## Hard rules

1. No custom dropdowns/dialogs/drawers/tabs/selects if `@medusajs/ui` covers it.
2. No custom tabbed forms or data tables.
3. No new shared component when a wrapper already exists.
4. Custom UI needs keyboard, focus, i18n.
5. No one-off visual language fighting the dashboard.
6. Never `Badge` for status; never wrap descriptive text in badges.

## Decision checks

- dashboard-shared export exists?
- `@medusajs/ui` direct solve?
- Compose before building?
- Is a new component truly reusable?

## Verification

- Lint/build for touched app
- Keyboard/focus on non-trivial interactions
- StatusBadge vs Badge vs plain text

Related: [dashboard-page-ui.md](dashboard-page-ui.md), [dashboard-form-ui.md](dashboard-form-ui.md), [dashboard-tab-ui.md](dashboard-tab-ui.md)
