# iPix PR-Agent Expert Checklists

> **Who runs this:** consumed by PR-Agent (pinned Action SHA `01569655…`, Bedrock `qwen.qwen3-coder-next`)
> via `repo_context_files` alongside `AGENTS.md` and `docs/pr-review-guidelines.md`.
> Apply the checklist(s) whose technology the diff touches. Only report findings supported by the
> changed code. Every finding still follows the contract's severity/location/evidence/fix format.
> Maintained by: iPix platform team · task: IPI-661 · PRAGENT-003 (expert guidance).

## Supabase

Check:
- RLS enabled and org-scoped — every tenant-owned table exposed via the Data API needs policies
  **AND** an explicit `grant … to authenticated` in the same migration (IPI-896 revoked default
  privileges). Service-only/reference tables may stay `service_role`-only if access is documented.
- service-role use only on server — never in edge functions exposed to the client, never in `app/` client bundles.
- migrations forward-safe for production data, with rollback/recovery/roll-forward instructions where
  destructive. Monotonic `YYYYMMDDHHMMSS_name.sql` names.
- RPC/function permissions correct — `security invoker`, `set search_path`, explicit `auth.uid()` null check.
- no anon/authenticated privilege leaks, no over-broad grants, no raw secrets in client code.
- `npm run supabase:verify-rls` must pass; remote-only workflow (no local `supabase start`).

## Mastra

Check:
- agent/tool contracts match their Zod schemas; tool inputs/outputs typed and validated.
- registry key = agent `id` = frontend `useAgent({ agentId })` — all three identical
  (`default`, `production-planner`, `creative-director` are required — renaming any drops them is a boot error).
- tool calls authorized — tools must not expose privileged operations to unauthenticated callers.
- durable workflows handle retries/idempotency; `MASTRA_STORAGE_MODE=noop` in Worker builds.
- no hidden long-running blocking calls (Cloudflare Workers / OpenNext `nodejs_compat` limits).
- model/tool errors propagate correctly — no silently swallowed failures.
- state/storage changes are safe; `@mastra/pg`/Hyperdrive usage is deliberate, not accidental.

## CopilotKit

Check:
- server/client boundaries are correct — runtime code stays server-side (`/v2` subpath imports only;
  `MastraAgent` from `@ag-ui/mastra`, not legacy `@copilotkit/runtime`).
- runtime auth is preserved — the `/api/copilotkit` route keeps `withOperatorAuth` + tenant-key gate.
- actions do not expose privileged operations to end users.
- agent state stays synchronized with UI; AG-UI streaming wired per installed versions.
- errors and loading states handled; no stale/invisible failure states.
- no unnecessary large client bundle imports (keep `@copilotkit/*` import paths minimal).

## Cloudflare

Check:
- Workers/OpenNext compatibility — respect `nodejs_compat` and the configured compatibility date;
  `path`/`fs` are NOT automatically defects (runtime tested against actual Worker config).
- no Node-only APIs in Worker paths without build/smoke-test proof.
- bindings/secrets are correct — per-env `vars`, `secrets.required` (GEMINI_API_KEY,
  SUPABASE_SERVICE_ROLE_KEY), AI Gateway / Workers AI / Hyperdrive bindings; Hyperdrive only via
  `getCloudflareContext().env`.
- bundle size impact — watch for large deps pulled into the Worker bundle.
- Hyperdrive/runtime database usage matches the proven config.
- Wrangler config and environment separation are clean.
- failures remain observable, not silently swallowed (head sampling, error propagation).

---

**Intentional non-flags (do NOT report):** Wrangler `alias` stubs (`@ast-grep/napi`, `shiki`, `mermaid`,
`katex`, `@copilotkit/web-inspector`), `@ts-expect-error` on `@mastra/memory` beta types, `nodejs_compat`,
opt-in observability, lockfile churn (ignored via `[ignore]`), duplicate-UI in legacy `src/` (retiring, IPI-89).
