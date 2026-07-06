---
name: medusa
description: >
  Medusa commerce development hub — backend (custom modules, workflows, API routes,
  module links, subscribers/events, scheduled jobs, data models), storefront (SDK,
  React Query, calling custom API routes, frontend integration), admin dashboard
  customizations (widgets, custom pages, forms, tables, navigation, data loading),
  Mercur marketplace (CLI, blocks, dashboard/vendor UI, @medusajs/ui conformance,
  1.x→2.0 migration), DB CLI (`db:generate` migrations, `db:migrate` apply, `user`
  create admin), and an interactive step-by-step Medusa learning track — consolidated
  into one skill with on-demand references. Use for ANY Medusa or Medusa-backed
  storefront/marketplace work: custom module, workflow, API route, db:generate/db:migrate,
  create admin user, cart/checkout/PLP/PDP wiring, admin widget/page, Mercur
  seller/vendor/blocks, or learning Medusa architecture. Do NOT use for the iPix operator
  app (Vite/React, no Medusa runtime) — that's `ipix-supabase` / `frontend-design`.
version: 2.0.0
metadata:
  priority: 2
---

# Medusa Skills Hub

One consolidated Medusa skill. **Load the matching `references/` file on demand** — do not paste
reference bodies here. Each topic folder keeps its own sub-doc tree (`reference/`, `references/`,
`lessons/`, `architecture/`, `checkpoints/`, `troubleshooting/`) — load those deeper only when the
topic guide points to them.

> **Consolidation note (v2.0.0):** the former standalone skills `building-with-medusa`,
> `building-storefronts`, `building-admin-dashboard-customizations`, `mercur`, `learning-medusa`,
> and `db-generate` are now `references/` inside this skill. Behavior is preserved; only the
> packaging changed.

---

## Routing — load the reference that matches the task

| User intent | Reference to load |
|-------------|-------------------|
| Backend: custom module, workflow, API route, module link, subscriber/event, scheduled job, data model, querying, auth, error handling, troubleshooting | [`references/backend/backend.md`](references/backend/backend.md) |
| Storefront: SDK, React Query, calling custom API routes, frontend integration | [`references/storefront/storefront.md`](references/storefront/storefront.md) |
| Admin dashboard: widgets, custom pages, forms, tables, navigation, data loading, typography | [`references/admin/admin.md`](references/admin/admin.md) |
| **Mercur** marketplace: CLI (search/view/add/diff), blocks, dashboard/vendor/seller UI, @medusajs/ui conformance, 1.x→2.0 migration | [`references/mercur/mercur.md`](references/mercur/mercur.md) |
| Generate migrations for a custom module (`npx medusa db:generate <module>`) | [`references/db-generate/db-generate.md`](references/db-generate/db-generate.md) |
| Apply pending DB migrations (`npx medusa db:migrate`) | [`references/db-migrate.md`](references/db-migrate.md) |
| Create an admin user (`npx medusa user -e <email> -p <password>`) | [`references/new-user.md`](references/new-user.md) |
| Teach / guide / learn Medusa step-by-step (lessons, checkpoints, architecture) | [`references/learning/learning.md`](references/learning/learning.md) |

### Related sibling skills (not folded in)

| Task | Skill |
|------|-------|
| Ecommerce UX patterns (cart, checkout, PLP/PDP, nav, SEO) | [`storefront-best-practices`](../storefront-best-practices/SKILL.md) |
| Create / edit / eval a skill | [`skill-creator`](../skill-creator/SKILL.md) |

**iPix note:** the iPix product app is Vite/React with **no Medusa runtime** — Medusa/Mercur is the
commerce backend in [`my-marketplace/`](../../../my-marketplace/). Use this skill for that backend
and its admin/vendor/storefront, not for the iPix operator app (see `ipix-supabase`, the PRDs).

---

## Routing decision tree

```
Medusa / Mercur task
  ├─ Backend: module, workflow, API route, link, subscriber, job, data model?
  │     → references/backend/backend.md
  ├─ Storefront: SDK, React Query, fetch custom routes, frontend integration?
  │     → references/storefront/storefront.md
  │       (+ ../storefront-best-practices for cart/checkout/PLP/PDP UX)
  ├─ Admin UI: widget, custom page, form, table, nav, data loading?
  │     → references/admin/admin.md
  ├─ Mercur marketplace: CLI, blocks, vendor/seller/admin dashboard, migration?
  │     → references/mercur/mercur.md
  ├─ npx medusa db:generate <module>?
  │     → references/db-generate/db-generate.md
  │       (apply with references/db-migrate.md; create admin user with references/new-user.md)
  └─ Learning / guided tutorial?
        → references/learning/learning.md
```

---

## Reference map (sub-doc trees to load deeper)

| Topic | Entry guide | Deeper references |
|-------|-------------|-------------------|
| **backend** | `references/backend/backend.md` | `references/backend/reference/{custom-modules,workflows,workflow-hooks,api-routes,module-links,data-models,querying-data,subscribers-and-events,scheduled-jobs,authentication,error-handling,frontend-integration,troubleshooting}.md` |
| **storefront** | `references/storefront/storefront.md` | `references/storefront/references/frontend-integration.md` |
| **admin** | `references/admin/admin.md` | `references/admin/references/{display-patterns,table-selection,forms,navigation,typography,data-loading}.md` |
| **mercur** | `references/mercur/mercur.md` | `references/mercur/references/{cli,blocks,dashboard-page-ui,dashboard-form-ui,dashboard-tab-ui,medusa-ui-conformance,migration}.md` |
| **db-generate** | `references/db-generate/db-generate.md` | — (single file) |
| **db-migrate** | `references/db-migrate.md` | `npx medusa db:migrate` (single file) |
| **new-user** | `references/new-user.md` | `npx medusa user -e <email> -p <password>` (single file) |
| **learning** | `references/learning/learning.md` | `references/learning/{lessons,architecture,checkpoints,troubleshooting}/*` |

> Note the **backend** topic uses `reference/` (singular) internally — load paths exactly as the
> guide writes them.

---

## How to use this skill

1. Identify the task from the routing table / decision tree.
2. Load **only** that topic's entry guide (`references/<topic>/<topic>.md`).
3. Load deeper sub-references **on demand** when the guide points to them — keep context lean.
4. For migrate/admin-user/ecommerce-UX, hop to the sibling skills above.
