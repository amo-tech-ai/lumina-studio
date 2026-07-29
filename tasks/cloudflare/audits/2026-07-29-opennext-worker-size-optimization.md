# OpenNext Worker Size Audit & Optimization (IPI-706)

**Date:** 2026-07-29  
**Ticket:** **IPI-706 · CF-BUNDLE-220 — Restore OpenNext Worker Bundle Headroom**  
**Related:** **IPI-803 · CF-DB-012** ([PR #658](https://github.com/amo-tech-ai/lumina-studio/pull/658)) tipped CI over the fail gate  
**Sibling PRs:** Phase 1A code [#660](https://github.com/amo-tech-ai/lumina-studio/pull/660) · Phase 1A CI [#661](https://github.com/amo-tech-ai/lumina-studio/pull/661) (blocked until gzip &lt; 9.0)  
**Phase 1B branch:** `ipi/706-bundle-headless` (code-only, separate from this docs PR)  
**Method:** Platform-first (official Cloudflare / OpenNext / CopilotKit / ESBuild docs) → repo `rg` → installed package exports → metafile analysis. **No guesses without evidence.**

---

## 1. Executive summary

| Item | Result |
| --- | --- |
| **Verdict** | CI is red because Worker gzip is **~9.01–9.015 MiB ≥ 9.0 MiB** iPix fail gate |
| **Acute trigger** | `main` after #658: **9.012 MiB** FAIL (was ~8.988 MiB WARN) |
| **Chronic cause** | CopilotKit **`/v2` barrel** imported from many hook-only + UI-helper modules → SSR chunks include **Mermaid / Cytoscape / KaTeX** |
| **Smallest safe fix (measured)** | Extend **IPI-490** OpenNext stubs: alias `mermaid` + `katex` under `IPIX_CF_BUNDLE_STUBS=1` → **gzip 7.832 MiB** (was 9.012). Headless imports = follow-up hygiene (alone did **not** drop size while layout mounts `CopilotKit` `/v2`) |
| **Do not** | Raise 9.0 · multi-worker yet · mix docs+code in one PR |
| **OpenNext / Wrangler** | Already on latest `@opennextjs/cloudflare@1.20.2` (= npm latest) |

**Plain English:** The suitcase was already almost full of CopilotKit markdown/diagram libraries. Hyperdrive storage (#658) added a little more weight and the zipper broke. A better scale (#660/#661) does not remove weight — **`/v2/headless` does.**

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

| Severity | Issue | Fix |
| --- | --- | --- |
| 🔴 Blocker | gzip ≥ 9.0 on `main` | Phase 1B before merging #660/#661 |
| 🔴 Blocker | Shared presentation file pinned MessageView into OperatorPanel | Split module |
| 🟠 Risk | Mocks still on `/v2` after migrate | Dual/update mocks |
| 🟡 Debt | `@mastra/core` still huge | Separate ticket after &lt;9.0 |
| ⚪ Skip | OpenNext upgrade / raise gate | N/A / forbidden |

---

## 10. More efficient than custom code?

Yes — use the **prebuilt** `/v2/headless` export and OpenNext’s **official** metafile workflow. Do not invent a custom CopilotKit wrapper or raise limits.

---

## 11. Prioritized plan

```text
1. Docs PR (this file) — AGENTS #1 docs-only
2. Code PR Phase 1B headless + MessageView isolation
3. build:cf green (<9.0; target <8.5)
4. Rebase/merge Phase 1A #660 then #661
5. If still ≥8.5: second measured cut or Phase 2 multi-worker child
6. Do NOT mark IPI-706 Done until AC met
```

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


## 11. Test results (this pass)

| Check | Result |
| --- | --- |
| `npm run build:cf` after mermaid/katex stubs | **PASS** — gzip **7.832 MiB** (8020.43 KiB) — below 8.5 warn |
| Metafile mermaid/katex real packages | Pruned (stub residual only) |
| Headless-only rebuild (no stubs) | Still **9.012 MiB FAIL** — insufficient alone |
| Focused contract tests | opennext-ci-contract updated for mermaid/katex aliases |
