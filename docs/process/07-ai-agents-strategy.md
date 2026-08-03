# 07 · AI Agents Strategy

**Goal:** Use Mastra + CopilotKit so agents assist brands with planning, DNA, and market research — without new agent sprawl.

**Depends on:** [05](./05-ui-user-journey.md), [06](./06-tech-stack-playbook.md)  
**SSOT:** `app/src/mastra/index.ts` · CopilotKit route · skills `mastra`, `copilotkit`, `gemini`

---

## Principles

| Do | Don't |
|----|-------|
| Hats on existing agents (CD, planner, …) | Spawn a new agent per persona |
| AI drafts behind HITL | Silent production writes |
| Page context (brand/shoot) injected | Make user restate context |
| RAG for brand/docs when it cuts guessing | RAG theater with no retrieval need |
| Market research → actionable next step | Research dump in chat |

---

## Multistep prompt — agent + RAG strategy

```xml
<role>You design agent improvements for iPix operators.</role>

<context>
Registry: production-planner, creative-director, + operator agents in app/src/mastra.
Runtime: CopilotKit v2 + MastraAgent.getLocalAgents().
Research tools candidates: web search, Apify, Firecrawl, Xpoz-like patterns, Postiz for social.
</context>

<task>
1. Explain current agent wiring (paths + IDs must match frontend).
2. Check whether Mastra RAG / memory is used; compare to pgvector in Supabase.
3. Web search latest Mastra RAG + CopilotKit patterns (docs + GitHub last 30 days).
4. Propose how agents should research brand + industry trends + events, then suggest UX actions.
5. Map Core MVP agent assists vs Advanced.
6. Platform-first: managed features before custom tools.
7. Mermaid: user message → tools → draft → human confirm → failure points.
</task>

<constraints>
- No client AI keys.
- getMastra() only inside handlers.
- One concern follow-ups.
</constraints>

<output_format>
Current state · RAG verdict · Proposed assists · MVP backlog · Risks
</output_format>
```

---

## Multistep prompt — test an agent journey

```xml
<task>
1. On localhost:3002 /app, open the relevant screen.
2. Ask the agent to do the job the screen implies (e.g. shot list, brief).
3. Verify tools fired, draft-only mutations, clear errors.
4. Recommend UX copy / suggested prompts / empty states.
</task>
```

---

## Done when

- [ ] RAG decision recorded (use / defer) with evidence
- [ ] ≤5 agent UX assists filed as Linear issues
