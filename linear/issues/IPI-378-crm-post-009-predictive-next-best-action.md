## CRM-POST-009 · Predictive Next Best Action (daily prioritization)

**In plain terms:** Helps operators prioritize the highest-impact work every day — a ranked action queue across deals, contacts, and follow-ups (not just the one action on the current screen).

**Blocked by:** IPI-370 (CRM MVP verification) · **Related:** IPI-369 · IPI-374 · IPI-375 · CRM-POST-001

**Skills:** `mastra` · `gemini` · `copilotkit` · `linear`

**Labels:** CRM · AI · FRONTEND

**Milestone:** CRM-M5 · Post-MVP Hub
**Spec:** `tasks/crm/07-relationship-hub-ai-roadmap.md` · `tasks/crm/05-crm-prd.md` §5.3

---

### Scope

**MVP delivers contextual NBA** (one next step on the active Company/Contact/Deal — IPI-369 IntelligencePanel). **This issue** adds **portfolio-level prioritization**:

- Mastra tool `rankDailyActions({ limit?: number })` — deterministic scoring first (`scoreDealHealth`, due `crm_activities`, stage velocity, deal value), LLM narrates *why* each row ranks where it does
- Output: ordered list with `{ rank, actionType, entityType, entityId, href, impactScore, reason }` — each row deep-links to existing CRM routes
- Surfaces: Command Center strip and/or `/app/crm` home (coordinate CRM-POST-001); suggestion chips reuse IPI-374 pattern
- **No auto-execute** — click navigates or opens draft via existing ApprovalCard paths only

**Not in V1:** ML churn model (CRM-ADV-003), cross-platform tasks outside `crm_*`, auto-send

### Acceptance

- [ ] **A1** Tool returns ≥3 ranked actions from fixture data with stable sort — proof: unit test, no LLM in scoring path
- [ ] **A2** Top action matches highest deterministic impact score — proof: regression test on golden fixtures
- [ ] **A3** UI renders ranked list with one-click navigation — proof: Playwright or manual on `/app/crm` / Command Center
- [ ] **A4** RLS: org A never sees org B actions — proof: cross-org test
- [ ] **A5** `cd app && npm run lint && npm run typecheck && npm test` green

### Verify

```bash
cd app && npm run lint && npm run typecheck && npm test
```
