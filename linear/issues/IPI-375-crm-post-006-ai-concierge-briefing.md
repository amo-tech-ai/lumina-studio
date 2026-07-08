## CRM-POST-006 · AI Concierge daily briefing (read-only)

**In plain terms:** Operator opens CRM (or Command Center) and gets a **today's priorities** digest — at-risk deals, stale relationships, pipeline value — without searching. Read-only; no silent writes.

**Blocked by:** IPI-370 (CRM MVP verification) · **Related:** IPI-369 · CRM-POST-001 · IPI-374

**Skills:** `mastra` · `gemini` · `copilotkit` · `linear`

**Labels:** CRM · AI · FRONTEND

**Milestone:** CRM-M5 · Post-MVP Hub
**Spec:** `tasks/crm/07-relationship-hub-ai-roadmap.md` · `tasks/crm/05-crm-prd.md` §5.3

---

### Scope

- Mastra tool `dailyRelationshipBriefing({ focus: "all" | "at_risk" })` — aggregates `scoreDealHealth` + open deals + recent `crm_activities`
- Optional thin `/app/crm` landing section OR Command Center widget (coordinate with CRM-POST-001)
- Output via `EvidenceBlock` + suggestion chips (IPI-374 pattern)
- **No send, no stage changes** — narration only

### Acceptance

- [ ] **A1** Tool returns structured briefing (at-risk count, top 5 actions, pipeline total) — proof: unit test on fixtures
- [ ] **A2** `crm-assistant` can invoke tool; LLM does not invent scores — proof: uses `scoreDealHealth` outputs
- [ ] **A3** Manual: briefing renders on `/app/crm` or CC with org RLS — proof: second org sees empty
- [ ] **A4** `cd app && npm run typecheck && npm test` green

### Verify

```bash
cd app && npm run typecheck && npm test
```
