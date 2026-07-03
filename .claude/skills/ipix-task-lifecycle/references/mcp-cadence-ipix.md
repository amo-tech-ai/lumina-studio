# MCP cadence — iPix (verify before execute / before Done)

| Surface | MCP | Verify |
|---------|-----|--------|
| Supabase Edge Functions | `@supabase` `search_docs`, `list_edge_functions`, `get_edge_function`, `deploy_edge_function` | `Deno.serve`, CORS, JWT, secrets |
| Supabase DB / RLS | `@supabase` `list_tables`, `execute_sql`, `list_migrations`, `get_advisors` | Column names, RLS policies |
| Gemini API | `user-gemini-api-docs-mcp` `fetch_docs` | Models, urlContext, structured output, vision |
| Vite env | Disk: `src/lib/env.ts`, `.env.example` | `import.meta.env.VITE_*` only in client |
| Linear | GraphQL + `LINEAR_API_KEY` | Issue description matches repo markdown |

**iPix project ref:** `nvdlhrodvevgwdsneplk`

**Official refs:**
- Supabase Edge Functions: https://supabase.com/docs/guides/functions
- Gemini URL Context: https://ai.google.dev/gemini-api/docs/url-context
- Gemini Structured Output: https://ai.google.dev/gemini-api/docs/structured-output
- Gemini Image Understanding: https://ai.google.dev/gemini-api/docs/image-understanding
- Vite env: https://vite.dev/guide/env-and-mode
