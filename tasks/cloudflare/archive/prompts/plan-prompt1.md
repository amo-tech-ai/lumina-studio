Web search every relevant official Cloudflare document, GitHub repository, starter template, CLI tool, dashboard workflow, and production example to improve the current Cloudflare Workers AI plan.

Research:

* Cloudflare Workers
* Workers AI
* AI Gateway
* Next.js + OpenNext
* Models
* Functions
* Tool calling
* Agents
* Wrangler
* C3
* Dashboard setup
* Testing
* CI/CD
* Monitoring
* Rollback

Start with a table of contents and progress tracker:

|  # | Topic | Docs | GitHub | Template | Dashboard | CLI | Status |
| -: | ----- | ---- | ------ | -------- | --------- | --- | ------ |

For each topic:

1. Explain it simply.
2. Link official docs and GitHub repos.
3. Identify available setup methods:

   * Dashboard
   * Simple CLI
   * Prebuilt module
   * Official starter/template
   * GitHub example
4. Compare difficulty, error risk, maintenance, and production readiness.
5. Choose the simplest proven option.
6. Give exact commands and dashboard steps.
7. List validation tests and rollback steps.
8. Explain what custom code can be removed.

Create a separate Markdown plan document for each major task.

Use task names in this format:

`IPI-XXX · TASK-ID — Full Task Name`

Each task document must include:

* Purpose
* Recommended setup method
* Official links
* Commands
* Dashboard steps
* Files changed
* Dependencies
* Tests
* Acceptance criteria
* Rollback
* Evidence required

Always prefer, in this order:

1. Official dashboard setup
2. Simple CLI command
3. Official prebuilt module
4. Official starter template
5. Official GitHub example
6. Custom implementation only when no simpler supported option exists

Finish with:

* Best overall architecture
* Best setup option for each component
* Components to remove or simplify
* Exact implementation order
* Total task count
* Simplicity score
* Error-risk score
* Production-readiness score
