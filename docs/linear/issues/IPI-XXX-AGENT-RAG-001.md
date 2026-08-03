# IPI-XXX · AGENT-RAG-001 — Let Brand Intelligence cite similar brands and past context

**Role:** iPix engineer. One concern per PR. Research before custom code.

**Plain English:** On Brand Hub chat, Brand Intelligence can say “similar to X because …” using existing `search_brands` / context RPCs — with sources — then we stop (no Support/Postiz/extra agents).

| Field | Value |
|-------|--------|
| **MVP stage** | Core (thin slice) |
| **Parallel** | After AGENT-DNA-001 (shared answer shape) |
| **Blocked by** | Soft: AGENT-DNA-001 · embeddings health (IPI-492 related) |
| **Unblocks** | Credible BI research answers without new vendors |
| **Track** | AI · DNA |
| **Skills** | `ipix-task-lifecycle` · `mastra` · `ipix-supabase` · `worktrees` · `pr-workflow` |
| **Agents / hooks / commands** | `/research` · `mastra-agent-reviewer` · `/verify-task` |
| **Stack** | Supabase pgvector RPCs · Mastra `brand-intelligence` · existing embeddings path |

**Quality scores (1–5):** P4 · C3 · R4 · UV4 · LV4

---

## 1. Purpose

Wire **thin** brand RAG: retrieve similar brands / context snapshots under RLS and cite them in BI answers.

## 2. Real-world iPix example

- **Persona:** Operator  
- **Surface:** `/app/brand/[id]` Brand Intelligence chat  
- **Today:** `search_brands` / `search_context_snapshots` exist in DB types; BI tools do not expose a cite-similar flow in chat.  
- **After:** “Who are we similar to?” → top matches with score/distance + short why; “Based on crawl/context from &lt;date&gt;” when stale.

## 3. User journey impact

| Before | During | After |
|--------|--------|-------|
| Guessy comparisons | Asks for similar brands | Sees cited neighbors; decides next action |

## 4. Business value

Makes DNA advice feel researched without buying Apify/Xpoz or adding research agents.

## 5. Quality checks (pre-impl)

- [x] Reuse RPCs — no new vector DB  
- [x] Same agent `brand-intelligence`  
- [x] Stop after this thin slice (no talent/CRM/support RAG in this issue)  
- [x] Related embeddings errors: prefer fix via existing IPI-492 patterns if broken  

**Verdict:** Ship thin BI retrieval tool + citations.

---

## 6. Research checklist

- [ ] Supabase pgvector + RPC grants (`search_brands` execute)  
- [ ] Embedding write path / model dim 768  
- [ ] Mastra RAG docs — use only if simpler than one tool calling RPC  
- [ ] RLS: operator only sees allowed brands  
- [ ] Stale `analyzedAt` / crawl date handling  

## 7. Platform-first plan

| Step | Choice |
|------|--------|
| Dashboard | Confirm RPC + extension live |
| Existing | `search_brands`, `search_context_snapshots`, BI agent |
| Custom | One Mastra tool e.g. `searchSimilarBrands` + instruction to cite |

**Do NOT:** Apify · OpenClaw · second agent · full Mastra RAG platform rewrite  
**Out of scope:** Talent semantic match · CRM memory · Postiz · Support agent · observational memory (IPI-136)

---

## 8. Multi-step implementation prompt

```xml
<role>Implement IPI-XXX · AGENT-RAG-001 — Let Brand Intelligence cite similar brands and past context.</role>
<context>brand-intelligence agent only. Use existing Supabase RPCs. Cite sources. Thin slice then stop.</context>
<task>
1. Verify RPC + RLS with a safe probe.
2. Add BI tool(s) wrapping search_brands / context search; instructions require citations + as_of.
3. Tests for empty/stale/error; localhost Brand Hub prompts.
4. One-concern PR; do not start Support/Postiz work.
</task>
```

### Completion steps (A→E)

#### A. Research / setup
- [ ] **A1** RPC smoke (service or authenticated) — proof: sample rows or empty-ok  
- [ ] **A2** Confirm embedding coverage for QA brand — proof: notes  

#### B. Core change
- [ ] **B1** Tool(s) on `brandIntelligenceTools` — proof: unit tests  
- [ ] **B2** Instructions: cite name/id + score; never invent neighbors — proof: test  

#### C. Edges
- [ ] **C1** No neighbors → say none; suggest crawl/analyze — proof: test  
- [ ] **C2** RLS denial → safe error — proof: test or probe  

#### D. Automated tests
- [ ] **D1** Tool unit tests — proof: green  
- [ ] **D2** typecheck + lint — proof: green  

#### E. Real-world + ship
- [ ] **E1** `:3002` — “Find similar brands to this one” — proof: citations  
- [ ] **E2** DNA explain still works (AGENT-DNA regression) — proof: notes  
- [ ] **E3** PR + Linear · explicitly **stop** backlog creep  

---

## 9. Acceptance criteria

- **A — Cite:** Similar-brand answers include retrieved ids/names + similarity signal.  
- **B — Grounded:** No fabricated competitors.  
- **C — Tenant-safe:** RLS/org rules enforced via existing RPC path.  
- **D — Thin:** Only brand/context retrieval — not talent/CRM/support.  
- **E — Regression:** `explainPillar` path still healthy.  

---

## 10. Tests & real-world validation

Unit tools · optional supabase verify · localhost BI prompts · production-safe read-only.

## 11. Risks & rollback

| Risk | Failure point | Rollback |
|------|---------------|----------|
| Empty embeddings | Useless answers | Feature-flag tool; fix embed pipeline separately |
| Cross-brand leak | Bad RPC grants | Revert tool; re-run `supabase:verify-rls` |

## 12. PR evidence required

- [ ] One concern · citation screenshot/notes · RLS note · CI green · “no further agent vendors” in Out of scope  

**Out of scope:** Support · Postiz · Apify · OpenClaw · new agent IDs · shoot HITL · IPI-156 campaigns · full eval platform
