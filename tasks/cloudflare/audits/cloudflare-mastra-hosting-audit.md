# Cloudflare Workers + Mastra Hosting Forensic Audit

**Date:** 2026-07-20  
**Auditor role:** Cloudflare SA / OpenNext / Mastra / DevOps forensic  
**Repo:** `amo-tech-ai/lumina-studio` (`origin/main` tip = `acca2346` — merge of PR #475)  
**Merge verified:** PR **#475** → `acca234681a00ecd20b429bcc3819ae306624bc6` (2026-07-20T01:19:02Z) **is on `origin/main`**  
**Constraint:** Audit/document only — no deploy, DNS, Linear, or secret changes  
**Companion tracker:** [`tasks/cloudflare/prime/j19-cloudflare-audit.md`](../../tasks/cloudflare/prime/j19-cloudflare-audit.md)

---

## Executive verdict (plain English)

Production **`https://www.ipix.co/app` is on Vercel**, not Cloudflare Workers.  
A preview OpenNext Worker **`ipix-operator-preview` exists** in the Cloudflare account and was last uploaded **2026-07-18** (before #475), but **`workers.dev` is disabled** for that script, so the app is **not reachable** remotely (`error code: 1042`).  
Mastra is **bundled into the OpenNext Worker graph** (with `@mastra/pg` stubbed + `MASTRA_STORAGE_MODE=noop`), but **Mastra is not exercised on Cloudflare today** because the preview hostname does not serve traffic. On Vercel, CopilotKit/Mastra production is a **separate broken lane** (**IPI-127** / **IPI-718** — owned by another agent).

| Question | Answer | Evidence |
|---|---|---|
| Is `ipix.co/app` hosted by Cloudflare? | **No** | `server: Vercel`, `x-vercel-id`, DNS → `cname.vercel-dns.com`; no `cf-ray` on app traffic; no `routes` in `app/wrangler.jsonc` |
| Is Mastra actually running on Cloudflare Workers? | **No (not remotely exercised)** | Preview Worker `workers.dev.enabled=false`; all probed paths → CF **1042**; no remote SSE/agent evidence |
| Is PR #475 active in a real deployment? | **Code on main; Worker not redeployed** | Last bootstrap SHA `84ea702e` (2026-07-18); Worker version `a3fd7130-…`; #475 merged 2026-07-20 |

---

## 1. Deployed truth

### 1.1 Production origin (`https://www.ipix.co/app`)

| Probe | Result |
|---|---|
| `GET /` | **200** · `server: Vercel` · `x-vercel-id` · **no `cf-ray`** |
| `GET /app` | **307** → `/login?redirect=%2Fapp` · Vercel |
| `GET /api/copilotkit/info` (anon) | **401** · Vercel · fail-closed auth |
| `GET /api/ai/health` | **503** · body includes `"status":"gateway_unreachable"`, `"gatewayUrl":"http://localhost:8787"` |
| DNS `www.ipix.co` | `CNAME` → `cname.vercel-dns.com` |

**Conclusion:** Operator traffic does **not** reach Cloudflare Workers. Do not infer hosting from Cloudflare account membership alone.

### 1.2 Cloudflare Workers present (account API + bindings MCP)

| Worker | Exists | Last modified (API/MCP) | `workers.dev` | Custom routes / domains |
|---|---|---|---|---|
| `ipix-operator-preview` | ✅ | 2026-07-18T14:52:04Z | **❌ disabled** (`enabled: false`, `previews_enabled: false`) | Domains API: `[]` |
| `ipix-operator` (prod name in `wrangler.jsonc`) | ❌ **404** | — | — | Not created |
| `ai-gateway` (custom) | ✅ | 2026-07-19T23:43:37Z | ✅ enabled | Domains API: `[]` (uses `*.workers.dev`) |
| `ipi636-webhook-probe` | ✅ | 2026-07-16 | NOT VERIFIED | Out of scope |

Account workers.dev subdomain: **`sk-498`**.

| Hostname | Probe |
|---|---|
| `https://ipix-operator-preview.sk-498.workers.dev/*` | **1042** (Worker not publicly enabled on workers.dev) |
| `https://ai-gateway.sk-498.workers.dev/health` | **200** JSON `{"status":"ok","service":"ai-gateway"}` · `cf-ray` present |

### 1.3 Preview deployment vs repo commit

| Item | Value |
|---|---|
| Last successful bootstrap | [GH run 29648772820](https://github.com/amo-tech-ai/lumina-studio/actions/runs/29648772820) · 2026-07-18 · headSha **`84ea702e…`** |
| Uploaded version ID | `a3fd7130-6d63-41df-ae3b-e2d29da34816` |
| Workflow `preview_url` output | **empty** (matches disabled workers.dev) |
| `origin/main` tip | `acca2346` (#475) — **newer than deployed Worker** |
| Production Worker | **Does not exist** |

### 1.4 Preview bindings (names only — live settings API)

Present: secrets `GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `COPILOTKIT_LICENSE_TOKEN`, Cloudinary/Firecrawl/Intelligence/AI_GATEWAY keys; vars `MASTRA_STORAGE_MODE` (len 4 → `noop`), `OPERATOR_AUTH_ENABLED` (len 4 → `true`); bindings `ASSETS`, `IMAGES`, `WORKER_SELF_REFERENCE`.

**Missing vs #475 / bootstrap intent:**

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_URL` (and any other deploy-time `--var` URLs) — **not on Worker**
- `ai` / Workers AI binding — **absent**
- Hyperdrive binding — **absent** (Hyperdrive config `ipix-supabase-fresh` **exists** in account but is **not wired** to OpenNext Worker)

---

## 2. Mastra on Cloudflare — route → code → runtime

### 2.1 Bundled into OpenNext Worker?

| Check | Result |
|---|---|
| OpenNext entry | `app/wrangler.jsonc` → `"main": ".open-next/worker.js"` |
| Mastra registry | `app/src/mastra/index.ts` → `getMastra()` + `getMastraStorageLazy()` |
| CopilotKit route | `app/src/app/api/copilotkit/[[...slug]]/route.ts` loads local Mastra agents |
| Worker aliases | `@mastra/pg` / `pg` → `./scripts/cf-mastra-pg-stub.mjs` (IPI-490 size gate) |
| Bundle gate | `app/scripts/check-worker-bundle-size.mjs` run in bootstrap (`check:worker-bundle`) |

**Yes — Mastra is part of the OpenNext Worker graph** when the Worker builds. That is **code/deploy packaging**, not proof of remote execution.

### 2.2 Invoked inside Worker runtime remotely?

**No evidence.** Preview hostname returns CF **1042**; remote `/api/copilotkit/info`, SSE, and agent turns **NOT VERIFIED** (cannot run).

### 2.3 Storage: `MASTRA_STORAGE_MODE=noop`

| Fact | Evidence |
|---|---|
| Committed Worker var | `wrangler.jsonc` `vars.MASTRA_STORAGE_MODE: "noop"` (top-level + `env.preview`) |
| Live preview var | Binding present, length 4 |
| Code behavior | `app/src/mastra/storage.ts` — noop/off/memory → skip Postgres; Workers default InMemoryStore; `MASTRA_STORAGE_MODE=pg` rejected when stub module present |
| Hyperdrive | Account has `ipix-supabase-fresh` → Supabase; **not** bound in `wrangler.jsonc` |
| Persistence | **Disabled on Worker path** — threads/memory do not survive isolate recycle |

### 2.4 Model / provider path (code + prod probe)

| Path | Status |
|---|---|
| Default `AI_ROUTING_MODE` | **`direct`** (`app/src/lib/ai/provider.ts`) — Gemini/Groq SDKs |
| Custom gateway (`AI_GATEWAY_URL`) | Only when `AI_ROUTING_MODE=gateway`; marketing/`fast` tier constraints documented in provider |
| Native Workers AI / `env.AI` | **Not wired** — no `ai` binding; **IPI-586** Todo |
| Dashboard AI Gateway `ipix-prod` | Planned replacement; **0 native Mastra traffic proven** this audit |
| Custom Worker `ai-gateway` | **Live** on `ai-gateway.sk-498.workers.dev`; recently redeployed 2026-07-19 |
| Vercel `/api/ai/health` | Points at **`http://localhost:8787`** → **503** — production health misconfigured / not using live gateway URL |

### 2.5 Workers compatibility risks (code-backed)

| Risk | Severity | Notes |
|---|---|---|
| `@mastra/pg` / `pg.Pool` hang | Mitigated on Worker | Stub + noop (IPI-490 / IPI-633) |
| Bundle / startup size | Mitigated in CI | Size gate in bootstrap; remote `startup_time_ms` **NOT VERIFIED** |
| Node FS / native addons | Mitigated | ast-grep / shiki stubs in wrangler aliases |
| SSE / cookies / OAuth on `*.workers.dev` | Open | Cannot test until workers.dev enabled + Supabase redirect URLs |
| InMemoryStore loss | Expected | Until Hyperdrive + IPI-616 ADR |

---

## 3. Linear task review (live MCP, 2026-07-20)

| Status | Task | Actual implementation | Evidence | Errors / risks | Required fix | Complete | Production ready |
|---|---|---|---|---|---|---:|---:|
| 🟡 | **IPI-606 · CF-SEC-010** — Secret/var classification for Worker bootstrap | Code merged (#475); allowlist + optional CopilotKit license; committed vars = noop + auth flag | Merge `acca2346` on main; Linear **Done** | Worker not redeployed post-merge; `NEXT_PUBLIC_*` absent on live preview; workers.dev disabled so bootstrap cannot prove vars | Re-run bootstrap after enabling workers.dev + GitHub env vars; verify bindings | 85% | 0% |
| 🟡 | **IPI-472 · INFRA-001** — OpenNext deploy pipeline | Workflow uploads preview Worker; size gate runs | GH run 29648772820 success; version `a3fd7130-…` | `preview_url` empty; workers.dev disabled → pipeline “green” without usable URL | Enable subdomain + assert non-empty `preview_url` in CI | 80% | 0% |
| 🟢 | **IPI-490 · CF-MIG-210** — Bundle / runtime compatibility | Stubs + check script; Linear Done | `wrangler.jsonc` aliases; bootstrap `check:worker-bundle` | Does not prove remote runtime | Keep gate; re-run after next upload | 100% | N/A (gate only) |
| 🔴 | **IPI-632 · CF-MIG-220** — Protected preview smoke | Local smoke claimed; remote **not run** | Linear **In Progress**; preview **1042** | Blocked: workers.dev off; missing public URL; #475 not on Worker | Enable workers.dev → redeploy → Playwright login + `/info` + SSE + agent turn → commit artifact | 25% | 0% |
| ⚪ | **IPI-627 · CF-SEC-020** — Deployment security proof | Not started | Linear **Backlog** | Depends on IPI-632 | After remote smoke green | 0% | 0% |
| ⚪ | **IPI-616 · CF-DB-001** — Mastra storage ADR | Hyperdrive provisioned; not bound; noop live | Hyperdrive `ipix-supabase-fresh`; no wrangler hyperdrive | `DATABASE_URL` secret on Worker unused by Mastra; persistence none | ADR + bind Hyperdrive only after preview works | 10% | 0% |
| ⚪ | **IPI-586 · CF-AI-003** — One Workers AI call via `ipix-prod` | No `ai` binding on OpenNext Worker | wrangler + settings API | Native path 0% | Add binding + one canary call | 0% | 0% |
| ⚫ | **IPI-594 · CF-MIG-230** — Migrate Mastra agents to native routing | Backlog; blocked by IPI-586 | Linear **Backlog** | Agents still static `resolveModel()` / direct | After IPI-586 waves | 0% | 0% |
| ⚫ | **IPI-609 · CF-MIG-230-SOAK** — Zero-legacy soak | Backlog | Linear **Backlog** | SLA risk noted in Linear | After IPI-594 Wave 6 | 0% | 0% |
| ⚫ | **IPI-592 · CF-MIG-820** — Delete custom AI Gateway Worker | Backlog; Worker still live | `ai-gateway` health 200; deploy 2026-07-19 | Deleting now would risk any `AI_ROUTING_MODE=gateway` callers; prod routing value **NOT VERIFIED** for Vercel | Only after IPI-609 | 0% | 0% |

### Parallel Vercel lane (other agent — do not steal)

| Status | Task | Impact on CF hosting next steps |
|---|---|---|
| 🟡 | **IPI-127 · AIOR-011** — Restore CopilotKit production runtime | Prod operator agents on **Vercel** unhealthy / auth `/info` issues. **Does not** unblock IPI-632. **Does** block any claim that “Mastra works in production” today. |
| 🟡 | **IPI-718 · COPILOT-RUNTIME-002** — ESM-safe Mastra Postgres on Vercel | Fixes Vercel `ERR_REQUIRE_ESM` / `@mastra/pg` path (PR #508). **Different failure mode** than Worker noop+stub. Complete before marking IPI-127 Done. |

---

## 4. Failures and risks (severity-ordered)

| # | Finding | Sev | Evidence | Impact | Exact fix | Linear | Validation |
|---|---|---|---|---|---|---|---|
| 1 | Preview `workers.dev` **disabled** | **P0** | API `subdomain.enabled=false`; hostname **1042** | Remote smoke/cutover impossible; empty `preview_url` | Enable workers.dev for `ipix-operator-preview` (Wrangler/API); re-upload; fail CI if `preview_url` empty | IPI-472 / IPI-632 | `curl -sI https://ipix-operator-preview.sk-498.workers.dev/login` → non-1042 |
| 2 | Prod app still Vercel; no prod Worker | **P0** | Headers + DNS; `ipix-operator` 404 | No CF hosting for operators | After IPI-632/627: create prod Worker + IPI-631 routes | IPI-631 | Headers show `cf-ray`, not `x-vercel-id` |
| 3 | #475 not on live Worker | **P1** | Deploy SHA 84ea702e < merge acca2346; missing `NEXT_PUBLIC_*` | Auth/client config drift on preview | Bootstrap after merge with GitHub env vars | IPI-606 | Settings bindings include `NEXT_PUBLIC_SUPABASE_*` |
| 4 | Vercel AI health → localhost:8787 | **P1** | `/api/ai/health` JSON | False “gateway down”; ops noise | Point prod env at live gateway or health-check direct Gemini | IPI-127 / ops | Health 200 without localhost |
| 5 | Mastra persistence noop on Worker | **P2** | wrangler + storage.ts | Multi-turn / thread restore loss | IPI-616 ADR → Hyperdrive bind | IPI-616 | Storage mode `pg` + Hyperdrive probe |
| 6 | Hyperdrive orphaned | **P2** | Config exists; no binding | Wasted infra; false sense of storage readiness | Wire only after ADR | IPI-616 / IPI-619 | `wrangler.jsonc` hyperdrive + runtime query |
| 7 | Custom `ai-gateway` still live | **P2** | Health 200; recent deploy | Cleanup blocked; dual paths | Keep frozen until IPI-609 | IPI-592 | Zero traffic soak evidence |
| 8 | No `ai` binding / native gateway | **P2** | wrangler settings | IPI-594 blocked | IPI-586 | One Workers AI call through `ipix-prod` |
| 9 | Stale trackers (`todo.md` ~55% hosting; #475 “open”) | **P3** | Root `todo.md` still says #475 OPEN | Wrong prioritization | Treat this audit as evidence snapshot | docs | N/A |
| 10 | `COPILOTKIT_LICENSE_TOKEN` still on Worker as secret | **P3** | Settings API | Optional per #475 — OK if unused | Confirm Intelligence optional path | IPI-606 | License absent → SSE still works |
| 11 | `ai-gateway` binds `CLOUDFLARE_API_TOKEN` | **P2** | Settings API | Broad token in Worker secret surface | Scope token / prefer dashboard AI Gateway | IPI-592 / security | Token audit |

---

## 5. Scores and closing answers

### Percent complete

| Metric | % | Method |
|---|---:|---|
| **1. Overall implementation** | **38%** | Weighted: pipeline/bundle/auth/secrets-code done; preview unreachable; no prod Worker; native AI ~0; storage ADR ~10 |
| **2. Protected-preview readiness** | **28%** | Worker uploaded + secrets present, but workers.dev off, #475 not live, remote smoke 0 |
| **3. Production-cutover readiness** | **12%** | No prod Worker, DNS on Vercel, security proof 0, soak 0 |

### Closing checklist

4. **Is `ipix.co/app` currently hosted by Cloudflare?** → **No** (Vercel).  
5. **Is Mastra actually running on Cloudflare Workers?** → **No remote proof.** Bundled + noop-configured only.  
6. **Critical blockers**  
   - Enable `workers.dev` on `ipix-operator-preview`  
   - Redeploy with #475 vars  
   - Complete **IPI-632** remote SSE/agent smoke  
   - (Parallel, other agent) **IPI-718 → IPI-127** for Vercel Mastra  
7. **Next five tasks (dependency order — hosting lane)**  
   1. Enable workers.dev + fix non-empty `preview_url` in bootstrap (**IPI-472** follow-up)  
   2. Re-bootstrap preview on `acca2346` with GitHub env vars (**IPI-606** operational close)  
   3. **IPI-632** remote smoke evidence  
   4. **IPI-627** deployment security proof  
   5. **IPI-586** one native Workers AI call *(parallel after preview URL exists)* — then **IPI-631** only after 3–4 green  
8. **Custom code replaceable by managed**  
   - Native AI Gateway + Workers AI bindings (**IPI-586/594**) replace much of `services/cloudflare-worker/`  
   - Hyperdrive + official Postgres patterns replace bespoke pool hacks  
   - OpenNext/Wrangler secrets sync already preferred over Dashboard-only secrets (keep Dashboard for AI Gateway config record)  
9. **Will the migration succeed?** → **Yes, if preview is made reachable and smoke/security gates are treated as hard stops.** Current “green CI upload” without workers.dev is a false positive.  
10. **Final production-readiness verdict** → **Not production-ready for Cloudflare hosting.** Keep Vercel as production origin until IPI-632 + IPI-627 pass on a reachable preview and a prod Worker exists.

---

## Evidence index

| Source | What it proved |
|---|---|
| `curl -sI https://www.ipix.co/app` | Vercel origin |
| Cloudflare Workers list MCP | 3 workers; no `ipix-operator` |
| CF API subdomain | preview disabled; ai-gateway enabled |
| CF API settings | bindings / missing `NEXT_PUBLIC_*` / no `ai` / no Hyperdrive |
| GH Actions 29648772820 | Upload success, empty preview_url, SHA pre-#475 |
| Linear MCP | Statuses for IPI-606…592, 127, 718 |
| `app/wrangler.jsonc`, `storage.ts`, `provider.ts` | noop, stubs, direct routing default |

**NOT VERIFIED this pass:** authenticated CopilotKit `/info` on Vercel; production Infisical/`AI_ROUTING_MODE` value; remote Worker logs/tail; bundle gzip bytes of live version; startup_time_ms.
