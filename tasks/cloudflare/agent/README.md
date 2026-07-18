# Cloudflare agent prompts & session notes

**Purpose:** Copy-paste prompts and short plans for agents working Cloudflare / Edge AI tasks.  
**SSOT for status:** [`../todo.md`](../todo.md) · Linear project **AI Platform — LLM Providers** · parent epic [IPI-487](https://linear.app/amo100/issue/IPI-487)

| File | Use when |
|------|----------|
| [`1-chat.md`](1-chat.md) · [`2-prompt.md`](2-prompt.md) · [`3-prompt.md`](3-prompt.md) · [`4-chat-notes.md`](4-chat-notes.md) · [`chat-plan.md`](chat-plan.md) | Restored session notes / prompts (OpenNext + CF migration) |
| [`5-cf-edge-plan.md`](5-cf-edge-plan.md) | Executing **IPI-694** · CF-EDGE-AI (Supabase Edge → Cloudflare LLM) |
| [`6-cf-edge-prompt.md`](6-cf-edge-prompt.md) | Starting an agent on CF-EDGE-001…005 — paste as first message |
| Task specs | [`../Tasks/060-CF-EDGE-AI-epic.md`](../Tasks/060-CF-EDGE-AI-epic.md) and `061`–`065` |

**Restored:** 2026-07-18 from `stash@{0}` untracked tree (`stash@{0}^3`) — also `cli/`, `linear/`, `docs/`, `archive/`, `Tasks/audit|data|docs|phases|plan`.

## Hard rules (every agent session)

1. One concern per PR — never mix docs + production code.
2. Never `supabase functions deploy --prune`.
3. Edge runs on **Supabase Deno** — it cannot use Workers `env.AI` bindings. LLM = **HTTPS** to Cloudflare AI Gateway (`ipix-prod` OpenAI-compat), then Workers AI.
4. Custom `services/cloudflare-worker/` is **frozen** (2026-07-14) — do not add features there; prefer native gateway URL.
5. Skills: `@cloudflare` · `@cloudflare-workflow` · `@ipix-supabase` · `@ipix-task-lifecycle` · `@mermaid-diagrams`
