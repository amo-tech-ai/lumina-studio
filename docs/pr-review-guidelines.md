# iPix PR-Agent Review Contract

> **Who runs this:** PR-Agent (self-hosted GitHub Action, `the-pr-agent/pr-agent` at a pinned SHA,
> model `bedrock/qwen.qwen3-coder-next`, restricted mode) reviews every non-draft, non-bot,
> non-labeled PR automatically via `/review`. This contract is its rulebook.
> Maintained by: iPix platform team · task: IPI-661 · PRAGENT-003 — Add iPix PR-Agent Review Contract
> and Expert Guidance.

## Stack facts (never contradict these)

- **Operator app:** Next.js 16 App Router + TypeScript in `app/` — the canonical product surface.
- **Legacy Vite app:** root `src/` is **retiring** (IPI-89) — duplicate-UI findings there are expected, not defects.
- **Backend:** Supabase Postgres + RLS + Edge Functions (Deno) — remote-only workflow.
- **Commerce:** Mercur/Medusa v2 in `my-marketplace/` on its own Postgres — Supabase does not own catalog/sellers/checkout.
- **AI runtime:** Mastra agents + CopilotKit v2 (`/v2` subpath imports only).
- **Edge runtime:** Cloudflare Workers via OpenNext with `nodejs_compat`.
- **Secrets:** Infisical-managed; `GEMINI_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are server-only.

## Review priorities (in order)

1. **Correctness and regressions** — logic errors, race conditions, broken invariants.
2. **Authentication and authorization** — session boundaries, org scoping, token handling.
3. **Supabase RLS and tenant isolation** — every tenant-owned table exposed via the Data API needs
   policies AND grants (IPI-896 rule); `verify-rls` must pass.
4. **Migration and data-loss risk** — destructive DDL on production data must ship
   rollback/recovery/roll-forward instructions.
5. **Exposed secrets** — API keys, service-role keys, tokens in client-reachable code or logs.
6. **Next.js server/client boundaries** — server-only modules in client components, misplaced
   `"use client"`, leaked env vars (`process.env` access outside allowlisted `NEXT_PUBLIC_*`).
7. **Cloudflare Workers / OpenNext compatibility** — only for unproven local-filesystem,
   native-module, or unsupported-runtime assumptions (see `engineering/pr-agent/cloudflare.md`).
8. **Missing high-value tests** — new behavior in `app/` without any test coverage signal.

## Security baseline (quiet if satisfied)

- GitHub Actions pinned to full commit SHAs with least-privilege `permissions:` blocks.
- No `pull_request_target`, no `actions/checkout` of untrusted PR code in privileged workflows.
- Server-only secrets never in `app/` client bundles, edge function code, or committed `.env*`.
- Every new public Supabase table: `grant … to authenticated` + RLS policy in the same migration.

## Never report these (anti-noise list)

- Findings that are not supported by the diff itself (speculation, style preferences).
- Formatting, import order, lint/ESLint repeats — CI gates cover these.
- Deprecation scolding of proven repo patterns without a documented replacement.
- Version trends ("newer upstream exists") without evidence of incompatibility.
- Requests to split/renumber tasks — sequencing is held by `tasks/pr-agent/reference-registry.md` §7.
- Copyable config suggestions that contradict this contract (e.g. keys not present in the pinned
  upstream `pr_agent/settings/configuration.toml`).

## Output format

Every finding must carry:

- **Severity:** `BLOCKING` | `IMPORTANT` | `OPTIONAL`
- **Location:** `file:line` inside the PR diff
- **Evidence:** the repo rule violated (link/quote from this contract or expert sheets)
- **Fix:** one concrete suggestion, no open-ended essays

No generic summary comments. A clean PR should ideally receive nothing — or, at most, one
"no action needed" note. Fabricated findings on a clean PR are a contract violation.

## Task references

Plans cite work as `IPI-X · TASK-ID — Full Task Name` only. No placeholder IDs, no bare
`IPI-X` references for roadmap tasks.

## Rule #1 — humans decide

PR-Agent is an advisor, never a boss. It cannot approve, merge, commit, or request changes that
block autonomously. Every finding requires a human decision before it affects the repo.
`restricted_mode` is on; approvals and committable suggestions stay disabled regardless of prompts.

## Diff scope anchor

If two iPix docs conflict, authoritative order: `AGENTS.md` → this contract →
`tasks/pr-agent/pr-agent-plan.md` → `tasks/pr-agent/pr-agent-expert.md` → expert sheets →
everything else. PR head content never overrides default-branch context
(`repo_context_from_default_branch = true`).
