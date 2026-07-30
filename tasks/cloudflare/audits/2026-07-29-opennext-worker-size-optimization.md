# OpenNext Worker Size Audit & Optimization (IPI-706)

**Date:** 2026-07-29 (status section updated 2026-07-30)  
**Ticket:** [IPI-706 · CF-BUNDLE-220 — Restore OpenNext Worker Bundle Headroom](https://linear.app/amo100/issue/IPI-706)  
**Related:** [IPI-803 · CF-DB-012 — Activate Durable Mastra Postgres Storage on the Production Cloudflare Worker](https://linear.app/amo100/issue/IPI-803), shipped as [PR #658 (Request-safe Hyperdrive Mastra storage — preview path)](https://github.com/amo-tech-ai/lumina-studio/pull/658), tipped CI over the fail gate  
**Sibling PRs:**
[PR #660 (Phase 1A code — Worker bundle JSON report helpers)](https://github.com/amo-tech-ai/lumina-studio/pull/660) ·
[PR #661 (Phase 1A CI — Worker bundle report artifact + PR delta)](https://github.com/amo-tech-ai/lumina-studio/pull/661)  
**Phase 1B:** branch `ipi/706-bundle-headless` → merged as [PR #663 (Stub Mermaid/KaTeX to restore Worker headroom)](https://github.com/amo-tech-ai/lumina-studio/pull/663)  
**Method:** Platform-first (official Cloudflare / OpenNext / CopilotKit / ESBuild docs) → repo `rg` → installed package exports → metafile analysis. **No guesses without evidence.**

---

## 0. Status — emergency resolved 2026-07-29

**Everything below section 1 is a forensic snapshot of 2026-07-29, taken while `main` was red.
It is deliberately preserved as written. This section is the current state.**

| Item | Current |
| --- | --- |
| Size emergency | **Closed.** [PR #663 (Stub Mermaid/KaTeX to restore Worker headroom)](https://github.com/amo-tech-ai/lumina-studio/pull/663), commit `9c88179f`, took `main` from **9.012 → 7.826 MiB** |
| `main` today | **7.806 MiB** gzip @ `aae84bc0` — `OK: gzip below 8.5 MiB warn gate` ([CI run 30499164983](https://github.com/amo-tech-ai/lumina-studio/actions/runs/30499164983)) |
| Headroom | **1.19 MiB** below the 9.0 fail gate · **2.19 MiB** below Cloudflare's 10 MB Paid ceiling |
| Trend | `9.012` ([PR #658](https://github.com/amo-tech-ai/lumina-studio/pull/658)) → `7.826` ([PR #663](https://github.com/amo-tech-ai/lumina-studio/pull/663)) → `7.807` ([PR #664 — IPI-844 · CF-DB-012a, Restore Worker gzip headroom](https://github.com/amo-tech-ai/lumina-studio/pull/664)) → `7.806` ([PR #666 — IPI-851 · DEVX-TS-001, Exclude OpenNext/.next from the TypeScript program](https://github.com/amo-tech-ai/lumina-studio/pull/666)) |
| Still open | [PR #660](https://github.com/amo-tech-ai/lumina-studio/pull/660) Phase 1A code · [PR #661](https://github.com/amo-tech-ai/lumina-studio/pull/661) Phase 1A CI — both needed a **rebase**, not a fix: they were measuring the pre-#663 bundle |
| Section 9 blocker table | **Historical.** The `gzip ≥ 9.0 on main` blocker no longer applies |
| Section 1 executive summary | **Historical.** Its "CI is red" verdict describes 2026-07-29, not today |

### Is IPI-706 actually done? Two conflicting targets

The two tracking surfaces disagree, so this audit states both rather than picking silently:

| Surface | Target | 7.806 MiB verdict |
| --- | --- | --- |
| [IPI-706](https://linear.app/amo100/issue/IPI-706) acceptance criteria (authoritative) | gzip **< 8.5 MiB**, "preferred ≤8.30" | ✅ **Met** |
| `tasks/cloudflare/todo.md` row | "Reduce Worker bundle **≤7.5 MiB**" | ❌ **0.31 MiB short** |

The Linear AC is the ticket's contract, so the size goal is met. But **do not treat the `todo.md`
figure as satisfied** — reconcile the two before marking IPI-706 Done. Named remaining cuts if the
≤7.5 MiB target is kept: `@copilotkit/web-inspector` (~0.12 MiB gzip,
[IPI-849](https://linear.app/amo100/issue/IPI-849)) and Sentry (~1,400 KiB raw, unticketed).

### ⚠️ `tasks/cloudflare/todo.md` is stale as of this audit

That file is the live SSOT for the Cloudflare track, and its IPI-706 rows still say **8.985 MiB**
with `next/dynamic(..., {ssr:false})` as the remedy. Both are superseded: the measured figure is
**7.806 MiB** and the fix that worked was **build-time stub aliases**, not `next/dynamic`. Updating
`todo.md` is deliberately **not** in this PR (docs SSOT for the whole track — its own change), but an
agent following the tracker without reading section 0 here will work from stale instructions.

**Downstream consumers, read this first:** [IPI-848 · CF-BUNDLE-223 — Metafile regression gate + Worker bundle composition CI](https://linear.app/amo100/issue/IPI-848)
derives its metafile ban list from the composition numbers in **section 4** below. Those were
measured **before** PR #663 and PR #664 merged. The **"Re-measured 2026-07-30" subsection of
section 4** carries the current figures, and confirms the ban-list premise still holds
(`mermaid` 0 · `katex` 0 · `cytoscape` 0 · `web-inspector` 1) — so no further re-measurement is
required before IPI-848 starts.

---

## 1. Executive summary

**⚠️ Historical — state on 2026-07-29 while `main` was red. See section 0 for current status.**

| Item | Result (2026-07-29) |
| --- | --- |
| **Verdict** | CI was red because Worker gzip was **~9.01–9.015 MiB ≥ 9.0 MiB** iPix fail gate. **Resolved** — see section 0 |
| **Acute trigger** | `main` after #658: **9.012 MiB** FAIL (was ~8.988 MiB WARN) |
| **Chronic cause** | CopilotKit **`/v2` barrel** imported from many hook-only + UI-helper modules → SSR chunks include **Mermaid / Cytoscape / KaTeX** |
| **Smallest safe fix (measured)** | Extend **IPI-490** OpenNext stubs: alias `mermaid` + `katex` under `IPIX_CF_BUNDLE_STUBS=1` → **gzip 7.832 MiB** (was 9.012). Headless imports = follow-up hygiene (alone did **not** drop size while layout mounts `CopilotKit` `/v2`) |
| **Do not** | Raise 9.0 · multi-worker yet · mix docs+code in one PR |
| **OpenNext / Wrangler** | Already on latest `@opennextjs/cloudflare@1.20.2` (= npm latest) |

**Plain English:** The suitcase was already almost full of CopilotKit markdown/diagram libraries. Hyperdrive storage (#658) added a little more weight and the zipper broke. A better scale (#660/#661) does not remove weight — **stubbing Mermaid/KaTeX at build time does** (#663, measured 9.012 → 7.826 MiB). Switching hook-only files to `/v2/headless` was tried first and measured **no reduction** while the operator layout still mounts `CopilotKit` `/v2` — see section 8. It remains useful hygiene against re-pinning ([IPI-845](https://linear.app/amo100/issue/IPI-845)), not a size fix.

---

## 2. Root cause

### 2.1 Acute (why CI flipped)

| Surface | gzip | Gate |
| --- | --- | --- |
| `main` @ onboarding (`02093876`) | ~8.988 MiB | WARN only |
| Phase 1A #660 @ `6c1daa1` | 8.987 MiB | WARN only |
| `main` @ #658 (`1d6a190`) | **9.012 MiB** | **FAIL** |
| #660 tip (`8629b2a`) | **9.015 MiB** | **FAIL** |

Evidence: GitHub Actions `app-build` logs (`Worker dry-run: … gzip … KiB`).

### 2.2 Chronic (why Mermaid is in the Worker)

Official OpenNext troubleshooting: oversized Workers come from unnecessary code in the production bundle; inspect `handler.mjs.meta.json` with the [ESBuild Bundle Analyzer](https://esbuild.github.io/analyze/).  
Source: https://opennext.js.org/cloudflare/troubleshooting

Repo evidence (pre–Phase 1B):

1. **Zero** imports of `@copilotkit/react-core/v2/headless`.
2. **Thirteen** production files imported `@copilotkit/react-core/v2` (full barrel).
3. Chat dock already used `next/dynamic(..., { ssr: false })` — **insufficient alone** because:
   - `operator-panel.tsx` still imported hooks from `/v2`
   - `operator-panel.tsx` imported `useHideInternalToolCalls` from a module that also imported **`CopilotChatMessageView`** (UI → Streamdown → Mermaid)
4. Installed `@copilotkit/react-core@1.61.0` exports `./v2/headless` with `useAgentContext`, `useThreads`, `useRenderTool` (supports `name: "*"`), `useFrontendTool`, `useConfigureSuggestions`, `CopilotChatConfigurationProvider` — and **not** `CopilotKit` / `CopilotChat` / `CopilotChatMessageView` / `useDefaultRenderTool`.

Official package source: https://github.com/CopilotKit/CopilotKit/blob/main/packages/react-core/src/v2/headless.ts

---

## 3. Evidence — repository audit (pre-fix inventory)

### 3.1 Hook-only → must move to `/v2/headless`

| File | Symbols |
| --- | --- |
| `operator-panel.tsx` | `useAgentContext`, `useConfigureSuggestions`, `useFrontendTool`, `CopilotChatConfigurationProvider` |
| `threads-drawer.tsx` | `useThreads` |
| `brand-context.tsx` / `brand-list-context.tsx` | `useAgentContext` |
| `booking-*-context.tsx` | `useAgentContext` |
| `crm-record-context.tsx` | `useAgentContext` |
| `follow-up-draft-card.tsx` | `useRenderTool` |
| `shoot-wizard-context.tsx` | `useAgentContext` |

### 3.2 Keep `/v2` (UI)

| File | Symbols |
| --- | --- |
| `(operator)/layout.tsx` | `CopilotKit` |
| `operator-chat-dock.tsx` | `CopilotChat` (+ already `ssr:false`) |
| `marketing-chat.tsx` | `CopilotKit`, `CopilotPopup` (hooks → headless) |
| `copilot-tool-message-view.tsx` (new) | `CopilotChatMessageView`, `useRenderToolCall` |

### 3.3 Direct Mermaid / Cytoscape / KaTeX / Streamdown in `app/src`

**No direct app imports** — only via CopilotKit transitive deps (metafile).

### 3.4 `@copilotkit/react-ui`

**None** (v2 folded UI into `react-core/v2`).

---

## 4. Bundle analysis (metafile)

**File:** `app/.open-next/server-functions/default/handler.mjs.meta.json`  
**Captured:** 2026-07-28 (`wt-ipi-706-bundle-headroom`) — chronic CopilotKit/Mermaid pinning.

**Official workflow:** https://opennext.js.org/cloudflare/troubleshooting → https://esbuild.github.io/analyze/

| Family | Approx input size | Notes |
| --- | --- | --- |
| `@mastra/*` | ~6.4 MiB | Long-term mass; not removed by headless |
| `next` | ~2.7 MiB | Platform baseline |
| **mermaid** | **~2.3 MiB** | Target prune |
| **cytoscape** | **~0.41 MiB** | Same |
| **katex** | **~0.25 MiB** | Same |
| `@copilotkit` (direct) | ~0.57 MiB | Includes `web-inspector` ~579 KiB |

### Re-measured 2026-07-30, post-#663/#664/#666 — authoritative

The table above is the **pre-fix** capture. Re-measured on `ipi/706-bundle-report-code`
rebased onto `main` @ `aae84bc0`, gzip **7.807 MiB**, metafile
sha256 `cd21f7432c86…`, **1,799 inputs**:

| Package | Input hits | Size |
| --- | --- | --- |
| `node_modules/mermaid` | **0** | — (stubbed by #663) |
| `node_modules/katex` | **0** | — (stubbed by #663) |
| `node_modules/cytoscape` | **0** | — (was transitive via mermaid only) |
| `@copilotkit/web-inspector` | **1** | **578.8 KiB** |

Exact input path:

```text
.open-next/server-functions/default/.next/server/chunks/ssr/
  node_modules_@copilotkit_web-inspector_dist_index_mjs_150addu._.js   578.8 KiB
```

**This confirms `~579 KiB` above and corrects the `~593 KiB` figure carried in
[IPI-848](https://linear.app/amo100/issue/IPI-848) and
[IPI-849](https://linear.app/amo100/issue/IPI-849).** This doc is the SSOT; **578.8 KiB** is the number.

Two clarifications for IPI-849, which describes this as a *"Worker output chunk raw (incl. inlined Lit deps)"*:

- The metafile has exactly **1 output** (the bundled `handler.mjs`). There is no separate
  web-inspector *output* chunk — 578.8 KiB is a **pre-bundle input**, the Next.js SSR chunk.
- Because it is an input, it measures what esbuild was *given*, not what survived tree-shaking.
  The gzip saving from removing it stays as IPI-849 states: **~0.12 MiB (≈1.5%)**, derived from the
  package's own 196 KiB raw → 42 KiB gzip ratio. Removing 578.8 KiB of input does **not** free 578.8 KiB of upload.

**IPI-848's ban-list premise is verified by this measurement:** hard-failing
`mermaid` / `katex` / `cytoscape` is safe today (all 0), and `web-inspector` must stay
**WARN** until IPI-849 removes it (still 1 hit). No re-measurement needed before IPI-848 starts.

---

## 5. Build & configuration audit

| Config | Finding |
| --- | --- |
| `@opennextjs/cloudflare` | **1.20.2** = npm latest — no upgrade PR |
| `open-next.config.ts` / `wrangler.jsonc` | OK |
| Tree-shaking failure mode | **Barrel import of UI**, not mis-set `sideEffects` |

Refs: https://opennext.js.org/cloudflare/cli · https://developers.cloudflare.com/workers/platform/limits/

---

## 6. Official best-practice check

| Question | Answer | Source |
| --- | --- | --- |
| Should hook-only code use `/v2/headless`? | **Yes** for Worker isolation | CopilotKit headless export · npm exports on 1.61.0 |
| Latest OpenNext? | **Yes (1.20.2)** | npm view |
| Raise Worker limit? | **No** | CF Paid 10 MB · IPI-706 AC keeps 9.0 |
| Multi-worker first? | **No** | https://opennext.js.org/cloudflare/howtos/multi-worker |

---

## 7. Ranked fixes

| Rank | Fix | Est. gzip Δ | Risk |
| --- | --- | --- | --- |
| **1** | Hook-only → `/v2/headless` | High | Low |
| **2** | Split MessageView + headless wildcard hide | High (completes #1) | Medium |
| **3** | Phase 1A report + CI base delta | 0 MiB | Low |
| **4** | Dynamic-import remaining UI | Low–Med | Low |
| **5** | Mastra surface reduction | Med–High long-term | Higher |
| **6** | OpenNext multi-worker | Arch | High ops |

---

## 8. Phase 1B implementation (code PR — separate)

**Branch:** `ipi/706-bundle-headless`

### 8.1 Measured result: headless alone is necessary but not sufficient

After switching hook-only imports to `/v2/headless` + splitting MessageView, `build:cf` still reported **gzip 9.012 MiB FAIL**. Metafile still contained mermaid (~2.27 MiB) + cytoscape + katex.

**Why:** `(operator)/layout.tsx` must mount `CopilotKit` from `/v2` for all operator hooks. That UI barrel keeps Streamdown → Mermaid in the SSR graph even when chat dock is `ssr:false` and hooks are headless.

### 8.2 Size cut that matches existing platform pattern (IPI-490)

Extend OpenNext `IPIX_CF_BUNDLE_STUBS=1` aliases (same as Shiki):

| Package | Stub | Rationale |
| --- | --- | --- |
| `mermaid` | `scripts/cf-mermaid-stub.mjs` | Drops mermaid + transitive cytoscape |
| `katex` | `scripts/cf-katex-stub.mjs` | Drops KaTeX math renderer |

Wire in `next.config.ts` (Turbopack + webpack server) and `wrangler.jsonc` (defense in depth). Ceiling: diagram/math fenced blocks → plain text (documented `ponytail:`).

### 8.3 Also ship

1. Hook-only → `/v2/headless` (hygiene; prevents re-pinning)
2. `useHideInternalToolCalls` via headless `useRenderTool({ name: "*" })`
3. `copilot-tool-message-view.tsx` isolation
4. `copilot-headless-boundary.test.ts`
5. Re-run `build:cf` — gzip **&lt; 9.0**; prefer **&lt; 8.5**; metafile sans mermaid/katex chunks

**Forbidden:** local barrel re-exporting `/v2`; raising fail gate; mixing this docs file into the code PR.

---

## 9. Errors / red flags / blockers

**State as of 2026-07-29 while `main` was red. See section 0 for current status.**

| Severity | Issue | Fix | Status now |
| --- | --- | --- | --- |
| 🔴 Blocker | gzip ≥ 9.0 on `main` | Phase 1B before merging #660/#661 | ⚪ **Resolved** — #663 merged; `main` 7.806 MiB |
| 🔴 Blocker | Shared presentation file pinned MessageView into OperatorPanel | Split module | 🟡 Open — folded into [IPI-845](https://linear.app/amo100/issue/IPI-845) |
| 🟠 Risk | Mocks still on `/v2` after migrate | Dual/update mocks | 🟡 Open — [IPI-845](https://linear.app/amo100/issue/IPI-845) |
| 🟡 Debt | `@mastra/core` still huge | Separate ticket after &lt;9.0 | 🟡 Open — **~6.4 MiB, largest remaining bucket, still unticketed.** Measure via IPI-848's top-25 before filing |
| ⚪ Skip | OpenNext upgrade / raise gate | N/A / forbidden | ⚪ Still forbidden — gates unchanged at 8.5 / 9.0 |

---

## 10. More efficient than custom code?

Yes — use the **prebuilt** `/v2/headless` export and OpenNext’s **official** metafile workflow. Do not invent a custom CopilotKit wrapper or raise limits.

---

## 11. Prioritized plan

Step 2 previously read "headless + MessageView isolation" only. Corrected: section 8.1 measures
headless-only at **9.012 MiB FAIL**, so a PR built to that step could not have satisfied step 3.
The stub aliases are the measured passing path and belong in the same code PR.

```text
1. Docs PR (this file) — AGENTS #1 docs-only
2. Code PR Phase 1B — mermaid/katex stub aliases under IPIX_CF_BUNDLE_STUBS  <- the measured fix
      (optional, same PR: /v2/headless + MessageView isolation — hygiene, 0 MiB on its own)
3. build:cf green (<9.0; target <8.5)
4. Rebase/merge Phase 1A #660 then #661
5. If still ≥8.5: second measured cut or Phase 2 multi-worker child
6. Do NOT mark IPI-706 Done until AC met — and note the two conflicting
      size targets recorded in section 0 (Linear <8.5 vs todo.md ≤7.5)
```

**What actually shipped:** step 2 landed as [PR #663](https://github.com/amo-tech-ai/lumina-studio/pull/663)
with the stubs only; the `/v2/headless` hygiene was split out to
[IPI-845 · CF-BUNDLE-220b — CopilotKit /v2/headless import hygiene](https://linear.app/amo100/issue/IPI-845).

---

## 12. Official link index

### Cloudflare

- https://developers.cloudflare.com/workers/
- https://developers.cloudflare.com/workers/platform/limits/
- https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/
- https://developers.cloudflare.com/workers/runtime-apis/bindings/service-bindings/
- https://developers.cloudflare.com/workers/static-assets/
- https://developers.cloudflare.com/workers/configuration/versions-and-deployments/gradual-deployments/
- https://developers.cloudflare.com/hyperdrive/
- https://github.com/cloudflare/workers-sdk

### OpenNext

- https://opennext.js.org/cloudflare
- https://opennext.js.org/cloudflare/troubleshooting
- https://opennext.js.org/cloudflare/cli
- https://opennext.js.org/cloudflare/get-started
- https://opennext.js.org/cloudflare/perf
- https://opennext.js.org/cloudflare/howtos/multi-worker
- https://github.com/opennextjs/opennextjs-cloudflare

### CopilotKit / ESBuild / Next.js

- https://docs.copilotkit.ai/
- https://github.com/CopilotKit/CopilotKit
- https://github.com/CopilotKit/CopilotKit/blob/main/packages/react-core/src/v2/headless.ts
- https://esbuild.github.io/analyze/
- https://nextjs.org/docs

---

## 13. Document control

| | |
| --- | --- |
| **Concern** | Docs-only audit (no production code in this PR) |
| **Next code PR** | Phase 1B on `ipi/706-bundle-headless` |
| **Authoring rule** | AGENTS.md #1 — do not commit this doc with Phase 1B code |

## 14. Test results (this pass)

| Check | Result |
| --- | --- |
| `npm run build:cf` after mermaid/katex stubs | **PASS** — gzip **7.832 MiB** (8020.43 KiB) — below 8.5 warn |
| Metafile mermaid/katex real packages | Pruned (stub residual only) |
| Headless-only rebuild (no stubs) | Still **9.012 MiB FAIL** — insufficient alone |
| Focused contract tests | opennext-ci-contract updated for mermaid/katex aliases |
