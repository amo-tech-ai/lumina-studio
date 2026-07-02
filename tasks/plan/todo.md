---
title: iPix Platform — Master Task Tracker
version: "3.9"
lastUpdated: "2026-07-02"
status: Active
purpose: **Canonical master todo** — all IPI-* · STR-* · DESIGN-* priority, sprint, blockers. Linear sync mapping.
auditScore: "82/100 (B+)"
aiSetupScore: "74/100"
stackReadiness: "68/100"
verifiedAt: "2026-07-02"
verifiedMain: "0479aba"
---

# iPix Platform — Master TODO

**Team:** [iPix1](https://linear.app/amo100/team/IPI) · **Projects:** [AI INTELLIGENCE](https://linear.app/amo100/project/ai-intelligence-fe1f696f58be/issues) · [BRAND](https://linear.app/amo100/project/brand-0f931d0785c7/issues)
**Read in 30s:** [Tracker hierarchy](#tracker-hierarchy) → [Master registry](#master-task-registry) → [P0/P1 blockers](#p0--p1-blockers) → [Current sprint](#current-sprint)
**Full detail / history:** [`../../docs/archive/todo-backup-20260626.md`](../../docs/archive/todo-backup-20260626.md) · Per-domain detail in the [plan index](#plan--prd-index).
**AI stack:** [`../ai/README.md`](../ai/README.md) · [`../ai/task-stack-map.md`](../ai/task-stack-map.md) · [`../ai/audit-checklist.md`](../ai/audit-checklist.md)
**Design specs (detail only):** [`tasks/design-docs/plan/TASKS.md`](../design-docs/plan/TASKS.md) · [Design track §](#design-track) · handoff [`design-docs/handoff/`](../design-docs/handoff/handoff.md)

**Architecture (do not regress):**
```text
Next.js app/  →  /api/copilotkit  →  MastraAgent.getLocalAgents({ mastra })
Operator UI   →  useAgent({ agentId })  →  agent id === Mastra registry key
Routes        →  /app/*   (NOT /dashboard/*, NOT Vite :8080 proxy)
```

**Verified 2026-07-02:** `main` @ `0479aba` · CI 🟢 · `cd app && npm test` → **547 passed**, 6 skipped · detail: [`tasks/todo.md`](../todo.md) § Progress Task Tracker.

**Recent merges:** [#168–#171](https://github.com/amo-tech-ai/lumina-studio/pull/168) CC workspace · [#177](https://github.com/amo-tech-ai/lumina-studio/pull/177) Gemini-first dev · [#178](https://github.com/amo-tech-ai/lumina-studio/pull/178) Suspense audit · [#180](https://github.com/amo-tech-ai/lumina-studio/pull/180) ActiveBrandProvider.

**Draft — not on main:** [#181](https://github.com/amo-tech-ai/lumina-studio/pull/181) Brand List + Detail parity (~80% / ~75%) · 577 tests on branch · Codacy 🔴.

---

## Changelog

| Date | Version | What changed |
|---|---|---|
| 2026-07-02 | 3.9 | **July 2 verify sync:** main `0479aba` · P4 Command Center 85% (#168–#171) · Brand List/Detail **PR #181 only** · MVP gate ~67% · infra #177/#178/#180 merged · blockers on #181 |
| 2026-06-30 | 3.8 | **IPI-17 reprioritized:** DESIGN-050 Command Center → P0 **Urgent** — main operator dashboard (`/app`) |
| 2026-06-29 | 3.7 | **Master todo consolidation:** tracker hierarchy, unified registry (IPI+DESIGN+STR), Design track §; fixed broken `plan/` paths; DESIGN-016–018 → 🟢 stub; P1 queue → DESIGN-070 |
| 2026-06-29 | 3.6 | AI stack audit: `docs/ai/*`; audit-plans v2.0 (76/100); task-stack-map v1.1 (91% accurate); audit-checklist |
| 2026-06-29 | 3.5 | Audit reconciliation (82/100): P0/P1 blockers section, design↔prod table, architecture maps backlog, fixed stale `brand-approval` debt (registered ✅), cross-linked Universal design prompt plan |
| 2026-06-28 | 3.4 | Added shoot detail action tasks IPI-209–217 with correct implementation order + Linear links; added Stripe phase placeholder; updated P5 Shoots table; updated dashboard % |
| 2026-06-26 | 3.3 | Archived verbose tracker; restructured dashboard; added media intelligence detail |
| 2026-06-25 | 3.2 | Added shoot detail label audit; created IPI-210–215 action issues |
| 2026-06-20 | 3.1 | Shoot wizard shipped (PR #96/#98); IPI-150 HITL gate merged |

---

## Audit scorecard (2026-06-29)

**Overall: 🟡 82/100 (B+)** — strong tracker; cleanup before execution.

| Area | Score | Dot | Notes |
|------|------:|:---:|-------|
| Clarity | 90 | 🟢 | Dashboard, sprint, build order clear |
| Prioritization | 88 | 🟢 | Immediate next work obvious |
| Dependency tracking | 86 | 🟢 | Shoot Detail sequence strong |
| Accuracy risk | 78 | 🟡 | CC/Brand UX caught up on main + #181 draft — reconcile Brand rows as **PR only** until merge |
| Production readiness | 70 | 🟡 | Payments, assets, campaigns, matching weak |
| Blocker visibility | 80 | 🟡 | P0/P1 section added below |

**Critical fixes tracked:** IPI-209 Shoot Detail · STR-001–008 Linear creation · IPI-89 Vite retirement · DESIGN-070 route-agent gaps · prod/design reconciliation.

**Setup scores (2026-06-29):** app **74/100** · stack readiness **68/100** · live Supabase **81/100** — see [`ai/README.md`](../ai/README.md).

---

## Tracker hierarchy

| Role | File | Use for |
|------|------|---------|
| **Master execution (this file)** | **`tasks/plan/todo.md`** | All IPI-* · STR-* · DESIGN-* — priority, sprint, blockers |
| Stack per task | [`ai/task-stack-map.md`](../ai/task-stack-map.md) | CopilotKit · Mastra · Supabase · Gemini · Cloudinary |
| Design build order (view) | [`tasks/todo.md`](../todo.md) | Handoff stage order — **mirror of [Design track §](#design-track)** |
| Design task specs | [`tasks/design-docs/plan/TASKS.md`](../design-docs/plan/TASKS.md) | Dependencies, acceptance, handoff links |
| Tasks hub | [`tasks/README.md`](../README.md) · [`tasks/index.md`](../index.md) | Full document index |
| Architecture maps | [`API-MAP`](../design-docs/plan/API-MAP.md) · [`AGENT-MAP`](../design-docs/plan/AGENT-MAP.md) · [`MEDIA-MAP`](../design-docs/plan/MEDIA-MAP.md) | DESIGN-016–018 stubs v0.1 |
| Prototype only | [`Universal design prompt/todo.md`](../../Universal%20design%20prompt/todo.md) | DC HTML prototypes — **not** production status |

---

## Master task registry

**Canonical prioritized list.** Drill-down: [P0/P1](#p0--p1-blockers) · [Shoot chain](#immediate--shoot-detail-in-order) · [Design track](#design-track) · [Stripe](#stripe-payments--executable-backlog-linear-not-created).

| Pri | ID | Task | Track | Status | Notes |
|:---:|-----|------|-------|--------|-------|
| P1 | **IPI-209** | Shoot Detail workspace — 9-tab shell | Platform | **✅ Done** PR #150 | ↔ **DESIGN-054** |
| P0 | IPI-89 | Vite retirement (PLT-015) | Platform | 🟡 72% | Duplicate runtime |
| P0 | STR-001–003 | Stripe checkout + deposit + webhooks | Stripe | ⚪ | Linear not created |
| P1 | IPI-127 | Prod auth smoke | Platform | ⚪ | Manual |
| P1 | IPI-189 | Wizard step-1 specs (MI) | Media | ⚪ | Can parallel IPI-209 |
| P1 | **DESIGN-010** | Sync tokens.css v3 → `app/` | Design | 🟢 | [#162](https://github.com/amo-tech-ai/lumina-studio/pull/162) merged |
| P1 | **DESIGN-030–033** | Shell + IntelligencePanel + ChatDock | Design | 🟡 | [#168–#171](https://github.com/amo-tech-ai/lumina-studio/pull/168) · [#180](https://github.com/amo-tech-ai/lumina-studio/pull/180) · Phase B [#164](https://github.com/amo-tech-ai/lumina-studio/pull/164) open |
| P1 | **DESIGN-040** | ApprovalCard DC parity | Design | 🟡 | HITL partial shipped |
| P1 | **DESIGN-050** | Command Center DC parity | Design | 🟡 85% | **[IPI-17](https://linear.app/amo100/issue/IPI-17) Done** · [#168–#171](https://github.com/amo-tech-ai/lumina-studio/pull/168) on **main** · polish in [#181](https://github.com/amo-tech-ai/lumina-studio/pull/181) draft |
| P1 | **DESIGN-070** | Route-agent map (assets/matching/preview) | Design | 🟡 | See AGENT-MAP |
| P1 | **DESIGN-071–072** | Live intel data + HITL persist | Design | 🟡 | Sidebar ≠ DC panel |
| P1 | STR-004–006 | Refunds · invoices · portal | Stripe | ⚪ | Post-checkout |
| P2 | IPI-210–217 | Shoot detail actions | Platform | Backlog | After IPI-209 |
| P2 | IPI-151 | Shoot asset DNA gallery | Platform | 🟡 | Shell unblocked · assets pipeline weak |
| P2 | **DESIGN-016–018** | API · AGENT · MEDIA maps | Design | 🟢 stub v0.1 | Extend on route ship |
| P2 | **DESIGN-041–046** | Entity cards + EvidenceBlock | Design | 🟡 | 046 DC ✓ · React port |
| P2 | **DESIGN-051–052** | Brand List + Detail | Design | 🟡 | **PR only [#181](https://github.com/amo-tech-ai/lumina-studio/pull/181) draft** · main partial · [IPI-271](https://linear.app/amo100/issue/IPI-271) · [IPI-272](https://linear.app/amo100/issue/IPI-272) |
| P2 | **DESIGN-055–056** | Shoots List + Wizard | Design | 🟡 | [IPI-273](https://linear.app/amo100/issue/IPI-273) · [IPI-274](https://linear.app/amo100/issue/IPI-274) |
| P2 | **DESIGN-057** | Assets library | Design | ⚪ | [IPI-248](https://linear.app/amo100/issue/IPI-248) · DESIGN-074 blocked |
| P2 | **DESIGN-074a–f** | Cloudinary pipeline | Design | ⚪ | 0 cloudinary_assets rows |
| P3 | **DESIGN-058–059** | Campaigns + Matching | Design | ⚪ | 🔴 no DB tables |
| P3 | **DESIGN-060** | Channel Preview | Design | 🟡 | [IPI-269](https://linear.app/amo100/issue/IPI-269) · IPI-188 baseline |
| P3 | **DESIGN-073** | brand-intelligence error UX | Design | ⚪ | No resumable stream |
| P3 | **DESIGN-075–079** | Per-agent wiring | Design | 🟡 | Mastra registry live |
| P3 | IPI-26 → IPI-31 | Brand intelligence spine | Platform | ⚪ | Firecrawl pipeline |
| P3 | **DESIGN-080–088** | QA + staging smoke | Design | ⚪ | Gate before ship |
| — | DESIGN-001 | Root todo SSOT header | Design | 🟢 | Done |
| — | DESIGN-004 | claude-design-handoff skill v3 | Design | 🟢 | Done |
| — | DESIGN-005 | Plan + handoff sync | Design | 🟡 | Ongoing |
| — | DESIGN-053 | Onboarding | Design | 🟢 | IPI-46 shipped |

**Reconcile rule:** when a DESIGN-* or IPI-* ships, update **this registry** + matching row in [Design track §](#design-track) + [`task-stack-map`](../ai/task-stack-map.md).

## AI stack — active tasks

Stack detail: [`ai/task-stack-map.md`](../ai/task-stack-map.md) v1.1 · skills: [`ai/skill-map.md`](../ai/skill-map.md) · gate: [`ai/audit-checklist.md`](../ai/audit-checklist.md)

| Task | Required stack | Skills | MCP / tools | Verification | Risk |
|------|----------------|--------|-------------|--------------|------|
| **IPI-209** Shoot Detail | Supabase reads/RPC · React · ◐ CopilotKit context | feature-dev, ipix-supabase, fashion-production | Supabase MCP, browser | `cd app && lint && test && build` | 404 blocks DNA + edit chain |
| **IPI-210–217** Shoot actions | Mastra HITL · Supabase RPC · Gemini | mastra, copilotkit, ipix-supabase | Supabase MCP | shoot API tests + manual HITL | Must not break IPI-209 read path |
| **IPI-89** Vite retirement | — (repo hygiene) | ipix, worktrees | — | root + app build | Duplicate runtime confusion |
| **STR-001–003** Stripe | Supabase tables · webhooks · — | ipix-supabase, create-migration | Supabase MCP | verify-rls + payment smoke | No Linear issues yet |
| **IPI-127** prod smoke | Supabase auth · — | ipix, agent-browser | browser | Manual prod login | OPERATOR_AUTH_ENABLED gate |
| **DESIGN-032–033** Intel + chat | **CopilotKit v2** · Mastra · Supabase (071) | copilotkit, frontend-design, mastra | browser | component tests + visual QA | Sidebar ≠ DC IntelligencePanel |
| **DESIGN-071–072** Live HITL | CopilotKit · Mastra · **Supabase** persist | ipix-supabase, mastra | Supabase execute_sql | approve → DB row | RLS on approval writes |
| **DESIGN-074a–f** Cloudinary | Supabase metadata · **Cloudinary** · Gemini DNA edge | cloudinary, ipix-supabase | Supabase MCP | upload E2E + verify-dna | 0 rows in cloudinary_assets today |
| **DESIGN-016–018** Maps | Supabase · Mastra · Cloudinary (docs) | graphify, ipix-supabase, mastra, cloudinary | doc review | Extend rows when routes ship |

Per-stack plans: [copilotkit](../ai/copilotkit-plan.md) · [mastra](../ai/mastra-plan.md) · [gemini](../ai/gemini-plan.md) · [supabase](../ai/supabase-plan.md) · [cloudinary](../cloudinary/cloudinary-plan.md) · [mcp](../ai/mcp-plan.md)

---

## P0 / P1 blockers

### 🔴 P0 — start now

| # | ID | Task | Blocks | Linear / spec | Status |
|---|-----|------|--------|---------------|--------|
| 1 | **PR #181** | Brand List + Detail DC parity — **PR only, not on main** | MVP proof #6 operator UX · IPI-23 epic | [#181](https://github.com/amo-tech-ai/lumina-studio/pull/181) · DESIGN-051–052 | 🟡 draft · Codacy 🔴 · e2e stale · crawl "50 of 0" |
| 2 | **SHOOT-DETAIL-001** | Shoot Detail tab-fill after shell merge | DNA gallery (IPI-151), edit actions (IPI-210–217) | [IPI-209](https://linear.app/amo100/issue/IPI-209) · [spec](./tasks/02-shoot-detail.md) | 🟡 shell merged · 3 live tabs |
| 3 | **PLT-015** | Vite retirement — stop shipping duplicate runtime | Route confusion, `:8080` proxy drift | [IPI-89](https://linear.app/amo100/issue/IPI-89) | 🟡 72% |
| 4 | **STR-001–003** | Stripe checkout + webhooks (deposit, balance, idempotency) | Revenue / booking path | STR-* · [prompt](./tasks/04-stripe-prompt.md) | ⚪ **Linear issues not created** |

> **DESIGN-050 Command Center:** 🟡 **85% on main** — [#168–#171](https://github.com/amo-tech-ai/lumina-studio/pull/168) merged · no longer P0 "start now". Remaining CC polish tracked in [#181](https://github.com/amo-tech-ai/lumina-studio/pull/181) draft.

### 🟡 P1 — next queue

| # | ID | Task | Why | Linear | Status |
|---|-----|------|-----|--------|--------|
| 4 | **OPS-001** | Prod auth smoke test | Go-live confidence | [IPI-127](https://linear.app/amo100/issue/IPI-127) | ⚪ manual |
| 5 | **DESIGN-010→050** | Design handoff vertical slice (tokens → shell → HITL → CC) | Operator UX parity; CC ~85% on main | [Design track §](#design-track) | 🟡 · Brand **PR #181 only** |
| 6 | **DESIGN-070** | Route-agent map (assets · matching · preview) | AGENT-MAP gaps vs handoff/06 | [AGENT-MAP](../design-docs/plan/AGENT-MAP.md) | 🟡 |
| 7 | **STR-004–006** | Refunds · invoices · customer portal | Post-checkout ops | STR-* | ⚪ |

> **Parallel OK:** IPI-189 wizard step-1 specs can run beside Shoot Detail tab-fill. IPI-209 shell merged — tab-fill is next shoot work.

---

## Design ↔ production reconciliation

Claude Design prototype ([`checklist.md`](../../Universal design prompt/checklist.md): **86/100**, A–J ✅) is **ahead** of production on several surfaces. Use this table to avoid stale tracker optimism.

| Domain | Prototype (DC) | Production (`app/`) | Platform tracker | Design task |
|--------|---------------|---------------------|------------------|-------------|
| Command Center | 🟢 95% · 5 states | 🟢 ~85% workspace parity | 🟢 **[IPI-17](https://linear.app/amo100/issue/IPI-17) Done** · [#168–#171](https://github.com/amo-tech-ai/lumina-studio/pull/168) on **main** | DESIGN-050 · [#181](https://github.com/amo-tech-ai/lumina-studio/pull/181) polish draft |
| Brand List / Detail | 🟢 95% | 🟡 main partial · **~80% / ~75% PR #181 only** | P3 85% edge · operator UX partial | DESIGN-051–052 · **not on main** until #181 merges |
| Onboarding | 🟢 90% | 🟢 IPI-46 shipped | P0 spine | DESIGN-053 |
| Shoots List / Wizard | 🟢 95% / 85% | 🟢 list + wizard shipped | P5a 75% | DESIGN-055–056 |
| **Shoot Detail** | 🟢 95% · 9 tabs | 🟡 shell merged · 3 live tabs | **IPI-209 ✅** | DESIGN-054 · tab-fill follow-ups |
| Assets / DNA | 🟢 95% | ⚪ ~20% P7 | DNA-002 blocked on assets | DESIGN-057 · 074a–d |
| Campaigns | 🟢 95% | ⚪ 0% P8 | Not planned in sprint | DESIGN-058 |
| Matching | 🟢 95% | ⚪ 0% P9 | Not planned in sprint | DESIGN-059 |
| Channel Preview | 🟢 95% | 🟡 MI studio (IPI-188) | P5b 45% | DESIGN-060 · 074e |
| IntelligencePanel / HITL | 🟢 in DC library | 🟡 ~70% · [#171](https://github.com/amo-tech-ai/lumina-studio/pull/171) merged | IPI-242 · [#164](https://github.com/amo-tech-ai/lumina-studio/pull/164) Phase B open | DESIGN-032 · 040 · 071–072 |
| Stripe payments | ➖ N/A in DC | ⚪ 0% P6 | STR-* placeholders only | STR-001–008 |

**Reconcile action:** when a DESIGN-* screen ships, bump the matching dashboard row and link the PR. IPI-209 merged → DESIGN-054 🟡 (shell); tab-fill + EvidenceBlock follow IPI-246.

---

## Dashboard

**Legend:** 🟢 done · 🟡 in progress · ⚪ not started · 🔴 blocked/attention · ✅ shipped task

| Phase | Domain | What it is | % | | Next move |
|---|---|---|---|---|---|
| P0 | **Critical-path spine** | Must-finish plumbing everything else sits on | 84% | 🟡 | IPI-89 Vite retirement · IPI-127 prod smoke |
| P1 | **Foundation** (runtime, shell, auth) | App runtime, login, operator shell | 90% | 🟢 | IPI-127 prod smoke (manual) |
| P2 | **Agent platform** (Mastra) | AI engine: memory, workflows, tools | 90% | 🟢 | IPI-134 workflow snapshots · IPI-167 structured output |
| P3 | **Brand intelligence MVP** | Analyze a brand from its website, with approvals | 85% | 🟡 | IPI-26 schema v2 · IPI-24 Firecrawl |
| P4 | **Command center** | Operator home hub with KPIs + AI | 85% | 🟡 | **[IPI-17](https://linear.app/amo100/issue/IPI-17) Done** · [#168–#171](https://github.com/amo-tech-ai/lumina-studio/pull/168) on main · mobile PW flaky |
| P5a | **Shoots** | Plan photo / video shoots with AI | 75% | 🟡 | **IPI-209** shell merged · tab-fill IPI-210–217 next |
| P5b | **Media intelligence** | Right specs per platform + preview before publishing | 45% | 🟡 | IPI-189 MI-03w wizard step-1 specs |
| P6 | **Stripe payments** | Booking, deposits, refunds, invoices | 0% | ⚪ | **Create Linear from STR-001–008** (see P6) |
| P7 | **Assets / DNA** | Score and tag assets, link to products | 20% | ⚪ | DNA-002 agent (IPI-152) |
| P8 | **Campaigns** | AI creative-director campaign flows | 0% | ⚪ | CAMP-001 (IPI-156) |
| P9 | **Matching** | Match brands with partners / talent | 0% | ⚪ | MATCH-001 (IPI-160) |
| P10 | **Platform advanced** (RAG/MCP) | Search past work, external tools, deep tracing | 0% | ⚪ | Post-MVP |

**MVP gate (8 proofs):** 5/5 commerce 🟢 · intelligence proofs 6–8 partial (brand 85% · DNA 35% · product-link 20%) → **~67%** toward 8/8.

---

## Current sprint

**Working on:** [PR #181](https://github.com/amo-tech-ai/lumina-studio/pull/181) Brand List + Detail parity (draft) · Shoot Detail tab-fill · [#164](https://github.com/amo-tech-ai/lumina-studio/pull/164) Intelligence Panel Phase B.

**Infra shipped (Jul 1–2):** [#177](https://github.com/amo-tech-ai/lumina-studio/pull/177) Gemini-first dev · [#178](https://github.com/amo-tech-ai/lumina-studio/pull/178) Suspense audit · [#180](https://github.com/amo-tech-ai/lumina-studio/pull/180) ActiveBrandProvider @ `0479aba`.

### 🔴 Hotfixes

| # | Issue | Fix | Status |
|---|---|---|---|
| H-1 | ~~CI failing — all runs~~ | ~~Move getMastra() inside handler body~~ | 🟢 fixed |

### Feature development (priority order)

| # | Task | What it does | Linear | Effort | Status |
|---|---|---|---|---|---|
| 1 | **Command Center workspace** | Main `/app` dashboard — DC parity, KPIs, OperatorShell | [IPI-17](https://linear.app/amo100/issue/IPI-17) | L | 🟢 **Done on main** · [#168–#171](https://github.com/amo-tech-ai/lumina-studio/pull/168) |
| 1b | **Brand List + Detail parity** | DC workspace on `/app/brand*` | [IPI-271](https://linear.app/amo100/issue/IPI-271) / [IPI-272](https://linear.app/amo100/issue/IPI-272) | L | 🟡 **PR #181 draft only** · not on main |
| 2 | Shoot Detail tab-fill | 9-tab shell follow-ups after IPI-209 merge | [IPI-209](https://linear.app/amo100/issue/IPI-209) | L | 🟡 shell merged · 3 live tabs |
| 3 | Wizard step-1 specs | Show required specs while planning | [IPI-189](https://linear.app/amo100/issue/IPI-189) | M | ⚪ (can parallel) |
| 4 | Shoot asset DNA gallery | Per-photo AI quality flags | [IPI-151](https://linear.app/amo100/issue/IPI-151) | M | 🟡 shell unblocked · assets pipeline weak |
| 5 | Prod auth smoke test | Confirm login works on live site | [IPI-127](https://linear.app/amo100/issue/IPI-127) | S | **Manual — operator login** |

### Attention / tech debt

| Item | Severity | Action |
|---|---|---|
| ~~`brand-approval-workflow.ts` unregistered~~ | ~~🟡 debt~~ | 🟢 **Fixed** — registered as `"brand-approval"` in `getMastra()` (`app/src/mastra/index.ts`) · verified 2026-06-29 |
| Legacy Vite `src/` still ships | 🟡 debt | Finish IPI-89 retirement checklist |
| `/dashboard/*` in old docs | 🟡 drift | Canceled IPI-49–55; enforce `/app/*` in new PRs |
| Design prototype ahead of prod tracker | 🟡 accuracy | Reconcile via [Design ↔ production](#design--production-reconciliation) on each merge |
| **PR #181 merge blockers** | 🔴 | Codacy 🔴 · stale `intelligence-panel-dc-verify.spec.ts` · crawl **"50 of 0 pages"** · `draft_ready` brand needed for AI draft card verify |
| **`IntelligenceApprovalItem.source` WIP** | 🔴 | Uncommitted on main · tsc fails without fix · separate PR or fold into #164/#181 |
| CopilotKit dev / SSR infra | 🟢 | [#177](https://github.com/amo-tech-ai/lumina-studio/pull/177) Gemini-first · [#180](https://github.com/amo-tech-ai/lumina-studio/pull/180) ActiveBrandProvider merged |

---

## Implementation order

Canonical sequence. Hotfixes always precede feature work.

### 🔥 Immediate — Shoot Detail (in order)

These must be implemented in this sequence. Items on the same row can run in parallel.

| Step | Task | Linear | Depends on | Status |
|---|---|---|---|---|
| 1 | SHOOT-DETAIL-001 — Detail page (foundation) | [IPI-209](https://linear.app/amo100/issue/IPI-209) | — | 🟢 **shell merged** PR #150 |
| 2 | EDIT-BASIC — name/brief/channels/budget | [IPI-210](https://linear.app/amo100/issue/IPI-210) | IPI-209 | Backlog |
| 3a | ARCHIVE — soft-archive / unarchive | [IPI-211](https://linear.app/amo100/issue/IPI-211) | IPI-209 | Backlog |
| 3b | DUPLICATE — clone shoot as draft | [IPI-212](https://linear.app/amo100/issue/IPI-212) | IPI-209 | Backlog |
| 3c | EXPORT — CSV download | [IPI-214](https://linear.app/amo100/issue/IPI-214) | IPI-209 | Backlog |
| 4a | EDIT-DELIVERABLES — add/edit/remove deliverables | [IPI-216](https://linear.app/amo100/issue/IPI-216) | IPI-210 | Backlog |
| 4b | EDIT-SHOTS — add/edit/remove shots | [IPI-217](https://linear.app/amo100/issue/IPI-217) | IPI-210 | Backlog |
| 4c | REGENERATE — AI re-draft via Mastra HITL | [IPI-215](https://linear.app/amo100/issue/IPI-215) | IPI-210 | Backlog |
| 5 | APPROVALS — approve shots + deliverables | [IPI-213](https://linear.app/amo100/issue/IPI-213) | IPI-216 + IPI-217 | Backlog |

> **Steps 3a/3b/3c** can be built in parallel (all depend only on IPI-209).
> **Steps 4a/4b/4c** can be built in parallel (all depend only on IPI-210).
> **Step 5** is last — it needs editable deliverables + shots to exist first.

### 🟡 Next after Shoot Detail

| Step | Task | Linear | Depends on | Status |
|---|---|---|---|---|
| 6 | Shoot asset DNA gallery + alerts | [IPI-151](https://linear.app/amo100/issue/IPI-151) | IPI-209 detail page | Todo |
| 7 | Shot type reference library (Cloudinary seed) | [IPI-184](https://linear.app/amo100/issue/IPI-184) | IPI-183 schema ✅ | Backlog |
| 8 | Wizard step-1 specs (MI) | [IPI-189](https://linear.app/amo100/issue/IPI-189) | IPI-187 lookup ✅ | Backlog |
| 9a | Image selection UI | [IPI-191](https://linear.app/amo100/issue/IPI-191) | IPI-188 preview ✅ | Backlog |
| 9b | AI quality checks per image | [IPI-192](https://linear.app/amo100/issue/IPI-192) | IPI-191 | Backlog |
| 9c | Approve / edit / schedule from preview | [IPI-193](https://linear.app/amo100/issue/IPI-193) | IPI-191 | Backlog |
| 9d | Campaign mode | [IPI-194](https://linear.app/amo100/issue/IPI-194) | IPI-191 | Backlog |
| 9e | Send approved images to scheduling | [IPI-195](https://linear.app/amo100/issue/IPI-195) | IPI-193 | Backlog |

### ⚪ Brand intelligence remaining

| Step | Task | Linear | Depends on | Status |
|---|---|---|---|---|
| 10 | Schema v2 | [IPI-26](https://linear.app/amo100/issue/IPI-26) | IPI-46 ✅ | Ready |
| 11 | Firecrawl pipeline | [IPI-24](https://linear.app/amo100/issue/IPI-24) | IPI-26 | Backlog |
| 12 | Gemini prompt v2 | [IPI-25](https://linear.app/amo100/issue/IPI-25) | IPI-24 | Backlog |
| 13 | Progress UX + Realtime | [IPI-31](https://linear.app/amo100/issue/IPI-31) | IPI-24 | Backlog |

### ⚪ Stripe payments — executable backlog (Linear not created)

**Next action:** Run [`tasks/04-stripe-prompt.md`](./tasks/04-stripe-prompt.md) → create **8 Linear issues** → paste IPI numbers below.

| Step | ID | Task | Priority | Scope | Linear | Status |
|------|-----|------|----------|-------|--------|--------|
| 1 | STR-001 | Checkout session + deposit flow | P0 | `POST /api/payments/create-checkout`, `checkout_sessions` | — | ⚪ create issue |
| 2 | STR-002 | Balance + full payment | P0 | `payment_intents`, partial flow | — | ⚪ |
| 3 | STR-003 | Webhooks + idempotency | P0 | `POST /api/payments/webhook`, signature verify | — | ⚪ |
| 4 | STR-004 | Refunds + cancellations | P1 | `POST /api/payments/refund`, `refunds` | — | ⚪ |
| 5 | STR-005 | Invoices + receipts | P1 | `invoices`, PDF | — | ⚪ |
| 6 | STR-006 | Customer portal | P1 | `POST /api/payments/customer-portal` | — | ⚪ |
| 7 | STR-007 | Finance dashboard + reporting | P2 | Admin payment view, export | — | ⚪ |
| 8 | STR-008 | Connect payouts (future) | P3 | `payout_queue` | — | ⚪ |

> Commerce Stripe already proven in Mercur/B2C (`docs/ecommerce/evidence/`). Operator booking deposits are a **separate** `app/` track — do not conflate with `my-marketplace/`.

### ⚪ Later phases

| Phase | Name | Linear range | Status |
|---|---|---|---|
| P7 | Assets / DNA (agent, product-link, compliance) | IPI-152–155 | ⚪ · Cloudinary: DESIGN-074a–f |
| P8 | Campaigns (creative-director flows) | IPI-156–159 | ⚪ · DC prototype 🟢 ahead |
| P9 | Matching engine | IPI-160–163 | ⚪ · DC prototype 🟢 ahead |
| P10 | Advanced platform (RAG · MCP · browser · obs) | IPI-138–145 | ⚪ |

### Architecture maps (DESIGN-016–018)

| Map | Purpose | Owner task | Status |
|-----|---------|------------|--------|
| [API-MAP.md](../design-docs/plan/API-MAP.md) | Screen → Supabase / edge fn / API | DESIGN-016 | 🟢 stub v0.1 |
| [AGENT-MAP.md](../design-docs/plan/AGENT-MAP.md) | Route → agent → tools → durability | DESIGN-017 | 🟢 stub v0.1 |
| [MEDIA-MAP.md](../design-docs/plan/MEDIA-MAP.md) | Cloudinary folders, transforms, publish | DESIGN-018 | 🟢 stub v0.1 |
| DATABASE-MAP | Full schema doc | Deferred — Supabase MCP + migrations SSOT | ➖ post-MVP |

### Production QA checklist (per phase)

| Phase gate | Verify before merge |
|------------|---------------------|
| Any `app/**` PR | `cd app && npm run lint && npm run build && npm test` |
| Supabase / RLS | `infisical run -- npm run supabase:verify-rls` |
| Screen ship | 5 states + mobile breakpoint + Vitest (DESIGN task) |
| HITL / AI | No client AI keys · approve → Supabase write (DESIGN-072) |
| Ship | Bugbot clean · staging smoke (DESIGN-088) · Playwright flows A–D (DESIGN-081) |

Detail: [tasks/design-docs/plan/TASKS.md § Stage 7](../design-docs/plan/TASKS.md)

---

## Design track

Handoff build order for **DESIGN-*** tasks. **Master status:** [Master task registry §](#master-task-registry) · specs: [`TASKS.md`](../design-docs/plan/TASKS.md).

**Implementation detail (Code vs Design columns, evidence, ⭐ DoD):** [`tasks/todo.md`](../todo.md) · [`SCREEN-DOD.md`](../design-docs/design/SCREEN-DOD.md) — update mirror when shipping; keep **this section** for priority/blockers only.

🟢 done · 🟡 partial · ⚪ not started · 🔴 blocked · ⭐ production verified (mirror only)

| Stage | ID | Task | Route / artifact | Status |
|-------|-----|------|------------------|--------|
| 0 | — | Prototypes + handoff 01–12 | DC HTML | 🟢 |
| 0 | DESIGN-001 | Root todo SSOT header | `Universal design prompt/todo.md` | 🟢 |
| 0 | DESIGN-004 | claude-design-handoff skill v3 | skill | 🟢 |
| 0 | DESIGN-090 | Root `design.md` design contract | [`design.md`](../../design.md) | 🟢 |
| 0 | DESIGN-005 | Plan + handoff + design.md sync | `tasks/design-docs/` | 🟡 |
| 1b | DESIGN-016 | API-MAP | [API-MAP.md](../design-docs/plan/API-MAP.md) | 🟢 stub |
| 1b | DESIGN-017 | AGENT-MAP | [AGENT-MAP.md](../design-docs/plan/AGENT-MAP.md) | 🟢 stub |
| 1b | DESIGN-018 | MEDIA-MAP | [MEDIA-MAP.md](../design-docs/plan/MEDIA-MAP.md) | 🟢 stub |
| 1 | DESIGN-010 | Tokens sync | `tokens.css` → `app/` | 🟢 · [#162](https://github.com/amo-tech-ai/lumina-studio/pull/162) |
| 1 | DESIGN-030 | OperatorShell | shell layout | 🟡 · [#168–#171](https://github.com/amo-tech-ai/lumina-studio/pull/168) · [#180](https://github.com/amo-tech-ai/lumina-studio/pull/180) |
| 1 | DESIGN-031 | NavSidebar | nav-sidebar.tsx | 🟡 |
| 1 | DESIGN-032 | IntelligencePanel | intelligence-panel.tsx | 🟡 ~70% · [#171](https://github.com/amo-tech-ai/lumina-studio/pull/171) · [#164](https://github.com/amo-tech-ai/lumina-studio/pull/164) Phase B |
| 1 | DESIGN-033 | PersistentChatDock | ai-chat-dock | 🟡 · [#170](https://github.com/amo-tech-ai/lumina-studio/pull/170) |
| 1 | DESIGN-045 | Mobile shell | mobile/*.tsx | ⚪ |
| 2 | DESIGN-040 | ApprovalCard | approval-card.tsx | 🟡 |
| 2 | DESIGN-041 | BrandCard | brand-card.tsx | ⚪ |
| 2 | DESIGN-042 | ShootCard | shoot-card.tsx | ⚪ |
| 2 | DESIGN-043 | CampaignCard | campaign-card.tsx | ⚪ |
| 2 | DESIGN-044 | AssetCard | asset-card.tsx | ⚪ |
| 2 | DESIGN-046 | EvidenceBlock | evidence-block.tsx | 🟡 DC ✓ |
| 3 | DESIGN-050 | Command Center | `/app` | 🟡 85% · **[IPI-17](https://linear.app/amo100/issue/IPI-17) Done** · [#168–#171](https://github.com/amo-tech-ai/lumina-studio/pull/168) on **main** |
| 3 | DESIGN-052 | Brand List | `/app/brand` | 🟡 **PR #181 only** ~80% · not on main |
| 3 | DESIGN-051 | Brand Detail | `/app/brand/[id]` | 🟡 **PR #181 only** ~75% · not on main · **IPI-271** |
| 3 | DESIGN-053 | Onboarding | `/app/onboarding` | 🟢 |
| 4 | DESIGN-055 | Shoots List | `/app/shoots` | 🟡 · **IPI-273** |
| 4 | DESIGN-056 | Shoot Wizard (6-step prod) | `/app/shoots/new` | 🟡 · **IPI-274** |
| 4 | DESIGN-056b | Wizard 10-step + Review parity | [WIZARD-PARITY](../plan/shoot/WIZARD-PARITY.md) | ⚪ |
| 4 | DESIGN-054 | Shoot Detail | `/app/shoots/[shootId]` | 🟡 shell merged · **IPI-209** ✅ · tab-fill backlog |
| 4 | DESIGN-057 | Assets | `/app/assets` | ⚪ · **IPI-248** |
| 5 | DESIGN-058 | Campaigns | `/app/campaigns` | ⚪ |
| 5 | DESIGN-059 | Matching | `/app/matching` | ⚪ |
| 5 | DESIGN-060 | Channel Preview | `/app/preview` | 🟡 · **IPI-269** |
| 6 | DESIGN-070 | Route-agent map | `route-agent-map.ts` | 🟡 |
| 6 | DESIGN-071 | Live intel data | IntelligencePanel | ⚪ |
| 6 | DESIGN-072 | HITL persist | approve → Supabase | 🟡 |
| 6 | DESIGN-073 | BI error UX | error+retry | ⚪ |
| 6 | DESIGN-074a–f | Cloudinary pipeline | upload → DNA | ⚪ |
| 6 | DESIGN-075–079 | Per-agent wiring | Mastra agents | 🟡 |
| 7 | DESIGN-080–088 | QA + staging | evidence · E2E · smoke | ⚪ |

**First vertical slice:** `010 → 030 → 032 → 033 → 040 → 050 → 071 → 072` (parallel OK with IPI-209 for 054).

---

## Phases

### P0 — Critical-path spine (84% · 16/19 🟢)

| # | Task | Linear | Status |
|---|---|---|---|
| 0 | Vite → Next cutover | [IPI-89](https://linear.app/amo100/issue/IPI-89) | 🟡 72% |
| 1 | BI migration push | [IPI-126](https://linear.app/amo100/issue/IPI-126) | 🟢 |
| 1b | Onboarding orchestration | [IPI-46](https://linear.app/amo100/issue/IPI-46) | 🟢 |
| 2 | OAuth + redirect URLs | [IPI-125](https://linear.app/amo100/issue/IPI-125) | 🟢 |
| 3 | License + prod auth smoke | [IPI-127](https://linear.app/amo100/issue/IPI-127) | ⚪ manual |
| 4 | Operator shell | [IPI-110](https://linear.app/amo100/issue/IPI-110) | 🟢 |
| 5 | `useAgentContext` L1 | [IPI-50](https://linear.app/amo100/issue/IPI-50) | 🟢 |
| 6 | Route → `agentId` map | [IPI-51](https://linear.app/amo100/issue/IPI-51) | 🟢 |
| 7 | `@mastra/pg` + HMR singleton | [IPI-129](https://linear.app/amo100/issue/IPI-129) | 🟢 PR #92 |
| 8 | `_shared/gemini.ts` (edge) | [IPI-47](https://linear.app/amo100/issue/IPI-47) | 🟢 |
| 8b | Model registry | [IPI-107](https://linear.app/amo100/issue/IPI-107) | 🟢 |
| 9 | Workflow snapshots | [IPI-134](https://linear.app/amo100/issue/IPI-134) | ⚪ |
| 10 | Durable agents | [IPI-133](https://linear.app/amo100/issue/IPI-133) | 🟢 |
| 11 | Memory foundation | [IPI-135](https://linear.app/amo100/issue/IPI-135) | 🟢 |
| 12 | Structured output hardening | [IPI-167](https://linear.app/amo100/issue/IPI-167) | 🟢 |
| 13 | URL context on brand edge | [IPI-165](https://linear.app/amo100/issue/IPI-165) | 🟢 |
| 14 | Tool registry → edge tools | [IPI-113](https://linear.app/amo100/issue/IPI-113) | 🟢 |
| 15 | Brand intake workflow | [IPI-132](https://linear.app/amo100/issue/IPI-132) | 🟢 PR #102/#109 |
| 16 | `brand-intelligence` agent | [IPI-130](https://linear.app/amo100/issue/IPI-130) | 🟢 |

### P3 — Brand intelligence MVP (85% 🟡)

| # | Task | Linear | Status |
|---|---|---|---|
| 1 | Schema v2 | [IPI-26](https://linear.app/amo100/issue/IPI-26) | ⚪ ready |
| 2 | Firecrawl pipeline | [IPI-24](https://linear.app/amo100/issue/IPI-24) | ⚪ |
| 3 | Gemini prompt v2 | [IPI-25](https://linear.app/amo100/issue/IPI-25) | ⚪ |
| 4 | Scoring v2 (10 dims) | [IPI-29](https://linear.app/amo100/issue/IPI-29) | 🟢 |
| 5 | Brand Hub v2 tabs | [IPI-30](https://linear.app/amo100/issue/IPI-30) | 🟢 |
| 6 | Progress UX + Realtime | [IPI-31](https://linear.app/amo100/issue/IPI-31) | ⚪ |
| 7 | Mastra brand workflow | [IPI-32](https://linear.app/amo100/issue/IPI-32) | 🟢 PR #102 |
| 8 | Integration tests | [IPI-33](https://linear.app/amo100/issue/IPI-33) | 🟢 |
| 9 | Approval cards (HITL UI) | [IPI-52](https://linear.app/amo100/issue/IPI-52) · [IPI-111](https://linear.app/amo100/issue/IPI-111) | 🟢 PR #109 |
| 10 | Brand intake workflow HITL | [IPI-132](https://linear.app/amo100/issue/IPI-132) | 🟢 PR #102/#109/#112 |

### P5a — Shoots (75% 🟡)

**Foundation (shipped):**

| # | Task | Linear | Status |
|---|---|---|---|
| 1 | Design review | [IPI-84](https://linear.app/amo100/issue/IPI-84) | 🟢 |
| 2 | Shoot schema + RLS | [IPI-183](https://linear.app/amo100/issue/IPI-183) | 🟢 |
| 3 | Shot type reference library | [IPI-184](https://linear.app/amo100/issue/IPI-184) | 🟡 `lookupShotReferences.ts` — needs Cloudinary seed |
| 4 | Shoots dashboard | [IPI-85](https://linear.app/amo100/issue/IPI-85) · [IPI-56](https://linear.app/amo100/issue/IPI-56) | 🟢 `shoots/page.tsx` |
| 5 | Shoot wizard (6-step) | [IPI-87](https://linear.app/amo100/issue/IPI-87) | 🟢 `shoots/new/page.tsx` |
| 6 | Planner shoot tools | [IPI-148](https://linear.app/amo100/issue/IPI-148) | 🟢 |
| 7 | `shoot-wizard` workflow (HITL) | [IPI-149](https://linear.app/amo100/issue/IPI-149) | 🟢 PR #96 |
| 8 | HITL approval cards | [IPI-150](https://linear.app/amo100/issue/IPI-150) | 🟢 PR #98 |

**Shoot detail actions (to build — in order):**

| # | Task | Linear | Depends on | Status |
|---|---|---|---|---|
| 9 | **Detail page** — shell + 3 live tabs | [IPI-209](https://linear.app/amo100/issue/IPI-209) | — | 🟢 **shell merged** |
| 10 | Edit basic (name/brief/channels/budget) | [IPI-210](https://linear.app/amo100/issue/IPI-210) | IPI-209 | Backlog |
| 11a | Archive / unarchive | [IPI-211](https://linear.app/amo100/issue/IPI-211) | IPI-209 | Backlog |
| 11b | Duplicate shoot | [IPI-212](https://linear.app/amo100/issue/IPI-212) | IPI-209 | Backlog |
| 11c | Export CSV | [IPI-214](https://linear.app/amo100/issue/IPI-214) | IPI-209 | Backlog |
| 12a | Edit deliverables (add/edit/remove) | [IPI-216](https://linear.app/amo100/issue/IPI-216) | IPI-210 | Backlog |
| 12b | Edit shots (add/edit/remove) | [IPI-217](https://linear.app/amo100/issue/IPI-217) | IPI-210 | Backlog |
| 12c | AI regenerate via Mastra HITL | [IPI-215](https://linear.app/amo100/issue/IPI-215) | IPI-210 | Backlog |
| 13 | Approvals (shots + deliverables → advance to active) | [IPI-213](https://linear.app/amo100/issue/IPI-213) | IPI-216 + IPI-217 | Backlog |
| 14 | DNA gallery + alerts | [IPI-151](https://linear.app/amo100/issue/IPI-151) | IPI-209 | 🟡 shell unblocked |

### P5b — Media intelligence (45% 🟡)

| # | Task | Linear | Status |
|---|---|---|---|
| 1 | Spec tables + KB seed | [IPI-185](https://linear.app/amo100/issue/IPI-185) MI-01 | 🟢 PR #104/#105 |
| 2 | `migration-reviewer` pass | [IPI-186](https://linear.app/amo100/issue/IPI-186) MI-01a | 🟢 |
| 3 | Device/Channel preview studio | [IPI-188](https://linear.app/amo100/issue/IPI-188) MI-03 | 🟢 PR #108 |
| 4 | `lookupChannelSpecs` tool | [IPI-187](https://linear.app/amo100/issue/IPI-187) MI-02 | 🟢 PR #111 |
| 5 | Wizard step-1 specs | [IPI-189](https://linear.app/amo100/issue/IPI-189) MI-03w | ⚪ **next** |
| 6 | Lookup test | [IPI-190](https://linear.app/amo100/issue/IPI-190) MI-03t | 🟢 PR #111 |
| 7 | Image selection UI | [IPI-191](https://linear.app/amo100/issue/IPI-191) MI-03a | ⚪ |
| 8 | AI quality checks per image | [IPI-192](https://linear.app/amo100/issue/IPI-192) MI-03b | ⚪ |
| 9 | Approve / edit / schedule | [IPI-193](https://linear.app/amo100/issue/IPI-193) MI-03c | ⚪ |
| 10 | Campaign mode | [IPI-194](https://linear.app/amo100/issue/IPI-194) MI-03d | ⚪ |
| 11 | Send approved images to scheduling | [IPI-195](https://linear.app/amo100/issue/IPI-195) MI-03e | ⚪ |
| 12 | Platform research | [IPI-196](https://linear.app/amo100/issue/IPI-196) | ⚪ |

### P6 — Stripe payments (0% ⚪)

Tasks not yet in Linear. Spec prompt: `plan/tasks/04-stripe-prompt.md`.

| ID | Task | Priority | Covers |
|---|---|---|---|
| STR-001 | Checkout session + deposit | P0 | `POST /api/payments/create-checkout`, checkout_sessions table |
| STR-002 | Full + balance payments | P0 | payment_intents, partial payment flow |
| STR-003 | Webhooks + idempotency | P0 | `POST /api/payments/webhook`, retry-safe, signature verify |
| STR-004 | Refunds + cancellations | P1 | `POST /api/payments/refund`, refunds table |
| STR-005 | Invoices + receipts | P1 | invoices table, PDF generation |
| STR-006 | Customer portal | P1 | `POST /api/payments/customer-portal` |
| STR-007 | Finance dashboard + reporting | P2 | Admin payment view, export |
| STR-008 | Connect payouts | P3 | payout_queue, future phase |

> **To unblock:** generate tasks from `04-stripe-prompt.md` → create in Linear → add IPI numbers here.

### Later phases (not started)

| Phase | Name | Linear | Detail |
|---|---|---|---|
| P7 | Assets / DNA | IPI-152–155 | DNA-002 agent, product-link |
| P8 | Campaigns | IPI-156–159 | CAMP-001–004 |
| P9 | Matching engine | IPI-160–163 | MATCH-001–004 |
| P10 | Advanced platform (RAG · MCP · browser · obs) | IPI-138–145 | AIOR-023–026 |

---

## Reference

### Plan & PRD index (`tasks/plan/`)

| Doc | Purpose |
|---|---|
| **`todo.md`** (this file) | **Master execution tracker** — IPI + STR + DESIGN |
| [`ai/README.md`](../ai/README.md) | AI stack index + scores |
| [`17-brand-intelligence-plan.md`](./17-brand-intelligence-plan.md) | Brand Intelligence PRD |
| [`19-brand-lifecycle.md`](./19-brand-lifecycle.md) | HITL lifecycle SSOT |
| [`12-mastra-plan.md`](./12-mastra-plan.md) · [`13-mastra-plan.md`](./13-mastra-plan.md) | Mastra audits + master catalog |
| [`gemeni-plans.md`](./gemeni-plans.md) | Gemini capability matrix |
| [`07-copilot-plan.md`](./07-copilot-plan.md) | CopilotKit L1–L5 architecture |
| [`02-ai-native-dashboards-plan.md`](./02-ai-native-dashboards-plan.md) | Dashboard / agent UX |
| [`supabase-plan.md`](./supabase-plan.md) | DB audit + DB-* backlog |
| [`media/todo.md`](./media/todo.md) · [`media/tasks-media.md`](./media/tasks-media.md) | Media intelligence detail |
| [`tasks/03-shoot-detail-actions.md`](./tasks/03-shoot-detail-actions.md) | Shoot detail action specs (IPI-209–217) |
| [`tasks/04-stripe-prompt.md`](./tasks/04-stripe-prompt.md) | Stripe task generation prompt |
| [`ai/audit-plans.md`](../ai/audit-plans.md) | Plan forensic audit (76/100) v2.0 |
| [`ai/audit-checklist.md`](../ai/audit-checklist.md) | Sprint gate checklist |
| [`ai/current-app-audit.md`](../ai/current-app-audit.md) | App setup audit (74/100) |
| [`ai/supabase-live-audit.md`](../ai/supabase-live-audit.md) | Live Supabase MCP audit (81/100) |
| [`ai/task-stack-map.md`](../ai/task-stack-map.md) | Task → stack matrix |
| [`ai/skill-map.md`](../ai/skill-map.md) | Task → skill → verify |
| [`../todo.md`](../todo.md) | Design build-order **view** (mirror of Design track §) |
| [`../design-docs/plan/TASKS.md`](../design-docs/plan/TASKS.md) | DESIGN-* specs + dependencies |
| [`../design-docs/plan/API-MAP.md`](../design-docs/plan/API-MAP.md) | API map stub (DESIGN-016) |
| [`../design-docs/plan/AGENT-MAP.md`](../design-docs/plan/AGENT-MAP.md) | Agent map stub (DESIGN-017) |
| [`../design-docs/plan/MEDIA-MAP.md`](../design-docs/plan/MEDIA-MAP.md) | Media map stub (DESIGN-018) |
| [`17-brand-intelligence-plan.md`](./17-brand-intelligence-plan.md) | Brand Intelligence PRD |
| [`../../Universal design prompt/checklist.md`](../../Universal design prompt/checklist.md) | Prototype audit 86/100 (A–J ✅) |

### Linear ID rule

`docs/linear/issues/IPI-NN-*.md` **filename number ≠ iPix1 issue number**. Always use **Spec ID** (AIOR-*, DASH-*, SHOOT-*, MI-*) and the canonical mapping in [`../../docs/archive/todo-backup-20260626.md`](../../docs/archive/todo-backup-20260626.md#id-collision-warning). Never invent IPI numbers.

### Canceled / superseded (do not reopen)

| Linear | Reason |
|---|---|
| [IPI-7](https://linear.app/amo100/issue/IPI-7) · [IPI-4](https://linear.app/amo100/issue/IPI-4) | Vite proxy / standalone `:4111` — superseded |
| [IPI-49](https://linear.app/amo100/issue/IPI-49)–[IPI-55](https://linear.app/amo100/issue/IPI-55) | Legacy `/dashboard` DASH placeholders |
| [IPI-76](https://linear.app/amo100/issue/IPI-76) AI-012 | Superseded by AIOR-002 panel |
| [IPI-88](https://linear.app/amo100/issue/IPI-88) SHOOT-UX-005 | Split into UX-002–004 |
| [IPI-115](https://linear.app/amo100/issue/IPI-115) | Legacy shoot-planner-workflow — superseded by IPI-149 |

### Linear sync

After merge: ⬜→🟢 here · set Linear **Done** (`scripts/linear-set-issue-state.mjs`) · bump `lastUpdated`. Full sync commands: [`../../docs/archive/todo-backup-20260626.md`](../../docs/archive/todo-backup-20260626.md#linear-sync-workflow).

**Last verified:** 2026-07-02 · main `0479aba` · mirror [`tasks/todo.md`](../todo.md) · changelog [`tasks/changelog.md`](../changelog.md).
