# Systematic Testing & Validation Plan

**StartupAI Engineering Playbook**
**Version:** 1.0 | **Date:** January 15, 2026

---

## 1. Testing Philosophy

### Why Layered Testing?

Each layer catches different failure modes. If you skip a layer, that failure mode reaches production.

| Layer | What It Catches | Cost to Fix |
|-------|-----------------|-------------|
| Pre-commit | Syntax, lint, type errors | Minutes |
| Unit tests | Logic bugs in isolation | Hours |
| Integration | Contract mismatches | Days |
| E2E | User flow breaks | Days-Weeks |
| Production | Customer-facing bugs | Weeks + reputation |

**Rule:** Fix bugs at the earliest possible layer. Every layer you skip multiplies fix cost by 10x.

### Core Principles

1. **Fail fast**: Catch errors before they propagate
2. **Fail loud**: No silent failures - every error must surface
3. **Fail safe**: Broken state = block, never proceed
4. **Test boundaries**: Most bugs live at integration points

### What Each Layer Protects

| Layer | Protects Against |
|-------|------------------|
| Type checking | Wrong data shapes, null errors |
| Unit tests | Logic errors in pure functions |
| Component tests | UI rendering bugs, state issues |
| API contract tests | Frontend/backend mismatches |
| RLS tests | Data leaks between orgs |
| Edge function tests | Auth bypass, schema violations |
| AI validation | Hallucinated/malformed outputs |
| E2E tests | Broken user journeys |
| Monitoring | Regressions, performance degradation |

---

## 2. Systematic Test Gates

### Gate 0: Pre-Commit / PR Checks

**Purpose:** Prevent obviously broken code from entering the codebase.

**What Is Tested:**
- TypeScript compilation (no type errors)
- ESLint rules pass
- Prettier formatting
- No console.log in production code
- No hardcoded secrets
- Import paths resolve

**When It Runs:**
- Pre-commit hook (local)
- GitHub Actions on PR open/update

**Blocks Release If:**
- Any check fails
- PR cannot merge until green

**Implementation:**
```yaml
# .github/workflows/pr-checks.yml
- npm run typecheck
- npm run lint
- npm run format:check
- npx secretlint
```

---

### Gate 1: UI & Component Correctness

**Purpose:** Verify UI components render correctly and handle state properly.

**What Is Tested:**
- Component renders without crashing
- Props are handled correctly
- User interactions trigger expected behavior
- Loading/error/empty states display
- Accessibility basics (aria labels, keyboard nav)

**When It Runs:**
- On every PR
- Nightly full suite

**Blocks Release If:**
- Any component test fails
- Coverage drops below threshold (70% for new code)

**Test Categories:**

| Category | Example |
|----------|---------|
| Smoke | Component mounts without error |
| Interaction | Button click triggers handler |
| State | Loading spinner shows during fetch |
| Edge cases | Empty list shows placeholder |
| A11y | Form inputs have labels |

**Tools:**
- Vitest + React Testing Library
- @testing-library/user-event for interactions

---

### Gate 2: Service ↔ API Contract Validation

**Purpose:** Ensure frontend and backend agree on data shapes.

**What Is Tested:**
- API responses match TypeScript types
- Request payloads match expected schema
- Error responses have consistent structure
- Pagination/filtering params work correctly

**When It Runs:**
- On PR affecting API calls or types
- Before any deployment

**Blocks Release If:**
- Type mismatch between frontend expectation and API response
- Missing required fields in response
- Breaking change to existing contract

**Contract Rules:**

```
Frontend expects: { id: string, name: string, created_at: string }
Backend returns:  { id: string, name: string, created_at: string }
                  ✅ PASS

Frontend expects: { id: string, name: string }
Backend returns:  { id: number, name: string }
                  ❌ FAIL - id type mismatch
```

**Validation Method:**
1. Generate types from Supabase schema (`supabase gen types`)
2. Use generated types in frontend queries
3. Runtime validation with Zod on critical paths

---

### Gate 3: Database & RLS Isolation

**Purpose:** Prove data isolation between organizations is absolute.

**What Is Tested:**
- User from Org A cannot SELECT Org B data
- User from Org A cannot INSERT into Org B
- User from Org A cannot UPDATE Org B records
- User from Org A cannot DELETE Org B records
- New user with no org sees empty data, not errors
- Service role bypasses RLS (for admin functions only)

**When It Runs:**
- On any migration change
- On any RLS policy change
- Weekly scheduled test

**Blocks Release If:**
- Any cross-org data access succeeds
- Any unauthenticated access succeeds
- New user hits 500 error

**Test Matrix:**

| Actor | Target | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|--------|
| User A | Org A data | ✅ | ✅ | ✅ | ✅ |
| User A | Org B data | ❌ | ❌ | ❌ | ❌ |
| User B | Org A data | ❌ | ❌ | ❌ | ❌ |
| Anon | Any data | ❌ | ❌ | ❌ | ❌ |
| Service | Any data | ✅ | ✅ | ✅ | ✅ |

**Test Implementation:**

```sql
-- Test: User A cannot read Org B startups
SET LOCAL role TO 'authenticated';
SET LOCAL request.jwt.claims TO '{"sub": "user-a-id", "org_id": "org-a-id"}';

SELECT * FROM startups WHERE org_id = 'org-b-id';
-- Expected: 0 rows (not error, just empty)
```

---

### Gate 4: Edge Functions Security & Schemas

**Purpose:** Verify Edge Functions reject bad input and unauthorized requests.

**What Is Tested:**
- Unauthenticated requests return 401
- Malformed requests return 400 with clear error
- Valid requests return expected schema
- Rate limiting works
- CORS headers correct
- No secrets leaked in responses

**When It Runs:**
- On any Edge Function change
- Before Edge Function deployment

**Blocks Release If:**
- Unauthenticated request succeeds
- Invalid input accepted
- Response schema mismatch
- Secret appears in response

**Test Cases:**

| Test | Input | Expected |
|------|-------|----------|
| No auth header | `{}` | 401 Unauthorized |
| Invalid auth | `Bearer invalid` | 401 Unauthorized |
| Missing required field | `{ action: null }` | 400 Bad Request |
| Invalid action | `{ action: "hack" }` | 400 Invalid action |
| Valid request | `{ action: "analyze" }` | 200 + valid schema |

**Security Checklist:**

- [ ] Auth token validated
- [ ] Input schema validated
- [ ] Output schema enforced
- [ ] No SQL injection possible
- [ ] No secret exposure
- [ ] Rate limit enforced
- [ ] CORS configured

---

### Gate 5: AI Output Schema Validation

**Purpose:** Ensure AI responses are valid, parseable, and safe before reaching UI.

**What Is Tested:**
- AI response is valid JSON
- Response matches expected schema
- Required fields present
- Field types correct
- No hallucinated fields
- Grounding sources present (when required)

**When It Runs:**
- Every AI call (runtime validation)
- Integration tests for AI endpoints

**Blocks Release If:**
- Schema validation fails
- Missing required fields
- Type mismatch

**Validation Flow:**

```
AI Response → Parse JSON → Validate Schema → Transform → Return to UI
                ↓              ↓
             FAIL           FAIL
                ↓              ↓
          Log error      Log error
                ↓              ↓
       Return fallback  Return fallback
```

**Schema Example:**

```typescript
// Expected AI output schema
const RiskAnalysisSchema = z.object({
  risks: z.array(z.object({
    category: z.enum(["market", "execution", "financial", "regulatory"]),
    score: z.number().min(1).max(10),
    evidence: z.string().min(10),
    mitigation: z.string().optional()
  })),
  overall_score: z.number().min(1).max(10),
  confidence: z.number().min(0).max(1)
});

// Validation
const result = RiskAnalysisSchema.safeParse(aiResponse);
if (!result.success) {
  logError("AI schema validation failed", result.error);
  return FALLBACK_RESPONSE;
}
```

**Fallback Rules:**

| Failure Mode | Fallback Action |
|--------------|-----------------|
| Invalid JSON | Return cached/default |
| Missing fields | Use defaults for optional, error for required |
| Wrong types | Attempt coercion, fail if impossible |
| Empty response | Return "Unable to analyze" message |

---

### Gate 6: End-to-End User Flows

**Purpose:** Verify complete user journeys work from login to outcome.

**What Is Tested:**
- User can sign up and see empty dashboard
- User can complete wizard flow
- User can create/read/update/delete core entities
- AI panel shows responses
- Navigation works correctly
- Error states handled gracefully

**When It Runs:**
- Nightly on staging
- Before production release
- After major feature merges

**Blocks Release If:**
- Any critical flow fails
- User cannot complete core journey
- Data not persisted correctly

**Critical Flows:**

| Flow | Steps | Success Criteria |
|------|-------|------------------|
| Signup | Register → Verify → Dashboard | See empty dashboard, no errors |
| Wizard | Enter URL → Extract → Review → Save | Startup created with extracted data |
| Task CRUD | Create → View → Edit → Delete | Task persists and removes correctly |
| AI Analysis | Select startup → Request analysis → View results | Valid analysis displayed |
| CRM | Add contact → Link to deal → Update stage | Relationships maintained |

**Test Data Strategy:**

- Use seeded test accounts (test+1@example.com, test+2@example.com)
- Each test run starts with clean state
- Never use production data
- Never share test accounts between parallel runs

---

### Gate 7: Production Monitoring

**Purpose:** Catch regressions and issues that slip through previous gates.

**What Is Monitored:**
- Error rates (JS errors, API 5xx)
- Response times (p50, p95, p99)
- AI call success rate
- RLS violation attempts
- Auth failures
- User funnel drop-offs

**When It Runs:**
- Continuously in production

**Alerts Trigger If:**
- Error rate > 1% over 5 minutes
- p95 latency > 2s
- AI success rate < 95%
- Any RLS violation detected
- Auth failure spike > 10x baseline

**Dashboard Metrics:**

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Error rate | < 0.1% | > 1% |
| API p95 | < 500ms | > 2000ms |
| AI success | > 99% | < 95% |
| Auth failures | < 0.1% | > 1% |
| Page load | < 2s | > 5s |

**Incident Response:**

```
Alert fires → On-call notified → Investigate → Mitigate → RCA
     ↓
  < 5 min      < 15 min        < 1 hour     < 24 hours
```

---

## 3. AI-Specific Validation

### Core Rules

1. **All AI calls are server-side** - Never call AI from browser
2. **All AI responses are schema-validated** - Before any processing
3. **All failures have fallbacks** - Never show broken UI
4. **All sources are logged** - For traceability

### Validation Pipeline

```
Request → Edge Function → AI Provider → Response
                              ↓
                      Parse JSON
                              ↓
                      Validate Schema
                              ↓
                      Check Grounding
                              ↓
                      Transform Output
                              ↓
                      Return to Client
```

### Schema Validation Rules

| Rule | Implementation |
|------|----------------|
| Valid JSON | `try { JSON.parse() } catch { return fallback }` |
| Required fields | Zod schema with `.required()` |
| Type checking | Zod type validation |
| Enum values | Zod `.enum()` for categorical fields |
| Range limits | Zod `.min()` / `.max()` |

### Grounding Validation

When AI uses search or URL context:

```typescript
// Require grounding sources for factual claims
const GroundedResponseSchema = z.object({
  answer: z.string(),
  sources: z.array(z.object({
    url: z.string().url(),
    title: z.string(),
    snippet: z.string()
  })).min(1) // At least one source required
});
```

### Error Handling Matrix

| AI Failure | User Sees | Logged |
|------------|-----------|--------|
| Timeout | "Analysis taking longer than expected" | Yes |
| Invalid JSON | "Unable to process response" | Yes + raw response |
| Schema mismatch | Partial data + warning | Yes + diff |
| Empty response | "No analysis available" | Yes |
| Rate limited | "Please try again shortly" | Yes |

### AI Testing Checklist

- [ ] Valid input produces valid output
- [ ] Invalid input returns error (not crash)
- [ ] Empty input handled gracefully
- [ ] Large input handled (truncation if needed)
- [ ] Malicious input sanitized
- [ ] Response time within SLA
- [ ] Schema validation passes
- [ ] Grounding sources present (when required)
- [ ] Cost logged per request

---

## 4. Security & RLS Verification

### Proving Org Isolation

**Method:** Adversarial testing with two test organizations.

**Setup:**
- Org A: `org-test-alpha` with User A
- Org B: `org-test-beta` with User B
- Each org has seeded data (startups, tasks, contacts)

**Test Suite:**

```
For each table with RLS:
  1. Authenticate as User A
  2. Attempt to SELECT Org B records
  3. Verify: 0 rows returned (not error)

  4. Attempt to INSERT with Org B org_id
  5. Verify: RLS violation error

  6. Attempt to UPDATE Org B record
  7. Verify: 0 rows affected

  8. Attempt to DELETE Org B record
  9. Verify: 0 rows affected
```

**Critical Tables to Test:**

| Table | Has org_id | RLS Required |
|-------|------------|--------------|
| organizations | N/A | Yes (via id) |
| profiles | Yes | Yes |
| startups | Yes | Yes |
| projects | Yes | Yes |
| tasks | Yes | Yes |
| contacts | Yes | Yes |
| deals | Yes | Yes |
| ai_runs | Yes | Yes |
| proposed_actions | Yes | Yes |

### New User Verification

**Scenario:** User signs up, creates profile, no org yet.

**Expected Behavior:**
- Dashboard loads (no 500 error)
- All data lists show empty (not error)
- "Create Organization" prompt displayed
- No RLS errors in logs

**Test:**
```
1. Create new auth user
2. Navigate to /app/dashboard
3. Verify: Page loads, shows empty state
4. Verify: No errors in browser console
5. Verify: No 500s in server logs
```

### Edge Function Auth Verification

**Test Matrix:**

| Request | Auth Header | Expected |
|---------|-------------|----------|
| Valid | Valid JWT | 200 OK |
| Missing | None | 401 Unauthorized |
| Expired | Expired JWT | 401 Unauthorized |
| Invalid | Malformed | 401 Unauthorized |
| Wrong user | Valid JWT, wrong org | 403 Forbidden |

**Implementation:**
```typescript
// Edge function auth check
const authHeader = req.headers.get("Authorization");
if (!authHeader?.startsWith("Bearer ")) {
  return new Response("Unauthorized", { status: 401 });
}

const { data: { user }, error } = await supabase.auth.getUser(token);
if (error || !user) {
  return new Response("Unauthorized", { status: 401 });
}
```

### Security Test Automation

Run weekly:
```bash
# RLS isolation tests
npm run test:rls

# Auth bypass attempts
npm run test:auth-bypass

# Input injection tests
npm run test:injection
```

---

## 5. Acceptance Criteria (Definition of Done)

### Before Merging PR

**Code Quality:**
- [ ] TypeScript compiles with no errors
- [ ] ESLint passes with no warnings
- [ ] No `console.log` in production code
- [ ] No hardcoded secrets or credentials
- [ ] New code has tests (70% coverage minimum)

**Functionality:**
- [ ] Feature works as specified
- [ ] Edge cases handled
- [ ] Error states display correctly
- [ ] Loading states display correctly
- [ ] Mobile responsive (if applicable)

**Security:**
- [ ] No new RLS bypass possible
- [ ] Input validation in place
- [ ] Output sanitized
- [ ] Auth required where needed

**Review:**
- [ ] Code reviewed by at least 1 teammate
- [ ] Self-review completed
- [ ] PR description explains changes

---

### Before Deploying Edge Functions

**Validation:**
- [ ] Input schema defined and validated
- [ ] Output schema defined and validated
- [ ] Auth check implemented
- [ ] Rate limiting configured

**Testing:**
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual smoke test on staging
- [ ] Load test if high-traffic endpoint

**Security:**
- [ ] No secrets in code (use env vars)
- [ ] CORS configured correctly
- [ ] No SQL injection possible
- [ ] Error messages don't leak internals

**Deployment:**
- [ ] Deployed to staging first
- [ ] Tested on staging
- [ ] Rollback plan documented
- [ ] Monitoring alerts configured

---

### Before Releasing to Production

**Testing Complete:**
- [ ] All Gate 0-6 checks pass
- [ ] E2E tests pass on staging
- [ ] Performance acceptable (p95 < 500ms)
- [ ] No critical bugs open

**Security Verified:**
- [ ] RLS tests pass
- [ ] Auth tests pass
- [ ] No security vulnerabilities (npm audit)
- [ ] Secrets rotated if needed

**Deployment Ready:**
- [ ] Database migrations applied
- [ ] Edge functions deployed
- [ ] Feature flags configured
- [ ] Rollback tested

**Observability:**
- [ ] Logging in place
- [ ] Error tracking configured
- [ ] Alerts configured
- [ ] Dashboard updated

**Communication:**
- [ ] Release notes written
- [ ] Team notified
- [ ] On-call aware of release
- [ ] Customer support briefed (if user-facing change)

---

## Quick Reference

### Gate Summary

| Gate | What | When | Blocks If |
|------|------|------|-----------|
| 0 | Pre-commit | Every commit | Lint/type fails |
| 1 | Components | Every PR | Test fails |
| 2 | API contracts | API changes | Type mismatch |
| 3 | RLS | Migration changes | Cross-org access |
| 4 | Edge Functions | Function changes | Auth bypass |
| 5 | AI validation | AI changes | Schema invalid |
| 6 | E2E | Pre-release | Flow broken |
| 7 | Monitoring | Always | Alert threshold |

### Test Commands

```bash
# Run all gates locally
npm run test:gate0    # Lint, types, format
npm run test:gate1    # Component tests
npm run test:gate2    # API contract tests
npm run test:gate3    # RLS tests
npm run test:gate4    # Edge function tests
npm run test:gate5    # AI validation tests
npm run test:gate6    # E2E tests

# Full suite
npm run test:all
```

### When Things Break

| Symptom | Check First |
|---------|-------------|
| 500 errors | Server logs, RLS policies |
| Empty data | Auth token, org_id in JWT |
| Type errors | Generated types out of date |
| AI failures | Schema validation, fallbacks |
| Slow responses | DB indexes, N+1 queries |

---

## Appendix: Test File Organization

```
src/
├── test/
│   ├── setup.ts              # Test environment setup
│   ├── utils/
│   │   ├── test-client.ts    # Supabase test client
│   │   ├── seed-data.ts      # Test data seeders
│   │   └── assertions.ts     # Custom assertions
│   ├── unit/                 # Gate 1: Unit tests
│   ├── integration/          # Gate 2-4: Integration tests
│   │   ├── api/              # API contract tests
│   │   ├── rls/              # RLS isolation tests
│   │   └── edge/             # Edge function tests
│   ├── ai/                   # Gate 5: AI validation tests
│   └── e2e/                  # Gate 6: E2E tests

supabase/
├── tests/
│   ├── rls/                  # SQL-based RLS tests
│   └── functions/            # Edge function tests
```

---

**Last Updated:** January 15, 2026
**Owner:** Engineering Team
**Review Cycle:** Monthly
