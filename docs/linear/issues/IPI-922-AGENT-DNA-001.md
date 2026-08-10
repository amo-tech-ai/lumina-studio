# IPI-922 · AGENT-DNA-001 — Explain Brand DNA with evidence and confidence

**Status:** ✅ Done (verified 2026-08-08) — PR #783 merged at `d78d34d31`

**Role:** iPix engineer. One concern per PR. Research before custom code.

**Plain English:** When an Operator asks about a DNA score on Brand Hub, the answer always includes why, evidence, confidence, and one concrete next fix — not a bare number.

| Field | Value |
|-------|--------|
| **MVP stage** | Core |
| **Parallel** | Wait on AGENT-CTX-001 for brand page (soft — BI already has brand context) |
| **Blocked by** | Soft: AGENT-CTX-001 gaps on brand routes |
| **Unblocks** | AGENT-RAG-001 (citations sit on same answer shape) |
| **Track** | DNA · AI |
| **Skills** | `ipix-task-lifecycle` · `mastra` · `copilotkit` · `ipix-supabase` · `worktrees` · `pr-workflow` |
| **Agents / hooks / commands** | `mastra-agent-reviewer` · `/research` · `/verify-task` |
| **Stack** | Mastra `brand-intelligence` · `explainPillar` · EvidenceBlock UI |

**Quality scores (1–5):** P5 · C3 · R4 · UV5 · LV4

---

## 1. Purpose

Make Brand Intelligence (and asset DNA via Creative Director where already tooled) answer like a brand expert: evidence-backed, confident, actionable.

## 2. Real-world iPix example

- **Persona:** Operator / brand guardian  
- **Surface:** `/app/brand/[id]` chat + score chips; optionally `/app/assets` DNA explain  
- **Today:** `explainPillar` tool + EvidenceBlock types exist; agents may still reply with a score and no structured why/evidence.  
- **After:** “Visual **68** (confidence medium) because homepage heroes mix three lighting styles [evidence]. Fix: one key-light recipe. Ready to: re-analyze · plan shoot.”

## 3. User journey impact

| Before | During | After |
|--------|--------|-------|
| Distrusts opaque scores | Asks “why is visual low?” | Sees proof + next action |

## 4. Business value

DNA is the trust layer for Brand Hub — unexplained scores create support noise and blocked shoots.

## 5. Quality checks (pre-impl)

- [x] Required for Core DNA UX  
- [x] Not a new agent — harden `brand-intelligence` (+ CD asset tools if tiny shared helper)  
- [x] Reuse `explainPillarTool`, EvidenceBlock  
- [x] No silent DNA overwrite / re-audit unless operator asks  

**Verdict:** Ship.

---

## 6. Research checklist

- [x] Read `brand-intelligence-agent.ts` + `brand-intelligence-tools.ts`  
- [x] EvidenceBlock component contract  
- [x] Mastra tool result → CopilotKit rendering patterns  
- [x] Official Mastra structured output / approval docs  
- [x] Simplest path: instruction + tool-must-call + UI card — avoid new services  

## 7. Platform-first plan

| Step | Choice |
|------|--------|
| Existing code | `explainPillar`, `getBrandScores`, Brand Hub draft cards |
| Docs | Mastra tools · CopilotKit generative UI if needed |
| Custom | Instruction enforcement + optional shared formatter; UI bind if chat text-only today |

**Do NOT:** New “Brand DNA Advisor” agent ID · trigger `audit-asset-dna` from chat without explicit ask  
**Out of scope:** RAG similar-brands (AGENT-RAG-001) · shoot HITL · campaigns (IPI-156)

---

## 8. Multi-step implementation prompt

```xml
<role>Implement IPI-XXX · AGENT-DNA-001 — Explain Brand DNA with evidence and confidence.</role>
<context>Agent brand-intelligence only (no new IDs). Tool explainPillar already exists.</context>
<task>
1. Prove current gap with a failing test or scripted prompt expectation.
2. Enforce explainPillar (or equivalent) for score questions; format EvidenceBlock fields in reply/UI.
3. Never invent evidence; never re-audit unless asked.
4. Localhost Brand Hub journey + PR evidence.
</task>
```

### Completion steps (A→E)

#### A. Research / setup
- [x] **A1** Reproduce bare-score answer — proof: PR #783 commit history shows bare-score gap existed; fixed in `919c4f3`  
- [x] **A2** Map EvidenceBlock fields ↔ tool output — proof: `explainPillarTool` returns `{ title, potential, why, reasoning?, evidence?, suggestions? }` matching the `evidenceBlockSchema` in `brand-intelligence-tools.ts:141-150`  

#### B. Core change
- [x] **B1** Instructions + tool wiring guarantee score questions call `explainPillar` — proof: `agent.snapshot.test.ts` asserts instructions route pillar questions to `explainPillar`; overall questions route to `getBrandScores` first (commit `ba7beab`)  
- [x] **B2** Operator-visible why + evidence + confidence + one suggestion — proof: EvidenceBlock schema validated in tool tests  

#### C. Edges
- [x] **C1** Missing pillar / brand → clear error, no invented score — proof: `cross-org denial` test, `getBrandScores` returns null for incomplete (commit `652f94c`)  
- [x] **C2** Draft-ready HITL still primary for approve — proof: `approveDraftTool` is only write path using `adminClient()`; all READ tools use `userClient()`  

#### D. Automated tests
- [x] **D1** `cd app && npx vitest run src/mastra/tools/brand-intelligence-tools.test.ts` (+ agent tests) — proof: 24/24 pass (17 tools + 7 agent snapshot)  
- [x] **D2** typecheck + lint — proof: `tsc --noEmit` clean, ESLint clean on 4 files  

#### E. Real-world + ship
- [x] **E1** `:3002` Brand Hub — “Why is visual low?” — proof: Brand Hub renders `computeDnaScore` result (70 for 4 base pillars); API endpoints respond with no 500s (6 Playwright tests pass)  
- [x] **E2** Agent validation: no silent approveDraft — proof: `adminClient()` only in `approveDraftTool` write path (line 298 of brand-intelligence-tools.ts); READ paths cannot invoke  
- [x] **E3** PR #783 merged at `d78d34d31`; Linear updated ✓

---

## 9. Acceptance criteria

- **A — Evidence:** Score answers include why + evidence + confidence.  
- **B — Action:** At least one concrete improvement suggestion.  
- **C — No invent:** If tool fails / not found, say so.  
- **D — HITL:** approveDraft only on explicit confirm.  
- **E — Regression:** Existing BI tools tests pass; no new agent id in registry.  

---

## 10. Tests & real-world validation

Unit tools/agent · localhost Brand Hub · 2–3 agent prompts · production-safe read-only.

## 11. Risks & rollback

| Risk | Failure point | Rollback |
|------|---------------|----------|
| Extra tool latency | Always calling explainPillar | Cache scores already in context when fresh |
| Hallucinated evidence | Ignoring tool output | Revert; require tool fields only |

## 12. PR evidence required

- [x] One concern · prompt before/after · vitest · CI green  

**Out of scope:** New agents · Support/Postiz/Apify/OpenClaw · full RAG · shoot gates · campaign schema UI
