# Kilo Code Review Rules — iPix / Lumina Studio

## Review Goal

Find issues that could cause:
- production failures
- security or tenant-isolation problems
- data corruption or leaks
- authentication/authorization bypasses
- regressions
- Cloudflare deployment failures
- broken user journeys
- missing or inadequate tests

Prioritize real risks over style preferences.

---

## 1. Security — Highest Priority

Check carefully for:

- Supabase RLS bypasses or weakened policies
- cross-organization / cross-brand data access
- missing `org_id`, `brand_id`, or ownership scoping
- exposed secrets, API keys, tokens, or credentials
- unsafe service-role usage
- authentication or authorization bypasses
- SQL injection, XSS, unsafe redirects, or unvalidated input
- sensitive data written to logs

**Flag any code where one tenant could read or modify another tenant's data.**

---

## 2. Supabase & Database

Check for:

- migrations that can break existing production data
- missing RLS on new tables
- policies that are broader than necessary
- client-side access to privileged operations
- incorrect foreign keys or ownership relationships
- race conditions or non-atomic state transitions
- test/demo data leaking into production
- queries that accidentally return data across organizations

Do not approve destructive migrations without a safe migration or rollback strategy.

---

## 3. Authentication & Multi-Tenancy

Verify:

- authenticated user identity is validated server-side
- organization and brand access is checked before reads/writes
- privileged operations cannot rely only on UI restrictions
- admin/operator permissions are enforced at the backend
- session/resume flows cannot enter another user's organization or brand

**Tenant isolation failures are BLOCKING findings.**

---

## 4. Cloudflare / Runtime Compatibility

Check changes for Cloudflare Workers compatibility.

Flag:

- Node.js APIs unsupported in the Worker runtime
- filesystem assumptions
- incompatible packages
- incorrect environment-variable handling
- bundle-size regressions
- incorrect Wrangler/OpenNext configuration
- code that works locally but is likely to fail on Workers
- production/QA environment mixing

**Deployment-breaking issues are BLOCKING.**

---

## 5. AI / Mastra / CopilotKit

Check that:

- AI output is treated as untrusted input
- durable writes use approved application paths
- human approval gates are preserved where required
- agents cannot silently perform sensitive mutations
- tools enforce authorization independently of the model
- organization/brand context is correctly scoped
- model failures have safe error handling
- retries cannot duplicate writes

AI must assist decision-making, not bypass application security or approval rules.

---

## 6. Bugs & Regressions

Look for:

- broken existing workflows
- incorrect state transitions
- stale state or race conditions
- null/undefined edge cases
- loading/error states that can deadlock the UI
- incorrect redirects or route handling
- async operations that are not awaited
- duplicated writes
- swallowed errors

Review changed code in the context of the complete user journey, not only individual functions.

---

## 7. Tests

Require meaningful tests when behavior changes.

Pay particular attention to:

- authorization and tenant isolation
- RLS behavior
- state transitions
- regression fixes
- API/tool boundaries
- critical user journeys
- Cloudflare-specific behavior

A bug fix should normally include a regression test proving the bug cannot return.

Do not request tests for trivial formatting or static-copy changes.

---

## 8. Performance

Flag significant:

- N+1 database queries
- repeated expensive queries
- unnecessary large client bundles
- expensive work inside React render paths
- unbounded loops or queries
- excessive API/model calls
- duplicated network requests

Only report performance issues that are likely to have real impact.

---

## 9. Review Severity

### BLOCKING
Likely security issue, data leak, auth bypass, production failure, tenant-isolation failure, data corruption, or critical regression.

### HIGH
Likely functional bug or important reliability problem that should be fixed before merge.

### MEDIUM
Real issue with limited impact or an important edge case.

### LOW
Minor improvement. Do not block the PR.

Avoid reporting subjective formatting or naming preferences unless they create a real maintainability or correctness problem.

---

## 10. Review Output

For every important finding explain:

1. What is wrong
2. Why it matters
3. A realistic failure scenario
4. The smallest safe fix
5. Whether the issue should block merge

Prefer a small number of high-confidence findings over many speculative comments.

If no meaningful problems are found, say the PR appears safe to merge rather than inventing issues.