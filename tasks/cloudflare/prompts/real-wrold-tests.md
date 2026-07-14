# Create Real-World AI Journey Test Plans for iPix

Review the current iPix architecture, codebase, Linear tasks, and existing Cloudflare / Mastra / CopilotKit / Supabase setup.

Create separate test-plan documents for these real-world user journeys:

1. AI onboarding
2. AI Brand Intelligence
3. AI brand brief generation
4. Shoot planning workflow
5. Booking workflow
6. CRM workflow
7. Planner workflow
8. Add any other critical AI journey you identify

## For each journey

Create one separate Markdown document under:

```text
tasks/cloudflare/user-journeys/
```

Suggested names:

```text
01-ai-onboarding.md
02-brand-intelligence.md
03-ai-brand-brief.md
04-shoot-planning.md
05-booking-workflow.md
06-crm-workflow.md
07-planner-workflow.md
08-additional-critical-journey.md
```

## Required sections in every document

### 1. Purpose

Explain what the user is trying to achieve in plain English.

### 2. Real-world persona

Examples:

* Operator
* Creative Director
* Production Planner
* Brand Manager
* Booker
* CRM Manager
* Photographer
* Talent Manager

### 3. User journey

Describe the complete journey from first click to final outcome.

### 4. Tech stack mapping

Show exactly which tools are involved:

| Layer               | Possible technology               |
| ------------------- | --------------------------------- |
| User interface      | Next.js, CopilotKit               |
| Agent reasoning     | Mastra                            |
| AI routing          | Cloudflare AI Gateway Worker      |
| AI providers        | Workers AI, Gemini                |
| Data                | Supabase PostgreSQL               |
| Auth                | Supabase Auth                     |
| Realtime            | Supabase Realtime                 |
| Files/images        | Cloudinary                        |
| Workflow automation | n8n, Cloudflare Queues, Workflows |
| Observability       | Cloudflare logs, Sentry           |
| Tests               | Vitest, Playwright, Wrangler      |

Only include technologies actually relevant to that journey.

### 5. Mermaid diagrams

Add:

* user journey flowchart
* system architecture flow
* sequence diagram
* failure / fallback flow when useful

### 6. Preconditions

List required:

* environment variables
* Supabase records
* authenticated user roles
* Cloudflare Worker availability
* model/provider configuration
* test fixtures
* required feature flags

### 7. Test scenarios

Include:

* happy path
* validation failures
* permissions/RLS
* gateway unavailable
* provider timeout
* provider fallback
* malformed AI response
* empty state
* duplicate submission
* cancellation
* mobile/responsive behavior
* accessibility
* recovery after failure

### 8. Real-runtime verification

Clearly separate:

* Unit Verified
* Build Verified
* Local Runtime Verified
* Remote Preview Verified
* Production Verified

Do not claim a higher level without evidence.

### 9. Success criteria

Use measurable criteria, for example:

* correct page/action loads
* request reaches Mastra
* request reaches AI Gateway Worker
* expected provider selected
* streaming reaches CopilotKit
* structured JSON passes schema validation
* Supabase records created correctly
* RLS blocks unauthorized access
* no duplicate booking/deal/task created
* logs contain correlation/request ID
* user sees clear recovery message
* acceptable latency threshold
* no secrets exposed

### 10. Checklist

Create a concise checkbox list for:

* setup
* test data
* unit tests
* integration tests
* browser tests
* Cloudflare runtime proof
* Supabase verification
* observability
* cleanup
* final sign-off

### 11. Failure points and blockers

Identify:

* missing API contracts
* unimplemented AI Gateway capabilities
* unsupported tool calling or vision
* registry drift
* RLS gaps
* incomplete seed data
* missing test IDs
* environment mismatch
* direct-provider bypasses
* missing rollback path

### 12. Automation opportunities

Recommend which tests should become:

* Vitest
* Playwright
* Wrangler integration tests
* Supabase SQL verification
* scheduled smoke tests
* CI gates

## Additional journeys to consider

Evaluate whether separate documents are needed for:

* AI asset search / embeddings
* visual DNA analysis
* campaign generation
* sponsor matching
* talent recommendations
* customer support assistant
* notifications and approvals
* post-event reporting
* operator AI health / readiness check

## Final summary document

Create:

```text
tasks/cloudflare/user-journeys/00-index.md
```

Include:

* all journeys
* responsible stakeholder
* event lifecycle phase
* tech stack
* current readiness
* blocking Linear task
* priority
* recommended implementation order
* test coverage status

Use this status system:

* 🟢 verified
* 🟡 partial
* 🔴 blocked
* ⚪ not started

## Rules

* Use current repository and Linear truth.
* Do not invent completed capabilities.
* Clearly distinguish direct Gemini/Groq paths from Cloudflare Gateway paths.
* Flag journeys requiring tools, vision, embeddings, streaming, or structured output.
* Do not mix production code changes into this documentation task./
* Use full task names in this format://

```text
IPI-XXX · TASK-ID — Full Task Name
```

## Final report

Return:

| Item                         | Result                |
| ---------------------------- | --------------------- |
| Documents created            | Exact paths           |
| Journeys covered             | Count                 |
| Additional journeys found    | List                  |
| Mermaid diagrams             | Count                 |
| Critical blockers            | List                  |
| Missing tests                | List                  |
| Highest-risk journey         | Name                  |
| First journey to automate    | Name                  |
| Overall real-world readiness | Percent               |
| Recommended next task        | Full Linear task name |
