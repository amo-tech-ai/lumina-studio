---
title: Skill Map
lastUpdated: "2026-07-06"
version: "1.4"
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
| **shadcn** | `.claude/skills/shadcn/SKILL.md` | shadcn/ui primitives · `components.json` |
| **nextjs-developer** | `.claude/skills/nextjs-developer/SKILL.md` | **Next.js hub** — App Router · RSC · Server Actions · routing |
| **nextjs-16** | `.claude/skills/nextjs-16/SKILL.md` | Platform satellite — `proxy.ts`, config, Turbopack, caching |
| **vercel-react-best-practices** | `.claude/skills/vercel-react-best-practices/SKILL.md` | App Router perf · RSC · `next/image` · LCP/CLS |
| **react-patterns** | `.claude/skills/react-patterns/SKILL.md` | React 19 · Server/Client split · hooks *(conditional)* |
| feature-dev | `.claude/skills/archive/feature-dev/SKILL.md` | Multi-file features |
| graphify | `.claude/skills/graphify/SKILL.md` | Blast radius |
| worktrees | `.claude/skills/worktrees/SKILL.md` | Branch isolation |
| gen-test | `.claude/skills/gen-test/SKILL.md` | Vitest generation |
| agent-browser | `.claude/skills/archive/agent-browser/SKILL.md` | Browser automation |
| fashion-production | `.claude/skills/fashion-production/SKILL.md` | Shoot domain |
| create-migration | `.claude/skills/create-migration/SKILL.md` | New SQL migration |
| linear | `.claude/skills/linear/SKILL.md` | Issue updates |
| **design-md** | `.claude/skills/design-md/SKILL.md` | Read `design.md` first — all DESIGN-* UI |
| **task-verifier** | `.claude/skills/task-verifier/SKILL.md` | Done gate — disk probes |
| **mermaid-diagrams** | `.claude/skills/mermaid-diagrams/SKILL.md` | Linear flow diagrams |
| **ipix-wireframe** | `.claude/skills/ipix-wireframe/SKILL.md` | Lo-fi wireframes before UI code |
| **accessibility** | `.claude/skills/accessibility/SKILL.md` → `archive/accessibility` | DESIGN-086 a11y |
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
| **IPI-17 Command Center** | ipix-task-lifecycle, claude-design-handoff, ipix-wireframe, graphify, ipix-supabase, frontend-design, shadcn, copilotkit, gen-test, **task-verifier**, lean, worktrees | [`IPI-17-DESIGN-050-command-center.wire`](../../wireframes-ipix/IPI-17-DESIGN-050-command-center.wire) · DC Command Center HTML | Supabase MCP (RLS read), browser | `cd app && npm run lint && npm test && npm run build` · `@task-verifier` · evidence `ipi-17-command-center/` |
| **IPI-290 CC DC polish (epic)** | ipix-task-lifecycle, task-verifier, claude-design-handoff, mermaid-diagrams, linear, lean | [`command.png`](../../../tasks/design-docs/implementation/command.png) · plan `command-center.md` | Linear MCP | Orchestrate 291→295 · verifier report before epic Done |
| **IPI-291 CC-IMG-001** | ipix-task-lifecycle, **cloudinary**, **vercel-react-best-practices**, gen-test, lean, worktrees, graphify | plan § Cloudinary · DC `ph()` L497 | Cloudinary MCP `list-images` | `npx vitest run sample-images.test.ts` · curl hero URL 200 |
| **IPI-292 CC-HERO-001** | **design-md**, claude-design-handoff, frontend-design, **vercel-react-best-practices**, shadcn, gen-test, accessibility, lean, graphify (opt), react-patterns *(if Client Image)* | [`command.png`](../../../tasks/design-docs/implementation/command.png) · BrandCard.dc.html | browser `/app?skip=1` | hero photo 104×104 vs target |
| **IPI-293 CC-RECENT-001** | **design-md**, claude-design-handoff, frontend-design, **vercel-react-best-practices**, gen-test, accessibility, lean, graphify (opt), react-patterns *(if Client Image)* | command.png recent row · AssetCard.dc.html | browser | 5 tiles · lazy load · no overflow |
| **IPI-294 CC-HITL-001** | **design-md**, claude-design-handoff, frontend-design, shadcn, gen-test, lean, graphify (opt) | ApprovalCard + EmptyState.dc.html | browser `?skip=approval` | derive-view-state test · preview image |
| **IPI-295 CC-SHIP-001** | ipix-task-lifecycle, **task-verifier**, **vercel-react-best-practices**, agent-browser, linear, lean, worktrees | command.png side-by-side | **Chrome DevTools MCP** · Playwright · agent-browser | full CI matrix · evidence · code-only PR |

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

## DESIGN-* UI skill order (canonical)

Per [`TASK-EXECUTION-GUIDE.md`](../../design-docs/plan/TASK-EXECUTION-GUIDE.md):

```text
design-md → frontend-design → claude-design-handoff
         → nextjs-developer              (new routes, layouts, Server Actions — optional for polish)
         → vercel-react-best-practices   (App Router perf, images, RSC)
         → react-patterns                (only if adding 'use client' / hooks / Suspense)
```

**Do not load together:** `nextjs-developer` + `vercel-react-best-practices` on the same small task (pick perf OR architecture as primary).

**Archived (duplicates):** `archive/nextjs-app-router-patterns`, `archive/nextjs-react-typescript`, `archive/nextjs-best-practices`, `archive/nextjs-supabase-auth` — use hub + `ipix-supabase` for auth.

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
