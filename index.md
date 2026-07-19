# iPix Repository Documentation Index and Audit

> Repository-wide navigation and evidence-backed documentation audit.
>
> **Audit date:** 2026-07-19  
> **Audited baseline:** `origin/main` at `92c6e3e56e3139775c8b104d364403721617283b`  
> **Validation level:** Code and documentation inspection plus live Linear MCP; no production runtime probe  
> **Editing boundary:** This index is the only file changed  
> **Finalize pass:** Approval-ready docs cleanup plan only — no archives, Linear edits, push, or PR yet

## 1. Executive overview

iPix / Lumina Studio has two active product surfaces plus supporting services:

- [`app/`](./app/) is the canonical Next.js operator and marketing application.
- [`supabase/`](./supabase/) owns the remote-only Postgres schema, RLS, and Edge Functions.
- [`b2c-storefront/`](./b2c-storefront/) is the consumer storefront.
- [`my-marketplace/`](./my-marketplace/) is the Mercur/Medusa marketplace.
- [`tasks/`](./tasks/) contains execution plans, trackers, audits, runbooks, and test evidence.
- [`docs/`](./docs/) contains cross-domain references and local Linear mirrors.
- [`Universal-design-prompt-4/`](./Universal-design-prompt-4/) contains the design package, prototypes, component contracts, and design-to-code tasks.
- [`.claude/skills/`](./.claude/skills/) contains repository-specific agent guidance.

The repository has good domain evidence but weak top-level navigation. Several old documents still claim authority after their facts became stale. This file is the cross-repository entry point; it does not replace domain trackers or live Linear.

### Audit result at a glance

| Area | Result |
|---|---|
| Audited files | 2,504 across the primary documentation scopes |
| Markdown files | 2,103 |
| Exact duplicate groups | 73 groups / 149 files |
| Empty files | 9 total; 6 documentation placeholders/stubs are actionable (includes 3-byte Cloudflare status stub) |
| Live Linear issues fetched | 20 priority and dependency issues |
| Pending restore PRs inspected | #486, #487, #488, #489, #491 |
| Application code changed | None |
| Linear changed | None |

## 2. Quick navigation

| Need | Start here | Notes |
|---|---|---|
| Repository rules | [`CLAUDE.md`](./CLAUDE.md) · [`AGENTS.md`](./AGENTS.md) | Workflow and architecture constraints |
| Product direction | [`prd.md`](./prd.md) | Most current root product document |
| Current Cloudflare execution | [`tasks/cloudflare/todo.md`](./tasks/cloudflare/todo.md) | Current domain tracker, but status corrections are required |
| Cloudflare hosting plan | [`tasks/cloudflare/prime/04-plan-hosting.md`](./tasks/cloudflare/prime/04-plan-hosting.md) | Concise official-first plan |
| Cloudflare journeys | [`tasks/cloudflare/user-journeys/00-index.md`](./tasks/cloudflare/user-journeys/00-index.md) | Technical journeys; several statuses and env names are stale |
| Supabase / Edge execution | [`tasks/prime/todo`](./tasks/prime/todo) | Current execution order |
| Supabase implementation | [`supabase/`](./supabase/) | Code and remote verification win over plans |
| Mastra implementation | [`app/src/mastra/`](./app/src/mastra/) | Current registry and agents |
| Mastra planning | [`tasks/cloudflare/mastra/`](./tasks/cloudflare/mastra/) | On main; restored `tasks/mastra/` is pending PR #491 |
| Cloudinary | [`tasks/cloudinary/`](./tasks/cloudinary/) | Main has a partial set; restoration is pending PR #489 |
| Universal Design | [`Universal-design-prompt-4/index.md`](./Universal-design-prompt-4/index.md) | Design-package index, not repository-wide authority |
| Design screen IDs | [`Universal-design-prompt-4/docs/handoff/SCREEN-REGISTRY.md`](./Universal-design-prompt-4/docs/handoff/SCREEN-REGISTRY.md) | Best SCR numbering source |
| Design components | [`Universal-design-prompt-4/components/COMPONENTS.md`](./Universal-design-prompt-4/components/COMPONENTS.md) | Component contract source |
| Skills | [`index-skills.md`](./index-skills.md) | Intended canonical catalog; count is stale |
| Local Linear mirrors | [`docs/linear/issues/`](./docs/linear/issues/) | Supporting mirror only; live Linear wins |

## 3. Source-of-truth hierarchy

Use this order when two documents disagree:

1. **Current checked-in code and configuration** for what the repository implements.
2. **Runtime evidence** for what production actually does. Code defaults are not proof of deployed environment values.
3. **Live Linear issue** for current intent, priority, acceptance criteria, and relations.
4. **Accepted ADR**, after checking it still matches code and live Linear.
5. **Current domain tracker**, especially `tasks/cloudflare/todo.md` and `tasks/prime/todo`.
6. **Current task plan, runbook, project documentation, and design source**.
7. **Dated audits, snapshots, pending PR content, and archives**.

Exceptions:

- A Linear issue marked Done does not make a contradictory merged ADR correct.
- A design prototype proves intended UX, not implementation.
- A deployed Worker does not prove that production traffic reaches it.
- Pending restore PR files are **Pending merge**, not repository truth.

## 4. Directory ownership

| Directory | Category | Owns | Authority | Status |
|---|---|---|---|---|
| [`app/`](./app/) | Implementation / architecture | Next.js, API routes, CopilotKit, Mastra, OpenNext config | Current implementation | 🟢 |
| [`supabase/`](./supabase/) | Implementation / architecture | Migrations, RLS, Edge Functions, verification | Current backend implementation | 🟢 |
| [`services/cloudflare-worker/`](./services/cloudflare-worker/) | Implementation / historical target | Frozen custom AI Gateway Worker | Load-bearing until traffic is verified; deletion gated | 🟡 |
| [`tasks/cloudflare/`](./tasks/cloudflare/) | Tasks / plans | Cloudflare tracker, ADRs, migration tasks, journeys | Domain execution | 🟡 |
| [`tasks/prime/`](./tasks/prime/) | Tasks / plans | Supabase and Edge execution order | Domain execution | 🟡 |
| [`tasks/cloudinary/`](./tasks/cloudinary/) | Tasks / architecture | Cloudinary architecture and operations | Partial on main | 🟡 |
| [`tasks/design-docs/`](./tasks/design-docs/) | Design handoff | Design-to-code mapping | Supporting | 🟡 |
| [`docs/`](./docs/) | Documentation | Cross-domain docs, audits, issue mirrors | Supporting | 🟡 |
| [`Universal-design-prompt-4/`](./Universal-design-prompt-4/) | Design | Prototypes, tokens, components, design tasks | Design intent | 🟡 |
| [`.claude/skills/`](./.claude/skills/) | Skills | Agent workflows and domain guidance | Repository skill library | 🟡 |
| [`b2c-storefront/`](./b2c-storefront/) | Product | Consumer storefront | Active separate surface | 🟢 |
| [`my-marketplace/`](./my-marketplace/) | Product | Mercur marketplace | Active separate service | 🟢 |

## 5. Inventory counts

| Scope | Files | Markdown | Empty files | Notes |
|---|---:|---:|---:|---|
| `tasks/` | 267 | 253 | 1 | Current and historical execution material mixed |
| `docs/` | 283 | 180 | 0 | Includes large non-Markdown assets |
| `supabase/docs/` | 13 | 10 | 4 | No folder index; four empty placeholders |
| `app/docs/` | 3 | 3 | 0 | Focused operational docs |
| `Universal-design-prompt-4/` | 496 | 321 | 1 | Large design package with inventory drift |
| `.claude/skills/` | 1,442 | 1,336 | 3 | Count follows directory symlinks (`find -L`) |
| **Total audited** | **2,504** | **2,103** | **9** | Counts overlap by category, not by scope |

Category names overlap heavily, so this audit does not claim mutually exclusive plan/task/design counts.

## 6. Key file inventory

Status: 🟢 Current · 🟡 Needs review · 🔴 Incorrect/conflicting · ⚪ Historical/pending.

| ID | File | Category | Purpose | Authority | Status | Provider references | Conflict / action |
|---|---|---|---|---|---|---|---|
| RULE-01 | [`CLAUDE.md`](./CLAUDE.md) | Architecture / policy | Repository operating contract | High | 🟡 | Cloudflare, Gemini, custom Worker | Production AI-path statement conflicts with **IPI-592 · CF-MIG-820 — Delete custom AI Gateway Worker (Phase 9 of 9, production-gated)**, which says the live route is not independently confirmed; amend |
| RULE-02 | [`AGENTS.md`](./AGENTS.md) | Architecture / policy | Repo map and coding rules | High | 🟡 | Gemini, Mastra | Font rule conflicts with Zeely operator design; clarify operator vs marketing |
| PROD-01 | [`prd.md`](./prd.md) | Product | Current product direction | High | 🟢 | General AI | Keep |
| PROD-02 | [`mvp.md`](./mvp.md) | Product | June MVP snapshot | Medium | 🔴 | Vite-era | Still presents Vite dashboard as product surface; refresh or archive |
| PROD-03 | [`todo.md`](./todo.md) | Task | Root delivery snapshot | Low | ⚪ | Old task IDs | June 24 snapshot; do not use as live build order |
| DOC-01 | [`docs/index-docs.md`](./docs/index-docs.md) | Documentation index | `/docs` navigation | Medium | 🔴 | Gemini/Mastra | Dated 2026-06-14; claims 2,100+ Markdown files in `docs/` versus 180; dead links include `linear/issues/README.md`, `intelligence/README.md`, `tasks/index-tasks.md`, `plan/index-plan.md`, `wireframes/00-index.md`, `cloudinary/cloudinary-plan.md`, and `supabase/secrets-inventory.md` |
| DOC-02 | [`README.md`](./README.md) | Navigation | Root readme | Low | 🔴 | None | Five lines and no useful navigation; link this index later |
| DOC-03 | [`docs/prd/README.md`](./docs/prd/README.md) | Product docs index | PRD navigation | Medium | 🔴 | Postiz / commerce | Links `../postiz/postiz-prd.md` (folder missing) and `../ecommerce/prd-ecommerce.md` (folder exists but file missing). Canonical files: [`docs/prd/postiz-prd.md`](./docs/prd/postiz-prd.md), [`docs/prd/prd-ecommerce.md`](./docs/prd/prd-ecommerce.md) |
| DOC-04 | [`linear/issues/`](./linear/issues/) | Linear mirror (secondary) | Older mirror tree | Low | 🔴 | None | 79 Markdown files; 21 are byte-identical to `docs/linear/issues/`; keep `docs/linear/issues/` as the supporting mirror and retire the root `linear/issues/` copies |
| TASK-01 | [`tasks/plan/todo.md`](./tasks/plan/todo.md) | Task tracker | Older build-order SSOT | Low | 🔴 | Mixed | July 2 evidence and 61 broken links; demote/archive |
| TASK-02 | [`tasks/todo.md`](./tasks/todo.md) | Task tracker | Mirror | Low | ⚪ | Mixed | Correctly says mirror, but stale |
| CF-01 | [`tasks/cloudflare/todo.md`](./tasks/cloudflare/todo.md) | Task tracker | Cloudflare execution | High | 🟡 | All provider paths | Best main tracker; **IPI-472 · INFRA-001 — OpenNext CI and Deployment Pipeline**, **IPI-454 · CF-AI-001 — AI Gateway — Cloudflare Provider Routing**, and CF-EDGE rows need sync |
| CF-02 | [`tasks/cloudflare/Tasks/000-Architecture-Decision.md`](./tasks/cloudflare/Tasks/000-Architecture-Decision.md) | Architecture | Cloudflare migration ADR | High | 🟡 | Native gateway | Missing **IPI-695 · CF-EDGE-001 — ADR addendum: Edge Deno → AI Gateway REST (not custom Worker)** |
| CF-03 | [`tasks/cloudflare/adr/IPI-695-edge-llm-via-ai-gateway-worker.md`](./tasks/cloudflare/adr/IPI-695-edge-llm-via-ai-gateway-worker.md) | Architecture | Merged Edge ADR | High | 🔴 | Custom Worker | Contradicts IPI-695 and **IPI-694 · CF-EDGE-AI — Route Supabase Edge LLM Through Cloudflare AI Gateway**; replace with direct REST addendum |
| CF-04 | [`tasks/cloudflare/prime/04-plan-hosting.md`](./tasks/cloudflare/prime/04-plan-hosting.md) | Plan | Hosting execution | Medium | 🟡 | OpenNext | Keep; sync IPI-472 Done status |
| CF-05 | [`tasks/cloudflare/prime/cloudflare-migration-audit.md`](./tasks/cloudflare/prime/cloudflare-migration-audit.md) | Historical audit | Earlier hosting audit | Low | ⚪ | OpenNext | Superseded banner is correct; reduce to pointer or archive |
| CF-06 | [`tasks/cloudflare/plan/summary-plan-2.md`](./tasks/cloudflare/plan/summary-plan-2.md) | Plan | Empty placeholder | None | 🔴 | None | Archive/remove after provenance check |
| CF-07 | [`tasks/cloudflare/user-journeys/00-index.md`](./tasks/cloudflare/user-journeys/00-index.md) | Test plan | Journey navigation | Medium | 🟡 | Direct/gateway | IPI-454 and PR #317 status stale; env names need correction |
| CF-08 | [`tasks/cloudflare/draft/status-cloudflare.md`](./tasks/cloudflare/draft/status-cloudflare.md) | Draft status | Malformed stub | None | 🔴 | None | Only 3 bytes (`cre`); archive/populate, not a status SSOT |
| SUPA-01 | [`tasks/prime/todo`](./tasks/prime/todo) | Task tracker | Supabase/Edge execution | High | 🟡 | Gemini, Groq, Cloudflare | Current; three links depend on pending restore PRs |
| SUPA-02 | [`tasks/prime/notes-edge-8.md`](./tasks/prime/notes-edge-8.md) | Architecture note | Direct REST Edge target | High | 🟢 | AI Gateway REST | Keep; matches live Linear |
| SUPA-03 | [`supabase/docs/audit/j18-edge-functions-audit.md`](./supabase/docs/audit/j18-edge-functions-audit.md) | Audit | Edge inventory | Medium | 🔴 | Gemini | “All 12” secret claim and function count are stale |
| AI-01 | [`app/src/lib/ai/provider.ts`](./app/src/lib/ai/provider.ts) | Architecture / code | Central model resolver | Code truth | 🟡 | Gemini, Groq, custom gateway | Static/module-load resolver; native request-scoped path not built |
| AI-02 | [`app/src/mastra/index.ts`](./app/src/mastra/index.ts) | Architecture / code | Operator agent registry | Code truth | 🟢 | Resolver consumers | Eight operator agents plus public marketing separately |
| AI-03 | [`app/wrangler.jsonc`](./app/wrangler.jsonc) | Deployment | OpenNext bindings | Code truth | 🟡 | Workers AI | No AI binding and no production route |
| EDGE-01 | [`supabase/functions/_shared/llm/allowlist.ts`](./supabase/functions/_shared/llm/allowlist.ts) | Architecture / code | Edge provider allowlist | Code truth | 🟡 | Gemini, Groq | No `cloudflare` provider; do not flip env before **IPI-697 · CF-EDGE-003 — Add Cloudflare AI Gateway REST Client and Wire Brand Intelligence** |
| DESIGN-01 | [`design.md`](./design.md) | Design | Root visual contract | Medium | 🔴 | None | 19 broken links; typography conflicts with operator design |
| DESIGN-02 | [`Universal-design-prompt-4/index.md`](./Universal-design-prompt-4/index.md) | Design index | Design-package navigation | Design scope | 🟡 | Some AI guidance | Claims repo-wide SSOT and wrong counts/paths |
| DESIGN-03 | [`Universal-design-prompt-4/docs/handoff/SCREEN-REGISTRY.md`](./Universal-design-prompt-4/docs/handoff/SCREEN-REGISTRY.md) | Design | SCR numbering | High for IDs | 🟡 | Agent list | Keep as numbering SSOT; update implementation and paths |
| DESIGN-04 | [`Universal-design-prompt-4/components/COMPONENTS.md`](./Universal-design-prompt-4/components/COMPONENTS.md) | Component reference | Shared component contracts | High for design | 🟢 | Intelligence panel | Keep |
| DESIGN-05 | [`Universal-design-prompt-4/design-patched/tokens.css`](./Universal-design-prompt-4/design-patched/tokens.css) | Design | Prototype tokens | High for prototypes | 🟢 | None | Keep; React twin is `app/src/styles/tokens.css` |
| SKILL-01 | [`index-skills.md`](./index-skills.md) | Skill index | Intended skill catalog | High | 🟡 | Groq, Cloudflare | Reports 34 active vs 41 active top-level definitions; still lists phantom `infisical` / `groq-inference`; omits several active hubs |
| SKILL-02 | [`.claude/skills/README.md`](./.claude/skills/README.md) | Skill index | Skill orientation | Medium | 🟡 | Mixed | Reports 36; two broken Infisical links; phantom catalog entries |
| SKILL-03 | [`.claude/skills/index-skills.md`](./.claude/skills/index-skills.md) | Duplicate skill index | Older catalog | Low | 🔴 | Mixed | Reports 33; five broken links; replace with pointer after count refresh |

## 7. Current AI and Cloudflare architecture

### Confirmed code reality

```text
Operator app (production host documented as Vercel)
  → resolveModel() at module load
  → AI_ROUTING_MODE=direct by default
  → Gemini by default, Groq selectable

Optional legacy mode
  → AI_ROUTING_MODE=gateway
  → AI_GATEWAY_URL
  → services/cloudflare-worker/

Supabase Brand Intelligence
  → Gemini or Groq directly

Supabase Asset DNA
  → Gemini vision
  → non-Gemini path deliberately returns 501
```

The custom Worker is deployed and the repository describes it as still important. However, the actual production `AI_ROUTING_MODE` value and route traffic were **NOT VERIFIED** in this audit. Do not claim either “all production AI uses the Worker” or “production does not depend on it” until **IPI-609 · CF-MIG-230-SOAK — Zero-Legacy-Traffic Audit and Production Soak Gate** produces traffic evidence.

### Target architecture

```text
OpenNext / Mastra
  → request-scoped centralized resolver
  → Workers AI binding and/or managed AI Gateway

Supabase Edge Deno
  → Cloudflare AI Gateway REST API
  → Workers AI or approved provider
```

The target explicitly avoids routing Supabase Edge through the frozen custom Worker.

### Official Cloudflare verification

Official Cloudflare docs verified on 2026-07-18:

- Current REST endpoints live under `api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/ai/...`.
- `/ai/v1/chat/completions` is OpenAI compatible.
- Workers AI models use `@cf/...` and a specific gateway uses `cf-aig-gateway-id`.
- Authenticated Gateway Run tokens are account-scoped and cannot be restricted to one gateway.
- The old `gateway.ai.cloudflare.com/.../compat` endpoint is deprecated.
- Do not confuse that deprecated `/compat` endpoint with the current REST `/ai/run` endpoint, which Cloudflare also calls a universal endpoint.

### Provider findings

| Surface | Current | Target | Finding |
|---|---|---|---|
| OpenNext binding | No `AI` binding | `env.AI` with `ipix-prod` | **IPI-586 · CF-AI-003 — Wire One Workers AI Call Through ipix-prod Gateway** is Todo |
| Mastra resolver | Central but static at module load | Dynamic request-context resolver | **IPI-594 · CF-MIG-230 — Migrate Mastra Agents to Cloudflare-Native AI Routing** is Backlog |
| Per-agent rollback | Global `AI_ROUTING_MODE` only | Per-agent flags | **IPI-607 · CF-MIG-230-FLAGS — Add Per-Agent Routing Feature Flags** is Backlog |
| Public marketing | `fast` tier can use legacy gateway | First native canary | Lowest-risk migration wave |
| Tool agents | Direct Gemini by default | Native path after tool verification | Do not force through custom Worker |
| Brand Intelligence Edge | Gemini/Groq | Direct Cloudflare REST | IPI-697 is Todo |
| Asset DNA | Gemini vision | Evaluate after BI canary | **IPI-698 · CF-EDGE-004 — DNA vision evaluation after BI canary (parked)** is Backlog |
| Groq | Active in app, Edge, CI, config, skills | Remove after production pre-flight | **IPI-717 · AI-CF-MIGRATION — Route All AI Providers Through Cloudflare Workers and AI Gateway** is Backlog with narrowed Groq-only scope |
| Custom Worker | Deployed; traffic dependency unverified | Delete after zero-traffic soak | IPI-592 is Backlog |

Mastra documentation search did not return a current dynamic-model example for the exact `model: ({ requestContext }) => ...` shape. Before implementing IPI-594, verify that API against installed Mastra package types. The architecture direction is sound; the exact API is **NOT VERIFIED** here.

## 8. Cloudflare documentation findings

| File / group | Finding | Severity | Exact correction | Related task |
|---|---|---:|---|---|
| `tasks/cloudflare/todo.md` | IPI-472 still In Progress/45%; live Linear says Done | P0 | Mark Done and recompute hosting readiness | **IPI-472 · INFRA-001 — OpenNext CI and Deployment Pipeline** |
| `tasks/cloudflare/todo.md` | CF-EDGE sequence still includes **IPI-696 · CF-EDGE-002 — (Canceled) Merged into IPI-697 REST client + BI wire** and stale IPI-695 status | P0 | Sequence IPI-697 → **IPI-699 · CF-EDGE-005 — Edge secrets + Cloudflare canary + rollback (ops-only)**; show IPI-695 Done, IPI-696 Duplicate, and **IPI-700 · CF-EDGE-006 — (Canceled) Custom Worker auth not needed for direct REST Phase A** | **IPI-694 · CF-EDGE-AI — Route Supabase Edge LLM Through Cloudflare AI Gateway** |
| Merged IPI-695 ADR | Routes Edge through custom Worker | P0 | Replace with direct REST addendum in `000-Architecture-Decision.md` | **IPI-695 · CF-EDGE-001 — ADR addendum: Edge Deno → AI Gateway REST (not custom Worker)** |
| `tasks/cloudflare/user-journeys/` | IPI-454 shown active; `AI_GATEWAY_BASE_URL` used instead of `AI_GATEWAY_URL` | P1 | Mark IPI-454 Canceled and fix env name | **IPI-500 · CF-UJ-000 — Real-World AI Journey Test Suite** |
| `tasks/cloudflare/CLOUDFLARE-EPIC.md` | Missing on main; pending #487 copy is July 9 stale | P0 | Rewrite before merge or use live Linear + tracker as SSOT | **IPI-487 · CLOUDFLARE-EPIC — Cloudflare Platform Migration** |
| `tasks/cloudflare/prime/cloudflare-migration-audit.md` | Superseded body still says preview not deployed | P2 | Pointer-only historical stub or archive | **IPI-472 · INFRA-001 — OpenNext CI and Deployment Pipeline** |

## 9. Mastra and CopilotKit findings

| Concern | Current evidence | Problem | Action |
|---|---|---|---|
| Registry | Eight operator agents; public marketing isolated | Tests assert only three IDs | Keep registry; expand contract tests later |
| Resolver | Agents call shared `resolveModel()` | Models freeze at import; no `cfEnv` | Amend through IPI-594 only |
| Agent inventory | Live IPI-594 lists nine names | Includes nonexistent `exports-agent`, `shipping-agent`, `brand-approval`, `marketing-chat`; omits live agents | Correct Linear issue before implementation |
| Model registries | App runtime, app catalog, Worker registry differ | Three competing default-model truths | Declare runtime versus target and remove duplicate SSOT claims |
| Tool compatibility | Tool tiers stay direct unless explicitly enabled | Correct safety guard; gateway tool parity unproven | Keep guard |
| Rollback | One global routing flag | No independent per-agent rollback | Implement IPI-607 with IPI-594 Wave 0 |
| Evaluation | Golden evaluation issue exists | No evidence in current migration path | Gate later waves on **IPI-462 · CF-AI-006 — AI Provider Evaluation Suite** |
| `tasks/mastra/` | Absent from main | Pending PR #491 contains dated audits | Merge selectively, remove SSOT labels, fix links |

## 10. Supabase and Edge findings

| Surface | Current implementation | Target | Blocking issue | Safe to remove? | Proof required |
|---|---|---|---|---|---|
| Brand Intelligence | Direct Gemini or Groq | Direct Cloudflare AI Gateway REST | **IPI-697 · CF-EDGE-003 — Add Cloudflare AI Gateway REST Client and Wire Brand Intelligence** | No | Unit tests, schema validation, remote canary |
| Asset DNA | Gemini vision; other providers deferred | Evaluate Cloudflare vision after BI | **IPI-698 · CF-EDGE-004 — DNA vision evaluation after BI canary (parked)** | No | 5–10 asset comparison set |
| Edge secrets | Gemini/Groq secrets | Add account ID, Run token, gateway ID | **IPI-699 · CF-EDGE-005 — Edge secrets + Cloudflare canary + rollback (ops-only)** | No | Remote runtime and rollback ≤5 minutes |
| Custom Worker for Edge | Not used | Remain unused in Phase A | Live IPI-695/694 architecture | Yes for Edge dependency only | Code search plus canary |
| Gemini shared helper | Used by BI and DNA | Rollback until migration decisions | IPI-699 / IPI-698 | No | Zero callers plus rollback window |
| Groq Edge code | Selectable | Remove under IPI-717 | Production env pre-flight | No | Confirm deployed env does not select Groq |

## 11. Universal Design findings

| Design file / group | Purpose | Implementation status | Drift | Recommendation |
|---|---|---|---|---|
| `index.md` | Design package index | Navigation exists | Wrong counts and phantom token paths; does not link `Pages/INDEX.html` or the SCR-MOBILE gallery set | Update and scope to design package |
| `Pages/INDEX.html` | Prototype gallery index | Present on main | Unlinked from design Markdown indexes | Keep; add from package index |
| `SCR-MOBILE-*.dc.html` (5 files) | Mobile booking/CRM/planner shells | Prototypes present | Not inventoried in MATRIX/progress | Register or explicitly defer |
| `SCREEN-REGISTRY.md` | SCR identifiers | Mixed | Several built/unbuilt claims stale | Keep as numbering SSOT only |
| `components/COMPONENTS.md` | Component contracts | 20/20 component prototypes present | Largely aligned | Keep |
| `tasks/screens/MATRIX.md` | Screen implementation map | SCR-32–35 HTML prototypes exist; MATRIX rows/status lag | Broken links and stale status | Refresh or retire |
| `progress-tracker.md` | July 12 snapshot | Understates Assets, Deal, Booking, Planner | Contradicts July 18 todo and code | Demote or update |
| `todo.md` | Near-term design delivery | Closest to current | Incorrectly cites **IPI-528 · CF-AI-013 — Harden Gemini Tool-Message Handling** for a booking action | Keep and correct |
| `planner/planner.md` | Planner design | Design current, status stale | Says Hub lacks Linear issue | Link **IPI-526 · Planner Hub (SCR-35) — Screen Implementation Tracking** |
| `plan/planner/planner.md` | Engineering audit | Historical pre-implementation | Claims shipped code absent | Archive/banner |
| `design-patched/tokens.css` | Prototype tokens | Current | Index points at missing alternates | Keep as prototype SSOT |
| `app/src/styles/tokens.css` | React tokens | Current | Typography conflicts with root rules | Keep as React SSOT |
| `support.js` ×3 | Prototype support script | Three divergent copies | No clear owner | Merge to one canonical script |
| `html.md` / `HTML.md` | Prototype inventories | Different counts | Duplicate catalogs | Merge; keep richer catalog |
| `14-ai-runtime-contract.md` | Agent UX/runtime | Stale | Lists five agents, omits live set | Update from Mastra registry |
| Root plan documents | Eight files at package root on main | Candidate move exists only in dirty checkout | Links would break if moved alone | Move only with index/link updates |

Important design correction: operator Zeely guidance uses Inter and black actions, while root `AGENTS.md` says never use Inter and mandates Cormorant/Outfit/orange. Define an explicit operator-versus-marketing typography boundary before changing UI.

## 12. Skills inventory

Actual filesystem state:

- 42 non-archive `SKILL.md` paths: 41 active top-level definitions plus one nested Linear PM skill.
- Two additional top-level directory entries are archive symlinks; they are not part of the 42-definition count.
- 29 archived skill definitions.

Published counts disagree:

- [`index-skills.md`](./index-skills.md): 34 active.
- [`.claude/skills/README.md`](./.claude/skills/README.md): 36 active.
- [`.claude/skills/index-skills.md`](./.claude/skills/index-skills.md): 33 active.

Phantom catalog entries (indexed, no `.claude/skills/<name>/` on main):

- `infisical` — catalogs still point here; Infisical agent skills live only under gitignored `.agents/skills/` locally and are outside the audited tree.
- `groq-inference` — still listed in root and nested skill indexes; directory absent.

Active skills present on disk but missing from at least the root catalog (unindexed / under-indexed):

- `amazon-bedrock`, `pr-agent`, `sentry-pr-code-review`, `senior-prompt-engineer`, `cloudflare-workflow`, `cloudflare-workers-testing`
- `release-notes` and `vercel-react-best-practices` are indexed; keep them when counts are refreshed.

### Relevant skills

| Skill | Path | Purpose | Current? | Overlap / missing guidance | Action |
|---|---|---|---|---|---|
| iPix router | [`.claude/skills/ipix/`](./.claude/skills/ipix/) | Domain routing | Yes | None material | Keep |
| Task lifecycle | [`.claude/skills/ipix-task-lifecycle/`](./.claude/skills/ipix-task-lifecycle/) | Delivery workflow | Yes | Some older references | Update links |
| Graphify | [`.claude/skills/graphify/`](./.claude/skills/graphify/) | Knowledge graph | Yes | Graph absent in fresh worktrees | Document shared graph fallback |
| Cloudflare | [`.claude/skills/cloudflare/`](./.claude/skills/cloudflare/) | Platform hub | Yes | Large reference tree | Keep |
| Cloudflare workflow | [`.claude/skills/cloudflare-workflow/`](./.claude/skills/cloudflare-workflow/) | Accuracy gate | Yes | Some old endpoint terminology | Update `/compat` wording |
| Mastra | [`.claude/skills/mastra/`](./.claude/skills/mastra/) | Agent guidance | Yes | Agent ID list incomplete; live Groq reference | Amend |
| CopilotKit | [`.claude/skills/copilotkit/`](./.claude/skills/copilotkit/) | v2 integration | Yes | Current | Keep |
| Gemini | [`.claude/skills/gemini/`](./.claude/skills/gemini/) | Gemini integration | Yes | Must distinguish rollback from target | Amend after routing migration |
| Supabase | [`.claude/skills/ipix-supabase/`](./.claude/skills/ipix-supabase/) | RLS/Edge/migrations | Yes | Current remote-only rule | Keep |
| Design handoff | [`.claude/skills/design-to-production/`](./.claude/skills/design-to-production/) | Prototype parity | Yes | Design indexes stale | Keep; update references |
| Archived skills | [`.claude/skills/archive/`](./.claude/skills/archive/) | Historical evidence | No | 66 active/archive exact-copy Markdown groups | Preserve rationale, reduce byte copies |

### Skill duplicate policy

There are 66 exact active/archive Markdown duplicate groups (69 when all file types are counted), mainly Vercel React best practices, senior prompt engineering, and Mercur references. Keep the active skill. Preserve archive provenance through Git history, a release tag, or a pointer rather than maintaining identical full copies.

Groq guidance is still active in `.claude/skills/mastra/references/groq.md`. Do not archive it before IPI-717’s pre-flight confirms production and Edge are not selecting Groq.

## 13. Live Linear reconciliation

Live status and relations were fetched through Linear MCP on 2026-07-18.

| Task | Status | Scope correct? | Architecture correct? | Relations correct? | Code matches? | Score | Required correction |
|---|---|---:|---:|---:|---:|---:|---|
| **IPI-594 · CF-MIG-230 — Migrate Mastra Agents to Cloudflare-Native AI Routing** | Backlog | No | Mostly | No | No | 62 🔴 | Replace invented agent list; add actual `blockedBy` IPI-586 relation; verify Mastra dynamic API |
| **IPI-694 · CF-EDGE-AI — Route Supabase Edge LLM Through Cloudflare AI Gateway** | Todo | Yes | Yes | Yes | Not started | 86 🟡 | Repo ADR/tracker must match live direct-REST scope |
| **IPI-697 · CF-EDGE-003 — Add Cloudflare AI Gateway REST Client and Wire Brand Intelligence** | Todo | Yes | Yes | Yes | Not started | 90 🟢 | Add missing repository task spec or link live issue |
| **IPI-698 · CF-EDGE-004 — DNA vision evaluation after BI canary (parked)** | Backlog | Yes | Yes | Yes | Gemini remains | 94 🟢 | Keep parked; do not call deferment Done |
| **IPI-699 · CF-EDGE-005 — Edge secrets + Cloudflare canary + rollback (ops-only)** | Todo | Yes | Yes | Yes | Not started | 94 🟢 | Keep blocked by IPI-697 |
| **IPI-592 · CF-MIG-820 — Delete custom AI Gateway Worker (Phase 9 of 9, production-gated)** | Backlog | Yes | Yes | Yes | Worker remains | 92 🟢 | Keep blocked by IPI-609; verify production traffic before deletion |
| **IPI-717 · AI-CF-MIGRATION — Route All AI Providers Through Cloudflare Workers and AI Gateway** | Backlog | Narrowed to Groq cleanup | Yes after narrowing | Partly | Groq active | 84 🟡 | Retitle to say Groq cleanup; reconcile overlap with the cleanup and Worker-deletion tasks |
| **IPI-459 · CF-AI-009 — Groq Code & Config Cleanup** | Duplicate | Historical duplicate | Stale | No | Groq active | 45 🔴 | `duplicateOf` points to IPI-592; live IPI-717 is the narrower successor |
| **IPI-551 · PLN-S4b — Adaptive Context Panel (Intelligence ⇄ Detail)** | In Progress | Yes | Yes | Yes | Draft PR #490 only | 88 🟡 | Update design trackers; do not claim main implementation yet |

Scoring: 90–100 production-ready plan · 75–89 usable with corrections · below 75 materially incorrect · historical/deferred assessed as a gate, not implementation readiness.

### Important dependency issues

| Task | Live status | Repository implication |
|---|---|---|
| **IPI-472 · INFRA-001 — OpenNext CI and Deployment Pipeline** | Done | Cloudflare tracker is stale |
| **IPI-632 · CF-MIG-220 — Protected Preview Runtime Smoke Validation** | In Progress | Preview exists; remote SSE/agent smoke not complete |
| **IPI-606 · CF-SEC-010 — Connect Infisical Secrets to Cloudflare Deployment** | In Progress | PR #475 remains open/unstable |
| **IPI-586 · CF-AI-003 — Wire One Workers AI Call Through ipix-prod Gateway** | Todo | Blocks IPI-607 and should block IPI-594 |
| **IPI-607 · CF-MIG-230-FLAGS — Add Per-Agent Routing Feature Flags** | Backlog | Blocked by IPI-586 |
| **IPI-609 · CF-MIG-230-SOAK — Zero-Legacy-Traffic Audit and Production Soak Gate** | Backlog | Blocks Worker deletion |
| **IPI-695 · CF-EDGE-001 — ADR addendum: Edge Deno → AI Gateway REST (not custom Worker)** | Done | Merged repo ADR does not satisfy live scope |
| **IPI-696 · CF-EDGE-002 — (Canceled) Merged into IPI-697 REST client + BI wire** | Duplicate | Remove from active tracker sequence |
| **IPI-700 · CF-EDGE-006 — (Canceled) Custom Worker auth not needed for direct REST Phase A** | Canceled | Do not revive unless direct REST is rejected |

## 14. Repository ↔ Linear drift

| Source | Reference | Expected counterpart | Actual | Drift | Proposed correction |
|---|---|---|---|---|---|
| `tasks/cloudflare/todo.md` | IPI-472 In Progress | Linear Done | Done since 2026-07-18 | Status | Update tracker |
| Merged Edge ADR | IPI-695 custom Worker | Linear direct REST | Contradictory architecture | Architecture | Replace ADR/add addendum |
| `tasks/cloudflare/todo.md` | IPI-696 active | Linear Duplicate of IPI-697 | Obsolete step | Dependency | Remove from sequence |
| IPI-594 description | Nine agents | Current registry | Several invented/missing agents | Scope | Rewrite inventory |
| IPI-594 relations | Description says blocked by IPI-586 | Live relation only `relatedTo` | Missing hard dependency | Relation | Add `blockedBy` after approval |
| IPI-459 relation | Duplicate of IPI-592 | IPI-717 now owns Groq-only cleanup | Semantically wrong duplicate target | Relation | Repoint/supersede after approval |
| IPI-551 | In Progress, PR #490 | Origin main | Feature exists only on draft branch | Status/code | Keep In Progress; update docs |
| `docs/linear/issues/` | Priority issues | Local mirrors | Priority set absent | Missing mirror | Export in separate docs PR |
| `tasks/prime/todo` | Three restored paths | Main files | Paths supplied only by pending PRs | Pending dependency | Mark Pending merge |

## 15. Pending restore pull requests

The primary audit fetched all five through authenticated GitHub CLI: each was open with merge state `UNSTABLE`, and none was part of the audited baseline. The independent verifier could not re-fetch GitHub state, so treat this as point-in-time evidence.

| PR | Content | Main risk | Recommendation |
|---|---|---|---|
| [#486](https://github.com/amo-tech-ai/lumina-studio/pull/486) | Supabase plan pack | Six exact duplicates and stale Worker-broker Edge plan | Merge unique audits/plans only after direct-REST rewrite |
| [#487](https://github.com/amo-tech-ai/lumina-studio/pull/487) | Cloudflare epic, chat plans, migration, CF-EDGE tasks | July 9 epic conflicts with live Linear; 13 broken links | Rewrite/demote epic before merge |
| [#488](https://github.com/amo-tech-ai/lumina-studio/pull/488) | J18 hosting audit/plan | Six broken links; 8.26 MiB incorrectly called below 7.5 MiB | Correct paths/arithmetic, then merge |
| [#489](https://github.com/amo-tech-ai/lumina-studio/pull/489) | Cloudinary architecture and operations | 17 broken links; one exact duplicate with Prime | Omit duplicate; repair links |
| [#491](https://github.com/amo-tech-ai/lumina-studio/pull/491) | `tasks/mastra/` restoration | 11 broken links; July 16 status and SSOT language | Preserve as dated research; point execution to current tracker |

Do not confuse PR #491 with **IPI-491 · CF-AI-004b — Fix AI Gateway embeddings (adapter ↔ Workers AI)**, which is already Done through PR #316.

## 16. Duplication and conflict analysis

| Group | Files/issues | Best SSOT | Recommendation | Risk |
|---|---|---|---|---|
| Skill catalogs | Three skill indexes | Root `index-skills.md` | Refresh root; replace nested index with pointer | Agents load wrong guidance |
| Active/archive skills | 66 exact-copy Markdown groups | Active skill | Archive by pointer/tag/history | Ongoing duplicate maintenance |
| Cloudinary/Supabase plan | [`tasks/cloudinary/plan/cloudinary-supabase.md`](./tasks/cloudinary/plan/cloudinary-supabase.md) and [`tasks/prime/cloudinary-supabase.md`](./tasks/prime/cloudinary-supabase.md) | Cloudinary-domain copy | Byte-identical on main (SHA `47eb563e…`); keep Cloudinary path, replace Prime with link | Contradictory future edits |
| Linear issue mirrors | 21 byte-identical pairs under `docs/linear/issues/` and root `linear/issues/` | [`docs/linear/issues/`](./docs/linear/issues/) | Retire root `linear/issues/` duplicates; live Linear still wins | Double edits / drift |
| PRD navigation | [`docs/prd/README.md`](./docs/prd/README.md) vs flat `docs/prd/*.md` files | Flat files in `docs/prd/` | Fix README paths; do not invent sibling folders | Broken onboarding links |
| Supabase plan pack | Six pending PR #486 files duplicate Prime | `supabase/docs/plan/` for architecture; Prime for execution | Avoid byte copies; link | Two SSOTs |
| Cloudflare epic | Live Linear, current tracker, pending Jul-9 epic | Live Linear + tracker | Rewrite pending epic as navigation only | Stale execution order |
| Edge architecture | Live IPI-695/694 versus merged Worker ADR | Live direct-REST architecture | Replace merged ADR | Wrong implementation path |
| Design tokens | Prototype and React token files plus phantom paths | Two explicit owners by runtime | Keep two; remove phantom index claims | UI drift |
| Planner plans | `planner/`, `plan/planner/`, uploads | `planner/` design; current Linear/code for status | Archive old engineering snapshot | Engineers implement obsolete state |
| Design inventories | `html.md`, `HTML.md`, MATRIX, progress tracker | Screen Registry for IDs; todo for status | Merge or clearly scope | Counts/status disagree |
| Groq cleanup | IPI-459, IPI-717, partial IPI-592 scope | IPI-717 for Groq-only cleanup | Correct duplicate relation and boundaries | Premature removal or double work |

## 17. Empty and missing documentation

Actionable empty or malformed documentation:

- [`tasks/cloudflare/plan/summary-plan-2.md`](./tasks/cloudflare/plan/summary-plan-2.md)
- [`tasks/cloudflare/draft/status-cloudflare.md`](./tasks/cloudflare/draft/status-cloudflare.md) (3-byte stub)
- [`supabase/docs/pr-292-audit.md`](./supabase/docs/pr-292-audit.md)
- [`supabase/docs/testing/testing_overview.md`](./supabase/docs/testing/testing_overview.md)
- [`supabase/docs/testing/testing_supa.md`](./supabase/docs/testing/testing_supa.md)
- [`supabase/docs/testing/testing_supa2.md`](./supabase/docs/testing/testing_supa2.md)
- `Universal-design-prompt-4/plan/planner/tasks/prompt-` (empty, truncated filename)

Missing or incomplete navigation:

- Root `README.md` does not link a usable repository index.
- `tasks/`, `supabase/docs/`, and `app/docs/` have no reliable local entry page (`tasks/README.md`, `supabase/docs/README.md`, `app/docs/README.md` absent).
- `docs/index-docs.md` and `docs/prd/README.md` link to missing paths (see DOC-01 / DOC-03).
- `tasks/cloudflare/CLOUDFLARE-EPIC.md` is missing on main.
- `tasks/mastra/` is missing on main.
- `supabase/docs/plan/` is missing on main.
- Priority Linear issues have no local mirrors under `docs/linear/issues/`.
- Universal Design MATRIX/progress lag SCR-32–35 and SCR-MOBILE prototypes that already exist under `Pages/`.

Dirty-checkout-only (present in unprotected `/home/sk/ipix`, **absent from audited `origin/main`** — do not act on these in cleanup PRs):

- `tasks/docs/file-index.md` — audit prompt misnamed as a file index.
- `tasks/cloudflare/prime/cloudflare-plan.md` — empty (0 bytes).

On-main Cloudinary duplicate (no longer dirty-only): [`tasks/cloudinary/plan/cloudinary-supabase.md`](./tasks/cloudinary/plan/cloudinary-supabase.md) ≡ [`tasks/prime/cloudinary-supabase.md`](./tasks/prime/cloudinary-supabase.md).

Add new READMEs only where they reduce ambiguity. Do not create another competing source of truth.

## 18. Critical blockers

| Priority | Blocker | Evidence | Impact | Required fix |
|---:|---|---|---|---|
| P0 | Edge ADR contradicts live architecture | Merged Worker ADR vs live IPI-695/694 | Engineer may build a proxy scheduled for deletion | Direct-REST addendum / replace ADR |
| P0 | Cloudflare tracker status drift | IPI-472 Done; tracker says In Progress | Wrong execution priority | Sync tracker |
| P0 | Production AI path unverified | Code default, CLAUDE claim, and IPI-592 disagree | Unsafe Worker deletion or false architecture claims | IPI-609 evidence |
| P0 | IPI-594 agent list is wrong | Live issue vs `app/src/mastra` registry | Migration targets nonexistent agents and misses live ones | Rewrite issue before implementation |
| P1 | Native AI path not built | No `AI` binding or `cfEnv` | No Cloudflare-native Mastra traffic | IPI-586 → IPI-607 → IPI-594 |
| P1 | Edge Cloudflare provider not built | Allowlist accepts Gemini/Groq only | Premature secret flip breaks BI/DNA | IPI-697 before IPI-699 |
| P1 | Restore PRs are unstable and contain stale/duplicate docs | GitHub + content audit | Reintroduces contradictions | Repair/selectively merge |
| P1 | Design implementation trackers contradict code | MATRIX/progress vs app routes | Wrong task planning | Reconcile against code and Linear |

## 19. Approval-ready documentation cleanup plan

Purpose: clear misleading docs **just enough** to stop wrong implementation paths, then return to production tasks (IPI-606 / IPI-632 / IPI-697 / IPI-586). This section supersedes the earlier “safe corrections” list for execution.

### 19.1 Classification (re-verified 2026-07-19 on `92c6e3e5`)

#### 🔴 Broken or misleading

| Finding | Evidence | Proposed action | Risk | Confidence | Approval needed |
|---|---|---|---|---:|---|
| `docs/prd/README.md` Postiz/ecommerce links | `../postiz/` missing; `../ecommerce/prd-ecommerce.md` missing (dir exists, evidence-only) | Retarget to `./postiz-prd.md` and `./prd-ecommerce.md` | Low | High | No — path fix |
| `docs/index-docs.md` dead navigation | 180 MD in `docs/`; links to 7 missing paths; dated 2026-06-14; “2,100+” false | Demote/banner + remove or retarget dead links; do not invent folders | Low | High | No — link/banner fix |
| `tasks/cloudflare/draft/status-cloudflare.md` | 3 bytes (`cre`) | Delete or replace with pointer to `tasks/cloudflare/todo.md` | Low | High | Yes — delete vs stub |
| Merged Edge ADR vs live direct-REST | ADR names Worker broker; Linear IPI-695/694 = REST | Docs correction PR (addendum/replace) before CF-EDGE code | Med | High | Yes — architecture doc |
| Cloudflare tracker status drift | Live IPI-472 Done vs tracker In Progress | Status-only sync in `tasks/cloudflare/todo.md` | Low | High | No — status sync |
| IPI-594 agent inventory | Live issue invents agents / misses registry | Linear rewrite (separate from docs PR) | Med | High | Yes — Linear |

#### 🟡 Duplicate, stale, or unindexed

| Finding | Evidence | Proposed action | Risk | Confidence | Approval needed |
|---|---|---|---|---:|---|
| 21 root `linear/issues/` mirrors | SHA-identical to `docs/linear/issues/` | Archive root copies; keep `docs/linear/issues/` as supporting mirror; live Linear wins | Low | High | Yes — archive |
| Cloudinary plan byte-dupe | `tasks/cloudinary/plan/…` ≡ `tasks/prime/…` (`47eb563e…`) | Keep Cloudinary path; replace Prime with one-line link | Low | High | Yes — replace with link |
| Skill catalog phantoms | `infisical`, `groq-inference` indexed; no `.claude/skills/<name>/` | Remove phantom rows; point Infisical to gitignored `.agents/skills` note or omit | Low | High | No — catalog fix |
| Unindexed active skills | 6 hubs on disk absent from root catalog | Add rows for `amazon-bedrock`, `pr-agent`, `sentry-pr-code-review`, `senior-prompt-engineer`, `cloudflare-workflow`, `cloudflare-workers-testing` | Low | High | No — catalog fix |
| Nested skill index duplicate | `.claude/skills/index-skills.md` vs root | Replace nested with pointer to root `index-skills.md` | Low | Med | Yes — delete/pointer |
| Empty Supabase/CF stubs | 5 zero-byte MD + truncated `prompt-` | Archive/delete after provenance note | Low | High | Yes — delete |
| MATRIX lag SCR-32–35 / MOBILE | Prototypes in `Pages/`; MATRIX ends at SCR-31 | Add rows or “prototype-only / not tracked” note | Low | High | Yes — status semantics |
| Unlinked `Pages/INDEX.html` | Exists; design `index.md` does not link it | Add one link from Universal Design index | Low | High | No — link add |
| Root `README.md` dead-end | Five lines, no index | Link this `index.md` after merge | Low | High | No — after this PR |

#### 🟢 Correct and retained

| Asset | Why retain |
|---|---|
| `app/` Next.js + `app/src/mastra/` registry | Code truth for agents and routing consumers |
| `tasks/cloudflare/todo.md` | Best Cloudflare execution tracker (needs status sync only) |
| `tasks/prime/todo` + `notes-edge-8.md` | Matches live Edge direct-REST intent |
| `Universal-design-prompt-4/docs/handoff/SCREEN-REGISTRY.md` | SCR numbering SSOT |
| `Universal-design-prompt-4/components/COMPONENTS.md` | Component contracts |
| `Universal-design-prompt-4/Pages/*.dc.html` including SCR-32–35 and SCR-MOBILE | Prototype evidence; do not delete |
| `docs/linear/issues/` (non-duplicate unique set) | Supporting mirrors; live Linear still wins |
| `index-skills.md` (after refresh) | Intended canonical skill catalog |
| This `index.md` | Cross-repo audit entry after docs-only PR |

#### ⚪ Deferred / not verified

| Item | Why deferred |
|---|---|
| Production `AI_ROUTING_MODE` / custom Worker traffic / `ipix-prod` gateway traffic | No runtime/dashboard probe |
| Mastra dynamic model callback API shape | Docs search inconclusive |
| DNA vision model parity | No evaluation run |
| Pending restore PRs #486–#489 / #491 selective merge | Unstable; separate repair track |
| Active/archive skill byte-copies (66 groups) | Large; not blocking production |
| Dirty-checkout `file-index.md` / empty `cloudflare-plan.md` | Not on `origin/main` |
| New `tasks/README.md`, `supabase/docs/README.md`, `app/docs/README.md` | Optional; YAGNI until navigation pain persists |
| Linear title/relation fixes (IPI-459, IPI-717, IPI-594) | Needs human approval; not docs-file work |

### 19.2 Proposed change ledger

| Source path | Target action | Canonical SSOT / replacement | Risk | Confidence | Rollback |
|---|---|---|---|---:|---|
| `docs/prd/README.md` | Fix relative links | `./postiz-prd.md`, `./prd-ecommerce.md` | Low | High | Revert commit |
| `docs/index-docs.md` | Banner + drop/retarget dead links | This `index.md` for repo nav; live paths only | Low | High | Revert commit |
| `README.md` | Add link to `index.md` | This file | Low | High | Revert commit |
| `index-skills.md` + `.claude/skills/README.md` | Remove phantoms; add 6 missing hubs; fix counts (41) | Disk `.claude/skills/*/SKILL.md` | Low | High | Revert commit |
| `.claude/skills/index-skills.md` | Replace with pointer | Root `index-skills.md` | Low | Med | Restore file from git |
| `tasks/cloudflare/todo.md` | Status-only corrections (IPI-472 etc.) | Live Linear | Low | High | Revert commit |
| `tasks/cloudflare/draft/status-cloudflare.md` | Delete or one-line pointer | `tasks/cloudflare/todo.md` | Low | High | Restore blob |
| `tasks/cloudflare/plan/summary-plan-2.md` + 4 empty `supabase/docs/**` + `prompt-` | Archive/delete | N/A (empty) | Low | High | Restore blobs |
| `linear/issues/{21 identical}.md` | Archive root copies | `docs/linear/issues/` + live Linear | Low | High | Restore blobs |
| `tasks/prime/cloudinary-supabase.md` | Replace body with link | `tasks/cloudinary/plan/cloudinary-supabase.md` | Low | High | Restore blob |
| `Universal-design-prompt-4/index.md` | Link `Pages/INDEX.html` | Pages gallery | Low | High | Revert commit |
| `Universal-design-prompt-4/tasks/screens/MATRIX.md` | Add SCR-32–35 (+ optional MOBILE) rows or defer note | Pages HTML + live Linear for build status | Med | High | Revert commit |
| Edge ADR under `tasks/cloudflare/adr/` | Addendum/replace (separate PR) | Live IPI-695/694 direct REST | Med | High | Revert ADR commit |
| Linear IPI-594 / IPI-459 / IPI-717 | Relation/title fixes (not in docs PR) | Live registry + IPI-717 Groq scope | Med | High | Linear history |

### 19.3 Confirmation checklist

| Check | Result |
|---|---|
| 21 mirrored `linear/issues/` files byte-identical | ✅ Confirmed |
| Broken Postiz/ecommerce PRD links | ✅ Confirmed (both target files wrong; ecommerce dir ≠ PRD file) |
| Skill catalog phantoms (`infisical`, `groq-inference`) | ✅ Confirmed |
| Unindexed active skill hubs (6) | ✅ Confirmed |
| Unlinked `Pages/INDEX.html` | ✅ Confirmed (file present; design index unlinked) |
| SCR-32–35 MATRIX lag | ✅ Confirmed (HTML present; MATRIX has no SCR-32–35 rows) |
| Malformed 3-byte Cloudflare status file | ✅ Confirmed (`cre`) |
| Relative links in this `index.md` | ✅ 92 links / 0 missing (rechecked after finalize edits) |
| Dirty-worktree-only evidence excluded from main actions | ✅ `file-index.md`, empty `cloudflare-plan.md` only |

### 19.4 Safest execution order (docs → production)

1. **Fix broken links** — `docs/prd/README.md`, dead rows in `docs/index-docs.md`, link `Pages/INDEX.html`.
2. **Update indexes/catalogs** — skill phantoms + unindexed hubs; root README → this index (after step 6).
3. **Archive verified mirrors** — 21 root `linear/issues/` twins; Cloudinary Prime → link; empty stubs.
4. **Repair malformed stubs** — `status-cloudflare.md` delete/pointer; Cloudflare tracker status sync.
5. **Handle prototypes** — MATRIX SCR-32–35 / MOBILE note; do not delete HTML.
6. **Docs-only PR for this `index.md`** — merge first as the navigation SSOT, or same wave as step 1 if single-concern allows (prefer **this file alone** first).
7. **Stop docs churn** — Edge ADR correction only if it blocks CF-EDGE coding; then production: IPI-606 / IPI-632 → IPI-697 → IPI-586.

### 19.5 Approval buckets

**Safe to approve now (docs-only, low risk):**

- PRD link retargets
- `docs/index-docs.md` dead-link trim + stale banner
- Skill catalog phantom removal + unindexed adds
- Universal Design index → `Pages/INDEX.html`
- Cloudflare tracker status-only sync
- This `index.md` docs-only PR

**Needs human decision:**

- Delete vs pointer for `status-cloudflare.md` and empty stubs
- Archive 21 root Linear mirrors (vs keep both)
- Replace Prime Cloudinary file with link
- MATRIX: add build rows vs “prototype-only”
- Edge ADR rewrite timing vs starting IPI-697
- Any Linear mutations (IPI-594 / IPI-459 / IPI-717)

**Deferred (do not block production):**

- Dirty-checkout `file-index.md` / empty `cloudflare-plan.md`
- 66 active/archive skill byte-copies
- Restore PR #486–#489 / #491 selective merges
- New domain README files
- Production routing probes (IPI-609)

## 20. Changes requiring approval

- Archive or rename existing files (mirrors, stubs, Cloudinary Prime body).
- Change Linear statuses, relations, parents, or duplicate targets.
- Replace the merged IPI-695 ADR.
- Selectively rewrite pending restore PR branches.
- Remove Groq code, packages, config, CI sync, secrets, or skills.
- Delete the custom Worker.
- Move Universal Design root plans into `plan/`.
- Consolidate divergent design scripts or token guidance.

## 21. Proposed Linear changes

No Linear mutations were made. Defer until after docs cleanup PR merges and production track resumes:

1. **IPI-594 · CF-MIG-230 — Migrate Mastra Agents to Cloudflare-Native AI Routing** — rewrite agent list; add `blockedBy` IPI-586.
2. **IPI-459 · CF-AI-009 — Groq Code & Config Cleanup** — successor should be IPI-717, not IPI-592.
3. **IPI-717 · AI-CF-MIGRATION — Route All AI Providers Through Cloudflare Workers and AI Gateway** — retitle to Groq-only cleanup.
4. **IPI-695 · CF-EDGE-001 — ADR addendum: Edge Deno → AI Gateway REST (not custom Worker)** — docs child if Done must mean ADR matches repo.
5. Keep **IPI-551 · PLN-S4b — Adaptive Context Panel (Intelligence ⇄ Detail)** In Progress while draft PR #490 remains unmerged.

## 22. Scores

Scores are audit-rubric judgments, not measured test coverage.

| Area | Score |
|---|---:|
| Repository index completeness | 94 |
| Cloudflare architecture accuracy | 68 |
| Mastra plan accuracy | 55 |
| Supabase Edge plan accuracy | 52 |
| Linear consistency | 72 |
| Skills quality | 74 |
| Universal Design consistency | 42 |
| Task-to-code alignment | 58 |
| Documentation duplication | 61 |
| Production readiness | 38 |
| **Overall documentation audit (weighted toward blockers + navigation)** | **64 / 100** |

Production readiness is not claimed. After the safe docs fixes above, stop cleaning and execute production gates.

## 23. Recommended commit / PR sequence

| # | Concern (one per PR) | Files | Merge before production? |
|---:|---|---|---|
| 1 | Docs-only: publish this audit index | `index.md` (+ optional `README.md` link) | Yes — navigation SSOT |
| 2 | Docs-only: broken link fixes | `docs/prd/README.md`, `docs/index-docs.md`, `Universal-design-prompt-4/index.md` | Yes — cheap, high clarity |
| 3 | Docs-only: skill catalog refresh | `index-skills.md`, `.claude/skills/README.md`, pointer for nested index | Yes if agents use catalogs |
| 4 | Docs-only: tracker status + stub cleanup | `tasks/cloudflare/todo.md`, `status-cloudflare.md`, empty stubs | Yes for CF execution honesty |
| 5 | Docs-only: mirror/dupe collapse | 21 `linear/issues/*`, Prime Cloudinary → link | Optional; approve archive first |
| 6 | Docs-only: MATRIX / prototype status | `MATRIX.md` | Optional; design track |
| 7 | Docs-only: Edge ADR addendum | ADR path under `tasks/cloudflare/adr/` | **Required before CF-EDGE code** |
| — | **Production code track** | IPI-606, IPI-632, IPI-697, IPI-586… | Resume after #1–#2 (and #7 if Edge) |

Do **not** mix any of these with application code.

## 24. Verification record

| Claim | Evidence | Result |
|---|---|---|
| Baseline isolated | Dedicated worktree reset to `origin/main` `92c6e3e5` | Confirmed |
| Main checkout protected | Unrelated dirty state remained outside the dedicated worktree | Confirmed |
| 21 identical Linear mirrors | SHA-256 of shared filenames | Confirmed |
| Postiz/ecommerce PRD link breakage | Path existence checks | Confirmed |
| Skill phantoms + 6 unindexed hubs | Catalog text vs `.claude/skills/*/SKILL.md` | Confirmed |
| Pages INDEX + SCR-32–35 + SCR-MOBILE vs MATRIX | Filesystem + MATRIX content | Confirmed |
| 3-byte Cloudflare status stub | `wc -c` + content `cre` | Confirmed |
| Cloudinary on-main duplicate | Identical SHA on both paths | Confirmed |
| Dirty-only files absent from main | `file-index.md`, empty `cloudflare-plan.md` | Confirmed |
| This index relative links | 92 links / 0 missing | Confirmed |
| Priority Linear status | Live Linear MCP (earlier pass) | Point-in-time; re-fetch before Linear edits |
| Production `AI_ROUTING_MODE` / Worker traffic | No production env/analytics probe | **NOT VERIFIED** |
| Mastra dynamic model callback signature | Mastra docs search returned no match | **NOT VERIFIED** |

## 25. Maintenance rules

1. Update this file when a canonical domain tracker, architecture decision, or skill hub moves.
2. Keep detailed task state in domain trackers and live Linear, not duplicated here.
3. Link instead of copying plans.
4. Date snapshots and label pending PR content.
5. Never infer production routing from a code default.
6. Never mark a deferred evaluation Done.
7. Do not extend the retired Vite application.
8. Keep one concern per PR and commit.
9. Preserve historical rationale with explicit superseded banners.
10. Prefer production task progress over further docs archaeology once PRs #1–#2 above land.
11. Re-run link, duplicate, and Linear reconciliation checks before the next repository-wide audit.
