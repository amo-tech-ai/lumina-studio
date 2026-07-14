# IPI-XXX · CF-MIG-230 — Migrate All Agents to Workers AI

**Task ID:** CF-MIG-230  
**Phase:** 3 — Cleanup  
**Difficulty:** Medium  
**Risk:** Medium  
**Estimated time:** 2 days  
**Dependencies:** Tasks CF-AI-020, CF-AI-021, CF-GW-001, CF-GW-002 (new path must be ready)

---

## Purpose

Switch all nine Mastra agents from the old custom gateway path to the new Workers AI binding path. This is the migration task where each agent is individually verified to work with Workers AI models.

### Real-world iPix example

Every agent in iPix needs to work with Workers AI models instead of Gemini or Groq. The Brand Intelligence agent must still crawl a brand's site and return a structured DNA profile. The Production Planner must still create shot lists and call scheduling tools. The Creative Director must still generate campaign concepts. This task verifies that each agent produces equivalent or better output with the new models.

---

## Recommended Setup Method

**CLI — update agent files one at a time and test each.**

There is no dashboard or template option for agent migration. Each agent is migrated individually with verification before moving to the next.

---

## Official Links

| Resource | Link |
|----------|------|
| Workers AI model catalog | https://developers.cloudflare.com/workers-ai/models/ |
| Function calling | https://developers.cloudflare.com/workers-ai/features/function-calling/ |
| AI SDK integration | https://developers.cloudflare.com/workers-ai/configuration/ai-sdk/ |
| Agents using AI models | https://developers.cloudflare.com/agents/runtime/operations/using-ai-models/ |

---

## The Nine Agents to Migrate

| # | Agent | What it does | Uses tools? | Priority | Model tier |
|:-:|-------|-------------|:-----------:|:--------:|------------|
| 1 | public-marketing | Answers visitor questions on the marketing site | No | P0 (first) | fast |
| 2 | production-planner | Creates photoshoot plans | Yes | P0 | default |
| 3 | brand-intelligence | Analyzes brand DNA from website crawls | Yes | P1 | structured |
| 4 | creative-director | Generates campaign concepts and moodboards | Yes | P1 | default |
| 5 | marketing-chat | Deeper marketing conversations | No | P1 | fast |
| 6 | crm-assistant | Manages client relationships | Yes | P2 | default |
| 7 | exports-agent | Handles export operations | No | P2 | fast |
| 8 | shipping-agent | Manages shipping logistics | No | P2 | fast |
| 9 | brand-approval | Workflow approval scaffold | No | P3 | fast |

---

## Migration Steps (repeat for each agent)

### Step 0: Establish per-request env access (do this once, before any agent)

**Found 2026-07-14 (PR review) — every "Detailed Migration" step below originally said `resolveModel("tier", env)` without ever explaining where `env` comes from. This gap is real and blocks all nine agents equally, so it's fixed here once instead of nine times.**

The problem: every agent currently resolves its model at **module top level** — e.g. `app/src/mastra/agents/index.ts:9`: `const MODEL = resolveModel("default");`, evaluated once at import time, before any request exists. Cloudflare's `env.AI` binding is only available inside a request handler — it cannot be passed to a module-level call, no matter how the function signature is written.

**Fix — use Mastra's dynamic model resolution, not a static top-level constant.** Confirmed present in the installed `@mastra/core` version (`node_modules/@mastra/core/dist/agent/types.d.ts`): an agent's `model` field accepts a function `({ requestContext }) => model`, evaluated per-request instead of at import time.

```ts
// Before (module top-level, breaks with the new env-requiring resolveModel):
const MODEL = resolveModel("default");
export const productionPlannerAgent = new Agent({ model: MODEL, /* ... */ });

// After (per-request, env comes from requestContext):
export const productionPlannerAgent = new Agent({
  model: ({ requestContext }) => resolveModel("default", requestContext.get("cfEnv")),
  /* ... */
});
```

`requestContext.get("cfEnv")` requires something to have put it there first. Use `getCloudflareContext()` from `@opennextjs/cloudflare` (confirmed installed — `app/package.json` — but **not currently used anywhere in this codebase**, so this is new wiring, not a copy-paste from an existing pattern) at the point where a Mastra agent run is kicked off (the API route handler), and set `.env` onto the `requestContext` passed into that run.

**Acceptance for this step specifically:**
- [ ] `getCloudflareContext()` is called inside a request handler (never at module scope — same class of bug as `getMastra()`, see `CLAUDE.md`'s Mastra gotchas)
- [ ] `cfEnv` is set on Mastra's `requestContext` before any agent's dynamic `model` function runs
- [ ] At least one agent's dynamic `model` function successfully reads `requestContext.get("cfEnv").AI`
- [ ] `npx tsc --noEmit` passes with the dynamic `model` function typed correctly (no `any`)

### Step 1: Update the agent's model import

Each agent file in `app/src/mastra/agents/` currently imports from the old provider. Update it to import `resolveModel` from the new provider.ts (created in Task CF-AI-021), and convert its static `const MODEL = resolveModel(tier)` to the dynamic `model: ({ requestContext }) => ...` form from Step 0.

### Step 2: Set the correct model tier

Each agent should use the model tier from the table above. The `resolveModel` function takes the tier as a parameter, plus the `env` retrieved via Step 0's `requestContext.get("cfEnv")`.

### Step 3: Test the agent locally

Start the preview server and interact with the agent through the CopilotKit sidebar.

### Step 4: Verify tool calling works (for tool-using agents)

For agents that use tools (production-planner, brand-intelligence, creative-director, crm-assistant), verify that:
- The agent calls the correct tool
- The tool executes successfully
- The agent uses the tool result in its response
- Multi-turn conversations work (the scenario that currently 502s)

### Step 5: Deploy to staging

Deploy the updated agent to the staging environment and verify it works on the real Cloudflare runtime.

---

## Detailed Migration for Each Agent

**Every `resolveModel("tier", env)` call below means the Step 0 dynamic-model pattern — `model: ({ requestContext }) => resolveModel("tier", requestContext.get("cfEnv"))`, not a literal top-level call. Step 0 must be done first.**

### Agent 1: public-marketing (P0, no tools)

**Steps:**
1. Open the agent file
2. Update the model import to use `resolveModel("fast", env)`
3. Test locally: ask "What services does iPix offer?"
4. Verify the response is relevant and streams correctly
5. Deploy to staging and test again

**Pass criteria:** The agent returns a marketing-appropriate response in under 2 seconds.

### Agent 2: production-planner (P0, uses tools)

**Steps:**
1. Update the model to `resolveModel("default", env)`
2. Test locally: ask "Schedule a shoot for the summer collection on August 1st"
3. Verify the agent calls the scheduling tool
4. Verify the tool result is used in the response
5. Test multi-turn: continue the conversation to confirm no 502 on turn 2

**Pass criteria:** The agent successfully calls tools and the multi-turn conversation completes without errors. This is the critical test for the tool-calling bug.

### Agent 3: brand-intelligence (P1, uses tools, structured output)

**Steps:**
1. Update the model to `resolveModel("structured", env)`
2. Test: ask "Analyze the brand DNA of example.com"
3. Verify the agent returns a structured brand profile (not free text)
4. Verify the brand crawl tool is called
5. Compare the output quality to the old Gemini-based output

**Pass criteria:** The structured output matches the expected schema and the analysis quality is equivalent or better.

### Agent 4: creative-director (P1, uses tools)

**Steps:**
1. Update the model to `resolveModel("default", env)`
2. Test: ask "Create a moodboard for a luxury skincare campaign"
3. Verify the response includes visual direction, lighting, styling
4. Verify any creative tools are called correctly

**Pass criteria:** The creative direction is coherent and useful.

### Agent 5: marketing-chat (P1, no tools)

**Steps:** Same as public-marketing but with the marketing-chat tier.

### Agent 6: crm-assistant (P2, uses tools)

**Steps:**
1. Update the model to `resolveModel("default", env)`
2. Test: ask "Show me the relationship history with Nike"
3. Verify the CRM lookup tool is called
4. Verify the response references the tool result

**Pass criteria:** The agent correctly retrieves and presents CRM data.

### Agents 7-9: exports, shipping, brand-approval (P2-P3, minimal tools)

These agents are simpler. Update each to use `resolveModel("fast", env)` and verify they respond.

---

## Commands

### For each agent

Command to test locally: `npm run preview`

Command to run specific agent tests: `npx vitest run src/mastra/agents/<agent-name>.test.ts`

Command to deploy: `npm run deploy`

---

## Dashboard Steps

After deploying each agent, verify in the AI Gateway dashboard that requests appear for the correct model. The analytics should show:
- The model ID (for example, @cf/meta/llama-4-scout-17b-16e-instruct)
- The request count
- The latency
- The cost
- Whether it was served from cache

---

## Files Changed

| File | Change |
|------|--------|
| app/src/mastra/agents/public-marketing.ts | Update model import |
| app/src/mastra/agents/production-planner.ts | Update model import |
| app/src/mastra/agents/brand-intelligence.ts | Update model import |
| app/src/mastra/agents/creative-director.ts | Update model import |
| app/src/mastra/agents/marketing-chat.ts | Update model import |
| app/src/mastra/agents/crm-assistant.ts | Update model import |
| app/src/mastra/agents/exports-agent.ts | Update model import |
| app/src/mastra/agents/shipping-agent.ts | Update model import |
| app/src/mastra/agents/brand-approval.ts | Update model import |

---

## Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| Workers AI binding (Task CF-AI-020) | Must be complete | |
| Workers AI provider (Task CF-AI-021) | Must be complete | |
| AI Gateway (Task CF-GW-001) | Recommended | For observability during migration |
| Gateway features (Task CF-GW-002) | Recommended | Retries help during migration |

---

## Tests

### Test 1: Each agent responds

For each of the nine agents, send a test message and verify a response.

### Test 2: Tool-using agents call tools correctly

For production-planner, brand-intelligence, creative-director, and crm-assistant, verify tool calls work.

### Test 3: Multi-turn tool conversation (critical)

The exact scenario that 502s today must now work:

1. User sends a message that triggers a tool call
2. The agent calls the tool and gets a result
3. The user sends a follow-up message referencing the tool result
4. The agent responds correctly

This must work without any 502 errors.

### Test 4: Structured output works

The brand-intelligence agent must return structured data (JSON), not free text.

### Test 5: Output quality comparison

Compare the output of 3-5 test queries between the old Gemini path and the new Workers AI path. The Workers AI output should be equivalent or better.

---

## Acceptance Criteria

- [ ] public-marketing responds correctly
- [ ] production-planner creates plans and calls tools
- [ ] brand-intelligence returns structured brand profiles
- [ ] creative-director generates campaign concepts
- [ ] marketing-chat holds conversations
- [ ] crm-assistant retrieves client data
- [ ] exports-agent responds
- [ ] shipping-agent responds
- [ ] brand-approval responds
- [ ] Multi-turn tool calling works without 502 errors
- [ ] All agents are deployed to staging
- [ ] AI Gateway dashboard shows requests for all model tiers

---

## Rollback

Each agent can be individually rolled back by reverting its model import to the old provider. However, since the old provider code is deleted in Task CF-MIG-220, a full rollback requires reverting that task first.

**Recommended approach:** Migrate agents one at a time. If an agent has issues, pause its migration while keeping the already-migrated agents on the new path. This hybrid state is fully supported.

---

## Evidence Required

1. Screenshots of each agent responding in the CopilotKit sidebar
2. Screenshot of the multi-turn tool conversation completing without error
3. AI Gateway dashboard showing requests across all four model tiers
4. Comparison of output quality between old and new paths for at least 3 queries
5. Test results showing all agent tests pass

---

## What Custom Code This Removes

This task does not remove code — it rewires the agents to use the new path. The old provider code was already removed in Task CF-MIG-220.

---

## User Journey After This Task

> An iPix operator logs in and uses the Production Planner to schedule a complex multi-day fashion shoot. The agent calls five different tools (crew scheduling, location booking, equipment rental, weather check, wardrobe confirmation). Each tool call works. The conversation spans fifteen messages. There are zero 502 errors. The agent produces a complete shoot plan with dates, times, locations, crew assignments, and equipment lists. The operator is amazed at how smoothly it went. The engineering team checks the AI Gateway dashboard and sees the entire conversation: fifteen requests, five tool calls, total cost $0.08, average latency 1.2 seconds. No custom code was involved in any of it.
