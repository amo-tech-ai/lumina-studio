# 04 · Testing & QA Playbook

**Goal:** Prove each iPix change works for real operators — correctly, safely, clearly — before and after merge.

**Depends on:** [02 Task Template](./02-task-template.md) · [03 Research](./03-ai-research-playbook.md)  
**SSOT commands:** [verify-matrix](../../.claude/skills/pr-workflow/references/verify-matrix.md) · lifecycle [testing.md](../../.claude/skills/ipix-task-lifecycle/testing.md)  
**Paste into Linear:** [templates/qa-evidence-template.md](./templates/qa-evidence-template.md)

**Dev:** `http://localhost:3002` (free the port; do not switch).  
**Prod:** `https://ipix.co` — production-**safe** only.  
**QA login:** `qa@ipix.test` + `QA_PASSWORD` via Infisical / `.env.local` — **never commit or paste secrets**.

---

## 1. Testing principles

| Principle | Meaning |
|-----------|---------|
| Journey first | Test what the Operator/Engineer does, not only modules |
| Automate the deterministic | Vitest / CI first; browser next |
| Evidence or it didn’t happen | Command output, screenshot path, network status |
| Production-safe | No destructive writes on ipix.co unless explicitly approved |
| One concern | Tests match the PR’s single concern |
| Reuse | Extend existing tests before new harnesses |
| Honest level | Label Unit / Build / Local / Preview / Production Verified |

---

## 2. Test pyramid (iPix)

```text
        /\
       /  \  Prod-safe smoke + monitoring   (few, careful)
      /----\
     / Brow \  Playwright + MCP Chrome      (journeys)
    /--------\
   / Agent&DB \  Mastra · CopilotKit · RLS · Edge
  /------------\
 /  API / SA    \  Route handlers · Server Actions
/----------------\
        Unit Vitest + typecheck + lint     (most)
```

**Standard sequence:**  
Unit → Integration → API → DB/RLS → Agent/Tool → Browser → Mobile → A11y → Perf → Preview → Prod-safe smoke → Monitoring

Skip layers that the change doesn’t touch — **never skip** layers it does.

---

## 3. Standard test matrix

| Area | Local | Pre-merge (CI/PR) | Preview | Prod-safe | Tools |
|------|-------|-------------------|---------|-----------|-------|
| Unit / integration | `cd app && npx vitest run …` | `app` tests job | — | — | Vitest |
| Types / lint | typecheck · lint | same | — | — | tsc · ESLint |
| API / Server Actions | route tests · curl local | CI + focused tests | hit preview URL | GET/smoke only | Vitest · fetch |
| Supabase tables/RLS/RPC | verify-rls · SQL probes | `supabase-verify-rls` | linked non-prod if any | read-only advisors | Supabase CLI · Dashboard |
| Edge Functions | invoke local/remote test fn | verify-edge | preview worker/fn | health only | CLI · Dashboard |
| Realtime | subscribe on local | — | optional | avoid spam | client test |
| Cloudflare Worker | vitest / wrangler | `cloudflare-worker-tests` | CF preview deploy | health/metrics | Wrangler · Dashboard |
| Mastra agents | local `:3002` + Studio if used | agent unit tests | preview chat | 1–2 read-only prompts | Mastra · CopilotKit |
| CopilotKit stream/tools | SSE + tool calls local | runtime tests | preview | careful | DevTools network |
| Browser journey | Playwright · MCP Chrome | Playwright in CI when present | preview URL | ipix.co smoke | Playwright · Chrome MCP |
| Mobile / responsive | 375 + 1280 | — | same | same | DevTools device mode |
| Accessibility | keyboard · labels · contrast spot | lint a11y if configured | — | — | Chrome a11y · checklist |
| Performance / bundle | note LCP/jank; `next build` size | `app-build` | — | Web Vitals if available | build · DevTools perf |
| Security / secrets | no `.env` in diff; Infisical | CI secret-scan / hooks | — | — | Infisical · hooks |
| Error recovery | force 401/400/RLS deny | unit cases | — | — | Vitest · browser |
| Rollback | revert plan documented | — | redeploy previous | feature flag / revert PR | git · CF/Vercel |
| Observability | — | — | preview logs | Sentry/CF/Supabase logs post-merge | Dashboards |

Path-conditional commands: always use **verify-matrix**.

---

## 4. Required workflow (every task)

1. Understand the **user journey**  
2. Name **success + failure** paths  
3. **Inspect/reuse** existing tests  
4. Define **local · preview · prod-safe** checks  
5. Run **deterministic** tests first  
6. **MCP Chrome** for DOM/network/console  
7. **Playwright** for repeatable journeys  
8. Verify **DB / AI / externals** separately  
9. **Record evidence**  
10. Recommend fixes → **retest**

---

## 5. Real-world user journey template

Copy into Linear § Tests / Real-world validation:

```markdown
### Journey — IPI-NNN
**Persona:** Operator | Engineer  
**Scenario:** <e.g. Open shoot from /app/shoots and confirm brief loads>  
**Creds:** qa@ipix.test via Infisical (QA_PASSWORD)  
**Browsers:** Chromium (required) · Safari/Firefox if UI-critical  
**Sizes:** 375×812 · 1280×800  

| Step | Action | Expected | Fail if |
|------|--------|----------|---------|
| 1 | … | … | … |

**Critical success:** …  
**Critical failure paths:** empty · 401 · RLS deny · tool error · stream drop  
```

---

## 6. Agent testing checklist (Mastra + CopilotKit)

- [ ] Agent id matches registry = frontend `useAgent({ agentId })`  
- [ ] Stream starts; tokens/UI update (no stuck spinner)  
- [ ] Tool calls fire with expected args  
- [ ] **Draft-only** writes; HITL before durable mutation  
- [ ] Error surfaces clearly (not blank / fake 502)  
- [ ] Page context present (brand/shoot) without re-asking  
- [ ] 2–3 real prompts on the target screen  
- [ ] No `NEXT_PUBLIC_*_API_KEY` / client secrets  

---

## 7. Browser testing checklist

- [ ] Happy path on desktop 1280  
- [ ] Same path mobile 375  
- [ ] Empty · loading · error · success states  
- [ ] Console clean of unexpected errors  
- [ ] Network: API status codes match AC  
- [ ] Keyboard: primary actions reachable  
- [ ] No secret values in screenshots committed to git  
- [ ] Playwright journey scripted when path is Core MVP  

**MCP Chrome:** use for failed journeys — console, network, DOM.  
**Playwright CLI:** `npx playwright test` (repo `playwright.config.ts` / prod config as appropriate).

---

## 8. Production-safe testing rules

| Allowed on ipix.co | Forbidden without explicit approval |
|--------------------|-------------------------------------|
| Login as QA (if enabled) | Delete/overwrite real brand/shoot data |
| Read-only navigation of `/app` surfaces | Payments / live Stripe charges |
| 1–2 non-mutating agent prompts | Bulk crawls / webhook floods |
| Health endpoints | Pasting service-role or AI keys |

**Preview (Cloudflare / host preview):** fuller write tests OK on non-prod data only.  
**Rollback test:** document how to revert (previous deploy / PR revert / flag) and who runs it.

---

## 9. Pre-merge and post-merge checklists

### Pre-merge

- [ ] Journey + failure paths listed  
- [ ] verify-matrix rows for touched paths green  
- [ ] New/changed behavior has automated coverage (or explicit N/A)  
- [ ] Local `:3002` journey with QA user  
- [ ] Agent checks if AI touched  
- [ ] Mobile spot-check if UI touched  
- [ ] One-concern PR; no secrets in diff  
- [ ] Evidence pasted in PR / Linear  
- [ ] Residual risk level named  

### Post-merge

- [ ] Required CI checks green on `main`  
- [ ] Prod-safe smoke on affected surface  
- [ ] Check logs/Sentry/CF/Supabase for new errors (15–30 min)  
- [ ] If bad: rollback plan executed; Linear follow-up filed  

---

## 10. Evidence template

See [`templates/qa-evidence-template.md`](./templates/qa-evidence-template.md). Minimum before **Done**:

| Field | Example |
|-------|---------|
| Commands run | `cd app && npx vitest run src/…` → N passed |
| Local journey | screenshot or step table |
| Preview/prod | URL + result (or N/A) |
| Agent | prompts + outcomes |
| Verdict | pass / blocked |
| Fixes recommended | severity + suggestion |

---

## 11. Defect severity & release decision

| Severity | Example | Merge? |
|----------|---------|--------|
| **S0 Blocker** | Auth break, data leak, RLS bypass, payment wrong | **No** |
| **S1 High** | Core journey broken (list→detail 404, agent tools dead) | **No** |
| **S2 Medium** | Secondary path / wrong empty state | Fix same PR or follow-up before Done |
| **S3 Low** | Polish, non-blocking copy | Can merge; file follow-up |
| **S4 Nit** | Style preference | Optional |

**Release decision:** merge only if no open S0/S1 on this concern and pre-merge checklist complete.

---

## Every Linear task must define

- Real-world iPix scenario  
- Creds + secret handling (Infisical)  
- Browsers + sizes  
- Expected results + failure cases  
- Local · pre-merge · post-merge · prod-safe · rollback  
- Evidence required before Done  

---

## Multistep prompt — QA a task

```xml
<role>You are iPix QA. Prove the task works; then recommend fixes.</role>
<context>
Playbook: docs/process/04-testing-qa-playbook.md
Local :3002 · QA qa@ipix.test via Infisical · Prod ipix.co safe-only
Verify-matrix for touched paths.
</context>
<task>
1. Restate journey + success/failure paths.
2. Reuse existing tests; add only what’s missing.
3. Run sequence for touched layers (unit→…→prod-safe).
4. MCP Chrome on failures; Playwright for Core journeys.
5. Fill evidence template; severity for each defect.
6. Merge verdict: pass / blocked + rollback note.
</task>
<constraints>No prod mutations. No secrets in git. Honest verification level.</constraints>
```

---

## Tools quick ref

| Tool | Use |
|------|-----|
| Vitest | Unit/integration in `app/` (+ worker package) |
| Playwright CLI | Repeatable journeys |
| MCP Chrome DevTools | Inspect fail: console/network/DOM |
| Wrangler + CF Dashboard | Worker tests · preview · logs |
| Supabase CLI + Dashboard | RLS · migrations · edge · advisors |
| Mastra Studio | Agent debug when available |
| CopilotKit | Streaming + tools on `/app` |
| GitHub Actions | Pre-merge gates (Protect main) |
| Infisical | Inject `QA_PASSWORD` and API secrets |

---

## Done when

- [ ] Linear tasks use journey + evidence sections  
- [ ] Agents attach evidence before Done  
- [ ] S0/S1 never merge knowingly  
