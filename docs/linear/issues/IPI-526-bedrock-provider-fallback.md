---
title: "IPI-526 · SCR-35 — Planner Hub (screen implementation tracking)"
cycle: 2026-Q3
status: Backlog
---

# IPI-526 · SCR-35 — Planner Hub

> **⚠️ STALE DOC WARNING:** This file previously described IPI-526 as "AWS Bedrock Provider Fallback" (CF-AI-012). That work was completed and the Linear issue was **re-purposed** on 2026-07-13 to track the Planner Hub screen (SCR-35). The old Bedrock content has been removed — see `tasks/cloudflare/bedrock/` for the Bedrock work logs.
>
> **Do NOT read this doc for Bedrock provider implementation.** That work lives in `services/cloudflare-worker/src/providers/bedrock.ts` and the related test files.

## SCR-35 — Planner Hub screen implementation

**Plain English:** Build `/app/planner` as a paginated, filterable list of every plan the Operator has visibility into, with a risk-sorted attention band.

**Status:** Backlog · Assigned to: S K

**Blocked by:** IPI-536 (foundation/routes — In Progress), IPI-538 (data access Slice A — In Progress)

**See the Linear issue description** for the full scope, wireframe, AC, and child tickets.
