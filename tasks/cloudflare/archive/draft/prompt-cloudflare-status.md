````markdown
# Cloudflare Progress Tracker Audit — Plan First, Then Verify

## Role

Act as a senior Cloudflare, Mastra, Next.js, OpenNext, Supabase, Linear, and production-readiness auditor.

Work systematically. Do not assume Linear status, documentation, or prior reports are correct.

## Project

Repository:

```text
/home/sk/ipix
````

Primary application:

```text
/home/sk/ipix/app
```

Review the current Cloudflare setup, application runtime, active Linear tasks, user journeys, workflows, tests, deployment configuration, and production readiness.

## Main objective

Create a clear **Progress Task Tracker** showing:

* what is complete;
* what is partially complete;
* what has failed;
* what has not started;
* what is stale or incorrectly marked;
* what must happen next;
* the correct execution order.

The final result must be a **systematic, accurate, evidence-based, production-ready plan**.

---

# Mandatory skills and tools

Use all relevant repository skills and MCPs:

* Cloudflare
* Mastra
* Linear
* GitHub
* Playwright
* Chrome DevTools
* CopilotKit
* Supabase
* OpenNext
* task-verifier
* ipix-task-lifecycle
* pr-workflow
* Mermaid
* user-journey testing

Use official documentation where needed.

Do not rely only on markdown documents or Linear descriptions. Verify repository truth, Git history, runtime behavior, and live services.

---

# Phase 1 — Establish repository truth

Start from:

```bash
cd /home/sk/ipix
git fetch origin
git status
git branch --show-current
git log --oneline -20
git rev-parse HEAD
git rev-parse origin/main
```

Confirm:

* current branch;
* whether the checkout is stale;
* whether `main` is current;
* open worktrees;
* uncommitted changes;
* merged versus unmerged PR work;
* duplicate or stale branches.

Do not modify or delete anything.

---

# Phase 2 — Review active Linear tasks

Review all In Progress, In Review, Todo, urgent, and blocked tasks related to:

* Cloudflare migration;
* OpenNext;
* AI Gateway;
* Mastra;
* Workers AI;
* tool calling;
* agent architecture;
* shared tool registry;
* provider evaluation;
* failover;
* CI/CD;
* preview deployment;
* security;
* production cutover.

Prioritize these tasks:

* **IPI-454 · CF-AI-001 — AI Gateway — Cloudflare Provider Routing**
* **IPI-465 · AGENT-002 — Shared AI Tool Registry**
* **IPI-471 · AGENT-001 — AI Agent Architecture**
* **IPI-490 · CF-MIG-210 — Runtime Compatibility — Hono, OAuth & Groq Bundle**
* **IPI-525 · CF-AI-011 — Workers AI Tool Calling**
* **IPI-485 · MASTRA-CF-001 — Mastra Provider Gateway Cutover**
* **IPI-462 · CF-AI-006 — AI Provider Evaluation Suite**
* **IPI-463 · CF-AI-008 — AI Provider Failover & Rollback**
* **IPI-508 · CF-UJ-008 — Journey test: Marketing/operator fast chat**
* CF-MIG-111
* CF-MIG-220
* CF-MIG-810

For every task:

1. Read the full Linear description.
2. Inspect comments and dependencies.
3. Check repository evidence.
4. Check related PRs and commits.
5. Run relevant tests.
6. Decide whether status is correct.
7. Calculate completion percentage.
8. Recommend keep, rewrite, split, close, reopen, or cancel.

Always use this format:

```text
IPI-XXX · TASK-ID — Full Task Name
```

Do not create duplicate tasks.

---

# Phase 3 — Audit Cloudflare setup

Inspect:

```text
/home/sk/ipix/app
/home/sk/ipix/services/cloudflare-worker
/home/sk/ipix/tasks/cloudflare
```

Review:

* `wrangler.jsonc`;
* `open-next.config.ts`;
* OpenNext build scripts;
* Workers Builds configuration;
* runtime variables;
* secrets;
* bindings;
* observability;
* deployment commands;
* preview configuration;
* production configuration;
* route handling;
* OAuth callback behavior;
* CopilotKit runtime;
* Mastra runtime;
* provider routing;
* AI Gateway;
* Workers AI;
* streaming;
* embeddings;
* tool calling;
* Supabase connectivity;
* PostgresStore behavior;
* rollback strategy.

Verify what is actually deployed versus only documented.

---

# Phase 4 — Audit AI and Mastra routing

Trace the real runtime path:

```text
Browser
→ Next.js/OpenNext
→ CopilotKit
→ Mastra agent
→ resolveModel()
→ direct provider or gateway
→ Cloudflare Worker
→ Workers AI or fallback provider
```

Inspect:

```text
app/src/lib/ai/
app/src/mastra/
app/src/mastra/agents/
app/src/mastra/tools/
app/src/mastra/workflows/
services/cloudflare-worker/
```

Verify:

* `AI_ROUTING_MODE`;
* `AI_GATEWAY_URL`;
* provider selection;
* fast/default/structured/vision/embedding routing;
* `tools`;
* `tool_choice`;
* tool-result messages;
* streaming tool calls;
* model registry;
* Gemini fallback;
* Workers AI model capability;
* error handling;
* timeouts;
* retries;
* request IDs;
* logs;
* rollback.

Identify hardcoded Gemini, Groq, or direct SDK usage.

---

# Phase 5 — Run automated tests

Run the correct existing commands. Do not invent scripts.

At minimum inspect and run, where available:

```bash
cd /home/sk/ipix/app

npm run lint
npm run typecheck
npm test
npm run build
npx opennextjs-cloudflare build
```

Also run focused tests for:

* provider resolution;
* gateway routing;
* embeddings;
* streaming;
* tool calling;
* OAuth allowlist;
* CopilotKit;
* Mastra agents;
* workflows;
* Supabase access;
* OpenNext runtime.

Record:

* command;
* pass/fail;
* duration;
* failing test;
* likely root cause;
* whether failure is blocking.

Do not hide skipped tests.

---

# Phase 6 — Run real-world tests

Use Playwright, Chrome DevTools, Wrangler, and available MCPs.

Test the actual user journeys.

## Journey A — Gateway health

```text
GET /health
POST /v1/chat/completions
POST /v1/embeddings
invalid input
timeout
provider failure
```

## Journey B — Marketing chat

```text
Browser
→ public-marketing
→ fast tier
→ gateway
→ Workers AI
→ streamed response
```

Verify:

* response;
* streaming;
* cancellation;
* model ID;
* request proof;
* error display;
* rollback to direct mode.

## Journey C — Operator CopilotKit

Verify:

* agent discovery;
* run start;
* streaming;
* cancellation;
* timeout;
* structured AG-UI errors;
* storage behavior;
* PostgresStore hang behavior.

## Journey D — Tool calling

Use one harmless read-only tool.

Verify:

```text
tools
→ tool_choice
→ tool_calls
→ execute tool
→ role: tool result
→ final answer
```

Do not begin with Production Planner’s full tool set.

## Journey E — Authentication

Verify:

* approved callback host;
* rejected callback host;
* preview hostname;
* production hostname;
* secrets not exposed;
* no wildcard trust.

## Journey F — Rollback

Verify:

```text
AI_ROUTING_MODE=gateway
→ test
→ switch to direct
→ restart
→ confirm recovery
```

---

# Phase 7 — Audit workflows

Review all Mastra and Cloudflare workflows.

For each workflow verify:

* trigger;
* inputs;
* outputs;
* steps;
* retries;
* timeout;
* persistence;
* HITL;
* tool permissions;
* failure recovery;
* audit logging;
* user-visible status;
* idempotency.

Separate:

* Mastra workflows for in-process AI steps;
* Cloudflare Workflows for durable cross-system work.

Do not recommend replacing Mastra with Cloudflare Workflows unless technically justified.

---

# Phase 8 — Identify risks and missing work

Look for:

* stale Linear statuses;
* stale documentation;
* unmerged code;
* dead branches;
* duplicate registries;
* missing tests;
* missing environment variables;
* missing secrets;
* unsafe tool execution;
* missing HITL;
* missing audit logs;
* provider mismatch;
* model capability mismatch;
* unbounded streaming;
* missing rollback;
* missing remote preview;
* unsupported bindings;
* raw Postgres connection risks;
* missing CI gates;
* DNS cutover risks.

Use:

* 🟢 complete
* 🟡 in progress or partially verified
* 🔴 failed or blocked
* ⚪ not started

---

# Phase 9 — Calculate completion

Use evidence-based percentages.

Suggested scoring:

```text
20% design exists
40% code exists
60% unit tests pass
75% integration tests pass
85% real-world preview works
95% production controls verified
100% merged, deployed, tested, documented, and status updated
```

Do not award 100% without:

* code on `main`;
* tests passing;
* runtime proof;
* documentation updated;
* rollback verified;
* Linear updated.

---

# Required final output

## 1. Executive summary

Include:

* overall Cloudflare migration percentage;
* production-readiness percentage;
* number of complete, active, blocked, and not-started tasks;
* top three blockers;
* single next task.

## 2. Progress Task Tracker

Use this concise format:

| Status | Task                               |    % | Repo proof  | Runtime proof | Missing    | Recommended action |
| :----: | ---------------------------------- | ---: | ----------- | ------------- | ---------- | ------------------ |
|   🟢   | IPI-XXX · TASK-ID — Full Task Name | 100% | commit/file | test/deploy   | none       | close              |
|   🟡   | ...                                |  65% | ...         | ...           | ...        | continue           |
|   🔴   | ...                                |  40% | ...         | failed        | blocker    | fix                |
|    ⚪   | ...                                |   0% | none        | none          | full scope | start later        |

## 3. Test results

| Test | Command or journey | Result | Evidence | Blocking? |
| ---- | ------------------ | :----: | -------- | :-------: |

## 4. Errors and red flags

| Severity | Problem | Impact | Root cause | Critical fix |
| :------: | ------- | ------ | ---------- | ------------ |

## 5. Missing work

List only genuinely missing items.

Do not duplicate existing Linear tasks.

## 6. Correct task order

Provide the correct dependency order.

Example:

```text
Architecture truth
→ Runtime preview proof
→ Fast-path E2E
→ Tool contract spike
→ Shared registry design
→ Tool forwarding implementation
→ Provider evaluation
→ Gradual agent cutover
→ Failover
→ Preview smoke
→ DNS cutover last
```

## 7. Task corrections

For every stale task:

| Task | Current status | Correct status | Required Linear change |
| ---- | -------------- | -------------- | ---------------------- |

## 8. Production readiness checklist

```text
[ ] OpenNext remote preview
[ ] CopilotKit streaming
[ ] Gateway E2E
[ ] Tool calling
[ ] HITL
[ ] Audit logs
[ ] Auth
[ ] Supabase/Postgres stability
[ ] CI gate
[ ] Rollback
[ ] Observability
[ ] DNS cutover approval
```

## 9. Final verdict

State:

* Will the plan succeed?
* Is it production ready?
* What must happen next?
* What must not be done yet?

---

# Guardrails

* Audit first; do not modify code.
* Do not change Linear until the audit report is complete.
* Do not mark tasks Done based only on documentation.
* Do not enable production gateway mode.
* Do not enable tool tiers without contract proof.
* Do not remove Gemini until vision and fallback are verified.
* Do not create D1 as the app database.
* Supabase remains the source of truth.
* Do not cut over DNS.
* Do not create duplicate tasks.
* Keep each PR to one concern.
* Show evidence for every score.

```
```


https://linear.app/amo100/issue/IPI-469/cf-000-cloudflare-platform-architecture

https://linear.app/amo100/issue/IPI-525/cf-ai-011-workers-ai-tool-calling-add-toolstool-choice-forwarding-to
https://linear.app/amo100/issue/IPI-490/cf-mig-210-runtime-compatibility-hono-oauth-and-groq-bundle
https://linear.app/amo100/issue/IPI-471/agent-001-ai-agent-architecture
https://linear.app/amo100/issue/IPI-465/agent-002-shared-ai-tool-registry
https://linear.app/amo100/issue/IPI-454/ipi-454-cf-ai-001-ai-gateway-cloudflare-provider-routing
https://linear.app/amo100/issue/IPI-515/ipi-515-pr-agent-000-epic-pr-agent-on-bedrock-qwen3-coder-next