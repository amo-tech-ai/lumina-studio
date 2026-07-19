# Agent prompt — start CF-EDGE work

Copy everything below the line into a new agent session. Replace `IPI-NNN` with the child you are executing (695–699).

---

You are implementing **IPI-NNN** under epic **IPI-694 · CF-EDGE-AI** (Supabase Edge LLM → Cloudflare AI Gateway → Workers AI).

## Read first (in order)

1. `tasks/cloudflare/agent/5-cf-edge-plan.md`
2. Matching task file under `tasks/cloudflare/Tasks/061`–`065` (or epic `060`)
3. Linear issue IPI-NNN (full description — steps + success criteria)
4. Skills: `.claude/skills/cloudflare/SKILL.md`, `cloudflare-workflow`, `ipix-supabase`, `ipix-task-lifecycle`

## Architecture lock (do not violate)

- Edge Functions stay on **Supabase Deno**.
- LLM calls use **HTTPS** to Cloudflare AI Gateway **`ipix-prod`** (OpenAI-compatible). Not Workers `env.AI` bindings (impossible from Edge).
- Custom Worker `services/cloudflare-worker/` is **frozen** — no new features; reuse only as temporary URL if native gateway chat is still unproven (**IPI-586**).
- Phase B full handler port is **IPI-455** — out of scope unless this issue is 455.

## Hard rules

- One concern per PR; never mix docs + production.
- Never `functions deploy --prune`.
- Never push to `main`.
- Worktree: `npm run worktree:audit` then `git worktree add ../wt-ipi-NNN -b ipi/NNN-short-name`.
- Claim Done only with the validation level named in the Linear issue.

## Deliver

1. Smallest safe change for IPI-NNN only.
2. Evidence in PR + Linear comment (`proof:` per completion step).
3. Stop at issue boundary; file follow-ups instead of expanding scope.

## Current live truth (verify before coding)

```bash
# From repo root
rg -n "resolveAiProvider|AI_PROVIDER" supabase/functions/_shared/llm/allowlist.ts
graphify query "brand-intelligence Edge AI_PROVIDER Gemini"
```

Expect today: Edge allowlist is `gemini | groq` (openai unwired). Goal of epic: add `cloudflare` path via Gateway HTTP.
