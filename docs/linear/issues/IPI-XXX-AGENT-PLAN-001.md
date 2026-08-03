# IPI-XXX · AGENT-PLAN-001 — Require approval before each shoot-planning stage

**Role:** iPix engineer. One concern per PR. Research before custom code.

**Plain English:** On the shoot wizard, deliverables, shot list, and budget cannot advance or save until the Operator explicitly approves each gate — and the agent never invents shot angles.

| Field | Value |
|-------|--------|
| **MVP stage** | Core · Launch Blocker |
| **Parallel** | Soft wait AGENT-CTX-001 for wizard context quality |
| **Blocked by** | Soft: AGENT-CTX-001 |
| **Unblocks** | Reliable production planning demos |
| **Track** | AI · UI |
| **Skills** | `ipix-task-lifecycle` · `mastra` · `copilotkit` · `worktrees` · `pr-workflow` |
| **Agents / hooks / commands** | `mastra-agent-reviewer` · `/verify-task` |
| **Stack** | `production-planner` · `shoot-wizard` workflow · `/app/shoots/new` |

**Quality scores (1–5):** P5 · C4 · R4 · UV5 · LV5

---

## 1. Purpose

Harden shoot-wizard HITL so high-impact planning writes stay human-approved and grounded in `lookupShotReferences`.

## 2. Real-world iPix example

- **Persona:** Producer  
- **Surface:** `/app/shoots/new` (+ planner chat)  
- **Today:** Page has HITL gates and planner instructions; copy/empty states and agent bypass risk may still confuse Operators or allow tool order mistakes.  
- **After:** Clear gate labels; agent refuses shot list until deliverables approved; angles only from reference lookup; save only after budget approve.

## 3. User journey impact

| Before | During | After |
|--------|--------|-------|
| Unsure if AI already saved the shoot | Approves each stage | Commit happens only at the end with consent |

## 4. Business value

Bad auto-saved shot lists burn studio time; HITL is the Core MVP safety rail for production.

## 5. Quality checks (pre-impl)

- [x] Launch-critical  
- [x] **Not** IPI-483 (planner workspace `needsApproval` queue — different product)  
- [x] Reuse `shoot-wizard` workflow + existing tools  
- [x] No new agent ID  

**Verdict:** Ship harden/copy/tests — do not rebuild wizard.

---

## 6. Research checklist

- [ ] `app/src/mastra/workflows/shoot-wizard.ts` + `agents/index.ts` planner instructions  
- [ ] `/app/shoots/new/page.tsx` HITL sections + existing tests  
- [ ] Mastra workflow suspend/resume docs  
- [ ] Confirm tool failures when deliverables unapproved  

## 7. Platform-first plan

| Step | Choice |
|------|--------|
| Existing | `recommendShootType`, `planDeliverables`, `lookupShotReferences`, `generateShotListDraft`, `estimateShootBudget`, `saveApprovedShootDraft`, `approveShotList` |
| Custom | Gate copy, empty states, tests proving refuse paths |

**Do NOT:** Merge into IPI-483 · new Shoot Coordinator agent · silent `saveApprovedShootDraft`  
**Out of scope:** IPI-483 · booking confirm · DNA · RAG · campaigns

---

## 8. Multi-step implementation prompt

```xml
<role>Implement IPI-XXX · AGENT-PLAN-001 — Require approval before each shoot-planning stage.</role>
<context>production-planner + shoot-wizard only. No new agent IDs. Not IPI-483.</context>
<task>
1. Map three gates vs tools/workflow; list bypass holes.
2. Fix holes + operator-facing gate copy/empty states.
3. Tests: unapproved deliverables → no shot list; no invented angles; no save without budget approve.
4. Localhost wizard journey with QA user.
</task>
```

### Completion steps (A→E)

#### A. Research / setup
- [ ] **A1** Gate×tool matrix — proof: table in PR  
- [ ] **A2** Existing page tests inventory — proof: list  

#### B. Core change
- [ ] **B1** Close any agent/tool path that skips HITL — proof: unit/workflow test  
- [ ] **B2** Operator-visible HITL copy on steps 2–4 — proof: screenshot  

#### C. Edges
- [ ] **C1** `lookupShotReferences` empty → flag uncovered channels, don’t invent — proof: test  
- [ ] **C2** Reject/edit path returns to gate without DB commit — proof: manual/test  

#### D. Automated tests
- [ ] **D1** Wizard HITL tests + planner tool tests — proof: green  
- [ ] **D2** typecheck + lint — proof: green  

#### E. Real-world + ship
- [ ] **E1** `:3002` `/app/shoots/new` full gate walk — proof: notes/screenshots  
- [ ] **E2** Agent prompts: “generate shot list now” while deliverables unapproved → refused — proof: notes  
- [ ] **E3** PR + Linear  

---

## 9. Acceptance criteria

- **A — Deliverables gate:** No shot list generation without approval.  
- **B — References:** Shot angles come from `lookupShotReferences` (or explicit uncovered flag).  
- **C — Budget gate:** No final save without budget approval.  
- **D — UX:** Each gate states what is blocked and why.  
- **E — Regression:** Happy-path wizard still completes after three approvals.  

---

## 10. Tests & real-world validation

Vitest wizard/planner · localhost journey · agent refusal prompts · no production destructive writes.

## 11. Risks & rollback

| Risk | Failure point | Rollback |
|------|---------------|----------|
| Over-blocking legit resumes | Workflow state | Revert; keep prior gate behavior |
| Confused with IPI-483 | Scope creep | Keep this issue shoot-wizard only |

## 12. PR evidence required

- [ ] One concern · gate matrix · refusal + happy-path proofs · CI green  

**Out of scope:** IPI-483 · new agents · Support/Postiz/Apify/OpenClaw · CRM · RAG
