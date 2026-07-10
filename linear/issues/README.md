# Linear issue descriptions (source of truth)

**Workspace:** [linear.app/ipix](https://linear.app/ipix) · team **IPI** · [All issues view](https://linear.app/ipix/view/all-issues-a48540fcf640)

Every executable issue has a local markdown spec in this folder following [`ipix-task-lifecycle`](../../../.claude/skills/ipix-task-lifecycle/SKILL.md): plain-terms summary, skills, flow diagram, completion steps A–E, verifier probes (where applicable), Gantt.

**Supabase roadmap (audit, deps, MVP priority):** [`../supabase-roadmap.md`](../supabase-roadmap.md)

**Cloudinary strategy:** [`tasks/cloudinary/cloudinary-plan.md`](../../../tasks/cloudinary/cloudinary-plan.md)

**Gemini strategy:** [`../../gemeni/gemeni-plan.md`](../../gemeni/gemeni-plan.md)

---

## Sync workflow

```bash
# Generate missing/shallow specs from catalog (preserves rich hand-written specs)
infisical run -- node scripts/linear-generate-full-specs.mjs

# Push local markdown → Linear descriptions
infisical run -- node scripts/linear-update-issue.mjs IPI-17
infisical run -- node scripts/linear-update-issue.mjs --all
```

Bulk-create backlog issues (idempotent):

```bash
node scripts/linear-create-supabase-roadmap.mjs   # IPI-31–58
node scripts/linear-create-cloudinary-roadmap.mjs # IPI-59–70
infisical run -- node scripts/linear-create-gemini-roadmap.mjs # IPI-71–80 · AI-009–018 · label INT
export $(grep -v '^#' .env.local | xargs) && node scripts/linear-create-aior-roadmap.mjs  # IPI-81–90 · AIOR-001–010 · label INT
export $(grep -v '^#' .env.local | xargs) && node scripts/linear-create-dash-roadmap.mjs  # IPI-91–102 · DASH-001–012 · label INT
node scripts/linear-label-int.mjs   # ensure INT on intelligence issues
node scripts/linear-verify-int-labels.mjs  # verify 46/46 INT
infisical run -- node scripts/linear-create-audit-gaps.mjs  # 09-linear-audit gaps (iPix1 + AIOR)
```

**Audit (2026-06-25):** [`docs/copilotkit/09-linear-audit.md`](../../copilotkit/09-linear-audit.md)

### Dual-team spec files (iPix1 vs IPix-OLD)

Same **IPI number** can mean different work on different teams. Filename uses **spec ID** suffix:

| File | Team | Spec | Notes |
|------|------|------|-------|
| `IPI-24-IPI-BI-001.md` | **iPix1** | Firecrawl Epic 1 | Not `IPI-24-UI-003.md` (OLD assets screen) |
| `IPI-25-IPI-BI-002.md` | **iPix1** | Gemini prompt v2 | Not `IPI-25-UI-004.md` (OLD product links) |
| `IPI-29-IPI-BI-006.md` | **iPix1** | Brand scoring v2 | Not `IPI-29-PLT-010.md` (OLD local Supabase) |
| `IPI-46-IPI-BI-P0.md` | **iPix1** | Onboarding P0 | Not `IPI-46-COM-034.md` (OLD commerce) |
| `IPI-47-SEC-002.md` | **iPix1** | Remove VITE_GEMINI | Not `IPI-47-ANA-001.md` (OLD analytics) |
| `IPI-48-OPS-001.md` | **iPix1** | OAuth / Auth URLs | Not `IPI-48-ANA-002.md` |
| `IPI-49-IPI-BI-OPS-002.md` | **iPix1** [IPI-126](https://linear.app/amo100/issue/IPI-126) | Push migration | Final gate for IPI-46 Done |
| `IPI-26-IPI-BI-003.md` | **iPix1** [IPI-26](https://linear.app/amo100/issue/IPI-26) | Schema v2 | Not `IPI-26-FRZ-001.md` (deprecated) |
| `IPI-103-AIOR-011.md` … `IPI-108-AIOR-015.md` | **IPix-OLD** | New AIOR gaps | Title match in Linear; number may differ from filename |
| `IPI-127-AIOR-011.md` | **iPix1** | IPI-127 | CopilotKit prod license + runtime |

Push iPix1 BRAND corrections: `node scripts/linear-update-bi-audit-corrections.mjs IPI-46 …`

Template: `.claude/skills/ipix-task-lifecycle/references/linear-issue-steps.md`  
Verifier reference: `.claude/skills/ipix-task-lifecycle/references/verifier-probes-ipix.md`

**Policy:** No implementation without a Linear issue **and** a spec file here.

---

## CF-MIG · Vercel → Cloudflare Workers (lean track)

**Epic:** CF-MIG · Vercel → Cloudflare Workers  
**Platform epic (Linear):** [IPI-487 · CLOUDFLARE-EPIC](https://linear.app/amo100/issue/IPI-487) · `linear/issues/IPI-487-cloudflare-epic.md` · `tasks/cloudflare/CLOUDFLARE-EPIC.md`  
**Mastra epic:** [IPI-486 · MASTRA-EPIC](https://linear.app/amo100/issue/IPI-486)  
**Project:** [AI Platform — LLM Providers](https://linear.app/amo100/project/ai-platform-llm-providers-8088f63224f2/issues)  
**Plan SSOT:** [`tasks/cloudflare/migration/plan-migrate.md`](../../tasks/cloudflare/migration/plan-migrate.md)

| File | ID | Name | Priority | Blocks |
|------|-----|------|----------|--------|
| `IPI-CF-MIG-110-opennext-foundation.md` | CF-MIG-110 | OpenNext Foundation — Scaffold & Edge Middleware | Urgent | 111, 210 |
| `IPI-CF-MIG-111-ci-opennext-build.md` | CF-MIG-111 | OpenNext CI Build Pipeline | Urgent | 220 |
| `IPI-CF-MIG-210-runtime-compat.md` | CF-MIG-210 | Runtime Compatibility — Hono, OAuth & Groq Bundle | Urgent | 220 |
| `IPI-CF-MIG-220-preview-smoke-gate.md` | CF-MIG-220 | Preview Smoke Testing & Validation | Urgent | 810 |
| `IPI-CF-MIG-810-production-cutover.md` | CF-MIG-810 | Production DNS Cutover & Rollback | High | — |

**10-task spine:** 5 CF-MIG + 5 AI (IPI-454, 457, 485, 462, 463). No CF-INFRA tasks.

**Import script:** `infisical run -- python3 scripts/linear-create-cf-mig-issues.py`

**Order:** 110 → (111 ∥ 210) → 220 → 810

---

## Issue index (IPI-5 → IPI-70)

| File | Issue | Spec ID | Linear state |
|------|-------|---------|--------------|
| IPI-5-COM-001.md | [IPI-5](https://linear.app/ipix/issue/IPI-5) | COM-001 | Done |
| IPI-6-COM-002.md | [IPI-6](https://linear.app/ipix/issue/IPI-6) | COM-002 | Done |
| IPI-7-COM-003.md | [IPI-7](https://linear.app/ipix/issue/IPI-7) | COM-003 | Done |
| IPI-8-COM-008.md | [IPI-8](https://linear.app/ipix/issue/IPI-8) | COM-008 | Done |
| IPI-9-COM-006.md | [IPI-9](https://linear.app/ipix/issue/IPI-9) | COM-006 | Done |
| IPI-10-COM-005.md | [IPI-10](https://linear.app/ipix/issue/IPI-10) | COM-005 | Done |
| IPI-11-COM-004.md | [IPI-11](https://linear.app/ipix/issue/IPI-11) | COM-004 | Done |
| IPI-12-COM-010.md | [IPI-12](https://linear.app/ipix/issue/IPI-12) | COM-010 | Done |
| IPI-103-COM-012.md | [IPI-103](https://linear.app/ipix/issue/IPI-103) | COM-012 | Done |
| IPI-13-COM-011.md | [IPI-13](https://linear.app/ipix/issue/IPI-13) | COM-011 | Done |
| IPI-14-PLT-001.md | [IPI-14](https://linear.app/ipix/issue/IPI-14) | PLT-001 | Done |
| IPI-15-PLT-002.md | [IPI-15](https://linear.app/ipix/issue/IPI-15) | PLT-002 | Done |
| IPI-16-PLT-003.md | [IPI-16](https://linear.app/ipix/issue/IPI-16) | PLT-003 | Done |
| IPI-17-PLT-004.md | [IPI-17](https://linear.app/ipix/issue/IPI-17) | PLT-004 | Done |
| IPI-18-AI-001.md | [IPI-18](https://linear.app/ipix/issue/IPI-18) | AI-001 | Done |
| IPI-19-DNA-001.md | [IPI-19](https://linear.app/ipix/issue/IPI-19) | DNA-001 | Todo |
| IPI-20-AI-002.md | [IPI-20](https://linear.app/ipix/issue/IPI-20) | AI-002 | Backlog |
| IPI-21-DNA-002.md | [IPI-21](https://linear.app/ipix/issue/IPI-21) | DNA-002 | Backlog |
| IPI-22-UI-001.md | [IPI-22](https://linear.app/ipix/issue/IPI-22) | UI-001 | In Review · [PR #13](https://github.com/amo-tech-ai/lumina-studio/pull/13) |
| IPI-23-UI-002.md | [IPI-23](https://linear.app/ipix/issue/IPI-23) | UI-002 | Todo — **PR B** brand intake |
| IPI-24-UI-003.md | [IPI-24](https://linear.app/ipix/issue/IPI-24) | UI-003 | Backlog |
| IPI-25-UI-004.md | [IPI-25](https://linear.app/ipix/issue/IPI-25) | UI-004 | Backlog |
| IPI-26-IPI-BI-003.md | [IPI-26](https://linear.app/amo100/issue/IPI-26) | IPI-BI-003 | Todo — schema v2 |
| IPI-26-FRZ-001.md | — | FRZ-001 | **Deprecated** — wrong IPI-26 mapping |
| IPI-27-FRZ-002.md | [IPI-27](https://linear.app/ipix/issue/IPI-27) | FRZ-002 | Backlog (frozen) |
| IPI-28-FRZ-003.md | [IPI-28](https://linear.app/ipix/issue/IPI-28) | FRZ-003 | Backlog (frozen) |
| IPI-29-PLT-010.md | [IPI-29](https://linear.app/ipix/issue/IPI-29) | PLT-010 | Backlog (deferred) |
| IPI-30-IPI-BI-007.md | [IPI-30](https://linear.app/amo100/issue/IPI-30) | IPI-BI-007 | Todo |
| ARCHIVE-PLT-011-cloudinary.md | — (local archive) | PLT-011 | — |
| IPI-31-PLT-005.md | [IPI-31](https://linear.app/ipix/issue/IPI-31) | PLT-005 | Backlog |
| IPI-32-PLT-006.md | [IPI-32](https://linear.app/ipix/issue/IPI-32) | PLT-006 | Backlog |
| IPI-33-IPI-BI-010.md | [IPI-33](https://linear.app/amo100/issue/IPI-33) | IPI-BI-010 | Todo |
| IPI-34-PLT-008.md | [IPI-34](https://linear.app/ipix/issue/IPI-34) | PLT-008 | Backlog |
| IPI-35-PLT-009.md | [IPI-35](https://linear.app/ipix/issue/IPI-35) | PLT-009 | Backlog |
| IPI-36-AI-003.md | [IPI-36](https://linear.app/ipix/issue/IPI-36) | AI-003 | Backlog |
| IPI-37-AI-004.md | [IPI-37](https://linear.app/ipix/issue/IPI-37) | AI-004 | Backlog |
| IPI-38-AI-005.md | [IPI-38](https://linear.app/ipix/issue/IPI-38) | AI-005 | Backlog |
| IPI-39-AI-006.md | [IPI-39](https://linear.app/ipix/issue/IPI-39) | AI-006 | Backlog |
| IPI-40-AI-007.md | [IPI-40](https://linear.app/ipix/issue/IPI-40) | AI-007 | Backlog |
| IPI-41-AI-008.md | [IPI-41](https://linear.app/ipix/issue/IPI-41) | AI-008 | Backlog |
| IPI-42-COM-030.md | [IPI-42](https://linear.app/ipix/issue/IPI-42) | COM-030 | Backlog |
| IPI-43-COM-031.md | [IPI-43](https://linear.app/ipix/issue/IPI-43) | COM-031 | Backlog |
| IPI-44-COM-032.md | [IPI-44](https://linear.app/ipix/issue/IPI-44) | COM-032 | Backlog |
| IPI-45-COM-033.md | [IPI-45](https://linear.app/ipix/issue/IPI-45) | COM-033 | Backlog |
| IPI-46-COM-034.md | [IPI-46](https://linear.app/ipix/issue/IPI-46) | COM-034 | Backlog |
| IPI-47-ANA-001.md | [IPI-47](https://linear.app/ipix/issue/IPI-47) | ANA-001 | Backlog |
| IPI-48-ANA-002.md | [IPI-48](https://linear.app/ipix/issue/IPI-48) | ANA-002 | Backlog |
| IPI-49-ANA-003.md | [IPI-49](https://linear.app/ipix/issue/IPI-49) | ANA-003 | Backlog |
| IPI-50-ANA-004.md | [IPI-50](https://linear.app/ipix/issue/IPI-50) | ANA-004 | Backlog |
| IPI-51-ANA-005.md | [IPI-51](https://linear.app/ipix/issue/IPI-51) | ANA-005 | Backlog |
| IPI-52-SEC-001.md | [IPI-52](https://linear.app/ipix/issue/IPI-52) | SEC-001 | Backlog |
| IPI-53-SEC-002.md | [IPI-53](https://linear.app/ipix/issue/IPI-53) | SEC-002 | Done |
| IPI-54-SEC-003.md | [IPI-54](https://linear.app/ipix/issue/IPI-54) | SEC-003 | Backlog |
| IPI-55-SEC-004.md | [IPI-55](https://linear.app/ipix/issue/IPI-55) | SEC-004 | Backlog |
| IPI-56-OPS-001.md | [IPI-56](https://linear.app/ipix/issue/IPI-56) | OPS-001 | Backlog |
| IPI-57-OPS-002.md | [IPI-57](https://linear.app/ipix/issue/IPI-57) | OPS-002 | Backlog |
| IPI-58-OPS-003.md | [IPI-58](https://linear.app/ipix/issue/IPI-58) | OPS-003 | Backlog |
| IPI-59-CLD-001.md | [IPI-59](https://linear.app/ipix/issue/IPI-59) | CLD-001 | Todo |
| IPI-60-CLD-002.md | [IPI-60](https://linear.app/ipix/issue/IPI-60) | CLD-002 | Todo |
| IPI-61-CLD-003.md | [IPI-61](https://linear.app/ipix/issue/IPI-61) | CLD-003 | Todo |
| IPI-62-CLD-004.md | [IPI-62](https://linear.app/ipix/issue/IPI-62) | CLD-004 | Backlog |
| IPI-63-CLD-005.md | [IPI-63](https://linear.app/ipix/issue/IPI-63) | CLD-005 | Backlog |
| IPI-64-CLD-006.md | [IPI-64](https://linear.app/ipix/issue/IPI-64) | CLD-006 | Todo |
| IPI-65-CLD-007.md | [IPI-65](https://linear.app/ipix/issue/IPI-65) | CLD-007 | Backlog |
| IPI-66-CLD-008.md | [IPI-66](https://linear.app/ipix/issue/IPI-66) | CLD-008 | Backlog |
| IPI-67-CLD-009.md | [IPI-67](https://linear.app/ipix/issue/IPI-67) | CLD-009 | Backlog |
| IPI-68-CLD-010.md | [IPI-68](https://linear.app/ipix/issue/IPI-68) | CLD-010 | Backlog |
| IPI-69-CLD-011.md | [IPI-69](https://linear.app/ipix/issue/IPI-69) | CLD-011 | Backlog |
| IPI-70-CLD-012.md | [IPI-70](https://linear.app/ipix/issue/IPI-70) | CLD-012 | Backlog |
| IPI-71-AI-009.md | [IPI-71](https://linear.app/ipix/issue/IPI-71) | AI-009 | Todo |
| IPI-72-AI-010.md | [IPI-72](https://linear.app/ipix/issue/IPI-72) | AI-010 | Todo |
| IPI-73-AI-011.md | [IPI-73](https://linear.app/ipix/issue/IPI-73) | AI-011 | Todo |
| IPI-74-AI-012.md | [IPI-74](https://linear.app/ipix/issue/IPI-74) | AI-012 | Backlog |
| IPI-75-AI-013.md | [IPI-75](https://linear.app/ipix/issue/IPI-75) | AI-013 | Backlog |
| IPI-76-AI-014.md | [IPI-76](https://linear.app/ipix/issue/IPI-76) | AI-014 | Backlog |
| IPI-77-AI-015.md | [IPI-77](https://linear.app/ipix/issue/IPI-77) | AI-015 | Backlog |
| IPI-78-AI-016.md | [IPI-78](https://linear.app/ipix/issue/IPI-78) | AI-016 | Backlog |
| IPI-79-AI-017.md | [IPI-79](https://linear.app/ipix/issue/IPI-79) | AI-017 | Todo |
| IPI-80-AI-018.md | [IPI-80](https://linear.app/ipix/issue/IPI-80) | AI-018 | Todo |
| IPI-81-AIOR-001.md | [IPI-81](https://linear.app/ipix/issue/IPI-81) | AIOR-001 | Todo |
| IPI-82-AIOR-002.md | [IPI-82](https://linear.app/ipix/issue/IPI-82) | AIOR-002 | Todo |
| IPI-83-AIOR-003.md | [IPI-83](https://linear.app/ipix/issue/IPI-83) | AIOR-003 | In Progress |
| IPI-84-AIOR-004.md | [IPI-84](https://linear.app/ipix/issue/IPI-84) | AIOR-004 | Todo |
| IPI-85-AIOR-005.md | [IPI-85](https://linear.app/ipix/issue/IPI-85) | AIOR-005 | Todo |
| IPI-86-AIOR-006.md | [IPI-86](https://linear.app/ipix/issue/IPI-86) | AIOR-006 | Todo |
| IPI-87-AIOR-007.md | [IPI-87](https://linear.app/ipix/issue/IPI-87) | AIOR-007 | Todo |
| IPI-88-AIOR-008.md | [IPI-88](https://linear.app/ipix/issue/IPI-88) | AIOR-008 | Todo |
| IPI-89-AIOR-009.md | [IPI-89](https://linear.app/ipix/issue/IPI-89) | AIOR-009 | Backlog |
| IPI-90-AIOR-010.md | [IPI-90](https://linear.app/ipix/issue/IPI-90) | AIOR-010 | Backlog |
| IPI-91-DASH-001.md | [IPI-91](https://linear.app/ipix/issue/IPI-91) | DASH-001 | Todo |
| IPI-92-DASH-002.md | [IPI-92](https://linear.app/ipix/issue/IPI-92) | DASH-002 | Todo |
| IPI-93-DASH-003.md | [IPI-93](https://linear.app/ipix/issue/IPI-93) | DASH-003 | Todo |
| IPI-94-DASH-004.md | [IPI-94](https://linear.app/ipix/issue/IPI-94) | DASH-004 | Todo |
| IPI-95-DASH-005.md | [IPI-95](https://linear.app/ipix/issue/IPI-95) | DASH-005 | Todo |
| IPI-96-DASH-006.md | [IPI-96](https://linear.app/ipix/issue/IPI-96) | DASH-006 | Todo |
| IPI-97-DASH-007.md | [IPI-97](https://linear.app/ipix/issue/IPI-97) | DASH-007 | Todo |
| IPI-98-DASH-008.md | [IPI-98](https://linear.app/ipix/issue/IPI-98) | DASH-008 | Todo |
| IPI-99-DASH-009.md | [IPI-99](https://linear.app/ipix/issue/IPI-99) | DASH-009 | Todo |
| IPI-100-DASH-010.md | [IPI-100](https://linear.app/ipix/issue/IPI-100) | DASH-010 | Backlog |
| IPI-101-DASH-011.md | [IPI-101](https://linear.app/ipix/issue/IPI-101) | DASH-011 | Backlog |
| IPI-102-DASH-012.md | [IPI-102](https://linear.app/ipix/issue/IPI-102) | DASH-012 | Backlog |

### Audit-reconciled specs (2026-06-25)

| File | Status | Notes |
|------|--------|-------|
| IPI-81-AIOR-001.md | Partially Done | In-process Mastra — not `:4111` |
| IPI-82-AIOR-002.md | ~70% Done | Finish via IPI-107 AIOR-002b |
| IPI-95-DASH-005.md | Updated | `/app/*` routes not D-codes |
| IPI-103-AIOR-011.md … IPI-108-AIOR-015.md | New gaps | CopilotKit / Mastra / HITL |
| IPI-24-IPI-BI-001.md · IPI-25-IPI-BI-002.md · IPI-29-IPI-BI-006.md · IPI-46-IPI-BI-P0.md | iPix1 BRAND | Epic 1 — not OLD-team collisions |
| IPI-47-SEC-002.md · IPI-48-OPS-001.md · IPI-49-IPI-BI-OPS-002.md | iPix1 P0 | Security + ops gates |

### New GRAPH issues (promoted P1 per Graphify audit 2026-06-25)

| File | Spec ID | Priority | Dependencies |
|------|---------|----------|--------------|
| `GRAPH-001-brand-graph-tables.md` | GRAPH-001 | **P1** | — |
| `GRAPH-002-brand-graph-sync.md` | GRAPH-002 | **P1** | GRAPH-001 |
| `GRAPH-003-brands-embedding.md` | GRAPH-003 | **P1** | MASTRA-RAG-002 |
| `GRAPH-004-graph-search-rpcs.md` | GRAPH-004 | **P1** | GRAPH-001, GRAPH-003 |

Migration: `20260625155519_brand_graph_tables_and_rpcs.sql` (combines Steps 1–4)

**104+ specs** · IPI-1–4 canceled onboarding junk (no spec files)

### INT label policy

**Label `INT`** = intelligence layer: Gemini edge (AI-001–018), Mastra runtime (AIOR-001–010), CopilotKit operator UI (UI-001–004), AI-native dashboards (DASH-001–012), asset DNA (DNA-001–002).

Filter in Linear: [All issues · INT](https://linear.app/ipix/view/all-issues-a48540fcf640?label=INT) (apply label filter in UI)

Sync INT labels: `node scripts/linear-label-int.mjs`

### COMMAND + DASH label policy

**Two separate labels** (not a combined name):

| Label | Meaning |
|-------|---------|
| **`COMMAND`** | Command Center workspace — `/app` DESIGN-050 / DESIGN-050b |
| **`DASH`** | D0 operator home dashboard surface |

Both are **workspace labels** (not team-only) so they appear in the Linear label picker.

**Issues:** [IPI-17](https://linear.app/amo100/issue/IPI-17) · [IPI-290](https://linear.app/amo100/issue/IPI-290)–[IPI-295](https://linear.app/amo100/issue/IPI-295)

**Workspace:** [amo100](https://linear.app/amo100) · team **iPix1 (IPI)**

Filter: labels **`COMMAND`** AND **`DASH`** · or view [DASHBOARD](https://linear.app/amo100/view/dashboard-99534284da6e) (DASH only — includes legacy DASH-001–012)

**Intelligence docs:** [`docs/intelligence/README.md`](../../intelligence/README.md) · [`docs/audit/01-audit-intellgence.md`](../audit/01-audit-intellgence.md)

**MVP queue (platform):** IPI-17 → IPI-22 → IPI-23 → IPI-19 → IPI-25 — see `.cursor/rules/pr-workflow.mdc`

**Note:** COM-008 is [IPI-8](https://linear.app/ipix/issue/IPI-8) (Seed 10 Fashion SKUs). A separate “commerce proxy” task (mdeapp bridge) is **not** in the IPIX Linear backlog — see `docs/ipix-commerce-implementation-plan.md` if revived post-MVP.
