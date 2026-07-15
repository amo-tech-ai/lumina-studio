# IPI-XXX · CF-TEST-010 — Verify Multi-Turn Tool Calling

**Task ID:** CF-TEST-010  
**Phase:** 4 — Production  
**Difficulty:** Medium  
**Risk:** Medium  
**Estimated time:** 2 hours  
**Dependencies:** Tasks CF-AI-020, CF-AI-021, CF-MIG-230 (agents must be migrated)

---

## Purpose

Verify that the exact scenario that currently fails with a 502 error now works correctly. This is the critical acceptance test for the entire architecture migration.

### The problem this solves

Today, when the Production Planner agent calls a tool (for example, `lookupChannelSpecs`) and then receives the tool result, the second request to the AI model fails with a 502 error. Workers AI rejects the request because the assistant message has `content: null` (required by the OpenAI spec when tool_calls are present), but the old custom gateway forwarded this raw. The new `workers-ai-provider` package handles this normalization automatically.

### Real-world iPix example

An operator asks the Production Planner: "Schedule a shoot for the summer collection on August 1st at 10am." The agent calls the `schedule_shoot` tool. The tool returns `{ shootId: 42, confirmed: true }`. The agent then needs to send this result back to the model so it can generate a natural language confirmation. Today, this second call 502s. After this task, it works.

---

## Recommended Setup Method

**CLI — run a specific test scenario and verify the outcome.**

This is a verification task, not a setup task. It uses the existing infrastructure (Tasks 1 through 6 must be complete) and tests a specific user journey.

---

## Official Links

| Resource | Link |
|----------|------|
| Function calling | https://developers.cloudflare.com/workers-ai/features/function-calling/ |
| Workers AI models (FC support) | https://developers.cloudflare.com/workers-ai/models/ |
| AI SDK tool calling | https://developers.cloudflare.com/workers-ai/configuration/ai-sdk/ |
| Workers AI errors | https://developers.cloudflare.com/workers-ai/platform/errors/ |

---

## The Test Scenario

### Step 1: Start the preview server

Command: `npm run preview`

### Step 2: Open the operator app

Open the preview URL in a browser and navigate to the operator dashboard.

### Step 3: Start a conversation with the Production Planner

Use the CopilotKit sidebar to talk to the `production-planner` agent.

### Step 4: Send a message that triggers a tool call

Type: "What are the channel specs for Instagram reels?"

**Expected behavior:** The agent calls the `lookupChannelSpecs` tool with "Instagram" and "reels" as parameters. The tool executes and returns the specifications.

### Step 5: Verify the tool result is used

**Expected behavior:** The agent receives the tool result and generates a response that includes the channel specs (for example, "Instagram reels should be 1080x1920 pixels, 9:16 aspect ratio, maximum 90 seconds...").

### Step 6: Send a follow-up message (this is the critical turn)

Type: "Great, now what about TikTok?"

**Expected behavior:** The agent calls the tool again for TikTok. The conversation now has tool-call history (assistant message with tool_calls, tool result message). The Workers AI provider correctly formats this history and sends it to the model. The model responds with TikTok specs.

**Critical check:** This must not produce a 502 error. This is the exact scenario that fails today.

### Step 7: Continue the conversation for 3 more turns

Continue asking about different platforms (YouTube Shorts, Pinterest, Twitter). Each turn should work without errors.

### Step 8: Test with the Brand Intelligence agent

Switch to the `brand-intelligence` agent and test a structured output scenario:

1. Ask: "Analyze the brand DNA of example.com"
2. The agent crawls the site (tool call)
3. The agent returns a structured brand profile
4. Ask a follow-up: "What are the strongest aspects of this brand?"
5. The agent references the previous analysis

This multi-turn structured output scenario must also work without errors.

---

## Automated Test

In addition to the manual test above, create an automated test that verifies the multi-turn tool calling flow.

### Test file location

`app/src/mastra/agents/__tests__/multi-turn-tools.test.ts`

### What the test verifies

1. A request with tools produces a tool_calls response
2. A follow-up request with tool results (role: tool messages) succeeds
3. The follow-up does not produce a 502 or any error
4. The model in the follow-up is the same tier as the first turn
5. The response references the tool result

Command to run: `npx vitest run src/mastra/agents/__tests__/multi-turn-tools.test.ts`

---

## Dashboard Verification

After running the test, check the AI Gateway dashboard:

1. Navigate to AI, then AI Gateway, then `ipix-prod`
2. Open the Analytics or Logs tab
3. Verify that the test requests appear
4. Check that all requests have a 200 status (not 502)
5. Verify the requests show the correct model and tier
6. Check the latency is reasonable (under 3 seconds per turn)

---

## Files Changed

### New file: app/src/mastra/agents/__tests__/multi-turn-tools.test.ts

This test file verifies the multi-turn tool calling scenario works end-to-end. It sends a request with tools, receives a tool_calls response, sends a follow-up with the tool result, and verifies the response succeeds.

### Updated file: app/src/mastra/agents/production-planner.ts (if needed)

If the production-planner agent needs any adjustments for tool calling compatibility with Workers AI models, update it here.

---

## Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| Workers AI binding (Task CF-AI-020) | Must be complete | |
| Workers AI provider (Task CF-AI-021) | Must be complete | |
| Agents migrated (Task CF-MIG-230) | Must be complete | At least production-planner and brand-intelligence |
| AI Gateway (Task CF-GW-001) | Recommended | For observability during testing |

---

## Tests

### Test 1: Single-turn tool call works

Send a message that triggers one tool call.

Pass criteria: The tool is called, the result is used, no error.

### Test 2: Multi-turn tool conversation works (critical)

Send a message, get a tool call, send the tool result back, get a response. Then send another message referencing the previous interaction.

Pass criteria: No 502 error. All turns succeed. The conversation is coherent.

### Test 3: Parallel tool calls work

Send a message that could trigger multiple tool calls in parallel.

Pass criteria: All tools are called, all results are processed, no error.

### Test 4: Structured output with tool history

After a tool call, request structured output (JSON).

Pass criteria: The structured output is valid and includes information from the tool result.

### Test 5: Error recovery

If a tool fails (mock a failure), verify the agent handles it gracefully.

Pass criteria: The agent reports the error to the user without crashing the conversation.

---

## Managed-First Verification & Definition of Done

*(Added 2026-07-14, per `tasks/cloudflare/Tasks/notes/04-improvements.md` — fill in at execution time, not in advance. A dashboard toggle alone does not satisfy "done.")*

| Verification gate | Result |
|---|---|
| Cloudflare dashboard feature available? | — |
| Wrangler command available? | — |
| Cloudflare API available? | — |
| Official package/module available? | — |
| Official GitHub repository checked? | — |
| Official example checked? | — |
| Official tutorial/recipe checked? | — |
| Existing iPix code already implements it? | — |
| Configuration-only solution possible? | — |
| Minimum integration code required | — |
| Custom implementation necessary? | — |
| Why custom code is unavoidable | — |
| Rollback method | — |
| Production evidence | — |

**Definition of done:** Configured + integrated + tested + observed in logs + failure tested + rollback tested + documented = complete.

---

## Acceptance Criteria

- [ ] The manual test scenario (Steps 1-8) completes without any 502 errors
- [ ] The automated test passes
- [ ] Multi-turn tool calling works for the Production Planner agent
- [ ] Multi-turn tool calling works for the Brand Intelligence agent
- [ ] The AI Gateway dashboard shows all requests as successful (200 status)
- [ ] No "content: null" errors appear in the logs
- [ ] The conversation is coherent across multiple turns
- [ ] Parallel tool calls work when tested

---

## Rollback

This task is a verification task, not a code change. If the test fails:

1. Do not proceed to production deployment
2. Investigate the failure using the AI Gateway logs and Workers observability
3. If the issue is in the workers-ai-provider, check for known issues on GitHub
4. If the issue is in the agent code, fix the agent
5. If the issue is fundamental (model incompatibility), consider using a different model tier

The test itself does not need rollback. The underlying code changes (from Tasks 1-6) are what would need to be rolled back if the test reveals a fundamental problem.

---

## Evidence Required

1. Screenshot of the CopilotKit sidebar showing a multi-turn tool conversation
2. Screenshot of the AI Gateway dashboard showing successful requests (200 status)
3. Output of the automated test passing
4. Video or screenshot series of the 3+ turn conversation with the Production Planner
5. Confirmation that no 502 errors appear in any log

---

## What Custom Code This Removes

This task replaces:

- The custom Gemini tool-message guard (IPI-528) — no longer needed, Gemini is dropped
- The custom multi-turn tool continuation logic (IPI-530) — handled by the provider
- The custom SSE streaming reconstruction — handled by the provider
- The custom parallel tool call handling — handled by the provider

These were all custom code tasks that are now unnecessary because the official `workers-ai-provider` package handles tool calling correctly.

---

## User Journey After This Task

> An iPix operator sits down to plan a major photoshoot. They talk to the Production Planner for twenty minutes, across fifteen messages. The agent calls six different tools: checking crew availability, confirming studio booking, looking up equipment specs, verifying weather forecasts, reviewing the brand guidelines, and calculating the budget. Each tool call works. Each multi-turn follow-up works. There are zero errors. The operator finishes with a complete, confirmed shoot plan. They did not think about the AI infrastructure once. It just worked. This is the experience that was impossible with the old custom gateway, and is now standard with Workers AI.
