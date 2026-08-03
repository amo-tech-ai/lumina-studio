# IPI-209 · SHOOT-DETAIL-001 — Open a shoot and see brief, shots, and next actions

**Role:** iPix engineer. One concern per PR. Research before custom code.

**Plain English:** From `/app/shoots`, an Operator opens a shoot and sees real brief, deliverables, shots, and agent context — not a 404 or empty shell.

| Field | Value |
|-------|--------|
| **MVP stage** | Core · Launch Blocker |
| **Parallel** | OK with **IPI-151 · SHOOT-AI-004 — Auto-tag shoot photos + AI gallery** after shell stable; wait on auth/RLS-only PRs touching same RPC |
| **Blocked by** | — |
| **Unblocks** | Tab-fill follow-ups, DNA gallery, shoot edit actions |
| **Track** | UI · Platform |
| **Skills** | `ipix-task-lifecycle` · `nextjs-developer` · `copilotkit` · `ipix-supabase` · `worktrees` · `pr-workflow` |
| **Agents / hooks / commands** | `/task` · `/verify-task` · Stop typecheck hook |
| **Stack** | Next.js `app/` · Supabase (`get_shoot_detail`) · CopilotKit (shoot context) |

**Quality scores (1–5):** P5 · C3 · R3 · UV5 · LV5  
**Linear:** https://linear.app/amo100/issue/IPI-209

---

## 1. Purpose

Finish Shoot Detail so Operators can run a shoot from list → detail without broken tabs or missing agent context.

## 2. Real-world iPix example

- **Persona:** Operator  
- **Surface:** `/app/shoots` → `/app/shoots/[shootId]`  
- **Today:** Route exists (`ShootDetailWorkspace`) but tab depth / agent assist may still be incomplete vs design  
- **After:** Overview + key tabs load; empty/error/loading clear; assistant knows the active shoot

## 3. User journey impact

| Before | During | After |
|--------|--------|-------|
| Clicks shoot, unsure what is live | Opens detail, scans brief/shots | Picks next action (DNA, edit, book) |

## 4. Business value

Shoot ops is a Core MVP path — list→detail is how brands run production in iPix.

## 5. Quality checks (pre-impl)

- [x] Required for launch  
- [x] Moves Core / Launch Blocker  
- [x] Not a duplicate of Brand Hub work  
- [x] Reuse `getShootDetail` + `ShootDetailWorkspace` — no new page stack  
- [x] Parallel OK with unrelated UI  

**Verdict:** Ship remaining gaps only (tabs / agent / proofs) — do not rebuild the page.

---

## 6. Research checklist

- [ ] Confirm current `app/src/app/(operator)/app/shoots/[shootId]/page.tsx` + workspace components  
- [ ] Official Next.js App Router dynamic params  
- [ ] Reuse existing RPC/types — Dashboard N/A  
- [ ] Design: shoot detail wireframes / DC if still open gaps  
- [ ] Recommend smallest delta vs full redesign  

## 7. Platform-first plan

| Step | Choice |
|------|--------|
| Dashboard | N/A |
| CLI | N/A |
| Existing iPix code | `get-shoot-detail`, `ShootDetailWorkspace` |
| Official docs | Next.js dynamic routes |
| Custom | Only missing tabs / agent readable context |
| Tests → browser → PR | Below |

**Do NOT:** Rebuild Vite shoot pages · mix DNA gallery into this PR  
**Out of scope:** Full **IPI-151 · SHOOT-AI-004 — Auto-tag shoot photos + AI gallery** · booking wizard · Vite `src/`

---

## 8. Multi-step implementation prompt

```xml
<role>Implement IPI-209 · SHOOT-DETAIL-001. One concern. Reuse existing shoot detail shell.</role>
<context>Stack: Next.js app/, Supabase get_shoot_detail, CopilotKit. Spec: this file.</context>
<task>
1. Diff live page vs AC; list only missing pieces.
2. Implement A→E with proofs; no docs in same PR as code.
3. Real-world: localhost:3002 list→detail with QA user.
4. Open one-concern PR with screenshots.
</task>
<constraints>Custom last. No client AI keys. Surgical diff.</constraints>
```

### Completion steps (A→E)

#### A. Research / setup
- [ ] **A1** Inventory live tabs vs design — proof: checklist in PR  
- [ ] **A2** Confirm `get_shoot_detail` / types — proof: typecheck  

#### B. Core
- [ ] **B1** Fill highest-value missing tab/section only — proof: vitest or screenshot  
- [ ] **B2** Agent/page context includes shoot id + name when panel open — proof: manual agent prompt  

#### C. Edges
- [ ] **C1** 404 / no access / loading states — proof: browser  

#### D. Automated tests
- [ ] **D1** `cd app && npx vitest run` on shoot detail tests — proof: N passed  
- [ ] **D2** `cd app && npm run typecheck && npm run lint` — proof: green  

#### E. Real-world + ship
- [ ] **E1** Playwright or MCP Chrome: list → open shoot — proof: pass/screenshot  
- [ ] **E2** localhost:3002 as `qa@ipix.test` — proof: notes  
- [ ] **E3** Production-safe smoke on ipix.co/app/shoots (read-only) — proof: notes  
- [ ] **E4** PR evidence · CI · Linear Done — proof: PR #  

---

## 9. Acceptance criteria

- **A — Open shoot:** Card on `/app/shoots` opens detail (not 404)  
- **B — Data:** Brief/status/brand visible when Operator has access  
- **C — States:** loading · empty · error · success each clear  
- **D — Agent:** Assistant can reference the open shoot without re-asking id  
- **E — Regression:** Shoot list still works  

## 10. Tests & real-world validation

| Layer | Method |
|-------|--------|
| Unit | vitest shoot components |
| Local | `:3002` QA login |
| Browser | Playwright / MCP Chrome journey |
| Prod-safe | ipix.co read-only list/detail if logged in |
| Agent | 2 prompts on open shoot |

## 11. Risks & rollback

| Risk | Failure | Rollback |
|------|---------|----------|
| RPC shape drift | Empty sections | Revert PR; keep list |
| Agent id mismatch | Panel error | Disable context injection |

## 12. PR evidence required

- [ ] One UI concern  
- [ ] Title format  
- [ ] Screenshots of states  
- [ ] Proof commands  
- [ ] CI green  
