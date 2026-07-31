---
title: "CopilotKit — Feature Adoption Report"
version: "1.0"
lastUpdated: "2026-07-31"
status: Active
purpose: "Which CopilotKit features iPix uses, which are hand-built instead, and which official examples to adapt."
ssot: ../../../tasks/copilotkit/todo.md
verifiedAgainst: "grep of app/src for every @copilotkit import, hook, and component"
verifiedAt: "2026-07-31"
scores: { core: 65, advanced: 10, overall: 43 }
---

# CopilotKit — 43/100 (C−) 🟡

**One-line problem:** iPix's central UX rule is *"AI drafts, humans decide."*
CopilotKit ships human-in-the-loop primitives for exactly that, and we use **none
of them**. The approval gates we hand-built are real server-side checks, not
prompt text — the cost is that each one is bespoke, so every new write path has to
re-implement them correctly.

---

## 1. What we actually use

| API | Call sites | Where |
|-----|-----------:|-------|
| `CopilotKit` provider | 96 | `app/(operator)/layout.tsx`, marketing |
| `CopilotSidebar` | 12 | operator shell |
| `useFrontendTool` | 10 | `operator-panel.tsx:165/178/192` |
| `CopilotPopup` | 8 | marketing widget |
| `CopilotChat` | 4 | embedded panels |
| `useAgent` | 1 | agent-id binding |
| `useCopilotReadable` | 1 | **only in a comment** — `brand-context.tsx:10` notes the v2 equivalent |
| `@copilotkit/core` import | 2 | |

Runtime: `@copilotkit/runtime` 1.61.0 at `app/src/app/api/copilotkit`, bridged to
Mastra via `@ag-ui/mastra` 1.1.1.

**3 frontend tools:** `navigateTo`, `navigateToCrm`, `setActiveBrand`.

---

## 2. Feature adoption

| Feature | CopilotKit offers | iPix | % | Dot |
|---------|:-----------------:|:----:|--:|:---:|
| Chat surfaces (Sidebar/Popup/Chat) | ✅ | ✅ | 90 | 🟢 |
| Runtime + agent bridge | ✅ | ✅ | 90 | 🟢 |
| AG-UI streaming | ✅ | ✅ | 85 | 🟢 |
| Frontend tools / actions | ✅ | ✅ 3 | 75 | 🟡 |
| Readables (page context → agent) | ✅ | 🟡 custom | 40 | 🟡 |
| **Human-in-the-loop primitives** | ✅ | ❌ | **0** | ⚪ |
| Generative UI (agent renders components) | ✅ | ❌ | 0 | ⚪ |
| Shared agent state | ✅ | ❌ | 0 | ⚪ |
| Suggestions | ✅ | ❌ | 0 | ⚪ |
| A2UI surfaces | ✅ | ❌ | 0 | ⚪ |
| Channels (Slack / mobile) | ✅ | ❌ | 0 | ⚪ |
| Threads persistence | ✅ | 🟡 flagged | 30 | 🔴 |

**Core 65 · Advanced 10 → 43**

---

## 3. 🟡 The HITL finding

Searching `app/src` for `useHumanInTheLoop`, `renderAndWaitForResponse`,
`useCopilotAction`, `useCoAgent`, and `useInterrupt` returns **three matches — all
of them comments**:

| File | Line | Content |
|------|-----:|---------|
| `mastra/tools/index.ts` | 9 | `// AFTER a useInterrupt HITL approval — never write durable tables directly` |
| `mastra/tools/draftBulkAssetApproval.ts` | 7 | `// useInterrupt convention (not built here — backend-tools-only PR)` |
| `mastra/tools/draftBulkAssetApproval.ts` | 28 | `"gated behind explicit useInterrupt HITL approval."` |

So today the safety model is:

1. Tool instructions say "never write without approval"
2. Write tools require an explicit flag (`operatorConfirmed: true`)
3. Custom approval cards live in the page UI
4. **The approval handler itself re-checks everything, server-side**

**Layer 4 is stronger than a first read suggests, and the report originally
undersold it.** `app/src/app/api/_lib/process-draft-approval.ts` is not a
rubber stamp — it independently verifies ownership and makes double-approval
structurally impossible:

| Line | Check | Effect |
|-----:|-------|--------|
| 52 | `draft.user_id !== operatorId` | `Forbidden` — the caller's claimed identity is not trusted |
| 55 | `draft.brand_id !== expectedBrandId` | Rejects a cross-brand approval |
| 68 | `.eq("status", PENDING_DRAFT_STATUS)` on the **update** | A second approve hits zero rows → *"Draft already processed"*. Not a read-then-write race |
| 78, 84 | `rollbackDraftRow` on promote/discard failure | No half-approved state |

That is a genuine gate, shared by the API route, server actions, and the Mastra
tool. **The finding is not "approvals are unenforced."**

**The actual weakness is that it's bespoke.** Layers 1 and 3 are the model's
cooperation and a separate React component; layers 2 and 4 are real but written by
hand, per flow. `process-draft-approval.ts` covers brand-intelligence drafts and
nothing else — a new write path gets these guarantees only if its author
reimplements all four checks. CopilotKit's HITL primitive makes the *framework*
hold the tool call open until a human answers, so a forgetful tool author can't
create a silent-write path in the first place. The gap is **uniformity, not
safety.**

**Real iPix example.** `booking-agent.ts` says *"You NEVER confirm or approve a
booking — no confirm_booking tool exists."* That's genuinely safe, because safety
comes from a tool that doesn't exist. Compare `draftBulkAssetApproval`: it's safe
only because its own description says it returns a draft. Two different safety
models in one codebase; only one of them survives a careless PR.

---

## 4. What we're missing that we'd clearly use

| Feature | iPix screen it belongs on | Replaces |
|---------|--------------------------|----------|
| **HITL primitives** | every approval card | Per-tool `operatorConfirmed` flags + custom cards |
| **Generative UI** | `/app/brand/[id]` — agent renders the DNA EvidenceBlock inline | Chat text describing a component that already exists |
| **Shared agent state** | `/app/shoots/new` wizard | `PlannerWorkingMemory` manually mirrored into UI state |
| **Suggestions** | every screen | Golden rule says open with the next best action — currently hand-written in each agent's prompt |
| **Readables (v2)** | brand/shoot/CRM context injection | `brand-context.tsx` custom provider |
| **Threads** | operator chat history | Behind `NEXT_PUBLIC_COPILOTKIT_THREADS_ENABLED` |
| **Channels (Slack)** | booking approvals from a phone | Nothing |

**The suggestions gap is the sharpest one.** `CLAUDE.md` states the golden rule:
*"opens with the next best action … never a blank How can I help?"* Right now each
agent's system prompt hand-codes its opening message (see
`brand-intelligence-agent.ts` "## Opening message"). CopilotKit suggestions do this
declaratively, per page, without burning prompt tokens on every request.

---

## 5. Examples to adapt

From [github.com/CopilotKit/CopilotKit/tree/main/examples](https://github.com/CopilotKit/CopilotKit/tree/main/examples):

| Example | Adapt to | Why |
|---------|----------|-----|
| **Human-in-the-loop** | `/app/assets` bulk approval | Closest 1:1 match to `draftBulkAssetApproval` |
| **Generative UI / state machine** | `/app/shoots/new` wizard | Our 3-gate `shoot-wizard` workflow is a state machine already |
| **Shared state / CoAgents** | `/app/brand/[id]` | Brand context is injected today; shared state makes it bidirectional |
| **Slack channel** | booking approvals | An operator approving a booking from Slack is a real fashion-production workflow |

---

## 6. Progress tracker

| ID | Task | | % | Examine | Verify | Blocker |
|----|------|:-:|--:|---------|--------|---------|
| CK-01 | Runtime + Mastra bridge | 🟢 | 90 | `api/copilotkit` | `npm run dev` :3002 | — |
| CK-02 | Chat surfaces | 🟢 | 90 | `operator-panel.tsx` | browser smoke | — |
| CK-03 | Frontend tools (3) | 🟢 | 75 | `operator-panel.tsx:165` | `npm test` | — |
| CK-04 | HITL primitives | ⚪ | 0 | comments only | `grep -rn useHumanInTheLoop` | Not scoped |
| CK-05 | Generative UI | ⚪ | 0 | — | — | Not evaluated |
| CK-06 | Shared state | ⚪ | 0 | — | — | Not evaluated |
| CK-07 | Suggestions | ⚪ | 0 | prompts hand-code openers | — | Not scoped |
| CK-08 | Threads | 🔴 | 30 | `NEXT_PUBLIC_COPILOTKIT_THREADS_ENABLED` | env check | Flag off |
| CK-09 | Channels (Slack) | ⚪ | 0 | — | — | Not scoped |
| CK-10 | v1 import guard | 🟢 | 100 | ESLint rule + `copilotkit-v1-guard` agent | `npm run lint` | — |

---

## 7. Next 5 tasks

| # | Task | Effort | Why |
|:-:|------|:------:|-----|
| 1 | Port `/app/assets` bulk approval to CopilotKit HITL | M | Proves the pattern on the lowest-risk gate before booking/CRM |
| 2 | Replace hand-coded opening messages with suggestions | M | Delivers the golden rule declaratively; cuts prompt tokens |
| 3 | Generative UI for the brand DNA EvidenceBlock | M | The component exists — stop describing it in prose |
| 4 | Decide on threads (`NEXT_PUBLIC_COPILOTKIT_THREADS_ENABLED`) | S | A flag that's been off long enough to be forgotten |
| 5 | Evaluate Slack channel for booking approvals | L | Real fashion-production workflow; approvals happen off-desk |

---

## 8. Sources

- [CopilotKit docs](https://docs.copilotkit.ai/) · [reference](https://docs.copilotkit.ai/reference)
- [CopilotKit/CopilotKit](https://github.com/CopilotKit/CopilotKit) · [examples](https://github.com/CopilotKit/CopilotKit/tree/main/examples)
- [Generative UI guide 2026](https://www.copilotkit.ai/blog/the-developer-s-guide-to-generative-ui-in-2026)
- Local: `.claude/skills/copilotkit/` · `tasks/copilotkit/`
