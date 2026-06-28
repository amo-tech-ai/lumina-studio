# June 28 Linear Audit — Forensic Verification Report (Rev 3)

**Date:** 2026-06-28 (Rev 3 — final accuracy pass)  
**Auditor:** Cursor agent · Linear MCP + Supabase MCP + disk probes + CI  
**Epic:** [IPI-222](https://linear.app/amo100/issue/IPI-222) — Production Certification  
**Skills cross-checked:** `copilotkit` · `mastra` · `gemini` · `ipix-supabase` · `task-verifier`  
**Prior reports:** Rev 1 (stale) · Rev 2 (8 fixes) · **Rev 3 fixes 6 Rev-2 errors (§2b)**

---

## Executive Summary

| Metric | Rev 1 (stale) | Rev 3 (verified) |
|--------|---------------|------------------|
| Cert-path **completion** | 4/12 (33%) | **5/12 (42%)** — IPI-228 merged |
| Cert-path **readiness score** | 50% (mislabeled) | **70%** — avg of 12 child task scores (§3) |
| Certification | ❌ NOT ISSUED | ❌ NOT ISSUED |

**Cert-path tasks (12):** IPI-223, 225, 226, 227, 228, 229, 230, 231, 232, 233, 234, 235  
**Phase 0–2 (7 tasks):** 5 Done · 2 Todo (IPI-229, IPI-230)  
**Phase 3 (5 tasks):** all Todo (IPI-231–235)

**Build health (`main` @ `9de36a8`, 2026-06-28):**

| Probe | Result | Notes |
|-------|--------|-------|
| `cd app && npm run lint` | ✅ | CI `app-build` |
| `cd app && npx tsc --noEmit` | ✅ | CI |
| `cd app && npm run build` | ✅ | CI |
| `cd app && npm test` | ⚠️ | 390 pass / 6 skip / 398 total; 2 local Mastra flakes; CI green |
| `.github/workflows/ci.yml` | ✅ | **`supabase-web015`** + **`app-build`** |
| `check-client-env.mjs` in CI | ✅ | `ci.yml:49-51` |
| `infisical run -- npm run supabase:verify-rls` | ⏭️ | Run at IPI-231 |

---

## §1 — Master Verification Checklist

Use this as the epic gate. Mark ✅ only with probe citation.

### Epic gate (IPI-222 / IPI-235)

- [ ] Phase 0–2: IPI-223, 225, 226, 227, 228, 229, 230 all **Done** on Linear
- [x] IPI-223 Done — [Linear](https://linear.app/amo100/issue/IPI-223)
- [x] IPI-225 Done — PR #130
- [x] IPI-226 Done — PR #133
- [x] IPI-227 Done — PR #134
- [x] IPI-228 Done — PR #136 merged `9de36a8` (Linear synced Done rev 2)
- [ ] IPI-229 Todo — social-discovery deploy/retire
- [ ] IPI-230 Todo — prod auth + CopilotKit config
- [ ] Phase 3: IPI-231 verify suite + edge inventory green with pasted output
- [ ] Phase 3: IPI-232 build gate confirmed on `main` + Vercel prod
- [ ] Phase 3: IPI-233 V-005 chain matrix (runtime evidence, not code-only)
- [ ] Phase 3: IPI-234 browser/DevTools QA
- [ ] IPI-235: `docs/audit/verification-ledger-YYYY-MM-DD.md` created
- [ ] Fix plan tracker updated (`2028-06-28-fix-plan.md` still shows **0/19** — stale)

### Skill compliance (cert path)

| Skill | Rule | Verified |
|-------|------|----------|
| **copilotkit** | v2 imports only; `withOperatorAuth` on operator API routes | ✅ `route.ts`, `operator-gate.ts`, lint CI |
| **mastra** | `getMastra()` in handler body only; tool IDs match registry | ✅ shoot commit uses shared lib, not edge |
| **gemini** | Default `gemini-3.1-flash-lite` (IPI-223) in app + edge code | ✅ `models.ts` + `_shared/gemini.ts`; markdown inventory doc still says 2.5 (F9) |
| **ipix-supabase** | RLS on public tables; RPC service_role only | ✅ IPI-227 `mastra_*` RLS + revoke; `commit_shoot_draft` grants |
| **task-verifier** | No Done without disk + test proof | ⚠️ IPI-228 Done justified; IPI-233/234 not proven live |

---

## §2 — Errors in Rev 1 Audit (corrected)

| # | Rev 1 claim | Actual (probe) | Severity |
|---|-------------|----------------|----------|
| E1 | PR #136 / IPI-228 open | **Merged** `9de36a8` 2026-06-28 | 🔴 Stale |
| E2 | `.github/workflows/ci.yml` does not exist | **Exists** — `app-build`: lint → build → tsc → test + `check-client-env.mjs` | 🔴 Wrong |
| E3 | `saveApprovedShootDraft.ts` still calls edge fn | **Uses `commitShootDraft`** — `rg callEdgeFunction saveApprovedShootDraft` → 0 | 🔴 Wrong |
| E4 | `npm test` 381 passed | **390 passed**, 6 skipped, 398 total; 2 local flakes | 🟡 Stale count |
| E5 | IPI-232 blocked on “create CI” | CI **already ships**; IPI-232 = confirm gates + Vercel parity | 🔴 Wrong scope |
| E6 | Gemini default `gemini-3.5-flash` everywhere | App default **`gemini-3.1-flash-lite`** (IPI-223); 3.5 is pro override | 🟡 Stale |
| E7 | IPI-233 chain 5 “100% working” | **Code complete**; V-005 runtime **blocked by environment** | 🟡 Overstated |
| E8 | Retire `save-approved-shoot-draft` under IPI-229 | **IPI-229 = social-discovery**; retirement = **IPI-231** | 🟡 Scope mix-up |

## §2b — Errors in Rev 2 (fixed Rev 3)

| # | Rev 2 claim | Actual | Fix |
|---|-------------|--------|-----|
| R1 | Epic average **58%** | Child score avg **≈70%**; 42% is completion only | §3 |
| R2 | `mastra_messages` no RLS | **RLS enabled** post-IPI-227 (default deny) | F6 |
| R3 | IPI-231 blocked by 227/228/230 | **Only IPI-230** (227/228 Done) | §4 IPI-231 |
| R4 | Playwright only missing in `app/` | Missing in **root and `app/`** package.json | §4 IPI-234 |
| R5 | Edge Gemini on 2.5-flash | Edge code uses **3.1-flash-lite** | F9 |
| R6 | IPI-228 tests 6/6 | **10/10** (6 route + 4 lib) | §4 IPI-228 |

---

## §3 — Task Scores (Rev 3)

| Issue | Linear | Score | Prod-ready | Safe to execute? |
|-------|--------|------:|------------|------------------|
| [IPI-222](https://linear.app/amo100/issue/IPI-222) Epic | Todo | **42%**† | 🔴 | 🟡 After 229+230 |
| [IPI-223](https://linear.app/amo100/issue/IPI-223) | Done | **100%** | ✅ | ✅ #129 |
| [IPI-225](https://linear.app/amo100/issue/IPI-225) | Done | **100%** | ✅ | ✅ #130 |
| [IPI-226](https://linear.app/amo100/issue/IPI-226) | Done | **100%** | ✅ | ✅ #133 |
| [IPI-227](https://linear.app/amo100/issue/IPI-227) | Done | **100%** | ✅ | ✅ #134 |
| [IPI-228](https://linear.app/amo100/issue/IPI-228) | Done | **95%** | ✅ | ✅ #136 |
| [IPI-229](https://linear.app/amo100/issue/IPI-229) | Todo | **30%** | 🔴 | 🟡 Decision needed |
| [IPI-230](https://linear.app/amo100/issue/IPI-230) | Todo | **90%** | 🟡 | ✅ Config-only |
| [IPI-231](https://linear.app/amo100/issue/IPI-231) | Todo | **35%** | 🔴 | 🟡 Blocked **IPI-230** |
| [IPI-232](https://linear.app/amo100/issue/IPI-232) | Todo | **85%** | 🟡 | ✅ Document gates |
| [IPI-233](https://linear.app/amo100/issue/IPI-233) | Todo | **55%** | 🟡 | Runtime blocked |
| [IPI-234](https://linear.app/amo100/issue/IPI-234) | Todo | **25%** | 🔴 | After IPI-230 |
| [IPI-235](https://linear.app/amo100/issue/IPI-235) | Todo | **35%** | 🔴 | Blocked 231–234 |

†Epic row = **completion** (5/12), not readiness average.

**Readiness (12 child scores avg):** **70%**

---

## §4 — Per-Task Forensic Checklists

### IPI-222 — Production Certification Epic

**Linear:** Todo · [IPI-222](https://linear.app/amo100/issue/IPI-222)

| Check | Status | Evidence |
|-------|--------|----------|
| SSOT fix plan exists | ✅ | `docs/audit/2028-06-28-fix-plan.md` |
| Progress tracker accurate | 🔴 | Still **0/19** — must update to 5+ merged |
| Verification ledger | 🔴 | Missing |
| Sub-issues reflect reality | 🟡 | IPI-228 Linear **description stale** (still says edge fn) |

**Errors / fixes**

| Error | Fix |
|-------|-----|
| Tracker 0/19 | Update fix-plan progress row + link PRs #129–#136 |
| No ledger | IPI-235 deliverable |
| Epic Todo while 5/12 done | Optional: move epic to In Progress |

**Red flags:** Certification gate correctly ❌; doc drift creates false “nothing shipped” signal.

---

### IPI-228 — Shoot commit API→RPC ✅ SHIPPED

**Linear:** Done · PR [#136](https://github.com/amo-tech-ai/lumina-studio/pull/136) · `9de36a8`

| Check | Status | Evidence |
|-------|--------|----------|
| Browser → `/api/shoots/commit` | ✅ | `shoots/new/page.tsx:373` |
| `withOperatorAuth` | ✅ | `route.ts` |
| `commit_shoot_draft` RPC | ✅ | `commit-shoot-draft.ts:188` |
| Route + lib tests | ✅ | **10/10** (`route.test.ts` 6 + `commit-shoot-draft.test.ts` 4) |
| Mastra tool off edge | ✅ | `saveApprovedShootDraft.ts` → `commitShootDraft` |
| Edge fn directory removed | ⏭️ | **Out of scope** — IPI-231 inventory |
| V-005 live smoke | ⏸️ | **Blocked by environment** → IPI-233 |

**Skill checks**

| Skill | Finding |
|-------|---------|
| copilotkit | ✅ Auth boundary pattern matches skill |
| mastra | ✅ Tool uses shared commit lib, not `callEdgeFunction` |
| ipix-supabase | ✅ User RLS brand check + service_role RPC |
| gemini | N/A |

**Errors / fixes**

| Error | Fix |
|-------|-----|
| Linear issue body still lists 🔴 edge fn + missing tests | `node scripts/linear-update-issue.mjs IPI-228` |
| `save-approved-shoot-draft/` still in repo | IPI-231: delete directory (edge-only PR) |

---

### IPI-229 — social-discovery edge deploy or retire

**Linear:** Todo · [IPI-229](https://linear.app/amo100/issue/IPI-229)

| Check | Status | Evidence |
|-------|--------|----------|
| Edge fn in repo | ✅ | `supabase/functions/social-discovery/` |
| Deployed remote | 🔴 | MCP list_edge_functions — absent |
| Mastra tool calls edge | 🔴 | `social-discovery.ts:143` `callEdgeFunction` |
| config.toml entry | 🔴 | Only 5 fns registered |
| Tests | ✅ | `social-discovery.test.ts` (mocked) |

**Skill checks**

| Skill | Finding |
|-------|---------|
| mastra | 🔴 Write path broken until deploy or refactor |
| ipix-supabase | 🔴 Inventory drift; deploy needs config.toml + verify-edge |
| gemini | ✅ Tool uses `resolveGeminiModel()` |

**Recommendation:** Option A deploy (fastest) per Linear spec.

**Critical fix:** Deploy **or** refactor tool to server route before V-005 social chain.

**Note:** Rev 1 incorrectly bundled `save-approved-shoot-draft` retirement here — that belongs under **IPI-231**, not IPI-229.

---

### IPI-230 — Prod auth + CopilotKit license

**Linear:** Todo · [IPI-230](https://linear.app/amo100/issue/IPI-230) · blocks IPI-231, IPI-234

| Check | Status | Evidence |
|-------|--------|----------|
| `withOperatorAuth` | ✅ | `operator-gate.ts` |
| `proxy.ts` gate | ✅ | Flag-gated |
| CopilotKit license wiring | ✅ | `copilotkit/[[...slug]]/route.ts` |
| Tests | ✅ | `route.runtime.test.ts`, `proxy.test.ts` |
| `OPERATOR_AUTH_ENABLED=true` prod | 🔴 | Local `.env.local` = false |
| Vercel / Infisical prod vars | ⏭️ | Manual — cannot verify from disk |
| OAuth redirect URLs (IPI-125) | ⏭️ | Supabase Dashboard |

**Skill checks**

| Skill | Finding |
|-------|---------|
| copilotkit | ✅ Matches `references/ipix-production.md` pattern |
| ipix-supabase | ✅ PKCE callback + safe redirect |

**Critical fix:** Flip prod env vars (config-only PR or Infisical sync).

---

### IPI-231 — Supabase verify + edge inventory

**Linear:** Todo · **blocked by IPI-230 only** (IPI-227 ✅, IPI-228 ✅ per Linear relations)

| Check | Status | Evidence |
|-------|--------|----------|
| verify scripts exist | ✅ | `npm run supabase:verify*` |
| verify-rls Mastra probes | 🟡 | [IPI-245](https://linear.app/amo100/issue/IPI-245) Backlog (parallel, not epic child) |
| Edge inventory automated | 🔴 | `verify-edge-inventory.sh` exists; not in CI gate |
| Retire `save-approved-shoot-draft` | 🔴 | Dir still present; not deployed remotely |
| `social-discovery` | 🔴 | IPI-229 |
| config.toml: audit-asset-dna, capture-lead | 🔴 | Missing blocks |

**Edge inventory (repo dirs vs config vs remote)**

| Function | Repo | config.toml | Remote | Action |
|----------|------|-------------|--------|--------|
| health | ✅ | ✅ | ✅ | Keep |
| edge-test | ✅ | ✅ | ✅ | Keep |
| brand-intelligence | ✅ | ✅ | ✅ | Keep |
| start-brand-crawl | ✅ | ✅ | ✅ | Keep |
| firecrawl-webhook | ✅ | ✅ | ✅ | Keep |
| capture-lead | ✅ | 🔴 | ✅ | Add config.toml |
| audit-asset-dna | ✅ | 🔴 | ✅ | Add config.toml |
| save-approved-shoot-draft | ✅ | — | 🔴 | **Delete** (IPI-231) |
| social-discovery | ✅ | — | 🔴 | IPI-229 |

**Remote-only legacy (not in repo):** `generate-event-draft`, `generate-media`, `resolve-venue`, `generate-image-preview`, `generate-image-final` — track under [IPI-239](https://linear.app/amo100/issue/IPI-239) Backlog. Remote total **12** deployed fns vs **9** repo dirs.

### IPI-232 — App + Vercel build gate

**Linear:** Todo

| Check | Status | Evidence |
|-------|--------|----------|
| lint | ✅ | CI `app-build` |
| tsc | ✅ | CI |
| test | ✅ | CI (390 pass) |
| build | ✅ | CI |
| check-client-env in CI | ✅ | `ci.yml:49-51` |
| `app/vercel.json` | ⚪ | Missing — Next auto-detect OK |
| Vercel prod deploy verified | ⏭️ | Manual |
| E2E in CI | 🔴 | IPI-238 backlog |

**Rev 1 error:** Claimed no CI — **false**. IPI-232 is mostly **run + paste evidence + Vercel parity**, not greenfield CI.

---

### IPI-233 — Workflow chains API→DB (V-005)

**Linear:** Todo

| Chain | Code | Runtime |
|-------|------|---------|
| Brand intake → org/brand | ✅ | ⏸️ blocked |
| Brand intelligence → crawls | ✅ | ⏸️ |
| HITL → brand_scores | ✅ | ⏸️ |
| Shoot wizard 1–4 | ✅ | ⏸️ |
| Shoot commit → shoot.* | ✅ | ⏸️ code shipped IPI-228 |
| Social → brand_social_channels | 🔴 | Blocked IPI-229 |
| CopilotKit → mastra_messages isolation | 🟡 | RLS **enabled** (IPI-227 default deny); tenant isolation still **app-level** via `resourceId` — no per-user policies |

**Skill checks:** mastra + copilotkit patterns correct in code; **task-verifier requires live probes** for Done.

**Critical fix:** Run QA matrix with credentials; paste to verification ledger (IPI-235).

---

### IPI-234 — Browser E2E + DevTools QA

**Linear:** Todo · blocked by IPI-230

| Check | Status | Evidence |
|-------|--------|----------|
| `e2e/*.spec.ts` | ✅ | 4 files at repo root |
| `playwright.config.ts` | ✅ | baseURL `:3002`, **no webServer** |
| `@playwright/test` declared | 🔴 | **Not in root or `app/package.json`** (transitive lockfile only) |
| `test:e2e` script | 🔴 | Missing |
| User-journey tests | 🔴 | Smoke only (13 tests) |
| Lighthouse | 🔴 | None |
| DevTools 4xx sweep | 🔴 | Ad-hoc only |

**Note:** Formal Playwright bootstrap = **IPI-224** (post-cert backlog); IPI-234 uses ad-hoc install per Linear.

---

### IPI-235 — Certification sign-off

**Linear:** Todo · blocked by IPI-231

| Requirement | Status |
|-------------|--------|
| Phase 0–2 merged | 🟡 5/7 (229, 230 open) |
| Phase 3 evidence | 🔴 |
| verification-ledger | 🔴 |
| `certification: issued` in audit docs | 🔴 |
| task-verifier epic gate | 🔴 |

---

## §5 — Cross-Cutting Red Flags

| # | Flag | Severity | Owner issue |
|---|------|----------|-------------|
| F1 | Fix plan tracker **0/19** vs 5 PRs merged | 🔴 | IPI-222 / docs |
| F2 | social-discovery write path broken | 🔴 | IPI-229 |
| F3 | Prod auth not flipped | 🔴 | IPI-230 |
| F4 | No verification ledger | 🔴 | IPI-235 |
| F5 | `save-approved-shoot-draft` corpse in repo | 🟡 | IPI-231 |
| F6 | `mastra_messages` tenant policies missing | 🟡 | App `resourceId`; RLS on table post-IPI-227 (default deny) |
| F7 | Linear IPI-228 description stale | 🟡 | Ops — `linear-update-issue.mjs IPI-228` |
| F8 | Local Mastra test flakes (2) | 🟡 | CI green; optional IPI-240/IPI-133 |
| F9 | `edge-functions-inventory.md` says 2.5-flash | 🟡 | Markdown stale; **edge code** uses 3.1-flash-lite |
| F10 | Remote legacy edge fns (5) not in repo | 🟡 | IPI-239 |

---

## §6 — Recommended Execution Order (updated)

| Pri | Issue | Action | Unblocks |
|----:|-------|--------|----------|
| 1 | IPI-230 | Flip prod auth + CopilotKit token in Vercel/Infisical | 231, 234 |
| 2 | IPI-229 | Deploy social-discovery (Option A) | 231, 233 social chain |
| 3 | IPI-231 | Run verify suite + delete `save-approved-shoot-draft` + config.toml | 235 |
| 4 | IPI-232 | Paste CI + local gate output to ledger | 235 |
| 5 | IPI-233 | V-005 manual chain matrix (QA creds) | 235 |
| 6 | IPI-234 | DevTools + ad-hoc Playwright journeys | 235 |
| 7 | IPI-235 | Issue certification ledger | Epic close |

~~Merge PR #136~~ ✅ Done.

---

## §7 — Follow-Up Tasks (post-cert / parallel)

| Priority | Issue | Task |
|----------|-------|------|
| 🔴 | IPI-231 | Retire `save-approved-shoot-draft` directory |
| 🔴 | IPI-229 | social-discovery deploy or refactor |
| 🔴 | [IPI-245](https://linear.app/amo100/issue/IPI-245) | Mastra RLS probes in `verify-rls.mjs` (parallel) |
| 🟡 | [IPI-239](https://linear.app/amo100/issue/IPI-239) | Remote legacy edge fn audit |
| 🟡 | IPI-233 | Full V-005 production verification |
| 🟡 | IPI-224 / IPI-238 | Playwright bootstrap + CI |
| 🟢 | IPI-235 | Certification ledger |
| 🟢 | Docs | Update `2028-06-28-fix-plan.md` progress |

---

## §8 — Grading Summary

| Dimension | Score | Notes |
|-----------|------:|-------|
| Rev 1 audit accuracy | **72%** | 8 material errors |
| Rev 2 audit accuracy | **88%** | 6 errors fixed in Rev 3 |
| Cert-path **completion** | **42%** | 5/12 Done |
| Cert-path **readiness** | **70%** | Avg child scores |
| Code / architecture | **88%** | Edge inventory + prod config remain |
| Runtime verification | **35%** | Blocked by environment |
| **Overall (implementation)** | **82%** | |
| **Certification** | **❌ Not issued** | |

---

## §9 — Stop Condition

> 🛑 **Certification NOT ISSUED.** Blockers:
> 1. IPI-229 social-discovery decision + deploy/refactor
> 2. IPI-230 prod auth config flip
> 3. IPI-231 verify suite green + edge cleanup
> 4. IPI-233–234 Phase 3 evidence (runtime, not code review)
> 5. IPI-235 verification ledger

---

## §10 — Rev 3 Probe Attestation (100% disk/Linear claims)

Claims in Rev 3 verified **this pass**:

| Probe | Command / MCP | Result |
|-------|---------------|--------|
| Main HEAD | `git rev-parse --short HEAD` | `9de36a8` |
| CI green | `gh run list --branch main --limit 1` | success |
| CI jobs | read `.github/workflows/ci.yml` | `supabase-web015` + `app-build` |
| IPI-228 merged | `saveApprovedShootDraft` → `commitShootDraft` | no `callEdgeFunction` |
| IPI-228 tests | `vitest run route.test + commit-shoot-draft.test` | 10/10 |
| social-discovery edge call | `rg callEdgeFunction social-discovery.ts` | line 143 |
| Edge fn dirs | `ls supabase/functions/` | 9 (+ `_shared`) |
| Playwright deps | `rg playwright package.json` (root + app) | 0 |
| e2e specs | `glob e2e/*.spec.ts` | **4** files (Linear IPI-224 says 5 — Linear stale) |
| Gemini app default | `app/src/mastra/models.ts` | `gemini-3.1-flash-lite` |
| Gemini edge default | `supabase/functions/_shared/gemini.ts` | `gemini-3.1-flash-lite` |
| mastra_messages RLS | Supabase MCP `pg_tables` | `rowsecurity=true` |
| Linear IPI-228 | MCP `get_issue` | **Done** |
| Linear IPI-245 | MCP `list_issues` | Backlog, not IPI-222 child |
| Fix plan stale | `grep Progress 2028-06-28-fix-plan.md` | still **0/19** |

**Not re-run (mark ⏭️ until IPI-231):** `supabase:verify*`, prod Vercel env, V-005 browser matrix.

---

*Rev 3 — Linear MCP + Supabase MCP + disk on `main` @ `9de36a8` (2026-06-28). Do not cite Rev 1/2 scores without §2/§2b correction tables.*
