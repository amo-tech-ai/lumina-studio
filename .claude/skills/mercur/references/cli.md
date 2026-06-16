# Mercur CLI

Use when:
- creating a new Mercur project
- initializing `blocks.json`
- searching, viewing, adding, or diffing blocks
- deciding whether a command runs from project root or a workspace

## Command map

- `create` — create a new Mercur project
- `init` — create `blocks.json` in an existing project
- `search` — search the registry
- `view` — inspect a block before installation
- `add` — install a block
- `diff` — compare local installed block files against the registry

## Where commands run

- Registry commands (`search`, `view`, `add`, `diff`) from **project root** where `blocks.json` lives.
- `medusa` commands (`db:generate`, `db:migrate`) from `packages/api` using `bunx medusa`.
- Admin or vendor verification from `apps/admin` or `apps/vendor`.

## Common flows

### Discover and inspect

```bash
npx @mercurjs/cli@latest search --query <keyword>
npx @mercurjs/cli@latest view <block-name>
```

### Add a block

```bash
npx @mercurjs/cli@latest add <block-name>
```

**Important:** When CLI asks to overwrite `middlewares.ts`, always decline (`n`) and merge manually — see [blocks.md](blocks.md).

### Check local drift

```bash
npx @mercurjs/cli@latest diff <block-name>
```

## After `add`

Follow block docs output, but verify against installed files:

1. **Middleware** — correct export name/path → `src/api/middlewares.ts`
2. **medusa-config.ts** — modules, providers, plugin options
3. **Migrations** — if module has `models/`: `bunx medusa db:generate <module>` + `db:migrate`
4. **Dependencies** — `bun add <package>` in the correct workspace if dev server fails
5. **Env vars** — add to `.env`
6. **Validation** — `bun run dev` from `packages/api` before moving on

## Known CLI behaviors

- "You need to create a blocks.json" — usually wrong working directory.
- `search --query ""` returns all blocks.
- Block file overlap — decline overwrites to preserve existing work.

## Avoid

- registry commands outside project root
- guessing block names without `search` or `view`
- accepting `middlewares.ts` overwrite
- skipping dev server validation after install
