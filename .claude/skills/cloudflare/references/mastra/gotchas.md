# Mastra on Cloudflare — gotchas (iPix)

Repo-enforced rules from `CLAUDE.md` and production preview debugging.

---

## Build time

### `DATABASE_URL` during `next build`

Next.js imports Mastra modules at build even for `force-dynamic` routes. `getMastraStorage()` throws if `NODE_ENV=production` and `DATABASE_URL` is unset.

**Fix:** guard storage init with `&& !process.env.CI` so CI uses no-op stub.

### `getMastra()` import time

Top-level `getMastra()` in route files runs at import → breaks build or cold start.

**Fix:** call only inside handler body. Registry uses Proxy defer pattern in `app/src/mastra/index.ts`.

### `mastra dev` CLI

Requires `export const mastra` (named export). Proxy wraps `getMastra()` for lazy init.

---

## Workers runtime

### LibSQL `file:` URLs

Workers FS is ephemeral. `LibSQLStore(":memory:")` or file paths fail or lose data.

**Fix:** PostgresStore + Supabase, or omit storage on public routes.

### `readFileSync` for config

`config/groq-models.json` via `node:fs` breaks when `AI_PROVIDER=groq` on Workers.

**Fix:** ancestor walk (IPI-428) or bundle JSON / KV — prefer gateway registry long-term.

### Native modules

`@ast-grep/napi` — stub via `wrangler.jsonc` `alias`.

### Express in CopilotKit barrel

`@copilotkit/runtime/v2` may import Express at top level.

**Fix:** fetch-only runtime helper + turbopack aliases (see `runtime-v2-fetch.ts`).

---

## Inference

- All Gemini calls **server-only** — never `NEXT_PUBLIC_GEMINI_*`.
- Vision tier stays on Gemini until golden eval (Groq or Workers AI vision).
- Marketing chat on preview still uses Gemini until IPI-454 + IPI-462 complete.

---

## Observability

Benign wrangler log when storage omitted:

`No memory is configured but resourceId and threadId were passed`

Expected on public marketing route without Mastra storage.
