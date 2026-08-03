# IPI-156 · CAMP-001 — Add campaign help to the existing Creative Director

**Role:** iPix engineer. One concern per PR. Research before custom code.

**Plain English:** On `/app/campaigns`, the existing Creative Director drafts a campaign brief from Brand DNA — as a draft for human approval — without creating a new “Campaign Strategist” agent.

| Field | Value |
|-------|--------|
| **MVP stage** | Core (agent assist) · full campaigns UI remains sibling |
| **Parallel** | OK after AGENT-CTX/DNA; schema IPI-268 migration exists |
| **Blocked by** | Soft: IPI-268 schema applied; IPI-249 full workspace optional for chat-only drafts |
| **Unblocks** | Campaign strategist “hat” without agent sprawl |
| **Track** | AI · UI |
| **Skills** | `ipix-task-lifecycle` · `mastra` · `copilotkit` · `worktrees` · `pr-workflow` |
| **Agents / hooks / commands** | `mastra-agent-reviewer` · `/research` · `/verify-task` |
| **Stack** | Mastra `creative-director` · `/app/campaigns` · Brand DNA profile · CopilotKit |

**Linear:** https://linear.app/amo100/issue/IPI-156  
**Related (do not merge):** IPI-261 (assets wiring) · IPI-249 (campaigns workspace UI) · IPI-268 (schema) · IPI-157–159 (later campaign waves)

**Quality scores (1–5):** P4 · C4 · R3 · UV4 · LV4

---

## 1. Purpose

Give Operators campaign creative help on the **existing** `creative-director` agent (route already maps `/app/campaigns` → `creative-director`).

## 2. Real-world iPix example

- **Persona:** Creative / brand marketer  
- **Surface:** `/app/campaigns` (placeholder today) + CD chat  
- **Today:** CD asset tools work on `/app/assets`; campaign tools still TBD (“no dedicated campaign tools yet” in agent instructions).  
- **After:** “Draft a Spring campaign brief for **Acme** from DNA” → structured draft (goal, pillars, tone, channels) + explicit “draft only — approve to save” (HITL). No new agent id.

## 3. User journey impact

| Before | During | After |
|--------|--------|-------|
| Campaigns page feels empty | Asks CD for a brief | Edits/approves draft; can feed shoot wizard later |

## 4. Business value

Campaigns sit above shoots in the product story; agent assist unblocks creative planning without waiting for the full workspace epic.

## 5. Quality checks (pre-impl)

- [x] Reuses IPI-156 (do not file AGENT-CD-001 as a separate Linear epic)  
- [x] No new agent ID  
- [x] IPI-268 migration file present (`20260707100000_ipi268_campaigns_schema.sql`) — verify remote before writes  
- [x] Full SCR campaigns UI = IPI-249 (out of scope here if chat+draft tools suffice)  

**Verdict:** Ship **agent campaign draft tools + context** on CD; split UI workspace if large.

---

## 6. Research checklist

- [ ] `docs/prd/campaign-prd.md` § agents (draft spine)  
- [ ] Confirm remote `campaigns` / draft tables via Supabase (Dashboard/CLI)  
- [ ] Current `creative-director` instructions + asset-only tools  
- [ ] Mastra structured output patterns  
- [ ] Prefer draft jsonb / draft table over silent final inserts  

## 7. Platform-first plan

| Step | Choice |
|------|--------|
| Dashboard | Verify schema live |
| Existing | `creative-director`, brand DNA profile, ApprovalCard patterns |
| Custom | Minimal tools: e.g. `draftCampaignBrief` (read DNA → draft only); optional persist to draft table with HITL |

**Do NOT:** Register `campaign-strategist` agent · auto-publish · Postiz  
**Out of scope:** IPI-249 full workspace · moodboard editor · Support/Postiz/Apify/OpenClaw · AGENT-RAG

---

## 8. Multi-step implementation prompt

```xml
<role>Implement IPI-156 · CAMP-001 — Add campaign help to the existing Creative Director.</role>
<context>Agent id creative-director only. Route /app/campaigns already mapped. Draft-only writes + HITL.</context>
<task>
1. Verify schema/remote readiness; if final tables unsafe, ship chat draft-only with no DB write.
2. Add campaign draft tool(s) to creative-director; update instructions (keep asset tools).
3. Inject campaign/brand context on campaigns routes (reuse AGENT-CTX patterns).
4. Tests + localhost prompts; one-concern PR (no IPI-249 UI mega-diff).
</task>
```

### Completion steps (A→E)

#### A. Research / setup
- [ ] **A1** Remote schema check — proof: migrations list / Dashboard  
- [ ] **A2** Scope decision: chat draft-only vs draft-table persist — proof: note in PR  

#### B. Core change
- [ ] **B1** Campaign draft tool(s) on `creative-director` — proof: unit tests  
- [ ] **B2** Instructions: campaign brief from DNA; never silent commit — proof: instruction test  
- [ ] **B3** Campaigns route context (brandId / campaignId when present) — proof: test  

#### C. Edges
- [ ] **C1** No brand context → ask to pick brand / use activeBrandId — proof: manual  
- [ ] **C2** HITL required before any persist — proof: test  

#### D. Automated tests
- [ ] **D1** CD agent/tool tests — proof: green  
- [ ] **D2** typecheck + lint — proof: green  

#### E. Real-world + ship
- [ ] **E1** `:3002` `/app/campaigns` — “Draft a campaign brief from our DNA” — proof: draft + disclaimer  
- [ ] **E2** Assets DNA path still works (IPI-261 regression) — proof: prompt  
- [ ] **E3** PR + update Linear IPI-156  

---

## 9. Acceptance criteria

- **A — Same agent:** Only `creative-director` id used (registry unchanged aside from tools).  
- **B — Draft:** Brief output is explicitly a draft pending human approval.  
- **C — DNA-grounded:** Uses brand DNA/profile context (no invented brand voice).  
- **D — No silent write:** No final campaign row without HITL (or zero DB write if draft-only chat).  
- **E — Regression:** Asset DNA tools on `/app/assets` still pass.  

---

## 10. Tests & real-world validation

Unit · localhost campaigns + assets · agent prompts · production-safe read-only unless draft HITL approved in non-prod.

## 11. Risks & rollback

| Risk | Failure point | Rollback |
|------|---------------|----------|
| Schema not live | Persist fails | Chat-only draft mode |
| Scope bleed into IPI-249 | Huge UI PR | Split PR; this issue = agent tools only |

## 12. PR evidence required

- [ ] One concern · IPI-156 title · draft prompt evidence · assets regression · CI green  

**Out of scope:** New agent IDs · IPI-249 full UI · Postiz/Support/Apify/OpenClaw · shoot HITL · brand RAG
