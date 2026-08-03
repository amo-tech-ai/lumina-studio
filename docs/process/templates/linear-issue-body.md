# IPI-NNN · TASK-ID — Real-world task name

**Role:** iPix engineer. One concern per PR. Research before custom code.

**Plain English:** <one sentence — what the Operator/Engineer experiences after this ships>

| Field | Value |
|-------|--------|
| **MVP stage** | Core · Launch Blocker · Post-MVP · Advanced |
| **Parallel** | OK / Must wait on IPI-… |
| **Blocked by** | … |
| **Unblocks** | … |
| **Track** | Platform · UI · DNA · AI · Commerce · Media |
| **Skills** | `ipix-task-lifecycle` · `<domain>` · `worktrees` · `pr-workflow` |
| **Agents / hooks / commands** | e.g. `mastra-agent-reviewer` · Stop verify · `/task` `/verify-task` |
| **Stack** | Next.js `app/` · Supabase · Mastra · CopilotKit · Cloudflare (only what this task touches) |

**Quality scores (1–5):** P__ · C__ · R__ · UV__ · LV__

---

## 1. Purpose

<One sentence outcome.>

## 2. Real-world iPix example

- **Persona:** Operator | Engineer | Shopper  
- **Surface:** Brand Hub · Command Center · Assets DNA · shoot detail · booking · marketing chat · …  
- **Today:** <concrete failure>  
- **After:** <concrete success>

## 3. User journey impact

| Before | During | After |
|--------|--------|-------|
| … | … | … |

## 4. Business value

<Why launch cares — retention, fewer support fires, faster shoot/booking, clearer DNA, …>

## 5. Quality checks (pre-impl)

- [ ] Required?  
- [ ] Moves MVP / clears Launch Blocker?  
- [ ] Not a duplicate?  
- [ ] No simpler platform solution?  
- [ ] Reuse existing code first?  
- [ ] Parallel / blockers named?  

**Verdict:** Ship · Defer · Merge into IPI-… · Config-only (Dashboard/CLI)

---

## 6. Research checklist

- [ ] Official docs (vendors this task touches)  
- [ ] GitHub production examples / last 30 days  
- [ ] Templates / recipes / blogs  
- [ ] Current iPix code (`graphify` → targeted read)  
- [ ] Dashboard / CLI / MCP / SDK before custom  
- [ ] Recommend simplest approach + why  

## 7. Platform-first plan

| Step | Choice for this task |
|------|----------------------|
| Dashboard | … / N/A |
| CLI | … / N/A |
| Existing iPix code | path(s) |
| Official docs | URL |
| SDK / module | … |
| GitHub / template | … |
| Custom code (last) | smallest change |
| Tests → browser → PR | see below |

**Do NOT:** <antipattern> — <reason>  
**Out of scope:** <sibling concerns — own issues>

---

## 8. Multi-step implementation prompt

```xml
<role>Implement IPI-NNN · TASK-ID — {title}. One concern. Platform-first.</role>
<context>Stack: {touched stacks}. Spec: docs/linear/issues/IPI-NNN-….md</context>
<task>
1. Complete research checklist; stop if Dashboard/CLI/reuse is enough.
2. Implement A→E below; run each proof before next step.
3. Run verify matrix for touched paths.
4. Real-world validation (local :3002 + safe prod smoke).
5. Open one-concern PR with plain-English body + evidence.
</task>
<constraints>No docs+code mix. No client AI keys. Custom code last. Keep diff surgical.</constraints>
<output_format>Verdict · proofs table · residual risks · PR link</output_format>
```

### Completion steps (A→E)

#### A. Research / setup
- [ ] **A1** … — proof: …

#### B. Core change
- [ ] **B1** … — proof: …

#### C. Edges / states
- [ ] **C1** … — proof: …

#### D. Automated tests
- [ ] **D1** Unit: `cd app && npx vitest run <path> -t "…"` — proof: N passed  
- [ ] **D2** Integration / RLS / edge as needed — proof: command exit 0  
- [ ] **D3** `cd app && npm run typecheck && npm run lint` — proof: green  

#### E. Real-world + ship
- [ ] **E1** Playwright and/or MCP Chrome: journey steps — proof: pass / screenshots  
- [ ] **E2** Localhost `:3002` (QA `qa@ipix.test`) — proof: notes  
- [ ] **E3** Preview (if deployed) — proof: URL + result  
- [ ] **E4** Production-safe smoke on ipix.co (read-only unless approved) — proof: notes  
- [ ] **E5** User journey + AI agent validation (if agents touched) — proof: prompts + outcomes  
- [ ] **E6** PR evidence + Linear Done — proof: PR # · CI green  

---

## 9. Acceptance criteria

- **A — …:** <observable Operator/Engineer outcome>  
- **B — …:** <edge / error>  
- **C — …:** empty · loading · success · error (UI)  
- **D — …:** <live / reactive if needed>  
- **E — Regression:** <named existing path still works>  

≤10 items. No security **OR** — one mandatory mechanism.

---

## 10. Tests & real-world validation

| Layer | Required when | Command / method |
|-------|---------------|------------------|
| Unit | Logic/UI change | vitest path above |
| Integration | API / DB / edge | vitest or supabase verify |
| Typecheck / lint | `app/` touched | `npm run typecheck` · `lint` |
| Playwright | User-facing flow | journey script / manual checklist |
| MCP Chrome DevTools | UI/UX debug | console + network on failure |
| Localhost | Always for /app | http://localhost:3002 |
| Preview | When preview env exists | preview URL |
| Production-safe | Ship gate for operator paths | ipix.co smoke, no destructive writes |
| User journey | Always if UI | before → during → after |
| AI agent | Mastra/CopilotKit touched | 2–3 real prompts; draft-only writes |

**QA login:** `qa@ipix.test` + Infisical/`QA_PASSWORD` — never commit secrets.

**Full standard:** [`docs/process/04-testing-qa-playbook.md`](../04-testing-qa-playbook.md) · evidence: [`qa-evidence-template.md`](./qa-evidence-template.md)

## 11. Risks & rollback

| Risk | Failure point | Rollback |
|------|---------------|----------|
| … | … | revert PR / feature flag / Dashboard undo |

## 12. PR evidence required

- [ ] One concern only (no docs+code mix)  
- [ ] Title: `IPI-NNN · TASK-ID — …`  
- [ ] Plain-English PR body + Why it matters in iPix  
- [ ] Proof commands pasted (exit 0)  
- [ ] Screenshots / journey notes if UI  
- [ ] Agent prompt results if AI  
- [ ] CI green · residual risks named  

---

## Optional (UI / async)

**Wireframe + states** (UI) · **Mermaid** current vs proposed + failure points (async/multi-service) · **Examples** `<example name="denied|allowed">` (RLS/AI/API)
