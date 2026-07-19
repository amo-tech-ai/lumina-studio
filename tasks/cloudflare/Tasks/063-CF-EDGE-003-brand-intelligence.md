# IPI-697 · CF-EDGE-003 — Wire brand-intelligence Edge to Cloudflare Workers AI path

**Linear:** [IPI-697 · CF-EDGE-003](https://linear.app/amo100/issue/IPI-697)  
**Task ID:** CF-EDGE-003  
**Phase:** 3a of 5 (CF-EDGE-AI)  
**Difficulty:** Medium  
**Risk:** Medium  
**Estimated time:** half day  
**Dependencies:** [IPI-696](https://linear.app/amo100/issue/IPI-696)  
**PR type:** Code-only

---

## Purpose

When `AI_PROVIDER=cloudflare` (and not `BI_USE_GEMINI=1`), Brand Intelligence structured LLM calls use the shared Cloudflare gateway client → Workers AI.

### Real-world iPix example

Operator analyzes a crawled brand in Brand Hub. Profile draft still appears; Edge no longer needs Google on the happy path (after secrets flip in 005).

---

## Completion steps

- [ ] **A — Trace call sites** in `supabase/functions/brand-intelligence/`.  
  `proof:` file:line list.
- [ ] **B — Wire provider** — cloudflare when env says so; preserve Groq; `BI_USE_GEMINI=1` escape.  
  `proof:` diff summary.
- [ ] **C — Tests** — cloudflare branch selected.  
  `proof:` Deno test names.
- [ ] **D — Deploy named function only after review** — never `--prune`; do not flip default secret until 005.  
  `proof:` deploy command + version id.

---

## Success criteria

- [ ] With `AI_PROVIDER=cloudflare`, BI does not call Google GenAI SDK
- [ ] `BI_USE_GEMINI=1` still forces Gemini
- [ ] Structured output shape unchanged for Brand Hub UI
- [ ] Code-only PR
- [ ] Validation: **Unit Verified** (+ Local Runtime if served locally)

## Do NOT

- Port whole handler to Worker ([IPI-455](https://linear.app/amo100/issue/IPI-455))
- Change Firecrawl crawl/webhook
- Remove Gemini secrets yet
