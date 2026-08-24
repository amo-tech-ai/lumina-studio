# Post-merge audit — CopilotKit 1.61.0 → 1.61.2

**Task:** No Linear issue assigned  
**PR:** [#939](https://github.com/amo-tech-ai/lumina-studio/pull/939)  
**Merge SHA / `origin/main` HEAD:** `49d67b2f0135173f7ff0b44653b42d0ddc135efc`  
**Audit date:** 2026-08-16  
**Worktree:** `/home/sk/wt-copilotkit-1612-audit` (detached at merge SHA)  
**Verification level:** Local Runtime Verified (clean `npm ci` + tests + typecheck + lint + app build) **and** Production Verified on Vercel (`www.ipix.co` deploy `dpl_ARfNaDDwjUqtQbZL6j7wtXWm5Y5Q`)

**This audit does not** claim talent-approval HITL is proven. Removal of `emitInterruptOutcome=false` remains a separate **IPI-760 · DEP-COPILOT-001 — Align CopilotKit, AG-UI, and UUID Dependencies** interrupt/resume proof.

---

## Plain English

Maya opens Production Planner and talks to the right-hand AI. This merge only swapped the chat runtime from CopilotKit 1.61.0 to exact 1.61.2. It did **not** also jump OpenAI 6 → 7, and it did **not** take the HITL “approve this talent” safety pin out.

On live `www.ipix.co` (this SHA), a signed-in QA operator can ask Production Planner to say hello. The stream starts, the sentence arrives, the stream finishes. No error event. That is the upgrade working on main.

---

## Final verdict

**SUCCESS**

The CopilotKit-only upgrade is on `origin/main`, installs cleanly, keeps the HITL workaround, and serves **`@copilotkit/runtime` 1.61.2** on Vercel production with a clean AG-UI lifecycle.

Cloudflare Worker preview did **not** receive this SHA (deploy failed on a pre-existing Hyperdrive local-connection error). That is a sibling hosting gap, not a CopilotKit regression. `verify-copilot-preview` on this SHA passed against the **previous** live Worker (`746d3ec3-…`), so it is not 1.61.2 proof.

---

## Scores

| Dimension | Score | Why |
|-----------|------:|-----|
| Dependency correctness | **100%** | Exact pins + overrides; lock and `node_modules` match; no `openai@7` |
| Scope discipline | **100%** | First-parent merge is three files only; `AGENTS.md` untouched |
| Test confidence | **95%** | 52/52 targeted tests + typecheck + lint + app build; no HITL interrupt/resume e2e |
| Runtime confidence | **90%** | Production Vercel SSE proven on this SHA; CF preview not on this SHA |
| **Overall** | **A− / 96%** | Upgrade works on the live operator app. HITL removal still blocked. CF preview deploy is a separate fail. |

---

## 1. HEAD and scope

| Check | Result |
|-------|--------|
| `origin/main` | `49d67b2f0135173f7ff0b44653b42d0ddc135efc` |
| Audit worktree HEAD | same SHA |
| First-parent files | `app/package.json`, `app/package-lock.json`, `app/src/app/api/copilotkit/[[...slug]]/route.ts` |
| `route.ts` change | Comment only (7 insertions / 5 deletions). `emitInterruptOutcome=false` on instance **and** `config` unchanged |

---

## 2. Installed versions (after clean `npm ci`, Node 24 / npm 11)

| Package | Required | Installed | Lock (`packages.node_modules/…`) |
|---------|----------|-----------|----------------------------------|
| `@copilotkit/runtime` | 1.61.2 | 1.61.2 | 1.61.2 |
| `@copilotkit/react-core` | 1.61.2 | 1.61.2 | 1.61.2 |
| `openai` | 6.48.0 | 6.48.0 (override) | 6.48.0 |
| `langchain` | 1.5.3 | 1.5.3 (override) | 1.5.3 |
| `@langchain/core` | 1.2.3 | 1.2.3 (override) | 1.2.3 |

`openai` / `langchain` / `@langchain/core` are **overrides**, not direct `dependencies`. That is the intended pin: CopilotKit would otherwise pull `openai@7`. Nested tree is all `deduped` / `overridden` to those three versions. No `openai@7` anywhere in the lock.

### No major drift

| Surface | Pin on main | Notes |
|---------|-------------|-------|
| `@ag-ui/mastra` | 1.1.1 | Unchanged |
| `@ag-ui/client` / core / encoder / proto | 0.0.57 | Unchanged overrides |
| `@mastra/core` | 1.41.0 | Unchanged |
| `mastra` | 1.1.0-alpha.3 | Unchanged. Pre-existing peer warning: nested `@mastra/deployer@1.51.0` wants `@mastra/core>=1.50` |

---

## 3. Local verify (merge SHA worktree)

| Step | Result |
|------|--------|
| `npm ci` (with postinstall `patch-package`) | Pass. `workers-ai-provider@3.3.1` patch applied |
| `vitest` `route.runtime.test.ts` (IPI-760 / CopilotKit route) | **27/27** pass |
| `vitest` `copilot-tool-presentation` + `authenticated-copilot-provider` | **25/25** pass |
| `npm run typecheck` | Pass |
| Focused eslint on `route.ts` + `route.runtime.test.ts` | Pass (clean) |
| `npm run build` | Pass. Route `/api/copilotkit/[[...slug]]` present |

---

## 4. HITL workaround (must stay)

Still present at `app/src/app/api/copilotkit/[[...slug]]/route.ts` ~L289–296:

```ts
agent.emitInterruptOutcome = false;
(agent as any).config.emitInterruptOutcome = false;
```

The merge only rewrote the comment: 1.61.2 **can** resume structured interrupts, but `@ag-ui/mastra` `clone()` still rebuilds from `config` (default `true`). Taking the pin out without interrupt/resume proof would still strand talent-approval HITL with “Thread has N pending interrupt(s) not addressed by resume”.

**Do not remove this in a follow-up “cleanup” PR.**

---

## 5. Main CI / post-merge checks (`49d67b2f0`)

CI run: [31930735391](https://github.com/amo-tech-ai/lumina-studio/actions/runs/31930735391)

| Required check | Conclusion |
|----------------|------------|
| `app-build` | success |
| `supabase-web015` | success |
| `cloudflare-worker-tests` | success |
| `supabase-verify-rls` | success |

| Other signal | Conclusion | How to read it |
|--------------|------------|----------------|
| `verify-copilot-preview` | success | Browser journey against **live** preview Worker `746d3ec3-cbc5-4589-a380-442ae5eb9818` — **not** this SHA. `/info` 200 (authed), chat `text/event-stream` 200, `hard_ac_pass: true`. Soft miss: Command Center 11891ms vs 5000ms budget |
| `Workers Builds: ipix-operator-preview` | **failure** | OpenNext **build succeeded** (compiled 1.61.2). Deploy died on Hyperdrive local connection string (`CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE_FRESH`). Same class of fail as the prior `main` docs commit `c204a8977`. **Not CopilotKit.** |
| Vercel `ipix-operator` production | **READY** | `dpl_ARfNaDDwjUqtQbZL6j7wtXWm5Y5Q` · aliases `www.ipix.co`, `ipix.co` |

---

## 6. Production runtime proof (`www.ipix.co` = this SHA)

Cheap path used: existing `app/scripts/capture-copilot-preview-sse.sh` pointed at production, QA JWT minted in-process (not printed).

| Probe | Result |
|-------|--------|
| Anon `GET /api/copilotkit/info` | **401** Unauthorized (fail-closed; expected) |
| Authed `GET /api/copilotkit/info` | **200** · `"version":"1.61.2"` · `mode":"sse"` · 9 agents including `production-planner` |
| Authed `POST /api/copilotkit/agent/production-planner/run` | **200** · `content-type: text/event-stream` |
| `RUN_STARTED` | 1 |
| `RUN_FINISHED` | 1 |
| `RUN_ERROR` | 0 |
| Tool events (`TOOL_CALL_*` / `TOOL_RESULT`) | 0 (hello-only prompt; no duplicate tool events) |

Assistant text streamed: Production Planner introduced itself in one sentence. That is the same path Maya uses when she opens the chat dock on Command Center / Planner.

**Not proven:** interrupt → resume on a talent-approval HITL card.

---

## Audit register

### Errors

None on the CopilotKit upgrade path (install, tests, typecheck, lint, app build, Vercel production SSE).

### Red flags

| Flag | Severity | Classification |
|------|----------|----------------|
| Cloudflare preview deploy failed on this SHA | Medium for CF hosting; **out of scope** for this upgrade | Confirmed Hyperdrive local-connection `UserError` after a successful OpenNext build. Prior `main` docs SHA failed the same check. |
| `verify-copilot-preview` green ≠ 1.61.2 on the Worker | Medium (false comfort) | Job pins the **currently live** Worker version, then smokes that version. Because deploy failed, it proved the old Worker still works. |
| No Linear issue named COPILOT-UPGRADE-001 | Low | This audit has **No Linear issue assigned**. Closest live tickets: **IPI-760 · DEP-COPILOT-001 — Align CopilotKit, AG-UI, and UUID Dependencies** (Done; HITL pin still required) and **IPI-900 · CF-BUNDLE-224 — Protect CopilotKit Upgrades** (Backlog) |
| Nested `mastra` CLI peer wants `@mastra/core>=1.50` | Low / pre-existing | Unchanged by this merge. Do not “fix” in a CopilotKit PR. |
| `npm ci` ERESOLVE / deprecated-package warnings | Low / pre-existing | Same warnings locally and on Workers Builds. Install still completed. |

### Failure points (if someone “just upgrades again”)

1. **Caret range `^1.61.2`** — first #939 lock pull brought `openai@7.4.0`. Keep exact `1.61.2` + overrides.
2. **npm 11 vs npm 10 lock shape** — `supabase-verify-rls` uses npm 10 `npm ci --omit=dev`. Nested `@ai-sdk/provider-utils@3.0.30` must stay in the lock.
3. **`npm ci --ignore-scripts`** — skips `app/patches/workers-ai-provider+3.3.1.patch` and breaks IPI-771 stream-dedupe tests. Use full `npm ci`.
4. **Removing `emitInterruptOutcome=false`** — 1.61.2 does not by itself survive `@ag-ui/mastra` clone. Needs dedicated HITL proof.
5. **Treating CF preview smoke as SHA proof** — only true after Workers Builds **success** on that SHA.

### Blockers

**None for the CopilotKit-only upgrade on Vercel/main.**

Not blockers (named so they are not silently “fixed” here):

- HITL interrupt/resume proof (separate IPI-760 follow-up)
- Cloudflare preview Hyperdrive deploy (separate hosting ticket)
- Filing a new Linear issue for this already-merged upgrade (this record has **No Linear issue assigned**)

### Missing tests / evidence

| Gap | Why it matters | Next proof |
|-----|----------------|------------|
| No interrupt/resume e2e | Maya approving a talent pick can still strand the thread if the pin is removed | Dedicated IPI-760 HITL run: interrupt → resume → `RUN_FINISHED`, no “pending interrupt(s)” |
| No tool-call duplicate assertion on a tool-using prompt | Hello-only run has zero tool events | One Production Planner prompt that calls a real tool; assert each `TOOL_CALL_START` has one matching end |
| CF preview not on `49d67b2f0` | Worker chat is still the previous bundle | Re-run Workers Builds after Hyperdrive local-string fix; then `capture-copilot-preview-sse.sh` on `ipix-operator-preview` |
| No Linear issue for this upgrade | Agents will keep calling it a fake IPI id | This audit has **No Linear issue assigned**. Closest tickets: **IPI-760 · DEP-COPILOT-001 — Align CopilotKit, AG-UI, and UUID Dependencies** and **IPI-900 · CF-BUNDLE-224 — Protect CopilotKit Upgrades** |

### Fixes already in the merge (do not redo)

- Exact `1.61.2` pins (not `^`)
- Overrides: `openai@6.48.0`, `langchain@1.5.3`, `@langchain/core@1.2.3`
- Lock entries npm 10 needs (`@ai-sdk/provider-utils@3.0.30`)
- HITL comment updated so nobody deletes the pin “because we are on 1.61.2 now”

### Improvements (separate PRs only)

| Improvement | Concern | Why separate |
|-------------|---------|--------------|
| HITL interrupt/resume proof, then consider removing the pin | IPI-760 / COPILOT-HITL | Product risk; not an upgrade leftover |
| Fix Workers preview Hyperdrive local connection string | Cloudflare deploy | Failed on docs `main` too |
| Teach `verify-copilot-preview` to fail if Workers Builds for `GITHUB_SHA` failed | CI honesty | Prevents green-on-old-Worker |
| File a real Linear issue for COPILOT-UPGRADE-001 | Linear hygiene | Docs/tracker only |
| Mintlify nav entry for `docs/copilotkit/*` | docs.json | This folder is new; nav is optional |

---

## What this audit did not do

- Did not remove `emitInterruptOutcome=false`
- Did not edit `AGENTS.md`
- Did not clean unused dependencies
- Did not claim Cloudflare preview is running 1.61.2
- Did not mark HITL Done

---

## Evidence index

| Kind | Where |
|------|--------|
| Merge | https://github.com/amo-tech-ai/lumina-studio/commit/49d67b2f0135173f7ff0b44653b42d0ddc135efc |
| PR | https://github.com/amo-tech-ai/lumina-studio/pull/939 |
| Main CI | https://github.com/amo-tech-ai/lumina-studio/actions/runs/31930735391 |
| Vercel production | https://vercel.com/mdeai/ipix-operator/ARfNaDDwjUqtQbZL6j7wtXWm5Y5Q |
| Workers fail (Hyperdrive) | build `53efca23-88e8-4453-90bd-59983496d9c7` |
| Local worktree | `/home/sk/wt-copilotkit-1612-audit` @ `49d67b2f0` |
| Prod SSE artifacts (no secrets) | `/tmp/ck-1612-prod/sse/` (local to audit machine; JWT/header files deleted) |
