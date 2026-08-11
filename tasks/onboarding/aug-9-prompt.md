# IPI-989 · ONB2-WEB-REQ-001 — Implementation Prompt

## Task
**Make the Onboarding Website Requirement Explicit**

Fix the onboarding contract so the UI matches backend reality. The website URL is currently labeled "optional" but analysis requires it — users hit a dead-end at screen 12 when they skip it.

## Problem

**Current (broken) journey:**
> User reaches screen 4 (Brand Details) → sees "Website (optional)" → skips it → completes screens 5–11 → reaches screen 12 (Analysis) → crawl fails with `needs_website` → sees dead-end message "Add one on Brand Details, then continue again" → must navigate backward to fix.

This is a friction cliff — 8 screens of forward progress wasted on a field presented as optional.

## Fix

1. **Make website required** — remove "(optional)" label, explain why it's needed
2. **Disable Skip for website** — screen 4 Skip currently clears both brandName AND websiteUrl; keep Skip for brandName but not website
3. **Reject empty in validate-url** — empty string currently passes validation
4. **Block Continue with empty/invalid URL** — `ctaDisabled` should return true when website is blank
5. **Remove needs_website dead-end** — analysis screen should not have a path that requires backward navigation

## Real World Change Title
```
fix(onboarding): require website URL in brand details, remove optional labeling and dead-end
```

**Format:** `<type>(<scope>): <concise description>` — matches existing commit style in the repo.

## Skills to Use

| Skill | Purpose |
|-------|---------|
| `task-verifier` | Forensic verification before Done gate |
| `mermaid-diagrams` | User journey diagrams in Linear issue |
| `gen-test` | Vitest unit tests for navigation + validate-url |
| `frontend-design` | Brand color/accessibility compliance |

## Tools / MCPs

- **Playwright MCP** — authenticated onboarding journey, mobile 390px, reduced motion
- **Chrome DevTools MCP** — visual verification of label changes
- **Vitest** — `npx vitest run` for unit tests
- **ESLint** — `npx eslint` for code quality
- **TypeScript** — `npx tsc --noEmit` for type safety

## Implementation Steps

**Efficiency note:** Steps 1 and 2 can be done first and tested together. Steps 3-5 are UI-only changes that can be verified visually. Use parallel Vitest runs (`npx vitest run` with multiple files) and run `tsc --noEmit` + `eslint` in parallel with tests.

### Step 1: Fix `validate-url.ts` — reject empty strings
```ts
// Current: validateUrl("  ") returns null (valid)
// Target: validateUrl("  ") returns "Website URL is required"
```
- Add empty-string check at the top of the function
- Update `validate-url.test.ts` with empty string test cases

### Step 2: Fix `navigation.ts` — block blank URLs
```ts
// Current ctaDisabled for screen 4:
// return answers.websiteUrl.trim() !== "" && validateUrl(answers.websiteUrl) !== null;
// (only blocks malformed, not blank)
//
// Target: block blank + malformed
// return answers.websiteUrl.trim() === "" || validateUrl(answers.websiteUrl) !== null;
```
- Update `ctaDisabled` for case 4
- Update `canSkip` to disable Skip for website field
- Update `navigation.test.ts` assertions

### Step 3: Fix `brand-details-question.tsx` — UI changes
- Remove `(optional)` from the Website label
- Add explanatory text: "Required for crawling your brand online"
- Keep URL echo-back behavior

### Step 4: Fix `onboarding-flow.tsx` — Skip behavior
- `skipCurrentScreen` for screen 4 currently clears both `brandName` and `websiteUrl`
- Change to only clear `brandName` (website stays)
- OR remove Skip entirely for screen 4

### Step 5: Fix `analysis-progress-screen.tsx` — remove dead-end
- Remove `needsWebsite` state and the "Website needed" message
- With the fix above, valid website is guaranteed before reaching analysis

## Verification (Efficiency-First)

Run in parallel where possible:

```bash
# Unit tests (run together)
cd app && npx vitest run src/lib/onboarding/navigation.test.ts src/lib/onboarding/validate-url.test.ts src/components/onboarding/onboarding-flow.test.tsx

# Type check
cd app && npx tsc --noEmit

# Lint
cd app && npx eslint src/lib/onboarding/ src/components/onboarding/
```

Then sequential:
1. Legacy resume: hash `#4`, `#12`, `#13` — verify no regression
2. Authenticated Playwright journey (full 13-screen flow still works)
3. Mobile 390px + reduced motion
4. Browser Back/Forward/hash

## Merge Checklist

- [ ] All unit tests pass
- [ ] Legacy resume preserves behavior
- [ ] No removed marketing screens rendered
- [ ] Analysis remains server-driven
- [ ] Brand DNA approval waits for durable ready
- [ ] TypeScript typecheck passes
- [ ] ESLint passes
- [ ] Playwright journey passes (desktop + mobile)
- [ ] Update Linear issue status
- [ ] Update `tasks/onboarding/aug8-onboarding.md` with completion status
