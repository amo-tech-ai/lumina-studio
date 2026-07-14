# Deep Architecture & AI Strategy Review — iPix

## Objective

Perform a comprehensive architecture review of the current iPix application and propose the optimal AI architecture using:

- CopilotKit
- Mastra
- Cloudflare Agents
- Cloudflare Workers
- Cloudflare Workflows
- Workers AI
- AI Gateway
- Supabase
- PostgreSQL
- pgvector

Your goal is to determine the simplest, most scalable production architecture with the least duplication of responsibilities.

---

# Phase 1 — Understand the Current System

## Review

- Entire application architecture
- Folder structure
- Current AI implementation
- Existing agents
- Existing workflows
- Existing Edge Functions
- Current CopilotKit usage
- Current Mastra usage
- Current Cloudflare Workers implementation
- Current Supabase schema
- Existing pgvector implementation
- Existing AI prompts
- Existing knowledge retrieval
- Existing Linear issues
- Existing PRDs
- Existing roadmap

Create a current-state architecture diagram.

---

# Phase 2 — Review Linear

Using the Linear MCP:

Review every AI-related issue.

Identify issues related to:

- AI
- CopilotKit
- Mastra
- Cloudflare
- Workers
- Agents
- Workflows
- Intelligence
- Brand Intelligence
- Asset DNA
- Campaigns
- Shoot Planning
- Booking
- Ecommerce
- Knowledge
- RAG
- pgvector
- Embeddings

Produce:

- Duplicate issues
- Missing issues
- Wrong priorities
- Missing dependencies
- Better sequencing

Do not create duplicate work.

---

# Phase 3 — Research Official Documentation

Use MCP skills and official documentation only.

Research:

## CopilotKit

- latest architecture
- CoAgents
- Generative UI
- HITL
- Runtime
- Best practices

## Mastra

- Agents
- Supervisor pattern
- Workflows
- Memory
- Tools
- Evals
- Cloudflare deployment
- Workers AI provider

## Cloudflare

Research

- Agents
- Workers
- Workflows
- Workers AI
- AI Gateway
- Durable Objects
- Queues
- Browser Rendering
- Vectorize
- MCP support
- Long-running agents
- Human approval

## Supabase

Research

- AI
- pgvector
- embeddings
- RAG
- Edge Functions
- MCP
- Auth
- Storage

---

# Phase 4 — Architecture Review

Review the current architecture.

Answer:

Should Mastra remain?

Should Cloudflare Agents replace parts of Mastra?

Should Workflows replace existing workflows?

Should Workers AI replace some model calls?

Where are responsibilities duplicated?

What should move?

What should stay?

What should be removed?

---

# Phase 5 — Expert Agent Architecture

Design the complete AI organization.

Supervisor Agent

↓

Photography Expert

Fashion Expert

Jewelry Expert

Creative Director

Campaign Strategist

Social Media Expert

Brand Strategist

Equipment Advisor

Lighting Expert

Retouching Expert

Video Expert

Marketplace Expert

Amazon Expert

Shopify Expert

SEO Expert

Content Writer

Analytics Expert

Booking Coordinator

Production Manager

Casting Director

Talent Expert

Customer Success

Admin

For every expert define:

- purpose
- responsibilities
- tools
- workflows
- models
- memory
- knowledge sources
- screens
- APIs
- database tables

---

# Phase 6 — Workflow Design

Design production workflows for:

## Brand Intelligence

## Brand Onboarding

## AI Brief

## Campaign Planning

## Creative Direction

## Shoot Planning

## Booking

## Talent Matching

## Casting

## Asset DNA

## Asset Review

## Product Linking

## Ecommerce

## Amazon Optimization

## Shopify Optimization

## Social Media

## Content Calendar

## Contest Management

## Analytics

## Customer Support

## Notifications

## Admin

For each workflow include:

- trigger
- steps
- agent(s)
- human approval
- Cloudflare Workflow
- Workers AI
- database writes
- tools
- outputs

---

# Phase 7 — Screen Impact Analysis

Review every screen.

Determine where AI should appear.

Examples:

Command Center

Brand List

Brand Detail

Brand Onboarding

AI Brief

Campaigns

Shoot Wizard

Shoot Detail

Asset Library

Asset Detail

Product Linking

Booking

Talent

Casting

Analytics

Settings

Notifications

For every screen define:

- AI assistant
- proactive suggestions
- approvals
- workflows
- generated artifacts
- chat
- sidebar
- actions

---

# Phase 8 — Knowledge Architecture

Design the expert knowledge system.

Knowledge domains include:

Photography

Fashion

Jewelry

Marketing

Campaigns

Equipment

Lighting

Studio

Brand Guidelines

Luxury Brands

Amazon Best Practices

Shopify

Social Media

SEO

Internal SOPs

Past Campaigns

Past Shoots

Asset DNA

Creative Playbooks

Explain:

- PostgreSQL schema
- pgvector
- embeddings
- retrieval
- chunking
- metadata
- RAG strategy

---

# Phase 9 — Model Strategy

Recommend the best model for:

- chat
- reasoning
- planning
- vision
- OCR
- embeddings
- reranking
- classification
- summaries
- creative writing
- code generation

Recommend when to use:

- Workers AI
- AI Gateway
- external models

Optimize for cost, latency, and quality.

---

# Phase 10 — New Linear Tasks

Create new Linear issues only for missing work.

Use the project naming convention.

Group by:

## AI Foundation

## CopilotKit

## Mastra

## Cloudflare Agents

## Cloudflare Workflows

## Workers AI

## AI Gateway

## Knowledge

## pgvector

## Brand Intelligence

## Campaigns

## Booking

## Shoot System

## Ecommerce

## Analytics

## AI UX

Every issue should include:

- title
- purpose
- user story
- dependencies
- acceptance criteria
- estimate
- priority
- implementation notes

---

# Phase 11 — Deliverables

Produce:

1. Executive Summary
2. Architecture Review
3. Gap Analysis
4. Mermaid diagrams
5. Recommended architecture
6. Migration plan
7. Expert Agent catalog
8. Workflow catalog
9. Screen impact matrix
10. Linear backlog
11. Risks
12. Recommended implementation order

---

# Requirements

- Use official documentation only.
- Use available MCP servers for:
  - Linear
  - Supabase
  - Cloudflare
- Use the Mastra, CopilotKit, Supabase, and Cloudflare skills where applicable.
- Review the existing codebase before making recommendations.
- Reuse existing architecture where possible.
- Eliminate duplicated responsibilities.
- Prefer the simplest production-ready architecture.
- Do not propose unnecessary abstractions.
- Generate Mermaid diagrams for all major architectures and workflows.
- Highlight obsolete tasks, duplicate work, and opportunities to simplify the current iPix architecture.
```