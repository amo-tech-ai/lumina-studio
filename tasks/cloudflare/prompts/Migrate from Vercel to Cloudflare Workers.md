# iPix Architecture Review — Migrate from Vercel to Cloudflare Workers

## Objective

Perform a deep architecture review of the current iPix setup and produce a complete migration plan from **Vercel** to **Cloudflare Workers** while preserving all existing functionality.

The goal is to determine the most efficient Cloudflare-first architecture for:

- Next.js
- Mastra
- CopilotKit
- Cloudflare Agents
- Cloudflare Workflows
- Workers AI
- AI Gateway
- Supabase
- PostgreSQL
- pgvector
- Cloudinary

Use the existing codebase, Linear issues, MCP servers, and official documentation.

---

# Requirements

- Review the current repository before making recommendations.
- Use available MCP servers:
  - Cloudflare
  - Supabase
  - Linear
- Use project skills:
  - Mastra
  - CopilotKit
  - Supabase
  - Cloudflare
  - Next.js
- Only use official documentation for technical decisions.
- Prefer the simplest production-ready architecture.
- Reuse existing work where possible.
- Do not create duplicate infrastructure.

---

# Phase 1 — Audit Current Architecture

Review:

- Current Vercel setup
- vercel.json
- package.json
- Next.js configuration
- Environment variables
- Build process
- CI/CD
- API routes
- Route Handlers
- Middleware
- Server Actions
- Edge Functions
- Mastra setup
- CopilotKit setup
- AI routes
- Cloudinary
- Supabase
- Existing Cloudflare configuration
- Wrangler configuration (if any)

Produce:

- Current architecture diagram
- Deployment flow
- Runtime dependencies
- Vercel-specific features currently in use
- Cloudflare compatibility report

---

# Phase 2 — Official Documentation Research

Research ONLY official documentation.

## Cloudflare

https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/

https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/get-started/

https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/deploy/

https://developers.cloudflare.com/workers/

https://developers.cloudflare.com/workers-ai/

https://developers.cloudflare.com/workers-ai/models/

https://developers.cloudflare.com/workflows/

https://developers.cloudflare.com/agents/

https://developers.cloudflare.com/agents/concepts/workflows/

https://developers.cloudflare.com/ai-gateway/

https://developers.cloudflare.com/browser-rendering/

https://developers.cloudflare.com/images/

https://developers.cloudflare.com/images/optimization/transformations/integrate-with-frameworks/

https://developers.cloudflare.com/durable-objects/

https://developers.cloudflare.com/queues/

https://developers.cloudflare.com/vectorize/

https://developers.cloudflare.com/r2/

## OpenNext

https://opennext.js.org/

https://opennext.js.org/cloudflare

## Mastra

https://mastra.ai/guides/deployment/cloudflare

https://mastra.ai/models/providers/cloudflare-workers-ai

https://mastra.ai/docs

## CopilotKit

https://docs.copilotkit.ai

## Supabase

https://supabase.com/docs

https://supabase.com/docs/guides/database/extensions/pgvector

---

# Phase 3 — Compatibility Review

Determine compatibility for:

- App Router
- Server Components
- Server Actions
- Middleware
- Route Handlers
- API Routes
- Streaming
- AI Streaming
- Authentication
- Uploads
- Cloudinary
- Supabase
- pgvector
- Mastra
- CopilotKit
- AI Gateway
- Workers AI
- Cloudflare Agents
- Cloudflare Workflows

Identify:

- Works without changes
- Requires configuration
- Requires code changes
- Not supported
- Better Cloudflare alternative

---

# Phase 4 — Migration Plan

Produce a detailed migration plan.

## Infrastructure

- Remove Vercel dependencies
- Add OpenNext
- Configure Wrangler
- Configure Cloudflare Workers
- Configure Cloudflare secrets
- Configure environments
- Configure observability
- Configure logging

## Runtime

Review:

- API routes
- Route Handlers
- Middleware
- Server Actions
- Image optimization
- Streaming
- AI endpoints

Recommend best practices.

---

# Phase 5 — Mastra + Cloudflare

Review current Mastra setup.

Determine:

Should Mastra remain?

How should Mastra integrate with:

- Cloudflare Workers
- Workers AI
- AI Gateway
- Cloudflare Agents
- Cloudflare Workflows

Recommend responsibilities.

Create architecture diagram.

---

# Phase 6 — AI Architecture

Design production AI architecture.

Include:

CopilotKit

↓

Mastra Supervisor

↓

Expert Agents

↓

Cloudflare Agents

↓

Cloudflare Workflows

↓

Workers AI

↓

Supabase

↓

pgvector

Define:

- responsibilities
- workflows
- ownership
- communication

---

# Phase 7 — Screen Impact

Determine which screens require changes.

Examples:

- Onboarding
- AI Brief
- Brand Intelligence
- Campaigns
- Shoot Wizard
- Shoot Detail
- Booking
- Asset Library
- Product Linking
- Analytics
- Notifications

Identify:

- AI changes
- runtime changes
- workflow changes

---

# Phase 8 — Linear Review

Review existing Linear issues.

Identify:

- obsolete Vercel tasks
- Cloudflare tasks already created
- duplicate work
- missing tasks
- incorrect priorities

Generate only missing tasks.

Group by:

- Next.js
- Cloudflare Workers
- OpenNext
- Wrangler
- Mastra
- CopilotKit
- Workers AI
- AI Gateway
- Cloudflare Agents
- Cloudflare Workflows
- Infrastructure
- DevOps

Each task should include:

- title
- purpose
- user story
- dependencies
- acceptance criteria
- estimate
- priority

---

# Phase 9 — Deliverables

Produce:

1. Executive Summary
2. Current Architecture
3. Cloudflare Compatibility Report
4. Migration Risk Assessment
5. Recommended Architecture
6. Mermaid Diagrams
7. Migration Roadmap
8. Linear Task List
9. Best Practices
10. Recommended Implementation Order

---

# Success Criteria

- Single Cloudflare-first deployment
- Next.js deployed with OpenNext on Cloudflare Workers
- Mastra deployed on Cloudflare Workers
- CopilotKit integrated cleanly
- AI Gateway configured
- Workers AI configured
- Cloudflare Workflows for long-running processes
- Supabase remains system of record
- pgvector remains knowledge layer
- No unnecessary infrastructure
- No duplicated responsibilities
- Clear phased migration from Vercel to Cloudflare
```