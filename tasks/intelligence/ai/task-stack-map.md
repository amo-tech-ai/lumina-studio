---
title: Task Stack Map
version: "1.1"
lastUpdated: "2026-06-29"
verifiedBy: task-verifier probes + copilotkit/mastra/ipix-supabase/gemini skills
accuracy: "91/100"
---

# Task Stack Map

Maps platform + design tasks → required stack layers.  
**Verified:** 2026-06-29 against `app/src/**`, Supabase MCP, `.claude/skills/*`.

## Legend

| Symbol | Stack column | Status column |
|--------|--------------|---------------|
| ✅ | Required | — |
| ◐ | Partial / later phase | 🟡 In progress |
| — | Not needed | 🟢 Done |
| | | ⚪ Not started |
| | | 🔴 Blocked |

**Skills:** `copilotkit` · `mastra` · `ipix-supabase` · `gemini` · `cloudinary` · `ipix-task-lifecycle` · `feature-dev` · `frontend-design` · `claude-design-handoff` · `fashion-production` · `agent-browser` · `graphify`

Full stack plans: [README.md](./README.md) · Gate: [02-tasks-audit.md](../../audit/02-tasks-audit.md)

---

## P0 platform tasks

| Task | CopilotKit | Mastra | Supabase | Gemini | Cloudinary | Skills | MCP | Status |
|------|:---:|:---:|:---:|:---:|:---:|:---|:---|:------:|
| **IPI-209** Shoot Detail | ◐ | ◐ | ✅ | — | ◐ | feature-dev, ipix-supabase, fashion-production | Supabase, browser | ⚪ |
| **IPI-210–217** Shoot actions | ◐ | ✅ | ✅ | ✅ | — | mastra, copilotkit, ipix-supabase | Supabase | ⚪ |
| **IPI-151** DNA gallery | ◐ | ✅ | ✅ | ✅ | ✅ | gemini, cloudinary, ipix-supabase | Supabase | ⚪ 🔴blocks:209 |
| **IPI-189** Wizard step-1 specs | ◐ | ✅ | ✅ | — | — | mastra, fashion-production | — | ⚪ |
| **IPI-89** Vite retirement | — | — | — | — | — | ipix, worktrees | — | 🟡 |
| **STR-001–003** Stripe | — | — | ✅ | — | — | ipix-supabase, create-migration | Supabase | ⚪ |
| **IPI-127** Prod auth smoke | ◐ | — | ✅ | — | — | ipix, agent-browser | browser | ⚪ |
| **IPI-24** Firecrawl pipeline | — | ◐ | ✅ | ✅ | — | ipix-supabase, firecrawl | Supabase, Firecrawl | ⚪ |

---

## Design handoff — foundation

| Task | CopilotKit | Mastra | Supabase | Gemini | Cloudinary | Skills | MCP | Status |
|------|:---:|:---:|:---:|:---:|:---:|:---|:---|:------:|
| **DESIGN-004** skill v3 | — | — | — | — | — | claude-design-handoff | — | 🟢 |
| **DESIGN-010** tokens sync | — | — | — | — | — | frontend-design, claude-design-handoff | — | ⚪ |
| **DESIGN-016** API-MAP | — | ◐ | ✅ | ◐ | ◐ | ipix-supabase, graphify | Supabase | 🟢 stub |
| **DESIGN-017** AGENT-MAP | ✅ | ✅ | ◐ | ✅ | — | copilotkit, mastra, gemini | Mastra, Gemini docs | 🟢 stub |
| **DESIGN-018** MEDIA-MAP | — | — | ◐ | — | ✅ | cloudinary, ipix-supabase | Supabase | 🟢 stub |
| **DESIGN-030–031** shell | ◐ | — | — | — | — | frontend-design, copilotkit | browser | 🟡 |
| **DESIGN-032** IntelligencePanel | ✅ | ◐ | ✅ | — | — | copilotkit, frontend-design | browser | ⚪ |
| **DESIGN-033** ChatDock | ✅ | ✅ | — | — | — | copilotkit, mastra | — | ⚪ |
| **DESIGN-040** ApprovalCard | ◐ | ✅ | ✅ | — | — | frontend-design, mastra | — | 🟡 |
| **DESIGN-045** mobile shell | ◐ | — | — | — | — | frontend-design | browser | ⚪ |

> **DESIGN-030–031 🟡:** OperatorShell + NavSidebar shipped (IPI-110); DC parity + mobile gaps remain.

---

## Design handoff — screens

| Task | CopilotKit | Mastra | Supabase | Gemini | Cloudinary | Skills | MCP | Status |
|------|:---:|:---:|:---:|:---:|:---:|:---|:---|:------:|
| **DESIGN-050** Command Center | ✅ | ✅ | ✅ | ◐ | — | copilotkit, mastra | Supabase | 🟡 |
| **DESIGN-051–052** Brand | ✅ | ✅ | ✅ | ✅ | ◐ | ipix-supabase, gemini | Supabase, Firecrawl | 🟡 |
| **DESIGN-053** Onboarding | ◐ | ✅ | ✅ | ✅ | — | ipix-task-lifecycle, mastra | Supabase | 🟢 |
| **DESIGN-054** Shoot Detail | ◐ | ✅ | ✅ | ◐ | ◐ | feature-dev, fashion-production | Supabase | ⚪ ↔ IPI-209 |
| **DESIGN-055–056** Shoots | ✅ | ✅ | ✅ | ✅ | — | mastra, fashion-production | Supabase | 🟡 |
| **DESIGN-057** Assets | ◐ | ✅ | ✅ | ✅ | ✅ | cloudinary, gemini | Supabase | ⚪ |
| **DESIGN-058** Campaigns | ✅ | ✅ | ✅ | ✅ | ◐ | mastra, feature-dev | Supabase | ⚪ 🔴no DB table |
| **DESIGN-059** Matching | ✅ | ✅ | ✅ | ✅ | — | mastra | Supabase | ⚪ 🔴no DB table |
| **DESIGN-060** Channel Preview | ◐ | ✅ | ✅ | ◐ | ✅ | cloudinary, frontend-design | Supabase | 🟡 |

> **DESIGN-050 🟡:** Route exists; KPI cards placeholder — not DC Command Center.  
> **DESIGN-060 🟡:** `preview/page.tsx` + MI studio partial (IPI-188).

---

## AI platform & media

| Task | CopilotKit | Mastra | Supabase | Gemini | Cloudinary | Skills | MCP | Status |
|------|:---:|:---:|:---:|:---:|:---:|:---|:---|:------:|
| **DESIGN-070** route-agent map | ✅ | ✅ | — | — | — | copilotkit, mastra | — | 🟡 |
| **DESIGN-071** live intel data | ✅ | ◐ | ✅ | — | — | ipix-supabase, copilotkit | Supabase | ⚪ |
| **DESIGN-072** HITL persist | ✅ | ✅ | ✅ | — | — | ipix-supabase, mastra | Supabase | 🟡 |
| **DESIGN-073** BI error UX | ◐ | ✅ | ✅ | ✅ | — | gemini, ipix-supabase | Supabase | ⚪ |
| **DESIGN-074a–f** Cloudinary | — | ◐ | ✅ | ✅ | ✅ | cloudinary, ipix-supabase | Supabase | ⚪ |
| **DESIGN-075–079** per-agent | ✅ | ✅ | ✅ | ✅ | ◐ | mastra, gemini, copilotkit | Mastra, Gemini | 🟡 |

> **DESIGN-070 🟡 — verified gap:** `route-agent-map.ts` still maps `/app/assets` + `/app/matching` → `production-planner`; `/app/preview` falls through to default. Target: `visual-identity` (assets, preview), `social-discovery` (matching) per mastra skill.  
> **DESIGN-074:** Primary pipeline (not IPI-184 alone — IPI-184 = shot reference seed only).  
> **DESIGN-072 🟡:** Brand + shoot wizard HITL cards shipped; IntelligencePanel persist incomplete.

---

## QA & ship

| Task | CopilotKit | Mastra | Supabase | Gemini | Cloudinary | Skills | MCP | Status |
|------|:---:|:---:|:---:|:---:|:---:|:---|:---|:------:|
| **DESIGN-080** screenshots | — | — | — | — | — | claude-design-handoff | — | ⚪ |
| **DESIGN-081** Playwright E2E | ✅ | ◐ | ✅ | — | — | agent-browser, gen-test | browser | ⚪ |
| **DESIGN-082** visual QA | — | — | — | — | — | claude-design-handoff | browser | ⚪ |
| **DESIGN-083** CI gate | ◐ | ✅ | ✅ | — | — | ipix-task-lifecycle | — | 🟡 |
| **DESIGN-084** component Vitest | — | — | — | — | — | gen-test | — | ⚪ |
| **DESIGN-085** HITL integration | ✅ | ✅ | ✅ | — | — | ipix-supabase, mastra | Supabase | ⚪ |
| **DESIGN-086** a11y | ◐ | — | — | — | — | accessibility | browser | ⚪ |
| **DESIGN-087** visual regression | — | — | — | — | — | claude-design-handoff | browser | ⚪ |
| **DESIGN-088** staging smoke | ✅ | ✅ | ✅ | — | — | ipix-task-lifecycle | browser, Supabase | ⚪ |

---

## Stack layer summary

| Layer | Dot | Readiness | Primary blockers |
|-------|:---:|----------:|------------------|
| CopilotKit v2 | 🟢 | 88% | DESIGN-032 IntelligencePanel; license optional |
| Mastra | 🟢 | 86% | DESIGN-070 route gaps; in-app MCP empty |
| Supabase | 🟡 | 78% | No campaigns table; Stripe schema; 0 cloudinary_assets |
| Gemini | 🟢 | 85% | Mastra `gemini-3.1-flash-lite`; edge `gemini-3.5-flash` — both valid |
| Cloudinary | 🔴 | 35% | DESIGN-074a–f; not IPI-184 alone |
| MCP (dev) | 🟡 | 70% | Supabase + Firecrawl ready; in-app unused |

**Stack readiness: 68/100** · **Map accuracy: 91/100** (v1.0 was ~82% — missing tasks + route-agent gap)

---

## Corrections log (v1.0 → v1.1)

| Issue | Fix |
|-------|-----|
| Missing IPI-151, IPI-189, IPI-24 | Added P0 rows |
| Cloudinary tied only to IPI-184 in audit-plans | Primary = DESIGN-074a–f |
| DESIGN-070 marked partial without detail | Documented route-agent probe failures |
| QA section incomplete | Added DESIGN-080, 082, 084–087 |
| DESIGN-030 shell marked ⚪ | 🟡 — shell shipped, DC parity open |
| DESIGN-050 marked ⚪ | 🟡 — scaffold exists |
| Gemini skill vs models.ts drift | Noted both surfaces in summary |
