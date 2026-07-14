Act as a **Cloudflare Staff Engineer, Next.js expert, and technical architect**.

Research every topic using **official Cloudflare documentation first**, then official GitHub repositories, engineering blog posts, starter templates, reference implementations, and trusted technical articles.

Do **not** assume the current architecture is correct. Challenge every decision and recommend the **simplest, most maintainable, production-ready architecture**.

The goal is to build a reusable Cloudflare Workers AI foundation that minimizes complexity, reduces bugs, speeds development, and follows proven best practices.

---

# Research Requirements

For **every** topic:

1. Read the official documentation.
2. Read the official GitHub repository.
3. Read official examples/templates.
4. Find production implementations.
5. Compare multiple approaches.
6. Recommend the simplest approach.
7. Explain why it is better.
8. Link every source.

Do not make assumptions.

---

# Table of Contents (Progress Tracker)

|  # | Section                         | Official Docs | GitHub | Examples | Status | Score | Notes |
| -: | ------------------------------- | ------------- | ------ | -------- | ------ | ----: | ----- |
|  1 | Executive Summary               | ⬜             | ⬜      | ⬜        | ⬜      |       |       |
|  2 | Cloudflare Architecture         | ⬜             | ⬜      | ⬜        | ⬜      |       |       |
|  3 | Setup Options Comparison        | ⬜             | ⬜      | ⬜        | ⬜      |       |       |
|  4 | Dashboard Setup                 | ⬜             | ⬜      | ⬜        | ⬜      |       |       |
|  5 | CLI & Wrangler                  | ⬜             | ⬜      | ⬜        | ⬜      |       |       |
|  6 | C3 Project Generator            | ⬜             | ⬜      | ⬜        | ⬜      |       |       |
|  7 | Next.js + OpenNext              | ⬜             | ⬜      | ⬜        | ⬜      |       |       |
|  8 | Workers AI                      | ⬜             | ⬜      | ⬜        | ⬜      |       |       |
|  9 | AI Gateway                      | ⬜             | ⬜      | ⬜        | ⬜      |       |       |
| 10 | Models                          | ⬜             | ⬜      | ⬜        | ⬜      |       |       |
| 11 | Tool Calling                    | ⬜             | ⬜      | ⬜        | ⬜      |       |       |
| 12 | Functions & APIs                | ⬜             | ⬜      | ⬜        | ⬜      |       |       |
| 13 | Agents SDK                      | ⬜             | ⬜      | ⬜        | ⬜      |       |       |
| 14 | Durable Objects                 | ⬜             | ⬜      | ⬜        | ⬜      |       |       |
| 15 | D1 / KV / R2 / Vectorize        | ⬜             | ⬜      | ⬜        | ⬜      |       |       |
| 16 | Authentication                  | ⬜             | ⬜      | ⬜        | ⬜      |       |       |
| 17 | Secrets & Environment           | ⬜             | ⬜      | ⬜        | ⬜      |       |       |
| 18 | Local Development               | ⬜             | ⬜      | ⬜        | ⬜      |       |       |
| 19 | Testing Strategy                | ⬜             | ⬜      | ⬜        | ⬜      |       |       |
| 20 | CI/CD                           | ⬜             | ⬜      | ⬜        | ⬜      |       |       |
| 21 | Deployment                      | ⬜             | ⬜      | ⬜        | ⬜      |       |       |
| 22 | Monitoring & Logging            | ⬜             | ⬜      | ⬜        | ⬜      |       |       |
| 23 | Rollback Strategy               | ⬜             | ⬜      | ⬜        | ⬜      |       |       |
| 24 | HTML → Cloudflare Workflow      | ⬜             | ⬜      | ⬜        | ⬜      |       |       |
| 25 | Recommended Implementation Plan | ⬜             | ⬜      | ⬜        | ⬜      |       |       |

Use:

* ⬜ Not Started
* 🟡 In Progress
* 🟢 Complete
* 🔴 Blocked

---

# Research Each Topic

For every section provide:

## 1. Overview

Simple explanation.

## 2. Official Documentation

List every official page used.

| Title | Link | Purpose |
| ----- | ---- | ------- |

## 3. Official GitHub Repositories

| Repository | Link | Why it matters |

## 4. Official Starter Templates

| Template | Link | Features | Recommended |

## 5. Alternative Approaches

Compare:

* Dashboard-first
* C3 + Wrangler
* Existing Next.js migration
* OpenNext
* Static Worker
* Workers AI starter
* Agents starter

## 6. Setup Steps

Explain step-by-step.

Include:

* Dashboard
* CLI
* Files created
* Commands
* Validation
* Rollback

## 7. Commands

Provide copy/paste commands.

Explain what every command does.

## 8. Folder Structure

Show recommended project structure.

## 9. Common Mistakes

List:

* Beginner mistakes
* Configuration mistakes
* Deployment mistakes
* Security mistakes

Explain how to avoid them.

## 10. Best Practices

Official recommendations.

## 11. Real-world Example

Explain where this approach is used.

## 12. Complexity Rating

| Metric               | Score |
| -------------------- | ----: |
| Setup difficulty     |       |
| Maintenance          |       |
| Error risk           |       |
| Learning curve       |       |
| Production readiness |       |

---

# Compare All Setup Options

Create this comparison table.

| Option | Dashboard | CLI | Templates | GitHub Deploy | Existing App | AI Ready | Difficulty | Error Risk | Score |
| ------ | --------- | --- | --------- | ------------- | ------------ | -------- | ---------- | ---------- | ----: |

Include:

* Dashboard-first
* C3
* Wrangler
* OpenNext
* Existing Next.js
* Static Worker
* Agents Starter
* Workers AI Starter

Recommend:

* Best overall
* Best beginner
* Best enterprise
* Best existing Next.js migration
* Best HTML conversion
* Best AI application

Explain **why**.

---

# Build the New Implementation Plan

Create a clean implementation roadmap.

For each phase include:

* Goal
* Tasks
* Commands
* Files
* Dependencies
* Validation
* Tests
* Rollback

Use this format:

`IPI-XXX · TASK-ID — Full Task Name`

---

# Create Plan Documents

Generate separate documents:

1. `01-executive-summary.md`
2. `02-cloudflare-architecture.md`
3. `03-setup-options.md`
4. `04-dashboard-setup.md`
5. `05-cli-and-wrangler.md`
6. `06-nextjs-opennext.md`
7. `07-workers-ai.md`
8. `08-ai-gateway.md`
9. `09-model-selection.md`
10. `10-functions-and-routing.md`
11. `11-testing.md`
12. `12-cicd.md`
13. `13-security.md`
14. `14-observability.md`
15. `15-deployment.md`
16. `16-rollbacks.md`
17. `17-html-conversion-workflow.md`
18. `18-task-roadmap.md`

Each document should contain:

* Purpose
* Official documentation links
* Official GitHub links
* Setup instructions
* Commands
* Best practices
* Common mistakes
* Validation checklist
* Production checklist

---

# Final Deliverables

Provide:

1. Executive summary
2. Recommended architecture
3. Simplest setup
4. Best Cloudflare template
5. Best Next.js deployment strategy
6. Best Workers AI setup
7. Best model strategy
8. Best testing strategy
9. Best deployment strategy
10. Complete implementation roadmap

Finally answer:

* Is the current plan over-engineered?
* What can be removed?
* What should be simplified?
* What should be Cloudflare-native instead of custom?
* How many implementation tasks are actually needed?
* What is the fastest path to a production-ready system?

Every recommendation must be backed by official documentation or an official GitHub repository. Clearly distinguish official guidance from community recommendations.
