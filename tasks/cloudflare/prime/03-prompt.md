````markdown
# iPix Cloudflare Migration — Complete Forensic Audit Prompt

## Objective

Perform a complete forensic audit of the iPix Cloudflare migration.

This is an **audit-only task**.

Do not:

- implement code;
- modify Linear;
- change issue statuses;
- create branches;
- create commits;
- open or update pull requests;
- deploy to Cloudflare;
- change Cloudflare, Supabase, Infisical or GitHub settings.

Produce a documented audit containing verified findings, corrections, blockers, recommendations, scores and an improved execution order.

Save the final report to:

```text
docs/audits/cloudflare-migration-audit.md
````

---

# Step 1 — Load project guidance

Read these skills before performing the audit:

```text
/home/sk/ipix/.claude/skills/cloudflare
/home/sk/ipix/.claude/skills/cloudflare-workflow
/home/sk/ipix/.claude/skills/ipix-supabase
/home/sk/ipix/.claude/skills/mastra
/home/sk/ipix/.claude/skills/task-verifier
```

Apply the relevant rules from each skill.

Use available MCP integrations where useful:

* Cloudflare MCP
* Mastra MCP
* GitHub MCP
* Linear MCP

Use MCP access for evidence gathering only. Do not perform write operations.

---

# Step 2 — Establish the current repository state

Inspect the current branch, working tree and relevant configuration.

Review at minimum:

```text
app/wrangler.jsonc
app/open-next.config.ts
app/package.json
app/.nvmrc
app/.dev.vars.example
.github/workflows/
app/src/mastra/
app/src/app/api/
app/scripts/
app/docs/
supabase/
tasks/cloudflare/
tasks/mastra/
```

Record:

* current branch and commit;
* uncommitted changes;
* installed versions of Next.js, OpenNext, Wrangler, Mastra and Supabase;
* Cloudflare Worker names;
* preview and production environments;
* compatibility date and flags;
* bindings;
* runtime variables;
* secrets contract;
* CI build and deployment commands;
* current preview and production deployment state.

Do not assume that documentation matches the code. Verify both.

---

# Step 3 — Research official sources first

Before evaluating any task, verify current best practices using official sources.

Use this priority order:

1. Cloudflare official documentation
2. OpenNext official documentation
3. Next.js official documentation
4. Wrangler official documentation
5. Cloudflare Workers documentation
6. Workers AI documentation
7. AI Gateway documentation
8. Hyperdrive documentation
9. Durable Objects documentation
10. R2 documentation
11. D1 documentation
12. Queues documentation
13. Cloudflare observability documentation
14. Mastra official documentation
15. Supabase official documentation
16. GitHub Actions official documentation
17. Infisical official documentation

Also inspect:

* official GitHub repositories;
* official examples;
* starter templates;
* official recipes;
* official tutorials;
* migration guides;
* release notes;
* changelogs;
* known compatibility issues.

For every important recommendation, provide the full official URL.

Do not rely primarily on blogs, third-party tutorials or AI summaries when official documentation exists.

---

# Step 4 — Enforce the implementation preference ladder

For every task, determine whether the planned implementation follows this order:

```text
Cloudflare or service dashboard
→ official CLI
→ existing repository scripts
→ official framework integration
→ official example or recipe
→ maintained prebuilt package
→ official SDK
→ custom code only as the final option
```

Flag any custom implementation that duplicates an official capability.

For each task, explicitly answer:

* Can the Cloudflare Dashboard solve this?
* Can Wrangler solve this?
* Can OpenNext solve this?
* Can Mastra solve this?
* Can Supabase solve this?
* Can GitHub Actions solve this?
* Can Infisical solve this?
* Is there an official repository, recipe or starter that should be used first?
* Is custom code genuinely required?

---

# Step 5 — Audit the complete hosting architecture

Audit the following areas together, not in isolation:

## Cloudflare and OpenNext

* Next.js compatibility
* OpenNext configuration
* Worker entry point
* `nodejs_compat`
* compatibility date
* static assets
* Images binding
* service bindings
* environment inheritance
* preview Worker
* production Worker
* Worker versions
* preview URLs
* deployment commands
* rollback
* bundle size
* startup time
* runtime limits
* caching and ISR
* custom domains
* DNS cutover

## Mastra

* Cloudflare runtime compatibility
* import-time initialization
* storage mode
* agent registration
* CopilotKit integration
* streaming
* persistent threads
* PostgresStore
* Hyperdrive
* bindings
* model provider routing
* unsupported Node.js dependencies
* Mastra Cloudflare deployer relevance

## Supabase

* canonical clients
* browser versus server clients
* service-role usage
* RLS
* tenant isolation
* database connection method
* Data API versus direct Postgres
* Hyperdrive suitability
* pooling
* migrations
* pgTAP coverage
* environment configuration

## Security and secrets

* Infisical environments
* GitHub OIDC
* Cloudflare API token permissions
* secret allowlists
* build-time versus runtime variables
* preview versus production isolation
* mandatory secrets
* missing-secret behavior
* secret deletion and rotation
* log redaction
* workflow-input injection
* temporary files
* rollback
* least privilege

## CI/CD and operations

* GitHub Actions
* pull-request validation
* OpenNext builds
* Wrangler type generation
* deployment ownership
* preview upload
* production deployment
* protected environments
* approvals
* concurrency controls
* artifacts
* smoke tests
* observability
* logs
* alerting
* rollback testing

---

# Step 6 — Audit every Linear task

Use the exact format:

```text
IPI-XXX · TASK-ID — Full Task Name
```

Do not abbreviate task names in the report.

## Phase 1 — Protected Cloudflare preview and production launch

1. **IPI-606 · CF-SEC-010 — Connect Infisical Secrets to Cloudflare Deployment**
2. **IPI-472 · INFRA-001 — OpenNext CI and Deployment Pipeline**
3. **IPI-632 · CF-MIG-220 — Protected Preview Runtime Smoke Validation**
4. **IPI-627 · CF-SEC-020 — Deployment Security Proof**
5. **IPI-510 · CF-UJ-011 — Journey Test: AI Health, Readiness and Continuous Validation**
6. **IPI-631 · CF-MIG-810 — Production DNS Cutover and Rollback**

## Phase 2 — Real-world Cloudflare journey validation

7. **IPI-500 · CF-UJ-000 — Real-World AI Journey Test Suite**
8. **IPI-501 · CF-UJ-001 — Journey Test: AI Onboarding**
9. **IPI-502 · CF-UJ-002 — Journey Test: AI Brand Intelligence**
10. **IPI-503 · CF-UJ-003 — Journey Test: AI Brand Brief Generation**
11. **IPI-504 · CF-UJ-004 — Journey Test: Shoot Planning Workflow**
12. **IPI-505 · CF-UJ-005 — Journey Test: Booking Workflow**
13. **IPI-506 · CF-UJ-006 — Journey Test: CRM Workflow**
14. **IPI-507 · CF-UJ-007 — Journey Test: Planner Workflow**
15. **IPI-509 · CF-UJ-009 — Journey Test: Embeddings and Asset Search**
16. **IPI-511 · CF-UJ-010 — Journey Test: Visual DNA Analysis**

## Phase 3 — Mastra, Supabase and Hyperdrive

17. **IPI-616 · CF-DB-001 — Mastra Storage and Schema ADR**
18. **IPI-619 · CF-DB-005 — Add Initial Supabase Hyperdrive Binding to OpenNext Worker**
19. **IPI-620 · CF-DB-006 — Hyperdrive Query Helper and PostgresStore Integration**
20. **IPI-621 · CF-DB-007 — Tenant Authorization and RLS Tests**
21. **IPI-622 · CF-DB-008 — Benchmark Hyperdrive Placement and Supabase Data API**
22. **IPI-623 · CF-DB-009 — Migrate One Mastra Workload to Hyperdrive**
23. **IPI-624 · CF-DB-010 — Configure Hyperdrive Monitoring and Connection Controls**
24. **IPI-626 · SUPA-CLEANUP — Canonical Supabase Clients and Environment Configuration**

## Phase 4 — Cloudflare-native AI platform

25. **IPI-586 · CF-AI-003 — Wire One Workers AI Call Through ipix-prod Gateway**
26. **IPI-458 · CF-AI-007 — NVIDIA NIM Evaluation**
27. **IPI-462 · CF-AI-006 — AI Provider Evaluation Suite**
28. **IPI-463 · CF-AI-008 — AI Provider Failover and Rollback**
29. **IPI-460 · CF-AI-010 — AI Cost Tracking and Observability**

## Phase 5 — Supabase Edge and Cloudflare AI migration

30. **IPI-694 · CF-EDGE-AI — Route Supabase Edge LLM Through Cloudflare AI Gateway**
31. **IPI-697 · CF-EDGE-003 — Add Cloudflare AI Gateway REST Client and Wire Brand Intelligence**
32. **IPI-455 · CF-EDGE-B — Phase B: Port Brand-Intelligence Handler to Cloudflare Worker**
33. **IPI-699 · CF-EDGE-005 — Edge Secrets, Cloudflare Canary and Rollback**
34. **IPI-698 · CF-EDGE-004 — DNA Vision Evaluation After Brand-Intelligence Canary**
35. **IPI-456 · CF-EDGE-A — Migrate Asset DNA Scoring to Cloudflare**

## Phase 6 — Production soak and legacy retirement

36. **IPI-609 · CF-MIG-230 — Soak, Zero-Legacy-Traffic Audit and Production Soak Gate**
37. **IPI-631 · CF-MIG-810 — Production DNS Cutover and Rollback**

Note that **IPI-631 · CF-MIG-810 — Production DNS Cutover and Rollback** appears in both the launch and final production phases. Determine whether this is intentional or indicates sequencing/documentation duplication.

---

# Step 7 — Required evaluation for every task

For every listed Linear task, evaluate:

## Purpose and value

* What problem does the task solve?
* Is the problem real in the current repository?
* Is the task still required?
* Is it a launch blocker, post-launch improvement, optional experiment or obsolete work?

## Dependencies

* Are the listed dependencies correct?
* Are any dependencies missing?
* Are any dependencies unnecessary?
* Is the task scheduled too early or too late?
* Can it run in parallel with another task?

## Official compliance

* Does the planned implementation match current official documentation?
* Does it use supported commands and APIs?
* Does it depend on deprecated features?
* Is there a better official feature, package, dashboard workflow, recipe or example?

## Architecture fit

* Does it fit the current Next.js and OpenNext architecture?
* Does it fit Cloudflare Workers runtime constraints?
* Does it fit the current Mastra integration?
* Does it fit the Supabase and RLS design?
* Does it introduce duplicate clients, gateways, storage layers or deployment paths?

## Security

* Are secrets appropriately scoped?
* Is tenant isolation preserved?
* Are production and preview separated?
* Are logs safe?
* Is least privilege enforced?
* Can a manual operator error cause production damage?
* Is rollback safe?

## Scalability and operations

* Will it work under realistic traffic?
* Does it include observability?
* Are failure modes defined?
* Are retries, timeouts and limits defined?
* Is operational ownership clear?
* Is there a tested rollback path?

## Readiness

Answer explicitly:

* Will this task succeed as currently written?
* Is it ready to implement?
* Is it ready to merge?
* Is it ready for production?
* What exact correction is required before proceeding?

---

# Step 8 — Classify findings

Use these status markers consistently:

* 🟢 Correct, verified or production-aligned
* 🟡 Risk, ambiguity or non-blocking correction
* ⚪ Missing evidence, missing requirement or future work
* 🔴 Error, blocker, security issue or likely failure

Do not mark something green without evidence.

Separate:

* verified fact;
* code observation;
* Linear-task observation;
* official-document requirement;
* inference;
* recommendation.

---

# Step 9 — Produce the per-task audit table

Create one row for every task.

Use this format:

| Task | Phase | Purpose | Current approach | Official approach | Errors | Risks | Missing work | More efficient approach | Dependency correction | Ready to start | Will succeed | Score |
| ---- | ----- | ------- | ---------------- | ----------------- | ------ | ----- | ------------ | ----------------------- | --------------------- | -------------: | -----------: | ----: |

Requirements:

* Use the full task name in every row.
* Do not use only the IPI number.
* State the most important correction directly.
* Include a score out of 100.
* Include a clear yes/no/conditional success verdict.

---

# Step 10 — Produce a correction table

Create a second table with actionable corrections:

| Task | Severity | Current problem | Required correction | Official feature or source | Blocking? |
| ---- | -------- | --------------- | ------------------- | -------------------------- | --------- |

List every correction separately.

Do not combine unrelated corrections into one vague row.

---

# Step 11 — Identify critical blockers

List all issues that prevent:

1. first remote Cloudflare preview;
2. protected-preview validation;
3. production DNS cutover;
4. safe rollback;
5. persistent Mastra storage;
6. Cloudflare-native AI routing;
7. legacy infrastructure retirement.

For each blocker include:

* affected task;
* evidence;
* impact;
* exact fix;
* owner or system involved;
* whether it blocks preview, production or only post-launch maturity.

---

# Step 12 — Identify missing tasks

Determine whether dedicated Linear tasks are missing for:

* first end-to-end preview deployment;
* Cloudflare account and token permission validation;
* GitHub protected environment setup;
* deployment concurrency;
* deployment provenance;
* preview URL protection;
* OAuth callback allowlisting;
* Worker logs and observability;
* alerting;
* error-budget definition;
* rollback rehearsal;
* DNS TTL reduction;
* production traffic ramp;
* OpenNext upgrade management;
* runtime compatibility regression tests;
* secret deletion and rotation;
* Hyperdrive regional placement;
* database connection exhaustion;
* Mastra thread persistence migration;
* data backup and recovery;
* post-cutover Vercel retirement;
* cost monitoring.

For every proposed task, use:

```text
IPI-TBD · TASK-ID — Full Proposed Task Name
```

Include:

* purpose;
* dependencies;
* acceptance criteria;
* recommended milestone;
* whether it is mandatory or optional.

---

# Step 13 — Identify tasks to merge, split, defer or cancel

Create this table:

| Task | Recommendation | Reason | Replacement or destination |
| ---- | -------------- | ------ | -------------------------- |

Allowed recommendations:

* Keep
* Correct
* Split
* Merge
* Defer
* Cancel
* Convert to experiment
* Convert to operational checklist

Specifically identify:

* duplicate tasks;
* tasks that repeat official Cloudflare functionality;
* tasks no longer aligned with the repository;
* platform-maturity work incorrectly blocking first launch;
* experiments incorrectly placed on the production critical path.

---

# Step 14 — Generate the optimal execution order

Produce separate dependency paths.

## A. Minimum path to first protected preview

Show the shortest safe path.

## B. Minimum path to first production cutover

Show only true launch blockers.

## C. Mastra persistence path

Show the correct ADR, schema, RLS, Hyperdrive and canary order.

## D. Cloudflare-native AI path

Show provider, gateway, evaluation, failover and observability order.

## E. Legacy retirement path

Show soak, zero-traffic proof, rollback window and deletion order.

Use full task names in every graph.

Example format:

```text
IPI-606 · CF-SEC-010 — Connect Infisical Secrets to Cloudflare Deployment
↓
IPI-472 · INFRA-001 — OpenNext CI and Deployment Pipeline
↓
IPI-632 · CF-MIG-220 — Protected Preview Runtime Smoke Validation
```

Also identify which tasks can run in parallel.

---

# Step 15 — Evaluate efficiency

For every task provide:

* current complexity;
* simpler official alternative;
* estimated implementation reduction;
* maintenance reduction;
* operational risk reduction.

Use this table:

| Task | Current method | More efficient method | Dashboard/CLI/package/example | Estimated benefit |
| ---- | -------------- | --------------------- | ----------------------------- | ----------------- |

Explicitly verify whether the task should use:

* Cloudflare Dashboard;
* Wrangler;
* OpenNext;
* Cloudflare GitHub Actions;
* Workers Builds;
* Workers preview URLs;
* gradual deployments;
* service bindings;
* Hyperdrive;
* AI Gateway;
* Workers AI bindings;
* Durable Objects;
* Queues;
* R2;
* D1;
* official Mastra Cloudflare deployer;
* Supabase Data API;
* Supabase CLI;
* pgTAP;
* GitHub environments;
* Infisical OIDC.

---

# Step 16 — Final grading

Use this grading system:

* 🟢 Excellent: 95–100
* 🟡 Good: 80–94
* ⚪ Needs work: 60–79
* 🔴 Critical: below 60

Score each category:

| Category                 | Score | Status | Explanation |
| ------------------------ | ----: | ------ | ----------- |
| Architecture             |  /100 |        |             |
| Security                 |  /100 |        |             |
| Cloudflare configuration |  /100 |        |             |
| OpenNext compatibility   |  /100 |        |             |
| Deployment               |  /100 |        |             |
| CI/CD                    |  /100 |        |             |
| Mastra                   |  /100 |        |             |
| Supabase                 |  /100 |        |             |
| Hyperdrive               |  /100 |        |             |
| AI routing               |  /100 |        |             |
| Testing                  |  /100 |        |             |
| Observability            |  /100 |        |             |
| Rollback                 |  /100 |        |             |
| Documentation            |  /100 |        |             |

Calculate:

* overall migration score;
* first-preview readiness percentage;
* production-cutover readiness percentage;
* post-launch platform-maturity percentage.

---

# Step 17 — Required executive conclusion

End the report with concise answers:

1. Can iPix be deployed to a protected Cloudflare preview now?
2. What exactly blocks the first preview?
3. Can iPix safely replace Vercel now?
4. What exactly blocks production DNS cutover?
5. Which tasks are true launch blockers?
6. Which tasks should move post-launch?
7. Which tasks should be canceled or merged?
8. What is the fastest safe execution order?
9. What is the estimated probability that the migration succeeds as currently planned?
10. What is the probability of success after applying the recommended corrections?

Provide one final verdict:

* 🟢 Ready
* 🟡 Conditionally ready
* ⚪ Not ready
* 🔴 Critical redesign required

---

# Evidence requirements

Every major finding must include at least one of:

* repository file and line reference;
* Linear issue reference;
* GitHub PR or review reference;
* Cloudflare dashboard/MCP evidence;
* official documentation URL;
* official GitHub repository URL;
* command output;
* test evidence.

Do not claim something was tested when it was only reviewed statically.

Do not mark a task complete based only on its description.

Do not treat a local OpenNext build as proof that a remote Worker functions correctly.

Do not treat an HTTP 200 HTML response as proof that SSE streaming works.

Do not expose secret values in the report.

---

# Output file

Write the complete audit to:

```text
docs/audits/cloudflare-migration-audit.md
```

After writing it, print only:

1. report path;
2. overall score;
3. preview-readiness score;
4. production-readiness score;
5. number of critical blockers;
6. recommended next three tasks using their full names.

```
```
