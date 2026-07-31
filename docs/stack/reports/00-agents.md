---
title: "AI Agents — Scorecard & Use Cases"
version: "1.0"
lastUpdated: "2026-07-31"
status: Active
purpose: "All 9 iPix agents: what each does in real operator language, how it scores against Mastra best practice, and what's missing."
ssot: ../../../tasks/mastra/todo.md
verifiedAgainst: "app/src/mastra/index.ts · durable.ts · agents/* · lib/route-agent-map.ts"
verifiedAt: "2026-07-31"
scores: { core: 80, advanced: 20, overall: 56 }
---

# AI Agents — 56/100 (C+) 🟡

**One-line problem:** all 9 exist, route correctly, and scope their tools well.
None of them are measured.

---

## 1. Summary

| Agent | Route | Tools | Memory | Durable | Score | Grade | Dot |
|-------|-------|:-----:|:------:|:-------:|------:|:-----:|:---:|
| `production-planner` | `/app/shoots`, `/app/planner`, default | 13 | Working (typed) | ✅ | 82 | B+ | 🟢 |
| `brand-intelligence` | `/app/brand/*`, `/app/onboarding` | 6 | History | ❌ | 78 | B− | 🟡 |
| `crm-assistant` | `/app/crm` | 7 | History | ❌ | 76 | B− | 🟡 |
| `creative-director` | `/app/campaigns`, `/app/assets` | 3 | History | ✅ | 74 | C+ | 🟡 |
| `booking` | `/app/bookings`, `/app/model`, `/app/roster` | 3 | ❌ | ❌ | 72 | C+ | 🟡 |
| `model-match` | `/app/matching` | 3 | ❌ | ❌ | 68 | C+ | 🟡 |
| `visual-identity` | `/app/preview` | 1 | ❌ | ❌ | 64 | C | 🟡 |
| `public-marketing` | marketing widget | 0 | ❌ | ❌ | 62 | C | 🟡 |
| `social-discovery` | *(direct call)* | 1 | ❌ | ❌ | 48 | D+ | 🔴 |

**Scored on:** instruction quality · tool scoping · memory fit · HITL safety ·
error handling · **evals (0/20 for every agent)**.

Nobody scores above B+ because the eval component is zero across the board. Fix
that one thing and the whole column moves.

---

## 2. Real use cases

### `production-planner` — 82 🟢
> **Operator types:** *"Plan a spring campaign shoot for Aureli, IG and Amazon."*
>
> `navigateTo({section:"shoot-wizard"})` → `recommendShootType` → `planDeliverables`
> → **stops for approval** → `lookupShotReferences` → `generateShotListDraft` →
> `estimateShootBudget` → **stops for approval** → `saveApprovedShootDraft` →
> `approveShotList`

**Best in class here.** It's the only agent with typed working memory
(`PlannerWorkingMemory`), it's durable, it owns a workflow, and its tool list is
explicitly *subtractive* — `agents/index.ts:19` destructures booking, CRM and asset
tools **out** so a shoot chat can't create a booking.
**Missing:** a faithfulness scorer on shot angles. Its own instructions say *"never
invent shot angle names"* and nothing verifies that.

### `brand-intelligence` — 78 🟡
> **Opens with:** *"You're viewing Aureli — DNA score 71/100. Consistency is your
> weakest pillar. Ready to: [Plan a shoot] · [Create a campaign]"*

The best-written instructions in the repo — page context injected, HITL states
handled (`draft_ready`, `analysis_running`), score bands defined (<50 / 50–70 /
70–85 / 85+), and a rule that `brandId` is never asked for.
**Missing:** working memory (re-derives brand context every turn) and durability.

### `crm-assistant` — 76 🟡
> *"Is the Aureli deal at risk?"* → `scoreDealHealth(dealId)` → cites score,
> reasons, `evidenceIds`.

Wave-1/wave-2 split is disciplined, and the hard rule — *never set a deal to
won/lost, that's the human Approve card (IPI-367)* — is the right shape.
**Missing:** its instructions demand `evidenceIds` citations; nothing checks them.
That's a faithfulness scorer waiting to happen.

### `creative-director` — 74 🟡
> *"Why is this asset flagged?"* → `getAssetDnaEvidence` → `suggestAssetRetakes`

Only 3 tools, deliberately (IPI-261 · DESIGN-077). Explicitly forbidden from
re-scoring, because a re-audit would overwrite the operator's stored score.
**Missing:** `/app/campaigns` has **no campaign tools at all** — the agent is told
to "reason from context" until IPI-156. Half of its route is unimplemented.

### `booking` — 72 🟡
> *"Book Mira for the 14th"* → `checkTalentAvailability` → `draftBookingQuote` →
> operator confirms → `createBookingDraft({operatorConfirmed:true})`

**The best safety design in the codebase:** there is no confirm tool. Safety comes
from absence, not from instructions. Also honest about layering — treats conflicts
as UX warnings and names the DB `EXCLUDE` constraint as the real guarantee.
**Missing:** no memory, so a multi-turn negotiation loses context.

### `model-match` — 68 🟡
> *"Find me editorial models in Toronto under $2k"* → `searchTalentByFilters` →
> `computeTalentMatchScore` → `manageShortlist` (only if asked)

Refreshingly honest instruction: *"don't claim a semantic match — describe the
actual filters that matched."*
**Missing:** `talent_profiles.ai_embedding` exists in Postgres, unindexed and
unused. Wire it and the honesty caveat becomes unnecessary.

### `visual-identity` — 64 🟡
> Homepage URL → Firecrawl screenshot → Cloudinary → Gemini vision → structured
> `{primaryColors, typographyStyle, brandMood, …}`

Vision is pinned to Gemini regardless of `AI_PROVIDER` until `GROQ_MODEL_VISION`
clears a golden-eval gate — good discipline.
**Missing:** raw `fetch` to Firecrawl with a hand-rolled timeout
(`visual-identity.ts:52`) instead of a proper Mastra tool. Fails silently to `null`
on any error.

### `public-marketing` — 62 🟡
> Prospect on the marketing site asks *"do you shoot for Shopify?"*

Zero tools, zero memory, unauthenticated — correct by design. Dynamic model
resolution via `resolveAgentModel({tier:"fast"})` makes it the natural first
Cloudflare Workers candidate.
**Missing:** no safety/tone scorer on the one agent facing the public.

### `social-discovery` — 48 🔴
> `brandId` → `discoverSocialChannels` → writes to `brand_social_channels`

A one-line instruction, one tool, **no route** (it was removed from `/app/matching`
as "a placeholder route, never functionally exercised"), no memory, no HITL — and
it **writes to the database**.
**This is the weakest agent in the registry.** A write-capable agent with a
one-sentence prompt and no UI entry point. Either give it a home and a gate, or
demote it to a plain tool called by `brand-intelligence`.

---

## 3. Cross-cutting gaps

| Gap | Count | Impact |
|-----|------:|--------|
| No scorer / eval | **9 of 9** | Prompt edits are unmeasurable |
| No memory | 5 of 9 | Multi-turn context lost |
| Not durable | 7 of 9 | Tab close = lost thread |
| No agent network | — | Route map does handoff, so agents can't delegate to each other |
| No processors | 9 of 9 | No PII/guardrail layer, including on the public agent |
| Write tool without HITL primitive | `social-discovery` | Only prompt text stops it |

**The handoff gap is subtle but real.** `route-agent-map.ts` switches agents by
URL. So when `production-planner` needs talent, it can't ask `model-match` — the
operator has to navigate to `/app/matching` and re-explain. Mastra agent networks
exist for exactly this.

---

## 4. Progress tracker

| ID | Task | | % | Verify | Blocker |
|----|------|:-:|--:|--------|---------|
| AG-01 | 9 agents registered + routed | 🟢 | 95 | `cd app && npm test` | — |
| AG-02 | Tool scoping per agent | 🟢 | 90 | `agents/index.ts:19` | — |
| AG-03 | HITL write gates | 🟡 | 60 | prompt review | convention, not enforcement |
| AG-04 | Memory coverage | 🔴 | 35 | `memory.ts` | 5 of 9 have none |
| AG-05 | Durable coverage | 🔴 | 22 | `durable.ts` | 2 of 9 |
| AG-06 | Evals / scorers | ⚪ | 0 | `grep -r createScorer` | not scoped |
| AG-07 | `creative-director` campaign tools | 🔴 | 0 | `agents/index.ts:92` | IPI-156 |
| AG-08 | `social-discovery` home + gate | 🔴 | 20 | `route-agent-map.ts` | no route |

---

## 5. Next 5 tasks

| # | Task | Effort | Why |
|:-:|------|:------:|-----|
| 1 | Faithfulness scorer: `production-planner` shot list vs `lookupShotReferences` | M | Highest-consequence hallucination in the product |
| 2 | Decide `social-discovery`: give it a route + HITL gate, or demote to a tool | S | A write-capable agent with no UI is a liability |
| 3 | Working memory for `brand-intelligence` + `crm-assistant` | M | Both re-derive context every turn |
| 4 | Safety + tone scorer on `public-marketing` | S | Only public-facing agent; cheapest scorer to add |
| 5 | Evaluate a Mastra agent network for planner ↔ model-match handoff | L | Removes the "go to another screen and re-explain" step |

---

## 6. Sources

- [Mastra agents](https://mastra.ai/docs/agents/overview) · [memory](https://mastra.ai/docs/memory/overview) · [multi-agent orchestration](https://mastra.ai/blog/multi-agent-orchestration)
- Code: `app/src/mastra/index.ts` · `durable.ts` · `agents/*` · `lib/route-agent-map.ts`
