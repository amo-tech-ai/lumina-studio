# Platform sources (load when task touches them)

Prefer **Dashboard → CLI → official docs → official examples → SDK → iPix reuse → custom**.

| Platform | First stops |
|----------|-------------|
| **Claude Code / Cursor** | `CLAUDE.md`, `.claude/skills/`, `.cursor/rules/`, hooks — don’t grow always-on docs |
| **GitHub** | Our PRs + vendor org examples/templates (last 30 days when possible) |
| **Linear** | `docs/linear/issues/`, MCP/`LINEAR_API_KEY`, task template in `docs/process/templates/` |
| **Cloudflare Workers** | Dashboard · Wrangler · Workers AI · AI Gateway · `services/cloudflare-worker/` · `cloudflare-workflow` skill · Cloudflare MCP docs |
| **Cloudflare hosting** | Pages/Workers hosting docs · OpenNext notes in `tasks/cloudflare/` — confirm cutover status before assuming Workers host `/app` |
| **Supabase** | Dashboard · CLI · RLS advisors · `ipix-supabase` skill · remote-only policy |
| **Mastra** | Official Mastra docs · `app/src/mastra/` · `mastra` skill · RAG only if needed |
| **CopilotKit** | v2 `/v2` docs · `app/src/app/api/copilotkit/` · `copilotkit` skill |
| **Playwright** | Existing app e2e · Playwright docs · MCP Chrome for exploratory QA |
| **Infisical** | `infisical run --env=dev` · never commit secrets · `infisical` skill |
| **Stripe** | Dashboard · Stripe API docs · COM/marketplace paths — not ad-hoc charge code |
| **Postiz** | Official docs/GitHub — treat as **candidate**; prefer existing social/publish paths first |
| **Xpoz** | Competitive/research only unless product decision says integrate |

## Quick commands

```bash
graphify query "<topic>"
graphify explain "<symbol>"
gh pr list --search "<topic>" --limit 10
# vendor CLIs when authenticated:
# npx wrangler whoami · supabase projects list · infisical secrets --env=dev  # names only
```
