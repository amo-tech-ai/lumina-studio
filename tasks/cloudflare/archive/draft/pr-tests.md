GitHub currently shows all three PRs open and mergeable. PR #339 is at commit `da38f401`, but **several newer review threads remain unresolved**, including test-environment configuration and overly broad error classification. The statement “both Sentry threads resolved” is therefore no longer sufficient as a merge gate. PR #340 still contains six changed files and references the deprecated model.   

Run a complete pre-merge verification for:

* PR #336: [https://github.com/amo-tech-ai/lumina-studio/pull/336](https://github.com/amo-tech-ai/lumina-studio/pull/336)
* PR #339: [https://github.com/amo-tech-ai/lumina-studio/pull/339](https://github.com/amo-tech-ai/lumina-studio/pull/339)
* PR #340: [https://github.com/amo-tech-ai/lumina-studio/pull/340](https://github.com/amo-tech-ai/lumina-studio/pull/340)

Use the GitHub, Cloudflare workflow, security, testing, and PR-review skills. Use GitHub MCP and Cloudflare MCP/docs where available.

Do not trust previous reports. Verify the current HEAD of each PR.

## Step 1 — Establish current state

For each PR, verify:

* Current head SHA
* Base branch
* Changed files
* Commits
* Merge conflicts
* CI/check status
* Unresolved Sentry, CodeRabbit, Codex, and reviewer threads
* Whether previous findings are resolved in code, merely documented, or still open

Important: PR #339 may have newer unresolved threads beyond the original two. Inspect all current threads.

## Step 2 — Scope and dependency check

Verify:

* PR #336 is documentation-only and factually matches current code
* PR #339 contains only bearer-token authentication and directly required error handling
* PR #340 does not improperly combine model registry, Gemini provider, shared types, tests, and lockfile churn
* Merge order and dependencies between #336, #339, and #340
* No overlapping commits or duplicated changes

## Step 3 — PR #339 security verification

Run and prove:

* Missing production token fails closed
* Valid bearer token succeeds
* Invalid token returns 401
* Empty token returns 401
* Leading/trailing whitespace behavior is intentional and tested
* Auth runs before body parsing
* GET `/` and `/health` remain public
* Every protected POST route requires auth
* Secrets are never logged
* Constant-time comparison is considered
* Dev bypass cannot accidentally activate in production

Fix or block merge if:

* Test environment lacks explicit auth configuration
* Tests pass only because `.dev.vars` silently disables auth
* CI does not execute Cloudflare Worker tests
* Error classification uses broad string checks such as `includes("Invalid")` or `includes("missing")`

Prefer typed provider errors over message substring matching.

## Step 4 — PR #340 Cloudflare model verification

Verify against current official Cloudflare docs:

* No deprecated model remains
* Exact model ID is active
* Function calling is explicitly supported
* Context window is correct
* Pricing claims are documented
* Streaming supports tool-call argument assembly
* OpenAI-compatible request/response mapping is correct

Evaluate:

* `@cf/meta/llama-3.1-8b-instruct-fast`
* `@cf/meta/llama-3.3-70b-instruct-fp8-fast`
* `@cf/zai-org/glm-4.7-flash`
* `@cf/zai-org/glm-5.2`

Recommended direction:

* Immediate compatibility replacement: `@cf/meta/llama-3.1-8b-instruct-fast`
* Fast production candidate: `@cf/zai-org/glm-4.7-flash`
* Premium reasoning/coding: `@cf/zai-org/glm-5.2`

Do not select the final default without live evaluation.

## Step 5 — Automated tests

Run from a clean checkout for each PR:

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run build
```

Run Cloudflare Worker tests explicitly:

```bash
cd services/cloudflare-worker
npm ci
npm test
npm run typecheck
npm run build
```

Confirm tests run with an explicit test environment, not accidental local `.dev.vars` behavior.

Required focused tests:

* Bearer auth matrix
* Auth-before-body parsing
* 400 versus 502 provider-error classification
* Unsupported model
* `tools: []`
* `tool_choice: "none"`
* Tool-call request serialization
* Tool-call response parsing
* Streaming tool-call argument assembly
* Retryable versus non-retryable fallback
* Deprecated-model deny-list

## Step 6 — Live multi-turn test

Run a real Workers AI request through the gateway:

```text
User request
→ model selects tool
→ tool arguments parse successfully
→ arguments validate against schema
→ execute tool
→ append tool result
→ second model call
→ final answer
```

Do not accept a mocked unit test as live proof.

Record:

* Model ID
* HTTP status
* Tool name
* Parsed arguments
* Final response
* P50/P95 latency
* Input/output tokens
* Estimated cost
* Any fallback used

Never print secrets.

## Step 7 — CI and rollback gates

Verify before merge:

* Cloudflare Worker tests run in GitHub Actions
* Deprecated model IDs fail CI
* Registry has an environment override for rollback
* Previous working model can be restored without code changes
* Telemetry records model, latency, tokens, tool failures, retries, and fallback reason
* Production bypass flags are prohibited

## Step 8 — Final merge decision

Output one table:

| PR | Scope | Tests | CI | Threads | Security | Cloudflare verification | Blockers | Readiness | Decision |

Then provide:

1. Exact unresolved findings
2. Required code changes
3. Required thread replies
4. Correct merge order
5. Commands executed and results
6. Overall readiness percentage
7. Final decision for each PR: MERGE, HOLD, SPLIT, or REJECT

Do not mark a thread resolved because it is documented. Resolve it only when the code, tests, and CI prove the issue is addressed.
