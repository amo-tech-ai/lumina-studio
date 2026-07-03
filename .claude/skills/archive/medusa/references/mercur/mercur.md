---
name: Mercur Marketplace
description: >
  Mercur/Medusa marketplace hub for my-marketplace/. Use whenever working on MercurJS,
  COM-010, registry blocks, Mercur CLI (search/view/add/diff), seller seeds, medusa-config,
  admin or vendor dashboards (src/routes), forms, tabbed wizards, @medusajs/ui conformance,
  or Mercur 1.x→2.0 migration — even if the user only says checkout, seller, block, or
  admin page. Always load this skill for any my-marketplace/ task before inventing custom code.
version: 2.0.0
---

# Mercur Marketplace Hub

Single entry point for **Mercur** work in `my-marketplace/`. Load topic references on demand — do not paste them into responses.

**Not Supabase** — catalog, sellers, checkout, and Stripe live on Mercur Postgres (`:5433`), separate from iPix platform Supabase.

## Read first

- `my-marketplace/CLAUDE.md` — task router, registry-first workflow, verification
- `my-marketplace/AGENTS.md` — CLI quick reference

## Task router

| User intent | Read |
|-------------|------|
| CLI: create, init, search, view, add, diff | [references/cli.md](references/cli.md) |
| Install, update, or verify registry blocks | [references/blocks.md](references/blocks.md) |
| Custom admin/vendor **pages**, routing, list/detail | [references/dashboard-page-ui.md](references/dashboard-page-ui.md) |
| Create/edit **forms**, validation, submit guards | [references/dashboard-form-ui.md](references/dashboard-form-ui.md) |
| **Tabbed** wizards, multi-step flows | [references/dashboard-tab-ui.md](references/dashboard-tab-ui.md) |
| Reusable UI, `@medusajs/ui`, component choice | [references/medusa-ui-conformance.md](references/medusa-ui-conformance.md) |
| Migrate Mercur **1.x → 2.0** | [references/migration.md](references/migration.md) |

### Decision tree

```
my-marketplace task
  ├─ New feature? → search registry first (cli.md) → block match? (blocks.md)
  ├─ Backend API/modules/workflows → packages/api/CLAUDE.md
  ├─ Admin UI → page (dashboard-page-ui) → form? (dashboard-form-ui) → tabs? (dashboard-tab-ui)
  ├─ Any custom UI → medusa-ui-conformance.md first
  └─ Legacy 1.x port → migration.md
```

## Documentation

1. **MCP (preferred):** `mercur` → `https://docs.mercurjs.com/mcp`
2. **Index:** `my-marketplace/docs/mercur/llms.txt`
3. **Full dump:** `my-marketplace/docs/mercur/llms-full.txt`
4. **Refresh:** `bash my-marketplace/scripts/fetch-mercur-docs.sh`

## Hard contracts (starter)

- Custom admin/vendor routes: `src/routes/**/page.tsx` — **not** `src/pages` (`mercurDashboardPlugin` scans `src/routes` only)
- CLI registry commands: project root (where `blocks.json` lives)
- Medusa commands: `packages/api` (`bunx medusa db:generate`, `db:migrate`)
- **Never** accept CLI overwrite of `middlewares.ts` — merge manually (see blocks.md)
- Secrets: Infisical `/mercur/api` — never commit `.env`

## Verification (typical)

```bash
cd my-marketplace/packages/api && yarn build
# seeds (DB + redis):
yarn seed:ipix-catalog   # idempotent
```

After block install or route changes: `bun run dev` from `packages/api`, then admin/vendor `vite build` if UI touched.
