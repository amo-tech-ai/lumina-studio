# Linear Synchronization Audit

## Verdict

**No — not all suggested improvements have been added correctly to Linear.**

A strong group of new follow-up tasks was created, especially around security, privacy, failure testing and observability. However:

* several recommendations remain missing;
* several are only partially represented;
* multiple existing issues still describe the retired custom-gateway architecture;
* some new issue descriptions repeat technical errors already identified in the task audits.

> **Superseded (partially):** This audit predates the creation of `IPI-606`–`IPI-611`. Per-agent
> routing flags (`IPI-607`), the production soak gate (`IPI-609`), the AI Search child tasks
> (`IPI-608`, `IPI-610`, `IPI-611`), and `CF-SEC-010` (`IPI-606`) are now tracked in Linear — see
> `notes/09-notes-linear.md` (lines 20–27) and `notes/10-linear-list.md` (lines 8–10, 36–42) for
> current coverage. The findings below are kept as the historical point-in-time record and were
> not silently rewritten; do not create duplicate issues for the items flagged "🔴 Missing" in
> sections 3–5 or the "Final audit result" table without checking `notes/09`/`notes/10` first.

### Overall synchronization score

| Area                                           |   Score | Status            |
| ----------------------------------------------- | ------: | ------------------ |
| Security and privacy improvements added        |     90% | 🟢                |
| Failure testing and rollback improvements      |     82% | 🟢                |
| Gateway managed-feature improvements           |     72% | 🟡                |
| Efficient agent migration structure            |     45% | 🟡                |
| AI Search improvements                         |     35% | 🔴                |
| Infisical integration                          |     25% | 🔴                |
| Cleanup sequencing and production gates        |     60% | 🟡                |
| Dashboard/CLI/module/example-first requirement |     30% | 🔴                |
| Removal of stale architecture                  |     35% | 🔴                |
| **Overall Linear synchronization**             | **63%** | **🟡 Incomplete** |

---

# 1. Improvements successfully added to Linear

These recommendations now have identifiable Linear issues.

| Linear task                                                                     | Suggested improvement covered                                                           | Status             | Audit                                  |
| --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------- | ----------------------------------------- |
| **IPI-595 · CF-GW-010 — Configure AI Gateway Authentication**                   | Authenticated Gateway, anonymous-negative test, binding pre-authentication, token scope | 🟢 Added correctly | Strong                                 |
| **IPI-596 · CF-GW-011 — Configure AI Gateway DLP**                              | Separate sensitive-data protection from Guardrails                                      | 🟢 Added correctly | Strong                                 |
| **IPI-597 · CF-GW-012 — Define AI Gateway Prompt Logging and Retention Policy** | Decide whether prompts/responses may be stored                                          | 🟢 Added correctly | Strong                                 |
| **IPI-598 · CF-GW-013 — Create Versioned AI Gateway Configuration Record**      | Prevent undocumented dashboard drift                                                    | 🟢 Added           | Needs API-first investigation          |
| **IPI-599 · CF-GW-014 — Add Central AI Gateway Error Mapping**                  | Shared handling for 429, budget, moderation and provider failures                       | 🟢 Added           | Strong                                 |
| **IPI-600 · CF-GW-015 — Build Reusable Model Capability Matrix**                | Validate fallback model compatibility                                                   | 🟢 Added           | Strong                                 |
| **IPI-601 · CF-GW-016 — Add Request Idempotency Controls for Tool Retries**     | Prevent duplicate write-side tool execution                                             | 🟢 Added           | Strong                                 |
| **IPI-602 · CF-OBS-010 — Configure AI Gateway Monitoring and Alerts**           | Alerts instead of dashboard-only observation                                            | 🟢 Added           | Needs Cloudflare capability validation |
| **IPI-603 · CF-TEST-011 — Run AI Gateway Failure-Injection Suite**              | Controlled retry, fallback, limit and Guardrails testing                                | 🟢 Added           | Strong                                 |
| **IPI-604 · CF-OPS-010 — Test AI Gateway Bypass and Rollback**                  | Prove direct Workers AI fallback instead of assuming it                                 | 🟢 Added           | Strong                                 |
| **IPI-605 · CF-SEC-011 — Audit AI Gateway Metadata and Log Privacy**            | Verify hashed identifiers and five-field limit                                          | 🟢 Added           | Strong                                 |

These issues appear in the latest Linear export and are tied to the Cloudflare project.

Cloudflare's current documentation supports the central technical assumptions behind several of these tasks:

* Authenticated Gateway rejects unauthenticated REST requests when enabled.
* Workers binding calls are pre-authenticated.
* AI Gateway tokens are account-scoped, not gateway-scoped.
* Metadata supports a maximum of five entries and excess entries are ignored.
* DLP, Dynamic Routing, Spend Limits and Guardrails are currently marked Beta. ([Cloudflare Docs][1])

---

# 2. Suggested improvements only partially added

## A. IPI-594 · CF-MIG-230 — Migrate all Mastra agents to Workers AI via ipix-prod

**Coverage: approximately 55% 🟡**

### Added

* Dynamic model resolution.
* Cloudflare environment passed through Mastra `RequestContext`.
* Dependency on **IPI-586 · CF-AI-003 — Wire One Workers AI Call Through ipix-prod Gateway**.
* Link to **IPI-591 · CF-TEST-010 — Verify Multi-Turn Tool Calling Through Native Gateway**.
* All nine agents are identified.

### Still missing

* No migration waves.
* No per-agent feature flag.
* No canary percentages.
* No independent rollback per agent.
* No golden evaluation gate before each agent switches.
* No centralized resolver acceptance criterion.
* No explicit low-risk-first order.
* No sensitive CRM-specific security gate.
* No separate PRs by agent class.

### Critical correction

Rename to:

**IPI-594 · CF-MIG-230 — Migrate Mastra Agents to Cloudflare-Native AI Routing**

"Workers AI only" is too restrictive. Cloudflare's official AI repository includes both `workers-ai-provider` and `ai-gateway-provider`, allowing a centralized provider layer to use Workers AI or other approved models through AI Gateway. ([GitHub][2])

### Required child tasks

| Proposed task | Full task name                                                |
| ------------- | ----------------------------------------------------------------|
| New           | **CF-MIG-230A — Build Agent Routing Compatibility Matrix**    |
| New           | **CF-MIG-230B — Add Per-Agent Routing Feature Flags**         |
| New           | **CF-MIG-230C — Migrate Public Marketing Agent**              |
| New           | **CF-MIG-230D — Migrate Simple Non-Tool Agents**              |
| New           | **CF-MIG-230E — Migrate Production Planner Tool Flow**        |
| New           | **CF-MIG-230F — Migrate Brand Intelligence Structured Flow**  |
| New           | **CF-MIG-230G — Migrate CRM Assistant with Tenant Tests**     |
| New           | **CF-MIG-230H — Complete Canary Rollout and Production Soak** |

---

## B. IPI-592 · CF-MIG-820 — Delete Custom AI Gateway Worker

**Coverage: approximately 60% 🟡**

### Added correctly

* Corrected task-ID collision.
* Marked Phase 9 of 9.
* Explicitly says not to start early.
* Requires production verification, fallback and rollback.

### Still missing

* No explicit zero-legacy-traffic observation period.
* No named production soak duration.
* No requirement for 100% native traffic.
* No requirement to audit Vercel variables, Infisical, GitHub Actions and dashboard references.
* No split into three manageable cleanup PRs.
* No distinction between deprecating, revoking and deleting secrets.
* No infrastructure-level rollback.
* No requirement to preserve behavior tests.
* No final secret scanner.
* No requirement to delete the deployed Worker itself.

### Serious stale statement

The issue says:

> `services/cloudflare-worker/` is the live production AI path today.

Your subsequent verification showed no production caller depends on it and its public `workers.dev` route was disabled. That description must be updated.

### Correct cleanup structure

| PR   | Scope                                                                                    |
| ---- | ------------------------------------------------------------------------------------------ |
| PR A | Remove dead flags, references and routing branches                                       |
| PR B | Remove legacy Worker and provider implementation                                         |
| PR C | Remove unused packages, revoke secrets, delete deployed Worker and archive documentation |

---

## C. IPI-590 · CF-GW-002 — Configure AI Gateway Managed Features

**Coverage: approximately 65% 🟡**

The issue tracks caching, rate limiting, spend limits, retries, metadata, Dynamic Routing and Guardrails.

### Critical error

It says:

> All 7 are dashboard toggles — no code changes.

That is false.

| Feature         | Dashboard-only? | Application work                              |
| --------------- | --------------: | ------------------------------------------------ |
| Caching default |          Mostly | Selective skip/cache policy still needed      |
| Rate limit      |          Partly | Trusted tenant dimension and 429 UX needed    |
| Spend limit     |          Partly | Metadata, budget UX and fallback policy       |
| Retry           |          Mostly | Idempotency and latency policy                |
| Metadata        |              No | Must be attached at call sites/provider layer |
| Dynamic Routing |              No | Application must call the named route         |
| Guardrails      |          Partly | Blocked-response UX and false-positive policy |

Cloudflare documents binding metadata inside `gateway.metadata`, and Dynamic Routing as a named-route integration rather than a passive dashboard switch. Metadata is code-level integration. ([Cloudflare Docs][1])

### Required rewrite

Convert **IPI-590 · CF-GW-002 — Configure AI Gateway Managed Features** into a pure umbrella issue and add relationships to **IPI-595 through IPI-605**.

Do not place all seven implementation acceptance criteria directly inside one umbrella issue.

---

## D. IPI-598 · CF-GW-013 — Create Versioned AI Gateway Configuration Record

**Coverage: approximately 70% 🟡**

This is a good drift-control task.

### Missing managed-first requirement

Before creating a manually maintained Markdown snapshot, the task must check:

1. Cloudflare AI Gateway REST API.
2. Audit Logs.
3. Terraform/provider coverage, if applicable.
4. Cloudflare MCP.
5. Dashboard export capabilities.
6. Official configuration APIs.

Manual documentation should be the fallback, not the first solution.

---

# 3. Suggested improvements missing from Linear

> **Superseded:** per-agent flags, migration waves, AI Search rows, and Infisical/`CF-SEC-010`
> below are now covered by `IPI-606`–`IPI-611` — see `notes/09-notes-linear.md` (lines 20–27) and
> `notes/10-linear-list.md` (lines 8–10, 36–42).

## Missing task group

| Missing improvement                                                            | Linear coverage | Required action                                               |
| ---------------------------------------------------------------------------------- | ------------------ | ----------------------------------------------------------------- |
| Mandatory dashboard/CLI/package/template/example-first checklist on every task | 🔴 Missing      | Add template requirement to epic/task standard                |
| Official GitHub repository/example verification                                | 🔴 Missing      | Add explicit acceptance field                                 |
| Official tutorial/recipe verification                                          | 🔴 Missing      | Add explicit acceptance field                                 |
| Per-agent feature flags                                                        | 🔴 Missing      | Create dedicated task                                         |
| Agent migration waves                                                          | 🔴 Missing      | Split IPI-594                                                 |
| Canary traffic percentages                                                     | 🔴 Missing      | Add rollout task                                               |
| Automatic rollback thresholds                                                  | 🔴 Missing      | Add to rollout/SLO task                                       |
| AI Search dashboard pilot                                                      | 🔴 Missing      | Create child under IPI-474                                    |
| AI Search tenant isolation                                                     | 🔴 Missing      | Create security/design task                                   |
| AI Search document lifecycle/deletion                                          | 🔴 Missing      | Create governance task                                        |
| AI Search citations and unsupported-query evaluation                           | 🔴 Missing      | Create quality task                                           |
| Infisical → Cloudflare deployment synchronization                              | 🔴 Missing      | Create dedicated task                                         |
| Build-time versus runtime secret matrix                                        | 🟡 Partial      | IPI-472 mentions it, but no Infisical workflow                |
| Three-PR cleanup structure                                                     | 🔴 Missing      | Add to IPI-592                                                |
| Zero legacy traffic audit                                                      | 🔴 Missing      | Create explicit pre-cleanup gate                               |
| Production soak duration                                                       | 🔴 Missing      | Add owner and duration                                         |
| Central agent resolver                                                         | 🟡 Partial      | Implied by IPI-594, not explicit                               |
| Golden per-agent evaluation fixtures                                           | 🟡 Partial      | IPI-462 is broad; migration does not depend on per-agent pass |
| Cloudflare templates/examples checked per task                                 | 🔴 Missing      | Add mandatory managed-first section                            |
| Official Cloudflare AI provider packages inspected                             | 🔴 Missing      | Add to IPI-586/IPI-594                                         |
| Official OpenNext migration/template validation                                | 🟡 Partial      | IPI-472 covers deployment but not the mandatory checklist     |
| Dashboard configuration reproducibility                                        | 🟡 Partial      | IPI-598 only                                                   |

---

# 4. AI Search is not fully represented

## Existing task

**IPI-474 · SEARCH-001 — AI Search & Vector Architecture** compares Supabase pgvector, Vectorize, AI Search and Workers AI embeddings. That is a useful architecture task.

## What is missing

The proposed AI Search task improvements were not added as executable Linear tasks:

* dashboard-only pilot;
* synthetic brand-guideline dataset;
* tenant isolation;
* instance-per-tenant versus shared-instance decision;
* authenticated tenant derivation;
* upload validation;
* document deletion;
* retrieval citations;
* unsupported-query behavior;
* Beta risk acceptance.

Cloudflare now provides specific multitenancy guidance for AI Search, including per-tenant search designs. This needs to be part of the Linear acceptance criteria before any production brand documents are indexed. ([Cloudflare Docs][3])

## Recommended child tasks

| Proposed Linear task                                                     | Purpose                           |
| ------------------------------------------------------------------------ | ------------------------------------ |
| **IPI-XXX · CF-SEARCH-001 — Evaluate Cloudflare AI Search in Dashboard** | Zero-code retrieval proof         |
| **IPI-XXX · CF-SEARCH-002 — Design AI Search Tenant Isolation**          | Prevent cross-brand retrieval     |
| **IPI-XXX · CF-SEARCH-003 — Define Document Governance and Deletion**    | Upload, retention and offboarding |
| **IPI-XXX · CF-SEARCH-004 — Add AI Search Workers Binding**              | Runtime integration               |
| **IPI-XXX · CF-SEARCH-005 — Validate Retrieval Quality and Citations**   | Grounding and non-hallucination   |

---

# 5. Infisical integration is not properly added

## Existing coverage

* **IPI-6 · INFRA-003 — Secrets management for agent server** mentions Infisical.
* **IPI-472 · INFRA-001 — Cloudflare Worker Deployment Pipeline** distinguishes build and runtime secrets.
* **IPI-468 · SEC-001 — Cloudflare AI Security Architecture** discusses Cloudflare runtime secrets.

## Gap

There is no dedicated task that defines:

```text
Infisical
→ source of truth
→ CI/deployment identity
→ Cloudflare runtime secrets
→ Workers Builds build secrets
→ local development
```

This was one of the specific proposed improvements and remains missing.

## Required task

> **Superseded:** this issue now exists as `IPI-606 · CF-SEC-010` — see
> `notes/10-linear-list.md` line 9. Do not create a duplicate.

**IPI-XXX · CF-SEC-010 — Connect Infisical Secrets to Cloudflare Deployment**

Acceptance criteria should cover:

* Infisical machine identity/service token;
* dev/staging/prod separation;
* build-time versus runtime variables;
* least-privilege deployment identity;
* secret synchronization method;
* drift detection;
* rotation;
* rollback;
* no secret values in logs;
* no manual copying unless documented as temporary.

**IPI-605 · CF-SEC-011 — Audit AI Gateway Metadata and Log Privacy** correctly avoided the ID collision by reserving `CF-SEC-010`, but the intended `CF-SEC-010` issue still has not been created.

---

# 6. Existing Linear issues that remain stale or contradictory

| Linear task                                                   | Problem                                                                                        | Severity | Required correction                                     |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | -------: | ----------------------------------------------------------|
| **IPI-485 · MASTRA-CF-001 — Mastra Provider Gateway Cutover** | Still depends on canceled IPI-454/IPI-457 path and `AI_GATEWAY_URL` custom Worker              |       🔴 | Supersede with IPI-594/native binding path              |
| **IPI-455 · Migrate Brand Intelligence to Cloudflare**        | Assumes separate Worker and custom provider adapter                                            |       🟡 | Re-evaluate after IPI-594 architecture                  |
| **IPI-590 · CF-GW-002 — Configure Managed Features**          | Says all seven features require no code                                                        |       🔴 | Rewrite as umbrella                                     |
| **IPI-592 · CF-MIG-820 — Delete Custom Worker**               | Says legacy Worker is currently production AI path                                             |       🔴 | Update with containment/no-caller evidence               |
| **IPI-591 · CF-TEST-010 — Verify Multi-Turn Tool Calling**    | Says no Linear issue exists for migration, but IPI-594 now exists                              |       🟡 | Update dependency text                                   |
| **IPI-589 · Update Legacy Worker compatibility_date**         | Invests in a disabled Worker scheduled for deletion                                            |       🟡 | Cancel unless retained for a documented rollback period |
| **IPI-500 · Real-World AI Journey Test Suite**                | Routing truth still says direct Gemini/Groq and old gateway opt-in                             |       🔴 | Update for native `ipix-prod` path                       |
| **IPI-510 · AI Health Journey**                               | Still monitors `services/cloudflare-worker/**` as active target                                |       🟡 | Add native gateway/binding health instead                |
| **IPI-504 · Shoot Journey**                                   | Says gateway tools must not be used                                                             |       🟡 | Reassess after IPI-591 proves native tool calling        |
| **IPI-503 · Brand Brief Journey**                              | Still references old IPI-485 custom gateway path                                               |       🟡 | Point to IPI-594/native route                            |
| **IPI-501 · AI Onboarding Journey**                            | Hardcodes direct Gemini assumption                                                             |       🟡 | Keep temporary, add migration re-test                    |
| **IPI-463 · Provider Failover and Rollback**                  | Still describes custom circuit breaker and global env override                                 |       🟡 | Reduce scope after Dynamic Routing/IPI-604               |
| **IPI-460 · Cost Tracking and Observability**                 | Says custom gateway Worker writes cost to Supabase                                             |       🔴 | Rewrite around AI Gateway + product audit requirements  |
| **IPI-469 · Cloudflare Platform Architecture**                | Says skip Hyperdrive, while IPI-490 identifies raw Postgres as a likely Worker-runtime failure |       🔴 | Reopen Hyperdrive decision                               |

---

# 7. Mandatory managed-first section still missing

The user requirement was:

> dashboard, CLI, prebuilt modules, GitHub repositories, examples, tutorials and recipes before custom code.

This has **not** been incorporated consistently into Linear.

## Add this to every active Cloudflare task

```markdown
## Managed-first implementation review

| Option | Checked | Evidence / result |
|---|---|---|
| Existing implementation | [ ] | |
| Cloudflare Dashboard feature | [ ] | |
| Wrangler/C3/OpenNext CLI | [ ] | |
| Official binding/API | [ ] | |
| Official Cloudflare package/module | [ ] | |
| Official Cloudflare template | [ ] | |
| Official GitHub example | [ ] | |
| Official tutorial/recipe | [ ] | |
| Cloudflare REST API | [ ] | |
| Custom code required | [ ] | Explain the managed-feature gap |
```

## Add this completion gate

```markdown
Custom implementation may not begin until all applicable managed-first
options have been checked and the missing platform capability is documented.
```

Cloudflare currently exposes official documentation sections for REST APIs, Workers bindings, Vercel AI SDK integration, Agents integration, tutorials, MCP servers and architecture resources. The official `cloudflare/ai` repository includes provider packages and examples, while `cloudflare/templates` provides supported Worker templates. ([Cloudflare Docs][1])

---

# 8. Correct Linear task map

|      Sequence | Linear task                                                                  | Current state     | Required correction                    |
| ------------: | ---------------------------------------------------------------------------- | ------------------ | ------------------------------------------|
|             1 | **IPI-586 · CF-AI-003 — Wire One Workers AI Call Through ipix-prod Gateway** | Active gate       | Add official package/example checklist |
|             2 | **IPI-595 · CF-GW-010 — Configure AI Gateway Authentication**                | Added             | Keep                                     |
|             3 | **IPI-597 · CF-GW-012 — Define Prompt Logging and Retention Policy**         | Added             | Run before real private traffic         |
|             4 | **IPI-596 · CF-GW-011 — Configure AI Gateway DLP**                           | Added             | Flag mode first                          |
|             5 | **IPI-605 · CF-SEC-011 — Audit Metadata and Log Privacy**                    | Added             | Depends on real metadata call sites     |
|             6 | **IPI-604 · CF-OPS-010 — Test Gateway Bypass and Rollback**                  | Added             | Keep                                     |
|             7 | **IPI-600 · CF-GW-015 — Build Model Capability Matrix**                      | Added             | Make dependency of Dynamic Routing      |
|             8 | **IPI-603 · CF-TEST-011 — Failure-Injection Suite**                          | Added             | Keep in staging                          |
|             9 | **IPI-594 · CF-MIG-230 — Migrate Mastra Agents**                             | Partial           | Split into migration waves               |
|            10 | **IPI-591 · CF-TEST-010 — Verify Multi-Turn Tool Calling**                   | Added             | Fix stale dependency text                |
|            11 | New per-agent rollout tasks                                                  | Missing           | Create                                    |
|            12 | New zero-legacy-traffic audit                                                | Missing           | Create                                    |
|            13 | New production soak gate                                                     | Missing           | Create                                    |
|            14 | **IPI-592 · CF-MIG-820 — Delete Custom AI Gateway Worker**                   | Partial           | Rewrite and split into three PRs         |
|        Future | **IPI-474 · SEARCH-001 — AI Search & Vector Architecture**                   | Architecture only | Add AI Search pilot children             |
| Cross-cutting | **CF-SEC-010 — Connect Infisical Secrets to Cloudflare Deployment**          | Missing           | Create                                    |

---

# Final audit result

> **Superseded (partially):** the "No" rows for per-agent feature-flag rollback, Infisical
> integration, AI Search tenant isolation, and zero-legacy-traffic verification predate
> `IPI-606`–`IPI-611`. See `notes/09-notes-linear.md` (lines 20–27) and `notes/10-linear-list.md`
> (lines 8–10, 36–42) for current Linear coverage before creating new issues.

| Question                                              | Answer                    |
| ----------------------------------------------------- | -------------------------- |
| Have all suggested improvements been added to Linear? | 🔴 **No**                |
| Were the most important security tasks added?         | 🟢 **Yes**               |
| Were rollback and failure testing added?              | 🟢 **Mostly yes**        |
| Were efficient migration waves added?                 | 🔴 **No**                |
| Was per-agent feature-flag rollback added?            | 🔴 **No**                |
| Was Infisical integration added?                      | 🔴 **No dedicated task** |
| Was AI Search tenant isolation added?                 | 🔴 **No**                |
| Was the three-PR cleanup structure added?             | 🔴 **No**                |
| Was zero-legacy-traffic verification added?           | 🔴 **No explicit task**  |
| Was managed-first verification added to every task?   | 🔴 **No**                |
| Have stale custom-gateway issues been removed?        | 🔴 **No**                |
| Linear synchronization score                          | **63/100 🟡**            |

## Priority corrections

1. Create **CF-SEC-010 — Connect Infisical Secrets to Cloudflare Deployment**.
2. Split **IPI-594 · CF-MIG-230 — Migrate Mastra Agents to Cloudflare-Native AI Routing** into migration waves.
3. Add per-agent feature flags and canary rollout.
4. Add a zero-legacy-traffic and production-soak gate.
5. Rewrite **IPI-592 · CF-MIG-820 — Delete Custom AI Gateway Worker** into three cleanup PRs.
6. Add AI Search tenant-isolation pilot tasks under **IPI-474 · SEARCH-001 — AI Search & Vector Architecture**.
7. Add the mandatory managed-first review section to every active Cloudflare task.
8. Supersede or rewrite IPI-485, IPI-500, IPI-590, IPI-589, IPI-460 and stale journey descriptions.

[1]: https://developers.cloudflare.com/ai-gateway/observability/custom-metadata/ "Custom metadata · Cloudflare AI Gateway docs"
[2]: https://github.com/cloudflare/ai "GitHub - cloudflare/ai · GitHub"
[3]: https://developers.cloudflare.com/ai-search/how-to/multitenancy/ "Multitenancy · Cloudflare AI Search docs"
