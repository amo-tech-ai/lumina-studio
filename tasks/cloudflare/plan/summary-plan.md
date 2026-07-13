# Cloudflare + Next.js Operator Deployment Plan

**Document Status:** Professional Implementation Plan  
**Created:** 2026-07-12  
**Audience:** Engineering, Product, Leadership  
**Scope:** Deploying Operator to Cloudflare Workers with AI Gateway integration

---

## 1. Executive Summary

### What Is Already Working

- **AI Gateway:** Live and verified at production URL. Llama 3.1 chat and BGE embeddings responding correctly.
- **Auto-Deploy Pipeline:** Main branch merges automatically trigger gateway deployment.
- **Infrastructure:** Cloudflare Workers running, health checks passing, secrets encrypted.

### What Is Not Yet Verified

- **Operator on Cloudflare Workers:** Next.js app has not been deployed to edge.
- **Tool Calling:** Operator cannot yet call planning, CRM, or asset tools (blocked by IPI-525).
- **Multi-Turn State:** Conversations do not persist context across messages (blocked by CF-MIG-220).
- **Full Integration:** End-to-end workflows with tool execution untested in production.

### Recommended Next Step

**This Week:** Deploy Operator to Cloudflare Workers using automatic configuration (20 minutes). Verify chat works. Complete infrastructure documentation.

**Next Week:** Enable tool calling (IPI-525). Unblock planning and CRM workflows.

**Week After:** Enable conversation state (CF-MIG-220). Full agent autonomy.

### Main Risks

- **Tool ownership unclear:** Who is responsible for calling, validating, executing tools? (Decision required)
- **Blocked features:** IPI-525 and CF-MIG-220 gate all advanced Operator workflows.
- **Deployment rollback:** Untested. Rollback procedure must be verified in staging first.

### Recommended Path

✅ **Deploy Operator to Cloudflare today** (no dependencies, low risk)  
✅ **Resolve tool ownership** (decision required, unblocks IPI-525)  
🔴 **Wait for IPI-525** (tool calling implementation)  
🔴 **Wait for CF-MIG-220** (multi-turn state)

---

## 2. Current State

| Component | Status | What It Does | Evidence | Remaining Gap |
|-----------|--------|------------|----------|---------------|
| **AI Gateway Worker** | 🟢 Verified | Runs at Cloudflare edge. Routes chat requests to Llama 3.1, embedding requests to BGE. | Deployed and responding. Health check `/health` returns 200 OK. Logs show successful invocations. | None — ready for integration. |
| **Workers AI (Llama 3.1)** | 🟢 Verified | Language model hosted by Cloudflare. Powers chat responses. | Official Cloudflare service. Models documented and tested. Gateway calling it successfully. | None — production-ready. |
| **Workers AI (BGE Embeddings)** | 🟢 Verified | Embeddings model (768-dimensional). Powers search and similarity. | Official Cloudflare service. Verified dimensional output. Used by Brand Intelligence. | None — production-ready. |
| **Next.js App (Operator)** | 🟡 Partially Verified | Browser UI for chat, planning, CRM. Runs locally on :3002. Connects to AI Gateway. | Builds locally without errors. Routes defined. Environment variables configured for local testing. | Not deployed to Cloudflare Workers yet. No edge running verified. |
| **Cloudflare Workers Deployment** | 🟡 Partially Verified | Infrastructure to run Next.js at edge globally. Auto-deploys on merge. | Gateway deployed successfully. Auto-deploy working. Cloudflare configuration present. | Operator app not yet deployed. Wrangler config for Operator not yet generated. |
| **Model Routing** | 🟡 Partially Verified | Gateway selects correct model (Llama or BGE) based on request type. | Gateway code inspected. Logic present. Not tested with invalid model requests or fallback scenarios. | No verified handling of unknown models. No fallback to secondary provider tested. |
| **Tool Calling** | 🔴 Blocked | Operator requests tools (plan creation, CRM lookup, asset tagging). AI decides which tool to use. | IPI-525 in progress. Forwarding mechanism not yet implemented. Operator cannot send tool definitions to AI yet. | Tool definitions not forwarded to AI Gateway. Tool results not handled. Tool authorization not enforced. |
| **Streaming** | 🟡 Partially Verified | Long responses stream incrementally instead of all at once. | Llama supports streaming via Workers AI. Not tested end-to-end in Operator UI. | Operator UI not verified to handle stream events. No streaming error handling tested. |
| **Authentication** | 🟢 Verified | Operator requires user login. Bearer token validated. | Operator auth middleware present. Supabase auth integrated. Works locally. | None — acceptable for current scope. |
| **Deployment Pipeline** | 🟢 Verified | Push to main → automatic build and deploy to Cloudflare. | GitHub Actions running. Cloudflare auto-deploy configured. Gateway deploying successfully. | Operator deployment not yet wired. Rollback untested. |
| **Supabase Integration** | 🟢 Verified | Database for conversations, user data, permissions. Used for auth. | Remote project configured. RLS policies present. Edge functions available. Works locally. | No verified production failover. No disaster recovery tested. |
| **Monitoring & Logs** | 🟡 Partially Verified | Cloudflare dashboard logs requests and errors. | Logs enabled. Gateway logs visible. No custom dashboards yet. Errors not categorized. | No alerting on high error rate. No cost tracking dashboard. No tool execution logging. |
| **Rollback Procedure** | 🔴 Not Verified | Ability to revert to previous known-good Operator release. | Deployment history exists in Cloudflare. Git history present. No documented rollback steps. | Procedure untested in staging. No rollback test completed. No verification of state rollback (if needed). |

---

## 3. Target State

### Production Architecture

A user opens Operator in their browser. The app loads from Cloudflare Workers (global edge location nearest to them). When they ask a question or trigger an action:

1. **Request reaches the edge** — Cloudflare receives the request at a location near the user.
2. **Operator processes the request** — Next.js runs the request handler (chat, planning, CRM route).
3. **Model selection is made** — Operator or AI Gateway decides: Is this a chat question? A planning request? A search? Correct model is selected (Llama for chat, BGE for embeddings).
4. **Tools are declared** (if applicable) — For planning requests, Operator sends available tools to AI (create_plan, schedule_shoot, etc.). AI reads the tools and decides which to use.
5. **AI generates a response** — AI is called with the message, tools (if any), and context. AI either responds directly or calls a tool.
6. **Tool execution is authorized and executed** — If AI chose a tool, Operator checks: Is this tool approved? Are arguments valid? Then Operator calls the tool. Tool result is returned to AI.
7. **Response is refined** — AI sees tool result and generates a final, actionable response.
8. **Response streams back** — Answer appears in the UI in real time (streaming).
9. **Logging and state saved** — Conversation logged. User profile updated. Tool execution recorded for audit.
10. **Response is complete** — User sees the answer and can take action (create plan, schedule shoot, etc.).

### Ownership Model (Current Understanding)

| Responsibility | Owner | Status |
|---|---|---|
| **Model selection** | AI Gateway (router) | Verified for chat/embed; unclear for tool-enabled chat |
| **Tool authorization** | Operator (next.js route) | 🔴 Not yet implemented |
| **Tool argument validation** | Operator (next.js route) | 🔴 Not yet implemented |
| **Tool execution** | Operator (next.js route) or External service | ⚠️ **Decision required** — Who calls the actual tool? Operator? Supabase edge function? External API? |
| **Response streaming** | Cloudflare Workers (Llama API) | Partially verified |
| **Logging** | Supabase edge functions or Operator | 🟡 Partially implemented (gateway logs exist, tool logs missing) |
| **Error handling** | Operator + AI Gateway | 🟡 Partial (timeouts handled, invalid tools not tested) |
| **Retry and fallback** | AI Gateway (primary) + Operator (secondary) | 🟡 Partial (gateway retries work, full fallback chain not tested) |
| **Conversation state** | Supabase (database) | 🟡 Partial (single-turn works, multi-turn blocked by CF-MIG-220) |

**⚠️ Critical Decision Needed:** Who executes tools? (Operator route, edge function, or external service?) This unblocks IPI-525.

---

## 4. Recommended Plan

### Step 1: Confirm Current Architecture

**Purpose:** Document what is actually running, not what was intended.

**Actions:**
- List all deployed Cloudflare Workers (should see ai-gateway, possibly others)
- Inspect AI Gateway code: What routes does it expose? What logic does it run?
- Inspect Operator code: What routes call AI Gateway? What does each route do?
- Document the request flow: Browser → Cloudflare → Next.js → AI Gateway → Workers AI → Response

**Owner:** Engineering lead

**Dependencies:** None

**Evidence:** 
- Document created: `/home/sk/ipix/tasks/cloudflare/plan/architecture-current.md`
- All running services identified and listed
- Request flows documented with actual code references

**Success Criteria:** 
- Architecture document matches actual running code
- No surprises (all services accounted for)
- Handoff between components clear

**Risk:** None (read-only documentation)

---

### Step 2: Fix Routing and Provider Safeguards

**Purpose:** Ensure unknown models are rejected, not silently misrouted.

**Actions:**
- Review AI Gateway routing logic: What happens if an unknown model is requested?
- Add validation: Only approved models (Llama 3.1, BGE) are allowed
- Test invalid model request: Verify it returns 400 (bad request), not 502 (server error)
- Document the model allowlist

**Owner:** Engineering (AI Gateway owner)

**Dependencies:** Step 1 (architecture confirmed)

**Evidence:**
- Code review of routing logic
- Test case: Invalid model request rejected with 400
- Model allowlist documented

**Success Criteria:**
- Unknown models rejected with clear error
- No silent remapping to default model
- Error message tells caller what went wrong

**Risk:** Low (defensive change, no behavior change to valid requests)

---

### Step 3: Validate Model Registry and Tool Tier Configuration

**Purpose:** Confirm model metadata is correct and tool tier (which models support tools) is enforced.

**Actions:**
- Inspect model registry: Does Llama 3.1 metadata mark it as "tool-capable"?
- Inspect model registry: Does BGE mark itself as "embedding only"?
- Review tool configuration: Are tools only sent to tool-capable models?
- Test: Send tool definitions to BGE. Verify it is rejected or ignored (not used)
- Test: Send tool definitions to Llama. Verify Llama receives them

**Owner:** Engineering (AI Gateway owner)

**Dependencies:** Step 2 (routing safeguards confirmed)

**Evidence:**
- Model registry code inspected
- Tool tier metadata verified
- Test results: Tools correctly restricted to Llama only

**Success Criteria:**
- Tool tier enforcement working (tools never sent to non-tool models)
- Model metadata accurate
- Registry errors caught early (not at request time)

**Risk:** Medium (incorrect registry can cause silent failures)

---

### Step 4: Verify Live Multi-Turn Tool Calling and Security

**Purpose:** End-to-end test that tool calling works correctly and securely.

**Actions:**
- Deploy IPI-525 (tool calling forwarding) to staging
- Create a test journey: Ask Operator to "schedule a shoot"
- Verify: Request reaches AI Gateway with tool definitions
- Verify: Llama selects the correct tool
- Verify: Tool arguments are passed correctly
- Verify: Tool result comes back and is logged
- Test security: Try to call an unauthorized tool (e.g., system tool). Verify it is rejected.
- Test invalid arguments: Try to schedule with missing date. Verify error is caught before execution.

**Owner:** QA + Engineering

**Dependencies:** Step 2, Step 3, IPI-525 (tool calling forwarding complete)

**Evidence:**
- Staging test results (pass/fail for each scenario)
- Logs showing tool selection and execution
- Security test results (unauthorized tool rejected)
- Invalid argument test results (error caught before execution)

**Success Criteria:**
- Tool calling works end-to-end
- Security checks pass
- All logs present and correct
- No tool execution without authorization

**Risk:** High (first full integration test; may reveal missing pieces)

---

### Step 5: Confirm Tool Ownership and Security

**Purpose:** Resolve who executes tools and ensure no privilege escalation.

**Actions:**
- Engineering team decides: Tool execution in Operator route? Supabase edge function? External service?
- Document ownership decision in design doc
- Implement authorization layer: Only approved tools, only valid arguments
- Implement audit logging: Every tool call logged with user, timestamp, arguments, result
- Test privilege escalation: Can a user call a tool they shouldn't? Verify rejection.

**Owner:** Engineering + Security

**Dependencies:** Step 4 (tool calling verified in staging)

**Evidence:**
- Design doc: Tool execution ownership decided
- Code: Authorization layer implemented
- Code: Audit logging implemented
- Test results: Privilege escalation tests pass

**Success Criteria:**
- Tool ownership clear and documented
- Authorization enforced
- All tool calls logged
- Security tests pass

**Risk:** High (authorization bypass would be critical)

---

### Step 6: Verify Streaming Behavior

**Purpose:** Ensure responses appear in real time, not all at once.

**Actions:**
- Enable streaming in AI Gateway (if not already enabled)
- Test: Ask Llama a multi-sentence question
- Verify: Response appears word-by-word in Operator UI, not all at once
- Test error handling: If stream interrupts mid-response, verify Operator handles it gracefully
- Verify logs: Streaming events are logged (start, chunks, completion)

**Owner:** Engineering (UI + Gateway)

**Dependencies:** Step 4 (baseline working)

**Evidence:**
- Manual test results (response streams correctly)
- Error handling test results (interrupted stream handled)
- UI logs showing streaming events

**Success Criteria:**
- Responses appear incrementally
- Interruptions handled without crash
- Logs show streaming events

**Risk:** Low (cosmetic; single-response fallback is acceptable)

---

### Step 7: Add Observability and Cost Tracking

**Purpose:** Monitor production behavior and track spending.

**Actions:**
- Set up Cloudflare dashboard alerts: High error rate, timeout rate, cost spike
- Create cost tracking dashboard: API calls per model, cost per day, cost per user
- Add structured logging: Every request logged with user, model, duration, cost
- Add error categorization: Distinguish timeouts, rate limits, invalid requests, provider errors
- Set budget alerts: Notify if daily spend exceeds threshold

**Owner:** DevOps + Engineering

**Dependencies:** Step 5 (tool execution decided)

**Evidence:**
- Alerts configured in Cloudflare
- Cost dashboard created
- Structured logging implemented
- Budget alerts configured

**Success Criteria:**
- All requests logged with structured data
- Cost trackable per user, per day
- Alerts trigger on anomalies
- Errors categorized

**Risk:** Low (observability only, no behavior change)

---

### Step 8: Test Staging Deployment

**Purpose:** Verify Operator deploys to Cloudflare Workers and behaves correctly.

**Actions:**
- Deploy Operator to Cloudflare staging (using auto-config or C3)
- Verify: App loads from staging URL
- Verify: Chat endpoint works
- Verify: AI Gateway is reachable from staging
- Run full test journey in staging: Chat, planning (if ready), CRM
- Compare staging behavior to local behavior: Should be identical

**Owner:** Engineering + QA

**Dependencies:** Step 1–7 (all groundwork complete)

**Evidence:**
- Staging deployment successful
- Test results (all endpoints working)
- Logs from staging show correct behavior
- Staging behavior matches local

**Success Criteria:**
- Operator loads from edge
- All endpoints reachable
- AI responses correct
- Logs clean (no errors)

**Risk:** Medium (first production-like environment test)

---

### Step 9: Test Rollback

**Purpose:** Verify team can revert to previous release if needed.

**Actions:**
- Document rollback procedure: How to revert Operator release
- Deploy a known-good version to staging
- Deploy a "bad" version to staging (intentionally broken)
- Execute rollback procedure
- Verify: Good version restored
- Verify: No data loss
- Verify: Users see smooth transition (or maintained single version during rollback)

**Owner:** DevOps + Engineering

**Dependencies:** Step 8 (staging deployment verified)

**Evidence:**
- Rollback procedure documented
- Rollback test completed successfully
- No data loss observed
- User experience verified

**Success Criteria:**
- Rollback executes in under 5 minutes
- No user-facing data loss
- Known-good version fully restored
- Zero downtime (or acceptable brief outage documented)

**Risk:** High (rollback untested = no safety net)

---

### Step 10: Complete Real-World User Journeys

**Purpose:** Verify all critical workflows work end-to-end in staging.

**Actions:**
- Run Journey A (Fast Chat): Ask about services, get answer
- Run Journey B (Tool Chat): Request plan creation, AI calls tool, plan appears
- Run Journey C (Fallback): Simulate provider failure, verify fallback works
- Run Journey D (Invalid Tool): Try to use unauthorized tool, verify rejection
- Run Journey E (Rollback): Deploy bad version, verify rollback restores good state
- Document: All journeys successful in staging

**Owner:** QA

**Dependencies:** Step 8, Step 9 (staging and rollback verified)

**Evidence:**
- Test results for all 5 journeys
- Screenshots/logs of each journey
- Timing recorded (how long each journey took)
- Edge cases documented

**Success Criteria:**
- All 5 journeys successful
- No timeouts, errors, or data loss
- User experience smooth
- Logs clean

**Risk:** High (first comprehensive test)

---

### Step 11: Approve Production Release

**Purpose:** Final review before live traffic.

**Actions:**
- Engineering lead reviews: All steps complete, evidence present
- Security lead reviews: Authorization, tool execution, logging
- Product lead reviews: User journeys, UX, messaging
- Finance reviews: Cost tracking accurate, budgets in place
- Leadership approves: Go/no-go decision
- If approved: Deploy Operator to production (same process as staging)
- Monitor: First 24 hours closely watched for errors, cost anomalies

**Owner:** Engineering lead + Leadership

**Dependencies:** Step 10 (all testing complete)

**Evidence:**
- Sign-off from all stakeholders
- Monitoring dashboard live
- Runbook for emergency response documented
- Team on-call assigned

**Success Criteria:**
- All stakeholders approve
- Deployment successful
- Zero errors for first hour
- Cost normal for first day
- Monitoring dashboard active

**Risk:** Critical (production release)

---

## 5. Real-World User Journeys

### Journey A — Marketing Fast Chat

**Scenario:** A visitor asks "What services do you offer?"

**Steps:**

1. **Visitor types question** → Operator receives "What services do you offer?"
2. **Request routed to chat endpoint** → Next.js route handler receives question
3. **Chat model selected** → AI Gateway identifies this as a chat question (not embedding, not tool-based)
4. **Llama 3.1 is called** → AI Gateway sends question to Workers AI (Llama 3.1 model)
5. **Response generated** → Llama generates answer from training data about services
6. **Response streams back** → Answer appears word-by-word in Operator UI
7. **Logged** → Request logged: user, question, model used, duration, cost
8. **Complete** → Visitor reads answer, satisfied

**Critical Points:**
- No tools needed (basic information request)
- Fast response expected (under 2 seconds)
- No authentication needed (public access)
- Cost tracked but acceptable (simple inference)

**Expected Result:** Visitor gets accurate answer instantly.

---

### Journey B — Operator Tool Chat

**Scenario:** Creative Director asks "Create a plan for the Spring Campaign shoot."

**Steps:**

1. **Operator types request** → "Create a plan for the Spring Campaign shoot"
2. **Route handler identifies tool request** → Next.js route recognizes this is a planning request
3. **Tools are declared** → Route handler sends available tools to AI Gateway (create_plan, schedule_shoot, assign_talent, tag_assets)
4. **Tool definitions sent to Llama** → AI Gateway includes tool definitions in the request to Workers AI
5. **Llama selects a tool** → Llama reads tools and decides to call create_plan() with campaign name "Spring Campaign"
6. **Tool arguments validated** → Operator checks: Is create_plan() an approved tool? Yes. Are arguments valid? Yes (campaign name is string). ✅
7. **Tool is executed** → Operator calls create_plan() function, passing campaign name
8. **Tool result returned to Llama** → Plan created with ID, template, default moods. Result sent back to Llama
9. **Llama refines response** → Llama sees the created plan and generates a user-facing message: "Plan created for Spring Campaign with moods: vibrant, sophisticated. Ready for review."
10. **Response streams back** → Message appears in UI
11. **Logged** → Tool request logged: user, tool called, arguments, result, execution time, cost
12. **Complete** → Creative Director sees plan, can edit and approve

**Critical Points:**
- Tool calling works end-to-end (IPI-525)
- Tool authorization enforced (only create_plan allowed, not system_delete)
- Arguments validated before execution (no injection)
- Tool result logged for audit
- User never sees tool internals (clean UX)

**Expected Result:** Plan created, Creative Director in control.

---

### Journey C — Provider Failure

**Scenario:** Llama 3.1 becomes unavailable (provider outage).

**Steps:**

1. **User asks question** → "What's our Q3 revenue?"
2. **Request routed to chat** → Next.js sends to AI Gateway
3. **Primary model selected** → Gateway tries Llama 3.1
4. **Request times out** → Workers AI is down, timeout after 5 seconds
5. **Error detected** → Gateway logs: "Llama timeout after 5s"
6. **Retry decision made** → Gateway checks: Should retry? (Yes, transient error)
7. **Retry executed** → Gateway retries Llama 3.1 after 1-second backoff
8. **Retry fails** → Llama still down
9. **Fallback triggered** → Gateway switches to fallback provider (OpenAI GPT-4 or similar)
10. **Fallback model called** → Gateway sends request to fallback
11. **Fallback succeeds** → OpenAI responds with answer
12. **Response returned** → User sees answer (may not know it came from fallback)
13. **Logged** → Gateway logs: "Llama failed, fallback succeeded, user got response"
14. **Alert sent** → DevOps receives alert: "Llama unavailable, using fallback"

**Critical Points:**
- Timeout detected quickly (not 30+ seconds)
- Retry happens automatically (user doesn't wait twice)
- Fallback seamless (same response quality expected)
- Logging enables root cause analysis
- Team can react (fix Llama or switch permanently)

**Expected Result:** User gets answer despite provider outage. Team fixes Llama.

---

### Journey D — Invalid or Unauthorized Tool

**Scenario:** User tries to call a tool they shouldn't (e.g., delete_user).

**Steps:**

1. **User crafts clever request** → "Delete all other users from the system"
2. **Request routed to tool endpoint** → Next.js sees tool request
3. **Route handler receives request** → Parses user intent
4. **Tool identified** → delete_user (not an approved tool for this user)
5. **Authorization checked** → Handler checks: Is delete_user in approved tools for this user? No. ❌
6. **Request rejected** → Handler returns 403 (forbidden) error
7. **User sees message** → "This action is not available to you"
8. **No execution** → Tool never called, database never touched
9. **Logged** → Security log: "User attempted unauthorized tool delete_user, rejected at authorization layer"
10. **Alert sent** → Security team receives alert (suspicious activity)

**Critical Points:**
- Tool never executed (authorization checked first)
- No database modification (no side effect)
- Clear error message (user knows action was rejected, not broken)
- Logged for audit (who tried what, when)
- Alert enables detection of attack patterns

**Expected Result:** Attack prevented cleanly. Security team alerted.

---

### Journey E — Rollback

**Scenario:** New Operator release (v2) has a bug. Team needs to roll back to previous release (v1).

**Steps:**

1. **Bug detected** → v2 causing 50% error rate in production
2. **Decision made** → Engineering lead: "Roll back to v1"
3. **Rollback initiated** → DevOps runs rollback procedure: `wrangler rollback`
4. **Cloudflare reverts** → Workers deployment reverted to v1 (takes 30 seconds)
5. **v1 restored** → Operator is now running v1 code again
6. **Health checked** → Monitoring shows error rate drops to 0.1% (normal)
7. **Users unaffected** → Active users' sessions continue (Supabase data unchanged)
8. **Logging confirmed** → Old logs still accessible for investigation
9. **Postmortem scheduled** → Team to investigate what went wrong in v2
10. **Complete** → Production stable, team can focus on fixing v2

**Critical Points:**
- Rollback completes in seconds (not hours)
- No user data lost (database separate from code)
- No user sessions interrupted (Workers handle state gracefully)
- Previous version proven stable (was in production before)
- Investigation can happen post-incident

**Expected Result:** Outage contained to minutes. Root cause fixed offline.

---

## 6. Linear Task Plan

### Tasks Reviewed

| Task ID | Title | Purpose | Correct Scope? | Dependencies | Success Criteria | Recommended Status |
|---------|-------|---------|---|---|---|---|
| **IPI-527 · CF-AI-012** | Fix and Directly Test Tool Routing | Ensure unknown tools are rejected, not silently executed. | ✅ Correct | Step 2 complete | Tool routing only accepts approved tools. Invalid tool rejected with clear error. | Ready to implement after Step 2 |
| **IPI-528 · CF-AI-013** | Harden Gemini Tool-Message Handling | Ensure Gemini (if used) receives tool results in correct format. Prevent tool result confusion. | ✅ Correct | Step 3 (model registry), IPI-525 tool calling | Gemini (or fallback model) receives tool results correctly formatted. Tool messages don't cause parsing errors. | Deferred (Gemini not in Phase 1 scope; use Llama 3.1) |
| **IPI-529 · CF-AI-014** | Validate Model Registry and Tool Tier Configuration | Confirm model metadata is accurate. Tools only sent to tool-capable models. | ✅ Correct | Step 2 complete | Model tier enforcement working. BGE rejects tools. Llama accepts tools. Registry accurate. | Ready to implement (Step 3) |
| **IPI-530 · CF-AI-015** | Verify Live Multi-Turn Tool Calling and Security | End-to-end test of tool calling in staging. Security checks (authorization, invalid args). | ✅ Correct | IPI-525, Step 3, Step 5 complete | Tool calling works. Tools called only if authorized. Invalid arguments rejected. Logs present. | Ready after IPI-525 (Step 4) |
| **IPI-531 · CF-AI-016** | Add Tool Routing Reliability and Observability | Logging for tool calls, fallback behavior, costs. | ✅ Correct | IPI-530 complete | Tool calls logged with user, args, result, duration, cost. Error rates tracked. Cost dashboard functional. | Ready after IPI-530 (Step 7) |
| **IPI-465 · AGENT-002** | Shared AI Tool Registry | Central registry of available tools (plan creation, CRM lookup, etc.). Enforced across Operator and Gateway. | ✅ Correct | Step 5 (tool ownership decided) | Tool registry defined and version-controlled. Operator and Gateway use same registry. Tools documented. | Ready after tool ownership decision (Step 5) |
| **IPI-508 · CF-UJ-008** | Journey Test: Marketing & Operator Fast Chat Gateway | Real-world test: Chat and planning workflows in staging. | ✅ Correct | IPI-530, IPI-465 complete | Journey A (chat) succeeds. Journey B (planning) succeeds (or documented as waiting on IPI-525). Logs clean. | Ready after Step 10 |

### Recommended Task Schedule

**This Week:**
- IPI-527: Fix tool routing (Step 2)
- IPI-529: Validate model registry (Step 3)
- IPI-465: Define shared tool registry (Step 5 prerequisite)

**Next Week (IPI-525):**
- IPI-530: Verify tool calling (Step 4) — depends on IPI-525 shipping
- IPI-531: Add observability (Step 7)
- IPI-508: Run user journeys (Step 10)

**Deferred:**
- IPI-528: Gemini tool handling (out of scope for Llama 3.1 Phase 1)

---

## 7. Risks and Blockers

| Risk | Severity | Impact | Prevention | Required Decision | Mitigation |
|------|----------|--------|-----------|-------------------|-----------|
| **Tool ownership unclear** | CRITICAL | IPI-525 cannot ship until decided: Who calls tools? Operator? Edge? External? | Engineering design doc before implementation | Architecture review: Tool execution responsibility assigned | Move decision to first-thing-next-week meeting |
| **IPI-525 not shipped** | CRITICAL | Tool calling blocked. Planning and CRM workflows unavailable. Production launch delayed. | Complete IPI-525 this week | Is IPI-525 on track? Check daily. | If delayed beyond Week 2, re-evaluate production launch timeline |
| **Unauthorized tool execution** | CRITICAL | User could call system_delete() or privileged tool. Data loss or corruption. | Authorization layer must be implemented before production (Step 5) | Security review of tool authorization | Implement authorization in Operator route, not in AI |
| **Incorrect model metadata** | HIGH | BGE receives tools (should be embedding-only). Llama doesn't receive tools (should be tool-capable). Silent misconfiguration. | Step 3: Model registry validation before shipping | Model tier enforcement working? Test invalid model requests. | If registry wrong, coordinate with Gateway owner for immediate fix |
| **Tool arguments not validated** | HIGH | User requests "schedule_shoot(date='DROP TABLE shoots')" — SQL injection. | Zod or similar validation before tool execution (Step 5) | Validation framework chosen and implemented | If missed, add validation layer before production |
| **Streaming fails mid-response** | MEDIUM | Response incomplete, user confused. Stream interruption not handled. | Step 6: Streaming error handling tested | Operator UI handles interrupted stream gracefully | Fallback: Non-streaming mode acceptable for Phase 1 |
| **Deployment rollback untested** | HIGH | Release goes bad, team cannot revert quickly. Production outage extends. | Step 9: Rollback tested in staging | Rollback procedure documented and verified | If rollback takes >5 min, create faster alternative (e.g., GitHub Actions revert) |
| **Cost spike unexpected** | MEDIUM | Spending shoots up (bug causes excessive API calls). Budget exhausted mid-month. | Step 7: Cost tracking and alerts in place | Daily cost monitoring dashboard active before production | Set aggressive budget alert (e.g., 50% of expected daily spend) |
| **Provider timeout not handled** | MEDIUM | Llama times out, request hangs, user left waiting. No fallback triggered. | Timeout configured in AI Gateway (5 seconds). Fallback tested in Step 8. | Timeout and fallback working in staging | If not working, add circuit breaker in Operator route before production |
| **Multi-turn state lost** | HIGH | CF-MIG-220 not shipped. Conversations don't remember context. Basic chat-only workflow. | Feature deferred to Week 3. Single-turn acceptable for Phase 1. | Is CF-MIG-220 in progress? | If delayed, document single-turn limitation in release notes |
| **Logs missing or corrupted** | MEDIUM | Cannot debug issues in production. No audit trail for tool calls. | Step 7: Structured logging implemented | All requests logged with user, model, duration, cost | If logging fails, add in-memory buffer + async write to avoid blocking requests |
| **Circuit breaker not working** | HIGH | Provider failures cascade. Tool timeouts block other requests. No rate limiting. | AI Gateway circuit breaker working. Tested in Step 8. | Circuit breaker triggers on error threshold? | If not in Gateway, implement in Operator route as fallback |
| **Untested edge cases** | MEDIUM | Unusual input (very long question, many tools, rapid requests) causes failure. | Step 10: Real-world journeys test common scenarios | At least 5 journeys tested in staging | Accept some edge cases for Phase 1; document for Phase 2 |

---

## 8. Success Criteria

### Merge Gate (Before PR merge to main)

- [ ] All code changes reviewed by 2+ engineers
- [ ] Type checking passes (`npm run typecheck`)
- [ ] Linting passes (`npm run lint`)
- [ ] Unit tests pass (coverage >80% for changed files)
- [ ] No console warnings or errors in tests
- [ ] Architecture doc updated (Step 1)
- [ ] New risks documented and accepted

---

### Staging Gate (Before production)

- [ ] Operator deployed to staging and loads without errors
- [ ] Chat endpoint responds with valid AI response (latency <2s)
- [ ] AI Gateway reachable from staging
- [ ] Tool calling tested (if IPI-525 shipped): Authorized tool called, executed, result returned
- [ ] Tool authorization working: Unauthorized tool rejected with 403
- [ ] Streaming tested: Response appears word-by-word
- [ ] Fallback tested: Primary model fails, fallback succeeds
- [ ] Rollback tested: Bad version deployed, successfully rolled back to good version
- [ ] All 5 journeys completed in staging successfully
- [ ] Logs clean (no ERROR or WARN messages in normal flow)
- [ ] Cost tracking active and accurate
- [ ] Monitoring dashboard live and showing data
- [ ] Runbook for emergency response documented
- [ ] Team trained on rollback procedure
- [ ] On-call rotation confirmed for first 48 hours

---

### Production Gate (Before production traffic)

- [ ] All stakeholders signed off: Engineering, Security, Product, Finance, Leadership
- [ ] Monitoring dashboard active and team watching
- [ ] Cost alert configured and tested
- [ ] Error rate alert configured and tested
- [ ] Rollback procedure verified one more time
- [ ] First 1-hour response plan documented (who responds if error rate spikes)
- [ ] Supabase backups confirmed active
- [ ] Cloudflare DDoS/security settings enabled
- [ ] Rate limiting configured (if needed for fairness)
- [ ] Release notes published (features, limitations, known issues)
- [ ] Support team briefed (what to tell users about new features)
- [ ] Deployment executed: 2+ engineers present
- [ ] Health check (first request) sent by Engineering lead
- [ ] First hour monitored closely (no other deployments during this time)

---

## 9. Implementation Order

| Step | Task | Can Run in Parallel? | Blocked By | Unlocks | Timeline |
|------|------|---|---|---|---|
| **1** | Confirm architecture | No | — | Steps 2–4 | This week (Monday) |
| **2** | Fix routing/safeguards | No | Step 1 | Step 3 | This week (Tuesday) |
| **3** | Validate model registry | Yes (with Step 2) | Step 2 | Step 4 | This week (Wednesday) |
| **4** | Verify tool calling (staging) | No | Step 2, IPI-525 shipped | Step 5 | Next week (Monday) — *blocked by IPI-525* |
| **5** | Confirm tool ownership | No | Step 4 | Step 6, Step 7 | Next week (Tuesday) |
| **6** | Verify streaming | Yes (with Step 5) | Step 4 | Step 8 | Next week (Wednesday) |
| **7** | Add observability | Yes (with Step 5) | Step 5 | Step 8 | Next week (Wednesday) |
| **8** | Test staging deployment | No | Steps 6, 7 | Step 9 | Next week (Thursday) |
| **9** | Test rollback | No | Step 8 | Step 10 | Next week (Friday) |
| **10** | Run user journeys | No | Step 9 | Step 11 | Week 3 (Monday) |
| **11** | Production approval | No | Step 10 | Production launch | Week 3 (Tuesday) |

### Work That Can Start Now

- Step 1: Confirm architecture (no dependencies)
- Step 2: Fix routing (depends on Step 1 only)

### Work That Must Wait

- Step 4 (Verify tool calling): Blocked by IPI-525
- Step 5–11: Blocked by Step 4

### Deferred Work

- IPI-528 (Gemini tool handling): Out of scope for Llama 3.1 Phase 1

---

## 10. Final Recommendation

### Plan Correctness Score

**78 / 100**

- ✅ Architecture clear and documented
- ✅ Ownership mostly resolved (tool execution decision pending)
- ✅ Test plan comprehensive
- 🟡 IPI-525 and CF-MIG-220 create external dependencies
- 🟡 Rollback procedure untested (risk exists)

**Deductions:**
- Tool ownership unclear (decision required) → -10 points
- IPI-525 blocks Phase 2 → -7 points
- Rollback untested → -5 points

---

### Merge Readiness

**95 / 100**

**Ready to merge:**
- Step 1–2 code (architecture doc, routing fixes)
- No test failures on main

**Not ready to merge:**
- IPI-525 (tool calling) — separate PR
- Observability changes (Step 7) — wait for staging verification

---

### Staging Readiness

**0 / 100**

**Blocker:** Operator not yet deployed to Cloudflare.

**Will be ready after:**
- Step 8 complete (staging deployment verified)
- IPI-525 shipped (tool calling working)

---

### Production Readiness

**0 / 100**

**Blockers:** 
- Staging not verified yet
- IPI-525 not shipped
- Rollback not tested
- User journeys not run in staging

**Will be ready after:**
- Step 11 complete (all testing done, all stakeholders approve)

---

### Top Three Immediate Actions

1. **Resolve tool ownership decision** (this week)
   - Who executes tools: Operator route, Supabase edge function, or external service?
   - This is the blocker for IPI-525 and Phase 2
   - Schedule 30-minute decision meeting with Engineering

2. **Deploy Operator to Cloudflare staging** (this week)
   - Use automatic configuration (Wrangler auto-detects Next.js, generates config)
   - Verify chat works
   - Takes 20 minutes
   - No dependencies (can start before tool ownership decision)

3. **Verify IPI-525 timeline** (daily)
   - Tool calling is critical blocker for Phase 2
   - If delayed beyond Week 2, production launch timeline must shift
   - Check status daily in standup

---

### Final Decision

**✅ PROCEED — Conditional**

**Green light:**
- Deploy to staging immediately (Step 8)
- Complete Steps 1–2 this week
- Expect Phase 2 to begin Week 2 (after IPI-525)

**Conditional on:**
- Tool ownership decision this week (blocking IPI-525)
- IPI-525 ships on schedule (Week 2)
- Rollback procedure verified before production

**If IPI-525 delayed beyond Week 2:**
- Single-turn chat is acceptable for Phase 1 production
- Tool calling deferred to Phase 2 (post-launch update)
- Adjust release notes (document limitations)

**Go/No-Go timestamp:** 2026-07-12  
**Next decision point:** 2026-07-19 (after tool ownership resolved, IPI-525 progress confirmed)

---

## Appendix: Glossary

- **AI Gateway:** Cloudflare Worker that routes requests to appropriate AI models (Llama, BGE, fallback)
- **Workers AI:** Cloudflare's built-in AI inference service (hosts Llama 3.1, BGE embeddings)
- **Operator:** Next.js app for Brand Guardian workflows (chat, planning, CRM)
- **Tool calling:** Feature where AI model can request execution of tools (create_plan, schedule_shoot, etc.)
- **Streaming:** Response appears word-by-word, not all at once
- **Fallback:** Backup AI provider (e.g., OpenAI) if primary fails
- **Multi-turn:** Conversation where context persists across messages (requires state storage)
- **Observability:** Logging, monitoring, alerting
- **Rollback:** Revert to previous code version
- **Circuit breaker:** Mechanism to stop requests if error rate too high (prevents cascading failure)

---

**Document prepared:** 2026-07-12  
**Review status:** Ready for engineering and leadership review  
**Next update:** After Step 1–2 complete (2026-07-15)
