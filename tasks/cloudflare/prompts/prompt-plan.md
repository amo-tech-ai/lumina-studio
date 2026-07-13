Act as a senior Cloudflare architect, Next.js deployment specialist, and technical project planner.

Research the latest official Cloudflare documentation, GitHub repositories, starter templates, engineering articles, and proven production examples.

Do not assume our current Cloudflare plan is correct. Find the simplest, most reliable, easiest-to-maintain setup with the fewest custom components and the lowest opportunity for errors.

This research and plan must work for:

An existing Next.js application
A new Next.js application
A static HTML page being converted into an application
A React or Vite application
A standalone Cloudflare Worker
A Workers AI chat application
An AI agent with tools and persistent state
Required output structure

Start with this table of contents and progress tracker:

#	Section	Purpose	Status	Evidence
1	Current-State Audit	Identify what already exists	⬜ Not started	

2	Setup Options	Compare all valid Cloudflare approaches	⬜ Not started	

3	Recommended Option	Select the simplest proven approach	⬜ Not started	

4	Architecture	Define components and ownership	⬜ Not started	

5	Next.js Deployment	Configure OpenNext and Workers	⬜ Not started	

6	Workers AI	Configure models and inference	⬜ Not started	

7	AI Gateway	Configure monitoring and provider access	⬜ Not started	

8	Functions and APIs	Define API routes and Worker functions	⬜ Not started	

9	Models	Select chat, tool, embedding, and fallback models	⬜ Not started	

10	CLI and Dashboard	Document exact setup steps	⬜ Not started	

11	Testing	Prove local, preview, staging, and production flows	⬜ Not started	

12	Deployment	Define CI/CD, preview, release, and rollback	⬜ Not started	

13	Task Plan	Create implementation-ready tasks	⬜ Not started	

14	Final Recommendation	State the safest and easiest strategy	⬜ Not started	


Update the status column as each section is completed:

⬜ Not started
🟡 In progress
🟢 Complete
🔴 Blocked
⚪ Not required
1. Audit the existing project

Inspect the repository, current configuration, Cloudflare dashboard resources, MCP tools, GitHub Actions, environment variables, deployment history, and existing documentation.

Verify:

Framework and version
Next.js App Router or Pages Router
Existing wrangler.jsonc or wrangler.toml
Existing OpenNext configuration
Existing Cloudflare Workers
Existing Workers AI bindings
Existing AI Gateway
Existing custom model router
Existing API routes
Existing tool-calling code
Existing authentication
Existing storage and state
Existing CI/CD
Existing preview and production deployments

For every finding, label it:

[Verified in code]
[Verified in Cloudflare]
[Verified in GitHub]
[Documented only]
[Unverified]
[Deprecated]
2. Research and compare setup options

Research at least these options.

Option A — Dashboard-first setup

Use the Cloudflare dashboard to:

Create a Worker
Connect GitHub
Configure builds
Add bindings
Add secrets
Add Workers AI
Create AI Gateway
Configure domains
View logs and deployments

Explain:

Best use case
What can be configured visually
What still requires code or CLI
Benefits for beginners
Limitations
Risk of configuration drift
Production suitability
Option B — C3 and Wrangler CLI

Research the official workflow using:

npm create cloudflare@latest
npx wrangler dev
npx wrangler deploy

Explain:

What C3 creates automatically
Which templates it supports
Which files are generated
How bindings are configured
How local development works
How preview and deployment work
When this is the best option
Common mistakes
Option C — Official Cloudflare template

Search official Cloudflare templates and GitHub repositories for:

Workers AI chat
Next.js
React
Vite
Hono
Agents
AI Gateway
Tool calling
Durable Objects
Vectorize
D1
R2

For each relevant template provide:

Template	Official source	Stack	Features included	Setup difficulty	Maintenance risk	Recommended?

Determine whether starting from a template is easier than adapting the current project.

Option D — Existing Next.js application with OpenNext

Research the official Cloudflare-supported Next.js deployment path.

Compare:

Automatic configuration
Manual OpenNext configuration
C3 migration
Existing repository migration
Build commands
Preview commands
Deploy commands
Compatibility flags
Node.js compatibility
Static assets
API routes
Middleware
Server Actions
Image handling
Environment variables
Cloudflare bindings

Provide the exact minimal commands required.

Option E — Cloudflare Agents starter

Research whether the official Agents starter can replace custom:

Chat state
Tool loops
WebSockets
Durable Object state
Scheduling
Model invocation
Agent routing
MCP integration

Explain when Agents should be used and when it would be unnecessary complexity.

Option F — Simple standalone AI Worker

Research the minimal architecture:

Browser
→ Worker API endpoint
→ Workers AI binding
→ Model
→ Response

Determine whether this simpler pattern is sufficient for the current application.

Option G — Vercel AI SDK with Workers AI

Research whether the official Workers AI provider or OpenAI-compatible endpoint can simplify:

Streaming
Chat messages
Tool calling
Structured output
React chat UI
Provider integration

Compare it against custom streaming and custom provider adapters.

3. Compare all options

Create this decision table:

Option	Initial setup	Existing-app fit	AI support	Tool support	State support	Dashboard-friendly	CLI complexity	Custom code	Error risk	Production fit	Score /100

Score each option using:

Simplicity
Official support
Documentation quality
Maintenance
Testability
Security
Deployment reliability
Rollback
Team learning curve
Migration effort

Recommend:

Best overall option
Best beginner option
Best option for an existing Next.js application
Best option for a static HTML conversion
Best option for a full AI agent
Best option for a basic Workers AI chat
Best fallback option
4. Define the minimum architecture

Separate components into:

Component	Required now	Optional later	Remove	Reason
Cloudflare Worker	
	
	
	

Next.js/OpenNext	
	
	
	

Workers AI binding	
	
	
	

AI Gateway	
	
	
	

Custom model registry	
	
	
	

Custom provider router	
	
	
	

Agents SDK	
	
	
	

Durable Objects	
	
	
	

KV	
	
	
	

D1	
	
	
	

R2	
	
	
	

Vectorize	
	
	
	

Queues	
	
	
	

Workflows	
	
	
	

Supabase	
	
	
	

Mastra	
	
	
	


Prefer the smallest architecture that satisfies the verified requirements.

Do not add a service only because Cloudflare offers it.

5. Clearly define ownership

Create an ownership table:

Responsibility	Recommended owner	Why	Alternatives rejected
UI rendering	
	
	

API routes	
	
	

Authentication	
	
	

Model invocation	
	
	

Model selection	
	
	

Tool declarations	
	
	

Tool authorization	
	
	

Tool execution	
	
	

Tool argument validation	
	
	

Conversation state	
	
	

Streaming	
	
	

Logging	
	
	

Cost tracking	
	
	

Retry and fallback	
	
	

Deployment	
	
	

Rollback	
	
	


Avoid duplicated responsibility between Next.js, AI Gateway, Workers, Mastra, and Supabase.

6. Models and Workers AI

Research current official Workers AI models for:

Fast chat
Tool calling
Reasoning
Structured output
Embeddings
Vision
Fallback

Create:

Purpose	Recommended model	Tool calling	Context	Pricing	Status	Reason

Verify:

Exact model ID
Deprecation status
Context window
Function-calling support
Streaming support
Pricing
Limits
Known restrictions

Do not recommend deprecated models.

7. CLI installation plan

Provide an exact CLI checklist:

Step	Command	Purpose	Expected result	Validation	Rollback

Include only commands that are actually required.

Cover:

Node version
Package manager
C3
Wrangler
OpenNext
Login
Project creation
Existing-project migration
AI binding
Secrets
Local development
Preview
Type generation
Deployment
Logs
Rollback

Prefer project-local dependencies rather than unnecessary global installations.

8. Dashboard setup plan

Provide exact dashboard navigation for:

Workers & Pages
Builds
GitHub connection
Environment variables
Secrets
Bindings
Workers AI
AI Gateway
Custom domains
Logs
Analytics
Deployment versions
Rollbacks
Rate limiting

For every setting include:

Dashboard area	Setting	Required value	Why	How to verify

Clearly identify which settings should be managed in code rather than manually.

9. Reusable HTML-to-Cloudflare workflow

Create a workflow usable for any HTML design being converted into an application.

Phase A — Inspect
Identify static sections
Identify interactive sections
Identify forms
Identify API requirements
Identify authentication requirements
Identify AI features
Identify state requirements
Phase B — Convert

Recommend whether to use:

Static Assets Worker
React/Vite
Next.js
Hono
Cloudflare Agents

Do not default to Next.js when static assets or Vite would be simpler.

Phase C — Connect
Add APIs
Add Workers AI
Add authentication
Add storage only when required
Add monitoring
Phase D — Verify
Visual comparison
Responsive testing
Accessibility
API tests
AI tests
Preview deployment
Production smoke test

Create a decision flowchart showing which framework to select.

10. Mermaid diagrams

Generate valid Mermaid diagrams for:

Current architecture
Minimum recommended architecture
Next.js/OpenNext architecture
Static HTML architecture
Workers AI request flow
Tool-calling sequence
Dashboard deployment flow
CLI deployment flow
GitHub CI/CD
Rollback
Framework-selection decision tree

After each diagram explain:

What it shows
Why it is simpler
Remaining risks
How to validate it
11. Create implementation tasks

Use this format exactly:

IPI-XXX · TASK-ID — Full Task Name

Every task must include:

Purpose
Why it is needed
Scope
Files affected
Commands
Dependencies
Acceptance criteria
Tests
Evidence required
Rollback
Estimated complexity
Status

Create the smallest practical number of tasks.

Avoid one task per minor defect. Group work by deployable feature or verified outcome.

Organize tasks into:

Phase 0 — Decision and cleanup
Phase 1 — Minimal deployment
Phase 2 — Workers AI integration
Phase 3 — Functions and tools
Phase 4 — State and persistence
Phase 5 — Observability and security
Phase 6 — Production release

Include a progress tracker:

Task	Full task name	Phase	Dependencies	Status	Evidence	Blocker
12. Testing strategy

Create tests for:

Clean installation
Existing-project migration
Local Wrangler development
Preview deployment
Production deployment
Workers AI binding
Chat response
Streaming
Tool calling
Invalid tools
Authentication
Secrets
Environment separation
GitHub deployment
Custom domain
Rollback
Cost telemetry
Error logging

Use scenario-based tests rather than arbitrary coverage percentages.

13. Final recommendation

Finish with:

Recommended setup

State one clear primary recommendation.

Why it is best

Explain in simple terms.

Components removed

List unnecessary components.

Components retained

List required components.

Exact first commands

Provide the commands needed to start.

Task count

State how many implementation tasks are required.

Estimated complexity reduction

Estimate:

Custom code removed
Configuration reduced
Services removed
Failure points removed
Maintenance effort reduced
Scores
Plan correctness: /100
Simplicity: /100
Official support: /100
Ease of setup: /100
Maintenance: /100
Production readiness: %
Decision

Choose exactly one:

USE DASHBOARD-FIRST
USE C3 + WRANGLER
USE OFFICIAL TEMPLATE
USE OPENNEXT FOR EXISTING NEXT.JS
USE CLOUDFLARE AGENTS STARTER
USE SIMPLE STANDALONE WORKER
RETAIN CURRENT ARCHITECTURE

Do not provide a vague combination unless the components have clearly separate responsibilities.

Every recommendation must cite official documentation or a verified official GitHub repository. Clearly distinguish official support from community opinion.