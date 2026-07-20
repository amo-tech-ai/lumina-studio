# J19 — Cloudflare Workers + Mastra Hosting Audit Tracker

**Verified:** 2026-07-20  
**Full forensic write-up:** [`../audits/cloudflare-mastra-hosting-audit.md`](../audits/cloudflare-mastra-hosting-audit.md)  
**Corrected plan:** [`j18-cloudflare-plan.md`](j18-cloudflare-plan.md)  
**Merge checked:** PR **#475** / **IPI-606** → `acca234681a00ecd20b429bcc3819ae306624bc6` on `origin/main`  
**Audit only** — no deploy, DNS, Linear, or secret changes

## Legend

| Dot | Meaning |
|:---:|---|
| 🟢 | Verified complete |
| 🟡 | Partially complete |
| 🔴 | Failed or unsafe |
| ⚪ | Not started |
| ⚫ | Blocked |

## Progress Task Tracker

| Status | Task | Actual implementation | Evidence | Errors / risks | Required fix | Complete | Production ready |
| ------ | ---- | --------------------- | -------- | -------------- | ------------ | -------: | ---------------: |
| 🟡 | **IPI-606 · CF-SEC-010** — Secret/var classification | Code merged (#475); allowlist + optional CopilotKit license | `acca2346` on main; Linear Done | Worker not redeployed; `NEXT_PUBLIC_*` missing on preview | Re-bootstrap after workers.dev on | 85% | 0% |
| 🟡 | **IPI-472 · INFRA-001** — Deploy pipeline | Uploads `ipix-operator-preview` | GH run 29648772820; version `a3fd7130-…` | `preview_url` empty; workers.dev **disabled** | Enable subdomain; fail CI if URL empty | 80% | 0% |
| 🟢 | **IPI-490 · CF-MIG-210** — Bundle gate | Stubs + size check | `wrangler.jsonc` aliases; bootstrap gate | Not remote runtime proof | Keep on every upload | 100% | N/A |
| 🟡 | **IPI-632 · CF-MIG-220** — Preview smoke | workers.dev on + deploy 100%; auth `/info` + agent turn verified | Evidence: `tests/ipi-632-preview-smoke/2026-07-20-preview-smoke.json` | AI health still 502 (localhost gateway); evidence not yet Linear-Done | Commit evidence (this PR); optional redeploy on `acca2346`; then security proof | 75% | 0% |
| ⚪ | **IPI-627 · CF-SEC-020** — Security proof | — | Linear Backlog | Blocked on IPI-632 | After remote smoke | 0% | 0% |
| ⚪ | **IPI-616 · CF-DB-001** — Storage ADR | Hyperdrive exists, unbound; noop live | `ipix-supabase-fresh`; `MASTRA_STORAGE_MODE=noop` | No Mastra persistence on Worker | ADR + bind Hyperdrive later | 10% | 0% |
| ⚪ | **IPI-586 · CF-AI-003** — One Workers AI call | No `ai` binding | wrangler + settings API | Native path 0% | Add binding + canary | 0% | 0% |
| ⚫ | **IPI-594 · CF-MIG-230** — Native agent routing | — | Linear Backlog | Blocked by IPI-586 | After IPI-586 | 0% | 0% |
| ⚫ | **IPI-609 · Soak gate** | — | Linear Backlog | Blocked by IPI-594 | After Wave 6 | 0% | 0% |
| ⚫ | **IPI-592 · Delete custom gateway Worker** | `ai-gateway` still live | `ai-gateway.sk-498.workers.dev/health` 200 | Do not delete yet | After IPI-609 | 0% | 0% |

### Parallel Vercel (other agent — note only)

| Status | Task | Impact on this audit’s next steps |
| ------ | ---- | --------------------------------- |
| 🟡 | **IPI-127 · AIOR-011** — Prod CopilotKit | Blocks “Mastra works in prod” claims; **does not** unblock IPI-632 |
| 🟡 | **IPI-718 · COPILOT-RUNTIME-002** — ESM-safe `@mastra/pg` | Fixes Vercel ESM path (≠ Worker noop/stub). Let that agent finish |

## Deployed truth (one screen)

| Surface | Host | Result |
|---|---|---|
| `https://www.ipix.co/app` | **Vercel** | 307 → login · `server: Vercel` · no `cf-ray` |
| `GET /api/ai/health` (prod) | Vercel | 🔴 503 · `gatewayUrl: http://localhost:8787` |
| `ipix-operator-preview` | Cloudflare | Uploaded 2026-07-18 · **workers.dev disabled** · **1042** |
| `ipix-operator` (prod Worker) | — | 🔴 **does not exist** |
| `ai-gateway` (custom) | Cloudflare | 🟢 health ok on `*.sk-498.workers.dev` |
| PR #475 on live Worker | — | 🔴 **No** (deploy SHA older than merge) |
| Mastra on CF Workers | — | Bundled + noop in code; **not remotely exercised** |

## Scores

| Metric | % |
|---|---:|
| Overall implementation | **38%** |
| Protected-preview readiness | **28%** |
| Production-cutover readiness | **12%** |

## Closing answers

1. **`ipix.co/app` on Cloudflare?** → **No** (Vercel).  
2. **Mastra running on Workers?** → **No** remote proof (workers.dev off).  
3. **Critical blockers:** enable workers.dev → redeploy #475 vars → **IPI-632** smoke.  
4. **Next five (hosting):** (1) enable workers.dev + non-empty `preview_url` (2) re-bootstrap on `acca2346` (3) **IPI-632** (4) **IPI-627** (5) **IPI-586** parallel → **IPI-631** last.  
5. **Migration succeed?** → Yes if preview reachability + smoke are hard gates (current green upload is a false positive).  
6. **Production-ready on CF?** → **No.**

## Examine → Verify → Validate → Measure

| Step | Result |
|---|---|
| Examine | OpenNext pipeline, preview Worker, custom `ai-gateway`, Vercel prod, Mastra stubs/noop |
| Verify | Headers, CF API subdomain/bindings, GH bootstrap logs, Linear MCP, `origin/main` merge |
| Validate | Prod = Vercel ✅ · Preview unreachable ✅ · #475 code-only until redeploy ✅ |
| Measure | See tracker % columns + scores above |
| Identify | P0: workers.dev disabled; no prod Worker; Vercel AI health localhost; parallel IPI-718/127 |
