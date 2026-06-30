---
title: Linear Issue Footer Template
version: "2.0"
lastUpdated: "2026-06-30"
use: Append to every DESIGN V2 + AI Intelligence executable issue
---

# Linear issue footer (standard — v2)

Every Design V2 issue uses **this exact structure**. Paste as a comment or append to description.

```markdown
## Execution

**Type:** <!-- Frontend | Backend | AI | Database | QA | Infrastructure -->

| Required Stack | |
|----------------|--|
| CopilotKit v2 | ☐ ✅ ◐ — |
| Mastra | ☐ ✅ ◐ — |
| Gemini | ☐ ✅ ◐ — |
| Supabase | ☐ ✅ ◐ — |
| Cloudinary | ☐ ✅ ◐ — |

**Required Skills:** <!-- comma-separated from skill-map.md -->

**Required MCP:** <!-- e.g. Supabase MCP · Browser MCP · Mastra MCP -->

**Depends on:** <!-- IPI-XXX · waiver note if partial OK -->

**Blocks:** <!-- IPI-YYY · or — -->

| Verification | Required |
|--------------|:--------:|
| Browser | ☐ |
| Playwright | ☐ |
| Visual QA | ☐ |
| Task Verifier | ☐ |
| Supabase Verify | ☐ |

**SSOT:** [`MASTER-DEPENDENCIES.md`](https://github.com/amo-tech-ai/lumina-studio/blob/main/tasks/intelligence/ai/MASTER-DEPENDENCIES.md) · [`task-stack-map.md`](https://github.com/amo-tech-ai/lumina-studio/blob/main/tasks/intelligence/ai/task-stack-map.md) · [`skill-map.md`](https://github.com/amo-tech-ai/lumina-studio/blob/main/tasks/intelligence/ai/skill-map.md)

**Status:** <!-- ⚪ Prototype · 🔵 In Progress · 🟡 Integrated · 🟢 Verified · ⭐ Production -->

**Code path:** `<!-- app/src/... -->`
```

**Legend:** ✅ required · ◐ partial/consumer · — not in scope · ☐ verification not yet run · ☑ verification required before Done

---

## Batch reference (paste order)

| Batch | Issues |
|-------|--------|
| **1 — Core blockers** | IPI-246 · IPI-247 · IPI-243 · IPI-209 · IPI-255 · IPI-257 |
| **2 — AI & Design** | IPI-197 · IPI-248 · IPI-268 · IPI-249 · IPI-250 · IPI-261 · IPI-269 |
| **3 — QA & Platform** | IPI-258 · IPI-264 · IPI-253 · IPI-107 · IPI-47 |

Completion tracked in [`MASTER-DEPENDENCIES.md`](./MASTER-DEPENDENCIES.md) § Execution footer matrix.
