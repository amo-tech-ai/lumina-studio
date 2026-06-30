---
title: Agent Map
task: DESIGN-017
version: "0.1"
lastUpdated: "2026-06-29"
status: stub
ssot: ../handoff/06-ai-workflows.md
stackPlans: ../../intelligence/plans/
alignment: ../STACK-ALIGNMENT.md
---

# AGENT-MAP.md

Route → Mastra agent → durability → dock behavior. **Stub** — reconcile with live `route-agent-map.ts`.  
**Handoff detail:** `tasks/design-docs/handoff/06-ai-workflows.md` · **Stack alignment:** `tasks/design-docs/STACK-ALIGNMENT.md` · **Mastra plan:** `tasks/intelligence/plans/mastra-plan.md` · **CopilotKit plan:** [copilotkit-plan.md](../../intelligence/plans/copilotkit-plan.md) · **Prod:** `app/src/lib/route-agent-map.ts` · `app/src/mastra/`

🟢 aligned · 🟡 gap · 🔴 mismatch · ⚪ not wired

---

## Registry (Mastra)

| Agent ID | Role | Tools (summary) | Dot |
|----------|------|-----------------|:---:|
| `production-planner` | Shoot planning, scoring, scheduling | shoot wizard, brief, commit | 🟢 |
| `creative-director` | Asset/campaign quality, DNA match | campaign/asset tools | 🟢 |
| `brand-intelligence` | Brand DNA crawl + scoring | Firecrawl, approve workflow | 🟢 |
| `visual-identity` | Crop/safe-zone/DNA per channel | Cloudinary upload, specs | 🟡 |
| `social-discovery` | Creator/audience scoring | — | ⚪ |
| `brand-approval` | HITL gate (workflow) | approve route | 🟡 |

Confirm full list: `app/src/mastra/index.ts`.

---

## Route → agent (handoff spec)

| Route prefix | Handoff agent | Durable? | Greeting context |
|--------------|---------------|:--------:|------------------|
| `/app` (Command Center) | production-planner | ✅ | portfolio + pending approvals |
| `/app/brand` | brand-intelligence | ❌ | brand count + weakest brand |
| `/app/brand/[id]` | brand-intelligence | ❌ | brand + DNA + opportunities |
| `/app/shoots` | production-planner | ✅ | shoot counts |
| `/app/shoots/new` | production-planner | ✅ | wizard step context |
| `/app/shoots/[id]` | production-planner | ✅ | active shoot + tab |
| `/app/campaigns` | creative-director | ✅ | campaign + deliverables |
| `/app/assets` | creative-director | ✅ | selected asset + DNA match |
| `/app/matching` | social-discovery | (confirm) | match count + top creator |
| `/app/preview` | visual-identity | (confirm) | platform + crop/DNA |
| `/app/onboarding` | brand-intelligence | ❌ | funnel step |

---

## Route → agent (production code)

Source: `app/src/lib/route-agent-map.ts` (prefix match, most specific first).

| Route prefix | Prod agent | Handoff agent | Dot |
|--------------|------------|---------------|:---:|
| `/app/shoots` | production-planner | production-planner | 🟢 |
| `/app/campaigns` | creative-director | creative-director | 🟢 |
| `/app/brand` | brand-intelligence | brand-intelligence | 🟢 |
| `/app/assets` | **production-planner** | creative-director | 🔴 |
| `/app/matching` | **production-planner** | social-discovery | 🔴 |
| `/app/onboarding` | production-planner | brand-intelligence | 🟡 |
| `/app/preview` | **default** (production-planner) | visual-identity | 🔴 |
| `/app` (default) | production-planner | production-planner | 🟢 |

**DESIGN-070:** fix Assets, Matching, Preview, Onboarding mappings.

---

## Durability

| Agent | Handoff | Prod behavior | Dot |
|-------|---------|---------------|:---:|
| production-planner | ✅ durable | Mastra workflows + resume | 🟡 |
| creative-director | ✅ durable | confirm `durable.ts` | 🟡 |
| brand-intelligence | ❌ error+retry only | start/resume/approve routes; **no resumable stream** | 🟡 |
| visual-identity | confirm | partial (Cloudinary upload in agent) | 🟡 |
| social-discovery | confirm | not registered on route | 🔴 |

---

## Dock + HITL (handoff rules)

| Rule | Detail | Prod | Dot |
|------|--------|------|:---:|
| Greeting | Names active object + next action — never "How can I help?" | CopilotSidebar (not IntelligencePanel) | 🟡 |
| Quick actions | 3–5 context chips; stream steps (✓ · pulse · faint) | `useConfigureSuggestions` partial | 🟡 |
| HITL | ApprovalCard: confidence + evidence + Approve/Edit/Reject | `brand-approval` workflow; DESIGN-072 persist | 🟡 |
| Explainability | **EvidenceBlock** modal: score→potential · confidence · why · evidence · Approve→re-score | partial brand detail only; DC ✓ 5 screens | 🟡 |
| Error | Retry · Report · Go back; no dead ends | brand-intelligence error UX TBD | ⚪ |

See `tasks/design-docs/handoff/06-ai-workflows.md` § HITL · `tasks/design-docs/design/AI-EXPLAINABILITY.md`.

---

## Route → EvidenceBlock (component deps)

| Route | Explain trigger | Agent (handoff) | DESIGN-* |
|-------|-----------------|-----------------|----------|
| `/app/brand/[id]` | DNA pillar click | brand-intelligence | 046 · 051 |
| `/app/assets` | DNA match | creative-director | 046 · 057 |
| `/app/campaigns` | campaign health | creative-director | 046 · 058 |
| `/app/matching` | creator fit | social-discovery | 046 · 059 |
| `/app/preview` | channel readiness | visual-identity | 046 · 060 |

React target: `evidence-block.tsx` (single component — **DESIGN-046**).

---

## CopilotKit wiring

| Layer | Path | Dot |
|-------|------|:---:|
| Runtime | `/api/copilotkit/[[...slug]]` | 🟢 |
| Shell | `operator-panel.tsx` → CopilotSidebar | 🟡 |
| Agent resolve | `resolveAgentId(pathname)` | 🟡 gaps above |
| Suggestions | per-route registration | ⚪ |

---

## Next steps

1. **DESIGN-070** — patch `route-agent-map.ts` to match handoff table.
2. **DESIGN-032** — port IntelligencePanel UX onto CopilotSidebar shell.
3. Document Mastra tool IDs per agent in a follow-up table (link to `mastra/tools/`).
