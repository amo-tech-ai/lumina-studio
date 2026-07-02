---
title: Skill Map
version: "1.1"
lastUpdated: "2026-07-02"
---

# Skill Map

Task → required Claude/Cursor skill → MCP tool → verification method.

## Skill inventory (iPix-relevant)

| Skill | Path | Use when |
|-------|------|----------|
| ipix | `.claude/skills/ipix/SKILL.md` | Domain routing |
| ipix-task-lifecycle | `.claude/skills/ipix-task-lifecycle/SKILL.md` | Full feature PR workflow |
| copilotkit | `.claude/skills/copilotkit/SKILL.md` | CK v2 runtime/UI |
| mastra | `.claude/skills/mastra/SKILL.md` | Agents, workflows, tools |
| ipix-supabase | `.claude/skills/ipix-supabase/SKILL.md` | RLS, migrations, edge |
| gemini | `.claude/skills/gemini/SKILL.md` | Prompts, structured output |
| cloudinary | `.claude/skills/cloudinary/SKILL.md` | Media pipeline |
| frontend-design | `.claude/skills/frontend-design/SKILL.md` | Operator UI |
| claude-design-handoff | `.claude/skills/claude-design-handoff/SKILL.md` | DC → React |
| feature-dev | `.claude/skills/feature-dev/SKILL.md` | Multi-file features |
| graphify | `.claude/skills/graphify/SKILL.md` | Blast radius |
| worktrees | `.claude/skills/worktrees/SKILL.md` | Branch isolation |
| gen-test | `.claude/skills/gen-test/SKILL.md` | Vitest generation |
| agent-browser | `.claude/skills/agent-browser/SKILL.md` | Browser automation |
| fashion-production | `.claude/skills/fashion-production/SKILL.md` | Shoot domain |
| create-migration | `.claude/skills/create-migration/SKILL.md` | New SQL migration |
| linear | `.claude/skills/linear/SKILL.md` | Issue updates |
| **design-md** | `.claude/skills/design-md/SKILL.md` | Read `design.md` first — all DESIGN-* UI |
| **design-to-production** | `.claude/skills/design-to-production/SKILL.md` | DC `.dc.html` → React parity (execute + verify) |
| **task-verifier** | `.claude/skills/task-verifier/SKILL.md` | Done gate — disk probes |
| **mermaid-diagrams** | `.claude/skills/mermaid-diagrams/SKILL.md` | Linear flow diagrams |
| **ipix-wireframe** | `.claude/skills/ipix-wireframe/SKILL.md` | Lo-fi wireframes before UI code |
| **accessibility** | `.claude/skills/accessibility/SKILL.md` | DESIGN-086 a11y |
| **lean** | `.claude/skills/lean/SKILL.md` | Scope trim · hygiene |

**Execution guide:** [`../../audit/01-audit-prompt.md`](../../audit/01-audit-prompt.md) · **Dependencies:** [`MASTER-DEPENDENCIES.md`](./MASTER-DEPENDENCIES.md)

---

## P0 tasks

| Task | Skills | Wireframe / Mermaid | MCP / tools | Verification |
|------|--------|---------------------|-------------|--------------|
| IPI-209 Shoot Detail | ipix-task-lifecycle, feature-dev, fashion-production, design-md, copilotkit, **task-verifier** | 9-tab ASCII + nav flowchart | Supabase MCP, browser | `cd app && npm run lint && npm test && npm run build` |
| IPI-89 Vite retirement | ipix, worktrees, lean | ➖ | — | root + app build; no new `src/` features |
| STR-001–003 Stripe | ipix-supabase, create-migration, task-verifier | sequenceDiagram checkout | Supabase MCP | supabase:verify-rls + payment smoke |
| IPI-127 prod smoke | ipix, agent-browser | ➖ | browser | Manual login on prod URL |
| DESIGN-010 tokens | design-md, claude-design-handoff, frontend-design | ➖ | — | Visual diff vs DC tokens.css |
| DESIGN-070 route map | mastra, copilotkit, graphify, task-verifier | flowchart route→agent | — | grep `route-agent-map.ts` vs AGENT-MAP |

---

## Design handoff — components

| Task | Skills | Wireframe / Mermaid | MCP / tools | Verification |
|------|--------|---------------------|-------------|--------------|
| DESIGN-032 IntelligencePanel | design-md, copilotkit, frontend-design | panel layout ASCII | browser | Component test + DESIGN-REVIEW-CHECKLIST |
| DESIGN-040 ApprovalCard | design-md, frontend-design, mastra | HITL card states table | — | HITL persist test (072) |
| DESIGN-054 Shoot Detail | design-md, fashion-production, feature-dev, task-verifier | 9-tab wireframe · handoff/02 §6 | Supabase | IPI-209 probes |
| DESIGN-056b Wizard parity | design-md, fashion-production, mastra | 10-step flowchart | — | WIZARD-PARITY.md checklist |
| DESIGN-071 live data | ipix-supabase, copilotkit, design-md | ➖ | Supabase MCP | Integration test + manual panel |
| DESIGN-072 HITL persist | ipix-supabase, mastra, task-verifier | sequenceDiagram approve→DB | Supabase execute_sql | approve → row in DB |

---

## AI / media

| Task | Skills | MCP / tools | Verification |
|------|--------|-------------|--------------|
| DESIGN-016 API-MAP | ipix-supabase, graphify | Supabase list_tables | Doc review + spot-check routes |
| DESIGN-017 AGENT-MAP | mastra, copilotkit, gemini | Mastra MCP | Registry grep vs doc |
| DESIGN-018 MEDIA-MAP | cloudinary, ipix-supabase | Supabase | Folder strategy review |
| DESIGN-074a–f Cloudinary | cloudinary, ipix-supabase | Supabase | Upload E2E + verify-dna |
| DESIGN-075 production-planner | mastra, gemini, fashion-production | Mastra MCP | Wizard E2E |
| DESIGN-076 brand-intelligence | mastra, gemini, ipix-supabase | Supabase, Firecrawl | verify-brand-intelligence |
| IPI-24 Firecrawl | firecrawl, ipix-supabase | Firecrawl, Supabase | Crawl job → brand_crawls row |

---

## QA

| Task | Skills | MCP / tools | Verification |
|------|--------|-------------|--------------|
| DESIGN-081 Playwright | agent-browser, gen-test | browser | E2E CI job |
| DESIGN-083 CI gate | ipix-task-lifecycle | — | GitHub Actions green |
| DESIGN-086 a11y | accessibility | browser | axe + 44px manual |
| migration-reviewer | (subagent) | Supabase MCP | Before supabase:push |

---

## DV2-M3 Workspace Parity (HTML audit 2026-07-02)

From [`tasks/design-docs/audit/04-HTML-LINEARAUDIT.MD`](../../design-docs/audit/04-HTML-LINEARAUDIT.MD). Load **`ipix-task-lifecycle`** + **`task-verifier`** on every row.

| Task | Skills | Wireframe / Mermaid | MCP / tools | Verification |
|------|--------|---------------------|-------------|--------------|
| IPI-257 Cloudinary 074a–f | cloudinary, ipix-supabase, gemini, mermaid-diagrams, task-verifier | upload sequence · data flow | Supabase MCP, Cloudinary MCP | supabase:verify-rls · verify-edge · secret grep |
| IPI-268 Campaigns schema | ipix-supabase, mermaid-diagrams, migration-reviewer, task-verifier | ER diagram | Supabase MCP | supabase:push · verify-rls · supabase:types |
| IPI-336 Onboarding 13-screen | design-md, **design-to-production**, frontend-design, ipix-wireframe, copilotkit, mermaid-diagrams, task-verifier | Zeely funnel flowchart | browser | lint · test · build · onboarding screenshots |
| IPI-337 Shoot Detail 6 tabs | design-md, **design-to-production**, fashion-production, feature-dev, frontend-design, task-verifier | 9-tab nav | Supabase | lint · test · Playwright per tab |
| IPI-274 Shoot Wizard | design-md, **design-to-production**, frontend-design, mastra, copilotkit, fashion-production, ipix-wireframe, mermaid-diagrams, task-verifier | 6-step + HITL sequence | Mastra MCP | lint · test · wizard E2E |
| IPI-273 Shoots List | design-md, **design-to-production**, frontend-design, copilotkit, mastra, ipix-wireframe, mermaid-diagrams, task-verifier | list states diagram | browser | lint · test · hex guard · 5 states |
| IPI-248 Asset Library | design-md, **design-to-production**, frontend-design, cloudinary, copilotkit, ipix-wireframe, mermaid-diagrams, task-verifier | masonry + selection states | Supabase MCP | GET /api/assets · lint · test · E2E |

**Note:** Per-screen **design** Playwright coverage is **IPI-258**; root `e2e/*.spec.ts` has API/smoke specs only.

---

## Default agent workflow

```text
1. Read ipix-task-lifecycle + domain skill (copilotkit/mastra/supabase/…)
2. graphify query (if multi-file)
3. Supabase MCP before schema assumptions
4. worktree branch ipi/NNN-slug
5. Implement → cd app && npm run lint && npm test && npm run build
6. infisical run -- npm run supabase:verify-rls (if DB)
7. PR with stack table from task-stack-map.md
```
