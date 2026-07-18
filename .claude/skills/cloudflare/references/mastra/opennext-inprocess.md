# Mastra in-process (OpenNext + Cloudflare Workers)

iPix runs Mastra **inside** the OpenNext Worker — not as a separate Mastra deploy target.

---

## Layout

| Piece | Path |
|-------|------|
| Registry + lazy init | `app/src/mastra/index.ts` |
| Agents | `app/src/mastra/agents/` |
| Model resolution | `app/src/lib/ai/provider.ts` → re-exported from `@/mastra/models` |
| Marketing chat (public) | `app/src/app/api/marketing-chat/[[...slug]]/route.ts` |
| Operator CopilotKit | `app/src/app/api/copilotkit/[[...slug]]/route.ts` |
| Wrangler (OpenNext) | `app/wrangler.jsonc` |
| Build | `npx opennextjs-cloudflare build` · preview `:8787` |

---

## Wrangler essentials (`app/wrangler.jsonc`)

- `nodejs_compat` — required for Node APIs Mastra deps use
- `alias` for `@ast-grep/napi` stub — native module breaks rebundle
- **No `ai` binding yet** — optional; HTTP to Workers AI or AI Gateway worker instead
- Secrets at runtime: `GEMINI_API_KEY`, `DATABASE_URL`, `GROQ_API_KEY` (not `NEXT_PUBLIC_*`)

---

## Storage

| Store | Workers-safe? | iPix choice |
|-------|:-------------:|-------------|
| `PostgresStore` + Supabase `DATABASE_URL` | ✅ | Primary (threads, workflow state) |
| `LibSQLStore` with `file:` URL | ❌ | **Never** on Workers — ephemeral FS |
| In-memory / no store | ✅ | Public marketing route (no thread persistence) |

Ephemeral filesystem rule from [Mastra CF deploy guide](https://mastra.ai/guides/deployment/cloudflare): any file-backed storage must use remote DB.

---

## Route handler rules

1. **Never** call `getMastra()` at module top-level in route files — only inside the handler body.
2. CopilotKit on Workers: use `hono/cloudflare-workers` adapter (not `hono/vercel`).
3. Avoid barrels that pull Express at import time (`@copilotkit/runtime/v2`).

---

## Local verify

```bash
cd app
rm -rf .next .open-next
npx opennextjs-cloudflare build
npx opennextjs-cloudflare preview -- --port 8787
# POST /api/marketing-chat — expect 200 + streamed reply
curl -s http://127.0.0.1:8787/api/marketing-chat -X POST ...
```

Full matrix: [`tasks/cloudflare/migration/startup.md`](../../../../tasks/cloudflare/migration/startup.md).

---

## Env: build vs runtime (OpenNext)

Per [OpenNext env howto](https://opennext.js.org/cloudflare/howtos/env-vars):

| Class | Examples |
|-------|----------|
| Build + runtime | `NEXT_PUBLIC_SUPABASE_*`, `SITE_URL` |
| Runtime secrets only | `GEMINI_API_KEY`, `DATABASE_URL`, `AI_GATEWAY_URL` |

`wrangler secret bulk` alone is insufficient for client-inlined vars — set Workers **Build variables** too.
