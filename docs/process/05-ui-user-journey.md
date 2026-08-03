# 05 · UI & User Journey Review

**Goal:** Make operator screens easier with AI assisting — grounded in competitor journeys and real iPix workflows.

**Depends on:** [02](./02-task-template.md), [04](./04-testing-qa-playbook.md)  
**Surfaces:** Brand Hub · Command Center · Assets DNA · shoots · booking · marketing site chat  
**Design SSOT:** `.claude/skills/design-md/` · wireframes under `tasks/wireframes-ipix/`

---

## Competitor scan (separate pass per brand)

| Competitor | Study | Steal / beat |
|------------|-------|--------------|
| [Soona](https://soona.co) | Shoot booking + creative ops journey | Faster path from brief → book |
| Squareshot | Product photography workflows | Clear deliverable status |
| [Xpoz](https://www.xpoz.ai/) | AI commerce / content | Agent-led research → action |
| Others (search last 30 days) | AI fashion/DTC ops tools | Fill gaps Soona/Xpoz miss |

For each: user journey · AI features · screens · missing pieces · how iPix agents win.

---

## Multistep prompt — journey + competitor research

```xml
<role>You are a product designer + competitive analyst for iPix.</role>

<context>
iPix helps fashion/DTC brands plan content, run shoots, keep brand DNA, and use Mastra agents in /app.
UX principles: Guide → Prevent → Confirm; AI drafts, humans decide.
</context>

<task>
1. Web search Soona, Squareshot, Xpoz (+ 2 similar tools found in last 30 days).
2. For each: map journey steps, AI assist points, friction.
3. Map current iPix screens for the same jobs (cite app/ routes).
4. Gap list: must-have for Core MVP vs Post-MVP.
5. Propose 3 UX changes that make the agent the "proactive teammate" (not empty chat).
6. Mermaid: competitor happy path vs iPix current vs proposed.
</task>

<constraints>
- No new visual system; respect existing brand tokens.
- Prefer improving existing screens over new apps.
- Cards only when interaction requires them.
</constraints>

<output_format>
Competitor table · Journey Mermaid · Gap backlog (MVP tagged) · Top 5 UX fixes
</output_format>
```

---

## Multistep prompt — HTML/UI reuse audit

```xml
<task>
1. Find duplicated UI patterns in app/src/components vs pages.
2. List shadcn/shared components to reuse before new markup.
3. Flag custom HTML/CSS that should be design-system components.
4. Recommend refactor only if it unblocks MVP journeys — else park.
</task>
```

---

## Impact on user journey

| Change type | Operator feels it when… |
|-------------|-------------------------|
| Clearer next step | Opening Command Center / shoot detail |
| Agent context-aware | Chat already knows brand/campaign |
| Fewer forms | Booking / brief defaults filled |
| DNA in path | Assets blocked/review before publish |

---

## Done when

- [ ] Competitor table filled once (refresh quarterly)
- [ ] Top UX gaps filed as Linear issues with template #02
