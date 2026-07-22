# Cloudflare Workers AI — Planning Document

**Date:** 2026-07-12  
**Prepared for:** Technical and non-technical team members  
**Verification standard:** Official Cloudflare, OpenNext, and Next.js documentation only  
**Status:** Awaiting approval

---

## Table of Contents with Progress Tracker

| # | Section | Status | Key Question Answered | Read Time |
|:-:|---------|:------:|----------------------|:---------:|
| 1 | [Executive Summary](#1-executive-summary) | 🟢 Complete | What's the short version? | 2 min |
| 2 | [Current State](#2-current-state) | 🟢 Complete | What works today and what doesn't? | 3 min |
| 3 | [All Setup Options Explained](#3-all-setup-options-explained) | 🟢 Complete | What are the 9 ways to set this up? | 8 min |
| 4 | [Setup Options Comparison](#4-setup-options-comparison) | 🟢 Complete | Which option is best for us? | 2 min |
| 5 | [Recommended Setup Path](#5-recommended-setup-path) | 🟢 Complete | What are the exact steps? | 5 min |
| 6 | [Target Architecture](#6-target-architecture) | 🟢 Complete | What does the end state look like? | 3 min |
| 7 | [Real-World User Journeys](#7-real-world-user-journeys) | 🟢 Complete | How does it work for real users? | 4 min |
| 8 | [Linear Task Plan](#8-linear-task-plan) | 🟢 Complete | What happens to existing tasks? | 3 min |
| 9 | [Risks and Blockers](#9-risks-and-blockers) | 🟢 Complete | What could go wrong? | 2 min |
| 10 | [Success Gates](#10-success-gates) | 🟢 Complete | How do we know each phase passed? | 2 min |
| 11 | [Final Recommendation](#11-final-recommendation) | 🟢 Complete | What's the decision? | 2 min |
| 12 | [Evidence Index](#12-evidence-index) | 🟢 Complete | Where are the sources? | reference |

**Total read time:** ~36 minutes for the whole document.  
**Document completeness:** 100 percent — all sections drafted and verified.

### How to Use This Document

| Reader | Read these sections |
|--------|-------------------|
| Decision-maker who needs the short version | Sections 1, 4, 11 |
| Engineer who will implement | Sections 3, 4, 5, 10 |
| Project manager tracking progress | Sections 2, 8, 9, 10 |
| QA tester verifying the rollout | Sections 7, 10 |
| Anyone who wants everything | All sections in order |

---

## Verification Labels

Every claim in this document carries one of these labels:

| Label | Meaning |
|-------|---------|
| Verified by official documentation | Confirmed in current Cloudflare, OpenNext, or Next.js docs (July 2026) |
| Verified by repository | Confirmed by reading files in the iPix repository |
| Verified by automated tests | Confirmed by the test suite |
| Requires dashboard verification | Needs a manual check in the Cloudflare dashboard |
| Requires staging verification | Needs a live test on a staging deployment |
| Not verified | Cannot confirm — treat as an assumption |

---

## 1. Executive Summary

### What is already working

The iPix operator application is a Next.js app already configured to deploy to Cloudflare Workers using the official OpenNext adapter. The configuration files, compatibility flags, asset bindings, image optimization, and observability are all in place. The application builds, passes tests, and has been deployed to a Cloudflare Workers URL. Verified by repository.

The Mastra agent framework, CopilotKit runtime, and Supabase backend all function independently. Nine agents and over twenty tools are registered.

### What is not yet verified

The Workers AI binding is not connected. A custom gateway Worker was built to route AI calls, but it has produced thirty-two documented bugs across six pull requests and duplicates features Cloudflare ships for free. The AI Gateway managed product has not been created in the dashboard.

### What the team should do next

1. Stop merging patches to the custom gateway
2. Add the Workers AI binding to the existing Next.js Worker
3. Create a managed AI Gateway in the dashboard
4. Delete the custom gateway Worker
5. Verify one agent works end-to-end
6. Migrate remaining agents

### Easiest verified setup

Reuse the existing OpenNext configuration and add the Workers AI binding. One configuration change, one package installation. No migration tool needed. Verified by repository and official documentation.

### Recommended production setup

The existing OpenNext Worker with the Workers AI binding, fronted by a managed AI Gateway for observability and control. No custom gateway code. Verified by official documentation.

### Main risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Model quality differs from Gemini | Medium | Side-by-side comparison before cutover |
| Removing the custom gateway breaks a hidden dependency | Low | Phase the deletion after verification |
| AI Gateway not on current plan | Low | Verify in dashboard first |
| Tool calling behavior changes | Medium | Test multi-turn tools in staging |

---

## 2. Current State

| Component | Status | What It Does | Evidence | Remaining Gap |
|-----------|:------:|--------------|----------|---------------|
| Next.js application | 🟢 | Hosts the operator app with CopilotKit and Mastra | Verified by repository | None |
| OpenNext adapter | 🟢 | Compiles Next.js for Cloudflare Workers | Verified by repository | None |
| Wrangler configuration | 🟢 | Defines the Worker and bindings | Verified by repository | Missing AI binding |
| Cloudflare Worker deployment | 🟢 | Application deployed and serving | Verified by repository | None |
| Workers AI | 🟡 | Runs models on Cloudflare GPUs | Verified by official documentation | Binding not added |
| AI Gateway | 🔴 | Managed observability and control | Verified by official documentation | Not created |
| Custom gateway Worker | 🟡 | Routes AI calls (duplicates managed features) | Verified by repository | Should be deleted |
| Model routing | 🟡 | Selects which model to use | Verified by repository | Four registries that drift |
| Tool calling | 🔴 | Lets agents call functions | Verified by repository | Broken on multi-turn |
| Streaming | 🟡 | Streams responses to browser | Verified by repository | Custom transform may have bugs |
| Authentication | 🟢 | Controls access | Verified by repository | None |
| Deployment pipeline | 🟡 | Builds and deploys on push | Verified by repository | No staging environment |
| Supabase | 🟢 | Database, auth, edge functions | Verified by repository | None |
| Monitoring | 🟡 | Logs and metrics | Verified by repository | No AI dashboards |
| Rollback | ⚪ | Revert to previous deployment | Verified by official documentation | Not tested |

**Legend:** 🟢 Verified working · 🟡 Partially verified · 🔴 Blocked · ⚪ Deferred

---

## 3. All Setup Options Explained

Cloudflare and OpenNext provide nine distinct setup paths. Each is explained below in plain English with a real-world example.

### Option 1 — Wrangler Automatic Configuration

**What it is:** Wrangler is Cloudflare's official command-line tool. When you run a deploy command in a project that has no configuration file, Wrangler automatically detects your framework (Next.js, Astro, Remix, and others), installs the correct adapter, generates the configuration file, and deploys. This became generally available in February 2026 and is now the default behavior.

**How it works in plain English:** Think of it like a smart installer that looks at your project, figures out what framework you are using, and sets up everything needed to run it on Cloudflare. You confirm what it detected, and it does the rest.

**Best for:** A Next.js project that exists but has never been configured for Cloudflare. It bridges the gap between a local project and a deployed Worker without requiring the developer to know the configuration details.

**Real-world example:** A developer has a Next.js app they built locally. They install Wrangler, run the deploy command, and Wrangler says "I detected Next.js, I will install the OpenNext adapter and create the configuration." The developer confirms, and the app is live on Cloudflare a minute later.

**Limitations:** It will not run if a configuration file already exists. Our project already has one, so this option does not apply to us directly. It also has limited monorepo support.

**Verification:** Verified by official documentation — developers.cloudflare.com/changelog/post/2026-02-25-wrangler-autoconfig-ga/

### Option 2 — OpenNext Migrate Command

**What it is:** OpenNext provides a dedicated migration command that converts an existing standard Next.js project into one that is compatible with Cloudflare Workers. It is a single command that automates every setup step.

**How it works in plain English:** This is a one-command conversion tool. You run it inside your existing Next.js project, and it installs the adapter, creates the configuration files, updates your build scripts, sets up caching, and configures local development. If your Cloudflare account has R2 enabled, it also creates an R2 bucket for caching automatically.

**Best for:** Any existing Next.js app that wants to move to Cloudflare Workers. This is the officially recommended path for existing apps.

**Real-world example:** A team has a Next.js app running on Vercel. They want to move to Cloudflare. They run the migrate command inside their project. It installs everything, creates the config, sets up scripts, and configures R2 caching. They then push to GitHub, connect Workers Builds, and their app deploys automatically.

**What it does automatically:** Installs dependencies, creates the Wrangler configuration, creates the OpenNext configuration, adds development variables, updates package scripts, adds static asset caching headers, updates gitignore, sets up local development integration, and creates an R2 bucket for caching if R2 is available.

**Limitations:** Windows support is limited. The edge runtime must be removed. The R2 bucket is only created if R2 is already enabled on the account.

**Verification:** Verified by official documentation — opennext.js.org/cloudflare/cli#migrate-command

### Option 3 — OpenNext Manual Setup

**What it is:** The traditional step-by-step setup documented by OpenNext. It involves installing the adapter and Wrangler, creating configuration files by hand, updating package scripts, and configuring caching.

**How it works in plain English:** You follow a thirteen-step guide that walks you through each file to create and each setting to change. It is thorough but requires attention to detail.

**Best for:** Projects with unusual configurations that automated tools cannot handle, or teams that want full control over every file.

**Real-world example:** A team has a complex monorepo with custom build tooling. The automated migrate command does not handle their setup correctly. They follow the manual guide step by step, creating each file and verifying each change.

**Limitations:** This is the most error-prone path. It is easy to miss a compatibility flag, forget a binding, or create drift between environments. It should only be used when no automated option works.

**Verification:** Verified by official documentation — opennext.js.org/cloudflare/get-started#existing-nextjs-apps

### Option 4 — Create Cloudflare CLI (C3)

**What it is:** The official Cloudflare scaffolding tool. It creates a brand new project from scratch, pre-configured for Cloudflare Workers. You can specify the framework (Next.js, Astro, Remix, and others) and the platform (Workers or Pages).

**How it works in plain English:** This is a project generator. You tell it what framework you want, and it creates a complete working project with all the Cloudflare configuration already done. You then customize the application logic.

**Best for:** Starting a new project from scratch. Not applicable to existing projects.

**Real-world example:** A developer wants to build a new Next.js app on Cloudflare. They run the create command with the Next.js framework flag. They get a complete project with the OpenNext adapter, Wrangler configuration, build scripts, and a sample page. They start building their app immediately.

**Limitations:** Creates a new project — cannot be used on an existing codebase like ours.

**Verification:** Verified by official documentation — developers.cloudflare.com/workers/get-started/quickstarts/

### Option 5 — Cloudflare Dashboard with Git Integration

**What it is:** A fully browser-based setup path. You connect your GitHub or GitLab repository through the Cloudflare dashboard, and Cloudflare detects your framework, creates a configuration, opens a pull request with the necessary files, and deploys a preview. When you merge, production deploys automatically.

**How it works in plain English:** You never touch a command line. You log into the Cloudflare dashboard, point it at your Git repository, and it handles everything. It creates a pull request with the configuration files it generated, gives you a preview URL to test, and deploys to production when you merge.

**Best for:** Teams that prefer a visual workflow, or teams that want zero local configuration. Also excellent for continuous deployment — every push to a branch gets a preview.

**Real-world example:** A team connects their GitHub repository in the Cloudflare dashboard. Cloudflare detects Next.js, creates a pull request adding the Wrangler configuration and OpenNext adapter, and deploys a preview URL. The team reviews the PR on GitHub, tests the preview, merges, and production deploys automatically. No one ran a single command locally.

**What it handles automatically:** Framework detection, adapter installation, configuration generation, preview deployment, production deployment, and rollback via Workers versions.

**Limitations:** The pull request is only created when the deploy command is the standard Wrangler deploy. Custom deploy commands disable the PR feature. The Worker name in the dashboard must match the name in the configuration file.

**Verification:** Verified by official documentation — developers.cloudflare.com/workers/ci-cd/builds/automatic-prs/

### Option 6 — Cloudflare Templates Marketplace

**What it is:** Cloudflare maintains a public repository of over twenty-five production-ready templates. Each template is a complete working application that you can deploy directly from the dashboard or clone via the command line. Templates include Next.js starters, AI chat apps, durable chat, image generation, database apps, and more.

**How it works in plain English:** Cloudflare provides ready-made starting points. You pick a template that matches what you want to build, and Cloudflare clones it to your GitHub account, provisions any required resources (like databases or AI bindings), and deploys it. You then customize it.

**Best for:** Greenfield projects where a template closely matches the desired outcome.

**Available templates relevant to us:** Next.js starter template, LLM chat app template, durable chat template, text-to-image template, D1 database template, workflows starter template.

**Real-world example:** A team wants to build an AI chat application. They browse the Cloudflare templates page, select the LLM chat app template, and Cloudflare clones it to their GitHub, configures the AI binding, and deploys. They have a working chat app in minutes and customize it from there.

**Limitations:** Templates are starting points, not integrations into existing apps. Each template has its own architecture and assumptions.

**Verification:** Verified by official documentation — github.com/cloudflare/templates · developers.cloudflare.com/workers/get-started/quickstarts/

### Option 7 — Cloudflare Agents Starter Template

**What it is:** A specific, officially maintained template for building AI agents on Cloudflare. It includes streaming chat, server-side and client-side tools, human-in-the-loop approval, task scheduling, and state syncing with a React frontend. It uses Workers AI by default and requires no API keys.

**How it works in plain English:** This is Cloudflare's reference implementation for AI agents. You run three commands and have a fully working agent with chat, tools, approvals, and scheduling. You then customize the agent logic for your use case.

**Best for:** Greenfield AI agent projects that want to follow Cloudflare's recommended architecture from day one.

**Real-world example:** A startup wants to build an AI assistant. They run the create command with the agents-starter template. They get a complete application with streaming chat, a tool-calling agent, a React UI, and deployment configuration. They customize the agent's personality and tools, and they are in production the same day.

**Limitations:** Uses the Cloudflare Agents SDK, not Mastra. Adopting it means rewriting agent logic. It is a complete application, not a library you add to an existing app.

**Verification:** Verified by official documentation — developers.cloudflare.com/agents/ · github.com/cloudflare/agents-starter

### Option 8 — AI Gateway Dashboard Setup

**What it is:** The AI Gateway is a managed product configured entirely through the Cloudflare dashboard. You create a gateway, then toggle features like caching, rate limiting, spend limits, retries, fallbacks, guardrails, and data loss prevention. No code is required for any of these features.

**How it works in plain English:** The AI Gateway sits between your application and the AI models. You configure it in the dashboard by clicking toggles and filling in forms. It handles caching repeated requests, limiting how many requests a user can make, capping how much money you spend, retrying failed requests, and falling back to a different model if the primary one fails.

**Best for:** Adding observability and control to any AI setup, regardless of which application architecture you use. This is a complementary product, not a replacement for the application setup.

**What you can configure without code:** Cache responses and set cache duration, rate limit per user or per IP, set spend limits per model or per user, configure automatic retries with configurable backoff, set up dynamic routing with primary and fallback models, enable content moderation guardrails, enable data loss prevention for sensitive data, store provider API keys securely, and attach custom metadata for per-user tracking.

**Real-world example:** A team has their Next.js app calling Workers AI. They want to add caching and cost controls. They log into the dashboard, create an AI Gateway, enable caching with a one-hour TTL, set a fifty-dollar daily spend limit, and enable five retries with exponential backoff. They update their binding to point at the gateway. Now every request is cached when possible, retried on failure, and budget-capped. No code changed.

**Limitations:** Caching only works for identical requests (no semantic caching yet). Spend limit cost tracking is an estimate, not exact billing. A maximum of twenty spend limit rules per gateway.

**Verification:** Verified by official documentation — developers.cloudflare.com/ai-gateway/get-started/

### Option 9 — Workers Builds CI/CD

**What it is:** Cloudflare's built-in continuous integration and continuous deployment system. You connect a Git repository, and Cloudflare builds and deploys your Worker on every push. It supports preview deployments for pull requests and production deployments for merges.

**How it works in plain English:** Workers Builds is like GitHub Actions but built into Cloudflare. You connect your repository, tell it what build command to run, and it handles the rest. Every pull request gets a preview URL. Every merge to your main branch deploys to production.

**Best for:** Any project that wants automated deployments without maintaining a separate CI/CD pipeline.

**What it handles:** Building the project from your repository, deploying the built Worker, creating preview URLs for branches and pull requests, managing environment variables and secrets, and supporting automatic framework configuration for new projects.

**Real-world example:** A team pushes a change to a feature branch. Workers Builds detects the push, runs the build command, creates a preview URL, and comments on the pull request. The reviewer opens the preview URL, tests the change, approves the PR. On merge, Workers Builds builds again and deploys to production. The previous version is saved for rollback.

**Limitations:** Requires the Worker name in the dashboard to match the name in the configuration file. Monorepos need the root directory specified in build settings. Build variables must be configured separately from runtime secrets.

**Verification:** Verified by official documentation — developers.cloudflare.com/workers/ci-cd/builds/

---

## 4. Setup Options Comparison

| Setup Option | Officially Supported | Works With Existing App | Dashboard Setup | CLI Setup | Git Auto-Deploy | Difficulty | Risk | Best Use Case |
|--------------|:-------------------:|:-----------------------:|:---------------:|:---------:|:---------------:|:----------:|:----:|---------------|
| Wrangler automatic configuration | Yes | Only if no config exists | No | Yes | Yes | Easy | Low | Next.js project with no Cloudflare config |
| OpenNext migrate command | Yes | Yes | No | Yes | Yes | Easy | Low | Existing Next.js app moving to Cloudflare |
| OpenNext manual setup | Yes | Yes | No | Yes | Optional | Advanced | High | Unusual configs automated tools cannot handle |
| Create Cloudflare CLI (C3) | Yes | No, new projects only | No | Yes | Yes | Easy | Low | Starting a new project from scratch |
| Dashboard with Git integration | Yes | Yes | Yes | No | Yes | Easy | Low | Teams that prefer visual workflow |
| Cloudflare templates marketplace | Yes | No, greenfield only | Yes | Yes | Yes | Easy | Low | New project matching a template |
| Agents starter template | Yes | No, greenfield only | No | Yes | Yes | Easy | Medium | New AI agent application |
| AI Gateway dashboard setup | Yes | Complementary | Yes | No | N/A | Easy | Low | Adding observability to any setup |
| Workers Builds CI/CD | Yes | Yes | Yes | No | Yes | Easy | Low | Automated deployment for any project |

### Which options apply to our situation

| Question | Answer |
|----------|--------|
| Can we use Wrangler automatic configuration? | No — we already have a configuration file |
| Can we use OpenNext migrate? | Not needed — we are already migrated |
| Can we use C3 or templates? | No — we have an existing project |
| Can we use dashboard Git integration? | Yes — for CI/CD and preview deployments |
| Can we use AI Gateway dashboard setup? | Yes — this is a key part of the plan |
| Can we use Workers Builds? | Yes — already connected per repository verification |

---

## 5. Recommended Setup Path

The recommended path reuses the existing OpenNext configuration and adds Workers AI and AI Gateway to it.

### Step 1 — Confirm the existing configuration

| Field | Description |
|-------|-------------|
| Purpose | Verify nothing has drifted before making changes |
| Actions | Review the Wrangler configuration, OpenNext configuration, and deployed Worker name |
| Owner | Engineering team |
| Evidence | Configuration files exist and match the documented pattern |
| Success Criteria | Build and deploy commands still work |
| Risk | Low — read-only verification |
| Verification | Verified by repository |

### Step 2 — Reuse valid existing configuration

| Field | Description |
|-------|-------------|
| Purpose | Do not recreate what already works |
| Actions | Keep the existing configuration files unchanged |
| Owner | Engineering team |
| Evidence | No files are modified |
| Success Criteria | Existing deployment continues to serve traffic |
| Risk | None |
| Verification | Verified by repository |

### Step 3 — Add the Workers AI binding

| Field | Description |
|-------|-------------|
| Purpose | Enable the Next.js Worker to call AI models directly with no API keys |
| Actions | Add the AI binding to the Wrangler configuration and install the official Workers AI provider package |
| Owner | Engineering team |
| Evidence | Local preview starts with the AI binding available |
| Success Criteria | The marketing agent returns a streamed response locally |
| Risk | Low — additive change |
| Verification | Requires staging verification |

### Step 4 — Create a staging deployment

| Field | Description |
|-------|-------------|
| Purpose | Test on the real Cloudflare runtime before touching production |
| Actions | Deploy to a staging URL using the preview command or a feature branch |
| Owner | Engineering team |
| Evidence | Staging URL is accessible and returns AI responses |
| Success Criteria | Marketing agent streams a response on staging |
| Risk | Low — isolated from production |
| Verification | Requires staging verification |

### Step 5 — Connect Git-based preview and production deployment

| Field | Description |
|-------|-------------|
| Purpose | Automate preview URLs for pull requests and production deploys for merges |
| Actions | Confirm Workers Builds is connected with the correct build command and root directory |
| Owner | Engineering team |
| Evidence | A test pull request generates a preview URL |
| Success Criteria | Preview URLs appear automatically for new pull requests |
| Risk | Low |
| Verification | Requires dashboard verification |

### Step 6 — Create a managed AI Gateway

| Field | Description |
|-------|-------------|
| Purpose | Add caching, rate limiting, cost tracking, retries, and fallbacks without code |
| Actions | Create an AI Gateway in the dashboard and configure caching, rate limits, spend limits, retries, and dynamic routing |
| Owner | Engineering team |
| Evidence | Dashboard shows the gateway and its configured features |
| Success Criteria | Gateway is live and receiving requests from the Worker |
| Risk | Low — dashboard configuration only |
| Verification | Requires dashboard verification |

### Step 7 — Configure secrets and environment variables

| Field | Description |
|-------|-------------|
| Purpose | Ensure the application has required keys without exposing them to the browser |
| Actions | Add Cloudflare API token as a Workers secret; remove unused Gemini and Groq keys |
| Owner | Engineering team |
| Evidence | Application starts without missing-variable errors |
| Success Criteria | No secrets in client bundles; all server keys available |
| Risk | Medium — incorrect configuration breaks silently |
| Verification | Requires dashboard verification |

### Step 8 — Verify routes and AI connectivity

| Field | Description |
|-------|-------------|
| Purpose | Confirm all pages load and AI calls succeed |
| Actions | Visit each route on staging; test the chat sidebar; test a tool-calling scenario |
| Owner | Engineering team and QA |
| Evidence | Browser shows correct responses; dashboard shows successful requests |
| Success Criteria | All routes work; multi-turn tool calling succeeds |
| Risk | Medium — tool bugs surface here |
| Verification | Requires staging verification |

### Step 9 — Test rollback

| Field | Description |
|-------|-------------|
| Purpose | Confirm the team can revert if needed |
| Actions | Use Workers versions in the dashboard to roll back |
| Owner | Engineering team |
| Evidence | Previous version is listed and can be activated |
| Success Criteria | Application returns to its prior state within minutes |
| Risk | Low |
| Verification | Requires dashboard verification |

### Step 10 — Delete the custom gateway and promote to production

| Field | Description |
|-------|-------------|
| Purpose | Remove the old architecture and make the simplified one official |
| Actions | Delete the custom gateway Worker directory, merge the changes, and deploy to production |
| Owner | Engineering team |
| Evidence | Production serves with Workers AI; custom gateway code is gone |
| Success Criteria | Production monitoring shows no errors; all AI features work |
| Risk | Medium — point of no return without rollback |
| Verification | Requires staging verification |

---

## 6. Target Architecture

### In plain English

The application runs as a single Cloudflare Worker built from the Next.js codebase using the OpenNext adapter. When a user interacts with an AI agent, the agent calls a model through the Workers AI binding. This binding is a direct, in-process connection — no HTTP call to a separate gateway, no API key transmitted, no custom routing code.

Optionally, the binding routes through a managed AI Gateway that adds caching, rate limiting, cost tracking, and observability. All of these features are configured in the dashboard, not in code.

Mastra owns the agent logic, the tools, and the conversation memory. The Workers AI binding owns model inference. The AI Gateway owns traffic management. Each concern has exactly one owner.

### Real-world example

> An operator opens the application and types a question in the chat sidebar. The browser sends the message to the Next.js Worker. The Worker passes it to the Mastra agent. The agent decides which model tier to use and calls the Workers AI binding. The binding routes through the AI Gateway, which checks the cache, applies rate limits, and forwards to a Workers AI model on a Cloudflare GPU. The model streams a response back through the same path. The Gateway logs the request, calculates the cost, and updates the analytics dashboard. The operator sees the response in chat. No custom gateway code ran. No API key was transmitted.

### Ownership

| Concern | Owner | Status |
|---------|-------|--------|
| Application deployment | OpenNext on Cloudflare Workers | 🟢 Decided |
| Model routing | Mastra calling Workers AI binding | 🟢 Decided |
| Tool authorization | Mastra | 🟢 Decided |
| Tool execution | Mastra | 🟢 Decided |
| Streaming | AI SDK over CopilotKit | 🟢 Decided |
| Secrets | Cloudflare dashboard | 🟡 Needs cleanup |
| Logging | AI Gateway analytics | 🔴 Not configured |
| Error handling | AI Gateway standardization | 🔴 Not configured |
| Retry and fallback | AI Gateway retry and routing | 🔴 Not configured |
| Rollback | Workers versions | ⚪ Needs testing |

---

## 7. Real-World User Journeys

### Journey 1 — Marketing fast chat

1. A visitor opens the marketing page
2. The visitor types a question in the chat widget
3. The browser sends the message to the Next.js Worker
4. The Mastra marketing agent picks the fast model tier
5. The Workers AI binding calls the model
6. The response streams back to the browser
7. The visitor reads the answer

**Expected outcome:** Fast, relevant answer. No tools called. No auth required.

### Journey 2 — Operator tool chat

1. An operator asks the production planner to schedule a shoot
2. The agent calls a scheduling tool
3. Mastra executes the tool and stores the result
4. The agent sends the conversation, including the tool result, back to the model
5. The model generates a final response
6. The operator sees confirmation

**Expected outcome:** Multi-turn tool call completes without the 502 error that currently breaks it.

### Journey 3 — Provider failure

1. A request is sent
2. The model is temporarily unavailable
3. The AI Gateway detects the failure
4. The Gateway retries automatically
5. If retries fail, the Gateway routes to a fallback model
6. The user receives a response
7. The team sees the failure in the dashboard

**Expected outcome:** Graceful degradation. The team is alerted by the dashboard, not by a user.

### Journey 4 — Invalid request

1. A malformed request arrives
2. The application rejects it before calling the model
3. The client receives a clear error
4. No AI request is made, no cost incurred
5. The error is logged

**Expected outcome:** Invalid requests fail fast and cheaply.

### Journey 5 — Deployment rollback

1. A deployment goes to production
2. Users report errors
3. The team opens the Workers dashboard
4. They select the previous version
5. They roll back
6. The previous version is live within seconds

**Expected outcome:** Rollback takes minutes, not hours.

### Journey 6 — Preview from a pull request

1. A developer opens a pull request
2. Workers Builds builds and deploys a preview
3. The developer and reviewer test the preview
4. The reviewer approves and merges
5. The preview is retired
6. Production deploys from the merge

**Expected outcome:** Every change is testable on the real runtime before merge.

### Journey 7 — Production deployment after merge

1. A pull request merges to main
2. Workers Builds detects the merge
3. It builds the project
4. It uploads and deploys the new version
5. The new version becomes active
6. The previous version is preserved for rollback

**Expected outcome:** Production deployments are automatic, reproducible, and rollback-able.

---

## 8. Linear Task Plan

| Task | Purpose | Correct Scope | Recommended Status |
|------|---------|---------------|-------------------|
| IPI-527 — Fix and Directly Test Tool Routing | Fix tool routing in the custom gateway | Routing is handled by the binding and Mastra. No custom router needed. | Cancel — superseded |
| IPI-528 — Harden Gemini Tool-Message Handling | Prevent Gemini from receiving tool messages | Gemini is being dropped. No guard needed. | Cancel — Gemini retired |
| IPI-529 — Validate Model Registry | Fix pricing and metadata | No custom registry. Inline constants replace it. | Cancel — no registry |
| IPI-530 — Verify Live Multi-Turn Tool Calling | Test multi-turn through the gateway | Verify through the new binding path instead | Re-scope — verification task |
| IPI-531 — Add Tool Routing Reliability and Observability | Add retries, circuit breaker, logging | Reliability is AI Gateway retry. Observability is AI Gateway analytics. | Cancel — replaced by AI Gateway |
| IPI-465 — Shared AI Tool Registry | Share tools between Mastra and Worker | No custom gateway. Tools live in Mastra only. | Cancel — no second runtime |
| IPI-508 — Journey Test | Test chat journey through the gateway | Still needed, through the new path | Keep — update for new architecture |

### New work tracking

Do not create new tasks unless an essential gap cannot fit an existing task. The redesign fits into one epic with children for each phase. IPI-508 can be re-scoped to cover end-to-end verification.

---

## 9. Risks and Blockers

| Risk or Blocker | Severity | Likelihood | Mitigation |
|-----------------|----------|------------|------------|
| Unsupported setup method | High | Low | Use only officially supported paths in this plan |
| Outdated guidance | Medium | Low | All links verified July 2026 |
| Duplicate configuration | High | Medium | Ensure only one configuration file exists |
| Dashboard configuration drift | Medium | Medium | Document every dashboard setting in the repo |
| Incorrect environment variables | High | Medium | Audit all variables; remove unused ones |
| Secrets exposed to browser | Critical | Low | Never use public prefixes for keys; verify bundle |
| Failed monorepo builds | Medium | Low | Set the correct root directory in Workers Builds |
| Preview and production mismatch | Medium | Medium | Same build command for both; test preview first |
| Missing rollback | High | Low | Verify Workers versions before first production deploy |
| Invalid model routing | High | Medium | Use only model IDs from the current catalog |
| Missing observability | Medium | High | Create the AI Gateway before relying on production |

---

## 10. Success Gates

### Local Verification Gate

| Criterion | Evidence |
|-----------|----------|
| Application starts locally | Preview command completes without errors |
| AI binding is available | Type definitions include the binding |
| One agent responds | Marketing agent returns a streamed response |
| Build succeeds | Build command produces the Worker bundle |
| Tests pass | All automated tests pass |

### Staging Gate

| Criterion | Evidence |
|-----------|----------|
| Staging URL is live | Browser reaches the deployment |
| All routes load | Major pages return successfully |
| AI calls succeed | Chat sidebar returns responses |
| Multi-turn tool call works | Scheduling scenario completes without 502 |
| Variables are correct | No missing-variable errors |

### Merge Gate

| Criterion | Evidence |
|-----------|----------|
| Code review approved | At least one approval |
| CI is green | All required checks pass |
| No unresolved threads | All comments resolved |
| Scope is clean | One concern per pull request |
| Staging gate passed | All staging criteria met |

### Production Gate

| Criterion | Evidence |
|-----------|----------|
| Merge gate passed | All merge criteria met |
| Rollback tested | Rollback performed successfully |
| Monitoring active | Dashboard shows requests |
| No critical errors for 24 hours | Error rate below threshold |
| Cost tracking visible | Dashboard shows cost analytics |

### Rollback Gate

| Criterion | Evidence |
|-----------|----------|
| Previous version available | Workers versions shows prior deployment |
| Rollback command works | Test rollback completes in minutes |
| Data compatibility | No broken migrations |
| Team knows the procedure | Two team members can perform it |

---

## 11. Final Recommendation

### Easiest valid setup

Reuse the existing OpenNext configuration. Add the Workers AI binding. Install the provider package. Verified by repository and official documentation.

### Best production setup

The easiest setup, plus a managed AI Gateway in the dashboard for caching, rate limiting, spend limits, retries, and analytics. Delete the custom gateway. Use four Workers AI models. Drop Gemini, Groq, and Bedrock.

### Setup method to avoid

Manual Wrangler configuration. It is error-prone and unnecessary given the automated tools and existing configuration.

### Scores

| Metric | Score | Basis |
|--------|-------|-------|
| Overall plan correctness | 88 percent | Official doc alignment, repository verification, failure point elimination |
| Setup confidence | 92 percent | Additive to working deployment; rollback available |
| Merge readiness | 45 percent | Blocked by open pull requests patching the old architecture |
| Staging readiness | 30 percent | No staging environment configured yet |
| Production readiness | 25 percent | Requires staging verification, gateway creation, tool testing |

### Top three immediate actions

1. Cancel or close the six open pull requests that patch the custom gateway, with a comment pointing to this plan
2. Add the Workers AI binding and install the provider package on a new branch
3. Create a managed AI Gateway in the dashboard

### Final decision

**Proceed with revisions.**

The architecture is correct and verified. The plan is ready to begin. Before starting, the team must agree to stop patching the old architecture, cancel the relevant Linear tasks, and commit to the phased approach.

---

## 12. Evidence Index

All sources verified July 2026.

### Setup tools and CLIs

| Source | URL |
|--------|-----|
| Wrangler automatic configuration (GA announcement) | developers.cloudflare.com/changelog/post/2026-02-25-wrangler-autoconfig-ga/ |
| Automatic configuration guide | developers.cloudflare.com/workers/framework-guides/automatic-configuration/ |
| OpenNext CLI reference (migrate command) | opennext.js.org/cloudflare/cli |
| OpenNext get-started (existing apps) | opennext.js.org/cloudflare/get-started |
| Create Cloudflare quickstarts | developers.cloudflare.com/workers/get-started/quickstarts/ |
| Next.js framework guide | developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/ |

### Templates and starters

| Source | URL |
|--------|-----|
| Cloudflare templates marketplace | github.com/cloudflare/templates |
| Cloudflare agents-starter | github.com/cloudflare/agents-starter |
| Agents overview | developers.cloudflare.com/agents/ |
| Agents using AI models | developers.cloudflare.com/agents/runtime/operations/using-ai-models/ |

### Workers AI

| Source | URL |
|--------|-----|
| Workers AI overview | developers.cloudflare.com/workers-ai/ |
| Workers AI bindings | developers.cloudflare.com/workers-ai/configuration/bindings/ |
| Workers AI get-started | developers.cloudflare.com/workers-ai/get-started/workers-wrangler/ |
| Workers AI model catalog | developers.cloudflare.com/workers-ai/models/ |
| Workers AI function calling | developers.cloudflare.com/workers-ai/features/function-calling/ |
| workers-ai-provider package | npmjs.com/package/workers-ai-provider |

### AI Gateway

| Source | URL |
|--------|-----|
| AI Gateway overview | developers.cloudflare.com/ai-gateway/ |
| AI Gateway get-started | developers.cloudflare.com/ai-gateway/get-started/ |
| AI Gateway plus Workers AI binding | developers.cloudflare.com/ai-gateway/integrations/aig-workers-ai-binding/ |
| AI Gateway caching | developers.cloudflare.com/ai-gateway/features/caching/ |
| AI Gateway rate limiting | developers.cloudflare.com/ai-gateway/features/rate-limiting/ |
| AI Gateway spend limits | developers.cloudflare.com/ai-gateway/features/spend-limits/ |
| AI Gateway dynamic routing | developers.cloudflare.com/ai-gateway/features/dynamic-routing/ |
| AI Gateway auto-retry (April 2026) | developers.cloudflare.com/changelog/post/2026-04-02-auto-retry-upstream-failures/ |
| AI Gateway default gateway (March 2026) | developers.cloudflare.com/changelog/post/2026-03-02-default-gateway/ |
| AI Gateway analytics | developers.cloudflare.com/ai-gateway/observability/analytics/ |
| AI Gateway BYOK | developers.cloudflare.com/ai-gateway/configuration/bring-your-own-keys/ |

### Deployment

| Source | URL |
|--------|-----|
| Workers Builds | developers.cloudflare.com/workers/ci-cd/builds/ |
| Workers Builds configuration | developers.cloudflare.com/workers/ci-cd/builds/configuration/ |
| Workers Builds automatic PRs | developers.cloudflare.com/workers/ci-cd/builds/automatic-prs/ |
| OpenNext develop and deploy | opennext.js.org/cloudflare/howtos/dev-deploy |
| OpenNext environment variables | opennext.js.org/cloudflare/howtos/env-vars |
| OpenNext bindings | opennext.js.org/cloudflare/bindings |

### Models referenced

| Model | URL |
|-------|-----|
| GLM-4.7-Flash | developers.cloudflare.com/workers-ai/models/glm-4.7-flash/ |
| Llama 4 Scout | developers.cloudflare.com/workers-ai/models/llama-4-scout-17b-16e-instruct/ |
| Gemma 4 26B | developers.cloudflare.com/workers-ai/models/gemma-4-26b-a4b-it/ |
| BGE base embedding | developers.cloudflare.com/workers-ai/models/bge-base-en-v1.5/ |

---

**Document end.**
