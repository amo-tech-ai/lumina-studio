# Claude Code — Master Architecture & Cloudflare Planning Audit

You are a Principal Software Architect, Cloudflare Workers expert, AI platform architect, and forensic systems auditor.

Your goal is **not to write code first**.

Your goal is to redesign the entire iPix platform architecture for Cloudflare Workers and produce a production-ready roadmap, PRDs, architecture documentation, Mermaid diagrams, and implementation plans.

---

# Project

Repository

`/home/sk/ipix/app`

Additional documentation

```
/home/sk/ipix/Universal-design-prompt-new
/home/sk/ipix/tasks/cloudflare
/home/sk/ipix/linear/all-issues.md
```

Review everything before making recommendations.

Do not assume documentation is correct.

Verify everything against the codebase.

---

# Primary Goal

Create the definitive architecture for iPix running on:

* Cloudflare Workers
* OpenNext
* Cloudflare AI Gateway
* Workers AI
* Mastra
* CopilotKit
* Supabase
* Cloudinary
* Stripe
* OpenClaw
* Cloudflare Queues
* Cloudflare Workflows
* Durable Objects
* KV
* Browser Rendering (evaluate)
* Vectorize (evaluate)
* R2 (evaluate)

The result should become the new source of truth.

---

# Phase 1 — Repository Audit

Review

```
/home/sk/ipix/app
```

Identify

* architecture
* folder structure
* feature modules
* routing
* shared components
* AI architecture
* Supabase architecture
* Cloudflare setup
* OpenNext setup
* Worker configuration
* Wrangler
* build pipeline
* CI/CD
* auth
* middleware
* API routes
* Mastra integration
* CopilotKit integration
* model providers
* Cloudinary integration
* Stripe integration
* CRM
* Booking
* Brand
* Shoot
* Campaign
* Planner
* Assets
* Intelligence
* Notifications

Produce:

Current Architecture Report

---

# Phase 2 — Documentation Audit

Review

```
/home/sk/ipix/Universal-design-prompt-new
```

Review

```
/home/sk/ipix/tasks/cloudflare
```

Determine

* outdated docs
* duplicated docs
* conflicting docs
* stale architecture
* obsolete Vercel assumptions
* Groq-era documentation
* missing documentation

Create

Documentation Audit Report

---

# Phase 3 — Linear Audit

Review

```
/home/sk/ipix/linear/all-issues.md
```

Classify every issue into

* MVP
* Core
* Advanced
* Infrastructure
* AI
* Design
* Backend
* Cloudflare
* Technical Debt
* Future

For every issue determine

* Keep
* Split
* Merge
* Move
* Close
* Cancel
* Rename

Identify

* duplicate tasks
* stale tasks
* missing tasks
* oversized tasks
* wrong dependencies
* missing acceptance criteria
* incorrect sequencing

Generate a new dependency graph.

---

# Phase 4 — Cloudflare Architecture

Design the ideal production architecture.

Cover

Cloudflare

OpenNext

Workers

Workers AI

AI Gateway

KV

Queues

Workflows

Durable Objects

Vectorize

Browser Rendering

R2

Analytics

Observability

Rate Limiting

Secrets

Deployments

Preview environments

Rollback strategy

Disaster recovery

High availability

Cost optimization

State clearly for each service

Use Now

Use Later

Evaluate

Do Not Use

Explain why.

---

# Phase 5 — AI Architecture

Design the complete AI platform.

Include

Mastra

CopilotKit

Shared Tool Registry

Prompt Registry

Model Registry

Provider Registry

Provider Router

AI Gateway

Streaming

Structured Output

Tool Calling

Human in the Loop

Agent Runtime

Worker Runtime

Long-running Workflows

Async Jobs

Agent Communication

Agent Memory

Logging

Observability

Audit Trails

Model Evaluation

Failover

Fallback

Cost Routing

Provider Selection

Future MCP Integration

---

# Phase 6 — Feature Architecture

Review every major feature.

Brand

Onboarding

AI Brief

Shoot

Media

Cloudinary

CRM

Campaigns

Planner

Bookings

Notifications

Assets

Intelligence

Operator Dashboard

For each feature produce

Current State

Target State

Dependencies

Workflow

Missing Components

Recommended Changes

Technical Risks

Priority

MVP

Core

Advanced

---

# Phase 7 — PRDs

Create a complete PRD for each major subsystem.

Examples

Platform PRD

Cloudflare PRD

AI Platform PRD

CRM PRD

Booking PRD

Brand PRD

Shoot PRD

Media PRD

Cloudinary PRD

Campaign PRD

Planner PRD

Operator Dashboard PRD

Notifications PRD

Asset Library PRD

Intelligence PRD

Each PRD must contain

Purpose

Goals

Architecture

User Flows

Database

API

Components

Dependencies

Acceptance Criteria

Testing

Risks

Future Enhancements

---

# Phase 8 — Roadmaps

Produce

1. Overall Product Roadmap

2. MVP Roadmap

3. Core Roadmap

4. Advanced Roadmap

5. Cloudflare Migration Roadmap

6. AI Platform Roadmap

7. Design V2 Roadmap

8. Database Roadmap

9. Infrastructure Roadmap

10. Technical Debt Roadmap

Show dependencies between all roadmaps.

---

# Phase 9 — Mermaid Diagrams

Generate production-quality Mermaid diagrams.

Include

Overall System Architecture

Cloudflare Architecture

Application Architecture

Operator Architecture

AI Architecture

Mastra Architecture

CopilotKit Architecture

Supabase Architecture

Cloudinary Architecture

Stripe Architecture

Planner Architecture

CRM Architecture

Booking Architecture

Brand Workflow

Shoot Workflow

Campaign Workflow

Notification Flow

Authentication Flow

AI Gateway Routing

Provider Routing

Shared Tool Registry

Prompt Registry

Model Registry

Database ER Diagram

Deployment Pipeline

CI/CD Pipeline

Cloudflare Services

Worker Communication

Queue Flow

Durable Object Flow

Realtime Flow

State Transitions

Feature Dependency Graph

Linear Dependency Graph

Roadmap Timeline

---

# Phase 10 — File Structure

Recommend an ideal production folder structure.

Include

docs/

architecture/

prd/

roadmaps/

diagrams/

cloudflare/

ai/

agents/

features/

supabase/

runbooks/

decision-records/

operations/

---

# Phase 11 — Skills

Use all relevant project skills where applicable, including:

* cloudflare
* mastra
* copilotkit
* supabase
* planner
* task-verifier
* architecture
* claude-design
* workflow-design
* frontend
* backend
* ai
* security
* performance
* testing
* deployment

If multiple skills overlap, combine them into one recommendation.

---

# Deliverables

Produce a `/docs/v3/` documentation set containing:

* Executive Summary
* Architecture Overview
* Cloudflare Migration Guide
* Master PRD
* Individual PRDs
* Architecture Decision Records (ADRs)
* Mermaid diagrams
* Roadmaps
* Feature Plans
* Migration Checklist
* Risk Register
* Technical Debt Register
* Production Readiness Checklist
* Testing Strategy
* Deployment Strategy
* Operations Runbook
* Monitoring & Observability Guide

---

# Success Criteria

The final result should:

* become the new architecture source of truth
* align all Linear issues with the new architecture
* eliminate stale and duplicate work
* optimize for Cloudflare Workers
* support CopilotKit, Mastra, Supabase, Stripe, Cloudinary, and OpenClaw
* define a clear MVP → Core → Advanced evolution
* include implementation order with dependencies
* identify blockers, risks, and production gaps
* provide a complete, production-ready roadmap with Mermaid diagrams and actionable implementation plans.
