---
title: "iPix Documentation Index"
version: "1.0"
lastUpdated: "2026-06-14"
status: "Active"
purpose: "Master navigation for /docs — hierarchy, authority rules, and AI-native dashboard compliance"
---

# iPix Documentation Index

**Scope:** Everything under [`/docs`](./) (2,100+ markdown files).  
**Repo index:** [`../index.md`](../index.md) — code, skills, scripts, and cross-repo navigation.  
**Product truth:** [`../prd.md`](../prd.md) · [`../mvp.md`](../mvp.md) · [`../todo.md`](../todo.md)

---

## Authority & conflict rules

| Question | Wins |
|----------|------|
| What ships in MVP? | [`../mvp.md`](../mvp.md) |
| Build order | [`../todo.md`](../todo.md) |
| Per-issue acceptance | [`linear/issues/IPI-*.md`](./linear/issues/) |
| Operator Hub + AI dashboards | [`intelligence/ai/02-ai-native-dashboards-plan.md`](./intelligence/ai/02-ai-native-dashboards-plan.md) |
| CopilotKit + Mastra architecture | [`intelligence/01-copilotkit-mastra-implementation-plan.md`](./intelligence/01-copilotkit-mastra-implementation-plan.md) |
| Wireframe UX | [`tasks/wireframes-ipix/new/`](./tasks/wireframes-ipix/new/) |
| FashionOS legacy dashboards | **Out of iPix MVP** — see §Legacy below |

When docs disagree with **code**, code wins until docs are updated. Flag stale docs in PR notes under [`pr/`](./pr/).

---

## Document hierarchy

```text
prd.md / mvp.md / todo.md          (repo root — product + sequence)
  └─ docs/linear/issues/IPI-*.md   (executable specs, 95 files)
  └─ docs/intelligence/              (AI orchestration + dashboard AI pattern)
       └─ ai/02-ai-native-dashboards-plan.md   ← dashboard source of truth
  └─ docs/tasks/wireframes-ipix/     (screen specs)
  └─ docs/plan/                      (historical FashionOS + foundation — partial legacy)
```

---

## Quick navigation

| I want to… | Start here |
|------------|------------|
| Pick the next Linear task | [`linear/issues/README.md`](./linear/issues/README.md) |
| Wire CopilotKit + Mastra | [`intelligence/README.md`](./intelligence/README.md) |
| Upgrade a dashboard with AI | [`intelligence/ai/02-ai-native-dashboards-plan.md`](./intelligence/ai/02-ai-native-dashboards-plan.md) |
| Gemini edge functions | [`gemeni/gemeni-plan.md`](./gemeni/gemeni-plan.md) |
| Commerce / Mercur boundary | [`ipix-commerce-prd.md`](./ipix-commerce-prd.md) |
| Cloudinary media pipeline | [`cloudinary/cloudinary-plan.md`](./cloudinary/cloudinary-plan.md) |
| Shoot system & DNA | [`shoot/00-ai-model-reference.md`](./shoot/00-ai-model-reference.md) (see [`shoot/`](./shoot/)) |
| Supabase secrets | [`supabase/secrets-inventory.md`](./supabase/secrets-inventory.md) |
| Infisical layout | [`infisical/folder-structure.md`](./infisical/folder-structure.md) |

---

## Directory map

| Directory | ~Files | Role | Index / entry |
|-----------|--------|------|----------------|
| [`linear/`](./linear/) | 99 | Workspace, roadmaps, MCP | [`linear-plan.md`](./linear/linear-plan.md) |
| [`linear/issues/`](./linear/issues/) | 95 | **IPI issue specs** (COM, PLT, AI, UI, DASH, AIOR, CLD, …) | [`README.md`](./linear/issues/README.md) |
| [`intelligence/`](./intelligence/) | 14 | AI layer, CopilotKit, Mastra, dashboards | [`README.md`](./intelligence/README.md) |
| [`tasks/`](./tasks/) | 131 | Master plans, wireframes, schema notes | [`tasks/index-tasks.md`](./tasks/index-tasks.md) |
| [`tasks/wireframes-ipix/new/`](./tasks/wireframes-ipix/new/) | 17+ | **iPix operator wireframes** | [`00-index.md`](./tasks/wireframes-ipix/new/00-index.md) |
| [`shoot/`](./shoot/) | 33 | Shot lists, DNA, wizard, Postiz | numbered `00–` docs |
| [`wireframes/`](./wireframes/) | 22 | Earlier wireframe drafts | [`wireframes/00-index.md`](./wireframes/00-index.md) |
| [`plan/`](./plan/) | 564 | FashionOS-era plans, foundation, prompts | [`plan/index-plan.md`](./plan/index-plan.md) |
| [`lean/`](./lean/) | 170 | Lean MVP task breakdown | — |
| [`website/`](./website/) | 35 | Marketing site notes | — |
| [`ipix/`](./ipix/) | 14 | Repo reviews, PRD iterations, canvas | — |
| [`cloudinary/`](./cloudinary/) | 5 | CLD-001→012 strategy | [`cloudinary-plan.md`](./cloudinary/cloudinary-plan.md) |
| [`gemeni/`](./gemeni/) | 1 | AI-009→018 Gemini roadmap | [`gemeni-plan.md`](./gemeni/gemeni-plan.md) |
| [`infisical/`](./infisical/) | 2 | Secrets migration | [`folder-structure.md`](./infisical/folder-structure.md) |
| [`supabase/`](./supabase/) | 1 | Secret inventory | [`secrets-inventory.md`](./supabase/secrets-inventory.md) |
| [`archive/`](./archive/) | 10 | Superseded — do not implement from here | — |
| [`pr/`](./pr/) | 3 | PR merge notes | — |
| [`plans/`](./plans/) | 3 | One-off integration plans | — |
| Root [`docs/*.md`](./) | 5 | Commerce PRD, Linear setup, scratch notes | this file |

**Ecommerce:** If present, see [`../index.md`](../index.md) § Commerce (`docs/ecommerce/`).

---

## Platform & execution

| Doc | Description |
|-----|-------------|
| [`linear-setup-strategy.md`](./linear-setup-strategy.md) | Team IPI, labels, initiatives |
| [`linear/linear-plan.md`](./linear/linear-plan.md) | Linear workspace structure |
| [`linear/supabase-roadmap.md`](./linear/supabase-roadmap.md) | Supabase audit + MVP priority |
| [`linear/mcp-setup.md`](./linear/mcp-setup.md) | Linear MCP |
| [`ipix-commerce-prd.md`](./ipix-commerce-prd.md) | Mercur ownership boundary |
| [`ipix-commerce-implementation-plan.md`](./ipix-commerce-implementation-plan.md) | Commerce engineering phases |

---

## Intelligence & AI (`docs/intelligence/`)

| Doc | Description |
|-----|-------------|
| [`intelligence/README.md`](./intelligence/README.md) | Intelligence folder index |
| [`intelligence/01-copilotkit-mastra-implementation-plan.md`](./intelligence/01-copilotkit-mastra-implementation-plan.md) | **Canonical** orchestration architecture |
| [`intelligence/ai/02-ai-native-dashboards-plan.md`](./intelligence/ai/02-ai-native-dashboards-plan.md) | **Canonical** AI-native dashboard pattern (L1–L5) |
| [`intelligence/ai/copilotkit-operator-ui.md`](./intelligence/ai/copilotkit-operator-ui.md) | CopilotKit v2 + 3-panel wiring |
| [`intelligence/ai/mastra-agent-catalog.md`](./intelligence/ai/mastra-agent-catalog.md) | Agent specs |
| [`intelligence/ai/mastra-workflows.md`](./intelligence/ai/mastra-workflows.md) | Workflows + HITL |
| [`intelligence/ai/mastra-copilotkit-plan.md`](./intelligence/ai/mastra-copilotkit-plan.md) | Feature audit, phases |
| [`intelligence/ai/mastra-linear-roadmap.md`](./intelligence/ai/mastra-linear-roadmap.md) | AIOR-001→010 (IPI-81–90) |
| [`intelligence/copilotkit-mastra-plan.md`](./intelligence/copilotkit-mastra-plan.md) | Short master index |
| [`intelligence/prompt.md`](./intelligence/prompt.md) | Research / meta prompt |
| [`gemeni/gemeni-plan.md`](./gemeni/gemeni-plan.md) | Gemini edge roadmap |

---

## Linear issue domains (`docs/linear/issues/`)

| Prefix | IPI range | Domain |
|--------|-----------|--------|
| COM-* | 5–13, 42–46 | Commerce / Mercur |
| PLT-* | 14–17, 29–35 | Platform / env / auth |
| AI-* | 18–41, 71–80 | Gemini edge functions |
| DNA-* | 19–21 | Brand DNA |
| UI-* | 22–25 | Operator shell (UI-001→004) |
| FRZ-* | 26–28 | Frozen / deferred |
| ANA-* | 47–51 | Analytics |
| SEC-* | 52–55 | Security |
| OPS-* | 56–58 | Operations |
| CLD-* | 59–70 | Cloudinary |
| AIOR-* | 81–90 | Mastra + CopilotKit runtime |
| DASH-* | 91–102 | AI-native dashboard implementation |

Sync: [`linear/issues/README.md`](./linear/issues/README.md#sync-workflow)

---

## AI-native dashboard compliance

**Source of truth:** [`intelligence/ai/02-ai-native-dashboards-plan.md`](./intelligence/ai/02-ai-native-dashboards-plan.md)

Every operator dashboard doc (wireframes, Linear UI/DASH issues, plan/*.md) should follow the **five-layer pattern**:

| Layer | Mechanism | Panel |
|-------|-----------|-------|
| L1 | `useAgentContext` + `useCopilotReadable` | Context → agent |
| L2 | Proactive alerts, gaps, next-step queue | **Right** |
| L3 | Route-default `agentId` + `CopilotChat` | **Right** |
| L4 | `useCoAgent` / `useRenderTool` (when artifact *is* the work) | Center or right |
| L5 | HITL before any Supabase write | Inline + chat approval |

**Required sections** for new dashboard specs (copy from §11 **Dashboard Doc Compliance Template** in `02-ai-native-dashboards-plan.md`):

1. Route + wireframe link + Linear task (`IPI-XXX · TASK-ID — Name`)  
2. Panel contract (center human-first · right intelligence)  
3. AI-Native Dashboard Compliance table (L1–L5)  
4. HITL surface for writes  
5. Verification commands (`npm run build`, `npm run test`)

### Canonical MVP routes (UI-001)

| Route | Dashboard | Linear |
|-------|-----------|--------|
| `/dashboard` | Command Center | IPI-22 · UI-001 — Operator Hub Shell |
| `/dashboard/brand` | Brand hub | IPI-18 · AI-001 |
| `/dashboard/brand/intake` | Brand intake | IPI-23 · UI-002 |
| `/dashboard/assets` | Assets + DNA | IPI-24 · UI-003 |
| `/dashboard/assets/:assetId` | Asset detail | UI-003 |
| `/dashboard/products` | Products | — |
| `/dashboard/products/links` | Product links | IPI-25 · UI-004 |
| `/dashboard/analytics` | Analytics | IPI-97 · DASH-011 |
| `/dashboard/settings` | Settings | TBD |

Legacy: `/dashboard/brands/:id/*`, `/dashboard/media`, `/dashboard/performance`, `/dashboard/intelligence/:id` — see `02` §2 alias table.

**As-built vs target:** PR #3 shipped platform + `brand-intelligence` (`gemini-2.5-flash`). UI-001 shell has **no** CopilotKit/Mastra yet. Target: Gemini 3.5, Mastra, CopilotKit, HITL (see `02` §12).

**DASH-001→012 mapping** (Linear ↔ plan):

| Linear | Task | Dashboard | Plan § |
|--------|------|-----------|--------|
| DASH-001 | OperatorCopilotPanel placeholder | All routes | §5, §7 Phase A |
| DASH-002 | D0 KPIs static | D0 | §4 D0, §8 #4 |
| DASH-003 | D2 Intelligence Report view | D2 | §4 D2, §8 #6 |
| DASH-004 | `useAgentContext` global | All | §3 L1, §8 #10 |
| DASH-005 | Route `agentId` map | All | §3 L3, §8 #11 |
| DASH-006 | D1/D2 approval + timeline | D1, D2 | §4 D1–D2, §8 #12 |
| DASH-007 | D3 `explainDnaScore` UI | D3 | §4 D3, §8 #13 |
| DASH-008 | D4 link approval cards | D4 | §4 D4, §8 #14 |
| DASH-009 | D0 `useCopilotReadable` KPIs | D0 | §4 D0, §8 #15 |
| DASH-010 | D5 Shoots grid | D5 | §4 D5, §8 #16 |
| DASH-011 | D10 analytics scaffold | D10 | §4 D10, §8 #17 |
| DASH-012 | D10 generative charts HITL | D10 | §4 D10, §8 #18 |

**Docs that must align** (update when `02` changes):

- [`intelligence/ai/copilotkit-operator-ui.md`](./intelligence/ai/copilotkit-operator-ui.md) — routes, agent defaults  
- [`tasks/wireframes-ipix/new/09-chat-panel.md`](./tasks/wireframes-ipix/new/09-chat-panel.md) — right panel structure  
- [`linear/issues/IPI-22`–`IPI-25`](./linear/issues/) — UI-001→004 shell  
- [`linear/issues/IPI-91`–`IPI-102`](./linear/issues/) — DASH tasks  
- [`.cursor/skills/dashboards/SKILL.md`](../.cursor/skills/dashboards/SKILL.md) — 3-panel implementation  

---

## Legacy & out of MVP scope

Do **not** implement iPix MVP from these without explicit revival in `prd.md`:

| Path | Why |
|------|-----|
| [`plan/01-foundation/02-core-dashboards.md`](./plan/01-foundation/02-core-dashboards.md) | FashionOS Events/CRM/Sponsors |
| [`plan/01-foundation/06-brand-dashboards.md`](./plan/01-foundation/06-brand-dashboards.md) | FashionOS framing; superseded by `02-ai-native-dashboards-plan.md` for iPix |
| [`archive/`](./archive/) | Superseded schemas and PRDs |
| [`tasks/events/`](./tasks/events/) | Event module (deferred) |

---

## Known stale doc flags (2026-06-14)

Most intelligence + skill drift **patched** 2026-06-14. Still aspirational until code lands:

| Doc / skill | Remaining gap |
|-------------|---------------|
| `gemeni/gemeni-plan.md` | Targets `gemini-3.5-flash` + `_shared/gemini.ts` (AI-009/018) — edge uses **2.5-flash** today |
| Linear `IPI-71`, `IPI-81` | Target model IDs in acceptance — not as-built |
| `audit-asset-dna`, `match-product-links` | Not shipped |

**As-built edge functions:** `health`, `edge-test`, `brand-intelligence` · model **`gemini-2.5-flash`**

---

## Maintenance checklist

When adding a doc under `/docs`:

- [ ] Name: `[NUMBER]-[kebab-case].md` within its folder sequence  
- [ ] Frontmatter: `title`, `version`, `lastUpdated`, `status`, `purpose`  
- [ ] Link from this file or the subdirectory README  
- [ ] Dashboard UI specs: follow **AI-native compliance** § above  
- [ ] Update [`../index.md`](../index.md) if repo-wide navigation changes  

---

## By type

| Type | Location |
|------|----------|
| PRDs & commerce | `ipix-commerce-*.md`, `ipix/07-prd.md`, `plan/prd.md` |
| Implementation plans | `intelligence/`, `ipix-commerce-implementation-plan.md`, `tasks/00-master-plan.md` |
| Wireframes | `tasks/wireframes-ipix/new/`, `wireframes/` |
| AI prompts | `intelligence/prompt.md`, `plan/*prompt*` |
| Audits & PR notes | `pr/`, `archive/` |
| Scratch | `notes/`, `notes-2/`, `notes-ecom.md` |
