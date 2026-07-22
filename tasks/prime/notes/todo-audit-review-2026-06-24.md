> **⚠️ STALE — do not implement from this file (flagged 2026-07-21).** This is a meta-review of `tasks/prime/todo-audit.md`, whose IPI-900–921 roadmap was fabricated (see that file's new header). The 90/100 score and per-task corrections below are built on that fabricated content and are not actionable. The generic recommendations (milestone grouping, reusable verify scripts, ADRs, the 15-point review prompt) are still reasonable engineering practice in the abstract, just not tied to real backlog. The current, Linear-verified todo is [`/home/sk/ipix/todo.md`](../../todo.md).

# Audit Report — iPix Roadmap (Pasted markdown 234)

**Overall Score:** 🟢 **90/100**
**Estimated Success Rate:** 🟢 **95%** (after recommended improvements)

The roadmap is well structured and follows a logical progression from critical blockers (P0) to growth features (P2) and future work (P3). The main opportunity is to **reduce manual effort by grouping related implementation tasks, automating verification, and relying on official platform capabilities before writing custom code.** 

---

# Executive Summary

| Category                         |  Score | Status |
| -------------------------------- | -----: | :----: |
| Task ordering                    |     95 |   🟢   |
| Dependency management            |     94 |   🟢   |
| Official best practices          |     91 |   🟢   |
| Automation                       |     82 |   🟡   |
| Reuse existing platform features |     80 |   🟡   |
| Maintainability                  |     90 |   🟢   |
| Overall                          | **90** |   🟢   |

---

# Recommended Implementation Order

The overall implementation order is correct.

## Phase 1 — Critical Foundation (keep first)

1. **IPI-900 · AUDIT-P0-001 — Fix Lint Scope and Root App Lint Failures**
2. **IPI-901 · AUDIT-P0-002 — Re-prove Live Mercur Backend and B2C Storefront**
3. **IPI-902 · AUDIT-P0-003 — Re-prove Stripe Test Paid Order**
4. **IPI-903 · DNA-001 — Ship Asset DNA Scoring Edge Function**
5. **IPI-904 · UI-004 / AI-011 — Prove One Commerce Product Link Row**
6. **IPI-905 · PLT-005 — Restore CI Parity**

These establish a stable, verifiable platform before expanding functionality.

---

## Phase 2 — MVP Features (can partially run in parallel)

* **IPI-906 · AIOR-003 — Close Brand Intake HITL Branch**
* **IPI-907 · UI-003 — Build Asset Library MVP**
* **IPI-908 · UI-004 — Build Product Links MVP**
* **IPI-909 · COM-031 — Read-only Mercur Product Hydrate**
* **IPI-910 · SEC-003 — Security / RLS Audit**
* **IPI-911 · OPS-001 — Evidence Folder and Release Checklist**

Recommendation:

* Run **IPI-907** and **IPI-908** in parallel after **IPI-903**.
* Delay **IPI-910** until both workflows exist.
* Keep **IPI-911** as a release gate instead of active development.

---

## Phase 3 — Growth

Keep the existing order:

* **IPI-912 · COM-034 — iPix SaaS Billing**
* **IPI-913 · AI-009 / AI-018 — Gemini Model Registry**
* **IPI-914 · AIOR-001 / AIOR-002 — Mastra Runtime + CopilotKit**
* **IPI-915 · ANA-001 — Analytics Foundation**
* **IPI-916 · PLT-007 — Error Monitoring**

This sequence minimizes rework.

---

# Opportunities to Improve Efficiency

## 🔴 1. Merge Related Infrastructure Tasks

Instead of treating each small infrastructure task independently, group them into milestone-sized branches.

### Example

Current:

* IPI-903
* IPI-907

Recommended:

**Asset Intelligence Milestone**

Includes:

* Asset upload
* DNA scoring
* Asset list
* Review workflow
* DNA badges

One branch, one review, one deployment.

---

## 🟡 2. Convert Validation Tasks into Checklists

These tasks primarily verify work rather than implement new functionality.

| Current Task                             | Better Approach                 |
| ---------------------------------------- | ------------------------------- |
| IPI-910 · SEC-003 — Security / RLS Audit | Security Verification Checklist |
| IPI-911 · OPS-001 — Evidence Folder      | Release Checklist               |
| IPI-905 · PLT-005 — Restore CI Parity    | CI Gate Definition              |

This reduces ticket count while preserving quality.

---

## 🟡 3. Automate Repetitive Verification

Instead of repeating manual validation across tasks, create reusable commands.

Examples:

```bash
npm run verify:commerce
npm run verify:dna
npm run verify:security
npm run verify:release
```

Each command should collect:

* tests
* screenshots
* logs
* evidence

---

## 🟡 4. Use Existing Platform Features First

Before implementing custom functionality, check for existing support in:

* Supabase
* Cloudflare
* Mastra
* CopilotKit
* Mercur
* Stripe

Custom code should be the last option.

---

# Per-Task Corrections

## IPI-900 · AUDIT-P0-001 — Fix Lint Scope and Root App Lint Failures

🟢 Correct priority.

Improve by:

* excluding generated folders
* excluding vendor directories
* using flat ESLint config
* ensuring CI uses the same configuration locally

---

## IPI-901 · AUDIT-P0-002 — Re-prove Live Mercur Backend and B2C Storefront

Add:

* automated smoke tests
* health endpoint checks
* Playwright storefront validation

Avoid relying on manual browser testing.

---

## IPI-902 · AUDIT-P0-003 — Re-prove Stripe Test Paid Order

Add:

* automated Stripe test mode flow
* order verification script
* database validation

Generate evidence automatically.

---

## IPI-903 · DNA-001 — Ship Asset DNA Scoring Edge Function

Before implementing:

* verify Cloudinary capabilities
* review Gemini examples
* reuse existing Supabase Edge Function patterns

Avoid duplicate upload pipelines.

---

## IPI-904 · UI-004 / AI-011 — Prove One Commerce Product Link Row

Simplify:

Use Mercur APIs directly instead of copying product data into Supabase.

---

## IPI-905 · PLT-005 — Restore CI Parity

Combine:

* lint
* tests
* typecheck
* build

into one CI pipeline.

---

## IPI-906 to IPI-911

Good ordering.

Recommendation:

Deliver these as one MVP milestone instead of six independent releases.

---

## IPI-912 to IPI-916

Correct order.

No significant changes required.

---

# Missing Items

The roadmap would benefit from adding:

## Migration Rollback Checklist

Every deployment should prove:

* rollback
* recovery
* replay

---

## Performance Baseline

Record before and after:

* API latency
* AI latency
* database latency
* cold starts
* memory usage

---

## Architecture Decision Record (ADR)

Document:

* why a technology was selected
* alternatives considered
* migration impact

---

## Compatibility Matrix

Track support for:

| Component          | Status |
| ------------------ | ------ |
| Cloudflare Workers |        |
| Supabase           |        |
| Mastra             |        |
| CopilotKit         |        |
| Mercur             |        |
| Stripe             |        |

---

# Red Flags

## 🔴 Manual Evidence Collection

Many acceptance criteria require screenshots and logs.

Generate evidence automatically during CI where possible.

---

## 🟡 Duplicate Verification

Security, RLS, and release validation appear in multiple tasks.

Centralize them into reusable verification suites.

---

## 🟡 Documentation Drift

Several tasks require manual documentation updates.

Consider generating documentation from:

* Linear
* GitHub
* CI artifacts

---

# Concise Multi-Step Review Prompt

```text
Review this Linear task before implementation.

1. Verify against the latest official documentation.
2. Verify against official GitHub repositories and reference examples.
3. Search the project for reusable implementations.
4. Prefer platform configuration over custom code.
5. Identify blockers, risks, dependencies, and incorrect assumptions.
6. Suggest a simpler implementation if available.
7. Recommend tasks that can be merged or executed in parallel.
8. Generate an implementation checklist.
9. Generate automated tests and validation steps.
10. Generate rollback procedures.
11. Define performance benchmarks.
12. Confirm the implementation order.
13. Estimate implementation effort and probability of success.
14. Produce a concise audit report with required corrections.
15. Cite every official source used.
```

---

# Official References

## Cloudflare

* [https://developers.cloudflare.com/workers/](https://developers.cloudflare.com/workers/)
* [https://developers.cloudflare.com/workers-ai/](https://developers.cloudflare.com/workers-ai/)
* [https://developers.cloudflare.com/ai-gateway/](https://developers.cloudflare.com/ai-gateway/)
* [https://developers.cloudflare.com/workers/wrangler/](https://developers.cloudflare.com/workers/wrangler/)
* [https://github.com/cloudflare/workers-sdk](https://github.com/cloudflare/workers-sdk)

## Supabase

* [https://supabase.com/docs](https://supabase.com/docs)
* [https://supabase.com/docs/guides/functions](https://supabase.com/docs/guides/functions)
* [https://supabase.com/docs/reference/cli/introduction](https://supabase.com/docs/reference/cli/introduction)
* [https://github.com/supabase/supabase](https://github.com/supabase/supabase)

## Mastra

* [https://mastra.ai/docs](https://mastra.ai/docs)
* [https://github.com/mastra-ai/mastra](https://github.com/mastra-ai/mastra)
* [https://github.com/mastra-ai/mastra/tree/main/examples](https://github.com/mastra-ai/mastra/tree/main/examples)

## CopilotKit

* [https://docs.copilotkit.ai/](https://docs.copilotkit.ai/)
* [https://github.com/CopilotKit/CopilotKit](https://github.com/CopilotKit/CopilotKit)

## Stripe

* [https://docs.stripe.com/](https://docs.stripe.com/)
* [https://github.com/stripe/stripe-node](https://github.com/stripe/stripe-node)

## Playwright

* [https://playwright.dev/docs/intro](https://playwright.dev/docs/intro)

## Vitest

* [https://vitest.dev/guide/](https://vitest.dev/guide/)

## Final Assessment

| Area                              |  Score | Status |
| --------------------------------- | -----: | :----: |
| Task order                        |     95 |   🟢   |
| Dependency management             |     94 |   🟢   |
| Use of official platform features |     90 |   🟢   |
| Automation potential              |     82 |   🟡   |
| Maintainability                   |     91 |   🟢   |
| Overall roadmap                   | **90** |   🟢   |

**Conclusion:** The roadmap is well prioritized and should succeed. The largest gains will come from **grouping related implementation tasks into milestones, replacing repetitive manual verification with reusable automated validation, and maximizing reuse of official platform capabilities before introducing custom code.** 
