# Linear Audit — Cloudflare Migration & AI Gateway / Model Providers

## Stack 01 — Cloudflare migration (score 48/100 🟡)

**Verified against:** `origin/main`, `gh pr list/view`, `tasks/cloudflare/todo.md`, `tasks/cloudflare/CLOUDFLARE-EPIC.md`. Cloudflare-side live infrastructure (Workers deployments, KV namespaces, AI Gateway prod traffic) could **not** be verified — the Cloudflare MCP tools require OAuth not available in this session. All findings below are repo-config-only unless a PR/commit is cited.

### Priority issues (10)

| Dot | Task | Current status | Correct status | Action | Exact correction | Blocker |
|---|---|---|---|---|---|---|
| 🟡 | IPI-469 — CF-000 Cloudflare Platform Architecture | In Review | In Review (strip "Complete") | rewrite | Doc is at `tasks/cloudflare/plan/cf-000-platform-architecture.md` (169 lines, content real), **not** `tasks/cloudflare/cf-000-platform-architecture.md`. Commit `20881a0a` is not an ancestor of `origin/main` — content only reachable via open PR #271. Remove "✅ Complete — decision document delivered," fix the path, say "awaiting merge of PR #271." | PR #271 |
| 🔴 | IPI-471 — AGENT-001 AI Agent Architecture | In Progress | In Progress | rewrite | Claims "✅ Complete — document delivered," proof `docs/architecture/ai-agent-architecture.md` (322 lines). File does not exist on `origin/main` or any merged branch — only inside open PR #271 (commit `35f9dae0`, confirmed not-ancestor). Remove "Complete" language until PR #271 merges. | PR #271 |
| 🟡 | IPI-487 — CLOUDFLARE-EPIC | In Progress | In Progress | rewrite | Progress table (CF-MIG-210 shown 25%, overall ~55%) disagrees with `tasks/cloudflare/todo.md` (same task shown 85% via open PR #286, CI green; overall ~58%). Re-sync to one source of truth — two docs shouldn't disagree by 30 points on the same line item. | doc-sync only |
| 🟡 | IPI-465 — AGENT-002 Shared AI Tool Registry | In Progress | In Progress | rewrite | No tool-registry implementation exists anywhere in `app/`/`services/` (only diagram docs). AC "every tool call logged to `ai_agent_logs`" cannot be met — **no `ai_agent_logs` table exists in any migration.** Note: this issue was miscategorized out of the automated stack extraction entirely on the first pass despite being the SSOT cited by `prd.md`/`ai-agent-architecture.md`/diagram 05 — re-verify it's correctly filed. | needs new migration for `ai_agent_logs` |
| 🟡 | IPI-461 — CF-AI-004 AI Provider Adapter | In Progress | In Progress | rewrite | Claims "Unit tests (14+)" — verified only **1 file, 5 `it()` blocks, 58 lines** (`services/cloudflare-worker/src/index.test.ts`). Correct the count. Gateway Worker adapter/router confirmed real and merged (PR #279, commits `65d674c5`/`503c47fb` on `origin/main`). `AI_GATEWAY_URL` still zero references in `app/src` — correctly "not wired." | IPI-454 AC-F |
| 🟡 | IPI-457 — CF-AI-005 Unified AI Provider Types & Registry | In Progress | In Progress | keep | Verified accurate: `app/src/lib/ai/model-registry.ts` genuinely missing on `main` (only `provider.ts`/`provider.test.ts`/`types.ts`/`gemini-registry.ts` exist). Work is on the same branch/PR #271 as IPI-469/471. | PR #271 |
| 🟡 | IPI-454 — CF-AI-001 AI Gateway Cloudflare Provider Routing | In Progress | In Progress | keep | AC-C merged (PR #279, confirmed `MERGED`). AC-F (`resolveModel()` → gateway) confirmed not done — zero `AI_GATEWAY_URL` refs anywhere. No text changes needed. | AC-F implementation |
| 🔴 | IPI-486 — MASTRA-EPIC | Todo | **In Progress** | reopen/rewrite | Own body shows multiple Done children (IPI-129, 132–135, 278, CF-MIG-110/PR #282 merged) and one active (IPI-457). An epic with Done + active children shouldn't sit at Todo. | none |
| ⚪ | IPI-472 — INFRA-001 Cloudflare Worker Deployment Pipeline | Todo | Todo | keep | Verified: no `wrangler deploy` step anywhere in `.github/workflows/ci.yml`. Description accurately describes target-state — no correction needed. | IPI-454 AC-F, IPI-465 |
| ⚪ | IPI-468 — SEC-001 Cloudflare AI Security Architecture | Todo | Todo | keep | Design-doc task, correctly not started. Note for scoping: the OAuth host-trust allowlist fix belongs here — don't open a new issue for it. | none |

### Close/cancel — verified correct, no action

IPI-107, IPI-106, IPI-464, IPI-182 — all explicitly "merged into successor" cancellations with the successor confirmed present and active (IPI-457, IPI-460, IPI-462, IPI-463 respectively).

### Rewrite candidates

- **IPI-469 + IPI-471** — consider merging into one "unblock PR #271" correction since both overstate completion for the exact same unmerged branch.
- **IPI-487** — resync progress table to `tasks/cloudflare/todo.md` (fresher, has live PR links).

### Missing tasks (verified gaps, no new issue needed — already tracked or out of scope to author)

- No CI job builds the OpenNext bundle (matches existing CF-MIG-111 line item, 0%).
- No rollback script exists anywhere — only an archived doc (`docs/architecture/diagrams/archive/49-rollback-strategy.md`). Matches CF-MIG-810 (0%).
- No `ai_agent_logs` table — blocks IPI-465's own AC and would also gate IPI-460 (cost tracking). Not a new task; call it out explicitly inside those two issues.

### Rest batch (14 issues) — patterns

10 Backlog architecture/research spikes (IPI-474, 473, 470, 467, 466, 463, 462, 460, 459, 458) are all genuine pre-work with no code yet, correctly gated behind IPI-454/461 landing first — accurately modeled, no corrections needed.

### Unverifiable this pass

PR #286 (CF-MIG-210)'s "CI green" claim (from `todo.md`, not independently re-run); live Cloudflare infrastructure state (Workers/KV/Gateway traffic — no MCP access this session); the IPI-223/225–230/231/233/234 chain referenced as blockers inside stack-14 issues (outside this stack's dataset).

---

## Stack 02 — AI Gateway and model providers (score 78/100 🟡)

Only 1 issue met the "priority" (non-Backlog/Canceled) bar in this stack; the 20-item Groq/Gemini "rest" batch is already accurately self-documented.

### Priority issues (1)

| Dot | Task | Current status | Correct status | Action | Exact correction | Blocker |
|---|---|---|---|---|---|---|
| 🟢 | IPI-428 — BUILD-GROQ-CONFIG Turbopack groq-models.json import boundary | Done | Done | keep | Verified: `app/src/lib/ai/provider.ts`'s `findGroqModelsConfigPath` walks up from `MODULE_DIR` dynamically (not a fixed relative depth), exactly as described. | none |

### Rest batch (20 issues) — patterns

Almost entirely GEMINI-*/GROQ-* issues, Canceled with roadmap-change rationale ("Groq removed," "replaced by Cloudflare Workers") — internally consistent, matches current `provider.ts` state (still direct Gemini/Groq calls, zero `AI_GATEWAY_URL` refs, reconfirmed). One near-duplicate worth linking rather than leaving to drift: **IPI-10** ("Gemini tool/function registry, declare-once schemas") heavily overlaps IPI-465's now-active scope — recommend marking IPI-10 related-to/superseded-by IPI-465.

### Cross-reference

IPI-465 (Shared AI Tool Registry) is filed under stack 01 in this report (project "AI Platform — LLM Providers," same project as several stack-02 issues) — see stack 01 above for its full treatment. Don't audit it twice; this note exists so it isn't missed when reading stack 02 in isolation.
