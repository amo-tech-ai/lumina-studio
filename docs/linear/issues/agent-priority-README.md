# Agent priority Linear issues (copy-ready)

**Source:** AI Agents Strategy — five MVP priorities  
**Template:** [`docs/process/templates/linear-issue-body.md`](../../process/templates/linear-issue-body.md)  
**Create in Linear:** [`CURSOR-DESKTOP-CREATE-LINEAR-ISSUES.md`](./CURSOR-DESKTOP-CREATE-LINEAR-ISSUES.md) ← **start here on Cursor Desktop**  
**Script:** [`scripts/linear-create-agent-priority-issues.mjs`](../../scripts/linear-create-agent-priority-issues.mjs)

**Rules:** One issue · one PR · no new agent IDs · HITL for high-impact writes · stop after thin brand RAG

## Duplicate / reuse audit (✅)

| Priority | Reuse / not duplicate | Notes |
|----------|----------------------|-------|
| AGENT-CTX-001 | Extend IPI-218 / brand-context / CRM / wizard patterns | **Gap:** shoot **detail** has no `useAgentContext`; campaigns thin |
| AGENT-DNA-001 | Reuse `explainPillar` + EvidenceBlock | Not a new BI agent — enforce evidence in answers/UI |
| AGENT-PLAN-001 | Shoot wizard gates already exist | **Not** IPI-483 (planner workspace approval queue) |
| IPI-156 | **Existing Linear** CAMP-001 | Soft-blocked historically by IPI-268 (schema migration now present) + IPI-249 UI |
| AGENT-RAG-001 | Reuse `search_brands` / `search_context_snapshots` RPCs | Tool + cite in BI — not full RAG platform |

## Execution order

1. [`IPI-XXX-AGENT-CTX-001.md`](./IPI-XXX-AGENT-CTX-001.md)  
2. [`IPI-XXX-AGENT-DNA-001.md`](./IPI-XXX-AGENT-DNA-001.md)  
3. [`IPI-XXX-AGENT-PLAN-001.md`](./IPI-XXX-AGENT-PLAN-001.md)  
4. [`IPI-156-CAMP-001-creative-director-campaigns.md`](./IPI-156-CAMP-001-creative-director-campaigns.md)  
5. [`IPI-XXX-AGENT-RAG-001.md`](./IPI-XXX-AGENT-RAG-001.md)  

Do **not** create Support / Postiz / Apify / OpenClaw agent issues from this set.
