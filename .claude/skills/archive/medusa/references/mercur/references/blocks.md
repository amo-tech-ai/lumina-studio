# Mercur Blocks Workflow

Use when:
- evaluating whether a block fits the starter
- adding or updating a block
- checking installed block impact

## Alias map (`blocks.json`)

- `api` → `packages/api/src`
- `admin` → `apps/admin/src`
- `vendor` → `apps/vendor/src`

Evaluate impact by alias destination, not block name alone.

## Workflow

1. Search if block name unknown (`cli.md`).
2. View the block before install.
3. Identify aliases and workspaces touched.
4. Add the block.
5. When CLI asks to overwrite `middlewares.ts` — **decline**; merge manually.
6. Inspect installed files and block docs output.
7. Apply all config from docs (middleware, medusa-config, env, migrations).
8. Run `bun run dev` from `packages/api` and fix startup errors.

## Post-install checklist

- Files under `packages/api/src`, `apps/admin/src`, or `apps/vendor/src`?
- `medusa-config.ts` needs module/provider registration?
- Middleware in `src/api/middlewares.ts` — verify **actual** export names and paths.
- Custom modules → `db:generate` + `db:migrate` (check `models/` even if docs omit this).
- UI routes under `src/routes/` (not `src/pages/`).
- Sidebar pages need `export const config: RouteConfig`.
- Env vars, plugin options, npm deps installed?

## Known block-doc issues

Verify against installed files — docs may be wrong on:
- middleware import paths and export names
- missing npm dependencies
- missing migration steps
- workflow hook file conflicts (decline overwrites, merge manually)

## Middleware merging

1. Read installed middleware file for export name and path.
2. Import into existing `middlewares.ts`.
3. Spread into existing `routes` array.

Do **not** accept CLI full-file overwrite.

## Commands

```bash
npx @mercurjs/cli@latest search --query <keyword>
npx @mercurjs/cli@latest view <block>
npx @mercurjs/cli@latest add <block>
npx @mercurjs/cli@latest diff <block>
```

CLI from project root; medusa DB commands from `packages/api`.
