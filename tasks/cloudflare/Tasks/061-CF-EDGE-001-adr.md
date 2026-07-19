# IPI-695 · CF-EDGE-001 — ADR: Edge stays on Deno; LLM via AI Gateway HTTP

**Linear:** [IPI-695 · CF-EDGE-001](https://linear.app/amo100/issue/IPI-695)  
**Task ID:** CF-EDGE-001  
**Phase:** 1 of 5 (CF-EDGE-AI)  
**Difficulty:** Easy  
**Risk:** Low  
**Estimated time:** 1–2 hours  
**Dependencies:** None  
**PR type:** **Docs-only** (never mix with code)

---

## Purpose

Lock the architecture so agents do not try to give Supabase Edge a Workers `env.AI` binding, and so [IPI-455](https://linear.app/amo100/issue/IPI-455) stays Phase B (full handler port).

### Real-world iPix example

Without this ADR, the next session “migrates Brand Intelligence to Cloudflare” by rewriting 600+ lines of Edge into a Worker before proving the LLM path — weeks of risk for a problem that HTTP to `ipix-prod` solves first.

---

## Completion steps

- [ ] **A — Inventory** — Confirm Edge allowlist is still `gemini | groq`; note `ipix-prod` + frozen custom Worker.  
  `proof:` 3 file paths + one sentence each.
- [ ] **B — Write ADR** — Path A = HTTPS to native AI Gateway now; Path B = IPI-455 later. Secrets + rollback.  
  `proof:` docs-only PR URL.
- [ ] **C — Sync Linear** — IPI-455 Phase B; link ADR; related to IPI-694.  
  `proof:` Linear quote.
- [ ] **D — Contradiction check** — `todo.md`, `j18-edge-plan.md`, this folder: no claim Edge already uses Workers AI.  
  `proof:` files checked list.

---

## Success criteria

- [ ] ADR states: runtime = Supabase Deno; LLM = Cloudflare AI Gateway HTTP → Workers AI
- [ ] Explicit non-goal: no `env.AI` from Edge
- [ ] IPI-455 Phase B
- [ ] Docs-only PR
- [ ] Validation level: **Docs Verified**

## Suggested ADR path

`docs/cloudflare/2026-07-18-cf-edge-ai-adr.md` or `tasks/cloudflare/Tasks/000-CF-EDGE-ADR.md` (docs PR only).

## Official links

| Resource | Link |
|----------|------|
| AI Gateway OpenAI compat | https://developers.cloudflare.com/ai-gateway/usage/chat-completion/ |
| Workers AI bindings (Workers only) | https://developers.cloudflare.com/workers-ai/configuration/bindings/ |
