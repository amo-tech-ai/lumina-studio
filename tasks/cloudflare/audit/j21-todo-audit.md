# J21 — Cloudflare todo ↔ Linear audit

**Date:** 2026-07-21  
**Authority:** Linear status first · `origin/main` for code · Cloudflare docs MCP for API shape  
**Skills used:** `cloudflare` · `cloudflare-workflow` · `cloudflare-workers-testing` · `task-verifier` (Quick gate on tracker drift)  
**Docs MCP:** `plugin-cloudflare-cloudflare-docs` → Workers AI binding + AI Gateway REST  
**Companion boards:** [`todo.md`](../../../todo.md) (root) · [`tasks/cloudflare/todo.md`](../todo.md)

---

## Verdict (1 sentence)

**Native AI proof + Edge canary are Done in Linear; status sync is done; tracker was reorganized (one Do next, collapsed Done); remaining gap is automation so Linear stays the only status SSOT.**

| Score | Value | Meaning |
|------:|------:|---------|
| **Linear status accuracy (pre-sync)** | **42 / 100** | Edge + verified-facts contradicted Linear Done |
| **Linear status accuracy (post-sync)** | **96 / 100** | Matches Linear on 586/607/697/699/472/632 |
| **Tracker structure / maintainability (meta)** | **91 / 100** | User meta-audit — architecture strong; automation still open |
| **Architecture / order** | **97 / 100** | Three lanes + FLAGS → W0…W6 |
| **Overall CF migration readiness** | **~55%** | Hosting+Edge proven; agent flips still **0%** |

### Dot legend (this audit)

| Dot | Meaning |
|:---:|---------|
| 🟢 | Linear Done + evidence on `origin/main` / PR |
| 🟡 | In Progress or partial |
| ⚪ | Todo / Backlog — still required |
| 🔴 | Tracker error / contradiction / unsafe claim |
| ⛔ | Blocked by dependency or human |

---

## Official docs vs iPix path (platform-first)

| Need | Official first | iPix choice | Verdict |
|------|----------------|-------------|---------|
| Workers → Workers AI + Gateway | [`env.AI` binding](https://developers.cloudflare.com/ai-gateway/integrations/aig-workers-ai-binding/) + `gateway: { id }` | IPI-586 smoke · `ai` on `origin/main` wrangler | 🟢 Correct — **do not** invent a second broker |
| Deno Edge → AI | [AI Gateway REST](https://developers.cloudflare.com/ai-gateway/usage/rest-api/) `POST …/ai/v1/chat/completions` + `cf-aig-gateway-id` | IPI-697 `cloudflare-client.ts` | 🟢 Correct — Edge **cannot** use `env.AI` |
| Deprecated `/compat` | Docs mark Unified `/compat` **deprecated** | Explicitly forbidden in IPI-697 | 🟢 |
| Custom Worker as Edge broker | Not required for REST | IPI-700 Canceled · Worker frozen | 🟢 |
| OpenNext deploy | OpenNext CLI + Wrangler versions | IPI-472 Done | 🟢 |
| Feature flags | Dashboard Flagship / env vars | IPI-607 env flags (PR #565) | 🟡 Env flags OK for MVP; Flagship binding later if multi-env targeting needed |

**Stop rule:** Dashboard → CLI (`wrangler`, `supabase`, `gh`) → built-ins → docs/recipes → **smallest code**. Do not revive `services/cloudflare-worker/` for Edge or native Mastra.

---

## Errors / red flags found (pre-refresh tracker)

| # | Finding | Severity | Fix |
|---|---------|:--------:|-----|
| E1 | `tasks/cloudflare/todo.md` rows 15–20: IPI-697/699 still **Todo 0%**, “no cloudflare provider” | 🔴 | Mark Done; cite canary + `origin/main` client |
| E2 | “Verified facts (2026-07-18)”: no `ai` binding, IPI-586 Todo, zero traffic | 🔴 | Rebase facts to 2026-07-21 / `origin/main` (PR #550) |
| E3 | IPI-472 / IPI-632 still In Progress / Backlog in master table | 🔴 | Linear **Done** — update dots |
| E4 | IPI-607 listed **Todo / start here** while Linear **In Progress** + PR #565 | 🔴 | Bump 🟡 In Progress |
| E5 | IPI-695 “In Progress / Option B conflict” as active blocker | 🟡 | Linear **Done**; residual ADR wording = optional docs follow-up, **not** Edge blocker |
| E6 | IPI-696 still shown as Todo client work | 🔴 | **Canceled / Duplicate** → merged into 697 |
| E7 | Immediate next steps still “Execute IPI-586” | 🔴 | Next = merge #565 → IPI-750 |
| E8 | Dirty local checkout missing AI binding / Edge client | 🟡 | Always probe `origin/main` or worktree — not dirty workspace |
| E9 | Production gates still unchecked for IPI-586 | 🟡 | Checkbox IPI-586 done; leave agent gates open |
| E10 | Weighted “Native ~38%” mixed with stale Edge ~3% | 🟡 | Recalculate lanes separately |

---

## What’s missing

| Gap | Impact | Suggest |
|-----|--------|---------|
| Merge **PR #565** (IPI-607) | Blocks W0 cleanly | Merge when CI green |
| **IPI-595** gateway auth dashboard re-check | Native auth proof thin | Dashboard toggle + one authenticated call after 607 |
| Agent code still `resolveModel()` static | 0% flips | IPI-750 then waves |
| Flagship vs env flags | Ops scale | Stay env until multi-brand targeting needs Flagship |
| DNA vision (**IPI-698**) | Parked | Only after product asks |
| ADR Option B leftover text | Doc drift | Separate docs-only PR if still contradictory |
| Local tree behind `origin/main` | False “not shipped” audits | `git fetch` + `git show origin/main:…` |

---

## Implementation order — correct?

**Yes for the native agent lane.** Hosting and Edge are **parallel Done lanes**, not blockers for 607→750.

```text
Hosting (Done):     IPI-472 ✅ → IPI-632 ✅  … IPI-631 DNS later
Edge (Done):        IPI-695 ✅ → IPI-697 ✅ → IPI-699 ✅ → IPI-742 ✅  · IPI-698 parked
Native (active):    IPI-586 ✅ → IPI-607 🟡 → IPI-750 → W1–W3 → IPI-591 → W4–W6 → IPI-609 → IPI-592
```

| Question | Answer |
|----------|--------|
| Should 607 come before W0? | **Yes** — fail-closed per-agent switches before any resolver that can flip |
| Should 591 wait for W3? | **Yes** — tool-call proof needs planner on native path |
| Should 592 be last? | **Yes** — delete custom Worker only after zero-legacy |
| Jump to DNA / DNS next? | **No** |

---

## Task-by-task table (graded)

### Native AI / Mastra lane

| Order | Task | Plain English | Linear | Dot | % | Order OK? | Efficient path | Score |
|---:|---|---|---|:---:|---:|:---:|---|---:|
| 0 | **IPI-586 · CF-AI-003** | Prove one Workers AI call via `ipix-prod` | Done · PR #550 | 🟢 | 100 | ✅ | Binding + smoke only — already done | 98 |
| 1 | **IPI-607 · FLAGS** | Per-agent Cloudflare vs legacy switch | **In Progress** · #565 | 🟡 | 85 | ✅ | Env flags → merge; Flagship later | 90 |
| 2 | **IPI-750 · W0** | Attach `cfEnv`; flip **nobody** | Todo | ⚪ | 0 | ✅ | Dynamic Mastra `model` + fail-closed | 88 |
| 3 | **IPI-753 · W1** | Marketing chat canary | Todo | ⚪ | 0 | ✅ | Lowest-risk agent first | 85 |
| 4 | **IPI-751 · W2** | Four simpler operator agents | Todo | ⚪ | 0 | ✅ | Batch after W1 soak | 82 |
| 5 | **IPI-752 · W3** | Production Planner | Todo | ⚪ | 0 | ✅ | Hardest tools last among early waves | 80 |
| 6 | **IPI-591** | Multi-turn tools on CF | Backlog · blockedBy 752 | ⛔ | 0 | ✅ | Wait after W3 — don’t invent early | 78 |
| 7 | **IPI-754 · W4** | Structured-output agents | blockedBy 591 | ⛔ | 0 | ✅ | After tool proof | 75 |
| 8 | **IPI-755 · W5** | CRM + privacy | Todo | ⚪ | 0 | ✅ | Needs 596/605 | 72 |
| 9 | **IPI-756 · W6** | 100% rollout | Todo | ⚪ | 0 | ✅ | Counters + soak | 70 |
| 10 | **IPI-609** | Zero legacy | blockedBy 756 | ⛔ | 0 | ✅ | Soak gate | 70 |
| 11 | **IPI-592** | Delete custom Worker | Backlog | ⚪ | 0 | ✅ | **Last** | 95 |
| — | **IPI-594** parent | Tracker only | In Progress | 🟡 | ~12 | ✅ | Never mega-implement parent | 90 |
| — | **IPI-595** | Gateway auth verify | Todo | ⚪ | 25 | ✅ | Dashboard first, then one call | 70 |
| — | **IPI-590 / 596–605** | Gateway features | Backlog | ⚪ | 0 | ✅ | One feature at a time **after** canaries | 65 |

### Hosting lane

| Order | Task | Plain English | Linear | Dot | % | Order OK? | Efficient path | Score |
|---:|---|---|---|:---:|---:|:---:|---|---:|
| H1 | **IPI-472 · INFRA-001** | OpenNext CI + preview pipeline | Done | 🟢 | 100 | ✅ | Versions upload/deploy — done | 95 |
| H2 | **IPI-632 · CF-MIG-220** | Remote preview smoke | Done | 🟢 | 100 | ✅ | SSE + agent turn — done | 92 |
| H3 | **IPI-631** DNS cutover | Production hostname | Backlog | ⚪ | 0 | ✅ | **After** native + Edge stable | 90 |

### Edge lane (Supabase → Gateway REST)

| Order | Task | Plain English | Linear | Dot | % | Order OK? | Efficient path | Score |
|---:|---|---|---|:---:|---:|:---:|---|---:|
| E0 | **IPI-695 · ADR** | Document Edge → REST (not Worker) | Done | 🟢 | 100 | ✅ | Docs-only | 85* |
| E1 | **IPI-696** | Separate client ticket | Duplicate/Canceled | ⚪ | N/A | ✅ | Merged into 697 — correct | 100 |
| E2 | **IPI-697 · client+BI** | Brand Hub can call CF via REST | Done | 🟢 | 100 | ✅ | One PR: client + wire | 96 |
| E3 | **IPI-699 · canary** | Secrets + canary + rollback | Done | 🟢 | 100 | ✅ | Ops-only `BI_PROVIDER` | 97 |
| E4 | **IPI-742 · Edge deploy CI** | Approval-gated Edge deploy | Done | 🟢 | 100 | ✅ | After manual cycle | 94 |
| E5 | **IPI-698 · DNA vision** | Eval vision models | Backlog | ⚪ | 0 | ✅ | Parked — correct | 90 |

\*ADR Option B leftover text may still exist in merged docs — score −15 until cleaned in a **docs-only** PR.

---

## Improvements (ranked)

1. **Merge PR #565** — unblocks W0; single highest leverage.  
2. **Keep `BI_PROVIDER` ABSENT** until product intentionally flips Brand Hub.  
3. **Refresh Linear Progress Tracker doc** to match this audit (same statuses).  
4. **IPI-595** dashboard auth check — 15 min, no code if toggle already on.  
5. **Docs-only ADR cleanup** if Option B language remains (do not mix with 607).  
6. **Consider Flagship** only when per-preview targeting exceeds env vars.  
7. Probe **`origin/main`**, not dirty local trees, in every future CF audit.

---

## Efficiency model (do this, not that)

| Task | ❌ Inefficient | ✅ Efficient |
|------|----------------|--------------|
| IPI-607 | Custom flag service | Env enum + fail-closed (PR #565) |
| IPI-750 | Rewrite all agents | `cfEnv` + resolver; zero flips |
| W1–W3 | Flip all agents at once | One agent / wave + rollback flag |
| Edge LLM | Custom Worker broker | Official REST + `cf-aig-gateway-id` |
| Hosting | Raw `wrangler deploy` forever | OpenNext + versions upload/deploy |
| Verify Done | Trust todo.md | Linear + `origin/main` + PR |

---

## Grading rubric (how scores were made)

| Dimension | Weight | What we measured |
|-----------|-------:|------------------|
| Linear ↔ tracker match | 30% | Status + % + next action |
| Code evidence on `origin/main` | 25% | Binding, client, smoke |
| Official docs alignment | 20% | Binding vs REST vs deprecated paths |
| Order / dependency hygiene | 15% | blockedBy, wave order |
| Platform-first / ponytail | 10% | No custom Worker revival |

**Composite tracker (pre):** 0.30×20 + 0.25×40 + 0.20×70 + 0.15×90 + 0.10×80 ≈ **42**  
**Composite architecture:** ≈ **94** (order strong; ADR residue −6)

---

## Production-ready gates (honest)

| Gate | Status |
|------|:------:|
| One real `ipix-prod` Workers AI request (app smoke) | 🟢 IPI-586 |
| Edge BI canary + rollback | 🟢 IPI-699 |
| Preview Worker pipeline + remote smoke | 🟢 472 / 632 |
| Per-agent flags merged | 🟡 #565 |
| Any Mastra agent on native path | 🔴 0% |
| Custom Worker deleted | ⚪ IPI-592 last |
| DNS cutover | ⚪ IPI-631 |

**Do not claim production AI cutover.** Claim: **foundation + Edge proven; agent migration starting at FLAGS.**

---

## Sync actions taken this session

1. Root [`todo.md`](../../../todo.md) — IPI-607 → In Progress; Plain English column; audit link; single Do-next pointer to CF todo.  
2. [`tasks/cloudflare/todo.md`](../todo.md) — Linear status sync **and** reorganized (one Do next, collapsed Done, decision log, risks, milestone metrics, progress bars).  
3. This audit written / extended with meta-audit verification below.

**Validation level:** Docs / Linear / `origin/main` probe Verified — **not** Production Verified for agent traffic.

---

## Meta-audit verification (user 91/100 review · 2026-07-21)

**Verdict on that review:** mostly **correct**. It grades the *tracker as a living SSOT*, not only Linear status accuracy.

| Claim from meta-audit | Correct? | Notes |
|----------------------|:--------:|-------|
| Architecture / three lanes excellent | ✅ | Confirmed — score ~97–98 fair |
| Task order 586→607→750→…→609 correct | ✅ | No change recommended |
| Official CF / OpenNext / Gateway alignment strong | ✅ | Binding + REST match docs MCP |
| Linear integration good | ✅ | After status sync |
| Biggest weakness = too many manual copies | ✅ | Root todo + CF todo + Linear + audits still overlap |
| Duplicate “Next” sections | ✅ | Was true; **fixed** — one Do next in CF todo; root points to it |
| Manual % hard to maintain | ✅ | Still approximate; bars added; auto-from-Linear **not built** |
| Collapse completed phases | ✅ | **Done** in CF todo (`<details>`) |
| Decision log / risk / success metrics missing | ✅ | **Added** to CF todo |
| Auto-generate from Linear API | ✅ as recommendation | **Not implemented** — follow-up (script or Linear doc sync) |
| Overall 91/100 as *post-architecture* grade | 🟡 | Fair for structure; **pre-sync status accuracy was ~42** — different axis |

### Have Linear status corrections been made?

| Correction (E1–E7) | Applied to `tasks/cloudflare/todo.md`? |
|--------------------|:--------------------------------------:|
| 697 / 699 Done | ✅ |
| 586 Done + verified facts refreshed | ✅ |
| 472 / 632 Done | ✅ |
| 607 In Progress + PR #565 | ✅ |
| 695 Done (not active Option B blocker) | ✅ |
| 696 Canceled/Duplicate | ✅ |
| Next ≠ “execute 586” | ✅ |

### Have maintainability corrections been made?

| Improvement | Status |
|-------------|:------:|
| One “Do next” | ✅ |
| Collapse Done foundation/hosting/Edge | ✅ |
| Decision log table | ✅ |
| Risk register | ✅ |
| Milestone success metrics | ✅ |
| Progress bars | ✅ |
| Auto % from Linear children | ❌ Not yet |
| Stop all multi-doc status edits forever | 🟡 Hierarchy documented; discipline required |

### Recommended SSOT (agreed)

```text
Linear (status)
    ↓
tasks/cloudflare/todo.md  (open work + evidence only)
    ↓
root todo.md              (cross-lane pointer — do not re-author CF detail)
    ↓
dated audits              (snapshots — not living SSOT)
```

**Highest remaining ROI:** a small generator (Linear MCP / API → markdown table) so `%` and dots are not hand-edited. Until then, treat manual `%` as approximate and re-probe Linear before claiming Done.

