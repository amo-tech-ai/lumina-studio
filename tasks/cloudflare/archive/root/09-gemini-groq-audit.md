# 09 — Gemini / Groq audit

**Scope:** 79 Gemini + Groq issues. Groq Phases 1-3 done, 4-7 remaining.

## Verdict: 🟡 70/100 — Groq migration on track, but no prod cutover until golden eval

## Status breakdown

{'Backlog': 37, 'Done': 18, 'Canceled': 12, 'Duplicate': 5, 'Todo': 4, 'In Review': 2, 'In Progress': 1}

## Key findings

| Area | Grade | Evidence |
|------|-------|----------|
| Groq infra (IPI-355) | 🟢 | Done — GROQ-001 |
| LLM provider abstraction (IPI-356) | 🟢 | Done — GROQ-002 |
| Edge on Groq (IPI-357) | 🟢 | Done — GROQ-003 |
| Mastra on Groq (IPI-358) | 🟢 | Done — GROQ-004 |
| Model registry (IPI-107) | 🟡 | In Review — CI gate pending |
| 3.1-flash-lite default (IPI-47) | 🟡 | In Review — blocked on IPI-107 |
| CopilotKit smoke on Groq (IPI-359) | 🟡 | Todo |
| Golden eval (IPI-360) | 🟡 | Todo — **prod gate requirement** |
| Staged rollout (IPI-361) | 🟡 | Todo — **prod gate requirement** |

## Prod gate status

| Gate | Status |
|------|--------|
| GROQ-001 infra | ✅ Done |
| GROQ-002 abstraction | ✅ Done |
| GROQ-003 edge | ✅ Done |
| GROQ-004 mastra | ✅ Done |
| GROQ-005 CopilotKit smoke | 🔴 Not started |
| GROQ-006 golden eval | 🔴 **Prod blocker** |
| GROQ-007 staged rollout | 🔴 **Prod blocker** |

## Recommended action

1. Ship IPI-107 (registry parity) — unblocks IPI-47
2. Start IPI-359 (CopilotKit smoke on Groq)
3. Do NOT prod-flip until IPI-360 (golden eval) passes
4. IPI-361 (staged rollout) can run in parallel with 360
