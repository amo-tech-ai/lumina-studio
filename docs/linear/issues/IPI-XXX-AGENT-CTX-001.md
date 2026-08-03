# IPI-XXX · AGENT-CTX-001 — Give AI the current brand, shoot, or deal context

**Role:** iPix engineer. One concern per PR. Research before custom code.

**Plain English:** On Brand Hub, Shoot Detail, Shoot Wizard, or CRM, the chat already knows which brand/shoot/deal is open and never asks for that UUID again.

| Field | Value |
|-------|--------|
| **MVP stage** | Core |
| **Parallel** | OK with DNA/RAG later; coordinate if touching same page as IPI-209 |
| **Blocked by** | — |
| **Unblocks** | AGENT-DNA-001 · AGENT-PLAN-001 · better CRM/BI assists |
| **Track** | AI · UI |
| **Skills** | `ipix-task-lifecycle` · `copilotkit` · `mastra` · `worktrees` · `pr-workflow` |
| **Agents / hooks / commands** | `/research` · `/task` · `/verify-task` · `copilotkit-v1-guard` |
| **Stack** | Next.js `app/` · CopilotKit v2 `useAgentContext` · Mastra route agents |

**Quality scores (1–5):** P5 · C4 · R4 · UV5 · LV5

---

## 1. Purpose

Close context gaps so every operator agent route injects the active brand, shoot, and/or deal the same way Brand Hub already does.

## 2. Real-world iPix example

- **Persona:** Operator  
- **Surface:** `/app/shoots/[shootId]`, `/app/brand/[id]`, `/app/crm/...`, `/app/shoots/new`  
- **Today:** Brand detail, brand list, wizard, booking, CRM ids, and nav `activeBrandId` inject context; **Shoot Detail does not** (`ShootDetailWorkspace` has no `useAgentContext`). Agents still ask “which brand/shoot?” on gap routes.  
- **After:** Open a shoot → planner says “You’re on **Spring Lookbook** for **Acme**” and offers next actions without asking for ids.

## 3. User journey impact

| Before | During | After |
|--------|--------|-------|
| Restates brand/shoot in chat | Opens page; chat loads with page ids | Asks for work (“fix brief”) — agent uses context |

## 4. Business value

Removes friction on Core MVP paths (Brand Hub, shoots, CRM) and stops wrong-tenant tool calls from missing context.

## 5. Quality checks (pre-impl)

- [x] Required for expert-feeling agents  
- [x] Moves Core MVP  
- [x] Not a duplicate of IPI-218 (active brand done) — this closes **remaining surfaces**  
- [x] Reuse `brand-context.tsx`, `shoot-wizard-context.tsx`, `crm-record-context.tsx`  
- [x] No new agent ID  

**Verdict:** Ship gap-fill only.

---

## 6. Research checklist

- [ ] CopilotKit v2 `useAgentContext` docs + iPix `upgrade/ipix-v2-conventions.md`  
- [ ] Audit all `/app/*` routes vs existing context hooks (table in PR)  
- [ ] `route-agent-map.ts` agent ids stay in sync  
- [ ] GitHub CopilotKit readable/context examples (last 30d)  
- [ ] Prefer extending hooks over new abstraction  

## 7. Platform-first plan

| Step | Choice |
|------|--------|
| Dashboard | N/A |
| CLI | N/A |
| Existing iPix code | `brand-context.tsx`, `brand-list-context.tsx`, `shoot-wizard-context.tsx`, `crm-record-context.tsx`, `operator-panel.tsx`, `booking-*-context.tsx` |
| Official docs | https://docs.copilotkit.ai |
| Custom | Add `shoot-detail-context` (mirror wizard); fix any CRM/campaign thin spots |
| Tests | Unit + localhost journey |

**Do NOT:** New Mastra agent · dump entire DB into context · Vite `src/`  
**Out of scope:** AGENT-DNA evidence UX · shoot HITL gates · campaign tools (IPI-156) · RAG

---

## 8. Multi-step implementation prompt

```xml
<role>Implement IPI-XXX · AGENT-CTX-001 — Give AI the current brand, shoot, or deal context. One concern.</role>
<context>CopilotKit v2 useAgentContext. Reuse brand/CRM/wizard patterns. No new agent IDs.</context>
<task>
1. Audit routes → context coverage table; list only gaps.
2. Implement Shoot Detail context (+ any critical CRM/campaign gaps in same concern if tiny; else file follow-up).
3. Tests + localhost:3002 prompts proving agent uses injected ids.
4. One-concern PR.
</task>
<constraints>Platform-first. No docs+code mix. No client AI keys.</constraints>
```

### Completion steps (A→E)

#### A. Research / setup
- [ ] **A1** Coverage matrix: route → context hook → agent id — proof: table in PR  
- [ ] **A2** Confirm Shoot Detail gap — proof: grep `useAgentContext` under `components/shoot/`

#### B. Core change
- [ ] **B1** `useShootDetailContext` (or equivalent) on `/app/shoots/[shootId]` with shootId, brandId, name, status — proof: code + unit test  
- [ ] **B2** Instructions already say “use injected context first” for affected agents — proof: spot-check BI/planner/CRM  

#### C. Edges / states
- [ ] **C1** Missing/unauthorized shoot → context null + honest agent message — proof: test or manual  
- [ ] **C2** Brand switcher `activeBrandId` still works (IPI-218 regression) — proof: test/manual  

#### D. Automated tests
- [ ] **D1** `cd app && npx vitest run src/components/shoot/…context…` — proof: N passed  
- [ ] **D2** `cd app && npm run typecheck && npm run lint` — proof: green  

#### E. Real-world + ship
- [ ] **E1** Localhost `:3002` QA login — open shoot detail — prompt: “Summarize this shoot” — proof: uses name/id without asking  
- [ ] **E2** Brand Hub + CRM deal prompts — proof: notes  
- [ ] **E3** Production-safe: read-only smoke on ipix.co if preview unavailable — proof: notes  
- [ ] **E4** PR evidence + Linear Done  

---

## 9. Acceptance criteria

- **A — Shoot Detail:** Agent receives shootId + brandId without operator pasting them.  
- **B — No UUID prompt:** On covered routes, agent does not ask for brandId/shootId/dealId already in context.  
- **C — States:** loading/error/empty pages do not invent fake ids.  
- **D — Security:** Context is page-derived only; tools still enforce RLS/org scope.  
- **E — Regression:** Brand Hub + wizard + CRM context hooks still pass tests.  

---

## 10. Tests & real-world validation

| Layer | Method |
|-------|--------|
| Unit | New/updated context hook tests |
| Typecheck / lint | `cd app && npm run typecheck && npm run lint` |
| Localhost | `:3002` brand / shoot detail / CRM |
| Agent | 2–3 prompts per surface; draft-only |
| Production-safe | Read-only; no writes |

**QA:** `qa@ipix.test` + Infisical `QA_PASSWORD`

---

## 11. Risks & rollback

| Risk | Failure point | Rollback |
|------|---------------|----------|
| Oversized context hurts tokens | Dumping full shoot payload | Trim to ids + labels |
| Wrong shoot id | Stale client state | Revert PR; keep page load as SSOT |

## 12. PR evidence required

- [ ] One concern only  
- [ ] Title matches this issue  
- [ ] Coverage matrix + prompt outcomes  
- [ ] Vitest / typecheck / lint pasted  
- [ ] CI green · residual risks named  

**Out of scope:** New agents · Support/Postiz/Apify/OpenClaw · DNA explain UX · RAG · campaign brief tools
