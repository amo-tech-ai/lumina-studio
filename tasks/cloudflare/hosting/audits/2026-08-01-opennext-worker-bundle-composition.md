# OpenNext Worker bundle composition audit — post IPI-849 / PR #722

**Date:** 2026-08-01  
**Git SHA:** `f2828ed124c4a7bb9414d8d09227358fa27614db` (`origin/main`)  
**Method:** `npm run build:cf` → `check-worker-bundle-size.mjs` (Phase 1A report) → parse OpenNext `handler.mjs.meta.json` (no new analyzer; no code changes)  
**Related:** **IPI-848 · CF-BUNDLE-223** (composition gate) · **IPI-849 · CF-BUNDLE-222** (web-inspector stub) · prior SSOT [`2026-07-29-opennext-worker-size-optimization.md`](./2026-07-29-opennext-worker-size-optimization.md)

---

## Snapshot

| Metric | Value | Evidence class |
| --- | --- | --- |
| Worker dry-run gzip | **7861.24 KiB = 7.677 MiB** | Local Runtime |
| Upload (uncompressed) | 39596.37 KiB | Local |
| Metafile SHA-256 | `3d12e5505fa8a310e63c5035ded6e703c5b257a368fcad9ae36fe0d8f01d82f1` | Local |
| Metafile inputs | 1802 · ~**30.2 MiB** raw input sum | Local |
| OpenNext / Wrangler / Next | 1.20.2 / 4.113.0 / 16.2.11 | Report |
| Warn / fail gates | 8.5 / 9.0 MiB | iPix SSOT |
| Headroom → warn | **+0.823 MiB** | calc |
| Headroom → fail | **+1.323 MiB** | calc |
| Headroom → CF Paid 10 MiB | **+2.323 MiB** | calc |
| Remote preview remeasure | **NOT RUN** | Remote Preview |
| Production Worker | **NOT TOUCHED** | Production |

Report artifact: `app/.open-next/worker-bundle-report.json` (schemaVersion 1).

---

## Ban-list / stub status (regression baseline for IPI-848)

| Pattern | Real `node_modules/<pkg>` hits | Notes |
| --- | --- | --- |
| `mermaid` | **0** (stub + tiny streamdown mermaid remnant path ~0.5 KiB) | Safe to hard-fail |
| `katex` | **0** | Safe to hard-fail |
| `cytoscape` | **0** | Safe to hard-fail |
| `@copilotkit/web-inspector` | **0** (stub only ~0.7 KiB) | Safe to hard-fail after #722 |
| `shiki` | **0** | Already stubbed historically |
| `streamdown` | **2 paths · ~4.4 KiB** | Residual code-block/mermaid shims — watch, not a size crisis |

vs last known **8.973 MiB** preview bootstrap (GHA [30237207325](https://github.com/amo-tech-ai/lumina-studio/actions/runs/30237207325), pre-stub era): delta **≈ −1.30 MiB gzip** attributed primarily to Mermaid/KaTeX stubs (#663) + web-inspector stub (#716/#722). Not “packages newly added” — packages **removed from the graph**.

---

## Top 25 individual metafile inputs

| Rank | KiB | Attribution | Path (short) |
| ---: | ---: | --- | --- |
| 1 | 1796.7 | Mastra + AI SDK + CopilotKit aggregate SSR chunk | `chunks/ssr/_0py8nnh._.js` |
| 2 | 1509.1 | **Sentry / OTel / GraphQL-ish vendor chunk** (A) | `chunks/node_modules_04fhktf._.js` |
| 3 | 1507.8 | **Near-duplicate of #2 (SSR twin)** | `chunks/ssr/node_modules_1a7ymuq._.js` |
| 4 | 1303.2 | `@mastra/core` | `node_modules/@mastra/core/dist/chunk-XX3R7XDX.js` |
| 5 | 838.0 | CopilotKit / GraphQL / Analytics aggregate | `ssr/[root-of-the-server]__14ym1t3._.js` |
| 6 | 817.6 | `@mastra/core` | `chunk-NT7SXV2D.js` |
| 7 | 779.1 | Mastra observability / AI aggregate | `chunks/_0ew-hig._.js` |
| 8 | 742.2 | CopilotKit runtime + Mastra + GraphQL | `[root-of-the-server]__0-3ygyr._.js` |
| 9 | 654.2 | Streamdown / GraphQL / residual diagram strings | `ssr/[root-of-the-server]__0lj7yl8._.js` |
| 10 | 595.8 | `next` app-page-turbo runtime | `next/dist/compiled/next-server/app-page-turbo.runtime.prod.js` |
| 11 | 556.1 | `next` load-manifest | `next/dist/server/load-manifest.external.js` |
| 12–13 | 468.8×2 | AI SDK / Mastra twin chunks | `_0-5lsag._.js` / `_0tnw28h._.js` |
| 14–18 | 283–428 | `@mastra/core` chunks | various `chunk-*.js` |
| 19 | 314.9 | `@mastra/pg` residual graph (string/ref; stubbed scope) | `node_modules_14caof1._.js` |
| 20 | 289.9 | `@mastra/schema-compat` | `chunk-MXN3UURE.js` |
| 21 | 283.5 | `@mastra/core` | `chunk-SIJXQZ2L.js` |
| 22 | 267.2 | `react-dom` server edge | `react-dom-server.edge.production.js` |
| 23 | 254.0 | `@segment` / `tr46` mapping table (via analytics) | `tr46/lib/mappingTable.json` |
| 24 | 242.8 | `@mastra/core` | `chunk-IPBUKOUR.js` |
| 25 | 209.7 | Supabase / streamdown / analytics SSR chunk | `ssr/node_modules_0d3vcx1._.js` |

Opaque Turbopack chunks were attributed via **string sampling** of chunk contents (not path names). Treat as **inferred**, not EXTRACTED package boundaries.

---

## Package rollup — recommendation table

Input MiB = metafile **input** bytes (pre-final esbuild). Gzip contribution is smaller and non-linear.

| Rank | Package / family | Input MiB | Why included | Required? | Recommendation |
| ---: | --- | ---: | --- | --- | --- |
| 1 | `@mastra/core` (+ `@mastra/schema-compat`, memory) | **~6.5** | Operator Mastra agents / tools / storage adapters | **Required** | Keep. Long-term surface cut = separate high-effort ticket after IPI-848 top-N CI exists |
| 2 | `next` (framework) | **~4.5** | OpenNext / App Router server runtime | **Required** | Keep. No DIY trim |
| 3 | Sentry dual vendor chunks (`04fhktf` + `1a7ymuq`) | **~2.95** | `@sentry/nextjs` instrumentation pulled into Worker SSR | **Investigate / duplicate** | **High-value look:** confirm whether both server+SSR copies are necessary on CF; consider CF-native Workers observability (already IPI-709) vs full Node Sentry SDK |
| 4 | Mastra+AI+CopilotKit aggregate SSR (`_0py8nnh`, `_0ew-hig`, roots) | **~3.5** (chunked) | CopilotKit runtime + Mastra agent factory on operator routes | **Required** (product) | Keep for chat. Soft size wins only via fewer agent deps / lazy tool imports |
| 5 | `zod` + `zod-from-json-schema` (+ v3 sibling) | **~1.26** | Schema validation across Mastra / AI SDK / APIs | **Required** + **duplicate family** | Investigate single Zod major + drop unused `zod-from-json-schema*` if Mastra allows |
| 6 | `graphql` | **~0.82** | Transitive via CopilotKit runtime / AG-UI | **Likely required** for CopilotKit | Do not remove unless CopilotKit path proven unused (it is not) |
| 7 | `@segment/analytics-node` (+ `tr46` table) | **~0.52** | Telemetry transitive (often via PostHog/Segment stacks) | **Investigate** | Confirm who imports it on the Worker path; candidate to stub/alias if unused in CF |
| 8 | `@supabase/supabase-js` | **~0.38** | Auth + data on operator APIs | **Required** | Keep |
| 9 | `react-dom` (server edge) | **~0.27** | RSC / SSR | **Required** | Keep |
| 10 | `@posthog/core` + `posthog-node` | **~0.32** | Product analytics | **Investigate** | Browser-first analytics should not need full Node SDK in Worker if events are client-only — verify call sites |
| 11 | `pg` + `pg-*` helpers | **~0.16** | Still present despite `@mastra/pg` scope stub | **Partial / investigate** | Confirm Hyperdrive path; strengthen stub/alias if dead on CF build |
| 12 | `streamdown` remnants | **~0.004** | CopilotKit markdown pipeline stubs | **Browser-only candidate** (already mostly stubbed) | Leave; IPI-848 may WARN on growth |
| 13 | Mermaid / KaTeX / Cytoscape / web-inspector **packages** | **0** | Stubbed (#663 / #716 / #722) | **Removable (done)** | IPI-848: hard-fail ban list |
| 14 | `stub:cf-*` | **≪0.01** | Official Wrangler/Next alias no-ops | **Required** (size strategy) | Keep; IPI-900 watches export drift |

---

## Duplicate package families

| Family | Signal | Risk |
| --- | --- | --- |
| **Sentry ×2 ~1.51 MiB chunks** | Near-identical `node_modules_04fhktf` vs SSR `1a7ymuq` | Highest duplicate-family suspect |
| **AI SDK / Mastra twin chunks** | `_0-5lsag` ≈ `_0tnw28h` (469 KiB each) | Next server vs SSR graph duplication — often unavoidable |
| **Zod stack** | `zod` + `zod-from-json-schema` + `zod-to-json-schema` + v3 helper | Schema stack bloat |
| **Postgres** | `pg` + helpers still ~160 KiB while `@mastra/pg` stubbed | Incomplete exclusion |
| **Telemetry** | Segment + PostHog both present | Possible double analytics stack |

---

## Browser-only packages in the server graph

| Package | Status |
| --- | --- |
| `mermaid` / `katex` / `cytoscape` / `web-inspector` / `shiki` | **Absent** (stubs) — success of CF-BUNDLE-220/222 |
| `streamdown` | Tiny remnants (~4 KiB) — acceptable |
| `react-dom` server | Required for RSC — **not** a prune target |
| `@radix-ui/*` / `sonner` | Small SSR crumbs — low priority |

---

## Database / AI SDK duplication

| Stack | Metafile signal | Verdict |
| --- | --- | --- |
| AI | `@mastra/core` dominates; `@ai-sdk/*` mostly inside aggregates; little standalone `@ai-sdk/google` line item | Single agent stack — **required** |
| DB | `@supabase/supabase-js` required; `pg` family still partially present; Hyperdrive smoke routes leave string crumbs | **Investigate** `pg` residual; do not rip Supabase |
| CopilotKit | Mostly inside opaque roots (not clean `node_modules/@copilotkit/*` lines) | Expected with Turbopack mangling |

---

## Top 5 risks

1. **Regression without IPI-848** — Mermaid/KaTeX/web-inspector can return on a CopilotKit bump while gzip still skims under 8.5.  
2. **Sentry dual-chunk ~3 MiB input** — largest non-Mastra/Next suspect; unclear CF value vs Workers observability.  
3. **`@mastra/core` ~6 MiB** — structural floor; only drops with agent-surface architecture work.  
4. **Opaque Turbopack chunks** — path-based packaging undercounts CopilotKit; composition CI must scan substrings, not only clean `node_modules/<pkg>` paths.  
5. **Local ≠ remote preview** — this audit is Local Runtime; bootstrap still needs Remote Preview upload/remeasure.

---

## Top 3 safe optimization candidates

| # | Candidate | Est. impact | Risk | Owner |
| --- | --- | --- | --- | --- |
| 1 | **Ship IPI-848 hard-fail ban list** (mermaid/katex/cytoscape/web-inspector) | 0 MiB now; prevents +2–3 MiB regressions | Low | IPI-848 |
| 2 | **Audit Sentry on CF Worker** — drop or slim if Workers Logs/Sentry edge already covers cutover | Potentially **large** if dual chunks removable | Medium (observability) | New follow-up after 848 top-N |
| 3 | **Confirm Segment/PostHog Node SDK necessity** on Worker; alias no-op if client-only | ~0.3–0.5 MiB input (uncertain gzip) | Low–Med | Small spike |

**Do not** chase Mastra core cuts or raise 9.0 as the next move.

---

## GO / HOLD — production Worker bootstrap

| Gate | Verdict |
| --- | --- |
| Local gzip &lt; 8.5 MiB | ✅ **PASS** (7.677) |
| Banned packages absent | ✅ **PASS** (hard-fail ready) |
| Remote preview upload/remeasure | ⏳ **NOT VERIFIED** |
| Prod `ipix-operator` bootstrap | **HOLD** until remote preview confirms gzip stays &lt; 8.5 |
| DNS cutover | **HOLD** (M2 incomplete) |

**Size verdict:** composition is healthy enough for **preview** work and for **IPI-848** to proceed.  
**Ops verdict:** **HOLD production bootstrap** until Remote Preview evidence matches this local number (prior cutover policy).

---

## Commands to reproduce

```bash
cd app
npm run build:cf
# report: .open-next/worker-bundle-report.json
# metafile: .open-next/server-functions/default/handler.mjs.meta.json
node -e "const m=require('./.open-next/server-functions/default/handler.mjs.meta.json'); console.log(Object.keys(m.inputs).filter(k=>/mermaid|katex|cytoscape|web-inspector/.test(k)))"
```

Official refs: [Workers limits](https://developers.cloudflare.com/workers/platform/limits/) · [OpenNext troubleshooting / metafile](https://opennext.js.org/cloudflare/troubleshooting) · [esbuild analyze](https://esbuild.github.io/analyze/) · [Wrangler](https://developers.cloudflare.com/workers/wrangler/)
