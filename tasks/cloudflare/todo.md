# Cloudflare Platform — Progress Task Tracker

**Last reviewed:** 2026-07-21  
**SSOT hierarchy:** **Linear status** → this file (**evidence + open work**) → root [`todo.md`](../../todo.md) (pointer only) → dated audits  
**Doc map:** [`index.md`](./index.md) · **Audit:** [`audit/j21-todo-audit.md`](./audit/j21-todo-audit.md)

| Lane | Progress | Bar |
|------|---------|-----|
| Native AI | ~12% | `██░░░░░░░░` |
| Hosting | ~85% | `████████░░` |
| Edge | ~95% | `█████████░` |

```text
Native:  586 ✅ → 607 🟡 → 750 → W1–W3 → 591 → W4–W6 → 609 → 592
Hosting: 472 ✅ → 632 ✅ → 631 (DNS later)
Edge:    695 ✅ → 697 ✅ → 699 ✅ → 742 ✅ · 698 parked
```

---

## Do next (only)

| # | Task | Plain English | Why |
|--:|------|---------------|-----|
| 1 | [IPI-607 · FLAGS](https://linear.app/amo100/issue/IPI-607) 🟡 | Per-agent Cloudflare vs legacy switch | [PR #565](https://github.com/amo-tech-ai/lumina-studio/pull/565) MERGEABLE — **merge** |
| 2 | [IPI-750 · W0](https://linear.app/amo100/issue/IPI-750) ⚪ | Attach `cfEnv`; flip **zero** agents | After #565 |
| 3 | W1 → W2 → W3 → [IPI-591](https://linear.app/amo100/issue/IPI-591) | Canary → planner → tool proof | Serial; do not skip 591 |
| Park | [IPI-698](https://linear.app/amo100/issue/IPI-698) · [IPI-631](https://linear.app/amo100/issue/IPI-631) · IPI-730 | DNA / DNS / SSO | Not next |

Keep `BI_PROVIDER` **ABSENT** until product flips Brand Hub.

**Linear:** [AI Platform — LLM Providers](https://linear.app/amo100/project/ai-platform-llm-providers-8088f63224f2) · [Progress Tracker doc](https://linear.app/amo100/document/cloudflare-progress-tracker-314ad98b0d69)

---

## Runtime (locked)

| Surface | Path | Custom Worker? |
|---------|------|----------------|
| OpenNext / Next.js | `env.AI.run()` + `gateway: { id: "ipix-prod" }` ([IPI-586](https://linear.app/amo100/issue/IPI-586) ✅) | No |
| Supabase Edge | REST `…/ai/v1/chat/completions` + `cf-aig-gateway-id` ([IPI-697](https://linear.app/amo100/issue/IPI-697) ✅) | No |
| Legacy app today | `AI_GATEWAY_URL` → `services/cloudflare-worker/` | Frozen → delete via [IPI-592](https://linear.app/amo100/issue/IPI-592) |

---

## Open work (active only)

| Order | Task | Plain English | Dot | % | Evidence / next |
|---:|------|---------------|:---:|---:|-----------------|
| 1 | [IPI-607](https://linear.app/amo100/issue/IPI-607) FLAGS | Per-agent routing switches | 🟡 | 85 | PR #565 — merge |
| 2 | [IPI-750](https://linear.app/amo100/issue/IPI-750) W0 | `cfEnv` + resolver; no flips | ⚪ | 0 | After #565 |
| 3 | [IPI-753](https://linear.app/amo100/issue/IPI-753) W1 | Marketing canary | ⚪ | 0 | After W0 |
| 4 | [IPI-751](https://linear.app/amo100/issue/IPI-751) W2 | Four simple agents | ⚪ | 0 | After W1 |
| 5 | [IPI-752](https://linear.app/amo100/issue/IPI-752) W3 | Production Planner | ⚪ | 0 | Unblocks 591 |
| 6 | [IPI-591](https://linear.app/amo100/issue/IPI-591) tools | Multi-turn on CF | ⛔ | 0 | After W3 |
| 7 | [IPI-754](https://linear.app/amo100/issue/IPI-754) W4 | Structured output | ⛔ | 0 | After 591 |
| 8 | [IPI-755](https://linear.app/amo100/issue/IPI-755) W5 | CRM + privacy | ⚪ | 0 | Needs 596/605 |
| 9 | [IPI-756](https://linear.app/amo100/issue/IPI-756) W6 | 100% rollout | ⚪ | 0 | Unblocks 609 |
| 10 | [IPI-609](https://linear.app/amo100/issue/IPI-609) soak | Zero legacy | ⛔ | 0 | After W6 |
| 11 | [IPI-592](https://linear.app/amo100/issue/IPI-592) delete Worker | Remove frozen Worker | ⚪ | 0 | **Last** |
| — | [IPI-594](https://linear.app/amo100/issue/IPI-594) parent | Tracker only | 🟡 | ~12 | Do children, not parent |
| — | [IPI-595](https://linear.app/amo100/issue/IPI-595) gateway auth | Dashboard auth proof | ⚪ | 25 | After FLAGS |
| — | [IPI-590](https://linear.app/amo100/issue/IPI-590)+ hardening | Cache / rate / spend | ⚪ | 0 | After canaries |
| — | [IPI-698](https://linear.app/amo100/issue/IPI-698) DNA | Vision eval | ⚪ | 0 | Parked |
| — | [IPI-631](https://linear.app/amo100/issue/IPI-631) DNS | Production hostname | ⚪ | 0 | After native+Edge stable |

Parent [IPI-594](https://linear.app/amo100/issue/IPI-594): do **not** implement as one mega-issue.

---

## ✓ Done (collapsed)

<details>
<summary><strong>Foundation + hosting + Edge — click for evidence</strong></summary>

| Done | Plain English | Evidence |
|------|---------------|----------|
| IPI-487 containment | Custom Worker not public | Architecture Decision |
| IPI-625 / 490 / 468 | OpenNext baseline, bundle, auth | Linear Done |
| IPI-655 | Marketing `/threads` 405 | PR #424 |
| **IPI-472** | OpenNext CI + preview pipeline | Linear Done 2026-07-18 |
| **IPI-632** | Remote preview smoke | Linear Done 2026-07-20 |
| **IPI-586** | One Workers AI call via `ipix-prod` | PR #550 · `ai` on `origin/main` |
| **IPI-695** | Edge ADR → REST (not Worker) | PR #448 |
| **IPI-697** | Edge REST client + BI wire | `cloudflare-client.ts` |
| **IPI-699** | Edge canary + rollback | Production Canary Verified |
| **IPI-742** | Edge deploy CI | Workflow + rollback runs |
| IPI-696 / 700 | Canceled / absorbed | Do not reopen |
| IPI-455 | Canceled | — |

</details>

---

## Verified facts (`origin/main` · 2026-07-21)

| Check | Result |
|-------|--------|
| `wrangler` `ai` binding | 🟢 Yes (PR #550) |
| IPI-586 smoke route | 🟢 Gated internal route |
| Agents on native CF | 🔴 0% (still `resolveModel()` / legacy) |
| Edge `cloudflare-client.ts` | 🟢 Present |
| `BI_PROVIDER` | 🟢 ABSENT (post-canary) |
| Custom Worker | 🟡 Frozen, still legacy path |

---

## Decision log

| Date | Decision | Reason | Linear / PR |
|------|----------|--------|-------------|
| 2026-07-14 | Freeze custom AI Worker | No more investment; delete later | IPI-592 gate |
| 2026-07-18 | Edge = official REST, not Worker broker | Deno cannot use `env.AI`; Option A | IPI-695 / #448 · IPI-700 canceled |
| 2026-07-18 | Hosting: OpenNext versions upload/deploy | Official Workers deploy path | IPI-472 |
| 2026-07-20 | BI canary via `BI_PROVIDER` only | Do not flip global `AI_PROVIDER` | IPI-699 |
| 2026-07-20 | Native smoke via `env.AI` + `ipix-prod` | Official binding recipe | IPI-586 / #550 |
| 2026-07-21 | FLAGS before any agent flip | Fail-closed per-agent rollback | IPI-607 / #565 |

---

## Risk register

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Tracker drifts from Linear | Wrong “next” work | High if manual | Linear first; re-probe before audits |
| Flip agents before FLAGS merge | No per-agent rollback | Med | Merge #565 before W0 |
| Set `BI_PROVIDER` without product ask | Brand Hub on CF unexpectedly | Med | Keep ABSENT |
| Revive custom Worker for Edge | Architecture regression | Low | IPI-700 canceled |
| Jump to DNS / DNA early | Distracts from agent waves | Med | Park 631 / 698 |

---

## Milestone success metrics

| Milestone | Success | Verification | Evidence |
|-----------|---------|--------------|----------|
| CF-M1 Native proof | One `ipix-prod` call | Smoke + log id | IPI-586 ✅ |
| CF-M1b Preview | Remote SSE + agent turn | Preview smoke | IPI-632 ✅ |
| CF-EDGE-M1 | BI via Gateway + rollback ≤5 min | Canary suite | IPI-699 ✅ |
| CF-M3 Agent migration | Waves behind flags; tools work | 607→W6 + IPI-591 | In progress |
| CF-M4 Cutover | Zero legacy; Worker deleted | IPI-609 + 592 | Not started |

---

## Production gates

- [x] IPI-586 smoke through `ipix-prod`
- [x] IPI-472 / IPI-632 preview path
- [x] IPI-697 / IPI-699 Edge BI path (switch ABSENT)
- [ ] IPI-607 FLAGS merged
- [ ] Any Mastra agent on native path
- [ ] IPI-591 multi-turn tools
- [ ] IPI-592 custom Worker deleted
- [ ] IPI-631 DNS (not next)

**Do not claim production AI cutover** — foundation + Edge proven; agent flips still 0%.

---

## Maintainability rules (from J21 meta-audit)

1. **Do not** duplicate status in Linear + this file + root todo + audit — Linear owns status; this file owns evidence for **open** CF work.  
2. **One** “Do next” section (above). Root `todo.md` links here; do not invent a third ranked list.  
3. Manual `%` is approximate until a Linear child-count generator exists — prefer bars + child Done counts.  
4. Collapse Done rows; expand only for evidence.  
5. Audits are **dated snapshots** — do not treat them as living SSOT.
