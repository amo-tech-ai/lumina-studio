---
name: gen-test
description: >
  Generates Vitest unit tests for iPix using @testing-library/react in app/. Use when adding
  tests for React components, hooks, services, or utilities — required by ipix-task-lifecycle
  per-task testing. Do NOT use for Playwright/E2E tests, Supabase RLS Docker tests, edge
  function Deno tests, or legacy root src/ Vitest (retiring) — use the area-specific verify
  scripts instead.
---

## Stack

- **Runner:** Vitest (`cd app && npx vitest run <file>`)
- **DOM:** jsdom (Next.js app config)
- **React:** `@testing-library/react` + `@testing-library/jest-dom`
- **Location:** co-located `*.test.ts` / `*.test.tsx` next to source under `app/src/`

## Pattern

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

describe('ComponentName', () => {
  it('does the thing', async () => {
    render(<ComponentName prop="value" />)
    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument()
  })
})
```

## Rules

- Mock Supabase: `vi.mock('@/lib/supabase/...')` — match existing tests in the area
- Mock edge/Mastra calls at service boundary, not inside components
- Test behaviour (what the user sees), not implementation details
- One `describe` per unit; one `it` per behaviour
- Run after writing: `cd app && npx vitest run src/path/to/file.test.tsx`

## Per-task lifecycle

When implementing a plan task:

1. Add test file path to task `Test` block
2. Write failing test first
3. `cd app && npx vitest run ...` — FAIL then PASS
4. Do not start next task until PASS

See [ipix-task-lifecycle/references/per-task-testing.md](../ipix-task-lifecycle/references/per-task-testing.md).
