## CRM-ADV-001 · Relationship Graph explorer (visual + navigation)

**In plain terms:** Visual map of who connects to whom — company ↔ contact ↔ brand ↔ shoot ↔ campaign — so operators answer "show everyone tied to this campaign" without clicking five screens.

**Blocked by:** IPI-370 · **Related:** GRAPH-004 · IPI-375 · IPI-365

**Skills:** `frontend-design` · `mastra` · `ipix-supabase` · `linear`

**Labels:** CRM · AI · FRONTEND · DESIGN

**Milestone:** CRM-M5 · Post-MVP Hub
**Spec:** `tasks/crm/07-relationship-hub-ai-roadmap.md` · `tasks/crm/02-crm-architecture-brief.md` §Relationship Hub

---

### Scope

- **V1:** Read-only explorer UI at `/app/crm/graph` or tab on Company Detail — nodes from Postgres FKs + `traverse_brand_graph` RPC (GRAPH-004)
- Node types MVP: `crm_company`, `crm_contact`, `crm_deal`, `brand`, `shoot` (campaign when IPI-268)
- Click node → navigate to existing detail route (`navigateTo` frontend tool)
- **Not in V1:** Neo4j, edit edges, auto-layout AI

### Acceptance

- [ ] **A1** Graph renders ≥1 hop from selected company/deal — proof: storybook or Playwright smoke
- [ ] **A2** Uses GRAPH-004 RPC or equivalent — no client-side service role
- [ ] **A3** RLS: only org-visible nodes/edges — proof: cross-org test
- [ ] **A4** `cd app && npm run lint && npm run typecheck && npm test` green

### Verify

```bash
cd app && npm run lint && npm run typecheck && npm test
infisical run -- npm run supabase:verify-rls
```
